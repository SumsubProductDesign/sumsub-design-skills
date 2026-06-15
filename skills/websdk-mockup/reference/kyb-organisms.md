# KYB WebSDK — components, structure, canonical assembly

> Source file: **`9ii3Ueqr01mbLS3SE6bsrJ`** (KYB | Light + Dark)
> Page with canonical screens: `🟡 Detailed UI/UX (Light)` (id `1:43`)
> Components page: `🧩 Components` (id `2:49`)
> Last scan: 2026-04-30

---

## ⚠️ KYB does NOT use the standard WebSDK `Widget` shell

This is the most important fact about KYB. **KYB is architecturally different from KYC WebSDK.**

| | KYC WebSDK | **KYB WebSDK** |
|---|---|---|
| Shell | `Widget` set (`232e8d4d5beed4ad18da48386dab7a640ac0ca45`) — `Type=Content` / `Type=Camera` | **`Window / *` LOCAL components** in KYB file |
| Canvas frame | 1440×960 (desktop) / 375×812 (mobile) | **1440×1046** background frame, centered Window 512×800 inside |
| Library | `WebSDK UI Kit [Organisms]` (`8VpSRNe9ur7SBctw0JrtOE`) | KYB file (`9ii3Ueqr01mbLS3SE6bsrJ`) — must subscribe to its published library |
| Top Bar variant | `Size=Medium / Small / Large` (Widget master variants) | `Type=Steps, Stroke=False` (different variant axis) |
| Bottom Bar | Built into Widget chrome (visible/hidden via overrides) | **Separate `Toolbar / Bottom Bar / Desktop` instance** assembled directly |
| Content slot | `Content ` SLOT inside Widget (Type=Content) | Body FRAME inside Window with manually-assembled Title + organism + sub-slots |

**Practical consequence:** the `Rule #∞` "look at WebSDK Examples" workflow does NOT apply to KYB. KYB has its own canonical examples on the `🟡 Detailed UI/UX (Light)` page of the KYB file itself, organized by SECTION (Company search, Company documents, Adding associated parties, Proof of address, We're checking your data).

---

## 🛑 HARD RULE — a KYB screen MUST show the Top Bar (header/nav) AND Bottom Bar (footer/buttons), v3.170

**The biggest KYB mistake: shipping a bare content-only Window with no header and no footer.** Every `Window / *` shell variant ships its `Toolbar / Top Bar` and `Toolbar / Bottom Bar / Desktop` children as **`visible=false`** (the published variants hide them — e.g. `Window / Select company` State=Company information has BOTH hidden). If you just `createInstance()` the variant and stop, you get a window with only the form — no step navigation, no action buttons. That is a defect (user 2026-06-12: "у sdk обязательно должен быть хедер с навигацией и футер с кнопками, как в примере").

**After creating the Window instance, you MUST un-hide both bars:**
```js
const topBar = window.findOne(n => n.type === "INSTANCE" && /Top Bar/i.test(n.name));
const bottomBar = window.findOne(n => n.type === "INSTANCE" && /Bottom Bar/i.test(n.name));
if (topBar) topBar.visible = true;       // header: back + Progress line + close
if (bottomBar) bottomBar.visible = true; // footer: Primary (+ optional Secondary) buttons
```
(This is also why the natural height is 800 with bars vs 706 without — the agent that shipped 800 but left bars hidden had the right height and the wrong visibility.) The bars are child INSTANCES already present in the variant — you toggle `visible`, you don't insert them. Then override the Bottom Bar's button labels and the Top Bar's progress state as needed.

The alternative canonical composition (see `7032:56070`) wraps the Window in a `Widget` with Top Bar + Bottom Bar as **siblings** (718-wide) and the Window's own bars hidden. Either is valid — but the screen must end up WITH a visible header and footer. Never deliver the bare Window.

## Canonical KYB screen anatomy

```
Frame (1440×1046, no fill, centered Window inside)
└── Window (512×800, VERTICAL auto-layout, no padding)
    ├── Toolbar / Top Bar / Desktop INSTANCE        (512×56)   ← MUST be visible=true (variant default hides it)
    │     variant: Type=Steps, Stroke=False
    │     contains: back button + Progress / Line / Group + close button
    │
    ├── Body FRAME                                   (512×566 typical)
    │     VERTICAL auto-layout
    │     paddingT=24, paddingR=24, paddingB=0, paddingL=24, gap=32
    │     ├── Title INSTANCE (set a4f74154e6c950755b1472a64e5344063da0365c, Alignment=Left)
    │     │     Title TEXT + Subtitile TEXT
    │     └── Content FRAME
    │           ├── Slot (SLOT, optional — for inline messaging)
    │           └── Step organism instance (e.g. Select company / Company search)
    │
    └── Toolbar / Bottom Bar / Desktop INSTANCE     (512×178)   ← MUST be visible=true (variant default hides it)
          variant: Buttons=Two, Stroke=False (or Buttons=One)
          paddingT=16, paddingB=24
          ├── Content (gap=16, paddingL=16, paddingR=16)
          │     ├── Consents FRAME (optional, often hidden)
          │     ├── *Checkbox* / Item (optional, often hidden)
          │     └── Buttons (Primary disabled by default + optional Secondary)
          ├── Whitelabel Wrapper
          └── Rectangle 15226 (1px stroke, hidden by default)
```

**Note:** Window / Status page is an exception — it's a long scrollable summary view (512×1712) without Top/Bottom bars, just a Content FRAME.

---

## KYB organism inventory (LOCAL to file `9ii3Ueqr01mbLS3SE6bsrJ`)

### Window-level shells (full-screen widgets)

| Component | Type | Key | Variants |
|---|---|---|---|
| `Window / Select company` | SET | `b0df76296cf872acbf76475d1497b3092003c4e9` | 5: `State=Find your company / Empty / Basic / Company information / Too many` |
| `Window / Associated parties` | SET | `2cf035dfd2cf3138def72198e479b82dd2d6c6c7` | 5: `Type=Page / Add Individual / Edit Individual / Add Company / Edit Company` |
| `Window / Proof of address` | SET | `583837ca5462a97da36ed0f4956b2753cd7c9709` | 3: `Type=Add / Page / Edit` |
| `Window / Company documents` | COMP | `d1a4a6f1d3fd69cb328dc8710fe513a987eff205` | — |
| `Window / Status page` | COMP | `4e340431366075ea783bc5dab1c15c22e8a1c3f6` | — |

### Body-level organisms (sit inside Window's Body)

| Component | Type | Key | Variants |
|---|---|---|---|
| `Associated parties` | SET | `ca8434186c31b0dfdf0b6d562bca90867f777d48` | 2: `State=Empty state / Filled` |
| `Proof of address` | SET | `4ad4516985aa3327d967b970f4156c469058b772` | 2: `State=Empty state / Filled` |
| `Select company / Company search` | SET | `bc8428cc30c98aae19b708e3dbba14c21e92bb15` | 1: `Property 1=Mode Default` |
| `Card Associated Party / Associated Parties screen` | SET | `98989981be8f04e4994376ed740a0e3f0ddfddf2` | 6: State × Type (Default/Empty/Error × Individual/Company) |
| `Card Associated Party / Status screen` | SET | `0b5174743e12cb234de457b173817db8aff60941` | 2: `Type=Individual / Company` |
| `Company document / Group` | SET | `7a756bb4314a2e5807f9a4fcb5aab94be2ea6ca3` | 3: `State=UnComplete / Complete / Warning` |
| `Group / Attached File` | SET | `7eba7fa09b44512b3211668907b0c5aa8c59d233` | 3: `State=Added / Loading / Error` |
| `Collapse Block` | SET | `483bdb247f974214e6bb7e074ee2070a19cab429` | 2: `Collapse=False / True` |
| `Associated parties / Group Associated parties` | SET | `ef94e701de1792eca3a6218cda667b3fcff48463` | 2: `Added beneficiaries=True / False` |

### Status-related organisms

| Component | Type | Key | Variants |
|---|---|---|---|
| `Status` | SET | `538c3c2cc17f14901afd1f92de4371d5e123b3d2` | 6: `Type=Resubmission requested / Verification required / Verification is not required / Pending review / Under review / Verified` |
| `Status group` | SET | `70cdd6444ab5e526974fbf1676db15d02b6af460` | 12: 6× Property 1 × Open=Open/Close (collapsible status group) |
| `Status Page / Status` | SET | `7569ae2494ecbfb7f883c07682f74b656c9f9e9d` | 5: `Status=Resubmit requested / Verification requested / Pending review / Processing / Verified` |
| `Status Page / Step` | SET | `5e2cf1f4b1c54da7ea71178d95034bc101c90799` | 4: `Step=Processing / Verified / Resubmit requested / Verification required` |

---

## KYB flow — canonical screen sequence (from General flow section `3719:142312`)

The General flow section has 88 frames showing the complete user journey. The key step types (in order):

1. **Start screen** — intro disclaimer
2. **Company search** (5 states):
   - Find your company (search field, no results yet)
   - Empty (no matches)
   - Basic (company list)
   - Company information (selected company details preview)
   - Too many (overflow state)
3. **Status page (overview)** — full summary of pending steps with Status group cards (Associated parties / Company documents / Proof of address)
4. **Company documents** — document upload
5. **Adding associated parties** (multiple sub-flows):
   - Adding Individual / Editing Individual
   - Adding Company / Editing Company
   - "If there are associated parties" / "If there are no associated parties" branches
6. **Proof of address** — Add / Edit / Page (overview)
7. **We're checking your data** — submission status (Processing / Pending review / Verification required / Resubmit requested / Verified)

### Section node IDs in KYB file (Detailed UI/UX Light page `1:43`)

| Section name | Node ID |
|---|---|
| `General flow` | `3719:142312` |
| `Company search` | `5147:28502` |
| `Company documents` | `3105:80346` |
| `Adding associated parties` | `3105:95064` |
| `We're checking your data` | `3417:55129` |
| `PoA` | `6059:48423` |
| `Substitute beneficial owner` | `6886:50893` |
| `Only for designers` | `5599:87861` |

For each section, the canonical examples are pre-built FRAMEs (1440×1046 with centered 512×800 Window inside).

---

## Canonical assembly recipe

```js
// 1. Subscribe target file to KYB library (manual, in Figma) — required first
//    File: 9ii3Ueqr01mbLS3SE6bsrJ → Assets → Libraries → publish/subscribe

// 2. Import the KYB Window-shell variant
const selCompSet = await figma.importComponentSetByKeyAsync("b0df76296cf872acbf76475d1497b3092003c4e9");
const findVariant = selCompSet.children.find(c => c.name === "State=Find your company");
const window = findVariant.createInstance();

// 3. Create background frame (1440×1046) and center the Window inside
const bg = figma.createFrame();
bg.resize(1440, 1046);
bg.fills = []; // or KYB-specific page bg
bg.appendChild(window);
window.x = 464; window.y = 32;

// 4. ⚠️ REQUIRED — un-hide the Top Bar (header/nav) and Bottom Bar (footer/buttons).
//    Window variants ship BOTH hidden; a bare content-only window is a defect.
const topBar = window.findOne(n => n.type === "INSTANCE" && /Top Bar/i.test(n.name));
const bottomBar = window.findOne(n => n.type === "INSTANCE" && /Bottom Bar/i.test(n.name));
if (topBar) topBar.visible = true;
if (bottomBar) bottomBar.visible = true;

// 5. Customize text/state via setProperties on the Window variant
//    (Window variants are pre-assembled — no inner slot inserts needed for the basic case)
window.setProperties({ "State": "Find your company" });

// 5. For text overrides:
const titleNode = window.findOne(n => n.type === "TEXT" && n.name === "Title");
if (titleNode) {
  await figma.loadFontAsync(titleNode.fontName);
  titleNode.characters = "Find your company";
}

// 6. For specific organism overrides inside Window body (when canonical Example shows non-default):
//    Use setProperties on the SET-level variant first; if the inner organism still needs
//    customization (e.g. to replace Select company / Company search with a different inner state),
//    walk the Window's children and apply overrides as needed.
```

---

## Library subscription requirement

KYB components are local to `9ii3Ueqr01mbLS3SE6bsrJ`. To use them in another file:

1. The KYB file must **publish** them as a library (file owner action in Figma)
2. The consumer file must **subscribe** to that library via Assets panel → Libraries

If `importComponentSetByKeyAsync(KEY)` fails with "Component set not found" — the consumer file is not subscribed. STOP and ask the user to subscribe before proceeding.

**Pre-build check (analogous to Rule #1 for WebSDK):**

```js
const candidates = ["b0df76296cf872acbf76475d1497b3092003c4e9", "ca8434186c31b0dfdf0b6d562bca90867f777d48", "538c3c2cc17f14901afd1f92de4371d5e123b3d2"];
for (const k of candidates) {
  try { await figma.importComponentSetByKeyAsync(k); }
  catch(e) { /* surface to user, ask to subscribe to KYB library */ }
}
```

---

## KYB-specific Top/Bottom bar variants

Even though Top Bar uses set key `87aeeca5403429c521a1e89a154d23ac113ee551` (same as WebSDK Top Bar), KYB instances expose a different variant name `Type=Steps, Stroke=False`. This is because the local KYB-file Top Bar is a **redefined/wrapped** version of the WebSDK Top Bar with different variant axes specifically for KYB step navigation (Progress line + back/close buttons).

The Bottom Bar set `d6aff684505b1b3e74f92341a81cb700d9324a14` is **NOT importable** from external files (returns "Component set not found"). It's local to KYB file. Consumers must subscribe via library or use the Window shell which has it baked in.

---

## When the user asks for a KYB screen

1. Confirm KYB context (user mentions: "KYB", "company verification", "associated parties", "beneficial owner", "company documents", "Proof of address for KYB", "business verification")
2. Open the KYB file `9ii3Ueqr01mbLS3SE6bsrJ` and find the matching SECTION on the Detailed UI/UX (Light) page
3. Inspect the canonical FRAME for the target step (1440×1046 with centered Window 512×800)
4. Replicate using the matching `Window / *` shell + variant
5. Audit the build's Window variant + state matches canonical

**Do NOT mix KYB Window shells with KYC Widget shells in the same flow.** They're different design systems sharing the same WebSDK token foundation.
