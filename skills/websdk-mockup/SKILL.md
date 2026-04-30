---
name: websdk-mockup
description: "Create Figma mockups for WebSDK screens — verification flows, KYC steps, liveness, selfie, document capture, onboarding, status screens. Uses the WebSDK design system (Manrope, dark shell, separate token set)."
argument-hint: "[screen description]"
---

# Figma Skill: WebSDK Mockup Builder

> Create WebSDK flow mockups in Figma: KYC steps, document capture, selfie/liveness, questionnaires, status screens, video ident, QR handoff, etc.
> Uses the **WebSDK design system** — completely separate from the Dashboard UI Kit.
> ⚠️ Do NOT mix WebSDK tokens/components with Dashboard components in the same mockup.

---

## 🟢 RULE #∞ — Examples sections are the ONLY canonical source. Always copy them; never reinvent.

**This rule overrides every other rule below. Read it, internalize it, and follow it on every screen.**

The WebSDK Organisms file (`8VpSRNe9ur7SBctw0JrtOE`) contains an `Examples` SECTION on every organism page (Welcome, Document Type, Camera, Liveness, Guidelines, PoI, PoA, Steps, Tips, Statuses, etc.). Each Examples section has 2–12 ready-built **Widget instances** demonstrating the canonical assembly: which Widget variant to use (`Type=Content` vs `Type=Camera`), which organism goes inside, what visibility overrides are applied, what padding, what background fill.

**These Examples are the ONLY source of truth. Everything else — `organisms.md`, `base-components.md`, `variables.md`, `examples-library.md`, your own intuition, prior session memory — is secondary.**

### Mandatory workflow for EVERY WebSDK screen the user requests:

1. **Identify the target organism.** From the user's request, derive which organism applies (Welcome / Document Type / Camera / Liveness / etc.). If multiple are needed for a flow, list each one.

2. **Open the Examples section in `8VpSRNe9ur7SBctw0JrtOE`.** Use `use_figma` to load the matching organism page, find its `Examples` SECTION (use the inventory in `reference/examples-library.md` for direct node-ids).

3. **Inspect a canonical Widget instance RECURSIVELY — node-by-node, all the way down.** This is NOT just "Widget level + Content slot organism level" — that's two levels. The canonical Examples have content **at every nesting level** that you must mirror.

   **Walk depth: at least 6 levels deep.** For each node you encounter:
   - Widget variant (`Type=Content` or `Type=Camera`)
   - Visibility state of every Top Bar variant (Size=Large/Medium/Small) — only ONE is `visible: true`
   - Visibility state of `instruction` frame
   - Visibility state of `Image` frame
   - Widget padding (`paddingTop / paddingRight / paddingBottom / paddingLeft`)
   - Widget background fill bound variable (read `boundVariables.fills`)
   - For Type=Content: which organism is in `Content ` SLOT (read `slot.children[0].mainComponent.parent.name` + variant)
   - For Type=Camera: which organism is in `↳ Camera slot#10434:8` (read `componentProperties["↳ Camera slot#10434:8"].value`)
   - Container `layoutSizingHorizontal` (relevant for mobile)
   - **For the organism inside the Widget — INSPECT ITS OWN slots and INSTANCE_SWAP properties:**
     - Walk the organism's children: any node with `type === "SLOT"`?
     - Read the organism's `componentProperties`: any prop of type `INSTANCE_SWAP` whose value is NOT a default placeholder?
     - For each non-default sub-slot/sub-swap in canonical, capture: which component, which variant.
   - **Repeat for sub-organisms.** If the organism inside the Widget contains another organism that ALSO has a slot/swap, walk into that too. The canonical Accesses example has `Accesses` → `Instructions` SLOT → `Instructions/Camera` instance → `Tips / Group` instance — three levels of nesting all populated.

4. **Build by mirroring the canonical Widget exactly — including all nested slot fills.** Same Widget variant. Same visibility state on every toolbar / instruction / Image. Same padding. Same bg fill. Same organism. Same variant string on the organism. Same slot insertion method, applied at EVERY nesting level where canonical has content:
   - SLOT type → `slot.insertChild(0, instance)`
   - INSTANCE_SWAP property → `instance.setProperties({ "PropertyKey": variant.id })`
   - Detect which method applies by reading the property type / node type, not by guessing.

5. **Audit your output recursively.** For each property captured in step 3 at every nesting level, compare your build's value to canonical. Empty inner slots = audit fail. INSTANCE_SWAP property still pointing at default placeholder when canonical points elsewhere = audit fail. Any mismatch is a violation. Audit must show `0 deviations from canonical` (across all nesting levels) before declaring done.

> ⚠️ **Library-version drift:** the SAME organism in the canonical source library file might expose its inner slot as `type: "SLOT"`, while in the consumer file (where you build) it might be exposed as a `type: "INSTANCE_SWAP"` property on the parent organism instance — same logical slot, different API surface. Both methods (insertChild vs setProperties) populate the same visual area but require different code. Always read the actual property type on YOUR file's instance, not on the canonical library instance, to decide which method to call.

> 📌 **Concrete example — Accesses organism:**
> - Canonical Examples (in `8VpSRNe9ur7SBctw0JrtOE`): `Accesses` → child `Instructions` SLOT → `Instructions/Camera` instance inside (`Platform=Desktop, Browser=Safari` for desktop, `Platform=IOS, Browser=Safari` for mobile)
> - Consumer file: `Accesses` instance has property `Slot#6363:0` of type INSTANCE_SWAP. Set via `accesses.setProperties({ "Slot#6363:0": instructionsCameraVariant.id })`. The slot key (`59c110db0432bfa7b963e5b6107b9de3d1cb287d` = `Instructions/Camera` set) is the same in both cases.
> - **A build that only inserts Accesses into the Widget Content SLOT and stops there has populated 1 of 2 nesting levels — the screen looks half-done with empty grey placeholder where Tips/Group should be.**

> 📌 **Concrete example — Tips / Guidelines / Liveness intro screens (Image area MUST be visible):**
>
> Default Type=Content Widget rule says "hide Image frame" — this is correct for Welcome / Document Type / Accesses / Review / Final statuses. **It is WRONG for Tips / Guidelines / Liveness intro / step-instruction screens.**
>
> Canonical Tips Examples (`2287:180771`) show every Widget instance has:
> - `Image#10288:0` = **true** (Image frame visible)
> - `↳  Image#10431:4` = INSTANCE_SWAP pointing at a `Steps` variant (set `48b1e3e308f6d74906213d9f215065ad781eae79`)
>
> The `Steps` set has variants per flow step: `Type=Liveness`, `Type=ID-Front`, `Type=ID-Back`, `Type=Selfie`, `Type=Video-ident`, etc. Each renders the relevant illustration in the 718×240 Image area above the Tips content.
>
> **Inspection check:** when canonical Examples for the target organism have `Image#10288:0 = true`, the build MUST mirror this — set both the boolean AND the INSTANCE_SWAP. If you only set Tips in Content slot but leave `Image#10288:0 = false`, you ship a Tips screen with no illustration.
>
> **Rule for override map decisions:** never apply visibility/property overrides "globally per Widget variant". Always read the canonical Example for THIS specific organism and copy what it has — the same `Type=Content` Widget can have Image=true (Tips/Guidelines) or Image=false (Welcome/Status) depending on which organism it hosts.

### Banned shortcuts (every one of these has appeared in past failed builds):

- "I know how a Welcome screen looks; I'll build it from atoms" — banned
- "Examples is just one variation; I'll make my own" — banned
- "The user wants something custom; canonical doesn't apply" — banned (deviations require explicit user confirmation, see Rule #4.45 deviation protocol)
- "I'll inspect Examples later if audit fails" — banned (inspection is BEFORE build, not after)
- "I have the organism keys from `examples-library.md`; that's enough" — banned (keys are not the same as canonical assembly — visibility overrides, padding, slot insertion are NOT in the keys table)
- "Plugin API has limitations; I'll use overlay/sibling fallback" — banned (see Rule #4.45)
- "I'll skip Examples inspection because the screen is simple" — banned
- "Memory says I built this organism before; I'll reuse what I remember" — banned (memory is hint, Examples is canon)
- "I'll plan first, then inspect Examples for fine-tuning" — banned (inspection is step 2, before plan)

### What "looking at Examples" means concretely:

Not: "I read the file once and have a sense of how it works."
Not: "I read `examples-library.md` and have the organism key."
**Yes:** before writing any `use_figma` build code, run a `use_figma` inspection script that reads the canonical Widget's properties and prints them to your context. Then write the build script using those exact values. Your build log must include a `PHASE — CANONICAL EXAMPLES INSPECTION` section listing the inspected node-id and the captured override map.

If your build log doesn't show that phase, the build is non-compliant — even if the screen looks plausible.

### Why this rule exists

Every WebSDK build that skipped this step has shipped wrong. Cataloged failures:
- KYC build v3.64.0: 9 widgets, all 7 overrides skipped, organisms placed as siblings → fully broken structurally
- POI build session N: built from atoms instead of Widget+organism → 4 attempts before user said "look at Examples"
- Liveness build session N+1: built from atoms first, fixed only after user pointed at Examples
- Mobile uniform-height bug: per-organism heights from Examples copied as-is instead of normalized to 375×812

**The pattern is consistent:** when the skill skips Examples inspection, it produces visually plausible but structurally wrong output. When it inspects Examples first and copies them exactly, the output is correct on first try.

---

## 🟠 KYB context — different from KYC, read this when user mentions KYB

**KYB (Know Your Business) is a separate WebSDK product** from KYC. It has its own component library and architectural pattern.

**Trigger phrases that indicate KYB:** "KYB", "company verification", "business verification", "associated parties", "beneficial owner / UBO", "company documents", "company search", "PoA for KYB", "associated party". When ANY of these appear, switch into KYB mode:

1. **Source file:** `9ii3Ueqr01mbLS3SE6bsrJ` (KYB | Light + Dark)
2. **Canonical examples:** sections on `🟡 Detailed UI/UX (Light)` page (id `1:43`) — General flow / Company search / Company documents / Adding associated parties / We're checking your data / PoA
3. **Shell:** **`Window / *` LOCAL components** (NOT the WebSDK `Widget` set)
4. **Frame size:** 1440×1046 background with centered 512×800 Window inside
5. **Top Bar variant:** `Type=Steps, Stroke=False` (different axis than KYC's `Size=Medium/Small/Large`)
6. **Bottom Bar:** assembled directly as `Toolbar / Bottom Bar / Desktop` instance — variant `Buttons=Two, Stroke=False` (or `Buttons=One`)
7. **Library subscription required:** consumer file must subscribe to KYB library via Assets panel before keys will import. If `importComponentSetByKeyAsync(b0df76296cf872acbf76475d1497b3092003c4e9)` fails, ask user to subscribe.

**Full KYB reference:** `${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/kyb-organisms.md` — contains all 17+ KYB component keys, variant lists, canonical screen anatomy, assembly recipe, section node-IDs.

**Do NOT mix KYB Window shells with KYC Widget shells in the same flow.** Use one OR the other based on the product context.

---

## 🚨 Critical rules — read and follow every time

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

**Banned bypass phrases:**
- "proceeding on current version in auto mode"
- "will mention at the end"
- "auto-accepting outdated plugin"
- "non-interactive mode, continuing with local version"
- "keeping momentum, will re-check after this run"
- "memory says plugin is current, skipping"

---

### Rule #0 — Ask WHERE to create the mockup (HARD STOP)

**Ask before creating anything. Wait for the answer.**

> Where should I create the WebSDK mockup?
> 1. **Existing file** — share a Figma URL (tell me which page/section if relevant)
> 2. **Personal Drafts** — new file in your Drafts (personal tier)
> 3. **Team project** — tell me which team
> 4. **Sumsub org** — new file in the Sumsub organization (recommended for work tasks)

**Forbidden bypass phrases — all are rule violations:**
- "Auto mode: defaulting to Sumsub org"
- "MEMORY.md has a fileKey, so I used it"
- "User worked in file X in the previous session"
- "Prior session already established this — no need to re-ask"
- "Reasonable default given this is a work task, proceeding"

Memory ≠ answer. The only valid source of "where" is the user's current message. If it didn't include a Figma URL or explicit location, ask.

**Page-level placement — always `ensureDraftsPage()` first:**

```js
// MUST be the first call in every use_figma script
const page = figma.root.children.find(p => /drafts/i.test(p.name))
  || figma.root.children[0];
await page.loadAsync();
await figma.setCurrentPageAsync(page);
```

---

### Rule #1 — Check libraries BEFORE starting (HARD RULE)

Call `get_libraries(fileKey)` **before** any `use_figma` call. This is the very first Figma-related action of every WebSDK build session.

**Required libraries for WebSDK mockups:**

| Library name (as shown in `get_libraries`) | Source file (fileKey) | Library key (`lk-…`) |
|---|---|---|
| **WebSDK UI Kit [Base components]** | `Gh2QlRTetoSQdlK9G1nDq4` | needs to be paged — call `get_libraries` with offset 20+ to find it; library key starts with `lk-…` |
| **WebSDK UI Kit [Organisms]** | `8VpSRNe9ur7SBctw0JrtOE` | `lk-62dde7b6f3d37792c1a6ea5cbd86f957d98841f4fc92d9f5a8969734340e956dcdd45ee33185ce003b6c0ad0cf730b6f050560adcb6498f076d6ebd813fa2574` |

> **fileKey vs library key — do not confuse them.** `fileKey` (the part of `figma.com/design/<fileKey>/<name>` URL) is what you pass to MCP tools like `use_figma` and `search_design_system`. **`libraryKey`** (always `lk-…` prefix) is what `get_libraries` returns and what the Figma library subscription system uses. Rule #1 enforcement uses the `lk-…` form.

**Verification protocol — every session:**

1. Call `get_libraries({ fileKey: <target file> })`
2. Check `libraries_added_to_file` for both **WebSDK UI Kit [Base components]** and **WebSDK UI Kit [Organisms]** by name
3. If either is missing:
   a. Look in `libraries_available_to_add` (and paginate with `offset` if needed — both Sumsub libraries are in `source: "organization"` and may be on later pages)
   b. **STOP and tell the user explicitly:**

      ```
      ⚠️ Required library not connected to <file>:
        - WebSDK UI Kit [Base components]      <yes/no>
        - WebSDK UI Kit [Organisms]            <yes/no>

      Please subscribe the missing library in Figma:
      Assets panel → Libraries → search for "WebSDK UI Kit" → click +.

      Alternatively, paste the library key and I'll attempt to import keys directly,
      but you'll lose the in-file Assets panel + future update notifications.
      ```

   c. Wait for the user to subscribe + confirm. Do not build until libraries are present.

**Why this matters even though `importComponentSetByKeyAsync` works without subscription:**

Plugin API can resolve component keys transitively even when the parent library isn't subscribed to the target file — that's what makes the imports succeed. **But this is a degraded state:**

- The user can't see the components in their Figma Assets panel
- Library update notifications won't reach them
- A different artist opening the file would see broken instances if library is detached
- Audits, design reviews, and code-connect lookups depend on subscription

So even when builds *appear* to work, the file is non-canonical without subscriptions. Rule #1 enforces canonical state.

**Banned bypass phrases:**
- "I'll proceed without checking libraries since this is a standard flow"
- "libraries are likely already connected"
- "I checked the file earlier"
- "Plugin API imports work even without subscription, so the build will succeed"
- "I'll add the library check at the end as a verification"

---

### Rule #2 — Read reference files BEFORE any use_figma call

For every WebSDK mockup task, **explicitly read ALL FIVE reference files** before writing any Figma code:

```
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/variables.md
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/base-components.md
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/organisms.md
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/examples-library.md  ← canonical Widget+Organism assembly (KYC)
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/kyb-organisms.md     ← KYB-specific structure (Window/* shells)
```

**For KYC tasks:** `examples-library.md` is the most important.
**For KYB tasks:** `kyb-organisms.md` is the most important — KYB uses `Window / *` LOCAL components from a separate file (`9ii3Ueqr01mbLS3SE6bsrJ`), NOT the Widget shell from WebSDK Organisms. See "KYB does NOT use the standard WebSDK Widget shell" section.

These files are NOT pre-loaded into context. They contain exact component keys, token import keys, and variant names — you cannot guess these correctly. Building without reading them is a rule violation.

**`examples-library.md` is the most important** — it contains the canonical 7-step Widget assembly recipe and links to every `Examples` SECTION in the Organisms file (`8VpSRNe9ur7SBctw0JrtOE`). Always reference it first before building any screen — every organism has a ready-made Widget composition there to mirror.

---

### Rule #3 — WebSDK design system (NOT Dashboard UI Kit)

**WebSDK and Dashboard are separate design systems. Never mix them.**

| Property | Dashboard UI Kit | WebSDK UI Kit |
|---|---|---|
| Font | **Geist** | **Manrope** |
| Icon token category | `semantic/icon/*` | **`semantic/icons/*` (plural)** |
| Spacing token prefix | `spacing/*` | **`semantic/spacing/*`** |
| Border-radius prefix | `border-radius/*` | **`semantic/border-radius/*`** |
| Default bg (Light mode) | `#f6f7f9` (light grey) | **`#20252c` (dark shell)** |
| Card/content bg | `#ffffff` | `#ffffff` |

**Critical differences to internalize:**

1. **Font is Manrope** — never use Geist, Inter, or any other family. All text nodes must use Manrope.

2. **Tokens use `semantic/` prefix for ALL categories** — spacing, border-radius, icons all have `semantic/` prefix. Dashboard has bare `spacing/*` and `border-radius/*` — WebSDK does not.

3. **Icon tokens are PLURAL** — `semantic/icons/primary/normal`, NOT `semantic/icon/primary/normal`. Using the singular form will fail silently (variable not found).

4. **Dark shell pattern** — the outer SDK container (`semantic/background/default/background-normal`) resolves to **`#20252c` (dark)** even in **Light mode**. This is intentional — the WebSDK always has a dark chrome. Content cards inside it are white (`#ffffff` via `semantic/background/secondary/normal`).

5. **Color mode keys** — Light = `1425:0`, Dark = `1425:1`. Always resolve variables in Light mode (`1425:0`) as the primary target.

---

### Rule #4 — Screen anatomy for WebSDK flows

**Always use the `Widget` organism as the outer shell.** Every WebSDK screen in production is built on top of `Widget` set (`232e8d4d5beed4ad18da48386dab7a640ac0ca45`, variant `Type=Content`). Never assemble shells from atom components (toolbars + custom frames) — `examples-library.md` documents this canonical pattern.

**Canonical sizes (matches Examples library):**
- Desktop SDK: **1440 × 960** (full-page overlay)
- Mobile: **375 × 812** (most common) or 375 × 661 / 375 × 660 / 375 × 669 / 375 × 650 / 375 × 471 (varies by organism)

**Widget internal structure (after applying overrides — see examples-library.md):**
```
Widget instance (1440×960 desktop / 375×812 mobile)
├── Toolbar / Top Bar (Size=Medium for desktop, Size=Small for mobile)
└── Container
    ├── instruction (HIDDEN unless QR-handoff prompt needed)
    └── Widget frame
        ├── Image       (HIDDEN unless Steps illustration needed)
        ├── Content SLOT  ← organism goes here via insertChild(0, instance)
        └── Bottom Bar
```

**The Widget master is responsive in size only.** Resizing alone is NOT enough — you must apply 7 instance overrides (top bar visibility, instruction visibility, Image visibility, Container FILL on mobile, padding 0/12/12/12 mobile, organism in slot, bg fill). See `reference/examples-library.md` for the full recipe.

**Shell / container frame:**
- Outer shell fill: `semantic/background/default/background-normal` → `#20252c` (dark)
- Card surfaces inside: `semantic/background/secondary/normal` → `#ffffff`
- Border radius of card: `semantic/border-radius/xl` (16px) or `semantic/border-radius/2xl` (24px)

**Outer shell — always Widget organism:**

| Component | Set key | Variant |
|---|---|---|
| `Widget` | `232e8d4d5beed4ad18da48386dab7a640ac0ca45` | `Type=Content` |
| `Widget` background var | `feed2a5538bb5e0f2fb8a49bde6122c13ad68035` | `semantic/background/secondary/normal` (#fff light, #1b1b1f dark) |

**Organism variants to drop into Content SLOT (by flow step):**

| Step type | Organism | Key |
|---|---|---|
| Onboarding / intro | `Welcome` | `927496fb36399feb71b4304d558be0d37a8fc5a9` |
| Document selection | `Document Type` | `442dd62bd28ea1eade633911188ee851951355f6` |
| Camera / capture | `POI camera Mobile` / `POI camera Desktop` | `58be4845a20470a7258f4225cbfbfe5006e3f4a6` / `228282dceda135813ddbe0a29bc0447d6f13b0bc` |
| Guidelines before selfie/doc | `Guidelines` | `ee868b662794e83115465a04bd7c253d4c60e79f` |
| Tips (do's and don'ts) | `Tips` | `a4f45db0337fd053bbac9adf11434aaa53bcd664` |
| Liveness / selfie | `Selfie Mobile` / `Selfie Desktop` | `63b5ee9d5c0ba84081f36bdc1ea9fea97a72dd59` / `f084df56919e9d34fdfba8bd8a7d0da0013938ee` |
| Document review/preview | `Review` | `09b8c6028793eab17ded1bde19087c3ee4d6e0bd` |
| Proof of Identity | `PoI` | `0d9832d0a09832159dc83af7c50f83fb229c14d1` |
| Proof of Address | `PoA` | `f20729d5fc1b62ce03305606ff77e3db44fdab83` |
| Camera permissions | `Accesses` | `3c05350d6baa4bb621e77700f41887c6cb5f7b80` |
| Email verification | `Input` (email) / `Code` (email) | `99aa5f1de6c064a55cc741fdef95ab758e26dcb7` / `4df460c0223e69547caf98f029d84399472b4c41` |
| Phone verification | `Input` (phone) / `Code` (phone) | `e388d5ae8568912654305ba2f771ce7f6453fdee` / `58e364ca01522b7faffca7dff2c06d6a91de713c` |
| Questionnaire | `Section` | `8848ca9883f60d1f54ea0900f5274417b7dfaaa1` |
| QR handoff to phone | `QR/States` | `ed5e0b8a252f6fc0106587e783d683838568799c` |
| Final status | `Final statuses` | `d3f95404b879e0993ddca2f599e2e5071cdda0ba` |
| Step progress indicator | `Steps NEW` | `c8893dba74df6506596ffccc6f22a407d145e532` |
| Video identification | `Mobile` (video ident) / `Desktop` (video ident) | `9341ec89365d81bafda0065fe9fe93052a79c7fa` / `6e9e5ee2e6d0911f93b51f9675af94ea82a25002` |

---

### Rule #4.4 — Production source is canon (cross-skill universal rule)

This rule is a generalization of Rule #4.5 to any Sumsub design context:

**Whenever a layout pattern doc references a source/canonical file, you MUST inspect that file before building, walk it node-by-node, and mirror the canonical block sequence exactly.** Layout-pattern docs describe *abstract dimensions* — they do not tell you which blocks belong where, in what order, with which variants.

For WebSDK specifically, the canonical source is the **Examples section** of the relevant organism page in `8VpSRNe9ur7SBctw0JrtOE`. For other Sumsub products (TM/AP/CM/Dashboard) the canonical source is listed in the matching pattern doc — see `sumsub-mockup` SKILL.md Rule 7.4.

**Banned rationalizations (universal):**
- "Pattern doc has dimensions; I'll figure out block order"
- "Component catalog tells me what blocks exist"
- "I'll make a plausible-looking layout; user can adjust"
- "Source might be outdated"
- "Skipping inspection — I built similar before"

**Deviations from canonical (e.g. an unimportable block) require explicit user confirmation. Never substitute silently.**

---

### Rule #4.45 — SLOT fill is `insertChild(0, ...)`, NOT appendChild (HARD RULE)

The Content SLOT inside a Widget instance has:
- name: `"Content "` (TRAILING SPACE — match exactly)
- type: `"SLOT"` (NOT `"FRAME"`)

**The ONLY working method to insert an organism into the SLOT is `slot.insertChild(0, organism)`.**

Banned alternatives — these are documented Plugin API failure modes:

| Method | What happens | Why |
|---|---|---|
| `slot.appendChild(organism)` | Silent drop OR "Cannot move into instance" error | appendChild semantics on SLOT type are inconsistent — slot may stay empty |
| `widget.setProperties({ "Content #12831:0": orgComp.id })` | "Slot component property values cannot be edited" error | SLOT properties are read-only via Plugin API |
| Detach widget instance, then insert | "Removing this node is not allowed" / partial flatten | Widget detach flattens only one level; sub-instances stay immutable |
| Place organism as sibling of Widget, position absolutely (overlay) | Visually looks correct but Widget's actual SLOT is empty — organism is structurally orphan | This is the SKILL FALLBACK BAN — see below |

**OVERLAY FALLBACK IS BANNED.** When a previous build run "couldn't fill the slot", the wrong recovery is to place the organism as a Section sibling of the Widget and position it visually over the Widget. Symptoms of this anti-pattern:
- Section has 9 widgets + N organism instances at top level (instead of organisms inside widgets)
- Widget's Content slot is EMPTY
- Audit shows `slotKidsCount: 0` for Type=Content widgets
- Visually plausible but moving the Widget detaches the organism

**Banned rationalizations (heard verbatim in past build logs):**
- "neither method works in current Plugin API" — false; `insertChild(0, ...)` works
- "Plugin API has read-only children inside instances" — true for FRAME children, NOT for SLOT children. SLOT is the API's intended slot mechanism.
- "I'll position the organism over the Widget as a sibling" — banned overlay fallback
- "appendChild error means SLOT can't accept inserts" — wrong; only appendChild fails, insertChild succeeds

Audit: every Type=Content Widget MUST have `slot.children.length >= 1` after build. If 0, either the build skipped insertChild or used overlay fallback. Both are violations.

---

### Rule #4.5 — Use Widget organism + Examples library (HARD RULE)

**Never assemble a WebSDK screen from atoms (custom frames + toolbars + selects).** Every screen MUST use the `Widget` organism (`232e8d4d5beed4ad18da48386dab7a640ac0ca45`, variant `Type=Content`) as outer shell with the appropriate organism (PoI / PoA / Welcome / etc.) inserted into its `Content ` SLOT.

**Workflow for every WebSDK screen request:**

1. **Open `reference/examples-library.md`** — find the Examples section for the target organism
2. **Inspect that section in `8VpSRNe9ur7SBctw0JrtOE`** via Plugin API — read the canonical Widget overrides (visibility, padding, fill)
3. **Replicate the assembly in target file** following the 7-step recipe (see `examples-library.md`)
4. **Audit your output** with the `auditWidget` function from `examples-library.md` — must show 0 issues

**The 7 critical instance overrides (memorize these):**

| # | Property | Mobile | Desktop |
|---|---|---|---|
| 1 | Widget bg fill (bound) | `semantic/background/secondary/normal` (`feed2a5538bb5e0f2fb8a49bde6122c13ad68035`) | same |
| 2 | Visible Top Bar variant | `Size=Small` | `Size=Medium` (NOT `Size=Large`) |
| 3 | `instruction` frame `.visible` | `false` (unless QR-handoff) | `false` (unless QR-handoff) |
| 4a | `Image#10288:0` boolean | **canonical-driven**: `false` for Welcome/DocType/Accesses/Review/Status; **`true` for Tips/Guidelines/Liveness intro** | same |
| 4b | `↳  Image#10431:4` INSTANCE_SWAP | when 4a=true: set to relevant `Steps` variant (set `48b1e3e308f6d74906213d9f215065ad781eae79`) — `Type=Liveness` / `Type=ID-Front` / `Type=ID-Back` / `Type=Selfie` / etc. | same |
| 5 | `Container.layoutSizingHorizontal` | **`FILL`** (must override) | `FIXED` (default OK) |
| 6 | Widget padding `0/T/R/B/L` | **`0/12/12/12`** (must override) | `0/24/24/24` (default OK) |
| 7 | Organism in slot | `slot.insertChild(0, organism)` + `organism.layoutSizingHorizontal = "FILL"` | same |
| 8 | Organism's INNER slots/INSTANCE_SWAP props | recursive — fill every nested level whose canonical Example has content (e.g. Accesses `Slot#6363:0` → `Instructions/Camera`) | same |

**Why each matters (failure modes):**

- Skip #1 → screen has no background, transparent over canvas
- Skip #2 → desktop shows Size=Large with logo (wrong); mobile shows 1392-wide top bar overflowing
- Skip #3 → Container is wider than expected; 650-wide instruction column visible
- Skip #4 → Steps illustration block visible above content (wrong for most screens)
- Skip #5 → mobile widget Container stays at desktop width (1392), Widget frame collapses to w=1
- Skip #6 → mobile content has 24px gutters instead of 12px (looks visually cramped vs example)
- Skip #7 (using `appendChild`) → slot stays empty, content invisible

**Banned shortcut phrases:**

- "I'll build the structure manually since I have the components"
- "Cloning across files should work fine"
- "The Widget will reflow automatically when I resize"
- "The instance inherits all properties from the master"

---

### Rule #4.6 — Mobile heights must be uniform across a flow (HARD RULE)

**When building a multi-screen flow, every mobile widget MUST have the same height.** Use `375 × 812` as the canonical mobile size for every screen in a flow — even for Camera/Liveness screens where the Examples library shows smaller sizes (`375×650`, `375×661`, `375×669`).

**Why:** consistent device height makes the flow visually scannable as a sequence. Varying heights (650 next to 812 next to 661) creates a stair-step that reads as inconsistent UI, even though each individual screen is technically correct.

**The Examples library mixed sizes are reference for individual screen states** (e.g. an ID camera with no toolbar fits 650, with bottom bar fits 812) — they are NOT the canonical size to copy when assembling a flow. Always normalize to `375 × 812` for mobile in flow builds.

**Desktop is always `1440 × 960`** in flows — same uniformity rule.

**Banned phrases:**
- "Examples shows 650 for camera so I'll use 650"
- "Mobile screens can vary per step based on content"
- "The smaller height matches the actual viewport better"

The resize is enough — the inner Camera/Selfie organism reflows automatically inside the larger frame. Run `auditWidget` to verify all overrides still hold after resize.

---

### Rule #5 — No screenshots

Never call `get_screenshot` or any screenshot tool. Inspect via `use_figma` Plugin API only. Screenshots only when user explicitly asks.

---

### Rule #6 — Realistic content always

Never leave default placeholder text. Every organism/component instance must have realistic, varied content:
- Status screens: real status label (e.g. "Your identity is verified", not "Status")
- Questionnaire: real field labels and plausible options
- Tips: actual tip text matching the document type
- Selfie/liveness frames: show correct step state (not always "Placeholder")

---

### Rule #7 — Sections and canvas placement

**Every root frame MUST live inside a SECTION — never directly on the page.**

```js
const section = figma.createSection();
section.name = "WebSDK — ID verification flow (made by Claude)";
section.fills = [{ type: "SOLID", color: { r: 0x40/255, g: 0x40/255, b: 0x40/255 } }];

const spot = findFreeCanvasSpot({ width: 1600, height: 900, gap: 200 });
section.x = spot.x;
section.y = spot.y;
figma.currentPage.appendChild(section);

const root = figma.createFrame();
section.appendChild(root);
root.x = 40;
root.y = 160;

section.resizeWithoutConstraints(root.width + 80, root.height + 200);
```

**Section fill: `#404040`** — always. Name must end with `(made by Claude)`.

**Multi-screen grid** — for ≥4 screens, use columns (3–4 wide), not a single row.

---

### Rule #8 — Bind tokens, never hardcode

Always bind spacing, border-radius, and color values to WebSDK variables.

**Spacing binding pattern (WebSDK tokens):**
```js
const spVar = await figma.variables.importVariableByKeyAsync("KEY");
frame.setBoundVariable("paddingLeft", spVar);
frame.setBoundVariable("paddingRight", spVar);
frame.setBoundVariable("paddingTop", spVar);
frame.setBoundVariable("paddingBottom", spVar);
frame.setBoundVariable("itemSpacing", spVar);
```

**Border-radius binding:**
```js
const rVar = await figma.variables.importVariableByKeyAsync("KEY");
frame.setBoundVariable("topLeftRadius", rVar);
frame.setBoundVariable("topRightRadius", rVar);
frame.setBoundVariable("bottomLeftRadius", rVar);
frame.setBoundVariable("bottomRightRadius", rVar);
```

**Color binding:**
```js
const colorVar = await figma.variables.importVariableByKeyAsync("KEY");
node.fills = [figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", colorVar
)];
```

Key token variables are in `reference/variables.md` — always read that file first.

Zero values do not need variable binding.

---

## WebSDK Design System Reference

> These are quick-reference tables. Always read `reference/variables.md`, `reference/base-components.md`, and `reference/organisms.md` for the full set of import keys.

### Typography (Manrope only)

| Style | Size | Weight | Line Height | Key |
|---|---|---|---|---|
| `Header 1` | 24 | SemiBold | 32 | `249b4131debb951cc3849efe03848b851710f02e` |
| `Header 2` | 16 | Bold | 24 | `d3f6eaa01760fe0f23911f728b2c70ee8c019b43` |
| `Header 3` | 16 | SemiBold | 24 | `bd8389beabc34adbf141b8aa481566d844185dca` |
| `Body Text` | 16 | Medium | 24 | `ec79a8e479b9eb0412892ab3331d4a8411181cde` |
| `Caption` | 14 | Medium | 20 | `c57a9cd17e3fb443544f2e6896bc829d28b0a245` |
| `Button` | 16 | SemiBold | 24 | `7443ac0a044e19ad3b0d7b1a6b3b3c4c1a8e799b` |

```js
// Apply text style
const style = await figma.importStyleByKeyAsync("KEY");
await textNode.setTextStyleIdAsync(style.id);
```

### Key Colors (Light mode)

| Token | Hex | Use |
|---|---|---|
| `semantic/background/default/background-normal` | `#20252c` | SDK outer shell (always dark) |
| `semantic/background/secondary/normal` | `#ffffff` | Content card surface |
| `semantic/background/white/normal` | `#ffffff` | White surface |
| `semantic/background/gray/normal` | `#ecedf2` | Muted/disabled surface |
| `semantic/text/primary/normal` | `#20252c` | Primary text (on white) |
| `semantic/text/white/normal` | `#ffffff` | Text on dark/colored bg |
| `semantic/text/neutral/normal` | `#20252c` | Neutral text |
| `semantic/text/blue/normal` | `#143cff` | Brand link/CTA text |
| `semantic/text/green/normal` | `#008b5e` | Success text |
| `semantic/text/red/normal` | `#d12424` | Error text |
| `semantic/border/blue/normal` | `#143cff` | Brand border/focus |
| `semantic/icons/primary/normal` | `#20252c` | Primary icon |
| `semantic/icons/white/normal` | `#ffffff` | Icon on dark bg |
| `semantic/icons/blue/normal` | `#143cff` | Brand icon |

### Key Spacing Tokens

| Token | Value |
|---|---|
| `semantic/spacing/xs` | 4px |
| `semantic/spacing/s` | 8px |
| `semantic/spacing/m` | 12px |
| `semantic/spacing/l` | 16px |
| `semantic/spacing/xl` | 24px |
| `semantic/spacing/2xl` | 32px |

### Key Border-Radius Tokens

| Token | Value |
|---|---|
| `semantic/border-radius/s` | 4px |
| `semantic/border-radius/m` | 8px |
| `semantic/border-radius/l` | 12px |
| `semantic/border-radius/xl` | 16px |
| `semantic/border-radius/2xl` | 24px |

---

## Import Patterns

```js
// Import a component set (for variant selection)
const set = await figma.importComponentSetByKeyAsync("COMPONENT_KEY");
const variant = set.children.find(c => c.name.includes("Type=Mobile"));
const instance = variant.createInstance();

// Import a single component
const comp = await figma.importComponentByKeyAsync("COMPONENT_KEY");
const instance = comp.createInstance();

// Set variant properties
instance.setProperties({ "Type": "Mobile", "Step": "Camera" });

// Import a variable (spacing/color/radius)
const variable = await figma.variables.importVariableByKeyAsync("VARIABLE_KEY");

// Import a text style
const style = await figma.importStyleByKeyAsync("STYLE_KEY");
await textNode.setTextStyleIdAsync(style.id);
```

---

## Common Gotchas

- **`appendChild` before `layoutSizingHorizontal/Vertical`** — sizing props require the node to already be inside an auto-layout parent.
- **Don't use `(async () => { ... })()` IIFE** — `use_figma` does not await Promise returned from IIFE. Use top-level `await` directly.
- **`primaryAxisSizingMode` / `counterAxisSizingMode`** accept `"FIXED"` or `"AUTO"` — not `"HUG"`.
- **Never mix Dashboard and WebSDK tokens** — `spacing/xl` (Dashboard) ≠ `semantic/spacing/xl` (WebSDK). Different keys, different libraries. A Dashboard token applied to a WebSDK frame will silently use the wrong value.
- **Never mix Dashboard and WebSDK components** — `*Button* / Basic` from WebSDK (`5e6bd44e...`) ≠ `*Button*` from Dashboard (`2c388961...`). They have different properties, different token bindings, and different visual appearance.
- **Icon tokens are PLURAL** — `semantic/icons/*` (not `semantic/icon/*`). Singular form doesn't exist in WebSDK and will silently fail.
- **Dark shell is intentional** — don't try to fix `#20252c` background to white. It's the correct outer shell color. Only the content card inside should be white.
- **Top Bar variants differ** — Mobile top bar (`254391124180127f6e7f06364d0e45d1aa8aa55c`) and Desktop top bar (`495969debf3bd2cabab7b4ba95b7907967b9b12f`) are different component sets with different properties. Use the correct one for the target platform.
- **Widget instance fills are EMPTY by default** — even though the Widget master has `semantic/background/secondary/normal` bound, the instance is created with `fills: []`. You MUST explicitly bind the variable yourself after creating the instance. Without this, the screen has a transparent background and looks broken.
- **`slot.appendChild(organism)` silently drops the organism** in some cases — use `slot.insertChild(0, organism)` instead. Verify by reading `slot.children.length` after insert.
- **Cross-file cloning fails on missing fonts** — Aeonik Pro and SF Pro Text appear in Sumsub source files but aren't installed locally. `node.clone()` works in same parent context but `parent.appendChild(clone)` triggers font load that fails. If you must clone cross-file, do it in the same parent (clone auto-inserts as sibling) and don't manually re-append.
- **Widget responsiveness is partial** — `widget.resize(375, 812)` resizes the outer frame but the Container stays at 1392 wide unless you set `Container.layoutSizingHorizontal = "FILL"`. This is the #1 cause of mobile widgets looking broken.
- **Mobile padding default is wrong** — Widget master has `padding: 0/24/24/24` (desktop). For mobile (375 wide) you must override to `0/12/12/12` to match Examples.
- **Always audit before delivering** — use the `auditWidget` function from `reference/examples-library.md` to verify all 7 overrides are correctly applied. Never deliver a Widget without running this audit.

---

## Memory checklist for every WebSDK build

Before declaring "done":

- [ ] Read `reference/examples-library.md` and identified the target Examples section
- [ ] Inspected Examples in `8VpSRNe9ur7SBctw0JrtOE` to copy override values exactly
- [ ] Used `Widget` set + `Type=Content` variant — not custom frames
- [ ] Bound `semantic/background/secondary/normal` to Widget fills
- [ ] Hidden non-applicable top bar Size variants (only one visible)
- [ ] Hidden `instruction` frame (unless QR prompt is the screen's purpose)
- [ ] Hidden `Image` frame (unless Steps illustration is part of the design)
- [ ] Set `Container.layoutSizingHorizontal = "FILL"` on mobile widgets
- [ ] Set Widget padding to `0/12/12/12` on mobile
- [ ] Inserted organism via `slot.insertChild(0, instance)` + organism `layoutSizingHorizontal = "FILL"`
- [ ] Ran `auditWidget` from `examples-library.md` — 0 issues
