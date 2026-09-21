#!/bin/bash
# unpublish.sh --list [--scope <team>]
# unpublish.sh <slug> --confirm <slug> [--scope <team>]
#
# `vercel remove <slug>` deletes the PROJECT and every deployment under it — the
# URL 404s immediately and the project disappears from the dashboard. There is
# no "deployments only" mode by project name; to drop a single build instead,
# pass that build's own URL to `vercel remove`.
#
# THIS IS DESTRUCTIVE AND IRREVERSIBLE. The URL dies immediately, which is the
# point after a test round — but never run it without the user asking, and never
# infer the slug: it must be typed twice, and both must match.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_vercel.sh"

SCOPE=""
[ "$2" = "--scope" ] && SCOPE="$3"
[ "$1" = "--list" ] && { WHO=$(vc_require_auth) || exit 1; echo "account: $WHO"; vc project list ${SCOPE:+--scope "$SCOPE"}; exit 0; }

SLUG=""; CONF=""
while [ $# -gt 0 ]; do
  case "$1" in
    --confirm)       CONF="$2"; shift 2 ;;
    --scope)         SCOPE="$2"; shift 2 ;;
    *)               SLUG="$1"; shift ;;
  esac
done
[ -n "$SLUG" ] || { echo "usage: unpublish.sh <slug> --confirm <slug> [--scope <team>] | --list" >&2; exit 1; }
[ "$SLUG" = "$CONF" ] || { echo "refusing: pass --confirm <slug> matching the project exactly" >&2; exit 1; }

WHO=$(vc_require_auth) || exit 1
echo "account: $WHO"
echo "removing project '$SLUG' and all of its deployments…"
vc remove "$SLUG" --yes ${SCOPE:+--scope "$SCOPE"}

# Confirm rather than announce: inspect must now fail, and the URL must 404.
if vc project inspect "$SLUG" ${SCOPE:+--scope "$SCOPE"} >/dev/null 2>&1; then
  echo "WARNING: '$SLUG' still exists — check the dashboard" >&2; exit 1
fi
CODE=$(curl -s -o /dev/null -w '%{http_code}' -L "https://$SLUG.vercel.app" || echo "?")
echo "gone. Project no longer listed; https://$SLUG.vercel.app returns $CODE."
