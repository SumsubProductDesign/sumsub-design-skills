# Rules — story and motion

Every rule here came from design review of the Assets promo set (16 illustrations × light/dark).
Each has the reason behind it: when a case is not covered literally, follow the reason.

## A. What the animation is

**A1. Play once, freeze on the original.** The illustration sits on a product screen; constant motion
distracts. The animation only *assembles* the picture when it appears, then becomes the static
illustration again — the final frame equals the Figma illustration pixel for pixel (with the DS colour
fixes from C1, and square corners). No exit phase, no reset, no loop. Length = the end of the last
event; trim the tail.

**A2. It is seen before it plays.** It starts when at least 30 % of it is in view and the tab is
visible (built into the toolkit's HTML and documented for the developer). `prefers-reduced-motion`
→ the final frame fades in, nothing moves. `prefers-reduced-transparency` → glass becomes near-solid.

**A3. Slow and soft, no empty pauses.** Every move is calm (spring-like ease: fast start, long soft
landing); events do not queue with dead air between them — the next starts as soon as the one it
depends on is done, independent things run in parallel. Short scenes ~4.5 s, busy ones ~6–6.5 s.
If a review says "too fast, can't follow", stretch the whole story (`TEMPO[NAME]`), do not
re-time single beats. If it says "takes too long", remove the waits, do not speed up the moves.

## B. The story

**B1. Read the metaphor before adding anything.** Background and decoration are often part of the
story: concentric arcs = radar rings with a centre (the sweep starts from *that* centre), an arc =
a wheel the tags ride on, a map = where devices are. Measure them (fit the centre to the ring edges)
and build new motion from those anchors.

**B2. Animate what exists; no clones, no invented content.** A "roulette" means the existing cards
move step by step along the wheel with easing — not a fast spinning drum of copies. If the story
cannot work without a new element, add exactly one, styled like its neighbours, and make sure it is
gone (or has become an original element) by the final frame. When asked for "a duplicate / a full
card", change exactly the named fields; do not invent "logical" content.

**B3. Things enter at the moment of action, from outside the frame.** A node dragged with a cursor is
off-screen until the drag happens, then slides in; nothing waits in view "holding" its turn.

**B4. Physically readable swaps.** Replacing one object with another reads as a real action: a new
card comes out from under the old one and lands on top, the old one goes under (a deck). Crossfades
only where two objects occupy exactly the same place.

**B5. The object becomes the target.** When a card goes behind another, *it* becomes the background
card on its way — the target look is built in the moving object's coordinates and revealed along the
path. Swapping to the original layer happens only where they match pixel for pixel (one invisible
frame). The same backwards: an element that comes out of the background starts as the background one.

**B6. A focus change is explicit.** If a feed shows a previous item before the final one, make the
previous one clearly different (another face / name / score colour — and no shared surname: two "… Chen" in a row
were noticed) and show where it goes: it
collapses into the shape of a feed row, moves into the feed, shrinks to the rows' scale and fades.

**B7. Dependents wait for their anchor.** A mark on an empty spot, or a dot on a card that is still
growing, reads as a glitch. A tick appears when its card lands on it; a link's end dot appears when
the target reaches its final size; a link is drawn so that it *reaches* the target exactly when the
target is whole; data arriving over a link appears from the point where the link touches it, after
the link has arrived. Compute those moments from the motion (see C4).

**B8. On contact the arriving object reacts; the pointer stays still.** The fixed reference (an arrow,
a cursor) does not bounce; the card that reaches it is knocked a few px away and settles. A knock is
allowed only at a stop after momentum. The card under the pointer can also take the "active" state
(e.g. its text turns to the active colour while it is there and back to grey as it leaves).
"Active" = the colour it will have in its next state, so a hand-over has no colour jump.

**B9. Loading states resolve in step with the process.** A block that shows a process result starts
as a DS skeleton shaped like its data (bars where text goes, circles for badges, pulsing 1 → .5 → 1);
each placeholder turns into data at a visible step of the main action; the last one together with
the last step. Cause and effect appear together (the flag in the tree and the "!" in the panel).
Connecting elements between results reach the next one exactly at its moment. The final metric
(time, total) comes with the last data; the verdict (status) comes last.

**B10. A value that builds up is visible at every step.** A score or a sum computed along the way is
shown from the first step with its intermediate value — never a skeleton that loads at the end. A
category change (Low → Medium) is a morph of the same element: the colour flows, the width grows
from the centre, the label changes with direction (old one up and out quickly, new one from below a
little later), never an empty frame or two words on top of each other; change the word only once
the container already fits it.

**B11. A counter "N word" grows like text.** The left edge of the number stays, the word moves in the
same frame as the new digit. Only values that actually land on a frame are drawn.

**B12. An accordion stays one card.** The collapsed state looks exactly like its collapsed
neighbours (same height, header fill, border on all corners). On expand, the bottom edge (corners +
bottom border) is its own element that travels with the edge of the reveal, with the same easing;
the content opens under it; at the end the original border takes over. Glass and frames around it
follow the same rule — real contours from the file, never temporary round corners.

**B13. Growing shapes keep their real corners.** A shape with Figma's smooth (squircle) corners must
not be clipped with a circular `round` — move its real bottom strip. Lifting a path only works while
the shape is at least two radii tall along the whole way.

**B14. Fast thin things get motion blur.** A radar beam turning ~1°/frame with a hard edge strobes at
60 fps. Give it a soft trail of ~2.5 frames of travel and a soft front of ~1 frame (smoothstep), and
do not hurry it.

**B15. Things that travel together keep their spacing.** Cards riding one wheel or track keep the same step between
them until the story separates them; then they part with the move that needs it (a card that rode 15° behind
neighbours spaced 9° apart read as "lagging" — it now keeps the step and drops back only as it reaches the pointer).

**B16. A marker sliding along a track starts softly and keeps its shape while it moves.** It is already in view, so a
spring that is at full speed in the first frame reads as a twitch; slide it with a soft start and a long landing. Its
tooltip changes size only once it has stopped (within 0.5 px) — widening while it still moves sends one edge backwards
against the motion, which reads as jerky.

**B17. When review asks to change content, the final frame changes on purpose.** Keep the layout (pick a replacement
with the same ink width, set labels in the source's exact text style), write the new final look to `ref.svg` so the
checks compare against it, and tell the user that the static illustration in the source file is now out of date.

**B18. Hand an object over to its own layer while it still moves, never with a switch at rest.** A scaled render and the
element's native render differ even when the geometry is exact: anti-aliasing of scaled text, edges and corners, and a
baked opacity vs a live one. A one-frame switch at rest shows all of it as a jump (seen at the corners first). Instead:
an opaque copy of the target rides inside the moving group (placed by the inverse of the group's end transform, so the
group lays it exactly onto the target) and fades in over the last ~0.3 s, while about 1 px of travel is left; then the
source's own body fades out under it; at rest the target takes over drawn from the same raster with live opacity, so
the switch frame changes nothing. Translucent things cross-fade inside one group opacity (opaque copy on top, the group
carries the translucency) — two translucent layers cross-fading dip in tone. Don't put the group's mask on the copy: it
cuts the copy's anti-aliased edge. Text that has to change style on the way (size, weight, tracking) gets a twin in the
target's style that cross-fades in while it moves.

**B19. Things leave the way they came, and a move back mirrors the move out.** An element that slides in from the
right leaves to the right; a card that folds into a feed row unfolds out of that row; a tooltip or popover grows from
its anchor and shrinks back into it (`transform-origin` on the anchor, not on its own centre); rows a feed scrolls up
keep going up and out of the frame instead of fading in place. A reversible move uses the mirrored curve on the way
back — for `cubic-bezier(x1, y1, x2, y2)` out, `cubic-bezier(1−x2, 1−y2, 1−x1, 1−y1)` back — so both directions feel
like the same motion. (apple-design §7, spatial consistency.)

## C. Look

**C1. Current DS colours.** Many source illustrations predate the dashboard redesign (blue primary,
old greys). Product motion must look like the live product: map old hex values to current semantic
tokens per theme (`DS_REMAP` in motionlib; add new pairs you find, resolved from the Base components
variables). Controls (toggle, checkbox, radio, buttons, tabs) take the DS component's colours per
state; a clicked control plays hover → pressed → on. Country flags are not DS colours — leave them.
Tell the user when the Assets source is out of date; never edit it without asking.

**C2. Skeletons.** DS skeleton token on a white card (`SKELETON[theme]["card"]`), one step darker on a
grey plate (`["plate"]`, the token is invisible there). If grey placeholders are part of the original
illustration and stay in the final frame, keep their original colour.

**C3. Exactly on the anchors.** Stops are computed from the element's *visual* centre (its rect's
bbox), not from a transform parameter. Equal gaps to an anchor, centres on the anchor's axis; a card
that should sit level at a stop is counter-rotated around its centre; everything returns to the
illustration's geometry by the end. Verify numerically (`check_stops.py`), not by eye.

**C4. Times come from the motion.** "When the card has landed" = when its eased position is within
0.5 px of the end; "when the line touches" = when the eased reveal is within **1 px** of its end — an
ease-out passes the last pixel visibly earlier than its formal end, and waiting for the formal end
reads as late. Use `bez_y` / `ease_y`; never guess seconds.

**C5. Square corners.** Deliverables have square corners; the product rounds the container (16 px
for the Assets set). Only the player's Page view rounds its slot, the way the product will.

**C6. Country flags are pictures: the same in both themes.** Some dark illustrations in Assets bind a flag's white base
to the dark surface and its black to the light text colour, so in dark Austria's white stripe turns black. `prep_svg`
fixes it for every dark source with a light sibling: a flag fill whose light and dark values swapped (luminance apart by
more than half) goes back to the light value; a near-white base fixed in the source is left as drawn. Icons such as
`normal/flag` are not flags and keep their theme colours. When you see one, also tell the user which dark component in
the source file still has it, so it gets fixed there too.

**C7. Move and fade with `transform` and `opacity`; never animate layout.** Position, size and rotation go through
`transform` (a wrapper group when the element has its own `transform` attribute); appearing and disappearing through
`opacity`. Never animate `x`/`y`/`width`/`height`/`d`/`r` attributes, `top`/`left`, or a font size — they re-lay out
and repaint every frame and step on whole pixels. A size change is a `scale` of a wrapper or a clip that opens, not a
new width. The few other properties have one job each and stay on one element for the length of that move: `fill`
for a colour change, `stroke-dashoffset` for a line drawing itself, `clip-path` for a fold or a reveal,
`backdrop-filter` for glass, a `drop-shadow` that fades out. In Lottie the same holds by construction: layers move by
their transform, colours change by cross-fading two rasters. (apple-design §11, frame-level smoothness.)

## D. The motion language (`motion(NAME)`, real seconds / px)

| Kind of element | Values |
|---|---|
| Card / surface arriving | rise 14 px from below, 0.8 s, fade 0.4 s |
| Line of content sliding in (as its skeleton goes) | nudge −4 px, 0.5 s, fade 0.38 s |
| Status / tag / pill / badge popping in | scale .85 → 1, 0.55 s, fade 0.25 s |
| Small glyph (check mark, badge, node dot) | scale .4 → 1, 0.4 s, fade 0.2 s |
| Identity mark (avatar, flag, company/document icon) | scale .6 → 1, 0.5 s, fade 0.2 s |
| Row joining a list from below | rise 6 px, 0.65 s, fade 0.38 s |
| Stagger between siblings | 0.05–0.08 s |
| Colour change (text turning active / grey) | one fade (0.4 s), ease-in-out |
| Marker sliding along a scale / track | soft start `(.45, 0, .25, 1)`, ~0.7 s |

Ease: `E` (critically damped spring: moves at once, long soft landing) for moves; `APPEAR` (= `E`, no
bounce) for anything that merely appears; `OVERSHOOT` only for a stop after momentum (a roulette
landing); `IO` ease-in-out for colour and for things going back. The same kind of element moves the
same way in every illustration — if a new kind of motion is needed, add it to `LANG` with its
reason, do not hard-code numbers in one builder.

## E. Reading feedback

Reviewers describe symptoms; map them to the rule before changing code.

| They say | Usually means |
|---|---|
| "too fast, hard to follow" | A3 — stretch the story (`TEMPO`), keep the order |
| "takes too long" / "it should appear as soon as …" | A3 — remove waits, start the beat on its cause |
| "looks like it held it the whole time" | B3 — bring it in from off-frame at the moment of action |
| "it disappears and another one appears" | B5 — the object must become the target |
| "doesn't hit the centre of the arrow" | C3 — compute stops from the visual centre, verify numerically |
| "appears a little late / early" | C4 — use the visual moment (1 px), not the formal end |
| "the tick/dot appears before the card is there" | B7 |
| "the arrow shouldn't bounce" | B8 |
| "it lags behind the others" | B15 |
| "moves a little jerkily" | B16 — soft start, no shape change while moving; trace it per frame |
| "it jumps between frames N and N+1" | B18 — and prove the fix with `framediff.py` on those two frames (checks §3) |
| "same names / surnames" | B6 / B17 |
| "the skeleton shouldn't exist / should load step by step" | B9 / B10 |
| "corners look wrong", "two frames on top of each other" | B12 / B13 — and check the Lottie, not the HTML |
| "blue toggle" / "old colour" | C1 |
| "the flag is inverted in dark" | C6 |
| "it comes in from one side and leaves to another" | B19 |
| "it stutters / steps while it moves" | C7 — and measure it (checks §3) |
| "it loops" | A1 |

When the feedback is about something seen in the player, it is the **Lottie** — reproduce it there
first. Ask for the frame or a screenshot when the symptom is not clear.
