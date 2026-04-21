# Example Prompts — `sumsub-design`

Copy-paste-ready prompts for common tasks. The plugin works in any language,
but the phrasing below is tuned to produce the right behaviour — don't
water it down.

> ⚠️ The phrases in **bold** are what reliably triggers correct behaviour.
> If the skill is misbehaving, re-check that your prompt includes them.

---

## Table of contents

- [Creating mockups](#creating-mockups)
- [Specifying where to create](#specifying-where-to-create)
- [Running the audit](#running-the-audit)
- [Updating the plugin and re-auditing](#updating-the-plugin-and-re-auditing)
- [Fixing audit findings](#fixing-audit-findings)
- [Flow Builder — specific](#flow-builder--specific)
- [Applicant page — specific](#applicant-page--specific)
- [Reviewing / inspecting existing work](#reviewing--inspecting-existing-work)
- [Block vs Page](#block-vs-page)

---

## Creating mockups

### Generic table page

```
/sumsub-design:sumsub-mockup

Build an Applicants list page in the Sumsub org. Show:
- 10 rows of realistic applicant data (mix of statuses, countries, levels)
- 3 filters in the toolbar: Status, Country, Level
- Top right CTA: "Create applicant"
- Tabs: All, Pending review, Approved, Rejected

Fill every cell with realistic data — no "Label", "Text in cell",
"Subheader text" defaults. Run the audit before sharing the link.
```

### Detail view

```
/sumsub-design:sumsub-mockup

Build an Applicant detail page for John Doe (individual, Germany,
KYC level Basic, Approved). Use Pattern 2 from reference/layout-patterns.md
(collapsed 52px sidebar, Summary panel on the left, content on the right).
Include at least: Personal info card, Documents card, Checks card,
Events section. Put it in the Sumsub org.
```

### Flow in multiple screens

```
/sumsub-design:sumsub-mockup

Build the Domain management flow — all screens:
1. Empty state (no domains)
2. Domain list (5 domains with different statuses)
3. Add domain modal
4. Verifying state
5. Verified state + toast
6. Delete confirmation modal
7. Row actions dropdown
8. Error state
9. Failed verification state
10. Re-verify flow

Add Scenarios annotations above each screen (numbered 1.1, 1.2, ...).
Realistic data in every screen — no placeholders. Sumsub org.
```

---

## Specifying where to create

The skill asks this as Critical rule #0, but you can pre-answer:

### In Sumsub org (default for work)

```
Build <thing> in the Sumsub organization (planKey from design-system.md).
Don't use my personal Drafts — I'll hit the MCP file-creation limit.
```

### In an existing file

```
Work in this file: <figma-url>
Put the new frame right of the last existing frame on the current page.
```

### In team / Drafts

```
Create in my Drafts / in the "Product Design" team (not the Sumsub org).
```

---

## Running the audit

### First audit of a fresh build

```
Run the sumsub-mockup audit on the frame you just built.
Set productContext = "<flow-builder | applicant-page | table-page | null>".
Paste the audit script VERBATIM from SKILL.md — do not simplify it,
do not strip checks.
Return the raw JSON output. Do not fix anything yet; I want to see the
full issue list first.
```

### Audit an existing mockup (not built by this skill)

```
Audit this Figma frame for Sumsub DS compliance:
URL: <figma-url>
Node ID: <node-id>

Paste the audit script from SKILL.md VERBATIM with:
- ROOT_ID_HERE = "<node-id>"
- productContext = "<flow-builder | applicant-page | table-page | null>"

Return the raw JSON. Don't fix anything — I want the list.
```

---

## Updating the plugin and re-auditing

This is the canonical one for testing fixes:

```
Update sumsub-design plugin to the latest version, then rerun the
sumsub-mockup audit verbatim on <frame>.

Steps:
1. Terminal: sumsub-update
2. Restart Claude Desktop fully
3. Read the audit script from the SKILL.md shipped with the updated plugin
4. Paste it VERBATIM into use_figma — do not simplify, do not strip checks
5. Set ROOT_ID_HERE and productContext
6. Return raw JSON. Do not fix anything — I want to see the output first.
```

---

## Fixing audit findings

### Fix a specific finding

```
The audit returned this issue:
  "3 VISIBLE TEXT node(s) with default value 'Label' — Rule #7"

Find the 3 visible *Filter* instances in <frame> with the default 'Label'
text and replace each with a realistic filter name from: Status, Country,
Level, Source, Date, Risk level. Use setProperties on the filter's
"Label" component property — don't detach the instance.

Then re-run the audit to confirm it's gone.
```

### Fix all findings in one pass

```
Walk through every issue in the last audit output and fix each one.
Rules:
- Don't detach instances
- Don't rename component instances
- For placeholder text inside instances, use setProperties or
  setInstanceText with realistic content
- For Content frame background, bind to
  semantic/background/neutral/inverse/normal

After all fixes, re-run the audit verbatim and show me the final output.
```

### Specific: Content background is grey

```
The Content frame in <frame> has no fill and the root subtlest-grey
shows through. Bind its fill to
semantic/background/neutral/inverse/normal (white).
Key: 567811a0cf497ac911288a2f4a75a1d89ebff75c
Re-run audit after.
```

---

## Flow Builder — specific

### Build canvas with nodes

```
/sumsub-design:sumsub-mockup

Build a Flow Builder canvas page in file DnjKrpmudNkdNio4P8yFQB
(the real Workflow Builder file — components live there as locals).

Required shell — all real instances, not custom frames:
- *Sidebar* (Type=Integrations, Collapsed=False)
- Flowbuilder / *Header* (real component, not generic *Header*)
- Canvas (Status=Draft) with Top/Right/Bottom bars
- Wizard bar at bottom

Nodes on canvas (5 total, one of each type):
- Starting Step (x=0, y=0) — Start Badge visible
- Level Step (x=260, y=100)
- Condition (x=520, y=48)
- Action (x=780, y=46)
- Review Step (x=780, y=168)

Only the Starting Step has Start Badge. Node statuses: mix or default,
NOT all Danger.

Connectors: strokeWeight 2.51, bezier per reference/flowbuilder.md.
Condition branches: green for match, blue for else. Others: grey.

Read reference/flowbuilder.md BEFORE building. Run audit with
productContext="flow-builder" before sharing the link.
```

---

## Applicant page — specific

```
/sumsub-design:sumsub-mockup

Build an Applicant page (Pattern 2 from layout-patterns.md) in the Sumsub org.

Read BEFORE building:
- reference/applicant-page-pattern.md
- reference/ap-component-catalog.md
- reference/figma-gotchas.md

Structure:
- *Sidebar* collapsed 52px, Type=Applicants
- AP page header at x=52, y=0, w=1388, h=152
  - Applicant name: "Donald Trump"
  - Client type: Any, User type: Admin, In review: No
  - Sandbox flag: true
- Summary panel at x=52, y=152, w=380
- Body at x=432, y=152, w=1008, VERTICAL, gap=16

Body cards:
- APCardCollapsible (Personal info, expanded, with real data)
- APCardCollapsible (Documents, expanded)
- APCardCollapsible (Checks, expanded)
- APCardCollapsible (Risk labels)
- Applicant notes section

Use real data throughout. Run audit with productContext="applicant-page".
```

---

## Reviewing / inspecting existing work

### Quick structure overview

```
Inspect this Figma frame and give me a structural overview:
URL: <figma-url>

For each direct child, show: name, type, x/y/w/h, and if it's an
INSTANCE — the main component name + parent library.
Don't go deeper than 2 levels. No fixes, just the tree.
```

### Check specific property

```
In <frame>, find all *Filter* instances and list their 'Label' text
values. I want to see which filters are customized and which still
have the default "Label".
```

### Compare two mockups

```
Compare these two frames structurally:
A: <url-1>
B: <url-2>

List what B has that A doesn't, and what A has that B doesn't.
Ignore absolute positions. Focus on: instance counts by component,
custom FRAME count, presence of shell components (Sidebar/Header/etc).
```

---

## Block vs Page

### Build just the block

```
Rebuild THIS block (not the whole page):
URL: <figma-url pointing to the specific frame>

Don't wrap it in a full page layout — I want just the block.
Place it on free canvas right of the original, same file.
```

### Build a full page wrapping a block

```
Build a full page (Sidebar + Header + Content) in the Sumsub org,
and inside Content put this block: <block-url>.

Page title: "<title>"
Sidebar variant: Type=<Applicants/Integrations/...>
```

---

## Anti-patterns — what NOT to say

These prompts produce bad output. Avoid them:

| ❌ Bad prompt | Why | ✅ Better |
|---|---|---|
| "Make a nice mockup" | No context, skill guesses product | "Build a table page for applicants with: 10 rows, 3 filters, CTA button" |
| "Just the canvas, no sidebar" (for Flow Builder) | Broken shell — violates Rule #3 | "Build the full Flow Builder page: Sidebar + Flowbuilder Header + Canvas with bars + nodes" |
| "Create it in my current file" | Assumption — skill may have no current file | "Work in <url>" or "Create in Sumsub org" |
| "You can skip the audit this time" | Violates Rule #8 | Always require the audit |
| "Simplify the audit, it's too noisy" | Gaming the metric | "Keep the audit as-is. If you see false positives, report them, don't strip." |
| "Use custom frames if components are missing" | Violates Rule #3 | "If a DS component is missing, stop and tell me — don't build a fake" |

---

## Troubleshooting prompts

### Skill delivered a link without running the audit

```
You just shared a mockup link without running the audit. That violates
Rule #8 (audit is mandatory). Go back, run the full audit verbatim on
the frame you built, and show me the output. Do not deliver until it
returns "✅ Audit PASSED".
```

### Skill simplified the audit

```
You wrote a custom simplified audit instead of pasting mine verbatim.
That's Rule #8 violation — you can't grade your own exam.

Re-read the audit script in SKILL.md, paste it VERBATIM with only
ROOT_ID_HERE and productContext adapted, and run it. No edits to
the check logic.
```

### Skill built a fake component instead of using the real one

```
You built <X> as a custom FRAME. For <product>, <X> must be a real
DS component instance. The component key is in reference/<product>.md.
Find it, import it, replace your fake.

If the component is genuinely not in the connected libraries, stop and
tell me — don't silently fall back to a fake.
```
