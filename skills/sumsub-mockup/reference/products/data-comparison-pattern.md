# Data Comparison (Cross-Check Rules) — Layout Patterns

> Source file: `rgIhU708ZMELkA8cwGNpk8`
> Scan date: 2026-04-29
> Two patterns: settings list (1440+276 Sidebar+Tabs) and Advanced rule test (Drawer 800 wide).

---

## Critical canvas dimensions

**1440 canvas** (standard). **Sidebar 276** (settings family). Layout sum: `276 + 1164 = 1440` ✓.

This is similar to TM Settings/Rules (also 1440+276) — Cross-Check Rules is structurally a settings configuration product.

---

## Pattern A — Cross-Check Rules main (Settings list + Tabs)

> Page `245:253` "Cross-Check Rules", `2:8` "Basic: Test modes"

```
Root (1440 × 900-953, fill #ffffff)
├── *Sidebar*  (276 × 911, x=0, y=0)
└── Content (Header)  (1164 × 900, x=276, y=1)
    ├── *Tab Button*    (370 × 40, sub-tabs)
    ├── Tab Basic / Item
    └── (rule list / preset configuration)
```

**With modal overlay (Test modes):**
```
+ Tint (INSTANCE)               (1440 × 952, x=0, y=1)    ← scrim
+ (modal/drawer over the page)
```

**Confirmed dimensions** from `CCR-Preset`:
- Sidebar: 276 × 911
- Content: 1164 × 900 at (276, 1)
- Tint: 1440 × 952

> **Note y=1 quirk:** Sidebar starts at y=0 with height 911, Content starts at y=1 (1px below) with height 900. This 1px offset is preserved across canonical samples — possibly a stroke alignment artifact. Match exactly when reproducing.

---

## Pattern B — Advanced rule test (Pattern A + wide Drawer 800)

> Page `3134:95422` "Advance: Test rule"

```
Root (1440 × 980, fill #ffffff)
├── *Sidebar*    (276 × 980, x=0, y=0)
├── Content      (1164 × 900, x=276, y=1)
├── Tint (INSTANCE)         (1440 × 992, x=0, y=0)
├── *Drawer Basic* (FRAME)  (800 × 1604, x=640, y=0)    ← WIDE drawer (NOT 400!)
└── Advance (INSTANCE)      (800 × 980, x=640, y=0)     ← test rule UI sits inside drawer
```

**Critical detail — 800px Drawer:**

`*Drawer Basic*` here is **800 wide**, double the standard 400. Used for Advanced test-rule editor that needs more horizontal space (form + preview side-by-side inside the drawer).

x=640 means: 1440 - 800 = 640 (right-aligned). Drawer slides in from right, takes 800 of the 1440-width screen.

**Drawer height 1604** — taller than viewport, scrollable inside.

---

## Pattern Decision Tree

```
What kind of Cross-Check Rules screen?
├── Listing rules / Basic test modes / AP preset results
│   → Pattern A (Sidebar 276 + Content 1164 + sub-tabs, optional modal)
│
└── Advanced test rule editor
    → Pattern B (Pattern A + 800-wide Drawer Basic from right edge)
```

---

## Source pages

| Page | ID | Pattern |
|---|---|---|
| Cross-Check Rules | `245:253` | A — main rules page |
| Basic: Test modes | `2:8` | A — basic modal-driven flow |
| Advance: Test rule | `3134:95422` | B — wide drawer |
| AP: Preset results | `2:9` | A — preset config |

---

## Notes & gotchas

- **1440 canvas + 276 Sidebar** = settings family on standard width.
- **1px y offset** between Sidebar (y=0) and Content (y=1) — preserve when reproducing.
- **800-wide Drawer** is unique to Advanced test rule. Don't use this width for other drawers — standard is 400 (Pattern 1 from layout-patterns.md).
- **Tint extends slightly beyond canvas height** — observed Tint 1440×952 inside 953 root. Acceptable.
