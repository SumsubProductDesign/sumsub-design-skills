# Applicants table (Applicants LIST) — Layout Pattern

> Canonical source: **`YzK6VnBiqLTqfuaDvPZVc8`** ("Applicants-table"), section **`1156:60753` "Table states"**.
> Scanned 2026-07-27. This is the canonical for the **applicants LIST**, not the Applicant detail page
> (that one is `applicant-page-pattern.md`, file `Di7nvHaOxXiWuDAN1oa0hK`).

⚠️ **Why this doc exists (v3.198):** the skill previously had NO applicants-list canonical indexed. A sim
grepped `dashboard-project-files.md` for "applicant", found only "Applicant page. Device check", concluded
"no canonical exists" and fell back to generic `layout-patterns.md` Pattern 1 (Sidebar 257 + Header 64).
**That is wrong for this product** — canonical uses a 52px Sidebar and a 120px Header. User feedback: *"stop, it
must be in the canon for sure — we've built it 100 times. It's the applicant list, it has to be there."* Never conclude
"no canonical" from one grep — see the general rule at the bottom.

---

## The 6 canonical states (all in section `1156:60753`)

| # | Frame | node-id | Size | Sidebar | Notes |
|---|---|---|---|---|---|
| 1 | `1 Default state. 1440px` | `951:143560` | 1440×940 | **257** (expanded) | filled table, `*Tooltip*` overlay demo |
| 2 | `2 Bulk actions` | `953:19141` | 1440×940 | **52** | rows selected → bulk bar |
| 3 | **`3 No results`** | `1221:20729` | 1440×900 | **52** | ← search returned nothing |
| 4 | `4 No KYC applicants yet` | `1221:21959` | 1440×900 | **52** | + `Note` 400×116 overlay |
| 5 | `5 No KYB applicants yet` | `1221:22380` | 1440×900 | **52** | + `Note` overlay |
| 6 | `6 No networks` | `1221:22822` | 1440×900 | **52** | — |
| 1920 | `1920 Applicants` | `953:16408` | 1920×900 | 52 | wide breakpoint, table 1804 |

> State 1 is the only one with the 257 expanded Sidebar; every other state uses the **52** collapsed rail.
> Match the state you're building — do not copy state 1's sidebar into a no-results screen.

---

## Structure — canonical `3 No results` (`1221:20729`)

```
Root  1440 × 900, layout NONE, fill #FFFFFF (WHITE — not subtlest grey)
├── *Sidebar*   52 × 900  @ (0,0)        variant Type=Applicants, Collapsed=False → resized to 52
└── Body (FRAME) 1388 × 898 @ (52,0)     VERTICAL, no fill
    ├── *Header* 1388 × 120              variant Production=True, Version=Old, Type=Generic
    │     Content 64 + Header / Subheader 56 = 120
    └── body (FRAME) 1388 × 810 @ y=120  VERTICAL, padding 16/32/16/32, no fill
        └── Applicants table  1324 × 778 @ (32,16)   ⚠ FILE-LOCAL component
              ├── Top Toolbar (FRAME 1324×136) = .Top Toolbar / Search + actions + *Filters group*
              └── *Empty State* 1324×108  [Type=Default, Layout=Vertical]
```

**Layout math:** `52 + 1388 = 1440` ✓ · content width `1388 − 64 = 1324` ✓ · table height `810 − 32 = 778` ✓

> Canonical children sum (120 + 810 = 930) exceeds Body's 898 — canonical itself overflows/clips by 32px.
> When building, prefer `bodyInner.layoutSizingVertical = "FILL"` so it resolves cleanly (audit 5 flags the overflow otherwise).

---

## Header configuration (canonical values)

| Property | Value |
|---|---|
| `Title text#3817:0` | `Applicants` |
| `Subheader#4002:0` | `true` ← **page tabs live HERE**, never as standalone `*Tab Basic*` |
| `Breadcrumbs#6913:0` | `true` |
| `Buttons#6943:21` / `↪ First Button#6943:8` / `↪ Second Button#6943:9` / `↪ Kebab#6943:22` | `true` |
| `Key#5362:0` | `true`, `↪ Key Name#6943:13` → real client name (canonical ships default `"Key name"` — **override it**) |
| `Subtitle#3817:6` | `false` |
| Variant | `Production=True, Version=Old, Type=Generic` |

**Subheader tabs (canonical, in order):** `Individuals` (Selected=true) · `Companies` · `Actions` · `Networks`.
Hide the remaining `.Tab Basic / Item` slots.

> 🛑 **Order matters when configuring tabs:** set the `Selected` VARIANT **first**, then write the label.
> Changing a variant re-instantiates the item and **discards text overrides** — setting both in one
> `setProperties` call (or label first) silently leaves `Tab_1…Tab_5` defaults. Also re-query the item list
> on every iteration: `setProperties` invalidates sibling node references (`Node with id … not found`).

---

## `Applicants table` — FILE-LOCAL component

| Property | Value |
|---|---|
| SET key | `7a7487fbd08a680cef777f343ac3a3d5a9517875` (**`remote=false`** → NOT importable cross-file) |
| Variants | `State=Default` · `NEW` · `No results` · `No KYC` · `No KYB` · `No networks` |
| Other prop | `Risk labels#1721:1` (BOOLEAN, default true) |
| Native size | 1324 × 778 (at 1440 breakpoint) |

**Consequences:**
- Building **inside** `YzK6VnBiqLTqfuaDvPZVc8` → instantiate the real component via `getNodeByIdAsync`.
- Building in **another file** → it cannot be imported. Fall back to `Top Toolbar`
  (`fa8defc5fadd20a84c812784786217c6e0003ca0`) + `*Filters group*` + `*Table Starter*` /
  `*Empty State*`, and **say so in the build log**. Ask the user which file they want before starting —
  fidelity vs. not writing into a production file is their call.

### Canonical toolbar content (reproduce in the fallback)
- Search field (400 wide) + camera/scan icon button
- Actions: reverse-arrow (reset), `Custom CSV export`, `Download CSV`, `Create applicant`
- Filters row: `Created` · `Document type` · `Country` · `Level` · `Platform` · `Applicant status` ·
  `Required documents` · `Status` · `Tag`

### Canonical `State=No results` empty state
`*Empty State*` (`0b0b611dba138a4a822b216114888d96513d248a`, `Type=Default, Layout=Vertical`), 1324×108:
- Title — `No results found`
- Subtitle — `We couldn't find what you're looking for. Try a different search term`
- `Buttons#6571:2` = false in canonical; enable it (+ `2nd button#6571:0`) when the state needs a recovery CTA.

> ⚠️ **Two traps when writing the recovery copy (v3.199):**
> 1. The 2nd button's default label is **`Empty search`** — plausible-looking, NOT in the audit's banned-strings list, so it ships silently. Override it and verify in the read-back.
> 2. A secondary CTA here must be an **action**: `Clear search`. "Keep original query" is a no-op — the operator is already looking at the original query's zero result. "Search the original query instead" belongs only in the *auto-corrected* variant (where the visible results are for a different query than the one typed).
> 3. `setProperties` TEXT writes can silently drop substrings (observed: ` U+0441` disappearing from correction copy). For copy with Unicode codepoints or mixed scripts, set `textNode.characters` directly, then re-apply range fills/fonts, then read the text back and assert it.

---

## Realistic data

Applicant IDs are **24-char hex (Mongo-ObjectId style)** — e.g. `65c607aa36997b590dcdf127` (source:
`reference/products/sumsub-docs-user-verification.txt`). `externalUserId` is a client-supplied string.
Never invent formats like `SMPL-c1a2b3`.

---

## Decision tree

```
Applicants LIST screen?
├── filled table, expanded nav      → state 1 (Sidebar 257, root 1440×940)
├── rows selected                   → state 2 (Sidebar 52)
├── search returned nothing         → state 3 (Sidebar 52, *Empty State* inside the table)
├── no KYC / KYB applicants yet     → state 4 / 5 (+ Note overlay)
├── no networks                     → state 6
└── 1920 breakpoint                 → `1920 Applicants` (table 1804 wide)

Applicant DETAIL page (one applicant)? → applicant-page-pattern.md (different file, no sidebar)
```

---

## General rule this doc encodes

**Never report "no canonical exists" after a single grep.** Before falling back to a generic pattern:
1. grep BOTH reference roots (`reference/products/*.md` and `reference/*.md`) for the product noun;
2. search MemPalace for prior builds of the same screen;
3. check the Figma project file list;
4. if still unclear — **ask the user for the canonical URL**. Do not build on generic defaults silently.
