#!/usr/bin/env node
// sbkit.cjs [--spec assets/components/websdk/stories.json] [--out <dir>] [--only <Component>] [--limit N]
//   — a snapshot of the WebSDK UI kit, taken from its Storybook: the CSS as the components apply it
//   and the markup of every story the spec names, with the build's hashed class names replaced by
//   stable ones.
//
// Why a snapshot and not a hand-written library: the kit is Vue with CSS Modules. Its class names
// are hashed per build (`_button_4dpt3_1` on 2026-10-05 was `_button_9pfi4_1` three days later),
// its component styles are injected lazily as a component mounts, and the `v-bind()` variables in
// its styles (`--v65923a60`) are hashed too. iframe.css alone misses the lazy part — a run that
// used it lacked the icon block's sizes and `--semantic-spacing-sm`. So the kit is read from the
// live stories, in a real page over the DevTools protocol (scripts/_cdp.cjs, Node 22+), and every
// hash is renamed through one table: `_button_9pfi4_1` → `sdk-button`, `_primary_9pfi4_41` →
// `sdk-button__primary`, `_SdkHeader_1oywt_1` → `sdk-header`. A generator or a project stylesheet
// written against those names survives the next capture; the hashes do not.
//
// How a hash finds its component: a module (one hash) is owned by the component whose spec entry
// pins it (`owns`: a name, or a list of names the module must all have; the most specific pin
// wins), else by the component whose name one of its classes carries (`SdkHeader`, `button` for
// SdkButton) when the module shows in that component's stories, else — a module seen in one
// component's stories only — by that component, else by the earliest spec entry whose stories
// show it (reported as shared). The result goes to modules.json; read it after a capture, and pin
// a wrong guess with `owns`.
//
// Output, in the spec's folder (or --out):
//   kit.css            every rule the stories applied, deduplicated, Storybook's own UI rules
//                      and its Nunito Sans dropped, hashes renamed; the kit's Google Fonts
//                      families are listed in its header, not embedded
//   markup/<Component>/<story>.html        the story's root markup, renamed, Vue's <!----> removed
//   markup/<Component>/<story>.open.html   the dialog a `click` opened, with its overlay
//   icons/<name>.svg   the kit's icon set, from SdkIcon/all-icons, without the story's attributes
//   flags/<CODE>.svg   the kit's flags, from SdkFlag/grid
//   modules.json       hash → component → {old name: new name}, the v-bind variables and the
//                      scoped-style attributes (data-v-6c8e41d0 → data-s-checkbox, named after the
//                      first element that carries one)
//   snapshot.json      per story: the root element's size, font, colours, radius — what
//                      VERSION.md's tables are written from
//   VERSION.md         the block between <!-- sbkit --> markers is rewritten; the rest is kept
//
// Needs the network, Chrome and Node 22+; about three seconds a story.
'use strict';
const fs = require('fs'), path = require('path');
const {launch} = require(path.join(__dirname, '_cdp.cjs'));

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SPEC = path.resolve(opt('--spec', path.join(__dirname, '..', 'assets', 'components', 'websdk', 'stories.json')));
const OUT = path.resolve(opt('--out', path.dirname(SPEC)));
const ONLY = opt('--only', null);
const LIMIT = Number(opt('--limit', 0));
if (!fs.existsSync(SPEC)) { console.error('sbkit: no spec at ' + SPEC); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const UP = 'https://' + spec.upstream;
const [FW, FH] = (spec.frame || '1000x800').split('x').map(Number);
const WAIT = spec.waitMs || 15000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const kebab = s => s.replace(/^Sdk/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase();
const storyKebab = s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const HASHED = /_([A-Za-z][\w-]*)_([a-z0-9]{5})_(\d+)/g;          // a CSS Modules class: _name_hash_n
const BIND = /--v[0-9a-f]{8}\b/g;                                    // a v-bind() variable
const SCOPE = /data-v-[0-9a-f]{8}\b/g;                               // a scoped style's attribute
const SB_RULE = /(^|[\s,>+~(])(\.sb-|#storybook|\.docs-story|\.sbdocs|body\.sb-)/;
// Storybook's own rules: a bare selector, or the inner blocks of an @media / @supports — those
// are cut out block by block, and an at-rule left empty is dropped
function clean(r) {
  if (/^@(media|supports)/.test(r)) {
    const open = r.indexOf('{'), head = r.slice(0, open), body = r.slice(open + 1, r.lastIndexOf('}'));
    const blocks = []; let depth = 0, start = 0;
    for (let i = 0; i < body.length; i++) { if (body[i] === '{') depth++; else if (body[i] === '}' && --depth === 0) { blocks.push(body.slice(start, i + 1)); start = i + 1; } }
    const kept = blocks.filter(b => !SB_RULE.test(b.slice(0, b.indexOf('{'))));
    return kept.length ? head + '{' + kept.join('') + '}' : null;
  }
  if (/^@font-face/.test(r) && /sb-common-assets/.test(r)) return null;
  if (/^@(-webkit-)?keyframes sb-/.test(r)) return null;
  return SB_RULE.test(r.slice(0, r.indexOf('{'))) ? null : r;
}

// what the page is asked, once a story has settled
const COLLECT = `(() => {
  const own = sh => !sh.href || sh.href.indexOf(location.origin) === 0;
  const rules = [];
  for (const sh of document.styleSheets) { if (!own(sh)) continue; try { for (const r of sh.cssRules) rules.push(r.cssText); } catch (e) {} }
  const root = document.querySelector('#storybook-root');
  const first = root && root.firstElementChild;
  // the story's root is often a wrapper the story adds; the component is the first element that
  // carries one of the kit's hashed classes
  const comp = root && [...root.querySelectorAll('*')].find(e => /(^|\s)_[A-Za-z][\w-]*_[a-z0-9]{5}_\d+(\s|$)/.test(e.getAttribute('class') || ''));
  const read = el => { if (!el) return null; const b = el.getBoundingClientRect(), c = getComputedStyle(el);
    return {tag: el.tagName.toLowerCase(), w: +b.width.toFixed(2), h: +b.height.toFixed(2), font: c.fontFamily.split(',')[0].replace(/"/g, ''),
            size: c.fontSize, weight: c.fontWeight, line: c.lineHeight, color: c.color, bg: c.backgroundColor, radius: c.borderRadius, padding: c.padding}; };
  const m = read(comp || first);
  return {rules, html: root ? root.innerHTML : '', bodyClass: document.body.className,
          fonts: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href).filter(h => /fonts\\.googleapis/.test(h)), measure: m};
})()`;
const OPEN = '[role=dialog],[role=menu],[role=listbox]';
// what a click opened: the kit portals a dialog, a sheet or a menu into the body beside the
// story's root, so the open state is every body child that is not the root — the overlay, the
// dialog and its wrapper together
const PORTAL = `(() => [...document.body.children].filter(e => !/^storybook/.test(e.id) && !/(^|\\s)sb-/.test(e.className || '') && !/^(script|style|link)$/i.test(e.tagName) && (e.innerHTML.trim() || e.className)).map(e => e.outerHTML).join('\\n') || null)()`;

async function settled(b) {
  // the root has rendered, and the number of rules has stopped growing (component styles arrive lazily)
  const ok = await b.until('(function(){var r=document.querySelector("#storybook-root");return r&&r.children.length>0})()', WAIT);
  if (!ok) return false;
  let last = -1, quiet = 0; const t0 = Date.now();
  while (Date.now() - t0 < WAIT) {
    const n = await b.eval('(function(){var n=0;for(const s of document.styleSheets){try{n+=s.cssRules.length}catch(e){}}return n})()');
    quiet = n === last ? quiet + 1 : 0; last = n;
    if (quiet >= 4) return true;     // four polls with no new rule = 1 s of quiet: the story's lazy stylesheets have landed
    await sleep(250);
  }
  return true;
}

(async () => {
  // 1. resolve the spec's stories against the live index
  let index;
  try { index = (await (await fetch(UP + '/index.json')).json()).entries; }
  catch (e) { console.error('sbkit: cannot read ' + UP + '/index.json — ' + (e && e.message)); process.exit(2); }
  const byTitle = {};
  for (const e of Object.values(index)) if (e.type === 'story') (byTitle[e.title.toLowerCase()] = byTitle[e.title.toLowerCase()] || {})[storyKebab(e.name)] = e.id;
  const jobs = [], missing = [];
  for (const c of spec.components) {
    if (ONLY && c.name !== ONLY) continue;
    const title = (c.path || 'components/' + c.name).toLowerCase();
    const have = byTitle[title];
    if (!have) { missing.push(c.name + ': no component titled ' + title + ' in the index'); continue; }
    for (const s of c.stories) {
      if (have[s]) jobs.push({component: c, story: s, id: have[s]});
      else missing.push(c.name + '/' + s + ': no such story (the index has: ' + Object.keys(have).join(', ') + ')');
    }
  }
  if (!jobs.length) { console.error('sbkit: nothing to capture' + (missing.length ? '\n  ' + missing.join('\n  ') : '')); process.exit(1); }
  const todo = LIMIT ? jobs.slice(0, LIMIT) : jobs;

  // 2. read every story
  const b = await launch({width: FW, height: FH, mobile: false, scale: 1});
  const seenRule = new Set(), rules = [], stories = [], fonts = new Set();
  let bodyClass = '';
  try {
    for (const j of todo) {
      const url = `${UP}/iframe.html?id=${j.id}&viewMode=story`;
      process.stdout.write(`${j.component.name}/${j.story} `);
      await b.navigate(url);
      let ok = await settled(b);
      // the first story of a run meets a cold Storybook and can miss the window once: one more try
      if (!ok) { process.stdout.write('(retry) '); await b.navigate(url); ok = await settled(b); }
      if (!ok) { console.log('— did not render in ' + WAIT + ' ms, skipped'); stories.push({component: j.component.name, story: j.story, id: j.id, unread: true}); continue; }
      const got = await b.eval(COLLECT);
      let added = 0;
      for (const r0 of got.rules) { const r = clean(r0); if (r && !seenRule.has(r)) { seenRule.add(r); rules.push(r); added++; } }
      got.fonts.forEach(f => fonts.add(f));
      bodyClass = bodyClass || got.bodyClass;
      const rec = {component: j.component.name, story: j.story, id: j.id, html: got.html.replace(/<!---->/g, ''), measure: got.measure, open: null};
      if (j.component.click) {
        const already = await b.eval(`!!document.querySelector(${JSON.stringify(OPEN)})`);
        if (!already) { await b.eval(`(function(){var e=document.querySelector(${JSON.stringify(j.component.click)});if(e)e.click();return !!e})()`); await sleep(900); }   // the kit's dialogs slide 0.4 s and fade 0.3 s; 900 ms leaves room on a busy machine
        await b.until(`!!document.querySelector(${JSON.stringify(OPEN)})`, 4000);
        const got2 = await b.eval(COLLECT);
        for (const r0 of got2.rules) { const r = clean(r0); if (r && !seenRule.has(r)) { seenRule.add(r); rules.push(r); added++; } }
        const d = await b.eval(PORTAL);
        rec.open = d ? d.replace(/<!---->/g, '') : null;
        if (!rec.open) console.log('(no dialog opened) ');
      }
      stories.push(rec);
      console.log(`· ${got.rules.length} rules, +${added} new${got.measure ? `, root ${got.measure.tag} ${got.measure.w}×${got.measure.h}` : ''}`);
    }
  } finally { await b.close(); }

  // 3. the hash table: which module belongs to which component
  const groups = {};   // hash → {names: Map(oldToken → name), components: Set, firstComponent, order}
  let order = 0;
  const note = (text, component) => {
    for (const m of text.matchAll(HASHED)) {
      const [tok, name, hash] = m;
      const g = groups[hash] = groups[hash] || {names: new Map(), components: new Set(), first: component, order: order++};
      if (!g.names.has(tok)) g.names.set(tok, name);
      if (component) g.components.add(component);
    }
  };
  for (const s of stories) { if (s.unread) continue; note(s.html, s.component); if (s.open) note(s.open, s.component); }
  for (const r of rules) note(r, null);
  const specOrder = spec.components.map(c => c.name);
  const captured = new Set(stories.filter(s => !s.unread).map(s => s.component));
  const owner = {};
  const lc = s => s.toLowerCase();
  // owns: every name listed is in the module; name: a class carries the component's name. Either
  // counts only when the module shows in that component's own stories — or when the component was
  // not captured at all, so a module seen in the CSS alone still gets its name
  const fits = (c, g) => !captured.has(c.name) || g.components.has(c.name);
  // owns: a pin. Each entry is a name or a list of names; a module containing every name of an
  // entry is the component's, the entry with the most names wins, and a tie goes to the earlier
  // spec entry. It holds even when the module shows in other components' stories only (a loader
  // inside a button) — that is what a pin is for
  const ownsScore = (c, names) => Math.max(0, ...(c.owns || []).map(e => [].concat(e)).map(e => e.every(n => names.includes(n)) ? e.length : 0));
  for (const [hash, g] of Object.entries(groups)) {
    const names = [...new Set(g.names.values())];
    let who = null, how = '', best = 0;
    for (const c of spec.components) { const sc = ownsScore(c, names); if (sc > best) { best = sc; who = c.name; how = 'owns'; } }
    for (const c of spec.components) if (!who && names.some(n => lc(n) === lc(c.name) || lc(n) === lc(c.name.replace(/^Sdk/, ''))) && fits(c, g)) { who = c.name; how = 'name'; }
    if (!who && g.components.size === 1) { who = [...g.components][0]; how = 'only'; }
    if (!who && g.components.size > 1) { who = [...g.components].sort((a, b2) => specOrder.indexOf(a) - specOrder.indexOf(b2))[0]; how = 'shared(' + [...g.components].join(',') + ')'; }
    if (!who) { who = 'Kit'; how = 'css-only'; }     // a module no story's markup uses, seen in the CSS alone
    owner[hash] = {component: who, how, names};
  }
  // 4. the names: sdk-<component> for the module's root class, sdk-<component>__<name> for the rest
  const rename = new Map(), taken = new Map(), rootOf = {};
  const sorted = Object.entries(groups).sort((a, b2) => a[1].order - b2[1].order);
  for (const [hash, g] of sorted) {
    const o = owner[hash], c = spec.components.find(x => x.name === o.component), k = o.component === 'Kit' ? 'kit' : kebab(o.component);
    const names = o.names;
    // the module's root class: the one carrying the component's name (splash_screen for
    // SdkSplashScreen), else the first name of the first pin; a module with neither keeps every
    // name qualified
    const flat = n => lc(n).replace(/[^a-z0-9]/g, '');
    const pin0 = c && c.owns && c.owns.length ? [].concat(c.owns[0])[0] : null;
    let root = names.find(n => flat(n) === flat(o.component) || flat(n) === flat(o.component.replace(/^Sdk/, '')))
      || (pin0 && names.includes(pin0) ? pin0 : null);
    if (rootOf[o.component]) root = null;            // a second module of the same component keeps every name qualified
    else rootOf[o.component] = hash;
    for (const [tok, name] of g.names) {
      let nn = name === root ? 'sdk-' + k : 'sdk-' + k + '__' + name;
      for (let i = 2; taken.has(nn) && taken.get(nn) !== tok; i++) nn = nn.replace(/-\d+$/, '') + '-' + i;
      taken.set(nn, tok); rename.set(tok, nn);
    }
  }
  const binds = new Map(); const bindCount = {};
  const noteBind = (text, component) => { for (const m of text.matchAll(BIND)) if (!binds.has(m[0])) { const k = component ? kebab(component) : 'kit'; bindCount[k] = (bindCount[k] || 0) + 1; binds.set(m[0], `--${k}-bind${bindCount[k]}`); } };
  for (const r of rules) { if (!BIND.test(r)) continue; BIND.lastIndex = 0; const h = r.match(HASHED); const o = h && owner[h[0].replace(HASHED, '$2')]; noteBind(r, o && o.component !== 'Kit' ? o.component : null); }
  for (const s of stories) { if (s.unread) continue; noteBind(s.html, s.component); if (s.open) noteBind(s.open, s.component); }
  // the scoped-style attributes (data-v-…): named after the first element that carries one —
  // its first class that is not a text style, without the sdk- prefix, in kebab case:
  // <span class="sdk-checkbox" data-v-6c8e41d0> → data-s-checkbox
  const scopes = new Map(); const scopeTaken = new Set();
  const nameScope = (attr, cls) => {
    const first = (cls || '').split(/\s+/).filter(c => c && !/^sdk-text/.test(c))[0] || 'scope';
    let base = 'data-s-' + kebab(first.replace(/^sdk-/, '').replace(/__.*$/, '').replace(/^Sdk/, '')).replace(/[^a-z0-9-]/g, '');
    let nn = base; for (let i = 2; scopeTaken.has(nn); i++) nn = base + '-' + i;
    scopeTaken.add(nn); scopes.set(attr, nn);
  };
  for (const s of stories) {
    if (s.unread) continue;
    for (const html of [s.html, s.open].filter(Boolean))
      for (const m of html.matchAll(/<[a-z][^>]*?(data-v-[0-9a-f]{8})[^>]*>/g)) {
        if (scopes.has(m[1])) continue;
        const cls = ((m[0].match(/class="([^"]*)"/) || [])[1] || '').replace(HASHED, t => rename.get(t) || t);
        nameScope(m[1], cls);
      }
  }
  for (const r of rules) for (const m of r.matchAll(SCOPE)) if (!scopes.has(m[0])) nameScope(m[0], (r.match(/\.([A-Za-z][\w-]*)/) || [])[1]);
  const fix = text => text.replace(HASHED, m => rename.get(m) || m).replace(BIND, m => binds.get(m) || m).replace(SCOPE, m => scopes.get(m) || m);

  // 5. write
  fs.mkdirSync(path.join(OUT, 'markup'), {recursive: true});
  const taken_ = new Date().toISOString().slice(0, 10);
  const css = fix(rules.join('\n'));
  const left = (css.match(HASHED) || []).length + (css.match(BIND) || []).length + (css.match(SCOPE) || []).length;
  const header = `/* WebSDK UI kit — snapshot of ${taken_} from ${spec.upstream} by scripts/sbkit.cjs.\n` +
    `   ${rules.length} rules from ${stories.filter(s => !s.unread).length} stories; class names renamed through modules.json (sdk-<component>[__<name>]).\n` +
    `   Fonts the kit loads from Google Fonts, not embedded here:\n${[...fonts].map(f => '     ' + f).join('\n')}\n` +
    `   The variables live on body.${bodyClass.split(' ').filter(c => /^sns-/.test(c)).join('.')} — a page without those classes renders unstyled. */\n`;
  fs.writeFileSync(path.join(OUT, 'kit.css'), header + css + '\n');
  for (const s of stories) {
    if (s.unread) continue;
    const dir = path.join(OUT, 'markup', s.component); fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, s.story + '.html'), fix(s.html) + '\n');
    if (s.open) fs.writeFileSync(path.join(dir, s.story + '.open.html'), fix(s.open) + '\n');
  }
  const modules = {taken: taken_, upstream: spec.upstream, note: 'hash → component → {build class: stable class}; `how` says what settled the owner (owns / name / only / shared / css-only). Pin a wrong guess with `owns` in stories.json and re-run.',
    modules: sorted.map(([hash, g]) => ({hash, component: owner[hash].component, how: owner[hash].how, classes: Object.fromEntries([...g.names.keys()].map(t => [t, rename.get(t)]))})),
    binds: Object.fromEntries(binds), scopes: Object.fromEntries(scopes)};
  fs.writeFileSync(path.join(OUT, 'modules.json'), JSON.stringify(modules, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'snapshot.json'), JSON.stringify({taken: taken_, upstream: spec.upstream, bodyClass, fonts: [...fonts],
    stories: stories.map(s => ({component: s.component, story: s.story, id: s.id, unread: !!s.unread, measure: s.measure, open: !!s.open}))}, null, 2) + '\n');

  // the icon set (SdkIcon/all-icons: an svg and its name per cell) and the flags (SdkFlag/grid: an
  // <img> per country with "Flag of XXX" as its alt), each to a file, so a generator inlines them
  // by name as the dashboard's controls do
  let nIcons = 0, nFlags = 0;
  const allIcons = stories.find(s => s.component === 'SdkIcon' && s.story === 'all-icons' && !s.unread);
  if (allIcons) {
    fs.mkdirSync(path.join(OUT, 'icons'), {recursive: true});
    for (const m of allIcons.html.matchAll(/(<svg[\s\S]*?<\/svg>)\s*<div[^>]*>([^<]+)<\/div>/g)) {
      const name = m[2].trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!name) continue;
      // the story's own attributes come off: the class says primary/small, the generator decides that
      const svg = fix(m[1]).replace(/\s(data-s-[a-z0-9-]+|class|aria-hidden)="[^"]*"/g, '');
      fs.writeFileSync(path.join(OUT, 'icons', name + '.svg'), svg + '\n'); nIcons++;
    }
  }
  const grid = stories.find(s => s.component === 'SdkFlag' && s.story === 'grid' && !s.unread);
  if (grid) {
    fs.mkdirSync(path.join(OUT, 'flags'), {recursive: true});
    for (const m of grid.html.matchAll(/<img[^>]*src="data:image\/svg\+xml,([^"]+)"[^>]*alt="Flag of ([A-Za-z]+)"/g)) {
      fs.writeFileSync(path.join(OUT, 'flags', m[2].toUpperCase() + '.svg'), decodeURIComponent(m[1]) + '\n'); nFlags++;
    }
  }

  // VERSION.md: the generated block
  const rows = stories.filter(s => !s.unread && s.measure).map(s => `| ${s.component} | ${s.story} | ${s.measure.w}×${s.measure.h} | ${s.measure.font} ${s.measure.size}/${s.measure.line} ${s.measure.weight} | ${s.measure.color} on ${s.measure.bg} | ${s.measure.radius} |`);
  const modRows = modules.modules.map(m => `| ${m.component} | \`${m.hash}\` | ${m.how} | ${Object.values(m.classes).slice(0, 6).map(x => '`' + x + '`').join(', ')}${Object.keys(m.classes).length > 6 ? ', …' : ''} |`);
  const block = `<!-- sbkit:begin — written by scripts/sbkit.cjs on ${taken_}; edit outside the markers -->\n` +
    `## Snapshot\n\n| | |\n|---|---|\n| taken | ${taken_} |\n| source | \`${spec.upstream}\`, the stories in \`stories.json\`, read live over the DevTools protocol |\n` +
    `| rules | ${rules.length} in \`kit.css\` |\n| stories | ${stories.filter(s => !s.unread).length} read, ${stories.filter(s => s.unread).length} unread |\n` +
    `| icons, flags | ${nIcons} icons in \`icons/\` (SdkIcon/all-icons), ${nFlags} flags in \`flags/\` (SdkFlag/grid) |\n| theme | \`body.${bodyClass.split(' ').filter(c => /^sns-/.test(c)).join('.')}\` carries the variables |\n| fonts | ${[...fonts].map(f => decodeURIComponent(f.replace(/.*family=/, '').replace(/&.*/, ''))).join('; ') || '—'} (Google Fonts, linked by the page) |\n\n` +
    `## Modules — the hash table\n\nOne CSS module per row; the hash is the build's and changes with it, the stable names do not.\n\n| component | hash | settled by | names |\n|---|---|---|---|\n${modRows.join('\n')}\n\n` +
    `## Measured at capture — the root element of each story\n\n| component | story | size | font | colour on background | radius |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n` +
    `<!-- sbkit:end -->\n`;
  const vf = path.join(OUT, 'VERSION.md');
  let v = fs.existsSync(vf) ? fs.readFileSync(vf, 'utf8') : `# WebSDK UI kit — version record\n\nThe design system's own components for a WebSDK prototype, as a snapshot of its Storybook (\`scripts/sbkit.cjs\`). Values below the generated block are written by hand after a capture and re-checked by \`scripts/dscheck.js\` against \`storybook.json\`.\n\n<!-- sbkit:begin -->\n<!-- sbkit:end -->\n`;
  v = v.replace(/<!-- sbkit:begin[\s\S]*?<!-- sbkit:end -->\n?/, block);
  if (!/sbkit:begin/.test(v)) v += '\n' + block;
  fs.writeFileSync(vf, v);

  // 6. report
  const shared = modules.modules.filter(m => /^shared/.test(m.how));
  console.log(`  icons: ${nIcons}, flags: ${nFlags}`);
  console.log(`\nsbkit: ${rules.length} rules, ${stories.filter(s => !s.unread).length} stories, ${modules.modules.length} modules (${rename.size} classes, ${binds.size} v-bind variables and ${scopes.size} scoped attributes renamed), written to ${path.relative(process.cwd(), OUT) || '.'}`);
  if (shared.length) { console.log('  modules seen in several components, given to the earliest spec entry — check modules.json, pin with `owns` if wrong:'); for (const m of shared) console.log(`    ${m.hash} → ${m.component} ${m.how}: ${Object.keys(m.classes).slice(0, 5).join(' ')}`); }
  const cssOnly = modules.modules.filter(m => m.how === 'css-only');
  if (cssOnly.length) console.log(`  ${cssOnly.length} modules appear in the CSS only (no story's markup uses them), named sdk-kit__*: ${cssOnly.map(m => m.hash).join(' ')}`);
  if (left) console.log(`  WARNING ${left} hashed tokens survived the rename in kit.css`);
  if (missing.length) { console.log('  not captured:'); for (const m of missing) console.log('    ' + m); }
  process.exit(missing.length ? 1 : 0);
})().catch(e => { console.error('sbkit: ' + (e && e.stack || e)); process.exit(2); });
