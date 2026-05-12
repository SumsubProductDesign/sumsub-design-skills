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

## 🛑 *Sidebar* on Applicant Page — BANNED (v3.122)

**Do not import `*Sidebar*` Type=Applicants Collapsed=True (key `60be5cbb4d070ccc4853589a555d949c3f23f62e`) when building an Applicant page.**

The 52px collapsed Sidebar slot has not existed in canonical AP layout since the post-v3.78 redesign. Modern AP is full-bleed: Header 1440 from x=0, Summary at x=0, Body at x=Summary.width. There is NO sidebar slot at all.

### Banned outputs

Any of the following in components_attempted / build log → audit FAIL:
- `*Sidebar* (Type=Applicants, Collapsed=True)`
- `*Sidebar* (Type=Applicants, ...)` at x=0 in an AP root frame
- Reference to "Pattern 2 (52+380+1008=1440)" math — that math is dead, current math is 0+Summary.width+Body.width=1440
- Header positioned at x=52 with width=1388

### Why this section needs a hard-ban, not just a "deprecated" note

v3.118 marked this DEPRECATED with "do not include" text. v3.121 sim retry still imported the Sidebar anyway. Agent has a strong training prior "AP has collapsed Sidebar at x=0"; a soft "deprecated" marker doesn't override the prior.

Hard rule: if your build script contains `importComponentSetByKeyAsync("60be5cbb...")` **followed by** placing the result at x=0 in an AP root → that's a v3.122 banned action. The audit script catches `*Sidebar*` INSTANCE children directly under an AP root frame and FAILs.

### Audit check (v3.122)

```js
// In audit script
const apRoots = page.findAll(n => n.type === "FRAME" && /applicant/i.test(n.name));
for (const root of apRoots) {
  for (const child of root.children) {
    if (child.type === "INSTANCE" && /\*Sidebar\*/.test(child.mainComponent?.name || "")) {
      issues.push(`7.46 banned-sidebar-on-AP: frame "${root.name}" contains *Sidebar* INSTANCE. AP layout has NO sidebar slot. Remove the *Sidebar* instance and re-position Header/Summary/Body per applicant-page-pattern.md.`);
    }
  }
}
```

---

## Body Content Patterns

### 🚨 Default expansion = OPEN, with REAL content from AP organisms (NEW v3.120)

**Default state of cards: `Collapsed=No` (expanded), filled with realistic data from the matching AP organism.** Do NOT default to `Collapsed=Yes` to avoid filling content — that's the banned-class behavior that triggered the v3.120 fix. User asks for an Applicant page → user expects an expanded page with content, not a list of collapsed headers.

Use `Collapsed=Yes` ONLY when:
- User explicitly says "collapsed view" / "compact list" / "section headers only"
- The card content has no canonical organism AND no realistic data is available

### 🚨 Card content: use AP organisms, NEVER fabricate custom Row × N (NEW v3.120)

Each AP section (Personal info / Document / Selfie / Phone / Email / AML / Risk labels / Notes / Events / Address) has a dedicated AP organism with pre-built `Static data` / `DataList` rows, status icons, action buttons. **Import the organism as INSTANCE and configure it via properties — do NOT fabricate `Row × N` custom frames that mimic DataList structure.**

Banned-class behavior from v3.119 sim:
- 8 custom expanded cards, each with 7 custom `Row` frames (HORIZONTAL, Label TEXT + value TEXT)
- 56 fabricated rows total
- Skill asked AFTER building "maybe I should have used *Properties* / *DataList*?" — should have checked canonical FIRST

### Organism-per-section map (use these instances, not custom frames)

| Card section | Use this AP organism (INSTANCE) | Key | Where to find content |
|---|---|---|---|
| Personal info | `Personal info / Applicant data` SET | `72b025c8c706a7e7b277e7ee2183b8012bfab6b5` | Properties: first/last name, DoB, etc. |
| Provided personal info | `Content / Provided Personal Info` COMP | `f942a2e20774d529d7e53074afab4023eceea425` | Pre-baked Static data rows |
| Profile information (Email / Phone / Applicant language / Source key) | `Profile information` COMP | (composite — see `17501:30311` canonical) | 4 Static data columns with Label + value + Success icon |
| Address | `Personal info / Address` SET | `25085e3400dba5aa032f7698097ae71fb9a0fde1` | State=1 address / 2 addresses / Empty |
| ID Document | `Document` SET | `34687e2ab77282287cc7b44a2bb06b0aa8bd9b36` | Doc photos + OCR data + checks |
| Document form (OCR fields) | `Document / Form` SET | `27812c1486949b9e7d16758fa296b32d69fabf86` | Variants for new UI / Empty state / Doc type |
| Selfie | `Photo` SET | `9352939d0664d385ca99d63b25cdff6a4ee1404b` | Type=Photo uploaded / Photo deleted / Empty |
| Phone verification | `Applicant notes / Input` style or custom | `ca9a7f23a77be86287d21dd0f1a3b318b7ec0e33` | Or check `Document / Actions block` patterns |
| Email verification | Same approach as Phone | — | — |
| AML Screening | `APCardCollapsible/HeaderChecks` (Status=Approved/Pending/Rejected) | `0c607889293e21820454545de96d23d10f928439` | Or canonical Profile information variant |
| Risk labels | `Risk labels block` COMP | `78e549bc6b45b0af94ca01cdbf8e82b3ae64ff5a` | Sub-organisms per category |
| Applicant notes | `Applicant notes` COMP | `0f1ba9b45209163bb9ae5ba43abdca89cc806ff7` | Set "Added Notes" bool + view more |
| Events log | `.Events` SET (used via Body composite) | `3888bd1c362d50b9df21f346e3a32b4090d702ad` | Or `Events Block` for ad-hoc |

### Build rule

```
For each Body section:
1. Import the matching AP organism via importComponentByKeyAsync / importComponentSetByKeyAsync
2. Find the right variant (e.g. State=Filled, Collapsed=No, Empty=No)
3. createInstance() → append to Body
4. Set instance properties for content (applicant name, document type, country, etc.)
5. DO NOT create custom Frames named "Row" / "Field" / "DataList" / "Static data" — these belong to the organism
```

### Audit check (added v3.120)

If Body contains 5+ custom FRAME nodes named matching `/^(Row|Field|Data ?Row|Static data|Property)/i` directly under section cards → likely fabricated content, FAIL audit. Replace with AP organism instance.

### Single full-width card structure (when no specific organism applies)
```
APCardCollapsible (BodyW − 64 × h, Collapsed=No)
├── APCardCollapsible/HeaderChecks (BodyW − 64 × 56, Status=Default/Approved/Pending/Rejected)
│   ├── Icon (normal/{name})
│   ├── Title text
│   └── Chevron + status badges
└── Content (inner × h, VERTICAL, gap=16, pad: 16/20/24/20)
    └── [organism instance for this section type — from table above]
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
