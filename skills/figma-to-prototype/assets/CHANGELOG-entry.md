# The entry for the plugin's CHANGELOG.md

Paste this **at the top of the entry list**, under the `---`, when this skill is merged into
`SumsubProductDesign/sumsub-design-skills`. Replace `vX.Y.0` with the version the release bumps
`.claude-plugin/plugin.json` to, and the date with the merge date — the number is the release's
to choose, not this file's.

Why it matters that this lands with the merge and not before or after: the pre-flight check in
every skill shows these entries verbatim to a colleague who is behind, and that text is the whole
reason they say yes. An entry without the skill announces something nobody receives; a skill
without an entry arrives silently.


---

## v3.274.0 — 2026-10-14 (figma-to-prototype: WebSDK prototypes, from the kit's own components)
The first WebSDK prototype built with the skill (address autocomplete) had to find its own way to the kit and to every mobile check; that way is now the skill's, tested on five eval runs over two flows (Switch device on desktop frames, General flow on mobile frames with a camera) and one dashboard regression run. User-visible:

- **A websdk profile.** Step 0 reads it from the frames (a `Widget` root, the WebSDK top bar) and says so in the defaults line; from there the shell is the widget, the controls are the kit's, the page is responsive as the SDK is, and the checks run at 1440 / 744 / 375. `references/websdk.md` has it end to end.
- **The WebSDK UI kit ships with the skill**, taken from its Storybook (`sbkit.cjs`, 189 stories of 56 components, hashed class names renamed to stable ones), with icons, flags and Manrope. `websdk/controls.js` renders it: header with the step ring, fields, select with flags, radio groups, toggle, buttons, modal and bottom sheet, splash screen, tips, loaders and more — plus `cameraFrame()` (the camera step from the Organisms component, only the live picture baked, an `overlay` for Uploading) and `sumsubIdBlock()` (the Welcome's Sumsub ID block), which the kit has no story for.
- **Dialogs as the product draws them:** picked by the frame's instance name (*Modal / Bottom sheet* → `bottomSheet()`, *Modal / Full* → `modal()`) at every width, and hosted by the page, so the tint covers the top bar and "Powered by" with no white gaps.
- **The widget gate** (`websdkgate.sh`) compares the frame with the kit's widget by landmarks and cuts browser or phone chrome above and below the page; the kit's 68px bar against the frames' 60 is a known ledger line.
- **Renders at a phone's width.** Chrome's command line clamps a window to 500px; `statecheck.sh --device` and `shoot.js --device` render through the DevTools protocol at exactly 375. A timed state is shot through `--device` or at `#state?hold`, and `shoot.js` warns when a page's timer fired before the shot.
- **Two new Step 0 questions, for every profile:** an unfilled mockup (identical rows, a component's default text) is one question — *verbatim*, *proposed* (recommended for a demo) or *given* — never copied or replaced silently; and a loading state the frames draw is asked how it ends — *timer and tap*, *timer only*, *tap only*.
- **The canvas question offers the elastic mode first** whenever the frames are wider than the test's screens.
- **The kit's loaders animate** (rule 5's one exception); a loader is never baked into a plate.
- **Checks that used to fail silently now say so:** `--hash` without its `#`, or one the page has no route for; a headless Chrome that hangs is killed on a clock (`CHROME_TIMEOUT`, 60 s) instead of holding a commit for hours.
- **Checked against Anthropic's skill-authoring guide again:** its hard limits on `name` and `description` now fail lint, and the guide's checklist rules are each kept by a lint check or a pre-release step (`references/tools.md`).
- Internal: `dscheck.js --spec` watches 42 of the kit's values; the run-log template, the transcript lookup of `runstats` / `modelcheck`, the MCP traps (a cut modal context, nested ids in `download_assets`) and the eval sheets (`eval-websdk.md`, run 18 in `eval.md`) updated.
