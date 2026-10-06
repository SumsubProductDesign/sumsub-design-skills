# Case management promo, plays once: case sources slide in, "AML screening hit" answers, the link draws and the case
# card opens from its end, the status and priority land, the auto-assignee card slides in and goes "Online".
# Freezes on the original frame. usage: python3 build_cm.py [light|dark]
import os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import *
THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
NAME, TITLE = "case-management", "Case management"
WORK = os.path.join(TOOLS, f"work-{NAME}-{THEME}"); os.makedirs(WORK, exist_ok=True)
svg = prep_svg(os.path.join(TOOLS, "src-cm.svg" if THEME == "light" else "src-cm-dark.svg"), WORK)
svg = ds_remap(svg, THEME)   # priority icon still uses the pre-redesign red
open(os.path.join(WORK, "ref.svg"), "w").write(svg)            # the original look, for check_final.py (05.10: was missing, ref went stale)

# --- structure ---
svg = regroup(svg, {
    "cardCase": [has('id=".Case creation source"')],
    "cardAuto": [has('<g id="Group 2131328652"'), has('<foreignObject x="19.5"'), has('id="Rectangle 240653254"')],
})
for gid in ("cardCase", "cardAuto"):   # 2px glass blur loses its rounded clip inside transformed groups
    i = svg.index(f'<g id="{gid}">'); j = svg.index('<g id=', i + 10)
    svg = svg[:i] + re.sub(r'<foreignObject[^>]*>.*?</foreignObject>', '', svg[i:j], flags=re.S) + svg[j:]
svg = rename(svg, {"Case creation source": "src1", "Case creation source_2": "src2", "Case creation source_3": "src3",
                   "Vector 3779": "link", "*Status Select*": "status", "Header": "prio", "*Status*": "online"})
svg = svg.replace('<svg width="494"', '<svg class="illus" width="494"', 1)
# the link = left dot + right dot + line; the right dot sits ON the case card, so it waits for the card (05.10)
m = re.search(r'<path id="link"([^>]*?)\bd="([^"]+)"([^>]*)/>', svg)
subs = re.findall(r'M[^M]*', m.group(2))
right = max(subs[:2], key=lambda sp: float(re.match(r'M([\d.]+)', sp).group(1)))     # of the two dots, the one on the card
rest = "".join(sp for sp in subs if sp is not right)
svg = svg[:m.start()] + f'<path id="link"{m.group(1)}d="{rest}"{m.group(3)}/><path id="linkDot"{m.group(1)}d="{right}"{m.group(3)}/>' + svg[m.end():]
M = measure(svg, ["src1", "src2", "src3", "link", "linkDot", "cardCase", "cardAuto", "status", "prio", "online"])
lx, ly, lw, lh = M["link"]; dx_, _, dw_, _ = M["linkDot"]
LINK_END = (dx_ + dw_, ly + lh / 2)      # the case card opens from where the link lands (outer edge of its end dot)

# --- timeline, seconds ---
K1 = 1.15
MV = motion(NAME, K1)           # the common motion language (motionlib.LANG), in this file's pre-K1 seconds
t_src = {n: (0.05 + (n - 1) * 0.08) * K1 for n in (1, 2, 3)}
D_SRC = MV.D_ROW                # a source joins the list
t_hit = 0.50 * K1               # after the hit chip has landed (0.13 + 0.3)
t_link = (0.62 * K1, 0.92 * K1)
t_case = 0.82 * K1
t_status = 1.20 * K1
t_prio = 1.30 * K1
t_auto = 1.50 * K1
t_online = 1.90 * K1
def bez_y(e, u):    # cubic-bezier(e) progress at time fraction u
    x1, y1, x2, y2 = e; lo, hi = 0.0, 1.0
    for _ in range(40):
        t = (lo + hi) / 2; x = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3
        lo, hi = (t, hi) if x < u else (lo, t)
    t = (lo + hi) / 2; return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3
# the right link dot appears once the case card has its final size (scale .92→1 within half a pixel of its width)
_u = next(u / 100 for u in range(1, 101) if (1 - bez_y(E, u / 100)) * 0.08 * M["cardCase"][2] <= 0.5)
t_dot = t_case + _u * MV.D_ARRIVE * K1
t_link = (t_link[0], t_dot)   # the line draws slower and reaches the card the moment it is whole; then its end dot pops (05.10)
# the dot starts as soon as the line visually touches the card (the reveal eases out: within 1 px of its end), not when
# the eased reveal formally ends — that read as late (design review: "the right connector appears a little late")
_v = next(u / 100 for u in range(1, 101) if (1 - bez_y((.45, 0, .2, 1), u / 100)) * M["link"][2] <= 1)
t_dot_on = t_link[0] + _v * (t_link[1] - t_link[0])
T = max(t_online + MV.D_POP * K1, t_dot + MV.D_MARK * K1)   # (t_dot_on ≤ t_dot, so this still covers the dot)
pc = lambda t: round(t / T * 100, 3)

# ---------- HTML ----------
K = Keyframes(T * TEMPO[NAME], 100)
def move(name, t, d, frm, origin="50% 50%", box="fill-box", ease=E, fade=None):
    a = f"opacity:0;transform:{frm}"; bo = base_opacity(svg, name)   # inactive sources are 60 % in Figma
    frames = [(0, a, None), (pc(t), a, ease)]
    if fade: frames.append((pc(t + fade * K1), f"opacity:{bo}", None))
    frames.append((pc(t + d * K1), f"opacity:{bo};transform:none", None))
    K.kf(name, frames)
    K.rule("#" + name, f"transform-box:{box};transform-origin:{origin};animation:{name} {K.dur}")
for n, t in t_src.items():
    if n == 2:   # the hit slides in and then answers with a small pulse
        a = f"opacity:0;transform:{MV.ROW_T}"
        K.kf("src2", [(0, a, None), (pc(t), a, E), (pc(t + D_SRC * K1), "opacity:1;transform:none", None), (pc(t_hit), "opacity:1;transform:none", (.3, 0, .2, 1)),
                      (pc(t_hit + 0.1 * K1), "opacity:1;transform:scale(1.05)", (.5, 0, .3, 1)), (pc(t_hit + 0.3 * K1), "opacity:1;transform:none", None)])
        K.rule("#src2", f"transform-box:fill-box;transform-origin:50% 50%;animation:src2 {K.dur}")
    else:
        move(f"src{n}", t, D_SRC, MV.ROW_T, fade=MV.F_ROW)
K.kf("link", [(0, "clip-path:inset(0 100% 0 0)", None), (pc(t_link[0]), "clip-path:inset(0 100% 0 0)", (.45, 0, .2, 1)), (pc(t_link[1]), "clip-path:inset(0 0 0 0)", None)])
K.rule("#link", f"animation:link {K.dur}")
move("cardCase", t_case, MV.D_ARRIVE, "translateX(-10px) scale(.92)", origin=f"{LINK_END[0]:.2f}px {LINK_END[1]:.2f}px", box="view-box", fade=MV.F_ARRIVE)
move("linkDot", t_dot_on, MV.D_MARK, MV.MARK_T, ease=APPEAR, fade=MV.F_MARK)
move("status", t_status, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
move("prio", t_prio, MV.D_ROW, MV.ROW_T, fade=MV.F_ROW)
move("cardAuto", t_auto, MV.D_ARRIVE, "translateX(-60px)", fade=MV.F_ARRIVE)    # out from under the case card
move("online", t_online, MV.D_POP, MV.POP_T, ease=APPEAR, fade=MV.F_POP)
suffix = "" if THEME == "light" else "-dark"
n = page(os.path.join(ROOT, NAME + suffix + ".html"), TITLE + ("" if THEME == "light" else " · Dark"),
         f"Promo illustration, plays once ({K.T:.1f} s) and freezes on the original frame. Case sources slide in, the AML hit opens a case, the status and priority land, the assignee card slides in and goes online.",
         svg, K.text(), T)
print(THEME, "html", n // 1024, "KB")

# ---------- Lottie ----------
S = 2
L = Lottie(f"{TITLE} / {THEME.title()}", 494 * S, 354 * S, 60, T * TEMPO[NAME], 100)
AN = L.anim
ANIM = ["src1", "src2", "src3", "link", "linkDot", "cardCase", "cardAuto"]
shoot(svg, f"{WORK}/plate.png", hide=ANIM); bleed_corners(f"{WORK}/plate.png"); to_jpeg(f"{WORK}/plate.png", f"{WORK}/plate.jpg")
geo = {}
def render(k, pad, hide=()):
    x, y, w, h = M[k]
    shoot(svg, f"{WORK}/{k}.png", only=[k], hide=hide, transparent=True)
    geo[k] = crop(f"{WORK}/{k}.png", x - pad, y - pad, w + 2 * pad, h + 2 * pad)
for k in ("src1", "src2", "src3", "link", "linkDot", "status", "prio", "online"): render(k, 3)
render("cardCase", 20, hide=["status", "prio"])
render("cardAuto", 20, hide=["online"])
def img(k):
    X, Y, w, h = geo[k]; L.image(k, f"{WORK}/{k}.png", w, h); return X, Y, w, h
def anim_layer(k, t, d, dx=0, dy=0, s0=100, origin=None, ease=E, fade=None, extra_s=None):
    X, Y, w, h = img(k)
    ox, oy = (origin[0] * S, origin[1] * S) if origin else (X + w / 2, Y + h / 2)
    p1 = [ox, oy, 0]; p0 = [ox + dx * S, oy + dy * S, 0]
    s_keys = [(0, [s0, s0, 100], None), (pc(t), [s0, s0, 100], ease), (pc(t + d * K1), [100, 100, 100], None)] + (extra_s or [])
    o_keys = [(0, [0], None), (pc(t), [0], ease), (pc(t + (fade or d) * K1), [100], None)]
    L.layer(2, k, L.ks(a=(ox - X, oy - Y), p=AN([(0, p0, None), (pc(t), p0, ease), (pc(t + d * K1), p1, None)]),
                       s=AN(s_keys), o=AN(o_keys)), refId=k)
# layers, top first = the SVG's document order reversed: the link (its end dot sits ON the case card), the sources,
# the auto-assign card, the case card (05.10: the link was under the case card and lost its end dot)
anim_layer("linkDot", t_dot_on, MV.D_MARK, s0=MV.MARK * 100, ease=APPEAR, fade=MV.F_MARK)
X, Y, w, h = img("link")
L.layer(2, "link", L.ks(p=(X, Y)), refId="link", hasMask=True, masksProperties=L.reveal_mask(w, h, pc(t_link[0]), pc(t_link[1]), (.45, 0, .2, 1)))
anim_layer("src3", t_src[3], D_SRC, dy=MV.ROW, fade=MV.F_ROW)
anim_layer("src2", t_src[2], D_SRC, dy=MV.ROW, extra_s=[(pc(t_hit), [100, 100, 100], (.3, 0, .2, 1)), (pc(t_hit + 0.1 * K1), [105, 105, 100], (.5, 0, .3, 1)), (pc(t_hit + 0.3 * K1), [100, 100, 100], None)])
anim_layer("src1", t_src[1], D_SRC, dy=MV.ROW, fade=MV.F_ROW)
anim_layer("online", t_online, MV.D_POP, s0=MV.POP * 100, ease=APPEAR, fade=MV.F_POP)
anim_layer("cardAuto", t_auto, MV.D_ARRIVE, dx=-60, fade=MV.F_ARRIVE)
anim_layer("prio", t_prio, MV.D_ROW, dy=MV.ROW, fade=MV.F_ROW)
anim_layer("status", t_status, MV.D_POP, s0=MV.POP * 100, ease=APPEAR, fade=MV.F_POP)
anim_layer("cardCase", t_case, MV.D_ARRIVE, dx=-10, s0=92, origin=LINK_END, fade=MV.F_ARRIVE)
plate_layer(L, f"{WORK}/plate.jpg")
size = L.save(os.path.join(ROOT, "lottie", f"{NAME}-{THEME}.json"))
print(THEME, "lottie", len(L.layers), "layers", size // 1024, "KB", f"T={T:.2f}s")
