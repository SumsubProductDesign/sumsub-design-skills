# Checks — after every change, before showing anything

Run from `<workspace>/tools`. **Both themes. One check at a time** — the snapshot tools share
temporary pages, parallel runs corrupt each other (builders may run in parallel; checks may not).
Times passed to the tools are **real seconds** (story time × `TEMPO`).

## 1. The protocol

| # | What | Command | Pass |
|---|---|---|---|
| 1 | Final frame = original | `python3 check_final.py <name> <theme>` | HTML and Lottie `overT` ≈ 0; a few dozen px over 16 is anti-aliasing |
| 2 | HTML = Lottie while it moves | `python3 midsync.py <name> <theme> t1 t2 …` | small diffs at rest; during moves sub-pixel differences of moving rasters are normal |
| 3 | Lottie stacking = SVG stacking | `python3 layer_order.py <name>` | no inverted pairs |
| 4 | Stops on their anchors | `python3 check_stops.py <name>.html <anchorId> <id>@<sec> …` | Δy ≈ 0 on the axis, equal gaps |
| 5 | Shape changes and contacts | render the frames and look at 2–4× crops | no twisted corners, no gaps, no double edges |
| 6 | Baked rasters | open the PNGs in `work-<name>-<theme>/` you just produced | right font (Geist, not a serif fallback), right colour, nothing missing |

Pick `midsync` moments that matter: the start and end of every move, every landing, every colour or
value change, the last frame. **Every step of a counter or of any changing value** in both themes
— the final frame does not show them (a clipped digit once lived a day because only three frames
were compared).

## 2. Comparing with the previous version

Before rebuilding something that was already shown or handed off, keep the old build:

```bash
mkdir -p tools/_base/lottie && cp <name>.html <name>-dark.html tools/_base/ && cp lottie/<name>-*.json tools/_base/lottie/
```

then `python3 lastcmp.py <name> <theme>` compares the last frames old → new. A change you did not
intend shows up here; a change limited to what you touched is a pass.

## 3. Looking closer

- Snapshots: `python3 snap_html.py --2x <name>.html out t …` and
  `python3 snap_lottie.py --2x <name>-<theme>.json out <frame|last> …`.
- Live, real-time capture (rAF, IntersectionObserver): `node live.mjs <url> out.png [waitMs] [js]`
  (needs Node; set `CHROME` on Linux). Headless `--virtual-time-budget` does not tick
  requestAnimationFrame — a "frozen frame 0" there is not a bug.
- Pages with web fonts are checked over http (the player's server), not `file://`.
- Performance is measured, not guessed: rAF intervals in a real browser over the whole play; switch
  suspects off one by one (glass, filters, masks). Static layers with many filters are the usual cause.

## 4. Flakes vs real failures

Headless renders sometimes fail: a background half drawn, text in a fallback serif font, a missing
piece of a filtered map, an image not decoded "every other frame". Re-run the same check; if the
failure disappears it was a flake. If it stays, it is the build. Never ship on a run you did not
repeat when the numbers look odd, and never "fix" a flake in the builder.

A failure seen by a reviewer in the player is in the **Lottie** — reproduce it there (snap the same
frame at the same scale next to their screenshot) before touching the HTML.
