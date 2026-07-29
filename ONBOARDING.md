# Onboarding — Sumsub Design Skills + Claude

Complete setup from scratch for a new designer: Claude CLI → the skills plugin → Figma MCP → verification. Time: ~15 minutes.

> **The number one rule of this whole guide:** `claude …` commands are run in **Terminal.app**, not in the Claude chat and not in the Code tab. The chat runs in a sandbox without your PATH — you can't install or update anything from there.

---

## Part 1 — Claude Code CLI (one time)

Open **Terminal.app** (`Cmd+Space` → "Terminal").

**1.1. Check whether it's already installed:**
```bash
claude --version
```
If it prints a version → jump straight to Part 2.

**1.2. Install:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```
Close the terminal completely, open it again, and check `claude --version`.

**1.3. If you get `command not found`** — the install directory didn't make it into PATH:
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
claude --version
```

**1.4. If the curl installer is blocked** (corporate Mac) — alternatives:
```bash
brew install --cask claude-code            # if you have Homebrew
npm install -g @anthropic-ai/claude-code   # if you have Node 18+
```
or use the **Claude → Install "claude" command line tool** menu in Claude Desktop.

Full troubleshooting: [INSTALL.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/INSTALL.md).

---

## Part 2 — The sumsub-design plugin (one time)

```bash
claude plugin marketplace add https://github.com/SumsubProductDesign/sumsub-design-skills
claude plugin install sumsub-design@sumsub-design
claude plugin list
```
`sumsub-design` should appear in the list with a recent version.

Then **fully restart Claude Desktop** (`Cmd+Q` → open it again).

---

## Part 3 — Updating the plugin (regularly)

New versions ship often. When you're asked to update (or a skill starts acting weird):

```bash
claude plugin marketplace update sumsub-design
claude plugin update sumsub-design@sumsub-design
claude plugin list
```
then restart Claude Desktop (`Cmd+Q`).

⚠️ **The "Check for updates" button in Claude Desktop does NOT update the plugin** — it looks at the local cache and shows a stale version. Only the commands above work.

---

## Part 4 — Figma MCP (one time)

**4.1. Add the server:**
```bash
claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp
```

**4.2. Authenticate:** open Claude Code (the Code tab or `claude` in the terminal), type `/mcp` → select `figma` → **Authenticate** → sign in to Figma in the browser via Sumsub SSO → **Approve**.

**4.3. If authentication keeps failing** — it's almost always Figma access, not Claude:
- You need a **full seat** in the Sumsub organization (OAuth will refuse on a Viewer seat).
- If you see "admin approval required" — the Claude integration must be approved by a **Figma org admin**. Message Kostya.

---

## Part 5 — Verify everything works

1. `claude plugin list` → `sumsub-design` at a recent version.
2. In a fresh Claude Code session, ask: `Build a WebSDK Welcome screen in file <URL of your test file>`.
3. The skill should: ask for / use the right file, build a **Desktop + Mobile pair**, place it in the `… (made by Claude)` section on the **🛠 Drafts** page (creating it if it doesn't exist), and hand you a link at the end.

---

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| "no claude CLI / npm / node in the shell" in Claude's reply | Commands were run in the chat (sandbox) | Run them in Terminal.app — Part 1/3 |
| `command not found: claude` in the terminal | CLI not installed or not in PATH | Part 1.2–1.4 |
| "Check for updates" shows an old version | It looks at the local cache | Commands from Part 3 |
| Figma MCP "refuses to authenticate" | Figma seat/SSO issue, not Claude | Part 4.3 |
| Skill ignores the rules after an update | Claude Desktop wasn't restarted | `Cmd+Q` → open it again |
| Editing files inside `~/Library/Application Support/Claude/local-agent-mode-sessions/…` | Cowork hack, gets overwritten by the server | Never do this — only the official path above |

---

## Links

- Installation (full, incl. Windows): [INSTALL.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/INSTALL.md)
- Updating: [UPDATE.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/UPDATE.md)
- What's new per version: [CHANGELOG.md](https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/CHANGELOG.md)
- Questions: Kostya (@kanstantsin.ruskikh)
