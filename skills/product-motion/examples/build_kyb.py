# KYB promo (v2), plays once: the company card rises with its checks still loading (DS skeleton, pulsing), the ownership
# tree grows out of the card and the loaders turn into data as it grows: Company status when the trunk reaches the
# junction, Watchlists with Ann and Camberley, Associated parties and the verification time together with the last
# block, Gabriel (the flagged UBO); then the status "Requires action". Freezes on the original frame.
# usage: python3 build_kyb.py [light|dark]
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "kyb", "KYB"
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, f"src-{NAME}.svg" if THEME == "light" else f"src-{NAME}-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py

# --- structure ---
assert svg.count("<foreignObject") == 1
# the card's 2px backdrop blur loses its rounded clip inside a moving group: it stays put and fades in once the card has landed
svg = svg.replace("<foreignObject", '<foreignObject id="cardGlass"', 1)
svg, GSHAPE = glass_css_clip(svg, "cardGlass")   # the glass travels with the card
GBLUR = float(re.search(r'<foreignObject id="cardGlass".*?blur\(([\d.]+)px\)', svg, re.S).group(1))
if 'id="Frame 2147239038"' in svg:      # light: the glass frame and the card share one wrapper
    svg = rename(svg, {"Frame 2147239038": "card"})
else:                                    # dark: the glass frame is a loose path right before the card
    svg = wrap(svg, '<path id="Rectangle 240653255"', '<g id="Frame 2085664883"', "card")
svg = rename(svg, {"Frame 2085664876": "bIcon", "Frame 2147239014": "cName", "*Status*": "status", "Frame 2147239029": "verified",
                   "small/Filled/Success": "ck1", "Label_2": "ck1L", "small/Filled/Success_2": "ck2", "Label_3": "ck2L",
                   "small/Filled/Danger": "ck3", "Label_4": "ck3L", "Line 561": "ln1", "Line 562": "ln2",
                   "Frame 2085664881": "pAnn", "small/Filled/Success_3": "bAnn", "Frame 2085664882": "pCam", "small/Filled/Success_4": "bCam",
                   "Frame 2085664883": "pGab", "small/Filled/Danger_2": "bGab"})
for k in ("ln1", "ln2"): svg = svg.replace(f'<line id="{k}"', f'<line id="{k}" pathLength="1"', 1)

# loading state of the checks panel: DS skeleton blocks (rounded, `components/skeleton/background-normal` steps one shade
# darker here — the panel is `neutral/ghost`, not a white card, so subtlest would be invisible), laid over the data
M0 = measure(svg, ["Label", "ck1", "ck1L", "ck2", "ck2L", "ck3", "ck3L"])
SKC = SKELETON[THEME]["plate"]                             # on the ghost plate: neutral/subtler (motionlib.SKELETON)
HB = 9                                                     # bar height for the illustration's 10px text
def base_line(k):   # baseline of a one-line label: the tspan y (live text) or the outline's bottom (dark; no descenders)
    m = re.search(r'<text id="%s"[^>]*>\s*<tspan[^>]*\by="([\d.]+)"' % k, svg)
    return float(m.group(1)) if m else M0[k][1] + M0[k][3] - 0.15
vx, vw = M0["Label"][0], M0["Label"][2]; vcy = base_line("Label") - 3.5
SKEL = [f'<rect id="skV" x="{vx:.2f}" y="{vcy - HB / 2:.2f}" width="{vw:.2f}" height="{HB}" rx="{HB / 2:g}" fill="{SKC}"/>']
for i in (1, 2, 3):
    bx, by, bw, bh = M0[f"ck{i}"]; cx, cy = bx + bw / 2, by + bh / 2; lx, ly, lw, lh = M0[f"ck{i}L"]
    SKEL += [f'<circle id="sk{i}c" cx="{cx:.2f}" cy="{cy:.2f}" r="{bw / 2:g}" fill="{SKC}"/>',
             f'<rect id="sk{i}" x="{lx:.2f}" y="{cy - HB / 2:.2f}" width="{lw:.2f}" height="{HB}" rx="{HB / 2:g}" fill="{SKC}"/>']
svg, nsub = re.subn(r'(<g id="Frame 2085664879_2"[^>]*>\s*<rect[^>]*/>)', lambda m: m.group(1) + '\n<g id="skel">' + "".join(SKEL) + "</g>", svg, count=1)
assert nsub == 1
SK_IDS = ["skV", "sk1c", "sk1", "sk2c", "sk2", "sk3c", "sk3"]

# connectors, as exported (light: 1px outlined fills, dark: 1px strokes), rebuilt as strokes so they can be drawn on:
# the trunk down to the junction, then three branches with r=12 bends (Ann, Camberley, Gabriel), dots on top
G = {"light": dict(c="#4A5565", r=2.667, y0=145.5, jy=202.5, xl=206.5, xr=286.5, yg=281.5, xg=286.5),
     "dark": dict(c="#868A8F", r=3.0, y0=144.5, jy=201.5, xl=204.5, xr=280.5, yg=280.5, xg=280.5)}[THEME]
X0, R = 246.5, 12; KK = R * 0.5523; JY = G["jy"]; YB = JY + R
Z = (0, 0)
P = {"cA": dict(v=[(X0, G["y0"]), (X0, JY)], i=[Z, Z], o=[Z, Z]),
     "cL": dict(v=[(X0, JY), (X0 - R, YB), (G["xl"], YB)], i=[Z, (KK, 0), Z], o=[(0, KK), Z, Z]),
     "cR": dict(v=[(X0, JY), (X0 + R, YB), (G["xr"], YB)], i=[Z, (-KK, 0), Z], o=[(0, KK), Z, Z]),
     "cG": dict(v=[(X0, JY), (X0, G["yg"] - R), (X0 + R, G["yg"]), (G["xg"], G["yg"])], i=[Z, Z, (-KK, 0), Z], o=[Z, (0, KK), Z, Z])}
DOT = {"d0": (X0, 145.5), "dL": (G["xl"], YB), "dR": (G["xr"], YB), "dG": (G["xg"], G["yg"])}
def d_of(p):
    v, i, o = p["v"], p["i"], p["o"]; d = f"M{v[0][0]:g} {v[0][1]:g}"
    for j in range(1, len(v)):
        if o[j - 1] == Z and i[j] == Z: d += f"L{v[j][0]:g} {v[j][1]:g}"
        else:
            c1 = (v[j - 1][0] + o[j - 1][0], v[j - 1][1] + o[j - 1][1]); c2 = (v[j][0] + i[j][0], v[j][1] + i[j][1])
            d += f"C{c1[0]:.3f} {c1[1]:.3f} {c2[0]:.3f} {c2[1]:.3f} {v[j][0]:g} {v[j][1]:g}"
    return d
def p_len(p, n=60):
    v, i, o = p["v"], p["i"], p["o"]; total = 0
    for j in range(1, len(v)):
        a, b = v[j - 1], v[j]; c1 = (a[0] + o[j - 1][0], a[1] + o[j - 1][1]); c2 = (b[0] + i[j][0], b[1] + i[j][1]); prev = a
        for s in range(1, n + 1):
            t = s / n; u = 1 - t
            q = tuple(u ** 3 * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t ** 3 * b[k] for k in (0, 1))
            total += ((q[0] - prev[0]) ** 2 + (q[1] - prev[1]) ** 2) ** .5; prev = q
    return total
conn = ("\n".join(f'<path id="{k}" d="{d_of(p)}" pathLength="1" fill="none" stroke="{G["c"]}"/>' for k, p in P.items()) + "\n" +
        "\n".join(f'<circle id="{k}" cx="{x:g}" cy="{y:g}" r="{G["r"]:g}" fill="{G["c"]}"/>' for k, (x, y) in DOT.items()))
a, b = group_span(svg, "Connectors"); svg = svg[:a] + f'<g id="Connectors">\n{conn}\n</g>' + svg[b:]
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)

TOP = ["cardGlass", "card", "pGab", "pAnn", "pCam", "Connectors"]
CARD_KIDS = ["bIcon", "cName", "status", "verified", "ck1", "ck1L", "ck2", "ck2L", "ck3", "ck3L", "ln1", "ln2", "skel"]
BADGES = ["bAnn", "bCam", "bGab"]
for k in TOP + CARD_KIDS + BADGES + SK_IDS + list(P) + list(DOT):     # a CSS transform/opacity animation would override these attributes
    tag = re.search(r'<[a-zA-Z]+ id="%s"[^>]*>' % re.escape(k), svg).group(0)
    assert ' transform=' not in tag and ' opacity=' not in tag, (k, tag[:140])
M = measure(svg, TOP + CARD_KIDS + BADGES)

# --- timeline, seconds (stretched by TEMPO) ---
MV = motion(NAME)                               # the common motion language (motionlib.LANG)
t_card, D_CARD = 0.05, MV.D_ARRIVE
t_glass = t_card + D_CARD
t_icon, t_name = 0.30, 0.40
t_p0 = t_card + MV.F_ARRIVE                             # the skeleton pulses once the card is opaque
t_dot0 = 0.70                                   # the tree grows out of the card
t_A, D_A = t_dot0 + 0.1, 0.50
t_J = t_A + D_A
LEN = {k: p_len(p) for k, p in P.items()}
DUR = {k: LEN[k] / LEN["cA"] * D_A for k in ("cL", "cR", "cG")}   # branches leave the junction at the trunk's speed
ARR = {k: t_J + DUR[k] for k in DUR}            # a branch reaches its party
EA_IN, EA_OUT = (.6, 0, .7, .4), (.3, .6, .4, 1)  # trunk: soft start, arrives at speed; branch: continues at it, settles in the dot
D_POP = 0.45
B_IN = 0.25                                     # a party's badge pops while its card is still opening
t_bAnn = t_bCam = max(ARR["cL"], ARR["cR"]) + B_IN
t_bGab = ARR["cG"] + B_IN
# loaders → data, in step with the tree: Company status as the trunk reaches the junction, Watchlists with Ann and
# Camberley, Associated parties (and the verification time) with the last block, Gabriel; each separator runs from one
# check to the next while the tree grows
t_L1, t_L2, t_L3 = t_J, t_bAnn, t_bGab
t_ln1, t_ln2 = t_L1 + 0.1, t_L2 + 0.1
t_status = t_L3 + 0.25                          # the verdict
T = t_status + MV.D_POP + 0.05
pc = lambda t: round(t / T * 100, 3)
PULSE = (.4, 0, .6, 1)                          # Tailwind animate-pulse: opacity 1 → .5 → 1
NP = max(1, round((t_L3 - t_p0) * TEMPO[NAME] / 0.9)); PP = (t_L3 - t_p0) / NP    # ~0.9 s cycles, back to full at t_L3

# ---------- HTML ----------
K = Keyframes(T * TEMPO[NAME], 100)
def move(name, t, d, frm, origin="50% 50%", box="fill-box", ease=E, fade=None):
    a0 = f"opacity:0;transform:{frm}"
    frames = [(0, a0, None), (pc(t), a0, ease)]
    if fade: frames.append((pc(t + fade), "opacity:1", None))
    frames.append((pc(t + d), "opacity:1;transform:none", None))
    K.kf(name, frames)
    K.rule("#" + name, f"transform-box:{box};transform-origin:{origin};animation:{name} {K.dur}")
def fade_in(name, t, d=0.3):
    K.kf(name, [(0, "opacity:0", None), (pc(t), "opacity:0", E), (pc(t + d), "opacity:1", None)])
    K.rule("#" + name, f"animation:{name} {K.dur}")
def fade_out(name, t, d=0.25):
    K.kf(name, [(0, "opacity:1", None), (pc(t), "opacity:1", E), (pc(t + d), "opacity:0", None)])
    K.rule("#" + name, f"opacity:0;animation:{name} {K.dur}")      # static (no animation) = the original: no skeleton
def draw(name, t, d, ease):          # pathLength=1: dashoffset 1 → 0 draws the path from its start
    K.kf(name, [(0, "stroke-dashoffset:1", None), (pc(t), "stroke-dashoffset:1", ease), (pc(t + d), "stroke-dashoffset:0", None)])
    K.rule("#" + name, f"stroke-dasharray:1 2;animation:{name} {K.dur}")
def pop(name, t, d=0.3):
    K.kf(name, [(0, "transform:scale(0)", None), (pc(t), "transform:scale(0)", APPEAR), (pc(t + d), "transform:none", None)])
    K.rule("#" + name, f"transform-box:fill-box;transform-origin:50% 50%;animation:{name} {K.dur}")
move("card", t_card, D_CARD, MV.ARRIVE, fade=MV.F_ARRIVE)
glass_follow(K, pc, "cardGlass", t_card, D_CARD, MV.ARRIVE, GBLUR, fade=MV.F_ARRIVE)      # the glass arrives with the card
move("bIcon", t_icon, MV.D_MARK, MV.MARK_T, ease=APPEAR, fade=MV.F_MARK)
move("cName", t_name, MV.D_NUDGE, MV.NUDGE_T, fade=MV.F_NUDGE)
fr = [(0, "opacity:1", None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; fr += [(pc(a_), "opacity:1", PULSE), (pc(a_ + PP / 2), "opacity:.5", PULSE)]
K.kf("skel", fr + [(pc(t_L3), "opacity:1", None)]); K.rule("#skel", f"animation:skel {K.dur}")
def resolve(i, t):                   # one check: its skeleton gives way, the badge pops out of the skeleton dot, the label fades in
    fade_out(f"sk{i}c", t, 0.2); fade_out(f"sk{i}", t, 0.3)
    move(f"ck{i}", t, MV.D_GLYPH, MV.GLYPH_T, ease=APPEAR, fade=MV.F_GLYPH)
    move(f"ck{i}L", t + 0.03, MV.D_NUDGE, MV.NUDGE_T, fade=MV.F_NUDGE)
for i, t in ((1, t_L1), (2, t_L2), (3, t_L3)): resolve(i, t)
fade_out("skV", t_L3, 0.3); move("verified", t_L3 + 0.03, MV.D_NUDGE, MV.NUDGE_T, fade=MV.F_NUDGE)
draw("ln1", t_ln1, t_L2 - t_ln1, E); draw("ln2", t_ln2, t_L3 - t_ln2, E)
pop("d0", t_dot0)
draw("cA", t_A, D_A, EA_IN)
PARTY = (("cL", "dL", "pAnn", "100% 50%"), ("cR", "dR", "pCam", "0% 50%"), ("cG", "dG", "pGab", "0% 50%"))   # a party card opens out of its dot
for k, dot, party, org in PARTY:
    draw(k, t_J, DUR[k], EA_OUT)
    pop(dot, ARR[k] - 0.04)
    move(party, ARR[k] - 0.04, D_POP, "scale(.92)", origin=org, fade=0.25)
for bd, t in (("bAnn", t_bAnn), ("bCam", t_bCam), ("bGab", t_bGab)): move(bd, t, MV.D_GLYPH, MV.GLYPH_T, ease=APPEAR, fade=MV.F_GLYPH)
move("status", t_status, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. The checks load while the ownership tree "
         "grows; they fill in step with it, the last one together with the flagged UBO, and the company status becomes 'Requires action'.",
         svg, K.text(), T)
print(THEME, "html", n // 1024, "KB", f"T={K.T:.2f}s")

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
AN = L.anim
shoot(svg, f"{WORK}/plate.png", hide=TOP); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
NOSH = "[filter]{filter:none!important}"       # a child rendered alone must not pick up its card's drop shadow
def render(k, pad, hide=(), css=""):
    x, y, w, h = M[k]
    shoot(svg, f"{WORK}/{k}.png", only=[k], hide=hide, transparent=True, css=css)
    geo[k] = crop(f"{WORK}/{k}.png", x - pad, y - pad, w + 2 * pad, h + 2 * pad)
render("card", 30, hide=CARD_KIDS)
for k in ("bIcon", "cName", "status", "verified", "ck1", "ck1L", "ck2", "ck2L", "ck3", "ck3L") + tuple(BADGES): render(k, 3, css=NOSH)
for party, bd in (("pAnn", "bAnn"), ("pCam", "bCam"), ("pGab", "bGab")): render(party, 26, hide=[bd])
# the card's glass: the background blurred by it (nothing else shown), cropped to the glass box; it goes under the card
# precomp and shows through the card's translucent frame, fading in once the card has landed
shoot(svg, f"{WORK}/cardFrost.png", hide=[t for t in TOP if t != "cardGlass"])
geo["cardFrost"] = shape_crop(f"{WORK}/cardFrost.png", GSHAPE, M["cardGlass"], f"{WORK}/cardFrost.png")   # glass-shaped
def img(k):
    X, Y, w, h = geo[k]; L.image(k, f"{WORK}/{k}.png", w, h); return X, Y, w, h
PARTY_IND = {"pAnn": 301, "pCam": 302, "pGab": 303}
def anim_layer(k, t, d, dx=0, dy=0, s0=100, ease=E, fade=None, anchor=None, parent=None, origin=(0, 0), ind=None):
    """`origin`: the parent layer's top-left in comp px — a child's position lives in its parent's layer space."""
    X, Y, w, h = img(k)
    ax, ay = (w / 2, h / 2) if anchor is None else (anchor[0] * S - X, anchor[1] * S - Y)
    p1 = [X + ax - origin[0], Y + ay - origin[1], 0]; p0 = [p1[0] + dx * S, p1[1] + dy * S, 0]
    extra = {"parent": parent} if parent else {}
    L.layer(2, k, L.ks(a=(ax, ay), p=AN([(0, p0, None), (pc(t), p0, ease), (pc(t + d), p1, None)]),
        s=AN([(0, [s0, s0, 100], None), (pc(t), [s0, s0, 100], ease), (pc(t + d), [100, 100, 100], None)]),
        o=AN([(0, [0], None), (pc(t), [0], E), (pc(t + (fade or d)), [100], None)])), refId=k, ind_fixed=ind, **extra)
hexc = lambda h: [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
TR = lambda o=None: {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": o or st(100)}
grp = lambda items, o=None: [{"ty": "gr", "it": items + [TR(o)]}]
def stroke_layer(name, v, i, o, col, t, d, ease, parent=None):
    extra = {"parent": parent} if parent else {}
    path = {"c": False, "v": [[x * S, y * S] for x, y in v], "i": [[x * S, y * S] for x, y in i], "o": [[x * S, y * S] for x, y in o]}
    L.layer(4, name, L.ks(), shapes=grp([{"ty": "sh", "ks": st(path)},
        {"ty": "tm", "s": st(0), "e": AN([(0, [0], None), (pc(t), [0], ease), (pc(t + d), [100], None)]), "o": st(0), "m": 1},
        {"ty": "st", "c": st(hexc(col)), "o": st(100), "w": st(1 * S), "lc": 1, "lj": 1, "ml": 4}]), **extra)
# layers, top first: dots, connectors, parties (badge over its card), card precomp (contents, skeleton, card), card glass, plate
for k, t in (("dG", ARR["cG"] - 0.04), ("dR", ARR["cR"] - 0.04), ("dL", ARR["cL"] - 0.04), ("d0", t_dot0)):
    x, y = DOT[k]
    L.layer(4, k, L.ks(p=(x * S, y * S), s=AN([(0, [0, 0, 100], None), (pc(t), [0, 0, 100], APPEAR), (pc(t + 0.3), [100, 100, 100], None)])),
        shapes=grp([{"ty": "el", "p": st([0, 0]), "s": st([2 * G["r"] * S, 2 * G["r"] * S])}, {"ty": "fl", "c": st(hexc(G["c"])), "o": st(100), "r": 1}]))
for k in ("cG", "cR", "cL"): stroke_layer(k, P[k]["v"], P[k]["i"], P[k]["o"], G["c"], t_J, DUR[k], EA_OUT)
stroke_layer("cA", P["cA"]["v"], P["cA"]["i"], P["cA"]["o"], G["c"], t_A, D_A, EA_IN)
for k, dot, party, org in reversed(PARTY):     # z: Camberley over Ann over Gabriel, as in the file
    bd = {"pAnn": "bAnn", "pCam": "bCam", "pGab": "bGab"}[party]
    # the badge rides on its card (parented), since it pops while the card is still opening
    anim_layer(bd, {"bAnn": t_bAnn, "bCam": t_bCam, "bGab": t_bGab}[bd], MV.D_GLYPH, s0=MV.GLYPH * 100, ease=APPEAR, fade=MV.F_GLYPH,
               parent=PARTY_IND[party], origin=geo[party][:2] if party in geo else (0, 0))
    x, y, w, h = M[party]
    anim_layer(party, ARR[k] - 0.04, D_POP, s0=92, fade=0.25, anchor=(x + w if org.startswith("100") else x, y + h / 2), ind=PARTY_IND[party])
# the card is a precomp: its fade-in is true group opacity (children inherit it, unlike with a parent null) and its
# glass layer sits below it
MAIN = L.layers; L.layers = []
anim_layer("status", t_status, MV.D_POP, s0=MV.POP * 100, ease=APPEAR, fade=MV.F_POP)
anim_layer("verified", t_L3 + 0.03, MV.D_NUDGE, dx=MV.NUDGE, fade=MV.F_NUDGE)
def line_xy(k):
    tag = re.search(r'<line id="%s"[^>]*>' % k, svg).group(0); g = lambda a: float(re.search(r'\b%s="([-\d.]+)"' % a, tag).group(1))
    return [(g("x1"), g("y1")), (g("x2"), g("y2"))], re.search(r'stroke="(#[0-9A-Fa-f]{6})"', tag).group(1)
for i, t in ((3, t_L3), (2, t_L2), (1, t_L1)):
    anim_layer(f"ck{i}L", t + 0.03, MV.D_NUDGE, dx=MV.NUDGE, fade=MV.F_NUDGE)
    anim_layer(f"ck{i}", t, MV.D_GLYPH, s0=MV.GLYPH * 100, ease=APPEAR, fade=MV.F_GLYPH)
for ln, t0, t1 in (("ln2", t_ln2, t_L3), ("ln1", t_ln1, t_L2)):
    v, col = line_xy(ln); stroke_layer(ln, v, [Z, Z], [Z, Z], col, t0, t1 - t0, E)
anim_layer("cName", t_name, MV.D_NUDGE, dx=MV.NUDGE, fade=MV.F_NUDGE)
anim_layer("bIcon", t_icon, MV.D_MARK, s0=MV.MARK * 100, ease=APPEAR, fade=MV.F_MARK)
# skeleton: one shape layer (pulse = layer opacity, appears with the card), one group per block (its fade-out = group opacity)
def gone(t, d): return AN([(0, [100], None), (pc(t), [100], E), (pc(t + d), [0], None)])
sk_groups = []
skx = lambda k: re.search(r'<(?:rect|circle) id="%s"[^>]*>' % k, svg).group(0)
num = lambda tag, a: float(re.search(r'\b%s="([-\d.]+)"' % a, tag).group(1))
for k, t, d in (("skV", t_L3, 0.3), ("sk1c", t_L1, 0.2), ("sk1", t_L1, 0.3), ("sk2c", t_L2, 0.2), ("sk2", t_L2, 0.3), ("sk3c", t_L3, 0.2), ("sk3", t_L3, 0.3)):
    tag = skx(k)
    if tag.startswith("<circle"):
        shape = {"ty": "el", "p": st([num(tag, "cx") * S, num(tag, "cy") * S]), "s": st([2 * num(tag, "r") * S] * 2)}
    else:
        x_, y_, w_, h_ = (num(tag, a) for a in ("x", "y", "width", "height"))
        shape = {"ty": "rc", "p": st([(x_ + w_ / 2) * S, (y_ + h_ / 2) * S]), "s": st([w_ * S, h_ * S]), "r": st(num(tag, "rx") * S)}
    sk_groups += grp([shape, {"ty": "fl", "c": st(hexc(SKC)), "o": st(100), "r": 1}], o=gone(t, d))
pk = [(0, [100], None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; pk += [(pc(a_), [100], PULSE), (pc(a_ + PP / 2), [50], PULSE)]
L.layer(4, "skeleton", L.ks(o=AN(pk + [(pc(t_L3), [100], None)])), shapes=sk_groups)
X, Y, w, h = img("card"); L.layer(2, "card", L.ks(p=(X, Y)), refId="card")
X, Y, w, h = img("cardFrost"); L.layer(2, "glass", L.ks(p=(X, Y)), refId="cardFrost")      # rides and fades with the card
CARD = L.layers; L.layers = MAIN
L.precomp("cardComp", CARD, L.ks(p=AN([(0, [0, MV.RISE * S, 0], None), (pc(t_card), [0, MV.RISE * S, 0], E), (pc(t_card + D_CARD), [0, 0, 0], None)]),
                                 o=AN([(0, [0], None), (pc(t_card), [0], E), (pc(t_card + MV.F_ARRIVE), [100], None)])))
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(L.layers), "layers", size // 1024, "KB", f"T={T * TEMPO[NAME]:.2f}s", f"pulse {NP}x{PP * TEMPO[NAME]:.2f}s",
      "L1/L2/L3", [round(v * TEMPO[NAME], 2) for v in (t_L1, t_L2, t_L3)], "skV cy", round(vcy, 2))
