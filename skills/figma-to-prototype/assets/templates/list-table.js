// list-table.js — the elastic list page: toolbar + table header + rows + footer as DOM boxes that follow the
// shell's content slot. The Step 3 generator of a list screen requires this and feeds it a spec read from the
// frame's design context; the cells' inner markup and their CSS stay in the project (they differ per table).
//
//   const {render} = require(process.env.SKILL + '/assets/templates/list-table.js');   // $SKILL: SKILL.md
//   const {css, html} = render(spec, svg);      // svg(name, w, h) → inline <svg> from the project's assets
//
// spec = {
//   columns: [{key, label, width: 248} | {key, label, flex: 1, min: 200} | {key, label, width: 154, sort: 'iconName'}],
//            {…, hideInHeader: true} for a row-only column — the Reusable Identity table has a checkbox in every row and
//            none in its header, so its header's flexible columns start 40px earlier than the rows' (Figma, as drawn)
//   toolbar: {search: {placeholder, width: 400, icon}, left: [{icon}], right: [{icon, label?, primary?}]},   // optional
//   rows: [{key: '<cell inner html>', …}],                                                              // one object per row
//   footer: {show: '10', found: '46', page: {of: '100', prev: 'iconName', next: 'iconName'}, chevron: 'iconName'}   // optional
// }
// Column rules are Figma's auto-layout, read from the design context, never guessed:
//   fixed width (`w-[248px] shrink-0`) → {width}; `flex-[1_0_0] min-w-[200px]` → {flex: 1, min: 200}.
// Geometry from the Dashboard UI Kit table (Organisms 6812:93185): cells px 12 py 16; header #f6f7f9 radius 4,
// Medium 14 #373d4d; rows white with a 1px #edeff2 divider; toolbar 32 high, 16 below, gap 24, search 400,
// buttons 32 with a 1px #c4cad4 stroke inside, radius 4, primary #1764ff; footer px 16 py 12, pagination centred.
'use strict';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function render(spec, svg) {
  const cols = spec.columns || [];
  const colCss = cols.map(c => `.lt .c-${c.key}{${c.width != null ? `width:${c.width}px;flex:none` : `flex:${c.flex || 1} 0 0;min-width:${c.min != null ? c.min : 0}px`}}`).join('\n');
  const ibtn = (icon, cls = '') => `<span class="lt-btn lt-ibtn${cls}">${svg(icon, 16, 16)}</span>`;
  const tbtn = b => `<span class="lt-btn lt-tbtn${b.primary ? ' primary' : ''}">${b.icon ? svg(b.icon, 16, 16) : ''}<span>${esc(b.label)}</span></span>`;
  const tb = spec.toolbar;
  const toolbar = tb ? `<div class="lt-tb">
  <div class="lt-tb-l">${tb.search ? `<div class="lt-search" style="width:${tb.search.width || 400}px">${tb.search.icon ? svg(tb.search.icon, 16, 16) : ''}<span class="ph">${esc(tb.search.placeholder || '')}</span></div>` : ''}${(tb.left || []).map(b => b.label ? tbtn(b) : ibtn(b.icon)).join('')}</div>
  <div class="lt-tb-r">${(tb.right || []).map(b => b.label ? tbtn(b) : ibtn(b.icon)).join('')}</div>
</div>` : '';
  const head = `<div class="lt-thead">${cols.filter(c => !c.hideInHeader).map(c => `<div class="c c-${c.key}">${c.label === '__checkbox__' ? '<span class="lt-chk"></span>' : `<span class="h">${esc(c.label)}</span>${c.sort ? `<span class="lt-sort">${svg(c.sort, 16, 16)}</span>` : ''}`}</div>`).join('')}</div>`;
  const rows = (spec.rows || []).map(r => `<div class="lt-tr">${cols.map(c => `<div class="c c-${c.key}">${c.label === '__checkbox__' ? '<span class="lt-chk"></span>' : (r[c.key] || '')}</div>`).join('')}</div>`).join('');
  const f = spec.footer;
  const footer = f ? `<div class="lt-tfoot">
  <div class="fl">${f.show != null ? `<span class="lab">Show:</span><span class="val">${esc(f.show)}</span>${f.chevron ? svg(f.chevron, 16, 16) : ''}` : ''}${f.found != null ? `<span class="found"><span class="lab">Found:</span><span class="val">${esc(f.found)}</span></span>` : ''}</div>
  ${f.page ? `<div class="pg"><span class="lab">Page:</span>${f.page.prev ? ibtn(f.page.prev, ' bare') : ''}<span class="pin"></span><span class="val">of ${esc(f.page.of)}</span>${f.page.next ? ibtn(f.page.next, ' bare') : ''}</div>` : ''}
</div>` : '';
  const css = `
.lt{display:flex;flex-direction:column;width:100%;font-size:14px;line-height:24px;color:#373d4d}
.lt-tb{display:flex;align-items:flex-start;gap:24px;height:32px;margin-bottom:16px}  /* 32 + 16 to the header, whatever the page's box-sizing */
.lt-tb-l{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.lt-tb-r{display:flex;align-items:center;gap:12px;flex:none}
.lt-search{height:32px;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:4px 8px 4px 12px;background:#fff;box-shadow:inset 0 0 0 1px #c4cad4;border-radius:4px;flex:none}
.lt-search .ph{flex:1;min-width:0;color:#a6afbe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-btn{display:inline-flex;align-items:center;justify-content:center;background:#fff;box-shadow:inset 0 0 0 1px #c4cad4;border-radius:4px;white-space:nowrap;box-sizing:border-box}
.lt-ibtn{width:32px;height:32px;padding:8px;flex:none}
.lt-ibtn.bare{width:24px;height:24px;padding:4px;box-shadow:none;background:transparent}
.lt-tbtn{min-width:64px;height:32px;padding:4px 12px;gap:8px;font-weight:500;color:#373d4d}
.lt-tbtn.primary{background:#1764ff;box-shadow:none;color:#fff}
.lt-tbtn.primary svg path{fill:#fff}  /* Figma exports the icon with its own dark fill; on a primary button it is white */
.lt-thead,.lt-tr{display:flex;align-items:flex-start;width:100%}
.lt-thead{background:#f6f7f9;border-radius:4px;overflow:hidden}
.lt-tr{background:#fff;box-shadow:inset 0 -1px 0 #edeff2}
.lt .c{padding:16px 12px;box-sizing:border-box;min-width:0}
.lt-thead .c{display:flex;align-items:center;gap:4px}
.lt .h{font-weight:500;color:#373d4d;white-space:nowrap}
.lt-sort{display:flex;height:24px;align-items:center}
.lt-chk{display:block;width:16px;height:16px;margin:4px 0;background:#fff;box-shadow:inset 0 0 0 1px #c4cad4;border-radius:2px}
.lt-tfoot{position:relative;display:flex;align-items:center;gap:40px;padding:12px 16px;background:#fff;box-shadow:inset 0 1px 0 #edeff2}
.lt-tfoot .fl{display:flex;align-items:center;gap:8px;padding:4px 0;flex:1;min-width:0}
.lt-tfoot .found{margin-left:4px;display:inline-flex;gap:4px}
.lt-tfoot .lab{font-weight:500;color:#212736;white-space:nowrap}.lt-tfoot .val{color:#373d4d;white-space:nowrap}
.lt-tfoot .pg{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px}
.lt-tfoot .pin{display:inline-block;width:49px;height:32px;box-sizing:border-box;background:#fff;box-shadow:inset 0 0 0 1px #c4cad4;border-radius:4px}
${colCss}`;
  return {css, html: `<div class="lt">${toolbar}${head}${rows}${footer}</div>`};
}
module.exports = {render};
