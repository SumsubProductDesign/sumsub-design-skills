# WebSDK shell — version record

The page a WebSDK prototype's screens share: the top bar, the widget box with its empty content
column, the footer, "Powered by Sumsub". Rendered by `scripts/websdk-shell.js` from a config
(`examples/`), gated against a frame's render by `scripts/websdkgate.sh`. **Update this file
whenever anything in this folder or in the shell's two scripts changes**, and re-run the examples
against the references.

## Snapshot

| | |
|---|---|
| taken | 2026-10-09 |
| components | the kit's own, from `assets/components/websdk/` (snapshot of 2026-10-08): `SdkHeader`, `SdkBaseContainer`, `SdkContent`, `SdkFooter`, `SdkButton`, the "Powered by Sumsub" SVG of `SdkLogo` (`icons/powered-by-sumsub.svg`, 138×22, `currentColor`) |
| page rules | the frames of the first WebSDK run (Figma `8jLpqR6jNXzoHl0D6XGPWN`, `9535:100923`, 1440×900 with an 80px browser bar) and the Organisms library's Applicant Data example (`8VpSRNe9ur7SBctw0JrtOE`, `2344:130722`, 375×812): 8px at the sides, the top bar at the top, the widget centred at its max 718, the whitelabel line under it |
| references | `reference/frame-desktop-1440x900.png`, `reference/frame-mobile-375x812.png` — those two frames' renders, what the gate is checked against in lint; `reference/frame-mobile-safari-375x812.png` — the General flow's Welcome (`CTtG8WQa2doFeSYMWaAQ9S`, `1:7480`, 2026-10-14), a 375×812 frame with the iOS status bar (62) above the page and the Safari bar (90) below it, gated through `examples/mobile-safari.json` with `chrome: {top: 62, bottom: 90}` |
| footer.html | 2026-10-12: the footer's line under the buttons, from the config (the Switch device run's Welcome) |
| breakpoint | 600: under it the top bar keeps only the icon-only language button (the 375 frame shows the globe alone, the 1440 frame "To phone" and "En"); the frames' rule, done with the page's media query, not the kit's |

## Geometry (CSS px)

| | |
|---|---|
| page | the kit's `--components-widget-page-background` (white in the light theme), 8px padding at the sides, 4px above the bar; `body.sns-uikit.sns-theme-light` for the variables, `--components-widget-border-width: 1px` so the widget draws its frame (the kit's default is 0) |
| top bar | `SdkHeader`: 68 high, max 718, 4px inner padding, the 44 buttons centred — **the frames draw 60 with no inner padding**, so in the shell the widget starts 8px lower and the bar's buttons sit 4px further in. The gate reads this at the widget's top edge and the back button's centre and states it; it is a ledger line on every WebSDK frame, not a question |
| widget | `SdkBaseContainer`: 718 max (`--components-widget-width-max-main`), 320 min, the 1px frame in `--components-widget-border-normal`, radius 32 (`--semantic-border-radius-3xl`), white; its height is the column's — the page's height minus the bar and the whitelabel line in a fixed page, the viewport's in a responsive one |
| content column | `SdkContent`: padding 24 top, 16 at the sides; the inner column `#content-slot` max 506 (`--components-widget-width-max-content`), centred; `--content-bind1` the room kept under it for the footer — 72 with a footer button, 16 without |
| footer | `SdkFooter`: absolute at the widget's bottom, padding 8 16 16, the primary button 48 high — its bottom edge 16 above the widget's bottom edge in the frame, 17 in the shell (the kit's 1px frame) |
| whitelabel | 38 high: 8px padding, the 138×22 logo in `--components-white-label-grey-background-normal`; the frame's logo top 13 under the widget's bottom, the shell's 14 |

## The gate's numbers, 2026-10-09

| frame | widget frame Δ | footer button | powered by | verdict |
|---|---|---|---|---|
| desktop `9535:100923` at 1440×820 (the 80 browser bar cut) | left 0, right 0, top −8 (the bar), height +4 (the frame's 4px under the widget) | 16 vs 17 from the widget's bottom | 13 vs 14 | the bar's known difference, the rest within 1px |
| mobile `2344:130722` at 375×812 | left 0, right 0, top −12 (the frame's bar has no 4px gap above it), height +12 | 16 vs 17; the button 327 vs 325 wide (the kit's 1px frame on each side) | 13 vs 14 | the same |
| mobile with device chrome `1:7480` at 375×812, `chrome: {top: 62, bottom: 90}` → the page 375×660 (2026-10-14) | left 0, right 0, top −12, height +12 — the same 56-over-4 bar as the mobile example | 16 vs 17; 327 vs 325 | 13 vs 14 | the bar's known difference, the landmarks within 1px; top bar 3.95%, footer 6.37% (the General flow run read 5.95% on the bar with a ring its config had not switched off, on a PNG cropped to 660 rows by hand and `chrome: 0`) |
| the shell against its own render | 0 everywhere | 0 | 0 | identity — lint keeps it |

## Config

```json
{ "theme": "light",
  "canvas": "responsive",
  "frame": {"fileKey": "…", "nodeId": "9535:100923", "width": 1440, "height": 900, "chrome": 80},
  "header": {"back": true, "step": [1, 3], "toPhone": true, "lang": "En"},
  "footer": {"buttons": [{"label": "Continue", "id": "continue"}]},
  "whitelabel": true,
  "narrow": 600,
  "title": "Applicant data" }
```

`canvas` is `"responsive"` (the default: the page fills the window and the widget follows it, as
the SDK does — the websdk profile's canvas mode) or `{"width", "height"}` for a fixed page of the
frame's size minus its chrome; `--canvas WxH` on the command line does the same for one
render, which is how the gate renders. `frame.chrome` is what the frame draws around the page and
nothing renders: a number is a bar above the page (80, the desktop frames' browser bar);
`{"top": 62, "bottom": 90}` is a bar above and one below (the mobile frames' iOS status bar and
Safari bar, `examples/mobile-safari.json`). The gate cuts the PNG from the top row to its height
minus the bottom, renders the shell at what is left (375×660 from a 375×812 frame) and names both
numbers in its ledger line; `--chrome N --chrome-bottom N` on its command line override the config.
The General flow run (2026-10-14) had a top-only chrome, cropped the PNG to 660 rows by hand and
passed `chrome: 0` — the ledger line then named no chrome. `header` and `footer` take what `controls.js`'s `header()`
and `footer()` take; `false` drops either. The header's defaults are the desktop example's — the back
button, the ring at `[1, 3]`, To phone, En — so a Welcome config says `"back": false, "step": false,
"toPhone": false` (`examples/mobile-safari.json`), or the gate renders a ring the frame has not got and
prints "step ring: no ink in the frame". `footer.html` is what sits under the footer's buttons —
the Welcome frame's warning line ("…switch to the phone…" in a caption): without it the gate's
footer zone compared a footer with one line against a frame with two and read 21% (the Switch
device run, 2026-10-12). `--fragment` returns the `<style>`, the markup and the `<script>` for a
generator that writes its own document.

**A flow has more than one header and footer** — Welcome without the back button and the ring,
with a warning under its button; the next screen with both and a plain Continue. The shell then
gives the page and not the screens: a config with `"header": false, "footer": false` renders
through `--fragment` the kit's CSS and script, the page's wrapper and the whitelabel line, and each
screen renders its own `header()`, `container()` with `content()` and `footer()`; the dialogs go once,
at the column's end after the whitelabel line (`references/websdk.md` § The generator). The gate
still takes one config per screen with that screen's header and footer, `footer.html` included.

## What the shell does not cover

Everything inside `#content-slot`: the page title, the fields, the lists, the status screens — the
generator's, from `controls.js` and the frames. The address-search sheet and any modal: `bottomSheet()`
and `modal()` placed by the generator at the end of `.ws-column` — the shell's dialog host (`position:
relative`, the meta's `dialogs`), after the whitelabel line, so the kit's tint covers the top bar, the
widget and the Powered-by line as the frames draw it; never inside the container, where the tint stopped
at the widget's edges and the bar stayed undimmed. The client's
logo on a Welcome screen (`logoBlock()`), the step popup's items (`header.steps`): the frame's.

## How to update

A change to the kit's snapshot re-runs the examples: `scripts/lint.sh` renders them and gates the
desktop one against `reference/frame-desktop-1440x900.png` and, with Node 22+, the mobile ones against
`reference/frame-mobile-375x812.png` and `reference/frame-mobile-safari-375x812.png` (the latter with
both bars cut); the expected lines are the gate's ledger with the bar's known difference. Lint also
pads the shell's own 375×660 render with 62 rows above and 90 below and gates it with the chrome
pair from the config and from the command line: the identity, every landmark at Δ0. A new reference frame is a `get_screenshot` of a widget frame at 1x, saved here with its
size in the name, and a row in the table above.
