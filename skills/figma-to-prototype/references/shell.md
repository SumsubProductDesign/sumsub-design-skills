# The dashboard shell: a verified default, not a trusted constant

Every dashboard prototype has the same wrapper — sidebar, island, header — and
only the content differs. The shell is therefore built once, from the design
system's own layout component, and reused: `scripts/shell.js` renders it from a
short config, and the prototype puts its content into the slot the shell
provides. What it is made of, and the numbers it was accepted at, are in
`assets/shell/dashboard/VERSION.md`.

## Default: the shell, not the frame's own chrome

The frames a designer hands over often carry an older shell than the product
ships — the sidebar in a six-month-old mockup is not the sidebar the respondent
knows. So the default is the shell asset, and the frame's own sidebar and header
are **not** rebuilt or baked. The user overrides this in Step 0 when the test
is about the navigation itself, or the design deliberately changes the shell.

## The gate, in Step 2

**Read the frame in this order, and no further.** The shell is not rebuilt
from the frame, so the frame is read only for the shell's *state*:

1. `get_screenshot` of the frame — it answers every config question at once:
   layout (sidebar with labels, rail, or rail with an Expand row), active path,
   client name, title, key name, Production toggle, tabs.
2. `get_metadata` of the frame — only for node ids and the header's height
   (64 = the old header, 56 = the current one). Do not call it on the sidebar.
   On a whole page it is often larger than the tool limit (168k characters on
   *AML rules*) and lands in a file: read that file with
   `scripts/figmeta.py <file> 2`, never chunk by chunk. Better still, skip the
   call when the screenshot already answers everything — `shellgate.sh` reads
   the header's kind from pixels.
3. `get_design_context` on the **smallest** node holding the header texts
   ("Title + key name") when the exact strings matter; never on the header or
   sidebar instance — that is thousands of tokens for three strings the
   screenshot already shows.

Then write `_work/shell.json` with a `frame` block and run the gate:

```bash
scripts/shellgate.sh _work/shell.json _work/figma-ref/frame1.png --out _work/shots/gate
```

One call renders the shell at the frame's size, screenshots it and prints:

| line | what it is | verdict |
|---|---|---|
| `landmark:` ×3 | ink boxes of the logo, the active first-level row and the bottom control (Collapse / Expand), frame vs shell, as Δ per edge | **primary**: within 1px = the shell is the frame's shell; a *uniform* offset (every Δ the same, e.g. +2,+1) means the frame's sidebar instance sits off-grid and geometry agrees; a non-uniform miss means a different component version — ask |
| `zones:` | % of differing pixels: sidebar, its text-free gutter, and the header only when the frame has the current one | secondary: text-free strips ≈ 0, sidebar ≤ 3% with the same menu; the number rises with an off-grid instance or a different item list — read it with the landmarks, not instead of them |
| `header:` | printed when the frame has no island gap above the header: says whether that header is the current 56px component (with or without the 41px tab subheader) or the old 64px one | not compared; the default header is used, the line goes to the ledger |
| `landmark: the frame has no Collapse/Expand row…` | the frame's sidebar instance is taller than the frame (962 in 900 on *AML rules*) and shows clipped menu rows where the shell has Collapse | the landmark is skipped, not counted as a miss |
| `ledger:` | one sentence with all of the above | paste into the deviation ledger |

| landmarks | what to do |
|---|---|
| match, or a uniform offset | use the shell; the ledger line as printed |
| match, but the frame's *menu* differs (other items, other nesting, an active item the shell lacks) | the shell's menu, and the questions in § When the frame's menu disagrees with the shell |
| non-uniform miss, and the frame's shell is simply older | use the shell; ledger: "frame shell outdated, default used" |
| non-uniform miss, and the design changes the shell on purpose | **ask**: default shell or the frame's? Show the crop |

**An icon rail plus a section panel is a basic sidebar.** Older frames draw the
navigation as a 52 rail and a 224 section panel beside it (AML screening
`3130:238046`, total 276). That is the pre-redesign navigation, not the
fullscreen layout: build it as `basic` with the expanded sidebar and the
section's path open, and put the difference in the ledger. Do not rebuild the
panel, and do not shift the island to make room for it.

A frame whose sidebar is 257 or 276 wide against the shell's 264, or whose header is
64 tall without the island, is the usual case today — older files have not
caught up with the layout redesign. Those are ledger lines, not questions.

## Content in the shell's coordinates

The shell reports its content origin (`#content-slot`, `data-origin`), 284×84
on a 1440-wide canvas with the current geometry. The prototype's content
coordinates from Figma are relative to the *frame's* content origin, which
differs when the frame's shell differs. So the content is placed in a
zero-size anchor at the slot's origin (Step 4's anchor rule), and the
generator writes frame coordinates *minus the frame's own content origin*:

```js
// frame: sidebar 276, header at y=120 → frame content origin (276+20, 120+…)
// shell: content origin from data-origin → anchor the content there
box(x - FRAME_ORIGIN.x, y - FRAME_ORIGIN.y, w, h, …)   // inside #content-slot
```

One anchor, one subtraction; swapping the shell moves nothing else.

**The slot's origin already includes the island's inset.** 284 is the sidebar's
264 plus the island's own 20, and 84 (125 with tabs) is the header. So a block
the frame puts at x=289 sits at 5 inside the slot, not at 25 — subtract 284, not
264. A whole page laid out with padding instead of an anchor is the same
arithmetic: `padding-left = frame x − 284`. Getting this wrong shifts everything
by the island's inset, which reads as a plausible 20px and survives a glance —
it cost a rebuild on the Dev space pages, 2026-09-19.

**Read the field size from the frame, not from the component's default.** A
Figma `*Input* / Form` block 60 tall is label 24 + 4 + field **32**, the
product's *medium*; `input()` defaults to *large* (40). Six of those in a column
put everything below them 48px out.

## Content in a fluid shell

The shell can follow the window (`"canvas": "viewport"`); the content from a
frame is a snapshot at one width. Three ways to put them together, chosen in
Step 0:

| mode | how | when |
|---|---|---|
| **fixed canvas** (default) | the shell renders at the frame's size, the content lands in the slot 1:1 | every moderated test on a known screen; anything the gate must verify against Figma |
| **fluid shell, pinned content** | the shell follows the window, the content is anchored at the slot origin, `"minWidth"` = the frame's width so it never overflows; the island's remaining width stays empty | forms, drawers, canvases (Workflow builder) — content that does not span the width in the product either |
| **elastic form** | the content block keeps the frame's width and stays centred while the window is wide enough for it; below that the **primary column gives up width first** down to a floor, the aside keeps the frame's width, and only under the floor does the page scroll sideways. Built with `assets/templates/fluid-page.js`, checked with `scripts/fluidcheck.sh` | a form or a settings page beside a card, on screens narrower than the frame — the Dev space and AML pages at 1280 |
| **elastic content** (pilot) | width-spanning containers — table frame, toolbar, section headers — are DOM boxes that stretch; their pieces are anchored left or right, a table has one flexible column; what tells them apart is Figma's own auto-layout (*fill container* vs *fixed*, constraints left/right), read from the design context, not guessed. Plates cannot stretch, so Step 5 bakes only pieces that do not span the width | list and table pages, once the pilot on *Applicants* has shown the cost per screen |

Frame width: 1440 is the working width. A 1920 frame is warned about in the
first message (SKILL.md Step 0, *frame width*); pinned content from a 1920
frame needs a 1920 window, elastic content is the only way it fits 1440.

**Decision, 2026-09-20 (supersedes the line below for forms):** a form may be
elastic too, the designer's call after the AML run. It does not *stretch* — above
the frame's width nothing moves, and the diff against the frame is unchanged —
it *shrinks*: the primary column absorbs the loss, the aside holds the frame's
width, and the page scrolls only under the floor. Three numbers make it work, and
only two come from the frame:

* `frameWidth`, the content block's width where the frame draws it, and the two
  column widths — read;
* `primary.min`, the floor — **measured, never guessed**: narrow the built page
  with `scripts/fluidcheck.sh` until something clips, and write that number down.
  A guessed floor is an invented layout, which rule 3 forbids;
* the gutter is **additional to the slot's own inset**, which is the arithmetic that
  matters: the slot starts at `SIDE + PAD`, measured 284 against an island edge of
  264, and the header's tabs start at 284 too — so content placed at the slot is
  already level with the tabs, 20 in. `fluid-page.js`'s `gutter` adds to that.
  Pass 0 to stay level with the tabs; pass 12 for the 32 from the island's edge
  that the AML page wanted. Passing 32 puts the content at 52 and past the tabs,
  which is what the old wording here caused on run 6.

**Decision, 2026-09-18:** elastic content is for list and table pages, and only when
the respondents' screens are known to differ — there a fixed table looks like a
product bug on a wide screen. Drawers, canvases and card panels stay fixed
or pinned; the product does not stretch them either. The list page is built from
`assets/templates/list-table.js`, so the second list costs minutes, not the hour
the first one did.

**Pilot, 2026-09-18 — Applicants list (Organisms `6812:36022`):** one screen,
toolbar + table header + five rows + footer, built as DOM boxes in a
generator (`gen.js`, ~120 lines of markup and CSS) inside the default shell.
Column rules came straight from the design context — checkbox 40, Name 248
fixed, Required documents 180 fixed, Status `flex-1` min 200, Review started
154 fixed, Tag and Source key `flex-1` — and reproduced the frame's column
edges to the pixel at 1440 (row texts within the shell's known −5/−19 offset).
At 1920 the table follows the slot (1608), the three flexible columns share
the surplus (329 each), the toolbar's right cluster stays on the island's
right padding, the pagination stays centred. Cost: one design-context read
(120k characters, read through a parser, not chunk by chunk), 19 SVG assets,
two build passes. What it does not give: baked plates — every piece here is
text, an SVG icon or a CSS box; a screen whose content is a plate stays
pinned or fixed.

## Two layouts

| `layout` | when the product uses it | sidebar | header | content origin (canvas px) |
|---|---|---|---|---|
| `basic` (default) | list and settings pages | 264 = 256 of labels, groups, Collapse + the 8px scrollbar gutter | title + key name, search, AI, Production toggle, help, bell, userpic; optional tab subheader (`page.tabs`) | 284, 84 — or 284, 125 with tabs |
| `fullscreen` | a single record: an applicant, a case, a transaction | 52 icon rail | breadcrumb "Section /", title, key name, action buttons, AI, help; an optional second row of record chips (`page.info`); optional tab subheader | 72, 84 — or 72, 125 with tabs; the second row adds 28 |
| `basic` + `"sidebar": "collapsed"` | the product's Collapse state — a list or settings page with the sidebar folded (workflow canvases, 1280-wide frames) | 52 icon rail with an Expand row at the bottom | the basic header, unchanged, tabs optional | 72, 84 — or 72, 125 with tabs |

Pick the one the frame shows; the frame's own chrome tells you which even
when it is an older version of it.

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
  "hover": true }
```

**Both rows take the same entries**, so the two states the product shows most often
need no special casing: several buttons on the right, and the record's tags and
chips on the left under the breadcrumb. An entry is

* a **string** — a secondary button;
* `{label, type, status, icon, iconRight, iconOnly}` — a button of any of the
  library's types, `iconOnly` keeping the label for a screen reader only;
* `{tag, color, icon}` — a Tag Colorful, in any of `tag()`'s eleven colours
  (`grey blue green red yellow orange purple cyan black deleted gradient`);
* `"|"` — the divider the product puts before a record's decisions.

**`"island": false` — the page that runs flush to the rail.** The product's record pages put
their content against the rail and under the header's rule: no grey gutter, no rounded frame,
no side padding, and 8px between the rule and the content. Set it at the top level of the
config, beside `layout`. The slot origin becomes `52, TOP + 8` — for the Applicant page's
84 + 41 header, exactly the frame's `52,133` — and below `minWidth` the window scrolls
sideways, since there is no island left to clip against. Everything else, including the
island layout, is unchanged.

The header's own height follows: 56 with one row, 84 with a second, which moves
the content slot from 72,125 to 72,153 with tabs. The second row wraps if it has
to, and a wrapped row grows past the declared height — re-measure the slot origin
if a prototype puts that many chips in it.

Every control in the fullscreen header is a real `<button>`, named for a screen
reader when it is icon-only, with a pointer cursor and the library's own hover —
`#f9fafb` with a `#b4bac4` ring for secondary, `#15803d` / `#b91c1c` for the
success and danger primaries, `#f3f4f6` for tertiary. A header button is an
entrance (Step 0, *entrances outside the task*), so it answers the pointer even
when the page around it is a picture.

`active` is the path to the selected leaf; its groups open automatically. In
the fullscreen layout only its first element matters — the rail shows the
section's icon filled on a highlighted row.
`expanded` opens more groups. `items` limits the top-level menu to what the
respondent's role would see (`null` = every item not marked `hidden` in
`menu.json`; naming a hidden item shows it). `hover: true` applies the
design system's hover (the row takes a background: first level `#e5e7eb`,
second `#e1e5ea`, third `#d1d5dc`; nothing else changes); the tested area's
own hover policy is not affected. `--fragment` returns only the `<style>` and the markup, for injecting
into a template; without it a full page is written.

`children` replaces one section's nesting for this prototype:
`{"Applicants": ["Individuals", "Companies", {"label": "Levels", "children": ["A"]}]}`.

Menu labels and nesting live in `assets/shell/dashboard/menu.json`. Do not edit
them for a prototype — a client with a different menu is `items`, a section the
design nests differently on purpose is `children`, and a menu that changed in
the product is a new version of the asset.

## The header's two slots

`page.back: true` draws the product's back control before the title, a 24 box
with the design system's chevron turned a quarter left. `page.tag` puts a status
pill after the key name: `{"label": "Enabled", "color": "green"}`, or just the
string for the grey one. Colours are grey, green, blue, red and yellow, the
status palette with the badge dot, and `dot: false` drops the dot.

Both are frequent on a detail page — *Create webhook* has the chevron, the saved
one adds *Enabled* — and before they existed the only way in was editing the
built file, which Step 3 forbids for good reason.

## When the frame's menu disagrees with the shell

The frame's sidebar is the designer's instance of the component, often older
than the product; the shell's menu is the product's. The menu — top level and
nesting — therefore comes from the shell, and the frame is not copied. Three
disagreements come up; in each, **ask in Step 0**, one line with the difference,
and let the user pick. `shell.js` refuses an active path it cannot find and
prints which case it is, so a miss cannot render silently with nothing active.

| the frame shows | ask | if outdated | if on purpose |
|---|---|---|---|
| a different set of sub-items under the active section (four leaves where the shell has five) | "frame has 4, product has 5: Re-Checks extra — outdated or intended?" | keep the shell's nesting; one ledger line | `menu.children` for that section |
| an active item the shell hides (Client lists, Review panel, …) | "the frame selects Client lists, which the layout hides — show it for this test?" | pick the product's item the page belongs to; ledger line | `menu.items` naming it (hidden items render when named) |
| an active item the shell does not have at all (Fraud radar, Insights, a new section) | "Fraud radar is not in the product's menu — is this section new, or is the frame old?" | the product's item; ledger line | a new section is a new version of the asset (`menu.json`, icons, VERSION.md), not a per-prototype patch; until then `override` with the full list |

Whatever the answer, the shell's own geometry, hover and scrollbar stay; only
the list changes.

## Tabs

When the frame's header has a tab subheader, the shell gets it: every tab in
the frame's order, the frame's active tab as `activeTab`, and a tab's tag
("Default provider", "Draft v.1") as `{"label", "tag"}` — the tag is *Tag
Colorful / Blue / Small* (Base components `688:29153`). The selected tab is
always the shell's style, black label with the 2px `#030712` underline
(`23287:109261`): a blue selected tab in a mockup is the pre-redesign
component and is not reproduced.

## Ledger lines, not questions

Seen on every frame so far; write the line, do not ask:

| the frame shows | the line |
|---|---|
| a subtitle under the title (the old 64px header's *Subtitle*, e.g. "Partners are used to enable sharing…") | "frame header subtitle: no slot in the current header, not rendered" |
| a tag on a menu item (*New*, *Beta*) | "menu tag on <item>: the shell's menu carries no tags" |
| placeholder icons — a magnifier in the pagination, on export buttons, on the alert's close | kept as drawn: "placeholder icons as in the frame" |
| `Inter` on table or list components | the shell's Geist is used: "component font Inter, page font Geist; text widths ±3px" |
| a blue selected tab | the shell's black one (§ Tabs) |

## What the shell does not cover

Anything below the header inside the island: tabs, page titles inside the
content, breadcrumbs, side panels, the AI assistant drawer, status bars. Those
come from the frame like any other content. The `Collapse` control and the
menu are inert unless a task routes through them (Step 1); with `hover: true`
they carry the design system's hover and a pointer cursor, which the Step 0 row
"entrances outside the task" decides.
