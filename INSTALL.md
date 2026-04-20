# Installation Guide — Sumsub Design Skills

Installs as a Claude Code plugin. Skills + Figma MCP server register in one flow.

## Prerequisites

1. **Claude Desktop** (latest version) — https://claude.ai/download
   - If `/plugin` commands don't work later, update the app first.
2. **Figma Desktop** — https://www.figma.com/downloads/
   - Keep the app open while using the skills — Claude uses your logged-in Figma session to authenticate with the MCP server.
3. A Figma account with access to Sumsub libraries (Base components, Organisms, Assets)

---

## Install

You'll run two commands inside Claude Desktop's **Code** tab, **one at a time**.

### Step 1 — Add the marketplace

Open a new chat in Claude Desktop's Code tab, paste the command below, and press Enter. **Do not paste the second command yet.**

```
/plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
```

Wait for the confirmation:
> ✔ Successfully added marketplace: sumsub-design

### Step 2 — Install the plugin

Now paste this command and press Enter:

```
/plugin install sumsub-design@sumsub-design
```

Wait for:
> ✔ Successfully installed plugin: sumsub-design@sumsub-design

### Step 3 — Restart Claude Desktop

Fully quit and reopen Claude Desktop so it picks up the new skills:
- **macOS:** `⌘ Q` → reopen
- **Windows:** right-click tray icon → Quit → reopen

That's it. The plugin bundles:
- 4 skills (`sumsub-mockup`, `sumsub-specs-docs`, `sumsub-screen-annotations`, `sumsub-design-review`)
- Figma remote MCP server at `https://mcp.figma.com/mcp` — registered automatically

On first use of any skill Claude will prompt you to authenticate with Figma (OAuth flow).

> ⚠️ **Important:** run Step 1 and Step 2 separately. Pasting both lines at once merges them into a single broken command.

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

The plugin updates from the marketplace. Pull the latest version with two commands, **one at a time**:

**Step 1:**
```
/plugin marketplace update sumsub-design
```

**Step 2:**
```
/plugin update sumsub-design
```

Then fully restart Claude Desktop so the new skill files are picked up.

---

## Uninstalling

Run each command separately:

**Step 1:**
```
/plugin uninstall sumsub-design
```

**Step 2:**
```
/plugin marketplace remove sumsub-design
```

---

## Troubleshooting

### `/plugin isn't available in this environment`

The plugin system lives in Claude Desktop's **Code** tab, not the regular chat. Check that:
1. You're in the Code tab (icon `</>` in the left sidebar)
2. Claude Desktop is updated — https://claude.ai/download
3. You opened a **new** chat in the Code tab after updating

### `Failed to clone marketplace repository: SSH host key is not in your known_hosts file`

Your git is configured to force SSH (common on Macs with `insteadOf` rule in `~/.gitconfig`). Two options:

**Option A** — use an explicit HTTPS URL (should already be in the install command above):
```
/plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
```

**Option B** — if option A still fails, add github.com to known_hosts. Open a regular terminal (Terminal.app on macOS, PowerShell on Windows) and run:
```
ssh -T git@github.com
```
When asked `Are you sure you want to continue connecting?`, type `yes` and press Enter. You can ignore the "Permission denied (publickey)" message that follows — it just means the host key is now trusted. Retry Step 1 in Claude Desktop.

### Marketplace name in the error includes `/plugin install ...`

You pasted both commands at once. Claude Code treats the whole text as a single command. Remove the broken marketplace and retry one command at a time:

```
/plugin marketplace remove "sumsub-design-skills /plugin install sumsub-design"
```

Then go back to **Step 1** of the install and paste only the first command.

### Skills don't appear after install

1. Fully restart Claude Desktop (not just close the window)
2. In a new chat run `/plugin list` — the plugin should show `✔ enabled`
3. If listed but skills don't work, try `/reload-plugins`

### Figma tools aren't available in Claude

1. Make sure Figma Desktop is open and you're logged into the right Figma account
2. Run `/plugin update sumsub-design` to refresh the MCP config, then restart Claude Desktop
3. Verify: ask Claude in a new chat "what MCP tools do you have available?" — the response should include tools prefixed with `figma_`

### A skill runs but fails with an error

Copy the exact error text and send it to the UX team channel (or ping a maintainer).

---

## Team-wide auto-install (admins)

To register the marketplace automatically for everyone on a project, add to the project's `.claude/settings.json`:

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

Team members will be prompted to install the plugin when they open and trust the project folder — no manual commands needed.

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
