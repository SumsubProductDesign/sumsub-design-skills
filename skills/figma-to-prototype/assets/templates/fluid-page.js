// fluid-page.js — a two-column content page that holds its shape as the window
// narrows: a primary column that gives up width first, an aside that keeps the
// frame's, and the island's own gutter on both sides.
//
//   render({frameWidth, gap, gutter, primary: {width, min}, aside: {width}}, primaryHtml, asideHtml)
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

module.exports = {render};
