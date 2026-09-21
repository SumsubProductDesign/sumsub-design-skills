#!/usr/bin/env node
// cut.js <source.png> <x> <y> <w> <h> <out.png>
// Cut one rectangle out of a PNG, pixel for pixel — the way a baked plate is
// taken from the frame's reference render. Top-left origin, no scaling, no
// resampling. Exists so nobody writes their own cropper mid-build: one that
// applied its offset twice cost a run three plates and their re-verification.
// A rectangle reaching past the image comes back padded with white, as before.
const fs = require('fs'), path = require('path');
const {decode, encode} = require(path.join(__dirname, '_png.cjs'));
const [src, x, y, w, h, out] = process.argv.slice(2);
if (!out) { console.error('usage: cut.js <source.png> <x> <y> <w> <h> <out.png>'); process.exit(1); }
if (!fs.existsSync(src)) { console.error('not found: ' + src); process.exit(1); }
const [X, Y, W, H] = [x, y, w, h].map(Number);
if ([X, Y, W, H].some(n => !Number.isInteger(n) || n < 0) || !W || !H) {
  console.error('x y w h must be non-negative integers, w and h > 0'); process.exit(1);
}
const im = decode(src);
const px = new Uint8Array(W * H * 4).fill(255);
for (let j = 0; j < H; j++) {
  const sy = Y + j; if (sy >= im.height) break;
  for (let i = 0; i < W; i++) {
    const sx = X + i; if (sx >= im.width) break;
    const s = (sy * im.width + sx) * 4, d = (j * W + i) * 4;
    px[d] = im.data[s]; px[d + 1] = im.data[s + 1]; px[d + 2] = im.data[s + 2]; px[d + 3] = im.data[s + 3];
  }
}
fs.writeFileSync(out, encode(W, H, px));
console.log(`${out}: ${W}x${H} from ${X},${Y}`);
