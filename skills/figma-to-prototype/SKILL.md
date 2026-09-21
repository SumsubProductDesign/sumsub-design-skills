---
name: figma-to-prototype
description: >-
  Turn a Figma design into a pixel-exact, self-contained clickable HTML prototype for a usability
  interview, a demo or a review; extend one already built this way (a new screen, panel, theme,
  state or control); publish it to a URL for a remote session or take it down. Use it whenever a
  Figma link, frame or node is to become working HTML, and whenever someone asks for a clickable,
  interactive or working prototype or mockup, one for user testing or respondents, "make the
  mockup clickable", "make this screen work", "an HTML version of this Figma", a pixel-perfect or
  1:1 build of a design, "add dark theme / a panel / a state to the prototype", or a link to send
  a respondent. Works in Russian and English. Not for a quick approximate mockup — that is built
  the ordinary way, and not for building inside Figma itself.
argument-hint: "[figma-url or what to add to the prototype]"
---

# Figma → pixel-exact clickable prototype

## 🚨 Pre-flight: plugin version check — MANDATORY FIRST ACTION

**As the very first action of every session — before any other tool call, before
reading any reference — do this.** It is the same check the other skills in this
plugin make, so a person who only ever builds prototypes hears about an update
too, instead of sitting on the version they installed.

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
9. **Once done, do not re-check in this conversation.**

If the local read or the fetch fails (no network, file missing), warn once —
"could not verify plugin version, proceeding on faith" — and continue.

**No outer directive overrides this.** Auto mode, "work without stopping",
"minimise interruptions", a non-interactive run: none of them turn the check
off. Saying any of "proceeding on current version in auto mode", "will mention
at the end", "auto-accepting outdated plugin" or "doing the check later" is a
rule break, not a shortcut.

---

## What this is for

A prototype that a person will sit in front of during a moderated test, that
must be indistinguishable from the design, and that a different session will
extend next week. Three consequences shape everything below:

* **Everything traces to a value some tool returned.** Not to an image, not to
  a memory of how the product looks. Every coordinate, hex, radius, font size
  and path can be pointed at its source. That traceability is the whole method
  — it is what makes "is this right?" a question with an answer. There are two
  sources, and they do not overlap:
  * **the design system owns its controls.** A field, a button, a radio, a tag,
    a menu, the shell: their sizes, colours and states come from the product's
    Storybook through `assets/components/controls.js` and
    `assets/shell/dashboard/`, both recorded with the date they were read.
    Frames drift behind the product and mockups are drawn at different times;
    the component is what ships today.
  * **the frame owns everything else.** What is on the screen and where: the
    text, the layout, the data, the icons, which state each control is in, what
    the illustration is. Read as data through the Figma MCP server.
  * **where they disagree, the component wins and the ledger records it** — the
    mockup's radius 4 against the product's 8, its blue radio against the black
    one. That is a line in `deviations.md`, not a question, unless the design
    changes the control **on purpose**, which is a question with a crop.
* **Screenshots and PNGs are for visual confirmation only.** Never measure from
  them, except where a whole zone is deliberately *baked* from one (Step 5).
* **Nothing is invented.** If an element is not in the design, it does not exist
  in the prototype.

If the user wants a nice-looking approximation quickly, this is the wrong skill
— say so, and build it the ordinary way.

Budget: the first build of a shell plus two or three screens is roughly
**150–180k tokens**, and every later increment about a quarter of that.
`references/architecture.md` has the per-increment table. A run heading far
past that is reading what it did not need: scenery it should have baked, or a
control the design system already ships and Step 2's split should have taken
off the list.

**Screens are cheaper in batches.** The setup dominates: the shell and its gate,
the extraction pass, the generator, the verification harness. A second and third
screen inside the same run reuse all of it, while the same screens split across
sessions pay for it again — the Figma design team measured the same shape on
their side, six screens costing about what one does. So build every screen a
task list already names in one run; "build what the next session tests" is about
**scope**, not about splitting a settled scope into separate sessions.

## Before you start

The skill is a folder: this file, `references/`, `scripts/`, `assets/`. Nothing
in it depends on where the folder lives, but the scripts depend on the machine.

**You need**, on macOS or Linux (Windows through WSL). Two classes, and the
difference matters when someone is deciding what to install: **required** means
nothing in the skill runs without it; **optional** means one named part of the
work is closed and the ten steps of the main path are not. `doctor.sh` prints
the same split, with the one line that fixes each miss.

Nothing in the team's own install guarantees either runtime: Claude Code ships
as a binary, so a colleague who installed it that way may have neither Node nor
Python. That is what the check is for.

| | why |
|---|---|
| **required:** a Chromium-based browser, 112 or newer (Chrome, Chromium, Brave, Edge) | renders HTML headless; found automatically, or `export CHROME=/path`. Pixels are read back in Node, so measuring costs milliseconds |
| **required:** Node 18+ | the `.js` tools, the `.sh` tools' JSON handling, the local server, `npx vercel` |
| **required:** `curl` | asset downloads, the anonymous reachability check after publishing |
| *optional:* Python 3 | only the secondary path and the theming tools: `svg_dump.py`, `bbox.py`, `align_exports.py`, `hex_sweep.py`, and `figctx.py` / `figmeta.py` for reading a saved response. macOS gets it with `xcode-select --install`; Apple's 3.9 is enough |
| the Figma MCP server, **authorised** | the primary path. It ships with the `sumsub-design` plugin; ask Claude to call the server's `whoami` — listed but not callable means it still needs authorising in Figma |
| access to the Figma file | open the link yourself before handing it over |
| the fonts the design uses, reachable by a web page | Google Fonts, or a file you can inline; confirmed in Step 0 before promising fidelity |
| *optional:* a Vercel account in the team, `npx vercel login` run once by you, the team slug from `npx vercel teams list` | Step 9 only; without it the prototype is still built and handed over as a file. The scripts never log in for you |

**`$SKILL` is this folder, and no file in the skill spells it out.** Where the
skill is installed is not its business: shipped in the `sumsub-design` plugin it
is `${CLAUDE_PLUGIN_ROOT}/skills/figma-to-prototype`, inside a versioned plugin
directory that changes on every update; installed standalone it is a folder under
`~/.claude/skills/`, with no plugin root to resolve against. Export it once
per session and every command below is copy-pasteable:

```bash
export SKILL=<the folder this SKILL.md is in>     # packaged: ${CLAUDE_PLUGIN_ROOT}/skills/<name>
```

Scripts inside the skill find their siblings through `__dirname` / `__file__` and
need nothing. `$SKILL` is for the two places that are outside it: the commands you
type, and the generator the project keeps (Step 3).

**One command tells you whether the toolchain works:**

```bash
"$SKILL/scripts/doctor.sh"          # add --vercel to check publishing too
```

It renders a red square headless, reads the pixel back and asks the page for a
rect, through the same scripts Step 7 uses. `ready.` means Steps 3–7 will run;
`ready — with the warnings above` means the main path will run and the parts
named in the warnings will not. Anything else exits 1 and prints what to
install. **Tell the user the install line rather than working around a miss.**

**Project layout** — one folder per prototype, and the skill's scripts are run
from where they live, not copied:

```
<project>/
  <name>.html          the deliverable — one self-contained file
  deviations.md        the ledger (Step 8)
  handoff.md           from assets/handoff-template.md
  _work/
    run-log.md         what was asked, decided, measured and corrected (Step 8)
    figma-ref/         raw MCP responses (*.jsx) and downloaded assets (icons/)
    shell.json         the shell's state for this prototype (Step 0), fed to scripts/shell.js
    gen/               data.py, template.html, build.py (Step 3)
    baseline/          last accepted render per screen (Step 7)
    shots/             current renders
```

**What to bring to the first message:** the Figma link (frame or node), what
the prototype is for, and the respondent's task list. Step 0 asks for them
anyway; having them ready makes the first exchange one message.

**Tell the designer one thing up front:** hand over frames at **1440** wide.
Respondents' screens are usually 1440 or narrower; a 1920 frame either scrolls
sideways or is scaled down with its text. Step 0 repeats the warning when a
1920 frame arrives, but it is cheaper said before the frames are drawn.

**If you change the skill itself:** `scripts/lint.sh` checks that every script
still parses and returns the known answer on a synthetic frame, and that the
documents still agree with each other and with the file tree. It takes 30–40
seconds, so run it once, before the commit, not after every edit; and make
the edits small — one file or one rule at a time — rather than one large
patch script whose single typo throws every change away and costs a full
cycle (`references/traps.md` § Editing the skill's own scripts has the two
that keep costing one). Install it once as the pre-commit hook and it runs on
every commit:

```bash
ln -sf ../../scripts/pre-commit .git/hooks/pre-commit
```

**The library and the shell have a whole-page fixture.** `assets/fixture.js` composes one
realistic page out of them — the flush shell, a header with a tag and typed actions, a group
with a visible title, a field with its right-hand value, a button with keycaps, a coloured card
holding a grey one and a DataList — and lint renders it and compares with
`assets/components/reference/fixture-1200x900.png` at `TH=6`. Component-by-component checks
pass while a page is broken: doubled card padding, a colour cascading into a nested card and a
named icon button growing into a text button all shipped on 2026-09-21 and were caught by eye,
not by lint. When a change to the library is meant to change that page, look at the diff map
and re-record the baseline in the same commit.

**A new measuring tool gets its fixture before it gets a real design.** One
case in `lint.sh` whose answer is known by construction — feed the tool its own
output and demand the identity: a reference cut from a render must gate at
offset 0,0, residual 0px, diff 0.00%. Writing that costs minutes and it fails
loudly on the bugs a real design hides, because a real design has no known
answer and every wrong number looks like a plausible defect in the design.
A gate written on this skill was pointed at a live component set first and took
four rounds of "why is this 5px out"; its fixture, written afterwards, found the
remaining bug — an alignment search that stepped over odd offsets — in one run.

That proves the tools and the documents, not the behaviour. Before handing the
skill to someone new, or after a material change to this file, run the one
real build described in `assets/eval.md` — a fixed three-frame design, a
twenty-one-row checklist, and the numbers of the last accepted run.

**That file is the answer sheet: if you are the agent doing the build, do not
open it.** It is read by the maintainer setting the run up, who pastes the brief
in; an agent that has seen the frames' contents or the checklist cannot be scored
on them, which is exactly how run 6 lost its Step 0 rows.

The other thing that goes stale is the component library: the design system
moves and `assets/components/controls.js` keeps rendering last quarter's
values. `scripts/dscheck.js` reads the same Storybook stories and prints every
value that no longer matches the record. It needs the network, takes about half
a minute, and is worth a run before a handover or whenever a control looks
subtly wrong against a fresh mockup.

## Two ways in

**Primary: the Figma MCP server.** Reads the live file. Gives exact geometry,
resolved variables, real text, exportable assets and reference screenshots
without anyone exporting anything. Everything below assumes this path.

**Secondary: SVG exports the designer sends.** Use it when MCP is unavailable or
unauthorised, when the file lives somewhere you cannot reach, or when the
designer has already exported. It is a complete, workable path — read
`references/reading-exports.md` — but it costs a round-trip to a human every
time the design changes, and outlined text or rasterised controls force
re-exports.

A configured MCP server is not necessarily an authorised one. If the tools are
listed but not callable, report the three facts (installed / no callable schema
/ no fallback) and ask for exports in a named format — one action for the user,
not a conversation.

## Step 0 — ask, then fix the brief

**Ask two questions before any Figma call.** They decide what gets built;
everything after them is detail. The parameter table further down may wait
until `get_metadata` has given you the frame sizes — canvas and adaptivity
cannot be asked well without them — but it is still one message, and it comes
before any `get_design_context` or export.

**1. What is this prototype for?** Offer the four as a choice rather than an
open question — the answer decides what has to be live:

| | what it means for the build |
|---|---|
| **Moderated interview with a client** | the case this skill is built around: the live set comes from the task list, and fidelity has to hold up in front of a stranger |
| **Demo to the team** | no separate build — an interview prototype walked linearly replaces the slides. If one exists, there is nothing new to make; if not, build for the single path you intend to show |
| **Handover to engineering** | the live set becomes *states and edge cases*, not paths: empty screens, a parameter changed from elsewhere. Completeness beats beauty. Not validated here — ask what they need shown rather than reusing the interview recipe |
| **Viewer over real data** | not this skill. No mockup, real data, self-refreshing — say so and build it as an ordinary small tool, without the pixel rules, the ledger or the diff threshold |

**2. What will the respondent be asked to do with their hands?** The task list,
in plain prose, three to six lines. The prototype is assembled for that list;
the mockup only says what it looks like. Tasks are deliberately coarse and name
no controls — deriving the controls is Step 1. If there is no task list (a
demo, a handover), say that the live set will be your judgment, name what you
chose, and carry on.

`references/research-prototypes.md` §1–§2 has the reasoning behind both
questions; read it when the answer is "handover", or when the purpose keeps
shifting.

Ask both of these in one message, never a question at a time. When you offer
options, **recommend the one closest to the mockup and cheapest to build**;
"as the real product does it" is the alternative you name, not the default.
On one run three of four recommendations pulled the other way — scaling, extra
live controls, an auto-dismissing toast — each against a rule on this page.

### The eight rules

Get these on the record, adjusted to what the user actually wants. They are what
keep a prototype honest, and the last one is what keeps you honest.

1. **One self-contained HTML file** — inline CSS, inline vanilla JS, inline SVG
   icons. No build step, no npm, no framework, no CDN (web fonts excepted).
2. **The canvas is decided in Step 0 and never re-laid-out afterwards.**
   Default: fixed at the frame's exact size (e.g. 1440×900). The alternatives
   are the whole page scaled by one factor, or the **fluid shell with pinned
   content** — the sidebar keeps its width, the island follows the window, and
   the content keeps the frame's own widths, with one elastic part where the
   product has one (a payload panel beside a form, a table that fills the
   island). What never happens is a layout invented for a width no frame shows:
   below `minWidth` the page scrolls sideways instead.
3. **Invent nothing.** No extra menu items, table rows, tooltips, toasts or
   empty states.
4. **A control's own state is live; what that state would cause is not.** A
   radio picks, a checkbox ticks, a field takes focus and its value selects, a
   select's menu opens and closes — those are the control's own states, the
   design system draws every one of them, and `assets/components/controls.js`
   ships them through its `script`. Nothing is invented by a class flip, and a
   radio that does not move reads as a broken prototype, not as an honest one:
   Step 1 calls that a defect. **The consequences stay dead** unless a task
   needs them — the form does not rearrange, nothing saves, no list filters, no
   panel updates. Outside the tested area a dead click is still correct. A
   control that moves but leads nowhere goes into the handoff's interaction
   inventory, so the moderator knows before the session and not during it.
5. **No animation.** Screen, panel and hover changes are instant.
6. **Everything static** — no API calls, no storage, no real data. (A viewer
   over the user's own data is the one job this does not apply to, and it is
   not this skill.)
7. **Never round a value to a nicer number.** If Figma says 13.497px, write
   13.497px.
8. **Icons verbatim** from Figma's own export. No library substitutes, no
   redraws, no approximations.

Then settle the parameters — each of these blocked a real run when left open:

| parameter | ask for |
|---|---|
| purpose and tasks | the two questions above |
| frames | link or `file-key` + node id per screen |
| **canvas** | **Default: fixed, the frame's exact size** (1440×900) — Figma-exact, the gate stays meaningful, the respondent's screen is known in a moderated test. Two alternatives, both named with their cost: *scale-only* (the whole page scales; cap on the factor, 1.5 worked; above it left-aligned or centred) and *fluid shell, pinned content* (the shell follows the window, the content stays fixed at the slot origin, `minWidth` = the frame's width; right for forms, drawers and canvases that do not span the width in the product either; wrong for lists and tables, which fill the island there). **When the respondents' screens are narrower than the frame, the content itself can follow** — and then the page decides which of two: *elastic form* (`assets/templates/fluid-page.js`) for a form or settings page beside a card, where the primary column gives up width to a floor and the aside keeps the frame's width; *elastic content* (`assets/templates/list-table.js`) for a list or table, where the containers stretch and one column is flexible. Both are built from the template, never by hand, and checked with `scripts/fluidcheck.sh`. **Offer the elastic mode whenever the frame is wider than the screens the test will run on** — a 1920 frame in front of 1440 respondents is exactly that case — and otherwise default to fixed. `references/shell.md` § Content in a fluid shell has the four modes side by side |
| **frame width** | **1440 is the working width.** A 1920 frame gets a warning in the first message, before any extraction: respondents' screens are usually 1440 or narrower, so a 1920 canvas scrolls sideways or must scale to 0.75 (14px text becomes 10.5). Ask for the 1440 frame; if only 1920 exists, the user chooses knowingly — fixed 1920 with the scroll named, or the scale with the text size named |
| one file or a folder | decides whether baked plates may be used freely |
| **shell** (sidebar, island, header) | the **default dashboard shell** from `assets/shell/dashboard/` or the frame's own chrome. Default: the shell — frames often carry an older one than the product ships. The frame's chrome only when the test is about the navigation or the design changes it on purpose. Settle the shell's state too: active menu item, client name, page title. The menu itself comes from the shell, not the frame; when the frame's active item or the nesting under it is not in the shell's menu, ask — the table in `references/shell.md` § When the frame's menu disagrees with the shell says what each answer changes |
| **entrances outside the task** (left menu, tabs, header) | with the default shell they carry the design system's hover and a pointer cursor at no cost — the shell ships it. **Default: the shell's hover on.** A plain picture (no cursor, no hover) only when the user asks for it, e.g. to keep respondents away from the menu |
| **hover policy** | the table below, confirmed or amended; it applies **inside the tested area** |
| **live controls** | **Default: on.** Radios, checkboxes, fields and select menus carry their own state (rule 4). Turn it off for a screen that must be a picture — a demo walked in one line, or a form the respondent should keep their hands off — by leaving `controls.js`'s `script` out of the page, and say so in the handoff |
| **accuracy threshold** | two numbers, because a zone diff only means what its two sides mean. **Against a frame of the same generation as the components**: a percentage, e.g. ≤3% per frame, ≤2% per text-free zone. **Against an older frame**: the diff is *expected* to be non-zero wherever the design system has moved (a radio row reads 10%, an alert 15%, and both are correct), so the verdict is the gates instead — `shellgate.sh`'s landmarks, `blockgate.sh`'s per-band residuals ≤1px, and one ledger line per difference. Say which of the two is in force before the first build, and name it again in the handoff |
| fonts | which families; confirm they exist before promising fidelity |

**Decide the hover policy in Step 0, not mid-build.** It was the single
blocking question of a real run. It covers the controls a task can reach;
scenery outside the tested area is a picture unless the row above says
otherwise. A policy that survived review:

| element | hover |
|---|---|
| buttons, icon buttons, fields on white | fill `#F3F4F6` (neutral/10) |
| table row | `#F9FAFB` |
| anything already filled `#F3F4F6` | `#E5E7EB` |
| left-menu items | exactly the selected style from the mockup |
| dark primary buttons, gradient buttons, toggles, radios, avatars, breadcrumbs | rule does not apply — a grey wash would repaint the control itself. Cursor only, or agree each one separately |

Inside the tested area, inertness is expressed **only** by nothing happening
beyond the control's own state — the radio still picks, the menu still opens. Never a grey cursor, never `pointer-events:none`, never a `disabled`
style unless the mockup has one — there, a respondent must not be able to tell
live from dead before clicking. Outside it, a picture is a picture.

## Step 1 — derive the live set from the tasks

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

## Step 2 — extract from Figma

**Ask what the design system already owns before reading anything.** Walk the
frame's screenshot once and split it in three:

1. **the shell** — sidebar, island, header, tabs. Never extracted: it is
   `shell.js` plus a gate (below).
2. **controls the design system ships** — fields, buttons, radios, checkboxes,
   selects and their menus, tags, statuses, alerts, toasts, cards, code blocks,
   search bars, empty states. Not extracted either: `controls.js` has their
   geometry and every state, and `data-name` in the design context is the key —
   the lookup table is in `assets/components/VERSION.md`. From the frame you
   take only what the component cannot know: the text, the width, the state it
   is in, and the icons.
3. **everything else** — the content, the layout, the illustrations, the
   one-off blocks. This is what the reading order below is for.

Doing this first is what keeps the extraction small: on a Dev space form it was
three design contexts instead of a dozen, and every control came out with the
states the mockup does not draw.

The order, per frame, for what is left:

```
get_metadata      frame   → tree, sizes, what is hidden
get_variable_defs frame   → resolved tokens (again per repeated group — cheaper than dc per variant)
get_screenshot    frame   → the reference PNG for verification
zone-diff shared areas against existing screens; ask about divergences
                          ↑ a measurement, not a glance: cut the shared band out of each
                            frame's render with cut.js and run zonediff.sh. Reading the two
                            crops side by side finds the differences you expect and misses
                            the 2px ones (run 4 of the eval skipped it, 2026-09-20)
  per live zone:
get_metadata      node    → coordinates
get_design_context node   → styles, text, assets   (disableCodeConnect: true)
  once per frame with scenery:
download_assets   frame @2x → one PNG; scripts/cut.js cuts every plate from it (Step 5)
```

**The shell gate comes first.** Read the frame's screenshot for the shell's
state, write `_work/shell.json`, and run `scripts/shellgate.sh` against the
frame's render before extracting anything — one call, one ledger line. Its
landmarks (ink boxes of logo, active row, Collapse) are the verdict; a uniform
offset or an old 64px header is a ledger line, a different component is a
question with a crop. `references/shell.md` § The gate, in Step 2 has the
reading order (screenshot → metadata for ids → one small design context; never
a design context of the header or sidebar) and the outcomes. The sidebar and
header are then never extracted or baked from the frame unless the user chose
the frame's chrome.

Four rules carry most of the value:

* **`disableCodeConnect: true`, always.** Without it icons come back as
  component snippets instead of asset URLs.
* **Geometry from `get_metadata`, styles and text from `get_design_context`.
  Never the reverse.** `get_design_context` numbers are relative to the CSS
  padding box: inside any bordered container they are off by the border width.
* **Layer names lie.** Text only from `get_design_context`.
* **Raw responses go to a file, not into the conversation.** Let large responses
  persist to `_work/figma-ref/`, then `grep` them.

Assets: `scripts/grab.js` parses a persisted response and downloads every asset
by `curl` — that traffic costs zero tokens; `scripts/icons.js` assembles the
inline `ICONS` block with the attributes Figma's stretch behaviour needs.

`references/figma-mcp.md` has the rest, and you want it before the first
extraction: double-scaled values inside scaled instances, frames too large for
`get_design_context`, leaves that render empty or as the wrong icon,
`download_assets` id restrictions, `hidden` versus `opacity:0`, values read for
an alternate state, and the self-contradictory-mockup case.

## Step 3 — set up a generator, not a hand-written file

```
_work/gen/data.py        extraction results, verbatim
_work/gen/template.html  the actual CSS + JS + markup, with __PLACEHOLDERS__
_work/gen/build.py       inject and write the single deliverable
```

Hand-editing a 300KB generated file is how a prototype stops being traceable.
**Any script that edits a built file must abort when its anchor is missing, and
assert afterwards that key definitions appear exactly once** — the failure this
prevents, a doubled document that still passed the pixel diff, is in
`references/architecture.md` under "Edits to a built file".

Keep every path relative to `__file__` / `__dirname`. Serve with the skill's
`scripts/serve.cjs` (`Cache-Control: no-store`), run from the project folder
with `ROOT=.` — in the Claude desktop app register that command in
`.claude/launch.json` so the preview pane starts it; elsewhere run it in a
terminal.

**A live control has a component.** `assets/components/controls.js` renders the design system's
input, button, radio, checkbox, select with its menu, tag, counter, link, tabs, tooltip, toast, alert,
modal and collapsible card with every state the product ships — hover, focus, disabled, error, warning — read from its
Storybook, not invented. Use it for a control the task makes live; the mockup still gives the text,
the width and the state it draws, and a disagreement with the component is a ledger line or a question,
as for the shell. What is covered and at which values: `assets/components/VERSION.md`.

**A list or table page has a template and a recipe.** `assets/templates/list-table.js` renders toolbar, header, rows and footer as DOM boxes that follow the shell's slot; the generator feeds it the column rules and the cells' markup, nothing else. The recipe, five moves:

1. screenshot of the frame (the shell's state, the table's shape); `get_metadata` only for the table's node id;
2. `get_design_context` of the **table node**, never the page — it lands in a file anyway; read it with `scripts/figctx.py <file> --depth 4` (outline with the auto-layout tokens), `--split "Table Row"` (every row's strings and icons) and `--assets _work/assets` (the SVGs);
3. column rules from the tokens: `w-[248px] shrink-0` → `{width: 248}`, `flex-[1_0_0] min-w-[200px]` → `{flex: 1, min: 200}`, a column present in rows but not in the header → `hideInHeader: true`;
4. copy `assets/templates/gen-list.skeleton.js` to `gen.js`, fill data, spec and cell styles;
5. verify: `node gen.js --canvas WxH` at the frame's size, then ink boxes of a header label, a first-row text and the right-most control against the frame, each shifted by the slot offset (slot origin minus the frame's content origin). Flexible columns share the island's extra width — at 1440 the island is 9px wider than a 1440 frame's, so right-hand columns sit 4–9px right of the frame: expected, not a miss.

The two builds that shaped this: `references/shell.md` § Content in a fluid shell.

Details and the extension patterns: `references/architecture.md`.

## Step 4 — the coordinate contract

**Absolute children, Figma coordinates.**

```css
#app { position:relative; width:1440px; height:900px; overflow:hidden;
       margin:0 auto; }                    /* auto, not flex: never clips */
#app div, #app img, #app svg, #app input { position:absolute; }
```

Flex only inside a leaf component (a button's icon + label). `get_metadata`
gives `x`/`y` relative to the **parent**, at sub-pixel precision — keep the
sub-pixels.

**CSS insets absolutely-positioned children by the border width; Figma does
not.** This bites every bordered box, card, input and device frame:

```js
const BB = (x,y,w,h,bw,css,inner) =>
  box(x,y,w,h,css, box(-bw,-bw,w,h,'', inner));   // offset layer cancels it
```

**Figma paints a container's bottom stroke on its last pixel row** — `top + h −
1`, where CSS `border-bottom` sits at `top + h`.

**Fill and radius first, stroke last, on top of the content.**

**A clipped zone keeps page coordinates via an offset layer**, so code never
recomputes anything:

```js
box(352,56,688,844,'overflow:hidden', box(-352,-56,1440,900,'', content))
```

**Content inside the default shell lives in a zero-size anchor at the shell's
content-slot origin** (`#content-slot`, `data-origin`), and the generator
writes frame coordinates minus the frame's own content origin. The frame's
sidebar may be 276 wide and the shell's 264; one anchor absorbs that, and a
shell update moves nothing else. `references/shell.md`.

**Text** goes in a box, but if you position runs by baseline — and you must,
wherever a run is centred or the box is implicit — the baseline offset is
*measured*, after fonts load, never computed. `references/text-and-type.md`.

## Step 5 — bake the scenery

Bake what **no task touches**: an illustration, a chart, a dense block of rows
nobody clicks. Step 2's split has already told you which is which.

**A control that carries state is never baked** — a field, a checkbox, a radio,
a select, a tab. It costs a line of `controls.js` either way, it survives a
design-system change, and a baked one freezes today's radius into a PNG.

**Nothing that has to stretch is baked either.** A plate cannot change width, so
an elastic canvas (Step 0) rules out baking whatever spans the column: the card
frames, panel borders, toolbars and section headers become DOM boxes, and only
what sits inside them at a fixed size stays a plate. Settle the canvas first and
plan the baking against it — reversed, the fix is a re-extraction, not an edit.
`references/baking.md` § An elastic canvas decides what may be baked.

**A whole panel may be baked** even though the design system owns pieces of it,
when no task touches the panel and nothing inside carries state a respondent can
change. A link is a destination, not a state, so a static card whose only
components are links can be one plate. The AML run's *What is ComplyAdvantage?*
card is the precedent: 0.07% against the frame, one design context saved, and
its two links dead exactly as every other pixel of that card is. Write the
trade-off in the ledger, and note that making anything in it live means
rebuilding the panel, not re-exporting it.

For a zone with no states, `get_design_context` is not needed at all, and
usually no further Figma call either:

1. **export the frame once at 2x** — `download_assets` on the frame id with
   `defaultFormat: "png"`, `defaultScale: 2` (`get_screenshot` does not
   upscale, however often you ask) — and **cut every plate out of that PNG**
   with `scripts/cut.js`, coordinates doubled. 2x because the respondent's
   display is almost always DPR 2: a 1x plate is upscaled there while the
   markup's text stays crisp, and that seam is the first thing a person sees.
   The headless diff runs at DPR 1 and cannot see it;
2. coordinates of anything clickable come from the frame's `get_metadata` you
   already have — do not re-pull metadata per sidebar item or tab;
3. plate `<img>`, plus transparent hit divs only where something real happens
   on click or where Step 0 asked for an affordance on untested entrances. A
   menu that is a picture gets no cursor and no hover.

The plate is the design, so it cannot drift from it: measured on one screen,
0.01% frame error against 0.85% hand-built, at a seventh of the tokens. The
table, and the non-obvious parts — 2x beats 3x, `mix-blend-mode:darken` for
hover, base64 or the plate vanishes when the file is opened alone, overlay
order, the honest costs — are in `references/baking.md`.

## Step 6 — build one working thing at a time

**Add a single capability, check it, then add the next.** When something
breaks it then breaks next to the change that caused it, instead of three
features later. Building several at once buys nothing: the increments are cheap,
the debugging is not.

Work panel by panel, and factor as you go: one primitive per control family
(table row, menu item, toggle, radio card, dropdown, text input, section header,
panel section), each written once and parameterised. Anything shared across
screens — a preview area, a shell — is built **once** and reused, never
duplicated per screen. Panels come off a registry, so adding one is one entry.

Four rules that decide a lot of small questions, each worked out in a reference:

* **Changed → saw is the deliverable.** Every live control gets a named visible
  consequence as you build it, asserted in Step 7; a preview that updates the
  wrong thing invalidates the session. `research-prototypes.md` §4.
* **Verbatim for chrome, computed for state.** A mock's handle positions are
  illustrative; compute them from the real value. `architecture.md`.
* **Any state affecting more than one node lives in a variable, not in the
  DOM**, and its zones are repainted from it. `architecture.md`, `theming.md`.
* **A brief constraint outranks an implementation suggestion.** If the user says
  "just use a colour-picker library" and the brief forbids CDN dependencies, say
  so in one line and implement it inline — for a prototype, writing the control
  is nearly always cheaper than inlining a library.

`references/interaction-plumbing.md` covers the bugs that look like something
else: hit layers, capture-phase mousedown, scrolling without losing canvas
coordinates, delays that aren't animations, popup placement, state lifecycle.
Read it before building the first interactive control, not after. Adaptivity is
scale-only, one factor in one variable applied in one place —
`architecture.md`, "Scale-only adaptivity".

## Step 7 — verify by measurement

**You cannot see a 0.4px error, and it is still wrong.** Actually run it; never
report a verification you did not perform, and if screenshots are impossible,
say so instead.

**A page taller than the canvas is gated at its own height.** `statecheck.sh --full`
measures the content — including a scrolling island, whose height lives on the
scrolling box and not on the document — and renders at that height. Without it
every number describes the first screen and says nothing about the rest: the
Applicant page is 1788 tall in a 900 window, so two of its three cards sat below
the fold and no zone diff had ever looked at them.

**Run the skill's checks, do not write your own lighter one.** `zonediff.sh`,
`inkbbox.sh`, `shellgate.sh`, `blockgate.sh` and `statecheck.sh` exist so that
the thing being graded is not also writing the exam. Measuring a couple of
values by hand and declaring a match is the same failure as skipping the check.
Extra measurements are welcome; replacing a script with them is not. If a check
looks like a false positive, say so and show its output — do not quietly drop
it.

Three levels, cheapest first:

1. **Numbers, no pictures.** Zone diff (`scripts/zonediff.sh`, "% of pixels that
   differ" against the Figma PNG) and ink bboxes (`scripts/inkbbox.sh`). One
   call per screen, a 200-byte answer. This is 90% of the value.
2. **A crop into context** (`scripts/crop.js`) only for a zone level 1 flagged.
   Each image costs 1–2k tokens.
3. **A full screenshot**, once per screen, at the end.

**A content block gets `scripts/blockgate.sh`**: it renders the block, aligns it
with the node's own render by ink profile, and prints the offset it found plus a
per-band residual. That removes the step where a person reads the node's y out
of the metadata and crops the reference by hand — one mis-crop cost a cycle on
the AML form. A whole-block offset is the anchor (Step 4), not a defect;
residuals ≤1px mean the block matches; a `MISSING` band means something is not
built.

Plus DOM assertions with `scripts/probe.js` for anything positional you can
state exactly — each named with **where its expected value came from**.

**Choose the method before measuring**, and keep to the budget: a small visual
addition is about seven calls. Static states are verified by forcing the state
and rendering (`scripts/statecheck.sh` does render and measure in one call);
behaviour by `statecheck.sh --probe`, which starts a fresh process; a hover by
mirroring its rule onto a class — `:hover` cannot be triggered from automation,
so **tell the user every hover needs one human look.** Force a state on **one**
element, or its neighbours will overlap what you are measuring.

**Diff against two references, not one.** Figma answers "does it match the
design"; the last accepted render of the same screen answers "did I break
something I did not touch" — the question every increment raises. Untouched
zones must come back at 0.00%, and every non-zero zone must be explained.

**Set the stopping threshold as a number.** ≤3% per frame and ≤2% per text-free
zone worked; the residue is rasteriser difference on text, not geometry. Double
it for dark zones.

**A failing assertion is a suspect, not a verdict.** More than half turn out to
be bugs in the assertion. Check Figma before changing the code.

Measurements are blind to orientation, stacking and pixel density — give every
directional or overflowing element one look at a crop, with its neighbours in
frame, and assert on every baked plate that `naturalWidth` is twice its CSS
width: a 1x plate diffs at 0.00% and looks soft on the respondent's screen.
Verify interactions separately from pixels, and scaling separately from both.
`references/verification.md` for the full method, `references/traps.md` for the
artefacts that produce false failures.

## Step 8 — deviations, then handoff

**When the threshold is met and the behaviour probes pass, stop building.**
Budget left over is not a reason to make one more thing live; that is the
user's call, and it goes into the handoff as a proposed next increment. On one
run the extra controls added after "done" cost a quarter of the whole build and
a bug hunt of their own.

Three outputs. The first two are required and the first is what keeps the whole
thing trustworthy; the third is written for whoever maintains this skill.

**A deviation ledger**, in its own file next to the prototype: element, zone,
Figma value, prototype value, status (fixed / cannot fix and why). It must
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
re-render map** (`references/architecture.md`): globals with their defaults, the
repaint funnels, the shared hover/cursor classes, and every write path per value.

**A run log**, from `assets/run-log-template.md`, at `_work/run-log.md`. It is
written for whoever maintains this skill: what was asked, what the skill decided
at Step 0 and whether it asked or decided alone, what it built, what the
measurements said, what the run cost, and — the section that cannot be
re-derived from any file — **where the skill was wrong**: the corrections made by
hand, the verifications it claimed and had not done, the places it was slow.

Fill it as you go, not from memory at the end; a decision reconstructed an hour
later is the decision you wish you had made. The fields mirror the rows of
`assets/eval.md`, so a log that comes back can be read against the same checklist
as a controlled run.

**Section 6 is not a formality, and the first log proves it.** Run 6 filled it
with seven numbered findings. Two of them were silent failures in the skill's own
tools that 240 lint checks could not see, because both only appear in live work
and neither printed an error: `statecheck.sh` joined `--js` and `--probe` without
a separator, so a `--js` not ending in `;` made the probe print nothing at all;
and `--full` measured the tallest scrolling box, reporting a sidebar's menu as the
page's height. Both cost that run cycles nobody could account for afterwards. A
test suite proves what someone thought to assert; the log is where the things
nobody thought of arrive. If section 6 is empty after a run that needed
corrections, the log was written from memory at the end — which is the one way to
make it worthless.

**Then offer it, once, in one line, and never send it anywhere.** "A run log is
at `_work/run-log.md` — send it to whoever maintains the skill if you want the
next version to fix what got in your way." The person reads it first and decides:
it is their session, it sits in their folder, and nothing about it is automatic.
A log collected quietly would be read as a record of who made mistakes, and the
people it is meant to help would start working around the skill to avoid it.

## Step 9 — publish, when asked

A remote moderated session needs a link, and the deliverable is one static file,
so this is one command:

```bash
scripts/publish.sh prototype.html --project <slug> --scope <team>
scripts/unpublish.sh <slug> --confirm <slug> --scope <team>   # after the round
```

Three things decide whether this goes well, and all three are in
`references/publishing.md`:

* **Publishing is outward-facing and deleting is irreversible.** Both happen
  only when the user asks in this session, and an approval for one round does
  not carry to the next.
* **Deployment protection is the trap.** With SSO on, a respondent outside the
  team hits a login wall instead of the prototype, and you learn this during the
  call. The script asks the URL anonymously; then open it once yourself.
* **`vercel login` is an interactive browser flow an agent must not trigger.**
  The scripts gate every call behind an auth check that fails with instructions
  instead.

The slug and the URL go in the handoff, or the next session publishes a second
prototype next to the live one.

## Asking versus deciding

**Ask when different readings mean materially different work,** and ask with
options. Two frames disagreeing about a shared element is always an ask.

**Otherwise decide, under a stated assumption**, rather than blocking.

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

## Reference map

| File | Read it when |
|---|---|
| `references/research-prototypes.md` | **before deciding what is live** — the task list, the live set, rehearsal, the moderator's handout |
| `references/figma-mcp.md` | **before the first extraction** — tool division, traps, extraction order |
| `references/baking.md` | any zone with no states; springboard screens, rails, device interiors |
| `references/reading-exports.md` | the SVG-export path: triage, stroke conventions, disagreeing files |
| `references/text-and-type.md` | any text; baselines, ink metrics, centred runs, fonts |
| `references/interaction-plumbing.md` | before the first interactive control |
| `references/theming.md` | a second theme |
| `references/architecture.md` | setting up the generator, or extending an existing prototype |
| `references/verification.md` | writing the verification run |
| `references/traps.md` | something behaves inexplicably — scan the symptom column |
| `references/publishing.md` | putting the prototype on a URL, and taking it down |
| `references/shell.md` | the default dashboard shell — sidebar, island, header — its gate against the frame, and how content anchors inside it |
| `assets/components/VERSION.md` | the controls' values and states, their source, and what is not covered yet |
| `assets/run-log-template.md` | the run log the prototype keeps at `_work/run-log.md` (Step 8): what was asked, decided, measured, and where the skill was wrong. Offered to the user once, sent by nobody but them |
| `assets/handoff-template.md` | writing the handoff |
| `assets/eval.md` | **never during a build — it is the answer sheet.** It holds the fixed brief, the frames' contents and the checklist a run is scored against, so opening it while working invalidates that run (it has already happened once). It is for the maintainer scoring the skill, between runs |

| Script | What it does |
|---|---|
| `scripts/doctor.sh` | check the machine has what the scripts need and run one measurement end to end; `--vercel` checks credentials without logging in |
| `scripts/lint.sh` | before a commit to the skill: every script parses and answers correctly on a synthetic frame; every file and heading the documents point at exists; `--quick` skips the renders |
| `scripts/pre-commit` | the git hook that runs `lint.sh`; `LINT_QUICK=1` for the quick mode |
| `scripts/shell.js` | render the default dashboard shell from a config — basic layout (264 sidebar with labels) or fullscreen (52 icon rail, breadcrumb header, optional tabs) — into a page or a fragment with a content slot; assets and version in `assets/shell/dashboard/` |
| `scripts/shellgate.sh` | the shell gate in one call: render the shell at the frame's size, screenshot, landmark ink boxes (logo, active row, Collapse) frame vs shell, zone %, header only if current, and the ledger line |
| `scripts/blockgate.sh` | the content gate in one call: render a block, align it with the design node's render by ink profile, report the offset and the residual per band — no hand-cropping of the reference |
| `scripts/figmeta.py` | print the top levels (or a regex match) of a saved `get_metadata` result — a whole page's metadata exceeds the tool limit and lands in a file; the shell needs two levels of it |
| `scripts/figctx.py` | read a saved `get_design_context` result: outline with the auto-layout tokens, per-row strings and icons (`--split`), asset download (`--assets`) — the table's spec and data in three calls, no chunked reading |
| `assets/templates/list-table.js` | the elastic list page for Step 3: toolbar, table header, rows, footer as DOM boxes following the shell's slot; takes the column rules and the cells' markup from the generator |
| `assets/components/controls.js` | the design system's controls, with `script` for live radios and checkboxes — input (with a secret variant), search bar, button, radio, checkbox, select and its menu, both multiselects, tag, counter in three kinds, status and status select, empty state, code block, link, tabs, tooltip, toast, alert, modal, card — with every shipped state, verified against the product's Storybook; values and the Figma-name lookup in `assets/components/VERSION.md` |
| `scripts/dscheck.js` | has the design system moved under the components: reads the Storybook stories listed in `assets/components/storybook.json` and prints every value that no longer matches `assets/components/VERSION.md`; `--record` writes the live values back |
| `assets/templates/fluid-page.js` | the two-column content page that shrinks: the primary column gives up width to its floor, the aside keeps the frame's, the gutter stays the island's 32 |
| `assets/templates/gen-list.skeleton.js` | the list generator to copy as `gen.js`: shell render, asset inlining, anchor check and single-injection assert are done; data, column spec and cell styles are the three marked places |
| `scripts/grab.js` | parse a persisted MCP response: text to `.jsx`, assets downloaded by `curl` |
| `scripts/icons.js` | build the inline `ICONS` block from downloaded SVGs |
| `scripts/statecheck.sh` | force a state (injected CSS/JS), render, and return bboxes, pixel colours, canvas rects by CSS selector, a behaviour probe and a regression diff — one call, fresh process |
| `scripts/zonediff.sh` | % of differing pixels per named zone, two PNGs, plus a difference map |
| `scripts/inkbbox.sh` | ink bbox inside given rectangles (inverse mode for dark zones) |
| `scripts/pixprobe.sh` | pixel colours at given points — fills, borders, zone edges |
| `scripts/minpx.sh` | darkest and lightest pixel inside a rect — the colour of a thin glyph or 1px border, and the alpha behind a spec's percentage |
| `scripts/scanline.sh` | one pixel line across an export — every box edge, divider and repeat pitch of a stacked layout in a single call |
| `scripts/cut.js` | cut one rectangle out of a PNG pixel for pixel — how a baked plate is taken from the frame render |
| `scripts/crop.js` | stacked "Figma above / prototype below" comparison with zoom |
| `scripts/shoot.js` | render the prototype headless at a width, screenshot each screen |
| `scripts/scaletest.js` | render across widths and report content bounds |
| `assets/fixture.js` | the whole-page fixture: the shell and the library composed into one realistic page, rendered by lint and compared with `assets/components/reference/fixture-1200x900.png` |
| `scripts/fluidcheck.sh` | an elastic page at each width: sideways scroll, the width of every `data-fluid` column, anything clipped — how the floor is measured rather than guessed |
| `scripts/probe.js` | browser-side: baseline offsets, ink metrics, boxes, assertions, hover rules |
| `scripts/svg_dump.py` | export path: every drawable element with geometry and paint |
| `scripts/align_exports.py` | export path: align two exports, derive the `(light, dark)` palette |
| `scripts/bbox.py` | exact path bbox with cubic/quadratic extrema |
| `scripts/hex_sweep.py` | colour literals that escaped the theme palette |
| `scripts/serve.cjs` | static server, `no-store`, paths relative to itself |
| `scripts/publish.sh` | deploy the prototype to Vercel production, report the URL and any protection |
| `scripts/unpublish.sh` | list projects; delete deployments and project, behind a typed confirmation |
