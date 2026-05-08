---
name: sumsub-specs-docs
description: "Generate Specs-style component documentation in Figma — anatomy exhibits with numbered markers, Do/Dont cards. 1076px width, rounded sections, branded Header."
argument-hint: "[component-name]"
---

# Figma Specs Documentation — Component Anatomy Generator

> Skill for creating component documentation pages.
> Verified on Button component (2026-04-08).

## 🚨 Pre-flight: plugin version check — MANDATORY FIRST ACTION

**As the very first action of every session — before any other tool call, before reading any reference — do this:**

1. **Read local version:** `Read` tool on `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. Extract the `version` field.
2. **Fetch remote version:** `WebFetch` tool on `https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json` (prompt: "return the raw JSON"). Extract the `version` field.
3. **Compare SemVer.** If local < remote → continue to step 4. If local ≥ remote → proceed silently.
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
7. **If `yes` / `update`:** run `Bash` with `claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design`. On Bash success, continue with the task. On Bash failure, surface the exact stderr.
8. **If `continue anyway`:** cache the decision for this conversation, proceed.
9. **Once done, don't re-check this conversation.**

**Banned bypass phrases:** "proceeding on current version in auto mode", "will mention at the end", "auto-accepting outdated plugin", "non-interactive mode, continuing with local version", "memory says plugin is current, skipping", "Plugin version check passed as optional / not blocking", "пропускаю как необязательный".

If local plugin.json read or remote WebFetch fails (network / file missing), warn once ("could not verify plugin version, proceeding on faith") and continue.

---

## Overall Structure

```
Specs (root)
  layoutMode: HORIZONTAL
  itemSpacing: 128
  fills: [] (transparent)
  clipsContent: true
  primaryAxisSizingMode: AUTO
  counterAxisSizingMode: AUTO

  └── Specification
        layoutMode: VERTICAL
        itemSpacing: 16
        fills: [] (transparent)
        padding: 0
        width: 1076 (FIXED)
        primaryAxisSizingMode: AUTO

        ├── Header (FRAME)        ← branded header block
        │
        └── Anatomy sections × N
            (NO Reference component, NO Variant grid)
```

---

## Header

The first block of every spec. Contains the Sumsub logo, component title, description, and a link to Storybook.

```
Header (FRAME)
  layoutMode: NONE
  width: 1076 (FILL parent)
  height: ~380 (depends on content)
  cornerRadius: 40
  fills: linear gradient (branded, dark background)
  clipsContent: true

  ├── image (FRAME)              ← decorative background pattern, right side
  │     w: 532, h: 380
  │
  ├── glass (RECTANGLE)          ← semi-transparent overlay, full size
  │     w: 1076, h: 380
  │
  ├── Company Logo (INSTANCE)    ← Sumsub logo, top-left area
  │     w: 55, h: 40
  │     position: x≈52, y≈52
  │
  └── Title (FRAME, VERTICAL)    ← text content, bottom-left area
        w: ~780, position: x≈52, y≈bottom
        itemSpacing: 8

        ├── Component name — Inter Bold 64, #ffffff
        │     Text: component name (e.g. "Button")
        │
        ├── Definition — Manrope Medium 16, #ffffff (opacity ~0.7)
        │     Text: unique description of the component
        │     (Write it yourself — must be unique per component)
        │
        └── Link — Manrope Medium 16, #143cff (blue)
              Text: "Storybook →"
              hyperlink: URL to Storybook page for this component
```

### Header Rules
- **Title and Description MUST be unique** for every component — write them yourself
- **Link** always points to the component's Storybook page with a hyperlink on the TEXT node
- **cornerRadius: 40** — matches all other sections
- If a Header instance already exists in the file, **clone it** and update texts. If not, build the frame manually following the structure above

---

## Anatomy Section

```
Anatomy (FRAME)
  layoutMode: VERTICAL
  itemSpacing: 64         ← between title, exhibit, content
  padding: 64 all sides
  fills: #ffffff (white)
  cornerRadius: 40
  width: 1076 (FILL parent)
  primaryAxisSizingMode: AUTO
```

### Section Title
- **Font:** Inter Bold 48
- **Color:** #000000
- **Examples:** "Anatomy", "Button states", "Icons", "Shortcuts", "Add button"

---

## Exhibit (Anatomy + Markers)

The Exhibit shows the component with numbered markers pointing to its parts.

```
Exhibit (FRAME)
  layoutMode: HORIZONTAL
  itemSpacing: 64
  fills: []
  primaryAxisSizingMode: AUTO (HUG)
  counterAxisSizingMode: AUTO (HUG)

  ├── Content (legend)        w=481 FIXED, h=HUG
  └── Artwork (component)     w=FIXED, h=FIXED
```

### Content (Legend)

```
Content (FRAME)
  layoutMode: VERTICAL
  itemSpacing: 24
  width: 481 (FIXED)
  primaryAxisSizingMode: AUTO
  fills: []
```

Each child is an **Anatomy item**:

```
Anatomy item (FRAME)
  layoutMode: VERTICAL
  itemSpacing: 8
  paddingLeft: 28          ← indent from the dot
  primaryAxisSizingMode: AUTO
  counterAxisSizingMode: AUTO
  fills: []

  ├── Name (FRAME, HORIZONTAL, spacing 6)
  │   ├── Type icon (FRAME 20x20, grey placeholder or actual icon)
  │   └── Text — Inter Bold 16, #000000
  │
  ├── Dot (FRAME 20x20, cornerRadius 100, fill #c54600)
  │   └── Number — Inter Bold 12, #ffffff, centered (textAutoResize: NONE, resize to 20x20)
  │
  └── Attributes (FRAME, VERTICAL, spacing 4)
      └── Attribute row (FRAME, HORIZONTAL, spacing 4)
          ├── Name — Inter Regular 12, #000000 (e.g. "Depends on :")
          └── ]-[ (FRAME, HORIZONTAL, pad 4/0/4/0)
              └── Value — Inter Regular 12, #000000 (e.g. "*Counter*")
```

**Anatomy item content rules:**
- Each structural child of the component gets an item
- Wrapper frames AND their child instances get separate items
- **Attributes — NO dimensions** (no Height/Width). Use instead:
  - `Depends on: componentName` — for wrappers and nested instances
  - `Text style: medium/body-m` — for text nodes
  - `Type: X, State: Y` — for component variants

### Artwork

```
Artwork (FRAME)
  layoutMode: NONE (absolute positioning!)
  fills: #f2f2f2 (light grey)
  strokes: [] (none!)
  cornerRadius: 0
  width/height: FIXED (sized to fit component + marker space)
```

**Contents:**
1. **Component instance** — the "maximum" variant (see below)
2. **Markers** — one per anatomy item, connecting to the corresponding child

### Maximum Variant Rule

The component in the Artwork must show ALL optional elements enabled:
- All boolean properties set to `true` (icons, counters, badges, etc.)
- Largest size variant (e.g. "Large")
- Default state, Default status
- This ensures every structural child is visible and can have a marker

**Algorithm:**
```js
const instance = componentSet.defaultVariant.createInstance();
// Enable all boolean properties
for (const [key, prop] of Object.entries(instance.componentProperties)) {
  if (prop.type === "BOOLEAN") {
    instance.setProperties({ [key]: true });
  }
}
// Set to largest size if available
try { instance.setProperties({ "Size": "Large" }); } catch(e) {}
```

---

## Markers

Markers are vertical connector lines with numbered dots, linking anatomy items to component parts.

```
Marker (FRAME)
  layoutMode: NONE
  fills: [] (transparent)
  width: 24, height: varies

  ├── Rectangle (line)
  │   width: 1, height: marker.height
  │   x: 12 (centered in 24px frame)
  │   y: 0
  │   fills: #c54600

  └── Dot
      FRAME 24x24, cornerRadius: 100, fills: #c54600
      x: 0
      y: 0 (above) or marker.height-24 (below)
      └── Number — Inter Regular 12, #ffffff, centered
```

### Marker Positioning Algorithm

```
For each anatomy item (child of the component):

1. Find the child node in the artwork instance
2. Get child's absolute position relative to artwork:
   childCenterX = child.absX_in_artwork + child.width / 2
   childTopY = child.absY_in_artwork
   childBottomY = child.absY_in_artwork + child.height

3. marker.x = childCenterX - 12  (center the 24px marker over child center)

4. Direction:
   - Direct children of content frame → marker ABOVE
   - Grandchildren (e.g. icon inside wrapper) → marker BELOW
   - If parent and child share same X center → parent above, child below

5. For markers ABOVE:
   markerTopY = some fixed top margin (e.g. component.y - 48)
   marker.y = markerTopY
   marker.height = childTopY - markerTopY
   Dot at y=0 (top of marker frame)
   Line: resize(1, marker.height), y=0

6. For markers BELOW:
   marker.y = childBottomY
   marker.height = 60 (standard length)
   Dot at y=marker.height-24 (bottom of marker frame)
   Line: resize(1, marker.height), y=0
```

### Programmatic Marker Placement

```js
function getChildPositionsInArtwork(instance, artwork) {
  const artAbs = artwork.absoluteTransform;
  const positions = [];
  
  function walk(node, depth, parentName) {
    if (!node.children) return;
    for (const child of node.children) {
      if (child.visible === false) continue;
      const abs = child.absoluteTransform;
      const relX = abs[0][2] - artAbs[0][2];
      const relY = abs[1][2] - artAbs[1][2];
      positions.push({
        name: child.name,
        type: child.type,
        x: relX,
        y: relY,
        width: child.width,
        height: child.height,
        depth: depth,
        parentName: parentName,
        centerX: relX + child.width / 2,
      });
      walk(child, depth + 1, child.name);
    }
  }
  
  // Start from the instance's content frame (usually first child)
  const contentFrame = instance.children[0];
  if (contentFrame) walk(contentFrame, 0, instance.name);
  return positions;
}

function placeMarkers(artwork, instance, anatomyItems) {
  const positions = getChildPositionsInArtwork(instance, artwork);
  const MARKER_TOP = instance.y - 48; // 48px above component
  
  for (let i = 0; i < anatomyItems.length; i++) {
    const item = anatomyItems[i];
    const child = positions.find(p => p.name === item.childName);
    if (!child) continue;
    
    const isAbove = item.direction === "above";
    const markerX = child.centerX - 12;
    
    let markerY, markerH, dotY;
    if (isAbove) {
      markerY = MARKER_TOP;
      markerH = child.y - MARKER_TOP;
      dotY = 0;
    } else {
      markerY = child.y + child.height;
      markerH = 60;
      dotY = markerH - 24;
    }
    
    // Create marker frame
    const m = figma.createFrame();
    m.name = "Marker: " + item.childName;
    m.resize(24, Math.max(markerH, 30));
    m.fills = [];
    m.x = markerX;
    m.y = markerY;
    
    // Line
    const line = figma.createRectangle();
    line.resize(1, m.height);
    line.x = 12; line.y = 0;
    line.fills = [{ type: "SOLID", color: { r: 197/255, g: 70/255, b: 0 } }];
    m.appendChild(line);
    
    // Dot
    const dot = figma.createFrame();
    dot.resize(24, 24);
    dot.cornerRadius = 100;
    dot.fills = [{ type: "SOLID", color: { r: 197/255, g: 70/255, b: 0 } }];
    dot.x = 0; dot.y = dotY;
    
    const numText = figma.createText();
    numText.fontName = { family: "Inter", style: "Regular" };
    numText.fontSize = 12;
    numText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    numText.characters = String(i + 1);
    numText.textAlignHorizontal = "CENTER";
    numText.textAlignVertical = "CENTER";
    numText.resize(24, 24);
    numText.textAutoResize = "NONE";
    dot.appendChild(numText);
    m.appendChild(dot);
    
    artwork.appendChild(m);
  }
}
```

---

## Do Card

Used to show usage examples with "Do" / "Don't" annotations.

```
Do card (FRAME)
  layoutMode: VERTICAL
  itemSpacing: 0
  padding: 24 / 24 / 8 / 24  (top/right/bottom/left)
  cornerRadius: 24
  clipsContent: false
  fills: []  (transparent — no background!)
  layoutSizingVertical: HUG

  ├── RatioImage (FRAME)
  │     layoutMode: NONE (absolute positioning for contents!)
  │     cornerRadius: 16
  │     clipsContent: true
  │     fills: #ffffff (white)
  │     strokes: #25b793 (green for Do) or #f5222d (red for Don't), strokeWeight: 2
  │     layoutSizingHorizontal: FILL
  │     height: FIXED (353px standard, varies)
  │
  │     ├── Tag — see Tag Rules below
  │     │
  │     └── Component instances (absolutely positioned in center area)
  │         ALWAYS place real instances — never leave RatioImage empty
  │
  └── Text (FRAME, VERTICAL)
        padding: 12/0/12/0
        └── _text — Geist Medium 16, lineHeight 24px, #212736
                     textAutoResize: HEIGHT
```

### Tag Rules

**Do card tag** — manual ⚙️Tag frame:
```
⚙️Tag (FRAME, HORIZONTAL)
  position: x=20, y=20
  padding: 4/12/4/12
  cornerRadius: 12
  itemSpacing: 16
  fills: #25b793 (green)
  └── _label — Geist Bold 18, #ffffff, lineHeight: 24px (explicit PIXELS)
              text: "Do"
```

**Don't card tag** — use INSTANCE of `Do and dont tag` component:
```
Component key: "0ca46296a294a5e9d8c634941e7ab27a2f81fd30"
Property: "Property 1" = "Dont"
Position: x=19, y=21
Don't card stroke color: #f5222d (RED, not #c54600 orange)
```

### Do Card Sizes
- **Small (400px):** Single example, standalone
- **Full-width (948px = 1076 - 2×64 padding):** Multiple examples side by side, `layoutSizingHorizontal: FILL`

### Do Card Rows
When multiple small Do cards appear in a row:
```
Row frame (FRAME)
  layoutMode: HORIZONTAL
  itemSpacing: 64
  fills: []
  primaryAxisSizingMode: AUTO (HUG)
  counterAxisSizingMode: AUTO (HUG)

  ├── Do card (400px or smaller to fit)
  ├── Do card
  └── Do card
```

---

## Description Block

Used between Do cards for section explanations.

```
Description (FRAME)
  layoutMode: VERTICAL
  itemSpacing: 8
  fills: []
  layoutSizingHorizontal: FILL

  ├── Title (FRAME, HORIZONTAL, spacing 15)
  │   └── Text — Inter Semi Bold 24, #212736
  │
  └── Description text — Inter Regular 20, #212736
                          textAutoResize: HEIGHT
                          layoutSizingHorizontal: FILL
```

---

## Section Types

### 1. Anatomy Section (with Exhibit)
Title + Exhibit (Content legend + Artwork with markers)

### 2. States Section (itemSpacing: 40 instead of 64)
Title + Do cards + Description blocks
Used for: Button states, loading, disabled, hover, focus, active

### 3. Simple Section
Title + Description + Component instances or Do cards
Used for: Left-aligned buttons, Icons, Add button

---

## Color Reference

| Element | Color | Hex |
|---|---|---|
| Marker dot & line | Orange | `#c54600` |
| Marker number text | White | `#ffffff` |
| Section background | White | `#ffffff` |
| Section cornerRadius | — | `40` |
| Artwork background | Light grey | `#f2f2f2` |
| Do card RatioImage stroke (Do) | Green | `#25b793` |
| Do card RatioImage stroke (Don't) | Red | `#f5222d` |
| Do card ⚙️Tag (Do) | Green | `#25b793` |
| Don't card tag | Red | `#f5222d` (via component instance) |
| Title text | Black | `#000000` |
| Description title | Dark grey | `#212736` |
| Description body | Dark grey | `#212736` |
| Do card body text | Dark grey | `#212736` |
| Anatomy item name | Black | `#000000` |
| Anatomy item attribute | Black | `#000000` |

## Font Reference

| Element | Font | Size |
|---|---|---|
| Section title | Inter Bold | 48 |
| Description title | Inter Semi Bold | 24 |
| Description body | Inter Regular | 20 |
| Anatomy item name | Inter Bold | 16 |
| Anatomy item attribute label | Inter Regular | 12 |
| Anatomy item attribute value | Inter Regular | 12 |
| Marker dot number | Inter Regular | 12 |
| Anatomy dot number | Inter Bold | 12 |
| Do card tag label | Geist Bold | 18 |
| Do card body text | Geist Medium | 16/24 |

---

## Component Keys Used in Specs

| Component | Key |
|---|---|
| Do and dont tag | `0ca46296a294a5e9d8c634941e7ab27a2f81fd30` |
| Cursor (Pointer variant) | `9067422ce117ceb72175cff1e4f97202a67776e5` |
| normal/archive icon | `b08481e2839891338af120b7838825377c1be2f3` |
| normal/image icon | `38ee88902fdb8a8ca37075e5ba63653d5c5ac3bb` |

---

## Workflow: Creating Documentation for a Component

1. **Create the Header** — clone an existing one or build manually. Set unique Title, Description, and Storybook link
2. **Import the component set** via `importComponentSetByKeyAsync`
3. **Create the maximum variant** — enable all boolean props, use largest size
4. **Analyze the component tree** — walk visible children to find structural parts
5. **Build the anatomy items list** — name, attributes (Depends on / Text style / Type+State), marker direction
6. **Calculate artwork size** — component size + margins for markers (48px above, 60px below)
7. **Place the component** centered in artwork
8. **Place markers** using the positioning algorithm above
9. **Build Content legend** with anatomy items matching marker numbers
10. **Add Do cards** for usage examples — always with real component instances inside
11. **Add Description blocks** for explanations
12. **Verify via Plugin API** — check all widths, cornerRadius, content before delivering

---

## Key Gotchas

- **Artwork is NONE layout** — all children are absolutely positioned
- **Do card has NO fills** — transparent background, only RatioImage has white fill + colored stroke
- **Do card clipsContent = false** — content can extend beyond card bounds
- **RatioImage is NONE layout** — tag and component instances are absolutely positioned inside
- **⚙️Tag: cornerRadius 12, itemSpacing 16, label lineHeight 24px explicit**
- **Don't tag** — INSTANCE of `Do and dont tag` component (not manual frame), stroke #f5222d (red)
- **Don't stroke is RED (#f5222d)**, not orange (#c54600)
- **Markers above vs below** — direct children above, grandchildren (nested instances) below
- **Maximum variant** — ALL boolean properties must be `true` for the anatomy artwork
- **Section spacing varies**: anatomy sections use 64, states section uses 40
- **Always `appendChild` before setting `layoutSizingHorizontal = "FILL"`**
- **No variant grids** — variants are visible in the component itself
- **No Reference component** — hidden frame with default variant is not needed
- **No dimensions in legend** — use "Depends on", "Text style", "Type/State" instead
- **Always verify all details via Plugin API before delivering to user**
- **Header** — clone from an existing spec if available, or build manually per the structure above
- **Content width** = 1076 - 128 (padding) = **948px** for full-width Do cards
