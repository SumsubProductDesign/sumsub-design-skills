// _png.cjs — PNG in and out with nothing but Node's own zlib.
//
// Why it exists: every measurement in this skill used to start a headless Chrome,
// load the image into a canvas and read it back, which costs about two seconds per
// call. The same numbers come out of the file itself in tens of milliseconds, so
// the measuring tools read pixels here and keep Chrome for what only Chrome can do
// — rendering HTML.
//
// decode(fileOrBuffer) -> {width, height, data}   data is RGBA, 8 bits per channel
// encode(width, height, rgba) -> Buffer          colour type 6, filter 0, deflated
//
// Covers what the tools meet: colour types 0/2/3/4/6, bit depths 1/2/4/8/16,
// filters 0–4, tRNS, several IDAT chunks. Interlaced files throw by name rather
// than returning something plausible and wrong.
//
// One deliberate agreement with the browser it replaces: a fully transparent pixel
// reads back as 0,0,0,0, because that is what a canvas returns.
const fs = require('fs'), zlib = require('zlib');

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CH = [0, 0, 0, 0, 0, 0, 0, 0];  // channels per colour type: 0 grey, 2 rgb, 3 idx, 4 grey+a, 6 rgba
CH[0] = 1; CH[2] = 3; CH[3] = 1; CH[4] = 2; CH[6] = 4;

function decode(src) {
  const buf = Buffer.isBuffer(src) ? src : fs.readFileSync(src);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG: ' + (Buffer.isBuffer(src) ? '<buffer>' : src));
  let p = 8, W = 0, H = 0, depth = 0, type = 0, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p), tag = buf.toString('latin1', p + 4, p + 8), at = p + 8;
    if (tag === 'IHDR') {
      W = buf.readUInt32BE(at); H = buf.readUInt32BE(at + 4);
      depth = buf[at + 8]; type = buf[at + 9]; interlace = buf[at + 12];
    } else if (tag === 'PLTE') plte = buf.subarray(at, at + len);
    else if (tag === 'tRNS') trns = buf.subarray(at, at + len);
    else if (tag === 'IDAT') idat.push(buf.subarray(at, at + len));
    else if (tag === 'IEND') break;
    p = at + len + 4;
  }
  if (!W || !H) throw new Error('PNG has no IHDR');
  if (interlace) throw new Error('interlaced PNG not supported (re-save it non-interlaced)');
  if (CH[type] === 0) throw new Error('unsupported PNG colour type ' + type);

  const chans = CH[type], bits = chans * depth, bpp = Math.max(1, bits >> 3);
  const stride = Math.ceil(W * bits / 8);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  if (raw.length < (stride + 1) * H) throw new Error('PNG data is short: ' + raw.length + ' < ' + (stride + 1) * H);

  // un-filter in place, one scanline at a time
  const lines = Buffer.allocUnsafe(stride * H);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], s = y * (stride + 1) + 1, o = y * stride, u = o - stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[s + i];
      const a = i >= bpp ? lines[o + i - bpp] : 0;
      const b = y > 0 ? lines[u + i] : 0;
      const c = (y > 0 && i >= bpp) ? lines[u + i - bpp] : 0;
      let v;
      if (f === 0) v = x;
      else if (f === 1) v = x + a;
      else if (f === 2) v = x + b;
      else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else throw new Error('unknown PNG filter ' + f + ' on row ' + y);
      lines[o + i] = v & 255;
    }
  }

  // expand to RGBA
  const out = new Uint8Array(W * H * 4);
  const max = (1 << depth) - 1;
  const sample = (row, i) => {                       // i-th sample of a scanline, scaled to 0..255
    if (depth === 8) return lines[row * stride + i];
    if (depth === 16) return lines[row * stride + i * 2];
    const bit = i * depth, byte = lines[row * stride + (bit >> 3)];
    return ((byte >> (8 - depth - (bit & 7))) & max) * 255 / max;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4, i = x * chans;
    let r, g, b, a = 255;
    if (type === 3) {
      const idx = depth === 8 ? lines[y * stride + x] : Math.round(sample(y, x) * max / 255);
      if (!plte || idx * 3 + 2 >= plte.length) throw new Error('PNG palette index out of range');
      r = plte[idx * 3]; g = plte[idx * 3 + 1]; b = plte[idx * 3 + 2];
      if (trns && idx < trns.length) a = trns[idx];
    } else if (type === 0 || type === 4) {
      r = g = b = Math.round(sample(y, i));
      if (type === 4) a = Math.round(sample(y, i + 1));
    } else {
      r = Math.round(sample(y, i)); g = Math.round(sample(y, i + 1)); b = Math.round(sample(y, i + 2));
      if (type === 6) a = Math.round(sample(y, i + 3));
    }
    if (a === 0) { r = g = b = 0; }                  // what a canvas returns for a transparent pixel
    out[k] = r; out[k + 1] = g; out[k + 2] = b; out[k + 3] = a;
  }
  return {width: W, height: H, data: out};
}

let TAB = null;
function crc32(buf) {
  if (!TAB) {
    TAB = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TAB[n] = c; }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TAB[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(tag, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0); head.write(tag, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

function encode(W, H, rgba) {
  const raw = Buffer.allocUnsafe((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let i = 0; i < W * 4; i++) raw[y * (W * 4 + 1) + 1 + i] = rgba[y * W * 4 + i];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

module.exports = {decode, encode};
