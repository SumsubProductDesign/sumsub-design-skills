# Lottie layer order vs the SVG document order (the HTML version = the original's stacking). Top-first Lottie layers must
# appear in reverse document order; prints every pair stacked the other way round.  usage: python3 layer_order.py [name ...]
import json, os, re, sys
from motionlib import ROOT, measure
names = sys.argv[1:] or sorted({f.rsplit("-", 1)[0] for f in os.listdir(os.path.join(ROOT, "lottie")) if f.endswith(".json")})
def layers_top_first(d):
    main = next((a for a in d["assets"] if a.get("id") == "main"), None)   # some files wrap everything into a "main" precomp
    return (main or d)["layers"]
for n in names:
    for th in ("light", "dark"):
        d = json.load(open(os.path.join(ROOT, "lottie", f"{n}-{th}.json")))
        html = open(os.path.join(ROOT, n + ("" if th == "light" else "-dark") + ".html")).read()
        pos = lambda k: html.find(f'id="{k}"')
        ls = [L.get("refId") or L.get("nm") for L in layers_top_first(d) if L.get("ty") in (0, 2, 4)]
        ls = [k for k in ls if k and k != "plate"]
        known = [(k, pos(k)) for k in ls if pos(k) >= 0]
        bad = [(a, b) for i, (a, pa) in enumerate(known) for (b, pb) in known[i + 1:] if pa < pb]   # a drawn above b but earlier in the doc
        if bad:   # only pairs that actually overlap on the final frame matter
            svg = re.search(r'<svg class="illus".*?</svg>', html, re.S).group(0)
            box = measure(svg, sorted({k for p in bad for k in p}))
            hit = lambda a, b: a and b and a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]
            bad = [(a, b) for a, b in bad if hit(box.get(a), box.get(b))]
        print(f"{n:20s} {th:5s} layers {len(ls):2d} matched {len(known):2d}  " + ("OK" if not bad else f"{len(bad)} inverted: " + ", ".join(f"{a}>{b}" for a, b in bad[:8])))
