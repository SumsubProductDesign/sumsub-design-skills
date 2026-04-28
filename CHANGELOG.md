# Changelog

Entries focus on what's **user-visible** (new rules the skill now follows, new audit checks, new commands). Purely internal refactors are noted but terse.

---

## v3.60.0 — 2026-04-28
Caught from another Rules list build (v3.59 audit-PASSED): two cells with text overflowing past the column boundary into the neighboring column. Cells were 193px wide; texts were 224px and 244px ("Velocity threshold — 30 day rolling", "Sanctions screening bypass detection"). Skill never applied truncation to populated cells, and audit had no overflow check.

- **New audit 7.43 — Table cell text overflow.** Walks every visible cell in every Table Starter, finds visible TEXT nodes whose width exceeds `cell.width - 12px` AND have `textTruncation !== "ENDING"`. Flags with the exact fix instruction: walk up to "Text + button" wrapper FRAME, set `layoutSizingHorizontal = "FILL"`; on the TEXT node set `textAutoResize = "HEIGHT"`, `layoutSizingHorizontal = "FILL"`, `textTruncation = "ENDING"`.
- **"Text Overflow Fix" section rewritten** as a mandatory defensive pattern: apply the truncation chain to EVERY populated cell, not just cells where overflow is observed. The skill doesn't know what real content users will paste in — defensive truncation prevents future overflow when text gets longer. Includes a copy-paste `applyTruncationToCell()` helper plus a per-cell-type wrapper FRAME name reference (Text Regular → `Text + button`, ID → `Text`, Date+time → `Date` / `Time` sub-frames).

## v3.59.0 — 2026-04-27
Two issues from the Billing build (file `kHQyyYdPZjEyrSahRmBLUr`):

- **Audit checks 7.33 / 7.39 / 7.41 had a visible-chain bug.** The walk stopped at the immediate container (footer / toolbar / header) instead of going all the way to the audit root. Hidden grand-parents (e.g. an inner Top Toolbar where `Toolbar#736:139 = false` on its parent Table Starter) were ignored, causing false positives like "duplicate visible Button labels" on buttons that were inside a hidden parent and not actually rendering. Fixed: all three walks now use `cur !== root` and a new `visibleToRoot(n, root)` helper is canonical.
- **Skill cherry-picked audit checks instead of pasting the script verbatim.** Build log's PHASE 4 listed 7 named checks ("heading-TEXT antipattern, Header placeholders, Sidebar variant, ...") and reported PASSED — but the full audit script has 40+ checks (7.1 through 7.42). Skill summarized rather than ran. Critical rule extended with banned phrases: enumerated subset listings, "Audit summary", "Audit checks run: ..." flat lists under 30 items, "Paraphrased audit", "Equivalent checks", "I ran the relevant checks". Also added what a real audit run looks like in the log: pasted script, raw `issues.push` output, no reformulation.
- **Audit 7.40 sharpened for sidebars without a Selected property.** Some Sidebar variants (`Type=Billing` is one) don't expose `Selected` on any nav-item — visual active state isn't achievable through Plugin API in those variants. Audit now distinguishes "nav items with Selected exist but none is true" (hard fail, set the right one) from "no nav item exposes Selected at all" (known limitation — flag in build log, do NOT claim "variant inherently activates the X nav item", that's wrong).

## v3.58.0 — 2026-04-27
A teammate's Rules list build (file `bbp6LvphVT5J6QytzGJY6z`) shipped with audit "PASSED 0 issues" but six visible bugs on canvas: missing primary CTA, no active sidebar item, 30+ default tab placeholders ("Tab", "Tab_4", "5", "Beta"), 2 default header cells ("Modified", "Table header"), duplicate "Export" button, all status cells defaulted to Active. Audit was blind to most of these — five new checks plug the gaps.

- **7.38 Default-text leak.** Hard-coded list of component placeholders (`"Tab"`, `"Tab_2"`...`"Tab_10"`, `"Table header"`, `"Table cell"`, `"Button"`, `"Title"`, `"Subtitle"`, `"Placeholder"`, `"Filled text"`, `"Components"`, `"Beta"`) — any visible-chain TEXT matching this list fails. The skill kept letting these through because earlier audits only sampled button labels.
- **7.39 Duplicate visible labels.** Two `*Button*` instances with the same label inside one Top Toolbar / Header / Footer = regex-fallback bug (skill renamed every match instead of probing one). Audit 7.30 already covered button-vs-filter; this catches button-vs-button and filter-vs-filter inside the same container.
- **7.40 Sidebar — no active item.** Setting `Type=Transactions monitoring` selects which section to show but does NOT highlight the current page within. Audit walks the sidebar for any descendant with `Selected=true` variant or any visible `/Selected/i` node — no match = fail with instructions to set the active item to the current page.
- **7.41 Header CTA verification.** When `Buttons` is enabled in `*Header*` and the build log claims a CTA was set, audit checks at least one visible-chain `*Button*` has a non-default, non-empty label. Catches the recurring bug where the skill writes `Button Text` onto a button that lives inside a hidden slot (back button, kebab, etc.) and reports success.
- **7.42 Tab Basic — extra items + counter/badge defaults.** `*Tab Basic*` is a single component with 10–12 `.Tab Basic / Item` slots, each with its own properties. Skill repeatedly fills only the first item (mashing four labels into Label/Counter/Badge slots), leaves items 5+ visible with default `"Tab"` / `"Tab_4"` text, AND leaves `Counter=true` / `Badge=true` showing stray `"5"` and `"Beta"` everywhere. Audit flags any visible item with default-pattern label OR Counter/Badge = true.

Three new rule sections in `sumsub-mockup/SKILL.md` document the correct patterns: how to iterate Tab Basic items + hide the rest, how to set the active sidebar nav item, where the primary CTA actually goes in `*Header*` Type=Generic (it's not the property the skill thinks it is — usually you override one right-side chrome button or build a Title Row in Content).

## v3.57.0 — 2026-04-24
Follow-up on the Domain management build. Deep inspection of all six modal/drawer custom bodies revealed widespread DS violations that v3.56 audit missed, plus the Scenarios title overflow needed a harder rule.

- **Custom TEXT in modal/drawer bodies was Inter Regular 12 with no text style and no bound color.** 61 TEXT nodes across 4 modals + 2 drawers — every `figma.createText()` call in the skill's body-content helpers defaulted to Inter (Figma plugin default) and the skill set `.characters` without touching `.fontName`, `setTextStyleIdAsync`, or fills. Visually close enough to Geist 12px that nothing screamed, but the entire DS token layer was bypassed. New section in `sumsub-mockup/SKILL.md` with mandatory `mkText(chars, style, colorVar)` helper pattern — every modal/drawer body TEXT must pipe through Geist font load + `setTextStyleIdAsync(style.id)` + `setBoundVariableForPaint` for fills. **Audit 7.36** scans every custom body TEXT and flags non-Geist fonts. **Audit 7.37** flags any TEXT without `textStyleId`.
- **Scenarios title cap tightened to 80 characters.** v3.56 said "≤ 120 chars" but the Domain management annotations were 130–170 chars and looked "close to 120" so the skill didn't trim. 80 chars = 600–900px wide at HUG = comfortably fits inside a 1440px screen with zero overlap risk. Banned title patterns enumerated in `sumsub-screen-annotations/SKILL.md`: multi-clause "and"+comma lists, subordinate clauses, setup-action-result triplets. Rule of thumb: if the title has two commas or two periods, rewrite as a single phrase. Fixed version of the same 9 annotations dropped from 1471–1985px to 685–875px on real rebuild.

## v3.56.0 — 2026-04-24
Lessons from inspecting the Domain management — self-service build shipped by v3.55. Four modals and a drawer, all audit-passed, all with the same family of bugs:

- **Slot alignment defaulted to CENTER.** Drawer body slot was 712px tall, custom content 448px → 132px dead space above the content, which made the drawer look bottom-heavy. Root: the skill appended the wrap into the slot but didn't override `slot.primaryAxisAlignItems` — Modal Basic / Drawer Basic slots default to `"CENTER"` for short empty-states. Rule added: after `slot.appendChild(wrap)`, set `slot.primaryAxisAlignItems = "MIN"` to pin content to the top. **Audit 7.35** flags any SLOT still at `"CENTER"` with >60px dead space.
- **External TEXT labels next to Inputs, bypassing the native Label.** Skill set each Input's inner `Label` TEXT to `""` (blank but visible) and appended its own TEXT node as a sibling in a custom "Field" wrapper — redesigning the DS input's spacing, text-style, and label-to-field gap by hand. Rule added: write to the Input's inner `Label` / `Caption` / `Placeholder` TEXT nodes directly after toggling the corresponding boolean property. Never a sibling TEXT. **Audit 7.34** catches Input instances with Label ON + inner TEXT blank + non-empty sibling TEXT in the same auto-layout parent.
- **Footer "Button" default leak.** Every modal footer had a visible `*Button*` in Left actions still carrying its default label `"Button"`. Invisible visually because the parent `Left actions` frame is hidden by default, but structurally dirty — next DS revision flipping that default would leak `"Button"` into every modal produced by the skill. Rule added: explicitly set `.visible` on both `Left actions` / `Right actions` frames, and only configure buttons inside the visible ones. **Audit 7.33** flags any visible-chain `*Button*` inside a modal/drawer footer whose label is still the literal `"Button"`.
- **Scenarios annotations exploded past screen width.** HUG has no upper bound — long titles (130–170 characters, 2–3 sentences) produced annotations 1793–1985px wide against 1440px screens, overlapping neighbors in the flow grid by 200–425px. Rule added in `sumsub-screen-annotations/SKILL.md`: after HUG, if `annotation.width > screen.width - 40`, switch to FIXED at `screen.width` and let the text wrap. Soft cap on title length: ≤ 120 characters, 1–2 sentences. Longer scenarios get split into multiple screens, not stretched onto one.

## v3.55.0 — 2026-04-23
Lessons from a KYB Levels build where three bugs shipped past audit: (1) every toolbar button got the same label as its neighbor filter, (2) Table Starter header had 8 columns while rows had 5, (3) Scenarios annotations ended up floating in the grey margin to the right of screens, 3 per row.

- **Banned `findAll + regex` for property keys.** Root cause of bug #1: skill grepped the entire root for nodes matching `/Label/i` and applied the same text to everything that matched. New section "Component property discovery — probe the instance, don't regex the root" in `sumsub-mockup/SKILL.md` with the canonical pattern: navigate to the specific instance → `Object.keys(instance.componentProperties)` → pick the exact key → `setProperties` on that instance only. Never search across unrelated components.
- **Table Starter column count via DS property, not `.visible = false` on cells.** Root cause of bug #2: skill hid trailing cells manually in rows but not in the header, so header stayed 8-wide while rows were 5-wide. New rule: columns are controlled via the DS variant/number property on Table Starter. If the DS doesn't expose the needed count, build a narrower Starter variant — don't patch visibility. Audit 7.32 flags any `visible === false` set on header/row cells.
- **Scenarios annotation strict rule.** Root cause of bug #3: skill placed annotations at `x = screen.x + screen.width + 24` (right-of-screen) and one per table row (3 annotations for "hovered + error states"). `sumsub-screen-annotations/SKILL.md` now has an explicit "Hard rules" block at the top: ONE annotation per screen (multiple states = multiple screens, not multiple annotations on one screen), position `y = screen.y - annotation.height - 24` and `x = screen.x`, `layoutSizingHorizontal = "HUG"`. Banned positions enumerated with the KYB Levels case as anti-example.
- **Audit 7.30** — regex-fallback collision detector. Scans Top Toolbar buttons and filters, flags when any button label appears verbatim in the filter-label list. Catches bug #1 directly.
- **Audit 7.31** — Scenarios annotation placement. Two sub-checks: (a) each annotation's `x` must be within its screen's x range and `y` must be `< screen.y`, flags `outRight` / `inside` / `below`; (b) counts annotations per screen — more than one on the same target is a fail.
- **Audit 7.32** — manual cell hiding in Table Starter. Flags any header or row with `children.some(c => c.visible === false)`.
- **Task-phrase glossary** in `sumsub-mockup/SKILL.md` — seven phrases that previously caused multi-annotation-on-one-screen builds. "Hovered row + error states" = three screens with one annotation each, not one screen with three callouts. "Empty + populated + error" = three screens. "Per status type" = pool into one annotation describing the table as a whole. Skill reads the glossary before building.

## v3.52.0 — 2026-04-23
- **Killed the hook infrastructure.** Removed `hooks/` directory, `.claude-plugin/hooks.json`. Hooks were platform-dependent (bash on Windows unreliable, Node not always on PATH) and created a false sense of safety that let the skill bypass text rules by saying "hook will catch it". It didn't.
- **Restored plain SKILL.md pre-flight** as the single source of truth. Skill reads local plugin.json, WebFetches remote, fetches CHANGELOG, shows user verbatim prompt, waits for `yes` / `continue anyway`. Exactly what was working in v3.29 before the hook rewrite. The banned-phrase list accumulated over v3.29–3.51 stays — every known bypass is explicitly forbidden.

## v3.51.0 — 2026-04-23
- **Version check double-layered.** Hook now fires on `mcp__figma__.*` matcher (not just `use_figma`) — catches `get_libraries`, `get_metadata`, `get_design_context`, `search_design_system` before they run. The skill can't slip the first tool call past the gate anymore.
- **Proactive check in SKILL.md is back** as a safety net: skill must Read local plugin.json + WebFetch remote + compare at session start, before any tool call. Hook and proactive check overlap intentionally — hook is infrastructure, proactive check is discipline. Either alone has failure modes.
- Banned-phrase list extended with the latest caught bypass:
  - "hook didn't fire yet because I haven't called use_figma, so no check needed"
  - "first tool is get_libraries which doesn't trigger hook, so skipping"

## v3.50.0 — 2026-04-23
- **Rule #0 banned-list extended** — new bypass pattern caught: skill used MEMORY.md entry for a prior task's fileKey as an implicit answer to "where to create". All memory-based pre-answers now explicitly forbidden: "MEMORY.md has a fileKey", "project convention in memory", "prior session established this", etc.
- Explicit clarification in Rule #0: Memory is CONTEXT (component keys, rules, conventions), not ANSWERS. The only valid source for "where" is the user's current message in the current conversation.

## v3.49.0 — 2026-04-23
- **Version-gate hook rewritten in Node.js** (`version-gate.js`). Bash hook didn't work on Windows (no `bash` / `find` / `curl` in the default shell path). Node is bundled with Claude Desktop on every OS — the hook now runs identically on macOS / Linux / Windows. Same behavior: reads local plugin.json(s), picks max SemVer, fetches remote, caches 60s, exit 2 + stderr on mismatch.
- `hooks/hooks.json` updated to invoke `node ${CLAUDE_PLUGIN_ROOT}/hooks/version-gate.js`. The `.sh` version left in the repo for reference but no longer wired in.
- **Known one-time friction**: users still on v3.45 or earlier have a stale `~/.cache/sumsub-design-version-gate.json` with a 3600s TTL (bash hook's original setting). Their cache may report `remote=3.45` for up to an hour even though the real remote is newer. Fix: delete the cache file manually (`rm ~/.cache/sumsub-design-version-gate.json` on mac/linux, `Remove-Item $HOME\.cache\sumsub-design-version-gate.json` on Windows) OR wait an hour.

## v3.48.0 — 2026-04-23
- **Audit catches EMPTY modals** (only default `Slot / Basic` placeholder visible, no custom wrap). Prior audit 7.28 only checked for double-body (>1 visible child); if the skill's body-swap silently failed via try/catch, the modal shipped empty at default 228px height and audit passed. New check: if only visible slot child is the DS default placeholder → fail with "body swap silently failed, remove try/catch".
- **Heuristic modal-height check** — if modal height is suspiciously low (<260px for Modal Basic) AND slot has only placeholder visible → also fails. Catches the pattern where `try/catch` around `slot.appendChild` masked the real error.
- Modal Basic section in SKILL.md gets an explicit "⚠️ NEVER wrap the swap in try/catch" callout with the Verification-success + Remove-domain case documented as the anti-example.

## v3.47.0 — 2026-04-23
- **`ensureDraftsPage()` helper** mandatory at start of every `use_figma` script. `figma.currentPage` resets between tool calls — second/third calls start on Page 1 and silently build there unless the skill re-sets the page. Helper finds/creates the Drafts page and makes it current.
- Rule 7.12 (page-level placement) rewritten with banned bypass phrases: "already Drafts from previous call", "minor — correct at end", "auto mode: using default currentPage", etc. Same pattern as Rule #0 bypass ban.
- Audit check 7.12 already verifies root is on a Drafts page — it will catch the bug even if skill forgets the helper.

## v3.46.0 — 2026-04-23
- **Fix hook picking wrong cached version.** Previous `find | head -n1` grabbed a random stale plugin.json from Claude Code's version cache (could be v3.9 or any other old cached copy), making the gate false-block on machines that actually had the latest version installed. Now collects ALL matching plugin.json files, sorts SemVer, takes max — which is always the currently-loaded version after an update.

## v3.45.0 — 2026-04-23
- **Rule #0 tightened with explicit bypass ban.** Same pattern as pre-flight's auto-mode ban — list of forbidden phrases ("Auto mode: defaulting to Sumsub org", "Reasonable default given work task, proceeding", "I already created the file, let me know if you want to move it", etc.). Any Claude Code auto-mode / minimize-interruptions global directive does NOT override this rule — local skill scope takes precedence.
- Removed the 100+ lines of "Legacy pre-flight rule" dump from SKILL.md — it was burying Rule #0 so the skill was missing it.

## v3.44.0 — 2026-04-23
- **Version gate moved outside skill's judgment.** New `PreToolUse` hook (`hooks/version-gate.sh` + `hooks/hooks.json`) blocks every `mcp__figma__use_figma` call with exit 2 + stderr message if the local plugin is older than remote. Skill cannot invent "auto mode" or "will mention at the end" to bypass — the hook runs before the skill sees the tool call.
- Hook stderr is an explicit instruction to Claude: STOP, show the user the update prompt, WAIT for reply (`yes` / `continue anyway`), auto-run update commands via Bash on consent. Forbidden bypass phrases called out inline so the skill sees the ban every time.
- Cache TTL reduced to 60s (effectively every session). Skipped silently if offline or plugin.json can't be located. Bypass only via env var `SUMSUB_SKIP_VERSION_GATE=1` (explicit user acknowledgement).
- SKILL.md pre-flight text simplified — hook is the source of truth; skill just obeys stderr.

## v3.43.0 — 2026-04-23
- **Update prompts now show what's new.** When pre-flight detects a newer plugin version, it also fetches `CHANGELOG.md` and includes the entries between your local version and the latest in the "What's new" section. No more "there's an update, take it on faith".

## v3.42.0 — 2026-04-23
- **NEW skill** `/sumsub-design:sumsub-component` — build Figma COMPONENTs (or COMPONENT SETs with variants) on explicit demand. Separate from `/sumsub-mockup` which builds screens. Clarifies scope before building, enforces DS tokens + auto-layout + real icons, self-verifies via audit.
- README updated to list 5 skills instead of 4.

## v3.41.0 — 2026-04-23
- **Sumsub UI placement conventions** encoded as concrete formulas, not "ASK the user". Toast top-right (not bottom-right SaaS default), drawer right edge full height, modal centered, etc.
- Audit 7.29 flags toast position mismatching Sumsub top-right.

## v3.40.0 — 2026-04-23
- **Slot placeholder cleanup mandatory** after `slot.appendChild(wrap)` — iterate all slot children and hide any non-wrap. Name-based "Slot / Basic" match is fragile.
- Audit 7.28 catches double-body when >1 visible child in SLOT.

## v3.39.0 — 2026-04-23
- **No emoji as UI icons** — Rule 7.11. 🔐/✉️/📄/⚠️ etc. banned in TEXT content; use real `Icon / *` instances from Assets library. Audit 7.26 detects.
- **Modal/Drawer body wrap has ZERO internal padding** — Rule 7.12. Body frame already pads; double-padding looks wrong. Audit 7.27 detects.

## v3.38.0 — 2026-04-23
- Audit 7.23b catches tables where all visible rows show default cell content (Status / Label / Show more / time placeholder). Signal that cell Type wasn't set.

## v3.37.0 — 2026-04-23
- Audit 7.22 catches Content with `clipsContent=false` (used as overflow hack) or collapsed auto-layout <40px.
- Audit 7.23 catches Table Starter with all 10 default rows visible, or header cells still "Table header".
- Audit 7.24 catches >30 empty visible TEXT nodes inside a Table Starter (signal of direct `.characters=""` hack).
- SKILL.md: dedicated "Table Starter — populate, hide, label" section with 4 concrete rules.

## v3.36.0 — 2026-04-23
- **Title-substance audit** — Rule #5 now detects page title by TEXT style (heading-level), not by frame name. Skill can't bypass by renaming "Title Row" → "Actions Row".
- **Sidebar variant must match context** — Rule 7.10 + audit check. Applicant page needs `Type=Applicants`, Settings pages need `Type=Settings`, etc. Default `Type=Dashboard` only valid for actual Dashboard.
- **Modal SLOT pattern corrected** — `slot.appendChild(wrap)` (not `swapComponent`, not direct Body appendChild). Pre-cache all variables/styles/components sync to avoid "Parent not found".
- Audit 7.25 catches modal body wrap width > slot width.

## v3.35.0 — 2026-04-23
- **Content padding formula** documented: `bindFrameSpacing(content, { pad: "xl", gap: "lg" })`.
- Audit 7.17 verifies Content padding pixel values (L/R ∈ [24,32], T/B ∈ [16,24]) — catches wrong-token bindings even when binding exists.
- Audit 7/7.16 no longer exclude frames named "Content" from binding checks.

## v3.34.0 — 2026-04-22
- Rule 7.9 clarified as universal (not Modal-specific) — every `figma.createComponent()` result goes to `Local components / Components (by Claude)` SECTION, with naming convention table.

## v3.33.0 — 2026-04-22
- **Local components home** — `getLocalComponentsHome()` + `positionInHome()` helpers. Local components now live on a dedicated `Local components` page in `Components (by Claude)` SECTION (#404040), auto-grid layout. No more stacking at (-20000, -20000).
- Audit 7.19 detects orphan COMPONENT nodes outside the home.

## v3.32.0 — 2026-04-22
- Test-bump for auto-update UI verification.

## v3.31.0 — 2026-04-22
- **Auto-update via Bash** — pre-flight prompt now offers "reply `yes` and I'll run the two `claude plugin ...` commands via Bash". No terminal required.

## v3.30.0 — 2026-04-22
- **Force product-docs read** before any `use_figma` call — Rule #2 step-by-step. Task keywords → required `reference/products/*.txt` file. Log must show which docs file + which section was read.

## v3.29.0 — 2026-04-21
- **Pre-flight version check** — skill reads local plugin.json, WebFetches remote, SemVer compare, offers update at start of every session.

## v3.28.0 — 2026-04-21
- Audit 7.1 expanded with substring match for component filler copy ("Life was like a box of chocolates", "Hey, what's up, dude", "Do I feel lucky", "Well, do you, punk", etc.).

## v3.27.0 — 2026-04-21
- SECTION name must end with `(made by Claude)` — Rule 7.7 + audit 7.15.
- Rule 7.8 — spacing / gap / border-radius must be bound to tokens. Audit 7.16 detects unbound non-zero values. `bindSpacing` / `bindRadius` / `bindFrameSpacing` helpers added to `helpers.js`.

## v3.26.0 — 2026-04-21
- Modal/Drawer swap pattern corrected (was incorrect in v3.23–3.25). Also catches default internal Header texts ("Hey, what's up, dude?", "Title", "Description").

## v3.25.0 — 2026-04-21
- "SLOT is read-only via setProperties" documented. Fake-component FRAME detection (Modal·/Drawer·/Annotation·/Table·/Toolbar·/etc.). Audit for fabricated FRAMEs when real DS components should be used.

## v3.24.0 — 2026-04-22
- **Ship Sumsub product docs** in `reference/products/` — 7 .txt files from docs.sumsub.com covering overview, user-verification, KYB, TM, fraud-prevention, case-management, workflow. Triggered in Rule #2 by task keywords.

## v3.23.0 — 2026-04-22
- **Drafts-page rule** — mockups go on page matching `/drafts/i`, create `🛠 Drafts` if missing. Audit 7.12 enforces.

## v3.22.0 — 2026-04-22
- Rule #2 pattern triggers — re-read specific SKILL.md sections when task involves a modal / drawer / table / filters / multi-screen flow.

## v3.21.0 — 2026-04-22
- SECTION #404040 fill rule + audit 7.15.

## v3.20.0 — 2026-04-21
- Modal empty body + vertical centering audit (7.2). Multi-screen grid layout for ≥4 screens (Rule 7.6).

## v3.19.0 — 2026-04-22
- `${CLAUDE_PLUGIN_ROOT}/reference/*.md` paths (absolute) — skill can now actually read references. `findFreeCanvasSpot()` helper; new mockups place right of existing ones.

## v3.18.0 — 2026-04-21
- Default-text audit filters hidden component slots (skip invisible nodes).

## v3.17.0 — 2026-04-21
- Content frame must be white — Rule #6 reinforced + audit 7.05. Background Rules table rewritten (Content = white, not "no fill").

## v3.16.0 — 2026-04-21
- False-positive audit fixes + default-text substring check.

## v3.15.0 — 2026-04-21
- `isInsideInstance()` + `isVisible()` helpers in audit — stop reporting DS component internals. Banned audit-rewriting ("paste verbatim").

## v3.14.0 — 2026-04-21
- Tier awareness: org planKey used for new files. Closed "not published" / "couldn't find it" excuses for component fabrication.

## v3.13.0 — 2026-04-21
- Blocked "bare mockup" workaround (canvas without shell). Mandatory audit before delivery.

## Before v3.13
- Earlier releases focused on initial plugin setup, skill definitions, reference file scaffolding, and initial audit rules. See git history for detail.
