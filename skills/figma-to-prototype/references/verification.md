# Verification

The premise: **you cannot see a 0.4px error, and it is still wrong.** Screenshots
answer "does this look like the design"; they cannot answer "is this the value
the export specifies". Only measurement does that.

This method catches bugs that no amount of looking would have found — on one
project: a reset button losing state on rebuild, a popup positioned without
the panel's scroll offset, `<defs>` left behind so clips never resolved, a pager
caption painted under its own plate, and a pill 0.35px wide because a constant
had been eyeballed.



## Contents

- A pale outline is not ink
- A frame is checked along its whole perimeter
- A forced state must not leave focus behind
- Write assertions that carry the expected value
- A failing assertion is a suspect, not a verdict
- Deterministic build
- Probe discipline
- `:hover` cannot be triggered from automation
- If you measure in a live browser pane at all
- Bitmap comparison, when there is a reference PNG
- A content block: align first, then measure
- Pick the method before you start measuring
- A written spec and the export can disagree — measure the export
- What a measurement cannot see
- The cheap ladder: numbers first, pictures last
- Two references, not one
- A zone's reference can go stale
- Set the threshold as a number
- Verify interactions separately from pixels
- Verify scaling separately
- Chrome renders, Node measures
- Step 7 in full — verify by measurement

## A pale outline is not ink

`inkbbox.sh` takes a threshold, and its default is deliberately dark: it looks for
glyphs. The design system's own outlines are not glyphs — an unselected radio's
ring is `#d1d5dc`, a divider is `#e5e7eb` — and at the usual threshold the box
comes back `[none]`, which reads exactly like "the element is missing".

Measure a pale outline with `pixprobe.sh` on the pixel, or `minpx.sh` over the
rect, which reports the darkest pixel it found. Reserve `inkbbox.sh` for text and
for filled shapes, and when it says `[none]` on something you can see in the
render, suspect the threshold before you suspect the build. Run 7, 2026-09-21.

## A frame is checked along its whole perimeter

A card's 1px frame, a drawer's edge, a modal's border: `#d1d5dc` on `#f3f4f6`
is 91 across RGB, far under a zone diff's threshold, so a header that paints
over the top of its card's frame reads 0.00% and ships. It shipped four times —
a card header (twice), a drawer header, a yellow check card — found by eye each
time. `statecheck.sh --frames '.c-card, .drawer|left'` walks each element's
perimeter every 4px in the render and compares the edge pixel with the one 3px
inside; a run of more than 12px with no difference is a `FRAME GAP`, named with
the edge and the span, exit 3. Corners are skipped by the element's radius; an
element framed on some sides only names them after `|`. Run it on every
framed container of a screen once per state, next to `--hits` and `--texts`.

**A hover is a state too.** A table row's divider drawn as an inset shadow on the
row is painted over by its cell's hover fill: the 2026-10-02 Device list lost
every divider under the cursor, and nothing asserted it. Force the hover with
`--css` (mirror the `:hover` rule onto the row) and run `--frames '.row|bottom'`
in that state. The product's own table draws the divider as an `::after` above
the cells, which is why its rows never lose it.

## A forced state must not leave focus behind

A probe that forces a state and then measures it also has to say what it did NOT
do. The cheapest of those assertions, and the one that has already cost a run:

```js
// after forcing the state, before measuring
return document.activeElement === document.body ? 'no stray focus' : 'FOCUSED: ' + document.activeElement.id;
```

Run 6's first build focused the profile field when its radio was switched, which
is an invented consequence — rule 3 — and the focus ring put 0.74% on the zone
diff of that state. It was found by looking at a render, not by any check: every
number was inside its threshold, and the ring is 2px of pale blue. Assert the
absence, not only the presence.

## Write assertions that carry the expected value

Not "looks right" but `'1220,185,192,32'` — the number from the export, next to
the number the DOM produced.

```js
P.check([
  {name: 'picker box (editor-colors 180,129 + panel origin)',
   want: [1220, 185, 192, 61], get: () => { const b = P.box('.cpWrap');
                                            return [b.x, b.y, b.w, b.h]; }},
  {name: 'hex run pen origin', want: 1254, get: () => P.textAt('.cpHex').pen},
  {name: 'hex run baseline (svg y=196.97 + 56)',
   want: 252.97, get: () => P.textAt('.cpHex').baseline},
  {name: 'swatch fill', want: P.rgb('#20252B'),
   get: () => getComputedStyle(document.querySelector('.cpSw')).backgroundColor},
]);
```

Paste `scripts/probe.js` first; it defines `P`. Keep the assertion list in a
file next to the generator so it can be re-run after every change — a
regression you catch in the same minute is free.

Name each assertion with **where the expected value came from**. Six months
later, "picker box" tells you nothing and "editor-colors 180,129 + panel origin"
tells you everything, including how to check whether the assertion itself is
right.

## A failing assertion is a suspect, not a verdict

More than half of failures turn out to be bugs in the assertion: wrong origin,
wrong export, a value read from the wrong element. **Check the export before you
change the code.** Fixing the code to satisfy a wrong assertion is the one
outcome worse than not testing.

Two deltas are diagnostic rather than mysterious:

* **A delta equal to a baseline offset** (12.03 on a 14px run, say) means you
  compared a line-box top against a baseline, or read the wrong number out of
  the export — `svg_dump.py --kind text` shows the export's real baseline. The
  0.03 is the documented integer-baseline rounding.
* **A delta equal to a container's origin** means the value is in the wrong
  coordinate space — local where canvas was expected, or vice versa.

Both are reasons to re-read the export, not to touch the build.

## Deterministic build

Two consecutive builds must produce the same hash:

```bash
node _work/gen/gen.js && md5 -q out.html && node _work/gen/gen.js && md5 -q out.html   # macOS
node _work/gen/gen.js && md5sum out.html && node _work/gen/gen.js && md5sum out.html   # Linux
```

(`python3 build.py` in the same place on an export-path build.) The library's
ids come from a counter that resets per process, so two builds match; a
`Date.now()` or a random id anywhere in `gen.js` is what breaks this.

Cheap, and it removes the question "did I break the pipeline" from every
debugging session. It also proves a project move was clean: after relocating the
whole folder, the same hash means nothing depended on an absolute path.

## Probe discipline

**Reload, or assert your starting state.** A probe that clicks its way into a
screen leaves the page there. The next probe starts from that state, its first
`querySelector` returns `null`, and you spend three round-trips debugging a
phantom. Either reload at the top of every run or begin with an assertion about
where you are.

**Synthetic events drive what a click cannot.** Press-and-drag is testable
without a mouse:

```js
const r = el.getBoundingClientRect();
el.dispatchEvent(new MouseEvent('mousedown',
  {bubbles: true, clientX: r.left + r.width * 0.75, clientY: r.top + 40}));
document.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, clientX: …}));
document.dispatchEvent(new MouseEvent('mouseup',   {bubbles: true}));
```

Then assert the *consequences* — the swatch colour, the hex text, the handle
position — not that the handler ran.

**Verify the whole chain, not the entry point.** After a colour pick, check the
row swatch, the row hex, the popup hex and the thumb all agree. Any one of them
alone can be right while the wiring is wrong.

## `:hover` cannot be triggered from automation

The pseudo-class does not activate; `document.querySelector(':hover')` stays
`null` even after a synthetic hover. Two consequences:

1. Read the rule instead — `P.hoverRule('.mi:hover')` — and, if you need to see
   it, mirror the declaration onto a temporary class and measure that.
2. **Say so.** Every hover feature ships with "the live hover needs one human
   look." Claiming a hover state is verified when it was only read is exactly
   the kind of overclaim the brief's last rule exists to prevent.

## If you measure in a live browser pane at all

Prefer `scripts/statecheck.sh`: a fresh headless process, one call. When a live
pane is the only option, measure the DOM and never the screenshot — the pane's
screenshot is downscaled and can be stale — and treat console errors as suspect
until you have reloaded. The specific artefacts are rows in `traps.md`
§ Measurement.

## Bitmap comparison, when there is a reference PNG

Numeric per-pixel diff of a slice against the reference, not an eyeball. For
overlays, `mix-blend-mode: difference` plus `filter: brightness(N)` to amplify.

**Check the reference actually loaded** (`img.naturalWidth > 0`). A deleted or
mistyped reference produces a "perfect" diff that is really just your own render
against nothing — a false pass that feels like success.

Achievable accuracy, for calibration: text position ≤0.006px, boxes ≤0.033px,
flat bitmap slices pixel-identical, gradient-ish slices ≤1/255.

A comparison can also fail on the measurement itself rather than the build —
normalised colours, re-serialised floats, noise off a scaled canvas. Those are
not bugs; they are rows in `traps.md` § Measurement, and every one has a fix.

## A content block: align first, then measure

A block inside a page cannot be diffed against the design node's render directly — the block starts
wherever the page puts it, and reading that offset out of the metadata by hand is where a cycle gets
lost (one mis-crop of the AML form, 2026-09-18). `scripts/blockgate.sh <block.html> <node.png>` does it
in one call:

**It takes an HTML file of the block alone, not the whole page.** Point it at a
prototype and it renders the shell into a 640-wide window, aligns the sidebar
against the block's reference and reports nonsense residuals. The skeleton
generator emits the block: `node _work/gen/gen.js --block 1920x900` writes
`_work/gen/block.html` — the content at the slot's width with the shell's fonts —
and never touches the deliverable. A generator of your own does the same, and
**decides every mode's output path before it writes anything**: on 2026-10-06 one
rendered the shell into the deliverable's path and branched afterwards, and the
finished prototype became a bare shell that `fluidcheck.sh` passed as "ok".

* it renders the block, builds an **ink profile** of both images (how much ink per row and per column)
  and cross-correlates them over ±span px to find the offset;
* it reports that offset — which is the block's anchor (Step 4), not a defect — and then, with the
  offset removed, the residual Δ per edge for **every horizontal band of ink** in the reference: a
  label, a field, a row of controls;
* a band the reference has and the render does not comes back as `MISSING`: something is not built.

Read it as: residuals ≤1px are a match; one band off is that element; every band off the same way means
the offset is wrong, not the geometry. On the AML form's Search-profile block it reported offset 0,0 and
a worst residual of 1px; on the whole-form render it found dy −140, the number that had been hunted by
hand. A residual that survives a correct offset is usually a font difference — the mockups' component
strings are drawn in Inter while the page is Geist, worth 2–4px on a long run.

## Pick the method before you start measuring

Most of the waste in verification is not measuring too much — it is measuring
the wrong way and then measuring again. Decide from what is being checked:

| what you are checking | method |
|---|---|
| geometry or colour of a **static** state (a tooltip, an open popup, a selected row) | force the state, render headless, measure — `scripts/statecheck.sh` |
| **behaviour** — handlers, state, what a click changes | `statecheck.sh --probe`, which runs in a fresh process; a browser tab only when you need to watch |
| a **hover** | mirror the declaration onto a class. **Never drive a real mouse** |
| that nothing else moved | zone diff against the previous render |
| that the build matches the design | zone diff against the Figma PNG |

The rules below each came out of an overrun — the worst was a small tooltip that
took 25 tool calls instead of seven:

* **Never chase a real hover.** `:hover` needs pointer coordinates, which need
  the pane's scale factor, which changes; the target is often a 10px icon; and a
  miss is silent. Mirroring the rule onto a class is one line and gives the same
  pixels. This is written down twice in this file because it was ignored once.
* **Force the state on exactly one element.** Showing every tooltip at once made
  neighbouring bubbles overlap the icon being measured, and the measurement
  reported the wrong element's colour — a wasted render plus a wrong conclusion.
* **Batch the measurement.** Every script here takes a *list* of rects or
  points. Five probes in a row is five round trips for one answer.
* **Probe behaviour in a fresh process, not in a tab you have been using.** A
  browser tab keeps its JavaScript state across a reload of the same local file,
  so a probe reports leftovers from the previous test and you go hunting a bug
  that does not exist. `statecheck.sh --probe` runs the probe in a process that
  has just started, next to the pixel measurements.
* **Aim a measuring rect at the thing, not at the neighbourhood.** An ink bbox
  over a generous rectangle merges whatever else is dark inside it — panel
  headings behind a tooltip, an adjacent icon, a second forced state — and
  reports a width that belongs to nothing. When a value must be isolated, probe
  a line of pixels through it at a row where nothing else is painted, or render
  the same view twice, with and without, and diff.
* **Ask the page where the element is; do not compute it from your own layout
  arithmetic** — `statecheck.sh --rects-of '.sel'` returns canvas-space rects, so
  the correct path is also the shortest one. That arithmetic is the thing under
  test — get it wrong and the crop lands on empty background, which reads as a
  missing element. Take the rect from the DOM, then compare *that* against the
  design.
* **A probe reports the state it measured in, not only the measurement.** A
  toggle clicked twice, a re-render between the clicks, a view left on another
  screen — each produces a confident measurement of the wrong thing. Return the
  state alongside the numbers and the contradiction is visible in the same
  answer instead of three round trips later.
* **Do not measure what the design already told you.** A radius and a fill that
  `get_design_context` returns alongside the text do not need a pixel probe.

* **Crop with `scripts/crop.js` and nothing else.** It takes both images, both
  origins and a zoom, and stacks Figma above the prototype, so the comparison is
  the output rather than something you assemble. On macOS `sips -c` looks like
  the quick way and is a trap: it crops from the **centre**, and `--cropOffset`
  shifts relative to that centre, not from the top-left — asking for the top of
  a tall export hands you its middle, silently and plausibly. Use the system
  image tool only to resize a whole image.
* **When the thing you are cropping sits in a scrolled container, take the
  origin from the DOM**, not from `scrollTop` arithmetic: `--rects-of` on an
  element inside the scroll returns its canvas rect, and the crop aligns from
  that. This is the same rule as asking the page where an element is — the
  scroll offset is one more piece of layout arithmetic you should not be doing
  in your head.
* **Choose the state you will compare against before you render anything.**
  The behaviour probe and the fidelity crop can be the same render if the state
  you force is the one the design export happens to show. Rendering "any changed
  state" to prove the logic and then a second time at the export's state to
  compare is one wasted render per feature — decide first, render once.
* **Probe the real user path, not the state behind it.** Setting a global and
  calling the render funnel proves the renderer; dispatching the input event and
  clicking the reset control proves the wiring, which is where the defect
  actually lives, and it subsumes the first test.

And a budget, so you notice the overrun while it is happening: **a small visual
addition is about seven calls** — metadata, screenshot, design context on the
leaf, the edit, a forced-state render, one measurement, one regression diff. At
call fifteen, stop: the method is wrong, and continuing will not fix it.

## A written spec and the export can disagree — measure the export

A written spec — a dependency table, a token list, prose saying *this text is
the token at 50%, this border at 30%* — is the **map of what depends on what**,
not the source of the numbers. Percentages get rounded in the writing; a table
that says 50% where the frame measures 60% ships a visible difference that every
"the spec says so" check passes. **Take the structure from the spec, take the
value from the export.** Where they disagree, use the measurement and write both
numbers into the deviations file.

The same disagreement shows up as a missing *affordance*: a spec that dismisses
a tooltip by "its close button" when the component in Figma has none. Build what
the design has, carry the *intent* onto the nearest thing that exists (the whole
bubble becomes the dismiss target), and record each substitution as a one-line
"spec said X, design has Y, built Z". Never invent the missing control — it
would look designed, and nobody would ever review it.

### Recovering an alpha from a flat blend

A percentage in a spec is an alpha, and an alpha is recoverable from any pixel
where a known colour sits on a known backdrop:

    a = (bg − measured) / (bg − fg)      per channel; they should agree

White backdrop, token `#20252C`, measured `rgb(121,124,128)`:
`(255−121)/(255−32) = 0.601` → 60%. One render answers every percentage in the
table.

### `--minpx`: aim at a rect, not at a pixel

The colour you need usually belongs to a thin glyph or a 1px border, and hitting
it with a single `--points` coordinate is a guess that fails silently on
antialiasing. `statecheck.sh --minpx '[[x,y,w,h,"name"],…]'` (also
`scripts/minpx.sh` on any PNG) returns the **darkest and lightest** pixel inside
each rect: the darkest is the ink's own colour on a light backdrop, the lightest
is the backdrop — both halves of the blend equation in one answer. On a dark
backdrop, read them the other way round.

It doubles as the cheapest possible cross-check against the design: run the same
rect on the export and on the render, and identical `min` values mean the colour
matches exactly, whatever the antialiasing did around it.

## What a measurement cannot see

Numbers confirm position, size and colour. Four things are invisible to them,
and all four have shipped as bugs **after** every measurement passed:

* **A short text that is not there.** A zone diff counts pixels; a missing
  14px label is a few hundred of them in a zone of a hundred thousand, and the
  number barely moves. On 2026-10-02 the OCR modal lacked First name's
  transliteration at 1.4%, inside a threshold of 3, and the designer found it by
  comparing the modal with the page. The check is a list, not a picture:
  `figctx.py <the zone's design context> --texts > _work/texts/<zone>.txt`, then
  `statecheck.sh page.html --js '<the frame's state>' --texts _work/texts/<zone>.txt --texts-in '<the zone>'`.
  Every string must be found; `MISSING` exits 3. **Scope it to the zone**: the
  page under a modal carries most of the modal's labels, and an unscoped check
  finds them there. A baked zone has no design context and so no list — its
  text is the plate's, which the zone diff does see.

* **Pixel density.** Headless Chrome renders at DPR 1; the respondent's screen
  is DPR 2. A baked plate exported at 1x diffs at 0.00% and looks soft next to
  crisp text on the real display. No render can show this — assert it:
  `naturalWidth === 2 * clientWidth` on every plate.

* **Orientation.** A triangle and the same triangle rotated 180° have identical
  bounding boxes. So do a mirrored chevron, a flipped caret, an upside-down
  icon. If an element's meaning *is* its direction, look at it once — a crop
  against the mockup, not a number.
* **Stacking.** A forced state measured on its own says nothing about what
  paints over it. On a canvas of absolutely positioned blocks with no `z-index`,
  DOM order is paint order, so the *next* component drawn covers whatever the
  previous one let escape its box — a tooltip under the control below it
  measures perfectly.

Two rules follow:

* **Anything that escapes its own box** — tooltip, popup, dropdown, focus ring,
  a glyph larger than its frame — **is raised explicitly** (`:hover{z-index:…}`
  on the host) and **verified with its neighbours in frame.** Never crop the
  measurement to the element itself; that is exactly the view that hides the
  bug.
* **One crop per directional or overflowing element.** It is a single image
  against the design, and it is the cheapest check that exists for the class of
  defect numbers are blind to.

## The cheap ladder: numbers first, pictures last

Screenshots in context are the expensive way to learn something a number could
have told you. Three levels, in this order:

**0. One pixel line, for anything stacked.** `scripts/scanline.sh export.png <x>`
prints every run of non-background pixels down that column as `from..to #hex`. On
a panel of repeated rows that single call returns the top and bottom of every box,
every internal divider, the group dividers and the repeat pitch — geometry that
otherwise costs a node-by-node read of the design tree, and that survives the
traps of that tree (names that lie, nodes that paint nothing). Pick a column that
crosses the thing you care about; `row` as the third argument scans horizontally
instead.

**1. Numbers, no pictures.** A zone diff against the Figma PNG
(`scripts/zonediff.sh` — "% of pixels that differ", per named zone) and ink
bboxes (`scripts/inkbbox.sh`). One call per screen, a 200-byte answer, no image
tokens. This is 90% of the value.

```bash
scripts/zonediff.sh figma.png proto.png \
  '[["sidebar",0,0,257,900],["topbar",257,0,1183,72],["panel",1040,56,400,844]]' \
  /tmp/diffmap.png
# sidebar 1.04% | topbar 0.61% | panel 2.45%
```

A pixel counts as different above 60 total RGB, which keeps glyph anti-aliasing
out of the number and makes the diff **blind to low-contrast geometry**: a pale
disabled button on white differs from its background by about 23, so its radius
can be wrong and the zone still reads 0.00%. For such shapes ask `minpx.sh` or
`pixprobe.sh`, or run that one zone with `TH=10`.

**2. A crop into context** (`scripts/crop.js`, Figma above / prototype below,
zoomed) only for a zone level 1 flagged. Each image costs 1–2k tokens, and most
of them turn out not to have been needed.

Zoom is not about precision — numbers give precision. It is for what numbers
cannot see: shape, direction, whether that pill is a pill. A 32px control inside
a 1384px strip is unreadable at 1×, which is how a digit rendered as an icon
survives every measurement. So do not pick a zoom factor: **crop tight, then scale so the long edge lands around 600–900px** — the
factor falls out of the crop size, and a tight crop at 3× costs less than a
loose one at 1×.

And **one image per question.** An A/B crop against the design answers "is this
right"; a solo crop of the same element answers nothing further. A second
picture that could not change the conclusion is a pure 1–2k loss, and it is easy
to take without noticing, because looking feels like verifying.

**3. One full screenshot per screen**, at the very end.

## Two references, not one

Diffing against Figma answers "does this match the design". It does not answer
**"did I break something I did not touch"** — and once the prototype exists,
that is the question every change raises. Keep a second reference: **the last
accepted render of each screen.**

```
_work/baseline/list.png  _work/baseline/editor-settings.png  _work/baseline/editor-colors.png
```

Refresh them only on an explicit instruction, once a change has been accepted.
Then every edit is verified twice:

```bash
scripts/zonediff.sh _work/baseline/editor-colors.png _work/shots/editor-colors.png \
  '[["rail+menu",0,0,352,900],["topbar",352,0,1088,56],["preview",352,230,688,670],
    ["the zone you changed",1216,180,208,140]]'
# rail+menu 0.00% | topbar 0.00% | preview 0.00% | the zone you changed 5.45%
```

**Every non-zero zone must be explained**, and the untouched ones must read
0.00% — not "small", zero. Without the baseline the honest report is "nothing
seems to have shifted", which is not a verification.

This is cheap insurance for the common case — an increment on a prototype that
already works — and it is the only check that catches a helper edited for one
panel quietly changing another.

## A zone's reference can go stale

A number getting worse is not proof of a regression. When a control is rebuilt
from a **different frame** — the user points at a newer node for one element —
the old frame stops being the truth for that zone, and the diff against it
rises while the build gets more correct.

So **record the source frame per zone**, in the deviation ledger, and re-state
it whenever it changes. Otherwise the next session reads the rising percentage
as damage and "fixes" a correct implementation back to the old frame.

## Set the threshold as a number

Otherwise there is no answer to "is it done". Working criterion: **≤3% per frame
and ≤2% per text-free zone.** A real run finished at 0.85% / 2.43% / 2.67%, and
the residue was rasteriser difference on text, not geometry.

**Double the threshold for dark zones.** White-on-dark text diffs roughly twice
as noisily as dark-on-white at geometry that matches within 1px — one preview
measured 3.4% light against 4.96% dark. Check dark geometry with an *inverse*
bbox (light ink on a dark ground) rather than by diffing.

## Verify interactions separately from pixels

**One assertion per visible consequence.** A control that changes two things on
screen gets two assertions. A filter changes the rows and the counter on its
button; on 2026-10-02 the probe checked the rows, passed, and the counter read
"2" for one size range — an array counted by its length — until the designer
saw it. List what a control changes before writing its probe, and assert each.

A pixel-perfect prototype with a dead menu fails the test it was built for. In
the browser:

* click every live target, assert the state variable changed and the right zone
  repainted;
* click the inert ones, assert nothing changed and the console stayed clean;
* count elements with `cursor:pointer` and compare against the interaction
  inventory;
* list elements that are clickable but have **no hover affordance** — usually
  the controls the agreed hover rule could not repaint. That list belongs in the
  handoff, not in your head.

### A click in a probe is not a click

`element.click()` and `dispatchEvent` deliver the event to the element you
named. A real click is delivered to `elementFromPoint` — whatever is on top. So
a probe proves the handler works, and says nothing about whether a person can
reach it. On 2026-10-02 the toast's full-width wrapper, empty and invisible, lay
over a header button: ten scripted walks passed, the designer's first click did
nothing, and the fix was one `pointer-events:none`.

`statecheck.sh --hits auto` is the check. It collects the live controls —
buttons, links, fields, ARIA roles, `tabindex`, and the outermost element of
every `cursor:pointer` region, which is how a hit layer over a plate is found —
and for each one asks `elementFromPoint` at the centre of its visible part
(clipped to the window and to every scrolling ancestor). Its answer:

```
hits  : 106 controls · 54 reachable · 1 BLOCKED · 0 under another clickable layer · 8 not on screen · 40 disabled/hidden/pointer-events:none
        BLOCKED by div#toastwrap: 1 — button#report "Report issue" @935,25
```

* **BLOCKED by X** — a non-clickable element is on top: an empty wrapper, a
  fixed host, a text or an icon painted over its hit layer (the trap *Click on a
  label does nothing*). Exit 3. Fix the layer, not the probe.
* **under a clickable X** — another `cursor:pointer` element is on top. Usually
  the control's own hit layer, and then it is fine; check the name.
* **not on screen** — scrolled out of the window or of a scrolling box. Scroll it
  in with `--js` and run again if a task reaches it.

Run it in every state a task passes through, because overlays come and go with
state. With a modal open, scope it to the modal (`--hits '#modal'`): its
backdrop covers the page by design, and unscoped every page control reads as
BLOCKED by the backdrop. A scope that matches nothing is an error, not a pass.

Drive press-and-drag with synthetic pointer events and assert the consequences:
after a colour drag, the popup hex, the row hex, the row swatch and the handle
position must all agree.

## Verify scaling separately

If the prototype scales with the window, render at 1024 / 1280 / 1440 / 1920 /
2560 (`scripts/scaletest.js`) and find the right-most and bottom-most non-empty
pixel of each render. That confirms no horizontal scroll, nothing cropped, and
where the content stops growing once the scale cap is reached. Put the result in
the deviation ledger.

## Chrome renders, Node measures

Chrome is used for one thing: turning HTML into a PNG. Every script that needs
it drives it directly, with the flags kept in one place, `scripts/_chrome.sh`.
Change a flag there, not in a script. One thing Chrome does that the flags
cannot undo: with `--dump-dom` the page is laid out 87px shorter than the
window (Chrome 153), while the screenshot is full-size. `statecheck.sh` measures
that delta once per binary and grows its DOM pass by it; pixels come from a
probe-free pass. A DOM height read any other way — a hand-rolled `--dump-dom`
call — is short by that much, and nothing in the output says so. No measuring page is left in `scripts/`:
if you find yourself writing one, the answer belongs in `_pix.cjs`.

Renders run in parallel where there is more than one. `shoot.js` shoots four
views at a time (`SHOOT_PARALLEL` changes the number) and `scaletest.js` shoots
its five widths at once, which turns a six-process walk-through into one round.
The renders themselves are untouched, one page per process, and the PNGs are
byte-identical to the sequential ones — that was checked, not assumed. Do not
pass `--user-data-dir` to get isolation: Chrome then takes its first-run path
and never exits.

Reading pixels back out of a PNG is Node's job, in `scripts/_png.cjs` (a decoder
and an encoder built on the built-in `zlib`, no dependency) and
`scripts/_pix.cjs` (the six measurements). `zonediff.sh`, `inkbbox.sh`,
`pixprobe.sh`, `minpx.sh`, `scanline.sh`, `blockgate.sh` and `cut.js` start no
browser at all, so a call costs tens of milliseconds instead of about two
seconds — a whole-page diff that took 2.2s takes 0.03s. Measure as often as the
question needs; the count is no longer the cost.

Two agreements the core keeps with the canvas it replaced, because recipes were
written against them: a read outside the image answers `0,0,0,0`, and a fully
transparent pixel reads back as `0,0,0,0`. Interlaced PNGs throw by name rather
than returning something plausible.

`zonediff.sh`'s difference map is the reference's own size, pixel for pixel, so
a crop taken off it lands where it does on the reference. It used to be a
screenshot of the measuring page and carried that page's margin.

**`--screenshot=/dev/null` silently breaks `--dump-dom`.** Always pass a real
path, even when the image is not wanted. That still applies to the scripts that
do render: `shoot.js`, `statecheck.sh`, `scaletest.js`, `crop.js`.

## Step 7 in full — verify by measurement

**You cannot see a 0.4px error, and it is still wrong.** Actually run it; never
report a verification you did not perform, and if screenshots are impossible,
say so instead.

**A page taller than the canvas is gated at its own height.** `statecheck.sh --full`
measures the content — including a scrolling island, whose height lives on the
scrolling box and not on the document — and renders at that height. Without it
every number describes the first screen and says nothing about the rest: the
Applicant page is 1788 tall in a 900 window, so two of its three cards sat below
the fold and no zone diff had ever looked at them.

**Run the skill's checks, do not write your own lighter one.** `zonediff.sh`,
`inkbbox.sh`, `shellgate.sh`, `blockgate.sh` and `statecheck.sh` exist so that
the thing being graded is not also writing the exam. Measuring a couple of
values by hand and declaring a match is the same failure as skipping the check.
Extra measurements are welcome; replacing a script with them is not. If a check
looks like a false positive, say so and show its output — do not quietly drop
it.

Three levels, cheapest first:

1. **Numbers, no pictures.** Zone diff (`scripts/zonediff.sh`, "% of pixels that
   differ" against the Figma PNG) and ink bboxes (`scripts/inkbbox.sh`). One
   call per screen, a 200-byte answer. This is 90% of the value.
2. **A crop into context** (`scripts/crop.js`) only for a zone level 1 flagged.
   Each image costs 1–2k tokens.
3. **A full screenshot**, once per screen, at the end.

**A content block gets `scripts/blockgate.sh`**: it renders the block, aligns it
with the node's own render by ink profile, and prints the offset it found plus a
per-band residual. That removes the step where a person reads the node's y out
of the metadata and crops the reference by hand — one mis-crop cost a cycle on
the AML form. A whole-block offset is the anchor (Step 4), not a defect;
residuals ≤1px mean the block matches; a `MISSING` band means something is not
built.

Plus DOM assertions with `scripts/probe.js` for anything positional you can
state exactly — each named with **where its expected value came from**.

**Choose the method before measuring**, and keep to the budget: a small visual
addition is about seven calls. Static states are verified by forcing the state
and rendering (`scripts/statecheck.sh` does render and measure in one call);
behaviour by `statecheck.sh --probe`, which starts a fresh process; a hover by
mirroring its rule onto a class — `:hover` cannot be triggered from automation,
so **tell the user every hover needs one human look.** Force a state on **one**
element, or its neighbours will overlap what you are measuring.

**"It is clickable" is a hit test, not a probe.** A probe's `element.click()`
fires through whatever lies on top of the element, so every probe passes on a
button nobody can press. Before saying anything is clickable, run
`statecheck.sh --hits auto` once in every state the tasks pass through — the
page, each open menu, each modal (scoped to it: `--hits '#modal'`, or every
control under its backdrop reads as covered). It asks `elementFromPoint` at the
centre of each live control and names what sits on top; `BLOCKED` is a defect
and exits 3 (`references/verification.md` § A click in a probe is not a click
has the run that made it necessary).

**A rule is checked as its table.** In a logic demo, `node "$SKILL/scripts/rulecheck.cjs" _work/rules.json`
runs every row of the person's table in a fresh process — set the input as typing
would, read the outcome, compare — and exits 3 on any FAIL. Its clicks go where a
person's would (`elementFromPoint`), so a covered button fails its row with what
covers it. Ten walks written from memory prove the walks; the table proves the
rule. `--markdown` prints the same table with this run's results for the handoff's
§ Rules.

**A frame is checked along its perimeter.** `statecheck.sh --frames '<every
framed container>'` once per state: a 1px frame is below a zone diff's
threshold, and a header painting over its card's frame shipped four times
(`references/verification.md` § A frame is checked along its whole perimeter).

**A text is checked as text.** A zone diff barely moves for a missing label, so
every live zone whose design context was pulled gets
`statecheck.sh --texts <figctx.py … --texts> --texts-in '<the zone>'` in the
frame's state: each string of the design must be on the page, in that zone
(`references/verification.md` § What a measurement cannot see).

**Diff against two references, not one.** Figma answers "does it match the
design"; the last accepted render of the same screen answers "did I break
something I did not touch" — the question every increment raises. Untouched
zones must come back at 0.00%, and every non-zero zone must be explained.

**Set the stopping threshold as a number.** ≤3% per frame and ≤2% per text-free
zone worked; the residue is rasteriser difference on text, not geometry. Double
it for dark zones.

**A failing assertion is a suspect, not a verdict.** More than half turn out to
be bugs in the assertion. Check Figma before changing the code.

Measurements are blind to orientation, stacking and pixel density — give every
directional or overflowing element one look at a crop, with its neighbours in
frame, and assert on every baked plate that `naturalWidth` is twice its CSS
width: a 1x plate diffs at 0.00% and looks soft on the respondent's screen.
Verify interactions separately from pixels, and scaling separately from both.
The rest of this file is the full method; `references/traps.md` § Measurement
has the artefacts that produce false failures.
