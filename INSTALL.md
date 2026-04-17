# Installation Guide — Sumsub Design Skills

One command, installs everything: skills + Figma MCP server.

## Prerequisites

1. **Claude Desktop** — https://claude.ai/download
2. **Figma Desktop** — https://www.figma.com/downloads/
   - Required: Claude uses your logged-in Figma session to authenticate with the MCP server, and the app needs to be open when you use the skills.
3. **Node.js** (LTS) — https://nodejs.org
   - Needed to run the one-line installer.
4. A Figma account with access to Sumsub libraries.

---

## Install

In any terminal, run:

```
npx github:SumsubProductDesign/sumsub-design-skills
```

That's it. The installer:
- Copies 4 skills into `~/.claude/skills/sumsub-*`
- Registers the Figma remote MCP server (`https://mcp.figma.com/mcp`) in `~/.claude.json`
- Backs up your previous config to `~/.claude.json.sumsub-backup`

Then **fully restart Claude Desktop**:
- macOS: `⌘ Q` → reopen
- Windows: right-click tray icon → Quit → reopen

---

## Verify it works

1. Open a **new chat** in Claude Desktop
2. Type:
   ```
   /sumsub-mockup create an applicant list page
   ```
3. Claude should start the skill — Figma opens and a mockup appears

> **Note:** the `/sumsub-mockup` hint may not appear in the autocomplete dropdown — that's fine. Just type the command and hit Enter.

If nothing happens, try it without the slash:
```
Use the sumsub-mockup skill to create an applicant list page in Figma
```

---

## Available commands

| Command | What it does |
|---|---|
| `/sumsub-mockup [description]` | Creates a mockup in Figma from your description |
| `/sumsub-specs-docs [component]` | Generates a Specs page with component anatomy |
| `/sumsub-screen-annotations` | Adds Scenarios annotations above every screen on the current page |
| `/sumsub-design-review` | Audits a mockup for design system compliance |

---

## Updating

Re-run the installer any time:

```
npx github:SumsubProductDesign/sumsub-design-skills
```

It replaces old skill versions with the latest. Restart Claude Desktop afterwards.

---

## Troubleshooting

### `npx` not found

Install Node.js LTS from https://nodejs.org. `npx` ships with it.

### Skills aren't recognized

1. Open in your file manager:
   - macOS: `~/.claude/skills/` (in Finder: `⌘⇧G`, paste the path)
   - Windows: `%USERPROFILE%\.claude\skills\`
2. You should see 4 folders: `sumsub-design-review`, `sumsub-mockup`, `sumsub-screen-annotations`, `sumsub-specs-docs`
3. If folders are missing — the installer didn't finish. Re-run and check the console.

### Figma MCP tools aren't available in Claude

1. Make sure Figma Desktop is running and you're logged in
2. Re-run the installer to ensure MCP is registered
3. Fully restart Claude Desktop

### A skill runs but fails with an error

Copy the exact error text and send it to the UX team channel (or ping a maintainer).

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
