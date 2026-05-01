# CM (Case Management) UI Kit — Component Catalog

> Library: `aliMPfTYbtejljPNj9Fbwz` (Case Management Components)
> Full scan: 2026-04-28 via Plugin API.
> Total: 60 component sets + 35 standalone components = **95 importable**.

---

## Page: Overview (3:210)

> Used in `P5ADMBMcKZ4E4V0VKMOTU2` (Overview for managers — Majestic Overview)

| Component | Type | Key | Variants |
|---|---|---|---|
| `.Blueprint row` | SET | `2a94d1355c29e608be26169c4e5ee97406df65e8` | State=Default/Hover |
| `.Case with report row` | SET | `bf02143f485bc44b4c6c383d59b67cf0861acf04` | State × Open (4 variants) |
| `. CM Overview content / Cases with FIU reports` | SET | `67d5a7ce599ac96477db01ccf585ba9b87ec7218` | Empty=Yes/No |
| `.Quick link icon` | SET | `72a5f3c23b8cd1220f2271331ba365623f2a7aa1` | Type=To resolve / Awaiting user / Resolved today |
| `.Quick link row` | SET | `b0272cba1ab5dd362deb4c37e75b6cad87d03852` | Type × State (6 variants) |
| `CM Overview block - Your resolved cases` | SET | `a7fd2feec642f63f8c4d6f628499698cda7174c3` | Empty=Yes/No |
| `.Quick links header` | SET | `160795c9280c3f69120c3a9b095849204a724aa7` | User status=Online/Offline |
| `CM Overview block - Upsell` | SET | `af8a604f9acda1b47bf8c0f2dde415bae210a95c` | — |

| Standalone | Type | Key |
|---|---|---|
| `CM Overview block` | COMP | `e122c7ff3b6bee01a30f8c54d9e2e1581664f448` |
| `. CM Overview content / Open cases in blueprints` | COMP | `b9cced3e6223ceadf0c3d05c38fd610b36902e91` |
| `CM Overview block - Quick links` | COMP | `bc325f8707a5ad577f0c0a4e16feb6e01008a3ba` |
| `.CM Overview - First row` | COMP | `ddfe9dfd0bc1b07158cd7a84b80ef4ff06e3c00c` |
| `Summy+reports illustration` | COMP | `4dd71900e4d48742757b3a7356e29f0f01b6c343` |
| `*Empty state CM Overview Page*` | COMP | `7b25907c9178840af8ab35d2a579d53b60d84619` |
| `.Use case block` | COMP | `f626a72b493654ca8ea4de87612990a835e00295` |
| `.Onboarding Screen/1` | COMP | `48b87cfce8cce4a75503d3d5a2fd9dd8bbb42f17` |
| `.Use case blocks` | COMP | `b11062cafb807359440eab2a793c3180e6edfa00` |

---

## Page: My cases / All cases (6:17030)

> Used in `p9dbXiQTeloyS45eW5P3JV` (Cases queues)

| Component | Type | Key | Variants |
|---|---|---|---|
| `Case table` | SET | `461547c5d85f3150bf5c6a944540f462e0a71502` | Empty=Yes/No |
| `.Case creation source table cell` | SET | `f436cc162899d26cbad8400fd88e4eea99741596` | Type=Transaction rule / Manual / Workflow builder / ... (5) |
| `.Case table row` | SET | `dbb6896659fd9c2b256d11bdfe319d39f1ace9f3` | Resolved=Yes/No |
| `.Case details table cell` | SET | `4d460e26c770ea639be9677e1809c4af349da60b` | low / medium / high prio |
| `.Case due table cell` | SET | `3a4561d2435efcbf9a8b625378868d1fc18208da` | normal / empty / <24h / ... (4) |
| `.Case assignee table cell` | SET | `3d2db3756a88c6424505211ef2d317d21085e82f` | unassigned normal / assigned / unassigned <24h left / ... (4) |

| Standalone | Type | Key |
|---|---|---|
| `.Case table header` | COMP | `f62e1ead2e8d10dc311438007b71b1f7481f2bb7` |
| `Illustrations/Case` | COMP | `556dfab9b819b5a9ef33101069f59b232253a80b` |

---

## Page: Case page (6:17031)

> Used in `ieTGS0ab6tqr3zwXRYPHIu` (Case page).
> 16 sets + 9 components — most complex page in the kit.

### Page chrome
| Component | Type | Key | Variants / Notes |
|---|---|---|---|
| `Case page header` | SET | `070118da7e99782ee06a25dad0550673e6fe50cb` | 2 variants. **1440×88** at top. |
| `.Case status in page header` | SET | `c5c44f2079e87b2f2628fb1424bdf6aca65a2fa4` | 2 variants |
| `Case page right column` | COMP | `768dad457da2d43a126b83475e5a3a1d09891615` | **424×804** right column container |
| `.Right Column Header` | COMP | `ccc9512fe54d55aad855031af9a68f0ad137e124` | — |
| `.Case page notes` | COMP | `970fb5776ec513ac181f6ddb01a115564f5eef2e` | Right column block |
| `.Case page checklist` | COMP | `96bb9c48ac90f2a52646d074eeaae2b1e274c11d` | Right column block |
| `Case page Overview tab content` | COMP | `937dcc919d4d8006fd792aceda340bd7da1a0cd0` | Left content (992 wide) |

### Status / actions
| Component | Type | Key | Variants |
|---|---|---|---|
| `Case status` | SET | `c0871215d3f6ce44bdc20a1620835ba59cefc679` | 4 variants |
| `Escalate case` | SET | `bd66b4eae450c97175e656d07ceb2070b532cbdd` | 4 variants |
| `NEW Escalate case` | SET | `07b80c275b397d3731b44338f0e431acb2b3f47f` | 2 variants — newer version |
| `.Case resolution alert – instances require action` | SET | `266077fd3486673cbbf1daaaf17c627a019a1e68` | 3 variants |
| `Transfer case` | COMP | `8c1a0ea49ef2b1f6eea9315ff80e7e3f7da36b84` | Modal/drawer body |
| `Resolve case` | COMP | `08c0c97ffbfe5b85d732241fd4791c7f83e11578` | Modal body |
| `Generate report modal content` | COMP | `300e5efffb51c168c9f7e52cbde2a8c0f0ef72ab` | Modal body |

### Case info widgets (right column / header detail)
| Component | Type | Key | Variants |
|---|---|---|---|
| `Case page info` | SET | `af671dda0907f622b6a864485322a6562f7b9a95` | 2 variants |
| `Case page info / Case due` | SET | `321e2f2ce6737707a9538892d43d9bf6d83c16a7` | 3 variants |
| `Case page info / Case assignee` | SET | `ccf7dd718d3e080d8ca99e70932cf6b7fee526d5` | 5 variants |
| `Case page info / Case priority` | SET | `0ff997946732755516ecc4c8d4ab802a70a3f4dd` | 3 variants |
| `Case page info / Internal assignee SLA` | SET | `09e3a4f2b6464c0ceeb355075f5e089f2581ba0a` | 3 variants |
| `.Case page applicant info` | SET | `a868f5a798c2940bf4624e59139b5caa7fd488e9` | 2 variants |
| `.Case creation source` | SET | `3acdb6b99652bb53fcb535b081c339710b820e69` | 5 variants |
| `.Review needed` | SET | `440498bc82ae0c652ee6285108823448b7f5b2c5` | 3 variants |
| `.Progress bar` | SET | `6071fafc161938a42b8b2e2bc68f4016a8c71b9b` | 11 variants |

### Events log
| Component | Type | Key | Variants |
|---|---|---|---|
| `CM Case events` | SET | `54e8b881c703795af3c63b5ee86c0ab01116d7d2` | **23 variants** — biggest set on Case page |

### Notes drawer
| Component | Type | Key |
|---|---|---|
| ` CM Notes/Drawer Content` | COMP | `3e6bd4f8399f0228cc686fa1bbf5598c0a7c79d0` |

---

## Page: Blueprints (6:17048)

> Used in `dtgJZJmVO1VPCr3fI5MohS` (Blueprints settings).
> 19 sets + 7 components.

### Settings table view
| Component | Type | Key | Variants |
|---|---|---|---|
| `Blueprints table` | SET | `f2e57766627c9317723b76167a1f8f99a43cc13b` | Empty=Yes/No |
| `.Blueprints Table Row` | COMP | `c40b11d32b78fd105019a680735d0863fe0931b6` | — |
| `.Case template card` | SET | `b631626d422db738f2a12f0763d8e7f5067388ce` | 9 variants |
| `Case template card group` | SET | `184e43c902ad7d374f16745aa32dbadfa1b9afb3` | 6 variants |
| `Preset Select` | SET | `d9d0e8254752a08cb68192bd00e595dd3a90c6f3` | 2 variants |
| `Preset illustration` | SET | `0d7086abe0d74f4c31f7cbb2c88072023d9b9963` | **15 variants** |
| `Blueprints table/.Case template card/.Advantages` | COMP | `848c0524390a688228634b593d5a02fbed8bcbe1` | — |
| `*Empty state Blueprints Page*` | COMP | `1e7eab8d2707ccfd01c7502f7ddb5860f9acde53` | — |

### Blueprint editor (detail page)
| Component | Type | Key | Variants / Notes |
|---|---|---|---|
| `Blueprint header` | SET | `304aa0d104cb87315bf1a6578681b6b266bc70ee` | 2 variants. **1388×112** at x=52 |
| `Blueprint body` | SET | `ba1944a3ab5236a21edf7c7319a3ac232914326d` | 2 variants |
| `Blueprint case content` | SET | `37a72e372d7ed84542143ca17f1682191ce0f98f` | 9 variants |
| `.Blueprint case content – content` | SET | `89f9267fd776650eeb02e4b7d4b3d77ed03c1461` | 9 variants |
| `Blue print side content` | SET | `12f6c7206944b00b813ae8115624814e2cd96f3d` | 2 variants |
| `.Blueprint block – checklist` | SET | `6690da8c218e6d8b6d3a063ebdaa99c5f63ca334` | 2 variants |
| `.Assignment types` | SET | `8c1a681317381f38c977afcb3bb4c99e4bc4141c` | 2 variants |
| `.Blueprint overview item` | SET | `cfc789e4be1f1520b46fda2c449d3ae4bd798501` | 2 variants |
| `Blueprint general settings` | COMP | `176257c2384cabe2db5319159678a1428d6d9f0c` | — |
| `Blueprint overview block` | COMP | `85e53c36c20e398567618d174082ae480a68eb5f` | — |
| `Blueprint Case creation source tip` | SET | `b115ed22e17434d76181d436cde818b6b8599acd` | 4 variants |
| `.Case creation source` (blueprint context) | SET | `c28b22f2f93d468f97e7acb397184408e15bf191` | 10 variants |

### Case routing
| Component | Type | Key | Variants |
|---|---|---|---|
| `Case routing` | COMP | `a763994f309c8a597cff269c880b40e1a6a201d7` | — |
| `Case routing / Options` | SET | `4bde4d74ec2286c55c8d3995ca2f82f312336c6e` | 6 variants |
| `Case routing / Options / 4-eyes` | SET | `6f4b1a2fb57c56a32d27dde82b3d51dd86e62d01` | 2 variants |
| `Blueprint Receive escalation tip` | SET | `511827fa01c3f8bfe2e6e0e1be56c30b5f14393d` | 2 variants |
| `Blueprint Receives 4-eyes review from tip` | SET | `4cbf402009c70a01dfb1779963e7d813ae21e025` | 3 variants |

---

## Page: FIU report templates (6:17049)

> Used in `86VzYfJdRwSvvpdJ2cGsX0` (Report builder).
> 11 sets + 8 components.

### Templates table
| Component | Type | Key | Variants |
|---|---|---|---|
| `Report settings table` | SET | `44e4626be3334508a7f2a8dc1c771b1d81451b9d` | Empty=Yes/No |
| `.Report settings table / Row` | COMP | `f792e1b66dd745fc13f3f7e4d945f4432f10c918` | — |
| `.Report settings table / Header` | COMP | `d753f233064fdeb2064b934f295ab2f31fd7f4cd` | — |
| `.Create report template` | COMP | `292aab57a39c653b0fd7c3bc9af85ba1b727109a` | — |

### Report builder (editor)
| Component | Type | Key | Variants / Notes |
|---|---|---|---|
| `Case report template header` | COMP | `b3d95fc0e80dbb546c50cb707b6d40a8a4f28adf` | Page header for editor |
| `Report builder page layout` | COMP | `38e80e9ca92af1017b80cb7eed2a97d07125584f` | Layout shell |
| `Report builder fields` | COMP | `9d29ff54acec1a1aabceb6b19d4bee4f7eff7f5f` | Form area |
| `Report builder drawer` | SET | `5f439a1ac284428f2e62c8d29d52285840c640a4` | 5 variants. Right-side drawer for field selection |
| `.Report builder drawer row` | SET | `6df7cc89a752476ad593efc116f6904e9f073ecc` | 4 variants |
| `.Drawer header with breadcrumbs and search` | COMP | `dc2db717009b4bb13ed91aaf60e9d91f96716613` | — |
| `.Report builder row` | SET | `e48ccc3ad5f575069690c062f1846c61a8d0b74b` | **21 variants** |
| `.Report builder collapsible row` | SET | `6c9c57757be9ee0f698322ee3b1ddb92f3b3c91a` | 2 variants |
| `.Report builder level 1 input` | SET | `95ebee0d1ca085807a9a63a3f44e9062793b2c26` | **16 variants** |
| `Report builder level 1` | SET | `ebcd55e8bb90efac6b0f177a299ec20ea1bcc7bb` | 6 variants |
| `Report content level 2` | SET | `1df854e7f177e618ff5431d847bb376d884be8bf` | 3 variants |
| `Report content level 3` | SET | `5e1c6acc54bf1d371cb332df457f2dc1a71ed004` | 2 variants |

### Breadcrumbs
| Component | Type | Key | Variants |
|---|---|---|---|
| `Breadcrumbs` | SET | `7d4b1bbe436823663e4b96afe0d33ae27ca38f0b` | 3 variants |
| `.Breadcrumbs item` | SET | `0215a48abd2f6f4b21f4e4b53e72bfae3d7cb163` | 2 variants |
| `.Breadcrumbs item ellipsis` | COMP | `0265353f231cbf6d88c5f38320d0efb19762c9d5` | — |

---

## Importability summary — keys for `importComponentSetByKeyAsync` / `importComponentByKeyAsync`

### Most-used (build a Case page or list)

| Component | Key | Type |
|---|---|---|
| Case page header | `070118da7e99782ee06a25dad0550673e6fe50cb` | SET |
| Case page right column | `768dad457da2d43a126b83475e5a3a1d09891615` | COMP |
| Case page Overview tab content | `937dcc919d4d8006fd792aceda340bd7da1a0cd0` | COMP |
| Case status | `c0871215d3f6ce44bdc20a1620835ba59cefc679` | SET |
| Case page info (full info bar) | `af671dda0907f622b6a864485322a6562f7b9a95` | SET |
| Case table | `461547c5d85f3150bf5c6a944540f462e0a71502` | SET |
| .Case table row | `dbb6896659fd9c2b256d11bdfe319d39f1ace9f3` | SET |
| .Case table header | `f62e1ead2e8d10dc311438007b71b1f7481f2bb7` | COMP |
| Blueprints table | `f2e57766627c9317723b76167a1f8f99a43cc13b` | SET |
| Blueprint header (editor) | `304aa0d104cb87315bf1a6578681b6b266bc70ee` | SET |
| Blueprint body | `ba1944a3ab5236a21edf7c7319a3ac232914326d` | SET |
| Report builder page layout | `38e80e9ca92af1017b80cb7eed2a97d07125584f` | COMP |
| Report builder drawer | `5f439a1ac284428f2e62c8d29d52285840c640a4` | SET |
| Case report template header | `b3d95fc0e80dbb546c50cb707b6d40a8a4f28adf` | COMP |

### Case row + cell components (for populating Case table)

| Component | Key | Pattern |
|---|---|---|
| .Case creation source table cell | `f436cc162899d26cbad8400fd88e4eea99741596` | Source column |
| .Case details table cell | `4d460e26c770ea639be9677e1809c4af349da60b` | Priority column |
| .Case due table cell | `3a4561d2435efcbf9a8b625378868d1fc18208da` | Due / SLA column |
| .Case assignee table cell | `3d2db3756a88c6424505211ef2d317d21085e82f` | Assignee column |

### Internal (dot prefix) — usually NOT imported directly

Dot-prefixed components (`.Case template card`, `.Quick link row`, `.Blueprint case content – content`, `.Report builder row`, etc.) are sub-components consumed inside their parent organisms. Don't import them standalone — set the parent's properties and the sub-instances are configured automatically.

---

## Source files (where to look for usage examples)

| File | fileKey | What's shown |
|---|---|---|
| Case page | `ieTGS0ab6tqr3zwXRYPHIu` | Tabs (Overview/AML/Related/Financial/Events), drawer overlays, modals (Resolve/Transfer/Generate report) |
| Overview for managers | `P5ADMBMcKZ4E4V0VKMOTU2` | Overview dashboard with Quick links, blueprint stats, Open cases blocks |
| Cases queues | `p9dbXiQTeloyS45eW5P3JV` | All cases / My cases / Blueprint queue list pages |
| Blueprints | `dtgJZJmVO1VPCr3fI5MohS` | Blueprint settings table + Edit blueprint detail (Pattern 2 with collapsed sidebar) |
| Report builder | `86VzYfJdRwSvvpdJ2cGsX0` | FIU templates table + Create/Edit template (full-screen builder with drawer) |
| **CM UI kit** | `aliMPfTYbtejljPNj9Fbwz` | **All keys above** |

See `.claude/figma/case-management-pattern.md` for layout patterns + assembly recipes.
