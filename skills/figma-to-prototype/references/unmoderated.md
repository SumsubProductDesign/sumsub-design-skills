# An unmoderated test: Wynde, Maze, Lyssna

Read this when Step 0's purpose is an unmoderated test — before Step 1, with
`research-prototypes.md`. Everything in that file about tasks and the live set
still holds; this file is about what changes when **nobody sits beside the
respondent**. It comes from one study of three scenarios run through Wynde
(2026-09-28 → 10-02), where every rule below cost a round trip with the
designer, and the outcome screen was rewritten three times.

## What is different

In a moderated session the prototype is one tab among others, a dead end is
recovered by the moderator, and the task is spoken. In an unmoderated platform:

* **the platform records what the respondent agreed to share** — in Wynde one
  specific tab ("Tab for recording", "Sharing this tab"), and nothing else, so a
  second tab is a hole in the recording. It is not one platform's quirk: Maze's
  own help asks participants of a live-website test to share the *entire screen*
  for exactly this reason, and refuses a tab or a window — because the site
  opens elsewhere and a tab share would lose it (help.maze.co, *Website Test*);
* **the task lives in the platform's own tab**, which the respondent switches
  away from to work; the prototype is the only thing in front of them;
* **completion is a self-report** ("Did you finish the task? — Yes, I did"), not
  a URL the platform checks; the URLs the prototype reaches are visible only in
  the recording;
* **nobody can help**: a button that does nothing, a shortcut the respondent
  cannot read, a tab that does not come back — each one ends the task for that
  person, and the recording shows them stuck.

## The rules, one per thing that went wrong

| the platform's fact | the rule | what it replaces |
|---|---|---|
| one tab is recorded | **everything is one tab.** No `target="_blank"`, no `window.open`. A mock third-party site (a registry, a bank page, an email) is a **route of the same SPA**, with the task's state kept across the trip and a way back inside the page | a mock registry opened in a new tab, invisible to the recording |
| a page cannot focus another tab | **no "back to the test" that depends on the browser.** `window.opener.focus()` is ignored for tabs in every browser; a button built on it does nothing. The return is a *text instruction* on the outcome screen, with a close attempt as a convenience, never as the plan | a "Back to the test" button the designer pressed on her recording, to no effect |
| `window.close()` closes only tabs a script opened | **every close has a fallback.** Whether the platform's tab counts as script-opened depends on how the platform opens it, and nobody can tell you — so the button tries, waits, and when the tab is still there turns into the instruction | — |
| completion is a self-report | **the outcome screen says exactly what to do next**: that this task is done, which number of how many, how to return to the platform, what to answer. The outcome routes (`/done/approved`) stay — they are the recording's bookmarks — but nothing is built around the platform reading them | outcome URLs designed as if the platform matched them |
| the task is in another tab | **the scaffolding is in the prototype from the first build**: a test bar with the task text (and any menu the test needs, such as "Registries"), and the outcome screen — `assets/templates/test-scaffold.js`. It must read as *not the product*: system font, a colour the design system does not use, outside the frame's canvas. Otherwise respondents rate it with the UI | a yellow bar invented in a later round |
| shortcuts | **in words, browser-neutral, platform-neutral.** `Control + Shift + Tab` goes to the previous tab in Chrome, Edge, Firefox and Safari on Mac and Windows. Never glyphs (`⌘ ⌥ ←` was not recognised), never a Chrome-only chord | `⌘ + ⌥ + ←` on Mac, `Ctrl + Tab` on Windows — the first Chrome-only, the second goes the wrong way |
| respondents are not operators | **no instrumentation the respondent has to carry.** A completion code to copy into the platform ("T1-A-C-S2-R0-N0") was specified, built and removed within an hour: "looks super complicated for respondents". What the analysis needs goes to `window.__events` and the recording | the code on the outcome screen |
| the platform is a black box | **rehearse through the platform before any respondent**: the designer runs one task as a respondent, in the platform's own recording tab, and watches the recording. Four things to note, because the platforms' help pages do not say them: **what it asks to share** (a tab, a window, the screen), **how it opens the prototype** (same tab, new tab, a frame), **whether the close button closes** there, and **what "Stop sharing" does to the task**. Publish to respondents only after that, and write the four answers into the handoff's § For the platform | the designer's own screen recording, after the build |

## Scaffolding

```js
const T = require(SKILL + '/assets/templates/test-scaffold.js');
page.css += T.css; page.script += T.script;
html += T.testBar({step: 1, total: 3, task: 'Find the company in the registry and approve the check.',
                   links: [{label: 'Companies House', href: '/registry/ch'}, {label: 'Cyprus Registrar', href: '/registry/cy'}]});
// … the prototype …
html += T.outcome({step: 1, total: 3, platform: 'Wynde', lines: ['Decision: approved'], hidden: true, id: 'done'});
```

* `testBar` — a 40px strip above the canvas: "Task 1 of 3", the task text, an
  optional menu of links the test needs (the mock sites). The canvas moves down
  by its height; say so in Step 4's coordinate contract, and keep it **out of
  the zone diff** (it is not in the frame). `data-scaffold` marks every
  scaffold element, so a hit test or a text check can be scoped away from it.
* `outcome` — the end-of-task card, shown by the prototype when the task's
  success rule is met (or when the respondent reaches a dead end that counts as
  an outcome). Its copy is fixed by the rules above: *Task N of M done*, the
  lines you pass (a decision, a reference), one button *Back to <platform>*
  that tries `window.close()` and, when the tab is still there 400 ms later,
  becomes the instruction — click the platform's tab, or Control + Shift + Tab,
  then answer "Yes, I did". It never says to keep the tab open. Every outcome
  and every close attempt is pushed to `window.__events`.
* The script also **disarms every `target="_blank"`** in the page at load and
  records each one — a last line of defence, not a licence: the link should
  not be there.

The scaffold is deliberately not from `controls.js` and not themed: it must
look like the test, not like the product.

## What stays the same

* The pixel rules. The respondent must not be able to tell prototype from
  product — more so than in an interview, because nobody is there to say "this
  part is a sketch". Threshold and gates as in Step 0.
* The task list drives the live set (`research-prototypes.md` §2–§3). Three
  scenarios are three task lists; build them as routes of one SPA
  (`/s1`, `/s2`, `/s3`) with their own fixtures, and a `rules.json` row per
  success rule (`rulecheck.cjs`).
* The handoff. Add a section *For the platform*: the entry URL per scenario,
  what the outcome screen tells the respondent, and the rehearsal's result.

## Publishing a routed prototype

A History-API prototype needs every path served as `index.html`:
`publish.sh … --spa`, and locally `SPA=1 node scripts/serve.cjs` (see `publishing.md` § Publish). The link
sent to respondents is the project's own domain and nothing else; open it as a
respondent would (a private window, no login) and walk one task before it goes
into the platform.
