# Deviations, handoff and the run log

The three files a build leaves behind, and when each is written. SKILL.md's
Step 8 is the procedure; this is the full text it was condensed from.

## Contents

- Step 8 in full — deviations, then handoff
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
invented, and every mockup self-contradiction reproduced verbatim rather than
silently corrected. Give the user a short summary in chat and the file path —
and **never say it matches if it does not.**

**A handoff document**, from `assets/handoff-template.md`. The two sections that
get skipped and shouldn't are the *interaction inventory* — which must list what
is deliberately inert, or the next session will "fix" a dead click — and the
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

## Asking versus deciding, in full

**Ask when different readings mean materially different work,** and ask with
options. Two frames disagreeing about a shared element is always an ask.

**Otherwise decide, under a stated assumption**, rather than blocking — with
two exceptions that both cost a real run a round:

* **What the design does not draw is asked, not decided.** A loading or
  in-progress state, a transitional screen, an option list, a rule: rule 3 and
  the Step 0 row *data and rules the frames do not show*. A stated assumption
  is still an invention when nothing in the frames supports it.
* **When the screenshot and the words disagree about scope, ask which.** "In
  scenario 3 only, or everywhere?" is one line; a guess applied everywhere is
  undone everywhere.

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
