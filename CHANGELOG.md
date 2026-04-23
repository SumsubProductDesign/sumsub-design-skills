# Changelog

Entries focus on what's **user-visible** (new rules the skill now follows, new audit checks, new commands). Purely internal refactors are noted but terse.

---

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
