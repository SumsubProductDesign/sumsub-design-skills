#!/bin/bash
# encode.sh <in.png> <out.webp|out.jpg> [quality 0–1, default 0.85] [--width N]
#
# A photo inside a prototype — a document image, an avatar, a picture in a card — is carried as
# WebP (or JPEG), not PNG. PNG is lossless, which is right for a plate of drawn interface (flat
# fills, text edges) and the heaviest possible way to carry a photograph: the 2026-10-02 OCR
# prototypes inlined their document photos as 2x PNGs and came out at 8.9 and 11.7 MB.
#
# Encoded by the Chrome the skill already needs (canvas.toDataURL), so there is no new tool to
# install. Pixel size is kept: a 2x photo stays 2x — unless --width N, which scales it to N px
# wide (height in proportion): a raw image at its own resolution is cut to 2x of the width it is
# shown at, and no further. Prints the size before and after.
# Only for photo-like images (weight.cjs says which): a drawn plate re-encoded lossy gets soft
# text edges and colour fringes the zone diff will see.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_chrome.sh"
WIDTH=""; POS=()
while [ $# -gt 0 ]; do case "$1" in --width) WIDTH="$2"; shift 2 ;; *) POS+=("$1"); shift ;; esac; done
IN="${POS[0]:-}"; OUT="${POS[1]:-}"; Q="${POS[2]:-0.85}"
case "$WIDTH" in ''|*[!0-9]*) [ -z "$WIDTH" ] || { echo "encode: --width is a whole number of pixels" >&2; exit 2; } ;; esac
[ -n "$OUT" ] || { sed -n '2,3p' "$0" | sed 's/^# //' >&2; exit 2; }
[ -f "$IN" ] || { echo "encode: no such file: $IN" >&2; exit 2; }
case "$OUT" in
  *.webp) MIME=image/webp ;;
  *.jpg|*.jpeg) MIME=image/jpeg ;;
  *) echo "encode: the output is .webp or .jpg" >&2; exit 2 ;;
esac
TMP="${TMPDIR:-/tmp}/encode-$$"; mkdir -p "$TMP"; trap 'rm -rf "$TMP"' EXIT
# the image goes in as a data: URI: a file:// image would taint the canvas, and toDataURL refuses
node -e '
const fs=require("fs"),[inp,out,mime,q,w]=process.argv.slice(1);
const b64=fs.readFileSync(inp).toString("base64");
fs.writeFileSync(out,`<!doctype html><html><body><pre id="o"></pre><script>
var i=new Image();i.onload=function(){var W=${Number(w)}||i.naturalWidth,c=document.createElement("canvas");
c.width=W;c.height=Math.round(i.naturalHeight*W/i.naturalWidth);
var x=c.getContext("2d");x.imageSmoothingQuality="high";if(${JSON.stringify(mime)}==="image/jpeg"){x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height)}
x.drawImage(i,0,0,c.width,c.height);document.getElementById("o").textContent=c.toDataURL(${JSON.stringify(mime)},${Number(q)})};
i.src="data:image/png;base64,${b64}";</script></body></html>`);
' "$IN" "$TMP/p.html" "$MIME" "$Q" "${WIDTH:-0}"
"$CHROME" $FLAGS --window-size=100,100 --screenshot="$TMP/s.png" --dump-dom "file://$TMP/p.html" 2>/dev/null \
  | sed -n 's/.*<pre id="o">data:[^,]*,\([A-Za-z0-9+/=]*\).*/\1/p' | head -1 > "$TMP/b64"
[ -s "$TMP/b64" ] || { echo "encode: Chrome returned no image (is $IN a PNG?)" >&2; exit 1; }
node -e 'const fs=require("fs");fs.writeFileSync(process.argv[2],Buffer.from(fs.readFileSync(process.argv[1],"utf8").trim(),"base64"))' "$TMP/b64" "$OUT"
A=$(wc -c < "$IN" | tr -d ' '); B=$(wc -c < "$OUT" | tr -d ' ')
echo "encode: $OUT — $((B / 1024)) KB from $((A / 1024)) KB ($((100 * B / A))%), quality $Q${WIDTH:+, $WIDTH px wide}"
