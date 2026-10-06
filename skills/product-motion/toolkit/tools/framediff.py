# Consecutive-frame diff inside a region (catches a jump between two frames) + a zoomed strip: region crops on the left,
# their abs-diff heat x8 on the right. usage: framediff.py out.png x y w h zoom a.png b.png c.png ...  (frames from snap_*)
import os, sys, base64, subprocess, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from motionlib import CHROME
out, x, y, w, h, z = sys.argv[1], *map(int, sys.argv[2:6]), int(sys.argv[6]); pngs = sys.argv[7:]
uris = ["data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode() for p in pngs]
js = """<body style="margin:0"><canvas id=c style="display:block"></canvas><script>
const U=%s,X=%d,Y=%d,W=%d,H=%d,Z=%d,N=U.length;
Promise.all(U.map(u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u}))).then(I=>{
 const t=document.createElement('canvas');t.width=W;t.height=H;const g=t.getContext('2d');const D=I.map(i=>{g.clearRect(0,0,W,H);g.drawImage(i,-X,-Y);return g.getImageData(0,0,W,H)});
 const c=document.getElementById('c');c.width=W*Z*2;c.height=H*Z*N;const o=c.getContext('2d');o.imageSmoothingEnabled=false;const st=[];
 for(let k=0;k<N;k++){o.drawImage(I[k],X,Y,W,H,0,k*H*Z,W*Z,H*Z);
  if(k>0){const a=D[k-1].data,b=D[k].data,hm=new ImageData(W,H);let s=0,m=0,n=0;
   for(let p=0;p<a.length;p+=4){const d=Math.max(Math.abs(a[p]-b[p]),Math.abs(a[p+1]-b[p+1]),Math.abs(a[p+2]-b[p+2]));s+=d;if(d>m)m=d;if(d>24)n++;const v=Math.min(255,d*8);hm.data[p]=v;hm.data[p+1]=v;hm.data[p+2]=v;hm.data[p+3]=255}
   st.push([k-1,k,+(s/(a.length/4)).toFixed(3),m,n]);const tc=document.createElement('canvas');tc.width=W;tc.height=H;tc.getContext('2d').putImageData(hm,0,0);o.drawImage(tc,0,0,W,H,W*Z,k*H*Z,W*Z,H*Z)}}
 const p=document.createElement('pre');p.id='o';p.style.cssText='position:absolute;left:0;top:0;opacity:0';p.textContent=JSON.stringify({st});document.body.appendChild(p)});
</script>""" % (json.dumps(uris), x, y, w, h, z)
tmp = os.path.abspath(out + ".h.html"); open(tmp, "w").write(js)
r = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=30000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
d = json.loads(re.search(r'<pre id="o"[^>]*>(.*?)</pre>', r, re.S).group(1))
subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--virtual-time-budget=30000",
                f"--window-size={w*z*2},{h*z*len(pngs)}", f"--screenshot={out}", "file://" + tmp], capture_output=True); os.remove(tmp)
for a, b, mean, mx, n in d["st"]: print(f"{os.path.basename(pngs[a])} -> {os.path.basename(pngs[b])}: mean {mean} max {mx} px>24 {n}")
