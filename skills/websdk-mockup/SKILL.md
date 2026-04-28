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

### Rule #1 — Check libraries BEFORE starting

Call `get_libraries(fileKey)` to verify connected libraries **before** any `use_figma` call.

**Required libraries for WebSDK mockups:**

| Library | Role | Library key |
|---|---|---|
| **WebSDK UI Kit [Base components]** | Atoms & molecules | `Gh2QlRTetoSQdlK9G1nDq4` |
| **Organisms [WebSDK]** | Full screen organisms | `8VpSRNe9ur7SBctw0JrtOE` |

If either library is missing — STOP and ask the user to connect it. Do not build with invented structures.

**Banned bypass phrases:**
- "I'll proceed without checking libraries since this is a standard flow"
- "libraries are likely already connected"
- "I checked the file earlier"

---

### Rule #2 — Read reference files BEFORE any use_figma call

For every WebSDK mockup task, **explicitly read ALL THREE reference files** before writing any Figma code:

```
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/variables.md
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/base-components.md
Read: ${CLAUDE_PLUGIN_ROOT}/skills/websdk-mockup/reference/organisms.md
```

These files are NOT pre-loaded into context. They contain exact component keys, token import keys, and variant names — you cannot guess these correctly. Building without reading them is a rule violation.

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

WebSDK is a mobile-first overlay SDK, not a full-page dashboard. The fundamental layout units are:

**Mobile screen (390 × 844px — iPhone 14 baseline):**
```
Root (390 × 844)
├── Toolbar / Top Bar / Mobile  (390 × 56–72px) ← navigation chrome
└── Content area                (390 × remaining)
    └── Organism (fills width, variable height)
```

**Desktop SDK widget (480 × variable):**
```
Root (480 × h)
├── Toolbar / Top Bar / Desktop  (480 × 56–72px)
└── Content area                 (480 × remaining)
    └── Organism (fills width, variable height)
```

**Shell / container frame:**
- Outer shell fill: `semantic/background/default/background-normal` → `#20252c` (dark)
- Card surfaces inside: `semantic/background/secondary/normal` → `#ffffff`
- Border radius of card: `semantic/border-radius/xl` (16px) or `semantic/border-radius/2xl` (24px)

**Organism variants to use by flow step:**

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
