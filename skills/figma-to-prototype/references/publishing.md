# Publishing a prototype

A prototype for a moderated test usually has to be a link: the respondent joins
a call, opens a URL, and starts clicking. Vercel serves a static file well, and
the whole deliverable is one static file.

## The two rules that come before any command

**Publishing is outward-facing.** It puts the content on the public internet
under a URL anyone holding it can open, and it can be cached or indexed
elsewhere even after deletion. Publish only when the user asks in this session,
and say what went where afterwards. Never publish a prototype containing real
customer data, real names, real document images or anything from a production
account — a prototype is fabricated data by construction, and if it is not,
raise that before publishing rather than after.

**Offer, do not act.** "Only when asked" has a failure mode: the user carries the
job of remembering, and a stale link sits in front of a respondent because
nobody said the word. So take the reminding, not the deciding — when a chunk of
work is finished *and verified*, end the reply with one line ("done — publish?")
and publish on a yes. One line, not a paragraph, and never in the middle of a
task: an intermediate state that has not passed verification is exactly what
must not be on a public URL.

The reason this stays an offer rather than a default is worth stating to the
user when it comes up: a re-publish swaps the content at the same URL
immediately, and from inside a session there is no way to see whether someone
has the prototype open right now. Automatic publishing means changing the build
under a respondent mid-interview.

**Deleting is destructive and irreversible.** The URL dies immediately, mid-test
if someone is in it. Confirm before running it, even when a previous delete was
approved: approval does not carry from one round to the next.

## Publish

```bash
scripts/publish.sh prototype.html --project sdk-flow-test --scope <team>
```

The script creates the project if it does not exist yet — `vercel deploy
--project <slug>` fails with `project_not_found` rather than creating one — then
stages the file as `index.html`, adds a `vercel.json` that sets
`Cache-Control: must-revalidate` and `X-Robots-Tag: noindex, nofollow`, deploys
to production, prints the **stable project URL** (`https://<slug>.vercel.app`,
resolved from the deployment's aliases — the URL `deploy` itself prints carries
a build hash and changes every time, so it is the wrong one to send anybody),
and warns if deployment protection would block a respondent. `--dry` inspects the payload without uploading; `--password <pw>`
turns on Vercel's password protection where the plan allows it.

Choose the project slug once and reuse it for every round. Re-publishing the
same slug **replaces the content at the same URL**, so the link you sent last
week keeps working — that is usually what a research schedule needs. Use a new
slug only when two versions must exist side by side (an A/B round), and then say
in the handoff which slug is which.

`--scope` matters: the team decides where the project lands and who can see it
in the dashboard. A personal-account deploy that should have been on the team
is invisible to everyone else and cannot be handed over.

## The trap that ruins a session

**Deployment protection.** With SSO protection on — the default on many team
accounts — anyone outside the team gets a login wall instead of the prototype.
The respondent cannot get in, and you find out during the call.

```bash
npx vercel project protection <slug>                 # show
npx vercel project protection disable <slug> --sso   # off, link works for anyone
```

**But do not decide from that setting.** Protection is per URL kind, and the
project setting reads as one word for two different answers. Measured on a live
project whose setting was `ssoProtection: all_except_custom_domains`:

| URL | anonymous GET |
|---|---|
| production alias `https://<slug>.vercel.app` | **200**, serves the prototype |
| build-hash URL `https://<slug>-<hash>-<team>.vercel.app` | **302** to a login |

So "protection is ON" was true and the respondent's link was fine at the same
time. An agent that trusts the setting goes and turns SSO off for the team —
an outward-facing settings change made on a misreading. This is also the second
reason never to send the URL `deploy` prints: it is not only build-specific, it
is the walled one.

**Ask the URL, not the setting.** A credentialless request is exactly what the
respondent's browser is, and it costs nothing:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<slug>.vercel.app/   # want 200
curl -s https://<slug>.vercel.app/ | head -c 300                       # want your <title>
```

`publish.sh` does both and prints the code next to each URL. Report the result;
do not ask the user to verify what you can verify.

Password protection is the middle ground when a public link is unacceptable —
one shared password, told to the respondent at the start of the call. It is a
paid-plan feature; the script reports if enabling it failed instead of silently
continuing.

## Unpublish

```bash
scripts/unpublish.sh --list --scope <team>                                  # what exists
scripts/unpublish.sh sdk-flow-test --confirm sdk-flow-test --scope <team>   # delete
```

The script deletes the **project** along with every deployment under it — there
is no "clear the deployments but keep the project" mode. To drop one build while
leaving the project alive, pass that build's own URL to `vercel remove` instead.

The slug must be typed twice and both must match — the guard exists because an
agent inferring a slug from context and deleting the wrong project is a
plausible failure, and an unrecoverable one. Afterwards the script *checks*
rather than claims: `project inspect` must fail and the URL must return 404, and
it prints the status code it actually got.

## Authentication

`vercel login` is an interactive browser device flow. **An agent must not
trigger it** — and it is easy to trigger by accident, because ordinary read-only
commands like `vercel project list` start the login flow themselves when
credentials have gone stale. Every call in these scripts is therefore gated
behind an auth check that fails with instructions instead.

The user runs, once:

```bash
npx vercel login
```

Or exports a token from vercel.com/account/tokens as `VERCEL_TOKEN`. Tokens
expire; "the deploy suddenly asks me to log in" is an expiry, not a bug. Never
print the token, and never write it into a project file.

## What it costs

The commands are nearly free; the whole cost of a round is the one or two
screenshots of the live page, and those answer the question an HTTP code cannot
— **is this the build I think it is**. Aim them at something that changed in
this round: the first screen, plus one click deeper into your newest work.

## Where the slug and the scope come from

Do not invent either, and do not ask the user for what the account already
knows:

```bash
npx vercel teams list                      # the team slug for --scope
npx vercel project list --scope <team>     # every project, with its production URL
```

The previous round's project is in that list with its URL and its age, which is
also how you find out that a prototype from a past session is still live beside
the one you are about to publish. Say so when it is — two live URLs with similar
names is how a respondent ends up testing last month's build.

## What to hand back

After a publish, report the URL, the project slug, the scope, whether protection
is on, and that the link is unlisted rather than secret. Put the slug and the
URL in the handoff document — otherwise the next session cannot update the
prototype the respondents are looking at, and will publish a second one beside
it.
