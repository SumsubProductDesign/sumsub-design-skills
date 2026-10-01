// Island migration engine — full, commented source. Run it through build.js + finish.js (two use_figma calls); see island-layout-pattern.md §6.2.
// ═══ island migration library — analyze a screen by geometry, plan, then rebuild it on the Page layout ═══
const rendered = (n, stop) => { const sid = stop ? stop.id : null; let p = n;
  while (p && p.type !== "PAGE" && p.id !== sid) { if ("visible" in p && p.visible === false) return false; p = p.parent; } return true; };
const mainName = n => { try { const m = n.mainComponent; return m ? ((m.parent && m.parent.type === "COMPONENT_SET") ? m.parent.name : m.name) : ""; } catch (e) { return ""; } };
const box = (n, ref) => { const a = n.absoluteTransform, r = ref.absoluteTransform; return { x: Math.round(a[0][2] - r[0][2]), y: Math.round(a[1][2] - r[1][2]), w: Math.round(n.width), h: Math.round(n.height) }; };
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
  const isScreen = n => (n.type === "FRAME" || n.type === "INSTANCE") && n.width >= 1270 && n.width <= 1930 && n.height >= 560;
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
  const scrollbars = all.filter(n => n.type === "INSTANCE" && /Scroll \/ Thumb/i.test(n.name + " " + mainName(n)));
  const isChrome = n => contains(header, n) || contains(header2, n) || contains(sidebar, n) || contains(subheader, n) || scrollbars.some(sb => contains(sb, n));
  // columns may be direct children of the screen with no shared wrapper (Case page: left column + right column)
  let cols = sideBySideList(vis(scr).filter(c => !isChrome(c)), scr), container = cols ? scr : null;
  if (!cols) container = all.filter(n => { const b = box(n, scr); return b.y >= hdrH - 2 && b.x >= sbW - 2 && b.w >= 0.5 * (W - sbW) && b.h >= 0.25 * (H - hdrH) &&
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
  // header labels — the header may be an INSTANCE or a detached FRAME
  let title = null; if (header) { const t = header.findOne(n => n.type === "TEXT" && n.name === "Title" && rendered(n, scr)) ||
      header.findAll(n => n.type === "TEXT" && rendered(n, scr) && n.characters.trim().length > 1).sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0))[0]; if (t) title = t.characters.trim(); }
  const tabSrc = [header, subheader].filter(Boolean);
  const tabPairs = tabSrc.flatMap(h => h.findAll(n => n.type === "INSTANCE" && /Tab( \/)? Basic \/ Item/i.test(n.name) && rendered(n, scr)))
      .map(t => { const x = t.findOne(y => y.type === "TEXT" && y.visible); const sp = t.componentProperties && t.componentProperties.Selected;
        return { label: x ? x.characters : null, sel: !!sp && String(sp.value) === "true" }; }).filter(t => t.label);
  const tabs = tabPairs.map(t => t.label), tabSelected = Math.max(0, tabPairs.findIndex(t => t.sel));
  let sandbox = false; if (header) { const s = header.findOne(n => n.type === "TEXT" && /sandbox mode/i.test(n.characters)); if (s) sandbox = rendered(s, scr) && s.visible; }
  const plan = { pageType, content, width, sideContent: !!right && content === "◼️ Main (Ghost)", sandbox, title, tabs, tabSelected };
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
  const cr = T.find(t => inA(t, /Breadcrumb/i) && t.characters.trim().length > 1 && !/^Section name$/i.test(t.characters.trim()));
  const keyT = T.find(t => /^Key name$/i.test(t.name) && !inA(t, /Additional info/i));
  const status = h.findOne(n => n.id !== h.id && /status/i.test(n.name) && n.visible && rendered(n, scr) && !inA(n, /status/i)) || null;
  const addInfo = h.findOne(n => /^Additional info$/i.test(n.name) && "children" in n && n.visible && rendered(n, scr)) || null;
  const copy = !!h.findOne(n => n.type === "INSTANCE" && /^\*Button\*/.test(n.name) && n.visible && rendered(n, scr) && /Title \+ button/i.test(n.parent.name));
  const actions = h.findAll(n => n.type === "INSTANCE" && /^\*Button( AI)?\*/.test(n.name) && n.visible && rendered(n, scr) &&
      !!inA(n, /Actions/i) && !inA(n, /Additional info/i) && !inA(n, /\*Button/));
  return { crumb: cr ? cr.characters.trim() : null, key: keyT ? keyT.characters.trim() : null, status, addInfo, copy, actions };
}
// ─── REFERENCE PLACEMENT: where does the designer's after-version put a block? ───
// "island" — inside a Page / Body / IslandCard; "split" — bare, but islands live inside it (a mixed wrapper);
// "bare" — on the grey as is; null — not in the reference (fall back to the rules). Levels Steps: the titled "Steps" group
// is bare on grey in the reference while the look-alike "Case routing" sits in an island — only the reference can tell.
function refPlacement(refRoot, name) {
  if (!refRoot) return null;
  const n = refRoot.findOne(x => x.name === name && x.visible); if (!n) return null;
  let q = n.parent; while (q && q.id !== refRoot.id) { if (q.type === "INSTANCE" && q.name === "Page / Body / IslandCard") return "island"; q = q.parent; }
  return ("findOne" in n && n.findOne(x => x.type === "INSTANCE" && x.name === "Page / Body / IslandCard")) ? "split" : "bare";
}
// Breadcrumb from the reference when the original has none (Levels: no crumb in Header-levels, the reference says "Levels").
// Neither has one → the build hides the Page header's breadcrumb instead of leaving the default "Section name".
function refCrumb(refRoot) {
if (!refRoot) return null;
const h = refRoot.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name) && n.visible); if (!h) return null;
const bc = h.findOne(n => n.type === "INSTANCE" && /Breadcrumb/i.test(n.name) && n.visible); if (!bc) return null;
const t = bc.findAll(n => n.type === "TEXT" && n.visible).map(n => n.characters.trim()).find(s => s.length > 1 && s !== "/");
return t && !/^Section name$/i.test(t) ? t : null;
}
// The reference's side column decides WHICH blocks the side panel shows and in what order. A block the original has
// (matched by name, or by the reference block's first text = the original block's name: "Transaction details", "Notes") is the
// original's own; a block only the reference has (TM: Assignee / Related case) is cloned from it and gets the original's values
// by label ("Assignee" → the original header's "James Smith"). Data stays the original's; only the layout follows the reference.
async function sideFromReference(page, refRoot, colName, labelValue, notes) {
  if (!refRoot) return;
  let col = page.findOne(n => n.name === colName && n.visible); if (!col || !("children" in col)) return;
  const refMain = refRoot.findAll(n => n.type === "SLOT" && /^(Main content|Side content)$/.test(n.name));
  const refCol = refMain.flatMap(sl => sl.children).find(k => k.visible && /right column|side content/i.test(k.name)) ||
    refRoot.findAll(n => n.type === "SLOT" && n.name === "Content" && n.parent && /Aside/.test(n.parent.name)).flatMap(sl => sl.children).find(k => k.visible);
  if (!refCol || !("children" in refCol)) return;
  const firstText = n => { const t = n.type === "TEXT" ? n : (n.findOne ? n.findOne(q => q.type === "TEXT" && q.visible) : null); return t ? t.characters.trim() : ""; };
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
// Card chrome = own border + radius ≥ 8 + inner padding ≥ 16 on a (nearly) full-width wrapper. Stripped by overrides only
// (strokes, radius, padding — unbound from their variables first); the instance is never detached. Tables (padding 0) and
// small cards inside the wrapper don't qualify.
function stripCardChrome(c, fullW) {
  const r = typeof c.cornerRadius === "number" ? c.cornerRadius : 0, pad = Math.max(c.paddingTop || 0, c.paddingLeft || 0);
  if (!hasStroke(c) || r < 8 || pad < 16 || c.width < 0.9 * fullW) return false; // a layer with same-named siblings is an item of a list of cards (Blueprint `Case routing / Options` ×3), not a wrapper
  if (c.parent && "children" in c.parent && c.parent.children.filter(s => s.visible !== false && s.name === c.name).length > 1) return false;
  for (const p of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { c.setBoundVariable(p, null); } catch (e) {} }
  c.strokes = []; c.cornerRadius = 0; c.paddingTop = c.paddingRight = c.paddingBottom = c.paddingLeft = 0; return true;
}
async function buildIsland(scr, a, crumb) {
  const { nodes, plan } = a; const origW = a.W, origH = a.H, notes = [];
  const parent = scr.parent, x = scr.x, y = scr.y, idx = parent.children.indexOf(scr), name = scr.name;
  // header regions + fallback actions from the ORIGINAL (ancestor-visible), before anything moves
  const R = headerRegions(nodes.header, scr);
  // in a header STACK the top header is app chrome (TM: Summy AI + help, icon-only) — the entity's actions are the band's (Confirm · Pending · Approve · Add to case)
  if (nodes.header2) { const R2 = headerRegions(nodes.header2, scr); if (R2.actions.length) R.actions = R2.actions; R.status = R.status || R2.status; R.crumb = R.crumb || R2.crumb; R.key = R.key || R2.key; R.addInfo = R.addInfo || R2.addInfo; }
  // label → value pairs of the header stack ("Assignee" → "James Smith") and every text it shows — for the reference-driven header / sidebar
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
  // 1. Page instance
  const pageSet = await figma.importComponentSetByKeyAsync("f907195876aad003b980b77d6e9471e9418a0941");
  const variant = pageSet.children.find(c => /Ver=New/.test(c.name) && c.name.includes("Type=" + plan.pageType) && c.name.includes("Sandbox=" + (plan.sandbox ? "Yes" : "No")));
  const page = variant.createInstance();
  parent.insertChild(Math.max(0, idx), page); page.x = x; page.y = y; page.name = name;
  // 2. layout + width (re-fetch after each variant change)
  page.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body").setProperties({ "Content": plan.content });
  page.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body / Default").setProperties({ "Type": plan.width, "Show side content#23483:22": plan.sideContent });
  // 3. main content
  const mainSlot = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
  const mph = [...mainSlot.children];
  if (plan.content.includes("Ghost")) {
    const icComp = await figma.importComponentByKeyAsync("3595d612ef3d886a2dd9a4744add8b74f4ac9606");
    const wrapInIsland = nodesIn => {                                       // fill the island BEFORE it goes into the slot
      // NO CARD IN A CARD — the island is the card. A full-width wrapper in the block that draws a card of its own (TM: `Block`
      // p24 r12 border 1 around the AML check cards) loses that chrome, as in the reference; the small cards inside keep theirs.
      // Done BEFORE the move: once a block is inside the island's slot its sublayers get new ids and the old proxies throw.
      for (const g of nodesIn) { try { for (const c of [g, ...vis(g)]) if (stripCardChrome(c, g.width)) notes.push("no card in a card: " + g.name + " › " + c.name); } catch (e) {} }
      const ic = icComp.createInstance(); parent.appendChild(ic);
      try { ic.setProperties({ "Heading#26638:9": false }); } catch (e) {}   // the block brings its own title (Block Title / Title)
      const slot = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
      const ph = [...slot.children]; nodesIn.forEach((g, i) => slot.insertChild(i, g)); for (const q of ph) { try { q.remove(); } catch (e) {} }
      const sl = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
      for (const k of sl.children) { try { k.layoutSizingHorizontal = "FILL"; } catch (e) {} }
      // an island hugs its content: an old wrapper with a FIXED height (it filled the old column — Case page Related cases: `Risk overview`
      // 708 tall around 352 of content) would leave an empty band; auto-layout frames go HUG, as in the reference
      for (const k of sl.children) { try { if (k.type === "FRAME" && k.layoutMode && k.layoutMode !== "NONE" && k.layoutSizingVertical !== "HUG") { const h0 = Math.round(k.height); k.layoutSizingVertical = "HUG"; if (Math.abs(k.height - h0) > 1) notes.push("hugs its content: " + k.name + " " + h0 + " → " + Math.round(k.height)); } } catch (e) {} }
      // every designers' reference (Case Overview 16:20783, Financial data 21:44203, TM Transaction 311:53619) sets the island's
      // Slot padding to 0 — the content sits right on the card's own 16. The published default 8 made every island 16 taller.
      try { for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { try { sl.setBoundVariable(p, null); } catch (e) {} }
        sl.paddingTop = sl.paddingRight = sl.paddingBottom = sl.paddingLeft = 0; if (sl.children.length > 1) sl.itemSpacing = 16; } catch (e) {}
      try { sl.layoutSizingVertical = "HUG"; } catch (e) {}                  // island ships FIXED 153 with a FILL slot — HUG both
      try { ic.layoutSizingVertical = "HUG"; } catch (e) {}
      return ic; };
    // a heading block (Block Title / Title) is not an island of its own — it rides on top of the next group
    // groups that are layers of an INSTANCE (Blueprint New blueprint: `Blueprint general settings` is an instance, General fields /
    // Assignment / … its layers) can't be moved — insertChild throws. They are cloned out, as rule 5 does with mixed wrappers, and the
    // instance itself is removed once the cards are placed. Its name is read BEFORE the removal (reading it after throws → rollback).
    const instAnc = g => { let top = null; for (let p = g.parent; p && p.id !== scr.id && p.type !== "PAGE"; p = p.parent) if (p.type === "INSTANCE") top = p; return top; };
    const wrappers = new Map();
    nodes.groups = nodes.groups.map(g => { const w = instAnc(g); if (!w) return g; if (!wrappers.has(w.id)) wrappers.set(w.id, { node: w, name: w.name }); return g.clone(); });
    if (wrappers.size) notes.push("groups inside instance " + [...wrappers.values()].map(w => w.name).join(", ") + " — cloned out");
    const bundles = []; let pending = [];
    for (const g of nodes.groups) { if (isHeadingBlock(g)) { pending.push(g); continue; } bundles.push([...pending, g]); pending = []; }
    if (pending.length) bundles.push(pending);
    const cards = [];
    for (const bundle of bundles) {
      // the reference decides first; the rules only where the block isn't in the reference
      const g0 = bundle[bundle.length - 1], rp = refPlacement(a.refRoot, g0.name);
      if (rp === "bare") { for (const g of bundle) cards.push(g); notes.push("reference: " + g0.name + " bare"); continue; }
      if (rp === "island") { cards.push(wrapInIsland(bundle)); notes.push("reference: " + g0.name + " in an island"); continue; }
      // already a card, or a stack of cards (Case page Overview tab content) → straight on grey, no wrapping island
      if (bundle.length === 1 && rp !== "split" && (cardLike(bundle[0]) || isCardLayout(bundle[0]))) { cards.push(bundle[0]); continue; }
      if (bundle.length === 1 && (rp === "split" || isCardStack(bundle[0]))) {
        // a wrapper of cards (Case page Overview tab content): its parts become separate items of the main column,
        // exactly like the designers' after-reference. Cards stay bare, a non-card part (Transactions table) gets its own island.
        // The wrapper's own component link is lost (the reference does the same); every part stays a live instance.
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
  for (const c of page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content").children) { try { c.layoutSizingHorizontal = "FILL"; } catch (e) {} }
  try { page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content").layoutSizingVertical = "FILL"; } catch (e) {}
  // 4–5. side columns → Aside. A column that brings its own background (an organism: Case page right column) gets an Aside
  // WITHOUT paddings and fills it; a bare list (section navigation) keeps the padded Aside.
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
      if (sc) { const ph = [...sc.children]; sc.insertChild(0, nodes.right); for (const p of ph) { try { p.remove(); } catch (e) {} } } }
    else intoAside(nodes.right, "right");
    try { await sideFromReference(page, a.refRoot, nodes.right.name, labelValue, notes); } catch (e) { notes.push("side from reference: " + e.message); }
  }
  // 6. header — the Page's OWN header, filled region by region from the original
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
    // the reference's title counts only when it re-uses the original's data (TM: "Transfer: - 250,000.00 USD" ⊃ "250,000.00");
    // a placeholder title (Case refs: "SSO Login") shares nothing with the original and is ignored
    const refTitle = rh && rh.componentProperties["Title text#3817:0"] ? String(rh.componentProperties["Title text#3817:0"].value) : null;
    const reuses = t => (t.match(/[A-Za-z0-9][\w.,:+-]{3,}/g) || []).some(tok => /\d/.test(tok) && stackTexts.some(o => o.includes(tok)));
    if (refTitle && reuses(refTitle)) { try { const rc = rh.componentProperties["Copy title#6943:15"]; getHdr().setProperties(Object.assign({ "Title text#3817:0": refTitle }, rc ? { "Copy title#6943:15": !!rc.value } : {})); notes.push("title from the reference: " + refTitle); } catch (e) {} }   // the copy button belongs to the title it sits next to
    const fixTexts = async root => { for (const t of (root.findAll ? root.findAll(q => q.type === "TEXT") : [])) { const c = t.characters.trim();
        if (/^ID\s*:/i.test(c) && origId && c !== origId) { try { await figma.loadFontAsync(t.fontName); t.characters = origId; } catch (e) {} } } };
    const rInfo = refSlot(/^Info slot/i), rAdd = refSlot(/^Additional info/i);
    if (rInfo) { try { getHdr().setProperties({ "Show Info slot#6985:0": true });
        // the reference's row, but the ORIGINAL's data: a status with another label → the original status goes in; the counter gets the original score
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
    // tabs — items live in the Tab Basic "Items wrapper" slot; clone one in when the original had more tabs than the header ships
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
    if (acts.length) { try { getHdr().setProperties({ "Show actions slot#6943:20": true }); fillSlot(/Actions slot/i, acts);
        for (const c of [...hslot(/Actions slot/i).children]) { try { const tt = c.findOne(q => q.type === "TEXT" && q.visible); if (tt && /^Button$/i.test(tt.characters.trim())) c.remove(); } catch (e) {} }
        // the published header brings its own Summy AI and help icons outside the Actions slot; the old header kept them inside its Actions
        // row, so they were copied twice (Case page AML / Financial data). An icon-only copy whose icon the header already shows goes.
        try { const hh = getHdr(), asl = hslot(/Actions slot/i); const inAsl = n => { let q = n.parent; while (q && q.id !== hh.id) { if (q.id === asl.id) return true; q = q.parent; } return false; }; const shownIn = n => { let q = n; while (q && q.id !== hh.id) { if (q.visible === false) return false; q = q.parent; } return true; }; const own = new Set(hh.findAll(n => n.type === "INSTANCE" && /^(normal|small|large)\//.test(n.name) && shownIn(n) && !inAsl(n)).map(n => n.name)); for (const c of [...asl.children]) { try { if (c.findOne(q => q.type === "TEXT" && q.visible && q.characters.trim())) continue; const ic = c.findOne(q => q.type === "INSTANCE" && /^(normal|small|large)\//.test(q.name)); if (ic && own.has(ic.name)) { notes.push("the header has its own " + ic.name + " — the copied one removed"); c.remove(); } } catch (e) {} } } catch (e) {}
      } catch (e) { notes.push("actions: " + e.message); } }
  }
  // 7. overlays beside the instance (its children are locked)
  for (const ov of nodes.overlays) { try { const ob = box(ov, scr); parent.appendChild(ov); ov.x = x + ob.x; ov.y = y + ob.y; } catch (e) {} }
  // 8. keep the original size
  try { page.resize(origW, origH); } catch (e) {}
  // what the header stack carried but the result doesn't show (e.g. Transaction Date when the side panel has no such row)
  try { const shown = new Set(page.findAll(t => t.type === "TEXT" && t.visible).map(t => t.characters.trim()));
    const shownLow = new Set([...shown].map(t => t.toLowerCase()));
    const lost = Object.entries(labelValue).filter(([k, v]) => !shown.has(v) && !shownLow.has(k)).map(([k, v]) => k + ": " + v); if (lost.length) notes.push("header values not placed: " + lost.join(", ")); } catch (e) {}
  // 9. PRESERVATION GUARD — the source may only go if nothing visible is left outside its old header (stack), sidebar and subheader
  _idCache.clear();                                                          // the tree changed — rebuild id sets
  const leftover = scr.findAll(n => (n.type === "TEXT" || n.type === "INSTANCE") && n.visible !== false && rendered(n, scr) &&
      !contains(nodes.header, n) && !contains(nodes.header2, n) && !contains(nodes.sidebar, n) && !contains(nodes.subheader, n) && !(nodes.scrollbars || []).some(sb => contains(sb, n)));
  // never rename a layer (designers' rule): the source keeps its name; `kept` says what stayed in it
  if (leftover.length) {
    return { page, kept: [...new Set(leftover.map(n => n.name))], notes }; }
  try { scr.remove(); } catch (e) {}
  return { page, kept: [], notes };
}

// ─── VARIABLES (plugin doc §6.1, v3.209.0) ───
// With a designer after-reference: copy its fill/stroke bindings block by block. Without one: the §6.1 defaults.
const repaint = (n, prop, variable) => { const base = n[prop] && n[prop][0] ? JSON.parse(JSON.stringify(n[prop][0])) : { type: "SOLID", color: { r: 1, g: 1, b: 1 } };
  delete base.boundVariables; n[prop] = [figma.variables.setBoundVariableForPaint(base, "color", variable)]; };
async function copyVarsFromRef(refRoot, page, anchors) {
  const SEP = " › ", applied = [], skipped = [];
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
  const roleOf = nm => /^(Block Title|Body \/ Title|Heading|Title)\b/i.test(nm) ? "⟨heading⟩" : nm;
  const runs = list => { const out = []; for (const k of list) { const l = out[out.length - 1], nm = roleOf(k.name); if (l && l.name === nm) l.items.push(k); else out.push({ name: nm, items: [k] }); } return out; };
  const runSig = n => runs(kidsOf(n)).map(r => r.name).join("|");
  const matchKids = (rk, bk) => { const rr = runs(rk), br = runs(bk); if (rr.length !== br.length || rr.some((r, i) => r.name !== br[i].name)) return null;
    const p = []; br.forEach((b, i) => b.items.forEach((k, j) => p.push([rr[i].items[Math.min(j, rr[i].items.length - 1)], k]))); return p; };
  // the same component in ANOTHER VARIANT (reference items State=On, the original's State=Off): what differs between them is the
  // variant — the data — not the designer's layout. Such a pair is not descended into (text / icon colours stay the original's), and
  // on the pair itself only what the reference overrides against its own main component is copied (the hidden white fill).
  const otherVariant = (r, b) => { if (r.type !== "INSTANCE" || b.type !== "INSTANCE") return false;
    try { const rp = r.componentProperties || {}, bp = b.componentProperties || {};
      return Object.keys(rp).some(k => rp[k].type === "VARIANT" && bp[k] && bp[k].type === "VARIANT" && rp[k].value !== bp[k].value); } catch (e) { return false; } };
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
        let mc = null; if (ov) { try { mc = await rn.getMainComponentAsync(); } catch (e) {} }   // another variant: compare with the reference's own main
        if (a === "Page / Body / IslandCard" && (path === "·" || path === "·" + SEP + "Slot")) continue;       // published internals win
        // sizing: the designers switch fixed-width blocks to FILL (or pin a column FIXED) when the content gets wider — copy it
        // …but never a FIXED width that doesn't fit where the block now sits: the published Aside is 400 and doesn't stretch, while a
        // branch reference may show the same column at 424 with no panel around it (Case page right column → 24 px overflow).
        // a rotated layer's width is its length (Events connector lines, -90°: width 76 in a 16 frame) — sizing is not compared or copied
        if (!(rn.type === "LINE" || rn.type === "VECTOR" || Math.abs(rn.rotation || 0) > 0.5 || Math.abs(bn.rotation || 0) > 0.5)) try { const rs = rn.layoutSizingHorizontal, bs = bn.layoutSizingHorizontal, pa = bn.parent;
          const inPanel = !!pa && (pa.type === "SLOT" && (pa.name === "Side content" || (pa.name === "Content" && pa.parent && /Aside/.test(pa.parent.name))));
          const room = pa && typeof pa.width === "number" ? pa.width - (pa.paddingLeft || 0) - (pa.paddingRight || 0) : Infinity;
          if (rs === "FIXED" && (inPanel || rn.width > room + 1)) { if (bs !== "FILL") { try { bn.layoutSizingHorizontal = "FILL"; applied.push(a + path + " width → FILL (reference width " + Math.round(rn.width) + " doesn't fit " + Math.round(room) + ")"); } catch (e) {} } }
          else {
            if (rs && bs && rs !== bs) { bn.layoutSizingHorizontal = rs; applied.push(a + path + " width → " + rs); }
            // a FIXED layer that spans its parent in the reference (FIU table row dividers: 884 in an 884 row) spans OUR parent — copying the
            // number would leave it 24 short in a wider island. Only changes that actually took are logged.
            if (rs === "FIXED") { const rp = rn.parent, rroom = rp && typeof rp.width === "number" ? rp.width - (rp.paddingLeft || 0) - (rp.paddingRight || 0) : null; const spans = rroom != null && Math.abs(rn.width - rroom) <= 1 && room !== Infinity, target = spans ? room : rn.width; if (Math.abs(target - bn.width) > 1) { const w0 = bn.width; bn.resize(target, bn.height); if (Math.abs(bn.width - w0) > 0.5) applied.push(a + path + " width " + Math.round(target) + (spans ? " (spans its parent, as in the reference)" : "")); } } }
        } catch (e) {}
        // paddings and gaps: the designers retune a block's inner spacing for the island layout (TM: `Customers card / Finance`,
        // heading and info padding 24 → 16) — take the reference's value, bound to its spacing variable when it has one
        // a grid child's alignment in its cell (CM team overview: `Team` MIN → AUTO in the reference, with FILL)
        try { if (rn.parent && bn.parent && rn.parent.layoutMode === "GRID" && bn.parent.layoutMode === "GRID") for (const k of ["gridChildHorizontalAlign", "gridChildVerticalAlign"]) {
            if (rn[k] && bn[k] && rn[k] !== bn[k] && !(ov && mc && mc[k] === rn[k])) { bn[k] = rn[k]; applied.push(a + path + " " + (k === "gridChildHorizontalAlign" ? "cell align H" : "cell align V") + " → " + rn[k]); } } } catch (e) {}
        // pairing modes (CM managers overview: `Open cases`, `TR widget`, `Team` moved their side padding 16 into new wrapper frames we don't have):
        //  full — the whole subtree pairs: copy everything;  stopped — own children pair but one of them is restructured: copy only top / bottom
        //  padding and gaps (the side padding went into layers we don't have — copying 16/0/16/0 left titles flush with the card edge);
        //  restructured — own children don't pair: top / bottom padding only;  style — below a stopped block: width, radius, paint, never spacing
        //  (Case page Events: an event's Info padding 12 → 0 compensates a line hidden elsewhere in the reference)
        // a GRID has no itemSpacing of its own — its gaps are gridRowGap / gridColumnGap (CM team overview: the Team / SLA grid's bottom
        // padding 16 → 0 in the reference; skipping grids left 16 px of extra grey under the row)
        try { if (mode !== "style" && rn.layoutMode && rn.layoutMode !== "NONE" && bn.layoutMode === rn.layoutMode) { const changed = [];
            const spKeys = rn.layoutMode === "GRID" ? ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gridRowGap", "gridColumnGap"] : ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "itemSpacing"];
            const keys = mode === "full" ? spKeys : spKeys.filter(k => k === "paddingTop" || k === "paddingBottom" || (mode === "stopped" && !/padding/.test(k)));
            for (const k of keys) {
              const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k];
              if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
              if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;                       // the variant's own spacing, not an override
              let v = null; if (rbv) { try { v = await figma.variables.getVariableByIdAsync(rbv.id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); } catch (e) {} }
              try { bn.setBoundVariable(k, null); } catch (e) {}
              if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
              changed.push((k === "itemSpacing" ? "gap" : k === "gridRowGap" ? "row gap" : k === "gridColumnGap" ? "column gap" : k.replace("padding", "").toLowerCase()) + " " + Math.round(rv)); }
            if (changed.length) applied.push(a + path + " spacing → " + changed.join(", ")); } } catch (e) { skipped.push(a + path + " spacing: " + e.message); }
        // corner radius: the designers round the cards up for the island layout (CM Overview for managers: `.To do`, `Team` … 12 → 16,
        // bound to border-radius/xl) while some blocks keep theirs (`Documents block old` stays 12 in every reference) — so take the
        // paired reference layer's radius, bound to its variable when it has one, instead of a blanket rule
        try { if ("topLeftRadius" in rn && "topLeftRadius" in bn) { let changed = false;
            for (const k of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
              const rv = rn[k] || 0, rbv = rn.boundVariables && rn.boundVariables[k], bbv = bn.boundVariables && bn.boundVariables[k];
              if (Math.abs((bn[k] || 0) - rv) < 0.5 && (!rbv || (bbv && bbv.id === rbv.id))) continue;
              if (ov && (!mc || Math.abs((mc[k] || 0) - rv) < 0.5)) continue;                       // the variant's own radius, not an override
              let v = null; if (rbv) { try { v = await figma.variables.getVariableByIdAsync(rbv.id); if (v && v.remote && v.key) v = await figma.variables.importVariableByKeyAsync(v.key); } catch (e) {} }
              try { bn.setBoundVariable(k, null); } catch (e) {}
              if (v) { try { bn.setBoundVariable(k, v); } catch (e) { bn[k] = rv; } } else bn[k] = rv;
              changed = true; }
            if (changed) applied.push(a + path + " radius → " + Math.round(rn.topLeftRadius || 0)); } } catch (e) { skipped.push(a + path + " radius: " + e.message); }
        for (const prop of ["fills", "strokes"]) { try {
          const rVis = prop === "fills" ? visFill(rn) : visStroke(rn), bVis = prop === "fills" ? visFill(bn) : visStroke(bn);
          if (ov && (!mc || (rVis === (prop === "fills" ? visFill(mc) : visStroke(mc)) && bvOf(rn, prop) === bvOf(mc, prop)))) continue;   // the variant's own paint
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
  // bare cards on the grey: secondary fill + subtlest border
  for (const k of (ms ? ms.children : [])) { if (!k.visible || k.name === "Page / Body / IslandCard" || !isCard(k)) continue;
    try { if (isWhite(k)) repaint(k, "fills", v.cardFill); if (hasStroke(k)) repaint(k, "strokes", v.border); log.push("card " + k.name); } catch (e) { log.push("card " + k.name + ": " + e.message); } }
  // side columns (Aside content / Side content): border subtlest on the column and its first bordered block
  const sideSlots = page.findAll(n => n.type === "SLOT" && (n.name === "Side content" || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
  for (const s of sideSlots) for (const k of s.children) { try { if (hasStroke(k)) repaint(k, "strokes", v.border);
      const top = ("children" in k) ? k.children.find(c => c.visible && hasStroke(c)) : null; if (top) repaint(top, "strokes", v.border); log.push("side " + k.name); } catch (e) { log.push("side " + k.name + ": " + e.message); } }
  // inside islands: a table's wrapper frame loses its fill (the island is the white), white table rows get the table-row token
  for (const ic of page.findAll(n => n.type === "INSTANCE" && n.name === "Page / Body / IslandCard")) { const sl = ic.findOne(n => n.type === "SLOT"); if (!sl) continue;
    for (const k of sl.children) { try { if (k.type === "FRAME" && fillOf(k) && k.findOne(x => /table/i.test(x.name))) { k.fills = []; log.push("table wrapper " + k.name + " → no fill"); } } catch (e) {} }
    for (const r of sl.findAll(n => /(^|\/ )(Table )?Row(#\d+)?$/i.test(n.name) && isWhite(n))) { try { repaint(r, "fills", v.row); } catch (e) {} } }
  return log;
}
// after buildIsland: reference first, §6.1 defaults otherwise. refId comes from the copy's name "… (ref <nodeId>)".
async function finishIsland(page, refId) {
  if (refId) { const ref = await figma.getNodeByIdAsync(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
      const content = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
      const anchors = [...new Set(content.flatMap(s => s.children).filter(n => n.name !== "Page / Body / IslandCard").map(n => n.name))].concat(["Page / Body / IslandCard"]);
      return { from: "reference " + refId, ...(await copyVarsFromRef(ref, page, anchors)) }; } }
  return { from: "§6.1 defaults", applied: await applyIslandTokens(page), skipped: [] };
}

// ─── ONE SCREEN, REFERENCE-GUIDED — TWO CALLS ───
// Call 1 `migrateOne(id)` builds. Call 2 `finishAndAudit(pageId, refId)` copies variables and audits.
// They MUST be separate use_figma calls: after blocks move into slots, node proxies in the same call go stale
// ("node … does not exist" while walking the moved tree) and the throw rolls the whole build back.
// grey = a grey surface (ghost #f9fafb / subtlest #f3f4f6) under at least 40 % of the reference's main content area
function refIsGrey(P) {
  const ms = P.findAll(n => n.type === "SLOT" && n.name === "Main content")[0]; if (!ms || !ms.absoluteBoundingBox) return null; const mb = ms.absoluteBoundingBox;
  return P.findAll(n => n.visible && n.fills && n.fills !== figma.mixed && n.fills.length && n.fills[0].type === "SOLID" && n.fills[0].visible !== false && !!n.absoluteBoundingBox &&
    (() => { const c = n.fills[0].color; return c.r > 0.93 && c.r < 0.985 && Math.abs(c.r - c.b) < 0.03; })() &&
    (() => { const b = n.absoluteBoundingBox; const ix = Math.max(0, Math.min(b.x + b.width, mb.x + mb.width) - Math.max(b.x, mb.x)), iy = Math.max(0, Math.min(b.y + b.height, mb.y + mb.height) - Math.max(b.y, mb.y)); return ix * iy > 0.4 * mb.width * mb.height; })()).length > 0;
}
// PLAN ONLY — read-only. Run it first and compare with the reference before building (§6.2 step 0).
async function planOne(scrId, refOverride) {
  const scr = await figma.getNodeByIdAsync(scrId); if (!scr) return { id: scrId, missing: true };
  let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();
  const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = refOverride || (m ? m[1] : null);
  _idCache.clear(); const a = analyze(scr);
  let refP = null; if (refId) { const ref = await figma.getNodeByIdAsync(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync(); refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => n.type === "INSTANCE" && n.name === "Page"); } }
  const grey = refP ? refIsGrey(refP) : null; const rms = refP ? refP.findAll(n => n.type === "SLOT" && n.name === "Main content")[0] : null; // the same width rule migrateOne applies with a reference
const planWidth = rms && !a.nodes.table ? ((rms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max") : a.plan.width;
  const blocks = []; let pending = [];
  for (const g of a.nodes.groups) { if (isHeadingBlock(g)) { pending.push(g.name); continue; }
    const rp = refPlacement(refP, g.name);
    const how = rp ? rp + " (reference)" : (cardLike(g) || isCardLayout(g)) ? "bare (rule)" : isCardStack(g) ? "split (rule)" : "island (rule)";
    blocks.push([...pending, g.name].join(" + ") + " → " + how); pending = []; }
  if (pending.length) blocks.push(pending.join(" + ") + " → island (rule)");
  return clean({ id: scrId, name: scr.name, confident: a.confident, notes: a.notes, ref: refId, refGrey: grey, verdict: grey === false ? "STOP: white reference" : (a.confident ? "build" : "STOP: not confident"),
    plan: [refP && refP.componentProperties.Type ? refP.componentProperties.Type.value : a.plan.pageType, a.plan.content, planWidth, a.plan.sideContent ? "side" : ""].join(" | "),
    blocks, crumb: headerRegions(a.nodes.header, scr).crumb || refCrumb(refP) || null, left: a.nodes.left && a.nodes.left.name, right: a.nodes.right && a.nodes.right.name, tabs: a.plan.tabs, title: a.plan.title,
    header2: a.nodes.header2 && a.nodes.header2.name, subheader: a.nodes.subheader && a.nodes.subheader.name });
}
async function migrateOne(scrId, refOverride) {   // refOverride: the designer's reference node id, when the screen's name doesn't carry "(ref …)"
  const scr = await figma.getNodeByIdAsync(scrId); if (!scr) return { id: scrId, missing: true };
  let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
  const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = refOverride || (m ? m[1] : null), name = scr.name;
  _idCache.clear(); const a = analyze(scr);
  if (!a.confident) return { id: scrId, name, stopped: "not confident", notes: a.notes };
  let refP = null;
  if (refId) { const ref = await figma.getNodeByIdAsync(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync();
      refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => n.type === "INSTANCE" && n.name === "Page"); } }
  if (refP && refIsGrey(refP) === false) return { id: scrId, name, stopped: "the reference is WHITE — this screen stays on the white layout and is not part of the grey + islands migration", ref: refId };
  a.refRoot = refP;
  if (refP) { const t = refP.componentProperties.Type; if (t && /Basic|Full screen page/.test(t.value)) a.plan.pageType = t.value;
    const ms = refP.findAll(n => n.type === "SLOT" && n.name === "Main content")[0];
    if (ms && !a.nodes.table) a.plan.width = (ms.width >= 1280 || a.plan.content === "◼️ Main + Right (Ghost)") ? "Full width" : "1084 max";
    a.W = Math.round(refP.width); a.H = Math.round(refP.height); }
  const r = await buildIsland(scr, a, null);
  return clean({ id: scrId, name: name.slice(0, 50), pageId: r.page.id, ref: refP ? refId : null, plan: [a.plan.pageType, a.plan.content, a.plan.width, a.plan.sideContent ? "side" : ""].join(" | "),
    kept: r.kept, notes: r.notes });
}
// Old screens were narrower: their cards and columns carry FIXED widths of the old layout (CM team overview: cards 362 in a
// grid that is now 1340 wide → a third of every island row empty). With a reference its sizing is copied (copyVarsFromRef).
// Without one: grid children → FILL; a FIXED card narrower than its vertical stack → FILL. Then every grid row must span the grid.
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
  // FILL-height children follow the page (a side column spanning the Aside) — counting them grows the page on every run.
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
