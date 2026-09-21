#!/usr/bin/env node
// icons.js <svgdir> [outfile] [--strip-prefix]
// Builds the inline ICONS table from downloaded SVGs. Each file becomes an entry
// stripped of width/height/style, so the vector stretches to whatever
// absolutely-positioned box it is dropped into — exactly what Figma does.
//
// Key = the filename, "__" collapsed to "_" (grab.js names files <zone>__<const>),
// so the same icon pulled from two zones stays two distinct keys. Pass
// --strip-prefix to key by the constant alone; it warns on every collision, and
// collisions are common — a dozen zones each carry their own imgNormalSearch.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const strip = args.includes('--strip-prefix');
const [dir, outfile] = args.filter(a => a !== '--strip-prefix');
if (!dir) { console.error('usage: icons.js <svgdir> [outfile]'); process.exit(1); }
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
  const base = path.basename(f, '.svg');
  const key = strip ? base.split('__').pop() : base.replace(/__/g, '_');
  let s = fs.readFileSync(path.join(dir, f), 'utf8').trim().replace(/\n\s*/g, '');
  s = s.replace(/<svg([^>]*)>/, (m, at) => {
    const vb = (at.match(/viewBox="[^"]*"/) || [''])[0];
    const fr = (at.match(/fill-rule="[^"]*"/) || [''])[0];
    return `<svg ${vb} ${fr} preserveAspectRatio="none" style="display:block;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">`;
  });
  if (out[key]) console.error(`WARNING: duplicate icon key "${key}" (${f})`);
  out[key] = s;
}
const js = 'var ICONS = ' + JSON.stringify(out, null, 0) + ';';
if (outfile) { fs.writeFileSync(outfile, js); console.log(`${outfile}: ${Object.keys(out).length} icons, ${js.length} bytes`); }
else process.stdout.write(js);
