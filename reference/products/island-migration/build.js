// BUILD — call 1 of 2. Paste this file into use_figma and append:  return JSON.stringify(await migrateOne("<screen node id>", "<reference node id, optional>"));
const ICN = "Page / Body / IslandCard", isI = n => n.type === "INSTANCE", isS = n => n.type === "SLOT", CP = n => n.componentProperties, CT = n => n.characters.trim(), fI = (r, nm) => r.findOne(n => isI(n) && n.name === nm), isT = n => n.type === "TEXT", fT = n => n.findOne(q => isT(q) && q.visible), fS = (r, nm) => r.findAll(n => isS(n) && n.name === nm), fill = n => { try { n.layoutSizingHorizontal = "FILL"; } catch {} }, rm = n => { try { n.remove(); } catch {} }, SA = "Show actions slot#6943:20", SI = "Show Info slot#6985:0", SD = "Show additional info slot#6943:18", TT = "Title text#3817:0", CTL = "Copy title#6943:15";
const rendered = (n, stop) => { const sid = stop ? stop.id : null; let p = n;
while (p && p.type !== "PAGE" && p.id !== sid) { if ("visible" in p && p.visible === false) return false; p = p.parent; } return true; };
const mainName = n => { try { const m = n.mainComponent; return m ? ((m.parent && m.parent.type === "COMPONENT_SET") ? m.parent.name : m.name) : ""; } catch (e) { return ""; } };
const box = (n, ref) => { const a = n.absoluteTransform, r = ref.absoluteTransform; return { x: Math.round(a[0][2] - r[0][2]), y: Math.round(a[1][2] - r[1][2]), w: Math.round(n.width), h: Math.round(n.height) }; };
const vis = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
const _LS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029, 0x85) + "]", "g");
const clean = o => JSON.parse(JSON.stringify(o).replace(_LS, " "));
const _idCache = new Map();
const idsOf = n => { if (!n) return new Set(); if (_idCache.has(n.id)) return _idCache.get(n.id);
const s = new Set([n.id]); if ("findAll" in n) for (const x of n.findAll(() => true)) s.add(x.id); _idCache.set(n.id, s); return s; };
const contains = (outer, n) => !!outer && idsOf(outer).has(n.id);
function sideBySideList(nodes, scr) {
const k = nodes.filter(c => c.width >= 150).map(c => ({ c, b: box(c, scr) }));
if (k.length < 2) return null;
for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i].b, b = k[j].b;
const xo = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), yo = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
if (!(xo <= 4 && yo > 20)) return null; }
return k.sort((p, q) => p.b.x - q.b.x);
}
const isTableSelf = x => /Table Starter|Table Header|Txn table|Case table/i.test(x.name) || /Table Starter/.test(mainName(x));
const isTableNode = n => { let c = n; for (let i = 0; i < 4 && c; i++) { if (isTableSelf(c)) return true; const k = vis(c);
if (k.some(isTableSelf)) return true; if (k.length !== 1 || !("children" in k[0])) return false; c = k[0]; } return false; };
const unwrap = n => { let c = n; while (c && c.type !== "INSTANCE" && vis(c).length === 1 && "children" in vis(c)[0] && vis(c)[0].width >= 0.85 * c.width) c = vis(c)[0]; return c; };
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
const isGraphic = n => /^(RECTANGLE|ELLIPSE|VECTOR|LINE|POLYGON|STAR|BOOLEAN_OPERATION)$/.test(n.type);
function analyze(scr) { const rn = n => rendered(n, scr);
const W = Math.round(scr.width), H = Math.round(scr.height), notes = [];
const all = scr.findAll(n => n.visible !== false && rn(n));
const sidebar = all.filter(n => { const b = box(n, scr); return b.x <= 2 && b.y <= 2 && b.h >= 0.8 * Math.min(H, 900) && b.w >= 44 && b.w <= 300 &&
(/sidebar|menu|navigation/i.test(n.name) || /Sidebar/.test(mainName(n))); }).sort((a, b) => b.height - a.height)[0] || null;
const sbW = sidebar ? Math.round(sidebar.width) : 0;
const header = all.filter(n => { const b = box(n, scr); return b.y <= 2 && b.h >= 40 && b.h <= 160 && b.x >= sbW - 2 && b.w >= 0.7 * (W - sbW) &&
(/header/i.test(n.name) || /Header/.test(mainName(n))); }).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
const hdrH = header ? Math.round(header.height) : 0;
let stackBottom = header ? box(header, scr).y + box(header, scr).h : 0;
const header2 = !header ? null : all.filter(n => { const b = box(n, scr); return !contains(header, n) && Math.abs(b.y - stackBottom) <= 8 && b.w >= 0.9 * (W - sbW) && b.h >= 40 && b.h <= 200 &&
(/header/i.test(n.name) || /Header/.test(mainName(n))) && "findOne" in n && !!n.findOne(x => isI(x) && /^\*Button/.test(x.name)); }).sort((a, b) => b.height - a.height)[0] || null;
if (header2) stackBottom = box(header2, scr).y + box(header2, scr).h;
const subheader = all.filter(n => { const b = box(n, scr); return !contains(header, n) && !contains(header2, n) && b.y >= Math.min(hdrH, stackBottom) - 2 && b.y <= stackBottom + 32 && b.h >= 32 && b.h <= 72 &&
"findOne" in n && !!n.findOne(x => /^\*Tab Basic\*|Tab( \/)? Basic \/ Item/.test(x.name)); }).sort((a, b) => b.width - a.width)[0] || null;
const scrollbars = all.filter(n => isI(n) && /Scroll \/ Thumb/i.test(n.name + " " + mainName(n)));
const isChrome = n => contains(header, n) || contains(header2, n) || contains(sidebar, n) || contains(subheader, n) || scrollbars.some(sb => contains(sb, n));
let cols = sideBySideList(vis(scr).filter(c => !isChrome(c)), scr), container = cols ? scr : null;
if (!cols) container = all.filter(n => { const b = box(n, scr); return (b.y >= hdrH - 2 || (header && b.y + b.h >= (H + hdrH) / 2 && vis(n).length && !contains(n, header))) && b.x >= sbW - 2 && b.w >= 0.5 * (W - sbW) && b.h >= 0.25 * (H - hdrH) &&
!isChrome(n) && "children" in n; }).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
for (let g = 0; !cols && container && g < 6; g++) { cols = sideBySideList(vis(container).filter(c => !isChrome(c)), scr); if (cols) break; const k = vis(container).filter(c => !isChrome(c));
if (k.length === 1 && "children" in k[0] && !isTableNode(k[0])) container = k[0]; else break; }
let main = null, left = null, right = null;
if (cols) { const widest = cols.slice().sort((a, b) => b.b.w - a.b.w)[0]; main = widest.c;
for (const c of cols) { if (c === widest) continue;
if (c.b.w <= 440 && c.b.x < widest.b.x) left = c.c; else if (c.b.w <= 440 && c.b.x > widest.b.x) right = c.c; else notes.push("unclassified column " + c.c.name + " " + c.b.w); } }
else if (container) main = container;
const table = !!main && isTableNode(main);
let groups = [];
if (main) { if (table) { const u = unwrap(main); groups = [vis(u).find(isTableSelf) ? u : u]; }
else { let inner = unwrap(main); let k = vis(inner).filter(x => !isChrome(x));
if (k.length === 1 && "children" in k[0]) { inner = unwrapSingle(k[0]); k = isI(inner) ? [inner] : vis(inner).filter(x => !isChrome(x)); }
const hasChrome = vis(inner).some(isChrome) || (!!subheader && contains(inner, subheader)); if (isCardLayout(inner) && !hasChrome) groups = [inner];
else groups = (k.length >= 2 && k.every(x => x.width >= 0.6 * inner.width || isGraphic(x)) && k.some(x => !isGraphic(x))) ? k : (hasChrome && k.length ? k : [inner]); } }
const isOv = n => isI(n) && /Toast|Dropdown|Modal|Drawer/i.test(n.name + " " + mainName(n));
const hasOvAncestor = n => { let p = n.parent; while (p && p.id !== scr.id && p.type !== "PAGE") { if (isOv(p)) return true; p = p.parent; } return false; };
const overlays = all.filter(n => isOv(n) && !hasOvAncestor(n) && !contains(header, n) && !contains(main, n) && !contains(left, n) && !contains(right, n));
const hasClose = header ? !!header.findOne(n => /close/i.test(n.name) && rn(n)) : false;
const fullHdr = header ? /Full Screen|Header-levels|Fullscreen|Case page header|AP page header/i.test(header.name + " " + mainName(header)) : false;
const pageType = sbW && sbW <= 60 ? "Full screen page" : sbW >= 200 ? "Basic" : (hasClose || fullHdr ? "Full screen page" : "Basic");
let content;
const fitsSide = !!right && !!main && (main.width + right.width) <= 1084;
if (left && right) { content = "◼️ Nav + Main + Right (Ghost)"; notes.push("left AND right column — is the left one navigation?"); }
else if (left) content = "◼️ Left + Main (Ghost)";
else if (right && !fitsSide) content = "◼️ Main + Right (Ghost)";
else content = "◼️ Main (Ghost)";
if (!header) notes.push("no header found");
if (!main) notes.push("no main content found");
const width = table ? (W >= 1900 ? "1920 max" : "Full width") : (content === "◼️ Main + Right (Ghost)" ? "Full width" : "1084 max");
let title = null; if (header) { const t = header.findOne(n => isT(n) && n.name === "Title" && rn(n)) ||
header.findAll(n => isT(n) && rn(n) && CT(n).length > 1).sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0]; if (t) title = CT(t); }
const tabSrc = [header, subheader].filter(Boolean);
const tabPairs = tabSrc.flatMap(h => h.findAll(n => isI(n) && /Tab( \/)? Basic \/ Item/i.test(n.name) && rn(n)))
.map(t => { const x = t.findOne(y => isT(y) && y.visible); const sp = CP(t) && CP(t).Selected;
const ck = Object.keys(CP(t) || {}).find(k => /^Counter/.test(k)), nt = ck && CP(t)[ck].value === true ? t.findOne(y => isT(y) && y.visible && y.name === "Number") : null; return { label: x ? x.characters : null, sel: !!sp && String(sp.value) === "true", cnt: nt ? nt.characters : null }; }).filter(t => t.label);
const tabs = tabPairs.map(t => t.label), tabCnt = tabPairs.map(t => t.cnt), tabSelected = Math.max(0, tabPairs.findIndex(t => t.sel));
let sandbox = false; if (header) { const s = header.findOne(n => isT(n) && /sandbox mode/i.test(n.characters)); if (s) { const hb = header.absoluteBoundingBox, tb = s.absoluteBoundingBox; sandbox = rendered(s, scr) && s.visible && !!hb && !!tb && tb.y >= hb.y - 1 && tb.y + tb.height <= hb.y + hb.height + 1; } }
const plan = { pageType, content, width, sideContent: !!right && content === "◼️ Main (Ghost)", sandbox, title, tabs, tabCnt, tabSelected };
return { W, H, nodes: { sidebar, header, header2, subheader, scrollbars, main, left, right, groups, overlays, table }, plan, confident: !!header && !!main && notes.length === 0, notes };
}
function headerRegions(h, scr) { const rn = n => rendered(n, scr);
if (!h) return { actions: [] };
const inA = (n, re) => { let q = n.parent; while (q && q.id !== h.id) { if (re.test(q.name)) return q; q = q.parent; } return null; };
const T = h.findAll(n => isT(n) && n.visible && rn(n));
const cr = T.find(t => inA(t, /Breadcrumb/i) && CT(t).length > 1 && !/^Section name$/i.test(CT(t)));
const keyT = T.find(t => /^Key name$/i.test(t.name) && !/^Key name$/i.test(CT(t)) && !inA(t, /Additional info/i));
const status = h.findOne(n => n.id !== h.id && /status/i.test(n.name) && n.visible && rn(n) && !inA(n, /status/i)) || null;
const addInfo = h.findOne(n => /^Additional info$/i.test(n.name) && "children" in n && n.visible && rn(n)) || null;
const copy = !!h.findOne(n => isI(n) && /^\*Button\*/.test(n.name) && n.visible && rn(n) && (/Title \+ button/i.test(n.parent.name) || (!n.findOne(q => isT(q) && q.visible && CT(q)) && !!n.findOne(q => isI(q) && /^(normal|small)\/copy$/.test(q.name)) && [n.parent, n.parent && n.parent.parent].some(p => p && /Title/i.test(p.name)))));
const actions = h.findAll(n => isI(n) && /^\*Button( AI)?\*/.test(n.name) && n.visible && rn(n) &&
!!inA(n, /Actions/i) && !inA(n, /Additional info/i) && !inA(n, /\*Button/));
return { crumb: cr ? CT(cr) : null, key: keyT ? CT(keyT) : null, status, addInfo, copy, actions };
}
const refScope = r => { const sl = r.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name)))); return sl.length ? sl : [r]; };
const refAll = (r, nm) => refScope(r).flatMap(s => s.findAll(x => x.name === nm && x.visible));
function refPlacement(refRoot, name) {
if (!refRoot) return null;
const n = refAll(refRoot, name)[0]; if (!n) return null;
let q = n.parent; while (q && q.id !== refRoot.id) { if (isI(q) && q.name === ICN) return "island"; q = q.parent; }
return ("findOne" in n && n.findOne(x => isI(x) && x.name === ICN)) ? "split" : "bare";
}
function refIslandOf(refRoot, name) {
if (!refRoot) return null;
const n = refAll(refRoot, name)[0]; if (!n) return null;
for (let q = n.parent; q && q.id !== refRoot.id; q = q.parent) if (isI(q) && q.name === ICN) return q.id;
return null;
}
function refIslandByKids(refRoot, g) {
if (!refRoot || !("children" in g)) return null;
let cur = g; for (let d = 0; d < 3; d++) { const k = cur.children.filter(x => x.visible !== false); if (k.length === 1 && k[0].type === "FRAME" && "children" in k[0]) cur = k[0]; else break; }
const kids = cur.children.filter(k => k.visible !== false); if (!kids.length) return null;
const ids = []; for (const k of kids) { const all = refAll(refRoot, k.name); if (!all.length) { if (isHeadingBlock(k)) continue; return null; } if (all.length > 1) continue;
let isl = null; for (let q = all[0].parent; q && q.id !== refRoot.id; q = q.parent) if (isI(q) && q.name === ICN) { isl = q.id; break; } if (!isl) return null; ids.push(isl); }
return ids.length && ids.every(id => id === ids[0]) ? ids[0] : null;
}
function refUnboxed(refRoot, g) {
if (!refRoot || !cardLike(g) || refPlacement(refRoot, g.name) || refIslandByKids(refRoot, g) || !("findAll" in g)) return false;
const ms = fS(refRoot, "Main content")[0]; if (!ms) return false;
const names = [...new Set(g.findAll(x => x.visible !== false && isI(x)).map(x => x.name))];
const wrapped = y => { for (let q = y.parent; q && q.id !== ms.id; q = q.parent) { if (isI(q) && q.name === ICN) return true; if (q.type === "FRAME" && isCard(q)) return true; } return false; };
const found = names.map(nm => ms.findOne(y => y.name === nm && y.visible)).filter(Boolean);
return found.length >= 2 && found.every(y => !wrapped(y));
}
function mergeSharedIslands(bundles, refRoot) {
const out = []; let last = null;
for (const b of bundles) { const isl = refIslandOf(refRoot, b[b.length - 1].name);
if (isl && isl === last && out.length) out[out.length - 1] = out[out.length - 1].concat(b); else out.push(b);
last = isl; }
return out;
}
function refCrumb(refRoot) {
if (!refRoot) return null;
const h = refRoot.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible); if (!h) return null;
const bc = h.findOne(n => isI(n) && /Breadcrumb/i.test(n.name) && n.visible); if (!bc) return null;
const t = bc.findAll(n => isT(n) && n.visible).map(n => CT(n)).find(s => s.length > 1 && s !== "/");
return t && !/^Section name$/i.test(t) ? t : null;
}
async function sideFromReference(page, refRoot, colName, labelValue, notes) {
if (!refRoot) return;
let col = page.findOne(n => n.name === colName && n.visible); if (!col || !("children" in col)) return;
const refMain = refRoot.findAll(n => isS(n) && /^(Main content|Side content)$/.test(n.name));
const refCol = refMain.flatMap(sl => sl.children).find(k => k.visible && /right column|side content/i.test(k.name)) ||
refRoot.findAll(n => isS(n) && n.name === "Content" && n.parent && /Aside/.test(n.parent.name)).flatMap(sl => sl.children).find(k => k.visible);
if (!refCol || !("children" in refCol)) return;
const firstText = n => { const t = isT(n) ? n : (n.findOne ? fT(n) : null); return t ? CT(t) : ""; };
const padOf = n => (n.paddingTop || 0) + (n.paddingLeft || 0);
const refBlocks = vis(refCol);
const sectioned = padOf(refCol) === 0 && refBlocks.length >= 2 && refBlocks.every(k => padOf(k) > 0);
if (sectioned) {
let as = col.parent; while (as && !(isI(as) && as.name === "Page / Body / Aside")) as = as.parent;
if (as && padOf(as) > 0) { try { as.setProperties({ "Paddings": "No" }); } catch (e) { notes.push("aside paddings: " + e.message); } }
col = page.findOne(n => n.name === colName && n.visible);
col.itemSpacing = refCol.itemSpacing || 0;
notes.push("side column: flush sections as in the reference");
}
if (isI(col)) { notes.push("side column is an instance — kept as is"); return; }
const sectionLike = async (rb) => {
const w = figma.createFrame(); w.name = rb.name; w.layoutMode = "VERTICAL"; w.fills = [];
for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) w[k] = rb[k] || 0;
try { w.strokes = JSON.parse(JSON.stringify(rb.strokes || [])); w.strokeAlign = rb.strokeAlign;
for (const k of ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"]) w[k] = rb[k]; } catch {}
const bv = rb.boundVariables || {};
for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) { if (!bv[k]) continue;
try { let v = await figma.variables.getVariableByIdAsync(bv[k].id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); if (v) w.setBoundVariable(k, v); } catch {} }
return w; };
let at = 0; const used = new Set();
for (const rb of refBlocks) {
const ft = firstText(rb).toLowerCase(), free = k => k.visible && !used.has(k.id);
const mine = col.children.find(k => free(k) && ft && (k.name.trim().toLowerCase() === ft || firstText(k).toLowerCase() === ft)) || col.children.find(k => free(k) && k.name === rb.name && !ft);
if (mine) { used.add(mine.id);
if (sectioned && padOf(mine) === 0 && mine.name !== rb.name) {
const w = await sectionLike(rb), mid = mine.id; col.insertChild(Math.max(0, col.children.findIndex(k => k.id === mid)), w);
try { w.layoutSizingHorizontal = "FILL"; w.layoutSizingVertical = "HUG"; } catch {}
const m2 = col.children.find(k => k.id === mid) || col.findOne(k => k.id === mid); w.appendChild(m2);
fill(m2);
notes.push("side block in a section like the reference: " + m2.name);
used.add(w.id); at = col.children.findIndex(k => k.id === w.id) + 1;
} else at = col.children.findIndex(k => k.id === mine.id) + 1;
continue; }
const c = rb.clone(); col.insertChild(Math.min(at, col.children.length), c); at++; used.add(c.id);
fill(c);
const T = c.findAll(q => isT(q) && q.visible);
for (let i = 0; i < T.length - 1; i++) { const v = labelValue[T[i].characters.trim().toLowerCase()];
if (v && T[i + 1].characters.trim() !== v) { try { await figma.loadFontAsync(T[i + 1].fontName); T[i + 1].characters = v; } catch {} } }
notes.push("side block from the reference: " + (firstText(rb) || rb.name));
}
}
const SIDEBAR_TYPE = { "dashboard": "Dashboard", "summy ai copilot": "Summy AI Copilot", "applicants": "Applicants", "integrations": "Integrations", "transactions": "Transactions monitoring", "case management": "Case management", "client lists": "Client lists", "statistics": "Statistics", "reports": "Reports", "billing": "Billing", "settings": "Settings", "tasks": "Tasks", "operator": "Operator", "review panel": "Reviews", "reviews": "Reviews", "mission control": "Mission control", "admin area": "Admin area", "dev space": "Dev space", "marketplace": "Marketplace" };
function sidebarTrail(old) {
if (!old || !("findAll" in old)) return null;
const isActive = n => { try { return isI(n) && CP(n) && CP(n).State && String(CP(n).State.value) === "Active"; } catch (e) { return false; } };
const depthOf = n => { let d = 0; for (let q = n; q && q.id !== old.id; q = q.parent) d++; return d; };
const act = old.findAll(n => n.visible !== false && isActive(n) && /Menu Item|Sections/i.test(n.name)).sort((p, q) => depthOf(q) - depthOf(p));
if (!act.length) return null;
const txt = n => { const t = isT(n) ? n : fT(n); return t ? CT(t) : ""; };
const trail = [txt(act[0])];
for (let q = act[0].parent; q && q.id !== old.id; q = q.parent) if (/Sections/i.test(q.name)) { const row = q.findOne(x => /Menu Item \/ (First|Second) Level/i.test(x.name)); const t = row ? txt(row) : txt(q); if (t && t !== trail[trail.length - 1]) trail.push(t); }
return trail.filter(Boolean);
}
async function carrySidebar(old, page, notes) {
const sb = fI(page, "*Sidebar*"); if (!sb || !old) return;
let type = null;
try { if (isI(old) && CP(old) && CP(old).Type) type = String(CP(old).Type.value); } catch {}
const trail = sidebarTrail(old) || [];
if (!type && trail.length) { const first = trail[trail.length - 1].toLowerCase(); const key = Object.keys(SIDEBAR_TYPE).sort((a, b) => b.length - a.length).find(k => first.startsWith(k)); if (key) type = SIDEBAR_TYPE[key]; }
if (!type) { if (trail.length) notes.push("sidebar: no DS type for " + trail[trail.length - 1]); return; }
try { if (String(CP(sb).Type.value) !== type) sb.setProperties({ Type: type }); } catch (e) { notes.push("sidebar type " + type + ": " + e.message); return; }
const sb2 = fI(page, "*Sidebar*");
const seconds = sb2 ? sb2.findAll(n => isI(n) && /Sections \/ Second Level/.test(n.name)) : [];
for (const t of trail.slice(0, -1)) { const hit = seconds.find(s => { try { const v = CP(s)["Section Name"]; return v && String(v.value).split("|").pop().trim().toLowerCase() === t.toLowerCase(); } catch (e) { return false; } });
if (hit) { const hsn = String(CP(hit)["Section Name"].value); try { hit.setProperties({ State: "Active" }); } catch {}
const sb3 = fI(page, "*Sidebar*");
const sec = sb3 ? sb3.findAll(n => isI(n) && /Sections \/ Second Level/.test(n.name)).find(n => CP(n)["Section Name"] && String(CP(n)["Section Name"].value) === hsn) : null;
let leaf = "";
if (sec && t !== trail[0]) { const thirds = sec.findAll(n => isI(n) && /Third Level/.test(n.name) && n.visible); const want = trail[0].toLowerCase();
const tx = n => { const q = n.findOne(x => isT(x) && x.visible); return q ? CT(q).toLowerCase() : ""; };
const own = thirds.find(n => tx(n) === want);
for (const n of thirds) { try { n.setProperties({ State: n === own ? "Active" : "Default" }); } catch {} }
leaf = own ? " › " + trail[0] : " (\"" + trail[0] + "\" is not a DS sidebar item)"; }
notes.push("sidebar from the original: " + type + " › " + t + leaf); return; } }
notes.push("sidebar from the original: " + type);
}
function stripCardChrome(c, fullW) {
const r = typeof c.cornerRadius === "number" ? c.cornerRadius : 0, pad = Math.max(c.paddingTop || 0, c.paddingLeft || 0);
if (!hasStroke(c) || r < 8 || pad < 16 || c.width < 0.9 * fullW) return false;
if (c.parent && "children" in c.parent && c.parent.children.filter(s => s.visible !== false && s.name === c.name).length > 1) return false;
for (const p of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { c.setBoundVariable(p, null); } catch {} }
c.strokes = []; c.cornerRadius = 0; c.paddingTop = c.paddingRight = c.paddingBottom = c.paddingLeft = 0; return true;
}
async function buildIsland(scr, a, crumb) { const rn = n => rendered(n, scr);
const { nodes, plan } = a; const origW = a.W, origH = a.H, notes = [], N = t => notes.push(t);
const inInst = (n, top) => { for (let q = n.parent; q && q.id !== top.id; q = q.parent) if (isI(q)) return true; return false; };
for (const g of nodes.groups) { if (!("findAll" in g)) continue; for (const n of g.findAll(x => x.visible !== false && (x.layoutSizingHorizontal === "FIXED" || (x.layoutSizingHorizontal === "HUG" && x.type === "FRAME" && x.layoutMode !== "NONE")) && x.parent && x.parent.layoutMode === "VERTICAL" && !inInst(x, g))) {
const p = n.parent, inner = p.width - (p.paddingLeft || 0) - (p.paddingRight || 0); if (Math.abs(n.width - inner) <= 1) { try { n.setSharedPluginData("sumsub_island", "span", "1"); } catch {} } } }
const parent = scr.parent, x = scr.x, y = scr.y, idx = parent.children.indexOf(scr), name = scr.name;
const R = headerRegions(nodes.header, scr);
if (nodes.header2) { const R2 = headerRegions(nodes.header2, scr); if (R2.actions.length) R.actions = R2.actions; R.status = R.status || R2.status; R.crumb = R.crumb || R2.crumb; R.key = R.key || R2.key; R.addInfo = R.addInfo || R2.addInfo; }
const stackTexts = [nodes.header, nodes.header2, nodes.subheader].filter(Boolean).flatMap(h => h.findAll(t => isT(t) && t.visible && rendered(t, scr)).map(t => CT(t))).filter(Boolean);
const labelValue = {}; if (nodes.header2) for (const f of nodes.header2.findAll(n => n.type === "FRAME" && n.visible)) { const tx = vis(f).flatMap(k => isT(k) ? [k] : (k.findAll ? k.findAll(t => isT(t) && t.visible) : []));
if (tx.length === 2 && /^[A-Za-z][A-Za-z ]+$/.test(tx[0].characters.trim())) labelValue[tx[0].characters.trim().toLowerCase()] = tx[1].characters.trim(); }
const origId = (stackTexts.find(t => /^ID\s*:/i.test(t)) || null);
const hdr0 = nodes.header;
const cands = hdr0 ? hdr0.findAll(n => isI(n) && /^\*Button\*/.test(n.name) && rn(n) && n.visible) : [];
const carry = [];
for (const b of cands) { let vn = ""; try { const mc = await b.getMainComponentAsync(); vn = mc ? mc.name : ""; } catch {}
const t = fT(b); const lbl = t ? CT(t) : "";
const inActions = /Buttons/i.test(b.parent ? b.parent.name : "");
if ((lbl.length > 1 && !/^Button$/i.test(lbl) && (inActions || !/close|back/i.test(b.name))) || (inActions && /Icon Only/i.test(vn) && /Type=Secondary/i.test(vn))) carry.push(b); }
const pageSet = await figma.importComponentSetByKeyAsync("f907195876aad003b980b77d6e9471e9418a0941");
const variant = pageSet.children.find(c => /Ver=New/.test(c.name) && c.name.includes("Type=" + plan.pageType) && c.name.includes("Sandbox=" + (plan.sandbox ? "Yes" : "No")));
const page = variant.createInstance(); const slotOf = nm => page.findAll(n => isS(n)).find(s => s.name === nm); const instOf = nm => fI(page, nm);
parent.insertChild(Math.max(0, idx), page); page.x = x; page.y = y;
try { page.setSharedPluginData("sumsub_island", "origH", String(Math.round(scr.height))); } catch {}
instOf("Page / Body").setProperties({ "Content": plan.content });
instOf("Page / Body / Default").setProperties({ "Type": plan.width, "Show side content#23483:22": plan.sideContent || !!plan.sideRoom });
if (plan.sideRoom) { const sr = slotOf("Side content"); if (sr) { for (const q of [...sr.children]) { rm(q); } N("side column left empty, like the reference"); } }
const mainSlot = slotOf("Main content");
const mph = [...mainSlot.children];
if (plan.content.includes("Ghost") || plan.white) {
const icComp = await figma.importComponentByKeyAsync("3595d612ef3d886a2dd9a4744add8b74f4ac9606");
const wrapInIsland = nodesIn => {
for (const g of nodesIn) { try { for (const c of [g, ...vis(g)]) if (stripCardChrome(c, g.width)) N("no card in a card: " + g.name + " › " + c.name); } catch {} }
const ic = icComp.createInstance(); parent.appendChild(ic);
try { ic.setProperties({ "Heading#26638:9": false }); } catch {}
const slot = ic.findOne(n => isS(n) && n.name === "Slot");
const ph = [...slot.children]; nodesIn.forEach((g, i) => slot.insertChild(i, g)); for (const q of ph) { rm(q); }
const sl = ic.findOne(n => isS(n) && n.name === "Slot");
for (const k of sl.children) { fill(k); }
for (const k of sl.children) { try { if (k.type === "FRAME" && k.layoutMode && k.layoutMode !== "NONE" && k.layoutSizingVertical !== "HUG") { const h0 = Math.round(k.height); k.layoutSizingVertical = "HUG"; if (Math.abs(k.height - h0) > 1) N("hugs its content: " + k.name + " " + h0 + " → " + Math.round(k.height)); } } catch {} }
try { for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { sl.setBoundVariable(p, null); } catch {} }
sl.paddingTop = sl.paddingRight = sl.paddingBottom = sl.paddingLeft = 0; if (sl.children.length > 1) sl.itemSpacing = 16; } catch {}
try { sl.layoutSizingVertical = "HUG"; } catch {}
try { ic.layoutSizingVertical = "HUG"; } catch {}
return ic; };
const instAnc = g => { let top = null; for (let p = g.parent; p && p.id !== scr.id && p.type !== "PAGE"; p = p.parent) if (isI(p)) top = p; return top; };
const wrappers = new Map();
const kw = new Set(); nodes.groups = nodes.groups.map(g => { const w = instAnc(g); if (!w) return g; if (a.refRoot && refAll(a.refRoot, w.name).some(k => isI(k) && mainName(k) === mainName(w))) return kw.has(w.id) ? null : (kw.add(w.id), w); if (!wrappers.has(w.id)) wrappers.set(w.id, { node: w, name: w.name }); return g.clone(); }).filter(Boolean); if (kw.size) N("instance kept whole, as in the reference");
if (wrappers.size) N("groups in instance " + [...wrappers.values()].map(w => w.name).join(", ") + " — cloned out");
const bundles = []; let pending = [];
for (const g of nodes.groups) { if (isHeadingBlock(g)) { pending.push(g); continue; } bundles.push([...pending, g]); pending = []; }
if (pending.length) bundles.push(pending); { const mg = mergeSharedIslands(bundles, a.refRoot); if (mg.length < bundles.length) N("shared island (reference): " + mg.filter(b => b.length > 1).map(b => b.map(g => g.name).join(" + ")).join("; ")); bundles.length = 0; bundles.push(...mg); }
const cards = [];
for (const bundle of bundles) { if (plan.white) { cards.push(...bundle); continue; }
if (bundle.length === 1 && isGraphic(bundle[0])) { cards.push(bundle[0]); N("graphic " + bundle[0].name + " stays bare"); continue; }
const g0 = bundle[bundle.length - 1], rp = refPlacement(a.refRoot, g0.name) || (refIslandByKids(a.refRoot, g0) ? "island" : null);
if (rp === "bare") { for (const g of bundle) cards.push(g); N("reference: " + g0.name + " bare"); continue; }
if (rp === "island") { cards.push(wrapInIsland(bundle)); N("reference: " + g0.name + " in an island"); continue; }
if (bundle.length === 1 && !rp && refUnboxed(a.refRoot, bundle[0])) { const box0 = bundle[0]; for (const part of vis(box0)) cards.push(part.clone()); N("reference dropped the card " + box0.name + " — its parts go bare: " + vis(box0).map(p => p.name).join(", ")); try { box0.remove(); } catch (e) { N("could not remove " + box0.name); } continue; }
if (bundle.length === 1 && rp !== "split" && (cardLike(bundle[0]) || isCardLayout(bundle[0]))) { cards.push(bundle[0]); continue; }
if (bundle.length === 1 && (rp === "split" || isCardStack(bundle[0]))) {
const stack = bundle[0]; const flat = [];
for (const part of vis(stack)) { const c = part.clone(); const pp = refPlacement(a.refRoot, part.name);
if (pp === "bare" || (pp !== "island" && (cardLike(part) || isCardLayout(part)))) { cards.push(c); continue; }
flat.push(part.name); cards.push(wrapInIsland([c])); }
if (flat.length) N("split " + stack.name + " into parts; islands added for: " + flat.join(", "));
try { stack.remove(); } catch (e) { N("could not remove " + stack.name); }
continue; }
cards.push(wrapInIsland(bundle));
}
cards.forEach((ic, i) => mainSlot.insertChild(i, ic));
for (const w of wrappers.values()) { const wn = w.name; try { w.node.remove(); N("wrapper removed: " + wn); } catch {} }
} else if (nodes.groups[0]) {
mainSlot.insertChild(0, nodes.groups[0]);
}
for (const p of mph) { rm(p); }
for (const c of slotOf("Main content").children) { if (isGraphic(c)) continue; fill(c); try { if (c.layoutSizingVertical === "FILL") { c.layoutSizingVertical = "HUG"; N("hugs its content: " + c.name); } } catch {} }
try { slotOf("Main content").layoutSizingVertical = "FILL"; } catch {}
const intoAside = (node, which) => {
const asides = page.findAll(n => isI(n) && n.name === "Page / Body / Aside");
const as = which === "left" ? asides[0] : asides[asides.length - 1]; if (!as) { N("no Aside for " + which + " column"); return; }
if (fillOf(node)) { try { as.setProperties({ "Paddings": "No" }); } catch {} }
const as2 = page.findAll(n => isI(n) && n.name === "Page / Body / Aside"); const tgtAs = which === "left" ? as2[0] : as2[as2.length - 1];
const slot = tgtAs.findOne(n => isS(n) && n.name === "Content"); const ph = [...slot.children];
const nid = node.id, nname = node.name; slot.insertChild(0, node); for (const p of ph) { rm(p); }
const moved = page.findOne(n => n.id === nid) || page.findOne(n => n.name === nname);
if (moved) { fill(moved); try { moved.layoutSizingVertical = "FILL"; } catch (e) { try { moved.layoutSizingVertical = "HUG"; } catch (e2) {} } } };
const navFrom = L => { const tx = n => { const t = n.findOne(q => isT(q) && q.visible && CT(q)); return t ? CT(t) : ""; };
const on = n => { try { return Object.entries(CP(n)).some(([k, v]) => /^(State|Selected)/.test(k) && /active|yes|true/i.test(String(v.value))); } catch { return false; } };
const its = L.findAll(n => isI(n) && /item/i.test(n.name) && rn(n) && tx(n)).filter((n, i, a) => !a.some(m => m !== n && contains(m, n)));
const sl = () => page.findAll(n => isS(n) && n.name === "Items" && /1st level/.test(n.parent.name))[0], l2 = () => sl().children.filter(k => /2nd level/.test(k.name));
if (!its.length || !sl() || !l2().length) { N("nav: not filled from the original"); return; }
while (l2().length < its.length) sl().appendChild(l2()[0].clone());
l2().forEach((k, i) => { if (i >= its.length) { k.visible = false; return; } const cn = Object.keys(CP(k)).find(q => /^Category name/.test(q)); try { k.setProperties({ [cn]: tx(its[i]), Selected: on(its[i]) ? "Yes" : "No" }); } catch {} });
l2().forEach(k => { if (k.visible && k.children.some(c => c.height > k.height + 1)) try { k.layoutSizingVertical = "HUG"; N("nav: " + tx(k) + " wraps — the item hugs it"); } catch {} });
N("nav from the original: " + its.length + " items"); };
if (nodes.left) { if (plan.white) navFrom(nodes.left); else intoAside(nodes.left, "left"); }
if (a.sideMove) { const rs = fS(a.refRoot, "Side content")[0]; [...slotOf("Side content").children].forEach(rm); for (const [i, nm] of a.sideMove.entries()) { const I = slotOf("Main content").children.find(k => k.findOne && k.findOne(q => q.name === nm && q.visible)), o = I && I.findOne(q => q.name === nm && q.visible), rb = vis(rs).find(k => k.name === nm); if (!o || !rb) continue; const U = o.findAll(isT).map(t => t.characters); const RI = isI(I) && fI(a.refRoot, I.name), p = {}; for (const [k, v] of Object.entries(RI ? CP(RI) : {})) if (v.type === "BOOLEAN" && CP(I)[k] && CP(I)[k].value !== v.value) p[k] = v.value; if (Object.keys(p).length) I.setProperties(p); else o.visible = false; const c = rb.clone(); slotOf("Side content").insertChild(i, c); const T = c.findAll(isT); for (const [j, t] of T.entries()) if (T.length === U.length && t.characters !== U[j]) try { await figma.loadFontAsync(t.fontName); t.characters = U[j]; } catch {} } slotOf("Side content").children.forEach(fill); N("side from the reference: " + a.sideMove.join(", ")); }
if (nodes.right) {
if (plan.sideContent) { const sc = slotOf("Side content");
if (sc) { const ph = [...sc.children]; sc.insertChild(0, nodes.right); for (const p of ph) { rm(p); }
const sc2 = slotOf("Side content"), mv = sc2 && sc2.children[0];
if (mv) { try { if (mv.layoutMode && mv.layoutMode !== "NONE" && mv.layoutSizingVertical !== "HUG") { const h0 = Math.round(mv.height); mv.layoutSizingVertical = "HUG"; N("side column hugs its content: " + mv.name + " " + h0 + " → " + Math.round(mv.height)); } } catch {} } } }
else intoAside(nodes.right, "right");
try { await sideFromReference(page, a.refRoot, nodes.right.name, labelValue, notes); } catch (e) { N("side from reference: " + e.message); }
}
const getHdr = () => page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible); const hset = p => getHdr().setProperties(p);
const hslot = re => { const h = getHdr(); return h && h.findAll(n => isS(n)).find(s => re.test(s.name)); };
const fillSlot = (re, sources) => { const s = hslot(re); if (!s) { N("header has no slot " + re); return; } const ph = [...s.children];
sources.forEach((o, i) => { const c = o.clone(); s.insertChild(i, c); try { c.visible = true; } catch {} }); for (const q of ph) { rm(q); } };
const keepHdr = !a.refRoot && hdr0 && isI(hdr0) && !/^\*Header\*/.test(mainName(hdr0));
if (keepHdr) { const c = hdr0.clone(); parent.appendChild(c); c.visible = false; c.x = x; c.y = y; c.setSharedPluginData("sumsub_island", "hdrFor", page.id); N("header: the original's " + mainName(hdr0) + " is kept (no reference)"); }
else if (getHdr()) {
try { hset({ [TT]: plan.title || name, "Key#5362:0": !!R.key, [CTL]: !!R.copy,
[SI]: !!R.status, [SD]: !!R.addInfo }); } catch (e) { N("header props: " + e.message); }
if (R.key) { try { hset({ "↪ Key Name#6943:13": R.key }); } catch {} }
{ const hp = CP(getHdr()); for (const k in hp) { const b = k.split("#")[0], o = hp[k].type === "BOOLEAN" && !hp[k].value && hdr0.findOne(n => isI(n) && n.name === b && rn(n)); if (!o) continue; try { hset({ [k]: true }); const t = getHdr().findOne(n => isI(n) && n.name === b), p = {}, oc = CP(o); for (const q in oc) if (oc[q].type === "VARIANT" && CP(t)[q]) p[q] = oc[q].value; t.setProperties(p); N("header " + b + " from the original"); } catch {} } }
const bc = getHdr().findOne(n => isI(n) && /Breadcrumb/i.test(n.name)); const crumbText = R.crumb || crumb || refCrumb(a.refRoot);
if (bc && crumbText) { try { bc.setProperties({ "Name#6638:5": crumbText }); } catch {} }
else if (bc) { try { hset({ "Breadcrumbs#6913:0": false }); N("no breadcrumb — hidden"); } catch {} }
const rh = a.refRoot ? a.refRoot.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible) : null;
const refSlot = re => rh ? rh.findAll(n => isS(n) && re.test(n.name)).find(sl => sl.children.some(k => k.visible)) : null;
const refTitle = rh && CP(rh)[TT] ? String(CP(rh)[TT].value) : null;
const reuses = t => (t.match(/[A-Za-z0-9][\w.,:+-]{3,}/g) || []).some(tok => /\d/.test(tok) && stackTexts.some(o => o.includes(tok)));
if (refTitle && reuses(refTitle)) { try { const rc = CP(rh)[CTL]; hset(Object.assign({ [TT]: refTitle }, rc ? { [CTL]: !!rc.value } : {})); N("title from the reference: " + refTitle); } catch {} }
const fixTexts = async root => { for (const t of (root.findAll ? root.findAll(q => isT(q)) : [])) { const c = CT(t);
if (/^ID\s*:/i.test(c) && origId && c !== origId) { try { await figma.loadFontAsync(t.fontName); t.characters = origId; } catch {} } } };
const rInfo = refSlot(/^Info slot/i), rAdd = refSlot(/^Additional info/i);
if (rInfo) { try { hset({ [SI]: true });
const stT = R.status ? (isT(R.status) ? R.status : fT(R.status)) : null, stLbl = stT ? CT(stT) : null;
const src = vis(rInfo).map(k => { const t = k.findOne ? fT(k) : null;
return (/Status/i.test(k.name) && stLbl && t && CT(t) !== stLbl) ? R.status : k; });
fillSlot(/^Info slot/i, src);
const sc = labelValue["score"]; const s1 = hslot(/^Info slot/i);
if (sc && s1) for (const c of s1.children) if (/Counter/i.test(c.name)) { const t = fT(c); if (t && CT(t) !== sc) { try { await figma.loadFontAsync(t.fontName); t.characters = sc; } catch {} } }
N("info row from the reference" + (src.includes(R.status) ? ", status from the original" : "")); } catch (e) { N("ref info: " + e.message); } }
else if (R.status) { try { fillSlot(/^Info slot/i, [R.status]); } catch (e) { N("status: " + e.message); } }
if (rAdd) { try { hset({ [SD]: true }); fillSlot(/^Additional info/i, vis(rAdd));
const s2 = hslot(/^Additional info/i); if (s2) await fixTexts(s2); N("additional info from the reference"); } catch (e) { N("ref additional info: " + e.message); } }
else if (R.addInfo) { try { fillSlot(/^Additional info/i, vis(R.addInfo)); } catch (e) { N("additional info: " + e.message); } }
try { const tbOf = () => getHdr().findOne(n => /^\*Tab Basic\*/.test(n.name));
const wsOf = () => { const tb = tbOf(); return tb && tb.findAll(n => isS(n)).find(s => /Items wrapper/i.test(s.name)); };
if (tbOf() && plan.tabs.length) {
for (let guard = 0; guard < 12; guard++) { const ws = wsOf(); if (!ws) break; const its = ws.children.filter(n => /Tab Basic \/ Item/i.test(n.name));
if (its.length >= plan.tabs.length) break; ws.appendChild(its[its.length - 1].clone()); }
const items = tbOf().findAll(n => /Tab Basic \/ Item/i.test(n.name));
for (let i = 0; i < items.length; i++) { const it = items[i], c = plan.tabCnt[i]; try { if (i < plan.tabs.length) { it.visible = true; it.setProperties({ "Label text#4517:0": plan.tabs[i], "Selected": i === plan.tabSelected ? "true" : "false", "Counter#5190:0": !!c }); const nt = c && it.findOne(y => isT(y) && y.name === "Number"); if (nt && nt.characters !== c) { await figma.loadFontAsync(nt.fontName); nt.characters = c; } } else it.visible = false; } catch {} }
if (items.length < plan.tabs.length) N("header shows " + items.length + " of " + plan.tabs.length + " tabs"); }
} catch (e) { N("tabs: " + e.message); }
const acts0 = R.actions.length ? R.actions : carry, acts = []; { const seen = new Set(), isA = k => acts0.some(a => a.id === k.id); for (const b of acts0) { const p = b.parent; if (seen.has(p.id)) continue; seen.add(p.id); const ks = p.children.filter(k => k.visible !== false), mine = ks.filter(isA), i0 = ks.findIndex(k => k.id === mine[0].id), i1 = ks.findIndex(k => k.id === mine[mine.length - 1].id); ks.forEach((k, i) => { if (isA(k) || (i > i0 && i < i1 && /Divider/i.test(k.name))) acts.push(k); }); } }
if (acts.length) { try { hset({ [SA]: true }); if (!hslot(/Actions slot/i)) { hset({ [SA]: false }); N("the header has no actions slot — left off"); } else { fillSlot(/Actions slot/i, acts);
for (const c of [...hslot(/Actions slot/i).children]) { try { const tt = fT(c); if (tt && /^Button$/i.test(CT(tt))) c.remove(); } catch {} }
{ const hp = CP(getHdr()), taken = new Set(); for (const [re, pr] of [[/^Info slot/i, SI], [/^Additional info/i, SD]]) { const s = hslot(re); if (!s || !hp[pr] || hp[pr].value !== true) continue; for (const k of s.children) if (k.visible && k.findAll) for (const t of k.findAll(q => isT(q) && q.visible && CT(q))) taken.add(CT(t)); }
for (const c of [...hslot(/Actions slot/i).children]) { try { const t = c.findOne && c.findOne(q => isT(q) && q.visible && CT(q)), l = t ? CT(t) : ""; if (l && taken.has(l)) { N("action \"" + l + "\" already in the info rows"); c.remove(); } } catch {} } }
try { const hh = getHdr(), asl = hslot(/Actions slot/i); const inAsl = n => { let q = n.parent; while (q && q.id !== hh.id) { if (q.id === asl.id) return true; q = q.parent; } return false; }; const shownIn = n => { let q = n; while (q && q.id !== hh.id) { if (q.visible === false) return false; q = q.parent; } return true; }; const own = new Set(hh.findAll(n => isI(n) && /^(normal|small|large)\//.test(n.name) && shownIn(n) && !inAsl(n)).map(n => n.name)); for (const c of [...asl.children]) { try { if (c.findOne(q => isT(q) && q.visible && CT(q))) continue; const ic = c.findOne(q => isI(q) && /^(normal|small|large)\//.test(q.name)); if (ic && own.has(ic.name)) { N("the header has its own " + ic.name + " — copy removed"); c.remove(); } } catch {} } } catch {}
{ const s = hslot(/Actions slot/i), dv = k => /Divider/i.test(k.name), vk = () => vis(s); if (s) { let ks = vk(); while (ks.length && dv(ks[0])) { ks[0].remove(); ks = vk(); } while (ks.length && dv(ks[ks.length - 1])) { ks[ks.length - 1].remove(); ks = vk(); } } }
const asl2 = hslot(/Actions slot/i); if (asl2 && !asl2.children.some(k => k.visible)) { hset({ [SA]: false }); N("actions slot empty — left off"); } } } catch (e) { N("actions: " + e.message); } }
}
try { await carrySidebar(nodes.sidebar, page, notes); } catch (e) { N("sidebar: " + e.message); }
{ const spans = page.findAll(n => { try { return n.getSharedPluginData("sumsub_island", "span") === "1"; } catch (e) { return false; } }); let k = 0;
for (const n of spans) { try { n.setSharedPluginData("sumsub_island", "span", ""); if (n.layoutSizingHorizontal !== "FILL" && n.parent && n.parent.layoutMode === "VERTICAL") { n.layoutSizingHorizontal = "FILL"; k++; } } catch {} }
if (k) N("spanning blocks kept: " + k); }
for (const ov of nodes.overlays) { try { const ob = box(ov, scr); parent.appendChild(ov); ov.x = x + ob.x; ov.y = y + ob.y; } catch {} }
try { page.resize(origW, origH); } catch {}
try { const shown = new Set(page.findAll(t => isT(t) && t.visible).map(t => CT(t)));
const shownLow = new Set([...shown].map(t => t.toLowerCase()));
const lost = Object.entries(labelValue).filter(([k, v]) => !shown.has(v) && !shownLow.has(k)).map(([k, v]) => k + ": " + v); if (lost.length) N("header values not placed: " + lost.join(", ")); } catch {}
if (plan.white && nodes.left && nodes.left.findOne(n => /search/i.test(n.name) && rn(n))) try { const nv = fI(page, "Section navigation"); nv.setProperties({ [Object.keys(CP(nv)).find(q => /^Search/.test(q))]: true }); N("nav: search on, as in the original"); } catch {}
_idCache.clear();
const leftover = scr.findAll(n => (isT(n) ? CT(n) !== "" : isI(n)) && n.visible !== false && rn(n) &&
!contains(nodes.header, n) && !contains(nodes.header2, n) && !contains(nodes.sidebar, n) && !contains(nodes.subheader, n) && !(nodes.scrollbars || []).some(sb => contains(sb, n)) && !(plan.white && contains(nodes.left, n)));
if (leftover.length) {
return { page, kept: [...new Set(leftover.map(n => n.name))], notes }; }
rm(scr);
return { page, kept: [], notes };
}
function keepWholeCard(a, refP) {
const m = a.nodes.main; if (!m || a.nodes.table || a.nodes.groups.length < 2) return false; const rb = refP && refAll(refP, m.name)[0]; if (!cardLike(m) && !(rb && rb.parent.type === "SLOT")) return false;
if (refPlacement(refP, m.name) !== "bare") return false;
a.nodes.groups = [m]; return true;
}
function refSideOnly(P, a) {
const d = P ? fI(P, "Page / Body / Default") : null; const p = d && CP(d) ? CP(d)["Show side content#23483:22"] : null;
return !!p && p.value === true && !a.nodes.right && !a.nodes.left && !a.nodes.table && a.plan.content === "◼️ Main (Ghost)"; }
function refWidth(P) {
const d = P ? fI(P, "Page / Body / Default") : null; const t = d && CP(d) && CP(d).Type ? String(CP(d).Type.value) : "";
return /^(Full width|1084 max|1920 max)$/.test(t) ? t : null; }
function surfaceOf(refP, opts) {
const refG = refP ? refIsGrey(refP) : null, tbl = opts && opts.surface ? opts.surface === "grey" : null;
return { grey: tbl !== null ? tbl : refG, refGrey: refG, from: tbl !== null ? "table" : (refG === null ? null : "reference") }; }
function refIsGrey(P) {
const ms = fS(P, "Main content")[0]; if (!ms || !ms.absoluteBoundingBox) return null; const mb = ms.absoluteBoundingBox;
return P.findAll(n => n.visible && n.fills && n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false && !!n.absoluteBoundingBox &&
(() => { const c = n.fills[0].color; return c.r > 0.93 && c.r < 0.985 && Math.abs(c.r - c.b) < 0.03; })() &&
(() => { const b = n.absoluteBoundingBox; const ix = Math.max(0, Math.min(b.x + b.width, mb.x + mb.width) - Math.max(b.x, mb.x)), iy = Math.max(0, Math.min(b.y + b.height, mb.y + mb.height) - Math.max(b.y, mb.y)); return ix * iy > 0.4 * mb.width * mb.height; })()).length > 0;
}
async function migrateOne(scrId, refOverride, opts) {
const scr = await figma.getNodeByIdAsync(scrId); if (!scr) return { id: scrId, missing: true };
let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = refOverride || (m ? m[1] : null), name = scr.name;
_idCache.clear(); const a = analyze(scr);
if (!a.confident) return { id: scrId, name, stopped: "not confident", notes: a.notes };
let refP = null;
if (refId) { const ref = await figma.getNodeByIdAsync(refId);
if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
refP = isI(ref) && ref.name === "Page" ? ref : fI(ref, "Page"); } }
const wh = !!opts && opts.surface === "white"; if (refP && surfaceOf(refP, opts).grey === false && !wh) return { id: scrId, name, stopped: "white reference — run with { surface: \"white\" }", ref: refId };
if (wh) { a.plan.white = true; a.plan.content = a.nodes.left ? "◻️ Nav + Main (Default)" : "◻️ Main (Default)"; a.plan.sideContent = !!a.nodes.right; } if (wh && refP && !a.nodes.right && a.nodes.main) { const d = fI(refP, "Page / Body / Default"), rs = d && CP(d)["Show side content#23483:22"].value && fS(refP, "Side content")[0]; const mv = rs ? vis(rs).map(k => k.name).filter(nm => a.nodes.main.findOne(n => n.name === nm && n.visible)) : []; if (mv.length) a.plan.sideContent = !!(a.sideMove = mv); }
a.refRoot = refP; const whole = keepWholeCard(a, refP);
if (refP) { const t = CP(refP).Type; if (t && /Basic|Full screen page/.test(t.value)) a.plan.pageType = t.value;
const ms = fS(refP, "Main content")[0];
if (ms && !a.nodes.table) a.plan.width = refWidth(refP) || ((ms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max");
a.W = Math.round(refP.width); a.H = Math.round(refP.height); a.plan.sideRoom = refSideOnly(refP, a); }
const r = await buildIsland(scr, a, null);
return clean({ id: scrId, name: name.slice(0, 50), pageId: r.page.id, ref: refP ? refId : null, plan: [a.plan.pageType, a.plan.content, a.plan.width, a.plan.sideContent ? "side" : (a.plan.sideRoom ? "side: empty, like the reference" : "")].join(" | "),
kept: r.kept, notes: r.notes });
}
