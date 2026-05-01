# Reusable Identity — Layout Pattern

> Source file: `Fp0igOPOHzi00ZDqOsO5mk`
> Scan date: 2026-04-30
> Standard Pattern 1 (1440 + Sidebar 257). Same as Marketplace Integrations.

---

## Pattern — Standard list (Sidebar 257)

```
Root (1440 × 900, fill #ffffff)
├── *Sidebar*  (257 × 900, x=0)
└── (Wokspace_1280x720 wrapper)
    ├── *Header*   (1183 × 64, x=257, y=0)
    └── Content   (1183 × 836, x=257, y=64)
        └── (reusable KYC flow / partners config)
```

Layout sum: `257 + 1183 = 1440` ✓

---

## Source pages

| Page | ID | Purpose |
|---|---|---|
| General flow | `245:253` | reusable KYC overview |
| Partners | `2:8` | partner management |
| Reusable KYC | `2:9` | KYC reuse config |
| Documentation | `3812:37418` | feature docs |

---

## Notes & gotchas

- **Standard `layout-patterns.md` Pattern 1** — nothing custom here. Standard 1440+257 with Header+Content.
- File contains a `Wokspace_1280x720` wrapper FRAME that's vestigial from older 1280 breakpoint — actual Sidebar+Content live alongside or inside it. Verify on the specific screen you're reproducing.
