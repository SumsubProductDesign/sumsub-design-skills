/**
 * BLOCK: detail-drawer
 * Creates a table page with a Drawer open on the right — positioned OVER content (not pushing it).
 * Use for: Applicant detail, Transaction detail, Case detail.
 *
 * PARAMETERS:
 *   PAGE_TITLE      — table page heading
 *   DRAWER_SIZE     — "Narrow" | "Wide" (both render at 400px wide)
 *   FRAME_NAME      — name of the root Figma frame
 *
 * USAGE: prepend helpers.js content, then run via mcp__figma__use_figma
 * NOTE: no IIFE wrapper — use_figma already runs code in async context
 */

// ─── Parameters ───────────────────────────────────────────────────────────────
const PAGE_TITLE  = "Applicants";
const DRAWER_SIZE = "Narrow";
const FRAME_NAME  = "Detail Drawer";
const SCREEN_W    = 1440;
const SCREEN_H    = 900;
const SIDEBAR_W   = 257;
const DRAWER_W    = 400;

// ─── Block ────────────────────────────────────────────────────────────────────

// 1. Root frame
const root = makeFrame(FRAME_NAME, { direction: "HORIZONTAL", w: SCREEN_W, h: SCREEN_H, clip: true });
root.primaryAxisSizingMode = "FIXED";
root.counterAxisSizingMode = "FIXED";
await bindFill(root, VARS.cardBg); // semantic/background/neutral/inverse/normal #ffffff
figma.currentPage.appendChild(root);

// 2. Sidebar
const sidebar = await makeInstance(COMPONENTS.sidebar);
root.appendChild(sidebar);
sidebar.layoutSizingHorizontal = "FIXED";
sidebar.layoutSizingVertical = "FILL";

// 3. Main column
const main = makeFrame("Main", { direction: "VERTICAL", clip: true });
root.appendChild(main);
main.layoutSizingHorizontal = "FILL";
main.layoutSizingVertical = "FILL";
main.primaryAxisSizingMode = "FIXED";
main.counterAxisSizingMode = "FIXED";

// 4. Header
const header = await makeInstance(COMPONENTS.header);
main.appendChild(header);
header.layoutSizingHorizontal = "FILL";

// 5. Content (full-width table, not constrained by drawer)
const content = makeFrame("Content", { direction: "VERTICAL", clip: true });
content.paddingLeft = SP.xl; content.paddingRight = SP.xl;
content.paddingTop = SP.xl; content.paddingBottom = SP.xl;
content.itemSpacing = SP.xl;
main.appendChild(content);
content.layoutSizingHorizontal = "FILL";
content.layoutSizingVertical = "FILL";
content.primaryAxisSizingMode = "FIXED";
content.counterAxisSizingMode = "FIXED";

const titleText = await makeText(PAGE_TITLE, "semibold/h4-xl", "textStrong");
content.appendChild(titleText);

const tableSet = await figma.importComponentSetByKeyAsync(COMPONENTS.tableStarter);
const table = tableSet.defaultVariant.createInstance();
content.appendChild(table);
table.layoutSizingHorizontal = "FILL";
table.layoutSizingVertical = "FILL";

// 6. Tint — design system component, covers the ENTIRE root frame (1440×900)
const tintComp = await figma.importComponentByKeyAsync("815f961c100c14a0aca85988a8545a2c37821c1c");
const scrim = tintComp.createInstance();
scrim.name = "Tint";
root.appendChild(scrim);
scrim.layoutPositioning = "ABSOLUTE";
scrim.resize(SCREEN_W, SCREEN_H);
scrim.x = 0;
scrim.y = 0;

// 7. Drawer — absolutely positioned, pinned to the right edge of the screen
const drawerSet = await figma.importComponentSetByKeyAsync(COMPONENTS.drawerBasic);
const drawer = drawerSet.defaultVariant.createInstance();
try { drawer.setProperties({ "Size": DRAWER_SIZE }); } catch(e) {}
root.appendChild(drawer);
drawer.layoutPositioning = "ABSOLUTE";
drawer.x = SCREEN_W - DRAWER_W;
drawer.y = 0;

// 8. Zoom
figma.viewport.scrollAndZoomIntoView([root]);
return `✅ Detail drawer "${FRAME_NAME}" created — id: ${root.id}`;
