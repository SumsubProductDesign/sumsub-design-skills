# WebSDK Organisms — Component Catalog

> Library: Organisms (`8VpSRNe9ur7SBctw0JrtOE`)
> Full scan: 2026-04-28 via Plugin API.
> Import: `await figma.importComponentByKeyAsync(key)` for COMP; `await figma.importComponentSetByKeyAsync(key)` for SET.

---

## Page: Accesses

| Component | Type | Key | Variants |
|---|---|---|---|
| `Instructions/Location` | SET | `c004e6979b981e992d56e0918d2ce8e4bec4155f` | 8 variants. `Platform`=IOS/Desktop × `Browser`=Safari/Chrome/Firefox/Other |
| `Instructions/Camera` | SET | `59c110db0432bfa7b963e5b6107b9de3d1cb287d` | 8 variants. Same platform/browser matrix |
| `Instructions/Cam+Mic` | SET | `10c337915832d130108e2570d019d695ef952817` | 8 variants |
| `Instructions/Microphone` | SET | `f8c9d8a856b14b652dadccee830b3ec9635a8528` | 8 variants |
| `Accesses` | SET | `3c05350d6baa4bb621e77700f41887c6cb5f7b80` | 4 variants. `Access`=Camera/Microphone/Location/Camera+Mic |

---

## Page: Applicant Data

| Component | Type | Key | Notes |
|---|---|---|---|
| `Applicant Data` | COMP | `45653ee601d3f64b01ac3d32fbfdd171c7593895` | Full applicant data entry form |

---

## Page: Camera

| Component | Type | Key | Variants |
|---|---|---|---|
| `Illustrations/ID card` | SET | `b1bd7dde8834091bac535966d9d299fcef7724cc` | 4 variants. `Type`=Sumsub/Generic × `Side`=Front/Back |
| `Illustrations/Placeholders` | SET | `5823fe1ff170106b7ca1ba9bed494e0d16a91b95` | 9 variants. `Type`=Card front/Card back/Selfie/etc. |
| `POI camera Mobile` | SET | `58be4845a20470a7258f4225cbfbfe5006e3f4a6` | 7 variants. `Step`=Placeholder/Camera/Review × `Type`=ID front/back/Passport |
| `POI camera Desktop` | SET | `228282dceda135813ddbe0a29bc0447d6f13b0bc` | 7 variants. `Step`=Camera/Placeholder/Review × same types |
| `Illustrations` | SET | `5d47a85649a553ed0e8749b93f9ca0cce0d36469` | 2 variants. `Type`=General/Error |

---

## Page: Document Type

| Component | Type | Key | Variants |
|---|---|---|---|
| `Document Type` | SET | `442dd62bd28ea1eade633911188ee851951355f6` | 2 variants. `Type`=Default/Compact |

---

## Page: Email Verification

| Component | Type | Key | Variants |
|---|---|---|---|
| `Input` (email) | SET | `99aa5f1de6c064a55cc741fdef95ab758e26dcb7` | 2 variants. `Type`=Email Input × `Status`=Default/Error |
| `Code` (email) | SET | `4df460c0223e69547caf98f029d84399472b4c41` | 6 variants. `Status`=Default/Error × `Type`=Timer/Resend/Empty |

---

## Page: Guidelines

| Component | Type | Key | Variants |
|---|---|---|---|
| `Guidelines` | SET | `ee868b662794e83115465a04bd7c253d4c60e79f` | 3 variants. `Type`=Liveness/ID/Selfie |

---

## Page: List

| Component | Type | Key | Variants |
|---|---|---|---|
| `List` | SET | `1db8ac6af01da0cefa64ec1c83cf735d1e0ab113` | 3 variants. `Type`=Language/Country/Document |

---

## Page: Liveness

| Component | Type | Key | Variants |
|---|---|---|---|
| `Camera frames/States` | SET | `92737c54e66d3bae287cd13fcc25ba86c4f2cc39` | 9 variants. `Type`=Placeholder/Active/Result × `State`=Default/Success/Error |
| `Selfie Mobile` | SET | `63b5ee9d5c0ba84081f36bdc1ea9fea97a72dd59` | 9 variants. `Type`=Liveness/Selfie/Short Video × `State`=Fit face/Recording/Done |
| `Selfie Desktop` | SET | `f084df56919e9d34fdfba8bd8a7d0da0013938ee` | 9 variants. `Type`=Selfie/Liveness × `State`=Default/Active/Done |
| `short video / pronounce` | SET | `d4e0e38df686bc63343ca1dac58d15c87e11c803` | 3 variants. `State`=Digits/Smile/Done |
| `digit` | COMP | `03d9b6bd027737fa9f12d08f0d019468c59e0109` | Single digit display |

---

## Page: Non-doc

| Component | Type | Key | Variants |
|---|---|---|---|
| `Mobile` (non-doc) | SET | `cba63480bcf4a851dab9b6228334f5b4bca0a9ed` | 9 variants. `Type`=Argentina/Brazil/India/Mexico/USA/etc. |
| `Desktop` (non-doc) | SET | `1b1c9f7ec3e2a339c92b3282a3ed6e9a2d03c546` | 9 variants. Same country types |

---

## Page: Phone Verification

| Component | Type | Key | Variants |
|---|---|---|---|
| `Input` (phone) | SET | `e388d5ae8568912654305ba2f771ce7f6453fdee` | 2 variants. `Type`=Phone Number × `Status`=Default/Error |
| `Code` (phone) | SET | `58e364ca01522b7faffca7dff2c06d6a91de713c` | 6 variants. `Status`=Default/Error × `Type`=Timer/Resend/Empty |

---

## Page: Preview

| Component | Type | Key | Variants |
|---|---|---|---|
| `Review` | SET | `09b8c6028793eab17ded1bde19087c3ee4d6e0bd` | 6 variants. `Type`=ID/Passport/Selfie × `Fastfail`=True/False |
| `Review / Slot` | SET | `c6ef91d5aee989d399b3c8907da7382d21843644` | 9 variants. `Type`=ID/Passport × `Orientation`=Mobile/Desktop |
| `Preview / Full` | SET | `303f62c47b324075ed306467e44c4390ae7130fe` | 6 variants. `Type`=Selfie/ID/Passport × `Mobile`=True/False |
| `Status` (preview) | SET | `0b2081e805d0d125800a926aaf2a9ed2a441954c` | 2 variants |

---

## Page: Proof of Address

| Component | Type | Key | Variants |
|---|---|---|---|
| `PoA` | SET | `f20729d5fc1b62ce03305606ff77e3db44fdab83` | 2 variants. `Type`=Geolocation/Upload |

---

## Page: Proof of Identity

| Component | Type | Key | Variants |
|---|---|---|---|
| `PoI` | SET | `0d9832d0a09832159dc83af7c50f83fb229c14d1` | 2 variants. `Doc type`=Two pages/One page |

---

## Page: QR | to phone

| Component | Type | Key | Variants |
|---|---|---|---|
| `QR/States` | SET | `ed5e0b8a252f6fc0106587e783d683838568799c` | 2 variants. `Logo`=True/False |
| `QR` | COMP | `706492d301f178184a97dcb2b426a73cf55569ef` | Single QR code component |

---

## Page: Questionnaire

| Component | Type | Key | Variants |
|---|---|---|---|
| `Section` | SET | `8848ca9883f60d1f54ea0900f5274417b7dfaaa1` | 14 variants. `Type`=Long Text/Short Text/Single Select/Multi Select/Date/File/etc. |
| `Questionnaire / Item` | SET | `7f976eb0146938fcfb17a2e68c774953885355c5` | 3 variants. `Type`=Item/Header/Subheader |

---

## Page: Statuses

| Component | Type | Key | Variants |
|---|---|---|---|
| `Final statuses` | SET | `d3f95404b879e0993ddca2f599e2e5071cdda0ba` | 3 variants. `Status`=Pending/Approved/Rejected |
| `Status titles/Pending` | SET | `580fe91ba211c910bde144e968a65427f1558f02` | 22 variants. `Step title`=ID/Selfie/Phone/etc. |
| `Status titles/Final` | SET | `b458d7a3f7babbd69a2b1eecc783bc82c48ae116` | 6 variants. `Title slot`=Reject with input/etc. |
| `Status titles/States` | SET | `9b42bf9a58824768ef7a377cd718e42ffe69ee27` | 18 variants. `Title slot`=Location error/etc. |
| `Step status` | SET | `19f390fb940f29bcc82d764ee732f718ac129874` | 3 variants. `Status state`=Default/Success/Error |

---

## Page: Steps

| Component | Type | Key | Variants |
|---|---|---|---|
| `Steps NEW` | SET | `c8893dba74df6506596ffccc6f22a407d145e532` | 3 variants. `State`=Default/Active/Completed |

---

## Page: Tips

| Component | Type | Key | Variants |
|---|---|---|---|
| `Tips` | SET | `a4f45db0337fd053bbac9adf11434aaa53bcd664` | 7 variants. `Type`=Tips \| Liveness / Tips \| ID / Tips \| Selfie / etc. |

---

## Page: Video Ident

| Component | Type | Key | Variants |
|---|---|---|---|
| `Mobile` (video ident) | SET | `9341ec89365d81bafda0065fe9fe93052a79c7fa` | 4 variants. `Type`=Checking/Connecting/Call/Done |
| `Desktop` (video ident) | SET | `6e9e5ee2e6d0911f93b51f9675af94ea82a25002` | 6 variants. `Type`=Tips/Connecting/Call/Done/etc. |
| `Panel Content / Phone Verification` | SET | `b25bd9e0ebcef96c5ed54dbf5e01e42147bc71fb` | 4 variants. `Step`=Phone Number/Code × `State`=Default/Success |
| `Panel Content / Success` | COMP | `2183ebefa0dd4fb47456e4406472465b142035c4` | — |
| `Panel Content / Upload` | COMP | `f5eb0d1d24c46e3815ade1e002ff0069789ae76f` | — |

---

## Page: Welcome

| Component | Type | Key | Variants |
|---|---|---|---|
| `Welcome` | SET | `927496fb36399feb71b4304d558be0d37a8fc5a9` | 4 variants. `Type`=Disclaimer/Steps/Both/None |

---

## Sumsub ID — Organisms

### Page: Sumsub ID – Data

| Component | Type | Key | Notes |
|---|---|---|---|
| `Create account` | COMP | `d4038bf6828e390b3d79d836e7d2d65d4f7c0b7c` | Account creation flow |
| `Data transferring` | COMP | `a51a415f58748a1ae8613e9547b320b386d4f915` | Data transfer screen |
| `Select docs` | SET | `8f174a0ab4c064495337664e74141e941d101d8c` | 2 variants. `State`=With docs/Empty |

### Page: Sumsub ID – Connect

| Component | Type | Key | Variants |
|---|---|---|---|
| `Logos` | SET | `968128769cce0d953d81fc6d2f93306951e0ec3c` | 2 variants. `Logo`=true/false |

### Page: Sumsub ID – Block & Pop-up

| Component | Type | Key | Variants |
|---|---|---|---|
| `Toast / Desktop` | SET | `4f0aeb09b708aae2789e0853bf6be36c9aba037c` | 4 variants. `Theme`=Light/Dark × `Type`=Default/Error |
| `Toast / Mobile` | SET | `d1e956f70c3114b679248befbc5dc05f4944c71f` | 4 variants. Same |
| `SNS ID \| Desktop` | SET | `ac451d0bd330fc997916598453781c7bbcab4b9f` | 4 variants. `Active`=True/False × `Theme`=Light/Dark |
| `SNS ID \| Mobile` | SET | `8658be3cc38a0f7905983269ed375fdb9fb9e852` | 4 variants. Same |

---

## Other

| Component | Type | Key | Notes |
|---|---|---|---|
| `Header` | COMP | `193b44314fe5c23934fb8e8b842f8dc7a2e66188` | In playground page — reusable WebSDK header |
