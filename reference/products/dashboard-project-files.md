# Dashboard Project — File Index

> Figma project: `https://www.figma.com/files/1080492641474341268/project/69006343` ("Dashboard")
> Scan date: 2026-04-30 via REST API.
> 32 files in project. Per-product pattern docs split out — this doc is just the index.

---

## File index — per-product pattern docs

| File | fileKey | Pattern doc |
|---|---|---|
| Settings (Profile/Team/Roles/Branding/Business info/Legal info) | `Sr2T9AUlfHC2MCvLcvjBlm` | `settings-pattern.md` |
| Marketplace (Integrations) | `7Es0aOncvoCzoCYi1A7kDf` | `marketplace-pattern.md` (Pattern A) |
| Marketplace (Products) | `OmIkC2VnaNG65Wb3F2vxxH` | `marketplace-pattern.md` (Pattern B) |
| Reports | `zYDE1v0b5Zg08tZqVvhgHb` | `reports-pattern.md` |
| Billing | `kHQyyYdPZjEyrSahRmBLUr` | `billing-pattern.md` |
| Operator | `yovNHdbi0rO4nLjFaBa8G5` | `operator-pattern.md` |
| Sign up | `sg6CCKd31nOQmW56Od6J9q` | `signup-pattern.md` |
| Reusable Identity | `Fp0igOPOHzi00ZDqOsO5mk` | `reusable-identity-pattern.md` |
| Statistic and Analytics | `aBdA1dvIhBa1vcdehIHpzg` | `legacy-dashboard-patterns.md` |
| Dev space | `ru7I1EsmuyipGKsVOSY6d2` | `legacy-dashboard-patterns.md` |
| Dashboard Home page | `sdve0hJDYkyGbXIswxP36Z` | `legacy-dashboard-patterns.md` |

---

## Active product files NOT yet deeply scanned

| File | fileKey | Likely pattern |
|---|---|---|
| Admin area | `IxO8j6k17tj2B9szi3FTcn` | Settings family (1920+276 or 1440+257) |
| Moderator statistics | `vQBIhvsJv6Pw8kjP73Vdds` | Analytics dashboard |
| Client data access for internal users | `M3ULi0c8iisDH8GtFwQejP` | Settings or list |
| Applicant page. Device check | `FCbD1UgRHMfKCqxtloZD6s` | Applicant page extension — see `applicant-page-pattern.md` |
| Self service tasks | `Zdpd5WCD4rdg6KH53Stuy5` | Tasks queue list |
| Semantic search | `1oUFoRm1SaDUQ4vNRm8RFz` | Search overlay |
| Global Search | `idCw36bV6bCN2IRid2PORI` | Global search overlay |
| Clients Agreements | `WQbOuLlfUTed5K6RrDY8Zb` | Legal docs / agreement viewer |

These can be opened by fileKey if the user asks for a build referencing them. Pattern likely matches existing P1-P6 categories.

---

## Non-product files (skip)

These are presentations, refs, tests, or legacy abandoned files. Don't sample these for canonical references:

`AI agent`, `AI agent references`, `Billing overview Wynde test`, `Cases` (empty), `Colors Test`, `Communication system` (mermaid diagram), `OAuth for Public MCP Server`, `Onboarding Refs`, `Page about the key (UHO)`, `SS clients due diligence`, `Self Serve User Flow / Team` (legacy 2023), `Self-serve` (legacy), `Summy AI Copilot: presentation`.

---

## Layout pattern families used in this project

| Pattern | Canvas + Sidebar | Files using it |
|---|---|---|
| **P1 — Standard list** | 1440 + Sidebar 257 | Marketplace (Integrations), Reusable Identity, Billing |
| **P2 — Settings hub** (unique) | 1920 + Menu 80 + Additional Menu 191 + Header 1649 | Settings (this is the only file using P2) |
| **P3 — Settings family** | 1920/1841 + Sidebar 276 | Operator (and also TM Settings, Questionnaires list, Databases, Global Settings, AML Vendors, Data Comparison) |
| **P4 — Editor (collapsed nav)** | 1440 + Sidebar 52 | Reports |
| **P5 — Auth split** | 1920: Image 1120 + Form 800 | Sign up |
| **P6 — Legacy** | 1280-1920 + 80 or 281-wide nav | Dashboard Home Old, Statistics, Dev space |

---

## How to enumerate this project

A Figma Personal Access Token + REST API call:

```sh
curl -H "X-Figma-Token: <PAT>" "https://api.figma.com/v1/projects/69006343/files" | jq
```

The team-wide `/v1/teams/{team_id}/projects` endpoint requires team-id permissions on the token. Sumsub team_id: `1080492641474341268` (extracted from `figma.com/files/1080492641474341268/project/69006343`).

**Don't keep PATs in this repo** — they have full read+write access. Generate ad-hoc, use, revoke.
