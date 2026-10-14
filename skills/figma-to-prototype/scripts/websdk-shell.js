#!/usr/bin/env node
// websdk-shell.js <config.json> [--out page.html] [--fragment] [--canvas WxH]
//
// The WebSDK shell: the page a verification widget sits on, rendered from the kit's own components
// (assets/components/websdk/controls.js) and the frames' page rules — the top bar above the widget,
// the widget box (SdkBaseContainer: max 718, the 1px frame, the 32 radius) with an empty content
// column for the generator, the footer pinned to its bottom, "Powered by Sumsub" under it. What a
// prototype's screens share, built once; the generator fills #content-slot (the kit's inner column,
// max 506) with flow markup from controls.js and never positions anything by coordinate. The column
// (.ws-column, position: relative) is the dialog host — the SDK's root as the frames draw it: modal()
// and bottomSheet() go at the END of the column, after the whitelabel line, never inside container().
// The kit's overlay is absolute, inset 0, with its 8px overlay margin: in the column it dims the top
// bar, the widget and the Powered-by line; inside the widget box it stopped at the box's edges, the
// bar stayed undimmed and the dialog sat 8 inside the frame with white gaps (eval run 17, 2026-10-14).
//
//   node websdk-shell.js assets/shell/websdk/examples/desktop.json --out _work/shell.html
//   node websdk-shell.js cfg.json --fragment        → <style> + markup + <script>, for a generator
//   node websdk-shell.js cfg.json --canvas 1440x820 → a fixed page of that size (the gate's render)
//
// Config (assets/shell/websdk/examples/*.json, VERSION.md for the values):
//   theme      'light' | 'dark' — body.sns-uikit.sns-theme-<theme>; the kit's variables live there
//   canvas     'responsive' (default: the page fills the window, the widget follows it as the SDK
//              does) or {width, height} — a fixed page of the frame's size minus its browser bar
//   frame      {fileKey, nodeId, width, height, chrome} — where the state was read; chrome is what the
//              frame draws around the page and the shell never renders: a number is a bar above (80, the
//              browser bar of the 2026-10-05 desktop frames), {top, bottom} a bar above and one below (62
//              and 90, the iOS status bar and the Safari bar of the 2026-10-14 mobile frames). Read by
//              websdkgate.sh, which cuts both before measuring; the shell itself ignores it
//   header     {back, step: [n, total], stepLabel, steps: [{label, state}], toPhone, lang} as
//              controls.js header(); false for no top bar
//   footer     {buttons: [{label, id, type}], flat, html} — the kit's footer; html is what sits under the
//              buttons (the Welcome frame's warning line), so the gate's footer zone sees what the frame
//              draws; false for none
//   content    {bottom, bottomNarrow, minHeight} — content()'s room under the column (72 with a footer
//              button, 16 bare), bottomNarrow the room at and under `narrow` — a class rule, as content()
//              writes it, so a page's media query overrides it without !important
//   whitelabel true (default): the kit's "Powered by Sumsub" under the widget
//   narrow     600 (default): under this width the top bar keeps only the icon-only language button —
//              the frames' rule (375 shows the globe alone), not the kit's; 0 keeps every button
// Prints one JSON line: the slot's selector, the dialog host, the canvas, the header's height, the breakpoint.
'use strict';
// the font: W.css opens with the kit's @font-face — Manrope, embedded by controls.js — so a page
// from here never falls back to the system face
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const W = require(path.join(ROOT, 'assets', 'components', 'websdk', 'controls.js'));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const cfgPath = args.find(a => !a.startsWith('--') && a !== opt('--out') && a !== opt('--canvas'));
if (!cfgPath) { console.error('usage: websdk-shell.js <config.json> [--out page.html] [--fragment] [--canvas WxH]'); process.exit(1); }
if (!fs.existsSync(cfgPath)) { console.error('websdk-shell: no config at ' + cfgPath); process.exit(1); }
let cfg;
try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) { console.error('websdk-shell: ' + cfgPath + ' is not JSON — ' + e.message); process.exit(1); }

const theme = cfg.theme === 'dark' ? 'dark' : 'light';
let canvas = cfg.canvas && typeof cfg.canvas === 'object' ? cfg.canvas : null;
if (opt('--canvas')) { const [w, h] = opt('--canvas').split('x').map(Number); if (!w || !h) { console.error('websdk-shell: --canvas wants WxH'); process.exit(1); } canvas = {width: w, height: h}; }
const narrow = cfg.narrow == null ? 600 : Number(cfg.narrow);
const hdr = cfg.header === false ? null : Object.assign({back: true, step: [1, 3], toPhone: true, lang: 'En'}, cfg.header || {});
const ftr = cfg.footer === false ? null : Object.assign({buttons: [{label: 'Continue', id: 'continue'}]}, cfg.footer || {});
const content = Object.assign({bottom: ftr && ftr.buttons && ftr.buttons.length ? 72 : 16}, cfg.content || {});

const header = hdr ? W.header(Object.assign({}, hdr, narrow ? {toPhoneClass: 'ws-wide', langClass: 'ws-wide', langIconClass: 'ws-narrow'} : {})) : '';
const footer = ftr ? W.footer({flat: ftr.flat, html: ftr.html, buttons: (ftr.buttons || []).map(b => typeof b === 'string' ? W.button({label: b}) : W.button(Object.assign({type: 'primary'}, b)))}) : '';
const room = `:where(.ws-content){--content-bind1:${Number(content.bottom)}px}` + (content.bottomNarrow != null && narrow ? `@media (max-width:${narrow}px){:where(.ws-content){--content-bind1:${Number(content.bottomNarrow)}px}}` : '');
const slot = `<section data-testid="sdk-content" class="${['sdk-content', 'ws-content', content.minHeight && 'sdk-content__withMinHeight'].filter(Boolean).join(' ')}"><div class="sdk-content__SdkContentInner" id="content-slot" data-slot="websdk"></div></section>`;
const widget = W.container(slot + footer);
const logo = fs.readFileSync(path.join(ROOT, 'assets', 'shell', 'websdk', 'icons', 'powered-by-sumsub.svg'), 'utf8').trim();
const whitelabel = cfg.whitelabel === false ? '' : `<div class="ws-whitelabel">${logo}</div>`;

const css = `
html,body{margin:0;height:100%}
body{background:var(--components-widget-page-background);--components-widget-border-width:1px}
#app{${canvas ? `width:${canvas.width}px;height:${canvas.height}px;margin:0 auto;overflow:hidden` : 'height:100vh;height:100dvh'}}
/* the frames of 2026-10-05: 8px at the sides, 4px above the top bar, the widget centred at its max 718 */
.ws-page{display:flex;justify-content:center;padding:0 8px;box-sizing:border-box;height:100%}
/* position: relative — the column hosts modal() and bottomSheet() (absolute, inset 0): the tint over the whole page */
.ws-column{flex:1 0 0;min-width:0;display:flex;flex-direction:column;align-items:center;padding:4px 0 0;box-sizing:border-box;height:100%;position:relative}
.ws-column>main{width:100%;min-height:0}
/* Whitelabel Wrapper: 38 high, the 138×22 logo 8 from the top, in the kit's white-label grey */
.ws-whitelabel{display:flex;justify-content:center;padding:8px 0;width:100%;max-width:718px;flex-shrink:0;color:var(--components-white-label-grey-background-normal)}
.ws-whitelabel svg{display:block}
.ws-narrow{display:none !important}
${room}
${narrow ? `@media (max-width:${narrow}px){.ws-wide{display:none !important}.ws-narrow{display:inline-flex !important}}` : ''}
`;
const markup = `<div id="app"><div class="ws-page"><div class="ws-column">${header}${widget}${whitelabel}</div></div></div>`;
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(cfg.title || 'Prototype').replace(/</g, '&lt;')}</title>
<style>${W.css}${css}</style></head>
<body class="sns-uikit sns-theme-${theme}">${markup}
<script>${W.script}</script></body></html>`;
const fragment = `<style>${W.css}${css}</style>\n${markup}\n<script>${W.script}</script>`;

if (args.includes('--fragment')) process.stdout.write(fragment);
else if (opt('--out')) fs.writeFileSync(opt('--out'), page);
else process.stdout.write(page);
const meta = {profile: 'websdk', theme, canvas: canvas || 'responsive', slot: '#content-slot', dialogs: '.ws-column', header: hdr ? 68 : 0, widgetMax: 718, contentMax: 506, narrow, contentBottom: content.bottom};
if (opt('--out') || args.includes('--fragment')) (args.includes('--fragment') ? process.stderr : process.stdout).write(JSON.stringify(meta) + '\n');
