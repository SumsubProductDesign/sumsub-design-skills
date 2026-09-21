# Design-system controls — version record

Form controls a prototype makes live, read from the product's own Storybook so that states the mockup
does not draw are **read, not invented**. Rendered by `controls.js`. **Update this file whenever a value
changes**, and re-run `scripts/lint.sh`, which renders each control and compares it with the table below.

| | |
|---|---|
| taken | 2026-09-18 |
| source | `storybook.sumsub.net`, computed styles and stylesheet rules of the live stories, read in the browser pane |
| rule | the component is the default; a mockup that disagrees is a ledger line, or a question when the design changes the control on purpose — the same three outcomes as the shell (`references/shell.md`) |

## Input — `SnsInput`

Stories: `forms-snsinput--input-sizes`, `--input-states`. Product classes `.sns-input-box.size-*.state-*`,
CSS variables `--components-field-*`.

| size | height | padding | icon gap |
|---|---|---|---|
| small | 24 | 0 / 8 | 4 |
| medium | 32 | 4 / 12 | 8 |
| large (default) | 40 | 8 / 12 | 8 |

Box: radius 8, 1px border as an **inset box-shadow** (the product does the same, so a border never insets
the field). Text 14/24 Regular `#1e2939`, placeholder `#6a7282`, icon `#1e2939`. Label above the box
(`title:`): 14/24 **Medium** `#030712`, 4px clear of it. Hint under the box: 14/24 `#4a5565`, 2px below.
`readonly` drops the padding, the background and the border.

| state | border | background | text |
|---|---|---|---|
| normal | `#d1d5dc` | `#fff` | `#1e2939` |
| hover | `#b4bac4` | `#f9fafb` | `#1e2939` |
| focus | `#d1d5dc` + 1px white gap + 3px ring `#60a5fa` | `#fff` | `#1e2939` |
| disabled | `#d1d5dc` | `#f3f4f6` | `#4a5565` |
| loading | `#d1d5dc` | `#f3f4f6` | `#1e2939` |
| error | `#dc2626` | `#fef2f2` | `#1e2939` |
| error + hover | `#b91c1c` | `#fee2e2` | |
| warning | `#d27a0a` | `#fffbeb` | `#1e2939` |
| warning + hover | `#a95a0a` | `#fef3c7` | |

Hover and focus cannot be triggered from automation: lint checks the rules exist with these colours, and
**each needs one human look** (Step 7).

### Secret field — *Secret / Input Field*

Read from the Dev space frames on 2026-09-19 (`5358:34689`, `5323:40056`). The design system calls it a
**proposal**, not a shipped component: the description on the Figma node says the ordinary field has one
button slot and one icon slot, so *show* and *copy* do not both fit, and this variant adds a second
button. There is no Storybook story, so `dscheck.js` cannot watch it.

`input({secret: true})` renders it: the ordinary box at its size, a real `<input>` carrying sixteen
bullets, then the caller's buttons inside the box at the right. Because it stays a real input, a
respondent can click into it and select the value — the thing a hand-built `<span>` version silently
takes away. `buttons:` also works on an ordinary field. Each button is 24 square, radius 8, `#f3f4f6` on
hover and `#e5e7eb` while pressed.

The label takes `optional: true` for the 12/16 `(optional)` and `titleIcon:` for the question mark, and
`error:` with `errorIcon:` renders the design system's red caption (14/24 `#dc2626`, the glyph 4px down)
in place of the hint.

Clicking anywhere in a field's box now focuses its input, which the markup cannot do on its own: the box
is a `<span>`, not a `<label>`. That lives in `script`.

Not covered yet: the clear and spinner glyphs (`loading` already gives the grey fill and the border, only
the spinner is missing, and rule 5 would freeze it anyway), `SnsInputNumber`, `SnsInputTag`, and the
pre-select variant that reuses `.sns-input-box`.

### Where mockups disagree, measured 2026-09-18

| mockup | the mockup's field | the component |
|---|---|---|
| AML screening `3130:238097` (*Search profile ID*) | border **`#c4cad4`** | border `#d1d5dc` |

**Corrected 2026-09-20.** This row used to claim the mockup's radius was 4. It is not: the node's own
token is `border-radius/md = 8px`, the component's value, and only the border colour is the older one.
The 4 came from reading a rendered corner instead of the token — an antialiased 8px corner at 1x looks
like a small one. Run 4 of the eval caught it. **Read a radius from the design context, never from a
render**; a corner is the one measurement a screenshot cannot settle.

Everything else in that block matched to the pixel: height 32, padding 4/12,
white fill, the label's ink box, the field's left and top edges. The old border
belongs to the same pre-redesign generation as the blue selected tab
and the rail-plus-panel navigation, so the component stays the default and the
difference is a ledger line. Ask only when the design changes the control on
purpose.

**An empty static field has no height of its own.** With `live: false` and no
value, the text span collapsed and the box rendered 8px tall instead of 32;
`min-height: 24px` on the field fixes it. A live `<input>` hides this bug, so a
baked or read-only state is where it shows up.

## Button — `SnsButton`

Stories: `design-system-snsbutton--primary` and the per-type stories. Product classes
`.sns-button.type-*.status-*.state-*.size-*`, CSS variables `--components-button-*`.

Geometry is the same for every type: radius 8, icon gap 8, label Medium 14/24, icon-only is a square
(`aspect-ratio: 1`, no padding).

| size | height | padding |
|---|---|---|
| small | 24 | 0 / 8 |
| medium | 32 | 4 / 12 |
| large (default) | 40 | 8 / 16 |

Colour by type and status; hover and active (the product calls it *pressed*) in brackets.

| type | default | success | danger |
|---|---|---|---|
| primary | bg `#030712` (`#1e2939`, `#364153`), text `#fff` | bg `#16a34a` (`#15803d`, `#166534`) | bg `#dc2626` (`#b91c1c`, `#991b1b`) |
| secondary | bg `#fff` (`#f9fafb`, `#f3f4f6`), 1px `#d1d5dc` (`#b4bac4`, `#99a1af`), text `#1e2939` | border and text `#16a34a` (`#15803d`, `#166534`) | border and text `#dc2626` (`#b91c1c`, `#991b1b`) |
| tertiary | no fill (`#f3f4f6`, `#e5e7eb`), text `#1e2939` | text `#16a34a` (`#15803d`) | text `#dc2626` (`#b91c1c`) |
| plain | no fill, text `#2563eb` (`#1d4ed8`, `#1e40af`) | text `#16a34a` (`#15803d`) | text `#dc2626` (`#b91c1c`) |
| outline | bg `#eff6ff` (`#dbeafe`, `#1e40af`), 1px and text `#1d4ed8` (`#1e40af`, text `#fff` when pressed) | not shipped | bg `#fef2f2` (`#fee2e2`, `#991b1b`), 1px and text `#b91c1c` (`#991b1b`, `#fff`) |

`disabled` is one look for every type, status and size: bg `#f3f4f6`, text `#6a7282`, no border.
`loading` on primary: bg `#99a1af`, text `#030712` (the spinner itself is not built).

The two AI types, read 2026-09-19. **`ai`** is a 90° wash `#e0e7ff → #f3e8ff` that does not change between
states, behind a 1px border that does: normal `#e9d5ff`, hover `#d8b4fe`, pressed and loading `#c084fc`.
Text `#1e2939`, disabled `#4a5565` — and disabled **keeps the wash**, so the common grey disabled look does
not apply to it. **`ai-tertiary`** has no fill at all: its content box carries a 135° gradient
`#818cf8 12.26% → #9333ea 61.93%` with `background-clip: text`, so the label and the icon are the gradient.
An icon there must be drawn with `currentColor`, or it will not be painted. Its backgrounds arrive only on
hover `#d1d5dc`, pressed and loading `#b4bac4`, and disabled flattens the text to `#818cf8`.

Not covered yet: the counter slot, the spinner, and the focus ring — the product's focused colours equal
its normal ones, so the ring comes from elsewhere and has not been read.

The Storybook frame renders the label at the browser's default button size because the story has no page
type; the product and this component both set **14/24 Medium**.

## Recognising the component in a mockup

`get_design_context` names every component instance in `data-name`. That name is the design system's own,
not a layer name someone typed, so it is the reliable key — match on it before anything else.

| `data-name` in Figma | what to render |
|---|---|
| `*Input Basic*`, `*Input* / Pre Tab`, `Input / Field` | `input()` — `title:` is the label above, the field is the box |
| `*Button*`, `Table Row / Cell Button`, `Node / Button` | `button()` — read type from the fill: dark `#030712` is primary, white with a 1px border secondary, no fill tertiary, blue label plain |
| `*Checkbox*`, `*CheckboxGroup*` | `checkbox()`, stacked with `group()` |
| `*RadioGroup*`, `Radio` | `radio()`, stacked with `group()` |
| `*Select* / Field`, `.Select / Field Inline` | `select()` — the trigger; an open menu is the prototype's own |
| `*Multiselect Basic*` | `multiselect()` — the same trigger as the select, with the chosen labels joined by `, ` |
| `*Tag Colorful*` | `tag()`; inside the page header's tabs it is the shell's |
| `*Counter*` | `counter()` |
| `*Alert*` | `alert()` — pass the frame's icon and close button |
| `*Empty State*`, `Empty state / …` | `emptyState()` — pass the frame's illustration and its buttons |
| `*Status*` | `status()` — the dot pill; `label` is the bold part, `text` the regular one |
| `*Status*` with a chevron, `*Status Select*` | `statusSelect()` — the same pill, clickable; the open menu is `selectMenu()` |
| `*Toast*`, `*Snackbar*` | `toast()` — pass the frame's own icon and × as inline SVG |
| an open dropdown under a select | `selectMenu()` |
| `*Tooltip*` | `tooltip()` — the box and its arrow (`side`, `at`); where the box goes is the prototype's |
| `*DataList*` | `dataList()` — label column plus value |
| `*Keyboard shortcut*` | `kbd()` — the keycaps inside a button |
| `*Modal*`, `*Dialog*` | `modal()` |
| `*Collapsible Card*`, `Card` | `card()` |
| `*Code-block*` | `codeBlock()` — pass the lines; `kind:` picks the token colour |
| `*Search*`, `Search bar`, `Table / Search` | `searchBar()` |
| `*Multiselect*` with tags inside the box | `tagMultiselect()` — pass the frame's × glyph |
| a link inside running text | `link()` |
| `.Tab Basic / Item` inside the content | `tabs()` |
| `.Tab Basic / Item`, `Header / Subheader` in the page header | the shell's tabs (`references/shell.md` § Tabs) |

When the name matches, the component is the default and the mockup gives text, width and the state it
draws. When it does not match, or the control is drawn without an instance, build it from the frame and
write one ledger line saying so.

## Radio and checkbox — `SnsRadioButton`, `SnsCheckbox`

Stories `forms-snsradiobutton--playground`, `forms-snscheckbox--playground`, and the two group stories.

Mark 16×16, pushed **4px down** so it centres on the first 14/24 line; label 8px to its right, 14/24
`#1e2939`; caption under the label, 14/24 `#4a5565`. Radio mark is a circle, checkbox radius 4 with the
design system's 12px tick (`icons/checkmark.svg`) or, for `indeterminate: true`, its 16px minus bar
(`icons/indeterminate.svg`) — both Figma exports, and the product gives the two states the same filled
plate. A vertical group stacks items 8px apart
(the product's 32px pitch = 24 + 8); a horizontal one 24px apart.

| state | mark |
|---|---|
| unselected | bg `#fff`, 1px `#d1d5dc` |
| unselected hover / active | 1px `#b4bac4` bg `#f9fafb` / 1px `#99a1af` bg `#f3f4f6` |
| selected | fill `#030712` (hover `#1e2939`, active `#364153`); radio adds an 8px white dot |
| disabled | bg `#f3f4f6`, 1px `#d1d5dc`, text `#4a5565`; selected + disabled fills `#e5e7eb` |

## Select — `SnsSelect`

The product builds the trigger out of the **input box** plus a chevron, so `select()` reuses `input()`'s
box: same sizes, radius, border and states. Placeholder `#6a7282`, chevron `#1e2939` 16px
(`icons/chevron-down.svg`). `selectMenu()` renders the **open menu** the trigger opens, read again on 2026-09-20 by clicking the
story's selector: a popover, radius 12, white, 1px `#e5e7eb` and a `0 2px 10px 1px rgba(4,29,47,.15)` drop
shadow, scrolling at 400. A row is 8/12, 40 tall (60 with a caption): label 14/24 `#1e2939`, caption 12/16
`#4a5565`, the selected row `#f9fafb` with a **16px** tick at the right in `#030712`, hover `#f3f4f6`,
disabled label `#6a7282`, a group title 12/16 Medium `#6a7282`. With `search: true` the product's search
row sits above the list: padding 12/12/8 around a 32 box, radius 8, 1px `#d1d5dc`, text 14/24.

**The trigger opens it.** Give `select()` or `tagMultiselect()` an `items:` array and the menu is rendered
under the box, hidden, and `script` opens it on a click: a single select writes the chosen label into the
trigger and closes, a tag multiselect toggles the chip and stays open, Escape and a click outside close,
and opening one menu closes any other. Without `items:` the trigger is a picture, as before, and
`selectMenu()` on its own still renders a menu wherever the page wants one.

`dscheck.js` watches it by clicking the story's selector first: a check may carry `"click": "<selector>"`,
which is what brings the menu and the modal under the same cover as everything else.

## Tag — `SnsTag`

Radius 8, padding 4/8, gap 6, 1px border, Medium 12/16. Palette (background / border / text):

| colour | | | |
|---|---|---|---|
| grey | `#f3f4f6` | `#d1d5dc` | `#1e2939` |
| blue | `#dbeafe` | `#bfdbfe` | `#1e40af` |
| green | `#dcfce7` | `#bbf7d0` | `#166534` |
| red | `#fee2e2` | `#fecaca` | `#991b1b` |
| yellow | `#fef3c7` | `#fde68a` | `#8a460c` |
| orange | `#ffedd5` | `#fed7aa` | `#9a3412` |
| purple | `#f3e8ff` | `#e9d5ff` | `#6b21a8` |
| cyan | `#cffafe` | `#a5f3fc` | `#155e75` |
| black | `#364153` | `#1e2939` | `#fff` |
| deleted | `#f3f4f6` | `#e5e7eb` | `#6a7282` |

Sizes: medium (default) is 24 high, padding 4/8, gap 6; small is 20 high, padding 2/8, gap 4.

**The gradient tag**, which mockups draw as the AI one: `linear-gradient(72deg, #b465da 0%, #cf6cc9 33%,
#ee609c 66%, #ee609c 100%)`, white text and icon, 1px `#e9d5ff` border that does not follow the wash.
Read on 2026-09-19 **from the stylesheet rule and the resolved variables, not from a rendered story** —
no story in the Storybook renders `color-gradient`, so `dscheck.js` has nothing to compare against and
this row is the one place in this file without a live check behind it.

There is also a set of `--components-tag-ai-*` variables (border `#c7d2fe → #818cf8 → #a855f7`, white
text and icon), but `SnsTag` has no `color-ai` rule that uses them. Treat an *AI tag* in a mockup as the
gradient tag, and ask if it looks different.

Not built: the closeable variant, whose cross button has a per-colour hover.

## Counter — `SnsCounter`

Filled pill: min-width 20, padding 2/6, radius 40, Medium 12/16. blue `#dbeafe`/`#1e40af`,
green `#dcfce7`/`#166534`, cyan `#cffafe`/`#155e75`, dark grey `#99a1af`/`#fff`. Geometry confirmed against
Figma's own counter in the Applicants table.

Two sizes: small (default) is 20 wide with 12/16 text, medium is 28 with 14/24 — the pill grows because
its text does, not because its padding changes.

Two more kinds, read 2026-09-19. Both draw their ring with the **`outline` property, not a border**, so the
pill keeps its size, and both keep padding 2/6 and the full radius.

| kind | ring | text | fill |
|---|---|---|---|
| outline blue | `#93c5fd` solid | `#1e40af` | none |
| outline grey | `#b4bac4` solid | `#1e2939` | none |
| outline red | `#fca5a5` solid | `#991b1b` | none |
| outline green | `#86efac` solid | `#166534` | none |
| dashed grey | `#99a1af` dashed | `#1e2939` | `#fff` |

Outline ships in those four colours only, dashed in grey only. Disabled outline fades the text to the ring
colour; disabled dashed fills `#f3f4f6` with `#6a7282` text.

## Empty state — `SnsEmptyState`

Story `design-system-snsemptystate--playground`. The block fills its container
(`width:100%;height:100%`) and centres its content; padding 24, radius 12.

| part | |
|---|---|
| vertical layout | column, centred, `text-align:center`, gap 16 |
| horizontal layout | `row-reverse`, space-between, centred, gap 40, buttons left-aligned |
| illustration | whatever the frame exports, 160×81 in the story; the component ships none |
| title | 20/28 Medium `#030712` |
| description | 14/24 Regular `#1e2939`, 8 above it, `white-space: pre-line` |
| buttons | a row 16 below, gap 12, the product's medium buttons |

Two variants beside the plain one: `bordered` is a 1px **dashed** `#d1d5dc`, `filled` is `#f9fafb`. Pass
the illustration and the buttons in — the illustration is a Figma export (rule 8) and the buttons are
`button()` calls, so neither is invented by the component.

Not read: `SnsEmptyStatePromo`, which has its own icon, subtitle and colour variables
(`--components-empty-state-promo-*`).

## Code block — `SnsCodeBlock`

Story `design-system-snscodeblock--default`, read 2026-09-19. `#f9fafb` behind a 1px `#d1d5dc` frame,
radius 12. Header padding 8/20 over its own bottom rule `#d1d5dc`, title **16/24 Bold** `#030712` — the
Dev space frames draw that title at 14, which is a ledger line, not the component. The Copy control is
the product's small secondary button. The code area is padded 16 top and bottom, the gutter 20 left and
12 right in `#4a5565`, everything 12/18 in the mono family.

Token colours, from `--components-code-block-*`:

| token | |
|---|---|
| plain, punctuation | `#030712` |
| comment | `#4a5565` |
| string, operator | `#15803d` |
| keyword, function | `#4338ca` |
| number | `#be185d` |
| property | `#7e22ce` |

`codeBlock({lines})` takes strings or `{text, kind}`; the diff colours (`#fef2f2`/`#b91c1c` deleted,
`#f0fdf4`/`#15803d` inserted) are read but not built.

## Search bar — `SnsSearchBar`

Story `design-system-snssearchbar--playground`. It is the **field's own box** with a 16 glyph 8px before
the text and an optional erase glyph 8px after it, so `searchBar()` reuses the input's classes and every
hover, focus and disabled colour comes from there. Medium is 32 tall (padding 4/12), large 40 (8/12);
radius 8, 1px `#d1d5dc`, text 14/24 `#1e2939`, placeholder `#6a7282`, glyphs `#1e2939` and `#4a5565`
when disabled. The product also has a `kind` without the box; only `kind-input` is built.

## Status — `SnsStatus`

Story `design-system-snsstatus--playground`. A pill: 1px border, radius 9999, gap 4, a 6px dot from
`SnsBadge`, then a title 12/16 Medium and an optional description 12/16 Regular, both in the pill's own
text colour.

| size | min height | padding |
|---|---|---|
| small | 20 | 0 / 8 |
| medium (default) | 24 | 0 / 8 |
| large | 32 | 0 / 12 |

Palette (background / border / text / dot). The dot takes the **badge** palette, a more saturated set than
the border — read from `--components-status-*` and `--components-badge-*` on 2026-09-19:

| colour | | | |
|---|---|---|---|
| grey | `#f3f4f6` | `#d1d5dc` | `#1e2939` / `#6a7282` |
| grey-dark | `#e5e7eb` | `#d1d5dc` | `#1e2939` / `#4a5565` |
| blue | `#dbeafe` | `#bfdbfe` | `#1e40af` / `#3b82f6` |
| cyan | `#cffafe` | `#a5f3fc` | `#155e75` / `#06b6d4` |
| green | `#dcfce7` | `#bbf7d0` | `#166534` / `#22c55e` |
| yellow | `#fef3c7` | `#fde68a` | `#8a460c` / `#f4a614` |
| orange | `#ffedd5` | `#fed7aa` | `#9a3412` / `#f97316` |
| orange-light | `#fff7ed` | `#ffedd5` | `#9a3412` / `#fb923c` |
| pink | `#fce7f3` | `#fbcfe8` | `#9d174d` / `#ec4899` |
| purple | `#f3e8ff` | `#e9d5ff` | `#6b21a8` / `#a855f7` |
| purple-light | `#faf5ff` | `#f3e8ff` | `#6b21a8` / `#c084fc` |
| red | `#fee2e2` | `#fecaca` | `#991b1b` / `#ef4444` |
| red-light | `#fef2f2` | `#fee2e2` | `#991b1b` / `#f87171` |

Not read: the large pill's dot (the story renders the 6px one beside a medium pill) and the icon variant.

### Status select — `SnsStatusSelect`

Story `design-system-snsstatusselect--playground`. The same pill, clickable, with a 16px chevron after the
label. `statusSelect()` renders it with the status classes, because the geometry and the fill are the
status pill's; what moves is the border and the chevron:

| state | border | chevron |
|---|---|---|
| normal | the status border | a mid tone of the colour |
| hover | one step darker | one step darker |
| pressed | two steps darker | the pill's own text colour |

Read on 2026-09-19 for all twelve colours it ships. **There is no `orange-light` here**, though the status
pill has one, so a mockup using it is a question rather than a fallback. Background and text never change
between states.

| colour | border hover / pressed | chevron normal / hover / pressed |
|---|---|---|
| blue | `#93c5fd` / `#60a5fa` | `#2563eb` / `#1d4ed8` / `#1e40af` |
| cyan | `#67e8f9` / `#22d3ee` | `#0891b2` / `#0e7490` / `#155e75` |
| green | `#86efac` / `#4ade80` | `#16a34a` / `#15803d` / `#166534` |
| grey, grey-dark | `#b4bac4` / `#99a1af` | `#1e2939` / `#4a5565` / `#1e2939` |
| orange | `#fdba74` / `#fb923c` | `#ea580c` / `#c2410c` / `#9a3412` |
| pink | `#f9a8d4` / `#f472b6` | `#db2777` / `#be185d` / `#9d174d` |
| purple, purple-light | `#d8b4fe` / `#c084fc`, light one step lighter | `#9333ea` / `#7e22ce` / `#6b21a8` |
| red | `#fca5a5` / `#f87171` | `#dc2626` / `#b91c1c` / `#991b1b` |
| red-light | `#fecaca` / `#fca5a5` | `#dc2626` / `#b91c1c` / `#991b1b` |
| yellow | `#fad24a` / `#f7bd28` | `#d27a0a` / `#a95a0a` / `#8a460c` |

The menu it opens is the prototype's own, as with the select: use `selectMenu()`.

## Multiselect — `SnsMultiselect`

Story `forms-snsmultiselect--preselected-items`. The product builds it out of the **select trigger**: the
same input box, the same chevron, and the chosen labels joined by `, ` on one line that truncates with an
ellipsis. There is no counter and no tag inside the box. `multiselect({values: [...]})` renders exactly
that, so everything the select's record says about sizes, radius, border and states applies unchanged.

The box carries `without-padding` and the padding moves to the inner control, 8/12 at large — the same
8/12 the box would have had, so the geometry is the select's.

`tagMultiselect()` is the other one, `SnsTagMultiselect`: the same box with the values as removable grey
tags that wrap onto more rows, the chevron staying at the top. The box and the control's padding are read
from `forms-snstagmultiselect--playground`; **the chip layout inside the box comes from the Dev space
frames**, because the story renders empty and no argument fills it. Pass the frame's own × glyph.

Not built: `SnsCountryMultiselect`.

## Link — `SnsLink`

`#2563eb`, hover `#1d4ed8`, visited `#1e40af`, **underlined**; size and weight inherit from the context,
which is why the product's link sits inside running text without changing its rhythm. The underline was
read back wrong on 2026-09-18 and corrected on 2026-09-19 by `scripts/dscheck.js`: the live rule sets
`text-decoration-line: underline` on the anchor, and the component had been shipped without it.

## Tabs — `SnsTabs` (basic)

Item 32 high, padding 4/0, Medium 14/24, 24px apart; the bar carries a 1px `#e5e7eb` rule under its whole
width, the selected item a 2px `#030712` rule under itself and text `#1e2939` against `#4a5565`.
This is the same component the shell's header subheader renders (`references/shell.md` § Tabs); use the
shell's when the tabs belong to the page header, and `tabs()` when they are inside the content.

## Five components the Applicant page asked for, 2026-09-21

Building the Dashboard UI Kit's Applicant page (`22809:153656`) against this library found
five things it did not have. All five are here now, with the frame's own values:

| | what it is | values |
|---|---|---|
| `dataList(rows, spec)` | **SnsDataList** — the label column beside its value, the product's read-only record data. A row is `{label, value}` or `{label, html}` when the value carries a flag or a tag | read from the story, 2026-09-21: rows 8 apart, columns 16 apart, the value column grows with a 4px gap; label 14/24 `#364153`, value `#030712`, **both in the default family**. The column is 152 by default (`spec.labelWidth` overrides) — the frame's number, since the component only sets `flex-shrink:0` |
| `kbd(keys)` | ***Keyboard shortcut*** — the grey keycaps a button carries; `kbd(['⇧','A'])` goes in a button's `iconRight` | cap min-width 20, padding 2/4, radius 8, `#edeff2` on `#373d4d`, Inter 12/16 |
| `input({titleRight})` | the right-hand slot of **Label / Vertical**: the value read off a document ("FREYA"), an age ("42 y.o."), a unit. Not the hint, which is under the box | 14/24 regular `#4a5565`, right-aligned, truncating |
| `group(items, {title})` | a **visible** label over a radio or checkbox group. With a title the group is named by it (`aria-labelledby`), so the visible and the announced name cannot disagree | 14/24 medium `#030712`, 4 under |
| `card({color})` | the card in a status colour — the product draws a check that needs attention in yellow. `grey` is still the default | yellow border `#fad24a` header `#fffbeb`; green `#bbf7d0` / `#f0fdf4`; red `#fecaca` / `#fef2f2` |

Two things the colour card had to get right, both found the hard way: the header's own
background paints over an inset shadow, so a coloured card carries a real `border`; and the
rules name the outer card with `>`, because a descendant selector paints the nested Collapsible
Cards too, and in the product those stay grey.

**One disagreement, settled the usual way.** The Figma file maps DataList's label to
`font/family/body`, which is Inter, and the first build of the Applicant page followed it. The
shipped component renders that label in the default family: the component wins, the library uses
it, and the file's mapping is a question for the design-system team rather than a value to copy.
`dataList` is now in `storybook.json`, so `dscheck.js` watches its four numbers.

**The card pads its own body.** `.c-card-large` is already the frame's 16 / 20 / 24, and that
build added the same padding again in a wrapper — 40px of content width gone, which only showed
up when the photo column measured 444 instead of 484. Pass the body plain.

## Disabled, at runtime

A control's disabled look is driven by the **attribute** on a real button, input or select, and by the
`c-btn-disabled` class only on something that cannot carry one — a span or an `<a>` drawn as a button.
So a prototype that turns a button on and off writes `el.disabled = <bool>` and nothing else; it does
not have to remove the class the first render left behind, because the class carries `:not(:enabled)`
and steps aside on its own. Before 2026-09-20 it did not, and a Save button that had been rendered
disabled kept the default cursor and greyed its own label on hover for the rest of the session, while
looking perfectly enabled otherwise — found on run 5's walk, not by any measurement.

## Tooltip — `SnsTooltip`

Read 2026-09-20 by hovering `design-system-snstooltip--sizes` by hand and reading the floating node:
`dscheck.js` cannot watch this one, because the box exists only while a pointer is over its reference.

Floating box: background `#030712`, text `#fff` **12/16 regular** — not 14/24, which is what this
library rendered until 2026-09-20; the product and the Customization file agree on 12/16. Small radius
8 padding 6/8 (28 tall); large radius 12 padding 16 (48 tall). Hotkey text `#6a7282`. The story caps
the box at 256 with its own `max-w-32`; that is the story's choice, not the component's, so `tooltip()`
sets no maximum and the prototype does.

**The arrow ships with the component now**, because every prototype was redrawing it and one of them
drew it upside down. Two exports, taken from the story's own DOM: 8×4 under the small box
(`M0 0l3.6 3.83c.22.227.58.227.8 0L8 0H0z`) and 20×8 under the large one
(`M0 0l9 7.659c.552.455 1.448.455 2 0L20 0H0z`), filled `currentColor` off the arrow's own
`color:#030712`. It sits **wholly outside** the edge — the product protrudes it by its full depth, 4
and 8 — and is centred on that edge unless `at` says where.

`side` names where the TOOLTIP sits against the thing it explains, as the product's own class does
(`side-right` = the tooltip is to the right, its arrow on its left edge pointing left). The export
points down, which is `side: 'top'`; the other three sides turn it 90, 180 and 270.

Placement of the box, and the delay, are still the prototype's own.

## Modal — `SnsModal`

Backdrop `rgba(0,0,0,.5)` over the whole canvas; card white, radius 16, padding 16/24. Read on
2026-09-19 by opening the story, which is the only way to see it.

| size | width |
|---|---|
| small (default) | 480 |
| medium | 600 |
| large | 720 |

Header at least 52 high, gap 16 between the text column and the close button. Title 18/24 **Bold**
`#030712` — the 2026-09-18 record said SemiBold, the live component computes 700. Subtitle under it,
14/24 Regular `#4a5565`. The close button is the product's small tertiary icon button; pass it in
(`close:`) with the frame's own glyph, the same rule as the toast. Body and footer are the caller's
markup, positioning follows the product's `position-top`.

`dscheck.js` reaches it with `"click": "button.sns-button"` on the check, which opens the story's modal
before reading. The width, the header and the backdrop are watched; the sizes beyond small are not, since
the story ships one.

## Collapsible card — `SnsCollapsibleCard`

Story `design-system-snscollapsiblecard--playground`, read fully on 2026-09-19. The card is white,
radius 16, 1px `#d1d5dc`, and clips its content. **The header bar is grey `#f3f4f6`, not white**, and the
chevron sits at its left in a 24 box, not at its right — the 2026-09-18 record had both wrong because it
was taken from a mockup rather than the component.

| size | header padding | open body padding |
|---|---|---|
| small | 8 | 8 / 8 / 12 |
| medium | 12 / 16 | 12 / 16 / 20 |
| large | 16 / 20 | 16 / 20 / 24 |

Header: flex, gap 8, the whole bar is the click target. Chevron box 24×24, radius 8, icon 16 `#4a5565`,
hover `#f3f4f6`, pressed `#e5e7eb`, and the icon turns 180° when the card is open. Title colour `#030712`
with a 8px column gap for whatever sits beside it; **the component sets no font on the title**, the caller
does, and `card()` defaults to the 14/24 SemiBold the mockups use. Actions sit at the right, gap 8.

The product animates the chevron and the body (0.2s and 0.25s). Rule 5 says the prototype does not, so
`controls.js` ships the same geometry without the transitions.

Not read: the `draggable` header variant and the non-`classic` skin.

## Toast — `SnsToast`

476 wide, padding 16, radius 12, 1px border, drop shadow `0 2px 6px 1px rgba(4,29,47,.1)`; icon 24 in a
4px box, message column 8px to its right, title SemiBold above text 14/24 `#030712`, 4px between them.

| type | background | border | icon |
|---|---|---|---|
| info | `#eff6ff` | `#bfdbfe` | `#3b82f6` |
| success | `#f0fdf4` | `#bbf7d0` | `#22c55e` |
| warning | `#fffbeb` | `#fde68a` | `#f4a614` |
| danger | `#fef2f2` | `#fecaca` | `#ef4444` |

The icon and the close glyph are passed in as inline SVG from the frame's own export — the component does
not ship them. Where the toast sits, and whether it dismisses itself, is the prototype's decision (Step 0);
the skill's default is that it stays until the × is clicked.

## Alert — `SnsAlert`

Radius 12, 1px border, text 14/24 `#030712`. Medium: padding 16, gap 8 between icon, text and action,
4px between title and text. Small: padding 8, gap 4. The icon sits in a 24 box with 4px padding, the title
is Medium 16/24, and an action (usually a tertiary 24px icon button) sits at the right.

| type | background | border | icon |
|---|---|---|---|
| basic | `#f3f4f6` | `#e5e7eb` | `#6a7282` |
| info | `#eff6ff` | `#bfdbfe` | `#3b82f6` |
| success | `#f0fdf4` | `#bbf7d0` | `#22c55e` |
| warning | `#fffbeb` | `#fde68a` | `#f4a614` |
| danger | `#fef2f2` | `#fecaca` | `#ef4444` |

Same palette as the toast, different box: an alert sits in the page, a toast floats over it. The icon and
the action come from the frame, not from the component. Confirmed against a mockup: the two alerts on
Reusable Identity / Partners (`3840:30579`) use exactly the basic and info rows above.

## The glyphs the components expect

Icons are the frame's own exports (rule 8), so most components take them as HTML rather than shipping
them. `assets/components/icons/` holds only the four a control cannot be drawn without. This is the list
to export when a build meets each component, with the Figma names they carry in the Dev space frames:

| where | glyph | Figma name |
|---|---|---|
| checkbox, select menu tick | checkmark | `normal/checkmark` — **ships** |
| checkbox, indeterminate | minus bar | `normal/indeterminate` — **ships** |
| select, multiselect, card | chevron down | `normal/chevron-down` — **ships** |
| search bar | magnifier | `normal/search` — **ships** |
| label with a hint | question mark | `small/question-s` |
| secret field | eye, copy | `normal/invisible`, `normal/copy` |
| field error caption | filled danger | `small/Filled/Danger` |
| alert, toast | the type's filled glyph, close | `normal/Filled/<type>`, `normal/close` |
| tag, tag multiselect | close | `Tag / Button` |
| inline plain button | plus | `normal/add` |
| code block | copy | `normal/copy` |
| status, status select | no glyph; the dot is drawn | — |

A glyph that is missing from a build is a question for the designer, not a drawing exercise: the design
system's chevrons, for one, are a single export at four angles, and a redrawn one is visible at 16px.

## Accessible by construction

Added 2026-09-20 so a prototype can be checked with a keyboard and a screen reader before anything is
built — about two thirds of accessibility defects are born in the mockup, and a code-backed prototype is
the first place they can be caught. Nothing here changes a pixel.

| control | what it carries |
|---|---|
| input, search bar | the title is a `<label for>` on the field; hint or error is `aria-describedby`; an error sets `aria-invalid`; a field without a title takes its placeholder as `aria-label`; each inner button has `aria-label` when given `{icon, label}` |
| radio, checkbox | `role`, `aria-checked` (`mixed` for indeterminate), `tabindex`, `aria-disabled`; `group()` is a `radiogroup` when it holds radios |
| select, tag multiselect | the box is `role="combobox"` with `aria-haspopup`, `aria-expanded` kept in step by `script`, labelled by the title; the menu is a `listbox` of `option`s with `aria-selected`; a chip's × is a button named *Remove <label>* |
| tabs | `tablist` / `tab` / `aria-selected`, only the active tab in the tab order |
| card | the header is `role="button"` with `aria-expanded`, and it opens and closes the card |
| status, toast, alert, tooltip, modal | `status`; `alert` (the product's own); `alert` for danger and warning, `status` otherwise; `tooltip`; `dialog` with `aria-modal` labelled by its title |
| icon-only button | named by its `label` |

**Keyboard.** Space and Enter act on every focusable control the way a click does, Escape closes menus, and
the focus ring is the design system's (`0 0 0 1px #fff, 0 0 0 3px #60a5fa`) on anything focusable that is
not a field. Arrow keys inside a menu or a tab list are not built.

Not covered: contrast is the palette's own and is not re-checked here; live regions beyond the toast; a
modal does not trap focus. Lint drives the whole contract from the keyboard.

## Making them live

`controls.js` exports `script`, a few lines to drop in one `<script>` per page. With it a radio picks and
a checkbox toggles, which is what a respondent expects the moment a form is on screen — a dead radio
inside the tested area is a defect (Step 1), not correct inertness.

* a radio group is the nearest `[data-radio]` or `.c-grp`, so two groups side by side do not fight; with
  neither, the radio's own parent is the group;
* clicking an indeterminate box checks it, the way a browser does;
* a disabled control does nothing;
* nothing else is wired: the select's menu, the card's chevron and the modal are the prototype's own
  decisions, because where they open and what they show is not something the component knows.

The checkbox carries both glyphs in its markup and the class decides which one shows, so a toggle never
has to build an icon at run time.

## Using them

Pass **raw** text, never pre-escaped: every renderer escapes what it is given, so an `&amp;` handed in
comes out as the literal `&amp;` and the label grows by ~30px (seen on the AML tree, 2026-09-18).

## How to update

1. `scripts/dscheck.js` — it opens the same stories, reads the properties listed in
   `assets/components/storybook.json` and prints every value that no longer matches. Half a minute, no
   browser pane, no Figma. Run it before trusting this file after a quarter has passed.
2. For anything it cannot reach — hover, focus, an open menu, a modal — open the story in the browser
   pane and read the computed styles and the `--components-*` variables by hand.
3. Change `controls.js`, put the new numbers here with the date, and add or fix the check in
   `storybook.json` so the next run guards them.
4. `scripts/lint.sh` — it renders each control headless and compares geometry and colours with this table.

`dscheck.js` can click before it reads (`"click"` on a check), so anything that exists only after a click
is watchable; hover and focus are still a human look.

What `dscheck.js` covers today: the input's three sizes, its error, disabled and warning fills and its label; the
primary and secondary button; the radio mark selected and not; the checkbox mark; the grey tag; the
filled counter; the link; the selected tab; the grey status pill, the green status select and its chevron, both multiselect triggers, the code
block and the search bar; the empty
state's container, layout, title, description and button row; the collapsible card's box, grey header,
chevron and open body; the toast and the alert; and, behind a click, the modal's card, header and
backdrop and the select menu's popover, row and search box. What it does not: every colour of every palette, the select menu, the
modal, the tooltip, and every state behind a pointer.

`dscheck.js --vars <prefix>` prints the design system's own resolved variables, which is how a palette
like the status one gets read without opening a browser pane.
