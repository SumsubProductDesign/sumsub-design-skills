#!/bin/bash
# publish.sh <prototype.html|dir> --project <slug> [--scope <team>] [--password <pw>] [--spa] [--dry]
#
# Publishes the prototype to Vercel as a static site and prints the URL.
# A single self-contained HTML file is staged as index.html; a directory is
# uploaded as-is (it must contain index.html).
#
# --spa   the prototype routes with the History API (/s1, /registry/x): every path is served
#         index.html, so a deep link or a reload does not 404. A directory's own vercel.json is
#         kept and merged with the headers below — it used to be overwritten, and a History-API
#         prototype lost its rewrites on every publish (2026-09-28). `cleanUrls` is dropped when
#         rewrites are present: together they 404 every route.
# --dry   stage and show what would go up — the vercel.json included — without uploading
#
# PUBLISHING IS OUTWARD-FACING. Do not run this without the user asking for it
# in this session. The URL is public to anyone holding it.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; . "$DIR/_vercel.sh"

SRC=""; PROJ=""; PW=""; DRY=""; SCOPE=""; SPA=""
while [ $# -gt 0 ]; do
  case "$1" in
    --project)  PROJ="$2"; shift 2 ;;
    --password) PW="$2";   shift 2 ;;
    --scope)    SCOPE="$2"; shift 2 ;;
    --dry)      DRY="1";   shift ;;
    --spa)      SPA="1";   shift ;;
    *)          SRC="$1";  shift ;;
  esac
done
[ -n "$SRC" ] && [ -n "$PROJ" ] || { echo "usage: publish.sh <file.html|dir> --project <slug> [--scope <team>] [--password <pw>] [--spa] [--dry]" >&2; exit 1; }
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
# respondent's browser serve a stale copy after a re-publish. The headers go into the
# directory's own vercel.json when it has one, next to its rewrites, instead of over them.
node - "$STAGE/vercel.json" "$SPA" <<'NODE'
const fs = require('fs'); const [file, spa] = process.argv.slice(2);
let cfg = {};
if (fs.existsSync(file)) {
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error('vercel.json in the payload does not parse: ' + e.message); process.exit(1); }
}
const ours = [
  { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
cfg.headers = (cfg.headers || []).filter(h => h.source !== '/(.*)' || !h.headers.some(x => ours.some(o => o.key === x.key)));
cfg.headers.push({ source: '/(.*)', headers: ours });
if (spa) {
  cfg.rewrites = (cfg.rewrites || []).filter(r => r.destination !== '/index.html');
  cfg.rewrites.push({ source: '/(.*)', destination: '/index.html' });
}
if (cfg.rewrites && cfg.rewrites.length && cfg.cleanUrls) {
  console.log('vercel.json: cleanUrls dropped — with a rewrite to /index.html it 404s every route');
  delete cfg.cleanUrls;
}
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
console.log('config  : ' + (cfg.rewrites && cfg.rewrites.length ? 'SPA, every path → index.html' : 'static') + (Object.keys(cfg).filter(k => !['headers', 'rewrites'].includes(k)).length ? ' + the payload\'s own ' + Object.keys(cfg).filter(k => !['headers', 'rewrites'].includes(k)).join(', ') : ''));
NODE

WHO=$(vc_require_auth) || exit 1
echo "account : $WHO"
echo "project : $PROJ${SCOPE:+  (scope $SCOPE)}"
echo "payload : $SIZE"
[ -n "$DRY" ] && { echo "(dry run — nothing uploaded)"; echo "--- vercel.json that would go up:"; cat "$STAGE/vercel.json"; exit 0; }

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
# stable production alias is what respondents get, so report that one — and only the
# project's own domain, <slug>.vercel.app. The old rule, "the shortest alias that is not the
# build URL", picked the team alias (<slug>-<team>.vercel.app, SSO-walled) from the fourth
# publish on, so the link this script reported flipped between publishes (2026-09-28).
ALIASES=$(vc inspect "$DEPL" ${SCOPE:+--scope "$SCOPE"} 2>&1 \
      | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | grep -vx "$DEPL" | sort -u)
if echo "$ALIASES" | grep -qx "https://$PROJ.vercel.app"; then URL="https://$PROJ.vercel.app"
else
  URL="$DEPL"
  echo "WARNING: the project's own domain https://$PROJ.vercel.app is not among this deployment's aliases:"
  echo "$ALIASES" | sed 's/^/  /'
  echo "  Reporting the build URL instead. Do NOT send a team alias (<slug>-<team>) to respondents: it is SSO-walled."
fi

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
# Redirects are followed: a prototype's own `/` → `/s1` is routing, a hop to vercel.com is the wall.
R=$(vc_reach "$URL"); CODE="${R%% *}"; FINAL="${R#* }"
RB=$(vc_reach "$DEPL"); CODE_B="${RB%% *}"

echo
echo "URL: $URL   (anonymous GET → $CODE)"
[ "$URL" != "$DEPL" ] && echo "this build: $DEPL   (anonymous GET → $CODE_B)"
vc_judge "$URL" "$CODE" "$FINAL" || case "$CODE" in 401|403|30*) echo "  npx vercel project protection disable $PROJ --sso" ;; esac
echo "The 200 proves there is no wall, not that the right build is up: open it once and look."
