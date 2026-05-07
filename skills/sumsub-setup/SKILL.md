---
name: sumsub-setup
description: One-time install of user-level hooks for sumsub-design plugin enforcement. Run once per machine to enable structural pre-flight version check. Use when user says /sumsub-setup, "set up sumsub hooks", "install version check enforcement".
---

# sumsub-setup — one-time per-machine install

## What this does

Installs a PreToolUse hook in `~/.claude/settings.local.json` that runs `~/.claude/hooks/sumsub-version-check.sh` before every Figma-related tool call. The hook:
- Compares the locally-cached plugin version against remote main branch on GitHub
- If mismatch — exits 2, blocks the tool, surfaces a message asking the user to update or skip

This is structural enforcement — the agent literally cannot proceed past `exit 2` regardless of trained SemVer priors. Required because text-rule pre-flight in SKILL.md alone is bypassed by trained heuristics.

Plugin-level `hooks/hooks.json` exists in this plugin but is NOT honored as PreToolUse blocks by Claude Code's harness (verified live 2026-05-07). Hence this user-level install path.

## Execution steps (perform in order)

### Step 1 — Determine the user's home directory

```bash
echo "$HOME"
```

Save the result for path interpolation.

### Step 2 — Create `~/.claude/hooks/` directory

```bash
mkdir -p "$HOME/.claude/hooks"
```

### Step 3 — Write the hook script to `~/.claude/hooks/sumsub-version-check.sh`

Use Bash with a heredoc to write this exact content:

```bash
cat > "$HOME/.claude/hooks/sumsub-version-check.sh" <<'HOOK_SCRIPT'
#!/bin/bash
# sumsub-design version check — auto-installed by /sumsub-setup
# Override: SUMSUB_SKIP_VERSION_CHECK=1

if [ "$SUMSUB_SKIP_VERSION_CHECK" = "1" ]; then
  exit 0
fi

CACHE_BASE="$HOME/.claude/plugins/cache/sumsub-design/sumsub-design"
if [ ! -d "$CACHE_BASE" ]; then
  exit 0
fi

LATEST_DIR=$(ls -1 "$CACHE_BASE" 2>/dev/null | sort -V | tail -1)
if [ -z "$LATEST_DIR" ]; then
  exit 0
fi

LOCAL_FILE="$CACHE_BASE/$LATEST_DIR/.claude-plugin/plugin.json"
if [ ! -f "$LOCAL_FILE" ]; then
  exit 0
fi

LOCAL=$(grep '"version"' "$LOCAL_FILE" | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
if [ -z "$LOCAL" ]; then
  exit 0
fi

REMOTE_RAW=$(curl -s --max-time 5 "https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json" 2>/dev/null)
if [ -z "$REMOTE_RAW" ]; then
  echo "⚠️ sumsub-design: не удалось проверить remote версию (нет сети?). Продолжаю с local v$LOCAL." >&2
  exit 0
fi

REMOTE=$(echo "$REMOTE_RAW" | grep '"version"' | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
if [ -z "$REMOTE" ]; then
  exit 0
fi

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

cat >&2 <<EOF
⚠️ sumsub-design plugin update available

Твоя версия: v${LOCAL} · Последняя: v${REMOTE}

Новые версии чинят реальные баги — каждый релиз добавляет аудит-проверки, которые ловят молчаливые фейлы в макетах.

Я могу обновить прямо сейчас двумя командами:

  claude plugin marketplace update sumsub-design
  claude plugin update sumsub-design@sumsub-design

Ответь:
  • yes / update      — обновлю, ты просто продолжаешь работать (без перезапуска)
  • continue anyway   — работаем на текущей версии (зафиксируется на сессию)

Этот Figma tool call заблокирован до твоего ответа. Чтобы продолжить на текущей версии без обновления — установи SUMSUB_SKIP_VERSION_CHECK=1 в окружении.

Changelog: https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/CHANGELOG.md
EOF

exit 2
HOOK_SCRIPT

chmod +x "$HOME/.claude/hooks/sumsub-version-check.sh"
```

### Step 4 — Register PreToolUse hook in `~/.claude/settings.local.json`

Settings file may or may not exist; may have other hooks already (MemPalace etc). Use Python to merge safely:

```bash
python3 <<'PY_SCRIPT'
import json, os
path = os.path.expanduser("~/.claude/settings.local.json")
data = {}
if os.path.exists(path):
    with open(path) as f:
        data = json.load(f)
hooks = data.get("hooks", {})
existing = hooks.get("PreToolUse", [])
# Drop any prior sumsub entries (idempotent install)
existing = [e for e in existing if "sumsub-version-check" not in str(e)]
existing.append({
    "matcher": "mcp__figma__use_figma|mcp__figma__create_new_file|mcp__figma__generate_figma_design",
    "hooks": [{
        "type": "command",
        "command": os.path.expanduser("~/.claude/hooks/sumsub-version-check.sh"),
        "timeout": 10
    }]
})
hooks["PreToolUse"] = existing
data["hooks"] = hooks
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
print(f"✅ PreToolUse hook registered in {path}")
PY_SCRIPT
```

### Step 5 — Verify install

```bash
ls -la "$HOME/.claude/hooks/sumsub-version-check.sh"
echo "---"
grep -A 12 '"PreToolUse"' "$HOME/.claude/settings.local.json"
echo "---"
# Sanity test (will show mismatch if user is on older version)
bash "$HOME/.claude/hooks/sumsub-version-check.sh"; echo "test_exit=$?"
```

### Step 6 — Confirm to user

Tell user (verbatim):

```
✅ sumsub-design hooks installed.

Перед следующим figma tool call хук проверит локальную версию против remote.
При расхождении — заблокирует tool, покажет сообщение, попросит yes/update или continue anyway.

Чтобы аварийно отключить на сессию: SUMSUB_SKIP_VERSION_CHECK=1
```

If `claude` CLI is not in PATH or any step fails, surface the exact error and ask user to run failing command manually.

## Re-run safety

The script writer in step 3 overwrites the file — safe to re-run.
The Python in step 4 drops any prior `sumsub-version-check` PreToolUse entry before adding the fresh one — idempotent.
MemPalace Stop+PreCompact hooks (if present in settings.local.json) are preserved untouched.

## Uninstall

There is no `/sumsub-uninstall`. To remove manually:
1. `rm ~/.claude/hooks/sumsub-version-check.sh`
2. Edit `~/.claude/settings.local.json` and remove the PreToolUse entry that references `sumsub-version-check.sh`. Preserve other hooks.
