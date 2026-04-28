# WebSDK Base Components — Component Catalog

> Library: Base components (`Gh2QlRTetoSQdlK9G1nDq4`)
> Full scan: 2026-04-28 via Plugin API.
> Import: `await figma.importComponentByKeyAsync(key)` for COMP; `await figma.importComponentSetByKeyAsync(key)` for SET.

---

## Alert

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Alert* / Basic` | SET | `c54b1f4609d1ac8db110f6b3633a95e4b77b0836` | 5 variants. `Type`: Info/Success/Warning/Error/Default. Props: Title (bool), Icon (bool), Description (bool), Button (bool) |
| `Alert / Banner` | SET | `493f7f1d7106d7a8252ce9afd45aed806913678e` | 5 variants. Same type set as Basic |

---

## Button

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Button* / Basic` | SET | `5e6bd44e70142ccf9cc266ccffe56292ecbc7029` | 80 variants. `Content`: Text/Icon Left/Icon Right/Icon Only; `Type`: Primary/Secondary/Text; `State`: Default/Hover/Focused/Disabled/Loading; `Status`: Default/Success/Error/Warning |
| `*Button* / Camera / Action` | SET | `ce58b2bd470e24ed0ffd987360a676cd98bd0aab` | 15 variants. Camera UI actions |
| `*Button* / Camera / Additional` | SET | `7550b4cf1ecaec8a82d4d3d73088f49e9ab42718` | 20 variants. Additional camera controls |
| `*Button* / Camera / End Call` | SET | `be7be790ba2f7c255cf3b98b0266f2303e91a935` | 8 variants. End/close camera session |
| `*Button* / Sumsub ID` | SET | `205e7bde95fefa912cc3183ce929d015ba3e52b2` | 4 variants. Sumsub ID branded button |
| `Toolbar / Top Bar` | SET | `87aeeca5403429c521a1e89a154d23ac113ee551` | 3 variants. Props: Back Button/Language/Progress bar/Mobile/Sumsub ID/Size |
| `***Toolbar / Top Bar / Mobile` | SET | `254391124180127f6e7f06364d0e45d1aa8aa55c` | 12 variants. `Language Select`/`Back Button`/`Mobile`/`Sumsub ID`/`Tint`/`Type`/`Stroke` |
| `***Toolbar / Top Bar / Desktop` | SET | `495969debf3bd2cabab7b4ba95b7907967b9b12f` | 12 variants. Desktop variant |

---

## Booleans (Checkboxes, Radios, Toggles)

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Boolean* / Item` | SET | `f0177767e604f9555bcb77d590095770e7932505` | 36 variants |
| `*Boolean* / Group` | COMP | `0b60ce89cb0f775b41551015a2a25d8f1aac13ea` | Group container |
| `*Checkbox* / Item` | SET | `657542fd23bd7347addab009c1fc2c40ef142fb8` | 24 variants. State, Label, Caption |
| `*Radiobutton* / Item` | SET | `6140c29595496902ba56a8f95a7996c656d2f95b` | 16 variants |
| `*Toggle* / Item` | SET | `7a969cc57bfce690688396fcf7f837795294b78c` | 8 variants |
| `*Radiobutton* / Expanded` | SET | `92e63aea703e9b2e707dd2dac92d0156e90630f5` | 5 variants. Expanded radio with description |

---

## Caption

| Component | Type | Key | Variants |
|---|---|---|---|
| `Caption` | SET | `c81d580e891be4f05b24b13e78734827d3f67284` | 2 variants. `Danger` (bool) |

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
| `*Counter* / Basic` | SET | `c23ba161a29a0e0bed943712dd9c13f576c4d31c` | 2 variants. `State` |

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
| `*Input* / Base / Form` | SET | `66928868fd2b0e855b65ea91b97639ad99dda89d` | 12 variants. `State`/`Status` |
| `*Input* / Textarea / Form` | SET | `064b6c6240c82f6d50bece7acf394c44c794411d` | 12 variants |
| `*Input* / Phone Number / Form` | SET | `9531f4e7774e1b41008cc15437c70f7f07960259` | 12 variants. Phone + country code |

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

| Component | Type | Key | Notes |
|---|---|---|---|
| `Modal / Full / Desktop` | COMP | `61c1659962a2ee584b7750cd6c588bdf8345599e` | Full-screen modal, desktop |
| `Modal / Full / Mobile` | COMP | `80881e81eb92ac7328d868a7d2eefe7a5066aff6` | Full-screen modal, mobile |
| `Modal / Bottom sheet / Desktop` | COMP | `68af3e4c760824b6bb685343f0646dff158161e2` | Bottom sheet, desktop |
| `Modal / Bottom sheet / Mobile` | COMP | `f9d6419a30da88ecbfad566d3fca9e189498f220` | Bottom sheet, mobile |
| `Modal / Confirmation / Desktop` | COMP | `7eab080db1db93a9b6339b70310ea2c5f0eb2473` | Confirmation dialog, desktop |
| `Modal / Confirmation / Mobile` | COMP | `6d7f4748f4ba15182002f1c3d296ca0a8cd616c2` | Confirmation dialog, mobile |

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

---

## Scroll

| Component | Type | Key | Variants |
|---|---|---|---|
| `Scroll` | COMP | `f6383635fd045cfb486946fab7a272645eb5af11` | — |

---

## Select

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Select* / Default` | SET | `be26fa72bf749d841500104f7dfb4cbb31ee9478` | 20 variants. `Flag`/`Caption`/`Title`/`State`/`Filled`/`Status` |
| `*Select* / Inline` | SET | `40a63ae55ec9e779470ba7452914ab7b14bc42e9` | 2 variants. `State` |
| `Select / Menu` | SET | `6613315391650d15a326a055c91bc9006a92dc09` | 2 variants. `Search`/`State` |

---

## Skeleton

| Component | Type | Key | Variants |
|---|---|---|---|
| `Skeleton / Item` | COMP | `df0f12bf1e39742522b23f6c5aa058b5c6d120ea` | — |

---

## Step

| Component | Type | Key | Variants |
|---|---|---|---|
| `Steps` | SET | `98ec2ed715721e62d5a9d1c22c558123d2d0dde9` | 4 variants. `Tag`/`Description`/`Chevron`/`State`/`Collapsed` |

---

## Tab

| Component | Type | Key | Variants |
|---|---|---|---|
| `*Tab Button* / Group` | COMP | `464cffe6ed7ebf22c2015a6279c3512dd5f8e072` | — |

---

## Tag

| Component | Type | Key | Variants |
|---|---|---|---|
| `Tag / Status` | SET | `d26419d67c945caccc56671a00b58f81f3d283eb` | 6 variants. `Closable`/`Icon Left`/`Type` |
| `Tag / Document` | SET | `c2de61e673e1189c80472c59e8740a17b61504f7` | 5 variants. `Type` |

---

## Timer

| Component | Type | Key | Variants |
|---|---|---|---|
| `Timer / Video Recording` | SET | `392142dce67882f45e44139235a96ff5a24f870e` | 2 variants. `Active` |

---

## Title

| Component | Type | Key | Variants |
|---|---|---|---|
| `Title` | SET | `a4f74154e6c950755b1472a64e5344063da0365c` | 3 variants. `Alignment`. Props: `Subtitle` (bool) |

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
| `Verification status` | SET | `d2aa58113a56f7e2462e81b2d7f2ac42f224a414` | 5 variants. `Status` |

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
