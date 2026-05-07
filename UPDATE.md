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

## 3. Continue working

Claude Code reloads the plugin's SKILL.md on the next tool call automatically — no restart needed. The next time the skill runs, it picks up the new version.

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

Reply `yes` and the skill runs the commands for you. The next tool call picks up the new version automatically.

---

## If something fails

- **"command not found: claude"** — the CLI isn't on your PATH. See `INSTALL.md` section "Part 1" for PATH setup.
- **"Failed to update marketplace"** — check your network, try again. Or run the commands in a regular terminal as a fallback.
- **Version didn't change** — try a fresh chat to force plugin reload, or as a last resort fully quit and relaunch Claude Desktop.
