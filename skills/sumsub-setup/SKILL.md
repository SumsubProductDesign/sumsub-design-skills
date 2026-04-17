---
name: sumsub-setup
description: One-time setup for sumsub-* skills. Registers the Figma remote MCP server in ~/.claude.json. Run this once after installing via `npx skills add` or any method that installs skills only. Idempotent — safe to re-run.
---

# Sumsub Setup

Registers Figma's hosted MCP server in the user's Claude config so all other `sumsub-*` skills can call Figma tools.

## What to do

1. Read the file at `~/.claude.json`. If it doesn't exist, treat as `{}`.
2. Parse it as JSON. If it fails to parse, STOP and tell the user the file is corrupted — don't overwrite.
3. If `mcpServers` key doesn't exist, add it as `{}`.
4. Check whether `mcpServers.figma` already equals `{"type": "http", "url": "https://mcp.figma.com/mcp"}`.
   - If yes → tell the user "Figma MCP is already registered, no changes needed" and stop.
   - If no → proceed.
5. Before writing, create a backup: copy `~/.claude.json` to `~/.claude.json.sumsub-backup`.
6. Set `mcpServers.figma = {"type": "http", "url": "https://mcp.figma.com/mcp"}`. Preserve every other key in the file.
7. Write the JSON back with 2-space indentation.

## What to tell the user after

Exactly this:

> Done! I've registered the Figma MCP server at `https://mcp.figma.com/mcp`.
>
> **You must fully restart Claude Desktop** for the change to take effect:
> - macOS: `⌘ Q` then reopen
> - Windows: right-click tray icon → Quit → reopen
>
> After restart, the `sumsub-mockup`, `sumsub-specs-docs`, `sumsub-screen-annotations`, and `sumsub-design-review` skills will be able to talk to Figma.
>
> A backup of your previous config was saved to `~/.claude.json.sumsub-backup`.

## Gotchas

- Never overwrite the whole `~/.claude.json` — only touch the `mcpServers.figma` entry. Other keys (`projects`, `oauthAccount`, `numStartups`, etc.) contain important state.
- Always back up before writing.
- If the Bash `Read`/`Write` tools don't have access to `~/.claude.json`, use the Bash tool with Python instead:
  ```bash
  python3 - <<'PY'
  import json, os, shutil
  p = os.path.expanduser("~/.claude.json")
  if os.path.exists(p):
      shutil.copy(p, p + ".sumsub-backup")
      with open(p) as f: data = json.load(f)
  else:
      data = {}
  data.setdefault("mcpServers", {})["figma"] = {"type": "http", "url": "https://mcp.figma.com/mcp"}
  with open(p, "w") as f: json.dump(data, f, indent=2)
  print("Figma MCP registered")
  PY
  ```
