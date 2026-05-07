# Changelog

Entries focus on what's **user-visible** (new rules the skill now follows, new audit checks, new commands). Purely internal refactors are noted but terse.

---

## v3.107.0 — 2026-05-08 (fake bump to test v3.106 HARD STOP on VM)
No-op. User on v3.106; this remote = MINOR mismatch. Tests:
1. Does pre-flight WebFetch succeed on VM (or 404 like before)?
2. If it succeeds → does agent show the v3.106→v3.107 mismatch and stop?
3. If it fails → does agent now HARD STOP per v3.106 rule, instead of "proceeding with local version"?

---

## v3.106.0 — 2026-05-08 (HARD STOP on remote-check failure — class-not-symptom)
**VM test exposed:** when WebFetch on `raw.githubusercontent.com/.../plugin.json` returns non-200 (or any non-JSON), the agent rationalizes "proceeding with local version" and skips the version check entirely. The fallback rule line in SKILL.md ("could not verify plugin version, proceeding on faith") was itself the bypass — gave the agent cover to invent paraphrases like "Remote check returned 404 (repo not publicly accessible at that path) — proceeding with local version".

URL is in fact reachable from at least the maintainer's machine (curl returns 200, version field intact). Either VM-network blocks GitHub raw, or WebFetch tool behaves differently than curl, or agent hallucinated. All three classes cause silent skip — same root: agent has an option to proceed on remote-check failure.

### Fix: removed the proceed-on-faith fallback. HARD STOP on any remote-check failure.

In `sumsub-mockup` and `websdk-mockup` SKILL.md:
- New "Remote-check failure handling" subsection: if WebFetch doesn't return clean JSON with a `version` field, agent must show user the failure (status, first 300 chars of body) and ask `retry / continue anyway / update`.
- Added paraphrase phrases to banned-bypass list: "Remote check returned 404 — proceeding with local version", "could not verify plugin version, proceeding on faith", "repo not publicly accessible at that path, continuing", "WebFetch failed, defaulting to local".
- Old fallback line ("warn once and continue — don't block on infrastructure issues") DELETED.

This is the same class-not-symptom pattern as the SemVer-prior fix in v3.100. The agent had a documented escape hatch; remove the hatch instead of banning specific paraphrases of it.

---

## v3.105.0 — 2026-05-08 (fake bump to test v3.104 auto-bootstrap on VM)
No-op. User on v3.104 with auto-bootstrap Step 0; this remote = MINOR mismatch. Tests:
1. Did Step 0 fire on first `/sumsub-mockup` after v3.104 install on VM?
2. Did `${CLAUDE_PLUGIN_ROOT}` resolve correctly in the Bash tool?
3. Did `hooks/install.sh` install the hook + register PreToolUse?
4. Does the now-installed hook block this tool call with the v3.104→v3.105 mismatch message?

---

## v3.104.0 — 2026-05-08 (auto-bootstrap version-check hook on first mockup invocation)
User asked: "I want sumsub-setup to be auto-invoked when any mockup skill is called". Closing the class — no team member should have to remember to run `/sumsub-setup` manually before their first mockup.

### Changes
- **New `hooks/install.sh`** in repo root — single self-contained installer that writes `~/.claude/hooks/sumsub-version-check.sh`, chmods it, and merges PreToolUse entry into `~/.claude/settings.local.json` (preserves existing hooks like MemPalace). Idempotent.
- **Step 0 — Auto-bootstrap added to all 3 mockup SKILL.md files** (`sumsub-mockup`, `websdk-mockup`, `sumsub-id-mockup`):
  - One bash check: `test -f "$HOME/.claude/hooks/sumsub-version-check.sh"`
  - If missing → run `bash "${CLAUDE_PLUGIN_ROOT}/hooks/install.sh"`
  - If present → skip silently
  - Always continues to existing pre-flight version check
- **`/sumsub-design:sumsub-setup`** still exists for explicit re-install / verbose verification, but is no longer the only path.

### Effect
On a fresh machine, first `/sumsub-mockup` (or `/websdk-mockup`, `/sumsub-id-mockup`) call triggers the install automatically. After that, every Figma tool call goes through the structural version-check hook. Team rollout simplified: install plugin via marketplace → use any mockup skill → done.

---

## v3.103.0 — 2026-05-07 (added /sumsub-setup skill for per-machine hook install)
**Live test on user's VM showed:** plugin-level hooks not delegated by Claude Code, AND user-level hook installs in `/Users/konstantin/.claude/` only enforce on that machine. To enforce on team members' machines (each VM, each Mac, each developer), each user must install the hook locally.

### Fix: shipped `/sumsub-design:sumsub-setup` skill

New skill: `skills/sumsub-setup/SKILL.md`. Contains step-by-step bash to:
1. Create `~/.claude/hooks/`
2. Write `sumsub-version-check.sh` with the version-check logic
3. `chmod +x` it
4. Use Python to merge a PreToolUse entry into `~/.claude/settings.local.json` (preserves existing hooks like MemPalace)
5. Verify install

User runs `/sumsub-design:sumsub-setup` once per machine. Idempotent (re-runnable). Hook then enforces structurally on that machine.

For team rollout: each designer installs plugin (via marketplace), runs setup once. After that, every Figma tool call goes through the version check; structural block on mismatch.

---

## v3.102.0 — 2026-05-07 (fake bump for user-level hook test)
No-op. User on v3.101, this remote = mismatch. Tests user-level PreToolUse hook from `~/.claude/settings.local.json`.

---

## v3.101.0 — 2026-05-07 (fake bump for anti-SemVer test)
No-op. User on v3.100, this remote = MINOR mismatch (typical case where SemVer prior would say "1-2 minor behind, low risk, proceed"). v3.100 explicitly bans that thought — verify on real prompt.

---

## v3.100.0 — 2026-05-07 (anti-SemVer prior framing)
**Identified root cause of pre-flight bypass: trained SemVer convention beats text rule.** Agent showed an explicit threshold rubric (MAJOR=stop, 3+MINOR=recommend, 1-2 MINOR=ignore-with-flag, PATCH=ignore) that's NOT in SKILL.md — it's from training. Standard SemVer "PATCH = safe bug fix" is well-known and heavyweight; our skill text rule "any diff = STOP" is one string of context, lightweight. Training wins.

### Fix: explicit anti-prior framing in pre-flight section

Added new "⚠️ CRITICAL — read this BEFORE you reach for SemVer reasoning" block at the top of pre-flight section. Content:
- Explicit acknowledgment that the agent has SemVer training priors
- Concrete reasons why this plugin breaks SemVer convention (PATCH bumps ship audit gates, banned patterns, pattern-doc corrections)
- List of trigger thoughts that signal the prior firing ("1-2 minor behind, low risk", "PATCH — игнорирую", etc.)
- Direct instruction: STOP when prior fires; this plugin's rule is opposite of SemVer

Also changed step 3 phrasing from "Compare SemVer" (which invokes training prior) to "Compare exact strings (NOT SemVer logic). If local string ≠ remote string → continue regardless of which side is PATCH/MINOR/MAJOR".

This is option 2 of the four ways to beat trained priors:
1. Harness hook (didn't work — Claude Code doesn't honor plugin hooks)
2. **Explicit anti-prior text framing in skill (this commit)**
3. Custom fine-tune (impractical)
4. Different model (out of control)

Per architecture, text-vs-training is still probabilistic. But explicit reasoning that contradicts the training prior shifts the weight closer to even. Hopefully enough.

---

## v3.99.0 — 2026-05-07 (fake bump #5)
No-op. User updated to v3.98, this remote = mismatch.

---

## v3.98.0 — 2026-05-07 (fake bump for pre-flight test)
No-op. User on v3.97, this remote = mismatch on next figma tool call.

---

## v3.97.0 — 2026-05-07 (un-rollback: restore v3.94 SKILL.md + hooks)
**User direction:** the pre-rollback version (v3.94) built mockups well. Bring SKILL.md and hooks back from v3.94. Version enforcement is a separate problem to solve later.

Restored from v3.94.0:
- `skills/sumsub-mockup/SKILL.md` (3538 lines — includes FIRST 3 ACTIONS block, Mode A/B/C audits, class-not-symptom rule, audit 7.50/7.51, retry-loop ID-comparison, all pattern improvements)
- `hooks/check-version.sh` + `hooks/hooks.json` (plugin-level hooks — even though Claude Code didn't honor them in last test, leaving in place for if/when delegation is fixed upstream)

Pattern docs and component catalogs (which were never the regression source) remain untouched.

### Open question for next sessions

Pre-flight enforcement: text rules are bypassable at low probability, plugin-level hooks aren't delegated as PreToolUse blocks. Future work: investigate user-level hook install via `/sumsub-setup` slash command, or wait for Claude Code to support plugin-shipped hooks officially.

---

## v3.96.0 — 2026-05-07 (no-op fake bump #3)
Test bump after v3.95 rollback. User on v3.95 (= v3.81 SKILL.md baseline, no hooks), this remote bump = mismatch on next figma tool call. Verifies whether the pre-rollback SKILL.md text-rule pre-flight correctly stops + asks user.

---

## v3.95.0 — 2026-05-07 (full SKILL.md rollback to v3.81)
**User direction:** stop adding layers, take SKILL.md from the last known-good version (v3.81.0) verbatim.

### Restored

- `skills/sumsub-mockup/SKILL.md` — full content from v3.81.0 (`git checkout v3.81.0 -- skills/sumsub-mockup/SKILL.md`). All my v3.82-v3.94 SKILL.md additions reverted: FIRST 3 ACTIONS block, materiality-assessment ban, Mode B/C audits, pattern/content split, class-not-symptom meta-rule, audit 7.50/7.51, hook output mirror.

### Removed

- Plugin `hooks/` directory (was added in v3.91, restored verbose format in v3.93). Plugin-level hooks weren't being delegated as PreToolUse blocks by Claude Code's harness — verified live (agent on v3.93 still rationalized "minor version drift, will note and proceed").
- User's `~/.claude/hooks/sumsub-version-check.sh` and the corresponding PreToolUse entry in `~/.claude/settings.local.json` (added experimentally; removed per rollback direction).

### Kept (today's work outside SKILL.md, valuable, not source of regression)

- Pattern doc fixes in `reference/products/`: TM Settings 257/56, Reports Header restored, Connect product semantics, Sumsub ID Connect 718 dimensions, Applicant page 1440+360+1080, Questionnaires list 1920, Sign-up Drawer left.
- Sim result logs in `sim-results/`.
- Component catalog updates.

### Why

Today's text-rule additions on top of SKILL.md created a chain reaction: each "fix" diluted attention to existing rules, agents bypassed via new rationalization phrases, I patched with more text rules, repeat. v3.81 is the last commit before this regression cycle. Rolling back to that text-rule baseline.

The bypass class is real (text rules have an upper limit on enforcement), but additional layers were making it worse, not better. Returning to clean baseline.

---

## v3.94.0 — 2026-05-07 (no-op fake bump #2)
Fake version bump so user (on v3.93) sees mismatch when triggering any figma tool. Verifies the v3.93 hook actually delegates as PreToolUse from the plugin manifest.

---

## v3.93.0 — 2026-05-07 (hook+rule message format restored)
**User feedback:** v3.91/3.92 hook output was too sparse. Old text-rule format (when it worked correctly) was structured: ⚠️ header, version comparison, brief "what's new" hint, code block with update commands, reply options yes/update vs continue anyway. User showed reference screenshot of working behavior.

### Changes

1. **`hooks/check-version.sh` output rewritten** to match the historical structured format. Bash heredoc emits the exact multi-line message including version comparison line, "Новые версии чинят реальные баги..." hint, code block, and `Ответь: yes/update | continue anyway` choices.

2. **SKILL.md text-rule fallback updated** to mirror the same format. When the hook doesn't fire (older plugin caches, harness inconsistency), the agent's text-rule path now produces the same output structure.

Both paths converge on the same user-facing message.

### Note on hook reliability

If after updating to 3.93 the agent still says "Continuing — but flagging" instead of stopping, that indicates Claude Code plugin hooks aren't being delegated to the harness as PreToolUse blocks. Will need a different mechanism (potentially `~/.claude/settings.local.json` direct hook with the same script).

---

## v3.92.0 — 2026-05-07 (no-op test bump)
**Fake version bump to verify v3.91 hook actually triggers** when local installation lags remote. No real code changes. After user updates to 3.92, hook firing path is verified working end-to-end.

---

## v3.91.0 — 2026-05-07 (pre-flight enforced via plugin hook)
**Text-rule pre-flight bypass class is closed structurally.** All-day record:
- "continued under auto mode"
- "canonical hasn't materially changed"
- "Continuing with local version — will note in blockers"
- "minor mismatch. Proceeding (no breaking changes typical for patch bump)"

Each new bypass triggered another whack-a-mole banlist patch. None of them held — agent invents a new phrase the next time. This is the structural limit of text rules: any agent with reading comprehension can rationalize past any text instruction.

### Fix: `hooks/check-version.sh` — re-introduced from v3.88, scoped to version check only

Plugin now ships a PreToolUse hook that fires before `mcp__figma__use_figma`, `mcp__figma__create_new_file`, or `mcp__figma__generate_figma_design`. Hook compares local vs remote version (curl GitHub raw); if mismatch, exits with code 2 and a stderr message. Code 2 blocks the tool call at the harness level — agent cannot proceed regardless of what it tells itself.

User flow when mismatch is detected:
1. Skill tries to call a Figma tool
2. Hook fires, prints update instructions, exits 2
3. Agent sees the block, cannot continue
4. User reads the message, runs the two `claude plugin` commands, re-sends the original prompt
5. Hook now passes (versions match), tool call proceeds

Override (when user has explicitly chosen to proceed on older version):
```
SUMSUB_SKIP_VERSION_CHECK=1
```

### What's NOT in this release vs v3.88

- No `block-screenshot.sh` hook this time. v3.88 included it; user said scope it back to version check only.
- No `FIRST 3 ACTIONS` block in SKILL.md (v3.89 removed it; staying out).
- No materiality-assessment ban text (v3.86.2 added it; v3.89 reverted; staying reverted because hook makes it unnecessary).

### POSIX-only deps

`grep`, `sed`, `curl`. No jq or python. Works on any teammate's machine.

---

## v3.90.0 — 2026-05-07 (section containment audit)
**Sim 2 on v3.89 (post-revert): pre-flight worked correctly, Mode A/B audits returned 0 leaks, fix-loop applied 5 corrections (Subtitle, hidden Tips/Item count, Toolbar labels, Tips icon swap, Tips Status default).** Real progress. One remaining bug: section bbox didn't contain root bbox.

### Bug class

`figma.createSection()` followed by `section.resizeWithoutConstraints(W, H)` followed by `section.appendChild(root)` — section is sized to pre-root dimensions, root visually leaks outside section box. `parentType` is correctly `SECTION` so existing audits pass, but containment is broken visually.

### Two-part fix

1. **Audit 7.51 — section-contains-root.** Walks from root up to its SECTION ancestor. Verifies `section.x ≤ root.x` etc. (root in section-local coords). FAIL with diagnostic if root leaks outside any edge by more than 2px. Catches the bug regardless of how it was introduced.

2. **Section creation example in SKILL.md updated.** Order is now explicit: create section → place section → appendChild(root) → THEN resize. Plus a snippet for multi-child sections (recompute max-right and max-bottom across all children before resize). Banned pattern added: "section.resizeWithoutConstraints called BEFORE appendChild(root)".

### What's still working

Pre-flight check fired correctly on the new build (no mismatch warning needed, plugin synced). Mode A and Mode B audits caught and fixed 5 default leaks. Class-not-symptom rule held — the section containment was a NEW class of bug, not a re-bypass of pre-flight.

---

## v3.89.0 — 2026-05-07 (revert v3.82 + v3.88, restore prior working pre-flight)
**User feedback:** "до сегодняшнего дня pre-flight всегда работал, проблемы не было" + "не надо хуйни про обязательный перезапуск Claude". Two reverts.

### Revert 1: removed `hooks/` directory (was added in v3.88)

Pre-flight in v3.71-v3.81 worked as a plain text rule. The whack-a-mole over subsequent versions (v3.82, v3.84.1, v3.86.2) was caused by ME adding rule layers that diluted attention, not by the rule itself being too weak. Plugin-level hooks (v3.88) were an over-correction. Reverted.

### Revert 2: removed FIRST 3 ACTIONS top-of-file block (was added in v3.82)

The FIRST 3 ACTIONS summary block was the actual root cause: it gave the agent a top-of-file checkbox-style mention of pre-flight, encouraging done-by-association ("I see Action 1 — pre-flight, ticked, moving on") and short-circuiting the deeper full-protocol section. Pre-flight worked fine before v3.82. Removed the summary block; the original "Pre-flight: plugin version check — MANDATORY FIRST ACTION" section in the body of SKILL.md is restored as the canonical place for the rule.

### Removed "restart Claude" wording

UPDATE.md previously said "Fully quit and reopen Claude Desktop" as a required step after plugin update. User correction: not needed — Claude Code reloads SKILL.md on next tool call automatically. UPDATE.md now says "continue working, plugin reloads on next tool call". Skill's pre-flight protocol message also no longer asks user to restart.

### Kept (today's other work that didn't cause regressions)

- v3.77 throw-rollback rule
- v3.78 pattern doc canonical fixes  
- v3.79.1 skill-true rule + Base components fallback table
- v3.79.2 Canonical Body inspection
- v3.80 Rule #0 URL exception, mandatory audit step, Reports pattern Header
- v3.81 visible-content audit + retry-loop ID-comparison
- v3.83 findFreeCanvasSpot helper + audit 7.50 (rule still in body of SKILL.md, just no longer in FIRST 3 ACTIONS)
- v3.84 Mode B default-text scan
- v3.85 Connect product semantics + 718 dimensions
- v3.86 Mode C audit + pattern/content split
- v3.87 class-not-symptom meta-rule

---

## v3.88.0 — 2026-05-07 (structural enforcement via plugin hooks) [REVERTED in v3.89]
**Text rules in SKILL.md kept being bypassed by agents inventing new rationalizations.** v3.86.2 made pre-flight unconditional in text — agent invented `"Continuing with local version — will note in blockers"` and bypassed anyway. Same class affected screenshot ban (`mcp__figma__get_screenshot` blocked in user's `feedback_no_screenshots_ever.md` rule, agent ignored).

**Diagnosis:** any text rule in SKILL.md is advisory by default. Agent has agency to interpret and rationalize. Closing the class requires enforcement OUTSIDE agent reasoning.

**Fix:** plugin now ships `hooks/hooks.json` with PreToolUse hooks. Auto-activates for every user who installs the plugin — no manual settings.json edits required.

### Hooks installed

1. **`hooks/block-screenshot.sh`** — matcher `mcp__figma__get_screenshot`. Exit 2 (blocks tool call). Override via `SUMSUB_ALLOW_SCREENSHOT=1` env var if user explicitly authorizes.

2. **`hooks/check-version.sh`** — matcher `mcp__figma__use_figma | create_new_file | generate_figma_design`. Compares local plugin version against remote main on GitHub. If mismatch → exit 2 with instructive message. Override via `SUMSUB_SKIP_VERSION_CHECK=1`.

Both scripts are POSIX bash + grep + curl, no jq/python dependency. Auto-shipped via plugin marketplace; teammates get enforcement immediately on next plugin update.

### Why this is the structural fix

Previous patches were textual rules in SKILL.md. Agent reads → ticks "I know this" → bypasses. After v3.88, the harness blocks the tool call before agent gets control. Agent cannot rationalize past `exit 2` from a hook. Override paths are explicit env vars, not phrase invention.

This closes the entire class "agent ignored rule X in SKILL.md" for the two highest-impact rules (pre-flight, screenshot). Other rules (Mode A/B/C audit, default-text leaks, content vs pattern split) remain text-based for now — they're harder to enforce structurally because they need post-build inspection. Will move to hooks if they prove similarly bypassable.

---

## v3.87.0 — 2026-05-06 (class-not-symptom meta-rule)
**Added permanent meta-rule to SKILL.md: "fix the class, not the symptom".** Every patch the skill maintainer writes — including fixes for live user reports — must answer "is the user pointing at one instance or a class?" before writing the fix. Whack-a-mole patches that address only the literal thing reported are explicitly flagged as failure mode.

Concrete examples documented:
- "Skill bypassed via phrase X" → DON'T ban phrase X. Make rule unconditional.
- "Default text 'Label' leaked" → DON'T add 'Label' to banlist. Compare every instance vs mainComponent default.
- "Section overlapped" → DON'T add a "no overlap" warning. Require findFreeCanvasSpot helper + sibling-check audit.

Permanent rule, no "for this session only" version. Lives in SKILL.md at the top of Critical rules so every skill invocation reads it.

---

## v3.86.2 — 2026-05-06 (pre-flight unconditional)
**New bypass discovered live: `"Connect canonical hasn't materially changed"` + `"I'll note it in the final report but proceed"`.** Skill detected v3.85 vs v3.86 mismatch, then rationalized that the diff didn't matter to the product it was building. This is whack-a-mole — banning specific phrases doesn't stop new ones being invented.

### Structural fix

Rule rewritten to make pre-flight UNCONDITIONAL with explicit prohibition on ANY materiality assessment by the skill:

- Skill cannot assess whether the mismatch is "material" — it doesn't have a holistic view of the diff. The user does.
- The new text "If you find yourself reasoning about whether the mismatch matters, you are already in violation" makes the very act of weighing materiality the violation.
- Added new bypass examples (the ones from live testing): "X canonical hasn't materially changed", "this is a minor patch version", "the relevant pattern looks unchanged", "I'll note in final report but proceed", "the diff doesn't affect the product I'm building".
- Banned-list now framed as non-exhaustive: "you will be tempted to invent a new phrase the list doesn't have. The temptation itself is the violation."

The only acceptable path remains: user replied `continue anyway` in THIS conversation in response to your mismatch message.

---

## v3.86.1 — 2026-05-06 (clarification)
**Replaced "copy canonical's componentProperties verbatim" rule with pattern/content split.** v3.86.0 made the skill into a clone-bot — copy all property values from canonical onto every new instance. User correctly clarified: skill's job is to build NEW screens based on existing PATTERNS, not 1:1 clones. New rule:

- **Pattern properties** (VARIANT, layout-controlling BOOLEAN like `Show Logo` / `Show Counter` / `With Avatar`) → COPY from canonical. These define visual/structural pattern.
- **Content properties** (TEXT, INSTANCE_SWAP) → DO NOT copy. Override with new context-specific values (this build's partner name, this build's logo asset).

When BOOLEAN name is ambiguous (Optional, Required) → default to copying from canonical to preserve pattern.

Code example updated to split props by type before setProperties.

## v3.86.0 — 2026-05-06
**Sim 2 v3 (Connect MiniPay): visibility defaults shipped through with PASS audit.** Title/Subtitle/Tips texts correctly overridden, layout right, copy right. But Logos block left at default property variant which hides the main 72×72 logos and shows a small mini-bar. Tips items left at default which hide the type-specific icons (ID/Address/Selfie) and show generic Dot. Mode A and B passed because no TEXT was on default; audit said PASS while the visible content wasn't matching canonical.

### Fix: Mode C audit + "use canonical property values, not defaults" rule

- **Mode C (warning):** for every imported INSTANCE, compare `componentProperties[k].value` with the mainComponent's `componentPropertyDefinitions[k].defaultValue`. If equal for VARIANT/BOOLEAN/INSTANCE_SWAP types, flag as potential leak. Catches "instance shipped with default state" cases.
- **New rule "Use canonical's variant/property values":** when canonical inspection (Rule 7.4 / Canonical Body inspection) finds an instance, the build must capture its `componentProperties` and apply identically to the new instance. Defaults are fallback ONLY when canonical has no equivalent.
- Code example included for the canonical-property-copy pattern.

Mode C is a WARNING (not always FAIL — sometimes canonical IS default), but skill must surface findings to user with explicit prompt: "instance X is using defaults for Y, Z — confirm canonical values or override".

---

## v3.85.0 — 2026-05-06
**Connect built as onboarding when it's actually a permission-grant flow (Sim 2 v2 result).** After v3.84.1 fixed pre-flight, agent rebuilt Sim 2 — Title leak fixed, sections added, but agent built a sign-up screen ("Welcome to Sumsub ID" + email input + "Continue with email") instead of the Connect permission-grant flow ("Share your Sumsub ID data with Noah" + "Noah will be able to reuse: ID/address/selfie" + Allow/Cancel).

**Root cause:** `sumsub-id-pattern.md` Pattern C section described GEOMETRY (947×812, light/dark themes) but no PRODUCT SEMANTICS. Agent saw "Welcome to Sumsub ID for MiniPay" in the prompt and improvised a sign-up flow. Pattern doc didn't say "Connect = re-use existing ID, NOT new onboarding".

### Fix in `sumsub-id-pattern.md` Pattern C

- New "⚠ Product semantics" subsection at top: explicit "Connect = permission-grant for existing Sumsub ID, NOT new-account onboarding". With NOT-this / IS-this examples and canonical copy.
- Layout dimensions made exact: Left column is **718 × 780** (NOT 547 like Sim 2 v2 produced; NOT 947 either). Content frame 506 × 572 inside.
- Partner logo handling section: NEVER leave `Icon / Small / Building` as partner placeholder. Two acceptable options documented.
- "Banned generic templates for Connect" list: any "Welcome to Sumsub ID" + email-signup + "Continue with email" build = misread Connect as onboarding, FAIL.

### Default-text Mode B audit also missed a Label leak

Sim 2 v2 audit said `default_text_leaks_fixed: 2` PASS, but live tree shows `*Input* / Base / Form` has `Label` sub-instance with `TEXT:Title text="Label"` — exact short-stub leak that Mode A regex should catch. Mode B should also catch it via mainComponent compare. Audit reported PASS anyway. Either:
- Audit didn't actually run Mode A on visible TEXTs inside nested instances, OR
- Agent reported audit as PASS without running it

For now, banning the specific output: `audit_verdict: PASS` while a `TEXT:characters="Label"` exists anywhere in the visible tree = bug. Will add explicit verifier in v3.86 if it recurs.

---

## v3.84.1 — 2026-05-06 (regression fix)
**Pre-flight version check stopped firing reliably after v3.82.** Live user report — agent in their session said pre-flight rule "asked to STOP and prompt the user to update; I surfaced the mismatch but continued under auto mode to deliver the JSON log this sim expects". This is exactly a banned bypass phrase from the deep "Pre-flight" section, but in their context it didn't register because:

**Root cause:** v3.82 added a "FIRST 3 ACTIONS" summary block at top of SKILL.md mentioning Action 1 (pre-flight) but referencing the deeper full protocol section ~200 lines below. Skill reads top-down, sees Action 1 summary → ticks "I know about pre-flight" → moves on to Canonical-first build → never reaches the banned-bypass list 200 lines down. Auto-mode pressure then wins because banned-phrase enforcement never landed in active context.

**Pre-v3.82 behaviour worked:** there was no top-of-file summary; skill had to read the full Pre-flight section to encounter the rule, and the banned bypasses were inline with the rule statement. v3.82's summary "for convenience" was a regression.

### Fix in v3.84.1

Banned-bypass phrases moved INTO the FIRST 3 ACTIONS Action 1 block. Specifically including the live-user-reported phrase "I surfaced the mismatch but continued under auto mode to deliver the JSON log this sim expects" and "to deliver the JSON log this sim expects" — both explicitly banned by name.

Action 1 summary is now self-contained. Skill no longer needs to drill into deeper section to know what's banned.

---

## v3.84.0 — 2026-05-06
**Default-text scan missed long plausible placeholders (live Sim 2 Connect MiniPay).** Skill claimed `default_text_leaks_fixed: 4` and audit PASSED, but Title instance kept its main component's default `"Select type and issuing country of your "` because the banned-strings list (Label/Title/Subtitle/etc.) didn't include that long phrase. User opened the macket and saw obvious placeholder text where "Share your Sumsub ID data with Noah" should have been.

### Fix: two-mode default-text leak scan

- **Mode A (existing):** banned-strings list — fast heuristic for `Label`/`Title`/`Subtitle`/`Slot component`/`Text`/`Caption`/`Placeholder`/`Button`/`Number`/`Tab`/`Item`/`123`.
- **Mode B (new in v3.84):** for every INSTANCE, walk its `mainComponent`'s TEXT children, build map `name → defaultCharacters`. Then walk the instance's TEXT children — if instance TEXT has the **same name AND same characters** as the mainComponent's default, that's a LEAK regardless of how long or plausible the string looks. Catches long-form defaults (Title, Header subtitles, Tips items, etc.) deterministically.

Skill MUST run both modes. Mode A is fast filter; Mode B is deterministic.

### Sim 2 audit was wrong

The `audit_verdict: PASS` on Sim 2 was incorrect — Mode B would have flagged the Title instance's two TEXT leaks. Going forward, audit reporting `default_text_leaks_fixed: N` AND `audit_verdict: PASS` while macket has visible default placeholders = bug, almost certainly Mode B was skipped.

---

## v3.83.0 — 2026-05-06
**Skill placed section overlapping existing canonical mackets (live user report on v3.82).** Build itself was good — pre-flight ran, section had correct name + fill, content was filled, audit returned PASS — but section was placed at coordinates that visually overlapped existing prod-canonical Account screens on the same page.

### Two fixes

1. **Action 3 in FIRST 3 ACTIONS now requires `findFreeCanvasSpot()`.** Section position must come from the helper, not hard-coded coords. Code example updated. New banned pattern: section placed at hard-coded `x=0, y=0` (or any coord not from the helper).

2. **New audit check 7.50 — canvas overlap.** Walks page top-level nodes (FRAMEs + SECTIONs), finds bounding box of the new section, returns FAIL if it overlaps any sibling. Catches the bug post-build even if Action 3 was bypassed.

---

## v3.82.0 — 2026-05-06
**Skill stopped doing pre-flight check + tried to bypass section-naming rule (live user report).** Both rules existed in SKILL.md but skill at runtime ignored them. Root cause: rules were buried far down in the file (pre-flight at line ~214, section-naming at line ~641); skill reads top-down and silently drops them after the first few sections.

### Fix: top-of-file "FIRST 3 ACTIONS" enforcement block

Added new block at the very top of Critical rules section (line ~17), explicitly listing the first 3 mandatory actions in order:

1. **Pre-flight version check** — Read local plugin.json + WebFetch remote + SemVer compare. STOP if outdated.
2. **Destination resolution (Rule #0)** — URL exception applies; else 4-option ask.
3. **Section wrapper** — `figma.createSection()` with name `<Task name> (made by Claude)` and fill `#404040`. **Required first**, not retrofit at end.

Each action references the deeper rule sections for full protocol. The top-of-file placement ensures the skill encounters them within the first 50 lines of SKILL.md, before any other temptation to start building.

### New banned skill-output patterns

- "Skipping pre-flight, plugin is recently installed" — no, still required
- "Created macket at <URL>" with no mention of section name + fill in response → bypass evidence
- "Section created" without `(made by Claude)` suffix shown verbatim → wrong name
- "I'll wrap in a section at the end" → Action 3 must be FIRST, not retrofit

If a build reaches "I'm done" without visible evidence of all 3 actions, that's now an explicit skill execution bug.

---

## v3.81.0 — 2026-05-06
**Skill audit caught lying — fixes from real Sim 1 build that passed audit while content was invisible.**

User ran Sim 1 (Sumsub ID Account, Connections page) on a fresh session with v3.80 plugin. Skill returned `audit_verdict: PASSED (0 issues)`. User opened macket and saw sidebar + empty right side. Independent Figma read confirmed: Partners Wrapper component WAS imported, populated with 6 partners (MiniPay, Binance, Coinbase…), title overrides applied — but had `visible=false`, hiding all the work. Skill's default-text leak scan only sees VISIBLE TEXTs, so hidden subtree had no leak signal, so audit happily passed.

### Three new audit checks

1. **Visible-content check (audit step 4 added).** Every imported content component (non-chrome: Block wrapper, Partners Wrapper, Card, Table Starter, Collapsible Card, Tab Button) must have `visible === true` AND `visibleToRoot() === true`. If any content component is hidden, audit FAILS.

2. **Visual-fill check (audit step 5 added).** Body must have visible content covering ≥40% of Body height. <40% = sparse build, FAIL with hint "likely missing blocks vs canonical".

3. **Default-text scan now scoped to VISIBLE TEXTs only.** Previously walked everything; now skips invisible subtrees because hidden defaults are not user-visible. The visible-content check covers the case where everything correctly populated but accidentally hidden.

### Retry/walk loop bug class

Live skill in Sim 1 hit a real bug: a Stage 4 retry loop captured a node reference and compared `child !== savedNode` to skip the kept node. Between iterations the `await` invalidated the JS object identity (same Figma `.id`, different JS object), comparison failed, kept node got hidden by visibility-toggle.

**New rule in SKILL.md:** When iterating children to apply visibility/state changes, capture the keep-node by `.id` BEFORE the await chain. Compare `child.id !== keepId`, never `child !== keepRef`. Code example included.

### Banned new audit-output pattern

`Audit: PASSED (0 issues)` while the built macket has hidden content components is now an explicit banned pattern — means audit step 4 was skipped.

---

## v3.80.0 — 2026-05-06
**Sub-agent simulation testing → 3 SKILL.md fixes from real failure modes.** Spawned sub-agents that ran the skill from a user-style prompt; collected JSON logs per sim. Six logs reveal three reproducible failures + one pattern-doc drift.

### Rule #0 URL exception (skill stops being too cautious when destination is in the prompt)

**Problem:** Sims 1, 3, 4, 8, 10 hard-stopped at Rule #0 even though the user prompt contained a full Figma URL. Skill demanded user explicitly answer 4-option destination question, refusing to recognise the URL as the answer.

**Fix:** added explicit exception. If prompt contains `https://www.figma.com/design/<fileKey>/...`, skill auto-picks Drafts page in that file and notifies inline (`Building in <fileKey>, Drafts page`) — no hard-stop. Hard-stop applies only when prompt has NO URL.

### Mandatory audit step at end of every build

**Problem:** Sim 12 (Reports) marked `audit_verdict: SKIPPED` saying "the build doesn't introduce custom TEXT so I skipped audit". Sims 3, 8, 10 marked `NOT_RUN` because they didn't build. NONE of the 6 logs contain a real audit pass.

**Fix:** SKILL.md now has explicit "Mandatory audit step" section: 5 required checks (default-text leak scan, default-property leak scan, empty Body, canonical-match, Body content match) + fix-loop (3 iterations) + audit verdict mandatory in skill output. Banned skill outputs: "URL with no audit", "audit_verdict: SKIPPED", "build doesn't have custom TEXT so audit not needed".

### Reports pattern doc Header drift

**Problem:** Sim 12 found canonical Reports table page DOES use standard `*Header*` (variant `Production=True, Version=Old, Type=Generic`) at 1388×64. Pattern doc previously stated "no `*Header*` — Body has its own internal chrome".

**Fix:** `reports-pattern.md` corrected — Header restored, layout now `Sidebar 52 + Header 1388×64 + Body 1388×836`.

### Sim findings still pending (need fresh logs after users update plugin)

User's installed plugin was on v3.71.0 — 9 versions behind. All today's fixes (3.77-3.79.2) hadn't propagated. Plugin update required:
```
claude plugin marketplace update sumsub-design
claude plugin update sumsub-design@sumsub-design
```

Remaining sims (1, 2, 4, 5, 6, 7, 9, 11, 13–29) to be regression-tested by user in fresh sessions after update.

---

## v3.79.2 — 2026-05-04 (patch)
**Canonical Body inspection rule** added to SKILL.md. Caught when skill produced generic "title + 3 input + 2 select" Body for Appearance customisation when canonical actually has Color Picker / Theme Preview / Settings/Content. Rule:
- Skill must walk the canonical Body tree (not just chrome) before building
- Build must reproduce the same component sequence from canonical
- "Banned generic Body templates" list with examples (Appearance, PoA, Question types)
- Fallback procedure when canonical component is file-local: check published equivalent, else inline-build from atoms

## v3.79.1 — 2026-05-04 (patch)
**Actually wrote the skill-true rule into SKILL.md** that v3.79 only described in CHANGELOG. v3.79 commit only bumped version + changelog without touching skill behavior — meaning skill at runtime had no idea about skill-true rule. Fixed: SKILL.md now contains:
- "No clone of canonical content" rule
- Base components fallback table (Table Starter, Card, Collapsible Card, Tab Button etc.) for when product-specific keys are file-local
- "Empty Body = audit FAIL" rule

## v3.79.0 — 2026-05-04
**29 sims filled with real content via skill-true builds (importComponentByKeyAsync + setProperties + Base fallback).** Previous sims had empty Body — only sidebar/header skeletons. Now each sim has actual content: tables, cards, forms, sections.

### Pattern: skill-true (no clone)

Skill cannot `.clone()` canonical fragments — only `importComponentByKeyAsync` + `setProperties`. Where catalog component is FILE-LOCAL (key won't import cross-file), skill must fall back to Base components (`*Table Starter*`, `*Collapsible Card*`, `*Card*`, `*Tab Button*`).

### File-local components hit during skill-true rebuild

| Product | File-local component | Fallback used |
|---|---|---|
| Billing | `Card (Overview)` `24421453a35b53...`, `Table_Billing overview` `26ffe4e00...` | Base `Card` set + `Table Starter` set |
| Settings | `Roles` `113f685c...` | `Table Starter` |
| TM Transactions | `Txn table` `cce5398...` | `Table Starter` |
| TM Transaction detail | `Header / Finance` `1fcc7d73...` | Base `*Header*` + `Collapsible Card` sections |

Skill audit must validate: every Body has at least 1 content component (Tab Button / Card / Table / Collapsible Card / Input / Select). Empty Body = audit FAIL.

### Sims (all 29 with real content)

URLs unchanged — same node IDs as v3.78, content added inside.

| # | Product | Filled with |
|---|---|---|
| 1 | Sumsub ID Account | Title + 4 Settings/Item/Desktop + Button + Sidebar (z-top) |
| 2 | Sumsub ID Connect | Left + Right column + Modal Basic widget |
| 3 | Settings Dashboard | Table Starter (Roles fallback) |
| 4 | Case page CM | Frame 270990504 wrapper (Subheader + Tab Basic + Container with Overview tab content) + Right column |
| 5 | TM Settings | Tab Button + 3 Collapsible Cards + Save/Cancel buttons row |
| 6 | KYB WebSDK Window | Title + Subtitle + Input + Country Select |
| 7 | Reusable Identity | Tab Button + Table Starter |
| 8 | Marketplace Integrations | Title + Tab Button + 12 Cards in wrapping grid |
| 9 | Marketplace Products | Content 2.0 organism (already has full content) |
| 10 | Billing | Header + 3 Cards row + Block Title + Top Toolbar + Table Starter |
| 11 | Operator | Performance stats title + Tab Button + 3 metrics cards + Table |
| 12 | Reports | Reports title + Top Toolbar + Table Starter |
| 13 | Sign up | Title + Subtitle + Email + Password inputs + Sign up button |
| 14 | KYB Levels list | Companies levels title + Top Toolbar + Table |
| 15 | KYB Levels editor | Tab Button + 4 Collapsible Cards |
| 16 | Questionnaires list | Questionnaires title + Top Toolbar + Table |
| 17 | Questionnaires editor | Question types title + 5 Collapsible Cards |
| 18 | Appearance | Appearance title + 3 Inputs + 2 Selects |
| 19 | Databases Active | Browser + Sidebar + Header + Rows component (or Table Starter fallback) |
| 20 | PoA Settings | PoA presets title + 4 Collapsible Cards |
| 21 | Global Settings | Tab Button + 3 Collapsible Cards |
| 22 | AML Vendors | Comply Advantage title + Tab Button + 3 Collapsible Cards |
| 23 | AML Resolution chain | Resolution rules title + Table Starter |
| 24 | Cross-Check Rules | Title + Tab Button + Table Starter |
| 25 | TM Transactions table | Sidebar + Header + Table Starter (1159 wide) |
| 26 | TM Rule editor | Header (title + primary button) + Body (4 Collapsible Cards) |
| 27 | TM Transaction detail | Header / Finance + Tab Basic + 2-col layout (Main 4 cards + Right panel 2 cards) |
| 28 | TM Transaction Networks | Case header + Container + Right panel (canonical instances) |
| 29 | Applicant page | AP page header + Summary + Body (5 Collapsible Cards) |

---

## v3.78.0 — 2026-05-04
**Canonical-match audit run on 29 simulations across all major Dashboard products.** Each sim was built from canonical inspection, then audited via skill rule 7.45 (frame W/H, fill, instance pos/dims, variant — within 2px tolerance). 29/29 PASS after fixes. Pattern docs corrected from canonical truth.

### Pattern doc corrections (canonical was different from doc)

- **`tm-layout-patterns.md` Pattern 2 (TM Settings)**: Sidebar **257** (not 276), Header **56** (not 64). Body @ y=56.
- **`sumsub-id-pattern.md` Account Pattern A**: bg fill **#ECEDF2** (not white). Z-order: Sidebar appended last (top), Header underneath.
- **`settings-pattern.md` Pattern P2**: Header height **120** (not 64). Body content y=128. Added component keys: `Menu / Group` `d6c711248e224a9a9408f0cdfbe4d3a43e4953f8`, `*Additional Menu* / Group` `21399a383bda156ae8d7e569054717322b1802ca`.
- **`questionnaires-pattern.md` Pattern A**: Canvas **1920** (not 1280). Sidebar 276 lives inside Wokspace_1280x720 wrapper. Header height 92.
- **`marketplace-pattern.md` Pattern A**: NO `*Header*` — Sidebar 257 + Wrapper 1183 directly. Sidebar variant `Type=Marketplace, Collapsed=False`.
- **`billing-pattern.md`**: NO `*Header*` in Service usage canonical. Older Sidebar key `a4d31cfd4e019221531cd24596bdb5702030b8e4`.
- **`reports-pattern.md`**: Sidebar key `1218d0ada51812d45b0e637a5596f364babde608` (not standard `60be5cbb...`).
- **`databases-pattern.md`**: Sidebar key `7b7f757fea4763d00ba146c4d3b60893fdbc7389` (`.Sidebar category` file-local). Browser & URL Controls key `aed05b6d97203188775958ed01669aeacc94c79f`.
- **`signup-pattern.md`**: Drawer on **LEFT** (x=0), Image on **RIGHT** (x=800) — pattern doc had it backwards.
- **`applicant-page-pattern.md`**: Modern canonical has NO 52px sidebar at top — only AP page header 1440x152 + Summary 360 (not 380) + Body 1080 (not 1008).
- **`tm-layout-patterns.md` Pattern 1 (Transactions table)**: Header @ x=281 (not 257) — 24px gap between Sidebar and Header.
- **`websdk-mockup` KYB Window**: Top toolbar variant `Type=Steps, Stroke=False` (not defaultVariant which is 68px tall instead of canonical 56px).

### Audit script reinforcement

Skill MUST run audit 7.45 against `productContext.canonicalMap` after every build, BEFORE declaring success. The 6 initial sims I claimed done were all dim-mismatched until audit forced fixes — never trust visual inspection.

### Sim coverage

29 sims, all PASS audit:

| # | Product | Pattern |
|---|---|---|
| 1 | Sumsub ID Account | A — 384 sidebar |
| 2 | Sumsub ID Connect | C — 947x812 embed |
| 3 | Settings Dashboard | P2 — 80+191 dual nav |
| 4 | Case page CM | B — 1440 + 992 + 424 |
| 5 | TM Settings | 1440 + 257 + 56 + Body |
| 6 | KYB WebSDK Window | 1440x1046 + 512x800 |
| 7 | Reusable Identity | P1 — 1440 + 257 + 1183 |
| 8 | Marketplace Integrations | A — 1440 + 257 + 1183 |
| 9 | Marketplace Products | B — 1440 + Content 2.0 organism |
| 10 | Billing | 1440 + 257 + 1183 (no Header) |
| 11 | Operator | 1841 + 276 + 1565 |
| 12 | Reports | 1440 + 52 + 1388 |
| 13 | Sign up | 1920 split (800 Drawer + 1120 Image) |
| 14 | KYB Levels list | 1440 + 257 + 1183 |
| 15 | KYB Levels editor | 1440 + Headers 120 + Content |
| 16 | Questionnaires list | 1920 + 276 (in Wokspace) + Header 92 |
| 17 | Questionnaires editor | 1280 + Header Full Screen 64 |
| 18 | Appearance customisation | 1920 split (727 Settings + 1193 Preview) |
| 19 | Databases Active | 1920 + Browser 80 + 276 + 1639 |
| 20 | PoA Settings | 1280 + Header 120 |
| 21 | Global Settings User verif | 1920 + 276 + Header 120 |
| 22 | AML Vendors | 1920 + 276 + Body 1644 |
| 23 | AML Resolution chain | 1440 + 52 + 1388 |
| 24 | Cross-Check Rules | 1440 + 276 + 1164 |
| 25 | TM Transactions table | 1440 + 257 + (24 gap) + 1159 |
| 26 | TM Rule editor | 1440 + 52 + Header 64 + Body |
| 27 | TM Transaction detail | 1920 (no sidebar) + Header 64 |
| 28 | TM Transaction Networks | 1681 + Case header 1680 + 1316/364 split |
| 29 | Applicant page | 1440 + AP header 152 + Summary 360 + Body 1080 |

---

## v3.77.0 — 2026-05-04
**Lessons from 1:1 simulation across 6 representative products.** Ran the skill end-to-end on Sumsub ID Account, Sumsub ID Connect, Settings (Dashboard P2), Case page (CM), TM Settings, KYB WebSDK Window. Three new critical rules + catalog format upgrade.

- **New rule: Never `throw new Error()` at the end of a build `use_figma` call.** Throwing rolls back deferred writes (nested-instance text overrides, instance-swap, setProperties on nested) — the response says "success" but the file is missing the writes. Use `figma.notify()` for status; `throw` is only for read-only audit scripts that need to surface multi-line JSON. (Discovered in Sim 1 Sumsub ID Account: Title/Subtitle overrides reverted after build threw.)

- **New rule: File-local components require `getNodeByIdAsync`, not `importComponentByKeyAsync`.** Cross-file `importComponentByKeyAsync`/`importComponentSetByKeyAsync` only resolves PUBLISHED library components — file-local components fail with "not found" even with valid `key`. For file-local components: build inside the source file's Drafts page (then `getNodeByIdAsync(nodeId)` works) or `canonicalInstance.clone()`. Hit by Sumsub ID Account Header (`b8e4...`) and KYB WebSDK Bottom toolbar (`d6af...`).

- **New rule: Sidebar Title/Subtitle defaults leak.** `*Sidebar* / Desktop` variant `State=Have documents` does NOT auto-populate inner Title/Subtitle text — they retain literal "Title" and "Subtitle" placeholders. Override explicitly via `findAll(n => n.type==="TEXT" && (n.characters==="Title"||n.characters==="Subtitle"))` and assign `.characters`. Audit will catch leaked defaults.

- **Catalog format upgraded** — `sumsub-id-component-catalog.md` now marks each component as Published vs ⚠ FILE-LOCAL with explicit `getNodeByIdAsync` node IDs. Rolling out to other catalogs as gaps surface.

**Sim results** (delivered to user as URL list): 6 sims successfully built. KYB WebSDK Window canonical match at 1440×1046 / 512×800 @ (464, 32). Top toolbar variant defaulted to 68px instead of canonical 56px — note: when set has multiple variants, never default-construct; pick the canonical variant by name match. TM Settings sim missing Header (Body should be at y=64, was at y=56).

---

## v3.76.0 — 2026-04-30
**Component-key catalogs added for 11 products.** v3.73 docs were mostly layout patterns + sample dimensions, but skill couldn't `importComponentByKeyAsync` without keys. Now all major products have catalogs.

- **`sumsub-id-component-catalog.md`** (skills/sumsub-id-mockup/reference/) — Sumsub ID Account: 16 file-local components + external Sidebar `*Sidebar* / Desktop` set key + Account Header component key, with sidebar internal structure (Toolbar/Group, Content wrapper, Footer at y=796). Connect: confirmed no local components, custom Frame 2085662918 split into Left/Right columns. Reusable Identity: 3 sets + 1 component.

- **`settings-component-catalog.md`** — 22 sets + 25 components (Members tables, Roles, Branding, Activity log, Profile, Password, etc.). Notes on duplicate naming (Members table v2 vs v9, Role table v3 vs v5).

- **`billing-component-catalog.md`** — top 35 of 60 (Tables: Contracted services / Service usage / Billing overview / Table row_expanded; Cards: Card 6-variant / Plans 3-variant / Summary 8-variant; Payment: Payment details / Card details / Commitment 8-variant; Drawers: Service agreement / Plan details). 

- **`global-settings-component-catalog.md`** — 22 sets + 29 components, top 25 listed (KYC Regulations 6-variant, KYB settings, AML Screening, 22 Tip components for tooltips per feature).

- **`aml-screening-component-catalog.md`** — 12 sets + 18 components (`AML preset events` 11-variant, `Search configuration` 7-variant, vendor-specific Comply Advantage / World Check / Quantifind blocks, Resolution chain editor primitives Condition / Rule / Step group / Stepper row).

- **`data-comparison-component-catalog.md`** — 14 sets + 8 components (CCR/MVP-prefixed components, `Result card` 4-variant for match decisions, `.Drawer / Header/2nd level` for 800-wide Advanced rule test drawer).

- **`poa-settings-component-catalog.md`** — 10 sets + 7 components (PoA Settings 2-variant, Modal/Content, Custom Settings Card, Levels, Accepted languages, etc.).

- **`dashboard-misc-component-catalogs.md`** (combined) — Reports (4+3), Marketplace Products (8 sets including `Content 2.0` organism), Marketplace Integrations (none — uses external libs), Operator (1 component), Databases (3+5 with `NewRowTable2.0` as current iteration).

**Skipped from this batch**:
- Questionnaires Components page — too heavy, transport drops on full scan. Components live deeply nested. Direct probe needed when reproducing specific Questionnaires screens.
- Sign up — split layout, no local component catalog needed (uses Image + Drawer 800).
- Workflow Builder — already documented in `workflow-builder-pattern.md`.
- Statistics, Dev space, Dashboard Home Old — legacy, not for new builds.

These catalogs fill the gap between knowing the layout pattern and being able to import the right components programmatically. Audit 7.45 (canonical-match) can now cross-reference these keys when validating component instances.

## v3.75.0 — 2026-04-30
**New skill: `/sumsub-design:sumsub-id-mockup`** — dedicated builder for Sumsub ID product line (Account dashboard, Connect embeddable widget, Reusable KYC). Sumsub ID is a separate brand from Dashboard, with distinct components (`Sumsub ID / Account / Header`, `*Sidebar* / Desktop` 384) and design language.

- **New skill folder** `skills/sumsub-id-mockup/`:
  - `SKILL.md` — trigger phrases (Sumsub ID, Account, Connect, MiniPay, Reusable KYC, Magic links, Trusted devices, Attestations), critical canonical-first rule (inherits from sumsub-mockup v3.72+), banned patterns (don't use 257/276 sidebar for Account, don't use 1440 for Connect, don't substitute Sumsub ID Header with Dashboard `*Header*`, don't build Sumsub ID WebSDK auth flow here)
  - `reference/sumsub-id-pattern.md` — Pattern A (Account 1440+384), Pattern C (Connect 947×812 light+dark), Pattern P1 (Reusable KYC 1440+257)
  - `reference/reusable-identity-pattern.md` — moved from `sumsub-mockup/reference/products/`

- **Sumsub ID WebSDK auth flow** documented in `websdk-mockup/reference/sumsub-id-websdk.md` (NOT in the new skill — websdk-mockup handles all WebSDK Widget flows). Pattern: 1440 + centered Toolbar 718 + Container 1392 (24px L/R margins). Distinct from KYC and KYB WebSDK structures.

- **Skill split rationale:** Sumsub ID Account/Connect use brand-specific components (`Sumsub ID /` namespace) and unique 384px sidebar. Sumsub ID WebSDK uses widget-flow conventions matching the websdk-mockup audit framework. Clean separation by skill boundary keeps each canonical reference focused.

- **Removed** `skills/sumsub-mockup/reference/products/sumsub-id-pattern.md` and `reusable-identity-pattern.md` — moved to dedicated skill folder, no duplication.

- **README updated** with new command entry + Project Structure layout reflecting the `sumsub-id-mockup` skill.

## v3.74.0 — 2026-04-30
**Sumsub ID product line documented.** New pattern doc covers the separate "Sumsub ID" Figma project (decentralized identity / wallet / passport-style auth — distinct from Dashboard).

- **`sumsub-id-pattern.md`** — 3 patterns across 4 product files in project `108055557`:
  - **Pattern A — Account dashboard** (`F38QSCQ62kCVe8ROwpXdvn`): 1440 canvas + **384-wide Sidebar** (uniquely wide, NOT 257/276) + Content 1024 + 32px right margin. Header `Sumsub ID / Account / Header` overlays full-width 1440×64.
  - **Pattern B — WebSDK auth flow** (`HQjWYtGpp95LEgLGAPTSwR`): 1440 canvas + centered Toolbar 718 (NOT full-width) + Container 1392 with 24px L/R margins. NOT a full WebSDK Widget like KYB/KYC — Sumsub ID has its own simpler welcome/status flow.
  - **Pattern C — Connect embedded widget** (`Z87D5m8KArTvQWH13Nwmmo`): 947×812 embeddable widget (NOT 1440), supports light (#ecedf2) and dark (#2a2b30) themes. Used for partner integrations (MiniPay, Age Verification).
- **README Project Structure updated** to include sumsub-id-pattern.md.

Files in Sumsub ID project that are NOT pattern-relevant: main file (diagrams + cover only), Refs and IA, Brand assets, Blockchain (older 2025-08).

## v3.73.0 — 2026-04-30
**Bulk reference-doc expansion + per-product split.** Pattern docs were split out per-file (was: a few combined docs). Plugin now ships with **28 reference docs** in `skills/sumsub-mockup/reference/products/`.

- **New pattern docs (Dashboard project):**
  - `settings-pattern.md` — Settings hub unique pattern (1920 + Menu 80 + Additional Menu 191 + Header 1649)
  - `marketplace-pattern.md` — Integrations (Pattern A: Sidebar 257 + 600-wide drawer) + Products (Pattern B: Content 2.0 organism)
  - `reports-pattern.md` — Editor with collapsed sidebar 52
  - `billing-pattern.md` — List with Cards Row + Period Row + Table
  - `operator-pattern.md` — Settings family on 1841 canvas
  - `signup-pattern.md` — Auth split (Image 1120 + Form 800)
  - `reusable-identity-pattern.md` — Standard Pattern 1 (1440 + 257)
  - `legacy-dashboard-patterns.md` — covers Statistics, Dev space, Dashboard Home Old (P6 legacy nav)
  - `dashboard-project-files.md` — INDEX of 32 files in Dashboard Figma project + scan-via-PAT instructions
- **New Sumsub-products pattern docs (other projects):**
  - `kyb-levels-pattern.md` — KYB Companies Levels (3 patterns: list + editor + multi-frame review)
  - `questionnaires-pattern.md` — 1280 + 276 sidebar + Header Full Screen Page editor
  - `appearance-customisation-pattern.md` — 1920 split-view (Settings 727 + Preview/Appearance 1193)
  - `databases-pattern.md` — Browser-chrome wrapper + 276 sidebar
  - `poa-settings-pattern.md` — 1280 full-screen builder
  - `global-settings-pattern.md` — 1920 + 276 + Header 120
  - `data-comparison-pattern.md` — 1440 + 276 + 800-wide drawer for advanced rule test
  - `aml-screening-pattern.md` — Mixed canvas (1920+276 / 1440+52)
  - `workflow-builder-pattern.md` — Canvas + node types + bars (Flow Builder)
- **Updated existing pattern docs:**
  - `case-management-pattern.md` — Pattern B (Case detail) two-level wrapper structure (`Frame 270990504 → Subheader + Container`) with exact paddings 32/24/24/24, alignment CENTER/MAX, 6 tabs (was 5), 24px right margin (NOT between columns)
- **README Project Structure rewritten** to reflect 28-doc reference layout.

These docs were validated against canonical references file-by-file. Audit 7.45 (canonical-match, v3.72.0) reads `productContext.canonicalMap` against these docs' dimensions when building.

## v3.72.0 — 2026-04-30
Triggered by KYB WebSDK build (v3.71.0) that audit-PASSED with massive canonical deviations: 11/11 wrong background fill (#F6F7F9 instead of canonical #FFFFFF), 8/11 wrong frame heights (universal 1100/1300 instead of per-screen 960/1024/1067), 9/11 wrong Window heights (variant defaults instead of canonical post-resize values). The skill literally captured the canonical heights in Phase 2 and then ignored them in Phase 6, building with hardcoded "reasonable defaults" instead.

- **New Critical rule — "Canonical-first build: match the source-file reference EXACTLY, do not invent dimensions".** Top-level rule placed at the very start of the Critical rules section. Six properties enumerated (frame W/H, background fill, instance position, instance dimensions AFTER post-instantiation resize, variant values, layout structure) with explicit guidance on each. Particularly:
  - **Component instance heights** — components have intrinsic variant heights, but canonical instances are often resized after `createInstance()` to a different per-screen height. Use canonical instance height, not variant intrinsic.
  - **Background fills are product-specific** — KYB uses white, KYC uses subtlest grey. The canonical tells you which; don't default to one.
  - **Layout structure must match** — if canonical wraps content in extra frames (Pattern B's `Frame 270990504 → Subheader + Container`), reproduce the wrapper hierarchy. Don't flatten.
- **Banned phrases in build logs** — explicit list of phrases that signal canonical bypass: "Per-row height = max(frameH)", "Frame heights: 1046/1100/1300" (3 universal values can't match per-screen canonical), "#F6F7F9 light KYC-style bg" applied to KYB build, "Window heights: variant defaults", "Reasonable default", "Common pattern", "Approximate the canonical".
- **New audit 7.45 — Canonical-match.** If `productContext.canonicalMap` is provided (skill builds it during Phase 2 inspection), every built screen must have a map entry, and frame dimensions / fill / instance position+size must match within 2px tolerance. If `productContext.requiresCanonical = true` but no map provided, audit hard-fails with instructions to build the map. Each issue message names the canonical property and the deviation.
- **Procedure to follow**: (1) Locate canonical source per pattern doc → (2) Build a `canonicalMap` array `[{ screenLabel, frameW, frameH, frameBg, componentVariant, componentX, componentY, componentW, componentH }, ...]` from inspected canonical → (3) Build using map values, NOT defaults → (4) Audit 7.45 verifies match.

If canonical is missing or ambiguous, the rule is **stop and ask the user, do not invent**. "I built X but couldn't find canonical for screens 4/10/11 so I used 1300" is no longer acceptable — surface the gap, get an explicit user decision.

---

## v3.71.0 — 2026-04-30

`websdk-mockup` — **KYB context support** (Know Your Business — business verification flows).

**New `reference/kyb-organisms.md`** — full reference for KYB WebSDK structure scanned from source file `9ii3Ueqr01mbLS3SE6bsrJ` (KYB | Light + Dark). Documents:

- **Why KYB is architecturally different from KYC:** KYB does NOT use the WebSDK `Widget` shell. It uses LOCAL `Window / *` components in the KYB file (1440×1046 background frame with centered 512×800 Window inside).
- **17+ KYB component keys** with full variant lists:
  - Window-level shells: `Window / Select company` (5 states), `Window / Associated parties` (5 types), `Window / Proof of address` (3 types), `Window / Company documents`, `Window / Status page`
  - Body organisms: `Associated parties`, `Proof of address`, `Select company / Company search`, `Card Associated Party / Associated Parties screen` (6 variants), `Card Associated Party / Status screen` (2 types), `Company document / Group` (3 states), `Group / Attached File` (3 states), `Collapse Block`, `Associated parties / Group Associated parties`
  - Status organisms: `Status` (6 types), `Status group` (12 variants), `Status Page / Status` (5 statuses), `Status Page / Step` (4 steps)
- **Canonical screen anatomy:** Top Bar (`Type=Steps, Stroke=False`) + Body (Title + Content with optional Slot + step organism) + Bottom Bar (`Buttons=Two/One, Stroke=False`)
- **KYB flow sequence:** Start → Company search (5 states) → Status overview → Company documents → Associated parties (Add/Edit Individual/Company) → Proof of address → "We're checking your data" status states
- **Section node IDs** in the KYB file for direct inspection: General flow `3719:142312`, Company search `5147:28502`, Company documents `3105:80346`, Adding associated parties `3105:95064`, We're checking your data `3417:55129`, PoA `6059:48423`
- **Library subscription requirement:** consumer files must subscribe to KYB library before keys are importable. Pre-build check pattern documented.

**SKILL.md updates:**
- New "🟠 KYB context" section above critical rules — trigger phrases ("KYB", "company verification", "associated parties", "beneficial owner", etc.) and key architectural differences
- Rule #2 expanded: read 5 reference files instead of 4 (kyb-organisms.md added). For KYC tasks examples-library.md is most important; for KYB tasks kyb-organisms.md is most important.
- Explicit ban: don't mix KYB Window shells with KYC Widget shells in the same flow.

**Why this matters:** prior versions of the skill would attempt KYB screens using the KYC Widget shell + organisms in slot — wrong architecture. KYB uses pre-assembled Window shells with built-in toolbars and per-state variants (e.g. `Window / Select company / State=Find your company`). The variant covers the entire screen state, not just the inner organism.

---

## v3.70.0 — 2026-04-30

`websdk-mockup` — **`Image` visibility is canonical-driven, not "always false" (HARD RULE refinement)**.

**Problem caught in user-reported build:** Liveness Tips screen (`1236:169929`) rendered without illustration. The Tips/Group content was visible, but the 718×240 Image area at the top was empty grey instead of showing the Liveness step illustration. Welcome / Document Type / Accesses / Review / Status screens looked correct. Pattern: only Tips/Guidelines/Liveness intro screens were broken.

**Root cause:** v3.68.0 Rule #∞ override map listed `Image.visible = false` as a flat rule for all Type=Content widgets. Skill applied it globally during build. **The rule was oversimplified.**

In canonical Examples (Tips Examples section `2287:180771`):
- Welcome / Document Type / Accesses / Review / Final statuses widgets have `Image#10288:0 = false` ✓
- **Tips widgets have `Image#10288:0 = true`** + `↳  Image#10431:4` INSTANCE_SWAP set to a `Steps` variant
- Steps set (`48b1e3e308f6d74906213d9f215065ad781eae79`) has illustration variants: `Type=Liveness`, `Type=ID-Front`, `Type=ID-Back`, `Type=Selfie`, `Type=Video-ident`, etc.
- Each renders the relevant step illustration in the 718×240 Image area above the Tips content

**Fix in this release:**
- Critical-overrides table in SKILL.md split row #4 into:
  - `4a. Image#10288:0 boolean` — **canonical-driven** (false for Welcome/DocType/etc., true for Tips/Guidelines/Liveness intro)
  - `4b. ↳  Image#10431:4 INSTANCE_SWAP` — when 4a=true, set to relevant Steps variant
- Added explicit guidance: "never apply visibility/property overrides globally per Widget variant. Always read the canonical Example for THIS specific organism."
- Added row #8 to overrides table — recursive sub-slot fills (per v3.69 rule, made explicit in summary table)
- Concrete Tips example added with set keys

**Concrete example added:** Tips/Liveness organism — `Image#10288:0 = true`, `↳  Image#10431:4` = INSTANCE_SWAP to `Steps` set variant `Type=Liveness` (set key `48b1e3e308f6d74906213d9f215065ad781eae79`). Skill must mirror BOTH the boolean AND the swap from canonical Example.

---

## v3.69.0 — 2026-04-30

`websdk-mockup` — **Rule #∞ inspection is RECURSIVE, not one-level**.

**Problem caught in user-reported build:** the v3.68.0 KYC build placed `Accesses` organism (Camera permission screen) into the Widget Content slot correctly, BUT did not populate the inner `Instructions` slot of the Accesses organism itself. The screen rendered with empty grey `*Slot* / Basic` placeholder where canonical Examples have `Instructions/Camera` (with `Tips / Group` content showing actual permission instructions).

**Root cause:** Rule #∞ workflow stopped after step "organism inserted into Widget Content slot ✓". The skill never walked INTO the inserted organism to check whether IT has its own slots/INSTANCE_SWAP properties that also need filling per canonical Example. Inspection was 2 levels deep when canonical compositions are 3+ levels deep.

**Fix in this release — Rule #∞ step 3 expanded:**
- Inspection must walk **at least 6 levels deep** into the canonical Widget
- For every organism encountered, read both:
  - Its child SLOT nodes (look for `type === "SLOT"` children)
  - Its INSTANCE_SWAP properties (look for `componentProperties[k].type === "INSTANCE_SWAP"` with non-default value)
- Mirror every populated nesting level in the build, using the correct insertion method per node type:
  - SLOT type → `slot.insertChild(0, instance)`
  - INSTANCE_SWAP property → `instance.setProperties({ key: variant.id })`

**Library-version drift documented:** the same logical slot may be exposed as `SLOT` in the source library file but as `INSTANCE_SWAP` property in the consumer file. Both methods populate the same visual area but use different API. Always read the actual node type / property type on the BUILD instance (not on canonical), then call the matching method.

**Concrete example added to SKILL.md:** Accesses organism — canonical has `Instructions` SLOT with `Instructions/Camera` (`Platform=Desktop, Browser=Safari` desktop / `Platform=IOS, Browser=Safari` mobile, set key `59c110db0432bfa7b963e5b6107b9de3d1cb287d`). Consumer file exposes this as `Slot#6363:0` INSTANCE_SWAP — fill via `accesses.setProperties({ "Slot#6363:0": variant.id })`.

**Audit rule:** every level of nesting that has content in canonical MUST have the same content in build. Empty inner slots / default-placeholder INSTANCE_SWAP values that don't match canonical = audit fail.

---

## v3.68.0 — 2026-04-29

`websdk-mockup` — **Rule #∞: Examples sections are the ONLY canonical source** (top-of-file rule, overrides all others).

Promotes "look at Examples first" from a per-section guideline to the foundational rule of the skill, placed at the very top of `SKILL.md` (before pre-flight check). Codifies the lesson learned across multiple failed sessions:

**Mandatory 5-step workflow** for every WebSDK screen:
1. Identify target organism from user request
2. Open Examples section in `8VpSRNe9ur7SBctw0JrtOE` via `use_figma`
3. **Inspect canonical Widget node-by-node** — capture override map (visibility states of all toolbars, instruction, Image, padding, bg fill, organism in SLOT, organism in Camera slot, Container sizing)
4. **Build by mirroring exactly** — same variant, same overrides, same insertion method
5. **Audit by diffing build vs canonical** — 0 deviations before "done"

**9 banned rationalizations** documented verbatim from past failed sessions:
- "I know how a Welcome screen looks; I'll build it from atoms"
- "Examples is just one variation; I'll make my own"
- "I have the organism keys from `examples-library.md`; that's enough"
- "I'll inspect Examples later if audit fails"
- "Memory says I built this organism before; I'll reuse what I remember"
- (5 more — see SKILL.md)

**Concrete definition of "looking at Examples":** must be a `use_figma` inspection script that reads canonical Widget properties and prints them to context. Build log must include `PHASE — CANONICAL EXAMPLES INSPECTION` section with node-id and captured override map. Without that phase, build is non-compliant.

**Cataloged failures section** lists 4 past WebSDK builds where skipping Examples inspection led to broken output (KYC v3.64.0 with all 7 overrides missed; POI build that took 4 attempts; Liveness rebuild after user pointed at Examples; mobile uniform-height bug from copying Examples per-organism heights). Establishes the pattern: skip inspection → wrong; inspect → correct first try.

---

## v3.67.0 — 2026-04-29

`websdk-mockup` — **SLOT fill is `insertChild`, NOT appendChild + ban on overlay fallback (HARD RULE)**.

**Critical bug discovered in v3.64.0 build log:** the skill claimed both `slot.appendChild(organism)` and `setProperties({ "Content #12831:0": comp.id })` "fail in current Plugin API", and resorted to **overlay fallback** — placing organism as Section sibling of Widget, positioned absolutely over the Widget area. Symptoms in real builds: 9 widgets all had EMPTY Content slots, organisms floated as siblings, all 7 critical Widget overrides skipped (Top Bar=Size=Large default instead of Size=Medium, instruction frame visible, Image frame visible, no bg fill, etc.).

**Root cause:** the skill never tried `slot.insertChild(0, organism)`. It only tried appendChild (correctly fails) and setProperties on SLOT (correctly fails). The third method — insertChild — was never documented in `organisms.md` and was never attempted. **insertChild works.**

**Fix in this release:**
- New **Rule #4.45** in SKILL.md: "SLOT fill is insertChild(0, ...), NOT appendChild" — HARD RULE with banned alternatives table and banned rationalizations
- New audit check: every Type=Content Widget MUST have `slot.children.length >= 1`. Empty slot = build violation.
- **OVERLAY FALLBACK explicitly banned** — placing organism as Section sibling of Widget for any reason is a violation. The only correct insertion path is `slot.insertChild(0, organism)`.
- `organisms.md` line 142: `slot.appendChild` → `slot.insertChild(0, organism)` with explanatory comment about why appendChild silently fails

**Step status documentation corrected:**
- v3.64.0 `organisms.md` claimed `Step status` has `Title slot#2393:1` INSTANCE_SWAP property. **It doesn't.** Plugin API scan shows Step status set has only: `Status state` VARIANT, `Slot#2653:11` SLOT, `Error#2653:15` SLOT, `Warning#2653:19` SLOT. Setting "Title slot#2393:1" fails with "Could not find a component property with name…".
- Recommendation added: for text-driven status messaging (e.g. "Verifying your identity", "Your identity is verified"), use **`Final statuses`** set (`d3f95404b879e0993ddca2f599e2e5071cdda0ba`) — has 3 variants (Success / Pending / Rejected) with editable Title/Subtitle text nodes via `findOne(...)`.

**Concrete fix that motivated this release:** KYC flow build at section `1173:101158` had 9 widgets all in default state (45 issues across the build). Re-fixed by walking each widget, applying the 7 canonical overrides, and using `slot.insertChild(0, sibling)` to move 5 sibling-overlay organisms into their respective Content slots. Final audit: 0 issues, all 9 widgets canonical.

---

## v3.66.0 — 2026-04-29

`sumsub-mockup` + `websdk-mockup` — **Production source is canon (universal HARD rule)**.

**New `sumsub-mockup` Rule 7.4** — for every TM/AP/CM/Dashboard build that has a layout-pattern doc, the skill MUST:
1. Look up the source/canonical file in the matching pattern doc
2. Open that file via `use_figma`, find the canonical PROD frame
3. Walk it node-by-node and produce a **block manifest** (Main column blocks, Right column blocks, etc., in canonical order with their variants)
4. Build by mirroring the manifest exactly — no invented block order, no extra blocks, no missing blocks
5. Diff output against manifest before declaring done

**New `websdk-mockup` Rule #4.4** — generalization of "look at Examples library first" to any Sumsub design context.

**Why this rule exists:** without it, builds use "plausible-looking SaaS dashboard intuition" — block order is invented, variants are picked at random (Properties=Expanded vs Collapsed), extra blocks are added because they "feel right" (Anomaly score / Risk labels), and canonical blocks are quietly dropped (Transaction crypto info). Audit passes because component-level checks are clean, but a reviewer comparing against production sees a fabricated layout.

**Concrete fix that motivated this rule:** TM Transaction Detail Pattern 4 build at `5593:147800` was rebuilt by inspecting canonical frame `964:457129` in source `5irNYDkalXUObKIxKXQiy3`. 14 differences fixed: block ordering, column placement (Customers card was in wrong column, Transaction details in wrong column, Properties in wrong column with wrong variant), removed extra Anomaly score + Risk labels that aren't in canonical, fixed body+columns gaps (40 + 64 instead of 20 + 20), Header/Finance Confirmed=No instead of Yes.

**Source files mapping** added to Rule 7.4 — explicit table showing which fileKey + page to inspect for each Pattern (TM Pattern 4 → `5irNYDkalXUObKIxKXQiy3`, AP Pattern 2 → `Di7nvHaOxXiWuDAN1oa0hK`, Case Pattern B → `ieTGS0ab6tqr3zwXRYPHIu`, etc.).

**Build log requirement:** every PHASE 2.5 — CANONICAL SOURCE INSPECTION must be present in the log, listing source fileKey, canonical frame ID, and the block manifest. Missing this section = build is non-compliant.

**Deviation handling:** if a canonical block is unimportable (e.g. internal-only component), STOP and ask the user before substituting or skipping. No silent substitutions.

**Catalog flagging:** during the rebuild, two TM Components catalog keys were found unimportable (`03e19780...` Customer card / Applicant, `8a431d6e...` Customer card / Counterparty, `6c5f3608...` Transaction crypto info). They're internal/macket keys not exposed to subscribers. `tm-component-catalog.md` should be re-verified.

---

## v3.65.0 — 2026-04-29

`websdk-mockup` — Widget+Organism canonical assembly is now the enforced pattern.

**New: `reference/examples-library.md`** — full inventory of every `Examples` SECTION across the Organisms file (`8VpSRNe9ur7SBctw0JrtOE`), with direct Figma links for: Accesses, Applicant Data, Camera, Document Type, Email Verification, Guidelines, List, Liveness, Phone Verification, Proof of Address, Proof of Identity, Welcome, Steps (10 states), Tips (12 states), Statuses, Sumsub ID Connect. Each entry has a node-id link straight to the canonical assembly.

**The 7-step canonical Widget assembly recipe**, codified into a new HARD RULE (#4.5): every WebSDK screen must be built with `Widget` set (`232e8d4d5beed4ad18da48386dab7a640ac0ca45`, `Type=Content`) + organism inserted into Content SLOT — never from atoms.

**The 7 critical instance overrides** (memorize these — without them the screen is broken):
1. Bind Widget bg fill to `semantic/background/secondary/normal` — instances are created with `fills: []` by default
2. Show only `Size=Medium` Top Bar on desktop, `Size=Small` on mobile (NOT `Size=Large`)
3. Hide `instruction` frame (`.visible = false`) unless QR-handoff prompt is the screen's purpose
4. Hide `Image` frame unless Steps illustration is part of the design
5. Set `Container.layoutSizingHorizontal = "FILL"` on mobile (without this, Container stays at desktop width 1392)
6. Set Widget `padding = 0/12/12/12` on mobile (master default is `0/24/24/24` desktop)
7. Insert organism via `slot.insertChild(0, instance)` — `appendChild` silently drops it

**New `auditWidget` function** in `examples-library.md` — verifies all 7 overrides on a built screen. Required check before declaring "done".

**New gotchas documented:**
- Cross-file cloning fails on missing fonts (Aeonik Pro, SF Pro Text not installed locally)
- Widget responsiveness is partial — resize alone is not enough; you must override Container sizing
- Slot's `appendChild` is unreliable for SLOT type; always use `insertChild(0, ...)`
- Widget instance `fills` are always empty after `createInstance()` — must explicitly bind variable

**New mandatory checklist** in SKILL.md — 11 items to verify before delivering any WebSDK screen.

---

## v3.64.0 — 2026-04-28

New skill: `websdk-mockup` — WebSDK Figma mockup builder.

Creates mockups for WebSDK verification flows: KYC steps, document capture, selfie/liveness, questionnaires, status screens, video ident, QR handoff, and more.

Fully separate from `sumsub-mockup` to prevent token/component cross-contamination between Dashboard UI Kit and WebSDK design systems.

**What's included:**
- `skills/websdk-mockup/SKILL.md` — skill entry point with all critical rules (pre-flight, where-to-create, library check, reference reads, WebSDK-specific design system rules)
- `skills/websdk-mockup/reference/variables.md` — complete WebSDK token reference (spacing, border-radius, text, background, border, icon variables) with `importVariableByKeyAsync` keys, Light/Dark hex values, and critical differences from Dashboard DS
- `skills/websdk-mockup/reference/base-components.md` — full atom/molecule catalog from Base components library (`Gh2QlRTetoSQdlK9G1nDq4`): 35+ categories with component set keys and variant details
- `skills/websdk-mockup/reference/organisms.md` — full organism catalog from Organisms library (`8VpSRNe9ur7SBctw0JrtOE`): 20+ pages covering all WebSDK screen types

**Key WebSDK design system rules enforced:**
- Font: **Manrope** (not Geist)
- Icon tokens: **`semantic/icons/*`** (PLURAL — not `semantic/icon/*`)
- Spacing prefix: **`semantic/spacing/*`** (not bare `spacing/*`)
- Border-radius prefix: **`semantic/border-radius/*`** (not bare `border-radius/*`)
- Dark shell: outer container is always `#20252c` even in Light mode — this is correct, not a bug
- Color mode keys: Light = `1425:0`, Dark = `1425:1`

---

## v3.63.2 — 2026-04-28
Patch: white fill Rule #6 not enforced for TM Pattern 4 content frames.

Root cause: audit check 7.05 only matched frames named `Content` / `Page Content`. In TM Pattern 4 (Transaction detail, 1920px), the content-surface frames are named `Body`, `Columns`, `Main column`, and `Right panel` — none matched the regex. The build script also didn't set white fills on them, relying on inheritance from a parent that was itself transparent. Both frames being transparent meant the root grey (`#f6f7f9`) showed through the entire screen.

Three layers of enforcement added:

1. **Rule #6 expanded** — added an explicit table listing which frames must have white fills per pattern, including all four TM Pattern 4 frame names (`Body`, `Columns`, `Main column`, `Right panel`). Added "transparent ≠ white" warning and banned the rationalization "parent will be white, child can be transparent".

2. **Audit check 7.05 regex expanded** — from `/^(Content|Page Content)$/i` to `/^(Content|BG Content|Page Content|Body|Main column|Columns|Right panel|Container)$/i`. All content-surface frame names across all patterns now trigger the white-fill check.

3. **TM Pattern 4 dedicated audit** (inside the `productContext === "tm"` block) — when `rootW === 1920`, additionally scans for TM-specific content frames by name and emits a hard fail if any have transparent/missing fills, with an explicit pointer to Rule #6.

4. **Background Rules section updated** — added TM Pattern 4 frame table and a code snippet showing `whiteFill()` being applied to all four frames individually. Explicit note: do NOT rely on fill inheritance — each frame must be set independently.

---

## v3.63.1 — 2026-04-28
Patch: closed the "it's already in context" rationalization loop for product-docs reads.

Root cause: `tm-layout-patterns.md` and `tm-component-catalog.md` are pre-loaded every session via CLAUDE.md. Seeing them in context, the skill concluded "TM references are covered" and skipped reading `sumsub-docs-transaction-monitoring.txt` — which is never pre-loaded. The fix adds three layers of enforcement:

1. **Required-reads table (TM row)** now explicitly lists `sumsub-docs-transaction-monitoring.txt` alongside the three layout files as the fourth mandatory read, with a note that all four require explicit `Read` calls and that layout files being in context does not count.
2. **Product-docs triggers section** — added a universal banned-rationalization note: product docs (`.txt` files) are never pre-loaded; context presence of a layout reference file does not satisfy the docs read for any product.
3. **TM disambiguation block** — added a dedicated "banned internal monologue" list naming the exact rationalizations observed in the TM test build: "I have tm-layout-patterns.md in context", "I know TM from previous sessions", "the user's brief describes it well enough". All explicitly forbidden.

## v3.63.0 — 2026-04-28
Five build violations caught from a TM Transaction Detail test run of v3.62.0. All violations addressed with rule-text reinforcement and a new audit check.

- **[Violation 1] Rule #2 — TM product-docs disambiguation.** Skill was reading `tm-layout-patterns.md` (component keys, canvas sizes) and treating it as satisfying the product-docs read. `sumsub-docs-transaction-monitoring.txt` is a completely separate, mandatory read that covers product domain knowledge (rules, risk scoring, VASP screening, travel rule). Added explicit warning block after the product-docs trigger table clearly stating: Group A (layout refs) and Group B (product docs) are TWO SEPARATE mandatory read requirements; reading Group A does NOT satisfy Group B. Also added ⚠️ marker in the Required reads table for TM row.

- **[Violation 2] Rule #1 — `get_libraries()` not called.** Strengthened Rule #1: added "MANDATORY — must happen before the very first `use_figma` call" language, added TM row to the required-libraries table (`jH0zp9iwzizayCPZNggytx`), and added a list of banned bypass phrases for skipping the library check (e.g. "libraries are likely already connected", "I checked the file earlier").

- **[Violation 3] Rule 7.5 — Root frame placed directly on page, not inside a SECTION.** `findFreeCanvasSpot()` was being misused to position root frames directly on the page. Rewrote Rule 7.5 with explicit language: every root frame MUST live inside a SECTION; `findFreeCanvasSpot()` positions the SECTION, not the frame. Added the correct assembly order code example (create section → get spot → position section → append root inside section → resize section). Added banned patterns. Added **new audit check 7.45** that fires when `root.parent?.type === "PAGE"`.

- **[Violation 4] Rule 7.8 — Spacing binding deferred to post-audit.** Spacing/radius variable binding was done in a separate follow-up `use_figma` call after audit caught it. Added explicit BUILD-TIME language to Rule 7.8 and a ⚠️ warning: if audit 7.16 fires, the build script was incomplete; applying the binding post-audit is not acceptable; a single `use_figma` call must produce a fully token-bound result. Added banned pattern phrases.

- **[Violation 5] Rule #7 — No text overrides on TM component instances.** TM components ship with no data; `setProperties()` was never called on any TM instance (Header/Finance, transaction rows, VASP cards, risk score widgets, etc.). Added TM-specific realistic data table under Rule #7 specifying required overrides for each component type.

---

## v3.62.0 — 2026-04-28
Transaction Monitoring added as a first-class product context — 8 TM Figma files scanned, layout patterns and component catalog documented, skill wired up with required-reads and audit checks.

- **New reference/tm-layout-patterns.md.** 6 TM layout patterns with exact dimensions, assembly recipes, and decision tree:
  - Pattern 1 — Transactions table: Sidebar 257px, 1440×900 (standard DS pattern)
  - Pattern 2 — Settings/Rules: **Sidebar 276px** (TM-specific wider sidebar), 1440×956
  - Pattern 3 — Rule editor: Header Full Screen Page 1440×64, Main 1000px + Settings panel 440px, no sidebar
  - Pattern 4 — Transaction detail: **1920px canvas** (not 1440), no sidebar, `Header/Finance` 144px + Body: Main 1412 + Right 380; responsive breakpoints at 1680/1536/1440/1280
  - Pattern 5 — Txn Networks case: **1681px canvas**, no sidebar, Left 1316 + Right panel 364
  - Pattern 6 — Legacy VASPs: 1920px with old `*Menu*/Basic` 281px sidebar (avoid for new work)
- **New reference/tm-component-catalog.md.** Full scan of TM Components library (`jH0zp9iwzizayCPZNggytx`) — 65 importable components across 5 pages: General + Finance (headers, transaction details, AML checks, matched rules, customer cards, notes, events), Travel rule (beneficiary/originator/Chainalysis), Crypto (Chainalysis/Elliptic/TRM Labs screening), Non-finance, Analytics tab (charts, status overview, relations map).
- **sumsub-mockup/SKILL.md — TM added to required-reads table.** Rule #2 required-reads now includes: "Transaction Monitoring (any TM screen) → tm-layout-patterns.md + tm-component-catalog.md".
- **sumsub-mockup/SKILL.md — TM added to product reference table** (Rule #14 section).
- **sumsub-mockup/SKILL.md — productContext extended with `"tm"`.** New audit block for `productContext === "tm"`: validates sidebar width (257 or 276, anything else = hard fail with pattern hint), validates no-sidebar canvas width (1440/1920/1681 — anything else = hard fail), checks for `Header/Finance` instance on 1920px screens.
- **Gotchas documented:** TM Settings/Rules use 276px sidebar (not standard 257px); Transaction detail is 1920px canvas (not 1440px); Rule editor has no sidebar; Transaction Networks uses custom 1681px canvas.

## v3.61.0 — 2026-04-28
Hard-fail audit for Case Management Pattern B (Case detail page) — caught from a manual rebuild after v3.60 mockup placed components at the wrong positions. Skill had the pattern documented in `case-management-pattern.md` but no audit gate, so the mockup shipped with five layout violations.

- **New audit 7.44 — Case page Pattern B structural validation.** Trigger: any frame whose first-level INSTANCE child is `Case page header` (component key `070118da7e99...`). Fails on:
  - Header not at exactly `(0, 0)` with size `1440×88`
  - Missing left wrapper FRAME (`Frame 270990504`) — the canonical mistake of placing `Case page Overview tab content` directly into root at x=0, w=992 (which stretches the intrinsic-932 component AND skips Container paddings)
  - Left wrapper not at `(0, 96)` (the 8px gap below the 88px header) or wrong size
  - Subheader missing OR with wrong paddings (must be `32/32/0/1`) OR wrong alignment (must be `primaryAxisAlignItems = CENTER, counterAxisAlignItems = MAX` — bottom-anchors Tab Basic at y=23)
  - Container missing OR wrong paddings (must be `L=32, R=24, T=24, B=24`) OR wrong itemSpacing (must be 24)
  - Right column not at `(992, 96)` — explicit error message names the canonical x=1016 mistake (24px gap BETWEEN columns instead of 24px right margin)
  - Right column not 424×804

The audit message includes the fix hint inline ("see case-management-pattern.md") so the skill knows where to look. Pattern B-specific because Case page is the only CM screen using this two-level wrapper structure.

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
