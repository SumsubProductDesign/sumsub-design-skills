# -*- coding: utf-8 -*-
"""Find colour literals that escaped the theme palette.

Run this straight after introducing a second theme. The failure it catches is
specific and easy to miss: a helper written before theming still carries the
light value, so it keeps rendering light after the switch. It looks like a
design bug, and you will hunt it in the wrong place.

    # only the themed region, with the palette declaration itself excluded
    python3 hex_sweep.py template.html \
        --only-from 'function previewArea' --only-to 'PANELS = {' \
        --skip-from 'const PREVIEW_THEME' --skip-to 'function PT'

    python3 hex_sweep.py template.html --allow 't.shell' --rgba

Usually only part of the file is themed - dashboard chrome legitimately carries
single-theme colours - so scope the search with --only-from/--only-to and you
get a short list worth reading. All four bounds are plain substrings, matched on
the first line that contains them.
"""
import argparse
import re
import sys

HEX = re.compile(r'#[0-9A-Fa-f]{3,8}\b')
RGBA = re.compile(r'rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+', re.I)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('files', nargs='+')
    ap.add_argument('--allow', action='append', default=[],
                    help='skip lines containing this substring (repeatable)')
    ap.add_argument('--only-from', dest='only_from',
                    help='start searching at the first line containing this')
    ap.add_argument('--only-to', dest='only_to', help='stop searching there')
    ap.add_argument('--skip-from', dest='skip_from',
                    help='exclude the block starting at this line (e.g. the palette)')
    ap.add_argument('--skip-to', dest='skip_to')
    ap.add_argument('--rgba', action='store_true', help='also flag rgb()/rgba() literals')
    a = ap.parse_args()

    hits = 0
    for path in a.files:
        skipping = False
        active = not a.only_from          # no --only-from means the whole file
        for n, line in enumerate(open(path, encoding='utf-8'), 1):
            if not active and a.only_from and a.only_from in line:
                active = True
            if active and a.only_to and a.only_to in line:
                active = False
                continue
            if not active:
                continue
            if a.skip_from and a.skip_from in line:
                skipping = True
            if skipping:
                if a.skip_to and a.skip_to in line:
                    skipping = False
                continue
            if any(s in line for s in a.allow):
                continue
            found = HEX.findall(line) + (RGBA.findall(line) if a.rgba else [])
            if found:
                hits += 1
                print('%s:%d: %s' % (path, n, line.rstrip()[:150]))
                print('%s  ^ %s' % (' ' * (len(path) + len(str(n)) + 1),
                                    ', '.join(sorted(set(found)))))

    print('\n# %d line(s) with colour literals outside the palette' % hits,
          file=sys.stderr)
    if hits:
        print('# Each one is either a deliberate single-theme value - say so in a\n'
              '# comment - or a token that was never wired up.', file=sys.stderr)


if __name__ == '__main__':
    main()
