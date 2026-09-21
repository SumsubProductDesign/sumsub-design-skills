// Shared by the .js tools: locate a headless-capable Chrome. Same search order
// as _chrome.sh, so both halves of the toolkit agree on the binary.
//
//   const {CHROME} = require('./_chrome.cjs');
//
// Override with CHROME=/path/to/binary. Any Chromium-based browser from
// version 112 on works (that is where --headless=new arrived): Chrome,
// Chromium, Brave, Edge.
const fs = require('fs');
const {execSync} = require('child_process');

function which(name) {
  try { return execSync(`command -v ${name}`, {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); }
  catch (e) { return ''; }
}
function runnable(p) {
  try { fs.accessSync(p, fs.constants.X_OK); return true; } catch (e) { return false; }
}

if (process.env.CHROME && !runnable(process.env.CHROME)) {
  console.error(`CHROME is set to '${process.env.CHROME}' but that is not an executable`);
  process.exit(1);
}
const CANDIDATES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  which('google-chrome'), which('google-chrome-stable'),
  which('chromium'), which('chromium-browser'),
  which('brave-browser'), which('microsoft-edge'),
].filter(Boolean);

const CHROME = CANDIDATES.find(runnable);
if (!CHROME) {
  console.error('no Chrome found; set CHROME=/path/to/chrome (Chrome, Chromium, Brave or Edge, 112+)');
  process.exit(1);
}
module.exports = {CHROME};
