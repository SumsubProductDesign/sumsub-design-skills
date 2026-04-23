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
├── skills/
│   ├── sumsub-mockup/
│   │   ├── SKILL.md                        # /sumsub-design:sumsub-mockup
│   │   └── blocks/                         # helpers.js + block templates
│   ├── sumsub-component/SKILL.md           # /sumsub-design:sumsub-component
│   ├── sumsub-specs-docs/SKILL.md          # /sumsub-design:sumsub-specs-docs
│   ├── sumsub-screen-annotations/SKILL.md  # /sumsub-design:sumsub-screen-annotations
│   └── sumsub-design-review/SKILL.md       # /sumsub-design:sumsub-design-review
└── reference/
    ├── design-system.md             # Components, variables, tokens
    ├── color-usage.md               # Semantic color usage
    ├── layout-patterns.md           # Page layout patterns
    └── BLOCKS.md                    # Figma Blocks system
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
