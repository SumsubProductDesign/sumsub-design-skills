#!/bin/bash
# lint.sh [--quick] — what must hold before a commit to this skill.
#
#   level 1  every script parses, and every measuring tool returns the known
#            answer on a synthetic frame (a red 40×40 square at 20,20 on a
#            200×100 canvas). doctor.sh is the first half of this.
#   level 2  the documents agree with each other and with the file tree:
#            every file and heading a document points at exists, every file
#            in the skill is listed in SKILL.md, the project layout is spelled
#            one way, code fences are closed, the frontmatter is sane.
#
# --quick skips the headless renders (about a second instead of twenty).
# Installed as the git pre-commit hook by:  ln -sf ../../scripts/pre-commit .git/hooks/pre-commit
# Bypass once with:                         git commit --no-verify
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$DIR/.." && pwd)"
QUICK=""; [ "${1:-}" = "--quick" ] && QUICK=1
bad=0
pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; bad=1; }
expect() { # expect <label> <needle> <haystack>
  case "$3" in *"$2"*) pass "$1" ;; *) fail "$1 — wanted '$2', got: $(echo "$3" | head -3 | tr '\n' ' ')" ;; esac
}

# ---------------------------------------------------------------- level 1
echo "level 1 — scripts"
for f in "$DIR"/*.sh "$DIR"/pre-commit; do
  bash -n "$f" 2>/dev/null && pass "bash -n $(basename "$f")" || fail "bash -n $(basename "$f")"
  case "$(basename "$f")" in _*) ;; *) [ -x "$f" ] || fail "$(basename "$f") is not executable (chmod +x)" ;; esac   # _*.sh are sourced
done
for f in "$DIR"/*.js "$DIR"/*.cjs; do
  node --check "$f" 2>/dev/null && pass "node --check $(basename "$f")" || fail "node --check $(basename "$f")"
done
for f in "$DIR"/*.py; do
  python3 -c 'import ast,sys; ast.parse(open(sys.argv[1], encoding="utf-8").read())' "$f" 2>/dev/null \
    && pass "python3 parse $(basename "$f")" || fail "python3 parse $(basename "$f")"
done
python3 "$DIR/bbox.py" >/dev/null 2>&1 && pass "bbox.py self-test" || fail "bbox.py self-test"

T="${TMPDIR:-/tmp}/skill-lint-$$"; mkdir -p "$T/ic"; trap 'rm -rf "$T"' EXIT
FRAME='<!doctype html><html><head><title>lint</title></head><body style="margin:0;background:#fff"><div id="app" style="position:relative;width:200px;height:100px;overflow:hidden"><div class="box" style="position:absolute;left:20px;top:20px;width:40px;height:40px;background:#ff0000"></div></div></body></html>'
printf '%s' "$FRAME" > "$T/a.html"
printf '%s' "${FRAME/background:#ff0000/background:#fff}" > "$T/b.html"
printf '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect x="10" y="5" width="30" height="20" fill="#ff0000"/><text x="5" y="40" font-size="12" fill="#000000">Hi</text></svg>' > "$T/l.svg"
sed 's/#ff0000/#0000ff/; s/#000000/#ffffff/' "$T/l.svg" > "$T/d.svg"
printf '<svg width="24" height="24" viewBox="0 0 24 24" style="x" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"/></svg>' > "$T/ic/zone__imgA.svg"
printf '<div style="color:#ABCDEF">x</div>\n<div style="color:T().ink">y</div>\n' > "$T/t.html"
printf '[{"text":"<div class=\\"flex\\">no assets here</div>"}]' > "$T/r.json"

# tools that need no browser
expect "svg_dump.py --kind text" "'Hi'" "$(python3 "$DIR/svg_dump.py" "$T/l.svg" --kind text 2>&1)"
python3 "$DIR/svg_dump.py" "$T/l.svg" --json 2>/dev/null | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null \
  && pass "svg_dump.py --json parses" || fail "svg_dump.py --json parses"
expect "align_exports.py" "geometry is identical" "$(python3 "$DIR/align_exports.py" "$T/l.svg" "$T/d.svg" 2>&1)"
expect "hex_sweep.py" "#ABCDEF" "$(python3 "$DIR/hex_sweep.py" "$T/t.html" 2>&1)"
IC=$(node "$DIR/icons.js" "$T/ic" 2>&1)
expect "icons.js keys and stretch attrs" 'var ICONS = {"zone_imgA":' "$IC"
# the table is JSON, so attribute quotes arrive escaped: preserveAspectRatio=\"none\"
case "$IC" in *'width=\"24\"'*) fail "icons.js left width= on the svg" ;; *'preserveAspectRatio=\"none\"'*) pass "icons.js strips size, adds preserveAspectRatio" ;; *) fail "icons.js output unexpected: $(echo "$IC" | head -c 160)" ;; esac
expect "grab.js (no network: zero assets)" "assets: 0" "$(cd "$T" && node "$DIR/grab.js" r.json pfx out 2>&1)"
[ -s "$T/out/pfx.jsx" ] && pass "grab.js wrote the .jsx" || fail "grab.js wrote the .jsx"
expect "publish.sh usage" "usage:" "$("$DIR/publish.sh" 2>&1)"
expect "publish.sh rejects a bad slug before any Vercel call" "slug must be lowercase" "$("$DIR/publish.sh" "$T/a.html" --project 'Bad Slug' 2>&1)"
expect "unpublish.sh usage" "usage:" "$("$DIR/unpublish.sh" 2>&1)"
PORT=8797; (ROOT="$T" PORT=$PORT node "$DIR/serve.cjs" >/dev/null 2>&1 & echo $! > "$T/pid"); sleep 0.7
HDR=$(curl -s -D - -o /dev/null --max-time 5 "http://localhost:$PORT/" 2>&1); kill "$(cat "$T/pid")" 2>/dev/null
case "$HDR" in *"200"*"no-store"*|*"no-store"*"200"*) pass "serve.cjs ROOT=… serves with no-store" ;; *) fail "serve.cjs — got: $(echo "$HDR" | head -2 | tr '\n' ' ')" ;; esac

if [ -z "$QUICK" ]; then
  echo "level 1 — headless renders"
  DOC=$("$DIR/doctor.sh" 2>&1); [ $? -eq 0 ] && pass "doctor.sh ready" || fail "doctor.sh: $(echo "$DOC" | grep FAIL | head -2 | tr '\n' ' ')"
  # the split that decides what a colleague has to install: a missing OPTIONAL warns and still
  # says ready, a missing REQUIRED fails and prints the line that fixes it. Checked by shadowing
  # the PATH with everything but the one binary — the skill is handed to people who have neither.
  SH="$T/shadow"; mkdir -p "$SH"
  for f in /usr/bin/* /bin/*; do ln -sf "$f" "$SH/$(basename "$f")" 2>/dev/null; done
  ln -sf "$(command -v node)" "$SH/node" 2>/dev/null; rm -f "$SH/python3"
  DOC_NP=$(PATH="$SH" "$DIR/doctor.sh" 2>&1); DOC_NP_RC=$?
  expect "doctor.sh without python3: warns, names what closes, still ready" "ready — with the warnings above" "$DOC_NP"
  expect "doctor.sh without python3: exit 0" "0" "$DOC_NP_RC"
  rm -f "$SH/node"
  DOC_NN=$(PATH="$SH" "$DIR/doctor.sh" 2>&1); DOC_NN_RC=$?
  expect "doctor.sh without node: fails and prints the install line" "install:" "$DOC_NN"
  expect "doctor.sh without node: exit 1" "1" "$DOC_NN_RC"
  node "$DIR/shoot.js" "$T/a.html" "$T/sa" 200 100 >/dev/null 2>&1; node "$DIR/shoot.js" "$T/b.html" "$T/sb" 200 100 >/dev/null 2>&1
  A="$T/sa/view_200.png"; B="$T/sb/view_200.png"
  [ -s "$A" ] && [ -s "$B" ] && pass "shoot.js rendered both frames" || fail "shoot.js rendered both frames"
  expect "zonediff.sh" "box 100.00%" "$("$DIR/zonediff.sh" "$A" "$B" '[["all",0,0,200,100],["box",20,20,40,40]]' "$T/map.png" 2>&1)"
  expect "zonediff.sh map is the reference's own size" "200 100" "$(node -e 'const b=require("fs").readFileSync(process.argv[1]);console.log(b.readUInt32BE(16),b.readUInt32BE(20))' "$T/map.png" 2>&1)"
  expect "inkbbox.sh" "box x 20..59 (w 40) y 20..59 (h 40)" "$("$DIR/inkbbox.sh" "$A" '[["box",10,10,60,60]]' 2>&1)"
  expect "minpx.sh" "min rgb(255,0,0)=#ff0000" "$("$DIR/minpx.sh" "$A" '[[10,10,60,60,"box"]]' 2>&1)"
  expect "scanline.sh" "20..59 #ff0000 (40)" "$("$DIR/scanline.sh" "$A" 40 2>&1)"
  expect "pixprobe.sh" "#ff0000" "$("$DIR/pixprobe.sh" "$A" '[[40,40]]' 2>&1)"
  node "$DIR/cut.js" "$A" 20 20 40 40 "$T/cut.png" >/dev/null 2>&1
  expect "cut.js: 40×40 from 20,20 is solid red" "min rgb(255,0,0)=#ff0000 max rgb(255,0,0)=#ff0000" "$("$DIR/minpx.sh" "$T/cut.png" '[[0,0,40,40,"all"]]' 2>&1)"
  node "$DIR/crop.js" "$A" "$B" 10 10 60 60 3 10 10 "$T/cmp.png" >/dev/null 2>&1
  expect "crop.js output is a 184px-wide PNG" "184" "$(node -e 'const b=require("fs").readFileSync(process.argv[1]);console.log(b.readUInt32BE(16))' "$T/cmp.png" 2>&1)"
  SC=$(node "$DIR/scaletest.js" "$T/a.html" "$T/sc" 2>&1)
  [ "$(echo "$SC" | grep -c 'content right=59 bottom=59')" = 5 ] && pass "scaletest.js: 5 widths, content bounds right" || fail "scaletest.js: $(echo "$SC" | head -2 | tr '\n' ' ')"
  # the dashboard shell: render the master example, check the slot origin and diff against the Figma render
  SH=$(node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-master.json" --out "$T/shell.html" 2>&1)
  expect "shell.js renders the master example, slot at 284,84" '"contentOrigin":{"x":284,"y":84' "$SH"
  expect "shell.js: the page carries the type, so a viewport-anchored element inherits it" "1" "$(grep -c 'html,body{font-family:"Geist"' "$T/shell.html")"
  expect "shell.js: a fixed canvas is centred in a wider window" "1" "$(grep -c 'margin:0 auto;background:#f3f4f6' "$T/shell.html")"
  node "$DIR/shoot.js" "$T/shell.html" "$T/sh" 1440 1080 >/dev/null 2>&1
  # the shell's sidebar is 264 (256 + scrollbar gutter) against the Figma component's 257, so the island
  # starts 7px later: the right-aligned header cluster and the top gap share coordinates with the reference,
  # the left part of the header is compared on crops aligned to each island's left edge
  SD=$("$DIR/zonediff.sh" "$ROOT/assets/shell/dashboard/reference/layout-master-1440x1080.png" "$T/sh/view_1440.png" \
       '[["sidebar",0,0,257,1080],["side-gap",240,60,16,900],["header-right",840,8,592,58],["frame",264,0,1168,8]]' 2>&1)
  node "$DIR/cut.js" "$ROOT/assets/shell/dashboard/reference/layout-master-1440x1080.png" 257 0 520 80 "$T/sh/ref-left.png" >/dev/null
  node "$DIR/cut.js" "$T/sh/view_1440.png" 264 0 520 80 "$T/sh/our-left.png" >/dev/null
  HL=$("$DIR/zonediff.sh" "$T/sh/ref-left.png" "$T/sh/our-left.png" '[["header-left",0,8,520,58]]' 2>&1)
  expect "shell vs Figma: text-free zones exact" "side-gap 0.00% | header" "$SD"
  expect "shell vs Figma: island frame exact" "frame 0.00%" "$SD"
  SBP=$(echo "$SD" | grep -oE 'sidebar [0-9.]+' | awk '{print $2}'); HRP=$(echo "$SD" | grep -oE 'header-right [0-9.]+' | awk '{print $2}'); HLP=$(echo "$HL" | grep -oE 'header-left [0-9.]+' | awk '{print $2}')
  awk -v s="$SBP" -v r="$HRP" -v l="$HLP" 'BEGIN{exit !(s<=3.0 && r<=4.0 && l<=4.0)}' && pass "shell vs Figma: sidebar $SBP% ≤ 3, header left $HLP% / right $HRP% ≤ 4 (VERSION.md baseline 2.17 / 1.56 / 1.97)" || fail "shell vs Figma drifted: sidebar $SBP% header $HLP% / $HRP% — see assets/shell/dashboard/VERSION.md"
  # the fullscreen layout: 52px rail, breadcrumb header, tab subheader
  FS=$(node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-fullscreen.json" --out "$T/fs.html" 2>&1)
  expect "shell.js fullscreen: slot at 72,125 under header + tabs" '"contentOrigin":{"x":72,"y":125' "$FS"
  # the record's second row grows the fullscreen header from 56 to 84 and pushes the slot down;
  # every control in that header is a real button, named, and carries the library's hover
  node -e '
const fs=require("fs");const c=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
c.page.actions=[{icon:"header-applicant-link",label:"Open"},"|","Request check",
  {label:"Approve",type:"primary",status:"success"},{label:"Reject",type:"primary",status:"danger"}];
c.page.info=[{label:"ID: 1",iconRight:"header-copy"},{label:"Add tag",type:"tertiary",icon:"header-tag"}];
fs.writeFileSync(process.argv[2],JSON.stringify(c));' "$ROOT/assets/shell/dashboard/examples/figma-fullscreen.json" "$T/fsinfo.json"
  FI=$(node "$DIR/shell.js" "$T/fsinfo.json" --out "$T/fsinfo.html" 2>&1)
  node -e '
const fs=require("fs");const c=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
c.page.info=[{tag:"VIP",color:"purple"},{tag:"Returning",color:"blue"},
  {label:"ID: 1",iconRight:"header-copy"},{label:"Add tag",type:"tertiary",icon:"header-tag"}];
fs.writeFileSync(process.argv[2],JSON.stringify(c));' "$T/fsinfo.json" "$T/fsinfo2.json"
  node "$DIR/shell.js" "$T/fsinfo2.json" --out "$T/fsinfo2.html" >/dev/null 2>&1
  expect "shell.js fullscreen with the record's second row: header 84, slot at 72,153" '"contentOrigin":{"x":72,"y":153' "$FI"
  expect "the second row and the divider are drawn" "1 1" "$(grep -c 'class=\"finforow\"' "$T/fsinfo.html") $(grep -c 'class=\"fdiv\"' "$T/fsinfo.html")"
  expect "every header control is a real named button with a pointer" "8 8 pointer" "$("$DIR/statecheck.sh" "$T/fsinfo.html" --size 1440x900 --probe 'var b=[...document.querySelectorAll(".sh-fheader button")];
    return b.length+" "+b.filter(e=>e.getAttribute("aria-label")||e.textContent.trim()).length+" "+getComputedStyle(b[0]).cursor;' 2>&1 | sed -n 's/^probe : //p' | tr -d '\"')"
  # a header row carries tags as well as buttons, and its nine tag colours must BE the library's
  expect "the header's second row carries tags and buttons together" "2 1 3" "$(grep -o 'class=\"htag2 htag2-[a-z]*\"' "$T/fsinfo2.html" | wc -l | tr -d ' ') $(grep -o 'class=\"htag2 htag2-purple\"' "$T/fsinfo2.html" | wc -l | tr -d ' ') $(grep -o 'sbtn-tertiary' "$T/fsinfo2.html" | grep -c . )"
  expect "the shell's header tags are the library's tag() colours, rule for rule" "11 11" "$(node -e '
const fs=require("fs"),path=require("path");
const lib=fs.readFileSync(process.argv[1],"utf8"), sh=fs.readFileSync(process.argv[2],"utf8");
const grab=(src,pre)=>Object.fromEntries([...src.matchAll(new RegExp(pre+"-([a-z]+)\\{([^}]*)\\}","g"))].map(m=>[m[1],m[2]]));
const a=grab(lib,"\\.c-tag"), b=grab(sh,"\\.sh-fheader \\.htag2");
const names=Object.keys(a).filter(n=>n!=="sm");
console.log(names.length, names.filter(n=>b[n]===a[n]).length);' "$ROOT/assets/components/controls.js" "$DIR/shell.js")"
  expect "the header's hover colours are the library's" "3" "$(grep -o 'sh-fheader .sbtn[^{]*:hover{background:#\(f9fafb\|15803d\|b91c1c\)' "$T/fsinfo.html" | wc -l | tr -d ' ')"
  node "$DIR/shoot.js" "$T/fs.html" "$T/fs" 1440 1080 >/dev/null 2>&1
  FD=$("$DIR/zonediff.sh" "$ROOT/assets/shell/dashboard/reference/layout-fullscreen-1440x1080.png" "$T/fs/view_1440.png" \
       '[["rail",0,0,52,1080],["rail-gap",44,56,8,1000],["header",52,8,1388,97],["frame-top",52,0,1388,8]]' 2>&1)
  expect "fullscreen vs Figma: rail gap and island frame exact" "rail-gap 0.00% | header" "$FD"
  expect "fullscreen vs Figma: frame-top exact" "frame-top 0.00%" "$FD"
  RLP=$(echo "$FD" | grep -oE 'rail [0-9.]+' | awk '{print $2}'); FHP=$(echo "$FD" | grep -oE 'header [0-9.]+' | awk '{print $2}')
  awk -v r="$RLP" -v h="$FHP" 'BEGIN{exit !(r<=1.5 && h<=4.0)}' && pass "fullscreen vs Figma: rail $RLP% ≤ 1.5, header+tabs $FHP% ≤ 4 (baseline 0.59 / 1.14)" || fail "fullscreen shell drifted: rail $RLP% header $FHP%"
  # "island": false — the record page that runs flush to the rail: no gutter, no rounded frame,
  # content 8 under the header rule. The Applicant page's own origin is 52,133.
  node -e '
const fs=require("fs");const c=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
c.island=false;c.page.info=[{label:"ID: 1",iconRight:"header-copy"}];
fs.writeFileSync(process.argv[2],JSON.stringify(c));' "$ROOT/assets/shell/dashboard/examples/figma-fullscreen.json" "$T/flush.json"
  FL2=$(node "$DIR/shell.js" "$T/flush.json" --out "$T/flush.html" 2>&1)
  expect "shell.js flush fullscreen: slot at 52,133, the frame's own origin" '"contentOrigin":{"x":52,"y":133' "$FL2"
  expect "flush drops the island's frame and rounding" "0 0" "$(grep -c 'sh-body::after' "$T/flush.html") $(grep -o 'sh-body{[^}]*border-radius:16px' "$T/flush.html" | wc -l | tr -d ' ')"
  expect "shell.js fullscreen without tabs: slot at 72,84" '"contentOrigin":{"x":72,"y":84' "$(node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-fullscreen-notabs.json" --out "$T/fsn.html" 2>&1)"
  # the third layout variant was the only reference render nothing compared against
  node "$DIR/shoot.js" "$T/fsn.html" "$T/fsn" 1440 1080 >/dev/null 2>&1
  NTD=$("$DIR/zonediff.sh" "$ROOT/assets/shell/dashboard/reference/layout-fullscreen-notabs-1440x1080.png" "$T/fsn/view_1440.png" \
        '[["rail",0,0,52,1080],["frame-top",52,0,1388,8],["header",52,8,1388,56]]' 2>&1)
  expect "fullscreen without tabs vs Figma: the island frame is exact" "frame-top 0.00%" "$NTD"
  NTR=$(echo "$NTD" | grep -oE 'rail [0-9.]+' | awk '{print $2}'); NTH=$(echo "$NTD" | grep -oE 'header [0-9.]+' | awk '{print $2}')
  awk -v r="$NTR" -v h="$NTH" 'BEGIN{exit !(r<=1.5 && h<=2.0)}' \
    && pass "fullscreen without tabs vs Figma: rail $NTR% ≤ 1.5, header $NTH% ≤ 2 (baseline 0.59 / 1.14)" \
    || fail "the no-tabs fullscreen shell drifted: rail $NTR% header $NTH%"
  expect "shell.js basic with the sidebar collapsed and tabs: slot at 72,125, Expand row" '"sidebarState":"collapsed","contentOrigin":{"x":72,"y":125' "$(node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/basic-collapsed.json" --out "$T/bc.html" 2>&1)"
  G="$("$DIR/shellgate.sh" "$ROOT/assets/shell/dashboard/examples/figma-master.json" "$ROOT/assets/shell/dashboard/reference/layout-master-1440x1080.png" --out "$T/gate" 2>&1)"
  printf '<frame id="1:2" name="F">\n  <instance id="1:3" name="*Sidebar*" />\n    <frame id="1:4" name="deep" />\n</frame>\n' > "$T/m.xml"
  printf 'const imgX = "https://example.invalid/x.svg";\n<div data-name="Table Row" className="flex-[1_0_0] min-w-[200px]"><p>Alpha</p><img src={imgX} /></div><div data-name="Divider Line"/><div data-name="Table Row"><p>Beta</p></div>' > "$T/ctx.jsx"
  expect "figctx.py: outline tokens and --split rows" "flex-[1_0_0] min-w-[200px] 2" "$(python3 "$DIR/figctx.py" "$T/ctx.jsx" | grep -o 'flex-\[1_0_0\] min-w-\[200px\]' | head -1) $(python3 "$DIR/figctx.py" "$T/ctx.jsx" --split 'Table Row' | grep -c '^[0-9]\.')"
  # an asset under a turned or inset wrapper is flagged on its own line, nearest token first; a plain asset is not
  printf 'const imgA = "https://example.invalid/a.svg";\n<div data-name="Arrow wrapper" className="absolute rotate-180 w-[8px]"><div className="relative"><img src={imgA} className="absolute inset-[6.38%%]" /></div></div><img src={imgA} className="block" />' > "$T/ctx2.jsx"
  # two design contexts naming different assets the same const must not overwrite each other
  printf 'const imgA = "file:///dev/null";\n' > "$T/a1.jsx"
  mkdir -p "$T/aout" && printf 'one' > "$T/aout/imgA.svg"
  python3 "$DIR/figctx.py" "$T/a1.jsx" --assets "$T/aout" >/dev/null 2>&1
  expect "figctx.py --assets keeps a name that is already another asset" "1" "$(ls "$T/aout" | grep -c '^imgA')"
  expect "figctx.py --assets writes the file -> URL manifest" "1" "$([ -f "$T/aout/_assets.json" ] && echo 1 || echo 0)"
  expect "figctx.py: placement tokens of the asset and its wrappers, nearest first" "! wrapper: inset-[6.38%] rotate-180 1" "$(python3 "$DIR/figctx.py" "$T/ctx2.jsx" | grep -o '! wrapper: .*' | head -1) $(python3 "$DIR/figctx.py" "$T/ctx2.jsx" | grep -c '! wrapper')"
  expect "figmeta.py prints the top levels of a saved metadata dump" "2" "$(python3 "$DIR/figmeta.py" "$T/m.xml" 1 | wc -l | tr -d ' ')"
  # design-system controls: render each size and state, compare with assets/components/VERSION.md
  node -e '
const C=require(process.argv[1]),fs=require("fs");
const box=(s,st)=>C.input({size:s,state:st,value:"Input text",width:300,hint:"Hint text"});
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;font-size:14px;line-height:24px}${C.css}</style></head><body>`+
  ["small","medium","large"].map(s=>`<div>${box(s,"normal")}</div>`).join("")+
  ["error","warning","disabled","readonly"].map(st=>`<div>${box("large",st)}</div>`).join("")+"</body></html>");
' "$ROOT/assets/components/controls.js" "$T/controls.html"
  cat > "$T/ctl-probe.js" <<'PROBE'
var q = document.querySelectorAll(".c-input-box");
var g = function (n) { var e = q[n], c = getComputedStyle(e);
  return Math.round(e.getBoundingClientRect().height) + " " + c.padding + " " + c.borderRadius + " " + c.backgroundColor; };
return [g(0), g(1), g(2), g(3), g(6)].join(" | ");
PROBE
  CTL=$("$DIR/statecheck.sh" "$T/controls.html" --size 800x600 --probe "$(cat "$T/ctl-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  expect "controls.js input: the product's three sizes, padding and radius" "24 0px 8px 8px | 32 4px 12px 8px | 40 8px 12px 8px" "$(echo "$CTL" | awk -F' \\| ' '{print $1" | "$2" | "$3}' | sed 's/ rgb(255, 255, 255)//g')"
  expect "controls.js input: error background, readonly reset" "rgb(254, 242, 242) | 24 0px 8px rgba(0, 0, 0, 0)" "$(echo "$CTL" | awk -F' \\| ' '{print $4" | "$5}' | sed 's/40 8px 12px 8px //')"
  printf '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff}b{position:absolute;left:30px;top:%dpx;display:block;width:120px;height:20px;background:#222}</style></head><body><b></b></body></html>' 20 > "$T/bg-ref.html"
  printf '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff}b{position:absolute;left:30px;top:%dpx;display:block;width:120px;height:20px;background:#222}</style></head><body><b></b></body></html>' 50 > "$T/bg-mine.html"
  node "$DIR/shoot.js" "$T/bg-ref.html" "$T/bgref" 200 120 >/dev/null 2>&1
  BG=$("$DIR/blockgate.sh" "$T/bg-mine.html" "$T/bgref/view_200.png" --out "$T/bg" 2>&1)
  expect "blockgate.sh finds the block offset and matches the band" "sits +0,+30 | worst residual 0px" "$(echo "$BG" | sed -n 's/.*your render sits \([-+0-9,]*\) against.*/sits \1/p') | $(echo "$BG" | sed -n 's/^verdict : \(worst residual [0-9]*px\).*/\1/p')"
  expect "controls.js button: sizes 24/32/40 and the primary/secondary fills" "1 1 1 1 1" "$(for p in 'c-btn-large{padding:8px 16px}' 'c-btn-medium{padding:4px 12px}' 'c-btn-small{padding:0 8px}' 'c-btn-primary.c-btn-default{--c-bg:#030712' 'c-btn-secondary.c-btn-default{--c-fg:#1e2939;--c-bd:inset 0 0 0 1px #d1d5dc}'; do grep -c -- "$p" "$ROOT/assets/components/controls.js" | head -1; done | tr '\n' ' ' | sed 's/ $//')"
  node -e '
const C=require(process.argv[1]),fs=require("fs");
const items=[C.radio({label:"Strict",checked:true,caption:"Flag only exact matches"}),C.radio({label:"Default"})];
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;font-size:14px;line-height:24px}${C.css}</style></head><body>`+
  C.group(items)+C.checkbox({label:"Disable",checked:true})+C.checkbox({label:"Some",indeterminate:true})+C.select({size:"medium",width:300,placeholder:"Select"})+
  C.tag({label:"Draft",color:"blue"})+C.counter({value:"5"})+C.tabs({items:["A","B"],active:"A"})+
  C.tooltip({text:"Hint"})+C.card({title:"Card",body:"x"})+
  C.selectMenu({items:[{label:"One",selected:true},{label:"Two"}],width:300})+C.toast({type:"success",text:"Saved"})+C.alert({type:"info",title:"T",text:"Body"})+"</body></html>");
' "$ROOT/assets/components/controls.js" "$T/ctl2.html"
  cat > "$T/ctl2-probe.js" <<'PROBE'
var g = function (s, f) { var e = document.querySelector(s); if (!e) return s + ":missing"; var c = getComputedStyle(e); return f(e, c, e.getBoundingClientRect()); };
return [
  g(".c-rd-m", function (e, c, r) { return Math.round(r.width) + "x" + Math.round(r.height) + " " + c.borderRadius; }),
  g(".c-rd-on .c-rd-m", function (e, c) { return c.backgroundColor; }),
  g(".c-cb-m", function (e, c, r) { return Math.round(r.width) + "x" + Math.round(r.height) + " " + c.borderRadius; }),
  g(".c-grp", function (e, c) { return c.rowGap; }),
  g(".c-tag-blue", function (e, c) { return c.backgroundColor + " " + c.borderRadius; }),
  g(".c-cnt", function (e, c) { return c.minWidth + " " + c.borderRadius; }),
  g(".c-tab-on", function (e, c, r) { return Math.round(r.height) + " " + c.color; }),
  g(".c-tip", function (e, c) { return c.backgroundColor + " " + c.padding; }),
  g(".c-card", function (e, c) { return c.borderRadius; }),
  g(".c-opt", function (e, c, r) { return Math.round(r.height) + " " + c.padding; }),
  g(".c-toast-success", function (e, c, r) { return Math.round(r.width) + " " + c.backgroundColor + " " + c.borderRadius; }),
  (function () { var s = document.querySelector(".c-cb-ind .c-cb-bar svg"); if (!s) return "no indeterminate";
    var r = s.getBoundingClientRect(); return Math.round(r.width) + "x" + Math.round(r.height); })(),
  g(".c-alert-info", function (e, c) { return c.backgroundColor + " " + c.borderRadius + " " + c.padding; })
].join(" | ");
PROBE
  CTL2=$("$DIR/statecheck.sh" "$T/ctl2.html" --size 700x600 --probe "$(cat "$T/ctl2-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  expect "controls.js radio/checkbox/tag/counter/tabs/tooltip/card: the product's geometry" "16x16 100px | rgb(3, 7, 18) | 16x16 4px | 8px | rgb(219, 234, 254) 8px | 20px 40px | 32 rgb(30, 41, 57) | rgb(3, 7, 18) 6px 8px | 16px | 40 8px 12px | 476 rgb(240, 253, 244) 12px | 16x16 | rgb(239, 246, 255) 12px 16px" "$CTL2"
  # a button rendered disabled and then enabled by the attribute alone must look enabled: the class the
  # first render left behind may not keep the default cursor or grey the label on hover (run 5's walk)
  node -e '
const C=require(process.argv[1]),fs=require("fs");        // node -e: argv[1] is the first argument
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>${C.css}</style></head><body>`
 +C.button({label:"Save",type:"primary",size:"medium",disabled:true})
 +C.button({label:"Save",type:"primary",size:"medium"})
 +`<span class="c-btn c-btn-primary c-btn-default c-btn-medium c-btn-disabled">span</span></body></html>`)' "$ROOT/assets/components/controls.js" "$T/btn.html"
  BTN=$("$DIR/statecheck.sh" "$T/btn.html" --size 400x120 --js 'document.querySelectorAll("button")[0].disabled=false;' \
    --probe 'function d(e){var c=getComputedStyle(e),h=[];for(var s of document.styleSheets){try{for(var r of s.cssRules){
      if(r.selectorText&&/:hover/.test(r.selectorText)&&e.matches(r.selectorText.replace(/:hover/g,"")))h.push(r.style.cssText)}}catch(x){}}
      return c.cursor+" "+c.color+" "+(h.join("").indexOf("6a7282")>=0?"greys-on-hover":"keeps-its-label")}
      var b=document.querySelectorAll("button"),s=document.querySelector("span.c-btn");
      return [d(b[0]),d(b[1]),d(s)].join(" | ");' 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  expect "controls.js button: clearing the attribute is enough — the leftover class does not hold the cursor or grey the label" \
    "pointer rgb(255, 255, 255) keeps-its-label | pointer rgb(255, 255, 255) keeps-its-label | default rgb(106, 114, 130) greys-on-hover" "$BTN"

  # the tooltip's arrow: wholly outside the edge it names, centred on it, and turned the right way.
  # Direction is the thing a percentage cannot see, so it is asserted as geometry: the arrow's box
  # must sit past the box's edge on the named side, at 4px deep small and 8px large.
  node -e '
const C=require(process.argv[1]),fs=require("fs");
const at=(h,x,y)=>`<div style="position:absolute;left:${x}px;top:${y}px">${h}</div>`;
let h=`<!doctype html><html><head><meta charset="utf-8"><style>${C.css}body{margin:0;background:#fff}</style></head><body>`;
["top","right","bottom","left"].forEach((s,i)=>{h+=at(C.tooltip({text:"Side "+s,side:s}),40+i*220,60)});
h+=at(C.tooltip({text:"Large bottom",size:"large",side:"bottom"}),40,200);
fs.writeFileSync(process.argv[2],h+"</body></html>")' "$ROOT/assets/components/controls.js" "$T/tip.html"
  TIPPROBE='var out=[];
document.querySelectorAll(".c-tip-a").forEach(function(t){
  var side=(t.className.match(/c-tip-a-(top|right|bottom|left)/)||[])[1];
  var b=t.getBoundingClientRect(), a=t.querySelector(".c-tip-arrow").getBoundingClientRect();
  var prot = side==="top" ? a.top-b.bottom : side==="bottom" ? b.top-a.bottom : side==="right" ? b.left-a.right : a.left-b.right;
  var mid = (side==="top"||side==="bottom") ? (a.left+a.right)/2-(b.left+b.right)/2 : (a.top+a.bottom)/2-(b.top+b.bottom)/2;
  out.push(side+" "+(t.className.indexOf("c-tip-large")>=0?"large":"small")+" "+Math.round(a.width)+"x"+Math.round(a.height)+" gap"+Math.round(prot)+" mid"+Math.round(mid));});
return out.join(" | ");'
  TIP=$("$DIR/statecheck.sh" "$T/tip.html" --size 900x300 --probe "$TIPPROBE" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  # gap 0 = the arrow touches the edge and is wholly outside it; mid 0 = centred on that edge
  expect "controls.js tooltip arrow: 8x4 small, 20x8 large, wholly outside the named edge and centred on it" \
    "top small 8x4 gap0 mid0 | right small 4x8 gap0 mid0 | bottom small 8x4 gap0 mid0 | left small 4x8 gap0 mid0 | bottom large 20x8 gap0 mid0" "$TIP"
  expect "controls.js tooltip: the product's 12/16, and the arrow only when a side is given" "font-size:12px;line-height:16px 0 1" "$(grep -o 'font-size:12px;line-height:16px' "$ROOT/assets/components/controls.js" | head -1) $(node -e 'const C=require(process.argv[1]);console.log((C.tooltip({text:"x"}).match(/c-tip-arrow/g)||[]).length,(C.tooltip({text:"x",side:"top"}).match(/c-tip-arrow/g)||[]).length)' "$ROOT/assets/components/controls.js")"
  expect "controls.js input: hover and focus rules carry the product's colours" "3" "$(grep -c -e 'c-input-normal:hover .c-input-box{box-shadow:inset 0 0 0 1px #b4bac4' -e 'c-input:focus-within .c-input-box{box-shadow:inset 0 0 0 1px #d1d5dc,0 0 0 1px #fff,0 0 0 3px #60a5fa' -e 'c-input-error .c-input-box{box-shadow:inset 0 0 0 1px #dc2626' "$ROOT/assets/components/controls.js")"
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;font-size:14px;line-height:24px}${C.css}</style></head><body>`+
  C.status({color:"grey",label:"Status title",text:"The five boxing wizards jump quickly"})+
  C.multiselect({size:"large",width:300,values:["Option 3","Option 35"]})+
  C.emptyState({title:"This section is empty",text:"Please ensure that the content exists",buttons:[C.button({label:"Go",size:"medium"})]})+
  C.statusSelect({color:"green",label:"Success"})+
  C.card({title:"Card",body:"x"})+C.modal({hidden:false,size:"medium",title:"Modal title",subtitle:"Modal subtitle",body:"x"})+
  C.input({title:"I am a label",width:300,hint:"Hint text"})+
  C.button({type:"ai",label:"Generate with AI"})+C.button({type:"ai-tertiary",label:"Generate with AI"})+
  C.tag({color:"gradient",label:"AI"})+C.counter({value:"5",color:"blue",kind:"outline"})+C.counter({value:"5",color:"grey",kind:"dashed"})+"</body></html>");
' "$ROOT/assets/components/controls.js" "$T/ctl3.html"
  cat > "$T/ctl3-probe.js" <<'PROBE'
var g = function (s, f) { var e = document.querySelector(s); if (!e) return s + ":missing"; return f(e, getComputedStyle(e), e.getBoundingClientRect()); };
return [
  g(".c-st", function (e, c, r) { return Math.round(r.height) + " " + c.padding + " " + c.borderRadius + " " + c.gap + " " + c.backgroundColor + " " + c.borderColor; }),
  g(".c-st-d", function (e, c, r) { return Math.round(r.width) + "x" + Math.round(r.height) + " " + c.backgroundColor; }),
  g(".c-st-t", function (e, c) { return c.fontSize + "/" + c.lineHeight + " " + c.fontWeight; }),
  g(".c-sel .c-input-text", function (e) { return e.textContent; }),
  g(".c-es", function (e, c) { return c.padding + " " + c.borderRadius + " " + c.justifyContent; }),
  g(".c-es-l", function (e, c) { return c.gap + " " + c.textAlign; }),
  g(".c-es-d", function (e, c) { return c.fontSize + "/" + c.lineHeight + " " + c.marginTop; }),
  g(".c-ss", function (e, c, r) { return Math.round(r.height) + " " + c.backgroundColor + " " + c.borderColor + " " + c.color; }),
  g(".c-ss-ch", function (e, c, r) { return Math.round(r.width) + "x" + Math.round(r.height) + " " + c.color; }),
  g(".c-card-h", function (e, c, r) { return Math.round(r.height) + " " + c.padding + " " + c.backgroundColor; }),
  g(".c-card-ch", function (e, c, r) { return Math.round(r.width) + "x" + Math.round(r.height) + " " + c.color; }),
  g(".c-mod-medium", function (e, c, r) { return Math.round(r.width) + " " + c.padding; }),
  g(".c-mod-t", function (e, c) { return c.fontSize + "/" + c.lineHeight + " " + c.fontWeight; }),
  g(".c-input-title", function (e, c) { return c.fontSize + "/" + c.lineHeight + " " + c.fontWeight + " " + c.marginBottom; }),
  g(".c-btn-ai", function (e, c) { return c.backgroundImage.slice(0, 46) + " " + c.boxShadow.replace(" inset", ""); }),
  g(".c-btn-ai-tertiary .c-btn-c", function (e, c) { return c.backgroundImage.slice(0, 47) + " " + c.webkitTextFillColor; }),
  g(".c-tag-gradient", function (e, c) { return c.backgroundImage.slice(0, 44) + " " + c.color; }),
  g(".c-cnt-outline", function (e, c) { return c.outline + " " + c.color; }),
  g(".c-cnt-dashed", function (e, c) { return c.outline + " " + c.backgroundColor; })
].join(" | ");
PROBE
  CTL3=$("$DIR/statecheck.sh" "$T/ctl3.html" --size 700x300 --probe "$(cat "$T/ctl3-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')
  expect "controls.js status, status select, multiselect, empty state, card header, modal, field label, AI buttons, gradient tag and counter rings carry the product's values" "24 0px 8px 9999px 4px rgb(243, 244, 246) rgb(209, 213, 220) | 6x6 rgb(106, 114, 130) | 12px/16px 500 | Option 3, Option 35 | 24px 12px center | 16px center | 14px/24px 8px | 24 rgb(220, 252, 231) rgb(187, 247, 208) rgb(22, 101, 52) | 16x16 rgb(22, 163, 74) | 40 8px rgb(243, 244, 246) | 24x24 rgb(74, 85, 101) | 600 16px 24px | 18px/24px 700 | 14px/24px 500 4px | linear-gradient(90deg, rgb(224, 231, 255) 0%,  rgb(233, 213, 255) 0px 0px 0px 1px | linear-gradient(135deg, rgb(129, 140, 248) 12.2 rgba(0, 0, 0, 0) | linear-gradient(72deg, rgb(180, 101, 218) 0% rgb(255, 255, 255) | rgb(147, 197, 253) solid 1px rgb(30, 64, 175) | rgb(153, 161, 175) dashed 1px rgb(255, 255, 255)" "$CTL3"
  # controls.js code block, search bar, tag multiselect and the link-sized plain button
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}${C.css}</style></head><body>`+
  C.codeBlock({title:"Payload",lines:["// a comment",{text:"\"a\": 1",kind:"string"}],actions:C.button({type:"secondary",size:"small",label:"Copy"})})+
  C.searchBar({width:416,placeholder:"Enter search query"})+
  C.tagMultiselect({size:"medium",width:500,values:["applicantCreated","applicantDeleted"],closeIcon:"<svg width=\"16\" height=\"16\"></svg>"})+
  C.button({type:"plain",size:"link",label:"Add domain"})+"</body></html>");
' "$ROOT/assets/components/controls.js" "$T/ctl4.html"
  cat > "$T/ctl4-probe.js" <<'PROBE'
var g = function (s, f) { var e = document.querySelector(s); if (!e) return s + ":missing"; return f(e, getComputedStyle(e), e.getBoundingClientRect()); };
return [
  g(".c-code", function (e, c) { return c.borderRadius + " " + c.backgroundColor + " " + c.boxShadow.replace(" inset", ""); }),
  g(".c-code-h", function (e, c) { return c.padding; }),
  g(".c-code-t", function (e, c) { return c.fontSize + "/" + c.lineHeight + " " + c.fontWeight; }),
  g(".c-code-n", function (e, c) { return c.padding + " " + c.color + " " + c.fontSize + "/" + c.lineHeight; }),
  g(".c-code-string", function (e, c) { return c.color; }),
  g(".c-sb .c-input-box", function (e, c, r) { return Math.round(r.height) + " " + c.padding; }),
  g(".c-sb-ic", function (e, c, r) { return Math.round(r.width) + " " + c.marginRight + " " + c.color; }),
  g(".c-tms .c-input-box", function (e, c) { return c.alignItems; }),
  g(".c-tms-tags", function (e, c) { return c.gap + " " + c.flexWrap; }),
  g(".c-btn-link", function (e, c, r) { return Math.round(r.height) + " " + c.fontSize + "/" + c.lineHeight + " " + c.padding; })
].join(" | ");
PROBE
  # the five the Applicant page needed and did not find, 2026-09-21
  expect "controls.js dataList, kbd, a field's right-hand label value, a group's visible title, a card in colour" \
    "152px 24px #364153 20px #edeff2 FREYA labelledby #fad24a #fffbeb grey-inside" "$(node -e '
const C=require(process.argv[1]);
const css=C.css;
const pick=(re)=>((css.match(re)||[])[1]||"?" );
const dl=C.dataList([{label:"Country",value:"Germany"}]), kb=C.kbd(["A"]);
const inp=C.input({size:"medium",title:"First name",titleRight:"FREYA"});
const grp=C.group([C.radio({label:"A",name:"g"})],{title:"Document validity"});
const cd=C.card({color:"yellow",title:"t",body:C.card({title:"inner",body:"grey-inside"})});
console.log([
  pick(/\.c-dl\{--c-dl-l:(\d+px)/), pick(/\.c-dl-l\{[^}]*line-height:(\d+px)/),
  pick(/\.c-dl-l\{[^}]*color:(#\w+)/), pick(/\.c-kbd kbd\{[^}]*min-width:(\d+px)/),
  pick(/\.c-kbd kbd\{[^}]*background:(#\w+)/),
  (inp.match(/c-input-tr">([^<]*)/)||[])[1], grp.includes("aria-labelledby") ? "labelledby" : "no",
  pick(/\.c-card-yellow\{[^}]*border:1px solid (#\w+)/), pick(/\.c-card-yellow > \.c-card-h\{background:(#\w+)/),
  cd.includes("grey-inside") ? "grey-inside" : "missing"
].join(" "));' "$ROOT/assets/components/controls.js")"
  expect "controls.js code block, search bar, tag multiselect and link button" "12px rgb(249, 250, 251) rgb(209, 213, 220) 0px 0px 0px 1px | 8px 20px | 16px/24px 700 | 0px 12px 0px 20px rgb(74, 85, 101) 12px/18px | rgb(21, 128, 61) | 32 4px 12px | 16 8px rgb(30, 41, 57) | flex-start | 4px wrap | 16 12px/16px 0px" "$("$DIR/statecheck.sh" "$T/ctl4.html" --size 700x500 --probe "$(cat "$T/ctl4-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # controls.js select menu: opens on the trigger, picks, closes; the multiselect keeps its menu open
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;font-family:system-ui}</style><style>${C.css}</style></head><body>`+
  `<div style="width:500px">`+C.select({size:"medium",placeholder:"Select types",items:["a",{label:"b",caption:"c"},"d"],search:true})+`</div>`+
  `<div style="width:500px">`+C.tagMultiselect({size:"medium",placeholder:"Select types",items:["a","b"],closeIcon:"<svg width=16 height=16></svg>"})+`</div>`+
  `<script>${C.script}<\/script></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/menu.html"
  cat > "$T/menu-probe.js" <<'PROBE'
var sel = document.querySelector(".c-sel"), tms = document.querySelector(".c-tms");
var click = function (el) { el.dispatchEvent(new MouseEvent("click", {bubbles: true})); };
var vis = function (w) { return getComputedStyle(w.querySelector(".c-menu")).display !== "none"; };
var out = [vis(sel)];
click(sel.querySelector(".c-input-box")); out.push(vis(sel));
click(sel.querySelectorAll(".c-opt")[2]);
out.push(sel.querySelector(".c-input-text").textContent + " " + vis(sel));
click(tms.querySelector(".c-input-box"));
click(tms.querySelectorAll(".c-opt")[0]); click(tms.querySelectorAll(".c-opt")[1]);
out.push(tms.querySelectorAll(".c-tms-tag").length + " " + vis(tms));
document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"}));
out.push(vis(tms));
click(sel.querySelector(".c-input-box"));
var row = sel.querySelector(".c-opt-on"), m = sel.querySelector(".c-menu");
out.push(getComputedStyle(row).backgroundColor + " " + getComputedStyle(m).borderRadius + " " + getComputedStyle(m).maxHeight);
return out.join(" | ");
PROBE
  expect "controls.js select menu: opens, picks, closes, and the multiselect keeps its own open" "false | true | d false | 2 true | false | rgb(249, 250, 251) 12px 400px" "$("$DIR/statecheck.sh" "$T/menu.html" --size 700x600 --probe "$(cat "$T/menu-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # controls.js script order: a control inside a menu row must not reach the branch below it
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;font-family:system-ui}</style><style>${C.css}</style></head><body>`+
  `<div class="c-grp" id="outer">`+C.radio({label:"outer radio",checked:true})+`</div>`+
  `<div style="width:400px">`+C.select({size:"medium",placeholder:"pick",items:["one","two"]})+`</div>`+
  `<div class="c-card c-card-small c-card-open"><div class="c-card-h">`+C.checkbox({label:"in a header"})+`</div></div>`+
  `<script>${C.script}<\/script></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/nested.html"
  cat > "$T/nested-probe.js" <<'PROBE'
var click = function (el) { el.dispatchEvent(new MouseEvent("click", {bubbles: true})); };
var sel = document.querySelector(".c-sel"), outer = document.querySelector("#outer .c-rd");
click(sel.querySelector(".c-input-box"));
click(sel.querySelectorAll(".c-opt")[1]);
var a = sel.querySelector(".c-input-text").textContent + " " + outer.classList.contains("c-rd-on");
var cb = document.querySelector(".c-card-h .c-cb");
click(cb);
return a + " | " + cb.classList.contains("c-cb-on") + " " + document.querySelectorAll(".c-sel-open").length;
PROBE
  expect "controls.js script: a pick inside a menu does not fall through to the controls under it" "two true | true 0" "$("$DIR/statecheck.sh" "$T/nested.html" --size 700x500 --probe "$(cat "$T/nested-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # controls.js accessibility: labels reach their fields, roles and aria state are present and stay
  # in step, and Space/Enter act on every focusable control the way a click does
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;font-family:system-ui}</style><style>${C.css}</style></head><body>`+
  C.input({title:"Name",placeholder:"Webhook name",hint:"Hint",size:"medium"})+
  C.input({title:"Secret",secret:true,buttons:[{icon:"<svg/>",label:"Show"},{icon:"<svg/>",label:"Copy"}],error:"Could not load"})+
  C.group([C.radio({label:"A",checked:true}),C.radio({label:"B"})])+C.checkbox({label:"one"})+
  `<div style="width:400px">`+C.select({title:"Types",size:"medium",placeholder:"Select",items:["a","b"]})+`</div>`+
  `<div style="width:400px">`+C.tagMultiselect({size:"medium",placeholder:"Pick",items:["x","y"],closeIcon:"<svg width=16 height=16></svg>"})+`</div>`+
  C.tabs({items:["T1","T2"],active:"T1"})+C.card({title:"Card",body:"b"})+C.toast({type:"success",text:"Saved"})+C.modal({hidden:false,title:"M",body:"b"})+
  `<script>${C.script}<\/script></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/a11y.html"
  cat > "$T/a11y-probe.js" <<'PROBE'
var q = function (s) { return document.querySelector(s); }, qa = function (s) { return document.querySelectorAll(s); };
var key = function (el, k) { el.focus(); el.dispatchEvent(new KeyboardEvent("keydown", {key: k, bubbles: true})); };
var lab = q("label.c-input-title"), inp = q("#" + lab.getAttribute("for"));
var out = [(inp && inp.tagName) + " " + qa("[aria-describedby]").length + " " + qa("[aria-invalid=true]").length + " " + qa(".c-input-btn[aria-label]").length];
var cb = q(".c-cb"); key(cb, " "); out.push(cb.getAttribute("aria-checked"));
var rd = qa(".c-rd")[1]; key(rd, "Enter"); out.push(rd.getAttribute("aria-checked") + qa(".c-rd")[0].getAttribute("aria-checked") + " " + q(".c-grp").getAttribute("role"));
var box = q(".c-sel .c-input-box"); key(box, "Enter"); out.push(box.getAttribute("aria-expanded"));
q(".c-sel .c-opt[data-opt=b]").click(); out.push(q(".c-sel .c-input-text").textContent + " " + box.getAttribute("aria-expanded") + " " + q(".c-sel .c-opt[data-opt=b]").getAttribute("aria-selected"));
q(".c-tms .c-input-box").click(); qa(".c-tms .c-opt")[0].click(); qa(".c-tms .c-opt")[1].click(); q(".c-tms-x").click();
out.push(qa(".c-tms-tag").length + " " + q(".c-tms-x").getAttribute("aria-label"));
var h = q(".c-card-h"); key(h, " "); out.push(h.getAttribute("aria-expanded"));
out.push([q(".c-tabs").getAttribute("role"), q(".c-tab").getAttribute("role"), q(".c-toast").getAttribute("role"), q(".c-mod").getAttribute("role"), q(".c-menu-l").getAttribute("role")].join(","));
out.push(document.getElementById(q(".c-mod").getAttribute("aria-labelledby")) !== null);
return out.join(" | ");
PROBE
  expect "controls.js accessibility: label links, aria state, keyboard on every control" "INPUT 2 1 2 | true | truefalse radiogroup | true | b false true | 1 Remove y | false | tablist,tab,alert,dialog,listbox | true" "$("$DIR/statecheck.sh" "$T/a11y.html" --size 800x900 --probe "$(cat "$T/a11y-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # controls.js secret field: a click in the box focuses the input and the value can be selected
  node -e '
const C=require(process.argv[1]),fs=require("fs");
const q = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"7\"/></svg>";
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}${C.css}</style></head><body>`+
  C.input({size:"medium",secret:true,width:554,title:"Secret",titleIcon:q,buttons:[q,q],error:"Could not load",errorIcon:q})+
  `<script>${C.script}<\/script></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/secret.html"
  cat > "$T/secret-probe.js" <<'PROBE'
var box = document.querySelector(".c-input-box"), ctl = document.querySelector(".c-input-ctl");
box.dispatchEvent(new MouseEvent("click", {bubbles: true}));
var focused = document.activeElement === ctl;
ctl.setSelectionRange(0, 4);
var b = document.querySelectorAll(".c-input-btn")[0].getBoundingClientRect();
return Math.round(box.getBoundingClientRect().height) + " " + focused + " " + (ctl.selectionEnd - ctl.selectionStart) +
       " " + ctl.value.length + " " + Math.round(b.width) + "x" + Math.round(b.height) +
       " " + getComputedStyle(document.querySelector(".c-input-err")).color;
PROBE
  expect "controls.js secret field: click focuses it, the value selects, two 24px buttons" "32 true 4 16 24x24 rgb(220, 38, 38)" "$("$DIR/statecheck.sh" "$T/secret.html" --size 700x200 --probe "$(cat "$T/secret-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # controls.js script: a radio picks inside its own group, a box toggles, a disabled one does not
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}${C.css}</style></head><body>`+
  `<div class="c-grp" id="g1">`+C.radio({label:"A",checked:true})+C.radio({label:"B"})+`</div>`+
  `<div class="c-grp" id="g2">`+C.radio({label:"C",checked:true})+C.radio({label:"D"})+`</div>`+
  C.checkbox({label:"one"})+C.checkbox({label:"two",indeterminate:true})+C.checkbox({label:"off",disabled:true})+
  `<script>${C.script}<\/script></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/live.html"
  cat > "$T/live-probe.js" <<'PROBE'
var q = function (s) { return document.querySelectorAll(s); };
var click = function (el) { el.dispatchEvent(new MouseEvent("click", {bubbles: true})); };
var st = function () {
  var r = "", c = "";
  q(".c-rd").forEach(function (e) { r += e.classList.contains("c-rd-on") ? 1 : 0; });
  q(".c-cb").forEach(function (e) { c += (e.classList.contains("c-cb-on") ? 1 : 0) + (e.classList.contains("c-cb-ind") ? "i" : ""); });
  return r + " " + c;
};
click(q("#g2 .c-rd")[1]);
var a = st();
click(q(".c-cb")[0]); click(q(".c-cb")[1]); click(q(".c-cb")[2]);
return a + " / " + st();
PROBE
  expect "controls.js script: radios pick within their group, boxes toggle, disabled ones do not" "1001 01i0 / 1001 110" "$("$DIR/statecheck.sh" "$T/live.html" --size 500x400 --probe "$(cat "$T/live-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # fluid-page.js + fluidcheck.sh: the primary column gives up width, the aside does not
  node -e '
const {render}=require(process.argv[1]),fs=require("fs");
const r=render({frameWidth:1084,primary:{width:640,min:512},aside:{width:380}},
  "<div style=\"height:200px\">form</div>","<div style=\"height:120px\">card</div>");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}${r.css}</style></head><body>${r.html}</body></html>`);
' "$ROOT/assets/templates/fluid-page.js" "$T/fluid.html"
  FL=$("$DIR/fluidcheck.sh" "$T/fluid.html" 1920 1100 960 2>&1 | tr -s ' ')
  # 1920: the frame's own widths. 1100: the primary column has given up 48 and the aside
  # has not moved. 960: the floor holds at 512 and the page admits it scrolls sideways
  expect "fluid-page.js: the primary column shrinks to its floor, the aside never does, and under the floor the page scrolls" "1920 : scroll 1920/1920 ok | main 640 · aside 380 | clipped none 1100 : scroll 1100/1100 ok | main 592 · aside 380 | clipped none 960 : scroll 988/960 SIDEWAYS | main 512 · aside 380" "$(echo "$FL" | tr '\n' ' ' | tr -s ' ' | sed 's/ | clipped 4.*//' | sed 's/^ //;s/ $//')"
  # the whole-page fixture: the shell and the library composed into one realistic page and diffed
  # against a stored render. Component-by-component checks pass while a page is broken — doubled
  # card padding, a colour cascading into a nested card, a named icon button growing into a text
  # button and eliding the title — and all three of those shipped on 2026-09-21 before an eye
  # caught them. A difference here is not automatically a regression: look at the diff map, and
  # if the change is wanted, re-record the baseline in the same commit.
  node "$ROOT/assets/fixture.js" "$T/fixture.html" >/dev/null 2>&1
  node "$DIR/shoot.js" "$T/fixture.html" "$T/fx" 1200 900 >/dev/null 2>&1
  # threshold 6, not the default 60: this is a self-render and must be identical, and 60 is wide
  # enough to hide a whole panel changing from grey #f3f4f6 to cream #fffbeb (a sum of 30)
  FXD=$(TH=6 "$DIR/zonediff.sh" "$ROOT/assets/components/reference/fixture-1200x900.png" "$T/fx/view_1200.png" \
        '[["page",0,0,1200,900]]' "$T/fx/diff.png" 2>&1)
  expect "the whole-page fixture renders exactly as recorded (assets/components/reference/)" "page 0.00%" "$FXD"

  expect "list-table.js renders a spec: header, one row, flex column css" "true true 1" "$(node -e '
const {render}=require(process.argv[1]);const r=render({columns:[{key:"chk",label:"__checkbox__",width:40},{key:"a",label:"A",width:100},{key:"b",label:"B",flex:1,min:200}],rows:[{a:"x",b:"y"}],footer:{show:"10",found:"1",page:{of:"3"}}},(n,w,h)=>"<svg></svg>");
console.log(r.html.includes("lt-thead"), r.css.includes(".lt .c-b{flex:1 0 0;min-width:200px}"), r.html.split("lt-tr").length-1)' "$ROOT/assets/templates/list-table.js" 2>&1)"
  expect "shellgate.sh: landmarks within 1px on the master example" "match the frame within 1px" "$G"
  expect "shellgate.sh: compares the header when the frame has the current one" "header compared" "$G"
  expect "collapsed sidebar renders the Expand row, the basic header and its tab subheader" "1 1 1" "$(grep -c 'class="sh-collapse rail"' "$T/bc.html") $(grep -c 'class="sh-header"' "$T/bc.html") $(grep -c 'class="sh-sub"' "$T/bc.html")"
  ST=$("$DIR/statecheck.sh" "$T/a.html" --size 200x100 --no-anim \
        --css '.box{background:#00ff00!important}' \
        --js "$(cat "$DIR/probe.js")" \
        --probe 'var b=P.box(".box");return [b.x,b.y,b.w,b.h,P.rgb("#00ff00")]' \
        --points '[[40,40]]' --ref "$A" --zones '[["box",20,20,40,40]]' 2>&1)
  expect "statecheck --js probe.js + --probe (P.box, P.rgb)" '[20,20,40,40,"rgb(0, 255, 0)"]' "$ST"
  expect "statecheck --css forced state + --points" "#00ff00" "$ST"
  expect "statecheck --ref regression diff" "box 100.00%" "$ST"
fi

# ---------------------------------------------------------------- level 2
echo "level 2 — documents"
cd "$ROOT" || exit 1
MD=$(ls SKILL.md references/*.md assets/*.md)
NAME=$(sed -n 's/^name: *//p' SKILL.md | head -1)
[ "$NAME" = "$(basename "$ROOT")" ] && pass "frontmatter name matches the folder" || fail "frontmatter name '$NAME' ≠ folder '$(basename "$ROOT")'"
DLEN=$(python3 - <<'PY'
import re
s=open('SKILL.md',encoding='utf-8').read()
m=re.search(r'^description: >-\n(.*?)\n---',s,re.S|re.M)
print(len(' '.join(l.strip() for l in m.group(1).splitlines())) if m else 0)   # characters, not bytes
PY
)
[ "$DLEN" -gt 0 ] && pass "description present ($DLEN chars)" || fail "description missing or not in '>-' form"
[ "$DLEN" -le 1024 ] || echo "  warn  description is $DLEN chars; the documented guideline is 1024"

# every path a document mentions exists
while read -r p; do [ -e "$p" ] && pass "exists: $p" || fail "referenced but missing: $p"; done < <(
  grep -ohE '(references/[a-z0-9-]+\.md|scripts/[A-Za-z0-9_.-]+\.(sh|js|cjs|py|html)|assets/[a-z0-9-]+\.md)' $MD | sort -u)
# bare "<name>.md" mentions inside the references must be sibling files. A name written with a
# path — `<project>/_work/gen/page.html`, `<project>/report.md` — is a file the skill WRITES, not one it
# has, so anything containing a slash is dropped before the check.
while read -r n; do [ -e "references/$n" ] || [ "$n" = "SKILL.md" ] || fail "references mention '$n', which is not a file in references/"; done < <(
  sed -E 's#[A-Za-z0-9_.<>-]*/[A-Za-z0-9_./<>-]+##g' references/*.md | grep -ohE '`?[a-z-]+\.md`?' | tr -d '`' | sort -u)
# nothing in the skill may name where the skill is installed. The install path is not the skill's
# business and it moves: a plugin puts it under a versioned directory that changes on every update,
# so a baked path fails weeks later, far from the edit. $SKILL (SKILL.md, Before you start) is the
# one name for it. lint.sh itself is excluded because this rule has to spell the pattern out.
BAKED=$(grep -rn --exclude=lint.sh --exclude-dir=.git -E 'claude/skills/[a-z]' . 2>/dev/null | head -5)
[ -z "$BAKED" ] && pass "nothing bakes the install path (\$SKILL is the only name for it)" \
  || fail "the install path is baked in: $(echo "$BAKED" | cut -c1-110 | tr '\n' ' ')"

# a script that emits a whole HTML document must embed the design system's font, or say in a
# `no-font:` comment why it does not. A page generator once rendered in the system face for days:
# the shapes pass for Geist at a glance, the widths do not, and every text measured there was wrong.
for f in scripts/*.js assets/templates/*.js; do
  grep -qi '<!doctype html' "$f" || continue
  if grep -q '@font-face' "$f"; then pass "embeds the font: $f"
  elif grep -q 'no-font:' "$f"; then pass "declares why it needs no font: $f"
  else fail "$f builds a whole page but embeds no @font-face (and no 'no-font:' comment saying why)"; fi
done
# --js and --probe must compose: a --js that does not end in ';' once made the combined script a
# syntax error and the probe printed nothing at all — no value, no error (run 6, 2026-09-21)
printf '%s' '<!doctype html><html><head><title>t</title></head><body><div id=a>x</div></body></html>' > "$T/sc.html"
expect "statecheck --js without a trailing semicolon still reaches the probe" '"k=1"' \
  "$("$DIR/statecheck.sh" "$T/sc.html" --size 200x100 --js 'window.k=1' --probe 'return "k=" + window.k' 2>&1 | sed -n 's/^probe : //p')"
# --full measures the box holding the content, not the tallest scrolling box: a sidebar menu
# overflows on every shell page at 900 and was being reported as the page's own height
node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-master.json" --out "$T/full.html" >/dev/null 2>&1
expect "statecheck --full measures the content box, not the sidebar" "full  : rendering 1440x" \
  "$("$DIR/statecheck.sh" "$T/full.html" --size 1440x900 --full --out "$T/fullout" 2>&1 | head -1)"

# the run log: the template exists, Step 8 requires it, and the skill offers it without sending
# it. The last one is the point — a log collected quietly reads as a record of who erred.
expect "Step 8 requires the run log and says where it lives" "3" "$(grep -c '_work/run-log.md' SKILL.md)"
expect "the run log is offered, never sent" "1 1" "$(grep -c 'never send it anywhere' SKILL.md) $(grep -c 'nothing about it is automatic' SKILL.md)"
expect "the template asks where the skill was wrong" "1 1" "$(grep -c '^## 6. Where the skill was wrong' assets/run-log-template.md) $(grep -c 'Read it before sending it anywhere' assets/run-log-template.md)"

# the pre-flight version check, which is what makes a colleague hear about an update when the
# only skill they use is this one. It must be the first section, must name the two update
# commands, and must skip silently when the skill is not inside a plugin.
PF=$(sed -n '/^## /{=;p;}' SKILL.md | sed -n '1,4p' | tr '\n' ' ')
expect "the version check is the first section of SKILL.md" "Pre-flight: plugin version check" "$PF"
expect "it names both update commands and the standalone skip" "3" "$(grep -c 'claude plugin marketplace update sumsub-design\|claude plugin update sumsub-design@sumsub-design\|CLAUDE_PLUGIN_ROOT}\` is empty' SKILL.md)"

# every icon in the skill is reachable, and no icon file is anything but an SVG. A download loop
# once saved five files with the URL stuck to the name, and their contents were a 404 in JSON;
# they sat in the skill until someone listed what was never asked for.
cat > "$T/icons-check.js" <<'ICONS'
const fs = require('fs'), path = require('path'), R = process.argv[2];
const read = f => fs.readFileSync(path.join(R, f), 'utf8');
const lit = (src, fn) => new Set([...src.matchAll(new RegExp(fn + "\\(['\"]([\\w-]+)['\"]\\)", 'g'))].map(m => m[1]));
const names = lit(read('scripts/shell.js'), 'icon');
const walk = o => {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') {
    // the shell's own rule (shell.js, outlineName): the filled variant always, and for the
    // inactive row the -outline file when there is one, else the bare name
    if (typeof o.icon === 'string') {
      names.add(o.icon + '-filled');
      names.add(fs.existsSync(path.join(R, 'assets/shell/dashboard/icons', o.icon + '-outline.svg'))
        ? o.icon + '-outline' : o.icon);
    }
    Object.values(o).forEach(walk);
  }
};
walk(JSON.parse(read('assets/shell/dashboard/menu.json')));
// a header icon is named by the CONFIG, not by the code: page.actions and page.info carry it.
// Accept the set by its strict name shape, which is also what catches a download saved as
// "header-copy b246a056-....svg" — the space and the hex fail the pattern.
const byConfig = n => /^header-[a-z][a-z-]*[a-z]$/.test(n);
fs.readdirSync(path.join(R, 'assets/shell/dashboard/examples')).filter(f => f.endsWith('.json'))
  .forEach(f => walk(JSON.parse(read('assets/shell/dashboard/examples/' + f))));
const cnames = lit(read('assets/components/icons/../controls.js'), 'ICON');
['tooltip-arrow-small', 'tooltip-arrow-large'].forEach(n => cnames.add(n));   // ICON('tooltip-arrow-' + size)
const bad = [];
for (const [dir, want] of [['assets/shell/dashboard/icons', names], ['assets/components/icons', cnames]]) {
  const have = fs.readdirSync(path.join(R, dir)).filter(f => f.endsWith('.svg')).map(f => f.slice(0, -4));
  for (const f of have) {
    if (!want.has(f) && !byConfig(f)) bad.push(dir + '/' + f + '.svg never asked for');
    const head = read(dir + '/' + f + '.svg').slice(0, 5);
    if (!head.startsWith('<svg') && !head.startsWith('<?xml')) bad.push(dir + '/' + f + '.svg is not an SVG');
  }
  for (const n of want) if (!have.includes(n)) bad.push(dir + '/' + n + '.svg asked for but missing');

}
console.log(bad.length ? bad.join(' | ') : 'every icon is reachable and is an SVG');
ICONS
expect "every icon file is reachable by name and really is an SVG" "every icon is reachable and is an SVG" "$(node "$T/icons-check.js" "$ROOT" 2>&1)"

# every file in the skill is listed in SKILL.md
for f in references/*.md assets/*.md; do grep -q "$f" SKILL.md && pass "listed: $f" || fail "not in SKILL.md: $f"; done
for f in scripts/*; do b=$(basename "$f"); case "$b" in _*|*.html) continue ;; esac
  grep -q "scripts/$b" SKILL.md && pass "listed: scripts/$b" || fail "not in SKILL.md: scripts/$b"; done
# quoted headings next to a file name must exist in that file
python3 - <<'PY' || bad=1
import re,glob,sys
files=['SKILL.md']+glob.glob('references/*.md')+glob.glob('assets/*.md')
heads={f:[re.sub(r'[`*]','',h).strip() for h in re.findall(r'^##+ (.+)$',open(f,encoding='utf-8').read(),re.M)] for f in files}
byname={f.split('/')[-1]:f for f in files}
ok=True
for f in files:
    txt=open(f,encoding='utf-8').read()
    for m in re.finditer(r'([A-Za-z-]+\.md)[^\n]{0,60}?[“"]([^"”\n]{3,70})[”"]',txt):
        target=byname.get(m.group(1))
        if not target: continue
        if not any(m.group(2).lower() in h.lower() for h in heads[target]):
            print(f'  FAIL  {f}: points at heading "{m.group(2)}" in {m.group(1)}, no such heading'); ok=False
    for m in re.finditer(r'Step (\d)',txt):
        if not any(h.startswith(f'Step {m.group(1)} ') for h in heads['SKILL.md']):
            print(f'  FAIL  {f}: mentions Step {m.group(1)}, SKILL.md has no such step'); ok=False
    for m in re.finditer(r'§(\d)',txt):
        if 'research-prototypes' in f or 'research-prototypes.md' in txt:
            if not any(h.startswith(f'{m.group(1)}. ') for h in heads['references/research-prototypes.md']):
                print(f'  FAIL  {f}: §{m.group(1)} — research-prototypes.md has no section {m.group(1)}'); ok=False
print('  ok    headings, Steps and § references resolve' if ok else '', end='\n' if ok else '')
sys.exit(0 if ok else 1)
PY
# the project layout is spelled one way: _work/... , or a line inside an indented tree
STALE=$(grep -nE 'figma-ref/|(^|[^_a-z])gen/|baseline/|shots/' $MD | grep -v '_work/' | grep -vE '^[^:]+:[0-9]+:    ' || true)
[ -z "$STALE" ] && pass "project paths all under _work/" || fail "paths outside _work/: $(echo "$STALE" | head -3 | tr '\n' ' ')"
# code fences closed
for f in $MD; do n=$(grep -c '^```' "$f"); [ $((n % 2)) -eq 0 ] && pass "fences closed: $f" || fail "odd number of \`\`\` in $f"; done

echo
if [ $bad -eq 0 ]; then echo "lint: clean"; else echo "lint: fix the FAIL lines above"; exit 1; fi
