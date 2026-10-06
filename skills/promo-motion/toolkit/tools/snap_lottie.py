# Render given frames of a Lottie json (from ../lottie) to PNG via headless Chrome + the player's lottie-web.
# usage: python3 snap_lottie.py [--2x] name.json out_prefix frame [frame ...]   (frame may be "last"; --2x renders at the comp size)
import sys, os, subprocess, json
from motionlib import CHROME, ROOT
args = sys.argv[1:]; Z2 = "--2x" in args; args = [a for a in args if a != "--2x"]
name, prefix, frames = args[0], args[1], args[2:]
data = json.load(open(os.path.join(ROOT, "lottie", name)))
VW, VH = (data["w"], data["h"]) if Z2 else (data["w"] // 2, data["h"] // 2)
for f in frames:
    fr = data["op"] - 1 if f == "last" else float(f)
    html = f'''<!doctype html><html><body style="margin:0;background:#888"><div id=a style="width:{VW}px;height:{VH}px"></div>
<script src="file://{ROOT}/player/vendor/lottie.min.js"></script><script>
const an=lottie.loadAnimation({{container:document.getElementById('a'),renderer:'svg',loop:false,autoplay:false,animationData:{json.dumps(data)}}});
an.addEventListener('DOMLoaded',()=>an.goToAndStop({fr},true));</script></body></html>'''
    tmp = os.path.join(ROOT, "tools", "_snap.html"); open(tmp, "w").write(html)
    out = f"{prefix}_{f}.png"
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
                    f"--window-size={VW},{VH}", f"--screenshot={out}", "--virtual-time-budget=4000", "file://" + tmp], capture_output=True)
    os.remove(tmp); print(out)
