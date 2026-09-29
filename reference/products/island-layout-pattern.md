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

> **"Build / create island versions of these screens" is copy-mode migration.** Run `migrateFrameToIsland` (§6) on each source frame. The header action carry-over lives only in that function; hand-rolling "set title + tabs" silently drops the action buttons.

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

Radius: keep the block's own. The old `Documents block old` stays at its component radius 12 (the references keep it too).

**When an after-reference exists, copy its variables instead of this table:** pair each block of the result with the same-named block of the reference (same order for repeated names), walk both trees with the same relative path, and wherever the reference binds a fill or stroke variable that differs from yours, bind the reference's (`setBoundVariableForPaint` on a copy of its paint). Where the reference has no visible fill and yours does, clear it. Skip the `IslandCard` frame and its `Slot` (published internals). Log every change.

**Bind by key** in a consumer file: `await figma.variables.importVariableByKeyAsync(key)`; in the reference's own file the reference's variable ids resolve directly.

**Check that every block actually renders.** A clone of a heavy instance can come out blank on canvas while its data looks complete (Case / Overview sample: the second `Documents block old / Document` showed as an empty bordered box). Replace such a block with a fresh copy — from the reference if there is one.

### ✅ The validated function — copy and run it, don't write your own

```js
// ancestor-visible check. Compare by ID: node proxies are NOT reference-stable, so `p !== stop`
// silently fails and the walk runs up to the PAGE, which has no `.visible`.
const rendered = (n, stop) => { const sid = stop ? stop.id : null; let p = n;
  while (p && p.type !== "PAGE" && p.id !== sid) { if ("visible" in p && p.visible === false) return false; p = p.parent; }
  return true; };

async function migrateFrameToIsland(srcFrame) {
  const origH = Math.round(srcFrame.height);
  // ── 1. READ the original ──────────────────────────────────────────────
  const oldHeader = srcFrame.findOne(n => n.type === "INSTANCE" && /Header-levels|^\*Header\*/.test(n.name));
  const innerHdr  = oldHeader ? (oldHeader.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name)) || oldHeader) : null;
  const tabLabels = innerHdr ? innerHdr.findAll(n => n.type === "INSTANCE" && /Tab Basic \/ Item/i.test(n.name) && rendered(n, innerHdr))
      .map(t => { const x = t.findOne(y => y.type === "TEXT" && y.visible); return x ? x.characters : null; }).filter(Boolean) : [];
  let title = "Title"; const tn = innerHdr && innerHdr.findOne(n => n.type === "TEXT" && n.name === "Title"); if (tn) title = tn.characters;
  let sandbox = false;
  if (innerHdr) { const s = innerHdr.findOne(n => n.type === "TEXT" && /sandbox mode/i.test(n.characters)); if (s) sandbox = rendered(s, innerHdr) && s.visible; }
  const content  = srcFrame.children.find(c => c.type === "FRAME" && c.name === "Content");
  const bodyFr   = content && content.findOne(n => n.type === "FRAME" && n.name === "Body");
  const groups   = bodyFr ? bodyFr.children.filter(c => c.visible !== false) : [];
  // side column = whatever else is visible in Content besides the body — by ROLE, not by node type:
  // the same Overview is an INSTANCE in one mockup and a FRAME in the next. Matching INSTANCE only lost it.
  const others   = content ? content.children.filter(c => c.visible !== false && (!bodyFr || c.id !== bodyFr.id)) : [];
  const side     = others.find(c => /Overview|Side|Aside|Tip/i.test(c.name)) || others[0] || null;
  const overlays = srcFrame.children.filter(c => c.type === "INSTANCE" && /Toast|Dropdown/i.test(c.name));
  const ghost    = true;                                 // migration: everything lives in islands — a lone table too (§2.2)

  // ── 2. INSTANTIATE Page (mandatory — if the import throws, log the error; only then consider a fallback) ──
  const pageSet = await figma.importComponentSetByKeyAsync("f907195876aad003b980b77d6e9471e9418a0941");
  const pageType = oldHeader ? "Full screen page" : "Basic";   // entity editor with a ✕ → Full screen; adjust per §2.1
  const variant = pageSet.children.find(c => /Ver=New/.test(c.name) && c.name.includes("Type=" + pageType) && c.name.includes("Sandbox=" + (sandbox ? "Yes" : "No")));
  const page = variant.createInstance();
  const parent = srcFrame.parent, x = srcFrame.x, y = srcFrame.y;
  parent.appendChild(page); page.x = x; page.y = y; page.name = srcFrame.name;

  // ── 3. LAYOUT: nested Page / Body → Content; then re-fetch and set the width ──
  page.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body")
      .setProperties({ "Content": ghost ? "◼️ Main (Ghost)" : "◻️ Main (Default)" });
  // changing a variant invalidates refs below it — re-fetch
  page.findOne(n => n.type === "INSTANCE" && n.name === "Page / Body / Default")
      .setProperties({ "Type": "1084 max", "Show side content#23483:22": !!side });   // forms/settings; tables → "1920 max"

  // ── 4. CONTENT: in Ghost, each group → its own IslandCard, WHOLE ──
  const mainSlot = page.findAll(n => n.type === "SLOT").find(s => s.name === "Main content");
  const mph = [...mainSlot.children];                    // capture placeholders BEFORE inserting
  if (ghost) {
    const icComp = await figma.importComponentByKeyAsync("3595d612ef3d886a2dd9a4744add8b74f4ac9606");
    const cards = [];
    for (const g of groups) {
      const ic = icComp.createInstance(); srcFrame.parent.appendChild(ic);   // fill it BEFORE it goes into the slot
      const slot = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
      const ph = [...slot.children]; slot.insertChild(0, g); for (const p of ph) { try { p.remove(); } catch (e) {} }
      // ⚠️ the island ships FIXED at 153 with its Slot on FILL — it will NOT grow. Slot → HUG first, then the island.
      const sl = ic.findOne(n => n.type === "SLOT" && n.name === "Slot");
      try { sl.children[0].layoutSizingHorizontal = "FILL"; } catch (e) {}   // group fills the island width (640 → 592 inside)
      try { sl.layoutSizingVertical = "HUG"; } catch (e) {}
      try { ic.layoutSizingVertical = "HUG"; } catch (e) {}
      cards.push(ic);
    }
    cards.forEach((ic, i) => mainSlot.insertChild(i, ic));
  } else if (bodyFr) {
    mainSlot.insertChild(0, bodyFr);                     // Default: one block, no island
  }
  for (const p of mph) { try { p.remove(); } catch (e) {} }
  for (const c of mainSlot.children) { try { c.layoutSizingHorizontal = "FILL"; } catch (e) {} }

  // ── 5. SIDE content ──
  if (side) {
    const sideSlot = page.findAll(n => n.type === "SLOT").find(s => s.name === "Side content");
    const sph = [...sideSlot.children]; sideSlot.insertChild(0, side); for (const p of sph) { try { p.remove(); } catch (e) {} }
  }

  // ── 6. HEADER: the Page's own header, from the original (§4) ──
  const hdr = page.findOne(n => n.type === "INSTANCE" && /^\*Header\*/.test(n.name) && n.visible);
  try { hdr.setProperties({ "Title text#3817:0": title, "Key#5362:0": false }); } catch (e) {}
  const bc = hdr.findOne(n => /Breadcrumb/i.test(n.name)); if (bc) { try { bc.setProperties({ "Name#6638:5": "Levels" }); } catch (e) {} }
  const tb = hdr.findOne(n => /^\*Tab Basic\*/.test(n.name));
  if (tb && tabLabels.length) { tb.findAll(n => /Tab Basic \/ Item/i.test(n.name)).forEach((it, i) => { try {
      if (i < tabLabels.length) { it.setProperties({ "Label text#4517:0": tabLabels[i] }); it.visible = true; } else it.visible = false; } catch (e) {} }); }
  const cands = innerHdr ? innerHdr.findAll(n => n.type === "INSTANCE" && /^\*Button\*/.test(n.name))
      .filter(b => rendered(b, innerHdr) && b.visible && /Buttons/i.test(b.parent ? b.parent.name : "")) : [];
  const carry = [];
  for (const b of cands) { let vn = ""; try { const mc = await b.getMainComponentAsync(); vn = mc ? mc.name : ""; } catch (e) {}
    const t = b.findOne(x => x.type === "TEXT" && x.visible); const lbl = t ? t.characters.trim() : "";
    if ((lbl.length > 1 && !/^Button$/i.test(lbl)) || (/Icon Only/i.test(vn) && /Type=Secondary/i.test(vn))) carry.push(b); }
  if (carry.length) { try { hdr.setProperties({ "Show actions slot#6943:20": true });
      const aSlot = hdr.findAll(n => n.type === "SLOT").find(s => /Actions slot/i.test(s.name));
      const aph = [...aSlot.children];
      for (const ob of [...carry].reverse()) { const c = ob.clone(); aSlot.insertChild(0, c); try { c.visible = true; } catch (e) {} }
      for (const p of aph) { try { p.remove(); } catch (e) {} }
      for (const c of [...aSlot.children]) { try { const tt = c.findOne(x => x.type === "TEXT" && x.visible); if (tt && /^Button$/i.test(tt.characters.trim())) c.remove(); } catch (e) {} }
    } catch (e) {} }

  // ── 7. OVERLAYS as SIBLINGS (a Page instance's children are locked) ──
  for (const ov of overlays) { try { parent.appendChild(ov); ov.x = page.x + 1440 - Math.round(ov.width) - 32; ov.y = page.y + 80; } catch (e) {} }
  // ── 8. PRESERVE the original height ──
  try { page.resize(1440, origH); } catch (e) {}
  // ── 9. PRESERVATION GUARD — never delete a source that still holds visible content ──
  // Anything still visible in Content was NOT carried over. Removing the source would delete it for good.
  const leftovers = content ? content.children.filter(c => c.visible !== false && (!bodyFr || c.id !== bodyFr.id)) : [];
  // in the Default branch the body itself moved into the slot and its old ref is stale — reading it can throw
  let bodyLeft = [];
  try { if (bodyFr && !bodyFr.removed && bodyFr.parent && bodyFr.parent.id === content.id) bodyLeft = bodyFr.children.filter(c => c.visible !== false); } catch (e) {}
  if (leftovers.length || bodyLeft.length) {
    srcFrame.name = srcFrame.name + " — NOT MIGRATED: " + [...leftovers, ...bodyLeft].map(n => n.name).join(", ");
    return { page, kept: [...leftovers, ...bodyLeft].map(n => n.name) };   // source kept — report it, don't delete
  }
  try { srcFrame.remove(); } catch (e) {}
  return { page, kept: [] };
}
```

It returns `{ page, kept }`. `kept` is empty when the migration was complete and the source was removed. If it lists names, **the source was NOT deleted** — it is renamed `… — NOT MIGRATED: <names>` so nothing is lost; report it and handle those nodes.

**Validated verbatim, 2026-09-29, two screens in section `22283:92486`:**
- `22283:102978` — `Overview` is an INSTANCE: `Page` 1440×800 · `Full screen page`, `Sandbox=No` · `◼️ Main (Ghost)` · `1084 max` + side · `IslandCard`(General) 104 + `IslandCard`(Steps) 698, groups 592 wide · Overview in `Side content` · header `Levels /` + `New level` + tabs Steps / Configurations / Checks Execution Flow + `Create level` and the kebab · centred 148/148.
- `22288:29691` — `Overview` is a FRAME and the screen has a Toast: same result, Overview in `Side content`, the Toast placed beside the instance, islands 104 + 794.

The `◻️ Default` branch (one block, no side column) is written to the same rules but **has not been run on a real screen yet** — every KYC editor has a side column. Check it on the first Default screen you migrate.

The content can be taller than the viewport (here 802 in a 647 zone). That is correct — the content scrolls inside the island, and the old screen was clipped the same way. **Do not grow the frame**: a migration keeps the original height.

---

## 7. Sizing and API gotchas — each one broke a real run

1. **`IslandCard` won't grow on its own.** It ships FIXED at 153 with its inner `Slot` on FILL — set `Slot.layoutSizingVertical = "HUG"` first, then the island's. Island only → stays 153 and clips the group.
2. **Hidden layers inside an instance don't exist for `findAll`.** While `IslandCard`'s `Heading` is off, none of its texts can be found. After `Heading#26638:9 = true` only `Name` appears; `Description` has no visibility property, so it can never be found or shown on an instance.
3. **Node proxies are not reference-stable.** Compare nodes by `.id`, never with `===` / `!==`. An ancestor walk that stops on `p !== stop` runs to the PAGE and throws on `.visible`.
4. **Changing a variant invalidates the refs below it.** After `Page / Body`'s `Content` changes, re-fetch `Page / Body / Default` and the slots.
5. **`insertChild` into a SLOT invalidates the inserted node's ref.** Re-fetch it from `slot.children` for any follow-up. Capture a slot's placeholders **before** inserting and remove them by the captured refs.
6. **Fill an `IslandCard` before putting it into the slot** — once inside, your reference to it is stale.
6a. **Find content by ROLE, never by node type.** The same `Overview` is an INSTANCE in one mockup and a FRAME in the next; matching `type === "INSTANCE"` missed it, and deleting the source then deleted the Overview with it. Side column = whatever is visible in `Content` besides the body. And the **preservation guard** (step 9) must stay: never remove a source that still holds visible content.
7. **A `Page` instance can't take appended children.** Overlays (Toast / Dropdown) go next to it, as siblings.
8. **Preserve the original height** — `page.resize(1440, origH)`. Letting it hug makes heights drift.
9. **Output on the source's page, inside the section** — `section.appendChild`, never beside it.

---

## 8. Audit — assert values, not presence

A skeleton check ("is there an island? a header?") passes screens that are present but wrong. For every migrated screen:

- [ ] **Shell is a live `Page` INSTANCE** from set `f9071958…`. Hand-built frames while `Page` imports = **FAIL**.
- [ ] **`Type`** matches §2.1; **`Sandbox`** matches the *visible* indicator (§5).
- [ ] **Nested `Page / Body` `Content`** is a Ghost layout (§2.2) — a lone table included.
- [ ] **Nothing outside an island** — every child of `Main content` is an `IslandCard` or a block that is itself a card (radius ≥ 8 + white fill or own border). A table, list or empty state standing bare = **FAIL**.
- [ ] **Variables per §6.1** — bare cards `background/secondary/normal` + `border/neutral/subtlest/normal`, side column border `subtlest`, table rows `components/table/background-row-normal`, table wrapper without fill. With an after-reference: zero fill/stroke differences against it outside the `IslandCard` internals.
- [ ] **Compared with the after-reference** when one exists — same blocks, same islands, same order.
- [ ] **`Page / Body / Default` `Type`** matches §2.3; `Show side content` is true exactly when there is side content.
- [ ] **Every original content group is present** — count of `IslandCard`s in `Main content` equals the count of visible groups in the old body (Ghost). None missing, none merged.
- [ ] **Each `IslandCard` hugs its content** — island height = group height + 48 (16 card padding + 8 slot padding, top and bottom). An island at exactly 153 = the HUG was not applied = **FAIL**.
- [ ] **Groups fill the island width** and nothing overflows it.
- [ ] **Side content** holds the old side column (Overview / tip), 380 wide — whether it was an INSTANCE or a FRAME in the original.
- [ ] **Nothing lost:** `migrateFrameToIsland` returned `kept: []` for every screen, and no frame on the page is named `… — NOT MIGRATED: …`. A non-empty `kept` means that screen is unfinished.
- [ ] **Header**: title, breadcrumb, the original tabs relabelled (none of the default `Tab_1…5`), and the original **ancestor-visible** actions — text actions and the kebab — in a **rendered** Actions slot. Missing actions, the default placeholder `Button`, or the old header's hidden Key-area buttons = **FAIL**.
- [ ] **Overlays preserved** — every original Toast / Dropdown exists, as a sibling of the instance.
- [ ] **Height = original**; width 1440.
- [ ] **Content centred** — left and right gaps inside the card equal (148/148 at 1084 in a 1380 card).
- [ ] **Placement** — on the source's page, and a child of its `(made by Claude)` section.

---

## 9. Notes

- The spec lives on Base page `Layout` `8828:117083`: `Page` spec `29444:103014`, `Page / Body / Default` spec `29402:122705` (incl. the left/right decision tree `29828:239828`), `Canvas` `29825:227598`, `IslandCard` `26638:747879`.
- After any future change to the layout in Base, **re-check the imports from a consumer file** — the Base file and the published library drifted apart once already (2026-09-29: the merge landed before the republish, and consumer files saw the old four-variant model).
- `Sandbox alert` (`07975654…`) is not importable on its own — it doesn't need to be; it comes with `Sandbox=Yes`.
