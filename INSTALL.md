# Installation Guide — Sumsub Design Skills

Installs as a Claude Code plugin. Skills + Figma MCP server register in one flow.

## Prerequisites

1. **Claude Desktop** (latest version) — https://claude.ai/download
2. **Figma Desktop** — https://www.figma.com/downloads/
   - Required: Claude uses your logged-in Figma session to authenticate with the MCP server, and the app needs to be open while you use the skills.
3. A Figma account with access to Sumsub libraries (Base components, Organisms, Assets)

> If `/plugin` commands don't work in Claude Desktop, update the app to the latest version.

---

## Install

In Claude Desktop, open a new chat and run these two commands:

```
/plugin marketplace add SumsubProductDesign/sumsub-design-skills
/plugin install sumsub-design@sumsub-design
```

That's it. The plugin bundles:
- 4 skills (`sumsub-mockup`, `sumsub-specs-docs`, `sumsub-screen-annotations`, `sumsub-design-review`)
- Figma remote MCP server at `https://mcp.figma.com/mcp` — registered automatically

On first use Claude will prompt you to authenticate with Figma (OAuth flow).

---

## Verify

In a new chat, type:

```
/sumsub-design:sumsub-mockup create an applicant list page
```

Claude should start the skill — Figma opens and a mockup appears.

---

## Available commands

| Command | What it does |
|---|---|
| `/sumsub-design:sumsub-mockup [description]` | Creates a mockup in Figma from your description |
| `/sumsub-design:sumsub-specs-docs [component]` | Generates a Specs page with component anatomy |
| `/sumsub-design:sumsub-screen-annotations` | Adds Scenarios annotations above every screen on the current page |
| `/sumsub-design:sumsub-design-review` | Audits a mockup for design system compliance |

---

## Updating

The plugin updates from the marketplace. To pull the latest version:

```
/plugin marketplace update sumsub-design
/plugin update sumsub-design
```

Restart Claude Desktop after updating so new skill files are picked up.

---

## Uninstalling

```
/plugin uninstall sumsub-design
/plugin marketplace remove sumsub-design
```

---

## Team-wide auto-install

To register the marketplace for everyone on a project, add to the project's `.claude/settings.json`:

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

---

## Troubleshooting

### `/plugin` command isn't recognized

Update Claude Desktop to the latest version — the plugin system is only available in recent releases.

### Skills don't appear after install

Run `/reload-plugins` or fully restart Claude Desktop (`⌘ Q` on macOS, Quit from tray on Windows).

### Figma tools aren't available in Claude

1. Make sure Figma Desktop is running and you're logged into the right Figma account
2. Run `/plugin update sumsub-design` to refresh the MCP config
3. Restart Claude Desktop
4. Verify by asking Claude in a new chat: "what MCP tools do you have available?" — the response should include tools prefixed with `figma_`

### A skill runs but fails with an error

Copy the exact error text and send it to the UX team channel (or ping a maintainer).

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
