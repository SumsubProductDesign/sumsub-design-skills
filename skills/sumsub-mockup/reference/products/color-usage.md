# Color Variable Usage Guide — Sumsub Dashboard
<!-- sourced from: Case page, Applicant page, TM list, Workflow Builder — 2026-03-31 -->
<!-- All variables confirmed from real production Figma files via get_design_context -->

> **RULE:** Always use `semantic/*` variables for custom nodes. Some older files use `base/*` directly — that's a legacy pattern, do NOT repeat it in new work.

---

## Backgrounds

### Surfaces & Panels

| Use case | Variable | Hex |
|---|---|---|
| White card / panel / modal / header | `semantic/background/neutral/inverse/normal` | `#ffffff` |
| Page background | `semantic/background/neutral/subtlest/normal` | `#f6f7f9` |
| Hover row background | `semantic/background/neutral/subtler/normal` | `#edeff2` |
| Drawer / right column background | `semantic/background/neutral/inverse/normal` | `#ffffff` |
| Section divider / subtle surface | `semantic/background/neutral/subtle/normal` | `#e1e5ea` |

### Notes (confirmed from Case page)

| Note type | Background variable | Hex | Border variable | Hex |
|---|---|---|---|---|
| Neutral (default) | `semantic/background/neutral/subtlest/normal` | `#f6f7f9` | `semantic/border/neutral/subtlest/normal` | `#edeff2` |
| Highlighted / Info (blue) | `note/highlighted/background-normal` → `semantic/background/blue/subtlest/normal` | `#f4f8ff` | `note/highlighted/border-normal` → `semantic/border/blue/subtler/normal` | `#d3e2ff` |
| Warning (yellow, e.g. Summy AI) | `semantic/background/yellow/subtlest/normal` | `#fffbf2` | `semantic/border/yellow/subtler/normal` | `#ffe8b8` |

### Status Badges

| Status | Background | Text |
|---|---|---|
| Blue (Processing / Open / Pending) | `components/status/blue/background-normal` → `#d3e2ff` | `components/status/blue/text-normal` → `#0a2d73` |
| Green (Approved / Active) | `components/status/green/background-normal` → `#d0f1e8` | `components/status/green/text-normal` → `#115242` |
| Red (Rejected / Inactive) | `components/status/red/background-normal` → `#ffd2ce` | `components/status/red/text-normal` → `#5c0011` |
| Yellow (Requires action) | `components/status/yellow/background-normal` → `#ffe8b8` | `components/status/yellow/text-normal` → `#5e3700` |
| Grey (Default / None) | `components/status/grey/background-normal` → `#edeff2` | `components/status/grey/text-normal` → `#373d4d` |

### UI Elements

| Element | Variable | Hex |
|---|---|---|
| User avatar / initials circle | `semantic/background/blue/normal` | `#1764ff` |
| Checkbox — checked | `components/checkbox/default/selected/background-normal` | `#1764ff` |
| Checkbox — unchecked | `components/checkbox/default/unselected/background-normal` | `#ffffff` |
| Input field | `components/field/default/background-normal` | `#ffffff` |
| Input field — danger | `components/field/danger/background-normal` | `#fff1f0` |
| Counter chip | `components/counter/filled/grey/background-normal` | `#edeff2` |
| Progress bar track | `semantic/background/neutral/subtler/normal` | `#edeff2` |
| Progress bar fill | `semantic/background/blue/normal` | `#1764ff` |
| Scrim / overlay | hardcoded: `{ r:0.13, g:0.15, b:0.21, opacity:0.4 }` | `#212736 @ 40%` |

---

## Text

### Body & Labels

| Use case | Variable | Hex | Style |
|---|---|---|---|
| Page title / strong heading | `semantic/text/neutral/strong` | `#212736` | semibold/h4-xl |
| Section title in panel | `semantic/text/neutral/strong` | `#212736` | bold/body-m |
| Author name (note) | `semantic/text/neutral/strongest` | `#0e1423` | bold/body-m |
| Body / default text | `semantic/text/neutral/default` | `#373d4d` | regular/body-m |
| Note content text | `semantic/text/neutral/strong` | `#212736` | regular/body-m |
| Secondary / meta text (date, "2 of 5 completed") | `semantic/text/neutral/subtle` | `#586073` | regular/body-s |
| Placeholder ("Write a note") | `components/field/text-placeholder-normal` | `#a6afbe` | regular/body-m |
| White text (on blue avatar) | `semantic/text/neutral/inverse` | `#ffffff` | bold/body-s |
| Checkbox label text | `components/checkbox/text-normal` | `#373d4d` | regular/body-m |
| Counter text | `components/counter/filled/grey/text-normal` | `#373d4d` | medium/body-s |
| Button secondary text | `components/button/secondary/default/text-normal` | `#373d4d` | medium/body-m |

### Tabs (confirmed from Applicant page + Case page)

| State | Variable | Hex |
|---|---|---|
| Active tab text | `semantic/text/blue/normal` | `#1764ff` |
| Active tab underline | `semantic/border/blue/normal` | `#1764ff` |
| Inactive tab text | `semantic/text/neutral/subtle` | `#586073` |
| Tab strip baseline | `semantic/border/neutral/subtler/normal` | `#e1e5ea` |

---

## Borders & Dividers

| Use case | Variable | Hex |
|---|---|---|
| Panel / card border | `semantic/border/neutral/subtler/normal` | `#e1e5ea` |
| Header bottom border | `semantic/border/neutral/subtler/normal` | `#e1e5ea` |
| Right column left border | `semantic/border/neutral/subtler/normal` | `#e1e5ea` |
| Section divider | `semantic/border/neutral/subtler/normal` | `#e1e5ea` |
| Input field border | `components/field/default/border-normal` | `#c4cad4` |
| Checkbox unchecked border | `components/checkbox/default/unselected/border-normal` | `#c4cad4` |
| Vertical button group divider | `components/divider/line-background-normal` | `#e1e5ea` |
| Subtle container border | `semantic/border/neutral/subtlest/normal` | `#edeff2` |

---

## Section Headers in Panels (Right Column Pattern)

> Confirmed from Case page right column: Checklist, Notes sections

```
[Row] icon + title + counter + subtitle
  icon:     normal/{name} icon — semantic/icon/neutral/normal (#586073)
  title:    semantic/text/neutral/strong (#212736) | bold/body-m (14px Bold)
  counter:  components/counter/filled/grey/background-normal (#edeff2) + text (#373d4d) | medium/body-s
  subtitle: semantic/text/neutral/subtle (#586073) | regular/body-s
```

---

## Typography Confirmed from Production

| Style token | Size | Weight | Line-height | Used for |
|---|---|---|---|---|
| `bold/h3-2xl` (or `bold/h4-xl`) | 18-20px | Bold | 28px | Case/page title |
| `bold/body-m` | 14px | Bold | 24px | Panel section titles, author name |
| `bold/body-s` | 12px | Bold | 16px | Avatar initials |
| `medium/body-m` | 14px | Medium | 24px | Tabs, button text, counter text |
| `medium/body-s` | 12px | Medium | 16px | Counter chip, status badge text |
| `regular/body-m` | 14px | Regular | 24px | Body text, note content, checkbox label |
| `regular/body-s` | 12px | Regular | 16px | Meta text, dates, "2 of 5 completed" |

---

## Variable Name Patterns

Two naming conventions are in use across files:

| Convention | Example | Where used |
|---|---|---|
| `semantic/*` | `semantic/background/neutral/inverse/normal` | Case page (newer) → **use this** |
| `components/*` | `components/field/default/background-normal` | Component-scoped tokens → auto-applied by components |
| `base/*` | `base/neutral/100` | Applicant page (legacy) → do NOT use in new work |

> Components apply their own `components/*` variables internally. You only need to set `semantic/*` variables on custom frames, text nodes, and rectangles you create manually.

---

## Spacing Confirmed from Production

| Token | Value | Used for |
|---|---|---|
| `spacing/s` | 8px | Gaps within rows, button group gaps, note padding |
| `spacing/m` | 12px | Note horizontal padding, footer gaps |
| `spacing/lg` | 16px | Section vertical padding (right column sections) |
| `spacing/2xs` | 4px | Icon-to-text gaps, tight badge spacing |
| `spacing/3xl` | 32px | Page-level horizontal padding |
| `spacing/xl` | 24px | Standard content padding (SP.xl in helpers.js) |

---

## Border Radius Confirmed from Production

| Token | Value | Used for |
|---|---|---|
| `border-radius/s` | 2px | Checkboxes, small controls |
| `border-radius/m` | 4px | Input fields, buttons |
| `border-radius/lg` | 8px | Notes / message bubbles |
| hardcoded `40px` | 40px | Counter chips, status badges (pill shape) |
| hardcoded `100px` | 100px | Status badges (fully round) |
| hardcoded `20px` | 20px | User avatar circles |
