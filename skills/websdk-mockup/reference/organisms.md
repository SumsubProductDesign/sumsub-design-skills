# WebSDK Organisms — Component Catalog

> Library: Organisms (`8VpSRNe9ur7SBctw0JrtOE`)
> Full scan: 2026-04-28 via Plugin API. Deep property inspection: 2026-04-28. Examples sections scan: 2026-04-28.
> Import: `await figma.importComponentByKeyAsync(key)` for COMP; `await figma.importComponentSetByKeyAsync(key)` for SET.

---

## How to use property keys

```js
const set = await figma.importComponentSetByKeyAsync("KEY");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Disclaimer",          // VARIANT — use exact string
  "Logo#577:1": true,            // BOOLEAN — pass true/false
  "Title Text#1454:42": "Hello", // TEXT — pass string directly
});

// Non-exposed text (Title/Subtitle inside organisms): set directly
const titleNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
if (titleNode) {
  await figma.loadFontAsync(titleNode.fontName);
  titleNode.characters = "Custom title";
}
```

> **⚠️ Critical Gotchas — read before using:**
> - `Subtitile` (double-i) is a recurring Figma typo across organisms — Title/Subtitle text nodes have names "Title" and "Subtitile"
> - Text content in organisms is generally **NOT exposed** as component properties — use `findOne()` for direct node access
> - `Status preview` uses meaningless property names (Property 1/2/3/4) — only `Property 4` matters (Loading/Error)
> - `Non-doc Mobile` has `Aditional text #1897:0` with a trailing space before `#` — include it exactly
> - `Step status` uses `INSTANCE_SWAP` for the title slot — pass `component.id` (not key)

---

## Screen Assembly Guide

> How to compose complete SDK mockup screens from the Widget shell + organism content.

### Widget — Outer Shell Component

Every complete SDK screen is wrapped in the **Widget** component, which provides the browser/app chrome, top bars, and bottom bar. Organisms go inside its Content SLOT.

| Property | Value |
|---|---|
| Component SET key | `232e8d4d5beed4ad18da48386dab7a640ac0ca45` |
| `Type=Content` variant key | `1ee5c92aaeccd3fd0637757e11ff70b2ac615a78` |
| `Type=Camera` variant key | `ce1c7cd5ff6b65d98b872c206fbb86a3a10a85e0` |

Widget properties:

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Content / Camera |
| `Image#10288:0` | BOOLEAN | true/false — show hero image at top |
| `Content #12831:0` | SLOT | The organism to inject as content |
| `↳  Image#10431:4` | INSTANCE_SWAP | Swap the hero image component |
| `↳ Camera slot#10434:8` | INSTANCE_SWAP | Swap camera view (Type=Camera only) |

**Content SLOT preferred values** — 26 organisms are registered as valid slot contents (see SLOT `preferredValues` for the full list). Pass the organism's `component.id` when setting via SLOT.

---

### Screen Size Lookup

| Screen type | Width | Height | Notes |
|---|---|---|---|
| Desktop — Content | 1440 | 960 | Standard, most organisms |
| Desktop — Modal overlay | 1440 | 800 | Widget shorter; Modal/Full overlaid at x=357 |
| Desktop — Modal overlay (QR) | 1440 | 918 | Taller modal variant |
| Desktop — Camera | 1440 | 960 | Widget Type=Camera |
| Mobile — Content | 375 | 812 | Standard mobile |
| Mobile — Camera | 375 | 650 | Widget Type=Camera; shorter |
| Landscape — Camera | 812 | 375 | Figma FRAME (not Widget instance) |
| Mobile — Modal overlay | 375 | 660–812 | Modal/Full/Mobile component standalone (no Widget bg) |

---

### Organism Placement Inside Widget

After creating a Widget instance and inserting an organism, positions depend on viewport:

| Viewport | Inner widget width | Organism x | Organism y | Organism width |
|---|---|---|---|---|
| Desktop (1440×960) | 718px | 106 | 24 | 506 |
| Mobile (375×812) | 351px | 16 | 24 | 319 |

> **How to find the organism in the Widget tree:** navigate into the Widget instance → `Container` (1392×868) → `Widget frame` (718×868 desktop / 351×h mobile) → the organism instance sits inside Content SLOT at the positions above.

---

### Assembling a Standard Screen (Desktop or Mobile)

```js
// 1. Import Widget component set
const widgetSet = await figma.importComponentSetByKeyAsync(
  "232e8d4d5beed4ad18da48386dab7a640ac0ca45"
);

// 2. Create the Type=Content variant
const widget = widgetSet.children
  .find(v => v.name === "Type=Content")
  .createInstance();

// 3. Resize to target viewport (do NOT use layoutSizingHorizontal on root Widget)
widget.resize(1440, 960);    // desktop content
// widget.resize(375, 812);  // mobile content
// widget.resize(1440, 960); // desktop camera (then set Type=Camera)
// widget.resize(375, 650);  // mobile camera

// 4. Toggle Image on/off
widget.setProperties({ "Image#10288:0": false });

// 5. Import the organism
const orgComp = await figma.importComponentByKeyAsync("ORGANISM_KEY");
// or for a SET:
// const orgSet = await figma.importComponentSetByKeyAsync("SET_KEY");
// const orgComp = orgSet.defaultVariant;
const organism = orgComp.createInstance();
organism.setProperties({ /* organism-specific props */ });

// 6. Find Content SLOT inside Widget and place organism there
//    The SLOT node has:
//      - name: "Content " (TRAILING SPACE — yes really)
//      - type: "SLOT" (NOT "FRAME")
//    Find it by walking; do NOT match by FRAME type or "Content" without space.
function findSlot(node, depth) {
  if (depth > 8) return null;
  if (node.name === "Content " && node.type === "SLOT") return node;
  let ch; try { ch = node.children; } catch(e) { return null; }
  if (!ch) return null;
  for (const c of ch) {
    const r = findSlot(c, depth + 1);
    if (r) return r;
  }
  return null;
}
const slot = findSlot(widget, 0);
if (slot) {
  // ⚠️ CRITICAL: use insertChild(0, organism), NOT appendChild!
  // appendChild on SLOT silently fails or returns "Cannot move into instance" error.
  // setProperties({ "Content #12831:0": orgComp.id }) ALSO fails — SLOT props are read-only
  // (Plugin API API: "Slot component property values cannot be edited").
  // The ONLY working method is insertChild(index, instance) on the SLOT node.
  slot.insertChild(0, organism);
  // After insertion, retrieve organism from slot to apply sizing (its id is unchanged
  // but the local handle is sometimes invalidated post-insertChild)
  const orgInSlot = slot.children[0];
  try { orgInSlot.layoutSizingHorizontal = "FILL"; } catch(e) {}
}

// 7. Add Widget to canvas
const page = figma.currentPage;
page.appendChild(widget);
widget.x = 0; widget.y = 0;
```

---

### Assembling a Modal Overlay Screen (Desktop)

Used when organisms need a lightbox/modal over the main content (Guidelines, List, QR, Preview).

```
Frame "screen" (e.g. 1440×800, NONE layout, no fill)
├── Widget INSTANCE (1440×800, Type=Content, shorter height)
│   └── Content SLOT → organism shown in background
└── Modal / Full / Desktop INSTANCE (726×776, at x=357, y=0, ABSOLUTE)
    └── organism shown inside the modal
```

```js
// Create outer frame
const screen = figma.createFrame();
screen.resize(1440, 800);
screen.fills = [];

// Widget (background content)
const widgetSet = await figma.importComponentSetByKeyAsync("232e8d4d5beed4ad18da48386dab7a640ac0ca45");
const widget = widgetSet.children.find(v => v.name === "Type=Content").createInstance();
widget.resize(1440, 800);
screen.appendChild(widget);
widget.x = 0; widget.y = 0;

// Modal / Full / Desktop overlay
const modalComp = await figma.importComponentByKeyAsync(
  "61c1659962a2ee584b7750cd6c588bdf8345599e"
);
const modal = modalComp.createInstance();
screen.appendChild(modal);
modal.resize(726, 776);  // height matches widget height minus any chrome
modal.x = 357;           // centered over inner 718px widget: (1440 - 726) / 2 ≈ 357
modal.y = 0;
```

---

### Assembling a Mobile Modal Overlay Screen

On mobile, the modal IS the entire screen (no Widget background):

```js
// Just the Modal / Full / Mobile component standalone
const modalMobileComp = await figma.importComponentByKeyAsync(
  "80881e81eb92ac7328d868a7d2eefe7a5066aff6"
);
const modal = modalMobileComp.createInstance();
modal.resize(375, 660);  // or 375×812 for full-screen
```

---

### Modal / Full Components

| Component | Key | Standalone | Default size |
|---|---|---|---|
| `Modal / Full / Desktop` | `61c1659962a2ee584b7750cd6c588bdf8345599e` | COMP | 726×960 |
| `Modal / Full / Mobile` | `80881e81eb92ac7328d868a7d2eefe7a5066aff6` | COMP | 375×812 |

---

### Examples Section Summary — What Screen Type Each Organism Uses

| Organism(s) | Screen type | Desktop size | Mobile size |
|---|---|---|---|
| Welcome, Applicant Data, Document Type, Email Verification, Phone Verification, Proof of Address, Proof of Identity, Steps, Tips, Accesses | Standard Widget | 1440×960 | 375×812 |
| Camera (POI) | Widget Type=Camera | 1440×960 | 375×650 (+ 812×375 landscape) |
| Liveness (Selfie) | Widget Type=Camera | 1440×960 | 375×650 |
| Preview (Review) | Standard Widget (content) | 1440×960 | — |
| Guidelines, List | Modal overlay | 1440×800 + Modal/Full/Desktop | Modal/Full/Mobile standalone |
| QR \| to phone | Modal overlay (taller) | 1440×918 + Modal/Full/Desktop | — (desktop only) |
| Preview (modal) | Modal overlay | 1440×800 + Modal/Full/Desktop | Modal/Full/Mobile standalone |
| Tips (modal variant) | Modal overlay | 1440×800 + Modal/Full/Desktop | — |
| Statuses (Step + Final) | Standard Widget | 1440×960 | 375×812 |

---

## Page: Accesses

### `Accesses` — SET `3c05350d6baa4bb621e77700f41887c6cb5f7b80`

Permission request dialogs for Camera, Microphone, Location, Camera+Mic.

| Variant | Size |
|---|---|
| `Access=Camera` | 320×248 |
| `Access=Cam+mic` | 320×280 |
| `Access=Microphone` | 320×248 |
| `Access=Location` | 320×248 |

| Property key | Type | Options / Default |
|---|---|---|
| `Access` | VARIANT | Camera / Cam+mic / Microphone / Location |
| `Slot#6363:0` | INSTANCE_SWAP | Pass component node ID |

```js
const set = await figma.importComponentSetByKeyAsync("3c05350d6baa4bb621e77700f41887c6cb5f7b80");
const inst = set.defaultVariant.createInstance();
inst.setProperties({ "Access": "Camera" });
```

---

### `Instructions/Camera` — SET `59c110db0432bfa7b963e5b6107b9de3d1cb287d`

Step-by-step camera permission instructions. Platform + Browser matrix.

| Variant | Size |
|---|---|
| `Platform=Desktop, Browser=Chrome` | 506×540 |
| `Platform=Desktop, Browser=Safari` | 506×572 |
| `Platform=Desktop, Browser=Other` | 506×422 |
| `Platform=IOS, Browser=Safari` | 343×724 |
| `Platform=Android, Browser=webView` | 343×891 |

| Property key | Type | Options |
|---|---|---|
| `Platform` | VARIANT | IOS / Android / Desktop |
| `Browser` | VARIANT | Safari / Chrome / webView / Other |

---

### `Instructions/Location` — SET `c004e6979b981e992d56e0918d2ce8e4bec4155f`

| Property key | Type | Options |
|---|---|---|
| `Platform` | VARIANT | IOS / Android / Desktop |
| `Browser` | VARIANT | Safari / Chrome / webView / Other |

Size: 343×724 (IOS/Android) or Desktop variant.

---

### `Instructions/Cam+Mic` — SET `10c337915832d130108e2570d019d695ef952817`
### `Instructions/Microphone` — SET `f8c9d8a856b14b652dadccee830b3ec9635a8528`

Same Platform/Browser matrix as Camera/Location instructions.

### Example Screens — Accesses

| Example | Viewport | W × H | Widget | Organism | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Content | 1440×960 | `Type=Content` | `Accesses` (`3c05350d6baa4bb621e77700f41887c6cb5f7b80`) | `Access=Camera` |

---

## Page: Applicant Data

### `Applicant Data` — COMP `45653ee601d3f64b01ac3d32fbfdd171c7593895`

Full applicant data entry form. Size: **480×2766**.

| Property key | Type | Default |
|---|---|---|
| `Tax#1686:0` | BOOLEAN | true |
| `Tax country 2#1701:0` | BOOLEAN | true |
| `Tax country 3#1701:2` | BOOLEAN | true |
| `Content#2653:10` | SLOT | — |
| `Alert#3228:1` | BOOLEAN | false |

```js
const comp = await figma.importComponentByKeyAsync("45653ee601d3f64b01ac3d32fbfdd171c7593895");
const inst = comp.createInstance();
inst.setProperties({ "Tax#1686:0": true, "Alert#3228:1": false });
```

### Example Screens — Applicant Data

| Example | Viewport | W × H | Widget | Organism | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Content | 1440×960 | `Type=Content` | `Applicant Data` COMP (`45653ee601d3f64b01ac3d32fbfdd171c7593895`) | *(single component, no variants)* |

---

## Page: Camera

### `Illustrations/ID card` — SET `b1bd7dde8834091bac535966d9d299fcef7724cc`

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Sumsub / General |
| `Side` | VARIANT | Front / Back |

Size: 271×171 all variants.

---

### `Illustrations/Placeholders` — SET `5823fe1ff170106b7ca1ba9bed494e0d16a91b95`

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Card front / Card back side / Back side driving licence / Passport / Passport Horizontal |

Size: 256×162 (Card/Driving licence), 256×336 (Passport).

---

### `POI camera Mobile` — SET `58be4845a20470a7258f4225cbfbfe5006e3f4a6`

Mobile camera screen for identity document capture. All variants: **320×568**.

| Property key | Type | Options / Default |
|---|---|---|
| `Step` | VARIANT | Placeholder / Camera |
| `Type` | VARIANT | ID front side / ID back side / Passport \| Two Sides / Loading |
| `Tips#879:0` | BOOLEAN | true |
| `Subtitle#2610:0` | BOOLEAN | true |
| `Document Title#6907:15` | BOOLEAN | true |

```js
const set = await figma.importComponentSetByKeyAsync("58be4845a20470a7258f4225cbfbfe5006e3f4a6");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Step": "Placeholder",
  "Type": "ID front side",
  "Tips#879:0": true,
  "Subtitle#2610:0": true,
  "Document Title#6907:15": true,
});
```

---

### `POI camera Desktop` — SET `228282dceda135813ddbe0a29bc0447d6f13b0bc`

Desktop camera screen. All variants: **718×674**.

| Property key | Type | Options / Default |
|---|---|---|
| `Step` | VARIANT | Placeholder / Camera |
| `Type` | VARIANT | ID front side / ID back side / Passport \| Two Sides / Loading |
| `Tips#880:9` | BOOLEAN | true |
| `Camera Controls#3126:11` | BOOLEAN | true |
| `Document Title#3126:22` | BOOLEAN | true |

---

### `Camera frames/States` — SET `92737c54e66d3bae287cd13fcc25ba86c4f2cc39`

Camera viewfinder frame with state overlays. All variants: **402×402**.

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Placeholder / Circle / Active / Passive / Loading / Success |
| `State` | VARIANT | Default / Empty / In progress / Full / Focused |
| `Tips#1421:34` | BOOLEAN | true |
| `Arrow tip#1432:0` | BOOLEAN | false |
| `Digits#2892:2` | BOOLEAN | false |

---

### `Illustrations` — SET `5d47a85649a553ed0e8749b93f9ca0cce0d36469`

Full-screen WebSDK illustration. Both variants: **566×737**.

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Sumsub / General |

### Example Screens — Camera

> Camera screens use `Widget Type=Camera`. The camera organism goes into the `↳ Camera slot#10434:8` INSTANCE_SWAP, not the Content SLOT.

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop — Camera | Desktop Camera | 1440×960 | `Type=Camera` | `POI camera Desktop` (`228282dceda135813ddbe0a29bc0447d6f13b0bc`) | `Step=Camera, Type=ID front side` |
| Mobile — Camera | Mobile Camera | 375×650 | `Type=Camera` | `POI camera Mobile` (`58be4845a20470a7258f4225cbfbfe5006e3f4a6`) | `Step=Camera, Type=ID front side` |

---

## Page: Document Type

### `Document Type` — SET `442dd62bd28ea1eade633911188ee851951355f6`

Document type & country selection screen.

| Variant | Size |
|---|---|
| `Type=Default` | 480×465 |
| `Type=Empty` | 480×338 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Default / Empty |
| `Instruction#353:3` | BOOLEAN | false |
| `1 Click \| 1st Radio#2254:1` | BOOLEAN | false |
| `1 Click \| 2nd Radio#2254:0` | BOOLEAN | false |
| `Content#2717:0` | SLOT | — |
| `Content2#2717:3` | SLOT | — |

> Text nodes "Title" and "Subtitile" (typo!) inside are NOT exposed — set via `findOne()`.

```js
const set = await figma.importComponentSetByKeyAsync("442dd62bd28ea1eade633911188ee851951355f6");
const inst = set.defaultVariant.createInstance();
inst.setProperties({ "Type": "Default", "Instruction#353:3": false });

// Customize title text directly:
const titleNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
if (titleNode) {
  await figma.loadFontAsync(titleNode.fontName);
  titleNode.characters = "Select document type";
}
```

### Example Screens — Document Type

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Content | 1440×960 | `Type=Content` | `Document Type` (`442dd62bd28ea1eade633911188ee851951355f6`) | `Type=Default` |

---

## Page: Email Verification

### `Input` (email) — SET `99aa5f1de6c064a55cc741fdef95ab758e26dcb7`

Email input screen. Both variants: **375×554**.

| Property key | Type | Options / Default |
|---|---|---|
| `Type` | VARIANT | Email Input |
| `Status` | VARIANT | Default / Error |
| `Alert#2492:14` | BOOLEAN | false |

---

### `Code` (email) — SET `4df460c0223e69547caf98f029d84399472b4c41`

Email verification code entry screen. All variants: **375×547**.

| Property key | Type | Options |
|---|---|---|
| `Status` | VARIANT | Default / Error |
| `Type` | VARIANT | Timer / Resend Link / Status |
| `Sumsub ID Consent#1517:7` | BOOLEAN | false |

```js
const set = await figma.importComponentSetByKeyAsync("4df460c0223e69547caf98f029d84399472b4c41");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Status": "Default",
  "Type": "Timer",
  "Sumsub ID Consent#1517:7": false,
});
```

### Example Screens — Email Verification

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop — Email input | Desktop Content | 1440×960 | `Type=Content` | `Input` email (`99aa5f1de6c064a55cc741fdef95ab758e26dcb7`) | `Type=Email Input, Status=Default` |
| Desktop — Code entry | Desktop Content | 1440×960 | `Type=Content` | `Code` email (`4df460c0223e69547caf98f029d84399472b4c41`) | `Status=Default, Type=Timer` |

---

## Page: Guidelines

### `Guidelines` — SET `ee868b662794e83115465a04bd7c253d4c60e79f`

Full-screen guidelines page for Liveness, ID, or PoA.

| Variant | Size |
|---|---|
| `Type=Liveness` | 375×725 |
| `Type=ID` | 375×1033 |
| `Type=PoA` | 375×1192 |

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | ID / Liveness / PoA |

> No exposed text properties. All guideline text items ("Good lighting", "Correct facial positioning", etc.) are internal non-exposed text nodes.

### Example Screens — Guidelines

Guidelines always appear in a **Modal overlay** — never directly in a Widget Content slot.

| Example | Viewport | W × H | Structure |
|---|---|---|---|
| Desktop | Desktop Modal | 1440×800 | Outer frame(1440×800) → Widget(1440×800, Type=Content) bg + Modal/Full/Desktop(`61c1659962a2ee584b7750cd6c588bdf8345599e`, 726×776 at x=357) → `Guidelines`(`ee868b662794e83115465a04bd7c253d4c60e79f`) `Type=Liveness` |
| Mobile | Mobile Modal | 375×812 | `Modal/Full/Mobile`(`80881e81eb92ac7328d868a7d2eefe7a5066aff6`) standalone → `Guidelines` `Type=Liveness` |

---

## Page: List

### `List` — SET `1db8ac6af01da0cefa64ec1c83cf735d1e0ab113`

Scrollable selection list (Language / Country / Empty state).

| Variant | Size |
|---|---|
| `Type=Language` | 480×1076 |
| `Type=Country` | 480×1076 |
| `Type=Empty` | 480×48 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Language / Country / Empty |
| `Scroll Thumb#1661:0` | BOOLEAN | false |
| `Text#2214:12` | TEXT | "Nothing found or the country isn't supported by {companyName}" |

```js
const set = await figma.importComponentSetByKeyAsync("1db8ac6af01da0cefa64ec1c83cf735d1e0ab113");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Empty",
  "Text#2214:12": "Nothing found",
});
```

### Example Screens — List

List always appears in a **Modal overlay**.

| Example | Viewport | W × H | Structure |
|---|---|---|---|
| Desktop | Desktop Modal | 1440×800 | Outer frame(1440×800) → Widget(1440×800, Type=Content) bg + Modal/Full/Desktop(`61c1659962a2ee584b7750cd6c588bdf8345599e`) → `List`(`1db8ac6af01da0cefa64ec1c83cf735d1e0ab113`) `Type=Country` |
| Mobile | Mobile Modal | 375×812 | `Modal/Full/Mobile`(`80881e81eb92ac7328d868a7d2eefe7a5066aff6`) standalone → `List` `Type=Country` |

---

## Page: Liveness

### `Camera frames/States` — see Page: Camera above

### `Selfie Mobile` — SET `63b5ee9d5c0ba84081f36bdc1ea9fea97a72dd59`

Mobile selfie/liveness camera screen. All variants: **320×568**.

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Placeholder / Liveness / Selfie / Loading / Success |
| `State` | VARIANT | Default / Fit face / Passive / In progress - active / Full - active / Empty-active |
| `Toolbar#1434:8` | BOOLEAN | true |
| `Toolbar text#2846:0` | BOOLEAN | false |

```js
const set = await figma.importComponentSetByKeyAsync("63b5ee9d5c0ba84081f36bdc1ea9fea97a72dd59");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Liveness",
  "State": "Fit face",
  "Toolbar#1434:8": true,
});
```

---

### `Selfie Desktop` — SET `f084df56919e9d34fdfba8bd8a7d0da0013938ee`

Desktop selfie/liveness camera. Size: **718×630** (Selfie/Placeholder) or **718×542** (Liveness/Loading/Success).

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Placeholder / Selfie / Liveness / Loading / Success |
| `State` | VARIANT | Default / Fit face / Passive / Empty-active / In progress - active / Full - active |
| `Camera switch#1356:0` | BOOLEAN | true |
| `Toolbar#1551:20` | BOOLEAN | true |
| `Toolbar text#2846:10` | BOOLEAN | false |

---

### `short video / pronounce` — SET `d4e0e38df686bc63343ca1dac58d15c87e11c803`

Short video digit/phrase overlay. Used inside liveness screens.

| Variant | Size |
|---|---|
| `State=Digits` | 204×48 |
| `State=Phrase` | 280×88 |
| `State=Loading` | 48×48 |

| Property key | Type | Options |
|---|---|---|
| `State` | VARIANT | Digits / Phrase / Loading |
| `Slot#2892:0` | SLOT | — |

### Example Screens — Liveness

> Liveness uses `Widget Type=Camera`. The camera organism goes into the `↳ Camera slot#10434:8` INSTANCE_SWAP.

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Camera | 1440×960 | `Type=Camera` | `Selfie Desktop` (`f084df56919e9d34fdfba8bd8a7d0da0013938ee`) | `Type=Liveness, State=In progress - active` |
| Mobile | Mobile Camera | 375×650 | `Type=Camera` | `Selfie Mobile` (`63b5ee9d5c0ba84081f36bdc1ea9fea97a72dd59`) | `Type=Liveness, State=In progress - active` |

---

## Page: Non-doc

### `Mobile` (non-doc) — SET `cba63480bcf4a851dab9b6228334f5b4bca0a9ed`

Non-document identity verification screens (country-specific). All variants: **375×586**.

**Types:** Argentina / Brazil / India \| Aadhaar / India \| Verification / Indonesia / Nigeria \| Default / Nigeria \| BVN / Nigeria \| NIN / UK

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Argentina / Brazil / India \| Aadhaar / … |
| `Alert#1093:7` | BOOLEAN | false |
| `Incorrect SMS Code#1093:15` | BOOLEAN | false |
| `Resend SMS Code Button#1093:23` | BOOLEAN | false |
| `Resend SMS Code Timer#1093:31` | BOOLEAN | true |
| `Aditional text #1897:0` | BOOLEAN | false |

> ⚠️ Typo in property key: "Aditional" (not "Additional") AND trailing space before `#`. Use exactly: `"Aditional text #1897:0"`.

---

### `Desktop` (non-doc) — SET `1b1c9f7ec3e2a339c92b3282a3ed6e9a2d03c546`

Same country types, size: **480×586**. Same properties as Mobile except no `Aditional text`.

---

## Page: Phone Verification

### `Input` (phone) — SET `e388d5ae8568912654305ba2f771ce7f6453fdee`

Phone number input screen. Both variants: **480×547**.

| Property key | Type | Options / Default |
|---|---|---|
| `Type` | VARIANT | Phone Number |
| `Status` | VARIANT | Default / Error |
| `Alert#2492:8` | BOOLEAN | false |

---

### `Code` (phone) — SET `58e364ca01522b7faffca7dff2c06d6a91de713c`

Phone code entry screen. Size: **480×541–547**.

| Property key | Type | Options |
|---|---|---|
| `Status` | VARIANT | Default / Error |
| `Type` | VARIANT | Timer / Resend Link / Status |
| `Sumsub ID Consent#1575:14` | BOOLEAN | false |

### Example Screens — Phone Verification

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop — Phone input | Desktop Content | 1440×960 | `Type=Content` | `Input` phone (`e388d5ae8568912654305ba2f771ce7f6453fdee`) | `Type=Phone Number, Status=Default` |

---

## Page: Preview

### `Review` — SET `09b8c6028793eab17ded1bde19087c3ee4d6e0bd`

Photo review screen after capture. All variants: **375×355–403**.

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | ID / Video / Selfie |
| `Fastfail` | VARIANT | False / True |
| `Document type#2132:8` | TEXT | "ID card front side" |
| `Photo slot#2922:0` | SLOT | — |

```js
const set = await figma.importComponentSetByKeyAsync("09b8c6028793eab17ded1bde19087c3ee4d6e0bd");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "ID",
  "Fastfail": "False",
  "Document type#2132:8": "Passport",
});
```

---

### `Review / Slot` — SET `c6ef91d5aee989d399b3c8907da7382d21843644`

Photo slot within review screen.

| Variant | Size |
|---|---|
| `Type=ID, Orientation=Mobile` | 327×209 |
| `Type=Selfie, Orientation=Mobile` | 327×457 |
| `Type=Document, Orientation=Mobile` | 327×457 |
| `Type=Passport, Orientation=Mobile` | 327×457 |

| Property key | Type | Options / Default |
|---|---|---|
| `Type` | VARIANT | Selfie / ID / Document / Passport |
| `Orientation` | VARIANT | Mobile / Desktop / Desktop front / Desktop back |
| `Video buttons#3430:50` | BOOLEAN | false |
| `Fullscreen Button#3430:61` | BOOLEAN | true |
| `Progress Bar#3430:72` | BOOLEAN | false |

---

### `Preview / Full` — SET `303f62c47b324075ed306467e44c4390ae7130fe`

Full-screen document/selfie preview.

| Variant | Size |
|---|---|
| Mobile variants (`Mobile=True`) | 375×603 |
| Desktop variants (`Mobile=False`) | 840×630 |

| Property key | Type | Options |
|---|---|---|
| `Type` | VARIANT | Selfie / ID front / ID back |
| `Mobile` | VARIANT | True / False |

---

### `Status` (preview) — SET `0b2081e805d0d125800a926aaf2a9ed2a441954c`

Upload status overlay (Loading/Error). Size: **375×340**.

| Property key | Type | Options |
|---|---|---|
| `Property 4` | VARIANT | Loading / Error |

> `Property 1/2/3` are locked to single values ("Mobile", "1", "2"). Only `Property 4` is useful.

### Example Screens — Preview

| Example | Viewport | W × H | Widget / Structure | Organism | Organism variant |
|---|---|---|---|---|---|
| Desktop — Review content | Desktop Content | 1440×960 | `Type=Content` Widget | `Review` (`09b8c6028793eab17ded1bde19087c3ee4d6e0bd`) | `Type=Video`, `Fastfail=False` (also Selfie/ID variants) |
| Desktop — Modal (Preview/Full) | Desktop Modal | 1440×800 | Outer frame + Widget(1440×800) bg + Modal/Full/Desktop | `Preview / Full` (`303f62c47b324075ed306467e44c4390ae7130fe`) | `Type=Selfie` or `Type=ID front`, `Mobile=False` |
| Mobile — Modal (Review/Slot) | Mobile Modal | 375×812 | `Modal/Full/Mobile` standalone | `Review / Slot` (`c6ef91d5aee989d399b3c8907da7382d21843644`) | `Type=Selfie` or `Type=ID front`, `Orientation=Mobile` |

---

## Page: Proof of Address

### `PoA` — SET `f20729d5fc1b62ce03305606ff77e3db44fdab83`

| Variant | Size |
|---|---|
| `Type=Geolocation` | 480×668 |
| `Type=Upload` | 480×504 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Geolocation / Upload |
| `Mark down#728:0` | BOOLEAN | false |

### Example Screens — Proof of Address

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Content | 1440×960 | `Type=Content` | `PoA` (`f20729d5fc1b62ce03305606ff77e3db44fdab83`) | `Type=Upload` |

---

## Page: Proof of Identity

### `PoI` — SET `0d9832d0a09832159dc83af7c50f83fb229c14d1`

Document upload method selection (PoI screen).

| Variant | Size |
|---|---|
| `Doc type=Two pages` | 432×406 |
| `Doc type=One page` | 432×466 |

| Property key | Type | Options |
|---|---|---|
| `Doc type` | VARIANT | One page / Two pages |

### Example Screens — Proof of Identity

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Content | 1440×960 | `Type=Content` | `PoI` (`0d9832d0a09832159dc83af7c50f83fb229c14d1`) | `Doc type=Two pages` |

---

## Page: QR | to phone

### `QR/States` — SET `ed5e0b8a252f6fc0106587e783d683838568799c`

QR code component (used for "continue on phone" flow). Size: **192×192**.

| Property key | Type | Options |
|---|---|---|
| `Logo` | VARIANT | True / False |

### `QR` — COMP `706492d301f178184a97dcb2b426a73cf55569ef`

Single QR code display component.

### Example Screens — QR | to phone

The QR flow uses a **Modal overlay** (desktop-only; no mobile example for this page).

| Example | Viewport | W × H | Structure |
|---|---|---|---|
| Desktop | Desktop Modal (tall) | 1440×918 | Outer frame(1440×918) → Widget(1440×918, Type=Content) bg + Modal/Full/Desktop(`61c1659962a2ee584b7750cd6c588bdf8345599e`, 726×900 at x=357) → `List`(`1db8ac6af01da0cefa64ec1c83cf735d1e0ab113`) `Type=Country` |

---

## Page: Questionnaire

### `Section` — SET `8848ca9883f60d1f54ea0900f5274417b7dfaaa1`

Questionnaire section with 14 field types. Size varies (327×120–208 approx).

**Types:** Short Text / Long Text / Dropdown / Multiselect / Checkboxes / Multiple Choice / Country / Date / Date and Time / Phone Number / Single Upload / Multiple Upload / Consent / Empty

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | see 14 types above |
| `Questionnaire Header#49:0` | BOOLEAN | true |
| `Section Header#49:14` | BOOLEAN | true |
| `Carousel#1410:0` | BOOLEAN | false |

```js
const set = await figma.importComponentSetByKeyAsync("8848ca9883f60d1f54ea0900f5274417b7dfaaa1");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Short Text",
  "Questionnaire Header#49:0": true,
  "Section Header#49:14": false,
});
```

---

### `Questionnaire / Item` — SET `7f976eb0146938fcfb17a2e68c774953885355c5`

Single questionnaire step row (used in Steps NEW / overview lists).

| Variant | Size |
|---|---|
| `Type=Item` | 506×24 |
| `Type=Section` | 506×32 |
| `Type=General` | 506×32 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | General / Item / Section |
| `Title Text#1454:42` | TEXT | "Title" |
| `↪ Subtitle Text#3475:8` | TEXT | "Subtitle" |
| `Required#1454:37` | BOOLEAN | false |
| `Alert#1454:39` | BOOLEAN | false |
| `Optional#1454:41` | BOOLEAN | false |
| `Number#1454:43` | BOOLEAN | false |
| `Subtitle#3475:0` | BOOLEAN | false |
| `Slot#3475:4` | BOOLEAN | false |

```js
const set = await figma.importComponentSetByKeyAsync("7f976eb0146938fcfb17a2e68c774953885355c5");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Item",
  "Title Text#1454:42": "Personal information",
  "Required#1454:37": true,
  "Number#1454:43": true,
});
```

---

## Page: Statuses

### `Final statuses` — SET `d3f95404b879e0993ddca2f599e2e5071cdda0ba`

Final KYC status screen (Pending/Success/Rejected). All variants: **480×553**.

| Property key | Type | Options |
|---|---|---|
| `Status` | VARIANT | Pending / Rejected / Success |
| `Caption#587:16` | BOOLEAN | false |

> Text nodes "Title" and "Subtitile" (typo!) inside are NOT exposed — modify via `findOne()` if needed.

```js
const set = await figma.importComponentSetByKeyAsync("d3f95404b879e0993ddca2f599e2e5071cdda0ba");
const inst = set.defaultVariant.createInstance();
inst.setProperties({ "Status": "Success", "Caption#587:16": false });
```

---

### `Status titles/Pending` — SET `580fe91ba211c910bde144e968a65427f1558f02`

Status title block for "in progress" states. All variants: **480×88**.

**22 `Step title` options:** ID / Selfie / Liveness / Video / Address / Email / Phone / Solana / Linea / Personal info / Questionnaire / Applicant data / eSign / Company details / Payment method / Company documents / Associated parties / Recipient / Device / Video ID / Hold with email / Hold

```js
inst.setProperties({ "Step title": "ID" });
```

---

### `Status titles/Final` — SET `b458d7a3f7babbd69a2b1eecc783bc82c48ae116`

Final decision title block. Size varies by variant.

| Variant | Size |
|---|---|
| `Title slot=Success` | 480×64 |
| `Title slot=Reject` | 480×64 |
| `Title slot=Country isn't supported` | 480×120 |
| `Title slot=Sumsub ID` | 480×88 |
| `Title slot=Sumsub ID (pop-up)` | 480×168 |
| `Title slot=Reject with input` | 432×244 |

```js
inst.setProperties({ "Title slot": "Success" });
```

---

### `Status titles/States` — SET `9b42bf9a58824768ef7a377cd718e42ffe69ee27`

Error/warning state title blocks. Size: mostly **480×64–88**.

**18 `Title slot` options:** Location error / Selfie error / Video error / Address step / No internet / Session expired / Device mobile / Devices / Sunglasses / VPN / Address geo / VPN usage / Error virtual cam / Unsupported browser / Camera error / Loading error / Unknown / No results_KYB

| Property key | Type | Default |
|---|---|---|
| `Title slot` | VARIANT | see 18 options |
| `Another option#2465:0` | BOOLEAN | true |

---

### `Step status` — SET `19f390fb940f29bcc82d764ee732f718ac129874`

Animated step status screen. All variants: **480×553**.

⚠️ **Verified property scan (2026-04-29) — different from earlier docs:**

| Property key | Type | Default |
|---|---|---|
| `Status state` | VARIANT | Default / Error / Attention |
| `Slot#2653:11` | SLOT | (read-only via Plugin API — fill via `slot.insertChild(0, ...)`) |
| `Error#2653:15` | SLOT | (same) |
| `Warning#2653:19` | SLOT | (same) |

> ❌ **Earlier docs claimed `Title slot#2393:1` (INSTANCE_SWAP) exists — it does NOT.** Plugin API errors with `"Could not find a component property with name: 'Title slot#2393:1'"` when you try to set it. The property does not exist on the component set.
>
> **What actually exists:** three SLOTs (Slot / Error / Warning) and the Status state VARIANT. There is no INSTANCE_SWAP for the title.
>
> **For a status screen with a customizable title, prefer `Final statuses` set (`d3f95404b879e0993ddca2f599e2e5071cdda0ba`)** — it has Title/Subtitle as exposed TEXT nodes editable via `findOne(...)`. Its 3 variants:
> - Status=Success
> - Status=Pending (good for "Verifying your identity" / processing screens)
> - Status=Rejected
>
> Step status is appropriate only when the matching Status state variant + slot fill solves the screen. For text-driven status messaging, use Final statuses.

```js
// Step status — slot fill (only works for the 3 SLOTs above)
const stepSet = await figma.importComponentSetByKeyAsync("19f390fb940f29bcc82d764ee732f718ac129874");
const inst = stepSet.children.find(v => v.name.includes("Status state=Default")).createInstance();
// Find slot by name (note trailing space if applicable, and type=SLOT)
function findSlotByName(node, name) { /* walk and match name===name && type==="SLOT" */ }
const slot = findSlotByName(inst, "Slot#2653:11"); // or whatever your target
slot.insertChild(0, customContent);
```

### Example Screens — Statuses

Section names in source file: `"Step statuses examples"` and `"Final statuses examples"` (non-standard).

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop — Step status (Default) | Desktop Content | 1440×960 | `Type=Content` | `Step status` (`19f390fb940f29bcc82d764ee732f718ac129874`) | `Status state=Default` |
| Desktop — Step status (Attention) | Desktop Content | 1440×960 | `Type=Content` | `Step status` (`19f390fb940f29bcc82d764ee732f718ac129874`) | `Status state=Attention` |
| Desktop — Step status (Error) | Desktop Content | 1440×960 | `Type=Content` | `Step status` (`19f390fb940f29bcc82d764ee732f718ac129874`) | `Status state=Error` |
| Desktop — Final statuses (Success) | Desktop Content | 1440×960 | `Type=Content` | `Final statuses` (`d3f95404b879e0993ddca2f599e2e5071cdda0ba`) | `Status=Success` |

---

## Page: Steps

### `Steps NEW` — SET `c8893dba74df6506596ffccc6f22a407d145e532`

KYC flow steps overview screen. All variants: **506×556**.

| Property key | Type | Options |
|---|---|---|
| `State` | VARIANT | Default / Resubmission / Reusable KYC |
| `Sumsub ID#2771:1` | BOOLEAN | false |

```js
const set = await figma.importComponentSetByKeyAsync("c8893dba74df6506596ffccc6f22a407d145e532");
const inst = set.defaultVariant.createInstance();
inst.setProperties({ "State": "Default", "Sumsub ID#2771:1": false });
```

### Example Screens — Steps

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop — Default | Desktop Content | 1440×960 | `Type=Content` | `Steps NEW` (`c8893dba74df6506596ffccc6f22a407d145e532`) | `State=Default` |
| Desktop — Resubmission | Desktop Content | 1440×960 | `Type=Content` | `Steps NEW` | `State=Resubmission` |
| Desktop — Reusable KYC | Desktop Content | 1440×960 | `Type=Content` | `Steps NEW` | `State=Reusable KYC` |

---

## Page: Tips

### `Tips` — SET `a4f45db0337fd053bbac9adf11434aaa53bcd664`

Tips/hints panel for each verification step. Width: **480**.

| Variant | Size |
|---|---|
| `Type=Tips \| Liveness` | 480×176 |
| `Type=Tips \| Document` | 480×208 |
| `Type=ID \| Live Capture` | 480×176 |
| `Type=ID \| Upload` | 480×168 |
| `Type=Selfie with Document` | 480×168 |
| `Type=Selfie` | 480×208 |
| `Type=Short Video` | 480×240 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | see 7 types above |
| `Alert#1226:0` | BOOLEAN | false |

```js
const set = await figma.importComponentSetByKeyAsync("a4f45db0337fd053bbac9adf11434aaa53bcd664");
const inst = set.defaultVariant.createInstance();
inst.setProperties({ "Type": "Tips | Liveness", "Alert#1226:0": false });
```

### Example Screens — Tips

| Example | Viewport | W × H | Widget / Structure | Organism | Organism variant |
|---|---|---|---|---|---|
| Desktop — Tips content | Desktop Content | 1440×960 | `Type=Content` Widget | `Tips` (`a4f45db0337fd053bbac9adf11434aaa53bcd664`) | `Type=Tips\|Liveness` / `ID\|Live Capture` / `Selfie` / `Short Video` |
| Desktop — Modal (Guidelines) | Desktop Modal | 1440×800 | Outer frame + Widget(1440×800) bg + Modal/Full/Desktop | `Guidelines` (`ee868b662794e83115465a04bd7c253d4c60e79f`) | `Type=Liveness` inside modal |

---

## Page: Video Ident

### `Mobile` (video ident) — SET `9341ec89365d81bafda0065fe9fe93052a79c7fa`

Video identity call screen — mobile.

| Variant | Size |
|---|---|
| `Type=Checking` | 375×481 |
| `Type=Camera` | 375×554 |
| `Type=Document` | 375×554 |
| `Type=Waiting` | 375×554 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Checking / Camera / Document / Waiting |
| `Operator#862:10` | BOOLEAN | true |
| `Bottom Panel#871:0` | BOOLEAN | false |
| `Title#2158:26` | BOOLEAN | true |
| `Subtitile#2158:31` | BOOLEAN | true |
| `Banner#4907:0` | BOOLEAN | false |
| `Face Frame#4910:0` | BOOLEAN | false |

> ⚠️ `Subtitile#2158:31` — typo ("Subtitile" not "Subtitle"). Use exact spelling.

```js
const set = await figma.importComponentSetByKeyAsync("9341ec89365d81bafda0065fe9fe93052a79c7fa");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Camera",
  "Operator#862:10": true,
  "Title#2158:26": true,
  "Subtitile#2158:31": true,
});
```

---

### `Desktop` (video ident) — SET `6e9e5ee2e6d0911f93b51f9675af94ea82a25002`

Video identity call screen — desktop. Size varies.

| Variant | Size |
|---|---|
| `Type=Tips` | 480×444 |
| `Type=Checking` | 480×613 |
| `Type=Languages` | 320×859 |
| `Type=Camera` | 718×630 |
| `Type=Document` | 718×630 |
| `Type=Waiting` | varies |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Checking / Tips / Camera / Document / Languages / Waiting |
| `Operator#862:10` | BOOLEAN | true |
| `Mic swatch#1722:0` | BOOLEAN | false |
| `Title#2163:0` | BOOLEAN | true |
| `Subtitle#2163:5` | BOOLEAN | true |
| `Bottom Panel#3102:5` | BOOLEAN | false |
| `Banner#4907:25` | BOOLEAN | false |
| `Face Frame#4910:7` | BOOLEAN | false |

---

### `Panel Content / Phone Verification` — SET `b25bd9e0ebcef96c5ed54dbf5e01e42147bc71fb`

Phone verification panel inside Video Ident call.

| Variant | Size |
|---|---|
| `Step=Phone Number, State=Default` | 327×214 |
| `Step=Code, State=Default` | 327×240 |
| `Step=Code, State=Resend` | 327×240 |
| `Step=Code, State=Error` | 327×248 |

| Property key | Type | Options |
|---|---|---|
| `Step` | VARIANT | Code / Phone Number |
| `State` | VARIANT | Default / Error / Resend |

---

### `Panel Content / Success` — COMP `2183ebefa0dd4fb47456e4406472465b142035c4`

Success content panel. Size: **327×236**. No exposed properties.

---

### `Panel Content / Upload` — COMP `f5eb0d1d24c46e3815ade1e002ff0069789ae76f`

Upload content panel. Size: **327×128**. No exposed properties.

---

## Page: Welcome

### `Welcome` — SET `927496fb36399feb71b4304d558be0d37a8fc5a9`

Welcome / consent screen shown at the start of KYC flow.

| Variant | Size |
|---|---|
| `Type=Disclaimer` | 480×180 |
| `Type=Consent` | 480×233 |
| `Type=Default Agreement` | 480×232 |
| `Type=US Agreement` | 480×456 |

| Property key | Type | Default |
|---|---|---|
| `Type` | VARIANT | Disclaimer / Consent / Default Agreement / US Agreement |
| `Logo#577:1` | BOOLEAN | true |
| `Consents#7379:4` | BOOLEAN | true |
| `↳ Reusable KYC Consent#199:0` | BOOLEAN | false |

> Text nodes "Title" and "Subtitile" (typo!) inside are NOT exposed — access via `findOne()`.

```js
const set = await figma.importComponentSetByKeyAsync("927496fb36399feb71b4304d558be0d37a8fc5a9");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Type": "Disclaimer",
  "Logo#577:1": true,
  "Consents#7379:4": true,
});

// Customize title if needed:
const titleNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
if (titleNode) {
  await figma.loadFontAsync(titleNode.fontName);
  titleNode.characters = "Identity verification for Acme Corp";
}
```

### Example Screens — Welcome

| Example | Viewport | W × H | Widget | Organism SET key | Organism variant |
|---|---|---|---|---|---|
| Desktop | Desktop Content | 1440×960 | `Type=Content` | `Welcome` (`927496fb36399feb71b4304d558be0d37a8fc5a9`) | `Type=Disclaimer` |

---

## Sumsub ID — Organisms

### Page: Sumsub ID – Data

#### `Create account` — COMP `d4038bf6828e390b3d79d836e7d2d65d4f7c0b7c`

Account creation form. Size: **506×312**. No exposed properties.

---

#### `Data transferring` — COMP `a51a415f58748a1ae8613e9547b320b386d4f915`

Data transfer progress screen. Size: **506×570**. No exposed properties.

---

#### `Select docs` — SET `8f174a0ab4c064495337664e74141e941d101d8c`

Document selection for Sumsub ID.

| Variant | Size |
|---|---|
| `State=With docs` | 506×1038 |
| `State=No docs` | 506×584 |

| Property key | Type | Default |
|---|---|---|
| `State` | VARIANT | With docs / No docs |
| `Alert – no documents selected#1640:14` | BOOLEAN | false |

---

### Page: Sumsub ID – Connect

#### `Logos` — SET `968128769cce0d953d81fc6d2f93306951e0ec3c`

Sumsub ID logo area. Size: **116×56**.

| Property key | Type | Options |
|---|---|---|
| `Logo` | VARIANT | true / false |

> ⚠️ Variant options use lowercase: `"true"` / `"false"` (not Title Case).

---

### Page: Sumsub ID – Block & Pop-up

#### `Toast / Desktop` — SET `4f0aeb09b708aae2789e0853bf6be36c9aba037c`

| Variant | Size |
|---|---|
| `Theme=Light, Type=Default` | 506×328 |
| `Theme=Light, Type=Error` | 506×222 |
| `Theme=Dark, Type=Default` | 506×328 |
| `Theme=Dark, Type=Error` | 506×222 |

| Property key | Type | Options |
|---|---|---|
| `Theme` | VARIANT | Light / Dark |
| `Type` | VARIANT | Default / Error |

---

#### `Toast / Mobile` — SET `d1e956f70c3114b679248befbc5dc05f4944c71f`

| Variant | Size |
|---|---|
| `Theme=Light, Type=Default` | 417×344 |
| `Theme=Light, Type=Error` | 417×294 |
| `Theme=Dark, Type=Default` | 417×344 |
| `Theme=Dark, Type=Error` | 417×294 |

Same `Theme` / `Type` properties as Desktop.

---

#### `SNS ID | Desktop` — SET `ac451d0bd330fc997916598453781c7bbcab4b9f`
#### `SNS ID | Mobile` — SET `8658be3cc38a0f7905983269ed375fdb9fb9e852`

Sumsub ID connection banner. Both sets have identical properties and sizes.

| Variant | Size |
|---|---|
| `Active=True, Theme=Light/Dark` | 480×158 |
| `Active=False, Theme=Light/Dark` | 480×100 |

| Property key | Type | Options |
|---|---|---|
| `Active` | VARIANT | True / False |
| `Theme` | VARIANT | Light / Dark |

---

## Other

### `Header` — COMP `193b44314fe5c23934fb8e8b842f8dc7a2e66188`

Reusable WebSDK header (in playground page). Not available via `importComponentByKeyAsync` — import from the organisms library directly if needed.

---

## Known Gotchas

| Issue | Detail |
|---|---|
| `Subtitile` typo | Text nodes named "Subtitile" (double-i) appear across Welcome, Document Type, Final statuses, Video Ident Mobile. Must use exact name in `findOne(n => n.name === "Subtitile")` |
| Text not exposed | Title/Subtitle text in Welcome, Guidelines, Document Type, Final statuses, Guidelines items — NOT in `componentPropertyDefinitions`. Must set via `findOne()` + `loadFontAsync()` + `.characters` |
| Status preview useless props | `Property 1/2/3` locked to single values. Only `Property 4` matters: `"Loading"` / `"Error"` |
| Non-doc `Aditional text` | Key is `"Aditional text #1897:0"` — note typo ("Aditional") AND trailing space before `#` |
| Step status INSTANCE_SWAP | `Title slot#2393:1` needs `component.id` from a `Status titles/*` variant, not a component key |
| Sumsub ID Logos lowercase | `Logo` variant options are `"true"` / `"false"` (lowercase), unlike most other booleans that use `"True"` / `"False"` |
| Preview/Full orientation | `Mobile` property uses string `"True"` / `"False"` (not booleans) — it's a VARIANT, not BOOLEAN |
| Email input width | Email Input (375×554) is narrower than Phone Input (480×547) — match to platform |
| QR WebSDK Header | `Header` COMP key `193b44314fe5c23934fb8e8b842f8dc7a2e66188` returns "not found" from importComponentByKeyAsync in some files |
| Video Ident Desktop Languages | `Type=Languages` is 320×859 — unusually tall and narrow compared to other Desktop variants |
| Camera organism via INSTANCE_SWAP | For `Type=Camera` Widget, put organism in `↳ Camera slot#10434:8` INSTANCE_SWAP, NOT in Content SLOT |
| SECTION children require page nav | `figma.setCurrentPageAsync(page)` must be called before accessing SECTION `.children`; without it the array is empty |
| Statuses section names | Page "Statuses" uses `"Step statuses examples"` and `"Final statuses examples"` (not the standard `"Examples"`) |
| QR Modal height | QR page modal overlay uses 1440×918 (taller than standard 1440×800 used for Guidelines/List) |
