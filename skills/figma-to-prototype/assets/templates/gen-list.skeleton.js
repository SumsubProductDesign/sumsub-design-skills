// gen.js — <SCREEN NAME> (Figma <fileKey> / <nodeId>) in the default shell, elastic list content.
// Copy this file into the project as gen.js and fill the three marked places. Everything else stays:
// the shell is rendered by shell.js from _work/shell.json, the content is injected into #content-slot with
// an anchor check, and the build asserts the table appears exactly once (Step 3).
// usage: node gen.js [--canvas WxH]   → <out>.html (viewport) or _work/gen/fixed.html for the gate
//        node gen.js --block WxH       → _work/gen/block.html: the content alone, for blockgate.sh
const fs = require('fs'), path = require('path'), cp = require('child_process');
// the skill's root, from the environment — never a path written into this file. The skill moves:
// a plugin installs it under a versioned directory that changes with every update, and a baked path
// then fails in a session weeks later, far from the edit that caused it.
const SKILL = process.env.SKILL;
if (!SKILL || !fs.existsSync(path.join(SKILL, 'scripts/shell.js'))) {
  console.error('set SKILL to the skill folder first:  export SKILL=<the folder SKILL.md lives in>');
  process.exit(1);
}
const {render} = require(path.join(SKILL, 'assets/templates/list-table.js'));
const args = process.argv.slice(2), opt = k => (i => i >= 0 ? args[i + 1] : null)(args.indexOf(k));
const canvasOpt = opt('--canvas'), blockOpt = opt('--block');
const OUT_NAME = 'page.html';                                                        // ← 0. the deliverable's name
// the project root: this file lives at _work/gen/gen.js (Step 3), two levels down — or at the root, when
// copied there; every project path hangs off ROOT, never off __dirname (two runs had to add this by hand)
const ROOT = fs.existsSync(path.join(__dirname, '_work')) ? __dirname : path.resolve(__dirname, '..', '..');
// every mode decides its output path HERE, before anything is written: a generator that rendered the shell
// into the deliverable's path and branched afterwards overwrote a finished prototype with a bare shell
// (2026-10-06). Only the plain build writes OUT_NAME
const out = blockOpt ? path.join(ROOT, '_work/gen/block.html')
  : canvasOpt ? path.join(ROOT, '_work/gen/fixed.html') : path.join(ROOT, OUT_NAME);
const shellOut = blockOpt ? path.join(ROOT, '_work/gen/block-shell.html') : out;
fs.mkdirSync(path.dirname(out), {recursive: true});
const shellInfo = JSON.parse(cp.execFileSync('node', [path.join(SKILL, 'scripts/shell.js'), path.join(ROOT, '_work/shell.json'), '--out', shellOut,
  ...((blockOpt || canvasOpt) ? ['--canvas', blockOpt || canvasOpt] : [])]).toString());
let page = fs.readFileSync(shellOut, 'utf8');

// assets: figctx.py <context> --assets _work/assets  puts every img const there as <name>.svg
const A = path.join(ROOT, '_work/assets');
// uniq: ids unique per copy — a gradient/clipPath id is document-wide, and a hidden first copy blanks the visible one (scripts/_svg.cjs)
const {uniq} = require(path.join(SKILL, 'scripts', '_svg.cjs'));
// a missing icon is a one-line error naming it, not an ENOENT stack: on 2026-09-28 an edit script wiped
// icon definitions twice, and the build that followed had to say which ones
const svg = (name, w, h) => uniq((fs.existsSync(path.join(A, name + '.svg')) ? fs.readFileSync(path.join(A, name + '.svg'), 'utf8')
    : (() => { throw new Error(`icon "${name}" is not in ${A} — figctx.py --assets writes it, or the name is misspelled`); })()).replace(/<\?xml[^>]*>/, ''))
  .replace(/<svg([^>]*)>/, (m, at) => `<svg${(at.match(/\sviewBox="[^"]*"/) || [''])[0]}${(at.match(/\sfill="[^"]*"/) || [''])[0]} xmlns="http://www.w3.org/2000/svg" style="display:block;width:${w}px;height:${h}px">`);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ── 1. DATA — every string from the design context, in row order (figctx.py --split "Table Row")
const rows = [
  // {name: '…', id: '…'},
];

// ── 2. SPEC — column rules from the design context tokens: `w-[248px] shrink-0` → {width: 248};
//      `flex-[1_0_0] min-w-[200px]` → {flex: 1, min: 200}; a row-only column → hideInHeader: true
const spec = {
  columns: [
    // {key: 'chk', label: '__checkbox__', width: 40},
    // {key: 'name', label: 'Name', width: 248},
    // {key: 'status', label: 'Status', flex: 1, min: 200},
  ],
  // toolbar: {search: {placeholder: '…', width: 400, icon: 'imgNormalSearch'}, left: [{icon}], right: [{icon, label, primary: true}]},
  rows: rows.map(r => ({
    // name: `<span class="rn">${esc(r.name)}</span>`,       // ← cell inner markup per column key
  })),
  // footer: {show: '10', found: '46', chevron: 'imgNormalChevronDown', page: {of: '100', prev: 'img…', next: 'img…'}},
};

// ── 3. CELL STYLES — what is inside the cells; the boxes, paddings and dividers come from the template.
//      The tallest cell sets the row height (a 32 button in a py-16 cell makes the row 64, as in Figma) —
//      never shrink it with a negative margin to "fix" the row.
const cellCss = `
.rn{color:#1e2939;white-space:nowrap}
`;

// ── anything above the table (alerts, section titles) goes here as DOM boxes with width:100%
const before = ``;

const {css, html, script} = render(spec, svg);   // script: controls.js's live states and the expanding rows
// --block: the content alone, at the slot's width, with the shell's fonts (no-font: the shell's own <style>, @font-face
// included, is copied in) — what blockgate.sh compares with the
// design node's own render (it aligns by ink, so the shell must not be in it)
if (blockOpt) {
  const style = (page.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
  const block = `<!doctype html><html><head><meta charset="utf-8">${style}<style>body{margin:0;background:#fff}${css}${cellCss}</style></head>`
    + `<body><div id="app" style="position:relative;width:${shellInfo.contentOrigin.w}px">${before}${html}</div><script>${script}<\/script></body></html>`;
  fs.writeFileSync(out, block);
  console.log(JSON.stringify({out, block: true, width: shellInfo.contentOrigin.w}));
  process.exit(0);
}
const anchor = /(<div id="content-slot"[^>]*>)<\/div>/;
if (!anchor.test(page) || !page.includes('</style></head>')) { console.error('anchor missing in the shell page'); process.exit(1); }
// function replacers, never a string: String.prototype.replace reads `$$`, `$&` and `$1` INSIDE the
// replacement text, so any css or html carrying a `$` (a script with `$$`, a price, a regex) is
// silently rewritten. On 2026-09-24 a counter stopped updating with no error at all — its `$$` had
// become `$` on the way in. A function returns its text untouched
page = page.replace('</style></head>', () => css + cellCss + '</style></head>').replace(anchor, (m, open) => open + before + html + '</div>')
  .replace('</body>', () => '<script>' + script + '<\/script></body>');
if ((page.match(/class="lt"/g) || []).length !== 1) { console.error('table injected more than once'); process.exit(1); }
fs.writeFileSync(out, page);
console.log(JSON.stringify({out, bytes: page.length, rows: spec.rows.length}));
