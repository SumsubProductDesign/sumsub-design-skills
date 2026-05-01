# Billing — Layout Pattern

> Source file: `kHQyyYdPZjEyrSahRmBLUr`
> Scan date: 2026-04-27 (teammate build) + 2026-04-30 (re-verified)
> Standard Pattern 1 (1440 + Sidebar 257) with Cards Row + Period Row + Table.

---

## Pattern — Standard list with metric cards above table

```
Root (1440 × 900, fill #ffffff)
├── *Sidebar*  (257 × 900, x=0, Type=Billing, Collapsed=False)
└── Main (1183 × 900, VERTICAL, x=257)
    ├── *Header*  (1183 × 64, Title="Billing")
    └── Content (1183 × 836, fill semantic/background/neutral/inverse/normal #ffffff)
        ├── Cards Row    (1143 × 124)              ← 3 metric cards horizontally
        ├── Period Row   (1143 × 60)               ← Select Inline (period) + Filters group
        └── *Table Starter*  (1143 × 550)          ← service usage table
```

Layout sum: `257 + 1183 = 1440` ✓
Content padding: 20px (skill-built; TM Settings canonical uses 24px)

---

## Cards Row (3 metric cards)

Each card contains 3 TEXT nodes:
1. Label — Geist Medium 12 (e.g. "TOTAL AMOUNT DUE", "NEXT INVOICE", "ACCOUNT BALANCE")
2. Value — Geist Medium 16 (e.g. "$5,002.33", "May 1, 2026", "$10,000.00")
3. Subtitle — Geist Regular 12 (e.g. "April 2026", "Auto-payment enabled", "Enterprise plan")

**Custom TEXT, not a packaged organism** — built per-screen with bound text styles + semantic color tokens.

---

## Period Row (filter strip above table)

Contains 11 `*Select Inline*` instances total:
- 1 inside `*Filters group*` (Period selector — current month)
- 9 in `.Top Toolbar / Filter` (Service type / Country / Applicant type / Status / Date from / Date to / Currency / Check type, etc.)
- 1 in export area (CSV/PDF format selector)

Native Input labels — `Sort by:`, `Status`, `All`, etc. — should be configured via `Label text` instance property, NOT via external sibling TEXT.

---

## Table — Service usage

Columns: Service · Checks used · Unit price · Total · Period · Actions

Internal Top Toolbar of `*Table Starter*` is **hidden** via `Toolbar#736:139 = false` (the Period Row above takes its role).

---

## Header CTA

Header has Buttons enabled, primary CTA "Export report" overridden onto the right-side action button slot.

---

## Source pages

| Page | ID | Purpose |
|---|---|---|
| Prod | `2678:272959` | main billing dashboard |

---

## Notes & gotchas

- **Sidebar variant `Type=Billing`** sets the Billing section as the visible parent in the nav, but does NOT highlight the active sub-item — known limitation per audit 7.40 (some Sidebar variants don't expose `Selected` property).
- **Cards Row uses raw custom TEXT** with bound text styles — Geist Medium/Regular sizes 12/16. Don't substitute Inter or use raw fontSize.
- **Period Row Select Inlines** all use the native Label TEXT inside the component (not external sibling TEXT).
- **Spacing variable `spacing/xl`** in this file overrides to 20px (instead of canonical 24). Bound correctly to the variable but pixel value differs — file-level override accepted, audit 7.17 may flag if strict 24 expected.
