#!/usr/bin/env node
// grab.js <persisted-mcp-response.json> <prefix> [outdir]
// Keeps a large get_design_context response OUT of the conversation:
// writes its text to <outdir>/<prefix>.jsx for grepping, and curls every asset
// it references into <outdir>/icons/. Asset traffic costs no tokens.
const fs = require('fs'), path = require('path'), {execSync} = require('child_process');
const [file, prefix = '', outdir = '_work/figma-ref'] = process.argv.slice(2);
if (!file) { console.error('usage: grab.js <persisted.json> <prefix> [outdir]'); process.exit(1); }
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const txt = (Array.isArray(j) ? j.map(x => x.text) : [j.text || JSON.stringify(j)]).join('\n=====\n');
fs.mkdirSync(path.join(outdir, 'icons'), {recursive: true});
const outTxt = path.join(outdir, prefix + '.jsx');
fs.writeFileSync(outTxt, txt);
const re = /const (\w+) = "(https:\/\/[^"]*figma\.com\/api\/mcp\/asset\/[^"]+)";/g;
const list = []; let m;
while ((m = re.exec(txt))) list.push([m[1], m[2]]);
for (const [name, url] of list) {
  const ext = url.split('.').pop().replace(/[^a-z0-9]/gi, '') || 'svg';
  const out = path.join(outdir, 'icons', `${prefix}__${name}.${ext}`);
  if (!fs.existsSync(out)) execSync(`curl -sL -o "${out}" "${url}"`);
}
console.log(`jsx: ${outTxt} (${txt.length} chars), assets: ${list.length}`);
console.log(list.map(x => x[0]).join(' '));
