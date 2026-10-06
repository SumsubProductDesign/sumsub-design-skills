"""Shared helpers for promo-illustration motion: SVG prep, headless renders, HTML page, Lottie writer."""
import base64, json, os, re, subprocess
def _find_chrome():
    """A Chromium-based browser for headless renders: $CHROME, else the usual macOS / Linux locations."""
    import shutil
    if os.environ.get("CHROME"): return os.environ["CHROME"]
    for c in ("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium",
              "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"):
        if os.path.exists(c): return c
    for c in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"):
        if shutil.which(c): return shutil.which(c)
    raise SystemExit("No Chromium-based browser found: install Google Chrome or set CHROME=/path/to/chrome")
CHROME = _find_chrome()
TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
E = (.275, .3, .1, 1)       # a critically damped spring (no overshoot): moves at once, long soft landing — cubic fit of
                            # 1-(1+7.5t)e^-7.5t within 2% (apple-design audit 02.10: the old (.4,0,.2,1) sat still for the
                            # first ~15% of every move, so each beat lagged its cause; ease-out-quint was too snappy, 30.09)
E_OLD = (.4, 0, .2, 1)
IO = (.65, 0, .35, 1)       # ease-in-out for exits / drags back
EASE = (.25, .1, .25, 1)    # CSS default
FONT = '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">'

def cb(e): return "cubic-bezier(%s,%s,%s,%s)" % e

# 05.10: the developer rounds the corners himself → every deliverable (HTML/SVG, Lottie) is SQUARE: the illustration's
# rounded frame (r 16) becomes a plain rectangle in the source, so the corners hold the real background, and no corner
# masks are added. The dashboard preview (player Page view) rounds its own slot instead, as the product will.
SQUARE = True
FRAME_RR = re.compile(r'M0 16C0 [\d.]+ [\d.]+ 0 16 0H478C[\d.]+ 0 494 [\d.]+ 494 16V338C494 [\d.]+ [\d.]+ 354 478 354H16C[\d.]+ 354 0 [\d.]+ 0 338V16Z')

def _lum(c):
    """Relative luminance of "#rrggbb" / "white" / "black"; anything else (url(…), none) counts as mid-grey."""
    c = {"white": "#ffffff", "black": "#000000"}.get(c.lower(), c)
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", c): return 0.5
    return sum(k * int(c[i:i + 2], 16) / 255 for k, i in ((0.2126, 1), (0.7152, 3), (0.0722, 5)))
FLAG_GID = re.compile(r'<g id="Flag(?:_\d+)?"')         # the Assets country-flag component (not the normal/flag icon)
def _g_end(s, i):
    d = 0
    for t in re.finditer(r'<g\b|</g>', s[i:]):
        d += 1 if t.group(0) == '<g' else -1
        if d == 0: return i + t.end()
def keep_flag_colours(dark, light):
    """Country flags are pictures: the same in both themes. The Assets dark illustrations bind a flag's white base to
    the dark surface (#1A1B1C) and its black to the light text colour, so Austria's white stripe turns black (06.10).
    A fill of a flag in the dark source goes back to the light source's value (same flag, same tag) only where light and
    dark swapped (luminance apart by more than half): a near-white base fixed in Figma (#F7F7F7) is left as drawn."""
    spans = lambda s: [(m.start(), _g_end(s, m.start())) for m in FLAG_GID.finditer(s)]
    ls, ds = spans(light), spans(dark)
    assert len(ls) == len(ds), f"flags: {len(ls)} in the light source, {len(ds)} in the dark one"
    tag = re.compile(r'<[a-zA-Z][^>]*>')
    out, pos = [], 0
    for (li, lj), (di, dj) in zip(ls, ds):
        if di < pos: continue                                  # nested in a flag already done
        lt = iter(tag.findall(light[li:lj]))
        def fix(m):
            t, src_t = m.group(0), next(lt)
            v, w = re.search(r'\sfill="([^"]+)"', src_t), re.search(r'\sfill="([^"]+)"', t)
            if v and w and abs(_lum(v.group(1)) - _lum(w.group(1))) > 0.5:
                t = t.replace(w.group(0), ' fill="%s"' % v.group(1), 1)
            return t
        assert len(tag.findall(light[li:lj])) == len(tag.findall(dark[di:dj])), "a flag differs between the sources"
        out += [dark[pos:di], tag.sub(fix, dark[di:dj])]; pos = dj
    return "".join(out) + dark[pos:]

def prep_svg(src, work):
    """Flatten background to JPEG, shrink embedded images, soften Figma layer-blur export."""
    os.makedirs(work, exist_ok=True)
    light = src[:-len("-dark.svg")] + ".svg" if src.endswith("-dark.svg") else None
    if light and os.path.exists(light):                        # dark sources: flags keep their real colours
        raw = open(src).read(); fixed = keep_flag_colours(raw, open(light).read())
        if fixed != raw: src = os.path.join(work, "src-flags.svg"); open(src, "w").write(fixed)
    if SQUARE:   # the frame's fills and its clip become plain rectangles before anything is rendered
        raw = open(src).read(); sq, n = FRAME_RR.subn("M0 0H494V354H0Z", raw)
        assert n >= 1, ("no rounded frame outline in", src)
        src = os.path.join(work, "src-square.svg"); open(src, "w").write(sq)
    flat, opt = os.path.join(work, "flat.svg"), os.path.join(work, "opt.svg")
    subprocess.run(["python3", os.path.join(TOOLS, "flatten_bg.py"), src, flat], cwd=work, check=True)
    subprocess.run(["python3", os.path.join(TOOLS, "optimize.py"), flat, opt], cwd=work, check=True)
    s = open(opt).read()
    # Figma marks card fills/strokes crispEdges: no anti-aliasing, visible stairs once a card is rotated or scaled
    s = s.replace(' shape-rendering="crispEdges"', '')
    # Figma exports Layer blur r as stdDeviation r/2, which renders ~3x softer than in Figma
    s = re.sub(r'<filter id="filter\d+_fn_.*?</filter>',
               lambda m: re.sub(r'stdDeviation="(\d+(?:\.\d+)?)"', lambda k: 'stdDeviation="%g"' % (float(k.group(1)) / 3), m.group(0)), s, flags=re.S)
    return s

def wrap(s, start_marker, end_marker, gid):
    """Wrap the markup between two markers (start inclusive, end exclusive) into <g id=gid>."""
    i = s.index(start_marker); j = s.index(end_marker, i)
    return s[:i] + f'<g id="{gid}">\n' + s[i:j] + '</g>\n' + s[j:]

def rename(s, mapping):
    for k, v in mapping.items():
        n = s.count(f'id="{k}"'); assert n == 1, (k, n)
        s = s.replace(f'id="{k}"', f'id="{v}"')
    return s

def once(frames, end):
    """Play-once timeline: keep keys up to `end` %, stretch them to 0..100 and hold the last (= original illustration) state."""
    kept = [(round(p * 100 / end, 3), v, e) for p, v, e in frames if p <= end]
    if kept[-1][0] < 100: kept.append((100, kept[-1][1], None))
    return kept

class Keyframes:
    """CSS keyframes. With end=<pct> the animation plays once, is trimmed at `end` % of T and freezes on its final frame."""
    def __init__(self, T, end=None):
        self.end = end; self.T = T * end / 100 if end else T; self.css = []
        self.dur = f"{self.T:.2f}s 1 both" if end else f"{T}s infinite"
    def kf(self, name, frames):
        """frames: [(pct, 'css decl', easing_tuple_or_None)] — easing applies to the segment starting here."""
        if self.end: frames = once(frames, self.end)
        body = ""
        for p, v, e in frames:
            tf = e if isinstance(e, str) else (cb(e) if e else None)
            body += f"{p}%{{{v}" + (f";animation-timing-function:{tf}" if tf else "") + "}"
        self.css.append(f"@keyframes {name}{{{body}}}")
    def rule(self, sel, decl): self.css.append(f"{sel}{{{decl}}}")
    def text(self): return "\n".join(self.css)

# Accessibility (04.10, audit p.11). Reduced motion: no animation, the still (= original) frame fades in softly instead of
# appearing at once. Reduced transparency: the glass loses its blur and becomes a near-solid surface of the theme — only
# from the moment its blur would have come in (--glass-a rides along in every backdrop-filter keyframe).
GLASS_SOLID = {"light": "249,250,251", "dark": "32,33,35"}
def a11y_css(css, theme, scope=".illus"):
    css = re.sub(r'backdrop-filter:blur\(([\d.]+)px\)', lambda m: m.group(0) + (";--glass-a:0" if float(m.group(1)) == 0 else ";--glass-a:1"), css)
    extra = ("@property --glass-a{syntax:'<number>';inherits:false;initial-value:1}\n"
             f"@media (prefers-reduced-transparency:reduce){{{scope} foreignObject>div{{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;"
             f"background:rgba({GLASS_SOLID[theme]},calc(var(--glass-a)*.9))}}}}")
    return css + "\n" + extra
REDUCED_FADE = "animation:rmIn .4s cubic-bezier(.275,.3,.1,1) both"
# Play once it is seen (04.10, audit p.12): paused (class "wait") until at least 30 % of the illustration is in view AND
# the tab is visible, then plays once. Fail-safe: if the script does not run (or no IntersectionObserver) it plays at
# once, as before. The same function goes into the handoff SVGs.
PLAY_WHEN_SEEN = ("function(s){if(!s||!('IntersectionObserver' in window))return;s.classList.add('wait');var seen=false,io,"
                  "go=function(){if(!seen||document.visibilityState!=='visible')return;s.classList.remove('wait');io.disconnect();"
                  "document.removeEventListener('visibilitychange',go)};io=new IntersectionObserver(function(e){"
                  "seen=e[e.length-1].intersectionRatio>=.3;go()},{threshold:[0,.3,.6]});io.observe(s);"
                  "document.addEventListener('visibilitychange',go)}")

# the demo page rounded the illustration itself (12px); square deliverables leave the corners to the product
ILLUS_RADIUS = "" if SQUARE else ";border-radius:12px"

def page(out, title, desc, svg, css, T):
    css = a11y_css(css, "dark" if out.endswith("-dark.html") else "light")
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Product Motion</title>
<link rel="preconnect" href="https://fonts.googleapis.com">{FONT}
<style>
:root{{--bg:#f3f4f6;--fg:#030712;--sub:#4a5565;--line:#d1d5dc;--card:#fff}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#26282a;--fg:#f7f7f7;--sub:#a2a6a9;--line:#3d4045;--card:#1a1b1c}}}}
:root[data-theme="dark"]{{--bg:#26282a;--fg:#f7f7f7;--sub:#a2a6a9;--line:#3d4045;--card:#1a1b1c}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 Geist,system-ui,sans-serif;padding:32px 16px}}
main{{max-width:1020px;margin:0 auto}} h1{{font-size:20px;font-weight:600;margin:0 0 4px}} p{{margin:0 0 20px;color:var(--sub)}}
.stage{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}}
.illus{{display:block;width:100%;height:auto{ILLUS_RADIUS}}}
.bar{{display:flex;gap:8px;align-items:center;margin-top:12px}}
button{{font:inherit;font-weight:500;color:var(--fg);background:transparent;border:1px solid var(--line);border-radius:8px;padding:6px 12px;cursor:pointer}}
.paused .illus *,.illus.wait,.illus.wait *{{animation-play-state:paused!important}}
{css}
@keyframes rmIn{{from{{opacity:0}}}}
@media (prefers-reduced-motion:reduce){{.illus *{{animation:none!important}} #cursor{{display:none}} .illus{{{REDUCED_FADE}}}}}
</style></head><body><main>
<h1>{title}</h1><p>{desc}</p>
<div class="stage" id="stage">{svg}<script id="playWhenSeen">({PLAY_WHEN_SEEN})(document.currentScript.previousElementSibling)</script>
<div class="bar"><button id="pp" type="button">Pause</button><button id="rs" type="button">Restart</button></div></div>
</main><script>
const st=document.getElementById('stage'),pp=document.getElementById('pp');
pp.onclick=()=>{{st.classList.toggle('paused');pp.textContent=st.classList.contains('paused')?'Play':'Pause'}};
// restart without re-inserting the SVG: a fresh copy re-decodes its embedded images (up to ~1 s stall, audit p.13)
document.getElementById('rs').onclick=()=>{{const s=st.querySelector('svg');st.classList.remove('paused');pp.textContent='Pause';s.classList.remove('wait');s.getAnimations({{subtree:true}}).forEach(a=>{{a.currentTime=0;a.play()}})}};
</script></body></html>'''
    open(out, "w").write(html)
    return len(html)

# ---------- headless renders (2x) ----------
def shoot(svg, out_png, hide=(), only=None, transparent=False, W=494, H=354, S=2, css="", bg="#fff"):
    """`css` adds rules (e.g. "[filter]{filter:none!important}" so a child rendered alone does not pick up its
    ancestor's drop shadow); `bg` is the page colour behind the illustration's rounded corners."""
    s = svg.replace(f'width="{W}" height="{H}"', f'width="{W*S}" height="{H*S}"', 1)
    style = css
    if only:
        # hide drawn content but not <defs> (clipPaths inside defs would clip everything away)
        esc = lambda i: "#" + re.sub(r'([^\w-])', r'\\\1', i)      # ids with spaces/slashes need escaping in a selector
        style += "svg>g *{visibility:hidden}" + ",".join(f"{esc(o)},{esc(o)} *" for o in only) + "{visibility:visible}"
    # `hide` goes last and with !important, so it wins over the `only` rule (e.g. a card rendered without its tags)
    if hide: style += ",".join("#" + re.sub(r'([^\w-])', r'\\\1', h) + ",#" + re.sub(r'([^\w-])', r'\\\1', h) + " *" for h in hide) + "{visibility:hidden!important}"
    html = f'<!doctype html><html><head><meta charset="utf-8">{FONT}<style>html,body{{margin:0;background:{"transparent" if transparent else bg}}} svg{{display:block}} {style}</style></head><body>{s}</body></html>'
    tmp = out_png + ".html"; open(tmp, "w").write(html)
    args = [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
            f"--window-size={W*S},{H*S}", f"--screenshot={out_png}", "--virtual-time-budget=5000"]
    if transparent: args.append("--default-background-color=00000000")
    subprocess.run(args + ["file://" + tmp], capture_output=True); os.remove(tmp)

def _have_sips():
    import shutil; return bool(shutil.which("sips"))

def _canvas(src, draw, out=None, mime="image/png", q=0.82):
    """Run `draw` (JS using I = the loaded image, c = canvas, g = its 2d context) in headless Chrome. With `out` the canvas
    is written there; otherwise the value the JS leaves in `R` is returned (JSON)."""
    uri = "data:image/png;base64," + base64.b64encode(open(src, "rb").read()).decode()
    js = (f"<script>const I=new Image();I.onload=()=>{{const c=document.createElement('canvas');const g=c.getContext('2d');let R=null;"
          f"{draw};document.body.innerHTML='<pre id=p>'+(" + ("c.toDataURL(%s,%s)" % (json.dumps(mime), q) if out else "JSON.stringify(R)")
          + f")+'</pre>'}};I.src={json.dumps(uri)};</script>")
    tmp = os.path.join(TOOLS, f"_canvas-{os.getpid()}.html"); open(tmp, "w").write(js)
    dom = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True).stdout
    os.remove(tmp); val = re.search(r"<pre id=\"p\">(.*?)</pre>", dom, re.S).group(1)
    if not out: return json.loads(val)
    open(out, "wb").write(base64.b64decode(val.split(",", 1)[1]))

def img_info(png):
    """(width, height, has_alpha)."""
    if _have_sips():
        o = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", "-g", "hasAlpha", png], capture_output=True, text=True).stdout
        return int(re.search(r"pixelWidth: (\d+)", o).group(1)), int(re.search(r"pixelHeight: (\d+)", o).group(1)), "hasAlpha: yes" in o
    return tuple(_canvas(png, "c.width=I.width;c.height=I.height;g.drawImage(I,0,0);const d=g.getImageData(0,0,c.width,c.height).data;"
                              "let a=false;for(let i=3;i<d.length;i+=4)if(d[i]<255){a=true;break}R=[I.width,I.height,a]"))

def img_resize(png, limit):
    """Scale down in place so the longer side is at most `limit` px."""
    if _have_sips(): subprocess.run(["sips", "-Z", str(limit), png], capture_output=True); return
    _canvas(png, f"const k=Math.min(1,{limit}/Math.max(I.width,I.height));c.width=Math.round(I.width*k);c.height=Math.round(I.height*k);"
                 "g.drawImage(I,0,0,c.width,c.height)", out=png)

def img_crop(png, X, Y, Wd, Hd):
    """Crop in place to the pixel box (X, Y, Wd, Hd)."""
    if _have_sips():
        subprocess.run(["sips", "-c", str(Hd), str(Wd), "--cropOffset", str(Y), str(X), png, "--out", png], capture_output=True); return
    _canvas(png, f"c.width={Wd};c.height={Hd};g.drawImage(I,{-X},{-Y})", out=png)

def img_jpeg(png, jpg, q=82):
    """PNG → JPEG at quality q (0–100); transparent pixels land on white."""
    if _have_sips():
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(q), png, "--out", jpg], capture_output=True); return
    _canvas(png, "c.width=I.width;c.height=I.height;g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(I,0,0)",
            out=jpg, mime="image/jpeg", q=q / 100)

def crop(png, x, y, w, h, S=2, W=494, H=354):
    """Crop a 2x render to a 1x box, clamped to the canvas. Returns [X,Y,w,h] in 2x px."""
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + w), min(H, y + h)
    X, Y, Wd, Hd = [round(v * S) for v in (x0, y0, x1 - x0, y1 - y0)]
    img_crop(png, X, Y, Wd, Hd)
    return [X, Y, Wd, Hd]

def bleed_corners(png, R=32, inset=1.5, reach=18):
    """The Lottie plate is a JPEG (no alpha) whose rounded corners were shot on a white page, so the pixels on the
    curve are half white and the lottie corner mask lets that through as a light ring on dark pages (04.10).
    Only the four corner squares are touched: cut to arcs pulled in by `inset`, then the inner colours are grown
    outward into the corners; straight edges stay pixel-exact and the plate's own mask (rrect R) cuts a clean edge.
    Rewrites `png` in place (2x px). No-op when SQUARE: the corners then hold the real background."""
    if SQUARE:
        return
    uri = "data:image/png;base64," + base64.b64encode(open(png, "rb").read()).decode()
    js = f"""<script>const I=new Image();I.onload=()=>{{const W=I.width,H=I.height,R0={R},r={R}-{inset};
const a=document.createElement('canvas');a.width=W;a.height=H;const g=a.getContext('2d');
g.beginPath();g.rect(R0,0,W-2*R0,H);g.rect(0,R0,W,H-2*R0);for(const [x,y] of [[R0,R0],[W-R0,R0],[R0,H-R0],[W-R0,H-R0]]){{g.moveTo(x+r,y);g.arc(x,y,r,0,2*Math.PI)}}g.clip();g.drawImage(I,0,0);
const b=document.createElement('canvas');b.width=W;b.height=H;const q=b.getContext('2d');q.drawImage(a,0,0);
q.globalCompositeOperation='destination-over';
for(let d=1;d<={reach};d++)for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]])q.drawImage(a,x*d,y*d);
document.body.innerHTML='<pre id=p>'+b.toDataURL('image/png')+'</pre>'}};I.src={json.dumps(uri)};</script>"""
    tmp = png + ".bleed.html"; open(tmp, "w").write("<!doctype html><html><body>" + js + "</body></html>")
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True).stdout
    os.remove(tmp)
    open(png, "wb").write(base64.b64decode(re.search(r'<pre id="p">data:image/png;base64,(.*?)</pre>', out, re.S).group(1)))

def to_jpeg(png, jpg, q=82):
    img_jpeg(png, jpg, q)

# ---------- Lottie ----------
def st(v): return {"a": 0, "k": v}

class Lottie:
    """With end=<pct> the composition is trimmed at `end` % of T and every track holds its final (original) value."""
    def __init__(self, name, W, H, fr=60, T=8, end=None):
        self.name, self.W, self.H, self.fr, self.end = name, W, H, fr, end
        self.T = T * end / 100 if end else T
        self.OP = round(fr * self.T); self.assets = []; self.layers = []
    def anim(self, keys):
        """keys: [(pct, value_list, easing_or_None)] — easing applies to the segment starting at that key."""
        if self.end: keys = once(keys, self.end)
        ps = [k[0] for k in keys]
        assert ps == sorted(ps), f"keyframes out of order {ps} — overlapping segments (CSS sorts them, lottie-web breaks)"
        out = []
        for j, (p, v, e) in enumerate(keys):
            # frac: keys at exact (fractional) frame times, like the CSS keyframes — whole frames put fast moves up to
            # half a frame (several px) out of step with the HTML
            k = {"t": round(p / 100 * self.OP, 2) if getattr(self, "frac", False) else round(p / 100 * self.OP), "s": v}
            if j < len(keys) - 1 and e == "h":
                k["h"] = 1                            # hold: jump to the next key's value at its time (CSS steps(1,end))
            elif j < len(keys) - 1:
                x1, y1, x2, y2 = e or EASE; n = len(v)
                k["o"] = {"x": [x1] * n, "y": [y1] * n}; k["i"] = {"x": [x2] * n, "y": [y2] * n}
            out.append(k)
        return {"a": 1, "k": out}
    @staticmethod
    def ks(a=(0, 0), p=(0, 0), s=None, r=None, o=None):
        return {"a": st([*a, 0]), "p": p if isinstance(p, dict) else st([*list(p)[:2], 0]),
                "s": s or st([100, 100, 100]), "r": r or st(0), "o": o or st(100)}
    def image(self, aid, path, w, h):
        mime = "jpeg" if path.endswith(".jpg") else "png"
        self.assets.append({"id": aid, "w": w, "h": h, "u": "", "e": 1,
                            "p": f"data:image/{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()})
    def layer(self, ty, name, ks, ind_fixed=None, **extra):
        d = {"ddd": 0, "ind": 0, "ty": ty, "nm": name, "sr": 1, "ks": ks, "ao": 0, "ip": 0, "op": self.OP, "st": 0, "bm": 0}
        if ind_fixed is not None: d["ind"] = ind_fixed; d["_fixed"] = True
        d.update(extra); self.layers.append(d); return d
    def reveal_mask(self, w, h, t0, t1, ease=(.45, 0, .2, 1), reset=99.5, direction="right"):
        """Rect mask growing left→right (or top→bottom with direction="down") between t0..t1 (%), empty again at `reset`."""
        m0 = rect(w, 0.01) if direction == "down" else rect(0.01, h); m1 = rect(w, h)
        k = 100 / self.end if self.end else 1; f = lambda p: round(p * k / 100 * self.OP)
        lin = {"x": [.5], "y": [.5]}
        keys = [{"t": 0, "s": [m0], "o": lin, "i": lin},
                {"t": f(t0), "s": [m0], "o": {"x": [ease[0]], "y": [ease[1]]}, "i": {"x": [ease[2]], "y": [ease[3]]}}]
        keys += [{"t": f(t1), "s": [m1]}] if self.end else [{"t": f(t1), "s": [m1], "h": 1}, {"t": f(reset), "s": [m0]}]
        return [{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "reveal", "pt": {"a": 1, "k": keys}}]
    def precomp(self, name, layers, ks, ind_fixed=None, **extra):
        """Nest `layers` (top first) into a precomp asset and add a layer for it. Its opacity applies to the composited
        group — true group opacity, which parenting does not give (a parent passes on transforms only)."""
        assert all(a["id"] != name for a in self.assets), f"asset id {name!r} already used (an image?) — lottie-web renders nothing"
        for n, l in enumerate(layers, 1):
            if l.pop("_fixed", False): continue       # parent targets keep their fixed index
            l["ind"] = n
        self.assets.append({"id": name, "nm": name, "fr": self.fr, "layers": layers})
        return self.layer(0, name, ks, ind_fixed, refId=name, w=self.W, h=self.H, **extra)
    def save(self, out, round_clip=32):
        for n, l in enumerate(self.layers, 1):
            if l.pop("_fixed", False): continue       # parent targets keep their fixed index
            l["ind"] = n
        layers, assets = self.layers, list(self.assets)
        if SQUARE:   # same structure (one "main" precomp), no corner mask: the comp's own bounds clip what moves in
            assets.append({"id": "main", "nm": "main", "fr": self.fr, "layers": layers})
            layers = [{"ddd": 0, "ind": 1, "ty": 0, "nm": "illustration", "refId": "main", "sr": 1, "ks": self.ks(), "ao": 0,
                       "w": self.W, "h": self.H, "ip": 0, "op": self.OP, "st": 0, "bm": 0}]
        elif round_clip:
            # everything goes into a precomp clipped by the illustration's rounded corners,
            # so layers moving in from outside the frame never show past the corner radius
            assets.append({"id": "main", "nm": "main", "fr": self.fr, "layers": layers})
            layers = [{"ddd": 0, "ind": 1, "ty": 0, "nm": "illustration", "refId": "main", "sr": 1, "ks": self.ks(), "ao": 0,
                       "w": self.W, "h": self.H, "ip": 0, "op": self.OP, "st": 0, "bm": 0, "hasMask": True,
                       "masksProperties": [{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "corners", "pt": st(rrect(self.W, self.H, round_clip))}]}]
        doc = {"v": "5.9.0", "fr": self.fr, "ip": 0, "op": self.OP, "w": self.W, "h": self.H, "nm": self.name,
               "ddd": 0, "assets": assets, "layers": layers, "markers": []}
        json.dump(doc, open(out, "w"), separators=(",", ":"))
        return os.path.getsize(out)

def rect(w, h): return {"c": True, "v": [[0, 0], [w, 0], [w, h], [0, h]], "i": [[0, 0]] * 4, "o": [[0, 0]] * 4}

def rrect(w, h, r):
    c = r * .5523
    v = [[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [r, h], [0, h - r], [0, r]]
    i = [[-c, 0], [0, 0], [0, -c], [0, 0], [c, 0], [0, 0], [0, c], [0, 0]]
    o = [[0, 0], [c, 0], [0, 0], [0, c], [0, 0], [-c, 0], [0, 0], [0, -c]]
    return {"c": True, "v": v, "i": i, "o": o}

def plate_layer(L, path):
    """Bottom static plate with the illustration's 16px rounded corners."""
    L.image("plate", path, L.W, L.H)
    if SQUARE:
        return L.layer(2, "plate", L.ks(), refId="plate")
    return L.layer(2, "plate", L.ks(), refId="plate", hasMask=True,
                   masksProperties=[{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "corners", "pt": st(rrect(L.W, L.H, 32))}])

# ---------- structure helpers (content-based, so Light/Dark exports with different order/coords both work) ----------
_TAG = re.compile(r'<(/?)([A-Za-z][\w:.-]*)\b[^>]*?(/?)>', re.S)

def top_children(s):
    """Split the illustration's clip group into top-level child elements. Returns (head, [children], tail)."""
    m = re.search(r'<g clip-path="url\(#clip0_[^"]+\)">\n?', s) or re.search(r'<g id="Illustrations[^"]*">\n?', s)
    start = m.end(); pos = start; depth = 0; kids = []; cur = None
    for t in _TAG.finditer(s, start):
        close, name, selfclose = t.group(1), t.group(2), t.group(3)
        if not close and depth == 0: cur = t.start()
        if close:
            if depth == 0:   # end of clip group
                return s[:start], kids, s[t.start():]
            depth -= 1
            if depth == 0: kids.append(s[cur:t.end()].strip()); cur = None
        elif selfclose: 
            if depth == 0: kids.append(s[cur:t.end()].strip()); cur = None
        else:
            depth += 1
    raise ValueError("clip group not closed")

def _first_x(el):
    m = re.search(r'(?:\bx="|\bd="M)(-?[\d.]+)', el)
    return float(m.group(1)) if m else None

def regroup(s, groups):
    """groups: {gid: [predicate(child)->bool, ...]} — pulls the matching top-level children (plus, for any card node,
    its glass: the foreignObject + optional glass path whose x sits just left of the node) into <g id=gid>, placed at
    the z-position of its topmost member."""
    head, kids, tail = top_children(s)
    used = {}
    for gid, preds in groups.items():
        idx = [i for i, k in enumerate(kids) if any(p(k) for p in preds)]
        assert idx, f"nothing matched for {gid}"
        # glass: foreignObject (and the path right after it, if it is a bare glass rectangle) left of the node by ≤14px
        nx = min(x for x in (_first_x(kids[i]) for i in idx) if x is not None)
        for i, k in enumerate(kids):
            if k.startswith("<foreignObject") and i not in idx:
                fx = _first_x(k)
                if fx is not None and 0 <= nx - fx <= 14:
                    idx.append(i)
                    if i + 1 < len(kids) and re.match(r'<path id="Rectangle', kids[i + 1]): idx.append(i + 1)
        used[gid] = sorted(set(idx))
    taken = {i for v in used.values() for i in v}
    out = []
    for i, k in enumerate(kids):
        for gid, idx in used.items():
            if i == idx[-1]: out.append(f'<g id="{gid}">\n' + "\n".join(kids[j] for j in idx) + "\n</g>")
        if i not in taken: out.append(k)
    return head + "\n".join(out) + "\n" + tail

def has(*needles): return lambda k: all(n in k for n in needles)

def measure(svg, ids, W=494, H=354, screen=()):
    """getBBox() of elements (by id) in headless Chrome → {id: [x, y, w, h]} in SVG user units."""
    # wait for Geist: text bboxes measured with the fallback font are narrower
    # `screen` ids are measured in canvas space (getBoundingClientRect relative to the svg): needed when an ancestor
    # carries a transform, because getBBox() returns the element's local box
    js = ("<script>document.fonts.ready.then(()=>{const r={};const S=new Set(%s);const sv=document.querySelector('svg').getBoundingClientRect();"
          "for(const id of %s){const e=document.getElementById(id);if(!e)continue;let b;"
          "if(S.has(id)){const c=e.getBoundingClientRect();b={x:c.x-sv.x,y:c.y-sv.y,width:c.width,height:c.height}}else b=e.getBBox();"
          "r[id]=[b.x,b.y,b.width,b.height].map(v=>+v.toFixed(2))}document.body.innerHTML='<pre id=out>'+JSON.stringify(r)+'</pre>'})</script>") % (json.dumps(list(screen)), json.dumps(list(ids)))
    tmp = os.path.join(TOOLS, f"_measure-{os.getpid()}.html")
    open(tmp, "w").write(f"<!doctype html><html><head><meta charset=utf-8>{FONT}</head><body>{svg}{js}</body></html>")
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True).stdout
    os.remove(tmp)
    return json.loads(re.search(r'<pre id="out">(.*?)</pre>', out, re.S).group(1).replace("&quot;", '"'))

def retag_top(s, fn):
    """Give top-level children new ids: fn(child_markup) -> new id or None (keep)."""
    head, kids, tail = top_children(s)
    out = []
    for k in kids:
        nid = fn(k)
        if nid:
            k = re.sub(r'^(<[a-zA-Z]+)(\s+id="[^"]*")?', lambda m: f'{m.group(1)} id="{nid}"', k, count=1)
        out.append(k)
    return head + "\n".join(out) + "\n" + tail

def insert_before(s, gid, markup):
    i = s.index(f'<g id="{gid}"'); return s[:i] + markup + "\n" + s[i:]

OVERSHOOT = (.34, 1.25, .64, 1)   # pop with a soft overshoot (was 1.56 — too bouncy, 30.09)
APPEAR = E   # 04.10 audit p.8: what merely appears (dots, tags, statuses, badges, callouts) comes in without a bounce —
             # the same spring as every move; OVERSHOOT stays only for a stop after momentum (Blueprints' roulette)

# Pre-redesign hex values still baked into the Assets illustrations → current DS semantic token, per theme
# (resolved from the Base components variables, 2026-09-30)
DS_REMAP = {
    "#1764FF": {"light": "#2563EB", "dark": "#4C7EF0"},   # old semantic/text/blue/normal  → text/blue/normal (links)
    "#586073": {"light": "#364153", "dark": "#A2A6A9"},   # old semantic/text/neutral/subtle → text/neutral/subtle (labels)
    "#CF1322": {"light": "#B91C1C", "dark": "#EA6F6F"},   # old semantic/icon/red/strong     → icon/red/strong/normal
}
def ds_remap(svg, theme):
    body_end = svg.index("<defs>")
    body = svg[:body_end]
    for old, new in DS_REMAP.items():
        body = re.sub(f'"{old}"', f'"{new[theme]}"', body, flags=re.I)
    return body + svg[body_end:]

def base_opacity(svg, eid):
    """The element's own opacity attribute (Figma uses it e.g. for inactive items). CSS animations override the
    attribute, so an animation must end on this value, not on 1."""
    m = re.search(r'<[a-zA-Z]+ id="%s"[^>]*?\sopacity="([\d.]+)"' % re.escape(eid), svg)
    return float(m.group(1)) if m else 1.0
DS_REMAP["#212736"] = {"light": "#030712", "dark": "#F7F7F7"}   # old semantic/text/neutral/strong → text/neutral/strong

# Travel Rule (light) is drawn in off-DS (Untitled UI) colours; its dark twin uses the DS ones — map to the same tokens
DS_REMAP["#EAECF0"] = {"light": "#E5E7EB", "dark": "#2E3033"}   # cell border → border/neutral/subtlest
DS_REMAP["#344054"] = {"light": "#364153", "dark": "#A2A6A9"}   # cell value → text/neutral/subtle
DS_REMAP["#F4EBFF"] = {"light": "#F3E8FF", "dark": "#352D3F"}   # "On hold" pill → status/purple/background
DS_REMAP["#7A5AF8"] = {"light": "#A855F7", "dark": "#6B5395"}   # its dot → icon/purple/subtle
DS_REMAP["#6941C6"] = {"light": "#6B21A8", "dark": "#B7ABCE"}   # its text → status/purple/text
DS_REMAP["#2F6BFF"] = {"light": "#3B82F6", "dark": "#2156CE"}   # shield outline + check → icon/blue/subtle
DS_REMAP["#EAF0FF"] = {"light": "#EFF6FF", "dark": "#152440"}   # shield fill → background/blue/subtlest

def group_span(s, gid):
    """(start, end) of <g id=gid>…</g> with balanced nesting."""
    i = s.index(f'<g id="{gid}"'); depth = 0
    for t in _TAG.finditer(s, i):
        close, name, selfclose = t.group(1), t.group(2), t.group(3)
        if name != "g" or selfclose: continue
        depth += -1 if close else 1
        if depth == 0: return i, t.end()
    raise ValueError(gid)


def flatten_static(svg, map_id, work, S=2):
    """HTML only: bake the static map — every country has its own drop-shadow filter (Networks 105, Travel Rule 60, DI 56)
    — into one transparent image in the map's own place (z-order kept: in dark Networks a node sits under a country).
    Under moving content Chrome re-ran those filters every frame: Networks light played at 24–30 fps on an M-series Mac
    (04.10, audit p.13); baked it is a steady 120. The Lottie already uses a flat plate, so this goes into the page only."""
    png = os.path.join(work, "map.png")
    a, b = group_span(svg, map_id)
    head = re.match(r'<g [^>]*>', svg[a:b]).group(0)
    assert "transform" not in head, "flatten_static: a transformed map group"
    # its content alone: without the group's own blend mode / opacity, which stay on the group around the image
    bare = svg[:a] + f'<g id="{map_id}">' + svg[a + len(head):]
    shoot(bare, png, only=[map_id], transparent=True, S=S)
    x, y, w, h = measure(bare, [map_id])[map_id]
    pad = 12                                                    # the shadows reach past the shapes
    X, Y, W_, H_ = crop(png, x - pad, y - pad, w + 2 * pad, h + 2 * pad)
    uri = "data:image/png;base64," + base64.b64encode(open(png, "rb").read()).decode()
    img = f'<image x="{X / S:g}" y="{Y / S:g}" width="{W_ / S:g}" height="{H_ / S:g}" href="{uri}"/>'
    return svg[:a] + head + img + "</g>" + svg[b:]

def strip_glass(s, gid):
    """Drop Figma backdrop-blur foreignObjects inside a group that will be transformed (Chrome loses their clip)."""
    i, j = group_span(s, gid)
    return s[:i] + re.sub(r'<foreignObject[^>]*>.*?</foreignObject>', '', s[i:j], flags=re.S) + s[j:]

# Slow-down per illustration (30.09: "everything smoother and slower, too fast to make out"): the whole timeline is
# stretched, relative order and hand-offs between events stay as tuned.
TEMPO = {"reusable-kyc": 1.25, "wfb": 1.35, "device-intelligence": 1.75, "case-management": 1.75, "blueprints": 1.6}

TEMPO["non-doc"] = 1.1

# --- Common motion language (02.10, audit point 5): the same kind of element moves the same way in all 16 illustrations.
# Values in REAL seconds and px; a builder reads them in its own story time with motion(NAME) (its TEMPO only spaces the
# story's beats, it no longer changes how a card or a tag moves).
LANG = {
    "rise": 14, "arrive": 0.8, "arrive_fade": 0.4,     # a card / surface arriving from below
    "nudge": -4, "nudge_d": 0.5, "nudge_fade": 0.38,  # a line of content sliding in from the left as its skeleton goes
    "pop": .85, "pop_d": 0.55, "pop_fade": 0.25,      # a status / tag / pill / badge popping in (overshoot ease)
    "glyph": .4, "glyph_d": 0.4, "glyph_fade": 0.2,   # a small glyph popping in: check mark, badge, node dot
    "mark": .6, "mark_d": 0.5, "mark_fade": 0.2,      # an identity mark popping in: avatar, flag, company / document icon
    "row": 6, "row_d": 0.65, "row_fade": 0.38,        # a row of a list joining it from below (signals, answers, rule rows)
}
# Skeleton = the DS token components/skeleton/background-normal (neutral/subtlest) on a white card; on a grey plate
# (neutral/ghost, subtlest) the token is invisible -> one shade darker (neutral/subtler), as in KYB.
SKELETON = {"light": {"card": "#F3F4F6", "plate": "#E5E7EB"}, "dark": {"card": "#26282A", "plate": "#2E3033"}}

class _Motion:
    def __init__(self, k):
        self.RISE, self.NUDGE, self.POP, self.GLYPH = LANG["rise"], LANG["nudge"], LANG["pop"], LANG["glyph"]
        self.D_ARRIVE, self.F_ARRIVE = LANG["arrive"] / k, LANG["arrive_fade"] / k
        self.D_NUDGE, self.F_NUDGE = LANG["nudge_d"] / k, LANG["nudge_fade"] / k
        self.D_POP, self.F_POP = LANG["pop_d"] / k, LANG["pop_fade"] / k
        self.D_GLYPH, self.F_GLYPH = LANG["glyph_d"] / k, LANG["glyph_fade"] / k
        self.MARK, self.D_MARK, self.F_MARK = LANG["mark"], LANG["mark_d"] / k, LANG["mark_fade"] / k
        self.MARK_T = f"scale({self.MARK:g})"
        self.ROW, self.D_ROW, self.F_ROW = LANG["row"], LANG["row_d"] / k, LANG["row_fade"] / k
        self.ROW_T = f"translateY({self.ROW}px)"
        self.ARRIVE = f"translateY({self.RISE}px)"; self.NUDGE_T = f"translateX({self.NUDGE}px)"
        self.POP_T = f"scale({self.POP:g})"; self.GLYPH_T = f"scale({self.GLYPH:g})"

def motion(name, extra=1.0):
    """The common motion language in this builder's story seconds (call after its TEMPO is set; `extra` = a builder's
    own extra stretch of its durations, e.g. Case management's K1)."""
    return _Motion(TEMPO.get(name, 1.0) * extra)

def char_edges(text, x, y, size=14, family="Geist", weight=400):
    """Right edge (x) of every character of a one-line text set at (x, y) — for type-on reveals."""
    svg = (f'<svg width="494" height="354" xmlns="http://www.w3.org/2000/svg"><text id="t" x="{x}" y="{y}" font-family="{family}" '
           f'font-size="{size}" font-weight="{weight}" style="white-space: pre">{text}</text></svg>')
    js = ("<script>document.fonts.ready.then(()=>{const t=document.getElementById('t');const r=[];"
          "for(let i=0;i<t.getNumberOfChars();i++)r.push(+t.getEndPositionOfChar(i).x.toFixed(3));"
          "document.body.innerHTML='<pre id=out>'+JSON.stringify(r)+'</pre>'})</script>")
    tmp = os.path.join(TOOLS, f"_edges-{os.getpid()}.html")
    open(tmp, "w").write(f"<!doctype html><html><head><meta charset=utf-8>{FONT}</head><body>{svg}{js}</body></html>")
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", "file://" + tmp],
                         capture_output=True, text=True).stdout
    os.remove(tmp)
    return json.loads(re.search(r'<pre id="out">(.*?)</pre>', out, re.S).group(1))

def clone_group(markup, prefix, new_id=None):
    """Copy a group: every id gets `prefix`, and url(#…)/href="#…" references to ids defined *inside* the copy are
    remapped too (otherwise the copy keeps using the original's masks/clips — and loses them when the original is hidden)."""
    own = set(re.findall(r'\bid="([^"]+)"', markup))
    out = re.sub(r'\bid="([^"]+)"', lambda m: f'id="{prefix}{m.group(1)}"', markup)
    out = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{prefix}{m.group(1)})' if m.group(1) in own else m.group(0), out)
    out = re.sub(r'(xlink:href|href)="#([^"]+)"', lambda m: f'{m.group(1)}="#{prefix}{m.group(2)}"' if m.group(2) in own else m.group(0), out)
    if new_id:
        out = re.sub(r'^<g id="[^"]+"', f'<g id="{new_id}"', out, count=1)
    return out

def drop_ids(markup, ids):
    """Remove elements (groups or leaves) with the given ids from a markup fragment."""
    for i in ids:
        m = re.search(r'<(g|text|path|rect|image)\s+id="%s"' % re.escape(i), markup)
        if not m: continue
        if m.group(1) == "g":
            a, b = group_span(markup, i)
        else:
            a = m.start(); end = markup.find(">", a)
            b = end + 1 if markup[end - 1] == "/" else markup.index(f"</{m.group(1)}>", a) + len(f"</{m.group(1)}>")
        markup = markup[:a] + markup[b:]
    return markup
TEMPO["questionnaire"] = 1.25

TEMPO["kyb"] = 1.35
TEMPO["tm"] = 1.4

def unclip(svg, top=0, bottom=0, W=494, H=354):
    """For renders of elements that are partly outside the frame in the final state but move into view: drop the
    illustration's root clip and extend the canvas by `top`/`bottom`. Returns (svg, new height); crop with
    `crop(..., y + top, ..., H=new height)` and shift the layer back up by `top`."""
    s = re.sub(r'(<g) clip-path="url\(#clip0_[^"]+\)"', r'\1', svg, count=1)
    H2 = H + top + bottom
    s = s.replace(f'width="{W}" height="{H}" viewBox="0 0 {W} {H}"', f'width="{W}" height="{H2}" viewBox="0 {-top} {W} {H2}"', 1)
    return s, H2

def ease_y(e, x):
    """Progress of cubic-bezier easing `e` at time fraction x (0..1)."""
    x1, y1, x2, y2 = e
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m = (lo + hi) / 2; u = 1 - m
        if 3 * u * u * m * x1 + 3 * u * m * m * x2 + m ** 3 < x: lo = m
        else: hi = m
    m = (lo + hi) / 2; u = 1 - m
    return 3 * u * u * m * y1 + 3 * u * m * m * y2 + m ** 3

def count_ticks(v0, v1, t0, d, ease, tempo, hz=15):
    """A number counting v0 → v1 over [t0, t0 + d] (timeline seconds, stretched by `tempo`) as a display that updates at
    most `hz` times a real second — any faster and the digits strobe into noise (apple-design: keep the per-frame change
    readable). Each update shows the eased value at that moment (big steps early, one by one on the landing); the last
    value lands exactly at t0 + d. Returns [(t, v)], increasing in both, v0 excluded."""
    step = 1 / (hz * tempo)
    out, last, k = [], v0, 1
    while t0 + k * step < t0 + d - 1e-9:
        t = t0 + k * step
        v = v0 + int((v1 - v0) * ease_y(ease, (t - t0) / d) + 1e-9)
        if last < v < v1: out.append((t, v)); last = v
        k += 1
    return out + [(t0 + d, v1)]

_ARITY = {"M": 2, "L": 2, "T": 2, "H": 1, "V": 1, "C": 6, "S": 4, "Q": 4, "A": 7, "Z": 0}
def shift_path(d, dx, dy):
    """An SVG path translated by (dx, dy): absolute commands get shifted, relative ones stay as they are."""
    toks = re.findall(r'[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d)
    out, i, cmd = [], 0, None
    while i < len(toks):
        if toks[i].isalpha(): cmd = toks[i]; out.append(cmd); i += 1; continue
        n = _ARITY[cmd.upper()]; args = [float(v) for v in toks[i:i + n]]; i += n
        if cmd.isupper():
            if cmd == "H": args[0] += dx
            elif cmd == "V": args[0] += dy
            elif cmd == "A": args[5] += dx; args[6] += dy
            else:
                for j in range(0, n, 2): args[j] += dx; args[j + 1] += dy
        out.append(" ".join(f"{v:.4f}".rstrip("0").rstrip(".") for v in args))
        if cmd == "M": cmd = "L"
        elif cmd == "m": cmd = "l"
    return " ".join(out)

GLASS_CLIPS = {}     # fo_id -> (CSS path in the div's coordinates, the original clipPath id)
def glass_css_clip(svg, fo_id):
    """The glass foreignObject's url() clip (Figma's bgblur clipPath) swapped for an inline CSS path() in the div's own
    coordinates — then the glass can travel with its card (a transformed url() clip is lost in Chrome, and the glass must
    not sit inside the card's group: the card's opacity fade would make it the blur's backdrop root). Returns
    (svg, the glass shape's path in frame coordinates)."""
    fo = re.search(r'<foreignObject id="%s"[^>]*>.*?</foreignObject>' % re.escape(fo_id), svg, re.S).group(0)
    cid = re.search(r'clip-path:url\(#([^)]+)\)', fo).group(1)
    cp = re.search(r'<clipPath id="%s"(?: transform="translate\(([-\d.]+)[ ,]+([-\d.]+)\)")?>\s*<(path|rect) ([^>]*?)/?>' % re.escape(cid), svg)
    tx, ty = float(cp.group(1) or 0), float(cp.group(2) or 0)
    if cp.group(3) == "path": d = re.search(r'\bd="([^"]+)"', cp.group(4)).group(1)
    else:                                         # a rounded rect: as a path (arcs)
        g = lambda a, dflt=None: float(re.search(r'\b%s="([-\d.]+)"' % a, cp.group(4)).group(1)) if re.search(r'\b%s="' % a, cp.group(4)) else dflt
        x, y, w, h = g("x", 0), g("y", 0), g("width"), g("height"); r = min(g("rx", 0), w / 2, h / 2)
        d = (f"M{x + r} {y}H{x + w - r}A{r} {r} 0 0 1 {x + w} {y + r}V{y + h - r}A{r} {r} 0 0 1 {x + w - r} {y + h}"
             f"H{x + r}A{r} {r} 0 0 1 {x} {y + h - r}V{y + r}A{r} {r} 0 0 1 {x + r} {y}Z")
    local = shift_path(d, tx, ty)
    GLASS_CLIPS[fo_id] = (local, cid)
    new = fo.replace(f"clip-path:url(#{cid})", "clip-path:path('%s')" % local)
    return svg.replace(fo, new, 1), d

def shape_crop(png, d, box, out, S=2):
    """Like crop(), but only the inside of path `d` (frame coordinates) is kept, the rest transparent — for a glass
    frost that travels with its card (a plain box would carry a patch of the background along). Returns [X, Y, w, h]."""
    x, y, w, h = box
    X, Y, Wd, Hd = [round(v * S) for v in (x, y, w, h)]
    uri = "data:image/png;base64," + base64.b64encode(open(png, "rb").read()).decode()
    js = (f"<script>const I=new Image();I.onload=()=>{{const c=document.createElement('canvas');c.width={Wd};c.height={Hd};"
          f"const g=c.getContext('2d');g.drawImage(I,{-X},{-Y});g.globalCompositeOperation='destination-in';"
          f"g.setTransform({S},0,0,{S},{-X},{-Y});g.fill(new Path2D({json.dumps(d)}));"
          "document.body.innerHTML='<pre id=o>'+c.toDataURL('image/png')+'</pre>'};I.src=" + json.dumps(uri) + ";</script>")
    tmp = os.path.join(TOOLS, f"_sc-{os.getpid()}.html"); open(tmp, "w").write(f"<!doctype html><html><body>{js}</body></html>")
    o = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
    os.remove(tmp)
    open(out, "wb").write(base64.b64decode(re.search(r'base64,([^<]+)</pre>', o).group(1)))
    return [X, Y, Wd, Hd]

def glass_follow(K, pc, fo_id, t, d, frm, blur, fade=0.3, origin="50% 50%", box="fill-box", ease=E):
    """HTML: the glass foreignObject (its clip made CSS by glass_css_clip) rides with its card — the same transform
    keyframes — and comes in as its blur in step with the card's fade. For a scaled card pass its origin in view-box
    coordinates (box="view-box"): the glass's own box is not the card's."""
    K.kf(fo_id + "T", [(0, f"transform:{frm}", None), (pc(t), f"transform:{frm}", ease), (pc(t + d), "transform:none", None)])
    K.rule("#" + fo_id, f"transform-box:{box};transform-origin:{origin};animation:{fo_id}T {K.dur}")
    K.kf(fo_id, [(0, "backdrop-filter:blur(0px)", None), (pc(t), "backdrop-filter:blur(0px)", E), (pc(t + fade), f"backdrop-filter:blur({blur:g}px)", None)])
    K.rule(f"#{fo_id}>div", f"animation:{fo_id} {K.dur}{glass_end_clip(K, fo_id)}")

def glass_end_clip(K, fo_id):
    """The still frame gets the glass's original url() clip back (exactly the file's edge); returns the extra animation."""
    local, cid = GLASS_CLIPS[fo_id]
    K.kf(fo_id + "Clip", [(0, "clip-path:path('%s')" % local, "steps(1,end)"), (99.99, f"clip-path:url(#{cid})", None)])
    return f",{fo_id}Clip {K.dur}"

def lift_path(d, dy, ycut):
    """The path with every point at or below ycut moved by dy: the bottom corners ride as one piece, the sides shorten —
    a growing/opening rounded surface with its real corners (same commands, so CSS can interpolate it)."""
    toks = re.findall(r'[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d); out, i, cmd = [], 0, None
    while i < len(toks):
        if toks[i].isalpha(): cmd = toks[i]; out.append(cmd); i += 1; continue
        n = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "Z": 0}[cmd]; a = [float(v) for v in toks[i:i + n]]; i += n
        if cmd == "V": a = [a[0] + dy if a[0] >= ycut else a[0]]
        elif cmd != "H": a = [v + dy if j % 2 and v >= ycut else v for j, v in enumerate(a)]
        out.append(" ".join(f"{v:.4f}".rstrip("0").rstrip(".") for v in a))
        if cmd == "M": cmd = "L"
    return " ".join(out)

def path_max_y(d):
    return max(float(v) - 1e6 for v in re.findall(r'[-\d.]+', lift_path(d, 1e6, -1e9)) if float(v) > 5e5)

def text_metrics(items, family="Geist"):
    """Tight metrics of one-line strings: items = [(text, weight, size, letter_spacing)] →
    [{"left", "right", "ascent", "descent", "advance"}] (canvas measureText; left/right from the origin, ascent above the
    baseline). To set a string so that its glyphs start at L with the baseline at B: x = L + left, y = B."""
    js = ("<script>Promise.all(%s.map(i=>document.fonts.load(i[1]+' '+i[2]+'px %s'))).then(()=>{const c=document.createElement('canvas').getContext('2d');"
          "const r=%s.map(([t,w,s,ls])=>{c.font=w+' '+s+'px %s';c.letterSpacing=ls+'px';const m=c.measureText(t);"
          "return {left:m.actualBoundingBoxLeft,right:m.actualBoundingBoxRight,ascent:m.actualBoundingBoxAscent,descent:m.actualBoundingBoxDescent,advance:m.width}});"
          "document.body.innerHTML='<pre id=out>'+JSON.stringify(r)+'</pre>'})</script>") % (json.dumps(items), family, json.dumps(items), family)
    tmp = os.path.join(TOOLS, f"_tm-{os.getpid()}.html")
    open(tmp, "w").write(f"<!doctype html><html><head><meta charset=utf-8>{FONT}</head><body>{js}</body></html>")
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
    os.remove(tmp)
    return json.loads(re.search(r'<pre id="out">(.*?)</pre>', out, re.S).group(1).replace("&quot;", '"'))

def text_at(tid, text, weight, size, ls, color, left, baseline, metrics):
    """<text> whose glyphs start at `left` (tight edge) on `baseline`; `metrics` from text_metrics for the same string."""
    return (f'<text id="{tid}" x="{left + metrics["left"]:.2f}" y="{baseline:.2f}" font-family="Geist" font-size="{size}" '
            f'font-weight="{weight}" letter-spacing="{ls}px" fill="{color}" style="white-space: pre">{text}</text>')
