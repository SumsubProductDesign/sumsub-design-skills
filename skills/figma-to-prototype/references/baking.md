# Baking non-interactive zones

The largest single saving available. For a zone where nothing ever changes, the
whole extraction pipeline — design context, icons, fonts, scale investigations —
is unnecessary work that also *reduces* accuracy, because a hand-built zone can
drift from the design and a screenshot of it cannot.

## Contents

- Recipe
- Measured, on a springboard screen
- 2x, not 3x — on a fixed canvas too
- A photo is WebP, a drawn plate is PNG
- Hover over a plate: `mix-blend-mode: darken`
- Inline the plate as base64
- Each pixel is baked once
- Overlay order
- What to bake, what not to
- An elastic canvas decides what may be baked
- The honest costs
- Step 5 in full — bake the scenery

## Recipe

1. Export the frame **once at 2x** — `download_assets` on the frame id with
   `defaultFormat: "png"` and `defaultScale: 2`; one call covers every plate on
   that frame — then cut each plate with `scripts/cut.js <frame@2x.png> 2x 2y
   2w 2h plate.png`. The plate is Figma's own render at the density of the
   respondent's screen. Verify each cut once with `minpx.sh` against the same
   rectangle of the source; a cropper that applies its offset twice produces
   plausible plates from the wrong place. The 1x reference render from
   `get_screenshot` is for the zone diff, not for plates.

   **A node's box is not its paint.** A phone mock's border and shadow, a
   dropdown's shadow, a card's glow lie *outside* the layer's bounds: a plate cut
   to the box loses them, and `get_screenshot` of the node is clipped the same
   way. Cut with a margin — 8px at 1x covered a 4.944px border plus its shadow on
   2026-09-24, and a dropdown's shadow was asymmetric, 9 above and 13 below — and
   place the `<img>` at the negative offset (`left:-8px;top:-8px`). Read the
   margin once from the 2x export with `inkbbox.sh` on the node's rectangle
   grown by 40, instead of guessing and re-cutting.
2. Coordinates of everything that needs a cursor, a hover or a click come from
   the frame's `get_metadata`, which you already have. Six extra metadata calls
   for the hit rectangles of a sidebar whose items are dead by decision is the
   most common way a scenery zone stops being cheap.
3. Plate `<img>` plus transparent divs at those coordinates.

```css
.h  { position:absolute; mix-blend-mode:darken; background:transparent }
.h:hover  { background:var(--hov) }
.p  { cursor:pointer }
.t  { cursor:text }
```

No icons, no font loading, no Tailwind fallbacks to parse, no scale factor to
recover.

## Measured, on a springboard screen

Both versions of the same frame, each diffed against the Figma PNG:

| | hand-built | baked |
|---|---|---|
| frame error | 0.85% | **0.01%** |
| sidebar error | 2.57% | 1.04% |
| lines of code | 161 | **113** |
| assets | 34 icons, 51 KB inline SVG | one plate |
| `get_design_context` calls | 3 (two responses of 54 and 104 KB) | **0** |
| Figma calls total | ~8 | **2** |
| self-contained file | ~55 KB | 245 KB |
| tokens | ~70k | **~10k** |

**85× more accurate, at seven times the bytes.** For a prototype opened locally
or sent as a link, that trade is not close.

## 2x, not 3x — on a fixed canvas too

The respondent's display is almost always DPR 2, so a plate is drawn at twice
its CSS size whether or not the canvas scales. A 1x plate is upscaled there,
the markup's text is not, and the seam between picture and markup is visible
at a glance. The headless diff runs at DPR 1 and reads a 1x plate as 0.00% —
one build shipped that way and the moderator saw it on the first screen. So:
2x always, and assert it (`img.naturalWidth === 2 * img.clientWidth` for every
plate, from `statecheck.sh --probe`).

Why not 3x:

| plate | error at scale 1 | PNG | base64 |
|---|---|---|---|
| 1x | 0.00% | 79 KB | 106 KB |
| **2x** | **0.01%** | 181 KB | 242 KB |
| 3x | 0.30% | 288 KB | 386 KB |

Counter-intuitive and repeatable: **3x is simultaneously heavier and less
accurate**, because downscaling 4320→1440 in the browser resamples worse than
2880→1440. 1x is perfect at scale 1 and soft on wide screens. Take 2x: sharp up
to a scale factor of 2, effectively zero error at 1.

**And not more than 2x.** The rule is *exactly* twice the width a plate is shown
at, from both sides. A raw image the design places at its own resolution — a
scanned document's back side, a photo dropped into the frame — is often four or
eight times the size it is shown at, and every pixel past 2x is weight no screen
displays. `weight.cjs` flags it as `over 2x` with the width to cut it to;
`encode.sh <in.png> <out.webp> --width <2 × shown width>` does both cuts at once.

**A flat area is a box, not a plate.** An empty card, a panel's background, the
white around a modal's content: `background` and `border-radius` on a div cost a
few bytes and match exactly, while a plate of them costs a 2x bitmap of nothing.
Cut plates to the drawn content, and leave the flat ground to CSS.

`get_screenshot` **does not upscale** — `maxDimension: 4320` on a 1440×900 frame
returns 1440×900, and asking three times does not change that. Above 1x, export
through `download_assets` with `defaultFormat: "png"` and `defaultScale` (up
to 4).

## A photo is WebP, a drawn plate is PNG

PNG is lossless: right for drawn interface — flat fills, hairlines, text edges —
and the heaviest possible way to carry a photograph. A document image, an
avatar, a picture in a card is a photo even inside a frame: cut it out of the 2x
export like any plate, then

```bash
scripts/encode.sh _work/plates/front.png _work/plates/front.webp     # quality 0.85
```

and inline it as `data:image/webp;base64,…`. Pixel size is kept, so the 2x rule
still holds. `weight.cjs` names the candidates (`photo-like`: its pixels barely
repeat a colour; a drawn plate stays under 2%). Never the other way: a drawn
plate re-encoded lossy grows soft text edges and colour fringes that the zone
diff reports and the eye sees. On 2026-10-02 the OCR prototypes carried their
document photos as 2x PNG and weighed 8.9 and 11.7 MB; a noise image of the
same kind went from 2.8 MB to 281 KB as WebP.

## Hover over a plate: `mix-blend-mode: darken`

A solid fill over the plate would hide the text and icons printed on it. Darken
takes the per-channel minimum: on white it yields exactly the hover colour, and
it leaves dark content untouched.

Verified with hovers forced on: sidebar row background came back exactly
`#E5E7EB`; the "Dashboard" ink box matched the mockup pixel for pixel; a blue
link's ink box matched within 1px on the underline row; a table row read
`#F9FAFB`.

Only works for hovers **lighter** than the plate. Dark-on-dark would need
`lighten`; it does not occur in a light UI.

## Inline the plate as base64

An external `<img src="plate.png">` breaks everywhere the file is opened without
its neighbours — confirmed in a preview panel, where only the overlays survived.
A prototype that travels as a link must carry its plates inside it. base64 adds
33%.

## Each pixel is baked once

Two ways the same picture ends up in a page twice, both paid in full:

* **A modal frame baked whole.** Figma draws a modal over the dimmed page, so the
  modal's frame contains the page again — darker. Baked as one plate per frame,
  the page travels twice. Bake the page once; draw the dimming as a box
  (`position:fixed; inset:0; background: <the frame's overlay colour>`, read from
  the frame, not guessed); and cut the modal's plate to the modal's own box, with
  the margin its shadow needs (§ the first rule above, *a node's box is not its
  paint*). The second OCR prototype on 2026-10-02 did exactly this — the modal
  region only — and the first, which baked the modal frame whole, is the reason
  this section exists.
* **The same plate inlined at each place it shows.** A logo, a photo shown on a
  page and again in a modal, a plate reused by two prototypes in one file: each
  `src="data:…"` is a full copy. Inline each distinct plate once and point every
  use at it:

  ```js
  // gen.js: one entry per plate; every <img data-plate="front"> gets it at load
  const dataUri = f => `data:image/${path.extname(f).slice(1)};base64,` + fs.readFileSync(f).toString('base64');
  const PLATES = { front: dataUri('_work/plates/front.webp') /* … */ };
  html += `<script>var P=${JSON.stringify(PLATES)};document.querySelectorAll('img[data-plate]')`
        + `.forEach(function(i){i.src=P[i.dataset.plate]})<\/script>`;
  ```

  The `<img>` stays an `<img>`, so the `naturalWidth` assertion still holds.

`weight.cjs` finds both: a duplicate is listed with what its copies cost, and a
modal plate the size of the whole frame is the first line of its list.

## Overlay order

Emit the **large target first**, the small zones inside it after, so the small
ones win the z-order. Otherwise the table-row overlay swallows the clicks meant
for its checkbox, its links and its ⋮ menu.

## What to bake, what not to

Bake: springboard screens that exist for one click; icon rails; the interior of
a preview device; any decorative illustration. On one run the device interior
was the single most expensive zone — fractional coordinates, a second font, a
0.8926-scaled instance — and had no states at all.

Do not bake: anything whose content is driven by a control — and that includes
**the labels, order and number of live fields laid over a plate**, which a
plate freezes as surely as the fields themselves — anything the brief
may later make interactive, and **any single control that carries state** — a
field, a checkbox, a radio, a select, a tab — even when it is scenery. Keep
device *frames* and their bottom bars live if pagination or a switcher lives
there — they are simple and need hovers.

**The panel exception, 2026-09-20.** A whole panel may be one plate even though
the design system owns pieces of it, on two conditions: no task touches the
panel, and nothing inside it carries state a respondent can change. A link is a
destination, not a state. The AML run baked the *What is ComplyAdvantage?* card
on exactly that reasoning — two `SnsLink`s inside, 0.07% against the frame, one
design context saved — and the ledger says that making anything in it live means
rebuilding the panel from components rather than re-exporting the plate. The
test to apply, in one question: **if a respondent clicked it, would they expect
the pixels to change?** A link would not change them; a checkbox would.

## An elastic canvas decides what may be baked

A plate is a bitmap. It cannot change width, so **nothing that has to stretch can
be baked** — and what has to stretch is decided in Step 0, by the canvas answer,
four steps before anything is cut. The two answers pull in opposite directions:

| canvas | what it means here |
|---|---|
| fixed, scale-only, **fluid shell with pinned content** | the content block keeps one width. Bake freely: every plate is rendered at the width it was cut at |
| **elastic form**, **elastic content** | anything that spans the column — a card's frame, a panel border, a toolbar, a section header, a divider — is a DOM box that stretches, and only what sits *inside* at a fixed size may be a plate, anchored left or right |

So the order is: settle the canvas, then plan the baking against it. Reversed, the
cost is not a correction but a re-extraction: run 5 answered *fluid shell, pinned
content*, baked the form column as three plates, and when the designer asked on the
walk for the content to follow the window, the answer was that the scenery had to be
rebuilt from plates into boxes — about half of a first build, for a question that
costs one sentence in Step 0.

**Ask it in Step 0 whenever the frame is wider than the screens the test will run
on**, because that is when the elastic answer is likely and the baking plan depends
on it. If the answer is elastic, say in the plan which containers become boxes
before Step 5 cuts anything.

## The honest costs

* **File weight — measured, not estimated.** base64 adds a third to every
  plate. What decides the total is what the plates show:

  | what is inlined | weight, base64 |
  |---|---|
  | a whole 1440×900 frame of drawn interface, 2x PNG | ~240 KB (measured: 2880×1800, 181 KB of PNG) |
  | the Geist variable font | ~91 KB (68 KB of woff2) |
  | one photograph, 2x PNG | 1–4 MB — each |
  | the same photograph, 2x WebP (`encode.sh`) | a tenth of that or less |

  So a page of drawn interface stays well under 2 MB however many frames it
  bakes, and **photographs are what make a page heavy**: the 2026-10-02 OCR
  prototypes, with document photos as 2x PNG and frames baked twice under their
  modals, weighed 8.9 and 11.7 MB where this line used to promise 2–3. Run
  `weight.cjs` on the built page instead of trusting any table, this one
  included — it lists the plates heaviest first and says what to do with each.
  A viewer can refuse a file long before the 16 MB an artifact allows; plates as
  sibling files avoid the weight but turn "one file" into a folder, which is the
  user's call and a Step 0 parameter.
* **Not vector.** A plate exported for a scale cap of 1.5 has to be re-exported
  if the cap rises.
* **Dead forever.** If a toggle must later change something inside a baked zone,
  the zone comes back into code.
* **Design changes mean a re-export** — but that is one call, against rebuilding
  markup. On maintenance, baking wins again.

## Step 5 in full — bake the scenery

Bake what **no task touches**: an illustration, a chart, a dense block of rows
nobody clicks. Step 2's split has already told you which is which.

**A control that carries state is never baked** — a field, a checkbox, a radio,
a select, a tab. It costs a line of `controls.js` either way, it survives a
design-system change, and a baked one freezes today's radius into a PNG.

**Nor is the area around a live control, when a task can change it.** A plate
with live fields laid over it freezes everything between them: their labels,
their order, how many there are. That holds only while no request touches any
of it. So, before cutting, write the plate plan down — one line per plate: what
is in it, which live controls sit on top, and whether any task, or the next
round the brief already hints at, could change a label, add or drop a field, or
reorder them. One "could" makes that area DOM, with the controls inside it —
otherwise the same area is built twice in one session. The plan goes into the
ledger, so the reason for each plate is on record when the brief moves.

**Nothing that has to stretch is baked either.** A plate cannot change width, so
an elastic canvas (Step 0) rules out baking whatever spans the column: the card
frames, panel borders, toolbars and section headers become DOM boxes, and only
what sits inside them at a fixed size stays a plate. Settle the canvas first and
plan the baking against it — reversed, the fix is a re-extraction, not an edit.
`references/baking.md` § An elastic canvas decides what may be baked.

**A whole panel may be baked** even though the design system owns pieces of it,
when no task touches the panel and nothing inside carries state a respondent can
change. A link is a destination, not a state, so a static card whose only
components are links can be one plate. The AML run's *What is ComplyAdvantage?*
card is the precedent: 0.07% against the frame, one design context saved, and
its two links dead exactly as every other pixel of that card is. Write the
trade-off in the ledger, and note that making anything in it live means
rebuilding the panel, not re-exporting it.

For a zone with no states, `get_design_context` is not needed at all, and
usually no further Figma call either:

1. **export the frame once at 2x** — `download_assets` on the frame id with
   `defaultFormat: "png"`, `defaultScale: 2` (`get_screenshot` does not
   upscale, however often you ask) — and **cut every plate out of that PNG**
   with `scripts/cut.js`, coordinates doubled. 2x because the respondent's
   display is almost always DPR 2: a 1x plate is upscaled there while the
   markup's text stays crisp, and that seam is the first thing a person sees.
   The headless diff runs at DPR 1 and cannot see it. A **photo** inside the frame
   (a document image, an avatar) is cut the same way and then carried as WebP,
   `scripts/encode.sh` — a 2x PNG of a photograph is most of a page's weight;
2. coordinates of anything clickable come from the frame's `get_metadata` you
   already have — do not re-pull metadata per sidebar item or tab;
3. plate `<img>`, plus transparent hit divs only where something real happens
   on click or where Step 0 asked for an affordance on untested entrances. A
   menu that is a picture gets no cursor and no hover.
4. **each pixel once**: a modal's plate is cut to the modal, over the page's
   plate and a box for the dimming, never the modal frame whole; a plate shown
   in two places is inlined once (`references/baking.md` § Each pixel is baked
   once). Then `node "$SKILL/scripts/weight.cjs" <page>` — the heaviest plates,
   duplicates and photo PNGs, before the page leaves the folder

The plate is the design, so it cannot drift from it: measured on one screen,
0.01% frame error against 0.85% hand-built, at a seventh of the tokens. The
table, and the non-obvious parts — 2x beats 3x, `mix-blend-mode:darken` for
hover, base64 or the plate vanishes when the file is opened alone, overlay
order, the honest costs — are in `references/baking.md`.
