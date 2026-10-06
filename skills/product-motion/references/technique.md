# Technique — building HTML and Lottie from one story

A builder (`tools/build_<name>.py`) reads the exported SVG, writes the HTML preview (CSS keyframes on
the SVG's own layers) and the Lottie (raster layers, 2×) from the same timeline, for one theme per run.
Start from the closest example in `examples/`.

## 1. Toolkit map (`tools/motionlib.py`)

| Area | Functions / constants |
|---|---|
| Source prep | `prep_svg(src, work)` (squares the frame, flattens the background to JPEG, shrinks embedded images, drops `crispEdges`, softens Figma layer blur ×1/3), `ds_remap(svg, theme)`, `DS_REMAP` |
| Structure | `group_span`, `wrap`, `rename`, `regroup(svg, {gid: [has(...)]})`, `has(*needles)`, `retag_top`, `top_children`, `insert_before`, `clone_group`, `drop_ids`, `strip_glass`, `base_opacity` |
| Geometry | `measure(svg, ids)` → `{id: (x, y, w, h)}` via getBBox in Chrome; `char_edges`, `text_metrics`, `text_at` (live text that matches Figma's layout) |
| Timing | `E`, `APPEAR`, `OVERSHOOT`, `IO`, `cb(e)`, `ease_y(e, x)`, `count_ticks`, `TEMPO`, `LANG`, `motion(NAME)` → `MV.D_ARRIVE`, `MV.F_POP`, `MV.ARRIVE`, … in story seconds |
| HTML | `Keyframes(T, end)` (`kf(name, [(pct, css, ease)])`, `rule(sel, decl)`, `dur`), `page(out, title, desc, svg, css, T)`, `flatten_static` (bake a static filtered layer such as a map), `glass_css_clip`, `glass_follow`, `glass_end_clip`, `lift_path`, `shift_path`, `unclip` |
| Renders | `shoot(svg, png, hide=, only=, transparent=, css=)` (2× headless render), `crop(png, x, y, w, h)` → 2× box, `to_jpeg`, `shape_crop`, `img_info/img_resize/img_crop/img_jpeg` |
| Lottie | `Lottie(name, W, H, fr, T, end)` (`image`, `layer`, `precomp`, `anim`, `ks`, `reveal_mask`, `save`), `plate_layer`, `rect`, `rrect`, `st` |
| Look | `SKELETON`, `SQUARE` (square deliverables), `REDUCED_FADE`, `PLAY_WHEN_SEEN`, `a11y_css` |

A new illustration name must get its `TEMPO` entry only if the story needs stretching
(`TEMPO["my-name"] = 1.3` at the top of the builder).

## 2. Builder skeleton

```python
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "my-name", "My illustration"
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, f"src-{NAME}.svg" if THEME == "light" else f"src-{NAME}-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)     # the original look — check_final compares against it
# structure: group / rename by CONTENT (has('id="Frame 123"')), never by coordinates
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)
M = measure(svg, [...])
MV = motion(NAME)
# timeline in story seconds → T; pc = lambda t: round(t / T * 100, 3)
K = Keyframes(T * TEMPO.get(NAME, 1), 100)              # HTML
...
page(os.path.join(ROOT, NAME + ("" if THEME == "light" else "-dark") + ".html"), TITLE, "…", svg, K.text(), T)
L = Lottie(f"{TITLE} / {THEME.title()}", 988, 708, 60, T * TEMPO.get(NAME, 1), 100)   # Lottie, 2×
...
L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
```

Make the timeline a whole number of frames: `T = ceil(T * TEMPO * 60) / (60 * TEMPO)`; set
`L.frac = True` so Lottie keys sit at the same fractional times as the CSS keys.

## 3. HTML (CSS on the SVG's layers)

- Animate `transform` and `opacity` (plus `fill` for colour, `stroke-dashoffset` for drawing, and
  `backdrop-filter` for glass). Set `transform-box` and `transform-origin` explicitly per element.
- An element with its own `transform` attribute (a rotated rect) is animated through a wrapper group.
- **Extra motion on top of existing motion** (a knock, a bounce) = a separate wrapper `<g>` between
  the element and its parent; never edit the element's own keyframes for it.
- An element with an `opacity` attribute must end on that value (`base_opacity`), not on 1.
- Colour changes animate `fill` on the text/shape; the attribute keeps the original colour, so
  reduced motion shows the original. For ids with spaces use `[id="AML investigation"]` selectors.
- Connectors are revealed along an axis that is monotonic from source to target (check the segment
  order in the browser); `pathLength=1` + `stroke-dashoffset 1 → 0` draws a path from its start.
- **Glass** (Figma background blur = `foreignObject` + `backdrop-filter`): inside a group that moves,
  Chrome loses its clip — strip it from moving cards (`strip_glass`); reveal glass with
  `backdrop-filter: blur(0 → N)`, not opacity.
- **Static layers with many filters** (maps with a drop shadow per country) re-run their filters every
  frame under moving content (24–30 fps): bake them in place with `flatten_static`.

## 4. Lottie (rasters + transforms)

- **Plate**: everything that never moves is one JPEG (`shoot(svg, plate.png, hide=ANIM)` → `to_jpeg`)
  at the bottom (`plate_layer`). Bake filtered static layers (maps) *before* shooting the plate —
  headless Chrome drops filter tiles on live heavy filters.
- **Moving things**: render each alone (`shoot(svg, k.png, only=[k], transparent=True)`), crop to its
  measured box + padding (`crop`), add as an image layer with anchor at its centre.
- **Layer order = reverse SVG document order.** Emit layers sorted by
  `svg.index(f'id="{k}"')`, reversed — never list them by hand (a card ended up over its connector).
- **Group opacity** needs a precomp (`L.precomp`): parenting passes transforms only. A card whose
  parts fade together is a precomp.
- **Wheels and knocks**: a null layer for the wheel (rotation), cards parented to it; a knock is
  another null between the card and the wheel.
- **Counters**: one image per value that actually lands on a frame, shown with hold keys
  (`(pct, [100], "h")` = CSS `steps(1, end)`). Render text images on a rect of the plate's colour.
  After any change to a counter's alignment, recompute its crop boxes (they follow the old geometry).
- **Colour change of text** (raster): precomp = card without text + text in the old colour + text in
  the new colour; the new one fades in on top; the old one is removed with a hold key when the new one
  is at 100 % and restored right before it fades out — at rest each state renders exactly (no heavier
  anti-aliasing). Hide text for the bare card with `[id="…"],[id="…"] *` — a `<tspan>` stays visible
  otherwise.
- Hide a layer with an opacity key, not with `op` (lottie-web keeps glass/backdrop otherwise).
- One kind of element = one technique (all vector or all raster), or they drift apart.
- Square corners: `Lottie.save` writes one `main` precomp without a corner mask; the comp bounds clip
  what moves in from outside.

## 5. Structure traps

- Light and dark exports differ (order, coordinates, `<text>` vs outlined paths, glass split out).
  Find elements by content (`regroup` with `has(...)`), measure them, never copy coordinates.
- `shoot(only=…)` hides `svg>g *`, not `svg *` (that would also hide clip paths in `<defs>`); `hide`
  goes last with `!important`.
- `clone_group` renames ids *and* their `url(#…)` / `href` references.
- Temporary files are unique per process; builders may run in parallel, **checks may not**.
- After a parallel rebuild, compare every changed Lottie image with the previous build: under load
  text can be baked in a fallback serif font, and in-between states (a pressed button) never show on
  the final frame. Rebuild that builder alone.
- Back up a builder before a large change (`tools/old/`).
