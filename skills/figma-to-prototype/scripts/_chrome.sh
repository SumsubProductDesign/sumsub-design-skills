# sourced by the .sh tools — locate a headless-capable Chrome.
# Same search order as _chrome.cjs. Override with CHROME=/path/to/binary; any
# Chromium-based browser from 112 on works (Chrome, Chromium, Brave, Edge).
CHROME="${CHROME:-}"
if [ -n "$CHROME" ] && [ ! -x "$CHROME" ]; then echo "CHROME is set to '$CHROME' but that is not an executable" >&2; exit 1; fi
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/Applications/Chromium.app/Contents/MacOS/Chromium" \
           "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
           "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
           "$(command -v google-chrome 2>/dev/null)" \
           "$(command -v google-chrome-stable 2>/dev/null)" \
           "$(command -v chromium 2>/dev/null)" \
           "$(command -v chromium-browser 2>/dev/null)" \
           "$(command -v brave-browser 2>/dev/null)" \
           "$(command -v microsoft-edge 2>/dev/null)"; do
    [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
  done
fi
if [ -z "$CHROME" ]; then echo "no Chrome found; set CHROME=/path/to/chrome (Chrome, Chromium, Brave or Edge, 112+)" >&2; exit 1; fi
FLAGS="--headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --allow-file-access-from-files --virtual-time-budget=5000"
# Every headless render is on a clock: CHROME_TIMEOUT seconds (60 by default; a render takes one to
# five), then the Chrome is killed and the caller fails with one line. A Chrome that hung across the
# machine's sleep held a pre-commit for nine hours (2026-10-13); macOS has no `timeout`, so this is it.
# The .js tools keep the same clock through _chrome.cjs.
CHROME_TIMEOUT="${CHROME_TIMEOUT:-60}"
chrome_run() {   # chrome_run <args…>: "$CHROME" with the args, its own stderr dropped; killed after $CHROME_TIMEOUT s, exit 124
  local pid wd rc
  "$CHROME" "$@" 2>/dev/null & pid=$!
  # the watchdog owns no pipe of the caller's (a command substitution would otherwise wait for its sleep)
  ( trap 'kill $s 2>/dev/null; exit' TERM; sleep "$CHROME_TIMEOUT" & s=$!; wait $s; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 & wd=$!
  wait "$pid" 2>/dev/null; rc=$?          # the shell's own "Killed: 9" notice is dropped; the line below says it
  kill "$wd" 2>/dev/null; wait "$wd" 2>/dev/null
  [ "$rc" -eq 137 ] && { echo "chrome: did not finish within ${CHROME_TIMEOUT}s and was killed — a hang across the machine's sleep? (CHROME_TIMEOUT raises the clock)" >&2; return 124; }
  return $rc
}
# With --dump-dom, Chrome lays the page out in a viewport SHORTER than --window-size by the
# height of a toolbar it never draws (87px on Chrome 153, 2026-09-25), while --screenshot in
# the same run is taken at the full size. So a probe's innerHeight, a 100vh box, a bottom-
# anchored bar all sit 87 short of the pixels — silently, and on every DOM-side height the
# skill had measured. chrome_dom_delta prints that difference, measured once per Chrome
# binary and cached: statecheck.sh adds it to the window for its DOM pass.
chrome_dom_delta() {
  local key mt cache probe got
  mt=$(stat -f %m "$CHROME" 2>/dev/null || stat -c %Y "$CHROME" 2>/dev/null || echo 0)
  key=$(printf '%s %s' "$CHROME" "$mt" | cksum | cut -d' ' -f1)
  cache="${TMPDIR:-/tmp}/chrome-dom-delta-$key"
  if [ -s "$cache" ]; then cat "$cache"; return; fi
  probe='data:text/html,<script>setTimeout(function(){document.body.innerHTML="<i id=h>"%2Bwindow.innerHeight%2B"</i>"},50)</script>'
  local raw
  raw=$(chrome_run --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1000,900 --dump-dom --virtual-time-budget=1000 "$probe") || { local rc=$?; echo 0; return $rc; }
  got=$(printf '%s' "$raw" | sed -n 's/.*<i id="h">\([0-9]*\)<.*/\1/p' | head -1)
  case "$got" in ''|*[!0-9]*) echo 0; return ;; esac
  echo $((900 - got)) | tee "$cache"
}
# NOTE: --screenshot=/dev/null silently breaks --dump-dom. Always pass a real path.
