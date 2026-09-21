// Static server for a single-file prototype.
//
//   ROOT=. node "$SKILL/scripts/serve.cjs"
//                                          -> serves the current folder on :8788
//   node scripts/serve.cjs                 -> serves the folder ABOVE the script
//                                             (for a copy living in <project>/scripts/)
//   PORT=9001 ENTRY=proto.html ...         -> other port, explicit entry file
//
// Two deliberate choices:
//   * Cache-Control: no-store, so a plain reload always shows the new build.
//     Without it you spend an afternoon debugging a fix that already worked.
//   * ROOT defaults to the folder above the script, so a copy inside the
//     project keeps working after the project is moved or renamed. Run from
//     the skill folder, that default would serve the skill — hence ROOT=.
//
// In the Claude desktop app, register it in .claude/launch.json so the preview
// pane starts it instead of you launching a server by hand:
//   {"version":"0.0.1","configurations":[
//     {"name":"prototype","runtimeExecutable":"node",
//      "runtimeArgs":["<the skill folder>/scripts/serve.cjs"],   // launch.json takes no variables: write
//      "env":{"ROOT":"."},"port":8788}]}          // the path out in full, and fix it if the skill moves
// From a plain terminal, just run the command above.
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = process.env.ROOT
  ? path.resolve(process.env.ROOT)
  : path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 8788);
const ENTRY = process.env.ENTRY || findEntry();

function findEntry() {
  const hit = fs.readdirSync(ROOT).filter(f => /\.html$/i.test(f))
    .sort((a, b) => a.length - b.length)[0];
  return hit || 'index.html';
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const rel = url === '/' ? ENTRY : url.replace(/^\/+/, '');
  const file = path.join(ROOT, rel);
  // never serve outside ROOT, however the path was spelled
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, ENTRY)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain'}).end('not found: ' + rel);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log('prototype on http://localhost:' + PORT + '  (root ' + ROOT +
              ', entry ' + ENTRY + ')');
});
