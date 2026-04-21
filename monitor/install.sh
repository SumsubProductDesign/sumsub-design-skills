#!/usr/bin/env bash
# sumsub-skill-monitor — install the PostToolUse hook into
# ~/.claude/settings.json. Safe to re-run: removes any existing
# sumsub-monitor entry before re-adding.
#
# Requires: curl, jq, python3.

set -e

echo "→ Installing sumsub-skill-monitor..."

# 1. Check deps
for dep in curl jq python3; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    echo "✖ Missing dependency: $dep"
    echo "  Install it first. On Debian/Ubuntu: apt-get install -y $dep"
    echo "  On macOS: brew install $dep"
    exit 1
  fi
done

# 2. Download the hook script
DIR="$HOME/.sumsub-monitor"
mkdir -p "$DIR"
curl -fsSL https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/monitor/sumsub-monitor.sh \
  -o "$DIR/sumsub-monitor.sh"
chmod +x "$DIR/sumsub-monitor.sh"
echo "✓ Hook script installed at $DIR/sumsub-monitor.sh"

# 3. Merge hook into ~/.claude/settings.json
SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$(dirname "$SETTINGS")"
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"

python3 - "$SETTINGS" "$DIR/sumsub-monitor.sh" <<'PYEOF'
import json, sys, os

settings_path = sys.argv[1]
hook_cmd = sys.argv[2]

with open(settings_path) as f:
    data = json.load(f)

hooks = data.setdefault("hooks", {})
entries = hooks.setdefault("PostToolUse", [])

# Remove any existing sumsub-monitor entries (for idempotent re-install)
def is_ours(entry):
    if not isinstance(entry, dict):
        return False
    for h in entry.get("hooks", []):
        if isinstance(h, dict) and "sumsub-monitor" in h.get("command", ""):
            return True
    return False

entries = [e for e in entries if not is_ours(e)]

# Add our entry
entries.append({
    "matcher": "mcp__figma__use_figma",
    "hooks": [{"type": "command", "command": hook_cmd}]
})
hooks["PostToolUse"] = entries

with open(settings_path, "w") as f:
    json.dump(data, f, indent=2)

print(f"✓ Hook registered in {settings_path}")
PYEOF

echo ""
echo "───────────────────────────────────────────────"
echo "Done. Log file: ~/sumsub-skill-monitor.jsonl"
echo ""
echo "Watch live:"
echo "  tail -F ~/sumsub-skill-monitor.jsonl | jq ."
echo ""
echo "Short digest (last 20 calls):"
echo "  tail -n 20 ~/sumsub-skill-monitor.jsonl | jq -c '{ts,desc,codeLen}'"
echo ""
echo "Restart Claude Code for the hook to take effect."
echo "───────────────────────────────────────────────"
