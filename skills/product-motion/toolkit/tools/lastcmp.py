# Compare the last frame of the deployed baseline (tools/_base) with the new build: HTML and Lottie.
# usage: python3 lastcmp.py name theme
import sys, os, subprocess
from pixdiff import pixdiff
name, theme = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__)); out = os.path.join(here, "_last"); os.makedirs(out, exist_ok=True)
pg = name + ("" if theme == "light" else "-dark") + ".html"; js = f"{name}-{theme}.json"
for tag, page, lot in (("base", f"tools/_base/{pg}", os.path.join(here, "_base", "lottie", js)), ("new", pg, js)):
    subprocess.run(["python3", "snap_html.py", page, os.path.join(out, f"{tag}h"), "end"], cwd=here, capture_output=True)
    subprocess.run(["python3", "snap_lottie.py", "--2x", lot, os.path.join(out, f"{tag}l"), "last"], cwd=here, capture_output=True)
h = pixdiff(os.path.join(out, "baseh_end.png"), os.path.join(out, "newh_end.png"), 16)
l = pixdiff(os.path.join(out, "basel_last.png"), os.path.join(out, "newl_last.png"), 16)
print(f"{name} {theme} last frame base→new  HTML max {h['max']} over16 {h['over16']}  |  Lottie max {l['max']} over16 {l['over16']}")
