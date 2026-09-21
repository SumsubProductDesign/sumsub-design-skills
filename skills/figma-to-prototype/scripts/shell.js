#!/usr/bin/env node
// shell.js <config.json> [--out page.html] [--fragment] [--assets <dir>] [--canvas WxH]
//
// Renders the Sumsub dashboard shell — sidebar, island, header and an empty
// content slot — from assets/shell/dashboard (Figma Dashboard UI Kit; the
// source nodes and the date are in VERSION.md there) and a small config:
//
//   { "layout": "basic",                  // "basic": 257px sidebar with labels, search/toggle header
//                                         // "fullscreen": 52px icon rail, breadcrumb header, optional tabs
//     "canvas": {"width": 1920, "height": 1080},
//     "client": "Key_name",
//     "page": {"title": "Page title", "keyName": "Key name",
//              "back": true,                          // the back control left of the title
//              "tag": {"label": "Enabled", "color": "green"},   // the status pill after the key name
//              "section": "Section name",            // fullscreen: breadcrumb before the title
//              "tabs": ["Tab_1", {"label": "Tab_2", "tag": "Beta"}], "activeTab": "Tab_1",   // either layout; a tab may carry a Tag Colorful
//              "actions": ["Request check"]},         // fullscreen: secondary buttons left of the AI button
//     "minWidth": 1440,                    // viewport canvas only: below this the page scrolls sideways (pinned content = the frame's width)
//     "sidebar": "expanded",               // basic: "collapsed" = the 52 rail with an Expand row, header unchanged
//     "production": true,                  // basic: the Production toggle state
//     "menu": { "active": ["Integrations", "Global settings", "AML screening"],
//               "expanded": [],            // extra groups to open besides the active path (basic)
//               "items": null,             // whitelist of top-level labels, null = all not marked hidden in menu.json
//               "children": null,          // per-section nesting for THIS prototype, when the design changes it on
//                                          //   purpose: {"Applicants": ["Individuals", {"label": "Levels", "children": ["A"]}]}
//               "override": null },        // a full items array instead of menu.json (tests)
//   The active path must exist in the rendered menu; otherwise shell.js stops with the reason
//   (hidden item → name it in items; new leaf → children; frame outdated → the product's item).
//     "hover": true }                      // the product's hover on menu items
//
// Output: a full HTML page whose #content-slot is where the prototype's content
// goes (absolutely positioned children; origin printed as JSON), or with
// --fragment only the <style> and the markup for injecting into a template.
// --canvas WxH renders a fixed canvas of that size whatever the config says — shellgate.sh uses it
//   to compare a viewport shell against a frame of known size.
// "frame": {"fileKey", "nodeId", "width", "height"} — where the shell's state was read from; shellgate.sh
//   takes the frame size from it, the ledger line quotes it.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const cfgPath = args.find(a => !a.startsWith('--') && a.endsWith('.json'));
if (!cfgPath) { console.error('usage: shell.js <config.json> [--out page.html] [--fragment] [--assets dir]'); process.exit(1); }
const ASSETS = path.resolve(opt('--assets', path.join(__dirname, '..', 'assets', 'shell', 'dashboard')));
const FRAGMENT = args.includes('--fragment');
const C = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const LAYOUT = C.layout === 'fullscreen' ? 'fullscreen' : 'basic';
const COLLAPSED = LAYOUT === 'basic' && C.sidebar === 'collapsed';   // the product's Collapse state: rail + basic header
// canvas: {"width": 1920, "height": 1080} for a fixed prototype canvas, or "viewport" for a
// shell that fills the window and follows a resize — the sidebar keeps its width, the island
// and the content slot take the rest (what the product does; its minimum is 640px of island)
const canvasOpt = opt('--canvas', null);
if (canvasOpt) { const [w, h] = canvasOpt.split('x').map(Number); if (w && h) C.canvas = {width: w, height: h}; }
const VIEWPORT = C.canvas === 'viewport';
const canvas = VIEWPORT ? {width: 1920, height: 1080} : Object.assign({width: 1920, height: 1080}, C.canvas);
const page = Object.assign({title: 'Page title', keyName: 'Key name', section: 'Section name', tabs: [], activeTab: null, actions: []}, C.page);
const menuCfg = Object.assign({active: [], expanded: [], items: null, children: null, override: null}, C.menu);
const client = C.client || 'Key_name';
const hover = C.hover !== false;

// ---------------------------------------------------------------- assets
// Figma exports a 24×24 icon as a 24×24 SVG, but a *filled* sidebar icon is exported as its
// tight vector (e.g. 19.867×14) which Figma places inside the 24 box at an explicit offset.
// icons/insets.json carries that placement per icon; without an entry the SVG fills its box.
const INSETS = fs.existsSync(path.join(ASSETS, 'icons', 'insets.json')) ? JSON.parse(fs.readFileSync(path.join(ASSETS, 'icons', 'insets.json'), 'utf8')) : {};
const icon = (name) => {
  const f = path.join(ASSETS, 'icons', name + '.svg');
  if (!fs.existsSync(f)) { console.error('missing icon: ' + name); process.exit(1); }
  const svg = fs.readFileSync(f, 'utf8').replace(/<\?xml[^>]*>/, '').trim()
    .replace(/<svg([^>]*)>/, (m, at) => {
      const vb = (at.match(/viewBox="[^"]*"/) || [''])[0];
      // keep the root fill: Figma exports carry fill="none" there, and a stroke-only child (the ring of the
      // info badge) would otherwise be filled black by the SVG default
      const fill = (at.match(/\sfill="[^"]*"/) || [''])[0];
      return `<svg ${vb}${fill} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:100%">`;
    });
  const g = INSETS[name];
  if (!g) return svg;
  return `<span style="position:relative;display:block;width:100%;height:100%"><span style="position:absolute;left:${g.left / 24 * 100}%;top:${g.top / 24 * 100}%;width:${g.width / 24 * 100}%;height:${g.height / 24 * 100}%">${svg}</span></span>`;
};
const fontB64 = fs.readFileSync(path.join(ASSETS, 'geist-variable.woff2')).toString('base64');
const menu = menuCfg.override || JSON.parse(fs.readFileSync(path.join(ASSETS, 'menu.json'), 'utf8')).items;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- menu state
const active = menuCfg.active || [];
const expanded = new Set(menuCfg.expanded || []);   // labels the config opens explicitly
// the active path opens by POSITION (see level1/level2), never by label: a leaf may share its
// label with a section — Integrations → Global settings → AML screening must not open AML screening
const items0 = menuCfg.items ? menu.filter(i => menuCfg.items.includes(i.label)) : menu.filter(i => !i.hidden);  // hidden items render only when the whitelist names them
const norm = c => typeof c === 'string' ? {label: c} : Object.assign({}, c, c.children ? {children: c.children.map(norm)} : {});
const items = items0.map(i => (menuCfg.children && menuCfg.children[i.label])
  ? Object.assign({}, i, {children: menuCfg.children[i.label].map(norm)})   // this prototype's nesting, menu.json untouched
  : i);
if (menuCfg.children) for (const k of Object.keys(menuCfg.children)) if (!items.some(i => i.label === k)) {
  console.error(`shell.js: menu.children names "${k}", which is not a rendered top-level item`); process.exit(2);
}
const isActiveLeaf = (p) => p.length === active.length && p.every((l, i) => l === active[i]);
const onActivePath = (p) => p.every((l, i) => l === active[i]);
const hasChildren = n => Array.isArray(n.children) && n.children.length > 0;
if (active.length) {                              // the active path must resolve — a silent miss renders nothing active
  let level = items, where = [];
  for (const label of active) {
    const node = level.find(n => n.label === label);
    if (!node) {
      const inFile = menu.find(n => n.label === label);
      const why = inFile && inFile.hidden ? `"${label}" is hidden in menu.json — name it in menu.items to show it`
        : where.length === 0 ? `"${label}" is not a top-level item in menu.json`
        : `"${label}" is not under ${where.join(' → ')} in menu.json — a leaf the design adds on purpose goes into menu.children; an outdated frame means: use the product's item and note it in the ledger`;
      console.error(`shell.js: active path not found: ${why}`); process.exit(2);
    }
    where.push(label); level = node.children || [];
  }
}
const outlineName = ic => fs.existsSync(path.join(ASSETS, 'icons', ic + '-outline.svg')) ? ic + '-outline' : ic;

// ---------------------------------------------------------------- sidebar, basic (257)
function level3(node, p, index) {
  const on = isActiveLeaf(p);
  // the connector runs from the group's row down to the centre of the active leaf:
  // first child = the Figma vector (12.5×19); later children extend the vertical run by 36 per row
  const conn = on ? `<div class="sh-conn" style="top:${-36 * index}px;height:${19.5 + 36 * index}px"><svg viewBox="0 0 13.0034 ${19.5019 + 36 * index}" preserveAspectRatio="none" style="display:block;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg"><path d="M0.5 0V${15.0019 + 36 * index}C0.5 ${17.2111 + 36 * index} 2.29086 ${19.0019 + 36 * index} 4.5 ${19.0019 + 36 * index}H13.0034" stroke="#D3D7DF" fill="none"/></svg></div>` : '';
  return `<div class="sh-l3${on ? ' active' : ''}" data-path="${esc(p.join(' / '))}">${conn}<div class="row"><span class="lbl">${esc(node.label)}</span></div></div>`;
}
function level2(node, p) {
  if (hasChildren(node)) {
    const open = onActivePath(p) || (expanded.has(node.label) && onActivePath(p.slice(0, 1)));
    const holds = onActivePath(p);
    return `<div class="sh-l2 group${holds ? ' has-active' : ''}${open ? ' open' : ''}" data-path="${esc(p.join(' / '))}"><div class="row"><span class="lbl">${esc(node.label)}</span><span class="chev">${icon('chevron-up-normal')}</span></div></div>` +
      (open ? node.children.map((c, i) => level3(c, p.concat(c.label), i)).join('') : '');
  }
  const on = isActiveLeaf(p);
  return `<div class="sh-l2 leaf${on ? ' active' : ''}" data-path="${esc(p.join(' / '))}"><div class="row"><span class="lbl">${esc(node.label)}</span></div></div>`;
}
function level1(node) {
  const p = [node.label];
  const open = active[0] === node.label || expanded.has(node.label);
  const kids = hasChildren(node) && open ? node.children.map(c => level2(c, p.concat(c.label))).join('') : '';
  return `<div class="sh-sec"><div class="sh-l1${open ? ' active' : ''}${hasChildren(node) ? '' : ' standalone'}" data-path="${esc(node.label)}"><div class="row"><span class="ic">${icon(open ? node.icon + '-filled' : outlineName(node.icon))}</span><span class="lbl">${esc(node.label)}</span></div></div>${kids}</div>`;
}
const sidebarBasic = () => `
<div class="sh-side">
  <div class="sh-key"><div class="krow">
    <div class="logo"><span class="lg">${icon('logo-icon-original')}</span></div>
    <div class="kname">${esc(client)}</div>
    <div class="kbtn"><span class="ic16">${icon('key-info')}</span></div>
  </div></div>
  <div class="sh-items">${items.map(level1).join('')}</div>
  <div class="sh-collapse"><div class="sh-l1"><div class="row"><span class="ic">${icon('panel-close-left')}</span><span class="lbl">Collapse</span></div></div></div>
  <div class="sh-scroll"><div class="thumb"></div></div>
</div>`;

// ---------------------------------------------------------------- sidebar, fullscreen rail (52)
const railKey = () => `<div class="sh-key"><div class="krow">
    <div class="logo"><span class="lg">${icon('logo-icon-original')}</span><span class="badge">${icon('key-info-filled')}</span></div>
  </div></div>`;
const railItems = () => `<div class="sh-items">${items.map(node => {
    const on = active[0] === node.label;
    return `<div class="sh-r1${on ? ' active' : ''}${hasChildren(node) ? '' : ' standalone'}" data-path="${esc(node.label)}" title="${esc(node.label)}"><div class="row"><span class="ic">${icon(on ? node.icon + '-filled' : outlineName(node.icon))}</span></div></div>`;
  }).join('')}</div>`;
const sidebarRail = () => `
<div class="sh-rail">
  ${railKey()}
  ${railItems()}
  <div class="sh-scroll"><div class="thumb"></div></div>
</div>`;
// basic layout with the sidebar collapsed (the product's Collapse state): the rail plus an Expand row where
// Collapse was — Organisms / Dashboard UI Kit, *Sidebar* Collapsed=True in frame 5558:43841 (64 row, top border,
// panel-close-right); no fade, none observed there
const sidebarCollapsed = () => `
<div class="sh-rail sh-side-collapsed">
  ${railKey()}
  ${railItems()}
  <div class="sh-collapse rail"><div class="sh-r1" data-path="Expand" title="Expand"><div class="row"><span class="ic">${icon('panel-close-right')}</span></div></div></div>
  <div class="sh-scroll"><div class="thumb"></div></div>
</div>`;

// ---------------------------------------------------------------- header slots
// page.back: the product's back control, a 24 box with the design system's chevron
// turned a quarter left — the sidebar's own chevron asset, rotated, because the set
// is one glyph at four angles.
const backControl = () => page.back ? `<span class="hback">${icon('chevron-up-normal')}</span>` : '';
// page.tag: {label, color} — the status pill beside the key name (Enabled, Draft…).
// Colours are the status palette; the dot takes the badge palette, as SnsStatus does.
const TAGC = {
  grey: ['#f3f4f6', '#d1d5dc', '#1e2939', '#6a7282'],
  green: ['#dcfce7', '#bbf7d0', '#166534', '#22c55e'],
  blue: ['#dbeafe', '#bfdbfe', '#1e40af', '#3b82f6'],
  red: ['#fee2e2', '#fecaca', '#991b1b', '#ef4444'],
  yellow: ['#fef3c7', '#fde68a', '#8a460c', '#f4a614'],
};
const pageTag = () => {
  if (!page.tag) return '';
  const t = typeof page.tag === 'string' ? {label: page.tag} : page.tag;
  const c = TAGC[t.color] || TAGC.grey;
  return `<span class="htag" style="background:${c[0]};border-color:${c[1]};color:${c[2]}">`
    + `${t.dot === false ? '' : `<span class="htag-d" style="background:${c[3]}"></span>`}`
    + `<span>${esc(t.label || '')}</span></span>`;
};

// ---------------------------------------------------------------- headers
const headerBasic = () => `
<div class="sh-header">
  <div class="hleft">${backControl()}<span class="title">${esc(page.title)}</span><span class="kn">${esc(page.keyName)}</span>${pageTag()}</div>
  <div class="actions">
    <div class="search"><span class="ic16">${icon('header-search')}</span><span class="ph">Search anything here</span><span class="keys"><span class="k">⌘</span><span class="k">K</span></span></div>
    <div class="ai"><span class="ic16">${icon('header-ai-sparkle')}</span></div>
    <div class="nav">
      <div class="action">
        <div class="toggle${C.production === false ? ' off' : ''}"><span class="sw"><span class="hd"></span></span><span class="tl">Production</span></div>
        <div class="btns"><span class="ibtn"><span class="ic16">${icon('header-question')}</span></span><span class="ibtn"><span class="ic16">${icon('header-bell')}</span></span></div>
      </div>
      <div class="userpic"><span class="u1">${icon('userpic-1')}</span><span class="u2">${icon('userpic-2')}</span></div>
    </div>
  </div>
</div>` + subheader();

const tabs = Array.isArray(page.tabs) ? page.tabs : [];
// the tab subheader is part of the header component in both layouts (Header / Subheader, 41): the
// basic header carries it on pages with tabs (AML screening providers, applicant lists)
// a tab is "Label" or {"label": "Label", "tag": "Draft v.1"} — the tag is Tag Colorful / Blue / Small
// (Base components 688:29153). Selected tabs are always the shell's black style: blue selected tabs in
// mockups are the pre-redesign component.
const tabLabel = t => typeof t === 'string' ? t : t.label;
const subheader = () => tabs.length ? `
<div class="sh-sub"><div class="tabbar">${tabs.map(t => `<span class="tab${tabLabel(t) === (page.activeTab || tabLabel(tabs[0])) ? ' sel' : ''}"><span class="tl">${esc(tabLabel(t))}</span>${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}</span>`).join('')}</div></div>` : '';
// a header button. A string is the plain secondary button the shell always drew; an object gives
//   {label, type: 'secondary'|'primary'|'tertiary', status: 'default'|'success'|'danger',
//    icon, iconRight, iconOnly}  — icon names come from the shell's own set, and iconOnly keeps
//    the label for a screen reader without drawing it;
//   {tag: 'Label', color: 'blue', icon}  — a Tag Colorful rather than a button, which is what the
//    record's own labels are in the product's second row — and the string "|" is the
// divider the product puts between the record's icon buttons and its decisions.
const fbtn = (a) => {
  if (a === '|') return '<span class="fdiv"></span>';
  const o = typeof a === 'string' ? {label: a} : (a || {});
  // a tag, not a button: the record's own labels sit in the second row beside Add tag, and in
  // the product they are Tag Colorful. Same nine colours as the library's tag(); lint keeps them equal.
  if (o.tag != null) return `<span class="htag2 htag2-${o.color || 'grey'}">`
    + `${o.icon ? `<span class="ic16">${icon(o.icon)}</span>` : ''}<span>${esc(o.tag)}</span></span>`;
  const type = o.type || 'secondary', status = o.status || 'default';
  // iconOnly keeps the label as the screen reader's name without drawing it: an icon button
  // still needs a name, and naming it must not turn it into a text button
  const only = o.iconOnly || !o.label;
  return `<button type="button" class="sbtn sbtn-${type} sbtn-${status}${only ? ' sbtn-icon' : ''}"`
    + `${only && o.label ? ` aria-label="${esc(o.label)}"` : ''}>`
    + `${o.icon ? `<span class="ic16">${icon(o.icon)}</span>` : ''}`
    + `${only ? '' : `<span>${esc(o.label)}</span>`}`
    + `${o.iconRight ? `<span class="ic16">${icon(o.iconRight)}</span>` : ''}</button>`;
};

const headerFullscreen = () => `
<div class="sh-fheader">
  <div class="frow">
    <div class="finfo">${page.section ? `<span class="crumb">${esc(page.section)}</span><span class="crumb">/</span>` : ''}<span class="title">${esc(page.title)}</span><span class="kn">${esc(page.keyName)}</span></div>
    <div class="factions">
      <div class="grp">${(page.actions || []).map(fbtn).join('')}<button type="button" class="ai" aria-label="Summy AI"><span class="ic16">${icon('header-ai-sparkle')}</span></button></div>
      <button type="button" class="ibtn" aria-label="Help"><span class="ic16">${icon('header-question')}</span></button>
    </div>
  </div>
  ${INFO.length ? `<div class="finforow">${INFO.map(fbtn).join('')}</div>` : ''}
</div>` + subheader();

// ---------------------------------------------------------------- geometry, in canvas pixels
// "island": false — the page runs flush to the rail, as the product's record pages do: no grey
// gutter, no rounded frame, no side padding, and the content starts 8 under the header's rule
// (Applicant page 22809:153656 measures white from y=126 down, and its Body at y=133).
const ISLAND = C.island !== false;
const GAP = ISLAND ? 8 : 0, PAD = ISLAND ? 20 : 0, TOPPAD = ISLAND ? 20 : 8, SUB = 41;
// the fullscreen header is 56 with one row and 84 with the record's second row (12 + 32 + 4 + 24 + 12),
// which is what the product's Applicant page shows: the ID chips and Add tag under the title
const INFO = [].concat((C.page && C.page.info) || []).filter(Boolean);
const HEADER = (C.layout === 'fullscreen' && INFO.length) ? 84 : 56;
const SIDE = LAYOUT === 'basic' && !COLLAPSED ? 264 : 52;   // expanded: 256 of content + the 8px scrollbar gutter, always reserved (the product's width; the Figma component is 257)
const TOP = HEADER + (tabs.length ? SUB : 0);   // both layouts: the subheader adds 41 when tabs are given
const origin = VIEWPORT
  ? {x: SIDE + PAD, y: GAP + TOP + TOPPAD, w: null, h: null, note: 'viewport canvas: width and height follow the window'}
  : {x: SIDE + PAD, y: GAP + TOP + TOPPAD, w: canvas.width - SIDE - GAP - 2 * PAD, h: canvas.height - 2 * GAP - TOP - TOPPAD - PAD};

const css = `
@font-face{font-family:"Geist";font-style:normal;font-weight:100 900;font-display:block;src:url(data:font/woff2;base64,${fontB64}) format("woff2-variations")}
/* the type is declared on the PAGE, not only on .sh-root: anything a prototype anchors to the viewport —
   a toast, a modal, a drawer — sits next to the root and would otherwise fall back to Times (found on the
   AML run, 2026-09-18). A fixed canvas is centred in a wider window, as Step 4's contract requires. */
html,body{font-family:"Geist",system-ui,sans-serif;font-size:14px;line-height:24px;color:#373d4d}
button,input,select,textarea{font:inherit}  /* form controls do not inherit type by default: an input would render in Arial */
.sh-root{position:relative;width:${VIEWPORT ? '100%' : canvas.width + 'px'};height:${VIEWPORT ? '100vh' : canvas.height + 'px'};${VIEWPORT ? `min-width:${C.minWidth || SIDE + 640}px;min-height:480px;` : 'margin:0 auto;'}background:#f3f4f6;overflow:hidden;box-sizing:border-box}
.sh-root *,.sh-root *::before,.sh-root *::after{box-sizing:border-box}
.sh-root svg{display:block}
.ic16{display:block;width:16px;height:16px}
/* every 1px stroke below is an inset box-shadow, not a border: Figma strokes sit inside the frame
   and do not move its children, a CSS border would push every child 1px in */
.sh-side,.sh-rail{position:absolute;left:0;top:0;width:${SIDE}px;height:100%;display:flex;flex-direction:column;overflow:hidden}
.sh-key{height:56px;padding:2px 0;flex:none}
.sh-key .krow{height:52px;display:flex;align-items:center;gap:8px;padding:8px 16px 8px 10px}
.sh-rail .sh-key .krow{padding:8px;justify-content:center}
.sh-key .logo{width:36px;height:36px;flex:none;background:#fff;box-shadow:inset 0 0 0 1px #edeff2;border-radius:8px;position:relative}
.sh-key .lg{position:absolute;left:50%;top:8.09px;width:27px;height:19.815px;margin-left:-13.5px}
.sh-key .badge{position:absolute;left:25px;top:24px;width:18px;height:18px}
.sh-key .kname{flex:1;min-width:0;font-weight:700;color:#373d4d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sh-key .kbtn{flex:none;box-shadow:inset 0 0 0 1px #d1d5dc;border-radius:8px;padding:4px;background:#fff}
.sh-items{flex:1;min-height:0;padding:6px 0;overflow-y:scroll;scrollbar-width:none}
.sh-items::-webkit-scrollbar{display:none}
/* the scrollbar lies OVER the list (designer's rule 2026-09-18): rows keep the full width and the same 4px on both
   sides; the native bar is hidden and .sh-scroll draws the product's thumb (6px, #d1d5dc, radius 8, hover #b4bac4,
   track inset 4px) in the last 8px, only while the menu overflows */
.sh-scroll{position:absolute;right:0;width:8px;top:56px;bottom:64px;pointer-events:none}
.sh-rail .sh-scroll{bottom:0}
.sh-side-collapsed .sh-scroll{bottom:64px}
.sh-scroll .thumb{position:absolute;left:1px;width:6px;border-radius:8px;background:#d1d5dc;pointer-events:auto;display:none}
.sh-scroll .thumb:hover{background:#b4bac4}
.sh-l1,.sh-r1{height:40px;padding:2px 4px;display:flex;align-items:center}
/* rows in the scrolling list stop 12px short of the right edge: the overlay thumb sits at 257..263, so the row boxes,
   hover and pills keep ≥4px from it (designer, 2026-09-18); Figma's rows run to 4 / 8 from the edge */
.sh-items .sh-l1{padding-right:12px}
/* active first-level row: filled icon and bold label; a background (#edeff2, the full 40 row) only when the
   section has no nesting (Figma 29966:73467) — an expanded section with children gets none. Designer's rule 2026-09-18 */
.sh-l1.active.standalone,.sh-r1.active.standalone{background:#edeff2}
.sh-l1 .row{flex:1;height:36px;display:flex;align-items:center;gap:4px;padding:0 4px 0 6px;border-radius:8px}
.sh-r1 .row{flex:1;min-width:0;height:36px;display:flex;align-items:center;justify-content:center;padding:0 4px 0 6px;border-radius:8px}  /* min-width:0 — the 36 icon overflows the 34 content box and must centre like Figma, not push the row wider */
.sh-l1 .ic,.sh-r1 .ic{width:36px;height:36px;padding:6px;flex:none}
.sh-l1 .lbl{font-weight:500;white-space:nowrap}
.sh-l1.active .lbl{font-weight:700;color:#030712}
.sh-l2{height:40px;padding:2px 12px 2px 40px;display:flex;align-items:center}
.sh-l2.group{height:36px;padding:0 12px 0 40px}  /* the product: a group row is 36 with no vertical padding (designer, 2026-09-18); Figma's component is 40 */
.sh-l2 .row{flex:1;display:flex;align-items:center;gap:8px;padding:4px 12px;border-radius:8px}
.sh-l2 .lbl{flex:1;font-weight:500;white-space:nowrap}
.sh-l2.has-active .lbl{font-weight:700}
.sh-l2 .chev{width:16px;height:16px;flex:none;transform:rotate(180deg)}
.sh-l2.open .chev{transform:none}
.sh-l2.leaf.active .row{background:#e5e7eb}
.sh-l2.leaf.active .lbl{font-weight:700;color:#030712}
.sh-l3{height:36px;padding:2px 12px 2px 64px;display:flex;align-items:center;position:relative}
.sh-l3 .row{flex:1;display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:8px}
.sh-l3 .lbl{font-weight:500;white-space:nowrap}
.sh-l3.active .row{background:#e5e7eb}
.sh-l3.active .lbl{font-weight:700;color:#030712}
.sh-conn{position:absolute;left:51.5px;width:13.0034px;pointer-events:none}
.sh-collapse{height:64px;flex:none;border-top:1px solid #e5e7eb;padding:12px 2px;position:relative}
.sh-collapse.rail{padding:12px 0}
.sh-collapse.rail::before{content:none}
/* fade over the last menu rows, as the product's .sidebar-collapse::before (dev-cockpit): 24px, transparent → page
   background, ending at the Collapse border; right:8px leaves the scrollbar gutter clear */
.sh-collapse::before{content:"";position:absolute;left:0;right:0;top:-25px;height:24px;background:linear-gradient(rgba(243,244,246,0),#f3f4f6);pointer-events:none}
${hover ? `.sh-l1 .row,.sh-l2 .row,.sh-l3 .row,.sh-r1 .row,.sh-collapse .row{cursor:pointer}
/* hover — Figma Organisms / Dashboard UI Kit, "Sidebar 2.1 - Navigation menu" (5608:62979): the Row box takes a
   background, radius stays 8, label and icon do not change; expanded/active rows have no hover variant */
.sh-l1:not(.active.standalone):hover .row,.sh-r1:not(.active.standalone):hover .row,.sh-collapse .sh-l1:hover .row,.sh-collapse .sh-r1:hover .row{background:#e5e7eb}  /* an active section with nesting hovers like any other; only the highlighted standalone one does not */
.sh-l2:not(.active):hover .row{background:#e1e5ea}
.sh-l3:not(.active):hover .row{background:#d1d5dc}` : ''}
.sh-island{position:absolute;left:${SIDE}px;top:${GAP}px;right:${GAP}px;bottom:${GAP}px}
.sh-body{position:relative;height:100%;background:#fff;border-radius:${ISLAND ? 16 : 0}px;overflow:hidden;display:flex;flex-direction:column}
/* the island's 1px frame is drawn ABOVE the content: an inset box-shadow on .sh-body would lie under any child that
   reaches the edge (a table longer than the slot hid the bottom edge, 2026-09-18) */
${ISLAND ? `.sh-body::after{content:"";position:absolute;inset:0;border-radius:16px;box-shadow:inset 0 0 0 1px #e5e7eb;pointer-events:none;z-index:5}` : ''}
.sh-header{height:${HEADER}px;flex:none;display:flex;align-items:center;gap:24px;padding:12px 20px;border-bottom:1px solid #e5e7eb}
.sh-header .hleft{flex:1;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sh-header .title{font-weight:600;color:#212736;white-space:nowrap}
.sh-header .kn{font-weight:400;color:#4a5565;white-space:nowrap}
.sh-header .hback{display:flex;align-items:center;justify-content:center;width:24px;height:24px;
  flex-shrink:0;color:#1e2939;transform:rotate(-90deg)}
.sh-header .hback svg{display:block;width:16px;height:16px}
.sh-header .htag{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;box-sizing:border-box;
  min-height:20px;padding:0 8px;border:1px solid;border-radius:9999px;font-size:12px;line-height:16px;font-weight:500}
.sh-header .htag-d{width:6px;height:6px;border-radius:9999px;flex-shrink:0}
.sh-header .actions{display:flex;align-items:center;gap:16px;flex:none}
.sh-header .search{width:240px;height:32px;display:flex;align-items:center;gap:8px;padding:4px 4px 4px 8px;background:#f6f7f9;box-shadow:inset 0 0 0 1px #edeff2;border-radius:8px}
.sh-header .ph{flex:1;min-width:0;color:#586073;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sh-header .keys{display:flex;gap:2px;flex:none}
.sh-header .k{min-width:20px;padding:2px 4px;background:#e5e7eb;border-radius:8px;font-size:12px;line-height:16px;font-weight:500;color:#1e2939;text-align:center}
.ai{display:block;width:32px;height:32px;padding:8px;box-shadow:inset 0 0 0 1px #e9d5ff;border-radius:8px;background:linear-gradient(90.17deg,#e0e7ff 0%,#f3e8ff 100%)}
.sh-header .nav{display:flex;align-items:center;gap:16px}
.sh-header .action{display:flex;align-items:center;gap:8px}
.sh-header .toggle{display:flex;align-items:center;gap:8px;height:24px;width:106px}  /* Figma: 28 switch + 8 + 70 label; fixed so text rounding cannot move the cluster */
.sh-header .sw{position:relative;display:block;width:28px;height:18px;border-radius:100px;background:#030712}
.sh-header .toggle.off .sw{background:#d1d5dc}
.sh-header .hd{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:16px;background:#fff}
.sh-header .toggle.off .hd{right:auto;left:2px}
.sh-header .tl{font-weight:400;color:#373d4d;white-space:nowrap}
.sh-header .btns{display:flex;align-items:center}
.ibtn{display:block;padding:8px;border-radius:8px;border:0;background:none;cursor:pointer;color:inherit}
.sh-fheader .ibtn:hover{background:#f3f4f6}
.sh-fheader .ai{border:0;cursor:pointer;padding:8px}
.sh-fheader .ibtn:focus-visible,.sh-fheader .ai:focus-visible{outline:none;box-shadow:0 0 0 1px #fff,0 0 0 3px #60a5fa}
.sh-header .userpic{position:relative;width:32px;height:32px;border-radius:100px;background:#edeff2;overflow:hidden}
.sh-header .u1{position:absolute;left:15.63%;right:15.63%;bottom:25%;height:11.636px}
.sh-header .u2{position:absolute;left:26.67%;right:26.67%;bottom:calc(25% + 11.64px);height:4.364px}
/* fullscreen header: breadcrumb / title / key name, actions right; optional tab subheader */
.sh-fheader{height:${HEADER}px;flex:none;padding:12px 20px;border-bottom:1px solid #e5e7eb;display:flex;flex-direction:column;justify-content:center;gap:4px}
.sh-fheader .frow{display:flex;align-items:center;gap:40px}
.sh-fheader .finfo{flex:1;min-width:0;display:flex;align-items:center;gap:8px;padding:4px 0}
.sh-fheader .crumb{font-weight:500;color:#6a7282;white-space:nowrap}
.sh-fheader .title{font-weight:600;color:#030712;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sh-fheader .kn{font-weight:400;color:#6a7282;white-space:nowrap}
.sh-fheader .factions{display:flex;align-items:center;gap:8px;flex:none}
.sh-fheader .grp{display:flex;align-items:center;gap:12px}
/* the record's second row: the ID chips and Add tag, 8 apart, wrapping when the title is long */
.sh-fheader .finforow{display:flex;flex-wrap:wrap;align-items:center;gap:8px;height:24px}
.sh-fheader .finforow .sbtn{padding:0 8px}
.sh-fheader .fdiv{align-self:stretch;width:1px;background:#e5e7eb}
/* Tag Colorful in a header row. The nine colours are controls.js tag()'s own — lint compares
   them rule by rule, so the chrome and the components cannot drift apart. */
.sh-fheader .htag2{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;box-sizing:border-box;
  font-size:12px;line-height:16px;font-weight:500}
.sh-fheader .htag2-grey{background:#f3f4f6;box-shadow:inset 0 0 0 1px #d1d5dc;color:#1e2939}
.sh-fheader .htag2-blue{background:#dbeafe;box-shadow:inset 0 0 0 1px #bfdbfe;color:#1e40af}
.sh-fheader .htag2-green{background:#dcfce7;box-shadow:inset 0 0 0 1px #bbf7d0;color:#166534}
.sh-fheader .htag2-red{background:#fee2e2;box-shadow:inset 0 0 0 1px #fecaca;color:#991b1b}
.sh-fheader .htag2-yellow{background:#fef3c7;box-shadow:inset 0 0 0 1px #fde68a;color:#8a460c}
.sh-fheader .htag2-orange{background:#ffedd5;box-shadow:inset 0 0 0 1px #fed7aa;color:#9a3412}
.sh-fheader .htag2-purple{background:#f3e8ff;box-shadow:inset 0 0 0 1px #e9d5ff;color:#6b21a8}
.sh-fheader .htag2-cyan{background:#cffafe;box-shadow:inset 0 0 0 1px #a5f3fc;color:#155e75}
.sh-fheader .htag2-black{background:#364153;box-shadow:inset 0 0 0 1px #1e2939;color:#fff}
.sh-fheader .htag2-deleted{background:#f3f4f6;box-shadow:inset 0 0 0 1px #e5e7eb;color:#6a7282}
.sh-fheader .htag2-gradient{background-image:linear-gradient(72deg,#b465da 0%,#cf6cc9 33%,#ee609c 66%,#ee609c 100%);
  box-shadow:inset 0 0 0 1px #e9d5ff;color:#fff}
/* a header button: secondary by default, primary in the product's success and danger colours for
   the decisions an operator takes on a record, tertiary for Add tag. Icon-only is square at 32. */
.sh-fheader .sbtn{display:flex;align-items:center;gap:8px;min-width:64px;padding:4px 12px;background:#fff;box-shadow:inset 0 0 0 1px #d1d5dc;border-radius:8px;font:inherit;font-weight:500;color:#1e2939;white-space:nowrap;border:0;cursor:pointer;text-align:center}
.sh-fheader .sbtn-icon{min-width:0;padding:8px}
.sh-fheader .sbtn-primary{box-shadow:none;color:#fff;background:#030712}
.sh-fheader .sbtn-primary.sbtn-success{background:#16a34a}
.sh-fheader .sbtn-primary.sbtn-danger{background:#dc2626}
.sh-fheader .sbtn-tertiary{box-shadow:none;background:transparent}
/* hover: the values are the library's own (controls.js button), not a wash invented here.
   A header button is an entrance, so it answers the pointer even when the page is a picture. */
.sh-fheader .sbtn:hover{background:#f9fafb;box-shadow:inset 0 0 0 1px #b4bac4}
.sh-fheader .sbtn-tertiary:hover{background:#f3f4f6;box-shadow:none}
.sh-fheader .sbtn-primary:hover{background:#1e2939;box-shadow:none}
.sh-fheader .sbtn-primary.sbtn-success:hover{background:#15803d}
.sh-fheader .sbtn-primary.sbtn-danger:hover{background:#b91c1c}
.sh-fheader .sbtn:focus-visible{outline:none;box-shadow:0 0 0 1px #fff,0 0 0 3px #60a5fa}
.sh-sub{height:${SUB}px;flex:none;padding:8px 20px 0;border-bottom:1px solid #e5e7eb}
.sh-sub .tabbar{height:32px;display:flex;align-items:center;gap:24px}  /* one line under the tabs: the subheader border; the Tab Basic component declares a #d1d5dc bottom stroke that neither Figma render shows */
.sh-sub .tab{display:flex;align-items:center;gap:4px;height:32px;padding:4px 0;font-weight:500;color:#4a5565;white-space:nowrap}
.sh-sub .tag{display:block;padding:2px 8px;border-radius:8px;background:#dbeafe;box-shadow:inset 0 0 0 1px #bfdbfe;font-size:12px;line-height:16px;font-weight:500;color:#1e40af}  /* Tag Colorful, Blue, Small: stroke inside */
.sh-sub .tab.sel{color:#1e2939;box-shadow:inset 0 -2px 0 #030712}
${hover ? `.sh-sub .tab{cursor:pointer}` : ''}
.sh-content{flex:1;min-height:0;position:relative;padding:${TOPPAD}px ${PAD}px ${PAD}px${VIEWPORT ? ';overflow-y:auto' : ''}}
#content-slot{position:relative;width:100%;${VIEWPORT ? 'min-height:100%' : 'height:100%'}}  /* viewport: the slot grows with elastic content and the island scrolls it, as the product does */
`;

const markup = `<div class="sh-root sh-${LAYOUT}" id="shell">${LAYOUT === 'fullscreen' ? sidebarRail() : COLLAPSED ? sidebarCollapsed() : sidebarBasic()}
<div class="sh-island"><div class="sh-body">${LAYOUT === 'basic' ? headerBasic() : headerFullscreen()}
<div class="sh-content"><div id="content-slot" data-origin='${JSON.stringify(origin)}'></div></div>
</div></div>
<script>(function(){var L=document.querySelector('#shell .sh-items'),T=document.querySelector('#shell .sh-scroll'),H=T&&T.firstElementChild;if(!L||!H)return;
function u(){var tr=T.clientHeight-8,tot=L.scrollHeight,vis=L.clientHeight;if(tot<=vis+1){H.style.display='none';return}
var h=Math.max(20,Math.round(tr*vis/tot)),top=4+Math.round((tr-h)*L.scrollTop/(tot-vis));H.style.display='block';H.style.height=h+'px';H.style.top=top+'px'}
L.addEventListener('scroll',u);addEventListener('resize',u);u()})();</script></div>`;

const out = FRAGMENT ? `<style>${css}</style>\n${markup}` :
`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(page.title)}</title>
<style>html,body{margin:0;background:#f3f4f6}${VIEWPORT ? 'html,body{height:100%;overflow:hidden' + (ISLAND ? '' : ';overflow-x:auto') + '}' : ''}${css}</style></head><body>${markup}</body></html>`;
const outPath = opt('--out', null);
if (outPath) { fs.writeFileSync(outPath, out); console.log(JSON.stringify({out: outPath, bytes: out.length, layout: LAYOUT, sidebarState: COLLAPSED ? "collapsed" : "expanded", contentOrigin: origin, sidebar: SIDE, header: TOP, canvas: VIEWPORT ? "viewport" : canvas, items: items.length, activeIndex: items.findIndex(i => i.label === active[0]), frame: C.frame || null})); }
else process.stdout.write(out);
