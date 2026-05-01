# AML Screening — Layout Patterns

> Source file: `3N6oxnOdDfsULIQ5teXKbw`
> Scan date: 2026-04-29
> Three patterns in one file — Vendors (1920+276), Resolution chain (collapsed sidebar 52), Ongoing monitoring (1920+276).

---

## Critical canvas dimensions

AML Screening file **mixes two canvas widths**:
- **1920** for Vendors / Ongoing monitoring (Settings family)
- **1440** for Resolution rule chain (collapsed sidebar editor)

Sidebar is **276** in Pattern A, **52** (collapsed) in Pattern B.

---

## Pattern A — Vendors / Ongoing monitoring (1920+276 Settings)

> Pages `2:9` "Vendors settings" (Comply advantage etc.), `3130:213974` "Ongoing monitoring"

```
Root (1920 × 900+, fill #ffffff)
├── *Sidebar*  (276 × 911, x=0, y=0)
└── Body      (1644 × 900, x=276, y=0)
    ├── *Tab Button*       (370 × 40, sub-tabs)
    ├── Tab Basic / Item
    └── (vendor settings / ongoing monitoring config)
```

**Confirmed dimensions** from `5.2. Comply advantage`:
- Sidebar: 276 × 911
- Body: 1644 × 1163 at x=276 (page scrolls to 1163)
- Tab Button: 370 × 40 at (303, 148)
- Tab Basic / Item: at (301, 192)
- Layout sum: 276 + 1644 = 1920 ✓

Same as Global Settings Pattern A — no separate Header, sub-tabs live inside Body.

---

## Pattern B — Resolution rule chain (collapsed sidebar 52, no header)

> Pages `2:8` "Resolution rule chain", `3464:200717` "Test Resolution rule chain"

```
Root (1440 × 955+, fill #ffffff)
├── *Sidebar*  (52 × 955, x=0, y=0)            ← COLLAPSED variant (NOT 276)
└── Body      (1388 × 955, x=52, y=0)          ← takes remainder of 1440
    └── (rule chain editor / chain visualization)
```

**Confirmed dimensions** from `AML rules`:
- Sidebar: **52** × 955 (collapsed icon-only variant)
- Body: 1388 × 955 at x=52
- Layout sum: 52 + 1388 = 1440 ✓

**No `*Header*`** — rule chain editor uses Body chrome internally. Page is full-screen editor with collapsed sidebar nav for quick context switching.

This pattern matches Blueprint editor (CM Pattern C) and KYB Levels Pattern B variant — collapsed-sidebar editor flow.

---

## Pattern Decision Tree

```
What kind of AML Screening screen?
├── Vendors settings (Comply advantage, GBG, etc.) / Ongoing monitoring config
│   → Pattern A (1920 + Sidebar 276 + Body 1644 with sub-tabs)
│
├── Resolution rule chain editor (rule list + visual chain)
│   → Pattern B (1440 + collapsed Sidebar 52 + Body 1388, no Header)
│
└── Test Resolution rule chain
    → Pattern B (same as Resolution chain)
```

---

## Source pages

| Page | ID | Pattern | Canvas |
|---|---|---|---|
| Global settings overview | `245:253` | parent index | — |
| Vendors settings | `2:9` | A | 1920 |
| Resolution rule chain | `2:8` | B | 1440 |
| Test Resolution rule chain | `3464:200717` | B | 1440 |
| Ongoing monitoring | `3130:213974` | A | 1920 |

---

## Notes & gotchas

- **Two canvas widths in one file** — Vendors/Ongoing are 1920, Resolution chain is 1440. Match the page being reproduced.
- **Two Sidebar widths** — 276 for Pattern A, 52 (collapsed) for Pattern B. Don't substitute one for the other.
- **No `*Header*` on either pattern** — both use Body-internal chrome. Sub-tabs in Pattern A; rule editor in Pattern B.
- **Ongoing monitoring page sometimes has duplicate sidebars** — observed `Menu` instance (281×900) AND `*Sidebar*` (276×911) at x=0. Likely a left-over migration artifact in the canonical. When reproducing, use only `*Sidebar*` (276) and skip the legacy `Menu`.
