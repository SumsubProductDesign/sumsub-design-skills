#!/bin/bash
# publish.sh <prototype.html|dir> --project <slug> [--scope <team>] [--password <pw>] [--dry]
#
# Publishes the prototype to Vercel as a static site and prints the URL.
# A single self-contained HTML file is staged as index.html; a directory is
# uploaded as-is (it must contain index.html).
#
# PUBLISHING IS OUTWARD-FACING. Do not run this without the user asking for it
# in this session. The URL is public to anyone holding it.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_vercel.sh"

SRC=""; PROJ=""; PW=""; DRY=""; SCOPE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --project)  PROJ="$2"; shift 2 ;;
    --password) PW="$2";   shift 2 ;;
    --scope)    SCOPE="$2"; shift 2 ;;
    --dry)      DRY="1";   shift ;;
    *)          SRC="$1";  shift ;;
  esac
done
[ -n "$SRC" ] && [ -n "$PROJ" ] || { echo "usage: publish.sh <file.html|dir> --project <slug> [--scope <team>] [--password <pw>] [--dry]" >&2; exit 1; }
[ -e "$SRC" ] || { echo "not found: $SRC" >&2; exit 1; }
echo "$PROJ" | grep -Eq '^[a-z0-9][a-z0-9-]{0,98}$' || { echo "project slug must be lowercase letters, digits and dashes: $PROJ" >&2; exit 1; }

# --- stage ---------------------------------------------------------------
STAGE="${TMPDIR:-/tmp}/vercel-$PROJ-$$"
mkdir -p "$STAGE"
trap 'rm -rf "$STAGE"' EXIT
if [ -d "$SRC" ]; then
  cp -R "$SRC"/. "$STAGE"/
  [ -f "$STAGE/index.html" ] || { echo "directory has no index.html" >&2; exit 1; }
else
  cp "$SRC" "$STAGE/index.html"
fi
SIZE=$(du -h "$STAGE" | tail -1 | cut -f1)

# A prototype is a fixed artefact for a test session: never let a proxy or the
# respondent's browser serve a stale copy after a re-publish.
cat > "$STAGE/vercel.json" <<'JSON'
{
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
      { "key": "X-Robots-Tag",  "value": "noindex, nofollow" }
    ]}
  ]
}
JSON

WHO=$(vc_require_auth) || exit 1
echo "account : $WHO"
echo "project : $PROJ${SCOPE:+  (scope $SCOPE)}"
echo "payload : $SIZE"
[ -n "$DRY" ] && { echo "(dry run — nothing uploaded)"; vc deploy "$STAGE" --dry --yes --project "$PROJ" ${SCOPE:+--scope "$SCOPE"} 2>&1 | tail -5; exit 0; }

# --- ensure the project exists -------------------------------------------
# `deploy --project <slug>` fails with project_not_found instead of creating it.
if ! vc project inspect "$PROJ" ${SCOPE:+--scope "$SCOPE"} >/dev/null 2>&1; then
  echo "project does not exist yet — creating it"
  vc project add "$PROJ" ${SCOPE:+--scope "$SCOPE"} >/dev/null || { echo "could not create project $PROJ" >&2; exit 1; }
fi

# --- deploy --------------------------------------------------------------
OUT=$(vc deploy "$STAGE" --prod --yes --project "$PROJ" ${SCOPE:+--scope "$SCOPE"} 2>&1) || { echo "$OUT" >&2; exit 1; }
DEPL=$(echo "$OUT" | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)
[ -n "$DEPL" ] || { echo "$OUT" >&2; echo "could not parse a deployment URL" >&2; exit 1; }

# The deployment URL carries a build hash and changes on every publish. The
# stable production alias is what respondents get, so report that one.
# (the shortest alias that is not the build-specific URL is the project domain)
URL=$(vc inspect "$DEPL" ${SCOPE:+--scope "$SCOPE"} 2>&1 \
      | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | grep -vx "$DEPL" | sort -u \
      | awk '{ print length, $0 }' | sort -n | head -1 | cut -d' ' -f2-)
[ -n "$URL" ] || URL="$DEPL"

# --- protection ----------------------------------------------------------
# The trap that ruins a test: with SSO protection on, a respondent outside the
# team hits a login wall instead of the prototype.
if [ -n "$PW" ]; then
  vc project protection enable "$PROJ" --password --protection-password "$PW" ${SCOPE:+--scope "$SCOPE"} >/dev/null 2>&1 \
    && echo "password: enabled" || echo "password: FAILED to enable — check the plan allows it"
fi
# The project setting is NOT the answer: with ssoProtection set to
# `all_except_custom_domains` the production alias is public while the
# build-hash URL 302s to a login. So ask the two URLs themselves, with a request
# that carries no credentials — that is what a respondent's browser is.
reach() { curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$1" 2>/dev/null || echo "000"; }
CODE=$(reach "$URL")
CODE_B=$(reach "$DEPL")

echo
echo "URL: $URL   (anonymous GET → $CODE)"
[ "$URL" != "$DEPL" ] && echo "this build: $DEPL   (anonymous GET → $CODE_B)"
case "$CODE" in
  200) echo "reachable without a login — this is the link to send." ;;
  30*|401|403)
    echo "WARNING: the alias itself answers $CODE — a respondent gets a login wall, not the prototype."
    echo "  npx vercel project protection disable $PROJ --sso" ;;
  000) echo "WARNING: could not reach the alias at all (no network, or DNS has not propagated yet) — check it again before the session." ;;
  *)   echo "WARNING: the alias answers $CODE — check it before the session." ;;
esac
echo "The 200 proves there is no wall, not that the right build is up: open it once and look."
