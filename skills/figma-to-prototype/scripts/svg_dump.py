# -*- coding: utf-8 -*-
"""Dump every drawable element of a Figma SVG export with exact geometry+paint.

This is the first thing to run on a new export. Reading the raw file top to
bottom works but hides the two things you actually need: what the numbers are,
and which elements are decoration you can ignore.

    python3 svg_dump.py editor-colors.svg                # everything
    python3 svg_dump.py editor-colors.svg --grep '#D1D5DC'
    python3 svg_dump.py editor-colors.svg --kind text
    python3 svg_dump.py editor-colors.svg --json > colors.json

Output is one stable line per element, so two exports can be diffed directly:

    diff <(python3 svg_dump.py light.svg) <(python3 svg_dump.py dark.svg)

Elements inside <defs>, <clipPath> and <mask> are skipped by default. That is
not tidiness - a <rect> inside a <clipPath> carries no visual geometry, and
counting it is a classic way to "find" an element that was never drawn. Pass
--all when you are deliberately inspecting a clip or an inside-stroke mask.
"""
import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from bbox import path_bbox

NS = '{http://www.w3.org/2000/svg}'
SKIP_CONTAINERS = ('defs', 'clipPath', 'mask', 'linearGradient',
                   'radialGradient', 'pattern', 'filter')
PAINT = ('fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity',
         'opacity', 'fill-rule')
FONT = ('font-family', 'font-size', 'font-weight', 'letter-spacing')


def tag(el):
    return el.tag[len(NS):] if el.tag.startswith(NS) else el.tag


def parse_transform(s):
    """Accumulated (tx, ty) plus a flag for anything this cannot represent."""
    if not s:
        return 0.0, 0.0, False
    tx = ty = 0.0
    unsupported = False
    for name, args in re.findall(r'(\w+)\s*\(([^)]*)\)', s):
        v = [float(x) for x in re.findall(r'[-+]?[\d.]+(?:[eE][-+]?\d+)?', args)]
        if name == 'translate':
            tx += v[0]
            ty += v[1] if len(v) > 1 else 0.0
        elif name == 'matrix' and len(v) == 6 and (v[0], v[1], v[2], v[3]) == (1, 0, 0, 1):
            tx += v[4]
            ty += v[5]
        else:
            unsupported = True
    return tx, ty, unsupported


def geometry(el, tx, ty):
    """(x, y, w, h, note) in the element's resolved coordinate space, or None."""
    t = tag(el)
    g = el.get
    try:
        if t == 'rect':
            return (float(g('x', 0)) + tx, float(g('y', 0)) + ty,
                    float(g('width', 0)), float(g('height', 0)),
                    'rx=%s' % g('rx') if g('rx') else '')
        if t == 'circle':
            r = float(g('r', 0))
            return (float(g('cx', 0)) - r + tx, float(g('cy', 0)) - r + ty,
                    2 * r, 2 * r, 'r=%s' % g('r'))
        if t == 'ellipse':
            rx, ry = float(g('rx', 0)), float(g('ry', 0))
            return (float(g('cx', 0)) - rx + tx, float(g('cy', 0)) - ry + ty,
                    2 * rx, 2 * ry, '')
        if t == 'line':
            xs = sorted((float(g('x1', 0)), float(g('x2', 0))))
            ys = sorted((float(g('y1', 0)), float(g('y2', 0))))
            return (xs[0] + tx, ys[0] + ty, xs[1] - xs[0], ys[1] - ys[0], '')
        if t == 'image':
            return (float(g('x', 0)) + tx, float(g('y', 0)) + ty,
                    float(g('width', 0)), float(g('height', 0)), 'embedded')
        if t == 'path':
            x, y, w, h, approx = path_bbox(g('d', ''))
            return (x + tx, y + ty, w, h, 'ARC-APPROX' if approx else '')
    except (TypeError, ValueError) as e:
        return (0.0, 0.0, 0.0, 0.0, 'UNPARSED %s' % e)
    return None


def paint_of(el):
    out = {}
    for k in PAINT:
        v = el.get(k)
        if v:
            out[k] = v
    style = el.get('style') or ''
    for k, v in re.findall(r'([\w-]+)\s*:\s*([^;]+)', style):
        if k in PAINT:
            out.setdefault(k, v.strip())
    return out


def inherited(chain, key):
    """Nearest ancestor value - Figma puts font-* on <text> and paint on <g>."""
    for el in reversed(chain):
        v = el.get(key)
        if v:
            return v
    return None


def walk(root, include_all=False):
    rows = []

    def rec(el, chain, tx, ty, clipped, warn):
        for child in el:
            t = tag(child)
            if t in SKIP_CONTAINERS and not include_all:
                continue
            ctx, cty, bad = parse_transform(child.get('transform'))
            ntx, nty = tx + ctx, ty + cty
            nwarn = warn or bad
            nclip = clipped or bool(child.get('clip-path')) or bool(child.get('mask'))
            if t in ('g', 'svg', 'a') or t in SKIP_CONTAINERS:
                rec(child, chain + [child], ntx, nty, nclip, nwarn)
                continue
            if t == 'text':
                fam = inherited(chain + [child], 'font-family')
                size = inherited(chain + [child], 'font-size')
                weight = inherited(chain + [child], 'font-weight') or '400'
                ls = inherited(chain + [child], 'letter-spacing') or ''
                fill = inherited(chain + [child], 'fill') or ''
                spans = [s for s in child.iter() if tag(s) == 'tspan'] or [child]
                for s in spans:
                    rows.append(dict(
                        kind='text', id=child.get('id') or '',
                        group='/'.join(g.get('id') or '' for g in chain if g.get('id')),
                        x=float(s.get('x', 0)) + ntx,
                        baseline=float(s.get('y', 0)) + nty,
                        family=fam, size=size, weight=weight,
                        letter_spacing=ls, fill=fill,
                        content=(s.text or '')))
                continue
            geo = geometry(child, ntx, nty)
            if geo is None:
                continue
            x, y, w, h, note = geo
            rows.append(dict(
                kind=t, id=child.get('id') or '',
                group='/'.join(g.get('id') or '' for g in chain if g.get('id')),
                x=x, y=y, w=w, h=h, note=note,
                clipped=nclip, transform_warning=nwarn,
                **paint_of(child)))

    rec(root, [root], 0.0, 0.0, False, False)
    return rows


def fmt(r):
    if r['kind'] == 'text':
        return ('text  x=%-10.4f base=%-10.4f %s/%s/%s  ls=%-6s %-9s %-28s %r'
                % (r['x'], r['baseline'], r['family'], r['size'], r['weight'],
                   r['letter_spacing'] or '0', r['fill'], r['id'][:28], r['content']))
    paint = ' '.join('%s=%s' % (k, r[k]) for k in PAINT if k in r)
    flags = ''.join(('C' if r.get('clipped') else '',
                     'T' if r.get('transform_warning') else ''))
    return ('%-5s x=%-10.4f y=%-10.4f w=%-10.4f h=%-10.4f %-2s %-28s %-14s %s'
            % (r['kind'], r['x'], r['y'], r['w'], r['h'], flags,
               r['id'][:28], r['note'], paint))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('svg')
    ap.add_argument('--all', action='store_true',
                    help='include defs/clipPath/mask/gradient contents')
    ap.add_argument('--kind', help='only this element kind (rect, path, text, image...)')
    ap.add_argument('--grep', help='substring filter over the formatted line')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()

    rows = walk(ET.parse(a.svg).getroot(), a.all)
    if a.kind:
        rows = [r for r in rows if r['kind'] == a.kind]
    lines = [(r, fmt(r)) for r in rows]
    if a.grep:
        lines = [(r, s) for r, s in lines if a.grep in s]
    if a.json:
        json.dump([r for r, _ in lines], sys.stdout, indent=1, ensure_ascii=False)
        print()
        return
    for _, s in lines:
        print(s)
    kinds = {}
    for r, _ in lines:
        kinds[r['kind']] = kinds.get(r['kind'], 0) + 1
    warn = sum(1 for r, _ in lines if r.get('transform_warning'))
    print('\n# %d elements  %s%s' % (
        len(lines), '  '.join('%s=%d' % kv for kv in sorted(kinds.items())),
        '  [T = unsupported transform, geometry unreliable: %d]' % warn if warn else ''),
        file=sys.stderr)


if __name__ == '__main__':
    main()
