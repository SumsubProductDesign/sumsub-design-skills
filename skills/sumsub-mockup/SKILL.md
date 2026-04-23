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

### Pre-flight: check for plugin updates (run FIRST, once per session)

Before executing Rule #0 or any other work, verify the plugin is up to date. Stale skills are the source of most "it regressed" bugs — the skill followed outdated docs. Check and prompt the user to update.

**Steps:**

1. **Read local version.** Use the `Read` tool on `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. Parse JSON, extract `version`. If read fails, skip the check — proceed with warning "could not verify plugin version".

2. **Fetch remote version.** Use the `WebFetch` tool:
   - URL: `https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json`
   - Prompt: `"Return the raw JSON content of this file, nothing else."`
   - Parse the response JSON, extract `version`. If fetch fails (network, 404) — skip with warning "could not check for updates".

3. **Compare SemVer.** `local = "3.25.0"`, `remote = "3.28.0"` → remote > local, update available.

4. **If remote > local — STOP and show the user this message verbatim:**

   > ⚠️ **sumsub-design plugin update available**
   >
   > Your local version: **vLOCAL** · Latest: **vREMOTE**
   >
   > Newer versions fix real bugs — each release ships audit checks and guidance that prevent silent mockup failures.
   >
   > I can update it for you right now by running:
   > ```
   > claude plugin marketplace update sumsub-design
   > claude plugin update sumsub-design@sumsub-design
   > ```
   >
   > Reply:
   > - **`yes`** / **`update`** — I'll run the two commands via Bash, then you just quit and reopen Claude Desktop
   > - **`continue anyway`** — don't update, use the current (older) version

   Substitute `vLOCAL` / `vREMOTE` with the actual versions.

5. **If user replies `yes` or `update` — run the update automatically.** Use the `Bash` tool to execute both commands in sequence:

   ```bash
   claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design
   ```

   After the Bash call completes:
   - If both commands succeeded (exit 0) — tell the user:
     > ✅ Updated to vREMOTE. Fully quit Claude Desktop (⌘Q on macOS, right-click tray → Quit on Windows) and reopen so the new version loads. Then reply `restarted` and I'll continue.
   - If commands failed — surface the exact error output and the manual fallback:
     > ❌ Update failed: `<stderr excerpt>`
     >
     > Try manually in a regular terminal:
     > ```
     > claude plugin marketplace update sumsub-design
     > claude plugin update sumsub-design@sumsub-design
     > ```
     > …or reply `continue anyway` to proceed on the current version.

   After restart, the user comes back to the chat. Proceed to Rule #0.

6. **If user replies `continue anyway`** — skip the update, cache the decision, proceed to Rule #0.

7. **Do not re-run this check more than once per conversation.** Track that it's been done and skip on subsequent turns in the same session.

**When the check does NOT fire:**
- Local ≥ remote (no update needed) — proceed silently to Rule #0.
- WebFetch failed — warn once, proceed anyway.
- Local plugin.json unreadable — warn once, proceed anyway.
- User already said "continue anyway" earlier in this conversation — proceed.

**Implementation note — cache the result.** Once the version is verified (either up-to-date, user accepted update, or user said continue), remember the outcome for the rest of the conversation. Don't make the user answer twice.

---

0. **Ask WHERE to create the mockup — before anything else.** Don't assume the "current file" and don't default to personal Drafts. Four distinct destinations — ask explicitly:

   > Where should I create the mockup?
   > 1. **Existing file** — share a Figma URL (tell me which section/frame if relevant)
   > 2. **Personal Drafts** — new file in your Drafts (personal tier)
   > 3. **Team project** — tell me which team (Starter/Pro tier — has MCP file-creation limits)
   > 4. **Sumsub org** — new file in the Sumsub organization (Org tier — recommended for work tasks)

   Wait for the answer. For work tasks (anything building on Sumsub product surfaces — Flow Builder, Applicant page, Dashboard screens, etc.) the default is option 4 (Sumsub org). Personal Drafts = Starter-tier limits = you WILL hit an MCP file-creation cap mid-build. Offer option 4 by default and ask to confirm.

   **planKey awareness.** When creating files via `create_new_file` / MCP, always pass the org `planKey` from `${CLAUDE_PLUGIN_ROOT}/reference/design-system.md` (section "Figma File Info") for work tasks. Hitting a plan-tier limit mid-build because you silently used Drafts is a bug, not a Figma bug.

   **Page-level placement inside the file.** Once the file is chosen, pick the target PAGE by this rule:
   1. If the user named a specific page — use it.
   2. Else, find an existing page whose name contains "Drafts" (case-insensitive) — use it. Typical name: `🛠 Drafts`.
   3. Else, create a new page called `🛠 Drafts` and use it.

   ```js
   const targetPage =
     figma.root.children.find(p => /drafts/i.test(p.name))
     ?? (() => {
       const p = figma.createPage();
       p.name = "🛠 Drafts";
       return p;
     })();
   await targetPage.loadAsync();
   await figma.setCurrentPageAsync(targetPage);
   ```

   Never build mockups on a page with production frames unless the user explicitly told you to. "Current page" is not a default — always resolve the target page via the rule above.

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

5. **Page title goes INSIDE the `*Header*` component.** Use the Header's built-in title property (e.g. `Title text#3817:0`). NEVER create a separate TEXT node for the page title above or below the header. Don't build a "Title Row" — that's duplication.

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

   // 1. Title Row antipattern — page title MUST be in Header's Title text property
   const titleRowAntipatterns = all.filter(n =>
     n.type === "FRAME" && /^(Title Row|Title Stack|Page Title)$/i.test(n.name)
   );
   if (titleRowAntipatterns.length) {
     issues.push(`Title Row antipattern: ${titleRowAntipatterns.length} frame(s) — move title into *Header* 'Title text' property and delete`);
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

   // 4. Sidebar variant — reported as info (not a failure). Human must verify
   // the variant matches the page context (Applicants page → Type=Applicants, etc.).
   const sidebar = root.findOne(n =>
     n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Sidebar*"
   );
   const infos = [];
   if (sidebar) {
     infos.push(`[info] Sidebar variant: "${sidebar.mainComponent.name}" — verify it matches the page context`);
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

## Modal Basic / Drawer Basic — setting body content via `swapComponent`

**Two API facts to memorise:**

1. **SLOT properties are read-only via `setProperties`.** `modal.setProperties({"Content#…": ...})` on `*Modal Basic*` throws `"Slot component property values cannot be edited"`. Not a bug — the API forbids it.
2. **You can't `appendChild` into the Body FRAME either.** Figma throws `"Cannot move node. New parent is an instance or is inside of an instance"`. The Body is inside an INSTANCE subtree.

**The correct path: swap the inner slot instance.** Inside the Body frame there is a sub-INSTANCE named `slot / basic` (or similar — trailing/leading spaces vary). Swap it with your own local component using `instance.swapComponent(bodyComp)`.

```js
// 1. Create the modal instance (or drawer — same pattern)
const modalSet = await figma.importComponentSetByKeyAsync(COMPONENTS.modalBasic);
const modal = modalSet.children.find(v => v.name === "Size=Medium").createInstance();

// 2. Customize the modal Header — ALWAYS replace Title/Subtitle.
//    Default texts are "Hey, what's up, dude? It's modal basic" / "Hi, I'm sabtitle" —
//    if you don't overwrite, audit will catch and delivery is blocked.
const modalHeader = modal.findOne(n => n.type === "INSTANCE" && /\/ Header/i.test(n.name));
modalHeader.setProperties({
  "Title text#3834:3": "Add domain",   // required — real title
  "Subtitle text#4643:0": "Step 1 of 2",  // optional
  "Subtitle#4643:1": true,              // show subtitle
  "Close button#8216:0": true,
});

// 3. Customize the modal Footer buttons
const modalFooter = modal.findOne(n => n.type === "INSTANCE" && /\/ Footer/i.test(n.name));
const footerBtns = modalFooter.findAll(n => n.type === "INSTANCE" && n.name === "*Button*");
footerBtns[2].setProperties({ "Button Text#143:1442": "Cancel",   "Type": "Secondary" });
footerBtns[3].setProperties({ "Button Text#143:1442": "Continue", "Type": "Primary" });

// 4. Find the Body frame (trailing space in name — always use .trim())
const modalBody = modal.children.find(c => c.type === "FRAME" && c.name.trim() === "Body");

// 5. Find the inner slot instance inside Body
const slotInst = modalBody.findOne(n =>
  n.type === "INSTANCE" && /slot\s*\/\s*basic/i.test(n.name)
);
if (!slotInst) throw new Error("slot / basic sub-instance not found inside Body — Modal Basic structure changed");

// 6. Create a local main component to hold your content
const bodyComp = figma.createComponent();
bodyComp.name = "Modal Body / Add domain";
bodyComp.layoutMode = "VERTICAL";
bodyComp.primaryAxisSizingMode = "AUTO";    // grow with content
bodyComp.counterAxisSizingMode = "FIXED";
bodyComp.itemSpacing = 16;
bodyComp.paddingLeft = 24; bodyComp.paddingRight = 24;
bodyComp.paddingTop = 0;   bodyComp.paddingBottom = 16;
bodyComp.resize(modal.width, 100);

// 7. Park the local component on the dedicated Local components page.
//    Per Rule 7.9 (universal — applies to EVERY figma.createComponent() in the
//    skill, not just modal bodies): use getLocalComponentsHome() helper.
//    DO NOT appendChild to currentPage with x=-20000 — that stacks every
//    component at the same off-canvas point and is unreadable.
const home = await getLocalComponentsHome();  // "Local components" page → "Components (by Claude)" SECTION
home.appendChild(bodyComp);
positionInHome(home, bodyComp);  // auto-grid, 4 cols, no collisions

// 8. Build content inside the local component
const desc = await makeText("Enter the domain…", "regular/body-m", "textSubtle");
bodyComp.appendChild(desc);
desc.layoutSizingHorizontal = "FILL";

const input = await makeInstance(COMPONENTS.inputBasic);
bodyComp.appendChild(input);
input.layoutSizingHorizontal = "FILL";

// 9. Swap the inner slot instance to point at your component
slotInst.swapComponent(bodyComp);

// 10. Place modal on scrim, centered AFTER swap (height is now final)
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
