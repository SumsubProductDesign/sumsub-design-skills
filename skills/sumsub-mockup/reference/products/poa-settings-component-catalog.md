# PoA Settings — Component Catalog

> Source file: `yEkxS5YVjrLtlJkuUEusHo`
> Scanned 2026-04-30 — 10 sets + 7 standalone = 17 total.

## Component sets (10)

| Component | Key | Variants |
|---|---|---|
| `PoA Settings` | `a0dbf17959f13eb24317b6402c9e726ee892fbd8` | 2 |
| `Modal / Content` | `1c6d700f1e14656b2684b83cea062caab90ba94d` | 2 |
| `Custom Settings Card` | `9d977f7c57ca8a036f8af65a3e0afeb94408de36` | 2 |
| `PoA / Default Settings / v2` | `75514b66db5ab615b8662ff0bbaee6d294994b1c` | 2 |
| `Accepted languages` | `2ccafc5ede136e981faba522b848c6dbe7b34779` | 2 |
| `Title` | `6d19565c9b00ab0d8a115a570ad07b884c2320cb` | 2 |
| `Name comparison mode` | `98fe2ddce5efe9854c6e1e716a550e01c9f25f22` | 2 |
| `ID documents as Proof of Address documents` | `691777e1de59aed06c76411a624957c122de5b6b` | 2 |
| `Levels` | `c2abf237def0a6626d49127d7ccda07a2e73deec` | 2 |
| `Additional settings` | `f6a64dcff4a3dd6f320c12dc63eaf99d44112570` | 2 |

## Standalone components (7)

| Component | Key |
|---|---|
| `Drawer / Content` | `30830d49f2084c7bdb1c36c88cbf46c0575bc98d` |
| `Collabsable Card / Content` | `943d6ed99e308d662787df62c33fd9640b7c563d` |
| `PoA / Default Settings / v1` | `073fb9eb7a8ded79e317465ba618c5cfad159100` |
| `Collabsable card / Content` (alt) | `a4869df5a641d094216f8e10f4641f6582cce0dd` |
| `Content` | `d15de57b486207d92d82c71dc61922fb8dbad7c4` |
| `Countries custom configuration / Empty state` | `1d11be1894f2d3f48a1bd8636ccdd91e544c1a33` |
| `Tip` | `28f7adf1635db08c0e9d35a8a2239de6f2abeee8` |

---

## Pattern

See `poa-settings-pattern.md`. 1280 canvas, NO Sidebar, `*Header Full Screen Page*` 120px + Content 1280 (full-screen builder).

## Notes

- **v1 + v2 settings** both exist (`PoA / Default Settings / v1` standalone + `/ v2` set). v2 is the latest design.
- **`Collabsable Card / Content` listed twice** — typo + alt key (`9433d6ed...` vs `a4869df5...`). Verify which is canonical when reproducing.
- **All sets have 2 variants** — likely Default + selected/active state.
- **Modal Small (540 wide)** for confirmations uses `Modal / Content` set.
