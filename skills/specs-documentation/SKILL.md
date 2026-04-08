---
name: specs-docs
description: "Generate Specs-style component documentation in Figma — anatomy exhibits with numbered markers, Do/Dont cards, variant grids. Use when creating or updating component documentation pages."
argument-hint: "[component-name]"
---

# Figma Specs Documentation — Component Anatomy Generator

> Skill for creating component documentation pages that match the Specs plugin output.
> Based on reverse-engineering the Specs plugin (studied 2026-04-08 on Button component).

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
        itemSpacing: 50
        fills: [] (transparent)
        padding: 0
        width: 1456 (FIXED)
        primaryAxisSizingMode: AUTO

        ├── Documentation / Page Header (INSTANCE)
        │     componentKey: "d7d427652fe400efad08bfa0a83682baaee9090c"
        │     layoutSizingHorizontal: FILL
        │     layoutSizingVertical: HUG
        │
        ├── Reference component (FRAME, HIDDEN)
        │     100x100, fills: [], visible: false
        │     Contains: default variant instance of the component
        │
        └── Anatomy sections × N
```

---

## Anatomy Section

```
Anatomy (FRAME)
  layoutMode: VERTICAL
  itemSpacing: 64         ← between title, exhibit, grid
  padding: 64 all sides
  fills: #ffffff (white)
  width: 1456 (FIXED via counterAxisSizingMode)
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
          ├── Name — Inter Regular 12, #000000 (e.g. "Height :")
          └── ]-[ (FRAME, HORIZONTAL, pad 4/0/4/0)
              └── Value — Inter Regular 12, #000000 (e.g. "16")
```

**Anatomy item content rules:**
- Each structural child of the component gets an item
- Wrapper frames (e.g. "Left Icon Wrapper") AND their child instances (e.g. "normal/search") get separate items
- Attributes show: dimensions (Height/Width), dependencies (Depends on: componentName), text styles, border radius, etc.

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
  fills: []  (transparent — no background!)
  layoutSizingVertical: HUG

  ├── RatioImage (FRAME)
  │     layoutMode: NONE (absolute positioning for contents!)
  │     cornerRadius: 16
  │     fills: #ffffff (white)
  │     strokes: #25b793 (green), strokeWeight: 2
  │     layoutSizingHorizontal: FILL
  │     height: FIXED (353px standard, varies)
  │
  │     ├── ⚙️Tag (FRAME, HORIZONTAL)
  │     │     padding: 4/12/4/12
  │     │     cornerRadius: 12
  │     │     fills: #25b793 (green for "Do") or #c54600 (orange for "Don't")
  │     │     position: x=20, y=20
  │     │     └── _label — Geist Bold 18, #ffffff ("Do" or "Don't")
  │     │
  │     └── Component instances (absolutely positioned in center area)
  │
  └── Text (FRAME, VERTICAL)
        padding: 12/0/12/0
        └── _text — Geist Medium 16, lineHeight 24px, #212736
                     textAutoResize: HEIGHT
```

### Do Card Sizes
- **Small (400px):** Single example, standalone
- **Full-width (1328px = section width - 2*64 padding):** Multiple examples side by side, `layoutSizingHorizontal: FILL`

### Do Card Rows
When multiple small Do cards appear in a row:
```
Row frame (FRAME)
  layoutMode: HORIZONTAL
  itemSpacing: 64
  fills: []
  primaryAxisSizingMode: AUTO (HUG)
  counterAxisSizingMode: AUTO (HUG)

  ├── Do card (400px)
  ├── Do card (400px)
  └── Do card (400px)
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
Title + Exhibit (Content legend + Artwork with markers) + optional Variant grid

**Variant grid:**
```
Grid frame (FRAME)
  layoutMode: NONE (manual positioning!)
  width: 1328, height: varies
  fills: []
  Contains: component instances at specific x,y positions
  Grid spacing: ~148px columns, ~39px rows (32 for small variants)
```

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
| Artwork background | Light grey | `#f2f2f2` |
| Do card RatioImage stroke | Green | `#25b793` |
| Do card ⚙️Tag (Do) | Green | `#25b793` |
| Do card ⚙️Tag (Don't) | Orange | `#c54600` |
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

## Workflow: Creating Documentation for a Component

1. **Import the component set** via `importComponentSetByKeyAsync`
2. **Create the maximum variant** — enable all boolean props, use largest size
3. **Analyze the component tree** — walk visible children to find structural parts
4. **Build the anatomy items list** — name, attributes (dimensions, dependencies), marker direction
5. **Calculate artwork size** — component size + margins for markers (48px above, 60px below)
6. **Place the component** centered in artwork
7. **Place markers** using the positioning algorithm above
8. **Build Content legend** with anatomy items matching marker numbers
9. **Build variant grid** if needed — NONE layout with manually positioned instances
10. **Add Do cards** for usage examples
11. **Add Description blocks** for explanations

---

## Key Gotchas

- **Artwork is NONE layout** — all children are absolutely positioned
- **Variant grid is NONE layout** — instances manually placed on a grid
- **Do card has NO fills** — transparent background, only RatioImage has white fill + green stroke
- **RatioImage is NONE layout** — tag and component instances are absolutely positioned inside
- **⚙️Tag cornerRadius = 12** (not 100)
- **Markers above vs below** — direct children above, grandchildren (nested instances) below
- **Maximum variant** — ALL boolean properties must be `true` for the anatomy artwork
- **Section spacing varies**: anatomy sections use 64, states section uses 40
- **Always `appendChild` before setting `layoutSizingHorizontal = "FILL"`**
