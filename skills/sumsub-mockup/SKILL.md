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

0. **Ask WHERE to create the mockup — before anything else.** Don't assume the "current file" and don't default to personal Drafts. Four distinct destinations — ask explicitly:

   > Where should I create the mockup?
   > 1. **Existing file** — share a Figma URL (tell me which section/frame if relevant)
   > 2. **Personal Drafts** — new file in your Drafts (personal tier)
   > 3. **Team project** — tell me which team (Starter/Pro tier — has MCP file-creation limits)
   > 4. **Sumsub org** — new file in the Sumsub organization (Org tier — recommended for work tasks)

   Wait for the answer. For work tasks (anything building on Sumsub product surfaces — Flow Builder, Applicant page, Dashboard screens, etc.) the default is option 4 (Sumsub org). Personal Drafts = Starter-tier limits = you WILL hit an MCP file-creation cap mid-build. Offer option 4 by default and ask to confirm.

   **planKey awareness.** When creating files via `create_new_file` / MCP, always pass the org `planKey` from `reference/design-system.md` (section "Figma File Info") for work tasks. Hitting a plan-tier limit mid-build because you silently used Drafts is a bug, not a Figma bug.

1. **Check libraries BEFORE starting.** Call `get_libraries(fileKey)` to see which Figma libraries are connected. For known Sumsub products (Flow Builder, Applicant page, Specs) the required libraries are:

   | Product | Required libraries |
   |---|---|
   | Flow Builder | Organisms [Dashboard UI Kit], Base components [Dashboard UI Kit], Assets |
   | Applicant page | Applicant-page-and-Tasks-components (`QKXZwWodIwPVsjAjj4gMnE`), Organisms, Base components, Assets |
   | Table / Detail pages | Organisms, Base components, Assets |

   If a required library is missing — STOP and ask the user to connect it. Do not proceed with invented structures.

   **⛔ The "I couldn't find it in search_design_system" excuse is forbidden.** `search_design_system` is keyword-matched and often misses. Before telling the user a component doesn't exist, you MUST:
   1. Read the product's reference file from this plugin's `reference/` folder (see rule #2)
   2. Try `importComponentByKeyAsync` / `importComponentSetByKeyAsync` with keys listed there
   3. Only if both fail, report to the user

   Saying "the library doesn't contain Flowbuilder Header" when `reference/flowbuilder.md` lists its exact component key is a bug, not a limitation.

2. **Read the product reference FIRST — mandatory.** Before any `use_figma` call for a known Sumsub product, use the `Read` tool on ALL reference files listed below for that product. Not optional, not "if you're unsure" — mandatory. The skill does not have the knowledge baked in; it lives in the reference files.

   | Product / Task | Required reads (ALL of them) |
   |---|---|
   | Flow Builder | `reference/figma-gotchas.md`, `reference/flowbuilder.md`, `reference/design-system.md` |
   | Applicant page | `reference/figma-gotchas.md`, `reference/applicant-page-pattern.md`, `reference/ap-component-catalog.md`, `reference/layout-patterns.md` |
   | Table page | `reference/figma-gotchas.md`, `reference/layout-patterns.md`, `reference/BLOCKS.md` |
   | Any custom page | `reference/figma-gotchas.md`, `reference/design-system.md`, `reference/color-usage.md`, `reference/layout-patterns.md` |

   If you haven't read the required references for the task's product, you're not ready to build. Building from "general knowledge" is a bug — the reference has exact keys, paddings, connector stroke weights, color logic that you cannot guess correctly.

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

   **Never quote a reference as authority without citing it.** Saying "the reference recommends using generic Header" requires pasting the exact line from `reference/flowbuilder.md` that says so. If you can't paste the line, you're fabricating the authority — stop.

   If you catch yourself about to say "I built just X because Y isn't available" — stop, re-read the reference for this product, and either build the full thing or surface the blocker to the user.

4. **No screenshots.** Never call `get_screenshot` or any screenshot tool. Inspect everything via `use_figma` Plugin API (read properties, layoutMode, fills, variant props, text content). Screenshots are only allowed when the user explicitly asks.

5. **Page title goes INSIDE the `*Header*` component.** Use the Header's built-in title property (e.g. `Title text#3817:0`). NEVER create a separate TEXT node for the page title above or below the header. Don't build a "Title Row" — that's duplication.

6. **Main content area is always white**, bound to `semantic/background/neutral/inverse/normal`. Never grey. Page root stays subtlest grey (`#f6f7f9`), but the `Content` / card areas are white (`#ffffff`).

7. **Fill with realistic data — always.** Tables: 10 rows with plausible names, dates, IDs, statuses (mix, not all "Approved"). Inputs: meaningful label + placeholder. Status badges: realistic distribution. Dates in DS format. NEVER leave default "Table cell", "Label", "Placeholder", "ID" text.

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
   for (const n of all) {
     if (n.type === "PAGE" || !n.parent) continue;
     if (isInsideInstance(n)) continue;
     const p = n.parent;
     if (!("width" in p) || p.clipsContent === false) continue;
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
   for (const n of all) {
     if (n.type !== "FRAME") continue;
     if (isInsideInstance(n)) continue;
     if (["Item List","Main","Content"].includes(n.name)) continue;
     if (n.cornerRadius > 0 && !n.boundVariables?.topLeftRadius) {
       issues.push(`Unbound cornerRadius on ${n.name}: ${n.cornerRadius}px`);
     }
     if (n.fills?.[0]?.type === "SOLID" && !n.fills[0].boundVariables?.color) {
       issues.push(`Hardcoded fill on ${n.name}`);
     }
   }

   // 7.1. Default component-property placeholder text — EVERYWHERE, including inside instances.
   // When you create a *Filter* / *Select* / *Button* / Table cell and don't customize via
   // setProperties(), the default text stays ("Label", "Placeholder", "Button", "Text in cell",
   // "Subheader text"). Rule #7 (fill realistic data) — these are real bugs, not false positives.
   // We check INSIDE instances here because these ARE the customization points.
   const defaultTexts = [
     "Label", "Placeholder", "Button", "Text in cell", "Table cell",
     "Subheader text", "Caption text", "Page title",
   ];
   const defaultTextCounts = {};
   for (const n of all) {
     if (n.type !== "TEXT") continue;
     if (!n.characters) continue;
     if (defaultTexts.includes(n.characters)) {
       defaultTextCounts[n.characters] = (defaultTextCounts[n.characters] || 0) + 1;
     }
   }
   for (const [txt, count] of Object.entries(defaultTextCounts)) {
     issues.push(`${count} TEXT node(s) with default value "${txt}" — Rule #7: set real content via setProperties or setInstanceText`);
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
| Plugin API pitfalls, library keys, patterns | `reference/figma-gotchas.md` |

**Read when building a specific product:**

| Product | Reference file |
|---|---|
| Applicant page / Applicant flow | `reference/applicant-page-pattern.md`, `reference/ap-component-catalog.md` |
| Flow Builder / Workflow canvas / Workflow nodes | `reference/flowbuilder.md` |
| Page layouts (table, detail, etc.) | `reference/layout-patterns.md` |
| Design system components / variables | `reference/design-system.md`, `reference/color-usage.md` |
| Blocks system (helpers + templates) | `reference/BLOCKS.md` |

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

| Frame | Fill |
|---|---|
| Root frame | `semantic/background/neutral/inverse/normal` (#ffffff) via `VARS.cardBg` |
| Content frame | **No fill** (`fills = []`) — child components provide their own backgrounds |

---

## Gotchas

- **No IIFE wrapper** — `use_figma` runs code in async context; top-level `await` works
- **`appendChild` before `layoutSizingHorizontal`** — sizing props require auto-layout parent
- **`primaryAxisSizingMode` / `counterAxisSizingMode`** accept `"FIXED"` | `"AUTO"`, not `"HUG"`
- **Tab Basic** is a single component (`importComponentByKeyAsync`), not a component set
- **Button text** — set via `setInstanceText(btn, "Button", label)` after `appendChild`
- **Absolute positioning** — after `appendChild` in auto-layout, set `node.layoutPositioning = "ABSOLUTE"`
- **Date without time** — use `Type: "Text Regular"`, not `Date + time` (shows placeholder)
