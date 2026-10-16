#!/bin/bash
# websdkgate.sh <config.json> <frame.png> [--chrome N] [--chrome-bottom N] [--out dir]
#
# The WebSDK shell gate, Step 2 of the websdk profile in one call: render the shell in the frame's
# state at the frame's size, screenshot it (through the protocol under 500 wide), and measure it
# against the frame's own render.
#
#   landmarks  ink boxes of the back button, the step ring, the widget's box, the footer's primary
#              button and the "Powered by" line, frame vs shell, as Δ per edge. The kit's top bar
#              is 68 high and the frames draw 60, so everything under the bar sits 8 lower in the
#              shell: the gate reads that offset at the widget's top edge and judges the lower
#              landmarks after subtracting it — a uniform offset is the known ledger line, not a miss
#   zones      % of pixels differing in the top bar strip and in the footer strip (the footer at the
#              frame's own rows, so the bar's offset shows there)
#   ledger     one line to paste into the deviation ledger
#
# Frame size: the PNG's. --chrome (or config.frame.chrome) is the chrome the frame draws around the
# page, never rendered: a number is a bar above (80, the browser bar of the 2026-10-05 desktop frames);
# {top, bottom} in the config, or --chrome N --chrome-bottom N, is a bar above and one below (62 and
# 90, the iOS status bar and the Safari bar of the 2026-10-14 mobile frames). The PNG is cropped from
# the top row to its height minus the bottom, and the shell is rendered at the remaining height; the
# ledger line names both numbers. A frame under 500 wide needs Node 22+ (the protocol render).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
CFG="$1"; FRAME="$2"; shift 2 || true
OUT=""; CHROME=""; CHROMEB=""
while [ $# -gt 0 ]; do case "$1" in --out) OUT="$2"; shift 2 ;; --chrome) CHROME="$2"; shift 2 ;; --chrome-bottom) CHROMEB="$2"; shift 2 ;; *) shift ;; esac; done
[ -f "$CFG" ] && [ -f "$FRAME" ] || { sed -n '2,23p' "$0"; exit 1; }
T="${OUT:-${TMPDIR:-/tmp}/websdkgate-$$}"; mkdir -p "$T"

read -r PW PH <<<"$(python3 -c "
import struct,sys
with open(sys.argv[1],'rb') as f: f.read(16); print(*struct.unpack('>II', f.read(8)))" "$FRAME")"
# config.frame.chrome: a number (a bar above) or {top, bottom}; the command line's values win
read -r CT CB <<<"$(node -e 'const c=require(require("path").resolve(process.argv[1])),v=c.frame&&c.frame.chrome;const o=v&&typeof v==="object";console.log((o?v.top:v)||0,(o?v.bottom:0)||0)' "$CFG")"
[ -n "$CHROME" ] || CHROME=$CT; [ -n "$CHROMEB" ] || CHROMEB=$CB
W=$PW; H=$((PH - CHROME - CHROMEB))
[ "$H" -gt 0 ] || { echo "the chrome (top $CHROME, bottom $CHROMEB) leaves no page in a ${PW}x${PH} frame" >&2; exit 1; }
REF="$FRAME"
if [ "$CHROME" -gt 0 ] || [ "$CHROMEB" -gt 0 ]; then node "$DIR/cut.js" "$FRAME" 0 "$CHROME" "$W" "$H" "$T/frame.png" >/dev/null; REF="$T/frame.png"; fi
CHROMENOTE=""; [ "$CHROMEB" -gt 0 ] && CHROMENOTE="chrome top ${CHROME} bottom ${CHROMEB}" || CHROMENOTE="browser bar ${CHROME}"
echo "frame   : ${PW}x${PH}, ${CHROMENOTE} → page ${W}x${H}"

# ---- render + shoot
META="$(node "$DIR/websdk-shell.js" "$CFG" --out "$T/shell.html" --canvas "${W}x${H}")"
DEV=""; [ "$W" -lt 500 ] && DEV="--device"
node "$DIR/shoot.js" "$T/shell.html" "$T" "$W" "$H" $DEV >/dev/null 2>&1
SHOT="$T/view_${W}.png"
[ -f "$SHOT" ] || { echo "no screenshot from shoot.js (a width under 500 needs Node 22+)" >&2; exit 1; }
echo "shell   : $META"

# ---- the landmarks, asked of the shell's page, then read as ink on both images. Structural, not
#      edge by edge: the kit's bar is 68 high with a 4px inner padding where the frames draw 60 with
#      none, so the bar's buttons are compared by their centres against the bar's own centre, the
#      widget's frame by its side strips (top and bottom edges clean of the content inside), and the
#      footer button and the "Powered by" line by their distance from the widget's bottom edge — the
#      numbers the kit keeps whatever the bar does. What is left after that is a real difference
SEL='.sdk-header,.sdk-header__back-button,.sdk-header__progress .container,#sdk-base-container,.sdk-footer .sdk-button__primary,.ws-whitelabel svg'
RECTS="$("$DIR/statecheck.sh" "$T/shell.html" --size "${W}x${H}" $DEV --rects-of "$SEL" 2>/dev/null | sed -n 's/^probe : //p')"
[ -n "$RECTS" ] || { echo "the shell's page answered no rects" >&2; exit 1; }
MEASURE="$(python3 "$DIR/_websdkgate.py" "$RECTS" "$REF" "$SHOT" "$DIR" "$W" "$H")"
echo "$MEASURE" | grep -v '^NUMS '
read -r _ WORST FOUND BAR BARH <<<"$(echo "$MEASURE" | grep '^NUMS ')"

Z="$("$DIR/zonediff.sh" "$REF" "$SHOT" "[[\"top bar\",0,0,$W,64],[\"footer\",0,$((H - 110)),$W,70]]" 2>/dev/null | tr '\n' ' ')"
echo "zones   : $Z"

# ---- ledger line: the bar's known difference is stated, the verdict is about what is left
FRAME_ID="$(node -e 'const c=require(require("path").resolve(process.argv[1]));console.log((c.frame&&c.frame.nodeId)||"frame")' "$CFG")"
BARNOTE=""; [ "$BAR" != 0 ] && BARNOTE="the frame's top bar area is $((BARH + BAR)) against the kit's $BARH, everything under it $((-BAR))px lower in the shell; "
if [ "$FOUND" -lt 3 ]; then VERDICT="only $FOUND of 5 landmarks found on both images — the frame is not a widget page, or its state differs from the config"
elif [ "$WORST" -le 1 ]; then VERDICT="${BARNOTE}the landmarks agree within 1px"
elif [ "$WORST" -le 4 ]; then VERDICT="${BARNOTE}the landmarks agree within ${WORST}px — the component's own differences (the frame's Top Bar against SdkHeader, the ring's weight)"
else VERDICT="${BARNOTE}landmarks off by up to ${WORST}px beyond the bar — compare the frame's Widget version with the kit"; fi
CUTNOTE=""; [ "$((CHROME + CHROMEB))" -gt 0 ] && CUTNOTE=" (device chrome, not rendered: ${CHROME} above, ${CHROMEB} below, cut from the ${PW}x${PH} frame)"
echo "ledger  : websdk shell gate vs $FRAME_ID ${W}x${H}${CUTNOTE}: $VERDICT; $Z"
if [ "$FOUND" -ge 3 ] && [ "$WORST" -gt 4 ]; then
  echo "ASK     : the frame's widget differs from the kit's beyond the top bar — an older Widget, a newer one, or on purpose? Show the crop; not a ledger line until answered."
fi
