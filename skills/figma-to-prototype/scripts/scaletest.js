#!/usr/bin/env node
// scaletest.js <file.html> <outdir> [#hash]
// Renders at a spread of widths, then reports each render's content bounds:
// no horizontal scroll, nothing cropped, and where growth stops at the scale cap.
//
// The five renders run in parallel and the bounds are read from the PNGs in Node
// (_pix.cjs bounds), so the whole test is one round of Chrome instead of six.
const {spawn} = require('child_process'), {execFileSync} = require('child_process');
const fs = require('fs'), path = require('path');
const {CHROME} = require(path.join(__dirname, '_chrome.cjs'));
const [file, outdir, hash = ''] = process.argv.slice(2);
if (!file || !outdir) { console.error('usage: scaletest.js <file.html> <outdir> [#hash]'); process.exit(1); }
fs.mkdirSync(outdir, {recursive: true});

const shot = ([w, h]) => new Promise((resolve, reject) => {
  const out = path.join(outdir, `s_${w}.png`);
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--force-device-scale-factor=1',
    '--window-size=' + w + ',' + h, '--screenshot=' + out, '--virtual-time-budget=4000',
    'file://' + path.resolve(file) + hash], {stdio: 'ignore'});
  ch.on('error', reject);
  ch.on('close', () => resolve(out));
});

(async () => {
  const shots = await Promise.all([[1024, 700], [1280, 800], [1440, 900], [1920, 1080], [2560, 1400]].map(shot));
  console.log(execFileSync(process.execPath, [path.join(__dirname, '_pix.cjs'), 'bounds', ...shots],
    {encoding: 'utf8'}).trim());
})().catch(e => { console.error('scaletest: ' + (e && e.message)); process.exit(1); });
