# Pixel diff of two same-size PNGs via headless Chrome: max channel difference, mean, pixel counts above 16 and above
# a threshold, and the bbox of the pixels above the threshold.
# usage: python3 pixdiff.py a.png b.png [threshold=40] [heat.png]      (also importable: pixdiff(a, b, thr, heat) -> dict)
import sys, base64, json, os, re, subprocess
from motionlib import CHROME, TOOLS

def pixdiff(a, b, thr=40, heat=None):
    """heat: optional PNG path — B dimmed, pixels above the threshold in red."""
    uri = lambda p: "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()
    js = """<script>
const A=new Image(),B=new Image();let n=0;A.onload=B.onload=()=>{if(++n<2)return;
const w=A.width,h=A.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
g.drawImage(A,0,0);const da=g.getImageData(0,0,w,h).data;g.clearRect(0,0,w,h);g.drawImage(B,0,0);const db=g.getImageData(0,0,w,h).data;
let mx=0,c1=0,c2=0,x0=w,y0=h,x1=-1,y1=-1,sum=0;
for(let i=0;i<da.length;i+=4){const d=Math.max(Math.abs(da[i]-db[i]),Math.abs(da[i+1]-db[i+1]),Math.abs(da[i+2]-db[i+2]),Math.abs(da[i+3]-db[i+3]));
 sum+=d;if(d>mx)mx=d;if(d>16)c1++;if(d>THR){c2++;const p=i/4,x=p%w,y=(p/w)|0;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y}}
const hm=g.createImageData(w,h);for(let i=0;i<da.length;i+=4){const d=Math.max(Math.abs(da[i]-db[i]),Math.abs(da[i+1]-db[i+1]),Math.abs(da[i+2]-db[i+2]));
 if(d>THR){hm.data[i]=255;hm.data[i+1]=0;hm.data[i+2]=0}else{hm.data[i]=db[i]*.35+160;hm.data[i+1]=db[i+1]*.35+160;hm.data[i+2]=db[i+2]*.35+160}hm.data[i+3]=255}
g.putImageData(hm,0,0);
document.body.innerHTML='<pre id=o>'+JSON.stringify({size:[w,h,B.width,B.height],max:mx,mean:+(sum/(w*h)).toFixed(3),over16:c1,overT:c2,bbox:x1<0?null:[x0,y0,x1,y1]})+'</pre><pre id=h>'+c.toDataURL('image/png')+'</pre>'};
A.src=URI_A;B.src=URI_B;</script>""".replace("THR", str(thr)).replace("URI_A", json.dumps(uri(a))).replace("URI_B", json.dumps(uri(b)))
    tmp = os.path.join(TOOLS, "_pixdiff.html"); open(tmp, "w").write("<!doctype html><html><body>" + js + "</body></html>")
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True).stdout
    os.remove(tmp)
    if heat:
        import base64 as b64
        open(heat, "wb").write(b64.b64decode(re.search(r'<pre id="h">data:image/png;base64,(.*?)</pre>', out, re.S).group(1)))
    return json.loads(re.search(r'<pre id="o">(.*?)</pre>', out, re.S).group(1).replace("&quot;", '"'))

if __name__ == "__main__":
    print(pixdiff(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 40, sys.argv[4] if len(sys.argv) > 4 else None))
