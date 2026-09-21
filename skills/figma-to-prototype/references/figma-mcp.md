# Reading Figma through MCP

None of this is in the tool documentation; every item was found the expensive
way.

## Division of labour — memorise this

| tool | gives | does **not** give |
|---|---|---|
| `get_metadata` | node tree, `x`/`y`/`width`/`height`, `hidden` flags | fills, strokes, radii, typography, text |
| `get_design_context` | fills, strokes, radii, fonts, real text, asset URLs | trustworthy coordinates |
| `get_variable_defs` | resolved tokens | anything per-node |
| `get_screenshot` | the reference render | numbers |
| `download_assets` | assets by flat node id | anything with a nested id |

**Geometry only from `get_metadata`. Text only from `get_design_context`.**
Both halves of that sentence are load-bearing.

## `disableCodeConnect: true`, on every `get_design_context` call

Without it, a file wired to a component library returns component snippets —
`<SnsIcon icon="settings"/>` — instead of asset URLs. One call on an icon rail
without the flag cost ~15k tokens and had to be repeated. With it, every icon
arrives as a named constant:

```js
const imgNormalSettings = "https://www.figma.com/api/mcp/asset/….svg";
```

which is an exact node→file mapping you can script against.

## Coordinates: `get_design_context` is relative to the padding box

Inside a container with a border:

| element | design context | metadata | correct |
|---|---|---|---|
| picker row | `left-[3px] top-[3px]` | `x="4" y="4"` | metadata |
| divider | `top-[30px]` | `y="31"` | metadata |

The difference is exactly the border width. Trusting the design-context numbers
shifts an entire control by 1px and roughly doubles its zone error.

**Design-context numbers must not be read as coordinates even when they look
exactly like coordinates.**

Metadata's own conventions: `x`/`y` are relative to the **parent**, not the
canvas; precision is sub-pixel (`x="0.015869140625"`) and the sub-pixels matter;
`hidden="true"` marks nodes not to draw.

## Layer names lie

In one file the three menu items named `Colors`, `Colors`, `Typography` read
`Flow & visibility`, `Colors`, `Text` on screen. Names are a designer's
scaffolding, not content. Every string in the output comes from
`get_design_context`.

## A nested instance returns the component's defaults, not the frame's overrides

`get_design_context` called **on a node inside an instance** gives what the
component ships, not what the frame shows. The AML form's field
(`I3130:238097;7619:228727;7619:226942`) came back with the label `Label`;
the frame reads `Search profile ID`. Nothing signals the substitution — the
response looks like ordinary content.

Read text and per-instance values from the **frame's own** design context, at a
node whose id has no `I…;` prefix, or from the frame's render. Use the nested
call only for geometry and for styles the instance cannot override. The same
trap in reverse is useful: a nested call is the cheapest way to see a
component's defaults, which is how you tell an override from a default.

## A node's render carries the Figma page's canvas colour

`get_screenshot` of a **node** (not a frame) returns the node on the page's own canvas — on the Reusable
Identity file that is `#5c5c5c`, which fills the rounded corners and the gaps between stacked children.
A zone diff of such a render against a prototype on white therefore reports 100% for every gap, and an
ink bbox that touches an edge measures the canvas, not the design.

Measure **interior windows** (inset by 2px, or a rect that stays inside the shape), or compare against a
frame render instead. The alerts of `3840:30579` read 4.4% and 7.2% on interior zones and 11% whole,
purely from that backdrop.

## Double scaling inside scaled instances

Inside an instance that Figma has scaled, `get_design_context` **called on a
parent** returns values multiplied by the scale twice.

| value | design context (parent) | metadata (truth) |
|---|---|---|
| steps block width | 259.767 | 291.005 |
| steps block height | 443.038 | 496.315 |
| icon block | 31.873 | 35.706 |

Recover `k` as the ratio of any metadata size to the same design-context size
(here `k = 0.8926375`), then `true_font_size = dc_font / k`. Verified
independently by measuring text ink width in the reference PNG: a 175px run
resolves to exactly 14.282px Manrope Medium.

`get_design_context` **called on the leaf itself** returns correct,
singly-scaled values. Two ways out, then: call on leaves, or divide by a `k` you
have derived — never mix.

## `get_design_context` on a large frame

On a 1440×900 frame it returns sparse metadata and asks you to split into
sub-nodes. `forceCode: true` gets real output, but that output is 84–220 KB —
which is fine as long as it **persists to a file and you `grep` it**. Never read
one whole. Practical ceiling for a useful direct call: a node of roughly 600px
of content.

Raw responses go to `_work/figma-ref/<prefix>.jsx` (`scripts/grab.js` writes
them there and downloads the assets by `curl` — that traffic costs no tokens, so
download generously and read sparingly).

## Leaves that render empty or as the wrong thing

Two cases in one run:

* Step numbers "1 2 3" came back as an `ID` icon. They are **text nodes**
  (Manrope Medium 12.497/17.853); `get_metadata` on the leaf showed
  `<text name="Shape">`.
* `phone` / `monitor` icons in a device switcher came back as empty `<div>`s
  with no asset. Recovered through `download_assets` on the flat parent id, then
  identified from a contact sheet and pixel-sampled for the fill (`#364153`).

**Rule: an empty or implausible leaf gets its own `get_design_context` call.**

The stronger version, measured on a component-heavy file: **inside an instance
placed in a slot, only leaves serialise.** Three calls in a row — on the control
frame, on its row, on the frame holding its two text nodes — each returned a
bare `<div>` carrying nothing but layout classes. The fills, the font and the
strings arrived only from the text nodes themselves. The parents are not
useless, though: their classes are where `gap-[4px]` and `flex` come from, and
that gap is often the number you are looking for. So read parents for layout,
leaves for paint and text, and do not spend a round trip hoping a parent will
hand you a colour.

Related, and it recurs: **a value read for a non-default state may come back as
the default state's value** — and not only for icons. A dark-theme globe
exported with the light `#20252C`; a dark-theme caption whose design context
returned `rgba(32,37,44,0.6)`, the light fallback, which on a `#1a1b1c` card
would have been invisible. Both were settled by one pixel probe: the caption's
brightest pixel measured `#a3a4a4`, which is white at 0.6 over that card.

So: **every value you read for an alternate state gets checked against the
mockup's pixels** before you build on it. Other values in the same frame come
back correct, so probe rather than blanket-replace.

## `download_assets` restrictions

Ids must be flat, matching `^\d+[:-]\d+$` — paths into instances
(`I123:456;789:012`) are rejected. Hard cap of 20 assets per call, returned
without names in an order you have to reconstruct. Use it as the fallback; the
main icon route is design context with `disableCodeConnect`.

## Invisible content, three flavours

1. `hidden="true"` in metadata.
2. `opacity: 0` — visible only in the design context; metadata does not flag it.
   A "50%" label and an entire second preview phone were both invisible this
   way.
3. Nodes below the frame's crop line — perfectly visible in the tree, never on
   screen.

Check all three, and record in the deviation ledger what you deliberately did
not draw. A zone diff over the area you left empty should come back near zero
— that is what confirmation looks like.

## Frames disagree with each other

Not a mistake to resolve by picking the prettier frame. Across three screens of
one file the breadcrumb text, the menu column's layout, the preview's title and
the preview device's width all differed — in areas every screen supposedly
shared.

**Before extracting a new frame, zone-diff its shared areas against the screens
already built, and show the user what diverges.** One call; it catches what
would otherwise surface in front of a respondent.

One kind of divergence needs no question, though. **A frame that documents
states is a specimen: take geometry and styling from it, take content from the
screen frame.** A state frame's dropdown read "Welcome" where the real editor
reads "Warning", and the component's width follows its label — copying the
specimen's text would have changed a string nobody asked to change, and its
width with it.

## A mockup can contradict itself

In one status group, both swatches of "Error" were filled `#D42F2F` while the
row's own caption read `#D12424`; the first status was labelled "Success" while
being blue. Reproduce it literally and write it in the ledger — it is either a
mockup bug or a deliberate state, and it is not yours to decide silently.

## States are not in the tree

Hover, pressed and open states live in Figma as separate copies of a frame, if
they exist at all. Extracting them from the tree is slower and less reliable
than exporting the state frame as a PNG and measuring pixels: the backing
colour and its extent, the border at rest and on hover, the ring of an open
control, how a divider changes width — a handful of `pixprobe.sh` / `minpx.sh`
calls on the export, batched. The same pass tends to find 1px errors that the
zone diff had written off as antialiasing noise.

## Two more shapes worth knowing

**A glyph can be bigger than its box.** A slider thumb: box 24×24, vector 28×28
at offset (−2,−1). A track handle: box 16×16, vector 30×30 at (−7,−5). In the
design context this is `inset-[-4.17%_-8.33%_-12.5%_-8.33%]` — percentages of
the box, easy to skip, and skipping them halves the glyph.

**Fixed widths that do not add up mean a flex remainder.** A 166px container
holding a `w-[124px] flex-[1_0_0]` field and a fixed 60px field: 124+60 does not
fit, so the first is really 107. When the numbers overflow the container, find
the `flex-1` and do the subtraction instead of copying the design-context width.

## `get_variable_defs` on the group, not once on the file

The habit is to pull tokens once for the whole file and move on. The cheaper and
more accurate use is **per repeated group**: ask it on the row of tags, the set
of cards, the group of steps, and it returns exactly the tokens that group uses —
every variant's background, border and text, plus the font family, size and line
height, in a couple of hundred tokens.

What that replaces: one `get_design_context` per variant, or worse, pixel probes
per variant. And it catches something no probe can:

> Four status tags looked like the four colours from the panel at 10%. Three were.
> The fourth used a **different token** (`#BF8300`) that resolves to almost the
> same yellow as the panel's `#F2A90C`. At 10% alpha over white the two differ by
> 2/255 — invisible to the eye and inside the noise of any pixel measurement. Only
> the variable names showed that one of them was not the panel's colour at all.

That distinction decided whether an element could be bound to a customizable
token. Getting it wrong would have been a wrong *behaviour*, not a wrong shade.

So: a probe tells you what a pixel is; the variable defs tell you **what it
means**. When the question is "does this follow that", ask for the names.

## A repeating structure: one instance in full, the rhythm from a scan

A panel of nine near-identical picker rows, a list of cards, a table: the tree
describes every instance, and pulling all of them is most of the cost of the
frame. `get_metadata` on one such 400×1151 panel came back as several hundred
nodes — and nine tenths of it was the same row nine times.

Cheaper and just as exact:

```
get_screenshot     frame              the reference PNG
scanline.sh        the PNG, one x     every box edge, divider and the pitch
get_design_context ONE representative row   exact colours, sizes, strings
```

The scan gives the *where* (tops, bottoms, dividers, the repeat pitch, which
group ends where), the single design-context call gives the *what* (the hex, the
radius, the font, the spacing inside one row), and the screenshot gives the
strings that differ between instances. The rest of the tree adds nothing you
will use.

Take the whole tree when the structure is genuinely irregular, or when you need
`hidden` flags across a frame — that one is not visible in a screenshot and not
visible in a scan.

## Inlining an icon

Strip `width`, `height` and `style` from the downloaded SVG; keep the `viewBox`;
add `preserveAspectRatio="none"` and `style="display:block;width:100%;height:100%"`.
Then place it in an absolutely-positioned box of the size metadata reported.
That reproduces Figma's own behaviour — vectors stretch to their box — and means
the `d` data never has to be re-based.
