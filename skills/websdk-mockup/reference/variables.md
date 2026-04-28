# WebSDK Design System — Variables Reference

> Library: Base components (`Gh2QlRTetoSQdlK9G1nDq4`)
> Scan date: 2026-04-28 via Plugin API.
> Color collection modes: **Light = `1425:0`**, Dark = `1425:1`.

---

## ⚡ Critical differences from Dashboard UI Kit

| Property | Dashboard UI Kit | WebSDK UI Kit |
|---|---|---|
| Font | **Geist** | **Manrope** |
| Icon token category | `semantic/icon/*` (singular) | **`semantic/icons/*` (plural)** |
| Stroke/border token | `semantic/border/*` | `semantic/border/*` |
| Spacing prefix | `spacing/*` | `semantic/spacing/*` |
| Border-radius prefix | `border-radius/*` | `semantic/border-radius/*` |
| Default bg (Light) | `#f6f7f9` (light grey) | **`#20252c` (dark shell)** |
| Card bg (Light) | `#ffffff` | `#ffffff` |

> ⚠️ WebSDK default background is dark (`#20252c`) even in Light mode — the SDK shell is always dark. Content cards are white (`#ffffff`).

---

## Typography

| Style | Size | Weight | Line Height | importStyleByKeyAsync key |
|---|---|---|---|---|
| `Header 1` | 24 | SemiBold | 32 | `249b4131debb951cc3849efe03848b851710f02e` |
| `Header 2` | 16 | Bold | 24 | `d3f6eaa01760fe0f23911f728b2c70ee8c019b43` |
| `Header 3` | 16 | SemiBold | 24 | `bd8389beabc34adbf141b8aa481566d844185dca` |
| `Body Text` | 16 | Medium | 24 | `ec79a8e479b9eb0412892ab3331d4a8411181cde` |
| `Links` | 16 | Medium | 24 | `ebb977959ffac204bde1580d20e907b0f9e89ea9` |
| `Caption` | 14 | Medium | 20 | `c57a9cd17e3fb443544f2e6896bc829d28b0a245` |
| `Caption Link` | 14 | Medium | 20 | `d97816810a4aa2dd0cd7d398c0d2ddb4cea74ed1` |
| `Caption Header` | 14 | SemiBold | 20 | `c21458cb8055a21749f87ef555b73c5df18f26a8` |
| `Button` | 16 | SemiBold | 24 | `7443ac0a044e19ad3b0d7b1a6b3b3c4c1a8e799b` |

All fonts are **Manrope**. Never use Geist, Inter, or any other family.

---

## Spacing Tokens

> All keys via `figma.variables.importVariableByKeyAsync(key)`

| Token | Value | importVariableByKeyAsync key |
|---|---|---|
| `semantic/spacing/2xs` | 2px | `f3d71c06d23e20c93296776c4821d2e8da15fbb1` |
| `semantic/spacing/xs` | 4px | `6612cd53f50e48460e4f5fc964740c5aaa2926ad` |
| `semantic/spacing/s` | 8px | `223b967c0b76a46cb762d4c9971c32715a59fbef` |
| `semantic/spacing/sm` | 9px | `ac53d8ace76d43ea6fca44b71b30f38760f4da0c` |
| `semantic/spacing/m` | 12px | `88c998987e6ca3eb6b64dd1dbd49ec76355e754a` |
| `semantic/spacing/l` | 16px | `31059dbd22053f1df9f5e665e967d28025512d9e` |
| `semantic/spacing/xl` | 24px | `644b9118762ae580af7de28f8b01063dcc1f777a` |
| `semantic/spacing/2xl` | 32px | `11b19f17e073a2c59ae39e3cc65763ad75587c6e` |
| `semantic/spacing/3xl` | 40px | `1988a052d1ab67db6ac232847f35d7490843112a` |
| `semantic/spacing/4xl` | 48px | `bdc53d6633b362f3dc8cf5cb5cc8761415ac69ec` |
| `semantic/spacing/5xl` | 56px | `6902ddce0a1c9fb924e92f8c80cf0c740a9db09d` |
| `semantic/spacing/6xl` | 64px | `4c2f0185b2129b728aa466705ed44d3788d6efd3` |
| `semantic/spacing/7xl` | 72px | `30bb5927108b76107dc74cce3249fd9076840262` |
| `semantic/spacing/8xl` | 80px | `3039123f1cd84f22fff6cb893b95d629567bd56f` |

---

## Border-Radius Tokens

| Token | Value | importVariableByKeyAsync key |
|---|---|---|
| `semantic/border-radius/0` | 0px | `c34009976b47d58f0d83b3ba0e5d3c20059890ca` |
| `semantic/border-radius/xs` | 2px | `7c04cf7715178785b340ff83254e23c7dade15b9` |
| `semantic/border-radius/s` | 4px | `f3cd0ca2bcf0d2fe40bac4eea9472476d912cc24` |
| `semantic/border-radius/m` | 8px | `9b370a5fb6771e0fcfbc96ec8781a925a14d8aa8` |
| `semantic/border-radius/l` | 12px | `73a765c22b9678ec4d0f27690874978631ffe877` |
| `semantic/border-radius/xl` | 16px | `563ffcf4b6cf9104ede4cefe911ff886dac0e0f0` |
| `semantic/border-radius/2xl` | 24px | `8d23ec6c5a5293225406f5419e36d4dc146856e0` |
| `semantic/border-radius/2,5xl` | 28px | `ea54840dc16f943f2e9b56752f6d59c296778db6` |
| `semantic/border-radius/3xl` | 32px | `c4dd4fd614498e7065da9ff3b5d964793593b782` |

---

## Color Variables — Light Mode

> All resolved in Light mode (`1425:0`).
> Import via `figma.variables.importVariableByKeyAsync(key)`.

### Text Variables (`semantic/text/*`)

| Token | Light hex | Dark hex | importVariableByKeyAsync key |
|---|---|---|---|
| `semantic/text/primary/normal` | `#20252c` | `#ffffff` | `9091e16c610ffa8e79a4af30918115d0c1fc523f` |
| `semantic/text/primary/disabled` | `#20252c` | `#ffffff` | *(get via scan if needed)* |
| `semantic/text/secondary/normal` | `#ffffff` | `#1b1b1f` | `fe7e5633c6f8aca8dd3efeb7bd1e15a01ca807f6` |
| `semantic/text/white/normal` | `#ffffff` | `#ffffff` | `a6f6b0eefb632a0c51aec69542fc0b0f4cd92dfa` |
| `semantic/text/neutral/normal` | `#20252c` | `#1b1b1f` | `5830dfc7cd49bb72184aedc43d5435ce95a3d9cd` |
| `semantic/text/gray/primary` | `#ecedf2` | `#2a2b30` | `0b2428bd50ae60132c11f68e89e96d85e9c45a12` |
| `semantic/text/blue/normal` | `#143cff` | `#0f6bff` | `9c81ffad4ed68d8c73bdfda9860f4b725e191b96` |
| `semantic/text/green/normal` | `#008b5e` | `#00a97a` | `53a2379a23c2442bcd3a93ac332de0121a15a49d` |
| `semantic/text/red/normal` | `#d12424` | `#d32f2f` | `c0fa5d9e992775bb182a6c3d1eef8cd7c239eaf4` |
| `semantic/text/yellow/normal` | `#f2aa0d` | `#f2aa0d` | `371a8b01f66b76f56026f896e3ef7e3b86490f63` |
| `semantic/text/red/status` | `#7f0808` | — | `a8731686c7669cc3d95f32d19f867aafabd6f371` |
| `semantic/text/yellow/status` | `#8c6203` | — | `4ca37dc698cd6e368109b3bd8d98c0bc40fba119` |
| `semantic/text/blue/status` | `#002369` | — | `bdc33d36efc49dca6126090af533d149acc73c4a` |
| `semantic/text/green/status` | `#074f3d` | — | `d1e2b4db27530f0487aef0ec1c012b93135edcf0` |

### Background Variables (`semantic/background/*`)

| Token | Light hex | Dark hex | importVariableByKeyAsync key |
|---|---|---|---|
| `semantic/background/default/background-normal` | `#20252c` | `#ffffff` | `daf2ef364fc06a5630ed119cc58252732d7cc4ff` |
| `semantic/background/secondary/normal` | `#ffffff` | `#1b1b1f` | `feed2a5538bb5e0f2fb8a49bde6122c13ad68035` |
| `semantic/background/white/normal` | `#ffffff` | *(light)* | `36117709ae9c618561fdc1df5b4be8a7baefd798` |
| `semantic/background/gray/normal` | `#ecedf2` | `#2a2b30` | `b980c67680e5ac3de2023f5593c083d024216ddb` |
| `semantic/background/gray/subtliest/normal` | `#ecedf2` | — | `63682aa77762823eea7d2138aea4ffe894a73035` |
| `semantic/background/primary/normal` | `#20252c` | `#ffffff` | `6f4f590274d202b9b0b27df7228f2f8d9ee7ad63` |
| `semantic/background/blue/normal` | `#143cff` | — | `f17bec56c0d3bde1ecae7dd2b32f1fed79e002be` |
| `semantic/background/green/normal` | `#008b5e` | — | `b87d2a2da3d64a5b3090fa20594b66ad1256335b` |
| `semantic/background/red/normal` | `#d12424` | — | `afc93634204e1aeb86d1b38385033ad3091993c2` |
| `semantic/background/yellow/normal` | `#f2aa0d` | — | `9ce94d35f742b13b217f6faf13603703fd23942f` |

### Border Variables (`semantic/border/*`)

| Token | Light hex | Dark hex | importVariableByKeyAsync key |
|---|---|---|---|
| `semantic/border/primary/normal` | `#20252c` | `#ffffff` | `a1f02b978e60e74e850ed3157ba3ce32718493b7` |
| `semantic/border/primary/focused` | `#20252c` | `#ffffff` | `6eefb4e87cc21425af7a3a84b151e5862505cf39` |
| `semantic/border/primary/disabled` | `#20252c` | `#ffffff` | `90e8bc5f45d28800cf819ee33159eac469fa6607` |
| `semantic/border/white/normal` | `#ffffff` | `#ffffff` | `d6f1a313184d30407ea4264c552c564f47f4c81e` |
| `semantic/border/blue/normal` | `#143cff` | `#0f6bff` | `af877065a3e2e183180cb096729d7c1727c7c30a` |
| `semantic/border/blue/focused` | `#143cff` | `#0f6bff` | `6dde29809ff5df7c1f63575b0f4fc9798715a320` |
| `semantic/border/red/normal` | `#d12424` | `#d32f2f` | `fa0398a2335c8bb075456f7cc2ba600600f6c0e4` |
| `semantic/border/red/focused` | `#d12424` | `#d32f2f` | `be32d347aa5bff8b7a8792ac4f6ad1c3fd7f36db` |
| `semantic/border/green/normal` | `#008b5e` | `#00a97a` | `8ba0ea7b934b162a45890d1e38e457330d81df3e` |
| `semantic/border/yellow/normal` | `#f2aa0d` | `#f2aa0d` | `9199f5b697a7078951a4350f8f73daaf0ecb485f` |

### Icon Variables (`semantic/icons/*`)

> ⚠️ **PLURAL** — `semantic/icons/` (not `semantic/icon/` like Dashboard DS).

| Token | Light hex | Dark hex | importVariableByKeyAsync key |
|---|---|---|---|
| `semantic/icons/primary/normal` | `#20252c` | `#ffffff` | `23acaad0abc91e4a6963696de15ea873994c54b4` |
| `semantic/icons/primary/disabled` | `#20252c` | `#ffffff` | `daa50fa7ad4e1466de2febe60605560203f233f1` |
| `semantic/icons/secondary/normal` | `#ffffff` | `#1b1b1f` | `29aeacc38a2d62b1daaba5b933055ff767fee7f1` |
| `semantic/icons/white/normal` | `#ffffff` | `#ffffff` | `739ae822bef504b2cbe7c103a37a6cbaa5e7a605` |
| `semantic/icons/neutral/normal` | `#20252c` | `#1b1b1f` | `d3b54997ed1252215a987918428800c5fe519bc3` |
| `semantic/icons/gray/normal` | `#ecedf2` | `#2a2b30` | `e968bd2a05c5844bc1333272b438e8509904741e` |
| `semantic/icons/blue/normal` | `#143cff` | `#0f6bff` | `adcdaf56272899abe3282e8b3210e2e41038fa05` |
| `semantic/icons/green/normal` | `#008b5e` | `#00a97a` | `ecf5ae41ca61d28ba9d80712259888d0c6b525a9` |
| `semantic/icons/red/normal` | `#d12424` | `#d32f2f` | `1612a3ab06e5e7e5ce979223c7d776f868d987ee` |
| `semantic/icons/yellow/normal` | `#f2aa0d` | `#f2aa0d` | `443a13e39eda3d6562dbcefcc5c51523f82308a0` |
| `semantic/icons/camera/normal` | `#ffffff` | `#ffffff` | `e593cfd3ef1547ac36eb733b9076134203f404a3` |
| `semantic/icons/subtier/normal` | `#20252c` | `#ffffff` | `88b7b74e80dec3973240d9be493951b6dfecb607` |

---

## Variable Binding Pattern

```js
// Bind fill color
const textVar = await figma.variables.importVariableByKeyAsync("KEY_HERE");
node.fills = [figma.variables.setBoundVariableForPaint(
  { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", textVar
)];

// Bind spacing
const spacingVar = await figma.variables.importVariableByKeyAsync("KEY_HERE");
frame.setBoundVariable("paddingLeft", spacingVar);
frame.setBoundVariable("paddingRight", spacingVar);
frame.setBoundVariable("paddingTop", spacingVar);
frame.setBoundVariable("paddingBottom", spacingVar);
frame.setBoundVariable("itemSpacing", spacingVar);

// Bind border radius
const radiusVar = await figma.variables.importVariableByKeyAsync("KEY_HERE");
frame.setBoundVariable("topLeftRadius", radiusVar);
frame.setBoundVariable("topRightRadius", radiusVar);
frame.setBoundVariable("bottomLeftRadius", radiusVar);
frame.setBoundVariable("bottomRightRadius", radiusVar);

// Apply text style
const style = await figma.importStyleByKeyAsync("KEY_HERE");
await textNode.setTextStyleIdAsync(style.id);
```

---

## Color Palette Quick Reference

| Color | Brand / Role | Light hex | Dark hex |
|---|---|---|---|
| Neutral dark | Default text, dark shell | `#20252c` | `#ffffff` |
| White | Card surface, secondary text | `#ffffff` | `#1b1b1f` |
| Gray | Muted bg, disabled | `#ecedf2` | `#2a2b30` |
| Blue | Brand / CTA | `#143cff` | `#0f6bff` |
| Green | Success | `#008b5e` | `#00a97a` |
| Red | Error / Danger | `#d12424` | `#d32f2f` |
| Yellow | Warning | `#f2aa0d` | `#f2aa0d` |
