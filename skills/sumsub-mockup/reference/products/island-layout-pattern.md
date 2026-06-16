# Island Layout (Ver=New) + Migration — Dashboard

> The post-redesign Dashboard layout: main content lives inside a rounded white **"island" card** floating on a grey page, with insets **top / right / bottom** and **flush-left against the sidebar**.
> Canonical `Page` component: file `tJMo5DkqQUN0H6N8apN0N7`, set `24836:83444` (variants Ver=New × Type=Basic|Full screen page × Sandbox=No|Yes, all 1440×1080).
> Validated end-to-end by migrating 26 KYC level-editor mockups (file `xhjtb7G71gVOawl0pOilSx`) 2026-06-15.

---

## 1. Structure & dimensions

```
Page (HORIZONTAL, fill semantic/background/neutral/subtlest/normal #f3f4f6 — the grey page)
├── *Sidebar*  (flush-left, full height; layoutAlign="STRETCH")
│      1st-level page → 257 (expanded) · 2nd-level/detail → 52 (collapsed)
└── Island (VERTICAL, padding T8 / R8 / B8 / L0 [spacing/s], gap 8 [spacing/s])
    ├── (optional) Statusbar — rounded-8 trial bar (NOT the sandbox indicator; see §4)
    └── Main body (HORIZONTAL, gap 8)
        ├── Body  = the content card
        │     fill semantic/background/neutral/inverse/normal #ffffff
        │     border-radius 16 (border-radius/xl), 1px border
        │       semantic/border/neutral/subtlest/normal #e5e7eb   (→ YELLOW in sandbox, §4)
        │     clipsContent = true
        │     ├── (optional) Sandbox alert plashka (24h, §4) — FIRST child when sandbox
        │     ├── *Header* (Generic 1st-level OR Fullscreen 2nd-level, §3) — INSIDE the card
        │     └── content (the page content / Page-Body / re-hosted content)
        └── (optional) AI Assistant — 344w right card, radius 16, purple border
```

Layout math:
- **Basic (1st level):** sidebar 257 + island 1183 → card 1175 wide.
- **Full screen page (2nd level):** sidebar 52 + island 1388 → card **1380** wide.
- Card height = page_height − 16 (island T+B padding). Content area = card − header.

---

## 2. Component & token keys (verified)

### Components
| Component | Key | Notes |
|---|---|---|
| `Page` SET | `ccd4779c69fbf17342db36c7fe57d1160306efdf` | **NOT importable outside Base** (unpublished). Build the island from parts below. |
| `Page / Body` SET | `8aab14fc18dca0e4c85886e38dc337a1ad56f50b` | importable; variant `Type=Default White` `382d07f935f0972fd0353684e511bd9783b6027e`; slots `"Main content"` (1340) / `"Side content"` (380) / `"Items"` nav |
| `*Sidebar*` SET | `60be5cbb4d070ccc4853589a555d949c3f23f62e` | use `Collapsed=True` variant for 2nd-level (52w) |
| `*Header*` SET | `387e2cf61b1bf4f2045d3ccefecc5c7820a86889` | see §3 for the two variants |
| `Sandbox alert` COMP | `07975654154febad577eac9662d90acf79dfa29c` | **NOT importable outside Base** (unpublished) → hand-build interim (§4) |
| `Statusbar` SET (trial/sandbox-only billing bar) | `cbab86a47d47d8399a03be80dbded51317d61610` | `type=Sandbox only` is a BILLING msg — NOT the in-app sandbox indicator |

### Variables (importVariableByKeyAsync)
| Token | Key | Value |
|---|---|---|
| `spacing/s` (island pad + gap) | `5a8e4573770ee8f921f141c1ab6c96835c3125a0` | 8 |
| `border-radius/xl` (card radius) | `03884e014085a48cf26670632be200a02b5a160c` | 16 |
| `semantic/background/neutral/subtlest/normal` (page bg) | `e7129860062f42ee2a929d1b4ccacd21133a03ee` | #f3f4f6 |
| `semantic/background/neutral/inverse/normal` (card fill) | `567811a0cf497ac911288a2f4a75a1d89ebff75c` | #ffffff |
| `semantic/border/neutral/subtlest/normal` (card border, normal) | `40baade65c87f4b56fd67b027ec695d0984fae39` | #e5e7eb |
| `semantic/border/yellow/subtle/normal` (card border, SANDBOX) | `ed34b693cbe71abf562e9cb323ec44fc96bd3a94` | #fad24a |
| `semantic/background/yellow/subtlest/normal` (interim plashka fill) | `f65302a79ce509d4d324e533c1e36fc1c3e9fc9e` | #fffbeb |
| `semantic/text/yellow/normal` (interim plashka text) | `8e208782e664c4f5e9a5af91465b43a86ad731b9` | #d27a0a |

> The `Page` set is unpublished, so you cannot `importComponentSetByKeyAsync` it in a consumer file. Build the island wrapper as plain frames (tokens above) + import `*Sidebar*` / `*Header*` / `Page / Body` by key. Flag to design: **publish `Page` set + `Sandbox alert`** so future builds use them canonically.

---

## 3. Two header types — select by nesting level

Both are the SAME `*Header*` set (`387e2cf6…`, `Version=New`); the `Type` variant differs:

| | 1st level (обычный) | 2nd level (хлебные крошки) |
|---|---|---|
| Header `Type` variant | **`Generic`** | **`Fullscreen (Future main version)`** |
| Variant key | `64ebf8f14b269eb122b7ce2edeef2ea65149f553` | `1dd023284d167fbcd71bd862294ff4028a7b5be0` |
| Native height | 56 | 97 (with Subheader) |
| Sidebar | 257 (expanded) | 52 (collapsed) |
| Use when | **section landing** opened directly from a sidebar item (Applicants, Transactions, Settings home) | **drill-down inside a section** (an applicant, a Rule/Blueprint editor, a sub-setting) where a breadcrumb path makes sense |

**Selection heuristic:** content reached by clicking a sidebar item → Generic + 257 sidebar. Content nested under a section (detail / editor / sub-config) → Fullscreen breadcrumbs + 52 sidebar.

**Migration signal:** a **✕ (Close) in the OLD header = 2nd level** → replace with the breadcrumbs (Fullscreen) header. The breadcrumb trail replaces the ✕ (path back).

### 🛑 MIGRATION: re-skin the existing header (flip Version), NEVER rebuild it — LOSSLESS

The old dashboard/KYC header is the **same `*Header*` set** as the redesign, just `Version=Old` (often wrapped in a local header component like `Header-levels`, set `8b724626…`, whose only child is the `*Header*`). It already holds the page's REAL content — a `*Tab Basic*` subheader with real tabs, action buttons, title, breadcrumb. **A migration MUST preserve all of that. Do it by flipping the existing header's `Version` Old→New — do NOT build a fresh header:**
```js
// find the *Header* instance (may be nested inside Header-levels / a local wrapper)
const hdr = frame.findOne(n => n.type==="INSTANCE" && /^\*Header\*/.test(n.name));
hdr.setProperties({ "Version": "New" });   // re-skins Old→New; KEEPS tabs/buttons/title/Subheader/breadcrumb
const bc = hdr.findOne(n => n.type==="INSTANCE" && /Breadcrumb/i.test(n.name));
if (bc) bc.setProperties({ "Name#6638:5": "Levels" });   // optional: per-page crumb
```
Verified 2026-06-15: flipping `Version=New` preserved tabs (`Steps / Configurations / Checks Execution Flow`), buttons (`Linked levels` / `Create level` / AI / ID / `Add tag`), title (`New level`), breadcrumb — only the skin + height changed (120→112).

🔴 **NEVER `Subheader#4002:0=false` / `Key#5362:0=false` on a MIGRATED header** — those rows hold REAL content (the level-editor tabs + the header action buttons). Stripping them was a shipped bug: the migration "completely replaced the header and didn't bring back the buttons + lost the subheader tabs". Likewise NEVER discard the old header and create a clean new one — that loses everything.

> The `Subheader=false / Key=false` "clean config" applies ONLY to a **fresh, from-scratch** build where a NEW `*Header*` instance shows junk placeholder tabs (`Tab_1…5`) + client chrome. In a MIGRATION the header already has real content — preserve it via the Version flip.

---

## 4. Sandbox mode — detect by VISIBLE indicator, never by presence

Sandbox is a STATE, not a default. When a screen is in sandbox:
- Card **border → yellow** `semantic/border/yellow/subtle/normal` #fad24a (instead of neutral #e5e7eb).
- A **`Sandbox alert` plashka** (24h, #fef3c7) as the **first child inside the Body card** (above the header).

### 🛑 Detection rule (hard-won)
**`sandbox = the sandbox indicator EXISTS AND is ancestor-visible`** — walk every parent's `.visible`. NEVER flag sandbox from mere node/text presence. The old `Header-levels` component contains a "You are in sandbox mode" TEXT in EVERY instance but **hidden** — detecting by `findOne(TEXT, /sandbox/)` falsely marks all screens sandbox (this happened: 26 frames wrongly got yellow borders + plashkas). Correct:
```js
const t = oldHeader.findOne(n => n.type==="TEXT" && /sandbox mode/i.test(n.characters));
let visible = !!t; let p=t; while(p && p!==oldHeader){ if(p.visible===false){visible=false;break;} p=p.parent; }
const sandbox = visible && t.visible;   // only true if actually rendered
```

### Sandbox alert plashka (interim — real component unpublished)
```js
const plashka = figma.createFrame();
plashka.name="Sandbox alert"; plashka.layoutMode="HORIZONTAL";
plashka.primaryAxisAlignItems="CENTER"; plashka.counterAxisAlignItems="CENTER";
plashka.itemSpacing=8; plashka.paddingLeft=16; plashka.paddingRight=16;
// fill → semantic/background/yellow/subtlest (interim; canonical Sandbox alert is #fef3c7)
card.insertChild(0, plashka);
plashka.layoutSizingHorizontal="FILL";
plashka.layoutSizingVertical="FIXED"; plashka.resize(plashka.width, 24);  // ⚠️ MUST set 24 — createFrame defaults to 100×100
// + Geist Medium 12/16 text "You're in Sandbox mode. Real verification checks are disabled."
```

---

## 5. Migration procedure — old full-bleed → island

Two modes: **in-place** (transform the existing frame; simulates "apply new layout to existing mockups after redesign") or **copy** (clone into a new section). Both use the same transform; in-place keeps the frame's x/y and does NOT clone.

**Placement:** migrated output goes on the SOURCE's page, NOT `figma.currentPage` (which is a reflex from dashboard/websdk builders → lands on the wrong page). For a copy: `clone()` then append to the source's page, positioned clear of the source. For in-place: don't move.

### 🛑 Preservation principle — a migration RESKINS + REFRAMES, it NEVER rebuilds from scratch
Keep EVERY original element: the header (re-skin via the Version flip, §3 — keeps its tabs/buttons/title/breadcrumb), the content, and ALL overlays (toasts, dropdowns, notes). Losing the subheader tabs, the header action buttons, or the toast messages = FAIL. Do not delete-and-recreate any of them; restructure what's already there.

### Per-frame transform (in place or on a clone)
```
0. Capture origH = frame.height (you restore it — §6).
1. Read the OLD frame:
   - the header instance — find the *Header* (it may be nested inside a wrapper like Header-levels).
   - content = the page content frame.
   - overlays = ALL Toast / Dropdown / etc. instances (capture references — you will keep them).
   - sandbox = VISIBLE sandbox indicator (§4), NOT mere presence.
2. RE-SKIN the header in place: flip its *Header* `Version` Old→New (§3). Keep tabs/buttons/title;
   optionally update the breadcrumb crumb. Do NOT remove or replace the header.
3. Frame → page shell: layoutMode=HORIZONTAL, paddings 0, fill page-bg grey.
4. *Sidebar* Collapsed=True (52); layoutAlign="STRETCH"; clear its #e1e5ea border strokes (§6).
5. Island (VERTICAL, pad T8/R8/B8/L0 spacing/s, gap8) → Main body (HORIZONTAL gap8) → Body card
   (white, radius16, border neutral OR yellow-if-sandbox §4, clipsContent=true).
6. MOVE the EXISTING (re-skinned) header into the card (top, FILL width), then move the content under it.
   (Move the Header-levels wrapper if the *Header* is nested in one — its inner re-skinned header comes with it.)
7. If actually sandbox (§4): insert Sandbox alert plashka (24h) as card child 0.
8. PRESERVE overlays: keep each toast/dropdown as a frame child; set layoutPositioning="ABSOLUTE"
   AFTER the frame is auto-layout (§6); reposition (e.g. toast x=1440-w-32, y=80). NEVER drop them.
9. Sizing — see §6 (preserve original height; recenter content AFTER widths settle).
```

---

## 6. Sizing rules (every one caused a real bug — get them right)

1. **Preserve the original outer height.** A migration must NOT change the frame's dimensions. Set the frame `counterAxisSizingMode="FIXED"; resize(1440, origH)`, then cascade `layoutSizingVertical="FILL"` down island → mainBody → card → content. Header stays 56; card `clipsContent=true` clips overflow. (Header shrank 120→56, so the content zone is actually a bit larger, but the frame stays exactly 800/1130/etc.)
   - ❌ Letting the frame HUG content (`counterAxisSizingMode=AUTO`) makes heights drift (800→922…). Wrong for migration.
   - (Only a from-scratch standalone build may hug; an existing-mockup migration must preserve height.)
2. **Recenter content AFTER container widths settle.** Re-hosted content that was LEFT-constrained does not auto-recenter when the card shrinks 1440→1380. Recenter LAST (after card/island/frame widths are final, content.width==1380): `shift=(content.width - span)/2 - minX; children.forEach(c=>c.x+=shift)`. CENTER-constrained content lands 148/148 on its own (shift≈0). ❌ Running the recenter while `content.width` is still a transient (~640, before card FILL) overshoots → content at x=-492.
3. **Overlays must be ABSOLUTE, set AFTER the frame is auto-layout.** `layoutPositioning="ABSOLUTE"` is a no-op while the parent is still NONE-layout → the overlay stays in flow and squishes the island (1388→936). Set it after HORIZONTAL layout is applied; reposition relative to the frame.
4. **Sidebar fills height via `layoutAlign="STRETCH"`**, not `layoutSizingVertical="FILL"` against a hugging parent.
5. **Hide the sidebar border (TEMPORARY):** the inner `Sidebar` instance has a right-edge `#e1e5ea` stroke that draws a line at the sidebar/island boundary; clear it (`strokes=[]`) for a seamless flush sidebar. (Reversible; the new Sidebar component will likely handle this itself.)
6. **Hand-built frames: always set BOTH `layoutSizing` axes** — `createFrame()` defaults to 100×100 (this is why the Sandbox alert shipped 100px tall when only width was set).

---

## 7. Migration audit (property-level — assert VALUES, not presence)

> Hard lesson from this session: a structural/skeleton check ("does the island/card/header exist?") passes builds that are present-but-wrong. The review must assert actual property VALUES. Each check below caught a real defect.

For every migrated frame:
- [ ] **Frame height == original** (migration preserves outer dimensions).
- [ ] Frame width 1440; island width == sidebar-complement (1388 collapsed / 1183 expanded).
- [ ] Sidebar 52/257; **no `#e1e5ea` border stroke** remaining.
- [ ] Card: border == expected (#e5e7eb normal / #fad24a sandbox — driven by §4 detection, NOT presence); radius == 16.
- [ ] **Sandbox correctness:** if not actually sandbox → neutral border AND no Sandbox alert plashka. If sandbox → yellow border AND plashka **height == 24**.
- [ ] **Header re-skinned, NOT rebuilt:** the original `*Header*` is still present with `Version=New`; its **subheader tabs and action buttons are PRESERVED** (tab count + button count match the old header; title + breadcrumb intact). A header showing only breadcrumb+title (tabs/buttons gone) = FAIL (content was stripped).
- [ ] **Overlays PRESERVED:** every original Toast/Dropdown still exists in the frame (count matches the old frame) AND `layoutPositioning == "ABSOLUTE"`. A missing toast = FAIL.
- [ ] Content: centered (|L−R| ≤ 20) AND no overflow (minX ≥ 0, maxX ≤ cardW).
- [ ] When fixing a CLASS across N items, enumerate ALL N — don't hardcode a subset (missed 1 of 4 toast frames once).
- [ ] **Page-load:** nodes on a non-current page return null from `getNodeByIdAsync` until `page.loadAsync()`. A nested section is found via `page.findOne` (recursive), not `page.children.find`.

---

## 8. Known design-source gaps (flag to design team)
- `Page` component set (`ccd4779c…`) — not published from Base → can't be instantiated in consumer files; island is hand-assembled meanwhile.
- `Sandbox alert` component (`07975654…`) — not published → hand-built interim plashka (fill #fffbeb vs canonical #fef3c7).
- The hidden "You are in sandbox mode" TEXT baked into `Header-levels` is a detection trap (see §4).
