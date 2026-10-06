# Handoff — the developer bundle and updates

## 1. Full bundle

```bash
python3 tools/export_handoff.py
```

writes `handoff/<label>-<date>/` and a `.zip` next to it:

- `lottie/<name>-<theme>.json` — what the developer uses (lottie-web, no fonts needed);
- `svg/<name>-<theme>.svg` — the same animation as a self-contained animated SVG (CSS inside, ids
  namespaced per file, plays when seen, honours reduced motion / transparency);
- `README.md` — the developer's task, behaviour, code snippets, what replaces what;
- `mapping.json` — the same mapping as data.

Every `<name>-light.json` in `lottie/` with its HTML preview goes in. Run all checks first.

## 2. `handoff.json` (workspace root)

Optional project settings; the copy in the toolkit is pre-filled for the Assets promo set.

```json
{
  "title": "Dashboard promo illustrations — motion",
  "label": "promo-motion",
  "assets_file": "<Figma file key of the static illustrations>",
  "component_prefix": "Illustrations / Promo / ",
  "size_1x": [494, 354],
  "corner_radius": 16,
  "preview_url": "",
  "contact": "<name of the designer to ask>",
  "components": {
    "KYB": ["kyb", ["<light node id>", "<light component key>"], ["<dark node id>", "<dark component key>"]],
    "Partners": [null, ["…", "…"], ["…", "…"]]
  }
}
```

`components` maps each static component title to the animation's file base (`null` = not animated,
the static image stays) — it becomes the **What replaces what** table, so the developer knows which
static image each file replaces. A full bundle refuses to build if an animation has no component.
Fill `contact`; `preview_url` only if the previews are hosted somewhere the developer can open.

## 3. Updates after the bundle was handed over

Once the developer has the full bundle, send **only what changed**:

```bash
python3 tools/export_handoff.py --only blueprints --changes changes.md     # or --only a,b
```

writes `handoff/<label>-update-<date>/` + `.zip` with those files and a short README: which files it
replaces, **what changed** (the bullets from `changes.md`, one per illustration, in plain words), and that size,
behaviour and corners are the same. If a last frame changed on purpose (rules B17), say so in the bullets. Give the
user a one-paragraph message for the developer in their language, for example:

> Update for Blueprints: replace these four files from the bundle (`lottie/blueprints-light.json`,
> `lottie/blueprints-dark.json`, `svg/blueprints-light.svg`, `svg/blueprints-dark.svg`). Only the
> animation changed; size, length and the last frame are the same — nothing else to change.

## 4. What to tell the user when handing a bundle over

Send the zip **and** the README, and give the user a short instruction for the developer (in the
user's language): which files to use (Lottie of the same theme), the box size, that corners are
square and the container rounds them, the behaviour (once when seen, reduced motion → last frame
fades in, theme switch after playing → the other theme's last frame), which illustrations stay
static, and what to check before handing back.
