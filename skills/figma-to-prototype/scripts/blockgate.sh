#!/bin/bash
# blockgate.sh <block.html | state.png> <node-render.png> [--size WxH] [--out dir] [--span N] [--th N]
#              [--hash '#x'] [--js 'JS'] [--js-file f.js] [--css 'CSS'] [--no-anim] [--device]
#              [--crop x,y,w,h | --crop-of 'selector']
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
# The reference is the Figma node's own render (`get_screenshot` of the node, not of the frame), or a
# cut of the frame's render (cut.js) when the block is a column of a page.
#
# Three ways to give the render:
#   a block page           the html alone: rendered by shoot.js at the reference's size (--size otherwise)
#   a state of a page      the html with --hash / --js / --js-file / --css / --no-anim / --device, the
#                          options of statecheck.sh, which renders it; --crop-of '#content-slot' cuts the
#                          gated part out by the element's own rect (statecheck.sh --rects-of), --crop
#                          x,y,w,h by numbers. The websdk profile's content column against the frame's
#                          column is this: one call per screen and width, no hand-cropping (a run called
#                          _pix.cjs on crops of its own because this mode did not exist, 2026-10-14)
#   a PNG                  the state already rendered (statecheck.sh --out): compared as it is, --crop applies
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_chrome.sh"
SRC="$1"; REF="$2"; shift 2 || true
SIZE=""; OUT=""; SPAN=80; TH=40; CROP=""; CROPOF=""; ST=(); STATE=""
while [ $# -gt 0 ]; do case "$1" in
  --size) SIZE="$2"; shift 2 ;; --out) OUT="$2"; shift 2 ;;
  --span) SPAN="$2"; shift 2 ;; --th) TH="$2"; shift 2 ;;
  --crop) CROP="$2"; shift 2 ;; --crop-of) CROPOF="$2"; STATE=1; shift 2 ;;
  --hash|--js|--js-file|--css) ST+=("$1" "$2"); STATE=1; shift 2 ;;
  --no-anim|--device) ST+=("$1"); STATE=1; shift ;;
  *) shift ;;
esac; done
[ -f "$SRC" ] && [ -f "$REF" ] || { sed -n '2,32p' "$0"; exit 1; }
REF="$(cd "$(dirname "$REF")" && pwd)/$(basename "$REF")"
read -r RW RH < <(node -e 'const b=require("fs").readFileSync(process.argv[1]);console.log(b.readUInt32BE(16),b.readUInt32BE(20))' "$REF")
W="${SIZE%x*}"; H="${SIZE#*x}"; [ -n "$SIZE" ] || { W=$RW; H=$RH; }
T="${OUT:-${TMPDIR:-/tmp}/blockgate-$$}"; mkdir -p "$T"
case "$SRC" in
  *.png|*.PNG)
    [ -z "$STATE" ] || { echo "blockgate: $SRC is a PNG — the state options and --crop-of render a page; a PNG takes --crop only" >&2; exit 2; }
    MINE="$SRC"; HOW="the PNG given" ;;
  *)
    if [ -n "$STATE" ]; then
      # the state through statecheck.sh: its render is the page at WxH after --js, with the kit's
      # animations stopped by --no-anim and a phone's width through --device. --rects-of gives the
      # element's rect in the same pass, so the cut is the page's own answer, not arithmetic
      SC=$("$DIR/statecheck.sh" "$SRC" --size "${W}x${H}" --out "$T" "${ST[@]}" ${CROPOF:+--rects-of "$CROPOF"} 2>&1) || { echo "$SC" | grep -v '^render:' >&2; echo "blockgate: statecheck.sh failed on the state" >&2; exit 2; }
      MINE="$T/state.png"; HOW="statecheck.sh${ST:+ ${ST[*]}}"
      # a --hash the page has no route for renders its first screen: statecheck says so, and so does the gate
      echo "$SC" | sed -n 's/^statecheck: \(the hash changed nothing.*\)/blockgate: \1/p' >&2
      if [ -n "$CROPOF" ]; then
        R=$(echo "$SC" | sed -n 's/^probe : //p' | node -e 'const a=JSON.parse(require("fs").readFileSync(0,"utf8")||"[]");const s=String(a[0]||"");const m=s.match(/: (-?\d+),(-?\d+) (\d+)x(\d+)$/);if(!m){console.error("blockgate: --crop-of "+process.argv[1]+" — "+(s||"no rect came back"));process.exit(2)}console.log(m.slice(1).join(" "))' "$CROPOF")
        CROP="${R// /,}"
      fi
    else
      node "$DIR/shoot.js" "$SRC" "$T" "$W" "$H" >/dev/null 2>&1
      MINE="$T/view_${W}.png"; HOW="shoot.js at ${W}x${H}"
    fi ;;
esac
[ -f "$MINE" ] || { echo "no render from $HOW" >&2; exit 1; }
if [ -n "$CROP" ]; then
  IFS=, read -r CX CY CW CH <<< "$CROP"
  case "$CX$CY$CW$CH" in *[!0-9-]*|'') echo "blockgate: --crop wants x,y,w,h, got '$CROP'" >&2; exit 2 ;; esac
  node "$DIR/cut.js" "$MINE" "$CX" "$CY" "$CW" "$CH" "$T/gated.png" >/dev/null
  MINE="$T/gated.png"; HOW="$HOW, cut at $CX,$CY ${CW}x${CH}${CROPOF:+ ($CROPOF)}"
fi
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
echo "render  : $MINE ($HOW)"
