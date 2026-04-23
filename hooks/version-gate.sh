#!/usr/bin/env bash
# sumsub-design version gate — PreToolUse hook.
# Runs before ANY mcp__figma__use_figma call. Checks local plugin version
# against remote (GitHub main). If local < remote: BLOCKS the tool call
# with a message telling Claude to update and stop.
#
# Exit codes:
#   0 → allow the tool call (version OK or check skipped)
#   2 → block the tool call (surfaced back to Claude as an error it must obey)
#
# Claude Code's PreToolUse hook contract: stderr + exit 2 → block the tool
# call and feed the stderr text back into Claude's context as guidance.

set -u

# ─── User-acknowledged bypass ────────────────────────────────────────────────
# Set SUMSUB_SKIP_VERSION_GATE=1 to disable the gate for the current shell
# session (user explicitly said "continue anyway" on an outdated plugin).
if [ "${SUMSUB_SKIP_VERSION_GATE:-0}" = "1" ]; then
  exit 0
fi

# ─── Config ──────────────────────────────────────────────────────────────────
REMOTE_URL="https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json"
CACHE_FILE="${HOME}/.cache/sumsub-design-version-gate.json"
CACHE_TTL=3600  # seconds — don't hammer GitHub on every tool call
LOCAL_PLUGIN_JSON=""

# Find local plugin.json. Plugins live under ~/.claude/plugins/ with variable
# path, so search for our plugin.json anywhere under it.
if command -v find >/dev/null 2>&1; then
  LOCAL_PLUGIN_JSON=$(find "${HOME}/.claude/plugins" -type f -path "*sumsub-design*/.claude-plugin/plugin.json" 2>/dev/null | head -n1)
fi

if [ -z "$LOCAL_PLUGIN_JSON" ] || [ ! -f "$LOCAL_PLUGIN_JSON" ]; then
  # Can't locate plugin.json — skip gate, don't block innocent user
  exit 0
fi

# ─── Read local version ──────────────────────────────────────────────────────
LOCAL_VERSION=$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' "$LOCAL_PLUGIN_JSON" | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || true)
if [ -z "$LOCAL_VERSION" ]; then
  exit 0
fi

# ─── Read remote version (with cache) ────────────────────────────────────────
mkdir -p "$(dirname "$CACHE_FILE")" 2>/dev/null || true
REMOTE_VERSION=""
if [ -f "$CACHE_FILE" ]; then
  CACHE_AGE=$(($(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0)))
  if [ "$CACHE_AGE" -lt "$CACHE_TTL" ]; then
    REMOTE_VERSION=$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+' "$CACHE_FILE" 2>/dev/null | head -n1 || true)
  fi
fi

if [ -z "$REMOTE_VERSION" ]; then
  if command -v curl >/dev/null 2>&1; then
    RAW=$(curl -fsSL --max-time 5 "$REMOTE_URL" 2>/dev/null || true)
    REMOTE_VERSION=$(printf '%s' "$RAW" | grep -oE '"version"[[:space:]]*:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || true)
    if [ -n "$REMOTE_VERSION" ]; then
      printf '%s' "$REMOTE_VERSION" > "$CACHE_FILE"
    fi
  fi
fi

if [ -z "$REMOTE_VERSION" ]; then
  # Offline / GitHub down — skip gate, don't block
  exit 0
fi

# ─── SemVer compare ──────────────────────────────────────────────────────────
# Returns 0 if $1 >= $2, 1 otherwise
version_ge() {
  printf '%s\n%s' "$1" "$2" | sort -V | tail -n1 | grep -qx "$1"
}

if version_ge "$LOCAL_VERSION" "$REMOTE_VERSION"; then
  exit 0  # up to date
fi

# ─── Block + message ─────────────────────────────────────────────────────────
# stderr on exit 2 becomes Claude's error context.
cat >&2 <<EOF
⚠️ sumsub-design plugin is out of date — tool call BLOCKED.

Local:  v${LOCAL_VERSION}
Remote: v${REMOTE_VERSION}

This gate exists because the skill has been observed inventing
"auto mode" to bypass the SKILL.md pre-flight rule and silently
building mockups on stale rules. The gate runs outside the skill's
judgment — it cannot be argued with, renamed around, or deferred.

To unblock:
  1. Tell the user the plugin is out of date.
  2. Ask: "yes to auto-update, or continue-anyway to skip?"
  3. If yes — run via Bash:
       claude plugin marketplace update sumsub-design
       claude plugin update sumsub-design@sumsub-design
     Then tell the user to fully quit and reopen Claude Desktop.
  4. If continue-anyway — set env SUMSUB_SKIP_VERSION_GATE=1 for
     the session (user-acknowledged stale plugin use).

The tool call you just attempted has NOT been executed.
EOF
exit 2
