// BUILD — call 1 of 2. Paste this file into use_figma and append:  return JSON.stringify(await migrateOne("<screen node id>", "<reference node id, optional>"));
// PLAN ONLY (read-only, run it first):  return JSON.stringify(await planOne("<screen node id>", "<reference node id, optional>"));
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
function sideBySide(n, scr) { return sideBySideList(vis(n), scr); }
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
function analyze(scr) {
const W = Math.round(scr.width), H = Math.round(scr.height), notes = [];
const all = scr.findAll(n => n.visible !== false && rendered(n, scr));
const sidebar = all.filter(n => { const b = box(n, scr); return b.x <= 2 && b.y <= 2 && b.h >= 0.8 * Math.min(H, 900) && b.w >= 44 && b.w <= 300 &&
(/sidebar|menu|navigation/i.test(n.name) || /Sidebar/.test(mainName(n))); }).sort((a, b) => b.height - a.height)[0] || null;
const sbW = sidebar ? Math.round(sidebar.width) : 0;
const header = all.filter(n => { const b = box(n, scr); return b.y <= 2 && b.h >= 40 && b.h <= 160 && b.x >= sbW - 2 && b.w >= 0.7 * (W - sbW) &&
(/header/i.test(n.name) || /Header/.test(mainName(n))); }).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
const hdrH = header ? Math.round(header.height) : 0;
let stackBottom = header ? box(header, scr).y + box(header, scr).h : 0;
const header2 = !header ? null : all.filter(n => { const b = box(n, scr); return !contains(header, n) && Math.abs(b.y - stackBottom) <= 8 && b.w >= 0.9 * (W - sbW) && b.h >= 40 && b.h <= 200 &&
(/header/i.test(n.name) || /Header/.test(mainName(n))) && "findOne" in n && !!n.findOne(x => x.type === "INSTANCE" && /^\*Button/.test(x.name)); }).sort((a, b) => b.height - a.height)[0] || null;
if (header2) stackBottom = box(header2, scr).y + box(header2, scr).h;
const subheader = all.filter(n => { const b = box(n, scr); return !contains(header, n) && !contains(header2, n) && b.y >= Math.min(hdrH, stackBottom) - 2 && b.y <= stackBottom + 32 && b.h >= 32 && b.h <= 72 &&
"findOne" in n && !!n.findOne(x => /^\*Tab Basic\*|Tab( \/)? Basic \/ Item/.test(x.name)); }).sort((a, b) => b.width - a.width)[0] || null;
const scrollbars = all.filter(n => n.type === "INSTANCE" && /Scroll \/ Thumb/i.test(n.name + " " + mainName(n)));
const isChrome = n => contains(header, n) || contains(header2, n) || contains(sidebar, n) || contains(subheader, n) || scrollbars.some(sb => contains(sb, n));
let cols = sideBySideList(vis(scr).filter(c => !isChrome(c)), scr), container = cols ? scr : null;
if (!cols) container = all.filter(n => { const b = box(n, scr); return b.y >= hdrH - 2 && b.x >= sbW - 2 && b.w >= 0.5 * (W - sbW) && b.h >= 0.25 * (H - hdrH) &&
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
if (k.length === 1 && "children" in k[0]) { inner = unwrapSingle(k[0]); k = inner.type === "INSTANCE" ? [inner] : vis(inner).filter(x => !isChrome(x)); }
const hasChrome = vis(inner).some(isChrome) || (!!subheader && contains(inner, subheader)); if (isCardLayout(inner) && !hasChrome) groups = [inner];          // a layout of cards stays whole
else groups = (k.length >= 2 && k.every(x => x.width >= 0.6 * inner.width)) ? k : (hasChrome && k.length ? k : [inner]); } }
const isOv = n => n.type === "INSTANCE" && /Toast|Dropdown|Modal|Drawer/i.test(n.name + " " + mainName(n));
const hasOvAncestor = n => { let p = n.parent; while (p && p.id !== scr.id && p.type !== "PAGE") { if (isOv(p)) return true; p = p.parent; } return false; };
const overlays = all.filter(n => isOv(n) && !hasOvAncestor(n) && !contains(header, n) && !contains(main, n) && !contains(left, n) && !contains(right, n));
const hasClose = header ? !!header.findOne(n => /close/i.test(n.name) && rendered(n, scr)) : false;
const fullHdr = header ? /Full Screen|Header-levels|Fullscreen|Case page header|AP page header/i.test(header.name + " " + mainName(header)) : false;
const pageType = sbW && sbW <= 60 ? "Full screen page" : sbW >= 200 ? "Basic" : (hasClose || fullHdr ? "Full screen page" : "Basic");
let content;
const fitsSide = !!right && !!main && (main.width + right.width) <= 1084;   // form + column inside 1084 (KYC editor 640+380)
if (left && right) { content = "◼️ Nav + Main + Right (Ghost)"; notes.push("left AND right column — confirm the left one is section navigation"); }
else if (left) content = "◼️ Left + Main (Ghost)";
else if (right && !fitsSide) content = "◼️ Main + Right (Ghost)";           // wide main + inspector column (Case page 964+424)
else content = "◼️ Main (Ghost)";             // everything sits in islands on grey — tables and empty states too (after-refs 29.09)
if (!header) notes.push("no header found");
if (!main) notes.push("no main content found");
const width = table ? (W >= 1900 ? "1920 max" : "Full width") : (content === "◼️ Main + Right (Ghost)" ? "Full width" : "1084 max");
let title = null; if (header) { const t = header.findOne(n => n.type === "TEXT" && n.name === "Title" && rendered(n, scr)) ||
header.findAll(n => n.type === "TEXT" && rendered(n, scr) && n.characters.trim().length > 1).sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0]; if (t) title = t.characters.trim(); }
const tabSrc = [header, subheader].filter(Boolean);
const tabPairs = tabSrc.flatMap(h => h.findAll(n => n.type === "INSTANCE" && /Tab( \/)? Basic \/ Item/i.test(n.name) && rendered(n, scr)))
.map(t => { const x = t.findOne(y => y.type === "TEXT" && y.visible); const sp = t.componentProperties && t.componentProperties.Selected;
return { label: x ? x.characters : null, sel: !!sp && String(sp.value) === "true" }; }).filter(t => t.label);
const tabs = tabPairs.map(t => t.label), tabSelected = Math.max(0, tabPairs.findIndex(t => t.sel));
let sandbox = false; if (header) { const s = header.findOne(n => n.type === "TEXT" && /sandbox mode/i.test(n.characters)); if (s) { const hb = header.absoluteBoundingBox, tb = s.absoluteBoundingBox; sandbox = rendered(s, scr) && s.visible && !!hb && !!tb && tb.y >= hb.y - 1 && tb.y + tb.height <= hb.y + hb.height + 1; } }   // v3.236: the flag text below the header edge is not shown (Complete to-do list: y 58 in a 56 header) — no sandbox
const plan = { pageType, content, width, sideContent: !!right && content === "◼️ Main (Ghost)", sandbox, title, tabs, tabSelected };
return { W, H, nodes: { sidebar, header, header2, subheader, scrollbars, main, left, right, groups, overlays, table }, plan, confident: !!header && !!main && notes.length === 0, notes,
report: { screen: scr.name, id: scr.id, size: W + "×" + H, oldSidebar: sbW || null, header: header ? header.name + " (" + header.type + ")" : null, subheader: subheader ? subheader.name : null,
main: main ? main.name : null, left: left ? left.name : null, right: right ? right.name : null,
islands: content.includes("Ghost") ? groups.filter(g => !isHeadingBlock(g)).map(g => g.name) : [], table, overlays: overlays.map(o => o.name) } };
}
function headerRegions(h, scr) {
if (!h) return { actions: [] };
const inA = (n, re) => { let q = n.parent; while (q && q.id !== h.id) { if (re.test(q.name)) return q; q = q.parent; } return null; };
const T = h.findAll(n => n.type === "TEXT" && n.visible && rendered(n, scr));
const cr = T.find(t => inA(t, /Breadcrumb/i) && t.characters.trim().length > 1 && !/^Section name$/i.test(t.characters.trim()));
const keyT = T.find(t => /^Key name$/i.test(t.name) && !inA(t, /Additional info/i));
const status = h.findOne(n => n.id !== h.id && /status/i.test(n.name) && n.visible && rendered(n, scr) && !inA(n, /status/i)) || null;
const addInfo = h.findOne(n => /^Additional info$/i.test(n.name) && "children" in n && n.visible && rendered(n, scr)) || null;
const copy = !!h.findOne(n => n.type === "INSTANCE" && /^\*Button\*/.test(n.name) && n.visible && rendered(n, scr) && /Title \+ button/i.test(n.parent.name));
const actions = h.findAll(n => n.type === "INSTANCE" && /^\*Button( AI)?\*/.test(n.name) && n.visible && rendered(n, scr) &&
!!inA(n, /Actions/i) && !inA(n, /Additional info/i) && !inA(n, /\*Button/));
return { crumb: cr ? cr.characters.trim() : null, key: keyT ? keyT.characters.trim() : null, status, addInfo, copy, actions };
}
function refPlacement(refRoot, name) {
if (!refRoot) return null;
const n = refRoot.findOne(x => x.name === name && x.visible); if (!n) return null;
let q = n.parent; while (q && q.id !== refRoot.id) { if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return "island"; q = q.parent; }
return ("findOne" in n && n.findOne(x => x.type === "INSTANCE" && x.name === "Page / Body / IslandCard")) ? "split" : "bare";
}
// Blocks that sit in ONE island in the reference go into one island here (TM Settings / Create a VASP: Name, the fields and the
// Button bar share one IslandCard in 283:31704 — wrapped one by one they became three islands)
function refIslandOf(refRoot, name) {
if (!refRoot) return null;
const n = refRoot.findOne(x => x.name === name && x.visible); if (!n) return null;
for (let q = n.parent; q && q.id !== refRoot.id; q = q.parent) if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return q.id;
return null;
}
// A block missing from the reference by name whose children all sit in ONE reference island goes into an island
// (TM Settings / Verify your VASP: our card `.Content` = the reference's island › `Content` holding the same two blocks)
function refIslandByKids(refRoot, g) {   // v3.237: through single wrappers; names that repeat in the reference (every island has a "Heading") don't vote
if (!refRoot || !("children" in g)) return null;
let cur = g; for (let d = 0; d < 3; d++) { const k = cur.children.filter(x => x.visible !== false); if (k.length === 1 && k[0].type === "FRAME" && "children" in k[0]) cur = k[0]; else break; }
const kids = cur.children.filter(k => k.visible !== false); if (!kids.length) return null;
const ids = []; for (const k of kids) { const all = refRoot.findAll(x => x.name === k.name && x.visible); if (!all.length) return null; if (all.length > 1) continue;
let isl = null; for (let q = all[0].parent; q && q.id !== refRoot.id; q = q.parent) if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") { isl = q.id; break; } if (!isl) return null; ids.push(isl); }
return ids.length && ids.every(id => id === ids[0]) ? ids[0] : null;
}
// v3.235: the designer dropped a wrapper card — our card isn't in the reference by name, but the blocks inside it sit in the
// reference's main column on the grey, outside any island or card (Complete to-do list: .Content held the title, the alert,
// six Checklist row cards and the button; the reference shows all of them bare) → its parts go over bare, the card goes
function refUnboxed(refRoot, g) {
if (!refRoot || !cardLike(g) || refPlacement(refRoot, g.name) || refIslandByKids(refRoot, g) || !("findAll" in g)) return false;
const ms = refRoot.findAll(n => n.type === "SLOT" && n.name === "Main content")[0]; if (!ms) return false;
const names = [...new Set(g.findAll(x => x.visible !== false && x.type === "INSTANCE").map(x => x.name))];
const wrapped = y => { for (let q = y.parent; q && q.id !== ms.id; q = q.parent) { if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return true; if (q.type === "FRAME" && isCard(q)) return true; } return false; };
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
const h = refRoot.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name) && n.visible); if (!h) return null;
const bc = h.findOne(n => n.type === "INSTANCE" && /Breadcrumb/i.test(n.name) && n.visible); if (!bc) return null;
const t = bc.findAll(n => n.type === "TEXT" && n.visible).map(n => n.characters.trim()).find(s => s.length > 1 && s !== "/");
return t && !/^Section name$/i.test(t) ? t : null;
}
async function sideFromReference(page, refRoot, colName, labelValue, notes) {
if (!refRoot) return;
let col = page.findOne(n => n.name === colName && n.visible); if (!col || !("children" in col)) return;
const refMain = refRoot.findAll(n => n.type === "SLOT" && /^(Main content|Side content)$/.test(n.name));
const refCol = refMain.flatMap(sl => sl.children).find(k => k.visible && /right column|side content/i.test(k.name)) ||
refRoot.findAll(n => n.type === "SLOT" && n.name === "Content" && n.parent && /Aside/.test(n.parent.name)).flatMap(sl => sl.children).find(k => k.visible);
if (!refCol || !("children" in refCol)) return;
const firstText = n => { const t = n.type === "TEXT" ? n : (n.findOne ? n.findOne(q => q.type === "TEXT" && q.visible) : null); return t ? t.characters.trim() : ""; };
const padOf = n => (n.paddingTop || 0) + (n.paddingLeft || 0);
const refBlocks = refCol.children.filter(k => k.visible);
const sectioned = padOf(refCol) === 0 && refBlocks.length >= 2 && refBlocks.every(k => padOf(k) > 0);
if (sectioned) {
let as = col.parent; while (as && !(as.type === "INSTANCE" && as.name === "Page / Body / Aside")) as = as.parent;
if (as && padOf(as) > 0) { try { as.setProperties({ "Paddings": "No" }); } catch (e) { notes.push("aside paddings: " + e.message); } }
col = page.findOne(n => n.name === colName && n.visible);                 // the variant change re-creates the subtree
col.itemSpacing = refCol.itemSpacing || 0;
notes.push("side column: flush sections as in the reference");
}
if (col.type === "INSTANCE") { notes.push("side column is a component instance — its own blocks stay as they are"); return; }
const sectionLike = async (rb) => {                                           // an empty frame with the reference section's layout and paint
const w = figma.createFrame(); w.name = rb.name; w.layoutMode = "VERTICAL"; w.fills = [];
for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) w[k] = rb[k] || 0;
try { w.strokes = JSON.parse(JSON.stringify(rb.strokes || [])); w.strokeAlign = rb.strokeAlign;
for (const k of ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"]) w[k] = rb[k]; } catch (e) {}
const bv = rb.boundVariables || {};
for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) { if (!bv[k]) continue;
try { let v = await figma.variables.getVariableByIdAsync(bv[k].id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); if (v) w.setBoundVariable(k, v); } catch (e) {} }
return w; };
let at = 0; const used = new Set();   // a block already matched or cloned is not matched again (the reference's Assignee section and Transaction details section share the name .Case page checklist)
for (const rb of refBlocks) {
const ft = firstText(rb).toLowerCase(), free = k => k.visible && !used.has(k.id);
const mine = col.children.find(k => free(k) && ft && (k.name.trim().toLowerCase() === ft || firstText(k).toLowerCase() === ft)) || col.children.find(k => free(k) && k.name === rb.name && !ft);
if (mine) { used.add(mine.id);
if (sectioned && padOf(mine) === 0 && mine.name !== rb.name) {
const w = await sectionLike(rb), mid = mine.id; col.insertChild(Math.max(0, col.children.findIndex(k => k.id === mid)), w);
try { w.layoutSizingHorizontal = "FILL"; w.layoutSizingVertical = "HUG"; } catch (e) {}
const m2 = col.children.find(k => k.id === mid) || col.findOne(k => k.id === mid); w.appendChild(m2);
try { m2.layoutSizingHorizontal = "FILL"; } catch (e) {}
notes.push("side block in a section like the reference: " + m2.name);
used.add(w.id); at = col.children.findIndex(k => k.id === w.id) + 1;
} else at = col.children.findIndex(k => k.id === mine.id) + 1;
continue; }
const c = rb.clone(); col.insertChild(Math.min(at, col.children.length), c); at++; used.add(c.id);
try { c.layoutSizingHorizontal = "FILL"; } catch (e) {}
const T = c.findAll(q => q.type === "TEXT" && q.visible);
for (let i = 0; i < T.length - 1; i++) { const v = labelValue[T[i].characters.trim().toLowerCase()];
if (v && T[i + 1].characters.trim() !== v) { try { await figma.loadFontAsync(T[i + 1].fontName); T[i + 1].characters = v; } catch (e) {} } }
notes.push("side block from the reference: " + (firstText(rb) || rb.name));
}
}
// v3.232: the old screen's place in the navigation is data from the original — the sidebar section and the active item carry over
// (TM Settings: the old detached sidebar had Transactions › Settings › Travel Rule quick start active; the new Page showed Dashboard)
const SIDEBAR_TYPE = { "dashboard": "Dashboard", "summy ai copilot": "Summy AI Copilot", "applicants": "Applicants", "integrations": "Integrations", "transactions": "Transactions monitoring", "case management": "Case management", "client lists": "Client lists", "statistics": "Statistics", "reports": "Reports", "billing": "Billing", "settings": "Settings", "tasks": "Tasks", "operator": "Operator", "review panel": "Reviews", "reviews": "Reviews", "mission control": "Mission control", "admin area": "Admin area", "dev space": "Dev space", "marketplace": "Marketplace" };
function sidebarTrail(old) {
if (!old || !("findAll" in old)) return null;
const isActive = n => { try { return n.type === "INSTANCE" && n.componentProperties && n.componentProperties.State && String(n.componentProperties.State.value) === "Active"; } catch (e) { return false; } };
const depthOf = n => { let d = 0; for (let q = n; q && q.id !== old.id; q = q.parent) d++; return d; };
const act = old.findAll(n => n.visible !== false && isActive(n) && /Menu Item|Sections/i.test(n.name)).sort((p, q) => depthOf(q) - depthOf(p));
if (!act.length) return null;
const txt = n => { const t = n.type === "TEXT" ? n : n.findOne(q => q.type === "TEXT" && q.visible); return t ? t.characters.trim() : ""; };
const trail = [txt(act[0])];
for (let q = act[0].parent; q && q.id !== old.id; q = q.parent) if (/Sections/i.test(q.name)) { const row = q.findOne(x => /Menu Item \/ (First|Second) Level/i.test(x.name)); const t = row ? txt(row) : txt(q); if (t && t !== trail[trail.length - 1]) trail.push(t); }
return trail.filter(Boolean);
}
async function carrySidebar(old, page, notes) {
const sb = page.findOne(n => n.type === "INSTANCE" && n.name === "*Sidebar*"); if (!sb || !old) return;
let type = null;
try { if (old.type === "INSTANCE" && old.componentProperties && old.componentProperties.Type) type = String(old.componentProperties.Type.value); } catch (e) {}
const trail = sidebarTrail(old) || [];
if (!type && trail.length) { const first = trail[trail.length - 1].toLowerCase(); const key = Object.keys(SIDEBAR_TYPE).sort((a, b) => b.length - a.length).find(k => first.startsWith(k)); if (key) type = SIDEBAR_TYPE[key]; }
if (!type) { if (trail.length) notes.push("sidebar: no DS type for " + trail[trail.length - 1]); return; }
try { if (String(sb.componentProperties.Type.value) !== type) sb.setProperties({ Type: type }); } catch (e) { notes.push("sidebar type " + type + ": " + e.message); return; }
const sb2 = page.findOne(n => n.type === "INSTANCE" && n.name === "*Sidebar*");
const seconds = sb2 ? sb2.findAll(n => n.type === "INSTANCE" && /Sections \/ Second Level/.test(n.name)) : [];
for (const t of trail.slice(0, -1)) { const hit = seconds.find(s => { try { const v = s.componentProperties["Section Name"]; return v && String(v.value).split("|").pop().trim().toLowerCase() === t.toLowerCase(); } catch (e) { return false; } });
if (hit) { const hsn = String(hit.componentProperties["Section Name"].value); try { hit.setProperties({ State: "Active" }); } catch (e) {}
const sb3 = page.findOne(n => n.type === "INSTANCE" && n.name === "*Sidebar*");
const sec = sb3 ? sb3.findAll(n => n.type === "INSTANCE" && /Sections \/ Second Level/.test(n.name)).find(n => n.componentProperties["Section Name"] && String(n.componentProperties["Section Name"].value) === hsn) : null;
let leaf = "";
if (sec && t !== trail[0]) { const thirds = sec.findAll(n => n.type === "INSTANCE" && /Third Level/.test(n.name) && n.visible); const want = trail[0].toLowerCase();
const tx = n => { const q = n.findOne(x => x.type === "TEXT" && x.visible); return q ? q.characters.trim().toLowerCase() : ""; };
const own = thirds.find(n => tx(n) === want);
for (const n of thirds) { try { n.setProperties({ State: n === own ? "Active" : "Default" }); } catch (e) {} }
leaf = own ? " › " + trail[0] : " (\"" + trail[0] + "\" is not among the DS sidebar items — no third-level item marked active)"; }
notes.push("sidebar from the original: " + type + " › " + t + leaf); return; } }
notes.push("sidebar from the original: " + type);
}
function stripCardChrome(c, fullW) {
const r = typeof c.cornerRadius === "number" ? c.cornerRadius : 0, pad = Math.max(c.paddingTop || 0, c.paddingLeft || 0);
if (!hasStroke(c) || r < 8 || pad < 16 || c.width < 0.9 * fullW) return false;
if (c.parent && "children" in c.parent && c.parent.children.filter(s => s.visible !== false && s.name === c.name).length > 1) return false;
for (const p of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { c.setBoundVariable(p, null); } catch (e) {} }
c.strokes = []; c.cornerRadius = 0; c.paddingTop = c.paddingRight = c.paddingBottom = c.paddingLeft = 0; return true;
}
async function buildIsland(scr, a, crumb) {
const { nodes, plan } = a; const origW = a.W, origH = a.H, notes = [];
// v3.236: a FIXED block that spanned its parent in the old screen (the six Checklist rows: 608 in a 608 column) keeps spanning after the move — marked here, set to FILL once the page is built
const inInst = (n, top) => { for (let q = n.parent; q && q.id !== top.id; q = q.parent) if (q.type === "INSTANCE") return true; return false; };
for (const g of nodes.groups) { if (!("findAll" in g)) continue; for (const n of g.findAll(x => x.visible !== false && x.layoutSizingHorizontal === "FIXED" && x.parent && x.parent.layoutMode === "VERTICAL" && !inInst(x, g))) {
const p = n.parent, inner = p.width - (p.paddingLeft || 0) - (p.paddingRight || 0); if (Math.abs(n.width - inner) <= 1) { try { n.setSharedPluginData("sumsub_island", "span", "1"); } catch (e) {} } } }
const parent = scr.parent, x = scr.x, y = scr.y, idx = parent.children.indexOf(scr), name = scr.name;
const R = headerRegions(nodes.header, scr);
if (nodes.header2) { const R2 = headerRegions(nodes.header2, scr); if (R2.actions.length) R.actions = R2.actions; R.status = R.status || R2.status; R.crumb = R.crumb || R2.crumb; R.key = R.key || R2.key; R.addInfo = R.addInfo || R2.addInfo; }
const stackTexts = [nodes.header, nodes.header2, nodes.subheader].filter(Boolean).flatMap(h => h.findAll(t => t.type === "TEXT" && t.visible && rendered(t, scr)).map(t => t.characters.trim())).filter(Boolean);
const labelValue = {}; if (nodes.header2) for (const f of nodes.header2.findAll(n => n.type === "FRAME" && n.visible)) { const tx = f.children.filter(k => k.visible).flatMap(k => k.type === "TEXT" ? [k] : (k.findAll ? k.findAll(t => t.type === "TEXT" && t.visible) : []));
if (tx.length === 2 && /^[A-Za-z][A-Za-z ]+$/.test(tx[0].characters.trim())) labelValue[tx[0].characters.trim().toLowerCase()] = tx[1].characters.trim(); }
const origId = (stackTexts.find(t => /^ID\s*:/i.test(t)) || null);
const hdr0 = nodes.header;
const cands = hdr0 ? hdr0.findAll(n => n.type === "INSTANCE" && /^\*Button\*/.test(n.name) && rendered(n, scr) && n.visible) : [];
const carry = [];
for (const b of cands) { let vn = ""; try { const mc = await b.getMainComponentAsync(); vn = mc ? mc.name : ""; } catch (e) {}
const t = b.findOne(q => q.type === "TEXT" && q.visible); const lbl = t ? t.characters.trim() : "";
const inActions = /Buttons/i.test(b.parent ? b.parent.name : "");
if ((lbl.length > 1 && !/^Button$/i.test(lbl) && (inActions || !/close|back/i.test(b.name))) || (inActions && /Icon Only/i.test(vn) && /Type=Secondary/i.test(vn))) carry.push(b); }
const pageSet = await figma.importComponentSetByKeyAsync("f907195876aad003b980b77d6e9471e9418a0941");
const variant = pageSet.children.find(c => /Ver=New/.test(c.name) && c.name.includes("Type=" + plan.pageType) && c.name.includes("Sandbox=" + (plan.sandbox ? "Yes" : "No")));
const page = variant.createInstance();
parent.insertChild(Math.max(0, idx), page); page.x = x; page.y = y; page.name = name;
page.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body").setProperties({ "Content": plan.content });
page.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body / Default").setProperties({ "Type": plan.width, "Show side content#23483:22": plan.sideContent });
const mainSlot = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
const mph = [...mainSlot.children];
if (plan.content.includes("Ghost")) {
const icComp = await figma.importComponentByKeyAsync("3595d612ef3d886a2dd9a4744add8b74f4ac9606");
const wrapInIsland = nodesIn => {                                       // fill the island BEFORE it goes into the slot
for (const g of nodesIn) { try { for (const c of [g, ...vis(g)]) if (stripCardChrome(c, g.width)) notes.push("no card in a card: " + g.name + " › " + c.name); } catch (e) {} }
const ic = icComp.createInstance(); parent.appendChild(ic);
try { ic.setProperties({ "Heading#26638:9": false }); } catch (e) {}   // the block brings its own title (Block Title / Title)
const slot = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
const ph = [...slot.children]; nodesIn.forEach((g, i) => slot.insertChild(i, g)); for (const q of ph) { try { q.remove(); } catch (e) {} }
const sl = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
for (const k of sl.children) { try { k.layoutSizingHorizontal = "FILL"; } catch (e) {} }
for (const k of sl.children) { try { if (k.type === "FRAME" && k.layoutMode && k.layoutMode !== "NONE" && k.layoutSizingVertical !== "HUG") { const h0 = Math.round(k.height); k.layoutSizingVertical = "HUG"; if (Math.abs(k.height - h0) > 1) notes.push("hugs its content: " + k.name + " " + h0 + " → " + Math.round(k.height)); } } catch (e) {} }
try { for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { sl.setBoundVariable(p, null); } catch (e) {} }
sl.paddingTop = sl.paddingRight = sl.paddingBottom = sl.paddingLeft = 0; if (sl.children.length > 1) sl.itemSpacing = 16; } catch (e) {}
try { sl.layoutSizingVertical = "HUG"; } catch (e) {}                  // island ships FIXED 153 with a FILL slot — HUG both
try { ic.layoutSizingVertical = "HUG"; } catch (e) {}
return ic; };
const instAnc = g => { let top = null; for (let p = g.parent; p && p.id !== scr.id && p.type !== "PAGE"; p = p.parent) if (p.type === "INSTANCE") top = p; return top; };
const wrappers = new Map();
nodes.groups = nodes.groups.map(g => { const w = instAnc(g); if (!w) return g; if (!wrappers.has(w.id)) wrappers.set(w.id, { node: w, name: w.name }); return g.clone(); });
if (wrappers.size) notes.push("groups inside instance " + [...wrappers.values()].map(w => w.name).join(", ") + " — cloned out");
const bundles = []; let pending = [];
for (const g of nodes.groups) { if (isHeadingBlock(g)) { pending.push(g); continue; } bundles.push([...pending, g]); pending = []; }
if (pending.length) bundles.push(pending); { const mg = mergeSharedIslands(bundles, a.refRoot); if (mg.length < bundles.length) notes.push("one island for blocks that share one in the reference: " + mg.filter(b => b.length > 1).map(b => b.map(g => g.name).join(" + ")).join("; ")); bundles.length = 0; bundles.push(...mg); }
const cards = [];
for (const bundle of bundles) {
const g0 = bundle[bundle.length - 1], rp = refPlacement(a.refRoot, g0.name) || (refIslandByKids(a.refRoot, g0) ? "island" : null);
if (rp === "bare") { for (const g of bundle) cards.push(g); notes.push("reference: " + g0.name + " bare"); continue; }
if (rp === "island") { cards.push(wrapInIsland(bundle)); notes.push("reference: " + g0.name + " in an island"); continue; }
if (bundle.length === 1 && !rp && refUnboxed(a.refRoot, bundle[0])) { const box0 = bundle[0]; for (const part of vis(box0)) cards.push(part.clone()); notes.push("reference dropped the card " + box0.name + " — its parts go bare: " + vis(box0).map(p => p.name).join(", ")); try { box0.remove(); } catch (e) { notes.push("could not remove " + box0.name); } continue; }
if (bundle.length === 1 && rp !== "split" && (cardLike(bundle[0]) || isCardLayout(bundle[0]))) { cards.push(bundle[0]); continue; }
if (bundle.length === 1 && (rp === "split" || isCardStack(bundle[0]))) {
const stack = bundle[0]; const flat = [];
for (const part of vis(stack)) { const c = part.clone(); const pp = refPlacement(a.refRoot, part.name);
if (pp === "bare" || (pp !== "island" && (cardLike(part) || isCardLayout(part)))) { cards.push(c); continue; }
flat.push(part.name); cards.push(wrapInIsland([c])); }
if (flat.length) notes.push("split " + stack.name + " into parts; islands added for: " + flat.join(", "));
try { stack.remove(); } catch (e) { notes.push("could not remove the original " + stack.name + " — guard will keep the source"); }
continue; }
cards.push(wrapInIsland(bundle));
}
cards.forEach((ic, i) => mainSlot.insertChild(i, ic));
for (const w of wrappers.values()) { const wn = w.name; try { w.node.remove(); notes.push("wrapper removed: " + wn); } catch (e) {} }
} else if (nodes.groups[0]) {
mainSlot.insertChild(0, nodes.groups[0]);                               // (unused since 29.09 — every plan is Ghost)
}
for (const p of mph) { try { p.remove(); } catch (e) {} }
for (const c of page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content").children) { try { c.layoutSizingHorizontal = "FILL"; } catch (e) {} try { if (c.layoutSizingVertical === "FILL") { c.layoutSizingVertical = "HUG"; notes.push("hugs its content (an old row's grow became vertical FILL): " + c.name); } } catch (e) {} }
try { page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content").layoutSizingVertical = "FILL"; } catch (e) {}
const intoAside = (node, which) => {
const asides = page.findAll(n => n.type === "INSTANCE" && n.name === "Page / Body / Aside");
const as = which === "left" ? asides[0] : asides[asides.length - 1]; if (!as) { notes.push("no Aside for " + which + " column"); return; }
if (fillOf(node)) { try { as.setProperties({ "Paddings": "No" }); } catch (e) {} }
const as2 = page.findAll(n => n.type === "INSTANCE" && n.name === "Page / Body / Aside"); const tgtAs = which === "left" ? as2[0] : as2[as2.length - 1];
const slot = tgtAs.findOne(n => n.type === "SLOT" && n.name === "Content"); const ph = [...slot.children];
const nid = node.id, nname = node.name; slot.insertChild(0, node); for (const p of ph) { try { p.remove(); } catch (e) {} }
const moved = page.findOne(n => n.id === nid) || page.findOne(n => n.name === nname);          // slot insert invalidates proxies
if (moved) { try { moved.layoutSizingHorizontal = "FILL"; } catch (e) {} try { moved.layoutSizingVertical = "FILL"; } catch (e) { try { moved.layoutSizingVertical = "HUG"; } catch (e2) {} } } };
if (nodes.left) intoAside(nodes.left, "left");
if (nodes.right) {
if (plan.sideContent) { const sc = page.findAll(n => n.type === "SLOT").find(s => s.name === "Side content");
if (sc) { const ph = [...sc.children]; sc.insertChild(0, nodes.right); for (const p of ph) { try { p.remove(); } catch (e) {} }
const sc2 = page.findAll(n => n.type === "SLOT").find(s => s.name === "Side content"), mv = sc2 && sc2.children[0];   // v3.230: the old column's FIXED height (865) grew the page to 977 — the column hugs its content
if (mv) { try { if (mv.layoutMode && mv.layoutMode !== "NONE" && mv.layoutSizingVertical !== "HUG") { const h0 = Math.round(mv.height); mv.layoutSizingVertical = "HUG"; notes.push("side column hugs its content: " + mv.name + " " + h0 + " → " + Math.round(mv.height)); } } catch (e) {} } } }
else intoAside(nodes.right, "right");
try { await sideFromReference(page, a.refRoot, nodes.right.name, labelValue, notes); } catch (e) { notes.push("side from reference: " + e.message); }
}
const getHdr = () => page.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name) && n.visible);
const hslot = re => { const h = getHdr(); return h && h.findAll(n => n.type === "SLOT").find(s => re.test(s.name)); };
const fillSlot = (re, sources) => { const s = hslot(re); if (!s) { notes.push("header has no slot " + re); return; } const ph = [...s.children];
sources.forEach((o, i) => { const c = o.clone(); s.insertChild(i, c); try { c.visible = true; } catch (e) {} }); for (const q of ph) { try { q.remove(); } catch (e) {} } };
if (getHdr()) {
try { getHdr().setProperties({ "Title text#3817:0": plan.title || name, "Key#5362:0": !!R.key, "Copy title#6943:15": !!R.copy,
"Show Info slot#6985:0": !!R.status, "Show additional info slot#6943:18": !!R.addInfo }); } catch (e) { notes.push("header props: " + e.message); }
if (R.key) { try { getHdr().setProperties({ "↪ Key Name#6943:13": R.key }); } catch (e) {} }
const bc = getHdr().findOne(n => n.type === "INSTANCE" && /Breadcrumb/i.test(n.name)); const crumbText = R.crumb || crumb || refCrumb(a.refRoot);
if (bc && crumbText) { try { bc.setProperties({ "Name#6638:5": crumbText }); } catch (e) {} }
else if (bc) { try { getHdr().setProperties({ "Breadcrumbs#6913:0": false }); notes.push("no breadcrumb in the original or the reference — hidden"); } catch (e) {} }
const rh = a.refRoot ? a.refRoot.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name) && n.visible) : null;
const refSlot = re => rh ? rh.findAll(n => n.type === "SLOT" && re.test(n.name)).find(sl => sl.children.some(k => k.visible)) : null;
const refTitle = rh && rh.componentProperties["Title text#3817:0"] ? String(rh.componentProperties["Title text#3817:0"].value) : null;
const reuses = t => (t.match(/[A-Za-z0-9][\w.,:+-]{3,}/g) || []).some(tok => /\d/.test(tok) && stackTexts.some(o => o.includes(tok)));
if (refTitle && reuses(refTitle)) { try { const rc = rh.componentProperties["Copy title#6943:15"]; getHdr().setProperties(Object.assign({ "Title text#3817:0": refTitle }, rc ? { "Copy title#6943:15": !!rc.value } : {})); notes.push("title from the reference: " + refTitle); } catch (e) {} }   // the copy button belongs to the title it sits next to
const fixTexts = async root => { for (const t of (root.findAll ? root.findAll(q => q.type === "TEXT") : [])) { const c = t.characters.trim();
if (/^ID\s*:/i.test(c) && origId && c !== origId) { try { await figma.loadFontAsync(t.fontName); t.characters = origId; } catch (e) {} } } };
const rInfo = refSlot(/^Info slot/i), rAdd = refSlot(/^Additional info/i);
if (rInfo) { try { getHdr().setProperties({ "Show Info slot#6985:0": true });
const stT = R.status ? (R.status.type === "TEXT" ? R.status : R.status.findOne(q => q.type === "TEXT" && q.visible)) : null, stLbl = stT ? stT.characters.trim() : null;
const src = rInfo.children.filter(k => k.visible).map(k => { const t = k.findOne ? k.findOne(q => q.type === "TEXT" && q.visible) : null;
return (/Status/i.test(k.name) && stLbl && t && t.characters.trim() !== stLbl) ? R.status : k; });
fillSlot(/^Info slot/i, src);
const sc = labelValue["score"]; const s1 = hslot(/^Info slot/i);
if (sc && s1) for (const c of s1.children) if (/Counter/i.test(c.name)) { const t = c.findOne(q => q.type === "TEXT" && q.visible); if (t && t.characters.trim() !== sc) { try { await figma.loadFontAsync(t.fontName); t.characters = sc; } catch (e) {} } }
notes.push("info row from the reference" + (src.includes(R.status) ? ", status from the original" : "")); } catch (e) { notes.push("ref info: " + e.message); } }
else if (R.status) { try { fillSlot(/^Info slot/i, [R.status]); } catch (e) { notes.push("status: " + e.message); } }
if (rAdd) { try { getHdr().setProperties({ "Show additional info slot#6943:18": true }); fillSlot(/^Additional info/i, rAdd.children.filter(k => k.visible));
const s2 = hslot(/^Additional info/i); if (s2) await fixTexts(s2); notes.push("additional info row from the reference, ID from the original"); } catch (e) { notes.push("ref additional info: " + e.message); } }
else if (R.addInfo) { try { fillSlot(/^Additional info/i, vis(R.addInfo)); } catch (e) { notes.push("additional info: " + e.message); } }
try { const tbOf = () => getHdr().findOne(n => /^\*Tab Basic\*/.test(n.name));
const wsOf = () => { const tb = tbOf(); return tb && tb.findAll(n => n.type === "SLOT").find(s => /Items wrapper/i.test(s.name)); };
if (tbOf() && plan.tabs.length) {
for (let guard = 0; guard < 12; guard++) { const ws = wsOf(); if (!ws) break; const its = ws.children.filter(n => /Tab Basic \/ Item/i.test(n.name));
if (its.length >= plan.tabs.length) break; ws.appendChild(its[its.length - 1].clone()); }
const items = tbOf().findAll(n => /Tab Basic \/ Item/i.test(n.name));
items.forEach((it, i) => { try { if (i < plan.tabs.length) { it.visible = true; it.setProperties({ "Label text#4517:0": plan.tabs[i], "Selected": i === plan.tabSelected ? "true" : "false" }); } else it.visible = false; } catch (e) {} });
if (items.length < plan.tabs.length) notes.push("header shows " + items.length + " of " + plan.tabs.length + " tabs"); }
} catch (e) { notes.push("tabs: " + e.message); }
const acts = R.actions.length ? R.actions : carry;
if (acts.length) { try { getHdr().setProperties({ "Show actions slot#6943:20": true }); if (!hslot(/Actions slot/i)) { getHdr().setProperties({ "Show actions slot#6943:20": false }); notes.push("the header has no actions slot — left off"); } else { fillSlot(/Actions slot/i, acts);
for (const c of [...hslot(/Actions slot/i).children]) { try { const tt = c.findOne(q => q.type === "TEXT" && q.visible); if (tt && /^Button$/i.test(tt.characters.trim())) c.remove(); } catch (e) {} }
try { const hh = getHdr(), asl = hslot(/Actions slot/i); const inAsl = n => { let q = n.parent; while (q && q.id !== hh.id) { if (q.id === asl.id) return true; q = q.parent; } return false; }; const shownIn = n => { let q = n; while (q && q.id !== hh.id) { if (q.visible === false) return false; q = q.parent; } return true; }; const own = new Set(hh.findAll(n => n.type === "INSTANCE" && /^(normal|small|large)\//.test(n.name) && shownIn(n) && !inAsl(n)).map(n => n.name)); for (const c of [...asl.children]) { try { if (c.findOne(q => q.type === "TEXT" && q.visible && q.characters.trim())) continue; const ic = c.findOne(q => q.type === "INSTANCE" && /^(normal|small|large)\//.test(q.name)); if (ic && own.has(ic.name)) { notes.push("the header has its own " + ic.name + " — the copied one removed"); c.remove(); } } catch (e) {} } } catch (e) {}
const asl2 = hslot(/Actions slot/i); if (asl2 && !asl2.children.some(k => k.visible)) { getHdr().setProperties({ "Show actions slot#6943:20": false }); notes.push("actions slot empty after removing the header's own icons — left off"); } } } catch (e) { notes.push("actions: " + e.message); } }
}
try { await carrySidebar(nodes.sidebar, page, notes); } catch (e) { notes.push("sidebar: " + e.message); }
{ const spans = page.findAll(n => { try { return n.getSharedPluginData("sumsub_island", "span") === "1"; } catch (e) { return false; } }); let k = 0;
for (const n of spans) { try { n.setSharedPluginData("sumsub_island", "span", ""); if (n.layoutSizingHorizontal === "FIXED" && n.parent && n.parent.layoutMode === "VERTICAL") { n.layoutSizingHorizontal = "FILL"; k++; } } catch (e) {} }
if (k) notes.push("blocks that spanned their column in the original span it here too: " + k); }
for (const ov of nodes.overlays) { try { const ob = box(ov, scr); parent.appendChild(ov); ov.x = x + ob.x; ov.y = y + ob.y; } catch (e) {} }
try { page.resize(origW, origH); } catch (e) {}
try { const shown = new Set(page.findAll(t => t.type === "TEXT" && t.visible).map(t => t.characters.trim()));
const shownLow = new Set([...shown].map(t => t.toLowerCase()));
const lost = Object.entries(labelValue).filter(([k, v]) => !shown.has(v) && !shownLow.has(k)).map(([k, v]) => k + ": " + v); if (lost.length) notes.push("header values not placed: " + lost.join(", ")); } catch (e) {}
_idCache.clear();                                                          // the tree changed — rebuild id sets
const leftover = scr.findAll(n => (n.type === "TEXT" || n.type === "INSTANCE") && n.visible !== false && rendered(n, scr) &&
!contains(nodes.header, n) && !contains(nodes.header2, n) && !contains(nodes.sidebar, n) && !contains(nodes.subheader, n) && !(nodes.scrollbars || []).some(sb => contains(sb, n)));
if (leftover.length) {
return { page, kept: [...new Set(leftover.map(n => n.name))], notes }; }
try { scr.remove(); } catch (e) {}
return { page, kept: [], notes };
}
// The main column that is ALREADY a card goes over whole when the reference keeps that same block bare (TM Settings:
// `.Content` is a white r12 card holding the title, the fields and the Button bar — split into its children it became
// islands in a card, while the reference shows the one card, radius 16 from the reference)
function keepWholeCard(a, refP) {
const m = a.nodes.main; if (!m || a.nodes.table || a.nodes.groups.length < 2 || !cardLike(m)) return false;
if (refPlacement(refP, m.name) !== "bare") return false;
a.nodes.groups = [m]; return true;
}
function refWidth(P) {   // v3.228: the reference's own content width (TM Settings: 691 slot = Full width, not 1084)
const d = P ? P.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body / Default") : null; const t = d && d.componentProperties && d.componentProperties.Type ? String(d.componentProperties.Type.value) : "";
return /^(Full width|1084 max|1920 max)$/.test(t) ? t : null; }
function surfaceOf(refP, opts) {   // v3.228: grey / white is the designers' table decision when given ({ surface }); else the reference's look
const refG = refP ? refIsGrey(refP) : null, tbl = opts && opts.surface ? opts.surface === "grey" : null;
return { grey: tbl !== null ? tbl : refG, refGrey: refG, from: tbl !== null ? "table" : (refG === null ? null : "reference") }; }
function refIsGrey(P) {
const ms = P.findAll(n => n.type === "SLOT" && n.name === "Main content")[0]; if (!ms || !ms.absoluteBoundingBox) return null; const mb = ms.absoluteBoundingBox;
return P.findAll(n => n.visible && n.fills && n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false && !!n.absoluteBoundingBox &&
(() => { const c = n.fills[0].color; return c.r > 0.93 && c.r < 0.985 && Math.abs(c.r - c.b) < 0.03; })() &&
(() => { const b = n.absoluteBoundingBox; const ix = Math.max(0, Math.min(b.x + b.width, mb.x + mb.width) - Math.max(b.x, mb.x)), iy = Math.max(0, Math.min(b.y + b.height, mb.y + mb.height) - Math.max(b.y, mb.y)); return ix * iy > 0.4 * mb.width * mb.height; })()).length > 0;
}
async function planOne(scrId, refOverride, opts) {
const scr = await figma.getNodeByIdAsync(scrId); if (!scr) return { id: scrId, missing: true };
let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();
const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = refOverride || (m ? m[1] : null);
_idCache.clear(); const a = analyze(scr);
let refP = null; if (refId) { const ref = await figma.getNodeByIdAsync(refId);
if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync(); refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => n.type === "INSTANCE" && n.name === "Page"); } }
const whole = keepWholeCard(a, refP); const sf = surfaceOf(refP, opts), grey = sf.grey; const rms = refP ? refP.findAll(n => n.type === "SLOT" && n.name === "Main content")[0] : null;
const planWidth = rms && !a.nodes.table ? (refWidth(refP) || ((rms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max")) : a.plan.width;
const blocks = []; let pending = [], lastIsl = null;
for (const g of a.nodes.groups) { if (isHeadingBlock(g)) { pending.push(g.name); continue; }
const rp = refPlacement(refP, g.name) || (refIslandByKids(refP, g) ? "island" : null) || (refUnboxed(refP, g) ? "unboxed" : null);
const how = rp ? rp + " (reference)" : (cardLike(g) || isCardLayout(g)) ? "bare (rule)" : isCardStack(g) ? "split (rule)" : "island (rule)";
const isl = refIslandOf(refP, g.name); if (isl && isl === lastIsl && blocks.length && !pending.length) { blocks[blocks.length - 1] = blocks[blocks.length - 1].replace(/ → island \(reference(, shared)?\)$/, " + " + g.name + " → island (reference, shared)"); lastIsl = isl; continue; }
lastIsl = isl; blocks.push([...pending, g.name].join(" + ") + " → " + how); pending = []; }
if (pending.length) blocks.push(pending.join(" + ") + " → island (rule)");
return clean({ id: scrId, name: scr.name, confident: a.confident, notes: a.notes, ref: refId, refGrey: sf.refGrey, surface: sf.from ? (grey ? "grey" : "white") + " (" + sf.from + ")" : null, verdict: grey === false ? "STOP: white reference" : (a.confident ? "build" : "STOP: not confident"),
plan: [refP && refP.componentProperties.Type ? refP.componentProperties.Type.value : a.plan.pageType, a.plan.content, planWidth, a.plan.sideContent ? "side" : ""].join(" | "),
blocks, wholeCard: whole || undefined, crumb: headerRegions(a.nodes.header, scr).crumb || refCrumb(refP) || null, left: a.nodes.left && a.nodes.left.name, right: a.nodes.right && a.nodes.right.name, tabs: a.plan.tabs, title: a.plan.title,
header2: a.nodes.header2 && a.nodes.header2.name, subheader: a.nodes.subheader && a.nodes.subheader.name });
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
refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => n.type === "INSTANCE" && n.name === "Page"); } }
if (refP && surfaceOf(refP, opts).grey === false) return { id: scrId, name, stopped: "the reference is WHITE — this screen stays on the white layout and is not part of the grey + islands migration", ref: refId };
a.refRoot = refP; const whole = keepWholeCard(a, refP);
if (refP) { const t = refP.componentProperties.Type; if (t && /Basic|Full screen page/.test(t.value)) a.plan.pageType = t.value;
const ms = refP.findAll(n => n.type === "SLOT" && n.name === "Main content")[0];
if (ms && !a.nodes.table) a.plan.width = refWidth(refP) || ((ms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max");
a.W = Math.round(refP.width); a.H = Math.round(refP.height); }
const r = await buildIsland(scr, a, null);
return clean({ id: scrId, name: name.slice(0, 50), pageId: r.page.id, ref: refP ? refId : null, plan: [a.plan.pageType, a.plan.content, a.plan.width, a.plan.sideContent ? "side" : ""].join(" | "),
kept: r.kept, notes: r.notes });
}
