# Mid-animation sync: the HTML page vs its Lottie at a few moments (2x, same frame), max/mean pixel difference.
# usage: python3 midsync.py name theme t1 t2 ...   (real seconds)
import sys, os, subprocess
from pixdiff import pixdiff
args = sys.argv[1:]; root = None
if "--root" in args: i = args.index("--root"); root = os.path.abspath(args[i + 1]); del args[i:i + 2]
name, theme, ts = args[0], args[1], [float(t) for t in args[2:]]
here = os.path.dirname(os.path.abspath(__file__)); tag = "base" if root else "new"; root = root or os.path.dirname(here)
html = os.path.join(root, name + ("" if theme == "light" else "-dark") + ".html")
lot = os.path.join(root, "lottie", f"{name}-{theme}.json")
out = os.path.join(here, f"_mid-{name}-{theme}-{tag}"); os.makedirs(out, exist_ok=True)
for t in ts:
    f = round(t * 60)
    subprocess.run(["python3", os.path.join(here, "snap_html.py"), "--2x", html, os.path.join(out, "h"), f"{f / 60:.4f}"], capture_output=True)
    subprocess.run(["python3", os.path.join(here, "snap_lottie.py"), "--2x", lot, os.path.join(out, "l"), str(f)], capture_output=True)
    a, b = os.path.join(out, f"h_{f / 60:.4f}.png"), os.path.join(out, f"l_{f}.png")
    if not (os.path.exists(a) and os.path.exists(b)):
        print(t, "missing", os.path.exists(a), os.path.exists(b)); continue
    r = pixdiff(a, b, 40); print(f"t={t:.2f}s f={f}: max {r['max']} mean {r['mean']} over40 {r['overT']} bbox {r['bbox']}")
