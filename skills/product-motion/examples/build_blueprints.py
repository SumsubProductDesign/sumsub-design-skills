# Blueprints promo (v3, stepped roulette), plays once: the case card slides in; the blueprint cards step along the arc
# one by one with eased moves (KYC → AML investigation → Screening hit → Suspicious activity at the arrow); the card at
# the arrow is the brightest; "Suspicious activity" opens into the blueprint folder, the check and checklist fill in. Freezes on the original frame. usage: python3 build_blueprints.py [light|dark]
import os, sys, json, re, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "blueprints", "Blueprints"
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, "src-blueprints.svg" if THEME == "light" else "src-blueprints-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py (05.10: was missing, ref went stale)

# --- structure ---
svg = wrap(svg, '<foreignObject x="268', '<g id="Case creation source_2"', "cardBp")      # blueprint card + its glass
svg = regroup(svg, {"cardCase": [has('id="Frame 2131328652"'), has('id="Group 2131328652"')]})
for gid in ("cardBp", "cardCase"): svg = strip_glass(svg, gid)
svg = rename(svg, {"Case creation source_2": "tagAml", "Case creation source_3": "tagKyc", "Case creation source_4": "tagHit",
                   "Ellipse 26": "arc", "Polygon 1": "arrow", "small/Filled/Success": "check", "*Tag Colorful*": "alert",
                   "Frame 2147238809": "row1", "Frame 2147238810": "row2", "Frame 2147238813": "row3", "Frame 2147238814": "row4"})
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)
# the three ticks on the arc mark where KYC / AML investigation / Screening hit come to rest: wrap each rect (it carries
# its own rotate() attribute) in a group the animation can scale
TICKS = {"tickKyc": "Rectangle 240653231", "tickAml": "Rectangle 240653232", "tickHit": "Rectangle 240653233"}
for tid, rid in TICKS.items():
    svg, n_ = re.subn(r'(<rect id="%s"[^>]*/>)' % re.escape(rid), r'<g id="%s">\1</g>' % tid, svg, count=1)
    assert n_ == 1, rid
M0 = measure(svg, ["arc", "arrow", "tagHit", "tagAml", "tagKyc"])
CX, CY = M0["arc"][0] + M0["arc"][2] / 2, M0["arc"][1] + M0["arc"][3] / 2      # wheel centre
AX, AY = M0["arrow"][0] + M0["arrow"][2], M0["arrow"][1] + M0["arrow"][3] / 2   # arrow tip and its axis

# --- the reel: the three tags + clones further up the wheel + the "Suspicious activity" pill that wins ---
tpl = {}
for k in ("tagHit", "tagAml", "tagKyc"):
    i, j = group_span(svg, k); tpl[k] = svg[i:j]
ANG = {k: float(re.search(r'rotate\((-?[\d.]+)', tpl[k]).group(1)) for k in tpl}           # each tag's own rotation
VIS = {k: base_opacity(svg, k) for k in tpl}
BG, FG = ("white", "#99A1AF") if THEME == "light" else ("#1A1B1C", "#6A6F74")
def centre(k): x, y, w, h = M0[k]; return x + w / 2, y + h / 2
def rect_w(k): i, j = group_span(svg, k); return float(re.search(r'<rect[^>]* width="([\d.]+)"', svg[i:j]).group(1))
# gap between the arrow tip and a tag's left edge once it sits at the arrow: radius of its centre − half its real width
GAP = min(math.hypot(*(a - b for a, b in zip(centre(k), (CX, CY)))) - rect_w(k) / 2 for k in ("tagHit", "tagAml")) + CX - AX
PX, PY = AX + GAP, AY - 14                                                    # the winner stops on the arrow axis, same gap as the tags
def s_pill(pid, w, op):
    return (f'<g id="{pid}" opacity="{op}"><rect x="{PX:.2f}" y="{PY:.2f}" width="{w:.2f}" height="28" rx="8" fill="{BG}"/>'
            f'<text id="{pid}Text" fill="{FG}" style="white-space: pre" xml:space="preserve" font-family="Geist" font-size="13" letter-spacing="0em">'
            f'<tspan x="{PX + w / 2:.3f}" y="{PY + 16.615:.3f}" text-anchor="middle">Suspicious activity</tspan></text></g>')   # centred (design review: "centre the text in the last card"; the AML tag's 6.3 px left inset left it 7.0 / 9.9 px off-centre)
S_OP = VIS["tagHit"]
probe = s_pill("pillS", 140, S_OP)
tw = measure(svg.replace('<path id="arc"', probe + '<path id="arc"', 1), ["pillSText"])["pillSText"][2]
S_W = round(tw + (122 - 106.11), 2)   # same side paddings as the 'AML investigation' tag (122 wide, 106.11 text)
tpl["pillS"] = s_pill("pillS", S_W, S_OP); ANG["pillS"] = 0.0; VIS["pillS"] = S_OP
ORDER = ["pillS", "tagHit", "tagAml", "tagKyc"]      # along the wheel, from the arrow upwards (final layout)
def polar(k):
    cx, cy = centre(k); return math.degrees(math.atan2(cy - CY, cx - CX)), math.hypot(cx - CX, cy - CY)
def stop_rot(k):                                   # wheel rotation that puts the card's centre on the arrow axis
    phi, r = polar(k); return math.degrees(math.asin((AY - CY) / r)) - phi
W = [stop_rot("tagKyc"), stop_rot("tagAml"), stop_rot("tagHit"), 0.0]         # stops: KYC, AML, Hit, then the winner
TILT = {k: ANG[k] + stop_rot(k) for k in ("tagHit", "tagAml", "tagKyc")}      # residual tilt at its own stop
TILT["pillS"] = 0.0
NUDGE = {}                                          # (dx, dy) in wheel space: pull the card in/out along its radius at its stop
for k in ("tagHit", "tagAml", "tagKyc"):
    (cx, cy), (phi, r) = centre(k), polar(k)
    d = (r - rect_w(k) / 2 + CX - AX) - GAP          # this card's gap minus the common gap
    NUDGE[k] = (-d * math.cos(math.radians(phi)), -d * math.sin(math.radians(phi)))
NUDGE["pillS"] = (0.0, 0.0)
FOCUS = ["tagKyc", "tagAml", "tagHit", "pillS"]                               # which card is at the arrow at each stop
def focus_op(i, stage):                               # the card at the arrow is brightest, -0.1 per step away
    return round(VIS["tagHit"] + 0.1 * (1 - abs(i - (3 - stage))), 3)
reel_open = '<g id="reel">\n'
i = svg.index('<g id="tagAml"')
svg = svg[:i] + reel_open + svg[i:]
i = svg.index('<path id="arc"')
svg = svg[:i] + tpl["pillS"] + "\n</g>\n" + svg[i:]
for k in ORDER:   # bounce wrapper: knocks a card off the arrow independently of its own and the wheel's motion
    i, j = group_span(svg, k); svg = svg[:i] + f'<g id="b_{k}">' + svg[i:j] + '</g>' + svg[j:]
M = measure(svg, ["arc", "arrow", "cardBp", "cardCase", "alert", "check", "tagAml", "tagKyc", "tagHit", "pillS", "row1", "row2", "row3", "row4"] + list(TICKS))
bx, by, bw, bh = M["cardBp"]; sx, sy, sw, sh = M["pillS"]

# --- timeline, seconds ---
MV = motion(NAME)                            # the common motion language (motionlib.LANG)
t_case, t_alert = 0.05, 0.30
t_in = (0.10, 0.40)                          # cards fade in at the first stop
STEPS = [(0.55, 0.90), (1.00, 1.35), (1.45, 1.90)]   # three eased moves; the last one is a touch slower
STEP_EASE = (.6, 0, .25, 1.08)               # smooth in, soft landing with a hint of overshoot
t_stop = STEPS[-1][1]
# a tick appears once its card has landed on it (all three land with the last step), cascading up the arc
t_tick = {k: t_stop - 0.02 + i * 0.05 for i, k in enumerate(["tickHit", "tickAml", "tickKyc"])}
t_open, D_OPEN = t_stop + 0.02, 0.5
# the arrow stays still; the card that reaches it at each stop is knocked AMP px to the right and settles (design review:
# "what if the cards bounce, not the arrow?") — same rhythm the arrow's tick had
AMP, KNOCK_IN, KNOCK_OUT = 3, (.3, 0, .2, 1), (.5, 0, .3, 1)
BOUNCE = {FOCUS[j + 1]: (b, W[j + 1]) for j, (a, b) in enumerate(STEPS)}    # card: (stop time, wheel angle there)
def knock_vec(w):   # +AMP px on screen, expressed in wheel space (the cards ride a wheel rotated by w)
    return AMP * math.cos(math.radians(w)), -AMP * math.sin(math.radians(w))
def bez_y(e, u):    # cubic-bezier(e) progress at time fraction u
    x1, y1, x2, y2 = e; lo, hi = 0.0, 1.0
    for _ in range(40):
        t = (lo + hi) / 2; x = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3
        lo, hi = (t, hi) if x < u else (lo, t)
    t = (lo + hi) / 2; return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3
OFFB = AMP * (1 - bez_y(KNOCK_OUT, (t_open - t_stop) / 0.14))   # the folder opens from where the knocked pill is
# the card under the arrow gets the active text colour, smoothly; leaving it, it goes grey again (design review: "the text of
# the card that lands under the pointer smoothly turns active, and goes grey again as it moves on").
# Active = the folder title's colour (text/neutral/default) — the winner then hands over to the folder without a jump.
ACTIVE = re.search(r'id="Suspicious activity"[^>]*?fill="(#[0-9A-Fa-f]{6})"', svg).group(1)
TEXT = {"tagKyc": "KYC", "tagAml": "AML investigation", "tagHit": "Screening hit", "pillS": "pillSText"}
for k, tid in TEXT.items(): assert svg.count(f'id="{tid}"') == 1, tid
def first_u(target):   # time fraction of a STEP_EASE move at which its progress first reaches `target`
    return next((n / 1000 for n in range(1, 1001) if bez_y(STEP_EASE, n / 1000) >= target), 1.0)
F_COL = MV.F_ARRIVE                                                        # each colour change lasts a fade of the motion language
COLOR = {k: [] for k in ORDER}                                             # k: [(t0, t1, v0, v1)], v = 1 active
for j, (a, b) in enumerate(STEPS):
    leave, arrive = FOCUS[j], FOCUS[j + 1]
    ax_, ay_, aw_, ah_ = M[arrive]                                          # (M has the pill too; M0 only the tags)
    arc_px = math.radians(abs(W[j + 1] - W[j])) * math.hypot(ax_ + aw_ / 2 - CX, ay_ + ah_ / 2 - CY)   # slot length at the arriving card
    u_land = first_u(1 - 1 / arc_px)                                       # visually under the arrow: within 1 px
    t_land = a + u_land * (b - a)                                          # fully active the moment it sits under the arrow
    COLOR[leave].append((a, a + F_COL, 1, 0)); COLOR[arrive].append((t_land - F_COL, t_land, 0, 1))
def grey_keys(k):   # Lottie: the grey text sits under the active one only while that one fades (AA edges stay exact at rest)
    fr = [(0, [0 if k == FOCUS[0] else 100], "h")]
    for t0, t1, v0, v1 in COLOR[k]: fr.append((pc(t1), [0], "h") if v1 else (pc(t0), [100], "h"))
    return fr
def color_keys(k, val):   # [(pct, value, ease)]: active from the start for the card that fades in at the arrow
    fr = [(0, val(1 if k == FOCUS[0] else 0), None)]
    for t0, t1, v0, v1 in COLOR[k]: fr += [(pc(t0), val(v0), IO), (pc(t1), val(v1), None)]   # ease-in-out: a colour, not a move
    return fr
t_check = t_open + 0.38
t_rows = {f"row{n}": t_open + 0.44 + (n - 1) * 0.08 for n in range(1, 5)}
T = t_rows["row4"] + MV.D_ROW
pc = lambda t: round(t / T * 100, 3)
OPEN_EASE = APPEAR                           # the folder opens without a bounce (it starts from rest; the bounce is the roulette stop's)

# ---------- HTML ----------
K = Keyframes(T * TEMPO[NAME], 100)
def move(name, t, d, frm, origin="50% 50%", box="fill-box", ease=E, fade=None):
    bo = base_opacity(svg, name); a0 = f"opacity:0;transform:{frm}"
    frames = [(0, a0, None), (pc(t), a0, ease)]
    if fade: frames.append((pc(t + fade), f"opacity:{bo}", None))
    frames.append((pc(t + d), f"opacity:{bo};transform:none", None))
    K.kf(name, frames)
    K.rule("#" + name, f"transform-box:{box};transform-origin:{origin};animation:{name} {K.dur}")
move("cardCase", t_case, MV.D_ARRIVE, f"translateX({-MV.RISE}px)", fade=MV.F_ARRIVE)   # arrives from the left, along its link
move("alert", t_alert, MV.D_GLYPH, MV.GLYPH_T, ease=APPEAR, fade=MV.F_GLYPH)
def stepped(values, fmt, first=None):
    """keyframes holding `values[k]` between moves, easing through each STEPS move."""
    fr = [(0, fmt(first if first is not None else values[0]), None)]
    if first is not None: fr += [(pc(t_in[0]), fmt(first), None), (pc(t_in[1]), fmt(values[0]), None)]
    for k, (a, b) in enumerate(STEPS):   # values may be tuples (opacity, rotation)
        fr += [(pc(a), fmt(values[k]), STEP_EASE), (pc(b), fmt(values[k + 1]), None)]
    return fr
K.kf("reel", stepped(W, lambda v: f"transform:rotate({v:.3f}deg)"))
K.rule("#reel", f"transform-box:view-box;transform-origin:{CX:.2f}px {CY:.2f}px;animation:reel {K.dur}")
for idx, k in enumerate(ORDER):
    ops = [focus_op(idx, st) for st in range(4)]
    rots = [-TILT[k] if FOCUS[st] == k else 0.0 for st in range(4)]           # level with the arrow while at it
    nud = [NUDGE[k] if FOCUS[st] == k else (0.0, 0.0) for st in range(4)]      # same gap to the arrow tip for every card
    vals = [(o, r, n[0], n[1]) for o, r, n in zip(ops, rots, nud)]
    fmt = lambda v: f"opacity:{v[0]};transform:translate({v[2]:.3f}px,{v[3]:.3f}px) rotate({v[1]:.3f}deg)"
    fr = stepped(vals, fmt, first=(0, rots[0], nud[0][0], nud[0][1]))
    if k == "pillS":   # the winner dissolves into the folder
        fr += [(pc(t_open), fmt(vals[-1]), None), (pc(t_open + 0.16), fmt((0, 0, 0, 0)), None)]
        K.kf(k, fr); K.rule("#pillS", f"opacity:0;transform-box:fill-box;transform-origin:50% 50%;animation:pillS {K.dur}")
    else:
        K.kf(k, fr); K.rule("#" + k, f"transform-box:fill-box;transform-origin:50% 50%;animation:{k} {K.dur}")
for k, tid in TEXT.items():   # the text colour (the fill attribute stays grey: reduced motion shows the original)
    K.kf("tc_" + k, color_keys(k, lambda v: f"fill:{ACTIVE if v else FG}"))
    K.rule(f'[id="{tid}"]', f"animation:tc_{k} {K.dur}")
for k, (b, w) in BOUNCE.items():
    vx, vy = knock_vec(w)
    K.kf("b_" + k, [(0, "transform:none", None), (pc(b - 0.06), "transform:none", KNOCK_IN),
                    (pc(b), f"transform:translate({vx:.3f}px,{vy:.3f}px)", KNOCK_OUT), (pc(b + 0.14), "transform:none", None)])
    K.rule("#b_" + k, f"animation:b_{k} {K.dur}")
SX, SY = sw / bw, sh / bh
frm = f"translate({sx - bx + OFFB:.2f}px,{sy - by:.2f}px) scale({SX:.4f},{SY:.4f})"
K.kf("cardBp", [(0, f"opacity:0;transform:{frm}", None), (pc(t_open), f"opacity:0;transform:{frm}", OPEN_EASE),
                (pc(t_open + 0.12), "opacity:1", None), (pc(t_open + D_OPEN), "opacity:1;transform:none", None)])
K.rule("#cardBp", f"transform-box:view-box;transform-origin:{bx:.2f}px {by:.2f}px;animation:cardBp {K.dur}")
move("check", t_check, MV.D_GLYPH, MV.GLYPH_T, ease=APPEAR, fade=MV.F_GLYPH)
for k, t in t_tick.items(): move(k, t, MV.D_MARK, MV.MARK_T, ease=APPEAR, fade=MV.F_MARK)
for k, t in t_rows.items(): move(k, t, MV.D_ROW, MV.ROW_T, fade=MV.F_ROW)
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. The blueprint cards step along the arc like a roulette; 'Suspicious activity' reaches the arrow and opens into the blueprint folder.",
         svg, K.text(), T)
print(THEME, "html", n // 1024, "KB", f"T={T:.2f}s", f"pill w={S_W}")

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
AN = L.anim
ROWS = list(t_rows)
ANIM = ["cardCase", "cardBp", "reel"] + list(TICKS)
shoot(svg, f"{WORK}/plate.png", hide=ANIM); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
def render(k, pad, hide=()):
    x, y, w, h = M[k]
    shoot(svg, f"{WORK}/{k}.png", only=[k], hide=hide, transparent=True)
    geo[k] = crop(f"{WORK}/{k}.png", x - pad, y - pad, w + 2 * pad, h + 2 * pad)
render("cardCase", 20, hide=["alert"]); render("alert", 3)
render("cardBp", 20, hide=["check"] + ROWS); render("check", 3)
for k in ROWS: render(k, 3)
for k in TICKS: render(k, 3)
full = svg   # render the cards at full opacity; their brightness is animated per layer
for k in ORDER: full = re.sub(r'(<g id="%s") opacity="[\d.]+"' % k, r'\1', full, count=1)
for k in ORDER:
    x, y, w, h = M[k]
    shoot(full, f"{WORK}/{k}.png", only=[k], transparent=True)
    geo[k] = crop(f"{WORK}/{k}.png", x - 4, y - 4, w + 8, h + 8)
for k in ORDER:   # the card without its text + its text in grey and in the active colour, all in the same crop box
    i, j = group_span(full, k); part = full[i:j]; assert part.count(f'fill="{FG}"') == 1, k
    on = full[:i] + part.replace(f'fill="{FG}"', f'fill="{ACTIVE}"') + full[j:]
    x, y, w, h = M[k]; no_rect = f"#{k} rect{{visibility:hidden!important}}"
    for suffix, src, css in (("", full, f'[id="{TEXT[k]}"],[id="{TEXT[k]}"] *{{visibility:hidden!important}}'), ("Off", full, no_rect), ("On", on, no_rect)):
        shoot(src, f"{WORK}/{k}{suffix}.png", only=[k], transparent=True, css=css)
        box = crop(f"{WORK}/{k}{suffix}.png", x - 4, y - 4, w + 8, h + 8)
        assert box == geo[k], (k, suffix, box, geo[k]); geo[k + suffix] = box
added = set()
def img(k):
    X, Y, w, h = geo[k]
    if k not in added: L.image(k, f"{WORK}/{k}.png", w, h); added.add(k)
    return X, Y, w, h
def anim_layer(k, t, d, dx=0, dy=0, s0=100, origin=None, ease=E, fade=None):
    X, Y, w, h = img(k)
    ox, oy = (origin[0] * S, origin[1] * S) if origin else (X + w / 2, Y + h / 2)
    p1 = [ox, oy, 0]; p0 = [ox + dx * S, oy + dy * S, 0]
    L.layer(2, k, L.ks(a=(ox - X, oy - Y), p=AN([(0, p0, None), (pc(t), p0, ease), (pc(t + d), p1, None)]),
                       s=AN([(0, [s0, s0, 100], None), (pc(t), [s0, s0, 100], ease), (pc(t + d), [100, 100, 100], None)]),
                       o=AN([(0, [0], None), (pc(t), [0], ease), (pc(t + (fade or d)), [100], None)])), refId=k)
# layers, top first
for k in ROWS[::-1]: anim_layer(k, t_rows[k], MV.D_ROW, dy=MV.ROW, fade=MV.F_ROW)
anim_layer("check", t_check, MV.D_GLYPH, s0=MV.GLYPH * 100, ease=APPEAR, fade=MV.F_GLYPH)
for k, t in t_tick.items(): anim_layer(k, t, MV.D_MARK, s0=MV.MARK * 100, ease=APPEAR, fade=MV.F_MARK)   # above the cards, as in the SVG
# the four cards: rotation around the wheel centre by (stop angle) through eased moves, brightness by distance to the arrow
def stepped_l(values, first=None):
    fr = [(0, [first if first is not None else values[0]], None)]
    if first is not None: fr += [(pc(t_in[0]), [first], None), (pc(t_in[1]), [values[0]], None)]
    for k2, (a, b) in enumerate(STEPS):
        fr += [(pc(a), [values[k2]], STEP_EASE), (pc(b), [values[k2 + 1]], None)]
    return fr
WHEEL_IND = 900
BOUNCE_IND = {k: 910 + i for i, k in enumerate(BOUNCE)}
for idx, k in reversed(list(enumerate(ORDER))):
    X, Y, w, h = img(k); cx, cy = X + w / 2, Y + h / 2                          # image centre = card centre (2x)
    ops = [focus_op(idx, st) * 100 for st in range(4)]
    rots = [-TILT[k] if FOCUS[st] == k else 0.0 for st in range(4)]
    o = stepped_l(ops, first=0)
    if k == "pillS": o += [(pc(t_open), [ops[-1]], None), (pc(t_open + 0.16), [0], None)]
    nud = [NUDGE[k] if FOCUS[st] == k else (0.0, 0.0) for st in range(4)]
    pos = [[cx + n[0] * S, cy + n[1] * S, 0] for n in nud]
    pk = [(0, pos[0], None), (pc(t_in[0]), pos[0], None), (pc(t_in[1]), pos[0], None)]
    for k2, (a, b) in enumerate(STEPS): pk += [(pc(a), pos[k2], STEP_EASE), (pc(b), pos[k2 + 1], None)]
    MAIN = L.layers; L.layers = []
    img(k + "On"); img(k + "Off")
    L.layer(2, k + " active text", L.ks(a=(w / 2, h / 2), p=(cx, cy), o=AN(color_keys(k, lambda v: [100 * v]))), refId=k + "On")
    L.layer(2, k + " text", L.ks(a=(w / 2, h / 2), p=(cx, cy), o=AN(grey_keys(k))), refId=k + "Off")
    L.layer(2, k, L.ks(a=(w / 2, h / 2), p=(cx, cy)), refId=k)
    INNER = L.layers; L.layers = MAIN
    L.precomp(k + "Comp", INNER, L.ks(a=(cx, cy), p=AN(pk), r=AN(stepped_l(rots, first=rots[0])), o=AN(o)),
              parent=BOUNCE_IND[k] if k in BOUNCE else WHEEL_IND)
# the wheel itself (null, not rendered); its local space equals comp space at rotation 0
L.layer(3, "wheel", L.ks(a=(CX * S, CY * S), p=(CX * S, CY * S), r=AN(stepped_l(W))), ind_fixed=WHEEL_IND)
for k, (b, w) in BOUNCE.items():   # null in wheel space: rest at the origin, knocked by knock_vec(w)
    vx, vy = knock_vec(w); z = [0, 0, 0]; kv = [vx * S, vy * S, 0]
    L.layer(3, f"bounce {k}", L.ks(a=(0, 0), p=AN([(0, z, None), (pc(b - 0.06), z, KNOCK_IN), (pc(b), kv, KNOCK_OUT), (pc(b + 0.14), z, None)])),
            ind_fixed=BOUNCE_IND[k], parent=WHEEL_IND)
X, Y, w, h = img("cardBp")
p_from, p_to = [(sx + OFFB) * S, sy * S, 0], [bx * S, by * S, 0]
L.layer(2, "cardBp", L.ks(a=(bx * S - X, by * S - Y), p=AN([(0, p_from, None), (pc(t_open), p_from, OPEN_EASE), (pc(t_open + D_OPEN), p_to, None)]),
    s=AN([(0, [SX * 100, SY * 100, 100], None), (pc(t_open), [SX * 100, SY * 100, 100], OPEN_EASE), (pc(t_open + D_OPEN), [100, 100, 100], None)]),
    o=AN([(0, [0], None), (pc(t_open), [0], None), (pc(t_open + 0.12), [100], None)])), refId="cardBp")
anim_layer("alert", t_alert, MV.D_GLYPH, s0=MV.GLYPH * 100, ease=APPEAR, fade=MV.F_GLYPH)
anim_layer("cardCase", t_case, MV.D_ARRIVE, dx=-MV.RISE, fade=MV.F_ARRIVE)
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(L.layers), "layers", size // 1024, "KB")
