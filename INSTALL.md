# Installation Guide — Sumsub Design Skills

Installs as a Claude Code plugin. Skills + Figma MCP server register in one flow.

> ⚠️ Plugin management (`/plugin …`) works **only in the Claude Code CLI in a terminal**, not in Claude Desktop's Code tab. All install and update commands below go into Terminal.app (macOS) or PowerShell (Windows).

## Part 0 — Prerequisites

You need three things before the plugin install can work:

1. **Claude Desktop** — https://claude.ai/download (download and install like any app)
2. **Claude Code CLI** (the `claude` terminal command) — see Part 1 below
3. **Figma Desktop** — https://www.figma.com/downloads/ (needed for authentication and viewing designs)

Plus a Figma account with access to Sumsub libraries (Base components, Organisms, Assets).

---

## Part 1 — Install and run Claude Code CLI in a terminal

The `claude` CLI is a separate program from Claude Desktop. Even if Desktop is installed, you usually need to run a one-line installer to get the CLI on your `PATH`. Follow the section for your OS.

### 1a. Open a terminal

- **macOS:** press `⌘ Space`, type **Terminal**, press Enter. (Or launch Terminal.app from Applications → Utilities.)
- **Windows:** press the Windows key, type **PowerShell**, press Enter. Use *PowerShell*, not Command Prompt.

A window with a blinking cursor opens — you type commands there.

### 1b. Install the `claude` CLI

**macOS / Linux** — paste this one line and press Enter:

```
curl -fsSL https://claude.ai/install.sh | bash
```

Wait ~30 seconds for the installer to finish. It adds `claude` to `~/.local/bin` and updates your shell rc file so the command is on `PATH`. Close the terminal window and open a new one so the new `PATH` is picked up.

**Windows (PowerShell)** — paste this one line and press Enter:

```
irm https://claude.ai/install.ps1 | iex
```

If you see a policy error, run this once first:

```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

then retry the install. Close PowerShell and open a fresh window.

### 1c. Verify it's installed

In the fresh terminal window, run:

```
claude --version
```

You should see something like `Claude Code v2.1.66`. If you get `command not found: claude` (or `'claude' is not recognized`), something went wrong — see the "Troubleshooting" section at the bottom.

### 1d. Authenticate on first run

Still in the terminal, run:

```
claude
```

This opens an interactive session. On the very first run it walks you through signing in — usually by opening a browser tab where you click "Authorize". After you approve, return to the terminal — it says you're logged in.

Type `/quit` (or press `Ctrl+C`) to exit the interactive session. You don't need to keep it open for the plugin install.

---

## Part 2 — Install the plugin

Now that `claude` works, run these **two commands, one at a time**, in the same terminal:

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

> After this step, the marketplace also appears in **Claude Desktop → Settings → Customize → Plugins** alongside "Anthropic & Partners". You can enable/disable individual plugins from there if you prefer a GUI. But all install/update still goes through the terminal commands above.

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

Note: `/plugin` works **only inside the `claude` terminal REPL**, not in Claude Desktop's Code tab.

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

This is expected — Claude Desktop's Code tab doesn't support `/plugin` commands. Use your terminal instead (see Part 2 Install). All plugin install/update/uninstall must happen in Terminal.app or PowerShell.

### `command not found: claude` (macOS / Linux) after installing the CLI

The installer adds `claude` to `~/.local/bin`, which may not be on your `PATH`. Fix:

```
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

(If you use bash, replace `.zshrc` with `.bashrc` in both places.)

Then run `claude --version` again. If it still says "not found", reopen the terminal entirely.

### `'claude' is not recognized…` (Windows) after installing the CLI

PowerShell hasn't picked up the new PATH entry. Close ALL PowerShell windows and open a fresh one. If that still fails, check that the install directory (`$env:USERPROFILE\.local\bin` or similar) is in your User PATH via System Settings → Environment Variables.

### Installer script fails with permission errors

**macOS:** you may need to allow the script to run if Gatekeeper blocks it. Re-run the install with:

```
bash -c "$(curl -fsSL https://claude.ai/install.sh)"
```

**Windows:** if `Set-ExecutionPolicy` still blocks, right-click PowerShell → "Run as administrator" and retry.

### `claude` opens but says "not logged in" when I try `claude plugin …`

Run `claude` without arguments first, sign in via the browser flow, then retry the plugin commands.

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
