```
  ███████╗██╗   ██╗███╗   ███╗███████╗██╗   ██╗██████╗
  ██╔════╝██║   ██║████╗ ████║██╔════╝██║   ██║██╔══██╗
  ███████╗██║   ██║██╔████╔██║███████╗██║   ██║██████╔╝
  ╚════██║██║   ██║██║╚██╔╝██║╚════██║██║   ██║██╔══██╗
  ███████║╚██████╔╝██║ ╚═╝ ██║███████║╚██████╔╝██████╔╝
  ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═════╝
  ██████╗ ███████╗███████╗██╗ ██████╗ ███╗   ██╗    ███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
  ██╔══██╗██╔════╝██╔════╝██║██╔════╝ ████╗  ██║    ██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
  ██║  ██║█████╗  ███████╗██║██║  ███╗██╔██╗ ██║    ███████╗█████╔╝ ██║██║     ██║     ███████╗
  ██║  ██║██╔══╝  ╚════██║██║██║   ██║██║╚██╗██║    ╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
  ██████╔╝███████╗███████║██║╚██████╔╝██║ ╚████║    ███████║██║  ██╗██║███████╗███████╗███████║
  ╚═════╝ ╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝
```

# Sumsub Design Skills

Claude Code plugin for the Sumsub Product Design team. Adds 5 slash commands that automate routine Figma tasks: generating component documentation, adding screen annotations, creating mockups, building on-demand components, and auditing designs for system compliance.

All skills work through the Figma MCP server (registered automatically with the plugin) and use the Sumsub Dashboard design system (Base components, Organisms, semantic variables).

## Available Commands

### `/sumsub-design:sumsub-specs-docs` — Component Anatomy Documentation

Generates Specs-style documentation pages for any component from the design system. Creates anatomy exhibits with numbered markers pointing to structural parts, a legend with attributes, variant grids, and Do/Don't usage cards.

```
/sumsub-design:sumsub-specs-docs Button
```

### `/sumsub-design:sumsub-screen-annotations` — Scenario Annotations

Adds standardized Scenarios annotation blocks above each screen in a Figma flow. Numbers them in X.Y format and writes concise English descriptions focused on user actions.

```
/sumsub-design:sumsub-screen-annotations
```

### `/sumsub-design:sumsub-mockup` — Mockup Builder

Creates Figma mockups for any dashboard screen. Describe what you need — a table page, detail view, form, modal, empty state — and get a pixel-perfect screen built with design system components.

```
/sumsub-design:sumsub-mockup applicant list with status and date columns
/sumsub-design:sumsub-mockup settings page with form and save button
/sumsub-design:sumsub-mockup empty state for no search results
```

### `/sumsub-design:sumsub-component` — Component Builder

Builds a single Figma COMPONENT or a COMPONENT SET with variants on demand. Use when you need one reusable piece (not a full screen): a card, chip, badge, banner, custom row. Handles naming conventions (`*Published*` / `Name / Variant` / `.Internal`), auto-layout, DS token bindings (typography, colors, spacing, radius), and variant combinations via `figma.combineAsVariants()`.

```
/sumsub-design:sumsub-component Card with avatar, name, role, and kebab menu
/sumsub-design:sumsub-component Status chip with 5 color variants (green, yellow, red, grey, blue) and Small/Medium sizes
/sumsub-design:sumsub-component Info banner — inline, dismissible, with optional CTA
```

The skill clarifies scope (where to put it, single vs variant set, naming) before building, and self-verifies via audit (auto-layout, bindings, realistic default text, DS icons only).

### `/sumsub-design:sumsub-design-review` — Design System Audit

Audits Figma mockups for compliance with the Sumsub Dashboard design system. Walks the node tree via Plugin API and reports issues: unbound fills/strokes/spacing, `base/*` tokens instead of `semantic/*`, wrong fonts, wrong libraries.

```
/sumsub-design:sumsub-design-review
```

## Installation

> **📘 Full step-by-step guide: [INSTALL.md](INSTALL.md)** — prerequisites, verification, updating, team-wide setup, troubleshooting.

Quick version:

```
/plugin marketplace add SumsubProductDesign/sumsub-design-skills
/plugin install sumsub-design@sumsub-design
```

This registers the Figma MCP server automatically — no separate setup needed.

### Verify

In a new session, type:

```
/sumsub-design:sumsub-mockup create an applicant list page
```

Figma should open and a mockup should appear.

## Updating

Plugins auto-update from the marketplace. To force a refresh:

```
/plugin marketplace update sumsub-design
```

Maintainers bump `version` in `.claude-plugin/plugin.json` when releasing.

## Project Structure

```
sumsub-design-skills/
├── .claude-plugin/
│   ├── plugin.json                  # plugin manifest
│   └── marketplace.json             # marketplace catalog
├── .mcp.json                        # Figma MCP server config
├── CHANGELOG.md                     # release notes (per-version, user-visible changes)
├── skills/
│   ├── sumsub-mockup/
│   │   ├── SKILL.md                        # /sumsub-design:sumsub-mockup (Dashboard)
│   │   └── blocks/                         # helpers.js + block templates
│   ├── sumsub-component/SKILL.md           # /sumsub-design:sumsub-component
│   ├── sumsub-specs-docs/SKILL.md          # /sumsub-design:sumsub-specs-docs
│   ├── sumsub-screen-annotations/SKILL.md  # /sumsub-design:sumsub-screen-annotations
│   ├── sumsub-design-review/SKILL.md       # /sumsub-design:sumsub-design-review
│   └── websdk-mockup/                      # /sumsub-design:websdk-mockup (WebSDK flows)
│       ├── SKILL.md                                # canonical Examples-driven assembly
│       └── reference/
│           ├── variables.md                        # WebSDK token import keys
│           ├── base-components.md                  # WebSDK atoms catalog
│           ├── organisms.md                        # WebSDK organisms catalog
│           └── examples-library.md                 # canonical Widget+Organism Examples inventory
└── skills/sumsub-mockup/reference/products/   # 28 per-product pattern docs (split per-file)
    │
    │ # Foundations (shared)
    ├── design-system.md             # Components, variables, tokens
    ├── color-usage.md               # Semantic color usage
    ├── layout-patterns.md           # Dashboard page layout patterns (P1-P6)
    ├── BLOCKS.md                    # Figma Blocks system
    │
    │ # Per-product layout patterns
    ├── applicant-page-pattern.md    # Applicant detail
    ├── ap-component-catalog.md      # Applicant page component keys
    ├── case-management-pattern.md   # Case page (Pattern B), Blueprint editor (C), Report builder (D)
    ├── cm-component-catalog.md      # CM UI kit component keys (95 importable)
    ├── tm-layout-patterns.md        # Transaction Monitoring (6 patterns, 1440/1920/1681 canvases)
    ├── tm-component-catalog.md      # TM Components library (65 keys)
    ├── kyb-levels-pattern.md        # KYB Levels (Companies)
    ├── questionnaires-pattern.md    # Questionnaires Redesign
    ├── appearance-customisation-pattern.md  # WebSDK appearance editor (1920 split)
    ├── databases-pattern.md         # Databases (Active/Available)
    ├── poa-settings-pattern.md      # PoA Settings (1280 full-screen builder)
    ├── global-settings-pattern.md   # Global Settings (1920+276)
    ├── data-comparison-pattern.md   # Cross-Check Rules
    ├── aml-screening-pattern.md     # AML screening (1920+276 / 1440+52)
    ├── workflow-builder-pattern.md  # Flow Builder canvas + nodes
    │
    │ # Dashboard project (separate Figma project)
    ├── dashboard-project-files.md   # INDEX of 32 files in Dashboard project
    ├── settings-pattern.md          # Settings hub (P2 unique 80+191+1649 dual nav)
    ├── marketplace-pattern.md       # Marketplace Integrations + Products
    ├── reports-pattern.md           # Reports (P4 collapsed 52)
    ├── billing-pattern.md           # Billing (P1 with Cards Row)
    ├── operator-pattern.md          # Operator workspace (1841)
    ├── signup-pattern.md            # Sign up (P5 Image+Form split)
    ├── reusable-identity-pattern.md # Reusable Identity (P1)
    └── legacy-dashboard-patterns.md # Statistics, Dev space, Dashboard Home Old (P6)
```

## Team-wide distribution

To auto-register the marketplace for everyone on a project, add to the project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "sumsub-design": {
      "source": {
        "source": "github",
        "repo": "SumsubProductDesign/sumsub-design-skills"
      }
    }
  },
  "enabledPlugins": {
    "sumsub-design@sumsub-design": true
  }
}
```

Team members will be prompted to install the plugin when they trust the project folder.

## Team

Maintained by the Sumsub UX Team.
