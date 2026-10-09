// FINISH — call 2 of 2, a SEPARATE use_figma call. Append:  return JSON.stringify(await finishAndAudit("<pageId from call 1>", "<ref node id or null>"));
const ICN = "Page / Body / IslandCard", isS = n => n.type === "SLOT", byId = id => figma.getNodeByIdAsync(id), isI = n => n.type === "INSTANCE", sBP = (p, f, v) => figma.variables.setBoundVariableForPaint(p, f, v), imV = k => figma.variables.importVariableByKeyAsync(k), gV = i => figma.variables.getVariableByIdAsync(i), isB = n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))), isSd = n => isB(n) && n.name !== "Main content", PD = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];
const vis = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
const _LS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029, 0x85) + "]", "g");
const clean = o => JSON.parse(JSON.stringify(o).replace(_LS, " "));
const isHeadingBlock = n => /title|heading|header/i.test(n.name) && n.height <= 90;
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
const isGraphic = n => /^(RECTANGLE|ELLIPSE|VECTOR|LINE|POLYGON|STAR|BOOLEAN_OPERATION)$/.test(n.type);
function refPlacement(refRoot, name) {
if (!refRoot) return null;
const n = refRoot.findOne(x => x.name === name && x.visible); if (!n) return null;
let q = n.parent; while (q && q.id !== refRoot.id) { if (isI(q) && q.name === ICN) return "island"; q = q.parent; }
return ("findOne" in n && n.findOne(x => isI(x) && x.name === ICN)) ? "split" : "bare";
}
const repaint = (n, prop, variable) => { const base = n[prop] && n[prop][0] ? JSON.parse(JSON.stringify(n[prop][0])) : { type: "SOLID", color: { r: 1, g: 1, b: 1 } };
delete base.boundVariables; n[prop] = [sBP(base, "color", variable)]; };
async function copyVarsFromRef(refRoot, page, anchors) {
const SEP = " › ", applied = [], skipped = [];
const { resolve, prefetch } = await varResolver();
const visFill = n => n.fills && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false;
const visStroke = n => n.strokes && n.strokes.length && n.strokes[0].type === "SOLID" && n.strokes[0].visible !== false;
const kidsOf = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
const roleOf = nm => /^(Block Title|Body \/ Title|Heading|Title|Header)\b/i.test(nm) ? "⟨heading⟩" : nm;
const runs = list => { const out = []; for (const k of list) { const l = out[out.length - 1], nm = roleOf(k.name); if (l && l.name === nm) l.items.push(k); else out.push({ name: nm, items: [k] }); } return out; };
const runSig = n => runs(kidsOf(n)).map(r => r.name).join("|");
const matchKids = (rk, bk) => { const rr = runs(rk), br = runs(bk); if (rr.length !== br.length || rr.some((r, i) => r.name !== br[i].name)) return null;
const p = []; br.forEach((b, i) => b.items.forEach((k, j) => p.push([rr[i].items[Math.min(j, rr[i].items.length - 1)], k]))); return p; };
const otherVariant = (r, b) => { if (r.type !== "INSTANCE" || b.type !== "INSTANCE") return false;
try { const rp = r.componentProperties || {}, bp = b.componentProperties || {}; return Object.keys(rp).some(k => rp[k].type === "VARIANT" && bp[k] && bp[k].type === "VARIANT" && rp[k].value !== bp[k].value); } catch { return false; } };
const pairsOf = (rRoot, bRoot) => { const out = []; const walk = (r, b, path, style) => { const ov = otherVariant(r, b); const e = [path, r, b, ov, style ? (style === "paint" ? "paint" : "style") : "full"]; out.push(e); if (ov) return;
let kids = matchKids(kidsOf(r), kidsOf(b)); if (!kids) { const r1 = kidsOf(r); if (r1.length === 1 && r1[0].type === "FRAME" && kidsOf(b).length > 1) kids = matchKids(kidsOf(r1[0]), kidsOf(b)); if (!kids) { const b1 = kidsOf(b); if (r1.length === 1 && b1.length === 1 && r1[0].type === "FRAME" && b1[0].type === "FRAME") kids = [[r1[0], b1[0]]]; } if (!kids && kidsOf(b).length > 1) { const w = kidsOf(r).find(x => x.type === "FRAME" && matchKids(kidsOf(x), kidsOf(b))); if (w) { kids = matchKids(kidsOf(w), kidsOf(b)); e[1] = w; } } }
if (!kids) { let bw = b; for (let d = 0; d < 2 && !kids; d++) { const b1 = kidsOf(bw); if (b1.length !== 1 || b1[0].type !== "FRAME" || kidsOf(r).length < 2) break; bw = b1[0]; kids = matchKids(kidsOf(r), kidsOf(bw)); } if (kids) { if (isI(b) || isCard(b)) { if (!style) out.push([path + SEP + bw.name, r, bw, false, "gaps"]); } else e[2] = bw; } }
if (!kids) { if (!style) e[4] = "restructured"; const rk = kidsOf(r), bk = kidsOf(b), once = (l, nm) => l.filter(x => x.name === nm).length === 1; for (const m of bk) if (once(bk, m.name) && once(rk, m.name)) walk(rk.find(x => x.name === m.name), m, path + SEP + m.name, "paint");
if (path === "·" && rk.length === bk.length) bk.forEach((m, i) => { const x = rk[i]; if (x.name !== m.name && !rk.some(y => y.name === m.name) && !bk.some(y => y.name === x.name) && x.type === m.type && cardLike(x) === cardLike(m)) walk(x, m, path + SEP + m.name, "paint"); }); return; }
const deep = !style && !kids.some(([x, y]) => runSig(x) !== runSig(y) && !(isI(x) && isI(y))); if (!style && !deep) e[4] = "stopped";
const cnt = {}; kids.forEach(([k, m]) => { cnt[m.name] = (cnt[m.name] || 0) + 1; walk(k, m, path + SEP + m.name + (cnt[m.name] > 1 ? "#" + cnt[m.name] : ""), style === "paint" ? "paint" : !deep); }); };
walk(rRoot, bRoot, "·", false); return out; };
const bodySlots = root => root.findAll(isB);
const inChrome = n => { for (let p = n.parent; p && p.type !== "PAGE"; p = p.parent) if (isI(p) && /^\*(Sidebar|Header)\*$/.test(p.name)) return true; return false; };
const inBody = (root, a) => { const sl = bodySlots(root), seen = new Set(); return (sl.length ? sl : [root]).flatMap(s => s.findAll(n => n.name === a && n.visible && !inChrome(n))).filter(n => !seen.has(n.id) && seen.add(n.id)); };
const vOf = async id => { try { let v = await gV(id); return v && v.remote && v.key ? await imV(v.key) : v; } catch { return null; } };
const bvOf = (n, prop) => n.boundVariables?.[prop] && n.boundVariables[prop][0] ? n.boundVariables[prop][0].id : null;
const runAnchor = async a => { let gone = 0;
const R = inBody(refRoot, a), B = inBody(page, a);
for (let i = 0; i < Math.min(R.length, B.length); i++) { let mr; try { mr = pairsOf(R[i], B[i]); } catch (e) { skipped.push(a + ": walk failed " + e.message); continue; }
await prefetch(paintIds(mr.map(e => e[1])));
for (const [path, rn, bn, ov, mode] of mr) { const ap = t => applied.push(a + path + " " + t), sk = t => skipped.push(a + path + " " + t); try {
let mc = null; if (ov) { try { mc = await rn.getMainComponentAsync(); } catch {} }
if (a === ICN && (path === "·" || (path === "·" + SEP + "Slot" && bn.type === "SLOT"))) continue;
if (mode !== "paint" && mode !== "gaps" && !(rn.type === "LINE" || rn.type === "VECTOR" || Math.abs(rn.rotation || 0) > 0.5 || Math.abs(bn.rotation || 0) > 0.5)) try { const rs = rn.layoutSizingHorizontal, bs = bn.layoutSizingHorizontal, pa = bn.parent;
const inPanel = !!pa && isSd(pa);
const room = pa && typeof pa.width === "number" ? pa.width - (pa.paddingLeft || 0) - (pa.paddingRight || 0) : Infinity;
const rpar = rn.parent, rpRoom = rpar && typeof rpar.width === "number" ? rpar.width - (rpar.paddingLeft || 0) - (rpar.paddingRight || 0) : null, refFits = rpRoom == null || rn.width <= rpRoom + 1;
if (rs === "FIXED" && (inPanel || (rn.width > room + 1 && refFits))) { if (bs !== "FILL") { try { bn.layoutSizingHorizontal = "FILL"; ap("width → FILL (reference width " + Math.round(rn.width) + " doesn't fit " + Math.round(room) + ")"); } catch {} } }
else if (refFits) {
const keepFill = rs === "FIXED" && bs === "FILL" && rpRoom != null && Math.abs(rn.width - rpRoom) <= 1;
if (rs && bs && rs !== bs && !keepFill) { bn.layoutSizingHorizontal = rs; ap("width → " + rs); }
if (rs === "FIXED" && !keepFill) { const rp = rn.parent, rroom = rp && typeof rp.width === "number" ? rp.width - (rp.paddingLeft || 0) - (rp.paddingRight || 0) : null; const spans = rroom != null && Math.abs(rn.width - rroom) <= 1 && room !== Infinity, target = spans ? room : rn.width; if (Math.abs(target - bn.width) > 1) { const w0 = bn.width; bn.resize(target, bn.height); if (Math.abs(bn.width - w0) > 0.5) ap("width " + Math.round(target) + (spans ? " (spans its parent, as in the reference)" : "")); } } }
} catch {}
try { if (mode !== "paint" && mode !== "gaps" && rn.parent && bn.parent && rn.parent.layoutMode === "GRID" && bn.parent.layoutMode === "GRID") for (const k of ["gridChildHorizontalAlign", "gridChildVerticalAlign"]) {
if (rn[k] && bn[k] && rn[k] !== bn[k] && !(ov && mc && mc[k] === rn[k])) { bn[k] = rn[k]; ap("" + (k === "gridChildHorizontalAlign" ? "cell align H" : "cell align V") + " → " + rn[k]); } } } catch {}
const gapOnly = mode === "style" && kidsOf(rn).length >= 2 && runSig(rn) === runSig(bn);
const headPair = mode === "style" && roleOf(rn.name) === "⟨heading⟩" && roleOf(bn.name) === "⟨heading⟩";
try { if ((gapOnly || headPair || (mode !== "style" && mode !== "paint")) && rn.layoutMode && rn.layoutMode !== "NONE" && bn.layoutMode === rn.layoutMode) { const changed = [];
const spKeys = rn.layoutMode === "GRID" ? [...PD, "gridRowGap", "gridColumnGap"] : [...PD, "itemSpacing"];
const rootTop = path === "·" && !!bn.parent && bn.parent.type === "SLOT";
const keys0 = headPair ? spKeys.filter(k => k === "paddingTop" || k === "paddingBottom") : (gapOnly || mode === "gaps") ? spKeys.filter(k => !/padding/.test(k)) : mode === "full" ? spKeys : spKeys.filter(k => k === "paddingTop" || k === "paddingBottom" || (mode === "stopped" && !/padding/.test(k)));
const keys = rootTop ? [...new Set([...keys0, ...PD])] : keys0;
for (const k of keys) {
const rv = rn[k] || 0, rbv = rn.boundVariables?.[k], bbv = bn.boundVariables?.[k]; if (mode !== "full" && !headPair && !rootTop && rv === 0 && (bn[k] || 0) > 0 && /^padding/.test(k)) continue;
if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;
const v = rbv ? await vOf(rbv.id) : null;
try { bn.setBoundVariable(k, null); } catch {}
if (v) { try { bn.setBoundVariable(k, v); } catch { bn[k] = rv; } } else bn[k] = rv;
changed.push((k === "itemSpacing" ? "gap" : k === "gridRowGap" ? "row gap" : k === "gridColumnGap" ? "column gap" : k.replace("padding", "").toLowerCase()) + " " + Math.round(rv)); }
if (changed.length) ap("spacing → " + changed.join(", ")); } } catch (e) { sk("spacing: " + e.message); }
try { if (mode !== "paint" && mode !== "gaps" && "topLeftRadius" in rn && "topLeftRadius" in bn) { let changed = false;
for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
const rv = rn[k] || 0, rbv = rn.boundVariables?.[k], bbv = bn.boundVariables?.[k]; if (mode !== "full" && rv === 0 && (bn[k] || 0) > 0 && /^padding/.test(k)) continue;
if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;
const v = rbv ? await vOf(rbv.id) : null;
try { bn.setBoundVariable(k, null); } catch {}
if (v) { try { bn.setBoundVariable(k, v); } catch { bn[k] = rv; } } else bn[k] = rv;
changed = true; }
if (changed) ap("radius → " + Math.round(rn.topLeftRadius || 0)); } } catch (e) { sk("radius: " + e.message); }
try { if (mode !== "paint" && mode !== "gaps" && !ov) for (const k of ["height", "minHeight", "maxHeight"]) { const rb = rn.boundVariables?.[k], bb = bn.boundVariables?.[k]; if (!rb || (bb && bb.id === rb.id)) continue; const v = await vOf(rb.id); if (v) { bn.setBoundVariable(k, v); ap("" + k + " → " + v.name); } } } catch (e) { sk("height: " + e.message); }
if (mode !== "gaps") for (const prop of ["fills", "strokes"]) { try {
const rVis = prop === "fills" ? visFill(rn) : visStroke(rn), bVis = prop === "fills" ? visFill(bn) : visStroke(bn);
if (ov && (!mc || (rVis === (prop === "fills" ? visFill(mc) : visStroke(mc)) && bvOf(rn, prop) === bvOf(mc, prop)))) continue;
const rb = rn.boundVariables?.[prop] && rn.boundVariables[prop][0], bb = bn.boundVariables?.[prop] && bn.boundVariables[prop][0];
if (rVis && rb) { const t = await resolve(rb.id), v0 = t && t.to, v = v0 && /^base\//i.test(v0.name) ? ((await semanticFor(v0.name, bn, prop)) || v0) : v0;
if (!v) { sk("" + prop + ": variable not found"); continue; }
if (bVis && bb && bb.id === v.id) continue;
const base = JSON.parse(JSON.stringify(rn[prop][0])); delete base.boundVariables; bn[prop] = [sBP(base, "color", v)];
ap("" + prop + " → " + v.name); }
else if (!rVis && bVis) { bn[prop] = []; ap("" + prop + " → none"); }
} catch (e) { sk("" + prop + ": " + e.message); } } } catch { gone++; } } }
return gone; };
let todo = anchors;
for (let pass = 0; pass < 3 && todo.length; pass++) { const next = []; for (const a of todo) if (await runAnchor(a)) next.push(a); todo = next; }
if (todo.length) skipped.push("layers changed under the walk in " + todo.join(", ") + " — run the copy part again");
return { applied, skipped };
}
const cardTargets = k => (!k.visible || k.name === ICN || !cardLike(k)) ? [] : [k, ...vis(k).filter(c => c.type !== "INSTANCE" && isCard(c) && Math.abs(c.width - k.width) < 2 && Math.abs(c.height - k.height) < 2)];
async function applyIslandTokens(page) {
const K = { cardFill: "da81bccfef06f3de221bafbb9b5ee6a161eb9000", border: "40baade65c87f4b56fd67b027ec695d0984fae39", row: "b651c3b1b3a1d5b4066af62493435b81f3635acb" };
const v = {}; for (const [k, key] of Object.entries(K)) v[k] = await imV(key);
const log = [];
const ms = page.findAll(isS).find(s => s.name === "Main content");
for (const k0 of (ms ? ms.children : [])) for (const k of cardTargets(k0)) {
try { if (isWhite(k)) repaint(k, "fills", v.cardFill); if (hasStroke(k) && !(await statusPaint(k, "strokes"))) repaint(k, "strokes", v.border); log.push("card " + k.name); } catch (e) { log.push("card " + k.name + ": " + e.message); } }
const sideSlots = page.findAll(isSd);
for (const s of sideSlots) for (const k of s.children) { try { if (hasStroke(k)) repaint(k, "strokes", v.border);
const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c)) : null; if (top) repaint(top, "strokes", v.border); log.push("side " + k.name); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
for (const ic of page.findAll(n => isI(n) && n.name === ICN)) { const sl = ic.findOne(isS); if (!sl) continue;
for (const k of sl.children) { try { if (k.type === "FRAME" && fillOf(k) && k.findOne(x => /table/i.test(x.name))) { k.fills = []; log.push("table wrapper " + k.name + " → no fill"); } } catch {} }
for (const r of sl.findAll(n => /(^|\/ )(Table )?Row(#\d+)?$/i.test(n.name) && isWhite(n))) { try { repaint(r, "fills", v.row); } catch {} } }
return log;
}
async function bareCardTokens(page) {
const v = { cardFill: await imV("da81bccfef06f3de221bafbb9b5ee6a161eb9000"), border: await imV("40baade65c87f4b56fd67b027ec695d0984fae39") };
const log = [], ms = page.findAll(isS).find(s => s.name === "Main content");
for (const k0 of (ms ? ms.children : [])) for (const k of cardTargets(k0)) {
try { const fb = k.fills[0] && k.fills[0].boundVariables?.color, sb = k.strokes && k.strokes[0] && k.strokes[0].boundVariables?.color;
if (isWhite(k) && !(fb && fb.id === v.cardFill.id)) { repaint(k, "fills", v.cardFill); log.push("card " + k.name + " fill → " + v.cardFill.name); }
if (hasStroke(k) && !(sb && sb.id === v.border.id) && !(await statusPaint(k, "strokes"))) { repaint(k, "strokes", v.border); log.push("card " + k.name + " stroke → " + v.border.name); } } catch (e) { log.push("card " + k.name + ": " + e.message); } }
const sideSlots = page.findAll(isSd);
for (const s of sideSlots) for (const k of s.children) { try { if (isI(k)) continue; if (hasStroke(k)) repaint(k, "strokes", v.border);
const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c) && c.type !== "INSTANCE") : null; if (top) repaint(top, "strokes", v.border); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
{ let rx = null; try { rx = await imV("03884e014085a48cf26670632be200a02b5a160c"); } catch {}
const inIsland = n => { for (let q = n.parent; q && q.id !== page.id; q = q.parent) if (isI(q) && q.name === ICN) return true; return false; };
if (rx && ms) for (const k of ms.findAll(n => n.visible !== false && (n.type === "FRAME" || isI(n)) && n.cornerRadius === 12 && isWhite(n) && hasStroke(n) && !inIsland(n))) {
try { for (const p of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) k.setBoundVariable(p, rx); log.push("card " + k.name + " radius 12 → 16"); } catch {} } }
return log; }
async function regroupLikeReference(refRoot, page) {
const log = []; const names = n => vis(n).map(k => k.name);
const ourSlots = page.findAll(isB);
const refSlots = refRoot.findAll(n => isS(n) && /^(Main content|Side content)$/.test(n.name));
const ours = []; const walk = n => { if (isI(n) || !("children" in n)) return; if (n.type === "FRAME" && n.layoutMode && n.layoutMode !== "NONE" && vis(n).length >= 1) ours.push(n); for (const k of n.children) walk(k); };
for (const s of ourSlots) for (const k of s.children) walk(k);
const refs = refSlots.flatMap(s => s.findAll(n => n.type === "FRAME" && n.layoutMode && n.layoutMode !== "NONE" && vis(n).length >= 2));
const nameCount = {}; for (const n of ours) nameCount[n.name] = (nameCount[n.name] || 0) + 1;
for (const B of ours) { const bn = names(B); if (!B.parent || nameCount[B.name] > 1 || !vis(B).every(k => isI(k)) || refs.some(W => names(W).join("|") === bn.join("|"))) continue;
for (const W of refs) { const wn = names(W); if (wn.length <= bn.length || W.layoutMode !== B.layoutMode) continue;
let i = 0; const extras = []; for (const nm of wn) { if (i < bn.length && nm === bn[i]) i++; else extras.push(nm); }
if (i !== bn.length || !extras.length) continue;
const sibs = vis(B.parent).filter(x => x.id !== B.id); const movers = extras.map(nm => sibs.filter(x => x.name === nm));
if (movers.some(m => m.length !== 1 || m[0].type !== "INSTANCE")) continue;
wn.forEach((nm, idx) => { const m = movers.flat().find(x => x.name === nm); if (m) { try { B.insertChild(Math.min(idx, B.children.length), m); } catch {} } });
const rbv = W.boundVariables?.itemSpacing; let v = null;
if (rbv) { try { v = await gV(rbv.id); if (v && v.remote && v.key) v = await imV(v.key); } catch {} }
try { B.setBoundVariable("itemSpacing", null); } catch {} if (v) { try { B.setBoundVariable("itemSpacing", v); } catch { B.itemSpacing = W.itemSpacing; } } else B.itemSpacing = W.itemSpacing;
const wk = vis(W), bk = vis(B); bk.forEach((k, j) => { try { if (wk[j] && wk[j].layoutSizingHorizontal === "FILL" && k.layoutSizingHorizontal !== "FILL") k.layoutSizingHorizontal = "FILL"; } catch {} });
log.push(B.name + ": moved in " + extras.join(", ") + " like the reference " + W.name + ", gap " + Math.round(W.itemSpacing)); break; } }
return log;
}
async function alignSizeVariants(refRoot, page) {
const log = [];
const topIn = (n, stopId) => { for (let q = n.parent; q && q.id !== stopId; q = q.parent) { if (q.type === "SLOT") return true; if (isI(q)) return false; } return true; };
const setOf = n => { try { const m = n.mainComponent; return m && m.parent && m.parent.type === "COMPONENT_SET" ? m.parent.name : null; } catch { return null; } };
const sizeOf = n => { try { const p = n.componentProperties && n.componentProperties.Size; return p && p.type === "VARIANT" ? String(p.value) : null; } catch { return null; } };
const bySet = l => { const m = new Map(); for (const n of l) { const s = setOf(n); if (!s) continue; if (!m.has(s)) m.set(s, []); m.get(s).push(n); } return m; };
for (const nm of ["Main content", "Side content"]) {
const B = page.findAll(n => isS(n) && n.name === nm)[0], R = refRoot.findAll(n => isS(n) && n.name === nm)[0]; if (!B || !R) continue;
const rb = bySet(R.findAll(n => isI(n) && n.visible && sizeOf(n) && topIn(n, R.id)));
const ob = bySet(B.findAll(n => isI(n) && n.visible && sizeOf(n) && topIn(n, B.id)));
for (const [s, list] of ob) { const rl = rb.get(s); if (!rl) continue; const sizes = [...new Set(rl.map(sizeOf))]; if (sizes.length !== 1) continue;
for (const id of list.filter(n => sizeOf(n) !== sizes[0]).map(n => n.id)) { const n = await byId(id); if (!n) continue;
try { n.setProperties({ Size: sizes[0] }); log.push(n.name + " Size → " + sizes[0] + " (as in the reference)"); } catch {} } } }
return log; }
async function headingTextStyles(refRoot, page) {
const log = [], HR = /^(Block Title|Body \/ Title|Heading|Title|Header)\b/i;
const slots = r => r.findAll(isB);
const shown = (n, top) => { for (let q = n; q && q.id !== top.id; q = q.parent) if (q.visible === false) return false; return true; };
const refT = new Map(); for (const s of slots(refRoot)) for (const t of s.findAll(n => n.type === "TEXT" && shown(n, s))) { const k = t.characters.trim(); if (!k) continue; if (!refT.has(k)) refT.set(k, new Set()); refT.get(k).add(typeof t.textStyleId === "string" ? t.textStyleId : ""); }
for (const s of slots(page)) for (const t of s.findAll(n => n.type === "TEXT" && shown(n, s))) {
let h = null; for (let q = t.parent, d = 0; q && q.id !== s.id && d < 4; q = q.parent, d++) if (HR.test(q.name)) { h = q; break; } const HS = /\/h[2-6]\b/i; if (!h) { let cs = null; try { cs = typeof t.textStyleId === "string" && t.textStyleId ? await figma.getStyleByIdAsync(t.textStyleId) : null; } catch {} if (!cs || !HS.test(cs.name)) continue; }
const set = refT.get(t.characters.trim()); if (!set || set.size !== 1) continue; const rid = [...set][0]; if (!rid || rid === t.textStyleId) continue;
try { let st = await figma.getStyleByIdAsync(rid); if (st && st.remote && st.key) st = await figma.importStyleByKeyAsync(st.key); if (!st || st.id === t.textStyleId || (!h && !HS.test(st.name))) continue;
await figma.loadFontAsync(st.fontName); await t.setTextStyleIdAsync(st.id); log.push("heading \"" + t.characters.trim().slice(0, 30) + "\" text style → " + st.name + " (as in the reference)"); } catch {} }
return log; }
const STATUS_PAINT = /(^|\/)(green|red|yellow|orange|purple|blue|cyan|pink|lime|volcano|geekblue|emerald|sky|teal|violet|rose|fuchsia)(\/|$)/i;
async function statusPaint(k, prop) { try { const b = k[prop] && k[prop][0] && k[prop][0].boundVariables && k[prop][0].boundVariables.color; if (!b) return false; const v = await gV(b.id); return !!v && STATUS_PAINT.test(v.name); } catch { return false; } }
async function sidePanelLikeReference(refRoot, page) {
const log = []; const asides = P => P.findAll(n => isI(n) && n.name === "Page / Body / Aside");
const colOf = a => { const s = a && a.findOne(n => isS(n) && n.name === "Content"); const k = s ? s.children.filter(c => c.visible) : []; return k.length === 1 ? k[0] : null; };
const R = asides(refRoot);
for (let i = 0; i < R.length; i++) { const r = colOf(R[i]), b0 = colOf(asides(page)[i]);
if (!r || !b0 || r.name !== b0.name || R[i].layoutSizingHorizontal !== "HUG" || r.layoutSizingHorizontal !== "FIXED") continue;
try { const fv = r.layoutSizingVertical === "FIXED"; let b = colOf(asides(page)[i]); b.layoutSizingHorizontal = "FIXED"; if (fv) b.layoutSizingVertical = "FIXED";
b = colOf(asides(page)[i]); b.resize(r.width, fv ? r.height : b.height);
const a2 = asides(page)[i]; if (a2.layoutSizingHorizontal !== "HUG") a2.layoutSizingHorizontal = "HUG";
log.push("side panel like the reference: " + r.name + " " + Math.round(r.width) + (fv ? "×" + Math.round(r.height) : "") + ", the Aside hugs it"); } catch (e) { log.push("side panel: " + e.message); } }
return log; }
const PLACEHOLDER_TEXT = /^(ClientNickname|Client name|Key[ _]name|Section name|Org[ _]name|Organization)$/i;
async function dropHeaderPlaceholders(page) {
const log = [], h = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible); if (!h) return log;
for (const s of h.findAll(n => isS(n) && /^(Info slot|Additional info)/i.test(n.name))) for (const k of [...s.children]) {
if (!k.visible || !("findAll" in k)) continue; const t = k.findAll(q => q.type === "TEXT" && q.visible && q.characters.trim()).map(q => q.characters.trim());
if (t.length && t.every(x => PLACEHOLDER_TEXT.test(x))) { const nm = k.name; try { k.remove(); log.push("header: " + nm + " removed — it only shows the placeholder \"" + t[0] + "\""); } catch {} } }
const h2 = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible);
for (const [re, prop] of [[/^Info slot/i, "Show Info slot#6985:0"], [/^Additional info/i, "Show additional info slot#6943:18"]]) { const s = h2 && h2.findAll(n => isS(n) && re.test(n.name))[0];
if (s && !s.children.some(k => k.visible)) { try { h2.setProperties({ [prop]: false }); log.push("header: " + s.name + " empty — switched off"); } catch {} } }
return log; }
async function hdrWrapPaints(page, refId) { const isW = n => isI(n) && n.visible && n.name !== "*Header*" && n.children.some(k => k.name === "*Header*"), rp = await byId(refId), rw = rp && rp.findOne(isW), w = page.findOne(isW), out = [];
if (!rw || !w || rw.name !== w.name) return out; const { resolve } = await varResolver();
for (const p of ["fills", "strokes"]) { const r = rw[p][0], b = r && r.visible !== false && r.boundVariables?.color, o = w[p][0]; if (!b) continue;
const t = await resolve(b.id), v0 = t && t.to, v = v0 && /^base\//i.test(v0.name) ? ((await semanticFor(v0.name, w, p)) || v0) : v0; if (!v || (o && o.boundVariables?.color && o.boundVariables.color.id === v.id)) continue;
const c = JSON.parse(JSON.stringify(r)); delete c.boundVariables; w[p] = [sBP(c, "color", v)]; out.push("header " + p + " → " + v.name); }
return out; }
async function finishIsland(page, refId) {
if (refId) { const ref = await byId(refId);
if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
const content = page.findAll(isB);
const anchors = [...new Set(content.flatMap(s => s.children).filter(n => n.name !== ICN).map(n => n.name))].concat([ICN]);
const sz = await alignSizeVariants(ref, page); const rg = await regroupLikeReference(ref, page); const cr = await copyVarsFromRef(ref, page, anchors), sp = await sidePanelLikeReference(ref, page), hs = await headingTextStyles(ref, page), hw = await hdrWrapPaints(page, refId), bt = await bareCardTokens(page), ph = await dropHeaderPlaceholders(page); cr.applied.unshift(...sz, ...rg, ...sp, ...hs, ...hw); return { from: "reference " + refId, applied: cr.applied.concat(bt, ph), skipped: cr.skipped }; } }
return { from: "§6.1 defaults", applied: (await applyIslandTokens(page)).concat(await dropHeaderPlaceholders(page)), skipped: [] };
}
function stretchToWidth(page, withRef) {
const log = [];
for (const g of page.findAll(n => n.type === "FRAME" && n.layoutMode === "GRID" && n.visible)) {
if (!withRef) for (const k of g.children.filter(c => c.visible)) { try { if (k.layoutSizingHorizontal !== "FILL") k.layoutSizingHorizontal = "FILL"; if (k.gridChildHorizontalAlign === "MIN") k.gridChildHorizontalAlign = "AUTO"; } catch {} }
const cols = g.gridColumnCount || 1, kids = g.children.filter(c => c.visible).slice(0, cols);
const rowW = kids.reduce((s, k) => s + k.width, 0) + (kids.length - 1) * (g.gridColumnGap || 0);
if (kids.length === cols && Math.abs(rowW - g.width) > 2) log.push(g.name + ": row " + Math.round(rowW) + " of " + Math.round(g.width));
}
if (!withRef) for (const n of page.findAll(x => x.visible && x.layoutSizingHorizontal === "FIXED" && cardLike(x) && x.parent && x.parent.layoutMode === "VERTICAL")) {
const pr = n.parent, inner = pr.width - (pr.paddingLeft || 0) - (pr.paddingRight || 0); if (inner - n.width > 4) { try { n.layoutSizingHorizontal = "FILL"; } catch {} } }
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
for (const s of page.findAll(isSd)) {
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
const oldAlias = n => n === "base/white/100" ? "base/neutral/0" : n.replace(/^components\/status\/(approved|rejected|pending|default)-/, (m, s) => "components/status/" + ({ approved: "green", rejected: "red", pending: "yellow", default: "grey" })[s] + "/");
let _vr = null;
function varResolver() {
if (_vr) return _vr;
_vr = (async () => {
let cols = null; try { cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync(); } catch {}
const live = cols ? new Set(cols.map(c => c.key)) : null;
const base = cols ? cols.find(c => /Base components/i.test(c.libraryName) && c.name === "color") : null;
const byName = new Map(); if (base) for (const v of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(base.key)) byName.set(v.name.toLowerCase(), v.key);
const colKey = new Map(), byKey = new Map(), memo = new Map(), miss = new Set();
const imp = key => { if (!byKey.has(key)) byKey.set(key, imV(key).catch(() => null)); return byKey.get(key); };
const colOf = vc => { if (!colKey.has(vc)) colKey.set(vc, figma.variables.getVariableCollectionByIdAsync(vc).then(c => c ? c.key : null).catch(() => null)); return colKey.get(vc); };
const resolve = id => { if (!memo.has(id)) memo.set(id, (async () => {
const v = await gV(id); let out = v ? { to: v, kind: "same", from: v.name } : null;
if (v && v.remote && v.key) { const ck = await colOf(v.variableCollectionId);
if (!live || !ck || live.has(ck)) { const fr = await imp(v.key); if (fr && fr.id !== v.id) out = { to: fr, kind: "stale", from: v.name }; }
else if (base) { const lo = v.name.toLowerCase(), key = byName.get(lo) || byName.get("components/" + lo) || byName.get(oldAlias(lo)) || byName.get("components/" + lo.replace(/-color-/g, "-")); const b = key ? await imp(key) : null; if (b) out = { to: b, kind: "orphan", from: v.name }; else miss.add(v.name); } }
return out; })()); return memo.get(id); };
const prefetch = ids => Promise.all([...new Set(ids.filter(Boolean))].map(resolve));
return { resolve, prefetch, miss, err: !cols ? "no library access" : !base ? "Base color collection not available" : null };
})();
return _vr;
}
const paintIds = nodes => { const out = []; for (const n of nodes) for (const prop of ["fills", "strokes"]) { let ps; try { ps = n[prop]; } catch { continue; } if (Array.isArray(ps)) for (const p of ps) if (p.boundVariables?.color) out.push(p.boundVariables.color.id); } return out; };
const BASE_TO_SEMANTIC = {
text: { "base/neutral/100": "1148e20b46c46ade58db9b4120fbf3ea872196fd", "base/neutral/90": "485b897d691c85b86a1ad8ebae7650f3dbcca365", "base/neutral/80": "47f41dc6d16468e6189a8784f58b12d07ebe72c3", "base/neutral/70": "678d3fc239240d7247f43296117c4d35a84592d9", "base/neutral/60": "2c094d8e57056b11ecbb2166364d4648c92d4360", "base/neutral/0": "cc87e4556ec61118c805685f92c80b214050bcd9" },
bg: { "base/neutral/0": "567811a0cf497ac911288a2f4a75a1d89ebff75c", "base/neutral/5": "e50636958c4d5a6917b4fb1e32a7de92ded72f85", "base/neutral/10": "e7129860062f42ee2a929d1b4ccacd21133a03ee", "base/neutral/20": "1aed8505fcfaec5aacd4ac43b4eb62d8315caa0a", "base/neutral/30": "b47e729aacb507fd6a42780ab5c7cb6e0615f33e" },
border: { "base/neutral/20": "40baade65c87f4b56fd67b027ec695d0984fae39", "base/neutral/30": "806f4dce0b78f55df4ab1d126160091d6dd67fd2", "base/neutral/40": "3ac6f9a55d66cd4435e64ad0fa7287b40da52980", "base/neutral/50": "6618868be488e538a0d5a0002206439e45c3cfbe" } };
const _semCache = new Map();
async function semanticFor(name, node, prop) {
const kind = prop === "strokes" ? "border" : node.type === "TEXT" ? "text" : "bg", key = BASE_TO_SEMANTIC[kind][String(name).toLowerCase()]; if (!key) return null;
if (!_semCache.has(key)) _semCache.set(key, imV(key).catch(() => null)); return _semCache.get(key); }
function oursOf(page) {
const hdr = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible);
const slots = page.findAll(isB).concat(hdr ? hdr.findAll(n => isS(n) && /^(Info slot|Additional info|Actions slot)/i.test(n.name)) : []);
const nested = (q, top) => { for (let p = q.parent; p && p.id !== top.id; p = p.parent) if (p.type === "SLOT") return true; return false; };
const out = []; const walk = (n, side) => { out.push([n, side]); if (isI(n)) { for (const sl of n.findAll(q => q.type === "SLOT" && !nested(q, n))) for (const k of sl.children) walk(k, side); return; }
if ("children" in n) for (const k of n.children) walk(k, side); };
for (const s of slots) for (const k of s.children) walk(k, s.name === "Side content" || s.name === "Content"); return out; }
const SPACING_KEYS = ["3d3cc3a15da0b893bf326da6053d7a1c37f1d836", "a4dad7f0e560345e844697b529325a2eca2ff23a", "5a8e4573770ee8f921f141c1ab6c96835c3125a0", "de89b1cae49981816929db80a4e795842e7baf77", "2b3382099953af94f32cb6ffe5c7f44c74d5fed7", "7dc2647090da988c17327693bc2224e2308047a2", "fceb37ce155723145d25d273574c665a8d7d30e6", "a2e089548b83ff33c8ee5e914fa24e67b889b38c"];
const RADIUS_KEYS = ["885152d55a536fb853461592cc3eff926e94858d", "311dc09093e9474a8b582c8fb7ccc7a628065a20", "95839af397884cd7f8fadb34a62d4763f88d68dd", "03884e014085a48cf26670632be200a02b5a160c"];
async function tokensByValue(keys, page) { const m = new Map(); const vs = await Promise.all(keys.map(k => imV(k).catch(() => null)));
for (const v of vs) { if (!v) continue; try { const r = v.resolveForConsumer(page); if (typeof r.value === "number" && !m.has(r.value)) m.set(r.value, v); } catch {} } return m; }
const noStroke = n => typeof n.strokeWeight === "number" ? n.strokeWeight === 0 : ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"].every(k => !n[k]);
async function tokenHygiene(page) {
const ours = oursOf(page), log = [], rawPaints = [], rawSpacing = [], noToken = [], sideWhites = [];
const hx = c => "#" + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const shownIn = n => { let q = n; while (q && q.type !== "SLOT") { if (q.visible === false) return false; q = q.parent; } return true; };
for (const [n] of ours) for (const prop of ["fills", "strokes"]) { let ps; try { ps = n[prop]; } catch { continue; } if (!Array.isArray(ps) || !ps.length || (prop === "strokes" && noStroke(n))) continue;
let changed = false; const next = [];
for (const p of ps) { const b = p.boundVariables?.color;
if (p.type === "SOLID" && p.visible !== false && !b) { if (n.type !== "INSTANCE" && shownIn(n)) rawPaints.push(n.name + " " + prop + " " + hx(p.color)); next.push(p); continue; }
const v = b ? await gV(b.id) : null;
if (v && /^base\//i.test(v.name)) { const sem = await semanticFor(v.name, n, prop);
if (sem) { const c0 = JSON.parse(JSON.stringify(p)); delete c0.boundVariables; next.push(sBP(c0, "color", sem)); changed = true; log.push(v.name + " → " + sem.name); continue; }
if (shownIn(n)) rawPaints.push(n.name + " " + prop + " " + v.name + " (no semantic mapping)"); }
next.push(p); }
if (changed) { try { n[prop] = next; } catch {} } }
const sp = await tokensByValue(SPACING_KEYS, page), rd = await tokensByValue(RADIUS_KEYS, page), RAW_OK = [40, 48, 64, 88];
for (const [n] of ours) { if (n.type !== "FRAME") continue;
if (n.layoutMode && n.layoutMode !== "NONE") for (const k of (n.layoutMode === "GRID" ? [...PD, "gridRowGap", "gridColumnGap"] : [...PD, "itemSpacing"])) {
const val = n[k]; if (typeof val !== "number" || val === 0 || (n.boundVariables?.[k])) continue;
const v = sp.get(val); if (v) { try { n.setBoundVariable(k, v); log.push(n.name + " " + k + " " + val + " → " + v.name); continue; } catch {} }
if (!RAW_OK.includes(val) && shownIn(n)) (v ? rawSpacing : noToken).push(n.name + " " + k + "=" + val); }
for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) { const val = n[k]; if (typeof val !== "number" || val === 0 || (n.boundVariables?.[k])) continue;
const v = rd.get(val); if (v) { try { n.setBoundVariable(k, v); log.push(n.name + " radius " + val + " → " + v.name); continue; } catch {} }
if (shownIn(n)) (v ? rawSpacing : noToken).push(n.name + " " + k + "=" + val); } }
for (const [n, side] of ours) { if (!side || !shownIn(n) || n.width <= 100 || cardLike(n)) continue; if (isWhite(n)) sideWhites.push(n.name + " " + Math.round(n.width)); }
const tally = {}; for (const l of log) { const k = l.replace(/^.*? (padding|item|grid|radius)/, "$1"); tally[k] = (tally[k] || 0) + 1; }
return { fixed: log.length, by: Object.entries(tally).slice(0, 10).map(([k, c]) => k + " ×" + c), rawPaints: rawPaints.slice(0, 10), rawSpacing: rawSpacing.slice(0, 10), noToken: noToken.slice(0, 10), sideWhites: sideWhites.slice(0, 6) }; }
async function rebindOrphanVars(page) {
const R = await varResolver(); if (R.err) return { rebound: 0, missing: [R.err] };
const log = [];
const ours = oursOf(page).map(e => e[0]);
await R.prefetch(paintIds(ours));
for (const n of ours) for (const prop of ["fills", "strokes"]) { let paints; try { paints = n[prop]; } catch { continue; } if (!Array.isArray(paints) || !paints.length) continue;
let changed = false; const next = [];
for (const p of paints) { const b = p.boundVariables?.color; const t = b ? await R.resolve(b.id) : null;
if (!t || t.kind === "same") { next.push(p); continue; } const base0 = JSON.parse(JSON.stringify(p)); delete base0.boundVariables; next.push(sBP(base0, "color", t.to)); changed = true; log.push(t.from + (t.kind === "stale" ? " (stale copy)" : "") + " → " + t.to.name); }
if (changed) { try { n[prop] = next; } catch {} } }
const tally = {}; for (const l of log) tally[l] = (tally[l] || 0) + 1;
return { rebound: log.length, by: Object.entries(tally).slice(0, 12).map(([k, c]) => k + " ×" + c), missing: [...R.miss].slice(0, 6) };
}
async function keepHeader(page) { const k = page.parent && "findChild" in page.parent ? page.parent.findChild(n => n.getSharedPluginData("sumsub_island", "hdrFor") === page.id) : null; if (!k) return null;
k.visible = true; const h = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name)), mc = await k.getMainComponentAsync(); let r = null;
if (h && mc) { const hid = h.id; h.swapComponent(mc); const h2 = (await byId(hid)) || page.findOne(n => isI(n) && n.name === k.name); try { h2.layoutSizingHorizontal = "FILL"; } catch {} await syncNode(h2.id, k, true); r = "header: " + k.name + " kept, its properties and texts copied"; }
k.remove(); return r; }
async function refHeader(page, refId) { const rp = refId ? await byId(refId) : null, h = page.findOne(n => isI(n) && n.name === "*Header*" && n.visible);
const rw = rp && rp.findOne(n => isI(n) && n.visible && n.name !== "*Header*" && n.children.some(k => isI(k) && k.name === "*Header*"));
if (!rw || !h || isI(h.parent)) return null; const m = await rw.getMainComponentAsync(); if (!m) return null;
const k = h.clone(); page.parent.appendChild(k); k.x = page.x - 3000; const top = (n, r) => { for (let q = n.parent; q && q.id !== r.id; q = q.parent) if (q.type === "SLOT") return false; return true; };
try { const hid = h.id; h.swapComponent(m); const w = await byId(hid); try { w.layoutSizingHorizontal = "FILL"; } catch {}
const iid = w.findOne(n => isI(n) && n.name === "*Header*").id; await syncNode(iid, k, true); const inner = await byId(iid);
for (const s of k.findAll(n => isS(n) && top(n, k))) { const t = inner.findAll(n => isS(n) && n.name === s.name && top(n, inner))[0]; if (!t) continue;
for (const q of [...t.children]) q.remove(); for (const q of s.children) { const c = q.clone(); t.appendChild(c); for (const d of ["layoutSizingHorizontal", "layoutSizingVertical"]) { try { c[d] = q[d]; } catch {} } } }
return "header: " + rw.name + " as in the reference, our content moved in"; } finally { k.remove(); } }
async function syncNode(aid, b, top) { let a = await byId(aid); if (!a) return; if (!top) { try { if (a.visible !== b.visible) a.visible = b.visible; } catch {} }
if (isI(a) && isI(b)) { const p = {}; let ap = {}, bp = {}; try { ap = a.componentProperties || {}; bp = b.componentProperties || {}; } catch {} for (const [k, v] of Object.entries(bp)) if (ap[k] && ap[k].value !== v.value) p[k] = v.value; if (Object.keys(p).length) { try { a.setProperties(p); } catch {} a = await byId(aid); if (!a) return; } }
if (a.type === "TEXT" && b.type === "TEXT" && a.characters !== b.characters) { try { for (const f of a.getRangeAllFontNames(0, a.characters.length)) await figma.loadFontAsync(f); a.characters = b.characters; } catch {} }
const bk = "children" in b ? b.children : [];
for (let i = 0; i < bk.length; i++) { const pa = await byId(aid), ak = pa && "children" in pa ? pa.children : []; if (i >= ak.length) break; if (ak[i].name === bk[i].name) await syncNode(ak[i].id, bk[i], false); } }
async function headerCards(page, refId) { const H = "APCardCollapsible/Header", cH = c => c.findOne(q => isI(q) && q.name === H), cT = n => n.findAll(q => q.type === "TEXT" && q.visible), cP = n => Object.fromEntries(Object.entries(n.componentProperties).map(([k, v]) => [k.split("#")[0], [k, v]])), out = [], up = n => { let q = n.parent; while (q && !isI(q)) q = q.parent; return q || {}; };
const hs = oursOf(page).map(e => e[0]).filter(n => isI(n) && n.visible && n.name === H && up(n).name !== "APCardCollapsible"); const rp = refId && await byId(refId); if (!hs.length || (rp && rp.findOne(n => isI(n) && n.name === H && isB(n.parent)))) return out; const set = await figma.importComponentSetByKeyAsync("cc6745d97b3b9e7ac0a149ad577630de096b8bc1");
for (const h of hs) { const o = cP(h), st = String(((o.Status || o.State || [])[1] || {}).value).toLowerCase(), t = (["ap|Green - Approved", "rej|Red - Rejected", "pend|Yellow - Pending/Warning", "err|Black - Failed Ignored"].find(x => st.startsWith(x.split("|")[0])) || "|Default").split("|")[1];
const v = set.children.filter(c => c.name.includes("Type=" + t)).sort((a, b) => a.height - b.height)[0]; if (!v) continue; const c = v.createInstance(), par = h.parent; par.insertChild(par.children.indexOf(h), c); try { c.layoutSizingHorizontal = "FILL"; } catch { c.resize(h.width, c.height); }
let bt = false; for (const [b, [k, x]] of Object.entries(cP(cH(c)))) if (b !== "State" && x.type !== "SLOT" && o[b] && o[b][1].type === x.type) try { cH(c).setProperties({ [k]: o[b][1].value }); if (b === "Buttons") bt = o[b][1].value; } catch {}
const nh = cH(c), sl = nh.findOne(q => isS(q) && /^Buttons/.test(q.name)), old = cT(h); if (sl && bt) { [...sl.children].forEach(q => q.remove()); h.findAll(q => isI(q) && /^\*Button/.test(q.name) && q.visible).forEach(q => sl.appendChild(q.clone())); }
for (const x of cT(nh)) { const m = old.filter(q => q.name === x.name); if (!(sl && sl.findOne(q => q.id === x.id)) && m.length === 1 && cT(nh).filter(q => q.name === x.name).length === 1 && m[0].characters !== x.characters) try { await figma.loadFontAsync(x.fontName); x.characters = m[0].characters; } catch {} }
out.push((o["Card name"] ? o["Card name"][1].value + " → " : "") + t); h.remove(); } return out; }
async function finishAndAudit(pageId, refId, part) {
const page = await byId(pageId); let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();
let fin = { from: "skipped (part audit)", applied: [], skipped: [] };
let kh = null; if (part !== "audit") { try { kh = await keepHeader(page) || await refHeader(page, refId); } catch (e) { kh = "keep header: " + e.message; } }
let hc; if (part !== "audit") { try { hc = await headerCards(page, refId); } catch (e) { hc = ["error: " + e.message]; } }
if (part !== "audit") { try { fin = await finishIsland(page, refId); } catch (e) { fin = { from: "error", applied: [], skipped: [e.message] }; } }
if (part === "copy" || (!part && /as in the reference/.test(kh || ""))) return clean({ pageId, part: "copy", header: kh || undefined, cards: hc && hc.length ? hc : undefined, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, next: "call again with part \"audit\"" });
let orphans; try { orphans = await rebindOrphanVars(page); } catch (e) { orphans = { rebound: 0, missing: ["error: " + e.message] }; }
let hyg; try { hyg = await tokenHygiene(page); } catch (e) { hyg = { fixed: 0, rawPaints: ["error: " + e.message], rawSpacing: [], sideWhites: [] }; }
const gridIssues = stretchToWidth(page, !!refId);
const side = fitSideColumns(page);
const pb = page.absoluteTransform[1][2];
const slots = page.findAll(isB);
const bottom = Math.max(0, ...slots.flatMap(s => s.children.filter(k => k.visible && k.layoutSizingVertical !== "FILL").map(k => k.absoluteTransform[1][2] - pb + k.height)));
const rpg = refId ? await byId(refId) : null, rPg = rpg ? (isI(rpg) && rpg.name === "Page" ? rpg : rpg.findOne(n => isI(n) && n.name === "Page")) : null;
const oh = Number(page.getSharedPluginData("sumsub_island", "origH")) || 0, rh = rPg ? Math.round(rPg.height) : 0;
const want = Math.max(oh && rh ? Math.min(oh, rh) : rh, Math.ceil(bottom + 28));
if (bottom + 20 > page.height || (rPg && page.height > want + 1)) { try { page.resize(page.width, want); } catch {} }
let sectionFit = null; try { sectionFit = fitSection(page); } catch (e) { sectionFit = "error: " + e.message; }
const ms2 = page.findAll(isS).find(s => s.name === "Main content");
const refRoot = refId ? await byId(refId) : null;
const notIsland = ms2 ? ms2.children.filter(k => k.visible && k.name !== ICN && !isGraphic(k) && !cardLike(k) && !isCardLayout(k) && !["bare", "split"].includes(refPlacement(refRoot, k.name))).map(k => k.name) : ["no main slot"];
const overflow = slots.map(s => { const sb = s.absoluteBoundingBox; const o = s.children.filter(k => k.visible && k.absoluteBoundingBox &&
(k.absoluteBoundingBox.x + k.absoluteBoundingBox.width > sb.x + sb.width + 1)).map(k => k.name);
const inI = n => { for (let q = n.parent; q && q.id !== s.id; q = q.parent) { if (q.type === "SLOT") return false; if (isI(q)) return true; } return false; }, sh = n => { for (let q = n; q && q.id !== s.id; q = q.parent) if (q.visible === false) return false; return true; };
for (const k of s.children.filter(k => k.visible && "findAll" in k && !o.includes(k.name))) { const d = k.findAll(x => x.type !== "TEXT" && !!x.absoluteBoundingBox && x.absoluteBoundingBox.x + x.absoluteBoundingBox.width > sb.x + sb.width + 1).find(x => !inI(x) && sh(x)); if (d) o.push(k.name + " › " + d.name); }
return o.length ? s.name + ": " + o.join(", ") : null; }).filter(Boolean);
const items = ms2 ? ms2.children.filter(k => k.visible).map(k => k.name === ICN ? "ISL[" + ((k.findOne(isS) || { children: [] }).children.map(q => q.name.slice(0, 24)).join(" + ")) + "]" : "bare:" + k.name.slice(0, 26)) : [];
return clean({ pageId, header: kh || undefined, cards: hc && hc.length ? hc : undefined, size: Math.round(page.width) + "×" + Math.round(page.height), main: items, notIsland, overflow, gridIssues, sideFit: side.fit, sideOverflow: side.inside, narrowFills: narrowFills(page), rawPaints: hyg.rawPaints, rawSpacing: hyg.rawSpacing, sideWhites: hyg.sideWhites, tokens: { fixed: hyg.fixed, by: hyg.by, noToken: hyg.noToken }, sectionFit, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, orphanVars: orphans });
}
