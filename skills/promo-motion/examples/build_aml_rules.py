# AML Rules promo (v2), plays once: the rule chain rises (#4, #5 inactive, #6 collapsed), the rules connect (the link
# runs from #5 to #6), the last rule opens with its insides still loading (DS skeleton, pulsing), the applicant card rises
# in from the bottom edge, the rule's lines load one by one as the logic tree runs down to "Then review action" (the
# action's values pop in last), and the rule connects to the applicant — the risk skeleton turns into "Low risk".
# Freezes on the original frame.  (v1 — rules checked one by one, #6 pushing the applicant down: old/build_aml_rules_v1.py)
# usage: python3 build_aml_rules.py [light|dark]
import os, sys, re, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "aml-rules", "AML Rules"
TEMPO[NAME] = 1.3
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, f"src-{NAME}.svg" if THEME == "light" else f"src-{NAME}-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py

# --- structure ---
assert svg.count("<foreignObject") == 2
svg = rename(svg, {"Frame 2147239007": "chain", "Popover": "r4", "Popover_2": "r5", "Popover_3": "r6",
                   "Frame 1": "appCard", "*Tag Colorful*_10": "tag", "*Tag Colorful*_8": "pPot", "*Tag Colorful*_9": "pLow",
                   "Connector": "tree", "Rectangle 240653255": "halo6p", "Rectangle 240653256": "haloAp",
                   "Condition view/Title": "rT1", "Condition view/Expression": "rR1", "Condition view/Function": "rR2",
                   "Condition view/Expression_2": "rR3", "Condition view/Title_2": "rT2", "Body_8": "r4a", "Body_9": "r4b", "Body_10": "r4c"})
# the two backdrop blurs (Chrome loses their clip inside a moving group) leave the chain: they stay put, hidden while the
# card opens and the applicant rises, and fade in once each has settled (z-order: under the rest of the chain, as before)
fos = re.findall(r'<foreignObject.*?</foreignObject>', svg, re.S)
for f in fos: svg = svg.replace(f, "", 1)
glass = {("glassApp" if 'x="115"' in f else "glass6"): f for f in fos}
svg = svg.replace('<g id="chain">', "".join(f.replace("<foreignObject", f'<foreignObject id="{k}"', 1) for k, f in glass.items()) + '\n<g id="chain">', 1)
GSHAPE = {}
for k in ("glass6", "glassApp"): svg, GSHAPE[k] = glass_css_clip(svg, k)   # each glass travels/opens with its surface
# Rule #6 opens: its contents (card clip group + outline) in a wrapper clipped at the moving bottom edge, inside the group
# that carries the drop shadow, so the shadow follows the edge
a_, b_ = group_span(svg, "r6"); r6 = svg[a_:b_]
head = re.match(r'<g id="r6"[^>]*>', r6).group(0)
svg = svg[:a_] + head + '<g id="r6in">' + r6[len(head):-len("</g>")] + "</g></g>" + svg[b_:]
svg, n_ = re.subn(r'(<path id="halo6p"[^>]*/>)', r'<g id="halo6">\1</g>', svg, count=1); assert n_ == 1
# the card's bottom border (rounded corners + bottom line of its outline), drawn on its own on top of the clipped contents:
# it rides on the opening edge, so the collapsed rule is a whole card like Rule #5 and keeps its border while it opens
a_, b_ = group_span(svg, "r6")
ol = re.search(r'<path d="M113 ([\d.]+)H382C[^"]*?V([\d.]+)C([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) 382 ([\d.]+)H113C([\d.]+) [\d.]+ ([\d.]+) ([\d.]+) ([\d.]+) [\d.]+V[^"]*" stroke="(#[0-9A-Fa-f]{6})" stroke-width="([\d.]+)"/>', svg[a_:b_])
assert ol, "Rule #6 outline"
OY, OX1, OYB = float(ol.group(2)), float(ol.group(3)), float(ol.group(7))          # straight side ends, right x, bottom y
OX0, OSC, OSW = float(ol.group(9)), ol.group(12), ol.group(13)
CAP = (OX1, OY, OX0, OYB)
cap_d = f"M{OX1:g} {OY:g}C{OX1:g} {float(ol.group(4)):g} {float(ol.group(5)):g} {OYB:g} 382 {OYB:g}H113C{float(ol.group(8)):g} {OYB:g} {OX0:g} {float(ol.group(10)):g} {OX0:g} {OY:g}"
svg = svg[:b_ - len("</g>")] + f'<path id="r6cap" d="{cap_d}" stroke="{OSC}" stroke-width="{OSW}"/>' + svg[b_ - len("</g>"):]
# the applicant card and its glass frame move together (the frame goes up next to the card: they never overlap the stack)
hap = re.search(r'<path id="haloAp"[^>]*/>', svg).group(0); svg = svg.replace(hap, "", 1)
a_, b_ = group_span(svg, "appCard"); svg = svg[:a_] + '<g id="app">' + hap + svg[a_:b_] + "</g>" + svg[b_:]

ROWS = ["rT1", "rR1", "rR2", "rR3", "rT2"]
M0 = measure(svg, ["r6", "Header_3", "halo6p", "haloAp", "appCard", "tag", "tree", "Vector 2", "Vector 3", "Then_2", "Then_3"] + ROWS)
CX0, CY0, CW, CH = 101, 63, 293, 183                          # Rule #6's card (r 12)
assert abs(M0["r6"][0] - CX0) < 0.5 and abs(M0["r6"][3] - CH) < 0.5, M0["r6"]
CB = CY0 + CH                                                  # its bottom when open
HB = CY0 + 33                                                  # its bottom when collapsed: 33 high like Rule #5 (the header)
DELTA = CB - HB
HX, HY, HW, HH = M0["halo6p"]; HM = HY + HH - CB               # the glass frame's margin below the card
RC, RH = 12, 25.6                                              # card / glass frame corner radii
G6D = GSHAPE["glass6"]; YCUT = HY + HH / 2                    # the glass frame's own outline (its smooth Figma corners):
g6open = lambda dy, ox=0, oy=0: lift_path(shift_path(G6D, -ox, -oy), dy, YCUT - oy)   # while it opens the bottom half rides the edge

# the tree wipe needs a reference box larger than its strokes (fill-box would cut half of the end strokes)
tx, ty, tw, th_ = M0["tree"]
svg, n_ = re.subn(r'(<g id="tree">)', r'\1' + f'<rect x="{tx - 2:.2f}" y="{ty - 2:.2f}" width="{tw + 4:.2f}" height="{th_ + 4:.2f}" fill="none"/>', svg, count=1); assert n_ == 1
TB = (tx - 2, ty - 2, tw + 4, th_ + 4)

# loading state, DS skeleton in the colour of the rule's own placeholders (neutral/subtler): inside Rule #6 a bar per line —
# titles 9 high on the cap height, condition/action rows as high as their placeholder pills (12.9, r 4); the applicant's
# risk tag a pill in its place
SKC = SKELETON[THEME]["card"]                       # loaders on the white cards: the DS skeleton token (motionlib.SKELETON)
H_ROW, H_TTL, R_SK = 12.9, 9, 4
cap = text_metrics([("When this happens", 600, 10.05, 0), ("H", 600, 10.05, 0)])
def title_cy(k): return M0[k][1] + cap[0]["ascent"] - cap[1]["ascent"] / 2
mid = lambda k: M0[k][1] + M0[k][3] / 2
r4x0, r4x1 = M0["Then_2"][0], M0["Then_3"][0] + M0["Then_3"][2]
BARS = {"rT1": (M0["rT1"][0], title_cy("rT1"), M0["rT1"][2], H_TTL), "rR1": (M0["rR1"][0], mid("rR1"), M0["rR1"][2], H_ROW),
        "rR2": (M0["rR2"][0], mid("rR2"), M0["rR2"][2], H_ROW), "rR3": (M0["rR3"][0], mid("rR3"), M0["rR3"][2], H_ROW),
        "rT2": (M0["rT2"][0], title_cy("rT2"), M0["rT2"][2], H_TTL), "row4": (r4x0, mid("Then_2"), r4x1 - r4x0, H_ROW)}
sk = "".join(f'<rect id="sk_{k}" x="{x:.2f}" y="{cy - h / 2:.2f}" width="{w:.2f}" height="{h:g}" rx="{R_SK}" fill="{SKC}"/>' for k, (x, cy, w, h) in BARS.items())
svg, n_ = re.subn(r'(<g id="Body">)', f'<g id="r6skP">{sk}</g>' + r'\1', svg, count=1); assert n_ == 1
tr_ = re.search(r'<g id="tag">\s*<path d="M[-\d.]+ [-\d.]+H([-\d.]+)C[-\d.]+ [-\d.]+ ([-\d.]+)', svg)
TR_ = float(tr_.group(2)) - float(tr_.group(1))               # the tag's corner radius
TAG = M0["tag"]
svg, n_ = re.subn(r'(<g id="tag">)', f'<g id="tagSkP"><rect id="tagSk" x="{TAG[0]:.3f}" y="{TAG[1]:.3f}" width="{TAG[2]:.3f}" '
                  f'height="{TAG[3]:.3f}" rx="{TR_:.3f}" fill="{SKC}"/></g>' + r'\1', svg, count=1); assert n_ == 1

# links: the outlined "dot – line – dot" connectors, rebuilt as strokes so the line can be drawn down between its dots
CC = re.search(r'<path id="Vector 2"[^>]*fill="(#[0-9A-Fa-f]{6})"', svg).group(1)
LINKS = {}
for k, src in (("c2", "Vector 2"), ("c3", "Vector 3")):
    x, y, w, h = M0[src]; r = w / 2; cx = x + r; ya, yb = y + r, y + h - r; LINKS[k] = (cx, ya, yb, r)
    mk = (f'<g id="{k}"><path id="{k}l" d="M{cx:g} {ya:.3f}V{yb:.3f}" pathLength="1" stroke="{CC}"/>'
          f'<circle id="{k}a" cx="{cx:g}" cy="{ya:.3f}" r="{r:.3f}" fill="{CC}"/><circle id="{k}b" cx="{cx:g}" cy="{yb:.3f}" r="{r:.3f}" fill="{CC}"/></g>')
    svg = re.sub(r'<path id="%s"[^>]*/>' % src, mk, svg, count=1)
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)

ANIM = ["chain", "glass6", "glassApp", "r6in", "r6cap", "halo6", "app", "tree", "pPot", "pLow", "tag", "tagSk", "tagSkP", "r6skP",
        "c2a", "c2b", "c2l", "c3a", "c3b", "c3l", "r4a", "r4b", "r4c"] + ROWS + [f"sk_{k}" for k in BARS]
for k in ANIM:     # a CSS transform/opacity animation would override these attributes
    tag = re.search(r'<[a-zA-Z]+ id="%s"[^>]*>' % re.escape(k), svg).group(0)
    assert ' transform=' not in tag and ' opacity=' not in tag, (k, tag[:140])
M = measure(svg, ["r4", "r5", "halo6", "app", "appCard", "tag", "pPot", "pLow", "tree", "glass6", "glassApp", "r4a", "r4b", "r4c"] + ROWS)

# --- timeline, seconds (stretched by TEMPO) ---
MV = motion(NAME)                                # the common motion language (motionlib.LANG)
t_in, D_IN = 0.05, MV.D_ARRIVE                   # the chain rises in
t_c2 = 0.5                                       # the rules connect: the link runs from #5 to #6
D_DOT, D_LINE = 0.25, 0.3
t_unf, D_UNF = t_c2 + 0.05 + D_LINE + 0.05, 0.75 # the last rule opens; its insides are loading
E_UNF = (.45, 0, .2, 1)
t_g6 = t_unf + D_UNF
t_app, D_APP, APP_DY = t_unf + 0.5, 0.7, 110     # the applicant card rises in from below the frame
t_gA = t_app + D_APP
# the rule loads line by line as the logic tree runs down: a line resolves when the wipe passes its middle
t_tree, D_TREE = t_app + 0.4, 0.62
E_TREE = (.3, 0, .7, 1)
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
T_ROW = {k: t_tree + D_TREE * time_at(E_TREE, min(1, max(0, (BARS[k][1] - TB[1]) / TB[3]))) for k in ROWS}
T_ROW["row4"] = T_ROW["rT2"] + 0.14              # the action line, right under the tree's last branch
t_pot, t_low = T_ROW["row4"] + 0.05, T_ROW["row4"] + 0.2   # its values pop in
t_c3 = t_low + 0.15                              # the rule connects to the applicant…
t_tag = t_c3 + 0.05 + D_LINE                     # …and the risk resolves when the link arrives
T = t_tag + MV.D_POP + 0.05
T = math.ceil(T * TEMPO[NAME] * 60 - 1e-6) / (60 * TEMPO[NAME])   # a whole number of 60 fps frames (Lottie and HTML stay in step)
pc = lambda t: round(t / T * 100, 3)
PULSE = (.4, 0, .6, 1)
t_p0 = t_unf
NP = max(1, round((T - t_p0) * TEMPO[NAME] / 0.9)); PP = (T - t_p0) / NP      # one pulse for every skeleton, ~0.9 s cycles

# ---------- HTML ----------
K = Keyframes(T * TEMPO[NAME], 100)
def move(name, t, d, frm, origin="50% 50%", box="fill-box", ease=E, fade=None, sel=None):
    a0 = f"opacity:0;transform:{frm}"
    frames = [(0, a0, None), (pc(t), a0, ease)]
    if fade: frames.append((pc(t + fade), "opacity:1", None))
    frames.append((pc(t + d), "opacity:1;transform:none", None))
    K.kf(name, frames)
    K.rule(sel or "#" + name, f"transform-box:{box};transform-origin:{origin};animation:{name} {K.dur}")
def fade(name, t, d, v0, v1, static=None):
    K.kf(name, [(0, f"opacity:{v0}", None), (pc(t), f"opacity:{v0}", E), (pc(t + d), f"opacity:{v1}", None)])
    K.rule("#" + name, (f"opacity:{static};" if static is not None else "") + f"animation:{name} {K.dur}")
def pop(name, t, d=0.3):
    K.kf(name, [(0, "transform:scale(0)", None), (pc(t), "transform:scale(0)", APPEAR), (pc(t + d), "transform:none", None)])
    K.rule("#" + name, f"transform-box:fill-box;transform-origin:50% 50%;animation:{name} {K.dur}")
def draw(name, t, d, ease=E):
    K.kf(name, [(0, "stroke-dashoffset:1", None), (pc(t), "stroke-dashoffset:1", ease), (pc(t + d), "stroke-dashoffset:0", None)])
    K.rule("#" + name, f"stroke-dasharray:1 2;animation:{name} {K.dur}")
def link_html(k, t):
    pop(f"{k}a", t, D_DOT); draw(f"{k}l", t + 0.05, D_LINE); pop(f"{k}b", t + 0.05 + D_LINE - 0.03, D_DOT)
move("chain", t_in, D_IN, MV.ARRIVE, fade=MV.F_ARRIVE)
link_html("c2", t_c2)
P_OPEN = pc(t_unf + D_UNF)
def unfold(name, x0, rad):
    f0 = f"clip-path:inset(0 0 {x0:.3f}px 0 round {rad}px)"
    K.kf(name, [(0, f0, None), (pc(t_unf), f0, E_UNF), (P_OPEN, f"clip-path:inset(0 0 0px 0 round {rad}px)", None), (P_OPEN + 0.01, "clip-path:none", None)])
    K.rule("#" + name, f"animation:{name} {K.dur}")
unfold("r6in", DELTA, RC)
h0 = "clip-path:path('%s')" % g6open(-DELTA, HX, HY)
K.kf("halo6", [(0, h0, None), (pc(t_unf), h0, E_UNF), (P_OPEN, "clip-path:path('%s')" % g6open(0, HX, HY), None), (P_OPEN + 0.01, "clip-path:none", None)])
K.rule("#halo6", f"animation:halo6 {K.dur}")
K.kf("r6cap", [(0, f"transform:translateY({-DELTA:.3f}px)", None), (pc(t_unf), f"transform:translateY({-DELTA:.3f}px)", E_UNF), (P_OPEN, "transform:none", None)])
K.kf("r6capOff", [(0, "visibility:visible", "steps(1,end)"), (P_OPEN + 0.005, "visibility:hidden", None)])
K.rule("#r6cap", f"visibility:hidden;animation:r6cap {K.dur},r6capOff {K.dur}")
# Rule #6's glass: rises with the chain, materialises with it, and opens with the rule (its bottom corners ride the edge)
K.kf("glass6T", [(0, f"transform:{MV.ARRIVE}", None), (pc(t_in), f"transform:{MV.ARRIVE}", E), (pc(t_in + D_IN), "transform:none", None)])
K.rule("#glass6", f"animation:glass6T {K.dur}")
# (while it opens: the file's own outline, its bottom half riding the edge — the same corners all the way)
G6LOC, G6CID = GLASS_CLIPS["glass6"]
gx6, gy6 = (float(v) for v in re.search(r'<foreignObject id="glass6" x="([\d.]+)" y="([\d.]+)"', svg).groups())
g0 = "clip-path:path('%s')" % g6open(-DELTA, gx6, gy6)
K.kf("glass6C", [(0, g0, None), (pc(t_unf), g0, E_UNF), (P_OPEN, "clip-path:path('%s')" % g6open(0, gx6, gy6), "steps(1,end)"),
                 (P_OPEN + 0.01, "clip-path:path('%s')" % G6LOC, "steps(1,end)"), (99.99, f"clip-path:url(#{G6CID})", None)])
K.kf("glass6B", [(0, "backdrop-filter:blur(0px)", None), (pc(t_in), "backdrop-filter:blur(0px)", E), (pc(t_in + MV.F_ARRIVE), "backdrop-filter:blur(2px)", None)])
K.rule("#glass6>div", f"animation:glass6B {K.dur},glass6C {K.dur}")
K.kf("app", [(0, f"opacity:0;transform:translateY({APP_DY}px)", None), (pc(t_app), f"opacity:0;transform:translateY({APP_DY}px)", E),
             (pc(t_app + 0.3), "opacity:1", None), (pc(t_app + D_APP), "opacity:1;transform:none", None)])
K.rule("#app", f"animation:app {K.dur}")
glass_follow(K, pc, "glassApp", t_app, D_APP, f"translateY({APP_DY}px)", 2)     # the applicant card's glass arrives with it
fr = [(0, "opacity:1", None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; fr += [(pc(a_), "opacity:1", PULSE), (pc(a_ + PP / 2), "opacity:.5", PULSE)]
K.kf("pulse", fr + [(100, "opacity:1", None)])
K.rule("#r6skP,#tagSkP", f"animation:pulse {K.dur}")
def resolve(k, t, content=None):    # a skeleton bar gives way to its line (fades in, sliding in from the left)
    fade(f"sk_{k}", t, 0.25, 1, 0, static=0)
    if content: move(content, t + 0.03, MV.D_NUDGE, MV.NUDGE_T, fade=MV.F_NUDGE)
for k in ROWS: resolve(k, T_ROW[k], k)
resolve("row4", T_ROW["row4"])
move("r4t", T_ROW["row4"] + 0.03, MV.D_NUDGE, MV.NUDGE_T, fade=MV.F_NUDGE, sel="#r4a,#r4b,#r4c")
f0 = f"clip-path:inset(0 0 {TB[3]:.3f}px 0)"
K.kf("tree", [(0, f0, None), (pc(t_tree), f0, E_TREE), (pc(t_tree + D_TREE), "clip-path:inset(0 0 0px 0)", None), (99.99, "clip-path:inset(0 0 0px 0)", None), (100, "clip-path:none", None)])
K.rule("#tree", f"animation:tree {K.dur}")
move("pPot", t_pot, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
move("pLow", t_low, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
link_html("c3", t_c3)
fade("tagSk", t_tag, 0.25, 1, 0, static=0)
move("tag", t_tag, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. The rules connect, the last one opens and "
         "loads line by line while the applicant card comes in; the rule connects to the applicant, whose risk resolves to Low risk.",
         svg, K.text(), T)
print(THEME, "html", n // 1024, "KB", f"T={K.T:.2f}s", "rows", {k: round(v * TEMPO[NAME], 2) for k, v in T_ROW.items()}, f"pulse {NP}x{PP * TEMPO[NAME]:.2f}s")
if "--html" in sys.argv: sys.exit()

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
L.frac = True
AN = L.anim
shoot(svg, f"{WORK}/plate.png", hide=["glass6", "glassApp", "chain"]); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
NOSH = "[filter]{filter:none!important}"
def render(k, box, pad, src=None, only=None, hide=(), css="", top=0, bottom=0):
    """`top`/`bottom`: extra canvas (unclip) for elements that reach past the frame and move."""
    s_, H2 = (unclip(src or svg, top, bottom) if (top or bottom) else (src or svg, 354))
    x, y, w, h = box
    shoot(s_, f"{WORK}/{k}.png", only=only or [k], hide=hide, transparent=True, css=css, H=H2)
    g = crop(f"{WORK}/{k}.png", x - pad, y - pad + top, w + 2 * pad, h + 2 * pad, H=H2)
    g[1] -= top * S; geo[k] = g
render("r4", M["r4"], 26, top=40)
render("r5", M["r5"], 26)
render("halo6", M["halo6"], 1)
render("r6c", (CX0, CY0, CW, CH), 1, only=["r6"], hide=["tree", "pPot", "pLow", "r6skP", "r4a", "r4b", "r4c", "r6cap"] + ROWS, css=NOSH)
# the card's drop shadow alone: the filter without its last step (the card drawn over the shadow)
sh = re.sub(r'(<filter id="filter4_d_[^"]+".*?)<feBlend mode="normal" in="SourceGraphic"[^>]*/>', r'\1', svg, count=1, flags=re.S)
assert sh != svg
render("r6s", (CX0, CY0, CW, CH), 26, src=sh, only=["r6"])
render("tree", TB, 0, css=NOSH)
for k in ROWS + ["pPot", "pLow"]: render(k, M[k], 2, css=NOSH)
R4 = ("r4a", "r4b", "r4c")
x0_ = min(M[k][0] for k in R4); y0_ = min(M[k][1] for k in R4); x1_ = max(M[k][0] + M[k][2] for k in R4); y1_ = max(M[k][1] + M[k][3] for k in R4)
render("r4t", (x0_, y0_, x1_ - x0_, y1_ - y0_), 2, only=list(R4), css=NOSH)
render("appCard", M["appCard"], 80, only=["appCard"], hide=["tag", "tagSkP"], bottom=90)
render("haloAp", M0["haloAp"], 1)
render("tag", M["tag"], 2, css=NOSH)
shoot(svg, f"{WORK}/frost.png", hide=["chain"])
for k in ("glass6", "glassApp"): geo[k + "F"] = shape_crop(f"{WORK}/frost.png", GSHAPE[k], M[k], f"{WORK}/{k}F.png")   # glass-shaped
def img(k):
    X, Y, w, h = geo[k]; L.image(k, f"{WORK}/{k}.png", w, h); return X, Y, w, h
def keyed(v0, v1, t, d, ease=E):
    return AN([(0, v0, None), (pc(t), v0, ease), (pc(t + d), v1, None)])
hexc = lambda h: [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
TRF = lambda o=None: {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": o or st(100)}
grp = lambda items, o=None: [{"ty": "gr", "it": items + [TRF(o)]}]
def rr_shape(x0, y0, x1, y1, r, ox=0, oy=0):
    """Rounded rect path in a layer space whose origin is at comp px (ox, oy); radius clamped like CSS."""
    r = min(r, (x1 - x0) / 2, (y1 - y0) / 2) * S; X0, Y0, X1, Y1 = x0 * S - ox, y0 * S - oy, x1 * S - ox, y1 * S - oy
    c = r * .5523
    return {"c": True, "v": [[X0 + r, Y0], [X1 - r, Y0], [X1, Y0 + r], [X1, Y1 - r], [X1 - r, Y1], [X0 + r, Y1], [X0, Y1 - r], [X0, Y0 + r]],
            "i": [[-c, 0], [0, 0], [0, -c], [0, 0], [c, 0], [0, 0], [0, c], [0, 0]],
            "o": [[0, 0], [c, 0], [0, 0], [0, c], [0, 0], [-c, 0], [0, 0], [0, -c]]}
def unfold_mask(x0, y0, x1, r, ox, oy, extra=0):
    """Mask whose bottom follows the opening edge (collapsed bottom HB → open CB, + `extra`)."""
    ks = [(0, [rr_shape(x0, y0, x1, HB + extra, r, ox, oy)], None), (pc(t_unf), [rr_shape(x0, y0, x1, HB + extra, r, ox, oy)], E_UNF),
          (pc(t_unf + D_UNF), [rr_shape(x0, y0, x1, CB + extra, r, ox, oy)], None)]
    return [{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "opening", "pt": AN(ks)}]
def d_shape(d, ox, oy):
    """An absolute SVG path (M/L/H/V/C/Z) as a closed Lottie path in a layer space whose origin is at comp px (ox, oy)."""
    toks = re.findall(r'[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d); v, ii, oo, i, cmd, cur = [], [], [], 0, None, None
    P = lambda x, y: [x * S - ox, y * S - oy]
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
            if cmd == "Z": break
            continue
        n = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6}[cmd]; a = [float(t) for t in toks[i:i + n]]; i += n
        if cmd == "M": cur = a; v.append(P(*a)); ii.append([0, 0]); oo.append([0, 0]); cmd = "L"; continue
        if cmd == "C":
            c1, c2, p = P(a[0], a[1]), P(a[2], a[3]), P(a[4], a[5]); oo[-1] = [c1[0] - v[-1][0], c1[1] - v[-1][1]]
            v.append(p); ii.append([c2[0] - p[0], c2[1] - p[1]]); oo.append([0, 0]); cur = a[4:6]; continue
        cur = [a[0], cur[1]] if cmd == "H" else [cur[0], a[0]] if cmd == "V" else a
        v.append(P(*cur)); ii.append([0, 0]); oo.append([0, 0])
    if abs(v[-1][0] - v[0][0]) < 1e-6 and abs(v[-1][1] - v[0][1]) < 1e-6: ii[0] = ii[-1]; v.pop(); ii.pop(); oo.pop()
    return {"c": True, "v": v, "i": ii, "o": oo}
def grow_d(d, m):
    """The same outline pushed out by m on every side (same vertices: a mask that has stepped aside)."""
    xc, yc = HX + HW / 2, YCUT
    toks = re.findall(r'[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d); out, i, cmd = [], 0, None
    while i < len(toks):
        if toks[i].isalpha(): cmd = toks[i]; out.append(cmd); i += 1; continue
        n = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "Z": 0}[cmd]; a = [float(t) for t in toks[i:i + n]]; i += n
        f = lambda val, c: val + m if val >= c else val - m
        a = [f(a[0], xc)] if cmd == "H" else [f(a[0], yc)] if cmd == "V" else [f(val, yc if j % 2 else xc) for j, val in enumerate(a)]
        out.append(" ".join(f"{val:.4f}" for val in a))
        if cmd == "M": cmd = "L"
    return " ".join(out)
def glass_open_mask(ox, oy):
    """Rule #6's glass frame / frost: its own outline all the way — top corners fixed, the bottom ones riding the
    opening edge — then out of the way once open."""
    sh = lambda dy: d_shape(g6open(dy), ox, oy)
    ks = [(0, [sh(-DELTA)], None), (pc(t_unf), [sh(-DELTA)], E_UNF), (P_OPEN, [sh(0)], "h"), (P_OPEN + 0.01, [d_shape(grow_d(G6D, 60), ox, oy)], None)]
    return [{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "opening", "pt": AN(ks)}]
def unfold_mask_open(x0, y0, x1, r, ox, oy, extra=0):
    """unfold_mask that steps aside once open — the glass's own (smooth) corners then show, not the circular cut."""
    m = unfold_mask(x0, y0, x1, r, ox, oy, extra)
    ks = m[0]["pt"]["k"]; ks[-1]["h"] = 1
    ks.append({"t": round((pc(t_unf + D_UNF) + 0.01) / 100 * L.OP, 2), "s": [rr_shape(x0 - 60, y0 - 60, x1 + 60, CB + extra + 60, 0, ox, oy)]})
    return m
def dot(name, cx, cy, rad, t):
    L.layer(4, name, L.ks(p=(cx * S, cy * S), s=keyed([0, 0, 100], [100, 100, 100], t, D_DOT, APPEAR)),
            shapes=grp([{"ty": "el", "p": st([0, 0]), "s": st([2 * rad * S, 2 * rad * S])}, {"ty": "fl", "c": st(hexc(CC)), "o": st(100), "r": 1}]))
def link_lottie(k, t):
    cx, ya, yb, rad = LINKS[k]
    dot(k + "b", cx, yb, rad, t + 0.05 + D_LINE - 0.03); dot(k + "a", cx, ya, rad, t)
    path = {"c": False, "v": [[cx * S, ya * S], [cx * S, yb * S]], "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]]}
    L.layer(4, k + "l", L.ks(), shapes=grp([{"ty": "sh", "ks": st(path)},
        {"ty": "tm", "s": st(0), "e": keyed([0], [100], t + 0.05, D_LINE), "o": st(0), "m": 1},
        {"ty": "st", "c": st(hexc(CC)), "o": st(100), "w": st(1 * S), "lc": 1, "lj": 1, "ml": 4}]))
pk = [(0, [100], None)]
for n_ in range(NP): a_ = t_p0 + n_ * PP; pk += [(pc(a_), [100], PULSE), (pc(a_ + PP / 2), [50], PULSE)]
pulse = lambda: AN(pk + [(100, [100], None)])
gone = lambda t, d=0.25: keyed([100], [0], t, d)
def bar(x, cy, w, h, r, o):
    return grp([{"ty": "rc", "p": st([(x + w / 2) * S, cy * S]), "s": st([w * S, h * S]), "r": st(r * S)},
                {"ty": "fl", "c": st(hexc(SKC)), "o": st(100), "r": 1}], o=o)
def slide_in(k, t):
    X, Y, w, h = img(k)
    L.layer(2, k, L.ks(p=keyed([X + MV.NUDGE * S, Y, 0], [X, Y, 0], t, MV.D_NUDGE), o=keyed([0], [100], t, MV.F_NUDGE)), refId=k)
# chain precomp, top first: links; applicant precomp (tag, its skeleton, card, glass frame — rising in, true group
# opacity); Rule #6 (action values, rule lines, logic tree, skeleton, card cut at the opening edge, its shadow); #5, #4;
# Rule #6's glass frame
link_lottie("c3", t_c3); link_lottie("c2", t_c2)
MAIN = L.layers; L.layers = []
X, Y, w, h = img("tag")
L.layer(2, "tag", L.ks(a=(w / 2, h / 2), p=(X + w / 2, Y + h / 2), s=keyed([MV.POP * 100, MV.POP * 100, 100], [100, 100, 100], t_tag, MV.D_POP, APPEAR),
        o=keyed([0], [100], t_tag, MV.F_POP)), refId="tag")
L.layer(4, "tag skeleton", L.ks(o=pulse()), shapes=bar(TAG[0], TAG[1] + TAG[3] / 2, TAG[2], TAG[3], TR_, gone(t_tag)))
for k in ("appCard", "haloAp", "glassAppF"):    # (its glass under the frame: rides and fades with the card)
    X, Y, w, h = img(k); L.layer(2, k, L.ks(p=(X, Y)), refId=k)
APPL = L.layers; L.layers = MAIN
L.precomp("appComp", APPL, L.ks(p=keyed([0, APP_DY * S, 0], [0, 0, 0], t_app, D_APP), o=keyed([0], [100], t_app, 0.3)))
for k, t in (("pLow", t_low), ("pPot", t_pot)):
    X, Y, w, h = img(k)
    L.layer(2, k, L.ks(a=(w / 2, h / 2), p=(X + w / 2, Y + h / 2), s=keyed([MV.POP * 100, MV.POP * 100, 100], [100, 100, 100], t, MV.D_POP, APPEAR),
            o=keyed([0], [100], t, MV.F_POP)), refId=k)
slide_in("r4t", T_ROW["row4"] + 0.03)
for k in reversed(ROWS): slide_in(k, T_ROW[k] + 0.03)
X, Y, w, h = img("tree")
tm = lambda yb: {"c": True, "v": [[-4, -4], [w + 4, -4], [w + 4, yb], [-4, yb]], "i": [[0, 0]] * 4, "o": [[0, 0]] * 4}
L.layer(2, "tree", L.ks(p=(X, Y)), refId="tree", hasMask=True, masksProperties=[{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "wipe",
        "pt": keyed([tm(0)], [tm(h + 4)], t_tree, D_TREE, E_TREE)}])
sk_items = []
for k, (x, cy, w_, h_) in BARS.items(): sk_items += bar(x, cy, w_, h_, R_SK, gone(T_ROW[k]))
L.layer(4, "rule skeleton", L.ks(o=pulse()), shapes=sk_items, hasMask=True, masksProperties=unfold_mask(CX0, CY0, CX0 + CW, RC, 0, 0))
x1c, y0c, x0c, ybc = CAP; kk = (ybc - y0c) * .5523         # the bottom border, riding on the opening edge until it is open
cap_path = {"c": False, "v": [[x1c * S, y0c * S], [382 * S, ybc * S], [113 * S, ybc * S], [x0c * S, y0c * S]],
            "i": [[0, 0], [(x1c - 382) * .5523 * S, 0], [0, 0], [0, (ybc - y0c) * .5523 * S]],
            "o": [[0, kk * S], [0, 0], [(x0c - 113) * .5523 * S, 0], [0, 0]]}
L.layer(4, "rule 6 bottom border", L.ks(p=keyed([0, -DELTA * S, 0], [0, 0, 0], t_unf, D_UNF, E_UNF),
        o=AN([(0, [100], None), (P_OPEN, [100], None), (P_OPEN + 0.01, [0], None)])),
        shapes=grp([{"ty": "sh", "ks": st(cap_path)}, {"ty": "st", "c": st(hexc(OSC)), "o": st(100), "w": st(float(OSW) * S), "lc": 1, "lj": 1, "ml": 4}]))
X, Y, w, h = img("r6c")
L.layer(2, "rule 6", L.ks(p=(X, Y)), refId="r6c", hasMask=True, masksProperties=unfold_mask(CX0, CY0, CX0 + CW, RC, X, Y))
X, Y, w, h = img("r6s")      # the shadow, cut 24 px outside the opening card (its blur reach)
L.layer(2, "rule 6 shadow", L.ks(p=(X, Y)), refId="r6s", hasMask=True, masksProperties=unfold_mask(CX0 - 24, CY0 - 24, CX0 + CW + 24, RC + 24, X, Y, extra=24))
for k in ("r5", "r4"):
    X, Y, w, h = img(k); L.layer(2, k, L.ks(p=(X, Y)), refId=k)      # their 0.6 group opacity is baked into the render
X, Y, w, h = img("halo6")
L.layer(2, "rule 6 glass frame", L.ks(p=(X, Y)), refId="halo6", hasMask=True, masksProperties=glass_open_mask(X, Y))
X, Y, w, h = img("glass6F")                      # its glass: in the chain (rises and fades with it), opening with the frame
L.layer(2, "rule 6 glass", L.ks(p=(X, Y)), refId="glass6F", hasMask=True, masksProperties=glass_open_mask(X, Y))
CHAIN = L.layers; L.layers = []
L.precomp("chainComp", CHAIN, L.ks(p=keyed([0, MV.RISE * S, 0], [0, 0, 0], t_in, D_IN), o=keyed([0], [100], t_in, MV.F_ARRIVE)))
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(CHAIN), "chain layers", size // 1024, "KB", f"T={T * TEMPO[NAME]:.2f}s")
