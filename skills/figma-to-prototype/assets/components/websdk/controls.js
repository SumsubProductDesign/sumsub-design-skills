// controls.js — the WebSDK UI kit's components for a prototype's live set, rendered from the kit's own
// snapshot (kit.css, markup/, icons/, flags/ in this folder, taken from its Storybook by scripts/sbkit.cjs).
// The markup each function writes is the story's markup with the text, the state and the icons the
// frame gives; the classes are the snapshot's stable names (sdk-button, sdk-button__primary), so a
// generator written against them survives the next capture.
//
//   const W = require(process.env.SKILL + '/assets/components/websdk/controls.js');   // $SKILL: SKILL.md, Before you start
//   page.css += W.css;                     // once per page: Manrope embedded, then the whole kit
//   page.script += W.script;               // once per page: toggles, tabs, dialogs, the steps popup, the select's shown value, a radio row's state
//   html = W.container(W.header({back: true, step: [1, 3]}) + W.content(W.pageTitle({title: 'Applicant data'})
//          + W.inputField({label: 'First name', required: true})) + W.footer({buttons: [W.button({label: 'Continue'})]}));
//
// The page's <body> carries class="sns-uikit sns-theme-light" (the variables live there) and a
// <meta name="viewport">; the page background behind the widget and the widget's width come from
// the frames, not from here (VERSION.md § Using it in a prototype). Values and their source:
// VERSION.md; `--api` lists every function, `--api <name>` one header, `--doc <name>` its VERSION.md section.
'use strict';
const fs = require('fs'), path = require('path');
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const {uniq: uniqIds} = require(path.join(__dirname, '..', '..', '..', 'scripts', '_svg.cjs'));
let uid = 0;
const nextId = prefix => prefix + '-' + (++uid);
const cls = (...a) => a.filter(Boolean).join(' ');

// ---- icons: the kit's own, by name. icons/16/<name>.svg are the 16px glyphs the components use
// (chevron-left, globe, to-phone, check, close, alert-circle, check-circle, cross-circle, eye-closed,
// calendar, chevron-down, chevron-right, plus, …); icons/<name>.svg is the 24px set of SdkIcon/all-icons.
// Every copy gets its own ids (scripts/_svg.cjs). A raw SVG string is taken as it is.
const ICON_DIR = path.join(__dirname, 'icons');
const iconFile = name => {
  for (const p of [path.join(ICON_DIR, '16', name + '.svg'), path.join(ICON_DIR, name + '.svg')]) if (fs.existsSync(p)) return p;
  throw new Error(`no icon "${name}" in ${path.relative(process.cwd(), ICON_DIR)} (16/ or the 24 set); icons/ lists them`);
};
// icon(name, {type, size, interactive, extra}) — the kit's <svg class="icon sdk-icon type-… size-…-auto">:
//   type 'primary' | 'secondary' | 'interactive' | 'white' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
//   (the kit's colour classes), size 'extra-small' (16) | 'small' (24) | 'medium' | 'large', interactive
//   adds the hover class, extra adds classes (a button's leftIcon). name is a file in icons/, or an <svg…> string
function icon(name, o = {}) {
  const size = o.size || 'extra-small', px = {'extra-small': 16, small: 24, medium: 32, large: 48, 'extra-large': 40}[size] || 16;
  let svg = /^\s*<svg/.test(name) ? name : fs.readFileSync(iconFile(name), 'utf8').replace(/<\?xml[^>]*>/, '').trim();
  svg = svg.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    attrs = attrs.replace(/\s(width|height|class|aria-hidden|data-s-icon)="[^"]*"/g, '');
    return `<svg data-s-icon=""${attrs} width="${px}" height="${px}" class="${cls('icon sdk-icon', 'type-' + (o.type || 'primary'), 'size-' + size + '-auto', o.interactive && 'interactive', o.extra)}" aria-hidden="true">`;
  });
  return uniqIds(svg);
}
// flag(code, {alt}) — a country's flag from flags/<CODE>.svg (the kit's set, 24×18), inlined as a data URI
//   the way the kit's own select does: <img src="data:image/svg+xml,…" width="24" height="18">
function flag(code, o = {}) {
  const p = path.join(__dirname, 'flags', String(code).toUpperCase() + '.svg');
  if (!fs.existsSync(p)) throw new Error(`no flag "${code}" in flags/`);
  const svg = fs.readFileSync(p, 'utf8').trim();
  return `<img src="data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ')}" alt="${esc(o.alt || 'Flag of ' + code)}" aria-hidden="true" width="24" height="18">`;
}

// text(spec) — the kit's typography: spec.variant 'header1' (24/32 SemiBold) | 'header2' | 'header3' | 'body'
//   (16/24 Medium, default) | 'caption' (14/20) | 'danger' (the error red), text, tag (div by default; h1 for
//   a page title), id, extra (more classes). Every component's text is set in this family — Manrope
function text(spec = {}) {
  const tag = spec.tag || 'div';
  return `<${tag} class="${cls('sdk-text', 'sdk-text__' + (spec.variant || 'body'), spec.extra)}"${spec.id ? ` id="${esc(spec.id)}"` : ''}>${spec.html != null ? spec.html : esc(spec.text)}</${tag}>`;
}

// button(spec) — SdkButton: spec.type 'primary' (default, the black 48 one) | 'secondary' | 'plain' | 'link'
//   (an inline <span role=button>) | 'topbar' (the header's) | 'field' (inside a field), label, icon (a name or
//   an <svg…>, drawn before the label), iconType (the icon's colour class; 'primary' by default, 'white' on a
//   primary button), iconOnly (a square; label becomes the aria-label), small (the 32 size), disabled, loading
//   (the dots loader, disabled), underline (link only), danger, id, name, attrs (a string of extra attributes)
function button(spec = {}) {
  const type = spec.type || 'primary';
  const off = spec.disabled || spec.loading;
  const classes = cls('sdk-text sdk-text__header3 sdk-button', 'sdk-button__' + type, 'sdk-button__default',
    spec.small && 'sdk-button__small', spec.iconOnly && 'sdk-button__iconOnly', off && 'sdk-button__disabled',
    spec.underline && 'sdk-button__underline', spec.danger && 'sdk-button__danger', spec.extra);
  const ic = spec.icon ? icon(spec.icon, {type: spec.iconType || (type === 'primary' ? 'white' : type === 'topbar' ? 'interactive' : 'primary'), interactive: true, extra: 'sdk-button__leftIcon'}) : '';
  const inner = spec.loading
    ? '<div class="sdk-loader sdk-loader__loaderColorWhite sdk-dots-loader"><span></span><span></span><span></span></div>'
    : ic + (spec.iconOnly ? '' : esc(spec.label || ''));
  const common = `class="${classes}" data-variant="${type}"${spec.iconOnly ? ' data-icon-only="true"' : ''}`
    + `${spec.id ? ` id="${esc(spec.id)}"` : ''}${spec.name ? ` name="${esc(spec.name)}"` : ''}`
    + `${spec.iconOnly && spec.label ? ` aria-label="${esc(spec.label)}"` : ''}${spec.attrs ? ' ' + spec.attrs : ''}`;
  if (type === 'link') return `<span ${common} role="button" tabindex="${off ? '-1' : '0'}"${off ? ' aria-disabled="true"' : ''}>${inner}</span>`;
  return `<button ${common} type="button"${off ? ' disabled aria-disabled="true" tabindex="-1"' : ' tabindex="0"'}>${inner}</button>`;
}

// header(spec) — SdkHeader, the widget's top bar (68 high): spec.back (the back button; true, or an id for it),
//   step [current, total] (the step ring and "Step 2/3"; omit for no ring), stepLabel ('Step'), steps (the
//   popup's items, [{label, done}], opened by a click on the ring — script), toPhone ('To phone' button;
//   true or a label), lang ('En'; true or a label), right (extra html at the right), left (extra html after the
//   ring). The frames of 2026-10-05 keep only the icon-only language button under 600px: that is the
//   prototype's media query, not the kit's — give the two buttons classes through `langClass` / `langIconClass`.
//   toPhoneId / toPhoneAttrs and langId / langAttrs make the two buttons triggers (a data-sdk-open="#qr")
function header(spec = {}) {
  const [cur, total] = spec.step || [];
  const pct = total ? 100 - 100 * cur / total : 0;
  const ring = total ? `<div class="sdk-header__progress"${spec.steps ? ' data-sdk-steps-trigger="" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false"' : ''}>`
    + text({variant: 'header3', text: spec.stepLabel == null ? 'Step' : spec.stepLabel})
    + `<div data-s-container="" class="container" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${cur}" aria-valuetext="Step ${cur} of ${total}" aria-busy="false" aria-label="Verification progress" style="--kit-bind1: 44px; --kit-bind2: 1px;">`
    + `<svg data-s-container="" class="svg" viewBox="0 0 44 44"><path data-s-container="" class="track" d="M 22 1 H 22 A 21 21 0 0 1 43 22 V 22 A 21 21 0 0 1 22 43 H 22 A 21 21 0 0 1 1 22 V 22 A 21 21 0 0 1 22 1 Z"></path>`
    + `<path data-s-container="" class="progress" d="M 22 1 H 22 A 21 21 0 0 1 43 22 V 22 A 21 21 0 0 1 22 43 H 22 A 21 21 0 0 1 1 22 V 22 A 21 21 0 0 1 22 1 Z" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${+pct.toFixed(6)}"></path></svg>`
    + `<div data-s-container="" class="sdk-text sdk-text__header3 content"><span data-s-container="" class="current-step">${cur}</span><span data-s-container="">/</span><span data-s-container="">${total}</span></div></div>`
    + (spec.steps ? stepsPopup({steps: spec.steps, hidden: true}) : '') + `</div>` : '';
  const back = spec.back ? button({type: 'topbar', icon: 'chevron-left', iconOnly: true, label: 'Back', extra: 'sdk-header__back-button', id: typeof spec.back === 'string' ? spec.back : undefined}) : '';
  const toPhone = spec.toPhone ? button({type: 'topbar', icon: 'to-phone', iconType: 'primary', label: spec.toPhone === true ? 'To phone' : spec.toPhone, extra: spec.toPhoneClass, id: spec.toPhoneId, attrs: spec.toPhoneAttrs}) : '';
  const lang = spec.lang ? button({type: 'topbar', icon: 'globe', iconType: 'primary', label: spec.lang === true ? 'En' : spec.lang, extra: spec.langClass, id: spec.langId, attrs: spec.langAttrs})
    + (spec.langIconClass ? button({type: 'topbar', icon: 'globe', iconType: 'primary', iconOnly: true, label: 'Language', extra: spec.langIconClass}) : '') : '';
  return `<header class="sdk-header" data-testid="sdk-header"><section class="sdk-header__left">${back}${ring}${spec.left || ''}</section>`
    + `<section class="sdk-header__right">${toPhone}${lang}${spec.right || ''}</section></header>`;
}

// stepsPopup(spec) — SdkStepsPopup, the list the header's ring opens: spec.steps [{label, state}] with state
//   'done' | 'active' | 'todo' (the kit's icons: a check, a filled dot, a dotted ring), hidden (closed; the
//   script toggles it), id
function stepsPopup(spec = {}) {
  const st = s => s.state || (s.done ? 'done' : s.active ? 'active' : 'todo');
  const ic = {done: ['check-circle', ''], active: ['step-dot', ''], todo: ['step-loading', 'disabled']};
  // the kit's structure: the plate is sdk-steps-popup__container (absolute under the ring, the frame, the
  // blur), each row is sdk-steps-popup. Until 2026-10-13 the plate carried the row's class and the rows a
  // class the kit has not got, so an open popup had no plate and the active row was not darkened
  return `<div class="sdk-steps-popup__container"${spec.id ? ` id="${esc(spec.id)}"` : ''}${spec.hidden ? ' hidden' : ''} style="--steps-popup-bind1: 8px; --steps-popup-bind2: 0px;">`
    + (spec.steps || []).map(s => `<div class="${cls('sdk-steps-popup', st(s) === 'active' && 'sdk-steps-popup__active')}">${icon(ic[st(s)][0], {extra: ic[st(s)][1]})}${text({variant: 'caption', text: s.label, extra: 'sdk-steps-popup__step-label'})}</div>`).join('')
    + `</div>`;
}

// container(inner, spec) — SdkBaseContainer, the widget: <main id="sdk-base-container"> holding the header,
//   the content and the footer; the kit sizes it (max 718, the widget's radius and border from the variables)
const container = (inner, spec = {}) => `<main id="${esc(spec.id || 'sdk-base-container')}" class="${cls('sdk-base-container', spec.extra)}">${inner}</main>`;

// content(inner, spec) — SdkContent, the scrolling middle of the widget: the inner column (max 506) with
//   spec.bottom — the room kept under the content for the footer (the kit's --content-bind1: 16 bare, 48 with
//   a flat footer, 72 under a splash screen's button; the Welcome frame of 2026-10-05 used 72), bottomNarrow
//   (the room at and under spec.narrow, 600 by default — the shell's narrow width: a warning line that wraps
//   to two lines on a phone makes the footer taller), minHeight (the kit's 440 floor), hideScrollbar,
//   illustration (an <svg>/<img> drawn edge to edge above the content: the section's first child, 4 inside the
//   widget's edges at every width — not the 506 column's, which left a 530 plate at 1440), extra (classes on the
//   inner column).
//   The room is a class rule of zero specificity (:where), not an inline variable, so a page's own rule —
//   a media query for a third width — wins without !important
function content(inner, spec = {}) {
  const r = room(spec.bottom == null ? 16 : spec.bottom, spec.bottomNarrow, spec.narrow);
  return `<section data-testid="sdk-content" class="${cls('sdk-content', r.cls, spec.minHeight && 'sdk-content__withMinHeight', spec.hideScrollbar && 'sdk-content__hide-scrollbar')}">${r.style}`
    + (spec.illustration ? `<div class="sdk-content__illustration">${spec.illustration}</div>` : '')
    + `<div class="${cls('sdk-content__SdkContentInner', spec.extra)}">${inner}</div></section>`;
}
// the room under the content as a class and its rule: the class names its values, so two sections with the
// same room share one rule; the <style> sits inside the section (display:none, no box). An inline
// --content-bind1 needed !important in the page's media query, and the first attempt without it silently
// did nothing — the Switch device run's Welcome overlapped its footer by 22px at 375 (2026-10-12)
function room(bottom, narrowBottom, narrow) {
  const n = narrow == null ? 600 : Number(narrow);
  const c = 'w-room-' + Number(bottom) + (narrowBottom == null ? '' : '-' + Number(narrowBottom) + '-' + n);
  return {cls: c, style: `<style>:where(.${c}){--content-bind1:${Number(bottom)}px}`
    + (narrowBottom == null ? '' : `@media (max-width:${n}px){:where(.${c}){--content-bind1:${Number(narrowBottom)}px}}`) + `</style>`};
}

// footer(spec) — SdkFooter, pinned to the widget's bottom: spec.buttons [html…] (one under another, 8 apart),
//   html (anything else), flat (no blur, no plate: the Welcome frame), extra. Without flat the kit draws its
//   backdrop blur over the content scrolling under it
function footer(spec = {}) {
  return `<div class="${cls('sdk-footer', spec.flat && 'sdk-footer__flat', spec.extra)}" data-testid="sdk-footer"><div class="sdk-footer__inner">${(spec.buttons || []).join('')}${spec.html || ''}</div></div>`;
}

// pageTitle(spec) — SdkPageTitle: spec.title (an h1, header1), subtitle (body), align 'left' | 'center' | 'right'
//   (the kit's --texts-align otherwise), id
function pageTitle(spec = {}) {
  return `<div class="${cls('sdk-page-title', spec.align && 'sdk-page-title__' + spec.align)}"${spec.id ? ` id="${esc(spec.id)}"` : ''}><div>${text({variant: 'header1', tag: 'h1', text: spec.title})}</div>`
    + (spec.subtitle ? text({text: spec.subtitle, extra: 'sdk-page-title__pageSubtitle'}) : '') + `</div>`;
}

// logoBlock(spec) — SdkLogoBlock, the client's logo plate: spec.src (an image URL or data URI), alt, size
//   'medium' (default) | 'small' | 'extraSmall'; no src renders the empty plate
function logoBlock(spec = {}) {
  return `<span class="${cls('sdk-logo-block', 'sdk-logo-block__size' + cap(spec.size || 'medium'))}">${spec.src ? `<img class="sdk-logo-block__image" src="${esc(spec.src)}" alt="${esc(spec.alt || '')}">` : ''}</span>`;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// iconBlock(spec) — SdkIconBlock, the round plate with an icon (a document type) or a text (a step's digit):
//   spec.icon (a name or an <svg…>), or text ('1', '2' — the Welcome frame's steps, set in the kit's caption
//   face, 14/20, centred by the plate; the MCP returns the digit as an icon named Number, which is only the 1),
//   size 'medium' (default) | 'small' | 'extraSmall' (32 — the frames' 40 is a ledger line), state 'default' |
//   'status' | 'attention' | 'error' | 'success' | 'disabled', iconType
function iconBlock(spec = {}) {
  const size = spec.size || 'medium';
  return `<div class="${cls('sdk-icon-block', 'sdk-icon-block__size' + cap(size), 'sdk-icon-block__state' + cap(spec.state || 'default'))}">`
    + (spec.icon ? icon(spec.icon, {type: spec.iconType || 'primary', size: size === 'extraSmall' ? 'extra-small' : 'small'})
      : spec.text != null ? text({variant: 'caption', tag: 'span', text: spec.text}) : '') + `</div>`;
}

// illustration(spec) — SdkIllustration, the kit's plate for a picture: spec.svg (the illustration, inline),
//   size 's' (default, 112) | 'l' (184) | 'd' (content-sized between the kit's 140 and 240), noBackground,
//   noPadding, height (px — the plate's height as an inline style: a frame's 236 in a size 'd' plate, which
//   otherwise sizes by its svg). The kit recolours the illustration's fills by its theme (its rules match the
//   Figma palette's hexes), so the SVG goes in as exported; its own size is a page rule on the svg
function illustration(spec = {}) {
  return `<div data-s-illustration="" class="${cls('SdkIllustration', 'size-' + (spec.size || 's'), spec.noBackground && 'no-background', spec.noPadding && 'no-padding')}"${spec.height ? ` style="height:${spec.height}px"` : ''}>${spec.svg || ''}</div>`;
}

// ---- fields. One label block (SdkInputLabel) around the kit's input, select, textarea, phone or date

const labelBlock = (spec, id, field, extra) => {
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const label = spec.required
    ? `<span>${esc(spec.label)}<span class="sdk-span-required" aria-hidden="true">&nbsp;*</span></span>` : esc(spec.label);
  return `<div class="${cls('sdk-input-label', extra)}">`
    + (spec.label ? `<div class="sdk-input-label__itemText"><label for="${id}" class="sdk-text sdk-text__body" id="${id}-l">${label}</label>${spec.description ? `<div>${esc(spec.description)}</div>` : ''}</div>` : '')
    + field
    + `<ul id="${id}-e" class="sdk-input-label__errors" role="alert" aria-atomic="true">${errors.map(e => `<li class="sdk-text sdk-text__danger">${esc(e)}</li>`).join('')}</ul></div>`;
};
const fieldAttrs = (spec, id) => {
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  return [`id="${id}"`, spec.name ? `name="${esc(spec.name)}"` : '', spec.placeholder ? `placeholder="${esc(spec.placeholder)}"` : '',
    spec.required ? 'required' : '', spec.disabled ? 'disabled' : '', spec.readonly ? 'readonly' : '',
    errors.length ? `aria-invalid="true" aria-describedby="${id}-e"` : '', spec.autocomplete ? `autocomplete="${esc(spec.autocomplete)}"` : '',
    spec.attrs || ''].filter(Boolean).join(' ');
};

// inputField(spec) — SdkInputField, a labelled text field (48 high): spec.label, required (the kit's "&nbsp;*"),
//   value, placeholder, type ('text'; 'password' adds the kit's eye button, 'email', 'tel', 'number'),
//   description (under the label), error (a string, or errors [..] — the kit's red list under the box, the box
//   in its error state), disabled, readonly, left / right (html inside the box: "$", "USD", a button()), id, name,
//   autocomplete, attrs, extra. A field's value is live: it is a real <input>
function inputField(spec = {}) {
  const id = spec.id || nextId('w-in');
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const eye = spec.type === 'password' && spec.eye !== false
    ? `<span class="sdk-input__right">${button({type: 'field', icon: 'eye-closed', iconType: 'primary', iconOnly: true, label: 'Show password', attrs: 'data-sdk-eye=""'})}</span>` : '';
  const box = `<div class="${cls('sdk-input__inputContainer', errors.length && 'sdk-input__error')}">`
    + (spec.left ? `<span class="sdk-input__left">${spec.left}</span>` : '')
    + `<input ${fieldAttrs(spec, id)} type="${esc(spec.type || 'text')}" class="${cls('sdk-input', !spec.value && 'sdk-input__isEmpty')}"${spec.value != null ? ` value="${esc(spec.value)}"` : ''}>`
    + (spec.right ? `<span class="sdk-input__right">${spec.right}</span>` : eye) + `</div>`;
  return labelBlock(spec, id, box, spec.extra);
}

// selectField(spec) — SdkSelectField in its native variant, the one the kit renders on every width here (the
//   customisable <select>, styled by the kit; the picker is the browser's): spec.label, options
//   [{value, label, flag (a country code from flags/), disabled}] or strings, value (the picked option's value),
//   placeholder ('Select an option'), required, disabled, error / errors, description, id, name, attrs, extra.
//   The closed select shows the picked option's flag and label in button.selectedcontent, which is plain
//   markup: the script copies the option into it on every change, so a pick shows without a page handler
function selectField(spec = {}) {
  const id = spec.id || nextId('w-sel');
  const opts = (spec.options || []).map(o => typeof o === 'string' ? {value: o, label: o} : o);
  const picked = opts.find(o => String(o.value) === String(spec.value));
  const ph = spec.placeholder == null ? 'Select an option' : spec.placeholder;
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const sel = `<select data-s-select-native="" ${fieldAttrs(spec, id)} class="${cls('sdk-select-native', !picked && 'sdk-select-native--placeholder')}" aria-invalid="${errors.length ? 'true' : 'false'}" prefixflag="${opts.some(o => o.flag) ? 'true' : 'false'}" withsearch="false" label="${esc(spec.label || '')}" requiredastextsronly="false"${picked ? ` value="${esc(picked.value)}"` : ''}>`
    + `<button data-s-select-native="" class="selectedcontent">${picked ? (picked.flag ? flag(picked.flag) : '') + ' ' + esc(picked.label) : ' ' + esc(ph)}</button>`
    + (picked ? '' : `<option data-s-select-native="" disabled selected hidden class="placeholder" value="">${esc(ph)}</option>`)
    + opts.map(o => `<option data-s-select-native="" value="${esc(o.value)}"${picked && picked === o ? ' selected' : ''}${o.disabled ? ' disabled' : ''}>${o.flag ? flag(o.flag) : ''} ${esc(o.label)}</option>`).join('')
    + `</select>`;
  return labelBlock(spec, id, sel, spec.extra);
}

// textareaField(spec) — SdkTextareaField: spec as inputField() (label, required, value, placeholder, description,
//   error / errors, disabled, readonly, id, name), rows (the kit sizes it by its own rule; rows is the html's)
function textareaField(spec = {}) {
  const id = spec.id || nextId('w-ta');
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const ta = `<textarea data-s-textarea="" ${fieldAttrs(spec, id)} class="${cls('SdkTextarea__input', errors.length && 'error')}" label="${esc(spec.label || '')}" type="text"${spec.rows ? ` rows="${spec.rows}"` : ''}>${esc(spec.value || '')}</textarea>`;
  return labelBlock(spec, id, ta, spec.extra);
}

// phoneField(spec) — SdkPhoneField: a fieldset with the country select (the kit's own trigger, inert here: the
//   list it opens is a kit dialog no story shows) and the number input. spec.label, country {code, calling}
//   ('Select a country' when absent), value, placeholder, required, error / errors, description, disabled, id
function phoneField(spec = {}) {
  const id = spec.id || nextId('w-ph');
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const c = spec.country;
  const trigger = `<span data-s-select="" class="sdk-select"><button data-s-select="" id="${id}-c" aria-label="Country" class="select-wrapper sdk-phone-field__select" aria-haspopup="dialog" aria-expanded="false" type="button"${spec.disabled ? ' disabled' : ''}>`
    + `<span data-s-select="" class="sdk-text sdk-text__body SdkSelectLabel">${c ? `${c.code ? flag(c.code) : ''}<span class="sdk-phone-field__callingCode">${esc(c.calling || '')}</span>` : `<div class="sdk-phone-field__placeholder">${esc(spec.countryPlaceholder || 'Select a country')}</div>`}</span>`
    + icon('chevron-down', {extra: 'chevron-icon'}) + `</button></span>`;
  return `<fieldset class="${cls('sdk-input-fieldset', spec.extra)}" aria-labelledby="${id}-l" aria-required="${spec.required ? 'true' : 'false'}">`
    + `<div class="sdk-input-fieldset__itemText"><div class="flex flex-row justify-between"><legend class="sdk-text sdk-text__body" id="${id}-l">${spec.required ? `<span>${esc(spec.label)}<span class="sdk-span-required" aria-hidden="true">&nbsp;*</span></span>` : esc(spec.label || '')}</legend></div>${spec.description ? `<div>${esc(spec.description)}</div>` : ''}</div>`
    + `<div class="${cls('sdk-phone-field', c && 'sdk-phone-field__phoneInputContainerSelected')}" label="${esc(spec.label || '')}">${trigger}`
    + `<div class="${cls('sdk-input__inputContainer sdk-phone-field__input', errors.length && 'sdk-input__error')}"><input aria-label="${esc(spec.label || 'Phone number')}" id="${id}" type="tel" autocomplete="tel-national"${spec.placeholder ? ` placeholder="${esc(spec.placeholder)}"` : ''}${spec.disabled ? ' disabled' : ''}${spec.value != null ? ` value="${esc(spec.value)}"` : ''} class="${cls('sdk-input', !spec.value && 'sdk-input__isEmpty')}"><span class="sdk-input__right"></span></div></div>`
    + `<div id="${id}-e" class="sdk-input-fieldset__errors" role="alert" aria-atomic="true">${errors.map(e => text({variant: 'danger', text: e})).join('')}</div></fieldset>`;
}

// dateField(spec) — SdkDateField: the masked text input (placeholder 'DD/MM/YYYY') with the kit's calendar
//   button, which here opens the browser's native date picker (the kit's hidden <input type=date>). spec as
//   inputField(), format ('DD/MM/YYYY'), iso (the native input's value)
function dateField(spec = {}) {
  const id = spec.id || nextId('w-dt');
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const fmt = spec.format || 'DD/MM/YYYY';
  const box = `<div class="${cls('sdk-input__inputContainer sdk-date-field__input', errors.length && 'sdk-input__error')}">`
    + `<input inputmode="numeric" ${fieldAttrs(Object.assign({placeholder: fmt}, spec), id)} type="text" aria-describedby="${id}-f" class="${cls('sdk-input', !spec.value && 'sdk-input__isEmpty')}"${spec.value != null ? ` value="${esc(spec.value)}"` : ''}>`
    + `<span class="sdk-input__right"><span class="sdk-date-field__picker">${button({type: 'field', icon: 'calendar', iconType: 'primary', iconOnly: true, label: 'Choose date', attrs: 'aria-haspopup="dialog" data-sdk-date=""'})}<input class="sdk-date-field" type="date" tabindex="-1" aria-hidden="true" value="${esc(spec.iso || '')}"></span></span></div>`;
  const withFmt = Object.assign({}, spec, {description: spec.description});
  return labelBlock(withFmt, id, box, spec.extra).replace('</label>', `</label><span id="${id}-f" class="sr-only">Date format: ${esc(fmt)}</span>`);
}

// fieldset(spec) — SdkInputFieldset, a legend over a group (radios, checkboxes): spec.legend, required, inner
//   (html), description, error / errors, titleRight (html at the legend's right), id. radio({group: true})
//   rows in inner are wrapped in the kit's group block (radioGroup) unless already so: the fieldset is a
//   flex column with an 8px gap, and bare rows sat 8 apart as separate boxes (Switch device eval, 2026-10-14)
function fieldset(spec = {}) {
  const id = spec.id || nextId('w-fs');
  const errors = [].concat(spec.errors || spec.error || []).filter(Boolean);
  const inner = spec.inner || '';
  const body = /class="RadioCheckContainer[^"]*\bisGroup\b/.test(inner) && !inner.includes('sdk-base-container__container') ? radioGroup(inner) : inner;
  return `<fieldset class="${cls('sdk-input-fieldset', spec.extra)}" aria-labelledby="${id}-l" aria-required="${spec.required ? 'true' : 'false'}">`
    + `<div class="sdk-input-fieldset__itemText"><div class="flex flex-row justify-between"><legend class="sdk-text sdk-text__body" id="${id}-l">${spec.required ? `<span>${esc(spec.legend)}<span class="sdk-span-required" aria-hidden="true">&nbsp;*</span></span>` : esc(spec.legend || '')}</legend>${spec.titleRight || ''}</div>${spec.description ? `<div>${esc(spec.description)}</div>` : ''}</div>`
    + body + `<div id="${id}-e" class="sdk-input-fieldset__errors" role="alert" aria-atomic="true">${errors.map(e => text({variant: 'danger', text: e})).join('')}</div></fieldset>`;
}

// radioGroup(rows) — RadioCheckContainerGroup, the block that joins radio({group: true}) rows into one framed
//   list: the story's <div class="sdk-base-container__container"> (a flex column, no gap) around the rows —
//   an array or one html string. fieldset() wraps its inner in it by itself; use this for a group elsewhere
function radioGroup(rows) {
  return `<div class="sdk-base-container__container">${Array.isArray(rows) ? rows.join('') : (rows || '')}</div>`;
}

// checkbox(spec) — SdkInputCheckbox: a real <input type=checkbox> under the kit's box, with spec.label beside it
//   (none renders the bare box, SdkCheckboxCommon), checked, disabled, danger, id, name, value. Live by itself
function checkbox(spec = {}) {
  const id = spec.id || nextId('w-cb');
  const box = `<label data-s-checkbox="" class="sdk-checkbox__wrapper" for="${id}"><input data-s-checkbox="" id="${id}" class="sdk-checkbox__input" type="checkbox"${spec.name ? ` name="${esc(spec.name)}"` : ''}${spec.value != null ? ` value="${esc(spec.value)}"` : ''}${spec.checked ? ' checked' : ''}${spec.disabled ? ' disabled' : ''}>`
    + `<span data-s-checkbox="" class="${cls('sdk-checkbox', spec.danger ? 'danger' : 'default')}">${icon('check', {extra: 'sdk-checkbox__icon'})}</span></label>`;
  if (!spec.label) return box;
  return `<label class="${cls(spec.extra)}" style="display:flex;align-items:center;cursor:pointer;gap:8px">${box}${text({html: spec.html, text: spec.label, tag: 'span'})}</label>`;
}

// radio(spec) — SdkInputRadio, the kit's row with the label at the left and the radio at the right (44 high):
//   spec.label, name, value, checked, disabled, danger (the error frame), icon (a name or <svg…>, before the
//   label), group (the rows join into one framed list — RadioCheckContainerGroup), id. Live by itself; the
//   row's isActive class (the kit's checked state) follows the picked input across its name group — script
function radio(spec = {}) {
  const id = spec.id || nextId('w-rd');
  return `<label data-s-radio-check-container="" class="${cls('RadioCheckContainer', spec.checked && 'isActive', spec.disabled && 'isDisabled', spec.danger && 'isError', spec.group && 'isGroup', spec.extra)}" for="${id}">`
    + (spec.icon ? icon(spec.icon, {size: 'small'}) : '')
    + `<div class="sdk-text sdk-text__body sdk-input-radio__label">${spec.html != null ? spec.html : esc(spec.label)}</div>`
    + `<label data-s-radio="" class="sdk-radio__wrapper" for="${id}"><input data-s-radio="" id="${id}" class="sdk-radio__input" type="radio"${spec.checked ? ' checked' : ''}${spec.disabled ? ' disabled' : ''} name="${esc(spec.name || 'radio')}" value="${esc(spec.value == null ? spec.label : spec.value)}"><span data-s-radio="" class="${cls('sdk-radio', spec.danger ? 'danger' : 'default')}"></span></label></label>`;
}

// toggle(spec) — SdkToggle, the switch: spec.checked, disabled, id, label (aria-label), name. Flipped by the script
function toggle(spec = {}) {
  const st = spec.checked ? 'checked' : 'unchecked';
  return `<button role="switch" type="button" aria-checked="${spec.checked ? 'true' : 'false'}" aria-required="false" data-state="${st}" class="${cls('sdk-toggle', spec.extra)}" value="on"${spec.id ? ` id="${esc(spec.id)}"` : ''}${spec.name ? ` name="${esc(spec.name)}"` : ''}${spec.label ? ` aria-label="${esc(spec.label)}"` : ''}${spec.disabled ? ' disabled data-disabled=""' : ''}><span data-state="${st}" class="sdk-toggle__thumb"></span></button>`;
}

// choiceList(spec) — SdkChoiceList, the document-type list: spec.items [{title, caption, icon (a name or
//   <svg…>), id, attrs}], or (one item separated from the rest) with the kit's "or" separator between them
function choiceList(spec = {}) {
  const item = it => `<div class="sdk-choice-list__choice-item-wrapper"><button type="button" class="sdk-choice-list__choice-item" aria-label="${esc(it.title)}${it.caption ? '. ' + esc(it.caption) : ''}"${it.id ? ` id="${esc(it.id)}"` : ''}${it.attrs ? ' ' + it.attrs : ''}>`
    + iconBlock({icon: it.icon, size: 'medium'})
    + `<span class="sdk-choice-list__info-block">${text({variant: 'header3', tag: 'span', text: it.title})}${it.caption ? text({variant: 'caption', tag: 'span', text: it.caption}) : ''}</span>`
    + `<span class="sdk-choice-list__chevron-icon-wrapper">${icon('chevron-right')}</span></button></div>`;
  const items = spec.items || [];
  const sep = spec.or == null ? '' : separator({label: spec.or === true ? 'or' : spec.or});
  return `<div class="${cls('sdk-choice-list', spec.extra)}">${items.map((it, i) => (i && sep ? sep : '') + item(it)).join('')}</div>`;
}

// link(spec) — SdkLink, an inline <a>: spec.href, label, underline (true by default), target, id
function link(spec = {}) {
  return `<a class="${cls('sdk-link', spec.underline !== false && 'sdk-link__underline', spec.extra)}"${spec.id ? ` id="${esc(spec.id)}"` : ''} href="${esc(spec.href || '#')}"${spec.target ? ` target="${esc(spec.target)}" rel="noopener"` : ''}>${esc(spec.label)}</a>`;
}

// separator(spec) — SdkSeparator: a rule, with spec.label ("or") between two halves when given
function separator(spec = {}) {
  return `<div class="${cls('sdk-separator', spec.extra)}"><hr class="sdk-separator__horizontal">${spec.label ? text({text: spec.label}) + '<hr class="sdk-separator__horizontal">' : ''}</div>`;
}

// tag(spec) — SdkTag, the small status pill: spec.label, type 'default' | 'success' | 'info' | 'warning' |
//   'error' | 'disabled', closable (the kit's cross), extra
function tag(spec = {}) {
  return `<div data-s-tag="" class="${cls('sdk-text sdk-text__caption SdkTag', 'type-' + (spec.type || 'default'), spec.closable && 'closable', spec.extra)}">${esc(spec.label)}`
    + (spec.closable ? `<button data-s-tag="" type="button" class="close-button" aria-label="Remove">${icon('close', {type: 'interactive'})}</button>` : '') + `</div>`;
}

// loader(spec) — SdkLoader, the spinning ring: spec.type 'info' (default) | 'primary' | 'success' | 'danger' |
//   'warning' | 'white', size 'small' (24) | 'extra-small' | 'medium' | 'large'. It spins — rule 5's one
//   exception, a loading state the brief asks for; off under prefers-reduced-motion by the kit's own rule
function loader(spec = {}) {
  return icon('loading', {type: spec.type || 'info', size: spec.size || 'small', extra: 'spin'});
}

// dotsLoader(spec) — SdkDotsLoader, the three dots a loading button shows: spec.color 'white' (default) |
//   'blue' | 'success' | 'danger' | 'warning'
function dotsLoader(spec = {}) {
  return `<div class="${cls('sdk-loader', 'sdk-loader__loaderColor' + cap(spec.color || 'white'), 'sdk-dots-loader')}"><span></span><span></span><span></span></div>`;
}

// alert(spec) — SdkAlert, the inline message block: spec.type 'info' | 'warning' | 'danger' | 'success' |
//   'neutral', title, text (or html), icon (a name; the kit's by type when omitted, false for none), action
//   (html under the text: a button()), id
function alert(spec = {}) {
  const type = spec.type || 'info';
  const id = spec.id || nextId('w-al');
  const byType = {info: 'alert-circle', warning: 'alert-circle', danger: 'alert-circle', success: 'check-circle', neutral: 'shield-check'};
  const ic = spec.icon === false ? '' : icon(spec.icon || byType[type], {type, extra: 'sdk-alert__alertIcon'});
  return `<div class="${cls('sdk-alert', 'sdk-alert__type' + cap(type), spec.extra)}" role="alert" data-type="${type}"${spec.title ? ` aria-labelledby="${id}-title"` : ''} aria-describedby="${id}-text">${ic}`
    + `<div class="sdk-alert__content"><div class="sdk-alert__textBlock">${spec.title ? text({variant: 'header3', tag: 'h3', text: spec.title, id: id + '-title'}) : ''}${text({tag: 'p', text: spec.text, html: spec.html, id: id + '-text'})}</div>${spec.action ? `<div>${spec.action}</div>` : ''}</div></div>`;
}

// toast(spec) — SdkToast, an alert() in the kit's toast wrapper with its close button; the page positions it
//   (the kit's toast lives in a portal at the widget's top). spec as alert(), close (true by default)
function toast(spec = {}) {
  const inner = alert(Object.assign({icon: false}, spec)).replace(/<\/div><\/div>$/, '</div>'
    + (spec.close === false ? '' : `<div class="sdk-toast__closeButtonContainer"><button aria-label="Close" class="sdk-toast__closeButton" type="button" data-sdk-close="">${icon('close', {interactive: true})}</button></div>`) + '</div>');
  return `<div class="${cls('sdk-toast', spec.extra)}" style="--toast-bind1: translateY(0px);">${inner}</div>`;
}

// card(spec) — SdkCard, the bordered block with a header: spec.title, inner (html), status 'normal' | 'success'
//   | 'warning', icon (a name, at the header's left), counter (a number at the right), collapsible (an
//   accordion: <details>, open by default unless collapsed), noPadding
function card(spec = {}) {
  const head = `<header class="sdk-card__header">${spec.icon ? icon(spec.icon, {extra: 'sdk-card__icon'}) : ''}${text({variant: 'header3', tag: 'h2', text: spec.title, extra: 'sdk-card__headerText'})}`
    + (spec.counter != null ? `<span class="sdk-card__counter">${esc(spec.counter)}</span>` : '')
    + (spec.collapsible ? icon('chevron-down', {extra: 'sdk-card__icon sdk-card__chevron'}) : '') + `</header>`;
  const main = `<div class="sdk-card__main"><div class="${cls('sdk-card__content', spec.noPadding && 'sdk-card__noPadding')}">${spec.inner || ''}</div></div>`;
  if (spec.collapsible) return `<details class="${cls('sdk-card', spec.status && 'sdk-card__' + spec.status, spec.extra)}" data-status="${spec.status || 'normal'}"${spec.collapsed ? '' : ' open'}><summary class="sdk-card__header" style="list-style:none">${head.replace(/^<header[^>]*>|<\/header>$/g, '')}</summary>${main}</details>`;
  return `<article class="${cls('sdk-card', spec.status && 'sdk-card__' + spec.status, spec.extra)}" data-status="${spec.status || 'normal'}" open="false">${head}${main}</article>`;
}

// tips(spec) — SdkTips, the list with an icon per row: spec.title (header2), items [{html | text, icon (a name),
//   iconType 'danger' | 'success' | 'interactive' | 'primary', right (a name: an icon at the row's end)}], id
function tips(spec = {}) {
  const id = spec.id || nextId('w-tips');
  return `<div class="${cls(spec.extra)}">${spec.title ? text({variant: 'header2', tag: 'h2', text: spec.title, extra: 'sdk-tips__header', id}) : ''}<ul${spec.title ? ` aria-labelledby="${id}"` : ''} class="sdk-tips">`
    + (spec.items || []).map(it => `<li class="sdk-text sdk-text__body sdk-tips__row"><div class="sdk-tips__icon">${icon(it.icon || (it.iconType === 'success' ? 'check-circle' : it.iconType === 'danger' ? 'cross-circle' : 'alert-circle'), {type: it.iconType || 'primary'})}</div><div><div class="sdk-tips__content"><div data-s-html="" class="html">${it.html != null ? it.html : esc(it.text)}</div>${it.right ? icon(it.right, {type: 'interactive', extra: 'sdk-tips__rightIcon'}) : ''}</div></div></li>`).join('')
    + `</ul></div>`;
}

// validationStep(spec) — SdkValidationStep, a row of the steps list on a status screen: spec.title, status
//   'default' | 'success' | 'warning' | 'error' (the plate), tag {label, type} (the pill at the right), icon
//   (a name in the plate), description (a second line), divider
function validationStep(spec = {}) {
  const st = spec.status || 'default';
  return `<li class="${cls('sdk-validation-step', spec.divider && 'sdk-validation-step__contentWithDivider', spec.extra)}"><div class="sdk-validation-step__iconContainer"><div class="${cls('sdk-validation-step__iconBlock', st !== 'default' && 'sdk-validation-step__iconBlock' + cap(st))}">${spec.icon ? icon(spec.icon, {type: st === 'default' ? 'primary' : st, extra: 'sdk-validation-step__icon'}) : ''}</div></div>`
    + `<div class="sdk-validation-step__content"><div class="sdk-validation-step__summary"><div class="sdk-validation-step__header"><div class="sdk-validation-step__headerContent"><span class="sdk-validation-step__headerTitle">${esc(spec.title)}</span>${spec.tag ? tag(Object.assign({extra: 'sdk-validation-step__headerTag'}, spec.tag)) : ''}</div></div>${spec.description ? `<div class="sdk-validation-step__description">${esc(spec.description)}</div>` : ''}</div></div></li>`;
}

// splashScreen(spec) — SdkSplashScreen, a status screen: spec.icon (a name or <svg…> in the kit's 72 slot;
//   iconType 'success' | 'danger' | …) or illustration (html in the icon's place at its own size: the frame's
//   export as an <svg>/<img> — the General flow's Verified draws 172 and no icon — or illustration({svg}) for
//   the kit's grey plate), title, message (text or html), buttons [html…] (in a flat footer; none, no footer
//   and the room 16), tips (html under the message), bottom, bottomNarrow, narrow (content()'s room for the
//   footer: 72 with a button, 16 without). The kit centres the content in the widget's height by itself
//   (sdk-splash-screen is a centred flex column that fills the content). Returns the whole container()
function splashScreen(spec = {}) {
  const art = spec.illustration ? spec.illustration
    : spec.icon ? icon(spec.icon, {type: spec.iconType || 'success', size: 'large', extra: 'sdk-splash-screen__icon'}) : '';
  const body = `<div class="${cls('sdk-content__SdkContentInner sdk-splash-screen', spec.extra)}">` + art
    + `<div class="sdk-splash-screen__header">${text({variant: 'header1', tag: 'h1', text: spec.title})}</div>`
    + text({text: spec.message, html: spec.html, extra: 'sdk-splash-screen__message'})
    + (spec.tips ? `<div class="sdk-splash-screen__tips">${spec.tips}</div>` : '') + `</div>`;
  const withButtons = spec.buttons && spec.buttons.length;
  const r = room(spec.bottom == null ? (withButtons ? 72 : 16) : spec.bottom, spec.bottomNarrow, spec.narrow);
  const sec = `<section data-testid="sdk-content" class="${cls('sdk-content', r.cls)}">${r.style}${body}</section>`;
  const foot = spec.buttons && spec.buttons.length ? footer({flat: true, html: `<div class="sdk-splash-screen__footerButtons">${spec.buttons.join('')}</div>`}) : '';
  return container(sec + foot);
}

// tabs(spec) — SdkTabs, the toggle group: spec.items [{label, value, disabled}] or strings, active (a value or
//   an index), label (aria-label), id. The script moves the selection
function tabs(spec = {}) {
  const items = (spec.items || []).map((it, i) => typeof it === 'string' ? {label: it, value: String(i + 1)} : Object.assign({value: String(i + 1)}, it));
  const act = typeof spec.active === 'number' ? items[spec.active] && items[spec.active].value : (spec.active == null ? items[0] && items[0].value : String(spec.active));
  return `<div aria-label="${esc(spec.label || 'Tabs')}" class="${cls('sdk-tabs', spec.extra)}" tabindex="0" dir="ltr" role="group"${spec.id ? ` id="${esc(spec.id)}"` : ''} style="outline: none;">`
    + items.map(it => `<button type="button" aria-pressed="${it.value === act ? 'true' : 'false'}" data-state="${it.value === act ? 'on' : 'off'}" class="sdk-tabs__ToggleGroupItem"${it.disabled ? ' data-disabled="" disabled' : ''} tabindex="-1"${it.value === act ? ' data-active=""' : ''} value="${esc(it.value)}">${text({extra: 'sdk-tabs__ToggleGroupItemText', text: it.label})}</button>`).join('')
    + `</div>`;
}

// modal(spec) — SdkModal, the dialog over the SDK page. Its host is the page's column — the shell's .ws-column
//   (position: relative), the SDK's root: the top bar, the widget, the Powered-by line — so it goes at the END of
//   the column, after the whitelabel line, never inside container(). The overlay and the dialog are absolute,
//   inset 0, with the kit's 8px overlay margin (0 at ≤ 726): in the column the tint dims the bar, the widget and
//   the Powered-by line as the frames draw it (the tint wrapper from y 4 over all three); inside container() it
//   stopped at the widget's edges, the bar stayed undimmed and the dialog sat 8 inside the frame with white gaps
//   above and below (the 1440 prototypes of runs 16 and 17, 2026-10-14). A page of several screens hosts its
//   dialogs once, at the column's end — a screen wrapper is not the host. The kit's 8 against the frame's 4 is a
//   ledger line. spec.id (the trigger names it: a button with data-sdk-open="#id"
//   opens it, its cross, the overlay, Esc and any data-sdk-close inside close it — script), title, subtitle,
//   inner (html), footer [html…] (buttons, one under another), open (rendered open), noHeader, closeLabel.
//   It slides up for 0.4 s: a headless check of the open state takes statecheck.sh --no-anim or --device
//   (real time) — under virtual time it stays at the widget's bottom and --hits says "not on screen".
//   The UI kit's Figma variant "Modal / Full / Desktop | Mobile": it fills the column at EVERY width (height
//   100% − 16, min 440); at 726 and under it only loses its 8 inset and its bottom corners. Pick it by the frame's
//   instance name, never by width: "Modal / Full / *" → modal(), "Modal / Bottom sheet / *" → bottomSheet()
function modal(spec = {}) {
  const id = spec.id || nextId('w-modal');
  const open = spec.open ? 'open' : 'closed';
  const hidden = spec.open ? '' : ' hidden';
  return `<div data-state="${open}" class="sdk-modal" data-sdk-overlay="${esc(id)}"${hidden} style="pointer-events: auto; position: absolute;"></div>`
    + `<div data-dismissable-layer="" tabindex="-1" class="${cls('sdk-modal__DialogContentContainer', spec.noHeader && 'sdk-modal__noHeader', spec.extra)}" aria-modal="true" id="${esc(id)}" role="dialog"${spec.subtitle ? ` aria-describedby="${esc(id)}-d"` : ''}${spec.title ? ` aria-labelledby="${esc(id)}-t"` : ''} data-state="${open}"${hidden} style="position: absolute; pointer-events: auto;"><div class="sdk-modal__DialogContent">`
    + (spec.noHeader ? '' : `<header class="sdk-modal__DialogHeader"><div class="sdk-modal__HeaderRow"><div class="sdk-modal__HeaderWrapper">${spec.title ? text({variant: 'header1', tag: 'h1', text: spec.title, extra: 'sdk-modal__DialogTitle', id: id + '-t'}) : ''}${spec.subtitle ? text({text: spec.subtitle, extra: 'sdk-modal__DialogSubtitle', id: id + '-d'}) : ''}</div>`
      + button({type: 'plain', icon: 'close', iconType: 'primary', iconOnly: true, label: spec.closeLabel || 'Close', extra: 'sdk-modal__closeButton', attrs: 'data-sdk-close=""'}) + `</div></header>`)
    + `<main class="sdk-modal__DialogBody"><div class="sdk-modal__DialogBodyContent">${spec.inner || ''}</div></main>`
    + (spec.footer && spec.footer.length ? `<div class="sdk-modal__footer"><div class="sdk-modal__footerContent"><div class="sdk-modal__footerContentInner">${spec.footer.join('')}</div></div></div>` : '')
    + `</div></div>`;
}

// bottomSheet(spec) — SdkBottomSheet, the dialog sized by its content that rises from the page's bottom — at
//   EVERY width: the UI kit's Figma variant "Modal / Bottom sheet / Desktop | Mobile" (the consent, the
//   address-search sheet of the 2026-10-05 frames). Not "the modal on a phone": a frame instance named
//   "Modal / Bottom sheet / *" is bottomSheet() at 1440 too. spec as modal() — id, title (a page title
//   in the sheet's header), inner, footer [html…], open, noHeader, label (aria-label, 'Bottom sheet').
//   It slides up as modal() does: check the open state with statecheck.sh --no-anim or --device. Above 726
//   it sits 8 in with every corner rounded; at 726 and under it loses the inset and the bottom corners (the
//   kit's rule). Hosted as modal() is — at the end of the page's column, after the whitelabel line, never inside
//   container() — so the frame's sheet over the whole page with the top bar dimmed is what renders; its bottom
//   sits 8 above the column's bottom (0 at ≤ 726) where the frame draws 4: a ledger line, not a page rule
function bottomSheet(spec = {}) {
  const id = spec.id || nextId('w-sheet');
  const open = spec.open ? 'open' : 'closed';
  const hidden = spec.open ? '' : ' hidden';
  return `<div data-state="${open}" class="sdk-bottom-sheet" data-sdk-overlay="${esc(id)}"${hidden} style="pointer-events: auto;"></div>`
    + `<div data-dismissable-layer="" tabindex="-1" class="${cls('sdk-bottom-sheet__DialogContentContainer', (spec.noHeader || !spec.title) && 'sdk-bottom-sheet__noHeader', spec.extra)}" aria-label="${esc(spec.label || 'Bottom sheet')}" id="${esc(id)}" role="dialog"${spec.title ? ` aria-labelledby="${esc(id)}-t"` : ''} data-state="${open}"${hidden} style="pointer-events: auto;"><div class="sdk-bottom-sheet__DialogContent">`
    + (spec.title ? `<header class="sdk-bottom-sheet__DialogHeader"><div class="sdk-bottom-sheet__HeaderRow"><div class="sdk-bottom-sheet__HeaderWrapper">${pageTitle({title: spec.title, subtitle: spec.subtitle, id: id + '-t'})}</div>`
      + (spec.close ? button({type: 'plain', icon: 'close', iconType: 'primary', iconOnly: true, label: 'Close', extra: 'sdk-bottom-sheet__closeButton', attrs: 'data-sdk-close=""'}) : '') + `</div></header>` : '')
    + `<main class="sdk-bottom-sheet__DialogBody"><div class="sdk-bottom-sheet__DialogBodyContent">${spec.inner || ''}</div></main>`
    + (spec.footer && spec.footer.length ? `<div class="sdk-bottom-sheet__footer"><div class="sdk-bottom-sheet__footerContent"><div class="sdk-bottom-sheet__footerContentInner">${spec.footer.join('')}</div></div></div>` : '')
    + `</div></div>`;
}

// cameraFrame(spec) — the camera step's widget, built from the Organisms component "POI camera Mobile | Desktop"
//   (no kit story: VERSION.md § Camera frame): it fills the widget at every width — the camera's dark plate with
//   8 padding, the stage (flex 1, the white 10% tint, radius 24), the caption under it, the bar of three buttons.
//   Goes in container() after header(), with no content() and no footer(). spec.caption ('ID card front', the
//   kit's header2 in white), loading (the kit's dots loader centred in the stage), inner (the stage's content:
//   the baked picture as an <img>, which fills the stage with object-fit cover, or any html; it sits under the
//   loader), gallery / shutter / flip — each {id, disabled, label} or false for none (all three by default; the
//   gallery and flip inert unless the page wires them), id, extra. Only the live picture is a plate, never the box
//   overlay: the state drawn over the whole frame (the General flow's "Uploading": a tint rgba(0,0,0,.5) with a 16px
//   backdrop blur over the stage, the caption and the bar) — {loader: true, title, text} for the kit's ring
//   (loader({type: 'white', size: 'extra-large'}), 40 as the frame's "Icon / Extra Large / Loading"), a header1
//   title and a body line, 16 apart, centred; or html. The blur is live, so the picture under it stays sharp
function cameraFrame(spec = {}) {
  const btn = (key, label, inner, kind) => {
    const b = spec[key] === undefined ? {} : spec[key];
    if (b === false) return `<span class="w-camera__slot" aria-hidden="true"></span>`;
    return `<button type="button" class="${cls('w-camera__button', 'w-camera__button--' + kind)}"${b.id ? ` id="${esc(b.id)}"` : ''} aria-label="${esc(b.label || label)}"${b.disabled ? ' disabled aria-disabled="true"' : ''}>${inner}</button>`;
  };
  const img = s => /^\s*<img\b/.test(s || '') ? s.replace(/<img\b/, '<img class="w-camera__picture"') : (s || '');
  const ov = spec.overlay == null ? '' : typeof spec.overlay === 'string' ? spec.overlay
    : (spec.overlay.loader ? loader({type: 'white', size: 'extra-large', extra: 'w-camera__overlayLoader'}) : '')
      + (spec.overlay.title ? text({variant: 'header1', tag: 'h2', text: spec.overlay.title}) : '')
      + (spec.overlay.text ? text({text: spec.overlay.text, html: spec.overlay.html}) : '');
  return `<div class="${cls('w-camera', spec.extra)}"${spec.id ? ` id="${esc(spec.id)}"` : ''}>`
    + `<div class="w-camera__stage">${img(spec.inner)}${spec.loading ? dotsLoader({color: 'white'}) : ''}</div>`
    + (spec.caption ? `<div class="w-camera__message">${text({variant: 'header2', text: spec.caption})}</div>` : '')
    + `<div class="w-camera__bar"><div class="w-camera__buttons">`
    + btn('gallery', 'Upload from gallery', icon('image', {size: 'small', type: 'white'}), 'additional')
    + btn('shutter', 'Take a photo', '<span class="w-camera__disc"></span>', 'shutter')
    + btn('flip', 'Switch camera', icon('rotate', {size: 'small', type: 'white'}), 'additional')
    + `</div></div>` + (ov ? `<div class="w-camera__overlay">${ov}</div>` : '') + `</div>`;
}

// sumsubIdBlock(spec) — the "Get verified faster with Sumsub ID" block on Welcome, built from the UI kit's Figma
//   component "Welcome block" (no kit story: VERSION.md § Sumsub ID block): a 1px frame, radius 24, padding 16, the
//   gradient over white; a row of the kit's toggle (checked, no label) and a text column — the title row (the green
//   "Icon / Small / Sumsub ID", 20 in a 24 wrapper, and a header3 title) and the caption with its link. spec.title
//   ('Get verified faster with Sumsub ID'), text (the caption), more ({label, href} — 'Learn more' by default — or
//   false), checked (true by default), email ({placeholder, id, value} or false: the variant with the kit's input
//   under the row, indented 46 to the text column), id, toggleId, linkId, extra. It fills the column it sits in
function sumsubIdBlock(spec = {}) {
  const title = spec.title == null ? 'Get verified faster with Sumsub ID' : spec.title;
  const caption = spec.text == null ? 'Securely save and reuse your verified data for free. ' : spec.text;
  const more = spec.more === false ? null : Object.assign({label: 'Learn more', href: '#'}, spec.more || {});
  const em = spec.email ? Object.assign({placeholder: 'Enter your email to continue', type: 'email', autocomplete: 'email'}, spec.email === true ? {} : spec.email) : null;
  return `<div class="${cls('w-sumsub-id', spec.extra)}"${spec.id ? ` id="${esc(spec.id)}"` : ''}><div class="w-sumsub-id__top">`
    + toggle({checked: spec.checked !== false, id: spec.toggleId, label: title})
    + `<div class="w-sumsub-id__text"><div class="w-sumsub-id__title"><span class="w-sumsub-id__icon">${icon('sumsub-id-green')}</span>${text({variant: 'header3', text: title})}</div>`
    + `<div class="sdk-text sdk-text__caption w-sumsub-id__sub">${esc(caption)}${more ? link({href: more.href, label: more.label, underline: more.underline === true, id: spec.linkId || more.id}) : ''}</div></div></div>`
    + (em ? `<div class="w-sumsub-id__email">${inputField(em)}</div>` : '') + `</div>`;
}

// dropdownMenu(spec) — SdkDropdownMenu, the menu a trigger opens (a popper under it): spec.id (the trigger carries
//   data-sdk-open="#id"; the page positions the menu, the kit does not), label (the caption at the top), items
//   [{label, selected, danger, id, attrs}], open
function dropdownMenu(spec = {}) {
  const id = spec.id || nextId('w-menu');
  return `<div class="${cls('sdk-dropdown-menu', spec.extra)}" id="${esc(id)}" role="menu" aria-orientation="vertical" data-orientation="vertical" data-state="${spec.open ? 'open' : 'closed'}"${spec.open ? '' : ' hidden'} dir="ltr" style="outline: none; pointer-events: auto;">`
    + (spec.label ? text({variant: 'caption', text: spec.label, extra: 'sdk-dropdown-menu__DropdownMenuLabel'}) : '')
    + (spec.items || []).map(it => `<div role="menuitem" tabindex="-1" class="${cls('sdk-dropdown-menu__DropdownMenuItem', it.selected && 'sdk-dropdown-menu__DropdownMenuItemSelected', it.danger && 'sdk-dropdown-menu__DropdownMenuItemDanger')}"${it.id ? ` id="${esc(it.id)}"` : ''}${it.attrs ? ' ' + it.attrs : ''}>${text({text: it.label, extra: 'sdk-dropdown-menu__label'})}</div>`).join('')
    + `</div>`;
}

module.exports = {icon, flag, text, button, header, stepsPopup, container, content, footer, pageTitle, logoBlock, iconBlock, illustration,
  inputField, selectField, textareaField, phoneField, dateField, fieldset, checkbox, radio, radioGroup, toggle, choiceList, link, separator, tag,
  loader, dotsLoader, alert, toast, card, tips, validationStep, splashScreen, tabs, modal, bottomSheet, cameraFrame, sumsubIdBlock, dropdownMenu};

// ---- the stylesheet: Manrope embedded (the kit's family; Google Fonts' latin and cyrillic files, SIL Open
// Font License 1.1, which permits bundling), then the kit's CSS as the snapshot took it
const FONTS = path.join(__dirname, 'fonts');
const face = (file, range) => `@font-face{font-family:"Manrope";font-style:normal;font-weight:200 800;font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, file)).toString('base64')}) format("woff2-variations");unicode-range:${range}}`;
module.exports.css = face('manrope-cyrillic.woff2', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116')
  + face('manrope-latin.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')
  + '\n' + fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8')
  // the prototype's own: the steps popup sits under the header's ring, and a hidden one is hidden
  + '\n.sdk-header__progress{position:relative}.sdk-header__progress[data-sdk-steps-trigger]{cursor:pointer}.sdk-steps-popup__container[hidden]{display:none}\n'
  // cameraFrame(): the Organisms component's layout in the kit's camera variables (VERSION.md § Camera frame)
  + '.w-camera{position:relative;flex:1 1 0;min-height:0;width:100%;box-sizing:border-box;display:flex;flex-direction:column;padding:var(--components-camera-spacing);background:var(--components-camera-camera-background);border-radius:var(--components-widget-widget-border-radius)}'
  + '.w-camera__stage{flex:1 0 0;min-height:0;width:100%;box-sizing:border-box;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:16px 24px;background:rgba(255,255,255,.1);border-radius:var(--components-camera-border-radius)}'
  + '.w-camera__picture{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.w-camera__stage>.sdk-dots-loader{position:relative}'
  + '.w-camera__message{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px 8px;text-align:center}.w-camera__message .sdk-text{color:var(--semantic-text-white-normal)}'
  + '.w-camera__bar{padding:8px 0;display:flex}.w-camera__buttons{flex:1 0 0;display:flex;align-items:center;justify-content:center;gap:48px}'
  + '.w-camera__button{margin:0;border:0;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;box-sizing:border-box;-webkit-tap-highlight-color:transparent}.w-camera__button:disabled{cursor:default}'
  + '.w-camera__button--additional,.w-camera__slot{width:48px;height:48px;border-radius:32px}.w-camera__button--additional{padding:12px;background:var(--components-button-camera-additional-white-background-normal);color:var(--components-button-camera-additional-icon-normal)}'
  + '.w-camera__button--additional:hover{background:var(--components-button-camera-additional-white-background-hover)}.w-camera__button--additional:disabled{background:var(--components-button-camera-additional-white-background-disabled);color:var(--components-button-camera-additional-icon-disabled)}'
  + '.w-camera__button--shutter{width:56px;height:56px;border-radius:32px;background:transparent;border:3px solid var(--components-button-camera-action-photo-border-normal)}'
  + '.w-camera__disc{width:46px;height:46px;border-radius:50%;background:var(--components-button-camera-action-photo-background-normal)}'
  + '.w-camera__button--shutter:disabled{border-color:var(--components-button-camera-action-photo-border-disabled)}.w-camera__button--shutter:disabled .w-camera__disc{background:var(--components-button-camera-action-photo-background-disabled)}'
  + '.w-camera__button:focus-visible{outline:2px solid var(--semantic-border-white-normal);outline-offset:2px}'
  /* the General flow's "Uploading" tint (I1:7545;14201:45616;1:7541): black .5 with a 16px backdrop blur over the whole frame */
  + '.w-camera__overlay{position:absolute;inset:0;z-index:2;border-radius:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;box-sizing:border-box;text-align:center;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}'
  + '.w-camera__overlay .sdk-text{color:var(--semantic-text-white-normal);margin:0}.w-camera__overlay .sdk-text__header1+.sdk-text__body{margin-top:-8px}\n'
  // sumsubIdBlock(): the UI kit's Figma "Welcome block" (VERSION.md § Sumsub ID block) — the frame, the gradient over
  // white, the row 12 apart, the text column 4 apart, the icon 20 in its 24 wrapper (2 right, top, bottom), the toggle
  // (the kit's 34×20 against the component's 34×24) 2 down so its centre is the title line's, the input 46 in. Figma's
  // stroke is inside: the content sits 16 from the outer edge, so the padding is 15 inside the 1px border (80 high, not 82)
  + '.w-sumsub-id{width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;padding:15px;border:1px solid var(--semantic-border-primary-subtlest-normal);border-radius:var(--components-sumsub-id-intrusive-block-border-radius,24px);background:linear-gradient(108deg,rgba(236,237,242,.2) 0%,rgba(236,237,242,.6) 100%),#fff}'
  + '.w-sumsub-id__top{display:flex;gap:12px;align-items:flex-start}.w-sumsub-id__top>.sdk-toggle{flex:none;margin-top:2px}'
  + '.w-sumsub-id__text{display:flex;flex-direction:column;gap:4px;flex:1 1 0;min-width:0}.w-sumsub-id__title{display:flex;gap:4px;align-items:flex-start}'
  + '.w-sumsub-id__icon{display:flex;align-items:center;flex:none;height:24px;padding:2px 2px 2px 0;box-sizing:border-box}'
  + '.w-sumsub-id .w-sumsub-id__icon>svg.icon[data-s-icon]{display:block;width:20px;height:20px}.w-sumsub-id__email{padding-left:46px}\n';

// ---- the page script: what a story's own Vue did and the markup alone cannot
module.exports.script = `(function(){
  var up = function (el, sel) { return el && el.closest ? el.closest(sel) : null; };
  document.addEventListener('click', function (e) {
    // the switch flips its state; a real <input> under the checkbox and the radio needs nothing
    var sw = up(e.target, '.sdk-toggle');
    if (sw) { if (sw.disabled) return; var on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', on ? 'true' : 'false'); sw.setAttribute('data-state', on ? 'checked' : 'unchecked');
      var th = sw.querySelector('.sdk-toggle__thumb'); if (th) th.setAttribute('data-state', on ? 'checked' : 'unchecked'); return; }
    // the tabs: one pressed at a time
    var tb = up(e.target, '.sdk-tabs__ToggleGroupItem');
    if (tb) { if (tb.disabled) return; var g = up(tb, '.sdk-tabs'); if (!g) return;
      g.querySelectorAll('.sdk-tabs__ToggleGroupItem').forEach(function (b) { var on = b === tb;
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('data-state', on ? 'on' : 'off'); if (on) b.setAttribute('data-active', ''); else b.removeAttribute('data-active'); });
      return; }
    // the password field's eye: reveal, hide
    var eye = up(e.target, '[data-sdk-eye]');
    if (eye) { var inp = up(eye, '.sdk-input__inputContainer') && up(eye, '.sdk-input__inputContainer').querySelector('input');
      if (inp) { var show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); } return; }
    // the date field's calendar button opens the native picker
    var dt = up(e.target, '[data-sdk-date]');
    if (dt) { var nd = up(dt, '.sdk-date-field__picker') && up(dt, '.sdk-date-field__picker').querySelector('.sdk-date-field');
      if (nd) { try { nd.showPicker(); } catch (err) { nd.click(); } } return; }
    // the header's ring opens the steps popup; a click elsewhere closes it
    var tr = up(e.target, '[data-sdk-steps-trigger]');
    document.querySelectorAll('.sdk-steps-popup__container').forEach(function (p) { var own = tr && tr.contains(p);
      if (own) { p.hidden = !p.hidden; tr.setAttribute('aria-expanded', p.hidden ? 'false' : 'true'); }
      else if (!p.hidden && !p.contains(e.target)) { p.hidden = true; var t = up(p, '[data-sdk-steps-trigger]'); if (t) t.setAttribute('aria-expanded', 'false'); } });
    // a dialog: data-sdk-open="#id" opens it with its overlay; its cross, a data-sdk-close inside it or a
    // click on the overlay closes it
    var dlg = function (id, show) { var d = document.getElementById(id);
      if (!d) return;
      [d, document.querySelector('[data-sdk-overlay="' + id + '"]')].forEach(function (el) { if (!el) return;
        el.hidden = !show; el.setAttribute('data-state', show ? 'open' : 'closed'); });
      // focus without scrolling: the content column scrolls inside the widget, and a plain focus() dragged
      // it under the sheet's overlay on the first WebSDK eval
      if (show) { var f = d.querySelector('button, input, [tabindex="0"]'); if (f) { try { f.focus({preventScroll: true}); } catch (e) { f.focus(); } } } };
    var op = up(e.target, '[data-sdk-open]');
    if (op) { dlg(op.getAttribute('data-sdk-open').replace(/^#/, ''), true); return; }
    document.querySelectorAll('[role=menu]:not([hidden])').forEach(function (m) { if (!m.contains(e.target)) { m.hidden = true; m.setAttribute('data-state', 'closed'); } });
    var ov = up(e.target, '[data-sdk-overlay]');
    if (ov) { dlg(ov.getAttribute('data-sdk-overlay'), false); return; }
    // a cross: closes the dialog it sits in, or removes the toast it sits in
    var cl = up(e.target, '[data-sdk-close]');
    if (cl) { var d2 = up(cl, '[role=dialog]'); if (d2) { dlg(d2.id, false); return; } var t2 = up(cl, '.sdk-toast'); if (t2) t2.remove(); return; }
  });
  // the controls' own state the markup cannot carry: the native select's closed value is a plain
  // button.selectedcontent (the kit's Vue copied the option into it; here nothing did, and a picked
  // country never showed — Switch device eval, 2026-10-14), and a radio row's isActive class is the
  // kit's checked state on the row, not on the input
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    if (t.matches('select.sdk-select-native')) { var b = t.querySelector('button.selectedcontent'), o = t.options[t.selectedIndex];
      if (b && o) { b.innerHTML = o.innerHTML; t.classList.toggle('sdk-select-native--placeholder', o.classList.contains('placeholder')); } return; }
    if (t.matches('input[type=radio].sdk-radio__input')) {
      var grp = t.name ? document.querySelectorAll('input[type=radio].sdk-radio__input[name="' + t.name.replace(/"/g, '\\"') + '"]') : [t];
      [].forEach.call(grp, function (r) { var row = up(r, '.RadioCheckContainer'); if (row) row.classList.toggle('isActive', r.checked); }); }
  });
  // a link-type button is a <span role=button>: Enter and Space click it
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.sdk-button__link[role=button]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') { document.querySelectorAll('.sdk-steps-popup__container:not([hidden])').forEach(function (p) { p.hidden = true; });
      document.querySelectorAll('[role=dialog]:not([hidden])').forEach(function (d) { d.hidden = true; d.setAttribute('data-state', 'closed');
        var o = document.querySelector('[data-sdk-overlay="' + d.id + '"]'); if (o) { o.hidden = true; o.setAttribute('data-state', 'closed'); } }); }
  });
})();`;

// \`node controls.js --api\` lists every component in one line, \`--api <name>\` prints that one's header,
// \`--doc <name>\` its section of VERSION.md — the same three reads as the dashboard's controls.js
if (require.main === module && (process.argv.includes('--api') || process.argv.includes('--doc'))) {
  const src = fs.readFileSync(__filename, 'utf8').split('\n');
  const names = Object.keys(module.exports).filter(k => k !== 'css' && k !== 'script');
  const argAt = f => { const k = process.argv.indexOf(f); return k >= 0 && process.argv[k + 1] && !process.argv[k + 1].startsWith('--') ? process.argv[k + 1] : null; };
  const header_ = n => { const i = src.findIndex(l => l.startsWith('// ' + n + '(')); if (i < 0) return null; let j = i; while (j < src.length && src[j].startsWith('//')) j++; return src.slice(i, j); };
  const want = argAt('--api');
  if (process.argv.includes('--api')) {
    if (want) {
      if (!names.includes(want)) { console.error(`no component "${want}"; the list: ${names.join(' ')}`); process.exit(2); }
      const h = header_(want); console.log(h ? h.join('\n') : '// ' + want + '(spec) — no header comment; --doc ' + want);
    } else for (const n of names) { const h = header_(n); console.log(h ? h[0] : '// ' + n + '(spec) — no header comment; read VERSION.md'); }
  }
  const doc = argAt('--doc');
  if (process.argv.includes('--doc')) {
    if (!doc) { console.error('--doc <component>: ' + names.join(' ')); process.exit(2); }
    const md = fs.readFileSync(path.join(__dirname, 'VERSION.md'), 'utf8').split('\n');
    const key = doc.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    const h = md.findIndex(l => /^## /.test(l) && l.slice(3).toLowerCase().replace(/[`*]/g, '').startsWith(key));
    if (h < 0) { console.error(`VERSION.md has no section starting "${key}"; try --api ${doc}`); process.exit(2); }
    let e = h + 1; while (e < md.length && !/^## /.test(md[e])) e++;
    console.log(md.slice(h, e).join('\n').trim());
  }
}
