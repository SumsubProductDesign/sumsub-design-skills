# Installation Guide — Sumsub Design Skills

Step-by-step instructions for designers. Total time: 5–10 minutes.

## Prerequisites

1. **Claude Desktop** — https://claude.ai/download
2. A Figma account with access to Sumsub libraries

---

## Step 1. Connect the Figma MCP server

In Claude Desktop, open a new chat and run this command:

```
claude mcp add --transport http figma-remote-mcp https://mcp.figma.com/mcp
```

This registers Figma's hosted MCP server. Claude will ask you to authenticate with your Figma account on first use.

### Verify the MCP connection

In a new chat, ask:
```
what MCP tools do you have available?
```

You should see tools prefixed with `figma_`. If they're missing — rerun the `claude mcp add` command and restart Claude Desktop.

---

## Step 2. Install the design skills

### macOS

1. Download **[install-macos.command](https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/install-macos.command)**:
   - Right-click → **Save Link As…** → save to Downloads
2. Double-click the downloaded file
3. If macOS blocks it: right-click → **Open** → confirm **Open**
4. Terminal opens, runs 3 steps, shows "Done!"
5. Press any key to close

### Windows

1. Download **[install-windows.bat](https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/install-windows.bat)**:
   - Right-click → **Save link as…** → save to Downloads
2. Double-click the downloaded file
3. If SmartScreen blocks it: **More info** → **Run anyway**
4. Console opens, runs 3 steps, shows "Done!"
5. Press any key to close

---

## Step 3. Restart Claude Desktop

For Claude to pick up the new skills, **fully restart the app** (not just close the window).

- **macOS:** `⌘ Q` → reopen
- **Windows:** right-click tray icon → Quit → reopen

---

## Step 4. Verify it works

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

After installation, Claude Desktop supports 4 commands:

| Command | What it does |
|---|---|
| `/sumsub-mockup [description]` | Creates a mockup in Figma from your description |
| `/sumsub-specs-docs [component]` | Generates a Specs page with component anatomy |
| `/sumsub-screen-annotations` | Adds Scenarios annotations above every screen on the current page |
| `/sumsub-design-review` | Audits a mockup for design system compliance |

---

## Updating

When a new version is released — **just run the installer again**. It replaces old skill versions with the latest. Restart Claude Desktop after updating.

---

## Troubleshooting

### Skills aren't recognized

1. Open in your file manager:
   - macOS: `~/.claude/skills/` (in Finder: `⌘⇧G`, paste the path)
   - Windows: `%USERPROFILE%\.claude\skills\`
2. You should see 4 folders: `sumsub-design-review`, `sumsub-mockup`, `sumsub-screen-annotations`, `sumsub-specs-docs`
3. If folders are missing — the installer didn't finish. Run it again and watch the console for errors.

### Figma MCP tools aren't available in Claude

1. Re-run the MCP setup command:
   ```
   claude mcp add --transport http figma-remote-mcp https://mcp.figma.com/mcp
   ```
2. Restart Claude Desktop
3. Make sure you authenticated with your Figma account when prompted

### A skill runs but fails with an error

Copy the exact error text and send it to the UX team channel (or ping a maintainer).

---

## Support

Maintained by the Sumsub UX Team. Issues and questions — GitHub Issues on this repo, or ping maintainers directly.
