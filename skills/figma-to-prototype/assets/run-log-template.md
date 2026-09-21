# Run log — <prototype name>

Filled in by the skill as it goes, one file per prototype, kept at `_work/run-log.md`.
It exists for one purpose: so the person maintaining the skill can see where it helped and
where it got in the way, without anyone re-telling the session from memory.

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

* **live controls:** how many, which
* **baked plates:** how many, at what scale, or "nothing baked"
* **components used from `controls.js`:**
* **built by hand because the library had no component:**

## 4. What the measurements said

* **shell gate:** offset · landmarks · verdict
* **zone diff per frame:** the numbers, against the threshold agreed in Step 0
* **behaviour probe:** the path walked end to end, pass or fail
* **fluid check** (elastic pages only): widths, the measured floor, anything clipped
* **deviations recorded:** how many, and the one that mattered most

## 5. What it cost

* **wall time:** first message to delivery, and how much of that was waiting for a human
* **Figma MCP calls:** total, and the split (metadata / screenshot / design context / assets)
* **tool calls:**
* **context at the end:**

## 6. Where the skill was wrong

The most valuable section. Everything else can be re-derived from the files; this cannot.

The first log ever written filled this with seven findings, two of which were silent failures in
the skill's own tools — a probe that printed nothing instead of erroring, and a measurement that
reported the sidebar's height as the page's. Neither was visible to 240 automated checks, because
both only happen in live work and neither said a word. If something cost you twenty minutes and
you cannot say why, that is exactly the entry this section wants.

* **corrections you had to make by hand, and to what:**
* **things it claimed were verified that were not:**
* **places it was slower than it should have been, and what it was doing:**
* **anything the walk-through found that every number had passed:**

## 7. Anything else

Free text. "I expected X and got Y" is the most useful sentence in this file.
