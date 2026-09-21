# Text and type

> Where the numbers come from: **font family, size, weight, letter-spacing and
> the string itself from `get_design_context`; the box from `get_metadata`.** On
> the MCP path most runs are positioned by box rather than baseline — but any
> centred run, any run in an implicit box, and every comparison against an
> exported SVG needs the baseline arithmetic below, and the offset is always
> measured, never computed. Inside a scaled instance, divide the design
> context's font size by the instance scale first (`figma-mcp.md`).

Text is where a pixel-exact prototype is won or lost. Boxes are easy — the
export gives you x/y/w/h and you write it down. Text gives you a *pen origin*
and a *baseline*, and CSS gives you neither.

## Position a run by pen origin and baseline

An export says:

```xml
<tspan x="116" y="288.97">#20252B</tspan>
```

That is not "left 116, top 288.97". It is: start the pen at x=116, sit the
glyph baseline at y=288.97. Two conversions follow.

**Left = the pen origin, unchanged.** `x` is where the pen starts, not where the
ink starts. With `white-space:pre` and no letter-spacing, a CSS block's content
edge is the pen origin, so `left: 116px` is correct as-is. (If you ever need ink
instead — for centring against an ink extent, say — the offset is the left side
bearing: `ink_left = pen_x + lsb`, and `P.ink()` reports `lsb`.)

**Top = baseline − the baseline offset of that type class.** With
`line-height:1` the line box is exactly `font-size` tall and the baseline sits a
fixed distance below its top. That distance is what you subtract.

## Measure the baseline offset, never compute it

Browsers round this value. Chrome, at `line-height:1`, gives whole and half
pixels:

| size | offset |
|---|---|
| 16px Geist | 13.5 |
| 21.423696px Manrope | 18.5 |

Do not carry any such table to a new project, or to a new machine — carry the
probe. Font metrics
(`hhea`, `OS/2`) predict a value the browser then rounds, and a font update
changes it. Run this once at the start:

```js
P.baselines(['g12-400','g14-400','g14-500','g16-600','g18-700'])
```

It works by putting a zero-size `inline-block` inside the run: an inline-block
sits on the baseline, so the distance from the container's top to the span's
bottom *is* the offset. Then every text call is
`top = baseline_from_export − offset`.

**Await the fonts first.** Until a web font has loaded, the browser lays text
out with the fallback face, and the probe faithfully measures the wrong thing.
Real numbers from one project: a 21.4237px Manrope run measured **17.5**
mid-load and **18.5** once loaded — same probe, same page, one pixel of silent
error that would have propagated into every headline. So:

```js
await P.ready();          // document.fonts.ready
P.baselines([...]);
```

`P.baselines` adds a loud `FONTS_NOT_READY` key if you forget, but the habit is
cheaper than the warning.

Worked example: `editor-colors.svg` has the panel header `Colors` at `y="38.39"`,
the panel origin is (1040, 56), the class is `g18-700` → offset 15 →
`T(1060, 79.39, 'g18-700', …)`.

## Ink metrics: `measureText`, not `getBBox`

`getBBox` and `getBoundingClientRect` return the **layout box** — taller and
wider than the glyphs. Comparing either against an export's ink extents compares
two different things, and the error is large enough to send you chasing a
non-bug.

Real ink comes from canvas:

```js
const m = ctx.measureText(s);   // ctx.font = '400 14px Geist'
m.actualBoundingBoxLeft / Right / Ascent / Descent
```

From those, the two inverse bindings you need when an export gives you ink
rather than a pen origin:

```
pen_x    = svg_ink_left − lsb          // lsb = −actualBoundingBoxLeft
baseline = svg_ink_top  + inkAscent
```

The same metrics identify a font empirically. When the export names a family you
cannot trust (a substituted or renamed face), compare candidates' ink
`left/right/ascent/descent` for a long sample string against the export's
outlined bbox. Ratio-guessing from advance widths is much weaker — ink extents
pin down a face in one or two samples.

## Live vs outlined exports diverge measurably

When both kinds of export are in play, expect **≤0.4px on header baselines and
≤1.05px on ink widths** between them. That is small but not zero, and it is
systematic: mixing the two sources gives panels that are each internally right
and visibly inconsistent with one another.

Pick one grid and record the choice. Standardising on integer baselines across
all panels cost at most 0.39px against any single export and kept every panel
consistent with the others — a better trade than per-panel exactness. Whatever
you choose, it belongs in the deviation ledger with its worst-case number.

## Centred runs: a fixed `left` encodes the old string

If Figma centres a run inside a box, the exported `x` is a *consequence* of the
string's width. Copy it as `left: 564.207` and the layout is correct exactly
until someone changes the text — which, in a prototype built for usability
testing, is the first thing that happens.

Detect it: compute the run's ink centre and the container's centre. If they
agree to within a pixel, the run is centred, not left-positioned.

Fix it with a centred run in the container's content box:

```js
function TC(left, width, top, cls, color, text) {
  return `<div class="t tc ${cls}" style="left:${left}px;top:${top}px;` +
         `width:${width}px;color:${color}">${esc(text)}</div>`;
}
// .tc { text-align:center }
```

CSS centres on the advance width, which is what Figma does too, so the residual
is only the trailing glyph's side bearing — on one real headline, 0.435px off
the card centre against 0.114px for the original string. Both are well inside
tolerance, and the layout now survives a copy change.

## Fonts

Use the family the export names. If it is not installed locally or on Google
Fonts, say which font is missing and what you substituted, and list it as a
deviation — never swap silently, because every measurement downstream inherits
the substitution.

Load with `display=block` rather than `swap`. A fallback face rendered for even
one frame is a face you might accidentally measure.

The baseline offsets you measure belong to the font build on the measuring
machine. A locally installed family and the Google Fonts build of the same
family can be different versions with different metrics, and headless Chrome
uses whichever the page resolves to. So on a new machine, re-run `P.baselines`
instead of trusting the handoff's table, and if the prototype relies on a
locally installed font, say so in the handoff — the respondent's browser will
not have it.
