#!/usr/bin/env python3
"""
sumsub-design — cross-platform auto-bootstrap installer.

Installs the version-check hook script + registers PreToolUse hook in
~/.claude/settings.local.json. Works on macOS, Linux, Windows (with python3).
Idempotent: safe to re-run.

Called by mockup skills (Step 0) when the version-check hook is missing.
"""
import json
import os
import stat
import sys
from pathlib import Path

HOME = Path.home()
HOOK_DIR = HOME / ".claude" / "hooks"
SETTINGS_FILE = HOME / ".claude" / "settings.local.json"

# Hook script — Python so it runs cross-platform.
HOOK_SCRIPT_NAME = "sumsub-version-check.py"
HOOK_SCRIPT_PATH = HOOK_DIR / HOOK_SCRIPT_NAME

HOOK_SCRIPT_CONTENT = r'''#!/usr/bin/env python3
"""
sumsub-design version-check hook (cross-platform).
Called by Claude Code as PreToolUse on figma tool calls.
Exit 0 = allow. Exit 2 = block with message on stderr.
Override: set SUMSUB_SKIP_VERSION_CHECK=1 in environment.
"""
import json
import os
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

if os.environ.get("SUMSUB_SKIP_VERSION_CHECK") == "1":
    sys.exit(0)

CACHE_BASE = Path.home() / ".claude" / "plugins" / "cache" / "sumsub-design" / "sumsub-design"
if not CACHE_BASE.is_dir():
    sys.exit(0)

# Find latest cached version dir (highest semver)
def parse_ver(s):
    try:
        return tuple(int(x) for x in s.split("."))
    except Exception:
        return (0,)

dirs = [d.name for d in CACHE_BASE.iterdir() if d.is_dir()]
if not dirs:
    sys.exit(0)
latest = sorted(dirs, key=parse_ver)[-1]
local_file = CACHE_BASE / latest / ".claude-plugin" / "plugin.json"
if not local_file.is_file():
    sys.exit(0)

try:
    with local_file.open() as f:
        local_data = json.load(f)
    local_ver = local_data.get("version", "")
except Exception:
    sys.exit(0)
if not local_ver:
    sys.exit(0)

remote_url = "https://raw.githubusercontent.com/SumsubProductDesign/sumsub-design-skills/main/.claude-plugin/plugin.json"
try:
    req = Request(remote_url, headers={"User-Agent": "sumsub-version-check"})
    with urlopen(req, timeout=5) as resp:
        if resp.status != 200:
            sys.stderr.write(f"WARNING: sumsub-design remote check returned status {resp.status}; cannot verify version. Proceeding silent.\n")
            sys.exit(0)
        remote_data = json.loads(resp.read().decode())
        remote_ver = remote_data.get("version", "")
except (URLError, HTTPError, json.JSONDecodeError, Exception) as e:
    sys.stderr.write(f"WARNING: sumsub-design remote check failed ({type(e).__name__}); proceeding silent.\n")
    sys.exit(0)

if not remote_ver or local_ver == remote_ver:
    sys.exit(0)

# Mismatch — BLOCK
sys.stderr.write(f"""
⚠️ sumsub-design plugin update available

Твоя версия: v{local_ver} · Последняя: v{remote_ver}

Этот Figma tool call заблокирован. Запусти в Bash:

  claude plugin marketplace update sumsub-design && claude plugin update sumsub-design@sumsub-design

Аварийный bypass на сессию: SUMSUB_SKIP_VERSION_CHECK=1

Changelog: https://github.com/SumsubProductDesign/sumsub-design-skills/blob/main/CHANGELOG.md
""")
sys.exit(2)
'''


def write_hook_script():
    HOOK_DIR.mkdir(parents=True, exist_ok=True)
    HOOK_SCRIPT_PATH.write_text(HOOK_SCRIPT_CONTENT)
    # chmod +x — no-op on Windows but harmless
    try:
        st = HOOK_SCRIPT_PATH.stat()
        HOOK_SCRIPT_PATH.chmod(st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
    except Exception:
        pass


def merge_settings():
    data = {}
    if SETTINGS_FILE.exists():
        try:
            with SETTINGS_FILE.open() as f:
                data = json.load(f)
        except Exception:
            data = {}
    hooks = data.get("hooks", {})
    existing = hooks.get("PreToolUse", [])
    # Drop any prior sumsub entries (idempotent install)
    existing = [e for e in existing if "sumsub-version-check" not in json.dumps(e)]
    # Use python3 (resolved by PATH) — cross-platform
    cmd = f'python3 "{HOOK_SCRIPT_PATH}"'
    existing.append({
        "matcher": "mcp__figma__use_figma|mcp__figma__create_new_file|mcp__figma__generate_figma_design",
        "hooks": [{
            "type": "command",
            "command": cmd,
            "timeout": 10,
        }],
    })
    hooks["PreToolUse"] = existing
    data["hooks"] = hooks
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with SETTINGS_FILE.open("w") as f:
        json.dump(data, f, indent=2)


def main():
    write_hook_script()
    merge_settings()
    # Also clean up any stale .sh hook from v3.103-3.109
    legacy_sh = HOOK_DIR / "sumsub-version-check.sh"
    if legacy_sh.exists():
        try:
            legacy_sh.unlink()
        except Exception:
            pass
    print(f"OK sumsub-design version-check hook installed at {HOOK_SCRIPT_PATH}")
    print(f"   Registered PreToolUse in {SETTINGS_FILE}")
    print(f"   Override on session: SUMSUB_SKIP_VERSION_CHECK=1")


if __name__ == "__main__":
    main()
