# sumsub-skill-monitor

A minimal `PostToolUse` hook for Claude Code that logs every
`mcp__figma__use_figma` call to a local JSONL file on the VM. You
tail the log and paste snippets in chat so the other Claude can
see what the skill actually did and propose fixes.

This is **not** live intervention — Claude on the VM runs normally,
the hook only records. The triage loop is:

1. VM-Claude builds something wrong
2. You tail the log and paste the relevant lines into chat
3. Reviewing Claude identifies the rule violation, proposes a fix
4. Update SKILL.md → `sumsub-update` on VM → next run behaves differently

---

## Install (macOS / Linux / WSL)

```bash
curl -fsSL https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/monitor/install.sh | bash
```

The installer:
1. Downloads `sumsub-monitor.sh` to `~/.sumsub-monitor/`
2. Adds a `PostToolUse` entry to `~/.claude/settings.json` (idempotent — safe to re-run)
3. Logs to `~/sumsub-skill-monitor.jsonl`

Requires `curl`, `jq`, `python3`. On Debian/Ubuntu:
```bash
apt-get install -y curl jq python3
```

**After install, restart Claude Code (the CLI / Desktop) for the hook to activate.**

## Windows

Not currently supported. The hook script is bash — use WSL or run
your Claude Code on a Linux VM.

---

## What it logs

One JSONL line per `mcp__figma__use_figma` call. Sample:

```json
{"ts":"2026-04-21T14:23:01Z","session":"abc123def","tool":"mcp__figma__use_figma","desc":"Create root frame and add sidebar","fileKey":"iVg9P7ixHykt2tn0VfCCAY","codeLen":8234,"codePreview":"const root = figma.createFrame(); root.name = \"Flow Builder\"; root.resize(1440, 900); ...","response":"{\"content\":[{\"type\":\"text\",\"text\":\"Root ID: 1:234\"}]}"}
```

Fields:

| Field | Meaning |
|---|---|
| `ts` | UTC timestamp of the call |
| `session` | first 12 chars of Claude session id |
| `desc` | the `description` arg passed to the tool |
| `fileKey` | target Figma file key |
| `codeLen` | size of the JS code in chars |
| `codePreview` | first 800 chars of code, newlines collapsed to spaces |
| `response` | first 600 chars of the tool response (errors included) |

---

## Usage

### Watch live
```bash
tail -F ~/sumsub-skill-monitor.jsonl | jq .
```

### Short digest of recent calls
```bash
tail -n 20 ~/sumsub-skill-monitor.jsonl | jq -c '{ts,desc,codeLen}'
```

### Find calls that failed
```bash
jq -c 'select(.response | tostring | test("error|Error"; "i"))' ~/sumsub-skill-monitor.jsonl
```

### See the last attempted code
```bash
tail -n 1 ~/sumsub-skill-monitor.jsonl | jq -r .codePreview
```

### Extract a slice to share in chat
```bash
# last 10 calls, one line each, ready to paste
tail -n 10 ~/sumsub-skill-monitor.jsonl | jq -c '{ts,desc,codeLen,respHead:(.response|.[0:120])}'
```

---

## Uninstall

```bash
rm -rf ~/.sumsub-monitor/
```

Then edit `~/.claude/settings.json` and remove the entry inside
`hooks.PostToolUse` whose command points to `sumsub-monitor.sh`.

---

## Config

| Env var | Default | Purpose |
|---|---|---|
| `SUMSUB_MONITOR_LOG` | `$HOME/sumsub-skill-monitor.jsonl` | Override log path |

Set in your shell rc:
```bash
export SUMSUB_MONITOR_LOG="$HOME/figma-hook.log"
```

---

## How it works under the hood

Claude Code runs the script after every tool call matching
`mcp__figma__use_figma`. The hook payload is piped on stdin:

```json
{
  "session_id": "...",
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__figma__use_figma",
  "tool_input": { "code": "...", "description": "...", "fileKey": "..." },
  "tool_response": { ... }
}
```

The script extracts relevant fields via `jq`, truncates large ones
(`code` can be tens of KB), and appends one JSONL line. It always
`exit 0` so even a broken hook can't block Claude's actual work.

See `sumsub-monitor.sh` for the 40-line implementation.
