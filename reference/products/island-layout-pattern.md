# Island Layout — Dashboard (production model)

> The Dashboard layout since the island redesign: content lives in white rounded islands floating on a grey page, with the sidebar flush left.
> **Canonical source:** Base components `tJMo5DkqQUN0H6N8apN0N7`, page **Layout `8828:117083`** — variants plus the designers' usage specs. Ignore its `Archive` section.
> **Production merge 2026-09-29:** the layout moved from a branch into Base main and was republished. The model changed (nested `Page / Body` with seven layouts, islands, side panels), and **the `Page` key changed** — `ccd4779c…` no longer exists.
> **Designers' after-references rule (2026-09-29):** when the old screen has a designer-made "after" version (the migration test page names copies `… — before (ref <nodeId>)`), **read that reference first and match it** — composition, what sits in which island, and the variables (§6.1). A survey of all 45 references: every content block sits in an island — **tables, lists and empty states too**; the only blocks standing bare on the grey are ones that already are cards themselves.
> **Validated 2026-09-29** end to end on a copy of an old KYC level-editor mockup (`xhjtb7G71gVOawl0pOilSx`, output `22283:102978`): live `Page` instance, Ghost + 1084 + side content, each content group in its own `IslandCard`, header with breadcrumb, tabs and carried actions, height preserved, content centred 148/148.

---

## 0. THE ESSENCE — four decisions, then fill the slots

An island screen is **one live `Page` instance**. You never assemble the sidebar, island, card or header yourself — they are inside `Page`. You make four choices and put the content into slots:

1. **`Page` → `Type`** — `Basic` by default; `Full screen page` only for focused work on one entity (§2.1). Plus `Sandbox` Yes/No (§5).
2. **The nested `Page / Body` → `Content`** — for a **migrated** screen always a `◼️ … (Ghost)` layout: everything lives in islands, a lone table included (§2.2). `◻️ Default` only for a new screen the designer explicitly asks for as one white card.
3. **The nested `Page / Body / Default` → `Type`** — content width `1084 max` / `1920 max` / `Full width`, and `Show side content` if there is supporting content (§2.3).
4. **Fill the slots** — `Main content`, and when used `Side content`, the `Aside` panel, the `Section navigation`. In Ghost, **each content group goes into its own `Page / Body / IslandCard`**.

Do **NOT** hand-build the island from frames. Do **NOT** detach the instance. If you are about to call `figma.createFrame()` for an "Island" / "Body" / "Card" — stop and instantiate `Page`.

> **"Build / create island versions of these screens" is copy-mode migration.** Run the engine (§6.2: `build.js`, then `finish.js` in a separate call) on each source frame. The header carry-over lives only in the engine; hand-rolling "set title + tabs" silently drops the action buttons, status and tabs.

---

## 1. Anatomy

```
Page  (INSTANCE — set f9071958…; Ver=New × Type × Sandbox; bool Statusbar, Summy AI)
├── *Sidebar*        257 expanded (Basic) · 52 collapsed (Full screen page)
└── Island           VERTICAL, padding T8 R8 B8 L0, gap 8
    ├── Statusbar    (bool Statusbar) — trial / billing / incident bar ABOVE the island
    └── Main body    HORIZONTAL
        ├── Body     the card: radius 16, stroke #e5e7eb (#fad24a in sandbox), clipsContent=true
        │   ├── Sandbox alert   24h — only in Sandbox=Yes
        │   ├── *Header*        Basic → Type=Generic 56 · Full screen → Type=Fullscreen (Future main version) 97
        │   └── Page / Body     ← NESTED INSTANCE — layout axis `Content` (7 values)
        │       ├── Section navigation  240, slot `Items`            — Nav layouts only
        │       ├── Page / Body / Aside 400, slot `Content`          — Left layout (before Main)
        │       ├── Main
        │       │   ├── Page / Body / Default   ← `Type` = width; bool `Show side content`
        │       │   │   └── Body → slots `Main content` + `Side content` (380)
        │       │   ├── Actions bar             (bool Floating bars)  — Ghost only
        │       │   └── Page / Body / Bottom bar (bool Bottom bar)
        │       ├── Page / Body / Aside 400, slot `Content`          — Right layouts (after Main)
        │       └── *Drawer Basic*  504        (bool Drawer)
        └── AI Assistant 344  (bool Summy AI) — docked right inside the island
```

Layout math:
- **Basic:** sidebar 257 + island 1183 → card **1175**.
- **Full screen page:** sidebar 52 + island 1388 → card **1380**.
- Island insets are 8 top/right/bottom and **0 on the left** — the sidebar is flush against it.
- The sidebar is **257**, not 264 — an HTML shell elsewhere uses 264; the Figma canon is 257.

---

## 2. Choosing — rules from the designers' spec

### 2.1 `Page` → `Type`

| | **Basic** (default) | **Full screen page** |
|---|---|---|
| Sidebar | full, with section names (257) | collapsed, icon-only (52) |
| Header | Generic 56, search + actions | Fullscreen 97, breadcrumb + subheader tabs |
| Use for | dashboards, lists, forms, settings, regular pages | focused work on **one entity** (applicant page, case), canvas editors, SDK previews, detail views that need full width |

**Quick rule (verbatim from the spec):** *"default to Basic. Switch to Full-screen only when the content benefits from extra horizontal space and user requires focus working with an entity (applicant page, case etc)."*

This replaces the old "every drill-down is Fullscreen" rule. A level editor, a rule editor, a case, an applicant — Fullscreen. A settings sub-page that is just a form — Basic.

**Migration signal:** a ✕ (Close) in the old header means the screen is an entity editor → Full screen page with a breadcrumb.

### 2.2 The nested `Page / Body` → `Content`

| Value | Background | When |
|---|---|---|
| `◻️ Main (Default)` | white — one card | **Single block:** exactly one entity or one settings block. Forms, single-table pages, individual settings. |
| `◻️ Nav + Main (Default)` | white | the same, plus a section-navigation sidebar |
| `◼️ Main (Ghost)` | grey | **Structured content:** several entities or setting groups → **one `IslandCard` per group** |
| `◼️ Nav + Main (Ghost)` | grey | structured, with section navigation |
| `◼️ Left + Main (Ghost)` | grey | main content + a **left panel** |
| `◼️ Main + Right (Ghost)` | grey | main content + a **right panel** |
| `◼️ Nav + Main + Right (Ghost)` | grey | navigation + main + right panel |

*"Don't use Default for pages with multiple islands or any side panel. Use Ghost instead."* In the spec, `◻️` is labelled **White** and `◼️` **Grey**.

> **Migration: always Ghost, everything in islands — tables too.** Костя, 2026-09-29, on a sample where a table sat flat on the grey: *"все должно находиться в островах, и таблицы тоже"*. Every designer after-reference agrees: Payment methods, Devices, Transactions, Events log, Report settings, even `*Empty State*` — each in its own `IslandCard`. A single table page is `◼️ Main (Ghost)` with the table (and its Block Title) inside one island, not `◻️ Main (Default)`.

### 2.3 The nested `Page / Body / Default` → `Type` (content width)

| `Type` | Use for |
|---|---|
| `1084 max` | **forms, settings, single-column content, readable text.** Centred; can include a right-hand side column (`Show side content`). |
| `1920 max` | dashboards, analytics views, multi-column tables — anything where more horizontal data helps. Margins only on large screens. |
| `Full width` | heavy data interfaces with no max width (applicant page). |

`Show side content#23483:22` = true opens the 380 `Side content` slot next to `Main content` inside the same width. At `1084 max` this is the canonical **640 main + 64 gap + 380 side** — exactly the old KYC editor's form + overview.

### 2.4 Side panels — which one

| Question | Answer |
|---|---|
| Does the interaction change the core structure, or navigate to another section of the entity? | **Panel on the left** (`Left + Main`) |
| Is the user doing a focused, temporary task, or editing one sub-item? | **Drawer on the right** (`Drawer` bool, 504, non-modal, pushes content) |
| Is it persistent metadata or admin settings that don't change the main layout? | **Inspector on the right** (`Main + Right`, `Page / Body / Aside`) |

Left panel = navigation or controls that affect the main area. Right panel = notes, secondary settings.

### 2.5 Other parts

- **`Page / Body / Canvas`** — edge-to-edge editor with a dotted background, nodes and connections. **Workflow editors only.** Not for sequential rule lists or step builders — those are Ghost + right panel.
- **Bottom bar** (`Bottom bar` bool) — sticky page-level actions (Save / Cancel) inside the island, reachable while content scrolls.
- **Statusbar** (`Statusbar` bool) — account-level announcements above the island (trial, billing, incidents). Not the sandbox indicator.
- **Summy AI** (`Summy AI` bool) — the assistant, docked to the right edge inside the island.
- **Scroll** happens inside the island: it keeps its rounded shape and the scrollbar sits inside it. A table footer with pagination and bulk actions is pinned to the island's bottom edge.

---

## 3. Keys (verified importable from a consumer file, 2026-09-29)

### Components

| Component | Key | Notes |
|---|---|---|
| `Page` SET | `f907195876aad003b980b77d6e9471e9418a0941` | **the key changed in the production merge** — old `ccd4779c…` is gone |
| ↳ New / Basic / Sandbox=No | `416075ee47bfeaa6bb2af2c6d9c0e6aa42cfe654` | |
| ↳ New / Basic / Sandbox=Yes | `bd1c35e2729636c98f825ebbda3299a744296b0f` | |
| ↳ New / Full screen page / Sandbox=No | `f4bc3fe0518829fa8dd663e94bf2d43baf763260` | |
| ↳ New / Full screen page / Sandbox=Yes | `232a23ebb4eba2c27f49f7bcd423599def09e06e` | |
| `Page / Body` SET | `8aab14fc18dca0e4c85886e38dc337a1ad56f50b` | nested inside `Page`; axis `Content` |
| `Page / Body / Default` SET | `1fcbe28eda798209b6eb5c64c1ec7187b4710199` | `Type` = Full width `a3bd91e0…` · 1920 max `b07ace9e…` · 1084 max `acfbe0ec…` |
| `Page / Body / IslandCard` | `3595d612ef3d886a2dd9a4744add8b74f4ac9606` | slot `Slot#25553:0`, bool `Heading#26638:9`, slot `↪ Title end slot#29828:11` |
| `Page / Body / Aside` SET | `f7a41f1306d0c8f75553c8801c965294ad13fa39` | `Paddings` Yes/No, slot `Content#25573:0`, 400 wide |
| `Page / Body / Bottom bar` | `2037e3d864da0304353b295421b92d202ed2f605` | slot `Slot#24573:0` |
| `Page / Body / Canvas` | `fcf81f4f947bf5936ff036e251e98c01026ea5bf` | slot `Main content#23544:4`, bool `Drawer` |
| `Actions bar` | `cafdcaf97cce5f477442ceef58db31e562a9c180` | floating bar, Ghost only |
| `Actions bar / Island` | `5542edd9177a0b66b5f516a51f72d071751bce83` | slot `Content#23502:1` |
| `Heading` SET | `a091684f0950b62d772727002d12854b4321e23b` | Figma-only heading helper, `Mode` = Page / Card / Block |
| `*Header*` SET | `387e2cf61b1bf4f2045d3ccefecc5c7820a86889` | Generic `64ebf8f1…` · Fullscreen `1dd02328…` — use the one inside `Page`, don't import it |

Variant **keys are stable** across the branch, the old publication and the merge (`382d07f9…` was "Default White", is now "◻️ Main (Default)"). Variant **names and axes changed** — always set properties by the names in this doc, never by the old ones (`Type=Default White`, `Left side`, `Right side`, `Navigation Sidebar` no longer exist on `Page / Body`).

### Property names you will set

| On | Property | Values |
|---|---|---|
| `Page` | `Type` / `Sandbox` / `Ver` | `Basic`, `Full screen page` / `No`, `Yes` / `New` |
| `Page` | `Statusbar#23483:10`, `Summy AI#24227:0` | bool |
| `Page / Body` (nested) | `Content` | `◻️ Main (Default)`, `◻️ Nav + Main (Default)`, `◼️ Main (Ghost)`, `◼️ Nav + Main (Ghost)`, `◼️ Left + Main (Ghost)`, `◼️ Main + Right (Ghost)`, `◼️ Nav + Main + Right (Ghost)` |
| `Page / Body` (nested) | `Drawer#23483:6`, `Bottom bar#24573:1`, `Floating bars#26598:0` | bool |
| `Page / Body / Default` (nested) | `Type` | `Full width`, `1920 max`, `1084 max` |
| `Page / Body / Default` (nested) | `Show side content#23483:22` | bool |

The `◻️` / `◼️` characters are part of the value — copy them exactly.

### Tokens

| Token | Key | Value |
|---|---|---|
| page background `semantic/background/neutral/subtlest/normal` | `e7129860062f42ee2a929d1b4ccacd21133a03ee` | #f3f4f6 |
| card / island fill `semantic/background/neutral/inverse/normal` | `567811a0cf497ac911288a2f4a75a1d89ebff75c` | #ffffff |
| card border `semantic/border/neutral/subtlest/normal` | `40baade65c87f4b56fd67b027ec695d0984fae39` | #e5e7eb |
| bare card fill `semantic/background/secondary/normal` | `da81bccfef06f3de221bafbb9b5ee6a161eb9000` | #ffffff |
| table row fill `components/table/background-row-normal` | `b651c3b1b3a1d5b4066af62493435b81f3635acb` | #ffffff |
| grey area `semantic/background/neutral/ghost/normal` | `e50636958c4d5a6917b4fb1e32a7de92ded72f85` | #f9fafb |
| gap between islands `spacing/lg` | `2b3382099953af94f32cb6ffe5c7f44c74d5fed7` | 16 |
| sandbox border `semantic/border/yellow/subtle/normal` | `ed34b693cbe71abf562e9cb323ec44fc96bd3a94` | #fad24a |
| `border-radius/xl` | `03884e014085a48cf26670632be200a02b5a160c` | 16 |
| `spacing/s` | `5a8e4573770ee8f921f141c1ab6c96835c3125a0` | 8 |

`Page` and `IslandCard` bind their own. The rows added above are what **you** bind on migrated blocks — see §6.1.

---

## 4. Header — use the `Page`'s own header, configure it from the original

`Page` already contains a clean Version=New header of the right type. **Use it.** Read the old header's labels and apply them; the old header is discarded with the old frame.

```js
const hdr = page.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name) && n.visible);
hdr.setProperties({ "Title text#3817:0": title, "Key#5362:0": false });      // Key=false removes the stray 'Key name' badge
hdr.findOne(n => /Breadcrumb/i.test(n.name))?.setProperties({ "Name#6638:5": "Levels" });
// relabel the Subheader tabs from the original, hide the extras
const items = hdr.findOne(n => /^\*Tab Basic\*/.test(n.name)).findAll(n => /Tab Basic \/ Item/i.test(n.name));
items.forEach((it, i) => { if (i < tabs.length) { it.setProperties({ "Label text#4517:0": tabs[i] }); it.visible = true; } else it.visible = false; });
```

**Action buttons — carry the original's, exactly.** From the old header's action group (parent named `Buttons` / `Buttons Bar`) take the **ancestor-visible** buttons: text actions (`Create level`, `Save`, `Run level`) **and** the icon-only ⋮ kebab (`Content=Icon Only, Type=Secondary`). Skip the AI (icon Primary) and help (icon Tertiary) buttons — the `Page` header has its own. Then `Show actions slot#6943:20 = true`, clone each into the `Actions slot`, set `clone.visible = true` (clones arrive hidden), and remove the slot's default placeholder `Button`.

🔴 **Never flip the OLD header's `Version` Old→New.** That was a trick from before `Page` was published. The old applicant-context header surfaces junk when flipped (ClientNickname, ID, Suspicious, a default `Button`), and that junk is what made past runs abandon the instance and hand-build. It does not exist on the `Page`'s own header.

---

## 5. Sandbox — a state, detected by a VISIBLE indicator

Sandbox is the `Page` variant **`Sandbox=Yes`**: it brings the yellow card border `#fad24a` and the 24-high `Sandbox alert` as the card's first child. Never build either by hand; `Sandbox alert` is not importable on its own and doesn't need to be.

**Detection:** `sandbox = the indicator exists AND is ancestor-visible` — walk every parent's `.visible`. Old `Header-levels` headers carry a hidden "You are in sandbox mode" text in **every** instance; detecting by presence marked 26 screens as sandbox that weren't.

> The designers' spec text says *"A green statusbar sits above the island"* for sandbox. The component itself uses the **yellow** border and `Sandbox alert` — trust the component. The green bar is the `Statusbar` in trial mode, which is a different thing.

---

## 6. Migration — old full-bleed screen → island

A migration **re-lays out** the screen on the new layout; it never rebuilds content from scratch. Every original element survives: header labels, tabs and actions, all content groups, the side content, every overlay.

**Placement.** Output goes on the **source's page**, never `figma.currentPage`. In copy mode, create a `(made by Claude)` section and **`section.appendChild`** each screen — a Section does not adopt frames that merely overlap it.

### Mapping an old screen onto the new layout

1. **Page type** — entity editor / detail (✕ in the old header) → `Full screen page`; otherwise `Basic`.
2. **Groups** — the old content column is usually a frame whose children are the setting groups (`General`, `Steps`, …). **Always Ghost** — one group, several groups, a single table: each goes into an island.
   - A block that already **is a card** (radius ≥ 8 and a white fill or its own border — `APCardCollapsible`, `Case page info`, `Tip`) stands on the grey as is. Wrapping it in an `IslandCard` would double the card.
   - A **wrapper of cards** (an instance whose children are mostly cards, e.g. `Case page Overview tab content`) is laid out part by part in `Main content`: the cards as they are, every non-card part (a `Transactions` table frame, a plain block) in its own `IslandCard`. Clone the parts, then remove the wrapper. Every part stays a live instance; only the wrapper loses its link, exactly as in the designers' reference. Never `detachInstance()`.
3. **Width** — forms and settings → `1084 max`; tables and dashboards → `1920 max`; heavy data → `Full width`.
4. **Side column** (an `Overview`, a tip, notes) → `Show side content = true`, into `Side content`.
5. **Each group goes into its own `IslandCard` WHOLE** — with its own title and description. Do not move a group's title into the island's `Heading`: on an instance the `Heading`'s `Description` text has no visibility property, so it can't be found or shown, and moving the title there would drop the description. Old groups with their own grey `#f6f7f9` container keep it — inside a white island it reads exactly as it did on the old white page.

### 6.1 Variables on migrated blocks (from the designers' after-references)

Components bring their own variables, but the old blocks carry the pre-island ones — a darker border, a raw white. The designers override them in every reference. Do the same, **after** the blocks are in place:

| Block | Property | Variable | Key |
|---|---|---|---|
| A card standing bare on the grey (`Case page info`, `.Case page applicant info`, `Documents block old / Document`, `APCardCollapsible` …) | fill | `semantic/background/secondary/normal` | `da81bccfef06f3de221bafbb9b5ee6a161eb9000` |
| the same | stroke | `semantic/border/neutral/subtlest/normal` | `40baade65c87f4b56fd67b027ec695d0984fae39` |
| A side-column organism (`Case page right column`) and its top block (`.Case page checklist`) | stroke | `semantic/border/neutral/subtlest/normal` | `40baade65c87f4b56fd67b027ec695d0984fae39` |
| A table's wrapper frame inside an island (`Transactions`) | fill | **none** — the island gives the white | — |
| Table rows inside an island (`Txn table / Row`, `Table Row` …) | fill | `components/table/background-row-normal` | `b651c3b1b3a1d5b4066af62493435b81f3635acb` |
| `Page / Body / IslandCard` itself | fill / stroke / radius | **leave as published** (`neutral/inverse/normal`, `border/neutral/subtlest/normal`, `border-radius/xl` 16). References built on the branch show `components/layout/island/card/background-normal` — same white, the published component wins. | — |

Radius: with a reference, the paired reference layer's radius, bound to its variable when it has one. The designers round cards 12 → 16 for the island layout (CM Overview for managers: `.To do`, `Team` … on `border-radius/xl`), while some blocks keep theirs (`Documents block old` stays 12 in every reference). Without a reference, keep the block's own.

**When an after-reference exists, copy its variables — and its horizontal sizing (§7.10) and inner spacing — instead of this table:** pair each block of the result with the same-named block of the reference (same order for repeated names), walk both trees with the same relative path, and wherever the reference binds a fill, stroke, spacing or corner-radius variable (or sets a value) that differs from yours, take the reference's. Grids count too: their paddings, row and column gaps, and each child's alignment in its cell (paints via `setBoundVariableForPaint` on a copy of its paint, spacing and radius via `setBoundVariable`). Where the reference has no visible fill and yours does, clear it. Skip the `IslandCard` frame and its `Slot` (published internals). Log every change.

**Bind by key** in a consumer file: `await figma.variables.importVariableByKeyAsync(key)`; in the reference's own file the reference's variable ids resolve directly.

**A copied block can look empty on the canvas.** It is a redraw problem, not lost data. See §7, gotcha 17: check the data, don't replace the block, and ask the designer to reopen the file.

### 6.2 The migration engine — two files, two calls. Run them, don't write your own

**No inventions — but move what the new layout requires** (user feedback, in two steps: *"the skill must not invent anything of its own: just switch on the grey background and put the needed content into islands or collapsible cards on the grey"*, then: *"moving buttons, statuses and so on is needed too, if the new layout requires it"*).

The migration may:
1. put the screen onto the grey island layout (a live `Page`);
2. put the content into islands — or leave it bare on the grey when it already is a card / collapsible card (`*Collapsible Card*`, `APCardCollapsible`, `Case page info` …);
3. **move existing elements to where the new layout expects them** — actions, status, risk score, IDs, the applicant / counterparty into the `Page` header's slots; tabs into the header's sub-header; a details or notes column into the side panel — when the new layout (the designers' reference for that screen, or their table comment, e.g. TM Transaction: *"move buttons into the header, move status / risk score / ID / applicant into the header, a full sidebar on the right with transaction details and Notes, tabs into the sub-header, islands for the data blocks"*) requires it.

The migration may **not** invent: no new content or data, no copy edits, no components or blocks the original doesn't have, no decorative changes the new layout doesn't call for. Every element in the result comes from the original; only its place changes.

**Scope: only screens that go grey + islands.** The migration moves old screens onto the grey island layout — the ones the designers marked grey (their table: "Apply grey" / "Apply grey + islands"). A screen whose reference is white stays on the white layout and is **not** migrated: the engine stops with `stopped: "the reference is WHITE…"`. Say so to the designer instead of building anything.

**The table decides grey or white, not the reference (v3.228).** Almost every designers' reference sits on `◻️ Main (Default)` — the grey Case Overview and CM Overview references too — so the variant says nothing, and the engine's look-based guess can be wrong both ways (TM Settings / Travel Rule: a grey banner inside the card made it read grey, while the body under the card is white). When the designers' table marks the screen, pass it: `planOne(id, refId, { surface: "grey" })` / `migrateOne(id, refId, { surface: "grey" })` (or `"white"`). `planOne` reports `surface: "grey (table)"` or `"… (reference)"`. User decision for TM Settings: *"Серый, по таблице"*.

**Step 0 — plan first, read-only.** Before any build call run `planOne(id)` (in `build.js`) and compare its plan with the reference: page type, grey or white, layout (`Main` / `Main + Right` / `Left + Main`, side column), and every block — `bare` / `island` / `split`, each marked `(reference)` or `(rule)`. Build only when it matches. When it doesn't, fix the engine first or stop and ask — never hand a screen to the build knowing the plan is off.

The engine lives in `${CLAUDE_PLUGIN_ROOT}/reference/products/island-migration/`:
- `build.js` — **call 1.** Paste the file into `use_figma` and append `return JSON.stringify(await migrateOne("<screen node id>", "<reference node id, or omit>"));`. Pass the same reference to `planOne` and `finishAndAudit`.
- `finish.js` — **call 2, a separate `use_figma` call.** Append `return JSON.stringify(await finishAndAudit("<pageId from call 1>", "<reference node id, or null>"));` **On a big page, run it as two calls.** If the call drops with "MCP server connection lost" or a 520, it is too long for one connection. Usually one call is enough now (v3.226.0: no page switch, variable imports prefetched): CM Overview team takes ~56 s cold, of which ~30 s is the first load of the big test page, ~11 s variable imports, ~8 s the pair walk, ~1.5 s the audit itself. Pass a third argument: first `finishAndAudit(pageId, refId, "copy")`, then a separate call with `"audit"`. Both parts are idempotent, so repeating a dropped call is safe.
- `island-migration-lib.js` — the same code, commented, for reading and maintenance. Change it there, then regenerate the two files. Then run `node scripts/check-island-engine.js` — it fails when `build.js` or `finish.js` calls a helper it no longer defines (v3.214.0 shipped `finish.js` without `refPlacement`), and when either file is over 49 800 characters: each is pasted whole into one `use_figma` call, whose code limit is 50 000 (v3.237.0 shipped a 52 007-character `build.js`). Comments go in the lib only; the two run files carry none beyond their usage line.

**Fixed in v3.228 (TM Settings / Travel Rule quick start, seven defects found by hand):**
- **Width from the reference's own `Page / Body / Default` `Type`** (`refWidth`), not guessed from the slot width — the TM Settings reference is `Full width` with a 691 main column, the guess said `1084 max`. Table screens keep the engine's width.
- **No vertical FILL from an old row.** A main column that grew horizontally in the old side-by-side row (`layoutGrow 1`) became vertical FILL in the vertical `Main content` slot and stretched to the page height (`.Content` 865 instead of 526). Every child of `Main content` that ends up FILL vertically goes HUG.
- **A padding is never zeroed by a block that doesn't fully pair.** In `stopped` / `restructured` mode a reference padding of 0 against ours > 0 is skipped — the designer moved it into wrapper frames we don't have; copying it put the card title flush with the edge.
- **The header's actions slot is switched on only when it exists and ends up holding something.** The Generic header has no actions slot, and the only "action" was the header's own AI icon — the slot stayed on and empty.
- **Blocks whose children don't pair still get their paints.** When a block's layer list differs from the reference's (our side column has a `0% complete` block the reference doesn't), its children are paired by unique name and copied in `paint` mode — fills and strokes only, no sizing or spacing. That cleared the white the reference hides on `Stepper / TR onboarding`.
- **Bare cards get the §6.1 fill and border with a reference too** (`bareCardTokens`) — the TM Settings reference itself kept `border/neutral/subtle` and a raw white on `.Content`.
- **Token hygiene on our content** (`tokenHygiene`, in the audit part of the finish): `base/*` paints → the semantic token that aliases them (text / background / border maps); raw spacing and radius → the token whose value **in this file** is the same (here `spacing/xl` = 20 and 24 = `spacing/2xl`, so the value decides, not the name). Our content now includes what sits inside islands — `rebindOrphanVars` used to stop at the `IslandCard` instance.

**Why two calls.** After blocks move into slots, node proxies inside the same call go stale ("node … does not exist" while walking the moved tree). A throw rolls back **everything** that call did, the build included. Call 2 starts with fresh proxies.

**What call 1 does (`migrateOne`):** analyses the screen by geometry and roles → plan (§2) → replaces the screen **in place** with a live `Page` instance: header from the original's regions (breadcrumb, title + copy, status → Info slot, Key, the Additional-info row, all actions incl. `*Button AI*`, every tab incl. extra ones cloned into the `Items wrapper` slot, the selected tab). **Breadcrumb:** the original's; when it has none, the reference's (Levels: `Levels`); when neither has one, the breadcrumb is hidden — never the default `Section name`, content per the island rules below, side columns into `Aside` / `Side content`, overlays beside the instance. **With a reference** (the copy's name carries `(ref <nodeId>)`, or the designer gave a reference link — pass its node id as the second argument; never rename the screen to add it): page `Type`, content width and page size come from the reference. The source is removed only when nothing visible is left in it (`kept: []`).

**Placement from the reference first.** When a reference exists, each block goes where the designer put the same-named block: inside an `IslandCard` → island; bare on the grey → bare; bare with islands inside → split. The rules below apply only to blocks the reference doesn't have. (Why: the titled "Steps" group of the Levels editor is bare on grey in its reference, while the look-alike "Case routing" sits in an island — no general rule tells them apart.)

**Island rules the engine applies** (all from the designers' after-references):
1. **Grey screens only, always Ghost** — on a grey screen everything lives in islands, a lone table and empty states too.
2. **A card** (radius ≥ 8 + white fill or own border) stands bare. An instance that only wraps one card of its size counts as that card.
3. **A layout of cards** — every leaf block is a card, through plain frames and grids; small rows (≤ 90: a quick-links bar, a name row) allowed — stays **whole and bare** (CM managers overview, `Blueprint body`).
4. **A titled group** — first child is a `Block Title` / heading — goes into **one island whole**, even if the rest are cards (`Case routing`: title + option cards).
5. **A mixed wrapper** — mostly cards, some plain blocks (`Case page Overview tab content` with a `Transactions` table) — is laid out part by part: cards bare, each non-card part in its own island. Parts are cloned (never `detachInstance()`); only the wrapper loses its link, as in the reference.
6. **A padded container around one block** (`Container` → `Events log`) is not a group: the block itself is the group.
7. **Never descend into an instance's sublayers** when looking for groups — they can't be moved.
7a. **Chrome doesn't count as a column.** The old header can sit inside the content frame (Levels: `Header-levels` is a child of `Content`); header, sidebar and sub-header are ignored when looking for side-by-side columns — otherwise the side column (Overview) is missed.
8. Anything else → one island per group; a heading block rides on top of the next group.
9. **The island's `Slot` has no padding.** Every designers' reference (Case / Overview `16:20783`, Financial data `21:44203`, TM Transaction `311:53619`) overrides the published `Slot` padding 8 to 0 — the content sits right on the card's own 16. Left at 8, every island came out 16 taller than its reference. Several blocks in one island get a 16 gap.
9a. **An island hugs its content.** An old wrapper frame often carries a FIXED height — it filled the old column (Case page Related cases: `Risk overview` 708 tall around 352 of chips + table). In an island that leaves an empty band, so an auto-layout frame placed in an island goes HUG vertically, as in the reference (`Risk overview` 352). Instances keep their own height. Audit note: `hugs its content: <block> 708 → 352`.
10. **No card in a card — the island is the card.** A block that draws a card of its own inside the island — a (nearly) full-width wrapper with its own border, radius ≥ 8 and inner padding ≥ 16 (TM: `Block` p24 · r12 · border 1 around the AML check cards; `Transaction properties`; the Events frame) — loses that chrome: border off, radius 0, padding 0, exactly as the references show it. The small cards inside the wrapper (`AML check card`) keep theirs; tables (padding 0) never qualify. Done by overrides on the instance's sublayers (unbind the spacing / radius variables, then set) — never detach. On TM Transaction this took every island to the reference's height (AML checks 400 → 336, Properties 496 → 432) and the page to the reference's 3773.

**Never rename a layer** (designers' rule, asked by the team): the migration keeps every layer's name — the moved blocks, the source screen, and the result, which takes the source's name. New frames the engine creates for the layout (a side section like the reference's) take the reference's name.

**Colours from a library that no longer exists are rebound to Base.** Old mockups bind colours to variables of a library the file can no longer reach. In New Layout it's a second `color` / `Design tokens` pair whose collection isn't among the available libraries. Such variables are frozen at pre-redesign hex: `#212736`, `#373d4d`, `#e1e5ea`. A library Update can't reach them, and the designers' references carry them too. `finishAndAudit` rebinds each one to the same-named variable of the current Base `color` collection, comparing names case-insensitively (`Base/Neutral/90` → `base/neutral/90`). A name Base doesn't have is tried again with the `components/` prefix: the old library named component tokens without it (`checkbox/text-normal` → `components/checkbox/text-normal`, TM Travel Rule settings). It works only on our content, the slot subtrees, and never inside a component instance. The result's `orphanVars` lists what was rebound and any name Base doesn't have. **Stale copies of live variables too.** A file can hold two imports of the same Base variable: an old copy at the old value and a fresh one. New Layout still had them after "Update all" (`base/neutral/10` = `#f6f7f9` next to `#f3f4f6`). The same pass rebinds our content from the old copy to the fresh one, importing by key. **The reference's colours are copied as their current variables.** When the reference binds a stale copy or a vanished-library variable, the copy step binds the fresh import or the same-named Base variable instead, and skips nodes that already have it. Before this, every run copied the orphan from the reference and rebound it straight back: 254 + 210 no-op writes on CM Overview team. Old colours left inside components after this are the library's own: an outdated nested instance in a Base component, such as `*Counter*` in `*Chips*` on the old version. Report them to the design team.

**The sidebar section and active item come from the original.** The old screen's place in the navigation is data, so the build reads the original sidebar and sets the new `*Sidebar*` to match. If the old sidebar is a `*Sidebar*` instance, its `Type` is copied. If it is a detached frame, the engine reads the chain of the active item (Transactions and Travel Rule › Settings › Travel Rule quick start) and maps the first level to a `Type` (Transactions → Transactions monitoring). It then marks the matching second-level item Active, and the third-level item when the DS sidebar has it. An item the DS sidebar lacks is reported in `notes`, not faked. With a collapsed sidebar only the section icon shows. If the original has no sidebar, nothing changes.

**The sandbox flag counts only when it shows.** The old header's "You are in sandbox mode" text sets `Sandbox=Yes` only if it lies inside the header's box. Complete to-do list had the text at y 58 in a 56 px header, off screen, and the page went to Sandbox and moved everything 24 px down.

**Blocks that spanned their column keep spanning.** A FIXED block whose width equalled its parent's inner width in the old screen is marked before the move and set to FILL after it. The six `Checklist row` cards stayed 608 wide in a 691 column. The reference's own FIXED widths still win in the finish.

**Siblings the designer moved into a wrapper move in too.** Sometimes a reference frame holds exactly our frame's children plus blocks that are our frame's unique siblings, for example the Alert moved into the rows' wrapper. Then those siblings move into our frame in the reference's order, and our frame takes the reference frame's gap and its children's FILL widths. This only works for component instances and a frame whose name is unique in our content: auto-named frames match by accident.

**A wrapper card the designer dropped is unboxed.** If our block is a card that isn't in the reference by name, and the blocks inside it sit in the reference's main column on the grey, outside any island or card, its parts go over bare and the wrapper card goes. Complete to-do list: `.Content` held the title, the alert, six `Checklist row` cards and the button, and the reference shows them bare. `planOne` marks it `→ unboxed (reference)`.

**White cards on the grey get radius 16.** This is the designers' rule: radius 12 → 16. The finish applies it to white, stroked cards in the main column outside islands, bound to `border-radius/xl`. Tinted blocks such as `*Alert*` keep their radius.

**Finding the island by children looks through single wrappers.** The search passes through up to three single-child wrapper frames. Names that repeat in the reference don't count, since every island has a `Heading`. TM Travel Rule settings: our `Frame 2085664018` › `Frame 2085664033` › Heading + `Frame 2085664034` sits in the reference's 4th island as `Content` › Heading + `Frame 2085664034`.

**A block the reference renamed is found through its children.** If a block isn't in the reference by name but all its children sit in one reference island, it goes into an island (its card chrome is stripped as usual). TM Settings / Verify your VASP: our card `.Content` is the reference's island › `Content` with the same two blocks. In the finish, a single wrapper on our side is paired with a single wrapper in the reference even when the names differ, so its gap is copied.

**A block that overflows its parent in the reference too keeps its width.** The finish stretches a FIXED reference block that doesn't fit our parent. It no longer does that when the block also overflows its parent in the reference: the overflow is meant. Example: the Submit compliance stepper icons, 16 wide in a 10 px room, which were squeezed to 10.

**Our block takes the spacing of the reference wrapper that holds exactly its children.** When our block's children don't match the reference block's children, but one of the reference's child frames holds exactly them, the walk pairs our block with that wrapper. Submit compliance: our `Frame 2131328741` holds four `Customize setup`. The reference's holds `Content` (the same four) + `Buttons-bar`, and our gap 16 becomes the wrapper's 8.

**Pairing goes through one extra frame in the reference.** When the reference wraps the blocks in one more frame than we have (TM Settings / Create a VASP: IslandCard › Slot › `Content` › blocks), the walk pairs our blocks with the wrapper's children. Without it nothing inside the island was copied: the fields kept gap 24 instead of 16.

**Gaps of identical blocks are copied in style mode too.** A block whose children are exactly the reference's takes the reference's gap and grid gaps even below a rebuilt parent. Its side paddings are still never copied there.

**A wrapper card gets the island colours on its inner card too.** If a bare block is a wrapper whose only child is the visible card of the same size (`.Content` › `.Content`), both get `background/secondary` and `border/neutral/subtlest`.

**The side column hugs its content.** A column moved into Side content keeps no old FIXED height: the old 865 grew the page from 900 to 977.

**Blocks that share one island in the reference share one island here.** When several blocks of the main column sit inside one `Page / Body / IslandCard` in the reference, the engine puts them into one island, not one each. TM Settings / Create a VASP: Name, the fields and the Button bar share one island in `283:31704`. `planOne` shows them as one block, `→ island (reference, shared)`.

**A main column that is already a card goes over whole.** When the main column is itself a card (white or stroked, radius ≥ 8) and the reference keeps a block of the same name bare, the engine moves it as one card and doesn't split it into its children. TM Settings `.Content` holds the title, the fields and the Button bar in one card; split, it became islands inside a card. The radius comes from the reference (12 → 16). `planOne` shows `wholeCard: true`.

**A block the designer rebuilt inside keeps its side padding.** The designers sometimes move a card's side padding into new wrapper frames. In CM Overview for managers, `Open cases`, `TR widget` and `Team` went to 16/0/16/0 on the card, with the 16 carried by new `Frame 2131328793` wrappers. The engine adds no layers, so copying 16/0/16/0 left titles and rows flush with the card edge. The walk now has four modes:
- **full** — the whole subtree pairs: everything is copied.
- **stopped** — the block's own children pair, but one of them is rebuilt: only top and bottom padding and gaps are copied.
- **restructured** — the block's own children don't pair: only top and bottom padding are copied.
- **style** — the children of a stopped block take width, radius, fill and stroke, never spacing. On Case page Events an event's `Info` padding 12 → 0 compensates for a line hidden elsewhere in the reference, so spacing there must not be copied.

**Reference layers are paired by a parallel walk, not by path.** Where the designer hid, added or reordered a layer inside a block, path indices shift and the wrong layers swap values (Case page Events: the first event's top connector line is hidden in the reference and its `Info` padding is 0 — the result got the 0 padding with its line still visible, text 12 above the dot). Now a block whose children's layer lists differ from the reference's is paired itself but not descended into. **Rotated layers, lines and vectors** never take the reference's width — a −90° connector line's width is its length (76 in a 16 frame), and comparing it with the frame turned the lines FILL.

**A list may be longer or shorter than the reference's — that's data.** Consecutive layers with the same name are compared as one run: the reference shows 7 `.Blueprint overview item`, the original 9 — the runs still match, items pair index by index, and the two extra items take the last reference item's treatment. Before, the walk stopped at the list (`Content`) and the 9 items kept the white fill the designer had hidden on all 7 (Blueprint New blueprint · Case content). Any other difference in the layer list still stops the descent.

**Another variant of the same component is data, not layout.** In that reference every item is `State=On`, in the original `State=Off`: text and icon colours come from the variant, and copying them would make switched-off items look switched on. Such a pair is not descended into, and on the instance itself only what the reference overrides against its own main component is copied — here the hidden white fill (both variants are white by default), not the variant's colours or spacing.

**Size is layout, not data.** In TM Travel Rule settings the designers switched both `*Collapsible Card*` from `Size=Large` to `Size=Medium`. As another variant it stopped the walk, so nothing inside the cards was copied either (the `Data settings` gap stayed 20 instead of 16). Before the copy, the finish now sets `Size` on our instances to the reference's value when every instance of that component set in the reference's slot has the same `Size`. `State`, `Type` and the rest stay data.

**A fixed width that spans its parent stays "full width".** When a layer in the reference is FIXED and exactly as wide as its parent (Case page FIU reports: table row dividers 884 in an 884 row), the result's layer spans its own parent instead of taking the number — the island is wider here (Aside 400 vs a 424 column), and copying 884 would leave the dividers 24 short. The finish log lists only the changes that actually took.

**Groups that are layers of an instance are cloned out.** When the content column is a component instance (Blueprint New blueprint: `Blueprint general settings`, its groups General fields / Assignment / Case routing / Deadlines are its layers), the groups can't be moved into islands — `insertChild` throws "Node is inside of an instance" and the whole call rolls back. They are cloned, as rule 5 does with mixed wrappers, and the instance is removed once the cards are placed (its name is read before the removal).

**A list of cards keeps its chrome.** "No card in a card" (rule 10) skips a layer that has same-named siblings — it is an item of a list (Blueprint `Case routing / Options` ×3, each r12 · p8/16 · border), not a wrapper; the reference keeps their frames.

**Headings pair by role.** The designer swaps the old `Block Title (🔴Figma only)` for a `Heading` in the reference (Blueprint Assignment / Deadlines, top padding 16 → 0). The reference walk treats `Block Title` / `Heading` / `Title` / `Body / Title` as one role, so the heading's padding comes over and the islands keep the reference's height. A `Header` frame counts as a heading too: in TM Travel Rule settings the designer replaced two of the four `Heading 🟡 Figma only` instances with a `Header` frame. A heading pair also takes the reference's top and bottom padding when the block around it was rebuilt, and that includes 0. The old screen spaced its sections with a 32 / 12 heading padding; in an island that spacing is 0 / 0.

**Pairing goes through extra wrappers on our side too.** Our copy can hold one or two single wrappers more than the reference: TM Travel Rule settings has `Frame 2085664018` › `Frame 2085664033` › heading + content against the reference's `Content` › heading + content. The walk now goes through up to two of our single wrappers, and the reference values land on the inner one. Before, nothing in that island paired and the gaps stayed 0 / 20 instead of 12 / 8.

**An empty side column keeps the main column the reference's width.** The reference can show a side column whose content the original doesn't have (TM Travel Rule settings: a 380 Tip). The block isn't invented, but `Show side content` stays on and the slot is left empty. Without it the form spread to 1135 instead of the reference's 691. `planOne` shows `side: empty, like the reference`.

**No doubled header icons.** The published `*Header*` brings its own Summy AI and help icons outside the Actions slot. Old Case page headers keep the same two inside their actions row, so they were copied into the slot as well and showed twice (Case page AML, Financial data). After the actions are copied, an icon-only button whose icon the header already shows outside the slot is removed (`the header has its own normal/AI-paw — the copied one removed`); if the header's own icon is hidden, the copy stays.

**A side column that is a component instance** (CM `Case page right column`) keeps its own blocks — nothing can be inserted into an instance, so the reference block matching is skipped for it (only the flush-sections step applies). Walking it after the Aside variant change threw on stale sublayer ids (Case page AML run).

**`narrowFills` ignores HUG nodes** — a node sized to its content (the `Tab Button History` switcher inside `AML screening`) is narrow on purpose; only FILL blocks and FIXED cards are checked.

**An old scrollbar thumb is chrome.** A `Scroll / Thumb` instance at the screen's right edge (Blueprint New blueprint: 6×380 at x=1425) is neither content nor header — the `Page` scrolls by itself. It is dropped with the old header and sidebar; before, it stayed in the source and the build ended with `kept: ["Scroll / Thumb"]`.

**The old sidebar spans the 900 viewport.** A collapsed `*Sidebar*` is 900 tall even when the screen is taller (Case page AML: 52×900 in a 1160 frame). It is found against `0.8 × min(height, 900)`; before, it was missed, stayed in the source and the build ended with `kept: ["*Sidebar*"]`.

**Chrome at every level.** The header, the header band and the tab strip are never content, however deep they sit: TM Related transactions keeps `Header / Finance`, the `*Tab Basic*` strip and the `Txn table` in one frame — the band and the tabs go to the header, the table alone is the content group. Tab items are recognised under both names, `.Tab Basic / Item` and the older `Tab / Basic / Item` (the selected tab too). A breadcrumb that is the placeholder `Section name` counts as none — the reference's is taken.

**Header stack (TM Transaction).** Some screens stack two header bands: the top `*Header*` (breadcrumb, title, Summy AI, help) and, right under it, a full-width entity band with actions and status (`Header / Finance`: amount, status, Confirm · Pending · Approve · Add to case, Score / Applicant / Assignee), then the tab strip. The engine treats the whole stack as header: the band and the tabs are chrome (not content, not a column), the **actions come from the band only** (the top header's icon-only Summy AI / help belong to the app chrome — the reference doesn't carry them), status from the band.

**Header and side panel by the reference, data from the original** (user decision for TM Transaction: *"the reference's layout, the original's data"*):
- **Title** — the reference's, but only when it re-uses the original's data (TM: `Transfer: - 250,000.00 USD` contains the original amount). A placeholder title (`SSO Login`) shares nothing with the original and is ignored.
- **Info slot / Additional info slot** — the reference's rows are cloned, then filled with the original's values: a status whose label differs from the original's is replaced by the original status, the counter gets the original `Score`, an `ID: …` text gets the original ID. What only the reference has (the `Suspicious` tag) stays.
- **Side panel** — the reference's side column decides which blocks it shows and in what order. A block the original has (same name, or the reference block's first text = the original block's name: `Transaction details`, `Notes`) is the original's own; a block only the reference has (`Assignee` / `Related case`) is cloned from it and gets the original's values by label (`Assignee` → the band's `James Smith`).
- **Audit:** a label / value pair of the band that ends up nowhere in the result (neither the value nor a row with that label) is reported as `header values not placed: …`.

**What call 2 does (`finishAndAudit`):** copies fill/stroke variables, **horizontal sizing and paddings / gaps** (value, and the spacing variable when the reference binds one — TM: `Customers card / Finance` heading and info padding 24 → 16) from the reference block by block (or applies the §6.1 defaults and stretches fixed blocks without one, §7.10), checks that grid rows span their grids, **fits side columns to their panel** (§7.14), grows the page if the content runs past its bottom **and grows its `(made by Claude)` section to hold it** (`sectionFit`), and returns the audit — `main` (what sits in `Main content`), `notIsland` (a block the reference itself places bare or split is not flagged — the reference wins over the card rule), `overflow`, `gridIssues`, `sideFit` (what was fitted, informational), `sideOverflow`, `narrowFills`, `rawPaints` (a visible paint of ours without a variable, or a `base/*` one with no semantic map), `rawSpacing` (a spacing / radius value a token has, left unbound), `sideWhites` (a non-card white block in a side column), the variable count; `tokens.noToken` lists values no token has (a 2 px gap) — design, informational. **Every list in the audit must be empty.**

**Validated 2026-09-29** on the New Layout test page (`gzKyS6BzWDlmBMLJspM7WP`, page `3234:38`): Case / Overview `3236:64403` (mixed wrapper split, Transactions in an island, header regions, 6 tabs), CM managers overview general / team / blueprints `3256:63838` · `3259:64158` · `3261:64392` (layout of cards bare, `Full screen page` + `Full width` from the reference, 28 / 197 / 89 variables copied). The team, blueprints and general screens exposed the fixed-width defect (§7.10) — fixed by copying the reference's sizing.

**Page height.** With a reference the page takes the reference's size, then grows if the moved content is taller. Without one it keeps the original size.

---

## 7. Sizing and API gotchas — each one broke a real run

1. **`IslandCard` won't grow on its own.** It ships FIXED at 153 with its inner `Slot` on FILL — set `Slot.layoutSizingVertical = "HUG"` first, then the island's. Island only → stays 153 and clips the group.
2. **Hidden layers inside an instance don't exist for `findAll`.** While `IslandCard`'s `Heading` is off, none of its texts can be found. After `Heading#26638:9 = true` only `Name` appears; `Description` has no visibility property, so it can never be found or shown on an instance.
3. **Node proxies are not reference-stable.** Compare nodes by `.id`, never with `===` / `!==`. An ancestor walk that stops on `p !== stop` runs to the PAGE and throws on `.visible`.
4. **Changing a variant invalidates the refs below it.** After `Page / Body`'s `Content` changes, re-fetch `Page / Body / Default` and the slots.
5. **`insertChild` into a SLOT invalidates the inserted node's ref — and its sublayers' ids.** A block moved into a slot inside an instance gets new sublayer ids (`I<island>;…`); walking the old proxies throws `The node … does not exist`, and the throw rolls back the whole call. Change a block's own sublayers (card chrome, §6.2 rule 10) **before** the move. Re-fetch it from `slot.children` for any follow-up. Capture a slot's placeholders **before** inserting and remove them by the captured refs.
6. **Fill an `IslandCard` before putting it into the slot** — once inside, your reference to it is stale.
6a. **Find content by ROLE, never by node type.** The same `Overview` is an INSTANCE in one mockup and a FRAME in the next; matching `type === "INSTANCE"` missed it, and deleting the source then deleted the Overview with it. Side column = whatever is visible in `Content` besides the body. And the **preservation guard** (step 9) must stay: never remove a source that still holds visible content.
7. **A `Page` instance can't take appended children.** Overlays (Toast / Dropdown) go next to it, as siblings.
8. **Preserve the original height** — `page.resize(1440, origH)`. Letting it hug makes heights drift.
9. **Output on the source's page, inside the section** — `section.appendChild`, never beside it.
10. **Old blocks carry the old FIXED widths — content must fill the new width.** Old screens were narrower, so their cards and columns are `FIXED` at the old sizes. Moved into a wider island layout they leave a gap at the end of every row (CM team overview: grid cards 362 in a 1340 grid, `Team` 552 in a 662 column — user feedback: *"content inside the islands does not take all the available width, though it should"*). The designers fix it per block in the reference: grid children → `FILL`, and where a side column stays fixed they pin it `FIXED` and let the main one fill (managers general: 772 `FILL` + 552 `FIXED`). `finish.js` copies the reference's horizontal sizing block by block; without a reference it sets grid children to `FILL` and stretches a `FIXED` card that is narrower than its stack. Then every grid row must span its grid (`gridIssues`) and nothing may stop short of its parent (`narrowFills`). A dump that abbreviates `FIXED` and `FILL` to one letter hides exactly this — print them in full. **Exception — side panels:** the published `Aside` is 400 and does not stretch; a reference built on the branch may show the same column FIXED at 424 with no panel around it. A reference width that doesn't fit where the block now sits is not copied — the block goes `FILL` (first skill run: the Case page right column stuck out 24 px until the skill stretched it by hand).
11. **Build and variables in one call = the whole build rolled back** (§6.2). Keep them in two calls.
12. **Never send heavy calls back to back** — user feedback: *"never make many heavy requests at once, it always ends with the MCP going down"*. A build call (20–30 KB of code, a whole screen) is one call, then a light check or a stop. No batching several screens into one call, no queue of builds: a burst of them took the Figma MCP down for the whole session (503 on everything, even `whoami`).
13. **An MCP `503` on a heavy call usually means nothing was applied.** Check the state with a light read-only call before retrying; retry one screen per call. If a light call gets `503` too, the server is down — wait, don't loop.
14. **A side column must fit its panel — the panel does not grow.** The published `Page / Body / Aside` is locked at 400 and `Side content` at 380: `resize()` / `resizeWithoutConstraints()` on the nested instance return without error and change nothing. A column copied with the reference's sizing can be wider — `Case page right column` is FIXED 424 in the Financial data reference, because there it sits in `Main content` of the branch `Page` — and then sticks out of the panel by 24 (`overflow: Content: Case page right column`). `copyVarsFromRef` no longer copies such a width (§7.10 exception); as a safety net for everything else (a column FIXED in the old screen, no reference) `finish.js` sets any side-slot child wider than its slot to `FILL` after the sizing pass, logs it in `sideFit`, and lists anything that still sticks out inside the column in `sideOverflow`. Its own children are FILL, so it re-flows cleanly.
15. **Children that stretch to the page's height are not content height.** A side column on `FILL` vertically ends 8px above the page bottom; counting it in "does the content run past the bottom" grew the page by 20 on every re-run of `finish.js` (1181 → 1201). The growth check skips `FILL`-height children — re-running `finish.js` leaves the size as it is.
16. **A returned text with U+2028 cuts the MCP response.** Figma stores Shift+Enter inside a text as U+2028 (line separator). A result that contains it arrives broken — `Failed to parse SSE message … EOF while parsing a string at line 1 column ~20000` — although the call itself ran (TM Transaction reads failed three times in a row; the same read with the output cleaned passed). Every engine result goes through `clean()`. In your own read calls replace the character before returning: `JSON.parse(JSON.stringify(out).replace(new RegExp("[" + String.fromCharCode(0x2028, 0x2029, 0x85) + "]", "g"), " "))`. Build the regexp from char codes — an escaped `\u2028` in the code is decoded by the tool call into a raw line separator → `SyntaxError: unexpected line terminator in regexp`.
17. **A block copied out of a component can show as an empty frame until the file is reopened.** Seen twice on the same block of Case page Overview, the second `Documents block old / Document`. Its tree, texts and images matched the original exactly, and a PNG export drew it in full. Only the canvas kept the old blank picture, and reopening the file fixed it. Don't rebuild or replace such a block. Check it in the data (texts, sizes, an export), and tell the designer to reopen the file if it looks empty.

---

## 8. Audit — assert values, not presence

A skeleton check ("is there an island? a header?") passes screens that are present but wrong. For every migrated screen:

- [ ] **Shell is a live `Page` INSTANCE** from set `f9071958…`. Hand-built frames while `Page` imports = **FAIL**.
- [ ] **`Type`** matches §2.1; **`Sandbox`** matches the *visible* indicator (§5).
- [ ] **Nested `Page / Body` `Content`** is a Ghost layout (§2.2) — a lone table included.
- [ ] **Nothing outside an island** — every child of `Main content` is an `IslandCard` or a block that is itself a card (radius ≥ 8 + white fill or own border). A table, list or empty state standing bare = **FAIL**.
- [ ] **Variables per §6.1** — bare cards `background/secondary/normal` + `border/neutral/subtlest/normal`, side column border `subtlest`, table rows `components/table/background-row-normal`, table wrapper without fill. With an after-reference: zero fill/stroke differences against it outside the `IslandCard` internals.
- [ ] **Compared with the after-reference** when one exists — same blocks, same islands, same order.
- [ ] **Paints of our content** — `rawPaints`, `rawSpacing` and `sideWhites` empty, and the skill audit's 7.61 clean. Since v3.228 the skill audit treats a slot's content as ours (before, `isInsideInstance` skipped every layer of an island screen, so its token checks covered nothing). Colours left inside a published component (the `Stepper / TR onboarding` icons and numbers bind variables of a library the file no longer has) are the design team's — report them.
- [ ] **Side columns fit their panel** — `sideOverflow` is empty, and nothing in `Side content` or an `Aside` is wider than its slot (`overflow` empty). A column sticking out of the Aside = **FAIL**.
- [ ] **Content fills the available width** — `gridIssues` and `narrowFills` from `finish.js` are empty: every grid row spans its grid, every `FILL` child reaches its parent's inner width. Half-filled islands = **FAIL** (Костя: *"контент внутри островов не занимает всю доступную ширину, хотя должен"*).
- [ ] **`Page / Body / Default` `Type`** matches §2.3; `Show side content` is true exactly when there is side content, or when the reference has a side column the original can't fill (left empty, §6.2).
- [ ] **Every original content group is present** — count of `IslandCard`s in `Main content` equals the count of visible groups in the old body (Ghost). None missing, none merged.
- [ ] **Each `IslandCard` hugs its content** — island height = group height + 32 (the card's 16 padding, top and bottom; the `Slot` padding is 0 — §6.2 rule 9). An island at exactly 153 = the HUG was not applied = **FAIL**.
- [ ] **Groups fill the island width** and nothing overflows it.
- [ ] **Side content** holds the old side column (Overview / tip), 380 wide — whether it was an INSTANCE or a FRAME in the original.
- [ ] **Nothing lost:** `migrateOne` returned `kept: []` for every screen, and the source screen is gone. The engine never renames a layer — a screen it couldn't finish keeps its name and stays where it was; `kept` lists what's left in it. A non-empty `kept` means that screen is unfinished.
- [ ] **Header**: title, breadcrumb, the original tabs relabelled (none of the default `Tab_1…5`), and the original **ancestor-visible** actions — text actions and the kebab — in a **rendered** Actions slot. Missing actions, the default placeholder `Button`, or the old header's hidden Key-area buttons = **FAIL**.
- [ ] **Overlays preserved** — every original Toast / Dropdown exists, as a sibling of the instance.
- [ ] **Size** — with a reference: the reference's width and height, grown only if the moved content is taller; without one: the original size.
- [ ] **Content centred** — left and right gaps inside the card equal (148/148 at 1084 in a 1380 card).
- [ ] **Placement** — on the source's page, and a child of its `(made by Claude)` section.

---

## 9. Notes

- The spec lives on Base page `Layout` `8828:117083`: `Page` spec `29444:103014`, `Page / Body / Default` spec `29402:122705` (incl. the left/right decision tree `29828:239828`), `Canvas` `29825:227598`, `IslandCard` `26638:747879`.
- After any future change to the layout in Base, **re-check the imports from a consumer file** — the Base file and the published library drifted apart once already (2026-09-29: the merge landed before the republish, and consumer files saw the old four-variant model).
- `Sandbox alert` (`07975654…`) is not importable on its own — it doesn't need to be; it comes with `Sandbox=Yes`.
