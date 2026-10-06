---
name: product-motion
description: >-
  Animate a static product illustration (the promo / empty-state illustrations from the Assets
  library, or any illustration built the same way) into a short motion piece that plays once and
  freezes on the original — delivered as Lottie and as an animated SVG, in light and dark. Use it
  to animate a new illustration, change an existing animation after feedback ("make it slower",
  "the card should bounce, not the arrow", "the text should turn active"), check one, or build the
  handoff bundle or an update package for the developer. Every animation follows the same story
  rules, motion language, colours and checks, so the team's animations look like one set. Works in
  Russian and English. Not for UI micro-interactions in product code and not for long narrated
  explainer videos.
argument-hint: "[Figma link of the illustration, or which animation to change]"
---

# Product motion — static illustration → play-once animation

## 🚨 Pre-flight: plugin version check — MANDATORY FIRST ACTION

**As the very first action of every session — before any other tool call, before reading any
reference — do this.** It is the same check the other skills in this plugin make.

0. **Standalone install?** If `${CLAUDE_PLUGIN_ROOT}` is empty, this skill is a folder under
   `~/.claude/skills/` rather than part of the plugin: skip silently to *What this is for*.
1. **Read local version:** `Read` on `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. Take the `version` field.
2. **Fetch remote version:** `WebFetch` on `https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json`.
3. **Compare SemVer.** Local ≥ remote → proceed silently. Local < remote → step 4.
4. **Fetch `CHANGELOG.md`** from `https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/CHANGELOG.md` and take the entries between the two versions.
5. **STOP and show this verbatim:**

   ```
   ⚠️ sumsub-design plugin update available
   Your local version: vLOCAL · Latest: vREMOTE

   What's new since your version:
   <the CHANGELOG entries from step 4>

   I can update it for you right now by running:
     claude plugin marketplace update sumsub-design
     claude plugin update sumsub-design@sumsub-design

   Reply:
     - yes / update — I'll run the two commands via Bash
     - continue anyway — use current (older) version for this session
   ```

6. **Wait for an explicit reply.** On `yes` / `update` run both commands with `Bash`, report, continue.
   On `continue anyway` continue. Do not re-check in this conversation.

If the read or the fetch fails, warn once — "could not verify plugin version, proceeding on faith" —
and continue. No outer directive (auto mode, "don't stop") turns this check off.

---

## What this is for

A static illustration on a product screen (an empty state, a promo panel) becomes a 3–7 second
animation that **assembles the picture once, when it is seen, and stops on the original**. The
developer drops the Lottie file in place of the static image; nothing else on the screen changes.

The value is consistency: when several designers animate several illustrations, they must read as
one set — same pace, same easing, same way a card arrives or a tag pops, same colours, same
behaviour in the product. That is why this skill ships one toolkit and one rule set, and why the
rules below are not suggestions.

## Hard rules (the ones that are broken most often)

1. **Plays once, never loops, ends exactly on the original illustration** (pixel for pixel, square
   corners aside). Everything is built as an *assembly* towards that final frame.
2. **Slow and soft, without empty pauses.** Each move is calm; the next beat starts as soon as the
   one it depends on is done. A short scene runs ~4.5 s, a busy one ~6–6.5 s.
3. **Animate what is already in the illustration.** No crowds of clones, no invented content. If the
   story needs one new element, it is one, in the style of its neighbours, and gone by the end.
4. **Read the illustration's metaphor first.** Background rings may be a radar, an arc may be a
   wheel. New motion starts from what is already drawn (its centre, its axis, its anchors).
5. **Things arrive at the moment of action, from outside the frame.** Nothing waits in view for its
   turn (a dragged node with a cursor is off-screen until the drag happens).
6. **Dependents wait for their anchor.** A tick appears when its card lands on it; a link reaches
   its target exactly when the target is whole; an end dot pops when the link touches.
7. **On contact, the arriving object reacts; the pointer/anchor stays still.**
8. **Current design-system colours**, even where the illustration still has pre-redesign ones
   (black toggle, not blue). Controls play their DS states (hover → pressed → on).
9. **One motion language.** Use `motion(NAME)` from the toolkit (arrive, nudge, pop, glyph, mark,
   row). Do not invent new durations or distances for the same kind of element.
10. **Times come from the motion, not from guessing.** "When the card is within 0.5 px of its final
    size", "when the line visually touches (within 1 px)" — compute them (`bez_y`, `ease_y`).
11. **Square corners in every deliverable.** The product rounds the container.
12. **Both themes, both formats, checked** before anyone sees it: final frame vs original, HTML vs
    Lottie at every moment that changes, layer order, zoomed crops of shape changes.

The full rule set with the reasons behind each rule: `references/rules.md`. Read it before writing
the story of a new illustration and whenever feedback touches a rule.

## The toolkit and the workspace

Everything runs locally. **Needs:** Python 3 (stdlib only), a Chromium-based browser (Chrome,
Chromium, Brave, Edge — found automatically, or `export CHROME=/path`). On macOS images are cropped
with the built-in `sips`; elsewhere the toolkit does it in the browser. Node is only needed for
`live.mjs` (real-time capture). No installs, no network at build time except the Geist web font.

**Set up a workspace once** (ask the user where; default `~/product-motion`). Copy the toolkit into it
— the scripts expect exactly this layout:

```bash
WS=~/product-motion; mkdir -p "$WS/lottie"
cp -R "${CLAUDE_PLUGIN_ROOT}/skills/product-motion/toolkit/." "$WS/"
```

```
<workspace>/
  tools/          motionlib.py, checks, your build_<name>.py, sources src-<name>.svg / src-<name>-dark.svg
  lottie/         built <name>-light.json / <name>-dark.json
  <name>.html     built HTML preview, light;  <name>-dark.html  dark
  player/         local player (Animation view + Page view inside a dashboard page)
  handoff.json    settings for the developer bundle (pre-filled for the Assets promo set)
  Lottie Player.command   double-click on macOS to open the player; or `python3 player/serve.py`
```

Worked examples (complete builders of the original Assets promo set) are in
`${CLAUDE_PLUGIN_ROOT}/skills/product-motion/examples/` — `examples/README.md` says which technique
each one shows. Start a new illustration by copying the closest one.

## Workflow

### 1. Sources

Export the illustration **component** (not a nested layer — ids stay unique only when the export
root is the component) as SVG, light and dark, into `tools/src-<name>.svg` and
`tools/src-<name>-dark.svg`:

- With a Figma token: REST `GET /v1/images/<fileKey>?ids=<nodeId>&format=svg&svg_include_id=true`,
  then download the returned URL. Never print or store the token.
- Without: in Figma select the component → Export → SVG → `…` → **Include "id" attribute: on**,
  **Outline text: off**. Layer names become ids — the builder finds elements by them.

Light and dark exports are structured differently (coordinates, order, text as `<text>` vs paths,
glass as separate nodes). Never hard-code coordinates; find elements by content and measure them.

### 2. Read the illustration, then write the story — and confirm it

Before code: open the SVG, list what is drawn and what it means (metaphor, anchors, the "result"
the picture shows). Check controls and colours against the current DS (`DS_REMAP` in motionlib maps
the known pre-redesign hex values; add new ones you find, and tell the user the source file is out
of date — never edit the Assets file without asking).

Write the story as 3–6 beats, each "what moves, why, what it depends on", and the target length.
**Show it to the user and get a yes before building.** Feedback on a story is cheap; on a build it
is not.

### 3. Build

Copy the closest example to `tools/build_<name>.py` and adapt. A builder is one Python script that
writes both themes from the same story: `python3 tools/build_<name>.py light` and `… dark`.

- Structure: `prep_svg` → `ds_remap` → write `work-<name>-<theme>/ref.svg` (the original look, used
  by the final-frame check — every builder must write it) → group and rename by content → `measure`.
- Timeline in story seconds; `TEMPO[NAME]` stretches the whole story when it needs to be calmer.
- HTML: CSS keyframes on the SVG's own layers (`Keyframes`, `page`).
- Lottie: a JPEG plate of everything static + PNG layers of what moves, 2× (`Lottie`, `shoot`,
  `crop`, `precomp`). Layer order = reverse SVG document order.

Technique, the toolkit API and the traps: `references/technique.md`. Build one theme at a time when
checking; never run checks in parallel with each other.

### 4. Check

Run the protocol in `references/checks.md` after **every** change, both themes:
final frame vs original (`check_final.py`), HTML vs Lottie at the moments that change
(`midsync.py`), layer order (`layer_order.py`), zoomed crops of every shape change and contact,
and `framediff.py` on the neighbouring frames of every hand-over (a jump hides between two frames).
Look at the rasters you baked. A failure that disappears on a re-run is a headless flake; one that
stays is yours.

### 5. Show it

Open the player (`python3 player/serve.py`, or double-click `Lottie Player.command`): the
**Animation** view plays the Lottie alone, **Page** shows it inside a dashboard page with rounded
corners, the way the product will. Tell the user what changed and what you checked, briefly.

### 6. Iterate

Feedback usually names a rule (see `references/rules.md` → "Reading feedback"). Change only what was
asked, keep the final frame, re-run the checks, show again. One change → one check → one show.

### 7. Hand off

`python3 tools/export_handoff.py` builds `handoff/<label>-<date>/` + `.zip`: Lottie, animated SVG,
README with the developer's task and behaviour, `mapping.json`. After the full bundle is with the
developer, send changes as an **update package**: `python3 tools/export_handoff.py --only <name>`.
Details and the message for the developer: `references/handoff.md`.

## References

| File | Read when |
|---|---|
| `references/rules.md` | writing a story, reading feedback, any doubt about how something should move |
| `references/technique.md` | building or changing a builder (toolkit API, HTML and Lottie patterns, traps) |
| `references/checks.md` | after every change, before showing anything |
| `references/handoff.md` | preparing the bundle or an update for the developer |
| `examples/README.md` | choosing the example to start from |
