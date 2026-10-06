// fluid-page.js — a two-column content page that holds its shape as the window
// narrows: a primary column that gives up width first, an aside that keeps the
// frame's, and the island's own gutter on both sides.
//
//   render({frameWidth, gap, gutter, primary: {width, min}, aside: {width}}, primaryHtml, asideHtml)
//   shellMinWidth(spec, shellOrigin, canvasWidth) → the shell's "minWidth" for that floor (below)
//
// The three numbers that come from the frame are frameWidth (the content block's
// width where the frame draws it), primary.width and aside.width. The one number
// that does not is primary.min, the floor: measure it with scripts/fluidcheck.sh
// by narrowing until something clips, and write that down — do not guess it.
//
// Above frameWidth + 2·gutter the block is the frame's own width, centred, so the
// zone diff against the frame still means what it meant. Below it the primary
// column absorbs every pixel until its floor, and only then does the page scroll
// sideways. The gutter is ADDED to the slot's own inset: the slot already starts 20 in from the
// island's edge, level with the header's tabs, so gutter 0 keeps that alignment and gutter 12
// makes 32 from the edge. It is not 32 — that was the doc's error, measured and corrected — and
// with it the content never touches the island's edge on a narrow screen.
const css = s => `
.fp-wrap{display:flex;justify-content:center;width:100%;box-sizing:border-box;padding:0 ${s.gutter}px}
.fp-page{display:flex;align-items:flex-start;gap:${s.gap}px;width:100%;max-width:${s.frameWidth}px}
.fp-main{flex:1 1 ${s.primary.width}px;min-width:${s.primary.min}px}
.fp-aside{flex:0 0 ${s.aside.width}px;width:${s.aside.width}px}
`;

function render(spec, primaryHtml, asideHtml) {
  const s = Object.assign({gap: 64, gutter: 32}, spec);
  s.primary = Object.assign({width: 640, min: 480}, spec.primary);
  s.aside = Object.assign({width: 380}, spec.aside);
  if (!s.frameWidth) throw new Error('fluid-page: frameWidth is the frame\'s content width, and it is required');
  if (s.primary.min > s.primary.width) throw new Error('fluid-page: the floor cannot be wider than the frame\'s own column');
  const html = `<div class="fp-wrap"><div class="fp-page">`
    + `<div class="fp-main" data-fluid="main">${primaryHtml || ''}</div>`
    + (asideHtml ? `<div class="fp-aside" data-fluid="aside">${asideHtml}</div>` : '')
    + `</div></div>`;
  return {css: css(s), html};
}

// shellMinWidth(spec, origin, canvasWidth) — the window width under which the page must scroll instead of
// shrinking further: the slot's left edge + the page at its floor (two gutters, the primary column's min, the
// gap, the aside) + the island's inset on the right. Put it in the shell config as "minWidth". The floor and
// the shell's minimum are one number seen from two sides; set only the floor and, below the shell's own
// minimum, the island clips the aside instead of the window scrolling (2026-10-06: floor 534, the content cut
// at 1280, until minWidth was raised by hand to 1314 — what this returns for that page).
//   origin: the shell's contentOrigin (shell.js prints it) at a fixed canvas of canvasWidth
function shellMinWidth(spec, origin, canvasWidth) {
  const s = Object.assign({gap: 64, gutter: 32}, spec);
  const min = (spec.primary && spec.primary.min != null) ? spec.primary.min : 480, aside = (spec.aside && spec.aside.width != null) ? spec.aside.width : 380;
  const rightInset = canvasWidth - origin.x - origin.w;
  return Math.ceil(origin.x + 2 * s.gutter + min + s.gap + aside + rightInset);
}

module.exports = {render, shellMinWidth};
