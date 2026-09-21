# Baking non-interactive zones

The largest single saving available. For a zone where nothing ever changes, the
whole extraction pipeline — design context, icons, fonts, scale investigations —
is unnecessary work that also *reduces* accuracy, because a hand-built zone can
drift from the design and a screenshot of it cannot.

## Recipe

1. Export the frame **once at 2x** — `download_assets` on the frame id with
   `defaultFormat: "png"` and `defaultScale: 2`; one call covers every plate on
   that frame — then cut each plate with `scripts/cut.js <frame@2x.png> 2x 2y
   2w 2h plate.png`. The plate is Figma's own render at the density of the
   respondent's screen. Verify each cut once with `minpx.sh` against the same
   rectangle of the source; a cropper that applies its offset twice produces
   plausible plates from the wrong place. The 1x reference render from
   `get_screenshot` is for the zone diff, not for plates.
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

`get_screenshot` **does not upscale** — `maxDimension: 4320` on a 1440×900 frame
returns 1440×900, and asking three times does not change that. Above 1x, export
through `download_assets` with `defaultFormat: "png"` and `defaultScale` (up
to 4).

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

## Overlay order

Emit the **large target first**, the small zones inside it after, so the small
ones win the z-order. Otherwise the table-row overlay swallows the clicks meant
for its checkbox, its links and its ⋮ menu.

## What to bake, what not to

Bake: springboard screens that exist for one click; icon rails; the interior of
a preview device; any decorative illustration. On one run the device interior
was the single most expensive zone — fractional coordinates, a second font, a
0.8926-scaled instance — and had no states at all.

Do not bake: anything whose content is driven by a control, anything the brief
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

* **File weight.** A 688×844 zone at 3x is ~1 MB of PNG, +33% as base64; a
  self-contained file can reach 2–3 MB. The alternative — plates as sibling
  files — turns "one file" into a folder. That is the user's call, which is why
  it is a Step 0 parameter.
* **Not vector.** A plate exported for a scale cap of 1.5 has to be re-exported
  if the cap rises.
* **Dead forever.** If a toggle must later change something inside a baked zone,
  the zone comes back into code.
* **Design changes mean a re-export** — but that is one call, against rebuilding
  markup. On maintenance, baking wins again.
