// ===== AUDIT SEGMENT 1/3 (checks 1 → before 7.31) =====
// Run via use_figma: set ROOT_ID_HERE + productContext (top), run, collect {issues, info}.
// After all 3 segments: concatenate issues + info, then audit-PASS iff total issues==0.
// Each segment is self-contained (<50KB, comments intact — NO stripping needed).
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

// 1. Title Row antipattern — page title MUST be in Header's Title text property.
// Detect by SUBSTANCE, not by frame name (skill has been caught renaming "Title
// Row" → "Actions Row" to bypass a name-based check). A page title is:
//   TEXT node outside any component INSTANCE, with a heading-level text style
//   (semibold/h2-3xl, h3-2xl, h4-xl, or bold/*), typically inside Content.
const headingStyleRe = /^(semibold|bold)\/(h[0-9]-\w+)/i;
async function getStyleName(textNode) {
  try {
    const styleId = textNode.textStyleId;
    if (!styleId || typeof styleId !== "string") return null;
    const style = await figma.getStyleByIdAsync(styleId);
    return style?.name || null;
  } catch(e) { return null; }
}
const titleSuspects = [];
for (const t of all) {
  if (t.type !== "TEXT") continue;
  if (isInsideInstance(t)) continue;  // Header's own title is fine
  const styleName = await getStyleName(t);
  if (!styleName || !headingStyleRe.test(styleName)) continue;
  // Skip TEXT nodes that are inside a SECTION directly (section title, allowed)
  let p = t.parent, insideSection = false;
  while (p && p !== root) {
    if (p.type === "SECTION") { insideSection = true; break; }
    p = p.parent;
  }
  if (insideSection && t.parent?.type === "SECTION") continue;
  titleSuspects.push({ text: t.characters?.slice(0, 60), style: styleName, parent: t.parent?.name });
}
if (titleSuspects.length) {
  issues.push(`${titleSuspects.length} heading-level TEXT node(s) outside *Header*. Page title must live in *Header* 'Title text#3817:0'. Renaming the wrapping frame does NOT fix this — delete the text and set the Header property instead. Samples: ${titleSuspects.slice(0, 3).map(s => `"${s.text}" (${s.style}) in "${s.parent}"`).join(" | ")}`);
}

// 2. Placeholder text in *Header* properties
const placeholderPhrases = [
  "Life was like a box of chocolates",
  "Hey, what's up, dude",
  "Hi, I'm sabtitle",
  "Page title",        // default header title
  "Label",              // default input label
  "Placeholder",        // default field placeholder
  "Filled text",        // default field filled
  "Caption text",
  "Text in cell",
  "Tab_1", "Tab_2", "Tab_3",
];
const headerInst = root.findOne(n =>
  n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Header*"
);
if (headerInst) {
  for (const [key, val] of Object.entries(headerInst.componentProperties)) {
    if (val.type !== "TEXT") continue;
    if (placeholderPhrases.some(p => val.value?.includes(p))) {
      issues.push(`Header property '${key}' still has placeholder: "${val.value}"`);
    }
  }
}

// 3. Double-tabs — *Tab Basic* outside Header when Header.Subheader=Tabs
// v3.127: only count VISIBLE Subheader=Tabs inside Header (hidden sub-instances
// exist in some Header variants like TM Pattern 4 Header/Finance and don't render).
if (headerInst) {
  const headerHasVisibleTabs = !!headerInst.findOne(n => {
    if (n.type !== "INSTANCE") return false;
    if (!/Type=Tabs/.test(n.mainComponent?.name || "")) return false;
    // walk up to root checking visibility — if any ancestor is hidden, this sub-instance doesn't render
    let cur = n;
    while (cur && cur !== headerInst) {
      if (cur.visible === false) return false;
      cur = cur.parent;
    }
    return true;
  });
  const standaloneTabs = all.filter(n =>
    n.type === "INSTANCE" && n.name === "*Tab Basic*" && n.visible !== false &&
    !headerInst.findAll(x => x === n).length
  );
  if (headerHasVisibleTabs && standaloneTabs.length) {
    issues.push(`Double tabs: Header has VISIBLE Subheader=Tabs AND ${standaloneTabs.length} standalone *Tab Basic* below — keep only one`);
  }
}

// 4. Sidebar variant — match against task context. We can infer the expected
// Type from the Header's Title text or the screen name.
const sidebar = root.findOne(n =>
  n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Sidebar*"
);
const infos = [];
if (sidebar) {
  const variantName = sidebar.mainComponent.name;
  const typeMatch = variantName.match(/Type=([^,]+)/);
  const sidebarType = typeMatch ? typeMatch[1].trim() : null;

  // Gather hints about page context: Header title + screen name
  const hdr = root.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Header*");
  const hdrTitle = hdr?.componentProperties?.["Title text#3817:0"]?.value || "";
  const ctx = (hdrTitle + " " + root.name).toLowerCase();

  // Map keywords → expected Sidebar Type variant
  const sidebarMap = [
    { kw: /applicant/,                       expected: "Applicants" },
    { kw: /integration|workflow|flow builder/, expected: "Integrations" },
    { kw: /transaction|travel rule|vasp/,    expected: "Transaction monitoring" },
    { kw: /aml|screening/,                   expected: "AML screening" },
    { kw: /case management|case /,            expected: "Case management" },
    { kw: /client list/,                     expected: "Client lists" },
    { kw: /statistic|report/,                expected: "Statistics" },
    { kw: /billing/,                         expected: "Billing" },
    { kw: /setting|domain|sso|translation|customization|sdk translation/, expected: "Settings" },
    { kw: /dev ?space/,                      expected: "Dev space" },
    { kw: /task/,                             expected: "Tasks" },
    { kw: /admin/,                            expected: "Admin" },
  ];
  let expected = null;
  for (const m of sidebarMap) if (m.kw.test(ctx)) { expected = m.expected; break; }

  if (expected && sidebarType && sidebarType !== expected) {
    issues.push(`Sidebar variant is "Type=${sidebarType}", but the page context (title "${hdrTitle}") suggests "Type=${expected}". Rebind: sidebarSet.children.find(v => v.name.includes("Type=${expected}") && v.name.includes("Collapsed=False")).createInstance().`);
  } else {
    infos.push(`[info] Sidebar variant: "${variantName}"${expected ? ` (expected Type=${expected} — matches)` : " (no context-based expectation)"}`);
  }
}

// 5. Overflow — any node extending beyond its parent's bounds
// Skip everything inside component instances: DS owns its internals.
// SECTION nodes don't have clipsContent property — skip as parent.
for (const n of all) {
  if (n.type === "PAGE" || !n.parent) continue;
  if (isInsideInstance(n)) continue;
  const p = n.parent;
  if (p.type === "SECTION") continue;
  if (!("width" in p) || !("clipsContent" in p) || p.clipsContent === false) continue;
  if (n.x + n.width > p.width + 0.5) issues.push(`Overflow right: ${n.name} in ${p.name}`);
  if (n.y + n.height > p.height + 0.5) issues.push(`Overflow bottom: ${n.name} in ${p.name}`);
}

// 6. Component-vs-FRAME ratio (custom frames that could have been DS components).
// Count only top-level frames — component internals don't count toward "invented structure".
const topLevelNodes = all.filter(n => !isInsideInstance(n));
const totalStructural = topLevelNodes.filter(n => n.type === "FRAME" || n.type === "INSTANCE").length;
const customFrames = topLevelNodes.filter(n =>
  n.type === "FRAME" && !["Main","Content","Item List","row"].includes(n.name)
).length;
const customRatio = totalStructural > 0 ? customFrames / totalStructural : 0;
if (customRatio > 0.5 && totalStructural > 10) {
  issues.push(`Custom FRAME ratio ${(customRatio*100).toFixed(0)}% > 50% — likely invented structure instead of using DS components`);
}

// 7. Unbound spacing / cornerRadius / fills on YOUR custom frames.
// Skip anything inside a component instance — DS owns its own tokens.
// Skip only "Main" (the outer column under Header that has no padding
// and no fill by design). "Content" is checked — it SHOULD have bound
// paddings per Rule 7.8.
for (const n of all) {
  if (n.type !== "FRAME") continue;
  if (isInsideInstance(n)) continue;
  if (n.name === "Main") continue;
  if (n.cornerRadius > 0 && !n.boundVariables?.topLeftRadius) {
    issues.push(`Unbound cornerRadius on ${n.name}: ${n.cornerRadius}px`);
  }
  if (n.fills?.[0]?.type === "SOLID" && !n.fills[0].boundVariables?.color) {
    issues.push(`Hardcoded fill on ${n.name}`);
  }
}

// 7.05. Content frame background — Rule #6. Content MUST be white.
// If Content has no fill, the root subtlest-grey shows through and the page
// looks fully grey. Covers all patterns including TM Pattern 4 where the
// content frames are named Body / Columns / Main column / Right panel.
//
// Covered names:
//   "Content", "Page Content", "BG Content"  — standard list pages
//   "Body"                                    — TM Pattern 4, detail pages
//   "Main column", "Columns"                  — TM Pattern 4 column layout
//   "Right panel"                             — TM Pattern 4 right column
//   "Container"                               — Case page left wrapper
const contentFrames = all.filter(n =>
  n.type === "FRAME" && !isInsideInstance(n) &&
  /^(Content|BG Content|Page Content|Body|Main column|Columns|Right panel|Container)$/i.test(n.name)
);
for (const cf of contentFrames) {
  const fill = cf.fills?.[0];
  if (!fill || fill.visible === false) {
    issues.push(`Content frame "${cf.name}" has no fill — set it to semantic/background/neutral/inverse/normal (white). Otherwise page looks grey.`);
    continue;
  }
  if (fill.type !== "SOLID") continue;
  const isWhite = fill.color.r > 0.98 && fill.color.g > 0.98 && fill.color.b > 0.98;
  const boundVarId = cf.boundVariables?.fills?.[0]?.id;
  let boundName = "";
  if (boundVarId) {
    try { boundName = figma.variables.getVariableById(boundVarId)?.name || ""; } catch(e) {}
  }
  if (!isWhite) {
    issues.push(`Content frame "${cf.name}" is not white (fill hex approx non-white) — bind to semantic/background/neutral/inverse/normal`);
  } else if (boundName && /subtlest|subtler|subtle/.test(boundName)) {
    issues.push(`Content frame "${cf.name}" bound to "${boundName}" (grey variant) — should be inverse/normal (white)`);
  }
}

// 7.1. Default component-property placeholder text — check only VISIBLE nodes.
// Components like *Filters group* ship with many HIDDEN spare slots (unused
// filter types) that keep their "Label" default — those are not bugs. Only
// visible placeholders matter. Rule #7 (fill realistic data) applies to
// what the user sees on canvas.
//
// v3.129: added Sumsub-DS-specific placeholder defaults observed in production
// organisms (Header / Sidebar / Page Header organisms ship with these literal
// strings as their default TEXT for client/org name slots — must be overridden
// when delivering a real mockup):
//   - "Key_name" (Sidebar logo / org-name area)
//   - "Key name" (Header subtitle / breadcrumb default)
//   - "ClientNickname" (AP header client-name placeholder)
//   - "Client name" (generic client-name placeholder)
//   - "Organization", "Org_name", "Org name" — variations
const defaultTexts = [
  "Label", "Placeholder", "Button", "Text in cell", "Table cell",
  "Subheader text", "Caption text", "Page title",
  "Key_name", "Key name", "ClientNickname", "Client name",
  "Organization", "Org_name", "Org name",
  // v3.130: Sumsub Radiobutton / Checkbox component defaults observed on
  // Rule editor sim 2026-05-14 — radio labels left at "Radio button" string.
  "Radio button", "Radiobutton",
  "Checkbox", "Check box",
  // v3.135: Base *Collapsible Card* ships with "Card content" placeholder
  // in its Content slot when expanded. Observed KYB Level editor sim 2026-05-18:
  // agent expanded 2 cards but left default "Card content" placeholder visible.
  // Audit reported PASS — false positive. Now caught by Mode A.
  "Card content",
];
// Default phrases that appear as substrings in component texts (Alert, Toast,
// Header, Modal, Drawer). These are THE Dirty-Harry-quote filler copy and
// similar, shipped as component defaults. If you see them in a delivered
// mockup, the component wasn't customized.
const defaultPhrases = [
  "Life was like a box of chocolates",
  "Hey, what's up, dude",
  "Hi, I'm sabtitle",
  "It's modal basic",
  "You've got to ask yourself one question",
  "Do I feel lucky",
  "Well, do you, punk",
  "You're gonna need a bigger boat",
  "I'll be back",
  "May the Force be with you",
];
const defaultTextCounts = {};
const defaultPhraseHits = {};
// v3.142: Table cell multi-variant context — Table Row / Cell instances
// have multiple TEXT children for different Type variants (Text Regular,
// Status, Date+time, etc.). Type variant selects which is visually rendered,
// but `.visible` stays true on inactive variants. Audit can't distinguish
// active vs inactive variant TEXTs without inspecting variant property
// mechanics. Skip Mode A default-text check when TEXT is inside such cell.
function isInTableCellVariantContext(textNode) {
  let p = textNode.parent;
  let depth = 0;
  while (p && depth < 10) {
    if (p.type === "INSTANCE" && p.mainComponent) {
      const mainName = (p.mainComponent.name || "") + " | " + (p.mainComponent.parent?.name || "");
      if (/Table Row|Row Cell|Table cell|Table Starter|Cell$/i.test(mainName)) {
        try {
          const props = p.componentProperties || {};
          const hasTypeVariant = Object.keys(props).some(k => /^Type/i.test(k));
          if (hasTypeVariant) return true;
        } catch (e) {}
      }
    }
    p = p.parent;
    depth++;
  }
  return false;
}
for (const n of all) {
  if (n.type !== "TEXT") continue;
  if (!n.characters) continue;
  if (!isVisible(n)) continue; // skip hidden component slots
  // Exact match (default property values like "Label", "Button")
  if (defaultTexts.includes(n.characters)) {
    // v3.142: skip if TEXT is inside Table cell multi-variant context
    if (isInTableCellVariantContext(n)) continue;
    defaultTextCounts[n.characters] = (defaultTextCounts[n.characters] || 0) + 1;
  }
  // Substring match (Dirty-Harry-style component filler copy)
  for (const phrase of defaultPhrases) {
    if (n.characters.includes(phrase)) {
      defaultPhraseHits[phrase] = (defaultPhraseHits[phrase] || 0) + 1;
      break;
    }
  }
}
for (const [txt, count] of Object.entries(defaultTextCounts)) {
  issues.push(`${count} VISIBLE TEXT node(s) with default value "${txt}" — Rule #7: set real content via setProperties or setInstanceText`);
}
for (const [phrase, count] of Object.entries(defaultPhraseHits)) {
  issues.push(`${count} VISIBLE TEXT node(s) containing default filler "${phrase}…" — replace Alert/Toast/Modal title/description via setProperties on the component's TEXT property`);
}

// 7.12. Target page — Rule #0. Root must live on a "Drafts" page unless
// the user explicitly pointed to another page. Walks up to find the PAGE.
{
  let p = root.parent;
  while (p && p.type !== "PAGE") p = p.parent;
  if (p && p.type === "PAGE" && !/drafts/i.test(p.name)) {
    issues.push(`Root is on page "${p.name}" — expected a page with "Drafts" in its name (Rule #0). If the user didn't specify another page, move to the Drafts page or create one.`);
  }
}

// 7.15. SECTION background + naming check — Rules 7.7. If root is inside a
// SECTION, verify (a) fill = #404040 and (b) name ends with "(made by Claude)".
{
  let anc = root.parent;
  while (anc && anc.type !== "PAGE") {
    if (anc.type === "SECTION") {
      // Fill check
      const f = anc.fills?.[0];
      const is404040 = f && f.type === "SOLID" &&
        Math.abs(f.color.r - 0x40/255) < 0.01 &&
        Math.abs(f.color.g - 0x40/255) < 0.01 &&
        Math.abs(f.color.b - 0x40/255) < 0.01;
      if (!f || f.visible === false) {
        issues.push(`SECTION "${anc.name}" has no fill — set fills to [{type:"SOLID",color:{r:0x40/255,g:0x40/255,b:0x40/255}}] per Rule 7.7`);
      } else if (!is404040) {
        const hex = f.type === "SOLID" ? "#" + [f.color.r,f.color.g,f.color.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("") : f.type;
        issues.push(`SECTION "${anc.name}" fill is ${hex}, expected #404040 (Rule 7.7)`);
      }
      // Naming check — must end with "(made by Claude)"
      if (!/\(made by Claude\)\s*$/.test(anc.name)) {
        issues.push(`SECTION "${anc.name}" missing "(made by Claude)" suffix — rename per Rule 7.7`);
      }
      break;
    }
    anc = anc.parent;
  }
}

// 7.16. Spacing / border-radius token binding — Rule 7.8.
// Every non-zero paddingLeft/Right/Top/Bottom, itemSpacing and cornerRadius
// on a custom FRAME (outside instances) must be bound to a design-token variable.
// Zero values don't need binding.
//
// v3.127 exception: known canonical raw values that have NO matching DS token.
// E.g. TM Pattern 4 uses 40/48/64 (Body padB=64, Columns gap=40/48, Main gap=40).
// Sumsub Base spacing tokens stop at spacing/3xl=32; no spacing/4xl/5xl/6xl.
// Marking these as unbound creates false positives. They're acceptable-raw —
// canonical itself is unbound at the same values.
// v3.130: TM Pattern 3 Rule Editor canonical uses 88 padding on Main content
// (no spacing/4xl=88 DS token). Added so audit 7.16 doesn't fail when build
// matches canonical 88-padding exactly.
const CANONICAL_RAW_SPACING_VALUES = [40, 48, 64, 88];
const spacingProps = ["paddingLeft","paddingRight","paddingTop","paddingBottom","itemSpacing"];
const radiusProps = ["topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius"];
const unboundBy = {}; // aggregate by frame to avoid spam
for (const n of all) {
  if (n.type !== "FRAME") continue;
  if (isInsideInstance(n)) continue;
  if (n.name === "Main") continue;   // outer column, no padding by design
  // Spacing props
  for (const prop of spacingProps) {
    const val = n[prop];
    if (typeof val !== "number" || val === 0) continue;
    const bound = n.boundVariables?.[prop];
    if (!bound) {
      // v3.127: skip canonical-raw values that have no DS token
      if (CANONICAL_RAW_SPACING_VALUES.includes(val)) continue;
      unboundBy[n.name] = unboundBy[n.name] || { spacing: [], radius: [] };
      unboundBy[n.name].spacing.push(`${prop}=${val}px`);
    }
  }
  // Radius props (each corner)
  for (const prop of radiusProps) {
    const val = n[prop];
    if (typeof val !== "number" || val === 0) continue;
    const bound = n.boundVariables?.[prop];
    if (!bound) {
      unboundBy[n.name] = unboundBy[n.name] || { spacing: [], radius: [] };
      unboundBy[n.name].radius.push(`${prop}=${val}px`);
    }
  }
}
const unboundFrameCount = Object.keys(unboundBy).length;
if (unboundFrameCount > 0) {
  // Show up to 5 sample frames, compact
  const samples = Object.entries(unboundBy).slice(0, 5).map(([name, v]) => {
    const parts = [];
    if (v.spacing.length) parts.push(`spacing[${v.spacing.join(", ")}]`);
    if (v.radius.length) parts.push(`radius[${v.radius.join(", ")}]`);
    return `${name}: ${parts.join(" ")}`;
  }).join(" | ");
  issues.push(`${unboundFrameCount} custom FRAME(s) with unbound spacing/radius values (Rule 7.8). Sample: ${samples}${unboundFrameCount > 5 ? " …" : ""}. Bind to spacing/* and border-radius/* variables via setBoundVariable.`);
}

// 7.18. Modal/Drawer internal header defaults — catch "Hey, what's up, dude?",
// "Hi, I'm sabtitle", literal "Title"/"Description" that ship as defaults on the
// inner Header component. These are DIFFERENT from the page *Header* placeholder
// check in step 2 — modal/drawer headers use different property keys and are
// inside a separate subtree.
const modalDrawerInternalDefaults = [
  "Hey, what's up, dude",
  "Hi, I'm sabtitle",
  "It's modal basic",
];
// Also flag literal "Title" / "Description" as value ONLY when they appear
// inside a modal/drawer header (too generic to flag globally).
const exactDefaultsInModalHeader = ["Title", "Description", "Subtitle"];
const modalsAndDrawers = all.filter(n =>
  n.type === "INSTANCE" && (
    n.mainComponent?.parent?.name === "*Modal Basic*" ||
    n.mainComponent?.parent?.name === "*Drawer Basic*"
  )
);
for (const md of modalsAndDrawers) {
  const hdr = md.findOne(n => n.type === "INSTANCE" && /\/ Header/i.test(n.name));
  if (!hdr) continue;
  for (const [key, prop] of Object.entries(hdr.componentProperties || {})) {
    if (prop.type !== "TEXT") continue;
    const v = prop.value || "";
    if (modalDrawerInternalDefaults.some(p => v.includes(p))) {
      issues.push(`${md.mainComponent.parent.name} "${md.name}" — internal Header '${key}' still default: "${v}". Call setProperties on the / Header sub-instance to replace.`);
    } else if (exactDefaultsInModalHeader.includes(v)) {
      issues.push(`${md.mainComponent.parent.name} "${md.name}" — internal Header '${key}' is literal default "${v}". Replace with real content.`);
    }
  }
}

// 7.17. Content-frame padding PIXEL values — not just bindings.
// Rule 7.8 requires bindings, but a binding to a token that resolves to
// an out-of-range value in this file (e.g., file-local override of
// spacing/xl to 20px when the Base library value is 24px) still looks
// broken. Verify the rendered value falls within Sumsub's expected
// range for Content areas:
//   padding L/R  ∈ [24, 32]   — spacing/xl (24) to spacing/3xl (32)
//   padding T/B  ∈ [16, 24]   — spacing/lg (16) to spacing/xl (24)
//   itemSpacing  ∈ [8, 24]    — spacing/s (8) to spacing/xl (24)
const contentFramesToAudit = all.filter(n =>
  n.type === "FRAME" && !isInsideInstance(n) && /^(Content|BG Content|Page Content|Body)$/i.test(n.name)
);
for (const cf of contentFramesToAudit) {
  const lr = [cf.paddingLeft, cf.paddingRight];
  const tb = [cf.paddingTop, cf.paddingBottom];
  const gap = cf.itemSpacing;
  for (const [side, val] of [["paddingLeft", lr[0]], ["paddingRight", lr[1]]]) {
    if (typeof val === "number" && val > 0 && (val < 24 || val > 32)) {
      issues.push(`Content-type frame "${cf.name}" ${side} = ${val}px, out of expected range [24, 32] (Rule 7.8 formula). Rebind to spacing/xl or spacing/3xl, or verify file's token values.`);
    }
  }
  for (const [side, val] of [["paddingTop", tb[0]], ["paddingBottom", tb[1]]]) {
    if (typeof val === "number" && val > 0 && (val < 16 || val > 24)) {
      issues.push(`Content-type frame "${cf.name}" ${side} = ${val}px, out of expected range [16, 24]. Rebind to spacing/lg or spacing/xl.`);
    }
  }
  if (typeof gap === "number" && gap > 0 && (gap < 8 || gap > 24)) {
    issues.push(`Content-type frame "${cf.name}" itemSpacing = ${gap}px, out of expected range [8, 24]. Rebind to spacing/s..spacing/xl.`);
  }
}

// 7.19. Orphan local COMPONENTs — Rule 7.9. Any figma.createComponent() the
// skill produces must live on a "Local components" page inside the
// "Components (by Claude)" SECTION. Scan all pages for COMPONENT nodes not
// housed correctly.
{
  const orphans = [];
  for (const page of figma.root.children) {
    // Skip the official home page
    if (/^local\s*components?$/i.test(page.name)) continue;
    for (const n of page.children) {
      if (n.type !== "COMPONENT") continue;
      // Direct child of a non-"Local components" page = orphan
      orphans.push(`"${n.name}" on page "${page.name}"`);
    }
    // Also check components hanging loose in sections on this page
    for (const sec of page.children.filter(c => c.type === "SECTION")) {
      for (const n of sec.children) {
        if (n.type === "COMPONENT") {
          orphans.push(`"${n.name}" in section "${sec.name}" on page "${page.name}"`);
        }
      }
    }
  }
  if (orphans.length > 0) {
    issues.push(`${orphans.length} local COMPONENT(s) outside "Local components" page (Rule 7.9): ${orphans.slice(0, 3).join(", ")}${orphans.length > 3 ? "…" : ""}. Move via getLocalComponentsHome() helper.`);
  }
  // Also check: on "Local components" page, components should be inside the
  // "Components (by Claude)" SECTION, not bare on the page.
  const homePage = figma.root.children.find(p => /^local\s*components?$/i.test(p.name));
  if (homePage) {
    const bareOnHome = homePage.children.filter(n => n.type === "COMPONENT");
    if (bareOnHome.length > 0) {
      issues.push(`${bareOnHome.length} COMPONENT(s) on "Local components" page not inside the "Components (by Claude)" SECTION — appendChild them to the section.`);
    }
  }
}

// 7.22. Content frame clipsContent hack + extreme undersize.
// Caught in Domain Mgmt Verified Success (140:15666): Content had
// clipsContent=false AND height=16px. Skill disabled clipping as a
// workaround for a Table Starter overflow — hiding symptom, not cause.
// Real fix is row.visible=false on unused table rows.
for (const n of all) {
  if (n.type !== "FRAME") continue;
  if (isInsideInstance(n)) continue;
  if (!/^(Content|BG Content|Page Content)$/i.test(n.name)) continue;
  if (n.clipsContent === false && n.children.length > 0) {
    issues.push(`Content frame "${n.name}" has clipsContent=false — this masks overflow instead of fixing it. Check if table/drawer inside is sized beyond content, and hide unused rows via row.visible=false or resize properly.`);
  }
  if (n.layoutMode && n.height < 40 && n.children.length > 0) {
    issues.push(`Content frame "${n.name}" auto-layout collapsed to ${Math.round(n.height)}px. Check layoutSizing on children and the frame itself — likely missing FILL vertical sizing.`);
  }
}

// 7.23. Table Starter — unused rows not hidden + "Table header" defaults.
// Skill often creates a Table Starter (10 rows by default) and populates
// only a few. Leaving the rest visible with blank cells (or worse, the
// default "Table cell"/"Table header" DS text) is Rule #7 violation AND
// creates overflow. The correct path: hide unused rows via row.visible=false.
for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
  const rows = tbl.children.filter(c => c.name === "Table Row");
  const visibleRows = rows.filter(r => r.visible);
  // Detect if all rows are visible (default state — almost always wrong)
  if (visibleRows.length === rows.length && rows.length >= 10) {
    issues.push(`Table Starter "${tbl.name}" has all ${rows.length} default rows visible. Real tables rarely need 10 rows — set unused rows to row.visible=false to avoid overflow and blank-cell defaults.`);
  }
  // Detect default "Table header" on header cells
  const tblHeader = tbl.children.find(c => c.name === "Table Header");
  if (tblHeader) {
    const defaultCount = tblHeader.findAll(t => t.type === "TEXT" && t.characters === "Table header").length;
    if (defaultCount > 0) {
      issues.push(`Table Starter "${tbl.name}" has ${defaultCount} "Table header" default labels in the header row. Set column labels via setProperties({"Header name#…": "Domain" / "Status" / ...}) on each header cell instance, NOT by direct .characters edit.`);
    }
  }
}

// 7.23b. Data rows not populated — ALL visible rows show identical default content.
// Caught in Domain Mgmt Verified Success (140:15666): 10 visible rows each with
// ∅ + "3:17 PM (GMT+4)" + "Status" + "Label" + "Show more" + "5" — the cell's
// Type wasn't set so every optional sub-component renders at once.
const rowDefaultSignals = /^(Label|Status|Show more|Checkbox)$/;
const timeDefault = /^\d{1,2}:\d{2}\s?(AM|PM)/;
for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
  const dataRows = tbl.children.filter(c => c.name === "Table Row" && c.visible);
  if (dataRows.length === 0) continue;
  let unconfiguredRows = 0;
  for (const row of dataRows) {
    const texts = row.findAll(t => t.type === "TEXT" && t.visible !== false && t.characters);
    const defaultHits = texts.filter(t =>
      rowDefaultSignals.test(t.characters) || timeDefault.test(t.characters)
    ).length;
    // A populated row typically has 0-1 matches (maybe one Status label that
    // says literal "Status" legitimately). 3+ matches means cells are unset.
    if (defaultHits >= 3) unconfiguredRows++;
  }
  if (unconfiguredRows === dataRows.length && dataRows.length > 0) {
    issues.push(`Table Starter "${tbl.name}" — all ${dataRows.length} visible rows show default cell content (Status / Label / Show more / time placeholder all rendered at once). Cells' "Type" property wasn't set. Iterate rows and call setProperties({Type: "Text Regular", "  ↪ Text in cell#14615:0": ...}) per cell, or hide the row.`);
  } else if (unconfiguredRows > 0) {
    issues.push(`Table Starter "${tbl.name}" — ${unconfiguredRows}/${dataRows.length} rows unconfigured (default cell content visible). Populate via setProperties on each cell or hide the rows.`);
  }
}

// 7.24. Direct TEXT modification inside DS component instances.
// Blanking default text via `text.characters = ""` leaves 50+ empty TEXT
// nodes on canvas — visible as hollow cells. Proper DS usage: setProperties
// on the cell instance to change "Type" (hides text sub-nodes) or
// row.visible=false.
// (This check is approximate — counts empty TEXT nodes inside Table Starter
// instances; legitimate empty cells exist, so fires only when count is high.)
for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
  const emptyTexts = tbl.findAll(n => n.type === "TEXT" && (!n.characters || n.characters === "") && n.visible !== false);
  if (emptyTexts.length > 30) {
    issues.push(`Table Starter "${tbl.name}" has ${emptyTexts.length} empty/blank visible TEXT nodes — looks like direct .characters="" overrides instead of hiding rows or using setProperties. Prefer row.visible=false on unused rows and setProperties on cells.`);
  }
}

// 7.26. UI-emoji in TEXT content (Rule 7.11).
// Catches emojis used as fake icons inside user-authored TEXT. Allows emoji
// inside component instances (DS variant names / annotation props legitimately
// use them). Only flags TEXT outside any INSTANCE.
const uiIconEmojis = /[\u{1F510}-\u{1F512}\u{1F4E7}\u{2709}\u{1F4C4}\u{1F4CB}\u{1F4D1}\u{1F5D1}\u{270F}\u{1F4C1}\u{2699}\u{1F50D}\u{26A0}\u{274C}\u{2705}\u{2757}\u{2139}\u{1F3E0}\u{1F4AC}\u{1F517}\u{25B6}\u{23F8}\u{25C0}\u{1F512}\u{1F513}]/u;
const emojiHits = [];
for (const n of all) {
  if (n.type !== "TEXT") continue;
  if (isInsideInstance(n)) continue;
  if (!isVisible(n)) continue;
  if (!n.characters) continue;
  if (uiIconEmojis.test(n.characters)) {
    emojiHits.push(n.characters.slice(0, 80));
  }
}
if (emojiHits.length) {
  issues.push(`${emojiHits.length} TEXT node(s) contain UI-icon emoji (🔐, ✉️, 📄, etc.). Rule 7.11: replace with Icon / * component instance from Assets library. Samples: ${emojiHits.slice(0, 3).map(s => `"${s}"`).join(" | ")}`);
}

// 7.29. Toast position must be top-right of root (Rule 7.14).
// Generic SaaS habit is bottom-right; Sumsub is top-right.
// Expected: x ≈ root.width - toast.width - 24, y ≈ 24.
for (const toast of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Toast*")) {
  // Only check top-level absolute-positioned toasts (not inside instances)
  if (isInsideInstance(toast)) continue;
  const parent = toast.parent;
  if (!parent || typeof parent.width !== "number") continue;
  const expectedX = parent.width - toast.width - 24;
  const expectedY = 24;
  const dx = Math.abs(toast.x - expectedX);
  const dy = Math.abs(toast.y - expectedY);
  // Tolerate small offsets (±16px) for stacked toasts
  if (dx > 32 || dy > 32) {
    // Check specifically if bottom-right pattern (common mistake)
    const isBottomRight = toast.x > parent.width / 2 && toast.y > parent.height / 2;
    if (isBottomRight) {
      issues.push(`Toast "${toast.name}" is bottom-right (x=${Math.round(toast.x)}, y=${Math.round(toast.y)}). Sumsub convention is top-right — set x = ${expectedX}, y = ${expectedY} (Rule 7.14).`);
    } else {
      issues.push(`Toast "${toast.name}" position (x=${Math.round(toast.x)}, y=${Math.round(toast.y)}) doesn't match top-right convention. Expected x≈${Math.round(expectedX)}, y≈${expectedY} (Rule 7.14).`);
    }
  }
}

// 7.30. Regex-fallback collision — Top Toolbar button label == filter label.
// When the skill hardcodes a prop key that fails and falls back to a
// regex sweep across the frame, the same label lands on multiple
// unrelated instances. Symptom: button text exactly matches filter
// label text, when they should be different.
{
  const toolbar = root.findOne(n => n.type === "INSTANCE" && n.name === "Top Toolbar");
  if (toolbar) {
    const btns = toolbar.findAll(n => n.type === "INSTANCE" && n.name === "*Button*" && n.visible)
      .map(b => b.findOne(t => t.type === "TEXT" && t.visible && t.name === "Button Text")?.characters)
      .filter(Boolean);
    const filters = toolbar.findAll(n => n.type === "INSTANCE" && n.name === "*Filter*" && n.visible);
    const filterLabels = filters.map(f => {
      const k = Object.keys(f.componentProperties || {}).find(k => /Label/i.test(k));
      return k ? f.componentProperties[k]?.value : null;
    }).filter(Boolean);
    // Any button text that equals any filter label → collision
    const collisions = btns.filter(b => filterLabels.includes(b));
    if (collisions.length) {
      issues.push(`Regex-fallback collision: Toolbar button label(s) [${collisions.join(", ")}] match filter label(s) verbatim. Likely cause: skill used findAll + /label/i regex to set properties. Use per-instance componentProperties probing instead — see "Component property discovery" section.`);
    }
  }
}

return JSON.stringify({ issues, info: infos }, null, 2);