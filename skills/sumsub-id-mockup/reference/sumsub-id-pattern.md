# Sumsub ID — Layout Patterns (Account + Connect + Reusable KYC)

> Figma project: `108055557` "Sumsub ID"
> Scan date: 2026-04-30
> Sumsub ID is a separate product line (decentralized identity / wallet / passport-style auth). Distinct design language from Dashboard.
>
> **WebSDK auth flow** (welcome / status onboarding screens) is documented separately in `websdk-mockup/reference/sumsub-id-websdk.md` — that skill handles those screens.
>
> **This doc covers:** Account dashboard, Connect embeddable widget, Reusable KYC (admin config).

---

## Files in Sumsub ID project

| File | fileKey | Pattern | Status | Built by |
|---|---|---|---|---|
| Sumsub ID main | `7QlkPyiJa2SItuIeQFkgdr` | — diagrams + cover | n/a | — |
| Sumsub ID Refs and IA | `QgATn3ggEqzMzGlRG2tZ3A` | — refs | skip | — |
| Sumsub ID Brand | `h6k9ZA5j0wcEK9o5rtXyBW` | — brand assets | skip | — |
| **Sumsub ID \| Account** | `F38QSCQ62kCVe8ROwpXdvn` | **Pattern A** | ❇️ active prod | **sumsub-id-mockup** |
| Sumsub ID \| Blockchain | `fumcvd5IPvlG5v5ZCGKixR` | — | older 2025-08 | check with user |
| Sumsub ID \| WebSDK | `HQjWYtGpp95LEgLGAPTSwR` | — auth flow | ❇️ active prod | **websdk-mockup** (NOT this skill) |
| **Sumsub ID ✦ Connect** | `Z87D5m8KArTvQWH13Nwmmo` | **Pattern C** | ❇️ active prod | **sumsub-id-mockup** |

Reusable KYC lives in a different Figma project file:

| File | fileKey | Pattern | Built by |
|---|---|---|---|
| **Reusable Identity** | `Fp0igOPOHzi00ZDqOsO5mk` | **Pattern P1** (standard 1440+257) | sumsub-id-mockup |

---

## Pattern A — Sumsub ID Account (1440 + Sidebar 384 + Content 1024)

> File: `F38QSCQ62kCVe8ROwpXdvn` "Sumsub ID | Account"

```
Root (1440 × 900, fill #ffffff)
├── Sumsub ID / Account / Header  (1440 × 64, x=0, y=0)    ← full-width overlay header
├── *Sidebar* / Desktop            (384 × 900, x=0, y=0)    ← UNIQUELY WIDE (NOT 257/276)
└── content wrapper                (1024 × 836, x=384, y=32)
    └── (account settings: emails, docs, MFA, devices, magic links, etc.)
```

**Layout sum:** `384 + 1024 = 1408`. Right margin: `1440 - 1408 = 32`. Sidebar at x=0, content wrapper at x=384, with 32px right edge.

**Header overlay:** `Sumsub ID / Account / Header` is 1440 × 64 — overlays both sidebar and content from the top. Sidebar height is full 900 (extends behind/below header).

**y=32** on content wrapper — content starts 32px below header (header occludes y=0..64 visually).

### Critical: 384 sidebar is unique to Sumsub ID Account

| Product | Sidebar width |
|---|---|
| Modern dashboard (Applicants, CM, Marketplace, Reusable KYC) | 257 |
| Settings family (TM, Questionnaires, Databases, Global Settings) | 276 |
| Settings hub (Settings file in Dashboard project) | 80 + 191 = 271 |
| Legacy `*Navigation menu*` | 281 |
| Legacy `sidebar / menu` (very old) | 80 |
| Editor (collapsed) | 52 |
| **Sumsub ID Account** | **384** |

The 384px sidebar is brand-driven — gives extra room for avatar circle + identity card preview + nav items with descriptive subtitles.

### Source pages — Sumsub ID Account

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

## Pattern C — Sumsub ID Connect (947×812 embed, light + dark)

> File: `Z87D5m8KArTvQWH13Nwmmo` "Sumsub ID ✦ Connect"

```
Root (947 × 812, fill light #ecedf2 OR dark #2a2b30)
└── Frame 2085662918  (947 × 780, x=0, y=16)
    └── (Connect login widget — embeddable on partner sites)
```

**Two theme variants:**
- Light: `#ecedf2` (subtlest grey)
- Dark: `#2a2b30` (deep grey)

**Why 947 wide?** Connect is **embeddable**, designed to be placed inside partner pages/apps (MiniPay, Age Verification, etc.). Not a full-page experience. The 947 width is the canonical embed dimension.

**y=16 padding top** on inner Frame 2085662918 — 16px top margin within the 812 viewport, leaving 16px bottom margin too.

### Source pages — Sumsub ID Connect

| Page | ID | Status |
|---|---|---|
| Sumsub ID ✦ MiniPay | `6:67060` | ❇️ PROD — partner integration |
| Sumsub ID Connect | `0:1` | ❇️ PROD — base Connect widget |
| Age Verification | `6:75992` | WIP — Connect for age gate |
| concept | `480:17930` | concept exploration |
| Sumsub ID connect OLD | `2:103` | legacy — skip |

---

## Pattern P1 — Reusable KYC (1440 + Sidebar 257 + Content 1183)

> File: `Fp0igOPOHzi00ZDqOsO5mk` "Reusable Identity"

```
Root (1440 × 900, fill #ffffff)
├── *Sidebar*  (257 × 900, x=0)                    ← STANDARD 257 (NOT 384!)
└── (Wokspace_1280x720 wrapper)
    ├── *Header*   (1183 × 64, x=257, y=0)
    └── Content   (1183 × 836, x=257, y=64)
        └── (reusable KYC config — admin-facing)
```

**Why 257 here, not 384?** Reusable KYC is **admin-facing** (configured by Sumsub clients in their dashboard), so it uses Dashboard chrome standards. Account dashboard is **end-user-facing** (Sumsub ID account holder UI), so it uses Sumsub ID brand chrome.

This is the same as Pattern 1 from `layout-patterns.md` — standard Dashboard list page.

### Source pages — Reusable KYC

| Page | ID | Status |
|---|---|---|
| General flow Detailed Design | `245:253` | parent |
| Partners | `2:8` | dev |
| Reusable KYC | `2:9` | dev |
| Documentation | `3812:37418` | docs page |

---

## Pattern Decision Tree

```
Sumsub ID screen request?
├── Account dashboard / settings / MFA / devices / emails / docs
│   → Pattern A (1440 + Sidebar 384 + Content 1024 + 32px right margin)
│
├── Connect embeddable widget / MiniPay / Age Verification
│   → Pattern C (947 × 812, light #ecedf2 or dark #2a2b30)
│
├── Reusable KYC admin config
│   → Pattern P1 (1440 + Sidebar 257 + Content 1183)
│
└── Sumsub ID WebSDK welcome/status auth flow
    → NOT THIS SKILL — redirect to websdk-mockup
```

---

## Notes & gotchas

- **Sumsub ID is its own brand** — distinct from Dashboard. Component naming uses `Sumsub ID / Account / Header`, `*Sidebar* / Desktop`, etc. Don't substitute Dashboard's `*Sidebar*` Type=X variants.
- **384 sidebar is unique to Sumsub ID Account** — don't copy this width to Reusable KYC (which uses 257) or other products.
- **Connect uses 947 width** — embeddable, not full-page. Don't auto-default to 1440 here.
- **Connect supports light + dark** — pick per partner brand. Default light if unspecified.
- **Sumsub ID main file** (`7QlkPyiJa2SItuIeQFkgdr`) is just diagrams/cover, no UI mockups.
- **Blockchain file** (`fumcvd5IPvlG5v5ZCGKixR`) is older — verify with user before using as reference.
- **Reusable KYC is admin-facing** = Dashboard chrome. Sumsub ID Account is end-user-facing = Sumsub ID brand chrome. Don't confuse the two.
