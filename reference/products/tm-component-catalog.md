# TM (Transaction Monitoring) UI Kit — Component Catalog

> Library: `jH0zp9iwzizayCPZNggytx` (TM Components)
> Full scan: 2026-04-28 via Plugin API.
> Total: ~65 components across 5 pages.

---

## Page: ↪ General + Finance

> Main hub — transaction headers, transaction details, AML checks, customer cards, matched rules, notes, events.

### Component Sets

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| `Header` | SET | `5a602ffa3da5af98bd60933eaf9e2871b138adf1` | 10 variants. `Scope`: Finance/Login/Signup/Onboarding/Gambling bet/Gambling limit change/Password change/2fa reset/Travel rule/iGaming bonus change |
| `Header / Finance` | SET | `1fcc7d73759e1feaa9c2e4af4b487344ba398fcb` | 16 variants. `Status`: Rejected/Approved/Requires action/Awaiting user; `Confirmed`: Yes/No; `Direction`: Outbound/Inbound; `Inactive applicane` (bool) |
| `Header2` | SET | `03f020d17654761eb46f5881dd37fb2a19d80609` | 9 variants. `Scope`: Finance/Travel rule/Login/Signup/Onboarding/Gambling bet/Gambling limit change/Password change/2fa reset |
| `Header2 / Finance` | SET | `e8f1889788a4bf3188c9d37818e950cc44ac389f` | 16 variants. `Status`: Rejected/Approved/Requires action/Awaiting user; `Confirmed`: Yes/No; `Direction`: Outbound/Inbound; `Inactive applicane` (bool); text props: Counterparty, Applicant |
| `Transaction details` | SET | `ee0681d830cdfd3ea0bcb956919ea7e5f5a6f664` | 5 variants. `Type`: Finance/Crypto/Travel rule/Gambling bet/Not finance |
| `Customer card / Applicant` | SET | `03e19780a47b5da0e75fb3de58db83be40667813` | 3 variants. `Device`: Yes/No; `Data available`: yes/no; `Risk labels` (bool); `Unhosted wallet` (bool); `Total score` (bool) |
| `Customer card / Counterparty` | SET | `8a431d6ef367e6b10b838a2ff686e00f4ef54c34` | 3 variants. `Device`: Yes/No; `Data available`: yes/no; `Unhosted wallet` (bool); `Total score` (bool); `Applicant tags` (bool) |
| `Customers card / Finance` | SET | `534106fc993b94989980e1386884bc6cb875ce35` | 4 variants. `Direction`: Inbound/Outbound; `Type`: Default/TR |
| `AML checks` | SET | `35baebe8ee1c69d2cf72f5501539cf8a7c938719` | 2 variants. `State`: Default/Promo; booleans: Applicant, Counterparty, Counterparty institution, Payment details |
| `Matched rules` | SET | `3fd192092caa136c79d237baeaab88c52799c22e` | 2 variants. `Property 1`: Default/Scheduled event; `Failed rules` (bool); `Test rules` (bool) |
| `Matched rules / row` | SET | `f068e0a498d308eb20e9f8ac562e2adbab55f402` | 5 variants. `Property 1`: Default/Expanded/Failed expanded/Failed/Scheduled events |
| `Notes` | SET | `871657f0527a317bce772ce6a9b50c24b7816c48` | 2 variants. `Empty`: No/Yes; `All notes button` (bool) |
| `Notes drawer` | SET | `718c2bb4d0ea0d2759cd6b7cecc24a11e1de29ac` | 1 variant |
| `Properties` | SET | `0ed24adecaa0a55a6697881676f7ce9e50bcb719` | 3 variants. `State`: Collapsed/Expanded/Empty; `View all` (bool) |
| `Risk labels` | SET | `753e03b6ddf7956411ce30af09e924bac764e7ad` | 2 variants. `Empty`: No/Yes; booleans: Email, Selfie, AML, Cross check, Person, Device, Phone |
| `Editable props` | SET | `97318448db57447b8ae81576358c2f243b770031` | 2 variants. `New props`: No/Yes |
| `Generate test transaction` | SET | `67ccad76956ceb0c5ffac4be5905c1a6000b8a66` | 2 variants. `Tab`: Form/JSON |
| `Emulate request from counterparty` | SET | `186531fd671f66f133915e38d5b971cf1dfaeec9` | 2 variants. `Tab`: Form/JSON |
| `Anomaly score` | SET | `a9a1fad68235526ca942f9fe578e9be5e6f6afb8` | 3 variants. `Score`: High/Medium/Low; `Modified` (bool) |
| `Check` | SET | `d0f90f39cbf08f83096a21f0a3ea04b2d55cd39d` | 2 variants. `Expanded`: No/Yes |
| `Checks / Bar` | SET | `bae716594c3f62624dc8eca7fb5255cbc416dc00` | 3 variants. `Property 1`: 75%/30%/100% |
| `Row` | SET | `40b1243891e9c8083aeeb98fc9d3f30f3055f9da` | 10 variants. `Value`: Green/Red; `Size`: 140/187/281/374/442 |
| `.Transaction Events / Item` | SET | `ec5e3fc366b95fa80e2e81483bef1530a02aeb73` | 11 variants. `Type`: Created/Reviewed/Assigned/Note added/Note deleted/Note edited/Status Rejected/Status Approved/Status requires actions/Tags added/Scored — **INTERNAL** |
| `Gambling bet info` | SET | `82c04110cb418a2523aaa01c9aa1c232acda96a4` | 3 variants. `Result`: Profit/Loss/No profit/loss; `Default amount` (bool) |

### Standalone Components

| Component | Type | Key |
|---|---|---|
| `Header / Login` | COMP | `3943bcebd5af0d0507024f5408e245f034c8f4b7` |
| `Header / Signup` | COMP | `7d463407812f6f9ab77ab6e116d84a10f0d45e2c` |
| `Header / Onboarding` | COMP | `609b119dc1b7aa395435249ec092c061ed466ec9` |
| `Header / Gambling bet` | COMP | `849601dd0a7c0ca053d37e30430b8e4995dbcab6` |
| `Header / iGaming bonus change` | COMP | `a04f108e26141385764b3c01a5ef6f69c7f7168a` |
| `Header / Travel rule` | COMP | `828bdc268b844440817563294acc383bc6747fce` |
| `Header / Gambling limit change` | COMP | `c412c6a73a896a3c8cfbbd72a1f7827a05785bb5` |
| `Header / 2fa reset` | COMP | `3bfbfba07ddf1baca7d8cc4350ca45fc3837f6de` |
| `Header / Password change` | COMP | `14f505dc7067b4ce913cbe4e77a647a4717ba3e3` |
| `Header2 / Login` | COMP | `be0b64968f0a1179140716bf438846cb86ab9149` |
| `Header2 / Signup` | COMP | `5d6ad8d4e457fbb1f34c965be0925853e9a455b2` |
| `Header2 / Onboarding` | COMP | `9632f24ac195bda194449dba4f2e1c63cc652cf7` |
| `Header2 / Gambling bet` | COMP | `09201508e63930ceb66cbffae06fe4cc09717ac8` |
| `Header2 / Gambling limit change` | COMP | `7fb698d493af4b8581b1e0c7db2b5bb5c9f1267f` |
| `Header2 / 2fa reset` | COMP | `028ce502920546a2b94748d1b4586964a8bbc58b` |
| `Header2 / Password change` | COMP | `d57029286d4dc895853853403b874695cac33331` |
| `Header2 / Travel rule` | COMP | `163b9ef7b4841785fae348d224fd8cf9e3eef43d` |
| `Events Block` | COMP | `63acbd0469d65498281e62c1cb57c28d484390eb` |
| `Decline transaction` | COMP | `2aa624185dc9aed1cd222da33e74f323b704e9a7` |
| `Block / Title h4` | COMP | `4bde54de49660f19a46a951bf2be5c77c8f2a14f` |
| `AML check card` | COMP | `366752cf11e7e186489d37140b2d45bc72c5a746` |
| `Value row` | COMP | `5d0bc4264fdfb60a2bd0edbc2caa0ffee39f05be` |
| `Risk Signals` | COMP | `7d09b6fc304db2765abcfce264baae98011ae397` |
| `Anomaly score` *(standalone)* | COMP | `9f701bcfe43e884315f3c53a98a9ae7d65f53e67` |
| `Popover content` | COMP | `1cb8a69426df932603956e887b2152b2b12e2fda` |
| `.Transaction Events` | COMP | `e399638b79f482ec4e22ff5d345fe17792d66ff3` — **INTERNAL** |

---

## Page: ↪ Travel rule

> Travel Rule specific components — VASP verification, beneficiary/originator flows, Chainalysis integration.

### Component Sets

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| `Travel rule` | SET | `493bbd581ae2a1569e9b0e17f4930a452518c1f4` | 5 variants. `Type`: Outbound/Inbound/Input data Inbound/Input data Outbound/VASP2 not verif |
| `Beneficiary` | SET | `535d02c6f8a798cb520342774d2ad91accddea7f` | 4 variants. `Verified VASP`: Yes/No; `Type`: Default/Input data/No data; `Banner confirm` (bool); `Name mismatch` (bool) |
| `Originator` | SET | `00d1505de1bc0d11bc4bc6d044b2acd7ab85cc87` | 4 variants. `Verified`: yes/no; `Type`: Default/Input data/No data; `Banner` (bool) |
| `Confirm beneficiary` | SET | `83bef5d194104cedb745913b2ca8376ab10ca35d` | 4 variants. `Type`: Select from list/Enter manually/Confirmed/Mismatched; `Data mismatched` (bool) |
| `Confirm beneficiary NEW` | SET | `cde5d7c3c8e8e3eefcc530b3b3376afcd8a1e5f4` | 3 variants. `State`: Default/Success/Mismatch |
| `Banner originator` | SET | `6c7d839e91f302eb27df56f48fc7e8dedf1f4610` | 4 variants. `Property 1`: Emulate request/Confirm orig and benid; `Property 2`: No/Enter/Yes; `Data mismatched` (bool) |
| `Chainalysis` (Travel rule) | SET | `32e8605a408c27e749eccfcfa38b13193f443f6c` | 2 variants. `Empty`: No/Yes |
| `Card` | SET | `a78b09059095162dfc1b9ee8ade667dac5b47dc5` | 3 variants. `Alert`: Yes/No; `Owner`: Yes/No |
| `Module` | SET | `34bb01c3c6742f1bdd981b331f9cae429fd3a58e` | 1 variant. Text props: Wallet owner, Main text, Wallet address |

### Standalone Components

| Component | Type | Key |
|---|---|---|
| `Unspent transaction output (UTXO)` | COMP | `b0bbfb23795db4bc1e49d9b83ecabcde87de00c5` |

---

## Page: ↪ Crypto

> Crypto screening components — Chainalysis, Elliptic, TRM Labs exposure tables and charts.

### Component Sets

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| `Transaction crypto info` | SET | `6c5f36081b44456591074334829e7e1ae08bcd70` | 3 variants. `Resolution`: Large; `Type`: Default/No data/In progress; `Highlight section` (bool) |
| `Chainalysis` (Crypto) | SET | `527696847b7f8abb5d7b4ea0cc67217343a97714` | 3 variants. `State`: Low risk/>Low risk/Empty |
| `Chainalysis / Exposure table / Row` | SET | `6d9ccb8af9f8454c052df43494d9f79460fec188` | 4 variants. `Risk`: Low/Medium/High/Severe |
| `Chart row` | SET | `849ab1bf9c03794543c1ffb18c8e810a12cdf427` | 4 variants. `Signal`: Low risk/Medium risk/High risk/Not found; text props: Text, Amount |
| `Elliptic` *(v1, Empty flag)* | SET | `f0d25420bda2f2c65293922a6308ec6756b3c457` | 2 variants. `Empty`: No/Yes |
| `Elliptic` *(v2, sources count)* | SET | `6d74b9fffbfb3cbaa13f96b2b8bd6d921e439b34` | 3 variants. `Type`: 5 sources/10 sources/Empty |
| `TRM Labs` *(v1, Expanded)* | SET | `2088e6d1df0708c20615cef183ad0868c47c9147` | 3 variants. `Property 1`: Default/Expanded/Empty |
| `TRM Labs` *(v2, basic)* | SET | `67277171f0e609b1792ce96b6445b9210eb5d4cb` | 2 variants. `Property 1`: Default/Empty |

### Standalone Components

| Component | Type | Key |
|---|---|---|
| `Chainalysis / Exposure table` | COMP | `e6080d0c04147b74d57f66f5f9f48a63fec859f8` |
| `Chainalysis / Triggers` | COMP | `81079cbc6b1a8787fa2bf09043326d100a0dfb8a` |
| `Elliptic / Exposure table` | COMP | `5c6fe3f4eddf098fdbb4715be9be7254ad9ffd8b` |
| `Elliptic / Exposure table / Row` | COMP | `4901450e66c18974b1c3f38d7d9170e5518c00fa` |

---

## Page: ↪ Non-finance

> Non-financial transaction type.

| Component | Type | Key |
|---|---|---|
| `Customer card / Onboarding` | COMP | `1fd73063fca1c687363a9759c2c76d7c7fb24528` |

---

## Page: Analytics tab

> Analytics dashboard components — charts, status overviews, relations map, betting metrics.

### Component Sets

| Component | Type | Key | Variants / Props |
|---|---|---|---|
| `Status overview` | SET | `b3313ad4d756ed5134f2111a08afc95423665f35` | 4 variants. `Tab`: All/Sent/Received/Empty |
| `Statuses` | SET | `1f39079d5f777510badab2f139783f17886f3c63` | 5 variants. `Property 1`: Default/Approved/Awaiting user/Rejected/Requires action |
| `Transactions statistic card` | SET | `1b4f4b7bf8b1fd7af856ac4b3e6372360288c810` | 4 variants. `Type`: Volume/Count; `Empty`: No/Yes |
| `Timeline / Financial` | SET | `7454f36b9769534cee61bda80a9f0e454f466892` | 2 variants. `Tab`: Volume/Count |
| `Timeline / Gambling` | SET | `efc0fce6f0ed16d65c216e511bec81979bb75bae` | 2 variants. `Filter`: Volume/Count |
| `Relations map` | SET | `02b7fe75a929a37613cc99c671ccdf15a1549fca` | 2 variants. `Property 1`: Financial/Non-financial |
| `node` | SET | `1e722f0da37d19f902ececff6408673eb90f07c6` | 6 variants. `Type`: Main applicant/Applicant/Device/Applicant payment method/Counterparty payment method/Counterparty; `State`: Default |

### Standalone Components

| Component | Type | Key |
|---|---|---|
| `Betting metrics` | COMP | `1e18fb90cea5c6ad9a1c713f04c29b8de6cc508d` |
| `Total bet volume` | COMP | `0b256d4e2e11fbbf168a18188cbd2665ed83fa36` |
| `chart legend` | COMP | `6931b96f8d3ecd68fca1d304dab5f557e2b8c23b` |

---

## Importability Summary

### Most-used (build a transaction detail page)

| Component | Key | Type | Use for |
|---|---|---|---|
| `Header / Finance` | `1fcc7d73759e1feaa9c2e4af4b487344ba398fcb` | SET | Transaction page header (status, amount, direction) |
| `Header2 / Finance` | `e8f1889788a4bf3188c9d37818e950cc44ac389f` | SET | Alternative Finance header (with text props) |
| `Transaction details` | `ee0681d830cdfd3ea0bcb956919ea7e5f5a6f664` | SET | Transaction info block (Finance/Crypto/Travel rule/etc) |
| `Transaction crypto info` | `6c5f36081b44456591074334829e7e1ae08bcd70` | SET | Crypto blockchain data |
| `AML checks` | `35baebe8ee1c69d2cf72f5501539cf8a7c938719` | SET | AML screening results |
| `Matched rules` | `3fd192092caa136c79d237baeaab88c52799c22e` | SET | Matched TM rules list |
| `Customer card / Applicant` | `03e19780a47b5da0e75fb3de58db83be40667813` | SET | Sender applicant card |
| `Customer card / Counterparty` | `8a431d6ef367e6b10b838a2ff686e00f4ef54c34` | SET | Receiver counterparty card |
| `Notes` | `871657f0527a317bce772ce6a9b50c24b7816c48` | SET | Notes block (with/without notes) |
| `Risk labels` | `753e03b6ddf7956411ce30af09e924bac764e7ad` | SET | Risk signal labels |
| `Anomaly score` (SET) | `a9a1fad68235526ca942f9fe578e9be5e6f6afb8` | SET | ML anomaly score badge |
| `Properties` | `0ed24adecaa0a55a6697881676f7ce9e50bcb719` | SET | Collapsible properties block |
| `Events Block` | `63acbd0469d65498281e62c1cb57c28d484390eb` | COMP | Transaction events timeline |

### Travel Rule components

| Component | Key | Type |
|---|---|---|
| `Travel rule` | `493bbd581ae2a1569e9b0e17f4930a452518c1f4` | SET |
| `Beneficiary` | `535d02c6f8a798cb520342774d2ad91accddea7f` | SET |
| `Originator` | `00d1505de1bc0d11bc4bc6d044b2acd7ab85cc87` | SET |
| `Confirm beneficiary NEW` | `cde5d7c3c8e8e3eefcc530b3b3376afcd8a1e5f4` | SET |
| `Banner originator` | `6c7d839e91f302eb27df56f48fc7e8dedf1f4610` | SET |

### Analytics / charts

| Component | Key | Type |
|---|---|---|
| `Status overview` | `b3313ad4d756ed5134f2111a08afc95423665f35` | SET |
| `Timeline / Financial` | `7454f36b9769534cee61bda80a9f0e454f466892` | SET |
| `Transactions statistic card` | `1b4f4b7bf8b1fd7af856ac4b3e6372360288c810` | SET |
| `Relations map` | `02b7fe75a929a37613cc99c671ccdf15a1549fca` | SET |

### Internal (dot prefix) — NOT imported directly

| Component | Key | Notes |
|---|---|---|
| `.Transaction Events / Item` | `ec5e3fc366b95fa80e2e81483bef1530a02aeb73` | Used inside `Events Block` |
| `.Transaction Events` | `e399638b79f482ec4e22ff5d345fe17792d66ff3` | Used inside `Events Block` |
| `.Notes` | `9d4f38ada85bfa4767c3663105f3186fa93dd4c7` | Used inside `Notes` SET |

---

## Duplicate Name Resolution

Several components share names — use the **key** to select the correct one:

| Name | Disambiguate by | Key A | Key B |
|---|---|---|---|
| `Chainalysis` | Page: Travel rule (Empty flag) vs Crypto (State-based) | `32e8605a...` (Travel rule, Empty=Yes/No) | `527696...` (Crypto, State=Low/High/Empty) |
| `Elliptic` | Variant structure: Empty flag vs Sources count | `f0d254...` (v1, Empty) | `6d74b9...` (v2, sources) |
| `TRM Labs` | Variant structure: Expanded vs Basic | `2088e6...` (v1, with Expanded) | `67277...` (v2, basic) |
| `Anomaly score` | Component type: SET vs standalone COMP | `a9a1fa...` (SET, 3 variants) | `9f701b...` (COMP, standalone) |

---

## Source Files

| File | fileKey | What's shown |
|---|---|---|
| **TM Components** | `jH0zp9iwzizayCPZNggytx` | **All keys above — the library** |
| TM Transaction page | `5irNYDkalXUObKIxKXQiy3` | Finance/Crypto/Travel rule/Gambling transaction detail screens |
| TM Transactions table | `4zG4nJT1s0mcVQDXuJjoJJ` | Transactions list, bulk actions, drawer, context menus |
| TM Settings | `B9Otn9QPpssNomSzADBNqF` | General/Travel rule/Scoring/AML settings pages |
| TM Rules table | `Swa6KOy5vBGGO1qIKNygYN` | Rules library, installed rules table, rule management |
| TM VASPs | `6IXCBfzK8slAZzHCzRPOy7` | VASP management, VASP onboarding, Travel Rule VASP config |
| Transaction Networks | `yHA20ZE0f6qdC2eyBlxpny` | Transaction network case pages, resolve case, initiate action |
| Rule page 2.0 | `bbp6LvphVT5J6QytzGJY6z` | Rule editor (Phase 1): conditions, actions, modes, AI rules, test mode |

See `.claude/figma/tm-layout-patterns.md` for layout patterns + assembly recipes.
