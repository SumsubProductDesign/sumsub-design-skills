// gen.js — <SCREEN NAME> (Figma <fileKey> / <nodeId>) in the default shell, elastic list content.
// Copy this file into the project as gen.js and fill the three marked places. Everything else stays:
// the shell is rendered by shell.js from _work/shell.json, the content is injected into #content-slot with
// an anchor check, and the build asserts the table appears exactly once (Step 3).
// usage: node gen.js [--canvas WxH]   → <out>.html (viewport) or _work/gen/fixed.html for the gate
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
const args = process.argv.slice(2), canvasOpt = (i => i >= 0 ? args[i + 1] : null)(args.indexOf('--canvas'));
const OUT_NAME = 'page.html';                                                        // ← 0. the deliverable's name
const out = canvasOpt ? path.join(__dirname, '_work/gen/fixed.html') : path.join(__dirname, OUT_NAME);
fs.mkdirSync(path.dirname(out), {recursive: true});
cp.execFileSync('node', [path.join(SKILL, 'scripts/shell.js'), path.join(__dirname, '_work/shell.json'), '--out', out, ...(canvasOpt ? ['--canvas', canvasOpt] : [])]);
let page = fs.readFileSync(out, 'utf8');

// assets: figctx.py <context> --assets _work/assets  puts every img const there as <name>.svg
const A = path.join(__dirname, '_work/assets');
const svg = (name, w, h) => fs.readFileSync(path.join(A, name + '.svg'), 'utf8').replace(/<\?xml[^>]*>/, '')
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

const {css, html} = render(spec, svg);
const anchor = /(<div id="content-slot"[^>]*>)<\/div>/;
if (!anchor.test(page) || !page.includes('</style></head>')) { console.error('anchor missing in the shell page'); process.exit(1); }
page = page.replace('</style></head>', css + cellCss + '</style></head>').replace(anchor, `$1${before}${html}</div>`);
if ((page.match(/class="lt"/g) || []).length !== 1) { console.error('table injected more than once'); process.exit(1); }
fs.writeFileSync(out, page);
console.log(JSON.stringify({out, bytes: page.length, rows: spec.rows.length}));
