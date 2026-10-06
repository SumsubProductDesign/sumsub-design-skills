// list-table.js — the elastic list page: toolbar + table header + rows + footer as DOM boxes that follow the
// shell's content slot. The Step 3 generator of a list screen requires this and feeds it a spec read from the
// frame's design context; the cells' inner markup and their CSS stay in the project (they differ per table).
//
//   const {render} = require(process.env.SKILL + '/assets/templates/list-table.js');   // $SKILL: SKILL.md
//   const {css, html, script} = render(spec, svg);   // svg(name, w, h) → inline <svg> from the project's assets
//   page: css into <style>, html into the slot, script before </body>
//
// spec = {
//   size: 'large' | 'medium' | 'small',     // the product's three row heights: cell padding 16 / 12 / 8 (default large)
//   columns: [{key, label, width: 248} | {key, label, flex: 1, min: 200} | {key, label, width: 154, sort: 'iconName'}],
//            {…, hideInHeader: true} for a row-only column — the Reusable Identity table has a checkbox in every row and
//            none in its header, so its header's flexible columns start 40px earlier than the rows' (Figma, as drawn);
//            label '__checkbox__' is the library's checkbox
//   toolbar: {search: {placeholder, width: 400, icon}, left: [{icon}], right: [{icon, label?, primary?}]},   // optional
//   rows: [{key: '<cell inner html>', …, expanded: '<html>', open: false}],   // expanded: the row opens to that content
//   footer: {show: '10', found: '46', page: {of: '100', prev: 'iconName', next: 'iconName'}, chevron: 'iconName'},   // optional
//   hover: true,                            // the product's row hover (#f9fafb, the outer cells rounded 8)
//   withControls: true                      // false when the page already carries controls.js's css and script
// }
// Column rules are Figma's auto-layout, read from the design context, never guessed:
//   fixed width (`w-[248px] shrink-0`) → {width}; `flex-[1_0_0] min-w-[200px]` → {flex: 1, min: 200}.
//
// Geometry and colours are the product's SnsTable, read from the Storybook build's stylesheet
// (SnsTableColumnControl-*.css and the --components-table-* tokens, 2026-10-05): header #f3f4f6 with its outer
// cells rounded 8, header text #1e2939; cells white, padding 16 / 12 / 8 vertical by size and 12 across, 16 at the
// table's outer edges; the divider a 1px #e5e7eb line drawn AFTER the cells (the product's cell ::after), so a hover
// fill never paints over it — an inset shadow on the row did, on the 2026-10-02 Device list; none under the last row;
// hover #f9fafb; an expanded row's content 56 in from the left, padded 16 vertically, with the divider above it and
// under the whole row; footer 76 high, padded 16, a 1px #e5e7eb rule on top, pagination in the middle column.
// The toolbar's search and buttons, and the checkbox column, are controls.js's own SnsSearchBar, SnsButton and
// SnsCheckbox: the template used to draw them itself with the old radius 4 and #c4cad4, and drifted.
'use strict';
const path = require('path');
const C = require(path.join(__dirname, '..', 'components', 'controls.js'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const PAD = {large: 16, medium: 12, small: 8};

function render(spec, svg) {
  const cols = spec.columns || [];
  const py = PAD[spec.size || 'large'] || 16;
  const hover = spec.hover !== false;
  const colCss = cols.map(c => `.lt .c-${c.key}{${c.width != null ? `width:${c.width}px;flex:none` : `flex:${c.flex || 1} 0 0;min-width:${c.min != null ? c.min : 0}px`}}`).join('\n');
  const icon = n => (n ? svg(n, 16, 16) : '');
  const ibtn = n => C.button({type: 'secondary', size: 'medium', iconOnly: true, icon: icon(n), label: n});
  const tbtn = b => C.button({type: b.primary ? 'primary' : 'secondary', size: 'medium', icon: icon(b.icon), label: b.label});
  const tb = spec.toolbar;
  const toolbar = tb ? `<div class="lt-tb">
  <div class="lt-tb-l">${tb.search ? C.searchBar({size: 'medium', width: tb.search.width || 400, placeholder: tb.search.placeholder || 'Search', icon: tb.search.icon ? icon(tb.search.icon) : undefined}) : ''}${(tb.left || []).map(b => b.label ? tbtn(b) : ibtn(b.icon)).join('')}</div>
  <div class="lt-tb-r">${(tb.right || []).map(b => b.label ? tbtn(b) : ibtn(b.icon)).join('')}</div>
</div>` : '';
  const chk = () => C.checkbox({});
  const head = `<div class="lt-thead">${cols.filter(c => !c.hideInHeader).map(c => `<div class="c c-${c.key}">${c.label === '__checkbox__' ? chk() : `<span class="h">${esc(c.label)}</span>${c.sort ? `<span class="lt-sort">${icon(c.sort)}</span>` : ''}`}</div>`).join('')}</div>`;
  const n = (spec.rows || []).length;
  const rows = (spec.rows || []).map((r, i) => {
    const x = r.expanded != null;
    return `<div class="lt-tr${x && r.open ? ' lt-open' : ''}${i === n - 1 ? ' lt-last' : ''}"${x ? ` data-x aria-expanded="${r.open ? 'true' : 'false'}"` : ''}>`
      + `<div class="lt-cells">${cols.map(c => `<div class="c c-${c.key}">${c.label === '__checkbox__' ? chk() : (r[c.key] || '')}</div>`).join('')}</div>`
      + (x ? `<div class="lt-x">${r.expanded}</div>` : '') + `</div>`;
  }).join('');
  const f = spec.footer;
  const footer = f ? `<div class="lt-tfoot">
  <div class="fl">${f.show != null ? `<span class="lab">Show:</span><span class="val">${esc(f.show)}</span>${icon(f.chevron)}` : ''}${f.found != null ? `<span class="found"><span class="lab">Found:</span><span class="val">${esc(f.found)}</span></span>` : ''}</div>
  <div class="pg">${f.page ? `<span class="lab">Page:</span>${f.page.prev ? ibtn(f.page.prev) : ''}<span class="pin"></span><span class="val">of ${esc(f.page.of)}</span>${f.page.next ? ibtn(f.page.next) : ''}` : ''}</div>
  <div></div>
</div>` : '';
  const css = (spec.withControls === false ? '' : C.css) + `
.lt{display:flex;flex-direction:column;width:100%;font-size:14px;line-height:24px;color:#1e2939}
.lt-tb{display:flex;align-items:flex-start;gap:24px;height:32px;margin-bottom:16px}  /* 32 + 16 to the header, whatever the page's box-sizing */
.lt-tb-l{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.lt-tb-r{display:flex;align-items:center;gap:12px;flex:none}
.lt-thead,.lt-cells{display:flex;align-items:flex-start;width:100%}
.lt-thead{background:#f3f4f6;border-radius:8px}
.lt .c{padding:${py}px 12px;box-sizing:border-box;min-width:0}
.lt-thead .c:first-child,.lt-cells .c:first-child{padding-left:16px}
.lt-thead .c:last-child,.lt-cells .c:last-child{padding-right:16px}
.lt-thead .c{display:flex;align-items:center;gap:4px}
.lt .h{font-weight:500;color:#1e2939;white-space:nowrap}
.lt-sort{display:flex;height:24px;align-items:center;color:#4a5565}
.lt-tr{position:relative;background:#fff}
/* the divider is drawn after the cells, above any hover fill: an inset shadow on the row is painted over */
.lt-tr::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:#e5e7eb;z-index:1;pointer-events:none}
.lt-tr.lt-last::after{display:none}   /* the last row has none: the footer draws its own rule */
.lt-tr[data-x]{cursor:pointer}
.lt-x{display:none;margin-left:56px;padding:16px 0;box-shadow:inset 0 1px 0 #e5e7eb}
.lt-tr.lt-open .lt-x{display:block}
${hover ? `.lt-tr:not(.lt-open):hover .lt-cells{background:#f9fafb;border-radius:8px}
.lt-tr.lt-open:hover,.lt-tr.lt-open:hover .lt-cells{background:#f9fafb}
.lt-tr.lt-open:hover{border-radius:8px 8px 0 0}` : ''}
.lt-tfoot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:center;height:76px;padding:16px;box-sizing:border-box;background:#fff;box-shadow:inset 0 1px 0 #e5e7eb}
.lt-tfoot .fl{display:flex;align-items:center;gap:8px;min-width:0}
.lt-tfoot .found{margin-left:4px;display:inline-flex;gap:4px}
.lt-tfoot .lab{font-weight:500;color:#1e2939;white-space:nowrap}.lt-tfoot .val{color:#4a5565;white-space:nowrap}
.lt-tfoot .pg{display:flex;align-items:center;justify-content:center;gap:4px}
.lt-tfoot .pin{display:inline-block;width:49px;height:32px;box-sizing:border-box;background:#fff;box-shadow:inset 0 0 0 1px #d1d5dc;border-radius:8px}
${colCss}`;
  // a row with expanded content opens and closes on a click anywhere in it, except on its own controls
  const script = (spec.withControls === false ? '' : C.script) + `
document.addEventListener('click',function(e){var r=e.target.closest&&e.target.closest('.lt-tr[data-x]');
  if(!r||e.target.closest('.lt-x')||e.target.closest('a,button,input,select,textarea,label,[role=button],[role=checkbox]'))return;
  var o=r.classList.toggle('lt-open');r.setAttribute('aria-expanded',o?'true':'false');});`;
  return {css, html: `<div class="lt">${toolbar}${head}${rows}${footer}</div>`, script};
}
module.exports = {render};
