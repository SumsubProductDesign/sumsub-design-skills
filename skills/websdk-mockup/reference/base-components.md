# WebSDK Base Components — Component Catalog

> Library: Base components (`Gh2QlRTetoSQdlK9G1nDq4`)
> Full scan: 2026-04-28 via Plugin API.
> Deep property scan: 2026-04-28 (priority atoms — property keys, dimensions, text nodes).
> Import: `await figma.importComponentByKeyAsync(key)` for COMP; `await figma.importComponentSetByKeyAsync(key)` for SET.

---

## How to use property keys

```js
// Import + set properties
const set = await figma.importComponentSetByKeyAsync("KEY");
const inst = set.defaultVariant.createInstance();
inst.setProperties({
  "Label Name#2862:50": "Continue",    // TEXT property
  "Left Icon#2862:0": true,            // BOOLEAN property
  "Type": "Primary",                   // VARIANT property (no hash suffix)
  "State": "Default",
});

// ⚠️ Some text nodes are NOT exposed as component properties.
// Access them directly:
const labelNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
if (labelNode) {
  await figma.loadFontAsync(labelNode.fontName);
  labelNode.characters = "Email address";
}
```

---

## Alert

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Alert* / Basic` | SET | `c54b1f4609d1ac8db110f6b3633a95e4b77b0836` | 5 variants |
| `Alert / Banner` | SET | `493f7f1d7106d7a8252ce9afd45aed806913678e` | 5 variants. Same type set as Basic |

### `*Alert* / Basic` — Properties

**Dimensions:** 327×128px (all 5 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `Type` | VARIANT | `🔴 Danger` | `🔵 Info` / `⚪️ Neutral` / `🟢 Success` / `🟡 Warning` / `🔴 Danger` |
| `Title#70:1` | BOOLEAN | `true` | show/hide title line |
| `Icon#924:0` | BOOLEAN | `true` | show/hide icon |
| `Description#925:12` | BOOLEAN | `true` | show/hide description text |
| `Button#2412:0` | BOOLEAN | `true` | show/hide action button |
| `Title text#3571:6` | TEXT | `"Two steps require resubmission"` | title line text |
| ` Description text#3571:0` | TEXT | `"Let's fix them to complete verification"` | ⚠️ note leading space in key |

```js
const alertSet = await figma.importComponentSetByKeyAsync("c54b1f4609d1ac8db110f6b3633a95e4b77b0836");
const alert = alertSet.defaultVariant.createInstance();
alert.setProperties({
  "Type": "🔴 Danger",
  "Title text#3571:6": "Document verification failed",
  " Description text#3571:0": "Please resubmit your ID photo",
  "Button#2412:0": false,
});
```

---

## Button

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Button* / Basic` | SET | `5e6bd44e70142ccf9cc266ccffe56292ecbc7029` | 80 variants |
| `*Button* / Camera / Action` | SET | `ce58b2bd470e24ed0ffd987360a676cd98bd0aab` | 15 variants. Camera UI actions |
| `*Button* / Camera / Additional` | SET | `7550b4cf1ecaec8a82d4d3d73088f49e9ab42718` | 20 variants. Additional camera controls |
| `*Button* / Camera / End Call` | SET | `be7be790ba2f7c255cf3b98b0266f2303e91a935` | 8 variants. End/close camera session |
| `*Button* / Sumsub ID` | SET | `205e7bde95fefa912cc3183ce929d015ba3e52b2` | 4 variants. Sumsub ID branded button |
| `Toolbar / Top Bar` | SET | `87aeeca5403429c521a1e89a154d23ac113ee551` | 3 variants. Size-based (Small/Medium/Large) |
| `***Toolbar / Top Bar / Mobile` | SET | `254391124180127f6e7f06364d0e45d1aa8aa55c` | 12 variants. Type × Stroke |

### `*Button* / Basic` — Properties

**Dimensions:** Basic 327×48px; Icon Only 48×48px; Link 72×24px

| Property key | Type | Default | Options |
|---|---|---|---|
| `Content` | VARIANT | `Basic` | `Basic` / `Icon Only` |
| `Type` | VARIANT | `Primary` | `Primary` / `Secondary` / `Plain` / `Link` |
| `State` | VARIANT | `Default` | `Default` / `Hover` / `Focused` / `Loading` / `Disabled` |
| `Status` | VARIANT | `🔵 Default` | `🔵 Default` / `🔴 Danger` |
| `Label Name#2862:50` | TEXT | `"Continue"` | button label text |
| `Left Icon#2862:0` | BOOLEAN | `false` | show icon left of label |
| `↪ Left Icon Name#1031:0` | INSTANCE_SWAP | — | swap left icon component |

```js
const btnSet = await figma.importComponentSetByKeyAsync("5e6bd44e70142ccf9cc266ccffe56292ecbc7029");
const btn = btnSet.defaultVariant.createInstance();
btn.setProperties({
  "Type": "Primary",
  "State": "Default",
  "Status": "🔵 Default",
  "Label Name#2862:50": "Continue",
  "Left Icon#2862:0": false,
});
```

### `Toolbar / Top Bar` — Properties

**Dimensions:** Small 380×60px; Medium 718×68px; Large 1392×68px

| Property key | Type | Default | Options |
|---|---|---|---|
| `Size` | VARIANT | `Large` | `Large` / `Medium` / `Small` |
| `Back Button#2383:0` | BOOLEAN | `true` | show back button |
| `Language#3162:81` | BOOLEAN | `true` | show language selector |
| `Progress bar#11064:0` | BOOLEAN | `true` | show progress bar |
| `Mobile#11064:13` | BOOLEAN | `true` | mobile mode |
| `Sumsub ID#11064:39` | BOOLEAN | `true` | show Sumsub ID branding |

> Use `Size=Small` for mobile (390px), `Size=Large` for desktop (480px+). `***Toolbar / Top Bar / Mobile` is an alternative with explicit `Type` and `Stroke` props.

### `***Toolbar / Top Bar / Mobile` — Properties

**Dimensions:** 375×68px (all 12 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `Type` | VARIANT | — | `Steps` / `Status` / `Camera Widget` / `Liveness` / `Modal Window` / `Blank Navigation` |
| `Stroke` | VARIANT | — | `True` / `False` |
| `Language Select#272:0` | BOOLEAN | `true` | show language selector |
| `Back Button#272:7` | BOOLEAN | `true` | show back button |

```js
const mobileBar = await figma.importComponentSetByKeyAsync("254391124180127f6e7f06364d0e45d1aa8aa55c");
const bar = mobileBar.defaultVariant.createInstance();
bar.setProperties({
  "Type": "Steps",
  "Stroke": "False",
  "Back Button#272:7": true,
  "Language Select#272:0": false,
});
```

---

## Booleans (Checkboxes, Radios, Toggles)

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Boolean* / Item` | SET | `f0177767e604f9555bcb77d590095770e7932505` | 36 variants |
| `*Boolean* / Group` | COMP | `0b60ce89cb0f775b41551015a2a25d8f1aac13ea` | Group container |
| `*Checkbox* / Item` | SET | `657542fd23bd7347addab009c1fc2c40ef142fb8` | 24 variants |
| `*Radiobutton* / Item` | SET | `6140c29595496902ba56a8f95a7996c656d2f95b` | 16 variants |
| `*Toggle* / Item` | SET | `7a969cc57bfce690688396fcf7f837795294b78c` | 8 variants |
| `*Radiobutton* / Expanded` | SET | `92e63aea703e9b2e707dd2dac92d0156e90630f5` | 5 variants. Expanded radio with description |

### `*Boolean* / Item` — Properties (full list item with icon/flag/tag)

**Dimensions:** 327×44px (all 36 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `Type` | VARIANT | `Radio button` | `Radio button` / `Checkbox` / `List select` |
| `State` | VARIANT | `Checked` | `Default` / `Hover \| Default` / `Focused` / `Checked` / `Hover \| Checked` / `Disabled` |
| `Danger` | VARIANT | `False` | `True` / `False` |
| `Icon#283:0` | BOOLEAN | `false` | show icon left |
| `↪ Icon Name#283:10` | INSTANCE_SWAP | — | swap icon component |
| `Flag#1082:3` | BOOLEAN | `false` | show country flag |
| `↪ Flag Name#1082:16` | INSTANCE_SWAP | — | swap flag component |
| `Tag#1208:0` | BOOLEAN | `true` | show tag/label text |
| `Waiting Time#2155:1` | BOOLEAN | `false` | show waiting time info |
| `Document Tag#8670:0` | BOOLEAN | `false` | show document tag |
| `Decription#12221:0` | TEXT | `"Text"` | ⚠️ typo in name ("Decription") — item label text |

```js
const boolSet = await figma.importComponentSetByKeyAsync("f0177767e604f9555bcb77d590095770e7932505");
const item = boolSet.defaultVariant.createInstance();
item.setProperties({
  "Type": "Radio button",
  "State": "Default",
  "Danger": "False",
  "Tag#1208:0": true,
  "Decription#12221:0": "Passport",   // ⚠️ typo intentional — matches Figma
});
```

### `*Checkbox* / Item` — Properties (standalone checkbox control)

**Dimensions:** 24×24px

| Property key | Type | Default | Options |
|---|---|---|---|
| `Status` | VARIANT | `Checked` | `Default` / `Indeterminate` / `Checked` |
| `State` | VARIANT | `Default` | `Default` / `Hover` / `Focused` / `Disabled` |
| `Danger` | VARIANT | `False` | `True` / `False` |
| `Label#4804:8` | BOOLEAN | `false` | show label (rarely used standalone) |

### `*Radiobutton* / Item` — Properties

**Dimensions:** 24×24px

| Property key | Type | Default | Options |
|---|---|---|---|
| `Checked` | VARIANT | `True` | `True` / `False` |
| `State` | VARIANT | `Default` | `Default` / `Hover` / `Focused` / `Disabled` |
| `Danger` | VARIANT | `False` | `False` / `True` |
| `Label#3707:81` | BOOLEAN | `false` | — |

### `*Toggle* / Item` — Properties

**Dimensions:** 34×24px

| Property key | Type | Default | Options |
|---|---|---|---|
| `Checked` | VARIANT | `True` | `True` / `False` |
| `State` | VARIANT | `Default` | `Default` / `Hover` / `Pressed` / `Disabled` |
| `Label#3707:81` | BOOLEAN | `false` | — |

---

## Caption

| Component | Type | Key | Variants |
|---|---|---|---|
| `Caption` | SET | `c81d580e891be4f05b24b13e78734827d3f67284` | 2 variants |

**Dimensions:** 141×20px

| Property key | Type | Default | Options |
|---|---|---|---|
| `Danger` | VARIANT | `False` | `True` / `False` |

> Text content is set directly on the internal text node (not exposed as component property):
> ```js
> const capNode = inst.findOne(n => n.type === "TEXT");
> await figma.loadFontAsync(capNode.fontName);
> capNode.characters = "Enter a valid email address";
> ```

---

## Card

| Component | Type | Key | Variants |
|---|---|---|---|
| `Card` | SET | `6aa12f9b37b2b28bf21b6d49b253e1d97e9dd4d1` | 1 variant. `State` prop, `Slot` |

---

## Carousel

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Carousel* / Group` | COMP | `8bef35faf6c7d9fab72684541f5349331972be23` | — |

---

## Counter

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Counter* / Basic` | SET | `c23ba161a29a0e0bed943712dd9c13f576c4d31c` | 2 variants |

**Dimensions:** 24×24px (a circular step counter control)

| Property key | Type | Default | Options |
|---|---|---|---|
| `State` | VARIANT | `Default` | `Default` / `Disabled` |

---

## DatePicker

| Component | Type | Key | Variants |
|---|---|---|---|
| `DatePicker / Input / Basic` | SET | `7e64e6b74d842a61d6bae1c451ca0434ef401191` | 24 variants. `Type`/`State`/`Status` |
| `*DatePicker* / Menu` | SET | `adbd81115e12874425eac60d5d00c2d28bdb763c` | 4 variants. `Type`/`Range` |
| `*DatePicker* / Form` | SET | `eb9b97f0ce84deeb7d2464490760565e6114f63f` | 20 variants |

---

## Input

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Input* / Base / Form` | SET | `66928868fd2b0e855b65ea91b97639ad99dda89d` | 12 variants |
| `*Input* / Textarea / Form` | SET | `064b6c6240c82f6d50bece7acf394c44c794411d` | 12 variants |
| `*Input* / Phone Number / Form` | SET | `9531f4e7774e1b41008cc15437c70f7f07960259` | 12 variants. Phone + country code |

### `*Input* / Base / Form` — Properties

**Dimensions:** 327×106px (all 12 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `State` | VARIANT | `Filled` | `Default` / `Hover \| Default` / `Focused` / `Filled` / `Hover \| Filled` / `Disabled` |
| `Status` | VARIANT | `Default` | `Default` / `Danger` |
| `Title#2905:77` | BOOLEAN | `true` | show field label above input |
| `Caption#689:162` | BOOLEAN | `true` | show caption/hint below input |
| `↪ Caption Text#689:167` | TEXT | `"Hint to the input field"` | hint text |
| `↪ Placeholder Text#1092:0` | TEXT | `"United Kingdom"` | input value or placeholder |
| `Icon Left#690:177` | BOOLEAN | `false` | show left icon |
| `↪ Icon Left Name#713:5` | INSTANCE_SWAP | — | swap left icon |
| `Flag#713:0` | BOOLEAN | `false` | show country flag |
| `↪ Flag Name#725:9` | INSTANCE_SWAP | — | swap flag |
| `Icon Right#5058:0` | BOOLEAN | `true` | show right icon (clear/chevron) |
| `↪ Icon Right Name#5058:11` | INSTANCE_SWAP | — | swap right icon |

> ⚠️ **Label text not exposed.** The field label (e.g. "Email", "First Name") lives in an internal text node named `"Title"`. Set it directly:
> ```js
> const labelNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
> if (labelNode) { await figma.loadFontAsync(labelNode.fontName); labelNode.characters = "Email"; }
> ```

```js
const inputSet = await figma.importComponentSetByKeyAsync("66928868fd2b0e855b65ea91b97639ad99dda89d");
const input = inputSet.defaultVariant.createInstance();
input.setProperties({
  "State": "Filled",
  "Status": "Default",
  "Title#2905:77": true,
  "↪ Placeholder Text#1092:0": "john@example.com",
  "Caption#689:162": false,
  "Icon Left#690:177": false,
  "Flag#713:0": false,
  "Icon Right#5058:0": false,
});
// Set the label text directly
const labelNode = input.findOne(n => n.type === "TEXT" && n.name === "Title");
if (labelNode) {
  await figma.loadFontAsync(labelNode.fontName);
  labelNode.characters = "Email";
}
```

---

## Label

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Label* / Vertical` | COMP | `bd47c1e57abcc893a0641c8f2d716ebecfd4e78f` | — |

---

## Message

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Message* / Basic` | SET | `877563c028f0d6ad2fb1d1d0b029f3e204deddd4` | 5 variants. `Type`: Info/Success/Warning/Error/Default. Props: Icon/Closable/Title/Button |

> Note: original component has typo `*Meesage*` in Figma — the key above is correct.

---

## Modal

| Component | Type | Key | Dimensions |
|---|---|---|---|
| `Modal / Full / Desktop` | COMP | `61c1659962a2ee584b7750cd6c588bdf8345599e` | 726×685px |
| `Modal / Full / Mobile` | COMP | `80881e81eb92ac7328d868a7d2eefe7a5066aff6` | Mobile modal |
| `Modal / Bottom sheet / Desktop` | COMP | `68af3e4c760824b6bb685343f0646dff158161e2` | Bottom sheet, desktop |
| `Modal / Bottom sheet / Mobile` | COMP | `f9d6419a30da88ecbfad566d3fca9e189498f220` | Bottom sheet, mobile |
| `Modal / Confirmation / Desktop` | COMP | `7eab080db1db93a9b6339b70310ea2c5f0eb2473` | Confirmation dialog, desktop |
| `Modal / Confirmation / Mobile` | COMP | `6d7f4748f4ba15182002f1c3d296ca0a8cd616c2` | Confirmation dialog, mobile |

### `Modal / Full / Desktop` — Slot properties

| Property key | Description |
|---|---|
| `Slot header#12257:2` | Header content slot |
| `Scroll#12256:1` | Enable scroll in body |
| `Slot#12822:0` | Main body content slot |
| `Bottom bar#11111:6` | Show/hide bottom action bar |

---

## Multiselect

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Multiselect / Basic*` | COMP | `0942014d7630435dc1d2e1d0c718ac0bc56e80ce` | — |

---

## Pagination

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Pagination*` | SET | `c4aff6b85d55b99ce5f5326800babcce785ff62f` | 8 variants. `Type`/`Size` |

---

## Progress

| Component | Type | Key | Variants |
|---|---|---|---|
| `Progress / Line` | SET | `fa708541c447382c19460be971467f7e85c3ba5a` | 4 variants |
| `Progress / Circle / Large` | SET | `a9a02076c5c8df9b1c8efa513249df682607335c` | 5 variants |
| `Progress bar` | SET | `ad81f462e3cd7f99e1128f7265757e9d13864d5b` | 2 variants |

### `Progress / Line` — Properties

**Dimensions:** 65×4px (a single step segment)

| Property key | Type | Default | Options |
|---|---|---|---|
| `Status` | VARIANT | `Wait` | `Finished` / `Half progress` / `Wait` / `Start` |

> Used inside the `Steps` organism to show per-step progress. Assemble multiple `Progress / Line` instances in a row to form the full progress bar.

---

## Scroll

| Component | Type | Key | Variants |
|---|---|---|---|
| `Scroll` | COMP | `f6383635fd045cfb486946fab7a272645eb5af11` | — |

---

## Select

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Select* / Default` | SET | `be26fa72bf749d841500104f7dfb4cbb31ee9478` | 20 variants |
| `*Select* / Inline` | SET | `40a63ae55ec9e779470ba7452914ab7b14bc42e9` | 2 variants. `State` |
| `Select / Menu` | SET | `6613315391650d15a326a055c91bc9006a92dc09` | 2 variants. `Search`/`State` |

### `*Select* / Default` — Properties

**Dimensions:** 327×106px (all 20 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `State` | VARIANT | `Default` | `Default` / `Hover` / `Focused` / `Pressed` / `Disabled` |
| `Filled` | VARIANT | `True` | `True` / `False` |
| `Status` | VARIANT | `Default` | `Default` / `Danger` |
| `Title#2905:103` | BOOLEAN | `true` | show field label above select |
| `Caption#689:134` | BOOLEAN | `true` | show caption/hint below |
| `Flag#689:17` | BOOLEAN | `true` | show country flag in value |
| `Big icon#7940:0` | BOOLEAN | `false` | show large icon variant |

> ⚠️ **Label and value texts not exposed.** Both the field label ("Label") and selected value ("United State of America") live in internal text nodes and must be set directly:
> ```js
> // Set label
> const titleNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
> if (titleNode) { await figma.loadFontAsync(titleNode.fontName); titleNode.characters = "Country"; }
> // Set selected value
> const valNode = inst.findOne(n => n.type === "TEXT" && n.name === "Placeholder");
> if (valNode) { await figma.loadFontAsync(valNode.fontName); valNode.characters = "Germany"; }
> ```

```js
const selSet = await figma.importComponentSetByKeyAsync("be26fa72bf749d841500104f7dfb4cbb31ee9478");
const sel = selSet.defaultVariant.createInstance();
sel.setProperties({
  "State": "Default",
  "Filled": "True",
  "Status": "Default",
  "Title#2905:103": true,
  "Caption#689:134": false,
  "Flag#689:17": true,
});
```

---

## Skeleton

| Component | Type | Key | Variants |
|---|---|---|---|
| `Skeleton / Item` | COMP | `df0f12bf1e39742522b23f6c5aa058b5c6d120ea` | — |

---

## Step

| Component | Type | Key | Variants |
|---|---|---|---|
| `Steps` | SET | `98ec2ed715721e62d5a9d1c22c558123d2d0dde9` | 4 variants |

### `Steps` — Properties

**Dimensions:** Collapsed=True: 506×48–70px; Collapsed=False: 506×230px

| Property key | Type | Default | Options |
|---|---|---|---|
| `State` | VARIANT | `⚪️ Default` | `⚪️ Default` / `🟢 Submitted` / `🟡 Resubmit` |
| `Collapsed` | VARIANT | `True` | `True` / `False` |
| `Tag#1345:2` | BOOLEAN | `true` | show tag/badge |
| `Description#1345:6` | BOOLEAN | `true` | show description text |
| `Chevron#1345:10` | BOOLEAN | `true` | show chevron |

**Variant dimensions:**

| Variant | Width | Height |
|---|---|---|
| `State=🟡 Resubmit, Collapsed=True` | 506 | 70 |
| `State=🟢 Submitted, Collapsed=True` | 506 | 56 |
| `State=⚪️ Default, Collapsed=True` | 506 | 48 |
| `State=🟡 Resubmit, Collapsed=False` | 506 | 230 |

```js
const stepsSet = await figma.importComponentSetByKeyAsync("98ec2ed715721e62d5a9d1c22c558123d2d0dde9");
const step = stepsSet.defaultVariant.createInstance();
step.setProperties({
  "State": "⚪️ Default",
  "Collapsed": "True",
  "Tag#1345:2": true,
  "Description#1345:6": true,
  "Chevron#1345:10": true,
});
```

---

## Tab

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Tab Button* / Group` | COMP | `464cffe6ed7ebf22c2015a6279c3512dd5f8e072` | — |

---

## Tag

| Component | Type | Key | Variants |
|---|---|---|---|
| `Tag / Status` | SET | `d26419d67c945caccc56671a00b58f81f3d283eb` | 6 variants |
| `Tag / Document` | SET | `c2de61e673e1189c80472c59e8740a17b61504f7` | 5 variants. `Type` |

### `Tag / Status` — Properties

**Dimensions:** h=24px; width varies by content

| Property key | Type | Default | Options |
|---|---|---|---|
| `Type` | VARIANT | `🟤 Disabled` | `⚪️ Default` / `🔵 Info` / `🟢 Success` / `🟡 Warning` / `🔴 Danger` / `🟤 Disabled` |
| `Closable#4241:14` | BOOLEAN | `false` | show close ×button |
| `Icon Left#7718:0` | BOOLEAN | `false` | show icon |
| `↪ Icon Name#7718:7` | INSTANCE_SWAP | — | swap icon |

```js
const tagSet = await figma.importComponentSetByKeyAsync("d26419d67c945caccc56671a00b58f81f3d283eb");
const tag = tagSet.defaultVariant.createInstance();
tag.setProperties({
  "Type": "🟢 Success",
  "Closable#4241:14": false,
  "Icon Left#7718:0": false,
});
```

---

## Timer

| Component | Type | Key | Variants |
|---|---|---|---|
| `Timer / Video Recording` | SET | `392142dce67882f45e44139235a96ff5a24f870e` | 2 variants. `Active` |

---

## Title

| Component | Type | Key | Variants |
|---|---|---|---|
| `Title` | SET | `a4f74154e6c950755b1472a64e5344063da0365c` | 3 variants |

### `Title` — Properties

**Dimensions:** 327×128px (all 3 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `Alignment` | VARIANT | `Left` | `Left` / `Center` / `Right` |
| `Subtitile#6907:1` | BOOLEAN | `true` | ⚠️ typo in Figma name — show/hide subtitle |
| `↪ Subtitle Text#6907:0` | TEXT | `"Select country and type of your document"` | subtitle text |

> ⚠️ **Main title text not exposed.** The heading ("Select type and issuing country of your identity document") lives in an internal text node named `"Title"` and must be set directly:
> ```js
> const titleNode = inst.findOne(n => n.type === "TEXT" && n.name === "Title");
> if (titleNode) { await figma.loadFontAsync(titleNode.fontName); titleNode.characters = "Upload your ID"; }
> ```

```js
const titleSet = await figma.importComponentSetByKeyAsync("a4f74154e6c950755b1472a64e5344063da0365c");
const title = titleSet.defaultVariant.createInstance();
title.setProperties({
  "Alignment": "Center",
  "Subtitile#6907:1": true,          // ⚠️ typo in key
  "↪ Subtitle Text#6907:0": "Choose the type of document to upload",
});
// Set main heading directly
const headNode = title.findOne(n => n.type === "TEXT" && n.name === "Title");
if (headNode) {
  await figma.loadFontAsync(headNode.fontName);
  headNode.characters = "Document type";
}
```

---

## Tips

| Component | Type | Key | Variants |
|---|---|---|---|
| `Tips / Item` | SET | `d608dc21fe4c73d3cbf399f0d9d2b1e1732b1c83` | 4 variants |
| `Tips / Group` | COMP | `84e6fa2897e99d7971426cedecbc1bd2b7d8113b` | — |

---

## Verification Status

| Component | Type | Key | Variants |
|---|---|---|---|
| `Verification status` | SET | `d2aa58113a56f7e2462e81b2d7f2ac42f224a414` | 5 variants |

### Properties

**Dimensions:** 327×32px (all 5 variants)

| Property key | Type | Default | Options |
|---|---|---|---|
| `Status` | VARIANT | `Success` | `Success` / `Error` / `Loading` / `Waiting` / `Disabled` |

```js
const vsSet = await figma.importComponentSetByKeyAsync("d2aa58113a56f7e2462e81b2d7f2ac42f224a414");
const vs = vsSet.defaultVariant.createInstance();
vs.setProperties({ "Status": "Loading" });
```

---

## Upload

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Upload* / Drag'n'Drop` | SET | `cae7589fcd4a65bbe671a49e9337110bb2d7a93e` | 18 variants. `Status`/`State` |
| `*Upload* / Preview Surface` | SET | `73d7e98a2208901418601319e1dfbfba9200dda7` | 24 variants. `Status`/`Type`/`State` |

---

## Camera Wizard

| Component | Type | Key | Variants |
|---|---|---|---|
| `Camera Wizard` | SET | `8a5729a956a3d8827e1b85e012fcb1dbf71de72d` | 3 variants. `Type` |

---

## Illustrations

| Component | Type | Key | Variants |
|---|---|---|---|
| `Document` | SET | `a1caaeb0d67c00aadb214458c3a11679ab8e85e5` | 10 variants |
| `Guidelines` | SET | `c11a704d834bdf3301a12925d76a89b20e01f879` | 10 variants |
| `Selfie+Liveness` | SET | `60c09c97683b09275e88ce17d489b847d180251c` | 4 variants |
| `Statuses` | SET | `673f61a11c271359ce5a9e2df887c800cd0f7757` | 7 variants |
| `Reusable KYC / Logos` | SET | `9545b569a5b49740c9f37f65767919677247b50a` | 2 variants |

---

## General / Layout

| Component | Type | Key | Variants |
|---|---|---|---|
| `Divider` | SET | `5c96766f59319f5520abf50cdf0e48ecff09f1f6` | 2 variants. `Type` |
| `Company Logo` | SET | `b8c5e38f8f6c28769451058f18b8da3dbd6c919d` | 2 variants. `Type` |
| `Sumsub ID / Logo` | SET | `b371b0557ae51867ff30a383449679d982c278bd` | 3 variants. `Size`/`B&W` |

---

## Sumsub ID — Atoms

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Avatar*` | SET | `0a247d7240fd5d908b39777d58d78265f763e1b6` | 4 variants. `Photo`/`State` |
| `*Documents Card*` | SET | `4a33e25817866714aebb9e34d2d35978c82d90f8` | 2 variants. `Collapsed` (bool). Has `SLOT` prop |
| `Documents Card / Item` | SET | `11063957eb879d1439b63599f9128b7d49a880c8` | 6 variants. `State`/`Hover` |
| `*Sidebar* / Desktop` | SET | `685695d849b0c1029f5ece1f209935b0a7ff935d` | 2 variants. `Menu` (SLOT SWAP)/`State` |
| `*Sidebar* / Mobile` | COMP | `6c9a96f5d09ffbc765a465671961c842cfbe8621` | — |
| `Sidebar / Menu / Item` | SET | `41be3c4a93562019815e1636cbd99fde1753a5db` | 3 variants. `Instance` (SWAP)/`State` |
| `Settings / Item / Desktop` | SET | `f0dc9a0e7bea0224e5470c3fa704d6879c448687` | 3 variants |
| `Settings / Item / Mobile` | SET | `032583a21c4504a3fe7cfdfafa47ecbb53ea2a37` | 2 variants |
| `History / List / Item / Desktop` | SET | `69109a287fbcbfe35d8ba748d08e368aa8a70f74` | 6 variants |
| `History / List / Item / Mobile` | SET | `fc54e79a498f19303dce0198b5becd6cc3ad8088` | 3 variants |
| `Partners / Card / Desktop` | SET | `b856464b4400229dc317c4d16424b36e5580234f` | 4 variants |
| `Partners / Card / Mobile` | SET | `4905fdf644eeb06bcbd3457154a4c43d7f0eee4e` | 2 variants |
| `Sumsub ID button` | SET | `03c4f81ba20770b4fd7056d143a6632a13c7e687` | 6 variants |
| `Promo` | COMP | `169628a8ca8b19babedc15acc1a23b7a547ec091` | — |

---

## Known Gotchas

| Issue | Details |
|---|---|
| `Title` heading text not a prop | Main title text in `Title` component must be set via `inst.findOne(n => n.name === "Title" && n.type === "TEXT")` |
| Input/Select label not a prop | Field label text ("Label") must be set via the `"Title"` internal text node |
| Select value not a prop | Selected value text ("United State of America") is in text node named `"Placeholder"` |
| `Subtitile#6907:1` typo | Figma component has this typo — use this exact key string |
| `Decription#12221:0` typo | `*Boolean* / Item` description text — typo is intentional, matches Figma |
| ` Description text#3571:0` leading space | `*Alert* / Basic` description — property key has a leading space |
| `***Toolbar / Top Bar / Desktop` key invalid | Key `495969debf3bd2cabab7b4ba95b7907967b9b12f` not importable; use `Toolbar / Top Bar` (`87aeeca5403429c521a1e89a154d23ac113ee551`) with `Size=Large` for desktop (1392×68px) |
| Type variant emojis required | `Alert Type` = `"🔴 Danger"`, `Steps State` = `"⚪️ Default"`, `Tag/Status Type` = `"🟢 Success"` — include emoji prefix |
