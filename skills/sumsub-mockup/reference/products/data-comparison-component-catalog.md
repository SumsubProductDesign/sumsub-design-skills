# Data Comparison (Cross-Check Rules) — Component Catalog

> Source file: `rgIhU708ZMELkA8cwGNpk8`
> Scanned 2026-04-30 — 14 sets + 8 standalone = 22 total.

## Component sets (12 listed)

| Component | Key | Variants |
|---|---|---|
| `MVP Condition / Modes` | `59cd2879101738013c275955af047b7ba3e3d8a0` | 1 |
| `MVP Condition / Groups` | `d05ac2b8a0603e858f16368dab5b82dd85ea4037` | 2 |
| `MVP Fields group` | `be6f73a05bf94d9db147cddb557b021752e9caf1` | 4 |
| `MVP CCR / Card` | `81cb5c3fdd2c1797a5d564499ef7661d09d8a1ae` | 2 |
| `MVP Review decision` | `a73786422349bd3d59d338155e34d2d16224b14d` | 2 |
| `MVP CCR / Card Header` | `2155cbe888cd0f77ed8a8dddc7fb783408226ad4` | 2 |
| `MVP CCR / Review decision` | `34dce52a4b1300026d7dacd6a6da75e8906688fe` | 2 |
| `Condition` | `18f44131df50e85ec8f9382a43c01b3587aa202c` | 2 |
| `CCR / Basic presets body` | `1543881262f5dd5b3ec607ed7eb649d25aaba219` | 1 |
| `Body preset result` | `09543ecef28bb9620eeb0050e5ca24ad338f6fbf` | 1 |
| `Result card` | `d9f256bdba12a23b762072037bd978d1b2130e32` | 4 |
| `Data comparison` | `6d51d4c14dff60f5a6adc4fb85002c9110244700` | 2 |

## Standalone components (8)

| Component | Key |
|---|---|
| `CCR / Table` | `1eb63754dc581bf0f714abd5e70001cb3fba8694` |
| `MVP CCR / Advance presets body` | `d38eeba5d6c3468d1675562c4b984de1f8043fe0` |
| `MVP CCR / Card-content` | `f2ad686a8dc3932959ffaef3efe601dff1b1c7de` |
| `Violation` | `a1140e1c2232b2fd987313e0d70c0089034454b4` |
| `Data` | `a34462714eb2af75e89611bead88ad706797f2de` |
| `Rule Body /Component` | `859cdd0b590ef4d6d2dd13c27ae40472de3934c5` |
| `Body preset result/Default` | `62b3f00f6d0183e4506227faca046c815d4b1995` |
| `.Drawer / Header/2nd level` | `364dfec51666928c52982f00d6cfe98ba11cf375` |

---

## Pattern

See `data-comparison-pattern.md`. Pattern A: 1440+Sidebar 276+Content 1164 + Tabs. Pattern B: same + 800-wide Drawer Basic for Advanced rule test.

## Notes

- **MVP-prefixed sets** (8 of 12) are the latest design iteration (MVP = Minimum Viable Product). Older non-MVP sets exist but use MVP as canonical.
- **`Result card` has 4 variants** — likely match/mismatch/partial/unknown decision states.
- **`Violation` standalone** — single-component for highlighting compared-data violations.
- **800-wide Drawer for Advanced rule test** uses `.Drawer / Header/2nd level` as the drawer header.
- **CCR = Cross-Check Rules** abbreviation throughout.
