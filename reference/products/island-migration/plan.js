// PLAN — read-only, run it before call 1. Paste this file into use_figma and append:  return JSON.stringify(await planOne("<screen node id>", "<reference node id, optional>", { surface: "grey" }));
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
const hasChrome = vis(inner).some(isChrome) || (!!subheader && contains(inner, subheader)); if (isCardLayout(inner) && !hasChrome) groups = [inner];
else groups = (k.length >= 2 && k.every(x => x.width >= 0.6 * inner.width || isGraphic(x)) && k.some(x => !isGraphic(x))) ? k : (hasChrome && k.length ? k : [inner]); } }
const isOv = n => n.type === "INSTANCE" && /Toast|Dropdown|Modal|Drawer/i.test(n.name + " " + mainName(n));
const hasOvAncestor = n => { let p = n.parent; while (p && p.id !== scr.id && p.type !== "PAGE") { if (isOv(p)) return true; p = p.parent; } return false; };
const overlays = all.filter(n => isOv(n) && !hasOvAncestor(n) && !contains(header, n) && !contains(main, n) && !contains(left, n) && !contains(right, n));
const hasClose = header ? !!header.findOne(n => /close/i.test(n.name) && rendered(n, scr)) : false;
const fullHdr = header ? /Full Screen|Header-levels|Fullscreen|Case page header|AP page header/i.test(header.name + " " + mainName(header)) : false;
const pageType = sbW && sbW <= 60 ? "Full screen page" : sbW >= 200 ? "Basic" : (hasClose || fullHdr ? "Full screen page" : "Basic");
let content;
const fitsSide = !!right && !!main && (main.width + right.width) <= 1084;
if (left && right) { content = "◼️ Nav + Main + Right (Ghost)"; notes.push("left AND right column — confirm the left one is section navigation"); }
else if (left) content = "◼️ Left + Main (Ghost)";
else if (right && !fitsSide) content = "◼️ Main + Right (Ghost)";
else content = "◼️ Main (Ghost)";
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
let sandbox = false; if (header) { const s = header.findOne(n => n.type === "TEXT" && /sandbox mode/i.test(n.characters)); if (s) { const hb = header.absoluteBoundingBox, tb = s.absoluteBoundingBox; sandbox = rendered(s, scr) && s.visible && !!hb && !!tb && tb.y >= hb.y - 1 && tb.y + tb.height <= hb.y + hb.height + 1; } }
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
const keyT = T.find(t => /^Key name$/i.test(t.name) && !/^Key name$/i.test(t.characters.trim()) && !inA(t, /Additional info/i));
const status = h.findOne(n => n.id !== h.id && /status/i.test(n.name) && n.visible && rendered(n, scr) && !inA(n, /status/i)) || null;
const addInfo = h.findOne(n => /^Additional info$/i.test(n.name) && "children" in n && n.visible && rendered(n, scr)) || null;
const copy = !!h.findOne(n => n.type === "INSTANCE" && /^\*Button\*/.test(n.name) && n.visible && rendered(n, scr) && /Title \+ button/i.test(n.parent.name));
const actions = h.findAll(n => n.type === "INSTANCE" && /^\*Button( AI)?\*/.test(n.name) && n.visible && rendered(n, scr) &&
!!inA(n, /Actions/i) && !inA(n, /Additional info/i) && !inA(n, /\*Button/));
return { crumb: cr ? cr.characters.trim() : null, key: keyT ? keyT.characters.trim() : null, status, addInfo, copy, actions };
}
const refScope = r => { const sl = r.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name)))); return sl.length ? sl : [r]; };
const refAll = (r, nm) => refScope(r).flatMap(s => s.findAll(x => x.name === nm && x.visible));
function refPlacement(refRoot, name) {
if (!refRoot) return null;
const n = refAll(refRoot, name)[0]; if (!n) return null;
let q = n.parent; while (q && q.id !== refRoot.id) { if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return "island"; q = q.parent; }
return ("findOne" in n && n.findOne(x => x.type === "INSTANCE" && x.name === "Page / Body / IslandCard")) ? "split" : "bare";
}
function refIslandOf(refRoot, name) {
if (!refRoot) return null;
const n = refAll(refRoot, name)[0]; if (!n) return null;
for (let q = n.parent; q && q.id !== refRoot.id; q = q.parent) if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return q.id;
return null;
}
function refIslandByKids(refRoot, g) {
if (!refRoot || !("children" in g)) return null;
let cur = g; for (let d = 0; d < 3; d++) { const k = cur.children.filter(x => x.visible !== false); if (k.length === 1 && k[0].type === "FRAME" && "children" in k[0]) cur = k[0]; else break; }
const kids = cur.children.filter(k => k.visible !== false); if (!kids.length) return null;
const ids = []; for (const k of kids) { const all = refAll(refRoot, k.name); if (!all.length) { if (isHeadingBlock(k)) continue; return null; } if (all.length > 1) continue;
let isl = null; for (let q = all[0].parent; q && q.id !== refRoot.id; q = q.parent) if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") { isl = q.id; break; } if (!isl) return null; ids.push(isl); }
return ids.length && ids.every(id => id === ids[0]) ? ids[0] : null;
}
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
function keepWholeCard(a, refP) {
const m = a.nodes.main; if (!m || a.nodes.table || a.nodes.groups.length < 2 || !cardLike(m)) return false;
if (refPlacement(refP, m.name) !== "bare") return false;
a.nodes.groups = [m]; return true;
}
function refSideOnly(P, a) {
const d = P ? P.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body / Default") : null; const p = d && d.componentProperties ? d.componentProperties["Show side content#23483:22"] : null;
return !!p && p.value === true && !a.nodes.right && !a.nodes.left && !a.nodes.table && a.plan.content === "◼️ Main (Ghost)"; }
function refWidth(P) {
const d = P ? P.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body / Default") : null; const t = d && d.componentProperties && d.componentProperties.Type ? String(d.componentProperties.Type.value) : "";
return /^(Full width|1084 max|1920 max)$/.test(t) ? t : null; }
function surfaceOf(refP, opts) {
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
const how = isGraphic(g) ? "bare (graphic)" : rp ? rp + " (reference)" : (cardLike(g) || isCardLayout(g)) ? "bare (rule)" : isCardStack(g) ? "split (rule)" : "island (rule)";
const isl = refIslandOf(refP, g.name); if (isl && isl === lastIsl && blocks.length && !pending.length) { blocks[blocks.length - 1] = blocks[blocks.length - 1].replace(/ → island \(reference(, shared)?\)$/, " + " + g.name + " → island (reference, shared)"); lastIsl = isl; continue; }
lastIsl = isl; blocks.push([...pending, g.name].join(" + ") + " → " + how); pending = []; }
if (pending.length) blocks.push(pending.join(" + ") + " → island (rule)");
return clean({ id: scrId, name: scr.name, confident: a.confident, notes: a.notes, ref: refId, refGrey: sf.refGrey, surface: sf.from ? (grey ? "grey" : "white") + " (" + sf.from + ")" : null, verdict: grey === false ? "STOP: white reference" : (a.confident ? "build" : "STOP: not confident"),
plan: [refP && refP.componentProperties.Type ? refP.componentProperties.Type.value : a.plan.pageType, a.plan.content, planWidth, a.plan.sideContent ? "side" : (refSideOnly(refP, a) ? "side: empty, like the reference" : "")].join(" | "),
blocks, wholeCard: whole || undefined, crumb: headerRegions(a.nodes.header, scr).crumb || refCrumb(refP) || null, left: a.nodes.left && a.nodes.left.name, right: a.nodes.right && a.nodes.right.name, tabs: a.plan.tabs, title: a.plan.title,
header2: a.nodes.header2 && a.nodes.header2.name, subheader: a.nodes.subheader && a.nodes.subheader.name });
}
