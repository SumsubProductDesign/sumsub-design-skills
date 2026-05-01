# Global Settings — Component Catalog

> Source file: `ZBP8mJTQIjAJizXhEmRkLc`
> Scanned 2026-04-30 — 22 sets + 29 standalone = 51 total. Top 25 listed.

## Component sets (top 15 of 22)

| Component | Key | Variants |
|---|---|---|
| `Tag` | `aac1b1bfc9fc913b50c81a30cf794d5bfc7ab4ec` | 1 |
| `Applicant tags` | `cd82d5f9f942a72c865abc5ea56c703bedec7ad6` | 2 |
| `Applicant tags with cards` | `0c3815fdad2e89573aa330883c8db7098e5f3ba2` | 2 |
| `KYB settings` | `817186411935c0b6c3f5c59aa0ad78bdf1a450c2` | 2 |
| `Settings set` | `a27ff91bd0a0bb23f31a1d2e072b1de5c5d6cbb5` | 3 |
| `KYB / Drawer-content` | `f02cc4a1044c058601189000f16e9c1edd8fad53` | 3 |
| `Naming` | `868ec46998149ea6f61f2b8b53d76999a7f33fb4` | 2 |
| `KYB settings` (alt) | `89b19ce997fd68f4362b45d022cb580cd8d0efd8` | 2 |
| `Similar associated party profiles` | `f292c034ae35cb72a375f6f9a158c5efc3a91f12` | 2 |
| `Reminder` | `595b7171681bb0a5a7a30cfb4b161852bdc938a6` | 2 |
| `Ongoing Document Monitoring` | `7b93821a5b2fc32cd4c1a5ea0037f7b289255b96` | 3 |
| `Color preview` | `0d5c18b4c66a970a07ba6218bcc4f2dbb3897be6` | 2 |
| `AMLScreening` | `15d943efbdc2843fc41adcf8cf7bb7202e39b2f2` | 2 |
| `data-table` | `b8f2eb51e74f419eb48aa4d11d42e30bc322f764` | 2 |
| `KYC Regulations` | `2aacf2784a80f26fecfe44411aba49b65ebf3716` | 6 |

## Standalone components (top 10 of 29 — Tip components)

| Component | Key |
|---|---|
| `Tip / Source keys` | `d943ae48a10e2b457b9ebc95144151e52abc7854` |
| `Tip / Applicant tags` | `de77cabcd0425bccb6e39805bac6049fb455a0c2` |
| `Tip / Ongoing doc monitoring` | `aa18298590958681f0eba5dcc4a1b4b916699de6` |
| `Tip / KYB` | `1bc6dd5b2012755e34effd5600eb2c512a9d769e` |
| `Tip / Comply advantage` | `3e60467a96647aae64b64744226051b71a7abff2` |
| `Tip / Ongoing AML` | `528de2b288c55e99d2141a80021f32ff2e768027` |
| `Tip / ID verif` | `2f60bb9894a5f204715308bd2ccc0c1065010c3a` |
| `Tip / Bank card check` | `b793422fbbfed28c8d319219ec1f07e3a736a384` |
| `Tip / Crypto check` | `3f8706718400ec28095dab2534324800df46179f` |
| `Tip / WC1` | `6f7a4ecafb4543bd9f6545f2508f6a3c5b353aea` |

> 7 more sets and 19 more components not listed (mostly per-feature Tip variants and minor sub-components). Probe directly when needed.

---

## Pattern

See `global-settings-pattern.md`. 1920 + Sidebar 276 + Body 1644. Pattern A (sub-tabs in Body) for General page; Pattern B (Header 120 + Body) for User/Business verification, AML, Data comparison subsections.

## Notes

- **`KYB settings` listed twice** (different keys: `8171864...` v2 and `89b19ce...`) — likely older + newer variants. Verify which is canonical when reproducing.
- **22 Tip components** (one per feature) — used for tooltips/help-popovers explaining each verification setting.
- **`KYC Regulations` set has 6 variants** — likely per-region (EU/US/UK/etc.) or per-tier (KYC1/KYC2/etc.).
- For full inventory, probe Components page (`11135:422731`) directly.
