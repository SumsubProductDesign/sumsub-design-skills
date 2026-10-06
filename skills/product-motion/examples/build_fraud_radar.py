# Fraud radar promo (v3), plays once: a radar sweep from the middle of the bottom edge (the centre of the rings on the
# background) passes three times, left to right (a white beam with a fading trail, fainter away from the centre); on each
# pass it picks up one more blip — 45 applicants (Requires action), 98 (Pending), 314 (Rejected);
# from each blip its callout grows (popping up from its pointer), the applicant count runs up from zero as the avatar
# stack fans out, and the status (DS skeleton until then) resolves when the count lands. In the 314 callout the reasons
# resolve one by one while it counts — Fraudulent patterns, Bad proof of identity, Blocklist, Age requirement mismatch,
# the dividers running from one to the next — and "Rejected" comes with the last one. Freezes on the original frame.
# usage: python3 build_fraud_radar.py [light|dark]
import os, sys, re, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "fraud-radar", "Fraud radar"
TEMPO[NAME] = 1.3
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, f"src-{NAME}.svg" if THEME == "light" else f"src-{NAME}-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py

# --- structure: three blips, each with a callout (glass blur as a sibling foreignObject that stays put) ---
C = ["c45", "c98", "c314"]                       # in the order the sweep picks them up
svg = rename(svg, {"applicants": "c45", "applicants_4": "c98", "Ellipse 4044": "d45", "Ellipse 4044_2": "d314", "Ellipse 4044_3": "d98",
                   "Rectangle 240648663": "a45f", "Rectangle 240648661": "a45m", "Rectangle 240648664": "a45b",
                   "Rectangle 240648663_2": "a314f", "Rectangle 240648661_2": "a314m", "Rectangle 240648664_2": "a314b",
                   "Rectangle 240648663_3": "a98f", "Rectangle 240648661_3": "a98m", "Rectangle 240648664_3": "a98b",
                   "314": "n45", "314_2": "n314", "98": "n98", "applicants_2": "w45", "applicants_3": "w314", "applicants_5": "w98",
                   "*Status*": "s45", "*Status*_2": "s314", "*Status*_3": "s98",
                   "*Tag Colorful*": "tg1", "*Tag Colorful*_2": "tg2", "*Tag Colorful*_3": "tg3", "*Tag Colorful*_4": "tg4",
                   "Divider Line": "dv1", "Divider Line_2": "dv2", "Divider Line_3": "dv3"})
# the 314 callout: glass frame + the two cards, one group
a_ = group_span(svg, "Frame 2147239070")[0]; b_ = group_span(svg, "Frame 2147239069")[1]
svg = svg[:a_] + '<g id="c314">' + svg[a_:b_] + "</g>" + svg[b_:]
# each callout's glass foreignObject moves out, just before it (same paint order); it stays put, its blur fades in
for c, fx in (("c45", "278"), ("c314", "46"), ("c98", "198")):
    fo = re.search(r'<foreignObject x="%s" y="[\d.]+"[^>]*>.*?</foreignObject>' % fx, svg, re.S).group(0)
    svg = svg.replace(fo, "", 1)
    svg = svg.replace(f'<g id="{c}">', fo.replace("<foreignObject ", f'<foreignObject id="g{c[1:]}" ', 1) + f'<g id="{c}">', 1)
GLASS = ["g45", "g314", "g98"]
GSHAPE = {}
for k in GLASS: svg, GSHAPE[k] = glass_css_clip(svg, k)   # the glass grows with its callout (from the same pointer tip)
M0 = measure(svg, C + ["d45", "d314", "d98", "Union", "Union_2", "Union_3"] + [f"{p}{c[1:]}" for c in C for p in ("n", "w", "s", "a")[:3]]
             + [f"a{c[1:]}{q}" for c in C for q in "fmb"] + ["tg1", "tg2", "tg3", "tg4", "dv1", "dv2", "dv3"])
N = {"c98": 98, "c45": 45, "c314": 314}
DOT = {c: "d" + c[1:] for c in C}
UNION = {"c45": "Union", "c314": "Union_2", "c98": "Union_3"}
TIP = {c: (M0[DOT[c]][0] + M0[DOT[c]][2] / 2, M0[UNION[c]][1] + M0[UNION[c]][3]) for c in C}   # pointer tip, above its blip

# the count: Geist Medium 11.35 (the callout's scale) in tabular figures so it does not jitter, LEFT-aligned on the final
# number's left edge, like ordinary text: it grows to the right and "applicants" moves along with it (04.10, audit p.14:
# right-aligned it grew leftwards, into the photo stack fanning out towards it); the last value is the original number
FS, FW = 11.35, 500
NCOL = {c: re.search(r'<path id="n%s"[^>]*fill="([^"]+)"' % c[1:], svg).group(1) for c in C}
MF = text_metrics([(str(N[c]), FW, FS, 0) for c in C])
NUM_IDS = {}
for c, mf in zip(C, MF):
    x, y, w, h = M0["n" + c[1:]]
    xs = x + mf["left"]                                         # the final string's origin: glyphs from the final number's left edge
    base = y + mf["ascent"]
    NUM_IDS[c] = [f"n{c[1:]}_{v}" for v in range(N[c])]
    txt = "".join(f'<text id="n{c[1:]}_{v}" x="{xs:.3f}" y="{base:.3f}" font-family="Geist" font-size="{FS}" font-weight="{FW}" '
                  f'fill="{NCOL[c]}" style="white-space:pre;font-variant-numeric:tabular-nums">{v}</text>' for v in range(N[c]))
    svg = svg.replace(f'<path id="n{c[1:]}"', txt + f'<path id="n{c[1:]}"', 1)

# loading state, DS skeleton: the statuses' pills, the reasons' tags
SKC = SKELETON[THEME]["card"]                       # on the white callouts: the DS skeleton token (motionlib.SKELETON)
def radius(k):
    m = re.search(r'<g id="%s">\s*<path d="M([\d.]+) [\d.]+H([\d.]+)C[\d.]+ [\d.]+ ([\d.]+)' % re.escape(k), svg)
    return float(m.group(3)) - float(m.group(2))
SKB = {k: (M0[k], min(radius(k), M0[k][3] / 2)) for k in ["s98", "s45", "s314", "tg1", "tg2", "tg3", "tg4"]}
def skel(k):
    (x, y, w, h), r = SKB[k]
    return f'<rect id="sk_{k}" x="{x:.3f}" y="{y:.3f}" width="{w:.3f}" height="{h:.3f}" rx="{r:.3f}" fill="{SKC}"/>'
for c in C:
    k = "s" + c[1:]; svg = svg.replace(f'<g id="{k}">', f'<g id="skP_{k}">{skel(k)}</g><g id="{k}">', 1)
svg = svg.replace('<g id="tg1">', '<g id="skP_tg">' + "".join(skel(f"tg{i}") for i in range(1, 5)) + '</g><g id="tg1">', 1)
# --- the radar sweep: a white beam with a trail fading smoothly behind it and towards the top (a sector image rendered by
# canvas, turned about its corner = the radar's centre); under the blips and callouts ---
# The rings on the background are concentric circles about a centre far below the frame (fitted: (226, 795), r 734 / 624 /
# 515, rms 0.7 px), so the beam turns about that same centre and its trail runs along the rings (design review: "let it
# sweep along the circle too … with a smooth fade"; it used to turn about the bottom edge's middle — a flat wedge)
SWC = (226, 795)                                  # the rings' centre
RW = 850                                          # past the farthest corner (839)
R_IN = SWC[1] - 354                               # the frame's bottom edge: the trail is full from here and fades out to RW
SPAN = 25                                         # the trail, degrees behind the beam
BEAM = 30                                         # the beam's angle in the image (clockwise from 12 o'clock)
A_TRAIL, A_BEAM = {"light": (0.75, 1.0), "dark": (0.3, 0.6)}[THEME]
CORNERS = [math.degrees(math.atan2(x - SWC[0], SWC[1] - y)) for x, y in ((0, 0), (0, 354), (494, 0), (494, 354))]
A_L, A_R = min(CORNERS), max(CORNERS)             # the angles the frame spans
W_SW = 80                                         # °/s on the visible arc (story time; was 92 — design review "make it smoother": a calmer pass)
# motion blur: the beam turns ~1° a frame (≈14 px at the top edge), so a thin line strobes. Smear its light over 2.5 frames
# of travel behind it and soften the front over one frame (smoothstep profile, no hard edge) — 05.10
F_DEG = W_SW / TEMPO[NAME] / 60                   # degrees the beam turns in one real frame at 60 fps
BEAM_BLUR, BEAM_LEAD = 2.5 * F_DEG, 1.0 * F_DEG
W_IMG = math.ceil(RW * math.sin(math.radians(BEAM + BEAM_LEAD + 1)))   # the image only as wide as the sector
import base64, json
def sweep_png(out, S_=2):
    js = f'''<canvas id=c width={W_IMG * S_} height={RW * S_}></canvas><script>
const c=document.getElementById('c'),g=c.getContext('2d'),R={RW * S_},WI={W_IMG * S_},RI={R_IN * S_},px=0,py=R,rad=d=>d*Math.PI/180;
const a0=rad({BEAM - SPAN - 90}),cg=g.createConicGradient(a0,px,py);
for(let i=0;i<=20;i++){{const u=i/20;cg.addColorStop(u*{SPAN}/360,`rgba(255,255,255,${{({A_TRAIL}*Math.pow(u,1.6)).toFixed(4)}})`)}}
cg.addColorStop({SPAN}/360+0.0001,'rgba(255,255,255,0)');cg.addColorStop(1,'rgba(255,255,255,0)');
g.fillStyle=cg;g.fillRect(0,0,WI,R);
g.globalCompositeOperation='destination-in';const rg=g.createRadialGradient(px,py,0,px,py,R);
rg.addColorStop(0,'rgba(0,0,0,1)');for(let i=0;i<=20;i++){{const u=i/20;rg.addColorStop((RI+(R-RI)*u)/R,`rgba(0,0,0,${{Math.pow(1-u,1.2).toFixed(4)}})`)}}
g.fillStyle=rg;g.fillRect(0,0,WI,R);
g.globalCompositeOperation='source-over';
const b=document.createElement('canvas');b.width=WI;b.height=R;const h=b.getContext('2d');
const bg=h.createConicGradient(rad({BEAM - BEAM_BLUR - 90}),px,py),ss=u=>u*u*(3-2*u),PK={0.6 * A_BEAM};
for(let i=0;i<=16;i++){{const u=i/16;bg.addColorStop(u*{BEAM_BLUR}/360,`rgba(255,255,255,${{(PK*ss(u)).toFixed(4)}})`)}}
for(let i=1;i<=8;i++){{const u=i/8;bg.addColorStop(({BEAM_BLUR}+u*{BEAM_LEAD})/360,`rgba(255,255,255,${{(PK*(1-ss(u))).toFixed(4)}})`)}}
bg.addColorStop(1,'rgba(255,255,255,0)');
h.fillStyle=bg;h.fillRect(0,0,WI,R);
h.globalCompositeOperation='destination-in';const br=h.createRadialGradient(px,py,0,px,py,R);
br.addColorStop(0,'rgba(0,0,0,1)');br.addColorStop(RI/R,'rgba(0,0,0,1)');br.addColorStop(1,'rgba(0,0,0,0.15)');h.fillStyle=br;h.fillRect(0,0,WI,R);
g.drawImage(b,0,0);
document.body.innerHTML='<pre id=o>'+c.toDataURL('image/png')+'</pre>';</script>'''
    tmp = os.path.join(TOOLS, f"_sweep-{os.getpid()}.html"); open(tmp, "w").write(f"<!doctype html><html><body>{js}</body></html>")
    o = subprocess.run([CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", "file://" + tmp], capture_output=True, text=True).stdout
    os.remove(tmp)
    open(out, "wb").write(base64.b64decode(re.search(r'base64,([^<]+)</pre>', o).group(1)))
sweep_png(f"{WORK}/sweep.png", S_=1)        # a soft gradient: 1x is enough (4x lighter page, audit p.13); drawn at its full size
SWEEP_URI = "data:image/png;base64," + base64.b64encode(open(f"{WORK}/sweep.png", "rb").read()).decode()
svg, n_ = re.subn(r'(<image id="bg"[^>]*/>)', r'\1' + f'<image id="sweep" x="{SWC[0]}" y="{SWC[1] - RW}" width="{W_IMG}" height="{RW}" href="{SWEEP_URI}"/>', svg, count=1)
assert n_ == 1
# the halo (as on Device intelligence's active pin): two rings of the blip's red running out of it as its callout opens
RIP_R, RIP_X = 4, 6
for c in C:
    d = DOT[c]; cm = re.search(r'<circle id="%s" cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" fill="([^"]+)"/>' % d, svg)
    rings = "".join(f'<circle id="rp{c[1:]}_{n}" cx="{cm.group(1)}" cy="{cm.group(2)}" r="{RIP_R}" fill="none" stroke="{cm.group(3)}" '
                    f'stroke-width="1.2" vector-effect="non-scaling-stroke"/>' for n in (1, 2))
    svg = svg.replace(cm.group(0), cm.group(0) + rings, 1)
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)

TAGS = ["tg1", "tg2", "tg3", "tg4"]; DIVS = ["dv1", "dv2", "dv3"]
SKS = ["s98", "s45", "s314"] + TAGS
ANIM = ["sweep"] + GLASS + [f"rp{c[1:]}_{n}" for c in C for n in (1, 2)] + C + list(DOT.values()) + [f"a{c[1:]}{q}" for c in C for q in "fmb"] + ["s98", "s45", "s314", "n98", "n45", "n314"] + TAGS + DIVS \
       + [f"sk_{k}" for k in SKS] + ["skP_s98", "skP_s45", "skP_s314", "skP_tg"] + sum(NUM_IDS.values(), [])
for k in ANIM:     # a CSS transform/opacity animation would override these attributes
    tag = re.search(r'<[a-zA-Z]+ id="%s"[^>]*>' % re.escape(k), svg).group(0)
    assert ' transform=' not in tag and ' opacity=' not in tag, (k, tag[:140])
M = measure(svg, C + GLASS + list(DOT.values()) + ["s98", "s45", "s314", "n98", "n45", "n314", "w98", "w45", "w314"] + TAGS + DIVS + [f"a{c[1:]}{q}" for c in C for q in "fmb"])

# --- timeline, seconds (stretched by TEMPO) ---
MV = motion(NAME)                                # the common motion language (motionlib.LANG)
D_DOT, D_POP, D_FAN = 0.3, MV.D_POP, 0.45
# three passes, left to right: the beam comes in from behind the left edge, sweeps across along the rings and leaves behind
# the right edge, its trail after it; out of sight (the centre is below the frame) it swings round quickly to the start of
# the next pass. On each pass one more blip lights up just behind the beam
A_IN, A_OUT = A_L - BEAM_LEAD - 0.5, A_R + SPAN + 0.5   # the visible arc: beam in on the left … trail gone on the right
D_VIS = (A_OUT - A_IN) / W_SW
D_BACK = 0.18                                    # the rest of the turn, unseen
P_SW = D_VIS + D_BACK
t_sw0 = 0.1
T_PASS = [t_sw0 + i * P_SW for i in range(3)]
ANG = {c: math.degrees(math.atan2(M0[DOT[c]][0] + M0[DOT[c]][2] / 2 - SWC[0], -(M0[DOT[c]][1] + M0[DOT[c]][3] / 2 - SWC[1]))) for c in C}
T_DOT = {c: T_PASS[i] + (ANG[c] - A_IN) / W_SW + 0.04 for i, c in enumerate(C)}
SW_KEYS = [(0, A_IN)]
for i, tp in enumerate(T_PASS):
    SW_KEYS += [(tp, A_IN + 360 * i), (tp + D_VIS, A_OUT + 360 * i)] + ([(tp + P_SW, A_IN + 360 * (i + 1))] if i < 2 else [])
t_sw_end = T_PASS[-1] + D_VIS
# one blip, three beats (not all within 0.4 s): the blip lights up (no bounce) → a beat later the callout grows out of
# it with its halo → once the callout is open, the count runs and the photos fan out
T_POP = {c: T_DOT[c] + 0.25 for c in C}          # the callout pops up from its pointer, above the blip
T_CNT = {c: T_POP[c] + 0.4 for c in C}            # the count runs…
D_CNT = {"c98": 0.8, "c45": 0.6, "c314": 1.1}
T_ST = {c: T_CNT[c] + D_CNT[c] for c in C}
T_RIP = {c: (T_POP[c], T_POP[c] + 0.23) for c in C}; D_RIP = 1.2; E_RIP = (.2, .6, .35, 1)       # …the status resolves as it lands
R = [T_CNT["c314"] + 0.1 + i * (D_CNT["c314"] - 0.1) / 3 for i in range(4)]   # the reasons, the last one with the status
T = T_ST["c314"] + D_POP + 0.35
LIN = (0, 0, 1, 1)
assert t_sw_end < T
T = math.ceil(T * TEMPO[NAME] * 60 - 1e-6) / (60 * TEMPO[NAME])
pc = lambda t: round(t / T * 100, 3)
STEP = "steps(1,end)"
PULSE = (.4, 0, .6, 1)
t_p0 = T_POP["c45"] + 0.3
NP = max(1, round((T - t_p0) * TEMPO[NAME] / 0.9)); PP = (T - t_p0) / NP
def bez(e, s):
    x1, y1, x2, y2 = e; u = 1 - s
    return 3 * u * u * s * x1 + 3 * u * s * s * x2 + s ** 3, 3 * u * u * s * y1 + 3 * u * s * s * y2 + s ** 3
def time_at(e, target):
    lo, hi = 0.0, 1.0
    for _ in range(60):
        m_ = (lo + hi) / 2
        if bez(e, m_)[1] < target: lo = m_
        else: hi = m_
    return bez(e, (lo + hi) / 2)[0]
TK = {c: {v: t for t, v in count_ticks(0, N[c], T_CNT[c], D_CNT[c], E, TEMPO[NAME])} for c in C}   # ≤15 updates/s (readable)
DIG = {c: len(str(N[c])) for c in C}
ADV = {c: mf["advance"] / DIG[c] for c, mf in zip(C, MF)}      # tabular figures: one digit's advance
def label_shift(c):
    """[(t, x offset)]: "applicants" a digit's advance to the left for every digit the count still lacks; with the first
    value of k digits it steps one digit to the right, in the same frame (as text reflows: no gap, no overlap; an eased
    move left a gap or ran into the new digit). 0 at the end = its place in the file."""
    ks = [(None, -(DIG[c] - 1) * ADV[c])]
    for k in range(2, DIG[c] + 1):
        ks.append((min(t for v, t in TK[c].items() if len(str(v)) == k), -(DIG[c] - k) * ADV[c]))
    return ks
BLUR = {k: float(re.search(r'<foreignObject id="%s".*?blur\(([\d.]+)px\)' % k, svg, re.S).group(1)) for k in GLASS}
T_GLASS = {"g" + c[1:]: T_POP[c] + D_POP for c in C}
FAN = {}                                         # the stack fans out from behind the front photo while it counts
for c in C:
    fx = M0[f"a{c[1:]}f"][0] + M0[f"a{c[1:]}f"][2] / 2
    for q, dt in (("m", 0.15), ("b", 0.35)):
        k = f"a{c[1:]}{q}"; FAN[k] = (T_CNT[c] + dt, fx - (M0[k][0] + M0[k][2] / 2))

# ---------- HTML ----------
K = Keyframes(T * TEMPO[NAME], 100)
def move(name, t, d, frm, origin="50% 50%", box="fill-box", ease=E, fade=None):
    a0 = f"opacity:0;transform:{frm}"
    frames = [(0, a0, None), (pc(t), a0, ease)]
    if fade: frames.append((pc(t + fade), "opacity:1", None))
    frames.append((pc(t + d), "opacity:1;transform:none", None))
    K.kf(name, frames)
    K.rule("#" + name, f"transform-box:{box};transform-origin:{origin};animation:{name} {K.dur}")
def fade(name, t, d, v0, v1, static=None):
    K.kf(name, [(0, f"opacity:{v0}", None), (pc(t), f"opacity:{v0}", E), (pc(t + d), f"opacity:{v1}", None)])
    K.rule("#" + name, (f"opacity:{static};" if static is not None else "") + f"animation:{name} {K.dur}")
def pop(name, t, d):                # a blip lights up: grows in at once, no bounce (it is a dot, not a thrown object)
    K.kf(name, [(0, "transform:scale(0)", None), (pc(t), "transform:scale(0)", E), (pc(t + d), "transform:none", None)])
    K.rule("#" + name, f"transform-box:fill-box;transform-origin:50% 50%;animation:{name} {K.dur}")
for c in C:
    pop(DOT[c], T_DOT[c], D_DOT)
    move(c, T_POP[c], D_POP, MV.POP_T, origin=f"{TIP[c][0]:.3f}px {TIP[c][1]:.3f}px", box="view-box", ease=APPEAR, fade=MV.F_POP)
    move("s" + c[1:], T_ST[c], MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
    fade("sk_s" + c[1:], T_ST[c], 0.2, 1, 0, static=0)
    TKd = TK[c]
    for v in range(N[c] + 1):
        nid = f"n{c[1:]}" if v == N[c] else f"n{c[1:]}_{v}"
        if v and v not in TKd: K.rule("#" + nid, "opacity:0"); continue      # a value the display steps over
        tin = TKd.get(v); later = [u for u in TKd if u > v]; tout = TKd[min(later)] if later else None
        fr = [(0, "opacity:%d" % (1 if tin is None else 0), STEP)]
        if tin is not None: fr.append((pc(tin), "opacity:1", STEP))
        if tout is not None: fr.append((pc(tout), "opacity:0", None))
        K.kf(nid, fr); K.rule("#" + nid, ("" if v == N[c] else "opacity:0;") + f"animation:{nid} {K.dur}")
for c in C:                                     # "applicants" stands after the count: one digit to the right as each digit comes
    ks = label_shift(c)
    fr = [(0, f"transform:translateX({ks[0][1]:.3f}px)", STEP)]            # steps with the digit itself, as text reflows
    for t, off in ks[1:]: fr += [(pc(t), f"transform:translateX({off:.3f}px)", STEP)]
    K.kf("w" + c[1:], fr); K.rule("#w" + c[1:], f"animation:w{c[1:]} {K.dur}")
K.kf("sweepR", [(pc(t), f"transform:rotate({a - BEAM:.3f}deg)", LIN) for t, a in SW_KEYS])
K.kf("sweepO", [(0, "opacity:1", STEP), (pc(t_sw_end), "opacity:0", None)])      # out of sight by then; hidden for the still frame
K.rule("#sweep", f"opacity:0;transform-box:view-box;transform-origin:{SWC[0]}px {SWC[1]}px;animation:sweepR {K.dur},sweepO {K.dur}")
for c in C:
    for n, t in zip((1, 2), T_RIP[c]):
        k = f"rp{c[1:]}_{n}"
        K.kf(k, [(0, "opacity:0;transform:none", None), (pc(t) - 0.2, "opacity:0;transform:none", None), (pc(t), "opacity:.6;transform:none", E_RIP),
                 (pc(t + D_RIP), f"opacity:0;transform:scale({RIP_X})", None)])
        K.rule("#" + k, f"opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:{k} {K.dur}")
for k, (t, dx) in FAN.items():
    K.kf(k, [(0, f"transform:translateX({dx:.3f}px)", None), (pc(t), f"transform:translateX({dx:.3f}px)", E), (pc(t + D_FAN), "transform:none", None)])
    K.rule("#" + k, f"animation:{k} {K.dur}")
for c in C:                                     # the glass grows out of the blip with its callout, its blur in step with the fade
    glass_follow(K, pc, "g" + c[1:], T_POP[c], D_POP, MV.POP_T, BLUR["g" + c[1:]], fade=MV.F_POP,
                 origin=f"{TIP[c][0]:.3f}px {TIP[c][1]:.3f}px", box="view-box", ease=APPEAR)
fr = [(0, "opacity:1", None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; fr += [(pc(a_), "opacity:1", PULSE), (pc(a_ + PP / 2), "opacity:.5", PULSE)]
K.kf("pulse", fr + [(100, "opacity:1", None)])
K.rule("#skP_s98,#skP_s45,#skP_s314,#skP_tg", f"animation:pulse {K.dur}")
for i, (k, t) in enumerate(zip(TAGS, R)):
    fade("sk_" + k, t, 0.2, 1, 0, static=0)
    move(k, t, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)      # the reasons' tags pop in (tags pop everywhere)
for i, k in enumerate(DIVS):                     # each divider runs from one resolved reason to the next, reaching it as it resolves
    t0 = R[i] + 0.05
    K.kf(k, [(0, "transform:scaleX(0)", None), (pc(t0), "transform:scaleX(0)", E), (pc(R[i + 1]), "transform:none", None)])
    K.rule("#" + k, f"transform-box:fill-box;transform-origin:0 50%;animation:{k} {K.dur}")
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. The radar sweep passes three times, picking up one more blip each pass; from each the "
         "applicant count runs up and the status resolves; for the 314 rejected the reasons resolve one by one.", svg, K.text(), T)
print(THEME, "html", n // 1024, "KB", f"T={K.T:.2f}s")
if "--html" in sys.argv: sys.exit()

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
L.frac = True
AN = L.anim
RIPS = [f"rp{c[1:]}_{n}" for c in C for n in (1, 2)]
shoot(svg, f"{WORK}/plate.png", hide=GLASS + C + list(DOT.values()) + ["sweep"] + RIPS); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
NOSH = "[filter]{filter:none!important}"
def render(k, box, pad, only=None, hide=(), css=""):
    x, y, w, h = box
    shoot(svg, f"{WORK}/{k}.png", only=only or [k], hide=hide, transparent=True, css=css)
    geo[k] = crop(f"{WORK}/{k}.png", x - pad, y - pad, w + 2 * pad, h + 2 * pad)
LIVE = {c: [f"a{c[1:]}{q}" for q in "fmb"] + ["s" + c[1:], "skP_s" + c[1:], "n" + c[1:], "w" + c[1:]] + NUM_IDS[c] for c in C}
LIVE["c314"] += TAGS + DIVS + ["skP_tg"]
for c in C:
    render(c + "Base", M[c], 8, only=[c], hide=LIVE[c])
    for q in "fmb": render(f"a{c[1:]}{q}", M[f"a{c[1:]}{q}"], 2, css=NOSH)
    render("s" + c[1:], M["s" + c[1:]], 2, css=NOSH)
    render("n" + c[1:], M["n" + c[1:]], 2, css=NOSH)
    render("w" + c[1:], M["w" + c[1:]], 2, css=NOSH)
for k in TAGS: render(k, M[k], 2, css=NOSH)
# the counts: only the values that are on screen at some frame (the rest flash by between two frames), as a sheet
VIS = {}
for c in C:
    seen = []
    for f in range(L.OP + 1):
        t = f / (60 * TEMPO[NAME]); v = max([0] + [u for u, tu in TK[c].items() if tu <= t + 1e-9])
        if v not in seen and v < N[c]: seen.append(v)
    VIS[c] = seen
RS = 20
# set on the card's own colour: light text rendered on a transparent canvas comes out thinner (no contrast boost)
CARD_BG = re.search(r'<g id="illustration"[^>]*>\s*<path d="[^"]+" fill="([^"]+)"', svg).group(1)
# the count is left-aligned on the final number's left edge and grows to the right (audit p.14), in tabular figures —
# wider than the final proportional "314": the crop box starts at the left edge and fits three tabular digits + AA
# (05.10: it was still anchored to the right edge and cut the last digit of "169", "303", "313")
NB = lambda c: (M["n" + c[1:]][0] - 2, M["n" + c[1:]][1] - 3, 28, M["n" + c[1:]][3] + 6)
rows, ri = [], {}
for c in C:
    for v in VIS[c]:
        ri[(c, v)] = len(rows)
        bx, by, bw, bh = NB(c)
        rows.append(f'<g transform="translate(0 {len(rows) * RS})"><rect x="{bx:.3f}" y="{by:.3f}" width="{bw}" height="{bh:.3f}" fill="{CARD_BG}"/>' + re.search(r'<text id="n%s_%d".*?</text>' % (c[1:], v), svg).group(0).replace(f'id="n{c[1:]}_{v}"', "") + "</g>")
HS = 354 + len(rows) * RS
shoot(f'<svg width="494" height="{HS}" viewBox="0 0 494 {HS}" fill="none" xmlns="http://www.w3.org/2000/svg"><g>{"".join(rows)}</g></svg>',
      f"{WORK}/nsheet.png", transparent=True, H=HS)
for (c, v), i in ri.items():
    bx, by, bw, bh = NB(c); k = f"n{c[1:]}_{v}"
    subprocess.run(["cp", f"{WORK}/nsheet.png", f"{WORK}/{k}.png"])
    geo[k] = crop(f"{WORK}/{k}.png", bx + 0.5, by + 0.5 + i * RS, bw - 1, bh - 1, H=HS)     # inside the backing rect
    geo[k][1] -= i * RS * S
shoot(svg, f"{WORK}/frost.png", hide=C + list(DOT.values()) + ["sweep"] + RIPS)
for k in GLASS: geo[k + "F"] = shape_crop(f"{WORK}/frost.png", GSHAPE[k], M[k], f"{WORK}/{k}F.png")   # the frost, glass-shaped
def img(k):
    X, Y, w, h = geo[k]; L.image(k, f"{WORK}/{k}.png", w, h); return X, Y, w, h
def keyed(v0, v1, t, d, ease=E):
    return AN([(0, v0, None), (pc(t), v0, ease), (pc(t + d), v1, None)])
hexc = lambda h: [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
TRF = lambda o=None: {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": o or st(100)}
grp = lambda items, o=None: [{"ty": "gr", "it": items + [TRF(o)]}]
pk = [(0, [100], None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; pk += [(pc(a_), [100], PULSE), (pc(a_ + PP / 2), [50], PULSE)]
def pop_layer(k, t, d, s0, ease, fade):
    X, Y, w, h = img(k)
    L.layer(2, k, L.ks(a=(w / 2, h / 2), p=(X + w / 2, Y + h / 2), s=keyed([s0, s0, 100], [100, 100, 100], t, d, ease),
            o=keyed([0], [100], t, fade, ease)), refId=k)
def slide_layer(k, t, d, dx, fade=None):
    X, Y, w, h = img(k)
    L.layer(2, k, L.ks(p=keyed([X + dx * S, Y, 0], [X, Y, 0], t, d), o=keyed([0], [100], t, fade) if fade else None), refId=k)
def sk_shapes(keys, outs):
    sh = []
    for k in keys:
        (x, y, w, h), r = SKB[k]
        sh += grp([{"ty": "rc", "p": st([(x + w / 2) * S, (y + h / 2) * S]), "s": st([w * S, h * S]), "r": st(r * S)},
                   {"ty": "fl", "c": st(hexc(SKC)), "o": st(100), "r": 1}], o=keyed([100], [0], outs[k], 0.2))
    return sh
DVC = re.search(r'<g id="dv1">\s*<rect[^>]*fill="([^"]+)"', svg).group(1)
# layers, top first: per callout (98, 314, 45 — the file's order reversed) its precomp above its blip; glass; background
for c in ("c98", "c314", "c45"):
    MAIN = L.layers; L.layers = []
    pop_layer("s" + c[1:], T_ST[c], MV.D_POP, MV.POP * 100, APPEAR, MV.F_POP)
    L.layer(4, "skeleton", L.ks(o=AN(pk + [(100, [100], None)])), shapes=sk_shapes(["s" + c[1:]], {"s" + c[1:]: T_ST[c]}))
    # "applicants", moving along with the count — above the numbers (they sit on card-coloured plates)
    wk = "w" + c[1:]; X, Y, w, h = img(wk); ks = label_shift(c)
    lk = [(0, [X + ks[0][1] * S, Y, 0], "h")]
    for t, off in ks[1:]: lk += [(pc(t), [X + off * S, Y, 0], "h")]
    L.layer(2, wk, L.ks(p=AN(lk)), refId=wk)
    for v in [N[c]] + VIS[c][::-1]:
        k = f"n{c[1:]}" if v == N[c] else f"n{c[1:]}_{v}"
        X, Y, w, h = img(k)
        if v == N[c]: o = AN([(0, [0], "h"), (pc(TK[c][v]), [100], None)])
        else:
            nxt = [u for u in VIS[c] if u > v] + [N[c]]; t_out = TK[c][nxt[0]]
            o = AN(([(0, [100], "h")] if v == 0 else [(0, [0], "h"), (pc(TK[c][v]), [100], "h")]) + [(pc(t_out), [0], None)])
        L.layer(2, k, L.ks(p=(X, Y), o=o), refId=k)
    if c == "c314":
        for k, t in reversed(list(zip(TAGS, R))): pop_layer(k, t, MV.D_POP, MV.POP * 100, APPEAR, MV.F_POP)
        L.layer(4, "skeleton", L.ks(o=AN(pk + [(100, [100], None)])), shapes=sk_shapes(TAGS, dict(zip(TAGS, R))))
        for i, k in enumerate(DIVS):
            x, y, w, h = M[k]
            L.layer(4, k, L.ks(a=(x * S, (y + h / 2) * S), p=(x * S, (y + h / 2) * S), s=keyed([0, 100, 100], [100, 100, 100], R[i] + 0.05, R[i + 1] - R[i] - 0.05)),
                    shapes=grp([{"ty": "rc", "p": st([(x + w / 2) * S, (y + h / 2) * S]), "s": st([w * S, h * S]), "r": st(0)},
                                {"ty": "fl", "c": st(hexc(DVC)), "o": st(100), "r": 1}]))
    X, Y, w, h = img(f"a{c[1:]}f"); L.layer(2, "front", L.ks(p=(X, Y)), refId=f"a{c[1:]}f")
    for q in "mb":
        k = f"a{c[1:]}{q}"; t, dx = FAN[k]; slide_layer(k, t, D_FAN, dx)
    X, Y, w, h = img(c + "Base"); L.layer(2, "callout", L.ks(p=(X, Y)), refId=c + "Base")
    X, Y, w, h = img(f"g{c[1:]}F"); L.layer(2, "glass", L.ks(p=(X, Y)), refId=f"g{c[1:]}F")      # grows and fades with the callout
    CL = L.layers; L.layers = MAIN
    tx, ty = TIP[c]
    L.precomp(c + "Comp", CL, L.ks(a=(tx * S, ty * S), p=(tx * S, ty * S), s=keyed([MV.POP * 100, MV.POP * 100, 100], [100, 100, 100], T_POP[c], D_POP, APPEAR),
              o=keyed([0], [100], T_POP[c], MV.F_POP, APPEAR)))
    x, y, w, h = M[DOT[c]]
    for n in (2, 1):
        t = T_RIP[c][n - 1]; r0 = RIP_R * 2 * S; rc = re.search(r'<circle id="%s"[^>]*stroke="([^"]+)"' % f"rp{c[1:]}_{n}", svg).group(1)
        L.layer(4, f"rp{c[1:]}_{n}", L.ks(p=((x + w / 2) * S, (y + h / 2) * S), o=AN([(0, [0], None), (pc(t) - 0.2, [0], None), (pc(t), [60], E_RIP), (pc(t + D_RIP), [0], None)])),
                shapes=grp([{"ty": "el", "p": st([0, 0]), "s": AN([(0, [r0, r0], None), (pc(t), [r0, r0], E_RIP), (pc(t + D_RIP), [r0 * RIP_X, r0 * RIP_X], None)])},
                            {"ty": "st", "c": st(hexc(rc)), "o": st(100), "w": st(1.2 * S), "lc": 2, "lj": 2}]))
    dcol = re.search(r'<circle id="%s"[^>]*fill="([^"]+)"' % DOT[c], svg).group(1)
    L.layer(4, DOT[c], L.ks(p=((x + w / 2) * S, (y + h / 2) * S), s=keyed([0, 0, 100], [100, 100, 100], T_DOT[c], D_DOT, E)),
            shapes=grp([{"ty": "el", "p": st([0, 0]), "s": st([w * S, h * S])}, {"ty": "fl", "c": st(hexc(dcol)), "o": st(100), "r": 1}]))
L.image("sweep", f"{WORK}/sweep.png", W_IMG * S, RW * S)
L.layer(2, "sweep", L.ks(a=(0, RW * S), p=(SWC[0] * S, SWC[1] * S), r=AN([(pc(t), [a - BEAM], LIN) for t, a in SW_KEYS]),
        o=AN([(0, [100], "h"), (pc(t_sw_end), [0], None)])), refId="sweep")
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(L.layers), "layers", size // 1024, "KB", f"T={T * TEMPO[NAME]:.2f}s", {c: len(VIS[c]) for c in C})
