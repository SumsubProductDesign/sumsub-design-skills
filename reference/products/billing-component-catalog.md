# Billing — Component Catalog

> Source file: `kHQyyYdPZjEyrSahRmBLUr`
> Local components scanned 2026-04-30 — 45 sets + 15 standalone = 60 total. Top 35 most-relevant listed below.

---

## Tables (used in service usage / overview / contracted services pages)

| Component | Key | Variants |
|---|---|---|
| `Contracted services table` | `0b1488374943499cb2904d915bcde4264ed4e184` | 4 |
| `Service usage table` | `0efaa2f573493cb8f4211e20b684f87af846e241` | 4 |
| `Table_Billing overview` | `f6e86e47b64065500a3cb6afd49033902ca7ae92` | 3 |
| `Table Header` | `2ad05baf248f671dfef44ac87a7a2d15daa3c1a5` | 2 |
| `Table Row` | `468e5753b0aaacf67b9f739a2bd64c804d1916a4` | 2 |
| `Table row_expanded` | `9ee4db720497e3b1cce8773a4d4ffbbfdf2f5c4b` | 4 |
| `Table Cell_custom` | `116f0db00f4ea4c38508cf49a6378712c8292c37` | 1 |
| `Price cell content` | `40f5515ccf57271d1e6329e76b023dc44002209d` | 2 |

## Cards (metric cards in Cards Row + plan cards)

| Component | Key | Variants |
|---|---|---|
| `Card` | `580257e7e7cdca8843018ee8c39b68ce523a1266` | 6 |
| `Plans` | `8e6eb4e1380dbd38d4a7c2c067b520ef038b1fa3` | 3 |
| `Bill` | `0e360389aba4ce1cade0db9011c00c8311f6a08c` | 3 |
| `Summary` | `58820930b5adbebdb8d132c80d6c0afc429423db` | 8 |
| `Deposit and Commitment` | `e87314d17ae02302313b92bf3fb663ab55cc896e` | 2 |

## Payment / Plan management

| Component | Key | Variants |
|---|---|---|
| `Payment details` | `b1bf51a11427a7ab00964101414312a02a65e00d` | 4 |
| `Card details` | `85bf6afd048e184f04cab952ef662a1812062101` | 3 |
| `Commitment` | `04687451b303a9288bfb98d3d9f3ec75a478f5bb` | 8 |
| `Commitment Popover` | `988c076dd69f24f769e159524b22d6f19e5dc550` | 1 |

## Filters / Selects

| Component | Key | Variants |
|---|---|---|
| `Country` | `f9b403bb1f420d246665f166d92f47bdd6b13a66` | 2 |
| `Popover content` | `22cd02efecac04b408615b14fde8672c481c7723` | 6 |
| `survey-content` | `548c2e84024a95b9199ab0dcf891c67a86cc1b20` | 2 |

## Standalone components (drawers / modals / overviews)

| Component | Key | Notes |
|---|---|---|
| `Main info` | `373c893b3b03d3f5f2eb29ef7442aff29c07e6db` | Account/billing main info block |
| `Plans` | `c4243ccc5ee74567113e44312ca0847f219591cf` | Plans list (standalone variant) |
| `Service usage header` | `51e2a2dc432baa4cc7e57935b69a3b6a100e656d` | Header for usage table page |
| `Overview` | `c1eda03cceb51bce6151bf38b1a5db197e09bc75` | Billing overview block |
| `block` | `ad7f8e3be6be79f6b61dcb3f5b70c3f2a5979540` | Generic content block |
| `trial illustration` | `e9ccb2649cf1826dbd9ad42e575f0d0188bafa33` | Empty/trial state illustration |
| `Summary` | `0cfec3c36b493409991a023611711406604c908f` | Standalone summary card |
| `Billing plans` | `0ad42b0a2d0e3cfa93ca3fb61147129aaa628ecc` | Plans wrapper |
| `Billing plans for modal` | `5babe79f9969b3be82f30f69b5d3c33c2d631d55` | Plans inside modal context |
| `Summary in trial` | `68e2e14a545584fce0e518007ad8a84e977662bf` | Summary shown during trial |
| `.Drawer / Service agreement` | `c8ea701144aa07287eb2bba0a40d95e505bd3dc6` | Drawer content for SLA/terms |
| `.Drawer / Plan details` | `202f122828b5be48501f08326d9f9b7afde3e29a` | Drawer for plan detail |
| `Modals / Cancel plan` | `f807ff99742ff6b1de01e25c48c625a26f81cedf` | Cancel plan modal content |
| `Modals / Add new card` | `874c95c9a1da305b709212064323e9799284fbe5` | Add card modal content |
| `.Slot / Payment method` | `5a8be7a44060d486df237884b4650ce456aff4ad` | Slot content for payment selector |

---

## Pattern

See `billing-pattern.md`. Standard P1 (1440 + Sidebar 257 + Content 1183) with Cards Row + Period Row + Table inside Content. Drawer overlays use `.Drawer /` keys above; Modals use `Modals /` keys.

## Notes

- **45 sets is a LOT** — indicates Billing has many specialized table/card variants per scenario (overview vs contracted vs trial vs cancellation, etc.). Scan source canonical before assuming one variant.
- **Two Drawer styles in Billing**: Service agreement (long terms/legal) and Plan details (per-plan detail). Both 600+ wide (NOT standard 400).
- **Modal Promo etc.** are imported from external Marketplace library — see `marketplace-pattern.md`.
