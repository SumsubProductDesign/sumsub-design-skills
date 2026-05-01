# Global Settings — Layout Patterns

> Source file: `ZBP8mJTQIjAJizXhEmRkLc`
> Scan date: 2026-04-29
> Two patterns: settings-list with sub-tabs (1920+Sidebar) and verification subsections (1920+Sidebar+Header 120).

---

## Critical canvas dimensions

**Global Settings uses 1920-wide canvas** (NOT 1440). Same as TM Transaction detail, Appearance, AML screening Vendors. **Sidebar 276** (settings family).

Layout sum: `276 + 1644 = 1920` ✓ on every page.

---

## Pattern A — Sub-tabs only (no Header)

> Page `6456:131497` "General"

```
Root (1920 × 900, fill #ffffff)
├── *Sidebar*  (276 × 911, x=0, y=0)
└── Body      (1644 × 900, x=276, y=0)
    ├── *Tab Button*           (370 × 40, sub-tabs row)
    ├── Tab Basic / Item       (24 × 32, individual tabs)
    └── (form content for selected sub-tab)
```

**Confirmed dimensions** from `1. General`:
- Sidebar: 276 × 911
- Body: 1644 × 900 at x=276 — content area
- Tab Button (sub-tab section selector): 370 × 40 at (303, 148)
- Tab Basic / Item: at (301, 192)

**No `*Header*` in Pattern A** — sub-tab navigation is built directly into Body using `*Tab Button*` component.

---

## Pattern B — Verification subsections (with 120px Header)

> Pages `11135:422719` (User verification), `11135:422720` (Business verification), `11135:422722` (AML screening), `11135:422723` (Data comparison)

```
Root (1920 × 900+, fill #ffffff)
├── *Sidebar*  (276 × 911, x=0, y=0)
├── *Header*   (1644 × 120, x=276, y=0)         ← TALL Header (NOT standard 64)
└── Frame 270989628  (1644 × 791+, x=276, y=109 or 120)
    └── (verification settings content)
```

**Confirmed dimensions** from `2. KYC – ID verification`:
- Sidebar: 276 × 911
- Header: 1644 × **120** at (276, 0) — taller than standard
- Content frame: 1644 × 780 at y=120 (or 109 in some screens — 11px overlap, edge case)

**Header 120 height** = title + subtitle + breadcrumb back-link + action buttons stacked. Same pattern as KYB Levels' `Headers` component (also 120 high).

---

## Pattern Decision Tree

```
Which Global Settings page?
├── General (default settings overview with tabbed sections)
│   → Pattern A (Sidebar 276 + Body 1644 with Tab Button rows)
│
└── User verification / Business verification / AML / Data comparison
    → Pattern B (Sidebar 276 + Header 1644×120 + Frame 1644×scroll)
```

---

## Source pages

| Page | ID | Pattern |
|---|---|---|
| Global settings (overview) | `11168:100660` | parent index |
| General | `6456:131497` | A — sub-tabs without Header |
| User verification | `11135:422719` | B — Header 120 + content |
| Business verification | `11135:422720` | B — Header 120 + content |
| AML screening | `11135:422722` | B — Header 120 + content |
| Data comparison | `11135:422723` | B — Header 120 + content |

---

## Notes & gotchas

- **1920 canvas, NOT 1440**.
- **Sidebar 276, NOT 257**.
- **Header is 120 high in Pattern B**, not standard 64. Don't substitute the generic 64-tall Header.
- **General page (Pattern A) has no Header** — Tab Button rows live directly in Body. If you import standard Header, you'll have two title areas.
- **Y position quirk**: User verification frame samples showed Frame at y=109 in one screen (instead of 120). Likely an 11px overlap by design — verify by inspecting the specific canonical you're matching.
