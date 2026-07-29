# Figma Blocks — Sumsub Dashboard UI Kit

Library of ready-made screen templates. Each block is a self-contained Plugin API JS
that uses components and variables from our design system.

## How to use

1. Read `blocks/helpers.js`
2. Read the needed block from `blocks/*.js`
3. Fill in the parameters in the block's top section
4. Run via `mcp__figma__use_figma` — `helpers.js` code + block code (concatenated)

## Available blocks

| Block | File | When to use |
|---|---|---|
| **Table Page** | `blocks/table-page.js` | Entity lists: applicants, transactions, cases |
| **Detail Drawer** | `blocks/detail-drawer.js` | Detail panel on the right, over the table |
| **Form Modal** | `blocks/form-modal.js` | Create/edit via a modal window |

## Block parameters

### table-page.js
```
PAGE_TITLE    — page heading (h4-xl semibold)
PAGE_SUBTITLE — subtitle (body-m regular), "" = hidden
CTA_LABEL     — CTA button label, "" = hidden
TAB_LABELS    — array of tab labels, [] = hidden
FRAME_NAME    — frame name in Figma
```

### detail-drawer.js
```
PAGE_TITLE      — heading of the page behind
DRAWER_TITLE    — drawer heading
DRAWER_SUBTITLE — drawer subtitle
DRAWER_SIZE     — "Narrow" | "Wide"
FRAME_NAME      — frame name in Figma
```

### form-modal.js
```
PAGE_TITLE  — heading of the page behind
MODAL_TITLE — modal heading
MODAL_SIZE  — "Small" | "Medium" | "Large"
FRAME_NAME  — frame name in Figma
```

## Screen structure (all blocks)

```
[1440 × 900]
├── Sidebar (Organisms DS, *Sidebar*)
└── Main
    ├── Header (Organisms DS, *Header*)
    │   └── Subheader (Subheader#4002:0=true) → *Tab Basic*   ← TABS GO HERE, not in Content
    └── Content
        ├── Title Row
        │   ├── Page Title (semibold/h4-xl + semantic/text/neutral/strong)
        │   └── CTA Button (*Button*, Primary, Medium)
        └── Table (*Table Starter* Redesign) / Drawer / Modal
```

> 🛑 **Page tabs = the Header's subheader** (`Subheader#4002:0=true` on the `*Header*` instance), NOT a separate `*Tab Basic*` in Content. Tab items live in the `Items wrapper` SLOT — configure them via `findAll(/Tab Basic \/ Item/)`; `.children.filter` does not see them (they remain `Tab_1…Tab_5`).

## Variables and styles

All custom TEXT and FRAME nodes use **semantic variables**:
- `VARS.*` → `figma.variables.importVariableByKeyAsync(key)`
- `TEXT_STYLES.*` → `figma.importStyleByKeyAsync(key)` + `setTextStyleIdAsync`
- Never hardcode hex!

## Known gotchas (Plugin API)

- **Always `appendChild` before `layoutSizingHorizontal/Vertical`** — these properties require the node to already be inside an auto-layout parent.
- **Do not wrap code in an IIFE** — `mcp__figma__use_figma` does not await a Promise returned from `(async () => {...})()`. Code must be at top level with direct `await`.
- **`primaryAxisSizingMode` / `counterAxisSizingMode`** accept `"FIXED"` | `"AUTO"`, not `"HUG"`.
- **Tab Basic** is a single component (`importComponentByKeyAsync`), not a component set.
- **Button text** — set via `setInstanceText(btn, "Button", label)` after `appendChild`.
- **Absolute positioning** (scrim, modal, drawer) — after `appendChild` into an auto-layout frame, set `node.layoutPositioning = "ABSOLUTE"`, otherwise the node joins the layout flow.
- **Tint/scrim always spans the full main width** — `resize(SCREEN_W - SIDEBAR_W, SCREEN_H)`, x=SIDEBAR_W. Do not clip it to the drawer or modal width.
- **Do not use Redesign components** (`MDOnxIRFpmo1PApWWULLiH`) — only Base components and Organisms.

## Adding a new block

1. Create `blocks/my-block.js`
2. Parameters go in the top section `// ─── Parameters`
3. Code — `(async () => { ... })();`
4. Use only functions from `helpers.js`: `makeFrame`, `makeText`, `makeInstance`, `bindFill`, `bindStroke`
5. Add a row to the table above

## Roadmap

- [ ] `stats-overview.js` — metric cards + charts
- [ ] `settings-page.js` — settings page with sections
- [ ] `onboarding-flow.js` — multi-step onboarding
- [ ] `empty-state-page.js` — page with an empty state
- [ ] `confirmation-modal.js` — destructive-action confirmation dialog
