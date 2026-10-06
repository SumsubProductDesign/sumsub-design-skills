# Reading Figma through MCP

None of this is in the tool documentation; every item was found the expensive way, and
each is kept to the rule and one line of what it cost. The symptom table in
`references/traps.md` § Figma MCP points back here.

## Contents

- Division of labour — memorise this
- `disableCodeConnect: true`, on every `get_design_context` call
- Coordinates: `get_design_context` is relative to the padding box
- Layer names lie
- A nested instance returns the component's defaults, not the frame's overrides
- A node's render carries the Figma page's canvas colour
- Double scaling inside scaled instances
- `get_metadata` on a frame, never on a section or a page
- A node that lies outside the frame
- The call budget is the seat's, and a View seat has six a month
- Where a big response goes: a file, and a 2 KB preview
- `get_design_context` on a large frame
- A whole-frame response is cut before its constants
- Leaves that render empty or as the wrong thing
- `download_assets` restrictions
- Invisible content, three flavours
- Frames disagree with each other
- A mockup can contradict itself
- States are not in the tree
- Two more shapes worth knowing
- `get_variable_defs` on the group, not once on the file
- A repeating structure: one instance in full, the rhythm from a scan
- Inlining an icon
- Step 2 in full — extract from Figma

## Division of labour — memorise this

Every tool here is the Figma MCP server's: `figma:get_metadata`, `figma:get_design_context`
and so on. Claude Code lists them as `mcp__<server>__<tool>`, and the server part depends
on the install — `plugin_sumsub-design_figma` from this plugin, a connector id from
claude.ai. **A session can have both at once, with the same tool names.** Use the plugin's
(`mcp__plugin_sumsub-design_figma__…`), the one this skill was measured against, and keep
to one server for the whole session.

| tool | gives | does **not** give |
|---|---|---|
| `figma:get_metadata` | node tree, `x`/`y`/`width`/`height`, `hidden` flags | fills, strokes, radii, typography, text |
| `figma:get_design_context` | fills, strokes, radii, fonts, real text, asset URLs | trustworthy coordinates |
| `figma:get_variable_defs` | resolved tokens | anything per-node |
| `figma:get_screenshot` | the reference render | numbers |
| `figma:download_assets` | assets by flat node id, **20 nodes per call** (`rawImagesTruncated: true` past that); a render with no export settings is capped at ~4096px | anything with a nested id |

**Geometry only from `get_metadata`. Text only from `get_design_context`.** Both halves
are load-bearing.

## `disableCodeConnect: true`, on every `get_design_context` call

Without it, a file wired to a component library returns component snippets
(`<SnsIcon icon="settings"/>`) instead of asset URLs — one call on an icon rail without
the flag cost ~15k tokens and had to be repeated. With it, every icon arrives as a named
constant, `const imgNormalSettings = "https://www.figma.com/api/mcp/asset/….svg"`, an
exact node→file mapping you can script against.

## Coordinates: `get_design_context` is relative to the padding box

Inside a bordered container the design context says `left-[3px] top-[3px]` where metadata
says `x="4" y="4"`: the difference is the border width, and trusting it shifts a whole
control by 1px and roughly doubles its zone error. **Design-context numbers are not
coordinates even when they look exactly like coordinates.** Metadata's own conventions:
`x`/`y` are relative to the **parent**, sub-pixel precision matters, `hidden="true"`
marks nodes not to draw.

## Layer names lie

Three menu items named `Colors`, `Colors`, `Typography` read `Flow & visibility`,
`Colors`, `Text` on screen. Names are a designer's scaffolding; every string comes from
`get_design_context`.

## A nested instance returns the component's defaults, not the frame's overrides

`get_design_context` **on a node inside an instance** (an id with an `I…;` prefix) gives
what the component ships, not what the frame shows — the AML form's field came back as
`Label` where the frame reads `Search profile ID`, and nothing signals the substitution.
Read text and per-instance values from the **frame's own** design context at a node whose
id has no `I…;` prefix, or from the frame's render; use the nested call for geometry and
for styles the instance cannot override — and, in reverse, as the cheapest way to see a
component's defaults and tell an override from one.

## A node's render carries the Figma page's canvas colour

`get_screenshot` of a **node** (not a frame) draws it on the page's own canvas — `#5c5c5c`
on one file — which fills rounded corners and the gaps between stacked children. A zone
diff of such a render against a prototype on white reports 100% for every gap. Measure
**interior windows** (inset 2px, or a rect inside the shape) or compare against a frame
render.

## Double scaling inside scaled instances

Inside an instance Figma has scaled, `get_design_context` **on a parent** returns values
multiplied by the scale twice (a 291 block as 259.767); **on the leaf itself** they are
singly scaled and correct. Recover `k` as the ratio of any metadata size to the same
design-context size and divide (`true_font = dc_font / k`), or call on leaves — never mix.
The tell when nobody suspected a scaled instance: **two different sizes for one text
style** in one frame — two nesting depths, each scaled once more. Confirm the unscaled
value against the text box height in metadata or against ink width in the reference.

## `get_metadata` on a frame, never on a section or a page

A section or a page is every frame on it: such a call comes back over the tool limit and
lands in a 139k-character file, read for four frame ids. The person sent a section or page
link → ask for the frame links in the Step 0 message (two clicks for a designer, cheaper
than the call). Nobody to ask → one call on the section, saved to its file,
`scripts/figmeta.py <file> 2` for the frame ids and sizes, then every later call on a
frame id. The frame itself over the limit → the same file, `figmeta.py` with a regex for
the zone, then `get_metadata` on that zone's node.

## A node that lies outside the frame

A menu, a tooltip, a second state often sits on the page **beside** the frame.
`get_metadata` without a node id returns the page's top level, which on a large file is a
Cover and nothing you can walk to; there is no search. Ask for the node's link — one
message — rather than guessing an id or rebuilding it from the screenshot.

## The call budget is the seat's, and a View seat has six a month

Figma's own guide: **Starter plans and View or Collab seats get 6 tool calls a month**;
Dev and Full seats on a paid plan get per-minute limits and a few hundred calls a day. A
first build takes 13–70 calls. A designer on a View seat finds out on the seventh call:
ask about the seat in Step 0 when the person is new to the skill; a refusal that mentions
limits after a handful of calls is this, not the file.

## Where a big response goes: a file, and a 2 KB preview

Claude Code saves any tool result over about 50,000 characters (≈25,000 tokens) to a file
and hands the model a 2 KB preview and the path. **The file is the whole response; the
preview is its first lines.** Work from the file with `figctx.py` / `figmeta.py`, never
from the preview — the asset constants come last and are not in it. When the constants are
missing *from the file itself*, the server cut it: `figctx.py`'s `UNDEFINED` line lists
them, and that is the list of leaf calls to make.

## `get_design_context` on a large frame

On a 1440×900 frame it returns sparse metadata and asks you to split into sub-nodes.
`forceCode: true` gets real output of 84–220 KB — fine as long as it **persists to a
file and you `grep` it**; never read one whole. Useful ceiling for a direct call: a node
of roughly 600px of content. Raw responses go to `_work/figma-ref/<prefix>.jsx`
(`scripts/grab.js` writes them there and curls the assets — zero tokens, so download
generously and read sparingly).

## A whole-frame response is cut before its constants

A frame's design context writes the markup first and the asset constants last, so
whatever cuts it — the server, or a session reading the 2 KB preview — leaves
`src={imgNormalBuilding}` with nothing defining it; nine such leaves were once found one
call at a time. `scripts/figctx.py <file>` prints them in one line — `UNDEFINED: …` — the
list of leaf calls to make before anything is built. The same big response **returns a
nested instance's default glyph where the frame overrides it** (an attachment icon as
search, a badge grey instead of green) and the markup does not say so: `figctx.py
--assets` reads each SVG's own first `id` (Figma's layer path) against the constant's
name and prints `NAME MISMATCH`; colour overrides it cannot see, so a crop against the
screenshot stays.

## Leaves that render empty or as the wrong thing

Step numbers came back as an `ID` icon (they were text nodes); device-switcher icons came
back as empty `<div>`s (recovered through `download_assets` on the flat parent id and a
contact sheet). **An empty or implausible leaf gets its own `get_design_context` call.**
The stronger version, measured on a component-heavy file: **inside an instance placed in a
slot, only leaves serialise** — parents return bare `<div>`s with layout classes only.
Read parents for layout (`gap-[4px]`, `flex`), leaves for paint and text; do not spend a
round trip hoping a parent hands you a colour.

**A value read for a non-default state may come back as the default state's value** — a
dark-theme caption returned the light fallback, invisible on its card. Every value read
for an alternate state is checked against the mockup's pixels (one `pixprobe.sh`) before
it is built on; other values in the same frame are correct, so probe, do not
blanket-replace.

## `download_assets` restrictions

Ids must be flat (`^\d+[:-]\d+$`); paths into instances (`I123:456;789:012`) are
rejected. Hard cap of 20 assets per call, returned without names in an order you have to
reconstruct. The fallback; the main icon route is design context with `disableCodeConnect`.

## Invisible content, three flavours

`hidden="true"` in metadata; `opacity: 0`, visible only in the design context (a "50%"
label and a whole second preview phone were invisible this way); nodes below the frame's
crop line. Check all three, record in the ledger what you deliberately did not draw, and
expect the zone diff over the empty area to come back near zero.

## Frames disagree with each other

Across three screens of one file the breadcrumb, the menu column, the preview's title and
the device width all differed in areas every screen supposedly shared. **Before extracting
a new frame, zone-diff its shared areas against the screens already built, and show the
person what diverges** — one call, and it catches what would surface in front of a
respondent. One divergence needs no question: **a frame that documents states is a
specimen** — geometry and styling from it, content from the screen frame (a specimen's
dropdown read "Welcome" where the editor reads "Warning", and its width follows its label).

## A mockup can contradict itself

Both swatches of "Error" filled `#D42F2F` while the caption read `#D12424`; a "Success"
status drawn blue. Reproduce it literally and write it in the ledger — a mockup bug or a
deliberate state, not yours to decide silently.

## States are not in the tree

Hover, pressed and open states live in Figma as separate copies of a frame, if at all.
Export the state frame as a PNG and measure pixels — the backing colour and its extent,
the border at rest and on hover, the ring of an open control — with a handful of
`pixprobe.sh` / `minpx.sh` calls, batched. The same pass finds the 1px errors a zone diff
writes off as antialiasing.

## Two more shapes worth knowing

**A glyph can be bigger than its box** — a 24 thumb with a 28 vector at (−2,−1); in the
design context it is `inset-[-4.17%_-8.33%_…]`, percentages of the box, and skipping them
halves the glyph. **Fixed widths that do not add up mean a flex remainder** — a 166
container holding `w-[124px] flex-[1_0_0]` and a fixed 60: the first is really 107. Find
the `flex-1` and subtract instead of copying the width.

## `get_variable_defs` on the group, not once on the file

Ask it **per repeated group** — the row of tags, the set of cards — and it returns exactly
the tokens that group uses, every variant's background, border, text and type, in a couple
of hundred tokens. It replaces a design context per variant, and it catches what no probe
can: four status tags at 10% alpha looked like the panel's four colours, and one used a
**different token** two levels of 255 away — invisible to the eye, decisive for whether
the element could be bound to a customizable token. A probe tells what a pixel is; the
variable defs tell **what it means**.

## A repeating structure: one instance in full, the rhythm from a scan

Nine near-identical rows, a list of cards, a table: `get_metadata` on the panel is several
hundred nodes, nine tenths the same row. Cheaper and as exact:

```
get_screenshot     frame                       the reference PNG
scanline.sh        the PNG, one x              every box edge, divider and the pitch
get_design_context ONE representative row      exact colours, sizes, strings
```

The scan gives the *where*, the one design context the *what*, the screenshot the
strings that differ between instances. Take the whole tree only when the structure is
irregular, or when you need `hidden` flags across a frame.

## Inlining an icon

Strip `width`, `height` and `style` from the downloaded SVG; keep the `viewBox`; add
`preserveAspectRatio="none"` and `style="display:block;width:100%;height:100%"`; place it
in an absolutely-positioned box of the size metadata reported. Vectors stretch to their
box, as in Figma, and the `d` data never has to be re-based.

## Step 2 in full — extract from Figma

**Ask what the design system already owns before reading anything.** Walk the frame's
screenshot once and split it in three:

1. **the shell** — sidebar, island, header, tabs: never extracted, `shell.js` plus the gate;
2. **controls the design system ships** — fields, buttons, radios, checkboxes, selects and
   menus, tags, statuses, alerts, toasts, cards, code blocks, search bars, empty states:
   not extracted either — `controls.js` has their geometry and every state, `data-name` in
   the design context is the key, `node controls.js --api` the list. From the frame take
   only what the component cannot know: the text, the width, the state, the icons;
3. **everything else** — content, layout, illustrations, one-off blocks: the order below.

This split keeps the extraction small: three design contexts for a form instead of a dozen.

**The shell gate comes first.** Read the frame's screenshot for the shell's state, write
`_work/shell.json`, run `scripts/shellgate.sh` against the frame's render — one call, one
ledger line, or `OLDER` / `ASK` (`references/shell.md` § The gate, in Step 2). The sidebar
and header are never extracted or baked from the frame unless the person chose its chrome.

The order, per frame, for what is left — every call the Figma MCP server's (`figma:<tool>`;
in Claude Code `mcp__plugin_sumsub-design_figma__<tool>`, that one even when a claude.ai
connector is also present — § Division of labour):

```
get_metadata      frame   → tree, sizes, what is hidden   (a FRAME id: never a section or a page)
get_variable_defs frame   → resolved tokens (again per repeated group — cheaper than dc per variant)
get_screenshot    frame   → the reference PNG for verification
zone-diff shared areas against existing screens; ask about divergences
                          ↑ a measurement, not a glance: cut the shared band from each render
                            with cut.js, run zonediff.sh — side-by-side reading misses the 2px ones
  per live zone:
get_metadata      node    → coordinates
get_design_context node   → styles, text, assets   (disableCodeConnect: true)
  once per frame with scenery:
download_assets   frame @2x → one PNG; scripts/cut.js cuts every plate from it (Step 5)
```

Four rules carry most of the value: **`disableCodeConnect: true`, always**; **geometry
from `get_metadata`, styles and text from `get_design_context`, never the reverse**;
**layer names lie**; **raw responses go to a file, not into the conversation** — a large
one persists to `_work/figma-ref/` on its own, a small one comes back inline and you write
it to `_work/figma-ref/<node>.jsx` yourself before working from it, or the next session has
no source to check the values against. `scripts/grab.js` downloads a persisted response's
assets by `curl`; `scripts/icons.js` assembles the inline `ICONS` block.
