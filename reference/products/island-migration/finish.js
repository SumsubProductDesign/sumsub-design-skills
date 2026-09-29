// FINISH — call 2 of 2, a SEPARATE use_figma call. Append:  return JSON.stringify(await finishAndAudit("<pageId from call 1>", "<ref node id or null>"));
const vis = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
const _LS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029, 0x85) + "]", "g");
const clean = o => JSON.parse(JSON.stringify(o).replace(_LS, " "));
const isHeadingBlock = n => /title|heading|header/i.test(n.name) && n.height <= 90;
const unwrapSingle = n => { let c = n; while (c && c.type !== "INSTANCE" && vis(c).length === 1 && "children" in vis(c)[0]) c = vis(c)[0]; return c; };
const fillOf = n => (n && n.fills && n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false) ? n.fills[0].color : null;
const hasStroke = n => !!(n.strokes && n.strokes !== figma.mixed && n.strokes.some(s => s.visible !== false)) && (typeof n.strokeWeight !== "number" || n.strokeWeight > 0);
const isWhite = n => { const c = fillOf(n); return !!c && c.r > 0.97 && c.g > 0.97 && c.b > 0.97; };
const isCard = n => (typeof n.cornerRadius === "number" ? n.cornerRadius : 0) >= 8 && (isWhite(n) || hasStroke(n));
const cardLike = n => isCard(n) || (vis(n).length === 1 && isCard(vis(n)[0]) && Math.abs(vis(n)[0].height - n.height) < 2);
function isCardLayout(n, depth = 0) {
if (cardLike(n) || depth > 4) return false; const k = vis(n); if (!k.length) return false;
if (depth === 0 && isHeadingBlock(k[0])) return false;
let cards = 0;
for (const c of k) { if (cardLike(c)) { cards++; continue; } if (c.height <= 90) continue;
if (c.type === "FRAME" && isCardLayout(c, depth + 1)) { cards += 2; continue; } return false; }
return cards >= 2; }
const isCardStack = n => { const k = vis(n); return k.length >= 2 && !isHeadingBlock(k[0]) && k.filter(cardLike).length >= Math.ceil(k.length / 2); };
function refPlacement(refRoot, name) {
if (!refRoot) return null;
const n = refRoot.findOne(x => x.name === name && x.visible); if (!n) return null;
let q = n.parent; while (q && q.id !== refRoot.id) { if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return "island"; q = q.parent; }
return ("findOne" in n && n.findOne(x => x.type === "INSTANCE" && x.name === "Page / Body / IslandCard")) ? "split" : "bare";
}
const repaint = (n, prop, variable) => { const base = n[prop] && n[prop][0] ? JSON.parse(JSON.stringify(n[prop][0])) : { type: "SOLID", color: { r: 1, g: 1, b: 1 } };
delete base.boundVariables; n[prop] = [figma.variables.setBoundVariableForPaint(base, "color", variable)]; };
async function copyVarsFromRef(refRoot, page, anchors) {
const SEP = " › ", applied = [], skipped = [];
const visFill = n => n.fills && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false;
const visStroke = n => n.strokes && n.strokes.length && n.strokes[0].type === "SOLID" && n.strokes[0].visible !== false;
const collect = root => { const map = new Map(); const walk = (n, path) => { map.set(path, n); if (!("children" in n)) return; const cnt = {};
for (const k of n.children) { if (k.visible === false) continue; cnt[k.name] = (cnt[k.name] || 0) + 1; walk(k, path + SEP + k.name + (cnt[k.name] > 1 ? "#" + cnt[k.name] : "")); } };
walk(root, "·"); return map; };
for (const a of anchors) {
const R = refRoot.findAll(n => n.name === a && n.visible), B = page.findAll(n => n.name === a && n.visible);
for (let i = 0; i < Math.min(R.length, B.length); i++) { let mr, mb; try { mr = collect(R[i]); mb = collect(B[i]); } catch (e) { skipped.push(a + ": walk failed " + e.message); continue; }
for (const [path, rn] of mr) { const bn = mb.get(path); if (!bn) continue;
if (a === "Page / Body / IslandCard" && (path === "·" || path === "·" + SEP + "Slot")) continue;       // published internals win
try { const rs = rn.layoutSizingHorizontal, bs = bn.layoutSizingHorizontal, pa = bn.parent;
const inPanel = !!pa && (pa.type === "SLOT" && (pa.name === "Side content" || (pa.name === "Content" && pa.parent && /Aside/.test(pa.parent.name))));
const room = pa && typeof pa.width === "number" ? pa.width - (pa.paddingLeft || 0) - (pa.paddingRight || 0) : Infinity;
if (rs === "FIXED" && (inPanel || rn.width > room + 1)) { if (bs !== "FILL") { try { bn.layoutSizingHorizontal = "FILL"; applied.push(a + path + " width → FILL (reference width " + Math.round(rn.width) + " doesn't fit " + Math.round(room) + ")"); } catch (e) {} } }
else {
if (rs && bs && rs !== bs) { bn.layoutSizingHorizontal = rs; applied.push(a + path + " width → " + rs); }
if (rs === "FIXED" && Math.abs(rn.width - bn.width) > 1) { bn.resize(rn.width, bn.height); applied.push(a + path + " width " + Math.round(rn.width)); } }
} catch (e) {}
for (const prop of ["fills", "strokes"]) { try {
const rVis = prop === "fills" ? visFill(rn) : visStroke(rn), bVis = prop === "fills" ? visFill(bn) : visStroke(bn);
const rb = rn.boundVariables && rn.boundVariables[prop] && rn.boundVariables[prop][0], bb = bn.boundVariables && bn.boundVariables[prop] && bn.boundVariables[prop][0];
if (rVis && rb && (!bVis || !bb || bb.id !== rb.id)) { let v = await figma.variables.getVariableByIdAsync(rb.id);
if (v && v.remote && v.key) { try { v = await figma.variables.importVariableByKeyAsync(v.key); } catch (e) {} }   // consumer file: bind by key
if (!v) { skipped.push(a + path + " " + prop + ": variable not found"); continue; }
const base = JSON.parse(JSON.stringify(rn[prop][0])); delete base.boundVariables; bn[prop] = [figma.variables.setBoundVariableForPaint(base, "color", v)];
applied.push(a + path + " " + prop + " → " + v.name); }
else if (!rVis && bVis && prop === "fills") { bn.fills = []; applied.push(a + path + " fills → none"); }
} catch (e) { skipped.push(a + path + " " + prop + ": " + e.message); } } } } }
return { applied, skipped };
}
async function applyIslandTokens(page) {
const K = { cardFill: "da81bccfef06f3de221bafbb9b5ee6a161eb9000", border: "40baade65c87f4b56fd67b027ec695d0984fae39", row: "b651c3b1b3a1d5b4066af62493435b81f3635acb" };
const v = {}; for (const [k, key] of Object.entries(K)) v[k] = await figma.variables.importVariableByKeyAsync(key);
const log = [];
const ms = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
for (const k of (ms ? ms.children : [])) { if (!k.visible || k.name === "Page / Body / IslandCard" || !isCard(k)) continue;
try { if (isWhite(k)) repaint(k, "fills", v.cardFill); if (hasStroke(k)) repaint(k, "strokes", v.border); log.push("card " + k.name); } catch (e) { log.push("card " + k.name + ": " + e.message); } }
const sideSlots = page.findAll(n => n.type === "SLOT" && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
for (const s of sideSlots) for (const k of s.children) { try { if (hasStroke(k)) repaint(k, "strokes", v.border);
const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c)) : null; if (top) repaint(top, "strokes", v.border); log.push("side " + k.name); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
for (const ic of page.findAll(n => n.type === "INSTANCE" && n.name === "Page / Body / IslandCard")) { const sl = ic.findOne(n => n.type === "SLOT"); if (!sl) continue;
for (const k of sl.children) { try { if (k.type === "FRAME" && fillOf(k) && k.findOne(x => /table/i.test(x.name))) { k.fills = []; log.push("table wrapper " + k.name + " → no fill"); } } catch (e) {} }
for (const r of sl.findAll(n => /(^|\/ )(Table )?Row(#\d+)?$/i.test(n.name) && isWhite(n))) { try { repaint(r, "fills", v.row); } catch (e) {} } }
return log;
}
async function finishIsland(page, refId) {
if (refId) { const ref = await figma.getNodeByIdAsync(refId);
if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
const content = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const anchors = [...new Set(content.flatMap(s => s.children).filter(n => n.name !== "Page / Body / IslandCard").map(n => n.name))].concat(["Page / Body / IslandCard"]);
return { from: "reference " + refId, ...(await copyVarsFromRef(ref, page, anchors)) }; } }
return { from: "§6.1 defaults", applied: await applyIslandTokens(page), skipped: [] };
}
function stretchToWidth(page, withRef) {
const log = [];
for (const g of page.findAll(n => n.type === "FRAME" && n.layoutMode === "GRID" && n.visible)) {
if (!withRef) for (const k of g.children.filter(c => c.visible)) { try { if (k.layoutSizingHorizontal !== "FILL") k.layoutSizingHorizontal = "FILL"; if (k.gridChildHorizontalAlign === "MIN") k.gridChildHorizontalAlign = "AUTO"; } catch (e) {} }
const cols = g.gridColumnCount || 1, kids = g.children.filter(c => c.visible).slice(0, cols);
const rowW = kids.reduce((s, k) => s + k.width, 0) + (kids.length - 1) * (g.gridColumnGap || 0);
if (kids.length === cols && Math.abs(rowW - g.width) > 2) log.push(g.name + ": row " + Math.round(rowW) + " of " + Math.round(g.width));
}
if (!withRef) for (const n of page.findAll(x => x.visible && x.layoutSizingHorizontal === "FIXED" && cardLike(x) && x.parent && x.parent.layoutMode === "VERTICAL")) {
const pr = n.parent, inner = pr.width - (pr.paddingLeft || 0) - (pr.paddingRight || 0); if (inner - n.width > 4) { try { n.layoutSizingHorizontal = "FILL"; } catch (e) {} } }
return log;
}
function narrowFills(page) {
const out = [];
for (const n of page.findAll(x => x.visible && (x.layoutSizingHorizontal === "FILL" || cardLike(x)) && x.parent && x.parent.layoutMode === "VERTICAL" && x.parent.layoutSizingHorizontal !== "HUG")) {
const p = n.parent, inner = p.width - (p.paddingLeft || 0) - (p.paddingRight || 0);
if (inner - n.width > 4) out.push(n.name + " " + Math.round(n.width) + "/" + Math.round(inner)); if (out.length > 8) break; }
return out;
}
function fitSideColumns(page) {
const fit = [], inside = [];
const rendered = (n, stop) => { let q = n; while (q && q.id !== stop.id) { if (q.visible === false) return false; q = q.parent; } return true; };
for (const s of page.findAll(n => n.type === "SLOT" && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))))) {
const inner = s.width - (s.paddingLeft || 0) - (s.paddingRight || 0);
for (const k of s.children.filter(c => c.visible)) {
if (k.width - inner > 1) { const w0 = Math.round(k.width);
try { k.layoutSizingHorizontal = "FILL"; fit.push(k.name + " " + w0 + " → " + Math.round(k.width)); } catch (e) { fit.push(k.name + " " + w0 + " > " + Math.round(inner) + ": " + e.message); } }
const kb = k.absoluteBoundingBox; if (!kb || !("findAll" in k)) continue;
for (const d of k.findAll(x => x.visible && !!x.absoluteBoundingBox)) { const b = d.absoluteBoundingBox;
if (b.x + b.width > kb.x + kb.width + 1 && rendered(d, k)) { inside.push(k.name + " › " + d.name + " " + Math.round(b.width)); if (inside.length > 6) break; } }
}
}
return { fit, inside };
}
function fitSection(page) {
const s = page.parent; if (!s || s.type !== "SECTION") return null;
let r = 0, b = 0; for (const c of s.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
const w = Math.max(s.width, r + 80), h = Math.max(s.height, b + 80);
if (w > s.width + 0.5 || h > s.height + 0.5) { s.resizeWithoutConstraints(w, h); return Math.round(w) + "×" + Math.round(h); }
return null;
}
async function finishAndAudit(pageId, refId) {
const page = await figma.getNodeByIdAsync(pageId); let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
let fin;
try { fin = await finishIsland(page, refId); } catch (e) { fin = { from: "error", applied: [], skipped: [e.message] }; }
const gridIssues = stretchToWidth(page, !!refId);
const side = fitSideColumns(page);
const pb = page.absoluteTransform[1][2];
const slots = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const bottom = Math.max(0, ...slots.flatMap(s => s.children.filter(k => k.visible && k.layoutSizingVertical !== "FILL").map(k => k.absoluteTransform[1][2] - pb + k.height)));
if (bottom + 20 > page.height) { try { page.resize(page.width, Math.ceil(bottom + 28)); } catch (e) {} }
let sectionFit = null; try { sectionFit = fitSection(page); } catch (e) { sectionFit = "error: " + e.message; }
const ms2 = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
const refRoot = refId ? await figma.getNodeByIdAsync(refId) : null;
const notIsland = ms2 ? ms2.children.filter(k => k.visible && k.name !== "Page / Body / IslandCard" && !cardLike(k) && !isCardLayout(k) && !["bare", "split"].includes(refPlacement(refRoot, k.name))).map(k => k.name) : ["no main slot"];
const overflow = slots.map(s => { const sb = s.absoluteBoundingBox; const o = s.children.filter(k => k.visible && k.absoluteBoundingBox &&
(k.absoluteBoundingBox.x + k.absoluteBoundingBox.width > sb.x + sb.width + 1)).map(k => k.name); return o.length ? s.name + ": " + o.join(", ") : null; }).filter(Boolean);
const items = ms2 ? ms2.children.filter(k => k.visible).map(k => k.name === "Page / Body / IslandCard" ? "ISL[" + ((k.findOne(n => n.type === "SLOT") || { children: [] }).children.map(q => q.name.slice(0, 24)).join(" + ")) + "]" : "bare:" + k.name.slice(0, 26)) : [];
return clean({ pageId, size: Math.round(page.width) + "×" + Math.round(page.height), main: items, notIsland, overflow, gridIssues, sideFit: side.fit, sideOverflow: side.inside, narrowFills: narrowFills(page), sectionFit, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) } });
}