---
name: sumsub-screen-annotations
description: "Add Scenarios annotation blocks above Figma mockup screens. Use when creating flows or when mockups are missing annotations. Proactively suggests adding them."
argument-hint: "[figma-file-url]"
---

# Figma Skill: Screen Annotations (Scenarios)

> Add Scenarios annotation blocks above mockup screens describing key functionality.
> Proactively suggest adding annotations if they're missing.

## What & Why

Scenarios annotations are standardized blocks placed above each screen in a Figma flow. They describe what the screen shows and what the user does, helping reviewers and developers understand the flow without guessing.

**Standard practice for all Sumsub design files.**

---

## 🚨 Hard rules — read before placing ANY annotation

### ONE annotation per screen

One screen = one Scenarios annotation. If the user's prompt implies multiple scenarios (e.g., "hovered row + error states" or "empty + populated + error"), those are **separate screens**, each with its own single annotation — NOT multiple annotations on the same screen.

**Banned** (caught in past builds):
- "3 annotation instances placed beside error-state rows" → wrong, this is per-row callouts. Replace with ONE annotation describing the screen as a whole ("Table with mixed statuses — Active, Pending, Failed, Inactive").
- "annotation per status type" → wrong, pool into one.
- "callout pointing at this specific cell" → wrong, Scenarios aren't callouts. Use an Alert or Tag if you need inline element-level messaging.

### Position: ABOVE the screen, left-aligned

```
y = screen.y - annotation.height - 24    // 24px above the screen's top edge
x = screen.x                             // same x as the screen (left edges align)
```

**Banned positions:**
- `x = screen.x + screen.width + 24` — to the right of the screen (caught in KYB Levels build; annotations floated in the SECTION's grey margin to the right, disconnected from the screen)
- `y = screen.y + N` (inside the screen body) — below the top edge
- `y > screen.y + screen.height` — below the screen
- Aligning y to a specific row's y — annotations describe the screen, not individual rows

### Sizing: HUG width, capped at screen width

```js
annotation.layoutSizingHorizontal = "HUG";
```

The annotation's width auto-sizes to fit its title text — **but HUG has no upper bound**. Long titles make 2000px-wide annotations that overlap the screens to the right.

**Hard cap:** after HUG, check the resulting width. If it exceeds `screen.width - 40`, switch to FIXED and let the text wrap.

```js
annotation.setProperties({
  "✏️ Number#121:0": num,
  "✏️ Title#121:3": title,
});
annotation.layoutSizingHorizontal = "HUG";

if (annotation.width > screen.width - 40) {
  annotation.layoutSizingHorizontal = "FIXED";
  annotation.resize(screen.width, annotation.height);
  // text auto-height handles multi-line wrap
}
```

**Also cap the title length:** keep titles ≤ 120 characters, 1–2 sentences. Longer "scenarios" should be split across multiple screens, each with its own short annotation — annotations describe ONE screen, not an entire feature.

Observed bug (Domain management build, v3.55): 5 of 9 annotations ended up 1793–1985px wide against 1440px screens. Caused 200–425px overlap with neighboring screens in the flow grid. Titles were 130–170 characters, 2–3 sentences.

---

## Component Reference

| Property | Value |
|---|---|
| Component set key | `b5cdb94a14e3e6cd513db397cbd5d1391327896f` |
| Variant | `🔷 Type=Scenario` |
| Number property | `✏️ Number#121:0` |
| Title property | `✏️ Title#121:3` |
| Source file | Appearance customisation (`imuvjJtDS7kM8AOP2p4kFm`) |

---

## Placement Algorithm

```js
// 1. Import the component set
const scenarioSet = await figma.importComponentSetByKeyAsync(
  "b5cdb94a14e3e6cd513db397cbd5d1391327896f"
);

// 2. Create instance and set variant
const annotation = scenarioSet.defaultVariant.createInstance();

// 3. Set properties
annotation.setProperties({
  "✏️ Number#121:0": "1.1",        // step number
  "✏️ Title#121:3": "User sees the main dashboard with applicant list"
});

// 4. Position ~100px above the target screen
const screen = figma.getNodeById("TARGET_SCREEN_ID");
annotation.x = screen.x;
annotation.y = screen.y - 100;

// 5. Set HUG width so annotation fits its text content
annotation.layoutSizingHorizontal = "HUG";

// 6. Append to the same parent as the screen
screen.parent.appendChild(annotation);
```

---

## Numbering Format

**X.Y** — where:
- **X** = main step, mode, or screen group (1, 2, 3...)
- **Y** = sub-step within that group (1.1, 1.2, 1.3...)

Examples:
- `1.1` — First screen of the default flow
- `1.2` — User performs an action on the first screen
- `2.1` — Second flow/mode begins
- `2.2` — Result of the action in the second flow

---

## Writing Style

1. **Language:** Always English
2. **Start with** what is shown OR what the user does:
   - "User sees the main dashboard with applicant list"
   - "User clicks the eyedropper tool to pick a color"
   - "Color picker appears with hex input and palette"
3. **Length:** 1–2 sentences, concise
4. **Focus:** User action + visible result
5. **Avoid:** Technical implementation details, internal state names

### Good Examples
- `"User opens the Appearance page and sees the customization panel"`
- `"User activates the eyedropper and hovers over the preview area"`
- `"Selected color is applied to the element; hex value updates in the input"`

### Bad Examples
- ❌ `"AppearancePage component mounts with default props"` (too technical)
- ❌ `"Step 1"` (not descriptive)
- ❌ `"This screen shows things"` (too vague)

---

## Proactive Behavior

**When reviewing or creating mockups:**
1. Check if Scenarios annotations exist above each screen
2. If missing — **proactively suggest adding them**:
   > "I noticed the mockups don't have Scenarios annotations above them. Want me to add a description to each screen?"
3. When adding: analyze each screen's content to write appropriate descriptions
4. Number sequentially based on the flow order (left-to-right, top-to-bottom)

---

## Batch Creation Example

```js
// For multiple screens in a flow section
const scenarioSet = await figma.importComponentSetByKeyAsync(
  "b5cdb94a14e3e6cd513db397cbd5d1391327896f"
);

const screens = [
  { id: "SCREEN_1_ID", num: "1.1", title: "User sees the main list of applicants" },
  { id: "SCREEN_2_ID", num: "1.2", title: "User clicks on an applicant row to open details" },
  { id: "SCREEN_3_ID", num: "1.3", title: "Detail drawer opens with applicant information" },
];

for (const s of screens) {
  const screen = figma.getNodeById(s.id);
  const ann = scenarioSet.defaultVariant.createInstance();
  ann.setProperties({
    "✏️ Number#121:0": s.num,
    "✏️ Title#121:3": s.title,
  });
  screen.parent.appendChild(ann);
  ann.x = screen.x;
  ann.y = screen.y - 100;
  ann.layoutSizingHorizontal = "HUG";
}
```

---

## Gotchas

- **Always set `layoutSizingHorizontal = "HUG"`** — otherwise the annotation has a fixed width and text may be cut off or leave too much empty space
- **Position before content:** Place the annotation in the same parent frame as the screen, not inside the screen
- **100px gap** is the standard distance above the screen; adjust if screens are close together
- **Don't overlap** with other annotations or screens — check for free space first
