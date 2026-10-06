#!/usr/bin/env node
// modelcheck.cjs [session.jsonl] — is this session on a model and effort the skill was built for?
//
// The skill is long, and most of what it asks for is checks: the gates, the hit test, the text and frame
// checks, the questions before building. Those are what a smaller model or a low effort skips first, and the
// designers' run logs are mostly made of exactly those misses. The team runs it on Opus or Fable at medium
// effort or above; nothing told a person who started it on something else.
//
// Claude Code writes the model and the effort of every reply into the session's transcript
// (~/.claude/projects/<cwd with non-alphanumerics as "-">/<session>.jsonl), so this reads them rather than
// guessing. With no argument it reads the newest transcript of the current directory's project.
//
// Prints one of:
//   ok    : claude-opus-5-5, effort high
//   OFFER : <the line to show the person, in Russian — the team's language>
//   unknown: <why> (no transcript, no model recorded yet) — then say nothing and carry on
// Exit 0 in every case: the check offers, it never blocks. no-font: it emits no page.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');

const GOOD = /opus|fable/i;
const ORDER = ['low', 'medium', 'high', 'xhigh', 'max'];
const FAMILY = m => (m.match(/opus|fable|sonnet|haiku/i) || [m])[0].replace(/^./, c => c.toUpperCase());

let file = process.argv[2];
if (!file) {
  const base = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'projects');
  let list = [], d = process.cwd();   // the session may have been opened above the project folder: walk up
  while (!list.length && d) {
    const dir = path.join(base, d.replace(/[^A-Za-z0-9]/g, '-'));
    try { list = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).map(f => path.join(dir, f)); } catch (e) {}
    d = path.dirname(d) === d ? '' : path.dirname(d);
  }
  if (!list.length) { console.log('unknown: no transcript for this folder'); process.exit(0); }
  file = list.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}
let model = '', effort = '';
for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let o; try { o = JSON.parse(line); } catch (e) { continue; }
  if (o.type !== 'assistant' || o.isSidechain) continue;
  const m = (o.message || {}).model;
  if (m && m !== '<synthetic>') model = m;
  if (o.effort) effort = String(o.effort).toLowerCase();
}
if (!model) { console.log('unknown: no model recorded in this session yet'); process.exit(0); }

const lowModel = !GOOD.test(model);
const lowEffort = effort && ORDER.indexOf(effort) >= 0 && ORDER.indexOf(effort) < ORDER.indexOf('medium');
if (!lowModel && !lowEffort) { console.log(`ok    : ${model}${effort ? ', effort ' + effort : ''}`); process.exit(0); }

const now = FAMILY(model) + (effort ? ', ' + effort : '');
console.log(`OFFER : Скилл настроен на Opus или Fable с effort от medium, а сейчас ${now} — прототип может выйти хуже. `
  + `Переключить модель или продолжить так?`);
