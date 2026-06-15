# KYB WebSDK — components, structure, canonical assembly

> Source file: **`9ii3Ueqr01mbLS3SE6bsrJ`** (KYB | Light + Dark)
> Page with canonical screens: `🟡 Detailed UI/UX (Light)` (id `1:43`)
> Components page: `🧩 Components` (id `2:49`)
> Canonical "originals" reference section (Company search): `6980:643402`
> Last verified: 2026-06-15 (live inspection of canonical + test build)

---

## ✅ KYB **DOES** use the standard WebSDK `Widget` shell (corrected v3.171)

> 🔴 **This reverses the pre-v3.171 claim that "KYB does NOT use the Widget shell."** That claim was wrong and produced broken footers/buttons (see "What v3.170 got wrong" below). Live inspection of the canonical `6980:643402` proved every KYB desktop frame is built on the **same `Widget` shell as KYC**.

| | KYC WebSDK | **KYB WebSDK** |
|---|---|---|
| Outer shell | `Widget` set `232e8d4d5beed4ad18da48386dab7a640ac0ca45`, `Type=Content` | **SAME** — `Widget` `Type=Content` (variant key `1ee5c92aaeccd3fd0637757e11ff70b2ac615a78`, `remote=true`, importable by key) |
| Visible header | Widget's own `Toolbar / Top Bar` (718, `Size=Medium`) | **SAME** — Widget's own 718-wide Top Bar |
| Visible footer | Widget's own `Bottom Bar` (key `5d6dd1a8374252d06a2ed8e359c904968a103128`) | **SAME** — Widget's own `Bottom Bar` `5d6dd1a8…` |
| Content slot | `Content ` SLOT → an organism (PoI/Welcome/…) | **`Slot` SLOT (718-wide) → a `Window / *` shell** (KYB-local) |
| What goes in the slot | organism | **`Window / Select company` etc.** — provides Title + form; its OWN internal bars stay HIDDEN |
| Slot name (drift!) | `"Content "` (trailing space) | **`"Slot"`** — different name; read the actual SLOT node, don't hardcode |

**The KYB-specific delta vs KYC is ONLY this:** the thing placed in the Widget's content slot is a **`Window / *` shell** (a KYB-local component that bundles Title + the step's form), instead of a bare organism. Everything else — the Widget shell, its 718 Top Bar, its `Bottom Bar` footer, the black `#20252c` Primary button — is identical to KYC and comes for free from `createInstance()`.

---

## 🔴 What v3.170 got wrong (do NOT repeat)

v3.170 built a **bare `Window / Select company` (512-wide)** and un-hid the Window's OWN internal `Toolbar / Top Bar` (512×56) + `Toolbar / Bottom Bar / Desktop` (512). That is the wrong composition:

| | v3.170 bare-Window (WRONG) | Canonical Widget shell (RIGHT) |
|---|---|---|
| Footer component | `Toolbar / Bottom Bar / Desktop` (Window-internal) | **`Bottom Bar` `5d6dd1a8…`** (Widget-level) |
| Primary button render | **#143cff (blue, "старая кнопка")** | **#20252c (black)** |
| Footer top treatment | different ("обводка не такая") | canonical |
| Header | Window-internal 512 Top Bar | Widget-level 718 Top Bar |

User feedback that exposed this (2026-06-15): *"хедер с футером появились (хоть и используется старая кнопка и обводка не такая, как в оригинале)"*.

**Rule:** NEVER un-hide a `Window / *` shell's internal Top Bar / Bottom Bar. Those exist for the rare bare-embed case. Always wrap the Window in the `Widget` shell; keep the Window's internal bars hidden. Use the Widget's NATIVE `Bottom Bar` button — relabel its TEXT in place; do not replace it.

---

## 🔵→⚫ Footer button color is LIBRARY-SYNC dependent (v3.172) — blue #143cff = stale library

The v3.171 retest (2026-06-15) shipped the correct Widget structure but the footer Primary button still rendered **#143cff (blue)** — the user's "старая кнопка". Deep variable trace found the real cause: **the file contains two `Color` variable collections** with the same variable key `ce42e223` but different collection instances:

| Collection instance | `…button/primary/default/background-normal` aliases to | Result |
|---|---|---|
| **Current / redesigned** `6c3bcce7…/10760:1373` | `semantic/background/neutral/normal` → `base/neutral/neutral-100` | **#20252c (dark)** ✅ |
| **Stale / pre-redesign** `6c3bcce7…/9943:5950` | `semantic/background/blue/normal` → `base/blue/blue-100` | **#143cff (blue)** ❌ |

This is the WebSDK **blue→black** redesign (same shift as Dashboard): primary was re-pointed from blue to neutral/dark. A **freshly-created** `Widget` `Type=Content` (built against the current library) yields the dark button for free; a build made when the editor's library cache is **stale** binds the old collection (`9943:5950`) and renders blue. Same component key (`b9917066`), same variant, same token NAME — only the collection instance differs.

**This is library staleness (audit 7.56 class), NOT a skill-logic bug.** The skill cannot choose the collection instance — it's set by the file/editor's library-sync state. Fix: in Figma, **Assets → Libraries → Update** the WebSDK/Base library, then rebuild → dark button.

**Audit rule (do NOT report from the nominal token):** read the primary button's ACTUAL rendered fill (`button.fills[0].color`). If it's **#143cff** (or `…/blue/normal` resolves in the bound collection), the build is on a **stale library** → report `STALE-LIBRARY: primary button #143cff, expected #20252c — update library + rebuild`, do NOT report `PASS / #20252c`. The v3.171 retest audit falsely claimed `primaryButton.bg=#20252c` by resolving the token NAME against the current collection while the node rendered blue — that masked the staleness.

---

## 🛑 HARD RULE — a KYB screen MUST be the `Widget` shell with visible header + footer

Every KYB desktop screen = `Widget` (`Type=Content`) with:
- the Widget's own `Toolbar / Top Bar` (718, `Size=Medium`) visible — back + Progress line + close
- the Widget's own `Bottom Bar` (`5d6dd1a8…`, 718) visible — black Primary button (+ optional Secondary)
- a KYB `Window / *` shell inserted into the Widget's `Slot` (718-wide content slot), with the Window's OWN internal bars left hidden
- the `Left bar` slot hidden (canonical hides the optional left promo panel; widget column is centered on the 1440 canvas)

A bare content-only Window (no Widget), or a Window with its internal bars un-hidden, is a defect.

---

## Canonical KYB screen anatomy (Widget shell)

```
Section frame (1440×960, fill #404040 when "made by Claude")
└── Widget INSTANCE (1440×900, Type=Content, set 232e8d4d, variant 1ee5c92a)
    ├── Left bar  (SLOT 400×900)                     ← HIDE (canonical hides the left promo panel)
    ├── Toolbar / Top Bar  (718×60, Size=Medium)     ← VISIBLE — header: back + Progress / Line + close
    │     (two more Top Bar size variants exist, hidden — leave them hidden)
    ├── widget column (718)
    │   ├── Image slot  (710×240)                     ← HIDDEN (no Steps illustration on company-search)
    │   ├── Slot  (718×722)  ← MAIN CONTENT SLOT      ← insertChild(0, kybWindow)
    │   │     └── Window / Select company (512×~698)  ← KYB-local shell; its internal Top/Bottom bars HIDDEN
    │   │           └── Content: Title + Select + Company search form
    │   └── Bottom Bar  (718×~72/102, key 5d6dd1a8)   ← VISIBLE — footer
    │         ├── Slot (506×144)  ← button area
    │         │     └── *Button* / Basic  Primary/Default  → #20252c BLACK (key b9917066…)
    │         └── (Consent / Carousel / pagination — toggled via props, usually off)
    └── Whitelabel Wrapper
```

**Slot naming drift:** the Widget's main content slot is named **`"Slot"`** (718-wide) in the KYB/redesigned Widget, not KYC's `"Content "`. Always pick it by reading SLOT nodes (largest non-`Image` slot), never by hardcoded name.

**`Window / Status page` is an exception** — a long scrollable summary (no Top/Bottom bars). It can sit directly without the Widget footer. Verify against the canonical `We're checking your data` section.

---

## ⚠️ KYB `Window / *` shells are LOCAL-UNPUBLISHED — NOT importable by key

`importComponentSetByKeyAsync("b0df76296cf872acbf76475d1497b3092003c4e9")` throws **"Component set not found"** even when building INSIDE the KYB file — these `Window / *` sets are local and unpublished. Fetch them from an existing canonical instance instead:

```js
// Get the local Window set via a canonical instance's main component → parent set
const anyWindowInstance = await figma.getNodeByIdAsync("0:887"); // a Window/Select company in "Default" frame
// NOTE: instance-internal ids (0:NNN) only resolve by traversing live parents, not getNodeByIdAsync.
// Robust path: find a canonical frame, locate the Window instance, read its main component's parent set:
const canonFrame = await figma.getNodeByIdAsync("6970:48507"); // "Default" frame in Company search
const winInst = canonFrame.findOne(n => n.type === "INSTANCE" && /^Window \/ Select company/.test(n.name));
const winMain = await winInst.getMainComponentAsync();
const winSet = winMain.parent; // COMPONENT_SET, local
const winVariant = winSet.children.find(c => /State=Company information/.test(c.name));
const kybWindow = winVariant.createInstance();
```

The Widget shell (`232e8d4d`) IS remote/published, so `importComponentSetByKeyAsync` works for it.

---

## KYB organism inventory (LOCAL to file `9ii3Ueqr01mbLS3SE6bsrJ`)

### Widget shell (shared with KYC — remote, importable by key)

| Component | Type | Key | Notes |
|---|---|---|---|
| `Widget` | SET | `232e8d4d5beed4ad18da48386dab7a640ac0ca45` | variant `Type=Content` = `1ee5c92aaeccd3fd0637757e11ff70b2ac615a78` |
| `Bottom Bar` (Widget footer) | COMP | `5d6dd1a8374252d06a2ed8e359c904968a103128` | inside Widget; black Primary button. Props: `Primary`, `Secondary`, `Link`, `Consent`, `Carousel`, `Total`/`Current` (pagination), `Warning`, `Slot` |
| `Toolbar / Top Bar ` | SET | `87aeeca5403429c521a1e89a154d23ac113ee551` | Widget header; visible variant `Size=Medium` = `4286563e15dbb5fe02d95cc87c76816dfc06e8fe` |
| `*Button* / Basic` | SET | `5e6bd44e70142ccf9cc266ccffe56292ecbc7029` | Primary/Default = `b9917066812164b1a763596ec1b1a06b7916521f` → **#20252c black** |

### Window-level shells (KYB-local — go INSIDE the Widget's `Slot`; NOT importable by key)

| Component | Type | Key (for reference; fetch via in-file lookup) | Variants |
|---|---|---|---|
| `Window / Select company` | SET | `b0df76296cf872acbf76475d1497b3092003c4e9` | 5: `State=Find your company / Empty / Basic / Company information / Too many` |
| `Window / Associated parties` | SET | `2cf035dfd2cf3138def72198e479b82dd2d6c6c7` | 5: `Type=Page / Add Individual / Edit Individual / Add Company / Edit Company` |
| `Window / Proof of address` | SET | `583837ca5462a97da36ed0f4956b2753cd7c9709` | 3: `Type=Add / Page / Edit` |
| `Window / Company documents` | COMP | `d1a4a6f1d3fd69cb328dc8710fe513a987eff205` | — |
| `Window / Status page` | COMP | `4e340431366075ea783bc5dab1c15c22e8a1c3f6` | — (no bars; scrollable summary) |

### Body-level organisms (sit inside a `Window / *`'s own Content)

| Component | Type | Key | Variants |
|---|---|---|---|
| `Associated parties` | SET | `ca8434186c31b0dfdf0b6d562bca90867f777d48` | 2: `State=Empty state / Filled` |
| `Proof of address` | SET | `4ad4516985aa3327d967b970f4156c469058b772` | 2: `State=Empty state / Filled` |
| `Select company / Company search` | SET | `bc8428cc30c98aae19b708e3dbba14c21e92bb15` | 1: `Property 1=Mode Default` |
| `Card Associated Party / Associated Parties screen` | SET | `98989981be8f04e4994376ed740a0e3f0ddfddf2` | 6: State × Type |
| `Card Associated Party / Status screen` | SET | `0b5174743e12cb234de457b173817db8aff60941` | 2: `Type=Individual / Company` |
| `Company document / Group` | SET | `7a756bb4314a2e5807f9a4fcb5aab94be2ea6ca3` | 3: `State=UnComplete / Complete / Warning` |
| `Group / Attached File` | SET | `7eba7fa09b44512b3211668907b0c5aa8c59d233` | 3: `State=Added / Loading / Error` |
| `Collapse Block` | SET | `483bdb247f974214e6bb7e074ee2070a19cab429` | 2: `Collapse=False / True` |
| `Associated parties / Group Associated parties` | SET | `ef94e701de1792eca3a6218cda667b3fcff48463` | 2: `Added beneficiaries=True / False` |

### Status-related organisms

| Component | Type | Key | Variants |
|---|---|---|---|
| `Status` | SET | `538c3c2cc17f14901afd1f92de4371d5e123b3d2` | 6 |
| `Status group` | SET | `70cdd6444ab5e526974fbf1676db15d02b6af460` | 12 |
| `Status Page / Status` | SET | `7569ae2494ecbfb7f883c07682f74b656c9f9e9d` | 5 |
| `Status Page / Step` | SET | `5e2cf1f4b1c54da7ea71178d95034bc101c90799` | 4 |

---

## Canonical assembly recipe (Widget shell)

```js
// 0. Pick a free canvas spot; build inside a Section (fill #404040, name ends "(made by Claude)").

// 1. Widget shell — remote, importable by key
const wSet = await figma.importComponentSetByKeyAsync("232e8d4d5beed4ad18da48386dab7a640ac0ca45");
const wVar = wSet.children.find(c => /Type=Content/.test(c.name));
const widget = wVar.createInstance();           // 1440×900 native
section.appendChild(widget);
// Fresh instance already ships: Top Bar 718 (Size=Medium) visible, Bottom Bar 5d6dd1a8 visible, BLACK button.

// 2. Hide the Left bar (canonical hides the left promo panel → centered 718 column)
const leftBar = widget.findOne(n => n.type === "SLOT" && /Left bar|left side/i.test(n.name));
if (leftBar) leftBar.visible = false;

// 3. Hide the Image slot (no Steps illustration on company-search style screens)
const imageSlot = widget.findOne(n => n.type === "SLOT" && /Image/i.test(n.name));
if (imageSlot) imageSlot.visible = false;

// 4. Get the KYB Window from a canonical instance (LOCAL set — NOT importable by key)
const canonFrame = await figma.getNodeByIdAsync("6970:48507"); // Company search "Default"
const winInst = canonFrame.findOne(n => n.type === "INSTANCE" && /^Window \/ Select company/.test(n.name));
const winSet = (await winInst.getMainComponentAsync()).parent;  // local COMPONENT_SET
const winVar = winSet.children.find(c => /State=Company information/.test(c.name)) || winSet.children[0];
const kybWindow = winVar.createInstance();

// 5. Insert the Window into the Widget's MAIN content slot (named "Slot", 718-wide — NOT "Content ")
const slots = widget.findAll(n => n.type === "SLOT");
const contentSlot = slots
  .filter(s => !/image|left bar/i.test(s.name) && Math.round(s.width) >= 600)
  .sort((a,b) => (b.width*b.height) - (a.width*a.height))[0];
contentSlot.insertChild(0, kybWindow);          // insertChild — NOT appendChild
try { kybWindow.layoutSizingHorizontal = "FILL"; } catch(e){}

// 6. Keep the Window's OWN internal Top/Bottom bars HIDDEN (default). Do NOT un-hide them.

// 7. Configure: Top Bar progress/step, Bottom Bar button label (set on the Widget's Bottom Bar, not the Window's)
const topBar = widget.findOne(n => n.type === "INSTANCE" && /Top Bar/i.test(n.name) && n.visible);
const bottomBar = widget.findOne(n => n.type === "INSTANCE" && n.name === "Bottom Bar" && n.visible);
// e.g. bottomBar.setProperties({ "Primary#…": true, "Secondary#…": false });
// override the button label TEXT inside bottomBar as needed.
```

---

## Library subscription requirement

The **Widget shell** is remote (WebSDK Organisms library) — subscribe `WebSDK UI Kit [Organisms]` (`8VpSRNe9ur7SBctw0JrtOE`) per main SKILL Rule #1.

The **`Window / *` KYB shells are local-unpublished** in `9ii3Ueqr01mbLS3SE6bsrJ` — you can only use them when building IN that file (fetch via in-file node lookup, step 4 above). To use them in another file, the KYB file owner must first **publish** them as a library and the consumer must **subscribe**. If you're not building in the KYB file and the Window sets aren't published, STOP and tell the user.

---

## KYB flow — canonical screen sequence (from General flow section `3719:142312`)

1. **Start screen** — intro disclaimer
2. **Company search** (5 states): Find your company / Empty / Basic / Company information / Too many
3. **Status page (overview)** — pending steps with Status group cards
4. **Company documents** — document upload
5. **Adding associated parties** — Add/Edit Individual, Add/Edit Company branches
6. **Proof of address** — Add / Edit / Page
7. **We're checking your data** — Processing / Pending review / Verification required / Resubmit requested / Verified

### Section node IDs in KYB file (Detailed UI/UX Light page `1:43`)

| Section name | Node ID |
|---|---|
| `General flow` | `3719:142312` |
| `Company search` | `5147:28502` |
| `Company search (originals reference)` | `6980:643402` |
| `Company documents` | `3105:80346` |
| `Adding associated parties` | `3105:95064` |
| `We're checking your data` | `3417:55129` |
| `PoA` | `6059:48423` |
| `Substitute beneficial owner` | `6886:50893` |
| `Only for designers` | `5599:87861` |

Each section has pre-built canonical FRAMEs (1440×960 with the centered Widget inside). **Always inspect the matching canonical FRAME before building** and mirror it node-by-node (Rule #4.4).

---

## When the user asks for a KYB screen

1. Confirm KYB context (KYB / company verification / associated parties / beneficial owner / company documents / PoA for KYB).
2. Open `9ii3Ueqr01mbLS3SE6bsrJ` and find the matching SECTION on the Detailed UI/UX (Light) page.
3. Inspect the canonical FRAME for the target step (Widget shell, 1440×960) node-by-node.
4. Build the **Widget shell** (recipe above) with the matching `Window / *` in its `Slot`; keep the Window's internal bars hidden.
5. Audit (read ACTUAL rendered values, never nominal token names):
   - Widget present (`Type=Content`); Top Bar 718 visible; `Bottom Bar` (5d6dd1a8) visible; `Window / *` inside the `Slot`; Window's internal bars hidden.
   - **`Left bar` SLOT hidden** (`leftBarSlot.visible === false`) and `Image slot` hidden — read the SLOT's `.visible`, not a frame named "left side". (v3.172: a build left the Left bar visible while the audit falsely reported it hidden.)
   - **Primary button: read `button.fills[0].color`.** Expect `#20252c` (dark). If `#143cff` (blue) → `STALE-LIBRARY` (the bound `Color` collection is the old `9943:5950` copy) → report "update library + rebuild", do NOT report PASS. Do NOT resolve the token NAME (it maps to dark in the current collection and masks the staleness).
   - No bare-Window, no un-hidden Window-internal bars, native footer button (not a replaced/injected `*Button*`).

**Do NOT mix KYB `Window / *` content with KYC organisms in the same slot.** The shell (Widget) is shared; the slot content differs by product.
