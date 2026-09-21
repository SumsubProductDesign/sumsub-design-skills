#!/bin/bash
# doctor.sh [--vercel] — check what this machine gives the skill, then run one measurement end to
# end (render a red square headless, read the pixel back, ask the page for a rect).
#
# Two classes, because they are not the same thing:
#   REQUIRED  Chrome and Node. Without either, nothing in the skill runs — exit 1.
#   OPTIONAL  python3 and Vercel. Each one closes a named part of the work and leaves the rest
#             alone: the ten steps of the main path do not touch either. A missing optional is a
#             warning and exit 0, so nobody installs a runtime they will never use.
# Every miss prints the one line that fixes it, so the answer to "what do I install" is on screen.
#
# --vercel additionally checks that the Vercel CLI has valid credentials. It never starts a login.
DIR="$(cd "$(dirname "$0")" && pwd)"
bad=0; warned=0
pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1"; bad=1; }
warn() { echo "  warn  $1"; warned=1; }
# how to get each thing, per platform — printed only when it is missing
howto() {
  case "$(uname -s)" in
    Darwin) case "$1" in
      node)   echo "        install:  brew install node   — or the installer at https://nodejs.org (18+)" ;;
      chrome) echo "        install:  brew install --cask google-chrome   — or any Chromium 112+; export CHROME=/path" ;;
      python) echo "        install:  xcode-select --install   — macOS then has python3 at /usr/bin/python3" ;;
    esac ;;
    *) case "$1" in
      node)   echo "        install:  your package manager, Node 18 or newer" ;;
      chrome) echo "        install:  chromium or google-chrome, 112 or newer; export CHROME=/path" ;;
      python) echo "        install:  your package manager, python3" ;;
    esac ;;
  esac
}

echo "figma-to-prototype — environment check"
case "$(uname -s)" in
  Darwin|Linux) pass "$(uname -s)" ;;
  *) fail "$(uname -s): the .sh tools need macOS or Linux (WSL works on Windows)" ;;
esac

# ---- required
if command -v node >/dev/null 2>&1; then
  v=$(node -v)
  case "$v" in v1[89].*|v[2-9][0-9].*) pass "node $v" ;; *) fail "node $v — need 18 or newer"; howto node ;; esac
else fail "node not found — every .js tool and all JSON handling needs it"; howto node; fi
if CH=$(bash -c ". '$DIR/_chrome.sh'; printf '%s' \"\$CHROME\"" 2>&1); then pass "chrome: $CH"; else fail "$CH"; howto chrome; fi
if command -v curl >/dev/null 2>&1; then pass "curl"; else fail "curl not found — assets are downloaded with it"; fi

# ---- optional, each with what it costs
if command -v python3 >/dev/null 2>&1; then pass "$(python3 --version 2>&1)"
else
  warn "python3 not found — the ten steps of the main path still work."
  echo "        without it:  reading a designer's SVG exports (references/reading-exports.md),"
  echo "                     the theming tools (hex_sweep.py), and align_exports.py / bbox.py"
  howto python
fi

if [ $bad -eq 0 ]; then
  T="${TMPDIR:-/tmp}/doctor-$$"; mkdir -p "$T"
  printf '%s' '<!doctype html><html><head><title>doctor</title></head><body style="margin:0;background:#fff"><div id="app" style="position:relative;width:200px;height:100px"><div style="position:absolute;left:20px;top:20px;width:40px;height:40px;background:#ff0000"></div></div></body></html>' > "$T/p.html"
  node "$DIR/shoot.js" "$T/p.html" "$T" 200 100 >/dev/null 2>&1
  px=$("$DIR/pixprobe.sh" "$T/view_200.png" '[[40,40]]' 2>&1)
  case "$px" in *'#ff0000'*) pass "render + pixel probe: $px" ;; *) fail "render + pixel probe returned: $px" ;; esac
  rc=$("$DIR/statecheck.sh" "$T/p.html" --size 200x100 --rects-of '#app div' 2>&1 | grep 'probe')
  case "$rc" in *'20,20 40x40'*) pass "statecheck --rects-of: ${rc#probe : }" ;; *) fail "statecheck returned: $rc" ;; esac
  rm -rf "$T"
fi

if [ "$1" = "--vercel" ]; then
  . "$DIR/_vercel.sh"
  if WHO=$(vc_require_auth 2>&1); then pass "vercel: logged in as $WHO"
  else
    warn "vercel: $WHO"
    echo "        without it:  Step 9 only — the prototype is still built and handed over as a file"
    echo "        fix:         npx vercel login   (yours to run; the scripts never log in for you)"
  fi
fi

echo
if [ $bad -ne 0 ]; then echo "fix the FAIL lines above, then run again."; exit 1; fi
if [ $warned -ne 0 ]; then echo "ready — with the warnings above: the main path works, the named parts do not."
else echo "ready."; fi
