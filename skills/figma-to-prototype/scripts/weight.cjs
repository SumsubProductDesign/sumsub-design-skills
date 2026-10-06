#!/usr/bin/env node
// weight.cjs <page.html> [--limit MB] [--top N]
//
// Where a self-contained page's weight is. Every data: URI in it — <img src>, CSS url(), srcset —
// with its decoded size, format, pixel size and where it sits, heaviest first; then the total,
// what part of it is plates, fonts, markup and scripts, and the page against --limit.
//
// The skill's own estimate was "2–3 MB"; the 2026-10-02 OCR prototypes came out at 8.9 and
// 11.7 MB, and the first anyone heard of it was a viewer refusing to preview the file. Nobody
// could say which plate was heavy, because nothing listed them. This does, and adds a hint per
// plate where one applies:
//   photo-like   a PNG whose pixels barely repeat a colour — a document photo, an avatar, a
//                screenshot of a picture. PNG is the heaviest way to carry one; `encode.sh` makes
//                a WebP of it, usually a fraction of the size
//   duplicate    the same bytes inlined more than once — each copy pays in full
//   not 2x       a plate under twice the width it is shown at (soft on the respondent's screen)
//   over 2x      a plate over it — a raw photo at its own resolution; encode.sh --width cuts it
//                down (both only when the page says, through width= or a style width, what that is)
//
// --limit defaults to 16 (MB, the claude.ai artifact page limit); exits 1 above it. Reads the
// file, writes nothing, needs no browser. no-font: it emits no page.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { decode } = require(path.join(__dirname, '_png.cjs'));

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const file = argv.find((a, i) => !a.startsWith('--') && !['--limit', '--top'].includes(argv[i - 1]));
if (!file) { console.error('usage: weight.cjs <page.html> [--limit MB] [--top N]'); process.exit(2); }
const LIMIT = parseFloat(opt('--limit', '16')) * 1048576;
const TOP = parseInt(opt('--top', '15'), 10);
const h = fs.readFileSync(file, 'utf8');
const total = Buffer.byteLength(h);

const MB = n => (n / 1048576).toFixed(n < 104858 ? 2 : 1) + ' MB';
const KB = n => (n < 1048576 ? Math.round(n / 1024) + ' KB' : MB(n));

function dims(type, b) {
  try {
    if (type === 'png') return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (type === 'jpeg') {
      for (let p = 2; p + 9 < b.length;) {
        if (b[p] !== 0xff) { p++; continue; }
        const m = b[p + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(p + 7), b.readUInt16BE(p + 5)];
        p += 2 + b.readUInt16BE(p + 2);
      }
    }
    if (type === 'webp') {
      const k = b.toString('latin1', 12, 16);
      if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (k === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
      if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    }
  } catch (e) {}
  return null;
}
// colours in a sample of the PNG: a drawn interface has hundreds to a few thousand, a photo tens of thousands
function colours(b) {
  try {
    const im = decode(b), n = im.width * im.height, step = Math.max(1, Math.floor(n / 200000)), seen = new Set();
    let k = 0;
    for (let i = 0; i < n; i += step, k++) { const s = i * 4; seen.add((im.data[s] << 16) | (im.data[s + 1] << 8) | im.data[s + 2]); }
    return [seen.size, seen.size / k];
  } catch (e) { return [-1, 0]; }
}

const items = [];
const re = /data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)/g;
let m;
while ((m = re.exec(h))) {
  const mime = m[1], b64 = m[2].replace(/\s+/g, '');
  const before = h.slice(Math.max(0, m.index - 300), m.index);
  // where it sits: the tag it is in and its id/class, or the CSS selector before it
  const tag = before.match(/<(img|image|source|link|style|div|span)\b([^<>]*)$/i);
  let where = '';
  if (tag) {
    const id = (tag[2].match(/\bid="([^"]+)"/) || [])[1], cls = (tag[2].match(/\bclass="([^"]+)"/) || [])[1];
    // the attributes after the data URI count too: width="…" usually follows src
    const attrs = tag[2] + ' ' + (h.slice(m.index + m[0].length, m.index + m[0].length + 400).match(/^[^>]*/) || [''])[0];
    const w = (attrs.match(/\bwidth="?(\d+(?:\.\d+)?)/) || attrs.match(/width:\s*(\d+(?:\.\d+)?)px/) || [])[1];
    where = '<' + tag[1].toLowerCase() + (id ? '#' + id : '') + (cls ? '.' + cls.trim().split(/\s+/).slice(0, 2).join('.') : '') + '>';
    items.push({ mime, b64, where, cssW: w ? parseFloat(w) : null });
  } else {
    const sel = (before.match(/([^{};>]+)\{[^{}]*$/) || [])[1];
    where = sel ? 'css ' + sel.trim().slice(-40) : (before.match(/(?:const|var|let)\s+(\w+)\s*=\s*['"`]?$/) || [, 'script'])[1];
    items.push({ mime, b64, where, cssW: null });
  }
}

const groups = { plates: 0, fonts: 0, other: 0 };
const byHash = new Map();
for (const it of items) {
  const buf = Buffer.from(it.b64, 'base64');
  it.inline = it.b64.length;
  it.bytes = buf.length;
  it.type = (it.mime.split('/')[1] || '').replace('svg+xml', 'svg');
  it.px = dims(it.type, buf);
  it.hash = crypto.createHash('sha1').update(buf).digest('hex');
  byHash.set(it.hash, (byHash.get(it.hash) || 0) + 1);
  it.kind = /^image\//.test(it.mime) ? 'plates' : /font|woff|ttf|otf/.test(it.mime) ? 'fonts' : 'other';
  groups[it.kind] += it.inline;
  it.hints = [];
  if (it.type === 'png' && it.bytes > 100 * 1024) {
    // a drawn interface repeats its colours (under 2% of the pixels are distinct, even with
    // anti-aliasing and gradients); a photo barely does
    const [c, ratio] = colours(buf);
    if (c > 20000 || ratio > 0.1) it.hints.push(`photo-like (${c} colours in ${Math.round(100 * ratio)}% of the pixels): encode.sh to WebP`);
  }
  if (it.cssW && it.px && Math.abs(it.px[0] - 2 * it.cssW) > 1)
    it.hints.push(it.px[0] > 2 * it.cssW
      ? `over 2x: ${it.px[0]}px wide, shown at ${it.cssW} — encode.sh --width ${Math.round(2 * it.cssW)} (a raw image at its own resolution pays for pixels no screen shows)`
      : `not 2x: ${it.px[0]}px wide, shown at ${it.cssW} — soft on a DPR 2 screen`);
}
for (const it of items) if (byHash.get(it.hash) > 1) it.hints.push(`duplicate ×${byHash.get(it.hash)}`);

const markup = total - groups.plates - groups.fonts - groups.other;
console.log(`weight: ${file} — ${MB(total)} of ${MB(LIMIT)}${total > LIMIT ? ' — OVER THE LIMIT' : ''}`);
console.log(`        plates ${MB(groups.plates)} · fonts ${MB(groups.fonts)} · other data ${MB(groups.other)} · markup and scripts ${MB(markup)}`);
const dupWaste = [...byHash.entries()].filter(([, n]) => n > 1)
  .reduce((a, [hh, n]) => a + (n - 1) * items.find(i => i.hash === hh).inline, 0);
if (dupWaste) console.log(`        duplicates cost ${MB(dupWaste)}: the same bytes inlined more than once`);
const list = items.filter(i => i.kind !== 'fonts').sort((a, b) => b.inline - a.inline);
for (const it of list.slice(0, TOP))
  console.log(`  ${KB(it.inline).padStart(8)}  ${it.type.padEnd(4)} ${(it.px ? it.px.join('×') : '').padEnd(11)} ${it.where}${it.hints.length ? '  ! ' + it.hints.join('; ') : ''}`);
if (list.length > TOP) console.log(`  … ${list.length - TOP} more, ${MB(list.slice(TOP).reduce((a, i) => a + i.inline, 0))}`);
process.exit(total > LIMIT ? 1 : 0);
