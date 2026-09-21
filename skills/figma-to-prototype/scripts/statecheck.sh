#!/bin/bash
# statecheck.sh <file.html> [options] — render a forced state once, measure it once.
#
#   --hash '#editor-colors'            route the prototype to a view
#   --css  'CSS'                       injected stylesheet; MIRROR a :hover rule here
#                                      instead of trying to move a real mouse
#   --no-anim                          kill transitions and animations. Required whenever the
#                                      state you force is reached through one: they do not
#                                      advance under --virtual-time-budget, so the render
#                                      would show the value the animation started from
#   --js   'JS'                        script run ~80ms after load — use it to force the
#                                      state on ONE element, never on all of them
#   --probe 'JS'                       runs after --js in the SAME fresh process and prints
#                                      whatever it returns — behaviour and pixels in one call.
#                                      The body is wrapped in a function, so it needs an explicit
#                                      RETURN: --probe 'return document.querySelectorAll(".row").length'
#                                      An expression without `return` prints `null`, which reads
#                                      like a failed query rather than a missing keyword.
#                                      A fresh process is the point: a browser tab keeps its
#                                      JS state across a reload of the same file, so a probe
#                                      run there can report leftovers from the previous test.
#   --rects-of 'sel1,sel2'             canvas-space rect of each CSS selector, asked of the
#                                      page itself. Use this to aim a crop or a bbox instead
#                                      of deriving coordinates from your own layout arithmetic
#                                      — that arithmetic is the thing under test.
#                                      The canvas is #stage if present (the scaled wrapper of
#                                      the adaptivity recipe), else #app, else <body>; a
#                                      transform: scale() on it is read from computed style
#                                      and divided out. CSS zoom is not handled.
#   --rects '[["name",x,y,w,h],…]'     ink bbox per rect (TH=-150 for light-on-dark)
#   --points '[[x,y],…]'               pixel colours
#   --minpx '[[x,y,w,h,"name"],…]'     darkest and lightest pixel inside each rect —
#                                      the colour of a thin glyph or a 1px border, without
#                                      aiming a single point at it. An alpha over a known
#                                      backdrop is (bg-min)/(bg-fg)
#   --ref  baseline.png                also diff the render against this
#   --zones '[["name",x,y,w,h],…]'     zones for that diff (defaults to the whole frame)
#   --out  dir                         keep the render (default: a temp file)
#   --size 1440x900
#   --full                             render at the CONTENT's height, not the window's: one
#                                      measuring pass asks the page (and any scrolling box inside
#                                      it) how tall it really is. A page longer than the canvas is
#                                      otherwise gated on its first screen only
#
# Everything comes back in one answer, so a visual state costs one call rather than six.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_chrome.sh"

SRC=""; HASH=""; CSS=""; JS=""; PROBE=""; NOANIM=""; RECTSOF=""; RECTS=""; POINTS=""; MINPX=""; REF=""; ZONES=""; OUT=""; SIZE="1440x900"; FULL=
while [ $# -gt 0 ]; do
  case "$1" in
    --hash) HASH="$2"; shift 2 ;;
    --css) CSS="$2"; shift 2 ;;
    --no-anim) NOANIM=1; shift ;;
    --full) FULL=1; shift ;;
    --js) JS="$2"; shift 2 ;;
    --probe) PROBE="$2"; shift 2 ;;
    --rects) RECTS="$2"; shift 2 ;;
    --rects-of) RECTSOF="$2"; shift 2 ;;
    --points) POINTS="$2"; shift 2 ;;
    --minpx) MINPX="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --zones) ZONES="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --size) SIZE="$2"; shift 2 ;;
    *) SRC="$1"; shift ;;
  esac
done
[ -n "$SRC" ] || { sed -n '2,20p' "$0"; exit 1; }
[ -f "$SRC" ] || { echo "not found: $SRC" >&2; exit 1; }

if [ -n "$RECTSOF" ] && [ -z "$PROBE" ]; then
  PROBE='var st=document.getElementById("stage")||document.getElementById("app")||document.body;
   var k=1,tf=getComputedStyle(st).transform,mm=tf&&tf!=="none"&&tf.match(/matrix\(([^,]+),/);
   if(mm){k=parseFloat(mm[1])||1}
   var s0=st.getBoundingClientRect();
   return "'"$RECTSOF"'".split(",").map(function(sel){var e=document.querySelector(sel.trim());
     if(!e) return sel.trim()+": not found";var b=e.getBoundingClientRect();
     return sel.trim()+": "+Math.round((b.left-s0.left)/k)+","+Math.round((b.top-s0.top)/k)+
       " "+Math.round(b.width/k)+"x"+Math.round(b.height/k);});'
fi
[ -n "$NOANIM" ] && CSS="*{transition:none!important;animation:none!important}$CSS"
W="${SIZE%x*}"; H="${SIZE#*x}"
# --full: a page taller than the window is verified at its own height, not at the top screen.
# One measuring pass asks the page how tall its content really is — the island scrolls inside a
# viewport shell, so the number lives on the scrolling box, not on the document — and the render
# then happens at that height. Without this a gate reports on the first 900px and says nothing
# about the rest (the Applicant page is 1788 tall, 2026-09-21).
if [ -n "$FULL" ]; then
  # measure the box that holds the CONTENT, not the tallest scrolling box on the page: a sidebar
  # whose menu overflows is taller than the island on every shell page at 900, and taking the max
  # reported the menu's height as the page's (1216 against the island's 972, run 6, 2026-09-21)
  MEASURE='var slot=document.getElementById("content-slot")||document.getElementById("app")||document.body;
    var e=slot, box=null;
    while(e&&e!==document.documentElement){var c=getComputedStyle(e);
      if(c.overflowY==="auto"||c.overflowY==="scroll"){box=e;break;} e=e.parentElement;}
    return box ? Math.max(box.scrollHeight, slot.scrollHeight)
               : Math.max(document.scrollingElement.scrollHeight, slot.scrollHeight);'
  FH=$("$0" "$SRC" --size "${W}x${H}" --probe "$MEASURE" 2>/dev/null | sed -n 's/^probe : //p' | tr -d '"')
  case "$FH" in ''|*[!0-9]*) ;; *) [ "$FH" -gt "$H" ] && H=$((FH + 40)) ;; esac
  echo "full  : rendering ${W}x${H} (content asked for $FH)"
fi
TMP="${TMPDIR:-/tmp}/statecheck-$$"; mkdir -p "$TMP"
[ -n "$OUT" ] && mkdir -p "$OUT"
SHOT="${OUT:-$TMP}/state.png"
PAGE="$TMP/page.html"

# inject the forced state
node - "$SRC" "$PAGE" "$CSS" "$JS" "$PROBE" <<'NODE'
const fs = require('fs');
const [src, out, css, js, probe] = process.argv.slice(2);
let h = fs.readFileSync(src, 'utf8');
const i = h.indexOf('</head>');
if (i < 0) { console.error('ANCHOR NOT FOUND: </head>'); process.exit(1); }
const body = (js || probe)
  ? '<script>addEventListener("load",function(){setTimeout(function(){' +
    // a ';' between the two, or a --js that does not end in one makes the combined script a
    // syntax error and the probe prints NOTHING — no value, no error. Four cycles of a real run
    // went into bisecting that (2026-09-21); --rects-of routes through the same variable.
    (js ? js.replace(/;?\s*$/, ';\n') : '') +
    (probe ? 'var __o;try{__o=(function(){' + probe + '})()}catch(e){__o="ERROR: "+(e&&e.message||e)}' +
             'var d=document.createElement("div");d.id="__probe";' +
             'd.textContent=JSON.stringify(__o===undefined?null:__o);' +
             'document.body.appendChild(d);' : '') +
    '},80)});<\/script>\n'
  : '';
const inject = (css ? '<style>' + css + '</style>\n' : '') + body;
fs.writeFileSync(out, h.slice(0, i) + inject + h.slice(i));
NODE

DOM=$("$CHROME" $FLAGS --window-size="$W,$H" --screenshot="$SHOT" ${PROBE:+--dump-dom} \
  "file://$(cd "$(dirname "$PAGE")" && pwd)/$(basename "$PAGE")$HASH" 2>/dev/null)

echo "render: $SHOT"
[ -n "$PROBE" ] && { printf 'probe : '; echo "$DOM" | grep -o '<div id="__probe">[^<]*' | sed 's/<div id="__probe">//' | head -1; }
[ -n "$RECTS" ]  && { printf 'bbox  : '; "$DIR/inkbbox.sh"  "$SHOT" "$RECTS"; }
[ -n "$POINTS" ] && { printf 'pixels: '; "$DIR/pixprobe.sh" "$SHOT" "$POINTS"; }
[ -n "$MINPX" ]  && { printf 'minpx : '; "$DIR/minpx.sh"    "$SHOT" "$MINPX"; }
[ -n "$REF" ]    && { printf 'diff  : '; "$DIR/zonediff.sh" "$REF" "$SHOT" \
                        "${ZONES:-[[\"frame\",0,0,$W,$H]]}"; }
[ -z "$OUT" ] && rm -rf "$TMP" || true
