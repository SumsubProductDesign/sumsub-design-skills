# WebSDK Examples Library — canonical screen compositions

> File: `8VpSRNe9ur7SBctw0JrtOE` (Organisms [WebSDK])
> Each organism page contains an `Examples` SECTION with 2–12 ready-built Widget instances showing the canonical assembly pattern (Widget shell + Organism in Content slot + correct visibility overrides).
>
> **Always reference these before building. Skim the Examples section, copy its overrides exactly. Do NOT re-derive the structure.**

---

## ⚠️ Critical: uniform sizes in multi-screen flows

When you're building a multi-screen flow (KYC, onboarding, verification journey, etc.):

- **Mobile = always 375×812** for every screen in the flow
- **Desktop = always 1440×960** for every screen in the flow

The Examples library shows **per-organism canonical heights** (e.g. Camera Mobile = 375×650, Liveness Mobile = 375×812, Guidelines Mobile = 375×669) — these reflect the natural intrinsic height of each organism in isolation. **Do NOT copy those heights into a flow build.** A flow with mixed mobile heights (650→812→669) reads as inconsistent UI.

The widget master is responsive — resizing to 375×812 (even when the canonical organism size is 375×650) reflows the Camera/Selfie/etc. correctly. The bottom area becomes empty space below the organism, which matches actual device viewport.

**Always run the audit after any resize** — see `auditWidget` function below.

---

## How Examples are organized

Every Widget instance in an Examples section uses one of two variants:

### `Type=Content` (most flows)
- Organism inserted into the `Content ` **SLOT** via `slot.insertChild(0, organism)`
- Used by: PoI, PoA, Welcome, Document Type, Email/Phone Verification, Tips, Steps, Guidelines, List, Applicant Data, Accesses

### `Type=Camera` (camera/liveness/selfie flows)
- Organism set via **INSTANCE_SWAP property** `↳ Camera slot#10434:8`
- NO Content slot — organism lives directly inside the `Widget` frame
- Used by: Liveness (Selfie Desktop/Mobile), Camera (POI camera Desktop/Mobile)
- Pattern: `widget.setProperties({ "↳ Camera slot#10434:8": variant.id })`

**Both variants share the same 7 instance overrides** (visibility, padding, fill) — only the organism-injection method differs.

Light/Dark variants alternate (1st = Light white #ffffff bg; 2nd = Dark #1b1b1f bg).

---

## Examples sections — full inventory

### Standard WebSDK flows (Widget + Organism)

| Organism | Page ID | Section ID | Widget count | Sizes | URL |
|---|---|---|---|---|---|
| Accesses | `0:1` | `2344:135348` | 4 | 2× 1440×960 + 2× 375×812 | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-135348 |
| Applicant Data | `2:3794` | `2344:130719` | 4 | 2× desktop + 2× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-130719 |
| Camera | `2:8123` | `2344:108816` | 5 | 2× desktop + 3× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-108816 |
| Document Type | `2:105114` | `2344:105127` | 4 | 2× desktop + 2× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-105127 |
| Email Verification | `2:118419` | `2344:98484` | 5 | 2× desktop + 3× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-98484 |
| Guidelines | `2:111114` | `2344:95690` | 2 | mobile only 375×669 | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-95690 |
| List | `2:145492` | `2344:91365` | 2 | mobile only 375×660 | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-91365 |
| Liveness | `2:46122` | `2344:85995` | 4 | 2× desktop + 2× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-85995 |
| Phone Verification | `2:154991` | `2344:74148` | 4 | 2× desktop + 2× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-74148 |
| Proof of Address | `2:167666` | `2344:70725` | 4 | 2× desktop + 2× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-70725 |
| Proof of Identity | `1106:213515` | `2344:66522` | 4 | 2× 1440×960 + 1× 375×812 + 1× 375×661 | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-66522 |
| Welcome | `2:182128` | `2344:60473` | 4 | 2× desktop + 2× mobile | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-60473 |

### Multi-state sections

| Organism | Section ID | Count | URL |
|---|---|---|---|
| Steps | `2344:51210` | 10 (5 desktop states + 5 mobile states) | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2344-51210 |
| Tips | `2287:180771` | 12 (6 desktop + 6 mobile) | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2287-180771 |
| Tips with animations | `3044:132455` | empty (WIP) | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=3044-132455 |

### Statuses (no Widget — standalone cards)

| Variant | Section ID | URL |
|---|---|---|
| Step statuses examples | `2473:18580` | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2473-18580 |
| Final statuses examples | `2473:124340` | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2473-124340 |

### Sumsub ID

| Variant | Section ID | URL |
|---|---|---|
| light-examples (connect button) | `2712:113405` | https://figma.com/design/8VpSRNe9ur7SBctw0JrtOE/?node-id=2712-113405 |

### WIP / empty

- Preview 🟡 (`2928:96892`)
- QR | to phone (`2344:62861`)

### No Examples section at all

- Non-doc 🟡, Questionnaire 🟡, Video Ident, Sumsub ID – Data, Sumsub ID – Block & Pop-up

---

## Canonical sizes (use these in every flow)

| Platform | Use this in flows | Examples library reference (per-organism) |
|---|---|---|
| Desktop | **1440 × 960** | always 1440×960 — already uniform |
| Mobile | **375 × 812** | varies: 812 (most), 650 (Camera), 661/669 (Tips/Guidelines), 660 (List), 471 (Camera passive) |

The per-organism heights in the Examples library are **for reference of intrinsic organism size**, not for copying into flow builds. Flow uniformity > per-screen perfect height.

---

## Canonical Widget assembly recipe

This is the exact 7-step sequence to build a WebSDK screen using the Widget+Organism pattern. **Every step is required.**

```js
// 0. Setup — load fonts
await figma.loadFontAsync({ family: "Manrope", style: "Medium" });
await figma.loadFontAsync({ family: "Manrope", style: "SemiBold" });
await figma.loadFontAsync({ family: "Manrope", style: "Bold" });

// 1. Import Widget set + organism set
const widgetSet = await figma.importComponentSetByKeyAsync("232e8d4d5beed4ad18da48386dab7a640ac0ca45");
const poiSet    = await figma.importComponentSetByKeyAsync("0d9832d0a09832159dc83af7c50f83fb229c14d1"); // organism: PoI

// 2. Create Widget instance with Type=Content
const widgetVariant = widgetSet.children.find(c => c.name.includes("Type=Content")) || widgetSet.defaultVariant;
const widget = widgetVariant.createInstance();
widget.name = "WebSDK — Proof of Identity — Desktop";
section.appendChild(widget); // place inside parent section
widget.resize(1440, 960); // OR (375, 812) for mobile

// 3. CRITICAL: bind background fill — Widget instance fills are EMPTY by default
const bgVar = await figma.variables.importVariableByKeyAsync("feed2a5538bb5e0f2fb8a49bde6122c13ad68035");
// ↑ semantic/background/secondary/normal — resolves to #ffffff (light) or #1b1b1f (dark)
widget.fills = [figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 1, g: 1, b: 1 } }, "color", bgVar
)];

// 4. CRITICAL: visibility overrides
function find(n, p, d=0) { if (p(n)) return n; if (d>10) return null; for (const c of (n.children||[])) { const r = find(c, p, d+1); if (r) return r; } return null; }
function findAll(n, p, d=0, r=[]) { if (p(n)) r.push(n); if (d>10) return r; for (const c of (n.children||[])) findAll(c, p, d+1, r); return r; }

const isMobile = widget.width <= 600;

// 4a. Top Bar — show only ONE variant matching platform
const topBars = findAll(widget, n => n.type === "INSTANCE" && n.name?.startsWith("Toolbar / Top Bar"));
const showSize = isMobile ? "Small" : "Medium"; // Desktop=Medium, Mobile=Small (NOT Large)
for (const tb of topBars) {
  tb.visible = (tb.mainComponent?.name || "").includes(`Size=${showSize}`);
}

// 4b. Hide instruction (left QR-column) unless screen needs QR-handoff prompt
const instruction = find(widget, n => n.name === "instruction " && n.type === "FRAME");
if (instruction) instruction.visible = false;

// 4c. Hide Image (Steps illustration above content) unless screen needs it
const image = find(widget, n => n.name === "Image" && n.type === "FRAME");
if (image) image.visible = false;

// 5. Mobile-only: set Container to FILL horizontal so it reflows to 375 width
if (isMobile) {
  const container = find(widget, n => n.name === "Container" && n.type === "FRAME");
  if (container) container.layoutSizingHorizontal = "FILL";
}

// 6. CRITICAL: padding — Widget master defaults to 0/24/24/24 (desktop). Mobile MUST be 0/12/12/12
if (isMobile) {
  widget.paddingTop = 0;
  widget.paddingRight = 12;
  widget.paddingBottom = 12;
  widget.paddingLeft = 12;
}
// Desktop padding 0/24/24/24 is correct by default

// 7a. Type=Content — Insert organism into Content SLOT
const slot = find(widget, n => n.name === "Content " && n.type === "SLOT");
const poiVariant = poiSet.children.find(c => c.name.includes("Doc type=Two pages")) || poiSet.defaultVariant;
const poi = poiVariant.createInstance();
slot.insertChild(0, poi);  // appendChild silently fails on SLOT in some cases — insertChild always works
poi.layoutSizingHorizontal = "FILL"; // organism fills the slot

// 7b. Type=Camera — Set Camera slot via INSTANCE_SWAP (Liveness / Camera flows)
// const cameraVariant = selfieDesktopSet.children.find(c => c.name === "Type=Liveness, State=In progress - active");
// widget.setProperties({ "↳ Camera slot#10434:8": cameraVariant.id });
// Note: Camera slot uses INSTANCE_SWAP — pass the variant's .id (not its key)
```

### Type=Camera Widget recipe (Liveness, Camera flows)

For camera-based screens, the Widget is `Type=Camera` and the organism replacement is via INSTANCE_SWAP, not SLOT:

```js
const widgetSet = await figma.importComponentSetByKeyAsync("232e8d4d5beed4ad18da48386dab7a640ac0ca45");
const cameraVariant = widgetSet.children.find(c => c.name.includes("Type=Camera"));
const widget = cameraVariant.createInstance();
widget.resize(1440, 960); // or (375, 812) for mobile

// Apply same 7 overrides (bg fill, top bar visibility, instruction hidden, Image hidden,
// Container FILL on mobile, mobile padding 0/12/12/12)

// Then swap the Camera slot organism via INSTANCE_SWAP property
const selfieSet = await figma.importComponentSetByKeyAsync("f084df56919e9d34fdfba8bd8a7d0da0013938ee"); // Selfie Desktop
// or "63b5ee9d5c0ba84081f36bdc1ea9fea97a72dd59" for Selfie Mobile
const livenessVariant = selfieSet.children.find(c => c.name === "Type=Liveness, State=In progress - active");
widget.setProperties({ "↳ Camera slot#10434:8": livenessVariant.id });
```

**Selfie variants** (9 in each set): `Type=Selfie/Placeholder/Liveness/Loading/Success` × `State=Default/In progress - active/Empty-active/Full - active/Fit face/Passive`

---

## The 7 critical overrides

These are the exact instance-level changes that distinguish a working Widget composition from a broken one. **Every Examples-page widget has these 7 properties set.** If you build without setting them, you'll get the wrong dimensions, an empty slot, or default desktop chrome on mobile.

| # | Property | Where | Desktop | Mobile |
|---|---|---|---|---|
| 1 | Widget background fill | Widget instance `fills` | bound to `semantic/background/secondary/normal` (var `feed2a5538bb5e0f2fb8a49bde6122c13ad68035`) | same |
| 2 | Top Bar Size visible | each `Toolbar / Top Bar` instance `.visible` | `Size=Medium` true; others false | `Size=Small` true; others false |
| 3 | `instruction` frame visibility | `.visible` on `instruction ` FRAME | **false** (unless QR-handoff prompt needed) | **false** |
| 4 | `Image` frame visibility | `.visible` on `Image` FRAME | **false** (unless Steps illustration needed) | **false** |
| 5 | Container `layoutSizingHorizontal` | inside Container FRAME | `FIXED` (default OK) | **`FILL`** (without this, Container stays at 1392 wide) |
| 6 | Widget padding | auto-layout padding on Widget instance | `0/24/24/24` (default) | **`0/12/12/12`** (must override) |
| 7 | Organism in slot | `Content ` SLOT children | use `slot.insertChild(0, organism)` + `organism.layoutSizingHorizontal = "FILL"` | same |

---

## Common failure modes (and what each looks like)

### "Mobile widget overflows / has weird internals"
**Symptom:** Container is 1392 wide, Widget frame at x=337, instruction frame at x=-173.
**Cause:** Skipped step 5 (Container.FILL) and/or step 4a (wrong top bar visible).
**Fix:** Set Container.layoutSizingHorizontal = "FILL", verify Top Bar Size=Small visible.

### "Widget has no background"
**Symptom:** `widget.fills === []`. Whole screen looks transparent over canvas.
**Cause:** Skipped step 3. Widget instance fills are empty by default — they don't inherit from master automatically.
**Fix:** Bind `semantic/background/secondary/normal` as shown in step 3.

### "Slot is empty after appendChild"
**Symptom:** `slot.children.length === 0` after `slot.appendChild(organism)`.
**Cause:** `appendChild` on SLOT type silently discards in some cases.
**Fix:** Use `slot.insertChild(0, organism)` instead.

### "Cross-file clone fails with font error"
**Symptom:** `unloaded font "SF Pro Text Regular" / "Aeonik Pro Medium"` when calling `node.clone()` then `parent.appendChild(clone)`.
**Cause:** Source file uses fonts not installed locally (Aeonik Pro is Sumsub-licensed).
**Fix:** Don't clone cross-file. Build fresh in target file using imported component sets. If cloning is mandatory, use `clone()` without re-`appendChild` (auto-inserts as sibling), or strip text nodes that use missing fonts before move.

### "Wrong padding"
**Symptom:** Mobile widget content has 24px gutters instead of 12px, looks too cramped.
**Cause:** Used Widget master default (desktop padding) on mobile.
**Fix:** Always override mobile padding to `0/12/12/12` (step 6).

### "I see Size=Large top bar with Logo and breadcrumbs, even though screen is 480 or 1440"
**Symptom:** Wide top bar with Sumsub Logo on the left visible.
**Cause:** Default Widget instance has Size=Large visible. The Examples toggle this off and show Size=Medium for desktop SDK widget (480-wide variant) or Size=Small for mobile.
**Fix:** Step 4a — explicitly hide Size=Large.

---

## Audit script — verify against Examples

Use this to compare any built screen against the canonical Examples version:

```js
function auditWidget(widget, label) {
  function safeKids(n) { try { return n.children || []; } catch(e) { return []; } }
  function find(n, p, d=0) { if (p(n)) return n; if (d>10) return null; for (const c of safeKids(n)) { const r = find(c, p, d+1); if (r) return r; } return null; }
  function findAll(n, p, d=0, r=[]) { if (p(n)) r.push(n); if (d>10) return r; for (const c of safeKids(n)) findAll(c, p, d+1, r); return r; }

  const isMobile = widget.width <= 600;
  const expected = {
    fillsLength: 1,
    visibleTopBar: isMobile ? "Size=Small" : "Size=Medium",
    instructionVisible: false,
    imageVisible: false,
    paddingTop: 0,
    paddingRight: isMobile ? 12 : 24,
    paddingBottom: isMobile ? 12 : 24,
    paddingLeft: isMobile ? 12 : 24,
  };

  const topBars = findAll(widget, n => n.type === "INSTANCE" && n.name?.startsWith("Toolbar / Top Bar"));
  const visibleTopBar = topBars.find(tb => tb.visible)?.mainComponent?.name;
  const instruction = find(widget, n => n.name === "instruction " && n.type === "FRAME");
  const image = find(widget, n => n.name === "Image" && n.type === "FRAME");
  const slot = find(widget, n => n.name === "Content " && n.type === "SLOT");

  const actual = {
    fillsLength: widget.fills?.length || 0,
    visibleTopBar,
    instructionVisible: instruction?.visible,
    imageVisible: image?.visible,
    paddingTop: widget.paddingTop,
    paddingRight: widget.paddingRight,
    paddingBottom: widget.paddingBottom,
    paddingLeft: widget.paddingLeft,
    slotKidsCount: slot ? safeKids(slot).length : 0,
  };

  const issues = [];
  if (actual.fillsLength !== 1) issues.push(`fills empty — needs semantic/background/secondary/normal`);
  if (!actual.visibleTopBar?.includes(expected.visibleTopBar)) issues.push(`top bar wrong: ${actual.visibleTopBar} should be ${expected.visibleTopBar}`);
  if (actual.instructionVisible !== false) issues.push(`instruction must be visible:false`);
  if (actual.imageVisible !== false) issues.push(`Image must be visible:false`);
  if (actual.paddingRight !== expected.paddingRight) issues.push(`padding R=${actual.paddingRight} should be ${expected.paddingRight}`);
  if (actual.slotKidsCount === 0) issues.push(`Content slot empty — insertChild organism`);

  return { label, isMobile, expected, actual, issues };
}
```

---

## Notes on responsiveness

The Widget master is **partially responsive** — resizing alone is not enough.
- The TOP-LEVEL frame resizes correctly when you call `.resize(375, 812)`
- But the Container (and toolbars) do NOT auto-collapse without instance overrides

Specifically:
- **Mobile needs** `Container.layoutSizingHorizontal = "FILL"` and `Top Bar Size=Small visible`
- **Desktop needs** `Top Bar Size=Medium visible` (default Widget shows Size=Large which is too wide / for embedded mode)

This is why every Examples widget has overrides — even though they all use the same `Type=Content` variant, the instance-level visibility/sizing properties are what makes desktop look like desktop and mobile look like mobile.

---

## Quick mapping: organism → Examples section to clone

When the user says "build me a [step] screen", look up the organism here and grab the canonical assembly from Examples:

| User says | Open this Examples section | Copy these settings |
|---|---|---|
| "Welcome / intro screen" | `2344:60473` | Welcome organism in slot |
| "Document type selection" | `2344:105127` | Document Type organism |
| "Camera permissions" | `2344:135348` | Accesses organism |
| "Camera capture" | `2344:108816` | (5 widgets — pick by state: front/back/preview) |
| "Liveness check" | `2344:85995` | Liveness organism |
| "Selfie / liveness instructions" | `2344:108816` | Camera example with selfie state |
| "ID document upload" | `2344:66522` | PoI organism |
| "Address document upload" | `2344:70725` | PoA organism |
| "Email verification" | `2344:98484` | Email Verification (3 mobile states) |
| "Phone verification" | `2344:74148` | Phone Verification |
| "Tips / Do's and don'ts" | `2287:180771` | Tips organism (12 examples for different doc types) |
| "Guidelines (selfie/doc)" | `2344:95690` | Guidelines |
| "Document review/preview" | `2344:91365` | List/Review |
| "Step progress / status" | `2344:51210` | Steps NEW (10 states) |
| "Status: success/error" | `2473:18580` (step) or `2473:124340` (final) | Statuses |
| "Applicant data form" | `2344:130719` | Applicant Data |
| "Questionnaire" | (no Examples) | use `Section` organism manually |
| "QR handoff to phone" | (empty Examples) | use `QR/States` organism manually |
| "Sumsub ID connect button" | `2712:113405` | Sumsub ID button (5 states) |
