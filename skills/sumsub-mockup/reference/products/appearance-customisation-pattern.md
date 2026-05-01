# Appearance Customisation — Layout Patterns

> Source file: `imuvjJtDS7kM8AOP2p4kFm`
> Scan date: 2026-04-28
> Single dominant pattern: split-view editor (Settings + Live Preview) on a 1920px canvas.

---

## Critical canvas dimensions

**Appearance customisation uses 1920-wide canvas, NOT 1440.** This is the only Sumsub product (besides TM Transaction detail and legacy VASPs) that defaults to 1920px. Don't auto-default to 1440.

The 1920px is split as **727 (settings) + 1193 (preview)** = 1920.

---

## Pattern — Split-view Settings + Live Preview

> Used everywhere in this file: General Settings, Gradient settings, Pipette func, Onboarding Screen.

```
Root (1920 × 1080+, NONE layout, fill #ffffff)
├── *Header*  (1920 × 64, x=0, y=0)        ← full-width chrome
├── Content   (727 × 1058, x=0, y=64)      ← left settings panel
│   └── (form rows for theme, colors, gradients, fonts, etc.)
└── Preview / Appearance INSTANCE  (1193 × 1058, x=727, y=64)  ← right live preview
    └── (renders the WebSDK widget being customised, real-time)
```

**Confirmed dimensions** from `Screen 888` (General Settings):
- *Header*: 1920 × 64 at (0, 0)
- Content: 727 × 1058 at (0, 64)
- Preview / Appearance: 1193 × 1058 at (727, 64)
- Layout sum: 0 + 727 + 1193 = 1920 ✓
- Page height: 1122 (1080 + 42 for some breathing room)

**Confirmed dimensions** from `Screen 557` (Gradient settings):
- Same layout — Header 1920×64, Preview 1193×1016 at (727, 64)
- *Color Picker* overlays: 282 × 324 (collapsed) or 282 × 389 (expanded) — float over Content panel as modal-like dropdowns

---

## Preview / Appearance component

| Property | Value |
|---|---|
| Component key | `884709becd792f7a50993578940a2afd67734630` |
| Set name | "Preview / Appearance" |
| Source | Organisms [Dashboard UI Kit] (per `cm-component-catalog.md`) |
| Default size | 1193 × 1016 (Gradient page) or 1193 × 1058 (General Settings page) |
| Position | x=727 (always — right after 727px settings panel) |

The Preview / Appearance component is a packaged organism that renders the Sumsub WebSDK widget with all current customisations live. Don't try to assemble preview content from atoms — use this organism.

---

## Color Picker overlay

| Variant | Size | Use |
|---|---|---|
| Collapsed | 282 × 324 | Hue + saturation pad with hex input |
| Expanded | 282 × 389 | Adds gradient stops / opacity slider |

`*Color Picker*` instances are placed absolutely over the settings panel (typically `x=51, y=562`). Adjacent `Cursor/Pointer` instances show the user's interaction point.

---

## Pattern Decision Tree

```
Anything in Appearance customisation?
   → ALWAYS this pattern: Header 1920×64 + Settings 727 + Preview 1193
     The only differences screen-to-screen are (a) Settings content (form variants)
     and (b) absolute-positioned overlay state (Color Picker / Cursor / Tooltip).
```

---

## Components

> Components page `1:6` scanned. 13 component sets + 1 standalone:

| Component | Type | Key | Variants |
|---|---|---|---|
| `Template / Variant / Item` | SET | `d91688f5eca17afb427ab6b5cde6c054dbdadd1e` | 5 |
| `Illustration / Customization / Item` | SET | `2c6fb1d688d0ec5a0463eaf7e617692b73c098ab` | 4 |
| `Drawer / Table / Line` | SET | `022751435e795c4868b3166da0003f1aead442aa` | 2 |
| `Settings / Content` | SET | `413464ad70ca3cdccdbe063a80ff5c6dcca1c0b8` | 8 |
| `Modal / Content` | SET | `8f9a57211ec2b0e5f6907fa57b4e4ad0a815f6f6` | 11 |
| `Theme / Preview` | SET | `016af8a332249ed294dca6169db6286146cf0cbe` | 12 |
| `Template Header` | SET | `43b73e728a8fe4cf8c40f2238336667f0261e48f` | 2 |
| `Modal / Content / New Customization` | SET | `6710b8fa179c33b3192d45c6519519529d2ff0a3` | 4 |
| `*Template Card* / Appearance / Horizontal` | SET | `ca8963e4d726d66338a23a046b7bef45855001f0` | 9 |
| `Template Card / Localization / Horizontal` | SET | `84f7c877ec57e82ae64f58cf2c53f272ce01224b` | 3 |
| `Template Card / Appearance / Theme` | SET | `0488eca8f1c1e83558bd92deab0cdc482859c6b7` | 3 |
| `Theme / Illustration` | SET | `63211e71e97b797f97d24c46660a2f42a7220ebd` | 3 |
| `Color Picker / Mini` | SET | `5ea9019fb08cc23acf4b32f6a32e82ffe37e6d2f` | 6 |
| `Drawer / Content` | COMP | `facedef9d3dca31d841bb690c47f1b77a26603c6` | — |

---

## Source pages

| Page | ID | Purpose |
|---|---|---|
| Onboarding Screen | `5068:329021` | First-time customisation walkthrough |
| General Settings | `5158:189484` | Theme, fonts, layout settings |
| Gradient settings | `5386:7842` | Gradient stops + Color Picker |
| Pipette func | `5469:120738` | Eyedropper tool flow |
| MobileSDK detailed | `4895:299245` | Mobile SDK customisation variants |

---

## Notes & gotchas

- **1920 canvas, NOT 1440** — the only mainstream Sumsub product on this canvas alongside TM Transaction detail and Mobile SDK demos.
- **Split is 727 / 1193, NOT 50/50** — settings panel narrower than preview (preview gets 62% of width).
- **Preview / Appearance is a packaged organism** — don't recreate the WebSDK widget by assembling atoms. Always import this component.
- **Color Picker / Cursor are absolute overlays** — they sit on top of the Settings panel, not inside it. Use NONE layout positioning.
- **Header is full-width 1920** — no sidebar in this product. Header chrome includes navigation up to dashboard.
