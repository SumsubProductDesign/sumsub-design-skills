# Final-frame check: the built HTML (frozen at its end) and the Lottie (last frame) must reproduce the original
# illustration. Both are diffed against a 1x render of WORK/ref.svg (the prepared, DS-remapped source the builder saves).
# usage: python3 check_final.py name light|dark [threshold=40]
import sys, os, subprocess
from motionlib import *
from pixdiff import pixdiff
name, theme = sys.argv[1], sys.argv[2]; thr = int(sys.argv[3]) if len(sys.argv) > 3 else 40
work = os.path.join(TOOLS, f"work-{name}-{theme}")
ref = os.path.join(work, "ref1x.png"); ref2 = os.path.join(work, "ref2x.png")
refsvg = open(os.path.join(work, "ref.svg")).read()
shoot(refsvg, ref, S=1, bg="#888"); shoot(refsvg, ref2, S=2, bg="#888")    # Lottie is compared at its 2x comp size (its layers are 2x rasters)
page = name + ("" if theme == "light" else "-dark") + ".html"
pre = os.path.join(work, "final")
subprocess.run(["python3", os.path.join(TOOLS, "snap_html.py"), page, pre + "_html", "end"], check=True, capture_output=True, cwd=TOOLS)
subprocess.run(["python3", os.path.join(TOOLS, "snap_lottie.py"), "--2x", f"{name}-{theme}.json", pre + "_lottie", "last"], check=True, capture_output=True, cwd=TOOLS)
print(f"{name} {theme} html  ", pixdiff(ref, f"{pre}_html_end.png", thr, f"{pre}_html_heat.png"))
print(f"{name} {theme} lottie", pixdiff(ref2, f"{pre}_lottie_last.png", thr, f"{pre}_lottie_heat.png"))
