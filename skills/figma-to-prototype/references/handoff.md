# Deviations, handoff and the run log

The three files a build leaves behind, and when each is written. SKILL.md's
Step 8 is the procedure; this is the full text it was condensed from.

## Contents

- Step 8 in full — deviations, then handoff
- A change that goes back to Figma
- Asking versus deciding, in full

## Step 8 in full — deviations, then handoff

**When the threshold is met and the behaviour probes pass, stop building.**
Budget left over is not a reason to make one more thing live; that is the
user's call, and it goes into the handoff as a proposed next increment. On one
run the extra controls added after "done" cost a quarter of the whole build and
a bug hunt of their own.

Three outputs. The first two are required and the first is what keeps the whole
thing trustworthy; the third is written for whoever maintains this skill.

**A deviation ledger**, in its own file next to the prototype: element, zone,
Figma value, prototype value, status (fixed / cannot fix and why / placeholder — data the person agreed could be made up, repeated in the handoff's § Placeholders). It must
include the deliberate simplifications (a squircle approximated with
`border-radius`, an invisible layer skipped), the forced ones (a substituted
font, a line break Chrome makes differently), everything inferred, every hover
invented, every mockup self-contradiction reproduced verbatim rather than
silently corrected, and every unfilled place as Step 0 answered it (*proposed* is a
placeholder; one off the task path is never asked and stays verbatim, a
contradiction). Give the user a short summary in chat and the file path —
and **never say it matches if it does not.**

**A handoff document**, from `assets/handoff-template.md`. The two sections that
get skipped and shouldn't are the *interaction inventory* — which must list what
is deliberately inert, or the next session will "fix" a dead click, and
which states advance by time (a loading state's timer: its seconds are a
§ Placeholders row, the network has the real ones) — and the
*measured baseline-offset table*, without which nobody can add a text run
correctly. Write it in the team's language. It also carries the **state and
re-render map** (`references/architecture.md` § The state and re-render map — write it down once): globals with their defaults, the
repaint funnels, the shared hover/cursor classes, and every write path per value.

**A run log**, from `assets/run-log-template.md`, at `_work/run-log.md`. It is
written for whoever maintains this skill: what was asked, what the skill decided
at Step 0 and whether it asked or decided alone, what it built, what the
measurements said, what the run cost, and — the section that cannot be
re-derived from any file — **where the skill was wrong**: the corrections made by
hand, the verifications it claimed and had not done, the places it was slow.

It is opened in Step 0 and written at the moments listed there (§ Open the run
log now, not in Step 8); this step only closes it. **Keep filling it after the
first build** — a log that stops there is a log of the easy part (one run wrote
it at noon, complete, and went on for twenty-five increments without a line).
Before the final message of a session, one command:

(the command is in SKILL.md, Step 8 — one copy, so it cannot drift)

If it prints, the log is stale or missing, and the final message waits until it
is not: it compares the log with every ledger and every built page, and says
"no run log" when there is none. Then `runstats.cjs` for §5. The fields mirror
the rows of `assets/eval.md`, so a log that comes back can be read against the
same checklist as a controlled run.

**Section 6 is where the things nobody thought to assert arrive** — the first
log's seven findings included two silent failures in the skill's own tools that
240 lint checks could not see (the template tells the story). A test suite
proves what someone thought to assert. If §6 is empty after a run that needed
corrections, the log was written from memory at the end, which is the one way
to make it worthless.

**A delivered increment ends the session.** When the page, the ledger, the
handoff and the run log are current, the next increment — a screen, a
scenario, a publish round — starts a new session that opens `handoff.md`
first; a one-sentence fix stays. A session that has to be summarised has paid
for its context twice (`references/architecture.md` § One increment, one
session). Say it at the delivery, in one line.

**Then offer it, once, in one line, and never send it anywhere.** "A run log is
at `_work/run-log.md` — send it to whoever maintains the skill if you want the
next version to fix what got in your way." The person reads it first and decides:
it is their session, it sits in their folder, and nothing about it is automatic.
A log collected quietly would be read as a record of who made mistakes, and the
people it is meant to help would start working around the skill to avoid it.

## A change that goes back to Figma

A prototype session often becomes the place where the design is decided — a
drawer variant tried in code, a confirmation modal and a toast added because the
demo needed them, the sample data chosen while clicking — and then the frames
have to catch up. The 2026-10-15 run changed the prototype and the Figma file
together in 17 of 27 rounds, made 88 `use_figma` calls of its own and met six
Plugin API traps the mockup skill already names (a double tint drawn by hand
instead of the `Tint` component, clones inside a slot that lost their ids where
`slot.appendChild` with the other children hidden is the path). The frames are
drawn by the sibling skill `/sumsub-design:sumsub-mockup`, not by this session's
own calls (SKILL.md Step 0, *a change in Figma, asked alongside the prototype*);
what this session owns is the brief it hands over, and `gen.js` already holds
everything the brief needs, because every value sits next to its node id.

The hand-over brief is one message to the mockup skill, **written the way that
skill reads a request** — its *Add-to-existing-page* mode fires on "add <X> to
the existing page <Y>", inspects that page, keeps its chrome and asks for the
canonical node URL when it cannot find it — so the brief gives it exactly that,
in this order:

1. **The request, in its form.** "Add <the element> to the existing page
   <Figma URL with the node id>", one page per message: the skill builds one
   screen, shows its link and stops, and its own rule is that a burst of heavy
   calls takes the MCP server down. A second variant's ten pages are ten
   requests, the first checked before the next is sent.
2. **The element in the design system's names,** not the library's: *Modal
   Basic* with a *Tint*, *Drawer Basic*, *SnsToast*, a *Checkbox* inside a
   *Menu item* — the component the file's own kit has, which the mockup skill's
   tables name and `controls.js` only mirrors. It fills the component through
   `setProperties` and places content into a slot; a brief that names a CSS
   class or a `gen.js` function gives it nothing to build from.
3. **The values, from `gen.js`, each with its node id:** every text, size,
   option list and control state the element carries, verbatim. A picture goes
   as the asset itself — the WebP, the 2x cut — never as "the one on page X":
   the 2026-10-15 run lost a round to a photo picked from a page of candidates.
4. **The prototype's render of the state** — one `shoot.js` screenshot at the
   frame's size, cut to the changed region with `crop.js` when the page is
   large — as the picture to match, with the sentence that the prototype is
   what the team saw and agreed to.
5. **What is placeholder** — the § Placeholders rows that touch the change, so
   the frame does not turn a made-up value into a design decision.

The brief cannot give that skill what it lacks: a mode for editing dozens of
existing nodes at once — which is why a bulk edit stays here — and four of
Figma's Plugin API traps met on that run (a slot's `insertChild` ignoring its
index, a hidden clone with no children, docked content that needs a clipping
frame, a fixed-size checkbox inside a menu item), which are its maintainer's to
add, not this brief's to repeat.

A bulk edit of existing nodes stays in the session, as the Step 0 row says, and
is chunked — the mockup skill's own rule is that heavy `use_figma` calls back to
back take the MCP server down. Either way the round is logged as *Figma* or
*both* with the skill that did it, and a trap met in Figma's Plugin API — a
slot, a clone, a component property — is a §6 line that names `sumsub-mockup`
as the file it belongs in, not `references/traps.md` § Figma MCP, which holds
the server's reading traps only.

## Asking versus deciding, in full

**Ask when different readings mean materially different work,** and ask with
options. Two frames disagreeing about a shared element is always an ask.

**Otherwise decide, under a stated assumption**, rather than blocking — with
two exceptions that both cost a real run a round:

* **What the design does not draw is asked, not decided.** A loading or
  in-progress state, a transitional screen, an option list, a rule: rule 3 and
  the Step 0 row *data and rules the frames do not show*. A stated assumption
  is still an invention when nothing in the frames supports it. How a drawn
  loading state ends — by a timer, a tap or both — is the Step 0 row *behaviour
  the brief names but no frame draws*: asked once, never a timer put in silently,
  and only for a state that draws a loader; a button-less transition that draws
  no loader is by tap, said in the defaults line.
* **When the screenshot and the words disagree about scope, ask which.** "In
  scenario 3 only, or everywhere?" is one line; a guess applied everywhere is
  undone everywhere.

**Before the cost line, the version check once more** (SKILL.md pre-flight,
steps 1–3), silently when `main` still has the version this session runs. A
two-day session checked on its first morning, read "current", and the release
with the fixes for two of the things it then hit was merged on its second
morning while it was still building; the person learned it from the log review
ten days later. A session that stays open across a day repeats the check at the
start of the new day for the same reason. The check can only see what is
merged: a change in review is not installable, so the honest answer on a day
between a PR and its merge is still "current" — the fix for that is the merge,
not the check.

**End every delivery with its cost, in one line.** `node "$SKILL/scripts/runstats.cjs" --round`
prints it for the increment just finished: minutes of work, tool calls, Figma
calls, and the phase that took most of it (`cost : 14m of work · 62 tool calls
· 3 Figma · mostly verification (statecheck ×22)`). "Why did that take so long?"
was asked six times in two weeks of one person's sessions, always after the fact
and never answerable then; the line answers it before it is asked, and a number
that looks wrong to the person is a §6 entry on the spot.

**Say every decision you made for the user, in the same response.** Which
element got which behaviour, what was left inert, what was approximated. These
are invisible in a screenshot; unnamed, they are unreviewable.

**Speak in actions, never in the skill's own numbering.** "Step 9", "the
pre-flight", "shell.md § The gate" are this document's index, and the person has
not read it: a progress line that says "reading step 9 of the skill and checking
the Vercel login" told the designer nothing on the 2026-10-26 run, and she said so.
Say what is being done and why — "publishing: checking that you are logged in to
Vercel, then one file goes up" — and keep the step numbers for the checklist, the
run log and the ledger, where the maintainer reads them.

**Deliver first, improve after an "ok".** When a request produces something
the user is waiting for — a wrapper, a screen, a link — hand it over as soon
as its own check passes, and only then name what the run showed about the
skill or the shell. A change to the skill or the asset is a separate step
that starts with the user's go-ahead: it costs a lint run, documents and a
commit each time, and a request for a deliverable is not a request for
that. Concretely: **not** "the frame needs tabs in the basic header, so I
am adding them, updating three documents and re-running lint" before the
HTML is sent; **but** send the HTML with the tabs left out and one line
saying so, then offer the change. Follow a written procedure by its
purpose, not its letter — the reading order says "metadata for ids", and
when the screenshot already gave every id-free answer, the call is skipped.
