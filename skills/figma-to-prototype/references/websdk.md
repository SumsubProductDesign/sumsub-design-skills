# The WebSDK profile

A prototype of the verification widget — the Applicant data form, a document type list, a
status screen — is built with the same ten steps as a dashboard page and a different set of
parts: the WebSDK kit instead of the dashboard's controls, the widget instead of the sidebar
and the island, a page that follows the window instead of a fixed canvas. The profile names
that set once, in Step 0, and every later step reads it.

## Contents

- The profile, and how it is decided
- What the profile changes
- The kit: a snapshot, and why
- Step 2 in the websdk profile — the widget gate and the frames
- The generator
- The responsive contract
- The three widths
- Ledger lines, not questions
- What the kit does not have
- Verification in the websdk profile
- The first run, and what it cost

## The profile, and how it is decided

Two profiles: **dashboard** (the default, everything the other references describe) and
**websdk**. The profile is read from the frames before any question, and said in the
defaults line of Step 0:

| clue | profile |
|---|---|
| the frame's root is an instance of the library's `Widget` (its metadata shows `right side` → `Toolbar / Top Bar` and a `widget` frame with a `Slot`), or the frame carries a `Toolbar / Top Bar` and a `Bottom Bar` | websdk |
| the file is one of the WebSDK ones — the UI kit `Gh2QlRTetoSQdlK9G1nDq4`, the Organisms `8VpSRNe9ur7SBctw0JrtOE`, the KYB file `9ii3Ueqr01mbLS3SE6bsrJ`, or a product file whose frames are 1440 / 744 / 375 with a browser bar drawn above a widget | websdk |
| a sidebar, an island, a key-name header | dashboard |
| neither clue | one form: "Dashboard page or WebSDK widget?" — the only time the profile is asked |

The Mobile SDK (the native app, system fonts, no widget) is not this skill: say so and stop.

## What the profile changes

| | dashboard | websdk |
|---|---|---|
| the controls | `assets/components/controls.js` | `assets/components/websdk/controls.js` — same reads: `--api`, `--api <name>`, `--doc <name>` |
| the shell | `scripts/shell.js` + `shellgate.sh`, `assets/shell/dashboard/` | `scripts/websdk-shell.js` + `websdkgate.sh`, `assets/shell/websdk/` |
| the canvas | fixed, the frame's size (Step 0's canvas row) | **responsive**: the page follows the window and the widget follows the page, as the SDK does |
| the widths | one, the frame's | three: 1440, 744, 375 — one frame per width when the designer drew them |
| the font | Geist, embedded by the shell | Manrope, embedded by `controls.js`; "Powered by Sumsub" is the kit's SVG, no second face |
| the body | the shell's | `class="sns-uikit sns-theme-light"` and a `<meta name="viewport">` — the kit's variables live on those classes, and a phone lays a page without the meta out at 980 |
| Step 4 | absolute children, export coordinates | flow markup inside the kit's column (§ The responsive contract) |
| Step 7's gate | zone diffs against the frame | the shell gate's landmarks, then `blockgate.sh` on the content column at each width — bands and residuals, because a text zone's percentage cannot be met here |

Everything else holds unchanged: the purposes and the questions of Step 0, the live set of
Step 1, the extraction order and the traps of Step 2, the generator of Step 3, the plates of
Step 5, the ledger, the handoff, the run log, publishing.

## The kit: a snapshot, and why

The dashboard's controls are hand-written from the product's Storybook with stable class
names. The WebSDK kit cannot be: it is Vue with CSS Modules, its class names carry a hash
of the build (`_button_4dpt3_1` one week, `_button_9pfi4_1` the next), and so do its
scoped-style attributes and `v-bind()` variables. So the kit is **taken as it is** from its
Storybook (`storybook-websdk-uikit.dev.euc1.sumsub.net`, the team's permanent source) by
`scripts/sbkit.cjs`, and every hash is renamed once through one table: `sdk-button`,
`sdk-button__primary`, `data-s-checkbox`. `assets/components/websdk/VERSION.md` § What a
snapshot is, and why not a hand-written library has the rules; `controls.js` renders the kit
in those stable names, so a generator written against them survives the next capture.

What the snapshot holds, and a build reads through `controls.js` rather than from the files:
`kit.css` (every rule the kit applies), `markup/<Component>/<story>.html` (each story's
markup, the open state of a dialog as `.open.html`), `icons/` (the kit's 104 icons by name,
and `icons/16/` the 23 glyphs the components draw at 16), `flags/` (230 countries),
`modules.json` (the hash table), `storybook.json` (the 42 values `dscheck.js --spec` watches).

**The component wins, the ledger records**, exactly as for the dashboard: the frames draw
the kit's components at an older version or with a designer's deviation, and the kit is
what ships. § Ledger lines, not questions has the known ones.

## Step 2 in the websdk profile — the widget gate and the frames

**Split the frame before reading anything**, as Step 2 says, with the profile's parts:

* **the shell is the widget** — the top bar, the widget box, the footer, the "Powered by"
  line. Never extracted: `websdk-shell.js` renders it from `_work/shell.json`
  (`assets/shell/websdk/examples/desktop.json` is the shape), and `websdkgate.sh` checks it
  against the frame's render. The config takes the bar's state (the back button, the step
  `[n, total]`, "To phone", the language) and the footer's buttons from the frame's screenshot.
* **the controls are the kit's** — a field, a select, a radio row, a button, a choice item, an
  alert: `websdk/controls.js --api` lists them, the frame gives only the text, the state and
  the icon. A control's size or colour is never read from the frame.
* **everything else** — the page title, the order of the fields, the texts, the data, the
  illustration — is read as Step 2 reads it: `get_metadata` on the frame (a FRAME, the
  `1.1 Desktop — Applicant data` kind, never the section), `get_design_context` on the content
  node, `download_assets` at 2x for an illustration the kit does not have.

**The gate**, one call per width the designer drew:

```bash
scripts/websdkgate.sh _work/shell.json _work/figma-ref/desktop.png --out _work/shots/gate     # 1440, the browser bar in config.frame.chrome (80)
scripts/websdkgate.sh _work/shell-mobile.json _work/figma-ref/mobile.png --out _work/shots/gate-m   # 375, rendered through the protocol; a status bar and a Safari bar as chrome {top: 62, bottom: 90}
```

It prints five landmarks — the widget's frame by its edges, the bar's buttons by their centres,
the footer button and the "Powered by" line by their distance from the widget's bottom — the
bar's known offset, two zones and the ledger line. The verdicts:

| the line says | what to do |
|---|---|
| "the landmarks agree within 1px" | the shell; nothing to write |
| "the frame's top bar area is 60 against the kit's 68, everything under it 8px lower in the shell; the landmarks agree within 1px" | the shell; paste the line into the ledger — this is every WebSDK frame so far |
| "… within 2–4px — the component's own differences" | the shell; the line into the ledger, with which landmark |
| "landmarks off by up to Npx beyond the bar" and `ASK` | **a question with a crop**: an older Widget, a newer one than the kit, or on purpose |
| "only N of 5 landmarks found" | the frame is not a widget page, or the config's state differs from the frame's (a footer without a button, no step ring) — fix the config first |

**The frames come three to a screen** when the designer drew the widths — desktop 1440,
tablet 744, mobile 375 — and they disagree in places the kit decides by itself (the sheet
against the dropdown, the bar's buttons). Read all three before building, note where they
differ, and let the kit's own breakpoints and the page's `narrow` rule settle it; a
disagreement the kit does not settle is a question. **Re-read the section's metadata before
every increment**: the first run lost a frame mid-build (`get_screenshot` answered "node not
found") and the tablet and mobile sections were gone within a week.

## The generator

`gen.js` as Step 3 says, with the profile's parts. **One screen, or screens that share the bar
and the footer**: the shell renders both, and the screens go into its slot.

```js
const W = require(process.env.SKILL + '/assets/components/websdk/controls.js');
const shell = execFileSync('node', [SKILL + '/scripts/websdk-shell.js', '_work/shell.json', '--fragment']).toString();
const screen1 = W.pageTitle({title: 'Applicant data'})
  + W.inputField({label: 'First name', required: true, placeholder: 'Legal name', id: 'first'})
  + W.selectField({label: 'Country', required: true, options: COUNTRIES, value: 'CYP'})
  + W.button({type: 'link', label: 'Enter address manually', id: 'manual'});
// the shell's #content-slot takes the screen's flow markup; a second screen is a second slot
// content, shown by the page script — the shell is rendered once
page = shell.replace('<div class="sdk-content__SdkContentInner" id="content-slot" data-slot="websdk"></div>',
                     `<div class="sdk-content__SdkContentInner" id="content-slot">${screens}</div>`);
```

**A flow whose screens differ in the bar or the footer** — the usual case: Welcome has no back
button and no ring and a warning line under its button, the next screen has both and a plain
Continue. Then the shell gives the page and each screen renders its own widget:

```js
// the page: the kit's CSS and script, the wrapper, the whitelabel line — no header, no footer
fs.writeFileSync('_work/shell-page.json', JSON.stringify({theme: 'light', header: false, footer: false, whitelabel: true, narrow: 600}));
const frag = execFileSync('node', [SKILL + '/scripts/websdk-shell.js', '_work/shell-page.json', '--fragment']).toString();
const style = frag.match(/<style>[\s\S]*?<\/style>/)[0], script = frag.match(/<script>[\s\S]*?<\/script>/)[0];
const whitelabel = frag.match(/<div class="ws-whitelabel">[\s\S]*?<\/svg><\/div>/)[0];
const narrowBar = {toPhoneClass: 'ws-wide', langClass: 'ws-wide', langIconClass: 'ws-narrow'};   // the shell's `narrow` rule
// each screen: its own header(), container() with content() and footer(); the dialogs once, at the column's end
const welcome = `<div class="screen on" id="s-welcome">${W.header({back: false, toPhone: true, lang: 'En', ...narrowBar})}`
  + W.container(W.content(WELCOME, {bottom: 72})
      + W.footer({buttons: [W.button({label: 'Start verification', attrs: 'data-sdk-open="#sheet-consent"'})], html: WARNING})) + `</div>`;
const doc = `<div class="screen" id="s-doc">${W.header({back: 'back', step: [1, 3], toPhone: true, lang: 'En', ...narrowBar})}`
  + W.container(W.content(DOC, {bottom: 72}) + W.footer({buttons: [W.button({label: 'Continue'})]}), {id: 'sdk-base-container-doc'}) + `</div>`;
// the dialogs are the column's last children, after the whitelabel: .ws-column is their host (position: relative),
// so the tint covers the top bar, the widget and the Powered-by line — never inside a container() or a .screen
// the frame's instance is "Modal / Bottom sheet / Desktop": bottomSheet() — at every width
const dialogs = W.bottomSheet({id: 'sheet-consent', inner: CONSENT, footer: [AGREE]})
  + W.modal({id: 'modal-qr', title: 'Continue on your phone', inner: QR});
page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${style}<style>${CSS}</style></head>
<body class="sns-uikit sns-theme-light"><div id="app"><div class="ws-page"><div class="ws-column">${welcome}${doc}${whitelabel}${dialogs}</div></div></div>${script}${FLOW}</body></html>`;
// CSS: .screen{display:none;flex-direction:column;flex:1 1 0;min-height:0;width:100%;align-items:center}
//      .screen.on{display:flex} .screen>main{width:100%;min-height:0;flex:1 1 0}
```

The page keeps the shell's wrapper (`#app > .ws-page > .ws-column`) so the widget sits where the
gate measured it; a second container needs its own `id` (`sdk-base-container` is the kit's and
can be used once). **The gate is still per screen**: one config per screen with that screen's
`header` and `footer` — `footer.html` carries a warning line, so the footer zone compares what
the frame draws (`assets/shell/websdk/VERSION.md` § Config).

Rules that follow from the kit:

* **a screen is flow markup**: the kit's column (`sdk-content__SdkContentInner`) lays the
  children out, 16 apart when the page says so (`.fields{display:flex;flex-direction:column;gap:16px}`
  from the frame's auto-layout), never a coordinate;
* **a dialog goes at the end of the page's column, after the whitelabel line — never inside the
  container**: `W.modal()` and `W.bottomSheet()` are absolute, inset 0, hosted by the nearest
  positioned ancestor, and the shell's `.ws-column` is it (the SDK's root: the top bar, the widget,
  the Powered-by line — the frames tint all three from y 4); inside the container the tint stopped
  at the widget's edges, the bar stayed undimmed and the dialog sat 8 inside the frame with white
  gaps (run 17). A page of several screens hosts them once, after the last screen and the whitelabel;
  a `.screen` wrapper is not the host. The page's `data-sdk-open` opens them and the script closes
  them; which of the two is the frame instance's name ("Modal / Full" or "Modal / Bottom sheet"),
  the same at every width;
* **a toast, a steps popup, a dropdown** are the kit's too (`W.toast`, `header.steps`,
  `W.dropdownMenu`); the page positions a dropdown, the kit the rest;
* **what the kit does not draw is the page's**: the widget's page background, the 8px margins,
  the `narrow` breakpoint — all in the shell already — and anything § What the kit does not
  have names;
* `W.css` once, `W.script` once, `body.sns-uikit.sns-theme-light`, the viewport meta —
  `websdk-shell.js --fragment` brings the first two and the page writes the last two.

## The responsive contract

Step 4's contract — absolute children, export coordinates — does not apply inside the
widget, and `references/architecture.md` § One canvas, absolute children, export coordinates
names this profile as the exception. Inside the widget:

* **the kit positions, the frame orders**: the frame fixes which controls, in what order,
  with what text and state; their sizes, gaps and wrapping are the kit's (`SdkContent`'s
  padding, the column's max 506, a field's 44, the footer pinned to the bottom);
* **the page's own rules are few and come from the frames**: the column's gap, a row of two
  fields, a block hidden until a state — written as classes in `gen.js`, each with the frame
  and node it came from;
* **nothing is measured off a scaled render**: the checks render at the width, through the
  protocol below 500 (`--device`), never a 500 window cropped to 375;
* **a value still traces**: a gap of 16 is the frame's auto-layout token (`gap-4`), a field's
  44 is `storybook.json`'s record; a number with neither source is a question.

The three breakpoints the first run found in the frames, and where they live:

| width | what changes | where |
|---|---|---|
| ≤ 600 | the top bar keeps only the icon-only language button | the shell's `narrow` (the page's media query; the kit keeps every button) |
| ≤ 726 | the kit's own: the footer loses its side radius; a modal and a sheet lose their 8 inset and their bottom corners — a full-bleed panel, **not a change of shape**: the modal still fills the widget, the sheet is still sized by its content | `kit.css`, nothing to write |
| ≤ 1023 | the address search opens as a bottom sheet instead of a dropdown — two different components the frames draw per width | the page's rule, from the tablet and mobile frames — a `gen.js` class and a media query |

**A dialog is picked by the frame's instance name, never by width.** The UI kit's Figma
(`Gh2QlRTetoSQdlK9G1nDq4`, page "Modal") draws two shapes, each at Desktop and Mobile: "Modal / Full"
fills the page — `modal()`; "Modal / Bottom sheet" is sized by its content and rises from the page's
bottom — `bottomSheet()`. The same component at 375 and at 1440; a width the designer did not draw
keeps the component the drawn frame names. The General flow run (2026-10-14) read the old rows ("the
modal becomes the sheet's shape", "the sheet is the modal under 1023"), switched its consent at 1023 with
its own `matchMedia`, and its desktop consent filled the widget where the kit draws a sheet.

## The three widths

The designer draws 1440, 744 and 375; the respondent opens whatever they have. The page is
responsive, so one build serves all three, and **each width is verified on its own**:

```bash
node scripts/shoot.js proto.html _work/shots 1440 900 '#s1,#s2'
node scripts/shoot.js proto.html _work/shots 744 1000 '#s1,#s2' --device
node scripts/shoot.js proto.html _work/shots 375 812 '#s1,#s2' --device
scripts/statecheck.sh proto.html --size 375x812 --device --js '…' --probe 'return [innerWidth, document.documentElement.scrollWidth]' --hits auto
```

Chrome's command line lays a window out at 500 wide at the narrowest and crops the PNG, so a
375 check without `--device` reads the desktop breakpoint and says nothing — the first run
found it on a phone, after three mobile checks had passed. `--device` needs Node 22.

## Ledger lines, not questions

Seen on every WebSDK frame so far; write the line, do not ask:

| the frame shows | the line |
|---|---|
| a 60px top bar with no inner padding | "top bar 60 in the frame, SdkHeader 68 with 4px padding: the widget 8 lower, the bar's buttons 4 in" (the gate prints it) |
| a "beginning" dot on the step ring | "no dot on SdkHeader's ring" |
| an 80px browser bar above the page | "browser chrome, not rendered" — `config.frame.chrome` |
| a status bar above and a Safari bar below the page in the mobile frame (62 and 90 on the General flow's 375×812 frames) | "device chrome, not rendered: 62 above, 90 below" — `config.frame.chrome: {top: 62, bottom: 90}`, and the gate cuts both and prints the line with the numbers; a keyboard drawn in a frame is the same line |
| Extra Small icon block 40×40 | "SdkIconBlock extraSmall is 32" |
| the required mark `*` after a 4px gap | "`&nbsp;*` from the kit" |
| "Fill manually" in Header 3 | "SdkButton link, body weight" |
| a long form whose frame grows past the window | "the kit scrolls the content inside the widget, the footer stays" |
| a search field with a magnifier | "SdkInputField has no icon slot in the story; the magnifier from the frame goes in `left`" |
| the widget's page background white | the kit's `--components-widget-page-background` — white in the light theme too; nothing to write |
| a grey haze at the widget's corner under the footer | "the footer's backdrop blur, the kit's" |
| the dialog's tint from y 4 over the top bar, the widget and the Powered-by line, the sheet ending 4 above the page's bottom | "the dialogs hosted by the page column, the tint over the bar; the kit's overlay margin 8 against the frame's 4 — the tint starts 4 lower, the sheet ends 4 higher" (the kit draws it so; a dialog inside `container()`, the bar undimmed, is a build error, not a line) |

## What the kit does not have

The frames draw these; the kit has no component, so the page builds them from the kit's
tokens and the frame's geometry, and the ledger says so:

| the frame | what to build |
|---|---|
| an autocomplete list under a field | a popup under `inputField` with the kit's select-menu tokens (`--components-select-menu-*`), rows of 48, radius 8; the first run's `ac-menu` |
| a list of options in a sheet, without radios | rows of 48 in a 1px frame, radius 12, from the frame's tokens |
| a country dialog behind the phone field's trigger | the trigger is inert; a sheet of `radio()` rows if a task opens it |
| an illustration in the widget's image slot above the content (Tips: a grey plate 4 inside the widget's edges, 236 high, radius 24, the picture at its natural size) | `content({illustration: W.illustration({svg, size: 'd', height: 236})})` — the kit's slot gives the inset and the 16 to the title, `illustration()` the grey token; the `'d'` plate is content-sized between the kit's 140 and 240 (an svg sized by a page rule collapses it to the picture's height — run 16 measured 161), so the frame's height is the call's `height` (an inline style on the plate) or a page rule on it; the radius is the kit's 28 (a ledger line) and the picture's natural size is one page rule on the svg (`controls.js --doc content`). Not a hand-built slot |
| "Uploading, please wait a moment" over the blurred photo | the same `cameraFrame({inner})` as the captured photo, with `overlay: {loader: true, title, text}` — the frame's tint (black .5, a 16px backdrop blur) over the whole frame, the kit's ring at 40 (`loader({type: 'white', size: 'extra-large'})`, live) and the two texts; the blur is live, so the sharp photo plate serves both states and the frame's blurred export is not cut |
| a loading state anywhere — the camera's dots, an upload's ring | **the kit's loaders animate by default and are rule 5's allowed animation; a loader is never baked into a plate.** `dotsLoader()` and `loader()` are live as rendered (`kit.css` animates them, `prefers-reduced-motion` stops them); `cameraFrame({loading: true})` is the camera's dots, nothing extra |
| a status screen with an illustration and no button (Verified: a 172 picture, two lines, no footer) | `splashScreen({illustration: svg, title, message})` — the frame's export in the icon's place at its own size, no footer and the room 16 without `buttons`, the content centred in the widget by the kit's own rule; `illustration({svg})` inside it when the frame draws the kit's grey plate (the kit recolours the export); a 2x plate only for a picture no export reproduces |
| the client's logo on Welcome | `logoBlock({src})` with the frame's asset |
| the Sumsub ID block on Welcome ("Get verified faster with Sumsub ID": a toggle, the green icon, a caption with "Learn more", in the email variant an input under the row) | `sumsubIdBlock({email})` — the Figma "Welcome block" in the kit's toggle, text, link and input field; `email: false` (the default) is the Widget's collapsed block, 506×80. Not a hand-built block; the toggle's 34×20 against the frame's 34×24 and the input's 44 against 46 are its ledger lines (`controls.js --doc sumsubIdBlock`) |
| a step list on Welcome (icon block with a digit, "Provide personal information") | `iconBlock({size: 'extraSmall', text: '1'})` beside `text()`, 12 apart, as the frame's auto-layout says; the digit is `text`, not an icon — the MCP's `Number` icon is only ever the 1 |
| **a camera state** (the camera's picture with the document outline, the captured photo, the "Uploading" blur) | `cameraFrame({caption, loading, inner, shutter})` in `container()` with the picture baked into its stage — an `<img>` cut from the frame's 2x export at the stage's rectangle, which fills the stage with `object-fit: cover`; the gallery and flip buttons inert unless the task needs them. **Never the whole box as a plate**: on desktop the stage and the bar fill the widget (the General flow run centred a 357×560 plate in the 718 widget). Each picture plate is its own ledger row with its diff (`controls.js --doc cameraFrame`) |
| a system dialog over the camera (iOS "would like to access the camera") | a plate of the dialog over a fixed overlay in the frame's dim (black 0.6, measured 255 → 102), centred on the phone's screen, not the Safari viewport (14px under the viewport's centre on 375×812 with 62 above and 90 below); a hit layer on Allow, Don't allow inert when the frames draw only Allow's path — asked once, then a ledger row |

**The kit has no camera stage.** `SdkCameraPopup` is only the wizard's message plate over the
picture (`sdk-camera-popup`: a blurred plate with white text, `role=status`), not the "ID card front"
caption under the stage; the `camera-select*` classes (the camera chooser's button and its menu)
arrived in `kit.css` without a story. `cameraFrame()` builds the stage, the caption and the bar from
the Organisms component "POI camera Mobile | Desktop" in the kit's own camera variables; only the
picture in the stage is baked.

A kit dialog no story shows open (the select's fullscreen variant, the phone's country
sheet) is inert in the prototype unless a task needs it; then it is built from the kit's
rows and recorded as such.

## Verification in the websdk profile

Step 7 as written, with two changes: **the width is a dimension** — every check that reads
pixels or the DOM runs at 1440 and, through `--device`, at 744 and 375; and **the gate is
structural** — `websdkgate.sh` for the shell, then `blockgate.sh` on the content column at each
width the designer drew, one call per screen and width:

```bash
node "$SKILL/scripts/cut.js" _work/figma-ref/doctype-page.png 467 68 506 740 _work/figma-ref/doctype-column.png   # the frame's column, at the bar's offset
"$SKILL/scripts/blockgate.sh" switch-device.html _work/figma-ref/doctype-column.png \
  --hash '#doctype' --no-anim --crop-of '#content-slot' --size 1440x900            # 744 and 375: --device, the width's frame
```

The state is rendered through `statecheck.sh` (`--hash`, `--js`, `--no-anim` for an open
dialog, `--device` under 500), the render is cut by `#content-slot`'s own rect, and the verdict
is the bands' residuals against the column's reference — the kit's own differences read as
named bands (a select 44 against 48, a legend 2 lower), not as a percentage. **A percentage is
not the gate here**: `zonediff.sh` of a text zone reads 3–20% against a WebSDK frame — Figma's
and Chrome's rasterisation of Manrope, the kit's geometry — so Step 0's ≤3% cannot be met and
is not asked; the structural gate is the threshold, and `zonediff.sh` stays for text-free zones
(a QR plate, ≤2%) and for the regression against the last accepted render. Hover, focus and
the kit's transitions: a human look, as always.

**The kit's dialogs animate, and a headless render without real time stops them at the start.**
`SdkModal` and `SdkBottomSheet` slide up for 0.4 s (`sdk-modal__slide-up`); the command line's
renders run on virtual time, where an animation does not advance, so the open dialog is drawn at
the widget's bottom and `--hits` reports its controls "not on screen" — the Switch device run's
first QR check said 3 of them were, truthfully. Every headless check of an open dialog takes
`statecheck.sh --no-anim` (the kit's transitions killed) or `--device` (rendered through the
protocol, in real time); `shoot.js` has only `--device`. The same holds for the steps popup and
a dropdown, which fade. **A timed state is the same trap the other way**: virtual time fires the
loader's timer before the shot, so the camera's dots render as the iOS dialog and Uploading as
Verified (run 16's 1440 baselines) — `--device`, or `#state?hold` to hold the page's timers
(`references/interaction-plumbing.md` § Timed transitions).

`fluidcheck.sh` is the dashboard's; the widget does not shrink its columns. The check at the
three widths is "no sideways scroll, the address search's sheet under 1023 and its dropdown above, the bar's
buttons as the `narrow` rule says" — `statecheck.sh --device` with a probe reading
`scrollWidth` and the two states.

## The first run, and what it cost

Address autocomplete, 2026-10-05 … 10-08, one designer: Welcome, the Applicant data form
with the autocomplete, the sheet on tablet and mobile, Verifying, Verified; published on
Vercel. The run built its own path for everything this profile now has — the kit through two
CDP scripts, the shell by hand, the mobile checks through a device-emulation script after
the command line's 500px floor had passed three of them wrongly — and its run log §6 is where
the profile's rules come from. The adaptive round (two more frame sets, the sheet, device
emulation) was the most expensive increment; with the profile it is the three-width check
and the `narrow` rule.
