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

### Class-not-symptom rule — applies to every fix this skill writes

When the user reports a bug, BEFORE writing any fix:

1. Ask: **"Is what they pointed at a single instance, or a symptom of a class of bugs?"**
2. If it's a class — the fix must close the class, not one instance.
3. Whack-a-mole patches (banning a specific phrase, fixing a specific number, hiding a specific node) are a sign the meta-thinking step was skipped.

Concrete examples of this failure mode that have happened in this codebase:

- User: "skill bypassed pre-flight via phrase X". Wrong response: ban phrase X. Right response: notice that the skill has agency to invent ANY rationalization phrase, and remove that agency by making the rule unconditional ("you do not assess materiality").
- User: "skill produced default text 'Label'". Wrong response: add 'Label' to a banned-strings list. Right response: notice that any defaults from any main component will leak, so audit must compare every instance against `mainComponent` defaults (Mode B).
- User: "skill placed section overlapping existing macket". Wrong response: tell the skill "don't overlap". Right response: require `findFreeCanvasSpot()` helper at every section creation, plus an audit check that walks page siblings.

The pattern: the user reports ONE example. The fix must reason "what's the class of bugs that produces this kind of example?" and close the class, not the example.

If the agent (or its maintainer) catches itself writing a fix that addresses ONLY the literal thing the user pointed at — that's a signal the class-thinking step was skipped, and the fix is incomplete.

This rule is permanent. It applies to every patch, every session, every maintainer. There is no "for this session only" version of it.

### Canonical-first build: match the source-file reference EXACTLY, do not invent dimensions

If a canonical version of the screen you're being asked to build exists somewhere — in the same source file, in a published library, in the design system — **find it first, capture its exact dimensions, and match them**. Do not "build with reasonable defaults" and call it good. The canonical reference IS the spec.

**The rule applies to every measurable property:**

| Property | What "match canonical" means |
|---|---|
| Frame width / height | Read canonical frame's exact `width × height`. Use those values. Do NOT pick a "universal" frame height (e.g. always 1100 or always 1300) — canonical heights vary per screen. |
| Background fill | Read canonical's `fills[0].color`. Use that exact RGB. Do NOT default to "subtlest grey" or "white" — KYB uses white, KYC uses subtlest grey, the canonical tells you which. |
| Component instance position | Read canonical instance `x, y`. Use those values. |
| Component instance dimensions | Read canonical `width × height` AFTER any post-instantiation resize. **Components have intrinsic variant heights, but canonical instances are often resized after `createInstance()` to a different per-screen height.** Use the canonical instance height, not the variant's intrinsic height. |
| Variant property values | Read canonical's `componentProperties` / `mainComponent.name` for each instance. Use the same variant. |
| Layout structure | If canonical wraps content in extra frames (e.g. Case page Pattern B has `Frame 270990504 → Subheader + Container`), reproduce the wrapper hierarchy. Do not flatten. |

**The recurring failure pattern:** skill inspects canonical (Phase 2 of the build log: "captured heights 698 / 706 / 800 / 824 / 856 / 1036 / 1712"), then **builds with hardcoded defaults that ignore the inspection** ("Per-row height = max(frameH) of screens in that row" → universal 1046 / 1100 / 1300). Capturing data and ignoring it is the same as not capturing.

**Procedure (must happen before STAGE 2 of the build):**

1. **Locate canonical.** For KYB → look in source file `9ii3Ueqr01mbLS3SE6bsrJ` sections (General flow, Company search, Company documents, etc.). For Case page → file `ieTGS0ab6tqr3zwXRYPHIu` Tabs section. For Applicant page → file `Di7nvHaOxXiWuDAN1oa0hK` Detailed design page. The pattern docs in `.claude/figma/*.md` name the canonical source per pattern.
2. **Build a canonical map** — for every screen you'll build, record:
   ```
   { screenLabel: "Find your company",
     frameW: 1440, frameH: 1046, frameBg: "#FFFFFF",
     componentVariant: "State=Find your company",
     componentX: 464, componentY: 32, componentW: 512, componentH: 800 }
   ```
3. **Build using the map values, not "reasonable defaults".** Every `frame.resize()`, `instance.resize()`, and `frame.fills` should reference a value from the map.
4. **Audit 7.45 verifies the match** — if a built frame's dimensions / fill / Window height don't match the canonical map within 2px tolerance, audit fails.

**Banned phrases in build logs** (signs the skill bypassed the rule):
- "Per-row height = max(frameH) of screens in that row" — invented, not canonical
- "Frame heights: 1046 / 1100 / 1300" — three universal values cannot match per-screen canonical heights
- "Background frame fill #F6F7F9 (light KYC-style bg)" applied to a KYB build — canonical KYB is #FFFFFF, this is cross-product contamination
- "Window heights: variant defaults" — canonical Window heights are post-resize, not intrinsic. Using defaults skips the resize step.
- "Reasonable default", "common pattern", "approximate the canonical" — the canonical IS the spec. There's no approximation; there's match or fail.

If the canonical reference is missing or ambiguous, **stop and ask the user**, do not invent values. "I built X but couldn't find canonical for screens 4, 10, 11, so I used 1300 for those" is not acceptable — surface the gap, get the user to point at the right canonical or accept the deviation explicitly.

### Canonical Body inspection: read the WHOLE content tree, not just the chrome

Most builds break because the skill inspects the chrome (Sidebar / Header / Body wrapper dimensions) but **does not walk into the canonical Body** to find out what's actually inside. Result: the skill outputs "generic" Body content (Tab Button + 3 Cards + Table) regardless of product, even when canonical Body has color pickers, illustrations, gradient settings, language selectors, blueprints, etc.

**Procedure — extend Canonical Map step 2:**

For each screen you build, after capturing chrome dimensions, walk the canonical Body and record EVERY child component:

```js
function walkBody(node, depth, lines, max) {
  if (lines.length >= max) return;
  const pad = "  ".repeat(depth);
  const main = node.type === "INSTANCE" && node.mainComponent ? node.mainComponent : null;
  let info = pad + node.type + ":" + node.name + " " + Math.round(node.width) + "x" + Math.round(node.height);
  if (node.type === "TEXT") info += " text=" + JSON.stringify((node.characters||"").slice(0,40));
  if (main) info += " key=" + main.key;
  lines.push(info);
  if (node.type !== "TEXT" && "children" in node && node.children) {
    for (const c of node.children) walkBody(c, depth+1, lines, max);
  }
}
const lines = [];
walkBody(canonicalBody, 0, lines, 100);
// Extend canonicalMap entry with bodyTree: lines
```

Then your build must reproduce **the same component sequence**. If canonical Body has:
- `Color Picker / Mini` × 4
- `Theme / Preview` × 3
- `*Select Color*` × 2

You build the same 4 + 3 + 2 in the same order, with `setProperties` to set the variants/text the canonical used. Don't substitute "Tab Button + Card + Table" because that's what other products have.

**Banned generic Body templates:**
- "title text + 3 input + 2 select" applied to a customisation editor (Appearance) → wrong, real Appearance has Color Picker / Theme Preview / gradient settings
- "Tab Button + Table Starter" applied to PoA Settings → wrong, real PoA has Collapsible Cards with toggles per preset
- "Title + 5 Collapsible Cards" applied to Question types editor → wrong, real Question types editor has paragraph/short text/date subsection cards with input previews inside

If a canonical component is FILE-LOCAL and skill cannot import its key, the skill MUST:
1. Check if equivalent published exists (Color Picker → `*Color Picker*` from Base, Theme Preview → maybe nothing — surface as gap)
2. If no published equivalent → **inline-build the visual pattern** from atomic components (frames + text nodes + bound semantic variables) matching canonical layout
3. Document the inline-build in audit report

### Never `throw new Error()` at the end of a build `use_figma` call

**Throwing at the end of a `use_figma` script that performs writes can roll back nested-instance text overrides and similar deferred mutations.** The whole script is treated as a transaction; the throw aborts and Figma reverts ambiguous writes (TEXT-inside-instance, instance-swap, setProperties on nested), leaving the file looking like nothing was built.

✅ **Use** `figma.notify("…")` to surface status messages back to the user — they appear as toasts and don't roll back.
✅ **Use** `throw new Error(...)` ONLY in **read-only audit scripts** to surface multi-line JSON back to the host (it's the only way to get long strings back through `mcp__figma__use_figma`).
❌ **Never** end a build script with `throw new Error("Built! id=...")` — the build will look like it succeeded in the response, but the Figma file will be missing the deferred writes (text overrides, swap targets, etc.).

If you need both build + reporting in the same call, structure as:
```js
// 1. Build everything
const root = figma.createFrame(); /* ... */ ;
// 2. Confirm via notify
figma.notify("Built " + root.id);
// 3. (Optional) verify in a SEPARATE use_figma call by reading the IDs back via throw new Error(...)
```

### File-local components: use `getNodeByIdAsync` OR Base components fallback (NEVER clone canonical)

Cross-file `importComponentByKeyAsync` / `importComponentSetByKeyAsync` only resolves PUBLISHED library components. **File-local components fail with "Component … not found"** when imported from another file.

When the catalog flags a component as file-local (look for `⚠ FILE-LOCAL` in product catalogs):
1. **Build inside the source file's Drafts page** — the component becomes accessible via `getNodeByIdAsync(nodeId)`.
2. **Fall back to Base components** with realistic data via `setProperties`. Document the fallback in the audit report.

> ⚠️ **Don't `canonicalInstance.clone()` to fill content.** A clone of the canonical IS the canonical — that's not a build, that's stealing. Skill output must be reproducible by importing components from published libraries + setProperties. If a fragment can only be reproduced via clone, the catalog has a gap and the user should be told.

### Skill-true builds: no clone of canonical content

If you build by `.clone()`-ing canonical fragments (Body / Content / wrapper / table data), you're NOT simulating the skill — you're copy-pasting the canonical. **A real skill run cannot do this.** The skill must:
- `importComponentByKeyAsync(key)` for every component
- `setProperties({...})` to fill text/variants/booleans
- Generate realistic data inline (10 rows, real names, real statuses) — not copy from canonical

If a needed component's key is file-local and there's no published equivalent, the skill MUST:
1. Pick a Base components fallback that fits the role
2. Note in the audit report that fallback was used (and which canonical component is missing)
3. Continue building — never bail out silently

### Base components fallback table

When a product-specific component is file-local, use these Base/Organisms equivalents:

| Canonical role | File-local example | Base fallback | Key |
|---|---|---|---|
| Generic data table | `Roles`, `Txn table`, `Table_Billing overview`, `Case table` | `*Table Starter*` | `213b7e3d7cc4503bbab83cd6c249e41e06dae295` |
| Settings card / metric card | `Card (Overview)` (Billing) | `Card` set | `4f02e07effac461a3dc35a659794017bd5a8c692` |
| Collapsible section card | `APCardCollapsible`, blueprint sections | `*Collapsible Card*` | `db0df8e75407eeebbf40e0762905eec0d3691851` |
| Toolbar / filters row | `Top Toolbar` (always published — use direct) | `Top Toolbar` | `fa8defc5fadd20a84c812784786217c6e0003ca0` |
| Sub-tab navigation | various product Tab Buttons | `*Tab Button*` | `8f7da8c5932abfc90cf27d9516a60a5e2c355195` |
| Page tab navigation | `Tab Basic / Item` (published) | `*Tab Basic*` | `8b7caf090f6d71e8892fb33f649cab470552dc83` |
| Form input | various | `*Input Basic*` | `984bd06621f139256149638f37d3ae22221a7ccc` |
| Dropdown select | various | `*Select Basic*` | `8c6e366aa04e78faf3beb584535554b77d47d11b` |
| Primary action button | various | `*Button*` | `2c388961efd7b1030f71704ad85f89ba4c4f68ed` |
| Block heading + actions | `Block Title` (published in some files) | text + button row | manual |

### Empty Body = audit FAIL

After the build, audit must verify Body has at least one content component (Card / Table / Collapsible Card / Tab Button / Input / Select). A skeleton with sidebar + header + empty Body is NOT a delivered mockup.

### Pre-build font loading (NEW v3.144 — MANDATORY first action of every use_figma write call)

**Before any `setProperties`, `setInstanceText`, or direct `.characters` write, you MUST load Geist fonts:**

```js
await figma.loadFontAsync({ family: "Geist", style: "Regular" });
await figma.loadFontAsync({ family: "Geist", style: "Medium" });
await figma.loadFontAsync({ family: "Geist", style: "SemiBold" });
await figma.loadFontAsync({ family: "Geist", style: "Bold" });
```

**Why:** Figma's text mutation API silently fails if the required font hasn't been loaded in the current `use_figma` execution context. Setting `.characters` or `setProperties({"Title text": "X"})` on a node that uses Geist Bold but no Bold style was loaded → no error, no warning, the text just doesn't change. Build looks correct in script flow but the delivered mockup shows default text.

**Observed Sonnet sim 2026-05-20 v3.143 retest:** agent reported "Sidebar Key_name (Geist Bold not loaded — silent fail)" + "Modal Basic Title (same root cause: Geist Bold missing)". Opus retest same day: no font issue because Opus loads fonts as first step reflexively.

**Banned (v3.144):**
- Writing `setProperties` / `.characters` before calling `loadFontAsync` for all Geist variants used in the build
- Reporting "Geist Bold not loaded — silent fail" as a known issue. If silent fail happened, you loaded it AFTER, then re-ran the mutation. Standard recovery: load fonts FIRST in every write chunk, no silent fails.

**Rule:** every `use_figma` call that performs ANY text mutation begins with the 4 `loadFontAsync` calls above. No exceptions, even if you "think" the font is loaded from a previous call — each `use_figma` call is a separate execution context.

### Default expansion + organism reuse (NEW v3.120 — class-fix from AP sim 2026-05-11)

**Two banned-class behaviors observed in v3.119 AP build, both close here:**

#### (a) Default-collapse-to-skip-content

When user asks for a product page (Applicant page / Case page / Transaction detail / KYB Level editor / etc.), default state of expandable cards is **`Collapsed=No` / `Expanded=Yes` (expanded), filled with real data**. NEVER default to `Collapsed=Yes` / `Expanded=No` to avoid filling content.

**This rule applies to ALL expandable-card families (v3.137 explicit):**
- AP `APCardCollapsible` (variant `Collapsed=Yes/No`)
- Base `*Collapsible Card*` (variant `Expanded=yes/no`)
- CM `Blueprint case content`
- KYB `Verification steps (KYB)` step cards
- ANY DS component with `Collapsed` / `Expanded` variant axis

Banned mental shortcut: "I'll set all cards Collapsed=Yes, user can ask me to expand specific ones if needed." That's content-skipping disguised as conservatism.

**Anti-loophole banned reasoning (v3.137):** "I'll set step cards `Expanded=no` so I don't have to fill the Content slot (avoids v3.135 'Card content' placeholder rule)." Gaming rules by switching to collapsed state to skip content = same banned class as v3.120 (a). Detected in KYB Level editor sim 2026-05-18 v3.136 — agent built 8 step cards all `Expanded=no` and self-flagged in JSON: "Critical v3.135 'Card content' bug = ABSENT (step cards are Expanded=no)". That IS the bug — different escape route, same content-skipping class.

Use `Collapsed=Yes` / `Expanded=No` ONLY when user explicitly says: "collapsed view" / "compact list" / "section headers only" / similar.

**Canonical-match rule:** if canonical for the section has cards expanded (height ≥ ~200 typically) → build must have them expanded too. If canonical has cards collapsed (height ~56 typically) → build collapsed. Match canonical's state, don't game it.

#### (b) Custom Row × N fabrication instead of DS organism

When card content is `Personal info` / `Profile information` / `Document` / `Selfie` / `Risk labels` / `Applicant notes` / `Events` / `Address` / `Phone verification` / `Email verification` / `AML Screening` — the DS has **dedicated organism components** for each (see `applicant-page-pattern.md` → "Organism-per-section map" and `ap-component-catalog.md`).

**Banned class:** building 5+ custom `Row` / `Field` / `DataList row` FRAME nodes inside a card to fake DataList structure. The DS organism already has those rows pre-built with the right Static data structure, Label + value + status icon + action Buttons, all bound to tokens.

**Procedure (must happen BEFORE building card content):**
1. **Check first if a single full-Body organism exists for the product** (e.g. AP has `Body` organism key `b7f51135fb0d86dd346af5587ec1d701703db6e5` — single composite with all 8 sections pre-filled). If yes → import that ONE organism instead of constructing 8 cards. Skip steps 2-6.
2. Identify the card's section type (Personal info / Document / Selfie / etc.)
3. Look up the matching AP / CM organism in `applicant-page-pattern.md` "Organism-per-section map" or in the relevant `*-component-catalog.md`
4. `importComponentByKeyAsync` or `importComponentSetByKeyAsync` for that organism
5. `createInstance()` → append into the card's Content frame
6. Set instance properties via `instance.setProperties({...})` — applicant.name, document.country, Status: "Approved", etc. **NEVER use `swapComponent` for variant property changes** — `setProperties` is the correct method. See `feedback_no_detach_instances.md`.
7. ONLY if no organism exists for the section type → fabricate custom Rows (last resort)

**Banned post-build question pattern:** "I built 56 custom Row frames — should I have used *Properties* / *DataList* instead?" If you find yourself about to ask this AFTER building, you skipped step 1-2. Roll back and rebuild using the organism.

**Audit check (added v3.120):** If Body contains ≥5 custom FRAME nodes directly under section cards matching `/^(Row|Field|Data ?Row|Static data|Property)/i` regex → audit FAIL with message: "Likely fabricated card content. Use AP organism from `applicant-page-pattern.md` Organism-per-section map instead."

**v3.143 extension — Custom Checkbox / Radio / Toggle imitations are banned.**

Live sim 2026-05-20 Billing Invoices retest: agent built `Modal Body / Pay invoice — card binding` local component containing 5 real `*Input Basic*` instances ✓ BUT also a custom `Checkbox Plate` — a 16×16 blue rectangle (`semantic/icon/blue/normal #1764ff`) with rounded corners, placed next to TEXT "Save card for future payments". This is a fabricated imitation of `*Checkbox*` DS instance.

Same agent built `*Checkbox*` INSTANCE properly inside Table Header (first column). Agent KNOWS the DS component, KNOWS how to use it — selectively fabricated imitation in Modal Body.

**Banned (v3.143):**
- Custom Rectangle / Frame 14-20×14-20px with rounded corners + adjacent TEXT, intended to look like a checkbox/radio/toggle, while `*Checkbox*` (`75d3375164e69aca223d08d09fd79e82dda14343`), `Radiobutton` (`7d3fe5b1e904f4e4a880092412543f40fdeacc60`), `*Toggle*` (`99562b687e3078c4a570af195c74a899fbbe83a4`) DS instances are available
- Custom shapes styled as form controls — always import the DS component instance

**Rule:** when you need a checkbox / radio / toggle visual in any form, modal, settings panel:
1. Import the DS instance (`*Checkbox*` for binary on/off, `Radiobutton` for option selection, `*Toggle*` for inline switch)
2. Set its variant via setProperties (Selected/Unselected, Type=Default)
3. Place next to the label TEXT

NEVER create a Rectangle or Frame imitation, even if it "looks the same". The DS instance is the source of truth; imitations break token bindings, hover/focus states, accessibility props.

**Audit check (added v3.143):** for every RECTANGLE / FRAME node ≤24×24 with cornerRadius > 0 + sibling TEXT containing keywords matching `/save|agree|confirm|enable|allow|accept|opt[- ]in|terms|consent|i (read|understand|accept|agree)/i` → audit warning: "Possible custom checkbox imitation at <node>. Use `*Checkbox*` DS instance instead." (warning, not fail — to avoid false positives on real decorative rectangles)

#### (c) Expanded-but-empty card with "should I add content?" question (NEW v3.121)

Third escape route in the same class: skill expanded all cards (per (a)) and didn't fabricate Row × N (per (b)), but **left the Content slots empty** and asked user "If you want content inside cards, tell me — I'll add". Same content-skipping disguised as caution.

**Banned behaviors v3.121:**
- Expanded card delivered with empty Content slot / hidden Slot placeholder / hidden `Slot component` TEXT
- Post-build question: "Я наполнил cards только заголовками + status. Если нужно содержимое — скажи, добавлю."
- Treating "hide the Slot placeholder" as equivalent to "fill the slot" — it's not. Hidden placeholder + empty Content frame is structurally identical to "skipped" content.

**Rule:** when you expand a card (`Collapsed=No`), you MUST populate its Content slot in the same `use_figma` chunk. The card is not "done" until its Content slot contains the organism instance from the section map. Splitting "expand cards" into one chunk and "add content" into a later chunk is a banned-class behavior — same content-skipping pattern.

**Slot-fill mechanics:** APCardCollapsible's Content area is either:
- A SLOT type child → `contentSlot.insertChild(0, organismInstance)` (NOT `appendChild` — slot semantics require `insertChild`)
- An INSTANCE_SWAP property → `cardInstance.setProperties({"<slotPropertyKey>": variant.id})`

Detect which by reading the property type on YOUR file's instance, not on canonical library's instance. Library and consumer file expose the same logical slot via different API surface — see Rule #4.45 in `websdk-mockup` for the same pattern.

**Audit check (added v3.121):** For every APCardCollapsible with `Collapsed=No`:
1. Find its Content frame / Content slot child
2. If empty (no INSTANCE child, only hidden placeholder TEXT) → audit FAIL
3. Message: "Expanded card '${cardName}' has empty Content slot. Populate via organism instance from the Organism-per-section map. Hiding the Slot placeholder ≠ filling the slot."

**v3.135 extension — applies to Base `*Collapsible Card*` too, not just AP `APCardCollapsible`:**

Live KYB Level editor sim 2026-05-18 v3.134: agent expanded 2 `*Collapsible Card*` (Base, key `db0df8e75407eeebbf40e0762905eec0d3691851`) with `Expanded=Yes`, left default `Card content` placeholder visible. Agent reported `audit_verdict: PASS — 0 user-visible residual` while screenshot showed `Card content` text twice on canvas.

Banned behaviors v3.135:
- Visible `Card content` text in any expanded `*Collapsible Card*` instance → FAIL
- `*Collapsible Card*` with `Expanded=Yes` and Content slot containing only the default placeholder TEXT or empty FRAME → FAIL

**Build rule:** when importing `*Collapsible Card*` (Base) with `Expanded=Yes`, fill its Content slot with real content matching the section type:
- KYB Level "General" card → form fields (level name input, description, WebSDK select, country settings) — match canonical `General / Default` organism (file-local) or build with Base form components
- KYB Level "Step" cards (Company data / Phone verification / etc.) → step-specific config fields matching canonical step screens

If you don't know what content goes inside an expanded card → check canonical source file for an expanded version of the same card type, OR ask user, but NEVER ship with `Card content` placeholder visible.

**Audit Mode A** catches `Card content` as banned string in `defaultTexts[]` (added v3.135).

**Banned question patterns:**
- "Если нужно содержимое внутри cards (Personal info / Applicant data instance, Document instance, Risk labels block с реальными labels), скажи — добавлю"
- "I only filled headers + status. Should I add content inside the cards?"
- "Want me to add the organism instances now, or is the expanded skeleton enough?"
- "Я могу заполнить cards organism instances если нужно"
- "Want me to also build the Documents block title (Body / Title) section above the verification cards, matching canonical pattern?" — same class. If canonical has Body / Title, build it by default, don't ask.
- "Want me to build [any other canonical structure] matching canonical pattern?" — if it's in canonical, build it.
- "OK that ID document / Selfie / Phone / Email cards show Status=Default in HeaderChecks instead of Approved?" — if your swap failed, fix it via `setProperties({Status: "Approved"})` and re-deliver, don't ship Status=Default and ask if it's OK.
- "Body width: keep at intrinsic 942px (current) or stretch to canonical 1060px (may distort inner cards)?" (v3.126) — canonical wins, always. Resize the organism to canonical width via `instance.resize(canonicalW, intrinsicH)`. "May distort inner cards" is not a valid concern when the organism is designed to be resized.
- ANY phrasing of the form "X (intrinsic) vs Y (canonical) — which do you want?" — canonical wins by default per v3.118 rule.
- "Want me to swap the static demo data (Germany / Mexico / sample dates / IP) for a coherent persona, or is the DS preset realistic enough?" (v3.126) — if the DS preset doesn't match the requested applicant (e.g. user said KYC and demo data is generic), swap by default. Don't ask permission to make data coherent.
- "Want a fuller step list using `Verification steps (KYB)` set variants?" (v3.136) — if canonical Verification steps section has step cards (Company data / Phone verification / Email / Questionnaire / Non-Doc / Associated parties / Company documents / Proof of address / etc.), build ALL of them. Don't ship only dividers and ask permission.
- "Кнопка X находится в строке заголовка страницы (title row внутри Content). Если по задумке она должна быть в шапке (Header компонент), скажи — перенесём." (v3.140) — page title + CTA always in Header per `layout-patterns.md` Pattern 1 v3.140 + `feedback_page_title_in_header.md`. Don't put CTA in custom Title Row, don't ask permission to move it later. Place in Header from the start.
- "Хочешь проверить, корректно ли отображаются данные?" / "Want to verify the data displays correctly?" (v3.140) — agent's job is to read back the build and verify itself, not ship and ask user to verify. Verification is part of "audit" step, not a permission-seek.
- "Таблица заполнена данными по-best-effort. Хочешь проверить?" (v3.140) — same as above. If data fill is best-effort and unverified, that's an incomplete build. Inspect via read-back BEFORE delivery, fix any mismatches, then deliver.
- "out of scope for this task" (v3.144) — observed Sonnet sim v3.143 retest: "filling 7 rows would require per-cell key inspection... out of scope for this task". User asked for an Invoices page with Pay flow; rows showing real invoice data are NOT out of scope, they're the page's primary content. "Out of scope" claim banned when the skipped work is the page's core content.
- "would require a separate pass" (v3.144) — separate passes are fine in build mechanics (transport-drop retries, font loading, etc.), but using this phrase to defer canonical content fill is banned. Do the pass.
- "per-cell key inspection... not in scope" (v3.144) — every Table Starter row Cell exposes properties via `componentProperties`. Walk cells, set them. Not out of scope.
- "Should the table rows show the actual N invoice records?" (v3.144) — if the page is about invoices, rows show invoice records. Don't ask permission to fill the page with its content.
- "Body height in build is X vs canonical Y — canonical had more step organisms below ... Want me to add them?" (v3.136) — if canonical has MORE content than your build, you under-built. Add the missing content by default.
- ANY "Want a fuller / more complete / longer / X-instance version?" question about canonical content — banned.

**v3.136 explicit rule — section completeness:**

If canonical for a section (e.g. KYB Level editor "Verification steps", AP page "Body cards list", CM Case page "Right column blocks") contains N organism instances, your build MUST contain N organism instances of the same type. Building only dividers or skeletons of a section that has populated organism instances in canonical = ship-incomplete, banned.

Examples:
- KYB Level editor canonical has Verification steps section with [Company data, Phone verification, Email verification, Questionnaire, Non-Doc, Associated parties, Company documents, Proof of address] step cards → your build must have ALL 8, not just 1 General + dividers
- AP page canonical has Body with 8 sections (Personal info, ID document, Selfie, Phone, Email, AML, Risk labels, Notes) → your build must have all 8 cards expanded with organism instances per Organism-per-section map
- CM Case page canonical has Right column with [Checklist, Notes, Applicant info, Case info] blocks → your build must have all 4

If you find yourself about to write any of these AFTER expanding cards — you didn't finish the build. The skill is not delivered until the user sees actual content inside expanded cards AND status variants reflect realistic verification states.

**MCP transport-drop retry rule (v3.123):** when `createInstance` or `setProperties` on a large organism (Body, Document, Address) fails with "MCP transport dropped" or "internal timeout":
1. Retry up to 3 times with 1s delay between attempts
2. If all 3 retries fail → ask user explicitly: "MCP transport keeps dropping on [organism name]. Continue with inline fallback or pause for transport recovery?"
3. **Do NOT silently fall back to inline content** without user awareness. Silent fallback turns a transport issue into a canonical-deviation defect (Row × N inline disguised as "transport-driven fallback").

### Mandatory audit step at end of every build (no exceptions)

**Every `/sumsub-mockup` invocation MUST end with an audit pass.** The skill is not "done" until audit returns PASS. Skipping audit and just delivering a URL = bug.

**Required audit checks (run all, in order):**

1. **Default-text leak scan — TWO modes (visible TEXT only).**
   - **Mode A: short-stub strings.** Find every TEXT node WHERE `visibleToRoot()` is true AND `characters` matches: `Label`, `Title`, `Subtitle`, `Slot component`, `Text`, `Caption`, `Placeholder`, `Button`, `Number`, `Tab`, `Item`, `123`. Also Sumsub-DS-specific organism placeholder strings: `Key_name`, `Key name`, `ClientNickname`, `Client name`, `Organization`, `Org_name`, `Org name` (v3.129). Plus form-control defaults: `Radio button`, `Radiobutton`, `Checkbox`, `Check box` (v3.130). Each is a FAIL.
   - **Mode B (added v3.84): main-component-default comparison.** For every INSTANCE, walk its mainComponent's TEXT children, build a map `name → defaultCharacters`. Then walk the instance's TEXT children — if an instance TEXT has the **same name AND same characters** as the mainComponent's default, it's a LEAK. This catches long plausible-looking placeholders that Mode A misses, e.g. Title component shipping with `"Select type and issuing country of your "` — Mode A doesn't match `Title`/`Label`/etc., but Mode B sees the instance text == main's default text → FAIL.

   Reason Mode B exists: live user testing on Connect (May 2026, v3.83) — agent claimed `default_text_leaks_fixed: 4` and audit returned PASS, but the Title instance kept its main's default `"Select type and issuing country of your "` because Mode A's banned-strings list didn't include that exact phrase. Mode B (compare with `instance.mainComponent.children`) catches it deterministically without needing a curated string list.

   ```js
   // Mode B implementation sketch (v3.128: structural-DS-label exclusion)
   //
   // Key refinement v3.128: only flag a TEXT as leak if the mainComponent EXPOSES
   // a TEXT property bound to that node. If no property exposed → the text is a
   // fixed structural DS label (block title "AML checks", section header
   // "Applicant", etc.) and is REQUIRED to keep the default value across all
   // instances. Flagging it as a leak is a false positive — overriding would
   // damage the design system, not fix it.
   //
   // Detection: walk the instance's componentProperties; for each property of
   // type TEXT, the property's `boundVariables`/binding metadata or
   // mainComponent definition reveals which TEXT node it controls. If the
   // current TEXT node is one of those bound nodes → it's a content placeholder,
   // can be flagged when at default. If NOT bound to any property → it's a
   // structural label, skip.
   //
   // Simpler heuristic (use until full property-binding walk is available):
   // build the set of `boundTextNodeNames` by reading mainComponent property
   // descriptors. Only flag TEXT nodes whose name is in that set.
   async function modeB(root) {
     const fails = [];
     async function walk(n) {
       if (n.type === "INSTANCE" && n.mainComponent) {
         const main = n.mainComponent;
         const defaultsByName = {};
         function collectDefaults(node) {
           if (node.type === "TEXT") defaultsByName[node.name] = node.characters;
           if ("children" in node && node.children) for (const c of node.children) collectDefaults(c);
         }
         collectDefaults(main);

         // v3.128: determine which TEXT nodes are exposed as instance properties.
         // Only those are "content placeholders" — others are structural labels.
         const exposedTextNodeNames = new Set();
         try {
           const props = n.componentProperties || {};
           for (const [propKey, propVal] of Object.entries(props)) {
             if (propVal?.type === "TEXT") {
               // Property key format varies; the inner TEXT node's name often
               // matches the property's stripped name. Best-effort: derive name
               // from propKey (strip "#NNN:N" suffix) and check both forms.
               const cleanKey = propKey.replace(/#\d+:\d+$/, "").trim();
               exposedTextNodeNames.add(cleanKey);
               // Also accept the literal mainComponent node name match later in walk.
             }
           }
         } catch(e) { /* fall back to flagging all defaults if property walk fails */ }

         function checkInstance(node) {
           if (node.type === "TEXT" && node.visible !== false) {
             const def = defaultsByName[node.name];
             if (def && def === node.characters && def.trim().length > 0) {
               // v3.128: skip if this TEXT node isn't exposed as an instance property.
               // Structural labels (no property binding) are required-default.
               // Note: if exposedTextNodeNames is empty (no TEXT props at all),
               // the component doesn't expose any text overrides — treat all
               // defaults as structural and skip. This handles TM organisms
               // (Customers card / Finance, AML checks, etc.) that have only
               // VARIANT properties.
               if (exposedTextNodeNames.size === 0) return;
               if (!exposedTextNodeNames.has(node.name)) return;
               fails.push({path: getPath(node), name: node.name, value: node.characters});
             }
           }
           if ("children" in node && node.children) for (const c of node.children) checkInstance(c);
         }
         checkInstance(n);
       }
       if ("children" in n && n.children) for (const c of n.children) await walk(c);
     }
     await walk(root);
     return fails;
   }
   ```

   Skill MUST run both modes. Mode A is a fast heuristic; Mode B is the deterministic check **on exposed-property TEXT nodes only** (v3.128 refinement).

   **v3.128 refinement — why Mode B was overcounting:** original Mode B flagged ALL TEXT nodes whose value matched mainComponent default. For DS organisms with structural labels (TM `Customers card / Finance`, `AML checks`, `Properties`, `Matched rules`, `Events Block`, `Transaction details`, AP `Profile information`, etc.), block titles and section headers are REQUIRED to match the default across every instance — they ARE the structural design. Flagging them creates false-positive leaks.

   TM Transaction detail sim 2026-05-13 v3.127: Mode B reported 54 "leaks", all of which were correct DS structural labels (block titles `AML checks` / `Properties` / `Matched rules` / `Events` / `Transaction details` / `Notes`; section headers `Applicant` / `Institution` / `Payment method`). Agent self-identified: "Overriding these to non-DS strings would break the design system, not fix it."

   Mode B v3.128 now skips TEXT nodes that are NOT exposed as instance properties — these are structural-label defaults, not content placeholders. Only flag TEXT nodes whose name maps to a TEXT property in `instance.componentProperties`.

   - **Mode C (added v3.86): default property leak — variants, booleans, instance-swaps.** For every imported INSTANCE, compare its `componentProperties[k].value` with the mainComponent's default value for that property. If equal AND the property controls VISIBILITY of a child (BOOLEAN named like `Show*` / `*Visible*` / slot toggle) OR controls VARIANT selection — that's a leak. The instance shipped "with default state" instead of being configured for this specific build.

   Reason Mode C exists: live Sim 2 v3 (Connect MiniPay) — Title/Subtitle/Tips texts were correctly overridden, but `Sumsub ID / Connect / Logos` instance was left at default variant which HIDES the main 72×72 logos and SHOWS a small 49×24 mini-bar. Audit Mode A and B passed because no TEXT was on default; audit said PASS while the Logos block visually had wrong content showing. Same with Tips items: ID-icons hidden, generic Dot visible — default property choice.

   Mode C is a **warning**, not always a hard FAIL — sometimes the canonical IS the default. But skill must report Mode C findings: "Instance X is using its component's default for properties Y, Z. If canonical for this screen uses different values, override them."

### Match canonical's PATTERN, not its CONTENT

The skill's job is NOT to clone canonical 1:1. It builds NEW screens based on existing patterns — qualitatively right, maximally similar in structure and visual logic, but with new context-specific content.

Split every component's properties into two classes:

**Pattern properties** (copy from canonical):
- VARIANT selectors — define the structural layout (`State=Have docs`, `Layout=Two columns`, `Type=Compact`)
- BOOLEAN visibility toggles that control layout — `Show Logo`, `Show Counter`, `Show Subtitle`, `Show Description`
- BOOLEAN feature toggles that change pattern — `With Avatar`, `With Footer`, `With Search`

These define the visual/structural pattern. If canonical Logos has variant set to "show large 72×72 logos with repeat icon between", the new build's Logos must use the same variant — otherwise the pattern breaks (mini-bar appears instead).

**Content properties** (new for this build, NOT copied from canonical):
- TEXT properties — partner name, screen title, button labels — must reflect the new context
- INSTANCE_SWAP properties — specific icon/logo target — replace with the new build's asset (MiniPay logo, not Noah logo)

```js
// Build inspects canonical instance once
const canonical = canonicalRoot.findOne(n => n.name === "Sumsub ID / Connect / Logos");
const main = canonical.mainComponent;
const propDefs = main.componentPropertyDefinitions;

// Create new instance from same component
const newInstance = main.createInstance();
const propsToSet = {};

for (const k of Object.keys(canonical.componentProperties)) {
  const propType = propDefs[k]?.type;
  const canonicalValue = canonical.componentProperties[k].value;

  if (propType === "VARIANT" || (propType === "BOOLEAN" && /^(Show|With|Display)/i.test(k))) {
    // Pattern property — copy from canonical
    propsToSet[k] = canonicalValue;
  }
  // TEXT and INSTANCE_SWAP — leave for content-override phase
}
newInstance.setProperties(propsToSet);

// Then override CONTENT for the new build context
// (TEXT properties = your specific copy; INSTANCE_SWAP = your specific assets)
```

If you can't tell whether a property is pattern or content (BOOLEAN with ambiguous name like `Optional`, `Required`), default to copying from canonical. It's safer — you preserve the pattern.

**Why Mode C above is a WARNING not FAIL:** instances using defaults are sometimes correct (canonical IS default for that property). The pattern-vs-content split tells the skill when to override and when to leave alone. Mode C surfaces the warning; this rule tells the skill what to do about each finding.
2. **Default-property leak scan.** Walk every INSTANCE, read `componentProperties`, flag any TEXT-type property whose value is `Label` / `Title` / `Number`.
3. **Empty Body check** (rule above).
4. **Visible-content check (added v3.81 — DO NOT skip).** For every imported content component (Block wrapper, Partners Wrapper, Card, Table Starter, Collapsible Card, Tab Button — anything that's not chrome) verify `visible === true` AND `visibleToRoot() === true`. If a content component has `visible=false`, audit FAILS — even if its TEXTs are correctly overridden. Default-text scan operating on visible-only TEXTs misses leaks INSIDE hidden subtrees, so it cannot substitute for this check. **Reason this rule exists:** in Sim 1 (v3.80) the build accidentally hid Partners Wrapper via a Stage 4 retry loop using stale node references; default-text audit returned PASS because no TEXT was visible to scan; user opened the macket and saw a sidebar + empty right side.
5. **Visual-fill check (added v3.81).** Body's content area must contain visible component instances totalling ≥40% of Body height (sum of visible content INSTANCE heights / Body height). If <40%, FAIL with message "Body looks sparse — likely missing blocks vs canonical (e.g. canonical had 3 sections, you placed 1)". Acceptable below 40% only if canonical Body itself is that sparse (rare — verify against canonical Body walk).
6. **Canonical-match check** (rule 7.45 — frame W/H, fill, instance pos/dims/variant within 2px tolerance vs canonicalMap).
7. **Body content match** (canonical Body walk — same component sequence as canonical).
8. **Layout-sanity check (added v3.145 — class-fix from Billing sim 2026-05-22).** For every screen frame containing both a `*Sidebar*` instance and a sibling Main/Content frame, assert:
   - `Sidebar.x + Sidebar.width === Main.x` (no overlap, no gap)
   - `Sidebar.y === 0`
   - `Sidebar.height >= Main.height`

   Any violation = FAIL. This catches structural-overlap bugs that TEXT-leak / visibility / empty-body checks cannot see (they only inspect rendered content, not absolute positions).

   ```js
   function layoutSanity(root) {
     const fails = [];
     function walk(n) {
       if (n.type === "FRAME" && n.children) {
         const sidebar = n.children.find(c => c.type === "INSTANCE" && /\*Sidebar\*/.test(c.name));
         const main = n.children.find(c => c !== sidebar && (c.name === "Main" || c.name === "Content" || c.type === "FRAME"));
         if (sidebar && main) {
           if (sidebar.x + sidebar.width !== main.x) {
             fails.push({frame: n.name, issue: `Sidebar ends at x=${sidebar.x + sidebar.width}, Main starts at x=${main.x}`});
           }
           if (sidebar.y !== 0) fails.push({frame: n.name, issue: `Sidebar.y=${sidebar.y}, expected 0`});
           if (sidebar.height < main.height) fails.push({frame: n.name, issue: `Sidebar.h=${sidebar.height} < Main.h=${main.height}`});
         }
       }
       if (n.children) for (const c of n.children) walk(c);
     }
     walk(root);
     return fails;
   }
   ```

   **Reason Patch B exists (v3.145):** Billing sim 2026-05-22 v3.143 shipped Frame `11941:11077` with Sidebar at x=0/w=257 and Main at x=230 — 27px overlap. Audit returned PASS because no TEXT leak, no empty body, no hidden content. Three integer comparisons would have caught it deterministically.

9. **Pattern B (Case detail) layout integrity check (added v3.146 — class-fix from CM sim 2026-05-22; IMPLEMENTED in the verbatim audit script as check 7.44, v3.148).** This checklist item is now folded into the runnable audit script's 7.44a–e block (post-drift canonical values + wrapper-height + Tab-Basic-x assertions). It runs automatically when the script encounters a `Case page header` instance — no separate action needed. Listed here for documentation. When `productContext === "case-management"` AND build matches Pattern B signature (Sidebar 52 + Case page header + Frame 270990504), 7.44 verifies:
   - **Frame 270990504 height === 812** (NOT auto-grown to wrap Container content). If wrapper height > 900, the build forgot `layoutSizingVertical = "FIXED"` — wrapper hugged the 2400+px Overview content. FAIL.
   - **`*Tab Basic*` inside Subheader has x === 32** (left-aligned per canonical), not floating at ~224. If x > 50, the Tab Basic was not set to `layoutSizingHorizontal = "FILL"` and the Subheader's CENTER alignment centered the HUG-sized strip. FAIL.
   - **Frame 270990504.x === 52** AND **Case page right column.x === 1016** (current v3.146 canonical, post-drift). FAIL if any differ — likely the recipe was built from the pre-v3.146 doc which had wrapper at x=0 and right col at x=992.

   ```js
   function patternBLayoutIntegrity(root) {
     const fails = [];
     const wrapper = root.findOne(n => n.name === "Frame 270990504");
     if (!wrapper) return fails; // not a Pattern B build
     if (wrapper.height > 900) fails.push({frame: "Frame 270990504", issue: `height=${wrapper.height}, expected 812 (wrapper grew because layoutSizingVertical not FIXED)`});
     if (wrapper.x !== 52) fails.push({frame: "Frame 270990504", issue: `x=${wrapper.x}, expected 52 (canonical drift v3.146)`});
     const subheader = wrapper.findOne(n => n.name === ".Header Full Screen Page / Subheader");
     if (subheader) {
       const tabBasic = subheader.findOne(n => n.name === "*Tab Basic*");
       if (tabBasic && tabBasic.x > 50) fails.push({frame: "*Tab Basic*", issue: `x=${tabBasic.x}, expected 32 (Tab Basic centered instead of FILL)`});
     }
     const rightCol = root.findOne(n => n.name === "Case page right column");
     if (rightCol && rightCol.x !== 1016) fails.push({frame: "Case page right column", issue: `x=${rightCol.x}, expected 1016 (canonical drift v3.146)`});
     return fails;
   }
   ```

   **Reason check #9 exists (v3.146):** CM sim 2026-05-22 v3.145 built Frame `13634:172468` with wrapper height 2552 (canonical 812 — 3× growth, page renders 3× longer than designed) and Tab Basic at x=224.5 (canonical 32 — tabs visually centered instead of left-aligned). Both regressions were invisible to checks 1-8: no TEXT leak, no overlap (Sidebar 0/52 + Wrapper 52 stays aligned), no hidden content. Three integer comparisons specific to Pattern B catch both deterministically.

**Fix-loop, not detect-only.** If any FAIL: skill must attempt to fix via setProperties (set realistic values from prompt context, or "[needs review]" placeholder if no realistic data is inferrable). Then re-audit. Repeat up to 3 iterations. After 3rd iteration if still FAIL — surface the residual failures to the user with a clear "I cannot fix these without you specifying X / Y" message instead of pretending it's done.

**Audit verdict goes into the response.** Final reply to the user must include: `Audit: PASS | FAIL — [count] leaks fixed, [count] residual` and URL only emitted on PASS or with explicit FAIL acknowledgement.

**URL verification before emit (added v3.145 — class-fix from Billing sim 2026-05-22).** Before formatting and returning the final URL:

1. Capture the **actual** root frame's `.id` from the last build's `use_figma` return value.
2. Verify the node exists by calling `mcp__figma__get_metadata` with that `nodeId`. If the response includes an error ("node not found") — the URL would 404. Surface as FAIL, do not deliver.
3. Format the URL strictly as `https://www.figma.com/design/<fileKey>/?node-id=<id-with-dash>` where `<id-with-dash>` is the actual id with `:` replaced by `-`. **Never** invent, paraphrase, or cache a node id from earlier intermediate frames.

**Reason Patch C exists (v3.145):** Billing sim 2026-05-22 v3.143 returned `url: …?node-id=11906-7109`. That node did not exist in the file — the actual built section was `11940:10710`. Self-reported node id diverged from reality. One `get_metadata` call before emit would have caught the hallucination.

**Banned skill-output patterns:**
- "Macket built. URL: ..." with no audit mention → bug
- "audit_verdict: SKIPPED" in any sim log → bug
- Default text "Label" / "Title" visible in delivered macket → bug
- Sub-agent saying "the build doesn't introduce custom TEXT so I skipped audit" → wrong, audit covers default leaks INSIDE imported instances too
- Audit `PASSED (0 issues)` while the built macket has hidden content components → audit was incomplete; check 4 (visible-content) was skipped

### Retry/walk loops: compare nodes by `.id`, never by reference equality

**Bug class** (caught in Sim 1, v3.80): retry/walk loops use a captured node reference and compare with `node !== savedReference` to "skip the special node we already configured". Between iterations the skill `await`s some MCP call which may invalidate the in-memory node object — even though the underlying Figma node still exists with the same `.id`. The next iteration's children list contains a DIFFERENT JS object representing the same node, the `!==` comparison returns `false` (i.e., the special node is NOT skipped), and the loop body runs on it. If the loop body sets `visible = false` to hide siblings, it accidentally hides the kept node too.

**Symptom:** the macket "loses" content between Stage 3 (where it was visible) and Stage 4 (where it isn't). Audit's default-text scan can't see the leaked default texts inside the now-hidden subtree, so audit returns PASS. The user opens the file and sees a skeleton.

**Rule:** When iterating children to apply visibility/state changes, capture the keep-node by `.id` BEFORE the await chain, then compare by id:

```js
// ❌ WRONG — reference comparison breaks across awaits
const keepNode = body.findOne(n => n.name === "Partners Wrapper");
for (const child of body.children) {
  await something(child);   // any await may invalidate node references
  if (child !== keepNode) {  // FALSE-POSITIVE: keepNode object is stale
    child.visible = false;
  }
}

// ✅ CORRECT — capture .id, compare by id
const keepId = body.findOne(n => n.name === "Partners Wrapper").id;
for (const child of body.children) {
  await something(child);
  if (child.id !== keepId) {
    child.visible = false;
  }
}
```

This applies to ALL retry/walk loops in build scripts, not just visibility toggles. Property overrides, swap operations, or any iteration that captures a "do not modify this one" reference must use `.id`.

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

7. **If `yes` / `update`:** run `Bash` with `claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design`. On Bash success, continue with the task — Claude Code reloads plugin SKILL.md on the next tool call automatically, no restart required. On Bash failure, surface the exact stderr and fall back to asking user to run manually.

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
- "Per 'work without stopping', I'll proceed with the local version and surface this at the end" (v3.124 observation — quoting an outer directive in quotes does NOT override pre-flight)
- "I'll proceed with the local version and surface this at the end"
- "newer version available — surfacing at the end"
- ANY phrasing of the form "[outer directive said X], proceed with old version, mention at end"

**No outer-context directive overrides this pre-flight (NEW v3.124):**

Auto mode, "work without stopping", "minimize interruptions", "prefer action over planning", non-interactive mode, any harness-level instruction the user or system may have set globally — **none** override the version-check pre-flight inside this skill. This rule is local-scope and takes precedence inside `/sumsub-mockup` (and all other sumsub-design skills) regardless of what the outer system says.

If you find yourself about to write "Per [outer directive], I'll proceed and surface at the end" — that IS the banned class. Quoting the directive does not make the bypass legitimate. Stop, run the verbatim STOP message in step 5 above, wait for user.

If local plugin.json read or remote WebFetch fails (network / file missing), warn once in your response ("could not verify plugin version, proceeding on faith") and continue — don't block on infrastructure issues, but make the failure visible.

0. **Ask WHERE to create the mockup — HARD STOP, WAIT for the answer.**

   **Exception (URL-in-prompt = explicit destination):** If the user's prompt contains a full Figma URL like `https://www.figma.com/design/<fileKey>/...`, that URL **IS** the answer to "where". You do NOT hard-stop. You:
   1. Extract the fileKey from the URL
   2. Notify the user inline: `Building in <fileKey>, Drafts page` — one line, not blocking
   3. Proceed to step 1 (libraries check) using that fileKey
   4. The default page inside the file is the existing Drafts page (matched via `/drafts/i`); if absent, create `🛠 Drafts`
   5. If the user wants a specific section/frame inside that file, they'll say so in the prompt; otherwise the new section goes onto the Drafts page

   This exception covers "Build X. Файл: https://figma.com/design/abc/..." prompts which are common in testing and routine work. Hard-stop applies only when the prompt has NO URL and NO explicit location.

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

1. **Check libraries BEFORE starting.** Call `get_libraries(fileKey)` to see which Figma libraries are connected. This call is MANDATORY — it must happen before the very first `use_figma` call. For known Sumsub products the required libraries are:

   | Product | Required libraries |
   |---|---|
   | Flow Builder | Organisms [Dashboard UI Kit], Base components [Dashboard UI Kit], Assets |
   | Applicant page | Applicant-page-and-Tasks-components (`QKXZwWodIwPVsjAjj4gMnE`), Organisms, Base components, Assets |
   | Table / Detail pages | Organisms, Base components, Assets |
   | Transaction Monitoring | TM Components (`jH0zp9iwzizayCPZNggytx`), Organisms, Base components, Assets |

   If a required library is missing — STOP and ask the user to connect it. Do not proceed with invented structures.

   **⛔ Banned bypass phrases for the library check — if you're about to say any of these, stop and actually call `get_libraries()` first:**
   - "I'll proceed without checking libraries since this is a standard flow"
   - "libraries are likely already connected"
   - "I checked the file earlier" / "libraries were connected in a previous session"
   - "let me start building and check libraries later"
   - "skipping library check since I know which components to use"
   - Any phrasing that implies the library check is optional or already done without evidence of a `get_libraries()` call in THIS session.

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
   | Transaction Monitoring (any TM screen) | `${CLAUDE_PLUGIN_ROOT}/reference/figma-gotchas.md`, `${CLAUDE_PLUGIN_ROOT}/reference/tm-layout-patterns.md`, `${CLAUDE_PLUGIN_ROOT}/reference/tm-component-catalog.md`, **AND** `${CLAUDE_PLUGIN_ROOT}/reference/products/sumsub-docs-transaction-monitoring.txt` — ALL FOUR required via explicit `Read` calls. The first three are in CLAUDE.md context but must still be explicitly read. The fourth is never pre-loaded. |
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

   **⛔ "It's already in my context" is a banned rationalization — for ALL product-docs rows.** Some layout reference files (`tm-layout-patterns.md`, `ap-component-catalog.md`, `case-management-pattern.md`, etc.) are pre-loaded via CLAUDE.md. Product docs (the `.txt` files in `reference/products/`) are NEVER pre-loaded. Context presence of a layout file does NOT mean the product-docs requirement is met. An explicit `Read` tool call on the `.txt` file is required every time — no exceptions.

   | Task keywords | REQUIRED READ (from `${CLAUDE_PLUGIN_ROOT}/reference/products/`) |
   |---|---|
   | domain, SSO, single sign-on, SAML, OIDC, IdP, provisioning, team roles, account, billing, verification levels overview, dashboard | `sumsub-docs-overview.txt` |
   | KYC, applicant, ID doc, selfie, biometric, liveness, address proof, phone check, email check, questionnaire, payment check, reusable identity | `sumsub-docs-user-verification.txt` |
   | fraud, device intelligence, risk score, blocklist, IP check, antifraud | `sumsub-docs-fraud-prevention.txt` |
   | KYB, business verification, UBO, ownership, AML watchlist, adverse media, corporate doc | `sumsub-docs-kyb.txt` |
   | transaction monitoring, TM, rule, travel rule, crypto, VASP, wallet, payment flagging | `sumsub-docs-transaction-monitoring.txt` |
   | case management, queue, compliance officer, blueprint, SAR, STR, investigation | `sumsub-docs-case-management.txt` |
   | workflow, verification level, verification step, automation, marketplace, condition, action, review step | `sumsub-docs-workflow.txt` |

   > ⚠️ **TM has TWO mandatory read groups that are completely different and neither substitutes for the other:**
   > - **Group A — Figma layout references** (`tm-layout-patterns.md`, `tm-component-catalog.md`): component keys, canvas dimensions, pattern variants, sidebar widths. Tells you *how to build the frame structure*.
   > - **Group B — Product docs** (`sumsub-docs-transaction-monitoring.txt`): what TM does as a product — rules, risk scoring, VASP screening, travel rule, crypto typologies, monitoring modes. Tells you *what content, labels, fields, and flows to put in the mockup*.
   >
   > **Reading Group A does NOT satisfy Group B.** If your task involves any TM keyword, you MUST read BOTH groups. Saying "I read `tm-layout-patterns.md`" when asked about product-docs compliance is a build violation equivalent to not reading either file. If your build log for a TM task doesn't show `sumsub-docs-transaction-monitoring.txt` — the build is non-compliant.
   >
   > ⛔ **The "it's already in my context" rationalization is explicitly banned:**
   >
   > `tm-layout-patterns.md` and `tm-component-catalog.md` are loaded into every session via CLAUDE.md. They are always in context. This is irrelevant. Context presence does NOT constitute a Read-tool call, and the two files cover Figma structure — NOT product knowledge.
   >
   > `sumsub-docs-transaction-monitoring.txt` is NEVER in CLAUDE.md and NEVER pre-loaded. It requires an explicit `Read` tool call every time. If you find yourself thinking "I already know the TM layout from context, so I'm good" — you've already fallen into the trap. The layout reference being in context tells you how to build frames. It says nothing about what a TM rule is, what risk levels mean, what fields a travel-rule transaction has, or how VASP screening works.
   >
   > **Banned internal monologue patterns (all are the same rationalization in disguise):**
   > - "I have tm-layout-patterns.md in context from CLAUDE.md — that covers the TM reference requirement"
   > - "The TM component catalog is loaded, so I'm ready to build"
   > - "I know TM from previous sessions / previous tasks in this session"
   > - "The user's brief describes the feature well enough, I don't need to read docs"
   > - Any reasoning that gets from "TM task detected" to "starting build" without an explicit `Read` call on `sumsub-docs-transaction-monitoring.txt` showing up in the tool use log.

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

   **Sidebar + Header org-name slots — MUST be overridden (NEW v3.129):**

   `*Sidebar*` ships with `Key_name` default in its top org-name slot. `*Header*` ships with `Key name` default in the secondary text (subtitle / breadcrumb area). Both are placeholders, NOT structural labels — every delivered mockup must override them. Live observation 2026-05-13 (TM Transactions table sim v3.128): both `Key_name` (Sidebar top-left) and `Key name` (Header subtitle) shipped as defaults, audit returned PASS — false positive.

   Required steps when importing Sidebar / Header:
   1. **Sidebar:** find the org-name TEXT property (varies by Sidebar variant — look for `Key_name` / `Org name` / `Client name` style property keys in `componentProperties`). Override with realistic value like `Sumsub`, `Acme KYC`, `Demo Client`, or the user's specified client name.
   2. **Header:** override `Subtitle text#3817:3` and any `Key name` slot. Set `Subtitle#3817:6 = true` if showing a subtitle.
   3. After the build, verify by reading back `instance.findOne(n => n.type === "TEXT" && /^(Key_name|Key name|ClientNickname|Client name)$/.test(n.characters))`. If found → fix and re-deliver. Audit Mode A v3.129 catches these strings now.

   **Banned audit pattern:** reporting `default_text_leaks_fixed: 15, final: 0, verdict: PASS` while `Key_name` or `Key name` is still visible. Sample-check the SCREEN, not just the JSON.

   **walkAndReplace fallback when setProperties doesn't expose Key_name (v3.142):**

   When the Sidebar variant doesn't expose `Key_name` as a top-level `componentProperties` TEXT (e.g. Sidebar `Type=Billing`, `Type=Settings` — observed v3.141 Billing Invoices sim claiming "DS limitation"), agent MUST try `walkAndReplace` pass on all nested TEXT nodes BEFORE writing `audit_signature` with leak as residual.

   ```js
   // walkAndReplace fallback — successfully used in v3.129 TM Transactions table sim
   function walkAndReplace(node, replacements) {
     if (node.type === "TEXT") {
       const matchKey = Object.keys(replacements).find(k => node.characters === k);
       if (matchKey) node.characters = replacements[matchKey];
     }
     if ("children" in node && node.children) {
       for (const c of node.children) walkAndReplace(c, replacements);
     }
   }
   walkAndReplace(sidebarInstance, {
     "Key_name": "Sumsub",
     "Key name": "Sumsub",
     "ClientNickname": "Demo Client",
     "Client name": "Demo Client",
   });
   ```

   Direct `.characters` override on nested instance TEXT generally works for placeholder strings (verified working v3.129). If THIS specific TEXT node is protected (cannot be edited even via `.characters`), only THEN claim "DS limitation" in residuals with explicit note: `"DS limitation: walkAndReplace tried, .characters write didn't persist on protected nested TEXT inside <component path>"`.

   **Banned (v3.142):** claiming "DS limitation" without first trying walkAndReplace fallback. Agent in v3.141 Billing Invoices sim claimed `Key_name` "DS limitation" but didn't try walkAndReplace despite using it successfully in earlier sim (v3.129 TM Transactions).

6. **Main content area is always white**, bound to `semantic/background/neutral/inverse/normal`. Never grey, never transparent. Page root stays subtlest grey (`#f6f7f9`), but every content-surface frame must be explicitly white (`#ffffff`).

   **Frames that MUST have a white fill (never leave transparent):**

   | Pattern | Frames requiring explicit white fill |
   |---|---|
   | Standard list/table (Pattern 1) | `Content`, `Page Content` |
   | Applicant / Detail page (Pattern 2) | `Body`, `Content` |
   | Case detail (Pattern B) | `Body`, `Container`, left wrapper frame |
   | TM Transaction detail (Pattern 4) | **`Body`**, **`Columns`**, **`Main column`**, **`Right panel`** |
   | TM Rule editor (Pattern 3) | `Main content`, `Content` |
   | Any builder page | The main editing surface frame |

   ⚠️ **A transparent frame is not the same as a white frame.** Transparent frames inherit the root's grey (`#f6f7f9`) and make the entire screen look grey. You MUST explicitly set each content-surface frame's fill to the white variable — do not rely on inheritance from a parent.

   ⛔ **Banned rationalization:** "The frame has no fill so it's transparent, which is fine — the parent will be white." This is wrong if the parent is also transparent, or if the root is grey.

7. **Fill with realistic data — always.** Tables: 10 rows with plausible names, dates, IDs, statuses (mix, not all "Approved"). Inputs: meaningful label + placeholder. Status badges: realistic distribution. Dates in DS format. NEVER leave default "Table cell", "Label", "Placeholder", "ID" text.

   **TM component instances require explicit text overrides — no component ships with realistic data by default.** For every TM component you create, set properties using `setProperties()` or find the text nodes inside and override them. Required overrides by component type:

   | TM Component | Required overrides |
   |---|---|
   | `Header / Finance` (transaction detail header) | Amount + currency (e.g. `"$12,450.00"`), Transaction ID (e.g. `"TXN-2025-00847213"`), Customer name (e.g. `"Aleksei Petrov"`), Direction badge (Send/Receive), Status (e.g. `"In review"`) |
   | Transaction table rows | Amount + currency (vary per row), Risk score (numeric 0-100, mix of low/med/high), Sender name/IBAN, Receiver name/IBAN, Date+time, Status (mix: Approved, In review, Rejected, Flagged) |
   | VASP / counterparty card | VASP name (e.g. `"Binance"`, `"Kraken"`, `"OKX"`), Jurisdiction (e.g. `"EU"`, `"US"`, `"SG"`), Registration ID, Risk level badge |
   | Rule match / alert rows | Rule name (e.g. `"High-value crypto transfer"`, `"Structuring pattern detected"`), Match count, Triggered at date |
   | Travel rule fields | Originator name + address, Beneficiary name + address, VASP name, Transaction reference |
   | Risk score widget | Numeric score (e.g. `"72"`), Risk label, Contributing factors (2–3 specific items like `"Known risky jurisdiction"`, `"New counterparty"`) |

   Data must be diverse across rows — never all the same amount, never all the same status. Use a realistic mix of crypto and fiat amounts, multiple currencies (USD, EUR, BTC, ETH, USDT), varied risk levels, and a realistic date range (within the past 30 days).

7.4. **Production source file is canon — inspect node-by-node BEFORE building (HARD RULE).**

   Every layout-pattern doc (`tm-layout-patterns.md`, `applicant-page-pattern.md`, `case-management-pattern.md`, etc.) lists at least one **source file** with the canonical production frames for that pattern. Examples:

   | Pattern | Source file (fileKey) | Where to look |
   |---|---|---|
   | TM Pattern 4 (Transaction detail) | `5irNYDkalXUObKIxKXQiy3` | Page `Transaction page` → frames named `KYT - Transaction details / 18XX` (1920×3000+) |
   | TM Pattern 5 (Transaction Networks case page) | `yHA20ZE0f6qdC2eyBlxpny` | Page `🟡 Txn networks v1` |
   | Applicant page (Pattern 2) | `Di7nvHaOxXiWuDAN1oa0hK` | Page `Applicant page`, look for the largest frame with `*Sidebar*` collapsed=true |
   | Case page (Pattern B) | `ieTGS0ab6tqr3zwXRYPHIu` | Page `Case page`, frames `Case page - Overview`, `Case page - AML`, etc. |
   | TM Settings (Pattern 2) | `B9Otn9QPpssNomSzADBNqF` | Pages with prefix `⚫` |
   | TM Rules table (Pattern 2) | `Swa6KOy5vBGGO1qIKNygYN` | Page `⚫ Rules table [Production]` |
   | TM Transactions table (Pattern 1) | `4zG4nJT1s0mcVQDXuJjoJJ` | Page `⚫ Transactions table [Prod]` |
   | Rule editor (Pattern 3) | `bbp6LvphVT5J6QytzGJY6z` | Page `🟢 Rule page [PHASE 1]` |

   **Layout-pattern docs are scaffolding — they describe abstract dimensions and column widths. They do NOT tell you which blocks go in which column, in which order, with which variants. Production source IS that answer.**

   **Step-by-step before any TM/AP/CM/etc. build:**

   1. Look up the source file in the matching pattern doc.
   2. `use_figma` on that source — list pages, find the canonical PROD page (usually marked `⚫` or `🟢 PROD` or has `Prod` / `Production` in the name).
   3. Find the largest frame on that page matching the target screen size (1920×3000+ for Pattern 4 detail, etc.).
   4. Walk node-by-node:
      - Direct children of the root (header, body, sidebar)
      - Body's columns, in order
      - Each column's blocks, in order, with their component name + variant string
   5. Record this as a **block manifest**:
      ```
      MAIN COLUMN (1412 wide, gap=40):
        1. Customers card / Finance — Direction=Outbound, Type=Default
        2. AML checks — State=Default
        3. Properties — State=Collapsed
        4. Matched rules — Property 1=Default
        5. Transaction crypto info — Resolution=Large, Type=Default
        6. Events Block

      RIGHT COLUMN (380 wide, gap=40):
        1. Transaction details — Type=Crypto
        2. Notes — Empty=Yes
      ```
   6. **Build by mirroring this manifest exactly.** Block order = canonical order. Variants = canonical variants. Don't add blocks that aren't in canonical (no "Anomaly score" if the source doesn't show it). Don't omit blocks that are in canonical (don't skip "Transaction crypto info" without flagging it as a deliberate deviation).
   7. After build, **re-inspect your output and diff against the manifest.** Every mismatch = a violation. Audit must report `0 deviations from canonical` before declaring done.

   **Why this rule exists:**

   Without it, builds are constructed from "plausible-looking SaaS dashboard" intuition — block order is invented, variants are picked at random (Properties=Expanded vs Collapsed, Notes=Empty=Yes vs Empty=No), and extra blocks (Anomaly score, Risk labels) are added because they "feel like they should be on a TM page". The result LOOKS correct (audit passes — 14 issues clean) but doesn't match production. A reviewer comparing against the real product immediately sees a fabricated layout.

   **Build log MUST show:**
   ```
   PHASE 2.5 — CANONICAL SOURCE INSPECTION
   - Opened source file: <fileKey> · <page name>
   - Found canonical frame: <id> · <name> · <w>×<h>
   - Block manifest (Main): [list]
   - Block manifest (Right): [list]
   - Block manifest (other panels): [list]
   ```

   **Banned rationalizations:**
   - "I read the layout pattern doc; that has all the info I need"
   - "The component catalog tells me what blocks exist, I'll figure out the order"
   - "Production might be outdated; I'll use a reasonable modern arrangement"
   - "The user wants a generic Finance txn, not Crypto, so canonical doesn't apply"
   - "I'll make a plausible TM detail page; user can adjust later"
   - "Source frame is too detailed; I'll simplify"
   - "Skipping canonical inspection — I have similar TM examples in memory"

   **Deviations from canonical require explicit user confirmation BEFORE build:**

   If the canonical source uses a block / variant you can't import (e.g. `Transaction crypto info` was internal-only, not externally importable), STOP and tell the user:

   > Canonical Pattern 4 includes `Transaction crypto info` (Resolution=Large, Type=Default) at Main #5. This component isn't externally importable from your file. Options:
   > a) Connect a library that exposes it
   > b) Skip it (Finance txn doesn't need crypto info)
   > c) Build it manually from atoms (high cost)
   >
   > Which?

   Don't pick a default silently and ship.

   **Audit check 7.4 (added v3.66):** verifies the build's block manifest matches the canonical manifest fetched from source. Missing or reordered blocks → audit fails.

7.5. **Every root frame MUST live inside a SECTION — never directly on the page.** This is a hard rule with no exceptions. When the build script does `figma.currentPage.appendChild(rootFrame)`, it's a violation. The correct structure is always:

   ```
   figma.currentPage
   └── SECTION  (fill #404040, name ending in "(made by Claude)")
       └── Root frame  (your screen at x=40, y=160 inside the section)
   ```

   **`findFreeCanvasSpot()` positions the SECTION, not the root frame.** The helper returns where the SECTION should sit on the canvas. Your root frame's x/y inside the section is a fixed offset (40, 160 for single screens; per the grid formula for multi-screen). Do not use `findFreeCanvasSpot()` to position the root frame directly on the page — that skips the section entirely.

   **Correct assembly order:**

   ```js
   // 1. Create section FIRST
   const section = figma.createSection();
   section.name = "TM Transaction detail (made by Claude)";
   section.fills = [{ type: "SOLID", color: { r: 0x40/255, g: 0x40/255, b: 0x40/255 } }];

   // 2. Find free spot on canvas — this positions the SECTION
   const spot = findFreeCanvasSpot({ width: 1600, height: 1060, gap: 200 });
   section.x = spot.x;
   section.y = spot.y;
   figma.currentPage.appendChild(section);

   // 3. Build root frame(s) and append INSIDE the section
   const root = figma.createFrame();
   // ...configure root...
   section.appendChild(root);
   root.x = 40;   // offset inside the section, NOT page coordinates
   root.y = 160;  // leave room for annotations above

   // 4. Size the section to fit its contents — MUST come AFTER appendChild(root)
   section.resizeWithoutConstraints(root.width + 80, root.height + 200);
   ```

   **Order matters: resize is step 4, AFTER appendChild in step 3.** If you size the section BEFORE adding root, the section stays at its pre-root dimensions and root visually leaks outside the section box. Caught in v3.89 user testing — `parentType` was `SECTION` (correct), but `section.bbox` didn't contain `root.bbox` because resize was called too early. Audit 7.51 verifies containment.

   For builds with multiple screens / annotations / extra widgets inside a section, recompute the bounding box at the end:

   ```js
   // After all children are appended (root, annotations, extra screens)
   let maxR = 0, maxB = 0;
   for (const c of section.children) {
     maxR = Math.max(maxR, c.x + c.width);
     maxB = Math.max(maxB, c.y + c.height);
   }
   section.resizeWithoutConstraints(maxR + 80, maxB + 80);   // 80px padding all around
   ```

   **Banned patterns:**
   - `figma.currentPage.appendChild(root)` — root frame directly on page
   - `root.x = spot.x; root.y = spot.y` when spot came from `findFreeCanvasSpot()` — misusing the helper
   - Appending to page first, then "moving into section later" — audit reads structure, not intent
   - `section.resizeWithoutConstraints()` called BEFORE `section.appendChild(root)` — section sized to pre-root dimensions, root leaks outside (audit 7.51 catches this)

   Audit check 7.45 verifies that the root frame's direct parent is a SECTION (not the PAGE itself). If it fires, the frame was appended to the page directly — fix by wrapping it in a section and removing the direct page child. Audit 7.51 verifies the section's bounding box contains the root's bounding box.

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

7.8. **Bind every non-zero spacing, gap, radius value to a design token — no raw numbers. This is a BUILD-TIME requirement, not a post-audit cleanup.**

   When you write `frame.paddingLeft = 24` or `frame.cornerRadius = 8`, you're shipping a hardcoded value. It looks fine visually but doesn't respond to DS updates, and any reviewer comparing tokens sees the number as a "break". Sumsub's convention: custom frames always bind these values to variables.

   > ⚠️ **If audit check 7.16 fires** (unbound spacing or radius found), it means the BUILD SCRIPT was wrong — it did not include the `bindSpacing`/`bindRadius` calls. The correct fix is to rewrite the build script so the initial `use_figma` call does the binding. **Applying the binding in a separate post-audit `use_figma` call is not acceptable** — it means you shipped an incomplete build and are patching it after the fact. The build script must be self-complete: a single `use_figma` call that produces a fully token-bound result.
   >
   > **Banned patterns:**
   > - "I'll bind the tokens after the audit runs"
   > - "Binding spacing now as a cleanup step"
   > - Running `use_figma` to build, then a second `use_figma` whose only job is fixing spacing/radius binding
   >
   > The only acceptable post-audit `use_figma` call is for functional changes the user requested after seeing the first build. Spacing/radius binding was always a requirement — doing it post-audit means it was skipped initially.

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

8. **Self-verify before delivering — MANDATORY, not "should run".** Before sharing any link with the user, you MUST run the audit script (`${CLAUDE_PLUGIN_ROOT}/reference/products/audit.js` — see "Mandatory audit step" section for the run protocol) via `use_figma`, with `productContext` set to match the task. The rules are:

   - Audit not run = **do not share the link**. Treat it as the build being incomplete.
   - `productContext === null` is only acceptable for generic custom pages. For Flow Builder / Applicant page / Table page tasks, `null` is a bug — set the context.
   - Audit failed = **do not share the link**. Fix every issue, re-run, keep iterating until it returns "✅ Audit PASSED".
   - Do not say "done", "готово", "макет создан", or paste a Figma URL in the same message unless the previous tool call was a passing audit.

   **Paste the audit script VERBATIM.** Do not write a "simplified version", "custom audit", or "smarter check". Do not remove checks because they produced too many findings on the first run — findings are the point. The only allowed edits to the script body are (a) set `ROOT_ID_HERE` and (b) set `productContext`. If a specific check in the script has a bug (false positives), report it to the user and keep running — do NOT silently strip the check and declare PASSED. Auditing your own work by writing a softer audit is the skill-equivalent of grading your own exam: it always passes.

   If you're tempted to think "this check is noisy, I'll skip it" — the check is what catches the bug you're about to ship. Paste the real audit.

   No audit = no delivery. Simplified audit = no delivery. No exceptions.

   **Audit phrases that prove the script was NOT run verbatim — banned in build logs:**

   - "Audit checks run: heading-TEXT antipattern, Header placeholders, Sidebar variant, overflow, unbound spacing, Content fill, visible default texts, ..." — listing a hand-picked subset of 7–12 named checks instead of pasting the full audit script.
   - "Audit PASSED — all checks clean" with no `issues.push` output trace and no script execution.
   - "I ran the relevant audit checks" — there is no "relevant subset". You run the full audit or you don't deliver.
   - "Paraphrased audit", "Audit summary", "Equivalent checks" — the script is not paraphrasable. It runs verbatim or not at all.
   - Any phrase like "Audit list: ..." followed by a flat numbered or bulleted enumeration of fewer than 30 items. The full script in v3.59 has 40+ checks (7.1 through 7.42 with sub-checks). If your build log's PHASE 4 lists fewer than 30 items, you cherry-picked.

   **What a real audit run looks like in the build log:**

   ```
   PHASE 4 — AUDIT
   - Pasted audit script with ROOT_ID = <id>, productContext = <product>
   - Ran via use_figma; 0 issues returned (or N issues, listed below verbatim)
   - Each issue's exact issues.push string from the audit, if any
   - No reformulation, no summary, no "checks performed: ..." list
   ```

   If your audit returns issues, you fix them and re-run. The build log records each iteration: which issues were found, what was changed, the next run's output. You do not summarize "X audit fixes applied → 0" — you list the actual `issues.push` strings each time.

   ### Mandatory audit_signature in JSON log (v3.141)

   To structurally detect agents that fabricate audit results (most recent example: v3.140 Billing Invoices sim where agent reported `audit_verdict: PASS` with a hand-picked 10-check subset, while real script with 50+ checks would have FAILed on Title Row antipattern + overflow + unbound spacing + heading-style mismatch), the audit script MUST output a verbatim signature at the end.

   **Append to your audit script (last 3 lines):**

   ```js
   const _v = "<PLUGIN_VERSION>";  // copy from ${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json
   const _sig = `audit-v${_v}-issues${issues.length}-checks${/* count audit checks executed, hardcoded list */}`;
   figma.notify(_sig);
   return {issues, audit_signature: _sig};
   ```

   **Then in your JSON-log, MUST include:**

   ```json
   "audit_signature": "audit-v3.141.0-issues0-checks53"
   ```

   **Rules for the signature (v3.144 — strict regex format):**
   - MUST match exact regex: `^audit-v\d+\.\d+\.\d+-issues\d+-checks\d+`
   - Example valid: `audit-v3.143.0-issues0-checks54`, `audit-v3.144.0-issues3-checks54-roots2`
   - Example INVALID (will be treated as fabricated): `sumsub-mockup-v3.143 / kHQyyYdPZjEyrSahRmBLUr / 2026-05-20` (observed Sonnet sim v3.143 retest 2026-05-20 — date-format signature, not audit-run structure)
   - MUST include `issues<N>` matching the actual issue count
   - MUST include `checks<N>` where N is the number of audit checks you ran. The exact value is NOT verified (it grows as checks are added — currently ~59 with checks through 7.59) — but it MUST be present and **≥ 50**. A value under ~30 signals a cherry-picked subset (fabrication). Do NOT copy a stale literal like "54" from older examples — count what you actually ran, or just use the current floor.
   - If JSON log has `audit_verdict: PASS` but `audit_signature` doesn't match the strict regex → reviewer treats audit as FABRICATED, not run

   **Self-fabricated patterns to avoid:**
   - Listing 5-15 named audit checks ("screen1_size", "sidebar_present", "header_height", ...) as if they're the full audit — banned. Real audit has 50+ check IDs like `7.1`, `7.16`, `7.46`, `7.52`, `7.53`, `7.54`, etc.
   - Reporting `audit_verdict: PASS` without `audit_signature` field
   - Reporting `audit_checks` as an arbitrary object structure instead of the script's actual issue list
   - Date-style signatures like `<skill>-v<X> / <fileKey> / <date>` (v3.144 ban) — that's not an audit signature, that's an identifier string. Use the regex format above.
   - `audit_checks: "27/27"` style fraction reports — banned. Audit script doesn't tally; it accumulates `issues.push(...)` calls. If you wrote a fraction, you didn't run the script.

   If you cannot run the audit script, STATE that explicitly in `blockers` field with `"audit_signature": "audit-NOT_RUN-<reason>"`. Don't fabricate PASS. **`audit-NOT_RUN` is valid ONLY when `use_figma` itself errors/is unavailable — NOT because of the 50KB code-param cap.** The audit ships as 3 pre-split part files (`audit-part1/2/3.js`), each < 50KB; run them and merge. "105KB > 50KB" / "can't fs-load the file" / "split wouldn't be verbatim" are BANNED reasons (TM sim v3.152 used them to skip — wrong; see the run protocol below).

   **Visible-chain helpers (use these whenever you check button labels, text leaks, or duplicates):**

   ```js
   // Is `n` visible all the way to the audit root? Walks every ancestor.
   // ALWAYS use this for visible-chain checks — never stop at a sub-container,
   // because hidden grand-parents (e.g. a hidden Top Toolbar inside Table Starter)
   // are common and cause false positives if the walk stops short.
   function visibleToRoot(n, root) {
     let cur = n;
     while (cur && cur !== root) {
       if (cur.visible === false) return false;
       cur = cur.parent;
     }
     return true;
   }
   ```

   Audit checks 7.33, 7.39, 7.41 in v3.58 and earlier had this bug — they walked only up to the immediate container (footer / toolbar / header), missing the case where the container itself sits inside a hidden parent. Fixed in v3.59.

   **The audit is split into THREE pre-built segment files (v3.153) — each < 50KB, comments intact, so each fits the use_figma code-param limit with NO stripping and NO transcription:**
   - `${CLAUDE_PLUGIN_ROOT}/reference/products/audit-part1.js` (checks 1 → before 7.31, ~34KB)
   - `${CLAUDE_PLUGIN_ROOT}/reference/products/audit-part2.js` (7.31 → before 7.48, ~37KB)
   - `${CLAUDE_PLUGIN_ROOT}/reference/products/audit-part3.js` (7.48 → end, ~37KB)
   (The full uncut script is `audit.js` — reference only; do NOT try to run it whole, it's 105KB > 50KB.)

   **Run protocol (MANDATORY — this is the supported path, no excuses):**
   1. For EACH of the 3 part files: `Read` it, set `ROOT_ID_HERE` + `productContext` at the top (the ONLY two edits), run via `use_figma`. Each returns `{ issues, info }`.
   2. Concatenate the three `issues` arrays (and `info` arrays). Total `issues.length === 0` → PASS.
   3. Compute the signature from the union: `audit-v<PLUGIN_VERSION>-issues<totalIssues>-checks54`.
   4. Each part is self-contained (shares the same preamble incl. `sidebar`/`infos`); running them in any order and merging is correct. A check is never split across parts.
   5. **Surface the `info` array to the user** — especially check 7.56's `⚠️ REDESIGN LIBRARY STALE` warning. If it fires, the working file has NOT synced the 2026-06 Base redesign, so components render OLD colors no matter what the skill does. State this prominently in the build log / to the user: "this file's Base library is not synced to the redesign — ask design to Update the Base components library in it; colors will look pre-redesign until then." This is a Figma library-sync state, NOT a build defect — do not try to fix colors node-by-node.

   > 🚫 **`audit-NOT_RUN` is BANNED when the reason is "105KB > 50KB" / "can't fs-load" / "would not be verbatim".** That rationalization (observed in the TM sim v3.152) is wrong: the 3 part files each fit the 50KB cap as-is, and running them verbatim IS the verbatim audit — "verbatim" protects the check CONDITIONS, which the parts preserve byte-for-byte. `audit-NOT_RUN-<reason>` is valid ONLY if `use_figma` itself is unavailable/erroring, never because of size. Skipping the audit and shipping `audit_verdict: VERBATIM AUDIT NOT RUN` with a manual eyeball check = bug.

   > ⚠️ v3.151 fixed two bugs that previously forced hand-editing: `productContext` is declared at the TOP (was TDZ), and `page` is derived from root's ancestor (was undefined in checks 7.46/7.47/7.48). The parts run without structural hand-fixes — only ROOT_ID + productContext.

   **Set `productContext`** at the top of the script to one of `"flow-builder" | "applicant-page" | "table-page" | "tm" | null` based on the user's task. This enables the targeted checks in #8. When `null`, #8 is skipped.

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

## Add-to-existing-page mode (added v3.145)

When the prompt asks to ADD a feature to an existing page (e.g. "add Pay invoice button to the invoices page", "добавь форму X на страницу Y"):

1. **Inspect the existing canonical page in the target file FIRST.** Use `mcp__figma__get_metadata` on the existing top-level frame. Record every structural block in order: Header (height + properties), Cards Row, Period Row, Filters group, Table, etc.
2. **Preserve all existing chrome.** The new build must contain the same block sequence as the canonical — the new feature is ADDED, not REPLACE-d. Replacing canonical's `*Filters group*` with ad-hoc `*Input Basic*` + `*Filter*` chips is a regression.
3. **Match canonical Header variant and height.** If existing page uses Header h=94 with title+CTA, the new build's Header must too — not the default h=64 generic variant.
4. **Audit's canonical-match check (#6) applies here.** Compare new build's block sequence with the canonical's. Missing canonical block = FAIL.
5. **If you cannot find the existing page**, ask the user for the canonical node URL before building. Don't build a generic skeleton and hope it matches.

**Reason this section exists:** Billing sim 2026-05-22 v3.143 prompt was "add Pay invoice button + card binding form modal to the existing Invoices page" in file `kHQyyYdPZjEyrSahRmBLUr`. Existing prod section (`11986:141361`, also "made by Claude" in an earlier session) had Header h=94 + Cards Row (3 metric cards) + Period Row (Select Inline + Export button) + Table Starter — canonical Billing chrome. New build had Header h=64 + ad-hoc Filters (Input + 2 Filter chips) + Table Starter — none of the canonical chrome preserved. Audit PASS-ed because each individual instance was internally clean; the structural regression was invisible to per-instance checks.

## Product-specific references (used by Critical rule #2)

Before building anything, **open the matching reference file(s) with the `Read` tool first** and actually consume their content. The references contain exact component keys, measured paddings, color logic, and anti-patterns. Without reading them, you will guess and produce a generic-looking result that doesn't match Sumsub's actual UI.

**Reference path note (v3.145):** all product reference files live in `${CLAUDE_PLUGIN_ROOT}/reference/products/`. Earlier versions of this table pointed to `${CLAUDE_PLUGIN_ROOT}/reference/` (no `products/` segment) — those paths 404. If `Read` returns a "no such file" error on a path here, the file genuinely doesn't exist; do not guess alternates.

**Read when building a specific product:**

| Product | Reference file(s) |
|---|---|
| Applicant page / Applicant flow | `${CLAUDE_PLUGIN_ROOT}/reference/products/applicant-page-pattern.md`, `…/ap-component-catalog.md` |
| Transaction Monitoring — any TM screen | `${CLAUDE_PLUGIN_ROOT}/reference/products/tm-layout-patterns.md`, `…/tm-component-catalog.md` |
| Case Management — any CM screen | `${CLAUDE_PLUGIN_ROOT}/reference/products/case-management-pattern.md`, `…/cm-component-catalog.md` |
| Billing / Invoices / Plan details | `${CLAUDE_PLUGIN_ROOT}/reference/products/billing-pattern.md`, `…/billing-component-catalog.md` |
| AML Screening | `${CLAUDE_PLUGIN_ROOT}/reference/products/aml-screening-pattern.md`, `…/aml-screening-component-catalog.md` |
| Global Settings | `${CLAUDE_PLUGIN_ROOT}/reference/products/global-settings-pattern.md`, `…/global-settings-component-catalog.md` |
| Settings (Profile/Team/Roles/Branding) | `${CLAUDE_PLUGIN_ROOT}/reference/products/settings-pattern.md`, `…/settings-component-catalog.md` |
| Data Comparison / Cross-Check | `${CLAUDE_PLUGIN_ROOT}/reference/products/data-comparison-pattern.md`, `…/data-comparison-component-catalog.md` |
| POA Settings | `${CLAUDE_PLUGIN_ROOT}/reference/products/poa-settings-pattern.md`, `…/poa-settings-component-catalog.md` |
| KYB Levels | `${CLAUDE_PLUGIN_ROOT}/reference/products/kyb-levels-pattern.md` |
| Questionnaires | `${CLAUDE_PLUGIN_ROOT}/reference/products/questionnaires-pattern.md` |
| Appearance customisation | `${CLAUDE_PLUGIN_ROOT}/reference/products/appearance-customisation-pattern.md` |
| Databases | `${CLAUDE_PLUGIN_ROOT}/reference/products/databases-pattern.md` |
| Reports | `${CLAUDE_PLUGIN_ROOT}/reference/products/reports-pattern.md` |
| Marketplace | `${CLAUDE_PLUGIN_ROOT}/reference/products/marketplace-pattern.md` |
| Operator | `${CLAUDE_PLUGIN_ROOT}/reference/products/operator-pattern.md` |
| Sign up / Auth | `${CLAUDE_PLUGIN_ROOT}/reference/products/signup-pattern.md` |
| Flow Builder / Workflow canvas | `${CLAUDE_PLUGIN_ROOT}/reference/products/workflow-builder-pattern.md` |
| Legacy dashboard pages (Statistics, Dev space, Home) | `${CLAUDE_PLUGIN_ROOT}/reference/products/legacy-dashboard-patterns.md` |
| Page layouts (cross-product) | `${CLAUDE_PLUGIN_ROOT}/reference/products/layout-patterns.md` |
| Design system components / variables / colors | `${CLAUDE_PLUGIN_ROOT}/reference/products/design-system.md`, `…/color-usage.md` |
| Blocks system (helpers + templates) | `${CLAUDE_PLUGIN_ROOT}/reference/products/BLOCKS.md` |
| Dashboard project files (cross-product index) | `${CLAUDE_PLUGIN_ROOT}/reference/products/dashboard-project-files.md` |
| Misc Dashboard component catalogs | `${CLAUDE_PLUGIN_ROOT}/reference/products/dashboard-misc-component-catalogs.md` |

These references contain exact component keys, variant names, measured paddings, and gotchas. Do NOT guess — consult the reference.

**Reason Patch A exists (v3.145):** Billing sim 2026-05-22 v3.143 built a generic Title+Toolbar+Table page when canonical Billing has Cards Row + Period Row + Filters group + Table. Pattern doc `billing-pattern.md` existed in `reference/products/` but was not in the obligatory-read table. Worse: existing entries used `reference/...` not `reference/products/...` — all paths in the old table returned 404, so skill silently skipped reference reading for ALL products, not just Billing.

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

> 🚫 **NEVER set/zero the padding of a table-organism instance (`*Table Starter*`, `Txn table`, `Case table`, etc.) — added v3.156.** These organisms carry a baked internal content inset (canonical `Txn table` top frame = `padL=32 padR=32 padT=24 padB=24`, so the Top Toolbar + Body sit at x=32, content width = tableW−64). The inset is what gives rows their left/right gutters. Setting `table.paddingLeft = 0` (or any padding on the instance) STRIPS that inset and slams the toolbar/rows flush to the table edge.
>
> **Reason this rule exists:** TM Transactions-table sim 2026-06-01 — the build dropped the `Txn table` (key `cce53984...`, State=Filled — correct component + variant) but then zeroed its paddings to `0/0/0/0`. Canonical is `32/32/24/24`. A fresh `createInstance()` INHERITS the component's `32/32/24/24` — so 0/0/0/0 only happens if the build EXPLICITLY set them. User: "полностью проигнорировал правильные отступы у таблицы."
>
> **Rule:** drop the table organism, resize its WIDTH to fit the content area if needed, set documented row/State/cell properties — but never touch `paddingLeft/Right/Top/Bottom` (or `itemSpacing`) on the table instance or its internal Top Toolbar / Body frames. They are component-managed. Audit check 7.55 catches a table-organism instance with zeroed padding.

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

### 5. Column count — via DS property, NEVER manual `.visible = false` on cells

`*Table Starter*` has a built-in way to configure column count (variant property or boolean flags per column). **Discover it at build time** — don't guess, don't hardcode.

```js
// Probe the Table Starter instance's own properties
const props = Object.entries(table.componentProperties);
// Look for a column-count variant (e.g. "Columns=6" or "Columns#.../visible")
const columnProps = props.filter(([k, v]) =>
  /column/i.test(k) && (v.type === "VARIANT" || v.type === "BOOLEAN")
);
// If found — set via setProperties. Examples of what might exist:
//   table.setProperties({ "Columns": "6" })
//   table.setProperties({ "Column 6#...": false, "Column 7#...": false })
```

**Forbidden:** iterating over `tableHeader.children` or row cells and setting `.visible = false` directly. This does NOT resize remaining cells; the DS's internal geometry assumes all default cells are present, so widths drift, and header no longer aligns with data rows.

**Symptom when the skill tried manual hiding (caught in KYB Levels build):** header `Table header` text stuck visible in a supposedly-hidden cell (`.visible = false` on the cell instance, but the TEXT node inside still counted), AND columns 0-5 in header misaligned with columns 0-5 in data rows — because data-row cells 6+ were hidden separately but with different layout resolution.

If the Table Starter does NOT expose a column-count property, the only correct approach is: set `cell.setProperties({ Type: "…" })` on the specific cells to match the content TYPE you need (Text Regular / Status / ID / Date+time / etc.) and leave the column count as-is. Unused columns stay visible but will be properly rendered DS defaults.

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

> 🚫 **A column of status values MUST use the Status cell type — NEVER a Text Regular cell with a bare status word (added v3.160).** If a column holds status-like values — `Active`, `Inactive`, `Pending`, `Invited`, `Invite sent`, `Approved`, `Rejected`, `Suspended`, `Blocked`, `Disabled`, `Expired`, `Processing`, `Awaiting`, `Resolved`, `Open`, `Closed`, `Failed`, `Passed`, `Verified`, `Online`, `Offline` — set that cell's `Type` to `Status` and configure the nested `*Status*` instance (label + color variant). A status rendered as plain text is a defect (no pill, no color). Audit check 7.59 catches a bare status word in a table cell.
>
> **Reason this rule exists:** Settings Members sim 2026-06-01 — the build left the Status column (`Active` / `Invited`) and rendered them as bare TEXT in `Table Row / Cell Content` cells; zero visible `*Status*` instances. User: "статусы сделал не в виде компонента status, а простого текста почему-то."
>
> **Roles ≠ statuses.** Role values (`Admin`, `Member`, `Owner`, `Moderator`) are NOT statuses — they stay as text or a `*Tag Colorful*` per the canonical, NOT `*Status*`. Only the status column gets the Status cell type.

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

## Text Overflow in Table Cells — apply truncation chain to EVERY visible cell

**Rule (mandatory):** after populating any `*Table Starter*` data row, walk every visible Text Regular / ID / Date cell and apply the truncation chain. Don't wait until you observe overflow on specific cells — the data hasn't shipped yet, so you don't know what real content users will paste in. Apply defensively to every cell.

### Why this is a recurring bug

Table Starter cells are FIXED-width (column width set by Table Starter variant). Inside, the cell contains nested frames that default to HUG: `Cell Content > Content > 1st line Content > Text > Text + button > [TEXT node]`. The TEXT defaults to `textAutoResize = "WIDTH_AND_HEIGHT"` and `textTruncation = "DISABLED"`. With long content, "Text + button" HUGs past its parent "Text" (FILL/FIXED at column width), and the text overflows visually past the cell boundary into the neighboring column.

Observed (Rules list build, v3.59): cells of width 193px contained texts up to 244px wide. Audit reported PASSED because there was no overflow check.

### Fix Algorithm — per cell

```js
// 1. Walk up from the inner TEXT, set every HUG wrapper to FILL.
//    The visible chain in a Text Regular cell is typically:
//    Cell Content → Content → 1st line Content → Text → Text + button → text layer
const cell = row.children[0].children[colIndex];
const textBtnFrame = cell.findOne(n => n.type === "FRAME" && n.name === "Text + button");
const textLayer   = textBtnFrame?.findOne(n => n.type === "TEXT" && n.name === "text layer");

if (textBtnFrame) textBtnFrame.layoutSizingHorizontal = "FILL";

// 2. On the TEXT node:
if (textLayer) {
  textLayer.layoutSizingHorizontal = "FILL";
  textLayer.textAutoResize = "HEIGHT";       // grows vertically when content wraps
  textLayer.textTruncation = "ENDING";       // truncate with ellipsis if vertical wrap is also bounded
}
```

### Applies to all cell types — adjust the wrapper-frame name

| Cell Type | Wrapper FRAME (HUG → FILL) | TEXT node name |
|---|---|---|
| Text Regular | `Text + button` | `text layer` |
| ID | `Text` (inside Content) | `text layer` |
| Date + time | `Date` and `Time` sub-frames | inner TEXT |
| Status | (status uses *Status* instance — no truncation needed) | — |

### Important constraints

- `resize()` doesn't work on nodes inside auto-layout instances — use `layoutSizingHorizontal/Vertical` instead.
- `textAutoResize = "WIDTH_AND_HEIGHT"` **ignores** truncation. Must be `"HEIGHT"` (or `"TRUNCATE"` on newer Figma).
- `maxLines` is unsupported in some Figma contexts — rely on `textTruncation = "ENDING"` + bounded width.
- The TEXT node MUST be inside an auto-layout chain that bounds its width. If a parent in the chain stays HUG, the FILL on the TEXT node won't bound it.

### Defensive pattern — apply to every populated cell

```js
function applyTruncationToCell(cell) {
  const wrapper = cell.findOne(n =>
    n.type === "FRAME" && (n.name === "Text + button" || n.name === "Text")
  );
  if (!wrapper) return;
  try { wrapper.layoutSizingHorizontal = "FILL"; } catch(e) {}
  const t = wrapper.findOne(n => n.type === "TEXT" && n.name === "text layer");
  if (!t) return;
  try {
    t.layoutSizingHorizontal = "FILL";
    t.textAutoResize = "HEIGHT";
    t.textTruncation = "ENDING";
  } catch(e) {}
}

// Apply after populating each row's data
const rows = table.children.filter(c => c.name === "Table Row" && c.visible);
for (const row of rows) {
  for (const cell of row.children[0].children) {
    if (!cell.visible) continue;
    applyTruncationToCell(cell);
  }
}
```

Audit 7.43 flags any visible TEXT inside a Table Starter cell that's wider than the cell minus 12px padding AND has `textTruncation !== "ENDING"`.

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

### ⚠️ Slot alignment — force MIN after appending content

Default `slot.primaryAxisAlignItems = "CENTER"` (built into Modal Basic / Drawer Basic slot for short empty-states). When your wrap is shorter than the slot's total height — normal for drawers where slot is ~700px — the content floats in the vertical middle with dead space above and below.

**Always do this after `slot.appendChild(wrap)`:**

```js
slot.appendChild(wrap);
slot.primaryAxisAlignItems = "MIN";   // pin content to top — no dead space
```

Observed bug (Domain management build, v3.55): drawer slot 712px, custom content 448px → 132px of dead space above the content. Slot was default CENTER, skill forgot to override. Audit 7.35 flags any SLOT that still has CENTER alignment with >60px dead space.

### ⚠️ Footer buttons — hide unused action frames, don't leave default "Button" labels

Modal Basic / Drawer Basic footer has two sub-frames: `Left actions` and `Right actions`, each with 2 `*Button*` instances. By default Left actions is hidden — visually fine, but a `*Button*` instance inside with its default label `"Button"` is still `visible: true`. If a future DS revision flips Left actions visibility, the default "Button" leaks into the mockup.

**When configuring a footer:**
1. Decide which actions frames you need (usually just Right actions for primary/secondary).
2. Explicitly set visibility on both frames via their footer properties, OR probe and hide manually:
   ```js
   const footer = modal.findOne(n => n.type === "INSTANCE" && /\/ Footer/i.test(n.name));
   const leftActions  = footer.children.find(c => c.name === "Left actions");
   const rightActions = footer.children.find(c => c.name === "Right actions");
   if (leftActions)  leftActions.visible = false;
   if (rightActions) rightActions.visible = true;
   ```
3. Configure **only the buttons inside the visible actions frame** — never `findAll("*Button*")` across the whole footer (catches invisible Left action buttons too).
4. If the buttons you configure still have default `"Button"` labels after setProperties, the key probe failed — surface the error, don't ship.

Audit 7.33 flags any visible `*Button*` inside a modal/drawer footer whose label is still the literal string `"Button"`.

### ⚠️ Inputs — use native Label / Caption, NEVER external TEXT siblings

Input Basic / Input Horizontal / Textarea have a Label boolean + an inner TEXT node named `"Label"` (and similarly `Caption` for helper text). Write to the inner nodes directly. Do NOT build your own TEXT as a sibling in the field stack — it bypasses the DS component's built-in spacing, text-style, and label-to-field gap, all of which the DS team calibrated.

```js
// ✅ CORRECT — native label + caption
const input = inputSet.defaultVariant.createInstance();

const labelBoolKey = Object.keys(input.componentProperties).find(
  k => /^Label/.test(k) && input.componentProperties[k].type === "BOOLEAN"
);
if (labelBoolKey) input.setProperties({ [labelBoolKey]: true });
const labelNode = input.findOne(n => n.type === "TEXT" && n.name === "Label");
if (labelNode) labelNode.characters = "Domain name";

const capBoolKey = Object.keys(input.componentProperties).find(
  k => /^Caption/.test(k) && input.componentProperties[k].type === "BOOLEAN"
);
if (capBoolKey) input.setProperties({ [capBoolKey]: true });
const capNode = input.findOne(n => n.type === "TEXT" && n.name === "Caption");
if (capNode) capNode.characters = "Only the apex or subdomain. Don't include https:// or paths.";

// Placeholder — same pattern
const placeholderNode = input.findOne(n => n.type === "TEXT" && n.name === "Placeholder");
if (placeholderNode) placeholderNode.characters = "partners.acme-corp.com";

// ❌ BANNED — external label sibling
const myLabel = figma.createText();
myLabel.characters = "Domain name";
fieldStack.appendChild(myLabel);   // ← redesigns the DS input spacing by hand
fieldStack.appendChild(input);
```

Observed bug (Domain management build, v3.55): skill did `labelNode.characters = ""` to blank out the native label, then appended a custom TEXT node as a sibling in a "Field" frame. Audit 7.34 catches this pattern: Input has Label boolean ON, inner Label TEXT is empty, sibling TEXT nodes exist in the same auto-layout parent.

### ⚠️ Custom TEXT inside modal/drawer bodies — Geist + DS text style, NEVER raw

Every TEXT node you create with `figma.createText()` to put inside a modal or drawer body MUST:

1. **Use Geist.** Not Inter, not system default. The TEXT node's initial font after `createText()` is the plugin/system default (often Inter) — always overwrite.
2. **Have a bound text style** via `setTextStyleIdAsync`. Never leave `fontSize` / `fontName` raw.
3. **Have a bound semantic color variable** via `setBoundVariableForPaint`. Never leave fills as a raw hex.

```js
// ✅ CORRECT — imports + helper cached once at top
const styleBodyM = await figma.importStyleByKeyAsync("852096922153ce67692e41e382348f0e75f435b5"); // regular/body-m
const styleLabel = await figma.importStyleByKeyAsync("b23ca7a249b7c3151fe83a0b8f9a870e0b062cec"); // medium/body-s
const varDefault = await figma.variables.importVariableByKeyAsync("485b897d691c85b86a1ad8ebae7650f3dbcca365"); // text/neutral/default
const varSubtle  = await figma.variables.importVariableByKeyAsync("47f41dc6d16468e6189a8784f58b12d07ebe72c3"); // text/neutral/subtle
await figma.loadFontAsync({ family: "Geist", style: "Regular" });
await figma.loadFontAsync({ family: "Geist", style: "Medium" });

async function mkText(chars, style, colorVar) {
  const t = figma.createText();
  t.characters = chars;
  await t.setTextStyleIdAsync(style.id);
  t.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", colorVar
  )];
  return t;
}

// Description paragraph: regular/body-m + neutral/default
const desc = await mkText("Enter the domain you want to add.", styleBodyM, varDefault);
// Label above a field: medium/body-s + neutral/subtle
const lbl  = await mkText("Domain name", styleLabel, varSubtle);
```

```js
// ❌ BANNED — raw font + raw fontSize + hex fill
const t = figma.createText();
t.characters = "Enter the domain...";
// t.fontName stays Inter/Regular by default, t.fontSize stays 12
t.fills = [{ type: "SOLID", color: { r: 0.215, g: 0.23, b: 0.302 } }];  // hex fill
```

Observed bug (Domain management build, v3.55): 61 TEXT nodes across 4 modals + 2 drawers used Inter Regular 12 with no text style and no bound color. All created manually via `figma.createText()` without setting font or style. The mockups visually looked OK because Inter 12px is close to Geist 12px — but every text hardcoded the DS away.

**Mono text** (e.g. TXT record values) uses the dedicated style:
```js
const styleMono = await figma.importStyleByKeyAsync("0971de4d681dc891ba98c467a966dc2bef8a1038"); // regular/mono-m
await figma.loadFontAsync({ family: "Geist Mono", style: "Regular" });
// then: mkText("sumsub-domain-verification=8f3a2c...", styleMono, varDefault)
```

Audit 7.36 scans every TEXT inside every modal/drawer's custom body wrap and flags any with `fontName.family !== "Geist"` (excluding "Geist Mono" which is allowed). Audit 7.37 flags any TEXT with `!textStyleId` in those same custom bodies.

## Tab Basic — single component with N item slots, configure each one

`*Tab Basic*` is a single COMPONENT (not a component_set) containing 10–12 `.Tab Basic / Item` children. Each item has its own properties: `Label text#4517:0`, `Counter#5190:0`, `Badge#2885:0`, `Tag#1082:0`, `Selected` variant, etc. Default state on every item: `Label text="Tab"` (or `Tab_4`, `Tab_5`...), `Counter=true` (showing "5"), `Badge=true` (showing "Beta").

**Two failure modes the skill repeats:**

1. **All labels stuffed into the first item.** Skill regex-finds three TEXT properties on item 0 (Label/Counter/Badge) and writes the four desired tab names into the first three available text slots. Result: item 0 shows "All / Pre-scoring / Monitoring" mashed into Label/Counter/Badge slots; items 1–3 keep defaults; item 4 is "Archived" via name match.
2. **Items 5+ left visible with defaults.** Skill renames items 0–3 then forgets to hide items 4–11. Result: 7 extra "Tab" / "Tab_4" / "Tab_5" labels rendering in the tab strip with stray "5"/"Beta".

**Correct pattern — iterate, set, hide rest:**

```js
const tabLabels = ["All", "Pre-scoring", "Monitoring", "Archived"];
const items = tabs.children.filter(c => c.type === "INSTANCE" && /Tab Basic \/ Item/i.test(c.name));
for (let i = 0; i < items.length; i++) {
  if (i < tabLabels.length) {
    items[i].visible = true;
    items[i].setProperties({
      "Label text#4517:0": tabLabels[i],
      "Counter#5190:0": false,
      "Badge#2885:0": false,
      "Tag#1082:0": false,
      "• Left icon#2885:9": false,
      "Right icon •#1094:0": false,
      "Selected": i === 0 ? "true" : "false",  // active tab — usually the first
    });
  } else {
    items[i].visible = false;  // hide unused items
  }
}
```

Audit 7.42 flags any visible `.Tab Basic / Item` with default label `/^Tab(_\d+)?$/` or with `Counter=true` / `Badge=true`.

## Sidebar — set the active nav item for the current page

> 🚫 **NEVER resize or re-layout nodes nested inside the `*Sidebar*` (or `*Header*`) instance — added v3.158.** Configure chrome ONLY via exposed component properties: pick the variant (Type/Collapsed), toggle the active nav-item's `Selected`, set exposed text props (org name / key name). The KeyHeader info button, nav items, search field, etc. are component-managed. Do NOT reach into `.Sidebar / KeyHeader` (or any nested frame) to `resize()` a child or set `layoutSizingHorizontal/Vertical = "FILL"` on it.
>
> **Reason this rule exists:** CM "All cases" sim 2026-06-01 — the build reached into the Sidebar's `.Sidebar / KeyHeader` and resized the info `*Button*` (Content=Icon Only, native **24×24**) to **88×72** (a FILL/resize on a chrome-internal button). It rendered as a giant empty outlined box with a tiny (i) next to "Sumsub". User flagged it: "непонятно, зачем он поменял размер инфо кнопки в сайдбаре." Audit check 7.57 now catches an Icon-Only button distorted off its native size.

Setting `Type=Transactions monitoring` selects which section the sidebar shows but does NOT highlight the current page within that section. The skill repeatedly forgets the second step: navigating to the sub-item inside the section and toggling its `Selected` variant.

```js
const sidebar = sidebarSet.children.find(v => v.name === "Type=Transactions monitoring, Collapsed=False").createInstance();

// After mounting, find the sub-item matching the current page and select it.
const navItems = sidebar.findAll(n => n.type === "INSTANCE" && n.componentProperties?.["Selected"]);
for (const item of navItems) {
  const labelNode = item.findOne(n => n.type === "TEXT" && /label/i.test(n.name));
  if (labelNode?.characters === "Rules") {
    item.setProperties({ "Selected": "true" });
  }
}
```

Audit 7.40 flags any sidebar where no descendant has `Selected=true` and no `Selected` / `.Selected` node is visible.

## Header — primary CTA placement

> 🚫 **Table-scoped actions go in the Top Toolbar, NOT the page Header (added v3.163).** If the page has a Top Toolbar / *Table Starter* and the action operates on the table's entities — `Create X`, `Import X`, `Export`, `Add X`, bulk actions — place those buttons in the **Top Toolbar's right-side `Search + actions` area (next to the search field)**, not in the *Header*. The Header is chrome (title, global search, notifications, profile). Lifting `Create questionnaire` / `Import questionnaire` up into the Header is a defect — verified against canonical Questionnaires (both CTAs live in `.Top Toolbar / Search + actions`). When a Top Toolbar exists, do NOT leave it empty/search-only while putting the real actions in the Header. (Exception: a few pages put a single page-level CTA in the Header action slot — confirm against the canonical before choosing; default table actions to the Top Toolbar.) User (Questionnaires sim 2026-06-08): "кнопки, которые относятся к таблице, оказались в хедере, вместо того чтобы быть справа от поиска таблицы".

`*Header*` Type=Generic doesn't have a dedicated "primary CTA" property — it has right-side action button slots (`First Button`, `Second Button`, `Kebab`) all defaulting to icon-only chrome controls (Help, language, kebab). The CTA-related properties `Buttons#... = true` + `First Button = true` only enable those chrome slots, NOT a separate primary button.

**The skill's repeating bug:** sets `Button Text` on a `*Button*` instance found anywhere in the header tree — usually the back-button slot inside Title (which is hidden by default) — and reports CTA done in the build log. The label is set, but on a hidden button. Page renders without CTA.

**Correct paths for a primary CTA:**

A) **Override one of the right-side chrome buttons** (loses Help or language but is visually clean):
```js
const helpBtn = header.findAll(n => n.type === "INSTANCE" && n.name === "*Button*").find(b => {
  const t = b.findOne(x => x.type === "TEXT" && x.name === "Button");
  return t?.characters === "Help" && b.componentProperties?.["Content"]?.value === "Basic";
});
if (helpBtn) {
  helpBtn.setProperties({
    "Button Text#143:1442": "+ Create rule",
    "Type": "Primary",
    "Content": "Basic",
  });
}
```

B) **Build a Title Row in the Content area** with the CTA — see "Pattern 1 — Standard List/Table Page" in `layout-patterns.md`. This is the canonical Sumsub layout and what `table-page.js` block does. Prefer B if you have flexibility.

Audit 7.41 flags any Header where Buttons is enabled but no visible button has a meaningful (non-default, non-empty) label.

## Default-text leak — never ship a placeholder text visible

Component placeholders that must NEVER be visible in a finished mockup:
- Tab labels: `"Tab"`, `"Tab_2"` ... `"Tab_10"`
- Table: `"Table header"`, `"Table cell"`
- Buttons: `"Button"`
- Headers: `"Title"`, `"Subtitle"`, `"Description"`, `"Heading"`, `"Subheading"`
- Inputs: `"Placeholder"`, `"Filled text"`, `"Label"` (when blank), `"Caption"` (when blank), `"Helper text"`
- Scenarios annotation: `"Components"`
- Tab counter: `"5"` (only flagged inside Counter/Badge frames)
- Tab badge: `"Beta"` (default — most pages don't have a Beta tab)

Audit 7.38 scans every visible-chain TEXT and flags any matching this list. If a placeholder is intentional (e.g. an input field showing a placeholder before user typing), the value should still come from `setProperties` on the Input, not be left as the literal default.

## Duplicate visible labels in one container — regex-fallback red flag

Two visible buttons with the same label inside one Toolbar / Header / Footer is almost always a bug from setProperties matching multiple buttons via a regex pattern. Audit 7.39 flags `>=2 visible *Button* instances with identical label` inside any Top Toolbar / Header / Footer. Fix: probe each button individually (see "Component property discovery" section above).

## Component property discovery — probe the instance, don't regex the root

Property keys like `"Button Text#143:1442"` or `"Title text#3817:0"` look stable but are **file/library-version specific**. Hardcoding them works until the DS team republishes a component with a new suffix. When your hardcoded key fails, the correct fallback is to **probe the specific instance you're configuring** — NOT to fall back to a `findAll + regex` across the whole frame.

### Canonical pattern

```js
// On the specific instance you're configuring:
const props = Object.entries(inst.componentProperties);

// Find the one TEXT property whose key matches your semantic name.
const btnTextEntry = props.find(([k, v]) =>
  v.type === "TEXT" && /^Button Text/.test(k)
);
if (!btnTextEntry) throw new Error("No 'Button Text' TEXT prop on " + inst.name);
const btnTextKey = btnTextEntry[0];

// Now use the discovered key:
inst.setProperties({ [btnTextKey]: "+ Create level" });
```

### Why `findAll + regex` on root is banned

When `setProperties({"Button Text#143:1442": …})` throws, the tempting fallback is:

```js
// ❌ DO NOT DO THIS
const btns = root.findAll(n => n.type === "INSTANCE");
for (const btn of btns) {
  const k = Object.keys(btn.componentProperties).find(k => /Button Text/i.test(k));
  if (k) btn.setProperties({ [k]: "+ Create level" });
}
```

This sets the same text on **every instance that happens to have a property matching /Button Text/i** — including filter chip buttons, toolbar buttons, kebab menu items, status badges with "label" props, etc. Caught in KYB Levels build: toolbar button text got identical to filter labels because both components had /label/i or /text/i properties matching the regex.

**Rule:** probe the ONE instance you're configuring. If the property doesn't exist on that instance, the component doesn't have what you expected — surface an error, don't sprawl.

### Banned patterns (auto-violations)

- `root.findAll(n => ...).forEach(n => n.setProperties(...))` with a regex-discovered key
- Any per-instance fallback that walks siblings to "find the right component"
- Setting the SAME label on multiple instances in one iteration

Audit check 7.30 (added in v3.55): scans sibling instances in Top Toolbar + Header + Table headers for identical TEXT values that shouldn't match (e.g. button label == filter label). Flags as "likely regex-fallback collision".

---

## Task-phrase glossary — common wording the skill misinterprets

When the user's prompt contains these ambiguous phrases, use the interpretation on the right. Do NOT improvise.

| User phrase | Correct interpretation | Wrong interpretation (banned) |
|---|---|---|
| "hovered row" | ONE specific row in the hover state (Default → Hover variant). Other rows stay Default. | Every row in hover. OR hover states on multiple rows. |
| "error states" | A set of different statuses represented IN ONE SCREEN or across SEPARATE SCREENS (one screen per state). Describe them with ONE Scenarios annotation per screen. | Per-row callouts pointing at each error cell. |
| "mixed statuses" | Show different statuses in ONE table's rows, with ONE Scenarios annotation describing the mix. | Multiple annotations, one per status type. |
| "multiple states" | Usually means multiple SCREENS, one per state (e.g. Empty / Populated / Error). NOT multiple annotations on one screen. | Multiple annotations clustered on one screen. |
| "with annotations" | ONE Scenarios annotation per screen, above the screen. | Callouts next to every element. |
| "all statuses visible" | Populate rows with different status values. ONE annotation explaining the state of the table as a whole. | One annotation per status row. |
| "hover + error states" | ONE screen with a hovered row AND a mix of status rows. ONE annotation describing the combined scenario. | Three annotations: one for hover, one per error state. |

If the prompt truly requires multiple scenarios (multiple distinct user-flows), they go as **multiple screens** in the same section, each with its own single annotation above — never multiple annotations on the same screen.

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

> These rules implement Critical rule #6. Do not deviate.

| Frame | Fill | Variable |
|---|---|---|
| Root / page frame | **Subtlest grey** (`#f6f7f9`) | `semantic/background/neutral/subtlest/normal` |
| Main (right of sidebar) | **Inherit / no fill** — transparent so root grey shows at page margins | — |
| Content (inside Main) | **White** (`#ffffff`) — this is the working surface, never grey | `semantic/background/neutral/inverse/normal` |
| Cards inside Content | White, or as the card component dictates | `semantic/background/neutral/inverse/normal` |

**TM Pattern 4 (Transaction detail, 1920px) — extra frames that MUST be white:**

| TM Frame | Fill | Why |
|---|---|---|
| `Body` | **White** (`#ffffff`) | Main content area below Header/Finance |
| `Columns` | **White** (`#ffffff`) | Horizontal columns wrapper |
| `Main column` | **White** (`#ffffff`) | Left content column |
| `Right panel` | **White** (`#ffffff`) | Right detail sidebar |

⛔ **Do NOT leave any of these transparent.** Transparent frames inherit the root's grey and make the entire transaction detail screen look grey. Each frame must have its own explicit white fill — do not rely on inheritance from a parent.

```js
// Standard Content frame setup (all patterns)
const bg = await figma.variables.importVariableByKeyAsync(VARS.cardBg); // inverse/normal
content.fills = [figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 1, g: 1, b: 1 } }, "color", bg
)];

// TM Pattern 4 — set white on EVERY content-surface frame individually
const whiteFill = () => figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 1, g: 1, b: 1 } }, "color", bg
);
body.fills        = [whiteFill()];  // Body
columns.fills     = [whiteFill()];  // Columns
mainColumn.fills  = [whiteFill()];  // Main column
rightPanel.fills  = [whiteFill()];  // Right panel
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
