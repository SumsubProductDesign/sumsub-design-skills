# Freeze CSS animations of a built page at given times (s) and render the illustration via headless Chrome.
# usage: python3 snap_html.py [--2x] page.html out_prefix t [t ...]   ("end" = 999; --2x renders at 988x708)
import sys, os, subprocess, re
from motionlib import CHROME, ROOT
args = sys.argv[1:]; Z2 = "--2x" in args; args = [a for a in args if a != "--2x"]
page, prefix, times = args[0], args[1], args[2:]
VW, VH = (988, 708) if Z2 else (494, 354)
src = open(os.path.join(ROOT, page)).read()
src = re.sub(r'<script id="playWhenSeen">.*?</script>', "", src, flags=re.S)   # times are set by hand here: no play-when-seen gate
for t in times:
    ms = 999000 if t == "end" else float(t) * 1000
    html = src.replace("</body>", f"""<script>document.body.style.cssText='margin:0;padding:0;background:#888';
const s=document.querySelector('svg.illus');document.body.innerHTML='';document.body.appendChild(s);s.style.cssText='width:{VW}px;height:{VH}px;display:block';
document.getAnimations().forEach(a=>{{a.pause();a.currentTime={ms}}});</script></body>""")
    tmp = os.path.join(ROOT, "_snap.html"); open(tmp, "w").write(html)
    out = f"{prefix}_{t}.png"
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    f"--window-size={VW},{VH}", f"--screenshot={out}", "--virtual-time-budget=3000", "file://" + tmp], capture_output=True)
    os.remove(tmp); print(out)
