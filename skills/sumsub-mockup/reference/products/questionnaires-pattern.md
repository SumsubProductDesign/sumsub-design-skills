# Questionnaires (Redesign) — Layout Patterns

> Source file: `HHrYxiPMXjuiFYAklFBlsL`
> Scan date: 2026-04-28
> Two layout patterns identified: List page (with Sidebar) and Builder/editor (no Sidebar, full-screen header).

---

## Critical canvas dimensions

**Questionnaires uses 1280-wide canvas, NOT 1440.** This is a hold-over from Sumsub Dashboard's older breakpoint. Don't auto-default to 1440 like other dashboard products.

| Pattern | Canvas | Sidebar | Notes |
|---|---|---|---|
| List page | 1280 × scroll | 276px (NOT 257) | Settings-style sidebar — same as TM Settings/Rules |
| Builder/editor | 1280 × scroll | none | Uses `*Header Full Screen Page*` 1280×64 |

**276 vs 257 sidebar:** Questionnaires uses the wider 276px sidebar variant, same as TM Settings. Auditing `productContext === "questionnaires"` should validate sidebar width is 276 if a sidebar is present.

---

## Pattern A — Questionnaires List

> Page `4161:433030` "Questionnaires list"

```
Root (1280 × scroll, NONE layout, fill #ffffff)
├── *Sidebar*  (276 × scroll, x=0, y=0, Type=Settings or similar)
└── Main area (x=276)
    ├── *Header*           (1004 × 116, x=276, y=0)   ← full content-area width
    └── *Table Starter*    (940 × scroll, x=308, y=140)  ← 32px content padding
```

**Confirmed dimensions** from `Screen 565`:
- Sidebar: 276 wide (276 + 1004 = 1280 ✓)
- Header: 1004 × 116 at x=276 — taller than typical 64 because it includes title + subtitle + CTA
- Table Starter: 940 wide at x=308 — 32px left padding inside content area
- Page height: 1061 (or scrolling to fit table content)

> **Common mistake:** assuming Questionnaires uses 1440 canvas with 257 sidebar. Both wrong — 1280 + 276.

---

## Pattern B — Question types & Builder (full-screen, no Sidebar)

> Pages `4161:962597` (Question types and advanced settings), `4161:977737` (Tooltips), `4832:2036540` (Conditions)

```
Root (1280 × scroll, NONE layout, fill #ffffff)
├── *Header Full Screen Page*  (1280 × 64, x=0, y=0)   ← full-width chrome with breadcrumbs/back
└── Content                    (1280 × scroll, x=0, y=64)
    └── (form / settings / question editor blocks)
```

**Confirmed dimensions** from `Screen 637` (Question types):
- *Header Full Screen Page* INSTANCE: 1280 × 64 at top
- Content FRAME: 1280 × 1551 (scrolling) at y=64
- Total page height: 1615 (varies — 1494, 1610 across screens)

**Tooltip overlays:** demos place `*Tooltip*` instances absolutely positioned over content with adjacent `Cursor` instances showing the trigger point.

---

## Pattern Decision Tree

```
What kind of Questionnaires screen?
├── Listing all questionnaires (admin overview)
│   → Pattern A (Sidebar 276 + Header 116 + Table 940)
│
└── Editing a questionnaire / Question types / Conditions / Tooltips
    → Pattern B (Header Full Screen Page 1280×64 + Content 1280×scroll)
```

---

## Source pages (reference)

| Page | ID | Purpose |
|---|---|---|
| Onboarding screen | `4441:87280` | Empty state when no questionnaires exist |
| Questionnaires list | `4161:433030` | Pattern A — admin list with table |
| Question types and their advanced settings | `4161:962597` | Pattern B — editor for question definitions |
| Tooltips | `4161:977737` | Pattern B — tooltip authoring |
| Conditions | `4832:2036540` | Pattern B — conditional logic editor |
| Condition's operators | `4147:926876` | Pattern B sub-editor |
| Paid types of question | `4156:458708` | Pattern B paid-tier question types |
| Countries Risk Scoring | `5247:213618` | Pattern B risk-scoring config |
| Adaptability and Specs | `4177:1399600` | Documentation page |

---

## Components

> Components page `1:151` — full scan deferred (too many components for single inspection). Sample below; expand on demand.

Key Questionnaires-specific components live in this file's Components page. For shared atoms (Input, Select, Checkbox, Button, Table Starter etc.) use Base components / Organisms libraries — see `design-system.md`.

---

## Notes & gotchas

- **1280 canvas, NOT 1440** — repeating because this is the recurring mistake. Questionnaires is older and never moved to 1440.
- **276 sidebar, NOT 257** — same as TM Settings/Rules. If you place a 257 Sidebar, the Header at x=257 width=1023 would be 19px wider than canonical.
- **Header height 116** on list page — taller than standard 64 because it contains title + subtitle + CTA buttons inline. Don't try to set it to 64.
- **No Sidebar in editor pages** — Pattern B uses `*Header Full Screen Page*` for breadcrumbs+back navigation. Don't add Sidebar.
