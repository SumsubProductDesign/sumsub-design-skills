#!/bin/bash
# sumsub-design — auto-bootstrap installer
# Installs ~/.claude/hooks/sumsub-version-check.sh and registers PreToolUse
# hook in ~/.claude/settings.local.json. Idempotent: safe to re-run.
#
# Called by the mockup skills (Step 0) when the version-check hook is missing.
# Also invokable directly via `/sumsub-design:sumsub-setup` for explicit re-install.

set -e

HOOK_DIR="$HOME/.claude/hooks"
HOOK_FILE="$HOOK_DIR/sumsub-version-check.sh"
SETTINGS_FILE="$HOME/.claude/settings.local.json"

mkdir -p "$HOOK_DIR"

# 1. Write hook script
cat > "$HOOK_FILE" <<'HOOK_SCRIPT'
#!/bin/bash
# sumsub-design version check — auto-installed
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

chmod +x "$HOOK_FILE"

# 2. Register PreToolUse in settings.local.json (idempotent merge, preserves MemPalace etc.)
python3 - <<'PY_SCRIPT'
import json, os
path = os.path.expanduser("~/.claude/settings.local.json")
data = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            data = json.load(f)
    except Exception:
        data = {}
hooks = data.get("hooks", {})
existing = hooks.get("PreToolUse", [])
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
PY_SCRIPT

echo "✅ sumsub-design version-check hook installed at $HOOK_FILE"
echo "   Registered PreToolUse in $SETTINGS_FILE"
echo "   Override on session: SUMSUB_SKIP_VERSION_CHECK=1"
