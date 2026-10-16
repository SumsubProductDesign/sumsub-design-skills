// _transcript.cjs — the transcript of the session that works in a folder; for modelcheck.cjs and runstats.cjs.
//
// Claude Code keeps a session's transcript under ~/.claude/projects/<cwd with every non-alphanumeric as
// "-">/<session>.jsonl (CLAUDE_CONFIG_DIR moves ~/.claude). "The newest file in this folder's project" is
// the wrong answer twice over: the session may have been opened above the project folder (one folder per
// prototype, the session at the parent — 2026-10-06), and the project folder's name is lossy and shared
// (foo_bar and foo-bar map to one). On 2026-10-12 a run folder with no transcript yet walked up to
// ~/Documents/Claude/Code, took another project's newest transcript — a Sonnet session — and modelcheck
// printed OFFER on a Fable run.
//
// So the walk-up takes only a transcript whose first `cwd` line is the folder asked, or a parent of it
// that the transcript names — a session opened above the folder that then worked in it. An unrelated
// session at the parent names the folder nowhere and is skipped. The newest accepted one wins; none is
// null, and the caller says "unknown: no transcript for this folder".
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');

const projectsDir = () => path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');

// the first cwd the transcript records: a regex over the head of the file, not JSON per line — the first
// lines are titles and queue entries without one, and a transcript can be tens of megabytes
function firstCwd(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(1024 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    const m = buf.toString('utf8', 0, n).match(/"cwd":"((?:[^"\\]|\\.)*)"/);
    return m ? JSON.parse('"' + m[1] + '"') : '';
  } finally { fs.closeSync(fd); }
}

const up = d => { const out = []; for (; d; d = path.dirname(d) === d ? '' : path.dirname(d)) out.push(d); return out; };
const isParent = (p, of) => p === of || of.startsWith(p.endsWith('/') ? p : p + '/');

// the transcript's path, or null. cwd as process.cwd() gives it — the physical path, which is what the
// session records
function findTranscript(cwd, base = projectsDir()) {
  const home = os.homedir();
  const names = [cwd].concat(cwd.startsWith(home + '/') ? ['~' + cwd.slice(home.length), '$HOME' + cwd.slice(home.length)] : []);
  for (const level of up(cwd)) {
    const dir = path.join(base, level.replace(/[^A-Za-z0-9]/g, '-'));
    let files;
    try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).map(f => path.join(dir, f)); } catch (e) { continue; }
    files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    for (const f of files) {
      const first = firstCwd(f);
      if (!first || !isParent(first, cwd)) continue;
      if (first === cwd) return f;
      const text = fs.readFileSync(f, 'utf8');
      if (names.some(n => text.includes(n))) return f;
    }
  }
  return null;
}

module.exports = {findTranscript, firstCwd, projectsDir, up};
