#!/bin/bash
# shellgate.sh <shell.json> <frame.png> [--out dir]
#
# The shell gate of Step 2 in one call: render the default shell in the frame's state at the
# frame's size, screenshot it, and measure it against the frame's own render.
#
#   landmarks  ink boxes of the logo, the active first-level row and the bottom control
#              (Collapse / Expand), frame vs shell, as Δx/Δy — the primary verdict, immune to the
#              half-pixel offsets Figma instances often sit on (x = −0.5 makes every % noisy)
#   zones      % of pixels differing: sidebar, its text-free gutter, and the header — the header
#              only when the frame has the current one (an island gap at the top); an old 64px
#              header without the island is reported, not compared
#   ledger     one line to paste into the deviation ledger
#
# Frame size: config.frame.width/height, else a fixed config.canvas, else the PNG. A frame PNG
# larger than that (get_screenshot includes overflow) is cropped from its top-left.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
CFG="$1"; FRAME="$2"; shift 2 || true
OUT=""
while [ $# -gt 0 ]; do case "$1" in --out) OUT="$2"; shift 2 ;; *) shift ;; esac; done
[ -f "$CFG" ] && [ -f "$FRAME" ] || { sed -n '2,16p' "$0"; exit 1; }
T="${OUT:-${TMPDIR:-/tmp}/shellgate-$$}"; mkdir -p "$T"

# ---- frame size
read -r W H <<<"$(python3 - "$CFG" "$FRAME" <<'PY'
import json, struct, sys
c = json.load(open(sys.argv[1]))
with open(sys.argv[2], 'rb') as f: f.read(16); pw, ph = struct.unpack('>II', f.read(8))
fr = c.get('frame') or {}
if fr.get('width') and fr.get('height'): print(fr['width'], fr['height'])
elif isinstance(c.get('canvas'), dict): print(c['canvas']['width'], c['canvas']['height'])
else: print(pw, ph)
PY
)"
read -r PW PH <<<"$(python3 -c "
import struct,sys
with open(sys.argv[1],'rb') as f: f.read(16); print(*struct.unpack('>II', f.read(8)))" "$FRAME")"
REF="$FRAME"
if [ "$PW" != "$W" ] || [ "$PH" != "$H" ]; then
  node "$DIR/cut.js" "$FRAME" 0 0 "$W" "$H" "$T/frame.png" >/dev/null; REF="$T/frame.png"
  echo "frame   : ${PW}x${PH} PNG cropped to ${W}x${H}"
else
  echo "frame   : ${W}x${H}"
fi

# ---- render + shoot
META="$(node "$DIR/shell.js" "$CFG" --out "$T/shell.html" --canvas "${W}x${H}")"
node "$DIR/shoot.js" "$T/shell.html" "$T" "$W" "$H" >/dev/null 2>&1
SHOT="$T/view_${W}.png"
[ -f "$SHOT" ] || { echo "no screenshot from shoot.js" >&2; exit 1; }
read -r SIDE TOP LAYOUT STATE IDX <<<"$(echo "$META" | python3 -c "
import json,sys; m=json.load(sys.stdin); print(m['sidebar'], m['header'], m['layout'], m['sidebarState'], m['activeIndex'])")"
echo "shell   : $LAYOUT, sidebar $STATE ($SIDE), header $TOP, active index $IDX"

# ---- the frame's header: the island leaves an 8px page-coloured gap above it (current layout);
#      without the gap, the header's bottom border row tells the component: 56 current, 64 old
HDR_PX="$("$DIR/pixprobe.sh" "$REF" "[[$((SIDE + 4)),3]]" 2>/dev/null | grep -o '#[0-9a-f]*' | head -1)"
HDR_NEW=0; HDR_NOTE=""
isline() { case "$1" in "#e5e7eb"|"#e1e5ea"|"#d1d5dc") return 0 ;; *) return 1 ;; esac; }
if [ "$HDR_PX" = "#f3f4f6" ]; then HDR_NEW=1
else
  R55="$("$DIR/pixprobe.sh" "$REF" "[[$((SIDE + 4)),55]]" 2>/dev/null | grep -o '#[0-9a-f]*' | head -1)"
  R63="$("$DIR/pixprobe.sh" "$REF" "[[$((SIDE + 4)),63]]" 2>/dev/null | grep -o '#[0-9a-f]*' | head -1)"
  R96="$("$DIR/pixprobe.sh" "$REF" "[[$((SIDE + 4)),96]]" 2>/dev/null | grep -o '#[0-9a-f]*' | head -1)"
  if isline "$R55"; then HDR_NOTE="the current 56px header component$(isline "$R96" && echo " with the 41px tab subheader")"
  elif isline "$R63"; then HDR_NOTE="the old 64px header"
  else HDR_NOTE="a header of unknown height (no border row at 56 or 64)"; fi
  HDR_NOTE="$HDR_NOTE, without the island gap — the frame's layout predates the shell"
fi

# ---- landmarks: ink boxes in the same rects on both images
LOGO_W=$([ "$SIDE" -lt 100 ] && echo 52 || echo 60)
ROW_Y=$((62 + 40 * IDX))
RECTS="[[0,0,$LOGO_W,56],[0,$ROW_Y,$SIDE,40]"
HAS_BOTTOM=0; BOTTOM_NOTE=""
if [ "$LAYOUT" = "basic" ]; then
  # the bottom control exists in the frame only if its 1px top border sits at H-64 — a sidebar
  # instance taller than the frame (962 in a 900 frame) shows clipped menu rows there instead
  BT="$("$DIR/pixprobe.sh" "$REF" "[[$((SIDE / 2)),$((H - 64))]]" 2>/dev/null | grep -o '#[0-9a-f]*' | head -1)"
  case "$BT" in "#e5e7eb"|"#e1e5ea") RECTS="$RECTS,[0,$((H - 64)),$SIDE,64]"; HAS_BOTTOM=1 ;;
    *) BOTTOM_NOTE="the frame has no Collapse/Expand row at the bottom (no border at y=$((H - 64)): its sidebar instance overflows the frame) — landmark skipped" ;; esac
fi
RECTS="$RECTS]"
A="$("$DIR/inkbbox.sh" "$REF" "$RECTS" 2>/dev/null)"
B="$("$DIR/inkbbox.sh" "$SHOT" "$RECTS" 2>/dev/null)"
LAND="$(python3 - "$A" "$B" "$HAS_BOTTOM" <<'PY'
import re, sys
names = ['logo', 'active row', 'bottom control'][: 2 + int(sys.argv[3])]
def parse(s):
    out = []
    for part in s.split('||'):
        m = re.search(r'x (-?\d+)\.\.(-?\d+).*?y (-?\d+)\.\.(-?\d+)', part)
        out.append(tuple(map(int, m.groups())) if m else None)
    return out
a, b = parse(sys.argv[1]), parse(sys.argv[2])
worst = 0; lines = []; ds = []
for n, fa, fb in zip(names, a, b):
    if not fa or not fb: lines.append(f'{n}: no ink'); continue
    d = [fb[i] - fa[i] for i in range(4)]; ds.append(d)
    worst = max(worst, max(abs(x) for x in d))
    lines.append(f'{n}: Δ left {d[0]:+d} right {d[1]:+d} top {d[2]:+d} bottom {d[3]:+d}')
# a frame instance sitting at x = -1 or y = 0.5 shifts every landmark the same way: report that as
# an offset, not as a geometry miss
shift = ''
if worst > 1 and ds:
    dx = round(sum((d[0] + d[1]) / 2 for d in ds) / len(ds)); dy = round(sum((d[2] + d[3]) / 2 for d in ds) / len(ds))
    if all(abs(d[0] - dx) <= 1 and abs(d[1] - dx) <= 1 and abs(d[2] - dy) <= 1 and abs(d[3] - dy) <= 1 for d in ds):
        shift = f'{dx:+d},{dy:+d}'
print('\n'.join('landmark: ' + l for l in lines)); print(f'WORST={worst}'); print(f'SHIFT={shift}')
PY
)"
echo "$LAND" | grep -v '^WORST=\|^SHIFT='
[ -n "$BOTTOM_NOTE" ] && echo "landmark: $BOTTOM_NOTE"
WORST="$(echo "$LAND" | sed -n 's/^WORST=//p')"
SHIFT="$(echo "$LAND" | sed -n 's/^SHIFT=//p')"

# ---- zones
SZ=$SIDE; [ "$SIDE" -gt 100 ] && SZ=$((SIDE - 8))   # the expanded sidebar's last 8px are the scrollbar gutter; frames are 257 wide there
ZONES="[[\"sidebar\",0,0,$SZ,$H],[\"sidebar-gutter\",0,56,20,$((H - 120))]"
if [ "$HDR_NEW" = 1 ]; then ZONES="$ZONES,[\"header\",$((SIDE + 8)),8,$((W - SIDE - 16)),$TOP]"; fi
ZONES="$ZONES]"
Z="$("$DIR/zonediff.sh" "$REF" "$SHOT" "$ZONES" 2>/dev/null)"
echo "zones   : $Z"
if [ "$HDR_NEW" = 0 ]; then echo "header  : the frame shows $HDR_NOTE; not compared, the default header is used"; fi

# ---- ledger line
FRAME_ID="$(python3 -c "
import json,sys; f=json.load(open(sys.argv[1])).get('frame') or {}; print(f.get('nodeId') or 'frame')" "$CFG")"
if [ "$WORST" -le 1 ]; then VERDICT="shell landmarks match the frame within 1px"
elif [ -n "$SHIFT" ]; then VERDICT="shell landmarks match the frame up to a uniform offset of ($SHIFT) px — the frame's sidebar instance is off-grid, geometry agrees; the % below carries that offset"
else VERDICT="shell landmarks off by up to ${WORST}px — not a uniform offset: check the frame's component version"; fi
HDR=$([ "$HDR_NEW" = 1 ] && echo "header compared" || echo "frame header: $HDR_NOTE; default used")
echo "ledger  : shell gate vs $FRAME_ID ${W}x${H}: $VERDICT; $Z; $HDR"
echo "render  : $SHOT"
