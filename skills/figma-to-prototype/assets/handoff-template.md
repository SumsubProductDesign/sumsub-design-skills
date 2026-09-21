# <Project> — prototype handoff

<!--
Template. Write it in the language the team reads, not necessarily English.
Keep it to what is NOT derivable from the code: conventions, provenance,
decisions, deviations. Do not restate the file structure the reader can see.
Update it when asked, not after every edit - a doc that churns gets ignored.
-->

Clickable prototype for <purpose: moderated usability testing / review / demo>.
Built pixel-exactly from Figma: **the file is the specification**, screenshots
were used only for visual confirmation and for deliberately baked zones.

---

## 1. File map

| Path | What it is |
|---|---|
| `<deliverable>.html` | the prototype. The only artifact |
| `_work/figma-ref/*.jsx` | raw design-context responses — the authority on styles and text |
| `_work/figma-ref/icons/` | assets exported from Figma, verbatim |
| `_work/gen/data.py` | extraction results |
| `_work/gen/template.html` | **all markup, CSS and JS. Edit here, not the built file** |
| `_work/gen/build.py` | injects data into the template |
| `_work/baseline/*.png` | last accepted render per screen — the regression reference |
| (skill) `scripts/serve.cjs` | local server: `ROOT=. node <skill>/scripts/serve.cjs` |

Say explicitly which neighbouring files are *not* part of the prototype.

### Source of truth

| screen / zone | Figma file key | node id | extracted on |
|---|---|---|---|

Whoever picks this up next needs the node ids to re-pull anything. Note which
zones are **baked** (a screenshot plate plus hit overlays) rather than built,
because those are re-exported, not re-coded — and list what would have to be
un-baked if it ever needs to become interactive.

| shell | value |
|---|---|
| source | default (`assets/shell/dashboard`, VERSION.md date …) / the frame's own chrome |
| config | `_work/shell.json` — active path, client, page title |
| gate result | sidebar N%, header N% against frame … — and the reason it was accepted |

A later shell version changes the sidebar and header for every prototype that
uses the default; the content anchor keeps the rest in place.

| components | value |
|---|---|
| source | `assets/components/controls.js`, VERSION.md date … |
| used | e.g. input, radio, checkbox (incl. indeterminate), select, button, alert, toast |
| hand-built | the controls with no component, and why — one line each |
| differences from the mockup | the ledger rows where the design and the component disagree (radius, border, font) |

The same rule as the shell: a later component version repaints every prototype
that uses it, so a control built by hand has to be named here or nobody will
know it was not updated.

## 2. Run and build

Two commands, and the exact dependencies (versions, and what is *not* needed).
State that the build is deterministic and how to check.

## 3. Brief constraints

The rules that cannot be broken without asking the client. List them
numerically — a future session will otherwise "improve" the prototype by
violating them. See the skill's own list for the standard eight.

## 4. Coordinates and typography

The most important section. Cover:

* coordinates in the code = coordinates on the Figma frame canvas;
* the table of zero-size anchor containers and their origins;
* **the measured baseline-offset table per type class**, and that it is measured,
  not derived;
* that geometry came from `get_metadata` and styles/text from
  `get_design_context` — and that design-context coordinates are wrong by the
  border width, so nobody "corrects" the code from them;
* any instance scale factor recovered, and where it applies;
* the preview scale factor and why sizes look odd because of it.

## 5. Architecture

The state object, the panel registry, and — in one line each — what to do to add
a panel, a control, a screen. Name anything that must be built once and reused.

## 6. Interaction inventory

A table of what is live, and **an explicit list of what is deliberately inert.**
Without the second list the next session reads a dead click as an unfinished
feature and "fixes" it.

Three groups, because rule 4 splits them:

* **controls carrying their own state** — radios, checkboxes, fields, select
  menus. Live by default through `controls.js`'s `script`; say here if a screen
  deliberately ships without it;
* **controls that move but lead nowhere** — the state changes and nothing
  follows. Name each one: this is what a moderator needs to know before the
  session, not during it;
* **inert by design** — a picture, and correct as one.

## 7. Known deviations from the design

Numbered, each with the Figma value, the produced value, and the reason. This
is the section that keeps the prototype honest — and the one a reviewer will
check first.

## 8. Contradictions in the sources

Divergences between frames, and self-contradictions inside one frame,
reproduced verbatim. Mark them clearly as source
bugs rather than code bugs, so nobody spends an afternoon "fixing" the code.

## 9. How to verify

The measurement method, the assertion file, the accuracy actually achieved, and
what cannot be verified automatically (hover, and anything else).

## 10. Traps

The ones specific to this project, with the symptom first — that is how the
reader will meet them.

## 11. Published URL

| what | value |
|---|---|
| URL | |
| Vercel project slug | |
| scope / team | |
| protection | off / SSO / password |

Re-publishing the same slug replaces the content at that URL. Without this
section the next session publishes a second prototype beside the live one, and
respondents keep opening the old link. Note who is expected to take it down and
when.

## 12. Transfer

What the files depend on (licences, keys, network), what does not transfer
(conversation history), and what to do when the design changes (which zones are a re-export and which are a rebuild).
