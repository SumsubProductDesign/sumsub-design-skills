import re,base64,subprocess,sys,os,tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import img_info, img_resize, img_jpeg
src,dst=sys.argv[1],sys.argv[2]
s=open(src).read()
tmp=tempfile.mkdtemp()
# drop pattern defs no longer referenced, then images no longer used by any pattern
for pid in re.findall(r'<pattern id="([^"]+)"',s):
  if f'url(#{pid})' not in s:
    s=re.sub(r'<pattern id="'+re.escape(pid)+r'".*?</pattern>\n?','',s,flags=re.S)
for iid in re.findall(r'<image id="([^"]+)"',s):
  if iid!="bg" and f'#{iid}"' not in s:
    s=re.sub(r'<image id="'+re.escape(iid)+r'"[^>]*/>\n?','',s)
def fix(m):
  head,fmt,b=m.group(1),m.group(2),m.group(3)
  if 'id="bg"' in head: return m.group(0)
  w,h=int(re.search(r'width="(\d+)"',head).group(1)),int(re.search(r'height="(\d+)"',head).group(1))
  p=os.path.join(tmp,"i.png"); open(p,"wb").write(base64.b64decode(b))
  alpha=img_info(p)[2]
  big=max(w,h)>=1000 and ("image0" in head)   # background texture
  limit=900 if big else 200
  if max(w,h)>limit: img_resize(p,limit)
  if alpha:
    out=p; mime="png"
  else:
    out=os.path.join(tmp,"i.jpg"); img_jpeg(p,out,78); mime="jpeg"
  nb=base64.b64encode(open(out,"rb").read()).decode()
  print(f"  {w}x{h} alpha={alpha} {len(b)//1024}KB -> {len(nb)//1024}KB {mime}",file=sys.stderr)
  return f'{head}xlink:href="data:image/{mime};base64,{nb}"'
s=re.sub(r'(<image [^>]*?)xlink:href="data:image/([a-z]+);base64,([A-Za-z0-9+/=]+)"',fix,s)
open(dst,"w").write(s); print(len(s)//1024,"KB total",file=sys.stderr)
