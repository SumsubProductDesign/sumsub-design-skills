#!/usr/bin/env node
// crop.js <reference.png> <prototype.png> <x> <y> <w> <h> [zoom] [bx] [by] [out.png]
// Stacked comparison: reference above, prototype below, same crop, zoomed.
// bx/by let the second image be cropped at a different origin (different canvas offsets).
const {execSync} = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const {CHROME} = require(path.join(__dirname, '_chrome.cjs'));
// default output goes next to the other renders when the project layout exists,
// so a comparison does not end up beside the deliverable
const defOut = fs.existsSync('_work/shots') ? '_work/shots/compare.png' : 'compare.png';
const [a, b, x, y, w, h, z = 1, bx = x, by = y, out = defOut] = process.argv.slice(2);
const usage = 'usage: crop.js <ref.png> <proto.png> <x> <y> <w> <h> [zoom] [bx] [by] [out.png]';
if (!b) { console.error(usage); process.exit(1); }
// out is the TENTH argument. Passed as the eighth it lands in bx, the second pane is offset by
// NaN, and the comparison comes out as two labels over nothing — written to the default path,
// so even the filename gives no hint. Run 6 lost a check to this on 2026-09-21.
for (const [name, v] of [['x', x], ['y', y], ['w', w], ['h', h], ['zoom', z], ['bx', bx], ['by', by]]) {
  if (!Number.isFinite(Number(v))) {
    console.error(`crop.js: ${name} is "${v}", not a number.\n${usage}\n` +
      (String(v).endsWith('.png') ? '       an output path goes LAST, after bx and by — or omit both: crop.js … <zoom> <x> <y> <out.png>' : ''));
    process.exit(1);
  }
}
const tmp = path.join(os.tmpdir(), '_crop_' + Date.now() + '.html');
const pane = (img, ox, oy) =>
  `<div class=wrap><img src="file://${path.resolve(img)}" style="left:${-ox*z}px;top:${-oy*z}px"></div>`;
fs.writeFileSync(tmp, `<style>body{margin:0;background:#fff;font:10px monospace}
.wrap{position:relative;width:${w*z}px;height:${h*z}px;overflow:hidden}
.wrap img{position:absolute;transform-origin:top left;transform:scale(${z});image-rendering:pixelated}
.lbl{padding:2px 4px;background:#eee}</style>
<div class=lbl>REFERENCE</div>${pane(a, x, y)}<div class=lbl>PROTOTYPE</div>${pane(b, bx, by)}`);
execSync(`"${CHROME}" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files ` +
  `--window-size=${Math.ceil(w*z)+4},${Math.ceil(h*z*2)+40} --screenshot="${out}" ` +
  `--virtual-time-budget=3000 "file://${tmp}" 2>/dev/null`, {stdio: 'ignore'});
console.log(out);
