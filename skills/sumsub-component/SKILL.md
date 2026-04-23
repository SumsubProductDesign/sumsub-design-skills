---
name: sumsub-component
description: "Create a Figma component on demand — local to the current file, or in a shared design system file. Supports single components and variant sets. Describe what you need (name, structure, variants) and the skill builds it with Sumsub DS tokens and naming conventions."
argument-hint: "[component description]"
---

# Figma Skill: Component Builder

> **For EXPLICIT on-demand component creation.** User asks: "build me a Card with avatar + name + actions", "create a variant set for Status chip with 5 colors", "add a new Toast variant". This skill produces a named, variant-aware, DS-token-bound Figma COMPONENT (or COMPONENT SET) where the user specified.
>
> **NOT for full mockups / screens** — that's `/sumsub-design:sumsub-mockup`. The mockup skill already creates local helper components (modal body wraps, etc.) as part of its flow, per its own Rule 7.9. Do not duplicate — this skill is invoked independently when the user wants a reusable component, not a screen.

**When to invoke this skill:**
- User says: "create / build / make a component", "design a `<thing>` component", "add a variant", "build a <X> card / chip / badge / banner …"
- User gives a spec (structure, variants, states) and wants the component built in a specific file / page.
- User wants to add a new reusable to a DS library (separate Figma file).

## 🚨 Critical rules

### Pre-flight: check for plugin updates (run FIRST, once per session)

Identical to `sumsub-mockup` Rule pre-flight. Read local `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`, WebFetch the remote version from GitHub main, SemVer compare, **also WebFetch `CHANGELOG.md` and include the entries between local and remote versions in the update prompt** so the user sees what's new. Offer to auto-update via Bash on `yes`. Do not re-run once the session's check is done.

### Rule #0 — clarify scope before building

Never start creating without all four things settled:

1. **Component purpose** — what does it represent? (Card, Status badge, Info chip, Avatar, …). If the user's description is one word, ask for:
   - Typical use case (where on a screen)
   - Expected content (text only, text + icon, with avatar, with actions)
   - Any states (Default / Hover / Active / Disabled / Loading)
   - Any size tiers (S / M / L)
   - Any color / type variants (neutral / success / danger / …)

2. **Location**. Ask explicitly:
   - **Local to an existing mockup file** — user provides Figma URL. Place in `Local components` page → `Components (by Claude)` SECTION per Rule 7.9 from `sumsub-mockup`.
   - **New standalone file in Sumsub org** — user approves, create via `create_new_file` with `planKey` from `reference/design-system.md`.
   - **Contribution to an existing DS library file** — user provides Figma URL + page name. Place on that page, use the library's existing section conventions (do not add `(made by Claude)` suffix to an official DS library — only for draft / local).

3. **Single component vs component set**. If the spec has ≥2 variants on any axis (Size, State, Type, Color, etc.) → build a COMPONENT SET via `figma.combineAsVariants()`. Otherwise a single COMPONENT.

4. **Naming convention** — matches existing DS patterns:
   - Single component: `*ComponentName*` (asterisks = published "main" component set) OR `ComponentName / Variant` for sub-components (no asterisks, internal use)
   - Component set: parent gets `*ComponentName*`, each variant gets `Property1=value1, Property2=value2`

### Rule #1 — use Sumsub DS tokens, not raw values

- **Typography**: always `figma.importStyleByKeyAsync` + `setTextStyleIdAsync`. See text style keys in `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md`.
- **Colors**: `figma.variables.importVariableByKeyAsync` + `setBoundVariableForPaint`. Use `semantic/*` keys (text, background, border, icon). See key tables in same reference.
- **Spacing**: `bindSpacing` / `bindFrameSpacing` from `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/helpers.js`. Never hardcode padding numbers.
- **Border radius**: `bindRadius`. Never hardcode corner radius.

Rule 7.8 from `sumsub-mockup` applies in full: every non-zero padding / gap / corner radius must be bound to a variable. Audit catches it.

### Rule #2 — component MUST be auto-layout

No free-form positioning inside the component. Set `layoutMode = "VERTICAL"` or `"HORIZONTAL"`, define `itemSpacing`, `paddingLeft/Right/Top/Bottom`, and sizing modes (`primaryAxisSizingMode`, `counterAxisSizingMode`). Consumers of the component must be able to resize it without breaking internals.

### Rule #3 — DS icons only, not emoji

Same as `sumsub-mockup` Rule 7.11. Any icon inside the component = `Icon / …` instance from the Assets library. No 🔐 / ✉️ / 📄 as UI icons.

### Rule #4 — realistic preview text

The component's default variant should render with **realistic copy**, not `"Label"` / `"Placeholder"` / `"Title"`. Use the kind of content the component would hold in production (e.g. a Status badge defaults to `"Verified"`, not `"Status"`).

### Rule #5 — self-verify before delivering

Run the audit script below. Do not share the link unless it returns `✅ Audit PASSED`.

```js
// Audit script for sumsub-component
const comp = figma.getNodeById("ROOT_ID_HERE");  // the COMPONENT or COMPONENT_SET you built
const issues = [];
const infos = [];

// 1. Naming
if (!(comp.type === "COMPONENT" || comp.type === "COMPONENT_SET")) {
  issues.push(`ROOT must be COMPONENT or COMPONENT_SET, got ${comp.type}.`);
}
if (comp.type === "COMPONENT_SET" && !/^\*.+\*$/.test(comp.name)) {
  issues.push(`Component set name "${comp.name}" should be wrapped in asterisks (DS convention, e.g. "*Status*").`);
}

// 2. Auto-layout
function checkAutoLayout(node) {
  if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") return;
  if (node.type === "COMPONENT_SET") { (node.children || []).forEach(checkAutoLayout); return; }
  if (!node.layoutMode || node.layoutMode === "NONE") {
    issues.push(`"${node.name}" is not auto-layout (layoutMode=NONE). Rule #2 — set to VERTICAL or HORIZONTAL.`);
  }
  (node.children || []).forEach(checkAutoLayout);
}
checkAutoLayout(comp);

// 3. Unbound spacing / radius / fills on non-zero custom frames
function checkBindings(node) {
  if (node.type !== "FRAME" && node.type !== "COMPONENT") return;
  const spacingProps = ["paddingLeft","paddingRight","paddingTop","paddingBottom","itemSpacing"];
  for (const p of spacingProps) {
    const v = node[p];
    if (typeof v === "number" && v > 0 && !node.boundVariables?.[p]) {
      issues.push(`"${node.name}" ${p}=${v}px unbound. Rule #1 — bind to spacing/*.`);
    }
  }
  const radiusProps = ["topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius"];
  for (const p of radiusProps) {
    const v = node[p];
    if (typeof v === "number" && v > 0 && !node.boundVariables?.[p]) {
      issues.push(`"${node.name}" ${p}=${v}px unbound. Rule #1 — bind to border-radius/*.`);
    }
  }
  if (node.fills?.[0]?.type === "SOLID" && !node.fills[0].boundVariables?.color) {
    issues.push(`"${node.name}" hardcoded SOLID fill. Rule #1 — bind to semantic/background/* or semantic/icon/*.`);
  }
  if (node.strokes?.[0]?.type === "SOLID" && !node.strokes[0].boundVariables?.color) {
    issues.push(`"${node.name}" hardcoded SOLID stroke. Rule #1 — bind to semantic/border/*.`);
  }
  (node.children || []).forEach(checkBindings);
}
checkBindings(comp);

// 4. Text styles applied
function checkTextStyles(node) {
  if (node.type === "TEXT") {
    if (!node.textStyleId || node.textStyleId === "") {
      issues.push(`TEXT "${node.characters?.slice(0,40)}" has no textStyleId. Rule #1 — apply a DS text style.`);
    }
  }
  (node.children || []).forEach(checkTextStyles);
}
checkTextStyles(comp);

// 5. Realistic default content
const placeholderSet = ["Label","Placeholder","Button","Title","Description","Text","Status","Value"];
function checkPlaceholderText(node) {
  if (node.type === "TEXT" && placeholderSet.includes(node.characters?.trim())) {
    issues.push(`TEXT "${node.characters}" in "${node.name}" is placeholder. Rule #4 — use realistic default.`);
  }
  (node.children || []).forEach(checkPlaceholderText);
}
checkPlaceholderText(comp);

// 6. Emoji as UI icons
const uiIconEmojis = /[\u{1F510}-\u{1F512}\u{1F4E7}\u{2709}\u{1F4C4}\u{1F4CB}\u{1F5D1}\u{270F}\u{2699}\u{1F50D}\u{26A0}\u{274C}\u{2705}]/u;
function checkEmoji(node) {
  if (node.type === "TEXT" && node.characters && uiIconEmojis.test(node.characters)) {
    issues.push(`TEXT "${node.characters}" contains UI emoji. Rule #3 — use Icon / * instance from Assets library.`);
  }
  (node.children || []).forEach(checkEmoji);
}
checkEmoji(comp);

return issues.length === 0
  ? JSON.stringify({ status: "✅ Audit PASSED", info: infos }, null, 2)
  : JSON.stringify({ failed: issues.length, issues, info: infos }, null, 2);
```

## Build patterns

### Single component

```js
const comp = figma.createComponent();
comp.name = "Card / User preview";
comp.layoutMode = "VERTICAL";
comp.primaryAxisSizingMode = "AUTO";
comp.counterAxisSizingMode = "FIXED";
await bindFill(comp, VARS.cardBg);                     // white bg
await bindFrameSpacing(comp, { pad: "lg", gap: "s" }); // 16px pad, 8px gap
await bindRadius(comp, "lg");                          // 8px radius
comp.resize(280, 100);

// Realistic content
const avatar = await makeInstance(COMPONENTS.avatar, { "Size": "Medium" });
comp.appendChild(avatar);
const name = await makeText("Sarah Chen", "semibold/body-m", "textStrong");
comp.appendChild(name);
const role = await makeText("Compliance Officer", "regular/body-s", "textSubtle");
comp.appendChild(role);

// Place in Local components home (for local use) or DS file's target page
const home = await getLocalComponentsHome();
home.appendChild(comp);
positionInHome(home, comp);
```

### Variant set (multiple properties)

Build each variant as a standalone COMPONENT, then combine:

```js
const variants = [];
for (const size of ["Small", "Medium", "Large"]) {
  for (const state of ["Default", "Hover", "Disabled"]) {
    const v = figma.createComponent();
    v.name = `Size=${size}, State=${state}`;
    v.layoutMode = "HORIZONTAL";
    // ... build variant with size + state-specific styling ...
    variants.push(v);
  }
}

const set = figma.combineAsVariants(variants, figma.currentPage);
set.name = "*Status Indicator*";
// figma.combineAsVariants auto-derives property definitions from variant names
```

### Sub-component (internal helper)

Use when a larger component needs a reusable part. Name with slash (no asterisks):

```js
const cell = figma.createComponent();
cell.name = "Card / User preview / Row";   // internal — no asterisks
```

## Placement — Local components home

For local-file components (Rule 7.9 from sumsub-mockup), always use the helpers:

```js
const home = await getLocalComponentsHome();   // finds/creates
                                               //   Page "Local components"
                                               //   SECTION "Components (by Claude)"
home.appendChild(comp);
positionInHome(home, comp, { cellW: 400, cellH: 300 });
```

For DS library files — user tells you which page and section. No `(made by Claude)` suffix on DS contributions.

## Naming cheat-sheet

| Pattern | Meaning | Example |
|---|---|---|
| `*Name*` | Published component set (top-level, appears in Assets) | `*Status*`, `*Modal Basic*` |
| `Name / Variant` | Variant of a set (no asterisks in variant name) | `Status / Green (Approved)` |
| `Name / Subpart` | Internal sub-component (not published) | `Card / Row / Avatar` |
| `.Name` (leading dot) | Deeply internal, hidden from Assets panel | `.Card / Row Content` |

Match the `*`/`.`/slash convention exactly — Figma's Assets panel uses it to categorize.

## Workflow

1. **Pre-flight version check** (pre-flight block at top).
2. **Ask user** if any of the 4 scope items (purpose / location / single vs set / naming) are unclear.
3. **Read references** you need:
   - `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md` — Plugin API pitfalls
   - `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md` — variable keys, text style keys, icon keys
   - `${CLAUDE_PLUGIN_ROOT}/reference/color-usage.md` — which semantic token applies where
4. **Import** all variables / text styles / parent components you'll use (pre-cache sync-only — avoid "Parent not found").
5. **Build** the component (or each variant separately, then `combineAsVariants`).
6. **Place** in Local components home or user-specified location.
7. **Run the audit** above. Iterate until `✅ PASSED`.
8. **Share the link** with the user. Include: component/set ID, number of variants, and the page/section where it lives.

---

## What this skill is NOT for

- **Full page / screen mockups** — use `/sumsub-design:sumsub-mockup`.
- **Component documentation pages** — use `/sumsub-design:sumsub-specs-docs`.
- **Reviewing an existing component** — use `/sumsub-design:sumsub-design-review`.
- **Flow-specific canvas-node components** — those live in the Flow Builder library; contact DS team before adding.
