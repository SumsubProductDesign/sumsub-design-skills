#!/usr/bin/env bash
# Dual-publish: mirror the current GitHub release of sumsub-design into the
# corporate GitLab marketplace (git.sumsub.net/internal-tools/claude-marketplace)
# as a branch + MR. GitHub is the upstream source of truth; run this AFTER a
# version bump has been pushed to GitHub main.
#
# Usage:  ./scripts/sync-to-gitlab.sh "One-line changelog summary for this release"
#
# Requires: a clone of the GitLab marketplace at $GITLAB_CLONE (default
# ~/claude-marketplace-gitlab) with push rights (token in macOS Keychain).
set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-$HOME/.claude/plugins/marketplaces/sumsub-design}"
GITLAB_CLONE="${GITLAB_CLONE:-$HOME/claude-marketplace-gitlab}"
SUMMARY="${1:?Usage: sync-to-gitlab.sh \"one-line changelog summary\"}"

VERSION=$(python3 -c "import json;print(json.load(open('$GITHUB_REPO/.claude-plugin/plugin.json'))['version'])")
DATE=$(date +%Y-%m-%d)
BRANCH="kr/sumsub-design-v${VERSION}"

echo "→ Syncing sumsub-design v${VERSION} to GitLab marketplace"

# 0. Guard: GitHub working copy must be clean and on the released commit
git -C "$GITHUB_REPO" diff --quiet || { echo "✗ GitHub working copy has uncommitted changes"; exit 1; }

# 1. Fresh master + branch
git -C "$GITLAB_CLONE" checkout master -q
git -C "$GITLAB_CLONE" pull -q origin master
git -C "$GITLAB_CLONE" checkout -B "$BRANCH" -q

# 2. Copy plugin content (plugin dir is the whole payload; nested marketplace.json must not travel)
DEST="$GITLAB_CLONE/plugins/sumsub-design"
rm -rf "$DEST/skills" "$DEST/reference" "$DEST/examples"
cp -R "$GITHUB_REPO/skills" "$GITHUB_REPO/reference" "$GITHUB_REPO/examples" "$DEST/"
cp "$GITHUB_REPO/.claude-plugin/plugin.json" "$DEST/.claude-plugin/plugin.json"
cp "$GITHUB_REPO/.mcp.json" "$DEST/.mcp.json"
rm -f "$DEST/.claude-plugin/marketplace.json"

# 3. CHANGELOG: add "### <version> — <date>" under "## Plugin: `sumsub-design`" + bump Contents pointer
python3 - "$GITLAB_CLONE/CHANGELOG.md" "$VERSION" "$DATE" "$SUMMARY" <<'PY'
import re,sys
path,version,date,summary=sys.argv[1:5]
s=open(path).read()
if f"### {version} " in s: print("  changelog entry already present"); sys.exit(0)
s=re.sub(r"(- \[Plugin: `sumsub-design`\]\(#plugin-sumsub-design\) — current \*\*)[^*]+(\*\*)",
         r"\g<1>"+version+r"\g<2>",s)
mk="## Plugin: `sumsub-design`\n"
entry=f"\n### {version} — {date}\n\n- {summary} (mirrored from the upstream GitHub release; full history in the GitHub CHANGELOG).\n"
i=s.index(mk)+len(mk)
s=s[:i]+entry+s[i:]
open(path,"w").write(s)
print("  changelog entry added")
PY

# 4. Validate, commit (version already bumped upstream → their pre-commit hook skips), push + MR
cd "$GITLAB_CLONE"
npm run validate >/dev/null 2>&1 || { echo "✗ npm run validate failed"; npm run validate; exit 1; }
git add -A
git commit -m "sumsub-design: sync v${VERSION} from upstream GitHub

${SUMMARY}"
# Post-commit guard (their rule): version must equal the upstream release
SYNCED=$(git show HEAD:plugins/sumsub-design/.claude-plugin/plugin.json | python3 -c "import json,sys;print(json.load(sys.stdin)['version'])")
[ "$SYNCED" = "$VERSION" ] || { echo "✗ version desync after commit: $SYNCED != $VERSION (pre-commit hook bumped it?)"; exit 1; }

git push -u origin "$BRANCH" \
  -o merge_request.create \
  -o merge_request.target=master \
  -o merge_request.title="sumsub-design: sync v${VERSION} from upstream" \
  -o merge_request.description="Mirrors the upstream GitHub release v${VERSION}. ${SUMMARY}" \
  -o merge_request.remove_source_branch

echo "✓ Pushed ${BRANCH} — MR created/updated (see push output above)"
