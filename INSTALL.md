# Installation Guide — Sumsub Design Skills

Two parts:

1. **Install the Claude Code CLI** (`claude` command on your PATH) — the runtime that loads all skills.
2. **Install the sumsub-design plugin** via the CLI (one marketplace + one plugin command).

You need to do **Part 1 once per machine**. After that, every plugin install/update goes through the `claude` command.

> **About Claude Desktop vs Claude Code CLI:** Claude Desktop ships with a built-in **"Claude Code" tab** that wraps the same CLI. Once `claude` is on your shell's PATH, the Bash tool inside that tab can run `claude plugin …` commands directly. If you skip Part 1, the Bash tool will fail with `claude: command not found` — that's the most common install blocker.

## Contents

- [Part 1 — Install the Claude Code CLI](#part-1--install-the-claude-code-cli)
  - [macOS / Linux — native installer](#macos--linux--native-installer)
  - [Windows — native installer](#windows--native-installer)
  - [Alternatives if the native installer is blocked](#alternatives-if-the-native-installer-is-blocked)
  - [Verify CLI is on your PATH](#verify-cli-is-on-your-path)
- [Part 2 — Install the sumsub-design plugin](#part-2--install-the-sumsub-design-plugin)
  - [Step 1 — Add the marketplace](#step-1--add-the-marketplace)
  - [Step 2 — Install the plugin](#step-2--install-the-plugin)
  - [Step 3 — Restart Claude Desktop](#step-3--restart-claude-desktop)
- [Verify the plugin works](#verify-the-plugin-works)
- [Available commands](#available-commands)
- [Example prompts](#example-prompts)
- [Updating](#updating)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)
- [Team-wide auto-install (admins)](#team-wide-auto-install-admins)
- [Support](#support)

---

## Part 1 — Install the Claude Code CLI

### macOS / Linux — native installer

Open `Terminal.app` and run:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

The installer puts `claude` at `~/.local/bin/claude` and adds that directory to your shell rc file (`~/.zshrc` on macOS, `~/.bashrc` on most Linux distros).

Close and reopen the terminal, then verify:

```bash
claude --version
```

If `command not found` — see [Troubleshooting → `command not found: claude`](#command-not-found-claude-after-installation).

### Windows — native installer

Open **PowerShell** (not CMD, not Windows PowerShell x86) and run:

```powershell
irm https://claude.ai/install.ps1 | iex
```

If a policy error appears, run once and retry:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

The installer puts `claude.exe` at `%USERPROFILE%\.local\bin\`. PATH usually updates automatically; if not, add it manually:

```powershell
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
[Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
```

Restart your terminal and verify:

```powershell
claude --version
```

### Alternatives if the native installer is blocked

Corporate Macs and managed environments often block `curl | bash`. Pick the alternative that works for your environment:

**Homebrew (macOS):**

```bash
brew install --cask claude-code
```

**WinGet (Windows):**

```powershell
winget install Anthropic.ClaudeCode
```

**npm (any OS, requires Node 18+):**

```bash
npm install -g @anthropic-ai/claude-code
```

**Manual binary download:** grab the latest release from https://github.com/anthropics/claude-code/releases and place it at `~/.local/bin/claude` (macOS/Linux) or `%USERPROFILE%\.local\bin\claude.exe` (Windows). Make it executable with `chmod +x` on macOS/Linux.

**Claude Desktop menu (macOS):** in the top menu bar, **Claude → Install "claude" command line tool**. This creates a symlink at `/usr/local/bin/claude` pointing into the bundled CLI inside Claude.app. Convenient if you already have Claude Desktop and don't want to download anything else.

### Verify CLI is on your PATH

After install, in a fresh terminal:

```bash
claude --version
```

If you see a version number — you're done with Part 1. Move to Part 2.

If you see `command not found` → the binary installed but the directory isn't on your PATH. See [Troubleshooting → `command not found: claude`](#command-not-found-claude-after-installation).

---

## Part 2 — Install the sumsub-design plugin

You can run these commands in any terminal where `claude --version` works — that's regular `Terminal.app` / `PowerShell`, **or** the Bash tool inside the **Claude Code** tab in Claude Desktop.

### Step 1 — Add the marketplace

```bash
claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
```

Wait for `✔ Successfully added marketplace: sumsub-design`.

### Step 2 — Install the plugin

```bash
claude plugin install sumsub-design@sumsub-design
```

Wait for `✔ Successfully installed plugin: sumsub-design@sumsub-design`.

### Step 3 — Restart Claude Desktop

Quit and reopen Claude Desktop so it picks up the new skills:

- **macOS:** `⌘ Q` → reopen
- **Windows:** right-click tray icon → Quit → reopen

> After this step, the marketplace also appears in **Claude Desktop → Settings → Customize → Plugins** alongside "Anthropic & Partners". You can enable/disable individual plugins from there. All install/update still goes through the CLI commands above.

The plugin bundles **8 skills**:

- `sumsub-mockup` — Dashboard mockups (table pages, detail pages, drawers, modals)
- `websdk-mockup` — WebSDK flow screens (Welcome, Document Type, Camera, Liveness, etc.)
- `sumsub-id-mockup` — Sumsub ID Account / Connect / Reusable KYC
- `sumsub-component` — Build a Figma component from a contract
- `sumsub-local-component` — Build a Figma component locally inside an existing mockup file
- `sumsub-specs-docs` — Generate Specs documentation pages with anatomy + Do/Don't cards
- `sumsub-screen-annotations` — Add Scenarios annotations above mockup screens
- `sumsub-design-review` — Audit a mockup for design system compliance

Plus the **Figma remote MCP server** (`https://mcp.figma.com/mcp`), registered automatically via the plugin's `.mcp.json`. It still needs a one-time **authentication**:

1. In Claude Code type `/mcp` → select `figma` → **Authenticate**.
2. A browser opens on Figma — sign in via Sumsub SSO → **Approve**.

Requirements on the Figma side (most common failure causes):
- You need a **full seat** in the Sumsub Figma organization — a Viewer seat gets an OAuth denial.
- On an SSO/Enterprise org the Claude integration may show **"admin approval required"** — ask the Figma org admin (Kostya) to approve the app; nothing on the Claude side fixes this.

> The remote server does NOT require Figma Desktop to be running — it works entirely over OAuth.

---

## Verify the plugin works

In the **Claude Code** tab in Claude Desktop, open a new conversation and type:

```
/sumsub-design:sumsub-mockup create an applicant list page
```

Claude Code should pick up the skill, ask where to create the mockup, and start building once you answer.

> **Note:** the `/sumsub-design:…` autocomplete may not appear in the dropdown — type the command manually and press Enter.

---

## Available commands

| Command | What it does |
|---|---|
| `/sumsub-design:sumsub-mockup [description]` | Build a Dashboard mockup in Figma |
| `/sumsub-design:websdk-mockup [description]` | Build WebSDK flow screens in Figma |
| `/sumsub-design:sumsub-id-mockup [description]` | Build Sumsub ID Account / Connect / Reusable KYC mockups |
| `/sumsub-design:sumsub-component [contract]` | Build a Figma component from a structured contract |
| `/sumsub-design:sumsub-local-component [description]` | Build a Figma component locally in an existing file |
| `/sumsub-design:sumsub-specs-docs [component]` | Generate a Specs page with component anatomy |
| `/sumsub-design:sumsub-screen-annotations` | Add Scenarios annotations above every screen on the current page |
| `/sumsub-design:sumsub-design-review` | Audit a mockup for design system compliance |

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

The plugin doesn't auto-update. You need to refresh the marketplace cache and pull the new version. Three ways to do it — pick one.

> ⚠️ **Claude Desktop's "Check for updates" button is not enough.** It only looks at the locally cached marketplace copy and can show a stale "latest version". You MUST refresh the cache via the terminal first (any of the options below does this). After that, Desktop will show the correct latest version.

### Option A — `sumsub-update` one-liner (recommended, after one-time setup)

This creates an alias in your shell so updating becomes a single command.

**One-time setup:** open a plain terminal (**not** inside `claude` — just Terminal.app or PowerShell with the regular prompt) and paste one of these:

**macOS / Linux (zsh / bash):**
```bash
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
```bash
claude plugin marketplace update sumsub-design
claude plugin update sumsub-design@sumsub-design
```

Then restart Claude Desktop.

---

## Uninstalling

```bash
claude plugin uninstall sumsub-design@sumsub-design
claude plugin marketplace remove sumsub-design
```

---

## Troubleshooting

> **Official Claude Code troubleshooting guide:** https://code.claude.com/docs/en/troubleshoot-install — covers all CLI install errors (PATH, TLS, proxies, regional blocks, npm/WSL issues, OAuth). Check there first for any error not listed below.

### `command not found: claude` after installation

The CLI installed but your shell can't find it. The directory `~/.local/bin/` (macOS/Linux) or `%USERPROFILE%\.local\bin\` (Windows) isn't on your PATH.

**macOS / Linux — verify and fix PATH:**

Check if the install directory is on your PATH:
```bash
echo $PATH | tr ':' '\n' | grep -Fx "$HOME/.local/bin"
```

If empty, add it. For zsh (default on macOS):
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For bash:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

For fish:
```fish
fish_add_path "$HOME/.local/bin"
```

Then verify: `claude --version`.

**Windows PowerShell — verify and fix PATH:**

```powershell
$env:PATH -split ';' | Select-String '\.local\\bin'
```

If empty:
```powershell
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
[Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
```

Restart the terminal, then verify: `claude --version`.

**Windows CMD:**

```batch
echo %PATH% | findstr /i "local\bin"
```

If empty, open System Settings → Environment Variables and add `%USERPROFILE%\.local\bin` to your User PATH. Restart the terminal.

**After fixing PATH:** fully quit and reopen Claude Desktop (`⌘Q` on macOS, tray icon → Quit on Windows) so its Bash tool picks up the new PATH.

### Multiple `claude` binaries in PATH (version mismatch)

If `claude --version` shows an old version after update, you may have multiple installs colliding. List them:

```bash
which -a claude       # macOS / Linux
```

```powershell
where.exe claude      # Windows PowerShell
```

Common culprits:

- `~/.local/bin/claude` — native installer (recommended)
- `~/.claude/local/` — legacy local npm install from older Claude Code versions
- `npm -g ls @anthropic-ai/claude-code` — npm global install
- `/opt/homebrew/bin/claude` or `/usr/local/bin/claude` — Homebrew

Keep the native install at `~/.local/bin/claude` (or `%USERPROFILE%\.local\bin\claude.exe` on Windows). Remove the rest:

```bash
# Remove npm global install
npm uninstall -g @anthropic-ai/claude-code

# Remove legacy local npm install
rm -rf ~/.claude/local

# Remove Homebrew install (macOS)
brew uninstall --cask claude-code
```

### Install script returns HTML instead of a shell script

If `curl | bash` fails with `bash: line 1: syntax error near unexpected token '<'` or `<!DOCTYPE html>`, the install URL returned an HTML page. Possible causes:

- **Regional block:** if the HTML says "App unavailable in region", Claude Code isn't available in your country. See [supported countries](https://www.anthropic.com/supported-countries).
- **Temporary disruption:** retry after a few minutes, or use an [alternative installer](#alternatives-if-the-native-installer-is-blocked) (Homebrew / WinGet / npm).

### TLS / SSL / proxy errors during install

If you see `TLS connect error`, `unable to get local issuer certificate`, or `Could not establish trust relationship for the SSL/TLS secure channel`:

**Behind a corporate proxy:**
```bash
export HTTPS_PROXY=http://proxy.example.com:8080
export HTTP_PROXY=http://proxy.example.com:8080
curl -fsSL https://claude.ai/install.sh | bash
```

**Corporate CA bundle (TLS inspection proxies):**
```bash
curl --cacert /path/to/corporate-ca.pem -fsSL https://claude.ai/install.sh | bash
# Then for Claude Code itself:
export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem
```

Ask your IT team for the proxy URL and CA bundle path.

For more cases (TLS 1.2 enforcement on Windows, certificate revocation block, etc.), see https://code.claude.com/docs/en/troubleshoot-install#tls-or-ssl-connection-errors.

### `/plugin isn't available in this environment` in Claude Desktop

`/plugin` works only inside the `claude` REPL (run `claude` in a plain terminal). Inside the Claude Code tab in Claude Desktop, use the Bash tool to run `claude plugin …` commands directly — same commands, different invocation surface.

### `Failed to clone marketplace repository: SSH host key is not in your known_hosts file`

Your git is configured to force SSH (common on macOS with `insteadOf` in `~/.gitconfig`). Trust GitHub's host key once:

```bash
ssh -T git@github.com
```

When asked `Are you sure you want to continue connecting?`, type `yes` and press Enter. The "Permission denied (publickey)" message that follows is expected — it just means the host key is now trusted. Retry the marketplace add command.

### Skills don't appear after install

1. **Fully quit and reopen Claude Desktop** (not just close the window — `⌘Q` on macOS).
2. Confirm install:
   ```bash
   claude plugin list
   ```
   `sumsub-design@sumsub-design` should appear with `✔ enabled`.
3. If listed but skills aren't recognized, reinstall:
   ```bash
   claude plugin uninstall sumsub-design@sumsub-design
   claude plugin install sumsub-design@sumsub-design
   ```
   Then restart Claude Desktop again.

### Figma tools aren't available in Claude

The plugin uses the **remote** Figma MCP server (`https://mcp.figma.com/mcp`) — Figma Desktop does NOT need to be running. Check in this order:

1. **Is the server registered?** In a terminal: `claude mcp list` — `figma → https://mcp.figma.com/mcp` should be listed. If missing, register it manually:
   ```bash
   claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp
   ```
2. **Are you authenticated?** In Claude Code: `/mcp` → `figma` → **Authenticate** → browser → Sumsub SSO → **Approve**. This is the most common cause — the server is registered but OAuth never ran.
3. **Did Figma refuse the login?** "Access denied" / "admin approval required" on the Figma consent screen = your Figma **seat** or the org's app approval, not Claude. You need a full (non-Viewer) seat, and the Claude integration must be approved by the Figma org admin — ask Kostya.
4. **Verify tools:** in a new Claude Code conversation ask "what MCP tools do you have available?" — the list should include tools prefixed with `mcp__figma__` (e.g. `mcp__figma__get_metadata`, `mcp__figma__use_figma`).

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

Team members are prompted to install when they open and trust the project folder — no manual marketplace add command, but each member still needs **Part 1 (CLI install)** done on their machine, and updates still need `sumsub-update`.

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
