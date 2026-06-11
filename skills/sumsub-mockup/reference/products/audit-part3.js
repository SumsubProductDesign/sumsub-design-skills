// ===== AUDIT SEGMENT 3/3 (7.48 → end) =====
// Run: set ROOT_ID_HERE + productContext (top), run via use_figma, collect {issues, info}.
// After all 3: concatenate issues + info; PASS iff total issues==0. Surface info[] (esp 7.56 stale warning).
// Self-contained (<50KB, comments intact, NO stripping).
// Audit script — paste and adapt ROOT_ID + productContext (the ONLY two edits allowed).
const root = figma.getNodeById("ROOT_ID_HERE");
// ⚠️ v3.151: productContext MUST be declared at the TOP — checks 7.44/7.45 (lines ~2452)
// reference it BEFORE the later "Product-required components" section. Declaring it only
// there caused a TDZ ReferenceError that forced agents to hand-fix the verbatim script.
// Set to "flow-builder" | "applicant-page" | "table-page" | "tm" | "case-management" | null,
// OR an object { canonicalMap, requiresCanonical } for canonical-match builds.
const productContext = null;
// ⚠️ v3.151: `page` is used by checks 7.46/7.47/7.48/7.45 (root must live on a Drafts page,
// section containment). Derive it from root's ancestor chain so those checks run verbatim.
let page = root.parent;
while (page && page.type !== "PAGE") page = page.parent;
const issues = [];
const all = root.findAll(n => true);

// Helper: component internals are not our responsibility. Skip any node
// whose ancestor chain (between itself and root) passes through an INSTANCE.
function isInsideInstance(n) {
  let p = n.parent;
  while (p && p !== root && p.type !== "PAGE") {
    if (p.type === "INSTANCE") return true;
    p = p.parent;
  }
  return false;
}
// Helper: is the node visible on canvas? (walks up checking every ancestor's visible flag)
function isVisible(n) {
  let cur = n;
  while (cur && cur !== root) {
    if (cur.visible === false) return false;
    cur = cur.parent;
  }
  return true;
}

const infos = [];
const sidebar = root.findOne(n =>
  n.type === "INSTANCE" && n.mainComponent?.parent?.name === "*Sidebar*"
);
// 7.48. Organism instance must use canonical width, NOT intrinsic (v3.126).
// Observed sim 2026-05-13: agent imported AP `Body` organism (intrinsic
// 942 wide), placed at x=380. Canonical Body in target file is 1060 wide.
// Agent kept intrinsic "to avoid distorting nested cards" — banned per
// v3.118 rule "Use the canonical instance width, not the variant's
// intrinsic width." Layout result: 380 + 942 = 1322, gap 118 on right.
// Resize after createInstance: bodyInstance.resize(canonicalW, intrinsicH).
{
  const apRoots = page.findAll(n => n.type === "FRAME" && /applicant/i.test(n.name));
  for (const root of apRoots) {
    if (!root.children) continue;
    // Find Body instance (anything that's INSTANCE and its mainComponent name contains "Body")
    const bodyInstance = root.children.find(c => {
      try {
        return c.type === "INSTANCE" && /^Body/.test(c.mainComponent?.parent?.name || c.mainComponent?.name || "");
      } catch(e) { return false; }
    });
    if (!bodyInstance) continue;
    // Find Summary on same root
    const summaryInstance = root.children.find(c => {
      try {
        return c.type === "INSTANCE" && /^Summary/.test(c.mainComponent?.parent?.name || c.mainComponent?.name || "");
      } catch(e) { return false; }
    });
    const summaryW = summaryInstance ? summaryInstance.width : 380;
    const expectedBodyW = 1440 - summaryW;
    if (Math.abs(bodyInstance.width - expectedBodyW) > 2) {
      issues.push(`7.48 ap-body-width: frame "${root.name}" Body instance width=${Math.round(bodyInstance.width)} ≠ canonical ${expectedBodyW} (1440 − Summary.width ${summaryW}). Agent likely kept the organism's intrinsic width. Resize: bodyInstance.resize(${expectedBodyW}, bodyInstance.height). Banned class: "kept at intrinsic to avoid distorting nested cards".`);
    }
  }
}

// 7.44. Case page (Pattern B) — Frame 270990504 wrapper + Container + Tab Basic alignment.
// ⚠️ v3.148: measurements updated to CURRENT canonical (drift confirmed via
// get_metadata on 4045:2323380, 2026-05-22). The pre-v3.146 layout (header
// at (0,0,1440,88), wrapper at (0,96,992,804), right col at (992,96)) is DEAD.
// Current canonical has a 52px collapsed Sidebar at (0,0), shifting everything:
//   root.children = [
//     *Sidebar* (52×900 @ 0,0, Type=Case management Collapsed=True),
//     Case page header (1388×88 @ 52,0),
//     Frame 270990504 (964×812 @ 52,88, FRAME, VERTICAL, no padding, clipsContent, FIXED height) {
//       Subheader (964×56, padding 32/32/0/1, CENTER/MAX align) { *Tab Basic* @ x=32 (FILL) },
//       Container (964×scroll, padding 32/24/24/24, itemSpacing 24) { Overview content @ 908 }
//     },
//     Case page right column (424×812 @ 1016,88)
//   ]
// Layout sum: 52 + 964 + 424 = 1440. This block folds in the former prose
// checklist #9 (wrapper.height FIXED + Tab Basic.x==32) so the runnable
// verbatim script actually asserts them. See case-management-pattern.md.
//
// Trigger: any frame whose first-level INSTANCE child is `Case page header`.
{
  const casePageHeaders = root.findAll(n =>
    n.type === "INSTANCE" &&
    n.mainComponent?.parent?.name === "Case page header"
  );
  for (const cph of casePageHeaders) {
    const screen = cph.parent;
    if (!screen) continue;

    // 7.44a — header position (post-drift: x=52, 1388×88)
    if (Math.abs(cph.x - 52) > 0.5 || Math.abs(cph.y) > 0.5) {
      issues.push(`Pattern B "${screen.name}": Case page header at (${Math.round(cph.x)},${Math.round(cph.y)}) — must be at (52, 0) (after the 52px Sidebar).`);
    }
    if (Math.abs(cph.width - 1388) > 0.5 || Math.abs(cph.height - 88) > 0.5) {
      issues.push(`Pattern B "${screen.name}": Case page header is ${Math.round(cph.width)}×${Math.round(cph.height)} — must be 1388×88.`);
    }

    // 7.44b — left wrapper presence + position + FIXED height
    const leftWrapper = screen.children.find(c =>
      c.type === "FRAME" && (c.name === "Frame 270990504" || /Frame\s*\d+/.test(c.name))
    );
    if (!leftWrapper) {
      issues.push(`Pattern B "${screen.name}": missing left wrapper FRAME (expected name "Frame 270990504"). Don't drop "Case page Overview tab content" directly into root — it must be wrapped in Frame 270990504 → Container with proper paddings. See case-management-pattern.md.`);
    } else {
      if (Math.abs(leftWrapper.x - 52) > 0.5 || Math.abs(leftWrapper.y - 88) > 0.5) {
        issues.push(`Pattern B "${screen.name}": left wrapper at (${Math.round(leftWrapper.x)},${Math.round(leftWrapper.y)}) — must be (52, 88) (after Sidebar, flush below 88px header, NO gap).`);
      }
      if (Math.abs(leftWrapper.width - 964) > 0.5) {
        issues.push(`Pattern B "${screen.name}": left wrapper width=${Math.round(leftWrapper.width)} — must be 964 (1440 − 52 Sidebar − 424 right col).`);
      }
      // folded from prose #9: wrapper MUST be FIXED at 812, not auto-grown to wrap 2400+px Container
      if (leftWrapper.height > 900) {
        issues.push(`Pattern B "${screen.name}": left wrapper height=${Math.round(leftWrapper.height)} — must be 812. Wrapper grew because layoutSizingVertical was not set to FIXED after appendChild; it hugged the Container's 2400+px content. Set clipsContent=true + FIXED height 812.`);
      } else if (Math.abs(leftWrapper.height - 812) > 0.5) {
        issues.push(`Pattern B "${screen.name}": left wrapper height=${Math.round(leftWrapper.height)} — must be 812.`);
      }

      // 7.44c — Subheader inside left wrapper + Tab Basic left-alignment (folded from #9)
      const subheader = leftWrapper.children.find(c => c.type === "FRAME" && /Subheader/i.test(c.name));
      if (!subheader) {
        issues.push(`Pattern B "${screen.name}": left wrapper has no Subheader FRAME. Required: HORIZONTAL frame named ".Header Full Screen Page / Subheader", padding 32/32/0/1, CENTER/MAX alignment, containing *Tab Basic* with 6 tabs.`);
      } else {
        const padOK = subheader.paddingLeft === 32 && subheader.paddingRight === 32;
        if (!padOK) {
          issues.push(`Pattern B "${screen.name}": Subheader paddings are L=${subheader.paddingLeft}/R=${subheader.paddingRight} — must be L=32, R=32.`);
        }
        if (subheader.primaryAxisAlignItems !== "CENTER" || subheader.counterAxisAlignItems !== "MAX") {
          issues.push(`Pattern B "${screen.name}": Subheader alignment is ${subheader.primaryAxisAlignItems}/${subheader.counterAxisAlignItems} — must be CENTER/MAX (anchors Tab Basic to bottom at y=23).`);
        }
        // folded from prose #9: Tab Basic MUST be FILL → left-aligned at x=32, not centered at ~224
        const tabBasic = subheader.findOne(n => n.type === "INSTANCE" && /\*?Tab Basic\*?/.test(n.name));
        if (tabBasic && tabBasic.x > 50) {
          issues.push(`Pattern B "${screen.name}": *Tab Basic* at x=${Math.round(tabBasic.x)} — must be x=32 (left-aligned). Tab Basic was not set to layoutSizingHorizontal="FILL", so Subheader's CENTER alignment centered the HUG-sized strip (~224.5 in a 964 wrapper).`);
        }
      }

      // 7.44d — Container inside left wrapper
      const container = leftWrapper.children.find(c => c.type === "FRAME" && c.name === "Container");
      if (!container) {
        issues.push(`Pattern B "${screen.name}": left wrapper has no Container FRAME. Required: VERTICAL frame named "Container", paddings 32/32/24/24 (L/R/T/B), itemSpacing 24, holding "Case page Overview tab content" at width 908 (FIXED; overflows the 900 content box by 8 → 24px visual right gutter).`);
      } else {
        // v3.153: pR=32 (was wrongly 24). Verified canonical Container 4045:2323405: L=R=32 (spacing/3xl), T=B=24 (spacing/2xl).
        const expectedPads = { paddingLeft: 32, paddingRight: 32, paddingTop: 24, paddingBottom: 24 };
        for (const [side, expected] of Object.entries(expectedPads)) {
          if (container[side] !== expected) {
            issues.push(`Pattern B "${screen.name}": Container ${side} = ${container[side]} — must be ${expected}. (Canonical Case page Container paddings: L=32, R=32, T=24, B=24, itemSpacing=24.)`);
          }
        }
        if (container.itemSpacing !== 24) {
          issues.push(`Pattern B "${screen.name}": Container itemSpacing = ${container.itemSpacing} — must be 24.`);
        }
      }
    }

    // 7.44e — right column position (post-drift: x=1016, 424×812)
    const rightCol = screen.children.find(c =>
      c.type === "INSTANCE" && c.mainComponent?.name === "Case page right column"
    );
    if (rightCol) {
      if (Math.abs(rightCol.x - 1016) > 0.5) {
        issues.push(`Pattern B "${screen.name}": Case page right column at x=${Math.round(rightCol.x)} — must be x=1016 (52 Sidebar + 964 wrapper). Right edge 1016+424=1440, flush with canvas edge, NO right margin in current canonical.`);
      }
      if (Math.abs(rightCol.y - 88) > 0.5) {
        issues.push(`Pattern B "${screen.name}": Case page right column at y=${Math.round(rightCol.y)} — must be y=88 (vertically aligned with left wrapper).`);
      }
      if (Math.abs(rightCol.width - 424) > 0.5 || Math.abs(rightCol.height - 812) > 0.5) {
        issues.push(`Pattern B "${screen.name}": Case page right column is ${Math.round(rightCol.width)}×${Math.round(rightCol.height)} — must be 424×812.`);
      }
    } else {
      issues.push(`Pattern B "${screen.name}": no Case page right column instance found. Pattern B requires it at (1016, 88) with 424×812.`);
    }
  }
}

// 7.42. Tab Basic — extra default-text items still visible.
// Observed (Rules list build, v3.57): Tab Basic has 12 .Tab Basic / Item
// children; skill renamed the first 4 but left items 5-11 with defaults
// ("Tab", "Tab_4", "Tab_5"...) AND visible=true on items 5-7. Each item
// still showed counter "5" + badge "Beta" defaults too.
{
  const tabContainers = root.findAll(n => n.type === "INSTANCE" && /^\*?Tab Basic/.test(n.name));
  for (const tc of tabContainers) {
    // v3.165: skip Tab Basic strips whose ancestor chain is hidden (e.g. the
    // *Header*'s disabled Subheader) — recurring FP: items have visible=true
    // but never render because the Subheader itself is hidden.
    if (!isVisible(tc)) continue;
    const items = (tc.children || []).filter(c => c.type === "INSTANCE" && /Tab Basic \/ Item/i.test(c.name));
    for (const item of items) {
      if (!item.visible) continue;
      const labelText = item.componentProperties?.["Label text#4517:0"]?.value;
      if (typeof labelText === "string" && /^Tab(_\d+)?$/.test(labelText.trim())) {
        issues.push(`Tab Basic item "${item.name}" is visible with default label "${labelText}". Either configure its Label text via setProperties or hide it via item.visible = false.`);
      }
      // Also flag visible Counter/Badge that weren't toggled off.
      const counterOn = item.componentProperties?.["Counter#5190:0"]?.value;
      const badgeOn = item.componentProperties?.["Badge#2885:0"]?.value;
      if (counterOn === true || badgeOn === true) {
        issues.push(`Tab Basic item "${item.name}" has Counter=${counterOn} / Badge=${badgeOn}. Set them to false unless you actually want to show a counter or "Beta" badge.`);
      }
    }
  }
}

// 7.35. SLOT alignment — CENTER with dead space.
// Observed (Domain management build, v3.55): drawer slot 712px, custom
// content 448px, slot.primaryAxisAlignItems = "CENTER" → 132px dead space
// above the content. After slot.appendChild(wrap), force MIN alignment.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (!body) continue;
  const slot = body.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  if (slot.primaryAxisAlignItems !== "CENTER") continue;
  const visKids = (slot.children || []).filter(c => c.visible);
  const totalChildH = visKids.reduce((s, c) => s + (c.height || 0), 0);
  const deadSpace = (slot.height || 0) - totalChildH;
  if (deadSpace > 60) {
    issues.push(`Modal/Drawer "${md.name}" SLOT has primaryAxisAlignItems = "CENTER" with ~${Math.round(deadSpace)}px dead space (slot ${Math.round(slot.height)}px, content ${Math.round(totalChildH)}px). After slot.appendChild(wrap), set slot.primaryAxisAlignItems = "MIN" to pin content to the top.`);
  }
}

// 7.28. Slot placeholder state — two failure modes.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (!body) continue;
  const slot = body.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  const visibleSlotKids = (slot.children || []).filter(c => c.visible);

  // (a) Double body — more than one visible child, placeholder wasn't hidden.
  if (visibleSlotKids.length > 1) {
    const names = visibleSlotKids.map(c => c.name).join(", ");
    issues.push(`Modal/Drawer "${md.name}" SLOT has ${visibleSlotKids.length} visible children [${names}]. Default placeholder wasn't hidden. Iterate slot.children and .visible=false every non-wrap sibling.`);
  }

  // (b) Empty modal — the ONLY visible child is the default placeholder
  // (Slot / Basic INSTANCE), no custom wrap was appended. Means slot.appendChild(wrap)
  // silently failed — usually because it was wrapped in try/catch (Rule #8 ban) or
  // because the wrap construction threw before the append call.
  if (visibleSlotKids.length === 1) {
    const only = visibleSlotKids[0];
    const isDefaultPlaceholder =
      (only.type === "INSTANCE" && /slot\s*\/\s*basic/i.test(only.name)) ||
      /^Slot \/ /i.test(only.name);
    if (isDefaultPlaceholder) {
      issues.push(`Modal/Drawer "${md.name}" has an EMPTY body — only the default "${only.name}" placeholder is visible, no custom wrap was appended. The body swap silently failed. Check for a try/catch around slot.appendChild (banned by Rule #8) or an earlier exception during wrap construction. Modal height is likely stuck at default (~228px for Size=Small empty).`);
    }
  }

  // (c) Suspicious modal height — matches default-empty heights closely.
  //     Default empties: Small=228h, Medium=240h-ish, Large=similar low value.
  //     If modal.height < 260 AND slot has only placeholder, definitely empty.
  if (md.height < 260 && visibleSlotKids.length <= 1 && visibleSlotKids.every(k => /slot\s*\/\s*basic/i.test(k.name || ""))) {
    issues.push(`Modal/Drawer "${md.name}" height ${Math.round(md.height)}px — suspiciously close to default-empty. Verify body content was actually appended (not swallowed by try/catch).`);
  }
}

// 7.27. Modal/Drawer body wrap has internal padding (Rule 7.12).
// The Body frame inside *Modal Basic* / *Drawer Basic* already pads its
// content. A wrap FRAME inside the SLOT should only use itemSpacing.
for (const md of all.filter(n => n.type === "INSTANCE" && (n.mainComponent?.parent?.name === "*Modal Basic*" || n.mainComponent?.parent?.name === "*Drawer Basic*"))) {
  const body = md.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (!body) continue;
  const slot = body.children?.find(c => c.type === "SLOT");
  if (!slot) continue;
  for (const wrap of slot.children || []) {
    if (!wrap.visible) continue;
    if (wrap.type !== "FRAME" && wrap.type !== "COMPONENT") continue;
    const pads = [wrap.paddingLeft, wrap.paddingRight, wrap.paddingTop, wrap.paddingBottom];
    const nonZero = pads.filter(p => typeof p === "number" && p > 0);
    if (nonZero.length > 0) {
      issues.push(`Modal/Drawer body wrap "${wrap.name}" has internal padding (L=${wrap.paddingLeft}, R=${wrap.paddingRight}, T=${wrap.paddingTop}, B=${wrap.paddingBottom}) — Rule 7.12: remove all paddings, the Body frame already pads. Keep only itemSpacing for vertical gaps.`);
    }
  }
}

// 7.25. Modal/Drawer body wrap WIDTH overflow.
// Common failure: skill creates a wrap FRAME via figma.createFrame() with
// `resize(modal.width, …)` then appendChild into the SLOT. But the slot's
// usable width is modal.width - body padding (typically ~48px). Result:
// wrap is 720px in a 672px slot, overflows by ~48px on the right, content
// gets clipped. The general overflow check misses it because SLOT nodes
// have their own geometry.
{
  const modalsForOverflow = all.filter(n =>
    n.type === "INSTANCE" && (
      n.mainComponent?.parent?.name === "*Modal Basic*" ||
      n.mainComponent?.parent?.name === "*Drawer Basic*"
    )
  );
  for (const m of modalsForOverflow) {
    const body = m.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
    if (!body) continue;
    const slot = body.children?.find(c => c.type === "SLOT");
    if (!slot) continue;
    for (const child of slot.children || []) {
      if (!child.visible) continue;
      if (child.width > slot.width + 0.5) {
        issues.push(`Modal/Drawer body wrap "${child.name}" is ${Math.round(child.width)}px wide inside a ${Math.round(slot.width)}px SLOT (modal ${Math.round(m.width)}px). Resize to slot.width: wrap.resize(slot.width, wrap.height) — NOT modal.width, which ignores the Body's ~48px internal padding.`);
      }
    }
  }
}

// 7.2. Modal / Drawer — empty Body + vertical centering + fake-modal detection.
// SLOT properties on Modal Basic / Drawer Basic are READ-ONLY in the Plugin API
// (figma throws "Slot component property values cannot be edited"). Correct
// path is to appendChild into the instance's Body FRAME directly.
const modals = all.filter(n =>
  n.type === "INSTANCE" && (
    n.mainComponent?.parent?.name === "*Modal Basic*" ||
    n.mainComponent?.parent?.name === "*Drawer Basic*"
  )
);
for (const m of modals) {
  // Empty Body check — Body frame should have children (the content you added)
  const bodyFrame = m.children?.find(c => c.type === "FRAME" && c.name.trim() === "Body");
  if (bodyFrame && bodyFrame.children.length === 0) {
    issues.push(`Modal/Drawer "${m.name}" — Body frame is empty. appendChild your content into modal.children.find(c=>c.name.trim()==="Body"). SLOT via setProperties is read-only and will throw.`);
  }
  // Vertical centering check
  const parent = m.parent;
  if (parent && typeof parent.height === "number" && parent.height > 0 && m.layoutPositioning === "ABSOLUTE") {
    const modalCenter = m.y + m.height / 2;
    const parentCenter = parent.height / 2;
    const off = Math.abs(modalCenter - parentCenter);
    if (off > 40) {
      issues.push(`Modal/Drawer "${m.name}" not vertically centered in "${parent.name}" (off by ${Math.round(off)}px). Compute y AFTER body is populated: modal.y = (parent.height - modal.height) / 2`);
    }
  }
}

// 7.3. Fabrication detector — custom FRAMEs that should be DS component instances.
// Pattern: name starts with "Modal · …", "Drawer · …", "Annotation · …",
// "Empty State", "Table · …", "Toolbar · …", "Scenario · …" → fake.
const fabricationPatterns = [
  { re: /^Modal\s*[·\/]/i,      fix: "Use *Modal Basic* instance + Body frame appendChild" },
  { re: /^Drawer\s*[·\/]/i,     fix: "Use *Drawer Basic* instance + Body frame appendChild" },
  { re: /^Popover\s*[·\/]/i,    fix: "Use *Popover* instance" },
  { re: /^Annotation\s*[·\/]/i, fix: "Use Scenarios annotation component (key b5cdb94a14e3e6cd513db397cbd5d1391327896f, Type=Scenario)" },
  { re: /^Scenario\s*[·\/]/i,   fix: "Use Scenarios annotation component (key b5cdb94a14e3e6cd513db397cbd5d1391327896f)" },
  { re: /^Table\s*[·\/]/i,      fix: "Use *Table Starter* instance (key 213b7e3d7cc4503bbab83cd6c249e41e06dae295)" },
  { re: /^Toolbar\s*[·\/]/i,    fix: "Use Top Toolbar instance (key fa8defc5fadd20a84c812784786217c6e0003ca0)" },
  { re: /^Empty\s*State\s*[·\/]?/i, fix: "Use *Empty State* instance (key 0b0b611dba138a4a822b216114888d96513d248a)" },
  { re: /^Alert\s*[·\/]/i,      fix: "Use *Alert* instance (key 6d834b2f2da31f8a505379dcf26283d0be873609)" },
  { re: /^Filter\s*[·\/]/i,     fix: "Use *Filter* / *Filters group* instance" },
  { re: /^Status\s*[·\/]/i,     fix: "Use *Status* instance" },
];
const fakes = {};
for (const n of all) {
  if (n.type !== "FRAME") continue;
  if (isInsideInstance(n)) continue;
  for (const p of fabricationPatterns) {
    if (p.re.test(n.name)) {
      fakes[p.fix] = (fakes[p.fix] || 0) + 1;
      break;
    }
  }
}
for (const [fix, count] of Object.entries(fakes)) {
  issues.push(`${count} custom FRAME(s) found that should be DS component instances. Fix: ${fix}`);
}

// 7.4. Annotation presence — if task involves annotations, they must be the real
// Scenarios component, not custom FRAMEs named "Annotation · …" (caught by 7.3).
// Also detect the DS Scenarios component for a sanity count.
const realScenarios = all.filter(n =>
  n.type === "INSTANCE" && /Scenario/i.test(n.mainComponent?.parent?.name || "")
);
const fakeAnnotations = all.filter(n =>
  n.type === "FRAME" && !isInsideInstance(n) && /^Annotation\s*[·\/]/i.test(n.name)
);
if (fakeAnnotations.length > 0 && realScenarios.length === 0) {
  issues.push(`${fakeAnnotations.length} custom "Annotation · …" FRAME(s) found, zero real Scenarios instances. Use component key b5cdb94a14e3e6cd513db397cbd5d1391327896f with Type=Scenario variant.`);
}

// 8. Product-required components (fabrication check)
// For product-specific mockups, these top-level pieces MUST be real component instances, not custom FRAMEs.
// Detect product based on what's present or what the user asked for.
// NOTE (v3.151): productContext is now declared at the TOP of this script (see line ~1420).
// Do NOT re-declare it here — `const productContext` twice is a SyntaxError.

function requireInstance(label, matchFn, forbiddenFrameNames = []) {
  const hasInstance = all.some(n => n.type === "INSTANCE" && matchFn(n));
  if (!hasInstance) {
    issues.push(`${label}: required component instance is missing — did you build it as a custom FRAME instead?`);
  }
  // Check forbidden names ONLY on top-level FRAMEs (not inside component instances —
  // DS components contain their own internally-named frames like "Header" / "Dot Grid").
  const fakes = all.filter(n =>
    n.type === "FRAME" &&
    !isInsideInstance(n) &&
    forbiddenFrameNames.some(name => new RegExp(`^${name}$`, "i").test(n.name))
  );
  if (fakes.length) {
    issues.push(`${label}: ${fakes.length} custom FRAME(s) with forbidden name(s) [${fakes.map(f => f.name).join(", ")}] — replace with the real component instance`);
  }
}

if (productContext === "flow-builder") {
  // Shell components — fail loudly if any of the three is missing.
  // These are the most common skip: "I built just the canvas, no shell".
  // Flow Builder = Sidebar + Flowbuilder Header + Canvas (with bars). All three required.
  if (!sidebar) {
    issues.push(`Flow Builder page is missing the *Sidebar* instance. Required — import key 60be5cbb4d070ccc4853589a555d949c3f23f62e and use the variant matching the dashboard context.`);
  }
  // v3.168: canonical Flow Builder uses the GENERIC *Header* (set 2689f78…/387e2cf6…),
  // NOT a Flowbuilder-specific header — see workflow-builder-pattern.md "What NOT to do" #5.
  // The old matcher only accepted /Flowbuilder/ names and flagged correct generic-Header
  // builds as "missing header" (recurring FP).
  requireInstance(
    "Builder page Header (generic *Header*)",
    n => n.mainComponent?.parent?.name === "*Header*" || /Flowbuilder/.test(n.mainComponent?.parent?.name || ""),
    // "Header" alone is too broad — every DS component has an internal "Header" frame.
    // Only flag top-level custom frames with explicit Flow Builder–mimicking names.
    ["Flow Builder Header", "FB Header", "Workflow Header", "Flowbuilder Header"]
  );
  requireInstance(
    "Canvas",
    n => n.mainComponent?.parent?.name === "Canvas" || n.mainComponent?.name?.startsWith("Status="),
    ["Canvas", "Dot Grid", "Canvas Background", "Grid", "Flow Canvas"] // forbidden as FRAME, required as INSTANCE
  );
  // Fake-Canvas detection: a FRAME with dot-pattern / grid-like fill, used as Canvas substitute
  const fakeDotGrids = all.filter(n =>
    n.type === "FRAME" &&
    n.fills?.some(f => f.type === "PATTERN" || (f.type === "IMAGE" && /grid|dot/i.test(n.name))) &&
    n.width > 800 && n.height > 500
  );
  if (fakeDotGrids.length) {
    issues.push(`${fakeDotGrids.length} large FRAME(s) with dot/grid pattern fill detected — looks like a fake Canvas built instead of using the Canvas component instance`);
  }
  // Verify canvas bars exist (they come inside Canvas instance by default)
  const canvasInst = root.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas");
  if (canvasInst) {
    const hasTopBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Top");
    const hasRightBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Right");
    const hasBottomBar = !!canvasInst.findOne(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Canvas Bar / Bottom");
    if (!hasTopBar || !hasRightBar || !hasBottomBar) {
      issues.push(`Canvas is present but bars are missing (top: ${hasTopBar}, right: ${hasRightBar}, bottom: ${hasBottomBar}). Make sure you used the Canvas INSTANCE, not a custom FRAME.`);
    }
  }
  // Node attachments should be used sparingly — not on every node.
  // v3.168: only count VISIBLE attachments. Every Node/Canvas master ships hidden
  // Badge/Status layers inside — counting them flagged every build ("all nodes show
  // Start Badge / Status=Danger", recurring FP). Walk the chain inside the node.
  function visibleWithin(node, container) {
    let c = node;
    while (c && c !== container) { if (c.visible === false) return false; c = c.parent; }
    return node.visible !== false;
  }
  const nodeInstances = all.filter(n => n.type === "INSTANCE" && n.mainComponent?.parent?.name === "Node / Canvas");
  const nodesWithBadge = nodeInstances.filter(n =>
    n.findAll(c => c.type === "INSTANCE" && c.mainComponent?.name === "Node / Badge / Start" && visibleWithin(c, n)).length > 0
  ).length;
  if (nodeInstances.length > 1 && nodesWithBadge === nodeInstances.length) {
    issues.push(`All ${nodeInstances.length} canvas nodes show a VISIBLE 'Start Badge' — only the first node should have it`);
  }
  const nodesWithDanger = nodeInstances.filter(n =>
    n.findAll(c => c.type === "INSTANCE" && /Status=Danger/.test(c.mainComponent?.name || "") && visibleWithin(c, n)).length > 0
  ).length;
  if (nodeInstances.length > 1 && nodesWithDanger === nodeInstances.length) {
    issues.push(`All ${nodeInstances.length} canvas nodes show a VISIBLE 'Status=Danger' — realistic flows have mixed or empty statuses`);
  }
  // Invented "Legend" frame
  const legends = all.filter(n => n.type === "FRAME" && /^Legend$/i.test(n.name));
  if (legends.length) {
    issues.push(`'Legend' frame(s) present — real Flow Builder doesn't have an on-canvas legend; remove unless user asked for it`);
  }
  // Connector strokeWeight — must be 2.51 per reference/flowbuilder.md.
  // Only check OUR connectors (not strokes inside DS component instances, which include
  // decorative lines at strokeWeight=1 inside Canvas bars and Wizard).
  const connectors = all.filter(n =>
    (n.type === "VECTOR" || n.type === "LINE") &&
    n.strokes?.length > 0 &&
    !isInsideInstance(n)
  );
  const wrongWeight = connectors.filter(c => c.strokeWeight && Math.abs(c.strokeWeight - 2.51) > 0.05);
  if (wrongWeight.length) {
    issues.push(`${wrongWeight.length}/${connectors.length} top-level connector(s) strokeWeight ≠ 2.51 (found: ${[...new Set(wrongWeight.map(c => c.strokeWeight))].join(", ")}) — see reference/flowbuilder.md`);
  }
  // Custom node renaming — Node / Canvas instances should keep their default names
  const renamedNodes = nodeInstances.filter(n => /^Node — /.test(n.name) || /^Node - /.test(n.name));
  if (renamedNodes.length) {
    issues.push(`${renamedNodes.length} Node / Canvas instance(s) renamed with "Node — *" pattern — keep default instance names`);
  }
  // Info Block placeholder — the component ships with "Start time: 24 Jul, 23 13:43" / "Time in node: 8y:12m:14d" defaults.
  // v3.168: VISIBLE ones only — the defaults also live on hidden component-internal layers in every node (recurring FP).
  const placeholderTexts = ["Start time: 24 Jul", "Time in node: 8y", "Time in node: 8y:12m:14d"];
  const placeholderHits = all.filter(n => n.type === "TEXT" && isVisible(n) && placeholderTexts.some(p => n.characters?.includes(p)));
  if (placeholderHits.length) {
    issues.push(`Info Block placeholder text VISIBLE in ${placeholderHits.length} text node(s) — replace with realistic times or hide Info Block`);
  }
}

if (productContext === "applicant-page") {
  requireInstance(
    "AP page header",
    n => n.mainComponent?.parent?.name === "AP page header" || n.mainComponent?.name?.startsWith("Client type="),
    ["AP Header", "Applicant Header", "Applicant Page Header"]
  );
  // Sidebar should be the collapsed 52px variant for AP pages
  if (sidebar && !/Collapsed=True/.test(sidebar.mainComponent.name)) {
    issues.push(`Applicant page Sidebar should use Collapsed=True (52px), but got "${sidebar.mainComponent.name}"`);
  }
}

if (productContext === "table-page") {
  // Table pages should use Top Toolbar component, not a custom toolbar
  const tableInst = all.find(n => n.type === "INSTANCE" && n.name === "*Table Starter*");
  if (tableInst) {
    const hasTopToolbar = !!root.findOne(n => n.type === "INSTANCE" && n.name === "Top Toolbar");
    if (!hasTopToolbar) {
      issues.push(`Table page has *Table Starter* but no 'Top Toolbar' instance — tables typically need one for search/filters/CTA`);
    }
  }
}

if (productContext === "tm") {
  // TM screens have multiple layout patterns — check sidebar width matches pattern.
  // Pattern 1 (Transactions table): Sidebar 257px, screen 1440×900
  // Pattern 2 (Settings/Rules): Sidebar 276px, screen 1440×956
  // Pattern 3 (Rule editor): 52px collapsed Sidebar + Header 1388 @x=52 (v3.159, audit 7.58)
  // Pattern 4 (Transaction detail): No sidebar, 1920px wide canvas
  // Pattern 5 (Txn Networks): No sidebar, 1681px wide canvas
  if (sidebar) {
    const sidebarW = Math.round(sidebar.width);
    if (sidebarW !== 257 && sidebarW !== 276) {
      issues.push(`TM Sidebar width is ${sidebarW}px — expected 257px (Transactions table / Pattern 1) or 276px (Settings / Pattern 2). See tm-layout-patterns.md.`);
    }
    if (sidebarW === 257 && Math.round(root.width) !== 1440) {
      issues.push(`TM Pattern 1 (Sidebar 257): root width should be 1440px, got ${Math.round(root.width)}px`);
    }
    if (sidebarW === 276 && Math.round(root.width) !== 1440) {
      issues.push(`TM Pattern 2 (Sidebar 276): root width should be 1440px, got ${Math.round(root.width)}px`);
    }
  } else {
    // No sidebar — check for known full-screen patterns
    const rootW = Math.round(root.width);
    if (rootW !== 1440 && rootW !== 1920 && rootW !== 1681) {
      issues.push(`TM no-sidebar screen width is ${rootW}px — expected 1440 (Rule editor Pattern 3), 1920 (Transaction detail Pattern 4), or 1681 (Txn Networks Pattern 5). See tm-layout-patterns.md.`);
    }
    // Transaction detail (Pattern 4): must have Header/Finance instance
    if (rootW === 1920) {
      const hasFinanceHeader = all.some(n => n.type === "INSTANCE" && /Header.*Finance|Header\/Finance/.test(n.name));
      if (!hasFinanceHeader) {
        issues.push(`TM Pattern 4 (Transaction detail, 1920px): expected a 'Header / Finance' instance (TM-specific 144px header) — not found. Import key 1fcc7d73759e1feaa9c2e4af4b487344ba398fcb.`);
      }

      // Pattern 4 content frames must be white — Rule #6.
      // Body / Columns / Main column / Right panel are custom frames the skill
      // creates; they must have explicit white fills (not transparent).
      // Transparent frames inherit the root grey (#f6f7f9) and look grey.
      const tmContentNames = /^(Body|Columns|Main column|Right panel)$/i;
      const tmContentFrames = all.filter(n =>
        n.type === "FRAME" && !isInsideInstance(n) && tmContentNames.test(n.name)
      );
      for (const tcf of tmContentFrames) {
        const fill = tcf.fills?.[0];
        if (!fill || fill.visible === false || fill.opacity === 0) {
          issues.push(
            `TM Pattern 4: "${tcf.name}" has no fill (transparent) — it inherits the root grey and makes the screen look grey. ` +
            `Bind to semantic/background/neutral/inverse/normal (white). ` +
            `Rule #6: every content-surface frame must have an EXPLICIT white fill.`
          );
        }
      }
    }
  }
}

// 7.45. Root frame must be inside a SECTION — never directly on the page.
// Rule 7.5: every root frame's direct parent must be a SECTION node (type==="SECTION").
// If the parent is the PAGE itself, the build violated Rule 7.5 by appending
// the root directly to figma.currentPage without creating a section wrapper.
{
  if (root.parent?.type === "PAGE") {
    issues.push(
      `Root frame "${root.name}" is a direct child of the PAGE — it must live inside a SECTION. ` +
      `Create a section (fill #404040, name ending in "(made by Claude)"), append the root inside it, ` +
      `and remove it from the page directly (Rule 7.5).`
    );
  }
}

// 7.50. Canvas overlap — section must not visually overlap any pre-existing top-level node.
// Caught in v3.82 user testing: skill placed Connections section at coords that overlapped
// existing canonical Account screens. findFreeCanvasSpot() exists in helpers.js but skill
// sometimes skips it and uses (0,0) or hard-coded coords.
{
  // Find the SECTION ancestor of root
  let sec = root.parent;
  while (sec && sec.type !== "SECTION") sec = sec.parent;
  if (sec && sec.parent?.type === "PAGE") {
    const page = sec.parent;
    const myL = sec.x, myT = sec.y, myR = sec.x + sec.width, myB = sec.y + sec.height;
    for (const sibling of page.children) {
      if (sibling.id === sec.id) continue;
      // Only check top-level FRAMEs and SECTIONs (skip vector/text/image clutter)
      if (sibling.type !== "FRAME" && sibling.type !== "SECTION") continue;
      if (typeof sibling.x !== "number") continue;
      const sL = sibling.x, sT = sibling.y, sR = sibling.x + sibling.width, sB = sibling.y + sibling.height;
      // Standard rectangle overlap check
      const overlaps = !(myR <= sL || sR <= myL || myB <= sT || sB <= myT);
      if (overlaps) {
        issues.push(
          `Section "${sec.name}" overlaps existing top-level node "${sibling.name}" (${sibling.type}) on the page. ` +
          `Move the section to a free spot via findFreeCanvasSpot() helper (Rule 7.50 / Action 3). ` +
          `Section bbox=(${myL},${myT})-(${myR},${myB}); overlapping sibling bbox=(${sL},${sT})-(${sR},${sB}).`
        );
        break;   // one overlap is enough to fail the audit
      }
    }
  }
}

// 7.51. Section bbox must contain root bbox.
// Caught in v3.89 user testing: skill called section.resizeWithoutConstraints
// BEFORE appendChild(root), so section was sized to pre-root dimensions and
// root visually leaked outside section. parentType=SECTION is correct but
// bbox containment is broken. Build code must call resize AFTER append; this
// audit catches regressions when the order is forgotten.
{
  let sec2 = root.parent;
  while (sec2 && sec2.type !== "SECTION") sec2 = sec2.parent;
  if (sec2 && sec2.type === "SECTION") {
    const rL = root.x, rT = root.y;
    const rR = root.x + root.width, rB = root.y + root.height;
    const sW = sec2.width, sH = sec2.height;
    const tolerance = 2;
    if (rL < -tolerance || rT < -tolerance || rR > sW + tolerance || rB > sH + tolerance) {
      issues.push(
        `7.51 section-contains-root: root frame "${root.name}" leaks outside section "${sec2.name}" bbox. ` +
        `Section is ${Math.round(sW)}x${Math.round(sH)}; root is at (${Math.round(rL)},${Math.round(rT)}) size ${Math.round(root.width)}x${Math.round(root.height)} (right edge ${Math.round(rR)}, bottom ${Math.round(rB)}). ` +
        `Cause: section.resizeWithoutConstraints was called BEFORE appendChild(root) — section was sized to pre-root dimensions. ` +
        `Fix: call section.resizeWithoutConstraints(root.width + 80, root.height + 200) AFTER appending root, so section grows to encompass it.`
      );
    }
  }
}

// 7.55. Table-organism instance must NOT have its internal padding zeroed (v3.156).
// Table organisms (Txn table, Table Starter, Case table, etc.) ship with a baked
// content inset — canonical Txn table top frame = padL=32 padR=32 padT=24 padB=24,
// insetting the Top Toolbar + Body so rows get left/right gutters. A fresh
// createInstance() inherits that inset; padding 0/0/0/0 only happens if the build
// EXPLICITLY zeroed it (banned — strips the inset, slams content flush to the edge).
// Observed: TM Transactions-table sim 2026-06-01, build zeroed Txn table to 0/0/0/0.
{
  // Narrowed to organisms whose canonical inset is VERIFIED. `Txn table` confirmed
  // 32/32/24/24 (TM sim 2026-06-01). Do NOT add generic `*Table Starter*` here — its
  // native inset is unverified and may legitimately be 0 (false-positive risk; see the
  // 7.44d stale-value lesson). Add other organisms only after confirming canonical padding.
  const tableOrgRe = /^Txn table$/;
  const tableOrgs = all.filter(n =>
    n.type === "INSTANCE" &&
    tableOrgRe.test(n.name) &&
    n.layoutMode === "VERTICAL" &&
    n.width > 1000 &&
    !isInsideInstance(n)
  );
  for (const t of tableOrgs) {
    let pL, pT;
    try { pL = t.paddingLeft; pT = t.paddingTop; } catch (e) { continue; }
    if (pL === 0 && pT === 0) {
      issues.push(`7.55 table-padding-stripped: "${t.name}" (${Math.round(t.width)}w) has padding 0/0/0/0 — its internal content inset was zeroed. Canonical Txn table = 32/32/24/24, insetting the Top Toolbar + Body so rows get gutters. A fresh createInstance inherits that; 0/0/0/0 = the build explicitly zeroed it. NEVER set padding on the Txn table instance; drop it and configure rows/State only. Fix: do NOT touch paddingLeft/Right/Top/Bottom.`);
    }
  }
}

// 7.56. Redesign library-staleness detector (v3.156, INFO not FAIL).
// The 2026-06 redesign lives in the Base components SOURCE file. Each consuming
// file caches its own copy of imported library variables; a file only gets the
// new Tailwind values after it re-syncs (Update) the Base library. A NON-synced
// file resolves variables to PRE-redesign hex — every component (local or remote)
// then renders old colors REGARDLESS of skill output. This is a Figma library
// state, not a build defect → reported as INFO. (Observed: TM file
// 4zG4nJT1s0mcVQDXuJjoJJ resolved Base/Neutral/60=#a6afbe (old) vs new #6a7282;
// status bg #d0f1e8/#f6f7f9 old.)
{
  // Distinctive PRE-redesign hexes that do NOT exist in the new Tailwind palette.
  const OLD_PALETTE = new Set([
    "#373d4d","#586073","#7d8799","#a6afbe","#c4cad4","#f6f7f9","#edeff2","#e1e5ea",
    "#1764ff","#4180ff","#1455d9","#0a2d73","#25b793","#d0f1e8","#f5222d","#ffa500","#212736"
  ]);
  function hx(c){if(!c)return null;const h=x=>Math.round(x*255).toString(16).padStart(2,"0");return "#"+h(c.r)+h(c.g)+h(c.b);}
  const foundOld = new Set();
  for (const n of all) {
    let fills; try { fills = n.fills; } catch (e) { continue; }
    if (!Array.isArray(fills)) continue;
    for (const f of fills) {
      if (f.type === "SOLID" && f.visible !== false) {
        const hex = hx(f.color);
        if (hex && OLD_PALETTE.has(hex)) foundOld.add(hex);
      }
    }
  }
  if (foundOld.size >= 4) {
    infos.push(`[info] ⚠️ REDESIGN LIBRARY STALE: this file resolves ${foundOld.size} distinct PRE-redesign hexes (${[...foundOld].slice(0,8).join(", ")}). The Base components library in this file is NOT synced to the 2026-06 Tailwind+black redesign — components render OLD colors regardless of skill output. This is a Figma library-sync state, not a build defect. Tell the user: ask design to open this file and Update the Base components library (Assets → library updates → Update), then colors will re-resolve to the new palette.`);
  }
}

// 7.57. Icon-Only *Button* distorted off its native size (v3.158).
// Icon-only buttons are fixed squares (DS native 24/32/40). A rendered size that
// deviates >8px from the mainComponent's native size means the build resized it
// (or set layoutSizingHorizontal/Vertical=FILL on it) — usually by reaching into a
// chrome component (Sidebar KeyHeader, Header) and re-laying-out a nested button.
// Observed: CM "All cases" sim 2026-06-01 — Sidebar KeyHeader info button native
// 24x24 blown up to 88x72. NEVER resize/re-layout nodes inside chrome instances.
{
  const iconBtns = all.filter(n =>
    n.type === "INSTANCE" &&
    /^\*?Button\*?$/.test(n.name) &&
    n.mainComponent &&
    /Content=Icon Only/i.test(n.mainComponent.name || "")
  );
  for (const b of iconBtns) {
    const mc = b.mainComponent;
    let nw, nh;
    try { nw = mc.width; nh = mc.height; } catch (e) { continue; }
    if (!nw || !nh) continue;
    if (Math.abs(b.width - nw) > 8 || Math.abs(b.height - nh) > 8) {
      issues.push(`7.57 icon-button-distorted: "${b.name}" rendered ${Math.round(b.width)}x${Math.round(b.height)} but its component is native ${Math.round(nw)}x${Math.round(nh)} (Icon-Only buttons are fixed squares). The build resized it or set layoutSizing=FILL — usually by reaching INTO a chrome instance (Sidebar/Header). Remove the resize/FILL; configure chrome via exposed properties only, never re-layout its nested children.`);
    }
  }
}

// 7.58. TM Rule editor (Pattern 3) MUST have a 52px collapsed Sidebar (v3.159).
// Canonical Create rule (2694:902178) has *Sidebar* 52x902 @(0,0) Type=Dashboard
// Collapsed=True; Header FRAME 1388x64 @x=52 white; Body 1388 @x=52. The agent has a
// strong "editor pages have no sidebar" prior and omitted it (sim 2026-06-01),
// building Header full-1440 @x=0. Signature: a page-title TEXT "Create rule"/"Edit
// rule". If present AND no *Sidebar* instance in the build → FAIL.
{
  const ruleTitle = all.find(n =>
    n.type === "TEXT" && /^(Create|Edit) rule$/i.test((n.characters || "").trim())
  );
  if (ruleTitle) {
    const hasSidebar = all.some(n =>
      n.type === "INSTANCE" && /\*Sidebar\*/.test(n.mainComponent?.parent?.name || n.name || "")
    );
    if (!hasSidebar) {
      issues.push(`7.58 rule-editor-missing-sidebar: this is a Rule editor (title "${ruleTitle.characters.trim()}") but has NO *Sidebar* instance. Canonical Create rule has a 52px collapsed *Sidebar* (Type=Dashboard, Collapsed=True) at (0,0), with Header at x=52 (w=1388) and Body at x=52. NEVER build the rule editor full-1440 with no sidebar — that's a stale "editor = no sidebar" prior. Import the Sidebar (key 60be5cbb…), Collapsed=True, place at x=0, offset Header/Body to x=52. See tm-layout-patterns.md Pattern 3.`);
    }
  }
}

// 7.59. Status value rendered as bare TEXT in a table cell (v3.160).
// A column of status values must use the Status cell type (Type=Status + nested
// *Status* pill), NEVER a Text Regular cell with a bare status word. Observed:
// Settings Members sim 2026-06-01 — "Active"/"Invited" rendered as plain TEXT.
// Roles (Admin/Member/Owner/Moderator) are NOT statuses — excluded.
{
  const STATUS_WORDS = /^(Active|Inactive|Pending|Invited|Invite sent|Approved|Rejected|Suspended|Blocked|Disabled|Expired|Processing|Awaiting|Resolved|Closed|Failed|Passed|Verified|Online|Offline)$/i;
  function mcParentName(n){ if(n.type!=="INSTANCE") return ""; try { return n.mainComponent?.parent?.name || n.mainComponent?.name || ""; } catch(e){ return ""; } }
  const hits = [];
  const texts = all.filter(n => n.type === "TEXT" && isVisible(n) && STATUS_WORDS.test((n.characters||"").trim()));
  for (const t of texts) {
    // is it inside a Table Row/cell, and NOT inside a *Status* instance?
    let p = t.parent, inCell = false, inStatus = false;
    while (p && p !== root) {
      if (/\*Status\*/.test(mcParentName(p))) { inStatus = true; break; }
      if (/Table Row|Cell Content|Cell/i.test(p.name||"")) inCell = true;
      p = p.parent;
    }
    if (inCell && !inStatus) hits.push(t.characters.trim());
  }
  if (hits.length) {
    const uniq = [...new Set(hits)];
    issues.push(`7.59 status-as-bare-text: ${hits.length} table cell(s) render a status value as plain TEXT (${uniq.slice(0,6).join(", ")}) instead of a *Status* pill. Set the cell Type to "Status" and configure the nested *Status* instance (label + color variant). Roles (Admin/Member/Owner) are exempt — only status words are flagged.`);
  }
}

return JSON.stringify({ issues, info: infos }, null, 2);