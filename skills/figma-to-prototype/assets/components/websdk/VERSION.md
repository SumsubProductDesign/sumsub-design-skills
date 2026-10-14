# WebSDK UI kit — version record

The design system's own components for a WebSDK prototype, as a snapshot of the kit's Storybook
taken by `scripts/sbkit.cjs` from `assets/components/websdk/stories.json`. The block between the
`sbkit` markers is written by the script on every capture; everything else here is written by
hand after one and says what the snapshot is for and how a prototype uses it.

## What a snapshot is, and why not a hand-written library

The dashboard's controls (`assets/components/controls.js`) are written by hand from the product's
Storybook: stable class names, a value table, `dscheck.js` to watch the values drift. The WebSDK kit
cannot be read that way. It is Vue with CSS Modules: every class name carries a hash of the build
(`_button_4dpt3_1`), the hash changes with every build of the kit — the first WebSDK run captured
`4dpt3` on 2026-10-05 and the live Storybook served `9pfi4` on 2026-10-08 — and the `v-bind()`
variables in its styles (`--v65923a60`) are hashed the same way. A library written against those
names is wrong within the week.

So the kit is taken as it is, in a real page over the DevTools protocol, and renamed once:

| the build's name | the stable name | rule |
|---|---|---|
| `_button_9pfi4_1` | `sdk-button` | the module's root class: `sdk-<component>` |
| `_primary_9pfi4_41` | `sdk-button__primary` | every other class of the module: `sdk-<component>__<name>` |
| `_SdkHeader_1oywt_1`, `_back-button_1oywt_49` | `sdk-header`, `sdk-header__back-button` | the component's name is dropped from the prefix (`SdkHeader` → `header`), camel case becomes kebab (`SdkInputField` → `input-field`) |
| `--v65923a60` | `--content-bind1` | a `v-bind()` variable, by the component whose module uses it |
| `data-v-ccb88c70` | unchanged | Vue's scoped-style attribute; the kit's CSS and markup carry the same one, nothing of a prototype's own refers to it |

Which component a module belongs to is settled by `stories.json` (`owns`), by the component's
name in a class, or by the stories the module shows in — `modules.json` says which, per module.
A wrong guess is a pin in `stories.json` and a new capture, never an edit of `kit.css`.

## Using it in a prototype

* **`kit.css` is inlined once**, whole: the variables, the resets and every component's rules
  come together, and the lazily injected parts the kit's `iframe.css` lacks (the icon block's sizes,
  `--semantic-spacing-sm`) are in it.
* **The page's `<body>` carries `sns-uikit sns-theme-light`** (or `sns-theme-dark`): the colour
  variables are defined on those classes, and a page without them renders unstyled. The container
  the SDK itself renders into is `#sns-websdk-container`.
* **Fonts come from Google Fonts, linked by the page** (rule 1 of SKILL.md excepts web fonts):
  Manrope for the kit's text, Inter for the "Powered by" line. The kit's stories also load Dosis,
  which no component the snapshot covers uses.
* **Markup comes from `markup/<Component>/<story>.html`**: a story's root as the kit rendered it,
  renamed, with the story's own wrapper where the story has one (a `div` with padding, a
  "Value:" readout under a field). A dialog's open state is `<story>.open.html` — the dialog with
  its overlay, as it sits in the body.
* **What the kit does not draw, the prototype does**, and reads from the Figma frames, not from
  here: the page background behind the widget (`--components-widget-page-background`), the
  widget's width and side margins (718 and 8 on the frames of 2026-10-05), the breakpoints at which
  the top bar keeps one icon and the search opens as a sheet (600 and 1023 on the same frames).
  The kit is responsive by itself; the widget around it is the frame's.

## Where mockups disagree with the kit

Read from the first WebSDK run's ledger (address autocomplete, Figma `8jLpqR6jNXzoHl0D6XGPWN`,
2026-10-05). The component is the default; each of these is a ledger line, not a question:

| element | the mockup | the kit |
|---|---|---|
| top bar | 60 high, a "beginning" dot on the step ring | `SdkHeader` 68, no dot |
| icon block beside a step | Extra Small 40×40 | `SdkIconBlock` extraSmall 32×32 |
| required mark | `*` after a 4px gap | `&nbsp;*` from the field (`SdkSpanRequired`) |
| "Fill manually" in a menu | Header 3 SemiBold | `SdkButton` link, Body weight |
| error under a field | red frame, "This field is required" | the field's error state, the same text |
| a long form | the frame grows past the window, the page scrolls | `SdkContent` scrolls inside the widget, the footer stays |
| the footer's edge | — | a grey haze at the widget's corner from the footer's backdrop blur: the kit's, left as is |

## How to update

```bash
node "$SKILL/scripts/dscheck.js" --spec "$SKILL/assets/components/websdk/storybook.json"   # ~1 minute: has the kit moved under controls.js?
node "$SKILL/scripts/sbkit.cjs"            # ~5 minutes, Node 22+, Chrome, the network: the snapshot retaken
git diff --stat assets/components/websdk   # kit.css and markup change on every build; read modules.json
"$SKILL/scripts/lint.sh" --quick           # the snapshot carries no hash, the three files are one capture
```

`dscheck.js --spec` is the cheap question — the values `controls.js` and the sections above depend
on (the bar's 68, the button's 48, the box's 44 and its frame, the colours), read from the live
stories through the kit's stable hooks and compared with `storybook.json`; a changed value is a line
to fix in `controls.js` and here, then `--record` writes the live values back. `sbkit.cjs` is the
expensive one, run when the kit changed: every class name, every rule, every story's markup.

Read `modules.json`'s `how` column after a capture: a module that moved to another component, or
one named `sdk-kit__*` (seen in the CSS alone), is either a pin to add in `stories.json` or a story
to add so the module shows in markup. Then re-run. A component the spec names that the index no
longer has is printed at the end and exits 1 — the kit renamed or dropped it; fix the spec.

## The functions — `controls.js`

One section per function, the heading `--doc <name>` finds. Sizes are the snapshot's root measurements
(the generated block below) and the first run's ledger; a value a story does not show is marked so.

## Icon — `SdkIcon`

Stories `components-sdkicon--*`. `<svg class="icon sdk-icon type-<colour> size-<size>-auto">` with the
scoped `data-s-icon`; the kit colours it by the type class (primary, secondary, interactive, white,
success, warning, danger, info, neutral) and sizes it by the size class (extra-small 16, small 24, medium,
large). `icons/16/` holds the 23 glyphs the components use at 16 (cut from the stories), `icons/` the 104
of `all-icons` at 24, by the story's names. The kit's own `sumsub-id.svg` is the dark variant (a `currentColor` plate
with a white mark); the green "Icon / Small / Sumsub ID" the Welcome block draws (a `#43DB99` plate, the
dark mark, 20×20) is not in `all-icons` and was added from the Figma export as `icons/sumsub-id-green.svg`
(2026-10-14) — `sumsubIdBlock()` takes it by name.

## Flag — `SdkFlag`

Stories `components-sdkflag--*`. 230 flags from the grid story, 24×18, in `flags/<CODE>.svg` by the alt's
three-letter code; `flag()` inlines one as the kit does, a data URI in an `<img>`.

## Text — `SdkText`

Stories `components-sdktext--*`. The kit's typography in Manrope: header1 24/32 SemiBold, header2 16/24
Bold, header3 16/24 SemiBold, body 16/24 Medium, caption 14/20 Medium, danger (body in `#d12424`).

## Button — `SdkButton`

Stories `components-sdkbutton--*`. Six types on `data-variant`: **primary** (black plate, white text, 48
high, radius the full pill), **secondary** (white, 1px frame), **plain** (no plate), **link** (an inline
`<span role=button>`, blue, `underline` for the underlined one), **topbar** (the header's: a 44 pill with a
16 icon), **field** (inside a field's box: the eye, the calendar). `small` is 32 high. States the kit draws
and the markup carries: `disabled` (grey plate, `aria-disabled`), `loading` (the three-dot loader, disabled).
Hover and focus come from the kit's rules — a human look (Step 7). Text: header3, 16/24 SemiBold.

## Header — `SdkHeader`

Stories `components-sdkheader--*`. 68 high (the frames of 2026-10-05 draw 60: ledger line), the back
button at the left, then "Step" and the ring with `2/3` inside (44 box, a 1px track, the arc's
`stroke-dashoffset` is 100 − 100·current/total), the topbar buttons at the right. The ring's popup
(`stepsPopup`) is the kit's SdkStepsPopup; the kit opens it on a click and the script here does the same.
The kit keeps every button on every width; hiding "To phone" and the language label under 600 is the
frames' rule, done with the page's own media query through `toPhoneClass`, `langClass`, `langIconClass`.

## Steps popup — `SdkStepsPopup`

Stories `components-sdkstepspopup--*`. Rows of a 16 icon and a caption: done (`check-circle`), active
(`step-dot`, the row bold through `sdk-steps-popup__active`), to do (`step-loading`, the dotted ring,
greyed by the icon's `disabled` class). Positioned under the ring by the kit's own absolute rules.
The plate is `sdk-steps-popup__container` (absolute, the frame, the blur) and each row is `sdk-steps-popup`,
as the stories have it; until 2026-10-13 `stepsPopup()` put the row's class on the plate and an invented
`sdk-steps-popup__step` on the rows, so an open popup had no plate — lint's class check now matches whole
class names and would refuse it.

## Container — `SdkBaseContainer`

Stories `components-sdkbasecontainer--*`. `<main id="sdk-base-container">`: the widget, max
`--components-widget-width-max-main` (718), white, the radius and the 1px frame from the variables, a
column that the content fills and the footer pins to. Its height is the page's to give (the fixture gives
it a fixed height; a real prototype gives it the viewport's).

## Content — `SdkContent`

Stories `components-sdkcontent--*`. The scrolling middle: padding 24 top and 16 at the sides from
`--sdk-content-padding-*`, the inner column max `--components-widget-width-max-content` (506) centred,
`--content-bind1` the room under it for the footer (16 in the story, 48 under a flat footer, 72 under a
splash screen's button). `withMinHeight` is the kit's 440 floor; `illustration` the edge-to-edge slot above.

`content()` writes the room as a class (`w-room-72`, or `w-room-72-140-600` with a narrow value) and its
rule in a `<style>` inside the section, at zero specificity (`:where(.w-room-72){--content-bind1:72px}`) —
not as the inline `style="--content-bind1"` the story has. An inline value beat the page's own media query
unless it said `!important`, and the Switch device run's first attempt without it did nothing: the Welcome
warning wraps to two lines at 375, the footer grows to 136, and the content overlapped it by 22px
(2026-10-12). `bottomNarrow` takes that value directly — the room at and under `narrow` (600 by default, the
shell's breakpoint); a page rule for any other width wins over the class without `!important`.
`splashScreen()` and the shell's slot (`content.bottomNarrow` in its config) write it the same way.

**The room is the frame's Bottom Bar, measured, not the example's number.** 72 is the kit's footer with one
button; the Welcome frame of the Switch device flow draws a 104 Bottom Bar (a warning line under the
button) and run 17 first copied the 72 from the example above and overlapped it. Read the bar's height
from `get_metadata` per screen (`bottom: 104, bottomNarrow: 124` when the warning wraps at 375).
**Never `min-height: 100%` on the column** to centre or fill it: the column sits inside the section's 24px
top padding, so 100% overflows by that padding and the widget grows a scrollbar — run 15's Verified (18px)
and run 17's Welcome (the room) both did it. The column is a flex item already (`flex: 1 1 0`); fill with
`flex: 1 0 auto` on the page's wrapper, centre with `justify-content`, as `splashScreen()` does.

**The `illustration` slot.** `content({illustration})` puts the html in `sdk-content__illustration` as the
section's first child, before the inner column — **edge to edge of the section, not of the 506 column**: the
kit's margins are the inset minus the section's padding, so inside the column the slot was the column's
width (a 530 plate 94 from the widget's edge at 1440, run 16's Tips) while the kit's Figma (`Gh2QlRTetoSQdlK9G1nDq4`
`15128:83417`, the Widget with the Image slot) draws it 4 inside the 718 widget. The kit's one rule for it
is that margin: the html sits **4px inside the widget's edges** at every width (708 wide in the 718 widget)
(the content's 24/16 padding minus the slot's 4 inset) with 16 under it to the column, and nothing else —
no background, no height, no radius; the html's own box, measured at 375: the slot 349 wide in the 357
widget, 4 under the header. The Tips frame of the General flow (`I1:7508;10189:6215;1:7505`, 2026-10-14)
draws a grey plate in that slot — the illustrations token (`#ecedf2`), 140–240 high, radius 24, the
picture 236×166 at its natural size, centred — and the run built it by hand (`img-slot`, the same numbers).
The kit's plate inside the kit's slot gives it:

```js
W.content(TIPS, {bottom: 72, illustration: W.illustration({svg: svgFile('tips-id.svg'), size: 'd', height: 236})})
// the page's one rule, from the frame: #s-tips .SdkIllustration svg{width:236px;height:166px}
```

`size: 'd'` is the kit's `min-height: 140px; max-height: 240px` and **nothing in between: the plate sizes by
its content**. An svg left to the kit's `height: 100%` reads 240; an svg the page sizes to the frame's
picture collapses the plate to that height (run 16 measured 161 and lost two cycles to the sentence that
used to stand here, "reads 240 with an svg in it"). So the frame's slot height is a number the page gives:
`height: 236` on the call — an inline height on the plate, within the kit's 140–240 — or a page rule on
`.SdkIllustration`; the background the token's grey, the inset and the 16 to the title the slot's. The
two differences are ledger lines: **the radius is the kit's 28** (`--components-illustrations-border-radius-large`)
against the frame's 24, and the kit's `svg {width: 100%; height: 100%}` with 16 of padding beats the
export's own width and height, so the picture is stretched to the plate unless the page sizes the svg by
one rule, as above. A bare `<img>` or `<svg>` in the slot (`content({illustration: img})`) is the frame's
case without a plate: edge to edge, no background, the picture's own height.

## Footer — `SdkFooter`

Stories `components-sdkfooter--*`. Absolute at the widget's bottom, padding 8 16 16, the top corners
rounded 32, a 13px backdrop blur over the content scrolling under it (the grey haze at the widget's
corner the first run's ledger names is this); `flat` drops the blur and the plate. Buttons stack 8 apart
inside `sdk-footer__inner`, max 506 wide.

## Page title — `SdkPageTitle`

Stories `components-sdkpagetitle--*`. An h1 in header1 (24/32 SemiBold) over an optional body subtitle, 8
apart; aligned by the kit's `--texts-align` unless `align` says otherwise.

## Logo block — `SdkLogoBlock`

Stories `components-sdklogoblock--*`. The client's logo plate: medium 48 with radius 12, small and extraSmall below it (the
snapshot's measurements), the image covering it; without a src the empty grey plate.

## Icon block — `SdkIconBlock`

Stories `components-sdkiconblock--*`. The round grey plate: medium 48 (a 24 icon), small 40, extraSmall 32
(a 16 icon — the Welcome frame draws 40: ledger line). States tint the plate: status, attention, error,
success, disabled. `text` instead of `icon` puts a string in the plate — the Welcome frame's step digits
1, 2, 3, set in the kit's caption face (14/20) and centred by the plate's own flex; no story draws it, the
frame does, and the MCP returns the digit as an icon called `Number` that is only ever the 1 (the first
Switch device build cut its own span in by hand).

## Illustration — `SdkIllustration`

Stories `components-sdkillustration--*`. The plate for a picture, sizes `s` (112 high), `l` (184), `d`;
the kit recolours fills and strokes that match the Figma palette (`#20252C`, `#143CFF`, `#008B5E`,
`#D12424`, `#ECEDF2`…) to its theme variables, so an SVG exported from Figma goes in as it is. The first
run cut its illustrations from the frame's 2x export instead; this is the kit's way.

## Input field — `SdkInputField`

Stories `components-sdkfield-sdkinputfield--*`. Label (body, 16/24) over the box, 4 apart; the box 44 high,
radius 12, a 1px `rgba(32,37,44,.3)` frame, placeholder in the kit's placeholder colour; `required` is the
kit's `&nbsp;*` in red after the label (the frames draw a 4px gap: ledger line); `error` turns the frame
red and lists the texts under the box in `sdk-text__danger` (14/20, `#d12424`); `description` sits under
the label; `disabled` and `readonly` grey the box. `left` / `right` are the box's slots; a password field
gets the eye button, which the script flips. Hover and focus: the kit's rules, a human look.

## Select field — `SdkSelectField`

Stories `components-sdkfield-sdkselectfield--*`. The kit's native variant: a customisable `<select>` with
the chosen option in `button.selectedcontent`, a flag (`flags/`) before a country, the chevron from the
kit's `::picker-icon`. The picker itself is the browser's. The closed value is plain markup the kit's
Vue kept current; here `controls.js`'s `script` copies the picked option into it on every `change`
(the Switch device run added a page handler for it before the script did). The fullscreen variant (a sheet of options) is a
kit dialog no story shows open; the first run built its own list by the Figma tokens.

## Textarea field — `SdkTextareaField`

Stories `components-sdkfield-sdktextareafield--*`. The label block around `textarea.SdkTextarea__input`
(a scoped style, `data-s-textarea`): the box's frame and radius, `error` for the red one.

## Phone field — `SdkPhoneField`

Stories `components-sdkfield-sdkphonefield--*`. A fieldset: the legend, then the country trigger (a flag
and the calling code, or "Select a country") beside the number input in one frame. The trigger opens a kit
dialog no story shows, so it is inert here — a ledger line when a task needs it.

## Date field — `SdkDateField`

Stories `components-sdkfield-sdkdatefield--*`. The masked text input with the format as its placeholder
and the calendar button at the right; the button opens the browser's native picker through the kit's
hidden `<input type=date>` (the script calls `showPicker()`).

## Fieldset — `SdkInputFieldset`

Stories `components-sdkinput-fieldset-sdkinputfieldset--*`. A legend (body) over any group, the errors list
under it; `titleRight` is the legend row's right-hand slot. The fieldset is a flex column with an 8px
gap, so `radio({group: true})` rows passed bare sat 8 apart as separate boxes; `fieldset()` wraps them in
the group block (next section) unless the inner already carries it.

## Radio group — `RadioCheckContainerGroup`

Stories `components-radiocheckcontainergroup--*`. The block that joins `radio({group: true})` rows into one
framed list: the story's `div.sdk-base-container__container` (a flex column, no gap) around the rows, so
the kit's `isGroup` rules — the −1px overlap of the frames, the corners on the first and last row only —
apply. `radioGroup(rows)` renders it; `fieldset()` adds it by itself.

## Checkbox — `SdkCheckboxCommon`, `SdkInputCheckbox`

Stories `components-sdkinput-checkbox-*`. A real `<input type=checkbox>` under the kit's 24 box (radius 8, the 1px frame,
the check icon shown by `:checked`): live with no script. `danger` is the red frame.

## Radio — `SdkInputRadio`, `RadioCheckContainer`

Stories `components-sdkinput-radio-*`. The kit's row (44 high, the label at the left, the 24 radio at the
right, a 1px frame, radius 12, padding 12), a real `<input type=radio>` inside: live by `name`. `group` joins rows
into one framed list (first and last corners only); `danger` the red frame; `icon` a 24 icon before the
label. The row's `isActive` class is the kit's checked state on the row (the stories carry it; the dot
itself is the input's `:checked`), and the `script` moves it across the name group on every pick.

## Toggle — `SdkToggle`

Stories `components-sdktoggle--*`. `<button role=switch>` 34×20 (a pill) with the thumb; the kit draws the state
from `data-state`, the script flips it with `aria-checked`.

## Choice list — `SdkChoiceList`

Stories `components-sdkchoicelist--*`. The document-type list: each item a 60-high button (radius 12) with an icon block, a
header3 title over a caption, the chevron at the right; `or` puts the kit's separator between items.

## Link — `SdkLink`

Story `components-sdklink--default`. An inline `<a>`, blue, underlined by default.

## Separator — `SdkSeparator`

Stories `components-sdkseparator--*`. A 1px rule, or two around a body-text label ("or").

## Tag — `SdkTag`

Stories `components-sdktag--*`. The 26 pill (radius 8) in caption text: default (grey), success, info, warning, error,
disabled; `closable` adds the kit's cross (a scoped style, `data-s-tag`).

## Loader — `SdkLoader`

Stories `components-sdkloader--*`. The ring that spins (`icons/loading.svg` with the kit's `spin` class:
`kit.css` turns `.spin[data-s-icon]` once a second, linear, forever) — live as `loader()` renders it, no
page script. **The kit's loaders animate by default and are rule 5's allowed animation; a loader is never
baked into a plate.** The kit stops it under `prefers-reduced-motion`. The Uploading state over the camera's
blurred photo is `loader({type: 'white'})` and the texts in the camera frame's stage, over the blurred
picture — the General flow run (2026-10-14) baked the spinner into the plate, so it stood still. A
headless render on virtual time captures its first frame, and the fixture's references were recorded the
same way, so no `animation: none` is needed for a stable lint.

## Dots loader — `SdkDotsLoader`

Story `components-sdkdotsloader--default`. The three dots a loading button shows; colours white, blue,
success, danger, warning. They animate as rendered: `kit.css` shifts each dot's colour in turn
(`sdk-loader__color-shift`, 0.3 s apart, forever), stopped under `prefers-reduced-motion`. The same rule as
the ring's: never baked into a plate. The camera's loading state is this, white, in the stage —
`cameraFrame({loading: true})`, nothing extra.

## Alert — `SdkAlert`

Stories `components-sdkalert--*`. The message block (radius 16, padding 12, the type's tint): info, warning, danger,
success, neutral; a header3 title over body text, the type's icon at the left (`alert-circle`,
`check-circle`, `shield-check` for neutral), `action` under the text.

## Toast — `SdkToast`

Stories `components-sdktoast--*`. An alert in the toast wrapper with the cross; the kit positions it at the
widget's top (absolute, `--toast-bind1` its slide), the script removes it on the cross.

## Card — `SdkCard`

Stories `components-sdkcard--*`. The block (radius 16, the kit's card tint, no border): a header (icon, header3 title, counter), the
content; `collapsible` renders a `<details>` with the chevron. `status` success / warning tints it.

## Tips — `SdkTips`

Stories `components-sdktips--*`. A header2 title over rows of a 16 icon (danger: `cross-circle`, success:
`check-circle`, interactive) and body text; `right` an icon at the row's end.

## Validation step — `SdkValidationStep`

Stories `components-sdkvalidationstep--*`. A row of a status screen's list: the icon plate (tinted by
status), the title, the tag at the right, a description line.

## Splash screen — `SdkSplashScreen`

Stories `components-sdksplashscreen--*`. A whole container(): the icon in the kit's 72 slot
(`sdk-splash-screen__icon`, 9 × the base space), a header1 title 24 under it, the body message 8 under that,
the buttons in a flat footer. **The kit centres the content in the widget's height by itself**:
`sdk-splash-screen` is the inner column with `justify-content: center`, and the column fills the content
(`flex: 1`) — measured in a 600-high widget, the gap above the art equals the gap under the message, with
and without a footer. No page rule is needed for it.

The frames draw an illustration instead of the icon, and often no button — the General flow's Verified
(`1:7496`, 2026-10-14: a 172×172 picture, two lines of text, no footer). The run built it from `text()`
and its own CSS because this section said "the 48 icon". The call:

```js
W.splashScreen({illustration: svgFile('success-confetti.svg'),   // the frame's export, at its own size, in the icon's place
                title: 'Your profile has been verified', message: 'You may close this page'})   // no buttons: no footer, the room 16
```

`illustration` is html put where the icon goes — the frame's `<svg>` or `<img>` at its own width and
height (the icon's 72 rule does not touch it), or `illustration({svg})` for the kit's grey plate.
`buttons` absent means no footer and the room 16 (`bottom` still overrides); with buttons the room is 72
and the kit's flat footer holds them.

## Tabs — `SdkTabs`

Stories `components-sdktabs--*`. The toggle group: pressed on `aria-pressed` / `data-state`, the script
moves it; `disabled` items stay.

## Modal — `SdkModal`

Stories `components-sdkmodal--*` (opened by the capture's click). The overlay (`sdk-modal`) and the dialog
(`sdk-modal__DialogContentContainer`), both `position: absolute; inset: 0; margin: var(--overlay-margin) auto`
(the margin 8, 0 at ≤ 726; max-width 726), so their host is the nearest positioned ancestor — **the page's
column** (the shell's `.ws-column`, `position: relative`: the top bar, the widget, the Powered-by line), and
they go at the end of the column, after the whitelabel line, never inside container(). The frames draw the host
so: "Modal / Bottom sheet / Desktop" (`Lvs3OA19oILUfjyairhb81` `10469:43436`) and "Modal / Full / Desktop"
(`10469:43533`) tint a wrapper 728×892 from y 4 over the top bar, the widget and the Powered-by line, and the
full modal's window runs from 4 above the widget's top to 4 above the page's bottom. Measured in a 900px column
with the kit's CSS unchanged: the tint and the modal read 8…892 (the kit's 8 against the frame's 4 — a ledger
line); hosted inside container() they read 80…854 — the tint stopped at the widget's edges, the bar stayed
undimmed and the dialog sat 8 inside the frame with white gaps above and below (the 1440 prototypes of eval
runs 16 and 17, 2026-10-14). Lint renders the fixture's column at 1100 and at 375 and reads the tint 8 and 0
in from its top and bottom, over the bar and the whitelabel line. A page of several screens hosts its dialogs
once, at the column's end; a screen wrapper is not the host. A header1 title and a body subtitle, the cross (a plain icon-only button),
the body, a footer of buttons. The script opens it from any `data-sdk-open="#id"` and closes it on the cross,
the overlay, Esc or a `data-sdk-close` inside. The dialog slides up for 0.4 s (`sdk-modal__slide-up`) and
the overlay fades: a headless check of the open state runs with `statecheck.sh --no-anim` or `--device`,
or it reads the dialog where the animation starts, at the widget's bottom.

**The modal is the UI kit's "Modal / Full", at every width.** The WebSDK UI kit's Figma
(`Gh2QlRTetoSQdlK9G1nDq4`, page "Modal", `622:25782`) has two dialog shapes, each drawn at both widths:
"Modal / Full / Desktop" (718×685, symbol `11111:16771`) and "Modal / Full / Mobile" (375×669) fill the
widget; "Modal / Bottom sheet / Desktop" (718×464, symbol `11111:713`, its example content the consent
text) and "Modal / Bottom sheet / Mobile" (375×669, `12038:63639`) are sized by their content and rise from
the widget's bottom. `SdkModal` is "Modal / Full": `height: calc(100% − 16px)`, min 440, at any width; the
one `width <= 726px` rule only drops its 8 inset and its bottom corners (a full-bleed panel), it does not
change the shape. **Map by the frame's instance name, never by width**: an instance "Modal / Full / *" is
`modal()` at 375 and at 1440, "Modal / Bottom sheet / *" is `bottomSheet()` at 375 and at 1440. A desktop
width with no frame keeps the component the phone frame names. The General flow run (2026-10-14) did the
opposite — the consent's "Bottom sheet" instance as `bottomSheet()` at ≤ 1023 and `modal()` above, switched
by its own `matchMedia` — and its desktop consent filled the widget where the kit draws a sheet.

## Bottom sheet — `SdkBottomSheet`

Stories `components-sdkbottomsheet--*` (opened by the capture's click). The UI kit's "Modal / Bottom
sheet / Desktop | Mobile" — at every width, not only on a phone: the same two parts as the modal, sized by
its content (`max-height: 100vh − 56`) and sliding from the page's bottom; above 726 it sits 8 in with
every corner rounded (the Figma Desktop variant), at 726 and under full-bleed with the top corners
rounded; a page title in its header. The consent sheet is this at 375 and at 1440 alike; so is the first
run's address-search sheet. No story shows its
footer slot (`default`, `title`, `title-and-subtitle` only): `bottomSheet({footer})` writes the module's
own `sdk-bottom-sheet__footer*` classes, named and ruled as the modal's footer, whose story shows them —
lint accepts the sheet's class on its modal twin. Its host is the page's column, as the modal's (§ Modal):
at the column's end, after the whitelabel line, never inside container() — so the frame's sheet over the whole
page with the top bar dimmed (the General flow's consent, `1:7603`; the Switch device frame `10469:43436`,
whose sheet wrapper is 718 wide and ends 4 above the page's bottom) is what renders. The sheet's bottom sits 8
above the column's bottom (892 in a 900px column; 0 in at ≤ 726) where the frame draws 4: a ledger line, not a
page rule. Inside container() it rose from the widget's bottom with the bar undimmed (runs 16 and 17).

## Camera frame — not a kit story, built from the Organisms component

The kit has no camera stage: `SdkCameraPopup` is only the wizard's message plate (`sdk-camera-popup`: a
blurred dark plate with white body text, for a hint over the picture), and the `camera-select*` classes
(the camera chooser) arrived without a story. The frames' camera is the Organisms library's component
"POI camera Mobile" (a "POI camera Desktop" set too, componentSetKey
`228282dceda135813ddbe0a29bc0447d6f13b0bc`, updated 2026-09-18), read on 2026-10-14 from the General flow's
frame (`CTtG8WQa2doFeSYMWaAQ9S`, `I1:7522;14201:45616;1:7521`). Its design context is responsive
auto-layout, and `cameraFrame(spec)` writes it with the kit's own camera variables (all in `kit.css`):

| part | the component | here |
|---|---|---|
| root | `size-full`, `--components-camera-camera-background` (#20252c), padding `--components-camera-spacing` (8), the widget's radius (32) | `.w-camera`: fills the container at every width |
| stage "camera" | flex 1 0 0, width 100%, `rgba(255,255,255,.1)`, radius `--components-camera-border-radius` (24), padding 16/24, the dots loader centred | `.w-camera__stage`; `loading` puts `dotsLoader({color: 'white'})` in it, animated by the kit as rendered; `inner` is the picture — an `<img>` fills it with `object-fit: cover` — and anything over it (the Uploading state's `loader({type: 'white'})` and texts) |
| Message | padding 12 top, 8 bottom, 8 sides, gap 4; the caption header2 (16/24) in white, centred | `.w-camera__message`, `caption` |
| "Toolbar / Camera Bottom Bar / Desktop" | padding 8 vertical; a centred row, gap 48 | `.w-camera__bar` |
| gallery, flip | 48: the 24 icon with 12 padding, `--components-button-camera-additional-white-background-*`, radius 32 | `image.svg`, `rotate.svg` from `icons/`; `gallery` / `flip` `{id, disabled, label}` or `false` |
| shutter | 56: a 3px border `--components-button-camera-action-photo-border-*`, radius 32, a 46 disc `--components-button-camera-action-photo-background-*` | `shutter {id, disabled, label}` |
| the "Uploading" tint (the frame's own rect over the camera slot, `I1:7545;14201:45616;1:7541`, not a kit part) | `rgba(0,0,0,.5)` with a 16px backdrop blur over the stage, the caption and the bar; a column 16 apart: "Icon / Extra Large / Loading" (40), a header1 title, a body line, white, centred | `overlay: {loader: true, title: 'Uploading', text: 'Please wait a moment'}` — `loader({type: 'white', size: 'extra-large'})`, live; the blur is live too, so the captured photo stays the sharp plate and the frame's blurred export is not needed. The kit's `--components-camera-tint-background` is a different, lighter tint (the wizard's), so the frame's values are written here |

```js
W.header({back: 'back-cam', step: [1, 3], lang: 'En'}) + W.container(W.cameraFrame({
  caption: 'ID card front', loading: state === 'a',
  inner: state === 'a' ? '' : `<img alt="" src="${uri(P('cam-b-picture.webp'), 'image/webp')}">`,   // the stage's picture cut from the 2x export
  shutter: {id: 'cam-shutter'}}), {id: 'sdk-base-container-cam'})
```

**Only the live picture is a plate**: the feed, the document outline, the captured photo, cut from the
frame's 2x export at the stage's rectangle; the stage, the caption and the bar are this markup and fill
the widget at 375 and at 1440. The General flow run baked the whole widget box (357×560) and centred it
in the 718 desktop widget, the bar's buttons spanning a phone's width there. A system dialog over the
camera (the iOS permission) stays a plate over it. The classes are the prototype's own (`w-camera*`, not
the kit's), and lint renders it at 720 and at 375.

## Sumsub ID block — not a kit story, built from the Figma Welcome block

The kit has no story for the "Get verified faster with Sumsub ID" block, and three WebSDK runs (13, 14, 17)
and one hand build built it by hand from the same numbers. Its source is the UI kit's Figma component
"Welcome block" (`Gh2QlRTetoSQdlK9G1nDq4`; the Widget `14181:148196` holds an instance at
`I14181:148196;10189:6192;14181:150009;2771:67133`, read on 2026-10-14); the email variant is the run-14/17
frames' (`Lvs3OA19oILUfjyairhb81`, Welcome block `9782:42231`, 138 high). `sumsubIdBlock(spec)` writes it from
the kit's own parts — `toggle()`, `text({variant: 'header3'})`, the caption as `sdk-text__caption`, `link()`,
`inputField()` — in the prototype's classes `w-sumsub-id*`:

| part | the component | here |
|---|---|---|
| root, 506×80 in the 506 column | a 1px inside stroke `--semantic-border-primary-subtlest-normal` (rgba(32,37,44,.1)), radius `--components-sumsub-id-intrusive-block-border-radius` (24), padding 16, a column gap 12; fill `linear-gradient(108deg, rgba(236,237,242,.2), rgba(236,237,242,.6))` over white | `.w-sumsub-id`: width 100%, `padding: 15px` inside the 1px border — Figma's stroke is inside, so the content is 16 from the outer edge and the block 80 high (padding 16 plus the border made 82, the hand build's) |
| "top wrapper" | a row, gap 12: "*Toggle* / Item" (34×24, checked, no label) and "content wrapper" (46 in, 428 wide) | `.w-sumsub-id__top`; `toggle({checked})`, flex none, 2 down so the kit's 20 pill centres on the 24 title line |
| "title wrapper" | a column, gap 4: "row wrapper" (gap 4: "icon wrapper" 22×24 with 2 padding right, top and bottom around the 20 "Icon / Small / Sumsub ID"; the header3 title) and the caption line (14/20) with "Learn more" | `.w-sumsub-id__text`, `__title`, `__icon` (the green `icons/sumsub-id-green.svg`, 20), `text({variant: 'header3'})`; `__sub` is `sdk-text__caption` with `link({underline: false})` |
| "input wrapper" (hidden in the component; shown in the run-14/17 frames) | under the row, 12 below, indented to the text column (46), 46 high | `email: {placeholder, id, value}` → `.w-sumsub-id__email` (padding-left 46) around `inputField()` |

```js
W.sumsubIdBlock({toggleId: 'sid', linkId: 'sid-more'})                                   // the Widget's collapsed block, 80 high
W.sumsubIdBlock({email: {id: 'sid-email', placeholder: 'Enter your email to continue'}})   // the run-14/17 frames' variant
```

**Ledger lines** — the toggle: the component's "*Toggle* / Item" is 34×24, the kit's `SdkToggle` 34×20 (the
pill is drawn the same; the 2px above and below are the component's frame, so the kit's toggle sits 2 down).
The email variant: the frames' input wrapper is 46 high, the kit's input 44, so the block is 136 against the
frames' 138. Measured at 720 by lint (the fixture renders the email variant once, first in the form):
width = the column's, padding 16 from the outer edge, radius 24, the toggle 34×20 at the row's start, the
icon 20, the input 46 from the content edge. At 1440 in the shell the collapsed block is 506×80, 106 from the
widget's left — the Widget frame's box.

## Dropdown menu — `SdkDropdownMenu`

Stories `components-sdkdropdownmenu--*` (opened by the capture's click). The menu (a rounded plate with a shadow): a
caption label and `role=menuitem` rows, the selected one tinted, a danger one red. The kit positions it
under its trigger with a popper; the page positions it here, and the script opens it from
`data-sdk-open` and closes it on a click outside.

<!-- sbkit:begin — written by scripts/sbkit.cjs on 2026-10-08; edit outside the markers -->
## Snapshot

| | |
|---|---|
| taken | 2026-10-08 |
| source | `storybook-websdk-uikit.dev.euc1.sumsub.net`, the stories in `stories.json`, read live over the DevTools protocol |
| rules | 650 in `kit.css` |
| stories | 196 read, 0 unread |
| icons, flags | 104 icons in `icons/` (SdkIcon/all-icons), 230 flags in `flags/` (SdkFlag/grid) |
| theme | `body.sns-uikit.sns-theme-light` carries the variables |
| fonts | Inter:wght@400;500;600;700; Manrope:200,300,400,500,600,700,800|Dosis:600 (Google Fonts, linked by the page) |

## Modules — the hash table

One CSS module per row; the hash is the build's and changes with it, the stable names do not.

| component | hash | settled by | names |
|---|---|---|---|
| SdkText | `1qon0` | owns | `sdk-text`, `sdk-text__body`, `sdk-text__header3`, `sdk-text__caption`, `sdk-text__header1`, `sdk-text__header2`, … |
| SdkLoader | `1auf0` | owns | `sdk-loader`, `sdk-loader__loaderColorWhite`, `sdk-loader__color-shift`, `sdk-loader__loaderColorSuccess`, `sdk-loader__loaderColorBlue`, `sdk-loader__loaderColorDanger`, … |
| SdkInput | `1p5l1` | owns | `sdk-input__inputContainer`, `sdk-input`, `sdk-input__isEmpty`, `sdk-input__error`, `sdk-input__right`, `sdk-input__left`, … |
| SdkInputLabel | `1l4xt` | owns | `sdk-input-label`, `sdk-input-label__itemText`, `sdk-input-label__errors` |
| SdkSpanRequired | `1hkln` | owns | `sdk-span-required` |
| SdkInputFieldset | `10x3d` | owns | `sdk-input-fieldset`, `sdk-input-fieldset__itemText`, `sdk-input-fieldset__errors`, `sdk-input-fieldset__error` |
| SdkButtonInput | `1ql8p` | owns | `sdk-button-input`, `sdk-button-input__button`, `sdk-button-input__sizeM`, `sdk-button-input__left`, `sdk-button-input__placeholder`, `sdk-button-input__right`, … |
| SdkButton | `9pfi4` | owns | `sdk-button`, `sdk-button__primary`, `sdk-button__default`, `sdk-button__iconOnly`, `sdk-button__leftIcon`, `sdk-button__secondary`, … |
| SdkDotsLoader | `eggox` | owns | `sdk-dots-loader`, `sdk-dots-loader__dotsLoaderLink` |
| SdkHeader | `1oywt` | owns | `sdk-header`, `sdk-header__left`, `sdk-header__back-button`, `sdk-header__progress`, `sdk-header__right`, `sdk-header__progress-item`, … |
| SdkLangSelector | `1334w` | owns | `sdk-lang-selector`, `sdk-lang-selector__buttonContainer`, `sdk-lang-selector__srOnly` |
| SdkStepsPopup | `1nw3q` | owns | `sdk-steps-popup__container`, `sdk-steps-popup`, `sdk-steps-popup__step-label`, `sdk-steps-popup__active` |
| SdkContent | `cg1gi` | owns | `sdk-content`, `sdk-content__SdkContentInner`, `sdk-content__required-mark-footnote`, `sdk-content__required-mark`, `sdk-content__withMinHeight`, `sdk-content__hide-scrollbar`, … |
| SdkPageTitle | `lbpm3` | owns | `sdk-page-title`, `sdk-page-title__pageSubtitle`, `sdk-page-title__left`, `sdk-page-title__center`, `sdk-page-title__right` |
| SdkFooter | `qlbgu` | owns | `sdk-footer`, `sdk-footer__inner`, `sdk-footer__flat` |
| SdkBaseContainer | `1t9hi` | owns | `sdk-base-container` |
| SdkLogo | `bdzoj` | owns | `sdk-logo`, `sdk-logo__light` |
| SdkLogoBlock | `1wawo` | owns | `sdk-logo-block`, `sdk-logo-block__sizeMedium`, `sdk-logo-block__image`, `sdk-logo-block__sizeSmall`, `sdk-logo-block__sizeExtraSmall` |
| SdkIconBlock | `1tos0` | owns | `sdk-icon-block`, `sdk-icon-block__sizeMedium`, `sdk-icon-block__stateDefault`, `sdk-icon-block__stateStatus`, `sdk-icon-block__stateAttention`, `sdk-icon-block__stateError`, … |
| SdkPhoneField | `52x8u` | owns | `sdk-phone-field`, `sdk-phone-field__select`, `sdk-phone-field__placeholder`, `sdk-phone-field__input`, `sdk-phone-field__phoneInputContainerSelected`, `sdk-phone-field__callingCode`, … |
| SdkDateField | `wcc6t` | owns | `sdk-date-field__input`, `sdk-date-field__picker`, `sdk-date-field` |
| SdkInputRadio | `103b7` | only | `sdk-input-radio__label`, `sdk-input-radio__icon` |
| SdkBaseContainer | `13z5o` | owns | `sdk-base-container__container` |
| SdkToggle | `141w8` | owns | `sdk-toggle`, `sdk-toggle__thumb` |
| SdkChoiceList | `1200i` | owns | `sdk-choice-list`, `sdk-choice-list__choice-item-wrapper`, `sdk-choice-list__choice-item`, `sdk-choice-list__info-block`, `sdk-choice-list__chevron-icon-wrapper` |
| SdkSeparator | `kxauv` | owns | `sdk-separator` |
| SdkSeparator | `1gozd` | owns | `sdk-separator__horizontal` |
| SdkLink | `1m3xc` | owns | `sdk-link`, `sdk-link__underline` |
| SdkAlert | `gzf4w` | owns | `sdk-alert`, `sdk-alert__typeWarning`, `sdk-alert__alertIcon`, `sdk-alert__content`, `sdk-alert__textBlock`, `sdk-alert__typeDanger`, … |
| SdkToast | `y3ds3` | owns | `sdk-toast`, `sdk-toast__closeButtonContainer`, `sdk-toast__closeButton`, `sdk-toast__link`, `sdk-toast__move-from-top`, `sdk-toast__closing` |
| SdkCard | `1mcqg` | owns | `sdk-card`, `sdk-card__header`, `sdk-card__headerText`, `sdk-card__main`, `sdk-card__content`, `sdk-card__icon`, … |
| SdkTips | `2vg0s` | owns | `sdk-tips__header`, `sdk-tips`, `sdk-tips__row`, `sdk-tips__icon`, `sdk-tips__content`, `sdk-tips__rightIcon`, … |
| SdkTabs | `bvi8i` | owns | `sdk-tabs`, `sdk-tabs__ToggleGroupItem`, `sdk-tabs__ToggleGroupItemText`, `sdk-tabs__disabled` |
| SdkValidationStep | `19jl5` | owns | `sdk-validation-step`, `sdk-validation-step__iconContainer`, `sdk-validation-step__iconBlock`, `sdk-validation-step__content`, `sdk-validation-step__summary`, `sdk-validation-step__header`, … |
| SdkSplashScreen | `muzpe` | owns | `sdk-splash-screen`, `sdk-splash-screen__icon`, `sdk-splash-screen__header`, `sdk-splash-screen__message`, `sdk-splash-screen__footerButtons`, `sdk-splash-screen__tips` |
| SdkModal | `xofhr` | owns | `sdk-modal`, `sdk-modal__DialogContentContainer`, `sdk-modal__noHeader`, `sdk-modal__DialogContent`, `sdk-modal__DialogHeader`, `sdk-modal__HeaderRow`, … |
| SdkBottomSheet | `mvxie` | owns | `sdk-bottom-sheet`, `sdk-bottom-sheet__DialogContentContainer`, `sdk-bottom-sheet__noHeader`, `sdk-bottom-sheet__DialogContent`, `sdk-bottom-sheet__DialogBody`, `sdk-bottom-sheet__DialogBodyContent`, … |
| SdkTwoFaCodeInput | `1gu9n` | owns | `sdk-two-fa-code-input`, `sdk-two-fa-code-input__PinInputCell`, `sdk-two-fa-code-input__PinInputInput`, `sdk-two-fa-code-input__invalid`, `sdk-two-fa-code-input__disabled`, `sdk-two-fa-code-input__active`, … |
| SdkDropdownMenu | `16e1t` | owns | `sdk-dropdown-menu`, `sdk-dropdown-menu__DropdownMenuLabel`, `sdk-dropdown-menu__DropdownMenuItem`, `sdk-dropdown-menu__label`, `sdk-dropdown-menu__DropdownMenuItemDanger`, `sdk-dropdown-menu__DropdownMenuItemSelected`, … |
| SdkAvatar | `14fg3` | owns | `sdk-avatar`, `sdk-avatar__image`, `sdk-avatar__char` |
| SdkPanel | `moic9` | owns | `sdk-panel`, `sdk-panel__delimiter` |
| SdkCameraPopup | `1goo3` | owns | `sdk-camera-popup` |
| SdkFlag | `1klfh` | owns | `sdk-flag` |
| SdkPrompt | `1bg5z` | owns | `sdk-prompt` |
| SdkSelect | `ybs3f` | owns | `sdk-select__optionContent`, `sdk-select__optionText`, `sdk-select__text`, `sdk-select`, `sdk-select__noResults` |
| Kit | `1kicl` | css-only | `sdk-kit__modal-content`, `sdk-kit__full-modal-loader-container`, `sdk-kit__full-image` |

## Measured at capture — the root element of each story

| component | story | size | font | colour on background | radius |
|---|---|---|---|---|---|
| SdkText | default | 920×24 | Manrope 16px/24px 500 | rgb(32, 37, 44) on rgba(0, 0, 0, 0) | 0px |
| SdkText | all-variants | 920×335 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkIcon | default | 24×24 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgba(0, 0, 0, 0) | 0px |
| SdkIcon | all-icons | 920×2710 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkIllustration | default | 920×112 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 16px |
| SdkIllustration | small | 920×112 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 16px |
| SdkIllustration | large | 920×184 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 28px |
| SdkIllustration | no-background | 920×152 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(240, 240, 240) | 0px |
| SdkLoader | default | 26.39×26.39 | Manrope 16px/normal 400 | rgb(20, 60, 255) on rgba(0, 0, 0, 0) | 0px |
| SdkDotsLoader | default | 120×88 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkInput | default | 300×152 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputLabel | default | 920×76 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSpanRequired | default | 920×24 | Manrope 16px/24px 700 | rgb(32, 37, 44) on rgba(0, 0, 0, 0) | 0px |
| SdkInputFieldset | default | 920×90 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputFieldset | required | 920×90 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputFieldset | with-errors | 920×142 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputFieldset | with-description | 920×114 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputFieldset | with-title-right | 920×110 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputFieldset | complete-example | 920×162 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkButtonInput | default | 920×44 | Manrope 16px/24px 500 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkButtonInput | value | 920×44 | Manrope 16px/24px 500 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkButtonInput | icons | 920×44 | Manrope 16px/24px 500 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkButtonInput | disabled | 920×44 | Manrope 16px/24px 500 | rgb(0, 0, 0) on rgba(32, 37, 44, 0.05) | 12px |
| SdkButtonInput | invalid | 920×44 | Manrope 16px/24px 500 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkButtonAsync | loading | 920×329.63 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkButtonAsync | success | 920×106 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkButtonAsync | success-with-icon | 920×106 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkButton | primary | 83.98×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkButton | secondary | 85.98×48 | Manrope 16px/24px 600 | rgb(32, 37, 44) on rgb(255, 255, 255) | 32px |
| SdkButton | small | 920×80 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkButton | plain | 51.98×48 | Manrope 16px/24px 600 | rgb(32, 37, 44) on rgba(0, 0, 0, 0) | 32px |
| SdkButton | field | 51.98×40 | Manrope 16px/24px 600 | rgb(32, 37, 44) on rgba(0, 0, 0, 0) | 32px |
| SdkButton | link | 51.08×22 | Manrope 16px/24px 500 | rgb(20, 60, 255) on rgba(0, 0, 0, 0) | 32px |
| SdkButton | link-underlined | 920×24 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkButton | topbar | 920×84 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(198, 234, 79) | 0px |
| SdkButton | icon-only | 48×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkButton | with-left-icon | 107.98×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkButton | all-variants | 920×759.19 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkHeader | default | 718×68 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkHeader | with-back-button | 718×68 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkHeader | with-lang-selector | 718×68 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkHeader | empty | 718×68 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkLangSelector | default | 920×44 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkStepsPopup | default | 920×212 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkStepsPopup | first-step-active | 920×212 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkStepsPopup | last-step-active | 920×212 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkStepsPopup | all-done | 920×212 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkStepsPopup | single-step | 920×212 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkContent | default | 920×74 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkContent | document-definition | 920×142 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkFooter | default | 1000×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(255, 255, 255, 0.2) | 32px 32px 0px 0px |
| SdkFooter | with-custom-content | 1000×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(255, 255, 255, 0.2) | 32px 32px 0px 0px |
| SdkFooter | with-backdrop-blur | 920×560 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkBaseContainer | default | 718×200 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 32px |
| SdkBaseContainer | full-layout | 920×198 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkLogo | default | 138×22 | Manrope 16px/normal 400 | rgba(32, 37, 44, 0.6) on rgba(0, 0, 0, 0) | 0px |
| SdkLogoBlock | default | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkLogoBlock | empty | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 12px |
| SdkLogoBlock | small | 40×40 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 12px |
| SdkLogoBlock | extra-small | 32×32 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 8px |
| SdkIconBlock | default | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 12px |
| SdkIconBlock | status | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 12px |
| SdkIconBlock | attention | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(191, 131, 0, 0.1) | 12px |
| SdkIconBlock | error | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(209, 36, 36, 0.1) | 12px |
| SdkIconBlock | success | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 139, 94, 0.1) | 12px |
| SdkIconBlock | disabled | 48×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(236, 237, 242, 0.6) | 12px |
| SdkIconBlock | small | 40×40 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 12px |
| SdkIconBlock | extra-small | 32×32 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 8px |
| SdkPageTitle | default | 920×64 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkPageTitle | align-left | 920×64 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkPageTitle | align-center | 920×64 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkPageTitle | subtitle-with-line-breaks | 920×136 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | default | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | with-value | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | required | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | disabled | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | readonly | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | with-error | 920×136 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | multiple-errors | 920×160 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | with-description | 920×102 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | password-field | 920×76 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | with-left-slot | 920×76 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputField | with-right-slot | 920×76 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | default | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | with-value | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | required | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | disabled | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | with-error | 920×136 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | with-description | 920×102 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | native-variant | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | with-flags | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | grouped-options | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelectField | fullscreen-variant | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTextareaField | default | 920×166 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTextareaField | with-value | 920×166 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTextareaField | required | 920×166 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTextareaField | with-error | 920×194 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkPhoneField | default | 360×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkPhoneField | with-value | 360×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkPhoneField | with-error | 360×136 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkDateField | default | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkDateField | with-value | 920×108 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkDateField | with-error | 920×136 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelect | default | 920×220 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelect | grouped-options | 920×220 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelect | with-flags | 920×220 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSelect | items-with-description | 920×220 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkCheckboxCommon | default | 24×24 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkCheckboxCommon | all-variants | 920×64 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputCheckbox | default | 920×24 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkRadioCommon | default | 24×24 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkInputRadio | default | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| SdkInputRadio | active | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| SdkInputRadio | disabled | 920×44 | Manrope 16px/normal 400 | rgba(32, 37, 44, 0.6) on rgba(32, 37, 44, 0.05) | 12px |
| SdkInputRadio | with-left-icon | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| SdkInputRadio | with-left-icon-active | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| SdkInputRadio | long-label | 920×58 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| SdkInputRadio | required | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| RadioCheckContainer | default | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| RadioCheckContainer | checked | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| RadioCheckContainer | disabled | 920×44 | Manrope 16px/normal 400 | rgba(32, 37, 44, 0.6) on rgba(32, 37, 44, 0.05) | 12px |
| RadioCheckContainer | error | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| RadioCheckContainer | with-icon | 920×44 | Manrope 16px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| RadioCheckContainer | as-button | 920×44 | Arial 13.3333px/normal 400 | rgb(32, 37, 44) on rgb(255, 255, 255) | 12px |
| RadioCheckContainerGroup | default | 920×189 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| RadioCheckContainerGroup | with-checked | 920×142 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| RadioCheckContainerGroup | with-checkbox | 920×142 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkRadioButtonExpanded | default | 920×198 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 12px |
| SdkRadioButtonExpanded | active | 920×198 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 12px |
| SdkRadioButtonExpanded | long-label-with-icon | 540×218 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkToggle | default | 34×20 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(32, 37, 44, 0.6) | 9999px |
| SdkToggle | disabled | 34×20 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(32, 37, 44, 0.2) | 9999px |
| SdkChoiceList | default | 920×166 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 16px |
| SdkChoiceList | single-option | 920×74 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 16px |
| SdkChoiceList | long-labels | 920×166 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 16px |
| SdkFlag | default | 24×18 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkFlag | grid | 920×2448 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkLink | default | 61.78×22 | Manrope 16px/normal 400 | rgb(20, 60, 255) on rgba(0, 0, 0, 0) | 5px |
| SdkLink | in-text | 920×22 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkLink | standalone | 61.78×22 | Manrope 16px/normal 400 | rgb(20, 60, 255) on rgba(0, 0, 0, 0) | 5px |
| SdkSeparator | default | 920×1 | Manrope 16px/normal 400 | rgb(128, 128, 128) on rgba(32, 37, 44, 0.1) | 0px |
| SdkSeparator | or | 920×24 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTag | default | 65.13×26 | Manrope 14px/20px 500 | rgb(32, 37, 44) on rgba(32, 37, 44, 0.1) | 8px |
| SdkTag | success | 72.31×26 | Manrope 14px/20px 500 | rgb(7, 79, 61) on rgba(0, 139, 94, 0.1) | 8px |
| SdkTag | info | 43.16×26 | Manrope 14px/20px 500 | rgb(0, 35, 105) on rgba(20, 60, 255, 0.1) | 8px |
| SdkTag | warning | 70.41×26 | Manrope 14px/20px 500 | rgb(191, 131, 0) on rgba(191, 131, 0, 0.1) | 8px |
| SdkTag | state-error | 50.23×26 | Manrope 14px/20px 500 | rgb(127, 8, 8) on rgba(209, 36, 36, 0.1) | 8px |
| SdkTag | disabled | 73.77×26 | Manrope 14px/20px 500 | rgba(32, 37, 44, 0.6) on rgba(32, 37, 44, 0.05) | 8px |
| SdkTag | closable | 67.16×26 | Manrope 14px/20px 500 | rgb(0, 35, 105) on rgba(20, 60, 255, 0.1) | 8px |
| SdkAlert | warning-with-title | 920×78 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(191, 131, 0, 0.1) | 16px |
| SdkAlert | error-with-title | 920×78 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(209, 36, 36, 0.1) | 16px |
| SdkAlert | alert-info | 920×50 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(20, 60, 255, 0.1) | 16px |
| SdkAlert | success | 920×50 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 139, 94, 0.1) | 16px |
| SdkAlert | alert-neutral | 920×50 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(236, 237, 242, 0.2) | 16px |
| SdkAlert | without-icon | 920×78 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(20, 60, 255, 0.1) | 16px |
| SdkAlert | with-footer-action | 920×106 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(209, 36, 36, 0.1) | 16px |
| SdkToast | default | 920×118 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkToast | success | 920×118 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkToast | state-error | 920×118 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkToast | warning | 920×118 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkToast | with-icon | 920×90 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkToast | with-link | 920×144 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkCard | default | 506×98 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 16px |
| SdkCard | with-left-icon-and-counter | 506×98 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 16px |
| SdkCard | collapsed | 506×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 16px |
| SdkCard | accordion | 506×98 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(236, 237, 242) | 16px |
| SdkTips | default | 920×590 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTips | text | 920×144 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTips | without-title | 920×562 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTabs | default | 920×72 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(13, 17, 23) | 0px |
| SdkTabs | disabled | 920×72 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(13, 17, 23) | 0px |
| SdkValidationStep | default | 920×46 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkValidationStep | accepted | 920×50 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkValidationStep | rejected | 920×50 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkValidationStep | required | 920×50 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkSplashScreen | default | 718×202 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 32px |
| SdkSplashScreen | with-button | 718×258 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgb(255, 255, 255) | 32px |
| SdkModal | default | 122.36×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkModal | default-with-footer | 122.36×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkModal | big-height | 122.36×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkBottomSheet | default | 920×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkBottomSheet | title | 920×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkBottomSheet | title-and-subtitle | 920×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTwoFaCodeInput | default | 920×44 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTwoFaCodeInput | invalid | 920×44 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkTwoFaCodeInput | disabled | 920×44 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkUploadButton | default | 85.98×48 | Manrope 16px/24px 600 | rgb(255, 255, 255) on rgb(32, 37, 44) | 32px |
| SdkDropdownMenu | default | 920×148 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkDropdownMenu | with-selected-item | 920×148 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkAvatar | with-image | 32×32 | Arial 13.3333px/normal 400 | rgb(0, 0, 0) on rgba(20, 60, 255, 0.1) | 50% |
| SdkAvatar | with-character | 32×32 | Arial 13.3333px/normal 400 | rgb(0, 0, 0) on rgba(20, 60, 255, 0.1) | 50% |
| SdkAvatar | default | 32×32 | Arial 13.3333px/normal 400 | rgb(0, 0, 0) on rgba(20, 60, 255, 0.1) | 50% |
| SdkPanel | default | 920×93 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(32, 37, 44, 0.05) | 8px |
| SdkPrompt | default | 920×48 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkCameraPopup | default | 920×140 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
| SdkCameraPopup | with-icon | 920×178 | Manrope 16px/normal 400 | rgb(0, 0, 0) on rgba(0, 0, 0, 0) | 0px |
<!-- sbkit:end -->
