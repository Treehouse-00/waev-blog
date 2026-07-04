# RUNBOOK.md — provisioning the Waev Growth OS on Claude Routines

Reproducible setup for the autonomous Growth OS loops, running as **Claude
Routines** — scheduled triggers that fire a fresh Claude Code cloud session in
an environment attached to this repo (claude.ai/code). Placeholders look like
`<THIS>` — replace them; never paste secret values into a committed file.

The Growth OS is a set of **scheduled cloud agents**. Each routine's prompt
tells the agent to read and execute a brief in `growth/briefs/` — the brief
stays the single source of truth for what the loop does, and the scheduler
stays a dumb trigger. Loops PROPOSE (PR / report); the only loop that merges
is the publish-pipeline routine executing CADENCE §3.12, and **no loop
deploys** — the existing date gate + deploy Actions
(`.github/workflows/deploy.yml`, `scheduled-publish.yml`) are what actually
ship merged posts.

`growth/CADENCE.md` §3 is the authority on which loops exist and when they
fire; this file only records how to register them on Claude. If CADENCE
changes, update the routines to match.

## 0. What runs where

| Concern | Runs on | Defined in |
| --- | --- | --- |
| All Growth OS loops (draft, edit, hero, merge, audits, reports) | Claude Routines (fresh session per firing) | §3 below |
| Deploy on push to `main` | GitHub Actions | `.github/workflows/deploy.yml` |
| Daily 13:00 UTC publish rebuild (date-gated launch, CADENCE §3.1) | GitHub Actions | `.github/workflows/scheduled-publish.yml` |
| Hero-present gate on content PRs (CHARTER gate 2) | GitHub Actions | `.github/workflows/hero-asset-check.yml` |
| Monthly metrics **fetch** (the secret-holding half of the analytics loop) | GitHub Actions | `.github/workflows/growth-metrics.yml` |

**Secrets stay in GitHub Actions, not in the Claude env.** The only loop that
needs credentials is the monthly analytics loop, and it is split in two: a
GitHub Actions job (`growth-metrics.yml` → `scripts/pull-growth-metrics.mjs`)
holds the secrets, pulls the raw numbers, and publishes a metrics JSON to the
orphan `growth-metrics` branch; the secret-free `waev-analytics-reporter`
routine then reads that JSON and writes the report. No API token ever reaches a
Claude session (§2).

**One trigger per loop.** The former Oz (`oz schedule`) deployment and the
`growth-weekly.yml` Action variant of the seo-auditor are superseded by the
routines below — decommission them (§6) so no loop has two triggers opening
duplicate PRs.

## 1. Create the environment

In **claude.ai/code → Environments**, create (or reuse) an environment for the
Growth OS:

- **Repository:** `<ORG>/waev-blog` (the canonical repo — routines act on it
  through Claude's GitHub integration, so no `gh` CLI or PAT is needed).
- **Setup script:** runs on container start so every loop begins ready to
  build and open PRs. Node 24 matches `.nvmrc` (Claude cloud images ship it).

  ```bash
  npm install --no-audit --no-fund
  # Needed only by the publish-pipeline routine (hero normalization):
  which magick || which convert || sudo apt-get install -y --no-install-recommends imagemagick
  ```

  Use `npm install`, not `npm ci`: a `package-lock.json` generated on macOS
  can omit Linux-native optional deps that `npm ci` strictly requires.
- **Network:** allow outbound HTTPS — the writer/editor/competitive loops
  verify claims via web search. (The analytics loop does NOT call any metrics
  API from the Claude env — that happens in CI, §2.)
- **Environment variables:** none required. No Growth OS routine reads a secret
  from the Claude env (§2).

Note the environment name/id — every routine in §3 is created **in this
environment** so its fresh sessions start with the repo cloned and deps
installed.

## 2. Secrets (GitHub Actions repo secrets — never in the Claude env)

**No secret is stored in the Claude environment.** The only credentials the
Growth OS needs are for the monthly metrics pull, and that pull runs in GitHub
Actions (`.github/workflows/growth-metrics.yml`), where the secrets are
injected only for the run. Add them under **Settings → Secrets and variables →
Actions** on the repo. Every one is optional — a missing secret just becomes a
`data-gap` in that month's metrics snapshot (never a fabricated number), and
`scripts/pull-growth-metrics.mjs` still exits cleanly.

| Repo secret | What it is |
| --- | --- |
| `GSC_SERVICE_ACCOUNT_JSON` | Google service-account key JSON (whole file contents); Search Console API enabled, read access to the `waev.app` property |
| `CF_ANALYTICS_TOKEN` | Cloudflare token with `Zone Analytics:Read` covering the `waev.app` zone (an `Account Analytics:Read` token that covers the zone also works) |
| `CF_ZONE_ID` | Zone id for `waev.app` (`zoneTag` in the north-star / blog-traffic queries) |
| `PERPLEXITY_API_KEY` | *(optional)* Perplexity sonar key for the AEO citation probe |

Referrer-host filtering used by the north-star metric requires a **paid**
Cloudflare plan (see `MEASUREMENT.md`); on a free plan that one metric records
`null` + a data-gap and everything else still pulls. `CF_ACCOUNT_ID` is **not**
needed — the zone-analytics GraphQL pulls key off `CF_ZONE_ID` alone.

Already present and separate: the deploy workflows' secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (same Actions secrets store)
power `deploy.yml` / `scheduled-publish.yml`; no Growth OS loop reads them.
`WARP_API_KEY` (Oz) can be deleted after §6.

### How the analytics loop gets its data (the split)

1. `growth-metrics.yml` fires monthly (1st, 15:00 UTC), runs the fetch script
   with the secrets above, and pushes `_metrics-<YYYY-MM>.json` to the orphan
   `growth-metrics` branch (never `main`, so no deploy is triggered).
2. One hour later the `waev-analytics-reporter` routine (§3, 16:00 UTC) — which
   holds no secrets — reads that snapshot, writes `growth/reports/<YYYY-MM>.md`,
   evaluates the thresholds, and opens any `calendar.yaml` PR.

If the fetch job has not run (or failed), the routine reports the data-gap and
opens no threshold PR — it never fetches or guesses.

## 3. Create the routines

One routine per CADENCE loop, except §3.11 + §3.12 which share the single
`waev-publish-pipeline` routine (the image-handler brief hands off to the
merge-runner brief in the same run, so a landed hero merges in the same hour
it is placed). All crons are UTC, mirror `growth/CADENCE.md` §3 verbatim, and
land **after** the 13:00 UTC scheduled-publish rebuild where order matters.
The hourly pipeline cron satisfies both the §3.12 hourly backstop and the
§3.11 max-latency bound (which was 2-hourly).

Create each routine either in the **claude.ai/code Routines UI** or from any
Claude session running in this environment (the session-side trigger tools
take the same fields). Every routine uses **fresh-session-per-firing** in the
§1 environment, with the exact name / cron / prompt below. Prompts are
standalone — a fresh session has no prior context.

| Routine | Cron (UTC) | CADENCE |
| --- | --- | --- |
| `waev-content-writer` | `0 14 * * 0,2,4` | §3.2 |
| `waev-editor` | `0 18 * * 0,2,4` | §3.10 |
| `waev-publish-pipeline` | `0 * * * *` | §3.11 + §3.12 |
| `waev-seo-auditor-weekly` | `0 14 * * 2` | §3.3 |
| `waev-competitive-monitor` | `0 14 * * 3` | §3.5 |
| `waev-analytics-reporter` | `0 16 1 * *` | §3.4 |
| `waev-seo-audit-monthly` | `0 15 1 * *` | §3.6 |

> The analytics routine runs at **16:00** on the 1st — one hour after its CI
> companion `growth-metrics.yml` (15:00) publishes the metrics snapshot it
> reads (§2). The 15:00 CADENCE §3.4 slot is the *fetch*; the *analysis* is
> offset so the snapshot exists when the routine runs.
| `waev-link-distribution` | `0 15 5 * *` | §3.7 |
| `waev-keyword-research` | `0 16 21 1,4,7,10 *` | §3.8 |
| `waev-competitive-deep-audit` | `0 16 28 2,5,8,11 *` | §3.9 |

Prompts (verbatim). Each begins with the same bootstrap sentence so a firing
survives an environment that did not pre-clone the repo:
`If the waev-blog repo is not already present in the workspace, clone
<ORG>/waev-blog first and run npm install.`

- **waev-content-writer** — `You are the Waev Growth OS content-writer loop
  (growth/CADENCE.md §3.2). In the waev-blog repo, read
  growth/briefs/content-writer.md and execute it end to end, including its
  internal orchestration. Invariants: propose via one draft PR only; never
  merge, never deploy, never post externally; leave npm run build green; if
  no calendar slot is due or an open PR already covers the due slot, no-op.`
- **waev-editor** — `You are the Waev Growth OS editor loop
  (growth/CADENCE.md §3.10). In the waev-blog repo, read
  growth/briefs/editor.md and execute it end to end, including its internal
  orchestration. Invariants: revise the branch and flip draft→ready only;
  never merge, never deploy; one PR per run; if no draft post PR awaits
  review, no-op.`
- **waev-publish-pipeline** — `You are the Waev Growth OS publish pipeline
  (growth/CADENCE.md §3.11 + §3.12). In the waev-blog repo, first read
  growth/briefs/image-handler.md and execute it, then read
  growth/briefs/merge-runner.md and execute it. Invariants: never deploy;
  never force-push, squash, or bypass required checks; only merge a ready,
  editor-approved growth/post-* PR whose human-provided hero asset is present
  and whose build is green; auto-resolve only the two known-safe conflict
  classes; a missing hero is a SILENT no-op (never mark it blocked — the
  human simply has not authorized yet); comment the blocked marker only for a
  red build, an unsafe conflict, or a failing required check, per the briefs.
  Most runs no-op — that is correct and cheap.`
- **waev-seo-auditor-weekly** — `You are the Waev Growth OS weekly link &
  crawl sweep (growth/CADENCE.md §3.3). In the waev-blog repo, read
  growth/briefs/seo-auditor.md and execute it at WEEKLY scope. Invariants:
  write the report under growth/reports/; a PR only for safe mechanical
  fixes; never merge, never deploy; check for an existing report/PR for this
  slot and no-op if found.`
- **waev-competitive-monitor** — `You are the Waev Growth OS weekly
  competitive watch (growth/CADENCE.md §3.5). In the waev-blog repo, read
  growth/briefs/competitive-monitor.md and execute it at WEEKLY scope
  (material changes since the prior report only). Invariants: report only;
  never post externally; no-op if this week's report already exists.`
- **waev-analytics-reporter** — `You are the Waev Growth OS monthly analytics
  reporter (growth/CADENCE.md §3.4). In the waev-blog repo, read
  growth/briefs/analytics-reporter.md and execute it. You hold NO secrets: read
  the pre-fetched metrics snapshot _metrics-<YYYY-MM>.json from the orphan
  growth-metrics branch (published by the growth-metrics.yml CI job) and analyze
  it; never fetch metrics yourself. Invariants: report + calendar PR only; never
  merge, never deploy; never invent a baseline; if the snapshot is missing
  report the data-gap and open no threshold PR; no-op if this month's report
  already exists.`
- **waev-seo-audit-monthly** — `You are the Waev Growth OS monthly full SEO
  audit (growth/CADENCE.md §3.6). In the waev-blog repo, read
  growth/briefs/seo-auditor.md and execute it at MONTHLY FULL-AUDIT scope
  (technical + content + structured data + llms.txt canon consistency; the
  calendar.yaml entry names the month's segment cluster). Invariants: report
  to growth/reports/audit-<YYYY-MM>.md plus one mechanical-fix PR at most;
  never merge, never deploy; no-op if this month's audit already exists.`
- **waev-link-distribution** — `You are the Waev Growth OS monthly
  distribution prep (growth/CADENCE.md §3.7). In the waev-blog repo, read
  growth/briefs/link-distribution.md and execute it. Invariants: report only —
  drafts and target venues; NEVER post to any external community, forum, or
  social channel (human-approval gate); no-op if this month's report already
  exists.`
- **waev-keyword-research** — `You are the Waev Growth OS quarterly keyword
  roadmap refresh (growth/CADENCE.md §3.8). In the waev-blog repo, read
  growth/briefs/keyword-research.md and execute it. Invariants: one PR
  editing only growth/calendar.yaml and growth/keyword-map.md — no post
  bodies; never merge, never deploy; no-op if this quarter's refresh PR
  already exists.`
- **waev-competitive-deep-audit** — `You are the Waev Growth OS quarterly
  competitive deep audit (growth/CADENCE.md §3.9). In the waev-blog repo,
  read growth/briefs/competitive-monitor.md and execute it at QUARTERLY
  DEEP-AUDIT scope (full positioning review vs. the competitive set, to
  growth/reports/competitive-deep-<YYYY-Qn>.md). Invariants: report only;
  never post externally; no-op if this quarter's deep audit already exists.`

Enable **completion notifications** (push and/or email) so failed or
noteworthy runs surface without polling — fresh-session routines only notify
when a run ends with something noteworthy, so the hourly pipeline's no-op
runs stay quiet.

> **Provisioned state (2026-07-04):** all ten routines above were created in
> environment `env_01NikYkL9rtvfCZMWwSQo6hw` with push notifications on, and
> left **disabled**. The `growth-metrics.yml` CI companion (§2) ships in this
> same change and needs no enabling — it runs on its own Actions cron once the
> branch is on `main` and the repo secrets are set. Enable the routines
> (Routines UI toggle) only after (a) this
> runbook's branch is merged to `main` so firings read the current briefs,
> and (b) the old Oz schedules are decommissioned (§6).

## 4. Inspect & operate

- **Routines UI** (claude.ai/code → Routines): last run per routine, run
  history, pause/resume, edit cron/prompt, run now.
- From any Claude session in the environment, the trigger tools do the same:
  list routines, enable/disable, update cron, delete.
- **Pause during a content freeze** by disabling the routine (keep it stored);
  delete only when retiring a loop — and update `CADENCE.md` §3 first, which
  is a human-gated change (CADENCE §4).
- Each firing is an ordinary Claude Code session — open it from the run
  history to read the full transcript when a loop misbehaves.

## 5. One-off / manual trigger

To run a loop immediately without waiting for its cron (e.g. to test a brief
edit): **Run now** on the routine in the Routines UI, or fire the trigger
from any Claude session in the environment. You can attach a one-line note to
a manual firing (e.g. `Process PR #81 first`) — it arrives as an extra
message after the routine's prompt.

**The instant-publish path:** after you drag-and-drop a post's hero image
into its PR comment (CHARTER gate 2 — that act is the publish authorization),
fire `waev-publish-pipeline` manually and the image lands + the PR merges
within minutes instead of at the top of the hour. The hourly cron remains the
backstop, so doing nothing is also fine.

## 6. Decommission the previous run-systems (one-time)

Do this once the routines above are live, so each loop has exactly one
trigger:

1. **Oz schedules:** `oz schedule list --output-format text`, then
   `oz schedule delete <SCHEDULE_ID>` for every `waev-*` schedule. Optionally
   delete the Oz environment and secrets (`oz secret list`).
2. **`growth-weekly.yml`:** removed from `.github/workflows/` in the same
   change that introduced this runbook (it was the Action variant of the
   weekly seo-auditor).
3. **Repo secret `WARP_API_KEY`:** delete from Settings → Secrets → Actions.
4. Keep `deploy.yml`, `scheduled-publish.yml`, and `hero-asset-check.yml` —
   they are the deploy/publish/gate layer, not Growth OS loops (§0).

## Notes & invariants

- Loops PROPOSE only. They open PRs or write `growth/reports/*`; the
  publish-pipeline routine merges **only** a hero-present, editor-approved
  content post (the human's hero image is the authorization — CHARTER
  gate 2), and nothing here deploys: merge → `deploy.yml` → date gate →
  `scheduled-publish.yml` is the only path to production.
- No loop posts to external communities autonomously (CHARTER gate 3).
- One trigger per loop — never run a routine and a leftover Oz schedule or
  Action for the same brief in parallel (duplicate PRs).
- Never commit secret values. Environment variables (§2) are the only store;
  this repo holds none.
- The writer and editor briefs define their own internal agent orchestration
  (parallel research / adversarial verification). That happens **inside** a
  single routine firing — it needs no extra scheduling here.
- Replace every `<PLACEHOLDER>`: `<ORG>`, ids/names of your environment.
