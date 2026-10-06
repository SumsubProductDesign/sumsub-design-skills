// _svg.cjs — ids that are unique per copy, the one thing every SVG insertion needs.
//
// A gradient, clipPath or mask is looked up by id across the WHOLE document. Two copies of
// an icon share their ids, and when the first copy sits in display:none — a hidden state,
// a template row — every reference resolves to it and the visible copy paints nothing.
// Found on 2026-09-24: the AI sparkle in a button vanished the moment a hidden status line
// carrying the same icon was added to the page. No error, no warning, a blank 16px.
//
//   const {uniq} = require('./_svg.cjs');   html += uniq(svgText);   // every insertion
//
// The counter resets with every process, so the same page builds the same ids twice.
'use strict';
let n = 0;
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function uniq(svg) {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  if (!ids.length) return svg;
  const k = '-u' + (++n);
  let s = svg;
  for (const id of ids) {
    const e = escRe(id);
    s = s.replace(new RegExp(`\\sid="${e}"`, 'g'), m => m.slice(0, -1) + k + '"')
         .replace(new RegExp(`url\\(#${e}\\)`, 'g'), () => `url(#${id}${k})`)
         .replace(new RegExp(`href="#${e}"`, 'g'), () => `href="#${id}${k}"`);
  }
  return s;
}
module.exports = {uniq, reset: () => { n = 0; }};
