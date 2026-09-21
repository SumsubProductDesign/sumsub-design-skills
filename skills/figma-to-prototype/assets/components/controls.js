// controls.js — design-system form controls for a prototype's live set, verified against the product's own
// Storybook (storybook.sumsub.net). Geometry, colours and every state come from the shipped component, so a
// state the mockup does not draw — hover, focus, disabled, error — is read, not invented.
//
//   const C = require(process.env.SKILL + '/assets/components/controls.js');   // $SKILL: SKILL.md, Before you start
//   page.css += C.css;                     // once per page
//   html = C.input({size: 'large', value: 'abc', width: 329});
//
// Values and their source: assets/components/VERSION.md. A mockup that disagrees is a ledger line
// (the component is the default) or a question, exactly as for the shell — references/shell.md.
'use strict';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// input(spec) — spec.size 'small' | 'medium' | 'large' (24 / 32 / 40 high)
//   state 'normal' | 'error' | 'warning' | 'disabled' | 'loading' | 'readonly'
//   value, placeholder, width (px or CSS length), icon (inline SVG string, drawn before the field),
//   hint (caption under the box), titleRight (the label row's right-hand value: "FREYA", "42 y.o."),
//   id, name, live (false renders a div, not an <input>)
// ids link a label to its field and a hint to its describedby. The counter resets
// with every build, so the same page builds the same ids twice.
let uid = 0;
const nextId = prefix => prefix + '-' + (++uid);

function input(spec = {}) {
  const size = spec.size || 'large';
  const state = spec.state || 'normal';
  const w = spec.width == null ? '100%' : (typeof spec.width === 'number' ? spec.width + 'px' : spec.width);
  const id = spec.id || nextId('c-in');
  const hasTitle = !!(spec.title || spec.optional || spec.titleIcon);
  const descId = (spec.error || spec.hint) ? id + '-d' : null;
  const attrs = [
    `id="${esc(id)}"`, spec.name ? `name="${esc(spec.name)}"` : '',
    spec.placeholder ? `placeholder="${esc(spec.placeholder)}"` : '',
    // a field with no visible label still needs a name for a screen reader
    !hasTitle && (spec.ariaLabel || spec.placeholder) ? `aria-label="${esc(spec.ariaLabel || spec.placeholder)}"` : '',
    descId ? `aria-describedby="${descId}"` : '',
    spec.error ? 'aria-invalid="true"' : '',
    state === 'disabled' ? 'disabled' : '', state === 'readonly' ? 'readonly' : '',
  ].filter(Boolean).join(' ');
  // secret: the product's *Secret / Input Field* — the value arrives masked and the
  // field stays a real input, so a respondent can click into it and select the text
  const value = spec.secret && spec.value == null ? '\u2022'.repeat(16) : (spec.value || '');
  const field = spec.live === false
    ? `<span class="c-input-text">${value ? esc(value) : `<span class="c-input-ph">${esc(spec.placeholder || '')}</span>`}</span>`
    : `<input class="c-input-ctl" type="text" ${attrs} value="${esc(value)}">`;
  // buttons sit inside the box, to the right of the value: the design system's
  // secret field carries two (show and copy), an ordinary field none
  // a button may be a string (the glyph) or {icon, label}; the label is its name for
  // a screen reader, which an icon alone cannot give
  const buttons = [].concat(spec.buttons || []).filter(Boolean)
    .map(b => (typeof b === 'string' ? {icon: b} : b))
    .map(b => `<button type="button" class="c-input-btn"${b.label ? ` aria-label="${esc(b.label)}"` : ''}>${b.icon}</button>`).join('');
  return `<span class="c-input c-input-${size} c-input-${state}${spec.secret ? ' c-input-secret' : ''}" style="width:${w}">`
    + (hasTitle
        ? `<label class="c-input-title" for="${esc(id)}">${esc(spec.title || '')}`
          + `${spec.optional ? '<span class="c-input-opt">(optional)</span>' : ''}`
          + `${spec.titleIcon ? `<span class="c-input-ti">${spec.titleIcon}</span>` : ''}`
          // the product's Label / Vertical has a right-hand slot: the value read off a document
          // ("FREYA"), an age ("42 y.o."), a unit. It is not the hint, which sits under the box
          + `${spec.titleRight ? `<span class="c-input-tr">${esc(spec.titleRight)}</span>` : ''}</label>`
        : '')
    + `<span class="c-input-box">${spec.icon ? `<span class="c-input-icon">${spec.icon}</span>` : ''}${field}${buttons}</span>`
    + (spec.error
        ? `<span class="c-input-err" id="${descId}">${spec.errorIcon || ''}<span>${esc(spec.error)}</span></span>`
        : spec.hint ? `<span class="c-input-hint" id="${descId}">${esc(spec.hint)}</span>` : '')
    + `</span>`;
}


// button(spec) — spec.type 'primary' | 'secondary' | 'tertiary' | 'plain' | 'outline'
//   status 'default' | 'success' | 'danger', size 'small' | 'medium' | 'large' (24 / 32 / 40),
//   label, icon (inline SVG, before the label), iconRight, iconOnly (square), state 'normal' | 'disabled' | 'loading',
//   id, full (width 100%)
function button(spec = {}) {
  const type = spec.type || 'primary', status = spec.status || 'default', size = spec.size || 'large';
  const state = spec.state || 'normal';
  const cls = ['c-btn', `c-btn-${type}`, `c-btn-${status}`, `c-btn-${size}`,
    state !== 'normal' ? `c-btn-${state}` : '', spec.iconOnly ? 'c-btn-icon' : '', spec.full ? 'c-btn-full' : ''].filter(Boolean).join(' ');
  const inner = `${spec.icon || ''}${spec.iconOnly ? '' : `<span class="c-btn-t">${esc(spec.label || '')}</span>`}${spec.iconRight || ''}`;
  return `<button class="${cls}" type="button"${spec.id ? ` id="${esc(spec.id)}"` : ''}${state === 'disabled' ? ' disabled' : ''}`
    + `${spec.iconOnly && spec.label ? ` aria-label="${esc(spec.label)}"` : ''}>`
    + `<span class="c-btn-c">${inner}</span></button>`;
}


// ---- icons shipped with the components (Figma exports, verbatim)
const fs = require('fs'), path = require('path');
const ICON = n => fs.readFileSync(path.join(__dirname, 'icons', n + '.svg'), 'utf8').replace(/<\?xml[^>]*>/, '').trim();

// radio(spec) — label, checked, disabled, caption, name, id
function radio(spec = {}) {
  const st = spec.disabled ? ' c-rd-disabled' : '';
  return `<label class="c-rd${spec.checked ? ' c-rd-on' : ''}${st}"${spec.id ? ` id="${esc(spec.id)}"` : ''}`
    + `${spec.name ? ` data-name="${esc(spec.name)}"` : ''} role="radio" aria-checked="${spec.checked ? 'true' : 'false'}"`
    + `${spec.disabled ? ' aria-disabled="true" tabindex="-1"' : ' tabindex="0"'}><span class="c-rd-m"></span>`
    + `<span class="c-rd-b"><span class="c-rd-l">${esc(spec.label || '')}</span>`
    + `${spec.caption ? `<span class="c-rd-c">${esc(spec.caption)}</span>` : ''}</span></label>`;
}
// checkbox(spec) — same shape; a checked box carries the design system's tick
function checkbox(spec = {}) {
  const st = spec.disabled ? ' c-cb-disabled' : '';
  const on = spec.checked || spec.indeterminate;          // the product gives both states the same filled plate
  // both glyphs are always in the markup and the class decides which one shows, so
  // toggling a box is a class flip and needs no icon table at run time
  return `<label class="c-cb${on ? ' c-cb-on' : ''}${spec.indeterminate ? ' c-cb-ind' : ''}${st}"${spec.id ? ` id="${esc(spec.id)}"` : ''}`
    + ` role="checkbox" aria-checked="${spec.indeterminate ? 'mixed' : spec.checked ? 'true' : 'false'}"`
    + `${spec.disabled ? ' aria-disabled="true" tabindex="-1"' : ' tabindex="0"'}>`
    + `<span class="c-cb-m"><span class="c-cb-tick">${ICON('checkmark')}</span><span class="c-cb-bar">${ICON('indeterminate')}</span></span>`
    + `<span class="c-cb-b"><span class="c-cb-l">${esc(spec.label || '')}</span>`
    + `${spec.caption ? `<span class="c-cb-c">${esc(spec.caption)}</span>` : ''}</span></label>`;
}
// group(items, spec) — a vertical stack of radios or checkboxes, 8px apart (the product's pitch: 24 + 8)
// role: 'radiogroup' for radios (the default when the first item is one), 'group' otherwise;
// title draws a visible label above the group (Label / Vertical, 14/24 medium, 4 under), and
// titleIcon puts a glyph after it — the product's Label / Vertical carries one on most of its
// instances, and without the hook it was the one hand-built thing left in a whole content column;
// label names the group for a screen reader when there is no visible title
const group = (html, spec = {}) => {
  const role = spec.role || (/class="c-rd/.test(html[0] || '') ? 'radiogroup' : 'group');
  const id = spec.title ? nextId('c-grp') : null;
  // title draws the product's Label / Vertical above the group; label alone names it for a
  // screen reader only. With a title the group is named BY it, so the two never disagree
  return (id ? `<div class="c-grp-w"><span class="c-grp-t" id="${id}">${esc(spec.title)}`
    + `${spec.titleIcon ? `<span class="c-grp-ti">${spec.titleIcon}</span>` : ''}</span>` : '')
    + `<div class="c-grp${spec.horizontal ? ' c-grp-h' : ''}" role="${role}"`
    + `${id ? ` aria-labelledby="${id}"` : spec.label ? ` aria-label="${esc(spec.label)}"` : ''}>${html.join('')}</div>`
    + (id ? '</div>' : '');
};

// select(spec) — the trigger only: the product builds it out of the input box plus a chevron
function select(spec = {}) {
  const size = spec.size || 'large', state = spec.state || 'normal';
  const w = spec.width == null ? '100%' : (typeof spec.width === 'number' ? spec.width + 'px' : spec.width);
  const val = spec.value ? `<span class="c-input-text">${esc(spec.value)}</span>`
    : `<span class="c-input-text"><span class="c-input-ph">${esc(spec.placeholder || '')}</span></span>`;
  // items: the trigger carries its menu and opens it on a click (script)
  const menu = spec.items
    ? `<span class="c-menu-anchor">${selectMenu({items: spec.items, search: spec.search, searchPlaceholder: spec.searchPlaceholder})}</span>`
    : '';
  const id = spec.id || nextId('c-sel');
  const hasTitle = !!(spec.title || spec.optional || spec.titleIcon);
  return `<span class="c-input c-input-${size} c-input-${state} c-sel${spec.items ? ' c-sel-has' : ''}" style="width:${w}"`
    + `${spec.placeholder ? ` data-ph="${esc(spec.placeholder)}"` : ''}>`
    + (hasTitle
        ? `<span class="c-input-title" id="${id}-l">${esc(spec.title || '')}`
          + `${spec.optional ? '<span class="c-input-opt">(optional)</span>' : ''}`
          + `${spec.titleIcon ? `<span class="c-input-ti">${spec.titleIcon}</span>` : ''}</span>`
        : '')
    + `<span class="c-input-box" role="combobox" tabindex="${state === 'disabled' ? '-1' : '0'}" aria-haspopup="listbox" aria-expanded="false"`
    + `${hasTitle ? ` aria-labelledby="${id}-l"` : spec.placeholder ? ` aria-label="${esc(spec.placeholder)}"` : ''}>`
    + `${val}<span class="c-sel-ch">${ICON('chevron-down')}</span></span>${menu}</span>`;
}
// tag(spec) — Tag Colorful: label, colour, optional inline-SVG icon.
// color 'gradient' is the AI-looking one: a 72deg wash with white text.
function tag(spec = {}) {
  const size = spec.size === 'small' ? ' c-tag-sm' : '';
  return `<span class="c-tag c-tag-${spec.color || 'grey'}${size}">${spec.icon || ''}<span>${esc(spec.label || '')}</span></span>`;
}
// counter(spec) — the counter pill. kind: filled (default), outline, dashed.
const counter = (spec = {}) => `<span class="c-cnt c-cnt-${spec.color || 'blue'}`
  + `${spec.kind && spec.kind !== 'filled' ? ` c-cnt-${spec.kind}` : ''}`
  + `${spec.size === 'medium' ? ' c-cnt-md' : ''}">${esc(spec.value == null ? '' : spec.value)}</span>`;
// emptyState(spec) — SnsEmptyState: illustration, title, description, buttons.
// image and buttons are HTML the caller passes: the illustration is a Figma export
// and the buttons are button() calls, so neither is invented here.
function emptyState(spec = {}) {
  const kind = spec.kind ? ' c-es-' + spec.kind : '';            // bordered | filled
  const horiz = spec.layout === 'horizontal';
  const btns = [].concat(spec.buttons || []).filter(Boolean).join('');
  return `<div class="c-es${kind}"><div class="c-es-l${horiz ? ' c-es-h' : ''}">`
    + `${spec.image ? `<div class="c-es-img">${spec.image}</div>` : ''}`
    + `<div><div class="c-es-t">${esc(spec.title || '')}</div>`
    + `${spec.text ? `<div class="c-es-d">${esc(spec.text)}</div>` : ''}`
    + `${btns ? `<div class="c-es-b">${btns}</div>` : ''}</div></div></div>`;
}
// statusSelect(spec) — SnsStatusSelect: the status pill made clickable, with a
// chevron. Same geometry and fill as status(); only the border and the chevron
// move on hover and press, which is why it reuses the status classes.
function statusSelect(spec = {}) {
  const color = spec.color || 'grey';
  return `<button type="button" class="c-st c-st-${spec.size || 'medium'} c-st-${color} c-ss c-ss-${color}" aria-haspopup="listbox">`
    + `${spec.dot === false ? '' : '<span class="c-st-d"></span>'}`
    + `<span class="c-st-t">${esc(spec.label || '')}</span>`
    + `<span class="c-ss-ch">${ICON('chevron-down')}</span></button>`;
}
// codeBlock(spec) — SnsCodeBlock: a titled panel with a line-number gutter.
// lines: strings, or {text, kind} where kind is one of the design system's token
// colours (comment, string, keyword, function, number, property, operator, plain).
// actions: HTML for the header's right side, normally a secondary Copy button.
function codeBlock(spec = {}) {
  const lines = (spec.lines || []).map(l => (typeof l === 'string' ? {text: l} : l));
  const gutter = lines.map((_, i) => i + 1).join('\n');
  // the spans are blocks, so they are joined with nothing: a newline between them
  // would double the leading against the gutter, which counts one row per line
  const body = lines.map(l => `<span class="c-code-l${l.kind ? ' c-code-' + l.kind : ''}">${esc(l.text || '') || ' '}</span>`).join('');
  return `<div class="c-code"${spec.id ? ` id="${esc(spec.id)}"` : ''}>`
    + `<div class="c-code-h"><span class="c-code-t">${esc(spec.title || '')}</span>`
    + `${spec.actions || ''}</div>`
    + `<div class="c-code-b"><pre class="c-code-n">${gutter}</pre><pre class="c-code-c">${body}</pre></div></div>`;
}
// status(spec) — SnsStatus: a pill with a dot, a title and an optional description.
// label is the bold part, text the regular one, dot:false drops the dot.
function status(spec = {}) {
  return `<span class="c-st c-st-${spec.size || 'medium'} c-st-${spec.color || 'grey'}" role="status">`
    + `${spec.dot === false ? '' : '<span class="c-st-d"></span>'}`
    + `<span class="c-st-t">${esc(spec.label || '')}</span>`
    + `${spec.text ? `<span class="c-st-x">${esc(spec.text)}</span>` : ''}</span>`;
}
// multiselect(spec) — SnsMultiselect: the same trigger as select(), with the chosen
// labels joined by ", " on one truncating line, which is what the product shows
const multiselect = (spec = {}) =>
  select(Object.assign({}, spec, {value: (spec.values || []).join(', ') || spec.value || ''}));
// link(spec)
const link = (spec = {}) => `<a class="c-lnk"${spec.href ? ` href="${esc(spec.href)}"` : ''}>${esc(spec.label || '')}</a>`;
// tabs(spec) — basic tab bar: items, active (label or index)
function tabs(spec = {}) {
  const items = spec.items || [];
  const act = typeof spec.active === 'number' ? spec.active : items.findIndex(t => (t.label || t) === spec.active);
  return `<div class="c-tabs" role="tablist">${items.map((t, i) => {
    const label = t.label || t, on = i === (act < 0 ? 0 : act);
    return `<span class="c-tab${on ? ' c-tab-on' : ''}" role="tab" aria-selected="${on}" tabindex="${on ? '0' : '-1'}">${esc(label)}`
      + `${t.tag ? `<span class="c-tag c-tag-${t.tagColor || 'blue'}"><span>${esc(t.tag)}</span></span>` : ''}</span>`;
  }).join('')}</div>`;
}
// dataList(rows, spec) — SnsDataList: a label column beside its value, the product's way of
// showing read-only record data. The label column is 152 and set in the BODY family (Inter),
// the value in the default one (Geist) — the design's own mix, not a slip. A row is
// {label, value} or {label, html} when the value carries a flag, an icon or a tag.
// spec.labelWidth overrides the column for a table that needs a wider one.
const dataList = (rows = [], spec = {}) =>
  `<div class="c-dl"${spec.labelWidth ? ` style="--c-dl-l:${spec.labelWidth}px"` : ''}>`
  + [].concat(rows).filter(Boolean).map(r =>
      `<div class="c-dl-r"><span class="c-dl-l">${esc(r.label || '')}</span>`
      + `<span class="c-dl-v">${r.html != null ? r.html : esc(r.value == null ? '' : r.value)}</span></div>`).join('')
  + `</div>`;

// kbd(keys) — *Keyboard shortcut*: the grey keycaps a button carries to show its shortcut.
// keys is a string ("A") or an array (["\u21e7", "A"]); each cap is min-width 20, Inter 12/16.
const kbd = (keys) => `<span class="c-kbd">`
  + [].concat(keys).filter(k => k != null && k !== '').map(k => `<kbd>${esc(k)}</kbd>`).join('')
  + `</span>`;

// tooltip(spec) — the box, and optionally its arrow. Where the tooltip goes is still the
// prototype's own; what the arrow looks like and which way it points is not.
//   side  'top'|'right'|'bottom'|'left' — where the TOOLTIP sits against the thing it explains,
//         the way the product's own component names it (a tooltip above its target is side:'top',
//         and its arrow is underneath, pointing down)
//   at    px along that edge to centre the arrow on, measured from the edge's start; centred by
//         default. A tooltip over a 24px button that hangs off the field's left needs this
const tooltip = (spec = {}) => {
  const size = spec.size === 'large' ? 'large' : 'small';
  const side = ['top', 'right', 'bottom', 'left'].includes(spec.side) ? spec.side : null;
  const along = side === 'top' || side === 'bottom' ? 'left' : 'top';
  return `<span class="c-tip c-tip-${size}${side ? ` c-tip-a c-tip-a-${side}` : ''}" role="tooltip"${spec.id ? ` id="${esc(spec.id)}"` : ''}>${esc(spec.text || '')}`
    + (side ? `<span class="c-tip-arrow"${spec.at != null ? ` style="${along}:${spec.at}px"` : ''}>${ICON('tooltip-arrow-' + size)}</span>` : '')
    + `</span>`;
};
// modal(spec) — backdrop + card; body and footer are HTML the caller builds
function modal(spec = {}) {
  const id = spec.id || nextId('c-mod');
  return `<div class="c-mod-wrap"${spec.hidden === false ? '' : ' hidden'} id="${esc(id)}">`
    + `<div class="c-mod-back"></div><div class="c-mod c-mod-${spec.size || 'small'}" role="dialog" aria-modal="true" aria-labelledby="${esc(id)}-t">`
    + `<div class="c-mod-h"><span class="c-mod-ttl"><span class="c-mod-t" id="${esc(id)}-t">${esc(spec.title || '')}</span>`
    + `${spec.subtitle ? `<span class="c-mod-s">${esc(spec.subtitle)}</span>` : ''}</span>`
    + `${spec.close || ''}</div>`
    + `<div class="c-mod-b">${spec.body || ''}</div>`
    + (spec.footer ? `<div class="c-mod-f">${spec.footer}</div>` : '') + `</div></div>`;
}
// card(spec) — collapsible card; header text and body are the caller's
// the header is the click target and carries the open state, as the product's does;
// script toggles it and keeps aria-expanded in step
// color: the card's state. 'grey' is the default (header #f3f4f6, border #d1d5dc); the product
// also draws a card in a status colour — yellow for a check that needs attention, and the same
// three the status pill uses. The colour is on the OUTER card only: a nested card stays grey.
const card = (spec = {}) => `<div class="c-card c-card-${spec.size || 'small'}${spec.color && spec.color !== 'grey' ? ` c-card-${spec.color}` : ''}${spec.open === false ? '' : ' c-card-open'}">`
  + `<div class="c-card-h" role="button" tabindex="0" aria-expanded="${spec.open === false ? 'false' : 'true'}">`
  + `${spec.chevron === false ? '' : `<span class="c-card-ch">${ICON('chevron-down')}</span>`}`
  + `<span class="c-card-t">${spec.titleHtml || esc(spec.title || '')}</span>`
  + `${spec.actions ? `<span class="c-card-a">${spec.actions}</span>` : ''}</div>`
  + `<div class="c-card-b">${spec.body || ''}</div></div>`;


// searchBar(spec) — SnsSearchBar: the field box with a leading search glyph and an
// optional erase button. Every colour and state is the input's own, so it reuses the
// input classes rather than repeating them: `kind-input` in the product is the field.
function searchBar(spec = {}) {
  const size = spec.size || 'medium', state = spec.state || 'normal';
  const w = spec.width == null ? '100%' : (typeof spec.width === 'number' ? spec.width + 'px' : spec.width);
  const attrs = [spec.id ? `id="${esc(spec.id)}"` : '',
    `placeholder="${esc(spec.placeholder || 'Search')}"`, `aria-label="${esc(spec.ariaLabel || spec.placeholder || 'Search')}"`,
    state === 'disabled' ? 'disabled' : ''].filter(Boolean).join(' ');
  return `<span class="c-input c-input-${size} c-input-${state} c-sb" style="width:${w}">`
    + `<span class="c-input-box"><span class="c-sb-ic">${spec.icon || ICON('search')}</span>`
    + (spec.live === false
        ? `<span class="c-input-text">${spec.value ? esc(spec.value) : `<span class="c-input-ph">${esc(spec.placeholder || 'Search')}</span>`}</span>`
        : `<input class="c-input-ctl" type="search" ${attrs} value="${esc(spec.value || '')}">`)
    + (spec.erase ? `<button type="button" class="c-sb-x" aria-label="Clear">${spec.erase}</button>` : '')
    + `</span></span>`;
}
// tagMultiselect(spec) — SnsTagMultiselect: the select trigger that keeps its values
// as removable tags inside the box, wrapping onto more rows as they pile up. The box
// and the chevron are the select's; closeIcon is the frame's own glyph.
function tagMultiselect(spec = {}) {
  const size = spec.size || 'large', state = spec.state || 'normal';
  const w = spec.width == null ? '100%' : (typeof spec.width === 'number' ? spec.width + 'px' : spec.width);
  const tags = (spec.values || []).map(v =>
    `<span class="c-tag c-tag-grey c-tms-tag">${esc(v)}${spec.closeIcon ? `<button type="button" class="c-tms-x" aria-label="Remove ${esc(v)}">${spec.closeIcon}</button>` : ''}</span>`).join('');
  const body = tags || `<span class="c-input-ph">${esc(spec.placeholder || '')}</span>`;
  return `<span class="c-input c-input-${size} c-input-${state} c-tms${spec.items ? ' c-sel-has' : ''}" style="width:${w}"`
    + `${spec.placeholder ? ` data-ph="${esc(spec.placeholder)}"` : ''}${spec.closeIcon ? ` data-x='${spec.closeIcon.replace(/'/g, "&#39;")}'` : ''}>`
    + (spec.title || spec.optional || spec.titleIcon
        ? `<span class="c-input-title">${esc(spec.title || '')}`
          + `${spec.optional ? '<span class="c-input-opt">(optional)</span>' : ''}`
          + `${spec.titleIcon ? `<span class="c-input-ti">${spec.titleIcon}</span>` : ''}</span>`
        : '')
    + `<span class="c-input-box" role="combobox" tabindex="${state === 'disabled' ? '-1' : '0'}" aria-haspopup="listbox" aria-expanded="false" aria-multiselectable="true"`
    + `${spec.title ? '' : spec.placeholder ? ` aria-label="${esc(spec.placeholder)}"` : ''}><span class="c-tms-tags">${body}</span>`
    + `<span class="c-tms-ch">${spec.chevron || ICON('chevron-down')}</span></span>`
    + (spec.items
        ? `<span class="c-menu-anchor">${selectMenu({items: spec.items, search: spec.search, searchPlaceholder: spec.searchPlaceholder})}</span>`
        : '')
    + `</span>`;
}
// selectMenu(spec) — the open menu: items [{label, caption, selected, disabled, group}], width, maxHeight
function selectMenu(spec = {}) {
  const w = spec.width == null ? '100%' : (typeof spec.width === 'number' ? spec.width + 'px' : spec.width);
  const rows = (spec.items || []).map(it => {
    if (typeof it === 'object' && it.group) return `<div class="c-opt-g">${esc(it.group)}</div>`;
    const o = typeof it === 'string' ? {label: it} : it;
    // the tick is always in the markup and the class shows it, so picking a row is a
    // class flip — the same trick as the checkbox
    return `<div class="c-opt${o.selected ? ' c-opt-on' : ''}${o.disabled ? ' c-opt-off' : ''}" data-opt="${esc(o.value || o.label)}"`
      + ` role="option" aria-selected="${!!o.selected}"${o.disabled ? ' aria-disabled="true"' : ''}>`
      + `<span class="c-opt-l">${esc(o.label)}</span>`
      + `${o.caption ? `<span class="c-opt-c">${esc(o.caption)}</span>` : ''}`
      + `<span class="c-opt-m">${ICON('checkmark')}</span></div>`;
  }).join('');
  // the product's menu opens with a search field above the list when it is long
  const search = spec.search
    ? `<div class="c-menu-s"><div class="c-menu-sb"><input class="c-menu-si" type="search" placeholder="${esc(spec.searchPlaceholder || 'Search')}" aria-label="${esc(spec.searchPlaceholder || 'Search')}"></div></div>`
    : '';
  return `<div class="c-menu" style="width:${w};max-height:${spec.maxHeight || 400}px">`
    + `${search}<div class="c-menu-l" role="listbox">${rows}</div></div>`;
}
// toast(spec) — type 'info' | 'success' | 'warning' | 'danger', title, text, icon (inline SVG), close
function toast(spec = {}) {
  const t = spec.type || 'info';
  // the product's toast is role="alert"; a screen reader announces it when it appears
  return `<div class="c-toast c-toast-${t}" role="alert"${spec.id ? ` id="${esc(spec.id)}"` : ''}${spec.hidden ? ' hidden' : ''}>`
    + `${spec.icon ? `<span class="c-toast-i">${spec.icon}</span>` : ''}`
    + `<div class="c-toast-m">${spec.title ? `<div class="c-toast-t">${esc(spec.title)}</div>` : ''}`
    + `<div class="c-toast-x">${esc(spec.text || '')}</div></div>`
    + `${spec.close ? `<button class="c-toast-c" type="button" aria-label="Close">${spec.close}</button>` : ''}</div>`;
}


// alert(spec) — type 'basic' | 'info' | 'success' | 'warning' | 'danger', size 'medium' | 'small',
//   title, text (or html), icon (inline SVG from the frame), action (inline HTML, e.g. a close button)
function alert(spec = {}) {
  const t = spec.type || 'basic', size = spec.size || 'medium';
  // danger and warning interrupt, the rest inform
  return `<div class="c-alert c-alert-${t} c-alert-${size}" role="${t === 'danger' || t === 'warning' ? 'alert' : 'status'}"${spec.id ? ` id="${esc(spec.id)}"` : ''}>`
    + `${spec.icon ? `<span class="c-alert-i">${spec.icon}</span>` : ''}`
    + `<div class="c-alert-c">${spec.title ? `<div class="c-alert-t">${esc(spec.title)}</div>` : ''}`
    + `<div class="c-alert-x">${spec.html || esc(spec.text || '')}</div></div>`
    + `${spec.action ? `<span class="c-alert-a">${spec.action}</span>` : ''}</div>`;
}

// every rule traceable to Storybook's computed styles; see VERSION.md for the table
const css = `
.c-input{display:inline-flex;flex-direction:column;box-sizing:border-box}
.c-input-box{display:inline-flex;align-items:center;width:100%;box-sizing:border-box;border-radius:8px;
  background:#fff;box-shadow:inset 0 0 0 1px #d1d5dc;transition:none}
.c-input-large .c-input-box{padding:8px 12px}
.c-input-medium .c-input-box{padding:4px 12px}
.c-input-small .c-input-box{padding:0 8px}
.c-input-readonly .c-input-box{padding:0;background:transparent;box-shadow:none}
.c-input-icon{display:inline-flex;flex:none;color:#1e2939;margin-right:8px}
.c-input-small .c-input-icon{margin-right:4px}
.c-input-ctl,.c-input-text{flex:1;min-width:0;min-height:24px;font:inherit;font-size:14px;line-height:24px;color:#1e2939;
  background:transparent;border:0;padding:0;outline:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c-input-ctl::placeholder,.c-input-ph{color:#6a7282}
.c-input-error .c-input-box{box-shadow:inset 0 0 0 1px #dc2626;background:#fef2f2}
.c-input-warning .c-input-box{box-shadow:inset 0 0 0 1px #d27a0a;background:#fffbeb}
.c-input-disabled .c-input-box{background:#f3f4f6}
.c-input-disabled .c-input-ctl,.c-input-disabled .c-input-text{color:#4a5565}
.c-input-loading .c-input-box{background:#f3f4f6}
/* hover and focus are the product's; neither can be triggered from automation, so each needs one human look */
.c-input-normal:hover .c-input-box{box-shadow:inset 0 0 0 1px #b4bac4;background:#f9fafb}
.c-input-error:hover .c-input-box{box-shadow:inset 0 0 0 1px #b91c1c;background:#fee2e2}
.c-input-warning:hover .c-input-box{box-shadow:inset 0 0 0 1px #a95a0a;background:#fef3c7}
.c-input-disabled:hover .c-input-box,.c-input-loading:hover .c-input-box,.c-input-readonly:hover .c-input-box{box-shadow:inset 0 0 0 1px #d1d5dc}
.c-input:focus-within .c-input-box{box-shadow:inset 0 0 0 1px #d1d5dc,0 0 0 1px #fff,0 0 0 3px #60a5fa;background:#fff}
.c-input-error:focus-within .c-input-box{box-shadow:inset 0 0 0 1px #dc2626,0 0 0 1px #fff,0 0 0 3px #60a5fa;background:#fef2f2}
.c-input-warning:focus-within .c-input-box{box-shadow:inset 0 0 0 1px #d27a0a,0 0 0 1px #fff,0 0 0 3px #60a5fa;background:#fffbeb}
.c-input-tr{margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-size:14px;line-height:24px;font-weight:400;color:#4a5565}
.c-input-hint{margin-top:2px;font-size:14px;line-height:24px;color:#4a5565}
/* the label above the field: 14/24 Medium, 4px clear of the box (the hint below is 2).
   (optional) and the question mark ride with it, as the product's Label / Vertical does. */
.c-input-title{display:flex;align-items:center;gap:4px;margin-bottom:4px;
  font-size:14px;line-height:24px;font-weight:500;color:#030712}
.c-input-opt{font-size:12px;line-height:16px;font-weight:400;color:#4a5565}
.c-input-ti{display:flex;width:16px;height:16px;color:#6a7282}
.c-input-ti svg{display:block;width:16px;height:16px}
/* the error caption: the design system puts the danger glyph beside red 14/24 text */
.c-input-err{display:flex;gap:4px;padding-top:2px;font-size:14px;line-height:24px;color:#dc2626}
.c-input-err svg{display:block;width:16px;height:16px;margin-top:4px;flex-shrink:0}
/* buttons inside the box: 24 square, radius 8, the neutral hover of an icon button */
.c-input-btn{display:flex;align-items:center;justify-content:center;flex-shrink:0;
  width:24px;height:24px;padding:0;border:0;border-radius:8px;background:transparent;
  color:#1e2939;cursor:pointer}
.c-input-btn:hover{background:#f3f4f6}
.c-input-btn:active{background:#e5e7eb}
.c-input-btn svg{display:block;width:16px;height:16px}
.c-input-box{cursor:text}
.c-input-secret .c-input-ctl{letter-spacing:.05em}

/* --- button: SnsButton. Geometry is shared by every type; colour comes from the --components-button-* set,
   inlined here as literals. Disabled is one look for every type and status. */
.c-btn{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border:0;border-radius:8px;
  font:inherit;font-size:14px;line-height:24px;font-weight:500;cursor:pointer;white-space:nowrap;
  background:var(--c-bg,transparent);background-image:var(--c-img,none);
  color:var(--c-fg,#1e2939);box-shadow:var(--c-bd,none)}
.c-btn-c{display:flex;align-items:center;column-gap:8px}
.c-btn-large{padding:8px 16px}
.c-btn-medium{padding:4px 12px}
.c-btn-small{padding:0 8px}
/* the frames' inline plain button (Add domain, 92x16): no padding, 12/16 text */
.c-btn-link{padding:0;height:16px;font-size:12px;line-height:16px}
.c-btn-link .c-btn-c{column-gap:8px}
.c-btn-icon{padding:0;aspect-ratio:1/1}
.c-btn-large.c-btn-icon{width:40px;height:40px}
.c-btn-medium.c-btn-icon{width:32px;height:32px}
.c-btn-small.c-btn-icon{width:24px;height:24px}
.c-btn-full{width:100%}
.c-btn-primary.c-btn-default{--c-bg:#030712;--c-fg:#fff}
.c-btn-primary.c-btn-default:hover{--c-bg:#1e2939}
.c-btn-primary.c-btn-default:active{--c-bg:#364153}
.c-btn-primary.c-btn-success{--c-bg:#16a34a;--c-fg:#fff}
.c-btn-primary.c-btn-success:hover{--c-bg:#15803d}
.c-btn-primary.c-btn-success:active{--c-bg:#166534}
.c-btn-primary.c-btn-danger{--c-bg:#dc2626;--c-fg:#fff}
.c-btn-primary.c-btn-danger:hover{--c-bg:#b91c1c}
.c-btn-primary.c-btn-danger:active{--c-bg:#991b1b}
.c-btn-secondary{--c-bg:#fff}
.c-btn-secondary:hover{--c-bg:#f9fafb}
.c-btn-secondary:active{--c-bg:#f3f4f6}
.c-btn-secondary.c-btn-default{--c-fg:#1e2939;--c-bd:inset 0 0 0 1px #d1d5dc}
.c-btn-secondary.c-btn-default:hover{--c-bd:inset 0 0 0 1px #b4bac4}
.c-btn-secondary.c-btn-default:active{--c-bd:inset 0 0 0 1px #99a1af}
.c-btn-secondary.c-btn-success{--c-fg:#16a34a;--c-bd:inset 0 0 0 1px #16a34a}
.c-btn-secondary.c-btn-success:hover{--c-fg:#15803d;--c-bd:inset 0 0 0 1px #15803d}
.c-btn-secondary.c-btn-success:active{--c-fg:#166534;--c-bd:inset 0 0 0 1px #166534}
.c-btn-secondary.c-btn-danger{--c-fg:#dc2626;--c-bd:inset 0 0 0 1px #dc2626}
.c-btn-secondary.c-btn-danger:hover{--c-fg:#b91c1c;--c-bd:inset 0 0 0 1px #b91c1c}
.c-btn-secondary.c-btn-danger:active{--c-fg:#991b1b;--c-bd:inset 0 0 0 1px #991b1b}
.c-btn-tertiary{--c-bg:transparent}
.c-btn-tertiary:hover{--c-bg:#f3f4f6}
.c-btn-tertiary:active{--c-bg:#e5e7eb}
.c-btn-tertiary.c-btn-default{--c-fg:#1e2939}
.c-btn-tertiary.c-btn-success{--c-fg:#16a34a}
.c-btn-tertiary.c-btn-success:hover{--c-fg:#15803d}
.c-btn-tertiary.c-btn-danger{--c-fg:#dc2626}
.c-btn-tertiary.c-btn-danger:hover{--c-fg:#b91c1c}
.c-btn-plain{--c-bg:transparent}
.c-btn-plain.c-btn-default{--c-fg:#2563eb}
.c-btn-plain.c-btn-default:hover{--c-fg:#1d4ed8}
.c-btn-plain.c-btn-default:active{--c-fg:#1e40af}
.c-btn-plain.c-btn-success{--c-fg:#16a34a}
.c-btn-plain.c-btn-success:hover{--c-fg:#15803d}
.c-btn-plain.c-btn-danger{--c-fg:#dc2626}
.c-btn-plain.c-btn-danger:hover{--c-fg:#b91c1c}
.c-btn-outline.c-btn-default{--c-bg:#eff6ff;--c-fg:#1d4ed8;--c-bd:inset 0 0 0 1px #1d4ed8}
.c-btn-outline.c-btn-default:hover{--c-bg:#dbeafe;--c-fg:#1e40af;--c-bd:inset 0 0 0 1px #1e40af}
.c-btn-outline.c-btn-default:active{--c-bg:#1e40af;--c-fg:#fff}
.c-btn-outline.c-btn-danger{--c-bg:#fef2f2;--c-fg:#b91c1c;--c-bd:inset 0 0 0 1px #b91c1c}
.c-btn-outline.c-btn-danger:hover{--c-bg:#fee2e2;--c-fg:#991b1b;--c-bd:inset 0 0 0 1px #991b1b}
.c-btn-outline.c-btn-danger:active{--c-bg:#991b1b;--c-fg:#fff}
.c-btn-loading{--c-bg:#99a1af;--c-fg:#030712}
/* disabled. The class is for elements that cannot carry the attribute — a span or an <a> drawn as a
   button. On a real button the ATTRIBUTE decides, and :not(:enabled) makes the class step aside the
   moment the attribute is cleared: a prototype that sets btn.disabled = false and leaves the class
   alone then looks enabled, instead of keeping the default cursor and greying its own label on hover
   (run 5's walk, 2026-09-20). A span is never :enabled, so it keeps looking disabled. */
.c-btn:disabled,.c-btn-disabled:not(:enabled){--c-bg:#f3f4f6;--c-fg:#6a7282;--c-bd:none;cursor:default}
.c-btn:disabled:hover,.c-btn-disabled:not(:enabled):hover{--c-bg:#f3f4f6;--c-fg:#6a7282}
/* --- the two AI buttons. Primary is a 90deg wash behind a purple border that
   darkens with the state, and it keeps that wash even disabled, where the common
   grey disabled look does not apply. Tertiary has no fill: its label and icon are
   painted by a 135deg gradient through background-clip, so an icon must use
   currentColor to be painted at all. */
.c-btn-ai.c-btn-default{--c-img:linear-gradient(90deg,#e0e7ff 0%,#f3e8ff 100%);--c-fg:#1e2939;--c-bd:inset 0 0 0 1px #e9d5ff}
.c-btn-ai.c-btn-default:hover{--c-bd:inset 0 0 0 1px #d8b4fe}
.c-btn-ai.c-btn-default:active{--c-bd:inset 0 0 0 1px #c084fc}
.c-btn-ai.c-btn-loading{--c-bg:transparent;--c-bd:inset 0 0 0 1px #c084fc}
.c-btn-ai:disabled,.c-btn-ai.c-btn-disabled:not(:enabled){--c-bg:transparent;--c-fg:#4a5565;--c-bd:inset 0 0 0 1px #e9d5ff}
.c-btn-ai-tertiary .c-btn-c{background-image:linear-gradient(135deg,#818cf8 12.26%,#9333ea 61.93%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
.c-btn-ai-tertiary.c-btn-default:hover{--c-bg:#d1d5dc}
.c-btn-ai-tertiary.c-btn-default:active{--c-bg:#b4bac4}
.c-btn-ai-tertiary.c-btn-loading{--c-bg:#b4bac4}
.c-btn-ai-tertiary:disabled .c-btn-c,.c-btn-ai-tertiary.c-btn-disabled:not(:enabled) .c-btn-c{background-image:none;
  -webkit-text-fill-color:#818cf8;color:#818cf8}
.c-btn-ai-tertiary:disabled,.c-btn-ai-tertiary.c-btn-disabled:not(:enabled){--c-bg:transparent}

/* --- radio / checkbox: SnsRadioButton, SnsCheckbox. The mark is 16, the label 14/24 at 8px, and the mark is
   pushed 4px down so it centres on the first line. */
.c-rd,.c-cb{display:flex;align-items:flex-start;cursor:pointer;user-select:none;font-size:14px;line-height:24px;color:#1e2939}
.c-rd-m,.c-cb-m{flex:none;width:16px;height:16px;margin-top:4px;box-sizing:border-box;background:#fff;
  box-shadow:inset 0 0 0 1px #d1d5dc;position:relative}
.c-rd-m{border-radius:100px}
.c-cb-m{border-radius:4px;display:flex;align-items:center;justify-content:center}
.c-cb-m svg{width:12px;height:12px}
.c-cb-m svg[viewBox="0 0 16 16"]{width:16px;height:16px}  /* the indeterminate bar is drawn in the 16 box, the tick in a 12 one */
.c-rd-b,.c-cb-b{display:flex;flex-direction:column;margin-left:8px}
.c-rd-c,.c-cb-c{color:#4a5565}
.c-rd:hover .c-rd-m,.c-cb:hover .c-cb-m{box-shadow:inset 0 0 0 1px #b4bac4;background:#f9fafb}
.c-rd:active .c-rd-m,.c-cb:active .c-cb-m{box-shadow:inset 0 0 0 1px #99a1af;background:#f3f4f6}
.c-rd-on .c-rd-m{background:#030712;box-shadow:none}
.c-rd-on .c-rd-m::after{content:"";position:absolute;left:4px;top:4px;width:8px;height:8px;border-radius:8px;background:#fff}
.c-rd-on:hover .c-rd-m{background:#1e2939}
.c-rd-on:active .c-rd-m{background:#364153}
.c-cb-m .c-cb-tick,.c-cb-m .c-cb-bar{display:none;line-height:0}
.c-cb-on .c-cb-tick{display:block}
.c-cb-on.c-cb-ind .c-cb-tick{display:none}
.c-cb-on.c-cb-ind .c-cb-bar{display:block}
.c-cb-on .c-cb-m{background:#030712;box-shadow:none}
.c-cb-on:hover .c-cb-m{background:#1e2939}
.c-cb-on:active .c-cb-m{background:#364153}
.c-rd-disabled,.c-cb-disabled{cursor:default;color:#4a5565}
.c-rd-disabled .c-rd-m,.c-cb-disabled .c-cb-m,.c-rd-disabled:hover .c-rd-m,.c-cb-disabled:hover .c-cb-m{background:#f3f4f6;box-shadow:inset 0 0 0 1px #d1d5dc}
.c-rd-disabled.c-rd-on .c-rd-m,.c-cb-disabled.c-cb-on .c-cb-m{background:#e5e7eb;box-shadow:none}
.c-grp-w{display:flex;flex-direction:column}
.c-grp-t{display:flex;align-items:center;gap:4px;padding-bottom:4px;font-size:14px;line-height:24px;font-weight:500;color:#030712}
.c-grp-ti{display:flex;flex:0 0 16px;width:16px;height:16px}
.c-grp{display:flex;flex-direction:column;gap:8px}
.c-grp-h{flex-direction:row;gap:24px}
/* --- select: the input box with a chevron (the product reuses .sns-input-box for the trigger) */
.c-sel .c-input-box{cursor:pointer}
/* --- search bar: SnsSearchBar. The field's box, a 16 glyph 8px before the text and
   an optional erase glyph 8px after it. Medium is 32 tall, large 40, and the hover,
   focus and disabled states are the field's. */
.c-sb-ic{display:flex;flex-shrink:0;width:16px;height:16px;margin-right:8px;color:#1e2939}
.c-sb-x{display:flex;flex-shrink:0;width:16px;height:16px;margin-left:8px;padding:0;border:0;background:transparent;color:#1e2939;cursor:pointer}
.c-sb-ic svg,.c-sb-x svg{display:block;width:16px;height:16px}
.c-sb-disabled .c-sb-ic{color:#4a5565}
/* --- tag multiselect: the select's box with its values as tags. The rows wrap and
   the chevron stays at the top, which is how the Dev space frames draw it; the chip
   itself is the design system's grey tag. */
.c-tms .c-input-box{align-items:flex-start;cursor:pointer}
.c-tms-tags{display:flex;flex-wrap:wrap;gap:4px;flex:1 0 0;min-width:0;align-items:center;min-height:24px}
.c-tms-tag{cursor:default}
.c-tms-x{display:flex;width:16px;height:16px;padding:0;border:0;background:transparent;color:#6a7282;cursor:pointer}
.c-tms-x svg{display:block;width:16px;height:16px}
.c-tms-ch{flex-shrink:0;width:16px;height:16px;margin-top:4px;color:#1e2939}
.c-tms-ch svg{display:block;width:16px;height:16px}
.c-sel-ch{flex:none;display:inline-flex;margin-left:8px;color:#1e2939}
/* --- tag: Tag Colorful, Medium 12/16 */
.c-tag{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;box-sizing:border-box;
  font-size:12px;line-height:16px;font-weight:500}
.c-tag-grey{background:#f3f4f6;box-shadow:inset 0 0 0 1px #d1d5dc;color:#1e2939}
.c-tag-blue{background:#dbeafe;box-shadow:inset 0 0 0 1px #bfdbfe;color:#1e40af}
.c-tag-green{background:#dcfce7;box-shadow:inset 0 0 0 1px #bbf7d0;color:#166534}
.c-tag-red{background:#fee2e2;box-shadow:inset 0 0 0 1px #fecaca;color:#991b1b}
.c-tag-yellow{background:#fef3c7;box-shadow:inset 0 0 0 1px #fde68a;color:#8a460c}
.c-tag-orange{background:#ffedd5;box-shadow:inset 0 0 0 1px #fed7aa;color:#9a3412}
.c-tag-purple{background:#f3e8ff;box-shadow:inset 0 0 0 1px #e9d5ff;color:#6b21a8}
.c-tag-cyan{background:#cffafe;box-shadow:inset 0 0 0 1px #a5f3fc;color:#155e75}
.c-tag-black{background:#364153;box-shadow:inset 0 0 0 1px #1e2939;color:#fff}
.c-tag-deleted{background:#f3f4f6;box-shadow:inset 0 0 0 1px #e5e7eb;color:#6a7282}
/* the gradient tag, which mockups draw as the AI one: a 72deg wash, white text,
   and a pale purple border that does not follow the wash */
.c-tag-gradient{background-image:linear-gradient(72deg,#b465da 0%,#cf6cc9 33%,#ee609c 66%,#ee609c 100%);
  box-shadow:inset 0 0 0 1px #e9d5ff;color:#fff}
.c-tag-sm{min-height:20px;padding:2px 8px;gap:4px}
/* --- counter: filled pill, min 20 wide */
.c-cnt{display:inline-flex;align-items:center;justify-content:center;min-width:20px;padding:2px 6px;border-radius:40px;
  box-sizing:border-box;font-size:12px;line-height:16px;font-weight:500}
.c-cnt-blue{background:#dbeafe;color:#1e40af}
.c-cnt-green{background:#dcfce7;color:#166534}
.c-cnt-grey{background:#99a1af;color:#fff}
.c-cnt-cyan{background:#cffafe;color:#155e75}
/* outline and dashed draw their ring with the outline property, not a border, so the pill keeps
   its size — the product does the same. Outline ships in four colours, dashed in grey. */
.c-cnt-md{min-width:28px;font-size:14px;line-height:24px}   /* the medium pill is 28 because its text is 14/24 */
.c-cnt-outline{background:none}
.c-cnt-outline.c-cnt-blue{outline:1px solid #93c5fd;color:#1e40af}
.c-cnt-outline.c-cnt-grey{outline:1px solid #b4bac4;color:#1e2939}
.c-cnt-outline.c-cnt-red{outline:1px solid #fca5a5;color:#991b1b}
.c-cnt-outline.c-cnt-green{outline:1px solid #86efac;color:#166534}
.c-cnt-dashed{background:#fff;outline:1px dashed #99a1af;color:#1e2939}
/* --- empty state: SnsEmptyState. Fills its container and centres the block;
   the dashed border and the fill are the two variants the product ships. */
.c-es{display:flex;justify-content:center;width:100%;height:100%;box-sizing:border-box;
  padding:24px;border-radius:12px}
.c-es-bordered{border:1px dashed #d1d5dc}
.c-es-filled{background:#f9fafb}
.c-es-l{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.c-es-h{flex-direction:row-reverse;justify-content:space-between;align-items:center;gap:40px;text-align:left}
.c-es-img{flex-shrink:0;line-height:0}
.c-es-t{font-size:20px;line-height:28px;font-weight:500;color:#030712}
.c-es-d{margin-top:8px;font-size:14px;line-height:24px;color:#1e2939;white-space:pre-line}
.c-es-b{display:flex;justify-content:center;gap:12px;margin-top:16px}
.c-es-h .c-es-b{justify-content:flex-start}
/* --- code block: SnsCodeBlock. #f9fafb behind a 1px #d1d5dc frame, radius 12; the
   header is 8/20 over its own bottom rule, the gutter 20 left and 12 right, and the
   code is 12/18 mono. Token colours are the design system's own variables. */
.c-code{display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;
  background:#f9fafb;border-radius:12px;box-shadow:inset 0 0 0 1px #d1d5dc}
.c-code-h{display:flex;align-items:center;gap:24px;padding:8px 20px;flex-shrink:0;
  box-shadow:inset 0 -1px 0 #d1d5dc}
.c-code-t{flex:1 0 0;min-width:0;font-size:16px;line-height:24px;font-weight:700;color:#030712}
.c-code-b{display:flex;padding:16px 0;overflow:auto}
.c-code-n,.c-code-c{margin:0;font-family:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:12px;line-height:18px;white-space:pre}
.c-code-n{padding:0 12px 0 20px;text-align:right;color:#4a5565;flex-shrink:0}
.c-code-c{padding-right:20px;color:#030712}
.c-code-l{display:block}
.c-code-comment{color:#4a5565}
.c-code-string,.c-code-operator{color:#15803d}
.c-code-keyword,.c-code-function{color:#4338ca}
.c-code-number{color:#be185d}
.c-code-property{color:#7e22ce}
.c-code-punctuation,.c-code-plain{color:#030712}
/* --- status: SnsStatus. A pill with a 6px dot; title Medium 12/16 over description
   Regular 12/16, both in the pill's own text colour. The dot takes the badge palette,
   which is a different, more saturated set than the pill's border. */
.c-st{display:inline-flex;align-items:center;gap:4px;box-sizing:border-box;max-width:100%;
  white-space:nowrap;border:1px solid;border-radius:9999px;font-size:12px;line-height:16px}
.c-st-small{min-height:20px;padding:0 8px}
.c-st-medium{min-height:24px;padding:0 8px}
.c-st-large{min-height:32px;padding:0 12px}
.c-st-d{flex-shrink:0;width:6px;height:6px;border-radius:9999px;background:var(--c-dot)}
.c-st-t{font-weight:500;overflow:hidden;text-overflow:ellipsis}
.c-st-x{font-weight:400;overflow:hidden;text-overflow:ellipsis}
.c-st-grey{background:#f3f4f6;border-color:#d1d5dc;color:#1e2939;--c-dot:#6a7282}
.c-st-grey-dark{background:#e5e7eb;border-color:#d1d5dc;color:#1e2939;--c-dot:#4a5565}
.c-st-blue{background:#dbeafe;border-color:#bfdbfe;color:#1e40af;--c-dot:#3b82f6}
.c-st-cyan{background:#cffafe;border-color:#a5f3fc;color:#155e75;--c-dot:#06b6d4}
.c-st-green{background:#dcfce7;border-color:#bbf7d0;color:#166534;--c-dot:#22c55e}
.c-st-yellow{background:#fef3c7;border-color:#fde68a;color:#8a460c;--c-dot:#f4a614}
.c-st-orange{background:#ffedd5;border-color:#fed7aa;color:#9a3412;--c-dot:#f97316}
.c-st-orange-light{background:#fff7ed;border-color:#ffedd5;color:#9a3412;--c-dot:#fb923c}
.c-st-pink{background:#fce7f3;border-color:#fbcfe8;color:#9d174d;--c-dot:#ec4899}
.c-st-purple{background:#f3e8ff;border-color:#e9d5ff;color:#6b21a8;--c-dot:#a855f7}
.c-st-purple-light{background:#faf5ff;border-color:#f3e8ff;color:#6b21a8;--c-dot:#c084fc}
.c-st-red{background:#fee2e2;border-color:#fecaca;color:#991b1b;--c-dot:#ef4444}
.c-st-red-light{background:#fef2f2;border-color:#fee2e2;color:#991b1b;--c-dot:#f87171}
/* --- status select: SnsStatusSelect. The same pill, clickable. Background and text
   hold still in every state; the border darkens on hover and again while pressed,
   and the chevron walks with it. No orange-light here: the product does not ship it. */
.c-ss{cursor:pointer;font-family:inherit;margin:0}
.c-ss-ch{display:inline-flex;flex-shrink:0;width:16px;height:16px;color:var(--c-chev)}
.c-ss-ch svg{width:16px;height:16px;display:block}
.c-ss-blue{--c-chev:#2563eb}.c-ss-blue:hover{border-color:#93c5fd;--c-chev:#1d4ed8}.c-ss-blue:active{border-color:#60a5fa;--c-chev:#1e40af}
.c-ss-cyan{--c-chev:#0891b2}.c-ss-cyan:hover{border-color:#67e8f9;--c-chev:#0e7490}.c-ss-cyan:active{border-color:#22d3ee;--c-chev:#155e75}
.c-ss-green{--c-chev:#16a34a}.c-ss-green:hover{border-color:#86efac;--c-chev:#15803d}.c-ss-green:active{border-color:#4ade80;--c-chev:#166534}
.c-ss-grey{--c-chev:#1e2939}.c-ss-grey:hover{border-color:#b4bac4;--c-chev:#4a5565}.c-ss-grey:active{border-color:#99a1af;--c-chev:#1e2939}
.c-ss-grey-dark{--c-chev:#1e2939}.c-ss-grey-dark:hover{border-color:#b4bac4;--c-chev:#4a5565}.c-ss-grey-dark:active{border-color:#99a1af;--c-chev:#1e2939}
.c-ss-orange{--c-chev:#ea580c}.c-ss-orange:hover{border-color:#fdba74;--c-chev:#c2410c}.c-ss-orange:active{border-color:#fb923c;--c-chev:#9a3412}
.c-ss-pink{--c-chev:#db2777}.c-ss-pink:hover{border-color:#f9a8d4;--c-chev:#be185d}.c-ss-pink:active{border-color:#f472b6;--c-chev:#9d174d}
.c-ss-purple{--c-chev:#9333ea}.c-ss-purple:hover{border-color:#d8b4fe;--c-chev:#7e22ce}.c-ss-purple:active{border-color:#c084fc;--c-chev:#6b21a8}
.c-ss-purple-light{--c-chev:#9333ea}.c-ss-purple-light:hover{border-color:#e9d5ff;--c-chev:#7e22ce}.c-ss-purple-light:active{border-color:#d8b4fe;--c-chev:#6b21a8}
.c-ss-red{--c-chev:#dc2626}.c-ss-red:hover{border-color:#fca5a5;--c-chev:#b91c1c}.c-ss-red:active{border-color:#f87171;--c-chev:#991b1b}
.c-ss-red-light{--c-chev:#dc2626}.c-ss-red-light:hover{border-color:#fecaca;--c-chev:#b91c1c}.c-ss-red-light:active{border-color:#fca5a5;--c-chev:#991b1b}
.c-ss-yellow{--c-chev:#d27a0a}.c-ss-yellow:hover{border-color:#fad24a;--c-chev:#a95a0a}.c-ss-yellow:active{border-color:#f7bd28;--c-chev:#8a460c}
/* --- link: inherits size and weight from its context, and underlines — the
   product's SnsLink sets text-decoration-line: underline on the anchor itself */
.c-lnk{color:#2563eb;text-decoration:underline;cursor:pointer}
.c-lnk:hover{color:#1d4ed8}
.c-lnk:visited{color:#1e40af}
/* --- tabs: the basic bar. 32 high, 24 apart, a 1px rule under the whole bar, 2px under the selected item */
.c-tabs{display:flex;align-items:center;gap:24px;box-shadow:inset 0 -1px 0 #e5e7eb}
.c-tab{display:flex;align-items:center;gap:4px;height:32px;padding:4px 0;box-sizing:border-box;
  font-size:14px;line-height:24px;font-weight:500;color:#4a5565;white-space:nowrap;cursor:pointer}
.c-tab-on{color:#1e2939;box-shadow:inset 0 -2px 0 #030712}
/* --- DataList: SnsDataList, read from its own story on 2026-09-21: rows 8 apart, the two columns
   16 apart, the value column growing with a 4px gap, label #364153 and value #030712, both 14/24
   in the DEFAULT family. The Figma file maps the label to font/family/body (Inter); the shipped
   component does not, and the component wins (VERSION.md). The 152 column is the frame's choice —
   the component only sets flex-shrink:0 — so it is the default here and --c-dl-l overrides it. */
.c-dl{--c-dl-l:152px;display:flex;flex-direction:column;gap:8px}
.c-dl-r{display:flex;align-items:flex-start;gap:16px}
.c-dl-l{flex:0 0 var(--c-dl-l);width:var(--c-dl-l);overflow:hidden;font-size:14px;line-height:24px;color:#364153}
.c-dl-v{display:flex;align-items:center;gap:4px;flex:1 1 auto;min-width:0;
  font-size:14px;line-height:24px;color:#030712}
/* --- keyboard shortcut: the grey keycaps inside a button */
.c-kbd{display:inline-flex;align-items:center;gap:2px}
.c-kbd kbd{display:inline-flex;align-items:center;justify-content:center;min-width:20px;box-sizing:border-box;
  padding:2px 4px;border-radius:8px;background:#edeff2;color:#373d4d;
  font-family:Inter,system-ui,sans-serif;font-size:12px;line-height:16px;font-weight:500}
/* --- tooltip: the floating box and its arrow; the prototype places the box */
.c-tip{display:inline-block;background:#030712;color:#fff;font-size:12px;line-height:16px}
.c-tip-small{border-radius:8px;padding:6px 8px;--c-tip-d:4px}
.c-tip-large{border-radius:12px;padding:16px;--c-tip-d:8px}
/* the arrow: the product's own export, 8x4 under the small box and 20x8 under the large one, sitting
   wholly outside the edge and centred on it. The export points DOWN — the tooltip above its target —
   and each other side turns it, because the one thing an arrow must never get wrong is its direction */
.c-tip-a{position:relative}
.c-tip-arrow{position:absolute;line-height:0;color:#030712}
.c-tip-a-top .c-tip-arrow{top:100%;left:50%;transform:translateX(-50%)}
.c-tip-a-bottom .c-tip-arrow{bottom:100%;left:50%;transform:translateX(-50%) rotate(180deg)}
.c-tip-a-right .c-tip-arrow{left:0;top:50%;transform:translate(calc(-50% - var(--c-tip-d) / 2),-50%) rotate(90deg)}
.c-tip-a-left .c-tip-arrow{left:100%;top:50%;transform:translate(calc(-50% + var(--c-tip-d) / 2),-50%) rotate(-90deg)}
/* --- modal: backdrop + card */
.c-mod-wrap[hidden]{display:none}
.c-mod-wrap{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;z-index:50}
.c-mod-back{position:absolute;inset:0;background:rgba(0,0,0,.5)}
.c-mod{position:relative;background:#fff;border-radius:16px;padding:16px 24px;box-sizing:border-box}
.c-mod-small{width:480px}
.c-mod-medium{width:600px}
.c-mod-large{width:720px}
.c-mod-h{min-height:52px;display:flex;align-items:center;gap:16px}
.c-mod-ttl{display:flex;flex-direction:column;flex:1;min-width:0}
.c-mod-t{font-size:18px;line-height:24px;font-weight:700;color:#030712}
.c-mod-s{font-size:14px;line-height:24px;font-weight:400;color:#4a5565}
/* --- collapsible card */
.c-card{overflow:hidden;background:#fff;border-radius:16px;box-shadow:inset 0 0 0 1px #d1d5dc;box-sizing:border-box}
/* the header bar is grey, not white, and the chevron sits on its left in a 24 box
   that lights up on hover — read from the live story 2026-09-19 */
.c-card-h{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;
  background:#f3f4f6;cursor:pointer;text-align:left}
/* keyboard focus: the design system's ring, on anything focusable that is not a field */
.c-rd:focus-visible,.c-cb:focus-visible,.c-sel-has .c-input-box:focus-visible,.c-tms .c-input-box:focus-visible,
.c-card-h:focus-visible,.c-tab:focus-visible{outline:none;box-shadow:0 0 0 1px #fff,0 0 0 3px #60a5fa;border-radius:8px}
.c-rd:focus-visible,.c-cb:focus-visible{border-radius:4px}
.c-card-small .c-card-h{padding:8px}
.c-card-medium .c-card-h{padding:12px 16px}
.c-card-large .c-card-h{padding:16px 20px}
/* the card in a status colour. The header's own background paints over an inset shadow, so a
   coloured card carries a real border; and the rules name the OUTER card with > so a nested
   Collapsible Card stays grey, which is what the product draws */
.c-card-yellow{box-shadow:none;border:1px solid #fad24a}
.c-card-yellow > .c-card-h{background:#fffbeb}
.c-card-green{box-shadow:none;border:1px solid #bbf7d0}
.c-card-green > .c-card-h{background:#f0fdf4}
.c-card-red{box-shadow:none;border:1px solid #fecaca}
.c-card-red > .c-card-h{background:#fef2f2}
.c-card-ch{display:flex;align-items:center;justify-content:center;flex-shrink:0;
  width:24px;height:24px;border-radius:8px;color:#4a5565}
.c-card-ch svg{display:block;width:16px;height:16px}
.c-card-ch:hover{background:#f3f4f6}
.c-card-ch:active{background:#e5e7eb}
.c-card-open .c-card-ch svg{transform:rotate(180deg)}   /* the product animates this; rule 5 does not */
.c-card-t{flex-grow:1;display:flex;align-items:center;column-gap:8px;overflow:hidden;
  font-size:14px;line-height:24px;font-weight:600;color:#030712}
.c-card-a{display:flex;align-items:center;gap:8px}
.c-card-b{overflow:hidden}
.c-card-small.c-card-open .c-card-b{padding:8px 8px 12px}
.c-card-medium.c-card-open .c-card-b{padding:12px 16px 20px}
.c-card-large.c-card-open .c-card-b{padding:16px 20px 24px}
.c-card:not(.c-card-open) .c-card-b{display:none}

/* --- select menu: the popover the trigger opens. Rows are 40 (60 with a caption), the selected row carries
   the tick on the right; the popover scrolls at 400. */
.c-menu{box-sizing:border-box;background:#fff;border-radius:12px;box-shadow:inset 0 0 0 1px #e5e7eb,0 2px 10px 1px rgba(4,29,47,.15);
  padding:0;overflow-y:auto}
.c-opt{display:grid;grid-template-columns:1fr 16px;column-gap:8px;align-items:center;padding:8px 12px;
  box-sizing:border-box;cursor:pointer}
.c-opt-l{grid-area:1/1/2/2;font-size:14px;line-height:24px;color:#1e2939}
.c-opt-c{grid-area:2/1/3/2;font-size:12px;line-height:16px;color:#4a5565}
.c-opt-m{grid-area:1/2/2/3;display:flex;color:#030712}
.c-opt-m svg{width:16px;height:16px}
.c-opt-m svg path{fill:#030712}
.c-opt:hover{background:#f3f4f6}
/* the menu hangs under its trigger and is hidden until the trigger is clicked */
.c-menu-anchor{position:relative;display:block;width:100%}
.c-menu-anchor .c-menu{position:absolute;left:0;top:4px;z-index:40;display:none}
.c-sel-open .c-menu-anchor .c-menu{display:block}
.c-sel-has .c-input-box{cursor:pointer}
.c-menu{display:flex;flex-direction:column;overflow:hidden}
.c-menu-l{overflow-y:auto;min-height:0;flex:1}
/* the search row above the list: 12/12/8 around a 32 box */
.c-menu-s{padding:12px 12px 8px}
.c-menu-sb{display:flex;align-items:center;height:32px;padding:0 8px;box-sizing:border-box;
  border-radius:8px;box-shadow:inset 0 0 0 1px #d1d5dc}
.c-menu-si{flex:1;min-width:0;border:0;outline:none;background:transparent;font:inherit;
  font-size:14px;line-height:24px;color:#030712}
.c-menu-si::placeholder{color:#6a7282}
.c-opt-m{visibility:hidden}
.c-opt-on .c-opt-m{visibility:visible}
.c-opt-on{background:#f9fafb}
.c-opt-on{background:#f9fafb}
.c-opt-off{cursor:default}
.c-opt-off .c-opt-l{color:#6a7282}
.c-opt-g{padding:8px 12px;font-size:12px;line-height:16px;font-weight:500;color:#6a7282}
/* --- toast: SnsToast. 476 wide in the product, 16 padding, radius 12, 1px border, icon 24 in a 4px box */
.c-toast{display:flex;align-items:flex-start;gap:8px;width:476px;padding:16px;box-sizing:border-box;border-radius:12px;
  box-shadow:0 2px 6px 1px rgba(4,29,47,.1);font-size:14px;line-height:24px;color:#030712}
.c-toast[hidden]{display:none}
.c-toast-i{flex:none;display:flex;padding:4px}
.c-toast-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.c-toast-t{font-weight:600}
.c-toast-c{flex:none;display:flex;align-items:center;justify-content:center;padding:4px;border:0;border-radius:8px;
  background:transparent;cursor:pointer;font:inherit}
.c-toast-info{background:#eff6ff;box-shadow:inset 0 0 0 1px #bfdbfe,0 2px 6px 1px rgba(4,29,47,.1)}
.c-toast-info .c-toast-i{color:#3b82f6}
.c-toast-success{background:#f0fdf4;box-shadow:inset 0 0 0 1px #bbf7d0,0 2px 6px 1px rgba(4,29,47,.1)}
.c-toast-success .c-toast-i{color:#22c55e}
.c-toast-warning{background:#fffbeb;box-shadow:inset 0 0 0 1px #fde68a,0 2px 6px 1px rgba(4,29,47,.1)}
.c-toast-warning .c-toast-i{color:#f4a614}
.c-toast-danger{background:#fef2f2;box-shadow:inset 0 0 0 1px #fecaca,0 2px 6px 1px rgba(4,29,47,.1)}
.c-toast-danger .c-toast-i{color:#ef4444}

/* --- alert: SnsAlert. Radius 12, 1px border, medium 16 padding with 8 gap, small 8 with 4; the icon sits in a
   24 box with 4px padding, the text column carries a 16/24 Medium title above 14/24 text. */
.c-alert{display:flex;align-items:flex-start;box-sizing:border-box;border-radius:12px;font-size:14px;line-height:24px;color:#030712}
.c-alert-medium{padding:16px;gap:8px}
.c-alert-small{padding:8px;gap:4px}
.c-alert-i{flex:none;display:flex;padding:4px}
.c-alert-c{flex:1;min-width:0;display:flex;flex-direction:column}
.c-alert-medium .c-alert-c{gap:4px}
.c-alert-t{font-size:16px;line-height:24px;font-weight:500}
.c-alert-a{flex:none;display:flex}
.c-alert-basic{background:#f3f4f6;box-shadow:inset 0 0 0 1px #e5e7eb}
.c-alert-basic .c-alert-i{color:#6a7282}
.c-alert-info{background:#eff6ff;box-shadow:inset 0 0 0 1px #bfdbfe}
.c-alert-info .c-alert-i{color:#3b82f6}
.c-alert-success{background:#f0fdf4;box-shadow:inset 0 0 0 1px #bbf7d0}
.c-alert-success .c-alert-i{color:#22c55e}
.c-alert-warning{background:#fffbeb;box-shadow:inset 0 0 0 1px #fde68a}
.c-alert-warning .c-alert-i{color:#f4a614}
.c-alert-danger{background:#fef2f2;box-shadow:inset 0 0 0 1px #fecaca}
.c-alert-danger .c-alert-i{color:#ef4444}
`;
// script — the one behaviour the controls need to be live: a radio picks, a box
// toggles. Drop it in a <script> once per page. A radio group is the nearest
// [data-radio] or .c-grp, so two groups side by side do not fight; without either
// it falls back to the radio's own parent. Disabled controls do nothing, and
// clicking an indeterminate box checks it, the way a browser does.
const script = `(function(){
  // One delegated listener, and the order of its branches is load-bearing: a menu row
  // is checked before the radio and the checkbox, because a row can contain either and
  // the click would otherwise reach both; the card header comes last, because a
  // checkbox can sit inside it. Lint pins this with a nested case.
  var up = function (el, sel) { return el && el.closest ? el.closest(sel) : null; };
  var setOpen = function (owner, open) {
    owner.classList.toggle('c-sel-open', open);
    var box = owner.querySelector('.c-input-box');
    if (box) box.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  var closeAllBut = function (keep) {
    var open = document.querySelectorAll('.c-sel-open');
    for (var k = 0; k < open.length; k++) if (open[k] !== keep) setOpen(open[k], false);
  };
  var chipHtml = function (label, x) {
    return '<span class="c-tag c-tag-grey c-tms-tag">' + label +
      (x ? '<button type="button" class="c-tms-x" aria-label="Remove ' + label + '">' + x + '</button>' : '') + '</span>';
  };
  var redrawChips = function (owner) {
    var tags = owner.querySelector('.c-tms-tags'), x = owner.getAttribute('data-x') || '';
    var picked = owner.querySelectorAll('.c-opt-on');
    tags.innerHTML = picked.length
      ? Array.prototype.map.call(picked, function (o) { return chipHtml(o.querySelector('.c-opt-l').textContent, x); }).join('')
      : '<span class="c-input-ph">' + (owner.getAttribute('data-ph') || '') + '</span>';
  };
  document.addEventListener('click', function (e) {
    var cb = up(e.target, '.c-cb');
    if (cb) {
      if (cb.classList.contains('c-cb-disabled')) return;
      if (cb.classList.contains('c-cb-ind')) { cb.classList.remove('c-cb-ind'); cb.classList.add('c-cb-on'); }
      else cb.classList.toggle('c-cb-on');
      cb.setAttribute('aria-checked', cb.classList.contains('c-cb-on') ? 'true' : 'false');
      return;
    }
    // the chip's own cross removes the chip and unticks its row; the menu stays as it was
    var x = up(e.target, '.c-tms-x');
    if (x) {
      var chip = up(x, '.c-tms-tag'), owner0 = up(x, '.c-tms');
      if (owner0 && chip) {
        var label = chip.firstChild ? chip.firstChild.textContent : '';
        var rows = owner0.querySelectorAll('.c-opt-on');
        for (var r = 0; r < rows.length; r++) {
          if (rows[r].querySelector('.c-opt-l').textContent === label) { rows[r].classList.remove('c-opt-on'); rows[r].setAttribute('aria-selected', 'false'); }
        }
        if (owner0.querySelector('.c-menu')) redrawChips(owner0); else chip.remove();
      }
      return;
    }
    var box = up(e.target, '.c-input-box');
    if (box && !up(e.target, '.c-input-btn') && !up(box, '.c-sel') && !up(box, '.c-tms')) {
      var ctl = box.querySelector('.c-input-ctl');
      if (ctl && !ctl.disabled) { ctl.focus(); }
    }
    // the select and the tag multiselect open their own menu, pick from it and close
    var opt = up(e.target, '.c-opt');
    if (opt && !opt.classList.contains('c-opt-off')) {
      var owner = up(opt, '.c-sel-has');
      if (owner) {
        if (owner.classList.contains('c-tms')) {
          opt.classList.toggle('c-opt-on');
          opt.setAttribute('aria-selected', opt.classList.contains('c-opt-on') ? 'true' : 'false');
          redrawChips(owner);
        } else {
          var all = owner.querySelectorAll('.c-opt');
          for (var j = 0; j < all.length; j++) { all[j].classList.remove('c-opt-on'); all[j].setAttribute('aria-selected', 'false'); }
          opt.classList.add('c-opt-on'); opt.setAttribute('aria-selected', 'true');
          var text = owner.querySelector('.c-input-text');
          if (text) text.textContent = opt.querySelector('.c-opt-l').textContent;
          setOpen(owner, false);
        }
        return;
      }
    }
    var trigger = up(e.target, '.c-sel-has');
    var inMenu = up(e.target, '.c-menu');
    closeAllBut(trigger);
    if (trigger && !inMenu) { setOpen(trigger, !trigger.classList.contains('c-sel-open')); return; }
    if (inMenu) return;

    var rd = up(e.target, '.c-rd');
    if (rd) {
      if (rd.classList.contains('c-rd-disabled')) return;
      var scope = up(rd, '[data-radio]') || up(rd, '.c-grp') || rd.parentElement;
      var group = scope ? scope.querySelectorAll('.c-rd') : [];
      for (var i = 0; i < group.length; i++) { group[i].classList.remove('c-rd-on'); group[i].setAttribute('aria-checked', 'false'); }
      rd.classList.add('c-rd-on'); rd.setAttribute('aria-checked', 'true');
      return;
    }
    // the collapsible card opens and closes on its header — its own state, like a radio's
    var head = up(e.target, '.c-card-h');
    if (head && !up(e.target, '.c-card-a')) {
      var card = up(head, '.c-card');
      card.classList.toggle('c-card-open');
      head.setAttribute('aria-expanded', card.classList.contains('c-card-open') ? 'true' : 'false');
    }
  });
  // the keyboard: Space and Enter act as a click on anything focusable that is not a
  // field; Escape closes every menu. Space is swallowed so the page does not scroll.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAllBut(null); return; }
    if (e.key !== ' ' && e.key !== 'Enter') return;
    var t = e.target;
    if (!t || !t.matches) return;
    if (t.matches('.c-rd, .c-cb, .c-card-h, .c-tab, .c-sel-has .c-input-box, .c-tms .c-input-box')) {
      e.preventDefault();
      t.click();
    }
  });
})();`;

module.exports = {css, script, input, button, radio, checkbox, group, dataList, kbd, select, multiselect, selectMenu, tag, counter, status, statusSelect, emptyState, codeBlock, tagMultiselect, searchBar, link, tabs, tooltip, modal, card, toast, alert};
