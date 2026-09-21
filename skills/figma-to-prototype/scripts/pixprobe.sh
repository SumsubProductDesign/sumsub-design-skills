#!/bin/bash
# pixprobe.sh <image.png> '[[x,y],[x,y],...]'   → 836,153=rgb(255,255,255)=#ffffff | ...
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
IMG="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
exec node "$DIR/_pix.cjs" pixprobe "$IMG" "$2"
