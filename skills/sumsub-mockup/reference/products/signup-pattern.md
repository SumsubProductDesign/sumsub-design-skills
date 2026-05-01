# Sign up — Layout Pattern

> Source file: `sg6CCKd31nOQmW56Od6J9q`
> Scan date: 2026-04-30
> Auth flow split layout — marketing image left + form right.

---

## Pattern — 1920 split (Image 1120 + Drawer 800)

```
Root (1920 × 1080, fill #ffffff)
├── Image for form    (1120 × 1080, x=0)         ← marketing visual / illustration
└── *Drawer*          (800 × 1080, x=1120)        ← sign-up form (permanent right column)
```

Layout sum: `1120 + 800 = 1920` ✓

**No Sidebar, no Header** — auth flow is purely the marketing-visual + form pair.

---

## Comparison to other split patterns

| Pattern | Left | Right | Use case |
|---|---|---|---|
| Sign up (this file) | Image 1120 | Form 800 | Auth / onboarding |
| Appearance customisation | Settings 727 | Preview 1193 | Live preview editor |
| Report builder (CM Pattern D) | Content 1040 | Drawer 400 | Form builder + reference |

Sign up uses **Image-heavier** split (1120/800), while Appearance leans towards **Preview-heavier** (727/1193).

---

## Notes & gotchas

- **`*Drawer*` here is a permanent right column**, NOT an overlay. No tint, no scrim. Don't try to centre or fade-in.
- **No tint background** — the page is just the two halves side-by-side.
- **Image at x=0** is full-bleed marketing visual (illustration / brand photo). Component name "Image for form".
- **Drawer at 800 wide** — same width as Cross-Check Rules Advance test drawer, but here it's permanent (not overlay).
