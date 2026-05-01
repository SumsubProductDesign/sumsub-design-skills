# KYB Levels (Companies Levels) — Layout Patterns

> Source file: `EP9kfSkVRzQT9jBZe3LqZH`
> Scan date: 2026-04-28
> Three layout patterns: Levels list (standard), Level editor (no sidebar, custom 120 header), Configurations (multi-frame canvas).

---

## Critical canvas dimensions

KYB Levels uses **1440-wide canvas** (standard). NOT to be confused with KYB WebSDK (`9ii3Ueqr01mbLS3SE6bsrJ`) which uses 1440×1046 frames with centered 512px Window.

KYB Levels is the **dashboard configuration** product for setting up KYB verification levels — completely different file from the WebSDK flow.

---

## Pattern A — Levels list (Standard List)

> Page `49:38034` "Table"

```
Root (1440 × 900, NONE layout, fill #ffffff)
├── *Sidebar*  (257 × 900, x=0, y=0, Type=Settings or KYB)
└── Frame 1   (1183 × 501, x=257, y=0)        ← content area
    └── (table of existing KYB levels + Create level CTA)
```

**With modal overlay:**
```
+ Tint        (1920 × 904, x=0, y=0)          ← scrim covering full screen
+ *Modal Basic*  (720 × 416, x=360, y=40)    ← Create level modal
```

> **Note:** Tint is 1920 wide — wider than the 1440 root. It overlays the entire screen plus margins. Modal centered horizontally: x=(1440-720)/2 = 360.

**Confirmed dimensions** from `Create level / table`:
- Sidebar: 257 × 900 (standard)
- Frame 1: 1183 × 501 (content area, page height 900)
- Tint (modal scrim): 1920 × 904 — covers full screen
- Modal Basic: 720 × 416 at x=360, y=40

---

## Pattern B — Level editor (Full-screen, no Sidebar, custom 120 header)

> Pages `49:38035` (General), `58:316097` (Company data), `58:430651` (Company documents), `61:161930` (Associated parties), etc.

```
Root (1440 × scroll, NONE layout, fill #ffffff)
├── Headers   (1440 × 120, INSTANCE)          ← KYB Levels-specific page chrome
└── Content   (1440 × scroll, x=0, y=120)
    └── (form blocks, settings, verification step config)
```

**Confirmed dimensions** from `Create level - default screen`:
- Headers INSTANCE: 1440 × 120 at (0, 0)
- Content FRAME: 1440 × 1382 (scrolling) at y=120
- Page total height: 1502 (varies — 1494 for Company data)
- Optional: Scroll / Thumb at right edge (x=1425, w=6, h=380)

**Headers component** (key `04cd3e499850f1bb02c988f565948833c2474046`) is KYB-Levels-specific. NOT the standard `*Header*` from Organisms. Has 2 variants. Includes breadcrumbs + level title + actions.

---

## Pattern C — Configurations (multi-frame horizontal canvas)

> Page `61:453464` "All configurations sections"

```
Root (16290 × 1357, no layoutMode)            ← extra-wide canvas for designer reference
├── Configurations  (1440 × 813)              ← screen 1
├── Configurations  (1440 × 800, x=1650)      ← screen 2 (gap 210)
├── Configurations  (1440 × 800, x=3300)
├── Configurations  (1440 × 1357, x=4950)
├── Configurations  (1440 × 946, x=6600)
├── Configurations  (1440 × 800, x=8250)
└── Configurations  (1440 × 800, x=9900)
```

**Use case:** designer-only canvas showing all configuration variations side-by-side for review. Each individual `Configurations` frame is a 1440-wide screen. **Don't replicate the multi-frame canvas in production builds** — pick the specific configuration screen needed.

---

## Pattern Decision Tree

```
What kind of KYB Levels screen?
├── Listing all KYB levels (Manage levels)
│   → Pattern A (Sidebar 257 + content 1183)
│
├── Editing a specific level (General / Company data / Associated parties / etc.)
│   → Pattern B (no Sidebar, Headers 1440×120, Content 1440×scroll)
│
└── Reviewing all configuration variants at once
    → Pattern C (multi-frame canvas — designer reference only)
```

---

## Components

> Components page `14:268905` — 7 component sets + 5 standalone components.

### Page chrome
| Component | Type | Key | Variants |
|---|---|---|---|
| `Headers` | SET | `04cd3e499850f1bb02c988f565948833c2474046` | 2 — page header for Pattern B (1440×120) |

### Verification steps
| Component | Type | Key | Variants |
|---|---|---|---|
| `Verification steps (KYB)` | SET | `e0b95789b839ee36b21688098552303204e5d301` | 4 |
| `Steps organisms (KYB)` | SET | `90800f7c8ee13940b43a60ca3af72001939710c0` | 4 |
| `Step-divider` | COMP | `797acc8efba657fe740f1900595a0621cef89e1a` | — |

### Verification step bodies
| Component | Type | Key | Variants |
|---|---|---|---|
| `Beneficiaries-content` | SET | `bb9665159c94ead8efb4ffea8728c3c580afc53c` | 2 |
| `Individual` | SET | `a08e40a86b3b8ade686d0657945e43ac29199bfb` | 3 — beneficial owner / director / etc. |
| `Company` | SET | `18740210c20314ed5303bdfdb5fc300280c1ab63` | 3 — parent company / subsidiary / etc. |
| `Custom fields` | SET | `fea057ad2feb5a0850fd66ba7d9ddd2c54d3e239` | 2 |
| `Company data` | COMP | `4b66615aaf712f3eb6f8a7707bf7210d959a993a` | — |
| `Associated parties/Default` | COMP | `03643003861e7e79e26f4a608d45aef0f86e13f1` | — |
| `Row` | COMP | `80664e658cf401743a70fec84c8a8a39ebfe24d7` | — generic row inside config blocks |
| `General / Default` | COMP | `9a914b1cb6b25845715651a7cd3bdf0af57cd72c` | — |

---

## Source pages

| Page | ID | Pattern |
|---|---|---|
| Table | `49:38034` | A — list of KYB levels |
| General | `49:38035` | B — level general settings |
| Company data | `58:316097` | B — company data step config |
| Company documents | `58:430651` | B — company docs step config |
| Associated parties | `61:161930` | B — associated parties step config |
| Phone verification | `61:326418` | B — phone verif step config |
| Email verification | `61:329843` | B — email verif step config |
| Questionnaire | `61:330180` | B — questionnaire step config |
| Proof of Address | `61:330908` | B — PoA step config |
| All configurations sections | `61:453464` | C — multi-frame review canvas |

---

## Notes & gotchas

- **`Headers` is NOT `*Header*`** — KYB Levels has its own page chrome component (key `04cd3e49...`) that's 120px tall (vs standard 64). Don't substitute the generic Header.
- **No Sidebar in Level editor (Pattern B)** — Level editing is full-screen. This matches how Sumsub treats one-off configuration flows.
- **KYB Levels ≠ KYB WebSDK** — different products in different files. KYB WebSDK (`9ii3Ueqr01mbLS3SE6bsrJ`) uses 1440×1046 background with 512px Window. KYB Levels (`EP9kfSkVRzQT9jBZe3LqZH`) is dashboard configuration with 1440 standard canvas.
- **Custom Sidebar variant** — Pattern A uses `*Sidebar*` Type=Settings (or similar — verify by inspecting the variant of the live instance). Active nav item should be set to "Levels" or matching menu entry.
- **Modal Tint extends beyond canvas** — observed Tint at 1920×904 inside a 1440×900 root. Visually correct (covers all surrounding margins) but worth knowing if you're trying to constrain Tint to the root.
