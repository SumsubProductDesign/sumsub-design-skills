// Island migration engine — full, commented source. Run it through build.js + finish.js (two use_figma calls); see island-layout-pattern.md §6.2.
// ═══ island migration library — analyze a screen by geometry, plan, then rebuild it on the Page layout ═══
const rendered = (n, stop) => { const sid = stop ? stop.id : null; let p = n;
  while (p && p.type !== "PAGE" && p.id !== sid) { if ("visible" in p && p.visible === false) return false; p = p.parent; } return true; };
const mainName = n => { try { const m = n.mainComponent; return m ? ((m.parent && m.parent.type === "COMPONENT_SET") ? m.parent.name : m.name) : ""; } catch (e) { return ""; } };
const box = (n, ref) => { const a = n.absoluteTransform, r = ref.absoluteTransform; return { x: Math.round(a[0][2] - r[0][2]), y: Math.round(a[1][2] - r[1][2]), w: Math.round(n.width), h: Math.round(n.height) }; };
// v3.254: short names that keep finish.js under the use_figma limit.
// v3.260: finish.js also writes isB(n) for the body-slot test isS(n) && (Main content | Side content | Aside › Content), drops
// line indentation and leaves out unwrapSingle / isCardStack, which only plan.js and build.js call.
const ICN = "Page / Body / IslandCard", isS = n => n.type === "SLOT", isI = n => n.type === "INSTANCE", byId = id => figma.getNodeByIdAsync(id), CP = n => n.componentProperties, CT = n => n.characters.trim();
const vis = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
// Figma keeps Shift+Enter as U+2028; a returned string with it cuts the MCP response ("Failed to parse SSE message … EOF while
// parsing a string … column ~20000") although the call ran. Every result goes through clean(). The regexp is built from char
// codes on purpose: an escaped line separator in the source is decoded by the tool-call JSON into a raw one → SyntaxError.
const _LS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029, 0x85) + "]", "g");
const clean = o => JSON.parse(JSON.stringify(o).replace(_LS, " "));
// containment by id set — built once per node, O(1) lookups (a findOne per node is O(n²) on a 5000-layer screen)
const _idCache = new Map();
const idsOf = n => { if (!n) return new Set(); if (_idCache.has(n.id)) return _idCache.get(n.id);
  const s = new Set([n.id]); if ("findAll" in n) for (const x of n.findAll(() => true)) s.add(x.id); _idCache.set(n.id, s); return s; };
const contains = (outer, n) => !!outer && idsOf(outer).has(n.id);

// A "screen" is a frame/instance 1270–1930 wide and ≥ 560 tall, not nested in another screen.
// Works on a frame, a section, a wrapper frame or a whole page.
function findScreens(node) {
  const isScreen = n => (n.type === "FRAME" || isI(n)) && n.width >= 1270 && n.width <= 1930 && n.height >= 560;
  if (isScreen(node)) return [node];
  const out = []; if ("children" in node) for (const c of node.children) { if (c.visible !== false) out.push(...findScreens(c)); } return out;
}
// ≥2 nodes standing SIDE BY SIDE (x-ranges disjoint, y-ranges overlapping) → they are columns
function sideBySide(n, scr) { return sideBySideList(vis(n), scr); }
function sideBySideList(nodes, scr) {
  const k = nodes.filter(c => c.width >= 150).map(c => ({ c, b: box(c, scr) }));
  if (k.length < 2) return null;
  for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { const a = k[i].b, b = k[j].b;
    const xo = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), yo = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (!(xo <= 4 && yo > 20)) return null; }
  return k.sort((p, q) => p.b.x - q.b.x);
}
// a TABLE SCREEN = the main block itself is a table, or a table sits at its top level. A table buried deep inside an organism
// (a transactions list inside the Case Overview tab content) does NOT make the whole screen a table.
const isTableSelf = x => /Table Starter|Table Header|Txn table|Case table/i.test(x.name) || /Table Starter/.test(mainName(x));
const isTableNode = n => { let c = n; for (let i = 0; i < 4 && c; i++) { if (isTableSelf(c)) return true; const k = vis(c);
    if (k.some(isTableSelf)) return true; if (k.length !== 1 || !("children" in k[0])) return false; c = k[0]; } return false; };
const unwrap = n => { let c = n; while (c && c.type !== "INSTANCE" && vis(c).length === 1 && "children" in vis(c)[0] && vis(c)[0].width >= 0.85 * c.width) c = vis(c)[0]; return c; };
const isHeadingBlock = n => /title|heading|header/i.test(n.name) && n.height <= 90;
// a padded wrapper around ONE block (Container → Events log) is not a group of its own — descend regardless of width
const unwrapSingle = n => { let c = n; while (c && c.type !== "INSTANCE" && vis(c).length === 1 && "children" in vis(c)[0]) c = vis(c)[0]; return c; };
// cards — mixed-safe (strokeWeight / fills can be figma.mixed)
const fillOf = n => (n && n.fills && n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false) ? n.fills[0].color : null;
const hasStroke = n => !!(n.strokes && n.strokes !== figma.mixed && n.strokes.some(s => s.visible !== false)) && (typeof n.strokeWeight !== "number" || n.strokeWeight > 0);
const isWhite = n => { const c = fillOf(n); return !!c && c.r > 0.97 && c.g > 0.97 && c.b > 0.97; };
// a card = rounded (≥ 8) and a white fill or its own border — it stands bare on the grey, never inside another island
const isCard = n => (typeof n.cornerRadius === "number" ? n.cornerRadius : 0) >= 8 && (isWhite(n) || hasStroke(n));
// an instance that only wraps one card of its own size (Blueprint case content → *Collapsible Card*) counts as that card
const cardLike = n => isCard(n) || (vis(n).length === 1 && isCard(vis(n)[0]) && Math.abs(vis(n)[0].height - n.height) < 2);
// a LAYOUT OF CARDS — every leaf block is a card (through plain frames), small rows (≤ 90: a quick-links bar, a name row) allowed.
// Designers keep such a layout whole and bare on the grey (CM managers overview, Blueprint body). A titled group (first child a
// Block Title / Heading) is NOT a layout of cards — it goes into one island whole (Case routing).
function isCardLayout(n, depth = 0) {
  if (cardLike(n) || depth > 4) return false; const k = vis(n); if (!k.length) return false;
  if (depth === 0 && isHeadingBlock(k[0])) return false;
  let cards = 0;
  for (const c of k) { if (cardLike(c)) { cards++; continue; } if (c.height <= 90) continue;
    if (c.type === "FRAME" && isCardLayout(c, depth + 1)) { cards += 2; continue; } return false; }
  return cards >= 2; }
// a MIXED stack — mostly cards, some plain blocks (Case page Overview tab content with a Transactions table): split it
const isCardStack = n => { const k = vis(n); return k.length >= 2 && !isHeadingBlock(k[0]) && k.filter(cardLike).length >= Math.ceil(k.length / 2); };
// v3.245: a graphic (an image or shape, no children) is not a content block — it never decides the split and never goes into an island (KYC: a 643-wide screenshot of tabs).
const isGraphic = n => /^(RECTANGLE|ELLIPSE|VECTOR|LINE|POLYGON|STAR|BOOLEAN_OPERATION)$/.test(n.type);

// ─── ANALYZE: roles by position and size, never by layer names alone ───
function analyze(scr) {
  const W = Math.round(scr.width), H = Math.round(scr.height), notes = [];
  const all = scr.findAll(n => n.visible !== false && rendered(n, scr));
  // the old sidebar spans the 900 viewport, not a taller frame (Case page AML: 52×900 in a 1160 screen — missed at 0.8 × 1160)
  const sidebar = all.filter(n => { const b = box(n, scr); return b.x <= 2 && b.y <= 2 && b.h >= 0.8 * Math.min(H, 900) && b.w >= 44 && b.w <= 300 &&
      (/sidebar|menu|navigation/i.test(n.name) || /Sidebar/.test(mainName(n))); }).sort((a, b) => b.height - a.height)[0] || null;
  const sbW = sidebar ? Math.round(sidebar.width) : 0;
  const header = all.filter(n => { const b = box(n, scr); return b.y <= 2 && b.h >= 40 && b.h <= 160 && b.x >= sbW - 2 && b.w >= 0.7 * (W - sbW) &&
      (/header/i.test(n.name) || /Header/.test(mainName(n))); }).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
  const hdrH = header ? Math.round(header.height) : 0;
  // a HEADER STACK: a full-width band right under the top header that carries the entity's actions and status
  // (TM Transaction: `Header / Finance` — amount, status, Confirm / Pending / Approve, Score, Applicant, Assignee) is header, not content
  let stackBottom = header ? box(header, scr).y + box(header, scr).h : 0;
  const header2 = !header ? null : all.filter(n => { const b = box(n, scr); return !contains(header, n) && Math.abs(b.y - stackBottom) <= 8 && b.w >= 0.9 * (W - sbW) && b.h >= 40 && b.h <= 200 &&
      (/header/i.test(n.name) || /Header/.test(mainName(n))) && "findOne" in n && !!n.findOne(x => x.type === "INSTANCE" && /^\*Button/.test(x.name)); }).sort((a, b) => b.height - a.height)[0] || null;
  if (header2) stackBottom = box(header2, scr).y + box(header2, scr).h;
  // a tab strip sitting right under the header (stack), outside it (e.g. Case page: tabs live in the left column) — chrome, not content
  const subheader = all.filter(n => { const b = box(n, scr); return !contains(header, n) && !contains(header2, n) && b.y >= Math.min(hdrH, stackBottom) - 2 && b.y <= stackBottom + 32 && b.h >= 32 && b.h <= 72 &&
      "findOne" in n && !!n.findOne(x => /^\*Tab Basic\*|Tab( \/)? Basic \/ Item/.test(x.name)); }).sort((a, b) => b.width - a.width)[0] || null;
  // an old scrollbar thumb is chrome too — the Page scrolls by itself (Blueprint New blueprint: `Scroll / Thumb` at the right edge kept the
  // source alive as a leftover)
  const scrollbars = all.filter(n => isI(n) && /Scroll \/ Thumb/i.test(n.name + " " + mainName(n)));
  const isChrome = n => contains(header, n) || contains(header2, n) || contains(sidebar, n) || contains(subheader, n) || scrollbars.some(sb => contains(sb, n));
  // columns may be direct children of the screen with no shared wrapper (Case page: left column + right column)
  let cols = sideBySideList(vis(scr).filter(c => !isChrome(c)), scr), container = cols ? scr : null;
  if (!cols) container = all.filter(n => { const b = box(n, scr); return (b.y >= hdrH - 2 || (header && b.y + b.h >= (H + hdrH) / 2 && vis(n).length && !contains(n, header))) && b.x >= sbW - 2 && b.w >= 0.5 * (W - sbW) && b.h >= 0.25 * (H - hdrH) &&   // v3.250: a column that starts under the header still counts (AP Overview #2: Body at y −13 under the 125 px AP page header lost its Info Card)
      !isChrome(n) && "children" in n; }).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
  // the header may sit INSIDE the content frame (Levels: Header-levels is a child of Content) — ignore chrome when looking for columns
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
      // header, header band and tab strip are chrome at every level (TM Related transactions: the band and the tabs sit in the
      // same frame as the table) — never a content block; when chrome is all that surrounds one block, that block is the group
      const hasChrome = vis(inner).some(isChrome) || (!!subheader && contains(inner, subheader)); if (isCardLayout(inner) && !hasChrome) groups = [inner];          // a layout of cards stays whole
      else groups = (k.length >= 2 && k.every(x => x.width >= 0.6 * inner.width || isGraphic(x)) && k.some(x => !isGraphic(x))) ? k : (hasChrome && k.length ? k : [inner]); } }
  const isOv = n => isI(n) && /Toast|Dropdown|Modal|Drawer/i.test(n.name + " " + mainName(n));
  const hasOvAncestor = n => { let p = n.parent; while (p && p.id !== scr.id && p.type !== "PAGE") { if (isOv(p)) return true; p = p.parent; } return false; };
  const overlays = all.filter(n => isOv(n) && !hasOvAncestor(n) && !contains(header, n) && !contains(main, n) && !contains(left, n) && !contains(right, n));
  const hasClose = header ? !!header.findOne(n => /close/i.test(n.name) && rendered(n, scr)) : false;
  const fullHdr = header ? /Full Screen|Header-levels|Fullscreen|Case page header|AP page header/i.test(header.name + " " + mainName(header)) : false;
  const pageType = sbW && sbW <= 60 ? "Full screen page" : sbW >= 200 ? "Basic" : (hasClose || fullHdr ? "Full screen page" : "Basic");
  let content;
  const fitsSide = !!right && !!main && (main.width + right.width) <= 1084;   // form + column inside 1084 (KYC editor 640+380)
  if (left && right) { content = "◼️ Nav + Main + Right (Ghost)"; notes.push("left AND right column — is the left one navigation?"); }
  else if (left) content = "◼️ Left + Main (Ghost)";
  else if (right && !fitsSide) content = "◼️ Main + Right (Ghost)";           // wide main + inspector column (Case page 964+424)
  else content = "◼️ Main (Ghost)";             // everything sits in islands on grey — tables and empty states too (after-refs 29.09)
  if (!header) notes.push("no header found");
  if (!main) notes.push("no main content found");
  const width = table ? (W >= 1900 ? "1920 max" : "Full width") : (content === "◼️ Main + Right (Ghost)" ? "Full width" : "1084 max");
  // header labels — the header may be an INSTANCE or a detached FRAME
  let title = null; if (header) { const t = header.findOne(n => n.type === "TEXT" && n.name === "Title" && rendered(n, scr)) ||
      header.findAll(n => n.type === "TEXT" && rendered(n, scr) && CT(n).length > 1).sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0]; if (t) title = CT(t); }
  const tabSrc = [header, subheader].filter(Boolean);
  const tabPairs = tabSrc.flatMap(h => h.findAll(n => isI(n) && /Tab( \/)? Basic \/ Item/i.test(n.name) && rendered(n, scr)))
      .map(t => { const x = t.findOne(y => y.type === "TEXT" && y.visible); const sp = CP(t) && CP(t).Selected;
        const ck = Object.keys(CP(t) || {}).find(k => /^Counter/.test(k)), nt = ck && CP(t)[ck].value === true ? t.findOne(y => y.type === "TEXT" && y.visible && y.name === "Number") : null; return { label: x ? x.characters : null, sel: !!sp && String(sp.value) === "true", cnt: nt ? nt.characters : null }; }).filter(t => t.label);
  const tabs = tabPairs.map(t => t.label), tabCnt = tabPairs.map(t => t.cnt), tabSelected = Math.max(0, tabPairs.findIndex(t => t.sel));
  let sandbox = false; if (header) { const s = header.findOne(n => n.type === "TEXT" && /sandbox mode/i.test(n.characters)); if (s) { const hb = header.absoluteBoundingBox, tb = s.absoluteBoundingBox; sandbox = rendered(s, scr) && s.visible && !!hb && !!tb && tb.y >= hb.y - 1 && tb.y + tb.height <= hb.y + hb.height + 1; } }   // v3.236: the flag text below the header edge is not shown (Complete to-do list: y 58 in a 56 header) — no sandbox
  const plan = { pageType, content, width, sideContent: !!right && content === "◼️ Main (Ghost)", sandbox, title, tabs, tabCnt, tabSelected };
  return { W, H, nodes: { sidebar, header, header2, subheader, scrollbars, main, left, right, groups, overlays, table }, plan, confident: !!header && !!main && notes.length === 0, notes,
    report: { screen: scr.name, id: scr.id, size: W + "×" + H, oldSidebar: sbW || null, header: header ? header.name + " (" + header.type + ")" : null, subheader: subheader ? subheader.name : null,
      main: main ? main.name : null, left: left ? left.name : null, right: right ? right.name : null,
      islands: content.includes("Ghost") ? groups.filter(g => !isHeadingBlock(g)).map(g => g.name) : [], table, overlays: overlays.map(o => o.name) } };
}

// ─── BUILD: replace the screen IN PLACE with a live Page instance, per the plan ───
// Returns { page, kept, notes }. kept ≠ [] → the source still holds visible content → it was NOT removed.
// original header regions → prod *Header* slots. Old headers (Case page header, AP page header, detached copies) are built
// from the same parts: Breadcrumb · Title + button · status · Info (Key name) · Additional info row · Actions / Actions slot
function headerRegions(h, scr) {
  if (!h) return { actions: [] };
  const inA = (n, re) => { let q = n.parent; while (q && q.id !== h.id) { if (re.test(q.name)) return q; q = q.parent; } return null; };
  const T = h.findAll(n => n.type === "TEXT" && n.visible && rendered(n, scr));
  const cr = T.find(t => inA(t, /Breadcrumb/i) && CT(t).length > 1 && !/^Section name$/i.test(CT(t)));
  // v3.242: the component default "Key name" is a placeholder, not a key (TM Analytics: the old header showed it, the engine turned the
  // Page header's Key badge on with it) — same as "Section name" for the breadcrumb
  const keyT = T.find(t => /^Key name$/i.test(t.name) && !/^Key name$/i.test(CT(t)) && !inA(t, /Additional info/i));
  const status = h.findOne(n => n.id !== h.id && /status/i.test(n.name) && n.visible && rendered(n, scr) && !inA(n, /status/i)) || null;
  const addInfo = h.findOne(n => /^Additional info$/i.test(n.name) && "children" in n && n.visible && rendered(n, scr)) || null;
// v3.246: the copy button can also sit as an icon-only copy button next to the name (AP page header: Title + Tag › Name › normal/copy)
  const copy = !!h.findOne(n => isI(n) && /^\*Button\*/.test(n.name) && n.visible && rendered(n, scr) && (/Title \+ button/i.test(n.parent.name) || (!n.findOne(q => q.type === "TEXT" && q.visible && CT(q)) && !!n.findOne(q => q.type === "INSTANCE" && /^(normal|small)\/copy$/.test(q.name)) && [n.parent, n.parent && n.parent.parent].some(p => p && /Title/i.test(p.name)))));
  const actions = h.findAll(n => isI(n) && /^\*Button( AI)?\*/.test(n.name) && n.visible && rendered(n, scr) &&
      !!inA(n, /Actions/i) && !inA(n, /Additional info/i) && !inA(n, /\*Button/));
  return { crumb: cr ? CT(cr) : null, key: keyT ? CT(keyT) : null, status, addInfo, copy, actions };
}
// ─── REFERENCE PLACEMENT: where does the designer's after-version put a block? ───
// "island" — inside a Page / Body / IslandCard; "split" — bare, but islands live inside it (a mixed wrapper);
// "bare" — on the grey as is; null — not in the reference (fall back to the rules). Levels Steps: the titled "Steps" group
// is bare on grey in the reference while the look-alike "Case routing" sits in an island — only the reference can tell.
// v3.245: blocks are looked up inside the reference's content slots only — the Page itself has frames named Body / Main / Content (KYC: our Body matched the Page's own Body and was split).
const refScope = r => { const sl = r.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name)))); return sl.length ? sl : [r]; };
const refAll = (r, nm) => refScope(r).flatMap(s => s.findAll(x => x.name === nm && x.visible));
function refPlacement(refRoot, name) {
  if (!refRoot) return null;
  const n = refAll(refRoot, name)[0]; if (!n) return null;
  let q = n.parent; while (q && q.id !== refRoot.id) { if (q.type === "INSTANCE" && q.name === ICN) return "island"; q = q.parent; }
  return ("findOne" in n && n.findOne(x => x.type === "INSTANCE" && x.name === ICN)) ? "split" : "bare";
}
// Breadcrumb from the reference when the original has none (Levels: no crumb in Header-levels, the reference says "Levels").
// Neither has one → the build hides the Page header's breadcrumb instead of leaving the default "Section name".
// Blocks that sit in ONE island in the reference go into one island here (TM Settings / Create a VASP: Name, the fields and the
// Button bar share one IslandCard in 283:31704 — wrapped one by one they became three islands)
function refIslandOf(refRoot, name) {
if (!refRoot) return null;
const n = refAll(refRoot, name)[0]; if (!n) return null;
for (let q = n.parent; q && q.id !== refRoot.id; q = q.parent) if (q.type === "INSTANCE" && q.name === ICN) return q.id;
return null;
}
// A block missing from the reference by name whose children all sit in ONE reference island goes into an island
// (TM Settings / Verify your VASP: our card `.Content` = the reference's island › `Content` holding the same two blocks)
function refIslandByKids(refRoot, g) {   // v3.237: through single wrappers; names that repeat in the reference (every island has a "Heading") don't vote
if (!refRoot || !("children" in g)) return null;
let cur = g; for (let d = 0; d < 3; d++) { const k = cur.children.filter(x => x.visible !== false); if (k.length === 1 && k[0].type === "FRAME" && "children" in k[0]) cur = k[0]; else break; }
const kids = cur.children.filter(k => k.visible !== false); if (!kids.length) return null;
const ids = []; for (const k of kids) { const all = refAll(refRoot, k.name); if (!all.length) { if (isHeadingBlock(k)) continue; return null; } if (all.length > 1) continue;
let isl = null; for (let q = all[0].parent; q && q.id !== refRoot.id; q = q.parent) if (q.type === "INSTANCE" && q.name === ICN) { isl = q.id; break; } if (!isl) return null; ids.push(isl); }
return ids.length && ids.every(id => id === ids[0]) ? ids[0] : null;
}
// v3.235: the designer dropped a wrapper card — our card isn't in the reference by name, but the blocks inside it sit in the
// reference's main column on the grey, outside any island or card (Complete to-do list: .Content held the title, the alert,
// six Checklist row cards and the button; the reference shows all of them bare) → its parts go over bare, the card goes
function refUnboxed(refRoot, g) {
if (!refRoot || !cardLike(g) || refPlacement(refRoot, g.name) || refIslandByKids(refRoot, g) || !("findAll" in g)) return false;
const ms = refRoot.findAll(n => isS(n) && n.name === "Main content")[0]; if (!ms) return false;
const names = [...new Set(g.findAll(x => x.visible !== false && x.type === "INSTANCE").map(x => x.name))];
const wrapped = y => { for (let q = y.parent; q && q.id !== ms.id; q = q.parent) { if (q.type === "INSTANCE" && q.name === ICN) return true; if (q.type === "FRAME" && isCard(q)) return true; } return false; };
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
const t = bc.findAll(n => n.type === "TEXT" && n.visible).map(n => CT(n)).find(s => s.length > 1 && s !== "/");
return t && !/^Section name$/i.test(t) ? t : null;
}
// The reference's side column decides WHICH blocks the side panel shows and in what order. A block the original has
// (matched by name, or by the reference block's first text = the original block's name: "Transaction details", "Notes") is the
// original's own; a block only the reference has (TM: Assignee / Related case) is cloned from it and gets the original's values
// by label ("Assignee" → the original header's "James Smith"). Data stays the original's; only the layout follows the reference.
async function sideFromReference(page, refRoot, colName, labelValue, notes) {
  if (!refRoot) return;
  let col = page.findOne(n => n.name === colName && n.visible); if (!col || !("children" in col)) return;
  const refMain = refRoot.findAll(n => isS(n) && /^(Main content|Side content)$/.test(n.name));
  const refCol = refMain.flatMap(sl => sl.children).find(k => k.visible && /right column|side content/i.test(k.name)) ||
    refRoot.findAll(n => isS(n) && n.name === "Content" && n.parent && /Aside/.test(n.parent.name)).flatMap(sl => sl.children).find(k => k.visible);
  if (!refCol || !("children" in refCol)) return;
  const firstText = n => { const t = n.type === "TEXT" ? n : (n.findOne ? n.findOne(q => q.type === "TEXT" && q.visible) : null); return t ? CT(t) : ""; };
  // A reference column can be a FLUSH panel of divided sections (TM Transaction: `Case page right column`, padding 0, every block a
  // `.Case page checklist` section with padding 16 and a bottom divider). Then the panel goes flush too and each of our blocks is put
  // in a section like the reference's — otherwise the cloned sections keep dividers that float inside the Aside's 20 padding
  // (user feedback on the first TM run: "something went wrong in the top part of the sidebar compared to the reference").
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
  // a column that is a component instance (CM: `Case page right column`) carries the component's own blocks — nothing can be
  // inserted into it, and walking its re-created sublayers after the Aside variant change throws on stale ids (Case page AML run)
  if (col.type === "INSTANCE") { notes.push("side column is an instance — kept as is"); return; }
  const sectionLike = async (rb) => {                                           // an empty frame with the reference section's layout and paint
    const w = figma.createFrame(); w.name = rb.name; w.layoutMode = "VERTICAL"; w.fills = [];
    for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) w[k] = rb[k] || 0;
    try { w.strokes = JSON.parse(JSON.stringify(rb.strokes || [])); w.strokeAlign = rb.strokeAlign;
      for (const k of ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"]) w[k] = rb[k]; } catch {}
    const bv = rb.boundVariables || {};
    for (const k of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"]) { if (!bv[k]) continue;
      try { let v = await figma.variables.getVariableByIdAsync(bv[k].id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); if (v) w.setBoundVariable(k, v); } catch {} }
    return w; };
  let at = 0; const used = new Set();   // a block already matched or cloned is not matched again (the reference's Assignee section and Transaction details section share the name .Case page checklist)
  for (const rb of refBlocks) {
    const ft = firstText(rb).toLowerCase(), free = k => k.visible && !used.has(k.id);
    const mine = col.children.find(k => free(k) && ft && (k.name.trim().toLowerCase() === ft || firstText(k).toLowerCase() === ft)) || col.children.find(k => free(k) && k.name === rb.name && !ft);
    if (mine) { used.add(mine.id);
      if (sectioned && padOf(mine) === 0 && mine.name !== rb.name) {
        const w = await sectionLike(rb), mid = mine.id; col.insertChild(Math.max(0, col.children.findIndex(k => k.id === mid)), w);
        try { w.layoutSizingHorizontal = "FILL"; w.layoutSizingVertical = "HUG"; } catch {}
        const m2 = col.children.find(k => k.id === mid) || col.findOne(k => k.id === mid); w.appendChild(m2);
        try { m2.layoutSizingHorizontal = "FILL"; } catch {}
        notes.push("side block in a section like the reference: " + m2.name);
        used.add(w.id); at = col.children.findIndex(k => k.id === w.id) + 1;
      } else at = col.children.findIndex(k => k.id === mine.id) + 1;
      continue; }
    const c = rb.clone(); col.insertChild(Math.min(at, col.children.length), c); at++; used.add(c.id);
    try { c.layoutSizingHorizontal = "FILL"; } catch {}
    const T = c.findAll(q => q.type === "TEXT" && q.visible);
    for (let i = 0; i < T.length - 1; i++) { const v = labelValue[T[i].characters.trim().toLowerCase()];
      if (v && T[i + 1].characters.trim() !== v) { try { await figma.loadFontAsync(T[i + 1].fontName); T[i + 1].characters = v; } catch {} } }
    notes.push("side block from the reference: " + (firstText(rb) || rb.name));
  }
}
// Card chrome = own border + radius ≥ 8 + inner padding ≥ 16 on a (nearly) full-width wrapper. Stripped by overrides only
// (strokes, radius, padding — unbound from their variables first); the instance is never detached. Tables (padding 0) and
// small cards inside the wrapper don't qualify.
// v3.232: the old screen's place in the navigation is data from the original — the sidebar section and the active item carry over
// (TM Settings: the old detached sidebar had Transactions › Settings › Travel Rule quick start active; the new Page showed Dashboard)
const SIDEBAR_TYPE = { "dashboard": "Dashboard", "summy ai copilot": "Summy AI Copilot", "applicants": "Applicants", "integrations": "Integrations", "transactions": "Transactions monitoring", "case management": "Case management", "client lists": "Client lists", "statistics": "Statistics", "reports": "Reports", "billing": "Billing", "settings": "Settings", "tasks": "Tasks", "operator": "Operator", "review panel": "Reviews", "reviews": "Reviews", "mission control": "Mission control", "admin area": "Admin area", "dev space": "Dev space", "marketplace": "Marketplace" };
function sidebarTrail(old) {
if (!old || !("findAll" in old)) return null;
const isActive = n => { try { return isI(n) && CP(n) && CP(n).State && String(CP(n).State.value) === "Active"; } catch (e) { return false; } };
const depthOf = n => { let d = 0; for (let q = n; q && q.id !== old.id; q = q.parent) d++; return d; };
const act = old.findAll(n => n.visible !== false && isActive(n) && /Menu Item|Sections/i.test(n.name)).sort((p, q) => depthOf(q) - depthOf(p));
if (!act.length) return null;
const txt = n => { const t = n.type === "TEXT" ? n : n.findOne(q => q.type === "TEXT" && q.visible); return t ? CT(t) : ""; };
const trail = [txt(act[0])];
for (let q = act[0].parent; q && q.id !== old.id; q = q.parent) if (/Sections/i.test(q.name)) { const row = q.findOne(x => /Menu Item \/ (First|Second) Level/i.test(x.name)); const t = row ? txt(row) : txt(q); if (t && t !== trail[trail.length - 1]) trail.push(t); }
return trail.filter(Boolean);
}
async function carrySidebar(old, page, notes) {
const sb = page.findOne(n => isI(n) && n.name === "*Sidebar*"); if (!sb || !old) return;
let type = null;
try { if (old.type === "INSTANCE" && CP(old) && CP(old).Type) type = String(CP(old).Type.value); } catch {}
const trail = sidebarTrail(old) || [];
if (!type && trail.length) { const first = trail[trail.length - 1].toLowerCase(); const key = Object.keys(SIDEBAR_TYPE).sort((a, b) => b.length - a.length).find(k => first.startsWith(k)); if (key) type = SIDEBAR_TYPE[key]; }
if (!type) { if (trail.length) notes.push("sidebar: no DS type for " + trail[trail.length - 1]); return; }
try { if (String(CP(sb).Type.value) !== type) sb.setProperties({ Type: type }); } catch (e) { notes.push("sidebar type " + type + ": " + e.message); return; }
const sb2 = page.findOne(n => isI(n) && n.name === "*Sidebar*");
const seconds = sb2 ? sb2.findAll(n => isI(n) && /Sections \/ Second Level/.test(n.name)) : [];
for (const t of trail.slice(0, -1)) { const hit = seconds.find(s => { try { const v = CP(s)["Section Name"]; return v && String(v.value).split("|").pop().trim().toLowerCase() === t.toLowerCase(); } catch (e) { return false; } });
if (hit) { const hsn = String(CP(hit)["Section Name"].value); try { hit.setProperties({ State: "Active" }); } catch {}
const sb3 = page.findOne(n => isI(n) && n.name === "*Sidebar*");
const sec = sb3 ? sb3.findAll(n => isI(n) && /Sections \/ Second Level/.test(n.name)).find(n => CP(n)["Section Name"] && String(CP(n)["Section Name"].value) === hsn) : null;
let leaf = "";
if (sec && t !== trail[0]) { const thirds = sec.findAll(n => isI(n) && /Third Level/.test(n.name) && n.visible); const want = trail[0].toLowerCase();
const tx = n => { const q = n.findOne(x => x.type === "TEXT" && x.visible); return q ? CT(q).toLowerCase() : ""; };
const own = thirds.find(n => tx(n) === want);
for (const n of thirds) { try { n.setProperties({ State: n === own ? "Active" : "Default" }); } catch {} }
leaf = own ? " › " + trail[0] : " (\"" + trail[0] + "\" is not a DS sidebar item)"; }
notes.push("sidebar from the original: " + type + " › " + t + leaf); return; } }
notes.push("sidebar from the original: " + type);
}
function stripCardChrome(c, fullW) {
  const r = typeof c.cornerRadius === "number" ? c.cornerRadius : 0, pad = Math.max(c.paddingTop || 0, c.paddingLeft || 0);
  if (!hasStroke(c) || r < 8 || pad < 16 || c.width < 0.9 * fullW) return false; // a layer with same-named siblings is an item of a list of cards (Blueprint `Case routing / Options` ×3), not a wrapper
  if (c.parent && "children" in c.parent && c.parent.children.filter(s => s.visible !== false && s.name === c.name).length > 1) return false;
  for (const p of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { c.setBoundVariable(p, null); } catch {} }
  c.strokes = []; c.cornerRadius = 0; c.paddingTop = c.paddingRight = c.paddingBottom = c.paddingLeft = 0; return true;
}
async function buildIsland(scr, a, crumb) {
  const { nodes, plan } = a; const origW = a.W, origH = a.H, notes = [], N = t => notes.push(t);
// v3.236: a FIXED block that spanned its parent in the old screen (the six Checklist rows: 608 in a 608 column) keeps spanning after the move — marked here, set to FILL once the page is built
const inInst = (n, top) => { for (let q = n.parent; q && q.id !== top.id; q = q.parent) if (q.type === "INSTANCE") return true; return false; };
for (const g of nodes.groups) { if (!("findAll" in g)) continue; for (const n of g.findAll(x => x.visible !== false && (x.layoutSizingHorizontal === "FIXED" || (x.layoutSizingHorizontal === "HUG" && x.type === "FRAME" && x.layoutMode !== "NONE")) && x.parent && x.parent.layoutMode === "VERTICAL" && !inInst(x, g))) {   // v3.250: a HUG wrapper that spanned its column spans it too (Overview #2: Frame 270989963 stayed 1377 in a 1340 column)
const p = n.parent, inner = p.width - (p.paddingLeft || 0) - (p.paddingRight || 0); if (Math.abs(n.width - inner) <= 1) { try { n.setSharedPluginData("sumsub_island", "span", "1"); } catch {} } } }
  const parent = scr.parent, x = scr.x, y = scr.y, idx = parent.children.indexOf(scr), name = scr.name;
  // header regions + fallback actions from the ORIGINAL (ancestor-visible), before anything moves
  const R = headerRegions(nodes.header, scr);
  // in a header STACK the top header is app chrome (TM: Summy AI + help, icon-only) — the entity's actions are the band's (Confirm · Pending · Approve · Add to case)
  if (nodes.header2) { const R2 = headerRegions(nodes.header2, scr); if (R2.actions.length) R.actions = R2.actions; R.status = R.status || R2.status; R.crumb = R.crumb || R2.crumb; R.key = R.key || R2.key; R.addInfo = R.addInfo || R2.addInfo; }
  // label → value pairs of the header stack ("Assignee" → "James Smith") and every text it shows — for the reference-driven header / sidebar
  const stackTexts = [nodes.header, nodes.header2, nodes.subheader].filter(Boolean).flatMap(h => h.findAll(t => t.type === "TEXT" && t.visible && rendered(t, scr)).map(t => CT(t))).filter(Boolean);
  const labelValue = {}; if (nodes.header2) for (const f of nodes.header2.findAll(n => n.type === "FRAME" && n.visible)) { const tx = f.children.filter(k => k.visible).flatMap(k => k.type === "TEXT" ? [k] : (k.findAll ? k.findAll(t => t.type === "TEXT" && t.visible) : []));
    if (tx.length === 2 && /^[A-Za-z][A-Za-z ]+$/.test(tx[0].characters.trim())) labelValue[tx[0].characters.trim().toLowerCase()] = tx[1].characters.trim(); }
  const origId = (stackTexts.find(t => /^ID\s*:/i.test(t)) || null);
  const hdr0 = nodes.header;
  const cands = hdr0 ? hdr0.findAll(n => isI(n) && /^\*Button\*/.test(n.name) && rendered(n, scr) && n.visible) : [];
  const carry = [];
  for (const b of cands) { let vn = ""; try { const mc = await b.getMainComponentAsync(); vn = mc ? mc.name : ""; } catch {}
    const t = b.findOne(q => q.type === "TEXT" && q.visible); const lbl = t ? CT(t) : "";
    const inActions = /Buttons/i.test(b.parent ? b.parent.name : "");
    if ((lbl.length > 1 && !/^Button$/i.test(lbl) && (inActions || !/close|back/i.test(b.name))) || (inActions && /Icon Only/i.test(vn) && /Type=Secondary/i.test(vn))) carry.push(b); }
  // 1. Page instance
  const pageSet = await figma.importComponentSetByKeyAsync("f907195876aad003b980b77d6e9471e9418a0941");
  const variant = pageSet.children.find(c => /Ver=New/.test(c.name) && c.name.includes("Type=" + plan.pageType) && c.name.includes("Sandbox=" + (plan.sandbox ? "Yes" : "No")));
  const page = variant.createInstance(); const slotOf = nm => page.findAll(n => isS(n)).find(s => s.name === nm); const instOf = nm => page.findOne(n => isI(n) && n.name === nm);
  parent.insertChild(Math.max(0, idx), page); page.x = x; page.y = y; page.name = name;
  // v3.252: the original's height, for the finish — a reference taller only because of its own content must not stretch the page (AP Actions: 1155 for content to 413, the original is 900)
  try { page.setSharedPluginData("sumsub_island", "origH", String(Math.round(scr.height))); } catch {}
  // 2. layout + width (re-fetch after each variant change)
  instOf("Page / Body").setProperties({ "Content": plan.content });
  instOf("Page / Body / Default").setProperties({ "Type": plan.width, "Show side content#23483:22": plan.sideContent || !!plan.sideRoom });
if (plan.sideRoom) { const sr = slotOf("Side content"); if (sr) { for (const q of [...sr.children]) { try { q.remove(); } catch {} } N("side column left empty, like the reference"); } }
  // 3. main content
  const mainSlot = slotOf("Main content");
  const mph = [...mainSlot.children];
  if (plan.content.includes("Ghost") || plan.white) {
    const icComp = await figma.importComponentByKeyAsync("3595d612ef3d886a2dd9a4744add8b74f4ac9606");
    const wrapInIsland = nodesIn => {                                       // fill the island BEFORE it goes into the slot
      // NO CARD IN A CARD — the island is the card. A full-width wrapper in the block that draws a card of its own (TM: `Block`
      // p24 r12 border 1 around the AML check cards) loses that chrome, as in the reference; the small cards inside keep theirs.
      // Done BEFORE the move: once a block is inside the island's slot its sublayers get new ids and the old proxies throw.
      for (const g of nodesIn) { try { for (const c of [g, ...vis(g)]) if (stripCardChrome(c, g.width)) N("no card in a card: " + g.name + " › " + c.name); } catch {} }
      const ic = icComp.createInstance(); parent.appendChild(ic);
      try { ic.setProperties({ "Heading#26638:9": false }); } catch {}   // the block brings its own title (Block Title / Title)
      const slot = ic.findOne(n => isS(n) && n.name === "Slot");
      const ph = [...slot.children]; nodesIn.forEach((g, i) => slot.insertChild(i, g)); for (const q of ph) { try { q.remove(); } catch {} }
      const sl = ic.findOne(n => isS(n) && n.name === "Slot");
      for (const k of sl.children) { try { k.layoutSizingHorizontal = "FILL"; } catch {} }
      // an island hugs its content: an old wrapper with a FIXED height (it filled the old column — Case page Related cases: `Risk overview`
      // 708 tall around 352 of content) would leave an empty band; auto-layout frames go HUG, as in the reference
      for (const k of sl.children) { try { if (k.type === "FRAME" && k.layoutMode && k.layoutMode !== "NONE" && k.layoutSizingVertical !== "HUG") { const h0 = Math.round(k.height); k.layoutSizingVertical = "HUG"; if (Math.abs(k.height - h0) > 1) N("hugs its content: " + k.name + " " + h0 + " → " + Math.round(k.height)); } } catch {} }
      // every designers' reference (Case Overview 16:20783, Financial data 21:44203, TM Transaction 311:53619) sets the island's
      // Slot padding to 0 — the content sits right on the card's own 16. The published default 8 made every island 16 taller.
      try { for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { sl.setBoundVariable(p, null); } catch {} }
        sl.paddingTop = sl.paddingRight = sl.paddingBottom = sl.paddingLeft = 0; if (sl.children.length > 1) sl.itemSpacing = 16; } catch {}
      try { sl.layoutSizingVertical = "HUG"; } catch {}                  // island ships FIXED 153 with a FILL slot — HUG both
      try { ic.layoutSizingVertical = "HUG"; } catch {}
      return ic; };
    // a heading block (Block Title / Title) is not an island of its own — it rides on top of the next group
    // groups that are layers of an INSTANCE (Blueprint New blueprint: `Blueprint general settings` is an instance, General fields /
    // Assignment / … its layers) can't be moved — insertChild throws. They are cloned out, as rule 5 does with mixed wrappers, and the
    // instance itself is removed once the cards are placed. Its name is read BEFORE the removal (reading it after throws → rollback).
    const instAnc = g => { let top = null; for (let p = g.parent; p && p.id !== scr.id && p.type !== "PAGE"; p = p.parent) if (p.type === "INSTANCE") top = p; return top; };
    const wrappers = new Map();
    nodes.groups = nodes.groups.map(g => { const w = instAnc(g); if (!w) return g; if (!wrappers.has(w.id)) wrappers.set(w.id, { node: w, name: w.name }); return g.clone(); });
    if (wrappers.size) N("groups in instance " + [...wrappers.values()].map(w => w.name).join(", ") + " — cloned out");
    const bundles = []; let pending = [];
    for (const g of nodes.groups) { if (isHeadingBlock(g)) { pending.push(g); continue; } bundles.push([...pending, g]); pending = []; }
    if (pending.length) bundles.push(pending); { const mg = mergeSharedIslands(bundles, a.refRoot); if (mg.length < bundles.length) N("shared island (reference): " + mg.filter(b => b.length > 1).map(b => b.map(g => g.name).join(" + ")).join("; ")); bundles.length = 0; bundles.push(...mg); }
    const cards = [];
    for (const bundle of bundles) { if (plan.white) { cards.push(...bundle); continue; }
      // the reference decides first; the rules only where the block isn't in the reference
      if (bundle.length === 1 && isGraphic(bundle[0])) { cards.push(bundle[0]); N("graphic " + bundle[0].name + " stays bare"); continue; }
      const g0 = bundle[bundle.length - 1], rp = refPlacement(a.refRoot, g0.name) || (refIslandByKids(a.refRoot, g0) ? "island" : null);
      if (rp === "bare") { for (const g of bundle) cards.push(g); N("reference: " + g0.name + " bare"); continue; }
      if (rp === "island") { cards.push(wrapInIsland(bundle)); N("reference: " + g0.name + " in an island"); continue; }
      // already a card, or a stack of cards (Case page Overview tab content) → straight on grey, no wrapping island
      if (bundle.length === 1 && !rp && refUnboxed(a.refRoot, bundle[0])) { const box0 = bundle[0]; for (const part of vis(box0)) cards.push(part.clone()); N("reference dropped the card " + box0.name + " — its parts go bare: " + vis(box0).map(p => p.name).join(", ")); try { box0.remove(); } catch (e) { N("could not remove " + box0.name); } continue; }
if (bundle.length === 1 && rp !== "split" && (cardLike(bundle[0]) || isCardLayout(bundle[0]))) { cards.push(bundle[0]); continue; }
      if (bundle.length === 1 && (rp === "split" || isCardStack(bundle[0]))) {
        // a wrapper of cards (Case page Overview tab content): its parts become separate items of the main column,
        // exactly like the designers' after-reference. Cards stay bare, a non-card part (Transactions table) gets its own island.
        // The wrapper's own component link is lost (the reference does the same); every part stays a live instance.
        const stack = bundle[0]; const flat = [];
        for (const part of vis(stack)) { const c = part.clone(); const pp = refPlacement(a.refRoot, part.name);
          if (pp === "bare" || (pp !== "island" && (cardLike(part) || isCardLayout(part)))) { cards.push(c); continue; }
          flat.push(part.name); cards.push(wrapInIsland([c])); }
        if (flat.length) N("split " + stack.name + " into parts; islands added for: " + flat.join(", "));
        try { stack.remove(); } catch (e) { N("could not remove " + stack.name + " — guard will keep the source"); }
        continue; }
      cards.push(wrapInIsland(bundle));
    }
    cards.forEach((ic, i) => mainSlot.insertChild(i, ic));
    for (const w of wrappers.values()) { const wn = w.name; try { w.node.remove(); N("wrapper removed: " + wn); } catch {} }
  } else if (nodes.groups[0]) {
    mainSlot.insertChild(0, nodes.groups[0]);                               // (unused since 29.09 — every plan is Ghost)
  }
  for (const p of mph) { try { p.remove(); } catch {} }
// v3.246: a picture keeps its own size — KYC `image 1` (643×51 screenshot) was stretched to 1340×106
  for (const c of slotOf("Main content").children) { if (isGraphic(c)) continue; try { c.layoutSizingHorizontal = "FILL"; } catch {} try { if (c.layoutSizingVertical === "FILL") { c.layoutSizingVertical = "HUG"; N("hugs its content: " + c.name); } } catch {} }
  try { slotOf("Main content").layoutSizingVertical = "FILL"; } catch {}
  // 4–5. side columns → Aside. A column that brings its own background (an organism: Case page right column) gets an Aside
  // WITHOUT paddings and fills it; a bare list (section navigation) keeps the padded Aside.
  const intoAside = (node, which) => {
    const asides = page.findAll(n => isI(n) && n.name === "Page / Body / Aside");
    const as = which === "left" ? asides[0] : asides[asides.length - 1]; if (!as) { N("no Aside for " + which + " column"); return; }
    if (fillOf(node)) { try { as.setProperties({ "Paddings": "No" }); } catch {} }
    const as2 = page.findAll(n => isI(n) && n.name === "Page / Body / Aside"); const tgtAs = which === "left" ? as2[0] : as2[as2.length - 1];
    const slot = tgtAs.findOne(n => isS(n) && n.name === "Content"); const ph = [...slot.children];
    const nid = node.id, nname = node.name; slot.insertChild(0, node); for (const p of ph) { try { p.remove(); } catch {} }
    const moved = page.findOne(n => n.id === nid) || page.findOne(n => n.name === nname);          // slot insert invalidates proxies
    if (moved) { try { moved.layoutSizingHorizontal = "FILL"; } catch {} try { moved.layoutSizingVertical = "FILL"; } catch (e) { try { moved.layoutSizingVertical = "HUG"; } catch (e2) {} } } };
  // v3.261 white mode: the original's left navigation becomes the Page's section navigation. Items = instances named *item* that
// render and carry a text (outermost only); label = the first text, selected = a State/Selected property that reads active / yes / true.
const navFrom = L => { const tx = n => { const t = n.findOne(q => q.type === "TEXT" && q.visible && CT(q)); return t ? CT(t) : ""; };
const on = n => { try { return Object.entries(CP(n)).some(([k, v]) => /^(State|Selected)/.test(k) && /active|yes|true/i.test(String(v.value))); } catch { return false; } };
const its = L.findAll(n => isI(n) && /item/i.test(n.name) && rendered(n, scr) && tx(n)).filter((n, i, a) => !a.some(m => m !== n && contains(m, n)));
const sl = () => page.findAll(n => isS(n) && n.name === "Items" && /1st level/.test(n.parent.name))[0], l2 = () => sl().children.filter(k => /2nd level/.test(k.name));
if (!its.length || !sl() || !l2().length) { N("nav: not filled from the original"); return; }
while (l2().length < its.length) sl().appendChild(l2()[0].clone());
l2().forEach((k, i) => { if (i >= its.length) { k.visible = false; return; } const cn = Object.keys(CP(k)).find(q => /^Category name/.test(q)); try { k.setProperties({ [cn]: tx(its[i]), Selected: on(its[i]) ? "Yes" : "No" }); } catch {} });
N("nav from the original: " + its.length + " items"); };
if (nodes.left) { if (plan.white) navFrom(nodes.left); else intoAside(nodes.left, "left"); }
  if (nodes.right) {
    if (plan.sideContent) { const sc = slotOf("Side content");
      if (sc) { const ph = [...sc.children]; sc.insertChild(0, nodes.right); for (const p of ph) { try { p.remove(); } catch {} }
const sc2 = slotOf("Side content"), mv = sc2 && sc2.children[0];   // v3.230: the old column's FIXED height (865) grew the page to 977 — the column hugs its content
if (mv) { try { if (mv.layoutMode && mv.layoutMode !== "NONE" && mv.layoutSizingVertical !== "HUG") { const h0 = Math.round(mv.height); mv.layoutSizingVertical = "HUG"; N("side column hugs its content: " + mv.name + " " + h0 + " → " + Math.round(mv.height)); } } catch {} } } }
    else intoAside(nodes.right, "right");
    try { await sideFromReference(page, a.refRoot, nodes.right.name, labelValue, notes); } catch (e) { N("side from reference: " + e.message); }
  }
  // 6. header — the Page's OWN header, filled region by region from the original
  const getHdr = () => page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible); const hset = p => getHdr().setProperties(p);
  const hslot = re => { const h = getHdr(); return h && h.findAll(n => isS(n)).find(s => re.test(s.name)); };
  const fillSlot = (re, sources) => { const s = hslot(re); if (!s) { N("header has no slot " + re); return; } const ph = [...s.children];
    sources.forEach((o, i) => { const c = o.clone(); s.insertChild(i, c); try { c.visible = true; } catch {} }); for (const q of ph) { try { q.remove(); } catch {} } };
  const keepHdr = !a.refRoot && hdr0 && hdr0.type === "INSTANCE" && !/^\*Header\*/.test(mainName(hdr0));
  if (keepHdr) { const c = hdr0.clone(); parent.appendChild(c); c.visible = false; c.x = x; c.y = y; c.setSharedPluginData("sumsub_island", "hdrFor", page.id); N("header: the original's " + mainName(hdr0) + " is kept (no reference)"); }
  else if (getHdr()) {
    try { hset({ "Title text#3817:0": plan.title || name, "Key#5362:0": !!R.key, "Copy title#6943:15": !!R.copy,
        "Show Info slot#6985:0": !!R.status, "Show additional info slot#6943:18": !!R.addInfo }); } catch (e) { N("header props: " + e.message); }
    if (R.key) { try { hset({ "↪ Key Name#6943:13": R.key }); } catch {} }
    // v3.253: a header element the original SHOWS and the Page header exposes as a BOOLEAN of the same name (AP Actions: the
    // country `Flag` next to the name — the engine left `Flag#…` false) is switched on, and its variants (Country) copied
    // from the original. Only instances that render in the original — the reference's values are not data.
    { const hp = CP(getHdr());
      for (const k in hp) { const b = k.split("#")[0], o = hp[k].type === "BOOLEAN" && !hp[k].value && hdr0.findOne(n => isI(n) && n.name === b && rendered(n, scr)); if (!o) continue;
        try { hset({ [k]: true }); const t = getHdr().findOne(n => isI(n) && n.name === b), p = {}, oc = CP(o);
          for (const q in oc) if (oc[q].type === "VARIANT" && CP(t)[q]) p[q] = oc[q].value;
          t.setProperties(p); N("header " + b + " from the original"); } catch {} } }
    const bc = getHdr().findOne(n => isI(n) && /Breadcrumb/i.test(n.name)); const crumbText = R.crumb || crumb || refCrumb(a.refRoot);
    if (bc && crumbText) { try { bc.setProperties({ "Name#6638:5": crumbText }); } catch {} }
    else if (bc) { try { hset({ "Breadcrumbs#6913:0": false }); N("no breadcrumb — hidden"); } catch {} }
    const rh = a.refRoot ? a.refRoot.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible) : null;
    const refSlot = re => rh ? rh.findAll(n => isS(n) && re.test(n.name)).find(sl => sl.children.some(k => k.visible)) : null;
    // the reference's title counts only when it re-uses the original's data (TM: "Transfer: - 250,000.00 USD" ⊃ "250,000.00");
    // a placeholder title (Case refs: "SSO Login") shares nothing with the original and is ignored
    const refTitle = rh && CP(rh)["Title text#3817:0"] ? String(CP(rh)["Title text#3817:0"].value) : null;
    const reuses = t => (t.match(/[A-Za-z0-9][\w.,:+-]{3,}/g) || []).some(tok => /\d/.test(tok) && stackTexts.some(o => o.includes(tok)));
    if (refTitle && reuses(refTitle)) { try { const rc = CP(rh)["Copy title#6943:15"]; hset(Object.assign({ "Title text#3817:0": refTitle }, rc ? { "Copy title#6943:15": !!rc.value } : {})); N("title from the reference: " + refTitle); } catch {} }   // the copy button belongs to the title it sits next to
    const fixTexts = async root => { for (const t of (root.findAll ? root.findAll(q => q.type === "TEXT") : [])) { const c = CT(t);
        if (/^ID\s*:/i.test(c) && origId && c !== origId) { try { await figma.loadFontAsync(t.fontName); t.characters = origId; } catch {} } } };
    const rInfo = refSlot(/^Info slot/i), rAdd = refSlot(/^Additional info/i);
    if (rInfo) { try { hset({ "Show Info slot#6985:0": true });
        // the reference's row, but the ORIGINAL's data: a status with another label → the original status goes in; the counter gets the original score
        const stT = R.status ? (R.status.type === "TEXT" ? R.status : R.status.findOne(q => q.type === "TEXT" && q.visible)) : null, stLbl = stT ? CT(stT) : null;
        const src = rInfo.children.filter(k => k.visible).map(k => { const t = k.findOne ? k.findOne(q => q.type === "TEXT" && q.visible) : null;
          return (/Status/i.test(k.name) && stLbl && t && CT(t) !== stLbl) ? R.status : k; });
        fillSlot(/^Info slot/i, src);
        const sc = labelValue["score"]; const s1 = hslot(/^Info slot/i);
        if (sc && s1) for (const c of s1.children) if (/Counter/i.test(c.name)) { const t = c.findOne(q => q.type === "TEXT" && q.visible); if (t && CT(t) !== sc) { try { await figma.loadFontAsync(t.fontName); t.characters = sc; } catch {} } }
        N("info row from the reference" + (src.includes(R.status) ? ", status from the original" : "")); } catch (e) { N("ref info: " + e.message); } }
    else if (R.status) { try { fillSlot(/^Info slot/i, [R.status]); } catch (e) { N("status: " + e.message); } }
    if (rAdd) { try { hset({ "Show additional info slot#6943:18": true }); fillSlot(/^Additional info/i, rAdd.children.filter(k => k.visible));
        const s2 = hslot(/^Additional info/i); if (s2) await fixTexts(s2); N("additional info from the reference"); } catch (e) { N("ref additional info: " + e.message); } }
    else if (R.addInfo) { try { fillSlot(/^Additional info/i, vis(R.addInfo)); } catch (e) { N("additional info: " + e.message); } }
    // tabs — items live in the Tab Basic "Items wrapper" slot; clone one in when the original had more tabs than the header ships
    try { const tbOf = () => getHdr().findOne(n => /^\*Tab Basic\*/.test(n.name));
      const wsOf = () => { const tb = tbOf(); return tb && tb.findAll(n => isS(n)).find(s => /Items wrapper/i.test(s.name)); };
      if (tbOf() && plan.tabs.length) {
        for (let guard = 0; guard < 12; guard++) { const ws = wsOf(); if (!ws) break; const its = ws.children.filter(n => /Tab Basic \/ Item/i.test(n.name));
          if (its.length >= plan.tabs.length) break; ws.appendChild(its[its.length - 1].clone()); }
        const items = tbOf().findAll(n => /Tab Basic \/ Item/i.test(n.name));
        for (let i = 0; i < items.length; i++) { const it = items[i], c = plan.tabCnt[i]; try { if (i < plan.tabs.length) { it.visible = true; it.setProperties({ "Label text#4517:0": plan.tabs[i], "Selected": i === plan.tabSelected ? "true" : "false", "Counter#5190:0": !!c }); const nt = c && it.findOne(y => y.type === "TEXT" && y.name === "Number"); if (nt && nt.characters !== c) { await figma.loadFontAsync(nt.fontName); nt.characters = c; } } else it.visible = false; } catch {} }   // v3.247: a tab's counter comes along (AP Overview: Actions · 5)
        if (items.length < plan.tabs.length) N("header shows " + items.length + " of " + plan.tabs.length + " tabs"); }
    } catch (e) { N("tabs: " + e.message); }
// v3.246: dividers between the original's actions come along in their place (AP: icons | Request check · Change applicant status)
    const acts0 = R.actions.length ? R.actions : carry, acts = []; { const seen = new Set(), isA = k => acts0.some(a => a.id === k.id); for (const b of acts0) { const p = b.parent; if (seen.has(p.id)) continue; seen.add(p.id); const ks = p.children.filter(k => k.visible !== false), mine = ks.filter(isA), i0 = ks.findIndex(k => k.id === mine[0].id), i1 = ks.findIndex(k => k.id === mine[mine.length - 1].id); ks.forEach((k, i) => { if (isA(k) || (i > i0 && i < i1 && /Divider/i.test(k.name))) acts.push(k); }); } }
    if (acts.length) { try { hset({ "Show actions slot#6943:20": true }); if (!hslot(/Actions slot/i)) { hset({ "Show actions slot#6943:20": false }); N("the header has no actions slot — left off"); } else { fillSlot(/Actions slot/i, acts);
        for (const c of [...hslot(/Actions slot/i).children]) { try { const tt = c.findOne(q => q.type === "TEXT" && q.visible); if (tt && /^Button$/i.test(CT(tt))) c.remove(); } catch {} }
// v3.246: an action already shown in the Info / Additional info rows is not repeated — the AP header keeps ID / External ID / Add tag
// in a row outside its Buttons bar, `carry` took them as actions while the reference's Additional info row brought them too
{ const hp = CP(getHdr()), taken = new Set(); for (const [re, pr] of [[/^Info slot/i, "Show Info slot#6985:0"], [/^Additional info/i, "Show additional info slot#6943:18"]]) { const s = hslot(re); if (!s || !hp[pr] || hp[pr].value !== true) continue; for (const k of s.children) if (k.visible && k.findAll) for (const t of k.findAll(q => q.type === "TEXT" && q.visible && CT(q))) taken.add(CT(t)); }
for (const c of [...hslot(/Actions slot/i).children]) { try { const t = c.findOne && c.findOne(q => q.type === "TEXT" && q.visible && CT(q)), l = t ? CT(t) : ""; if (l && taken.has(l)) { N("action \"" + l + "\" already in the info rows"); c.remove(); } } catch {} } }
        // the published header brings its own Summy AI and help icons outside the Actions slot; the old header kept them inside its Actions
        // row, so they were copied twice (Case page AML / Financial data). An icon-only copy whose icon the header already shows goes.
        try { const hh = getHdr(), asl = hslot(/Actions slot/i); const inAsl = n => { let q = n.parent; while (q && q.id !== hh.id) { if (q.id === asl.id) return true; q = q.parent; } return false; }; const shownIn = n => { let q = n; while (q && q.id !== hh.id) { if (q.visible === false) return false; q = q.parent; } return true; }; const own = new Set(hh.findAll(n => isI(n) && /^(normal|small|large)\//.test(n.name) && shownIn(n) && !inAsl(n)).map(n => n.name)); for (const c of [...asl.children]) { try { if (c.findOne(q => q.type === "TEXT" && q.visible && CT(q))) continue; const ic = c.findOne(q => q.type === "INSTANCE" && /^(normal|small|large)\//.test(q.name)); if (ic && own.has(ic.name)) { N("the header has its own " + ic.name + " — copy removed"); c.remove(); } } catch {} } } catch {}
// v3.246: no divider at the edges of the Actions slot after removals
      { const s = hslot(/Actions slot/i), dv = k => /Divider/i.test(k.name), vk = () => s.children.filter(k => k.visible); if (s) { let ks = vk(); while (ks.length && dv(ks[0])) { ks[0].remove(); ks = vk(); } while (ks.length && dv(ks[ks.length - 1])) { ks[ks.length - 1].remove(); ks = vk(); } } }
const asl2 = hslot(/Actions slot/i); if (asl2 && !asl2.children.some(k => k.visible)) { hset({ "Show actions slot#6943:20": false }); N("actions slot empty — left off"); } } } catch (e) { N("actions: " + e.message); } }
  }
  // 7. overlays beside the instance (its children are locked)
  try { await carrySidebar(nodes.sidebar, page, notes); } catch (e) { N("sidebar: " + e.message); }
{ const spans = page.findAll(n => { try { return n.getSharedPluginData("sumsub_island", "span") === "1"; } catch (e) { return false; } }); let k = 0;
for (const n of spans) { try { n.setSharedPluginData("sumsub_island", "span", ""); if (n.layoutSizingHorizontal !== "FILL" && n.parent && n.parent.layoutMode === "VERTICAL") { n.layoutSizingHorizontal = "FILL"; k++; } } catch {} }
if (k) N("spanning blocks kept: " + k); }
for (const ov of nodes.overlays) { try { const ob = box(ov, scr); parent.appendChild(ov); ov.x = x + ob.x; ov.y = y + ob.y; } catch {} }
  // 8. keep the original size
  try { page.resize(origW, origH); } catch {}
  // what the header stack carried but the result doesn't show (e.g. Transaction Date when the side panel has no such row)
  try { const shown = new Set(page.findAll(t => t.type === "TEXT" && t.visible).map(t => CT(t)));
    const shownLow = new Set([...shown].map(t => t.toLowerCase()));
    const lost = Object.entries(labelValue).filter(([k, v]) => !shown.has(v) && !shownLow.has(k)).map(([k, v]) => k + ": " + v); if (lost.length) N("header values not placed: " + lost.join(", ")); } catch {}
  // 9. PRESERVATION GUARD — the source may only go if nothing visible is left outside its old header (stack), sidebar and subheader
  // v3.261: the nav's search follows the original. Last write on the page: after it Figma's cached nav layers go stale, so nothing walks the page later.
  if (plan.white && nodes.left && nodes.left.findOne(n => /search/i.test(n.name) && rendered(n, scr))) try { const nv = page.findOne(n => isI(n) && n.name === "Section navigation"); nv.setProperties({ [Object.keys(CP(nv)).find(q => /^Search/.test(q))]: true }); N("nav: search on, as in the original"); } catch {}
  _idCache.clear();                                                          // the tree changed — rebuild id sets
  const leftover = scr.findAll(n => (n.type === "TEXT" ? CT(n) !== "" : isI(n)) && n.visible !== false && rendered(n, scr) &&
      !contains(nodes.header, n) && !contains(nodes.header2, n) && !contains(nodes.sidebar, n) && !contains(nodes.subheader, n) && !(nodes.scrollbars || []).some(sb => contains(sb, n)) && !(plan.white && contains(nodes.left, n)));
  // never rename a layer (designers' rule): the source keeps its name; `kept` says what stayed in it
  if (leftover.length) {
    return { page, kept: [...new Set(leftover.map(n => n.name))], notes }; }
  try { scr.remove(); } catch {}
  return { page, kept: [], notes };
}

// ─── VARIABLES (plugin doc §6.1, v3.209.0) ───
// With a designer after-reference: copy its fill/stroke bindings block by block. Without one: the §6.1 defaults.
const repaint = (n, prop, variable) => { const base = n[prop] && n[prop][0] ? JSON.parse(JSON.stringify(n[prop][0])) : { type: "SOLID", color: { r: 1, g: 1, b: 1 } };
  delete base.boundVariables; n[prop] = [figma.variables.setBoundVariableForPaint(base, "color", variable)]; };
async function copyVarsFromRef(refRoot, page, anchors) {
  const SEP = " › ", applied = [], skipped = [];
  const { resolve, prefetch } = await varResolver();
  const visFill = n => n.fills && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false;
  const visStroke = n => n.strokes && n.strokes.length && n.strokes[0].type === "SOLID" && n.strokes[0].visible !== false;
  // pairs come from a parallel walk, not from paths: where the reference hid, added or reordered a layer (Case page Events: the first
  // event's top connector line hidden + its `Info` padding 0), path indices shift and the wrong layers get each other's values. A block
  // whose children's layer lists differ from the reference is paired itself but not descended into.
  // …except where the only difference is how many times a layer repeats — a list whose length is data (Blueprint overview block: the
  // reference shows 7 `.Blueprint overview item`, the original 9; table rows). Consecutive same-named layers are compared as one run:
  // runs pair index by index, extra layers take the last reference layer of their run (v3.217.8 — before, the walk stopped at `Content`
  // and the 9 items kept the white fill the designer hid on all 7).
  const kidsOf = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
  // a heading pairs by ROLE: the designer swaps the old `Block Title (🔴Figma only)` for `Heading` (Blueprint Assignment / Deadlines, top
  // padding 16 → 0) — by name they never met and every such island stayed 16 taller
  const roleOf = nm => /^(Block Title|Body \/ Title|Heading|Title|Header)\b/i.test(nm) ? "⟨heading⟩" : nm;
  const runs = list => { const out = []; for (const k of list) { const l = out[out.length - 1], nm = roleOf(k.name); if (l && l.name === nm) l.items.push(k); else out.push({ name: nm, items: [k] }); } return out; };
  const runSig = n => runs(kidsOf(n)).map(r => r.name).join("|");
  const matchKids = (rk, bk) => { const rr = runs(rk), br = runs(bk); if (rr.length !== br.length || rr.some((r, i) => r.name !== br[i].name)) return null;
    const p = []; br.forEach((b, i) => b.items.forEach((k, j) => p.push([rr[i].items[Math.min(j, rr[i].items.length - 1)], k]))); return p; };
  // the same component in ANOTHER VARIANT (reference items State=On, the original's State=Off): what differs between them is the
  // variant — the data — not the designer's layout. Such a pair is not descended into (text / icon colours stay the original's), and
  // on the pair itself only what the reference overrides against its own main component is copied (the hidden white fill).
  const otherVariant = (r, b) => { if (r.type !== "INSTANCE" || b.type !== "INSTANCE") return false;
    try { const rp = CP(r) || {}, bp = CP(b) || {};
      return Object.keys(rp).some(k => rp[k].type === "VARIANT" && bp[k] && bp[k].type === "VARIANT" && rp[k].value !== bp[k].value); } catch (e) { return false; } };
  const pairsOf = (rRoot, bRoot) => { const out = []; const walk = (r, b, path, style) => { const ov = otherVariant(r, b); const e = [path, r, b, ov, style ? (style === "paint" ? "paint" : "style") : "full"]; out.push(e); if (ov) return;
  let kids = matchKids(kidsOf(r), kidsOf(b)); if (!kids) { const r1 = kidsOf(r); if (r1.length === 1 && r1[0].type === "FRAME" && kidsOf(b).length > 1) kids = matchKids(kidsOf(r1[0]), kidsOf(b)); if (!kids) { const b1 = kidsOf(b); if (r1.length === 1 && b1.length === 1 && r1[0].type === "FRAME" && b1[0].type === "FRAME") kids = [[r1[0], b1[0]]]; } if (!kids && kidsOf(b).length > 1) { const w = kidsOf(r).find(x => x.type === "FRAME" && matchKids(kidsOf(x), kidsOf(b))); if (w) { kids = matchKids(kidsOf(w), kidsOf(b)); e[1] = w; } } }   // v3.233: the reference wraps exactly our children in one of its wrappers — Submit compliance: Frame 2131328741 › Content › 4× Customize setup; our block takes that wrapper's spacing   // v3.231: one wrapper each side, names differ (Verify your VASP: ref `Content` ↔ our `.Content`)   // v3.230: the reference wraps the blocks in one extra frame (TM Settings / Create a VASP: IslandCard › Slot › Content › blocks) — pair through it
  if (!kids) { let bw = b; for (let d = 0; d < 2 && !kids; d++) { const b1 = kidsOf(bw); if (b1.length !== 1 || b1[0].type !== "FRAME" || kidsOf(r).length < 2) break; bw = b1[0]; kids = matchKids(kidsOf(r), kidsOf(bw)); } if (kids) { if (b.type === "INSTANCE" || isCard(b)) { if (!style) out.push([path + SEP + bw.name, r, bw, false, "gaps"]); } else e[2] = bw; } }   // v3.238: our side has one or two extra single wrappers (TM Travel Rule settings: Frame 2085664018 › Frame 2085664033 vs the reference's Content) — pair through them   // v3.247: when our outer block is an instance or a card itself (AP Overview: Info Card › General info vs the reference's Info Card), its fill / stroke / radius / padding stay on it and only the gaps go to the inner wrapper — before, the card chrome landed on the wrapper: a card inside the card
  if (!kids) { if (!style) e[4] = "restructured"; const rk = kidsOf(r), bk = kidsOf(b), once = (l, nm) => l.filter(x => x.name === nm).length === 1; for (const m of bk) if (once(bk, m.name) && once(rk, m.name)) walk(rk.find(x => x.name === m.name), m, path + SEP + m.name, "paint");
    if (path === "·" && rk.length === bk.length) bk.forEach((m, i) => { const x = rk[i]; if (x.name !== m.name && !rk.some(y => y.name === m.name) && !bk.some(y => y.name === x.name) && x.type === m.type && cardLike(x) === cardLike(m)) walk(x, m, path + SEP + m.name, "paint"); }); return; }   // v3.250: at a column's top block, children the designer renamed pair by position — same type, both cards or both not — paints only (Overview #2: Info Card border, Header without fill); deeper, auto-named frames would pair by accident (CM blueprints)
  const deep = !style && !kids.some(([x, y]) => runSig(x) !== runSig(y) && !(x.type === "INSTANCE" && y.type === "INSTANCE"));   // v3.247: two instances whose sublayers differ (the designer's newer version of the component) don't make the block "rebuilt" — AP Overview: Body kept the old page paddings 24/32/64/32 because Info Card's inner layers differ, while the reference has 0 if (!style && !deep) e[4] = "stopped";
  const cnt = {}; kids.forEach(([k, m]) => { cnt[m.name] = (cnt[m.name] || 0) + 1; walk(k, m, path + SEP + m.name + (cnt[m.name] > 1 ? "#" + cnt[m.name] : ""), style === "paint" ? "paint" : !deep); }); };
  walk(rRoot, bRoot, "·", false); return out; };
  const bodySlots = root => root.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const inChrome = n => { for (let p = n.parent; p && p.type !== "PAGE"; p = p.parent) if (p.type === "INSTANCE" && /^\*(Sidebar|Header)\*$/.test(p.name)) return true; return false; };
// Blocks pair inside the content slots only: a same-named frame inside the sidebar or the header is chrome, not content.
const inBody = (root, a) => { const sl = bodySlots(root), seen = new Set(); return (sl.length ? sl : [root]).flatMap(s => s.findAll(n => n.name === a && n.visible && !inChrome(n))).filter(n => !seen.has(n.id) && seen.add(n.id)); };
// a variable from the reference, imported into this file when it lives in a library
const vOf = async id => { try { let v = await figma.variables.getVariableByIdAsync(id); return v && v.remote && v.key ? await figma.variables.importVariableByKeyAsync(v.key) : v; } catch (e) { return null; } };
const bvOf = (n, prop) => n.boundVariables && n.boundVariables[prop] && n.boundVariables[prop][0] ? n.boundVariables[prop][0].id : null;
  const runAnchor = async a => { let gone = 0;
    const R = inBody(refRoot, a), B = inBody(page, a);
    for (let i = 0; i < Math.min(R.length, B.length); i++) { let mr; try { mr = pairsOf(R[i], B[i]); } catch (e) { skipped.push(a + ": walk failed " + e.message); continue; }
      await prefetch(paintIds(mr.map(e => e[1])));
      for (const [path, rn, bn, ov, mode] of mr) { try {
        let mc = null; if (ov) { try { mc = await rn.getMainComponentAsync(); } catch {} }   // another variant: compare with the reference's own main
        if (a === ICN && (path === "·" || (path === "·" + SEP + "Slot" && bn.type === "SLOT"))) continue;       // published internals win
        // sizing: the designers switch fixed-width blocks to FILL (or pin a column FIXED) when the content gets wider — copy it
        // …but never a FIXED width that doesn't fit where the block now sits: the published Aside is 400 and doesn't stretch, while a
        // branch reference may show the same column at 424 with no panel around it (Case page right column → 24 px overflow).
        // a rotated layer's width is its length (Events connector lines, -90°: width 76 in a 16 frame) — sizing is not compared or copied
        if (mode !== "paint" && mode !== "gaps" && !(rn.type === "LINE" || rn.type === "VECTOR" || Math.abs(rn.rotation || 0) > 0.5 || Math.abs(bn.rotation || 0) > 0.5)) try { const rs = rn.layoutSizingHorizontal, bs = bn.layoutSizingHorizontal, pa = bn.parent;
          const inPanel = !!pa && (pa.type === "SLOT" && (pa.name === "Side content" || (pa.name === "Content" && pa.parent && /Aside/.test(pa.parent.name))));
          const room = pa && typeof pa.width === "number" ? pa.width - (pa.paddingLeft || 0) - (pa.paddingRight || 0) : Infinity;
          const rpar = rn.parent, rpRoom = rpar && typeof rpar.width === "number" ? rpar.width - (rpar.paddingLeft || 0) - (rpar.paddingRight || 0) : null, refFits = rpRoom == null || rn.width <= rpRoom + 1;   // v3.234: a block that overflows its parent in the reference too is meant that way (Submit compliance stepper icons 16 in a 10 room) — not squeezed
if (rs === "FIXED" && (inPanel || (rn.width > room + 1 && refFits))) { if (bs !== "FILL") { try { bn.layoutSizingHorizontal = "FILL"; applied.push(a + path + " width → FILL (reference width " + Math.round(rn.width) + " doesn't fit " + Math.round(room) + ")"); } catch {} } }
          else {
            const keepFill = rs === "FIXED" && bs === "FILL" && rpRoom != null && Math.abs(rn.width - rpRoom) <= 1;   // v3.238: the reference block is FIXED at exactly its parent's width — FILL already spans; switching it to FIXED was noise (Financial data heading)
if (rs && bs && rs !== bs && !keepFill) { bn.layoutSizingHorizontal = rs; applied.push(a + path + " width → " + rs); }
            // a FIXED layer that spans its parent in the reference (FIU table row dividers: 884 in an 884 row) spans OUR parent — copying the
            // number would leave it 24 short in a wider island. Only changes that actually took are logged.
            if (rs === "FIXED" && !keepFill) { const rp = rn.parent, rroom = rp && typeof rp.width === "number" ? rp.width - (rp.paddingLeft || 0) - (rp.paddingRight || 0) : null; const spans = rroom != null && Math.abs(rn.width - rroom) <= 1 && room !== Infinity, target = spans ? room : rn.width; if (Math.abs(target - bn.width) > 1) { const w0 = bn.width; bn.resize(target, bn.height); if (Math.abs(bn.width - w0) > 0.5) applied.push(a + path + " width " + Math.round(target) + (spans ? " (spans its parent, as in the reference)" : "")); } } }
        } catch {}
        // paddings and gaps: the designers retune a block's inner spacing for the island layout (TM: `Customers card / Finance`,
        // heading and info padding 24 → 16) — take the reference's value, bound to its spacing variable when it has one
        // a grid child's alignment in its cell (CM team overview: `Team` MIN → AUTO in the reference, with FILL)
        try { if (mode !== "paint" && mode !== "gaps" && rn.parent && bn.parent && rn.parent.layoutMode === "GRID" && bn.parent.layoutMode === "GRID") for (const k of ["gridChildHorizontalAlign", "gridChildVerticalAlign"]) {
            if (rn[k] && bn[k] && rn[k] !== bn[k] && !(ov && mc && mc[k] === rn[k])) { bn[k] = rn[k]; applied.push(a + path + " " + (k === "gridChildHorizontalAlign" ? "cell align H" : "cell align V") + " → " + rn[k]); } } } catch {}
        // pairing modes (CM managers overview: `Open cases`, `TR widget`, `Team` moved their side padding 16 into new wrapper frames we don't have):
        //  full — the whole subtree pairs: copy everything;  stopped — own children pair but one of them is restructured: copy only top / bottom
        //  padding and gaps (the side padding went into layers we don't have — copying 16/0/16/0 left titles flush with the card edge);
        //  restructured — own children don't pair: top / bottom padding only;  style — below a stopped block: width, radius, paint, never spacing
        //  (Case page Events: an event's Info padding 12 → 0 compensates a line hidden elsewhere in the reference)
        // a GRID has no itemSpacing of its own — its gaps are gridRowGap / gridColumnGap (CM team overview: the Team / SLA grid's bottom
        // padding 16 → 0 in the reference; skipping grids left 16 px of extra grey under the row)
        const gapOnly = mode === "style" && kidsOf(rn).length >= 2 && runSig(rn) === runSig(bn);
const headPair = mode === "style" && roleOf(rn.name) === "⟨heading⟩" && roleOf(bn.name) === "⟨heading⟩";   // v3.238: a section heading takes the reference's top / bottom padding — the old 32/12 spaced sections on the full-bleed page, in an island it is 0/0 (TM Travel Rule settings)   // v3.230: a block with exactly the reference's children takes its gaps even in style mode (Create a VASP fields: 24 → 16); never its side paddings
try { if ((gapOnly || headPair || (mode !== "style" && mode !== "paint")) && rn.layoutMode && rn.layoutMode !== "NONE" && bn.layoutMode === rn.layoutMode) { const changed = [];
            const spKeys = rn.layoutMode === "GRID" ? ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gridRowGap", "gridColumnGap"] : ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"];
            const rootTop = path === "·" && !!bn.parent && bn.parent.type === "SLOT";
      const keys0 = headPair ? spKeys.filter(k => k === "paddingTop" || k === "paddingBottom") : (gapOnly || mode === "gaps") ? spKeys.filter(k => !/padding/.test(k)) : mode === "full" ? spKeys : spKeys.filter(k => k === "paddingTop" || k === "paddingBottom" || (mode === "stopped" && !/padding/.test(k)));
      const keys = rootTop ? [...new Set([...keys0, "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"])] : keys0;
            for (const k of keys) {
              const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k]; if (mode !== "full" && !headPair && !rootTop && rv === 0 && (bn[k] || 0) > 0 && /^padding/.test(k)) continue;
              if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
              if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;                       // the variant's own spacing, not an override
              const v = rbv ? await vOf(rbv.id) : null;
              try { bn.setBoundVariable(k, null); } catch {}
              if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
              changed.push((k === "itemSpacing" ? "gap" : k === "gridRowGap" ? "row gap" : k === "gridColumnGap" ? "column gap" : k.replace("padding", "").toLowerCase()) + " " + Math.round(rv)); }
            if (changed.length) applied.push(a + path + " spacing → " + changed.join(", ")); } } catch (e) { skipped.push(a + path + " spacing: " + e.message); }
        // corner radius: the designers round the cards up for the island layout (CM Overview for managers: `.To do`, `Team` … 12 → 16,
        // bound to border-radius/xl) while some blocks keep theirs (`Documents block old` stays 12 in every reference) — so take the
        // paired reference layer's radius, bound to its variable when it has one, instead of a blanket rule
        try { if (mode !== "paint" && mode !== "gaps" && "topLeftRadius" in rn && "topLeftRadius" in bn) { let changed = false;
            for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
              const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k]; if (mode !== "full" && rv === 0 && (bn[k] || 0) > 0 && /^padding/.test(k)) continue;
              if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
              if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;                       // the variant's own radius, not an override
              const v = rbv ? await vOf(rbv.id) : null;
              try { bn.setBoundVariable(k, null); } catch {}
              if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
              changed = true; }
            if (changed) applied.push(a + path + " radius → " + Math.round(rn.topLeftRadius || 0)); } } catch (e) { skipped.push(a + path + " radius: " + e.message); }
            // v3.263: a height (or min/max height) the reference binds to a variable — e.g. *Empty State* on
            // dimension/45 = 360 — is bound the same way here; the original's fixed height (400) made the island taller.
            try { if (mode !== "paint" && mode !== "gaps" && !ov) for (const k of ["height", "minHeight", "maxHeight"]) { const rb = rn.boundVariables && rn.boundVariables[k], bb = bn.boundVariables && bn.boundVariables[k]; if (!rb || (bb && bb.id === rb.id)) continue; const v = await vOf(rb.id); if (v) { bn.setBoundVariable(k, v); applied.push(a + path + " " + k + " → " + v.name); } } } catch (e) { skipped.push(a + path + " height: " + e.message); }
        if (mode !== "gaps") for (const prop of ["fills", "strokes"]) { try {
          const rVis = prop === "fills" ? visFill(rn) : visStroke(rn), bVis = prop === "fills" ? visFill(bn) : visStroke(bn);
          if (ov && (!mc || (rVis === (prop === "fills" ? visFill(mc) : visStroke(mc)) && bvOf(rn, prop) === bvOf(mc, prop)))) continue;   // the variant's own paint
          const rb = rn.boundVariables && rn.boundVariables[prop] && rn.boundVariables[prop][0], bb = bn.boundVariables && bn.boundVariables[prop] && bn.boundVariables[prop][0];
          if (rVis && rb) { const t = await resolve(rb.id), v0 = t && t.to, v = v0 && /^base\//i.test(v0.name) ? ((await semanticFor(v0.name, bn, prop)) || v0) : v0;   // the reference's paint as its CURRENT variable (see varResolver)
            if (!v) { skipped.push(a + path + " " + prop + ": variable not found"); continue; }
            if (bVis && bb && bb.id === v.id) continue;
            const base = JSON.parse(JSON.stringify(rn[prop][0])); delete base.boundVariables; bn[prop] = [figma.variables.setBoundVariableForPaint(base, "color", v)];
            applied.push(a + path + " " + prop + " → " + v.name); }
          else if (!rVis && bVis) { bn[prop] = []; applied.push(a + path + " " + prop + " → none"); }   // v3.244: strokes too — the reference drops the Summary's own border because the Aside draws it (else a double line)
        } catch (e) { skipped.push(a + path + " " + prop + ": " + e.message); } } } catch (e) { gone++; } } }
  // v3.244: pairs are collected first, and a write to a block can rebuild its sublayers — a later pair then points at a layer that is gone
  // ("in get_rotation: The node … does not exist", AP page, twice). The pair is counted, the walk goes on, and the block is walked again
  // with fresh layers (writes already made are no-ops then), up to 3 passes.
  return gone; };
  let todo = anchors;
  for (let pass = 0; pass < 3 && todo.length; pass++) { const next = []; for (const a of todo) if (await runAnchor(a)) next.push(a); todo = next; }
  if (todo.length) skipped.push("layers changed under the walk in " + todo.join(", ") + " — run the copy part again");
  return { applied, skipped };
}
// v3.230: a bare block can be a wrapper whose one child is the visible card of the same size (TM Settings / Let’s set up: `.Content` › `.Content`) — the island colours go on that card too
const cardTargets = k => (!k.visible || k.name === ICN || !cardLike(k)) ? [] : [k, ...vis(k).filter(c => c.type !== "INSTANCE" && isCard(c) && Math.abs(c.width - k.width) < 2 && Math.abs(c.height - k.height) < 2)];
async function applyIslandTokens(page) {
  const K = { cardFill: "da81bccfef06f3de221bafbb9b5ee6a161eb9000", border: "40baade65c87f4b56fd67b027ec695d0984fae39", row: "b651c3b1b3a1d5b4066af62493435b81f3635acb" };
  const v = {}; for (const [k, key] of Object.entries(K)) v[k] = await figma.variables.importVariableByKeyAsync(key);
  const log = [];
  const ms = slotOf("Main content");
  // bare cards on the grey: secondary fill + subtlest border
  for (const k0 of (ms ? ms.children : [])) for (const k of cardTargets(k0)) {
    try { if (isWhite(k)) repaint(k, "fills", v.cardFill); if (hasStroke(k) && !(await statusPaint(k, "strokes"))) repaint(k, "strokes", v.border); log.push("card " + k.name); } catch (e) { log.push("card " + k.name + ": " + e.message); } }
  // side columns (Aside content / Side content): border subtlest on the column and its first bordered block
  const sideSlots = page.findAll(n => isS(n) && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
  for (const s of sideSlots) for (const k of s.children) { try { if (hasStroke(k)) repaint(k, "strokes", v.border);
      const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c)) : null; if (top) repaint(top, "strokes", v.border); log.push("side " + k.name); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
  // inside islands: a table's wrapper frame loses its fill (the island is the white), white table rows get the table-row token
  for (const ic of page.findAll(n => isI(n) && n.name === ICN)) { const sl = ic.findOne(n => isS(n)); if (!sl) continue;
    for (const k of sl.children) { try { if (k.type === "FRAME" && fillOf(k) && k.findOne(x => /table/i.test(x.name))) { k.fills = []; log.push("table wrapper " + k.name + " → no fill"); } } catch {} }
    for (const r of sl.findAll(n => /(^|\/ )(Table )?Row(#\d+)?$/i.test(n.name) && isWhite(n))) { try { repaint(r, "fills", v.row); } catch {} } }
  return log;
}
// after buildIsland: reference first, §6.1 defaults otherwise. refId comes from the copy's name "… (ref <nodeId>)".
async function bareCardTokens(page) {   // §6.1 for cards standing bare on the grey and for side columns — with a reference too (v3.228: the TM Settings reference itself kept the pre-island border/subtle and a raw white)
const v = { cardFill: await figma.variables.importVariableByKeyAsync("da81bccfef06f3de221bafbb9b5ee6a161eb9000"), border: await figma.variables.importVariableByKeyAsync("40baade65c87f4b56fd67b027ec695d0984fae39") };
const log = [], ms = slotOf("Main content");
for (const k0 of (ms ? ms.children : [])) for (const k of cardTargets(k0)) {
try { const fb = k.fills[0] && k.fills[0].boundVariables && k.fills[0].boundVariables.color, sb = k.strokes && k.strokes[0] && k.strokes[0].boundVariables && k.strokes[0].boundVariables.color;
if (isWhite(k) && !(fb && fb.id === v.cardFill.id)) { repaint(k, "fills", v.cardFill); log.push("card " + k.name + " fill → " + v.cardFill.name); }
if (hasStroke(k) && !(sb && sb.id === v.border.id) && !(await statusPaint(k, "strokes"))) { repaint(k, "strokes", v.border); log.push("card " + k.name + " stroke → " + v.border.name); } } catch (e) { log.push("card " + k.name + ": " + e.message); } }
const sideSlots = page.findAll(n => isS(n) && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
for (const s of sideSlots) for (const k of s.children) { try { if (k.type === "INSTANCE") continue; if (hasStroke(k)) repaint(k, "strokes", v.border);
const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c) && c.type !== "INSTANCE") : null; if (top) repaint(top, "strokes", v.border); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
{ let rx = null; try { rx = await figma.variables.importVariableByKeyAsync("03884e014085a48cf26670632be200a02b5a160c"); } catch {}   // v3.235: designers' rule "radius 12 → 16" for white cards on the grey (Checklist row); not inside islands, not tinted blocks — the Alert keeps 12
const inIsland = n => { for (let q = n.parent; q && q.id !== page.id; q = q.parent) if (q.type === "INSTANCE" && q.name === ICN) return true; return false; };
if (rx && ms) for (const k of ms.findAll(n => n.visible !== false && (n.type === "FRAME" || isI(n)) && n.cornerRadius === 12 && isWhite(n) && hasStroke(n) && !inIsland(n))) {
try { for (const p of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) k.setBoundVariable(p, rx); log.push("card " + k.name + " radius 12 → 16"); } catch {} } }
return log; }
// v3.236: the designer moved a sibling into a wrapper (Complete to-do list: the Alert went into the rows' wrapper, gap 8). If a reference
// frame holds exactly our frame's children plus blocks that are our frame's unique siblings, those siblings move in, in the reference's
// order, and our frame takes the reference frame's gap and its children's FILL widths
async function regroupLikeReference(refRoot, page) {
const log = []; const names = n => vis(n).map(k => k.name);
const ourSlots = page.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const refSlots = refRoot.findAll(n => isS(n) && /^(Main content|Side content)$/.test(n.name));
const ours = []; const walk = n => { if (isI(n) || !("children" in n)) return; if (n.type === "FRAME" && n.layoutMode && n.layoutMode !== "NONE" && vis(n).length >= 1) ours.push(n); for (const k of n.children) walk(k); };
for (const s of ourSlots) for (const k of s.children) walk(k);
const refs = refSlots.flatMap(s => s.findAll(n => n.type === "FRAME" && n.layoutMode && n.layoutMode !== "NONE" && vis(n).length >= 2));
const nameCount = {}; for (const n of ours) nameCount[n.name] = (nameCount[n.name] || 0) + 1;
for (const B of ours) { const bn = names(B); if (!B.parent || nameCount[B.name] > 1 || !vis(B).every(k => k.type === "INSTANCE") || refs.some(W => names(W).join("|") === bn.join("|"))) continue;   // component instances only — auto-named frames match by accident (CM team: dozens of Frame 2709… rows)
for (const W of refs) { const wn = names(W); if (wn.length <= bn.length || W.layoutMode !== B.layoutMode) continue;   // v3.250: never into a frame of another direction (Overview #2: Header moved into the horizontal Cards, beside the Empty State)
let i = 0; const extras = []; for (const nm of wn) { if (i < bn.length && nm === bn[i]) i++; else extras.push(nm); }
if (i !== bn.length || !extras.length) continue;
const sibs = vis(B.parent).filter(x => x.id !== B.id); const movers = extras.map(nm => sibs.filter(x => x.name === nm));
if (movers.some(m => m.length !== 1 || m[0].type !== "INSTANCE")) continue;
wn.forEach((nm, idx) => { const m = movers.flat().find(x => x.name === nm); if (m) { try { B.insertChild(Math.min(idx, B.children.length), m); } catch {} } });
const rbv = W.boundVariables && W.boundVariables.itemSpacing; let v = null;
if (rbv) { try { v = await figma.variables.getVariableByIdAsync(rbv.id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); } catch {} }
try { B.setBoundVariable("itemSpacing", null); } catch {} if (v) { try { B.setBoundVariable("itemSpacing", v); } catch (e) { B.itemSpacing = W.itemSpacing; } } else B.itemSpacing = W.itemSpacing;
const wk = vis(W), bk = vis(B); bk.forEach((k, j) => { try { if (wk[j] && wk[j].layoutSizingHorizontal === "FILL" && k.layoutSizingHorizontal !== "FILL") k.layoutSizingHorizontal = "FILL"; } catch {} });
log.push(B.name + ": moved in " + extras.join(", ") + " like the reference " + W.name + ", gap " + Math.round(W.itemSpacing)); break; } }
return log;
}
// v3.238: a component's Size is layout, not data — the designers took *Collapsible Card* Large → Medium in TM Travel Rule settings, and a
// different variant stops the reference walk, so nothing inside the cards was copied. Applied only when every instance of that component set in
async function alignSizeVariants(refRoot, page) {   // the reference's slot has one Size; State, Type etc. stay data
const log = [];
const topIn = (n, stopId) => { for (let q = n.parent; q && q.id !== stopId; q = q.parent) { if (q.type === "SLOT") return true; if (q.type === "INSTANCE") return false; } return true; };
const setOf = n => { try { const m = n.mainComponent; return m && m.parent && m.parent.type === "COMPONENT_SET" ? m.parent.name : null; } catch (e) { return null; } };
const sizeOf = n => { try { const p = CP(n) && CP(n).Size; return p && p.type === "VARIANT" ? String(p.value) : null; } catch (e) { return null; } };
const bySet = l => { const m = new Map(); for (const n of l) { const s = setOf(n); if (!s) continue; if (!m.has(s)) m.set(s, []); m.get(s).push(n); } return m; };
for (const nm of ["Main content", "Side content"]) {
const B = page.findAll(n => isS(n) && n.name === nm)[0], R = refRoot.findAll(n => isS(n) && n.name === nm)[0]; if (!B || !R) continue;
const rb = bySet(R.findAll(n => isI(n) && n.visible && sizeOf(n) && topIn(n, R.id)));
const ob = bySet(B.findAll(n => isI(n) && n.visible && sizeOf(n) && topIn(n, B.id)));
for (const [s, list] of ob) { const rl = rb.get(s); if (!rl) continue; const sizes = [...new Set(rl.map(sizeOf))]; if (sizes.length !== 1) continue;
for (const id of list.filter(n => sizeOf(n) !== sizes[0]).map(n => n.id)) { const n = await byId(id); if (!n) continue;
try { n.setProperties({ Size: sizes[0] }); log.push(n.name + " Size → " + sizes[0] + " (as in the reference)"); } catch {} } } }
return log; }
// v3.241: headings take the reference's text style. The designers set island headings to bold/h5-l 16 while the old blocks keep
// bold/h4-xl 18 (TM Applicant scoring "Risk levels", and 9 of the 25 accepted screens); the walk can't pair a heading the designer
// rebuilt (Block Title instance → a "Body" frame), so it's matched by role and text instead: a text under a heading-role layer
// (Block Title / Heading / Title / Header, ≤ 4 levels up) takes the style of the reference text with the same characters, when the
// reference uses one style for that text. Content slots only, never the chrome.
async function headingTextStyles(refRoot, page) {
const log = [], HR = /^(Block Title|Body \/ Title|Heading|Title|Header)\b/i;
const slots = r => r.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
const shown = (n, top) => { for (let q = n; q && q.id !== top.id; q = q.parent) if (q.visible === false) return false; return true; };
const refT = new Map(); for (const s of slots(refRoot)) for (const t of s.findAll(n => n.type === "TEXT" && shown(n, s))) { const k = CT(t); if (!k) continue; if (!refT.has(k)) refT.set(k, new Set()); refT.get(k).add(typeof t.textStyleId === "string" ? t.textStyleId : ""); }
for (const s of slots(page)) for (const t of s.findAll(n => n.type === "TEXT" && shown(n, s))) {
let h = null; for (let q = t.parent, d = 0; q && q.id !== s.id && d < 4; q = q.parent, d++) if (HR.test(q.name)) { h = q; break; } const HS = /\/h[2-6]\b/i; if (!h) { let cs = null; try { cs = typeof t.textStyleId === "string" && t.textStyleId ? await figma.getStyleByIdAsync(t.textStyleId) : null; } catch {} if (!cs || !HS.test(cs.name)) continue; }
const set = refT.get(CT(t)); if (!set || set.size !== 1) continue; const rid = [...set][0]; if (!rid || rid === t.textStyleId) continue;
try { let st = await figma.getStyleByIdAsync(rid); if (st && st.remote && st.key) st = await figma.importStyleByKeyAsync(st.key); if (!st || st.id === t.textStyleId || (!h && !HS.test(st.name))) continue;
await figma.loadFontAsync(st.fontName); await t.setTextStyleIdAsync(st.id); log.push("heading \"" + CT(t).slice(0, 30) + "\" text style → " + st.name + " (as in the reference)"); } catch {} }
return log; }
// v3.244 (Applicant page run, 3696:135474): four class fixes, all in the finish.
//  statusPaint — a bare card's border bound to a coloured token (AML screening: border/green/subtler in the original AND the reference)
//    is a status, not the pre-island chrome: §6.1 recolours only neutral / raw borders.
//  sidePanelLikeReference — when the reference's Aside hugs a FIXED column (AP: Aside HUG 380, Summary FIXED 380×748), ours does the same;
//    the build puts the column in on FILL/FILL, which gave Aside 400, Summary 9500 tall and every main card 20 px narrower.
//  dropHeaderPlaceholders — a header-slot block cloned from the reference that shows only a component placeholder (AP: "Name + info" =
//    ClientNickname, while the original hides the client name) is not data — removed, like "Key name" / "Section name" in the build.
const STATUS_PAINT = /(^|\/)(green|red|yellow|orange|purple|blue|cyan|pink|lime|volcano|geekblue|emerald|sky|teal|violet|rose|fuchsia)(\/|$)/i;
async function statusPaint(k, prop) { try { const b = k[prop] && k[prop][0] && k[prop][0].boundVariables && k[prop][0].boundVariables.color; if (!b) return false; const v = await figma.variables.getVariableByIdAsync(b.id); return !!v && STATUS_PAINT.test(v.name); } catch (e) { return false; } }
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
if (!k.visible || !("findAll" in k)) continue; const t = k.findAll(q => q.type === "TEXT" && q.visible && CT(q)).map(q => CT(q));
if (t.length && t.every(x => PLACEHOLDER_TEXT.test(x))) { const nm = k.name; try { k.remove(); log.push("header: " + nm + " removed — it only shows the placeholder \"" + t[0] + "\""); } catch {} } }
const h2 = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible);
for (const [re, prop] of [[/^Info slot/i, "Show Info slot#6985:0"], [/^Additional info/i, "Show additional info slot#6943:18"]]) { const s = h2 && h2.findAll(n => isS(n) && re.test(n.name))[0];
if (s && !s.children.some(k => k.visible)) { try { h2.setProperties({ [prop]: false }); log.push("header: " + s.name + " empty — switched off"); } catch {} } }
return log; }
// v3.260: the paints of the header WRAPPER itself (AP page header) come from the reference too. The designers override the
// wrapper's bottom border to semantic/border/neutral/subtlest/normal; ours kept the master's stale base/neutral/30 (#e1e5ea) on all
// 8 Applicant page screens — copyVarsFromRef walks only the body slots, refHeader only swaps. Root of the wrapper only: its one
// child is the *Header*, whose content is ours. A paint the reference doesn't bind is left alone.
async function hdrWrapPaints(page, refId) { const isW = n => isI(n) && n.visible && n.name !== "*Header*" && n.children.some(k => k.name === "*Header*"), rp = await byId(refId), rw = rp && rp.findOne(isW), w = page.findOne(isW), out = [];
if (!rw || !w || rw.name !== w.name) return out; const { resolve } = await varResolver();
for (const p of ["fills", "strokes"]) { const r = rw[p][0], b = r && r.visible !== false && r.boundVariables && r.boundVariables.color, o = w[p][0]; if (!b) continue;
const t = await resolve(b.id), v0 = t && t.to, v = v0 && /^base\//i.test(v0.name) ? ((await semanticFor(v0.name, w, p)) || v0) : v0; if (!v || (o && o.boundVariables && o.boundVariables.color && o.boundVariables.color.id === v.id)) continue;
const c = JSON.parse(JSON.stringify(r)); delete c.boundVariables; w[p] = [figma.variables.setBoundVariableForPaint(c, "color", v)]; out.push("header " + p + " → " + v.name); }
return out; }
async function finishIsland(page, refId) {
  if (refId) { const ref = await byId(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
      const content = page.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
      const anchors = [...new Set(content.flatMap(s => s.children).filter(n => n.name !== ICN).map(n => n.name))].concat([ICN]);
      const sz = await alignSizeVariants(ref, page); const rg = await regroupLikeReference(ref, page); const cr = await copyVarsFromRef(ref, page, anchors), sp = await sidePanelLikeReference(ref, page), hs = await headingTextStyles(ref, page), hw = await hdrWrapPaints(page, refId), bt = await bareCardTokens(page), ph = await dropHeaderPlaceholders(page); cr.applied.unshift(...sz, ...rg, ...sp, ...hs, ...hw); return { from: "reference " + refId, applied: cr.applied.concat(bt, ph), skipped: cr.skipped }; } }
  return { from: "§6.1 defaults", applied: (await applyIslandTokens(page)).concat(await dropHeaderPlaceholders(page)), skipped: [] };
}

// ─── ONE SCREEN, REFERENCE-GUIDED — TWO CALLS ───
// Call 1 `migrateOne(id)` builds. Call 2 `finishAndAudit(pageId, refId)` copies variables and audits.
// They MUST be separate use_figma calls: after blocks move into slots, node proxies in the same call go stale
// ("node … does not exist" while walking the moved tree) and the throw rolls the whole build back.
// grey = a grey surface (ghost #f9fafb / subtlest #f3f4f6) under at least 40 % of the reference's main content area
// The main column that is ALREADY a card goes over whole when the reference keeps that same block bare (TM Settings:
// `.Content` is a white r12 card holding the title, the fields and the Button bar — split into its children it became
// islands in a card, while the reference shows the one card, radius 16 from the reference)
function keepWholeCard(a, refP) {
const m = a.nodes.main; if (!m || a.nodes.table || a.nodes.groups.length < 2) return false; const rb = refP && refAll(refP, m.name)[0]; if (!cardLike(m) && !(rb && rb.parent.type === "SLOT")) return false;   // v3.250: a plain column whose same-named block stands bare at the top of the reference's slot goes over whole (AP Overview #2, Levels Steps: Body)
if (refPlacement(refP, m.name) !== "bare") return false;
a.nodes.groups = [m]; return true;
}
function refSideOnly(P, a) {   // v3.238: the reference shows a side column the original has nothing for (TM Travel Rule settings: a Tip) — keep the empty column so the main one keeps the reference's width (691, not 1135)
const d = P ? P.findOne(n => isI(n) && n.name === "Page / Body / Default") : null; const p = d && CP(d) ? CP(d)["Show side content#23483:22"] : null;
return !!p && p.value === true && !a.nodes.right && !a.nodes.left && !a.nodes.table && a.plan.content === "◼️ Main (Ghost)"; }
function refWidth(P) {   // v3.228: the reference's own content width (TM Settings: 691 slot = Full width, not 1084)
const d = P ? P.findOne(n => isI(n) && n.name === "Page / Body / Default") : null; const t = d && CP(d) && CP(d).Type ? String(CP(d).Type.value) : "";
return /^(Full width|1084 max|1920 max)$/.test(t) ? t : null; }
function surfaceOf(refP, opts) {   // v3.228: grey / white is the designers' table decision when given ({ surface }); else the reference's look
const refG = refP ? refIsGrey(refP) : null, tbl = opts && opts.surface ? opts.surface === "grey" : null;
return { grey: tbl !== null ? tbl : refG, refGrey: refG, from: tbl !== null ? "table" : (refG === null ? null : "reference") }; }
function refIsGrey(P) {
  const ms = P.findAll(n => isS(n) && n.name === "Main content")[0]; if (!ms || !ms.absoluteBoundingBox) return null; const mb = ms.absoluteBoundingBox;
  return P.findAll(n => n.visible && n.fills && n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false && !!n.absoluteBoundingBox &&
    (() => { const c = n.fills[0].color; return c.r > 0.93 && c.r < 0.985 && Math.abs(c.r - c.b) < 0.03; })() &&
    (() => { const b = n.absoluteBoundingBox; const ix = Math.max(0, Math.min(b.x + b.width, mb.x + mb.width) - Math.max(b.x, mb.x)), iy = Math.max(0, Math.min(b.y + b.height, mb.y + mb.height) - Math.max(b.y, mb.y)); return ix * iy > 0.4 * mb.width * mb.height; })()).length > 0;
}
// PLAN ONLY — read-only. Run it first and compare with the reference before building (§6.2 step 0).
async function planOne(scrId, refOverride, opts) {
  const scr = await byId(scrId); if (!scr) return { id: scrId, missing: true };
  let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();
  const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = refOverride || (m ? m[1] : null);
  _idCache.clear(); const a = analyze(scr);
  let refP = null; if (refId) { const ref = await byId(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync(); refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => isI(n) && n.name === "Page"); } }
  const whole = keepWholeCard(a, refP); const sf = surfaceOf(refP, opts), grey = sf.grey, wh = !!opts && opts.surface === "white"; const rms = refP ? refP.findAll(n => isS(n) && n.name === "Main content")[0] : null; // the same width rule migrateOne applies with a reference
const planWidth = rms && !a.nodes.table ? (refWidth(refP) || ((rms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max")) : a.plan.width;
  const blocks = []; let pending = [], lastIsl = null;
  for (const g of a.nodes.groups) { if (isHeadingBlock(g)) { pending.push(g.name); continue; }
    const rp = refPlacement(refP, g.name) || (refIslandByKids(refP, g) ? "island" : null) || (refUnboxed(refP, g) ? "unboxed" : null);
    const how = wh ? "bare (white)" : isGraphic(g) ? "bare (graphic)" : rp ? rp + " (reference)" : (cardLike(g) || isCardLayout(g)) ? "bare (rule)" : isCardStack(g) ? "split (rule)" : "island (rule)";
    const isl = refIslandOf(refP, g.name); if (isl && isl === lastIsl && blocks.length && !pending.length) { blocks[blocks.length - 1] = blocks[blocks.length - 1].replace(/ → island \(reference(, shared)?\)$/, " + " + g.name + " → island (reference, shared)"); lastIsl = isl; continue; }
lastIsl = isl; blocks.push([...pending, g.name].join(" + ") + " → " + how); pending = []; }
  if (pending.length) blocks.push(pending.join(" + ") + " → island (rule)");
  return clean({ id: scrId, name: scr.name, confident: a.confident, notes: a.notes, ref: refId, refGrey: sf.refGrey, surface: sf.from ? (grey ? "grey" : "white") + " (" + sf.from + ")" : null, verdict: grey === false && !wh ? "STOP: white reference — run with { surface: \"white\" }" : (a.confident ? (wh ? "build (white)" : "build") : "STOP: not confident"),
    plan: [refP && CP(refP).Type ? CP(refP).Type.value : a.plan.pageType, wh ? (a.nodes.left ? "◻️ Nav + Main (Default)" : "◻️ Main (Default)") : a.plan.content, planWidth, a.plan.sideContent ? "side" : (refSideOnly(refP, a) ? "side: empty, like the reference" : "")].join(" | "),
    blocks, wholeCard: whole || undefined, crumb: headerRegions(a.nodes.header, scr).crumb || refCrumb(refP) || null, left: a.nodes.left && a.nodes.left.name, right: a.nodes.right && a.nodes.right.name, tabs: a.plan.tabs, title: a.plan.title,
    header2: a.nodes.header2 && a.nodes.header2.name, subheader: a.nodes.subheader && a.nodes.subheader.name });
}
async function migrateOne(scrId, refOverride, opts) {   // refOverride: the designer's reference node id, when the screen's name doesn't carry "(ref …)"
  const scr = await byId(scrId); if (!scr) return { id: scrId, missing: true };
  let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
  const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = refOverride || (m ? m[1] : null), name = scr.name;
  _idCache.clear(); const a = analyze(scr);
  if (!a.confident) return { id: scrId, name, stopped: "not confident", notes: a.notes };
  let refP = null;
  if (refId) { const ref = await byId(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
      refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => isI(n) && n.name === "Page"); } }
  const wh = !!opts && opts.surface === "white"; if (refP && surfaceOf(refP, opts).grey === false && !wh) return { id: scrId, name, stopped: "the reference is WHITE — run it with { surface: \"white\" } (the white layout)", ref: refId };
if (wh) { a.plan.white = true; a.plan.content = a.nodes.left ? "◻️ Nav + Main (Default)" : "◻️ Main (Default)"; a.plan.sideContent = !!a.nodes.right; }
  a.refRoot = refP; const whole = keepWholeCard(a, refP);
  if (refP) { const t = CP(refP).Type; if (t && /Basic|Full screen page/.test(t.value)) a.plan.pageType = t.value;
    const ms = refP.findAll(n => isS(n) && n.name === "Main content")[0];
    if (ms && !a.nodes.table) a.plan.width = refWidth(refP) || ((ms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max");
    a.W = Math.round(refP.width); a.H = Math.round(refP.height); a.plan.sideRoom = refSideOnly(refP, a); }
  const r = await buildIsland(scr, a, null);
  return clean({ id: scrId, name: name.slice(0, 50), pageId: r.page.id, ref: refP ? refId : null, plan: [a.plan.pageType, a.plan.content, a.plan.width, a.plan.sideContent ? "side" : (a.plan.sideRoom ? "side: empty, like the reference" : "")].join(" | "),
    kept: r.kept, notes: r.notes });
}
// Old screens were narrower: their cards and columns carry FIXED widths of the old layout (CM team overview: cards 362 in a
// grid that is now 1340 wide → a third of every island row empty). With a reference its sizing is copied (copyVarsFromRef).
// Without one: grid children → FILL; a FIXED card narrower than its vertical stack → FILL. Then every grid row must span the grid.
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
// Any horizontal/vertical auto-layout child that was FILL in the source must still reach its parent's inner width.
function narrowFills(page) {
  const out = [];
  for (const n of page.findAll(x => x.visible && (x.layoutSizingHorizontal === "FILL" || (cardLike(x) && x.layoutSizingHorizontal !== "HUG")) && x.parent && x.parent.layoutMode === "VERTICAL" && x.parent.layoutSizingHorizontal !== "HUG")) {
    const p = n.parent, inner = p.width - (p.paddingLeft || 0) - (p.paddingRight || 0);
    if (inner - n.width > 4) out.push(n.name + " " + Math.round(n.width) + "/" + Math.round(inner)); if (out.length > 8) break; }
  return out;
}
// The published side panels have a fixed width (Aside 400, Side content 380). A side column copied with the reference's sizing can
// be wider — Case page right column is FIXED 424 in the reference, which puts it in Main content on the branch Page — and then
// sticks out of the panel (Financial data run 29.09: overflow "Content: Case page right column"; resizing the nested Aside does
// not persist). Make every side-slot child that is wider than its slot FILL it, then check nothing inside it sticks out.
function fitSideColumns(page) {
  const fit = [], inside = [];
  const rendered = (n, stop) => { let q = n; while (q && q.id !== stop.id) { if (q.visible === false) return false; q = q.parent; } return true; };
  for (const s of page.findAll(n => isS(n) && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))))) {
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
// The migrated page can grow past its (made by Claude) section — grow the section to hold all its children + 80.
function fitSection(page) {
const s = page.parent; if (!s || s.type !== "SECTION") return null;
let r = 0, b = 0; for (const c of s.children) { r = Math.max(r, c.x + c.width); b = Math.max(b, c.y + c.height); }
const w = Math.max(s.width, r + 80), h = Math.max(s.height, b + 80);
if (w > s.width + 0.5 || h > s.height + 0.5) { s.resizeWithoutConstraints(w, h); return Math.round(w) + "×" + Math.round(h); }
return null;
}
// Old mockups bind colours to variables of a library that no longer exists (CM managers overview: a second `color` / `Design tokens`
// pair whose collection isn't among the file's available libraries — frozen at pre-redesign hex, the reference has them too, and
// a library Update can't reach them). Rebind each to the same-named variable of the current Base `color` collection (names compared
// case-insensitively: `Base/Neutral/90` → `base/neutral/90`). Only our content: the slot subtrees, never the inside of a component
// instance (its paint is the component's).
// One resolver for "which variable should this paint be bound to now" — shared by copyVarsFromRef and rebindOrphanVars, so the
// reference's paint is copied as its CURRENT variable: a stale copy of a live library variable → the fresh import (same key), a
// variable of a vanished library → the same-named Base `color` variable. Without it the finish copied the reference's orphan onto
// our node and rebindOrphanVars rebound it straight back on every run (CM managers overview / team: 254 + 210 no-op writes per
// run, and the whole call timed out with a 520).
// v3.238: a vanished-library variable is looked up in Base by name, then as "components/<name>" — the old library named component
// tokens without the prefix (checkbox/text-normal = Base components/checkbox/text-normal; TM Travel Rule settings "Euro" label)
// v3.242: names the vanished library used that Base renamed — `Base/White/100` is Base's `base/neutral/0` (TM Analytics: the filter bar's
// white stayed bound to the vanished variable), the status tokens were named by state, Base names them by colour. The base/* result
// is then mapped to its semantic token by tokenHygiene, which runs right after.
const oldAlias = n => n === "base/white/100" ? "base/neutral/0" : n.replace(/^components\/status\/(approved|rejected|pending|default)-/, (m, s) => "components/status/" + ({ approved: "green", rejected: "red", pending: "yellow", default: "grey" })[s] + "/");
let _vr = null;
function varResolver() {
  if (_vr) return _vr;
  _vr = (async () => {
    let cols = null; try { cols = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync(); } catch {}
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
    // v3.246: the retired library also named component tokens `Button/Primary/Default/background-color-normal` — Base: components/button/primary/default/background-normal
        else if (base) { const lo = v.name.toLowerCase(), key = byName.get(lo) || byName.get("components/" + lo) || byName.get(oldAlias(lo)) || byName.get("components/" + lo.replace(/-color-/g, "-")); const b = key ? await imp(key) : null; if (b) out = { to: b, kind: "orphan", from: v.name }; else miss.add(v.name); } }
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
bg: { "base/neutral/0": "567811a0cf497ac911288a2f4a75a1d89ebff75c", "base/neutral/5": "e50636958c4d5a6917b4fb1e32a7de92ded72f85", "base/neutral/10": "e7129860062f42ee2a929d1b4ccacd21133a03ee", "base/neutral/20": "1aed8505fcfaec5aacd4ac43b4eb62d8315caa0a", "base/neutral/30": "b47e729aacb507fd6a42780ab5c7cb6e0615f33e" },
// v3.246: base/neutral/30 fill → semantic/background/neutral/subtle/normal (verified alias) — the AP header's carried Divider
border: { "base/neutral/20": "40baade65c87f4b56fd67b027ec695d0984fae39", "base/neutral/30": "806f4dce0b78f55df4ab1d126160091d6dd67fd2", "base/neutral/40": "3ac6f9a55d66cd4435e64ad0fa7287b40da52980", "base/neutral/50": "6618868be488e538a0d5a0002206439e45c3cfbe" } };
const _semCache = new Map();
async function semanticFor(name, node, prop) {
const kind = prop === "strokes" ? "border" : node.type === "TEXT" ? "text" : "bg", key = BASE_TO_SEMANTIC[kind][String(name).toLowerCase()]; if (!key) return null;
if (!_semCache.has(key)) _semCache.set(key, figma.variables.importVariableByKeyAsync(key).catch(() => null)); return _semCache.get(key); }
// v3.241: down through the nearest slots under ANY instance, through nested instance layers too (TM Applicant scoring: Slider section ›
// Slider › Slot), not only IslandCard — the skill audit (7.61 / 7.16) treats every slot's content as ours, so the engine left raw
// radius 4 / gap 4 there that the audit then flagged. Instance layers themselves stay the component's.
function oursOf(page) {   // our layers: slot content, down through the nearest slots under every instance, never instance layers
// v3.242: the header's Info / Additional info / Actions slots hold blocks the build cloned in (from the original or the reference) —
// ours too. TM Analytics: the reference's `Statuses` came with a raw gap 4 the audit flagged.
const hdr = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name) && n.visible);
const slots = page.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name)))).concat(hdr ? hdr.findAll(n => isS(n) && /^(Info slot|Additional info|Actions slot)/i.test(n.name)) : []);
const nested = (q, top) => { for (let p = q.parent; p && p.id !== top.id; p = p.parent) if (p.type === "SLOT") return true; return false; };
const out = []; const walk = (n, side) => { out.push([n, side]); if (isI(n)) { for (const sl of n.findAll(q => q.type === "SLOT" && !nested(q, n))) for (const k of sl.children) walk(k, side); return; }
if ("children" in n) for (const k of n.children) walk(k, side); };
// v3.246: only side panels count as side — header slots (white secondary buttons in Actions) were reported as side whites
for (const s of slots) for (const k of s.children) walk(k, s.name === "Side content" || s.name === "Content"); return out; }
const SPACING_KEYS = ["3d3cc3a15da0b893bf326da6053d7a1c37f1d836", "a4dad7f0e560345e844697b529325a2eca2ff23a", "5a8e4573770ee8f921f141c1ab6c96835c3125a0", "de89b1cae49981816929db80a4e795842e7baf77", "2b3382099953af94f32cb6ffe5c7f44c74d5fed7", "7dc2647090da988c17327693bc2224e2308047a2", "fceb37ce155723145d25d273574c665a8d7d30e6", "a2e089548b83ff33c8ee5e914fa24e67b889b38c"];
const RADIUS_KEYS = ["885152d55a536fb853461592cc3eff926e94858d", "311dc09093e9474a8b582c8fb7ccc7a628065a20", "95839af397884cd7f8fadb34a62d4763f88d68dd", "03884e014085a48cf26670632be200a02b5a160c"];
async function tokensByValue(keys, page) { const m = new Map(); const vs = await Promise.all(keys.map(k => figma.variables.importVariableByKeyAsync(k).catch(() => null)));
for (const v of vs) { if (!v) continue; try { const r = v.resolveForConsumer(page); if (typeof r.value === "number" && !m.has(r.value)) m.set(r.value, v); } catch {} } return m; }
// v3.242: a stroke of weight 0 draws nothing — TM Analytics: a text `Name` with a raw #ecedef stroke at weight 0 sat in rawPaints
const noStroke = n => typeof n.strokeWeight === "number" ? n.strokeWeight === 0 : ["strokeTopWeight", "strokeRightWeight", "strokeBottomWeight", "strokeLeftWeight"].every(k => !n[k]);
async function tokenHygiene(page) {
const ours = oursOf(page), log = [], rawPaints = [], rawSpacing = [], noToken = [], sideWhites = [];
const hx = c => "#" + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const shownIn = n => { let q = n; while (q && q.type !== "SLOT") { if (q.visible === false) return false; q = q.parent; } return true; };
for (const [n] of ours) for (const prop of ["fills", "strokes"]) { let ps; try { ps = n[prop]; } catch (e) { continue; } if (!Array.isArray(ps) || !ps.length || (prop === "strokes" && noStroke(n))) continue;
let changed = false; const next = [];
for (const p of ps) { const b = p.boundVariables && p.boundVariables.color;
if (p.type === "SOLID" && p.visible !== false && !b) { if (n.type !== "INSTANCE" && shownIn(n)) rawPaints.push(n.name + " " + prop + " " + hx(p.color)); next.push(p); continue; }
const v = b ? await figma.variables.getVariableByIdAsync(b.id) : null;
if (v && /^base\//i.test(v.name)) { const sem = await semanticFor(v.name, n, prop);
if (sem) { const c0 = JSON.parse(JSON.stringify(p)); delete c0.boundVariables; next.push(figma.variables.setBoundVariableForPaint(c0, "color", sem)); changed = true; log.push(v.name + " → " + sem.name); continue; }
if (shownIn(n)) rawPaints.push(n.name + " " + prop + " " + v.name + " (no semantic mapping)"); }
next.push(p); }
if (changed) { try { n[prop] = next; } catch {} } }
const sp = await tokensByValue(SPACING_KEYS, page), rd = await tokensByValue(RADIUS_KEYS, page), RAW_OK = [40, 48, 64, 88];
for (const [n] of ours) { if (n.type !== "FRAME") continue;
if (n.layoutMode && n.layoutMode !== "NONE") for (const k of (n.layoutMode === "GRID" ? ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gridRowGap", "gridColumnGap"] : ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"])) {
const val = n[k]; if (typeof val !== "number" || val === 0 || (n.boundVariables && n.boundVariables[k])) continue;
const v = sp.get(val); if (v) { try { n.setBoundVariable(k, v); log.push(n.name + " " + k + " " + val + " → " + v.name); continue; } catch {} }
if (!RAW_OK.includes(val) && shownIn(n)) (v ? rawSpacing : noToken).push(n.name + " " + k + "=" + val); }
for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) { const val = n[k]; if (typeof val !== "number" || val === 0 || (n.boundVariables && n.boundVariables[k])) continue;
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
  for (const n of ours) for (const prop of ["fills", "strokes"]) { let paints; try { paints = n[prop]; } catch (e) { continue; } if (!Array.isArray(paints) || !paints.length) continue;
    let changed = false; const next = [];
    for (const p of paints) { const b = p.boundVariables && p.boundVariables.color; const t = b ? await R.resolve(b.id) : null;
      if (!t || t.kind === "same") { next.push(p); continue; } const base0 = JSON.parse(JSON.stringify(p)); delete base0.boundVariables; next.push(figma.variables.setBoundVariableForPaint(base0, "color", t.to)); changed = true; log.push(t.from + (t.kind === "stale" ? " (stale copy)" : "") + " → " + t.to.name); }
    if (changed) { try { n[prop] = next; } catch {} } }
  const tally = {}; for (const l of log) tally[l] = (tally[l] || 0) + 1;
  return { rebound: log.length, by: Object.entries(tally).slice(0, 12).map(([k, c]) => k + " ×" + c), missing: [...R.miss].slice(0, 6) };
}
// part: omit = everything in one call. On a big page (CM managers overview / team: ~790 reference pairs, ~13 s just to walk them)
// the single call outruns the MCP connection ("connection lost" / 520) — then call it twice: part "copy" (copy from the
// reference), then part "audit" (rebind colours + fixes + audit). Both are idempotent, so a dropped call is safe to repeat.
// v3.248: no reference → the original's product header (AP page header, a local header) is kept: the build parks a hidden copy of it next to the page, the finish swaps the Page's *Header* to it, copies properties, texts and visibility, and removes the copy (designer feedback on AML screening).
async function keepHeader(page) { const k = page.parent && "findChild" in page.parent ? page.parent.findChild(n => n.getSharedPluginData("sumsub_island", "hdrFor") === page.id) : null; if (!k) return null;
k.visible = true; const h = page.findOne(n => isI(n) && /^\*Header\*/.test(n.name)), mc = await k.getMainComponentAsync(); let r = null;
if (h && mc) { const hid = h.id; h.swapComponent(mc); const h2 = (await byId(hid)) || page.findOne(n => isI(n) && n.name === k.name); try { h2.layoutSizingHorizontal = "FILL"; } catch {} await syncNode(h2.id, k, true); r = "header: " + k.name + " kept, its properties and texts copied"; }
k.remove(); return r; }
// v3.254: the reference's header is a product wrapper over *Header* (AP page header: Client type × Status, one *Header* inside) →
// the Page's *Header* is swapped to it. A swap resets the content to the wrapper's own (designer data), so the filled *Header*
// is cloned first; then its properties and texts are copied onto the inner *Header* and each top-level slot gets the clone's
// slot content. Runs before the copy from the reference; skipped when the header is already inside a wrapper.
async function refHeader(page, refId) { const rp = refId ? await byId(refId) : null, h = page.findOne(n => isI(n) && n.name === "*Header*" && n.visible);
const rw = rp && rp.findOne(n => isI(n) && n.visible && n.name !== "*Header*" && n.children.some(k => k.type === "INSTANCE" && k.name === "*Header*"));
if (!rw || !h || h.parent.type === "INSTANCE") return null; const m = await rw.getMainComponentAsync(); if (!m) return null;
const k = h.clone(); page.parent.appendChild(k); k.x = page.x - 3000; const top = (n, r) => { for (let q = n.parent; q && q.id !== r.id; q = q.parent) if (q.type === "SLOT") return false; return true; };
try { const hid = h.id; h.swapComponent(m); const w = await byId(hid); try { w.layoutSizingHorizontal = "FILL"; } catch {}
const iid = w.findOne(n => isI(n) && n.name === "*Header*").id; await syncNode(iid, k, true); const inner = await byId(iid);
for (const s of k.findAll(n => isS(n) && top(n, k))) { const t = inner.findAll(n => isS(n) && n.name === s.name && top(n, inner))[0]; if (!t) continue;
for (const q of [...t.children]) q.remove(); for (const q of s.children) { const c = q.clone(); t.appendChild(c); for (const d of ["layoutSizingHorizontal", "layoutSizingVertical"]) { try { c[d] = q[d]; } catch {} } } }
return "header: " + rw.name + " as in the reference, our content moved in"; } finally { k.remove(); } }
async function syncNode(aid, b, top) { let a = await byId(aid); if (!a) return; if (!top) { try { if (a.visible !== b.visible) a.visible = b.visible; } catch {} }
if (a.type === "INSTANCE" && b.type === "INSTANCE") { const p = {}; let ap = {}, bp = {}; try { ap = CP(a) || {}; bp = CP(b) || {}; } catch {} for (const [k, v] of Object.entries(bp)) if (ap[k] && ap[k].value !== v.value) p[k] = v.value; if (Object.keys(p).length) { try { a.setProperties(p); } catch {} a = await byId(aid); if (!a) return; } }
if (a.type === "TEXT" && b.type === "TEXT" && a.characters !== b.characters) { try { for (const f of a.getRangeAllFontNames(0, a.characters.length)) await figma.loadFontAsync(f); a.characters = b.characters; } catch {} }
const bk = "children" in b ? b.children : [];
for (let i = 0; i < bk.length; i++) { const pa = await byId(aid), ak = pa && "children" in pa ? pa.children : []; if (i >= ak.length) break; if (ak[i].name === bk[i].name) await syncNode(ak[i].id, bk[i], false); } }
async function finishAndAudit(pageId, refId, part) {
  const page = await byId(pageId); let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();   // no setCurrentPageAsync: the finish creates no nodes, and switching re-renders the whole page in the app (~16 s on the big test page)
  let fin = { from: "skipped (part audit)", applied: [], skipped: [] };
let kh = null; if (part !== "audit") { try { kh = await keepHeader(page) || await refHeader(page, refId); } catch (e) { kh = "keep header: " + e.message; } }
  if (part !== "audit") { try { fin = await finishIsland(page, refId); } catch (e) { fin = { from: "error", applied: [], skipped: [e.message] }; } }
  // v3.254: after the header swap, the audit in the same call hits a dead node of the old header (a Figma cache); the copy
// result comes back with `next`, and the audit runs as its own call.
if (part === "copy" || (!part && /as in the reference/.test(kh || ""))) return clean({ pageId, part: "copy", header: kh || undefined, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, next: "call again with part \"audit\"" });
  let orphans; try { orphans = await rebindOrphanVars(page); } catch (e) { orphans = { rebound: 0, missing: ["error: " + e.message] }; }
let hyg; try { hyg = await tokenHygiene(page); } catch (e) { hyg = { fixed: 0, rawPaints: ["error: " + e.message], rawSpacing: [], sideWhites: [] }; }
  const gridIssues = stretchToWidth(page, !!refId);
  const side = fitSideColumns(page);
  const pb = page.absoluteTransform[1][2];
  const slots = page.findAll(n => isS(n) && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
  // FILL-height children follow the page (a side column spanning the Aside) — counting them grows the page on every run.
  const bottom = Math.max(0, ...slots.flatMap(s => s.children.filter(k => k.visible && k.layoutSizingVertical !== "FILL").map(k => k.absoluteTransform[1][2] - pb + k.height)));
  const rpg = refId ? await byId(refId) : null, rPg = rpg ? (rpg.type === "INSTANCE" && rpg.name === "Page" ? rpg : rpg.findOne(n => isI(n) && n.name === "Page")) : null;
const oh = Number(page.getSharedPluginData("sumsub_island", "origH")) || 0, rh = rPg ? Math.round(rPg.height) : 0;
const want = Math.max(oh && rh ? Math.min(oh, rh) : rh, Math.ceil(bottom + 28));
  // v3.252: with a reference the floor is the original's height, capped by the reference's — not the reference's height alone. Measuring the reference's own
  // bottom margin was tried and dropped: slot children that FILL vertically give a reference "bottom" of 0–188 (TM Travel Rule settings would grow to 4158).
  // The reference's height alone is not the floor: AP Actions — the designer expanded a card the original has collapsed, the page came out 1155 for content to 413.
if (bottom + 20 > page.height || (rPg && page.height > want + 1)) { try { page.resize(page.width, want); } catch {} }   // v3.247: with a reference the page also shrinks back to the reference's height once the content fits again (AP Overview stayed 1369 after the Body paddings were fixed; the reference is 1289)
  let sectionFit = null; try { sectionFit = fitSection(page); } catch (e) { sectionFit = "error: " + e.message; }
  const ms2 = page.findAll(n => isS(n)).find(s => s.name === "Main content");
  const refRoot = refId ? await byId(refId) : null;
  // v3.246: a picture standing bare (the plan puts it there) is not reported as outside an island
  const notIsland = ms2 ? ms2.children.filter(k => k.visible && k.name !== ICN && !isGraphic(k) && !cardLike(k) && !isCardLayout(k) && !["bare", "split"].includes(refPlacement(refRoot, k.name))).map(k => k.name) : ["no main slot"];
  const overflow = slots.map(s => { const sb = s.absoluteBoundingBox; const o = s.children.filter(k => k.visible && k.absoluteBoundingBox &&
      (k.absoluteBoundingBox.x + k.absoluteBoundingBox.width > sb.x + sb.width + 1)).map(k => k.name);
  const inI = n => { for (let q = n.parent; q && q.id !== s.id; q = q.parent) { if (q.type === "SLOT") return false; if (q.type === "INSTANCE") return true; } return false; }, sh = n => { for (let q = n; q && q.id !== s.id; q = q.parent) if (q.visible === false) return false; return true; };
  for (const k of s.children.filter(k => k.visible && "findAll" in k && !o.includes(k.name))) { const d = k.findAll(x => x.type !== "TEXT" && !!x.absoluteBoundingBox && x.absoluteBoundingBox.x + x.absoluteBoundingBox.width > sb.x + sb.width + 1).find(x => !inI(x) && sh(x)); if (d) o.push(k.name + " › " + d.name); }   // v3.250: overflow looks inside each block too (Overview #2: a 1377 wrapper in a 1340 column; KYC: a 1376 heading in a 1308 island)
  return o.length ? s.name + ": " + o.join(", ") : null; }).filter(Boolean);
  const items = ms2 ? ms2.children.filter(k => k.visible).map(k => k.name === ICN ? "ISL[" + ((k.findOne(n => isS(n)) || { children: [] }).children.map(q => q.name.slice(0, 24)).join(" + ")) + "]" : "bare:" + k.name.slice(0, 26)) : [];
  return clean({ pageId, header: kh || undefined, size: Math.round(page.width) + "×" + Math.round(page.height), main: items, notIsland, overflow, gridIssues, sideFit: side.fit, sideOverflow: side.inside, narrowFills: narrowFills(page), rawPaints: hyg.rawPaints, rawSpacing: hyg.rawSpacing, sideWhites: hyg.sideWhites, tokens: { fixed: hyg.fixed, by: hyg.by, noToken: hyg.noToken }, sectionFit, vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) }, orphanVars: orphans });
}
