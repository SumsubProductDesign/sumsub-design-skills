/**
 * BLOCK: form-modal
 * Creates a table page with a Modal open (dimmed overlay).
 * Use for: Create/Edit forms, Confirmation dialogs, Settings modals.
 *
 * PARAMETERS:
 *   PAGE_TITLE   — table page behind the modal
 *   MODAL_TITLE  — modal heading
 *   MODAL_SIZE   — "Small" | "Medium" | "Large"
 *   MODAL_TYPE   — "Basic" | "Confirmation"
 *   FRAME_NAME   — name of the root Figma frame
 *
 * USAGE: prepend helpers.js content, then run via mcp__figma__use_figma
 * NOTE: no IIFE wrapper — use_figma already runs code in async context
 */

// ─── Parameters ───────────────────────────────────────────────────────────────
const PAGE_TITLE  = "Applicants";
const MODAL_TITLE = "Add new applicant";
const MODAL_SIZE  = "Medium";
const MODAL_TYPE  = "Basic";
const FRAME_NAME  = "Form Modal";
const SCREEN_W    = 1440;
const SCREEN_H    = 900;

// ─── Block ────────────────────────────────────────────────────────────────────

// 1. Root frame
const root = makeFrame(FRAME_NAME, { direction: "HORIZONTAL", w: SCREEN_W, h: SCREEN_H });
root.primaryAxisSizingMode = "FIXED";
root.counterAxisSizingMode = "FIXED";
root.clipsContent = true;
await bindFill(root, VARS.cardBg); // semantic/background/neutral/inverse/normal #ffffff
figma.currentPage.appendChild(root);

// 2. Sidebar — append first
const sidebar = await makeInstance(COMPONENTS.sidebar);
root.appendChild(sidebar);
sidebar.layoutSizingHorizontal = "FIXED";
sidebar.layoutSizingVertical = "FILL";

// 3. Main column — append first
const main = makeFrame("Main", { direction: "VERTICAL" });
root.appendChild(main);
main.layoutSizingHorizontal = "FILL";
main.layoutSizingVertical = "FILL";

// 4. Header — append first
const header = await makeInstance(COMPONENTS.header);
main.appendChild(header);
header.layoutSizingHorizontal = "FILL";

// 5. Content behind modal — append first
const bgContent = makeFrame("BG Content", { direction: "VERTICAL", gap: SP.xl });
bgContent.paddingLeft = SP.xl;
bgContent.paddingRight = SP.xl;
bgContent.paddingTop = SP.xl;
main.appendChild(bgContent);
bgContent.layoutSizingHorizontal = "FILL";
bgContent.layoutSizingVertical = "FILL";

const titleText = await makeText(PAGE_TITLE, "semibold/h4-xl", "textStrong");
bgContent.appendChild(titleText);

const tableSet = await figma.importComponentSetByKeyAsync(COMPONENTS.tableStarter);
const table = tableSet.defaultVariant.createInstance();
bgContent.appendChild(table);
table.layoutSizingHorizontal = "FILL";

// 6. Tint — design system component, covers the ENTIRE root frame (1440×900)
const tintComp = await figma.importComponentByKeyAsync("815f961c100c14a0aca85988a8545a2c37821c1c");
const scrim = tintComp.createInstance();
scrim.name = "Tint";
root.appendChild(scrim);
scrim.layoutPositioning = "ABSOLUTE";
scrim.resize(SCREEN_W, SCREEN_H);
scrim.x = 0;
scrim.y = 0;

// 7. Modal centered over main area (absolutely positioned)
const modalSet = await figma.importComponentSetByKeyAsync(COMPONENTS.modalBasic);
const modal = modalSet.defaultVariant.createInstance();
try { modal.setProperties({ "Size": MODAL_SIZE }); } catch(e) {}
root.appendChild(modal);
modal.layoutPositioning = "ABSOLUTE";
const mainX = 257;
const mainW = SCREEN_W - mainX;
modal.x = mainX + (mainW - modal.width) / 2;
modal.y = (SCREEN_H - modal.height) / 2;
modal.name = `Modal · ${MODAL_TITLE}`;

// 8. Zoom
figma.viewport.scrollAndZoomIntoView([root]);
return `✅ Form modal "${FRAME_NAME}" created — id: ${root.id}`;
