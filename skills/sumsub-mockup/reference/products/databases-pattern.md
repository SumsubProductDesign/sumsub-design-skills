# Databases (Active / Available Products) — Layout Patterns

> Source file: `AFS89B3cduj44GvV8ZHy7j` (Database-status)
> Scan date: 2026-04-29
> File contains marketing/explainer renders inside a browser-chrome wrapper. Unique pattern.

---

## Critical context

**Databases файл — это не raw dashboard mockup**, а маркетинговые/демо рендеры с **Browser & URL Controls** wrapper'ом сверху, имитирующим вкладку браузера. При сборке копируй чистый dashboard внутри (Sidebar + Header + Content), а Browser chrome — опционально.

---

## Pattern A — Active Products (1920 with browser chrome)

> Page `0:1` "Active Products"

```
Root (1920 × 1080, fill #ffffff)
├── Browser & URL Controls   (1920 × 80, INSTANCE)        ← y=0, browser tab/URL bar fake
├── *Sidebar* / category      (276 × 1000, x=0, y=80)     ← starts BELOW browser chrome
├── *Header*                  (1639 × 64, x=281, y=80)    ← x=281 (Sidebar 276 + 5px gap?)
├── Legend                    (323 × 24, x=313, y=168)    ← optional explanatory legend
└── Rows / Table             (1575 × 444, x=313, y=208)   ← active database rows
```

**Confirmed dimensions** from `1920 Basic IIII`:
- Browser chrome: 1920 × 80
- Sidebar (`.Sidebar category`): 276 × 1000 at (0, 80) — **starts at y=80 below browser chrome**
- Header: 1639 × 64 at (281, 80) — note x=281 (slight offset from x=276)
- Rows component: 1575 × 444 at (313, 208) — content padded ~32px from sidebar

**Layout sum:** 281 + 1639 = 1920 ✓ (header alignment)

---

## Pattern B — Available Products (1440 with browser chrome)

> Page `1123:30339` "Available Products"

```
Root (1440 × 860, fill #ffffff)
├── Browser & URL Controls   (1440 × 80, INSTANCE)
├── *Sidebar* / category      (276 × 780, x=0, y=80)
├── *Header*                  (1164 × 64, x=276, y=80)
└── Table                    (1164 × 564, x=276, y=144)   ← table starts at y=144 (below header at y=80+64)
```

**Confirmed dimensions** from Available Products:
- Browser chrome: 1440 × 80
- Sidebar: 276 × 780 at (0, 80)
- Header: 1164 × 64 at (276, 80)
- Table: 1164 × 564 at (276, 144)
- Layout sum: 276 + 1164 = 1440 ✓

**Multiselect overlay** (y=212) demonstrates filter dropdowns above the table.

---

## Sidebar variant

`.Sidebar category` is an **internal Sidebar variant** (NOT the standard `*Sidebar*` from Organisms). Width 276 (settings family).

**Source file local component** — when reproducing outside this file, use the standard `*Sidebar*` from `Base components [Dashboard UI Kit]` Type=Settings or matching variant.

---

## Pattern Decision Tree

```
What kind of Databases screen?
├── Active products list (with active database statuses) on 1920 canvas
│   → Pattern A (Browser chrome 80 + Sidebar 276 + Header 1639 + Rows component)
│
└── Available products list (catalog of databases) on 1440 canvas
    → Pattern B (Browser chrome 80 + Sidebar 276 + Header 1164 + Table)
```

---

## Notes & gotchas

- **Two different canvas widths in one file** — Active Products uses 1920, Available Products uses 1440. Match the page being reproduced.
- **Browser chrome adds 80px top offset** — all dashboard chrome shifts down by 80px from y=0. If reproducing without browser frame, just drop the Browser & URL Controls instance and start dashboard at y=0.
- **Sidebar 276, NOT 257** — settings family canvas.
- **Active Products has a slight 5px gap** between Sidebar (ends at x=276) and Header (starts at x=281). Available Products has no gap (Header starts at x=276).
- **Both pages use white background** (#ffffff).
