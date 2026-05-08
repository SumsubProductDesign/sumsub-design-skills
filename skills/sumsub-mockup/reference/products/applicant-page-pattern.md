# Applicant Page — Layout Pattern (Detail Full-Screen Page)

> Extracted from `Di7nvHaOxXiWuDAN1oa0hK` (Applicant-page) and `vNWBKCNOPwyTQWJwR5euAl` (Actions).
> Last canonical scan: 2026-05-08 (`Di7nvHaOxXiWuDAN1oa0hK/17501:30301`).

---

## Screen Structure

⚠️ **Modern AP layout has NO 52px sidebar.** Header is full-bleed 1440. Summary + Body fill the remaining space with no sidebar slot. Exact column widths vary slightly between files — **always inspect the target file's canonical AP frame and use those exact dimensions**, not the numbers below.

```
Root (1440 × 900+, NONE layout, fill #ffffff)
│
├── AP page header  (INSTANCE, 1440×152 at x=0, y=0)         ← FULL WIDTH
│   ├── Sandbox flag bar (20px, yellow #faad14)
│   ├── Header row (96px, HORIZONTAL, pad: 16/32/16/32)
│   └── Subheader (56px, VERTICAL, pad: 0/32/1/32) → *Tab Basic*
│
├── Summary  (INSTANCE, ~360–380 wide × ~748 tall at x=0, y=152)
│   └── Summary / Level / Steps
│
└── Body (~1060–1080 wide × scroll-height at x=Summary.width, y=152)
    ├── APCardCollapsible (collapsed/expanded cards)
    ├── Section title rows (HORIZONTAL: text + button)
    ├── HORIZONTAL card grids (gap=16)
    └── Content blocks / tables
```

### Canonical samples (per file, as observed)

| Source file | Summary.width | Body.width | Body.x | Layout sum |
|---|---|---|---|---|
| `Di7nvHaOxXiWuDAN1oa0hK` (`17501:30301`, 2026-05-08) | 380 | 1060 | 380 | 380 + 1060 = 1440 ✓ |
| `13395:21886` (`14441:253969`, v3.78 scan) | 360 | 1080 | 360 | 360 + 1080 = 1440 ✓ |

> **Rule:** before building, run `get_metadata` on the target file's AP frame and read `summary.width` / `body.width` from the actual canonical. Do NOT hardcode 360/380 or 1060/1080 — they vary by file.

### Key Dimensions (constants — do not vary)

| Metric | Value |
|---|---|
| Screen width | 1440px |
| Screen height | 900px viewport / taller for scroll |
| Page header | 1440×152 at (0, 0) — full width, no x-offset |
| Body padding | 24/32/64/32 (top/right/bottom/left) |
| Body gap | 16px (between cards), 20px (between sections) |
| Card content width | Body.width − 64 (= 32×2 padding) |

> ⚠️ **Pre-v3.118 docs incorrectly claimed a 52px collapsed Sidebar at x=0.** This was based on a stale canonical. Modern AP screens do NOT include the 52px Sidebar slot. If you see code that builds `*Sidebar* Type=Applicants Collapsed=True` at x=0 — DELETE it. The sidebar bin is gone.

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

## *Sidebar* on Applicant Page (DEPRECATED — do not include)

⚠️ **Legacy section. Modern AP screens (post-v3.78 canonical) DO NOT include the 52px collapsed Sidebar.** Header is full-bleed 1440 from x=0. Summary starts at x=0. There is no sidebar slot at all.

Pre-v3.78 docs claimed this was used as a real left column. That was based on a stale canonical. If you find code that imports `*Sidebar*` Type=Applicants Collapsed=True at x=0, **remove it**.

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

## Assembly Recipe (Plugin API)

⚠️ **First: read canonical Summary.width and Body.width from the target file.** The values below are placeholders — replace with real measurements before building.

```js
// 0. Read canonical dimensions from the target file FIRST
//    Find AP frame in the file (e.g. "Applicant page", "🟢 Applicant page", "KYC applicant"),
//    inspect children, capture: Summary.width, Body.width, Body.x.
//    Layout sum must equal 1440. There is NO sidebar slot.

const SUMMARY_W = /* read from canonical, ~360-380 */;
const BODY_X    = SUMMARY_W;       // body starts where summary ends
const BODY_W    = 1440 - SUMMARY_W;

// 1. Create root frame
const root = figma.createFrame();
root.name = "Applicant Page";
root.resize(1440, 900);
root.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
root.clipsContent = true;

// 2. AP page header — FULL WIDTH (no sidebar offset)
const headerSet = await figma.importComponentSetByKeyAsync("afde096fe83bb6a2e474c175e55dd73856303a1a");
const headerVariant = headerSet.children.find(c => c.name.includes("Client type=Any") && c.name.includes("User type=Admin") && c.name.includes("In review=No"));
const header = headerVariant.createInstance();
header.setProperties({
  "Applicant name#3392:7": "Applicant Name",
  "Sandbox#3392:8": true,  // show sandbox bar
});
root.appendChild(header);
header.x = 0; header.y = 0;
header.resize(1440, header.height);

// 3. Summary panel — starts at x=0 (NO sidebar column)
const summarySet = await figma.importComponentSetByKeyAsync("92422f0c18fc1fee864b481b5c9d2728a8f5d70b");
const summaryVariant = summarySet.children.find(c =>
  c.name.includes("Collapsed=No") && c.name.includes("Role=Admin")
);
const summary = summaryVariant.createInstance();
root.appendChild(summary);
summary.x = 0; summary.y = 152;
summary.resize(SUMMARY_W, summary.height);

// 4. Body — starts where summary ends
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
body.resize(BODY_W, 748);
body.x = BODY_X; body.y = 152;

// 5. Add content cards to body (children will be BODY_W - 64 wide after padding)
const cardSet = await figma.importComponentSetByKeyAsync("cc6745d97b3b9e7ac0a149ad577630de096b8bc1");
const card = cardSet.children.find(c => c.name.includes("Collapsed=No")).createInstance();
body.appendChild(card);
card.layoutSizingHorizontal = "FILL";

// NO SIDEBAR. Do not import 60be5cbb... Type=Applicants Collapsed=True. The 52px sidebar column doesn't exist in modern AP layouts.
```
