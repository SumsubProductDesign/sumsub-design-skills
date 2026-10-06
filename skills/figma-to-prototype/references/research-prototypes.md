# Prototypes built for a research question

Read this before Step 1 — before deciding what is live and what is scenery. It
comes from a series of moderated interviews and the rebuilds between them, so
the interview case is worked out in detail and the others are marked for what
they are.

## Contents

- 1. The prototype is built for the question, not for the mockup
- 2. Start from the task list
- 3. Derive the live set from the tasks
- 4. Changed → saw
- 5. Rehearsal before the call
- 6. The moderator's handout
- 7. Between sessions
- 7. Where the Step 0 parameters came from
- Step 1 in full — derive the live set from the tasks

## 1. The prototype is built for the question, not for the mockup

Ask what this prototype is for before asking anything else. It changes what has
to be live, and it changes what you hand back.

**Moderated interview with a client — the case this skill is built around.**
The person chooses their own path, so the build is driven by the task list
(§2) and the live set is derived from it (§3). Pixel fidelity matters: the
respondent must not be able to tell prototype from product. Sections 2–6 are all
about this case.

**Demo to the team.** No separate build: take the interview prototype and walk
one scenario linearly instead of showing slides. Worth knowing because it costs
nothing — questions land on the solution rather than on what a static image is
supposed to mean.

**Handing a solution to engineering.** What changes: the live set is *states and
edge cases*, not paths — what an empty screen shows, what happens when a
parameter that lives on another screen is changed. Completeness beats beauty.
One run so far (the Device list, 2026-10-02: a list with expandable rows, four
filter menus and a chip filter), and what it did right is the recipe:

* **ask for the data of every state the frames do not draw** — the expanded rows'
  content ("mock data modelled on Lenovo"), the filter menus' options;
* **ask the edge cases in one message before building them** — options the
  table does not carry, "today" for a calendar drawn in another year, a filter
  with no menu of its own, what "no matches" shows — four questions, four
  answers, nothing invented;
* **probe every filter alone and in combination**, and every visible
  consequence of each: the rows, the counter, the Found total;
* **compute what the product computes** (the Found count), and say so.

What it missed is the moderated recipe's too: the shell gate's question, a hover
that ate a divider. Engineers read the prototype for behaviour, so a list of the
states it covers goes into the handoff's interaction inventory.

**An unmoderated test — Wynde, Maze, Lyssna.** The same build as the interview,
driven by the task list, with one difference that reaches into everything:
nobody sits beside the respondent. The platform records one tab, the task lives
in another, completion is a self-report, and a dead end is the end of that
person's task. `unmoderated.md` has the rules and the scaffolding; read it with
this file.

**A viewer over real data for yourself.** Not this skill. No mockup, no accuracy
threshold, real data, and the page reloads itself when the source changes. If
that is the request, say so and build it as an ordinary small tool — do not
carry the pixel rules, the deviation ledger or the diff threshold into it.

**The first prototype is meant to be sufficient, not complete.** Build what is
tested in the next session; the rest grows later, and an added panel costs about
a quarter of the first build. "Better tested early than tested perfect" — a
client who agreed to a call is worth more than a finished prototype.

## 2. Start from the task list

Before frames, before canvas size, before anything: **ask what the respondent
will be asked to do with their hands.** The prototype is assembled for that
list; the mockup only says what it looks like.

The list arrives as plain prose in the prompt — a handful of lines:

```
1. Set the widget's colours to match your brand
2. Hide a screen the applicant does not need
3. Switch the widget to dark theme
```

**Expect tasks to be coarse on purpose.** "Set the colours to match your brand"
rather than "use the hex field in the Colors panel" — a task that names the
control tells the respondent where to go and destroys the finding. So a task
does *not* hand you a control. Deriving the controls is your job, and it is the
next section.

If the user has no task list — a demo, a handoff — say that the live set will
then be your judgment, name what you chose, and proceed. A missing list is a
reason to state an assumption, not to block.

## 3. Derive the live set from the tasks

For each task, write down every path a person might plausibly take to do it.
Then apply three tiers:

| tier | what it means | cost |
|---|---|---|
| **every entrance is live** | each menu item, tab and button that leads anywhere a task could go responds to a click | small |
| **every destination shows its real content** | the panel behind a non-tested entrance still renders what Figma has there — as a baked plate, since nothing in it changes | one `get_screenshot` per panel |
| **interactive only where a task is answered** | controls that carry the research question work for real | this is where the budget goes |

Baking (Step 5) is what makes the middle tier affordable, and it is why
"make all the paths work" is not the expensive advice it sounds like.

It also resolves the rule inherited from Step 0. **Dead clicks are correct
outside the tested area; inside it, a dead entrance is a defect** — the
respondent reads it as "this product cannot do that" and you lose the path they
would have chosen.

**The failure this prevents.** In one run the colour *picker* was built because
it is the visible, impressive control, while pasting a ready hex code was left
inert. The research question was exactly how clients set colours — and the
answer turned out to be "with codes their designers give them". The respondent
described the scenario aloud but could not perform it, and the finding was lost.

So finish the derivation with a check: **for every task, name the control that
answers it, and confirm that control is in the interactive tier.** If the
question is "how do people do X", the way they actually do X has to work — not
the neighbouring control that photographs better.

## 4. Changed → saw

Every live control must produce a visible consequence, and the consequence must
be the real one. People read the meaning of a setting from what changed on
screen, not from its label. A feedback loop that lies — a preview that updates
the wrong element, or does not update — does not merely annoy; it invalidates
the session, because the respondent reasons about what they saw.

Make it a verification item, not a sentiment: for each interactive control,
assert the element it is supposed to change, in the state it should reach. The
preview area is usually the thing under test, so it deserves the strictest
assertions in the build.

## 5. Rehearsal before the call

Two halves. Do not blur them, and do not claim the second.

**Yours, and automatable.** Walk the whole task list through the prototype with
synthetic events — every task from first to last, in order, asserting the state
after each step. Order matters: tasks interfere, and a control left in a changed
state by task 1 is what task 3 meets. Hand back a checklist: task, the path you
took, what changed, what did not.

**The user's, and not replaceable.** Fifteen minutes with the prototype, live,
performing the tasks as a respondent would — before the call. It catches the
class of thing no measurement sees: an invisible layer over an accordion that
swallows clicks, a cursor that says clickable where nothing is wired, a step
that is obvious to whoever built it and opaque to everyone else. Say plainly
that this part is theirs.

## 6. The moderator's handout

The list of what is not clickable — which you have anyway, from §3 — is worth
three deliverables, not one. Hand it over as such:

* **The risk list for the session.** Where a person can click and get no answer,
  known in advance rather than discovered live.
* **One line for the intro:** "this is a prototype — if something does not work,
  that is us, not you." Without it the respondent concludes they broke
  something and turns cautious for the rest of the hour.
* **The interaction inventory in the handoff**, so the next session does not
  "fix" a deliberate dead click.

Write the first two in the language the session is run in.

## 7. Between sessions

After the first call it is visible where the prototype falls short: people go to
what is a picture and try what is not wired. That is the loop this skill is
priced for — the next ask is "make this part live", which is an increment, not
a rebuild.

## 7. Where the Step 0 parameters came from

Each row of Step 0's parameter table blocked a real run when it was left open.
The rows state the rule; this is the evidence, one run per row, so that the rule
can be argued with.

* **`doctor.sh` first.** Left to judgment it was run five times in one session
  and never in the next; a designer without Node found out halfway through a
  build (2026-09-28).
* **Recommend the mockup's reading.** On one run three of four recommendations
  pulled the other way — scaling, extra live controls, an auto-dismissing toast —
  each against a rule in SKILL.md.
* **Frames, not sections.** Three of four metadata calls on 2026-10-02 were on a
  section or a page, all over the tool limit, one 139k characters, read through
  `figmeta.py` for four frame ids.
* **Canvas.** Run 5 answered *fluid shell, pinned content* and baked the form as
  plates; when the designer asked on the walk for the content to follow the
  window, the plates had to become boxes — half a first build for a question that
  costs one sentence. The 1920-frame warning: a 1920 canvas in front of 1440
  respondents scrolls sideways or scales text to 10.5px.
* **Shell.** The OCR frames (2026-10-02) carried a flag, a copy button and a
  status pill no `shell.js` key renders — newer than the shell, a case the gate's
  table did not have, so the skill decided alone to bake the chrome.
* **Hover policy.** The single blocking question of a real run, asked mid-build.
* **Accuracy threshold.** An older frame reads 10% on a radio row and 15% on an
  alert where the design system has moved, and both are correct; without the
  gates-instead rule the number is read as a defect.
* **Data and rules.** The second OCR prototype (2026-10-02) invented its field
  sets and level rules mid-session; its own run log named that as the deviation
  that mattered most. A "check in progress" state added under a stated assumption
  (2026-09-28) was removed by the designer: the re-run is instant in the product.
* **Behaviour in words.** *Back side with hover zoom* (2026-10-02) became a round
  loupe built from memory and was flagged to the designer only after it was built.
* **The run log in Step 0.** A designer read "the skill asks for a log on every
  build" as a chore of hers, did not start one, and the log was rebuilt from
  memory with §5 marked "not measured" throughout (2026-10-02).

And the rules elsewhere in SKILL.md that come from one run each:

* **Step 2, zone-diff shared areas by measurement.** Run 4 of the eval read two
  crops side by side instead (2026-09-20) and missed the 2px differences.
* **Step 2, read a saved response with the tools.** Run 7 transcribed a whole
  design context by hand (2026-09-21); the next session had no source to check
  the values against.
* **Step 4, a standalone block is `margin:0`.** Found on run 7, building a
  400×348 panel whose PNG said nothing about the browser's default margin.
* **Step 5, the plate plan.** The OCR modal's right column (2026-10-02) was a
  plate under six live fields; when the field set had to follow the document
  type, the column was rebuilt as DOM.
* **Asking versus deciding, scope.** A request shown on one scenario's screen and
  worded for "the tab" was applied to all three scenarios, twice, and undone
  twice (2026-09-28).

## Step 1 in full — derive the live set from the tasks

The question is not "what changes on this screen" — the mockup cannot answer
that. It is **"where could a task lead"**, and only the task list answers it.
For each task, write down every path a person might plausibly take, then sort
what you found into three tiers (`references/research-prototypes.md` §3 has the
table with costs):

1. **every entrance is live** — each menu item, tab or button leading anywhere a
   task could go responds to a click;
2. **every destination shows its real content** — as a baked plate (Step 5),
   since nothing in it changes;
3. **interactive only where a task is answered** — this is where the budget
   goes.

Two rules to state to the user, both from lost findings:

* **A dead entrance inside the tested area is a defect**, not a correct dead
  click. Outside that area, dead is right. An *entrance* is something that
  leads somewhere — a tab, a menu item, a button that opens a panel. A control
  that sits inside the tested panel but no task touches (a checkbox the brief
  says to leave alone) is not an entrance: it is scenery, baked, and its dead
  click is correct. Making it live is a scope decision for the user, not a
  defect to fix.
* **For every task, name the control that answers it, and confirm it is in the
  interactive tier** — not the neighbouring control that photographs better.

Everything no task reaches is scenery. If you still want to make something
beyond the three tiers live — a control in the panel "for realism", a cheap
radio group, a toggle that only marks the form dirty — **that is its own yes/no
question to the user, with its cost, and the default is no.** Do not fold it
into the plan table: a table gets approved as a whole, and the user discovers
the extra markup on the walk-through, not in the plan.

* Scenery → **bake it** (Step 5). No `get_design_context`, no icons, no fonts.
* Live → extract properly (Step 2).
* **Do not build nodes outside the frame's visible bounds.**
* **Build springboard screens last.** If the budget runs out, the thing left
  unfinished is the least important.
* **Build what the next session tests, not everything.** Scope is cheap to grow
  and expensive to guess at.

Then, before extracting a frame you have not seen: **run a zone diff of its
shared areas against the screens already built.** Frames drift. Show the
divergences to the user and ask which is canonical — one call, and it catches
what would otherwise surface during the test.
