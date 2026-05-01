# Sumsub ID — Layout Patterns

> Figma project: `108055557` "Sumsub ID"
> Scan date: 2026-04-30
> Sumsub ID is a **separate product line** (decentralized identity / wallet / passport-style auth). It uses its own design language, distinct from Dashboard products.

---

## Files in project

| File | fileKey | Pattern doc section | Status |
|---|---|---|---|
| SumSub ID (main) | `7QlkPyiJa2SItuIeQFkgdr` | — | Diagrams + cover only, no UI mockups |
| SumSub ID Refs and IA | `QgATn3ggEqzMzGlRG2tZ3A` | — | Refs (skip) |
| Sumsub ID Brand | `h6k9ZA5j0wcEK9o5rtXyBW` | — | Brand assets (skip) |
| Sumsub ID \| Account | `F38QSCQ62kCVe8ROwpXdvn` | Pattern A below | active prod |
| Sumsub ID \| Blockchain | `fumcvd5IPvlG5v5ZCGKixR` | — | Older (2025-08), skip unless asked |
| Sumsub ID \| WebSDK | `HQjWYtGpp95LEgLGAPTSwR` | Pattern B below | active prod |
| Sumsub ID ✦ Connect | `Z87D5m8KArTvQWH13Nwmmo` | Pattern C below | active prod |

---

## Pattern A — Sumsub ID Account (1440 + Sidebar 384 + Content 1024)

> File: `F38QSCQ62kCVe8ROwpXdvn` "Sumsub ID | Account"

```
Root (1440 × 900, fill #ffffff)
├── Sumsub ID / Account / Header  (1440 × 64, x=0, y=0)    ← full-width header
├── *Sidebar* / Desktop            (384 × 900, x=0, y=0)    ← UNIQUELY WIDE (NOT 257/276)
└── content wrapper                (1024 × 836, x=384, y=32)
    └── (account settings: emails, docs, MFA, devices, etc.)
```

**Layout sum:** `384 + 1024 = 1408`. Right margin: `1440 - 1408 = 32`. Sidebar starts at x=0, content wrapper starts at x=384, with 32px right edge to canvas (1024 reaches x=1408).

**Header overlay:** the `Sumsub ID / Account / Header` is 1440 × 64 spanning the entire root width — overlays both sidebar and content at the top. Sidebar height is 900 (full viewport).

**y=32** — content wrapper starts 32px below header (header is 64 tall + 32 gap = 96 from top, but content is at y=32... wait that's INSIDE the 64-tall header area? Actually means content starts at y=32 with header 64 visually layering on top from y=0 to y=64. Content visible from y=64 onwards because header occludes 0-64.)

### Critical: 384 sidebar is unique
- Modern dashboard: 257
- Settings family: 276  
- Settings hub: 80 + 191 = 271
- Legacy: 281 (`*Navigation menu*`) or 80 (`sidebar / menu`)
- Editor: 52 (collapsed)
- **Sumsub ID Account: 384** — wider than any other product

The 384px sidebar gives the wallet/profile experience extra room for avatar + identity card preview + nav items with descriptions.

### Source pages (Sumsub ID Account)

| Page | ID | Status |
|---|---|---|
| Sumsub ID account | `3416:14299` | ❇️ PROD |
| Disposable emails validation | `4878:39479` | ❇️ PROD |
| Documents match | `4908:19224` | ❇️ PROD |
| Emails | `4765:83095` | ❇️ PROD |
| Add more data | `7899:56741` | dev |
| View docs + Export data | `4030:59582` | dev |
| History + Connections | `7935:28001` | dev |
| Magic links | `9202:33289` | WIP |
| Attestations | `8644:35607` | HOLD |
| Change avatar | `4990:109645` | dev |
| MFA | `4937:51667` | CR |
| Trusted devices | `4906:13295` | WIP |

---

## Pattern B — Sumsub ID WebSDK (1440 + centered Toolbar + Container)

> File: `HQjWYtGpp95LEgLGAPTSwR` "Sumsub ID | WebSDK"

```
Root (1440 × 900, fill #ffffff)
├── Toolbar / Top Bar / Desktop  (718 × 68, x=361, y=0)    ← CENTERED toolbar (NOT full-width)
└── Container                    (1392 × 808, x=24, y=68)  ← content with 24px L/R margins
```

**Centered toolbar:** 718 wide, x=361. Layout sum check: `361 + 718 = 1079`. Right space: `1440 - 1079 = 361`. Both margins equal at 361 — toolbar visually centered.

**Container 1392** with 24px left margin (x=24) and 24px right margin (1440 - 24 - 1392 = 24). Centered with 24px gutters.

This is **NOT a full WebSDK Widget** like KYB or KYC — Sumsub ID has its own simpler layout: small centered toolbar (login/back) + wide content area.

### Source pages (Sumsub ID WebSDK)

| Page | ID | Status |
|---|---|---|
| Sumsub ID Flow Detailed Design | `609:383` | parent |
| Sumsub ID on welcome screen (beginning) | `2299:64028` | ❇️ PROD |
| Sumsub ID on status screen (end) | `2299:69430` | ❇️ PROD |
| Sumsub ID welcome + on status screen | `6570:50527` | ❇️ PROD |
| Welcome screen toggle | `6710:5909` | ❇️ PROD |
| Social logins | `7492:26261` | WIP |
| Personal info extracting | `7094:11538` | WIP |
| Sumsub ID Welcome Block | `3650:12612` | 🟡 |

---

## Pattern C — Sumsub ID Connect (947-wide embedded widget, light + dark)

> File: `Z87D5m8KArTvQWH13Nwmmo` "Sumsub ID ✦ Connect"

```
Root (947 × 812, fill light #ecedf2 OR dark #2a2b30)
└── Frame 2085662918  (947 × 780, x=0, y=16)
    └── (Connect login widget — embeddable on partner sites, e.g. MiniPay)
```

**Two background variants:**
- Light theme: `#ecedf2` (subtlest grey)
- Dark theme: `#2a2b30` (deep grey)

**Why 947 wide?** Connect is an **embeddable widget**, not a full-page experience. Designed to be placed inside partner pages/apps (MiniPay, Age Verification, etc.). The 947 width is a specific embed dimension.

### Source pages (Sumsub ID Connect)

| Page | ID | Status |
|---|---|---|
| Sumsub ID ✦ MiniPay | `6:67060` | ❇️ PROD |
| Sumsub ID Connect | `0:1` | ❇️ PROD |
| Age Verification | `6:75992` | WIP |
| concept | `480:17930` | WIP concept |
| Sumsub ID connect OLD | `2:103` | legacy |

---

## Pattern Decision Tree

```
What kind of Sumsub ID screen?
├── User account dashboard (settings/docs/MFA/devices)
│   → Pattern A (1440 + Sidebar 384 + Content 1024)
│
├── WebSDK auth flow (welcome / status screens during onboarding)
│   → Pattern B (1440 + centered Toolbar 718 + Container 1392)
│
└── Embedded Connect widget (partner integration)
    → Pattern C (947 × 812, light #ecedf2 or dark #2a2b30)
```

---

## Notes & gotchas

- **Sumsub ID is its own brand** — distinct from Dashboard. Component naming uses `Sumsub ID / Account / Header`, `*Sidebar* / Desktop`, etc. Don't substitute Dashboard's `*Sidebar*` Type=X variants.
- **384 sidebar is unique to Sumsub ID Account** — don't copy this width to other products. Conversely, don't reduce it to 257/276 if reproducing Sumsub ID Account canonical.
- **Connect uses 947 width** — embeddable, not full-page. Don't auto-default to 1440 here.
- **Light + dark variants in Connect** — both are valid; pick per partner brand. Default light if unspecified.
- **Sumsub ID main file** (`7QlkPyiJa2SItuIeQFkgdr`) is just diagrams/cover, no UI mockups. Don't sample for canonical references.
- **Blockchain file** (`fumcvd5IPvlG5v5ZCGKixR`) is older — verify with user before using as reference.
