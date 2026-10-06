# Run log — <session: what was built>

Started by the skill at Step 0 and filled in as it goes — the person never has to create it.
One file per session at `_work/run-log.md`; a session that builds two prototypes keeps
one log with a block per prototype in §3 and §4. It exists for one purpose: so the person
maintaining the skill can see where it helped and where it got in the way, without anyone
re-telling the session from memory.

* **skill version:** the `skill` line of `runstats.cjs` — the plugin version, or the commit
  of a standalone copy. Note a change mid-session (an update applied after a restart) and
  from which round it applied
* **date:**

**It is yours.** Read it before sending it anywhere; nothing leaves this folder on its own.
The fields are deliberately about the SKILL, not about you: what was asked, what it decided,
what it measured, where you had to correct it. If a line would carry something you would not
put in a team channel — a client name, a real applicant, anything from a private file — cut
it. The log is still useful without it.

---

## 1. What was asked

* **brief, in the requester's own words:**
* **frames:** file key · node ids · size each
* **purpose:** interview / demo / handover / other
* **tasks the respondent will do:** (or "none given — the live set was the skill's judgment")

**Rounds.** One row per message from the person that changed the build — `runstats.cjs`
lists them with their times. The last column is what makes §5 readable: a round spent on a
new requirement is the work; a round spent on the skill's mistake is a §6 entry.

| # | time | what was asked | what changed | new requirement / skill's error / both |
|---|---|---|---|---|

## 2. What the skill decided at Step 0

One line each, and for every one of them: did the skill ASK, or decide by itself?

| parameter | answer | asked or decided |
|---|---|---|
| canvas | | |
| frame width | | |
| shell | | |
| live set | | |
| hover policy | | |
| accuracy threshold | | |
| one file or a folder | | |

* **recommendations the skill made that pulled against its own default:**
* **questions it asked that it should have decided:**
* **decisions it made that it should have asked about:**

## 3. What was built

Per prototype, when there is more than one (`### prototype 1 — <name>` …).

* **live controls:** how many, which
* **baked plates:** how many, at what scale, or "nothing baked"
* **components used from `controls.js`:**
* **built by hand because the library had no component:**

## 4. What the measurements said

Per prototype, as in §3.

* **shell gate:** offset · landmarks · verdict
* **zone diff per frame:** the numbers, against the threshold agreed in Step 0
* **behaviour probe:** the path walked end to end, pass or fail
* **fluid check** (elastic pages only): widths, the measured floor, anything clipped
* **deviations recorded:** how many, and the one that mattered most

## 5. What it cost

Not estimated — counted. `node "$SKILL/scripts/runstats.cjs"` reads this session's
transcript and prints every line below; paste its output here. It works after the fact
too, so "not measured" is never the answer: a log written the next day still gets the
real numbers (`--since <ISO time>` for the part of a long session that was this run;
`--round` for the increment since the person's last message, whose `cost` line ends every delivery).

* **wall time:** first message to delivery, and how much of that was the person's turn
* **Figma MCP calls:** total, and the split (metadata / screenshot / design context / assets)
* **tool calls:** total, and the skill's scripts by name
* **context:** peak and last, and roughly where it grew — *extraction* (Figma calls
  and reading their output) / *build* (writing the generator and the page) / *verification*
  (renders, diffs, probes, and the cycles a failed check cost). A run that used twice the
  budget and cannot say which third ate it teaches nothing; the 2026-09-24 run was 330k
  against a measured 280k and the log could not say why. Reading the skill's own files is
  part of *other*: a run that cats a whole reference or `controls.js` shows up there

## 6. Where the skill was wrong

The most valuable section. Everything else can be re-derived from the files; this cannot.

The first log ever written filled this with seven findings, two of which were silent failures in
the skill's own tools — a probe that printed nothing instead of erroring, and a measurement that
reported the sidebar's height as the page's. Neither was visible to 240 automated checks, because
both only happen in live work and neither said a word. If something cost you twenty minutes and
you cannot say why, that is exactly the entry this section wants.

Written **when it happens**: the moment the person says something does not work, or looks
wrong, the line goes here first and the fix comes after. That is the moment it costs one
sentence; at the end of the session it costs a reconstruction, and the reconstruction
drops exactly the twenty minutes nobody can explain.

Each entry ends with two tags: **found by** — *person* (their click, their eye),
*probe* (a check of the skill's), *agent* (noticed while working) — and **cost** — minutes or
rounds, roughly. "Found by person" next to a check that reported a pass is the most
important pattern this section can show.

* **corrections you had to make by hand, and to what:**
* **things it claimed were verified that were not:**
* **places it was slower than it should have been, and what it was doing:**
* **anything the walk-through found that every number had passed:**

A long run may group this section by phase instead — `### 6a. First build`,
`### 6b. Publishing`, `### 6c. The platform`, `### 6d. My own slips` — keeping
the four questions above inside each. The 2026-09-28 → 10-02 log did, over five
days and forty increments, and it read better than one flat list: a finding
about the platform and a finding about a script are fixed by different people.

## 7. Anything else

Free text. "I expected X and got Y" is the most useful sentence in this file.

## 8. Did it do its job

One or two lines from the person who asked for it, in their own words: did the prototype
serve the purpose in §1 — the interview ran, the team saw what it needed to see, the
handover answered the engineers' questions. Ask for it once at the end; if they say nothing,
write "not said". Everything above measures the skill; this line is the only one that
measures the result.
