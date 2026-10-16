#!/usr/bin/env node
// _cdp.cjs — headless Chrome over the DevTools protocol, for what the command line cannot do.
//
// Chrome's command line clamps --window-size to 500px wide: a 375 render asked that way is laid
// out at 500 and the PNG is cropped to 375, so a centred block sits 62px right of where it is on
// a phone and every mobile check reads a desktop layout (a WebSDK run, 2026-10-05, found it only
// when a person opened the file on a phone). Device emulation through the protocol renders at the
// width asked, as a phone would. The same channel clicks a live page and reads it afterwards,
// which is how the Storybook snapshot (sbkit.cjs) gets the open state of a dialog.
//
//   const {launch} = require('./_cdp.cjs');
//   const b = await launch({width: 375, height: 812, mobile: true, scale: 1});
//   await b.navigate('file:///…/page.html');     // resolves on the load event
//   await b.until('document.getElementById("__probe")', 6000);   // poll an expression until truthy
//   const v = await b.eval('document.title');     // a value; a returned Promise is awaited
//   await b.screenshot('out.png');                // the viewport, width × scale pixels wide
//   const html = await b.dom();                   // document.documentElement.outerHTML
//   await b.close();
//
//   node _cdp.cjs shot <url> <WxH> <out.png> [--mobile] [--scale N] [--wait ms]
//                      [--until 'expr'] [--js 'expr'] [--dom out.html]
//     renders one page at exactly WxH; --js runs before the screenshot; --until waits (up to 8 s)
//     for an expression to be truthy; --dom writes the document after everything else.
//     --mobile adds a phone's semantics (touch, the mobile viewport rules): only for a page that
//     carries a <meta name="viewport">, as the SDK's pages do — without one a phone lays the page
//     out at 980px and zooms out, and a 200-wide fixture rendered that way came back blank
//
// Every shot is on a clock — CHROME_TIMEOUT seconds, 60 by default (_chrome.cjs): a Chrome that
// hangs is killed, the call prints one line and exits, instead of holding a pre-commit for hours.
// Needs Node 22 or newer (the global WebSocket) and the Chrome that _chrome.cjs finds. The
// profile is a temp directory and is removed on close; the debugging port is Chrome's choice
// (--remote-debugging-port=0), read back from DevToolsActivePort, so two renders never collide.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), {spawn} = require('child_process');
const {CHROME, watchdog, deadline} = require(path.join(__dirname, '_chrome.cjs'));

if (typeof WebSocket === 'undefined') {
  console.error(`_cdp.cjs needs Node 22 or newer (the global WebSocket); this is ${process.version}. install:  brew install node`);
  process.exit(1);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch({width = 1440, height = 900, mobile = false, scale = 1, flags = []} = {}) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--allow-file-access-from-files', '--remote-debugging-port=0', '--user-data-dir=' + prof,
    '--window-size=' + Math.max(width, 500) + ',' + height, ...flags, 'about:blank'], {stdio: 'ignore'});
  watchdog(ch, '_cdp');                         // killed on the clock (CHROME_TIMEOUT, 60 s); every call after that fails
  let port = 0;
  for (let i = 0; i < 80 && !port && ch.exitCode === null; i++) {       // Chrome writes the port it chose; ~1 s on a laptop
    await sleep(125);
    try { port = Number(fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0]); } catch (e) {}
  }
  if (!port) { ch.kill('SIGKILL'); throw new Error(ch.exitCode !== null ? 'Chrome exited before opening a debugging port' : 'Chrome did not open a debugging port'); }
  let page = null;
  for (let i = 0; i < 40 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch (e) {}
    if (!page) await sleep(125);
  }
  if (!page) { ch.kill('SIGKILL'); throw new Error('no page target on the debugging port'); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 0; const pending = {}; const listeners = {};
  // a Chrome that died (the watchdog) answers nothing: every call still waiting fails with a reason
  ws.addEventListener('close', () => { for (const k of Object.keys(pending)) { pending[k]({error: {message: 'Chrome closed' + (ch.timedOut ? ' — killed on the clock' : '')}}); delete pending[k]; } });
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
    else if (m.method && listeners[m.method]) listeners[m.method].forEach(f => f(m.params));
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending[i] = m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result);
    ws.send(JSON.stringify({id: i, method, params}));
  });
  const on = (method, f) => { (listeners[method] = listeners[method] || []).push(f); };
  const isMobile = !!mobile;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: scale, mobile: isMobile});
  if (isMobile) await send('Emulation.setTouchEmulationEnabled', {enabled: true});

  const b = {
    port, mobile: isMobile,
    send, on,
    // navigate: resolves on Page.loadEventFired, or after `timeout` ms with a warning — 20 s is for a cold Storybook
    // story, whose first load fetches every chunk (sbkit.cjs retries it once); a prototype loads in under a second
    navigate(url, timeout = 20000) {
      return new Promise(async (res) => {
        let done = false;
        const t = setTimeout(() => { if (!done) { done = true; console.error('_cdp: load event did not fire within ' + timeout + ' ms for ' + url); res(false); } }, timeout);
        on('Page.loadEventFired', () => { if (!done) { done = true; clearTimeout(t); res(true); } });
        await send('Page.navigate', {url});
      });
    },
    // eval: the value of an expression in the page; a Promise is awaited; an exception throws here
    async eval(expr) {
      const r = await send('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true});
      if (r.exceptionDetails) throw new Error('page: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
      return r.result.value;
    },
    // until: poll an expression every `step` ms until it is truthy; false when `timeout` runs out — 8 s is a probe's
    // own budget (statecheck.sh waits as long for a probe's answer), 100 ms keeps the poll cheap
    async until(expr, timeout = 8000, step = 100) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) {
        try { if (await b.eval(expr)) return true; } catch (e) {}
        await sleep(step);
      }
      return false;
    },
    wait: sleep,
    async screenshot(out) {
      const s = await send('Page.captureScreenshot', {format: 'png'});
      fs.writeFileSync(out, Buffer.from(s.data, 'base64'));
      return out;
    },
    dom: () => b.eval('document.documentElement.outerHTML'),
    async close() {
      try { ws.close(); } catch (e) {}
      ch.kill('SIGKILL');
      await sleep(50);
      fs.rmSync(prof, {recursive: true, force: true});
    },
  };
  return b;
}

module.exports = {launch};

if (require.main === module) {
  const a = process.argv.slice(2);
  const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  const has = k => a.includes(k);
  const pos = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && ['--scale', '--wait', '--until', '--js', '--dom'].includes(a[i - 1])));
  if (pos[0] !== 'shot' || pos.length < 4) {
    console.error('usage: _cdp.cjs shot <url> <WxH> <out.png> [--mobile] [--scale N] [--wait ms] [--until expr] [--js expr] [--dom out.html]');
    process.exit(1);
  }
  const [, url, size, out] = pos;
  const [w, h] = size.split('x').map(Number);
  if (!w || !h) { console.error('_cdp: size must be WxH, got ' + size); process.exit(1); }
  deadline('_cdp');                           // the whole shot on one clock: exit 124 with a line if it is still running
  (async () => {
    const b = await launch({width: w, height: h, mobile: has('--mobile'), scale: Number(opt('--scale', 1))});
    try {
      await b.navigate(url);
      await b.wait(Number(opt('--wait', 300)));
      if (opt('--js')) await b.eval(opt('--js'));
      if (opt('--until')) { const ok = await b.until(opt('--until')); if (!ok) console.error('_cdp: --until expression stayed falsy for 8 s: ' + opt('--until')); }
      await b.screenshot(out);
      if (opt('--dom')) fs.writeFileSync(opt('--dom'), await b.dom());
      console.log(`shot: ${out} (${w}x${h}${b.mobile ? ', mobile' : ''}, scale ${opt('--scale', 1)})`);
    } finally { await b.close(); }
  })().catch(e => { console.error('_cdp: ' + (e && e.message)); process.exit(1); });
}
