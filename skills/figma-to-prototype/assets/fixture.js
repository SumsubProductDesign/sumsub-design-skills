// the whole-page fixture: one realistic page out of the shell and the library, rendered and
// compared with a stored PNG. Component-by-component checks pass while a page is broken —
// doubled card padding, a colour cascading into a nested card, a named icon button growing
// into a text button — so this renders them together and looks at the result.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const C = require(path.join(ROOT, 'assets/components/controls.js'));
const out = process.argv[2] || '/tmp/fixture.html';
const cfg = {
  layout: 'fullscreen', island: false, canvas: {width: 1200, height: 900},
  client: 'Key name',
  page: {section: 'Section', title: 'Record title', keyName: 'Key name',
         tabs: ['One', 'Two'], activeTab: 'One',
         actions: [{icon: 'header-applicant-link', label: 'Open', iconOnly: true}, '|', 'Secondary',
                   {label: 'Approve', type: 'primary', status: 'success'}],
         info: [{tag: 'VIP', color: 'purple'}, {label: 'ID: 1', iconRight: 'header-copy'},
                {label: 'Add tag', type: 'tertiary', icon: 'header-tag'}]},
  menu: {active: ['Applicants']}, hover: false
};
const cfgPath = out.replace(/\.html$/, '.json');
fs.writeFileSync(cfgPath, JSON.stringify(cfg));
cp.execFileSync('node', [path.join(ROOT, 'scripts/shell.js'), cfgPath, '--out', out]);
let page = fs.readFileSync(out, 'utf8');

const inner = C.card({size: 'large', title: 'Nested card',
  body: C.dataList([{label: 'Country', value: 'Germany'}, {label: 'First name', value: 'Freya'}])});
const body = `<div class="fx">
  <aside class="fx-side">${C.group([C.radio({label: 'Valid until', checked: true, name: 'v'}),
                                    C.radio({label: 'Valid indefinitely', name: 'v'})],
                                   {horizontal: true, title: 'Document validity'})}
    ${C.input({size: 'medium', title: 'First name', value: 'Freya', titleRight: 'FREYA'})}
    ${C.status({size: 'medium', color: 'green', label: 'Approved'})}</aside>
  <main class="fx-main">
    ${C.button({type: 'secondary', size: 'medium', label: 'Add document', iconRight: C.kbd(['⇧', 'A'])})}
    ${C.card({size: 'large', color: 'yellow', title: 'Coloured card', body: inner})}
  </main></div>`;
page = page.replace(/(<div id="content-slot"[^>]*>)(<\/div>)/, (m, o) => o + body + '</div>');
page = page.replace('</head>', `<style>${C.css}
.fx{display:flex;align-items:flex-start;gap:24px;padding:16px}
.fx-side{flex:0 0 320px;display:flex;flex-direction:column;align-items:flex-start;gap:16px}
.fx-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:16px}
.fx-main > .c-card{align-self:stretch}
#content-slot{height:auto;min-height:100%}</style></head>`);
fs.writeFileSync(out, page);
console.log(out);
