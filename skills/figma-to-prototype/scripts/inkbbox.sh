#!/bin/bash
# inkbbox.sh <image.png> '[[x,y,w,h],...]'   → bbox of ink inside each rect
# TH=150   pixels darker than this are ink (default, light backgrounds)
# TH=-150  inverse: pixels LIGHTER than 150 are ink (dark backgrounds)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
IMG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
exec node "$DIR/_pix.cjs" inkbbox "$IMG" "$2" "${TH:-150}"
