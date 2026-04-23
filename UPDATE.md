# Updating the plugin from Claude Desktop

No terminal, no aliases. Just a sentence in chat.

## 1. Open any chat in Claude Desktop

Doesn't matter which project, doesn't need to be the design project.

## 2. Paste this prompt

```
Update the sumsub-design plugin: run
  claude plugin marketplace update sumsub-design
  claude plugin update sumsub-design@sumsub-design
via Bash and report the output.
```

Claude will run both commands via its Bash tool and show you the output.

## 3. Fully quit and reopen Claude Desktop

- **macOS:** `⌘ Q`, then relaunch
- **Windows:** right-click the tray icon → Quit → reopen

This step is required — Claude Desktop only loads the new plugin version on a fresh launch. Closing the window without quitting isn't enough.

## 4. Verify (optional)

Open a new chat and type:

```
claude plugin list
```

Claude runs it via Bash. Look for `sumsub-design@sumsub-design` — the version should be the latest.

---

## Automatic prompts

When you start a new `/sumsub-design:sumsub-mockup` chat, the skill auto-checks for updates. If a newer version is available, it asks:

> ⚠️ sumsub-design plugin update available
> Your local version: **v3.XX.0** · Latest: **v3.YY.0**
>
> I can update it for you right now by running:
> `claude plugin marketplace update sumsub-design`
> `claude plugin update sumsub-design@sumsub-design`
>
> Reply `yes` / `update` to run, or `continue anyway`.

Reply `yes` and the skill runs the commands for you. Then just quit and reopen Desktop.

---

## If something fails

- **"command not found: claude"** — the CLI isn't on your PATH. See `INSTALL.md` section "Part 1" for PATH setup.
- **"Failed to update marketplace"** — check your network, try again. Or run the commands in a regular terminal as a fallback.
- **Version didn't change after restart** — you closed the window but didn't Quit. Really quit (`⌘Q` / tray → Quit) and reopen.
