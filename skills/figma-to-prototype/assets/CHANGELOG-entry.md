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

## vX.Y.0 — YYYY-MM-DD (figma-to-prototype: a change in Figma is routed, not drawn by hand)
A designer's run (Document examples, 2026-10-15 → 16) changed the prototype and the Figma file together in 17 of 27 rounds: a second drawer variant, a confirmation modal and a toast were decided in the prototype and then drawn in Figma, and the sample data was synced into both. The session did it with 88 `use_figma` calls of its own and met six Plugin API traps that `sumsub-mockup` already names. Checked on two eval runs of the AML brief (runs 19 and 20 in `assets/eval.md`). User-visible:

- **A Step 0 row for a change in Figma asked alongside the prototype.** Before touching Figma the skill says where the change goes: a new frame, screen or state drawn from the prototype goes to `/sumsub-design:sumsub-mockup` (a new element on an existing page: its *Add-to-existing-page* mode); a bulk edit of existing nodes stays in the session, chunked, after that skill's API sections are read; a master component or variant goes to `/sumsub-design:sumsub-component`.
- **The hand-over brief** (`references/handoff.md` § A change that goes back to Figma) is written in the mockup skill's own form — "add <the element> to the existing page <URL>", one page per message, the element in the design system's component names, the values from `gen.js` with a node id beside each, the prototype's render as the picture to match, pictures as the asset itself, and the placeholder rows the change touches — so nothing on that skill's side has to change for it to be picked up.
- **The skill's description now also covers the way back:** a prototype built this way that has to go back into Figma opens this skill, which routes the change.
- **The run log's rounds table gains a *prototype / Figma / both* column**, with the skill that drew a Figma round, so §5's Figma calls read as extraction or as edits; a §6 finding in Figma's Plugin API is tagged `sumsub-mockup`.
- **The reference map names the sibling skill**, and `references/traps.md` says the Plugin API's traps are not its own.
- **`runstats.cjs` tells Figma edits from reads.** `use_figma`, `upload_assets` and the other writing calls are their own phase (*figma edits*) and are listed apart on the `figma` line; the same run had read as "extraction 43%". A gap over an hour inside the person's turn is printed as idle, so a session left open overnight no longer reads as 45 hours of work.
- **Three traps from the run:** a control's outside border cut by an `overflow:hidden` header; a design context that lists children in one order while the render draws another; a transition that never advances in a hidden browser pane.
- **A transition the person asks for moves `transform` and `opacity` only**, never a layout width — a docked drawer that pushed the grid made every card image jitter (`references/interaction-plumbing.md` § A delay is not an animation).
- **Two variants from one generator** (`references/architecture.md` § Two variants from one generator): one `gen.js`, a `--option` flag, each variant its own deliverable and its own published path, the unchosen one frozen and still buildable. The second variant has arrived mid-run twice.
- **The Step 0 line is text, in the same turn, before the form, never a form alone** — the purpose read back, the defaults, the live set, the undrawn values or "none"; an eval run sent the form bare and the chat held nothing of that.
- **A set's frames are zone-diffed against each other before the first design context**, not only a new frame against built screens — on a first build "already built" read as nothing to compare.
- **The run log's §3 and §4 sit on the checklist's steps 3 and 7, and §8 is asked in the delivery message**; "the end of the session" produced a log written from memory in one edit.
- **The brief's language, from the first line to the closing box**, never switched mid-session.
- **`statecheck.sh --hash` on the state the page loads in** says so instead of "no route", when `gen.js` exposes `window.__proto.routes`; without it the warning names both readings.
- **Publishing asks who will open the link** whenever the request does not name where: *people outside the company* (an open link on Vercel, no VPN) or *colleagues* (beautiful-pages, the internal GitLab Pages site, through the `publish-page` skill: VPN only, never deleted, 1 MB per HTML file — `references/publishing.md` § As an internal page, for employees), the purpose's one recommended; a claude.ai artifact only when named. Only the person's own words or the form answer it — a button the skill wrote ("for the respondents") does not, and the closing offer's buttons are the two audiences and "not now". `publish.sh` now refuses to run without `--for outside` and prints the question instead; `--for colleagues` is refused by name. An eval run deployed to Vercel on the word "publish" alone because the purpose was an interview.
- **Progress lines speak in actions, never in the skill's numbering** — "reading step 9 of the skill" told a designer nothing; the step numbers stay in the checklist and the run log.
- **The version check repeats before every delivery's cost line and at the start of every new day of an open session**, silently when `main` is unchanged; pre-flight step 9 used to say "do not re-check in this conversation" and contradicted the paragraph under it. A two-day run checked once on its first morning and missed the release merged on its second.
- **Step 0: "take it from X" with more than one candidate is a contact sheet and a form** — a photo picked from a page of candidates cost a round. **Step 2: a flag, a photo, any picture inside an instance is cut from the 2x export**, never asked for by id. **Step 3: `node --check gen.js` before every build.**
