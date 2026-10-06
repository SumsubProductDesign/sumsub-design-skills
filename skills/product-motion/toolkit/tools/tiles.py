# Tile-level diff of two same-size PNGs (headless Chrome): tiles TxT with >N pixels differing by >THR, skipping a rect.
import base64, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import CHROME, TOOLS
def tiles(a, b, thr=40, T=24, skip=(892, 104, 1386, 458), minpx=6):
    uri = lambda p: "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()
    js = f"""<script>const A=new Image(),B=new Image();let n=0;A.onload=B.onload=()=>{{if(++n<2)return;
const w=A.width,h=A.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
g.drawImage(A,0,0);const da=g.getImageData(0,0,w,h).data;g.clearRect(0,0,w,h);g.drawImage(B,0,0);const db=g.getImageData(0,0,w,h).data;
const S={json.dumps(skip)},T={T},m={{}};
for(let y=0;y<h;y++)for(let x=0;x<w;x++){{if(x>=S[0]&&x<S[2]&&y>=S[1]&&y<S[3])continue;const i=(y*w+x)*4;
const d=Math.max(Math.abs(da[i]-db[i]),Math.abs(da[i+1]-db[i+1]),Math.abs(da[i+2]-db[i+2]));if(d>{thr}){{const k=((x/T)|0)+','+((y/T)|0);m[k]=(m[k]||0)+1}}}}
document.body.innerHTML='<pre id=o>'+JSON.stringify(m)+'</pre>'}};A.src={json.dumps(uri(a))};B.src={json.dumps(uri(b))};</script>"""
    tmp = os.path.join(TOOLS, "_tiles.html"); open(tmp, "w").write("<!doctype html><html><body>" + js + "</body></html>")
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=8000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
    os.remove(tmp)
    m = json.loads(re.search(r'<pre id="o">(.*?)</pre>', out, re.S).group(1).replace("&quot;", '"'))
    return sorted(((int(k.split(",")[1]) * T, int(k.split(",")[0]) * T, v) for k, v in m.items() if v >= minpx))
if __name__ == "__main__":
    r = tiles(sys.argv[1], sys.argv[2])
    print(len(r), "tiles")
    rows = {}
    for y, x, v in r: rows.setdefault(y, []).append((x, v))
    for y in sorted(rows): print(f"y{y:4d}:", " ".join(f"{x}:{v}" for x, v in rows[y]))
