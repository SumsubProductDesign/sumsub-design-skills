# Reports — Layout Pattern

> Source file: `zYDE1v0b5Zg08tZqVvhgHb`
> Scan date: 2026-04-30 (+ v3.80 correction from Sim 12 canonical recheck)
> Single pattern: collapsed-sidebar + Header + Body.

---

## Pattern — Sidebar 52 + Header + Body

⚠️ **Corrected v3.80** from sim-12 canonical recheck: Reports DOES use a standard `*Header*` (variant `Production=True, Version=Old, Type=Generic`, key `2689f7829a20be7044c1cf097a434e5c67ac123b`). Previous doc said "no Header" — that was wrong.

```
Root (1440 × 900+, fill #ffffff)
├── *Sidebar*  (52 × 900+, x=0)        ← COLLAPSED variant (Type=Reports, Collapsed=True), key 1218d0ada51812d45b0e637a5596f364babde608
├── *Header*   (1388 × 64, x=52, y=0)  ← variant Production=True, Version=Old, Type=Generic
└── Body       (1388 × 836, x=52, y=64)
    └── *Table Starter* (file-local Reports table organism is unpublished — fall back to Base Table Starter, set Toolbar#736:139=false if external toolbar above)
```

Layout sum: `52 + 1388 = 1440` ✓
Body height: `900 - 64 = 836` (header eats 64 from top)

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
