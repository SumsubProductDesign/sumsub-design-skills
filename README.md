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

One command, installs everything (skills + Figma MCP):

```bash
npx github:SumsubProductDesign/sumsub-design-skills
```

Restart Claude Desktop afterwards. See [INSTALL.md](INSTALL.md) for prerequisites and troubleshooting.

## Prerequisites

1. **Claude Desktop** — https://claude.ai/download
2. **Figma Desktop** — https://www.figma.com/downloads/ (for authentication and viewing designs)
3. **Node.js** (LTS) — https://nodejs.org (to run `npx`)
4. Access to Sumsub Figma libraries (Base components, Organisms, Assets)

## Project Structure

```
sumsub-design-skills/
├── bin/
│   └── install.js              # npx entry point — copies skills + registers MCP
├── package.json                # npm manifest (name, bin, repo)
├── skills/
│   ├── sumsub-mockup/
│   │   ├── SKILL.md            # /sumsub-mockup
│   │   └── blocks/             # helpers.js + block templates
│   ├── sumsub-specs-docs/SKILL.md          # /sumsub-specs-docs
│   ├── sumsub-screen-annotations/SKILL.md  # /sumsub-screen-annotations
│   └── sumsub-design-review/SKILL.md       # /sumsub-design-review
└── reference/
    ├── design-system.md        # Components, variables, tokens
    ├── color-usage.md          # Semantic color usage
    ├── layout-patterns.md      # Page layout patterns
    └── BLOCKS.md               # Figma Blocks system
```

## Updating

When the design system or any skill changes:

1. Edit files in `skills/` or `reference/`
2. Bump `version` in `package.json`
3. Commit and push to `main`
4. Team members re-run `npx github:SumsubProductDesign/sumsub-design-skills` to pull the latest

## Team

Maintained by the Sumsub UX Team.
