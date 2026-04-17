# Installation Guide — Sumsub Design Skills

Installs as an official Claude Code plugin. Skills + Figma MCP server — all in one command.

## Prerequisites

1. **Claude Desktop** (latest version) — https://claude.ai/download
2. **Figma Desktop** — https://www.figma.com/downloads/
   - Required: Claude uses your logged-in Figma session to authenticate with the MCP server, and the app needs to be open when you use the skills so Claude can see and edit your files.
3. A Figma account with access to Sumsub libraries

> If the `/plugin` command doesn't work in Claude Desktop, update to the latest version.

---

## Install

In Claude Desktop's Code tab, run these two commands:

```
/plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
/plugin install sumsub@sumsub-design-skills
```

That's it. The plugin bundles:
- 4 skills (mockup, specs-docs, screen-annotations, design-review)
- Figma remote MCP server at `https://mcp.figma.com/mcp`

After install, Claude Desktop will prompt you to authenticate with Figma on first use of any skill.

---

## Verify it works

1. Open a **new chat** in Claude Desktop
2. Type:
   ```
   /sumsub:mockup create an applicant list page
   ```
3. Claude should start the skill — Figma opens and a mockup appears

---

## Available commands

After installation, these 4 commands are available:

| Command | What it does |
|---|---|
| `/sumsub:mockup [description]` | Creates a mockup in Figma from your description |
| `/sumsub:specs-docs [component]` | Generates a Specs page with component anatomy |
| `/sumsub:screen-annotations` | Adds Scenarios annotations above every screen on the current page |
| `/sumsub:design-review` | Audits a mockup for design system compliance |

---

## Updating

When a new plugin version is released, team members update with:

```
/plugin update sumsub
```

Restart Claude Desktop after updating.

---

## Uninstall

```
/plugin uninstall sumsub
```

---

## Troubleshooting

### `/plugin` command isn't recognized

Update Claude Desktop to the latest version. The plugin system is only available in recent releases.

### Skills don't appear after install

Run `/reload-plugins` or restart Claude Desktop fully (`⌘ Q` on macOS, Quit from tray on Windows).

### Figma tools aren't available

1. Check that Figma Desktop is running and you're logged in
2. Run `/plugin update sumsub` to ensure the MCP config is current
3. Restart Claude Desktop

### A skill runs but fails with an error

Copy the exact error text and send it to the UX team channel (or ping a maintainer).

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
