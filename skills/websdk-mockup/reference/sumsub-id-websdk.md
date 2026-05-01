# Sumsub ID WebSDK — Auth Flow Pattern

> Source file: `HQjWYtGpp95LEgLGAPTSwR` "Sumsub ID | WebSDK"
> Scan date: 2026-04-30
> **Sumsub ID has its own WebSDK auth flow** — distinct from KYC and KYB WebSDK. Different toolbar, different container layout.

---

## When to use this pattern

Activate when user asks for **Sumsub ID welcome / status / onboarding** screens (the actual user-facing auth flow during onboarding). Do NOT use for:

- **Sumsub ID Account dashboard** (settings, MFA, devices) → that's `sumsub-id-mockup` skill, Pattern A (1440 + 384 sidebar)
- **Sumsub ID Connect** (embeddable partner widget) → that's `sumsub-id-mockup` skill, Pattern C (947×812)
- **KYC WebSDK** (document/selfie/liveness flow) → standard Widget+organism canonical, see `examples-library.md`
- **KYB WebSDK** (company verification) → see `kyb-organisms.md`

---

## Layout (1440 + centered Toolbar 718 + Container 1392)

```
Root (1440 × 900, fill #ffffff)
├── Toolbar / Top Bar / Desktop  (718 × 68, x=361, y=0)    ← CENTERED (NOT full-width)
└── Container                    (1392 × 808, x=24, y=68)  ← 24px L/R margins
```

**Centered toolbar:** 718 wide, x=361. `(1440 - 718) / 2 = 361` — exactly centered with equal margins.

**Container:** 1392 × 808 with 24px left margin and 24px right margin (`1440 - 24 - 1392 = 24`). Centered between gutters.

**This is NOT a full WebSDK Widget** like KYB or KYC. Sumsub ID WebSDK is a simpler welcome/status flow with its own layout convention:
- No bottom action bar (per canonical samples)
- Toolbar takes 68px height (vs standard 64)
- Container takes nearly full width minus 24px gutters

---

## Source pages

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

## Notes & gotchas

- **Sumsub ID Toolbar at 68px height**, NOT the standard WebSDK Top Bar 56/64. Don't substitute KYC Top Bar variants here.
- **Toolbar centered**, NOT spanning full 1440 width. The x=361 anchor gives equal 361px margins L+R.
- **No KYC organisms in Sumsub ID WebSDK** — Sumsub ID has its own welcome/status content, NOT the Welcome/Document Type/Camera/Liveness/etc. organisms from KYC examples.
- **Background fill: #ffffff** for the canonical Sumsub ID welcome flow. No off-white tint or dark theme in this product.
- **No Bottom Bar** observed in canonical samples — flow uses inline buttons inside the Container instead.
