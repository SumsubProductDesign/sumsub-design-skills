# Architecture that survives extension

The prototype will be extended — another panel, another screen, another control
— usually by a different session with none of your context. These are the
choices that made that cheap on a real project, and the one that didn't.

## Contents

- One canvas, absolute children, export coordinates
- Build the shared area once
- Panel registry
- One value, several write paths
- Shared state is seeded outside the panels
- One primitive per control family, not per control
- Resolve reference chains on read
- Turning a constant into a variable: keep the default provable
- Verbatim for chrome, computed for state
- State lifecycle
- Two or three controls, one state: setting versus view
- Generator, not hand-written HTML
- Icons
- Scale-only adaptivity
- Edits to a built file must be able to fail
- The state and re-render map — write it down once
- One increment, one session: the files are the memory
- What an increment costs
- The method behind the steps
- Step 3 in full — set up a generator, not a hand-written file
- Step 4 in full — the coordinate contract

## One canvas, absolute children, export coordinates

The contract itself — `#app` at the frame's size, every child absolutely
positioned, the border-offset helper, strokes on the last pixel row — is Step 4
of `SKILL.md`. A page built from the design system's components has the same
contract one level up: the components lay themselves out inside a block, and the
block is anchored at the shell's slot origin by the same subtraction. What must
not happen is the two mixing inside one block, half absolute coordinates and
half flow, because then no value in the code corresponds to anything. Everything a generator writes is then a literal export coordinate. This is the
foundation: the moment a value in the code stops corresponding to a value in the
export, every check in Step 7 becomes guesswork.

One consequence to keep in mind from the start: **everything this method writes
is an inline style, and an inline style outranks any stylesheet rule.** So a
state expressed as a class — `:hover`, `.open`, `.sel` — silently loses on every
property the element also sets inline. It is applied; it just does not win. A
hover background usually works, because backgrounds are rarely written inline; a
hover *border* on a bordered box does not, because the border is. Either mark
the state rule `!important`, or keep that one property out of the inline style
and in a class. This costs an hour the first time it happens, and it looks
exactly like "the browser is ignoring my hover".

Where a component has its own coordinate space, anchor it with a **zero-size
container** so its children keep that file's numbers verbatim:

```js
const P2 = {origin: [925.72183, 190.2156]};  // mobile-2.svg (0,0) on the canvas
// .ph2 { left:925.72183px; top:190.2156px; width:0; height:0; opacity:0.3 }
```

Give each such anchor a comment naming the file it belongs to. Someone will
wonder why the numbers look unrelated to everything around them.

## Build the shared area once

If every editor screen shows the same centre preview, it is **one function**
called from the shell, not a copy per screen. State it as a rule in the handoff
too, because duplicating it is the obvious thing to do under time pressure and
it is very hard to undo later.

## Panel registry

Menu selection changes only the right panel. Drive it from one state field and a
registry:

```js
const PANELS = {
  settings: {render: panelSettings, height: 844},
  colors:   {render: panelColors,   height: 844},
  text:     {render: panelText,     height: textPanelHeight},  // function: varies
};
```

Adding a panel is then: write `panelXxx()`, add one line here, set `panel:'xxx'`
on the menu entry. No layout changes. `height` feeds the scroll spacer and takes
a function when the content grows and shrinks.

**Render each panel once, then show/hide it.** Local state — toggles, radios,
inputs — survives switching away and back, which is what a person testing the
prototype expects. Rebuilding on every switch silently resets it.

```js
function paintPanel() {
  closePopups();                       // a panel switch dismisses transient UI
  for (const id in PANELS) {
    let p = host.querySelector(`[data-panel-body="${id}"]`);
    if (!p && id === state.activePanel) { p = create(); p.innerHTML = PANELS[id].render(); }
    if (p) p.style.display = id === state.activePanel ? 'block' : 'none';
  }
}
```

## One value, several write paths

Splitting setting from view (above) is only half of it. The other half is that
the same field is usually *written* from more than one place, and the obvious
one is the one you fix.

A preview control that depends on the active panel was refreshed from the menu
handler — and not from the hash router, which also sets the panel on load. The
symptom was a control showing the previous panel's state, and it looked like a
rendering bug rather than a missing call.

**Enumerate the write paths before editing one:** the event handler, the router
or deep link, the initial build, any "restore state" path, and anything that
resets on entering a flow. Grep for the field name; every assignment is a path.

## Shared state is seeded outside the panels

Panels render lazily, so **state that more than one panel reads must not be
created inside any panel's render function.** A colour chain whose root values
were registered inside the Colors panel left the Text panel inheriting from
nothing whenever a user opened Text first — an empty control, on a screen that
had never been touched.

Seed it once at startup, next to the state object. The rule generalises: a
render function may read shared state and write its own local state, never
create the shared kind.

## One primitive per control family, not per control

The strongest single win on a real project: **one "slot" primitive** covering
both a control with a fixed default and one holding a reference to a variable.
The popup, the reset affordance and the tooltip are then shared machinery
instead of two parallel implementations that drift.

Look for this shape whenever two controls differ only in where their value comes
from. Same for: table row, sidebar item, menu item, toggle, radio card,
dropdown, text input, section header, panel section — each written once,
parameterised.

The same applies to the small structural helpers, and there it is easier to
forget: the offset wrapper that cancels a border, the ink-centred text box, the
icon box. Hand-building one of those inline "just this once" reintroduces the
exact defect the helper exists to prevent — in this project a circular button
written by hand put its icon 1px off, in a file that already contained `BB`.
A hand-rolled primitive fails by one pixel, which is precisely the size nobody
catches by eye. When about to write `border:` on a positioned container, reach
for the helper instead.

## Resolve reference chains on read

With `Neutral → All text → per-block colour`, resolve each value at render time
rather than pushing updates down the chain. One flat repaint pass covers any
depth, cannot recurse, and cannot leave a stale intermediate. Push-based
propagation needs to know the graph; pull-based does not.

## Turning a constant into a variable: keep the default provable

When a hard-coded value becomes a control — a corner radius, a size, a spacing —
you get to choose the mapping from the new variable to the old number. **Choose
it so the default state reproduces the old rendering exactly**, then the
regression diff answers "did I break what was there" with a number instead of an
opinion.

A real case: the preview's button radius was `28.565` on one device and `20.884`
on another, and the new control ran 0–32. Deriving the factors as `28.565/32`
and `20.884/32` — rather than inventing a scale — made the default render
byte-identical, and the diff came back `0.00%` on the whole preview. Any other
mapping would have left a small, unexplainable delta on every screen.

The same trick works for a palette extracted from an existing build: anchor the
new tokens to the values already on screen, prove the default, then change it.

## Verbatim for chrome, computed for state

Static geometry is copied from the export verbatim. **Control state is computed
from the real value** — because a mock's handle positions are illustrative and
often inconsistent with the value it prints.

Real case: a colour picker's mock had its field thumb at (250, 201), its hue
handle at (202, 248) and a field base hue of `#0047FF`, while printing
`#20252B`. None of the three corresponds to that colour. Copying them verbatim
produces a control that lies. Computing them from the hex gave a handle 5.5px
from the mock's — recorded as a deviation, and correct.

The dividing line: if a user action changes it, compute it. If it just sits
there, copy it.

## State lifecycle

```js
const state = {screen:'list', activePanel:'settings', theme:'light',
                blocksOpen:[false,false,false], popupOpen:null};
```

Flat, serialisable, one field per thing that can change. Two rules that matter:

* **Idempotent registration** (`if (CP[id]) return`) so a rebuilt block keeps
  what the user set.
* **Explicit clear on entering the flow** so a fresh run starts at the default.
  "The editor always opens in its default state" is a claim you have to
  implement, not one you get for free.

## Two or three controls, one state: setting versus view

The moment a second control writes an existing piece of state, split the state
in two and decide, per control, which half it writes:

* **the setting** — what the real product would save;
* **the view** — what is on screen right now.

A real prototype ended up with *three* writers of one preview theme: a radio in
the settings panel, sun/moon tabs inside the preview, and finally a colour row
that belongs to one theme. Only the radio is the setting. The other two switch
the view and leave the saved value alone — so the radio can read "Applicant's
device" while the preview shows dark, and that is correct, not a bug.

Three rules that came out of it:

* **Each new control declares which field it writes**, at the moment it is
  added. Retrofitting this after three controls exist means re-reading every
  handler.
* **A control that edits a value belonging to a mode should switch the view to
  that mode.** Editing the dark-theme colour while the light preview is showing
  means changing something you cannot see — a dead-end in a usability session.
  Making the edit pull the view along is one line and removes the whole class of
  confusion.
* **Say the divergence out loud.** Setting and view disagreeing on screen is
  invisible to a reviewer and impossible to guess from a screenshot, so it
  belongs in the deviation ledger and in your response — as a decision, not as a
  detail.

Syncing them instead is a legitimate choice; it is just a choice, and the same
three rules apply to it.

## Generator, not hand-written HTML

Keep a small pipeline: the extraction results as data, the page as code that
consumes them, one self-contained file written at the end.

On the MCP path that is **one Node script**, `_work/gen/gen.js` — data literals
at the top with the node id beside each, then CSS, markup and page script,
rendered through `scripts/shell.js`, `assets/components/controls.js` and the
templates, which are Node modules; `assets/templates/gen-list.skeleton.js` is
the starting copy. On the export path, where nothing Node-side is needed, the
Python trio does the same job:

```
_work/gen/
  data.py       extraction, verbatim: paths, images, gradients, tooltips
  template.html the actual CSS + JS + markup, with __PLACEHOLDERS__
  build.py      inject and write the deliverable
  expect.json   assertions derived from the exports
```

Two conventions that pay off later:

* **Every path relative to `__file__` / `__dirname`.** Proven by moving a whole
  project folder: zero edits, identical build hash. A `launch.json` entry
  pointing at a moved file, by contrast, breaks silently — check those after any
  move.
* **`<defs>` + `<use>`** to deduplicate large repeated path data (tooltips,
  repeated icons) rather than emitting it per instance.

## Icons

Inline the export's `<path>` data unchanged, with the `viewBox` carrying the
original canvas coordinates. Then the `d` string never has to be re-based, and a
themed icon can be recoloured by overriding `fill` while keeping the export's
`fill-opacity`:

```js
function icon(name, left, top, style, fill) {
  const vb = ICON[name].vb;                    // original canvas coords
  if (left === undefined) { left = vb[0]; top = vb[1]; }   // draw it where it lived
  …
}
```

Never substitute an icon from a library, redraw it, or approximate it — the
whole value of the prototype is that it is the design, not a likeness of it.

## Scale-only adaptivity

When the brief asks for a prototype that fills any window without re-laying out,
the whole canvas scales and nothing else changes. Keep the factor in **one
variable applied in one place**, so the mechanism can be swapped for CSS `zoom`
in a single edit:

```js
const REF_W = 1440, REF_H = 900, MAX_SCALE = 1.5;
function applyScale() {
  const s = Math.min(innerWidth / REF_W, MAX_SCALE);
  stage.style.setProperty('--s', s);            // transform: scale(var(--s))
  fit.style.width  = REF_W * s + 'px';          // wrapper keeps the page height
  fit.style.height = REF_H * s + 'px';
}
addEventListener('resize', applyScale); applyScale();
```

`transform-origin: top left`. Tell the user the cap and what happens above it —
the canvas stops growing and sits left with empty space beside it, unless they
ask for centring. Vertical scroll is allowed; internal scrolling exists only
where the mockup has it. Never measure anything off a scaled canvas: scale for
looking, unscale for measuring.

## Edits to a built file must be able to fail

A generator makes this mostly moot, but patch scripts happen. One that did not
check its anchor produced a file containing two near-complete copies of the
document — which rendered fine, and passed the pixel diff, because the second
script simply rebuilt the DOM. It surfaced only as "the popup doesn't appear".

```js
const i = h.indexOf(anchor);
if (i < 0) { console.error('ANCHOR NOT FOUND'); process.exit(1); }
```

And after every injection, assert that the key definitions (`<script`, the
icon table, each top-level builder) occur exactly once — and that every icon
the page uses is defined: an edit script wiped icon definitions twice through a
comment on the same line (2026-09-28), and the page rendered with holes.

**Publish only after the edit has asserted.** `edit; build; publish` published
an unchanged file once: the anchor did not match, the script printed its error
and carried on. Chain with `&&` so a failed step stops the rest, and make the
edit step exit non-zero on a missed anchor; a publish is outward-facing and the
thing it must never do is go out quietly with the previous build.

## The state and re-render map — write it down once

A prototype built this way is one file, no modules, all state in globals. That
makes it cheap to extend and expensive to *re-learn*: the next feature needs to
know where state lives, which function is the funnel that repaints after an
edit, and which class carries the hover — and none of that is visible from the
element you are about to change.

On a small addition, about a third of the tool calls go into reconnaissance —
each one grep-ing out a single fact of a map that does not change between
features. So build the map once, on the first extension of a session, and keep it in the
handoff document:

| section | what goes in it |
|---|---|
| State | every global that a user action can change, with its factory default — the defaults are what a reset, a counter or a "modified" badge is computed against |
| Re-render funnels | which function repaints what, and which of them every edit path already calls. A new piece of chrome hooks into a funnel; it does not grow its own update path |
| Shared classes and tokens | hover classes, cursor classes, global `box-sizing`, the font shorthands — the things a new element must reuse rather than re-declare |
| Write paths | for each piece of state, every place that writes it (a field, a popup, a drag, a reset). A feature that reacts to a value must be reachable from all of them |

The last row is the one that catches bugs rather than saving time: a counter
wired to the typed-hex path but not to the popup drag is a defect that looks
like working code in every screenshot.

## One increment, one session: the files are the memory

A session that builds a prototype and then takes every later round in the same
window runs out of context and is summarised — six times across one person's
builds in two weeks, eight compactions and a 967k peak in one of them. Each
summary loses the details the files were written to hold, and the next round
starts by re-deriving them. The remedy is already in the layout: `gen.js` is the
build, `<project>/deviations.md` the decisions, `<project>/handoff.md` the map,
`_work/run-log.md` the record. When all four are current, nothing the session remembers is needed.

So: **when an increment is delivered and its files are current, the next
increment starts a new session.** The new session opens `<project>/handoff.md`
first (§5 Architecture and §6 the inventory say where everything is and what is
inert on purpose), then `<project>/deviations.md`, then the generator; it does not read the
previous session. Say so at the delivery: "the next increment is a new session;
`<project>/handoff.md` is where it starts." A round that is one sentence — move a label,
fix a colour — stays in the current session; a new screen, a new scenario, a
publish round does not.

The sign that the boundary was missed is the summary itself: a session that is
"being continued from a previous conversation" has already paid for the
context twice. When it happens, finish the increment, bring the files up to
date, and stop.

## What an increment costs

Measured against a finished three-screen prototype, so use them for estimating:

| increment | tokens | Figma calls |
|---|---|---|
| a new static panel | ≈45k | 3 |
| a second theme | ≈38k | 2 |
| an interactive control inside a panel | ≈52k | 3 |
| publishing to a URL and taking it down | ~3k per round | 0 |

Publishing is the odd row out: the commands themselves are nearly free, and
almost all of that 3k is the screenshot that proves the live URL opens without a
login wall. Skipping the screenshot saves the whole line item and costs you the
session. The panel registry is what makes the first row cheap: adding one `PANELS` entry
made an already-drawn menu item live, with no other change. An interactive
control costs about a third more than a static panel, and the extra is not
extraction — it is measuring states that do not exist in the Figma tree.

## The method behind the steps

A prototype that a person will sit in front of during a moderated test, that
must be indistinguishable from the design, and that a different session will
extend next week. Three consequences shape everything below:

* **Everything traces to a value some tool returned.** Not to an image, not to
  a memory of how the product looks. Every coordinate, hex, radius, font size
  and path can be pointed at its source. That traceability is the whole method
  — it is what makes "is this right?" a question with an answer. There are two
  sources, and they do not overlap:
  * **the design system owns its controls.** A field, a button, a radio, a tag,
    a menu, the shell: their sizes, colours and states come from the product's
    Storybook through `assets/components/controls.js` and
    `assets/shell/dashboard/`, both recorded with the date they were read.
    Frames drift behind the product and mockups are drawn at different times;
    the component is what ships today.
  * **the frame owns everything else.** What is on the screen and where: the
    text, the layout, the data, the icons, which state each control is in, what
    the illustration is. Read as data through the Figma MCP server.
  * **where they disagree, the component wins and the ledger records it** — the
    mockup's radius 4 against the product's 8, its blue radio against the black
    one. That is a line in `<project>/deviations.md`, not a question, unless the design
    changes the control **on purpose**, which is a question with a crop.
* **Screenshots and PNGs are for visual confirmation only.** Never measure from
  them, except where a whole zone is deliberately *baked* from one (Step 5).
* **Nothing is invented.** If an element is not in the design, it does not exist
  in the prototype. The same holds for what the product *knows*: option lists,
  field sets, rules, limits, messages — if neither a frame nor the person gave
  it, it is a question, not a guess (Step 0, *data and rules*).

If the user wants a nice-looking approximation quickly, this is the wrong skill
— say so, and build it the ordinary way.

Budget: the first build of a shell plus two or three screens is roughly
**about 200k tokens of growth on a 78k start** (system prompt, tools and SKILL.md are the
start), and every later increment about a quarter of that.
`references/architecture.md` has the per-increment table. A run heading far
past that is reading what it did not need: scenery it should have baked, or a
control the design system already ships and Step 2's split should have taken
off the list.

**Screens are cheaper in batches.** The setup dominates: the shell and its gate,
the extraction pass, the generator, the verification harness. A second and third
screen inside the same run reuse all of it, while the same screens split across
sessions pay for it again — the Figma design team measured the same shape on
their side, six screens costing about what one does. So build every screen a
task list already names in one run; "build what the next session tests" is about
**scope**, not about splitting a settled scope into separate sessions.

## Step 3 in full — set up a generator, not a hand-written file

```
_work/gen/gen.js         one Node script: the data (extraction results, verbatim), the CSS,
                         the markup and the page script, rendered through the shell and the
                         library and written as the single deliverable — `node _work/gen/gen.js`
```

The skeleton `assets/templates/gen-list.skeleton.js` is one, ready to copy: the shell,
the controls and the templates are Node modules and the generator calls them. Data at the
top as literals with the node id beside each value, so it still traces to a Figma call; a
build that outgrows one file splits the data to `data.js` and keeps `gen.js` as the
assembler. (The export path's Python trio — `data.py`, `template.html`, `build.py` — is
still right when the source is SVG exports.)

**Any script that edits a built file aborts when its anchor is missing and asserts that
key definitions appear exactly once** (§ Edits to a built file must be able to fail: a
doubled document once passed the pixel diff). Paths relative to `__dirname`, project
paths off the project root. Serve with `scripts/serve.cjs` (`Cache-Control: no-store`)
from the project folder with `ROOT=.`; in the Claude desktop app register it in
`.claude/launch.json` so the preview pane starts it.

**A live control has a component.** `assets/components/controls.js` renders the design
system's controls with every state the product ships, read from its Storybook. The mockup
gives the text, the width and the state it draws; a disagreement with the component is a
ledger line or a question, as for the shell. `node "$SKILL/assets/components/controls.js"
--api` lists the components, `--api <name>` prints one header, `--doc <name>` its section
of `VERSION.md` — the source and the whole VERSION.md are never read.

**A block the window is too short for has a template.** `assets/templates/fit-height.js`
scales it from its top centre by `(host height − reserve) / height`, capped at 1: the top
edge and the centre stay, only the bottom gives way, what sits under it (an actions bar) is
the reserve. Width has `fluid-page.js`; this is the other axis.

**A list or table page has a template and a recipe.** `assets/templates/list-table.js` renders toolbar, header, rows and footer as DOM boxes that follow the shell's slot; the generator feeds it the column rules and the cells' markup, nothing else. The recipe, five moves:

1. screenshot of the frame (the shell's state, the table's shape); `get_metadata` only for the table's node id;
2. `get_design_context` of the **table node**, never the page — it lands in a file anyway; read it with `scripts/figctx.py <file> --depth 4` (outline with the auto-layout tokens), `--split "Table Row"` (every row's strings and icons) and `--assets _work/assets` (the SVGs);
3. column rules from the tokens: `w-[248px] shrink-0` → `{width: 248}`, `flex-[1_0_0] min-w-[200px]` → `{flex: 1, min: 200}`, a column present in rows but not in the header → `hideInHeader: true`;
4. copy `assets/templates/gen-list.skeleton.js` to `gen.js`, fill data, spec and cell styles;
5. verify: `node gen.js --canvas WxH` at the frame's size, then ink boxes of a header label, a first-row text and the right-most control against the frame, each shifted by the slot offset (slot origin minus the frame's content origin). Flexible columns share the island's extra width — at 1440 the island is 9px wider than a 1440 frame's, so right-hand columns sit 4–9px right of the frame: expected, not a miss.

The fluid modes: `references/shell.md` § Content in a fluid shell.

## Step 4 in full — the coordinate contract

**Absolute children, Figma coordinates.**

```css
#app { position:relative; width:1440px; height:900px; overflow:hidden;
       margin:0 auto; }                    /* auto, not flex: never clips */
#app div, #app img, #app svg, #app input { position:absolute; }
```

**A block narrower than 500 is left-aligned, `margin:0`.** Chrome will not open a
window under 500px: a smaller `--window-size` is clamped, the page lays out at
500, and the screenshot is still cropped to the width you asked for. A centred
400-wide block therefore sits at 50 and every coordinate you measure is off by
that, with nothing in the PNG to say so. `shoot.js` warns, and the contract for a
standalone block — one without the shell — is `margin:0`.

Flex only inside a leaf component (a button's icon + label). `get_metadata`
gives `x`/`y` relative to the **parent**, at sub-pixel precision — keep the
sub-pixels.

**CSS insets absolutely-positioned children by the border width; Figma does
not.** This bites every bordered box, card, input and device frame:

```js
const BB = (x,y,w,h,bw,css,inner) =>
  box(x,y,w,h,css, box(-bw,-bw,w,h,'', inner));   // offset layer cancels it
```

**Figma paints a container's bottom stroke on its last pixel row** — `top + h −
1`, where CSS `border-bottom` sits at `top + h`.

**Fill and radius first, stroke last, on top of the content.**

**A clipped zone keeps page coordinates via an offset layer**, so code never
recomputes anything:

```js
box(352,56,688,844,'overflow:hidden', box(-352,-56,1440,900,'', content))
```

**Content inside the default shell lives in a zero-size anchor at the shell's
content-slot origin** (`#content-slot`, `data-origin`), and the generator
writes frame coordinates minus the frame's own content origin. The frame's
sidebar may be 276 wide and the shell's 264; one anchor absorbs that, and a
shell update moves nothing else. `references/shell.md` § Content in the shell's coordinates.

**Text** goes in a box, but if you position runs by baseline — and you must,
wherever a run is centred or the box is implicit — the baseline offset is
*measured*, after fonts load, never computed. `references/text-and-type.md` § Measure the baseline offset, never compute it.
