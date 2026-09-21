# -*- coding: utf-8 -*-
"""Align a light and a dark export element-by-element and derive the palette.

Two things come out of this, and both are hard to get any other way.

1. Whether the two themes share their geometry. If they do (they usually do,
   because the designer duplicated the frame and reskinned it), you are licensed
   to write the markup once and switch only colour. That single fact is worth
   more than any amount of careful copying.

2. The palette, as (light, dark) pairs. This is the trick that rescues an export
   with no layer names: a single colour is ambiguous - #FFFFFF is the page, the
   card, the button label - but the *pair* (#FFFFFF, #1B1B1F) is usually unique
   to one role. Group the matched elements by their pair and each group is a
   token; elements inside a group are then told apart by position.

    python3 align_exports.py mobile-2.svg mobile-2-dark.svg
    python3 align_exports.py light.svg dark.svg --tol 0.01 --show-matched

Read the unmatched list carefully: it is either a real design difference (an
element that only exists in one theme) or a sign your tolerance is too tight.
"""
import argparse
import sys
from collections import OrderedDict, defaultdict

sys.path.insert(0, __file__.rsplit('/', 1)[0])
import xml.etree.ElementTree as ET
from svg_dump import walk, PAINT, fmt


def key(r, tol):
    q = lambda v: round(v / tol) * tol if tol else v
    if r['kind'] == 'text':
        return ('text', q(r['x']), q(r['baseline']), r['size'], r['weight'],
                r.get('content', ''))
    return (r['kind'], q(r['x']), q(r['y']), q(r['w']), q(r['h']))


def paint_sig(r):
    """The paint attributes worth comparing, as a stable tuple."""
    keys = [k for k in PAINT if k in r] + (['fill'] if r['kind'] == 'text' else [])
    return tuple((k, str(r[k])) for k in OrderedDict.fromkeys(keys) if r.get(k))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('light')
    ap.add_argument('dark')
    ap.add_argument('--tol', type=float, default=0.01,
                    help='geometry tolerance for matching, in px (default 0.01)')
    ap.add_argument('--show-matched', action='store_true')
    a = ap.parse_args()

    A = walk(ET.parse(a.light).getroot())
    B = walk(ET.parse(a.dark).getroot())

    # bucket the dark side by geometry key, consume in document order so that
    # duplicate geometry (very common: a fill path and its stroke twin) pairs up
    buckets = defaultdict(list)
    for r in B:
        buckets[key(r, a.tol)].append(r)

    pairs, only_light = [], []
    for r in A:
        k = key(r, a.tol)
        if buckets[k]:
            pairs.append((r, buckets[k].pop(0)))
        else:
            only_light.append(r)
    only_dark = [r for v in buckets.values() for r in v]

    print('geometry match: %d of %d light elements (%d dark)'
          % (len(pairs), len(A), len(B)))
    print('tolerance: %g px' % a.tol)
    if not only_light and not only_dark:
        print('\n=> geometry is identical. Build the markup once and switch only colour.')
    else:
        print('\n=> %d light-only and %d dark-only elements. Inspect before assuming\n'
              '   a single markup covers both themes.' % (len(only_light), len(only_dark)))
        for label, rows in (('light-only', only_light), ('dark-only', only_dark)):
            for r in rows[:40]:
                print('  %-11s %s' % (label, fmt(r)))
            if len(rows) > 40:
                print('  %-11s ... %d more' % (label, len(rows) - 40))

    # --- palette: group matched elements by their (light, dark) paint pair -----
    tokens = defaultdict(list)
    same = 0
    for l, d in pairs:
        sl, sd = paint_sig(l), paint_sig(d)
        if sl == sd:
            same += 1
            continue
        tokens[(sl, sd)].append(l)

    print('\npalette: %d distinct (light, dark) pairs across %d elements'
          '  [%d elements identical in both themes]'
          % (len(tokens), sum(len(v) for v in tokens.values()), same))
    for (sl, sd), els in sorted(tokens.items(), key=lambda kv: -len(kv[1])):
        lv = ' '.join('%s=%s' % kv for kv in sl) or '(none)'
        dv = ' '.join('%s=%s' % kv for kv in sd) or '(none)'
        print('\n  %-3d x   light: %s\n          dark:  %s' % (len(els), lv, dv))
        for r in els[:8]:
            label = r.get('id') or r.get('group') or ''
            if r['kind'] == 'text':
                print('            text %-22r at %.3f, %.3f' % (
                    r.get('content', ''), r['x'], r['baseline']))
            else:
                print('            %-5s %8.3f, %-8.3f %7.3f x %-7.3f %s'
                      % (r['kind'], r['x'], r['y'], r['w'], r['h'], label[:30]))
        if len(els) > 8:
            print('            ... %d more' % (len(els) - 8))

    if a.show_matched:
        print('\n--- matched pairs ---')
        for l, d in pairs:
            print('L %s\nD %s' % (fmt(l), fmt(d)))


if __name__ == '__main__':
    main()
