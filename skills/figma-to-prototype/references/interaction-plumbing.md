# Interaction plumbing

Everything here is a bug that looks like something else. A dead click looks like
a missing feature; a popup that closes on mousedown looks like a state bug; a
tooltip that never appears looks like a CSS typo. Knowing the shapes saves the
hunt.

## Contents

- Hit layers go last
- Capture phase when the handler re-renders its own target
- Keep canvas coordinates under a scroll
- Canvas-level hosts for anything that escapes a clip
- Popup placement, derived
- A delay is not an animation
- Timed transitions — one timer per loading state
- Every state a check needs is a hash route
- An event-driven element needs its own host and a commit, not a value change
- State that survives a rebuild but not a session
- A focused field does not survive a repaint
- Small things worth knowing
- Step 6 in full — build one working thing at a time
- Hover policy

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

## Timed transitions — one timer per loading state

A loading state the frames draw (the kit's ring or dots, a state named Loading /
Uploading / Processing) has no drawn exit, so Step 0 asked once how it ends —
*timer and tap*, *timer only* or *tap only* (SKILL.md Step 0, *behaviour the
brief names but no frame draws*). **The question is for states that draw a
loader, and for them only.** Every other transition without a button on the task
path — the viewfinder that frames the document, the shutter, a sheet closing —
is by tap, said in the defaults line and never asked: run 16 put the camera's
four button-less transitions into one question and offered timers for all of
them, when two of the four were a loader. The plumbing is the same for all three:

* **One `setTimeout` per loading state, in `gen.js`, armed where the state is
  entered and cleared wherever it is left** — by its own firing, by the tap, by
  the back chain, by a `#hash` route. Keep the id in one global (`loadTimer`)
  and clear it at the top of the route function, so a tap that already advanced
  the flow is not followed by the timer advancing it again. **The tap handler is
  shared**: both exits call the same route function; the timer's callback is
  nothing but that call, and under *timer only* the state simply has no hit
  layer.
* **The seconds are a placeholder, not the product's.** One named constant at
  the top of `gen.js` (`UPLOAD_MS = 2000`), a row in the handoff's § Placeholders
  with the network as *who has the real one*, and the interaction inventory says
  which states advance by time (`assets/handoff-template.md` § 6). The presenter
  reads both before the demo.
* **Check it through `--device`, in real time**: `statecheck.sh --device` reads
  the page once the probe has written its answer (up to 8 s), so a probe that
  returns a Promise settled after at least the timer's length sees the state
  after it — `--probe 'return new Promise(r=>setTimeout(()=>r(location.hash),2200))'`
  — and `--hits` / `--texts` run at that moment too. The tap exit is checked like
  any other route: `--js` with the tap, `--probe` with the hash. Both are Step 7
  behaviour probes, one per loading state.
* **A render of the state itself goes through `--device` too, or holds the
  timers.** `shoot.js` and `statecheck.sh` without `--device` render under
  Chrome's virtual time, which runs every `setTimeout` to its end before the
  shot: a timed state renders as the state after it, and nothing in the PNG says
  so — run 16's 1440 baselines showed the iOS dialog for the camera's dots and
  Verified for Uploading, and the handoff called them the regression reference,
  while the 375 ones went through `--device` and were right. A timed state is
  shot through `--device` (real time: the shot about a second after load, before
  a 2 s timer) or with its timers held — the route function reads a `?hold`
  suffix on the hash, so `#upload?hold` is the state as drawn with no timer
  armed, for `shoot.js … '#upload?hold'`, `statecheck.sh --hash '#upload?hold'`
  and `blockgate.sh --hash '#upload?hold'` alike; `--js 'window.__proto.timers(false)'`
  holds them from a probe. `shoot.js` prints one warning line when a page that
  sets timers is shot with neither.

  ```js
  var loadTimer = null, hold = false;
  window.__proto = {timers: function (on) { hold = !on; if (!on) clearTimeout(loadTimer); }};
  function show(hash) {                                   // '#upload' or '#upload?hold'
    var held = hold || /\?hold$/.test(hash), name = hash.slice(1).replace(/\?hold$/, '');
    clearTimeout(loadTimer); loadTimer = null;
    …                                                     // show the screen `name`
    if (name === 'upload' && !held) loadTimer = setTimeout(function () { go('verified'); }, UPLOAD_MS);
  }
  ```

* **The loader's own animation needs nothing.** The kit's ring and dots animate
  as rendered, rule 5's one exception; `references/websdk.md` § What the kit
  does not have has the loading rows. This section is about the state's exit,
  not its motion.

## Every state a check needs is a hash route

`gen.js` gives every state that a gate, a probe or a baseline renders a `#hash`
route — the screen after Save, the form switched to its other mode, the toast —
read by one route function **on load and on `hashchange`**, which sets the state
the same way the clicks do (calls the same handlers, so the derived state follows).
`statecheck.sh --hash`, `blockgate.sh --hash` and `shoot.js` all load the page at
the hash; a state reached by clicks only renders as the first screen there. Both
gates compare the hashed load with the plain one and print one line —
*the hash changed nothing: the page has no route for #x* — when they match: add
the route, or force that state with `--js`. Run 18 read a 476px residual off its
first screen before it noticed (2026-10-14).

```js
function route() {
  var h = location.hash.replace(/\?hold$/, '');
  if (h === '#custom' || h === '#saved') pick('custom');     // the handlers a click runs
  if (h === '#saved') { field.value = PROFILE_ID; save(); }
}
route(); addEventListener('hashchange', route);
```

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

## Step 6 in full — build one working thing at a time

**Add a single capability, check it, then add the next** — a break then sits next to
the change that caused it. One primitive per control family, written once and
parameterised; anything shared across screens built **once**; panels off a registry, so
adding one is one entry.

Four rules that decide a lot of small questions, each worked out in a reference:

* **Changed → saw is the deliverable.** Every live control gets a named visible
  consequence as you build it, asserted in Step 7; a preview that updates the
  wrong thing invalidates the session. `research-prototypes.md` §4.
* **Verbatim for chrome, computed for state.** A mock's handle positions are
  illustrative; compute them from the real value. `architecture.md` § Verbatim for chrome, computed for state.
* **Any state affecting more than one node lives in a variable, not in the
  DOM**, and its zones are repainted from it. `architecture.md` § One value, several write paths, `theming.md` § Palette plus accessor, not conditionals.
* **A brief constraint outranks an implementation suggestion.** If the user says
  "just use a colour-picker library" and the brief forbids CDN dependencies, say
  so in one line and implement it inline — for a prototype, writing the control
  is nearly always cheaper than inlining a library.

The sections above cover the bugs that look like something else: hit layers,
capture-phase mousedown, scrolling without losing canvas coordinates, delays that are not
animations, popup placement, state lifecycle. Adaptivity is scale-only, one factor in one
variable applied in one place — `architecture.md` § Scale-only adaptivity.

## Hover policy

**Decide the hover policy in Step 0, not mid-build.** It covers the controls
a task can reach; scenery outside the tested area is a picture unless the
*entrances outside the task* parameter says otherwise. A policy that survived review:

| element | hover |
|---|---|
| buttons, icon buttons, fields on white | fill `#F3F4F6` (neutral/10) |
| table row | `#F9FAFB` |
| anything already filled `#F3F4F6` | `#E5E7EB` |
| left-menu items | exactly the selected style from the mockup |
| dark primary buttons, gradient buttons, toggles, radios, avatars, breadcrumbs | rule does not apply — a grey wash would repaint the control itself. Cursor only, or agree each one separately |

Inside the tested area, inertness is expressed **only** by nothing happening
beyond the control's own state — the radio still picks, the menu still opens. Never a grey cursor, never `pointer-events:none`, never a `disabled`
style unless the mockup has one — there, a respondent must not be able to tell
live from dead before clicking. Outside it, a picture is a picture.
