# RUNBOOK.md — provisioning the Waev Growth OS on Oz

Reproducible, copy-pasteable setup for the autonomous Growth OS loops. Run
these once from a terminal that has the `oz` CLI installed and authenticated
(`oz help` to verify). Placeholders look like `<THIS>` — replace them; never
paste secret values into a committed file.

The Growth OS is a set of **scheduled cloud agents**. Each loop is one
`oz schedule` whose prompt tells the agent to read and execute a brief in
`growth/briefs/`. Agents only ever PROPOSE (PR / report) — the existing date
gate + deploy Action (`.github/workflows/scheduled-publish.yml`) is what
actually ships merged posts. No loop here deploys.

## 0. Prerequisites

```bash
oz help                       # confirm the CLI is installed + authenticated
oz environment list --output-format text
oz schedule list --output-format text
```

You also need: a Google Cloud service account with the Search Console API
enabled and granted read access to the `waev.app` property; a Cloudflare API
token with `Zone Analytics:Read` covering the `waev.app` zone (an
`Account Analytics:Read` token that covers the zone also works); (optional) a
Perplexity API key for the AEO metric. Referrer-host filtering used by the
north-star metric requires a **paid** Cloudflare plan (see `MEASUREMENT.md`).

## 1. Create the environment

The environment checks out THIS repo and installs deps so every loop starts
ready to build and open PRs. Node 24 matches `.nvmrc`.

```bash
oz environment create \
  --name "waev-growth-os" \
  --docker-image "warpdotdev/dev-web:latest-agents" \
  --repo "<ORG>/waev-blog" \
  --setup-command "cd /workspace/waev-blog && npm install --no-audit --no-fund" \
  --output-format text
# -> note the returned ENV_ID, e.g. UA17BXYZ. Used below as <ENV_ID>.
```

`--repo` takes `owner/repo` (not a URL) and may be repeated. `--docker-image`
(`-d`) is the image flag. Two gotchas, both learned the hard way:
- The setup command does **not** run from the repo root — the repo clones to
  `/workspace/<repo>`, so the command must `cd` there first or `npm` finds no
  `package.json` and fails in ~5s. `dev-web:latest-agents` already ships Node 24,
  so no `nvm` step is needed.
- Use `npm install`, not `npm ci`: a `package-lock.json` generated on macOS can
  omit the Linux-native optional deps that `npm ci` strictly requires, so `npm
  ci` fails on the Linux image while `npm install` resolves them.
Confirm:

```bash
oz environment get <ENV_ID> --output-format text
```

## 2. Set required secrets

Secrets are stored by Oz, never in the environment or this repo. Provide each
from a file so the value never lands in shell history. The cloud agent reads
them as environment variables of the same name (see `MEASUREMENT.md` pulls).

```bash
# Google Search Console — service-account JSON (the whole key file):
oz secret create GSC_SERVICE_ACCOUNT_JSON --team \
  --value-file ./gsc-service-account.json \
  --description "GSC API service account for the analytics-reporter loop"

# Cloudflare Analytics (north-star + blog traffic):
oz secret create CF_ANALYTICS_TOKEN --team \
  --value-file ./cf-analytics-token.txt \
  --description "Cloudflare Account Analytics:Read token"

# Cloudflare account id:
oz secret create CF_ACCOUNT_ID --team \
  --value-file ./cf-account-id.txt \
  --description "Cloudflare account id for GraphQL analytics"

# Cloudflare zone id for waev.app (needed by the north-star referral query):
oz secret create CF_ZONE_ID --team \
  --value-file ./cf-zone-id.txt \
  --description "Cloudflare Zone ID for waev.app (zoneTag in GraphQL analytics)"

# Optional — answer-engine (AEO) probe metric:
oz secret create PERPLEXITY_API_KEY --team \
  --value-file ./perplexity-key.txt \
  --description "Perplexity sonar key for AEO citation probing"
```

Then delete the local key files: `rm ./gsc-service-account.json
./cf-analytics-token.txt ./cf-account-id.txt ./cf-zone-id.txt ./perplexity-key.txt`.

Verify (names only — values are never printed):

```bash
oz secret list --output-format text
```

## 3. Create the recurring loops

One `oz schedule` per loop defined in `growth/CADENCE.md`. Each prompt is the
same minimal shape — read a brief and execute it — so the brief stays the
single source of truth for what the agent does. All crons are UTC and chosen
to land **after** the 13:00 UTC scheduled-publish rebuild where order matters.

Crons below mirror `growth/CADENCE.md` §3 verbatim — CADENCE is the authority on
which loops exist and when; if it changes, update these to match.

```bash
# Content drafting — Sun/Tue/Thu 14:00 UTC, the 3×/week grid (CADENCE §3.2).
oz schedule create \
  --name "waev-content-writer" \
  --cron "0 14 * * 0,2,4" \
  --prompt "Read growth/briefs/content-writer.md and execute it." \
  --environment <ENV_ID>

# Editorial review — Sun/Tue/Thu 18:00 UTC, ~4h after drafting (CADENCE §3.10).
# The internal review cycle: independently fact-checks + revises each draft post
# PR and flips it draft→ready, so the human gate is a cursory gut-check + the
# hero-image pass only. Runs after content-writer on the same days.
oz schedule create \
  --name "waev-editor" \
  --cron "0 18 * * 0,2,4" \
  --prompt "Read growth/briefs/editor.md and execute it." \
  --environment <ENV_ID>

# Weekly SEO link & crawl sweep — Tuesdays 14:00 UTC (CADENCE §3.3).
oz schedule create \
  --name "waev-seo-auditor" \
  --cron "0 14 * * 2" \
  --prompt "Read growth/briefs/seo-auditor.md and execute it." \
  --environment <ENV_ID>

# Weekly competitive watch — Wednesdays 14:00 UTC (CADENCE §3.5).
oz schedule create \
  --name "waev-competitive-monitor" \
  --cron "0 14 * * 3" \
  --prompt "Read growth/briefs/competitive-monitor.md and execute it." \
  --environment <ENV_ID>

# Monthly analytics report + thresholds — 1st of month 15:00 UTC (CADENCE §3.4).
oz schedule create \
  --name "waev-analytics-reporter" \
  --cron "0 15 1 * *" \
  --prompt "Read growth/briefs/analytics-reporter.md and execute it." \
  --environment <ENV_ID>

# Monthly distribution prep — 5th of month 15:00 UTC (CADENCE §3.7).
oz schedule create \
  --name "waev-link-distribution" \
  --cron "0 15 5 * *" \
  --prompt "Read growth/briefs/link-distribution.md and execute it." \
  --environment <ENV_ID>

# Quarterly keyword roadmap refresh — 21st Jan/Apr/Jul/Oct 16:00 UTC (CADENCE §3.8).
oz schedule create \
  --name "waev-keyword-research" \
  --cron "0 16 21 1,4,7,10 *" \
  --prompt "Read growth/briefs/keyword-research.md and execute it." \
  --environment <ENV_ID>

# Editorial review — Sun/Tue/Thu 18:00 UTC, ~4h after content drafting (CADENCE §3.10).
# The internal review cycle: fact-checks + revises draft post PRs, then flips draft->ready
# so the human gate is a cursory gut-check + hero-image pass only.
oz schedule create \
  --name "waev-editor" \
  --cron "0 18 * * 0,2,4" \
  --prompt "Read growth/briefs/editor.md and execute it." \
  --environment <ENV_ID>
```

> `growth/CADENCE.md` §3 also defines the monthly full SEO audit (§3.6, reuses
> `seo-auditor.md`) and the quarterly competitive deep audit (§3.9, reuses
> `competitive-monitor.md`). Register those the same way if you want them on a
> separate cron from their weekly counterparts. Keep CADENCE.md as the single
> authority on the loop set and crons.

## 4. Inspect & operate

```bash
oz schedule list --output-format text          # all loops + most recent run
oz schedule get <SCHEDULE_ID> --output-format text
oz run list --output-format text               # recent runs across loops
oz run get <RUN_ID> --output-format text       # one run's detail + output

# JSON for scripting / dashboards:
oz run list --output-format json | jq '.[] | {id, status, created_at}'
```

To pause/remove a loop (e.g. during a content freeze):

```bash
oz schedule delete <SCHEDULE_ID>
```

## 5. One-off / manual trigger

To run a loop immediately without waiting for its cron (e.g. to test a brief
edit):

```bash
oz agent run-cloud \
  --environment <ENV_ID> \
  --prompt "Read growth/briefs/seo-auditor.md and execute it."
# -> Spawned agent with run ID: <RUN_ID>;  then: oz run get <RUN_ID>
```

## Notes & invariants
- Loops PROPOSE only. They open PRs or write `growth/reports/*`; a human merge
  publishes. Distribution to external communities is a separate
  human-approval gate — no loop posts to communities autonomously.
- The weekly seo-auditor also runs as a GitHub Action variant in
  `.github/workflows/growth-weekly.yml` (uses `secrets.WARP_API_KEY`) for
  teams that prefer CI-cron over `oz schedule`. Pick one trigger per loop to
  avoid duplicate PRs.
- Never commit secret values. `oz secret` is the only store; environments and
  this repo hold none.
- Replace every `<PLACEHOLDER>`: `<ORG>`, `<ENV_ID>`, `<SCHEDULE_ID>`,
  `<RUN_ID>`.
