# Figma Layout Patterns — Sumsub Dashboard
<!-- sourced from: Workflow Builder, Applicant page, TM list, Empty state, Case page — 2026-03-31 -->

## Key Numbers

| Element | Value |
|---|---|
| Sidebar width | **257px** |
| Header height | **64px** |
| Content area start | x=257, y=64 |
| Content area size | w=1183, h=836 |
| Standard padding | **24px** (SP.xl) |
| Inner content width | 1183 − 48 = **1135px** |
| Screen | 1440 × 900 |

---

## Pattern 1 — Standard List/Table Page

> TM list, Applicants, Cases list, Billing Invoices, etc.

⚠️ **v3.140 correction — page title + CTA live INSIDE `*Header*`, NOT in Content.** Pre-v3.140 docs showed a "Title Row" inside Content with Title Stack + CTA — that was a LEGACY layout. Modern convention: use `*Header*` properties (`Title text#3817:0`, `Subtitle text#3817:3`, `Buttons#6943:21=true` + `↪ First Button#6943:8=true`). No custom Title Row frame in Content.

```
[1440 × 900]  (content may scroll beyond 900)
├── *Sidebar*           x=0,   y=0,  w=257,  h=900+
└── Main
    ├── *Header*        x=257, y=0,  w=1183, h=64       ← Title + Subtitle + CTA via properties
    └── Content frame   x=257, y=64, w=1183, h=836+
        └── (padding 24px)
            ├── Toolbar/Filters    h≈40   → w=1135      ← Filters + search go here, NOT title
            └── Table              h=fill → w=1135
```

**Confirmed dimensions from metadata:**
- Sidebar: `x=0, y=0, w=257, h=1024` (extends for scroll)
- Header: `x=256, y=0, w=1184, h=64`
- Table: `x=256, y=64, w=1184, h=1382` (scrollable)
- Drawer (closed): `x=1467` — **27px outside the 1440 frame**, hidden off-screen

**Header property assignments:**
```js
header.setProperties({
  "Title text#3817:0": "Invoices",                  // page title
  "Subtitle#3817:6": false,                          // hide subtitle unless needed
  "Buttons#6943:21": true,                           // enable button slot
  "↪ First Button#6943:8": true,                    // show first button
});
// Set the inner first-button text/label via the button's own properties
```

**Banned (v3.140):**
- Custom FRAME named `Title Row` / `Title Stack` / `Header Row` / `Page Title` inside Content with TEXT content matching page subject + sibling *Button* — title belongs in Header
- Heading-style TEXT outside `*Header*` (caught by audit 1 since pre-v3.140)
- Any duplicate title TEXT below Header (audit fail per Sumsub convention)

---

## Pattern 2 — Detail Full-Screen Page (Applicant style)

> Applicant page — full-bleed Header + Summary + Body. **No sidebar.**

```
[1440 × scroll]
├── Page header       x=0,   y=0,   w=1440,    h=152            ← FULL WIDTH (no sidebar offset)
├── Summary/Left      x=0,   y=152, w=~360-380, h=auto           ← varies per file
└── Body/Content      x=Summary.width, y=152, w=1440-Summary.width, h=auto
    └── (padding 32px each side, padding-bottom 64)
        └── Cards     w=Body.width − 64
```

**Key metrics:**
- Page header: **152px tall**, full width 1440 from x=0
- Summary panel: width varies per canonical (360–380 observed); always height ~748 at y=152
- Body: width = 1440 − Summary.width; padding 24/32/64/32
- Layout sum: **0 + Summary.width + Body.width = 1440** ✓
- Card padding: 32px → card width = Body.width − 64

> ⚠️ **Pre-v3.118 docs claimed a 52px collapsed Sidebar.** That was based on a stale canonical. Modern AP layout has **no sidebar slot**. If you see code building `*Sidebar* Type=Applicants Collapsed=True` at x=0 — delete it.

> 📌 **Always inspect canonical first.** Per-file Summary.width / Body.width vary slightly:
> - `Di7nvHaOxXiWuDAN1oa0hK/17501:30301` (2026-05-08): Summary 380, Body 1060
> - `13395:21886/14441:253969` (v3.78 scan): Summary 360, Body 1080
> Both are valid — measure the canonical AP frame in YOUR target file before building.

---

## Pattern 3 — Case Page Layout

> Case management, detail cases — **no global Sidebar**

```
[1440 × scroll]
├── Case header       x=0,   y=0,  w=1440, h=96   ← full-width, 96px
├── Left area         x=0,   y=96, w=992,  h=804+
│   ├── Subheader/Tabs               h=56
│   └── Content (scrollable)         h=auto
│       └── (padding: 32px left)
│           └── Cards/Content        w=932
└── Right column      x=992, y=96, w=448,  h=804   ← fixed, sticky
    └── Checklist, Notes, etc.
```

**Key metrics:**
- Case header: **96px tall** (vs 152px on Applicant page)
- Left area: **992px** (992+448=1440)
- Right column: **448px** fixed
- Tabs bar: 56px, starts at y=96 inside left area
- Content padding: 32px → cards at x=32, w=932

---

## Pattern 4 — Canvas/Builder Page (Workflow Builder)

> Workflow Builder, Flow editors — has both Sidebar and canvas overlay panels

```
[1440 × 900]
├── *Sidebar*             x=0,    y=0,  w=257, h=900  (with nested nav items)
├── Builder *Header*      x=257,  y=0,  w=1183, h=64  (special variant)
├── Canvas                x=257,  y=64, w=1183, h=836
│   └── [canvas content — nodes, edges, etc.]
│
│ (all below are ABSOLUTE overlays on root frame)
├── Left Drawer           x=256,  y=64, w=400,  h=836  ← ABSOLUTE, left of canvas
├── Canvas Bar / Top      x=657,  y=64, w=784,  h=64   ← ABSOLUTE, top-right area
├── Canvas Bar / Bottom   x=1086, y=836, w=338, h=48   ← ABSOLUTE, bottom-right
├── Canvas Bar / Right    x=1376, y=127, w=64,  h=709  ← ABSOLUTE, far right
└── Wizard bar            x=773,  y=836, w=183, h=48   ← ABSOLUTE, bottom-center
```

**Key metrics:**
- Drawer on LEFT side of canvas: x=256, NOT right edge
- Drawer height = full canvas height (836px)
- Canvas bars are thin toolbars floating over canvas

---

## Overlay Rules

### Drawer (right side, list pages)
- **Closed state**: `x = SCREEN_W + 27 = 1467` (hidden off-screen)
- **Open state**: `x = SCREEN_W - DRAWER_W = 1440 - 400 = 1040`
- y=0, h=900 (full height)

### Drawer (left side, builder pages)
- x = sidebar width = 257, y = header height = 64
- w=400, h=836 (full canvas height)

### Modal (centered)
- Scrim: always `1440×900` at x=0, y=0 (full root frame)
- Modal center: `x = 257 + (1183 - modal.width) / 2`

### Scrim
- **Always full root frame**: `resize(1440, 900)`, `x=0`, `y=0`
- Covers sidebar + main content — never clip to just main area

---

## Component Dimensions

| Component | Width | Height | Notes |
|---|---|---|---|
| `*Sidebar*` | 257px | 900px+ | Can extend for scroll |
| `*Header*` | 1183px | 64px | Main area header |
| `*Drawer Basic*` | 400px | 900px | Full height |
| `*Modal Basic* Medium` | 600px | ~200px | Varies by content |
| ~~Title Row~~ | DEPRECATED v3.140 | — | Page title + CTA live in *Header* via properties, not as separate frame in Content |
| Tab Basic bar | 1135px | 32px | Inside content |
| Table | 1135px | fill | Inside content |

---

## Spacing Inside Content Areas

```
Content frame (w=1183)
└── padding: 24px all sides
    └── inner: w=1135, starts at x=24, y=24

Detail pages — Body (varies per file, ~1060-1080, starts at x=Summary.width, no sidebar slot)
└── padding: 32px sides, 64 bottom
    └── cards: w=Body.width − 64

Case page — Left area (w=992)
└── padding: 32px left
    └── cards: w=932 (992 - 32 - 28)
```

---

## Page Type Decision Tree

```
Is there a full-width (257px) global Sidebar?
├── YES → Standard page (Pattern 1 or 4)
│   ├── Has table/list → Pattern 1 (Standard List)
│   └── Has canvas → Pattern 4 (Builder)
└── NO → Detail page (no sidebar at all)
    ├── Header h=152, Summary 360-380 + Body 1060-1080 → Pattern 2 (Applicant)
    └── Header h=96, left 992 + right 448 → Pattern 3 (Case)
```
