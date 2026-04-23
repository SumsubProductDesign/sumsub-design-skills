/**
 * Sumsub Dashboard UI Kit — Shared Helpers
 * Paste this block at the top of any block file before executing via mcp__figma__use_figma
 * All keys verified against Base components [Dashboard UI Kit] tJMo5DkqQUN0H6N8apN0N7 (2026-03-27)
 */

// ─── Semantic Variable Keys ───────────────────────────────────────────────────
const VARS = {
  // Backgrounds
  pageBg:       "e7129860062f42ee2a929d1b4ccacd21133a03ee", // semantic/background/neutral/subtlest/normal #f6f7f9
  cardBg:       "567811a0cf497ac911288a2f4a75a1d89ebff75c", // semantic/background/neutral/inverse/normal   #ffffff
  hoverBg:      "1aed8505fcfaec5aacd4ac43b4eb62d8315caa0a", // semantic/background/neutral/subtler/normal   #edeff2
  darkBg:       "564caa1c22a439e48f95d0889b5727223c3d262b", // semantic/background/neutral/strong/normal    #373d4d

  // Text
  textStrong:   "1148e20b46c46ade58db9b4120fbf3ea872196fd", // semantic/text/neutral/strong    #212736
  textDefault:  "485b897d691c85b86a1ad8ebae7650f3dbcca365", // semantic/text/neutral/default   #373d4d
  textSubtle:   "47f41dc6d16468e6189a8784f58b12d07ebe72c3", // semantic/text/neutral/subtle    #586073
  textSubtler:  "678d3fc239240d7247f43296117c4d35a84592d9", // semantic/text/neutral/subtler   #7d8799
  textInverse:  "cc87e4556ec61118c805685f92c80b214050bcd9", // semantic/text/neutral/inverse   #ffffff
  textBlue:     "8453b551ecd39d2c30d374d783b76d3c4e4c025d", // semantic/text/blue/normal       #1764ff

  // Borders
  borderNormal:   "6618868be488e538a0d5a0002206439e45c3cfbe", // semantic/border/neutral/normal         #c4cad4
  borderSubtle:   "3ac6f9a55d66cd4435e64ad0fa7287b40da52980", // semantic/border/neutral/subtle/normal  #d3d7df
  borderSubtler:  "806f4dce0b78f55df4ab1d126160091d6dd67fd2", // semantic/border/neutral/subtler/normal #e1e5ea
  borderSubtlest: "40baade65c87f4b56fd67b027ec695d0984fae39", // semantic/border/neutral/subtlest/normal #edeff2

  // Icons
  iconNormal:   "e35494985a3c9f6ef974c23c58c338bf0fb11443", // semantic/icon/neutral/normal   #586073
  iconStrong:   "706cebf845beae79e5726b61bc8411703bd04175", // semantic/icon/neutral/strong/normal #373d4d
  iconSubtler:  "58308f222b5599930525c12c7d3c9e356e0a618d", // semantic/icon/neutral/subtler/normal #a6afbe
  iconBlue:     "7c2e75c6ed6dcf3596a4828a6638528a953ded1e", // semantic/icon/blue/normal      #1764ff
};

// ─── Text Style Keys (importStyleByKeyAsync) ─────────────────────────────────
const TEXT_STYLES = {
  "semibold/h2-3xl": "c4fdf78112332d510121bf4259f0f77487c76a95", // 24px SemiBold
  "semibold/h3-2xl": "218741f7c9ed4ad805c16cc732fc574b17db0bac", // 20px SemiBold
  "semibold/h4-xl":  "ded0ff5904e2552ebce0b37c03fd4e59687759cc", // 18px SemiBold
  "semibold/h5-l":   "578523920447b665e72e1251649442da4dde0d38", // 16px SemiBold
  "semibold/body-m": "366c3ed058b5182612d4da47a5e00640a795420f", // 14px SemiBold
  "semibold/body-s": "e187a83e07dfee8834120d12478984da618da3b7", // 12px SemiBold
  "medium/h5-l":     "5692e5ce5191916e653b47ddd7d002eb43c1ebd6", // 16px Medium
  "medium/body-m":   "4d1640f961c000f195d1fb4da982ff64409d755a", // 14px Medium
  "medium/body-s":   "b23ca7a249b7c3151fe83a0b8f9a870e0b062cec", // 12px Medium
  "regular/body-m":  "852096922153ce67692e41e382348f0e75f435b5", // 14px Regular
  "regular/body-s":  "6cadfc56abd9ca441c27e619f138fb4d79fa0ae4", // 12px Regular
};

// ─── Component Keys (importComponentSetByKeyAsync / importComponentByKeyAsync) ─
const COMPONENTS = {
  // Organisms [Dashboard UI Kit]
  sidebar:        "60be5cbb4d070ccc4853589a555d949c3f23f62e", // *Sidebar* (component_set)
  header:         "387e2cf61b1bf4f2045d3ccefecc5c7820a86889", // *Header* (component_set)

  // Base components [Dashboard UI Kit]
  button:         "2c388961efd7b1030f71704ad85f89ba4c4f68ed", // *Button* (component_set)
  addButton:      "1b3dc3c5f3df5c611b559a74e013043b081f33a3", // *Add Button* (component_set)
  filter:         "9b4079e71832f44ac9b7dfd4b7cc0b352122ac39", // *Filter* (component_set)
  filtersGroup:   "54b3ab29659d303031879bf792d1dd1daa2b2245", // *Filters group* (component)
  inputBasic:     "984bd06621f139256149638f37d3ae22221a7ccc", // *Input Basic* (component_set)
  selectBasic:    "8c6e366aa04e78faf3beb584535554b77d47d11b", // *Select Basic* (component_set)
  modalBasic:     "58ab2e5b5b4eaab44d0f29d4559c129ed92e8e44", // *Modal Basic* (component_set)
  drawerBasic:    "36e8fa1efb354f2784b6b78940f82a77c60f966d", // *Drawer Basic* (component_set)
  emptyState:     "0b0b611dba138a4a822b216114888d96513d248a", // *Empty State* (component_set)
  badge:          "1448e0572484deccc873e346d5cbce09ebef00f8", // *Badge* (component_set)
  status:         "2330c247d2ff79a4c80969c9d74645a45cf4714e", // *Status* (component_set)
  toast:          "aac9259566dd2320d402a3f2895c466b3c998407", // *Toast* (component_set)
  alert:          "6d834b2f2da31f8a505379dcf26283d0be873609", // *Alert* (component_set)
  loader:         "e337a3178033bf35208eed84b06303ddf6b59387", // *Loader* (component)
  dividerLine:    "b34b8d9a79aa004528ae481c4acec9f16cf4873d", // Divider Line (component_set)
  dataList:       "33ce969a53e55cf092477fa672c7317c30068c61", // *DataList* (component_set)
  chips:          "5e72ffd07fd039f65c3071c13a01c7429065a3f3", // *Chips* (component_set)
  collapsibleCard:"db0df8e75407eeebbf40e0762905eec0d3691851", // *Collapsible Card* (component_set)
  pageContent:    "1fcbe28eda798209b6eb5c64c1ec7187b4710199", // Page Content (component_set)
  tagColorful:    "356b95ceb39f493a3a4d686e291cf9f9a672c813", // *Tag Colorful* (component_set)

  // Base components — table, tabs, toggle, modal confirmation
  tableStarter:   "213b7e3d7cc4503bbab83cd6c249e41e06dae295", // *Table Starter* (component_set)
  tabBasic:       "8b7caf090f6d71e8892fb33f649cab470552dc83", // *Tab Basic* (component, use importComponentByKeyAsync)
  tabCard:        "c64cda0b27bae2e66af2954981ca6b97d11ee5f8", // *Tab Card* (component)
  toggle:         "99562b687e3078c4a570af195c74a899fbbe83a4", // *Toggle* (component)
  modalConfirm:   "a5b7d39ba4f9e6b921dbefad1905420cc4239c7d", // *Modal Confirmation* (component)
};

// ─── Spacing constants ────────────────────────────────────────────────────────
const SP = { xs: 4, s: 8, m: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

// ─── Utility functions ────────────────────────────────────────────────────────

async function bindFill(node, varKey) {
  const v = await figma.variables.importVariableByKeyAsync(varKey);
  node.fills = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", v
  )];
}

async function bindStroke(node, varKey) {
  const v = await figma.variables.importVariableByKeyAsync(varKey);
  node.strokes = [figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", v
  )];
}

// ─── Spacing / Border-radius variable keys ───────────────────────────────────
const SP_VARS = {
  "2xs":  "3d3cc3a15da0b893bf326da6053d7a1c37f1d836", // 4px
  "xs":   "a4dad7f0e560345e844697b529325a2eca2ff23a", // 6px
  "s":    "5a8e4573770ee8f921f141c1ab6c96835c3125a0", // 8px
  "m":    "de89b1cae49981816929db80a4e795842e7baf77", // 12px
  "lg":   "2b3382099953af94f32cb6ffe5c7f44c74d5fed7", // 16px
  "xl":   "7dc2647090da988c17327693bc2224e2308047a2", // 24px
  "2xl":  "fceb37ce155723145d25d273574c665a8d7d30e6", // 28px
  "3xl":  "a2e089548b83ff33c8ee5e914fa24e67b889b38c", // 32px
};
const RADIUS_VARS = {
  "s":  "885152d55a536fb853461592cc3eff926e94858d", // 2px
  "m":  "311dc09093e9474a8b582c8fb7ccc7a628065a20", // 4px
  "lg": "95839af397884cd7f8fadb34a62d4763f88d68dd", // 8px
  "xl": "03884e014085a48cf26670632be200a02b5a160c", // 12px
};

// Bind a single spacing prop (paddingLeft/Right/Top/Bottom or itemSpacing)
// to a spacing token. Use size keys "2xs"..."3xl" or a direct variable key.
async function bindSpacing(node, prop, sizeOrKey) {
  const key = SP_VARS[sizeOrKey] || sizeOrKey;
  const v = await figma.variables.importVariableByKeyAsync(key);
  node.setBoundVariable(prop, v);
}

// Bind all four corner radii on a frame to a single border-radius token.
// Use size keys "s" | "m" | "lg" | "xl" or a direct variable key.
async function bindRadius(node, sizeOrKey) {
  const key = RADIUS_VARS[sizeOrKey] || sizeOrKey;
  const v = await figma.variables.importVariableByKeyAsync(key);
  node.setBoundVariable("topLeftRadius", v);
  node.setBoundVariable("topRightRadius", v);
  node.setBoundVariable("bottomLeftRadius", v);
  node.setBoundVariable("bottomRightRadius", v);
}

// Convenience: bind all four paddings and itemSpacing at once.
// Pass tokens for each; omit or pass 0 to skip.
// Example: await bindFrameSpacing(frame, { pad: "xl", gap: "lg" });
// ─── Page resolver — call this FIRST in every use_figma script ───────────────
// figma.currentPage resets between use_figma invocations. If you don't set it
// explicitly at the start, the script silently operates on Page 1 (or whatever
// page was last active) and creates sections/frames in the wrong place. This
// helper finds or creates the Drafts page, loads it, and makes it current.
// Every use_figma script MUST call this before creating or modifying any node.
async function ensureDraftsPage() {
  let page = figma.root.children.find(p => /drafts/i.test(p.name));
  if (!page) {
    page = figma.createPage();
    page.name = "🛠 Drafts";
  }
  await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  return page;
}

async function bindFrameSpacing(node, { padLeft, padRight, padTop, padBottom, pad, gap } = {}) {
  padLeft   ??= pad;
  padRight  ??= pad;
  padTop    ??= pad;
  padBottom ??= pad;
  if (padLeft)   await bindSpacing(node, "paddingLeft",   padLeft);
  if (padRight)  await bindSpacing(node, "paddingRight",  padRight);
  if (padTop)    await bindSpacing(node, "paddingTop",    padTop);
  if (padBottom) await bindSpacing(node, "paddingBottom", padBottom);
  if (gap)       await bindSpacing(node, "itemSpacing",   gap);
}

// ─── Local components home ────────────────────────────────────────────────────
// Every local main component the skill creates (modal body slots, drawer bodies,
// custom illustrations, anything via figma.createComponent()) must live on a
// dedicated "Local components" page, inside a SECTION named "Components (by Claude)".
// This keeps the Drafts page clean of orphan components stacked at (-20000, -20000).
//
// getLocalComponentsHome() finds or creates both and returns the SECTION. Call it
// at the point where you would have previously done:
//   figma.currentPage.appendChild(bodyComp);
//   bodyComp.x = -20000; bodyComp.y = -20000;
// Replace with:
//   const home = await getLocalComponentsHome();
//   home.appendChild(bodyComp);
//
// The function auto-positions the new component in a grid inside the section so
// multiple bodies don't stack on each other.
async function getLocalComponentsHome() {
  // 1. Page "Local components" (find or create; case-insensitive, singular/plural)
  let page = figma.root.children.find(p => /^local\s*components?$/i.test(p.name));
  if (!page) {
    page = figma.createPage();
    page.name = "Local components";
  }
  await page.loadAsync();

  // 2. Section "Components (by Claude)" inside that page
  let section = page.children.find(n =>
    n.type === "SECTION" && /^Components\s*\(by Claude\)\s*$/.test(n.name)
  );
  if (!section) {
    section = figma.createSection();
    section.name = "Components (by Claude)";
    page.appendChild(section);
    // Match the dark-grey Sumsub section convention
    section.fills = [{ type: "SOLID", color: { r: 0x40/255, g: 0x40/255, b: 0x40/255 } }];
    section.resizeWithoutConstraints(4800, 4000);
  }

  // 3. Auto-position the NEXT component added. Caller appendChild(bodyComp) and
  //    can immediately read section.__nextX / __nextY, or use positionInHome().
  //    We avoid modifying existing components — only place new ones.
  return section;
}

// Position a newly-added component inside the Local components section.
// Arranges in a grid, 4 columns, 600×500 cells. Call AFTER appendChild.
function positionInHome(section, node, { cellW = 600, cellH = 500, cols = 4, gap = 40 } = {}) {
  const existing = section.children.filter(n => n.type === "COMPONENT" && n !== node);
  const idx = existing.length;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  node.x = 40 + col * (cellW + gap);
  node.y = 40 + row * (cellH + gap);
  // Grow section if needed
  const neededW = 40 + cols * (cellW + gap) + 40;
  const neededH = 40 + (row + 1) * (cellH + gap) + 40;
  if (section.width < neededW) section.resizeWithoutConstraints(neededW, Math.max(section.height, neededH));
  else if (section.height < neededH) section.resizeWithoutConstraints(section.width, neededH);
}

// Creates a text node with proper style + semantic color variable
async function makeText(content, styleKey, colorKey) {
  await figma.loadFontAsync({ family: "Geist", style: "Regular" });
  await figma.loadFontAsync({ family: "Geist", style: "Medium" });
  await figma.loadFontAsync({ family: "Geist", style: "SemiBold" });
  const node = figma.createText();
  node.characters = content;
  const style = await figma.importStyleByKeyAsync(TEXT_STYLES[styleKey]);
  await node.setTextStyleIdAsync(style.id);
  await bindFill(node, VARS[colorKey]);
  return node;
}

// Creates a horizontal or vertical auto-layout frame.
// RULE: intermediate frames in a FILL chain must use primaryAxisSizingMode = "FIXED"
// so their children can resolve FILL correctly. Pass fillPrimary=true for such frames.
function makeFrame(name, { direction = "VERTICAL", gap = 0, padH = 0, padV = 0, fills = [], w = null, h = null, clip = false, fillPrimary = false } = {}) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = direction === "HORIZONTAL" ? "HORIZONTAL" : "VERTICAL";
  f.itemSpacing = gap;
  f.paddingLeft = padH; f.paddingRight = padH;
  f.paddingTop = padV; f.paddingBottom = padV;
  f.primaryAxisSizingMode = (w || fillPrimary) ? "FIXED" : "AUTO";
  f.counterAxisSizingMode = h ? "FIXED" : "AUTO";
  if (w) f.resize(w, f.height);
  if (h) f.resize(f.width, h);
  f.fills = fills;
  f.clipsContent = clip;
  return f;
}

// Import and instantiate a component set's default variant
async function makeInstance(componentSetKey, properties = {}) {
  const set = await figma.importComponentSetByKeyAsync(componentSetKey);
  const instance = set.defaultVariant.createInstance();
  if (Object.keys(properties).length) instance.setProperties(properties);
  return instance;
}

// Set text content inside an instance by text node name (e.g. "Button", "Label")
async function setInstanceText(instance, textNodeName, newText) {
  const node = instance.findOne(n => n.type === "TEXT" && n.name === textNodeName);
  if (!node) return;
  await figma.loadFontAsync({ family: "Geist", style: "Regular" });
  await figma.loadFontAsync({ family: "Geist", style: "Medium" });
  await figma.loadFontAsync({ family: "Geist", style: "SemiBold" });
  node.characters = newText;
}

// Import and instantiate a single component
async function makeInstanceSingle(componentKey, properties = {}) {
  const comp = await figma.importComponentByKeyAsync(componentKey);
  const instance = comp.createInstance();
  if (Object.keys(properties).length) instance.setProperties(properties);
  return instance;
}

// ─── Canvas placement ─────────────────────────────────────────────────────────
// Find free space on the current page so new mockups don't overlap existing ones.
// Scans all top-level frames on currentPage, computes their bounding box,
// returns a position to the RIGHT of the rightmost frame with a gap.
// Falls back to (0, 0) if the page is empty.
//
// Usage:
//   const { x, y } = findFreeCanvasSpot({ width: 1440, height: 900, gap: 200 });
//   root.x = x; root.y = y;
function findFreeCanvasSpot({ width = 1440, height = 900, gap = 200 } = {}) {
  const page = figma.currentPage;
  const frames = page.children.filter(n => n.type === "FRAME" || n.type === "SECTION");
  if (frames.length === 0) return { x: 0, y: 0 };

  // Rightmost edge of existing content
  let maxRight = -Infinity;
  let minTop = Infinity;
  for (const f of frames) {
    const right = f.x + f.width;
    if (right > maxRight) maxRight = right;
    if (f.y < minTop) minTop = f.y;
  }

  return {
    x: maxRight + gap,
    y: minTop === Infinity ? 0 : minTop,
  };
}
