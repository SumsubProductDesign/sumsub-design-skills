---
name: sumsub-mockup
description: "Create Figma mockups for any dashboard screen — table pages, detail views, forms, modals, empty states. Describe what you need and get a pixel-perfect screen using Sumsub design system components."
argument-hint: "[screen description]"
---

# Figma Skill: Mockup Builder

> Create dashboard mockups in Figma on any given topic.
> Supports table pages, detail pages, forms, modals, drawers, and custom layouts.
> Uses the Figma Blocks system (helpers.js + block JS) and Sumsub design system components.

## 🚨 Critical rules — read and follow every time

These are non-negotiable. Violating any of them is treated as a bug:

### Pre-flight: plugin version check — MANDATORY FIRST ACTION

**As the very first action of every session — before any other tool call, before reading any reference — do this:**

1. **Read local version:** `Read` tool on `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. Extract the `version` field.
2. **Fetch remote version:** `WebFetch` tool on `https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json` (prompt: "return the raw JSON"). Extract the `version` field.
3. **Compare SemVer.** If local < remote → continue to step 4. If local ≥ remote → proceed silently to Rule #0.
4. **Fetch `CHANGELOG.md`** from `https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/CHANGELOG.md`. Extract entries between local and remote versions.
5. **STOP and show the user this verbatim:**

   ```
   ⚠️ sumsub-design plugin update available
   Your local version: vLOCAL · Latest: vREMOTE

   What's new since your version:
   <paste CHANGELOG entries extracted in step 4>

   I can update it for you right now by running:
     claude plugin marketplace update sumsub-design
     claude plugin update sumsub-design@sumsub-design

   Reply:
     - yes / update — I'll run the two commands via Bash
     - continue anyway — use current (older) version for this session
   ```

6. **Wait for explicit reply.** Do nothing else until the user says `yes` / `update` / `continue anyway`.

7. **If `yes` / `update`:** run `Bash` with `claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design`. On success, tell user to fully quit and reopen Claude Desktop, wait for `restarted`, then continue. On Bash failure, surface the exact stderr and fall back to asking user to run manually.

8. **If `continue anyway`:** cache the decision for this conversation, proceed to Rule #0.

9. **Once done (either updated or continue-anyway), don't re-check this conversation.**

**Banned bypass phrases** — any of these is a rule break, period:
- "proceeding on current version in auto mode"
- "will mention at the end"
- "auto-accepting outdated plugin"
- "non-interactive mode, continuing with local version"
- "keeping momentum, will re-check after this run"
- "first tool is get_libraries, so no check needed yet"
- "doing the check later, after inspection"
- "memory says plugin is current, skipping"

If local plugin.json read or remote WebFetch fails (network / file missing), warn once in your response ("could not verify plugin version, proceeding on faith") and continue — don't block on infrastructure issues, but make the failure visible.

0. **Ask WHERE to create the mockup — HARD STOP, WAIT for the answer.**

   **Forbidden bypass phrases** — same class of violation as pre-flight's banned auto mode. All of these are rule breaks, period:
   - "Auto mode: defaulting to Sumsub org"
   - "Reasonable default given this is a work task, proceeding"
   - "Creating in Sumsub org, will mention at the end if you want another location"
   - "Minimize interruptions, using default"
   - "User gave a task description so I inferred the location"
   - "I already created the file, let me know if you want to move it"
   - "Auto mode instruction said 'prefer action over planning' so I picked X"
   - "MEMORY.md has a fileKey for this project, so I used it"
   - "Memory entry for `<fileKey>` from a prior task — treating that as the answer"
   - "Project convention in memory says use file X"
   - "User worked in file X in the previous session, so that's the file"
   - "Prior session already established this — no need to re-ask"

   None of these are acceptable. If you catch yourself about to write any of them — or anything structurally similar — STOP. You violated the rule. Revert any files / frames you created (delete the Sumsub-org file you just created, remove section/frame), then ask the question.

   **Memory ≠ answer.** MEMORY.md, `.claude/` notes, prior-session fileKeys you saw in the conversation history, your own pattern-matching from a similar task — none of these are implicit answers to "where do I create this?". Memory is CONTEXT for how you work (component keys, rules, conventions), not a PRE-FILLED ANSWER to Rule #0 prompts. The ONLY valid source of "where" is the user's current message, in this conversation. If that message didn't include a Figma URL or explicit location, you ask.

   Any Claude-Code "auto mode" / "minimize interruptions" / "prefer action" directive the user may have set globally does NOT override this rule. This rule is local-scope and takes precedence inside this skill.

   Four distinct destinations — ask explicitly:

   > Where should I create the mockup?
   > 1. **Existing file** — share a Figma URL (tell me which section/frame if relevant)
   > 2. **Personal Drafts** — new file in your Drafts (personal tier)
   > 3. **Team project** — tell me which team (Starter/Pro tier — has MCP file-creation limits)
   > 4. **Sumsub org** — new file in the Sumsub organization (Org tier — recommended for work tasks)

   Wait for the answer. For work tasks (anything building on Sumsub product surfaces — Flow Builder, Applicant page, Dashboard screens, etc.) the default is option 4 (Sumsub org). Personal Drafts = Starter-tier limits = you WILL hit an MCP file-creation cap mid-build. Offer option 4 by default and ask to confirm.

   **planKey awareness.** When creating files via `create_new_file` / MCP, always pass the org `planKey` from `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md` (section "Figma File Info") for work tasks. Hitting a plan-tier limit mid-build because you silently used Drafts is a bug, not a Figma bug.

   **Page-level placement inside the file — call `ensureDraftsPage()` as the FIRST LINE of every `use_figma` script.**

   `figma.currentPage` RESETS BETWEEN `use_figma` INVOCATIONS. The first call may correctly run on Drafts; the second call starts with whatever page was last active (usually Page 1) and silently creates nodes there. This has been observed multiple times — sections / screens ending up on Page 1 even though the first call was on Drafts.

   The `ensureDraftsPage()` helper (in `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/helpers.js`) finds or creates the Drafts page and sets it as current. **Every single `use_figma` script, without exception, must start with:**

   ```js
   await ensureDraftsPage();   // MUST be the first call in every use_figma script
   // … now safe to create / modify nodes ...
   ```

   Page resolution order inside `ensureDraftsPage()`:
   1. Find existing page whose name matches `/drafts/i` — use it.
   2. Else create `🛠 Drafts`.

   If the user explicitly named a different page, override with that page instead (still as the first call): `await page.loadAsync(); await figma.setCurrentPageAsync(page);`.

   **Forbidden bypass phrases** — all of these are Rule #0-style violations:
   - "figma.currentPage is already Drafts from the previous call, skipping"
   - "minor — I'll correct the page at the end if needed"
   - "creating on current page for speed, will move later"
   - "auto mode: using default currentPage"

   All banned. If the section ends up on a wrong page, you revert (move the section to Drafts) and fix the missing `ensureDraftsPage()` call. Audit check 7.12 verifies root is on a Drafts-named page; it will fail the build if violated.

1. **Check libraries BEFORE starting.** Call `get_libraries(fileKey)` to see which Figma libraries are connected. For known Sumsub products (Flow Builder, Applicant page, Specs) the required libraries are:

   | Product | Required libraries |
   |---|---|
   | Flow Builder | Organisms [Dashboard UI Kit], Base components [Dashboard UI Kit], Assets |
   | Applicant page | Applicant-page-and-Tasks-components (`QKXZwWodIwPVsjAjj4gMnE`), Organisms, Base components, Assets |
   | Table / Detail pages | Organisms, Base components, Assets |

   If a required library is missing — STOP and ask the user to connect it. Do not proceed with invented structures.

   **⛔ The "I couldn't find it in search_design_system" excuse is forbidden.** `search_design_system` is keyword-matched and often misses. Before telling the user a component doesn't exist, you MUST:
   1. Read the product's reference file from this plugin's `${CLAUDE_PLUGIN_ROOT}/reference/` folder (see rule #2)
   2. Try `importComponentByKeyAsync` / `importComponentSetByKeyAsync` with keys listed there
   3. Only if both fail, report to the user

   Saying "the library doesn't contain Flowbuilder Header" when `${CLAUDE_PLUGIN_ROOT}/reference/flowbuilder.md` lists its exact component key is a bug, not a limitation.

2. **Read the product reference FIRST — mandatory.** Before any `use_figma` call for a known Sumsub product, use the `Read` tool on ALL reference files listed below for that product. Not optional, not "if you're unsure" — mandatory. The skill does not have the knowledge baked in; it lives in the reference files.

   | Product / Task | Required reads (ALL of them) |
   |---|---|
   | Flow Builder | `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md`, `${CLAUDE_PLUGIN_ROOT}/reference/flowbuilder.md`, `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md` |
   | Applicant page | `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md`, `${CLAUDE_PLUGIN_ROOT}/reference/applicant-page-pattern.md`, `${CLAUDE_PLUGIN_ROOT}/reference/ap-component-catalog.md`, `${CLAUDE_PLUGIN_ROOT}/reference/layout-patterns.md` |
   | Table page | `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md`, `${CLAUDE_PLUGIN_ROOT}/reference/layout-patterns.md`, `${CLAUDE_PLUGIN_ROOT}/reference/BLOCKS.md` |
   | Any custom page | `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md`, `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md`, `${CLAUDE_PLUGIN_ROOT}/reference/color-usage.md`, `${CLAUDE_PLUGIN_ROOT}/reference/layout-patterns.md` |

   If you haven't read the required references for the task's product, you're not ready to build. Building from "general knowledge" is a bug — the reference has exact keys, paddings, connector stroke weights, color logic that you cannot guess correctly.

   **Pattern-specific triggers — re-read the matching SKILL.md section BEFORE writing the relevant code.** These override "I think I remember it" — you don't, and getting them wrong is a silent failure that audit barely catches.

   | If the task involves… | Re-read this SKILL.md section (with the Read tool) BEFORE writing code |
   |---|---|
   | A Modal, dialog, confirmation, or any pop-up window | **"Modal Basic — setting body content via slot swap"** — wrong slot swap = empty modal body shipped |
   | A Drawer or side panel | **"Modal Basic — setting body content via slot swap"** (same SLOT pattern applies to Drawer Basic) |
   | A table / data list page | **"Top Toolbar — Rules"** and **"Table Cell Configuration"** |
   | Anything with filters | Check filter label customization — filter instances default to "Label" text |
   | A multi-screen task (≥4 screens) | Rule 7.6 (grid layout) |
   | A task that mentions "all necessary screens" / "все экраны" / "flow" | Rule 7.6 + realistic-data Rule #7 applies to every screen, including modals |

   Trigger is the user's task text, not your plan. If the user says "domain management with add flow", the task involves modals — re-read the Modal section before `use_figma` even if your plan doesn't mention it yet.

   **Product-docs triggers — MANDATORY READ before any `use_figma` call.** This is not "read if you're unsure" — it's "if the task keywords match, STOP and Read before generating any plan". Sumsub product behaviour doesn't match generic SaaS patterns. Skipping these docs = shipping a mockup that looks like Azure AD / Okta / Auth0 but doesn't match actual Sumsub flows.

   **Step-by-step for every new task:**

   1. Read the user's task text once. Extract all product-domain keywords — `domain`, `SSO`, `KYC`, `applicant`, `workflow`, `case`, `TM`, `transaction`, `fraud`, etc.
   2. Match each keyword against the trigger table below.
   3. For every matched row, call the `Read` tool on the listed file **before anything else**. Yes, before the library check. Before the reference-file reads. Before planning screens.
   4. Use `Grep` tool to find the specific section in the file (file is 2K+ lines — don't ingest it all).
   5. Build the plan using the actual terminology, field names, and flow steps from the docs. Not from your memory of how "domain verification usually works".

   | Task keywords | REQUIRED READ (from `${CLAUDE_PLUGIN_ROOT}/reference/products/`) |
   |---|---|
   | domain, SSO, single sign-on, SAML, OIDC, IdP, provisioning, team roles, account, billing, verification levels overview, dashboard | `sumsub-docs-overview.txt` |
   | KYC, applicant, ID doc, selfie, biometric, liveness, address proof, phone check, email check, questionnaire, payment check, reusable identity | `sumsub-docs-user-verification.txt` |
   | fraud, device intelligence, risk score, blocklist, IP check, antifraud | `sumsub-docs-fraud-prevention.txt` |
   | KYB, business verification, UBO, ownership, AML watchlist, adverse media, corporate doc | `sumsub-docs-kyb.txt` |
   | transaction monitoring, TM, rule, travel rule, crypto, VASP, wallet, payment flagging | `sumsub-docs-transaction-monitoring.txt` |
   | case management, queue, compliance officer, blueprint, SAR, STR, investigation | `sumsub-docs-case-management.txt` |
   | workflow, verification level, verification step, automation, marketplace, condition, action, review step | `sumsub-docs-workflow.txt` |

   **If the docs say the feature works differently than the user's brief describes**, the docs win. Build the mockup using Sumsub's actual terminology and structure. If the user's brief contradicts the docs meaningfully, STOP and ask before building.

   **Must-log in your build log:** state explicitly which product-docs files you read and which sections (by grep keyword). Example: *"Read sumsub-docs-overview.txt: sections 'Single sign-on (SSO)', 'SSO configuration fields', 'Configure SSO login'."* If your build log doesn't show a product-docs read for a task whose keywords clearly match the trigger table — you skipped Rule #2 and the mockup is suspect.

   **Failure examples (don't repeat):**
   - Domain Management mockup using invented `sumsub-domain-verify=xxx` TXT instead of the actual SPF + DKIM patterns from docs (`v=spf1 include:spf.sumsub.com ~all`, `sumsub1.domainkey CNAME sumsub1.domainkey.sumsub.com.`).
   - Building a standalone "Domain Management" module when the real docs only describe Domain as a field inside SSO configuration.
   - Using SSO provider UI patterns copied from Auth0/Okta dashboards instead of how the real Sumsub Settings → SSO page is documented.

3. **Never invent components for known Sumsub products, and never deliver a "bare" mockup as a workaround.** If the product exists in our design system, every major structural piece (Sidebar, Header, Flowbuilder Header, Canvas, Canvas Bars, AP page header) must be an instance of an actual DS component.

   **Forbidden patterns:**
   - Creating custom `FRAME` nodes named "Top Bar", "Toolbar", "Flow Builder Header", "Canvas", "Dot Grid" — these are fakes.
   - **Delivering just the inner content** ("just the canvas with nodes, no Header, no Sidebar") and justifying with "I couldn't find the shell components". A Flow Builder mockup without Flowbuilder Header + Sidebar + Canvas = broken mockup.
   - **Building Canvas as a custom FRAME with a dot-grid fill**. The Canvas is a published component — use it as an instance. A dot-grid FRAME is a Canvas fake.

   **Forbidden justifications (all of these are the same banned excuse rephrased):**
   - "the component doesn't exist in `search_design_system`"
   - "the component isn't published as a library component"
   - "the component is internal to a source file"
   - "I'll use a generic `*Header*` instead of Flowbuilder Header because the latter isn't available"

   If the library is truly not accessible (unpublished local component, file-private), the correct response is: *"The Flow Builder components live in file `X` as local components and aren't published. I can either (a) work directly inside that file, or (b) wait for DS to publish them — which do you prefer?"*. NOT "I'll build a custom frame".

   **Never quote a reference as authority without citing it.** Saying "the reference recommends using generic Header" requires pasting the exact line from `${CLAUDE_PLUGIN_ROOT}/reference/flowbuilder.md` that says so. If you can't paste the line, you're fabricating the authority — stop.

   If you catch yourself about to say "I built just X because Y isn't available" — stop, re-read the reference for this product, and either build the full thing or surface the blocker to the user.

4. **No screenshots.** Never call `get_screenshot` or any screenshot tool. Inspect everything via `use_figma` Plugin API (read properties, layoutMode, fills, variant props, text content). Screenshots are only allowed when the user explicitly asks.

5. **Page title goes INSIDE the `*Header*` component — no separate title TEXT anywhere else.** Use the Header's built-in title property (e.g. `Title text#3817:0`) plus its Subtitle / Buttons properties for the row of actions.

   **What's forbidden — substance, not name:**
   - A custom FRAME inside Content (or anywhere outside the Header instance) containing a TEXT with `semibold/h4-xl`, `semibold/h3-2xl`, `semibold/h2-3xl`, or any `bold/*` style and text that matches/restates the page title.
   - A TEXT node above the table / empty state / card stack that acts as the page title, regardless of what style it uses.
   - A HORIZONTAL row at the top of Content holding the title on the left and CTA button on the right. Both go in Header: title via `Title text#3817:0`, CTA via `↪ First Button#6943:8` = true and set its Button Text to the real label.

   **Renaming the FRAME from "Title Row" / "Title Stack" to something else does NOT fix this.** The audit detects by substance (title-level text style inside a non-instance frame), not by frame name. If you find yourself renaming frames "to pass the audit", you're grading your own exam — fix the root cause instead:
   1. Delete the duplicated title TEXT and its parent frame.
   2. In the Header instance, `setProperties({ "Title text#3817:0": "<real title>" })`.
   3. If you need a subtitle, use Header's `Subtitle#3817:6 = true` + `Subtitle text#3817:3 = "<subtitle>"`.
   4. If you need an action button next to the title, use Header's `Buttons#6943:21 = true` + `↪ First Button#6943:8 = true` + set the inner *Button*'s text.

   The user-facing rendering of all four things above comes from `*Header*` itself. Duplicating any of them in Content is noise that reviewers flag every time.

6. **Main content area is always white**, bound to `semantic/background/neutral/inverse/normal`. Never grey. Page root stays subtlest grey (`#f6f7f9`), but the `Content` / card areas are white (`#ffffff`).

7. **Fill with realistic data — always.** Tables: 10 rows with plausible names, dates, IDs, statuses (mix, not all "Approved"). Inputs: meaningful label + placeholder. Status badges: realistic distribution. Dates in DS format. NEVER leave default "Table cell", "Label", "Placeholder", "ID" text.

7.5. **Never place new mockups on top of existing ones.** Before `appendChild`-ing your root frame to `figma.currentPage`, find free canvas space to the right of existing frames. Use the `findFreeCanvasSpot()` helper from `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/helpers.js`:

   ```js
   const spot = findFreeCanvasSpot({ width: 1440, height: 900, gap: 200 });
   root.x = spot.x;
   root.y = spot.y;
   ```

   If you're not using the helpers (writing custom code), replicate the logic: scan `figma.currentPage.children`, find the rightmost frame's `x + width`, place the new root at that value + 200px gap. Never default to (0, 0) on a page that already has frames — your mockup will silently overlap the previous one.

7.6. **Multi-screen layout — grid, not one long row.** When building ≥4 screens for a single task, arrange them in a grid inside the SECTION, not in a single horizontal row. 6 screens × 1440px = 9000+ px wide and unreviewable. Use 3 or 4 columns:

   ```js
   const COLS = 3;            // or 4 for wider screens
   const GAP_X = 120;
   const GAP_Y = 240;         // extra vertical gap so annotations fit above each row
   screens.forEach((screen, i) => {
     const col = i % COLS;
     const row = Math.floor(i / COLS);
     screen.x = 40 + col * (1440 + GAP_X);
     screen.y = 160 + row * (900 + GAP_Y);
   });
   // Then resize the section to fit the grid
   section.resizeWithoutConstraints(
     40 + COLS * (1440 + GAP_X) + 40,
     160 + Math.ceil(screens.length / COLS) * (900 + GAP_Y) + 200
   );
   ```

   For 1–3 screens a horizontal row is fine. For 4+ always grid.

7.7. **SECTION background = `#404040`, canvas background = `#1e1e1e`.** Sumsub standard from the Design-Project-Template. Every SECTION you create must have fill set to `#404040` (dark grey). Never leave the default white / transparent section — it visually leaks into the white page frames and ruins the review experience.

   **Naming — always end with `(made by Claude)`** so human reviewers can find and clean up your sections. Format: `<Task name> (made by Claude)`.

   ```js
   const section = figma.createSection();
   section.name = "Domain management — self-service (made by Claude)";
   section.fills = [{ type: "SOLID", color: { r: 0x40/255, g: 0x40/255, b: 0x40/255 } }];
   // …then appendChild screens as usual
   ```

   If you're creating multiple sections on a page, all of them get `#404040` and all of them get the `(made by Claude)` suffix. The page canvas itself should be `#1e1e1e` (darker) — that's a figma.currentPage setting, not the section.

7.8. **Bind every non-zero spacing, gap, radius value to a design token — no raw numbers.**

   When you write `frame.paddingLeft = 24` or `frame.cornerRadius = 8`, you're shipping a hardcoded value. It looks fine visually but doesn't respond to DS updates, and any reviewer comparing tokens sees the number as a "break". Sumsub's convention: custom frames always bind these values to variables.

   **Spacing variables** (import via `figma.variables.importVariableByKeyAsync`, bind via `setBoundVariable`):

   | Token | Value | Variable key |
   |---|---|---|
   | `spacing/2xs` | 4px | `3d3cc3a15da0b893bf326da6053d7a1c37f1d836` |
   | `spacing/xs`  | 6px | `a4dad7f0e560345e844697b529325a2eca2ff23a` |
   | `spacing/s`   | 8px | `5a8e4573770ee8f921f141c1ab6c96835c3125a0` |
   | `spacing/m`   | 12px | `de89b1cae49981816929db80a4e795842e7baf77` |
   | `spacing/lg`  | 16px | `2b3382099953af94f32cb6ffe5c7f44c74d5fed7` |
   | `spacing/xl`  | 24px | `7dc2647090da988c17327693bc2224e2308047a2` |
   | `spacing/2xl` | 28px | `fceb37ce155723145d25d273574c665a8d7d30e6` |
   | `spacing/3xl` | 32px | `a2e089548b83ff33c8ee5e914fa24e67b889b38c` |

   **Border-radius variables:**

   | Token | Value | Variable key |
   |---|---|---|
   | `border-radius/s`  | 2px | `885152d55a536fb853461592cc3eff926e94858d` |
   | `border-radius/m`  | 4px | `311dc09093e9474a8b582c8fb7ccc7a628065a20` |
   | `border-radius/lg` | 8px | `95839af397884cd7f8fadb34a62d4763f88d68dd` |
   | `border-radius/xl` | 12px | `03884e014085a48cf26670632be200a02b5a160c` |

   **Binding pattern (use helpers or inline):**

   ```js
   // Using helpers.js (recommended)
   await bindSpacing(frame, "paddingLeft", SP_VARS.xl);   // 24px
   await bindSpacing(frame, "paddingRight", SP_VARS.xl);
   await bindSpacing(frame, "paddingTop", SP_VARS.xl);
   await bindSpacing(frame, "paddingBottom", SP_VARS.xl);
   await bindSpacing(frame, "itemSpacing", SP_VARS.lg);   // 16px
   await bindRadius(frame, RADIUS_VARS.lg);                // 8px all corners

   // Inline equivalent
   const sp24 = await figma.variables.importVariableByKeyAsync("7dc2647090da988c17327693bc2224e2308047a2");
   frame.setBoundVariable("paddingLeft", sp24);
   frame.setBoundVariable("paddingRight", sp24);
   frame.setBoundVariable("paddingTop", sp24);
   frame.setBoundVariable("paddingBottom", sp24);

   const r8 = await figma.variables.importVariableByKeyAsync("95839af397884cd7f8fadb34a62d4763f88d68dd");
   frame.setBoundVariable("topLeftRadius", r8);
   frame.setBoundVariable("topRightRadius", r8);
   frame.setBoundVariable("bottomLeftRadius", r8);
   frame.setBoundVariable("bottomRightRadius", r8);
   ```

   **Zero is zero — don't bind a variable to a 0-value spacing/radius.** `frame.paddingLeft = 0` stays as 0, no variable needed. Only non-zero values require binding.

   **Don't bind inside component instances** — DS owns its internals. Only bind on YOUR custom frames (outside any INSTANCE). Audit ignores instance internals.

   **Content-frame padding formula (memorize):** for any screen's main `Content` frame, bind:

   ```js
   await bindFrameSpacing(content, { pad: "xl", gap: "lg" });
   // equivalent:
   //   paddingLeft / Right / Top / Bottom → spacing/xl (24px in Base library)
   //   itemSpacing                        → spacing/lg (16px in Base library)
   ```

   Do not pick different tokens ad-hoc. If the target file has locally overridden `spacing/xl` or `spacing/lg` to different pixel values, that's the file's convention — don't fight it by binding to a different token. Your job is to use the correct token by name, not to hit a specific pixel value.

   Modal / Drawer body frames (`bodyComp` from the swap pattern) use the same formula.

7.9. **EVERY local main component you create — regardless of purpose — goes on the "Local components" page, inside the "Components (by Claude)" SECTION.** This is a universal rule, not a Modal-specific one. It applies to every `figma.createComponent()` call the skill makes:

   | Typical local-component use case | Example name |
   |---|---|
   | Modal Basic body slot | `Modal Body / Add domain` |
   | Drawer Basic body slot | `Drawer Body / Pending verification` |
   | Popover content | `Popover / Tooltip — Liveness check` |
   | Custom illustration wrapped as a component for reuse | `Illustration / Empty state — domains` |
   | Repeating row/card pattern made into a component (instance it on multiple screens) | `Row / SSO config`, `Card / Compliance officer` |
   | Any reusable structure you componentize for DRY | `<Any custom main component>` |

   **Never** `appendChild` a `figma.createComponent()` to `figma.currentPage` with `x = -20000`. That stacks every component at the same off-canvas point and is impossible to review — user opens the file, scrolls to find them, and sees a pile.

   Use the helpers from `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/helpers.js`:

   ```js
   const comp = figma.createComponent();
   comp.name = "<Type> / <Descriptive purpose>"; // e.g. "Card / Compliance officer"
   // …configure layout, padding, etc…

   const home = await getLocalComponentsHome(); // finds or creates:
                                                 //   Page: "Local components"
                                                 //   Section: "Components (by Claude)" (fill #404040)
   home.appendChild(comp);
   positionInHome(home, comp);                  // auto-grid, 4 cols × 600×500 cells
   ```

   If you can't use the helper (writing fully custom code), replicate the logic:
   1. Find `figma.root.children` for a PAGE whose name matches `/^local\s*components?$/i`. Create one named `Local components` if not found.
   2. On that page, find a SECTION named `Components (by Claude)`. Create one with fill `#404040` if not found.
   3. `appendChild(comp)` into that SECTION (not into the Drafts SECTION, not into currentPage).
   4. Position new components in a grid so they don't overlap existing ones.

   **Naming convention for local components:** use `<Type> / <Purpose>` format — `Modal Body / …`, `Drawer Body / …`, `Card / …`, `Illustration / …`. Makes filtering and auditing easier.

7.13. **Slot placeholder MUST be hidden after `slot.appendChild(wrap)`.** When you swap modal/drawer body via `slot.appendChild(wrap)`, the original `Slot / Basic` placeholder instance stays inside the SLOT as a SIBLING of your wrap — just invisible to you if you don't look. It renders next to your content and looks like a double body.

   Always hide it explicitly:

   ```js
   slot.appendChild(wrap);

   // Now hide ALL slot children except your wrap. Do NOT rely on
   // slot.children.find(c => c.name.includes("Slot / Basic")) —
   // the name varies by component version and may not match.
   for (const child of slot.children) {
     if (child !== wrap) child.visible = false;
   }
   ```

   Don't wrap in try/catch, don't delete the line if it throws. If `slot.children` throws, the slot reference is stale (interleaved awaits — see pre-cache-sync-only pattern above); re-fetch the slot and retry.

7.14. **Sumsub dashboard UI placement conventions — memorize and apply.** These are the Sumsub-specific layout patterns. Generic SaaS defaults ("bottom-right toast", "left drawer", etc.) are WRONG for Sumsub. Don't guess, don't ask — use the values below.

   | Component | Position | Margin | Notes |
   |---|---|---|---|
   | **Toast** | **Top-right of root** | `x = root.width - toast.width - 24`, `y = 24` | Never bottom-right. Fades up from top. Stack vertically if multiple, each +8px below the previous. |
   | **Modal Basic / Confirmation** | Centered horizontally over root | `x = (root.width - modal.width) / 2`, `y = (root.height - modal.height) / 2` | Computed AFTER body content is set (height is final). |
   | **Drawer Basic** (detail panels) | Right edge, full height | `x = root.width - drawer.width`, `y = 0`, resize to `drawer.height = root.height` | Always right side for detail drawers. Left drawers are flow-builder specific, covered in `reference/flowbuilder.md`. |
   | **Tint / scrim** | Covers entire root (sidebar included) | `x = 0`, `y = 0`, `resize(1440, 900)` | Full-frame, not just main area. |
   | **Empty State** | Centered in Content | parent Content has `primaryAxisAlignItems = "CENTER"` + `counterAxisAlignItems = "CENTER"` | Empty state instance left at layout defaults inside Content. |
   | **Loading indicator** (standalone page loader) | Centered in Content | Same centering pattern as Empty State | Not full-screen scrim. |
   | **Notifications-menu popover** | Opens from Header's bell icon | Positioned by the Header component itself | Don't position manually. |

   ```js
   // Toast — top-right
   toast.layoutPositioning = "ABSOLUTE";
   toast.x = root.width - toast.width - 24;
   toast.y = 24;
   scrimRoot.appendChild(toast);  // or root, depending on context

   // Drawer — right edge, full height
   drawer.layoutPositioning = "ABSOLUTE";
   drawer.x = root.width - drawer.width;
   drawer.y = 0;
   drawer.resize(drawer.width, root.height);

   // Modal — centered AFTER body is populated
   modal.layoutPositioning = "ABSOLUTE";
   modal.x = (root.width  - modal.width)  / 2;
   modal.y = (root.height - modal.height) / 2;
   ```

   If you catch yourself writing `y = root.height - component.height - 24` for a toast — stop, that's the generic SaaS habit, Sumsub goes top-right. If the component isn't in the table above, check `reference/layout-patterns.md` for page-type-specific positioning before improvising.

7.11. **Never use emoji as a UI icon.** Emoji like 🔐 🔒 ✉️ 📧 📄 📋 🗑️ ✏️ 📁 ⚙️ 🔍 ⚠️ ❌ ✅ ❗ ℹ️ 🏠 💬 🔗 ▶️ ⏸️ — do NOT paste these into TEXT content as a replacement for a real icon. Every icon in the mockup must be an `Icon / …` instance from the Assets library:

   ```js
   // ❌ WRONG: emoji as icon in content
   text.characters = "🔐 Okta SSO integration";
   text.characters = "✉️ User provisioning allowlist";

   // ✅ RIGHT: real icon instance + plain TEXT
   const iconComp = await figma.importComponentByKeyAsync(ICON_KEYS["normal/lock"]);
   const iconInst = iconComp.createInstance();
   row.appendChild(iconInst);
   const text = await makeText("Okta SSO integration", "regular/body-m", "textDefault");
   row.appendChild(text);
   ```

   If no icon in the Assets pack matches what you need → tell the user explicitly. Don't silently substitute with an emoji. Emojis render inconsistently across platforms and fonts, clash with the DS, and are an instant visual tell that the mockup wasn't done properly.

   **Exception:** emoji inside COMPONENT / COMPONENT SET NAMES is fine — those are DS conventions (e.g. `*Alert*` has variants `🔵 Info / 🟡 Warning / 🔴 Danger`, Scenarios has `🔷 Type=Scenario`). You don't author those; when reading them via the API, pass them through as-is.

   **Not an exception:** emoji inside TEXT content that YOU wrote. Always use a real icon.

7.12. **Modal/Drawer body wrap has ZERO internal padding — the modal's Body already pads.** The `*Modal Basic*` Body frame ships with ~48px of internal padding (L+R) and vertical padding. If you add `wrap.paddingLeft = 24` etc., you double-pad the content and it looks wrong. Keep the wrap padding-free; use `itemSpacing` for vertical gaps between children.

   ```js
   // ❌ WRONG: wrap has its own padding on top of Body's
   wrap.paddingLeft = 24;
   wrap.paddingRight = 24;
   wrap.paddingTop = 16;
   wrap.paddingBottom = 16;
   wrap.itemSpacing = 16;

   // ✅ RIGHT: only itemSpacing, no padding
   wrap.paddingLeft = 0;
   wrap.paddingRight = 0;
   wrap.paddingTop = 0;
   wrap.paddingBottom = 0;
   wrap.itemSpacing = 16;   // bound to spacing/lg
   ```

   Same rule for Drawer Basic body wraps.

7.10. **`*Sidebar*` variant must match the page context.** The default variant (`Type=Dashboard, Collapsed=False`) is only correct for the actual Dashboard page. For any product-specific page, pick the matching Type:

   | Page / task involves… | `Type` variant |
   |---|---|
   | Applicants list or applicant detail | `Applicants` |
   | Integrations / Workflow Builder / flows | `Integrations` |
   | Transaction monitoring / Travel Rule / VASP / rules | `Transaction monitoring` |
   | AML screening / watchlists | `AML screening` |
   | Case management / queues | `Case management` |
   | Client lists / blocklists | `Client lists` |
   | Statistics / reports | `Statistics` |
   | Billing | `Billing` |
   | Settings (SSO, domains, SDK translations, customization, team, etc.) | `Settings` |
   | Tasks / unreviewed | `Tasks` |
   | Admin console | `Admin` |
   | Actual Dashboard page | `Dashboard` (the default — only correct here) |

   ```js
   const sidebarSet = await figma.importComponentSetByKeyAsync(COMPONENTS.sidebar);
   // Pick variant by Type + Collapsed=False
   const variant = sidebarSet.children.find(v =>
     v.name.includes("Type=Applicants") && v.name.includes("Collapsed=False")
   ) ?? sidebarSet.defaultVariant;
   const sidebar = variant.createInstance();
   ```

   The default `Type=Dashboard` on a non-dashboard page is a visual bug — the active nav item won't match where the user is, and a reviewer will flag it immediately. Audit check 4 detects wrong variants based on Header title and screen name.

8. **Self-verify before delivering — MANDATORY, not "should run".** Before sharing any link with the user, you MUST run the audit script below via `use_figma`, with `productContext` set to match the task. The rules are:

   - Audit not run = **do not share the link**. Treat it as the build being incomplete.
   - `productContext === null` is only acceptable for generic custom pages. For Flow Builder / Applicant page / Table page tasks, `null` is a bug — set the context.
   - Audit failed = **do not share the link**. Fix every issue, re-run, keep iterating until it returns "✅ Audit PASSED".
   - Do not say "done", "готово", "макет создан", or paste a Figma URL in the same message unless the previous tool call was a passing audit.

   **Paste the audit script VERBATIM.** Do not write a "simplified version", "custom audit", or "smarter check". Do not remove checks because they produced too many findings on the first run — findings are the point. The only allowed edits to the script body are (a) set `ROOT_ID_HERE` and (b) set `productContext`. If a specific check in the script has a bug (false positives), report it to the user and keep running — do NOT silently strip the check and declare PASSED. Auditing your own work by writing a softer audit is the skill-equivalent of grading your own exam: it always passes.

   If you're tempted to think "this check is noisy, I'll skip it" — the check is what catches the bug you're about to ship. Paste the real audit.

   No audit = no delivery. Simplified audit = no delivery. No exceptions.

   ```js
   // Audit script — paste and adapt ROOT_ID
   const root = figma.getNodeById("ROOT_ID_HERE");
   const issues = [];
   const all = root.findAll(n => true);

   // Helper: component internals are not our responsibility. Skip any node
   // whose ancestor chain (between itself and root) passes through an INSTANCE.
   function isInsideInstance(n) {
     let p = n.parent;
     while (p && p !== root && p.type !== "PAGE") {
       if (p.type === "INSTANCE") return true;
       p = p.parent;
     }
     return false;
   }
   // Helper: is the node visible on canvas? (walks up checking every ancestor's visible flag)
   function isVisible(n) {
     let cur = n;
     while (cur && cur !== root) {
       if (cur.visible === false) return false;
       cur = cur.parent;
     }
     return true;
   }

   // 1. Title Row antipattern — page title MUST be in Header's Title text property.
   // Detect by SUBSTANCE, not by frame name (skill has been caught renaming "Title
   // Row" → "Actions Row" to bypass a name-based check). A page title is:
   //   TEXT node outside any component INSTANCE, with a heading-level text style
   //   (semibold/h2-3xl, h3-2xl, h4-xl, or bold/*), typically inside Content.
   const headingStyleRe = /^(semibold|bold)\/(h[0-9]-\w+)/i;
   async function getStyleName(textNode) {
     try {
       const styleId = textNode.textStyleId;
       if (!styleId || typeof styleId !== "string") return null;
       const style = await figma.getStyleByIdAsync(styleId);
       return style?.name || null;
     } catch(e) { return null; }
   }
   const titleSuspects = [];
   for (const t of all) {
     if (t.type !== "TEXT") continue;
     if (isInsideInstance(t)) continue;  // Header's own title is fine
     const styleName = await getStyleName(t);
     if (!styleName || !headingStyleRe.test(styleName)) continue;
     // Skip TEXT nodes that are inside a SECTION directly (section title, allowed)
     let p = t.parent, insideSection = false;
     while (p && p !== root) {
       if (p.type === "SECTION") { insideSection = true; break; }
       p = p.parent;
     }
     if (insideSection && t.parent?.type === "SECTION") continue;
     titleSuspects.push({ text: t.characters?.slice(0, 60), style: styleName, parent: t.parent?.name });
   }
   if (titleSuspects.length) {
     issues.push(`${titleSuspects.length} heading-level TEXT node(s) outside *Header*. Page title must live in *Header* 'Title text#3817:0'. Renaming the wrapping frame does NOT fix this — delete the text and set the Header property instead. Samples: ${titleSuspects.slice(0, 3).map(s => `"${s.text}" (${s.style}) in "${s.parent}"`).join(" | ")}`);
   }

   // 2. Placeholder text in *Header* properties
   const placeholderPhrases = [
     "Life was like a box of chocolates",
     "Hey, what's up, dude",
     "Hi, I'm sabtitle",
     "Page title",        // default header title
     "Label",              // default input label
     "Placeholder",        // default field placeholder
     "Filled text",        // default field filled
     "Caption text",
     "Text in cell",
     "Tab_1", "Tab_2", "Tab_3",
   ];
   const headerInst = root.findOne(n =>
     n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Header*"
   );
   if (headerInst) {
     for (const [key, val] of Object.entries(headerInst.componentProperties)) {
       if (val.type !== "TEXT") continue;
       if (placeholderPhrases.some(p => val.value?.includes(p))) {
         issues.push(`Header property '${key}' still has placeholder: "${val.value}"`);
       }
     }
   }

   // 3. Double-tabs — *Tab Basic* outside Header when Header.Subheader=Tabs
   if (headerInst) {
     const headerHasTabs = !!headerInst.findOne(n =>
       n.type === "INSTANCE" && /Type=Tabs/.test(n.mainComponent?.name || "")
     );
     const standaloneTabs = all.filter(n =>
       n.type === "INSTANCE" && n.name === "*Tab Basic*" &&
       !headerInst.findAll(x => x === n).length
     );
     if (headerHasTabs && standaloneTabs.length) {
       issues.push(`Double tabs: Header has Subheader=Tabs AND ${standaloneTabs.length} standalone *Tab Basic* below — keep only one`);
     }
   }

   // 4. Sidebar variant — match against task context. We can infer the expected
   // Type from the Header's Title text or the screen name.
   const sidebar = root.findOne(n =>
     n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Sidebar*"
   );
   const infos = [];
   if (sidebar) {
     const variantName = sidebar.mainComponent.name;
     const typeMatch = variantName.match(/Type=([^,]+)/);
     const sidebarType = typeMatch ? typeMatch[1].trim() : null;

     // Gather hints about page context: Header title + screen name
     const hdr = root.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Header*");
     const hdrTitle = hdr?.componentProperties?.["Title text#3817:0"]?.value || "";
     const ctx = (hdrTitle + " " + root.name).toLowerCase();

     // Map keywords → expected Sidebar Type variant
     const sidebarMap = [
       { kw: /applicant/,                       expected: "Applicants" },
       { kw: /integration|workflow|flow builder/, expected: "Integrations" },
       { kw: /transaction|travel rule|vasp/,    expected: "Transaction monitoring" },
       { kw: /aml|screening/,                   expected: "AML screening" },
       { kw: /case management|case /,            expected: "Case management" },
       { kw: /client list/,                     expected: "Client lists" },
       { kw: /statistic|report/,                expected: "Statistics" },
       { kw: /billing/,                         expected: "Billing" },
       { kw: /setting|domain|sso|translation|customization|sdk translation/, expected: "Settings" },
       { kw: /dev ?space/,                      expected: "Dev space" },
       { kw: /task/,                             expected: "Tasks" },
       { kw: /admin/,                            expected: "Admin" },
     ];
     let expected = null;
     for (const m of sidebarMap) if (m.kw.test(ctx)) { expected = m.expected; break; }

     if (expected && sidebarType && sidebarType !== expected) {
       issues.push(`Sidebar variant is "Type=${sidebarType}", but the page context (title "${hdrTitle}") suggests "Type=${expected}". Rebind: sidebarSet.children.find(v => v.name.includes("Type=${expected}") && v.name.includes("Collapsed=False")).createInstance().`);
     } else {
       infos.push(`[info] Sidebar variant: "${variantName}"${expected ? ` (expected Type=${expected} — matches)` : " (no context-based expectation)"}`);
     }
   }

   // 5. Overflow — any node extending beyond its parent's bounds
   // Skip everything inside component instances: DS owns its internals.
   // SECTION nodes don't have clipsContent property — skip as parent.
   for (const n of all) {
     if (n.type === "PAGE" || !n.parent) continue;
     if (isInsideInstance(n)) continue;
     const p = n.parent;
     if (p.type === "SECTION") continue;
     if (!("width" in p) || !("clipsContent" in p) || p.clipsContent === false) continue;
     if (n.x + n.width > p.width + 0.5) issues.push(`Overflow right: ${n.name} in ${p.name}`);
     if (n.y + n.height > p.height + 0.5) issues.push(`Overflow bottom: ${n.name} in ${p.name}`);
   }

   // 6. Component-vs-FRAME ratio (custom frames that could have been DS components).
   // Count only top-level frames — component internals don't count toward "invented structure".
   const topLevelNodes = all.filter(n => !isInsideInstance(n));
   const totalStructural = topLevelNodes.filter(n => n.type === "FRAME" || n.type === "INSTANCE").length;
   const customFrames = topLevelNodes.filter(n =>
     n.type === "FRAME" && !["Main","Content","Item List","row"].includes(n.name)
   ).length;
   const customRatio = totalStructural > 0 ? customFrames / totalStructural : 0;
   if (customRatio > 0.5 && totalStructural > 10) {
     issues.push(`Custom FRAME ratio ${(customRatio*100).toFixed(0)}% > 50% — likely invented structure instead of using DS components`);
   }

   // 7. Unbound spacing / cornerRadius / fills on YOUR custom frames.
   // Skip anything inside a component instance — DS owns its own tokens.
   // Skip only "Main" (the outer column under Header that has no padding
   // and no fill by design). "Content" is checked — it SHOULD have bound
   // paddings per Rule 7.8.
   for (const n of all) {
     if (n.type !== "FRAME") continue;
     if (isInsideInstance(n)) continue;
     if (n.name === "Main") continue;
     if (n.cornerRadius > 0 && !n.boundVariables?.topLeftRadius) {
       issues.push(`Unbound cornerRadius on ${n.name}: ${n.cornerRadius}px`);
     }
     if (n.fills?.[0]?.type === "SOLID" && !n.fills[0].boundVariables?.color) {
       issues.push(`Hardcoded fill on ${n.name}`);
     }
   }

   // 7.05. Content frame background — Rule #6. Content MUST be white.
   // If Content has no fill, the root subtlest-grey shows through and the page
   // looks fully grey. Find top-level frames named "Content" / "Page Content" and
   // verify they're bound to a white/inverse variable.
   const contentFrames = all.filter(n =>
     n.type === "FRAME" && !isInsideInstance(n) && /^(Content|Page Content)$/i.test(n.name)
   );
   for (const cf of contentFrames) {
     const fill = cf.fills?.[0];
     if (!fill || fill.visible === false) {
       issues.push(`Content frame "${cf.name}" has no fill — set it to semantic/background/neutral/inverse/normal (white). Otherwise page looks grey.`);
       continue;
     }
     if (fill.type !== "SOLID") continue;
     const isWhite = fill.color.r > 0.98 && fill.color.g > 0.98 && fill.color.b > 0.98;
     const boundVarId = cf.boundVariables?.fills?.[0]?.id;
     let boundName = "";
     if (boundVarId) {
       try { boundName = figma.variables.getVariableById(boundVarId)?.name || ""; } catch(e) {}
     }
     if (!isWhite) {
       issues.push(`Content frame "${cf.name}" is not white (fill hex approx non-white) — bind to semantic/background/neutral/inverse/normal`);
     } else if (boundName && /subtlest|subtler|subtle/.test(boundName)) {
       issues.push(`Content frame "${cf.name}" bound to "${boundName}" (grey variant) — should be inverse/normal (white)`);
     }
   }

   // 7.1. Default component-property placeholder text — check only VISIBLE nodes.
   // Components like *Filters group* ship with many HIDDEN spare slots (unused
   // filter types) that keep their "Label" default — those are not bugs. Only
   // visible placeholders matter. Rule #7 (fill realistic data) applies to
   // what the user sees on canvas.
   const defaultTexts = [
     "Label", "Placeholder", "Button", "Text in cell", "Table cell",
     "Subheader text", "Caption text", "Page title",
   ];
   // Default phrases that appear as substrings in component texts (Alert, Toast,
   // Header, Modal, Drawer). These are THE Dirty-Harry-quote filler copy and
   // similar, shipped as component defaults. If you see them in a delivered
   // mockup, the component wasn't customized.
   const defaultPhrases = [
     "Life was like a box of chocolates",
     "Hey, what's up, dude",
     "Hi, I'm sabtitle",
     "It's modal basic",
     "You've got to ask yourself one question",
     "Do I feel lucky",
     "Well, do you, punk",
     "You're gonna need a bigger boat",
     "I'll be back",
     "May the Force be with you",
   ];
   const defaultTextCounts = {};
   const defaultPhraseHits = {};
   for (const n of all) {
     if (n.type !== "TEXT") continue;
     if (!n.characters) continue;
     if (!isVisible(n)) continue; // skip hidden component slots
     // Exact match (default property values like "Label", "Button")
     if (defaultTexts.includes(n.characters)) {
       defaultTextCounts[n.characters] = (defaultTextCounts[n.characters] || 0) + 1;
     }
     // Substring match (Dirty-Harry-style component filler copy)
     for (const phrase of defaultPhrases) {
       if (n.characters.includes(phrase)) {
         defaultPhraseHits[phrase] = (defaultPhraseHits[phrase] || 0) + 1;
         break;
       }
     }
   }
   for (const [txt, count] of Object.entries(defaultTextCounts)) {
     issues.push(`${count} VISIBLE TEXT node(s) with default value "${txt}" — Rule #7: set real content via setProperties or setInstanceText`);
   }
   for (const [phrase, count] of Object.entries(defaultPhraseHits)) {
     issues.push(`${count} VISIBLE TEXT node(s) containing default filler "${phrase}…" — replace Alert/Toast/Modal title/description via setProperties on the component's TEXT property`);
   }

   // 7.12. Target page — Rule #0. Root must live on a "Drafts" page unless
   // the user explicitly pointed to another page. Walks up to find the PAGE.
   {
     let p = root.parent;
     while (p && p.type !== "PAGE") p = p.parent;
     if (p && p.type === "PAGE" && !/drafts/i.test(p.name)) {
       issues.push(`Root is on page "${p.name}" — expected a page with "Drafts" in its name (Rule #0). If the user didn't specify another page, move to the Drafts page or create one.`);
     }
   }

   // 7.15. SECTION background + naming check — Rules 7.7. If root is inside a
   // SECTION, verify (a) fill = #404040 and (b) name ends with "(made by Claude)".
   {
     let anc = root.parent;
     while (anc && anc.type !== "PAGE") {
       if (anc.type === "SECTION") {
         // Fill check
         const f = anc.fills?.[0];
         const is404040 = f && f.type === "SOLID" &&
           Math.abs(f.color.r - 0x40/255) < 0.01 &&
           Math.abs(f.color.g - 0x40/255) < 0.01 &&
           Math.abs(f.color.b - 0x40/255) < 0.01;
         if (!f || f.visible === false) {
           issues.push(`SECTION "${anc.name}" has no fill — set fills to [{type:"SOLID",color:{r:0x40/255,g:0x40/255,b:0x40/255}}] per Rule 7.7`);
         } else if (!is404040) {
           const hex = f.type === "SOLID" ? "#" + [f.color.r,f.color.g,f.color.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("") : f.type;
           issues.push(`SECTION "${anc.name}" fill is ${hex}, expected #404040 (Rule 7.7)`);
         }
         // Naming check — must end with "(made by Claude)"
         if (!/\(made by Claude\)\s*$/.test(anc.name)) {
           issues.push(`SECTION "${anc.name}" missing "(made by Claude)" suffix — rename per Rule 7.7`);
         }
         break;
       }
       anc = anc.parent;
     }
   }

   // 7.16. Spacing / border-radius token binding — Rule 7.8.
   // Every non-zero paddingLeft/Right/Top/Bottom, itemSpacing and cornerRadius
   // on a custom FRAME (outside instances) must be bound to a design-token variable.
   // Zero values don't need binding.
   const spacingProps = ["paddingLeft","paddingRight","paddingTop","paddingBottom","itemSpacing"];
   const radiusProps = ["topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius"];
   const unboundBy = {}; // aggregate by frame to avoid spam
   for (const n of all) {
     if (n.type !== "FRAME") continue;
     if (isInsideInstance(n)) continue;
     if (n.name === "Main") continue;   // outer column, no padding by design
     // Spacing props
     for (const prop of spacingProps) {
       const val = n[prop];
       if (typeof val !== "number" || val === 0) continue;
       const bound = n.boundVariables?.[prop];
       if (!bound) {
         unboundBy[n.name] = unboundBy[n.name] || { spacing: [], radius: [] };
         unboundBy[n.name].spacing.push(`${prop}=${val}px`);
       }
     }
     // Radius props (each corner)
     for (const prop of radiusProps) {
       const val = n[prop];
       if (typeof val !== "number" || val === 0) continue;
       const bound = n.boundVariables?.[prop];
       if (!bound) {
         unboundBy[n.name] = unboundBy[n.name] || { spacing: [], radius: [] };
         unboundBy[n.name].radius.push(`${prop}=${val}px`);
       }
     }
   }
   const unboundFrameCount = Object.keys(unboundBy).length;
   if (unboundFrameCount > 0) {
     // Show up to 5 sample frames, compact
     const samples = Object.entries(unboundBy).slice(0, 5).map(([name, v]) => {
       const parts = [];
       if (v.spacing.length) parts.push(`spacing[${v.spacing.join(", ")}]`);
       if (v.radius.length) parts.push(`radius[${v.radius.join(", ")}]`);
       return `${name}: ${parts.join(" ")}`;
     }).join(" | ");
     issues.push(`${unboundFrameCount} custom FRAME(s) with unbound spacing/radius values (Rule 7.8). Sample: ${samples}${unboundFrameCount > 5 ? " …" : ""}. Bind to spacing/* and border-radius/* variables via setBoundVariable.`);
   }

   // 7.18. Modal/Drawer internal header defaults — catch "Hey, what's up, dude?",
   // "Hi, I'm sabtitle", literal "Title"/"Description" that ship as defaults on the
   // inner Header component. These are DIFFERENT from the page *Header* placeholder
   // check in step 2 — modal/drawer headers use different property keys and are
   // inside a separate subtree.
   const modalDrawerInternalDefaults = [
     "Hey, what's up, dude",
     "Hi, I'm sabtitle",
     "It's modal basic",
   ];
   // Also flag literal "Title" / "Description" as value ONLY when they appear
   // inside a modal/drawer header (too generic to flag globally).
   const exactDefaultsInModalHeader = ["Title", "Description", "Subtitle"];
   const modalsAndDrawers = all.filter(n =>
     n.type === "INSTANCE" && (
       n.mainComponent?.parent?.name === "*Modal Basic*" ||
       n.mainComponent?.parent?.name === "*Drawer Basic*"
     )
   );
   for (const md of modalsAndDrawers) {
     const hdr = md.findOne(n => n.type === "INSTANCE" && /\/ Header/i.test(n.name));
     if (!hdr) continue;
     for (const [key, prop] of Object.entries(hdr.componentProperties || {})) {
       if (prop.type !== "TEXT") continue;
       const v = prop.value || "";
       if (modalDrawerInternalDefaults.some(p => v.includes(p))) {
         issues.push(`${md.mainComponent.parent.name} "${md.name}" — internal Header '${key}' still default: "${v}". Call setProperties on the / Header sub-instance to replace.`);
       } else if (exactDefaultsInModalHeader.includes(v)) {
         issues.push(`${md.mainComponent.parent.name} "${md.name}" — internal Header '${key}' is literal default "${v}". Replace with real content.`);
       }
     }
   }

   // 7.17. Content-frame padding PIXEL values — not just bindings.
   // Rule 7.8 requires bindings, but a binding to a token that resolves to
   // an out-of-range value in this file (e.g., file-local override of
   // spacing/xl to 20px when the Base library value is 24px) still looks
   // broken. Verify the rendered value falls within Sumsub's expected
   // range for Content areas:
   //   padding L/R  ∈ [24, 32]   — spacing/xl (24) to spacing/3xl (32)
   //   padding T/B  ∈ [16, 24]   — spacing/lg (16) to spacing/xl (24)
   //   itemSpacing  ∈ [8, 24]    — spacing/s (8) to spacing/xl (24)
   const contentFramesToAudit = all.filter(n =>
     n.type === "FRAME" && !isInsideInstance(n) && /^(Content|BG Content|Page Content|Body)$/i.test(n.name)
   );
   for (const cf of contentFramesToAudit) {
     const lr = [cf.paddingLeft, cf.paddingRight];
     const tb = [cf.paddingTop, cf.paddingBottom];
     const gap = cf.itemSpacing;
     for (const [side, val] of [["paddingLeft", lr[0]], ["paddingRight", lr[1]]]) {
       if (typeof val === "number" && val > 0 && (val < 24 || val > 32)) {
         issues.push(`Content-type frame "${cf.name}" ${side} = ${val}px, out of expected range [24, 32] (Rule 7.8 formula). Rebind to spacing/xl or spacing/3xl, or verify file's token values.`);
       }
     }
     for (const [side, val] of [["paddingTop", tb[0]], ["paddingBottom", tb[1]]]) {
       if (typeof val === "number" && val > 0 && (val < 16 || val > 24)) {
         issues.push(`Content-type frame "${cf.name}" ${side} = ${val}px, out of expected range [16, 24]. Rebind to spacing/lg or spacing/xl.`);
       }
     }
     if (typeof gap === "number" && gap > 0 && (gap < 8 || gap > 24)) {
       issues.push(`Content-type frame "${cf.name}" itemSpacing = ${gap}px, out of expected range [8, 24]. Rebind to spacing/s..spacing/xl.`);
     }
   }

   // 7.19. Orphan local COMPONENTs — Rule 7.9. Any figma.createComponent() the
   // skill produces must live on a "Local components" page inside the
   // "Components (by Claude)" SECTION. Scan all pages for COMPONENT nodes not
   // housed correctly.
   {
     const orphans = [];
     for (const page of figma.root.children) {
       // Skip the official home page
       if (/^local\s*components?$/i.test(page.name)) continue;
       for (const n of page.children) {
         if (n.type !== "COMPONENT") continue;
         // Direct child of a non-"Local components" page = orphan
         orphans.push(`"${n.name}" on page "${page.name}"`);
       }
       // Also check components hanging loose in sections on this page
       for (const sec of page.children.filter(c => c.type === "SECTION")) {
         for (const n of sec.children) {
           if (n.type === "COMPONENT") {
             orphans.push(`"${n.name}" in section "${sec.name}" on page "${page.name}"`);
           }
         }
       }
     }
     if (orphans.length > 0) {
       issues.push(`${orphans.length} local COMPONENT(s) outside "Local components" page (Rule 7.9): ${orphans.slice(0, 3).join(", ")}${orphans.length > 3 ? "…" : ""}. Move via getLocalComponentsHome() helper.`);
     }
     // Also check: on "Local components" page, components should be inside the
     // "Components (by Claude)" SECTION, not bare on the page.
     const homePage = figma.root.children.find(p => /^local\s*components?$/i.test(p.name));
     if (homePage) {
       const bareOnHome = homePage.children.filter(n => n.type === "COMPONENT");
       if (bareOnHome.length > 0) {
         issues.push(`${bareOnHome.length} COMPONENT(s) on "Local components" page not inside the "Components (by Claude)" SECTION — appendChild them to the section.`);
       }
     }
   }

   // 7.22. Content frame clipsContent hack + extreme undersize.
   // Caught in Domain Mgmt Verified Success (140:15666): Content had
   // clipsContent=false AND height=16px. Skill disabled clipping as a
   // workaround for a Table Starter overflow — hiding symptom, not cause.
   // Real fix is row.visible=false on unused table rows.
   for (const n of all) {
     if (n.type !== "FRAME") continue;
     if (isInsideInstance(n)) continue;
     if (!/^(Content|BG Content|Page Content)$/i.test(n.name)) continue;
     if (n.clipsContent === false && n.children.length > 0) {
       issues.push(`Content frame "${n.name}" has clipsContent=false — this masks overflow instead of fixing it. Check if table/drawer inside is sized beyond content, and hide unused rows via row.visible=false or resize properly.`);
     }
     if (n.layoutMode && n.height < 40 && n.children.length > 0) {
       issues.push(`Content frame "${n.name}" auto-layout collapsed to ${Math.round(n.height)}px. Check layoutSizing on children and the frame itself — likely missing FILL vertical sizing.`);
     }
   }

   // 7.23. Table Starter — unused rows not hidden + "Table header" defaults.
   // Skill often creates a Table Starter (10 rows by default) and populates
   // only a few. Leaving the rest visible with blank cells (or worse, the
   // default "Table cell"/"Table header" DS text) is Rule #7 violation AND
   // creates overflow. The correct path: hide unused rows via row.visible=false.
   for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
     const rows = tbl.children.filter(c => c.name === "Table Row");
     const visibleRows = rows.filter(r => r.visible);
     // Detect if all rows are visible (default state — almost always wrong)
     if (visibleRows.length === rows.length && rows.length >= 10) {
       issues.push(`Table Starter "${tbl.name}" has all ${rows.length} default rows visible. Real tables rarely need 10 rows — set unused rows to row.visible=false to avoid overflow and blank-cell defaults.`);
     }
     // Detect default "Table header" on header cells
     const tblHeader = tbl.children.find(c => c.name === "Table Header");
     if (tblHeader) {
       const defaultCount = tblHeader.findAll(t => t.type === "TEXT" && t.characters === "Table header").length;
       if (defaultCount > 0) {
         issues.push(`Table Starter "${tbl.name}" has ${defaultCount} "Table header" default labels in the header row. Set column labels via setProperties({"Header name#…": "Domain" / "Status" / ...}) on each header cell instance, NOT by direct .characters edit.`);
       }
     }
   }

   // 7.23b. Data rows not populated — ALL visible rows show identical default content.
   // Caught in Domain Mgmt Verified Success (140:15666): 10 visible rows each with
   // ∅ + "3:17 PM (GMT+4)" + "Status" + "Label" + "Show more" + "5" — the cell's
   // Type wasn't set so every optional sub-component renders at once.
   const rowDefaultSignals = /^(Label|Status|Show more|Checkbox)$/;
   const timeDefault = /^\d{1,2}:\d{2}\s?(AM|PM)/;
   for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
     const dataRows = tbl.children.filter(c => c.name === "Table Row" && c.visible);
     if (dataRows.length === 0) continue;
     let unconfiguredRows = 0;
     for (const row of dataRows) {
       const texts = row.findAll(t => t.type === "TEXT" && t.visible !== false && t.characters);
       const defaultHits = texts.filter(t =>
         rowDefaultSignals.test(t.characters) || timeDefault.test(t.characters)
       ).length;
       // A populated row typically has 0-1 matches (maybe one Status label that
       // says literal "Status" legitimately). 3+ matches means cells are unset.
       if (defaultHits >= 3) unconfiguredRows++;
     }
     if (unconfiguredRows === dataRows.length && dataRows.length > 0) {
       issues.push(`Table Starter "${tbl.name}" — all ${dataRows.length} visible rows show default cell content (Status / Label / Show more / time placeholder all rendered at once). Cells' "Type" property wasn't set. Iterate rows and call setProperties({Type: "Text Regular", "  ↪ Text in cell#14615:0": ...}) per cell, or hide the row.`);
     } else if (unconfiguredRows > 0) {
       issues.push(`Table Starter "${tbl.name}" — ${unconfiguredRows}/${dataRows.length} rows unconfigured (default cell content visible). Populate via setProperties on each cell or hide the rows.`);
     }
   }

   // 7.24. Direct TEXT modification inside DS component instances.
   // Blanking default text via `text.characters = ""` leaves 50+ empty TEXT
   // nodes on canvas — visible as hollow cells. Proper DS usage: setProperties
   // on the cell instance to change "Type" (hides text sub-nodes) or
   // row.visible=false.
   // (This check is approximate — counts empty TEXT nodes inside Table Starter
   // instances; legitimate empty cells exist, so fires only when count is high.)
   for (const tbl of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Table Starter*")) {
     const emptyTexts = tbl.findAll(n => n.type === "TEXT" && (!n.characters || n.characters === "") && n.visible !== false);
     if (emptyTexts.length > 30) {
       issues.push(`Table Starter "${tbl.name}" has ${emptyTexts.length} empty/blank visible TEXT nodes — looks like direct .characters="" overrides instead of hiding rows or using setProperties. Prefer row.visible=false on unused rows and setProperties on cells.`);
     }
   }

   // 7.26. UI-emoji in TEXT content (Rule 7.11).
   // Catches emojis used as fake icons inside user-authored TEXT. Allows emoji
   // inside component instances (DS variant names / annotation props legitimately
   // use them). Only flags TEXT outside any INSTANCE.
   const uiIconEmojis = /[\u{1F510}-\u{1F512}\u{1F4E7}\u{2709}\u{1F4C4}\u{1F4CB}\u{1F4D1}\u{1F5D1}\u{270F}\u{1F4C1}\u{2699}\u{1F50D}\u{26A0}\u{274C}\u{2705}\u{2757}\u{2139}\u{1F3E0}\u{1F4AC}\u{1F517}\u{25B6}\u{23F8}\u{25C0}\u{1F512}\u{1F513}]/u;
   const emojiHits = [];
   for (const n of all) {
     if (n.type !== "TEXT") continue;
     if (isInsideInstance(n)) continue;
     if (!isVisible(n)) continue;
     if (!n.characters) continue;
     if (uiIconEmojis.test(n.characters)) {
       emojiHits.push(n.characters.slice(0, 80));
     }
   }
   if (emojiHits.length) {
     issues.push(`${emojiHits.length} TEXT node(s) contain UI-icon emoji (🔐, ✉️, 📄, etc.). Rule 7.11: replace with Icon / * component instance from Assets library. Samples: ${emojiHits.slice(0, 3).map(s => `"${s}"`).join(" | ")}`);
   }

   // 7.29. Toast position must be top-right of root (Rule 7.14).
   // Generic SaaS habit is bottom-right; Sumsub is top-right.
   // Expected: x ≈ root.width - toast.width - 24, y ≈ 24.
   for (const toast of all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Toast*")) {
     // Only check top-level absolute-positioned toasts (not inside instances)
     if (isInsideInstance(toast)) continue;
     const parent = toast.parent;
     if (!parent || typeof parent.width !== "number") continue;
     const expectedX = parent.width - toast.width - 24;
     const expectedY = 24;
     const dx = Math.abs(toast.x - expectedX);
     const dy = Math.abs(toast.y - expectedY);
     // Tolerate small offsets (±16px) for stacked toasts
     if (dx > 32 || dy > 32) {
       // Check specifically if bottom-right pattern (common mistake)
       const isBottomRight = toast.x > parent.width / 2 && toast.y > parent.height / 2;
       if (isBottomRight) {
         issues.push(`Toast "${toast.name}" is bottom-right (x=${Math.round(toast.x)}, y=${Math.round(toast.y)}). Sumsub convention is top-right — set x = ${expectedX}, y = ${expectedY} (Rule 7.14).`);
       } else {
         issues.push(`Toast "${toast.name}" position (x=${Math.round(toast.x)}, y=${Math.round(toast.y)}) doesn't match top-right convention. Expected x≈${Math.round(expectedX)}, y≈${expectedY} (Rule 7.14).`);
       }
     }
   }

   // 7.28. Slot placeholder state — two failure modes.
   for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
     const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
     if (!body) continue;
     const slot = body.children?.find(c => c.type === "SLOT");
     if (!slot) continue;
     const visibleSlotKids = (slot.children || []).filter(c => c.visible);

     // (a) Double body — more than one visible child, placeholder wasn't hidden.
     if (visibleSlotKids.length > 1) {
       const names = visibleSlotKids.map(c => c.name).join(", ");
       issues.push(`Modal/Drawer "${md.name}" SLOT has ${visibleSlotKids.length} visible children [${names}]. Default placeholder wasn't hidden. Iterate slot.children and .visible=false every non-wrap sibling.`);
     }

     // (b) Empty modal — the ONLY visible child is the default placeholder
     // (Slot / Basic INSTANCE), no custom wrap was appended. Means slot.appendChild(wrap)
     // silently failed — usually because it was wrapped in try/catch (Rule #8 ban) or
     // because the wrap construction threw before the append call.
     if (visibleSlotKids.length === 1) {
       const only = visibleSlotKids[0];
       const isDefaultPlaceholder =
         (only.type === "INSTANCE" && /slot\s*\/\s*basic/i.test(only.name)) ||
         /^Slot \/ /i.test(only.name);
       if (isDefaultPlaceholder) {
         issues.push(`Modal/Drawer "${md.name}" has an EMPTY body — only the default "${only.name}" placeholder is visible, no custom wrap was appended. The body swap silently failed. Check for a try/catch around slot.appendChild (banned by Rule #8) or an earlier exception during wrap construction. Modal height is likely stuck at default (~228px for Size=Small empty).`);
       }
     }

     // (c) Suspicious modal height — matches default-empty heights closely.
     //     Default empties: Small=228h, Medium=240h-ish, Large=similar low value.
     //     If modal.height < 260 AND slot has only placeholder, definitely empty.
     if (md.height < 260 && visibleSlotKids.length <= 1 && visibleSlotKids.every(k => /slot\s*\/\s*basic/i.test(k.name || ""))) {
       issues.push(`Modal/Drawer "${md.name}" height ${Math.round(md.height)}px — suspiciously close to default-empty. Verify body content was actually appended (not swallowed by try/catch).`);
     }
   }

   // 7.27. Modal/Drawer body wrap has internal padding (Rule 7.12).
   // The Body frame inside *Modal Basic* / *Drawer Basic* already pads its
   // content. A wrap FRAME inside the SLOT should only use itemSpacing.
   for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
     const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
     if (!body) continue;
     const slot = body.children?.find(c => c.type === "SLOT");
     if (!slot) continue;
     for (const wrap of slot.children || []) {
       if (!wrap.visible) continue;
       if (wrap.type !== "FRAME" && wrap.type !== "COMPONENT") continue;
       const pads = [wrap.paddingLeft, wrap.paddingRight, wrap.paddingTop, wrap.paddingBottom];
       const nonZero = pads.filter(p => typeof p === "number" && p > 0);
       if (nonZero.length > 0) {
         issues.push(`Modal/Drawer body wrap "${wrap.name}" has internal padding (L=${wrap.paddingLeft}, R=${wrap.paddingRight}, T=${wrap.paddingTop}, B=${wrap.paddingBottom}) — Rule 7.12: remove all paddings, the Body frame already pads. Keep only itemSpacing for vertical gaps.`);
       }
     }
   }

   // 7.25. Modal/Drawer body wrap WIDTH overflow.
   // Common failure: skill creates a wrap FRAME via figma.createFrame() with
   // `resize(modal.width, …)` then appendChild into the SLOT. But the slot's
   // usable width is modal.width - body padding (typically ~48px). Result:
   // wrap is 720px in a 672px slot, overflows by ~48px on the right, content
   // gets clipped. The general overflow check misses it because SLOT nodes
   // have their own geometry.
   {
     const modalsForOverflow = all.filter(n =>
       n.type === "INSTANCE" && (
         n.mainComponent?.parent?.name === "*Modal Basic*" ||
         n.mainComponent?.parent?.name === "*Drawer Basic*"
       )
     );
     for (const m of modalsForOverflow) {
       const body = m.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
       if (!body) continue;
       const slot = body.children?.find(c => c.type === "SLOT");
       if (!slot) continue;
       for (const child of slot.children || []) {
         if (!child.visible) continue;
         if (child.width > slot.width + 0.5) {
           issues.push(`Modal/Drawer body wrap "${child.name}" is ${Math.round(child.width)}px wide inside a ${Math.round(slot.width)}px SLOT (modal ${Math.round(m.width)}px). Resize to slot.width: wrap.resize(slot.width, wrap.height) — NOT modal.width, which ignores the Body's ~48px internal padding.`);
         }
       }
     }
   }

   // 7.2. Modal / Drawer — empty Body + vertical centering + fake-modal detection.
   // SLOT properties on Modal Basic / Drawer Basic are READ-ONLY in the Plugin API
   // (figma throws "Slot component property values cannot be edited"). Correct
   // path is to appendChild into the instance's Body FRAME directly.
   const modals = all.filter(n =>
     n.type === "INSTANCE" && (
       n.mainComponent?.parent?.name === "*Modal Basic*" ||
       n.mainComponent?.parent?.name === "*Drawer Basic*"
     )
   );
   for (const m of modals) {
     // Empty Body check — Body frame should have children (the content you added)
     const bodyFrame = m.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
     if (bodyFrame && bodyFrame.children.length === 0) {
       issues.push(`Modal/Drawer "${m.name}" — Body frame is empty. appendChild your content into modal.children.find(c=>c.name.trim()==="Body"). SLOT via setProperties is read-only and will throw.`);
     }
     // Vertical centering check
     const parent = m.parent;
     if (parent && typeof parent.height === "number" && parent.height > 0 && m.layoutPositioning === "ABSOLUTE") {
       const modalCenter = m.y + m.height / 2;
       const parentCenter = parent.height / 2;
       const off = Math.abs(modalCenter - parentCenter);
       if (off > 40) {
         issues.push(`Modal/Drawer "${m.name}" not vertically centered in "${parent.name}" (off by ${Math.round(off)}px). Compute y AFTER body is populated: modal.y = (parent.height - modal.height) / 2`);
       }
     }
   }

   // 7.3. Fabrication detector — custom FRAMEs that should be DS component instances.
   // Pattern: name starts with "Modal · …", "Drawer · …", "Annotation · …",
   // "Empty State", "Table · …", "Toolbar · …", "Scenario · …" → fake.
   const fabricationPatterns = [
     { re: /^Modal\s*[·\/]/i,      fix: "Use *Modal Basic* instance + Body frame appendChild" },
     { re: /^Drawer\s*[·\/]/i,     fix: "Use *Drawer Basic* instance + Body frame appendChild" },
     { re: /^Popover\s*[·\/]/i,    fix: "Use *Popover* instance" },
     { re: /^Annotation\s*[·\/]/i, fix: "Use Scenarios annotation component (key b5cdb94a14e3e6cd513db397cbd5d1391327896f, Type=Scenario)" },
     { re: /^Scenario\s*[·\/]/i,   fix: "Use Scenarios annotation component (key b5cdb94a14e3e6cd513db397cbd5d1391327896f)" },
     { re: /^Table\s*[·\/]/i,      fix: "Use *Table Starter* instance (key 213b7e3d7cc4503bbab83cd6c249e41e06dae295)" },
     { re: /^Toolbar\s*[·\/]/i,    fix: "Use Top Toolbar instance (key fa8defc5fadd20a84c812784786217c6e0003ca0)" },
     { re: /^Empty\s*State\s*[·\/]?/i, fix: "Use *Empty State* instance (key 0b0b611dba138a4a822b216114888d96513d248a)" },
     { re: /^Alert\s*[·\/]/i,      fix: "Use *Alert* instance (key 6d834b2f2da31f8a505379dcf26283d0be873609)" },
     { re: /^Filter\s*[·\/]/i,     fix: "Use *Filter* / *Filters group* instance" },
     { re: /^Status\s*[·\/]/i,     fix: "Use *Status* instance" },
   ];
   const fakes = {};
   for (const n of all) {
     if (n.type !== "FRAME") continue;
     if (isInsideInstance(n)) continue;
     for (const p of fabricationPatterns) {
       if (p.re.test(n.name)) {
         fakes[p.fix] = (fakes[p.fix] || 0) + 1;
         break;
       }
     }
   }
   for (const [fix, count] of Object.entries(fakes)) {
     issues.push(`${count} custom FRAME(s) found that should be DS component instances. Fix: ${fix}`);
   }

   // 7.4. Annotation presence — if task involves annotations, they must be the real
   // Scenarios component, not custom FRAMEs named "Annotation · …" (caught by 7.3).
   // Also detect the DS Scenarios component for a sanity count.
   const realScenarios = all.filter(n =>
     n.type === "INSTANCE" && /Scenario/i.test(n.mainComponent?.parent?.name || "")
   );
   const fakeAnnotations = all.filter(n =>
     n.type === "FRAME" && !isInsideInstance(n) && /^Annotation\s*[·\/]/i.test(n.name)
   );
   if (fakeAnnotations.length > 0 && realScenarios.length === 0) {
     issues.push(`${fakeAnnotations.length} custom "Annotation · …" FRAME(s) found, zero real Scenarios instances. Use component key b5cdb94a14e3e6cd513db397cbd5d1391327896f with Type=Scenario variant.`);
   }

   // 8. Product-required components (fabrication check)
   // For product-specific mockups, these top-level pieces MUST be real component instances, not custom FRAMEs.
   // Detect product based on what's present or what the user asked for.
   const productContext = /* set to "flow-builder" | "applicant-page" | "table-page" | null based on the task */ null;

   function requireInstance(label, matchFn, forbiddenFrameNames = []) {
     const hasInstance = all.some(n => n.type === "INSTANCE" && matchFn(n));
     if (!hasInstance) {
       issues.push(`${label}: required component instance is missing — did you build it as a custom FRAME instead?`);
     }
     // Check forbidden names ONLY on top-level FRAMEs (not inside component instances —
     // DS components contain their own internally-named frames like "Header" / "Dot Grid").
     const fakes = all.filter(n =>
       n.type === "FRAME" &&
       !isInsideInstance(n) &&
       forbiddenFrameNames.some(name => new RegExp(`^${name}$`, "i").test(n.name))
     );
     if (fakes.length) {
       issues.push(`${label}: ${fakes.length} custom FRAME(s) with forbidden name(s) [${fakes.map(f => f.name).join(", ")}] — replace with the real component instance`);
     }
   }

   if (productContext === "flow-builder") {
     // Shell components — fail loudly if any of the three is missing.
     // These are the most common skip: "I built just the canvas, no shell".
     // Flow Builder = Sidebar + Flowbuilder Header + Canvas (with bars). All three required.
     if (!sidebar) {
       issues.push(`Flow Builder page is missing the *Sidebar* instance. Required — import key 60be5cbb4d070ccc4853589a555d949c3f23f62e and use the variant matching the dashboard context.`);
     }
     requireInstance(
       "Flowbuilder Header",
       n => n.mainComponent?.parent?.name === "Flowbuilder / *Header*" || /Flowbuilder/.test(n.mainComponent?.parent?.name || ""),
       // "Header" alone is too broad — every DS component has an internal "Header" frame.
       // Only flag top-level custom frames with explicit Flow Builder–mimicking names.
       ["Flow Builder Header", "FB Header", "Workflow Header", "Flowbuilder Header"]
     );
     requireInstance(
       "Canvas",
       n => n.mainComponent?.parent?.name === "Canvas" || n.mainComponent?.name?.startsWith("Status="),
       ["Canvas", "Dot Grid", "Canvas Background", "Grid", "Flow Canvas"] // forbidden as FRAME, required as INSTANCE
     );
     // Fake-Canvas detection: a FRAME with dot-pattern / grid-like fill, used as Canvas substitute
     const fakeDotGrids = all.filter(n =>
       n.type === "FRAME" &&
       n.fills?.some(f => f.type === "PATTERN" || (f.type === "IMAGE" && /grid|dot/i.test(n.name))) &&
       n.width > 800 && n.height > 500
     );
     if (fakeDotGrids.length) {
       issues.push(`${fakeDotGrids.length} large FRAME(s) with dot/grid pattern fill detected — looks like a fake Canvas built instead of using the Canvas component instance`);
     }
     // Verify canvas bars exist (they come inside Canvas instance by default)
     const canvasInst = root.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas");
     if (canvasInst) {
       const hasTopBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Top");
       const hasRightBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Right");
       const hasBottomBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Bottom");
       if (!hasTopBar || !hasRightBar || !hasBottomBar) {
         issues.push(`Canvas is present but bars are missing (top: ${hasTopBar}, right: ${hasRightBar}, bottom: ${hasBottomBar}). Make sure you used the Canvas INSTANCE, not a custom FRAME.`);
       }
     }
     // Node attachments should be used sparingly — not on every node
     const nodeInstances = all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Node / Canvas");
     const nodesWithBadge = nodeInstances.filter(n =>
       n.findAll(c => c.type === "INSTANCE" && c.mainComponent?.name === "Node / Badge / Start").length > 0
     ).length;
     if (nodeInstances.length > 1 && nodesWithBadge === nodeInstances.length) {
       issues.push(`All ${nodeInstances.length} canvas nodes show 'Start Badge' — only the first node should have it`);
     }
     const nodesWithDanger = nodeInstances.filter(n =>
       n.findAll(c => c.type === "INSTANCE" && /Status=Danger/.test(c.mainComponent?.name || "")).length > 0
     ).length;
     if (nodeInstances.length > 1 && nodesWithDanger === nodeInstances.length) {
       issues.push(`All ${nodeInstances.length} canvas nodes show 'Status=Danger' — realistic flows have mixed or empty statuses`);
     }
     // Invented "Legend" frame
     const legends = all.filter(n => n.type === "FRAME" && /^Legend$/i.test(n.name));
     if (legends.length) {
       issues.push(`'Legend' frame(s) present — real Flow Builder doesn't have an on-canvas legend; remove unless user asked for it`);
     }
     // Connector strokeWeight — must be 2.51 per reference/flowbuilder.md.
     // Only check OUR connectors (not strokes inside DS component instances, which include
     // decorative lines at strokeWeight=1 inside Canvas bars and Wizard).
     const connectors = all.filter(n =>
       (n.type === "VECTOR" || n.type === "LINE") &&
       n.strokes?.length > 0 &&
       !isInsideInstance(n)
     );
     const wrongWeight = connectors.filter(c => c.strokeWeight && Math.abs(c.strokeWeight - 2.51) > 0.05);
     if (wrongWeight.length) {
       issues.push(`${wrongWeight.length}/${connectors.length} top-level connector(s) strokeWeight ≠ 2.51 (found: ${[...new Set(wrongWeight.map(c => c.strokeWeight))].join(", ")}) — see reference/flowbuilder.md`);
     }
     // Custom node renaming — Node / Canvas instances should keep their default names
     const renamedNodes = nodeInstances.filter(n => /^Node — /.test(n.name) || /^Node - /.test(n.name));
     if (renamedNodes.length) {
       issues.push(`${renamedNodes.length} Node / Canvas instance(s) renamed with "Node — *" pattern — keep default instance names`);
     }
     // Info Block placeholder — the component ships with "Start time: 24 Jul, 23 13:43" / "Time in node: 8y:12m:14d" defaults
     const placeholderTexts = ["Start time: 24 Jul", "Time in node: 8y", "Time in node: 8y:12m:14d"];
     const placeholderHits = all.filter(n => n.type === "TEXT" && placeholderTexts.some(p => n.characters?.includes(p)));
     if (placeholderHits.length) {
       issues.push(`Info Block placeholder text still present in ${placeholderHits.length} text node(s) — replace with realistic times or hide Info Block`);
     }
   }

   if (productContext === "applicant-page") {
     requireInstance(
       "AP page header",
       n => n.mainComponent?.parent?.name === "AP page header" || n.mainComponent?.name?.startsWith("Client type="),
       ["AP Header", "Applicant Header", "Applicant Page Header"]
     );
     // Sidebar should be the collapsed 52px variant for AP pages
     if (sidebar && !/Collapsed=True/.test(sidebar.mainComponent.name)) {
       issues.push(`Applicant page Sidebar should use Collapsed=True (52px), but got "${sidebar.mainComponent.name}"`);
     }
   }

   if (productContext === "table-page") {
     // Table pages should use Top Toolbar component, not a custom toolbar
     const tableInst = all.find(n => n.type === "INSTANCE" && n.name === "*Table Starter*");
     if (tableInst) {
       const hasTopToolbar = !!root.findOne(n => n.type === "INSTANCE" && n.name === "Top Toolbar");
       if (!hasTopToolbar) {
         issues.push(`Table page has *Table Starter* but no 'Top Toolbar' instance — tables typically need one for search/filters/CTA`);
       }
     }
   }

   return issues.length === 0
     ? JSON.stringify({ status: "✅ Audit PASSED", info: infos }, null, 2)
     : JSON.stringify({ failed: issues.length, issues, info: infos }, null, 2);
   ```

   **Set `productContext`** at the top of the script to one of `"flow-builder" | "applicant-page" | "table-page" | null` based on the user's task. This enables the targeted checks in #8. When `null`, #8 is skipped.

   Adapt the root id, set the context, run, fix findings, re-run. Only share the link when the audit returns "✅ Audit PASSED". The most common failure modes:
   - #1 (Title Row antipattern)
   - #2 (placeholder subtitle)
   - #3 (double tabs)
   - #8 (fabricated Flowbuilder Header / Canvas as FRAMEs instead of component instances, all nodes with Start Badge, invented Legend frame)

---

## Block vs Page — read this first

Before starting, decide what the user actually wants:

**Build just the block** (no page wrapper) when the user:
- Says "recreate **this** block" / "build this component" / "пересоздай этот блок"
- Shares a single Figma node URL pointing to a component or internal frame (not a full-page frame)
- Describes a single UI element (card, drawer, modal, etc.) without mentioning a page

**Build a full page** (sidebar + header + content) when the user:
- Says "page" / "screen" / "mockup" / "страница" / "экран"
- Shares a URL to a top-level 1440×900 frame
- Asks for a flow or multiple screens

**If unclear, ask first.** Never default to wrapping a block in a full-page layout — that loses focus on the block itself. When building just a block, place it on free canvas near the original in the same file.

## Product-specific references (used by Critical rule #2)

Before building anything, **open the matching reference file(s) with the `Read` tool first** and actually consume their content. The references contain exact component keys, measured paddings, color logic, and anti-patterns. Without reading them, you will guess and produce a generic-looking result that doesn't match Sumsub's actual UI.

**Read for EVERY build (Plugin API gotchas):**

| Always read | Reference file |
|---|---|
| Plugin API pitfalls, library keys, patterns | `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md` |

**Read when building a specific product:**

| Product | Reference file |
|---|---|
| Applicant page / Applicant flow | `${CLAUDE_PLUGIN_ROOT}/reference/applicant-page-pattern.md`, `${CLAUDE_PLUGIN_ROOT}/reference/ap-component-catalog.md` |
| Flow Builder / Workflow canvas / Workflow nodes | `${CLAUDE_PLUGIN_ROOT}/reference/flowbuilder.md` |
| Page layouts (table, detail, etc.) | `${CLAUDE_PLUGIN_ROOT}/reference/layout-patterns.md` |
| Design system components / variables | `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md`, `${CLAUDE_PLUGIN_ROOT}/reference/color-usage.md` |
| Blocks system (helpers + templates) | `${CLAUDE_PLUGIN_ROOT}/reference/BLOCKS.md` |

These references contain exact component keys, variant names, measured paddings, and gotchas. Do NOT guess — consult the reference.

## Text truncation — always enable

Every `TEXT` node you create must have ellipsis truncation so it degrades gracefully when content doesn't fit:

```js
text.textAutoResize = "TRUNCATE";   // one line, ellipsis if overflow
text.textTruncation = "ENDING";      // adds "…"
```

For multi-line descriptions (captions, body text that may wrap):

```js
text.textAutoResize = "HEIGHT";
text.textTruncation = "ENDING";
text.maxLines = 2;  // or 3
```

**Requirement:** the text node must have a bounded width — either fixed (`resize(W, …)`) or `layoutSizingHorizontal = "FILL"`. Truncation has no effect on `WIDTH_AND_HEIGHT`.

**Never leave** data-fed text (names, IDs, URLs, locations) with default `WIDTH_AND_HEIGHT` — it will overflow containers when real data is longer than the placeholder.

## Icons: always from the DS icon pack

**Never build custom icons from rectangles, ellipses, or vectors.** Always use an instance from the Sumsub Assets library.

- 626 icons available in 4 sizes: `small/8px`, `small`, `normal`, `large`
- If `search_design_system` with one keyword returns nothing, try synonyms (monitor / device / computer / laptop / desktop / screen) and check all sizes
- Check both `Assets` library and `Base components` library
- **If truly no matching icon exists, tell the user explicitly** before building a custom shape. Never silently draw rectangles.

## Workflow

Block files are bundled with this skill in `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/`.

1. Read `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/helpers.js` — shared constants, variable keys, helper functions
2. Read the relevant block template from `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/` — `table-page.js`, `detail-drawer.js`, or `form-modal.js`
3. Customize parameters in the top section of the block
4. Concatenate helpers.js + block template
5. Run via `mcp__figma__use_figma`

## Available Blocks

| Block | File | When to use |
|---|---|---|
| Table Page | `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/table-page.js` | List of entities: applicants, transactions, cases |
| Detail Drawer | `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/detail-drawer.js` | Right-side drawer over a table page |
| Form Modal | `${CLAUDE_PLUGIN_ROOT}/skills/sumsub-mockup/blocks/form-modal.js` | Create/edit modal over a table page |

---

## Parameters (table-page.js)

| Parameter | Type | Description |
|---|---|---|
| `PAGE_TITLE` | string | Page heading (semibold/h4-xl) |
| `PAGE_SUBTITLE` | string | Subtitle below heading, `""` = hidden |
| `CTA_LABEL` | string | Primary button label, `""` = hidden |
| `TAB_LABELS` | string[] | Tab labels, `[]` = no tabs |
| `FRAME_NAME` | string | Figma frame name |

---

## Screen Structure

```
[1440 × 900]
├── Sidebar (257px, *Sidebar* from Organisms)
└── Main (VERTICAL, 1183px)
    ├── Header (64px, *Header* from Organisms)
    └── Content (VERTICAL, pad 24/32/24/32)
        ├── Title Row (h=52)
        │   ├── Title Stack (left)
        │   └── CTA Button (right)
        ├── Top Toolbar (component, FILL width)
        └── Table (*Table Starter*, FILL width)
```

---

## Content Frame Padding

```js
content.paddingTop    = 24;  // spacing/xl
content.paddingBottom = 24;  // spacing/xl
content.paddingLeft   = 32;  // spacing/3xl
content.paddingRight  = 32;  // spacing/3xl
```

---

## Top Toolbar — Rules

**Always use the `Top Toolbar` component** (key: `fa8defc5fadd20a84c812784786217c6e0003ca0`), never build manually.

```js
const toolbar = await figma.importComponentByKeyAsync("fa8defc5fadd20a84c812784786217c6e0003ca0");
const toolbarInst = toolbar.createInstance();
content.appendChild(toolbarInst);
toolbarInst.layoutSizingHorizontal = "FILL";
```

When using Table Starter with Top Toolbar: `table.setProperties({ "Toolbar#736:139": false })`.

### Icon Swapping in Buttons

**ONLY via `INSTANCE_SWAP` property, never `swapComponent()`:**
```js
const iconComp = await figma.importComponentByKeyAsync("ICON_KEY");
btn.setProperties({
  "Content": "Icon Only",
  "  ↪ Left Icon Name#3007:0": iconComp.id  // pass .id, not the object
});
```

`swapComponent` on nested instances breaks the button structure.

### Post-Modification Checklist
1. Button icons match design (not leftover search icons)
2. `*Chips*` visible/hidden correctly
3. Selected chip has `Selected: "yes"`
4. Filters visible/hidden correctly

---

## Table Starter — populate, hide, label (don't hack internals)

A `*Table Starter*` instance ships with **10 default rows + header row with "Table header" labels**. Three things you must handle:

### 1. Hide unused rows via `row.visible = false`

Never leave visible rows with empty cells or direct-edited `.characters = ""`. That leaks default DS text, creates overflow, and audit check 7.23 catches it.

```js
const rows = table.children.filter(c => c.name === "Table Row");
// Populate rows 0..N-1 with real data
for (let i = 0; i < DATA.length; i++) {
  const d = DATA[i];
  const cells = rows[i].children[0].children; // [checkbox, c1, c2, c3, c4, c5, actions]
  cells[1].setProperties({ Type: "Text Regular", "  ↪ Text in cell#14615:0": d.name });
  // ... rest of cells
}
// HIDE the rest — not blank, not leave alone
for (let i = DATA.length; i < rows.length; i++) rows[i].visible = false;
```

### 2. Set header labels via `setProperties`

The header row has the SAME cell structure as data rows — header cells are `Table Row`-like children of `Table Header`. Each header cell instance has a `"Header name#…"` property. Set it via setProperties, not by walking to the TEXT and editing `.characters`.

```js
const tableHeader = table.children.find(c => c.name === "Table Header");
const headerCells = tableHeader.children;
const labels = [null, "Domain", "Status", "Added", "Last check", "SSO", null]; // null = checkbox/actions
for (let i = 0; i < headerCells.length && i < labels.length; i++) {
  if (labels[i] === null) continue;
  const cell = headerCells[i];
  if (cell.type !== "INSTANCE") continue;
  const labelKey = Object.keys(cell.componentProperties).find(k => /Header name/i.test(k));
  if (labelKey) cell.setProperties({ [labelKey]: labels[i] });
}
```

### 3. Never directly modify TEXT inside the Table Starter instance

Specifically: **no `text.characters = "…"` on descendants of the table instance**. Figma Plugin API allows it but it violates the "never detach instance / never hack internals" rule. Audit check 7.24 counts empty TEXT nodes inside tables and flags if there are too many (symptom of direct blanking).

### 4. Never `clipsContent = false` on Content frame to hide overflow

If the table physically extends past the Content frame height, the fix is to HIDE unused rows (step 1), not to disable clipping on Content. Audit check 7.22 catches this.

---

## Table Cell Configuration

### Cell Types

| Column | Cell Type | Key Properties |
|---|---|---|
| Entity | `Text Regular` | `"  ↪ Text in cell#14615:0"`, `"Flag#10232:246": true`, `"1st subheader#10232:175": true` |
| ID | `ID` | `"  ↪ ID number#739:165"`, `"  ↪ Copy button#739:188": false` |
| Status | `Status` | Find `*Status*` instance inside → set `"Text label#3031:21"` and `"Type"` |
| Date + time | `Date + time` | `"↪ Date#734:75"`, `"↪ Time#734:53"` |
| Date only | `Text Regular` | `"  ↪ Text in cell#14615:0"` = date string |

### Table Row Structure
```
table.children[0]  = Top Toolbar (hidden when external toolbar used)
table.children[1]  = Table Header
table.children[2..11] = 10 data rows
table.children[12] = Table Footer

row.children[0]  // "row" frame
  .children[0] = Checkbox cell
  .children[1] = Cell 1 (Entity)
  .children[2] = Cell 2 (ID)
  .children[3] = Cell 3 (Status)
  .children[4] = Cell 4 (date)
  .children[5] = Cell 5 (date)
  .children[6] = Actions cell
```

### Entity Cell — Full Setup
```js
cellEntity.setProperties({
  "Type": "Text Regular",
  "  ↪ Text in cell#14615:0": "Donald Trump",
  "Flag#10232:246": true,
  "1st subheader#10232:175": true,
  "  ↪ 1st subheader text#10232:245": "Applicant • Individual Applicant"
});
// Set flag country
const flagInst = findAll(cellEntity, n => n.type === "INSTANCE" && n.name === "Flag")[0];
flagInst.setProperties({ "Country": "United States (US)" });
```

**Flag country format:** `"Country Name (ISO)"` — e.g. `"United States (US)"`, `"India (IN)"`.
Special: UK = `"United Kingdom of Great Britain (GB)"`.

### Status Cell — Full Setup
```js
cellStatus.setProperties({ "Type": "Status" });
const statusInst = findAll(cellStatus, n => n.type === "INSTANCE" && n.name === "*Status*")[0];
statusInst.setProperties({
  "Text label#3031:21": "Pending",
  "Type": "Yellow (Pending)"
});
```

**Status color mapping:**

| Status | Type value |
|---|---|
| Pending | `Yellow (Pending)` |
| Approved | `Green (Approved)` |
| Rejected | `Red (Rejected)` |
| Default | `Grey (Default)` |

### Status with Subheader + Badge Dot
```js
cellStatus.setProperties({
  "Type": "Status",
  "1st subheader#10232:175": true,
  "  ↪ 1st subheader text#10232:245": "Active — Ongoing monitoring off",
  "Badge#5431:0": true  // colored dot before text
});
```

⚠️ Long subheader text wraps in narrow columns (~155px), increasing cell height from 56px to ~92px.

---

## Text Overflow Fix

When text in cells extends beyond boundaries:

### Root Cause
Intermediate frames have `layoutSizingHorizontal: "HUG"` — text grows beyond cell width.

### Fix Algorithm
```js
// 1. Content frame (VERTICAL, direct child of cell) → FILL
contentFrame.layoutSizingHorizontal = "FILL";

// 2. Text frame (HORIZONTAL, child of Content) → FILL
textFrame.layoutSizingHorizontal = "FILL";

// 3. Text layer (TEXT node) → HEIGHT + FILL + truncation
textLayer.textAutoResize = "HEIGHT";
textLayer.layoutSizingHorizontal = "FILL";
textLayer.textTruncation = "ENDING";
```

### Applies to:
- **ID cells:** Cell → Content → Text → text layer
- **Entity cells:** Cell → Content → "Text + button" → text layer

### Important:
- `resize()` doesn't work on nodes inside auto-layout instances — use `layoutSizingHorizontal/Vertical`
- `textAutoResize = "WIDTH_AND_HEIGHT"` ignores truncation
- `maxLines` is unsupported in some contexts

---

## Tint / Scrim (for Drawer & Modal blocks)

**Always use the `Tint` component, never `createRectangle()`:**
```js
const tint = await figma.importComponentByKeyAsync("815f961c100c14a0aca85988a8545a2c37821c1c");
const tintInst = tint.createInstance();
root.appendChild(tintInst);
tintInst.layoutPositioning = "ABSOLUTE";
tintInst.resize(1440, 900);
tintInst.x = 0;
tintInst.y = 0;
```

Scrim always covers **full root frame** (1440×900), including sidebar.

---

## Modal Basic / Drawer Basic — setting body content via `slot.appendChild()`

**Four API facts to memorise:**

1. **SLOT properties are read-only via `setProperties`.** `modal.setProperties({"Content#…": ...})` throws `"Slot component property values cannot be edited"`.
2. **Body FRAME is locked.** `body.appendChild(newNode)` throws `"Cannot move node. New parent is an instance or is inside of an instance"`.
3. **`swapComponent` is not available on SLOT nodes.** `slot.swapComponent(bodyComp)` throws `"no such property 'swapComponent' on SLOT node"`.
4. **The SLOT node itself DOES accept `appendChild`.** This is the working path. Append your wrap frame directly into the SLOT node and hide the default `slot / basic` child.

**The correct path:**

```js
// Find the SLOT node (not a FRAME, not an INSTANCE — type === "SLOT")
const body = modal.children.find(c => c.type === "FRAME" && c.name.trim() === "Body");
const slot = body.children.find(c => c.type === "SLOT");  // just one

// Build your content wrap fully OFF-TREE first (all sync — see below for why).
// Then append into the slot:
slot.appendChild(wrap);

// Hide ALL other slot children (default "Slot / Basic" placeholder etc.).
// Iterate, don't match by name — name varies between component versions.
for (const child of slot.children) {
  if (child !== wrap) child.visible = false;
}
```

**⚠️ NEVER wrap the swap in try/catch.** Observed failure: skill defined a "safeSwapBody(modal, wrap)" helper with try/catch around both `slot.appendChild(wrap)` and the sibling-hide loop. When the append silently failed, the modal kept its default 228px height with only `Slot / Basic` visible — looked like an empty dialog in review. The skill's own audit ran after and passed because it only checked for >1 visible child (double-body), not for "only default child remains" (empty modal).

If `slot.appendChild(wrap)` throws — stop, surface the error, fix the actual cause (wrap is undefined? slot reference stale from an interleaved await?). Don't catch and continue.

**⚠️ Pre-cache all variables/styles/components BEFORE any tree mutation.** Interleaving `await figma.variables.importVariableByKeyAsync(...)` calls between capturing a node reference and mutating it causes `"Internal Figma Error: Parent not found"` — every await lets Figma reshuffle the internal tree and invalidates captured IDs, including IDs you re-fetched via `getNodeById`. Fix: do ALL imports first (one await block), build helpers that are PURE/SYNC, then do tree mutation in one sync stretch.

```js
// ═══ STAGE 1: cache everything async up front ═══════════════════════════════
const modalSet   = await figma.importComponentSetByKeyAsync(COMPONENTS.modalBasic);
const buttonSet  = await figma.importComponentSetByKeyAsync(COMPONENTS.button);
const inputSet   = await figma.importComponentSetByKeyAsync(COMPONENTS.inputBasic);
const spXL       = await figma.variables.importVariableByKeyAsync(SP_VARS.xl);
const spLG       = await figma.variables.importVariableByKeyAsync(SP_VARS.lg);
const styleBodyM = await figma.importStyleByKeyAsync(TEXT_STYLES["regular/body-m"]);
await figma.loadFontAsync({ family: "Geist", style: "Regular" });
await figma.loadFontAsync({ family: "Geist", style: "Medium" });
await figma.loadFontAsync({ family: "Geist", style: "SemiBold" });

// ═══ STAGE 2: sync helpers using the cached objects ══════════════════════════
const bindSp  = (node, prop, v) => node.setBoundVariable(prop, v);
const mkText  = (chars, style, fill) => {
  const t = figma.createText();
  t.characters = chars;
  t.setTextStyleIdAsync(style.id);
  return t;
};

// ═══ STAGE 3: build content OFF-TREE in one sync stretch ═════════════════════
const modal = modalSet.children.find(v => v.name === "Size=Medium").createInstance();

// Customize Header (synchronous setProperties)
const modalHeader = modal.findOne(n => n.type === "INSTANCE" && /\/ Header/i.test(n.name));
modalHeader.setProperties({
  "Title text#3834:3": "Add domain",
  "Subtitle text#4643:0": "Step 1 of 2",
  "Subtitle#4643:1": true,
  "Close button#8216:0": true,
});

// Customize Footer buttons
const modalFooter = modal.findOne(n => n.type === "INSTANCE" && /\/ Footer/i.test(n.name));
const footerBtns = modalFooter.findAll(n => n.type === "INSTANCE" && n.name === "*Button*");
footerBtns[2].setProperties({ "Button Text#143:1442": "Cancel",   "Type": "Secondary" });
footerBtns[3].setProperties({ "Button Text#143:1442": "Continue", "Type": "Primary" });

// Find the Body + SLOT first — we need slot.width, NOT modal.width,
// because the Body frame has ~48px internal padding (varies by size).
// Sizing the wrap to modal.width causes horizontal overflow.
const body = modal.children.find(c => c.type === "FRAME" && c.name.trim() === "Body");
const slot = body.children.find(c => c.type === "SLOT");

// Build the body wrap frame off-tree, sized to SLOT
const wrap = figma.createFrame();
wrap.name = "Modal Body / Add domain";
wrap.layoutMode = "VERTICAL";
wrap.primaryAxisSizingMode = "AUTO";
wrap.counterAxisSizingMode = "FIXED";
wrap.resize(slot.width, 100);   // ← slot.width, NOT modal.width
wrap.fills = [];

// Rule 7.12: NO paddings on the wrap — the Body frame already pads.
// Only itemSpacing for vertical gaps between children.
wrap.paddingLeft = 0;
wrap.paddingRight = 0;
wrap.paddingTop = 0;
wrap.paddingBottom = 0;
bindSp(wrap, "itemSpacing", spLG);   // spacing/lg (16px) between stacked children

const desc = mkText("Enter the domain you want to verify…", styleBodyM);
wrap.appendChild(desc);
desc.layoutSizingHorizontal = "FILL";

const input = inputSet.defaultVariant.createInstance();
wrap.appendChild(input);
input.layoutSizingHorizontal = "FILL";

// ═══ STAGE 4: inject wrap into modal's SLOT — one sync call ══════════════════
const body = modal.children.find(c => c.type === "FRAME" && c.name.trim() === "Body");
const slot = body.children.find(c => c.type === "SLOT");
slot.appendChild(wrap);

// Hide ALL slot children except wrap. Rule 7.13: name-based matching
// ("Slot / Basic") is fragile — some component versions name the placeholder
// differently. Iterate all siblings and hide every non-wrap.
for (const child of slot.children) {
  if (child !== wrap) child.visible = false;
}

// ═══ STAGE 5: place the fully-sized modal on the scrim, centered ═════════════
scrimRoot.appendChild(modal);
modal.layoutPositioning = "ABSOLUTE";
modal.x = (scrimRoot.width  - modal.width)  / 2;
modal.y = (scrimRoot.height - modal.height) / 2;
```

**Drawer Basic** — identical pattern. Its header uses different prop keys:
- `"Title text#538:0"` → your title (default is literal `"Title"` — must replace)
- `"Description text#369:24"` → your description (default is literal `"Description"` — must replace)

**What you MUST NOT do:**
- Don't call `modal.setProperties({"Content#…": ...})` — SLOT is read-only, throws.
- Don't `appendChild` into the Body frame directly — throws "Cannot move node…".
- Don't wrap `swapComponent` in try/catch — if it fails, stop and surface.
- Don't build modals/drawers as custom FRAMEs named `Modal · *` / `Drawer · *` with hand-composed Header/Body/Footer children — Rule #3 fabrication.
- Don't leave default Header texts ("Hey, what's up, dude?", "Title", "Description") — always overwrite via setProperties on the `/ Header` sub-instance.

## Library Rules

| Rule | Details |
|---|---|
| ✅ Use | Base components [Dashboard UI Kit], Organisms [Dashboard UI Kit] |
| ❌ Don't use | Redesign components (`MDOnxIRFpmo1PApWWULLiH`) |
| ✅ Token layer | `semantic/*` variables for all custom nodes |
| ❌ Never | `base/*` variables directly — always map to semantic equivalents |
| ✅ Always bind | `spacing/*`, `border-radius/*`, `semantic/background/*`, `semantic/border/*`, `semantic/text/*` |
| ❌ Never hardcode | Hex colors, pixel values for spacing/radius |

---

## Background Rules

> These rules implement Critical rule #6. Do not deviate.

| Frame | Fill | Variable |
|---|---|---|
| Root / page frame | **Subtlest grey** (`#f6f7f9`) | `semantic/background/neutral/subtlest/normal` |
| Main (right of sidebar) | **Inherit / no fill** — transparent so root grey shows at page margins | — |
| Content (inside Main) | **White** (`#ffffff`) — this is the working surface, never grey | `semantic/background/neutral/inverse/normal` |
| Cards inside Content | White, or as the card component dictates | `semantic/background/neutral/inverse/normal` |

**Do NOT** leave the `Content` frame with no fill — the root's grey will show through and the page will look entirely grey. The visual model: grey margin around, white content surface in the middle.

```js
// Content frame setup — always do this
const bg = await figma.variables.importVariableByKeyAsync(VARS.cardBg); // inverse/normal
content.fills = [figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 1, g: 1, b: 1 } }, "color", bg
)];
```

---

## Gotchas

- **No IIFE wrapper** — `use_figma` runs code in async context; top-level `await` works
- **`appendChild` before `layoutSizingHorizontal`** — sizing props require auto-layout parent
- **`primaryAxisSizingMode` / `counterAxisSizingMode`** accept `"FIXED"` | `"AUTO"`, not `"HUG"`
- **Tab Basic** is a single component (`importComponentByKeyAsync`), not a component set
- **Button text** — set via `setInstanceText(btn, "Button", label)` after `appendChild`
- **Absolute positioning** — after `appendChild` in auto-layout, set `node.layoutPositioning = "ABSOLUTE"`
- **Date without time** — use `Type: "Text Regular"`, not `Date + time` (shows placeholder)
