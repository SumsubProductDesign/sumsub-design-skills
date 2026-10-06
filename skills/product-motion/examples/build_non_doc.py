# Non-Doc Identity promo (v3), plays once: the stack rises with the first applicant from Singapore; then the cards are
# shuffled like a deck — the card underneath slides out from under the Singapore one and is laid on top, the Singapore card goes
# under it to the back (its data fading); the new top card becomes the applicant from Brazil — photo, name, flag, CPF
# typed in — and "Verified instantly" lands. Freezes on the original frame.
# usage: python3 build_non_doc.py [light|dark]
import os, sys, json, re, base64, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "non-doc", "Non-Doc Identity"
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, "src-non-doc.svg" if THEME == "light" else "src-non-doc-dark.svg"), WORK)
svg = ds_remap(svg, THEME)
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py
LIGHT_SRC = open(os.path.join(TOOLS, "src-non-doc.svg")).read()       # text geometry (dark export has outlined text)

# --- structure: shadows / back card / main card (Brazil) / verified ---
i, j = group_span(svg, "block-wrapper"); inner = svg[i:j]
a = inner.index('<g id="shadow_2"'); b = inner.index('<foreignObject x="109.5"'); c = inner.index('<foreignObject x="101.5" y="43.5"')
e = inner.rindex("</g>")
inner = (inner[:a] + '<g id="shadows">' + inner[a:b] + '</g>\n<g id="back">' + inner[b:c] + '</g>\n<g id="mainCard">' + inner[c:e] + '</g>\n' + inner[e:])
svg = svg[:i] + inner + svg[j:]
i = svg.index('<foreignObject x="101.5" y="263.5"'); _, j = group_span(svg, "block")
svg = svg[:i] + '<g id="verified">' + svg[i:j] + '</g>' + svg[j:]
svg = strip_glass(svg, "illustration")
svg = rename(svg, {"BR": "flag", "Placeholder": "country", "Placeholder_2": "cpf", "text": "who",
                   "normal/checkmark-outline": "check", "Title_2": "verifiedText"})
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)
M0 = measure(svg, ["flag", "avatar", "back", "mainCard"])

# --- the first applicant (Singapore): a copy of the main card with new data, drawn under it ---
def light_text(src_id, content, new_id, fill):
    m = re.search(r'<text id="%s"([^>]*)><tspan([^>]*)>[^<]*</tspan></text>' % re.escape(src_id), LIGHT_SRC)
    attrs = re.sub(r'fill="[^"]+"', f'fill="{fill}"', m.group(1))
    return f'<text id="{new_id}"{attrs}><tspan{m.group(2)}>{content}</tspan></text>'
def fill_of(eid):
    return re.search(r'<(?:text|path) id="%s"[^>]*?fill="(#[0-9A-Fa-f]{6})"' % re.escape(eid), svg).group(1)
FILLS = {k: fill_of(v) for k, v in {"Title": "Title", "Subtitle": "Subtitle", "label": "label", "label_2": "label_2", "Placeholder": "country", "Placeholder_2": "cpf"}.items()}
i, j = group_span(svg, "mainCard")
ch = clone_group(svg[i:j], "ch_", "chCard")      # ids AND their url(#…) references (the inputs' borders are masked: a copy that
                                                 # kept the original's masks lost its borders whenever the original was hidden)
SWISS = {"Title": ("ch_Title", "Adrian Westerhout"),   # a Singapore Eurasian name (Dutch-origin surname) — fits the photo
         "Subtitle": ("ch_Subtitle", "Applicant"), "label": ("ch_label", "Country"),
         "label_2": ("ch_label_2", "NRIC number"), "Placeholder": ("ch_country", "Singapore"), "Placeholder_2": ("ch_cpf", "S8823415D")}
# (design review: the first applicant from Singapore — the NRIC: S = citizen born before 2000, 88 = born 1988, the last
#  letter is the official checksum (weights 2765432, "JZIHGFEDCBA"; checked on the sample S1234567D))
for src_id, (cid, content) in SWISS.items():
    new = light_text(src_id, content, cid, FILLS[src_id])
    ch, n = re.subn(r'<text id="%s"[^>]*>.*?</text>|<path id="%s"[^>]*/>' % (re.escape(cid), re.escape(cid)), lambda m: new, ch, count=1, flags=re.S)
    assert n == 1, cid
# photo: the young man from the Reusable KYC illustration (same Assets library), clipped to the avatar shape
av_d = re.search(r'<path id="ch_avatar" d="([^"]+)"', ch).group(1)
ax_, ay_, aw_, ah_ = M0["avatar"]
b64 = base64.b64encode(open(os.path.join(TOOLS, "asset-avatar-ch.jpg"), "rb").read()).decode()
photo = (f'<g id="ch_avatar"><clipPath id="chAvClip"><path d="{av_d}"/></clipPath>'
         f'<image x="{ax_}" y="{ay_}" width="{aw_}" height="{ah_}" preserveAspectRatio="xMidYMid slice" clip-path="url(#chAvClip)" xlink:href="data:image/jpeg;base64,{b64}"/></g>')
ch, n = re.subn(r'<path id="ch_avatar"[^>]*/>', lambda m: photo, ch, count=1); assert n == 1
# flag: the DS Flag component, Singapore (SG) (Assets 3183:80869), placed over the Brazil flag's box
fl = open(os.path.join(TOOLS, "asset-flag-sg.svg")).read()
fl_inner = fl[fl.index("<g id="):fl.rindex("</svg>")]
fl_inner = re.sub(r'id="([^"]+)"', lambda m: f'id="chfl_{m.group(1)}"', fl_inner)
fl_inner = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#chfl_{m.group(1)})', fl_inner)
fx, fy, fw, fh = M0["flag"]; k = fw / 16
fi, fj = group_span(ch, "ch_flag")
# the placement transform lives on an outer group: a CSS animation on the element itself would override it
ch = ch[:fi] + f'<g transform="translate({fx} {fy}) scale({k:.4f})"><g id="ch_flag">{fl_inner}</g></g>' + ch[fj:]
i = svg.index('<g id="mainCard"')
svg = svg[:i] + ch + "\n" + svg[i:]
# deck shuffle: the back card in the file is only a 16px strip, so a full blank card (the main card without its data)
# plays the card underneath. SVG order can't change mid-animation, so each moving card has a copy on the other level
# that takes over at the moment the two cards are pulled apart.
# the plain back card (the 16px strip is the top of it): a full card in the strip's look — its fill, corner radius 12 and
# drop shadow — drawn in the moving cards' unscaled coordinates, so that at the back position (scale = strip width /
# card width) its top is exactly the strip. The card going to the back turns into it on the way; the card coming out
# starts as it.
BX0, BY0, BW0, BH0 = M0["back"]; MX0, MY0, MW0, MH0 = M0["mainCard"]; SB0 = BW0 / MW0
STRIP_FILL = re.search(r'<g id="back">.*?<path d="[^"]+" fill="([^"]+)"', svg, re.S).group(1)
f3 = re.search(r'<g id="back">.*?filter="url\(#([^)]+)\)"', svg, re.S).group(1)
f3m = re.search(r'<filter id="%s".*?</filter>' % f3, svg, re.S).group(0)
fw_ = re.sub(r'<filter id="[^"]+" x="[^"]+" y="[^"]+" width="[^"]+" height="[^"]+"',
             f'<filter id="backWShadow" x="{MX0 - 80:g}" y="{MY0 - 80:g}" width="{MW0 + 160:g}" height="{MH0 + 160:g}"', f3m, count=1)
fw_ = re.sub(r'stdDeviation="([\d.]+)"', lambda m: f'stdDeviation="{float(m.group(1)) / SB0:.3f}"', fw_)
fw_ = re.sub(r'<feOffset dy="([\d.]+)"', lambda m: f'<feOffset dy="{float(m.group(1)) / SB0:.3f}"', fw_)
fw_ = re.sub(r'(effect1_dropShadow_)\w+', r'\1backW', fw_)
svg = svg.replace("<defs>", "<defs>" + fw_, 1)
backw = lambda pid: (f'<g id="{pid}backW" filter="url(#backWShadow)"><rect x="{MX0:g}" y="{MY0:g}" width="{MW0:g}" height="{MH0:g}" '
                     f'rx="{12 / SB0:.3f}" fill="{STRIP_FILL}"/></g>')
mi, mj = group_span(svg, "mainCard")
under = drop_ids(clone_group(svg[mi:mj], "uc_", "underCard"), ["uc_avatar", "uc_who", "uc_flag", "uc_country", "uc_cpf"])
front = clone_group(under, "bf_", "brazilFront")
under = under[:under.rindex("</g>")] + backw("uc_") + "</g>"                        # on top: it starts as the plain back card
ci, cj = group_span(svg, "chCard"); chb = clone_group(svg[ci:cj], "cb_", "chBack")
chb = re.sub(r'^(<g id="chBack"[^>]*>)', lambda m: m.group(1) + backw("cb_"), chb, count=1)   # underneath: it becomes one
svg = svg[:ci] + under + "\n" + chb + "\n" + svg[ci:]      # under the Singapore card: the blank card, the Singapore card's copy
mi = svg.index('<g id="mainCard"'); svg = svg[:mi] + front + "\n" + svg[mi:]   # above it: the blank card's copy
# caret for the CPF typing
CPF = "982.273.392-99"; X0, BASE = 131.5, 229.47
EDGES = char_edges(CPF, X0, BASE, 14)
INK = FILLS["Placeholder_2"]
CARET = dict(x=X0 + 0.5, y=BASE - 12, w=1.3, h=15)
svg = svg.replace('<g id="verified">', f'<rect id="caret" x="{CARET["x"]}" y="{CARET["y"]}" width="{CARET["w"]}" height="{CARET["h"]}" rx="0.6" fill="{INK}" opacity="0"/>\n<g id="verified">', 1)
CH_IN = ["ch_avatar", "ch_who", "ch_flag", "ch_country", "ch_cpf"]
BR_IN = ["avatar", "who", "flag", "country", "cpf"]
M = measure(svg, ["shadows", "back", "mainCard", "chCard", "chBack", "cb_ch_content-wrapper", "underCard", "brazilFront", "cb_backW", "uc_backW", "verified", "check", "verifiedText"] + CH_IN + BR_IN, screen=["ch_flag"])
bx, by, bw, bh = M["back"]; mx, my, mw, mh = M["mainCard"]

# --- timeline, seconds (stretched by TEMPO) ---
MV = motion(NAME)                               # the common motion language (motionlib.LANG)
t_stack, t_back = 0.05, 0.35
CH_T = {"ch_avatar": 0.55, "ch_who": 0.65, "ch_flag": 0.95, "ch_country": 1.02, "ch_cpf": 1.15}
t_swap = 2.0                                    # 1) the card underneath slides out from under the Singapore card
t_z = t_swap + 0.55                             # 2) pulled apart: swap z-levels
D_LAY = 0.65                                    # 3) the new card is laid on top, the Singapore one goes under to the back
t_laid = t_z + D_LAY
t_main = t_laid - 0.2                           # the Brazil card fades in as the new card lands
t_repeek = t_laid                               # the Singapore card, now at the back, becomes the plain back card
BR_T = {"avatar": t_laid + 0.1, "who": t_laid + 0.2, "flag": t_laid + 0.45, "country": t_laid + 0.52}
t_caret = t_laid + 0.7
t_type0, D_CHAR = t_caret + 0.25, 0.06
t_typed = t_type0 + len(CPF) * D_CHAR
t_caret_off = t_typed + 0.32
t_ver = t_typed + 0.3
t_check, t_vtext = t_ver + 0.25, t_ver + 0.3
T = t_vtext + MV.D_NUDGE
T = math.ceil(T * TEMPO[NAME] * 60 - 1e-6) / (60 * TEMPO[NAME])   # a whole number of 60 fps frames (Lottie and HTML stay in step)
pc = lambda t: round(t / T * 100, 3)
STEP = "steps(1,end)"
OUT = (.55, 0, .75, .3)                         # leaving: accelerate away

# ---------- HTML ----------
K = Keyframes(T * TEMPO[NAME], 100)
def move(name, t, d, frm, origin="50% 50%", box="fill-box", ease=E, fade=None, extra=()):
    bo = base_opacity(svg, name); a0 = f"opacity:0;transform:{frm}"
    frames = [(0, a0, None), (pc(t), a0, ease)]
    if fade: frames.append((pc(t + fade), f"opacity:{bo}", None))
    frames.append((pc(t + d), f"opacity:{bo};transform:none", None))
    K.kf(name, frames + list(extra))
    K.rule("#" + name, f"transform-box:{box};transform-origin:{origin};animation:{name} {K.dur}")
move("shadows", t_stack, MV.D_ARRIVE, MV.ARRIVE, fade=MV.F_ARRIVE)
LIFT = -10
SB = bw / mw                                                         # a full card shrunk to the back card's width
to_back = f"translate({bx - mx:.2f}px,{by - my:.2f}px) scale({SB:.4f})"
SO = 0.94; XO = mx + mw * (1 - SO) / 2; YO = my + 0.5 * mh            # where the under card is pulled out to
out_tf = f"translate({XO - mx:.2f}px,{YO - my:.2f}px) scale({SO})"
def at_main(name, frames):                                           # full-card pieces transform around the main card's corner
    K.kf(name, frames); K.rule("#" + name, f"transform-box:view-box;transform-origin:{mx:.2f}px {my:.2f}px;animation:{name} {K.dur}")
# the Singapore card (top level): rises with the stack, lifts a little while the under card slides out, then hands over
at_main("chCard", [(0, f"opacity:0;transform:{MV.ARRIVE}", None), (pc(t_stack), f"opacity:0;transform:{MV.ARRIVE}", E), (pc(t_stack + MV.F_ARRIVE), "opacity:1", None),
                   (pc(t_stack + MV.D_ARRIVE), "opacity:1;transform:none", None), (pc(t_swap), "opacity:1;transform:none", E),
                   (pc(t_z), f"opacity:1;transform:translateY({LIFT}px)", STEP), (pc(t_z + 0.001), f"opacity:0;transform:translateY({LIFT}px)", None)])
# the blank card underneath: takes over from the 16px back strip, then slides down out from under the Singapore card
at_main("underCard", [(0, f"opacity:0;transform:{to_back}", STEP), (pc(t_swap), f"opacity:1;transform:{to_back}", E), (pc(t_z), f"opacity:1;transform:{out_tf}", STEP),
                      (pc(t_z + 0.001), f"opacity:0;transform:{out_tf}", None)])
# from the pulled-out spot its copy is laid on top of the Singapore card and grows to full size
at_main("brazilFront", [(0, f"opacity:0;transform:{out_tf}", None), (pc(t_z), f"opacity:0;transform:{out_tf}", STEP),
                        (pc(t_z + 0.001), f"opacity:1;transform:{out_tf}", E), (pc(t_laid), "opacity:1;transform:none", None),
                        (pc(t_laid + 0.1), "opacity:0;transform:none", None)])
# the Singapore card's copy goes under it to the back, shrinking to the back card's width; its data fade away
at_main("chBack", [(0, f"opacity:0;transform:translateY({LIFT}px)", None), (pc(t_z), f"opacity:0;transform:translateY({LIFT}px)", STEP),
                   (pc(t_z + 0.001), f"opacity:1;transform:translateY({LIFT}px)", E), (pc(t_laid), f"opacity:1;transform:{to_back}", None),
                   (pc(t_laid), f"opacity:1;transform:{to_back}", STEP), (pc(t_laid + 0.001), f"opacity:0;transform:{to_back}", None)])
K.kf("cbData", [(0, "opacity:1", None), (pc(t_z + 0.05), "opacity:1", E), (pc(t_laid - 0.1), "opacity:0", None)])
K.rule("#cb_ch_content-wrapper", f"animation:cbData {K.dur}")
K.kf("cbW", [(0, "opacity:0", None), (pc(t_z), "opacity:0", E), (pc(t_laid - 0.15), "opacity:1", None)])
K.rule("#cb_backW", f"opacity:0;animation:cbW {K.dur}")
K.kf("ucW", [(0, "opacity:1", None), (pc(t_swap + 0.05), "opacity:1", E), (pc(t_z - 0.05), "opacity:0", None)])
K.rule("#uc_backW", f"opacity:0;animation:ucW {K.dur}")
# the 16px back strip: peeks out at the start, hands over at the swap, and is the back card again at the end
hidden = f"translateY({my - by:.2f}px)"
K.kf("back", [(0, f"opacity:0;transform:{hidden}", None), (pc(t_back), f"opacity:0;transform:{hidden}", E), (pc(t_back + 0.2), "opacity:1", None),
              (pc(t_back + 0.55), "opacity:1;transform:none", STEP), (pc(t_swap), "opacity:0;transform:none", STEP),
              (pc(t_laid), "opacity:1;transform:none", None)])
K.rule("#back", f"transform-box:view-box;transform-origin:{bx:.2f}px {by:.2f}px;animation:back {K.dur}")
# the Brazil card appears on the new top card as it lands
K.kf("mainCard", [(0, "opacity:0", None), (pc(t_laid - 0.15), "opacity:0", E), (pc(t_laid), "opacity:1", None)])
K.rule("#mainCard", f"animation:mainCard {K.dur}")
for k, t in CH_T.items():
    if k == "ch_cpf":   # the number fades in from the left
        K.kf(k, [(0, "clip-path:inset(0 100% 0 0)", None), (pc(t), "clip-path:inset(0 100% 0 0)", E), (pc(t + 0.5), "clip-path:inset(0 0 0 0)", None)])
        K.rule("#" + k, f"animation:{k} {K.dur}")
    else:
        mk_ = k in ("ch_avatar", "ch_flag")       # avatar and flag pop in as marks, the text lines slide in
        move(k, t, MV.D_MARK if mk_ else MV.D_NUDGE, MV.MARK_T if mk_ else MV.NUDGE_T, ease=APPEAR if mk_ else E, fade=MV.F_MARK if mk_ else MV.F_NUDGE)
for k, t in BR_T.items():
    mk_ = k in ("avatar", "flag")
    move(k, t, MV.D_MARK if mk_ else MV.D_NUDGE, MV.MARK_T if mk_ else MV.NUDGE_T, ease=APPEAR if mk_ else E, fade=MV.F_MARK if mk_ else MV.F_NUDGE)
x1, y1, w1, h1 = M["cpf"]; right = x1 + w1
typing = [(0, f"clip-path:inset(0 {w1 + 2:.2f}px 0 0)", None), (pc(t_type0), f"clip-path:inset(0 {w1 + 2:.2f}px 0 0)", STEP)]
caretx = [(0, "transform:none", None), (pc(t_type0), "transform:none", STEP)]
for n, edge in enumerate(EDGES):
    t = t_type0 + (n + 1) * D_CHAR; last = n == len(EDGES) - 1
    typing.append((pc(t), "clip-path:inset(0 0 0 0)" if last else f"clip-path:inset(0 {max(0, right - edge - 0.3):.2f}px 0 0)", None if last else STEP))
    caretx.append((pc(t), f"transform:translateX({edge - X0 + 0.6:.2f}px)", None if last else STEP))
typing[-1] = (typing[-1][0], typing[-1][1], STEP); typing.append((typing[-1][0] + 0.01, "clip-path:none", None))   # no clip once typed (it trims the glyphs' edges)
K.kf("cpf", typing); K.rule("#cpf", f"animation:cpf {K.dur}")
blink = [(0, "opacity:0", None), (pc(t_caret), "opacity:0", STEP), (pc(t_caret + 0.01), "opacity:1", STEP), (pc(t_caret + 0.15), "opacity:0", STEP),
         (pc(t_caret + 0.25), "opacity:1", STEP), (pc(t_typed + 0.1), "opacity:0", STEP), (pc(t_typed + 0.2), "opacity:1", STEP), (pc(t_caret_off), "opacity:0", None)]
K.kf("caretBlink", blink); K.kf("caretMove", caretx)
K.rule("#caret", f"animation:caretBlink {K.dur},caretMove {K.dur}")
move("verified", t_ver, MV.D_ARRIVE, MV.ARRIVE, fade=MV.F_ARRIVE)
move("check", t_check, MV.D_GLYPH, MV.GLYPH_T, ease=APPEAR, fade=MV.F_GLYPH)
move("verifiedText", t_vtext, MV.D_NUDGE, MV.NUDGE_T, fade=MV.F_NUDGE)
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. The first applicant (Singapore) is checked, the card under it comes forward as the applicant from Brazil, the CPF number is typed in and verified instantly.",
         svg, K.text(), T)
print(THEME, "html", n // 1024, "KB")

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
L.frac = True
AN = L.anim
ANIM = ["shadows", "back", "mainCard", "chCard", "chBack", "underCard", "brazilFront", "verified", "caret"]
shoot(svg, f"{WORK}/plate.png", hide=ANIM); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
def render(k, pad, hide=()):
    x, y, w, h = M[k]
    shoot(svg, f"{WORK}/{k}.png", only=[k], hide=hide, transparent=True)
    geo[k] = crop(f"{WORK}/{k}.png", x - pad, y - pad, w + 2 * pad, h + 2 * pad)
render("shadows", 30); render("back", 20)
render("chCard", 20, hide=CH_IN); render("mainCard", 20, hide=BR_IN)
render("chBack", 20, hide=["cb_ch_content-wrapper", "cb_backW"]); render("cb_ch_content-wrapper", 4); render("underCard", 20, hide=["uc_backW"]); render("brazilFront", 20)
render("cb_backW", 60); render("uc_backW", 60)
for k in CH_IN + BR_IN: render(k, 3)
render("verified", 20, hide=["check", "verifiedText"]); render("check", 3); render("verifiedText", 3)
def img(k):
    X, Y, w, h = geo[k]; L.image(k, f"{WORK}/{k}.png", w, h); return X, Y, w, h
f = lambda t: round(pc(t) / 100 * L.OP)
def anim_layer(k, t, d, dx=0, dy=0, s0=100, ease=E, fade=None, parent=None, origin_off=(0, 0), extra_p=(), extra_s=(), extra_o=()):
    X, Y, w, h = img(k); ox, oy = X + w / 2, Y + h / 2
    if parent is not None: ox, oy = ox - origin_off[0], oy - origin_off[1]       # child coords are in the parent's layer space
    p1 = [ox, oy, 0]; p0 = [ox + dx * S, oy + dy * S, 0]
    extra = {"parent": parent} if parent is not None else {}
    L.layer(2, k, L.ks(a=(w / 2, h / 2), p=AN([(0, p0, None), (pc(t), p0, ease), (pc(t + d), p1, None)] + list(extra_p)),
        s=AN([(0, [s0, s0, 100], None), (pc(t), [s0, s0, 100], ease), (pc(t + d), [100, 100, 100], None)] + list(extra_s)),
        o=AN([(0, [0], None), (pc(t), [0], ease), (pc(t + (fade or d)), [100], None)] + list(extra_o))), refId=k, **extra)
hexc = lambda h: [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
# layers, top first
anim_layer("verifiedText", t_vtext, MV.D_NUDGE, dx=MV.NUDGE, fade=MV.F_NUDGE)
anim_layer("check", t_check, MV.D_GLYPH, s0=MV.GLYPH * 100, ease=APPEAR, fade=MV.F_GLYPH)
anim_layer("verified", t_ver, MV.D_ARRIVE, dy=MV.RISE, fade=MV.F_ARRIVE)
cx0 = (CARET["x"] + CARET["w"] / 2) * S; cy0 = (CARET["y"] + CARET["h"] / 2) * S
pos = [{"t": 0, "s": [cx0, cy0, 0], "h": 1}] + [{"t": f(t_type0 + (n + 1) * D_CHAR), "s": [cx0 + (edge - X0 + 0.6) * S, cy0, 0], "h": 1} for n, edge in enumerate(EDGES)]
op = [{"t": 0, "s": [0], "h": 1}, {"t": f(t_caret + 0.01), "s": [100], "h": 1}, {"t": f(t_caret + 0.15), "s": [0], "h": 1},
      {"t": f(t_caret + 0.25), "s": [100], "h": 1}, {"t": f(t_typed + 0.1), "s": [0], "h": 1}, {"t": f(t_typed + 0.2), "s": [100], "h": 1},
      {"t": f(t_caret_off), "s": [0], "h": 1}]
L.layer(4, "caret", {"a": st([0, 0, 0]), "p": {"a": 1, "k": pos}, "s": st([100, 100, 100]), "r": st(0), "o": {"a": 1, "k": op}},
        shapes=[{"ty": "gr", "it": [{"ty": "rc", "p": st([0, 0]), "s": st([CARET["w"] * S, CARET["h"] * S]), "r": st(0.6 * S)},
                                    {"ty": "fl", "c": st(hexc(INK)), "o": st(100), "r": 1},
                                    {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": st(100)}]}])
X, Y, w, h = img("cpf")
mk = [{"t": 0, "s": [rect(0.01, h)], "h": 1}] + [{"t": f(t_type0 + (n + 1) * D_CHAR), "s": [rect(max(0.01, (edge + 0.3) * S - X), h)], "h": 1} for n, edge in enumerate(EDGES)]
mk[-1]["s"] = [rect(w, h)]
L.layer(2, "cpf", L.ks(p=(X, Y)), refId="cpf", hasMask=True, masksProperties=[{"inv": False, "mode": "a", "o": st(100), "x": st(0), "nm": "type", "pt": {"a": 1, "k": mk}}])
for k in ("country", "flag", "who", "avatar"):
    t = BR_T[k]; pop = k in ("avatar", "flag")
    anim_layer(k, t, MV.D_MARK if pop else MV.D_NUDGE, dx=0 if pop else MV.NUDGE, s0=MV.MARK * 100 if pop else 100, ease=APPEAR if pop else E,
               fade=MV.F_MARK if pop else MV.F_NUDGE)
def hold(t, v): return (pc(t), v, "HOLD")
def AH(keys):
    """anim() that understands HOLD (instant switch) segments."""
    out = []; last_t = -1
    for j2, (p_, v, e2) in enumerate(keys):
        tt = max(round(p_ / 100 * L.OP), last_t + 1); last_t = tt          # keep frames strictly increasing
        k2 = {"t": tt, "s": v}
        if j2 < len(keys) - 1:
            if e2 == "HOLD": k2["h"] = 1
            else:
                x1, y1, x2, y2 = e2 or EASE; nn = len(v)
                k2["o"] = {"x": [x1] * nn, "y": [y1] * nn}; k2["i"] = {"x": [x2] * nn, "y": [y2] * nn}
        out.append(k2)
    return {"a": 1, "k": out}
X, Y, w, h = img("mainCard")
L.layer(2, "mainCard", L.ks(p=(X, Y), o=AN([(0, [0], None), (pc(t_laid - 0.15), [0], E), (pc(t_laid), [100], None)])), refId="mainCard")
def full_card(k, pos, scl, op, extra=None):
    """layer for a full-card piece, anchored at the main card's top-left corner (2x)."""
    X, Y, w, h = img(k)
    return L.layer(2, k, L.ks(a=[mx * S - X, my * S - Y], p=AH(pos), s=AH(scl), o=AH(op)), refId=k, **(extra or {}))
P_HOME, P_LIFT = [mx * S, my * S, 0], [mx * S, (my + LIFT) * S, 0]
P_BACK, P_OUT = [bx * S, by * S, 0], [XO * S, YO * S, 0]
S1, SBk, SOk = [100, 100, 100], [SB * 100, SB * 100, 100], [SO * 100, SO * 100, 100]
# the blank card's copy on top: laid over the Singapore card from the pulled-out spot
full_card("brazilFront", [(0, P_OUT, "HOLD"), (pc(t_z), P_OUT, E), (pc(t_laid), P_HOME, None)],
          [(0, SOk, "HOLD"), (pc(t_z), SOk, E), (pc(t_laid), S1, None)],
          [(0, [0], "HOLD"), hold(t_z, [100]), (pc(t_laid), [100], None), (pc(t_laid + 0.1), [0], None)])
# the Singapore card + its data (children move with it; opacity per layer)
CH_IND = 800
gx, gy, gw, gh = geo["chCard"]
X, Y, w, h = img("chCard")
for k in ("ch_cpf", "ch_country", "ch_flag", "ch_who", "ch_avatar"):
    t = CH_T[k]
    if k == "ch_cpf":
        Xc, Yc, wc, hc = img(k)
        L.layer(2, k, L.ks(p=(Xc - gx, Yc - gy), o=AH([(0, [100], "HOLD"), hold(t_z, [0])])), refId=k, parent=CH_IND,
                hasMask=True, masksProperties=L.reveal_mask(wc, hc, pc(t), pc(t + 0.5), E))
        continue
    pop = k in ("ch_avatar", "ch_flag")
    Xk, Yk, wk, hk = img(k); ox, oy = Xk + wk / 2 - gx, Yk + hk / 2 - gy; dxk = 0 if pop else MV.NUDGE * S; s0 = MV.MARK * 100 if pop else 100
    e3 = APPEAR if pop else E; d3 = MV.D_MARK if pop else MV.D_NUDGE; f3 = MV.F_MARK if pop else MV.F_NUDGE
    L.layer(2, k, L.ks(a=(wk / 2, hk / 2), p=AN([(0, [ox + dxk, oy, 0], None), (pc(t), [ox + dxk, oy, 0], e3), (pc(t + d3), [ox, oy, 0], None)]),
        s=AN([(0, [s0, s0, 100], None), (pc(t), [s0, s0, 100], e3), (pc(t + d3), [100, 100, 100], None)]),
        o=AH([(0, [0], None), (pc(t), [0], e3), (pc(t + f3), [100], "HOLD"), hold(t_z, [0])])), refId=k, parent=CH_IND)
cxc, cyc = X + w / 2, Y + h / 2
L.layer(2, "chCard", L.ks(a=(w / 2, h / 2),
    p=AN([(0, [cxc, cyc + MV.RISE * S, 0], None), (pc(t_stack), [cxc, cyc + MV.RISE * S, 0], E), (pc(t_stack + MV.D_ARRIVE), [cxc, cyc, 0], None),
          (pc(t_swap), [cxc, cyc, 0], E), (pc(t_z), [cxc, cyc + LIFT * S, 0], None)]),
    o=AH([(0, [0], None), (pc(t_stack), [0], E), (pc(t_stack + MV.F_ARRIVE), [100], "HOLD"), hold(t_z, [0])])), refId="chCard", ind_fixed=CH_IND)
# the Singapore card's copy under the new top card: to the back, shrinking; its data (child) fade away
CB_IND = 810
Xb, Yb, wb, hb = geo["chBack"]; Xd, Yd, wd, hd = img("cb_ch_content-wrapper")
L.layer(2, "chBack data", L.ks(p=(Xd - Xb, Yd - Yb), o=AH([(0, [0], "HOLD"), (pc(t_z), [100], None), (pc(t_z + 0.05), [100], E), (pc(t_laid - 0.1), [0], None)])), refId="cb_ch_content-wrapper", parent=CB_IND)   # on at the swap, then fades on the way back
CB_POS = [(0, P_LIFT, "HOLD"), (pc(t_z), P_LIFT, E), (pc(t_laid), P_BACK, None)]
CB_SCL = [(0, S1, "HOLD"), (pc(t_z), S1, E), (pc(t_laid), SBk, None)]
full_card("chBack", CB_POS, CB_SCL, [(0, [0], "HOLD"), hold(t_z, [100]), hold(t_laid, [0])], {"ind_fixed": CB_IND})
# …turning into the plain back card on the way (under it), which is the back card the moment it lands
full_card("cb_backW", CB_POS, CB_SCL, [(0, [0], "HOLD"), (pc(t_z), [0], E), (pc(t_laid - 0.15), [100], "HOLD"), hold(t_laid, [0])])
# the blank card underneath: takes over from the strip and slides down out from under the Singapore card
UC_POS = [(0, P_BACK, "HOLD"), (pc(t_swap), P_BACK, E), (pc(t_z), P_OUT, None)]
UC_SCL = [(0, SBk, "HOLD"), (pc(t_swap), SBk, E), (pc(t_z), SOk, None)]
# the card underneath starts as the plain back card (taking over from the strip in one frame) and turns into the blank form
full_card("uc_backW", UC_POS, UC_SCL, [(0, [0], "HOLD"), hold(t_swap, [100]), (pc(t_swap + 0.05), [100], E), (pc(t_z - 0.05), [0], None)])
full_card("underCard", UC_POS, UC_SCL, [(0, [0], "HOLD"), hold(t_swap, [100]), hold(t_z, [0])])
# the 16px back strip
X, Y, w, h = img("back"); a_tl = [bx * S - X, by * S - Y]
home, hid = [bx * S, by * S, 0], [bx * S, my * S, 0]
L.layer(2, "back", L.ks(a=a_tl, p=AN([(0, hid, None), (pc(t_back), hid, E), (pc(t_back + 0.55), home, None)]),
    o=AH([(0, [0], None), (pc(t_back), [0], E), (pc(t_back + 0.2), [100], "HOLD"), hold(t_swap, [0]), hold(t_laid, [100])])), refId="back")
anim_layer("shadows", t_stack, MV.D_ARRIVE, dy=MV.RISE, fade=MV.F_ARRIVE)
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(L.layers), "layers", size // 1024, "KB", f"T={T * TEMPO[NAME]:.2f}s")
