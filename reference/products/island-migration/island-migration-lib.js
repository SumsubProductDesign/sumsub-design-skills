// Island migration engine — full, commented source. Run it through build.js + finish.js (two use_figma calls); see island-layout-pattern.md §6.2.
// ═══ island migration library — analyze a screen by geometry, plan, then rebuild it on the Page layout ═══
const rendered = (n, stop) => { const sid = stop ? stop.id : null; let p = n;
  while (p && p.type !== "PAGE" && p.id !== sid) { if ("visible" in p && p.visible === false) return false; p = p.parent; } return true; };
const mainName = n => { try { const m = n.mainComponent; return m ? ((m.parent && m.parent.type === "COMPONENT_SET") ? m.parent.name : m.name) : ""; } catch (e) { return ""; } };
const box = (n, ref) => { const a = n.absoluteTransform, r = ref.absoluteTransform; return { x: Math.round(a[0][2] - r[0][2]), y: Math.round(a[1][2] - r[1][2]), w: Math.round(n.width), h: Math.round(n.height) }; };
const vis = n => ("children" in n) ? n.children.filter(k => k.visible !== false) : [];
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
  const sidebar = all.filter(n => { const b = box(n, scr); return b.x <= 2 && b.y <= 2 && b.h >= 0.8 * H && b.w >= 44 && b.w <= 300 &&
      (/sidebar|menu|navigation/i.test(n.name) || /Sidebar/.test(mainName(n))); }).sort((a, b) => b.height - a.height)[0] || null;
  const sbW = sidebar ? Math.round(sidebar.width) : 0;
  const header = all.filter(n => { const b = box(n, scr); return b.y <= 2 && b.h >= 40 && b.h <= 160 && b.x >= sbW - 2 && b.w >= 0.7 * (W - sbW) &&
      (/header/i.test(n.name) || /Header/.test(mainName(n))); }).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
  const hdrH = header ? Math.round(header.height) : 0;
  // a tab strip sitting right under the header, outside it (e.g. Case page: tabs live in the left column) — chrome, not content
  const subheader = all.filter(n => { const b = box(n, scr); return !contains(header, n) && b.y >= hdrH - 2 && b.y <= hdrH + 24 && b.h >= 32 && b.h <= 72 &&
      "findOne" in n && !!n.findOne(x => /^\*Tab Basic\*|Tab Basic \/ Item/.test(x.name)); }).sort((a, b) => b.width - a.width)[0] || null;
  const isChrome = n => contains(header, n) || contains(sidebar, n) || contains(subheader, n);
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
    else { let inner = unwrap(main); let k = vis(inner).filter(x => !(subheader && x.id === subheader.id));
      if (k.length === 1 && "children" in k[0]) { inner = unwrapSingle(k[0]); k = inner.type === "INSTANCE" ? [inner] : vis(inner); }
      if (isCardLayout(inner) && !(subheader && contains(inner, subheader))) groups = [inner];          // a layout of cards stays whole
      else groups = (k.length >= 2 && k.every(x => x.width >= 0.6 * inner.width)) ? k : [inner]; } }
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
  const tabPairs = tabSrc.flatMap(h => h.findAll(n => n.type === "INSTANCE" && /Tab Basic \/ Item/i.test(n.name) && rendered(n, scr)))
      .map(t => { const x = t.findOne(y => y.type === "TEXT" && y.visible); const sp = t.componentProperties && t.componentProperties.Selected;
        return { label: x ? x.characters : null, sel: !!sp && String(sp.value) === "true" }; }).filter(t => t.label);
  const tabs = tabPairs.map(t => t.label), tabSelected = Math.max(0, tabPairs.findIndex(t => t.sel));
  let sandbox = false; if (header) { const s = header.findOne(n => n.type === "TEXT" && /sandbox mode/i.test(n.characters)); if (s) sandbox = rendered(s, scr) && s.visible; }
  const plan = { pageType, content, width, sideContent: !!right && content === "◼️ Main (Ghost)", sandbox, title, tabs, tabSelected };
  return { W, H, nodes: { sidebar, header, subheader, main, left, right, groups, overlays, table }, plan, confident: !!header && !!main && notes.length === 0, notes,
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
  const cr = T.find(t => inA(t, /Breadcrumb/i) && t.characters.trim().length > 1);
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
async function buildIsland(scr, a, crumb) {
  const { nodes, plan } = a; const origW = a.W, origH = a.H, notes = [];
  const parent = scr.parent, x = scr.x, y = scr.y, idx = parent.children.indexOf(scr), name = scr.name;
  // header regions + fallback actions from the ORIGINAL (ancestor-visible), before anything moves
  const R = headerRegions(nodes.header, scr);
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
      const ic = icComp.createInstance(); parent.appendChild(ic);
      try { ic.setProperties({ "Heading#26638:9": false }); } catch (e) {}   // the block brings its own title (Block Title / Title)
      const slot = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
      const ph = [...slot.children]; nodesIn.forEach((g, i) => slot.insertChild(i, g)); for (const q of ph) { try { q.remove(); } catch (e) {} }
      const sl = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
      for (const k of sl.children) { try { k.layoutSizingHorizontal = "FILL"; } catch (e) {} }
      try { sl.layoutSizingVertical = "HUG"; } catch (e) {}                  // island ships FIXED 153 with a FILL slot — HUG both
      try { ic.layoutSizingVertical = "HUG"; } catch (e) {}
      return ic; };
    // a heading block (Block Title / Title) is not an island of its own — it rides on top of the next group
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
    const bc = getHdr().findOne(n => n.type === "INSTANCE" && /Breadcrumb/i.test(n.name)); const crumbText = R.crumb || crumb;
    if (bc && crumbText) { try { bc.setProperties({ "Name#6638:5": crumbText }); } catch (e) {} }
    if (R.status) { try { fillSlot(/^Info slot/i, [R.status]); } catch (e) { notes.push("status: " + e.message); } }
    if (R.addInfo) { try { fillSlot(/^Additional info/i, vis(R.addInfo)); } catch (e) { notes.push("additional info: " + e.message); } }
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
      } catch (e) { notes.push("actions: " + e.message); } }
  }
  // 7. overlays beside the instance (its children are locked)
  for (const ov of nodes.overlays) { try { const ob = box(ov, scr); parent.appendChild(ov); ov.x = x + ob.x; ov.y = y + ob.y; } catch (e) {} }
  // 8. keep the original size
  try { page.resize(origW, origH); } catch (e) {}
  // 9. PRESERVATION GUARD — the source may only go if nothing visible is left outside its old header, sidebar and subheader
  _idCache.clear();                                                          // the tree changed — rebuild id sets
  const leftover = scr.findAll(n => (n.type === "TEXT" || n.type === "INSTANCE") && n.visible !== false && rendered(n, scr) &&
      !contains(nodes.header, n) && !contains(nodes.sidebar, n) && !contains(nodes.subheader, n));
  if (leftover.length) { scr.name = name + " — NOT MIGRATED: " + [...new Set(leftover.map(n => n.name))].slice(0, 6).join(", ");
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
  const collect = root => { const map = new Map(); const walk = (n, path) => { map.set(path, n); if (!("children" in n)) return; const cnt = {};
      for (const k of n.children) { if (k.visible === false) continue; cnt[k.name] = (cnt[k.name] || 0) + 1; walk(k, path + SEP + k.name + (cnt[k.name] > 1 ? "#" + cnt[k.name] : "")); } };
    walk(root, "·"); return map; };
  for (const a of anchors) {
    const R = refRoot.findAll(n => n.name === a && n.visible), B = page.findAll(n => n.name === a && n.visible);
    for (let i = 0; i < Math.min(R.length, B.length); i++) { let mr, mb; try { mr = collect(R[i]); mb = collect(B[i]); } catch (e) { skipped.push(a + ": walk failed " + e.message); continue; }
      for (const [path, rn] of mr) { const bn = mb.get(path); if (!bn) continue;
        if (a === "Page / Body / IslandCard" && (path === "·" || path === "·" + SEP + "Slot")) continue;       // published internals win
        // sizing: the designers switch fixed-width blocks to FILL (or pin a column FIXED) when the content gets wider — copy it
        // …but never a FIXED width that doesn't fit where the block now sits: the published Aside is 400 and doesn't stretch, while a
        // branch reference may show the same column at 424 with no panel around it (Case page right column → 24 px overflow).
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
async function planOne(scrId) {
  const scr = await figma.getNodeByIdAsync(scrId); if (!scr) return { id: scrId, missing: true };
  let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync();
  const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = m ? m[1] : null;
  _idCache.clear(); const a = analyze(scr);
  let refP = null; if (refId) { const ref = await figma.getNodeByIdAsync(refId);
    if (ref) { let pr = ref; while (pr.type !== "PAGE") pr = pr.parent; await pr.loadAsync(); refP = ref.type === "INSTANCE" && ref.name === "Page" ? ref : ref.findOne(n => n.type === "INSTANCE" && n.name === "Page"); } }
  const grey = refP ? refIsGrey(refP) : null;
  const blocks = []; let pending = [];
  for (const g of a.nodes.groups) { if (isHeadingBlock(g)) { pending.push(g.name); continue; }
    const rp = refPlacement(refP, g.name);
    const how = rp ? rp + " (reference)" : (cardLike(g) || isCardLayout(g)) ? "bare (rule)" : isCardStack(g) ? "split (rule)" : "island (rule)";
    blocks.push([...pending, g.name].join(" + ") + " → " + how); pending = []; }
  if (pending.length) blocks.push(pending.join(" + ") + " → island (rule)");
  return { id: scrId, name: scr.name, confident: a.confident, notes: a.notes, ref: refId, refGrey: grey, verdict: grey === false ? "STOP: white reference" : (a.confident ? "build" : "STOP: not confident"),
    plan: [refP && refP.componentProperties.Type ? refP.componentProperties.Type.value : a.plan.pageType, a.plan.content, a.plan.width, a.plan.sideContent ? "side" : ""].join(" | "),
    blocks, left: a.nodes.left && a.nodes.left.name, right: a.nodes.right && a.nodes.right.name, tabs: a.plan.tabs, title: a.plan.title };
}
async function migrateOne(scrId) {
  const scr = await figma.getNodeByIdAsync(scrId); if (!scr) return { id: scrId, missing: true };
  let pg = scr; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
  const m = /ref\s+(\d+:\d+)/.exec(scr.name), refId = m ? m[1] : null, name = scr.name;
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
  return { id: scrId, name: name.slice(0, 50), pageId: r.page.id, ref: refP ? refId : null, plan: [a.plan.pageType, a.plan.content, a.plan.width, a.plan.sideContent ? "side" : ""].join(" | "),
    kept: r.kept, notes: r.notes };
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
  for (const n of page.findAll(x => x.visible && (x.layoutSizingHorizontal === "FILL" || cardLike(x)) && x.parent && x.parent.layoutMode === "VERTICAL" && x.parent.layoutSizingHorizontal !== "HUG")) {
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
async function finishAndAudit(pageId, refId) {
  const page = await figma.getNodeByIdAsync(pageId); let pg = page; while (pg.type !== "PAGE") pg = pg.parent; await pg.loadAsync(); await figma.setCurrentPageAsync(pg);
  let fin;
  try { fin = await finishIsland(page, refId); } catch (e) { fin = { from: "error", applied: [], skipped: [e.message] }; }
  const gridIssues = stretchToWidth(page, !!refId);
  const side = fitSideColumns(page);
  const pb = page.absoluteTransform[1][2];
  const slots = page.findAll(n => n.type === "SLOT" && (/^(Main content|Side content)$/.test(n.name) || (n.name === "Content" && n.parent && /Aside/.test(n.parent.name))));
  // FILL-height children follow the page (a side column spanning the Aside) — counting them grows the page on every run.
  const bottom = Math.max(0, ...slots.flatMap(s => s.children.filter(k => k.visible && k.layoutSizingVertical !== "FILL").map(k => k.absoluteTransform[1][2] - pb + k.height)));
  if (bottom + 20 > page.height) { try { page.resize(page.width, Math.ceil(bottom + 28)); } catch (e) {} }
  const ms2 = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
  const notIsland = ms2 ? ms2.children.filter(k => k.visible && k.name !== "Page / Body / IslandCard" && !cardLike(k) && !isCardLayout(k)).map(k => k.name) : ["no main slot"];
  const overflow = slots.map(s => { const sb = s.absoluteBoundingBox; const o = s.children.filter(k => k.visible && k.absoluteBoundingBox &&
      (k.absoluteBoundingBox.x + k.absoluteBoundingBox.width > sb.x + sb.width + 1)).map(k => k.name); return o.length ? s.name + ": " + o.join(", ") : null; }).filter(Boolean);
  const items = ms2 ? ms2.children.filter(k => k.visible).map(k => k.name === "Page / Body / IslandCard" ? "ISL[" + ((k.findOne(n => n.type === "SLOT") || { children: [] }).children.map(q => q.name.slice(0, 24)).join(" + ")) + "]" : "bare:" + k.name.slice(0, 26)) : [];
  return { pageId, size: Math.round(page.width) + "×" + Math.round(page.height), main: items, notIsland, overflow, gridIssues, sideFit: side.fit, sideOverflow: side.inside, narrowFills: narrowFills(page), vars: { from: fin.from, n: fin.applied.length, skipped: fin.skipped.slice(0, 3) } };
}
