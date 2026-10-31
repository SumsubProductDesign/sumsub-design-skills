# Publishing a prototype

A prototype for a moderated test usually has to be a link: the respondent joins
a call, opens a URL, and starts clicking. Vercel serves a static file well, and
the whole deliverable is one static file.

## Contents

- The two rules that come before any command
- Which host
- Publish
- The trap that ruins a session
- Unpublish
- As a claude.ai artifact
- As an internal page, for employees
- Authentication
- What it costs
- Where the slug and the scope come from
- What to hand back
- Step 9 in full — publish, when asked

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
work is finished *and verified*, end the reply with one line ("done — keep it
local, or publish?"); on a yes the audience is the form of § Which host, then
the publish. **The offer must not answer its own question**: a button or reply
text the skill writes ("publish it for the respondents") is not the person
naming the audience — run 21 wrote that button, read the click as "outside the
company" and deployed with no form. Either the offer names no audience and no
host, or its buttons are exactly the two audiences and "not now", so the click
itself is the person's answer. And the script holds the line when the text
does not: `publish.sh` refuses to run without `--for outside`, prints the
question instead, and refuses `--for colleagues` by name — that audience is the
publish-page skill's. One line, not a paragraph, and never in the middle of a
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

## Which host

The audience decides where a link goes, and the person decides the audience:

| | **people outside the company** — Vercel (`publish.sh`) | **colleagues** — beautiful-pages, the internal GitLab Pages site (`/publish-page:publish-page`) | claude.ai artifact (the Artifact tool), only when named |
|---|---|---|---|
| who can open it | anyone holding the URL — a respondent from outside the company | anyone on the corporate VPN; no per-page access control | private to the author until they share it; then the people they share it with, inside claude.ai |
| right for | a moderated interview with a client | a demo to the team, a review, a page colleagues keep coming back to | a review inside claude.ai, when the person asks for an artifact |
| goes live | on the deploy | once a person merges the request the upload opened | on the publish |
| updates | the same slug replaces the content at the same URL | the same owner and slug open a new request that replaces the folder | the same file path republishes to the same URL |
| taken down | `unpublish.sh` | **never** — a page is only replaced, the upload is the irreversible step | the Artifact tool's delete |
| limit | none that a prototype meets | **1 MB per HTML file**, 10 MB a folder, no external resource but Google Fonts | **16 MB for the page**, base64 plates included |

**Ask who will open the link whenever the request does not name where** — one
form, "Who will open the link to the prototype?", its options the two
audiences — *people outside the company*: an open link on Vercel for clients
and respondents, no VPN; *colleagues*: a link on beautiful-pages, opens only on
the corporate VPN, for any employee — the one the purpose points at marked
recommended: an interview with a client → outside; a demo or a review →
colleagues. The purpose narrows the
recommendation; it does not answer for the person. On the 2026-10-26 eval run
the purpose was an interview, the person said "publish", and the prototype went
to Vercel on that word alone — a project created in the team's account, open to
anyone with the link — where the team's own page was meant. The hosts differ in
who can open the page and in whether it can ever come down; the form costs
nothing. Everything below up to § Unpublish is Vercel; § As an internal page,
for employees and § As a claude.ai artifact are the others.

## Publish

```bash
scripts/publish.sh prototype.html --project sdk-flow-test --scope <team> --for outside
scripts/publish.sh _work/site --project sdk-flow-test --scope <team> --spa   # a History-API prototype
```

**`--spa` for a prototype that routes with the History API** (`/s1`,
`/registry/x`): every path is served `index.html`, so a deep link or a reload
does not 404. A directory's own `vercel.json` is kept and merged — its
redirects and rewrites stay, the cache and robots headers are added. An
overwritten `vercel.json` is how a History-API prototype loses its rewrites and
404s on every deep link. `cleanUrls` is dropped when a rewrite is present: together
they 404 every route. `--dry` prints the `vercel.json` that would go up.
Locally the same prototype runs under `SPA=1 node scripts/serve.cjs` (or `"env":{"ROOT":".","SPA":"1"}` in `.claude/launch.json`).

The script creates the project if it does not exist yet — `vercel deploy
--project <slug>` fails with `project_not_found` rather than creating one — then
stages the file as `index.html`, adds a `vercel.json` that sets
`Cache-Control: must-revalidate` and `X-Robots-Tag: noindex, nofollow`, deploys
to production, prints the **stable project URL** (`https://<slug>.vercel.app`,
resolved from the deployment's aliases — the URL `deploy` itself prints carries
a build hash and changes every time, so it is the wrong one to send anybody),
and warns if deployment protection would block a respondent. `--dry` inspects the payload without uploading; `--password <pw>`
turns on Vercel's password protection where the plan allows it.

**The link to send is `https://<slug>.vercel.app` and nothing else.** A
deployment carries other aliases — the build-hash URL, and on a team account
`<slug>-<team>.vercel.app`, which is SSO-walled. The script reports the
project's own domain only; when it is not among the aliases it says so, lists
them and reports the build URL rather than guess. "The shortest alias" is not
a rule: on a team account it becomes the walled team alias after a few
publishes, and the reported link flips between rounds.

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

`publish.sh` does both and prints the code next to each URL — **following
redirects**: a prototype's own `/` → `/s1` lands on the same host and is
routing; a hop to `vercel.com/login` is the wall. Read without following
redirects, a prototype's own 307 looks exactly like a wall. Report the result; do not ask the
user to verify what you can verify.

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

## As a claude.ai artifact

The Artifact tool wraps the page in its own document skeleton, and its viewer
expects a page that works at phone width without scrolling sideways. A
prototype is neither: it is a whole document, and its canvas is a fixed 1440.
Do not strip it by hand — on 2026-10-02 that was done from memory, twice, and
the published pages were never opened in the viewer. Build as always, then:

```bash
scripts/artifact-page.js prototype.html _work/artifact/prototype.html   # what gets published
scripts/statecheck.sh _work/artifact/prototype.html --size 1440x900 --hits auto
```

`artifact-page.js` keeps the `<title>` and every style and script of the head,
drops the document tags, wraps the body in a box that scrolls sideways (the
page never does, the canvas keeps its width), gives the page the canvas colour so
the viewer's dark mode shows no dark frame around a light product, and prints
the size against 16 MB — exit 1 above it. The hit test runs on **that** file,
not on the prototype, because it is the one the viewer shows.

Publish `_work/artifact/prototype.html` with the Artifact tool, and keep
publishing **the same path** every round: a different path is a second URL. Then
**open the URL in the browser pane** and walk the first task with real clicks
(`computer` → `left_click` at the control, not `javascript_tool`): the viewer
shows the page inside claude.ai's own frame, where a script in the tab may not
reach it, and a real click is the only check of the thing people will actually
use. One screenshot of the
first screen and one of the newest state.

What to hand back is the same as for Vercel, minus the scope: the URL, that it is
private until shared, and the source path that republishes it.

## As an internal page, for employees

The page colleagues open is Sumsub's internal GitLab Pages site, beautiful-pages:
it opens only on the corporate VPN, and there any employee can read it. The
`/publish-page:publish-page` skill (the internal marketplace) is the way in —
load it through the Skill tool and follow it; this section says only what a
prototype has to know before handing its files over.

* **Its own gate comes first.** The skill confirms the audience with the person
  before any upload, separately from the build's approval. That is not this
  skill's Step 0 answer repeated: it is theirs to give again, because the upload
  is the irreversible step — the content is a commit anyone with repository
  access can read the moment the command returns, and **there is no unpublish
  and no delete**: a page is only ever replaced by the next upload under the
  same owner and slug.
* **The address is `<owner>/<slug>`.** The owner is the team's folder — propose
  `design` and the prototype's slug, the person may want the URL otherwise; a
  different owner or slug later is a second page, the first keeps serving.
* **1 MB per HTML file, 10 MB a folder, nothing loaded from outside but Google
  Fonts.** A prototype under 1 MB goes as the one file it is. One above it goes
  as a folder: `weight.cjs` says which plates carry the megabytes, those are
  written beside the page as `.png` / `.webp` files (never `.svg` — the site's
  check rejects every SVG asset; vectors stay inline) and referenced by bare
  file name — the upload puts every non-HTML file under `assets/` and strips any
  folder from the name, so the page references `assets/<name>`. Rule 1 (one
  self-contained file) bends for this host alone, and the ledger says so.
* **Live after the merge, not after the upload.** Hand back the request's link
  and the page URL, and say that the page opens once a person merges; then open
  the URL on the VPN and walk the first task with real clicks, as for any host.
  Both links go in the handoff's § Published URL.

## Authentication

Every CLI call the scripts make runs with stdin closed and under a two-minute
clock (`VC_TIMEOUT`): a call that wants to ask something — `teams list` with
stale credentials starts the login flow and waits for a key — gets EOF and dies
instead of holding the session. One such call cost a two-minute background job
on 2026-09-28. Run `npx vercel …` by hand the same way: `</dev/null`.

`vercel login` is an interactive browser device flow. **An agent must not
trigger it** — and it is easy to trigger by accident, because ordinary read-only
commands like `vercel project list` start the login flow themselves when
credentials have gone stale. Every call in these scripts is therefore gated
behind an auth check that fails with instructions instead.

The user runs, once:

```bash
npx vercel login
```

The CLI keeps its own credential; the scripts never see it. A non-interactive credential — a
shared machine, CI — lives in the keychain and reaches the command through the corporate
**`auth-core`** launcher (`claude plugin install auth-core@sumsub-internal-marketplace`): on
first run it asks for the secret once and stores it, afterwards it injects it into the child
process for that one command. `scripts/_vercel.sh` prints the exact invocation when it finds no
credentials. Never export a token into the shell by hand — the marketplace refuses a skill that
does, and the secret leaks to every later command of the session. Credentials expire: "the
deploy suddenly asks me to log in" is an expiry, not a bug. Never print one, never write it
into a project file.

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

## Step 9 in full — publish, when asked

A remote moderated session needs a link, and the deliverable is one static file,
so this is one command on Vercel — or, for a demo to the team, a claude.ai
artifact made from the build by `scripts/artifact-page.js`
(`references/publishing.md` § Which host, § As a claude.ai artifact):

```bash
scripts/publish.sh prototype.html --project <slug> --scope <team> --for outside
scripts/unpublish.sh <slug> --confirm <slug> --scope <team>   # after the round
```

Three things decide whether this goes well, and all three are in
`references/publishing.md`:

* **Publishing is outward-facing and deleting is irreversible.** Both happen
  only when the user asks in this session, and an approval for one round does
  not carry to the next.
* **The app may stop the deploy for a permission, in any mode.** A publish is a
  public surface, and the harness can hold `publish.sh` until the person allows
  it even when they asked for the publish in chat. Hand them the command, or
  ask once for the permission; never retry the deploy around it.
* **Deployment protection is the trap.** With SSO on, a respondent outside the
  team hits a login wall instead of the prototype, and you learn this during the
  call. The script asks the URL anonymously; then open it once yourself.
* **A published page is checked where it is published.** Run the hit test on
  the file that goes out, then open the URL itself and walk the first task with
  real clicks — a local copy in a wrapper is not the page the viewer shows.
* **`vercel login` is an interactive browser flow an agent must not trigger.**
  The scripts gate every call behind an auth check that fails with instructions
  instead.

The slug and the URL go in the handoff, or the next session publishes a second
prototype next to the live one.
