# Reading a Figma export

> **This is the secondary path.** The primary one reads the file through the
> Figma MCP server — see `figma-mcp.md`. Use this document when MCP is
> unavailable or unauthorised, when the file is out of reach, or when the
> designer has already sent exports. It is fully workable; it just costs a
> human round-trip whenever the design changes, and outlined text or rasterised
> controls force a re-export.
>
> Both paths converge from Step 3 of `SKILL.md` onward. Where the two disagree
> about a value, the live file wins.

## Triage before you write a line

Run `scripts/svg_dump.py` on every file first, then answer these five questions.
Each one has bitten a real project; getting the answer wrong costs a rebuild,
not a tweak.

**1. Is there live `<text>`?**
`python3 svg_dump.py file.svg --kind text` — if it prints nothing, the text is
outlined into `<path>` glyph runs. Stop and ask for a re-export. Recovering
strings from glyph outlines is slow, error-prone, and throws away the pen
origin, baseline, size and weight you need anyway. Asking for a re-export beats
reverse-engineering every time.

**2. Do the groups have names?**
Unnamed groups mean elements are addressable only by geometry. Workable — see
`theming.md` for the colour-pair trick that survives it — but say so early,
because it changes how long the work takes.

**3. Raster or vector?**
Embedded `<image>` elements are fine for chrome that will never change. The rule
that matters: **anything that might become dynamic must be vector.** A pager
control shipped as a PNG had to be rebuilt from vector the moment its caption
became data-driven; a second preview phone shipped as a PNG had to be rebuilt as
markup the moment its button needed customising. When in doubt, rebuild it —
cheaper now than mid-flight.

**4. What is the scale?**
Read it out of `stroke-width`, never guess it. A nested frame exported at 0.892654
turns a 24px font into `21.423696px`. Those ugly numbers are correct; rounding
them to 21 or 21.5 is how a layout drifts. `align_exports.py` prints stroke
widths, which is often the fastest place to spot the factor.

**5. What is clipped?**
`svg_dump.py` marks clipped elements with `C`. Every `clip-path` group is an
`overflow:hidden` in the output. Skipping one shows up as content poking out of
a rounded corner — on this project, 18.634px of white square corner under a
phone body. Reproduce the clip, don't patch the symptom.

## Stroke conventions — memorise these

Figma writes strokes three different ways and each needs a different reading.

**Inside stroke → path inset by `sw/2`.** This export

```xml
<rect x="12.5" y="268.5" width="83" height="31" rx="3.5" stroke-width="1"/>
```

describes a box at **12,268 sized 84×32, radius 4, with a 1px border inside**.
With `box-sizing:border-box` that is exactly:

```css
left:12px; top:268px; width:84px; height:32px;
border:1px solid …; border-radius:4px;
```

Take the `.5`s at face value and every such box lands half a pixel off, in both
position and size.

**`<mask id="path-N-inside-M">` → the same thing.** Figma masks an inside stroke
when the shape is a path rather than a rect. The mask's own path is the outer
edge; the stroke lives inside it. Treat it as a 1px inside border. These masks
also show up as section dividers, so read what the mask actually contains.

**Centred stroke → expand by `sw/2` in both directions.** A `fill` path plus the
same path with a `stroke` is a centred stroke: the real outer edge is `sw/2`
outside the path. A tab pill drawn 14.5…94.167 is a box at **14,14 sized
80.667×28**.

## Other things the exporter does

**`<defs>` live outside the groups.** Extracting a group by id and dropping it
into your output silently loses its gradients, clips and filters — the
references dangle and nothing renders. Either lift the `<defs>` too, or inline
the paint. Use `svg_dump.py --all` to see what is in there.

**A `<rect>` inside a `<clipPath>` is not a drawn element.** It has no visual
geometry. `svg_dump.py` skips these by default for exactly this reason — a naive
`querySelectorAll('rect')` counts them and you go looking for a rectangle that
was never on screen.

**Corner smoothing becomes three cubic segments per corner.** A squircle is not
expressible as `border-radius`. Approximating it with a plain radius is usually
right for a prototype — record it as a deviation and move on.

**Filters are readable as `box-shadow`.** `feDropShadow`/`feGaussianBlur` with
`stdDeviation="5"` is a 10px blur; `feMorphology radius="1" operator="dilate"`
is a 1px spread; `feOffset dy="2"` is the y offset; the `feColorMatrix` alpha is
the opacity. `filter0_d` with those values is
`box-shadow: 0 2px 10px 1px rgba(…, 0.15)`.

**Transparency checkerboards sit behind every colour swatch.** If the colour on
top is opaque, the checkerboard is invisible — hundreds of elements you can skip.
Note the omission, don't reproduce it.

## Two exports that disagree

Normal, not a mistake to resolve by picking the prettier file. Reproduce
verbatim, record the divergence, and when a binding forces a choice: **the
control the user edits through wins.** If a swatch's fill and its printed hex
disagree, the value the picker writes back has to be the one the picker shows —
otherwise resetting to default silently changes the colour, which is absurd.

Real examples from one project: swatch fill `#143CFF` against printed hex
`#143BFF`; two adjacent rows both labelled "Success", the first one blue; a
divider at (33,29) in one export and (34,30) in another; "All text" at 16/600
collapsed and 18/600 expanded; a stray duplicate artboard 1000px below the real
one. All of them went into the deviation ledger; none of them were "fixed".
