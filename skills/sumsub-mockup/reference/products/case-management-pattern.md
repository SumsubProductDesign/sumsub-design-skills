# Case Management — Layout Patterns

> Patterns observed in CM source files (`ieTGS0ab6tqr3zwXRYPHIu`, `P5ADMBMcKZ4E4V0VKMOTU2`, `p9dbXiQTeloyS45eW5P3JV`, `dtgJZJmVO1VPCr3fI5MohS`, `86VzYfJdRwSvvpdJ2cGsX0`).
> Scan date: 2026-04-28.

CM uses **four distinct layout patterns** depending on the screen type. Pick the right pattern for the task — wrong pattern = wrong dimensions and broken hierarchy.

---

## Pattern A — Standard List (Sidebar + Header + Content)

> Used for: All cases, My cases, Blueprint queue, Overview for managers, FIU reports table, Blueprints table.
> Identical to global `Pattern 1 — Standard List/Table Page` in `layout-patterns.md`.

```
Root (1440 × 900)
├── *Sidebar*  (257 × 900, full sidebar, Type=Case management Collapsed=False)
└── Main (1183 wide, FILL × FILL)
    ├── *Header* (1183 × 64) — page title, CTA, Help/lang chrome
    └── Content (1183 × 836)
        ├── (optional) Tabs / Top Toolbar
        └── Table or Cards Row + Table
```

**Confirmed dimensions** from samples:
- Blueprint queue: `*Sidebar* 257×900` + `Frame 270990599 1183×1296` (scrollable)
- Overview for managers / general: `*Sidebar* 257×900` + `Frame 270990662 1183×1624`
- Settings - Blueprints: `*Sidebar* 257×900` + `*Header* 1183×64` + `Content 1183×836`

**Sidebar variant for CM:** `Type=Case management, Collapsed=False`. After mounting, set the active nav item to match the current page (Overview / All cases / My cases / Blueprints / FIU reports). See audit 7.40 in `sumsub-mockup/SKILL.md` for active-item rules.

---

## Pattern B — Case Detail (no Sidebar, custom 88px header, 2-column body)

> Used for: **Case page** in `ieTGS0ab6tqr3zwXRYPHIu`.

```
Root (1440 × 900+, NONE layout, absolute positioning)
├── Case page header (1440 × 88, INSTANCE)            ← x=0, y=0. Key: 070118da7e99...
│
├── Frame 270990504 (992 × 804, left content WRAPPER)  ← x=0, y=96. VERTICAL, no padding, clipsContent=true
│   ├── .Header Full Screen Page / Subheader (992 × 56, FRAME)   ← contains Tab Basic
│   │   - HORIZONTAL, paddingL=32, paddingR=32, paddingT=0, paddingB=1
│   │   - **primaryAxisAlignItems=CENTER, counterAxisAlignItems=MAX** (Tab Basic bottom-aligned at y=23)
│   │   └── *Tab Basic* (928 × 32, layoutSizingHorizontal=FILL)
│   │       └── 6 tabs: Overview (selected) / AML / Related cases / Financial data / FIU reports / Events
│   │
│   └── Container (992 × 2401+, scrollable, FRAME)              ← real content
│       - VERTICAL, paddingL=32, paddingR=24, paddingT=24, paddingB=24, itemSpacing=24
│       - primaryAxisSizingMode=AUTO (hugs height to content), counterAxisSizingMode=FIXED
│       └── Case page Overview tab content (932 × variable, INSTANCE)  ← key 937dcc91...
│           - layoutSizingHorizontal=FIXED at 932
│
└── Case page right column (424 × 804, INSTANCE)      ← x=992, y=96. Key: 768dad45...
    - VERTICAL, no padding
    ├── .Right Column Header
    ├── .Case page checklist
    └── .Case page notes
```

### Why two-level wrapping on the left

The pattern is NOT "drop the Overview tab content directly into root". It's a deliberate two-level structure:

1. **Frame 270990504** (the outer wrapper) — owns the 992×804 viewport at x=0, y=96. No padding. clipsContent=true so the inner Container scrolls without bleeding.
2. **Subheader + Container** are children of Frame 270990504, stacked vertically:
   - Subheader is a thin 56px row that holds the Tab Basic with horizontal padding so tab labels align to x=32.
   - Container holds the scrollable Overview content with paddingL=32 paddingR=24 paddingT=24 paddingB=24 — these are the canonical Case page paddings. NEVER drop the Overview component directly without this Container.

If you skip the wrappers and place the Overview component at root x=0 w=992, it gets stretched (intrinsic width is 932) AND the page loses its proper 32px left / 24px right gutters.

**Key differences from Applicant page (Pattern 2 in global `layout-patterns.md`):**

| Metric | Applicant page | Case page |
|---|---|---|
| Sidebar | Collapsed 52px | **None** |
| Page header height | 152px | **88px** |
| Left content column | 1008 (after 52 sidebar + 380 summary) | **992** (no sidebar, no summary panel) |
| Right column / panel | 380 (Summary, fixed) | **424** (right column, sticky) |
| Header x | 52 | **0** (full width) |

**Confirmed dimensions** from `4045:2323380` (Case page - Overview):
- `Case page header` INSTANCE: `1440 × 88` at **x=0, y=0** (full width)
- `Frame 270990504` (left wrapper): `992 × 804` at **x=0, y=96**
- `Case page right column` INSTANCE: `424 × 804` at **x=992, y=96**
- Drawer overlay (Financial data view): `*Drawer Basic* 600 × 900` from `4762:286760`

**Critical spacing — page-level (root frame children):**

- **8px gap below header** — content starts at y=96, NOT y=88.
- **0px gap between left wrapper and right column** — right column at x=992, directly touching left wrapper's right edge.
- **24px right margin** — right column ends at x=1416, leaving 24px to screen edge at 1440.
- **0px left margin** — left wrapper at x=0 (no left page-edge padding).

Layout sum: `0 + 992 + 0 + 424 + 24 = 1440` ✓

**Critical spacing — INSIDE the left wrapper (Frame 270990504):**

- Subheader: `paddingL=32, paddingR=32` (Tab Basic content sits between x=32 and x=960)
- Container: `paddingL=32, paddingR=24, paddingT=24, paddingB=24, itemSpacing=24`
- Effective content area inside Container: `992 - 32 - 24 = 936` px wide. The Overview tab content INSTANCE is locked at 932 wide (FIXED), giving a 4px right-side scroll allowance.

**The visual "32px left / 24px right" of Case page content lives inside the Container, NOT at root.** If you skip the Container wrapper and place content at root x=0 w=992, the entire 32/24 padding system disappears.

> **Common mistakes** (caught in v3.60 build, file `DnjKrpmudNkdNio4P8yFQB`):
> - Placing right column at `x = 1016` (992 + 24px gap) → 0px right margin. Wrong: gap is on the RIGHT, not BETWEEN.
> - Placing Overview tab content directly at root `x=0, w=992` → stretches the component (intrinsic 932) AND removes the 32/24 internal gutters.
> - Missing the 8px gap under header (using `y=88` instead of `y=96`).

**Tabs row** sits inside `Frame 270990504` at the top — typical Sumsub `*Tab Basic*` instance.

### Tabs observed on Case page

| Tab | Frame name (in source file) |
|---|---|
| Overview | `Case page - Overview` |
| AML | `Case page - AML` |
| Related cases | `Case page - Related cases` |
| Financial data | `Case page - Financial data` |
| Events | `Case page - Events` |

---

## Pattern C — Editor / Builder (collapsed Sidebar 52 + custom 112 header)

> Used for: **Blueprint editor / Edit blueprint / Create blueprint** in `dtgJZJmVO1VPCr3fI5MohS`.

⚠️ **HARD RULE — Pattern C: COLLAPSED 52 Sidebar OR no Sidebar at all, NEVER 257 expanded.**

Canonical Blueprint editor has **TWO valid variants** (v3.132 clarification, observed in canonical):

| Variant | Page name in source | Sidebar | Blueprint header |
|---|---|---|---|
| **Variant 1 — Edit blueprint** | "Blueprint settings - Edit blueprint" | 52 collapsed at x=0 | 1388×112 at x=52 |
| **Variant 2 — New / Create blueprint** | "Blueprint settings - New blueprint" | none | 1440×112 at x=0 (full-width) |

Both are canonical. Audit 7.49 allows both (fails only when `*Sidebar*` present AND `width≥200`).

Pre-v3.131 sim 2026-05-14 was wrong because agent built `*Sidebar* Collapsed=False, w=257` with `Blueprint header 1183×112 at x=257`. That matches NEITHER canonical variant. v3.131 banned it.

```
Variant 1 — Edit blueprint (52 sidebar present):
Root (1440 × 900+, scrollable)
├── *Sidebar*  (52 × 900+, Collapsed=True)
├── Blueprint header  (1388 × 112, x=52)
└── Content  (1388 × scrollable, x=52)
    └── Blueprint body INSTANCE  (1388 × scroll)

Variant 2 — New / Create blueprint (no sidebar):
Root (1440 × 900+, scrollable)
├── Blueprint header  (1440 × 112, x=0, full-width)
└── Content  (1440 × scrollable, x=0)
    └── Blueprint general settings  (1440 × scroll)
```

**Component keys:**
- `Blueprint header`: `304aa0d104cb87315bf1a6578681b6b266bc70ee` (variants: `BP created=Yes` for Edit, `BP created=No` for New)
- `Blueprint body`: `ba1944a3ab5236a21edf7c7319a3ac232914326d` (Edit variant content)
- `Blueprint general settings`: `176257c2384cabe2db5319159678a1428d6d9f0c` (New variant — initial setup form)

**Variant selection rule:**
- User prompt "Edit blueprint" / "Blueprint editor" (editing existing) → Variant 1 (52 sidebar)
- User prompt "Create blueprint" / "New blueprint" / no qualifier → Variant 2 (no sidebar). The "New" variant is more typical first state.
- If unsure → check user prompt for "edit" / "existing" keywords; default to Variant 2 if no edit context.

### Banned in Pattern C (v3.131)

- `*Sidebar* Type=Case management, Collapsed=False` (257 wide) → use `Collapsed=True` (52 wide)
- `*Header*` standard component → use file-local `Blueprint header` (key `304aa0d104cb87315bf1a6578681b6b266bc70ee`)
- Body+Side split (Pattern B-style Case page layout 992+424) → use single `Blueprint body` 1388 wide. Reviewer/Maker role panels live INSIDE the Blueprint body organism, NOT as separate side column.
- `1183 × 112` header (Pattern A wrapper width) — canonical Blueprint header is `1388 × 112` only.

### Pattern keyword detection — agent must use Pattern C when user prompt contains

- "blueprint editor", "edit blueprint", "create blueprint", "blueprint page"
- "rule editor", "create rule", "edit rule" (this is **TM Pattern 3**, structurally identical: Sidebar 52 collapsed + 1388 wrapper)
- General pattern: editor / builder / setup page with **dedicated single-purpose content** (not a list, not a detail-with-related-cases)

If unsure between Pattern A (list with full sidebar) and Pattern C (editor with collapsed sidebar):
1. Inspect canonical source file for the page being built
2. List pages (e.g. "Settings - Blueprints" table, "All cases" table) → Pattern A (257 sidebar)
3. Edit / create / configure pages → Pattern C (52 sidebar)
4. If still ambiguous → ASK user before defaulting

---

## Pattern D — Full-Screen Builder (no Sidebar, full-width header, drawer LEFT)

> Used for: **Edit / Create report template** in `86VzYfJdRwSvvpdJ2cGsX0`.

⚠️ **v3.133 corrected from pre-v3.132 doc:** Drawer is on the **LEFT** (x=0), not the right. Content/Main is on the RIGHT (x=400). Pre-v3.133 docs claimed the opposite; canonical inspection 2026-05-15 (`86VzYfJdRwSvvpdJ2cGsX0/3234:70980`) confirmed Drawer Basic at x=0 w=400, Report builder fields inside main wrapper at x=400 w=1040.

```
Root (1440 × 900)
├── Header chrome  (1440 × 56)                       ← full-width breadcrumbs / actions
└── (below header, y=56)
    ├── *Drawer Basic*  (400 × 844)                   ← x=0, y=56. PERMANENT LEFT column with field picker
    └── Content / Main  (1040 × 844)                  ← x=400, y=56. Form / report fields, inner padding ~200/200
        └── Report builder fields  (640 × ...)         ← centered inside main, x=200 relative
```

**Confirmed dimensions** from canonical `Create report template` / `Edit report template`:
- Header chrome: `1440 × 56` at (0, 0)
- `*Drawer Basic*`: `400 × 844` at (0, 56) — LEFT permanent column (NOT overlay, no scrim/tint)
- Main wrapper: `1040 × 844` at (400, 56)
- `Report builder fields` INSTANCE: `640 × scroll` at (200, 24) relative to main (centered with 200/200 horizontal padding)

**Layout sum:** 400 + 1040 = 1440 ✓

This is **the only CM pattern where the drawer is a permanent column**, not a modal overlay. Drawer is on the LEFT (field picker / available fields), Content on the RIGHT (form / build area being authored).

### Banned in Pattern D
- Drawer on the RIGHT side (x=1040) — that's Cross-Check Rules Advance test pattern, NOT Report template builder. Don't substitute.
- Modal-style drawer with Tint/scrim — Drawer is permanent column, no modal behavior.
- Standard `*Header*` 64-tall — Report builder uses custom 56-tall full-width header chrome.

---

## Pattern Decision Tree

```
What kind of CM screen?
├── List of cases / blueprints / FIU templates / overview
│   → Pattern A (Sidebar 257 + Header 64 + Content 1183)
│
├── Single case detail page
│   → Pattern B (no sidebar, custom 88 header, 992 + 424 columns)
│
├── Editing a blueprint
│   → Pattern C (sidebar 52 + Blueprint header 112 + Content 1388)
│
└── Editing a report template (Create / Edit)
    → Pattern D (Header chrome 56 + Drawer 400 LEFT + Main 1040 RIGHT)
```

---

## Assembly recipes

### Pattern A — Case queues list

```js
// Imports
const sidebarSet = await figma.importComponentSetByKeyAsync("60be5cbb4d070ccc4853589a555d949c3f23f62e");
const headerSet  = await figma.importComponentSetByKeyAsync("387e2cf61b1bf4f2045d3ccefecc5c7820a86889");
const caseTableSet = await figma.importComponentSetByKeyAsync("461547c5d85f3150bf5c6a944540f462e0a71502");

// Sidebar
const sidebar = sidebarSet.children.find(v =>
  v.name.includes("Type=Case management") && v.name.includes("Collapsed=False")
).createInstance();

// Header
const header = headerSet.defaultVariant.createInstance();
header.setProperties({ "Title text#3817:0": "All cases" });

// Case table (Empty=No)
const caseTable = caseTableSet.children.find(v => v.name === "Empty=No").createInstance();
```

### Pattern B — Case detail page

```js
// Pre-cache imports
const cphSet         = await figma.importComponentSetByKeyAsync("070118da7e99782ee06a25dad0550673e6fe50cb"); // Case page header
const tabBasicComp   = await figma.importComponentByKeyAsync("8b7caf090f6d71e8892fb33f649cab470552dc83");    // *Tab Basic*
const overviewComp   = await figma.importComponentByKeyAsync("937dcc919d4d8006fd792aceda340bd7da1a0cd0");    // Case page Overview tab content
const rightColComp   = await figma.importComponentByKeyAsync("768dad457da2d43a126b83475e5a3a1d09891615");    // Case page right column

// Root — NONE layout (positions are absolute)
const root = figma.createFrame();
root.name = "Case page — In review";
root.resize(1440, 900);
root.layoutMode = "NONE";
root.fills = [{type:"SOLID", color:{r:1, g:1, b:1}}];

// 1. Case page header — full width, top
const caseHeader = cphSet.defaultVariant.createInstance();
root.appendChild(caseHeader);
caseHeader.x = 0; caseHeader.y = 0;
try { caseHeader.layoutSizingHorizontal = "FIXED"; } catch(e){}
caseHeader.resize(1440, caseHeader.height);

// 2. Left wrapper — Frame 270990504 (NO padding, clipsContent for scroll)
const leftWrapper = figma.createFrame();
leftWrapper.name = "Frame 270990504";
leftWrapper.layoutMode = "VERTICAL";
leftWrapper.primaryAxisSizingMode = "FIXED";
leftWrapper.counterAxisSizingMode = "FIXED";
leftWrapper.fills = [];
leftWrapper.clipsContent = true;
root.appendChild(leftWrapper);
leftWrapper.x = 0; leftWrapper.y = 96;
leftWrapper.resize(992, 804);

// 2a. Subheader — Tab Basic row, CENTER/MAX alignment (Tab Basic ends up bottom-anchored at y=23)
const subheader = figma.createFrame();
subheader.name = ".Header Full Screen Page / Subheader";
subheader.layoutMode = "HORIZONTAL";
subheader.primaryAxisSizingMode = "FIXED";
subheader.counterAxisSizingMode = "FIXED";
subheader.primaryAxisAlignItems = "CENTER";    // crucial — matches original
subheader.counterAxisAlignItems = "MAX";       // crucial — Tab Basic anchors to bottom
subheader.paddingLeft = 32; subheader.paddingRight = 32;
subheader.paddingTop = 0; subheader.paddingBottom = 1;
subheader.fills = [];
leftWrapper.appendChild(subheader);
subheader.layoutSizingHorizontal = "FILL";
subheader.layoutSizingVertical = "FIXED";
subheader.resize(subheader.width, 56);

const tabBasic = tabBasicComp.createInstance();
subheader.appendChild(tabBasic);
try { tabBasic.layoutSizingHorizontal = "FILL"; } catch(e){}    // tab basic fills 928px (= 992 - 32 - 32)

// 6 tabs (NOT 5) — order from original Case page
const caseTabs = ["Overview", "AML", "Related cases", "Financial data", "FIU reports", "Events"];
const tabItems = tabBasic.children.filter(c => c.type === "INSTANCE" && /Tab Basic \/ Item/i.test(c.name));
for (let i = 0; i < tabItems.length; i++) {
  if (i < caseTabs.length) {
    tabItems[i].visible = true;
    tabItems[i].setProperties({
      "Label text#4517:0": caseTabs[i],
      "Counter#5190:0": false,
      "Badge#2885:0": false,
      "Tag#1082:0": false,
      "• Left icon#2885:9": false,
      "Right icon •#1094:0": false,
      "Selected": i === 0 ? "true" : "false",
    });
  } else {
    tabItems[i].visible = false;
  }
}

// 2b. Container — real content with 32/24/24/24 paddings
const container = figma.createFrame();
container.name = "Container";
container.layoutMode = "VERTICAL";
container.primaryAxisSizingMode = "AUTO";   // hugs height; scrolls inside leftWrapper
container.counterAxisSizingMode = "FIXED";
container.paddingLeft = 32;  container.paddingRight = 24;
container.paddingTop = 24;   container.paddingBottom = 24;
container.itemSpacing = 24;
container.fills = [];
leftWrapper.appendChild(container);
container.layoutSizingHorizontal = "FILL";

// 2c. Overview tab content — locked at 932 wide (intrinsic), HUG height
const overview = overviewComp.createInstance();
container.appendChild(overview);
try { overview.layoutSizingHorizontal = "FIXED"; } catch(e){}
overview.resize(932, overview.height);

// 3. Right column — directly after left wrapper (no gap), 24px right margin to edge
const rightCol = rightColComp.createInstance();
root.appendChild(rightCol);
rightCol.x = 992;   // directly after left wrapper, NO gap between
rightCol.y = 96;
try { rightCol.layoutSizingHorizontal = "FIXED"; rightCol.layoutSizingVertical = "FIXED"; } catch(e){}
rightCol.resize(424, 804);
// Right edge: 992 + 424 = 1416 → 24px right margin to screen edge 1440
```

### Pattern C — Blueprint editor

```js
// Sidebar — Type=Case management, Collapsed=True (variant key — probe sidebarSet for this)
const sidebar = sidebarSet.children.find(v =>
  v.name.includes("Type=Case management") && v.name.includes("Collapsed=True")
).createInstance();

// Blueprint header (CM-specific, NOT generic *Header*)
const bpHeaderSet = await figma.importComponentSetByKeyAsync("304aa0d104cb87315bf1a6578681b6b266bc70ee");
const bpHeader = bpHeaderSet.defaultVariant.createInstance();

// Body
const bpBodySet = await figma.importComponentSetByKeyAsync("ba1944a3ab5236a21edf7c7319a3ac232914326d");
const bpBody = bpBodySet.defaultVariant.createInstance();

// Layout
const root = figma.createFrame();
root.resize(1440, 900);
root.layoutMode = "NONE";

root.appendChild(sidebar);
sidebar.x = 0; sidebar.y = 0;

root.appendChild(bpHeader);
bpHeader.x = 52; bpHeader.y = 0;
bpHeader.resize(1388, 112);

root.appendChild(bpBody);
bpBody.x = 52; bpBody.y = 112;
// bpBody width FILL to 1388
```

### Pattern D — Report template editor

```js
// Custom full-screen header
// (probe `86VzYfJdRwSvvpdJ2cGsX0` for the right component — likely
//  `b3d95fc0e80dbb546c50cb707b6d40a8a4f28adf` "Case report template header"
//  or "Header Full Screen Page" from Organisms library — check both)
const tmplHeader = (await figma.importComponentByKeyAsync("b3d95fc0e80dbb546c50cb707b6d40a8a4f28adf")).createInstance();

// Page layout
const reportLayout = (await figma.importComponentByKeyAsync("38e80e9ca92af1017b80cb7eed2a97d07125584f")).createInstance();

// Drawer — right side, NOT an overlay; fixed column
const drawerSet = await figma.importComponentSetByKeyAsync("5f439a1ac284428f2e62c8d29d52285840c640a4");
const drawer = drawerSet.defaultVariant.createInstance();

const root = figma.createFrame();
root.resize(1440, 900);
root.layoutMode = "NONE";

root.appendChild(tmplHeader);
tmplHeader.x = 0; tmplHeader.y = 0;
tmplHeader.resize(1440, 64);

root.appendChild(reportLayout);
reportLayout.x = 0; reportLayout.y = 64;
reportLayout.resize(1040, 836);

root.appendChild(drawer);
drawer.x = 1040; drawer.y = 64;
drawer.resize(400, 836);
```

---

## Notes & gotchas

- **Case page has NO sidebar.** It's accessed from a list (which has the sidebar) — opening a case takes you full-bleed without the global nav. Don't add `*Sidebar*` to a Case page mockup.
- **Blueprint header (112px)** ≠ Applicant page header (152px). Don't reuse measurements between them.
- **Right column on Case page (424px)** is wider than the Applicant Summary panel (380px). It's a different component (`Case page right column` vs `Summary`).
- **Report builder Drawer is a real column**, not an overlay — `x = 1040`, `y = 64`, `400 × 836`. It does not have a tint/scrim. Don't try to centre or absolute-position it like a modal.
- **Tabs on Case page** are NOT the standard `*Tab Basic*` from Base components — they're embedded in `Case page Overview tab content` and similar. Each tab content frame is a separate top-level frame in the source file (one Figma frame per tab state).
- **Case status** has both `Case status` (set) and `.Case status in page header` — the page-header version is the smaller pill shown next to the title. Don't confuse them.
- **`Escalate case` vs `NEW Escalate case`** — there are two versions in the kit. The `NEW` one (`07b80c275b397d3731b44338f0e431acb2b3f47f`) is the current design; legacy `bd66b4eae450c97175e656d07ceb2070b532cbdd` is for backward reference.
- **Summy illustration** for Overview: `Summy+reports illustration` (`4dd71900e4d48742757b3a7356e29f0f01b6c343`) — used in Manager overview empty state.
