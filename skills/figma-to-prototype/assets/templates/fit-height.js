// fit-height.js — a fixed-height block that scales down when the window is short: a device mock
// in a preview column, a canvas, a stacked form — anything whose height the frame fixes and a
// laptop does not respect. Width has fluid-page.js; this is the other axis.
//
//   const {css, script} = require(SKILL + '/assets/templates/fit-height.js');
//   <div class="fh-host"><div class="fh" data-fh-h="720" data-fh-reserve="108" data-fh-min="0.2">…</div></div>
//   page.css += css;  page.script += script;      // fitHeight() is global: call it after changing the host
//
// The block scales by (host height − reserve) / data-fh-h, capped at 1, from its top centre, so
// its top edge and horizontal centre stay where the frame put them and only the bottom gives way.
// reserve is what the host keeps around the block: the frame's paddings plus whatever sits under
// it (an actions bar), which therefore stays put. min stops it vanishing on a very short window.
// Read from the 2026-09-24 run, where a 720-high phone scaled to 0.72 in a 700 window while its
// 40px bar did not move. data-fh-h is the block's own height as the frame draws it — pass it,
// because once scaled the element's offsetHeight is still the unscaled one only by accident of
// how transforms work, and a later change to the block would silently change the rule.
const css = `
.fh-host{position:relative}
.fh{transform:scale(var(--fh-s,1));transform-origin:top center}`;
const script = `
function fitHeight(){ var els=document.querySelectorAll('.fh'); for(var i=0;i<els.length;i++){ var el=els[i], host=el.closest('.fh-host')||el.parentElement;
  var h=parseFloat(el.getAttribute('data-fh-h'))||el.offsetHeight, r=parseFloat(el.getAttribute('data-fh-reserve'))||0, min=parseFloat(el.getAttribute('data-fh-min'))||0.2;
  var s=Math.min(1,(host.clientHeight-r)/h); s=Math.max(s,min); el.style.setProperty('--fh-s', s.toFixed(4)); } }
window.addEventListener('resize', fitHeight); fitHeight();`;
module.exports = {css, script};
