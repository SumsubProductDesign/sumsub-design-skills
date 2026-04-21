# Installation Guide — Sumsub Design Skills

Installs as a Claude Code plugin. Skills + Figma MCP server register in one flow.

> ⚠️ Plugin management (`/plugin …`) works **only in the Claude Code CLI in a terminal**, not in Claude Desktop's Code tab. All install and update commands below go into Terminal.app (macOS) or PowerShell (Windows).

## Prerequisites

1. **Claude Desktop** — https://claude.ai/download
2. **Claude Code CLI** — usually installed with Claude Desktop. Verify by opening a terminal and running `claude --version`. If the command isn't found, install Claude Code from https://claude.ai/download.
3. **Figma Desktop** — https://www.figma.com/downloads/ (needed for authentication and viewing designs)
4. A Figma account with access to Sumsub libraries (Base components, Organisms, Assets)

---

## Install

Open a terminal (Terminal.app on macOS, PowerShell on Windows) and run these **two commands, one at a time**:

### Step 1 — Add the marketplace

```
claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
```

Wait for `✔ Successfully added marketplace: sumsub-design`.

### Step 2 — Install the plugin

```
claude plugin install sumsub-design@sumsub-design
```

Wait for `✔ Successfully installed plugin: sumsub-design@sumsub-design`.

### Step 3 — Restart Claude Desktop

Quit and reopen Claude Desktop so it picks up the new skills:
- **macOS:** `⌘ Q` → reopen
- **Windows:** right-click tray icon → Quit → reopen

Done. The plugin bundles:
- 4 skills (`sumsub-mockup`, `sumsub-specs-docs`, `sumsub-screen-annotations`, `sumsub-design-review`)
- Figma remote MCP server — registered automatically

On first use Claude will prompt you to authenticate with Figma.

---

## Verify

In Claude Desktop's Code tab, open a new chat and type:

```
/sumsub-design:sumsub-mockup create an applicant list page
```

Claude should start the skill — Figma opens and a mockup appears.

> **Note:** the `/sumsub-design:…` autocomplete may not show up in the dropdown — type the command manually and press Enter.

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

The plugin doesn't auto-update. You need to refresh the marketplace cache and then pull the new version — two terminal commands.

### One-time setup — add a shell alias

Paste this into your terminal **once** to create a `sumsub-update` command:

**macOS / Linux (zsh / bash):**
```
echo "alias sumsub-update='claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design && echo \"✅ Updated. Now quit and reopen Claude Desktop.\"'" >> ~/.zshrc && source ~/.zshrc
```

(If you use bash instead of zsh, replace `.zshrc` with `.bashrc` in both places.)

**Windows (PowerShell):**
```powershell
Add-Content $PROFILE "`nfunction sumsub-update { claude plugin marketplace update sumsub-design; claude plugin update sumsub-design@sumsub-design; Write-Host '✅ Updated. Now quit and reopen Claude Desktop.' }"
. $PROFILE
```

From now on, updating is one command:

```
sumsub-update
```

Then fully quit and reopen Claude Desktop.

### Without the alias (manual, two commands)

```
claude plugin marketplace update sumsub-design
claude plugin update sumsub-design@sumsub-design
```

Then restart Claude Desktop.

---

## Uninstalling

```
claude plugin uninstall sumsub-design@sumsub-design
claude plugin marketplace remove sumsub-design
```

---

## Troubleshooting

### `/plugin isn't available in this environment` in Claude Desktop

This is expected — Claude Desktop's Code tab doesn't support `/plugin` commands. Use your terminal instead (see Install section). All plugin install/update/uninstall must happen in Terminal.app or PowerShell.

### `command not found: claude` in terminal

Claude Code CLI isn't installed or isn't on your PATH. Install/reinstall Claude Desktop from https://claude.ai/download — it ships with the `claude` CLI.

### `Failed to clone marketplace repository: SSH host key is not in your known_hosts file`

Your git is configured to force SSH (common on macOS with `insteadOf` in `~/.gitconfig`). Two fixes:

**Option A** — the install command above already uses HTTPS, but if it still tries SSH, run:
```
ssh -T git@github.com
```
When asked `Are you sure you want to continue connecting?`, type `yes` and press Enter. The "Permission denied (publickey)" message that follows is expected — it just means the host key is now trusted. Retry Step 1.

### Skills don't appear after install

1. **Fully quit and reopen Claude Desktop** (not just close the window)
2. Check the install:
   ```
   claude plugin list
   ```
   `sumsub-design@sumsub-design` should appear with `✔ enabled`.
3. If listed but skills aren't recognized, reinstall:
   ```
   claude plugin uninstall sumsub-design@sumsub-design
   claude plugin install sumsub-design@sumsub-design
   ```
   Then restart Claude Desktop again.

### Figma tools aren't available in Claude

1. Make sure Figma Desktop is open and you're logged in
2. Run `sumsub-update` (or the manual update commands), restart Claude Desktop
3. Ask Claude in a new chat: "what MCP tools do you have available?" — response should include tools prefixed with `figma_`

### A skill runs but fails with an error

Copy the exact error text and send it to the UX team channel.

---

## Team-wide auto-install (admins)

To register the marketplace automatically for everyone opening a project, add to the project's `.claude/settings.json`:

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

Team members are prompted to install when they open and trust the project folder — no manual commands for install, but updates still need `sumsub-update`.

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
