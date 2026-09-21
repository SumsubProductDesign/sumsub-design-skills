# sourced by publish.sh / unpublish.sh — resolve a Vercel CLI and check auth
if command -v vercel >/dev/null 2>&1; then VC="vercel"; else VC="npx --yes vercel@latest"; fi
# Never echo the token. Auth comes from `vercel login` (interactive, the user runs it once)
# or from VERCEL_TOKEN in the environment; the CLI picks either up on its own.
vc() { $VC "$@"; }
# The account is the last line of `whoami` — but only after the noise is gone:
# npx prints `npm notice …` lines and the CLI prints its own version banner, and
# either can land last. Taking `tail -1` raw once reported the account as
# "npm notice", and the same expression decides whether we are authenticated.
vc_clean() { grep -vE '^(npm |> |Vercel CLI )' | grep -v '^[[:space:]]*$' | tail -1; }
vc_whoami() { $VC whoami 2>&1 | vc_clean; }

# Fails loudly on missing/expired credentials rather than letting a deploy die
# halfway. `vercel login` is interactive and opens a device-auth flow in a
# browser: an agent must never trigger it — the user runs it once, themselves.
# Note that read-only commands like `vercel project list` will START that flow
# on their own when credentials are stale, so gate every call behind this.
vc_require_auth() {
  local who rc
  who="$($VC whoami --non-interactive 2>&1 | vc_clean)"; rc=$?
  if [ $rc -ne 0 ] || echo "$who" | grep -qiE 'error|not valid|no existing credentials|login'; then
    echo "Vercel: not logged in (no credentials, or the stored token has expired)." >&2
    echo "Run this yourself once, then re-run the command:" >&2
    echo "  npx vercel login" >&2
    echo "Or export a token from vercel.com/account/tokens: export VERCEL_TOKEN=..." >&2
    return 1
  fi
  echo "$who"
}
