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

> TM list, Applicants, Cases list, etc.

```
[1440 × 900]  (content may scroll beyond 900)
├── *Sidebar*           x=0,   y=0,  w=257,  h=900+
└── Main
    ├── *Header*        x=257, y=0,  w=1183, h=64
    └── Content frame   x=257, y=64, w=1183, h=836+
        └── (padding 24px)
            ├── Title Row          h=52   → w=1135
            │   ├── Title Stack (left)
            │   └── CTA Button (right)
            ├── Toolbar/Filters    h≈40   → w=1135
            └── Table              h=fill → w=1135
```

**Confirmed dimensions from metadata:**
- Sidebar: `x=0, y=0, w=257, h=1024` (extends for scroll)
- Header: `x=256, y=0, w=1184, h=64`
- Table: `x=256, y=64, w=1184, h=1382` (scrollable)
- Drawer (closed): `x=1467` — **27px outside the 1440 frame**, hidden off-screen

---

## Pattern 2 — Detail Full-Screen Page (Applicant style)

> Applicant page, Transaction detail — **no global Sidebar**

```
[1440 × scroll]
├── Page header       x=0,   y=0,   w=1440, h=152  ← full-width, tall
├── Summary/Left      x=0,   y=152, w=360,  h=auto
└── Body/Content      x=360, y=152, w=1080, h=auto
    └── (padding 32px each side)
        └── Cards     w=1016
```

**Key metrics:**
- No Sidebar (0px left margin)
- Page header: **152px tall**, full 1440px wide
- Left panel (Summary): **360px** fixed
- Right body: **1080px** (360+1080=1440)
- Card padding: 32px → card width = 1080 - 64 = **1016px**

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
| Title Row | 1135px | 52px | Inside content (24px padding) |
| Tab Basic bar | 1135px | 32px | Inside content |
| Table | 1135px | fill | Inside content |

---

## Spacing Inside Content Areas

```
Content frame (w=1183)
└── padding: 24px all sides
    └── inner: w=1135, starts at x=24, y=24

Detail pages — Body (w=1080)
└── padding: 32px sides
    └── cards: w=1016

Case page — Left area (w=992)
└── padding: 32px left
    └── cards: w=932 (992 - 32 - 28)
```

---

## Page Type Decision Tree

```
Is there a global Sidebar?
├── YES → Standard page (Pattern 1 or 4)
│   ├── Has table/list → Pattern 1 (Standard List)
│   └── Has canvas → Pattern 4 (Builder)
└── NO → Full-screen detail page
    ├── Header h=152, left panel 360px → Pattern 2 (Applicant)
    └── Header h=96, left 992 + right 448 → Pattern 3 (Case)
```
