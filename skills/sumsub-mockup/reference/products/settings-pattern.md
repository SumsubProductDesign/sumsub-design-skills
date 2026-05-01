# Settings (Profile / Team / Roles / Branding) — Layout Pattern

> Source file: `Sr2T9AUlfHC2MCvLcvjBlm` (Settings)
> Scan date: 2026-04-30
> **Unique 2-level sidebar pattern.** Used only in this product.

---

## Critical canvas dimensions

**1920-wide canvas + DUAL sidebar** (80 + 191 + 1649 = 1920). No other Sumsub product uses this 2-level menu layout.

| Region | Width | Position | Purpose |
|---|---|---|---|
| `Menu / Group` | 80 | x=0 | Primary nav — icon-only (Dashboard, Applicants, Settings, etc.) |
| `*Additional Menu*` | 191 | x=80 | Secondary subsection nav within Settings (Profile/Team/Roles/Branding/Business info/Legal info) |
| `*Header*` | 1649 | x=271, y=0 | Page chrome with title + actions |
| Content area | 1649 | x=271, y=64 | Forms / tables / settings content |

Layout sum: `80 + 191 + 1649 = 1920` ✓

---

## Pattern — Settings hub (1920 + Menu 80 + Additional Menu 191)

```
Root (1920 × 1080+, fill #ffffff)
├── Menu / Group              (80 × 1080)              ← primary icon-only nav at x=0
├── *Additional Menu* / Group  (191 × 1080)             ← subsection menu at x=80
├── *Header*                   (1649 × 64, x=271, y=0)
└── Content                    (1649 × scroll, x=271, y=64)
    └── (form rows, tables, settings)
```

**Confirmed dimensions** from `Roles` (Team/Roles/Members):
- Menu / Group: 80 × 1080
- Additional Menu: 191 × 1080
- Header: 1649 × 64 at (271, 0)
- Roles table: 1649 × 649 at (271, ~80)

---

## Pattern Decision Tree

```
Is this Settings (Profile/Team/Roles/Branding/Business info/Legal info)?
   → YES → ALWAYS this pattern: 1920 + Menu 80 + Additional Menu 191 + Header 1649
     Don't substitute the standard `*Sidebar*` (257 or 276) — Settings has unique nav structure.
```

---

## Source pages

| Page | ID | Purpose |
|---|---|---|
| 🛠 Profile | `25:81766` | parent for Profile sub-pages |
| 2FA | `1249:179184` | profile 2FA settings |
| Profile settings - Locale | `4867:19027` | locale prefs |
| Team - Members - Groups - Roles | `25:81767` | team management |
| Owner modal | `5195:249633` | role transfer modal |
| 🛠 Branding | `25:81768` | brand customisation |
| 🛠 Business information | `2:90` | business profile |
| 🛠 Legal information | `766:138149` | legal docs |
| 🛠 Reset settings to Default | `3022:35194` | factory reset flow |

---

## Notes & gotchas

- **NEVER use `*Sidebar*` 257 or 276** — Settings has its own dual-menu structure. Substituting will misalign Header (which expects x=271 not x=257 or x=276).
- **80 + 191 = 271** — Header and Content always start at x=271, never x=257 (modern Sidebar) or x=276 (Settings family).
- **`Menu / Group` is icon-only at 80px** — list of dashboard root sections, all rendered as 24x24 icons.
- **`*Additional Menu* / Group` at 191px** is the contextual subsection menu — shows Profile/Team/Branding/etc. items while you're in Settings. Opens automatically when user clicks Settings in primary Menu.
