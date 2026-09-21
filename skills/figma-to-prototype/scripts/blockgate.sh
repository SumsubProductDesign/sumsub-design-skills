#!/bin/bash
# blockgate.sh <block.html> <node-render.png> [--size WxH] [--out dir] [--span N] [--th N]
#
# The content gate: one call that answers "does this block sit where the design's does". It renders the
# block, then aligns the two images by their ink profiles before measuring — so nobody hunts for the
# node's y offset by hand or mis-crops the reference (that cost a cycle on the AML form, 2026-09-18).
#
#   offset   the shift between the design's render and yours, found by correlation, ±span px. A whole-block
#            offset is where the block is anchored, not a defect; it is what you feed the anchor rule
#            (Step 4) or the ledger
#   bands    every horizontal run of ink in the reference — a label, a field, a row of buttons — with the
#            residual Δ per edge after the offset is removed. Those residuals are the verdict: ≤1px is a
#            match, a single band off is that element, all bands off the same way means the offset is wrong
#   missing  a band the reference has and the render does not: something is not built
#
# The reference is the Figma node's own render (`get_screenshot` of the node, not of the frame).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_chrome.sh"
SRC="$1"; REF="$2"; shift 2 || true
SIZE=""; OUT=""; SPAN=80; TH=40
while [ $# -gt 0 ]; do case "$1" in
  --size) SIZE="$2"; shift 2 ;; --out) OUT="$2"; shift 2 ;;
  --span) SPAN="$2"; shift 2 ;; --th) TH="$2"; shift 2 ;; *) shift ;;
esac; done
[ -f "$SRC" ] && [ -f "$REF" ] || { sed -n '2,20p' "$0"; exit 1; }
REF="$(cd "$(dirname "$REF")" && pwd)/$(basename "$REF")"
read -r RW RH < <(node -e 'const b=require("fs").readFileSync(process.argv[1]);console.log(b.readUInt32BE(16),b.readUInt32BE(20))' "$REF")
W="${SIZE%x*}"; H="${SIZE#*x}"; [ -n "$SIZE" ] || { W=$RW; H=$RH; }
T="${OUT:-${TMPDIR:-/tmp}/blockgate-$$}"; mkdir -p "$T"
node "$DIR/shoot.js" "$SRC" "$T" "$W" "$H" >/dev/null 2>&1
MINE="$T/view_${W}.png"
[ -f "$MINE" ] || { echo "no render from shoot.js" >&2; exit 1; }
JSON=$(node "$DIR/_pix.cjs" blockgate "$REF" "$MINE" "$SPAN" "$TH")
[ -n "$JSON" ] || { echo "blockgate: no result from the page" >&2; exit 1; }
node -e '
const r = JSON.parse(process.argv[1]);
const {dx, dy} = r.offset;
console.log(`offset  : your render sits ${dx >= 0 ? "+" : ""}${dx},${dy >= 0 ? "+" : ""}${dy} against the reference, so the block starts at ${-dx},${-dy} in it. An offset is where the block is anchored (Step 4), not a defect.`);
let worst = 0, missing = 0;
for (const b of r.bands) {
  if (b.missing) { console.log(`band y=${b.y} h=${b.h}: MISSING in the render`); missing++; continue; }
  const d = Math.max(Math.abs(b.dl), Math.abs(b.dr), Math.abs(b.dt), Math.abs(b.db));
  worst = Math.max(worst, d);
  console.log(`band y=${b.y} h=${b.h} w=${b.w}: Δ left ${b.dl >= 0 ? "+" : ""}${b.dl} right ${b.dr >= 0 ? "+" : ""}${b.dr} top ${b.dt >= 0 ? "+" : ""}${b.dt} bottom ${b.db >= 0 ? "+" : ""}${b.db}`);
}
console.log(`verdict : ${missing ? missing + " band(s) missing; " : ""}worst residual ${worst}px` +
  (missing ? "" : worst <= 1 ? " — the block matches the design once anchored" : worst <= 3 ? " — check the named band" : " — geometry differs, not just an anchor"));
console.log(`ledger  : block gate: offset (${dx},${dy}), ${r.bands.length} bands, worst residual ${worst}px${missing ? ", " + missing + " missing" : ""}`);
' "$JSON"
echo "render  : $MINE"
