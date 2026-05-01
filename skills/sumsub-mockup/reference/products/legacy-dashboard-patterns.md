# Legacy Dashboard Patterns (Statistics / Dev space / Dashboard Home Old)

> Source files:
> - Statistic and Analytics: `aBdA1dvIhBa1vcdehIHpzg`
> - Dev space: `ru7I1EsmuyipGKsVOSY6d2`
> - Dashboard Home page: `sdve0hJDYkyGbXIswxP36Z`
>
> Scan date: 2026-04-30
> **These files use legacy navigation components** (`*Navigation menu*` 281 wide, or `sidebar / menu` 80 wide). Don't reproduce these dimensions in NEW work — use modern `*Sidebar*` 257 or 276 instead.

---

## Pattern P6a — Legacy `*Navigation menu*` 281

> Used by: **Statistics & Analytics**, **Dev space**

```
Root (1440 or 1920 × scroll, fill #ffffff)
├── *Navigation menu*  (281 × scroll, x=0)        ← legacy, deprecated
└── Content            (1159 or 1639 × scroll, x=281)
```

**Confirmed dimensions:**
- Statistics: 1440 × 1182, Navigation menu 281 + Content 1159
- Dev space: 1920 × 1606, Navigation menu 281 + Frame 1639 (with Statusbar 1575 inside at x=313)

**Reading these pages:** ok to read for canonical content references, but **don't replicate the 281px nav** in new mockups. Modern equivalent: `*Sidebar*` Type=Statistics or Type=Dev space, width 257 or 276.

---

## Pattern P6b — Legacy `sidebar / menu` 80 wide (very old)

> Used by: **Dashboard Home page (Dashboard Old page)**

```
Root (1280 × 720, fill #ffffff)
├── sidebar / menu   (80 × 720, x=0)              ← icon-only legacy nav
├── statusbar        (1136 × 40, x=112, y=16)
├── sns-header       (1136 × 84, x=112, y=56)
├── Banner           (1136 × 134, x=112, y=174, optional)
└── statistics       (1136 × 392, x=112, y=340)
```

**Canvas 1280** — pre-2024 breakpoint. **80px sidebar** + 32px implied gap (content starts at x=112).

The Dashboard Homepage file has multiple WIP pages: `🛠 Dashboard Homepage`, `🛠 Dashboard redesign`. None on prod. The `🟢 Dashboard Old` page is the legacy 1280-wide layout.

---

## What to do when asked to build a "Statistics" / "Dev space" / "Home" mockup

1. **Ask user**: "build faithful to legacy canonical (281 nav / 80 nav / 1280 canvas) or build modern equivalent?"
2. If faithful → match the legacy canonical exactly (this doc covers dimensions).
3. If modern → use `*Sidebar*` 257 (modern dashboard) or 276 (Settings family) and rebuild from layout-patterns.md Pattern 1.

**Default for new work:** modern. The legacy patterns are documented here only for fidelity to existing canonical files.

---

## Source pages

| File | Page | ID | Status |
|---|---|---|---|
| Statistic and Analytics | Design | `1:104` | active legacy |
| Statistic and Analytics | Old | `308:35962` | older legacy |
| Dev space | API Health / Overview | `3:158` | active legacy |
| Dev space | webSDK settings | `236:112567` | active legacy |
| Dev space | Integrations | `3:157` | active legacy |
| Dashboard Home page | 🟢 Dashboard Old | `105:0` | active legacy |
| Dashboard Home page | 🛠 Dashboard Homepage / redesign | `7317:33847` / `8884:26845` | WIP redesign |
| Dashboard Home page | Pop up with NDA / Data Protection | `9437:16326` etc. | feature flow |

---

## Notes

- **No new work should reproduce 281 or 80-wide nav** unless explicitly asked to update an existing screen.
- When the user references "Statistics page" or "Dev space" without specifying legacy vs modern, ask before building — don't assume modern by default if the canonical is legacy.
- `*Navigation menu*` and `sidebar / menu` are NOT in modern Base components / Organisms libraries — they're file-local instances or pre-redesign components. Don't try to import them via `importComponentSetByKeyAsync` for new work.
