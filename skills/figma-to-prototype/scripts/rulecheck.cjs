#!/usr/bin/env node
// rulecheck.cjs <rules.json> [--markdown] [--only 'case substring']
//
// A prototype whose point is a rule — "change one letter and the error type is Typo, clear the
// field and it is Missing" — is checked against that rule as a table, not by a handful of walks
// written from memory. The rows come from the person (Step 0, *data and rules the frames do not
// show*), live in _work/rules.json, and are the spec: the page's logic reads the same rows, each
// row is one check in a fresh process, and the handoff shows the table with its results.
// On 2026-10-02 the OCR demo's diff rules arrived in a late round, after the logic had been
// guessed, and ten scripted walks were the only evidence it matched them.
//
//   { "page": "ocr-report.html", "size": "1440x1080", "hash": "",
//     "setup": "R.click('#report')",                     // optional, before every row
//     "rows": [
//       { "case":  "one letter changed",                  // what the row demonstrates
//         "input": "Last name: Ivanov → Ivanova",          // the same in words, for the handoff
//         "do":    "R.type('#f-last', 'Ivanova')",
//         "read":  "R.text('#t-last')",                    // an expression; its value is compared
//         "want":  "Typo" } ] }
//
// Helpers inside "setup", "do" and "read" (all throw with a reason, so a broken row says why):
//   R.type(sel, text)   set a field's value as typing would, then input and change events
//   R.click(sel)        a click where a person would click: elementFromPoint at the centre must be
//                       the element or inside it, or the row fails with what covers it
//   R.pick(sel, label)  open a select (native or the library's) and choose the option by its text
//   R.text(sel)         visible text, whitespace folded;  R.val(sel)  a field's value
//   R.shown(sel)        true when the element is rendered
//
// Prints one line per row and exits 3 if any row fails. --markdown prints the table for the
// handoff's § Rules instead: case, input, wanted outcome, and the result of this run.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

const argv = process.argv.slice(2);
const file = argv.find(a => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--only');
const md = argv.includes('--markdown');
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : '';
if (!file) { console.error("usage: rulecheck.cjs <rules.json> [--markdown] [--only 'case']"); process.exit(2); }
let spec;
try { spec = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (e) { console.error(`rulecheck: ${file} — ${e.message}`); process.exit(2); }
const base = path.dirname(path.resolve(file));
const page = spec.page && (path.isAbsolute(spec.page) ? spec.page : [path.resolve(spec.page), path.resolve(base, spec.page)].find(p => fs.existsSync(p)));
if (!page || !fs.existsSync(page)) { console.error(`rulecheck: page not found: ${spec.page}`); process.exit(2); }
const rows = (spec.rows || []).filter(r => !only || String(r.case).includes(only));
if (!rows.length) { console.error('rulecheck: no rows' + (only ? ` matching "${only}"` : '')); process.exit(2); }
const bad = rows.filter(r => !r.case || !r.read || !('want' in r));
if (bad.length) { console.error('rulecheck: every row needs case, read and want — ' + JSON.stringify(bad[0])); process.exit(2); }

const HELPERS = String.raw`var R=(function(){
  function q(s){var e=typeof s==='string'?document.querySelector(s):s;if(!e)throw new Error('no element '+s);return e}
  function nm(e){if(!e)return 'nothing';var s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;
    var c=(typeof e.className==='string'?e.className:'').trim().split(/\s+/).filter(Boolean).slice(0,2);return s+(c.length?'.'+c.join('.'):'')}
  function fire(el,x,y){['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
    var E=t.indexOf('pointer')===0&&window.PointerEvent?PointerEvent:MouseEvent;
    el.dispatchEvent(new E(t,{bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y,button:0,view:window}))})}
  function click(s){var e=q(s);e.scrollIntoView({block:'nearest',inline:'nearest'});var b=e.getBoundingClientRect();
    if(b.width<1||b.height<1)throw new Error('click on '+s+': not rendered');
    var x=b.left+b.width/2,y=b.top+b.height/2,h=document.elementFromPoint(x,y);
    if(!h||!(h===e||e.contains(h)))throw new Error('click on '+s+' lands on '+nm(h)+', which covers it');
    fire(h,x,y);if(h.focus&&/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(h.tagName))h.focus()}
  function type(s,v){var e=q(s);e.focus&&e.focus();
    if(e.isContentEditable){e.textContent=v}else{var p=Object.getPrototypeOf(e),d=Object.getOwnPropertyDescriptor(p,'value');
      if(!d||!d.set)throw new Error('type into '+s+': not a field');d.set.call(e,v)}
    e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
  function fold(t){return String(t||'').replace(/ /g,' ').replace(/\s+/g,' ').trim()}
  function pick(s,label){var e=q(s);
    if(e.tagName==='SELECT'){var o=[].find.call(e.options,function(o){return fold(o.text)===label});
      if(!o)throw new Error('pick '+label+' in '+s+': no such option');e.value=o.value;e.dispatchEvent(new Event('change',{bubbles:true}));return}
    click(e.querySelector('.c-input-box')||e);
    var opts=[].slice.call(document.querySelectorAll('[role=option],.c-opt')).filter(function(o){var t=String(o.innerText||'');return o.getClientRects().length&&(fold(t)===label||fold(t.split('\n')[0])===label)});   // an option with a caption: its first line is the label
    if(!opts.length)throw new Error('pick '+label+' in '+s+': no visible option with that text');click(opts[0])}
  return {q:q,click:click,type:type,pick:pick,
    text:function(s){return fold(q(s).innerText)},val:function(s){return q(s).value},
    shown:function(s){var e=document.querySelector(s);return !!(e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden')}}})();`;

const sc = path.join(__dirname, 'statecheck.sh');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rulecheck-'));
const want = r => JSON.stringify(r.want);
const run = (r, i) => new Promise(res => {
  const js = path.join(tmp, `r${i}.js`);
  fs.writeFileSync(js, HELPERS + '\n' + (spec.setup ? spec.setup + ';\n' : '') + (r.do ? r.do + ';\n' : ''));
  const args = [page, '--size', spec.size || '1440x900', '--js-file', js, '--probe', 'return (' + r.read + ')'];
  if (spec.hash) args.push('--hash', spec.hash);
  cp.execFile(sc, args, { maxBuffer: 1 << 24 }, (err, out) => {
    const got = ((out || '').match(/^probe : (.*)$/m) || [, 'NOT RUN'])[1];
    res({ r, got, ok: got === want(r) });
  });
});
(async () => {
  const results = [];
  for (let i = 0; i < rows.length; i += 4) results.push(...await Promise.all(rows.slice(i, i + 4).map((r, j) => run(r, i + j))));
  fs.rmSync(tmp, { recursive: true, force: true });
  const fails = results.filter(x => !x.ok).length;
  if (md) {
    const cell = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    console.log('| case | input | outcome | this run |\n|---|---|---|---|');
    for (const { r, got, ok } of results)
      console.log(`| ${cell(r.case)} | ${cell(r.input || r.do || '')} | ${cell(typeof r.want === 'string' ? r.want : JSON.stringify(r.want))} | ${ok ? 'pass' : 'FAIL: ' + cell(got)} |`);
  } else {
    for (const { r, got, ok } of results)
      console.log(`${ok ? 'ok  ' : 'FAIL'}  ${r.case}${ok ? '' : ` — want ${want(r)}, got ${got}`}`);
    console.log(`rules : ${results.length} rows · ${results.length - fails} pass · ${fails} FAIL`);
  }
  process.exit(fails ? 3 : 0);
})();
