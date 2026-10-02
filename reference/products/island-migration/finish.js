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
  const { resolve, prefetch } = await varResolver();
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
const pairsOf = (rRoot, bRoot) => { const out = []; const walk = (r, b, path, style) => { const ov = otherVariant(r, b); const e = [path, r, b, ov, style ? (style === "paint" ? "paint" : "style") : "full"]; out.push(e); if (ov) return;
  let kids = matchKids(kidsOf(r), kidsOf(b)); if (!kids) { const r1 = kidsOf(r); if (r1.length === 1 && r1[0].type === "FRAME" && kidsOf(b).length > 1) kids = matchKids(kidsOf(r1[0]), kidsOf(b)); if (!kids) { const b1 = kidsOf(b); if (r1.length === 1 && b1.length === 1 && r1[0].type === "FRAME" && b1[0].type === "FRAME") kids = [[r1[0], b1[0]]]; } }   // v3.231: one wrapper each side, names differ (Verify your VASP: ref `Content` ↔ our `.Content`)   // v3.230: the reference wraps the blocks in one extra frame (TM Settings / Create a VASP: IslandCard › Slot › Content › blocks) — pair through it
  if (!kids) { if (!style) e[4] = "restructured"; const rk = kidsOf(r), bk = kidsOf(b), once = (l, nm) => l.filter(x => x.name === nm).length === 1; for (const m of bk) if (once(bk, m.name) && once(rk, m.name)) walk(rk.find(x => x.name === m.name), m, path + SEP + m.name, "paint"); return; }
  const deep = !style && !kids.some(([x, y]) => runSig(x) !== runSig(y)); if (!style && !deep) e[4] = "stopped";
  const cnt = {}; kids.forEach(([k, m]) => { cnt[m.name] = (cnt[m.name] || 0) + 1; walk(k, m, path + SEP + m.name + (cnt[m.name] > 1 ? "#" + cnt[m.name] : ""), style === "paint" ? "paint" : !deep); }); };
  walk(rRoot, bRoot, "·", false); return out; };
const bvOf = (n, prop) => n.boundVariables && n.boundVariables[prop] && n.boundVariables[prop][0] ? n.boundVariables[prop][0].id : null;
for (const a of anchors) {
const R = refRoot.findAll(n => n.name === a && n.visible), B = page.findAll(n => n.name === a && n.visible);
for (let i = 0; i < Math.min(R.length, B.length); i++) { let mr; try { mr = pairsOf(R[i], B[i]); } catch (e) { skipped.push(a + ": walk failed " + e.message); continue; }
      await prefetch(paintIds(mr.map(e => e[1])));
for (const [path, rn, bn, ov, mode] of mr) {
let mc = null; if (ov) { try { mc = await rn.getMainComponentAsync(); } catch (e) {} }
if (a === "Page / Body / IslandCard" && (path === "·" || path === "·" + SEP + "Slot")) continue;       // published internals win
if (mode !== "paint" && !(rn.type === "LINE" || rn.type === "VECTOR" || Math.abs(rn.rotation || 0) > 0.5 || Math.abs(bn.rotation || 0) > 0.5)) try { const rs = rn.layoutSizingHorizontal, bs = bn.layoutSizingHorizontal, pa = bn.parent;
const inPanel = !!pa && (pa.type === "SLOT" && (pa.name === "Side content" || (pa.name === "Content" && pa.parent && /Aside/.test(pa.parent.name))));
const room = pa && typeof pa.width === "number" ? pa.width - (pa.paddingLeft || 0) - (pa.paddingRight || 0) : Infinity;
if (rs === "FIXED" && (inPanel || rn.width > room + 1)) { if (bs !== "FILL") { try { bn.layoutSizingHorizontal = "FILL"; applied.push(a + path + " width → FILL (reference width " + Math.round(rn.width) + " doesn't fit " + Math.round(room) + ")"); } catch (e) {} } }
else {
if (rs && bs && rs !== bs) { bn.layoutSizingHorizontal = rs; applied.push(a + path + " width → " + rs); }
if (rs === "FIXED") { const rp = rn.parent, rroom = rp && typeof rp.width === "number" ? rp.width - (rp.paddingLeft || 0) - (rp.paddingRight || 0) : null; const spans = rroom != null && Math.abs(rn.width - rroom) <= 1 && room !== Infinity, target = spans ? room : rn.width; if (Math.abs(target - bn.width) > 1) { const w0 = bn.width; bn.resize(target, bn.height); if (Math.abs(bn.width - w0) > 0.5) applied.push(a + path + " width " + Math.round(target) + (spans ? " (spans its parent, as in the reference)" : "")); } } }
} catch (e) {}
try { if (mode !== "paint" && rn.parent && bn.parent && rn.parent.layoutMode === "GRID" && bn.parent.layoutMode === "GRID") for (const k of ["gridChildHorizontalAlign", "gridChildVerticalAlign"]) {
if (rn[k] && bn[k] && rn[k] !== bn[k] && !(ov && mc && mc[k] === rn[k])) { bn[k] = rn[k]; applied.push(a + path + " " + (k === "gridChildHorizontalAlign" ? "cell align H" : "cell align V") + " → " + rn[k]); } } } catch (e) {}
const gapOnly = mode === "style" && kidsOf(rn).length >= 2 && runSig(rn) === runSig(bn);   // v3.230: a block with exactly the reference's children takes its gaps even in style mode (Create a VASP fields: 24 → 16); never its side paddings
try { if ((gapOnly || (mode !== "style" && mode !== "paint")) && rn.layoutMode && rn.layoutMode !== "NONE" && bn.layoutMode === rn.layoutMode) { const changed = [];
const spKeys = rn.layoutMode === "GRID" ? ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gridRowGap", "gridColumnGap"] : ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"];
const keys = gapOnly ? spKeys.filter(k => !/padding/.test(k)) : mode === "full" ? spKeys : spKeys.filter(k => k === "paddingTop" || k === "paddingBottom" || (mode === "stopped" && !/padding/.test(k)));
for (const k of keys) {
const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k]; if (mode !== "full" && rv === 0 && (bn[k] || 0) > 0 && /^padding/.test(k)) continue;
if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;
let v = null; if (rbv) { try { v = await figma.variables.getVariableByIdAsync(rbv.id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); } catch (e) {} }
try { bn.setBoundVariable(k, null); } catch (e) {}
if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
changed.push((k === "itemSpacing" ? "gap" : k === "gridRowGap" ? "row gap" : k === "gridColumnGap" ? "column gap" : k.replace("padding", "").toLowerCase()) + " " + Math.round(rv)); }
if (changed.length) applied.push(a + path + " spacing → " + changed.join(", ")); } } catch (e) { skipped.push(a + path + " spacing: " + e.message); }
try { if (mode !== "paint" && "topLeftRadius" in rn && "topLeftRadius" in bn) { let changed = false;
for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k]; if (mode !== "full" && rv === 0 && (bn[k] || 0) > 0 && /^padding/.test(k)) continue;
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
if (rVis && rb) { const t = await resolve(rb.id), v0 = t && t.to, v = v0 && /^base\//i.test(v0.name) ? ((await semanticFor(v0.name, bn, prop)) || v0) : v0;   // the reference's paint as its CURRENT variable (see varResolver)
            if (!v) { skipped.push(a + path + " " + prop + ": variable not found"); continue; }
            if (bVis && bb && bb.id === v.id) continue;
            const base = JSON.parse(JSON.stringify(rn[prop][0])); delete base.boundVariables; bn[prop] = [figma.variables.setBoundVariableForPaint(base, "color", v)];
            applied.push(a + path + " " + prop + " → " + v.name); }
else if (!rVis && bVis && prop === "fills") { bn.fills = []; applied.push(a + path + " fills → none"); }
} catch (e) { skipped.push(a + path + " " + prop + ": " + e.message); } } } } }
return { applied, skipped };
}
// v3.230: a bare block can be a wrapper whose one child is the visible card of the same size (TM Settings / Let’s set up: `.Content` › `.Content`) — the island colours go on that card too
const cardTargets = k => (!k.visible || k.name === "Page / Body / IslandCard" || !cardLike(k)) ? [] : [k, ...vis(k).filter(c => c.type !== "INSTANCE" && isCard(c) && Math.abs(c.width - k.width) < 2 && Math.abs(c.height - k.height) < 2)];
async function applyIslandTokens(page) {
const K = { cardFill: "da81bccfef06f3de221bafbb9b5ee6a161eb9000", border: "40baade65c87f4b56fd67b027ec695d0984fae39", row: "b651c3b1b3a1d5b4066af62493435b81f3635acb" };
const v = {}; for (const [k, key] of Object.entries(K)) v[k] = await figma.variables.importVariableByKeyAsync(key);
const log = [];
const ms = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
for (const k0 of (ms ? ms.children : [])) for (const k of cardTargets(k0)) {
try { if (isWhite(k)) repaint(k, "fills", v.cardFill); if (hasStroke(k)) repaint(k, "strokes", v.border); log.push("card " + k.name); } catch (e) { log.push("card " + k.name + ": " + e.message); } }
const sideSlots = page.findAll(n => n.type === "SLOT" && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
for (const s of sideSlots) for (const k of s.children) { try { if (hasStroke(k)) repaint(k, "strokes", v.border);
const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c)) : null; if (top) repaint(top, "strokes", v.border); log.push("side " + k.name); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
for (const ic of page.findAll(n => n.type === "INSTANCE" && n.name === "Page / Body / IslandCard")) { const sl = ic.findOne(n => n.type === "SLOT"); if (!sl) continue;
for (const k of sl.children) { try { if (k.type === "FRAME" && fillOf(k) && k.findOne(x => /table/i.test(x.name))) { k.fills = []; log.push("table wrapper " + k.name + " → no fill"); } } catch (e) {} }
for (const r of sl.findAll(n => /(^|\/ )(Table )?Row(#\d+)?$/i.test(n.name) && isWhite(n))) { try { repaint(r, "fills", v.row); } catch (e) {} } }
return log;
}
async function bareCardTokens(page) {   // §6.1 for cards standing bare on the grey and for side columns — with a reference too (v3.228: the TM Settings reference itself kept the pre-island border/subtle and a raw white)
const v = { cardFill: await figma.variables.importVariableByKeyAsync("da81bccfef06f3de221bafbb9b5ee6a161eb9000"), border: await figma.variables.importVariableByKeyAsync("40baade65c87f4b56fd67b027ec695d0984fae39") };
const log = [], ms = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
for (const k0 of (ms ? ms.children : [])) for (const k of cardTargets(k0)) {
try { const fb = k.fills[0] && k.fills[0].boundVariables && k.fills[0].boundVariables.color, sb = k.strokes && k.strokes[0] && k.strokes[0].boundVariables && k.strokes[0].boundVariables.color;
if (isWhite(k) && !(fb && fb.id === v.cardFill.id)) { repaint(k, "fills", v.cardFill); log.push("card " + k.name + " fill → " + v.cardFill.name); }
if (hasStroke(k) && !(sb && sb.id === v.border.id)) { repaint(k, "strokes", v.border); log.push("card " + k.name + " stroke → " + v.border.name); } } catch (e) { log.push("card " + k.name + ": " + e.message); } }
const sideSlots = page.findAll(n => n.type === "SLOT" && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
for (const s of sideSlots) for (const k of s.children) { try { if (k.type === "INSTANCE") continue; if (hasStroke(k)) repaint(k, "strokes", v.border);
const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c) && c.type !== "INSTANCE") : null; if (top) repaint(top, "strokes", v.border); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
return log; }
async function finishIsland(page, refId) {
if (refId) { const ref = await figma.getNodeByIdAsync(refId);
if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
const content = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const anchors = [...new Set(content.flatMap(s => s.children).filter(n => n.name !== "Page / Body / IslandCard").map(n => n.name))].concat(["Page / Body / IslandCard"]);
const cr = await copyVarsFromRef(ref, page, anchors), bt = await bareCardTokens(page); return { from: "reference " + refId, applied: cr.applied.concat(bt), skipped: cr.skipped }; } }
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
// One resolver for "which variable should this paint be bound to now" — shared by copyVarsFromRef and rebindOrphanVars, so the
// reference's paint is copied as its CURRENT variable: a stale copy of a live library variable → the fresh import (same key), a
// variable of a vanished library → the same-named Base `color` variable. Without it the finish copied the reference's orphan onto
// our node and rebindOrphanVars rebound it straight back on every run (CM managers overview / team: 254 + 210 no-op writes per
// run, and the whole call timed out with a 520).
let _vr = null;
function varResolver() {
  if (_vr) return _vr;
  _vr = (async () => {
    let cols = null; try { cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync(); } catch (e) {}
    const live = cols ? new Set(cols.map(c => c.key)) : null;
    const base = cols ? cols.find(c => /Base components/i.test(c.libraryName) && c.name === "color") : null;
    const byName = new Map(); if (base) for (const v of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(base.key)) byName.set(v.name.toLowerCase(), v.key);
    // everything is cached as a PROMISE, so `prefetch` can resolve a whole batch at once: one importVariableByKeyAsync is ~170 ms
    // (up to ~850), sequentially that was 50–60 imports = tens of seconds per finish; 12 in parallel take ~0.2 s
    const colKey = new Map(), byKey = new Map(), memo = new Map(), miss = new Set();
    const imp = key => { if (!byKey.has(key)) byKey.set(key, figma.variables.importVariableByKeyAsync(key).catch(() => null)); return byKey.get(key); };
    const colOf = vc => { if (!colKey.has(vc)) colKey.set(vc, figma.variables.getVariableCollectionByIdAsync(vc).then(c => c ? c.key : null).catch(() => null)); return colKey.get(vc); };
    const resolve = id => { if (!memo.has(id)) memo.set(id, (async () => {
      const v = await figma.variables.getVariableByIdAsync(id); let out = v ? { to: v, kind: "same", from: v.name } : null;
      if (v && v.remote && v.key) { const ck = await colOf(v.variableCollectionId);
        if (!live || !ck || live.has(ck)) { const fr = await imp(v.key); if (fr && fr.id !== v.id) out = { to: fr, kind: "stale", from: v.name }; }
        else if (base) { const key = byName.get(v.name.toLowerCase()); const b = key ? await imp(key) : null; if (b) out = { to: b, kind: "orphan", from: v.name }; else miss.add(v.name); } }
      return out; })()); return memo.get(id); };
    const prefetch = ids => Promise.all([...new Set(ids.filter(Boolean))].map(resolve));
    return { resolve, prefetch, miss, err: !cols ? "no library access" : !base ? "Base color collection not available" : null };
  })();
  return _vr;
}
const paintIds = nodes => { const out = []; for (const n of nodes) for (const prop of ["fills", "strokes"]) { let ps; try { ps = n[prop]; } catch (e) { continue; } if (Array.isArray(ps)) for (const p of ps) if (p.boundVariables && p.boundVariables.color) out.push(p.boundVariables.color.id); } return out; };
// v3.228: token hygiene on OUR content (slot subtrees, island slots included; never inside other instances):
// base/* paints → the semantic token that aliases them, raw spacing / radius → the token with the same value IN THIS FILE,
// and three must-be-empty lists: rawPaints (unbound or unmapped base paint), rawSpacing (a value a token has, left unbound), sideWhites (a non-card
// white block in a side column). A value no token has in this file (a 2 px gap) is design, not a token slip — tokens.noToken, informational
const BASE_TO_SEMANTIC = {
text: { "base/neutral/100": "1148e20b46c46ade58db9b4120fbf3ea872196fd", "base/neutral/90": "485b897d691c85b86a1ad8ebae7650f3dbcca365", "base/neutral/80": "47f41dc6d16468e6189a8784f58b12d07ebe72c3", "base/neutral/70": "678d3fc239240d7247f43296117c4d35a84592d9", "base/neutral/60": "2c094d8e57056b11ecbb2166364d4648c92d4360", "base/neutral/0": "cc87e4556ec61118c805685f92c80b214050bcd9" },
bg: { "base/neutral/0": "567811a0cf497ac911288a2f4a75a1d89ebff75c", "base/neutral/5": "e50636958c4d5a6917b4fb1e32a7de92ded72f85", "base/neutral/10": "e7129860062f42ee2a929d1b4ccacd21133a03ee", "base/neutral/20": "1aed8505fcfaec5aacd4ac43b4eb62d8315caa0a" },
border: { "base/neutral/20": "40baade65c87f4b56fd67b027ec695d0984fae39", "base/neutral/30": "806f4dce0b78f55df4ab1d126160091d6dd67fd2", "base/neutral/40": "3ac6f9a55d66cd4435e64ad0fa7287b40da52980", "base/neutral/50": "6618868be488e538a0d5a0002206439e45c3cfbe" } };
const _semCache = new Map();
async function semanticFor(name, node, prop) {
const kind = prop === "strokes" ? "border" : node.type === "TEXT" ? "text" : "bg", key = BASE_TO_SEMANTIC[kind][String(name).toLowerCase()]; if (!key) return null;
if (!_semCache.has(key)) _semCache.set(key, figma.variables.importVariableByKeyAsync(key).catch(() => null)); return _semCache.get(key); }
function oursOf(page) {   // our layers: slot content, down through Page / Body / IslandCard slots, never into another instance
const slots = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const out = []; const walk = (n, side) => { out.push([n, side]); if (n.type === "INSTANCE") { if (n.name === "Page / Body / IslandCard") { const sl = n.findOne(q => q.type === "SLOT"); if (sl) for (const k of sl.children) walk(k, side); } return; }
if ("children" in n) for (const k of n.children) walk(k, side); };
for (const s of slots) for (const k of s.children) walk(k, s.name !== "Main content"); return out; }
const SPACING_KEYS = ["3d3cc3a15da0b893bf326da6053d7a1c37f1d836", "a4dad7f0e560345e844697b529325a2eca2ff23a", "5a8e4573770ee8f921f141c1ab6c96835c3125a0", "de89b1cae49981816929db80a4e795842e7baf77", "2b3382099953af94f32cb6ffe5c7f44c74d5fed7", "7dc2647090da988c17327693bc2224e2308047a2", "fceb37ce155723145d25d273574c665a8d7d30e6", "a2e089548b83ff33c8ee5e914fa24e67b889b38c"];
const RADIUS_KEYS = ["885152d55a536fb853461592cc3eff926e94858d", "311dc09093e9474a8b582c8fb7ccc7a628065a20", "95839af397884cd7f8fadb34a62d4763f88d68dd", "03884e014085a48cf26670632be200a02b5a160c"];
async function tokensByValue(keys, page) { const m = new Map(); const vs = await Promise.all(keys.map(k => figma.variables.importVariableByKeyAsync(k).catch(() => null)));
for (const v of vs) { if (!v) continue; try { const r = v.resolveForConsumer(page); if (typeof r.value === "number" && !m.has(r.value)) m.set(r.value, v); } catch (e) {} } return m; }
async function tokenHygiene(page) {
const ours = oursOf(page), log = [], rawPaints = [], rawSpacing = [], noToken = [], sideWhites = [];
const hx = c => "#" + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const shownIn = n => { let q = n; while (q && q.type !== "SLOT") { if (q.visible === false) return false; q = q.parent; } return true; };
for (const [n] of ours) for (const prop of ["fills", "strokes"]) { let ps; try { ps = n[prop]; } catch (e) { continue; } if (!Array.isArray(ps) || !ps.length) continue;
let changed = false; const next = [];
for (const p of ps) { const b = p.boundVariables && p.boundVariables.color;
if (p.type === "SOLID" && p.visible !== false && !b) { if (n.type !== "INSTANCE" && shownIn(n)) rawPaints.push(n.name + " " + prop + " " + hx(p.color)); next.push(p); continue; }
const v = b ? await figma.variables.getVariableByIdAsync(b.id) : null;
if (v && /^base\//i.test(v.name)) { const sem = await semanticFor(v.name, n, prop);
if (sem) { const c0 = JSON.parse(JSON.stringify(p)); delete c0.boundVariables; next.push(figma.variables.setBoundVariableForPaint(c0, "color", sem)); changed = true; log.push(v.name + " → " + sem.name); continue; }
if (shownIn(n)) rawPaints.push(n.name + " " + prop + " " + v.name + " (no semantic mapping)"); }
next.push(p); }
if (changed) { try { n[prop] = next; } catch (e) {} } }
const sp = await tokensByValue(SPACING_KEYS, page), rd = await tokensByValue(RADIUS_KEYS, page), RAW_OK = [40, 48, 64, 88];
for (const [n] of ours) { if (n.type !== "FRAME") continue;
if (n.layoutMode && n.layoutMode !== "NONE") for (const k of (n.layoutMode === "GRID" ? ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gridRowGap", "gridColumnGap"] : ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"])) {
const val = n[k]; if (typeof val !== "number" || val === 0 || (n.boundVariables && n.boundVariables[k])) continue;
const v = sp.get(val); if (v) { try { n.setBoundVariable(k, v); log.push(n.name + " " + k + " " + val + " → " + v.name); continue; } catch (e) {} }
if (!RAW_OK.includes(val) && shownIn(n)) (v ? rawSpacing : noToken).push(n.name + " " + k + "=" + val); }
for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) { const val = n[k]; if (typeof val !== "number" || val === 0 || (n.boundVariables && n.boundVariables[k])) continue;
const v = rd.get(val); if (v) { try { n.setBoundVariable(k, v); log.push(n.name + " radius " + val + " → " + v.name); continue; } catch (e) {} }
if (shownIn(n)) (v ? rawSpacing : noToken).push(n.name + " " + k + "=" + val); } }
for (const [n, side] of ours) { if (!side || !shownIn(n) || n.width <= 100 || cardLike(n)) continue; if (isWhite(n)) sideWhites.push(n.name + " " + Math.round(n.width)); }
const tally = {}; for (const l of log) { const k = l.replace(/^.*? (padding|item|grid|radius)/, "$1"); tally[k] = (tally[k] || 0) + 1; }
return { fixed: log.length, by: Object.entries(tally).slice(0, 10).map(([k, c]) => k + " ×" + c), rawPaints: rawPaints.slice(0, 10), rawSpacing: rawSpacing.slice(0, 10), noToken: noToken.slice(0, 10), sideWhites: sideWhites.slice(0, 6) }; }
async function rebindOrphanVars(page) {
  const R = await varResolver(); if (R.err) return { rebound: 0, missing: [R.err] };
  const log = [];
  const slots = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
  const ours = oursOf(page).map(e => e[0]); void slots;
    await R.prefetch(paintIds(ours));
  for (const n of ours) for (const prop of ["fills", "strokes"]) { let paints; try { paints = n[prop]; } catch (e) { continue; } if (!Array.isArray(paints) || !paints.length) continue;
    let changed = false; const next = [];
    for (const p of paints) { const b = p.boundVariables && p.boundVariables.color; const t = b ? await R.resolve(b.id) : null;
      if (!t || t.kind === "same") { next.push(p); continue; } const base0 = JSON.parse(JSON.stringify(p)); delete base0.boundVariables; next.push(figma.variables.setBoundVariableForPaint(base0, "color", t.to)); changed = true; log.push(t.from + (t.kind === "stale" ? " (stale copy)" : "") + " → " + t.to.name); }
    if (changed) { try { n[prop] = next; } catch (e) {} } }
  const tally = {}; for (const l of log) tally[l] = (tally[l] || 0) + 1;
  return { rebound: log.length, by: Object.entries(tally).slice(0, 12).map(([k, c]) => k + " ×" + c), missing: [...R.miss].slice(0, 6) };
}
// part: omit = everything in one call. On a big page (CM managers overview / team: ~790 reference pairs, ~13 s just to walk them)
// the single call outruns the MCP connection ("connection lost" / 520) — then call it twice: part "copy" (copy from the
// reference), then part "audit" (rebind colours + fixes + audit). Both are idempotent, so a dropped call is safe to repeat.
async function finishAndAudit(pageId, refId, part) {
const page = await figma.getNodeByIdAsync(pageId); let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();   // no setCurrentPageAsync: the finish creates no nodes, and switching re-renders the whole page in the app (~16 s on the big test page)
let fin = { from: "skipped (part audit)", applied: [], skipped: [] };
if (part !== "audit") { try { fin = await finishIsland(page, refId); } catch (e) { fin = { from: "error", applied: [], skipped: [e.message] }; } }
if (part === "copy") return clean({ pageId, part, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, next: "call again with part \"audit\"" });
let orphans; try { orphans = await rebindOrphanVars(page); } catch (e) { orphans = { rebound: 0, missing: ["error: " + e.message] }; }
let hyg; try { hyg = await tokenHygiene(page); } catch (e) { hyg = { fixed: 0, rawPaints: ["error: " + e.message], rawSpacing: [], sideWhites: [] }; }
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
return clean({ pageId, size: Math.round(page.width) + "×" + Math.round(page.height), main: items, notIsland, overflow, gridIssues, sideFit: side.fit, sideOverflow: side.inside, narrowFills: narrowFills(page), rawPaints: hyg.rawPaints, rawSpacing: hyg.rawSpacing, sideWhites: hyg.sideWhites, tokens: { fixed: hyg.fixed, by: hyg.by, noToken: hyg.noToken }, sectionFit, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, orphanVars: orphans });
}