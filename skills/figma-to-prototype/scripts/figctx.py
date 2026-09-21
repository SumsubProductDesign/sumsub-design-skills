#!/usr/bin/env python3
"""figctx.py <saved-get_design_context.txt | file.jsx> [--assets DIR] [--split NAME] [--depth N] [--grep REGEX]

A design context of a table or a page is usually larger than the tool result limit (72k–120k characters on
the two list screens built so far) and lands in a file. This prints what a generator needs from it and
nothing else:

  outline   one line per element, indented by depth: tag [data-name] the auto-layout tokens that decide
            geometry (w-[…] shrink-0 = fixed width, flex-[1_0_0] min-w-[…] = flexible with a minimum,
            gap/padding, bg, border, rounded, text size/colour/weight) and the element's text or img const.
            An asset line ends with "! wrapper: …" when it, or any ancestor, carries a placement token
            (rotate-180, -scale-x-100, inset-[6.38%], top-/left-[…]): the export is the raw shape and
            THAT token is where Figma turned or inset it. Three cycles were lost to reading the shape
            and missing the wrapper (traps.md, Figma → CSS); the marker is there so it is read first
  assets    every `const imgX = "https://…"` — with --assets DIR each is downloaded to DIR/imgX.svg
  --split NAME   texts and img consts per repeated component (e.g. --split "Table Row") — the row data
  --grep REGEX   only lines matching (plus their assets)
  --depth N      cut the outline at that depth

Accepts the raw JSX or the JSON array the tool result file holds. Never read that file chunk by chunk."""
import json, os, re, subprocess, sys

if len(sys.argv) < 2:
    print(__doc__); sys.exit(1)
src = open(sys.argv[1], encoding='utf-8').read()
try:
    src = ''.join(x['text'] for x in json.loads(src))
except Exception:
    pass
args = sys.argv[2:]
opt = lambda k: args[args.index(k) + 1] if k in args else None
assets_dir, split, depth_cap, grep = opt('--assets'), opt('--split'), opt('--depth'), opt('--grep')
depth_cap = int(depth_cap) if depth_cap else None
pat = re.compile(grep) if grep else None

assets = dict(re.findall(r'const (\w+) = "(https://[^"]+)"', src))
if assets_dir:
    # The file is named after the const, and const names are unique only INSIDE one design
    # context. Two contexts from the same frame gave imgNormalId twice — an id glyph in the
    # summary panel, a checkmark in the card — and the second download silently replaced the
    # first, so the page rendered the wrong picture and every measurement of it passed.
    # A name already taken by a different URL gets the URL's own suffix, and the collision is
    # printed: the caller then knows the outline's name and the file's name differ.
    os.makedirs(assets_dir, exist_ok=True)
    seen = {}
    mpath = os.path.join(assets_dir, '_assets.json')
    # file -> URL, not const -> file: a const can mean two different assets, a file cannot
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}   # later runs add to it
    clashes = []
    for k, u in assets.items():
        name = k
        prev = os.path.join(assets_dir, k + '.svg')
        if os.path.exists(prev):
            claimed = seen.get(k)
            if claimed is None:
                # written by an earlier run: keep it unless this URL is a different asset
                import hashlib
                old_bytes = open(prev, 'rb').read()
                tmp = prev + '.new'
                subprocess.run(['curl', '-sL', '-o', tmp, u])
                new_bytes = open(tmp, 'rb').read() if os.path.exists(tmp) else b''
                if new_bytes and new_bytes != old_bytes:
                    name = k + '-' + u.rsplit('/', 1)[-1][:8]
                    os.replace(tmp, os.path.join(assets_dir, name + '.svg'))
                    clashes.append((k, name))
                    manifest[name] = u
                else:
                    if os.path.exists(tmp): os.remove(tmp)
                seen[k] = u
                manifest.setdefault(name, u)
                continue
            elif claimed != u:
                name = k + '-' + u.rsplit('/', 1)[-1][:8]
                clashes.append((k, name))
        seen.setdefault(k, u)
        subprocess.run(['curl', '-sL', '-o', os.path.join(assets_dir, name + '.svg'), u])
        manifest[name] = u
    with open(os.path.join(assets_dir, '_assets.json'), 'w') as fh:
        json.dump(manifest, fh, indent=1, sort_keys=True)
    print(f'assets: {len(assets)} downloaded to {assets_dir}')
    for k, name in clashes:
        print(f'  CLASH {k} already taken by another asset -> saved as {name}.svg')
    if clashes:
        print('  (const names repeat between design contexts; _assets.json maps file -> URL)')
else:
    for k, u in assets.items(): print('asset', k, u)

PLACE = re.compile(r'(?:^|\s)(-?rotate-(?:\[[^\]]+\]|\d+)|-?scale-[xy]?-?(?:\[[^\]]+\]|\d+)|inset-(?:[xy]-)?\[[^\]]+\]|(?:top|left|right|bottom)-\[[^\]]+\])')
KEEP = re.compile(r'(?:^|\s)(w-\[[^\]]+\]|h-\[[^\]]+\]|size-\[[^\]]+\]|flex-\[1_0_0\]|flex-1|w-full|h-full|shrink-0|min-w-px|min-w-\[[^\]]+\]|gap-\[[^\]]+\]|p[xytblr]?-\[[^\]]+\]|bg-\[[^\]]+\]|border(?:-[a-z]+)?(?:-\[[^\]]+\])?|rounded(?:-[a-z]+)?-\[[^\]]+\]|text-\[[^\]]+\]|font-\[[^\]]+\]|leading-\[[^\]]+\]|items-\w+|justify-\w+|flex-col|absolute|overflow-clip|whitespace-nowrap|text-ellipsis|text-right|text-center|hidden)')
def outline(seg, cap=None):
    depth, out, placed = 0, [], []          # placed: the placement tokens of every open ancestor, by depth
    for m in re.finditer(r'<(/?)([A-Za-z][\w.]*)([^>]*?)(/?)>', seg):
        close, tag, attrs, selfclose = m.groups()
        if close:
            depth -= 1; del placed[depth:]; continue
        name = re.search(r'data-name="([^"]+)"', attrs)
        cls = re.search(r'className=\{?"([^"]*)"', attrs) or re.search(r'className=\{`([^`]*)`', attrs)
        toks = re.sub(r'var\(--[^,]+,([^)]+)\)', r'\1', ' '.join(KEEP.findall(cls.group(1)))) if cls else ''
        own = PLACE.findall(cls.group(1)) if cls else []
        img = re.search(r'src=\{(\w+)\}', attrs)
        after = seg[m.end():m.end() + 300]; t = re.match(r'\s*([^<{]+?)\s*<', after)
        # nearest first: the asset's own placement, then its parent's, then the grandparent's
        wrap = own + [tk for lvl in reversed(placed[:depth]) for tk in lvl]
        line = '  ' * depth + tag + (f' [{name.group(1)}]' if name else '') + (f' {toks}' if toks else '') \
               + (f' src={img.group(1)}' if img else '') + (f' "{t.group(1).strip()}"' if t and t.group(1).strip() else '') \
               + (f' ! wrapper: {" ".join(wrap)}' if img and wrap else '')
        if (cap is None or depth <= cap) and (pat is None or pat.search(line)):
            out.append(line)
        if not selfclose:
            placed[depth:] = [own]; depth += 1
    return out

if split:
    parts = re.split(r'data-name="' + re.escape(split) + r'"', src)[1:]
    print(f'split: {len(parts)} × "{split}"')
    for i, p in enumerate(parts, 1):
        p = p.split('data-name="Divider Line"')[0]
        texts = [t for t in re.findall(r'>\s*([^<>{}]+?)\s*</(?:p|span)>', p) if t.strip()]
        imgs = re.findall(r'src=\{(\w+)\}', p)
        print(f'{i}. texts={json.dumps(texts, ensure_ascii=False)} imgs={imgs}')
else:
    print('\n'.join(outline(src, depth_cap)))
