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

All skills work through the [Figma MCP server](https://github.com/niceandfun/figma-mcp) and use the Sumsub Dashboard design system (Base components, Organisms, semantic variables).

## Available Skills

### `/specs-docs` — Component Anatomy Documentation

Generates Specs-style documentation pages for any component from the design system. Creates anatomy exhibits with numbered markers pointing to structural parts, a legend with attributes, variant grids, and Do/Don't usage cards.

**Example:**
```
/specs-docs Button
```

**What it produces:**
- Anatomy exhibit with the "maximum variant" (all boolean props enabled, largest size)
- Numbered markers aligned to component children
- Legend with dimensions, dependencies, and text styles
- Variant grid showing all sizes and states
- Do/Don't cards for usage guidelines

---

### `/screen-annotations` — Scenario Annotations

Adds standardized Scenarios annotation blocks above each screen in a Figma flow. Describes what the user sees and does on each screen, helping reviewers and developers understand the flow.

**Example:**
```
/screen-annotations
```

**What it does:**
- Analyzes screens on the current page
- Creates annotation instances from the shared component set
- Numbers them in X.Y format (1.1, 1.2, 2.1...)
- Writes concise English descriptions focused on user actions
- Positions annotations 100px above each screen

---

### `/mockup` — Mockup Builder

Creates Figma mockups for any dashboard screen. Describe what you need — a table page, detail view, form, modal, empty state — and get a pixel-perfect screen built with design system components.

**Examples:**
```
/mockup applicant list with status and date columns
/mockup settings page with form and save button
/mockup empty state for no search results
```

**What it produces:**
- 1440x900 frame with Sidebar (257px) and Header (64px)
- Content area with proper padding and layout
- Real design system components (Table Starter, Top Toolbar, Modals, Drawers, etc.)
- Configured cells, filters, tabs, and CTAs matching your description
- All variables bound (no hardcoded hex values)

---

### `/design-review` — Design System Audit

Audits Figma mockups for compliance with the Sumsub Dashboard design system. Walks the node tree via Plugin API and reports issues.

**Example:**
```
/design-review
```

**What it checks:**
- Unbound fills, strokes, spacing, and border radius (hardcoded values)
- `base/*` tokens used instead of `semantic/*`
- Wrong font family (Inter instead of Geist)
- Components from Redesign library instead of Base
- Layout pattern violations (title outside Header, missing Toolbar)

**What it skips:**
- Cover/Overview frames (decorative)
- Task context instances (internal tooling)
- Children inside component instances (managed by component)

---

## Installation

Two steps — first add the marketplace, then install the plugin from it.

### From GitHub

```bash
/plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
/plugin install sumsub-design-skills@sumsub-design-skills
```

### From local path

```bash
/plugin marketplace add /path/to/sumsub-design-skills
/plugin install sumsub-design-skills@sumsub-design-skills
```

> Run the commands inside Claude Code (not in a regular terminal).
> After the first install, use `/plugin update sumsub-design-skills` to get new versions.

## Prerequisites

1. **Claude Code** installed and running
2. **Figma MCP server** configured in Claude Code settings
3. **Access to Sumsub Figma libraries:**
   - Base components [Dashboard UI Kit]
   - Organisms [Dashboard UI Kit]
   - Assets (icons, flags)

## Project Structure

```
sumsub-design-skills/
├── plugin.json                         # Plugin manifest
├── skills/
│   ├── specs-documentation/SKILL.md    # /specs-docs
│   ├── screen-annotations/SKILL.md     # /screen-annotations
│   ├── mockup/SKILL.md                 # /mockup
│   └── design-review/SKILL.md         # /design-review
└── reference/
    ├── design-system.md                # Components, variables, tokens (100+ components, 570 variables)
    ├── color-usage.md                  # Semantic color usage guide
    ├── layout-patterns.md              # Page layout patterns (1440x900)
    └── BLOCKS.md                       # Figma Blocks system
```

### Skills vs Reference

- **`skills/`** — actionable instructions. Each SKILL.md contains a complete workflow: when to use, parameters, Figma Plugin API code, gotchas, and checklists.
- **`reference/`** — design system data. Component keys, variable keys, hex values, layout dimensions. Skills read from these docs when they need specific keys or tokens.

## How Skills Work

Each skill is a SKILL.md file with YAML frontmatter:

```yaml
---
name: design-review
description: "Audit Figma mockups for design system compliance"
---
```

When you type `/design-review` in Claude Code, it loads the SKILL.md as context and follows its instructions. The skill uses the Figma MCP server (`mcp__figma__use_figma`) to run Plugin API code directly in Figma.

## Updating

When the design system changes (new components, renamed tokens, new libraries):

1. Update the relevant files in `reference/`
2. Update affected SKILL.md files if workflows changed
3. Bump `version` in `plugin.json` (required for cache invalidation)
4. Commit and push — team members run `/plugin update sumsub-design-skills` to get updates

## Team

Maintained by the Sumsub UX Team (14 product designers).
