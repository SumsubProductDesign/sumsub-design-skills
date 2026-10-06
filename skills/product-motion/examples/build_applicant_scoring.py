# Applicant scoring promo, plays once: the applicant card rises with its risk factors still loading (DS skeleton,
# pulsing); the factors resolve one by one — IP mismatch 18, Source of funds 20, High amount transfer 10. With the first
# one the marker comes in on the scale with its score tooltip above it, green "Low risk 18"; with each next factor it
# moves on and the score counts along (18 → 38 → 48). Crossing into the medium zone the marker and the tooltip turn
# orange and the tooltip widens into "Medium risk" (its two halves move apart — the pill keeps its shape). Then the link
# runs down and the verification step it triggers (Advanced liveness check) comes in. Freezes on the original frame.
# usage: python3 build_applicant_scoring.py [light|dark]
import os, sys, re, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "applicant-scoring", "Applicant scoring"
TEMPO[NAME] = 1.3
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, f"src-{NAME}.svg" if THEME == "light" else f"src-{NAME}-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py

# --- structure: card (glass frame + card), verification node (glass frame + node), connector; their blurs stay put ---
assert svg.count("<foreignObject") == 2
for fo_y, gid in (("37", "cardGlass"), ("225", "nodeGlass")):
    svg, n_ = re.subn(r'<foreignObject (x="[\d.]+" y="%s")' % fo_y, r'<foreignObject id="%s" \1' % gid, svg, count=1); assert n_ == 1, gid
GSHAPE = {}
for gid in ("cardGlass", "nodeGlass"): svg, GSHAPE[gid] = glass_css_clip(svg, gid)   # the glass rides with its card
if 'id="Frame 2147239041"' in svg:              # light: glass frame + card / node already grouped, connector grouped
    svg = rename(svg, {"Frame 2147239041": "cardG", "Frame 2147239042": "nodeG", "Group 2131328692": "conn"})
else:                                            # dark: loose glass frames — group each with its card (they never overlap)
    gn = re.search(r'<path id="Rectangle 240653256"[^>]*/>', svg).group(0); svg = svg.replace(gn, "", 1)
    svg = wrap(svg, '<path id="Rectangle 240653257"', '<g id="Node / Canvas"', "cardG")
    a_, b_ = group_span(svg, "Node / Canvas"); svg = svg[:a_] + '<g id="nodeG">' + gn + svg[a_:b_] + "</g>" + svg[b_:]
    svg, n_ = re.subn(r'(<path id="Vector 3779"[^>]*/>)', r'<g id="conn">\1</g>', svg, count=1); assert n_ == 1
svg = rename(svg, {"*Counter*": "c1", "*Counter*_2": "c2", "*Counter*_3": "c3", "*Tag Colorful*": "t1", "*Tag Colorful*_2": "t2",
                   "*Tag Colorful*_3": "t3", "Polygon 1": "ptr", "*Risk level*": "badge"})
M0 = measure(svg, ["conn", "c1", "c2", "c3", "t1", "t2", "t3", "badge", "ptr", "Slider", "Frame 2131328803"])
cx_, cy_, cw_, ch_ = M0["conn"]
svg, n_ = re.subn(r'(<g id="conn">)', r'\1' + f'<rect x="{cx_ - 2:.2f}" y="{cy_ - 2:.2f}" width="{cw_ + 4:.2f}" height="{ch_ + 4:.2f}" fill="none"/>', svg, count=1); assert n_ == 1
CB = (cx_ - 2, cy_ - 2, cw_ + 4, ch_ + 4)
# the marker: its orange layer (on top in the file) gets a green twin above it, shown while the score is in the green zone
a_, b_ = group_span(svg, "ptr"); pseg = svg[a_:b_]
paths = re.findall(r'<path d="[^"]+" fill="[^"]+"/>', pseg); assert len(paths) == 2
GREEN = re.search(r'<g id="Frame 2131328798">.*?<path d="[^"]+" fill="(#[0-9A-Fa-f]{6})"', svg, re.S).group(1)
svg = svg[:a_] + pseg.replace(paths[1], paths[1] + re.sub(r'fill="[^"]+"', f'fill="{GREEN}"', paths[1]).replace("<path ", '<path id="ptrG" ', 1), 1) + svg[b_:]
# marker positions: proportional along the scale, the original spot = 48
X0S = M0["Slider"][0]; PX = M0["ptr"][0] + M0["ptr"][2] / 2; PY = M0["ptr"][1] + M0["ptr"][3]     # PY: the tip
xs = lambda score: X0S + (PX - X0S) * score / 48
S_CROSS = (M0["Frame 2131328803"][0] - X0S) / (PX - X0S) * 48     # the medium zone starts at 32
assert abs(S_CROSS - 32) < 0.1, S_CROSS
S_CROSS = 32

# --- the score tooltip (the original "*Risk level*" = its final, medium-risk state). The same pill in the low zone:
# green, "Low risk", the counter in green — as much narrower as "Low risk" is shorter than "Medium risk". Its background
# is two copies of the narrow pill, one at each end (their union is the pill at any width up to twice as wide): when the
# tooltip widens they move apart with the text and the counter — no stretching, the ends keep their shape. ---
a_, b_ = group_span(svg, "badge"); bseg = svg[a_:b_]
bgp = re.search(r'<path d="[^"]+" fill="(#[0-9A-Fa-f]{6})"/>', bseg); BG_O = bgp.group(1)
T4 = re.search(r'<path id="Text_4" d="M([\d.]+) ([\d.]+)[^"]*" fill="([^"]+)"/>', bseg)
TL, TB, TXTC = float(T4.group(1)), float(T4.group(2)), T4.group(3)       # glyphs' left edge, baseline
cr = re.search(r'<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="([\d.]+)" fill="([^"]+)"/>', bseg)
CRX, CRY, CRW, CRH, CRR = map(float, cr.groups()[:5]); CNT_O = cr.group(6)
N4 = re.search(r'<path id="Number_4" d="M[\d.]+ ([\d.]+)[^"]*" fill="([^"]+)"/>', bseg); NB, NUM_O = float(N4.group(1)), N4.group(2)
CNT_G, NUM_G = {"light": ("#DCFCE7", "#166534"), "dark": ("#153721", "#5FC27C")}[THEME]   # DS green counter (= orange one's steps)
BX, BY, BW, BH = M0["badge"]
mt = text_metrics([("Medium risk", 500, 12, 0), ("Low risk", 500, 12, 0)])
DW = (mt[0]["right"] + mt[0]["left"]) - (mt[1]["right"] + mt[1]["left"])
WG = BW - DW
NCX = CRX + CRW / 2
lowT = text_at("lowT", "Low risk", 500, 12, 0, TXTC, TL, TB, mt[1])
NUMS = list(range(18, 48))                       # 48 is the original Number_4
nums = "".join(f'<text id="n{v}" x="{NCX:.3f}" y="{NB:.3f}" text-anchor="middle" font-family="Geist" font-size="12" font-weight="500" '
               f'fill="{NUM_G if v < S_CROSS else NUM_O}" style="white-space:pre;font-variant-numeric:tabular-nums">{v}</text>' for v in NUMS)
pill_ = lambda i, x: f'<rect id="{i}" x="{x:.3f}" y="{BY:g}" width="{WG:.3f}" height="{BH:g}" rx="{BH / 2:g}" fill="{BG_O}"/>'
badge = ('<g id="badge">' + pill_("bgR", BX + BW - WG) + pill_("bgL", BX) + bgp.group(0).replace("<path ", '<path id="bgF" ', 1)
         + '<g id="txt">' + lowT + T4.group(0) + '</g>'
         + '<g id="cnt">' + cr.group(0).replace("<rect ", '<rect id="cntR" ', 1) + nums + N4.group(0) + '</g></g>')
svg = svg[:a_] + badge + svg[b_:]
# the marker (pointer + tooltip): one group riding along the scale, popping in around the pointer's tip
a_ = group_span(svg, "ptr")[0]; b_ = group_span(svg, "badge")[1]
assert svg[group_span(svg, "ptr")[1]:group_span(svg, "badge")[0]].strip() == ""
svg = svg[:a_] + '<g id="mkT"><g id="mkP">' + svg[a_:b_] + '</g></g>' + svg[b_:]

# loading state, DS skeleton in the illustration's own counter colour: pills in the factor counters' and tags' places
SKC = SKELETON[THEME]["card"]       # loaders on the white card: the DS skeleton token (motionlib.SKELETON)
def radius(k):
    m = re.search(r'<g id="%s">\s*<(?:path d="M([\d.]+) [\d.]+H([\d.]+)C[\d.]+ [\d.]+ ([\d.]+)|rect[^>]*rx="([\d.]+)")' % k, svg)
    return float(m.group(4)) if m.group(4) else float(m.group(3)) - float(m.group(2))
def pill(k):
    x, y, w, h = M0[k]; return f'<rect id="sk_{k}" x="{x:.3f}" y="{y:.3f}" width="{w:.3f}" height="{h:.3f}" rx="{min(radius(k), h / 2):.3f}" fill="{SKC}"/>'
FAC = [("c1", "t1", 18), ("c2", "t2", 20), ("c3", "t3", 10)]
SKS = ["c1", "c2", "c3", "t1", "t2", "t3"]
for k in SKS:
    svg = svg.replace(f'<g id="{k}">', f'<g id="skP_{k}">{pill(k)}</g><g id="{k}">', 1)
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)

MK = ["mkT", "mkP", "ptrG", "bgL", "bgR", "bgF", "txt", "cnt", "cntR", "lowT", "Text_4", "Number_4"] + [f"n{v}" for v in NUMS]
ANIM = ["cardG", "nodeG", "conn", "cardGlass", "nodeGlass"] + MK + SKS + [f"sk_{k}" for k in SKS] + [f"skP_{k}" for k in SKS]
for k in ANIM:     # a CSS transform/opacity animation would override these attributes
    tag = re.search(r'<[a-zA-Z]+ id="%s"[^>]*>' % re.escape(k), svg).group(0)
    assert ' transform=' not in tag and ' opacity=' not in tag, (k, tag[:140])
M = measure(svg, ["cardG", "nodeG", "Frame 2085663805", "Node / Canvas", "cardGlass", "nodeGlass", "ptr", "lowT", "Text_4", "Number_4"] + SKS)

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
# --- timeline, seconds (stretched by TEMPO) ---
MV = motion(NAME)                               # the common motion language (motionlib.LANG)
t_card, D_CARD = 0.05, MV.D_ARRIVE
T_F = [0.8, 1.25]                               # factors resolve one by one…
D_PTR = 0.55                                    # …and the marker moves on by their score
# the marker slides along the scale with a soft start: it is already in view, and the spring E (full speed in the first
# frame) read as a twitch at each of its two moves (06.10 design review: "the risk level moves a little jerkily")
SLIDE = (.45, 0, .25, 1)
SCORES = [18, 38, 48]
t_mk, D_POP = T_F[0] + 0.05, MV.D_POP              # the first: the marker comes in with its tooltip
# into the medium zone, in two beats (not all at once): the tooltip turns orange as the marker crosses 32, then — the
# colour settled — it widens into "Medium risk"; the last factor (and the marker's next move) waits until it has
t_cross = T_F[1] + 0.05 + D_PTR * time_at(SLIDE, (S_CROSS - SCORES[0]) / (SCORES[1] - SCORES[0]))
D_COL = 0.12
# the tooltip widens once the marker has stopped (within 0.5 px): widening while it still moves sent the pill's left edge
# backwards against the motion for a few frames
t_w, D_W = max(t_cross + D_COL, T_F[1] + 0.05 + D_PTR * time_at(SLIDE, 1 - 0.5 / abs(xs(SCORES[1]) - xs(SCORES[0])))), 0.28
T_F.append(max(1.7, t_w + D_W))
MOVES = [(SCORES[i - 1], SCORES[i], T_F[i] + 0.05) for i in (1, 2)]
t_conn, D_CONN = MOVES[-1][2] + D_PTR + 0.2, 0.35    # the link to the step it triggers, once the score has settled
t_node, D_NODE = t_conn + D_CONN - 0.1, MV.D_ARRIVE
T = t_node + D_NODE + 0.35
T = math.ceil(T * TEMPO[NAME] * 60 - 1e-6) / (60 * TEMPO[NAME])
pc = lambda t: round(t / T * 100, 3)
STEP = "steps(1,end)"
PULSE = (.4, 0, .6, 1)
t_p0 = t_card + MV.F_ARRIVE
NP = max(1, round((T - t_p0) * TEMPO[NAME] / 0.9)); PP = (T - t_p0) / NP
# the count: each value shows from the moment the marker reaches it (the last one as it lands)
TK = {}
for s0, s1, ts in MOVES:
    for t, v in count_ticks(s0, s1, ts, D_PTR, SLIDE, TEMPO[NAME]): TK[v] = t      # ≤15 updates/s (readable)
# the label swaps with a direction (as the TM total does): the old word leaves upwards, the new one comes up from below a
# beat later — never an empty pill (it used to stand blank ~0.1 s), never two words on top of each other
SWAP_DY, D_SWAP, F_OUT, F_IN = 5, 0.18, 0.08, 0.12     # the old word is (almost) gone by the time the new one shows
T_OUT, T_IN = (t_w + 0.08, D_SWAP), (t_w + 0.12, D_SWAP)   # once the pill is mostly open (the new word is wider)
BLUR = {k: float(re.search(r'<foreignObject id="%s".*?blur\(([\d.]+)px\)' % k, svg, re.S).group(1)) for k in ("cardGlass", "nodeGlass")}
T_GLASS = {"cardGlass": t_card + D_CARD, "nodeGlass": t_node + D_NODE}
DX = lambda s_: xs(s_) - PX

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
move("cardG", t_card, D_CARD, MV.ARRIVE, fade=MV.F_ARRIVE)
glass_follow(K, pc, "cardGlass", t_card, D_CARD, MV.ARRIVE, BLUR["cardGlass"], fade=MV.F_ARRIVE)    # the glass arrives with the card
fr = [(0, "opacity:1", None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; fr += [(pc(a_), "opacity:1", PULSE), (pc(a_ + PP / 2), "opacity:.5", PULSE)]
K.kf("pulse", fr + [(100, "opacity:1", None)])
K.rule(",".join(f"#skP_{k}" for k in SKS), f"animation:pulse {K.dur}")
for (c, tg, _), t in zip(FAC, T_F):
    fade(f"sk_{c}", t, 0.2, 1, 0, static=0); fade(f"sk_{tg}", t + 0.05, 0.25, 1, 0, static=0)
    move(c, t, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)            # the counter and its tag pop in (tags pop everywhere)
    move(tg, t + 0.05, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
# the marker: pops in at 18, then rides on by each factor's score
mk = [(0, f"transform:translateX({DX(SCORES[0]):.3f}px)", None)]
for s0, s1, ts in MOVES: mk += [(pc(ts), mk[-1][1], SLIDE), (pc(ts + D_PTR), f"transform:translateX({DX(s1):.3f}px)", None)]
K.kf("mkT", mk); K.rule("#mkT", f"animation:mkT {K.dur}")
move("mkP", t_mk, D_POP, MV.POP_T, origin=f"{PX:.3f}px {PY:.3f}px", box="view-box", ease=APPEAR, fade=MV.F_POP)
fade("ptrG", t_cross - D_COL / 2, D_COL, 1, 0, static=0)
for k, c0, c1 in (("bgFill", GREEN, BG_O), ("cntFill", CNT_G, CNT_O)):
    K.kf(k, [(0, f"fill:{c0}", None), (pc(t_cross - D_COL / 2), f"fill:{c0}", E), (pc(t_cross + D_COL / 2), f"fill:{c1}", None)])
for k, dx in (("mL", DW / 2), ("mR", -DW / 2)):            # the halves move apart
    K.kf(k, [(0, f"transform:translateX({dx:.3f}px)", None), (pc(t_w), f"transform:translateX({dx:.3f}px)", E), (pc(t_w + D_W), "transform:none", None)])
K.kf("endShow", [(0, "visibility:hidden", STEP), (99.99, "visibility:visible", None)])
K.kf("endHide", [(0, "visibility:visible", STEP), (99.99, "visibility:hidden", None)])
K.rule("#bgL", f"visibility:hidden;animation:mL {K.dur},bgFill {K.dur},endHide {K.dur}")   # the pair → the original pill
K.rule("#bgR", f"visibility:hidden;animation:mR {K.dur},bgFill {K.dur},endHide {K.dur}")
K.rule("#bgF", f"animation:endShow {K.dur}")
K.rule("#txt", f"animation:mL {K.dur}"); K.rule("#cnt", f"animation:mR {K.dur}"); K.rule("#cntR", f"animation:cntFill {K.dur}")
K.kf("lowT", [(0, "opacity:1;transform:none", None), (pc(T_OUT[0]), "opacity:1;transform:none", E), (pc(T_OUT[0] + F_OUT), "opacity:0", None),
              (pc(T_OUT[0] + T_OUT[1]), f"opacity:0;transform:translateY({-SWAP_DY}px)", None)])
K.rule("#lowT", f"opacity:0;animation:lowT {K.dur}")                       # static = the original: no "Low risk"
K.kf("Text_4", [(0, f"opacity:0;transform:translateY({SWAP_DY}px)", None), (pc(T_IN[0]), f"opacity:0;transform:translateY({SWAP_DY}px)", E),
                (pc(T_IN[0] + F_IN), "opacity:1", None), (pc(T_IN[0] + T_IN[1]), "opacity:1;transform:none", None)])
K.rule("#Text_4", f"animation:Text_4 {K.dur}")
TKd = TK
for v in NUMS + [48]:
    nid = "Number_4" if v == 48 else f"n{v}"
    if v != SCORES[0] and v not in TKd: K.rule("#" + nid, "opacity:0"); continue      # a value the display steps over
    tin = TKd.get(v); later = [u for u in TKd if u > v]; tout = TKd[min(later)] if later else None
    fr = [(0, "opacity:%d" % (1 if tin is None else 0), STEP)]
    if tin is not None: fr.append((pc(tin), "opacity:1", STEP))
    if tout is not None: fr.append((pc(tout), "opacity:0", None))
    K.kf(nid, fr); K.rule("#" + nid, ("" if v == 48 else "opacity:0;") + f"animation:{nid} {K.dur}")
f0 = f"clip-path:inset(0 0 {CB[3]:.3f}px 0)"
K.kf("conn", [(0, f0, None), (pc(t_conn), f0, E), (pc(t_conn + D_CONN), "clip-path:inset(0 0 0px 0)", None), (pc(t_conn + D_CONN) + 0.01, "clip-path:none", None)])
K.rule("#conn", f"animation:conn {K.dur}")
move("nodeG", t_node, D_NODE, MV.ARRIVE, fade=MV.F_ARRIVE)
glass_follow(K, pc, "nodeGlass", t_node, D_NODE, MV.ARRIVE, BLUR["nodeGlass"], fade=MV.F_ARRIVE)
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. The risk factors add up — 18, 20, 10 — the "
         "marker with its score tooltip moves along the scale, from low risk to 48 (medium risk), and an additional verification step is triggered.", svg, K.text(), T)
print(THEME, "html", n // 1024, "KB", f"T={K.T:.2f}s", f"cross {t_cross * TEMPO[NAME]:.2f}s", f"DW {DW:.2f}", "x", [round(xs(s_), 1) for s_ in SCORES])
if "--html" in sys.argv: sys.exit()

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
L.frac = True
AN = L.anim
GLS = ["cardGlass", "nodeGlass"]
shoot(svg, f"{WORK}/plate.png", hide=GLS + ["cardG", "nodeG", "conn"]); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
NOSH = "[filter]{filter:none!important}"
def render(k, box, pad, only=None, hide=(), css=""):
    x, y, w, h = box
    shoot(svg, f"{WORK}/{k}.png", only=only or [k], hide=hide, transparent=True, css=css)
    geo[k] = crop(f"{WORK}/{k}.png", x - pad, y - pad, w + 2 * pad, h + 2 * pad)
render("cardG", M["cardG"], 4, hide=SKS + ["mkT"] + [f"skP_{k}" for k in SKS])
for k in SKS: render(k, M[k], 2, css=NOSH)
render("ptrO", M["ptr"], 2, only=["ptr"], hide=["ptrG"], css=NOSH); render("ptrG", M["ptr"], 2, css=NOSH)
render("lowT", M["lowT"], 2, css=NOSH); render("Text_4", M["Text_4"], 2, css=NOSH); render("Number_4", (CRX, CRY, CRW, CRH), 1, css=NOSH)
# the counts in one shot: a sheet of the numbers stacked 24 px apart, cropped row by row
RS = 24
rows = "".join(f'<g transform="translate(0 {i * RS})">' + re.search(r'<text id="n%d".*?</text>' % v, svg).group(0).replace(f'id="n{v}"', "") + "</g>"
               for i, v in enumerate(NUMS))
HS = 354 + len(NUMS) * RS
shoot(f'<svg width="494" height="{HS}" viewBox="0 0 494 {HS}" fill="none" xmlns="http://www.w3.org/2000/svg"><g>{rows}</g></svg>',
      f"{WORK}/nsheet.png", transparent=True, H=HS)
for i, v in enumerate(NUMS):
    subprocess.run(["cp", f"{WORK}/nsheet.png", f"{WORK}/n{v}.png"])
    geo[f"n{v}"] = crop(f"{WORK}/n{v}.png", CRX - 1, CRY - 1 + i * RS, CRW + 2, CRH + 2, H=HS)
    geo[f"n{v}"][1] -= i * RS * S
render("conn", CB, 2)
render("nodeG", M["nodeG"], 4)
shoot(svg, f"{WORK}/frost.png", hide=["cardG", "nodeG", "conn"])
for k in GLS: geo[k + "F"] = shape_crop(f"{WORK}/frost.png", GSHAPE[k], M[k], f"{WORK}/{k}F.png")   # the frost, glass-shaped
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
def slide_layer(k, t, d, dx, fade):
    X, Y, w, h = img(k)
    L.layer(2, k, L.ks(p=keyed([X + dx * S, Y, 0], [X, Y, 0], t, d), o=keyed([0], [100], t, fade)), refId=k)
def pill_shape(x, y, w, h, r, c0, c1):
    return grp([{"ty": "rc", "p": st([(x + w / 2) * S, (y + h / 2) * S]), "s": st([w * S, h * S]), "r": st(r * S)},
                {"ty": "fl", "c": keyed(hexc(c0), hexc(c1), t_cross - D_COL / 2, D_COL), "o": st(100), "r": 1}])
# layers, top first: connector (wipe); node precomp (rises); card precomp (marker precomp, factors, skeleton, card); glass; bg
X, Y, w, h = img("conn")
wipe = lambda yb: {"c": True, "v": [[-4, -4], [w + 4, -4], [w + 4, yb], [-4, yb]], "i": [[0, 0]] * 4, "o": [[0, 0]] * 4}
L.layer(2, "conn", L.ks(p=(X, Y)), refId="conn", hasMask=True, masksProperties=[{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "wipe",
        "pt": keyed([wipe(0)], [wipe(h + 4)], t_conn, D_CONN)}])
MAIN = L.layers; L.layers = []
X, Y, w, h = img("nodeG"); L.layer(2, "node", L.ks(p=(X, Y)), refId="nodeG")
X, Y, w, h = img("nodeGlassF"); L.layer(2, "glass", L.ks(p=(X, Y)), refId="nodeGlassF")      # rides and fades with the node
NODE = L.layers; L.layers = MAIN
L.precomp("nodeComp", NODE, L.ks(p=keyed([0, MV.RISE * S, 0], [0, 0, 0], t_node, D_NODE), o=keyed([0], [100], t_node, MV.F_ARRIVE)))
MAIN = L.layers; L.layers = []
# the marker: tooltip halves on two nulls (left: pill + label, right: pill + counter), the pointer; the whole in a precomp
HL, HR = 300, 301
def hold(v):
    later = [u for u in TK if u > v]
    return AN(([(0, [100], "h")] if TK.get(v) is None else [(0, [0], "h"), (pc(TK[v]), [100], "h")])
              + ([(pc(TK[min(later)]), [0], None)] if later else [(100, [100], None)]))
for v in [48] + [u for u in NUMS[::-1] if u == SCORES[0] or u in TK]:
    k = "Number_4" if v == 48 else f"n{v}"; X, Y, w, h = img(k)
    L.layer(2, k, L.ks(p=(X, Y), o=hold(v)), refId=k, parent=HR)
L.layer(4, "counter", L.ks(), shapes=pill_shape(CRX, CRY, CRW, CRH, CRR, CNT_G, CNT_O), parent=HR)
X, Y, w, h = img("Text_4"); L.layer(2, "medium", L.ks(p=keyed([X, Y + SWAP_DY * S, 0], [X, Y, 0], *T_IN), o=keyed([0], [100], T_IN[0], F_IN)), refId="Text_4", parent=HL)
X, Y, w, h = img("lowT"); L.layer(2, "low", L.ks(p=keyed([X, Y, 0], [X, Y - SWAP_DY * S, 0], *T_OUT), o=keyed([100], [0], T_OUT[0], F_OUT)), refId="lowT", parent=HL)
L.layer(4, "pillL", L.ks(), shapes=pill_shape(BX, BY, WG, BH, BH / 2, GREEN, BG_O), parent=HL)
L.layer(4, "pillR", L.ks(), shapes=pill_shape(BX + BW - WG, BY, WG, BH, BH / 2, GREEN, BG_O), parent=HR)
X, Y, w, h = img("ptrG"); L.layer(2, "ptrG", L.ks(p=(X, Y), o=keyed([100], [0], t_cross - D_COL / 2, D_COL)), refId="ptrG")
X, Y, w, h = img("ptrO"); L.layer(2, "ptrO", L.ks(p=(X, Y)), refId="ptrO")
for ind, dx in ((HL, DW / 2), (HR, -DW / 2)):
    L.layer(3, "half", L.ks(p=keyed([dx * S, 0, 0], [0, 0, 0], t_w, D_W)), ind_fixed=ind)
MKL = L.layers; L.layers = []
mp = [(0, [(PX + DX(SCORES[0])) * S, PY * S, 0], None)]
for s0, s1, ts in MOVES: mp += [(pc(ts), mp[-1][1], SLIDE), (pc(ts + D_PTR), [(PX + DX(s1)) * S, PY * S, 0], None)]
L.precomp("mkComp", MKL, L.ks(a=(PX * S, PY * S), p=AN(mp), s=keyed([MV.POP * 100, MV.POP * 100, 100], [100, 100, 100], t_mk, D_POP, APPEAR),
          o=keyed([0], [100], t_mk, MV.F_POP, APPEAR)))
for (c, tg, _), t in reversed(list(zip(FAC, T_F))):
    pop_layer(tg, t + 0.05, MV.D_POP, MV.POP * 100, APPEAR, MV.F_POP)
    pop_layer(c, t, MV.D_POP, MV.POP * 100, APPEAR, MV.F_POP)
sk = []
for (c, tg, _), t in zip(FAC, T_F):
    for k, tt, d in ((c, t, 0.2), (tg, t + 0.05, 0.25)):
        x, y, w_, h_ = M0[k]
        sk += grp([{"ty": "rc", "p": st([(x + w_ / 2) * S, (y + h_ / 2) * S]), "s": st([w_ * S, h_ * S]), "r": st(min(radius(k), h_ / 2) * S)},
                   {"ty": "fl", "c": st(hexc(SKC)), "o": st(100), "r": 1}], o=keyed([100], [0], tt, d))
L.layer(4, "skeleton", L.ks(o=AN(pk + [(100, [100], None)])), shapes=sk)
X, Y, w, h = img("cardG"); L.layer(2, "card", L.ks(p=(X, Y)), refId="cardG")
X, Y, w, h = img("cardGlassF"); L.layer(2, "glass", L.ks(p=(X, Y)), refId="cardGlassF")
CARD = L.layers; L.layers = MAIN
L.precomp("cardComp", CARD, L.ks(p=keyed([0, MV.RISE * S, 0], [0, 0, 0], t_card, D_CARD), o=keyed([0], [100], t_card, MV.F_ARRIVE)))
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(L.layers), "layers", size // 1024, "KB", f"T={T * TEMPO[NAME]:.2f}s")
