# A second theme

## Via MCP: the theme is a palette, nothing else

A dark frame typically differs from its light twin **only in colours and a few
assets**. Confirm that first, and then geometry does not need extracting again:
on a real run `get_metadata` was called **zero** times for the dark theme.

```
get_screenshot     dark frame            → reference
get_design_context dark frame, forceCode → 222 KB to a file
grep 'bg-\[' 'border-\[' 'text-\[' the file → the palette
```

Geometry then matches within 1px by construction. The dark zone's diff number
will be higher than the light one's without being worse — `verification.md`,
"Set the threshold as a number".

Two things to check while you are there:

* **An icon exported for the dark frame may carry the light fill.** One globe
  came back `#20252C` where the mockup measured `#FFFFFF`. Others in the same
  frame were correct, so pixel-probe rather than recolouring everything.
* **The state must drive the markup, not the DOM.** A first version mutated the
  selected card directly; leaving the panel and returning reset the card while
  the preview stayed dark. Keep the choice in a variable that both the panel and
  the preview read, and repaint whole zones from it.

If two controls can change the same theme — a settings radio and a switch inside
the preview — decide explicitly whether each one also moves the underlying
*setting*, and say so out loud. A preview-only switch that repaints without
changing the saved value is invisible unless you name it.

## Via exports: prove the geometry matches

```bash
python3 scripts/align_exports.py light.svg dark.svg
```

If the two exports align element-for-element, you are licensed to write the
markup **once** and switch only colour. That single fact is worth more than any
amount of careful copying, and it is cheap to establish — on one project 47 of
48 elements matched at 0.01px, the one exception being a clipped white rect that
only the light frame carried.

If they *don't* align, read the unmatched list before deciding. It is either a
real difference (an element that exists in one theme only) or your tolerance is
too tight. Do not paper over it with two separate markups until you know which.

## Deriving a palette from colour pairs (exports, no layer names)

This is the trick that rescues an export with no layer names.

A single colour is ambiguous: `#FFFFFF` is the page, the card, and the button
label. But the **pair** `(#FFFFFF, #1B1B1F)` is usually unique to one role,
because a designer who reskins a frame maps each semantic colour to exactly one
counterpart. So:

1. align the two exports element-by-element;
2. group matched elements by their `(light paint, dark paint)` pair;
3. each group is a token; elements inside a group are told apart by position.

`align_exports.py` prints exactly this grouping. Real output from one project,
14 pairs across 44 elements — and from it, named tokens fell out immediately:

```
14 x   light: fill=#20252C          -> ink        (titles, labels, icons)
       dark:  fill=white
11 x   light: fill=white            -> surface    (widget, cards, rows)
       dark:  fill=#1B1B1F
 4 x   light: fill=#20252C fo=0.3   -> line2      (hairlines)
       dark:  fill=white   fo=0.3
 3 x   light: fill=#D12424          -> req        (required-field asterisks)
       dark:  fill=#D32F2F
 1 x   light: fill=white            -> shell      (phone body)
       dark:  fill=#1A1B1C
```

The header, three list items, a button, its label and a globe icon were all
identified this way in a file with not a single name in it.

Watch for pairs that differ only in opacity, and for pairs where one side is a
`stroke` and the other a `fill` — those are usually the same token used two
ways, not two tokens.

## Binding an element to a token replaces its drawn default

In a prototype of a customization tool, "make this follow that parameter" sounds
like plumbing. It is also a repaint: the element stops using the colour the
mockup drew and starts using the one the parameter computes, and those are
usually not the same value.

Measured on one such request: an alert was drawn `#eff6ff` — a step of the design
system's blue ramp. The panel defines its background as *Info at 10%*, which is
`#e7ebff`. Binding it was right, and it also meant the preview no longer matches
its own mockup at rest, by a visible-if-you-look 8/255.

So before binding: **compute the token's value, compare it with the drawn one,
and report the delta in the same breath as "done"**. It is a one-line sentence
and it prevents the version where the customer finds the shift themselves and
reads it as a regression. Do it per property — background, border and icon can
each answer differently.

### When the design system's value is not a function of the parameter

The same tag whose background is *Info at 10%* had its label in `#002369` — a
separate token that no alpha, mix or ramp step derives from `#143BFF`. Two bad
options: leave it fixed (change Info to green and the label stays blue on a green
chip) or invent a palette.

The third one, which is what to do: **derive the smallest thing that keeps the
relationship true.** Take the hue and saturation from the parameter and the
lightness measured from the token pair (21% here). The default comes out
`#00126b` against the design system's `#002369` — indistinguishable at size,
noticeably cooler at 3× — and every other value of the parameter produces a label
that still reads. Write down both the rule and the size of the miss.

## Palette plus accessor, not conditionals

```js
const THEME = {
  light: { shell:'#FFFFFF', surface:'#FFFFFF', ink:'#20252C', outline:'#CDCECF',
           line2:'rgba(32,37,44,0.3)', req:'#D12424', /* … */ },
  dark:  { shell:'#1A1B1C', surface:'#1B1B1F', ink:'#FFFFFF',
           outline:'rgba(255,255,255,0.3)', line2:'rgba(255,255,255,0.3)',
           req:'#D32F2F', /* … */ },
};
function T() { return THEME[state.theme]; }
```

Then every draw call reads `T().ink`, and a theme switch is one repaint of the
themed subtree. Keep the two objects in the same key order — a missing key is
then visible by eye, and `Object.keys(a).join() === Object.keys(b).join()` is a
one-line assertion worth having.

## Sweep for literals that escaped the palette

The specific failure: a helper written **before** theming still carries its
light-theme colour, so it keeps rendering light after the switch. It looks like
a design bug and you will hunt it in the markup, not in the helper.

```bash
python3 scripts/hex_sweep.py template.html \
    --only-from 'function previewArea' --only-to 'PANELS = {' \
    --allow 't.'
```

Scope it to the themed region — chrome outside it legitimately carries
single-theme colours — and read what remains. Every hit is either a deliberate
single-theme value, which deserves a comment saying so, or a token that was
never wired up. On one project this found a step-badge helper still holding
`#ECEDF2`/`#CDCECF`.

## The antialiasing seam

Symptom: a thin light line between a dark bezel and the surface it surrounds,
visible only in the dark theme. It looks like a stray element in the export.

Cause: a border-only div has an antialiased inner edge that blends whatever is
*behind* it — the page backdrop — and the child surface only partly covers that
blend.

Fix: give the ring a background as well as a border.

```js
box(x, y, w, h, {background: T().shell,            // not just the border
                 border: `4.93224px solid ${T().bezel}`,
                 borderRadius: '47.18112px'})
```

Same class of problem: a rounded parent whose child has square corners. The
parent needs `overflow:hidden` (see `reading-exports.md`), and the child needs
to be *inside* it, not a sibling.

## Driving the theme from more than one control

A theme is the state most likely to grow extra controls: a settings radio, a
switch inside the preview, a colour row that belongs to one theme. Keep the
theme in one field, let every control write it, and decide per control whether
it also moves the saved *setting* — the full rule, and why a preview switch
should leave the setting alone, is in `architecture.md` under "Two or three
controls, one state".
