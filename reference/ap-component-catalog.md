# AP UI Kit — Full Component Catalog

> Library: `QKXZwWodIwPVsjAjj4gMnE` (Applicant-page-and-Tasks-components)
> Full scan: 2026-04-14 via Plugin API, all pages.
> Total: ~120 components across 11 pages.

---

## Page: Header

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **AP page header** | SET | `afde096fe83bb6a2e474c175e55dd73856303a1a` | 6 variants: `Client type`=Any/KYC/KYB x `User type`=Admin/Moderator x `In review`=Yes/No |
| AP page header / Menu | COMP | `48e73e7530ab4acb7e7907bc9c3f236430a33932` | Dropdown menu with actions |
| normal/exit | COMP | `35e1e2ca7322139dfa85aa23921231b6bc01ab58` | Icon |

### AP page header properties
| Property | Type | Default |
|---|---|---|
| `Applicant name#3392:7` | TEXT | "Freya Crause" |
| `  ↪ Client name#3392:3` | TEXT | "ClientNickname" |
| `Sandbox#3392:8` | BOOLEAN | false |
| `Score#3392:10` | BOOLEAN | false |
| `Notes#603:7` | BOOLEAN | false |
| `Inactive#1456:0` | BOOLEAN | false |
| `KYB link#3392:2` | BOOLEAN | false |
| `Client info#3392:4` | BOOLEAN | false |
| `Read-only applicant#2315:0` | BOOLEAN | true |

### AP page header child structure
```
AP page header
├── Sandbox (FRAME) → .Header / Flag instance
├── Header (FRAME) → Wrapper (FRAME) → left: back btn + avatar + name + status + badges; right: action buttons
└── .Header Full Screen Page / Subheader (INSTANCE) → *Tab Basic* instance
```

---

## Page: Body

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **Body** | SET | `b7f51135fb0d86dd346af5587ec1d701703db6e5` | 3 variants: GM/Admin/Other. Prop: `Videoident` (bool) |
| **Body / Title (Block Title)** | COMP | `788264d18f2cc9e75e464416c0cae74fbcd37da8` | Single component |

### Body / Title properties (LIBRARY keys)
| Property | Type | Default |
|---|---|---|
| `Title name#12928:0` | TEXT | section title |
| `Button#12928:1` | BOOLEAN | false |
| `2nd button#12928:2` | BOOLEAN | false |
| `3rd button#12979:0` | BOOLEAN | false |
| `Toggle 1#2138:0` | BOOLEAN | false |
| `Toggle 2#2138:1` | BOOLEAN | false |

### Body component — contains the ENTIRE AP body
The Body SET is a massive component containing multiple APCardCollapsible cards:
- Events section
- Notes section
- Risk labels section
- Profile info / Personal info section
- Documents section
- Checks section (ID, Selfie, Phone, Email, etc.)
- Photos section

Each section uses Block Title (Body / Title) for headers and APCardCollapsible for expandable cards.

---

## Page: Applicant notes

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **Applicant notes / Input** | SET | `ca9a7f23a77be86287d21dd0f1a3b318b7ec0e33` | 3 variants: `Type`=Internal note/Admin notes/Note for client |
| **Applicant notes** | COMP | `0f1ba9b45209163bb9ae5ba43abdca89cc806ff7` | Props: `Added Notes` (bool), `View more` (bool) |

### Applicant notes / Input
Wraps DS `*Input Note*` component. Contains:
- Type selector (Internal/Admin/Client)
- Text input area
- Attachments
- Tags
- Footer with Send button

### Applicant notes
Contains:
- Input field for adding notes
- List of existing notes
- "View more" button for pagination

---

## Page: Applicant status

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **Applicant status** | SET | `b15e79670bd60789fe6b7d0b958016c683011f15` | 10 variants by Status |

### Applicant status variants
| Status variant | Description |
|---|---|
| Documents requested | Initial document submission |
| Pending | Awaiting review |
| Awaiting service | External service processing |
| Prechecked | Auto-checks passed |
| Requires action | Manual review needed |
| Processing | Being processed |
| Awaiting user | Waiting for user response |
| Approved | Verification passed |
| Rejected | Verification failed |
| Resubmission requested | Docs need resubmission |

Wraps the DS `*Status*` component with AP-specific status labels.

---

## Page: Document

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **Document** | SET | `34687e2ab77282287cc7b44a2bb06b0aa8bd9b36` | 3 states: Filled/No documents/No suitable docs |
| **Document / Actions block** | SET | `a3acd606afc78a657b2714af6dd638c15734b54e` | 2 roles: TL+/Admin |
| Document / Form | SET | `27812c1486949b9e7d16758fa296b32d69fabf86` | 6 variants: New UI x Empty state x Doc type |
| Document / Form / Barcode | SET | `a7d2a73e4c864c372357c33e4c2e48666b5a361e` | Expanded=Yes/No |
| Document / Form / Address | SET | `2773879de4a5a8dbfab68c5cf6e37497a85e433c` | Expanded=Yes/No |
| Document / Form / MRZ | SET | `a204ecc3d3da66e5357ec14d50e9d0b5c4cf75c1` | Expanded=Yes/No |
| Forms / POA | SET | `5b44025cd023eb8529457d2952815bc3b07c08f5` | Map opened=Yes/No |

### Document properties
| Property | Type | Default |
|---|---|---|
| `Alert (Doc not supported)#8662:5` | BOOLEAN | false |
| `Bug (TL+)#5506:5` | BOOLEAN | false |
| `Alert (Photo changes)#5146:0` | BOOLEAN | false |
| `Back side#5136:7` | BOOLEAN | true |

### Document child structure (State=Filled)
```
Document
├── *Alert* (DS Alert, conditional)
├── Document block (FRAME)
│   ├── Document info (FRAME) — country, type, status, OCR data
│   └── Document photos (FRAME) — front/back photo previews
└── Checks (FRAME) — ID check results, NFC, etc.
```

### Document / Actions block properties
| Property | Type | Default |
|---|---|---|
| `Country name#8135:0` | TEXT | "Germany" |
| `Document type#8135:1` | TEXT | "ID card" |
| `Type restricted#9029:0` | BOOLEAN | true |
| `Country restricted#9029:3` | BOOLEAN | false |
| `Type not supported#9029:6` | BOOLEAN | false |
| `TIN check#8187:3` | BOOLEAN | true |
| `2nd row#8218:0` | BOOLEAN | false |

### Document / Form properties
| Property | Type | Default |
|---|---|---|
| `Extra fields#2062:8` | BOOLEAN | false |
| `Validity extended#1209:0` | BOOLEAN | false |
| `Address#1933:0` | BOOLEAN | true |
| `Alert Doc isnt supported#914:2` | BOOLEAN | false |
| `OCR previews pictures#914:1` | BOOLEAN | false |
| `OCR previews (GOD)#914:0` | BOOLEAN | true |

---

## Page: Events

| Component | Type | Key | Notes |
|---|---|---|---|
| .Content / Events / Event item | SET | `a99917a20bd04effd216e198e7c015d7c0457217` | 17+ event types. INTERNAL (dot prefix) |
| .Content / Events | SET | `3225eb5ae1246b08f5860253b58ca8b189f25999` | Expanded=No. INTERNAL |
| .Events | SET | `3888bd1c362d50b9df21f346e3a32b4090d702ad` | Expanded=Yes/No. INTERNAL |
| .IP details | COMP | `95ac1449e07e48f733f88b01278e5f005db6aaa0` | INTERNAL |

### Event item types
Rejected, On hold, Level changed, Approved, Pending, Passport, No permission, POA, Selfie, Docs requested, Reg started again, Phone confirmation, General event, E-sign init, E-sign pending, E-signed confirmed

> All Events components are INTERNAL (dot prefix). They're used inside the Body component automatically. Don't import directly — toggle Events visibility via the Body component.

---

## Page: Photos

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **Photo** | SET | `9352939d0664d385ca99d63b25cdff6a4ee1404b` | Type=Photo uploaded/deleted/Empty x State=Default/Hover |
| **Photo / Header** | SET | `58222c6ea8f989a946ef18eb8ac95569be3d99e6` | In drawer x Status x Active photo (9 variants) |
| **Photos drawer** | COMP | `9e47a0a37b3546eca39eb0f1cd30b1d098cabd77` | Full drawer for photo review |
| Photos drawer / Content | SET | `9d3e5a23da19c28107aa5fadc0ee0a9bc7185aad` | Empty=Yes/No |
| Photos drawer / Kebab menu | SET | `e7226adc4ef0430860c2b977c07f746d42eb622a` | In drawer x Admin (4 variants) |
| Photo External | COMP | `e5b5fb6f8edd41c052523e6fe37f6d902590ef82` | External photo |
| Document photo / Alert Not supported | SET | `f204f54c53591dbea70cb70cd1bc64d1171546f6` | 3 types: Country restricted/Type not supported/All types |

### Legacy "Documents block old" (still in library)
| Component | Type | Key |
|---|---|---|
| Documents block old | COMP | `5926b6ab7ee1432c8e878c6bd2a430483faa6dfc` |
| Documents block old / Document | COMP | `687d0b3c65b4c15fd61c273515d630422e0ea0aa` |
| Documents block old / Document / Header | SET | `0954156d1214b693b4be2fc54b6e5e8b58242b4e` |
| Documents block old / Document / Review panel | SET | `f7f1dddd41f8decd78ff32c5d48214b5a3a94e43` |
| Documents block old / Document / Actions | SET | `88365f851911437219b4082f829fd322192cec9a` |
| Documents block old / Document / Photo | COMP | `afb0c83d66f54f3c219c3f22e3a4eacfc57644b7` |
| Documents block old / Document / Review panell buttons | SET | `7b5eb32391cde2a1197ef7f27bc3e9b4702d6437` |

### Photo properties
| Property | Type | Default |
|---|---|---|
| `Tags#8164:4` | BOOLEAN | false |
| `Graphic editor#8164:0` | BOOLEAN | true |
| `Image blurred#7250:1` | BOOLEAN | true |
| `Doc subtype (GM+)#9825:0` | BOOLEAN | false |
| `View other photos#7143:0` | BOOLEAN | false |

### Photo / Header properties
| Property | Type | Default |
|---|---|---|
| `Document title#8056:4` | BOOLEAN | true |
| `Country name#5143:16` | TEXT | "Germany" |
| `Side name#8056:8` | TEXT | "Front side" |
| `Rejection reason#8056:12` | TEXT | rejection reason text |
| `Side info#5143:8` | BOOLEAN | true |
| `Actions#5338:25` | BOOLEAN | true |
| `  ↪ Bug button#8056:0` | BOOLEAN | false |
| `Compare with selfie#1793:0` | BOOLEAN | false |

---

## Page: Risk labels

| Component | Type | Key | Variants |
|---|---|---|---|
| **Risk labels** (card) | SET | `6c7ec7931a405b9c3efdd0a6a87530b721ac81f5` | Property 1=Card |
| **Risk labels** (by group) | SET | `4c2620c0321aa56d8211a88e9f188cefff7932bf` | Group=Email/Phone/IP/Selfie/Person/Device/Device Antifraud/AML/Crosscheck/Company |
| Risk labels block | COMP | `78e549bc6b45b0af94ca01cdbf8e82b3ae64ff5a` | Full risk labels section |
| APCardCollapsible (Risk) | SET | `bb0b2361c36296b905275d730acfa6e979d04612` | Status=No status/Status4/Approved/Rejected |
| Tooltip Image | COMP | `2b8bb7f1de38fcd0561d34f4c9603ac1331f5c5c` | Risk label tooltip |

### Risk label category components
| Category | Key | Label count |
|---|---|---|
| Risk labels / Email | `f2516a2b5bac00c3996a76ea11cd42450ed99b4d` | 8 |
| Risk labels / Phone | `d480df62d63198e80255abf72c021b0f20534481` | 6 |
| Risk labels / IP | `0c896f3c3bd322f8969fb08f19e4994099138842` | 10 |
| Risk labels / Selfie | `a3fdd5a1b5310e524fe03530c079ae2e3e2f8f64` | 7 |
| Risk labels / Person | `120580f77589300c82194c0541e44381fa53717b` | 6 |
| Risk labels / Device | `39faaa12321ab2f7c3f8cec8c39c8ca59f5334ce` | 17 |
| Risk labels / Device Antifraud | `179e262ca3143c06d7d37b6ef4ea2f25978c15e5` | 8 |
| Risk labels / AML | `2dcae372eca72d8dafbd2d46f020b3f5f62f221b` | 6 |
| Risk labels / Crosscheck | `f2c79d0cf5e3e84b1d653115891eb4cd62e7edc4` | 6 |
| Risk labels / Company | `8a674afa69b7729b17dbdb77ee5b3e19da0f5c4d` | 8 |

### Risk label examples by category
- **Email:** High risk, Medium risk, Disposable, No registrations, No website, Non-deliverable, Blocklisted, Invalid
- **IP:** VPN, TOR, High risk IP, Multiple devices, Lengthy session, Link via external source, Risky continuation
- **AML:** PEP, Sanctions, Terrorism, Crime, Adverse media, Fitness and probity
- **Device:** Malicious Bot, App Tampering, Virtual Machine, Remote Control, Jailbroken, Rooted, Emulator, Frida Tool, etc.

---

## Page: Personal info and address

### Primary components (v1)
| Component | Type | Key | Variants / Props |
|---|---|---|---|
| **Personal info** | SET | `eb39701397ce07f5d0200cb2e8b3714fd695b75d` | App data=Yes/No |
| **Personal info / Applicant data** | SET | `72b025c8c706a7e7b277e7ee2183b8012bfab6b5` | 4 variants: Empty fields x Info provided |
| **Personal info / Address** | SET | `25085e3400dba5aa032f7698097ae71fb9a0fde1` | State=Empty/1 address/2 addresses |
| Personal info / Address / Item | SET | `c4a24a99dd9da9ca895f8b0f2367f0f591c0853a` | Layout=Horiz/Vert |
| Personal info / Extracted information | SET | `f87147c6d4a1ad874371eb6c6cc8dc68a53db08c` | Empty x Layout (4 variants) |
| Forms / Personal Info | COMP | `1cfc383e0e6a2d5257ef4139b0a62734b09e10f8` | Edit form for personal info |
| Forms / Provided Personal Info | COMP | `f318568b7436b34389c029afad5551c8c5d7c64a` | View of provided data |
| Forms / Address | COMP | `02cb33b018d48d4c5e8749a4f1f8f5c09176be4c` | Address edit form |
| Forms / Custom fields | COMP | `dd68ffb4a2ad9806e8e6400cb3ce061a6673ed77` | Custom field inputs |

### Personal info / Applicant data properties
| Property | Type | Default |
|---|---|---|
| `Address#15402:1` | BOOLEAN | true |
| `Custom fields#15402:0` | BOOLEAN | true |
| `Editable#15402:2` | BOOLEAN | true |
| `2nd address#15854:0` | BOOLEAN | true |
| `Problematic applicant data#1677:0` | BOOLEAN | false |
| `Toggle Empty fields#1679:5` | BOOLEAN | false |

### Personal info / Address properties
| Property | Type | Default |
|---|---|---|
| `Edit#1618:13` | BOOLEAN | true |
| `Delete button#1618:6` | BOOLEAN | true |
| `Add address#1618:2` | BOOLEAN | true |

### Version 2 components (prefix "2.")
| Component | Type | Key |
|---|---|---|
| 2. Forms / Provided Personal Info | COMP | `d9195ae65dd513afcc1e21c1f4eb019ff630ec97` |
| 2. Forms / Personal Info | COMP | `434055fb687a1c96c8e127cd437443695290b3ed` |
| 2. Personal info / Address | COMP | `d23e2e9d5c141bc7a0427f7c06920ba1bb923b02` |
| 2. Personal info / Extracted information | SET | `68bee779f32ae3675eef16f1b17535595bb9d099` |
| 2. Personal info / Applicant data | COMP | `17c8e013a48ae57f1f7a47ee8f02739d9029d733` |
| 2 Personal information | COMP | `105a7b021934979f24d1c3ae843a5df11af705eb` |
| 2. Personal info / Address / item | COMP | `24a3bb00003774660cf8a95d356c20cc24ab0500` |
| 2. Forms / Address / Item | COMP | `a72b20ce79cb52291342626f38ef59a25a2a86c2` |
| 2. Forms / Address | SET | `d1418baadf8ded9efdf03a23d75401ac43484fa3` |
| 2. Forms / TIN | SET | `435328fac252a1d6fc2c9a01b85afb854420c8e4` |
| TIN | COMP | `fd0a9be2f8025cc3fac8337c1761f26f67356134` |
| Tax info | COMP | `0bb264f26d581595f8da3a52868b22795a6e7c36` |
| Action Applicant data | COMP | `fafac083cd90ee558e53931d12b62d188b08dabf` |

---

## Page: Summary panel

| Component | Type | Key | Variants |
|---|---|---|---|
| **Summary** | SET | `92422f0c18fc1fee864b481b5c9d2728a8f5d70b` | 6: Collapsed x Role (GM/Admin/God) |
| **Summary / Level** | SET | `2d2ceb77ed88a1a55bd28fbedc2c610ced1cfd23` | Collapsed=Yes/No |
| **Summary / Level / Step** | SET | `f033e4705ee3bdd6d23940e2dd6bf149cdbbb9f3` | 48 variants: Type x State x Icon only |
| Summary / Level / Previous levels | SET | `39f56a5153c47a12b07108cbb67ea3a922b2f345` | Icon only=yes/no |
| Summary / Level / Rejection info | SET | `2fcf4e72fe03d858deb159369a3fa4fbd4c045b9` | Status=Resubmission/Final rejection |
| Summary / Level / Videoident | COMP | `8bd6df524f442005e48b734a65f9e7f506cb437d` | Videoident call section |
| Message for applicant | COMP | `dd9ebde52f11537c36a7b8c1d05eb1217cecb610` | Message block |

### Summary properties
| Property | Type | Default |
|---|---|---|
| `Change AP buttons#4228:1` | BOOLEAN | true |
| `Moderators button#3696:3` | BOOLEAN | true |

### Summary / Level properties
| Property | Type | Default |
|---|---|---|
| `VideoIdent#3798:0` | BOOLEAN | false |
| `Rejection info#3797:0` | BOOLEAN | false |
| `Pending alert#1886:0` | BOOLEAN | false |
| `KYB type tag#1589:0` | BOOLEAN | false |

### Summary / Level / Step types
ID, Payment method, Selfie, Proof of address, Phone verif, Email, Questionnaire, Applicant data, Non doc, Company, Company docs, As-d parties

Each type has Default/Hover states and Icon only Yes/No options.

### Summary / Level / Rejection info properties
| Property | Type | Default |
|---|---|---|
| `Rejected docs#5964:0` | BOOLEAN | false |

---

## Page: Overview (APCardCollapsible)

| Component | Type | Key | Variants |
|---|---|---|---|
| **APCardCollapsible** | SET | `cc6745d97b3b9e7ac0a149ad577630de096b8bc1` | Collapsed=Yes/No |
| **APCardCollapsible/HeaderChecks** | SET | `0c607889293e21820454545de96d23d10f928439` | 5 variants by Status |
| **Overview by Summy** | SET | `ca1fbf613bb10b47412488866957ed91f2304618` | AI summary |

### APCardCollapsible
The main expandable card used throughout the AP page. Contains:
- Header (APCardCollapsible/HeaderChecks) — icon, title, chevron, status badges
- Content body — section-specific content

### APCardCollapsible/HeaderChecks variants
| Status | Description |
|---|---|
| Default | No status indicator |
| Approved | Green check |
| Rejected | Red cross |
| Pending | Yellow clock |
| (5th variant) | Additional status |

---

## Page: Master page

| Component | Type | Key |
|---|---|---|
| Payment methods – Body layout | COMP | `15374ec8c215fcbbe20932181af6ad86759d6e7c` |

Contains Block Title + Payment methods table + APCardCollapsible.

---

## Shared/Cross-page components

These appear on multiple pages or are used across the AP page:

| Component | Type | Key | Source Page |
|---|---|---|---|
| **Initiate action** | SET | `ab451baf05ec497e3ea0310987917fff1d49c682` | (from importability doc) |
| **Manage level** | SET | `0af86b14a405d8c5afdc506cc3498352ce544783` | (from importability doc) |
| **Content / Personal info** | COMP | `a36738a34c07808e6da1a279fe81276d75123262` | (from importability doc) |
| **Content / Provided Personal Info** | COMP | `f942a2e20774d529d7e53074afab4023eceea425` | (from importability doc) |

---

## Importability Summary

### Confirmed importable (use these keys with importComponentSetByKeyAsync / importComponentByKeyAsync)
| Component | Key | Type |
|---|---|---|
| AP page header | `afde096fe83bb6a2e474c175e55dd73856303a1a` | SET |
| Body / Title (Block Title) | `788264d18f2cc9e75e464416c0cae74fbcd37da8` | COMP |
| Body | `b7f51135fb0d86dd346af5587ec1d701703db6e5` | SET |
| APCardCollapsible | `cc6745d97b3b9e7ac0a149ad577630de096b8bc1` | SET |
| APCardCollapsible/HeaderChecks | `0c607889293e21820454545de96d23d10f928439` | SET |
| Applicant status | `b15e79670bd60789fe6b7d0b958016c683011f15` | SET |
| Applicant notes | `0f1ba9b45209163bb9ae5ba43abdca89cc806ff7` | COMP |
| Applicant notes / Input | `ca9a7f23a77be86287d21dd0f1a3b318b7ec0e33` | SET |
| Initiate action | `ab451baf05ec497e3ea0310987917fff1d49c682` | SET |
| Manage level | `0af86b14a405d8c5afdc506cc3498352ce544783` | SET |
| Document | `34687e2ab77282287cc7b44a2bb06b0aa8bd9b36` | SET |
| Document / Actions block | `a3acd606afc78a657b2714af6dd638c15734b54e` | SET |
| Document / Form | `27812c1486949b9e7d16758fa296b32d69fabf86` | SET |
| Overview by Summy | `ca1fbf613bb10b47412488866957ed91f2304618` | SET |
| Personal info | `eb39701397ce07f5d0200cb2e8b3714fd695b75d` | SET |
| Personal info / Applicant data | `72b025c8c706a7e7b277e7ee2183b8012bfab6b5` | SET |
| Personal info / Address | `25085e3400dba5aa032f7698097ae71fb9a0fde1` | SET |
| Content / Personal info | `a36738a34c07808e6da1a279fe81276d75123262` | COMP |
| Content / Provided Personal Info | `f942a2e20774d529d7e53074afab4023eceea425` | COMP |
| Summary | `92422f0c18fc1fee864b481b5c9d2728a8f5d70b` | SET |
| Summary / Level | `2d2ceb77ed88a1a55bd28fbedc2c610ced1cfd23` | SET |
| Summary / Level / Step | `f033e4705ee3bdd6d23940e2dd6bf149cdbbb9f3` | SET |
| Photo | `9352939d0664d385ca99d63b25cdff6a4ee1404b` | SET |
| Photo / Header | `58222c6ea8f989a946ef18eb8ac95569be3d99e6` | SET |
| Photos drawer | `9e47a0a37b3546eca39eb0f1cd30b1d098cabd77` | COMP |
| Risk labels (by group) | `4c2620c0321aa56d8211a88e9f188cefff7932bf` | SET |
| Risk labels block | `78e549bc6b45b0af94ca01cdbf8e82b3ae64ff5a` | COMP |

### Internal (dot prefix, NOT importable independently)
- `.Content / Events` — use via Body component
- `.Content / Events / Event item` — internal
- `.Events` — internal
- `.IP details` — internal
- `.Header Full Screen Page / Subheader` — inside AP page header

### Macket-only wrappers (NOT importable)
- **Actions** (`88e04a8eadf8d9fcd6f5ae6823aeff7ab8b0c85c`) — build manually with Block Title + CheckCollapsible
- **Subheader** (`c78bdbfc08cbff8f5a996dc9733b759d8d06e96d`) — part of AP page header

---

## AP Page Section Assembly Guide

### Standard AP page structure
```
Root (1440 x 900+, NONE layout)
├── AP page header (y=0, h=152)
├── Body frame (y=152, VERTICAL, gap=16, pad 24/32/64/32)
│   ├── Section 1: Personal Info card
│   │   └── APCardCollapsible (Collapsed=No)
│   │       ├── HeaderChecks (Status=Default, icon=personal-info)
│   │       └── Content: Personal info / Applicant data
│   ├── Section 2: Documents card
│   │   └── APCardCollapsible
│   │       ├── HeaderChecks (icon=card)
│   │       └── Content: Document component
│   ├── Section 3: Checks (may be multiple cards)
│   │   ├── APCardCollapsible (Selfie check)
│   │   ├── APCardCollapsible (Phone check)
│   │   └── APCardCollapsible (Email check)
│   ├── Section 4: Risk labels
│   │   └── Risk labels block
│   ├── Section 5: Notes
│   │   └── Applicant notes
│   └── Section 6: Events
│       └── .Events (internal, via Body)
└── *Sidebar* (x=0, y=0, collapsed 52px, Categoty=Applicant page)
```

### Section content mapping
| Section | Header icon | Content component |
|---|---|---|
| Personal info | normal/personal-info | Personal info / Applicant data SET |
| Documents | normal/card | Document SET |
| ID check | normal/card | Photo + Document / Form |
| Selfie | normal/selfie | Photo (selfie-specific) |
| Phone check | normal/phone | DS components (phone verification result) |
| Email check | normal/mail | DS components (email verification result) |
| Address | normal/location | Personal info / Address SET |
| AML screening | — | Custom AML content |
| Risk labels | normal/tag | Risk labels block COMP |
| Notes | normal/chat | Applicant notes COMP |
| Events | normal/history | .Events SET (internal) |
| Actions | normal/tasks | Block Title + manual CheckCollapsible list |

### Two-column layout pattern
Some AP screens use side-by-side cards:
```
Row frame (HORIZONTAL, gap=16)
├── APCardCollapsible (left, fill)
└── APCardCollapsible (right, fill)
```

### Summary panel (left side, Pattern 2)

Columns: **52 (DS sidebar) + 380 (Summary) + 1008 (Body) = 1440**. Sidebar is its own column, NOT an overlay — header/summary/body all start at x=52.

```
Root (1440 x scroll)
├── *Sidebar* (x=0, y=0, w=52, Type=Applicants, Collapsed=True)
├── AP page header (x=52, y=0, w=1388, h=152)
├── Summary panel (x=52, y=152, w=380, h=747)
│   └── Summary SET (Collapsed=No, Role=Admin)
│       └── Summary / Level
│           └── Summary / Level / Step (per verification step)
└── Body (x=432, y=152, w=1008)
    └── (content cards, pad 32px sides → cards 944px wide)
```
