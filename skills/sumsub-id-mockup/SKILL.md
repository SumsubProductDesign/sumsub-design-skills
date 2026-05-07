---
name: sumsub-id-mockup
description: "Create Figma mockups for Sumsub ID dashboard products — Account (user dashboard), Connect (embeddable partner widget), Reusable KYC. Sumsub ID is a separate brand/design language from Dashboard."
argument-hint: "[screen description]"
---

# Figma Skill: Sumsub ID Mockup Builder

> Create Sumsub ID product mockups: **Account** (user-facing identity dashboard), **Connect** (embedded auth widget for partner sites), **Reusable KYC** (verification reuse flow).
>
> ⚠️ Sumsub ID is **its own product line** with distinct brand and components. Don't mix Sumsub ID components with Dashboard `*Sidebar*` 257/276 or WebSDK Widget shells.
>
> ⚠️ **Sumsub ID WebSDK flow** (auth onboarding screens with centered toolbar) is **out of scope** for this skill — handled by `websdk-mockup` skill instead.

---

## Trigger phrases

This skill should activate when the user asks for:

- "Sumsub ID" + (account / dashboard / settings / profile / MFA / devices / emails / docs)
- "Sumsub ID Connect" or "SS ID Connect" or "Connect widget"
- "MiniPay" (Sumsub ID Connect partner integration)
- "Age Verification" (Connect partner integration)
- "Reusable KYC" or "Reusable Identity" (verification reuse flow)
- "Magic links" (Sumsub ID Account feature)
- "Trusted devices" (Sumsub ID Account feature)
- "Attestations" (Sumsub ID feature)

If the request is "Sumsub ID welcome screen" / "Sumsub ID auth flow" / "Sumsub ID onboarding flow" → that's WebSDK, redirect to `websdk-mockup`.

---

## Pre-flight (mandatory before any tool call)

1. **Plugin version check** — same as `sumsub-mockup`. Read local `plugin.json` + WebFetch remote, compare. Update prompt if mismatch.
2. **Read references:**
   - `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-id-mockup/reference/sumsub-id-pattern.md` — full layout patterns + dimensions
   - `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-id-mockup/reference/reusable-identity-pattern.md` — Reusable KYC layout
3. **Locate canonical:** the source files for canonical references are:

| Sub-product | Source fileKey | Pattern |
|---|---|---|
| Sumsub ID Account | `F38QSCQ62kCVe8ROwpXdvn` | A — 1440 + Sidebar **384** + Content 1024 |
| Sumsub ID Connect | `Z87D5m8KArTvQWH13Nwmmo` | C — 947×812 embed (light + dark) |
| Reusable KYC | `Fp0igOPOHzi00ZDqOsO5mk` | P1 — 1440 + Sidebar 257 + Content 1183 |

4. **Rule #0 — ASK where to create.** Same as `sumsub-mockup`. Don't default to a fileKey from memory or pattern docs.

---

## Critical canonical-first rule (inherited from sumsub-mockup v3.72+)

**Before building any Sumsub ID screen, find the canonical equivalent in the source file and match dimensions exactly.** Don't invent "reasonable defaults". The pattern doc gives you canonical dimensions per pattern, but per-screen heights/contents must come from inspecting the canonical instance.

Specifically — **the 384-wide Sidebar in Sumsub ID Account is unique** to this product:
- Don't substitute `*Sidebar*` 257 (Dashboard standard) or 276 (Settings family)
- Don't reduce to a smaller width "for consistency"
- The 384 width is brand-driven — it accommodates avatar + identity card preview + descriptive nav items

**Connect widget 947×812** is also unique — it's an embeddable size, not full-page. Don't auto-default to 1440 here.

---

## Sub-products & layout patterns (summary)

### Sumsub ID Account (Pattern A)

```
Root (1440 × 900)
├── Sumsub ID / Account / Header  (1440 × 64, full-width overlay)
├── *Sidebar* / Desktop            (384 × 900, x=0)        ← UNIQUE 384px width
└── content wrapper                (1024 × 836, x=384, y=32, 32px right margin)
```

Used for: account dashboard, settings, MFA, trusted devices, magic links, emails, docs, attestations, change avatar, history, connections.

### Sumsub ID Connect (Pattern C)

```
Root (947 × 812)                                    ← embeddable widget size, NOT full page
├── fill: #ecedf2 (light) OR #2a2b30 (dark)
└── Frame 2085662918 (947 × 780, y=16)
    └── (Connect login widget content)
```

Used for: partner integrations (MiniPay, Age Verification). Two theme variants — pick light by default, dark if partner brand requires it.

### Reusable KYC (Pattern P1)

```
Root (1440 × 900)
├── *Sidebar*  (257 × 900, x=0)                    ← STANDARD 257 (different from Account 384)
└── (Wokspace_1280x720 wrapper)
    ├── *Header*   (1183 × 64, x=257, y=0)
    └── Content   (1183 × 836, x=257, y=64)
```

Standard Pattern 1 — same as Marketplace Integrations. Reusable KYC is administratively part of Sumsub ID but uses Dashboard chrome since it's an admin-facing config.

---

## Banned patterns

- **Don't use 257 / 276 sidebar for Sumsub ID Account.** It's 384. Always.
- **Don't use 1440 canvas for Connect.** It's 947×812 embed.
- **Don't mix Connect light + dark in same screen.** Pick one theme per mockup.
- **Don't substitute Sumsub ID `Header` with Dashboard `*Header*`.** Sumsub ID has its own `Sumsub ID / Account / Header` component.
- **Don't build Sumsub ID WebSDK auth flow here** — that's `websdk-mockup` territory (centered toolbar 718 + Container 1392 pattern).

---

## Audit (canonical-match)

Same audit framework as `sumsub-mockup` (v3.72+ canonical-first rule, audit 7.45). Build a `productContext.canonicalMap` during canonical inspection:

```js
{
  productContext: {
    product: "sumsub-id",
    requiresCanonical: true,
    canonicalMap: [
      { screenLabel: "Account dashboard",
        frameW: 1440, frameH: 900, frameBg: "#FFFFFF",
        // sidebar 384 + content 1024
      },
      { screenLabel: "Connect MiniPay",
        frameW: 947, frameH: 812, frameBg: "#ECEDF2",
      },
      // ...
    ]
  }
}
```

Audit verifies:
- Sidebar width 384 (Account) — NOT 257 or 276
- Canvas 947×812 (Connect) — NOT 1440
- Bg fill matches canonical exactly (light vs dark theme)
- All 6 properties (frame W/H, bg, instance pos, instance dims after resize, variant) within 2px tolerance

---

## Source pages reference

See `reference/sumsub-id-pattern.md` for full source page IDs and per-feature canonical locations.

---

## Build workflow (high level)

1. Identify sub-product (Account / Connect / Reusable KYC).
2. Inspect canonical in source file → build `canonicalMap`.
3. Pre-cache: import Sumsub ID-specific components (`Sumsub ID / Account / Header`, `*Sidebar* / Desktop`, etc.).
4. Find Drafts page in target file (Rule #0).
5. Build matching dimensions from `canonicalMap`. NO hardcoded defaults.
6. Run audit 7.45 → 0 deviations or fix and re-run.
7. Deliver URL after audit passes.

For full Critical rules, audit script details, and shared patterns — see `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/SKILL.md`. This skill inherits all rules from sumsub-mockup; only the canonical references and trigger context differ.
