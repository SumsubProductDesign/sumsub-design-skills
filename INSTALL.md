# Installation Guide — Sumsub Design Skills

Installs as a Claude Code plugin. Skills + Figma MCP server register in one flow. No terminal required — everything runs through the **Claude Code** tab in Claude Desktop.

> **Important:** All steps that say "in Claude" or "in Claude Desktop" mean the **Claude Code tab** — the tab labeled **"Claude Code"** inside Claude Desktop (not a regular chat tab). That's where the Bash tool and `/skill` commands are available.

## Contents

- [Prerequisites](#prerequisites)
- [Part 1 — Install the plugin](#part-1--install-the-plugin)
  - [Easy path — from Claude Code tab](#easy-path--from-claude-code-tab)
  - [Terminal path](#terminal-path)
    - [Step 1 — Add the marketplace](#step-1--add-the-marketplace)
    - [Step 2 — Install the plugin](#step-2--install-the-plugin)
  - [Step 3 — Restart Claude Desktop](#step-3--restart-claude-desktop)
- [Verify](#verify)
- [Available commands](#available-commands)
- [Example prompts](#example-prompts)
- [Updating](#updating) — easiest path: [`UPDATE.md`](UPDATE.md) (no terminal)
  - [Option A — `sumsub-update` one-liner (recommended, after one-time setup)](#option-a--sumsub-update-one-liner-recommended-after-one-time-setup)
  - [Option B — Interactive `/plugin` menu inside the `claude` REPL](#option-b--interactive-plugin-menu-inside-the-claude-repl)
  - [Option C — Manual two commands (no alias, no REPL)](#option-c--manual-two-commands-no-alias-no-repl)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)
  - [`/plugin isn't available in this environment` in Claude Desktop](#plugin-isnt-available-in-this-environment-in-claude-desktop)
  - [Bash tool says `claude: command not found` or `'claude' is not recognized`](#bash-tool-says-claude-command-not-found-or-claude-is-not-recognized)
  - [Skills don't appear after install](#skills-dont-appear-after-install)
  - [Figma tools aren't available in Claude](#figma-tools-arent-available-in-claude)
  - [`Failed to clone marketplace repository: SSH host key is not in your known_hosts file`](#failed-to-clone-marketplace-repository-ssh-host-key-is-not-in-your-known_hosts-file)
  - [A skill runs but fails with an error](#a-skill-runs-but-fails-with-an-error)
- [Team-wide auto-install (admins)](#team-wide-auto-install-admins)
- [Support](#support)

---

## Prerequisites

1. **Claude Desktop** — https://claude.ai/download (download and install like any app). Ships the `claude` CLI bundled for Bash access.
2. **Figma Desktop** — https://www.figma.com/downloads/ (needed for authentication and viewing designs)
3. **Figma account** with access to Sumsub libraries (Base components, Organisms, Assets)

That's it. No separate CLI install needed — the **Claude Code** tab's Bash tool runs the `claude` commands directly.

> **Don't have the `claude` command in Bash?** See [Troubleshooting → `claude` not found](#bash-tool-says-claude-command-not-found-or-claude-is-not-recognized) for a one-time CLI install fallback.

---

## Part 1 — Install the plugin

Two paths — pick whichever you prefer.

### Easy path — from Claude Code tab

1. Open Claude Desktop and switch to the **Claude Code** tab (labeled "Claude Code" at the top — not a regular chat tab).
2. Start a new conversation and paste this prompt:

   ```
   Install the sumsub-design plugin: run
     claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
     claude plugin install sumsub-design@sumsub-design
   via Bash and report the output.
   ```

3. Claude Code runs both commands via its Bash tool and shows the output. Look for `✔ Successfully added marketplace: sumsub-design` and `✔ Successfully installed plugin: sumsub-design@sumsub-design`.
4. Proceed to [Step 3 — Restart Claude Desktop](#step-3--restart-claude-desktop) below.

If the Bash tool fails with `claude: command not found`, see [Troubleshooting → `claude` not found](#bash-tool-says-claude-command-not-found-or-claude-is-not-recognized) for the one-time CLI install, then retry the prompt above.

### Terminal path

Run these **two commands, one at a time**, in a regular terminal (Terminal.app / PowerShell):

#### Step 1 — Add the marketplace

```
claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
```

Wait for `✔ Successfully added marketplace: sumsub-design`.

#### Step 2 — Install the plugin

```
claude plugin install sumsub-design@sumsub-design
```

Wait for `✔ Successfully installed plugin: sumsub-design@sumsub-design`.

### Step 3 — Restart Claude Desktop

Quit and reopen Claude Desktop so it picks up the new skills:
- **macOS:** `⌘ Q` → reopen
- **Windows:** right-click tray icon → Quit → reopen

> After this step, the marketplace also appears in **Claude Desktop → Settings → Customize → Plugins** alongside "Anthropic & Partners". You can enable/disable individual plugins from there if you prefer a GUI. But all install/update still goes through the terminal commands above.

Done. The plugin bundles:
- 4 skills (`sumsub-mockup`, `sumsub-specs-docs`, `sumsub-screen-annotations`, `sumsub-design-review`)
- Figma remote MCP server — registered automatically

On first use Claude Code will prompt you to authenticate with Figma.

---

## Verify

In the **Claude Code** tab, open a new conversation and type:

```
/sumsub-design:sumsub-mockup create an applicant list page
```

Claude Code should start the skill — Figma opens and a mockup appears.

> **Note:** the `/sumsub-design:…` autocomplete may not show up in the dropdown — type the command manually and press Enter.

---

## Available commands

| Command | What it does |
|---|---|
| `/sumsub-design:sumsub-mockup [description]` | Creates a mockup in Figma from your description |
| `/sumsub-design:sumsub-specs-docs [component]` | Generates a Specs page with component anatomy |
| `/sumsub-design:sumsub-screen-annotations` | Adds Scenarios annotations above every screen on the current page |
| `/sumsub-design:sumsub-design-review` | Audits a mockup for design system compliance |

All commands are entered in the **Claude Code** tab.

---

## Example prompts

See [`examples/prompts.md`](examples/prompts.md) for copy-paste-ready prompts covering:

- Building mockups (table pages, detail views, multi-screen flows)
- Asking the skill to put the result in the Sumsub org vs Drafts vs a team
- Running the audit verbatim (and re-running it after a plugin update)
- Fixing audit findings
- Flow Builder / Applicant page–specific recipes
- Reviewing existing mockups
- Common anti-patterns to avoid

Short on time? The most useful one — rerunning the full audit after a plugin update:

```
Update sumsub-design plugin (run sumsub-update in terminal, restart
Desktop), then rerun the sumsub-mockup audit VERBATIM on <frame>
(node <id>, productContext="<table-page|flow-builder|applicant-page>").
Return the raw JSON — don't fix anything, I want the issue list first.
```

---

## Updating

**Easiest way — from the Claude Code tab, no terminal:** see [`UPDATE.md`](UPDATE.md) — one sentence in the Claude Code tab, and Claude Code runs the commands for you.

Below are the other ways (terminal-based) if you prefer them or the Desktop flow fails.

The plugin doesn't auto-update. You need to refresh the marketplace cache and then pull the new version. Three ways to do it — pick one.

> ⚠️ **Claude Desktop's "Check for updates" button is not enough.** It only looks at the locally cached marketplace copy and can show a stale "latest version". You MUST refresh the cache via the terminal first (any of the options below does this). After that, Desktop will show the correct latest version.

### Option A — `sumsub-update` one-liner (recommended, after one-time setup)

This creates an alias in your shell so updating becomes a single command.

**One-time setup:** open a plain terminal (**not** inside `claude` — just Terminal.app or PowerShell with the regular prompt) and paste one of these:

**macOS / Linux (zsh / bash):**
```
echo "alias sumsub-update='claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design && echo \"✅ Updated. Now quit and reopen Claude Desktop.\"'" >> ~/.zshrc && source ~/.zshrc
```

If you use bash instead of zsh, replace `.zshrc` with `.bashrc` in both places.

**Windows (PowerShell):**
```powershell
Add-Content $PROFILE "`nfunction sumsub-update { claude plugin marketplace update sumsub-design; claude plugin update sumsub-design@sumsub-design; Write-Host '✅ Updated. Now quit and reopen Claude Desktop.' }"
. $PROFILE
```

**From now on** — whenever a new version ships — open a plain terminal (again: **not** inside `claude`, just the regular prompt) and type:

```
sumsub-update
```

Then fully quit and reopen Claude Desktop.

### Option B — Interactive `/plugin` menu inside the `claude` REPL

If you prefer a UI-ish flow:

1. Open a plain terminal and launch the Claude Code REPL by typing `claude` and pressing Enter.
2. Once you see the `>` prompt, type:
   ```
   /plugin
   ```
3. Navigate the menu that appears → **Marketplaces** → pick `sumsub-design` → **Update**.
4. Then go back and pick **Installed plugins** → `sumsub-design@sumsub-design` → **Update**.
5. Exit with `/quit` or `Ctrl+C`.
6. Quit and reopen Claude Desktop.

Note: `/plugin` works **only inside the `claude` terminal REPL**, not in the Claude Code tab inside Claude Desktop.

### Option C — Manual two commands (no alias, no REPL)

In a plain terminal:
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

The **Claude Code** tab doesn't support `/plugin` commands directly — use the [Easy path from Part 1](#easy-path--from-claude-code-tab) (for install) or [UPDATE.md](UPDATE.md) (for updates). Both use the Bash tool to run the underlying `claude plugin …` commands without you ever touching a terminal.

### Bash tool says `claude: command not found` or `'claude' is not recognized`

The `claude` CLI isn't on Claude Desktop's Bash PATH. Usually Desktop ships it bundled, but some installations need a one-time CLI install.

**One-time CLI install (pick your OS):**

**macOS / Linux** — open Terminal.app, paste:
```
curl -fsSL https://claude.ai/install.sh | bash
```
The installer adds `claude` to `~/.local/bin` and updates your shell rc file. Close the terminal and reopen Claude Desktop.

**Windows** — open PowerShell, paste:
```
irm https://claude.ai/install.ps1 | iex
```
If you see a policy error, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once and retry.

On Windows the installer often doesn't auto-add to PATH. Run once more in PowerShell:
```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.local\bin", "User")
```

Then **quit Claude Desktop fully and reopen it** so it picks up the new PATH.

**Authenticate once** — in a terminal, run `claude` and sign in via the browser flow. After that return to the Claude Code tab and retry the install prompt.

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
3. Ask Claude Code in a new conversation: "what MCP tools do you have available?" — response should include tools prefixed with `figma_`

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
