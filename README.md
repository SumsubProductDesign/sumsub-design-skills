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

Two options — pick whichever fits you.

### Option A — Double-click installer (recommended for designers)

No terminal, no Node.js needed.

**macOS:**

1. Download **[install-macos.command](https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/install-macos.command)** (right-click → "Save Link As…")
2. Double-click the downloaded file
3. If macOS blocks it: right-click the file → **Open** → confirm **Open**

**Windows:**

1. Download **[install-windows.bat](https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/install-windows.bat)** (right-click → "Save link as…")
2. Double-click the downloaded file
3. If Windows SmartScreen blocks it: click **More info** → **Run anyway**

The installer downloads the latest skills from GitHub and puts them in `~/.claude/skills/` (macOS) or `%USERPROFILE%\.claude\skills\` (Windows). Re-run anytime to update.

### Option B — `skills` CLI (if you have Node.js)

Uses the universal [`skills`](https://github.com/vercel-labs/skills) tool, which auto-detects your AI agent and installs to the right place.

```bash
npx skills add SumsubProductDesign/sumsub-design-skills
```

Update later with `npx skills update`, remove with `npx skills remove`.

### After installing (either option)

1. **Restart Claude Desktop** so it reloads the skills
2. Open the **Code** tab
3. Type `/sumsub-mockup` (or `/sumsub-specs-docs`, `/sumsub-screen-annotations`, `/sumsub-design-review`) to use a skill

## Prerequisites

1. **Claude Desktop** installed and running
2. **Figma MCP server** configured in Claude Desktop (Settings → MCP)
3. **Access to Sumsub Figma libraries:**
   - Base components [Dashboard UI Kit]
   - Organisms [Dashboard UI Kit]
   - Assets (icons, flags)

## Project Structure

```
sumsub-design-skills/
├── install-macos.command               # Double-click installer (macOS)
├── install-windows.bat                 # Double-click installer (Windows)
├── skills/
│   ├── sumsub-specs-docs/SKILL.md          # /sumsub-specs-docs
│   ├── sumsub-screen-annotations/SKILL.md  # /sumsub-screen-annotations
│   ├── sumsub-mockup/
│   │   ├── SKILL.md                        # /sumsub-mockup
│   │   └── blocks/                         # helpers.js + block templates
│   └── sumsub-design-review/SKILL.md       # /sumsub-design-review
└── reference/
    ├── design-system.md                # Components, variables, tokens
    ├── color-usage.md                  # Semantic color usage
    ├── layout-patterns.md              # Page layout patterns (1440x900)
    └── BLOCKS.md                       # Figma Blocks system
```

## Updating

When the design system or any skill changes:

1. Edit files in `skills/` or `reference/`
2. Commit and push
3. Team members re-run the installer (double-click) — it replaces old skills with the latest

## Team

Maintained by the Sumsub UX Team.
