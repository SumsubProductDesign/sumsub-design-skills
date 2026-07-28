# AML Screening — Layout Patterns

> Source file: `3N6oxnOdDfsULIQ5teXKbw`
> Scan date: 2026-04-29
> Three patterns in one file — Vendors (1920+276), Resolution chain (collapsed sidebar 52), Ongoing monitoring (1920+276).

---

## Critical canvas dimensions

AML Screening file **mixes two canvas widths**:
- **1920** for Vendors / Ongoing monitoring (Settings family)
- **1440** for Resolution rule chain (collapsed sidebar editor)

Sidebar is **276** in Pattern A, **52** (collapsed) in Pattern B.

---

## Pattern A — Vendors / Ongoing monitoring (1920 + 276 + Header 120)

> Pages `2:9` "Vendors settings" (Comply advantage etc.), `3130:213974` "Ongoing monitoring"
>
> 🔄 **Updated v3.164 (2026-06-10): canonical drift confirmed** via metadata scan of `3130:238046` (5.2. Comply advantage). The old "no Header, sub-tabs in Body via *Tab Button*" layout is DEAD — those Tab Button / Tab Basic nodes are still in the canonical but **hidden**. Current canonical uses the Global-Settings-style **`*Header*` 1644×120 with Subheader tabs** (4 visible tab items, Selected on the current vendor group).

```
Root (1920 × 1163, fill #ffffff)
├── *Sidebar*  (276 × 1163, x=0, y=0)
└── Body      (1644 × 1163, x=276, y=0)
    ├── *Header*  (1644 × 120, Production=True Version=Old Type=Generic)   ← Subheader tabs live HERE
    └── Frame 270989628  (1644 × 1043, y=120)
        └── Page Content  (1084 × 932 @ x=280 — centered, 280/280 side margins)
            ├── Vendor organism (e.g. `Comply advantage` 640×932, file-local key bcd11d71e58b9b3eb1c525143ca1a19da370155e)
            └── Tip organism (`Tip / Comply advantage` 380×348 @ x=704, file-local key 3e60467a96647aae64b64744226051b71a7abff2)
```

**Confirmed dimensions** from `3130:238046` (re-scanned 2026-06-10):
- Sidebar: 276 × 1163 @ (0,0)
- Body: 1644 × 1163 @ x=276 — layout sum 276 + 1644 = 1920 ✓
- Header: 1644 × **120** (NOT absent, NOT 64)
- Page Content: 1084 @ x=280 inside Frame 270989628 (280 + 1084 + 280 = 1644 ✓)
- Old `*Tab Button*` (370×40 @ 303,148) and `Tab Basic / Item` — present but **hidden=true** in canonical; do NOT build them.

Matches Global Settings Pattern B (1920 + 276 + Header 120). The pre-drift "Pattern A without Header" no longer exists in canonical.

---

## Pattern B — Resolution rule chain (collapsed sidebar 52, no header)

> Pages `2:8` "Resolution rule chain", `3464:200717` "Test Resolution rule chain"

```
Root (1440 × 955+, fill #ffffff)
├── *Sidebar*  (52 × 955, x=0, y=0)            ← COLLAPSED variant (NOT 276)
└── Body      (1388 × 955, x=52, y=0)          ← takes remainder of 1440
    └── (rule chain editor / chain visualization)
```

**Confirmed dimensions** from `AML rules`:
- Sidebar: **52** × 955 (collapsed icon-only variant)
- Body: 1388 × 955 at x=52
- Layout sum: 52 + 1388 = 1440 ✓

**No `*Header*`** — rule chain editor uses Body chrome internally. Page is full-screen editor with collapsed sidebar nav for quick context switching.

This pattern matches Blueprint editor (CM Pattern C) and KYB Levels Pattern B variant — collapsed-sidebar editor flow.

---

## Pattern Decision Tree

```
What kind of AML Screening screen?
├── Vendors settings (Comply advantage, GBG, etc.) / Ongoing monitoring config
│   → Pattern A (1920 + Sidebar 276 + Header 1644×120 with Subheader tabs + Page Content 1084 centered)
│
├── Resolution rule chain editor (rule list + visual chain)
│   → Pattern B (1440 + collapsed Sidebar 52 + Body 1388, no Header)
│
└── Test Resolution rule chain
    → Pattern B (same as Resolution chain)
```

---

## Source pages

| Page | ID | Pattern | Canvas |
|---|---|---|---|
| Global settings overview | `245:253` | parent index | — |
| Vendors settings | `2:9` | A | 1920 |
| Resolution rule chain | `2:8` | B | 1440 |
| Test Resolution rule chain | `3464:200717` | B | 1440 |
| Ongoing monitoring | `3130:213974` | A | 1920 |

---

## Notes & gotchas

- **Two canvas widths in one file** — Vendors/Ongoing are 1920, Resolution chain is 1440. Match the page being reproduced.
- **Two Sidebar widths** — 276 for Pattern A, 52 (collapsed) for Pattern B. Don't substitute one for the other.
- **Header:** Pattern A (Vendors) HAS `*Header*` 1644×120 with Subheader tabs since the canonical drift (v3.164; the old Body-internal sub-tabs are hidden in canonical). Pattern B (Resolution chain) still has NO `*Header*` — Body-internal chrome.
- **Ongoing monitoring page sometimes has duplicate sidebars** — observed `Menu` instance (281×900) AND `*Sidebar*` (276×911) at x=0. Likely a left-over migration artifact in the canonical. When reproducing, use only `*Sidebar*` (276) and skip the legacy `Menu`.
