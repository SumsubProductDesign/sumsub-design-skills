#!/usr/bin/env node
// shoot.js <file.html> <outdir> [width] [height] [#hash,#hash,...]
// Renders the prototype headless at scale 1 and screenshots each view.
//
// Views render in parallel, up to four at a time: Chrome takes about a second to
// start and a prototype has five or six screens, so the walk-through used to cost
// more in start-up than in rendering. Each process gets Chrome's own throwaway
// profile — passing --user-data-dir explicitly makes it hang on the first-run
// path and never exit.
// The renders themselves are untouched — same flags, same one-page-per-process
// model, byte-identical PNGs.
const {spawn} = require('child_process'), fs = require('fs'), path = require('path');
const {CHROME} = require(path.join(__dirname, '_chrome.cjs'));
const [file, outdir, w = 1440, h = 900, views = ''] = process.argv.slice(2);
if (!file || !outdir) { console.error('usage: shoot.js <file.html> <outdir> [w] [h] [#a,#b]'); process.exit(1); }
fs.mkdirSync(outdir, {recursive: true});
const list = views ? views.split(',') : [''];
const LIMIT = Number(process.env.SHOOT_PARALLEL || 4);

const shot = v => new Promise((resolve, reject) => {
  const out = path.join(outdir, (v.replace('#', '') || 'view') + '_' + w + '.png');
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=' + w + ',' + h,
    '--screenshot=' + out,
    '--virtual-time-budget=4000', 'file://' + path.resolve(file) + v], {stdio: 'ignore'});
  ch.on('error', reject);
  ch.on('close', () => resolve(out));
});

(async () => {
  const done = [];
  for (let i = 0; i < list.length; i += LIMIT) {
    done.push(...await Promise.all(list.slice(i, i + LIMIT).map(shot)));
  }
  for (const o of done) console.log(o);                 // in the order the views were given
})().catch(e => { console.error('shoot: ' + (e && e.message)); process.exit(1); });
