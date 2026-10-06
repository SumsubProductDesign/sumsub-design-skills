# The tools

Every script in `scripts/` and every template in `assets/templates/`, with what it does.
Each file's own header is the manual: how to call it, every option, and the run that made it
necessary. SKILL.md lists them by the step that meets them; this is the full table.

| Script | What it does |
|---|---|
| `scripts/doctor.sh` | check the machine has what the scripts need and run one measurement end to end; `--vercel` checks credentials without logging in |
| `scripts/lint.sh` | before a commit to the skill: every script parses and answers correctly on a synthetic frame; every file and heading the documents point at exists; `--quick` skips the renders |
| `scripts/pre-commit` | the git hook that runs `lint.sh`; `LINT_QUICK=1` for the quick mode |
| `scripts/shell.js` | render the default dashboard shell from a config — basic layout (264 sidebar with labels) or fullscreen (52 icon rail, breadcrumb header, optional tabs) — into a page or a fragment with a content slot; assets and version in `assets/shell/dashboard/` |
| `scripts/shellgate.sh` | the shell gate in one call: render the shell at the frame's size, screenshot, landmark ink boxes (logo, active row, Collapse) frame vs shell, zone %, header only if current, and the ledger line |
| `scripts/blockgate.sh` | the content gate in one call: render a block, align it with the design node's render by ink profile, report the offset and the residual per band — no hand-cropping of the reference |
| `scripts/figmeta.py` | print the top levels (or a regex match) of a saved `get_metadata` result — a whole page's metadata exceeds the tool limit and lands in a file; the shell needs two levels of it |
| `scripts/figctx.py` | read a saved `get_design_context` result: outline with the auto-layout tokens, the leaves a truncated response left undefined (`UNDEFINED`), downloaded SVGs whose own id names another layer (`NAME MISMATCH`), per-row strings and icons (`--split`), every text string for `statecheck.sh --texts` (`--texts`), asset download (`--assets`) — the table's spec and data in three calls, no chunked reading |
| `assets/templates/list-table.js` | the elastic list page for Step 3, the product's SnsTable: toolbar (controls.js search and buttons), header, rows with optional expanded content that opens on a click, footer; three sizes; the divider drawn above a hover fill. Takes the column rules and the cells' markup from the generator, returns `css`, `html` and `script` |
| `assets/components/controls.js` | the design system's controls, with `script` for live radios and checkboxes (`--api` prints every signature) — input (with a secret variant), textarea, inline select, search bar, button, radio, checkbox, select and its menu, both multiselects, tag, counter in three kinds, status and status select, empty state, code block, link, tabs, tooltip, toast, alert, modal, card — with every shipped state, verified against the product's Storybook; values and the Figma-name lookup in `assets/components/VERSION.md` |
| `scripts/dscheck.js` | has the design system moved under the components: reads the Storybook stories listed in `assets/components/storybook.json` and prints every value that no longer matches `assets/components/VERSION.md`; `--record` writes the live values back |
| `assets/templates/fluid-page.js` | the two-column content page that shrinks: the primary column gives up width to its floor, the aside keeps the frame's, the gutter stays the island's 32 |
| `assets/templates/test-scaffold.js` | an unmoderated test's scaffolding, deliberately not the design system: the task bar above the canvas and the outcome card (done, which of how many, back to the platform with a close attempt and the text fallback); disarms every `target="_blank"`; events in `window.__events` |
| `assets/templates/fit-height.js` | a fixed-height block that scales down from its top centre when the window is short — the vertical counterpart of `fluid-page.js`; reserve for what stays put under it |
| `assets/templates/gen-list.skeleton.js` | the list generator to copy as `gen.js`: shell render, asset inlining, anchor check and single-injection assert are done; data, column spec and cell styles are the three marked places |
| `scripts/grab.js` | parse a persisted MCP response: text to `.jsx`, assets downloaded by `curl` |
| `scripts/icons.js` | build the inline `ICONS` block from downloaded SVGs |
| `scripts/artifact-page.js` | the page a claude.ai artifact publishes, made from the build: no document tags, the canvas in a sideways-scrolling box, the canvas colour on the page, the size against 16 MB |
| `scripts/rulecheck.cjs` | a logic demo's rule table (`_work/rules.json`), row by row in fresh processes: type, pick and click as a person would, read the outcome, compare; `--markdown` for the handoff's § Rules |
| `scripts/encode.sh` | a photo plate to WebP or JPEG through Chrome's own encoder, pixel size kept — never a drawn plate |
| `scripts/weight.cjs` | where a page's weight is: every inlined image heaviest first, with its format, pixel size and place; photo-like PNGs, duplicates and plates that are not 2x flagged; the page against a limit (16 MB by default) |
| `scripts/modelcheck.cjs` | the session's model and effort, read from its transcript: `ok` on Opus or Fable at medium or above, otherwise `OFFER` and the line to show the person once (the prototype's quality may suffer) |
| `scripts/runstats.cjs` | §5 of the run log, counted from the session's transcript: the skill version, wall time split into the person's turn and the agent's, every message the person typed, tool and Figma calls, peak context and where it grew. Works after the fact |
| `scripts/statecheck.sh` | force a state (injected CSS/JS), render, and return bboxes, pixel colours, canvas rects by CSS selector, a behaviour probe, a real-click hit test of every live control (`--hits`), the design's strings found on the page (`--texts`) and a regression diff — one call, fresh process |
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
| `scripts/fluidcheck.sh` | an elastic page at each width: sideways scroll, the width of every `data-fluid` column, anything clipped, any text on more lines than at the widest width — how the floor is measured rather than guessed |
| `scripts/probe.js` | browser-side: baseline offsets, ink metrics, boxes, assertions, hover rules |
| `scripts/svg_dump.py` | export path: every drawable element with geometry and paint |
| `scripts/align_exports.py` | export path: align two exports, derive the `(light, dark)` palette |
| `scripts/bbox.py` | exact path bbox with cubic/quadratic extrema |
| `scripts/hex_sweep.py` | colour literals that escaped the theme palette |
| `scripts/serve.cjs` | static server, `no-store`, paths relative to itself; `SPA=1` serves the entry for every route of a History-API prototype |
| `scripts/publish.sh` | deploy the prototype to Vercel production, report the URL and any protection |
| `scripts/unpublish.sh` | list projects; delete deployments and project, behind a typed confirmation |

## Contents

- Maintaining the skill
- Before you start, in full
- doctor.sh in Step 0, in full
- Anthropic's skill-authoring guide, and what keeps each rule

## Maintaining the skill

**Before a commit to the skill**, `scripts/lint.sh` checks that every script
still parses and returns the known answer on a synthetic frame, and that the
documents still agree with each other and with the file tree. It takes about a hundred seconds with the renders (`--quick` for the
document checks alone), so run it once, before the commit, not after every edit; and make
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

The other thing that goes stale is the component library: the design system
moves and `assets/components/controls.js` keeps rendering last quarter's
values. `scripts/dscheck.js` reads the same Storybook stories and prints every
value that no longer matches the record. It needs the network, takes about half
a minute, and is worth a run before a handover or whenever a control looks
subtly wrong against a fresh mockup.

## Before you start, in full

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
| the Figma MCP server, **authorised**, on a **Dev or Full seat** | the primary path. A View or Collab seat (or a Starter plan) gets 6 tool calls a month, and a build takes 20–70 (`references/figma-mcp.md` § The call budget is the seat's, and a View seat has six a month). It ships with the `sumsub-design` plugin; ask Claude to call the server's `whoami` — listed but not callable means it still needs authorising in Figma |
| access to the Figma file | open the link yourself before handing it over |
| the fonts the design uses, reachable by a web page | Google Fonts, or a file you can inline; confirmed in Step 0 before promising fidelity |
| *optional:* a Vercel account in the team, `npx vercel login` run once by you, the team slug from `npx vercel teams list` | Step 9 only; without it the prototype is still built and handed over as a file. The scripts never log in for you |

**`$SKILL` is this folder, and no file in the skill spells it out.** Where the
skill is installed is not its business: today it is a folder under
`~/.claude/skills/`, after packaging it is `${CLAUDE_PLUGIN_ROOT}/skills/<name>`
inside a versioned plugin directory that changes on every update. Export it once
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

**Project layout**: the tree in SKILL.md, Before you start.

**What to bring to the first message:** the Figma link (frame or node), what
the prototype is for, and the respondent's task list. Step 0 asks for them
anyway; having them ready makes the first exchange one message.

**Tell the designer one thing up front:** hand over frames at **1440** wide.
Respondents' screens are usually 1440 or narrower; a 1920 frame either scrolls
sideways or is scaled down with its text. Step 0 repeats the warning when a
1920 frame arrives, but it is cheaper said before the frames are drawn.

**If you change the skill itself:** `scripts/lint.sh` before the commit (install it
as the pre-commit hook: `ln -sf ../../scripts/pre-commit .git/hooks/pre-commit`), small
edits rather than one patch script, and the rest of the maintainer's routine —
the whole-page fixture, a fixture for every new measuring tool, the eval run,
`dscheck.js` against the Storybook — in `references/tools.md` § Maintaining the skill.

## doctor.sh in Step 0, in full

**Run `"$SKILL/scripts/doctor.sh"` first, before the two questions.** Two
seconds, and the only thing between a missing runtime and a failure halfway
through a build, after the Figma calls have been spent. Nothing guarantees a
colleague has Node (Claude Code ships as a binary; only the npm install route
brings it), and left to judgment this gets run sometimes and not others.

* `ready.` — carry on.
* `ready — with the warnings above` — carry on; the parts named in the warnings
  are closed, and say which they are when one of them comes up.
* anything else — **stop, say what is missing in one sentence, and offer to run
  the install line it printed.** The person this skill is for is a designer, not
  a terminal user: "Node is missing — shall I run `brew install node`?" is the
  useful form. Run it only on an explicit yes, report, then run `doctor.sh`
  again. Never install without being asked; never type a password — if the
  install wants `sudo`, hand it back with the command; never work around the
  miss, because a measurement skipped for want of its tool is a measurement
  nobody made. If `brew` itself is absent, the installer at nodejs.org is a
  download the person makes, not a command.

## Anthropic's skill-authoring guide, and what keeps each rule

The guide is `platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`.
This skill was measured against it on 2026-10-04 and broke six of its rules. Each
rule below is kept by a lint check, named by its exact label so lint can confirm
the check exists, or by a step before a release that a person runs. A rule with
neither is a rule that drifts back.

| rule | kept by |
|---|---|
| `SKILL.md`'s body stays under 500 lines; a step's full text is its reference's "Step N in full" | lint: `SKILL.md body under 500 lines` |
| `name` is lowercase letters, digits and hyphens, and matches the folder | lint: `frontmatter name matches the folder` |
| `description` is present, at most 1024 characters, says what the skill does and when to use it | lint: `description present` (a warning above 1024) |
| `description` is written in the third person — no "I", "you", "we" | lint: `description has no first or second person` |
| references sit one level deep: every one is in `SKILL.md`'s map, and a pointer between them names its section | lint: `every reference-to-reference pointer names its section`, `listed: ` |
| a reference longer than 100 lines opens with its contents | lint: `every long reference opens with its contents, in order` |
| no time-sensitive information — the runs and their dates live in `research-prototypes.md` §7 | lint: `SKILL.md carries no dates`, `no 'since / before / after / fixed <date>' in the references` |
| a long procedure has a checklist the model copies and ticks | lint: `SKILL.md: the run checklist names every step 0–9` |
| MCP tools are named with their server | lint: `the Figma tools are named with their server` |
| scripts handle their errors and say what to do, rather than leaving it to the model | every script's own lint cases (a missing file, a bad argument, an empty answer each print a line and exit non-zero) |
| test with the models the skill will run on | before a release: one build from `assets/eval.md` on the model the team uses — Opus or Fable; the team does not run the skill on Sonnet or Haiku, so they are not tested. A session started on another model, or below medium effort, is offered a switch once: lint: `modelcheck.cjs: Sonnet or a low effort is offered a switch, Opus at high is not` |
| at least three evaluations, written before the documentation they test | before a release: `assets/eval.md`'s run, plus the last three real runs' logs read against its checklist |
| watch how the model navigates the skill — which files it opens, which it never does | before a release: in that eval run, `runstats.cjs` lists the reads; a reference nobody opens is a candidate to merge, one opened every time is a candidate for `SKILL.md` |

