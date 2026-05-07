#!/bin/bash
# sumsub-design plugin — pre-flight version check (structural enforcement)
#
# Fires before mcp__figma__use_figma / create_new_file / generate_figma_design.
# Compares local plugin version against remote main branch on GitHub.
# If mismatch — blocks the tool call with the verbose user-facing message that
# matches the prior working pre-flight UX (Russian-localized, with reply options).
#
# Override: SUMSUB_SKIP_VERSION_CHECK=1

if [ "$SUMSUB_SKIP_VERSION_CHECK" = "1" ]; then
  exit 0
fi

LOCAL_FILE="${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"
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
