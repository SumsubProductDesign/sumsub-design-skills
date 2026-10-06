# Corner check for a Lottie on a given background: renders the last frame at 2x and stacks the 4 corners zoomed,
# and prints a fringe metric = how much brighter the curve's edge band is than the illustration just inside it.
# usage: python3 corners.py name.json out.png [bg=#1a1b1c] [frame=last]
import sys, os, subprocess, json, re
from motionlib import CHROME, ROOT
name, out = sys.argv[1], sys.argv[2]
bg = sys.argv[3] if len(sys.argv) > 3 else "#1a1b1c"
data = json.load(open(os.path.join(ROOT, "lottie", name)))
W, H = data["w"], data["h"]
fr = data["op"] - 1 if len(sys.argv) <= 4 or sys.argv[4] == "last" else float(sys.argv[4])
html = f'''<!doctype html><html><body style="margin:0;background:{bg}"><div id=a style="width:{W}px;height:{H}px"></div>
<script src="file://{ROOT}/player/vendor/lottie.min.js"></script><script>
const an=lottie.loadAnimation({{container:document.getElementById('a'),renderer:'svg',loop:false,autoplay:false,animationData:{json.dumps(data)}}});
an.addEventListener('DOMLoaded',()=>an.goToAndStop({fr},true));</script></body></html>'''
tmp = os.path.join(ROOT, "tools", "_corner.html"); open(tmp, "w").write(html)
full = out + ".full.png"
subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files",
                f"--window-size={W},{H}", f"--screenshot={full}", "--virtual-time-budget=4000", "file://" + tmp], capture_output=True)
os.remove(tmp)
# metric + zoomed composite in a canvas page
import base64
uri = "data:image/png;base64," + base64.b64encode(open(full, "rb").read()).decode()
R, C, Z = 32, 40, 6
js = f"""<script>const I=new Image();I.onload=()=>{{const W=I.width,H=I.height,c=document.createElement('canvas');c.width=W;c.height=H;
const g=c.getContext('2d');g.drawImage(I,0,0);const d=g.getImageData(0,0,W,H).data;const L=(x,y)=>{{x=Math.min(W-1,Math.max(0,x));y=Math.min(H-1,Math.max(0,y));const i=(y*W+x)*4;return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]}};
let worst=0;const R={R};for(const [cx,cy,sx,sy] of [[R,R,-1,-1],[W-R,R,1,-1],[R,H-R,-1,1],[W-R,H-R,1,1]]){{
 for(let a=0;a<=90;a+=3){{const t=a*Math.PI/180,ux=sx*Math.cos(t),uy=sy*Math.sin(t);
  let band=0,inner=0;for(let r=R-1.5;r<=R+1.5;r+=.5){{band=Math.max(band,L(Math.round(cx+ux*r),Math.round(cy+uy*r)))}}
  for(let r=R-7;r<=R-3;r+=1){{inner=Math.max(inner,L(Math.round(cx+ux*r),Math.round(cy+uy*r)))}}
  worst=Math.max(worst,band-inner)}}}}
const o=document.createElement('canvas');const Z={Z},C={C};o.width=4*C*Z+30;o.height=C*Z;const q=o.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle='#f0f';q.fillRect(0,0,o.width,o.height);
[[0,0],[W-C,0],[0,H-C],[W-C,H-C]].forEach(([x,y],k)=>q.drawImage(I,x,y,C,C,k*(C*Z+10),0,C*Z,C*Z));
document.body.innerHTML='<pre id=m>'+worst.toFixed(1)+'</pre><pre id=p>'+o.toDataURL()+'</pre>'}};I.src={json.dumps(uri)};</script>"""
tmp = os.path.join(ROOT, "tools", "_corner2.html"); open(tmp, "w").write("<!doctype html><html><body>" + js + "</body></html>")
dom = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
os.remove(tmp); os.remove(full)
open(out, "wb").write(base64.b64decode(re.search(r'<pre id="p">data:image/png;base64,(.*?)</pre>', dom, re.S).group(1)))
print(name, "fringe", re.search(r'<pre id="m">(.*?)</pre>', dom).group(1))
