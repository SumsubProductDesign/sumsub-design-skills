#!/usr/bin/env node
/**
 * sumsub-design version gate — PreToolUse hook.
 * Cross-platform replacement for version-gate.sh (bash doesn't work on Windows).
 *
 * Runs before any `mcp__figma__use_figma` call. Exit 2 + stderr blocks the
 * tool call; stderr becomes instruction context for Claude.
 *
 * Bypass: set env SUMSUB_SKIP_VERSION_GATE=1 for the current session.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

// ─── Bypass ──────────────────────────────────────────────────────────────────
if (process.env.SUMSUB_SKIP_VERSION_GATE === "1") process.exit(0);

const REMOTE_URL =
  "https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json";
const CACHE_FILE = path.join(os.homedir(), ".cache", "sumsub-design-version-gate.json");
const CACHE_TTL_MS = 60 * 1000;

function semverGe(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0, db = pb[i] || 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return true;
}

function maxSemver(versions) {
  return versions.reduce((best, v) => (semverGe(v, best) ? v : best), "0.0.0");
}

function findPluginJsonPaths(root) {
  const out = [];
  function walk(dir, depth) {
    if (depth > 8) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full, depth + 1);
      else if (ent.isFile() && ent.name === "plugin.json" && /sumsub-design/.test(full) && /\.claude-plugin/.test(full)) {
        out.push(full);
      }
    }
  }
  walk(root, 0);
  return out;
}

function readVersion(pluginJsonPath) {
  try {
    const raw = fs.readFileSync(pluginJsonPath, "utf8");
    const m = raw.match(/"version"\s*:\s*"(\d+\.\d+\.\d+)"/);
    return m ? m[1] : null;
  } catch { return null; }
}

function fetchRemoteVersion() {
  return new Promise((resolve) => {
    const req = https.get(REMOTE_URL, { timeout: 5000 }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        const m = buf.match(/"version"\s*:\s*"(\d+\.\d+\.\d+)"/);
        resolve(m ? m[1] : null);
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

function readCache() {
  try {
    const stat = fs.statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const m = raw.match(/(\d+\.\d+\.\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

function writeCache(v) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, v);
  } catch { /* ignore */ }
}

(async () => {
  const pluginRoot = path.join(os.homedir(), ".claude", "plugins");
  const jsons = findPluginJsonPaths(pluginRoot);
  if (jsons.length === 0) process.exit(0); // can't locate — skip, don't block

  const localVersions = jsons.map(readVersion).filter(Boolean);
  if (localVersions.length === 0) process.exit(0);
  const localVersion = maxSemver(localVersions);

  let remoteVersion = readCache();
  if (!remoteVersion) {
    remoteVersion = await fetchRemoteVersion();
    if (remoteVersion) writeCache(remoteVersion);
  }
  if (!remoteVersion) process.exit(0); // offline — skip

  if (semverGe(localVersion, remoteVersion)) process.exit(0); // up to date

  // Block.
  process.stderr.write(
`STOP. Plugin sumsub-design is out of date. This tool call is blocked.

Local:  v${localVersion}
Remote: v${remoteVersion}

WHAT YOU (CLAUDE) MUST DO NOW — exactly these steps, in order:

1. STOP all further tool calls. Do not create frames, do not import
   components, do not run audits, do not do anything else.

2. Show the user EXACTLY this message (substitute the real versions):

   ⚠️ sumsub-design plugin update available
   Your local version: v${localVersion} · Latest: v${remoteVersion}

   I can update it for you right now by running:
     claude plugin marketplace update sumsub-design
     claude plugin update sumsub-design@sumsub-design

   Reply:
     - yes / update — I will run the two commands via Bash, then you
       quit and reopen Claude Desktop
     - continue anyway — use the current (older) version for this
       session

3. WAIT for the user's reply. Do not proceed on assumption. Do not
   invent "auto mode" or "will mention at the end" — those phrases
   are banned regressions from prior sessions.

4. If user replies yes / update:
     - Run via Bash: claude plugin marketplace update sumsub-design
                   && claude plugin update sumsub-design@sumsub-design
     - On success: tell user to fully quit and reopen Claude Desktop,
       then come back and reply "restarted" to continue.
     - On failure: surface the exact stderr, offer manual fallback.

5. If user replies continue anyway:
     - Set env SUMSUB_SKIP_VERSION_GATE=1 for the session bypass.

The tool call you just attempted was NOT executed. The only acceptable
next action is step 2 above.
`
  );
  process.exit(2);
})();
