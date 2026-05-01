# Sumsub ID — Component Catalog

> Source files:
> - **Account**: `F38QSCQ62kCVe8ROwpXdvn` — 16 local components (no sets)
> - **Connect**: `Z87D5m8KArTvQWH13Nwmmo` — no local components (custom Frame structure per partner)
> - **Reusable Identity**: `Fp0igOPOHzi00ZDqOsO5mk` — 3 sets + 1 component
>
> Scan date: 2026-04-30.

---

## Sumsub ID Account — Components (16 standalone)

| Component | Type | Key | Notes |
|---|---|---|---|
| `Modal/Desktop` | COMP | `86959c8ee3816066e0c57a0738aedc1381fd5bc7` | Account-specific modal shell (desktop) |
| `Modal/Mobile` | COMP | `2a34489aa9cbc4fcf9204d501981c51a604c27ce` | Mobile modal variant |
| `Top bar` | COMP | `deaf788ac4b000c98cf0bfce6d3a4067d58d6002` | Page chrome top bar |
| `Footer` | COMP | `2d9253d10c395694f6ec5ca1018bd5cf1bb04303` | Page chrome footer |
| `Block wrapper/desktop` | COMP | `b3c47ce4b489a944e16354cbfda3d5baa131e172` | Section container (desktop) |
| `Block wrapper/mobile` | COMP | `ca4df766638d61f4ae83141c964c6c18071aea7e` | Section container (mobile) |
| `Partners Wrapper/desktop` | COMP | `d4aa9097387a5e3c264a905ab02298786e04890f` | Connections list desktop |
| `Partners Wrapper/mobile` | COMP | `4bdc9497975c0b750d0cc9e40536b8ed4f5b34b4` | Connections list mobile |
| `Files/desktop` | COMP | `aacbdbdf3a1c70b9787a302fdd41c187a1f47dd3` | Document files list desktop |
| `Files/mobile` | COMP | `6fc92a58791d9d6a560ff1cc0624d5c6dabac33e` | Document files list mobile |
| `Document details` | COMP | `cc783247d93b702139bf90c667b43bb8ce38ea35` | Doc detail card |
| `Toggle` | COMP | `febfadff389ae6c95359de15e661db54e6ad7246` | Settings toggle |
| `Illustration / Liveness` | COMP | `6ca83a808b3737c778dfe81621728612c290f169` | Liveness check illustration |
| `benefits` | COMP | `be9b7365142cc9b0d93177114acd88f112e125f0` | Benefits/perks block |
| `buttons horizontal` | COMP | `23333cd0b1a34f8cab0e8119f064a4e615e3bbd1` | Horizontal button group |

> Note: all components are standalone (no `COMPONENT_SET` published). Locally living in this file's `🧩 Local Components` page (id `4175:56862`).

---

## Sumsub ID Account — External keys (verified via instance probe)

These are imported from a separate library/file, used in Account mockups:

| Component | Set Key | Variant Name | Used For |
|---|---|---|---|
| `*Sidebar* / Desktop` | `685695d849b0c1029f5ece1f209935b0a7ff935d` | `State=Have documents` (others probably: No documents, Initial) | 384-wide left sidebar |
| `Sumsub ID / Account / Header` | `b8e414041560cf9bd976a68de0ce5c11603f7be5` (component, not set) | — | Full-width 1440×64 page header (overlay) |

**Sidebar internal structure** (probed from `State=Have documents` variant):
- `Sidebar / Toolbar / Group / Desktop` (336×44, y=16) — top toolbar within sidebar
- `Content wrapper` (336×640, y=108) — nav items + identity card
- `Footer` (336×80, y=796) — sidebar bottom (logout / settings link)

Internal padding: 24px each side of 384 = `24 + 336 + 24 = 384`. Toolbar/Footer 336 wide aligned to those gutters.

**Header internal structure**:
- `Sumsub ID / Logo` (153 wide, left-aligned)
- `Row` (1039 wide, contains right-side actions)

---

## Sumsub ID Connect — Components

> File `Z87D5m8KArTvQWH13Nwmmo` has **no local components** — Connect widgets are assembled per-partner from base WebSDK atoms + custom Connect chrome.

**Confirmed Connect widget internal structure** (from MiniPay sample):

```
Frame 2085662918 (947 × 780, HORIZONTAL layout)
├── Left column   (718 × 780, x=115)
└── Right column  (680 × 836, x=696)
```

Two-column layout split. Left column hosts the Connect login form/CTA, Right column hosts marketing visuals/identity preview.

> ⚠ x positions don't sum cleanly (115 + 718 = 833, but right at x=696 means overlap). Likely auto-layout artifacts where children extend visually beyond the 947 viewport. When reproducing, match per-partner canonical exactly.

---

## Reusable Identity — Components (3 sets + 1 comp)

| Component | Type | Key | Variants |
|---|---|---|---|
| `Modal / Content` | SET | `4594eb42c26b18fbbaf2f02c0b0bedde39d1d3b0` | 4 |
| `Table` | SET | `8a6ffa603ebdb33833bd2485faf494dee81af4e7` | 2 |
| `Content / Illustration` | SET | `47d24ad164fb16492c580c57e3a72a817c31dfa7` | 2 |
| `Content / Promo` | COMP | `ddafcd5fc75b7f74fe01cf2e3344a318e2e1af90` | — |

Plus standard Dashboard `*Sidebar*` 257 + `*Header*` 1183×64 + Base components (Table Starter, Modal Basic, etc.) from external library.

---

## Component-key usage notes

- **Sumsub ID Account components** are file-local — accessed via `figma.importComponentByKeyAsync(key)`. No component sets, no variants — each is a single component.
- **Sidebar variant** (`State=Have documents`) is a set with at least 2-3 variants (Have docs / No docs / etc.). Probe via `importComponentSetByKeyAsync(685695d8...)` then `set.children` to enumerate.
- **Connect has no shipped components** — each partner integration (MiniPay, Age Verification) is a custom Frame composition. When building, reference per-partner canonical not a component key.
- **Reusable Identity** uses Dashboard base components for chrome (Sidebar, Header, Table) plus 4 file-local components for content blocks.

---

## When to use each pattern

See `sumsub-id-pattern.md` for full layout patterns. Quick reference:

- **Account dashboard** → 1440 + Sidebar 384 + Content 1024 → import Sumsub ID Account components
- **Connect widget** → 947×812 light/dark → custom Frame per partner, no published components
- **Reusable Identity admin** → 1440 + Sidebar 257 + Content 1183 → standard Dashboard chrome + Reusable Identity content blocks
