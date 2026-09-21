#!/usr/bin/env python3
"""figmeta.py <saved-get_metadata.txt | file.xml> [depth=2] [--grep REGEX]

get_metadata of a whole page frame is often larger than the tool result limit (168k characters on
AML rules 3467:222795) and lands in a file. The shell needs only the top levels: the frame, its
Body, the *Sidebar* and *Header* instances with their sizes. This prints the nodes down to `depth`
(indentation levels of the XML), and with --grep also every deeper node whose line matches.
Accepts the raw XML or the JSON array the tool result file holds."""
import json, re, sys
if len(sys.argv) < 2:
    print(__doc__); sys.exit(1)
src = open(sys.argv[1], encoding='utf-8').read()
try:
    src = ''.join(x['text'] for x in json.loads(src))
except Exception:
    pass
depth = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 2
pat = re.compile(sys.argv[sys.argv.index('--grep') + 1]) if '--grep' in sys.argv else None
for line in src.split('\n'):
    s = line.strip()
    if not s.startswith('<') or s.startswith('</'):
        continue
    ind = (len(line) - len(line.lstrip())) // 2
    if ind <= depth or (pat and pat.search(s)):
        print(f'{ind} {s[:200]}')
