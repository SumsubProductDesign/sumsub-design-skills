# Reports — Layout Pattern

> Source file: `zYDE1v0b5Zg08tZqVvhgHb`
> Scan date: 2026-04-30
> Single pattern: collapsed-sidebar editor (1440 + Sidebar 52 + Body 1388).

---

## Pattern — Editor with collapsed sidebar

```
Root (1440 × 900+, fill #ffffff)
├── *Sidebar*  (52 × 900+, x=0)        ← COLLAPSED variant (icon-only)
└── Body       (1388 × 900+, x=52)
    └── (reports list / report detail content)
```

Layout sum: `52 + 1388 = 1440` ✓

**No `*Header*`** — Body contains its own internal chrome (title row + actions + filters).

Identical structure to:
- AML Resolution rule chain editor
- Blueprint editor (CM Pattern C, but with custom Blueprint header 112 instead of no header)

---

## Source pages

| Page | ID | Purpose |
|---|---|---|
| Reports table | `2:8` | list of reports |
| Custom CSV export | `245:253` | CSV export config |
| Report page | `3131:90995` | single report detail |

---

## Notes & gotchas

- **Sidebar 52 (collapsed), NOT 257 or 276** — Reports is editor-flavor, uses minimal nav.
- **No standard `*Header*`** — Body has its own chrome. If you import the standard Header, you'll have duplicate page titles.
- Same pattern as AML Resolution chain — if you've built that, the Reports skeleton is identical.
