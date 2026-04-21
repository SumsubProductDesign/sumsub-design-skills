#!/usr/bin/env bash
# sumsub-skill-monitor — PostToolUse hook for Claude Code.
# Logs every mcp__figma__use_figma call to ~/sumsub-skill-monitor.jsonl
# so the log can be tailed and pasted into chat for triage.
#
# Invoked by Claude Code with the hook payload on stdin. Must never
# block the tool call — always exits 0 even if logging fails.

set -u

LOG="${SUMSUB_MONITOR_LOG:-$HOME/sumsub-skill-monitor.jsonl}"
mkdir -p "$(dirname "$LOG")"

INPUT="$(cat)"
TS="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

# Require jq. If missing, log a stub and exit so Claude isn't blocked.
if ! command -v jq >/dev/null 2>&1; then
  printf '{"ts":"%s","err":"jq not installed on this machine — install it (apt-get install jq / brew install jq) to enable monitoring"}\n' "$TS" >> "$LOG"
  exit 0
fi

# Extract fields, truncate large ones
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')
DESC=$(printf '%s' "$INPUT" | jq -r '.tool_input.description // ""' | head -c 300)
FKEY=$(printf '%s' "$INPUT" | jq -r '.tool_input.fileKey // ""')
CODE=$(printf '%s' "$INPUT" | jq -r '.tool_input.code // ""')
CLEN=${#CODE}
CPRE=$(printf '%s' "$CODE" | tr '\n\r\t' '   ' | head -c 800)
RESP=$(printf '%s' "$INPUT" | jq -c '.tool_response // null' 2>/dev/null | head -c 600)
SID=$(printf '%s' "$INPUT" | jq -r '.session_id // ""' | head -c 12)

# Emit one compact JSONL line
jq -cn \
  --arg ts "$TS" \
  --arg session "$SID" \
  --arg tool "$TOOL" \
  --arg desc "$DESC" \
  --arg fileKey "$FKEY" \
  --argjson codeLen "$CLEN" \
  --arg codePreview "$CPRE" \
  --arg response "$RESP" \
  '{ts:$ts, session:$session, tool:$tool, desc:$desc, fileKey:$fileKey, codeLen:$codeLen, codePreview:$codePreview, response:$response}' \
  >> "$LOG" 2>/dev/null || true

exit 0
