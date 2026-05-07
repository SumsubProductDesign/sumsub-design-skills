---
name: sumsub-setup
description: One-time install of user-level hooks for sumsub-design plugin enforcement. Run once per machine to enable structural pre-flight version check. Use when user says /sumsub-setup, "set up sumsub hooks", "install version check enforcement".
---

# sumsub-setup — one-time per-machine install

## What this does

Installs `~/.claude/hooks/sumsub-version-check.py` (cross-platform Python) and registers a PreToolUse hook in `~/.claude/settings.local.json`. The hook:
- Checks local cached plugin version against remote `main` branch on GitHub
- On mismatch → exits 2, blocks the figma tool call, surfaces an update message

This is structural enforcement — the agent literally cannot proceed past `exit 2` regardless of trained SemVer priors or paraphrase tendencies.

Mockup skills (sumsub-mockup, websdk-mockup, sumsub-id-mockup) auto-bootstrap this hook in their Step 0 if missing — so most users never need to run `/sumsub-setup` explicitly. This skill exists for explicit re-install / verbose verification.

The hook is in **Python (cross-platform)** as of v3.110, replacing the bash `.sh` hook from v3.103–v3.109 which silently failed on Windows VMs (no native bash).

## Execution steps

### Step 1 — Run the installer script

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/hooks/install.py"
```

This single command does everything:
- Creates `~/.claude/hooks/`
- Writes `sumsub-version-check.py` and chmods it +x
- Merges PreToolUse entry into `~/.claude/settings.local.json` (preserves existing hooks like MemPalace)
- Cleans up legacy `sumsub-version-check.sh` from v3.103–v3.109 if present

### Step 2 — Verify install

```bash
ls -la "$HOME/.claude/hooks/sumsub-version-check.py"
echo "---"
python3 -c "import json,os; p=os.path.expanduser('~/.claude/settings.local.json'); d=json.load(open(p)); pre=[e for e in d['hooks']['PreToolUse'] if 'sumsub' in json.dumps(e)]; print(json.dumps(pre, indent=2))"
echo "---"
# Sanity test (will block-print to stderr if mismatch, exit 2; or exit 0 silently if match)
python3 "$HOOK_DIR/sumsub-version-check.py" 2>&1; echo "test_exit=$?"
```

### Step 3 — Confirm to user

```
✅ sumsub-design hooks installed.

Перед следующим figma tool call хук проверит локальную версию против remote.
При расхождении — заблокирует tool, покажет сообщение с командами обновления.

Аварийный bypass на сессию: SUMSUB_SKIP_VERSION_CHECK=1
```

If `python3` is not in PATH or any step fails, surface the exact error and ask user to install python3 (any 3.x) then re-run.

## Re-run safety

`install.py` is idempotent:
- Re-writes the hook script (overwrites cleanly)
- Drops any prior `sumsub-version-check` PreToolUse entry before adding the fresh one
- Preserves MemPalace Stop+PreCompact hooks and any other unrelated PreToolUse entries

## Uninstall

There is no `/sumsub-uninstall`. To remove manually:
1. `rm "$HOME/.claude/hooks/sumsub-version-check.py"`
2. Edit `~/.claude/settings.local.json` and remove the PreToolUse entry that references `sumsub-version-check`. Preserve other hooks.
