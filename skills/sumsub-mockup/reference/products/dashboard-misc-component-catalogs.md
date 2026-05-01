# Dashboard Misc Products — Component Catalogs

> Compact catalogs for products with smaller component sets.
> Scanned 2026-04-30.

---

## Reports — 4 sets + 3 standalone

> File: `zYDE1v0b5Zg08tZqVvhgHb`

| Component | Type | Key | Variants |
|---|---|---|---|
| `Reports table / Row` | SET | `2bfd97b1c05f0557eb7e4de961dcdf1babcfba47` | 2 |
| `Reports table` | SET | `630f5b0f910fc9777bf6a9f07a133e3eb2c380af` | 2 |
| `Report page / Header` | SET | `e3aeb9771a0cc31b0fb95ba027d970f7f7d37233` | 3 |
| `Report status` | SET | `79a174dd69e063464fba10ceca6984202e2e4abd` | 4 |
| `CSV Export drawer` | COMP | `b888b11221b61f06dc7ed695a2c082c8c3f6aea2` | — |
| `Report page / Parameters` | COMP | `d66d0e9bbc6a2595a2dc3caa00ab2bd674a9b344` | — |
| `Report page / Body` | COMP | `ae509b374ad4346779f367a168d69f16e5e513e0` | — |

Pattern: 1440 + collapsed Sidebar 52 + Body 1388. See `reports-pattern.md`.

---

## Marketplace (Products) — 8 sets

> File: `OmIkC2VnaNG65Wb3F2vxxH`

| Component | Type | Key | Variants |
|---|---|---|---|
| `Features Page / Carousel / Block` | SET | `662aa487b724051fe9633164dceb4dd3e1709bf6` | 6 |
| `Features Page / Available List / Block` | SET | `b6c735121b9a940c448854aa17171fb2f401d6cb` | 8 |
| `Feature Icon` | SET | `bc434cc5f95329870baa885bf0fe2a494c513fc9` | 4 |
| `Features Page / Carousel / Illustration` | SET | `f4e23b39a63ecff5d2061404a30213781cc61296` | 3 |
| `Content 2.0` | SET | `76e0137635e2a8c1e13fb40b879b32ba6913dc2f` | **2** — main organism |
| `Modal Promo` | SET | `e3c0d00feee04c0e3cd117ec9a555e7efa02427e` | 1 |
| `.Modal Promo` | SET | `7633926346a4ddb664ec0f0b6b06e7e6190d8306` | 9 |
| `.Modal Promo` (alt) | SET | `60c36a9a2c81c73cfc646564a42a35d698e86784` | 10 |

Pattern B (Marketplace Products): full-canvas `Content 2.0` organism. See `marketplace-pattern.md`.

---

## Marketplace (Integrations) — 0 local components

> File: `7Es0aOncvoCzoCYi1A7kDf`

No local components or sets. Uses Base components + Organisms libraries entirely.

---

## Operator — 1 standalone

> File: `yovNHdbi0rO4nLjFaBa8G5`

| Component | Type | Key |
|---|---|---|
| `Table Starter1` | COMP | `b52b17f32d90ec966b12a29ad7b5166444edd7fe` |

Operator is a thin product file — uses Sidebar 276 + content from external libraries. See `operator-pattern.md`.

---

## Databases — 3 sets + 5 standalone

> File: `AFS89B3cduj44GvV8ZHy7j`

| Component | Type | Key | Variants |
|---|---|---|---|
| `Group` | SET | `bacffe52339721369ac65b1d8355f026877ef2e7` | 2 |
| `NewRowTable` | SET | `0629d8fbef20e1ce591333e918938a27138e0bd7` | 8 |
| `NewRowTable2.0` | SET | `f200256c939d62e0bbb0aa8ea7b5a8bef14b6bf9` | 4 |
| `Body` | COMP | `b5b41ef3ab96a2a06b708c1563086c223d55aabb` | — |
| `Content / Table / Button` | COMP | `027d7ad47c43c3d4d72f72328c058fc6c3c52eaa` | — |
| `Frame 2085663993` | COMP | `7c15a4f901dd6210c702c2aa996b4570374ee41f` | — |
| `Content / Table / Name group` | COMP | `502b28674a7de834123ab1ade67c9d40f3a04065` | — |
| `*Table Starter*` | COMP | `7a75a61a7f0ec840f5bc7251324f7ec8cb2f7c4a` | — local override |

Pattern: 1920/1440 + browser-chrome wrapper + Sidebar 276. See `databases-pattern.md`.

Note: `NewRowTable2.0` is the current iteration (4 variants), `NewRowTable` v1 has 8 variants but is older.

---

## Sumsub ID Account — see separate skill folder

The Sumsub ID Account component catalog lives in `skills/sumsub-id-mockup/reference/sumsub-id-component-catalog.md` (16 standalone components plus external Sidebar + Header keys).

---

## Notes

- Smaller component catalogs reflect that these products either:
  - Use external Base components / Organisms libraries (Marketplace Integrations, Operator)
  - Have minimal product-specific UI (Reports, Databases)
  - Are content-organism heavy with single packaged components (Marketplace Products)
- For Sign up — file uses Image + Drawer split pattern with mostly external library components, no local component catalog needed.
