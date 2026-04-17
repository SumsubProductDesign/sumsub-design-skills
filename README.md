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

Claude Code plugin for the Sumsub Product Design team. Adds 4 slash commands that automate routine Figma tasks: generating component documentation, adding screen annotations, creating mockups, and auditing designs for system compliance.

All skills work through the Figma MCP server (registered automatically with the plugin) and use the Sumsub Dashboard design system (Base components, Organisms, semantic variables).

## Available Commands

### `/sumsub-design:specs-docs` — Component Anatomy Documentation

Generates Specs-style documentation pages for any component from the design system. Creates anatomy exhibits with numbered markers pointing to structural parts, a legend with attributes, variant grids, and Do/Don't usage cards.

```
/sumsub-design:specs-docs Button
```

### `/sumsub-design:screen-annotations` — Scenario Annotations

Adds standardized Scenarios annotation blocks above each screen in a Figma flow. Numbers them in X.Y format and writes concise English descriptions focused on user actions.

```
/sumsub-design:screen-annotations
```

### `/sumsub-design:mockup` — Mockup Builder

Creates Figma mockups for any dashboard screen. Describe what you need — a table page, detail view, form, modal, empty state — and get a pixel-perfect screen built with design system components.

```
/sumsub-design:mockup applicant list with status and date columns
/sumsub-design:mockup settings page with form and save button
/sumsub-design:mockup empty state for no search results
```

### `/sumsub-design:design-review` — Design System Audit

Audits Figma mockups for compliance with the Sumsub Dashboard design system. Walks the node tree via Plugin API and reports issues: unbound fills/strokes/spacing, `base/*` tokens instead of `semantic/*`, wrong fonts, wrong libraries.

```
/sumsub-design:design-review
```

## Installation

### Prerequisites

1. **Claude Code** (desktop app or CLI) — https://claude.ai/download
2. **Figma Desktop** — https://www.figma.com/downloads/ (must be running and logged in; Claude uses your logged-in session to authenticate with the Figma MCP)
3. Access to Sumsub Figma libraries (Base components, Organisms, Assets)

### Install the plugin

In Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add SumsubProductDesign/sumsub-design-skills
/plugin install sumsub-design@sumsub-design
```

This registers the Figma MCP server automatically — no separate setup needed.

### Verify

In a new session, type:

```
/sumsub-design:mockup create an applicant list page
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
│   ├── mockup/
│   │   ├── SKILL.md                 # /sumsub-design:mockup
│   │   └── blocks/                  # helpers.js + block templates
│   ├── specs-docs/SKILL.md          # /sumsub-design:specs-docs
│   ├── screen-annotations/SKILL.md  # /sumsub-design:screen-annotations
│   └── design-review/SKILL.md       # /sumsub-design:design-review
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
