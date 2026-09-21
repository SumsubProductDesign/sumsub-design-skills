#!/usr/bin/env node
// dscheck.js [--record] [--only <component>] [--json] — has the design system moved
// under the components?
//
// assets/components/VERSION.md records values read from the product's own Storybook
// on a date, and a record goes stale silently: controls.js keeps rendering last
// quarter's radius and nothing complains. This walks the same stories, reads the
// same properties out of the live pages and prints every value that no longer
// matches.
//
//   dscheck.js                 check everything in assets/components/storybook.json
//   dscheck.js --only input    one component
//   dscheck.js --record        write the live values into that file — then read the
//                              diff in git, fix controls.js and VERSION.md, and
//                              commit only what you understand
//   dscheck.js --vars --components-status-
//                              print the design system's own resolved variables under
//                              a prefix, sorted. This is how a palette is read when a
//                              new component is added, instead of a browser pane
//
// Needs the network and Chrome; takes about half a minute. A check may carry
// `"click": "<selector>"`, which is clicked in the story before reading — that is how
// the modal, the select's menu and anything else that exists only after a click get
// watched. What is still out of reach: hover and focus, which stay a human look
// (Step 7). A story that does not render in time is reported as `unread`, never as a
// match.
//
// How it works, and why it is not simpler: a story's computed styles can only be
// read from a page in the same origin, so _dsproxy.cjs serves both the probe page
// and the Storybook from one localhost origin. The page posts its answer back when
// its reads are stable, because --virtual-time-budget outruns the stylesheets and a
// story measured before its CSS arrives reads as transparent. Stories are loaded a
// few at a time: a dozen Storybook frames at once starve each other and half of
// them never render.
const fs = require('fs'), path = require('path'), os = require('os'), {spawn} = require('child_process');
const {CHROME} = require(path.join(__dirname, '_chrome.cjs'));
const {start} = require(path.join(__dirname, '_dsproxy.cjs'));

const SPEC = path.join(__dirname, '..', 'assets', 'components', 'storybook.json');
const args = process.argv.slice(2);
const RECORD = args.includes('--record'), JSONOUT = args.includes('--json');
const VARS = args.includes('--vars') ? (args[args.indexOf('--vars') + 1] || '--components-') : null;
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const FRAME = (spec.frame || '1000x420').split('x').map(Number);
const BATCH = spec.batch || 3;
const WAIT = spec.waitMs || 20000;
const groups = spec.components.filter(c => !ONLY || c.component === ONLY);
if (!groups.length) {
  console.error('no component called ' + ONLY + ' in ' + path.relative(process.cwd(), SPEC));
  process.exit(1);
}

// every check, tagged with its component, then grouped into batches of stories
const all = groups.flatMap(g => g.checks.map(c => ({component: g.component, ...c})));
const stories = [...new Set(all.map(c => c.story))];
const batches = [];
for (let i = 0; i < stories.length; i += BATCH) batches.push(stories.slice(i, i + BATCH));

// --vars: every custom property under a prefix, resolved on the story's own root
// no-font: these two pages show the Storybook's own stories in iframes and render none of our
// components, so they declare no face of their own. Every page that DOES render them must, and
// lint checks it — a generated page spent two days in the system face before that rule existed.
const varsPage = prefix => `<!doctype html><meta charset="utf-8">
<iframe id=f style="display:block;width:${FRAME[0]}px;height:${FRAME[1]}px;border:0" src="/iframe.html?id=${spec.varsStory || 'design-system-snsstatus--playground'}&viewMode=story"></iframe>
<script>
const seen = {}, want = ${JSON.stringify(prefix)};
const grab = () => {
  const d = document.getElementById('f').contentDocument;
  if (!d || d.readyState !== 'complete' || !d.styleSheets.length) return false;
  const root = d.querySelector('.sns-ds-root') || d.documentElement;
  let any = false;
  for (const ss of d.styleSheets) {
    try {
      for (const r of ss.cssRules) {
        if (!r.style) continue;
        for (const prop of r.style) {
          if (prop.indexOf(want) !== 0 || seen[prop] !== undefined) continue;
          const v = getComputedStyle(root).getPropertyValue(prop).trim();
          if (v) { seen[prop] = v; any = true; }
        }
      }
    } catch (e) {}
  }
  return any;
};
let quiet = 0;
const started = Date.now();
const tick = () => {
  const got = grab();
  // nothing counts as quiet until at least one variable has arrived: an empty answer
  // one second in is a story that has not loaded, not a prefix that matches nothing
  quiet = got ? 0 : (Object.keys(seen).length ? quiet + 1 : 0);
  if (quiet < 4 && Date.now() - started < ${WAIT}) return setTimeout(tick, 500);
  fetch('/_result', {method: 'POST', body: JSON.stringify(seen)});
};
setTimeout(tick, 1000);
</script>`;

const probePage = checks => `<!doctype html><meta charset="utf-8"><div id=out>pending</div><div id=box></div>
<script>
const C = ${JSON.stringify(checks)}, WAIT = ${WAIT};
const box = document.getElementById('box'), frames = {};
for (const c of C) if (!frames[c.story]) {
  const f = document.createElement('iframe');
  f.style.cssText = 'display:block;width:${FRAME[0]}px;height:${FRAME[1]}px;border:0';
  f.src = '/iframe.html?id=' + c.story + '&viewMode=story';
  frames[c.story] = f; box.appendChild(f);
}
const val = (el, key) => {
  const r = el.getBoundingClientRect(), c = getComputedStyle(el);
  if (key === 'h') return String(Math.round(r.height));
  if (key === 'w') return String(Math.round(r.width));
  return c[key] === undefined ? 'no such property' : String(c[key]);
};
const ready = () => Object.keys(frames).every(id => {
  try { const d = frames[id].contentDocument; return d && d.readyState === 'complete' && d.styleSheets.length > 0; }
  catch (e) { return false; }
});
const clicked = {};
const doClicks = () => {                   // each check's click selector, once
  for (const c of C) {
    if (!c.click) continue;
    const key = c.story + '|' + c.click;
    if (clicked[key]) continue;
    try {
      const d = frames[c.story].contentDocument;
      const el = d && d.querySelector(c.click);
      if (el) { el.click(); clicked[key] = true; }
    } catch (e) {}
  }
};
const started = Date.now();
let last = '', stable = 0;
const tick = () => {
  doClicks();
  const res = [];
  let pending = 0;
  for (const c of C) {
    let el = null;
    try { const d = frames[c.story].contentDocument; el = d && d.querySelector(c.sel); } catch (e) { el = null; }
    if (!el) { pending++; res.push({component: c.component, what: c.what, unread: true}); continue; }
    const live = {};
    for (const k of Object.keys(c.expect)) live[k] = val(el, k);
    res.push({component: c.component, what: c.what, live: live});
  }
  const now = JSON.stringify(res);
  // three identical reads in a row: a story whose CSS has not arrived answers with
  // transparent colours, and those would otherwise be recorded as a change
  const clicksDone = C.every(c => !c.click || clicked[c.story + '|' + c.click]);
  stable = (now === last && !pending && ready() && clicksDone) ? stable + 1 : 0;
  last = now;
  if (stable < 3 && Date.now() - started < WAIT) return setTimeout(tick, 400);
  document.getElementById('out').textContent = now;
  fetch('/_result', {method: 'POST', body: now});
};
setTimeout(tick, 800);
</script>`;

function run(probe, nStories) {
  return new Promise(resolve => {
    let settle;
    const answer = new Promise(r => { settle = r; });
    const srv = start({probe: probe, upstream: spec.upstream, onResult: b => settle(b)});
    const port = srv.address().port;
    const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=' + (FRAME[0] + 40) + ',' + (nStories * FRAME[1] + 120),
      'http://localhost:' + port + '/_probe'], {stdio: 'ignore'});
    const bail = setTimeout(() => settle(null), WAIT + 30000);
    answer.then(body => {
      clearTimeout(bail); ch.kill('SIGKILL'); srv.close();
      resolve(body ? JSON.parse(body) : null);
    });
  });
}

async function main() {
  if (VARS) {
    const got = await run(varsPage(VARS), 1);
    if (!got) { console.error('dscheck: the probe page never answered'); process.exit(2); }
    const keys = Object.keys(got).sort();
    for (const k of keys) console.log(k + ' = ' + got[k]);
    console.log(`dscheck: ${keys.length} variables under ${VARS}`);
    process.exit(keys.length ? 0 : 1);
  }
  const out = [];
  for (const b of batches) {
    const checks = all.filter(c => b.includes(c.story));
    const got = await run(probePage(checks), b.length);
    out.push(...(got || checks.map(c => ({component: c.component, what: c.what, unread: true}))));
  }

  let changed = 0, unread = 0, checked = 0;
  const lines = [];
  for (const g of groups) for (const c of g.checks) {
    const r = out.find(o => o.component === g.component && o.what === c.what);
    if (!r || r.unread) {
      unread++;
      lines.push(`${g.component} / ${c.what}: unread — ${c.sel} never appeared in ${c.story}`);
      continue;
    }
    checked++;
    if (RECORD) { c.expect = r.live; continue; }
    const diff = Object.keys(c.expect).filter(k => String(c.expect[k]) !== String(r.live[k]));
    if (diff.length) {
      changed++;
      for (const k of diff) lines.push(`${g.component} / ${c.what}: ${k} recorded ${c.expect[k]}, live ${r.live[k]}`);
    }
  }

  if (RECORD) {
    spec.taken = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(SPEC, JSON.stringify(spec, null, 2) + '\n');
    console.log(`recorded ${checked} values into ${path.relative(process.cwd(), SPEC)} (${unread} unread). Read the diff before committing.`);
    process.exit(unread ? 1 : 0);
  }
  if (JSONOUT) { console.log(JSON.stringify({checked, changed, unread, lines}, null, 2)); process.exit(changed || unread ? 1 : 0); }
  for (const l of lines) console.log(l);
  console.log(`dscheck: ${checked} values checked against the ${spec.taken} record, ${changed} changed, ${unread} unread` +
    (changed || unread ? ' — fix controls.js and assets/components/VERSION.md, then re-run' : ' — the record still matches the product'));
  process.exit(changed || unread ? 1 : 0);
}

main().catch(e => { console.error('dscheck: ' + (e && e.message)); process.exit(2); });
