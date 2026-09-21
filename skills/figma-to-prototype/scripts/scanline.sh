#!/bin/bash
# scanline.sh <image.png> <at> [row] [bg]
#   at   — x of the column to scan (default), or y of the row with `row`
#   bg   — channel value at or above which a pixel counts as background (default 250)
#
# Prints every run of non-background pixels along that line as "from..to #hex (len)".
# For a vertical stack — a panel of rows, a list of cards — one call returns the top
# and bottom of every box, every divider and the repeat pitch, which is cheaper and
# more reliable than reading coordinates node by node out of the design tree.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
IMG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
exec node "$DIR/_pix.cjs" scanline "$IMG" "$2" "${3:-col}" "${4:-250}"
