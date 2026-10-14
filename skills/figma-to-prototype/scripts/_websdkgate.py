#!/usr/bin/env python3
# _websdkgate.py <rects-json> <frame.png> <shell.png> <scripts-dir> <W> <H> — the measuring half of
# websdkgate.sh, kept out of the shell script: bash 3.2 cannot hold a python with apostrophes inside
# $( ). Prints one `landmark:` line per landmark, one `offset:` line, and `NUMS <worst> <found> <bar> <barh>`.
import json, subprocess, sys, os, re
rects, ref, shot, d, W, H = sys.argv[1:7]; W, H = int(W), int(H)
names = ['bar', 'back', 'ring', 'widget', 'button', 'powered']
boxes = {}
for i, line in enumerate(json.loads(rects)):
    if ': not found' in line: continue
    sel, geo = line.split(': ', 1); pos, size = geo.split(' ')
    x, y = map(int, pos.split(',')); w, h = map(int, size.split('x')); boxes[names[i]] = (x, y, w, h)
# th: a pixel is ink when the mean of its channels is under th (_pix.cjs inkbbox) — 150 takes text and icons and leaves the kit's 0.1 hairlines
# (≈233 on white) out; the widget's edge strips pass 200 to catch its 1px frame (rgba(32,37,44,.3) on white ≈ 190)
def ink(img, rect, th=150):
    x, y, w, h = rect
    r = [[max(0, x), max(0, y), min(W, x + w) - max(0, x), min(H, y + h) - max(0, y)]]
    out = subprocess.run([os.path.join(d, 'inkbbox.sh'), img, json.dumps(r)], capture_output=True, text=True, env=dict(os.environ, TH=str(th))).stdout
    m = re.search(r'x (-?\d+)\.\.(-?\d+) \(w (\d+)\) y (-?\d+)\.\.(-?\d+) \(h (\d+)\)', out)
    return (int(m.group(1)), int(m.group(4)), int(m.group(3)), int(m.group(6))) if m else None
def centre(b): return (b[0] + b[2] / 2, b[1] + b[3] / 2)
lines, found, resid = [], 0, []
if 'widget' not in boxes or 'bar' not in boxes: print('landmark: the shell render has no widget or no bar'); print('NUMS 99 99 0 0'); sys.exit()
wx, wy, ww, wh = boxes['widget']; bar_h = boxes['bar'][3]
# the widget's frame: the left and right edges from the side strips (their straight part, under the
# 32px corners), the top and bottom edges from a strip 40px in from the left edge — past the corner's
# radius, left of the content column (which starts 106 in), so the only ink there is the 1px frame;
# the footer's plate is too light to count
def frame_edges(img):
    L = ink(img, (wx - 6, wy + 40, 12, H - wy - 40), 200); R = ink(img, (wx + ww - 6, wy + 40, 12, H - wy - 40), 200)
    V = ink(img, (wx + 40, wy - 12, 12, H - wy + 12), 200)
    if not L or not R or not V: return None
    return (L[0], V[1], R[0] + R[2] - L[0], V[3])
fa, fb = frame_edges(ref), frame_edges(shot)
if fa and fb:
    found += 1; bar = fa[1] - fb[1]
    lines.append(f'widget frame: frame {fa[0]},{fa[1]} {fa[2]}x{fa[3]} · shell {fb[0]},{fb[1]} {fb[2]}x{fb[3]} · Δ left {fa[0]-fb[0]:+d} right {(fa[0]+fa[2])-(fb[0]+fb[2]):+d} top {bar:+d} height {fa[3]-fb[3]:+d}')
    resid += [abs(fa[0] - fb[0]), abs((fa[0] + fa[2]) - (fb[0] + fb[2]))]
    fbot_a, fbot_b = fa[1] + fa[3], fb[1] + fb[3]
else:
    lines.append('widget frame: not found in ' + ('the frame' if not fa else 'the shell')); bar = 0; fbot_a = fbot_b = None
# the bar's buttons: centres against the bar's centre line (the frame's bar is 60 tall at the same top as the kit's 68)
bar_mid_b = boxes['bar'][1] + bar_h / 2
bar_mid_a = boxes['bar'][1] + (bar_h + bar) / 2           # the frame's bar: the widget starts `bar` px earlier
for n, label in (('back', 'back button'), ('ring', 'step ring')):
    if n not in boxes: continue
    x, y, w, h = boxes[n]; pad = 8
    th = 240 if n == 'ring' else 200                     # the ring's track is the lightest grey the kit draws
    # the rect stops short of the widget's frame on each image: its top edge and its left edge are
    # ink at these thresholds and would pull the centre
    def rect(top):
        x0 = max(x - pad, wx + 2); y1 = min(y + h + pad, (top or y + h + pad) - 2)
        return (x0, y - pad, x + w + pad - x0, y1 - (y - pad))
    a, b = ink(ref, rect(fa[1] if fa else None), th), ink(shot, rect(fb[1] if fb else None), th)
    if not a or not b: lines.append(f'{label}: no ink in ' + ('the frame' if not a else 'the shell')); continue
    found += 1; ca, cb = centre(a), centre(b)
    dx, dy = ca[0] - cb[0], (ca[1] - bar_mid_a) - (cb[1] - bar_mid_b)
    lines.append(f"{label}: centre frame {ca[0]:.0f},{ca[1]:.0f} · shell {cb[0]:.0f},{cb[1]:.0f} · Δx {dx:+.0f} · Δ from the bar's middle {dy:+.0f}")
    resid += [abs(dy)]; 
    if n == 'back': padx = dx                              # the kit's 4px inner padding shows here, on the x axis
# the footer button and the "Powered by" line: their distance from the widget's bottom edge
for n, label, side in (('button', 'footer button', 'bottom'), ('powered', 'powered by', 'top')):
    if n not in boxes or fbot_a is None: continue
    x, y, w, h = boxes[n]; pad = 6
    a, b = ink(ref, (x - pad, y - pad, w + 2 * pad, h + 2 * pad)), ink(shot, (x - pad, y - pad, w + 2 * pad, h + 2 * pad))
    if not a or not b: lines.append(f'{label}: no ink in ' + ('the frame' if not a else 'the shell')); continue
    found += 1
    da = (fbot_a - (a[1] + a[3])) if side == 'bottom' else (a[1] - fbot_a)
    db = (fbot_b - (b[1] + b[3])) if side == 'bottom' else (b[1] - fbot_b)
    lines.append(f"{label}: frame {a[0]},{a[1]} {a[2]}x{a[3]} · shell {b[0]},{b[1]} {b[2]}x{b[3]} · Δ left {a[0]-b[0]:+d} right {(a[0]+a[2])-(b[0]+b[2]):+d} · {side} edge from the widget's bottom: frame {da} shell {db} (Δ {da-db:+d})")
    resid += [abs(a[0] - b[0]), abs((a[0] + a[2]) - (b[0] + b[2])), abs(da - db)]
for l in lines: print('landmark: ' + l)
worst = int(round(max(resid, default=99)))
if bar: print(f"offset  : the widget starts at {fa[1]} in the frame and {fb[1]} in the shell — the frame's top bar area is {fa[1] - 4} over 4px where the kit's SdkHeader is {bar_h}: everything under the bar sits {-bar}px lower in the shell" + (f"; the bar's buttons sit {-padx:.0f}px further in (the kit's 4px inner padding)" if 'padx' in dir() and abs(padx) >= 1 else ''))
else: print("offset  : the widget starts where the frame starts it; the frame's top bar is the kit's")
print(f'NUMS {worst} {found} {bar} {bar_h}')
