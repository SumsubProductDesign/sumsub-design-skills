# The dashboard shell: a verified default, not a trusted constant

Every dashboard prototype has the same wrapper — sidebar, island, header — and only the
content differs. The shell is built once from the design system's layout component and
reused: `scripts/shell.js` renders it from a short config, the prototype puts its content
into the slot. What it is made of and the numbers it was accepted at:
`assets/shell/dashboard/VERSION.md`.

## Contents

- Default: the shell, not the frame's own chrome
- The gate, in Step 2
- Content in the shell's coordinates
- Content in a fluid shell
- Two layouts
- Config
- The header's two slots
- When the frame's menu disagrees with the shell
- Tabs
- Ledger lines, not questions
- What the shell does not cover

## Default: the shell, not the frame's own chrome

A designer's frame usually carries an older shell than the product ships. The default is
the shell asset; the frame's own sidebar and header are **not** rebuilt or baked. The
person overrides this in Step 0 when the test is about the navigation itself, or the
design changes the shell on purpose.

## The gate, in Step 2

**Read the frame for the shell's *state* only**, in this order and no further:

1. `get_screenshot` of the frame — answers every config question at once: layout
   (labels, rail, rail with an Expand row), active path, client, title, key name,
   Production toggle, tabs.
2. `get_metadata` of the frame — node ids and the header's height (64 old, 56 current).
   Never on the sidebar. A whole page often exceeds the tool limit and lands in a file:
   `scripts/figmeta.py <file> 2`, not chunk by chunk. Skip it when the screenshot already
   answers — `shellgate.sh` reads the header's kind from pixels.
3. `get_design_context` on the **smallest** node holding the header texts, only when the
   exact strings matter; never on the header or sidebar instance.

Then write `_work/shell.json` with a `frame` block and run the gate:

```bash
scripts/shellgate.sh _work/shell.json _work/figma-ref/frame1.png --out _work/shots/gate
```

One call renders the shell at the frame's size, screenshots it and prints:

| line | what it is | verdict |
|---|---|---|
| `landmark:` ×3 | ink boxes of the logo, the active first-level row and the bottom control, frame vs shell, Δ per edge | **primary**: within 1px = the frame's shell is this shell; a *uniform* offset = the frame's instance sits off-grid, geometry agrees; a non-uniform miss = another component version |
| `zones:` | % of differing pixels: sidebar, its text-free gutter, the header when the frame has the current one | secondary: text-free strips ≈ 0, sidebar ≤ 3% with the same menu; read with the landmarks, not instead of them |
| `header:` | printed when the frame has no island gap above the header: the current 56px component (with or without the 41px tab subheader) or the old 64px one | not compared; the default header is used, the line goes to the ledger |
| `landmark: the frame has no Collapse/Expand row…` | the frame's sidebar instance is taller than the frame and shows clipped rows where the shell has Collapse | skipped, not a miss |
| `ledger:` | one sentence with all of the above | paste into the ledger — **unless `ASK` follows** |
| `OLDER:` | printed instead of `ASK` when the miss comes with the old 64px header | the older shell: the default, the ledger line, no question — unless the menu's items differ |
| `ASK:` | the landmarks miss by more than a uniform offset, or the sidebar zone is over 3%, and the header is not the old one | **a question, with a crop of both sidebars**, before anything is built on either shell. Not a ledger line until answered: an 11.87% sidebar once went in as printed and the person found the different menu on the live link |

| landmarks | what to do |
|---|---|
| match, or a uniform offset | the shell; the ledger line as printed |
| match, but the frame's *menu* differs | the shell's menu, and § When the frame's menu disagrees with the shell |
| non-uniform miss, the frame's shell is simply older | the shell; ledger: "frame shell outdated, default used" |
| non-uniform miss, the design changes the shell on purpose | **ask**: default shell or the frame's? Show the crop |
| non-uniform miss, the frame's shell is **newer** than `shell.js` — parts no config key renders | **ask**, with the crop and a recommendation: no task touches the chrome → bake it as one plate (Step 5); otherwise the default shell with the missing parts named. Ledger and run-log §7 line: "frame shell newer than shell.js: <the parts>" — a request to update `shell.js`, not a property of this prototype |

**Which miss it is** is read from the parts, not guessed: **older** — the frame lacks
something the shell draws, or carries the old 64px header (`header:` says so); **newer**
— the frame has something **no config key of `scripts/shell.js` renders** (check the key
list at the top of that file: the `fullscreen` header renders `section`, `title`,
`keyName`, `actions`, `info` and `tabs`, and no status pill, flag or copy button — `tag`
is the `basic` header's); **on purpose** — the brief or the person says so. A part the
config can draw is a config line, not a newer shell.

**An icon rail plus a section panel is a basic sidebar.** Older frames draw a 52 rail and
a 224 section panel (276 in all): the pre-redesign navigation. Build it as `basic` with
the expanded sidebar and the section's path open; the difference is a ledger line. Do not
rebuild the panel or shift the island for it. A sidebar 257 or 276 wide against the
shell's 264, or a 64 header without the island, is the usual case: ledger lines, not
questions.

## Content in the shell's coordinates

The shell reports its content origin (`#content-slot`, `data-origin`): 284×84 on a
1440 canvas with the current geometry. Figma coordinates are relative to the *frame's*
content origin, which differs when the frame's shell differs. So the content goes into a
zero-size anchor at the slot's origin (Step 4) and the generator writes frame coordinates
*minus the frame's own content origin*:

```js
// frame: sidebar 276, header at y=120 → frame content origin (276+20, 120+…)
box(x - FRAME_ORIGIN.x, y - FRAME_ORIGIN.y, w, h, …)   // inside #content-slot
```

One anchor, one subtraction; swapping the shell moves nothing else.

**The slot's origin already includes the island's inset.** 284 = the sidebar's 264 + the
island's 20; 84 (125 with tabs) = the header. A block the frame puts at x=289 sits at 5
inside the slot — subtract 284, not 264. A page laid out with padding instead of an
anchor: `padding-left = frame x − 284`. Wrong by the inset reads as a plausible 20px and
survives a glance; it cost a rebuild once.

**What the product pins to the window is not content.** A toast, a modal, a drawer sit at
the window's edges, so they take neither the slot's anchor nor the frame's raw y. A
top-right toast keeps the frame's distance from the **right edge** and from the **bottom
of the header** — measured in the frame, added to the shell's header bottom. With the
frame's raw y, a shell whose header is shorter puts the toast over the tabs and the card
under it. The ledger line is the shift, not the overlap.

**Read the field size from the frame, not from the component's default.** A Figma
`*Input* / Form` block 60 tall is label 24 + 4 + field **32**, the product's *medium*;
`input()` defaults to *large* (40). Six of those in a column put everything below 48px out.

## Content in a fluid shell

The shell can follow the window (`"canvas": "viewport"`); the frame's content is a
snapshot at one width. Three ways to combine them, chosen in Step 0:

| mode | how | when |
|---|---|---|
| **fixed canvas** (default) | the shell at the frame's size, the content in the slot 1:1 | a moderated test on a known screen; anything the gate verifies against Figma |
| **fluid shell, pinned content** | the shell follows the window, the content is anchored at the slot origin, `"minWidth"` = the frame's width; the island's remaining width stays empty | forms, drawers, canvases — content the product does not stretch either |
| **elastic form** | the content block keeps the frame's width and stays centred while the window is wide enough; below that the **primary column gives up width first** down to a floor, the aside keeps its width, and only under the floor does the page scroll sideways. `assets/templates/fluid-page.js`, checked with `scripts/fluidcheck.sh` | a form or a settings page beside a card, on screens narrower than the frame |
| **elastic content** | width-spanning containers — table frame, toolbar, section headers — are DOM boxes that stretch; a table has one flexible column; what tells them apart is Figma's own auto-layout (*fill container* vs *fixed*, constraints), read from the design context. Plates cannot stretch, so Step 5 bakes only pieces that do not span the width. `assets/templates/list-table.js` | list and table pages whose respondents' screens differ from the frame |

1440 is the working width. A 1920 frame is warned about in Step 0 (*frame width*):
pinned content from it needs a 1920 window; the elastic modes are how it fits 1440.

An elastic form does not *stretch* — above the frame's width nothing moves and the diff
against the frame is unchanged — it *shrinks*. Its numbers:

* `frameWidth` and the two column widths — **read** from the frame;
* `primary.min`, the floor — **measured, never guessed**: narrow the built page with
  `scripts/fluidcheck.sh` until something clips or a label wraps (its `wrapped` column,
  against the widest width). A guessed floor is an invented layout (rule 3);
* the gutter is **additional to the slot's own inset**: the slot starts at `SIDE + PAD`
  (284 against an island edge of 264) and the header's tabs start at 284 too, so content
  at the slot is already level with the tabs. `fluid-page.js`'s `gutter` adds to that: 0
  to stay level with the tabs, 12 for 32 from the island's edge. 32 lands at 52, past the tabs;
* **the same holds vertically**: the slot's top is already 20 below the header or the tabs'
  line. A frame's content 20 under the tabs is at slot y 0 — subtract the 20 before writing
  the coordinate, or the form lands 44 under;
* **the floor and the shell's `minWidth` are one number**: below the shell's minimum the
  window scrolls, above it the island shrinks, so a floor without a matching `minWidth`
  lets the island clip the aside before any scrollbar. `fluid-page.js`'s
  `shellMinWidth(spec, contentOrigin, canvasWidth)` returns it; write it into
  `_work/shell.json` as `"minWidth"` whenever the floor changes.

Elastic content is for list and table pages where a fixed table would look like a
product bug on a wide screen; drawers, canvases and card panels stay fixed or pinned.
Column rules come straight from the design context (fixed widths, `flex-1` with a min),
and the frame's column edges reproduce to the pixel at the frame's width; at a wider
window the flexible columns share the surplus and the pagination stays centred. A screen
whose content is a plate stays pinned or fixed.

## Two layouts

| `layout` | when the product uses it | sidebar | header | content origin (canvas px) |
|---|---|---|---|---|
| `basic` (default) | list and settings pages | 264 = 256 of labels, groups, Collapse + the 8px scrollbar gutter | title + key name, search, AI, Production toggle, help, bell, userpic; optional tab subheader (`page.tabs`) | 284, 84 — or 284, 125 with tabs |
| `fullscreen` | a single record: an applicant, a case, a transaction | 52 icon rail | breadcrumb "Section /", title, key name, action buttons, AI, help; optional second row of record chips (`page.info`); optional tab subheader | 72, 84 — or 72, 125 with tabs; the second row adds 28 |
| `basic` + `"sidebar": "collapsed"` | the Collapse state — a list or settings page with the sidebar folded (canvases, 1280 frames) | 52 icon rail with an Expand row at the bottom | the basic header, tabs optional | 72, 84 — or 72, 125 with tabs |

Pick the one the frame shows; the frame's own chrome tells you which even when it is an
older version of it.

## Config

```json
{ "layout": "basic",
  "island": true,                                    // false: flush to the rail, no gutter or frame — record pages
  "frame": {"fileKey": "…", "nodeId": "6812:36022", "width": 1440, "height": 900},   // where the state was read; shellgate.sh uses the size
  "sidebar": "expanded",                             // basic only: "collapsed" folds it to the rail
  "canvas": {"width": 1920, "height": 1163},
  "client": "Key_name",
  "page": {"title": "AML screening", "keyName": "Key name",
           "section": "Applicants",                     // fullscreen: the breadcrumb
           "tabs": ["Overview", {"label": "Rules", "tag": "Draft v.1"}],    // either layout: omit for no subheader; a tab may carry a Tag Colorful
           "activeTab": "Overview",
           "actions": ["Request check",                  // fullscreen: the buttons left of the AI button. A string is
             {"label": "Approve", "type": "primary", "status": "success"},   // a secondary button; an object names its
             {"icon": "header-more", "label": "More actions"},               // type, status and icons; "|" is the divider
             "|"],                                                           // the product puts before its decisions
           "info": [{"tag": "VIP", "color": "purple"},                     // fullscreen: the record's second row,
                    {"label": "ID: 6411..cdb2", "iconRight": "header-copy"}, // which grows the header 56 → 84.
                    {"label": "Add tag", "type": "tertiary", "icon": "header-tag"}]},  // tags and buttons, in order
  "production": true,
  "menu": { "active": ["Integrations", "Global settings", "AML screening"],
            "expanded": [],
            "items": null,
            "children": null },                          // per-section nesting for this prototype only
  "hover": true,
  "scroll": true }                                             // fixed canvas: the island scrolls taller content
```

Worked examples in `assets/shell/dashboard/examples/` — `figma-master.json` (basic),
`basic-collapsed.json`, `figma-fullscreen.json`, `figma-fullscreen-notabs.json`: read the one
the frame's layout needs, not all of them.

* **`"sidebar": {"plate": "<png>", "width": 256}`** — the frame's own sidebar, baked: the
  config line for "the frame's chrome" when the gate's `ASK` is answered that way. Cut it
  from the frame's 2x export with `cut.js`; the island and the slot start at its width,
  the menu config is not used.
* **`"scroll": true`** — a fixed canvas's island scrolls content taller than itself and the
  slot grows with it (a list on a 900 canvas has 788 of island; without it the rows below
  are clipped).
* **`"island": false`** — the page that runs flush to the rail: no gutter, no rounded frame,
  no side padding, 8px between the header's rule and the content. The slot origin becomes
  `52, TOP + 8` (the Applicant page's `52,133` with the 84 + 41 header); below `minWidth`
  the window scrolls sideways. Set it at the top level, beside `layout`.
* **`actions` and `info`** take the same entries: a **string** — a secondary button;
  `{label, type, status, icon, iconRight, iconOnly}` — any of the library's buttons,
  `iconOnly` keeping the label for a screen reader; `{tag, color, icon}` — a Tag Colorful
  in any of `tag()`'s eleven colours; `"|"` — the divider before a record's decisions. The
  header is 56 with one row, 84 with a second (slot 72,125 → 72,153 with tabs); a row that
  wraps grows past that — re-measure the slot if a prototype puts that many chips in it.
  Every header control is a real `<button>`, named when icon-only, with a pointer and the
  library's hover: an entrance (Step 0) that answers the pointer even when the page is a picture.
* **`menu`**: `active` is the path to the selected leaf, its groups open automatically (in
  `fullscreen` only its first element matters — the rail's icon); `expanded` opens more
  groups; `items` limits the top level to what the respondent's role sees (`null` = every
  item not `hidden` in `menu.json`; naming a hidden item shows it); `children` replaces
  one section's nesting: `{"Applicants": ["Individuals", {"label": "Levels", "children": ["A"]}]}`.
  `hover: true` applies the design system's row hover (`#e5e7eb` / `#e1e5ea` / `#d1d5dc`
  by level); the tested area's own hover policy is not affected.
* `--fragment` returns only the `<style>` and the markup, for injecting into a template.

Menu labels and nesting live in `assets/shell/dashboard/menu.json`. Do not edit them for a
prototype — a client with a different menu is `items`, a section nested differently on
purpose is `children`, a menu that changed in the product is a new version of the asset.

## The header's two slots

`page.back: true` draws the product's back control before the title, a 24 box with the
design system's chevron turned a quarter left. `page.tag` puts a status pill after the key
name: `{"label": "Enabled", "color": "green"}`, or the string for the grey one; colours
grey, green, blue, red, yellow, with the badge dot (`dot: false` drops it). Both are
frequent on a detail page; they are config, never an edit of the built file (Step 3).

## When the frame's menu disagrees with the shell

The frame's sidebar is the designer's instance, often older than the product; the shell's
menu is the product's. The menu — top level and nesting — comes from the shell. Three
disagreements come up; in each, **ask in Step 0**, one line with the difference.
`shell.js` refuses an active path it cannot find and prints which case it is.

| the frame shows | ask | if outdated | if on purpose |
|---|---|---|---|
| a different set of sub-items under the active section | "frame has 4, product has 5: Re-Checks extra — outdated or intended?" | the shell's nesting; one ledger line | `menu.children` for that section |
| an active item the shell hides (Client lists, Review panel, …) | "the frame selects Client lists, which the layout hides — show it for this test?" | the product's item the page belongs to; ledger line | `menu.items` naming it |
| an active item the shell does not have at all (a new section) | "Fraud radar is not in the product's menu — new, or is the frame old?" | the product's item; ledger line | a new version of the asset (`menu.json`, icons, VERSION.md), not a per-prototype patch; until then `override` with the full list |

Whatever the answer, the shell's geometry, hover and scrollbar stay; only the list changes.

## Tabs

When the frame's header has a tab subheader, the shell gets it: every tab in the frame's
order, the frame's active tab as `activeTab`, a tab's tag ("Default provider", "Draft
v.1") as `{"label", "tag"}` — *Tag Colorful / Blue / Small*. The selected tab is always
the shell's style, black label with the 2px `#030712` underline: a blue selected tab in a
mockup is the pre-redesign component and is not reproduced.

## Ledger lines, not questions

Seen on every frame so far; write the line, do not ask:

| the frame shows | the line |
|---|---|
| a subtitle under the title (the old 64px header's *Subtitle*) | "frame header subtitle: no slot in the current header, not rendered" |
| a tag on a menu item (*New*, *Beta*) | "menu tag on <item>: the shell's menu carries no tags" |
| placeholder icons — a magnifier in the pagination, on export buttons, on the alert's close | kept as drawn: "placeholder icons as in the frame" |
| `Inter` on table or list components | the shell's Geist is used: "component font Inter, page font Geist; text widths ±3px" |
| a blue selected tab | the shell's black one (§ Tabs) |

## What the shell does not cover

Anything below the header inside the island: tabs, page titles inside the content,
breadcrumbs, side panels, the AI assistant drawer, status bars — content from the frame
like any other. The `Collapse` control and the menu are inert unless a task routes through
them (Step 1); with `hover: true` they carry the design system's hover and a pointer, which
the Step 0 row *entrances outside the task* decides.
