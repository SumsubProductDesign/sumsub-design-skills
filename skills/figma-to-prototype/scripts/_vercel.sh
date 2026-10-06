# sourced by publish.sh / unpublish.sh / doctor.sh — resolve a Vercel CLI, check auth, judge a URL
if command -v vercel >/dev/null 2>&1; then VC="vercel"; else VC="npx --yes vercel@latest"; fi
# Never echo the credential. Auth comes from `vercel login` (interactive, the user runs it once)
# and the CLI picks it up on its own. A non-interactive credential must arrive through the
# corporate auth-core-sumsub launcher, which reads it from the keychain and hands it to the
# child process — never a plaintext secret exported into the shell by hand (marketplace gate, v3.206.0).

# Every CLI call runs with stdin closed and under a clock. A call that wants to ask something —
# `teams list` with stale credentials starts the login flow and waits for a key — gets EOF
# instead of a person, and dies after VC_TIMEOUT seconds instead of holding the session: one
# such call cost a two-minute background job on 2026-09-28. macOS has no `timeout`; perl does.
VC_TIMEOUT="${VC_TIMEOUT:-120}"
vc() {
  if command -v timeout >/dev/null 2>&1; then timeout "$VC_TIMEOUT" $VC "$@" </dev/null
  else perl -e 'alarm shift; exec @ARGV' "$VC_TIMEOUT" $VC "$@" </dev/null; fi
}
# The account is the last line of `whoami` — but only after the noise is gone:
# npx prints `npm notice …` lines and the CLI prints its own version banner, and
# either can land last. Taking `tail -1` raw once reported the account as
# "npm notice", and the same expression decides whether we are authenticated.
vc_clean() { grep -vE '^(npm |> |Vercel CLI )' | grep -v '^[[:space:]]*$' | tail -1; }
vc_whoami() { vc whoami 2>&1 | vc_clean; }

# Fails loudly on missing/expired credentials rather than letting a deploy die
# halfway. `vercel login` is interactive and opens a device-auth flow in a
# browser: an agent must never trigger it — the user runs it once, themselves.
# Note that read-only commands like `vercel project list` will START that flow
# on their own when credentials are stale, so gate every call behind this.
vc_require_auth() {
  local who rc
  who="$(vc whoami --non-interactive 2>&1 | vc_clean)"; rc=$?
  # The answer has to LOOK like an account: one word of the characters a Vercel username can
  # have. The old test only excluded known error words, and on 2026-09-28 a plugin's hint line
  # ("<claude-code-hint …>") that happened to come last was reported as "logged in as …" while
  # `vercel whoami` itself said "Logged out" — a silent pass straight into a failing deploy.
  if [ $rc -ne 0 ] || echo "$who" | grep -qiE 'error|not valid|no existing credentials|login|logged out' \
     || ! echo "$who" | grep -qE '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'; then
    echo "Vercel: not logged in (no credentials, or the stored token has expired)." >&2
    [ -n "$who" ] && echo "  whoami said: $(echo "$who" | cut -c1-80)" >&2
    echo "Run this yourself once, then re-run the command:" >&2
    echo "  npx vercel login" >&2
    echo "For a non-interactive credential, keep it in the keychain and launch through" >&2
    echo "auth-core-sumsub rather than exporting it into the shell:" >&2
    echo "  uv run --with auth-core-sumsub --with keyring python -m auth_core_sumsub \\" >&2
    echo "    --service vercel --secret token:VERCEL_AUTH:'Vercel token' -- <command>" >&2
    return 1
  fi
  echo "$who"
}

# What a respondent's browser gets at a URL: follows redirects (a prototype's own `/` → `/s1` is
# not a wall), and prints "<final code> <final url>". `000` when nothing answered.
vc_reach() { curl -s -L -o /dev/null -w '%{http_code} %{url_effective}' --max-time 20 "$1" 2>/dev/null || echo "000 $1"; }
# The verdict on that answer. A redirect that stays on the alias's own host is the prototype's
# routing; one that leaves it — vercel.com/login, sso-api — is the wall. On 2026-09-28 the old
# check read the prototype's own 307 as "a respondent gets a login wall".
#   vc_judge <asked url> <final code> <final url>   → prints one line, returns 0 when reachable
vc_judge() {
  local asked="$1" code="$2" final="$3" h1 h2
  h1=$(echo "$asked" | sed -E 's|^https?://([^/]+).*|\1|'); h2=$(echo "$final" | sed -E 's|^https?://([^/]+).*|\1|')
  case "$code" in
    200) if [ "$h1" = "$h2" ]; then
           [ "$final" = "$asked" ] || [ "$final" = "$asked/" ] || echo "  (it redirects to $final — the prototype's own routing)"
           echo "reachable without a login — this is the link to send."; return 0
         else echo "WARNING: $asked lands on $final — another host answered, not the prototype."; return 1; fi ;;
    401|403) echo "WARNING: the URL answers $code — a respondent gets a login wall, not the prototype."; return 1 ;;
    000) echo "WARNING: could not reach $asked at all (no network, or DNS has not propagated yet) — check it again before the session."; return 1 ;;
    *) if [ "$h1" != "$h2" ]; then echo "WARNING: $asked redirects away to $final ($code) — that is a login wall, not the prototype."
       else echo "WARNING: $asked answers $code — check it before the session."; fi; return 1 ;;
  esac
}
