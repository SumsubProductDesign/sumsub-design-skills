// test-scaffold.js — the two things an UNMODERATED test needs around the prototype and the design
// does not draw: a bar with the task, and the screen that ends it. references/unmoderated.md.
//
//   const T = require(SKILL + '/assets/templates/test-scaffold.js');
//   page.css += T.css;  page.script += T.script;
//   T.testBar({step, total, task, links: [{label, href}]})      // 40px strip above the canvas
//   T.outcome({step, total, platform: 'Wynde', lines: [...], id, hidden})   // the end-of-task card
//
// Deliberately NOT the design system: system font, a colour the product never uses, so the
// respondent reads it as "the test" and does not rate it with the UI. Every element carries
// data-scaffold, so a zone diff, a hit test or a text check can leave it out.
//
// The copy of the outcome card is fixed by what went wrong on 2026-09-30 → 10-02 (Wynde):
//   * it says the task is done and which of how many — the platform's completion is a self-report
//     ("Yes, I did"), so the respondent has to be told they are done;
//   * one button, "Back to <platform>", TRIES window.close() — which closes only tabs a script
//     opened, and whether the platform's recording tab is one nobody can say — and when the tab is
//     still there 400 ms later becomes the instruction: click the platform's tab, or
//     Control + Shift + Tab (every browser, both platforms), then answer "Yes, I did";
//   * never a glyph shortcut (⌘ ⌥ ← was Chrome-only and not recognised), never "leave this tab
//     open", never a code to copy: a completion code built for the analysis was removed within
//     an hour as "super complicated for respondents". The analysis reads window.__events.
// The script also disarms every target="_blank" at load: the platform records one tab, and a
// second tab is a hole in the recording. It is a last line of defence; the link should not exist.
'use strict';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const css = `
.ts-bar,.ts-done{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#3b2f00;box-sizing:border-box}
.ts-bar{position:relative;z-index:60;display:flex;align-items:center;gap:16px;height:40px;padding:0 16px;background:#fff3bf;border-bottom:1px solid #e9d48a;font-size:13px;line-height:20px}
.ts-bar b{font-weight:600;white-space:nowrap}
.ts-bar .ts-task{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ts-bar .ts-menu{position:relative}
.ts-bar .ts-menu>button{font:inherit;color:inherit;background:#fff;border:1px solid #e9d48a;border-radius:6px;padding:2px 10px;cursor:pointer}
.ts-bar .ts-menu>div{display:none;position:absolute;right:0;top:28px;min-width:200px;background:#fff;border:1px solid #e9d48a;border-radius:8px;padding:4px;box-shadow:0 4px 12px rgba(0,0,0,.08)}
.ts-bar .ts-menu.open>div{display:block}
.ts-bar .ts-menu a{display:block;padding:6px 10px;color:#3b2f00;text-decoration:none;border-radius:6px;font-size:13px}
.ts-bar .ts-menu a:hover{background:#fff3bf}
.ts-done[hidden]{display:none}
.ts-done{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(243,244,246,.96)}
.ts-done .ts-card{width:480px;max-width:calc(100vw - 32px);background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px 32px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.08);color:#111827}
.ts-done h2{margin:0 0 8px;font-size:18px;line-height:24px;font-weight:600}
.ts-done p{margin:0 0 6px;font-size:14px;line-height:20px;color:#4b5563}
.ts-done .ts-back{margin-top:18px;font:inherit;font-size:14px;font-weight:600;color:#fff;background:#111827;border:0;border-radius:8px;padding:10px 20px;cursor:pointer}
.ts-done .ts-how{display:none;margin-top:18px;padding:14px 16px;background:#fff3bf;border:1px solid #e9d48a;border-radius:8px;text-align:left;font-size:14px;line-height:20px;color:#3b2f00}
.ts-done .ts-how kbd{font:inherit;font-size:13px;padding:0 5px;border:1px solid #c9b35e;border-radius:4px;background:#fff}
.ts-done.ts-manual .ts-back{display:none}
.ts-done.ts-manual .ts-how{display:block}`;

const script = `
window.__events = window.__events || [];
(function(){
  function ev(k, d){ window.__events.push({t: Date.now(), k: k, d: d || null}); }
  // one tab is recorded: a link to a new tab is a hole in the recording
  document.querySelectorAll('[target="_blank"]').forEach(function(a){ a.removeAttribute('target'); ev('blank-link-disarmed', a.getAttribute('href')); });
  document.addEventListener('click', function(e){
    var m = e.target.closest && e.target.closest('.ts-menu');
    document.querySelectorAll('.ts-menu.open').forEach(function(x){ if (x !== m) x.classList.remove('open'); });
    if (m && e.target.closest('button')) m.classList.toggle('open');
    var b = e.target.closest && e.target.closest('.ts-back');
    if (!b) return;
    var card = b.closest('.ts-done');
    ev('back-to-platform', card.id || null);
    try { window.close(); } catch (x) {}
    // still here 400 ms later: the tab was not opened by a script, so it cannot close itself
    setTimeout(function(){ if (!window.closed) { card.classList.add('ts-manual'); ev('close-refused', card.id || null); } }, 400);
  }, true);
  window.tsOutcome = function(id){ var c = document.getElementById(id); if (!c) return; c.hidden = false; ev('outcome', id); };
})();`;

// testBar({step, total, task, links: [{label, href}], menuLabel})
function testBar(o = {}) {
  const links = (o.links || []).map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('');
  return `<div class="ts-bar" data-scaffold role="region" aria-label="Test task">`
    + (o.step ? `<b>Task ${esc(o.step)}${o.total ? ` of ${esc(o.total)}` : ''}</b>` : '')
    + `<span class="ts-task" title="${esc(o.task)}">${esc(o.task)}</span>`
    + (links ? `<span class="ts-menu"><button type="button" aria-haspopup="true">${esc(o.menuLabel || 'Registries')} ▾</button><div>${links}</div></span>` : '')
    + `</div>`;
}

// outcome({step, total, platform, lines: [...], id, hidden}) — shown by tsOutcome(id), or hidden:false
function outcome(o = {}) {
  const platform = o.platform || 'the test';
  const id = o.id || 'ts-done';
  return `<div class="ts-done" data-scaffold id="${esc(id)}" role="dialog" aria-modal="true" aria-labelledby="${esc(id)}-t"${o.hidden === false ? '' : ' hidden'}>`
    + `<div class="ts-card"><h2 id="${esc(id)}-t">Task ${esc(o.step || 1)}${o.total ? ` of ${esc(o.total)}` : ''} done</h2>`
    + (o.lines || []).map(l => `<p>${esc(l)}</p>`).join('')
    + `<p>Go back to ${esc(platform)} to continue.</p>`
    + `<button type="button" class="ts-back">Back to ${esc(platform)}</button>`
    + `<div class="ts-how"><b>This tab can't close itself.</b> Click the <b>${esc(platform)}</b> tab at the top of your browser, `
    + `or press <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>Tab</kbd> (the same keys on Mac and Windows). `
    + `Then answer <b>“Yes, I did”</b>.</div>`
    + `</div></div>`;
}

module.exports = {css, script, testBar, outcome};
