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
#                                      state on ONE element, never on all of them. An error in it,
#                                      thrown or a syntax error, prints `js    : ERROR …` and the
#                                      call exits 3: the render would be of the wrong state
#   --js-file f.js / --probe-file f.js the same, read from a file. Use them for anything with $,
#                                      backticks or quotes: inside double quotes the shell expands
#                                      $('id') before the page sees it (2026-10-02, a probe that
#                                      printed an empty line for a whole session)
#   --probe 'JS'                       runs after --js in the SAME fresh process and prints
#                                      whatever it returns — behaviour and pixels in one call.
#                                      The body is wrapped in a function, so it needs an explicit
#                                      RETURN: --probe 'return document.querySelectorAll(".row").length'
#                                      A returned Promise is awaited (up to the 5 s virtual-time
#                                      budget): `return new Promise(r=>setTimeout(()=>r(x),600))`
#                                      reads the page after a delay, and --hits / --texts then
#                                      run at that moment too
#                                      An expression without `return` prints `null`, which reads
#                                      like a failed query rather than a missing keyword.
#                                      A probe that does not parse, or a page that never reached
#                                      it, is an error with a reason and exit 3 — never an empty
#                                      `probe :` line, which reads like an empty answer.
#                                      A fresh process is the point: a browser tab keeps its
#                                      JS state across a reload of the same file, so a probe
#                                      run there can report leftovers from the previous test.
#   --hits auto | 'CSS'                is every live control reachable by a REAL click? For each
#                                      control (buttons, links, fields, ARIA roles, tabindex, and
#                                      the outermost element of every cursor:pointer region — which
#                                      is how hit layers over a plate are found) asks
#                                      elementFromPoint at the centre of its visible part, after
#                                      --js. 'CSS' limits it to controls inside the matched
#                                      elements: in a modal state pass the modal, or every page
#                                      control reads as covered by its backdrop. Prints one line
#                                      per covering element with what it covers, and exits 3 if
#                                      anything is BLOCKED. element.click() in a probe is not this:
#                                      it fires through whatever lies on top — on 2026-10-02 an
#                                      invisible full-width toast wrapper covered a header button,
#                                      every probe passed, and only the user's own click found it
#   --texts file.txt [--texts-in CSS]  is every string of the design shown? One string per line,
#                                      from `figctx.py <context> --texts` of the zone's design
#                                      context. Each must appear in the visible text (innerText,
#                                      plus field values, placeholders and picked options) of
#                                      --texts-in (default: the body), after --js — so force the
#                                      state the frame shows. Whitespace, case (text-transform),
#                                      quote marks and ellipses are folded. Scope it to the
#                                      zone: a label missing in a modal but present on the page
#                                      under it reads as found otherwise (2026-10-02: the modal
#                                      lacked First name's transliteration at a 1.4% zone diff).
#                                      MISSING exits 3
#   --frames 'sel1,sel2'               is the 1px frame of each matched element unbroken? Walks
#                                      the perimeter of its box in the render, every 4px, and at
#                                      each point compares the edge pixel with the pixel 3px
#                                      inside: a frame is there when they differ (TH=30 across
#                                      RGB; #d1d5dc on #f3f4f6 is 91). Corners are skipped by the
#                                      element's border-radius. A gap longer than 12px on any
#                                      edge is FRAME GAP, with the edge and the span, exit 3.
#                                      An element framed on some sides only names them:
#                                      '.drawer|left', '.toolbar|top+bottom' (default: all four).
#                                      A zone diff is blind to this — 1px of #d1d5dc on #f3f4f6 —
#                                      and a card header painting over its card's frame shipped
#                                      four times (three runs, two people) before anyone looked
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
#   --size 1440x900                    the viewport. A probe sees exactly this height: the pass
#                                      that reads the DOM compensates for Chrome's --dump-dom
#                                      viewport, 87px shorter than the window (see _chrome.sh);
#                                      before 2026-09-25 every DOM-side height was that much short
#   --full                             render at the CONTENT's height, not the window's: one
#                                      measuring pass asks the page (and any scrolling box inside
#                                      it) how tall it really is. A page longer than the canvas is
#                                      otherwise gated on its first screen only
#
# Everything comes back in one answer, so a visual state costs one call rather than six.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_chrome.sh"

SRC=""; HASH=""; CSS=""; JS=""; PROBE=""; JSSET=""; PROBESET=""; HITS=""; TEXTS=""; TEXTSIN=""; FRAMES=""; NOANIM=""; RECTSOF=""; RECTS=""; POINTS=""; MINPX=""; REF=""; ZONES=""; OUT=""; SIZE="1440x900"; FULL=
while [ $# -gt 0 ]; do
  case "$1" in
    --hash) HASH="$2"; shift 2 ;;
    --css) CSS="$2"; shift 2 ;;
    --no-anim) NOANIM=1; shift ;;
    --full) FULL=1; shift ;;
    --js) JS="$2"; JSSET=1; shift 2 ;;
    --probe) PROBE="$2"; PROBESET=1; shift 2 ;;
    --js-file|--probe-file)
      [ -f "$2" ] || { echo "statecheck: $1 $2 — no such file" >&2; exit 2; }
      if [ "$1" = --js-file ]; then JS="$(cat "$2")"; JSSET=1; else PROBE="$(cat "$2")"; PROBESET=1; fi
      shift 2 ;;
    --hits) HITS="$2"; shift 2 ;;
    --frames) FRAMES="$2"; shift 2 ;;
    --texts)
      [ -f "$2" ] || { echo "statecheck: --texts $2 — no such file" >&2; exit 2; }
      TEXTS="$2"; shift 2 ;;
    --texts-in) TEXTSIN="$2"; shift 2 ;;
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
# an empty --probe is a script that went missing on the way — "$(cat typo.js)", an unset variable —
# and without this it is silently no probe at all: the call renders and says nothing
[ -n "$PROBESET" ] && [ -z "${PROBE//[[:space:]]/}" ] && { echo "statecheck: --probe is empty (a \$(cat …) of a missing file? an unset variable?)" >&2; exit 2; }
[ -n "$JSSET" ] && [ -z "${JS//[[:space:]]/}" ] && { echo "statecheck: --js is empty (a \$(cat …) of a missing file? an unset variable?)" >&2; exit 2; }

# --rects-of is a probe of its own: beside --probe it used to vanish without a word (2026-10-06)
[ -n "$RECTSOF" ] && [ -n "$PROBE" ] && { echo "statecheck: --rects-of and --probe cannot be combined — the probe would win and the rects would print nothing. Read the rects inside the probe (getBoundingClientRect) or make two calls" >&2; exit 2; }
if [ -n "$RECTSOF" ]; then
  PROBE='var st=document.getElementById("stage")||document.getElementById("app")||document.body;
   var k=1,tf=getComputedStyle(st).transform,mm=tf&&tf!=="none"&&tf.match(/matrix\(([^,]+),/);
   if(mm){k=parseFloat(mm[1])||1}
   var s0=st.getBoundingClientRect();
   return "'"$RECTSOF"'".split(",").map(function(sel){var e=document.querySelector(sel.trim());
     if(!e) return sel.trim()+": not found";var b=e.getBoundingClientRect();
     return sel.trim()+": "+Math.round((b.left-s0.left)/k)+","+Math.round((b.top-s0.top)/k)+
       " "+Math.round(b.width/k)+"x"+Math.round(b.height/k);});'
fi
# a --js without a probe still gets a DOM pass, so an error in it is reported instead of
# rendering the state it failed to force
JSONLY=""; [ -z "$PROBE" ] && [ -n "$JS$HITS$TEXTS$FRAMES" ] && { JSONLY=1; PROBE='return "ok"'; }
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
node - "$SRC" "$PAGE" "$CSS" "$JS" "$PROBE" "$HITS" "$TEXTS" "$TEXTSIN" "$FRAMES" <<'NODE'
const fs = require('fs');
const [src, out, css, js, probe, hits, textsFile, textsIn, frames] = process.argv.slice(2);
const texts = textsFile ? fs.readFileSync(textsFile, 'utf8').split('\n').map(t => t.trim()).filter(Boolean) : null;
let h = fs.readFileSync(src, 'utf8');
// a page made for a claude.ai artifact (artifact-page.js) has no <head>: inject at the top, so
// the hit test runs on the exact file that gets published
let i = h.indexOf('</head>');
if (i < 0) i = 0;
// --js and the probe are compiled as ONE function body with new Function, from a JSON string, so
// that a syntax error is caught and reported like any other error. Spliced in as source, a script
// that did not parse killed the whole <script> and the probe printed NOTHING — no value, no error:
// a --js without its ';' (four cycles, 2026-09-21), a $('id') the shell had expanded (a whole
// session, 2026-10-02). The probe stays an inner function, so it still sees the --js's vars.
// --hits: a real click lands on whatever elementFromPoint returns, so that is what is asked —
// at the centre of the part of each control that is on screen and not clipped by a scroll box.
const HITS = String.raw`function(scope){
  var Q='button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=option],[role=checkbox],[role=radio],[role=switch],[role=combobox],[tabindex]:not([tabindex="-1"]),[onclick]';
  var roots=scope==='auto'?[document.body]:[].slice.call(document.querySelectorAll(scope));
  var set=new Set();
  roots.forEach(function(r){ if(r.matches(Q))set.add(r); r.querySelectorAll(Q).forEach(function(e){set.add(e)});
    [r].concat([].slice.call(r.querySelectorAll('*'))).forEach(function(e){
      if(e.id==='__probe'||e.id==='__hits')return;
      if(getComputedStyle(e).cursor==='pointer'&&!(e.parentElement&&getComputedStyle(e.parentElement).cursor==='pointer'))set.add(e)})});
  function nm(e){var s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;
    var c=(typeof e.className==='string'?e.className:'').trim().split(/\s+/).filter(Boolean).slice(0,2);if(c.length)s+='.'+c.join('.');
    var t=(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||e.value||'').trim().replace(/\s+/g,' ').slice(0,28);
    return s+(t?' "'+t+'"':'')}
  var r={found:set.size,ok:0,off:0,inert:0,blocked:{},via:{}};
  set.forEach(function(e){
    if(e.disabled||(e.checkVisibility&&!e.checkVisibility({visibilityProperty:true}))){r.inert++;return}
    if(getComputedStyle(e).pointerEvents==='none'){r.inert++;return}
    var b=e.getBoundingClientRect(),L=Math.max(b.left,0),T=Math.max(b.top,0),R=Math.min(b.right,innerWidth),B=Math.min(b.bottom,innerHeight);
    // a scroll box clips only what it contains in the containing-block sense: an absolutely
    // positioned child of a static scroll box escapes it, a fixed one escapes every box
    var pos=getComputedStyle(e).position;
    for(var p=e.parentElement;p&&p!==document.documentElement;p=p.parentElement){var c=getComputedStyle(p);
      var tf=c.transform!=='none';
      if(pos==='fixed'&&!tf)continue;
      if(pos==='absolute'&&c.position==='static'&&!tf)continue;
      if(c.overflowX!=='visible'||c.overflowY!=='visible'){var q=p.getBoundingClientRect();
        L=Math.max(L,q.left);T=Math.max(T,q.top);R=Math.min(R,q.right);B=Math.min(B,q.bottom)}
      pos=c.position}
    if(R-L<1||B-T<1){r.off++;return}
    var x=Math.round((L+R)/2),y=Math.round((T+B)/2),h=document.elementFromPoint(x,y);
    if(h&&(h===e||e.contains(h)||(e.labels&&[].some.call(e.labels,function(l){return l.contains(h)})))){r.ok++;return}
    var who=h?(h.contains(e)?nm(h)+' (its own ancestor: the click lands on the parent)':nm(h)):'nothing (outside the page)';
    var k=h&&!h.contains(e)&&getComputedStyle(h).cursor==='pointer'?'via':'blocked';
    (r[k][who]=r[k][who]||[]).push(nm(e)+' @'+x+','+y)});
  var d=document.createElement('div');d.id='__hits';d.textContent=JSON.stringify(r);document.body.appendChild(d)}`;
// --texts: the strings of the zone's design context, looked up in what the page shows
const TEXTS = String.raw`function(want, scope){
  var fold=function(t){return String(t||'').replace(/\u00a0/g,' ').replace(/[\u201c\u201d\u201e\u00ab\u00bb]/g,'"').replace(/[\u2018\u2019]/g,"'").replace(/\u2026/g,'...').replace(/\s+/g,' ').trim().toLowerCase()};
  // typography is folded too (curly against straight quotes, … against ...): this asks whether a text is there, not how it is set
  var own=['__probe','__hits'].map(function(i){return document.getElementById(i)}).filter(Boolean);
  var roots=[].slice.call(document.querySelectorAll(scope)), hay=[];
  roots.forEach(function(r){ hay.push(r.innerText);
    r.querySelectorAll('input,textarea').forEach(function(e){hay.push(e.value);hay.push(e.placeholder)});
    r.querySelectorAll('select').forEach(function(e){var o=e.options[e.selectedIndex];if(o)hay.push(o.text)})});
  var H=' '+hay.map(fold).join(' \n ')+' ';
  // the checks' own answers sit in the body too, and are not page text: cut them out of the haystack
  own.forEach(function(e){H=H.split(fold(e.textContent)).join(' ')});
  var r={scope:roots.length,expected:want.length,found:0,short:0,missing:[]};
  want.forEach(function(w){var f=fold(w); if(f.length<2){r.short++;return}
    if(H.indexOf(f)>=0)r.found++; else r.missing.push(w)});
  var d=document.createElement('div');d.id='__texts';d.textContent=JSON.stringify(r);d.style.display='none';document.body.appendChild(d)}`;
// --frames: the box and the radius of every matched element, for the perimeter walk after the render
const FRAMES = String.raw`function(sel){
  var out=[];sel.split(',').forEach(function(part){var p=part.trim().split('|'),q=p[0].trim(),edges=(p[1]||'top+bottom+left+right').split('+');
   [].slice.call(document.querySelectorAll(q)).forEach(function(e,i){var b=e.getBoundingClientRect();if(b.width<8||b.height<8)return;
    var nm=e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+((typeof e.className==='string'&&e.className.trim())?'.'+e.className.trim().split(/\s+/)[0]:'');
    out.push({n:nm+'['+i+']',x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),r:parseFloat(getComputedStyle(e).borderTopLeftRadius)||0,e:edges})})});
  var d=document.createElement('div');d.id='__frames';d.style.display='none';d.textContent=JSON.stringify(out);document.body.appendChild(d)}`;
const code = (js ? js.replace(/;?\s*$/, ';\n') : '') + 'return (function(){' + probe + '\n})()';
const lit = JSON.stringify(code).replace(/</g, '\\u003c');
const body = probe
  ? '<script>addEventListener("load",function(){setTimeout(function(){' +
    'var __o,__f;try{__f=new Function(' + lit + ')}catch(e){__o="ERROR: the script does not parse — "+(e&&e.message||e)+' +
    '" (a $ or a backtick inside double quotes is expanded by the shell first: pass it with --js-file / --probe-file)"}' +
    'if(__f){try{__o=__f()}catch(e){__o="ERROR: "+(e&&e.message||e)}}' +
    // a probe may return a Promise — `return new Promise(r=>setTimeout(()=>r(…),600))` to look
    // at the page after a delay — and the checks after it (hits, texts) then run on the page as
    // it is when the promise settles, not at the moment of the call. Chrome's virtual time
    // budget (5 s, _chrome.sh) is the ceiling
    'Promise.resolve(__o).catch(function(e){return "ERROR: "+(e&&e.message||e)}).then(function(__o){' +
    'var d=document.createElement("div");d.id="__probe";' +
    'd.textContent=JSON.stringify(__o===undefined?null:__o);' +
    'document.body.appendChild(d);' +
    (hits ? '(' + HITS + ')(' + JSON.stringify(hits).replace(/</g, '\\u003c') + ');' : '') +
    (texts ? '(' + TEXTS + ')(' + JSON.stringify(texts).replace(/</g, '\\u003c') + ',' + JSON.stringify(textsIn || 'body').replace(/</g, '\\u003c') + ');' : '') +
    (frames ? '(' + FRAMES + ')(' + JSON.stringify(frames).replace(/</g, '\\u003c') + ');' : '') +
    '});' +
    '},80)});<\/script>\n'
  : '';
const inject = (css ? '<style>' + css + '</style>\n' : '') + body;
fs.writeFileSync(out, h.slice(0, i) + inject + h.slice(i));
NODE

URL="file://$(cd "$(dirname "$PAGE")" && pwd)/$(basename "$PAGE")$HASH"
if [ -n "$PROBE" ]; then
  # the DOM pass: --dump-dom lays the page out DELTA px shorter than the window (see _chrome.sh),
  # so the window is grown by that much and the probe sees the height that was asked for. The
  # screenshot of that pass is laid out at the grown size, which is wrong at the bottom of any
  # fluid page — so when pixels are wanted (or the render is kept), a second, probe-free pass at
  # the true size takes them. Nothing changes for a call that only asks the page a question
  DELTA=$(chrome_dom_delta)
  DOM=$("$CHROME" $FLAGS --window-size="$W,$((H + DELTA))" --screenshot="$TMP/dom.png" --dump-dom "$URL" 2>/dev/null)
  if [ -n "$RECTS$POINTS$MINPX$REF$OUT$FRAMES" ]; then
    "$CHROME" $FLAGS --window-size="$W,$H" --screenshot="$SHOT" "$URL" 2>/dev/null
  else
    SHOT="$TMP/dom.png (DOM pass, ${DELTA}px taller than asked; add --out for a true render)"
  fi
else
  DOM=$("$CHROME" $FLAGS --window-size="$W,$H" --screenshot="$SHOT" "$URL" 2>/dev/null)
fi

echo "render: $SHOT"
STATUS=0
if [ -n "$PROBE" ]; then
  ANS=$(echo "$DOM" | grep -o '<div id="__probe">[^<]*' | sed 's/<div id="__probe">//;s/&lt;/</g;s/&gt;/>/g;s/&amp;/\&/g' | head -1)
  if ! echo "$DOM" | grep -q '<div id="__probe">'; then
    # the page never reached the probe: it did not load within the budget, or a script of its
    # own threw before the load event. Silence here once read as "the probe found nothing"
    echo "probe : NOT RUN — the page never reached it (did it load? does its own script throw before load?)"; STATUS=3
  elif [ -n "$JSONLY" ]; then
    case "$ANS" in '"ERROR'*) echo "js    : $ANS"; STATUS=3 ;; esac
  else
    echo "probe : $ANS"
    case "$ANS" in '"ERROR: the script does not parse'*) STATUS=3 ;; esac
  fi
fi
if [ -n "$HITS" ]; then
  HJ=$(echo "$DOM" | grep -o '<div id="__hits">[^<]*' | sed 's/<div id="__hits">//;s/&lt;/</g;s/&gt;/>/g;s/&amp;/\&/g;s/&quot;/"/g' | head -1)
  if [ -z "$HJ" ]; then echo "hits  : NOT RUN — the page never reached the check"; STATUS=3
  else
    node -e 'const r=JSON.parse(process.argv[1]);const n=o=>Object.values(o).reduce((a,v)=>a+v.length,0);
      const nb=n(r.blocked),nv=n(r.via);
      console.log(`hits  : ${r.found} controls · ${r.ok} reachable · ${nb} BLOCKED · ${nv} under another clickable layer · ${r.off} not on screen · ${r.inert} disabled/hidden/pointer-events:none`);
      if(!r.found)console.log("        nothing found to check — wrong scope selector?");
      for(const [k,lab] of [["blocked","BLOCKED by"],["via","under a clickable"]])for(const [who,l] of Object.entries(r[k]))
        console.log(`        ${lab} ${who}: ${l.length} — ${l.slice(0,4).join(", ")}${l.length>4?", …":""}`);
      process.exit(nb||!r.found?3:0)' "$HJ" || STATUS=3
  fi
fi
if [ -n "$TEXTS" ]; then
  TJ=$(echo "$DOM" | grep -o '<div id="__texts"[^>]*>[^<]*' | sed 's/<div id="__texts"[^>]*>//;s/&lt;/</g;s/&gt;/>/g;s/&quot;/"/g;s/&amp;/\&/g' | head -1)
  if [ -z "$TJ" ]; then echo "texts : NOT RUN — the page never reached the check"; STATUS=3
  else
    node -e 'const r=JSON.parse(process.argv[1]);
      if(!r.scope){console.log("texts : the scope "+process.argv[2]+" matches nothing");process.exit(3)}
      console.log(`texts : ${r.expected} expected · ${r.found} found · ${r.missing.length} MISSING${r.short?` · ${r.short} too short to check`:""}`);
      for(const m of r.missing.slice(0,12))console.log("        MISSING "+JSON.stringify(m));
      if(r.missing.length>12)console.log(`        … and ${r.missing.length-12} more`);
      process.exit(r.missing.length?3:0)' "$TJ" "${TEXTSIN:-body}" || STATUS=3
  fi
fi
if [ -n "$FRAMES" ]; then
  FJ=$(echo "$DOM" | grep -o '<div id="__frames"[^>]*>[^<]*' | sed 's/<div id="__frames"[^>]*>//;s/&quot;/"/g;s/&amp;/\&/g' | head -1)
  if [ -z "$FJ" ]; then echo "frames: NOT RUN — the page never reached the check"; STATUS=3
  else
    node - "$SHOT" "$FJ" "${TH:-30}" "$DIR/_png.cjs" <<'NODE' || STATUS=3
const [shot, json, th, pngmod] = process.argv.slice(2);
const {decode} = require(pngmod); const im = decode(shot); const T = Number(th);
const px = (x, y) => { if (x < 0 || y < 0 || x >= im.width || y >= im.height) return null; const i = (y * im.width + x) * 4; return im.data[i] + im.data[i + 1] + im.data[i + 2]; };
const els = JSON.parse(json); let bad = 0;
if (!els.length) { console.log('frames: the selector matches nothing'); process.exit(3); }
const lines = [];
for (const e of els) {
  const r = Math.ceil(e.r) + 1, gaps = [];
  // (edge name, point at t, inner point at t, range of t)
  const edges = [
    ['top',    t => [e.x + t, e.y],             t => [e.x + t, e.y + 3],             e.w],
    ['bottom', t => [e.x + t, e.y + e.h - 1],   t => [e.x + t, e.y + e.h - 4],       e.w],
    ['left',   t => [e.x, e.y + t],             t => [e.x + 3, e.y + t],             e.h],
    ['right',  t => [e.x + e.w - 1, e.y + t],   t => [e.x + e.w - 4, e.y + t],       e.h]];
  let pts = 0, ok = 0;
  for (const [name, edge, inner, len] of edges) {
    if (e.e && !e.e.includes(name)) continue;
    let gapStart = null;
    for (let t = r; t <= len - r; t += 4) {
      const a = px(...edge(t)), b = px(...inner(t)); if (a === null || b === null) continue;
      pts++; const has = Math.abs(a - b) >= T; if (has) ok++;
      if (!has && gapStart === null) gapStart = t;
      if ((has || t + 4 > len - r) && gapStart !== null) { const end = has ? t : len - r; if (end - gapStart > 12) gaps.push(`${name} ${gapStart}–${end}px`); gapStart = null; }
    }
  }
  if (gaps.length) { bad++; lines.push(`        FRAME GAP ${e.n} (${e.w}×${e.h} at ${e.x},${e.y}): ${gaps.join(', ')}`); }
}
console.log(`frames: ${els.length} elements · ${els.length - bad} unbroken · ${bad} with a FRAME GAP`);
for (const l of lines) console.log(l);
process.exit(bad ? 3 : 0);
NODE
  fi
fi
[ -n "$RECTS" ]  && { printf 'bbox  : '; "$DIR/inkbbox.sh"  "$SHOT" "$RECTS"; }
[ -n "$POINTS" ] && { printf 'pixels: '; "$DIR/pixprobe.sh" "$SHOT" "$POINTS"; }
[ -n "$MINPX" ]  && { printf 'minpx : '; "$DIR/minpx.sh"    "$SHOT" "$MINPX"; }
[ -n "$REF" ]    && { printf 'diff  : '; "$DIR/zonediff.sh" "$REF" "$SHOT" \
                        "${ZONES:-[[\"frame\",0,0,$W,$H]]}"; }
[ -z "$OUT" ] && rm -rf "$TMP" || true
exit $STATUS
