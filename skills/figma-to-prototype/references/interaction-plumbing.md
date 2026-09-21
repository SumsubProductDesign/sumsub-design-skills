# Interaction plumbing

Everything here is a bug that looks like something else. A dead click looks like
a missing feature; a popup that closes on mousedown looks like a state bug; a
tooltip that never appears looks like a CSS typo. Knowing the shapes saves the
hunt.

## Hit layers go last

In an absolutely-positioned canvas, the text and icons of a "card" are usually
**siblings** of the card's background div, painted above it. Click the label and
`e.target.closest('.card')` finds nothing — the label is not inside the card,
it is on top of it.

The fix is a transparent hit layer, emitted **after** everything else so it wins
the z-order:

```js
function card(o) {
  return thumbnail + border + radio + labels               // visuals, any order
       + box(1060, o.top, 360, 75, {}, ' class="cardHit"'); // last: takes the click
}
// .cardHit { cursor:pointer }
```

Then dispatch on `.cardHit` and map it back to the control it fronts. The
user-facing symptom is always the same: "the cards aren't clickable on the
text".

For **hover** the mirror problem: a child text node is not inside the box you
put `:hover` on. Put the hover on a parent that contains both, so bubbling
covers the children:

```css
.tbHead:hover { background:#F3F4F6; }   /* label + chevron live inside .tbHead */
```

## Capture phase when the handler re-renders its own target

This one is genuinely hard to diagnose. Setup: a popup, a `mousedown` handler
that starts a drag and repaints the popup, and a document-level `mousedown`
handler that closes the popup when the press was outside it.

Press inside the colour field:

1. the app handler runs, starts the drag, repaints → the pressed element is now
   **detached** from the document;
2. the document handler runs in the bubble phase, asks
   `e.target.closest('#pkHost')`, and gets `null` — because `e.target` is the old
   detached node, whose ancestors no longer reach the host;
3. "press was outside" → the popup closes on the first press, every time.

Fix: one listener, **capture phase**, so the decision is made before any
repaint can happen.

```js
document.addEventListener('mousedown', e => {
  if (!state.pkOpen) return;
  if (e.target.closest('.pkSV'))       { e.preventDefault(); drag(fromSV, e); }
  else if (e.target.closest('.pkHue')) { e.preventDefault(); drag(fromHue, e); }
  else if (!e.target.closest('#pkHost') && !e.target.closest('.cpHalf')) close();
}, true);
```

Generalise the rule: **any handler that rebuilds the DOM it is attached to must
decide on capture, or capture the decision before rebuilding.** The same applies
to a DOM snapshot taken before a repaint — it is stale the moment the repaint
runs.

Guard the drag callbacks too. If the popup can vanish mid-drag, a
`querySelector` inside the move handler returns `null` and throws on every mouse
move:

```js
function fromHue(e) {
  const el = document.querySelector('.pkHue');
  if (!el) return;                    // the popup went away mid-drag
  …
}
```

## Keep canvas coordinates under a scroll

A scrolling panel destroys the thing that makes this whole approach work: code
that writes export coordinates directly. The fix is three nested divs — a
viewport the size of the panel, an inner layer pushed back by the panel's
origin, and a spacer carrying the scroll height:

```css
#panelView   { left:1040px; top:56px; width:400px; height:844px;
               overflow:hidden auto; }
#panelScroll { position:relative; width:400px; }   /* height set per panel */
#panelBody   { left:-1040px; top:-56px; width:0; height:0; }
```

Panel code keeps writing `left:1060px` and it lands correctly, scrolled or not.
Without this, a popup positioned from canvas coordinates ignores the scroll
offset and lands in the wrong place — a bug that only appears once the panel is
tall enough to scroll.

## Canvas-level hosts for anything that escapes a clip

A panel with `overflow` clips its descendants, so a tooltip or popup that should
extend past its edge gets cut. Put those in zero-size hosts appended **last** to
the canvas, outside the clipping container:

```js
+ `<div id="pkHost"  style="left:0;top:0;width:0;height:0"></div>`
```

Children of a zero-size absolutely-positioned div keep canvas coordinates, and
being last in the DOM they paint above the panel. Verify with
`document.elementFromPoint()` — and remember it will not return an element with
`pointer-events:none`.

## Popup placement, derived

Right edge flush with the control, prefer below, flip above when it does not
fit, clamp to the canvas:

```js
let py = controlTop + controlHeight + gap;
if (py + popupHeight > canvasBottom - gap) py = controlTop - popupHeight - gap;
py = Math.max(topLimit, Math.min(py, canvasBottom - popupHeight));
```

Numbers come from the export (control height, gap), not from taste.

## A delay is not an animation

When the brief forbids animation but a tooltip needs 300ms:

```css
.tt { visibility:hidden; }
.ttWrap:hover .tt { visibility:visible; transition:visibility 0s 300ms; }
```

Duration 0s, delay 300ms — nothing moves, fades or resizes; the element simply
appears later, and it disappears instantly on leave because the rule carrying
the transition stops applying. Some Chrome versions serialise the shorthand as
`visibility 300ms`, which reads like a duration; others print it faithfully. Do
not judge from the shorthand either way — check the longhands
(`transitionDuration: 0s`, `transitionDelay: 300ms`).

## An event-driven element needs its own host and a commit, not a value change

A hint that appears *because the user changed something* is a different animal
from a hover tooltip, and it breaks in two specific ways.

**It must not live in a container that re-renders while the user types.** The
preview repaints on every keystroke of a colour code; a bubble rendered inside it
is destroyed and recreated each time, so its appear animation replays on every
character. Give it a canvas-level host of its own and write to that host only
when the state changes:

```js
function renderTip(){
  var key = TIPON || '';
  if (key === TIPRENDERED) return;   // same state — do not touch the DOM
  TIPRENDERED = key;
  host.innerHTML = key ? bubble(TIPS[key]) : '';
}
```

**It must fire on a commit, not on a value change.** "The user changed a
parameter" is not an event the code has — writes happen per keystroke and per
drag frame. Keep a dirty flag set where the value is written, and clear it at the
places that actually end an interaction:

| ends an interaction | what it is |
|---|---|
| the field loses focus | typing finished |
| the picker popup closes | dragging finished |
| a reset is applied | the value changed by itself |

Opening a picker and closing it unchanged must produce nothing — that is the case
the dirty flag exists for, and it is the one a naive implementation gets wrong.

One more, from the same build: give each such hint its own *once per session*
flag, keyed by whatever scope the spec names (panel, screen, feature). A single
global flag makes the second hint unreachable after the first is dismissed, and
no measurement will ever show it.

## State that survives a rebuild but not a session

Register control state idempotently, and clear it explicitly when the flow
restarts:

```js
function registerSlot(id, initial) {
  if (CP[id]) return;        // a rebuilt block keeps what the user set
  CP[id] = initial;
}
// on entering the editor: for (const k in CP) delete CP[k];
```

Without the guard, re-rendering a block resets the control the user just
touched. Without the clear, a fresh session starts with the previous one's
state — and a prototype that "always opens in its default state" quietly
doesn't.

## A focused field does not survive a repaint

"State lives in a variable, and its zone is repainted from it" is the right rule
everywhere except inside a text field the user is typing in. Repaint on every
keystroke and the element is replaced: focus is gone, the caret jumps to the
start, and the next character lands somewhere unexpected.

The exception, in three parts:

* while the field has focus, **write to state and patch the affected nodes by
  hand** — the swatch next to a hex field, say — instead of re-rendering the
  panel;
* **repaint fully on commit** (blur, or Enter), which is also where an
  incomplete value is normalised or reverted;
* if a popup mirrors the value, update the popup from the state on each
  keystroke — it is not the element being typed into, so rebuilding it is safe.

Sanitise in place and restore the caret, or typing in the middle of a string
throws the cursor to the end:

```js
const clean = inp.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6);
if (clean !== inp.value) { const c = inp.selectionStart; inp.value = clean;
                           try { inp.setSelectionRange(c, c); } catch (e) {} }
```

## Small things worth knowing

**`width:max-content`** lets a pill shrink-wrap its label while everything
around it keeps absolute canvas coordinates.

**Centre the canvas with `margin:0 auto`, not flex.** In a window narrower than
the canvas, `margin:auto` degrades to left-aligned with a scrollbar and nothing
is cut off; centring flex clips the left edge.

**Resolve reference chains on read, not on write.** If `Neutral → All text →
per-block colour`, do not push updates down the chain — resolve each value when
rendering. One flat repaint pass then covers any depth and cannot recurse.
