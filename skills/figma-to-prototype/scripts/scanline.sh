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
# arguments are checked here: a call shaped like another script's (`v 1500 0 200`) used to reach
# _pix.cjs and die with a TypeError stack instead of saying what scanline takes (2026-10-06)
usage() { echo "scanline: $1 — usage: scanline.sh <image.png> <x>            (a column)" >&2
          echo "                          scanline.sh <image.png> <y> row [bg]   (a row; bg default 250)" >&2; exit 2; }
[ $# -ge 2 ] || usage "two arguments at least"
[ -f "$1" ] || usage "no such image: $1"
case "$2" in ''|*[!0-9]*) usage "the position is a whole number of pixels, got '$2'" ;; esac
MODE="${3:-col}"; case "$MODE" in col|row) ;; *) usage "the third argument is 'row' (or nothing, for a column), got '$3'" ;; esac
case "${4:-250}" in *[!0-9]*) usage "bg is a channel value 0–255, got '$4'" ;; esac
[ $# -le 4 ] || usage "at most four arguments"
IMG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
exec node "$DIR/_pix.cjs" scanline "$IMG" "$2" "$MODE" "${4:-250}"
