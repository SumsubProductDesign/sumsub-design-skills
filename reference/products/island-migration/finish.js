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
const kidsOf = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
const roleOf = nm => /^(Block Title|Body \/ Title|Heading|Title)\b/i.test(nm) ? "⟨heading⟩" : nm;
const runs = list => { const out = []; for (const k of list) { const l = out[out.length - 1], nm = roleOf(k.name); if (l && l.name === nm) l.items.push(k); else out.push({ name: nm, items: [k] }); } return out; };
const runSig = n => runs(kidsOf(n)).map(r => r.name).join("|");
const matchKids = (rk, bk) => { const rr = runs(rk), br = runs(bk); if (rr.length !== br.length || rr.some((r, i) => r.name !== br[i].name)) return null;
  const p = []; br.forEach((b, i) => b.items.forEach((k, j) => p.push([rr[i].items[Math.min(j, rr[i].items.length - 1)], k]))); return p; };
const otherVariant = (r, b) => { if (r.type !== "INSTANCE" || b.type !== "INSTANCE") return false;
  try { const rp = r.componentProperties || {}, bp = b.componentProperties || {}; return Object.keys(rp).some(k => rp[k].type === "VARIANT" && bp[k] && bp[k].type === "VARIANT" && rp[k].value !== bp[k].value); } catch (e) { return false; } };
const pairsOf = (rRoot, bRoot) => { const out = []; const walk = (r, b, path, style) => { const ov = otherVariant(r, b); const e = [path, r, b, ov, style ? "style" : "full"]; out.push(e); if (ov) return;
  const kids = matchKids(kidsOf(r), kidsOf(b)); if (!kids) { if (!style) e[4] = "restructured"; return; }
  const deep = !style && !kids.some(([x, y]) => runSig(x) !== runSig(y)); if (!style && !deep) e[4] = "stopped";
  const cnt = {}; kids.forEach(([k, m]) => { cnt[m.name] = (cnt[m.name] || 0) + 1; walk(k, m, path + SEP + m.name + (cnt[m.name] > 1 ? "#" + cnt[m.name] : ""), !deep); }); };
  walk(rRoot, bRoot, "·", false); return out; };
const bvOf = (n, prop) => n.boundVariables && n.boundVariables[prop] && n.boundVariables[prop][0] ? n.boundVariables[prop][0].id : null;
for (const a of anchors) {
const R = refRoot.findAll(n => n.name === a && n.visible), B = page.findAll(n => n.name === a && n.visible);
for (let i = 0; i < Math.min(R.length, B.length); i++) { let mr; try { mr = pairsOf(R[i], B[i]); } catch (e) { skipped.push(a + ": walk failed " + e.message); continue; }
for (const [path, rn, bn, ov, mode] of mr) {
let mc = null; if (ov) { try { mc = await rn.getMainComponentAsync(); } catch (e) {} }
if (a === "Page / Body / IslandCard" && (path === "·" || path === "·" + SEP + "Slot")) continue;       // published internals win
if (!(rn.type === "LINE" || rn.type === "VECTOR" || Math.abs(rn.rotation || 0) > 0.5 || Math.abs(bn.rotation || 0) > 0.5)) try { const rs = rn.layoutSizingHorizontal, bs = bn.layoutSizingHorizontal, pa = bn.parent;
const inPanel = !!pa && (pa.type === "SLOT" && (pa.name === "Side content" || (pa.name === "Content" && pa.parent && /Aside/.test(pa.parent.name))));
const room = pa && typeof pa.width === "number" ? pa.width - (pa.paddingLeft || 0) - (pa.paddingRight || 0) : Infinity;
if (rs === "FIXED" && (inPanel || rn.width > room + 1)) { if (bs !== "FILL") { try { bn.layoutSizingHorizontal = "FILL"; applied.push(a + path + " width → FILL (reference width " + Math.round(rn.width) + " doesn't fit " + Math.round(room) + ")"); } catch (e) {} } }
else {
if (rs && bs && rs !== bs) { bn.layoutSizingHorizontal = rs; applied.push(a + path + " width → " + rs); }
if (rs === "FIXED") { const rp = rn.parent, rroom = rp && typeof rp.width === "number" ? rp.width - (rp.paddingLeft || 0) - (rp.paddingRight || 0) : null; const spans = rroom != null && Math.abs(rn.width - rroom) <= 1 && room !== Infinity, target = spans ? room : rn.width; if (Math.abs(target - bn.width) > 1) { const w0 = bn.width; bn.resize(target, bn.height); if (Math.abs(bn.width - w0) > 0.5) applied.push(a + path + " width " + Math.round(target) + (spans ? " (spans its parent, as in the reference)" : "")); } } }
} catch (e) {}
try { if (rn.parent && bn.parent && rn.parent.layoutMode === "GRID" && bn.parent.layoutMode === "GRID") for (const k of ["gridChildHorizontalAlign", "gridChildVerticalAlign"]) {
if (rn[k] && bn[k] && rn[k] !== bn[k] && !(ov && mc && mc[k] === rn[k])) { bn[k] = rn[k]; applied.push(a + path + " " + (k === "gridChildHorizontalAlign" ? "cell align H" : "cell align V") + " → " + rn[k]); } } } catch (e) {}
try { if (mode !== "style" && rn.layoutMode && rn.layoutMode !== "NONE" && bn.layoutMode === rn.layoutMode) { const changed = [];
const spKeys = rn.layoutMode === "GRID" ? ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gridRowGap", "gridColumnGap"] : ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"];
const keys = mode === "full" ? spKeys : spKeys.filter(k => k === "paddingTop" || k === "paddingBottom" || (mode === "stopped" && !/padding/.test(k)));
for (const k of keys) {
const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k];
if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;
let v = null; if (rbv) { try { v = await figma.variables.getVariableByIdAsync(rbv.id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); } catch (e) {} }
try { bn.setBoundVariable(k, null); } catch (e) {}
if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
changed.push((k === "itemSpacing" ? "gap" : k === "gridRowGap" ? "row gap" : k === "gridColumnGap" ? "column gap" : k.replace("padding", "").toLowerCase()) + " " + Math.round(rv)); }
if (changed.length) applied.push(a + path + " spacing → " + changed.join(", ")); } } catch (e) { skipped.push(a + path + " spacing: " + e.message); }
try { if ("topLeftRadius" in rn && "topLeftRadius" in bn) { let changed = false;
for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k];
if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;
let v = null; if (rbv) { try { v = await figma.variables.getVariableByIdAsync(rbv.id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); } catch (e) {} }
try { bn.setBoundVariable(k, null); } catch (e) {}
if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
changed = true; }
if (changed) applied.push(a + path + " radius → " + Math.round(rn.topLeftRadius || 0)); } } catch (e) { skipped.push(a + path + " radius: " + e.message); }
for (const prop of ["fills", "strokes"]) { try {
const rVis = prop === "fills" ? visFill(rn) : visStroke(rn), bVis = prop === "fills" ? visFill(bn) : visStroke(bn);
if (ov && (!mc || (rVis === (prop === "fills" ? visFill(mc) : visStroke(mc)) && bvOf(rn, prop) === bvOf(mc, prop)))) continue;
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
for (const n of page.findAll(x => x.visible && (x.layoutSizingHorizontal === "FILL" || (cardLike(x) && x.layoutSizingHorizontal !== "HUG")) && x.parent && x.parent.layoutMode === "VERTICAL" && x.parent.layoutSizingHorizontal !== "HUG")) {
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
async function rebindOrphanVars(page) {
const log = [], miss = new Set();
let cols = []; try { cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync(); } catch (e) { return { rebound: 0, missing: ["no library access: " + e.message] }; }
const live = new Set(cols.map(c => c.key));
const base = cols.find(c => /Base components/i.test(c.libraryName) && c.name === "color"); if (!base) return { rebound: 0, missing: ["Base color collection not available"] };
const byName = new Map(); for (const v of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(base.key)) byName.set(v.name.toLowerCase(), v.key);
const colKey = new Map(), imported = new Map();
const orphanTarget = async id => { const v = await figma.variables.getVariableByIdAsync(id); if (!v || !v.remote) return null;
if (!colKey.has(v.variableCollectionId)) { let k = null; try { const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId); k = c ? c.key : null; } catch (e) {} colKey.set(v.variableCollectionId, k); }
const ck = colKey.get(v.variableCollectionId); if (!ck || live.has(ck)) return null;
const key = byName.get(v.name.toLowerCase()); if (!key) { miss.add(v.name); return null; }
if (!imported.has(key)) imported.set(key, await figma.variables.importVariableByKeyAsync(key)); return { from: v.name, to: imported.get(key) }; };
const slots = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const ours = []; const walk = n => { ours.push(n); if (n.type === "INSTANCE" || !("children" in n)) return; for (const k of n.children) walk(k); };
for (const s of slots) for (const k of s.children) walk(k);
for (const n of ours) for (const prop of ["fills", "strokes"]) { let paints; try { paints = n[prop]; } catch (e) { continue; } if (!Array.isArray(paints) || !paints.length) continue;
let changed = false; const next = [];
for (const p of paints) { const b = p.boundVariables && p.boundVariables.color; const t = b ? await orphanTarget(b.id) : null;
if (!t || !t.to) { next.push(p); continue; } const base0 = JSON.parse(JSON.stringify(p)); delete base0.boundVariables; next.push(figma.variables.setBoundVariableForPaint(base0, "color", t.to)); changed = true; log.push(t.from + " → " + t.to.name); }
if (changed) { try { n[prop] = next; } catch (e) {} } }
const tally = {}; for (const l of log) tally[l] = (tally[l] || 0) + 1;
return { rebound: log.length, by: Object.entries(tally).slice(0, 12).map(([k, c]) => k + " ×" + c), missing: [...miss].slice(0, 6) };
}

async function finishAndAudit(pageId, refId) {
const page = await figma.getNodeByIdAsync(pageId); let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
let fin;
try { fin = await finishIsland(page, refId); } catch (e) { fin = { from: "error", applied: [], skipped: [e.message] }; }
let orphans; try { orphans = await rebindOrphanVars(page); } catch (e) { orphans = { rebound: 0, missing: ["error: " + e.message] }; }
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
return clean({ pageId, size: Math.round(page.width) + "×" + Math.round(page.height), main: items, notIsland, overflow, gridIssues, sideFit: side.fit, sideOverflow: side.inside, narrowFills: narrowFills(page), sectionFit, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, orphanVars: orphans });
}