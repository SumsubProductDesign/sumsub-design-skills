# Figma Plugin API — gotchas, patterns, and must-know rules

Consolidated from session feedback across many sessions. **Read this before building any custom mockup.** These are the Plugin API pitfalls that will waste 30 minutes if you don't know them.

---

## 1. Instance editing — what works, what doesn't

### ✅ You CAN on component instances
- `setProperties()` — variant props, text overrides, boolean toggles, INSTANCE_SWAP
- Edit text node `.characters` found via `findOne()` inside the instance
- Toggle `.visible` on nested children

### ❌ You CANNOT on instances or nodes inside instances
- `appendChild()`, `insertChild()`, `remove()` — throws "Cannot move node. New parent is an instance or is inside of an instance"
- Change `layoutMode` of nested frames inside instances
- Override `.x` or `.y` on the instance root when its parent forbids it

### Pattern: slot swap (for modals, drawers, custom content)
Never detach. Create a local component with your content and swap the slot:

```js
// 1. Create local component
const bodyComp = figma.createComponent();
bodyComp.name = "Modal Body / My Content";
// … add content to bodyComp …

// 2. Find slot and swap
const slot = modal.findOne(n => n.type === "INSTANCE" && n.name === "Slot / Basic");
slot.swapComponent(bodyComp);

// 3. Set sizing on the swapped instance
const swapped = modal.findOne(n => n.type === "INSTANCE" && n.name.includes("Modal Body"));
swapped.layoutSizingVertical = "HUG";
```

**Never** call `detachInstance()` — you lose the master-component link.

---

## 2. findOne / findAll — beware of scope

`root.findOne(...)` searches the whole subtree, including inside instances. You may find a node you can't modify.

```js
// ❌ Finds *Status* inside Page header instance — then can't insertChild
const status = root.findOne(n => n.type === "INSTANCE" && n.name === "*Status*");

// ✅ Navigate to the specific parent first
const ccFrame = root.findOne(n => n.name === "CheckCollapsible" && n.type === "FRAME");
const status = ccFrame.findOne(n => n.type === "INSTANCE" && n.name === "*Status*");
```

---

## 3. Safe children access

Accessing `.children` on VECTOR, RECTANGLE, LINE, ELLIPSE, TEXT throws `TypeError`. The getter itself throws.

```js
// ❌ Throws on VECTOR/RECTANGLE/etc.
if (node.children) { … }

// ✅ Always wrap
function safeChildren(n) {
  try { return n.children || []; } catch(e) { return []; }
}
```

Same for individual corner-radius props (`topLeftRadius` etc.) — only safe on `FRAME / COMPONENT / COMPONENT_SET / RECTANGLE`.

---

## 4. NONE-layout parent vs auto-layout parent

`layoutPositioning = "ABSOLUTE"` only works when the PARENT has `layoutMode !== "NONE"`. Setting it on a child of a NONE-layout parent throws.

```js
// Parent has layoutMode = "NONE": children are already positioned by x/y, do NOT set layoutPositioning
child.x = 100; child.y = 200;

// Parent has auto-layout: use layoutPositioning to take a child out of the flow
parent.appendChild(child);
child.layoutPositioning = "ABSOLUTE";
child.x = 100; child.y = 200;
```

---

## 5. Stroke API — correct property names

- Correct: `strokeAlign` (no 's')
- Wrong: `strokesAlign` — throws "no such property"

For bottom-only borders (e.g. header divider):
```js
frame.strokes = [{ type: "SOLID", color: {…} }];
frame.strokeAlign = "INSIDE";
frame.strokeWeight = 0;        // reset all sides
frame.strokeBottomWeight = 1;   // then set just the bottom
```

---

## 6. SVG path syntax for createVector

Figma is strict about SVG path data. **Use spaces, not commas**, between coordinates:

```js
// ✅ Works
vec.vectorPaths = [{
  windingRule: "NONE",
  data: `M ${a.x} ${a.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${b.x} ${b.y}`,
}];

// ❌ Fails with "Invalid command at 18,"
data: `M ${a.x} ${a.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${b.x} ${b.y}`
```

---

## 7. Library key vs macket key — always scan the source library

Components referenced in a consuming file (macket) show a DIFFERENT key than their key in the source library. The macket key **FAILS** on import.

- Macket key (from `mainComponent.parent.key` in consuming file) → does NOT work with `importComponentByKeyAsync`
- Library key (from `.key` in source library file) → works

**Rule:** always scan the source library file directly via Plugin API to get correct importable keys. If an import throws "Component with key X not found", you likely have the macket key.

### Known-correct library keys for Applicant page kit (`QKXZwWodIwPVsjAjj4gMnE`)

| Component | Library key (use this) | Macket key (do NOT use) |
|---|---|---|
| AP page header | `afde096fe83bb6a2e474c175e55dd73856303a1a` | `d0fbee02e0077ff7a3f4071b7a6129266f509b9c` |
| Applicant status | `b15e79670bd60789fe6b7d0b958016c683011f15` | `9d5135474d59b54fdfa6a2f282e3d538f6391420` |

Full table: see `reference/ap-component-catalog.md`.

### Not importable (internal, dot-prefix)
`.Content / Events`, `.Events`, `.IP details`, `.Header Full Screen Page / Subheader`.

### Not importable (macket-only wrappers)
`Actions` (`88e04a8e…`), `Subheader` (`c78bdbfc…`). Build manually with Block Title + CheckCollapsible.

---

## 8. Property keys — library vs macket

Component properties (boolean toggles, text overrides) often have DIFFERENT keys in the library instance vs the macket instance.

**Block Title (Body / Title)** example:

| Property | Library key | Macket key |
|---|---|---|
| Title text | `Title name#12928:0` | `Title text#1235:14` |
| First button | `Button#12928:1` | `Buttons#1235:12` |

**Always verify actual keys** on an instance:
```js
const props = inst.componentProperties;
for (const [k, v] of Object.entries(props)) {
  console.log(`"${k}" = ${JSON.stringify(v.value)} (${v.type})`);
}
```

---

## 9. Local variables need getVariableById, not importByKey

`importVariableByKeyAsync` only works for external library variables. For variables defined locally in the current file, use:

```js
// Find local
const locals = await figma.variables.getLocalVariablesAsync("FLOAT");
const spacingLg = locals.find(v => v.name === "spacing/lg");

// Or directly by VariableID
const v = figma.variables.getVariableById("VariableID:XXXXX:XXXXX");
```

If you get "Variable with key X not found", the variable is local — use `getVariableById`.

---

## 10. Always bind variables — never hardcode

For every custom node you create, bind these to library variables:

| Property | Variable category |
|---|---|
| `paddingLeft/Right/Top/Bottom` | `spacing/*` |
| `itemSpacing` | `spacing/*` |
| `cornerRadius` / individual corners | `border-radius/*` |
| `fills` | `semantic/background/*` |
| `strokes` | `semantic/border/*` |
| text fills | `semantic/text/*` |

### Known spacing variable keys (Base components [Dashboard UI Kit])

| Token | Value | Key |
|---|---|---|
| `spacing/2xs` | 4px | `3d3cc3a15da0b893bf326da6053d7a1c37f1d836` |
| `spacing/xs` | 6px | `a4dad7f0e560345e844697b529325a2eca2ff23a` |
| `spacing/s` | 8px | `5a8e4573770ee8f921f141c1ab6c96835c3125a0` |
| `spacing/m` | 12px | `de89b1cae49981816929db80a4e795842e7baf77` |
| `spacing/lg` | 16px | `2b3382099953af94f32cb6ffe5c7f44c74d5fed7` |
| `spacing/xl` | 24px | `7dc2647090da988c17327693bc2224e2308047a2` |
| `spacing/2xl` | 28px | `fceb37ce155723145d25d273574c665a8d7d30e6` |
| `spacing/3xl` | 32px | `a2e089548b83ff33c8ee5e914fa24e67b889b38c` |

### Known border-radius keys

| Token | Value | Key |
|---|---|---|
| `border-radius/s` | 2px | `885152d55a536fb853461592cc3eff926e94858d` |
| `border-radius/m` | 4px | `311dc09093e9474a8b582c8fb7ccc7a628065a20` |
| `border-radius/lg` | 8px | `95839af397884cd7f8fadb34a62d4763f88d68dd` |
| `border-radius/xl` | 12px | `03884e014085a48cf26670632be200a02b5a160c` |

### Zero-values rule

**Don't bind `0`** to a spacing variable. Value 0 stays as 0 — binding it creates confusion and inflates the variable list without meaning.

### Binding syntax
```js
const spacingXl = await figma.variables.importVariableByKeyAsync("7dc2647090da988c17327693bc2224e2308047a2");
frame.setBoundVariable("paddingLeft", spacingXl);
frame.setBoundVariable("paddingRight", spacingXl);
```

---

## 11. Geist font styles — no spaces

Geist uses **one-word style names**:
- Black, Bold, ExtraBold, ExtraLight, Light, Medium, Regular, SemiBold, Thin

Not `"Semi Bold"` (with space) — that's Inter's convention and fails to load for Geist.

```js
await figma.loadFontAsync({ family: "Geist", style: "SemiBold" });  // ✅
await figma.loadFontAsync({ family: "Geist", style: "Semi Bold" }); // ❌ throws
```

Always preload fonts at the start of a script before creating TEXT nodes.

---

## 12. Text overflow in table cells

Inside Table Row / Cell instances, text overflows because intermediate frames default to HUG. Fix algorithm:

1. Find `Content` frame (VERTICAL, direct child of cell) → `layoutSizingHorizontal = "FILL"`
2. Find `Text` frame (HORIZONTAL, direct child of Content) → `layoutSizingHorizontal = "FILL"`
3. Find text TEXT layer inside → `textAutoResize = "HEIGHT"`, `layoutSizingHorizontal = "FILL"`, `textTruncation = "ENDING"`

Notes:
- `resize()` does not work on nodes inside auto-layout instances — always use `layoutSizingHorizontal/Vertical`
- `textAutoResize = "WIDTH_AND_HEIGHT"` ignores truncation — text grows unboundedly
- `maxLines` is ignored in many contexts

---

## 13. No variant grids in specs

Never add "all variants" grids (tables of Primary/Secondary × Default/Hover/Active/…) to specs documentation. All variants are visible in the component itself. Also skip "Reference component" hidden frame. Anatomy = Exhibit (legend + artwork with markers), nothing more.

---

## 14. Copy original exactly, don't improvise

When asked to replicate an existing design (Specs, Applicant page, Flow Builder screen), scan node-by-node and reproduce 1-to-1. Never substitute a hand-built frame for a DS component. Never invent content.

---

## 15. Sub-skill APIs — quick index

| Task | Script |
|---|---|
| Load fonts | `await figma.loadFontAsync({family, style})` at script start |
| Import library component | `await figma.importComponentByKeyAsync(key)` |
| Import library component set | `await figma.importComponentSetByKeyAsync(key)` |
| Import library variable | `await figma.variables.importVariableByKeyAsync(key)` |
| Local variable | `figma.variables.getVariableById("VariableID:…")` |
| Get file libraries | call `get_libraries(fileKey)` via MCP (not Plugin API) |
| Set variant | `inst.setProperties({ "Variant": "Value" })` |
| Swap icon | `inst.setProperties({ "↪ Icon#…": iconComp.id })` (pass `.id`, not component) |
| Bind variable to fill | `figma.variables.setBoundVariableForPaint(paint, "color", variable)` |
| Bind variable to spacing | `frame.setBoundVariable("paddingLeft", variable)` |

---

## 16. Behavior rules

- **Do not take screenshots.** Inspect via `use_figma`. Screenshots only when the user explicitly asks.
- **Do not auto-continue stale plans.** A plan from a previous session is context, not an instruction — ask the user what to do now.
- **Always place new frames on free canvas space.** Scan existing frames' bounds first to avoid overlaps.
- **Fill realistic data.** No placeholder text. No default component states.
- **Self-verify via Plugin API audit before delivering.** Zero issues == ready to share.
