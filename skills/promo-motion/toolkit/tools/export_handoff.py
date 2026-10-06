# Build the developer handoff bundle from the built previews:
#   handoff/<label>-<date>/{lottie/*.json, svg/*.svg, README.md, mapping.json} + .zip next to it.
# The animated SVGs are self-contained (CSS inside), with ids namespaced per file so light/dark can share a page.
# usage: python3 tools/export_handoff.py                      full bundle of every animation in ../lottie
#        python3 tools/export_handoff.py --only blueprints    update bundle: just these animations (comma-separated),
#                                                             with a short README saying which files it replaces
# Project settings (optional) live in ../handoff.json — see the skill's references/handoff.md.
import os, re, json, shutil, datetime, zipfile, sys, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motionlib import ROOT, REDUCED_FADE, PLAY_WHEN_SEEN
ap = argparse.ArgumentParser(); ap.add_argument("--only", default=""); ap.add_argument("--label", default=None)
args = ap.parse_args()
ONLY = [x for x in args.only.split(",") if x]
CFG = json.load(open(os.path.join(ROOT, "handoff.json"))) if os.path.exists(os.path.join(ROOT, "handoff.json")) else {}
# every <base>-light.json / <base>-dark.json in ../lottie with a matching <base>.html / <base>-dark.html preview
def discover():
    items = []
    for f in sorted(os.listdir(os.path.join(ROOT, "lottie"))):
        m = re.match(r"(.+)-light\.json$", f)
        if m and (not ONLY or m.group(1) in ONLY):
            nm = json.load(open(os.path.join(ROOT, "lottie", f))).get("nm", m.group(1)).split(" / ")[0]
            items.append((m.group(1), m.group(1), nm))
    return items
ITEMS = discover()
assert ITEMS, "no animations found" + (f" for --only {args.only}" if ONLY else "")
# the component each animation replaces: title → [file base or null, [light node, key], [dark node, key]] (null = not animated)
ASSETS = CFG.get("assets_file", "")
FIGMA = {t: (v[0], tuple(v[1]), tuple(v[2])) for t, v in CFG.get("components", {}).items()}
if FIGMA and not ONLY:
    missing = {b for _, b, _ in ITEMS} - {b for b, _, _ in FIGMA.values() if b}
    assert not missing, f"handoff.json has no component for {sorted(missing)}"
PREFIX = CFG.get("component_prefix", "")
W1, H1 = CFG.get("size_1x", [494, 354]); RADIUS = CFG.get("corner_radius", 16)
TITLE = CFG.get("title", "Promo illustrations — motion"); PREVIEW = CFG.get("preview_url", ""); CONTACT = CFG.get("contact", "")
LABEL = args.label or (CFG.get("label", "promo-motion") + ("-update" if ONLY else ""))
node_url = lambda n: f"https://www.figma.com/design/{ASSETS}/?node-id={n.replace(':', '-')}"
README_TAIL = """## Behaviour (same for both formats)

1. **Plays once**, never loops, **when it is seen**: it waits until at least 30 % of the illustration is in view and the
   tab is visible (below the fold or in a background tab it would otherwise have finished before anyone looks).
2. When it ends it **stays on the last frame** — that frame is exactly the static illustration.
3. `prefers-reduced-motion: reduce` → no animation: the last frame fades in (opacity 0 → 1, 0.4 s) instead of playing.
   `prefers-reduced-transparency: reduce` → the frosted glass becomes a near-solid surface (the SVG does this itself;
   in Lottie the frost is a pre-rendered image — use the SVG version where this setting must be honoured).
4. Theme: use the file of the current theme. On a theme switch after the animation has played, show the other theme's
   last frame without replaying.

Designed at **__W1__ × __H1__** (1×), **square corners** (round them in the container; the originals had __RADIUS__ px). Lottie compositions are __W2__ × __H2__ (2× assets); scale to the container, keep the aspect ratio.
Controls follow the current design system, so a few colours can differ from older static illustrations.

## Lottie (lottie-web)

```js
import lottie from 'lottie-web';

const anim = lottie.loadAnimation({
  container, renderer: 'svg', loop: false, autoplay: false,
  path: '/promo/wfb-light.json',                      // or animationData: json
});
anim.addEventListener('DOMLoaded', () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    anim.goToAndStop(anim.totalFrames - 1, true);     // static illustration, softly faded in
    container.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.275,.3,.1,1)' });
    return;
  }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { anim.play(); io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe(container);
});
// show the final frame without playing (e.g. after a theme switch):
// anim.goToAndStop(anim.totalFrames - 1, true);
```

## Animated SVG

- Insert the SVG **inline** (raw markup). Not as `<img>`/CSS background: the text uses the page's **Geist** font.
- **Do not run it through SVGO / SVGR optimisation** — `cleanupIds`, `inlineStyles`, `minifyStyles` break the animation.
  Import it as a raw string (e.g. `?raw`) and inject it.
- **Play when seen is built in**: the SVG carries a small script that keeps it paused (class `wait`) until it is in view
  and the tab is visible. Scripts inside markup inserted with `innerHTML` (or React's `dangerouslySetInnerHTML`) do not
  run — then it plays as soon as it is inserted; to keep the "when seen" behaviour, call the same function once after
  inserting it:
  ```js
  const playWhenSeen = __PWS__;
  playWhenSeen(container.querySelector('svg'));
  ```
  To replay, restart its animations instead of re-inserting it (a fresh copy re-decodes the embedded images —
  up to ~1 s stall): `svg.getAnimations({ subtree: true }).forEach(a => { a.currentTime = 0; a.play(); })`.
- To show the final frame without playing, disable the animations: `svg.<name>-<theme> * { animation: none !important; }`
  (reduced motion already does this, with a soft fade-in; reduced transparency makes the glass near-solid).
- Ids are namespaced per file (`wfb-light-…`), so several illustrations can live on one page.

__PREVIEW__""".replace("__PWS__", PLAY_WHEN_SEEN)
date = datetime.date.today().isoformat()
OUT = os.path.join(ROOT, "handoff", f"{LABEL}-{date}")
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(os.path.join(OUT, "lottie")); os.makedirs(os.path.join(OUT, "svg"))
rows = []
for html_base, base, title in ITEMS:
    for theme in ("light", "dark"):
        page = os.path.join(ROOT, html_base + ("" if theme == "light" else "-dark") + ".html")
        lot = os.path.join(ROOT, "lottie", f"{base}-{theme}.json")
        if not (os.path.exists(page) and os.path.exists(lot)):
            print("skip", base, theme); continue
        src = open(page).read()
        svg = re.search(r'<svg class="illus".*?</svg>', src, re.S).group(0)
        css = src.split("animation-play-state:paused!important}", 1)[1].split("@media (prefers-reduced-motion", 1)[0]
        css = css.replace("@keyframes rmIn{from{opacity:0}}", "").strip()       # re-added per file below, namespaced
        ns = f"{base}-{theme}"
        ids = sorted({i for i in re.findall(r'#([A-Za-z][\w-]*)', css) if f'id="{i}"' in svg}, key=len, reverse=True)   # skip hex colours
        for i in ids:
            n = svg.count(f'id="{i}"'); assert n == 1, (ns, i, n)
            svg = svg.replace(f'id="{i}"', f'id="{ns}-{i}"')
            css = re.sub(r'#%s(?![\w-])' % re.escape(i), f'#{ns}-{i}', css)
        css = re.sub(r'@keyframes ([\w-]+)', lambda m: f'@keyframes {ns}-{m.group(1)}', css)
        css = re.sub(r'animation:([\w-]+) ', lambda m: f'animation:{ns}-{m.group(1)} ', css)
        css = css.replace(".illus ", f"svg.{ns} ")                       # the reduced-transparency rule (motionlib.a11y_css)
        reduced = (f'@keyframes {ns}-rmIn{{from{{opacity:0}}}}\n@media (prefers-reduced-motion:reduce){{svg.{ns} *{{animation:none!important}}'
                   + (f'#{ns}-cursor{{display:none}}' if f'#{ns}-cursor' in css else '') + f'svg.{ns}{{{REDUCED_FADE.replace("rmIn", ns + "-rmIn")}}}}}')
        svg = svg.replace('<svg class="illus"', f'<svg class="{ns}"', 1)
        gate = f'svg.{ns}.wait,svg.{ns}.wait *{{animation-play-state:paused!important}}'      # play once seen (motionlib.PLAY_WHEN_SEEN)
        play = f'<script><![CDATA[({PLAY_WHEN_SEEN})((document.currentScript&&document.currentScript.parentNode)||document.documentElement)]]></script>'
        svg = re.sub(r'(<svg[^>]*>)', lambda m: m.group(1) + f'\n<style>\n{css}\n{gate}\n{reduced}\n</style>\n{play}', svg, count=1)
        open(os.path.join(OUT, "svg", f"{ns}.svg"), "w").write('<?xml version="1.0" encoding="UTF-8"?>\n' + svg)
        shutil.copy(lot, os.path.join(OUT, "lottie", f"{ns}.json"))
        d = json.load(open(lot))
        dur = re.search(r'animation:[\w-]+ ([\d.]+)s 1 both', css)
        rows.append((title, theme, f"{(d['op'] - d['ip']) / d['fr']:.2f} s", os.path.getsize(lot) // 1024, os.path.getsize(os.path.join(OUT, "svg", f"{ns}.svg")) // 1024))
table = "\n".join(f"| {t} | {th} | {du} | {lk} KB | {sk} KB |" for t, th, du, lk, sk in rows)
# what replaces what: the static component → the files of this bundle
swap, mapping = [], []
for title, (base, light, dark) in FIGMA.items():
    if ONLY and base not in ONLY: continue
    for theme, (node, key) in (("light", light), ("dark", dark)):
        comp = f"{PREFIX}{title} / {theme.title()}"
        link = f" ([Figma]({node_url(node)}))" if ASSETS else ""
        swap.append(f"| `{comp}`{link} | `lottie/{base}-{theme}.json` | `svg/{base}-{theme}.svg` |" if base else f"| `{comp}`{link} | — keep the static image | — |")
        mapping.append({"figma_component": comp, "figma_node": node, "figma_key": key, "figma_url": node_url(node) if ASSETS else None,
                        "theme": theme, "lottie": f"lottie/{base}-{theme}.json" if base else None, "svg": f"svg/{base}-{theme}.svg" if base else None})
if not mapping:   # no project settings: list the files only
    mapping = [{"name": b, "theme": th, "lottie": f"lottie/{b}-{th}.json", "svg": f"svg/{b}-{th}.svg"} for _, b, _ in ITEMS for th in ("light", "dark")]
json.dump({"assets_file": ASSETS or None, "size_1x": [W1, H1], "items": mapping}, open(os.path.join(OUT, "mapping.json"), "w"), indent=2)
swap = "\n".join(swap)
static = [t for t, (b, _, _) in FIGMA.items() if not b]
files = "\n".join(f"- `lottie/{b}-{th}.json`, `svg/{b}-{th}.svg`" for _, b, _ in ITEMS for th in ("light", "dark"))
preview = (f"Compare with the preview: {PREVIEW}." if PREVIEW else "Compare with the preview you got from the designer.")
contact = f"\n\nQuestions — {CONTACT}." if CONTACT else ""
if ONLY:
    readme = f"""# {TITLE} — update ({date})

Replaces these files from the full bundle you already have; everything else in it stays as it is.

{files}

Same size ({W1} × {H1} at 1×), same behaviour, the last frame is still the static illustration and the corners are still
square — no changes on your side beyond swapping the files.

| Illustration | Theme | Duration | Lottie | SVG |
|---|---|---|---|---|
{table}
{contact}
"""
else:
    readme = f"""# {TITLE}

Animated versions of static illustrations{f" from the Figma file `{ASSETS}`" if ASSETS else ""}. Every illustration comes in
**light and dark**, each in **two formats** — pick one:

- `lottie/<name>-<theme>.json` — Lottie, plays with [lottie-web](https://github.com/airbnb/lottie-web). No fonts needed.
- `svg/<name>-<theme>.svg` — animated SVG with the CSS inside. No libraries needed.

## Your task

1. Find where each static illustration below is used in the product.{" The table **What replaces what** maps each component to its animation." if swap else ""}
2. Put the Lottie file of the **same theme** in its place (snippet in **Lottie (lottie-web)** below). Keep the same
   box: {W1} × {H1} at 1×, aspect ratio kept. **The corners are square** (Lottie and SVG) — round them in your
   container (`border-radius` + `overflow: hidden`; the static illustrations had a {RADIUS} px radius). Apart from the
   corners, the last frame of every animation is exactly the static image, so the layout does not change and the
   screen looks as it does today once the animation has played.
3. Behaviour (details in **Behaviour**): play **once** when at least 30 % of the illustration is visible and the tab is
   visible, then stay on the last frame; with `prefers-reduced-motion: reduce` show the last frame with a 0.4 s fade-in
   and no animation; on a theme switch after it has played, show the other theme's last frame without replaying.
{f"4. Not animated — keep their static images: {', '.join(static)}." if static else ""}
5. Check before handing back: both themes for every illustration, no layout shift between the static image and the
   animation, plays once, reduced motion. {preview}{contact}
""" + (f"""
## What replaces what

Each animation replaces one static illustration. Find where that image is used and put the animation for the **same
theme** in its place. Same box ({W1} × {H1} at 1×), and the last frame is exactly the static image (square corners
aside), so the layout does not change. The same list as data: `mapping.json`.

| Static illustration now | Lottie | Animated SVG |
|---|---|---|
{swap}
""" if swap else "") + f"""
| Illustration | Theme | Duration | Lottie | SVG |
|---|---|---|---|---|
{table}
""" + README_TAIL.replace("__W1__", str(W1)).replace("__H1__", str(H1)).replace("__RADIUS__", str(RADIUS)).replace("__W2__", str(W1 * 2)).replace("__H2__", str(H1 * 2)).replace("__PREVIEW__", (f"\nPreview all animations: {PREVIEW}\n" if PREVIEW else ""))
open(os.path.join(OUT, "README.md"), "w").write(readme)
zp = OUT + ".zip"
if os.path.exists(zp): os.remove(zp)
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for r, _, fs in os.walk(OUT):
        for f in fs: p = os.path.join(r, f); z.write(p, os.path.relpath(p, os.path.dirname(OUT)))
print(OUT); print(zp, os.path.getsize(zp) // 1024, "KB"); print(table)
