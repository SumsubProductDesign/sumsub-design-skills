# usage: flatten_bg.py in.svg out.svg  — rasterize the root background paths (before first foreignObject/<g id=) into one JPEG
import re,sys,subprocess,base64,os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import CHROME, img_jpeg
src,dst=sys.argv[1],sys.argv[2]
s=open(src).read()
m=re.search(r'(<g clip-path="url\(#clip0_[^"]+\)">\n)(.*?)(?=<foreignObject|<g id=|<path id=)',s,re.S)
clipped=bool(m)
if not m:   # some exports have no root clip group — then the background sits right in the illustration's root <g>
    m=re.search(r'(<g id="Illustrations[^"]*">\n)(.*?)(?=<foreignObject|<g id=|<path id=)',s,re.S)
bgpaths=m.group(2)
defs=s[s.index("<defs>"):s.index("</defs>")+7]
W,H=494,354
bgsvg=f'<svg width="{W*2}" height="{H*2}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">{bgpaths}{defs}</svg>'
open("bg.svg","w").write(bgsvg)
open("bg.html","w").write(f'<html><body style="margin:0"><img src="bg.svg" style="display:block;width:{W*2}px;height:{H*2}px"></body></html>')
chrome=CHROME
subprocess.run([chrome,"--headless","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1",f"--window-size={W*2},{H*2}",f"--screenshot={os.path.abspath('bg.png')}","--virtual-time-budget=4000","file://"+os.path.abspath("bg.html")],capture_output=True)
img_jpeg("bg.png","bg.jpg",80)
b=base64.b64encode(open("bg.jpg","rb").read()).decode()
img=f'<image id="bg" width="{W}" height="{H}" xlink:href="data:image/jpeg;base64,{b}"/>\n'
if not clipped:   # keep the rounded corners: clip the flattened JPEG by the background's own outline
    d=re.search(r'<path d="([^"]+)"',bgpaths).group(1)
    img=img.replace('<image id="bg"','<image id="bg" clip-path="url(#bgclip)"')
    s=s.replace("<defs>",f'<defs>\n<clipPath id="bgclip"><path d="{d}"/></clipPath>',1)
s=s.replace(bgpaths,img,1)
open(dst,"w").write(s); print("bg jpg",len(b)//1024,"KB",file=sys.stderr)
