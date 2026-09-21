#!/bin/bash
# minpx.sh <image.png> '[[x,y,w,h,"name"],...]'  → name: min rgb(...)=#... max rgb(...)=#...
# The darkest and lightest pixel inside a rect. Use it when the colour you need
# belongs to a thin glyph or a 1px border and aiming a single point at it is a
# guess. An alpha over a known backdrop comes out as (bg-min)/(bg-fg).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
IMG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
exec node "$DIR/_pix.cjs" minpx "$IMG" "$2"
