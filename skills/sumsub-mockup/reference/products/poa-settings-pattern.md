# PoA Settings — Layout Pattern

> Source file: `yEkxS5YVjrLtlJkuUEusHo`
> Scan date: 2026-04-29
> Single pattern: full-screen builder/editor with custom 120px Header.

---

## Critical canvas dimensions

**PoA Settings uses 1280-wide canvas, NOT 1440.** Same older breakpoint as Questionnaires. **No Sidebar** anywhere in this product — it's a full-screen settings/configuration flow.

---

## Pattern — Full-screen builder (1280 + Header Full Screen Page 120)

> Page `614:519053` "Detailed UI / UX"

```
Root (1280 × 720 viewport, NONE layout, fill #ffffff)
├── *Header Full Screen Page*  (1280 × 120, INSTANCE)    ← y=0, custom 120 (NOT standard 64!)
└── Frame (Content)            (1280 × 2217, scroll)     ← y=120, full-width content
    └── (PoA preset config blocks)
```

**With modal overlay:**
```
+ tint (RECTANGLE)              (1280 × 720)              ← scrim
+ *Modal Basic*                 (540 × 228 or 254)        ← centered at x=370
+ Cursor/Pointer overlays       (24 × 24)
```

**With toast:**
```
+ *Toast*                       (340 × 80, x=916, y=56)   ← top-right corner
```

**Confirmed dimensions** from prod page samples:
- Viewport: 1280 × 720
- Header Full Screen Page: 1280 × **120** (taller than standard 64 — includes title + breadcrumbs + actions)
- Content frame: 1280 × 2217 (scrolling) at y=120
- Modal Basic Small: 540 × 228 (or 254 with extended footer) at x=370 (centered: (1280-540)/2=370)
- Toast: 340 × 80 at (916, 56) — top-right with margin

---

## Pattern Decision Tree

```
PoA Settings screen?
   → ALWAYS this pattern: 1280 canvas, Header Full Screen Page 1280×120, Content 1280×scroll
     No Sidebar. Modal overlays use Tint + Modal Basic Small (540 wide).
```

---

## Notes & gotchas

- **1280 canvas, NOT 1440.**
- **Header is 120px, NOT 64px** — `*Header Full Screen Page*` variant with extra height for title+breadcrumbs+actions inline.
- **No Sidebar at all** — PoA Settings is a focused configuration flow, not a navigation product.
- **Modal Basic Small (540 wide)** — narrower than typical 600. Centered at x=370.
- **Tint is RECTANGLE not INSTANCE** — observed in this file (one-off; usually `Tint` component). Acceptable but inconsistent with newer files using the proper Tint component.
