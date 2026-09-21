# Dashboard shell — version record

The default shell every dashboard prototype starts from: sidebar, island,
header, empty content slot. Rendered by `scripts/shell.js`; described in
`references/shell.md`. **Update this file whenever anything in this folder
changes**, and re-run the two example configs against the reference renders.

## Snapshot

| | |
|---|---|
| taken | 2026-09-17 |
| geometry, colours, text, icons | Figma *Base components / Dashboard UI Kit*, branch `F3eDy4iSOV1qt1BiffoFd4`: layout master `23287:109253` (Ver=New, Type=Basic), sidebar `23287:109254`, header `23287:109256`, island `23289:48583`; expanded-menu demo `29905:77088`; outline icon set `29905:73811`, filled icon set `29905:74061` |
| menu order and top-level labels | the designer's final layout, 2026-09-18 (screenshot of the product sidebar): 18 visible items — Dashboard, Summy AI Copilot, Applicants, Integrations, Reusable identity, Transactions and travel rule, AML screening, Case management, Solutions, Statistics, Reports, Billing, Settings, Dev space, Marketplace, Verifications Control, Compliance Hub, Mission control. Device intelligence, Client lists, Review panel and Admin area stay in `menu.json` with `hidden: true`. Labels are the product's (`figma_label` keeps Tasks, Operator, Transactions and Travel Rule). The Figma sidebar's own 21-item order lives on in `examples/*.json` for the gate |
| menu nesting | the product on dev-cockpit.sumsub.com, from the designer's screenshots of every expanded section; six sections have no nesting for now (Client lists, Tasks, Operator, Review panel, Mission control, Admin area) |
| hover | Figma *Organisms / Dashboard UI Kit* `1uOogG5Kyj80pwhtBqjb8g`, section *Sidebar 2.1 - Navigation menu* `5608:62979` (2026-09-18): the Row box takes a background, radius stays 8, label and icon do not change. First level and Collapse `#e5e7eb` (`5578:35915`, `5606:48222`; the Collapse variant resolves the same token to `#edeff2` — the item's value is used), second level `#e1e5ea` (`5578:36364`, `5579:36383`), third level `#d1d5dc` (`5572:40265`), collapsed rail item `#e5e7eb` (`5572:40856`). Expanded/active rows have no hover variant and get none. Not built: the rail hover popover (section name, or the second-level list for a parent) and the key-name selector hover (`5559:35791`) |
| font | Geist Variable, woff2 from `static.sumsub.com/checkus/assets/asset-ior2l1ew.woff2`, inlined as base64 (70 KB) |
| Solutions | the product's item at position 16 (dev label + dev sprite icon `apps`); Figma still shows *Marketplace* with the `first-unreviewed` icon there — icon to re-export once Figma catches up |

## Geometry (canvas px, from Figma)

| | |
|---|---|
| sidebar | **264** wide (the product's width, 2026-09-18), all of it content: rows are 4px from either edge, the overlay scrollbar draws over the last 8px when the menu overflows; the Figma component is 257 and the gate compares its first 257 columns |
| key header | 56: logotype 36 box (`#fff`, 1px `#edeff2`, radius 8), key name Bold 14/24 `#373d4d`, info button (1px `#d1d5dc`, radius 8) |
| first-level item | 40 (row 36, pl 6, icon 24 in a 36 wrapper, label Medium 14/24 `#373d4d`); active: label Bold `#030712` and the filled icon; the row background `#edeff2` (full 40 row) **only for a section without nesting** (`29966:73467`, Dashboard) — an expanded section with children has none, and it hovers like any other row. Designer's rule 2026-09-18; the gate cannot see `#edeff2` vs `#f3f4f6` (below zonediff's threshold), so keep it by hand |
| second-level row | leaf 40, pl 40 pr 8, inner px 12 py 4 radius 8; **group 36 with no vertical padding** (the product's height, designer's rule 2026-09-18; Figma's component is 40): chevron 16 (up when open), label Bold while it holds the active leaf; leaf active: `#e5e7eb` pill, Bold `#030712` |
| third-level row | 36, pl 64 pr 8, inner px 8 py 4 radius 8; active: `#e5e7eb` pill, Bold `#030712`, connector `#d3d7df` from the group row to the leaf (12.5×19 for the first child, +36 per row below) |
| collapse | 64 with 1px top `#e5e7eb`, row 40 with `panel-close-left` and "Collapse"; folded: see *Basic layout, sidebar collapsed* below |
| menu scroll | the item list scrolls under the key header and above Collapse; the scrollbar lies **over** the list (designer's rule 2026-09-18): the native bar is hidden and `.sh-scroll` draws the product's thumb — 6px, `#d1d5dc`, radius 8, hover `#b4bac4`, track inset 4px — in the sidebar's last 8px, only while the menu overflows, positioned by a 6-line script on scroll and resize. Rows in the list stop 12px short of the right edge (4px on the left), so boxes, hover and pills keep ≥4px from the thumb at 257..263; the rail's icons stay centred. Headless renders show the thumb too (it is DOM, not a native bar) |
| fade above Collapse (from the product) | dev's `.sidebar-collapse::before`: 24px, transparent → `#f3f4f6`, ending at the Collapse border, full width; basic layout only — the collapsed sidebar on dev has neither Collapse nor fade |
| island | left 264, 8px gap top/right/bottom, 1px `#e5e7eb` **inside** the frame, radius 16, white |
| header | 56 including its 1px bottom border; px 20 py 12; title SemiBold `#212736`, key name Regular `#4a5565`; actions right-aligned: search 240×32, AI button 32, Production toggle 106, two 32 icon buttons, userpic 32 |
| content origin | x = 264 + 20 = **284**, y = 8 + 56 + 20 = **84** (canvas coordinates); width = canvas − 264 − 8 − 40 |

Every 1px stroke is an inset `box-shadow`, never a CSS `border`: Figma draws
strokes inside the frame without moving its children.

Icons are inlined by `shell.js` `icon()`, which keeps the root `viewBox` **and the
root `fill`**: Figma exports carry `fill="none"` on the `<svg>`, and a stroke-only
child (the ring of the key-info badge) turns black without it (found 2026-09-18
on the collapsed sidebar).

The header, fullscreen header and tab subheader have **no background of their
own**: the island is white, and an inset `box-shadow` is painted beneath
children, so a child with a background would hide the island's frame along
the header (found 2026-09-18 on the viewport test page).

Filled sidebar icons are exported by Figma as tight vectors and placed inside
the 24 box at an explicit offset; `icons/insets.json` carries the placement per
icon (also `reusable-identity-outline`, which is an 18×18 vector at 3,3).

## Fullscreen layout (`"layout": "fullscreen"`), added 2026-09-18

| | |
|---|---|
| source | Figma master `23287:109258` (Ver=New, Type=Full screen page) with the tab subheader; Page instance `29909:77556` without it; collapsed sidebar `23287:109259`; header `23287:109261` |
| rail | 52 wide; key header 56 with the 36 logotype box centred and an 18px info badge at 25,24 overflowing it; items 40 (row 36 centred, icon 24 in a 36 wrapper — the wrapper overflows the 34px content box and centres, so the row must have `min-width:0`); active: the filled icon, and the `#edeff2` row only for a section without nesting — the same rule as the first-level item; no Collapse control |
| header | 56: px 20 py 12; Info: breadcrumb "Section name /" Medium `#6a7282`, title SemiBold `#030712`, key name Regular `#6a7282`, gap 8; Actions right: optional secondary buttons (1px `#d1d5dc`, radius 8, px 12) gap 12, AI button 32, gap 8, question button 32 |
| subheader (optional) | 41: white, pt 8, 1px bottom `#e5e7eb` — the **only** line under the tabs. The Tab Basic component declares a 1px `#d1d5dc` bottom stroke in its design context, but neither Figma render draws it (checked 2026-09-18 on the master and on Navigation redesign `13442:112348`); a build that draws it shows a doubled line. Tabs Medium 14/24, gap 24, py 4; selected `#1e2939` with a 2px `#030712` bottom inside, unselected `#4a5565` |
| content origin | x = 52 + 20 = **72**; y = 8 + 56 (+ 41 with tabs) + 20 = **84** or **125** |
| accepted numbers | rail 0.59% (2026-09-18, after the info badge kept its root `fill="none"`; was 0.75% with a black ring), rail gap 0.00%, header + tabs 1.14% (2026-09-18, after the header lost its own background and the tab bar its phantom #d1d5dc line; 2.11% before), island frame 0.00%; identical in the no-tabs state |

The product's fullscreen page (an applicant's overview on dev) has the same
rail, breadcrumb header and tabs, plus a second header row with the applicant
id, external id and tags — that row is the header's "Additional info" slot and
is content, not shell.

## Basic layout, sidebar collapsed (`"sidebar": "collapsed"`), added 2026-09-18

| | |
|---|---|
| source | Organisms / Dashboard UI Kit `1uOogG5Kyj80pwhtBqjb8g`, frame *Workspace 590* `5558:43841`: `*Sidebar*` Collapsed=True (`5614:189259`) next to the basic header — the product's Collapse state. The rail itself is the fullscreen rail (same component); only the bottom row is new |
| rail | as the fullscreen layout: 52, key header 56, items 40, active row `#edeff2` with the filled icon, scrollbar with the 8px gutter |
| Expand row | 64 with 1px top `#e5e7eb`, py 12, a 40 row with `panel-close-right` centred; hover as a rail item; no fade above it (none in Figma, none on dev) |
| header, content origin | the basic header unchanged; x = 52 + 20 = **72**, y = **84**, or **125** with the tab subheader |
| accepted numbers | against the frame's rail, shifted 1px (the instance sits at x = −1): logo, active Integrations row, Expand icon and the last item's ink boxes within 1px; percentages 3.9–8.2% are the half-pixel antialiasing of that offset, not geometry |

## Basic header with the tab subheader (`page.tabs` on the basic layout), added 2026-09-18

The *Header* component carries the same 41px *Header / Subheader* in both
layouts (AML screening file, frame *AML rules* `3467:222795`: header 56 +
subheader 41 = 97 over the basic actions). The basic header now takes
`page.tabs` like the fullscreen one; geometry and colours are the fullscreen
subheader's. A tab may carry a tag, `{"label", "tag"}`: *Tag Colorful / Blue /
Small* from Base components `688:29153` — `#dbeafe`, 1px `#bfdbfe` inside,
radius 8, px 8 py 2, Medium 12/16 `#1e40af`, 4px after the label. The blue
selected tab that frame shows is the pre-redesign style; the shell keeps the
black one from `23287:109261`. Checked on *AML rules*: the tab row's ink runs
73..1072 against the frame's 73..1076, both tags within 1px.

## Where the product (dev) differs from Figma, 2026-09-17

| | Figma (built) | dev |
|---|---|---|
| sidebar width | 257 — the shell uses dev's 264 since 2026-09-18 | 264 |
| header height | 56 | 57 |
| second/third-level rows | 40 / 36 | 36 / 32 |
| leaf pill | radius 8, `#e5e7eb` | radius 12, `#e5e7eb` |
| labels | Tasks, Operator, Marketplace | Verifications Control, Compliance Hub, Solutions |
| nesting labels | (demo component only) Individuals, Companies, SDK translations, Client list | Individual levels, Company levels, SDK text, Client lists — **used** |

## Accepted numbers (the gate's baseline)

`examples/figma-master.json` rendered at 1440×1080 against
`reference/layout-master-1440x1080.png`, and `examples/figma-demo.json`
against `reference/sidebar-demo-1440x1080.png`:

| zone | diff |
|---|---|
| sidebar, master state (first 257 columns) | 2.17% (2026-09-18, sidebar 264 with the gutter; 2.09% at 257) — glyph antialiasing; every row's ink box identical to Figma's |
| sidebar text-free strip | 0.00% |
| header | left 520px, crops aligned to each island's left edge: 1.56%; right cluster (shared coordinates, right-aligned): 1.97% (2026-09-18, island at 264; 1.68% as one zone at 257; 3.49% while the header had its own background) |
| island frame, gaps | 0.00% |
| sidebar demo state: key header / Dashboard row / Applicants open / Integrations open | 1.96% / 1.60% / 2.09% / 3.38% |

Ink boxes of the header title, search box, right cluster and of ten sidebar
rows match the Figma render to the pixel; the residue is text rasterisation.
The Figma sidebar-demo render draws its Collapse over an unclipped list below
y=1016, so that zone is not comparable and is excluded.

## How to update

1. Re-read the Figma nodes above (metadata for geometry, design context for
   text and icon assets, `disableCodeConnect: true`).
2. Replace what changed in `menu.json`, `icons/`, `insets.json` or
   `scripts/shell.js`; re-export the two reference renders if the design moved.
3. Run `scripts/lint.sh` — it renders both examples and diffs them — and put the
   new numbers and the date here. One commit per change, saying what moved.
