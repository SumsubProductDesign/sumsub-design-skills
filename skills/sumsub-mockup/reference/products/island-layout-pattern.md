# Island Layout (Ver=New) + Migration — Dashboard

> The post-redesign Dashboard layout: main content lives inside a rounded white **"island" card** floating on a grey page, with insets **top / right / bottom** and **flush-left against the sidebar**.
> Canonical `Page` component: file `tJMo5DkqQUN0H6N8apN0N7`, set `24836:83444` (variants Ver=New × Type=Basic|Full screen page × Sandbox=No|Yes, all 1440×1080).
> Validated end-to-end by migrating 26 KYC level-editor mockups (file `xhjtb7G71gVOawl0pOilSx`) 2026-06-15.

---

## 0. THE ESSENCE (read this first — it is the whole job)

**Building/migrating an island screen = exactly three steps, nothing more:**
1. **Instantiate the WHOLE-layout component `Page`** (set `ccd4779c…`) — it already contains the sidebar + island + rounded card + header. You never assemble any of that yourself.
2. **Apply the right VARIANT:** `Type` = `Basic` (1st level) / `Full screen page` (2nd level), `Sandbox` = `No`/`Yes`. The variant drives the whole chrome (sidebar width, header style, sandbox border + plashka).
3. **Put the content INSIDE its slot** (`"Main content"` / `"Side content"`), removing the default placeholder.

That's it. Do **NOT** hand-build the island from frames. Do **NOT** detach the instance. Do **NOT** recreate the sidebar/card/header as your own nodes. If you find yourself calling `figma.createFrame()` for an "Island"/"Body"/"Card" — STOP: you're doing it wrong; instantiate `Page` instead. (The only exception is a logged import-throw — see §2 HARD RULE.) The header's title/breadcrumb/tabs/buttons are configured ON the Page instance's built-in header; the page-specific body goes in the slot.

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
| `Page` SET | `ccd4779c69fbf17342db36c7fe57d1160306efdf` | **PUBLISHED (2026-06-15) — importable. INSTANTIATE it** (see Build approach). Variant props: `Type` (Basic/Full screen page), `Sandbox` (No/Yes), `Statusbar`, `Summy AI`. Slots: `Main content` 1340 / `Side content` 380 / `Items` nav. |
| `Page / Body` SET | `8aab14fc18dca0e4c85886e38dc337a1ad56f50b` | importable; variant `Type=Default White` `382d07f935f0972fd0353684e511bd9783b6027e`; slots `"Main content"` (1340) / `"Side content"` (380) / `"Items"` nav |
| `*Sidebar*` SET | `60be5cbb4d070ccc4853589a555d949c3f23f62e` | use `Collapsed=True` variant for 2nd-level (52w) |
| `*Header*` SET | `387e2cf61b1bf4f2045d3ccefecc5c7820a86889` | see §3 for the two variants |
| `Sandbox alert` COMP | `07975654154febad577eac9662d90acf79dfa29c` | OBSOLETE for builds — sandbox is now a `Page` `Sandbox=Yes` variant (§4). (Still unpublished, but no longer needed.) |
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

### Build approach — INSTANTIATE the `Page` component + fill its slot. NEVER detach, NEVER hand-build (except fallback).

🛑 **The layout must be a live `Page` component INSTANCE with content placed into its slot — do NOT detach the instance, and do NOT assemble the island from raw frames.** (Костя 2026-06-15: *"нужно, чтобы скил использовал инстанс компонента лейаута, а не детачил его и заменял слот на нужный контент"*.)

**Preferred (canonical) path:**
```js
const pageSet = await figma.importComponentSetByKeyAsync("ccd4779c69fbf17342db36c7fe57d1160306efdf");
const page = pageSet.children.find(c => /Full screen page/.test(c.name) /* or Basic */).createInstance();
// fill the content slot (do NOT detach):
const slot = page.findAll(n => n.type==="SLOT").filter(s => !/image|left bar/i.test(s.name))
  .sort((a,b)=>(b.width*b.height)-(a.width*a.height))[0];   // "Main content" / "Slot"
slot.insertChild(0, contentInstance);     // slot.insertChild — never appendChild, never detach
// configure the Page's own *Header* (already Version=New) + sandbox variant via the Page's variant props.
```

**✅ `Page` is PUBLISHED (2026-06-15) — the instance approach is validated and REQUIRED. Use it.** Validated end-to-end recipe:
```js
const pageSet = await figma.importComponentSetByKeyAsync("ccd4779c69fbf17342db36c7fe57d1160306efdf");
// variant by level + sandbox: Type=Basic|Full screen page, Sandbox=No|Yes (Sandbox is a VARIANT prop — §4)
const page = pageSet.children.find(c => /Type=Full screen page/.test(c.name) && /Sandbox=No/.test(c.name)).createInstance();
// Put the WHOLE content block into "Main content" (1340) and leave "Side content" HIDDEN.
// (Do NOT split into Main/Side columns — it breaks positioned content; see §5.) Capture placeholder
// refs BEFORE insert and remove by ref (reading slot.children[].name AFTER insertChild throws on a stale node).
const main = page.findAll(n=>n.type==="SLOT").find(s=>/Main content/i.test(s.name));
const ph = [...main.children];          // default placeholder(s), captured before insert
main.insertChild(0, content);           // `content` = the whole content block
for (const p of ph) { try { p.remove(); } catch(e){} }
// header: the Page's built-in header is Version=New Fullscreen — configure it (title/crumb + relabel its Subheader tabs from the original):
const hdr = page.findOne(n=>n.type==="INSTANCE"&&/^\*Header\*/.test(n.name)&&n.visible);
hdr.setProperties({ "Title text#3817:0": title });
hdr.findOne(n=>/Breadcrumb/i.test(n.name))?.setProperties({ "Name#6638:5": crumb });
const tb = hdr.findOne(n=>/^\*Tab Basic\*/.test(n.name));
const items = tb.findAll(n=>/Tab Basic \/ Item/i.test(n.name));
origTabLabels.forEach((lbl,i)=>{ items[i].setProperties({ "Label text#4517:0": lbl }); items[i].visible=true; });  // relabel from original
items.slice(origTabLabels.length).forEach(it=>it.visible=false);  // hide extras
```
Validated: result is a live `Page` INSTANCE (`type==="INSTANCE"`), content slotted, default placeholders removed, header tabs relabeled to the original (`Steps / Configurations / Checks Execution Flow`).

### 🛑🛑 HARD RULE — import-first, instance-MANDATORY (hand-build is BANNED unless the import actually throws)

The recurring failure: the skill keeps **hand-building the island from raw frames even though `Page` imports fine** — defaulting to the familiar path and calling it "the fallback". This is BANNED. Enforce mechanically:

1. **MANDATORY first step of any island build/migration:** `const pageSet = await figma.importComponentSetByKeyAsync("ccd4779c69fbf17342db36c7fe57d1160306efdf")`.
2. **If that resolves (it does — Page is published) → you MUST instantiate `Page` and fill its slot. Hand-building raw frames is FORBIDDEN.**
3. Hand-build is permitted **ONLY** if step 1 *throws*, and your build log MUST paste the actual thrown error string. No error string in the log ⇒ hand-build was illegitimate ⇒ the build FAILS.

**Banned rationalizations (each = an automatic FAIL):**
- "I'll hand-build the island" / "assemble the frames" — when Page imports.
- "hand-build is the safe/familiar/fallback path" — fallback requires a thrown import error, logged.
- "the §7 audit passed" — §7's instance check is only satisfied by an actual `Page` INSTANCE OR a logged import-throw; a hand-built tree with no logged throw FAILS it.
- "the result looks the same" — a detached/hand-built frame tree is NOT a component instance; it won't track redesign updates and is a different node type. Looking similar is irrelevant.

`Sandbox alert` (`07975654…`) is **no longer needed**: sandbox is a `Page` variant (§4).

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

### 🛑 Header: use the `Page` instance's OWN header — configure it from the original, then DISCARD the old header

When you instantiate `Page` (the required path, §0/§2), it ALREADY contains a clean `Version=New` Fullscreen header. **Use THAT header. Do NOT keep or "flip" the old header** — READ the old header's labels (title, Subheader tab labels, action-button labels) and apply them to the Page's header; the old header is removed with the old frame.

```js
const hdr = page.findOne(n => n.type==="INSTANCE" && /^\*Header\*/.test(n.name) && n.visible);  // the Page's OWN header
hdr.setProperties({ "Title text#3817:0": title, "Key#5362:0": false });   // Key=false drops the 'Key name' badge → clean
hdr.findOne(n=>/Breadcrumb/i.test(n.name))?.setProperties({ "Name#6638:5": "Levels" });
const tb = hdr.findOne(n=>/^\*Tab Basic\*/.test(n.name));
const items = tb.findAll(n=>/Tab Basic \/ Item/i.test(n.name));
origTabLabels.forEach((l,i)=>{ items[i].setProperties({ "Label text#4517:0": l }); items[i].visible=true; });
items.slice(origTabLabels.length).forEach(it=>it.visible=false);
// action buttons: carry the original's text-action buttons (Create level / Run level / Save) — enable
// hdr Show actions slot#6943:20=true, clone each into the "Actions slot", then SET clone.visible=true
// (clones arrive hidden). Validated: 'Create level' renders in the cluster alongside the icon actions.
```
✅ **Verified**: the Page's own header configured this way is CLEAN — `Levels / New level` + the original tabs (`Steps / Configurations / Checks Execution Flow`), with `Key=false` removing the only stray badge. No applicant junk.

🔴 **Do NOT flip the OLD header's `Version` Old→New** (this was the pre-publish hand-build trick). Flipping the OLD applicant-context header surfaces junk (ClientNickname / ID / Suspicious / a default 'Button') — which is exactly what made past runs bail to hand-build. That junk does NOT exist on the Page instance's OWN header. The `Version`-flip / keep-old-header approach is **only** valid in the hand-build fallback (when `Page` is unimportable); on the instance path, always use the Page's own header.

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

### Applying sandbox — use the `Page` `Sandbox=Yes` VARIANT (not hand-built)
Sandbox is a **variant property of the `Page` component**: instantiate `…Sandbox=Yes` (or set the `Sandbox` variant prop). The yellow island border + the `Sandbox alert` plashka come built-in — no hand-building, and the standalone `Sandbox alert` component is NOT needed. The detection rule above only decides WHICH variant (Yes/No) to use.

> Hand-built plashka (only for the legacy hand-build fallback when the `Page` component is unavailable): a 24h HORIZONTAL frame, fill `semantic/background/yellow/subtlest`, `layoutSizingVertical="FIXED"; resize(w,24)` (createFrame defaults 100×100 → must set 24), Geist Medium 12/16 text. Prefer the `Page Sandbox=Yes` variant instead.

---

## 5. Migration procedure — old full-bleed → island

Two modes: **in-place** (transform the existing frame; simulates "apply new layout to existing mockups after redesign") or **copy** (clone into a new section). Both use the same transform; in-place keeps the frame's x/y and does NOT clone.

**Placement:** migrated output goes on the SOURCE's page, NOT `figma.currentPage` (which is a reflex from dashboard/websdk builders → lands on the wrong page). For a copy: `clone()` then append to the source's page, positioned clear of the source. For in-place: don't move.

### 🛑 Preservation principle — a migration RESKINS + REFRAMES, it NEVER rebuilds from scratch
Keep EVERY original element: the header (re-skin via the Version flip, §3 — keeps its tabs/buttons/title/breadcrumb), the content, and ALL overlays (toasts, dropdowns, notes). Losing the subheader tabs, the header action buttons, or the toast messages = FAIL. Do not delete-and-recreate any of them; restructure what's already there.

### Per-frame transform (INSTANCE-based — required now that `Page` is published)
```
0. Capture origH = frame.height.
1. Read the OLD frame (capture, don't discard):
   - original header → its TITLE, Subheader tab LABELS, action-button labels.
   - content → main column + side column (e.g. Body 640 + Overview 380).
   - overlays → ALL Toast / Dropdown instances.
   - sandbox → VISIBLE indicator (§4), not mere presence.
2. Instantiate Page: Type=Full screen page (2nd level) / Basic (1st level); Sandbox=Yes ONLY if detected.
3. Move the WHOLE content into the "Main content" slot; leave "Side content" HIDDEN (Main is then 1340 and
   fits the form+overview pair as the original positioned it). Do NOT split form→Main / overview→Side — that
   left-flushes the form in a shrunk 896 column and breaks the layout. Remove the slot's default placeholder.
   (insertChild into a SLOT invalidates the node ref — re-fetch from slot.children for any follow-up edit.)
4. Configure the Page's built-in header (Version=New) from the original — PRESERVE its content:
   Title (`Title text#3817:0`), breadcrumb crumb (`Name#6638:5`), relabel the Subheader tabs from the
   original (`Label text#4517:0`) + hide extras, carry the original action buttons (enable + label).
   Do NOT leave the junk default tabs (Tab_1…5); do NOT strip the real tabs/buttons.
5. Overlays (Toast/Dropdown) → place as SIBLINGS of the Page instance (in its parent), positioned over it.
   A Page INSTANCE cannot accept appended children (instance children are LOCKED → `page.appendChild(ov)` is
   illegal and drops the overlay — this deleted toasts in a real run). Re-position: `ov.x = page.x+1440-w-32`.
6. Place the Page instance at the old frame's position; remove the old frame. Result IN PLACE = a live
   `Page` INSTANCE in the same spot. Preserve origH (resize the instance to 1440×origH — §6).
```
### ✅ EXACT validated migration function — COPY AND RUN THIS verbatim (do NOT write your own)

The skill keeps writing its own build code and defaulting to hand-build. **Do not.** This function is validated end-to-end (live `Page` INSTANCE, height preserved 800, content in slots, header tabs preserved). Use it per frame:

```js
async function migrateFrameToIsland(srcFrame){
  const origH = Math.round(srcFrame.height);
  // 1. READ the original (capture, don't discard)
  const oldHeader = srcFrame.findOne(n=>n.type==="INSTANCE" && /Header-levels|^\*Header\*/.test(n.name));
  const innerHdr  = oldHeader ? (oldHeader.findOne(n=>n.type==="INSTANCE"&&/^\*Header\*/.test(n.name)) || oldHeader) : null;
  const tabLabels = innerHdr ? innerHdr.findAll(n=>n.type==="INSTANCE"&&/Tab Basic \/ Item/i.test(n.name)&&n.visible)
      .map(t=>{const tx=t.findOne(x=>x.type==="TEXT"&&x.visible);return tx?tx.characters:null;}).filter(Boolean) : [];
  let title="Title"; const tn=innerHdr&&innerHdr.findOne(n=>n.type==="TEXT"&&n.name==="Title"); if(tn)title=tn.characters;
  // sandbox = VISIBLE indicator only (ancestor-aware), never mere presence
  let sandbox=false; if(innerHdr){const s=innerHdr.findOne(n=>n.type==="TEXT"&&/sandbox mode/i.test(n.characters)); if(s){let p=s,v=s.visible;while(p&&p!==innerHdr){if(p.visible===false){v=false;break;}p=p.parent;} sandbox=v;}}
  const content  = srcFrame.children.find(c=>c.type==="FRAME"&&c.name==="Content"); // the WHOLE level-editor content (form + overview as the original positioned them)
  const overlays = srcFrame.children.filter(c=>c.type==="INSTANCE"&&/Toast|Dropdown/i.test(c.name));
  // 2. INSTANTIATE the whole-layout Page (MANDATORY — if this throws, log the error; only then fallback)
  const pageSet = await figma.importComponentSetByKeyAsync("ccd4779c69fbf17342db36c7fe57d1160306efdf");
  const variant = pageSet.children.find(c=>/Type=Full screen page/.test(c.name) && new RegExp("Sandbox="+(sandbox?"Yes":"No")).test(c.name));
  const page = variant.createInstance();
  const parent=srcFrame.parent, x=srcFrame.x, y=srcFrame.y, nm=srcFrame.name;
  parent.appendChild(page); page.x=x; page.y=y; page.name=nm;
  // 3. FILL the Main content slot with the WHOLE content (do NOT split into Main/Side columns — that left-flushes the form
  //    in a shrunk 896 column and breaks the layout). Leave Side content HIDDEN → Main content slot = 1340, fits the pair.
  //    NOTE: insertChild into a SLOT INVALIDATES the inserted node's reference — re-fetch from slot.children afterwards.
  if(content){
    const slot=page.findAll(n=>n.type==="SLOT").find(s=>/Main content/i.test(s.name));
    const ph=[...slot.children];                 // capture placeholders BEFORE insert (avoid stale-node throw)
    slot.insertChild(0, content);
    for(const p of ph){try{p.remove();}catch(e){}}
    // optional recenter the form+overview pair within 1340 — RE-FETCH the node first (original ref is now stale):
    try{ const placed=slot.children.find(c=>c.type==="FRAME"&&c.children&&c.children.length>1) || slot.children[0];
      const kids=placed.children.filter(c=>c.visible!==false); const minX=Math.min(...kids.map(c=>c.x)), maxXR=Math.max(...kids.map(c=>c.x+c.width));
      const shift=(slot.width-(maxXR-minX))/2-minX; if(Math.abs(shift)>1)kids.forEach(k=>{try{k.x=k.x+shift;}catch(e){}}); }catch(e){}
  }
  // (Side content slot stays hidden — the editor content is a single positioned block, not two columns.)
  // 4. CONFIGURE the Page's built-in Version=New header from the original
  const hdr=page.findOne(n=>n.type==="INSTANCE"&&/^\*Header\*/.test(n.name)&&n.visible);
  if(hdr){ try{hdr.setProperties({"Title text#3817:0":title, "Key#5362:0":false});}catch(e){}  // Key=false → clean (no 'Key name' badge)
    const bc=hdr.findOne(n=>/Breadcrumb/i.test(n.name)); if(bc){try{bc.setProperties({"Name#6638:5":"Levels"});}catch(e){}}
    const tb=hdr.findOne(n=>/^\*Tab Basic\*/.test(n.name));
    if(tb&&tabLabels.length){const items=tb.findAll(n=>/Tab Basic \/ Item/i.test(n.name));
      items.forEach((it,i)=>{try{ if(i<tabLabels.length){it.setProperties({"Label text#4517:0":tabLabels[i]});it.visible=true;} else it.visible=false; }catch(e){}});}
    // CARRY the original action buttons (Create level / Run level / Save — text-labeled ones) into the
    // header's "Actions slot". Clone them in, then SET VISIBLE (clones arrive visible=false). srcFrame
    // still exists here (removed in step 7), so innerHdr's buttons are clonable.
    try{
      const origBtns = innerHdr ? innerHdr.findAll(n=>n.type==="INSTANCE"&&/^\*Button\*/.test(n.name)&&n.visible)
        .filter(b=>{const t=b.findOne(x=>x.type==="TEXT"&&x.visible); return t && t.characters.trim().length>1;}) : [];
      if(origBtns.length){
        hdr.setProperties({"Show actions slot#6943:20":true});
        const aSlot = hdr.findAll(n=>n.type==="SLOT").find(s=>/Actions slot/i.test(s.name));
        if(aSlot){ const ph=[...aSlot.children];
          for(const ob of [...origBtns].reverse()){ const c=ob.clone(); aSlot.insertChild(0,c); try{c.visible=true;}catch(e){} }  // ⚠️ clone arrives hidden → set visible
          for(const p of ph){try{p.remove();}catch(e){}} }
      }
    }catch(e){}
  }
  // 5. OVERLAYS — a Page INSTANCE cannot accept appended children (instance children are LOCKED → page.appendChild(ov)
  //    is illegal and silently drops the toast). Place overlays as SIBLINGS of the Page instance, positioned over it.
  for(const ov of overlays){ try{ parent.appendChild(ov); ov.x = page.x + 1440 - Math.round(ov.width) - 32; ov.y = page.y + 80; }catch(e){} }
  // 6. PRESERVE original height
  try{page.resize(1440, origH);}catch(e){}
  // 7. remove the now-empty old frame (in-place). For COPY mode: clone srcFrame first and pass the clone.
  try{srcFrame.remove();}catch(e){}
  return page;
}
```
Validated result per frame: `page.type==="INSTANCE"`, `page.height===origH`, content in the Main slot (Side hidden), header = breadcrumb + title + the original tabs + the original action buttons (e.g. `Create level`) carried into the Actions slot, overlays preserved as siblings.

---

## 6. Sizing rules (every one caused a real bug — get them right)

1. **Preserve the original outer height.** A migration must NOT change the frame's dimensions. Set the frame `counterAxisSizingMode="FIXED"; resize(1440, origH)`, then cascade `layoutSizingVertical="FILL"` down island → mainBody → card → content. Header stays 56; card `clipsContent=true` clips overflow. (Header shrank 120→56, so the content zone is actually a bit larger, but the frame stays exactly 800/1130/etc.)
   - ❌ Letting the frame HUG content (`counterAxisSizingMode=AUTO`) makes heights drift (800→922…). Wrong for migration.
   - (Only a from-scratch standalone build may hug; an existing-mockup migration must preserve height.)
2. **Recenter content AFTER container widths settle.** Re-hosted content that was LEFT-constrained does not auto-recenter when the card shrinks 1440→1380. Recenter LAST (after card/island/frame widths are final, content.width==1380): `shift=(content.width - span)/2 - minX; children.forEach(c=>c.x+=shift)`. CENTER-constrained content lands 148/148 on its own (shift≈0). ❌ Running the recenter while `content.width` is still a transient (~640, before card FILL) overshoots → content at x=-492.
3. **Overlays (hand-build fallback only): ABSOLUTE, set AFTER the frame is auto-layout.** `layoutPositioning="ABSOLUTE"` is a no-op while the parent is still NONE-layout → the overlay stays in flow and squishes the island (1388→936). Set it after HORIZONTAL layout is applied; reposition relative to the frame. **On the INSTANCE path the Page instance CANNOT hold appended overlays (children locked) — place them as SIBLINGS of the instance instead (§5).**
4. **Sidebar fills height via `layoutAlign="STRETCH"`**, not `layoutSizingVertical="FILL"` against a hugging parent.
5. **Hide the sidebar border (TEMPORARY):** the inner `Sidebar` instance has a right-edge `#e1e5ea` stroke that draws a line at the sidebar/island boundary; clear it (`strokes=[]`) for a seamless flush sidebar. (Reversible; the new Sidebar component will likely handle this itself.)
6. **Hand-built frames: always set BOTH `layoutSizing` axes** — `createFrame()` defaults to 100×100 (this is why the Sandbox alert shipped 100px tall when only width was set).

---

## 7. Migration audit (property-level — assert VALUES, not presence)

> Hard lesson from this session: a structural/skeleton check ("does the island/card/header exist?") passes builds that are present-but-wrong. The review must assert actual property VALUES. Each check below caught a real defect.

For every migrated frame:
- [ ] **Layout shell is a live `Page` component INSTANCE** — ENFORCE mechanically: the audit itself runs `try{ await figma.importComponentSetByKeyAsync("ccd4779c…"); pageImportable=true }catch{ pageImportable=false }`. Then for each migrated frame, check whether its shell is a `Page` instance (a descendant INSTANCE whose `mainComponent.parent` is the `Page` set) vs a hand-built `Island` FRAME. **If `pageImportable` AND the shell is a hand-built frame tree → FAIL** ("hand-built while Page was importable"). Hand-build passes ONLY when `pageImportable===false` AND the build log pasted the thrown import error.
- [ ] **Frame height == original** (migration preserves outer dimensions).
- [ ] Frame width 1440; island width == sidebar-complement (1388 collapsed / 1183 expanded).
- [ ] Sidebar 52/257; **no `#e1e5ea` border stroke** remaining.
- [ ] Card: border == expected (#e5e7eb normal / #fad24a sandbox — driven by §4 detection, NOT presence); radius == 16.
- [ ] **Sandbox correctness:** if not actually sandbox → neutral border AND no Sandbox alert plashka. If sandbox → yellow border AND plashka **height == 24**.
- [ ] **Header content reproduced (instance path):** the Page's own Version=New header shows title + breadcrumb + the **original Subheader tabs** (relabeled) + the **original text-action buttons carried into the Actions slot** (e.g. `Create level` — and it must be `visible=true`, clones arrive hidden). A header with only breadcrumb+title (tabs/buttons missing) = FAIL.
- [ ] **Overlays PRESERVED:** every original Toast/Dropdown still exists (count matches the old frame) as a SIBLING of the Page instance, positioned over it. (Instance path: they CANNOT be children of the Page instance — instance children are locked. Hand-build fallback: ABSOLUTE child.) A missing toast = FAIL.
- [ ] **Content NOT split / not broken inside:** the editor content went into the "Main content" slot as one block with "Side content" left HIDDEN; the form is NOT left-flushed in a shrunk 896 column. Content centered-ish (|L−R| ≤ 40) AND no overflow.
- [ ] When fixing a CLASS across N items, enumerate ALL N — don't hardcode a subset (missed 1 of 4 toast frames once).
- [ ] **Page-load:** nodes on a non-current page return null from `getNodeByIdAsync` until `page.loadAsync()`. A nested section is found via `page.findOne` (recursive), not `page.children.find`.

---

## 8. Notes
- ✅ `Page` component set (`ccd4779c…`) — **published 2026-06-15**; instantiate it (Build approach). Resolved the earlier blocker.
- `Sandbox alert` (`07975654…`) — unpublished, but OBSOLETE: sandbox is a `Page` `Sandbox=Yes` variant.
- The hidden "You are in sandbox mode" TEXT baked into the old `Header-levels` is a detection trap (see §4) — detect sandbox by VISIBLE indicator only.
