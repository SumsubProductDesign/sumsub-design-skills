# Installation Guide — Sumsub Design Skills

Installs as a Claude Code plugin. Skills + Figma MCP server register in one flow.

> ⚠️ Plugin management (`/plugin …`) works **only in the Claude Code CLI in a terminal**, not in Claude Desktop's Code tab. All install and update commands below go into Terminal.app (macOS) or PowerShell (Windows).

## Contents

- [Part 0 — Prerequisites](#part-0--prerequisites)
- [Part 1 — Install and run Claude Code CLI in a terminal](#part-1--install-and-run-claude-code-cli-in-a-terminal)
  - [1a. Open a terminal](#1a-open-a-terminal)
  - [1b. Install the `claude` CLI](#1b-install-the-claude-cli)
  - [1c. Verify it's installed](#1c-verify-its-installed)
  - [1d. Authenticate on first run](#1d-authenticate-on-first-run)
- [Part 2 — Install the plugin](#part-2--install-the-plugin)
  - [Easy path — from Claude Desktop (recommended)](#easy-path--from-claude-desktop-recommended)
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
  - [`command not found: claude` (macOS / Linux) after installing the CLI](#command-not-found-claude-macos--linux-after-installing-the-cli)
  - [`'claude' is not recognized…` (Windows) after installing the CLI](#claude-is-not-recognized-windows-after-installing-the-cli)
  - [Installer script fails with permission errors](#installer-script-fails-with-permission-errors)
  - [`claude` opens but says "not logged in" when I try `claude plugin …`](#claude-opens-but-says-not-logged-in-when-i-try-claude-plugin-)
  - [`Failed to clone marketplace repository: SSH host key is not in your known_hosts file`](#failed-to-clone-marketplace-repository-ssh-host-key-is-not-in-your-known_hosts-file)
  - [Skills don't appear after install](#skills-dont-appear-after-install)
  - [Figma tools aren't available in Claude](#figma-tools-arent-available-in-claude)
  - [A skill runs but fails with an error](#a-skill-runs-but-fails-with-an-error)
- [Team-wide auto-install (admins)](#team-wide-auto-install-admins)
- [Support](#support)

---

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

then retry the install.

**Windows: add the install directory to your PATH.** The installer puts `claude.exe` in `C:\Users\<you>\.local\bin` but doesn't auto-add that folder to your PATH. Run this once after install:

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.local\bin", "User")
```

Then **close PowerShell completely and open a fresh window** — the new PATH is only picked up by new sessions. Verify with `claude --version`.

(On macOS / Linux the installer updates your shell rc file automatically — only Windows requires this manual PATH step.)

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

Now that `claude` is on your PATH, you can install the plugin. Two paths — pick whichever you prefer.

### Easy path — from Claude Desktop (recommended)

1. Open any chat in Claude Desktop.
2. Paste this prompt:

   ```
   Install the sumsub-design plugin: run
     claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
     claude plugin install sumsub-design@sumsub-design
   via Bash and report the output.
   ```

3. Claude runs both commands via its Bash tool and shows the output. Look for `✔ Successfully added marketplace: sumsub-design` and `✔ Successfully installed plugin: sumsub-design@sumsub-design`.
4. Proceed to [Step 3 — Restart Claude Desktop](#step-3--restart-claude-desktop) below.

If the Bash tool fails (e.g. `claude` not found on PATH), fall back to the Terminal path below.

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

**Easiest way — from Claude Desktop, no terminal:** see [`UPDATE.md`](UPDATE.md) — one sentence in chat, Claude runs the commands for you.

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

This is expected — Claude Desktop's Code tab doesn't support `/plugin` commands directly. There are two paths:

- **For initial install**: use your terminal (see [Part 2 — Install the plugin](#part-2--install-the-plugin)). The two `claude plugin …` commands must be run outside Desktop the first time.
- **For updates after install**: you don't need a terminal at all. See [`UPDATE.md`](UPDATE.md) — paste one sentence into any Claude Desktop chat and Claude runs the commands for you via the Bash tool.

### `command not found: claude` (macOS / Linux) after installing the CLI

The installer adds `claude` to `~/.local/bin`, which may not be on your `PATH`. Fix:

```
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

(If you use bash, replace `.zshrc` with `.bashrc` in both places.)

Then run `claude --version` again. If it still says "not found", reopen the terminal entirely.

### `'claude' is not recognized…` (Windows) after installing the CLI

The installer warned "Native installation exists but `C:\Users\<you>\.local\bin` is not in your PATH" — it doesn't auto-add it on Windows.

**Fix:** in PowerShell, run once:

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.local\bin", "User")
```

Then **close ALL PowerShell windows and open a fresh one**. Verify with `claude --version`.

If the command still fails, add the path via GUI:
1. `Win + R` → type `SystemPropertiesAdvanced` → Enter
2. **Environment Variables** → in the top "User variables" section select `Path` → **Edit**
3. **New** → paste `C:\Users\<your-username>\.local\bin`
4. OK → OK → OK
5. Close all PowerShell windows, open a fresh one, retry `claude --version`

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
