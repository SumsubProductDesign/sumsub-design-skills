#!/usr/bin/env node
// artifact-page.js <prototype.html> <out.html> [--bg '#ffffff']
//
// The page a claude.ai artifact publishes, made from the prototype rather than by hand. The
// Artifact tool wraps the page in its own document skeleton, so a file that brings its own
// <!doctype>, <html>, <head> and <body> nests one document in another; and its viewer is
// expected to work at phone width with no sideways scroll of the page. On 2026-10-02 both were
// done by hand in a session, from memory, and the result was never opened in the real viewer.
//
// What it does, and nothing else:
//   * keeps <title>, every <style>, <script> and <link> of the head, in order (charset and
//     viewport metas are dropped: the skeleton has its own);
//   * wraps the body in <div id="artifact-scroll">, a box that scrolls sideways, so a fixed
//     1440 canvas stays 1440 and the page itself never scrolls sideways;
//   * gives html and body the canvas colour (--bg, default: the body's own background, else
//     #ffffff). The prototype is a picture of a light product: the viewer's dark mode must not
//     show a dark frame around it, and the canvas is not themed;
//   * prints the size against the 16 MB page limit, and exits 1 above it.
//
// The prototype itself is not touched: build from gen.js as always, then run this on the output.
// A <body> with attributes is a warning: they are moved onto the wrapper, so a `body.x` selector
// stops matching. no-font: it copies the prototype's own @font-face, it emits none of its own.
'use strict';
const fs = require('fs');
const args = process.argv.slice(2);
let bg = '';
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--bg') bg = args[++i] || '';
  else pos.push(args[i]);
}
const [src, out] = pos;
if (!src || !out) {
  console.error("usage: artifact-page.js <prototype.html> <out.html> [--bg '#ffffff']");
  process.exit(2);
}
const h = fs.readFileSync(src, 'utf8');
const LIMIT = 16 * 1024 * 1024;

const head = (h.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
const bm = h.match(/<body\b([^>]*)>([\s\S]*)<\/body>/i);
if (!bm) { console.error('artifact-page: no <body> in ' + src); process.exit(1); }
const bodyAttrs = bm[1].trim();
const body = bm[2];

// the head, minus what the skeleton supplies itself
const kept = [];
const re = /<title\b[^>]*>[\s\S]*?<\/title>|<style\b[^>]*>[\s\S]*?<\/style>|<script\b[^>]*>[\s\S]*?<\/script>|<link\b[^>]*>/gi;
let m;
while ((m = re.exec(head))) kept.push(m[0]);
if (!kept.some(t => /^<title/i.test(t))) console.error('artifact-page: warning — no <title>; the artifact is named after the file');

if (!bg) {
  const css = kept.filter(t => /^<style/i.test(t)).join('\n');
  const rule = css.match(/(?:^|[}\s,>])body\s*\{([^}]*)\}/);
  const v = rule && rule[1].match(/background(?:-color)?\s*:\s*([^;}]+)/);
  bg = v ? v[1].trim() : '#ffffff';
}
if (bodyAttrs) console.error('artifact-page: warning — <body ' + bodyAttrs + '> moved onto #artifact-scroll; a body.* selector no longer matches');

const page = kept.join('\n') + '\n'
  + '<style>html,body{margin:0;padding:0;background:' + bg + '}'
  + '#artifact-scroll{overflow-x:auto;max-width:100vw}</style>\n'
  + '<div id="artifact-scroll"' + (bodyAttrs ? ' ' + bodyAttrs.replace(/\bid="[^"]*"/, '') : '') + '>'
  + body + '</div>\n';
fs.writeFileSync(out, page);

const n = Buffer.byteLength(page);
const mb = (n / 1048576).toFixed(1);
console.log(`artifact-page: ${out} — ${mb} MB of 16${n > LIMIT ? ' — OVER THE LIMIT, the publish will be refused' : ''}`);
if (/<!doctype|<html\b|<\/?head\b|<\/?body\b/i.test(page.replace(/<script\b[\s\S]*?<\/script>/gi, '')))
  console.error('artifact-page: warning — a document tag is still in the output (inside a template string?)');
process.exit(n > LIMIT ? 1 : 0);
