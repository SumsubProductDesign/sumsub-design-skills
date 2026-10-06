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
# the default outdir is the project's _work/figma-ref, wherever the call is made from
mkdir -p "$T/g/_work/figma-ref" && cp "$T/r.json" "$T/g/_work/figma-ref/" && (cd "$T/g/_work/figma-ref" && node "$DIR/grab.js" r.json deep >/dev/null 2>&1)
expect "grab.js run from inside _work/figma-ref writes there, not into a nested _work" "1 0" "$([ -s "$T/g/_work/figma-ref/deep.jsx" ] && echo 1 || echo 0) $([ -d "$T/g/_work/figma-ref/_work" ] && echo 1 || echo 0)"
expect "publish.sh usage" "usage:" "$("$DIR/publish.sh" 2>&1)"
expect "publish.sh rejects a bad slug before any Vercel call" "slug must be lowercase" "$("$DIR/publish.sh" "$T/a.html" --project 'Bad Slug' 2>&1)"
expect "unpublish.sh usage" "usage:" "$("$DIR/unpublish.sh" 2>&1)"
# the Vercel layer, against a fake CLI on PATH: a hint line is not a login (doctor said "logged in
# as <claude-code-hint …>" on 2026-09-28 while whoami said "Logged out"); a hanging call dies on
# the clock; the payload's own vercel.json is merged, not overwritten; redirects are judged by
# where they land; only <slug>.vercel.app is the link to send
mkdir -p "$T/vc"; cat > "$T/vc/vercel" <<'FAKE'
#!/bin/bash
[ -n "$FAKE_HANG" ] && { sleep 30; exit 0; }
case "$1" in whoami) echo "Vercel CLI 48.0.0"; printf '%s\n' "$FAKE_WHO"; exit "${FAKE_WHO_RC:-0}" ;; *) echo "fake vercel: $*" ;; esac
FAKE
chmod +x "$T/vc/vercel"
expect "vercel auth: a hint line is not an account" "not logged in" "$(PATH="$T/vc:$PATH" FAKE_WHO='<claude-code-hint: run /doctor>' bash -c ". '$DIR/_vercel.sh'; vc_require_auth" 2>&1)"
expect "vercel auth: an account is" "anna-m" "$(PATH="$T/vc:$PATH" FAKE_WHO='anna-m' bash -c ". '$DIR/_vercel.sh'; vc_require_auth" 2>&1)"
expect "vercel: a call that waits for a person dies on the clock" "rc=142" "$(PATH="$T/vc:$PATH" FAKE_HANG=1 VC_TIMEOUT=1 bash -c ". '$DIR/_vercel.sh'; vc teams list; echo rc=\$?" 2>&1 | tail -1)"
expect "vercel judge: the prototype's own redirect is routing, not a wall" "reachable without a login" "$(bash -c ". '$DIR/_vercel.sh'; vc_judge https://p.vercel.app 200 https://p.vercel.app/s1" 2>&1)"
expect "vercel judge: a hop to another host is the wall" "another host answered" "$(bash -c ". '$DIR/_vercel.sh'; vc_judge https://p.vercel.app 200 https://vercel.com/login" 2>&1)"
mkdir -p "$T/spa"; echo '<html></html>' > "$T/spa/index.html"
printf '%s' '{"cleanUrls":true,"redirects":[{"source":"/","destination":"/s1"}]}' > "$T/spa/vercel.json"
PUB=$(PATH="$T/vc:$PATH" FAKE_WHO='anna-m' "$DIR/publish.sh" "$T/spa" --project reg-check --spa --dry 2>&1)
expect "publish.sh --spa: the payload's redirects survive next to the rewrite and our headers" "SPA, every path → index.html + the payload's own redirects" "$PUB"
expect "publish.sh --spa: cleanUrls is dropped, with the reason" "cleanUrls dropped" "$PUB"
expect "publish.sh --dry shows the vercel.json that would go up" '"destination": "/index.html"' "$PUB"
expect "publish.sh: only <slug>.vercel.app is the link to send" "1 1" "$(grep -c 'grep -qx "https://\$PROJ.vercel.app"' "$DIR/publish.sh") $(grep -c 'Do NOT send a team alias' "$DIR/publish.sh")"
PORT=8797; (ROOT="$T" PORT=$PORT node "$DIR/serve.cjs" >/dev/null 2>&1 & echo $! > "$T/pid"); sleep 0.7
HDR=$(curl -s -D - -o /dev/null --max-time 5 "http://localhost:$PORT/" 2>&1); kill "$(cat "$T/pid")" 2>/dev/null
# SPA=1: a route is the entry page, a missing asset is still a 404 (2026-09-28: a History-API
# prototype 404ed on every deep link, and the designer wrote her own server)
PORT=8798; (ROOT="$T" PORT=$PORT SPA=1 ENTRY=a.html node "$DIR/serve.cjs" >/dev/null 2>&1 & echo $! > "$T/pid2"); sleep 0.7
expect "serve.cjs SPA=1: a route serves the entry" "200 text/html" "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' -H 'Accept: text/html' http://localhost:$PORT/s1/registry 2>&1)"
expect "serve.cjs SPA=1: a missing asset is still a 404" "404" "$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: text/html' http://localhost:$PORT/missing.png 2>&1)"
kill "$(cat "$T/pid2")" 2>/dev/null
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
  expect "zonediff.sh --zones, the spelling statecheck.sh uses" "box 100.00%" "$("$DIR/zonediff.sh" "$A" "$B" --zones '[["box",20,20,40,40]]' 2>&1)"
  expect "zonediff.sh: a malformed zone is one line, not a stack trace" 'bad zones — a zone is ["name",x,y,w,h], got ["box",20,20,40]' "$("$DIR/zonediff.sh" "$A" "$B" '[["box",20,20,40]]' 2>&1)"
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
  pick(/\.c-card-yellow\{--c-card-bd:(#\w+)/), pick(/\.c-card-yellow > \.c-card-h\{background:(#\w+)/),
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
  "<div style=\"height:200px\"><span style=\"word-spacing:250px\">a b c</span></div>","<div style=\"height:120px\">card</div>");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui}${r.css}</style></head><body>${r.html}</body></html>`);
' "$ROOT/assets/templates/fluid-page.js" "$T/fluid.html"
  FL=$("$DIR/fluidcheck.sh" "$T/fluid.html" 1920 1100 960 2>&1 | tr -s ' ')
  # 1920: the frame's own widths. 1100: the primary column has given up 48 and the aside
  # has not moved. 960: the floor holds at 512, the page admits it scrolls sideways, and the label
  # ("a b c" with 250px between words) that fit in one line at 592 takes two — "wrapped", which "clipped" never sees
  expect "fluid-page.js: the primary column shrinks to its floor, the aside never does, and under the floor the page scrolls; fluidcheck names the label that wrapped" "1920 : scroll 1920/1920 ok | main 640 · aside 380 | clipped none | wrapped reference 1100 : scroll 1100/1100 ok | main 592 · aside 380 | clipped none | wrapped none 960 : scroll 988/960 SIDEWAYS | main 512 · aside 380 | wrapped 1: a b c 1>2" "$(echo "$FL" | tr '\n' ' ' | tr -s ' ' | sed 's/ | clipped [0-9][^|]*/ /' | sed 's/^ //;s/ $//')"
  # --api prints one header block per exported component, and every component has one
  NAPI=$(node -e 'const C=require(process.argv[1]);console.log(Object.keys(C).filter(k=>k!=="css"&&k!=="script").length)' "$ROOT/assets/components/controls.js")
  expect "controls.js --api: a header comment for every exported component" "$NAPI 0" \
    "$(node "$ROOT/assets/components/controls.js" --api | grep -c '^// [a-zA-Z]*(') $(node "$ROOT/assets/components/controls.js" --api | grep -c 'no header comment')"
  # fit-height.js: the block scales by (host − reserve) / height from its top centre, capped at 1
  node -e '
const {css,script}=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%}${css}.fh-host{height:100%}.fh{position:absolute;left:50%;top:24px;margin-left:-100px;width:200px;height:720px;background:#00f}</style></head><body><div class="fh-host"><div class="fh" data-fh-h="720" data-fh-reserve="108"></div></div><script>${script}</script></body></html>`);
' "$ROOT/assets/templates/fit-height.js" "$T/fh.html"
  FHP='var e=document.querySelector(".fh"),r=e.getBoundingClientRect();return getComputedStyle(e).getPropertyValue("--fh-s").trim()+" "+Math.round(r.top)+" "+Math.round(r.left+r.width/2)+" "+Math.round(r.height)'
  expect "fit-height.js: 1 at 900 high, 0.8222 at 700, top edge and centre fixed, bottom gives way" "1.0000 24 500 720 | 0.8222 24 500 592" \
    "$("$DIR/statecheck.sh" "$T/fh.html" --size 1000x900 --probe "$FHP" 2>&1 | sed -n 's/^probe : //p' | tr -d '"') | $("$DIR/statecheck.sh" "$T/fh.html" --size 1000x700 --probe "$FHP" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
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
  # 0.10%, not 0.00%: the baseline PNG is recorded by one Chrome and re-rendered by whichever Chrome
  # the colleague has, and text antialiasing differs between versions — Chrome 153 against an earlier
  # baseline scores 0.03% as scattered single pixels along glyph edges, nothing changed; an exact match
  # made this hook red on every machine but the author's (v3.205.0). A real regression is far above the
  # floor. Between 0.00 and 0.10, open "$T/fx/diff.png": dots on text is antialiasing, a solid shape is not
  FXP=$(printf '%s' "$FXD" | grep -oE '[0-9]+\.[0-9]+%' | head -1 | tr -d '%'); [ -n "$FXP" ] || FXP=99
  awk -v p="$FXP" 'BEGIN{exit !(p<=0.10)}' \
    && pass "the whole-page fixture renders as recorded (assets/components/reference/): $FXP% ≤ 0.10" \
    || fail "the whole-page fixture drifted: $FXP% > 0.10 — look at the diff map before re-recording"
  # the card's frame is a pixel, not a rule: two prototypes shipped with the grey header open on three
  # sides because the header's background painted over the card's inset shadow, and every CSS check
  # passed. Probe the frame at the header's top and left edge, the yellow frame on the outer card, and
  # the grey one on the card nested inside it
  node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;font-size:14px;line-height:24px}${C.css}</style></head><body>`+
  `<div style="position:absolute;left:0;top:0;width:300px">${C.card({size:"large",title:"Grey",body:"x"})}</div>`+
  `<div style="position:absolute;left:0;top:200px;width:300px">${C.card({size:"large",color:"yellow",title:"Yellow",body:C.card({size:"large",title:"Nested",body:"y"})})}</div></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/cardfx.html"
  node "$DIR/shoot.js" "$T/cardfx.html" "$T/cardfx" 400 500 >/dev/null 2>&1
  # textarea() is the input's box around a <textarea> with the story's numbers (dscheck watches them);
  # selectInline() is the value on the bare page, and it shares the select's menu script
  node -e '
const C=require(process.argv[1]),fs=require("fs");
const ico="<svg viewBox=\"0 0 16 16\" style=\"display:block;width:16px;height:16px\"><circle cx=\"8\" cy=\"8\" r=\"7\" fill=\"#1e2939\"/></svg>";
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;font-size:14px;line-height:24px}${C.css}</style></head><body>`+
  `<div style="position:absolute;left:0;top:0;width:400px">${C.textarea({size:"medium",title:"Description",value:"Two\nlines"})}</div>`+
  `<div style="position:absolute;left:0;top:200px">${C.selectInline({value:"English",icon:ico,items:[{label:"English",selected:true},{label:"French"}]})}</div>`+
  `<script>${C.script}</script></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/ta.html"
  cat > "$T/ta-probe.js" <<'PROBE'
var g=function(s,f){var e=document.querySelector(s);if(!e)return s+":missing";var c=getComputedStyle(e);return f(e,c,e.getBoundingClientRect());};
var out=[
 g(".c-input-tabox",function(e,c,r){return Math.round(r.height)+" "+c.padding+" "+c.borderRadius;}),
 g(".c-input-ta",function(e,c,r){return e.rows+" "+Math.round(r.height)+" "+c.fontSize+"/"+c.lineHeight+" "+c.color+" "+c.resize+" "+c.paddingRight+" "+c.marginRight;}),
 g(".c-seli .c-input-box",function(e,c,r){return Math.round(r.height)+" "+c.padding+" "+c.columnGap+" "+c.backgroundColor+" "+c.boxShadow+" "+c.cursor;}),
 g(".c-seli .c-input-text",function(e,c,r){return Math.round(r.height)+" "+c.fontSize+"/"+c.lineHeight+" "+c.color;})
];
document.querySelector(".c-seli .c-input-box").click();
out.push(document.querySelector(".c-seli").classList.contains("c-sel-open")?"open":"closed");
var m=document.querySelector(".c-seli .c-menu").getBoundingClientRect(), t=document.querySelector(".c-seli .c-input-box").getBoundingClientRect();
out.push("menu +"+Math.round(m.top-t.bottom));
document.querySelectorAll(".c-seli .c-opt")[1].click();
out.push(document.querySelector(".c-seli .c-input-text").textContent+" "+(document.querySelector(".c-seli").classList.contains("c-sel-open")?"open":"closed"));
return out.join(" | ");
PROBE
  expect "controls.js textarea: the story's box and control; selectInline: bare trigger, menu 4px under, picks and closes" \
    "56 4px 12px 8px | 2 48 14px/24px rgb(30, 41, 57) both 8px -8px | 32 4px 0px 8px rgba(0, 0, 0, 0) none pointer | 24 14px/24px rgb(30, 41, 57) | open | menu +4 | French closed" \
    "$("$DIR/statecheck.sh" "$T/ta.html" --size 600x400 --probe "$(cat "$T/ta-probe.js")" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  # two copies of one icon, the first hidden: without per-copy ids the visible one paints nothing —
  # a gradient is looked up by id document-wide and finds the display:none copy first (2026-09-24)
  node -e '
const {uniq}=require(process.argv[1]),fs=require("fs");
const s=fs.readFileSync(process.argv[2],"utf8").replace(/<\?xml[^>]*>/,"").replace(/<svg([^>]*)>/,(m,at)=>`<svg ${(at.match(/viewBox="[^"]*"/)||[""])[0]} xmlns="http://www.w3.org/2000/svg" style="display:block;width:48px;height:48px">`);
fs.writeFileSync(process.argv[3],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff}</style></head><body><div style="display:none">${uniq(s)}</div><div style="position:absolute;left:0;top:0">${uniq(s)}</div></body></html>`);
const a=uniq(s),b=uniq(s),ids=x=>[...x.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
console.log(ids(a).some(i=>ids(b).includes(i))?"shared":"distinct", [...a.matchAll(/url\(#([^)]+)\)/g)].map(m=>m[1]).every(u=>ids(a).includes(u))?"resolved":"dangling");
' "$DIR/_svg.cjs" "$ROOT/assets/shell/dashboard/icons/header-ai-sparkle.svg" "$T/dup.html" > "$T/dup.txt"
  node "$DIR/shoot.js" "$T/dup.html" "$T/dup" 100 100 >/dev/null 2>&1
  expect "_svg.cjs: two copies of a gradient icon get distinct, resolved ids, and the visible one paints behind a hidden one" \
    "distinct resolved 24,24=#8b7bee" "$(cat "$T/dup.txt") $("$DIR/pixprobe.sh" "$T/dup/view_100.png" '[[24,24]]' 2>&1 | sed 's/=rgb([^)]*)//g')"
  # page assembly never uses a string replacement: String.prototype.replace reads $$ $& $1 inside it,
  # and injected css/js with a $ is rewritten silently (a counter died this way on 2026-09-24)
  expect "no page generator passes a template literal to replace() — function replacers only" "" \
    "$(grep -nE '\.replace\([^,]+, *`' "$ROOT"/assets/templates/*.js "$ROOT/assets/fixture.js" "$DIR/shell.js" 2>/dev/null)"
  expect "controls.js card: the frame is drawn over the header, in the card's own colour, and a nested card stays grey" \
    "150,0=#d1d5dc | 0,28=#d1d5dc | 1,28=#f3f4f6 | 150,200=#fad24a | 150,272=#d1d5dc | 0,300=#fad24a | 20,300=#d1d5dc" \
    "$("$DIR/pixprobe.sh" "$T/cardfx/view_400.png" '[[150,0],[0,28],[1,28],[150,200],[150,272],[0,300],[20,300]]' 2>&1 | sed 's/=rgb([^)]*)//g')"

  expect "list-table.js renders a spec: header, one row, flex column css" "true true 1" "$(node -e '
const {render}=require(process.argv[1]);const r=render({columns:[{key:"chk",label:"__checkbox__",width:40},{key:"a",label:"A",width:100},{key:"b",label:"B",flex:1,min:200}],rows:[{a:"x",b:"y"}],footer:{show:"10",found:"1",page:{of:"3"}}},(n,w,h)=>"<svg></svg>");
console.log(r.html.includes("lt-thead"), r.css.includes(".lt .c-b{flex:1 0 0;min-width:200px}"), r.html.split("lt-tr").length-1)' "$ROOT/assets/templates/list-table.js" 2>&1)"
  # controls.js calendar(): the Storybook geometry to the pixel, six top-aligned rows, and the picks working
  node -e '
const C=require(process.argv[1]),fs=require("fs");
const r=C.calendar({mode:"range",month:"2026-10",today:"2026-10-05",presets:["Today","Last 3 days"],id:"rc"}),s=C.calendar({month:"2026-10",today:"2026-10-05",id:"sc"});
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}${C.css}</style></head><body><div style="position:absolute;left:16px;top:16px">${r}</div><div style="position:absolute;left:16px;top:400px">${s}</div><script>${C.script}<\/script></body></html>`)' "$ROOT/assets/components/controls.js" "$T/cal.html"
  expect "controls.js calendar: the stories' geometry, six top-aligned rows" "705x338 252x240 36x36 286x351 6" \
    "$("$DIR/statecheck.sh" "$T/cal.html" --size 900x800 --probe 'var b=s=>{var r=document.querySelector(s).getBoundingClientRect();return Math.round(r.width)+"x"+Math.round(r.height)};return [b("#rc"),b("#rc .c-cal-t"),b("#rc .c-cal-b"),b("#sc"),document.querySelectorAll("#rc .c-cal-mo tbody")[0].rows.length].join(" ")' 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
  printf '%s' '{"page":"cal.html","size":"900x800","rows":[{"case":"range","do":"R.click(\"#rc [data-d=\\\"2026-10-23\\\"]\");R.click(\"#rc [data-d=\\\"2026-10-14\\\"]\")","read":"document.getElementById(\"rc\").dataset.start+\" \"+document.getElementById(\"rc\").dataset.end+\" \"+document.querySelectorAll(\"#rc .c-cal-hl\").length","want":"2026-10-14 2026-10-23 10"},{"case":"preset","do":"R.click(\"#rc [data-preset=\\\"Last 3 days\\\"]\")","read":"document.getElementById(\"rc\").dataset.start","want":"2026-10-03"},{"case":"single","do":"R.click(\"#sc [data-today-btn]\")","read":"document.getElementById(\"sc\").dataset.value","want":"2026-10-05"}]}' > "$T/cal-rules.json"
  expect "controls.js calendar: a range picked in either order, a preset, Today" "rules : 3 rows · 3 pass" "$(node "$DIR/rulecheck.cjs" "$T/cal-rules.json" 2>&1)"

# list-table.js is the product's SnsTable: header #f3f4f6 rounded 8, the divider above a hover fill, the
  # last row without one, expanding rows 56 in, the toolbar and the checkbox from controls.js — the template
  # drew its own with radius 4 and #c4cad4 until a 2026-10-02 run found it stale
  cat > "$T/ltgen.js" <<'JS'
const fs=require('fs'),cp=require('child_process');const [SKILL,OUT]=process.argv.slice(2);
const cfg=JSON.parse(fs.readFileSync(SKILL+'/assets/shell/dashboard/examples/figma-master.json'));cfg.canvas={width:1440,height:900};cfg.scroll=true;
fs.writeFileSync(OUT+'.json',JSON.stringify(cfg));cp.execFileSync('node',[SKILL+'/scripts/shell.js',OUT+'.json','--out',OUT]);
const svg=()=>'<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 8h12" stroke="currentColor"/></svg>';
const {render}=require(SKILL+'/assets/templates/list-table.js');
const rows=[0,1,2,3].map(i=>({d:'Device '+i,r:'High',expanded:i<2?'<div style="height:40px">details</div>':undefined,open:i===0}));
const {css,html,script}=render({columns:[{key:'k',label:'__checkbox__',width:56},{key:'d',label:'Device',flex:1,min:200},{key:'r',label:'Risk',width:160}],
 toolbar:{search:{placeholder:'Search'},right:[{label:'Export',primary:true}]},rows,footer:{found:'4',page:{of:'1'}}},svg);
let p=fs.readFileSync(OUT,'utf8');p=p.replace('</style></head>',()=>css+'</style></head>').replace(/(<div id="content-slot"[^>]*>)<\/div>/,(m,o)=>o+html+'</div>').replace('</body>',()=>'<script>'+script+'<\/script></body>');
fs.writeFileSync(OUT,p);
JS
  node "$T/ltgen.js" "$ROOT" "$T/lt.html" 2>&1
  expect "list-table.js: SnsTable header, controls.js toolbar and checkbox, a row opens on a click" '["rgb(243, 244, 246)","8px",1,1,5,true,true,"56px","76px"]' \
    "$("$DIR/statecheck.sh" "$T/lt.html" --size 1440x900 --probe 'var h=getComputedStyle(document.querySelector(".lt-thead")),r=document.querySelectorAll(".lt-tr");r[1].click();return [h.backgroundColor,h.borderTopLeftRadius,document.querySelectorAll(".lt .c-sb").length,document.querySelectorAll(".lt-tb .c-btn").length,document.querySelectorAll(".lt .c-cb").length,r[0].classList.contains("lt-open"),r[1].classList.contains("lt-open"),getComputedStyle(r[0].querySelector(".lt-x")).marginLeft,getComputedStyle(document.querySelector(".lt-tfoot")).height]' 2>&1 | sed -n 's/^probe : //p')"
  expect "list-table.js: the divider survives a hovered row, and the last row has none" "3 elements · 3 unbroken" \
    "$("$DIR/statecheck.sh" "$T/lt.html" --size 1440x900 --css '.lt-tr .lt-cells{background:#f9fafb}' --frames '.lt-tr:not(.lt-last)|bottom' 2>&1)"
  expect "list-table.js carries none of the old toolbar values" "0" "$(grep -v '^ *//' "$ROOT/assets/templates/list-table.js" | grep -c '#c4cad4\|border-radius:4px')"
  expect "shellgate.sh: landmarks within 1px on the master example" "match the frame within 1px" "$G"
  expect "shellgate.sh: compares the header when the frame has the current one" "header compared" "$G"
  expect "shellgate.sh: a match asks nothing" "0" "$(echo "$G" | grep -c '^ASK')"
  # a non-uniform miss or a sidebar over 3% is a question, printed as one, not only a ledger line
  # (2026-10-02: 11.87% went into the ledger, the user found the menu on the published link)
  expect "shellgate.sh: a different sidebar prints ASK with the numbers" "ASK     : the frame's shell differs from the default" \
    "$("$DIR/shellgate.sh" "$ROOT/assets/shell/dashboard/examples/figma-master.json" "$ROOT/assets/shell/dashboard/reference/sidebar-demo-1440x1080.png" --out "$T/gate2" 2>&1)"
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
# the plugin's command popup shows it beside the name: Kostya's skills fit in 3–4 lines (~270 chars), and
# a 996-char description filled the screen (2026-10-06)
[ "$DLEN" -le 400 ] && pass "description fits the command popup ($DLEN ≤ 400 chars)" || fail "description is $DLEN chars; the popup wants 3–4 lines, at most 400"

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

# the shell embeds Geist Mono too, the product's mono family: without it every mono text (document
# numbers, ids, code) fell back to the system's face — the worst zone of the 2026-10-02 run, 6%
node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-master.json" --out "$T/mono.html" >/dev/null 2>&1
sed -i.bak 's|</body>|<code style="font-family:\x27Geist Mono\x27">RU 4510</code></body>|' "$T/mono.html"
expect "shell.js embeds Geist Mono, and the page loads it" "[true,\"loaded\"]" \
  "$("$DIR/statecheck.sh" "$T/mono.html" --size 800x600 --probe 'return [document.fonts.check("14px \"Geist Mono\""), [...document.fonts].filter(function(f){return f.family.indexOf("Mono")>=0}).map(function(f){return f.status}).join()]' 2>&1 | sed -n 's/^probe : //p')"
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
# a probe that does not parse is an error with a reason and exit 3, not an empty `probe :` line:
# a $('id') inside double quotes, expanded by the shell, printed nothing for a session (2026-10-02)
printf '%s' 'return "x" +' > "$T/sc-bad.js"
SCB=$("$DIR/statecheck.sh" "$T/sc.html" --size 200x100 --probe-file "$T/sc-bad.js" 2>&1; echo "exit $?")
expect "statecheck: a probe that does not parse says so and fails" "does not parse" "$SCB"
expect "statecheck: … with exit 3" "exit 3" "$SCB"
expect "statecheck: an error in --js alone is reported" 'js    : "ERROR: nope is not defined"' \
  "$("$DIR/statecheck.sh" "$T/sc.html" --size 200x100 --js 'nope()' 2>&1)"
expect "statecheck: an empty --probe is refused" "--probe is empty" "$("$DIR/statecheck.sh" "$T/sc.html" --probe '' 2>&1)"
printf '%s' 'return document.getElementById(`a`).textContent' > "$T/sc-ok.js"
expect "statecheck --probe-file reads the probe from a file" 'probe : "x"' "$("$DIR/statecheck.sh" "$T/sc.html" --size 200x100 --probe-file "$T/sc-ok.js" 2>&1)"
# --hits asks elementFromPoint, as a real click does: an empty full-width wrapper over a button is
# BLOCKED and exit 3, though a probe's click() on that button still fires (2026-10-02)
printf '%s' '<!doctype html><html><head><title>h</title></head><body style="margin:0"><button id=r style="position:absolute;left:300px;top:10px">Report</button><div id=w style="position:fixed;left:0;right:0;top:0;height:60px"></div><button id=ok style="position:absolute;left:10px;top:100px">Fine</button><div id=m hidden><div style="position:fixed;inset:0;background:#0003"></div><button id=s style="position:fixed;left:200px;top:200px">Send</button></div></body></html>' > "$T/hits.html"
HB=$("$DIR/statecheck.sh" "$T/hits.html" --size 600x300 --hits auto 2>&1; echo "exit $?")
expect "statecheck --hits: a button under an empty wrapper is BLOCKED" 'BLOCKED by div#w: 1 — button#r "Report"' "$HB"
expect "statecheck --hits: … the other is reachable, the hidden one is not counted as covered" "3 controls · 1 reachable · 1 BLOCKED · 0 under another clickable layer · 0 not on screen · 1 disabled" "$HB"
expect "statecheck --hits: … with exit 3" "exit 3" "$HB"
expect "statecheck --hits scoped to an open modal passes" "1 controls · 1 reachable · 0 BLOCKED" \
  "$("$DIR/statecheck.sh" "$T/hits.html" --size 600x300 --js 'document.getElementById("m").hidden=false' --hits '#m' 2>&1)"
expect "statecheck --hits: a scope that matches nothing is an error" "exit 3" "$("$DIR/statecheck.sh" "$T/hits.html" --size 600x300 --hits '#nope' >/dev/null 2>&1; echo "exit $?")"
# --texts: every string of a zone's design context is on the page, scoped to the zone, with case,
# whitespace and quote marks folded; figctx.py --texts makes the list from the context
printf '%s' '<div data-name="Modal"><p className="text-[14px]">First name</p><p>{`"Ivanov"`}</p><p>Иван&nbsp;Иванов</p></div>' > "$T/tx.jsx"
expect "figctx.py --texts: one string per line, JSX strings and entities decoded" '"First name" "\"Ivanov\"" "Иван Иванов"' \
  "$(python3 "$DIR/figctx.py" "$T/tx.jsx" --texts | while read -r l; do printf '"%s" ' "$(printf '%s' "$l" | sed 's/"/\\"/g')"; done)"
python3 "$DIR/figctx.py" "$T/tx.jsx" --texts > "$T/tx.txt"
printf '%s' '<!doctype html><html><head><title>t</title></head><body><div id=page><label>First name</label><div style="text-transform:uppercase">“ivanov”</div><div>Иван Иванов</div></div><div id=modal><label>First name</label><div>“Ivanov”</div></div></body></html>' > "$T/tx.html"
expect "statecheck --texts: the page shows every string, quotes and case folded" "3 expected · 3 found · 0 MISSING" "$("$DIR/statecheck.sh" "$T/tx.html" --size 600x200 --texts "$T/tx.txt" 2>&1)"
TXM=$("$DIR/statecheck.sh" "$T/tx.html" --size 600x200 --texts "$T/tx.txt" --texts-in '#modal' 2>&1; echo "exit $?")
expect "statecheck --texts-in: a string the modal lacks is MISSING though the page under it has it" 'MISSING "Иван Иванов"' "$TXM"
expect "statecheck --texts-in: … and the call fails" "exit 3" "$TXM"

# rulecheck.cjs: a rule table is checked row by row in fresh processes; a click goes where a person's
# would, so a covered button fails its row with the reason; options are picked by their text, also
# in the library's select
cat > "$T/rc.html" <<'HTML'
<!doctype html><html><head><title>rc</title></head><body style="margin:0">
<input id="f" value="Ivanov" style="position:absolute;left:20px;top:20px"><div id="t" style="position:absolute;left:20px;top:60px">-</div>
<button id="send" style="position:absolute;left:300px;top:20px">Send</button><div style="position:fixed;left:250px;right:0;top:0;height:60px"></div>
<select id="r" style="position:absolute;left:20px;top:100px"><option>Auto</option><option>Other</option></select>
<script>var f=document.getElementById("f"),t=document.getElementById("t");
f.addEventListener("input",function(){t.textContent=f.value===""?"Missing":f.value.length===7?"Typo":"Wrong value"});
document.getElementById("r").addEventListener("change",function(e){t.textContent=e.target.value});
document.getElementById("send").addEventListener("click",function(){t.textContent="Sent"});</script></body></html>
HTML
cat > "$T/rc.json" <<'JSON'
{"page": "rc.html", "size": "800x300", "rows": [
 {"case": "one letter", "input": "Ivanov → Ivanova", "do": "R.type('#f','Ivanova')", "read": "R.text('#t')", "want": "Typo"},
 {"case": "cleared", "do": "R.type('#f','')", "read": "R.text('#t')", "want": "Missing"},
 {"case": "reason", "do": "R.pick('#r','Other')", "read": "R.text('#t')", "want": "Other"},
 {"case": "send", "do": "R.click('#send')", "read": "R.text('#t')", "want": "Sent"}]}
JSON
RC=$(node "$DIR/rulecheck.cjs" "$T/rc.json" 2>&1; echo "exit $?")
expect "rulecheck.cjs: rows pass by the rule" "ok    one letter" "$RC"
expect "rulecheck.cjs: a covered button fails its row and names the cover" "FAIL  send — want \"Sent\", got \"ERROR: click on #send lands on div, which covers it\"" "$RC"
expect "rulecheck.cjs: … 3 pass, 1 fails, exit 3" "rules : 4 rows · 3 pass · 1 FAIL
exit 3" "$RC"
expect "rulecheck.cjs --markdown: the handoff's table, the words before the code" "| one letter | Ivanov → Ivanova | Typo | pass |" "$(node "$DIR/rulecheck.cjs" "$T/rc.json" --markdown 2>&1)"
printf '%s' '{"page":"menu.html","size":"700x600","rows":[{"case":"pick b","do":"R.pick(\".c-sel\",\"b\")","read":"R.text(\".c-sel .c-input-text\")","want":"b"}]}' > "$T/rc-menu.json"
[ -f "$T/menu.html" ] && expect "rulecheck.cjs: R.pick in the library's select, an option with a caption" "rules : 1 rows · 1 pass" "$(node "$DIR/rulecheck.cjs" "$T/rc-menu.json" 2>&1)"   # menu.html: the headless level

# weight.cjs: every inlined image by weight, the photo-like PNG and the duplicate named, the page
# against the limit (2026-10-02: 8.9 and 11.7 MB against an estimate of 2–3, and nobody knew why)
node -e '
const {encode}=require(process.argv[1]),fs=require("fs");
const W=320,H=240,d=new Uint8Array(W*H*4);let s=7;const r=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;
for(let i=0;i<W*H;i++){d[i*4]=r()*255;d[i*4+1]=r()*255;d[i*4+2]=r()*255;d[i*4+3]=255}
const p=encode(W,H,d).toString("base64"),u=encode(40,10,new Uint8Array(1600).fill(255)).toString("base64");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><title>w</title></head><body><img id="front" src="data:image/png;base64,${p}" width="160"><img id="back" src="data:image/png;base64,${p}" width="160"><img id="tip" src="data:image/png;base64,${u}" width="40"></body></html>`);
' "$DIR/_png.cjs" "$T/heavy.html"
# encode.sh: a photo plate to WebP through Chrome, same pixel size, a fraction of the bytes
node -e 'const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");fs.writeFileSync(process.argv[2],Buffer.from(h.match(/base64,([^"]+)/)[1],"base64"))' "$T/heavy.html" "$T/photo.png"
EN=$("$DIR/encode.sh" "$T/photo.png" "$T/photo.webp" 2>&1)
expect "encode.sh: a photo plate becomes WebP" "encode: $T/photo.webp" "$EN"
expect "encode.sh: … the same pixel size, smaller" "320×240" "$(node "$DIR/weight.cjs" <(printf '<img src="data:image/webp;base64,%s">' "$(base64 < "$T/photo.webp" | tr -d '\n')") 2>&1)"
expect "encode.sh --width: a raw image cut to 2x of where it is shown" "160×120" "$("$DIR/encode.sh" "$T/photo.png" "$T/photo-w.webp" --width 160 >/dev/null 2>&1; node "$DIR/weight.cjs" <(printf '<img src="data:image/webp;base64,%s">' "$(base64 < "$T/photo-w.webp" | tr -d '\n')") 2>&1)"
printf '<img id="raw" src="data:image/png;base64,%s" width="80">' "$(base64 < "$T/photo.png" | tr -d '\n')" > "$T/raw.html"
expect "weight.cjs: a plate over 2x is named, with the width to cut it to" "over 2x: 320px wide, shown at 80 — encode.sh --width 160" "$(node "$DIR/weight.cjs" "$T/raw.html" 2>&1)"
expect "encode.sh: refuses an output it cannot write" "the output is .webp or .jpg" "$("$DIR/encode.sh" "$T/photo.png" "$T/photo.gif" 2>&1)"
WG=$(node "$DIR/weight.cjs" "$T/heavy.html" --limit 0.2 2>&1; echo "exit $?")
expect "weight.cjs: a photo-like PNG is named, with the way out" "<img#front>  ! photo-like" "$WG"
expect "weight.cjs: the same bytes inlined twice are a duplicate, with what they cost" "duplicates cost" "$WG"
expect "weight.cjs: a plate shown at its own width is not 2x" "<img#tip>  ! not 2x: 40px wide, shown at 40" "$WG"
expect "weight.cjs: over the limit says so and exits 1" "OVER THE LIMIT" "$WG"
expect "weight.cjs: … exit 1" "exit 1" "$WG"

# test-scaffold.js: the outcome card's button tries to close the tab and, when the tab is still
# there, becomes the instruction; a target=_blank is disarmed at load; it all reads as not-the-product
node -e '
const T=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><title>t</title><style>body{margin:0}${T.css}</style></head><body>`+
T.testBar({step:2,total:3,task:"Approve the check.",links:[{label:"Companies House",href:"/registry/ch"}]})+
`<a id="ext" href="/registry/cy" target="_blank">registry</a>`+T.outcome({step:2,total:3,platform:"Wynde",lines:["Decision: approved"],id:"done"})+`<script>${T.script}<\/script></body></html>`);
' "$ROOT/assets/templates/test-scaffold.js" "$T/ts.html"
TS=$("$DIR/statecheck.sh" "$T/ts.html" --size 900x500 --js 'tsOutcome("done"); document.querySelector(".ts-back").click();' --probe 'return new Promise(function(r){setTimeout(function(){var c=document.getElementById("done");r([document.getElementById("ext").getAttribute("target"), c.hidden, c.classList.contains("ts-manual"), getComputedStyle(c.querySelector(".ts-how")).display, window.__events.map(function(e){return e.k}).join(","), getComputedStyle(document.querySelector(".ts-bar")).fontFamily.indexOf("Geist")])},600)})' 2>&1 | sed -n 's/^probe : //p')
expect "test-scaffold: a new-tab link is disarmed, the outcome shows, the close attempt falls back to the instruction" '[null,false,true,"block","blank-link-disarmed,outcome,back-to-platform,close-refused",-1]' "$TS"
expect "test-scaffold: the instruction is words, both platforms, what to answer; never 'leave this tab open'" "1 1 0" "$(grep -c 'Control</kbd> + <kbd>Shift</kbd> + <kbd>Tab' "$T/ts.html") $(grep -c 'Yes, I did' "$T/ts.html") $(grep -ci 'leave this tab open\|⌘\|⌥' "$T/ts.html")"
expect "statecheck: a probe that returns a Promise is awaited" '"later"' "$("$DIR/statecheck.sh" "$T/sc.html" --size 200x100 --probe 'return new Promise(function(r){setTimeout(function(){r("later")},300)})' 2>&1 | sed -n 's/^probe : //p')"

# modal() with a footer is the scroll-footer variant: capped at the canvas − 80, the body scrolls,
# the footer stays in view (2026-09-28: the primary action fell below the fold of a 756px window)
node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}#app{position:relative;width:900px;height:500px;overflow:hidden}${C.css}</style></head><body><div id="app">`+
C.modal({hidden:false,size:"medium",title:"Results",body:"<div style=\"height:900px\">long</div>",footer:C.button({label:"Cancel",type:"secondary"})+C.button({label:"Approve",type:"primary"})})+`</div></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/modf.html"
expect "controls.js modal with a footer: capped, body scrolls, footer in view" "420 true 24 true" \
  "$("$DIR/statecheck.sh" "$T/modf.html" --size 900x500 --probe 'var m=document.querySelector(".c-mod"),b=m.querySelector(".c-mod-b"),f=m.querySelector(".c-mod-f"),fb=f.getBoundingClientRect();return [Math.round(m.getBoundingClientRect().height), b.scrollHeight>b.clientHeight, parseInt(getComputedStyle(f).paddingTop), fb.bottom<=500].join(" ")' 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"

# figctx.py: an asset referenced but never defined is the truncated response's list of leaf calls;
# a downloaded SVG whose own id names another layer is an override the big response dropped (2026-09-28)
mkdir -p "$T/fx"; printf '%s' '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><g id="normal/Search"><path d="M0 0h1"/></g></svg>' > "$T/fx/search.svg"
printf '%s' '<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><g id="normal/Filled/Danger"><path d="M0 0h1"/></g></svg>' > "$T/fx/danger.svg"
PORT=8799; (ROOT="$T/fx" PORT=$PORT node "$DIR/serve.cjs" >/dev/null 2>&1 & echo $! > "$T/pid3"); sleep 0.7
printf '%s' "const imgNormalAttachment = \"http://localhost:$PORT/search.svg\"; const imgNormalFilledDanger = \"http://localhost:$PORT/danger.svg\";
<div data-name=\"Row\"><img src={imgNormalAttachment}/><img src={imgNormalFilledDanger}/><img src={imgNormalBuilding}/><img src={image}/></div>" > "$T/fx/ctx.jsx"
FX=$(python3 "$DIR/figctx.py" "$T/fx/ctx.jsx" --assets "$T/fx/out" 2>&1)
kill "$(cat "$T/pid3")" 2>/dev/null
expect "figctx.py: an asset referenced but never defined is named, a component prop is not" "UNDEFINED: 1 asset(s) referenced but never defined — the response was truncated before their constants; call get_design_context on those leaves: imgNormalBuilding" "$FX"
expect "figctx.py --assets: the SVG's own id against the constant's name" 'NAME MISMATCH imgNormalAttachment: the file draws "normal/Search"' "$FX"
expect "figctx.py --assets: … and a matching one is silent" "1" "$(echo "$FX" | grep -c 'NAME MISMATCH')"

# --frames walks the perimeter: a header painting over its card's frame is a FRAME GAP on the
# top and the sides it covers, the library's card is unbroken, and an element framed on one
# side only is checked on that side (four runs shipped the gap before anyone looked)
cat > "$T/fr.js" <<'JS'
const C=require(process.argv[2]),fs=require("fs");
fs.writeFileSync(process.argv[3],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f3f4f6}${C.css}
.old{position:absolute;left:20px;top:20px;width:300px;height:160px;background:#fff;border-radius:16px;box-shadow:inset 0 0 0 1px #d1d5dc;overflow:hidden}
.old .hd{height:48px;background:#f3f4f6}
.drawer{position:absolute;left:700px;top:0;width:280px;height:400px;background:#fff;border-left:1px solid #e5e7eb}
</style></head><body><div class="old" id="oldcard"><div class="hd"></div></div><div class="drawer" id="drawer"></div>
<div style="position:absolute;left:20px;top:220px;width:300px">${C.card({title:"Checks",body:'<div style="height:80px"></div>',color:"yellow"})}</div></body></html>`);
JS
node "$T/fr.js" "$ROOT/assets/components/controls.js" "$T/fr.html"
FR=$("$DIR/statecheck.sh" "$T/fr.html" --size 1000x500 --frames '.old,.c-card,.drawer|left' 2>&1; echo "exit $?")
expect "statecheck --frames: a header over the card's frame is a FRAME GAP, top and the sides it covers" "FRAME GAP div#oldcard.old[0] (300×160 at 20,20): top 17–283px, left 17–49px, right 17–49px" "$FR"
expect "statecheck --frames: the library's card and a left-only drawer are unbroken, the call fails on the gap" "3 elements · 2 unbroken · 1 with a FRAME GAP" "$FR"
expect "statecheck --frames: … exit 3" "exit 3" "$FR"

# a page made for a claude.ai artifact: no document tags, the canvas scrolls sideways inside its
# box while the page does not, and the hit test runs on it and agrees with the prototype's
printf '%s' '<!doctype html><html><head><meta charset=utf-8><title>w</title><style>body{margin:0;background:#f6f7f9}</style></head><body><div id=app style="position:relative;width:1440px;height:300px;background:#fff"><button style="position:absolute;left:20px;top:20px">Near</button><div style="position:fixed;left:0;right:0;top:0;height:10px"></div></div></body></html>' > "$T/wide.html"
expect "artifact-page.js: prints the size against the limit" "MB of 16" "$("$DIR/artifact-page.js" "$T/wide.html" "$T/wide-art.html" 2>&1)"
expect "artifact-page.js: no document tags, the canvas colour on the page" "0 1" "$(grep -ci '<!doctype\|<html\|<head\|<body\|<meta' "$T/wide-art.html") $(grep -c 'html,body{margin:0;padding:0;background:#f6f7f9}' "$T/wide-art.html")"
expect "artifact-page.js: the page does not scroll sideways, the canvas inside it does" "[800,800,1440]" \
  "$("$DIR/statecheck.sh" "$T/wide-art.html" --size 800x300 --probe 'return [document.documentElement.scrollWidth, innerWidth, document.getElementById("artifact-scroll").scrollWidth]' 2>&1 | sed -n 's/^probe : //p')"
expect "statecheck --hits on the artifact page: an absolute child escapes the scroll box" "1 controls · 1 reachable · 0 BLOCKED" \
  "$("$DIR/statecheck.sh" "$T/wide-art.html" --size 800x300 --hits auto 2>&1)"
# a probe sees the height that was asked for, and the kept render is still the true size: with
# --dump-dom Chrome lays the page out 87px shorter than the window (2026-09-25, _chrome.sh)
expect "statecheck: the DOM pass compensates Chrome's --dump-dom viewport" "1000x900 1000x700" \
  "$("$DIR/statecheck.sh" "$T/sc.html" --size 1000x900 --probe 'return innerWidth+"x"+innerHeight' 2>&1 | sed -n 's/^probe : //p' | tr -d '"') $("$DIR/statecheck.sh" "$T/sc.html" --size 1000x700 --probe 'return innerWidth+"x"+innerHeight' --out "$T/sc-out" 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"
expect "statecheck: the kept render is the asked-for size" "1000 x 700" "$(file "$T/sc-out/state.png" | sed 's/.*PNG image data, //;s/,.*//')"
# --full measures the box holding the content, not the tallest scrolling box: a sidebar menu
# overflows on every shell page at 900 and was being reported as the page's own height
node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-master.json" --out "$T/full.html" >/dev/null 2>&1
expect "statecheck --full measures the content box, not the sidebar" "full  : rendering 1440x" \
  "$("$DIR/statecheck.sh" "$T/full.html" --size 1440x900 --full --out "$T/fullout" 2>&1 | head -1)"

# runstats.cjs counts §5 from a transcript: the person's turn runs from the agent's last line to
# their message, Figma calls are split by call, and lines out of time order do not break it
cat > "$T/rs.jsonl" <<'JSONL'
{"type":"user","timestamp":"2026-10-02T10:00:00Z","message":{"role":"user","content":"build the OCR flow"}}
{"type":"assistant","timestamp":"2026-10-02T10:01:00Z","message":{"id":"a1","content":[{"type":"tool_use","name":"mcp__figma__get_metadata","input":{}}],"usage":{"input_tokens":10,"cache_read_input_tokens":20000,"cache_creation_input_tokens":0,"output_tokens":100}}}
{"type":"user","timestamp":"2026-10-02T10:01:05Z","message":{"role":"user","content":[{"type":"tool_result","content":"ok"}]}}
{"type":"assistant","timestamp":"2026-10-02T10:02:00Z","message":{"id":"a2","content":[{"type":"text","text":"done"}],"usage":{"input_tokens":10,"cache_read_input_tokens":50000,"cache_creation_input_tokens":0,"output_tokens":200}}}
{"type":"attachment","timestamp":"2026-10-02T10:11:59Z"}
{"type":"user","timestamp":"2026-10-02T10:12:00Z","message":{"role":"user","content":"the Send button does nothing"}}
{"type":"assistant","timestamp":"2026-10-02T10:13:00Z","message":{"id":"a3","content":[{"type":"text","text":"fixed"}],"usage":{"input_tokens":10,"cache_read_input_tokens":52000,"cache_creation_input_tokens":0,"output_tokens":50}}}
{"type":"assistant","timestamp":"2026-10-02T10:13:30Z","message":{"id":"a4","content":[{"type":"tool_use","id":"q1","name":"AskUserQuestion","input":{"questions":[{"question":"canvas?"},{"question":"shell?"}]}}]}}
{"type":"user","timestamp":"2026-10-02T10:17:30Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"q1","content":"answered"}]}}
{"type":"assistant","timestamp":"2026-10-02T10:18:00Z","message":{"id":"a5","content":[{"type":"text","text":"building"}]}}
{"type":"assistant","timestamp":"2026-10-02T09:59:00Z","message":{"id":"a0","content":[]}}
JSONL
# the skill version is the copy the SESSION used, found in the transcript, not the copy runstats lives in
# (2026-10-06: a test that ran on the plugin reported the dev commit)
mkdir -p "$T/pc/plugins/cache/m/p/9.9.9/skills/figma-to-prototype" "$T/pc/plugins/cache/m/p/9.9.9/.claude-plugin"
echo '{"version":"9.9.9"}' > "$T/pc/plugins/cache/m/p/9.9.9/.claude-plugin/plugin.json"; touch "$T/pc/plugins/cache/m/p/9.9.9/skills/figma-to-prototype/SKILL.md"
printf '%s\n' "{\"type\":\"assistant\",\"timestamp\":\"2026-10-06T10:00:00Z\",\"message\":{\"id\":\"z\",\"content\":[{\"type\":\"tool_use\",\"name\":\"Read\",\"input\":{\"file_path\":\"$T/pc/plugins/cache/m/p/9.9.9/skills/figma-to-prototype/SKILL.md\"}}]}}" > "$T/rs2.jsonl"
expect "runstats.cjs: the skill version is the copy the session read" "skill   : plugin 9.9.9 (plugin cache)" "$(node "$DIR/runstats.cjs" "$T/rs2.jsonl" 2>&1)"
mkdir -p "$T/sess/proto"; SESS="$(cd "$T/sess" && pwd -P | sed 's/[^A-Za-z0-9]/-/g')"; mkdir -p "$T/cfg/projects/$SESS" && cp "$T/rs.jsonl" "$T/cfg/projects/$SESS/s.jsonl"
expect "runstats.cjs without a path: the transcript of the session's cwd, found from a project subfolder" "rounds  : 2 messages" "$(cd "$T/sess/proto" && CLAUDE_CONFIG_DIR="$T/cfg" node "$DIR/runstats.cjs" 2>&1)"
RS=$(node "$DIR/runstats.cjs" "$T/rs.jsonl" 2>&1)
expect "runstats.cjs: wall time, and the person's turn from the agent's last line" "wall    : 19m" "$RS"
expect "runstats.cjs: … a line out of time order counts where it belongs, and a form's wait is the person's" "the person's turn 15m, the agent's 4m" "$RS"
expect "runstats.cjs: every message the person typed is a round, forms counted beside" "rounds  : 2 messages from the person · 1 forms, 2 questions, 4m of their turn" "$RS"
expect "runstats.cjs: Figma calls split by call, context peak" "figma   : 1 calls — get_metadata 1" "$RS"
expect "runstats.cjs: the context peak" "context : peak 52k" "$RS"
expect "runstats.cjs: the growth goes to the tools that caused it" "extraction 100%" "$RS"
expect "runstats.cjs: a cost line to end a delivery with" "cost    : 4m of work · 2 tool calls · 1 Figma · mostly extraction" "$RS"
expect "runstats.cjs --round: this increment only, from the person's last message" "rounds  : 1 messages" "$(node "$DIR/runstats.cjs" "$T/rs.jsonl" --round 2>&1)"

# the run log: the template exists, Step 8 requires it, and the skill offers it without sending
# it. The last one is the point — a log collected quietly reads as a record of who erred.
expect "Step 0 opens the run log, Step 8 closes it, both say where it lives" "4" "$(grep -c '_work/run-log.md' SKILL.md)"
expect "the run log is opened in Step 0, with the moments it is written at" "1 1" "$(grep -c '^### Open the run log now, not in Step 8' SKILL.md) $(grep -c 'a §6 line first, the fix after' SKILL.md)"
expect "the template: version, rounds, found by / cost, the requester's verdict, §5 from runstats" "1 1 1 1 1" "$(grep -c '^\* \*\*skill version:' assets/run-log-template.md) $(grep -c '^\*\*Rounds.\*\*' assets/run-log-template.md) $(grep -c 'found by\*\* —' assets/run-log-template.md) $(grep -c '^## 8. Did it do its job' assets/run-log-template.md) $(grep -c 'scripts/runstats.cjs' assets/run-log-template.md)"
# the closing check: a missing log is "no run log", and every ledger counts, not one by name
mkdir -p "$T/lg/_work"; touch "$T/lg/deviations.md"
expect "the Step 8 check names a missing log" "no run log" "$(cd "$T/lg" && eval "$(grep -m1 'no run log — start it' "$ROOT/SKILL.md")" 2>&1)"
touch -t 202601010000 "$T/lg/_work/run-log.md"; touch "$T/lg/deviations-2.md"
expect "the Step 8 check sees a second prototype's ledger" "run-log.md is older than deviations-2.md" "$(cd "$T/lg" && eval "$(grep -m1 'no run log — start it' "$ROOT/SKILL.md")" 2>&1)"
touch "$T/lg/_work/run-log.md"
expect "the Step 8 check is silent when the log is current" "[]" "[$(cd "$T/lg" && eval "$(grep -m1 'no run log — start it' "$ROOT/SKILL.md")" 2>&1)]"
expect "the run log is offered, never sent" "1 1" "$(grep -c 'never send it anywhere' SKILL.md) $(grep -c 'nothing about it is automatic' SKILL.md)"
expect "the template asks where the skill was wrong" "1 1" "$(grep -c '^## 6. Where the skill was wrong' assets/run-log-template.md) $(grep -c 'Read it before sending it anywhere' assets/run-log-template.md)"

# the pre-flight version check, which is what makes a colleague hear about an update when the
# only skill they use is this one. It must be the first section, must name the two update
# commands, and must skip silently when the skill is not inside a plugin.
PF=$(sed -n '/^## /{=;p;}' SKILL.md | sed -n '1,4p' | tr '\n' ' ')
# the toolchain check is the first thing Step 0 does: left to judgment it ran five times in one
# run and not once in the next, and a missing runtime then surfaces mid-build (2026-09-21)
expect "Step 0 opens with the toolchain check, offers the install, never types a password" "1 1 1" \
  "$(grep -c 'Run `"\$SKILL/scripts/doctor.sh"` first' SKILL.md) $(grep -c 'offer to run$' SKILL.md) $(grep -c 'type a password' SKILL.md)"

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

# a reference longer than 100 lines opens with ## Contents listing every ## heading in order: a
# partial read (head -100) then still sees the whole file's scope (Anthropic's skill-authoring
# guide; added 2026-10-04 when none of the twelve long references had one)
python3 - <<'PY' && pass "every long reference opens with its contents, in order" || fail "a long reference's ## Contents is missing or out of step with its headings"
import re,glob,sys
bad=[]
for f in sorted(glob.glob('references/*.md')):
    lines=open(f).read().split('\n')
    if len(lines)<=100: continue
    fence=False; hs=[]
    for l in lines:
        if l.startswith('```'): fence=not fence; continue
        if not fence and l.startswith('## ') and l.strip()!='## Contents': hs.append(l[3:].strip())
    try: i=lines.index('## Contents')
    except ValueError: bad.append(f+': no ## Contents'); continue
    toc=[]
    for l in lines[i+2:]:
        if not l.startswith('- '): break
        toc.append(l[2:].strip())
    if toc!=hs: bad.append(f+': contents and headings differ')
for b in bad: print('        '+b)
sys.exit(1 if bad else 0)
PY

# a reference pointing at another names the section, so the reader opens it from SKILL.md's map
# at the right place instead of following a chain (Anthropic's guide: one level deep)
python3 - <<'PY' && pass "every reference-to-reference pointer names its section" || fail "a reference points at another reference without naming the section"
import re,glob,sys
bad=[]
for f in sorted(glob.glob('references/*.md')):
    me=f.split('/')[-1]; lines=open(f).read().split('\n'); fence=False
    for n,l in enumerate(lines):
        if l.startswith('```'): fence=not fence; continue
        if fence or l.startswith('- '): continue
        for m in re.finditer(r'`(?:references/)?([a-z-]+\.md)`', l):
            t=m.group(1)
            if t==me or t not in [g.split('/')[-1] for g in glob.glob('references/*.md')]: continue
            rest=(l[m.end():]+' '+(lines[n+1] if n+1<len(lines) else ''))[:60]
            whole = re.search(r'(has the rules|read it with|Read this|in full|whole file|the full table|is the secondary|the primary one)', l+' '+(lines[n-1] if n else ''))
            if not re.match(r'\s*(§|,? *§)', rest) and not whole: bad.append(f'{me}:{n+1} → {t}')
for b in bad: print('        '+b)
sys.exit(1 if bad else 0)
PY

# no time-bound phrasing in the instructions: "since <date>", "before <date>", "fixed <date>" go
# stale the day after a release (Anthropic's guide: no time-sensitive information). A date that
# says where a rule came from is fine in the references; SKILL.md carries none
expect "SKILL.md carries no dates" "0" "$(grep -c '20[0-9][0-9]-[01][0-9]-[0-3][0-9]' SKILL.md)"
expect "no 'since / before / after / fixed <date>' in the references" "0" "$(grep -ciE '(since|before|after|fixed|until) 20[0-9][0-9]-[01][0-9]' references/*.md | awk -F: '{s+=$2} END{print s+0}')"

# SKILL.md's body stays under 500 lines (Anthropic's skill-authoring guide): it is read whole at
# the start of every session; a step's full text is its reference's "Step N in full" section
expect "SKILL.md body under 500 lines" "ok" "$(awk 'BEGIN{f=0} NR==1&&/^---$/{f=1;next} f==1&&/^---$/{f=2;next} f==2' SKILL.md | wc -l | awk '{print ($1<500)?"ok":$1" lines"}')"

# cut.js and shell.js --out create the output's folder (2026-10-02: ENOENT on the first render)
node "$DIR/shell.js" "$ROOT/assets/shell/dashboard/examples/figma-master.json" --out "$T/new/dir/s.html" >/dev/null 2>&1
expect "shell.js --out creates the folder" "yes" "$([ -f "$T/new/dir/s.html" ] && echo yes)"
node -e 'const {encode}=require(process.argv[1]);require("fs").writeFileSync(process.argv[2],encode(4,4,new Uint8Array(64).fill(200)))' "$DIR/_png.cjs" "$T/c4.png"
node "$DIR/cut.js" "$T/c4.png" 0 0 2 2 "$T/new/plates/p.png" >/dev/null 2>&1
expect "cut.js creates the output's folder" "yes" "$([ -f "$T/new/plates/p.png" ] && echo yes)"

# "sidebar": {plate, width} — the frame's own sidebar, baked: it renders pixel for pixel and the slot
# starts at its width (the 2026-10-02 run moved its island from 264 to 256 by hand)
node "$DIR/cut.js" "$ROOT/assets/shell/dashboard/reference/sidebar-demo-1440x1080.png" 0 0 256 1080 "$T/plate/side.png" >/dev/null 2>&1
node -e 'const fs=require("fs");const c=JSON.parse(fs.readFileSync(process.argv[1]));c.sidebar={plate:"side.png",width:256};c.canvas={width:1440,height:1080};fs.writeFileSync(process.argv[2],JSON.stringify(c))' "$ROOT/assets/shell/dashboard/examples/figma-master.json" "$T/plate/cfg.json"
SP=$(node "$DIR/shell.js" "$T/plate/cfg.json" --out "$T/plate/p.html" 2>&1 | node -e 'const j=JSON.parse(require("fs").readFileSync(0));console.log(j.sidebar+" "+j.contentOrigin.x)' 2>&1)
expect "shell.js sidebar plate: the slot starts at the plate's width" "256 276" "$SP"
node "$DIR/shoot.js" "$T/plate/p.html" "$T/plate" 1440 1080 >/dev/null 2>&1
expect "shell.js sidebar plate: the frame's sidebar, pixel for pixel" "sidebar 0.00%" "$("$DIR/zonediff.sh" "$ROOT/assets/shell/dashboard/reference/sidebar-demo-1440x1080.png" "$T/plate/view_1440.png" '[["sidebar",0,0,256,1080]]' 2>&1)"
# "scroll": true — a fixed canvas's island scrolls content taller than it
node -e 'const fs=require("fs");const c=JSON.parse(fs.readFileSync(process.argv[1]));c.scroll=true;c.canvas={width:1440,height:900};fs.writeFileSync(process.argv[2],JSON.stringify(c))' "$ROOT/assets/shell/dashboard/examples/figma-master.json" "$T/scroll.json"
node "$DIR/shell.js" "$T/scroll.json" --out "$T/scroll.html" >/dev/null 2>&1
expect "shell.js scroll: the fixed canvas's island scrolls tall content" "auto true" "$("$DIR/statecheck.sh" "$T/scroll.html" --size 1440x900 --js 'var d=document.createElement("div");d.style.height="2000px";document.getElementById("content-slot").appendChild(d)' --probe 'var c=document.querySelector(".sh-content");return getComputedStyle(c).overflowY+" "+(c.scrollHeight>c.clientHeight)' 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"

# doctor --vercel: a npm cache with files the user does not own is named, with the chown to run
mkdir -p "$T/npmc/_cacache"; touch "$T/npmc/_cacache/x"
expect "doctor --vercel: a foreign-owned npm cache is named, with the fix" "npx cannot run the Vercel CLI" \
  "$(PATH="$(echo "$PATH" | tr ':' '\n' | grep -v "$(dirname "$(command -v vercel 2>/dev/null || echo /nonexistent/x)")" | paste -sd: -)" npm_config_cache="$T/npmc" DOCTOR_UID=0 "$DIR/doctor.sh" --vercel 2>&1)"

# figctx.py prints a Tailwind-escaped slash plain: w-[calc(100%\/3)] reads w-[calc(100%/3)]
printf '%s' '<div className="w-[calc(100%\/3)] bg-[var(--neutral\/10,#f3f4f6)]">x</div>' > "$T/esc.jsx"
expect "figctx.py: an escaped slash in a token is printed plain" "w-[calc(100%/3)] bg-[#f3f4f6]" "$(python3 "$DIR/figctx.py" "$T/esc.jsx" 2>&1)"

# the description is in the third person (Anthropic's guide: it is injected into the system prompt,
# and "I can…" / "you can…" there confuses discovery)
expect "description has no first or second person" "0" "$(awk '/^description:/{f=1;next} f&&/^---$/{exit} f' SKILL.md | grep -ciwE "i|i'm|i'll|my|me|we|our|us|you|your|you're")"
# MCP tools are named with their server: SKILL.md's extraction order and figma-mcp.md's table say
# which server, so a session with two Figma servers (the plugin's and a claude.ai connector) knows
expect "the Figma tools are named with their server" "1 1 5" "$(grep -c 'figma:<tool>' SKILL.md) $(grep -c 'mcp__plugin_sumsub-design_figma__' SKILL.md) $(grep -cE '^\| `figma:(get_metadata|get_design_context|get_variable_defs|get_screenshot|download_assets)`' references/figma-mcp.md)"
# every lint label tools.md's authoring-guide table names is a check that exists here
python3 - "$ROOT" <<'PY' && pass "tools.md's authoring-guide table names only checks lint runs" || fail "tools.md names a lint check that lint.sh does not have"
import re,sys,os
root=sys.argv[1]; t=open(os.path.join(root,'references/tools.md')).read(); l=open(os.path.join(root,'scripts/lint.sh')).read()
sec=t[t.index("## Anthropic's skill-authoring guide"):]
bad=[n for row in re.findall(r'lint: (.*?) \|', sec) for n in re.findall(r'`([^`]+)`', row) if n not in l]
for b in bad: print('        missing in lint.sh: '+b)
sys.exit(1 if bad else 0)
PY

# modelcheck.cjs reads the session's model and effort from the transcript: Opus or Fable at medium and up
# is ok; anything else gets the one line to show the person, which names what it may cost
mkdir -p "$T/mc"
printf '%s\n' '{"type":"assistant","effort":"high","message":{"model":"claude-opus-5-5","content":[]}}' > "$T/mc/a.jsonl"
printf '%s\n' '{"type":"assistant","effort":"low","message":{"model":"claude-sonnet-5-5","content":[]}}' > "$T/mc/b.jsonl"
printf '%s\n' '{"type":"assistant","effort":"low","message":{"model":"claude-fable-5-1","content":[]}}' > "$T/mc/c.jsonl"
expect "modelcheck.cjs: Sonnet or a low effort is offered a switch, Opus at high is not" "ok    : claude-opus-5-5, effort high|сейчас Sonnet, low — прототип может выйти хуже|сейчас Fable, low" \
  "$(node "$DIR/modelcheck.cjs" "$T/mc/a.jsonl")|$(node "$DIR/modelcheck.cjs" "$T/mc/b.jsonl" | grep -o 'сейчас Sonnet, low — прототип может выйти хуже')|$(node "$DIR/modelcheck.cjs" "$T/mc/c.jsonl" | grep -o 'сейчас Fable, low')"
expect "SKILL.md runs the model check right after the version check" "1" "$(grep -c 'Then the model check, once' SKILL.md)"

# scanline.sh answers a wrong call with its usage, not a stack (2026-10-06: `v 1500 0 200`)
node -e 'const {encode}=require(process.argv[1]);require("fs").writeFileSync(process.argv[2],encode(4,4,new Uint8Array(64).fill(255)))' "$DIR/_png.cjs" "$T/sl.png"
expect "scanline.sh: a call shaped like another script's gets the usage, exit 2" "the position is a whole number of pixels, got 'v'|2" "$("$DIR/scanline.sh" "$T/sl.png" v 1500 0 200 2>&1 | head -1 | grep -o "the position is a whole number of pixels, got 'v'")|$("$DIR/scanline.sh" "$T/sl.png" v 1500 0 200 >/dev/null 2>&1; echo $?)"

# the skeleton's --block mode writes the content alone and never the deliverable (2026-10-06: a generator
# that branched after writing turned a finished prototype into a bare shell)
mkdir -p "$T/sk/_work/gen"; cp "$ROOT/assets/shell/dashboard/examples/figma-master.json" "$T/sk/_work/shell.json"
cp "$ROOT/assets/templates/gen-list.skeleton.js" "$T/sk/gen.js"
(cd "$T/sk" && SKILL="$ROOT" node gen.js >/dev/null 2>&1); H1=$(md5 -q "$T/sk/page.html" 2>/dev/null || md5sum "$T/sk/page.html" | cut -d' ' -f1)
SKB=$(cd "$T/sk" && SKILL="$ROOT" node gen.js --block 1920x900 2>&1); H2=$(md5 -q "$T/sk/page.html" 2>/dev/null || md5sum "$T/sk/page.html" | cut -d' ' -f1)
expect "skeleton --block writes _work/gen/block.html at the slot's width, without the shell" '"block":true' "$SKB"
expect "skeleton --block leaves the deliverable untouched" "same 0" "$([ "$H1" = "$H2" ] && echo same) $(grep -c 'class="sh-side' "$T/sk/_work/gen/block.html")"

# fluid-page.js shellMinWidth: the 2026-10-06 page (floor 534, aside 380, gap 24, gutter 32, slot at 284 with
# a 28 right inset on a 1920 canvas) needed minWidth 1314, found by hand
expect "fluid-page.js shellMinWidth: the floor's matching shell minWidth" "1314" "$(node -e 'const {shellMinWidth}=require(process.argv[1]);console.log(shellMinWidth({gap:24,gutter:32,primary:{min:534},aside:{width:380}},{x:284,w:1608},1920))' "$ROOT/assets/templates/fluid-page.js" 2>&1)"

# radio() and checkbox() take titleIcon, as the field's label does: 4 after the text, 16, #6a7282
node -e '
const C=require(process.argv[1]),fs=require("fs");const q="<svg viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"currentColor\"/></svg>";
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}${C.css}</style></head><body><div style="padding:20px">${C.checkbox({label:"Fuzzy",titleIcon:q,id:"cb"})}${C.radio({label:"Exact",titleIcon:q,id:"rd"})}</div></body></html>`)' "$ROOT/assets/components/controls.js" "$T/ti.html"
expect "controls.js radio and checkbox: titleIcon after the label, 4 apart, 16, #6a7282" "4 16 rgb(106, 114, 130) 4" \
  "$("$DIR/statecheck.sh" "$T/ti.html" --size 500x200 --probe 'var l=document.querySelector("#cb .c-cb-l"),i=l.querySelector(".c-ti"),t=document.createRange();t.selectNodeContents(l.firstChild);var tr=t.getBoundingClientRect(),ir=i.getBoundingClientRect();return [Math.round(ir.left-tr.right),Math.round(ir.width),getComputedStyle(i).color,getComputedStyle(document.querySelector("#rd .c-rd-l")).gap.replace("px","")].join(" ")' 2>&1 | sed -n 's/^probe : //p' | tr -d '"')"

# Step 0's questions go through the native question tool, not as text (the person asked for it, 2026-10-06)
expect "shell.js: the header's AI button is .sh-ai — no bare .ai rule to leak onto a page's own class" "0 1" "$(grep -c '^\.ai{\|[ ,]\.ai[{:]' "$ROOT/scripts/shell.js") $(grep -c 'class=\"sh-ai\"' "$ROOT/scripts/shell.js" | sed 's/2/1/')"
expect "statecheck --rects-of beside --probe is refused, not dropped" "2" "$("$DIR/statecheck.sh" "$T/fluid.html" --rects-of 'body' --probe 'return 1' >/dev/null 2>&1; echo $?)"
node -e '
const C=require(process.argv[1]),fs=require("fs");
fs.writeFileSync(process.argv[2],`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}${C.css}</style></head><body><div style="width:300px;padding:20px">${C.skeleton({height:56})}${C.skeleton({height:32,ai:true,radius:4})}</div></body></html>`);
' "$ROOT/assets/components/controls.js" "$T/skel.html"
expect "controls.js skeleton: the block's radius 8 and #f3f4f6, the 2s pulse, the AI gradient variant, reduced motion off" "300x56 8px rgb(243, 244, 246) c-skel 2s cubic-bezier(0.4, 0, 0.6, 1) | 4px linear-gradient rm" \
  "$("$DIR/statecheck.sh" "$T/skel.html" --size 400x200 --probe 'var a=document.querySelectorAll(".c-skel"),s=getComputedStyle(a[0]),b=getComputedStyle(a[1]),r=a[0].getBoundingClientRect();return Math.round(r.width)+"x"+Math.round(r.height)+" "+s.borderRadius+" "+s.backgroundColor+" "+s.animationName+" "+s.animationDuration+" "+s.animationTimingFunction+" | "+b.borderRadius+" "+b.backgroundImage.split("(")[0]' 2>&1 | sed -n 's/^probe : //p' | tr -d '"') $(grep -c 'prefers-reduced-motion:reduce){.c-skel{animation:none}' "$ROOT/assets/components/controls.js" | sed 's/1/rm/')"
expect "rule 5 names its one exception: a loading state the brief asks for" "1" "$(grep -c "loading state the brief asks for" SKILL.md)"
# the corporate marketplace's two gates (v3.206.0): no plaintext secret exported into the shell, and a skill
# that exports a variable names shell-env as the mechanism
expect "marketplace: no 'export VERCEL_TOKEN' anywhere in the skill" "0" "$(grep -rl 'export VERCEL_TOKEN' "$ROOT/SKILL.md" "$ROOT/scripts" "$ROOT/references" --exclude=lint.sh 2>/dev/null | wc -l | tr -d ' ')"
expect "marketplace: SKILL.md names shell-env beside the \$SKILL export, and auth-core for a credential" "1 1" "$(grep -c 'shell-env' SKILL.md) $(grep -c 'auth-core' SKILL.md)"
expect "Step 0 asks through AskUserQuestion, never as text" "1" "$(grep -c 'Every question goes through the `AskUserQuestion` tool, never as text' SKILL.md)"
expect "Step 0: a parameter with a default is not a question, no option points at Other, no baking offered" "1 1 1" "$(grep -c 'A parameter with a written default is not a question' SKILL.md) $(grep -c 'no option of yours may only point at it' SKILL.md) $(grep -c 'Never offer to bake what holds' SKILL.md)"

# the run checklist has a line per step, 0 to 9, and each step it names exists
expect "SKILL.md: the run checklist names every step 0–9" "10" "$(sed -n '/^Prototype run:/,/^```/p' SKILL.md | grep -cE '^- \[ \] [0-9] ')"

# every file in the skill is listed: documents in SKILL.md, scripts and templates in SKILL.md's
# by-step table or in references/tools.md (the full table moved there on 2026-10-04, so that
# SKILL.md, read whole at the start of every session, carries the rules and not a catalogue)
for f in references/*.md assets/*.md; do grep -q "$f" SKILL.md && pass "listed: $f" || fail "not in SKILL.md: $f"; done
for f in scripts/* assets/templates/*; do b=$(basename "$f"); case "$b" in _*|*.html) continue ;; esac
  grep -q "$b" SKILL.md references/tools.md && pass "listed: $b" || fail "not in SKILL.md or tools.md: $b"; done
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
            # the run log's sections are §-numbered too, and these documents cite both
            if not any(h.startswith(f'{m.group(1)}. ') for h in heads['references/research-prototypes.md'] + heads.get('assets/run-log-template.md', [])):
                print(f'  FAIL  {f}: §{m.group(1)} — neither research-prototypes.md nor the run log has section {m.group(1)}'); ok=False
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
