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
CACHE_TTL=60  # seconds — short, so the check effectively fires every session
# ─── Find local version ──────────────────────────────────────────────────────
# Claude Code keeps every cached plugin version on disk under
# ~/.claude/plugins/cache/.../<version>/. `find | head -n1` would grab a
# random one (filesystem order), which could be any old cached version.
# The ACTIVE version after an update is always the MAX version on disk —
# Claude Code doesn't delete old caches, but it loads the latest available.
# So: collect all version strings from all plugin.json matches, sort SemVer,
# take max.

LOCAL_VERSION=""
if command -v find >/dev/null 2>&1; then
  ALL_VERSIONS=$(find "${HOME}/.claude/plugins" -type f -path "*sumsub-design*/.claude-plugin/plugin.json" 2>/dev/null \
    | while read -r f; do
        grep -oE '"version"[[:space:]]*:[[:space:]]*"[0-9]+\.[0-9]+\.[0-9]+"' "$f" 2>/dev/null \
          | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' \
          | head -n1
      done)
  LOCAL_VERSION=$(printf '%s\n' "$ALL_VERSIONS" | grep -v '^$' | sort -V | tail -n1)
fi

if [ -z "$LOCAL_VERSION" ]; then
  # Can't locate any plugin.json — skip gate, don't block innocent user
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
# stderr on exit 2 becomes Claude's error context. It is INSTRUCTION for
# Claude — follow it exactly.
cat >&2 <<EOF
STOP. Plugin sumsub-design is out of date. This tool call is blocked.

Local:  v${LOCAL_VERSION}
Remote: v${REMOTE_VERSION}

WHAT YOU (CLAUDE) MUST DO NOW — exactly these steps, in order:

1. STOP all further tool calls. Do not create frames, do not import
   components, do not run audits, do not do anything else.

2. Show the user EXACTLY this message (substitute the real versions):

   ⚠️ sumsub-design plugin update available
   Your local version: v${LOCAL_VERSION} · Latest: v${REMOTE_VERSION}

   I can update it for you right now by running:
     claude plugin marketplace update sumsub-design
     claude plugin update sumsub-design@sumsub-design

   Reply:
     - yes / update — I will run the two commands via Bash, then you
       quit and reopen Claude Desktop
     - continue anyway — use the current (older) version for this
       session

3. WAIT for the user's reply. Do not proceed on assumption. Do not
   invent "auto mode" or "will mention at the end" — those phrases
   are banned regressions from prior sessions, the user has already
   been burned by them.

4. If user replies yes / update:
     - Run via Bash: claude plugin marketplace update sumsub-design
                   && claude plugin update sumsub-design@sumsub-design
     - On success: tell user to fully quit and reopen Claude Desktop,
       then come back and reply "restarted" to continue.
     - On failure: surface the exact stderr, offer manual fallback.

5. If user replies continue anyway:
     - Run via Bash to set the session bypass, then retry the original
       tool call. Example:
         SUMSUB_SKIP_VERSION_GATE=1 <original command context>
       In practice, instruct the user to start a new chat with that env
       set, OR accept that the gate will keep firing this session.

The tool call you just attempted was NOT executed. The only acceptable
next action is step 2 above.
EOF
exit 2
