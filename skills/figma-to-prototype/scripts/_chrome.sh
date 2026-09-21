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
# NOTE: --screenshot=/dev/null silently breaks --dump-dom. Always pass a real path.
