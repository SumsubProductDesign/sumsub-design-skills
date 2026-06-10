// ===== AUDIT SEGMENT 2/3 (7.31 → before 7.48) =====
// Run: set ROOT_ID_HERE + productContext (top), run via use_figma, collect {issues, info}.
// After all 3: concatenate issues + info; PASS iff total issues==0. Surface info[] (esp 7.56 stale warning).
// Self-contained (<50KB, comments intact, NO stripping).
// Audit script — paste and adapt ROOT_ID + productContext (the ONLY two edits allowed).
const root = figma.getNodeById("ROOT_ID_HERE");
// ⚠️ v3.151: productContext MUST be declared at the TOP — checks 7.44/7.45 (lines ~2452)
// reference it BEFORE the later "Product-required components" section. Declaring it only
// there caused a TDZ ReferenceError that forced agents to hand-fix the verbatim script.
// Set to "flow-builder" | "applicant-page" | "table-page" | "tm" | "case-management" | null,
// OR an object { canonicalMap, requiresCanonical } for canonical-match builds.
const productContext = null;
// ⚠️ v3.151: `page` is used by checks 7.46/7.47/7.48/7.45 (root must live on a Drafts page,
// section containment). Derive it from root's ancestor chain so those checks run verbatim.
let page = root.parent;
while (page && page.type !== "PAGE") page = page.parent;
const issues = [];
const all = root.findAll(n => true);

// Helper: component internals are not our responsibility. Skip any node
// whose ancestor chain (between itself and root) passes through an INSTANCE.
function isInsideInstance(n) {
  let p = n.parent;
  while (p && p !== root && p.type !== "PAGE") {
    if (p.type === "INSTANCE") return true;
    p = p.parent;
  }
  return false;
}
// Helper: is the node visible on canvas? (walks up checking every ancestor's visible flag)
function isVisible(n) {
  let cur = n;
  while (cur && cur !== root) {
    if (cur.visible === false) return false;
    cur = cur.parent;
  }
  return true;
}

const infos = [];
const sidebar = root.findOne(n =>
  n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Sidebar*"
);
// 7.31. Scenarios annotation placement — Rule from sumsub-screen-annotations.
// Scenarios belong ABOVE each screen (y < screen.y), x-aligned to screen.
// NOT to the right of the screen (x > screen.x + screen.width), NOT per-row.
{
  const annotations = all.filter(n =>
    n.type === "INSTANCE" && /Scenario/i.test(n.mainComponent?.parent?.name || "")
  );
  // Group annotations by their nearest screen sibling (same parent).
  // An annotation placed at x > screen.right or y inside screen body = wrong.
  for (const ann of annotations) {
    // Find screen in same parent (SECTION) whose x-range overlaps the annotation's
    const parent = ann.parent;
    if (!parent || parent.type !== "SECTION") continue;
    const screens = (parent.children || []).filter(c =>
      c.type === "FRAME" && c !== ann &&
      Math.abs(c.width - 1440) < 4 && Math.abs(c.height - 900) < 4
    );
    // Associate with the screen whose x overlaps horizontally or is closest
    const related = screens.find(s =>
      ann.x >= s.x && ann.x < s.x + s.width
    ) || screens.sort((a, b) => Math.abs(ann.x - a.x) - Math.abs(ann.x - b.x))[0];
    if (!related) continue;
    // Expect: ann.x in [screen.x, screen.x + screen.width - ann.width]
    //         ann.y < screen.y (above, not inside, not below)
    const outRight = ann.x > related.x + related.width - 4;
    const inside = ann.y >= related.y && ann.y < related.y + related.height;
    const below = ann.y >= related.y + related.height;
    if (outRight || inside || below) {
      issues.push(`Scenario annotation "${ann.componentProperties?.["✏️ Number#121:0"]?.value || ann.name}" placed wrong (x=${Math.round(ann.x)}, y=${Math.round(ann.y)}; screen at x=${Math.round(related.x)}, y=${Math.round(related.y)}). Scenarios must be ABOVE the screen (y < screen.y), x-aligned to screen. Not to the right, not inside, not below. Rule: sumsub-screen-annotations SKILL.md.`);
    }
  }
  // Also: per-row annotations — if there are ≥2 annotations aligned with
  // the same screen, likely someone tried to annotate individual rows.
  const groupedByScreen = {};
  for (const ann of annotations) {
    const parent = ann.parent;
    if (!parent || parent.type !== "SECTION") continue;
    const screens = (parent.children || []).filter(c =>
      c.type === "FRAME" && c !== ann &&
      Math.abs(c.width - 1440) < 4 && Math.abs(c.height - 900) < 4
    );
    const related = screens.find(s =>
      (ann.x >= s.x - 100 && ann.x < s.x + s.width + 100) &&
      (Math.abs(ann.y - s.y) < 200 || (ann.x > s.x + s.width))
    );
    if (related) {
      groupedByScreen[related.id] = (groupedByScreen[related.id] || 0) + 1;
    }
  }
  for (const [screenId, count] of Object.entries(groupedByScreen)) {
    if (count > 1) {
      issues.push(`${count} scenario annotations associated with screen ${screenId} — only ONE annotation per screen allowed. Multiple scenarios → multiple screens, not multiple annotations on one. Rule: sumsub-screen-annotations SKILL.md + Task-phrase glossary.`);
    }
  }
}

// 7.32. Table Starter — manual cell hiding detection.
// Caught in KYB Levels build: skill used `.visible = false` on header/data
// cells instead of a DS column-count property. Symptom: header cells
// misaligned with data rows because widths drift.
for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
  const header = tbl.children?.find(c => c.name === "Table Header");
  if (!header) continue;
  const hiddenHeaderCells = (header.children || []).filter(c => c.visible === false && c.type === "INSTANCE").length;
  if (hiddenHeaderCells > 0) {
    issues.push(`Table Starter "${tbl.name}" has ${hiddenHeaderCells} Header cell(s) manually hidden via .visible = false. Use DS component property for column count instead (probe via table.componentProperties for a /column/i variant or boolean). Manual hiding doesn't resize remaining cells and causes header/row misalignment.`);
  }
}

// 7.33. Modal/Drawer footer — default "Button" label leak.
// Observed (Domain management build, v3.55): skill configured the 2 Right-action
// buttons correctly but left a VISIBLE *Button* in Left actions with default
// label "Button". Parent Left actions frame is hidden by default so it doesn't
// render, but the structure is fragile — next DS revision flipping visibility
// would leak "Button" into every modal.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const footer = md.findOne(n => n.type === "INSTANCE" && /\/ Footer/i.test(n.name));
  if (!footer) continue;
  // Find *Button* instances where every ancestor up to ROOT is visible
  // (not just up to footer — fix from v3.59: hidden grand-parents must
  // be respected, otherwise audit reports false positives for buttons
  // inside hidden Top Toolbar / hidden Left actions / etc.).
  const visibleBtns = footer.findAll(n => {
    if (!(n.type === "INSTANCE" && n.name === "*Button*")) return false;
    let cur = n;
    while (cur && cur !== root) {
      if (cur.visible === false) return false;
      cur = cur.parent;
    }
    return true;
  });
  for (const b of visibleBtns) {
    const t = b.findOne(x => x.type === "TEXT" && x.name === "Button");
    if (t && t.characters === "Button") {
      issues.push(`Modal/Drawer "${md.name}" footer has a visible *Button* with default label "Button" (id ${b.id}). Either probe its Button Text key and set a real label, or hide the containing actions frame (Left actions / Right actions) via .visible = false.`);
    }
  }
}

// 7.34. Input — external TEXT label/caption instead of native property.
// Observed (Domain management build, v3.55): skill set Input's native Label
// text to "" and placed a sibling TEXT "Domain name" next to the input in a
// custom "Field" frame. Native Input spacing/text-style/label-gap are bypassed.
const inputInstances = all.filter(n =>
  n.type === "INSTANCE" && /^\*Input /.test(n.name || "")
);
for (const inp of inputInstances) {
  const props = inp.componentProperties || {};
  const labelBoolKey = Object.keys(props).find(k => /^Label/.test(k) && props[k].type === "BOOLEAN");
  if (!labelBoolKey || props[labelBoolKey].value !== true) continue;
  const inner = inp.findOne(n => n.type === "TEXT" && n.name === "Label");
  const isBlank = inner && (inner.characters === "" || inner.characters.trim() === "");
  if (!isBlank) continue;
  const parent = inp.parent;
  if (!parent || !parent.children) continue;
  const siblingTexts = parent.children.filter(s =>
    s !== inp && s.type === "TEXT" && s.visible && (s.characters || "").trim().length > 0
  );
  if (siblingTexts.length > 0) {
    const snippets = siblingTexts.map(t => JSON.stringify((t.characters || "").slice(0, 40))).join(", ");
    issues.push(`Input "${inp.name}" has native Label toggle ON but inner Label TEXT is empty, while sibling TEXT nodes [${snippets}] sit next to it in parent "${parent.name}". Write to inp.findOne(n=>n.name==="Label").characters directly — don't redesign the label as an external sibling.`);
  }
}

// 7.36. Custom TEXT in modal/drawer body — non-Geist font.
// Observed (Domain management build, v3.55): 61 TEXT nodes across 4 modals
// + 2 drawers used Inter Regular 12 because skill called figma.createText()
// without setting fontName. DS mandates Geist everywhere.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  const slot = body?.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  for (const wrap of (slot.children || [])) {
    if (!wrap.visible || wrap.type !== "FRAME") continue;
    const texts = wrap.findAll(n => n.type === "TEXT");
    const badFont = texts.filter(t => {
      const fam = t.fontName?.family;
      return fam && fam !== "Geist" && fam !== "Geist Mono";
    });
    if (badFont.length > 0) {
      const fams = [...new Set(badFont.map(t => t.fontName?.family || "?"))].join(", ");
      issues.push(`Modal/Drawer "${md.name}" body has ${badFont.length} TEXT node(s) using non-Geist font [${fams}]. All custom TEXT must be Geist (or Geist Mono for code/TXT values). Set t.fontName = {family:"Geist", style:"Regular"} before setting characters, or use a helper that imports a DS text style.`);
    }
  }
}

// 7.37. Custom TEXT in modal/drawer body — no bound text style.
// Observed: skill created TEXT with figma.createText() + .characters only,
// leaving raw fontSize/weight. DS mandates setTextStyleIdAsync everywhere.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  const slot = body?.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  for (const wrap of (slot.children || [])) {
    if (!wrap.visible || wrap.type !== "FRAME") continue;
    const texts = wrap.findAll(n => n.type === "TEXT");
    const raw = texts.filter(t => !t.textStyleId);
    if (raw.length > 0) {
      issues.push(`Modal/Drawer "${md.name}" body has ${raw.length} TEXT node(s) without a bound text style (raw fontSize/fontName). Every custom TEXT must use setTextStyleIdAsync with a DS style key (semibold/h* for headers, regular/body-m for paragraphs, medium/body-s for labels, regular/mono-m for code).`);
    }
  }
}

// 7.38. Default-text leak — visible TEXT nodes still showing component placeholders.
// Observed (Rules list build, v3.57): 30+ TEXT nodes in *Tab Basic* showed
// defaults like "Tab", "Tab_4", "Tab_5", "5", "Beta"; Table Header showed
// "Table header"; Status cells "Table cell"; Filters group buttons "Button";
// Header subheader "Title", "Subtitle". Audit 7.20 already covers some of
// these but missed the Tab/Counter/Badge family because filter was too narrow.
const DEFAULT_TEXTS = new Set([
  "Tab", "Tab_2", "Tab_3", "Tab_4", "Tab_5", "Tab_6", "Tab_7", "Tab_8", "Tab_9", "Tab_10",
  "Table header", "Table cell", "Heading", "Subheading",
  "Button", "Title", "Subtitle", "Description", "Placeholder",
  "Filled text", "Components", "Beta",
  "Label", "Caption", "Helper text",
  "Title text", "Subtitle text",
]);
{
  const allText = root.findAll(n => n.type === "TEXT");
  const defaultLeaks = [];
  for (const t of allText) {
    if (!t.visible) continue;
    // Visible-chain check
    let cur = t.parent;
    let visibleChain = true;
    while (cur && cur !== root) {
      if (cur.visible === false) { visibleChain = false; break; }
      cur = cur.parent;
    }
    if (!visibleChain) continue;
    const chars = (t.characters || "").trim();
    if (DEFAULT_TEXTS.has(chars)) {
      // Skip "5" since it's also a valid number; only flag in counter/badge contexts
      if (chars === "5" && !/Counter|Badge/.test(t.parent?.name || "")) continue;
      defaultLeaks.push({ id: t.id, text: chars, parent: t.parent?.name, container: ((cur => { let c = t.parent; let chain = []; while (c && chain.length < 4) { chain.push(c.name); c = c.parent; } return chain.join(" > "); })()) });
    }
  }
  if (defaultLeaks.length > 0) {
    const summary = defaultLeaks.slice(0, 8).map(l => `"${l.text}" in ${l.container}`).join("; ");
    issues.push(`${defaultLeaks.length} default TEXT leak(s) visible in the mockup: ${summary}${defaultLeaks.length > 8 ? `, +${defaultLeaks.length - 8} more` : ""}. Each is an unconfigured component placeholder. Either set the proper text via setProperties / inner TEXT.characters, or hide the containing item if it's an unused slot.`);
  }
}

// 7.39. Duplicate visible labels in same container — likely regex-fallback bug.
// Observed (Rules list build, v3.57): two visible "Export" buttons in Top
// Toolbar because skill renamed "Button" → "Export" via a regex match that
// hit two slots. Audit 7.30 only checks button-vs-filter; this one checks
// button-vs-button (and filter-vs-filter) within one toolbar/header/footer.
{
  const containers = root.findAll(n =>
    n.type === "INSTANCE" && (
      /Top Toolbar/i.test(n.name) ||
      /Header/i.test(n.name) ||
      /\/ Footer/i.test(n.name) ||
      n.mainComponent?.parent?.name === "*Header*"
    )
  );
  for (const ctr of containers) {
    // Skip the container itself if any of its ancestors are hidden — fixes
    // a v3.58 false positive where a hidden inner Top Toolbar was matched
    // by findAll and its (already-not-rendered) buttons were flagged.
    let pchk = ctr;
    let containerInVisibleChain = true;
    while (pchk && pchk !== root) {
      if (pchk.visible === false) { containerInVisibleChain = false; break; }
      pchk = pchk.parent;
    }
    if (!containerInVisibleChain) continue;
    const visBtns = ctr.findAll(n => {
      if (!(n.type === "INSTANCE" && n.name === "*Button*")) return false;
      let cur = n;
      while (cur && cur !== root) { if (cur.visible === false) return false; cur = cur.parent; }
      return true;
    });
    const labels = visBtns.map(b => b.findOne(x => x.type === "TEXT" && x.name === "Button")?.characters).filter(Boolean);
    const counts = {};
    for (const l of labels) counts[l] = (counts[l] || 0) + 1;
    const dups = Object.entries(counts).filter(([, c]) => c > 1);
    for (const [l, c] of dups) {
      // Skip generic 1-char icon-only labels
      if (l.length <= 2) continue;
      issues.push(`Container "${ctr.name}" has ${c} visible *Button* instances with identical label "${l}". Likely a regex-fallback bug: the skill renamed the same property pattern on multiple buttons. Probe each button individually instead.`);
    }
  }
}

// 7.40. Sidebar — no active item highlighted for the current page.
// Observed (Rules list build, v3.57): sidebar variant Type=Transactions
// monitoring was set, but no nav item inside had Selected/Active state, so
// the page indicator was missing.
{
  const sidebars = root.findAll(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Sidebar*");
  for (const sb of sidebars) {
    const selectedNodes = sb.findAll(n => /selected/i.test(n.name) || /\.selected/i.test(n.name) || /active/i.test(n.name));
    const visSelected = selectedNodes.filter(n => {
      let cur = n;
      while (cur && cur !== root) { if (cur.visible === false) return false; cur = cur.parent; }
      return n.visible !== false;
    });
    // Also probe for nav-item instances whose Selected variant is "true" / "Yes"
    const navItems = sb.findAll(n => n.type === "INSTANCE" && n.componentProperties?.["Selected"]);
    const selectedItems = navItems.filter(n => {
      const v = n.componentProperties?.["Selected"]?.value;
      return v === "true" || v === "True" || v === "Yes" || v === true;
    });
    // v3.165: many Sidebar variants mark the active page via a State=Active
    // VARIANT (componentProperties["State"]="Active" / mainComponent name
    // contains "State=Active"), not a Selected boolean. Recognize it —
    // this was a recurring FP triaged in nearly every sim.
    const stateActiveItems = sb.findAll(n => {
      if (n.type !== "INSTANCE") return false;
      try {
        const sv = n.componentProperties?.["State"]?.value;
        if (typeof sv === "string" && /active/i.test(sv)) return true;
        return /State=Active/i.test(n.mainComponent?.name || "");
      } catch (e) { return false; }
    }).filter(n => { let c = n; while (c && c !== root) { if (c.visible === false) return false; c = c.parent; } return true; });
    if (visSelected.length === 0 && selectedItems.length === 0 && stateActiveItems.length === 0) {
      // Soft warning: not all Sidebar variants expose a Selected property
      // (e.g. Type=Billing variant has no per-page active state via Plugin
      // API). Flag as warning, not hard fail — the skill should still try
      // to set the active item if any nav-item instance HAS a Selected
      // property; otherwise note this as a known limitation.
      if (navItems.length === 0) {
        issues.push(`Sidebar "${sb.name}" — no nav-item instance exposes a Selected property in this variant. Active-page highlight isn't achievable via Plugin API for this Sidebar configuration. Note as known limitation in build log; do NOT claim "variant Type=X inherently activates the X nav item" — that's wrong, the variant only selects the section, not the active page.`);
      } else {
        issues.push(`Sidebar "${sb.name}" has ${navItems.length} nav-item instance(s) with Selected property but none is set to true. Set the matching nav-item's Selected variant to "true" for the current page.`);
      }
    }
  }
}

// 7.41. Header CTA verification — if Buttons enabled, at least one visible
// button must have a non-default label. Observed: "Buttons#6943:21 = true"
// and "First Button = true" in build log, but the labeled CTA button was
// sitting inside a hidden Back-button slot, so no CTA actually rendered.
{
  const headers = root.findAll(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Header*");
  for (const h of headers) {
    const props = h.componentProperties || {};
    const buttonsOn = Object.keys(props).find(k => /^Buttons/.test(k) && props[k].type === "BOOLEAN" && props[k].value === true);
    if (!buttonsOn) continue;
    const visBtns = h.findAll(n => {
      if (!(n.type === "INSTANCE" && n.name === "*Button*")) return false;
      let cur = n;
      while (cur && cur !== root) { if (cur.visible === false) return false; cur = cur.parent; }
      return true;
    });
    const labels = visBtns.map(b => b.findOne(x => x.type === "TEXT" && x.name === "Button")?.characters || "").filter(Boolean);
    const meaningful = labels.filter(l => l !== "Button" && l !== "Title" && l.length > 0);
    if (visBtns.length > 0 && meaningful.length === 0) {
      issues.push(`Header "${h.name}" has Buttons enabled but no visible button has a meaningful label (only defaults / empty). The intended CTA likely landed in a hidden slot. Probe header.findAll for visible *Button* instances and set the label on a real one (e.g. the first non-icon button in the right-side actions area).`);
    }
  }
}

// 7.43. Table cell text overflow — text wider than its containing cell.
// Observed (Rules list build, v3.59): Row 7 col 1 text "Velocity threshold —
// 30 day rolling" was 224px wide in a 193px cell; Row 8 col 1 text
// "Sanctions screening bypass detection" was 244px in 193px. Visual overflow
// because TEXT had textAutoResize=WIDTH_AND_HEIGHT and parent "Text + button"
// frame was HUG, both growing past the cell's bounded width.
{
  const tables = root.findAll(n => n.type === "INSTANCE" && /Table Starter/i.test(n.name));
  for (const tbl of tables) {
    const rows = (tbl.children || []).filter(c => c.name === "Table Row" && c.visible);
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const cells = row.children?.[0]?.children || [];
      for (let ci = 0; ci < cells.length; ci++) {
        const cell = cells[ci];
        if (!cell || !cell.visible) continue;
        // visible-chain check (use root, not container, to respect hidden grand-parents)
        let cur = cell;
        let visChain = true;
        while (cur && cur !== root) {
          if (cur.visible === false) { visChain = false; break; }
          cur = cur.parent;
        }
        if (!visChain) continue;
        const cellW = cell.width || 0;
        // Find any TEXT inside that overflows cell width (account for typical 12px padding each side)
        const texts = cell.findAll(n => n.type === "TEXT" && n.visible && (n.characters || "").length > 0);
        for (const t of texts) {
          // Skip texts inside a hidden sub-instance (visible-chain to cell)
          let p = t.parent;
          let inVis = true;
          while (p && p !== cell) { if (p.visible === false) { inVis = false; break; } p = p.parent; }
          if (!inVis) continue;
          // Allow some slack — only flag if text is meaningfully wider than cell
          if (t.width > cellW - 12 && t.textTruncation !== "ENDING") {
            issues.push(`Table cell row ${ri + 1} col ${ci} ("${(t.characters || "").slice(0, 40)}") — text width ${Math.round(t.width)}px exceeds cell width ${Math.round(cellW)}px and truncation is OFF. Apply the truncation chain: walk up the immediate "Text + button" / wrapper FRAME and set its layoutSizingHorizontal = "FILL"; on the TEXT node set textAutoResize = "HEIGHT", layoutSizingHorizontal = "FILL", textTruncation = "ENDING".`);
          }
        }
      }
    }
  }
}

// 7.45. Canonical-match check — frame dimensions, fill, instance heights
// must match a canonical reference within 2px tolerance.
//
// Observed (KYB WebSDK build, v3.71): skill captured canonical heights
// (698/706/800/824/856/1036/1712) in Phase 2, then built with hardcoded
// defaults (1046/1100/1300 universal) in Phase 6. Used #F6F7F9 bg even
// though every canonical KYB frame uses #FFFFFF. Result: 8 of 11 frame
// heights wrong, 9 of 11 Window heights wrong, 11 of 11 backgrounds wrong.
//
// The audit script can't verify against an external canonical without a
// canonical map provided in productContext. So the script enforces:
//
// (a) If productContext.canonicalMap exists, every built screen must
//     have an entry, and frame/window dimensions must match within 2px.
// (b) If productContext.canonicalMap is missing for a "matchable" build
//     (any build referencing pattern docs or canonical files), fail with
//     an explicit "no canonical map provided" message — skill must build
//     one from inspection before proceeding.
//
// Skill is responsible for populating productContext.canonicalMap during
// Phase 2 (canonical inspection). Phase 6 build reads from the map.
{
  const cm = (typeof productContext === "object" && productContext) ? productContext.canonicalMap : null;
  if (cm && Array.isArray(cm)) {
    // Each canonicalMap entry: { screenLabel, frameW, frameH, frameBg, componentVariant, componentX, componentY, componentW, componentH }
    const builtScreens = root.children?.filter(c => c.type === "FRAME") || [];
    for (const built of builtScreens) {
      const entry = cm.find(e => built.name === e.screenLabel || built.name.includes(e.screenLabel));
      if (!entry) {
        issues.push(`7.45 canonical-match: built frame "${built.name}" has no canonical map entry. Either remove the frame or add it to productContext.canonicalMap from inspected canonical.`);
        continue;
      }
      // Frame dimensions
      if (Math.abs(built.width - entry.frameW) > 2) {
        issues.push(`7.45 canonical-match: frame "${built.name}" width ${Math.round(built.width)} ≠ canonical ${entry.frameW} (>2px tolerance).`);
      }
      if (Math.abs(built.height - entry.frameH) > 2) {
        issues.push(`7.45 canonical-match: frame "${built.name}" height ${Math.round(built.height)} ≠ canonical ${entry.frameH} (>2px tolerance). Skill likely used a "universal" hardcoded height instead of the canonical per-screen height.`);
      }
      // Frame fill
      if (entry.frameBg) {
        const fill = built.fills?.[0];
        const expected = entry.frameBg.replace("#", "").toLowerCase();
        const actual = fill?.type === "SOLID" ?
          [Math.round(fill.color.r*255), Math.round(fill.color.g*255), Math.round(fill.color.b*255)]
            .map(v => v.toString(16).padStart(2,"0")).join("").toLowerCase()
          : null;
        if (actual !== expected) {
          issues.push(`7.45 canonical-match: frame "${built.name}" bg fill #${actual} ≠ canonical #${expected}. Cross-product contamination is a recurring bug (KYC #F6F7F9 used for KYB which should be #FFFFFF, or vice versa).`);
        }
      }
      // Component instance match
      if (entry.componentVariant) {
        const inst = built.findOne(n => n.type === "INSTANCE");
        if (!inst) {
          issues.push(`7.45 canonical-match: frame "${built.name}" has no INSTANCE child but canonical specifies "${entry.componentVariant}".`);
        } else {
          const variantName = inst.mainComponent?.name;
          if (variantName !== entry.componentVariant && !variantName?.includes(entry.componentVariant)) {
            issues.push(`7.45 canonical-match: frame "${built.name}" instance variant "${variantName}" ≠ canonical "${entry.componentVariant}".`);
          }
          if (typeof entry.componentX === "number" && Math.abs(inst.x - entry.componentX) > 2) {
            issues.push(`7.45 canonical-match: frame "${built.name}" instance x=${Math.round(inst.x)} ≠ canonical ${entry.componentX}.`);
          }
          if (typeof entry.componentY === "number" && Math.abs(inst.y - entry.componentY) > 2) {
            issues.push(`7.45 canonical-match: frame "${built.name}" instance y=${Math.round(inst.y)} ≠ canonical ${entry.componentY}.`);
          }
          if (typeof entry.componentW === "number" && Math.abs(inst.width - entry.componentW) > 2) {
            issues.push(`7.45 canonical-match: frame "${built.name}" instance width=${Math.round(inst.width)} ≠ canonical ${entry.componentW}.`);
          }
          if (typeof entry.componentH === "number" && Math.abs(inst.height - entry.componentH) > 2) {
            issues.push(`7.45 canonical-match: frame "${built.name}" instance height=${Math.round(inst.height)} ≠ canonical ${entry.componentH}. Common cause: skill used the variant's intrinsic height instead of resizing to canonical height. After createInstance(), call instance.resize(canonical.componentW, canonical.componentH).`);
          }
        }
      }
    }
  } else if (typeof productContext === "object" && productContext && productContext.requiresCanonical === true) {
    issues.push(`7.45 canonical-match: productContext.requiresCanonical is true but no canonicalMap was provided. During Phase 2 (canonical inspection), build a canonicalMap with one entry per screen { screenLabel, frameW, frameH, frameBg, componentVariant, componentX, componentY, componentW, componentH }. Phase 6 build must read from this map, not invent "reasonable defaults".`);
  }
}

// 7.46. Applicant page — banned *Sidebar* instance (v3.122).
// Modern AP layout has NO collapsed Sidebar slot. v3.118 removed the slot
// from layout-patterns.md and applicant-page-pattern.md, v3.121 retry sim
// still imported `*Sidebar*` Type=Applicants Collapsed=True at x=0 anyway
// because the deprecated section was "soft block". v3.122 hard-bans the
// INSTANCE at audit level: any *Sidebar* INSTANCE child directly under an
// AP root frame → FAIL.
{
  const apRoots = page.findAll(n => n.type === "FRAME" && /applicant/i.test(n.name));
  for (const root of apRoots) {
    if (!root.children) continue;
    for (const child of root.children) {
      try {
        if (child.type === "INSTANCE" && /\*Sidebar\*/.test(child.mainComponent?.name || "")) {
          issues.push(`7.46 banned-sidebar-on-AP: frame "${root.name}" contains *Sidebar* INSTANCE. Modern AP layout has NO 52px sidebar slot (canonical 'Di7nvHaOxXiWuDAN1oa0hK/17501:30301' has none, all post-v3.78 AP files match). Remove the *Sidebar* instance, position Header full-bleed at x=0 width 1440, Summary at x=0, Body at x=Summary.width. Layout math: 0 + Summary.width + Body.width = 1440. See applicant-page-pattern.md.`);
        }
      } catch(e) { /* skip child if mainComponent inaccessible */ }
    }
  }
}

// 7.49. Pattern C / Pattern 3 editor pages — banned 257 expanded Sidebar (v3.131).
// When a build includes a Pattern-C / Pattern-3 specific header organism (Blueprint
// header `304aa0d104cb87315bf1a6578681b6b266bc70ee`, or TM Rules / header
// file-local), the Sidebar MUST be the COLLAPSED 52-wide variant, not the
// 257-wide expanded variant. Mixing Pattern A sidebar (257) with Pattern C
// header creates a Frankenstein layout that doesn't match canonical anywhere.
//
// Observed sim 2026-05-14 v3.130 (CM Blueprint editor): agent imported
// `*Sidebar* Type=Case management, Collapsed=False, w=257` plus Blueprint header
// at x=257 width 1183. Canonical Blueprint header is exclusively at
// x=52 width 1388 OR x=0 width 1440. Never x=257 width 1183.
const editorHeaderKeys = new Set([
  "304aa0d104cb87315bf1a6578681b6b266bc70ee",  // CM Blueprint header
  "04cd3e499850f1bb02c988f565948833c2474046",  // KYB Levels Headers (v3.134)
  // Add other editor-page header keys as observed (TM Rule editor, Workflow Builder, etc.)
]);
for (const node of all) {
  if (node.type !== "INSTANCE" || !node.mainComponent) continue;
  const mainKey = node.mainComponent.key;
  if (!editorHeaderKeys.has(mainKey)) continue;
  // Found an editor-page header. Search the same root for a *Sidebar* INSTANCE.
  let rootFrame = node;
  while (rootFrame.parent && rootFrame.parent.type !== "PAGE" && rootFrame.parent.type !== "SECTION") {
    rootFrame = rootFrame.parent;
  }
  if (!rootFrame.children) continue;
  for (const child of rootFrame.children) {
    try {
      if (child.type === "INSTANCE" && /\*Sidebar\*/.test(child.mainComponent?.name || "")) {
        // Detect if it's the 257-expanded variant
        if (child.width >= 200) {
          issues.push(`7.49 pattern-c-editor-needs-collapsed-sidebar: frame "${rootFrame.name}" has Pattern-C editor header ("${node.mainComponent.name}") but uses EXPANDED Sidebar (w=${Math.round(child.width)}). Pattern C / Pattern 3 require COLLAPSED 52-wide Sidebar. Re-import sidebar with variant Collapsed=True, set width 52. Position Blueprint header at x=52 width 1388 (NOT x=257 width 1183). See case-management-pattern.md Pattern C / tm-layout-patterns.md Pattern 3.`);
        }
      }
    } catch(e) { /* skip */ }
  }
}

// 7.47. Root must contain ALL children — auto-expand root height (v3.126).
// Observed sim 2026-05-13: agent built AP root at 1440x900 default, placed
// Body instance of height 13744 inside. Root didn't auto-expand → content
// clipped. audit_verdict was PASS because section-contains-root (7.51)
// only checks section bbox vs root bbox, not root vs children.
// After building, every child's (y + height) must be ≤ root.height. If a
// child overflows root → root.resize(root.width, max(childY + childH))
// for all visible children.
{
  const allFrames = page.findAll(n => n.type === "FRAME" && (n.name.includes("(made by Claude)") || /\(by Claude\)/.test(n.name)));
  for (const root of allFrames) {
    if (!root.children) continue;
    let maxChildBottom = 0;
    for (const child of root.children) {
      if (child.visible === false) continue;
      const bottom = (child.y || 0) + (child.height || 0);
      if (bottom > maxChildBottom) maxChildBottom = bottom;
    }
    if (maxChildBottom > root.height + 2) {
      issues.push(`7.47 root-height-contains-children: frame "${root.name}" height=${Math.round(root.height)} but children extend to y=${Math.round(maxChildBottom)}. Content is clipped. After placing all children, run: root.resize(root.width, ${Math.round(maxChildBottom)}). Also verify root.clipsContent is false if you want visible scroll/overflow.`);
    }
  }
}

// 7.52. Custom Title Row antipattern — page title belongs in Header (v3.140).
// Observed Billing Invoices sim 2026-05-19: agent created custom "Title Row"
// FRAME inside Content with TEXT "Invoices" (body-m style, not heading) +
// sibling *Button*. Audit 1 didn't catch — text style wasn't a heading.
// v3.140: name-based check catches this antipattern regardless of text style.
for (const f of all) {
  if (f.type !== "FRAME") continue;
  if (isInsideInstance(f)) continue;
  const nameMatchesTitleRow = /^(title row|title stack|header row|page title)$/i.test(f.name);
  if (!nameMatchesTitleRow) continue;
  // Check if this frame contains a TEXT + sibling INSTANCE (typical title+CTA pattern)
  const hasText = (f.children || []).some(c => c.type === "TEXT" && (c.characters || "").length > 0 && (c.characters || "").length <= 60);
  const hasButton = (f.children || []).some(c => c.type === "INSTANCE" && /\*Button\*/.test(c.mainComponent?.name || ""));
  if (hasText) {
    const buttonNote = hasButton ? " + *Button*" : "";
    issues.push(`7.52 custom-title-row: Frame "${f.name}" contains page-title TEXT${buttonNote}. Move title to Header instance via setProperties({"Title text#3817:0": "..."}). Move CTA via Header's "Buttons#6943:21": true + "↪ First Button#6943:8": true. Delete this custom frame. See layout-patterns.md Pattern 1 (v3.140 deprecated Title Row in Content).`);
  }
}

// 7.53. Auto-layout overflow — children y+height > parent height (v3.140).
// Observed Billing Invoices sim 2026-05-19: agent created Title Row 10h with
// TEXT 24h at y=-7 (overflows above) and Button 32h at y=-11. Filters 10h
// with Input Basic 60h. Frame was FIXED-sized too small; children overflow
// with negative Y. Indicates primaryAxisSizingMode should have been AUTO/HUG.
for (const f of all) {
  if (f.type !== "FRAME") continue;
  if (isInsideInstance(f)) continue;
  if (!f.layoutMode || f.layoutMode === "NONE") continue;
  if (f.primaryAxisSizingMode !== "FIXED") continue;
  if (!f.children || f.children.length === 0) continue;
  // For VERTICAL layout: measure max(child.y + child.height) vs f.height
  // For HORIZONTAL layout: measure max(child.x + child.width) vs f.width
  // But for both, also check if children have NEGATIVE position (extends above/left)
  let overflow = 0, negOffset = 0;
  for (const c of f.children) {
    if (c.visible === false) continue;
    const cBottom = (c.y || 0) + (c.height || 0);
    const cRight = (c.x || 0) + (c.width || 0);
    if (f.layoutMode === "VERTICAL") {
      overflow = Math.max(overflow, cBottom - f.height);
      negOffset = Math.min(negOffset, c.y || 0);
    } else if (f.layoutMode === "HORIZONTAL") {
      overflow = Math.max(overflow, cRight - f.width);
      negOffset = Math.min(negOffset, c.x || 0);
    }
  }
  if (overflow > 2 || negOffset < -2) {
    const axis = f.layoutMode === "VERTICAL" ? "height" : "width";
    issues.push(`7.53 auto-layout-overflow: Frame "${f.name}" ${axis}=${Math.round(f.layoutMode === "VERTICAL" ? f.height : f.width)} but children overflow by ${Math.round(overflow)}px (and/or negOffset ${Math.round(negOffset)}). Set primaryAxisSizingMode="AUTO" so frame hugs children, OR resize frame to fit content. Negative child offset indicates parent was created too small.`);
  }
}

// 7.54. Custom checkbox/radio/toggle imitation (v3.143).
// Observed Billing Invoices sim 2026-05-20: agent created "Checkbox Plate"
// — a 16×16 blue rectangle with rounded corners — next to TEXT "Save card
// for future payments". The same build used real *Checkbox* DS instance in
// Table Header. Selective fabrication: knows the component, uses it in one
// place, fabricates imitation in another.
const formControlKeywordRe = /save (card|for|my)|agree|confirm|enable|allow|accept|opt[- ]?in|terms|consent|i (read|understand|accept|agree)|future payments|notifications|emails/i;
for (const node of all) {
  if (node.type !== "RECTANGLE" && node.type !== "FRAME") continue;
  if (isInsideInstance(node)) continue;
  // Suspect dimensions: ~14-22px square with cornerRadius > 0
  const w = Math.round(node.width || 0);
  const h = Math.round(node.height || 0);
  if (w < 12 || w > 24 || h < 12 || h > 24) continue;
  const radius = node.cornerRadius || node.topLeftRadius || 0;
  if (typeof radius !== "number" || radius <= 0) continue;
  // Check for adjacent TEXT sibling with form-control keyword
  const parent = node.parent;
  if (!parent || !parent.children) continue;
  const siblings = parent.children;
  const adjacentText = siblings.find(s => s.type === "TEXT" && (s.characters || "").length > 0 && formControlKeywordRe.test(s.characters));
  if (adjacentText) {
    issues.push(`7.54 custom-checkbox-imitation: ${node.type} "${node.name}" (${w}×${h}, radius=${radius}) next to TEXT "${(adjacentText.characters || "").slice(0, 50)}". Likely custom checkbox imitation — replace with *Checkbox* INSTANCE (key 75d3375164e69aca223d08d09fd79e82dda14343), *Radiobutton* (7d3fe5b1e904f4e4a880092412543f40fdeacc60), or *Toggle* (99562b687e3078c4a570af195c74a899fbbe83a4) as appropriate.`);
  }
}

return JSON.stringify({ issues, info: infos }, null, 2);