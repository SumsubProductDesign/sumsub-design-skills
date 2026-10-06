#!/bin/bash
# fluidcheck.sh <page.html> [width ...] — does an elastic page hold at each width?
#
# Renders the page at each width (default 1280 1440 1920) and asks it three
# questions the eye gets wrong:
#
#   scroll   is the document wider than the window — the failure an elastic page
#            exists to avoid. Below the page's own floor it is expected; above it
#            it is a defect
#   columns  the width of every element marked data-fluid="<name>", so a column
#            that collapsed past its floor is a number, not an impression
#   clipped  elements whose content is wider than their box without asking to
#            scroll: the first sign that a label or a field has run out of room
#   wrapped  text that takes more lines than at the widest width given. A label that
#            wraps is not clipped — its box just grows — so on 2026-10-06 every width
#            said "clipped none" while a form label broke onto two lines below 1314,
#            and the floor had to be found by probing heights at ten widths
#
# The widest width is rendered first and is the reference for "wrapped".
# Mark the parts that matter in the generator:  <div class="col" data-fluid="form">
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PAGE="$1"; shift || true
[ -f "$PAGE" ] || { sed -n '2,18p' "$0"; exit 1; }
WIDTHS="$(printf '%s\n' ${*:-1280 1440 1920} | sort -rn | tr '\n' ' ')"
PROBE=$(cat <<'JS'
var doc = document.documentElement;
var cols = [];
document.querySelectorAll('[data-fluid]').forEach(function (e) {
  cols.push(e.getAttribute('data-fluid') + ' ' + Math.round(e.getBoundingClientRect().width));
});
var clipped = [];
document.querySelectorAll('*').forEach(function (e) {
  var c = getComputedStyle(e);
  if (c.overflowX === 'auto' || c.overflowX === 'scroll' || c.textOverflow === 'ellipsis') return;
  if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) clipped.push(e.className || e.tagName);
});
// the overflow may live on <body> rather than on <html>: a shell that hides the scrollbars of
// the document so its island can scroll puts it there, and reading documentElement alone then
// reports ok for a page that is in fact wider than the window (found 2026-09-21).
// No apostrophes in this block: bash 3.2 mis-parses an odd one inside a heredoc in $( ).
var wide = Math.max(doc.scrollWidth, document.body.scrollWidth);
// lines of every element with its own text: one per distinct top among the text's line boxes
var lines = [], wrapped = [], all = document.querySelectorAll('body *');
for (var i = 0; i < all.length; i++) {
  var e = all[i], tops = {}, n = 0, own = false;
  if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') continue;
  for (var k = e.firstChild; k; k = k.nextSibling) {
    if (k.nodeType !== 3 || !k.data.trim()) continue;
    own = true;
    var r = document.createRange(); r.selectNodeContents(k);
    var rs = r.getClientRects();
    for (var j = 0; j < rs.length; j++) if (rs[j].width > 0) { var t = Math.round(rs[j].top); if (!tops[t]) { tops[t] = 1; n++; } }
  }
  if (!own || !n) continue;
  lines.push(i + ':' + n);
  if (REF[i] && n > REF[i]) wrapped.push(e.textContent.trim().replace(/[^A-Za-z0-9 &]/g, '').slice(0, 30) + ' ' + REF[i] + '>' + n);
}
return 'scroll ' + wide + '/' + window.innerWidth +
  (wide > window.innerWidth ? ' SIDEWAYS' : ' ok') +
  ' | ' + (cols.join(' · ') || 'no data-fluid marks') +
  ' | clipped ' + (clipped.length ? clipped.length + ': ' + clipped.slice(0, 3).join(', ') : 'none') +
  ' | wrapped ' + (REFSET ? (wrapped.length ? wrapped.length + ': ' + wrapped.slice(0, 3).join(', ') : 'none') : 'reference') +
  ' ##' + lines.join(',');
JS
)
REF='var REF = {}, REFSET = false;'
for W in $WIDTHS; do
  LINE=$("$DIR/statecheck.sh" "$PAGE" --size "${W}x900" --probe "$REF $PROBE" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  # the first (widest) render's line counts become the reference for the rest
  [ "$REF" = 'var REF = {}, REFSET = false;' ] && REF="var REF = {$(echo "$LINE" | sed 's/.*##//')}, REFSET = true;"
  printf '%5s : %s\n' "$W" "${LINE% ##*}"
done
