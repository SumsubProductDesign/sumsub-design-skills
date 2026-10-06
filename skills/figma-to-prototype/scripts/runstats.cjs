#!/usr/bin/env node
// runstats.cjs [session.jsonl] [--since ISO | --round] — section 5 of the run log, counted instead of guessed.
//
// Claude Code keeps every session as a transcript: ~/.claude/projects/<cwd with every
// non-alphanumeric character turned into "-">/<session id>.jsonl (CLAUDE_CONFIG_DIR moves
// ~/.claude). Each line carries a timestamp; assistant lines carry their tool calls and the
// token usage of the request, so time, tool calls and context are in there, and they stay
// there after the session: a log written the next day can still fill §5 exactly. On
// 2026-10-02 a log written after the fact marked all four fields "not measured".
//
// With no argument it reads the newest transcript of the current directory's project. Prints:
//   * skill    — the version that ran: plugin.json beside the skill, or the git commit of a
//                standalone copy (a plugin version alone hides which skill code it carried);
//   * wall     — first line to last, and how much of it was the person's turn (the gaps before
//                each of their messages), so the agent's own time is the rest;
//   * rounds   — every message the person typed, with its time: the rows of §1's rounds table;
//   * tools    — calls by tool, Figma MCP split by call, and the skill's scripts by name;
//   * cost     — one line to end a delivery with: minutes, tool calls, Figma calls and the phase
//                that took most of the growth. --round counts from the person's last message, i.e.
//                this increment only. "Why did that take so long?" was asked six times in two
//                weeks of one person's sessions, each time after the fact; the line answers it first
//   * context  — the peak and the last prompt size (input + cache), output tokens, compactions,
//                and the growth split into extraction / build / verification / other by which
//                tools the turn before called. The split is an estimate; the totals are not.
// Reads the file, writes nothing. no-font: it emits no page.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

const argv = process.argv.slice(2);
let file = '', since = '', round = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--since') since = argv[++i] || '';
  else if (argv[i] === '--round') round = true;
  else if (argv[i] === '-h' || argv[i] === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 20).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
  else file = argv[i];
}
if (!file) {
  const base = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');
  // the session's cwd may be a parent of the project folder (one folder per prototype, the session opened
  // above it): walk up until a folder has transcripts (2026-10-06: a run in <session>/<prototype>/ found none)
  let list = [], d = process.cwd(), dir = '';
  while (!list.length && d) {
    dir = path.join(base, d.replace(/[^A-Za-z0-9]/g, '-'));
    try { list = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).map(f => path.join(dir, f)); } catch (e) {}
    d = path.dirname(d) === d ? '' : path.dirname(d);
  }
  if (!list.length) { console.error(`runstats: no transcript under ${dir} — pass the .jsonl path`); process.exit(2); }
  file = list.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

// the skill version that RAN: the copy whose files the session itself read or executed, found in
// the transcript — a plugin's versioned cache path, or a project / user skills folder. The copy this
// script lives in is only the fallback: on 2026-10-06 a test run in a folder without the dev copy
// used the plugin, and this line reported the dev commit
function versionOf(dir) {
  for (const p of [path.join(dir, '..', '..', '.claude-plugin', 'plugin.json')]) {
    try { return 'plugin ' + JSON.parse(fs.readFileSync(p, 'utf8')).version; } catch (e) {}
  }
  const m = dir.match(/plugins\/cache\/[^/]+\/[^/]+\/([0-9][^/]*)\//);
  if (m) return 'plugin ' + m[1];
  try { return 'commit ' + cp.execSync('git -C "' + dir + '" log -1 --format="%h %ad" --date=short', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) {}
  try { return fs.readFileSync(path.join(dir, '.version-under-test'), 'utf8').trim(); } catch (e) {}
  return 'unknown';
}
function versionUsed(text) {
  const seen = new Map();
  for (const m of text.matchAll(/((?:\/[^\s"'`:\\]+?)?\/(?:\.claude\/skills|skills)\/figma-to-prototype)\/(?:SKILL\.md|scripts|references|assets)/g)) {
    let dir = m[1].replace(/^\$HOME/, os.homedir());
    // only a copy that exists, under its real path: '$HOME/…' and '/Users/…' are one copy, and a
    // fragment of a path quoted in a message is none
    if (!dir.startsWith('/') || !fs.existsSync(path.join(dir, 'SKILL.md'))) continue;
    try { dir = fs.realpathSync(dir); } catch (e) {}
    seen.set(dir, (seen.get(dir) || 0) + 1);
  }
  if (!seen.size) return null;
  const dirs = [...seen.entries()].sort((a, b) => b[1] - a[1]);
  const where = d => d.includes('/plugins/cache/') ? 'plugin cache' : d.includes('/plugins/marketplaces/') ? 'marketplace clone' : d.includes('/.claude/skills/') && !d.startsWith(path.join(os.homedir(), '.claude')) ? 'project skill ' + d : d.startsWith(path.join(os.homedir(), '.claude', 'skills')) ? 'user skill' : d;
  return dirs.map(([d]) => `${versionOf(d)} (${where(d)})`).join('; ') + (dirs.length > 1 ? ' — MORE THAN ONE COPY was used' : '');
}
let version = 'unknown';

const all = [];
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  try { all.push(JSON.parse(line)); } catch (e) {}
}
const isPerson = o => {
  if (o.type !== 'user' || o.isMeta || o.isSidechain) return false;
  const c = (o.message || {}).content;
  const text = typeof c === 'string' ? c : Array.isArray(c) && !c.some(x => x.type === 'tool_result') ? c.filter(x => x.type === 'text').map(x => x.text).join(' ') : null;
  return text !== null && text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').replace(/<[^>]+>/g, ' ').trim() !== '';
};
if (round) {
  const last = all.filter(o => isPerson(o) && o.timestamp).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  if (last) since = last.timestamp;
}
const rows = all.filter(o => !since || !o.timestamp || o.timestamp >= since);
const T = o => (o.timestamp ? Date.parse(o.timestamp) : NaN);
const stamped = rows.filter(o => !isNaN(T(o)));
if (!stamped.length) { console.error('runstats: no timestamped lines in ' + file); process.exit(2); }

const SCRIPTS = /\b(statecheck|zonediff|shellgate|blockgate|inkbbox|pixprobe|minpx|scanline|shoot|crop|cut|scaletest|fluidcheck|probe|doctor|lint|figmeta|figctx|grab|icons|svg_dump|align_exports|hex_sweep|bbox|shell|publish|unpublish|artifact-page|runstats)\.(?:sh|js|cjs|py)\b/g;
const phaseOf = (name, input) => {
  const s = name + ' ' + JSON.stringify(input || {});
  if (/figma/i.test(name) || /\b(figmeta|figctx|grab|svg_dump|align_exports|hex_sweep|icons)\.(py|js)\b/.test(s)) return 'extraction';
  if (/\b(statecheck|zonediff|shellgate|blockgate|inkbbox|pixprobe|minpx|scanline|shoot|crop|scaletest|fluidcheck|probe)\.(sh|js)\b/.test(s)) return 'verification';
  if (name === 'Read' && /\.png"/i.test(s)) return 'verification';
  if (/^(Write|Edit|NotebookEdit)$/.test(name) || /\bgen\.js\b|\bcut\.js\b|\bshell\.js\b/.test(s)) return 'build';
  return 'other';
};

const tools = {}, figma = {}, scripts = {}, rounds = [];
const marks = [];
let human = 0, peak = 0, last = 0, out = 0, compactions = 0;
// a form (AskUserQuestion) waits for the person inside a tool call: from the call to its result is
// their turn too, and without this the agent was charged the six minutes a person spent on nine forms
const asks = {}; let askForms = 0, askQuestions = 0, askWait = 0;
const growth = { extraction: 0, build: 0, verification: 0, other: 0 };
const seen = new Set();
let lastSize = 0, lastPhases = null;
for (const o of rows) {
  const m = o.message || {};
  const t = T(o);
  if (o.type === 'system' && /compact/i.test(o.subtype || o.content || '')) compactions++;
  if (o.type === 'user' && !o.isMeta && !o.isSidechain) {
    const c = m.content;
    const text = typeof c === 'string' ? c : Array.isArray(c) && !c.some(x => x.type === 'tool_result')
      ? c.filter(x => x.type === 'text').map(x => x.text).join(' ') : null;
    if (Array.isArray(c)) for (const b of c) {
      if (b.type === 'tool_result' && asks[b.tool_use_id] != null && !isNaN(t)) { askWait += t - asks[b.tool_use_id]; delete asks[b.tool_use_id]; }
    }
    if (text !== null) {
      const clean = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean) {
        // the person's turn runs from the agent's last line to their message; the bookkeeping
        // lines in between (attachments, titles, queue entries) carry the message's own time
        if (!isNaN(t)) marks.push([t, 'person']);
        rounds.push([o.timestamp, clean]);
      }
    }
  }
  if (o.type === 'assistant' && !o.isSidechain) {
    if (!isNaN(t)) marks.push([t, 'agent']);
    const id = m.id || o.uuid;
    const first = !seen.has(id); seen.add(id);
    const u = m.usage;
    if (first && u) {
      const size = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      if (lastSize && size < lastSize * 0.6) compactions++;
      else if (lastSize && lastPhases && size > lastSize) {
        const d = (size - lastSize) / lastPhases.length;
        for (const p of lastPhases) growth[p] += d;
      }
      lastSize = size; lastPhases = null;
      peak = Math.max(peak, size); last = size; out += u.output_tokens || 0;
    }
    for (const b of m.content || []) {
      if (b.type !== 'tool_use') continue;
      tools[b.name] = (tools[b.name] || 0) + 1;
      if (b.name === 'AskUserQuestion') { askForms++; askQuestions += ((b.input || {}).questions || []).length; if (!isNaN(t)) asks[b.id] = t; }
      if (/figma/i.test(b.name)) { const k = b.name.replace(/^.*__/, ''); figma[k] = (figma[k] || 0) + 1; }
      if (b.name === 'Bash') for (const s of new Set(String((b.input || {}).command || '').match(SCRIPTS) || [])) scripts[s] = (scripts[s] || 0) + 1;
      (lastPhases = lastPhases || []).push(phaseOf(b.name, b.input));
    }
  }
}

// a resumed session appends lines whose times are not in file order, so time is read sorted:
// the person's turn runs from the agent's last line before their message to the message
marks.sort((a, b) => a[0] - b[0]);
let lastAgent = NaN;
for (const [t, who] of marks) {
  if (who === 'agent') lastAgent = t;
  else if (!isNaN(lastAgent)) { human += t - lastAgent; lastAgent = NaN; }
}
human += askWait;
const times = stamped.map(T).sort((a, b) => a - b);
const t0 = times[0], t1 = times[times.length - 1];
const wall = t1 - t0;
const hm = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`; };
const k = n => (n >= 1000 ? Math.round(n / 1000) + 'k' : String(n));
const list = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}`).join(' · ') || 'none';
const nTools = Object.values(tools).reduce((a, b) => a + b, 0);
const nFig = Object.values(figma).reduce((a, b) => a + b, 0);
const g = Object.values(growth).reduce((a, b) => a + b, 0) || 1;

console.log(`transcript: ${file}`);
version = versionUsed(fs.readFileSync(file, 'utf8')) || ('not seen in the transcript; this script is ' + versionOf(path.resolve(__dirname, '..')));
console.log(`skill   : ${version}`);
console.log(`wall    : ${hm(wall)} (${new Date(t0).toISOString().slice(0, 16)} → ${new Date(t1).toISOString().slice(0, 16)} UTC), of which the person's turn ${hm(human)}, the agent's ${hm(wall - human)}`);
console.log(`rounds  : ${rounds.length} messages from the person${askForms ? ` · ${askForms} forms, ${askQuestions} questions, ${hm(askWait)} of their turn` : ''}`);
for (const [ts, txt] of rounds) console.log(`          ${ts.slice(0, 16).replace('T', ' ')}  ${txt.slice(0, 110)}${txt.length > 110 ? '…' : ''}`);
console.log(`tools   : ${nTools} calls — ${list(tools)}`);
console.log(`figma   : ${nFig} calls — ${list(figma)}`);
console.log(`scripts : ${list(scripts)}`);
console.log(`context : peak ${k(peak)}, last ${k(last)}, output ${k(out)}, compactions ${compactions}`);
const top = Object.entries(growth).sort((a, b) => b[1] - a[1])[0];
const topScript = Object.entries(scripts).sort((a, b) => b[1] - a[1])[0];
console.log(`cost    : ${hm(wall - human)} of work · ${nTools} tool calls · ${nFig} Figma${top && top[1] > 0 ? ` · mostly ${top[0]}` : ''}${topScript ? ` (${topScript[0]} ×${topScript[1]})` : ''}`);
console.log(`growth  : extraction ${Math.round(100 * growth.extraction / g)}% · build ${Math.round(100 * growth.build / g)}% · verification ${Math.round(100 * growth.verification / g)}% · other ${Math.round(100 * growth.other / g)}%  (estimate: each turn's growth goes to the tools the turn before called)`);
