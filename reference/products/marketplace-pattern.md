# Marketplace (Integrations + Products) — Layout Patterns

> Source files:
> - Marketplace (Integrations): `7Es0aOncvoCzoCYi1A7kDf`
> - Marketplace (Products): `OmIkC2VnaNG65Wb3F2vxxH`
>
> Scan date: 2026-04-30. Two related but different products.

---

## Pattern A — Marketplace Integrations (1440 + Sidebar 257 + Drawer 600)

> File: `7Es0aOncvoCzoCYi1A7kDf`, page `1329:52402` "List of integrations"

```
Root (1440 × 900, fill #ffffff)
├── *Sidebar*  (257 × 900, x=0)
└── Wrapper   (1183 × 900, x=257)
    └── (integration cards / detail panel)
```

**With detail Drawer overlay:**
```
+ Tint (INSTANCE)        (1440 × 900, x=0)
+ *Drawer Basic*          (600 × 900, x=839)        ← WIDE drawer (NOT 400!)
```

**Confirmed dimensions** from `List of integrations`:
- Sidebar: 257 × 900 (FRAME, not INSTANCE in this file)
- Wrapper: 1183 × 900 at x=257
- Drawer Basic: 600 × 900 at x=839 (= 1440 - 600 -1 ≈ right edge)

**Drawer 600 wide** (not standard 400) because integration detail card needs more horizontal space for description + setup steps + screenshots.

### 🚫 Integration cards use the `Cards` component — NEVER fabricate custom card frames (v3.162)

The integration grid is built from a real DS component SET, **confusingly named `Cards`** (NOT "Integration card" / "Marketplace card" — that's why a keyword `search_design_system` misses it). Use it; do not hand-build `Card / X` frames with custom logo + status + title + button.

| Property | Value |
|---|---|
| Component SET key | `b9191d098f0d3684006a176a4414857c47acf596` (`Cards`) |
| Variant example | `Type=New page, Name=Monnai` (key `ffe1ccdbf29a01ffe7045d668c3f4a14fdb6a938`) — one variant per integration name |
| Native size | ~362 × 312 |
| Structure | `Logo` (FRAME) + `Body` (FRAME) |
| Key properties | `Solution Tag #1685:19`, `Active/Connected Status#29:…`, `Set up required Status#1684:0`, `Disabled Status#1652:0`, `Request Buttton#29:30`, `Settings Button#29:50`, `Learn More Button#29:20`, `New Tag #29:60` (toggle the status/button/tag that matches each integration's state) |

```js
const cardsSet = await figma.importComponentSetByKeyAsync("b9191d098f0d3684006a176a4414857c47acf596");
const card = cardsSet.defaultVariant.createInstance(); // then setProperties for name, status, buttons, tags
```

**Reason this rule exists:** Marketplace sim 2026-06-08 fabricated 6 custom `Card / X` frames (logo + *Status* + title + desc + *Button*) because `search_design_system` for "integration card" returned nothing — the component is named `Cards`. Status pills + 600 drawer were otherwise correct; only the card unit was hand-built. If you can't find a product's card/list component by keyword, inspect the canonical frame's repeated INSTANCE and read its `mainComponent.parent` (the SET) — that's the component to import.

---

## Pattern B — Marketplace Products (1440 + Content 2.0 organism)

> File: `OmIkC2VnaNG65Wb3F2vxxH`, page `2400:358548` "Self-purchase feature flow"

```
Root (1440 × 900, fill #ffffff)
├── Wokspace_1280x720 (FRAME, 1440 × 900)        ← workspace wrapper
└── Content 2.0       (INSTANCE, 1440 × 900)     ← packaged organism
```

**Critical:** Marketplace Products uses a PACKAGED organism `Content 2.0` that contains the entire dashboard chrome + product cards layout. Don't disassemble — use the instance as-is.

**Confirmed dimensions** from `Self-purchase feature flow`:
- Workspace wrapper: 1440 × 900
- Content 2.0 organism: 1440 × 900 (full canvas)

---

## Pattern Decision Tree

```
Marketplace screen?
├── Listing integrations / detail drawer for an integration
│   → Pattern A (Sidebar 257 + Wrapper 1183 + 600-wide Drawer for detail)
│
└── Product catalog / Self-purchase / feature flag flows
    → Pattern B (Content 2.0 organism, full-canvas)
```

---

## Source pages

| File | Page | ID | Pattern |
|---|---|---|---|
| Integrations | List of integrations | `1329:52402` | A — list + drawer |
| Integrations | Marketplace page | `3715:323971` | A |
| Products | Self-purchase feature flow | `2400:358548` | B — Content 2.0 |
| Products | Products and Features Page | `3715:323972` | B |
| Products | Self-enable products | `4452:228175` | B |
| Products | Feature List (old) | `126:26359` | legacy — skip |

---

## Notes & gotchas

- **Drawer 600 in Marketplace** — wider than standard 400. Don't use 400 here, the design intent is more horizontal space for integration detail.
- **Content 2.0 is a packaged organism** in Marketplace (Products). Don't try to disassemble or rebuild — use the instance.
- **Integrations file uses FRAME-typed `*Sidebar*`** (257) instead of INSTANCE in some screens — accepted as-is, but if rebuilding, prefer the standard INSTANCE from Organisms library.
