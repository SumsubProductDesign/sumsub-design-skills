# Numeric alignment check: freeze a built page's CSS animations at given moments and compare the tight bbox of an
# element's first <rect> (or the element itself) with an anchor element (e.g. an arrow).
# usage: python3 check_stops.py page.html anchorId id1@seconds id2@seconds ...
# prints Δy between centres, gap from the anchor's right edge to the element's left edge, element height.
import re, subprocess, os, json, sys
from motionlib import CHROME, ROOT
page, anchor, pairs = sys.argv[1], sys.argv[2], [a.split("@") for a in sys.argv[3:]]
src = open(os.path.join(ROOT, page)).read()
js = """<script>document.fonts.ready.then(()=>{const out={};const A=document.getElementById(%s).getBoundingClientRect();
out.ay=(A.top+A.bottom)/2; out.ax=A.right;
for(const [id,t] of %s){document.getAnimations().forEach(a=>{a.pause();a.currentTime=t*1000});
 const el=document.getElementById(id); const r=(el.querySelector('rect')||el).getBoundingClientRect();
 out[id+'@'+t]={dy:+((r.top+r.bottom)/2-out.ay).toFixed(2), gap:+(r.left-out.ax).toFixed(2), h:+r.height.toFixed(2)}}
document.body.innerHTML='<pre id=o>'+JSON.stringify(out)+'</pre>'})</script>""" % (json.dumps(anchor), json.dumps([[i, float(t)] for i, t in pairs]))
html = src.replace("</body>", "<script>const s=document.querySelector('svg.illus');document.body.innerHTML='';document.body.appendChild(s);"
                   "s.style.cssText='width:494px;height:354px;display:block'</script>" + js + "</body>")
tmp = os.path.join(ROOT, "_chk.html"); open(tmp, "w").write(html)
out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
os.remove(tmp)
d = json.loads(re.search(r'<pre id="o">(.*?)</pre>', out, re.S).group(1).replace("&quot;", '"'))
for k, v in d.items():
    if isinstance(v, dict): print(f"{k:22s} Δy {v['dy']:+.2f}px  gap {v['gap']:.2f}px  h {v['h']}")
