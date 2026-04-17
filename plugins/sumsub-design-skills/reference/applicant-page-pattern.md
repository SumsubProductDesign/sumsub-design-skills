# Applicant Page — Layout Pattern (Detail Full-Screen Page)

> Extracted from `Di7nvHaOxXiWuDAN1oa0hK` (Applicant-page) and `vNWBKCNOPwyTQWJwR5euAl` (Actions).
> Scan date: 2026-04-14.

---

## Screen Structure

Pattern 2 from layout-patterns.md — **Detail Full-Screen Page** with collapsed 52px DS sidebar as a real left column (NOT an overlay). Everything else shifts right by 52px.

```
Root (1440 × 900+, NONE layout, fill #ffffff)
│
├── *Sidebar* (52×1024, Type=Applicants, Collapsed=True) ← own left column
│
├── Page header (INSTANCE, 1388×152 at x=52)
│   ├── Sandbox flag bar (20px, yellow #faad14)
│   ├── Header row (96px, HORIZONTAL, pad: 16/32/16/32)
│   │   └── Wrapper (HORIZONTAL, gap=8)
│   │       ├── Left: back button + avatar + name + status + badges
│   │       └── Right: action buttons + dividers + shortcuts
│   └── Subheader (56px, VERTICAL, pad: 0/32/1/32)
│       └── *Tab Basic* (HORIZONTAL, gap=24) — navigation tabs
│
├── Summary panel (380×747 at x=52, y=152) ← AP's own left panel
│   └── Summary SET (Collapsed=No, Role=Admin)
│       └── Summary / Level / Steps
│
└── Body (1008×h at x=432, y=152, VERTICAL, gap=16..20, pad: 24/32/64/32)
    ├── APCardCollapsible (collapsed/expanded cards)
    ├── Section title rows (HORIZONTAL: text + button)
    ├── HORIZONTAL card grids (gap=16)
    └── Content blocks / tables
```

### Positions (absolute, no auto-layout on root)
| Element | x | y | w | h |
|---|---|---|---|---|
| *Sidebar* (collapsed) | 0 | 0 | 52 | 1024 |
| Page header | 52 | 0 | 1388 | 152 |
| Summary panel | 52 | 152 | 380 | 747 |
| Body | 432 | 152 | 1008 | h (scrollable) |

**Layout sum:** 52 + 380 + 1008 = 1440 ✓

### Key Dimensions
| Metric | Value |
|---|---|
| Screen width | 1440px |
| Screen height | 900px (viewport) / taller for scroll |
| Sidebar width (collapsed, own column) | 52px |
| Page header | 1388×152 at x=52 (20 sandbox + 96 header + 36 subheader) |
| Summary panel | 380×747 at x=52, y=152 |
| Body | 1008px wide at x=432, padding 24/32/64/32 (top/right/bottom/left) |
| Body gap | 16px (between cards), 20px (between sections) |
| Card content width | 944px (1008 - 32×2 padding) |

> ⚠️ **Common mistake:** treating the 52px sidebar as a floating overlay and extending header/body to full 1440px. The sidebar occupies its own column — everything else starts at x=52.

---

## Project-Specific Components

### AP page header
| Property | Value |
|---|---|
| compSetKey (library) | `afde096fe83bb6a2e474c175e55dd73856303a1a` ← use this for import |
| compSetKey (in mackets) | `d0fbee02e0077ff7a3f4071b7a6129266f509b9c` ← NOT importable, different key |
| Variants | `Client type`: Any/KYC/KYB, `User type`: Admin/Moderator, `In review`: Yes/No |
| Properties | `Applicant name#3392:7`, `↪ Client name#3392:3`, `Sandbox#3392:8` (bool), `KYB link#3392:2` (bool), `Client info#3392:4` (bool), `Notes#603:7` (bool), `Inactive#1456:0` (bool), `Score#3392:10` (bool), `Read-only applicant#2315:0` (bool) |
| Source | Applicant-page-and-Tasks-components (`QKXZwWodIwPVsjAjj4gMnE`), page "Header" |
| Height | 152px fixed, resizable to 1440px width |

### APCardCollapsible
| Property | Value |
|---|---|
| compSetKey | `cc6745d97b3b9e7ac0a149ad577630de096b8bc1` |
| Variants | `Collapsed`: Yes/No |
| Children | APCardCollapsible/HeaderChecks (header) + Content (body frame) |
| Header fill | `#f6f7f9` (semantic/background/neutral/subtlest/normal) |
| Header pad | 16/20/16/20 |
| Header gap | 8px |

### APCardCollapsible/HeaderChecks
| Property | Value |
|---|---|
| compSetKey | `0c607889293e21820454545de96d23d10f928439` |
| Variants | `Status`: Default, Approved, Rejected, Pending |
| Layout | HORIZONTAL, gap=8, pad: 16/20/16/20 |

### Body / Title (Block Title)
| Property | Value |
|---|---|
| componentKey (library) | `788264d18f2cc9e75e464416c0cae74fbcd37da8` ← use this for import (single component) |
| compSetKey (in mackets) | `6897c420e3e18ca399517baf065d3aee01038fef` ← NOT importable |
| Properties | `Title name#12928:0` (text), `Button#12928:1` (bool), `2nd button#12928:2` (bool), `3rd button#12979:0` (bool), `Toggle 1#2138:0` (bool), `Toggle 2#2138:1` (bool) |
| Source | Applicant-page-and-Tasks-components, page "Body" |
| Size | 1016×44, use FILL horizontal |

### .Header Full Screen Page / Subheader
| Property | Value |
|---|---|
| compSetKey | `c78bdbfc08cbff8f5a996dc9733b759d8d06e96d` |
| Variants | `Max width 1856`: Yes/No |
| Children | *Tab Basic* instance |

### Applicant status
| Property | Value |
|---|---|
| compSetKey | `9d5135474d59b54fdfa6a2f282e3d538f6391420` |
| Variants | `Status`: Approved, Rejected, Pending, Init, etc. |

### Applicant notes
| Property | Value |
|---|---|
| componentKey | `0f1ba9b45209163bb9ae5ba43abdca89cc806ff7` |
| Type | Single component (not a set) |

### Applicant notes / Input
| Property | Value |
|---|---|
| compSetKey | `ca9a7f23a77be86287d21dd0f1a3b318b7ec0e33` |
| Variants | `Type`: Internal note, Client note |

### Content / Profile data
| Property | Value |
|---|---|
| componentKey | `a90147d9b5ed05e70ca3f4b77868692c3f1a56ed` |

### Content / Personal info
| Property | Value |
|---|---|
| componentKey | `a36738a34c07808e6da1a279fe81276d75123262` |

### Content / Provided Personal Info
| Property | Value |
|---|---|
| componentKey | `f942a2e20774d529d7e53074afab4023eceea425` |

### .Content / Events
| Property | Value |
|---|---|
| compSetKey | `8c5e39d210d56334613160e9b1a4167e13e89f1b` |
| Variants | `Expanded`: Yes/No |

---

## *Sidebar* on Applicant Page

Uses the Organisms *Sidebar* in **collapsed mode** as a real left column (NOT an overlay):
```
compSetKey: 60be5cbb4d070ccc4853589a555d949c3f23f62e
Variant: Type=Applicants, Collapsed=True
Size: 52px wide × 1024px tall
Position: x=0, y=0
```

The sidebar occupies its own 52px column. Header, Summary panel, and Body all start at x=52 (to the right of the sidebar) — they do NOT extend underneath.

---

## Body Content Patterns

### Single full-width card
```
APCardCollapsible (1376×h, Collapsed=No)
├── APCardCollapsible/HeaderChecks (1376×56, Status=Default)
│   ├── Icon (normal/{name})
│   ├── Title text
│   └── Chevron + status badges
└── Content (1376-padding × h, VERTICAL, gap=16, pad: 16/20/24/20)
    └── [section-specific content]
```

### Horizontal card grid (2 columns)
```
Row frame (HORIZONTAL, gap=16)
├── APCardCollapsible (w=auto) or CheckCollapsible
└── APCardCollapsible (w=auto) or CheckCollapsible
```

### Section header row
```
Frame (HORIZONTAL, gap=10, h=48)
├── Section title TEXT (fills available width)
└── *Button* (Secondary, Medium) — optional action button
```

---

## Icons Used in Applicant Page

| Icon | Key | Context |
|---|---|---|
| normal/person | `ba1b0918e13df8baa7c123fb14b3b58d3353b012` | Header: applicant avatar |
| normal/copy | `45628c6a75a7b63403eb19e45e217acd1b7b1fe9` | Header: copy applicant ID |
| normal/search | `37e103e996780518bb45333e4b4b03471e27f69a` | Header: search |
| normal/applicant-link | `08d854afef2979d14761027a75eff11b55633e47` | Header: generate link |
| normal/clipboard | `3b738a5e83af46d20385341bb43e3e07be73bf5b` | Header: clipboard |
| normal/more | `1fba1258f0114924d1c458254c08ebfa933b6b19` | Header: more actions |
| normal/building | `081f3abd44747d34a9d6d2779dda70dc0254c3b2` | KYB company |
| normal/chat | `6f58946fe46d2f05b51b19e0c3f58b1953bcff6b` | Notes |
| normal/personal-info | `800116cb1b2999793d1e32cefc9363f723c9c8b1` | Personal info card |
| normal/location | `208ade3c229f718aff546f95f174a4679785630c` | Address |
| normal/card | `fbd0604130d30b6a155ad670ee2b0603a69c4345` | Documents |
| normal/selfie | `9b806376e668d22b69617228c232e44d045f535a` | Selfie check |
| normal/phone | `6bea9924616fea161948daa8a52a88ffbc329ed7` | Phone check |
| normal/mail | `30303858d4558dc9e8c8e2d6a4695d9fa44c6590` | Email check |
| normal/eye | `b597e5e82f4603b04107159a2264f429cb6f7163` | View/preview |
| normal/write | `0ae688cc27cc3b1fd030b35befaa71b4d0317bc7` | Edit |
| normal/delete | `f2324af77f3c8791e8f7cc514d46e0dab635fb02` | Delete |
| normal/download | `0d36555d0b831bec5f1e5c37bd99b86953885db3` | Download |
| normal/history | `94fc28e98861328beaae09b19044584a5d7df699` | Events history |
| normal/play | `65329c722b17ca4ac68befc97247348d127f84fa` | Video play |
| normal/tag | `fc5276f2e5908869f72dde74a2e71da567dacaec` | Tags |
| normal/tasks | `83d2080a0403d6f08d71b3edfda53869260da74c` | Tasks |
| normal/bug | `07f54431297852f5163afa8a6a36ef3f2902b511` | Bug/issue |
| normal/globe | `509bd2ae88406dcb3cc26bee31f5d175dc2dea2f` | Geo/locale |
| normal/AI-badge | `3b5749b172a36c43e319559c21bfcd2b4fd577cb` | AI indicator |

---

## Full Component Catalog

> See `ap-component-catalog.md` for the complete scan of ALL pages and components in the AP UI kit library.
> Contains: Header, Body, Document, Events, Photos, Risk labels, Personal info, Summary panel — with keys, properties, variants, and nesting patterns.

---

## Sidebar Variant for Applicant Page

```js
const sidebarSet = await figma.importComponentSetByKeyAsync("60be5cbb4d070ccc4853589a555d949c3f23f62e");
// Find the collapsed applicant variant
const variant = sidebarSet.children.find(c => 
  c.name.includes("Categoty=Applicant page") && c.name.includes("Type=No active items")
);
const sidebar = variant.createInstance();
```

---

## Assembly Recipe (Plugin API)

```js
// Layout columns: 52 (sidebar) + 380 (summary) + 1008 (body) = 1440

// 1. Create root frame
const root = figma.createFrame();
root.name = "Applicant Page";
root.resize(1440, 900);
root.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
root.clipsContent = true;

// 2. AP page header (x=52, w=1388 — shifted right of the 52px sidebar column)
// KEY: use library key afde096f..., NOT macket key d0fbee02...
const headerSet = await figma.importComponentSetByKeyAsync("afde096fe83bb6a2e474c175e55dd73856303a1a");
const headerVariant = headerSet.children.find(c => c.name.includes("Client type=Any") && c.name.includes("User type=Admin") && c.name.includes("In review=No"));
const header = headerVariant.createInstance();
header.setProperties({
  "Applicant name#3392:7": "Applicant Name",
  "Sandbox#3392:8": true,  // show sandbox bar
});
root.appendChild(header);
header.x = 52; header.y = 0;
header.resize(1388, header.height);

// 3. Summary panel (x=52, y=152, w=380) — AP's own left panel
const summarySet = await figma.importComponentSetByKeyAsync("92422f0c18fc1fee864b481b5c9d2728a8f5d70b");
const summaryVariant = summarySet.children.find(c =>
  c.name.includes("Collapsed=No") && c.name.includes("Role=Admin")
);
const summary = summaryVariant.createInstance();
root.appendChild(summary);
summary.x = 52; summary.y = 152;

// 4. Body (x=432, y=152, w=1008 — right of sidebar + summary)
const body = figma.createFrame();
body.name = "Body";
body.layoutMode = "VERTICAL";
body.itemSpacing = 16;
body.paddingTop = 24; body.paddingRight = 32;
body.paddingBottom = 64; body.paddingLeft = 32;
body.primaryAxisSizingMode = "AUTO";      // hugs content vertically
body.counterAxisSizingMode = "FIXED";     // fixed width
body.fills = [];
root.appendChild(body);
body.resize(1008, 748);
body.x = 432; body.y = 152;

// 5. Add content cards to body (children will be 944px = 1008 - 32×2 padding)
const cardSet = await figma.importComponentSetByKeyAsync("cc6745d97b3b9e7ac0a149ad577630de096b8bc1");
const card = cardSet.children.find(c => c.name.includes("Collapsed=No")).createInstance();
body.appendChild(card);
card.layoutSizingHorizontal = "FILL";

// 6. Sidebar (collapsed 52px, own column at x=0)
const sidebarSet = await figma.importComponentSetByKeyAsync("60be5cbb4d070ccc4853589a555d949c3f23f62e");
const sidebarVariant = sidebarSet.children.find(c =>
  c.name.includes("Type=Applicants") && c.name.includes("Collapsed=True")
);
const sidebar = sidebarVariant.createInstance();
root.appendChild(sidebar);
// NOTE: root has layoutMode=NONE, so children are positioned by x/y directly.
// Do NOT set layoutPositioning = "ABSOLUTE" — that only works with auto-layout parents.
sidebar.x = 0; sidebar.y = 0;
// Keep sidebar last in z-order so it sits above any content that might bleed left.
```
