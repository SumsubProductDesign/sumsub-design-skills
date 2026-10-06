// Real-time capture via CDP: node page/live.mjs <url> <out.png> [waitMs] [js-to-eval-before-shot]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [url, out, wait = '7000', js = ''] = process.argv.slice(2);
const [VW, VH] = (process.env.SIZE || '1440x894').split('x').map(Number);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';   // set CHROME on Linux
const port = 9300 + Math.floor(Math.random() * 500);
const ch = spawn(CHROME, ['--headless=new', ...(process.env.GPU ? [] : ['--disable-gpu']), '--hide-scrollbars', `--remote-debugging-port=${port}`, '--window-size=1440,894',
  '--force-device-scale-factor=1', `--user-data-dir=${mkdtempSync(tmpdir() + '/cdp-')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch { await sleep(100); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(+wait);
if (js) console.log(JSON.stringify((await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })).result?.value));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
ws.close(); ch.kill();
