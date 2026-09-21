# Prototypes built for a research question

Read this before Step 1 — before deciding what is live and what is scenery. It
comes from a series of moderated interviews and the rebuilds between them, so
the interview case is worked out in detail and the others are marked for what
they are.

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
*Not validated in the run this skill comes from* — when a user asks for this,
ask what they need shown rather than reusing the interview recipe.

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

Baking (`baking.md`) is what makes the middle tier affordable, and it is why
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
