// _dsproxy.cjs — a one-page reverse proxy in front of the design system's Storybook.
//
// Why: a story's computed styles can only be read from a page in the same origin
// as the story. A local file cannot reach into an https iframe, and Chrome's
// --disable-web-security does not change that in headless. Serving both the probe
// page and the Storybook from one localhost origin does.
//
// start({port, probe, upstream, onResult}) -> server. GET /_probe returns the probe
// page, POST /_result hands its body to onResult, and everything else is passed
// through to the upstream host unchanged. The page posting its own answer is what
// lets the caller wait in real time: --virtual-time-budget races ahead of a story's
// stylesheets, and a page measured before its CSS arrives reads as transparent.
const http = require('http'), https = require('https');

function start({port = 0, probe, upstream = 'storybook.sumsub.net', onResult} = {}) {
  const srv = http.createServer((req, res) => {
    if (req.url.startsWith('/_result')) {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => { res.writeHead(204); res.end(); if (onResult) onResult(body); });
      return;
    }
    if (req.url.startsWith('/_probe')) {
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'});
      res.end(probe);
      return;
    }
    const up = https.request({
      host: upstream, path: req.url, method: 'GET',
      headers: {host: upstream, 'accept-encoding': 'identity', 'user-agent': 'sumsub-figma-to-prototype/dscheck'},
    }, u => {
      const h = {...u.headers};
      delete h['content-security-policy'];        // the story must be frameable by the probe
      delete h['x-frame-options'];
      res.writeHead(u.statusCode, h);
      u.pipe(res);
    });
    up.on('error', e => { res.writeHead(502); res.end(String(e && e.message)); });
    up.end();
  });
  srv.listen(port);
  return srv;
}

module.exports = {start};
