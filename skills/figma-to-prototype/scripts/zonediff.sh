#!/bin/bash
# zonediff.sh <reference.png> <prototype.png> '[["name",x,y,w,h],...]' [diffmap.png]
# prints: name 1.04% | name 2.45%     (pixels differing by more than TH total across RGB)
#
# TH=60 by default — tuned so glyph anti-aliasing does not swamp the number.
# That makes the diff BLIND to low-contrast geometry: #ffffff against #f6f7f9
# is 23, so a wrong corner radius on a disabled button reads 0.00% before and
# after the fix. For such zones lower it (TH=10 zonediff.sh …) or use
# minpx.sh / pixprobe.sh on the shape itself.
set -e
TH="${TH:-60}"
# the threshold is an ENV var, not an argument: a 5th positional is silently ignored, and a run
# that meant to tighten it then measures at 60 and reports a clean 0.00% (twice on 2026-09-21)
[ $# -ge 5 ] && { echo "zonediff: the threshold is an environment variable — TH=$5 $0 ..." >&2; exit 2; }
DIR="$(cd "$(dirname "$0")" && pwd)"
A="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
B="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
# the difference map is now the reference's own size, pixel for pixel: white where
# the two agree, red where they differ, and untouched outside the named zones. It
# used to be a screenshot of the measuring page, so its coordinates carried the
# page's margin and a line of text — a crop taken off it landed 8px out.
exec node "$DIR/_pix.cjs" zonediff "$A" "$B" "$3" "${4:-${TMPDIR:-/tmp}/zonediff_map.png}" "$TH"
