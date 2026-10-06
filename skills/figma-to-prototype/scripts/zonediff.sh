#!/bin/bash
# zonediff.sh <reference.png> <prototype.png> '[["name",x,y,w,h],...]' [diffmap.png]
#   the zones may also be given as --zones '…' (the spelling statecheck.sh uses), and the map as --map
# prints: name 1.04% | name 2.45%     (pixels differing by more than TH total across RGB)
#
# TH=60 by default — tuned so glyph anti-aliasing does not swamp the number.
# That makes the diff BLIND to low-contrast geometry: #ffffff against #f6f7f9
# is 23, so a wrong corner radius on a disabled button reads 0.00% before and
# after the fix. For such zones lower it (TH=10 zonediff.sh …) or use
# minpx.sh / pixprobe.sh on the shape itself.
set -e
TH="${TH:-60}"
# --zones is accepted because statecheck.sh spells it that way, and a run that typed it here got a
# Node stack trace instead of a usage line (2026-10-02). Flags are folded into the positional form
POS=(); ZJ=""; MAP=""
while [ $# -gt 0 ]; do
  case "$1" in
    --zones) ZJ="$2"; shift 2 ;;
    --map) MAP="$2"; shift 2 ;;
    --th|--threshold) echo "zonediff: the threshold is an environment variable — TH=$2 $0 ..." >&2; exit 2 ;;
    --*) echo "zonediff: unknown option $1 — usage: zonediff.sh ref.png proto.png '[[\"name\",x,y,w,h],…]' [map.png]" >&2; exit 2 ;;
    *) POS+=("$1"); shift ;;
  esac
done
[ -n "$ZJ" ] && POS=("${POS[@]:0:2}" "$ZJ" "${POS[@]:2}")
[ -n "$MAP" ] && POS+=("$MAP")
set -- "${POS[@]}"
# the threshold is an ENV var, not an argument: a 5th positional is silently ignored, and a run
# that meant to tighten it then measures at 60 and reports a clean 0.00% (twice on 2026-09-21)
[ $# -ge 5 ] && { echo "zonediff: the threshold is an environment variable — TH=$5 $0 ..." >&2; exit 2; }
[ $# -ge 3 ] || { sed -n '2,3p' "$0" | sed 's/^# //' >&2; exit 2; }
for f in "$1" "$2"; do [ -f "$f" ] || { echo "zonediff: no such file: $f" >&2; exit 2; }; done
# the zones are checked here, so a typo is one line and not a stack trace from _pix.cjs
ZERR=$(node -e 'let z;try{z=JSON.parse(process.argv[1])}catch(e){console.log("not JSON: "+e.message);process.exit()}
  if(!Array.isArray(z)||!z.length){console.log("not a list of zones");process.exit()}
  const b=z.find(r=>!Array.isArray(r)||r.length!==5||typeof r[0]!=="string"||r.slice(1).some(v=>typeof v!=="number"));
  if(b)console.log("a zone is [\"name\",x,y,w,h], got "+JSON.stringify(b))' "$3")
[ -n "$ZERR" ] && { echo "zonediff: bad zones — $ZERR" >&2; exit 2; }
DIR="$(cd "$(dirname "$0")" && pwd)"
A="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
B="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
# the difference map is now the reference's own size, pixel for pixel: white where
# the two agree, red where they differ, and untouched outside the named zones. It
# used to be a screenshot of the measuring page, so its coordinates carried the
# page's margin and a line of text — a crop taken off it landed 8px out.
exec node "$DIR/_pix.cjs" zonediff "$A" "$B" "$3" "${4:-${TMPDIR:-/tmp}/zonediff_map.png}" "$TH"
