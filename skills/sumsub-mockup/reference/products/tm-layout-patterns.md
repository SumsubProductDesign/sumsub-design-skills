# Transaction Monitoring — Layout Patterns

> Patterns observed across 8 TM Figma files (2026-04-28).
> Files: TM Settings, Rule page 2.0, TM Transaction page, TM Rules table, TM Transactions table, TM VASPs, Transaction Networks, TM Components.

TM uses **five distinct layout patterns** depending on the screen type. Pick the right pattern — wrong pattern = wrong dimensions.

---

## Pattern 1 — Standard TM List (Sidebar 257 + Header + Table)

> Used for: **Transactions table**, VASP "Umbrella VASP" screens.
> Identical to global `Pattern 1 — Standard List/Table Page` in `layout-patterns.md`.

```
Root (1440 × 900)
├── *Sidebar*  (257 × 1024, x=0, y=0)
├── *Header*   (1183 × 64, x=257, y=0)
└── Content    (1183 × h, x=257, y=64)
    ├── Top Toolbar / Filters
    ├── Txn table / VASP table
    └── (Drawer: 400 × 900, x=1467 — hidden off-screen)
```

**Confirmed dimensions** from `4zG4nJT1s0mcVQDXuJjoJJ`:
- `*Sidebar*` 257×1024 at x=0
- `*Header*` 1183×64 at x=257
- `Txn table` 1183×372 at x=257, y=64
- Drawer at x=1467 (27px off-screen right)

**Files using this pattern:** `4zG4nJT1s0mcVQDXuJjoJJ` (Transactions table), `6IXCBfzK8slAZzHCzRPOy7` (VASPs — Umbrella variant, 1440×930)

---

## Pattern 2 — TM Settings (Sidebar 276 + Header + Body)

> Used for: **TM Settings**, **TM Rules table**.
> ⚠️ Sidebar is **276px** (not 257px) — TM-specific wider sidebar variant.

```
Root (1440 × 956)
├── *Sidebar*  (276 × 956, x=0, y=0)   ← 276px, NOT standard 257px
├── *Header*   (1164 × 64, x=276, y=0)
└── Body       (1164 × 892, x=276, y=64)
    - VERTICAL layout, paddingL=32, paddingR=32, paddingT=24
    ├── Block Title (h4-xl, semibold)
    ├── Content sections (collapsible cards, tables)
    └── Button bar (56px, bottom — Save/Cancel)
```

**Key differences from standard Pattern 1:**
- Sidebar: **276px** (not 257px) → content area **1164px** (not 1183px)
- Screen height: **956px** (not 900px)
- Body structure: VERTICAL with top/left/right padding + Button bar at bottom

**Files using this pattern:**
- `B9Otn9QPpssNomSzADBNqF` (TM Settings) — x=276, content=1164, height=956
- `Swa6KOy5vBGGO1qIKNygYN` (TM Rules table) — sidebar=276, content=1159, height=996

> **Note on Rules table:** sidebar=276, Header=1159 (276+1159=1435, not 1440 — 1px gap on each side due to rounding). Height 996px on list view, 1188px with Bulk Actions Bar visible.

---

## Pattern 3 — Rule Editor (Full-Screen Builder, No Sidebar)

> Used for: **Rule page 2.0** (Create/Edit rule flow).
> Full-screen editor — no global Sidebar. Similar to global `Pattern D` in `case-management-pattern.md`.

```
Root (1440 × 902+, scrollable)
├── *Header Full Screen Page*  (1440 × 64, x=0, y=0)  ← full-width, NO sidebar
└── Body (1440 × h, x=0, y=64)
    └── Page Content (HORIZONTAL, gap=64)
        ├── Main content  (1000px, paddingL=88, paddingR=88)
        │   └── Wrapper  (824px = 1000 - 88×2 — rule form content)
        └── Settings panel  (440px — right panel, sticky)
```

**Layout math:** 1000 + 440 = 1440 ✓
**Inner form width:** 1000 - 88 - 88 = **824px**

**Confirmed from `bbp6LvphVT5J6QytzGJY6z`:**
- Screen height varies with content: 902 / 1087 / 1294 / 1449 / 2246px
- Frame names: `Create rule`
- Body child: `Page Content` (HORIZONTAL, gap=64) at x=0
- Left `Main content` has `paddingLeft=88, paddingRight=88, gap=10`
- Right `Settings` panel: w=440, h=954

---

## Pattern 4 — Transaction Detail Page (Full-Width 1920px, No Sidebar)

> Used for: **TM Transaction page** (KYT transaction detail).
> ⚠️ Uses **1920px** base width (NOT 1440px). Has multiple responsive breakpoints (1680, 1536, 1440, 1280).

```
Root (1920 × 1080+, multiple breakpoints)
├── *Header*           (1920 × 64, x=0, y=0)    ← full-width, NO sidebar
├── Header / Finance   (1920 × 144, x=0, y=64)  ← transaction-specific header
└── Body area          (1920 × h, x=0, y=208)
    - VERTICAL, paddingL=32, paddingR=32, paddingT=16, paddingB=16, gap=40
    ├── *Tab Basic*    (1856 × 32)   ← inner width = 1920 - 32×2 = 1856
    └── Columns (HORIZONTAL, gap=64)
        ├── Main column   (1412px wide — left content)
        └── Right panel   (380px wide — detail sidebar)
```

**Layout math at 1920px:**
- Inner width (1920 - 32×2 padding) = **1856px**
- Columns: 1412 + 64 (gap) + 380 = **1856** ✓
- Content starts at **y=208** (64 header + 144 transaction header)

**Breakpoints observed:**
| Root width | Inner width | Main column | Right panel |
|---|---|---|---|
| 1920px | 1856px | 1412px | 380px |
| 1680px | ~1616px | (scales) | 380px |
| 1536px | ~1472px | (scales) | 380px |
| 1440px | 1376px | ~996px | 380px |
| 1280px | ~1216px | (scales) | 380px |

**Transaction-specific header (`Header / Finance`):**
- Height: **144px** (vs standard 64px header)
- Contains: transaction status, amount, direction, applicant/counterparty info, action buttons
- Variants: Rejected/Approved/Requires action/Awaiting user × Confirmed Yes/No × Inbound/Outbound

**Files using this pattern:** `5irNYDkalXUObKIxKXQiy3`

---

## Pattern 5 — Transaction Network Case Page (Custom 1681px, No Sidebar)

> Used for: **Transaction Networks** case pages.
> Custom 2-column layout at 1681px width. No sidebar.

```
Root (1681 × 920)
├── Case header  (1680 × 64, x=0, y=0)   ← custom TM case header, NOT standard *Header*
└── Below header (y=64):
    ├── Container — Transaction network case page  (1316 × h, x=0, y=64)   ← left
    └── Right panel  (364 × h, x=1316, y=64)                                ← right
```

**Layout math:** 1316 + 364 = **1680** ≈ 1681 ✓

**Key differences from CM Pattern B (Case page):**
| Metric | CM Case page (Pattern B) | TM Transaction Network |
|---|---|---|
| Root width | 1440px | **1681px** |
| Sidebar | None | None |
| Header height | 88px | **64px** |
| Left content | 992px | **1316px** |
| Right column | 424px | **364px** |

**Screens in this pattern:**
- `Case page / all txns / table` — transaction table + bulk actions
- `Case page / resolve case` — with resolution modal

**Files using this pattern:** `yHA20ZE0f6qdC2eyBlxpny`

---

## Pattern 6 — Legacy VASPs (Wide Canvas 1920px, Old Sidebar)

> Used for: **TM VASPs** older "Can edit flow" screens.
> ⚠️ Legacy design — uses old `*Menu*/Basic` sidebar component (281px). New screens use Pattern 1 (1440px + *Sidebar* 257px).

```
Root (1920 × 1214)
├── *Menu*/Basic  (281 × h, x=0, y=0)   ← OLD sidebar component (not *Sidebar*)
├── *Header*      (1639 × 64, x=281, y=0)
└── Content       (1639 × h, x=281, y=64)
    └── VASP table + Drawers/Modals
```

> **When to use:** Only when replicating existing legacy VASP screens. New VASP designs use Pattern 1 (1440 + Sidebar 257).

---

## Pattern Decision Tree

```
What kind of TM screen?
├── Transactions list / VASP umbrella view
│   → Pattern 1 (Sidebar 257 + Header 64 + Content 1183, screen 1440×900)
│
├── Settings page / Rules table
│   → Pattern 2 (Sidebar 276 + Header 64 + Body 1164, screen 1440×956)
│
├── Creating or editing a rule
│   → Pattern 3 (Header Full Screen Page 1440×64 + Main 1000px + Settings panel 440px)
│
├── Single transaction detail (Finance / Crypto / Travel Rule / Gambling)
│   → Pattern 4 (Header 1920×64 + Header/Finance 1920×144 + Body: Main 1412 + Right 380)
│
├── Transaction network case page
│   → Pattern 5 (Case header 1681×64 + Left 1316 + Right panel 364)
│
└── Legacy VASP screens (pre-2025)
    → Pattern 6 (legacy, avoid for new work)
```

---

## Component Dimensions

| Component | Width | Height | Notes |
|---|---|---|---|
| `*Sidebar*` (TM standard) | 257px | 1024px | Transactions table, VASP Umbrella |
| `*Sidebar*` (TM settings) | 276px | 956px | Settings/Rules table — wider variant |
| `*Header*` (standard) | 1183px | 64px | Width matches content area |
| `*Header Full Screen Page*` | 1440px | 64px | Rule editor — full width |
| `Header / Finance` | 1920px | 144px | Transaction detail — custom TM header |
| `Header / Finance` variants | varies | 144px | Finance/Crypto/Travel rule/Gambling |
| Body (settings) | 1164px | 892px | VERTICAL, pad 32/32/24/32 |
| Drawer | 400px | 900px | Right-side overlay (off-screen at x=1467) |
| Rule form content | 824px | auto | 1000 - 88×2 inner width |
| Transaction main col | 1412px | auto | At 1920px breakpoint |
| Transaction right panel | 380px | auto | Fixed width at all breakpoints |
| Txn Network left | 1316px | auto | Inside 1681px canvas |
| Txn Network right panel | 364px | auto | Narrower than standard 380 or 424 |

---

## Spacing Inside TM Layouts

```
Settings Body (Pattern 2):
  paddingTop=24, paddingLeft=32, paddingRight=32, no bottom padding
  itemSpacing=24 between sections

Transaction Detail Body (Pattern 4):
  paddingTop=16, paddingBottom=16, paddingLeft=32, paddingRight=32
  gap=40 between sections inside body

Rule Editor Main Content (Pattern 3):
  paddingLeft=88, paddingRight=88, gap=10 (tight horizontal layout)
  Inner wrapper: 824px for the actual form
```

---

## TM Source Files

| File | fileKey | Pattern | Notes |
|---|---|---|---|
| TM Transactions table | `4zG4nJT1s0mcVQDXuJjoJJ` | 1 | Standard 257 sidebar; active prod page: `⚫ Transactions table [Prod]` |
| TM VASPs | `6IXCBfzK8slAZzHCzRPOy7` | 1 (new), 6 (legacy) | Umbrella VASP = 1440; old screens = 1920 |
| TM Settings | `B9Otn9QPpssNomSzADBNqF` | 2 | Active pages: General settings, Travel rule settings, Applicant scoring, AML screening |
| TM Rules table | `Swa6KOy5vBGGO1qIKNygYN` | 2 | Active page: `⚫ Rules table [Production]` |
| Rule page 2.0 | `bbp6LvphVT5J6QytzGJY6z` | 3 | Active page: `🟢 Rule page [PHASE 1]` |
| TM Transaction page | `5irNYDkalXUObKIxKXQiy3` | 4 | Pages: Transaction page, ↪ Crypto txn, ↪ Travel Rule txn, ↪ Gambling bet |
| Transaction Networks | `yHA20ZE0f6qdC2eyBlxpny` | 5 | Active page: `🟡 Txn networks v1 [In progress]`; v2 TBD |
| TM Components | `jH0zp9iwzizayCPZNggytx` | — | **Component library** — see `tm-component-catalog.md` |
