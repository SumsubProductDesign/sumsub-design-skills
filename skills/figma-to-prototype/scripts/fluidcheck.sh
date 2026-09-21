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
#
# Mark the parts that matter in the generator:  <div class="col" data-fluid="form">
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PAGE="$1"; shift || true
[ -f "$PAGE" ] || { sed -n '2,18p' "$0"; exit 1; }
WIDTHS="${*:-1280 1440 1920}"
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
return 'scroll ' + wide + '/' + window.innerWidth +
  (wide > window.innerWidth ? ' SIDEWAYS' : ' ok') +
  ' | ' + (cols.join(' · ') || 'no data-fluid marks') +
  ' | clipped ' + (clipped.length ? clipped.length + ': ' + clipped.slice(0, 3).join(', ') : 'none');
JS
)
for W in $WIDTHS; do
  LINE=$("$DIR/statecheck.sh" "$PAGE" --size "${W}x900" --probe "$PROBE" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  printf '%5s : %s\n' "$W" "$LINE"
done
