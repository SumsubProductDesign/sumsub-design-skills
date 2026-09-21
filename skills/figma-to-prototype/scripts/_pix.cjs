// _pix.cjs — the measurements behind zonediff / inkbbox / pixprobe / minpx /
// scanline / blockgate, computed from the PNG itself through _png.cjs.
//
// Each mode prints exactly what its shell wrapper used to print, so every
// recipe, ledger line and lint expectation still reads the same string. The
// only thing that changed is that no browser starts: a whole-page diff that
// took 2.2s takes about 30ms.
//
// Out-of-bounds reads answer 0,0,0,0, the way a canvas does — a rect that
// overruns the image still returns a number rather than an error, and that
// number means the same as before.
const path = require('path');
const {decode, encode} = require(path.join(__dirname, '_png.cjs'));

const hex = v => v.toString(16).padStart(2, '0');
const rgbs = q => 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')=#' + hex(q[0]) + hex(q[1]) + hex(q[2]);
const px = (im, x, y) => {                                  // [r,g,b,a], zeros outside the image
  if (x < 0 || y < 0 || x >= im.width || y >= im.height) return [0, 0, 0, 0];
  const k = (y * im.width + x) * 4;
  return [im.data[k], im.data[k + 1], im.data[k + 2], im.data[k + 3]];
};

const [mode, ...rest] = process.argv.slice(2);

if (mode === 'pixprobe') {
  const im = decode(rest[0]);
  console.log(JSON.parse(rest[1]).map(([x, y]) => x + ',' + y + '=' + rgbs(px(im, x, y))).join(' | '));

} else if (mode === 'minpx') {
  const im = decode(rest[0]);
  console.log(JSON.parse(rest[1]).map(r => {
    const [rx, ry, rw, rh, name] = r;
    let lo = null, hi = null, llo = 1e9, lhi = -1;
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
      const q = px(im, rx + i, ry + j), l = q[0] + q[1] + q[2];
      if (l < llo) { llo = l; lo = q; }
      if (l > lhi) { lhi = l; hi = q; }
    }
    return (name || rx + ',' + ry) + ': min ' + rgbs(lo) + ' max ' + rgbs(hi);
  }).join(' | '));

} else if (mode === 'inkbbox') {
  const im = decode(rest[0]), TH = Number(rest[2] || 150);
  console.log(JSON.parse(rest[1]).map(r => {
    const named = typeof r[0] === 'string', name = named ? r[0] + ' ' : '';
    const [rx, ry, rw, rh] = named ? r.slice(1) : r;
    if ([rx, ry, rw, rh].some(v => typeof v !== 'number')) return name + 'ERROR: expected [x,y,w,h]';
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
      const q = px(im, rx + i, ry + j), l = (q[0] + q[1] + q[2]) / 3;
      if (TH < 0 ? l > -TH : l < TH) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    }
    return name + (x1 < 0 ? '[none]'
      : 'x ' + (rx + x0) + '..' + (rx + x1) + ' (w ' + (x1 - x0 + 1) + ') y ' + (ry + y0) + '..' + (ry + y1) + ' (h ' + (y1 - y0 + 1) + ')');
  }).join(' || '));

} else if (mode === 'scanline') {
  const im = decode(rest[0]), at = Number(rest[1]), row = rest[2] === 'row', lim = Number(rest[3] || 250);
  const n = row ? im.width : im.height, out = [];
  let s = -1, prev = '';
  const key = i => {
    const q = row ? px(im, i, at) : px(im, at, i);
    return (q[0] >= lim && q[1] >= lim && q[2] >= lim) ? null : '#' + hex(q[0]) + hex(q[1]) + hex(q[2]);
  };
  for (let i = 0; i <= n; i++) {
    const v = (i < n) ? key(i) : null;
    if (v !== prev) {
      if (prev !== null && s >= 0) out.push(s + '..' + (i - 1) + ' ' + prev + (i - s > 1 ? ' (' + (i - s) + ')' : ''));
      s = i; prev = v;
    }
  }
  console.log(out.length ? out.join(' | ') : '(nothing but background on this line)');

} else if (mode === 'zonediff') {
  const A = decode(rest[0]), B = decode(rest[1]);
  const zones = JSON.parse(rest[2]), out = rest[3], th = Number(rest[4] || 60);
  const map = new Uint8Array(A.width * A.height * 4).fill(255);
  const res = [];
  for (const [n, x, y, w, h] of zones) {
    let bad = 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const a = px(A, x + i, y + j), b = px(B, x + i, y + j);
      const hit = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > th;
      if (hit) bad++;
      const gx = x + i, gy = y + j;
      if (hit && gx >= 0 && gy >= 0 && gx < A.width && gy < A.height) {
        const k = (gy * A.width + gx) * 4;
        map[k + 1] = 0; map[k + 2] = 0;
      }
    }
    res.push(n + ' ' + (100 * bad / (w * h)).toFixed(2) + '%');
  }
  if (out) require('fs').writeFileSync(out, encode(A.width, A.height, map));
  console.log(res.join(' | '));

} else if (mode === 'bounds') {
  // right-most and bottom-most pixel that is not pure white, per image — what a
  // scale test asks: no horizontal scroll, nothing cropped, where growth stops
  const out = [];
  for (const f of rest) {
    const im = decode(f);
    let maxX = -1, maxY = -1;
    for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
      const k = (y * im.width + x) * 4;
      if (im.data[k] !== 255 || im.data[k + 1] !== 255 || im.data[k + 2] !== 255) {
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    out.push(f.split('/').pop() + ' viewport ' + im.width + 'x' + im.height + ' content right=' + maxX + ' bottom=' + maxY);
  }
  console.log(out.join('\n'));

} else if (mode === 'blockgate') {
  const A = decode(rest[0]), B = decode(rest[1]);
  const span = Number(rest[2] || 80), th = Number(rest[3] || 40), gap = Number(rest[4] || 6);
  const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
  const ink = (im, x, y) => { const q = px(im, x, y); return 765 - (q[0] + q[1] + q[2]) > th; };
  const profile = im => {
    const rows = new Int32Array(h), cols = new Int32Array(w);
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (ink(im, i, y)) { rows[y]++; cols[i]++; }
    return {rows, cols};
  };
  const best = (a, b) => {                       // shift of b against a that maximises overlap
    let bd = 0, bs = -1e18;
    for (let s = -span; s <= span; s++) {
      let acc = 0;
      for (let i = 0; i < a.length; i++) { const j = i + s; if (j >= 0 && j < b.length) acc += Math.min(a[i], b[j]); }
      if (acc > bs) { bs = acc; bd = s; }
    }
    return bd;
  };
  const bands = rows => {                        // contiguous runs of ink rows = the block's lines
    const out = []; let s = -1, empty = 0;
    for (let y = 0; y < rows.length; y++) {
      if (rows[y] > 0) { if (s < 0) s = y; empty = 0; }
      else if (s >= 0 && ++empty > gap) { out.push([s, y - empty]); s = -1; }
    }
    if (s >= 0) out.push([s, rows.length - 1]);
    return out;
  };
  const inkBox = (im, y0, y1) => {
    let l = 1e9, r = -1, t = 1e9, b = -1;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) {
      if (ink(im, x, y)) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
    }
    return r < 0 ? null : {l, r, t, b};
  };
  const pa = profile(A), pb = profile(B);
  const dy = best(pa.rows, pb.rows), dx = best(pa.cols, pb.cols);
  const res = {offset: {dx, dy}, bands: []};
  for (const [t0, t1] of bands(pa.rows)) {
    const a = inkBox(A, t0, Math.min(t1, h - 1));
    const b = inkBox(B, Math.max(0, t0 + dy - 3), Math.min(h - 1, t1 + dy + 3));
    res.bands.push(a && b
      ? {y: t0, h: t1 - t0 + 1, dl: b.l - a.l - dx, dr: b.r - a.r - dx, dt: b.t - a.t - dy, db: b.b - a.b - dy, w: a.r - a.l + 1}
      : {y: t0, h: t1 - t0 + 1, missing: !b});
  }
  console.log(JSON.stringify(res));

} else {
  console.error('usage: _pix.cjs pixprobe|minpx|inkbbox|scanline|zonediff|bounds|blockgate ...');
  process.exit(1);
}
