#!/usr/bin/env node
// shoot.js <file.html> <outdir> [width] [height] [#hash,#hash,...] [--device]
// Renders the prototype headless at scale 1 and screenshots each view.
//
// --device renders through the DevTools protocol (_cdp.cjs, Node 22+) at exactly that size, and is
// the only way to a width under 500: the command line clamps the window there.
//
// Views render in parallel, up to four at a time: Chrome takes about a second to
// start and a prototype has five or six screens, so the walk-through used to cost
// more in start-up than in rendering. Each process gets Chrome's own throwaway
// profile — passing --user-data-dir explicitly makes it hang on the first-run
// path and never exit.
// Without --device the render runs under Chrome's virtual time (--virtual-time-budget), which runs
// every setTimeout to its end before the shot: a timed state — a loader that leaves by itself —
// renders as the state AFTER it, and nothing in the PNG says so (run 16's 1440 baselines of two such
// states showed the next screen, 2026-10-14). A timed state is shot through --device (real time, the
// shot ~1 s after load) or at '#state?hold' — the page's route function reads the ?hold suffix and
// arms no timer (references/interaction-plumbing.md § Timed transitions); the PNG is named by the
// state alone (upload_1440.png). A page that sets timers, shot with neither, gets one warning line.
//
// The renders themselves are untouched — same flags, same one-page-per-process
// model, byte-identical PNGs. Each is on a clock (CHROME_TIMEOUT seconds, 60 by default,
// _chrome.cjs): a Chrome that hangs is killed and the run fails with a line.
const {spawn} = require('child_process'), fs = require('fs'), path = require('path');
const {CHROME, watchdog} = require(path.join(__dirname, '_chrome.cjs'));
const DEVICE_FLAG = process.argv.includes('--device');
const [file, outdir, w = 1440, h = 900, views = ''] = process.argv.slice(2).filter(a => a !== '--device');
if (!file || !outdir) { console.error('usage: shoot.js <file.html> <outdir> [w] [h] [#a,#b] [--device]'); process.exit(1); }
fs.mkdirSync(outdir, {recursive: true});
// Chrome will not open a window narrower than 500: a smaller --window-size is clamped, the page
// lays out at 500, and the screenshot is still cropped to the width you asked for. A block that
// centres itself then sits (500 − width) / 2 to the right of where you think it is, and nothing
// in the PNG says so — run 7 lost a cycle to a 400-wide block landing at 50 (2026-09-21). --device
// goes through the protocol instead, which has no such floor.
const DEVICE = DEVICE_FLAG;
if (Number(w) < 500 && !DEVICE) {
  console.error(`shoot: ${w} is below Chrome's 500px minimum window — the page will lay out at 500.`);
  console.error('       A standalone block must be left-aligned (#app{margin:0}) or every x is off by ' + Math.round((500 - Number(w)) / 2) + '; a page that re-flows by width needs --device (Node 22+).');
}
const list = views ? views.split(',') : [''];
// a page with timers, rendered under virtual time without the hold: the shot is of the next state
let TIMED = false; try { TIMED = !DEVICE && /setTimeout\s*\(/.test(fs.readFileSync(file, 'utf8')); } catch (e) {}
if (TIMED && list.some(v => !/\?hold$/.test(v))) console.error('shoot: ' + file + ' sets a timer (setTimeout), and virtual time fires it before the shot — a timed state is rendered with --device or as #hash?hold');
const LIMIT = Number(process.env.SHOOT_PARALLEL || 4);

const shot = v => new Promise((resolve, reject) => {
  const out = path.join(outdir, (v.replace('#', '').replace(/\?hold$/, '') || 'view') + '_' + w + '.png');
  const ch = DEVICE
    ? spawn(process.execPath, [path.join(__dirname, '_cdp.cjs'), 'shot', 'file://' + path.resolve(file) + v, w + 'x' + h, out, '--wait', '800'], {stdio: ['ignore', 'ignore', 'inherit']})
    : spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=' + w + ',' + h,
    '--screenshot=' + out,
    '--virtual-time-budget=4000', 'file://' + path.resolve(file) + v], {stdio: 'ignore'});
  watchdog(ch, 'shoot');           // a hung Chrome is killed on the clock (CHROME_TIMEOUT, 60 s) and this view fails
  ch.on('error', reject);
  ch.on('close', () => ch.timedOut ? reject(new Error('no render of ' + (v || 'the page') + ': Chrome was killed on the clock')) : resolve(out));
});

(async () => {
  const done = [];
  for (let i = 0; i < list.length; i += LIMIT) {
    done.push(...await Promise.all(list.slice(i, i + LIMIT).map(shot)));
  }
  for (const o of done) console.log(o);                 // in the order the views were given
})().catch(e => { console.error('shoot: ' + (e && e.message)); process.exit(1); });
