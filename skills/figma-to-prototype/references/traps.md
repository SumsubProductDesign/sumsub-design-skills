# Trap table

Every entry here actually happened. Scan it when something behaves
inexplicably — the answer is often a line in this list rather than a bug in your
logic.

## Figma MCP

| Symptom | Cause | Fix |
|---|---|---|
| Icons come back as component snippets, not assets | `disableCodeConnect` not set | Always pass `disableCodeConnect: true` |
| A control is 1px off in every direction | Coordinates taken from `get_design_context`, which measures from the CSS padding box | Coordinates only from `get_metadata` |
| Sizes and font sizes inside an instance are ~11% small | `get_design_context` on a **parent** applies the instance scale twice | Derive `k` = metadata size ÷ dc size, divide; or call dc on the leaf |
| `get_design_context` returns sparse metadata and a "split this up" note | Frame too large | `forceCode: true`, persist to file, `grep` it |
| A leaf renders empty, or as an unrelated icon | Text nodes reported as an icon; asset missing from the parent's context | Call `get_design_context` on that leaf; fall back to `download_assets` on the flat parent id |
| `download_assets` rejects the id | Nested instance path `I123:456;789:012`; only `^\d+[:-]\d+$` is accepted | Use the flat parent id, cap 20 per call |
| An icon in a dark/alternate state renders in the light fill | Figma exported the default-state paint | Pixel-probe the mockup and recolour that icon only |
| An element in the design never appears on screen | `opacity: 0` (invisible to metadata) or below the frame crop line | Check `opacity` in dc as well as `hidden` in metadata; do not build outside the frame |
| Layer name and on-screen text disagree | Names are scaffolding | Text only from `get_design_context` |
| Two frames disagree about a shared element | Frames drift as a file grows | Zone-diff shared areas before extracting; ask which is canonical |
| Two design contexts from one frame name different glyphs with the same const, and the icons swap silently | const names are unique only inside ONE design context; `figctx.py --assets` used to write the file under that name | it now keeps the first file and saves the second as `<const>-<url8>.svg`, printing CLASH and a `_assets.json` of file → URL. On the Applicant page 6 of 41 consts collided — `imgNormalId` was an id glyph in one context and a checkmark in another |
| An icon inside an instance comes back as the component's DEFAULT glyph, and the layer name agrees with the wrong one | the export for a slot serialises the component, not the override; the layer keeps the slot's name (`normal/search`) | the rule below — an implausible leaf gets its own `get_design_context` — reads the real one. The Applicant header's Add tag gave a magnifier this way, 2026-09-21 |

## Figma → CSS rendering

| Symptom | Cause | Fix |
|---|---|---|
| Everything inside a bordered box is off by the border width | CSS insets absolutely-positioned children by the border; Figma does not | Offset wrapper: `box(x,y,w,h,css, box(-bw,-bw,w,h,'',inner))` |
| One icon inside a bordered box is off by 1px, and only that one | Same cause — but the box was hand-rolled instead of going through the offset primitive, so the project's own fix was bypassed | Route every bordered container through the helper (`BB`); a hand-built box fails by exactly 1px, which is the amount nobody notices |
| An element the design tree clearly contains is painted nowhere in the export | A node can be present, visible and even sized, and still contribute no pixels (a zero-alpha stroke, a cap hidden under the shape it belongs to). Rendering it puts a stray mark on screen | Probe the export at the node's own coordinates before drawing it: background there means do not draw it, and say so in the deviations |
| Every divider sits 1px low | Figma paints a bottom stroke on the last pixel row (`top+h−1`); `border-bottom` sits at `top+h` | Draw the stroke as an overlay at `y−1` |
| A container's border is partly erased | A later sibling painted over it | Fill and radius first, stroke last, above the content |
| Nothing in a whole region is clickable | An invisible full-size slot overlay is swallowing the events | Zero-size slot container with `overflow:visible` |
| A glyph renders at half size | The vector is larger than its box (dc shows a negative `inset-[…%]`) | Wrap in an offset layer at the vector's own size |
| A field is narrower than the design context says | Fixed widths overflow the container; one field is `flex-1` | Compute the remainder, don't copy the number |
| A line wraps differently from the mockup | Chrome and Figma break the same string differently at the same width | Explicit `<br>` at the mockup's break; record it as a deviation |
| an exported glyph comes back the wrong way round — a tooltip's arrow pointing up while the tooltip sits above its target | the export is the raw shape; Figma turned its *wrapper* (`rotate-180`, `scale-x-[-1]`) and the wrapper is not in the SVG | read the wrapper's transform in the design context and apply it in CSS; the same for a shape utility-inset inside its box (`inset-[6.38%]`), which becomes padding. One component hit both on 2026-09-20, and the Applicant page's Add tag icon again on 2026-09-21 |

## Generator

| Symptom | Cause | Fix |
|---|---|---|
| A style silently ignored | A helper appends `px` to **numbers**, so `opacity: 0.3` becomes `opacity: 0.3px` | Pass unitless values as strings: `'0.3'` |
| Regex grabs the wrong attribute | `[^>]*?d="` matches the `d` in `id="Shape_19"` | Require the boundary: `\sd="` |
| Path parser crashes on an icon | Only uppercase path commands handled; icons use relative `m/l/h/v/c` | Handle both cases; self-test with `M10 10H30V20H10V10Z` **and** `m10 10h20v10h-20v-10z` |
| Extracted group renders blank | `<defs>` live outside the group and were left behind, so clip/gradient refs dangle | Lift the `<defs>` too, or inline the paint |
| An element "exists" but was never drawn | `querySelectorAll('rect')` counted `<rect>`s inside `<clipPath>` | Skip `defs`/`clipPath`/`mask` contents (`svg_dump.py` does) |
| An edit script silently produced a doubled file | `lastIndexOf(anchor)` returned −1 and the slice arithmetic concatenated two near-complete copies; the page still rendered and still passed the pixel diff | Abort when the anchor is missing; assert key definitions appear exactly once |
| Two places that share a helper show the same state, and one of them is wrong | The helper hard-codes the state instead of taking it as a parameter — a selection row written for the "selected" card was reused by the "empty" card | Make the state an argument at the first reuse; geometry checks cannot see this, only reading the design can |
| A panel you did not touch loses an element | A newly added helper reuses an existing global name and silently overrides it — one file, no modules, no linter, last declaration wins | Grep the name before defining it; the regression diff against the previous render is what catches this |
| A stray artboard in the output | The export contains a duplicate frame offset far down the canvas | Strip it by group id at build time, and say so in a comment |

| A label is ~30px wider than the design and reads `&amp;` | Text was escaped twice: pre-escaped HTML handed to a renderer that escapes again | Pass raw strings to the components and to the template; escape once, at the edge |

## Runtime

| Symptom | Cause | Fix |
|---|---|---|
| Click on a label does nothing | Text nodes are siblings painted above the clickable div | Transparent hit layer, emitted last |
| Popup closes the instant you press it | Drag start repaints; a bubble-phase listener sees the detached node and reads it as an outside press | One listener on **capture** phase |
| Drag throws on every mouse move | Popup vanished mid-drag; `querySelector` returns `null` | Null-guard inside the move handler |
| Popup lands in the wrong place | Positioned in canvas coordinates without the panel's scroll offset | Scroll viewport with a negatively-offset inner anchor |
| Tooltip is cut off | Clipped by the panel's `overflow` | Canvas-level zero-size host, appended last |
| Control resets when its block re-renders | Registration overwrites existing state | `if (CP[id]) return` |
| A tooltip or popup is hidden behind the component below it | No `z-index`: on an absolute canvas DOM order is paint order, and the next component covers what escaped the previous one's box | Raise the host on hover (`.ttw:hover{z-index:20}`) and verify with neighbours rendered |
| An arrow, chevron or caret points the wrong way, and every measurement passed | A bbox is identical under 180° rotation and mirroring | Check the source vector's own orientation, then look at one crop |
| A `:hover` (or any state) rule has no effect | The property is set inline on the element, and an inline style beats a stylesheet rule — the rule is applied and loses silently | `!important` on the state rule, or move the base value out of the inline style into a class |
| Element half of a theme stays light | A helper written before theming still holds a literal colour | `hex_sweep.py` over the themed region |
| Light seam between a ring and its content | Border-only div; its antialiased inner edge blends the backdrop | Give the ring a `background` too |
| White square corners under a rounded shape | The export clipped it with `clip-path`; the CSS has no clip | `overflow:hidden` on the rounded parent, child inside it |
| Layout breaks when copy changes | A centred run was copied as a fixed `left` | Centred run in the container's content box |

## Measurement

| Symptom | Cause | Fix |
|---|---|---|
| Colour assertion fails on identical colours | Browser normalises `#1873DF` → `rgb(24, 115, 223)` | Compare normalised to normalised (`P.rgb()`) |
| Exact float comparison fails | `87.09848` re-serialises as `87.0985` | Compare with a tolerance, never `===` |
| Text ink measurements are all wrong | `getBBox`/`getBoundingClientRect` give the layout box, not ink | Canvas `measureText` → `actualBoundingBox*` |
| Baseline offset disagrees with the font metrics | The browser rounds it (whole/half px at `line-height:1`) | Measure it with the DOM probe (`P.baselines`) |
| Baseline offset is off by ~1px and looks plausible | Measured while a web font was still loading, so the metrics are the fallback face's (21.4237px Manrope: 17.5 mid-load, 18.5 loaded) | `await P.ready()` (i.e. `document.fonts.ready`) before any text measurement |
| A measured value comes back `NaN` | A lookup keyed by position (`Object.keys(x)[0]`) hit an unexpected extra key | Key lookups by name, not by index |
| `elementFromPoint` returns the wrong element | Target has `pointer-events:none` | Query the element directly, or check the layer above |
| A "perfect" bitmap diff | The reference image never loaded (`naturalWidth === 0`) | Assert the reference loaded before diffing |
| Baked zones look soft next to the markup on the respondent's screen, and every diff passed | Plates were 1x; the display is DPR 2 and upscales them, while text renders at native density. Headless Chrome measures at DPR 1 and cannot see it | Export the frame at 2x through `download_assets` (`defaultScale: 2`), cut plates from that; assert `naturalWidth === 2 × clientWidth` per plate |
| A zone reads 0.00% before **and** after a real geometry fix | The two colours differ by less than the diff threshold (60 total RGB): `#ffffff` vs `#f6f7f9` is 23, so a wrong radius on a pale button is invisible to `zonediff` | Low-contrast shapes are checked with `minpx.sh` / `pixprobe.sh`, or with `TH=10 zonediff.sh …` on that zone only |
| `statecheck.sh` prints nothing, or only `render:` | The page has no `</head>` — the injection anchor — and the script aborted with `ANCHOR NOT FOUND` on stderr | Give the page a `<head>`; a generated prototype always has one, a hand-typed test page often does not |
| A forced state renders at its starting value, with the correct inline style already set | CSS transitions do not advance under `--virtual-time-budget`; the element stays where the animation began | Kill transitions when capturing an end state — `statecheck.sh --no-anim` |
| A measured size is 0 and the layout that depends on it collapses | Geometry was read during render, while the view was still `display:none` | Take the value from state; never measure inside a render pass |
| Sub-pixel noise everywhere | Measuring off a `transform: scale()`d canvas (0.003–0.017px) | Measure unscaled; scale only for looking |
| `:hover` never activates | Pseudo-classes cannot be triggered from automation | Read the rule; mirror it onto a temp class; ask for one human check |
| First `querySelector` of a probe returns `null` | The previous probe left the page on another screen | Reload, or assert the starting state first |
| Console shows errors that make no sense | They are from an earlier debugging run | `performance.getEntriesByType('resource')`, or reload |
| A no-animation rule looks violated | Chrome serialises `transition: visibility 0s 300ms` as `visibility 300ms` | Check `transitionDuration` / `transitionDelay` longhands |
| A fix appears not to work | The page was cached | Serve with `Cache-Control: no-store` |
| Screenshot too coarse to judge | The panel returns a downscaled image | `transform: scale()` + scroll, then screenshot |
| a reference crop taken from the frame render diffs a few per cent against a correct build, hottest right on the control | the frame draws things the component does not: a `Cursor` instance over the hovered control, an annotation, a neighbouring cell's tooltip | mask those regions out rather than loosening the threshold: diff the zones around them instead of the whole crop. A loosened threshold hides the next real defect |
| `fluidcheck.sh` says `ok` while the page really is wider than the window | the overflow can live on `body`, not on `documentElement`: a shell that hides the document's scrollbars so its island can scroll puts it there | it now reads the larger of the two. Fixed 2026-09-21; before that an elastic page below its floor looked fine and was clipping |
| A zone diff reports 0.00% while a whole panel changed colour | the default threshold is 60, and grey `#f3f4f6` to cream `#fffbeb` is a sum of 30 | `TH=6 zonediff.sh …` for a self-render that must be identical; the default is for comparing against a Figma render, where anti-aliasing needs the room |
| A tightened threshold has no effect and the run reports clean | `zonediff.sh` takes `TH` from the ENVIRONMENT; a 5th positional was silently ignored | it now refuses a 5th argument and prints the right form. Cost two wrong measurements on 2026-09-21 before the render was checked another way |

## Environment

| Symptom | Cause | Fix |
|---|---|---|
| `python3 -m http.server` fails on `os.getcwd` | Sandbox restriction | Use `scripts/serve.cjs` |
| A crop of the top of a tall image shows its middle | macOS `sips -c` crops from the centre, and `--cropOffset` shifts relative to the centre, not the top-left | Crop with `scripts/crop.js`; keep `sips` for resizing whole images |
| Server 404s everything after a folder move | A `.claude/launch.json` entry (desktop app) still points at the old path | Update it; keep script paths relative to `__file__`/`__dirname` |
| `serve.cjs` serves the skill folder, not the project | Its default root is the folder above the script, and the script lives in the skill | Run it with `ROOT=.` from the project folder |
| A `.js` or `.sh` tool says "no Chrome found" | No Chromium-based browser at any of the paths `_chrome.sh` / `_chrome.cjs` search | `export CHROME=/path/to/binary`; Chrome, Chromium, Brave or Edge, 112+ |
| `vercel deploy --project <slug>` fails with `project_not_found` | The flag selects a project, it does not create one | `vercel project add <slug> --scope <team>` first (publish.sh does this) |
| The link sent to a respondent 404s after the next publish | The URL that `deploy` prints is build-specific | Send the project alias `https://<slug>.vercel.app`, read from `vercel inspect` |
| Respondents hit a login wall instead of the prototype | Vercel deployment protection (SSO) is on by default on many team accounts | `vercel project protection disable <slug> --sso`; always check the URL anonymously before the session |
| The protection setting says ON, yet the link works — or the reverse | Protection is per URL kind: with `all_except_custom_domains` the production alias answers 200 while the build-hash URL 302s to a login | Decide from a credentialless `curl` against the alias, never from the project setting; `publish.sh` prints the code for both URLs |
| A read-only Vercel command opens a browser login | Credentials expired; the CLI starts a device-auth flow on its own | Gate every call behind an auth check; `vercel login` is the user's to run |
| A publish lands where nobody can see it | Deployed to the personal account instead of the team | Pass `--scope <team>`; check with `vercel project list --scope <team>` |
| A configured MCP server cannot be called | Installed ≠ authorised; OAuth needs an interactive session | Report the three facts (installed / no callable schema / no fallback) and give the exact manual alternative |

## Editing the skill's own scripts

| Symptom | Cause | Fix |
|---|---|---|
| A `node -e` script reads a directory, or its first argument is `undefined` | `node -e` puts no script path in `argv`, so the first argument is `argv[1]`, not `argv[2]` | `process.argv.slice(1)` in `node -e`, `slice(2)` in a file. Cost two cycles on 2026-09-20 |
| A patch script asserts its anchor is missing, and the whole edit is lost | the "old" text was written from memory and differs from the file by a word or a line break | read the exact lines first (`sed -n a,bp`) and patch by line range, or match one short unique line. Three edits died this way on 2026-09-20; the one patched by range went in first time |
| `bash -n` on a shell script fails with `unexpected EOF while looking for matching "` after an innocent comment edit | bash 3.2 (what macOS ships) mis-parses an ODD apostrophe inside a heredoc that sits in `$( )` — `the document's own` is enough | keep apostrophes paired inside such a heredoc, or write around them; `fluidcheck.sh` carries the note at the top of its probe |
