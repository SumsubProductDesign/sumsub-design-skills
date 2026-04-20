# Flow Builder — Reference Knowledge Base (corrected)

> Source: `DnjKrpmudNkdNio4P8yFQB` — Workflow Builder file.
> 38 pages, 168 components, 29 component sets. Scanned 2026-04-20.
> ⚠️ First version had wrong component set for nodes. This is corrected from real page inspection.

---

## Page-level layout (measured from real example Workspace 380)

```
Workspace (1440×900)
├── *Sidebar* INSTANCE (x=0, y=0, 257×900)
│     key: e2579193f0ca592605c39761a1570b8bacb2bdae
│     variants: "Integrations, Collapsed" etc.
├── *Header* INSTANCE (x=276, y=0, 1164×64)
│     key: 2689f7829a20be7044c1cf097a434e5c67ac123b
│     variants: "True, Version"
│     contains: Name(x=32,y=16,382×30) + Actions(x=438,y=16,694×32) + Subheader(y=64, 1136×45)
└── Canvas INSTANCE (x=276, y=64, 1164×836)
      key: a4f112bf5c5e8ac05ebf16c328cb28ee6a071146
      variants: Status=Draft / Published / Archive
      SELF-CONTAINS: Dot Grid bg + Top bar + Right bar + Bottom bar (see below)
```

**Canvas component is complete by itself** — just drop it in, bars are positioned correctly.

### Canvas internal layout (all inside the Canvas instance)

| Element | x | y | w | h | Key |
|---|---|---|---|---|---|
| Dot Grid background | 0 | 0 | 1164 | 837 | (inline frame) |
| Canvas Bar / Top | 0 | 0 | 1164 | 64 | `6b4e02b9e752ff8aa9d2376a717354b33cc35812` |
| Canvas Bar / Right | 1100 | 64 | 64 | 708 | `673eab84e7357c142edac29e96eab5e2321285ab` |
| Canvas Bar / Bottom | 0 | 772 | 1164 | 64 | `c09d733fb61107878be5bcac9bf34aa4dab0176b` |

Variants for each bar: `Type=Draft / Published / Archived`.

---

## Canvas nodes — THE ACTUAL ON-CANVAS NODES

❌ **NOT `Modal / Content` set** (that's drawer/modal content, 312px wide).
✅ **USE `Node / Canvas` component** — real canvas nodes (191-246px wide, various heights).

Variants and keys (each variant has its own key since they live in one SET — parent has different variant keys):

| Variant | W × H | Key |
|---|---|---|
| `Node / Canvas / Type=Starting Step` | — | (lookup in component set) |
| `Node / Canvas / Type=Level Step, State=Default, Status=Default` | 246 × 188 | `9b32ce279d39459091152a7d42f2f5339844dcb7` |
| `Node / Canvas / Type=Condition, State=Default, Status=Default` | 246 × 553 | `c97a3dcf4a5978f6838e33397895033ba5d814d4` |
| `Node / Canvas / Type=Action, State=Default, Status=Default` | 191 × 158 | `4ee2165d760acbf05a918b1f5923d87a34c84171` |
| `Node / Canvas / Type=Review Step, State=Default, Status=Default` | 246 × 205 | `976943cea20417386904f24d2b5061612464b0a5` |

All have 3 axes: `Type`, `State` (Default/Hover/Active/Selected), `Status` (Default/Danger/Warning/Success).

### Node sub-components (attached above/beside nodes)

Attached at negative Y (above node) or at x=230 (right edge):

| Component | Position in node | Key |
|---|---|---|
| `Node / Badge / Start` | x=14, y=-25, 66×26 (above, near top-left) | `97bd7bb1b590f9e2198b8dcdf3b8299abca21d20` |
| `Node / Status` | x=230, y=-14, 30×30 (right edge, half-overlapping) | `977fefd82ac404d617fa0dc08828c717df8b1556` (Danger), `3bb82712c1b191d5da5c8096eaeb7defbf86357d` (Warning) |
| `Node / Info Block` | x=0, y=-60, 212×55 (above node) | `4b78e59999940a79fe4a5b817cb0546535d9f795` |

Statuses for `Node / Status`: `Status=Danger / Warning / Success / Default` — variants in one set.

---

## Connectors

✅ Connectors between nodes are **curved SVG VECTORS**, not rectangles. Smooth bezier paths from output port of one node to input port of another.

### Bezier pattern (measured from real examples)

```
M startX startY C (startX+33.5) startY (endX-41.82) endY endX endY
```

- Control point 1: +33.5px horizontal tangent at start (same Y as start)
- Control point 2: −41.82px horizontal tangent at end (same Y as end)
- Produces smooth S-curve with horizontal entry/exit

### Visual properties

- `strokeWeight = 2.51`
- `strokeJoin = "MITER"`
- `strokeAlign = "CENTER"`
- No fill; color bound to semantic variable

### Ports (exit/entry points)

- Connector exits node at `rightEdge + 4` (small gap for visual breathing)
- Connector enters node at `leftEdge − 4`
- Exit Y is NOT always center — for `Condition` nodes with 2+ branches, each branch has its own Y offset (e.g. centerY±30 for two-branch)

### Color logic — IMPORTANT

**Only the `Condition` node emits colored connectors. Every other node emits GREY.**

| Source node | Connector color |
|---|---|
| Starting Step → any | **grey** (`base/neutral/50`) |
| Level Step → any | **grey** |
| Action → any | **grey** |
| Review Step → any | **grey** |
| Condition → branch with condition match | **green** (`base/green/50`) |
| Condition → else branch | **blue** (`base/blue/50`) |

Do NOT color Level→Condition green. It's grey because it originates from a non-Condition node. Only colored connectors are the outputs FROM a Condition.

### Variable keys for connector colors (library)

```
grey:  6d15db46390c9cc50aadb2e6880424e181718f2f  // base/neutral/50 #c4cad4
green: 80ba43b65ffdf989bcac6df037d24dc5da2d1d2b  // base/green/50   #25b793
blue:  bb75e253560dc7b3f54de0123ed73dd7bc7fb309  // base/blue/50    #1764ff
```

---

## Node-placement math (from real example)

Nodes container at x=353, y=186 (workspace coords) → inside Canvas that's at (77, 122).

Horizontal spacing between node columns: **316-394px** (varies). Typical:
- Level Step column: x=0
- Condition column: x=316
- Action column: x=638
- Review Step column: x=908

Vertical spacing between nodes in same column: **~304px** (gives room for info blocks and badges above the next node).

Node widths:
- 246px — standard canvas node (Level, Condition, Review)
- 191px — Action (smaller)

---

## Component keys — quick reference

### Shell
```
Sidebar:            e2579193f0ca592605c39761a1570b8bacb2bdae
Header:             2689f7829a20be7044c1cf097a434e5c67ac123b
Header / Subheader (Tabs):  1fbc833eeaaf90a7fe8d9950df845710aae1ea23
Canvas:             a4f112bf5c5e8ac05ebf16c328cb28ee6a071146
```

### Canvas bars (inside Canvas instance)
```
Top:    6b4e02b9e752ff8aa9d2376a717354b33cc35812
Right:  673eab84e7357c142edac29e96eab5e2321285ab
Bottom: c09d733fb61107878be5bcac9bf34aa4dab0176b
```

### Canvas nodes
```
Level Step:    9b32ce279d39459091152a7d42f2f5339844dcb7
Condition:     c97a3dcf4a5978f6838e33397895033ba5d814d4
Action:        4ee2165d760acbf05a918b1f5923d87a34c84171
Review Step:   976943cea20417386904f24d2b5061612464b0a5
```

### Node attachments
```
Badge / Start:  97bd7bb1b590f9e2198b8dcdf3b8299abca21d20
Status Danger:  977fefd82ac404d617fa0dc08828c717df8b1556
Status Warning: 3bb82712c1b191d5da5c8096eaeb7defbf86357d
Info Block:     4b78e59999940a79fe4a5b817cb0546535d9f795
```

---

## ⚠️ What NOT to do (mistakes I made first time)

1. **DON'T use `Modal / Content` set for canvas nodes** — that's the drawer/configuration UI, not the nodes. Components named `Type=Level | Empty`, `Type=Action | Filled` etc. inside `Modal/Content` are 312px wide drawer contents, confusingly named.

2. **DON'T build canvas+bars manually** — use the `Canvas` instance which contains everything at correct positions.

3. **DON'T use straight rectangles for connectors** — use curved VECTOR paths.

4. **DON'T forget Sidebar** — every full Flow Builder workspace has sidebar at x=0-257.

5. **DON'T assume page header is Flowbuilder-specific** — real examples use the generic `*Header*` (key `2689f...`) with a Subheader/Tabs component, NOT `Flowbuilder / *Header*`.

---

## Build checklist (for next attempt)

Before declaring a Flow Builder workspace done:

- [ ] Sidebar present at x=0, 257px wide
- [ ] Header at x=276, y=0, 1164×64, with Subheader/Tabs below (or as part of)
- [ ] Canvas as single INSTANCE at x=276, y=64, 1164×836 (bars included)
- [ ] Nodes use `Node / Canvas` components, NOT Modal/Content
- [ ] Node sub-components (Badge/Status/Info Block) where appropriate
- [ ] Connectors are curved VECTOR paths
- [ ] Dot grid background visible under nodes
- [ ] Audit passes: no overflow, all variants valid
