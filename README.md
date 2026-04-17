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

Claude skills for the Sumsub Product Design team. Adds 4 slash commands that automate routine Figma tasks: generating component documentation, adding screen annotations, creating mockups, and auditing designs for system compliance.

All skills work through the Figma MCP server and use the Sumsub Dashboard design system (Base components, Organisms, semantic variables).

> **📘 Detailed install guide: [INSTALL.md](INSTALL.md)**
>
> Step-by-step for designers: Claude Desktop + Figma MCP server + skills.

## Available Skills

### `/sumsub-specs-docs` — Component Anatomy Documentation

Generates Specs-style documentation pages for any component from the design system. Creates anatomy exhibits with numbered markers pointing to structural parts, a legend with attributes, variant grids, and Do/Don't usage cards.

**Example:**
```
/sumsub-specs-docs Button
```

---

### `/sumsub-screen-annotations` — Scenario Annotations

Adds standardized Scenarios annotation blocks above each screen in a Figma flow. Numbers them in X.Y format and writes concise English descriptions focused on user actions.

**Example:**
```
/sumsub-screen-annotations
```

---

### `/sumsub-mockup` — Mockup Builder

Creates Figma mockups for any dashboard screen. Describe what you need — a table page, detail view, form, modal, empty state — and get a pixel-perfect screen built with design system components.

**Examples:**
```
/sumsub-mockup applicant list with status and date columns
/sumsub-mockup settings page with form and save button
/sumsub-mockup empty state for no search results
```

---

### `/sumsub-design-review` — Design System Audit

Audits Figma mockups for compliance with the Sumsub Dashboard design system. Walks the node tree via Plugin API and reports issues: unbound fills/strokes/spacing, `base/*` tokens instead of `semantic/*`, wrong fonts, wrong libraries.

**Example:**
```
/sumsub-design-review
```

---

## Installation

Installs as an official Claude Code plugin. Run these in Claude Desktop's Code tab:

```bash
/plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
/plugin install sumsub@sumsub-design-skills
```

The plugin bundles the 4 skills + Figma remote MCP server configuration. Update later with `/plugin update sumsub`.

See [INSTALL.md](INSTALL.md) for a full walkthrough including prerequisites and troubleshooting.

## Prerequisites

1. **Claude Desktop** (latest version, for `/plugin` support) — https://claude.ai/download
2. **Figma Desktop** (for authentication and viewing designs) — https://www.figma.com/downloads/
3. Access to Sumsub Figma libraries (Base components, Organisms, Assets)

## Project Structure

```
sumsub-design-skills/                                   # Marketplace root
├── .claude-plugin/
│   └── marketplace.json                                # Marketplace manifest
└── plugins/
    └── sumsub-design-skills/                           # Plugin itself
        ├── .claude-plugin/
        │   └── plugin.json                             # Plugin manifest
        ├── .mcp.json                                   # Figma MCP config (auto-installed)
        ├── skills/
        │   ├── specs-docs/SKILL.md                     # /sumsub:specs-docs
        │   ├── screen-annotations/SKILL.md             # /sumsub:screen-annotations
        │   ├── mockup/
        │   │   ├── SKILL.md                            # /sumsub:mockup
        │   │   └── blocks/                             # helpers.js + block templates
        │   └── design-review/SKILL.md                  # /sumsub:design-review
        └── reference/
            ├── design-system.md                        # Components, variables, tokens
            ├── color-usage.md                          # Semantic color usage
            ├── layout-patterns.md                      # Page layout patterns
            └── BLOCKS.md                               # Figma Blocks system
```

## Updating

When the design system or any skill changes:

1. Edit files in `plugins/sumsub-design-skills/skills/` or `plugins/sumsub-design-skills/reference/`
2. Bump `version` in both `.claude-plugin/marketplace.json` and `plugins/sumsub-design-skills/.claude-plugin/plugin.json`
3. Commit and push
4. Team members run `/plugin update sumsub` in Claude Desktop

## Team

Maintained by the Sumsub UX Team.
