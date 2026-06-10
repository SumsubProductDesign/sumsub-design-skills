# PoA Settings — Layout Pattern

> Source file: `yEkxS5YVjrLtlJkuUEusHo`
> Scan date: 2026-04-29
> Single pattern: full-screen builder/editor with custom 120px Header.

---

## Critical canvas dimensions

**PoA Settings uses 1280-wide canvas, NOT 1440.** Same older breakpoint as Questionnaires. **No Sidebar** anywhere in this product — it's a full-screen settings/configuration flow.

---

## Pattern — Full-screen builder (1280 + Header 120 + centered Page Content 1084)

> Page `614:519053` "Detailed UI / UX"
>
> 🔄 **Updated v3.167 (2026-06-10): canonical drift confirmed** (parent frame of `2276:1279935`). Content is NOT full-width 1280 — it's the same **centered Page Content 1084** pattern as AML Vendors / Global Settings: main organism 640 + side column 380.

```
Root (1280 × scroll, NONE layout, fill #ffffff)
├── *Header* (Organisms set 387e2cf6…, variant Type=Fullscreen)  (1280 × 120)   ← y=0, custom 120 (NOT standard 64!)
└── Frame                      (1280 × 2217, scroll)     ← y=120
    └── Page Content           (1084 × scroll @ x=98 — centered, 98/98 side margins)
        ├── Content (PoA lib organism d15de57b48…, 640 wide)     ← preset config blocks
        └── .Side content      (380 wide @ x=704)
            ├── Tip (28f7adf163…, 380×296)
            └── Levels (c2abf237de…, Preset is used=False, 380×176 @ y=308)
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
   → ALWAYS this pattern: 1280 canvas, Header (Fullscreen variant) 1280×120,
     Page Content 1084 centered (main 640 + side 380). No Sidebar.
     Modal overlays use Tint + Modal Basic Small (540 wide).
```

---

## Notes & gotchas

- **1280 canvas, NOT 1440.**
- **Header is 120px, NOT 64px** — `*Header Full Screen Page*` variant with extra height for title+breadcrumbs+actions inline.
- **No Sidebar at all** — PoA Settings is a focused configuration flow, not a navigation product.
- **Modal Basic Small (540 wide)** — narrower than typical 600. Centered at x=370.
- **Tint is RECTANGLE not INSTANCE** — observed in this file (one-off; usually `Tint` component). Acceptable but inconsistent with newer files using the proper Tint component.
