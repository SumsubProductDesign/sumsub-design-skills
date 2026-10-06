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

## v3.267.0 — 2026-10-06 (figma-to-prototype: questions as forms, the library's table, calendar and skeleton, three runs' worth of fixes)
Eleven runs by four designers since v3.204.0, each run log read against the eval and the fixes made at the sentence that let the miss through. User-visible:

- **Step 0 asks through the native question form** (`AskUserQuestion`), never as text: the purpose first, the parameters only after the frames' metadata, 2–4 options with the recommended one first. A parameter with a written default is not a question — the defaults go to the chat as one line — so a three-frame brief gets four or five forms where the first run of this got nine, and nothing the brief has already said is asked again.
- **Five purposes, each with its recipe:** moderated interview; demo to the team — a *logic demo* is checked row by row against the person's rule table (`rulecheck.cjs`); handover to engineering — states and edge cases, from its first real run; **unmoderated test** (Wynde / Maze / Lyssna) — one tab, the test bar and the outcome screen from `test-scaffold.js`, shortcuts in words, a rehearsal through the platform (`references/unmoderated.md`); a viewer over real data is not this skill.
- **Invent no domain data.** Every value a task needs that no frame draws is a question with three answers — *given*, *take it from X*, *make it up* (then a placeholder in the handoff) — and a behaviour the brief names but no frame draws is described in a line before it is built.
- **The model check.** A session on Sonnet or Haiku, or below medium effort, is offered a switch once (`modelcheck.cjs`); the team runs the skill on Opus or Fable.
- **The library grew:** `list-table.js` is the product's SnsTable (current geometry, expanding rows, the divider drawn above the hover); `calendar()` — SnsDateCalendar and the range picker; `skeleton()` — SnsSkeletonBlock, the one animation rule 5 allows; `modal()` with the scroll footer; `titleIcon` on radio and checkbox; Geist Mono embedded by the shell. The shell carries the frame's own sidebar as a plate when asked, scrolls a fixed canvas's island, and computes the slot's 20 under the header and the floor's matching `minWidth`. Fixed: the grey card's frame, the disabled button's cursor, the header's AI button class leaking onto a page's own `.ai`.
- **Verification:** `statecheck.sh --hits` (is every live control reachable by a real click), `--texts` / `--texts-in` (every string of the design on the page, in its zone), `--frames` (a 1px frame along its whole perimeter), probes that return a Promise, scripts from files, a probe that does not parse says so and `--rects-of` beside a probe is refused rather than silent; `fluidcheck.sh` names text that wrapped; `blockgate.sh` checks a block against its node's render; `shellgate.sh` tells an older frame's shell (`OLDER`) from a different one (`ASK`) and never asks twice after Step 0.
- **Plates:** exactly 2x from both sides, a photo as WebP (`encode.sh`), each pixel baked once, a plate plan in the ledger before anything is cut, nothing baked that a task can change; `weight.cjs` says where a page's megabytes are.
- **Publishing:** `publish.sh --spa`, the payload's `vercel.json` merged not overwritten, only `<slug>.vercel.app` as the link to send, every Vercel call on a clock; a claude.ai artifact page as the second host (`artifact-page.js`).
- **The run log and its numbers:** opened by the skill in Step 0, written at fixed moments, §5 counted from the transcript by `runstats.cjs` — wall time with the person's turn (forms included), Figma calls by kind, context growth by phase, the skill version the session actually used — and every delivery ends with its cost line.
- **The skill follows Anthropic's authoring guide and lint keeps it there:** SKILL.md under 500 lines, each step its procedure with the full text in its reference; every long reference opens with its contents; pointers name their section; the Figma tools are named with their server; no dates in SKILL.md; the description is 3–4 lines in the command popup. `references/tools.md` lists the rules and the check behind each.
- Kept from v3.205–3.206 and now guarded by lint: `auth-core` for a non-interactive Vercel credential and no token in the shell, `shell-env` named beside the `$SKILL` export, the eval as the answer sheet, the fixture floor 0.10%, the pre-commit hook in both layouts.
