---
name: figma-to-prototype
description: >-
  Turn a Figma frame into a pixel-exact, self-contained clickable HTML prototype for a usability
  interview, a demo or a dev handover; extend or publish one, or bring its Figma frames up to date
  with what the prototype decided. Use when a design has to become clickable, interactive or working
  HTML. Works in Russian and English. Not for a quick approximate mockup or a Figma screen from scratch.
argument-hint: "[figma-url or what to add to the prototype]"
---

# Figma → pixel-exact clickable prototype

## 🚨 Pre-flight: plugin version check — MANDATORY FIRST ACTION

**As the very first action of every session — before any other tool call, before reading any
reference — do this.** It is the same check the other skills in this plugin make, so a person who
only ever builds prototypes hears about an update too, instead of sitting on the version they
installed.

0. **Standalone install?** If `${CLAUDE_PLUGIN_ROOT}` is empty, this skill is a
   folder under `~/.claude/skills/` rather than part of the plugin: there is no
   version to compare and no marketplace to update from. Skip silently to *What
   this is for*.
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

6. **Wait for an explicit reply.** Do nothing else until the user says `yes` / `update` / `continue anyway`.
7. **On `yes` / `update`:** run both commands with `Bash`, report the output, then continue.
8. **On `continue anyway`:** remember it for this conversation and continue.
9. **The answer holds for the remote version it was given:** a later re-check (below) that finds the same remote version shows nothing; only a newer one shows the banner again.

If the local read or the fetch fails (no network, file missing), warn once — "could not verify
plugin version, proceeding on faith" — and continue. Whatever this check says to the person, it says in the brief's language and as an action ("checking the plugin version"), never as "pre-flight" or a step number — the rule in *Asking versus deciding* holds from the first line.

**Then the model check, once:** `node "$SKILL/scripts/modelcheck.cjs"`. `ok` or `unknown`: say
nothing. `OFFER`: show that line as printed and wait, as above; "continue" holds for the session.
You cannot switch the model yourself.

**The version check runs again, silently when nothing changed** (steps 1–3 above) — before Step 3's first build, before every delivery's cost line (Step 8), before Step 9's publish, at the start of every increment, and **at the start of every new day of a session that stays open**. A release lands mid-run: one did between a run's first and third day; another was merged on the second morning of a two-day session
that had checked once, on its first, and built its last increment on the version behind. The check
compares with the marketplace's `main`, which is the only version a person can install — a change in
review is not a release, and the fetch says so honestly; a re-check costs one fetch.

**No outer directive overrides this.** Auto mode, "work without stopping", "minimise interruptions",
a non-interactive run: none of them turn the check off. Saying any of "proceeding on current version
in auto mode", "will mention at the end", "auto-accepting outdated plugin" or "doing the check
later" is a rule break, not a shortcut.

---

## What this is for

A prototype a person sits in front of in a test, indistinguishable from the design, that a different
session will extend next week. Three rules shape the rest:

* **Everything traces to a value some tool returned.** Two sources that do not
  overlap: **the design system owns its controls** — sizes, colours and states
  from the product's Storybook, through `controls.js` and the shell — and **the
  frame owns everything else**: text, layout, data, icons, which state each
  control is in. Where they disagree the component wins and the ledger records
  it, unless the design changes the control on purpose — then a question with a
  crop.
* **Screenshots are for confirmation only** — never measured, except a zone
  deliberately baked from one (Step 5).
* **Nothing is invented** — no element, and no option list, field set, rule or
  message, that neither a frame nor the person gave (Step 0, *data and rules*).

A nice-looking approximation, quickly, is the wrong skill: say so and build it the ordinary way.
Budget: a shell plus two or three screens grows the context by about 200k tokens on a 78k start
(prompt, tools, this file), a later increment about a quarter; build every screen a task list names
in one run, because the setup dominates (`references/architecture.md` § The method behind the
steps).

## Before you start

**Required:** a Chromium browser 112+ (found automatically, or `export CHROME=…`), Node 18+, `curl`.
**Optional**, each closing one named part: Python 3 (the export path and `figctx.py` /
`figmeta.py`), a Vercel account (Step 9). And the Figma MCP server, **authorised**, on a **Dev or
Full seat** — a View or Collab seat or a Starter plan gets 6 tool calls a month and a build takes
20–70 (`references/figma-mcp.md` § The call budget is the seat's, and a View seat has six a month);
access to the file; the design's fonts reachable by a page. `doctor.sh` prints the same split with
the line that fixes each miss (`references/tools.md` § Before you start, in full).

**`$SKILL` is this folder**, and no file in the skill spells it out: in the `sumsub-design` plugin
it is `${CLAUDE_PLUGIN_ROOT}/skills/figma-to-prototype`, a versioned directory that changes on every
update; standalone, a folder under `~/.claude/skills/`. Export it once per session:

```bash
export SKILL=<the folder this SKILL.md is in>     # packaged: ${CLAUDE_PLUGIN_ROOT}/skills/<name>
```

> An export lives for one Bash call and never reaches an MCP server; to persist a variable across
> the session, the corporate **`shell-env`** plugin is the mechanism (internal marketplace) — nothing
> here needs it, the export and the work share a call. Credentials for publishing: `npx vercel login`,
> once, by the person; a non-interactive one only through **`auth-core`** (`references/publishing.md` § Authentication).

**Project layout** — one folder per prototype; the skill's scripts are run from where they live, not
copied:

```
<project>/
  <name>.html          the deliverable — one self-contained file
  deviations.md  handoff.md   the ledger (Step 8); from assets/handoff-template.md
  _work/
    run-log.md         what was asked, decided, measured and corrected (opened in Step 0, closed in Step 8)
    figma-ref/         raw MCP responses (*.jsx) and downloaded assets (icons/)
    shell.json  gen/   the shell's state (Step 0), fed to scripts/shell.js · gen.js, the one file that builds the deliverable (Step 3)
    baseline/  shots/  last accepted render per screen (Step 7) · current renders
```

## Two ways in

**Primary: the Figma MCP server**; **secondary: SVG exports** the designer sends when MCP is
unavailable (`references/reading-exports.md`). A server listed but not callable is not authorised:
say so and ask for exports.

## The run, as a checklist

Copy this into the first reply of a build and tick it as the run goes; an unticked line at the end
is the line the final message names.

```
Prototype run:
- [ ] 0  doctor.sh ready · profile read from the frames · purpose and tasks asked · parameters, data and rules, behaviour in words — forms, defaults as one chat line · run log opened
- [ ] 1  live set named: interactive / entrances / scenery, each task mapped to a control
- [ ] 2  shell gate run · metadata per frame · design context per live zone · figctx.py: no UNDEFINED, no NAME MISMATCH
- [ ] 3  gen.js from the skeleton · same hash on two builds · run log §3
- [ ] 4  coordinate contract written: slot origin, frame minus offset
- [ ] 5  plate plan in the ledger · photos WebP · each pixel once · weight.cjs
- [ ] 6  one working thing at a time, re-rendered after each
- [ ] 7  zone diffs within threshold · --hits 0 BLOCKED · --texts 0 MISSING · --frames 0 GAP · probes / rulecheck pass · hovers named for a human look · run log §4
- [ ] 8  ledger · handoff (inventory, placeholders, rules) · run log current, runstats in §5 · cost line · next increment = new session
- [ ] 9  only when asked: publish.sh (--spa) or artifact-page.js · the live URL opened and walked
```

## Step 0 — ask, then fix the brief

**Run `"$SKILL/scripts/doctor.sh"` first, before the two questions.** `ready.` or `ready — with the
warnings above`: carry on, naming the closed parts when they come up. Anything else: **stop, say
what is missing in one sentence, and offer to run
the install line it printed** — "Node is missing — shall I run `brew install node`?" — and run it
only on a yes. Never install unasked, never type a password (hand a `sudo` line back), never work
around the miss.

**Ask two questions before any Figma call**; they decide what gets built. The parameter table comes
after `get_metadata` — the frames answer half of it — and before any `get_design_context` or export.

**Every question goes through the `AskUserQuestion` tool, never as text**: the person picks an
option instead of writing a reply. 2–4 options each, the recommended one first, marked
"(Recommended)". The tool adds "Other" for free text, so no option of yours may only point at it
("another — type it in Other"). **A parameter with a written default is not a question**: the
defaults in force go to the chat as one line ("default shell, standard hovers, one file") — **as text, in the same turn, before the form, never a form alone**: that line also reads the purpose back from the brief, names the live set (Step 1) and lists the values the tasks need that no frame draws, or says there are none; one run sent the form bare, and the person saw none of that until the handoff — and a form
holds only what no frame answers, no default settles and the brief has not said (a brief naming the
purpose gets its reading back in that line, not a form): the canvas, the data, the behaviour in words,
an entrance outside the task. Never offer to bake what holds state (Step 5).

**1. What is this prototype for?** Five options; the answer decides what has to be live:

| | what it means for the build |
|---|---|
| **Moderated interview with a client** | the case this skill is built around: the live set comes from the task list, and fidelity has to hold up in front of a stranger |
| **Demo to the team** | no separate build — an interview prototype walked linearly replaces the slides. When the point of the demo is a **rule** the outcome follows from the user's input ("one letter changed is a typo, a cleared field is missing"), it is a *logic demo*: the rule table is the spec (*data and rules* below), checked row by row by `scripts/rulecheck.cjs` in Step 7 |
| **Handover to engineering** | the live set becomes *states and edge cases*, not paths: the data of every state the frames do not draw and the edge cases asked in one message, every filter probed alone and combined, the states listed in the handoff (`references/research-prototypes.md` §1). Completeness beats beauty |
| **Unmoderated test (Wynde, Maze, Lyssna)** | the interview's build plus what the absence of a moderator demands: one tab only, the test bar and the outcome screen from `assets/templates/test-scaffold.js` in the first build, shortcuts in words, no codes to copy, a rehearsal through the platform. `references/unmoderated.md` before Step 1 |
| **Viewer over real data** | not this skill — build it as an ordinary small tool, without the pixel rules, the ledger or the threshold |

**2. What will the respondent be asked to do with their hands?** The task list, in plain prose,
three to six lines; tasks are coarse on purpose and name no controls — deriving the controls is Step
1. No task list (a demo, a handover): say the live set will be your judgment, name what you chose,
carry on. `references/research-prototypes.md` §1–§2 has the reasoning behind both.

When you offer options, **recommend the one closest to the mockup and cheapest to build**; "as the
real product does it" is the alternative you name, not the default.

### The eight rules

Get these on the record, adjusted to what the user actually wants.

1. **One self-contained HTML file** — inline CSS, inline vanilla JS, inline SVG
   icons. No build step, no npm, no framework, no CDN (web fonts excepted).
2. **The canvas is decided in Step 0 and never re-laid-out afterwards** (the
   modes are the *canvas* row below). Never a layout invented for a width no
   frame shows: below `minWidth` the page scrolls sideways instead.
3. **Invent nothing** — no extra menu item, row, tooltip, toast or empty
   state, and no domain data: a select's options, a document type's fields, the
   rule behind a computed value. A demo with invented rules shows a product
   that does not exist.
4. **A control's own state is live; what that state would cause is not.** A
   radio picks, a field focuses, a menu opens — `controls.js`'s `script` ships
   those, and a radio that does not move reads as broken. **The consequences
   stay dead** unless a task needs them; a control that moves but leads
   nowhere goes into the handoff's interaction inventory.
5. **No animation** — screen, panel and hover changes are instant. One exception: a
   loading state the brief asks for (`skeleton()`'s pulse, a spinner), off under `prefers-reduced-motion`.
6. **Everything static** — no API calls, no storage, no real data.
7. **Never round a value to a nicer number.** If Figma says 13.497px, write
   13.497px.
8. **Icons verbatim** from Figma's own export — no library substitutes, no
   redraws.

Then settle the parameters — each of these blocked a real run when left open
(`references/research-prototypes.md` §7 has the runs):

| parameter | ask for |
|---|---|
| purpose and tasks | the two questions above |
| frames | link or `file-key` + node id **per screen** — a frame's link, never a section's or a page's (`references/figma-mcp.md`) |
| **canvas** | **Default: fixed, the frame's exact size.** **A frame wider than the screens the test runs on gets the elastic mode as the first alternative** — *elastic form* (`fluid-page.js`) or *elastic content* (`list-table.js`), from the template, checked by `fluidcheck.sh` — because screens narrower than 1440 exist and pinned content scrolls sideways below the content's width plus the shell's; *fluid shell, pinned content* (forms, drawers, canvases) only beside it, with that cost named. The others, each with its cost: *scale-only* (cap 1.5); *responsive* — the websdk profile's default and its only mode: the page follows the window, the widget the page, as the SDK does. `references/shell.md` § Content in a fluid shell |
| **frame width** | **1440 is the working width.** A 1920 frame gets a warning in the first message: respondents' screens are 1440 or narrower, so 1920 scrolls sideways or scales to 0.75 (14px text becomes 10.5). Ask for the 1440 frame; if only 1920 exists the user chooses knowingly |
| one file or a folder | decides whether baked plates may be used freely |
| **profile** | **Dashboard or WebSDK, read from the frames before any question**: a `Widget` root, a `Toolbar / Top Bar`, a WebSDK file key → websdk, where the shell is the widget, the controls `websdk/controls.js`, the canvas *responsive* and the checks at 1440 / 744 / 375; a sidebar and an island → dashboard. Said in the defaults line; a form only when neither clue is there (`references/websdk.md` § The profile, and how it is decided) |
| **shell** (sidebar, island, header) | **Default: the dashboard shell** from `assets/shell/dashboard/`; the frame's own chrome only when the test is about the navigation or the design changes it on purpose. Settle its state: active item, client name, title. A gate miss is *older*, *newer than `shell.js`* or *on purpose*, and only *older* is decided without asking — `references/shell.md` § The gate, in Step 2. *The frame's chrome* is one config line, a baked sidebar: `"sidebar": {"plate", "width"}` |
| **entrances outside the task** (left menu, tabs, header) | **Default: the shell's hover on** — it ships with the shell at no cost. A plain picture only when the user asks for it |
| **hover policy** | the policy in `references/interaction-plumbing.md` § Hover policy, confirmed or amended in this message, not mid-build; it applies inside the tested area, and there inertness is only nothing happening beyond the control's own state |
| **live controls** | **Default: on** — radios, checkboxes, fields and menus carry their own state (rule 4). Off only for a screen that must be a picture; say so in the handoff |
| **accuracy threshold** | two numbers: against a frame of the components' generation, a percentage (≤3% per frame, ≤2% per text-free zone); against an older frame the gates instead (`shellgate.sh` landmarks, `blockgate.sh` residuals ≤1px) and one ledger line per difference. Say which is in force before the first build. A logic demo may trade pixel strictness for every row of `_work/rules.json` passing |
| fonts | which families; confirm they exist before promising fidelity |
| **data and rules the frames do not show** | **Default: ask, never fill in.** List every value the tasks need that no frame draws — a select's other options, the field set after a change, the rule behind a computed value, a limit, a message — in the same message, each with where it goes. Three answers: *given* (data in `gen.js` verbatim; a rule as a table, the same rows in `_work/rules.json`), *take it from X* (read it, do not paraphrase; when X holds more than one candidate — a page of photos, a folder of samples — a contact sheet and a form naming them, because the first pick from a page is rarely the one meant), *make it up* (a `placeholder` ledger line and a row in the handoff's § Placeholders). **Unfilled content** on the task path or the first screen — identical rows, a component's default text, Lorem ipsum — is one question per place: what the frame draws, then *verbatim* (*source*; the default for a test with respondents), *proposed* (the agent's values from the flow, written into the option; *placeholder*; recommended for every demo — "the flow only walks this one step" is not a reason against it: the demo opens on that list, and three identical rows read as broken) or *given*. Never replaced silently (`references/figma-mcp.md` § A mockup can be unfilled). Holds for every later round |
| **behaviour the brief names but no frame draws** | a hover zoom, a drag, "the label follows the input". **Default: describe it in one line before building it** — trigger, what appears, where, how big, what ends it — and ask for a reference. Build on a yes; built from the words alone it is a ledger line. **A loading state** the frames draw (the kit's ring or dots, a state named Loading / Uploading / Processing) has no drawn exit, so the form asks once how it ends: *timer and tap* (recommended for a demo — it advances by itself after 2 s and on a tap, so the presenter never waits), *timer only* (recommended for a usability test — a tap on a loader is behaviour the product does not have), *tap only*. **Only a state that draws a loader**: every other button-less transition on the task path — a viewfinder that frames the document, a shutter, a sheet that closes — is by tap, said in the defaults line, no question. The seconds are a placeholder (the real ones are the network's): a row in the handoff's § Placeholders; the timer itself per `references/interaction-plumbing.md` § Timed transitions. Holds for every later round |
| **a change in Figma, asked alongside the prototype** | **Default: say where it goes before touching Figma; this session's own `use_figma` calls are no route.** A prototype session often becomes where the design is decided, and the frames then catch up — one run changed the prototype and the file together in 17 of 27 rounds and met six Plugin API traps on its own that the mockup skill already names. Three routes, each said in the round's reply: a **new frame, screen or state drawn from the prototype** (a second variant's pages, a confirmation modal, a toast the prototype already has) goes to the sibling skill `/sumsub-design:sumsub-mockup` through the Skill tool, with the hand-over brief from `references/handoff.md` § A change that goes back to Figma — a new element on an existing page is its *Add-to-existing-page* mode; a **bulk edit of existing nodes** (fills, texts, properties, flags across many instances) stays in the session, chunked, after that skill's API sections are read — font loading before any text write, `slot.appendChild` with the other slot children hidden, the `Tint` component, no `throw` at the end of a writing call — and `/figma-use` as the MCP server demands; a **master component or variant** is `/sumsub-design:sumsub-component`. The round is logged as *Figma* or *both*, with the skill that did it (`assets/run-log-template.md`, the rounds table). Holds for every later round |

### Open the run log now, not in Step 8

As soon as the answers are in, copy `assets/run-log-template.md` to `_work/run-log.md` (its prose
deleted, as its first line says) and fill §1 and §2 — what was asked, and for each parameter whether
you asked or decided. The person does not create it and does not have to remember it. From here on it is written at fixed moments, not at the
end:

| when | what goes in |
|---|---|
| a message from the person that changes the build | a row of §1's rounds table: what was asked, what changed, new requirement or the skill's error |
| the person says something does not work or looks wrong | **a §6 line first, the fix after**, tagged *found by* and *cost* — this is the moment it costs one sentence |
| Step 3–6, each build | §3, per prototype |
| Step 7 | §4: the numbers as printed, against the threshold from Step 0 |
| the delivery message (Step 8) | §5 from `node "$SKILL/scripts/runstats.cjs"`, pasted; §8 — the delivery message asks once whether it did its job, and their words go in, or "not said" when the next message brings none. Not "the end of the session": a log closed later gets §3–§5 written from memory in one edit, as one run's did |

## Step 1 — derive the live set from the tasks

The question is **"where could a task lead"**, not "what changes on this screen". Write every
plausible path for each task and sort what you find into three tiers: **every entrance is live** (a
menu item, tab or button leading anywhere a task could go), **every destination shows its real
content** (baked, Step 5), **interactive only where a task is answered**. A dead entrance inside the
tested area is a defect; for every task, name the control that answers it and confirm it is in the
interactive tier. Everything else is scenery and is baked. Anything live beyond the three tiers is
its own yes/no question to the user, with its cost — default no, never folded into a plan table.
Before the first `get_design_context`, zone-diff the shared areas of **every frame of the set against each other** (`cut.js` + `zonediff.sh` on their renders), and later a new frame against the screens already
built; where they differ, ask which is canonical, with a crop. On a first build there are no screens yet, and one run read that as nothing to compare and pulled three design contexts in one burst. `references/research-prototypes.md` § Step 1 in
full — derive the live set from the tasks, and §3 for the tiers with their costs.

## Step 2 — extract from Figma

**Split the frame before reading anything:** the **shell** (never extracted: `shell.js` and its
gate), **controls the design system ships** (not extracted: `controls.js` has their geometry and
states, `data-name` is the key — `assets/components/VERSION.md` — and the frame gives only text,
width, state and icons), and **everything else**, which is what the order below is for. In the
websdk profile the shell is the widget (`websdk-shell.js`, `websdkgate.sh`, one frame per width) and
the controls are `websdk/controls.js` (`references/websdk.md` § Step 2 in the websdk profile — the
widget gate and the frames).

**The shell gate comes first:** the frame's screenshot for the shell's state, `_work/shell.json`,
`scripts/shellgate.sh` against the frame's render — one call, one ledger line (`references/shell.md`
§ The gate, in Step 2).

The order, per frame — every call is the Figma MCP server's (`figma:<tool>`; in Claude Code
`mcp__plugin_sumsub-design_figma__<tool>`, that one even when a claude.ai Figma connector is also
present):

```
get_metadata      frame   → tree, sizes, what is hidden   (a FRAME id: never a section or a page)
get_variable_defs frame   → resolved tokens (again per repeated group — cheaper than dc per variant)
get_screenshot    frame   → the reference PNG for verification
zone-diff shared areas: the set's frames against each other, a new frame against built screens (cut.js + zonediff.sh, not a glance)
  per live zone:
get_metadata      node    → coordinates
get_design_context node   → styles, text, assets   (disableCodeConnect: true)
  once per frame with scenery:
download_assets   frame @2x → one PNG; scripts/cut.js cuts every plate from it (Step 5)
```

* **`disableCodeConnect: true`, always** — or icons come back as snippets.
* **A flag, a photo, any picture inside an instance** is cut from that 2x export at its `get_metadata` rectangle (`cut.js`), never asked for by id: `download_assets` refuses a nested id, and the flags of a slot-based row once cost a quarter of an hour of refusals before the cut.
* **Geometry from `get_metadata`, styles and text from `get_design_context`** —
  never the reverse; layer names lie.
* **Raw responses go to a file**: a large one is saved for you, a small one you
  write to `_work/figma-ref/<node>.jsx` yourself. One that came back inline and is
  too long to retype — a section's metadata of 25k characters — is never copied
  out by hand: its values go into `gen.js` with their node ids, and that is the
  record. Read saved files with `figctx.py` / `figmeta.py`, never from the 2 KB
  preview; `figctx.py` names the leaves a cut response left `UNDEFINED` and the
  icons with a `NAME MISMATCH`.
* **An unfilled place asked in Step 0 is a `placeholder` row** (or *source*, as answered); one off
  the task path is a contradiction row, left verbatim.

`references/figma-mcp.md` before the first extraction, and its § Step 2 in full — extract from
Figma.

## Step 3 — set up a generator, not a hand-written file

One Node script, `_work/gen/gen.js`, builds the deliverable: the data at the top as literals with
the node id beside each value, the CSS, the markup, the page script, rendered through the shell and
the library. Copy `assets/templates/gen-list.skeleton.js` to start. A live control comes from
`assets/components/controls.js` (`--api` lists them, `--api <name>` one header, `--doc <name>` its
VERSION.md section — never its source), a list or table page from `list-table.js`, a column that
shrinks from `fluid-page.js`, a block the window is too short for from `fit-height.js`; `node --check gen.js` before every build. Never
hand-edit the built file; a script that edits one aborts on a missing anchor and asserts its
definitions appear once. Paths relative to `__dirname`; serve with `ROOT=. node
"$SKILL/scripts/serve.cjs"` (`SPA=1` for a routed prototype). A websdk generator takes the shell
from `websdk-shell.js --fragment` and its controls from `websdk/controls.js`: flow markup into
`#content-slot`, no coordinates (`references/websdk.md` § The generator).
`references/architecture.md` § Step 3 in full — set up a generator, not a hand-written file, with
the list-page recipe.

## Step 4 — the coordinate contract

**Absolute children, Figma coordinates**, sub-pixels kept; flex only inside a leaf component.

```css
#app { position:relative; width:1440px; height:900px; overflow:hidden;
       margin:0 auto; }                    /* auto, not flex: never clips */
#app div, #app img, #app svg, #app input { position:absolute; }
```

CSS insets a child by its parent's border width and Figma does not; Figma paints a bottom stroke on
the last pixel row; a clipped zone keeps page coordinates through an offset layer; a standalone
block under 500 wide is `margin:0`. Content in the shell lives in a zero-size anchor at
`#content-slot`, and the generator writes frame coordinates minus the frame's content origin
(`references/shell.md`). A text run positioned by baseline uses a *measured* offset
(`references/text-and-type.md`). The helpers and the reasons: `references/architecture.md` § Step 4
in full — the coordinate contract. **The websdk profile is the exception**: inside the widget the
kit lays the content out and nothing is positioned by coordinate — the frame fixes the order, the
texts and each control's state (`references/websdk.md` § The responsive contract).

## Step 5 — bake the scenery

Bake what **no task touches**. Never a control that carries state; never the area around a live
control a task could change (write the **plate plan** in the ledger first: per plate, what is in it,
which live controls sit on top, whether a task could change their labels, number or order — one
"could" makes it DOM); never anything that has to stretch on an elastic canvas. A whole panel may be
one plate when no task touches it and nothing inside carries state.

1. **Export the frame once at 2x** (`download_assets`, `defaultScale: 2`) and
   cut every plate from it with `scripts/cut.js` — 2x because the respondent's
   screen is DPR 2; a **photo** is then carried as WebP (`scripts/encode.sh`).
2. Coordinates of anything clickable come from the `get_metadata` you have.
3. Plate `<img>`, hit divs only where something happens on click.
4. **Each pixel once** — a modal's plate cut to the modal over the page's plate,
   a plate used twice inlined once — then `node "$SKILL/scripts/weight.cjs"`.

`references/baking.md` § Step 5 in full — bake the scenery.

## Step 6 — build one working thing at a time

**One capability, checked, then the next** — a break then sits next to its cause. One primitive per
control family, written once; anything shared across screens built once; panels off a registry.
Every live control gets a named visible consequence, asserted in Step 7. Verbatim for chrome,
computed for state; a state that affects more than one node lives in a variable. A brief constraint
outranks an implementation suggestion. Read `references/interaction-plumbing.md` before the first
interactive control, including its § Step 6 in full — build one working thing at a time.

## Step 7 — verify by measurement

**Run the checks; never report one you did not run, and do not write a lighter one of your own.** A
page taller than the canvas is gated at its own height (`statecheck.sh --full`). Numbers first,
crops for what the numbers flag, one screenshot per screen at the end. Per screen and per state the
tasks pass through:

| what | how | passes when |
|---|---|---|
| pixels against Figma | `zonediff.sh`; `blockgate.sh` for a content block, or a state of the page cut by an element (`--js`, `--crop-of`) | within Step 0's threshold; untouched zones 0.00% against the last accepted render |
| real clicks reach | `statecheck.sh --hits auto` (a modal: `--hits '#modal'`) | 0 BLOCKED — a probe's `click()` is not a click |
| the design's text is there | `statecheck.sh --texts <figctx.py … --texts> --texts-in '<zone>'` | 0 MISSING |
| frames unbroken | `statecheck.sh --frames '<framed containers>'`, and again with a row forced into its hover (`--css` mirroring it, `--frames '.row\|bottom'`) | 0 FRAME GAP — a hover fill paints over an inset divider |
| behaviour | `statecheck.sh --probe` in a fresh process; a logic demo: `rulecheck.cjs _work/rules.json`; a timed state shot through `--device` or at `#state?hold` — virtual time fires its timer first (`references/interaction-plumbing.md` § Timed transitions) | every probe and every row — **one assertion per visible consequence**: a filter changes the rows *and* its counter |
| plates sharp | probe `naturalWidth === 2 × clientWidth` | every plate |
| the three widths (websdk) | `shoot.js … --device` at 375 and 744, `statecheck.sh --device` for a probe at a phone's width; `websdkgate.sh` for the shell | no sideways scroll at any width; the address search's sheet under 1023, its dropdown above (a dialog keeps its component at every width); the bar as the `narrow` rule says (`references/websdk.md` § The three widths) |

`:hover` cannot be triggered from automation: mirror its rule onto a class, and **tell the user
every hover needs one human look.** A failing assertion is a suspect before it is a verdict — check
Figma first. Measurements are blind to orientation and stacking: one crop per directional or
overflowing element, with its neighbours in frame. `references/verification.md` § Step 7 in full —
verify by measurement, and `references/traps.md` for false failures.

## Step 8 — deviations, then handoff

**When the threshold is met and the checks pass, stop building**; what else could be live is a
proposed next increment in the handoff.

* **The deviation ledger** next to the prototype: element, zone, Figma value,
  prototype value, status (fixed / cannot fix and why / placeholder). Every
  simplification, forced substitution, inference, invented hover and mockup
  self-contradiction. **Never say it matches if it does not.**
* **The handoff**, from `assets/handoff-template.md`, in the team's language:
  the interaction inventory with what is inert on purpose, the measured
  baseline offsets, the state map, § Placeholders and § Rules where they apply.
* **The run log** at `_work/run-log.md`, opened in Step 0, closed here. Before
  the final message:

```bash
[ -f _work/run-log.md ] && find . -maxdepth 1 \( -name 'deviations*.md' -o -name '*.html' \) -newer _work/run-log.md | sed 's|^\./|run-log.md is older than |' || echo "no run log — start it from the template now, §1–§6 from the session"
```

  If it prints, the final message waits. Then `runstats.cjs` for §5, and the version check (pre-flight steps 1–3) before the cost line — a release that landed during the increment is named here, not discovered by the next person's log.

**A delivered increment ends the session**: the next one starts a new session that opens
`handoff.md` first; a one-sentence fix stays.

**Then offer the run log, once, in one line, and never send it anywhere.** The person reads it and
decides: it is their session, and nothing about it is automatic. `references/handoff.md` § Step 8 in
full — deviations, then handoff.

## Step 9 — publish, when asked

Only when the user asks, in this session; deleting likewise, and an approval does not carry to the next round. **Where to publish is a form whenever the request does not name it** — one `AskUserQuestion` asking **who will open the link to the prototype**, its options the audiences, the host in the description. **Only the person's own typed words or that form answer it**: a button, a reply message or an offer line this skill wrote itself ("publish it for the respondents") names nothing — one run put "for the respondents" into its own button, read the click as the answer and deployed to Vercel with no form — so the closing offer after a delivery either names neither audience nor host, or makes the two audiences and "not now" its buttons:
*People outside the company* — an open link on Vercel for clients and respondents, no VPN (`publish.sh`; a project in the team's account, taken down by `unpublish.sh`); recommended for an interview with a client. *Colleagues* — a link on beautiful-pages, the internal GitLab Pages site, through the `/publish-page:publish-page` skill: VPN only, readable by any employee, live once a person merges its request, never deleted, only replaced; recommended for a demo to the team or a review. A claude.ai artifact only when the person names it.
The purpose from Step 0 picks the recommended option and never answers for the person: one run heard "publish", read the purpose as an interview and put the page on Vercel unasked (`references/publishing.md` § Which host, § As an internal page, for employees):

```bash
scripts/publish.sh prototype.html --project <slug> --scope <team> --for outside   # the person's answer; --spa for a routed prototype
scripts/unpublish.sh <slug> --confirm <slug> --scope <team>         # after the round
```

The link to send is `https://<slug>.vercel.app` and the script checks it anonymously; then open it
yourself and walk the first task with real clicks. `vercel login` is the user's to run, never yours.
The slug and URL go in the handoff. `references/publishing.md` § Step 9 in full — publish, when
asked.

## Asking versus deciding

**Ask when different readings mean materially different work**, with options; two frames disagreeing
about a shared element is always an ask. **Otherwise decide under a stated assumption**, except:
what the design does not draw (a loading state, an option list, a rule) is asked, not decided; and
when the screenshot and the words disagree about scope, ask which ("scenario 3 only, or
everywhere?").

**Say every decision you made, in the same response** — which element got which behaviour, what was
left inert, what was approximated. **Speak the brief's language from the first line to the closing box, never switching mid-session, and speak in actions, never in the skill's own numbering**: "Step 9", "the pre-flight", a reference's file name mean nothing to the person — say what is being done and why ("publishing: checking that you are logged in to Vercel, then one file goes up"); the step numbers stay in the checklist and the run log. **End every delivery with its cost**: `node
"$SKILL/scripts/runstats.cjs" --round` prints one line — minutes, tool calls, Figma calls, what took
most of it — and answers "why did that take so long?" before it is asked.

**Deliver first, improve after an "ok".** Hand over what the user is waiting for as soon as its own
check passes; a change to the skill or a shared asset is a separate step that starts with the user's
go-ahead. Follow a written procedure by its purpose, not its letter.

## Reference map

**Read a reference at the moment its row names, and only the section that moment needs** — every
long one opens with its contents, and each step's full text is its own section (`§ Step N in full`).
`traps.md` is never read through: search its symptom column. **Every reference is opened from here,
never through another reference**: a pointer between them names the section; open that file from
this map.

| File | Read it when |
|---|---|
| `references/research-prototypes.md` | **before deciding what is live** — the task list, the live set, rehearsal, the moderator's handout |
| `references/unmoderated.md` | **an unmoderated test (Wynde, Maze, Lyssna), before Step 1** — one tab, the scaffolding, the outcome screen's copy, the rehearsal through the platform |
| `references/figma-mcp.md` | **before the first extraction** — tool division, traps, extraction order |
| `references/baking.md` | any zone with no states; springboard screens, rails, device interiors |
| `references/reading-exports.md` | the SVG-export path: triage, stroke conventions, disagreeing files |
| `references/text-and-type.md` | any text; baselines, ink metrics, centred runs, fonts |
| `references/interaction-plumbing.md` | before the first interactive control |
| `references/theming.md` | a second theme |
| `references/architecture.md` | setting up the generator, or extending an existing prototype |
| `references/verification.md` | writing the verification run |
| `references/handoff.md` | Step 8 and the end of a delivery: the ledger, the handoff, the run log, asking versus deciding in full |
| `references/traps.md` | something behaves inexplicably — scan the symptom column |
| `references/tools.md` | the full table of scripts and templates, and the maintainer's routine: lint, the fixtures, the eval run, `dscheck.js` |
| `references/publishing.md` | putting the prototype on a URL, and taking it down |
| `references/shell.md` | the default dashboard shell — sidebar, island, header — its gate against the frame, and how content anchors inside it |
| `references/websdk.md` | **the websdk profile, from Step 0 on** — how it is decided, the kit as a snapshot, the widget gate, the generator, the responsive contract, the three widths, the known ledger lines, what the kit does not have |
| `/sumsub-design:sumsub-mockup` — a sibling skill, through the Skill tool | **a frame to draw in Figma from the prototype** — a variant's pages, a modal, a toast, a new element on an existing page — never drawn here with `use_figma`; the Step 0 row *a change in Figma, asked alongside the prototype* says which changes go there and which stay, and `references/handoff.md` § A change that goes back to Figma has the brief it is handed |
| `assets/components/VERSION.md` | the controls' values and states, their source, and what is not covered yet — one section at a time, through `controls.js --doc <name>`, never the whole file |
| `assets/CHANGELOG-entry.md` | the entry to paste into the plugin's own `CHANGELOG.md` at merge time, in that file's own format — the update prompt shows these entries verbatim, and an empty "what's new" is what a colleague sees without one |
| `assets/run-log-template.md` | the run log the session keeps at `_work/run-log.md` (opened in Step 0, closed in Step 8): what was asked, decided, measured, and where the skill was wrong. Offered to the user once, sent by nobody but them |
| `assets/handoff-template.md` | writing the handoff |
| `assets/eval.md` | **never during a build — it is the answer sheet.** The fixed brief, the frames' contents and the checklist a run is scored against; opening it while working invalidates that run. For the maintainer setting a check up (`references/tools.md` § Maintaining the skill) |
| `assets/eval-websdk.md` | **never during a build — the websdk profile's answer sheet**: two flows' briefs (Switch device on desktop frames, General flow on mobile frames with a camera), the answers, their checklists and the numbers of the runs so far. For the maintainer, as above |

**Tools, in the order a build meets them** — every script's header says how to call it, and
`references/tools.md` has the full table:

| step | tools |
|---|---|
| 0 | `doctor.sh`; `runstats.cjs` for the run log's §5 and the cost line that ends every delivery |
| 2 | `figmeta.py`, `figctx.py` (saved MCP responses); `shell.js` + `shellgate.sh` (the shell gate; websdk: `websdk-shell.js` + `websdkgate.sh`); `grab.js`, `icons.js` |
| 3 | `gen-list.skeleton.js` → `gen.js`; `shell.js`; `controls.js --api` (websdk: `websdk/controls.js --api`); `list-table.js`, `fluid-page.js`, `fit-height.js`, `test-scaffold.js` |
| 5 | `cut.js` (plates), `encode.sh` (photos), `inkbbox.sh` (margins), `weight.cjs` (the page's weight) |
| 7 | `statecheck.sh` (one call: state, probe, `--hits`, `--texts`, `--frames`, diff), `zonediff.sh`, `blockgate.sh`, `inkbbox.sh`, `pixprobe.sh`, `minpx.sh`, `scanline.sh`, `crop.js`, `shoot.js`, `fluidcheck.sh`, `scaletest.js`, `rulecheck.cjs`; `serve.cjs` to look |
| 9 | `publish.sh`, `unpublish.sh`, `artifact-page.js` |
| the skill | `lint.sh`, `pre-commit`, `dscheck.js` (`--spec` for the WebSDK kit), `fixture.js`, `fixture-websdk.js`, `sbkit.cjs` (the WebSDK kit's snapshot) |
