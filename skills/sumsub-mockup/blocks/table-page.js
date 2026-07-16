/**
 * BLOCK: table-page
 * Creates a full dashboard table page: Sidebar + Header + Title row + Tabs + Table
 *
 * PARAMETERS (edit before running):
 *   PAGE_TITLE    — page heading (h4-xl semibold)
 *   PAGE_SUBTITLE — subtitle below heading (body-m regular), pass "" to hide
 *   CTA_LABEL     — primary button label, pass "" to hide
 *   TAB_LABELS    — array of tab labels, e.g. ["All", "Active", "Archived"]
 *   FRAME_NAME    — name of the root Figma frame
 *
 * USAGE: prepend helpers.js content, then run via mcp__figma__use_figma
 * NOTE: no IIFE wrapper — use_figma already runs code in async context
 * NOTE: always use explicit `return` at the end — required to get values back from use_figma
 */

// ─── Parameters ───────────────────────────────────────────────────────────────
const PAGE_TITLE    = "Applicants";
const PAGE_SUBTITLE = "Manage and review all your applicants";
const CTA_LABEL     = "+ Add applicant";
const TAB_LABELS    = ["All", "Pending review", "Approved", "Declined"];
const FRAME_NAME    = "Table Page";
const SCREEN_W      = 1440;
const SCREEN_H      = 900;

// ─── Block ────────────────────────────────────────────────────────────────────

// 1. Root frame (HORIZONTAL: sidebar | main)
const root = makeFrame(FRAME_NAME, { direction: "HORIZONTAL", w: SCREEN_W, h: SCREEN_H });
root.primaryAxisSizingMode = "FIXED";
root.counterAxisSizingMode = "FIXED";
root.clipsContent = true;
await bindFill(root, VARS.pageBg); // page root = subtlest grey (#f6f7f9) per Rule #6
figma.currentPage.appendChild(root);

// Place on free canvas — avoid overlapping existing frames on the page
const spot = findFreeCanvasSpot({ width: SCREEN_W, height: SCREEN_H, gap: 200 });
root.x = spot.x;
root.y = spot.y;

// 2. Sidebar — append first, then set sizing
const sidebar = await makeInstance(COMPONENTS.sidebar);
root.appendChild(sidebar);
sidebar.layoutSizingHorizontal = "FIXED";
sidebar.layoutSizingVertical = "FILL";

// 3. Main column — append first, then set sizing
const main = makeFrame("Main", { direction: "VERTICAL" });
root.appendChild(main);
main.layoutSizingHorizontal = "FILL";
main.layoutSizingVertical = "FILL";

// 4. Header — append first, then set sizing
const header = await makeInstance(COMPONENTS.header);
main.appendChild(header);
header.layoutSizingHorizontal = "FILL";

// 5. Content area — append first, then set sizing
const content = makeFrame("Content", { direction: "VERTICAL" });
main.appendChild(content);
content.layoutSizingHorizontal = "FILL";
content.layoutSizingVertical = "FILL";
await bindFill(content, VARS.cardBg); // Content = white (Rule #6)
// Standard table-page Content padding formula (Rule 7.8 — tokens, not numerics):
//   paddings all sides: spacing/xl (24px)
//   itemSpacing:        spacing/lg (16px)
await bindFrameSpacing(content, { pad: "xl", gap: "lg" });

// 6. Title row — append first, then set sizing
const titleRow = makeFrame("Title Row", { direction: "HORIZONTAL" });
titleRow.counterAxisAlignItems = "CENTER";
titleRow.primaryAxisAlignItems = "SPACE_BETWEEN";
content.appendChild(titleRow);
titleRow.layoutSizingHorizontal = "FILL";

// 6a. Title + subtitle stack
const titleStack = makeFrame("Title Stack", { direction: "VERTICAL", gap: SP.xs });
titleRow.appendChild(titleStack);

const titleText = await makeText(PAGE_TITLE, "semibold/h4-xl", "textStrong");
titleStack.appendChild(titleText);

if (PAGE_SUBTITLE) {
  const subtitleText = await makeText(PAGE_SUBTITLE, "regular/body-m", "textSubtle");
  titleStack.appendChild(subtitleText);
}

// 6b. CTA button
if (CTA_LABEL) {
  const ctaBtn = await makeInstance(COMPONENTS.button, {
    "Type": "Primary",
    "Size": "Medium",
    "State": "Default",
    "Status": "⚪ Default",
    "Content": "Basic"
  });
  titleRow.appendChild(ctaBtn);
  await setInstanceText(ctaBtn, "Button", CTA_LABEL);
}

// 7. Tabs — INSIDE the Header's Subheader (Subheader#4002:0=true), NEVER a standalone Tab Basic in content.
// Page-level tab navigation is part of the *Header* component. A bare *Tab Basic* row under the title is a
// known defect (designer sim 2026-07-16: "Табы не в виде сабхедера (как должно быть)").
if (TAB_LABELS && TAB_LABELS.length) {
  header.setProperties({ "Subheader#4002:0": true });
  const subTb = header.findOne(n => n.name === "*Tab Basic*");
  // ⚠️ items sit inside the "Items wrapper" SLOT — use findAll; .children.filter on the Tab Basic
  // misses them entirely and leaves default "Tab_1…Tab_5" labels (same designer sim).
  const items = subTb ? subTb.findAll(n => n.type === "INSTANCE" && /Tab Basic \/ Item/i.test(n.name)) : [];
  for (let i = 0; i < items.length; i++) {
    try {
      if (i < TAB_LABELS.length) {
        items[i].visible = true;
        items[i].setProperties({
          "Label text#4517:0": TAB_LABELS[i],
          "Counter#5190:0": false,
          "Badge#2885:0": false,
          "Selected": i === 0 ? "true" : "false",
        });
      } else {
        items[i].visible = false;
      }
    } catch (e) {}
  }
}

// 8. Table — append first, then set sizing
const tableSet = await figma.importComponentSetByKeyAsync(COMPONENTS.tableStarter);
const table = tableSet.defaultVariant.createInstance();
content.appendChild(table);
table.layoutSizingHorizontal = "FILL";
table.layoutSizingVertical = "FILL";

// 9. Zoom to frame
figma.viewport.scrollAndZoomIntoView([root]);
return `✅ Table page "${FRAME_NAME}" created — id: ${root.id}`;
