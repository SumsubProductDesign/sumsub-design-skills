// ============================================================================
// Sumsub Mockup — Verbatim Audit Script (FULL — reference only, 105KB)
// ============================================================================
// ⚠️ DO NOT run this file whole — it's 105KB, over the use_figma 50KB code-param
// cap. To RUN the audit, use the 3 pre-split segment files (each <50KB, comments
// intact, no stripping needed): audit-part1.js + audit-part2.js + audit-part3.js.
// Read each, set ROOT_ID_HERE + productContext, run, then merge {issues, info}.
// This audit.js is the uncut source of truth (regenerate the parts from it if
// checks change: cut at the // 7.31. and // 7.48. boundaries; segments 2&3
// prepend the preamble + `const infos=[]` + the `const sidebar=...` decl).
// ----------------------------------------------------------------------------
// HOW TO RUN (from sumsub-mockup SKILL.md "Mandatory audit step"):
//   1. Read this whole file.
//   2. Edit ONLY two things: ROOT_ID_HERE (line below) and `productContext`.
//   3. Run via use_figma. This file is comment-heavy (~105KB) and EXCEEDS the
//      use_figma 50KB code-param limit. Two supported run modes:
//        MODE A (preferred): strip /* */ and // line-comments, then run in ONE
//          call (stripped ≈ 71KB — STILL over 50KB, so usually needs MODE B).
//        MODE B (split run): run in segments, each < 50KB, sharing the preamble.
//   4. Append the signature lines (see SKILL.md) and merge results.
//
// SPLIT PROTOCOL (MODE B) — segments share the PREAMBLE (everything from
// `const root` down to the `// 1. Title Row` marker, PLUS these symbols which
// some later checks reference: `sidebar`, `infos`). Cut at check-comment
// boundaries so no check body is split. A clean 3-way cut:
//   • Segment A: preamble → just before `// 7.43.`
//   • Segment B: `// 7.43.` → just before `// 8. Product-required components`
//   • Segment C: `// 8.` → end
// Each segment: prepend the preamble, append `return JSON.stringify({issues, infos});`,
// run, then concatenate all `issues`/`infos` and compute the signature from the union.
// Shared symbols to duplicate into each segment's preamble: root, productContext,
// page, issues, infos, all, isInsideInstance, isVisible, sidebar.
//
// ⚠️ Do NOT hand-edit check CONDITIONS to make them pass. Only ROOT_ID +
// productContext may change. Reporting a buggy check to the user is allowed;
// silently softening/removing it is not.
// ============================================================================

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
  // v3.165: honor the same canonical-raw exemptions as 7.16 (40/48/64/88) —
  // recurring FP: canonical pages legitimately use raw 64 (padB, section gap).
  for (const [side, val] of [["paddingLeft", lr[0]], ["paddingRight", lr[1]]]) {
    if (typeof val === "number" && val > 0 && (val < 24 || val > 32) && !CANONICAL_RAW_SPACING_VALUES.includes(val)) {
      issues.push(`Content-type frame "${cf.name}" ${side} = ${val}px, out of expected range [24, 32] (Rule 7.8 formula). Rebind to spacing/xl or spacing/3xl, or verify file's token values.`);
    }
  }
  for (const [side, val] of [["paddingTop", tb[0]], ["paddingBottom", tb[1]]]) {
    if (typeof val === "number" && val > 0 && (val < 16 || val > 24) && !CANONICAL_RAW_SPACING_VALUES.includes(val)) {
      issues.push(`Content-type frame "${cf.name}" ${side} = ${val}px, out of expected range [16, 24]. Rebind to spacing/lg or spacing/xl.`);
    }
  }
  if (typeof gap === "number" && gap > 0 && (gap < 8 || gap > 24) && !CANONICAL_RAW_SPACING_VALUES.includes(gap)) {
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
    // Skip the official home page. v3.165: host files prefix it with emoji/
    // markers ("🧩 Local components", "🧰 Local components") — match anywhere,
    // not anchored. Pre-existing host-file components on their own components
    // page are NOT this build's orphans (recurring FP).
    if (/local\s*components?/i.test(page.name) || /component/i.test(page.name)) continue;
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

// 7.48. Organism instance must use canonical width, NOT intrinsic (v3.126).
// Observed sim 2026-05-13: agent imported AP `Body` organism (intrinsic
// 942 wide), placed at x=380. Canonical Body in target file is 1060 wide.
// Agent kept intrinsic "to avoid distorting nested cards" — banned per
// v3.118 rule "Use the canonical instance width, not the variant's
// intrinsic width." Layout result: 380 + 942 = 1322, gap 118 on right.
// Resize after createInstance: bodyInstance.resize(canonicalW, intrinsicH).
{
  const apRoots = page.findAll(n => n.type === "FRAME" && /applicant/i.test(n.name));
  for (const root of apRoots) {
    if (!root.children) continue;
    // Find Body instance (anything that's INSTANCE and its mainComponent name contains "Body")
    const bodyInstance = root.children.find(c => {
      try {
        return c.type === "INSTANCE" && /^Body/.test(c.mainComponent?.parent?.name || c.mainComponent?.name || "");
      } catch(e) { return false; }
    });
    if (!bodyInstance) continue;
    // Find Summary on same root
    const summaryInstance = root.children.find(c => {
      try {
        return c.type === "INSTANCE" && /^Summary/.test(c.mainComponent?.parent?.name || c.mainComponent?.name || "");
      } catch(e) { return false; }
    });
    const summaryW = summaryInstance ? summaryInstance.width : 380;
    const expectedBodyW = 1440 - summaryW;
    if (Math.abs(bodyInstance.width - expectedBodyW) > 2) {
      issues.push(`7.48 ap-body-width: frame "${root.name}" Body instance width=${Math.round(bodyInstance.width)} ≠ canonical ${expectedBodyW} (1440 − Summary.width ${summaryW}). Agent likely kept the organism's intrinsic width. Resize: bodyInstance.resize(${expectedBodyW}, bodyInstance.height). Banned class: "kept at intrinsic to avoid distorting nested cards".`);
    }
  }
}

// 7.44. Case page (Pattern B) — Frame 270990504 wrapper + Container + Tab Basic alignment.
// ⚠️ v3.148: measurements updated to CURRENT canonical (drift confirmed via
// get_metadata on 4045:2323380, 2026-05-22). The pre-v3.146 layout (header
// at (0,0,1440,88), wrapper at (0,96,992,804), right col at (992,96)) is DEAD.
// Current canonical has a 52px collapsed Sidebar at (0,0), shifting everything:
//   root.children = [
//     *Sidebar* (52×900 @ 0,0, Type=Case management Collapsed=True),
//     Case page header (1388×88 @ 52,0),
//     Frame 270990504 (964×812 @ 52,88, FRAME, VERTICAL, no padding, clipsContent, FIXED height) {
//       Subheader (964×56, padding 32/32/0/1, CENTER/MAX align) { *Tab Basic* @ x=32 (FILL) },
//       Container (964×scroll, padding 32/24/24/24, itemSpacing 24) { Overview content @ 908 }
//     },
//     Case page right column (424×812 @ 1016,88)
//   ]
// Layout sum: 52 + 964 + 424 = 1440. This block folds in the former prose
// checklist #9 (wrapper.height FIXED + Tab Basic.x==32) so the runnable
// verbatim script actually asserts them. See case-management-pattern.md.
//
// Trigger: any frame whose first-level INSTANCE child is `Case page header`.
{
  const casePageHeaders = root.findAll(n =>
    n.type === "INSTANCE" &&
    n.mainComponent?.parent?.name === "Case page header"
  );
  for (const cph of casePageHeaders) {
    const screen = cph.parent;
    if (!screen) continue;

    // 7.44a — header position (post-drift: x=52, 1388×88)
    if (Math.abs(cph.x - 52) > 0.5 || Math.abs(cph.y) > 0.5) {
      issues.push(`Pattern B "${screen.name}": Case page header at (${Math.round(cph.x)},${Math.round(cph.y)}) — must be at (52, 0) (after the 52px Sidebar).`);
    }
    if (Math.abs(cph.width - 1388) > 0.5 || Math.abs(cph.height - 88) > 0.5) {
      issues.push(`Pattern B "${screen.name}": Case page header is ${Math.round(cph.width)}×${Math.round(cph.height)} — must be 1388×88.`);
    }

    // 7.44b — left wrapper presence + position + FIXED height
    const leftWrapper = screen.children.find(c =>
      c.type === "FRAME" && (c.name === "Frame 270990504" || /Frame\s*\d+/.test(c.name))
    );
    if (!leftWrapper) {
      issues.push(`Pattern B "${screen.name}": missing left wrapper FRAME (expected name "Frame 270990504"). Don't drop "Case page Overview tab content" directly into root — it must be wrapped in Frame 270990504 → Container with proper paddings. See case-management-pattern.md.`);
    } else {
      if (Math.abs(leftWrapper.x - 52) > 0.5 || Math.abs(leftWrapper.y - 88) > 0.5) {
        issues.push(`Pattern B "${screen.name}": left wrapper at (${Math.round(leftWrapper.x)},${Math.round(leftWrapper.y)}) — must be (52, 88) (after Sidebar, flush below 88px header, NO gap).`);
      }
      if (Math.abs(leftWrapper.width - 964) > 0.5) {
        issues.push(`Pattern B "${screen.name}": left wrapper width=${Math.round(leftWrapper.width)} — must be 964 (1440 − 52 Sidebar − 424 right col).`);
      }
      // folded from prose #9: wrapper MUST be FIXED at 812, not auto-grown to wrap 2400+px Container
      if (leftWrapper.height > 900) {
        issues.push(`Pattern B "${screen.name}": left wrapper height=${Math.round(leftWrapper.height)} — must be 812. Wrapper grew because layoutSizingVertical was not set to FIXED after appendChild; it hugged the Container's 2400+px content. Set clipsContent=true + FIXED height 812.`);
      } else if (Math.abs(leftWrapper.height - 812) > 0.5) {
        issues.push(`Pattern B "${screen.name}": left wrapper height=${Math.round(leftWrapper.height)} — must be 812.`);
      }

      // 7.44c — Subheader inside left wrapper + Tab Basic left-alignment (folded from #9)
      const subheader = leftWrapper.children.find(c => c.type === "FRAME" && /Subheader/i.test(c.name));
      if (!subheader) {
        issues.push(`Pattern B "${screen.name}": left wrapper has no Subheader FRAME. Required: HORIZONTAL frame named ".Header Full Screen Page / Subheader", padding 32/32/0/1, CENTER/MAX alignment, containing *Tab Basic* with 6 tabs.`);
      } else {
        const padOK = subheader.paddingLeft === 32 && subheader.paddingRight === 32;
        if (!padOK) {
          issues.push(`Pattern B "${screen.name}": Subheader paddings are L=${subheader.paddingLeft}/R=${subheader.paddingRight} — must be L=32, R=32.`);
        }
        if (subheader.primaryAxisAlignItems !== "CENTER" || subheader.counterAxisAlignItems !== "MAX") {
          issues.push(`Pattern B "${screen.name}": Subheader alignment is ${subheader.primaryAxisAlignItems}/${subheader.counterAxisAlignItems} — must be CENTER/MAX (anchors Tab Basic to bottom at y=23).`);
        }
        // folded from prose #9: Tab Basic MUST be FILL → left-aligned at x=32, not centered at ~224
        const tabBasic = subheader.findOne(n => n.type === "INSTANCE" && /\*?Tab Basic\*?/.test(n.name));
        if (tabBasic && tabBasic.x > 50) {
          issues.push(`Pattern B "${screen.name}": *Tab Basic* at x=${Math.round(tabBasic.x)} — must be x=32 (left-aligned). Tab Basic was not set to layoutSizingHorizontal="FILL", so Subheader's CENTER alignment centered the HUG-sized strip (~224.5 in a 964 wrapper).`);
        }
      }

      // 7.44d — Container inside left wrapper
      const container = leftWrapper.children.find(c => c.type === "FRAME" && c.name === "Container");
      if (!container) {
        issues.push(`Pattern B "${screen.name}": left wrapper has no Container FRAME. Required: VERTICAL frame named "Container", paddings 32/32/24/24 (L/R/T/B), itemSpacing 24, holding "Case page Overview tab content" at width 908 (FIXED; overflows the 900 content box by 8 → 24px visual right gutter).`);
      } else {
        // v3.153: pR=32 (was wrongly 24). Verified canonical Container 4045:2323405: L=R=32 (spacing/3xl), T=B=24 (spacing/2xl).
        const expectedPads = { paddingLeft: 32, paddingRight: 32, paddingTop: 24, paddingBottom: 24 };
        for (const [side, expected] of Object.entries(expectedPads)) {
          if (container[side] !== expected) {
            issues.push(`Pattern B "${screen.name}": Container ${side} = ${container[side]} — must be ${expected}. (Canonical Case page Container paddings: L=32, R=32, T=24, B=24, itemSpacing=24.)`);
          }
        }
        if (container.itemSpacing !== 24) {
          issues.push(`Pattern B "${screen.name}": Container itemSpacing = ${container.itemSpacing} — must be 24.`);
        }
      }
    }

    // 7.44e — right column position (post-drift: x=1016, 424×812)
    const rightCol = screen.children.find(c =>
      c.type === "INSTANCE" && c.mainComponent?.name === "Case page right column"
    );
    if (rightCol) {
      if (Math.abs(rightCol.x - 1016) > 0.5) {
        issues.push(`Pattern B "${screen.name}": Case page right column at x=${Math.round(rightCol.x)} — must be x=1016 (52 Sidebar + 964 wrapper). Right edge 1016+424=1440, flush with canvas edge, NO right margin in current canonical.`);
      }
      if (Math.abs(rightCol.y - 88) > 0.5) {
        issues.push(`Pattern B "${screen.name}": Case page right column at y=${Math.round(rightCol.y)} — must be y=88 (vertically aligned with left wrapper).`);
      }
      if (Math.abs(rightCol.width - 424) > 0.5 || Math.abs(rightCol.height - 812) > 0.5) {
        issues.push(`Pattern B "${screen.name}": Case page right column is ${Math.round(rightCol.width)}×${Math.round(rightCol.height)} — must be 424×812.`);
      }
    } else {
      issues.push(`Pattern B "${screen.name}": no Case page right column instance found. Pattern B requires it at (1016, 88) with 424×812.`);
    }
  }
}

// 7.42. Tab Basic — extra default-text items still visible.
// Observed (Rules list build, v3.57): Tab Basic has 12 .Tab Basic / Item
// children; skill renamed the first 4 but left items 5-11 with defaults
// ("Tab", "Tab_4", "Tab_5"...) AND visible=true on items 5-7. Each item
// still showed counter "5" + badge "Beta" defaults too.
{
  const tabContainers = root.findAll(n => n.type === "INSTANCE" && /^\*?Tab Basic/.test(n.name));
  for (const tc of tabContainers) {
    // v3.165: skip Tab Basic strips whose ancestor chain is hidden (e.g. the
    // *Header*'s disabled Subheader) — recurring FP: items have visible=true
    // but never render because the Subheader itself is hidden.
    if (!isVisible(tc)) continue;
    const items = (tc.children || []).filter(c => c.type === "INSTANCE" && /Tab Basic \/ Item/i.test(c.name));
    for (const item of items) {
      if (!item.visible) continue;
      const labelText = item.componentProperties?.["Label text#4517:0"]?.value;
      if (typeof labelText === "string" && /^Tab(_\d+)?$/.test(labelText.trim())) {
        issues.push(`Tab Basic item "${item.name}" is visible with default label "${labelText}". Either configure its Label text via setProperties or hide it via item.visible = false.`);
      }
      // Also flag visible Counter/Badge that weren't toggled off.
      const counterOn = item.componentProperties?.["Counter#5190:0"]?.value;
      const badgeOn = item.componentProperties?.["Badge#2885:0"]?.value;
      if (counterOn === true || badgeOn === true) {
        issues.push(`Tab Basic item "${item.name}" has Counter=${counterOn} / Badge=${badgeOn}. Set them to false unless you actually want to show a counter or "Beta" badge.`);
      }
    }
  }
}

// 7.35. SLOT alignment — CENTER with dead space.
// Observed (Domain management build, v3.55): drawer slot 712px, custom
// content 448px, slot.primaryAxisAlignItems = "CENTER" → 132px dead space
// above the content. After slot.appendChild(wrap), force MIN alignment.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (!body) continue;
  const slot = body.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  if (slot.primaryAxisAlignItems !== "CENTER") continue;
  const visKids = (slot.children || []).filter(c => c.visible);
  const totalChildH = visKids.reduce((s, c) => s + (c.height || 0), 0);
  const deadSpace = (slot.height || 0) - totalChildH;
  if (deadSpace > 60) {
    issues.push(`Modal/Drawer "${md.name}" SLOT has primaryAxisAlignItems = "CENTER" with ~${Math.round(deadSpace)}px dead space (slot ${Math.round(slot.height)}px, content ${Math.round(totalChildH)}px). After slot.appendChild(wrap), set slot.primaryAxisAlignItems = "MIN" to pin content to the top.`);
  }
}

// 7.28. Slot placeholder state — two failure modes.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (!body) continue;
  const slot = body.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  const visibleSlotKids = (slot.children || []).filter(c => c.visible);

  // (a) Double body — more than one visible child, placeholder wasn't hidden.
  if (visibleSlotKids.length > 1) {
    const names = visibleSlotKids.map(c => c.name).join(", ");
    issues.push(`Modal/Drawer "${md.name}" SLOT has ${visibleSlotKids.length} visible children [${names}]. Default placeholder wasn't hidden. Iterate slot.children and .visible=false every non-wrap sibling.`);
  }

  // (b) Empty modal — the ONLY visible child is the default placeholder
  // (Slot / Basic INSTANCE), no custom wrap was appended. Means slot.appendChild(wrap)
  // silently failed — usually because it was wrapped in try/catch (Rule #8 ban) or
  // because the wrap construction threw before the append call.
  if (visibleSlotKids.length === 1) {
    const only = visibleSlotKids[0];
    const isDefaultPlaceholder =
      (only.type === "INSTANCE" && /slot\s*\/\s*basic/i.test(only.name)) ||
      /^Slot \/ /i.test(only.name);
    if (isDefaultPlaceholder) {
      issues.push(`Modal/Drawer "${md.name}" has an EMPTY body — only the default "${only.name}" placeholder is visible, no custom wrap was appended. The body swap silently failed. Check for a try/catch around slot.appendChild (banned by Rule #8) or an earlier exception during wrap construction. Modal height is likely stuck at default (~228px for Size=Small empty).`);
    }
  }

  // (c) Suspicious modal height — matches default-empty heights closely.
  //     Default empties: Small=228h, Medium=240h-ish, Large=similar low value.
  //     If modal.height < 260 AND slot has only placeholder, definitely empty.
  if (md.height < 260 && visibleSlotKids.length <= 1 && visibleSlotKids.every(k => /slot\s*\/\s*basic/i.test(k.name || ""))) {
    issues.push(`Modal/Drawer "${md.name}" height ${Math.round(md.height)}px — suspiciously close to default-empty. Verify body content was actually appended (not swallowed by try/catch).`);
  }
}

// 7.27. Modal/Drawer body wrap has internal padding (Rule 7.12).
// The Body frame inside *Modal Basic* / *Drawer Basic* already pads its
// content. A wrap FRAME inside the SLOT should only use itemSpacing.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (!body) continue;
  const slot = body.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  for (const wrap of slot.children || []) {
    if (!wrap.visible) continue;
    if (wrap.type !== "FRAME" && wrap.type !== "COMPONENT") continue;
    const pads = [wrap.paddingLeft, wrap.paddingRight, wrap.paddingTop, wrap.paddingBottom];
    const nonZero = pads.filter(p => typeof p === "number" && p > 0);
    if (nonZero.length > 0) {
      issues.push(`Modal/Drawer body wrap "${wrap.name}" has internal padding (L=${wrap.paddingLeft}, R=${wrap.paddingRight}, T=${wrap.paddingTop}, B=${wrap.paddingBottom}) — Rule 7.12: remove all paddings, the Body frame already pads. Keep only itemSpacing for vertical gaps.`);
    }
  }
}

// 7.25. Modal/Drawer body wrap WIDTH overflow.
// Common failure: skill creates a wrap FRAME via figma.createFrame() with
// `resize(modal.width, …)` then appendChild into the SLOT. But the slot's
// usable width is modal.width - body padding (typically ~48px). Result:
// wrap is 720px in a 672px slot, overflows by ~48px on the right, content
// gets clipped. The general overflow check misses it because SLOT nodes
// have their own geometry.
{
  const modalsForOverflow = all.filter(n =>
    n.type === "INSTANCE" && (
      n.mainComponent?.parent?.name === "*Modal Basic*" ||
      n.mainComponent?.parent?.name === "*Drawer Basic*"
    )
  );
  for (const m of modalsForOverflow) {
    const body = m.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
    if (!body) continue;
    const slot = body.children?.find(c => c.type === "SLOT");
    if (!slot) continue;
    for (const child of slot.children || []) {
      if (!child.visible) continue;
      if (child.width > slot.width + 0.5) {
        issues.push(`Modal/Drawer body wrap "${child.name}" is ${Math.round(child.width)}px wide inside a ${Math.round(slot.width)}px SLOT (modal ${Math.round(m.width)}px). Resize to slot.width: wrap.resize(slot.width, wrap.height) — NOT modal.width, which ignores the Body's ~48px internal padding.`);
      }
    }
  }
}

// 7.2. Modal / Drawer — empty Body + vertical centering + fake-modal detection.
// SLOT properties on Modal Basic / Drawer Basic are READ-ONLY in the Plugin API
// (figma throws "Slot component property values cannot be edited"). Correct
// path is to appendChild into the instance's Body FRAME directly.
const modals = all.filter(n =>
  n.type === "INSTANCE" && (
    n.mainComponent?.parent?.name === "*Modal Basic*" ||
    n.mainComponent?.parent?.name === "*Drawer Basic*"
  )
);
for (const m of modals) {
  // Empty Body check — Body frame should have children (the content you added)
  const bodyFrame = m.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (bodyFrame && bodyFrame.children.length === 0) {
    issues.push(`Modal/Drawer "${m.name}" — Body frame is empty. appendChild your content into modal.children.find(c=>c.name.trim()==="Body"). SLOT via setProperties is read-only and will throw.`);
  }
  // Vertical centering check
  const parent = m.parent;
  if (parent && typeof parent.height === "number" && parent.height > 0 && m.layoutPositioning === "ABSOLUTE") {
    const modalCenter = m.y + m.height / 2;
    const parentCenter = parent.height / 2;
    const off = Math.abs(modalCenter - parentCenter);
    if (off > 40) {
      issues.push(`Modal/Drawer "${m.name}" not vertically centered in "${parent.name}" (off by ${Math.round(off)}px). Compute y AFTER body is populated: modal.y = (parent.height - modal.height) / 2`);
    }
  }
}

// 7.3. Fabrication detector — custom FRAMEs that should be DS component instances.
// Pattern: name starts with "Modal · …", "Drawer · …", "Annotation · …",
// "Empty State", "Table · …", "Toolbar · …", "Scenario · …" → fake.
const fabricationPatterns = [
  { re: /^Modal\s*[·\/]/i,      fix: "Use *Modal Basic* instance + Body frame appendChild" },
  { re: /^Drawer\s*[·\/]/i,     fix: "Use *Drawer Basic* instance + Body frame appendChild" },
  { re: /^Popover\s*[·\/]/i,    fix: "Use *Popover* instance" },
  { re: /^Annotation\s*[·\/]/i, fix: "Use Scenarios annotation component (key b5cdb94a14e3e6cd513db397cbd5d1391327896f, Type=Scenario)" },
  { re: /^Scenario\s*[·\/]/i,   fix: "Use Scenarios annotation component (key b5cdb94a14e3e6cd513db397cbd5d1391327896f)" },
  { re: /^Table\s*[·\/]/i,      fix: "Use *Table Starter* instance (key 213b7e3d7cc4503bbab83cd6c249e41e06dae295)" },
  { re: /^Toolbar\s*[·\/]/i,    fix: "Use Top Toolbar instance (key fa8defc5fadd20a84c812784786217c6e0003ca0)" },
  { re: /^Empty\s*State\s*[·\/]?/i, fix: "Use *Empty State* instance (key 0b0b611dba138a4a822b216114888d96513d248a)" },
  { re: /^Alert\s*[·\/]/i,      fix: "Use *Alert* instance (key 6d834b2f2da31f8a505379dcf26283d0be873609)" },
  { re: /^Filter\s*[·\/]/i,     fix: "Use *Filter* / *Filters group* instance" },
  { re: /^Status\s*[·\/]/i,     fix: "Use *Status* instance" },
];
const fakes = {};
for (const n of all) {
  if (n.type !== "FRAME") continue;
  if (isInsideInstance(n)) continue;
  for (const p of fabricationPatterns) {
    if (p.re.test(n.name)) {
      fakes[p.fix] = (fakes[p.fix] || 0) + 1;
      break;
    }
  }
}
for (const [fix, count] of Object.entries(fakes)) {
  issues.push(`${count} custom FRAME(s) found that should be DS component instances. Fix: ${fix}`);
}

// 7.4. Annotation presence — if task involves annotations, they must be the real
// Scenarios component, not custom FRAMEs named "Annotation · …" (caught by 7.3).
// Also detect the DS Scenarios component for a sanity count.
const realScenarios = all.filter(n =>
  n.type === "INSTANCE" && /Scenario/i.test(n.mainComponent?.parent?.name || "")
);
const fakeAnnotations = all.filter(n =>
  n.type === "FRAME" && !isInsideInstance(n) && /^Annotation\s*[·\/]/i.test(n.name)
);
if (fakeAnnotations.length > 0 && realScenarios.length === 0) {
  issues.push(`${fakeAnnotations.length} custom "Annotation · …" FRAME(s) found, zero real Scenarios instances. Use component key b5cdb94a14e3e6cd513db397cbd5d1391327896f with Type=Scenario variant.`);
}

// 8. Product-required components (fabrication check)
// For product-specific mockups, these top-level pieces MUST be real component instances, not custom FRAMEs.
// Detect product based on what's present or what the user asked for.
// NOTE (v3.151): productContext is now declared at the TOP of this script (see line ~1420).
// Do NOT re-declare it here — `const productContext` twice is a SyntaxError.

function requireInstance(label, matchFn, forbiddenFrameNames = []) {
  const hasInstance = all.some(n => n.type === "INSTANCE" && matchFn(n));
  if (!hasInstance) {
    issues.push(`${label}: required component instance is missing — did you build it as a custom FRAME instead?`);
  }
  // Check forbidden names ONLY on top-level FRAMEs (not inside component instances —
  // DS components contain their own internally-named frames like "Header" / "Dot Grid").
  const fakes = all.filter(n =>
    n.type === "FRAME" &&
    !isInsideInstance(n) &&
    forbiddenFrameNames.some(name => new RegExp(`^${name}$`, "i").test(n.name))
  );
  if (fakes.length) {
    issues.push(`${label}: ${fakes.length} custom FRAME(s) with forbidden name(s) [${fakes.map(f => f.name).join(", ")}] — replace with the real component instance`);
  }
}

if (productContext === "flow-builder") {
  // Shell components — fail loudly if any of the three is missing.
  // These are the most common skip: "I built just the canvas, no shell".
  // Flow Builder = Sidebar + Flowbuilder Header + Canvas (with bars). All three required.
  if (!sidebar) {
    issues.push(`Flow Builder page is missing the *Sidebar* instance. Required — import key 60be5cbb4d070ccc4853589a555d949c3f23f62e and use the variant matching the dashboard context.`);
  }
  requireInstance(
    "Flowbuilder Header",
    n => n.mainComponent?.parent?.name === "Flowbuilder / *Header*" || /Flowbuilder/.test(n.mainComponent?.parent?.name || ""),
    // "Header" alone is too broad — every DS component has an internal "Header" frame.
    // Only flag top-level custom frames with explicit Flow Builder–mimicking names.
    ["Flow Builder Header", "FB Header", "Workflow Header", "Flowbuilder Header"]
  );
  requireInstance(
    "Canvas",
    n => n.mainComponent?.parent?.name === "Canvas" || n.mainComponent?.name?.startsWith("Status="),
    ["Canvas", "Dot Grid", "Canvas Background", "Grid", "Flow Canvas"] // forbidden as FRAME, required as INSTANCE
  );
  // Fake-Canvas detection: a FRAME with dot-pattern / grid-like fill, used as Canvas substitute
  const fakeDotGrids = all.filter(n =>
    n.type === "FRAME" &&
    n.fills?.some(f => f.type === "PATTERN" || (f.type === "IMAGE" && /grid|dot/i.test(n.name))) &&
    n.width > 800 && n.height > 500
  );
  if (fakeDotGrids.length) {
    issues.push(`${fakeDotGrids.length} large FRAME(s) with dot/grid pattern fill detected — looks like a fake Canvas built instead of using the Canvas component instance`);
  }
  // Verify canvas bars exist (they come inside Canvas instance by default)
  const canvasInst = root.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas");
  if (canvasInst) {
    const hasTopBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Top");
    const hasRightBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Right");
    const hasBottomBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Bottom");
    if (!hasTopBar || !hasRightBar || !hasBottomBar) {
      issues.push(`Canvas is present but bars are missing (top: ${hasTopBar}, right: ${hasRightBar}, bottom: ${hasBottomBar}). Make sure you used the Canvas INSTANCE, not a custom FRAME.`);
    }
  }
  // Node attachments should be used sparingly — not on every node
  const nodeInstances = all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Node / Canvas");
  const nodesWithBadge = nodeInstances.filter(n =>
    n.findAll(c => c.type === "INSTANCE" && c.mainComponent?.name === "Node / Badge / Start").length > 0
  ).length;
  if (nodeInstances.length > 1 && nodesWithBadge === nodeInstances.length) {
    issues.push(`All ${nodeInstances.length} canvas nodes show 'Start Badge' — only the first node should have it`);
  }
  const nodesWithDanger = nodeInstances.filter(n =>
    n.findAll(c => c.type === "INSTANCE" && /Status=Danger/.test(c.mainComponent?.name || "")).length > 0
  ).length;
  if (nodeInstances.length > 1 && nodesWithDanger === nodeInstances.length) {
    issues.push(`All ${nodeInstances.length} canvas nodes show 'Status=Danger' — realistic flows have mixed or empty statuses`);
  }
  // Invented "Legend" frame
  const legends = all.filter(n => n.type === "FRAME" && /^Legend$/i.test(n.name));
  if (legends.length) {
    issues.push(`'Legend' frame(s) present — real Flow Builder doesn't have an on-canvas legend; remove unless user asked for it`);
  }
  // Connector strokeWeight — must be 2.51 per reference/flowbuilder.md.
  // Only check OUR connectors (not strokes inside DS component instances, which include
  // decorative lines at strokeWeight=1 inside Canvas bars and Wizard).
  const connectors = all.filter(n =>
    (n.type === "VECTOR" || n.type === "LINE") &&
    n.strokes?.length > 0 &&
    !isInsideInstance(n)
  );
  const wrongWeight = connectors.filter(c => c.strokeWeight && Math.abs(c.strokeWeight - 2.51) > 0.05);
  if (wrongWeight.length) {
    issues.push(`${wrongWeight.length}/${connectors.length} top-level connector(s) strokeWeight ≠ 2.51 (found: ${[...new Set(wrongWeight.map(c => c.strokeWeight))].join(", ")}) — see reference/flowbuilder.md`);
  }
  // Custom node renaming — Node / Canvas instances should keep their default names
  const renamedNodes = nodeInstances.filter(n => /^Node — /.test(n.name) || /^Node - /.test(n.name));
  if (renamedNodes.length) {
    issues.push(`${renamedNodes.length} Node / Canvas instance(s) renamed with "Node — *" pattern — keep default instance names`);
  }
  // Info Block placeholder — the component ships with "Start time: 24 Jul, 23 13:43" / "Time in node: 8y:12m:14d" defaults
  const placeholderTexts = ["Start time: 24 Jul", "Time in node: 8y", "Time in node: 8y:12m:14d"];
  const placeholderHits = all.filter(n => n.type === "TEXT" && placeholderTexts.some(p => n.characters?.includes(p)));
  if (placeholderHits.length) {
    issues.push(`Info Block placeholder text still present in ${placeholderHits.length} text node(s) — replace with realistic times or hide Info Block`);
  }
}

if (productContext === "applicant-page") {
  requireInstance(
    "AP page header",
    n => n.mainComponent?.parent?.name === "AP page header" || n.mainComponent?.name?.startsWith("Client type="),
    ["AP Header", "Applicant Header", "Applicant Page Header"]
  );
  // Sidebar should be the collapsed 52px variant for AP pages
  if (sidebar && !/Collapsed=True/.test(sidebar.mainComponent.name)) {
    issues.push(`Applicant page Sidebar should use Collapsed=True (52px), but got "${sidebar.mainComponent.name}"`);
  }
}

if (productContext === "table-page") {
  // Table pages should use Top Toolbar component, not a custom toolbar
  const tableInst = all.find(n => n.type === "INSTANCE" && n.name === "*Table Starter*");
  if (tableInst) {
    const hasTopToolbar = !!root.findOne(n => n.type === "INSTANCE" && n.name === "Top Toolbar");
    if (!hasTopToolbar) {
      issues.push(`Table page has *Table Starter* but no 'Top Toolbar' instance — tables typically need one for search/filters/CTA`);
    }
  }
}

if (productContext === "tm") {
  // TM screens have multiple layout patterns — check sidebar width matches pattern.
  // Pattern 1 (Transactions table): Sidebar 257px, screen 1440×900
  // Pattern 2 (Settings/Rules): Sidebar 276px, screen 1440×956
  // Pattern 3 (Rule editor): No sidebar, Header Full Screen Page 1440px
  // Pattern 4 (Transaction detail): No sidebar, 1920px wide canvas
  // Pattern 5 (Txn Networks): No sidebar, 1681px wide canvas
  if (sidebar) {
    const sidebarW = Math.round(sidebar.width);
    if (sidebarW !== 257 && sidebarW !== 276) {
      issues.push(`TM Sidebar width is ${sidebarW}px — expected 257px (Transactions table / Pattern 1) or 276px (Settings / Pattern 2). See tm-layout-patterns.md.`);
    }
    if (sidebarW === 257 && Math.round(root.width) !== 1440) {
      issues.push(`TM Pattern 1 (Sidebar 257): root width should be 1440px, got ${Math.round(root.width)}px`);
    }
    if (sidebarW === 276 && Math.round(root.width) !== 1440) {
      issues.push(`TM Pattern 2 (Sidebar 276): root width should be 1440px, got ${Math.round(root.width)}px`);
    }
  } else {
    // No sidebar — check for known full-screen patterns
    const rootW = Math.round(root.width);
    if (rootW !== 1440 && rootW !== 1920 && rootW !== 1681) {
      issues.push(`TM no-sidebar screen width is ${rootW}px — expected 1440 (Rule editor Pattern 3), 1920 (Transaction detail Pattern 4), or 1681 (Txn Networks Pattern 5). See tm-layout-patterns.md.`);
    }
    // Transaction detail (Pattern 4): must have Header/Finance instance
    if (rootW === 1920) {
      const hasFinanceHeader = all.some(n => n.type === "INSTANCE" && /Header.*Finance|Header\/Finance/.test(n.name));
      if (!hasFinanceHeader) {
        issues.push(`TM Pattern 4 (Transaction detail, 1920px): expected a 'Header / Finance' instance (TM-specific 144px header) — not found. Import key 1fcc7d73759e1feaa9c2e4af4b487344ba398fcb.`);
      }

      // Pattern 4 content frames must be white — Rule #6.
      // Body / Columns / Main column / Right panel are custom frames the skill
      // creates; they must have explicit white fills (not transparent).
      // Transparent frames inherit the root grey (#f6f7f9) and look grey.
      const tmContentNames = /^(Body|Columns|Main column|Right panel)$/i;
      const tmContentFrames = all.filter(n =>
        n.type === "FRAME" && !isInsideInstance(n) && tmContentNames.test(n.name)
      );
      for (const tcf of tmContentFrames) {
        const fill = tcf.fills?.[0];
        if (!fill || fill.visible === false || fill.opacity === 0) {
          issues.push(
            `TM Pattern 4: "${tcf.name}" has no fill (transparent) — it inherits the root grey and makes the screen look grey. ` +
            `Bind to semantic/background/neutral/inverse/normal (white). ` +
            `Rule #6: every content-surface frame must have an EXPLICIT white fill.`
          );
        }
      }
    }
  }
}

// 7.45. Root frame must be inside a SECTION — never directly on the page.
// Rule 7.5: every root frame's direct parent must be a SECTION node (type==="SECTION").
// If the parent is the PAGE itself, the build violated Rule 7.5 by appending
// the root directly to figma.currentPage without creating a section wrapper.
{
  if (root.parent?.type === "PAGE") {
    issues.push(
      `Root frame "${root.name}" is a direct child of the PAGE — it must live inside a SECTION. ` +
      `Create a section (fill #404040, name ending in "(made by Claude)"), append the root inside it, ` +
      `and remove it from the page directly (Rule 7.5).`
    );
  }
}

// 7.50. Canvas overlap — section must not visually overlap any pre-existing top-level node.
// Caught in v3.82 user testing: skill placed Connections section at coords that overlapped
// existing canonical Account screens. findFreeCanvasSpot() exists in helpers.js but skill
// sometimes skips it and uses (0,0) or hard-coded coords.
{
  // Find the SECTION ancestor of root
  let sec = root.parent;
  while (sec && sec.type !== "SECTION") sec = sec.parent;
  if (sec && sec.parent?.type === "PAGE") {
    const page = sec.parent;
    const myL = sec.x, myT = sec.y, myR = sec.x + sec.width, myB = sec.y + sec.height;
    for (const sibling of page.children) {
      if (sibling.id === sec.id) continue;
      // Only check top-level FRAMEs and SECTIONs (skip vector/text/image clutter)
      if (sibling.type !== "FRAME" && sibling.type !== "SECTION") continue;
      if (typeof sibling.x !== "number") continue;
      const sL = sibling.x, sT = sibling.y, sR = sibling.x + sibling.width, sB = sibling.y + sibling.height;
      // Standard rectangle overlap check
      const overlaps = !(myR <= sL || sR <= myL || myB <= sT || sB <= myT);
      if (overlaps) {
        issues.push(
          `Section "${sec.name}" overlaps existing top-level node "${sibling.name}" (${sibling.type}) on the page. ` +
          `Move the section to a free spot via findFreeCanvasSpot() helper (Rule 7.50 / Action 3). ` +
          `Section bbox=(${myL},${myT})-(${myR},${myB}); overlapping sibling bbox=(${sL},${sT})-(${sR},${sB}).`
        );
        break;   // one overlap is enough to fail the audit
      }
    }
  }
}

// 7.51. Section bbox must contain root bbox.
// Caught in v3.89 user testing: skill called section.resizeWithoutConstraints
// BEFORE appendChild(root), so section was sized to pre-root dimensions and
// root visually leaked outside section. parentType=SECTION is correct but
// bbox containment is broken. Build code must call resize AFTER append; this
// audit catches regressions when the order is forgotten.
{
  let sec2 = root.parent;
  while (sec2 && sec2.type !== "SECTION") sec2 = sec2.parent;
  if (sec2 && sec2.type === "SECTION") {
    const rL = root.x, rT = root.y;
    const rR = root.x + root.width, rB = root.y + root.height;
    const sW = sec2.width, sH = sec2.height;
    const tolerance = 2;
    if (rL < -tolerance || rT < -tolerance || rR > sW + tolerance || rB > sH + tolerance) {
      issues.push(
        `7.51 section-contains-root: root frame "${root.name}" leaks outside section "${sec2.name}" bbox. ` +
        `Section is ${Math.round(sW)}x${Math.round(sH)}; root is at (${Math.round(rL)},${Math.round(rT)}) size ${Math.round(root.width)}x${Math.round(root.height)} (right edge ${Math.round(rR)}, bottom ${Math.round(rB)}). ` +
        `Cause: section.resizeWithoutConstraints was called BEFORE appendChild(root) — section was sized to pre-root dimensions. ` +
        `Fix: call section.resizeWithoutConstraints(root.width + 80, root.height + 200) AFTER appending root, so section grows to encompass it.`
      );
    }
  }
}

// 7.55. Table-organism instance must NOT have its internal padding zeroed (v3.156).
// Table organisms (Txn table, Table Starter, Case table, etc.) ship with a baked
// content inset — canonical Txn table top frame = padL=32 padR=32 padT=24 padB=24,
// insetting the Top Toolbar + Body so rows get left/right gutters. A fresh
// createInstance() inherits that inset; padding 0/0/0/0 only happens if the build
// EXPLICITLY zeroed it (banned — strips the inset, slams content flush to the edge).
// Observed: TM Transactions-table sim 2026-06-01, build zeroed Txn table to 0/0/0/0.
{
  // Narrowed to organisms whose canonical inset is VERIFIED. `Txn table` confirmed
  // 32/32/24/24 (TM sim 2026-06-01). Do NOT add generic `*Table Starter*` here — its
  // native inset is unverified and may legitimately be 0 (false-positive risk; see the
  // 7.44d stale-value lesson). Add other organisms only after confirming canonical padding.
  const tableOrgRe = /^Txn table$/;
  const tableOrgs = all.filter(n =>
    n.type === "INSTANCE" &&
    tableOrgRe.test(n.name) &&
    n.layoutMode === "VERTICAL" &&
    n.width > 1000 &&
    !isInsideInstance(n)
  );
  for (const t of tableOrgs) {
    let pL, pT;
    try { pL = t.paddingLeft; pT = t.paddingTop; } catch (e) { continue; }
    if (pL === 0 && pT === 0) {
      issues.push(`7.55 table-padding-stripped: "${t.name}" (${Math.round(t.width)}w) has padding 0/0/0/0 — its internal content inset was zeroed. Canonical Txn table = 32/32/24/24, insetting the Top Toolbar + Body so rows get gutters. A fresh createInstance inherits that; 0/0/0/0 = the build explicitly zeroed it. NEVER set padding on the Txn table instance; drop it and configure rows/State only. Fix: do NOT touch paddingLeft/Right/Top/Bottom.`);
    }
  }
}

// 7.56. Redesign library-staleness detector (v3.156, INFO not FAIL).
// The 2026-06 redesign lives in the Base components SOURCE file. Each consuming
// file caches its own copy of imported library variables; a file only gets the
// new Tailwind values after it re-syncs (Update) the Base library. A NON-synced
// file resolves variables to PRE-redesign hex — every component (local or remote)
// then renders old colors REGARDLESS of skill output. This is a Figma library
// state, not a build defect → reported as INFO. (Observed: TM file
// 4zG4nJT1s0mcVQDXuJjoJJ resolved Base/Neutral/60=#a6afbe (old) vs new #6a7282;
// status bg #d0f1e8/#f6f7f9 old.)
{
  // Distinctive PRE-redesign hexes that do NOT exist in the new Tailwind palette.
  const OLD_PALETTE = new Set([
    "#373d4d","#586073","#7d8799","#a6afbe","#c4cad4","#f6f7f9","#edeff2","#e1e5ea",
    "#1764ff","#4180ff","#1455d9","#0a2d73","#25b793","#d0f1e8","#f5222d","#ffa500","#212736"
  ]);
  function hx(c){if(!c)return null;const h=x=>Math.round(x*255).toString(16).padStart(2,"0");return "#"+h(c.r)+h(c.g)+h(c.b);}
  const foundOld = new Set();
  for (const n of all) {
    let fills; try { fills = n.fills; } catch (e) { continue; }
    if (!Array.isArray(fills)) continue;
    for (const f of fills) {
      if (f.type === "SOLID" && f.visible !== false) {
        const hex = hx(f.color);
        if (hex && OLD_PALETTE.has(hex)) foundOld.add(hex);
      }
    }
  }
  if (foundOld.size >= 4) {
    infos.push(`[info] ⚠️ REDESIGN LIBRARY STALE: this file resolves ${foundOld.size} distinct PRE-redesign hexes (${[...foundOld].slice(0,8).join(", ")}). The Base components library in this file is NOT synced to the 2026-06 Tailwind+black redesign — components render OLD colors regardless of skill output. This is a Figma library-sync state, not a build defect. Tell the user: ask design to open this file and Update the Base components library (Assets → library updates → Update), then colors will re-resolve to the new palette.`);
  }
}

// 7.57. Icon-Only *Button* distorted off its native size (v3.158).
// Icon-only buttons are fixed squares (DS native 24/32/40). A rendered size that
// deviates >8px from the mainComponent's native size means the build resized it
// (or set layoutSizingHorizontal/Vertical=FILL on it) — usually by reaching into a
// chrome component (Sidebar KeyHeader, Header) and re-laying-out a nested button.
// Observed: CM "All cases" sim 2026-06-01 — Sidebar KeyHeader info button native
// 24x24 blown up to 88x72. NEVER resize/re-layout nodes inside chrome instances.
{
  const iconBtns = all.filter(n =>
    n.type === "INSTANCE" &&
    /^\*?Button\*?$/.test(n.name) &&
    n.mainComponent &&
    /Content=Icon Only/i.test(n.mainComponent.name || "")
  );
  for (const b of iconBtns) {
    const mc = b.mainComponent;
    let nw, nh;
    try { nw = mc.width; nh = mc.height; } catch (e) { continue; }
    if (!nw || !nh) continue;
    if (Math.abs(b.width - nw) > 8 || Math.abs(b.height - nh) > 8) {
      issues.push(`7.57 icon-button-distorted: "${b.name}" rendered ${Math.round(b.width)}x${Math.round(b.height)} but its component is native ${Math.round(nw)}x${Math.round(nh)} (Icon-Only buttons are fixed squares). The build resized it or set layoutSizing=FILL — usually by reaching INTO a chrome instance (Sidebar/Header). Remove the resize/FILL; configure chrome via exposed properties only, never re-layout its nested children.`);
    }
  }
}

// 7.58. TM Rule editor (Pattern 3) MUST have a 52px collapsed Sidebar (v3.159).
// Canonical Create rule (2694:902178) has *Sidebar* 52x902 @(0,0) Type=Dashboard
// Collapsed=True; Header FRAME 1388x64 @x=52 white; Body 1388 @x=52. The agent has a
// strong "editor pages have no sidebar" prior and omitted it (sim 2026-06-01),
// building Header full-1440 @x=0. Signature: a page-title TEXT "Create rule"/"Edit
// rule". If present AND no *Sidebar* instance in the build → FAIL.
{
  const ruleTitle = all.find(n =>
    n.type === "TEXT" && /^(Create|Edit) rule$/i.test((n.characters || "").trim())
  );
  if (ruleTitle) {
    const hasSidebar = all.some(n =>
      n.type === "INSTANCE" && /\*Sidebar\*/.test(n.mainComponent?.parent?.name || n.name || "")
    );
    if (!hasSidebar) {
      issues.push(`7.58 rule-editor-missing-sidebar: this is a Rule editor (title "${ruleTitle.characters.trim()}") but has NO *Sidebar* instance. Canonical Create rule has a 52px collapsed *Sidebar* (Type=Dashboard, Collapsed=True) at (0,0), with Header at x=52 (w=1388) and Body at x=52. NEVER build the rule editor full-1440 with no sidebar — that's a stale "editor = no sidebar" prior. Import the Sidebar (key 60be5cbb…), Collapsed=True, place at x=0, offset Header/Body to x=52. See tm-layout-patterns.md Pattern 3.`);
    }
  }
}

// 7.59. Status value rendered as bare TEXT in a table cell (v3.160).
// A column of status values must use the Status cell type (Type=Status + nested
// *Status* pill), NEVER a Text Regular cell with a bare status word. Observed:
// Settings Members sim 2026-06-01 — "Active"/"Invited" rendered as plain TEXT.
// Roles (Admin/Member/Owner/Moderator) are NOT statuses — excluded.
{
  const STATUS_WORDS = /^(Active|Inactive|Pending|Invited|Invite sent|Approved|Rejected|Suspended|Blocked|Disabled|Expired|Processing|Awaiting|Resolved|Closed|Failed|Passed|Verified|Online|Offline)$/i;
  function mcParentName(n){ if(n.type!=="INSTANCE") return ""; try { return n.mainComponent?.parent?.name || n.mainComponent?.name || ""; } catch(e){ return ""; } }
  const hits = [];
  const texts = all.filter(n => n.type === "TEXT" && isVisible(n) && STATUS_WORDS.test((n.characters||"").trim()));
  for (const t of texts) {
    // is it inside a Table Row/cell, and NOT inside a *Status* instance?
    let p = t.parent, inCell = false, inStatus = false;
    while (p && p !== root) {
      if (/\*Status\*/.test(mcParentName(p))) { inStatus = true; break; }
      if (/Table Row|Cell Content|Cell/i.test(p.name||"")) inCell = true;
      p = p.parent;
    }
    if (inCell && !inStatus) hits.push(t.characters.trim());
  }
  if (hits.length) {
    const uniq = [...new Set(hits)];
    issues.push(`7.59 status-as-bare-text: ${hits.length} table cell(s) render a status value as plain TEXT (${uniq.slice(0,6).join(", ")}) instead of a *Status* pill. Set the cell Type to "Status" and configure the nested *Status* instance (label + color variant). Roles (Admin/Member/Owner) are exempt — only status words are flagged.`);
  }
}

return issues.length === 0
  ? JSON.stringify({ status: "✅ Audit PASSED", info: infos }, null, 2)
  : JSON.stringify({ failed: issues.length, issues, info: infos }, null, 2);
