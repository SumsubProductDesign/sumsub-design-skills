# Sumsub Design Skills

Claude Code plugin with Figma skills for the Sumsub Product Design team.

## Skills

| Skill | Command | Description |
|---|---|---|
| **Specs Docs** | `/specs-docs [component]` | Generate Specs-style component anatomy documentation in Figma |
| **Screen Annotations** | `/screen-annotations` | Add Scenarios annotation blocks above mockup screens |
| **Table Page** | `/table-page` | Build full dashboard table pages with configured cells |
| **Design Review** | `/design-review` | Audit Figma mockups for design system compliance |

## Installation

```bash
claude /plugin add /path/to/sumsub-design-skills
```

Or from GitHub (after pushing):

```bash
claude /plugin add https://github.com/niceandfun/sumsub-design-skills
```

## Requirements

- [Claude Code](https://claude.com/claude-code) with Figma MCP server configured
- Access to Sumsub Figma libraries (Base components, Organisms)

## Reference Docs

The `reference/` directory contains design system documentation used by the skills:

- **design-system.md** — Component inventory, variables, tokens, text styles
- **color-usage.md** — Semantic color variable usage guide
- **layout-patterns.md** — Standard page layout patterns (1440x900)
- **BLOCKS.md** — Figma Blocks system overview

## For the Team

After installation, use skills as slash commands in Claude Code:

```
> /specs-docs Button
> /screen-annotations
> /table-page
> /design-review
```

Each skill includes complete Figma Plugin API code and design system rules.
