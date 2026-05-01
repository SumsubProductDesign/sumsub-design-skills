# Operator (Performance Stats / Full Check) — Layout Pattern

> Source file: `yovNHdbi0rO4nLjFaBa8G5`
> Scan date: 2026-04-30
> Standard Settings family pattern on extended canvas.

---

## Pattern — Settings family on 1841px canvas

```
Root (1841 × 900, fill #ffffff)
├── *Sidebar*  (276 × 900, x=0)
└── Frame (Body)  (1565 × 900, x=276)
    └── (operator workspace content — performance stats / full check / working hours)
```

Layout sum: `276 + 1565 = 1841` ✓

**Why 1841 (not 1920)?** Operator file uses a non-standard canvas width. Likely an older breakpoint; could be 1840 with 1px artifact. Match exactly when reproducing — don't auto-default to 1920.

---

## Source pages

| Page | ID | Purpose |
|---|---|---|
| Performance stats | `135:8140` | operator metrics dashboard |
| New Performance + Applicant stats (WIP) | `1012:2194` | redesign in progress |
| Full check | `405:13534` | full verification check workspace |
| Working hours | `0:1` | shift/availability config |

---

## Notes & gotchas

- **Canvas 1841** — non-standard. Don't substitute 1920 or 1440. Match the canonical exactly.
- **Sidebar 276 (Settings family)** — same as TM Settings, Questionnaires, Databases, Global Settings.
- **No standard Header** in Operator screens — Body contains its own chrome (or is purely a workspace canvas).
- Operator is the **moderator/operator workspace** — not the same as Mission Control or Reviews panel (those are likely separate files not in this Dashboard project).
