#!/bin/bash
# sumsub-design plugin — pre-flight version check (structural enforcement)
#
# Fires before mcp__figma__use_figma / create_new_file / generate_figma_design.
# Compares local plugin version against remote main branch on GitHub.
# If mismatch — blocks the tool call with a message instructing to update.
#
# Why this is a hook and not a text rule: text rules in SKILL.md kept being
# bypassed by agents inventing new rationalization phrases ("continuing under
# auto mode", "canonical hasn't materially changed", "minor mismatch — proceeding
# (no breaking changes typical for patch bump)", etc.). Hook removes the agent's
# ability to assess. Harness blocks the tool call before agent gets control.
#
# Override (when user has explicitly chosen to continue with old version):
#   SUMSUB_SKIP_VERSION_CHECK=1 in the environment

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
  echo "⚠️ sumsub-design: could not fetch remote version (network?). Proceeding with local v$LOCAL." >&2
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
Your local version: v$LOCAL · Latest: v$REMOTE

This Figma tool call is BLOCKED until the version is reconciled.

To update:
  claude plugin marketplace update sumsub-design
  claude plugin update sumsub-design@sumsub-design

Then re-send your original prompt — the new version picks up automatically on the next tool call.

To proceed on the OLDER version anyway (rare; only if you've read the changelog and decided the newer rules don't apply):
  Set SUMSUB_SKIP_VERSION_CHECK=1 in your environment, then re-send.

Changelog: https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/CHANGELOG.md
EOF

exit 2
