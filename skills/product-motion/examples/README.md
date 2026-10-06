# Examples — complete builders from the Assets promo set

Real, reviewed builders. They need their source SVGs (`tools/src-<name>.svg` / `src-<name>-dark.svg`,
exported from the Assets file) to run; read them for the technique, copy the closest one to start a
new illustration. Each writes the HTML preview and the Lottie for one theme per run.

| Builder | Story | Technique worth copying |
|---|---|---|
| `build_kyb.py` | company card rises, ownership tree grows, loaders turn into data with the tree, status last | DS skeleton loaders resolving in step (rules B9), tree drawing, pulse |
| `build_blueprints.py` | cards step along a wheel to the arrow, the winner opens into a folder | roulette on a wheel (null + parented cards), counter-rotation at stops, knock wrapper (B8), ticks after landing (B7), text turning active (raster colour precomp), centred new pill |
| `build_cm.py` | sources slide in, link draws, case card opens from its end, assignee goes online | link reaching its target exactly when the target is whole, end dot at the visual touch (C4), Lottie layer order |
| `build_fraud_radar.py` | radar sweep from the rings' centre picks up blips, callouts grow, counts run up | metaphor-driven centre (B1), motion blur for a fast beam (B14), counters as hold-keyed images (B11) |
| `build_applicant_scoring.py` | risk factors resolve, the score marker moves and the tooltip counts and changes category | live value at every step and category morph (B10) |
| `build_non_doc.py` | a deck shuffle: the card underneath comes out on top, the old one goes under | physically readable swap (B4), the object becomes the target (B5), typed-in value |
| `build_aml_rules.py` | rule chain rises and links, the last rule expands while loading, the applicant connects | accordion that stays one card (B12), real contours for glass while growing (B13), loading lines |

Common to all: square deliverables, `ref.svg` written for the final-frame check, `motion(NAME)` for
every standard motion, layers found by content, both themes from one script.
