# -*- coding: utf-8 -*-
"""Exact bounding box of an SVG path.

Why exact rather than sampled: the whole point of this pipeline is that a value
in the markup can be traced back to a value in the export. A sampled bbox is off
by an unknown amount, which quietly poisons every measurement derived from it.
So cubic and quadratic segments are solved for their real extrema; only elliptic
arcs (rare in Figma output) fall back to sampling, and `path_bbox` says so via
`approx`.

    from bbox import path_bbox
    x, y, w, h = path_bbox("M10 10H30V20H10V10Z")[:4]
"""
import math
import re

NUM = re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?')
CMD = re.compile(r'[MmZzLlHhVvCcSsQqTtAa]')


def _tokens(d):
    """Yield (command, [numbers]) honouring implicit repeats (e.g. 'l 1 1 2 2')."""
    i, n = 0, len(d)
    cmd = None
    argc = dict(M=2, L=2, H=1, V=1, C=6, S=4, Q=4, T=2, A=7, Z=0)
    while i < n:
        m = CMD.match(d, i)
        if m:
            cmd = m.group()
            i = m.end()
        elif cmd is None:
            raise ValueError('path does not start with a command: %r' % d[:20])
        else:
            # implicit repeat: M becomes L, m becomes l, everything else repeats
            cmd = {'M': 'L', 'm': 'l'}.get(cmd, cmd)
        k = argc[cmd.upper()]
        args = []
        while len(args) < k:
            m = NUM.search(d, i)
            if not m:
                raise ValueError('path ended mid-command %r' % cmd)
            args.append(float(m.group()))
            i = m.end()
        yield cmd, args
        # skip separators so the next CMD.match lands on a real command
        while i < n and d[i] in ', \t\r\n':
            i += 1


def _cubic_extrema(p0, p1, p2, p3):
    """Parameter values in (0,1) where a cubic's derivative vanishes, per axis."""
    out = []
    a = 3 * (-p0 + 3 * p1 - 3 * p2 + p3)
    b = 6 * (p0 - 2 * p1 + p2)
    c = 3 * (p1 - p0)
    if abs(a) < 1e-12:
        if abs(b) > 1e-12:
            out.append(-c / b)
    else:
        disc = b * b - 4 * a * c
        if disc >= 0:
            r = math.sqrt(disc)
            out += [(-b + r) / (2 * a), (-b - r) / (2 * a)]
    return [t for t in out if 0 < t < 1]


def _cubic_at(p0, p1, p2, p3, t):
    u = 1 - t
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3


def path_bbox(d):
    """(min_x, min_y, width, height, approx) for a path's `d` attribute.

    `approx` is True when the path contains an elliptic arc, which is sampled
    rather than solved - treat such a bbox as indicative, not authoritative.
    """
    xs, ys = [], []
    cur = start = (0.0, 0.0)
    prev_cubic_ctrl = prev_quad_ctrl = None
    approx = False

    def add(p):
        xs.append(p[0]); ys.append(p[1])

    for cmd, a in _tokens(d):
        rel = cmd.islower()
        up = cmd.upper()
        cx, cy = cur
        if up == 'Z':
            cur = start
            continue
        if up == 'M':
            cur = (cx + a[0], cy + a[1]) if rel else (a[0], a[1])
            start = cur
            add(cur)
            prev_cubic_ctrl = prev_quad_ctrl = None
            continue
        if up == 'L':
            cur = (cx + a[0], cy + a[1]) if rel else (a[0], a[1])
        elif up == 'H':
            cur = (cx + a[0], cy) if rel else (a[0], cy)
        elif up == 'V':
            cur = (cx, cy + a[0]) if rel else (cx, a[0])
        elif up in ('C', 'S', 'Q', 'T'):
            if up == 'C':
                c1 = (cx + a[0], cy + a[1]) if rel else (a[0], a[1])
                c2 = (cx + a[2], cy + a[3]) if rel else (a[2], a[3])
                end = (cx + a[4], cy + a[5]) if rel else (a[4], a[5])
            elif up == 'S':
                c1 = (2*cx - prev_cubic_ctrl[0], 2*cy - prev_cubic_ctrl[1]) \
                     if prev_cubic_ctrl else (cx, cy)
                c2 = (cx + a[0], cy + a[1]) if rel else (a[0], a[1])
                end = (cx + a[2], cy + a[3]) if rel else (a[2], a[3])
            else:
                # quadratic, raised to a cubic so one code path covers both
                if up == 'Q':
                    q = (cx + a[0], cy + a[1]) if rel else (a[0], a[1])
                    end = (cx + a[2], cy + a[3]) if rel else (a[2], a[3])
                else:
                    q = (2*cx - prev_quad_ctrl[0], 2*cy - prev_quad_ctrl[1]) \
                        if prev_quad_ctrl else (cx, cy)
                    end = (cx + a[0], cy + a[1]) if rel else (a[0], a[1])
                prev_quad_ctrl = q
                c1 = (cx + 2.0/3*(q[0]-cx), cy + 2.0/3*(q[1]-cy))
                c2 = (end[0] + 2.0/3*(q[0]-end[0]), end[1] + 2.0/3*(q[1]-end[1]))
            add((cx, cy)); add(end)
            for i, (p0, p1, p2, p3) in enumerate(
                    (((cx, c1[0], c2[0], end[0])), ((cy, c1[1], c2[1], end[1])))):
                for t in _cubic_extrema(p0, p1, p2, p3):
                    v = _cubic_at(p0, p1, p2, p3, t)
                    (xs if i == 0 else ys).append(v)
            prev_cubic_ctrl = c2
            cur = end
            if up in ('C', 'S'):
                prev_quad_ctrl = None
            add(cur)
            continue
        elif up == 'A':
            approx = True
            end = (cx + a[5], cy + a[6]) if rel else (a[5], a[6])
            add((cx, cy)); add(end)
            # crude but bounded: sample the chord's midpoint region
            for t in (0.25, 0.5, 0.75):
                add((cx + (end[0]-cx)*t, cy + (end[1]-cy)*t))
            cur = end
            prev_cubic_ctrl = prev_quad_ctrl = None
            continue
        prev_cubic_ctrl = prev_quad_ctrl = None
        add(cur)

    if not xs:
        raise ValueError('path produced no points: %r' % d[:40])
    return (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys), approx)


if __name__ == '__main__':
    # Self-test. The relative/absolute pair matters: a parser that handles only
    # uppercase commands looks fine on Figma rects and then dies on an icon.
    cases = [
        ('M10 10H30V20H10V10Z',            (10, 10, 20, 10)),
        ('m10 10h20v10h-20v-10z',          (10, 10, 20, 10)),
        ('M0 0C0 10 10 10 10 0',           (0, 0, 10, 7.5)),   # extremum, not endpoint
        ('M0 0 L10 0 L10 10 Z',            (0, 0, 10, 10)),
        ('M0 0Q5 10 10 0',                 (0, 0, 10, 5)),
    ]
    ok = True
    for d, want in cases:
        got = path_bbox(d)[:4]
        good = all(abs(g - w) < 1e-6 for g, w in zip(got, want))
        ok &= good
        print('%-4s %-30s -> %s' % ('ok' if good else 'FAIL', d,
                                    tuple(round(v, 4) for v in got)))
    raise SystemExit(0 if ok else 1)
