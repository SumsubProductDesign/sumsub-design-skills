#!/bin/bash
# sumsub-design plugin — pre-flight version check
#
# Fires before mcp__figma__use_figma / create_new_file / generate_figma_design.
# Compares local plugin version against remote main branch on GitHub.
# If mismatch — blocks the tool call with a message instructing to update.
#
# Override: if user explicitly says "continue with old version this session", set
# SUMSUB_SKIP_VERSION_CHECK=1 before invoking.
#
# Why this exists structurally: text rules in SKILL.md kept being bypassed by
# agents inventing new rationalization phrases ("X canonical hasn't materially
# changed", "I'll note in blockers but proceed", etc.). Hook removes the agent's
# ability to assess; harness blocks tool until user updates.

if [ "$SUMSUB_SKIP_VERSION_CHECK" = "1" ]; then
  exit 0
fi

# Pure bash + grep + sed — no jq/python dependency.
LOCAL_FILE="${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"
if [ ! -f "$LOCAL_FILE" ]; then
  # Plugin file missing — odd but don't block on it.
  exit 0
fi

LOCAL=$(grep '"version"' "$LOCAL_FILE" | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
if [ -z "$LOCAL" ]; then
  exit 0
fi

REMOTE_RAW=$(curl -s --max-time 5 "https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json" 2>/dev/null)
if [ -z "$REMOTE_RAW" ]; then
  # Network failure — surface a hint but don't block (no internet shouldn't be a hard stop).
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
🛑 sumsub-design plugin version mismatch — local v$LOCAL, remote v$REMOTE.

This Figma tool call is BLOCKED. Update the plugin before continuing:

  claude plugin marketplace update sumsub-design
  claude plugin update sumsub-design@sumsub-design

Then fully restart Claude Code.

Why this is blocking: prior versions of the skill have shipped behaviour
changes, audit gates, and pattern-doc fixes that an agent cannot anticipate
from changelog excerpts. Agents have repeatedly tried to rationalize past
mismatches ("the diff doesn't affect Connect", "this is a minor patch"); the
hook removes that ability. Update is required.

If the user has confirmed in this turn that they want to proceed on the older
version anyway (e.g. "continue with old plugin for this session"), set
SUMSUB_SKIP_VERSION_CHECK=1 in the environment and re-run.

Changelog (between $LOCAL and $REMOTE) is at
https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/CHANGELOG.md
EOF

exit 2
