# MEASUREMENT.md — Waev Growth OS metrics & decision rules

This document is executed by the **analytics-reporter** agent (see
`./briefs/analytics-reporter.md`). It defines every metric the Growth OS
tracks, the exact data source, the API call an autonomous agent uses to pull
it, the monthly report template, and the numeric thresholds that trigger a
change to `./calendar.yaml` or `./STRATEGY.md`.

It is written for an LLM agent reader. Prefer the structured rules below over
judgement. Where a value cannot be pulled programmatically, the metric is
marked `MANUAL-GATE` and the agent records `null` rather than guessing.

## Identifiers (fill once, then treat as canon)

```yaml
# growth/measurement.config — referenced by the analytics-reporter brief.
gsc_property: "sc-domain:waev.app"        # GSC property (domain property recommended)
gsc_page_filter: "https://blog.waev.app/" # restrict Search Console rows to the blog
cf_zone_tag: "<CF_ZONE_ID>"               # Cloudflare *Zone ID* (hex) for the waev.app zone.
                                          # blog.waev.app is a subdomain inside this zone, so
                                          # the GraphQL `zoneTag` is this ID — NOT a hostname.
                                          # If the app is served from a *different* Cloudflare
                                          # zone than the blog, add cf_app_zone_tag and use it
                                          # for the north-star query below.
cf_blog_host: "blog.waev.app"             # blog rows: filter by clientRequestHTTPHost
cf_app_host: "waev.app"                   # app host the blog refers readers into
cloudflare_account_id: "<CF_ACCOUNT_ID>"  # from env, not committed
report_window_days: 28                    # GSC data is ~2-3 days delayed; use a 28-day window
```

## North-star metric

The Charter (`./CHARTER.md`) defines the north star as **qualified operator
activations** — operators who connect their own broker and view their live
network. That is an app-side event and is not yet instrumented. Until it is,
the Growth OS optimizes its **measurable proxy**:

**Qualified blog→app referrals per 28-day window** — the count of Cloudflare
*visits* on `waev.app` whose referrer host is `blog.waev.app`. It is the closest
blog-observable signal that content moves the full audience — from mesh-curious
tinkerers/makers to mission-critical operators (ham, CERT/EmComm, off-grid) —
toward the product, not just that it attracts
traffic. When activation instrumentation lands, this proxy is superseded by the
activation count and this section is updated (a `STRATEGY.md`-level change).

- **Source:** Cloudflare *zone* analytics — `httpRequestsAdaptiveGroups` via the
  GraphQL Analytics API, the `waev.app` zone (`cf_zone_tag`). This is server-side
  edge data, not RUM: it needs no JS beacon, so it is compatible with the
  near-zero-JS blog (a RUM/Web-Analytics beacon would not fire reliably here).
- **Why this and not raw pageviews:** pageviews reward generic traffic; the
  north-star rewards traffic that is the *right* audience and intent. Awareness
  and evaluation metrics below are leading indicators of it.

### How the agent pulls it

```bash
# Cloudflare GraphQL Analytics API. CF_ANALYTICS_TOKEN scope: "Zone Analytics:Read"
# covering the waev.app zone (or an Account Analytics:Read token that covers it).
# `requestSource:"eyeball"` excludes Cloudflare-internal/bot traffic; we count app-host
# requests whose referrer host is the blog. `count` = sampled requests; `sum{visits}` =
# Cloudflare "visits" (a pageview whose referer host differs from the page host) — the
# closer proxy for a real blog->app handoff. Use `visits`; keep `count` as a sanity check.
# Replace the three placeholders below; hosts match cf_app_host / cf_blog_host.
curl -s https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $CF_ANALYTICS_TOKEN" \
  -H "Content-Type: application/json" \
  --data @- <<'JSON'
{ "query":
  "query($zoneTag:String!,$since:Time!,$until:Time!){viewer{zones(filter:{zoneTag:$zoneTag}){httpRequestsAdaptiveGroups(limit:1,filter:{datetime_geq:$since,datetime_leq:$until,requestSource:\"eyeball\",clientRequestHTTPHost:\"waev.app\",clientRefererHost:\"blog.waev.app\"}){count sum{visits}}}}}",
  "variables": { "zoneTag": "<CF_ZONE_ID>", "since": "<ISO8601-START>", "until": "<ISO8601-END>" } }
JSON
```

Two conditions make this metric `MANUAL-GATE` (record `null` + a `data-gap`
note; never fabricate a value):
- **Plan limit:** `clientRefererHost` filtering is available on **paid** Cloudflare
  plans only. On a free plan the referrer filter returns an error → `MANUAL-GATE`.
- **Reachability:** the app zone is not covered by this token's credentials.

## Supporting metrics

Each row: metric · source · pull method · what it tells the agent.

### 1. Impressions (search)
- **Source:** Google Search Console API — `searchanalytics.query`.
- **Pull:** `dimensions:["date"]`, `searchType:"web"`, page filter =
  `gsc_page_filter`. Sum `impressions` over the window.
- **Signal:** top-of-funnel reach / indexed surface area.

### 2. Clicks (search)
- **Source:** GSC `searchanalytics.query`.
- **Pull:** same call; sum `clicks`.
- **Signal:** awareness→site conversion from SERPs.

### 3. CTR (search)
- **Source:** GSC (derived).
- **Pull:** `clicks / impressions` for the window (do not average GSC's
  per-row CTR; recompute from totals).
- **Signal:** title/description/snippet effectiveness.

### 4. Average position by query
- **Source:** GSC `searchanalytics.query`.
- **Pull:** `dimensions:["query"]`, `rowLimit:1000`, page filter applied.
  Keep `query`, `position`, `impressions`, `clicks` per row.
- **Signal:** ranking trajectory per keyword; feeds keyword-level decisions.

### How the agent pulls GSC (shared by metrics 1–4)

GSC has no API-key auth; you mint a short-lived token from the service-account
JSON (`$GSC_SERVICE_ACCOUNT_JSON`, provisioned via `oz secret` — see
`./RUNBOOK.md` §2), then POST to `searchAnalytics.query`. For metrics 1–3 query
with `dimensions:["date"]` and sum the totals; for metric 4 use
`dimensions:["query"]`. Recompute CTR from summed clicks/impressions — never
average GSC's per-row CTR.

```python
# pip install google-auth requests
import json, os, requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

info = json.loads(os.environ["GSC_SERVICE_ACCOUNT_JSON"])
creds = service_account.Credentials.from_service_account_info(
    info, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
creds.refresh(Request())

site = "sc-domain:waev.app"            # gsc_property
body = {
    "startDate": "<YYYY-MM-DD>", "endDate": "<YYYY-MM-DD>",  # the 28-day window
    "type": "web",
    "dimensions": ["query"],          # ["date"] for totals (metrics 1–3); ["query"] for metric 4
    "dimensionFilterGroups": [{"filters": [{
        "dimension": "page", "operator": "contains",
        "expression": "https://blog.waev.app/"}]}],          # gsc_page_filter
    "rowLimit": 1000,
}
r = requests.post(
    "https://searchconsole.googleapis.com/webmasters/v3/sites/"
    f"{requests.utils.quote(site, safe='')}/searchAnalytics/query",
    headers={"Authorization": f"Bearer {creds.token}"}, json=body)
r.raise_for_status()
rows = r.json().get("rows", [])       # each row: keys[query], clicks, impressions, ctr, position
```

If `GSC_SERVICE_ACCOUNT_JSON` is unset or the service account lacks access to the
property, metrics 1–4 are `MANUAL-GATE` → record `null` + a `data-gap` note.

### 5. AEO / answer-engine citation appearances
- **Source:** Perplexity API (`sonar` model) as the machine-checkable proxy
  for answer-engine visibility. The probe-query set is fixed (defined verbatim
  in the pull command below) so the number is comparable month over month.
- **Pull:** for each probe query, call the API and check whether any returned
  source URL host equals `blog.waev.app`. Metric = number of probe queries (out
  of the 12) that cite the blog at least once; the report also splits out the
  4-query mesh-curious subset. The probe set is the single source of truth in
  the command's heredocs — edit it **only** via a STRATEGY.md change.
- **Pull command:** the OpenAI-compatible `/chat/completions` endpoint returns
  `citations` as a **top-level** array of source URLs; newer responses also fill
  `search_results[].url` (we check both). Citations are returned by default for
  `sonar` — no `return_citations` flag is required.

```bash
# Counts how many probe queries cite blog.waev.app at least once. Needs `jq`.
probe() {              # reads one query per line on stdin, echoes the hit count
  local hits=0 q cites
  while IFS= read -r q; do
    [ -z "$q" ] && continue
    cites=$(curl -s https://api.perplexity.ai/chat/completions \
      -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d "$(jq -n --arg q "$q" \
           '{model:"sonar",max_tokens:256,messages:[{role:"user",content:$q}]}')" \
      | jq -r '[.citations[]?, (.search_results[]?.url)] | .[]' 2>/dev/null)
    printf '%s\n' "$cites" | grep -q 'blog\.waev\.app' && hits=$((hits+1))
  done
  echo "$hits"
}

core=$(probe <<'PROBES'
MeshCore network analytics platform
how to map a MeshCore mesh network topology
privacy-preserving mesh radio analytics
bring your own MQTT broker mesh analytics
MeshCore repeater monitoring for CERT teams
off-grid neighborhood mesh network dashboard
ham club MeshCore network visualization
evidence-based mesh topology vs inferred topology
PROBES
)
mesh=$(probe <<'PROBES'
getting started with MeshCore for beginners
MeshCore home lab monitoring and dashboard
visualize a LoRa mesh network you built yourself
MeshCore node hardware prototyping and testing tools
PROBES
)
echo "AEO citation appearances: $((core + mesh))/12 (mesh-curious subset: ${mesh}/4)"
```

- **Signal:** whether answer engines treat the blog as a citable source. If
  `PERPLEXITY_API_KEY` is unset, this metric is `MANUAL-GATE` → record `null`.

### 6. Blog traffic (pageviews / visits)
- **Source:** Cloudflare zone analytics (`httpRequestsAdaptiveGroups`, GraphQL),
  same `cf_zone_tag` as the north-star, filtered to `clientRequestHTTPHost =
  cf_blog_host` with `requestSource:"eyeball"`.
- **Pull:** `count` and `sum{visits}` over the window; also pull top pages
  (`dimensions:[clientRequestPath]`, `orderBy:[count_DESC]`) for the per-post table.
- **Signal:** denominator for engagement; identifies winning/decaying posts.

### 7. Blog→app referral CTR (derived north-star efficiency)
- **Pull:** `north_star_referrals / blog_visits`.
- **Signal:** how well content hands readers off to the product.

## Monthly report TEMPLATE

The analytics-reporter agent writes one file per run to
`./reports/YYYY-MM.md` using **exactly** this structure. Numbers are filled
from the pulls above; `delta` is vs. the previous report in `./reports/`.
`MANUAL-GATE` metrics are written as `null` with a matching `data-gap` entry.

```markdown
# Growth report — YYYY-MM

window: YYYY-MM-DD .. YYYY-MM-DD (28d)
generated_by: analytics-reporter
data_gaps: []   # e.g. ["north_star: app zone not reachable"]

## North star
- blog->app referrals: <int>  (delta: <+/-int>, <+/-pct>%)

## Search (Google Search Console)
- impressions: <int> (delta <+/-pct>%)
- clicks:      <int> (delta <+/-pct>%)
- ctr:         <pct> (delta <+/-pp> pp)
- queries tracked: <int>

## Answer engines (AEO)
- citation appearances: <int>/12 probe queries (delta <+/-int>)
- citation appearances (mesh-curious subset): <int>/4
- newly citing queries: [ ... ]
- lost citations:       [ ... ]

## Top queries by impressions
- "<query>" — pos <float>, impr <int>, clicks <int>
- (up to 10 rows)

## Movers — average position
- gained (>= 3 positions): [ "<query>": <old>->-<new> ]
- lost   (>= 3 positions): [ "<query>": <old>->-<new> ]

## Per-post performance (Cloudflare + GSC)
- /blog/<slug>/ — visits <int>, clicks <int>, pos <float>, referrals <int>
- (one row per published post)

## Decay watch
- posts with clicks down >= 30% vs prior window: [ /blog/<slug>/ ]

## Editorial mix (rolling quarter, vs ./EDITORIAL.md rails)
- bucket mix: primer <n> · signal <n> · field-manual <n> · under-the-hood <n> · position <n> · dispatch <n>
- buckets out of tolerance (±1 vs target): [ ... ]
- segments / funnel stages at zero this quarter: [ ... ]
- themes touched: <n>/6

## Triggered actions (see MEASUREMENT.md thresholds)
- [ ] <rule id> -> <calendar.yaml | STRATEGY.md change proposed in PR #...>
```

## Decision thresholds (agent-evaluable)

After writing the report, the agent evaluates every rule below in order. Each
rule that fires produces a concrete proposal **as a PR** (calendar edit) or a
flagged item for the strategy-planner. Agents NEVER deploy and NEVER edit
`STRATEGY.md` autonomously — strategy changes are proposed and gated
`human-approval`; calendar edits are proposed and gated `human-merge`.

Rules use the current report vs. the immediately previous report.

- **T1 — Striking-distance promote.** Any `query` with `position` in
  `[11.0, 20.0]` (true page-2 striking distance) AND `impressions >= 200` over
  the window AND no published post already targets it as `primary_keyword`:
  propose a new `calendar.yaml` entry (`type: post`, `status: proposed`)
  targeting that query. Map `segment`/`funnel_stage` from the query's audience
  using the calendar enum (tinkerer / ham / cert-emcomm / off-grid).
  Rationale: a brand-new post is the right lever for page 2 (positions
  8–10 are already page-1 bottom — those are T2/T3 territory, not a new post),
  and ~200 impressions/28d is the floor where a query has enough recurring
  demand to repay the hours of expert writing. → **calendar.yaml PR.**
- **T2 — Snippet fix.** Any published post URL with `impressions >= 500` AND
  `position <= 10.0` AND `ctr < 1.5%` over the window: propose a `type: seo-task`
  entry to rewrite that post's `title`/`description`. The `position <= 10` gate
  matters — CTR is only diagnosable once you actually rank on page 1; a low CTR
  at position 30 is expected, not a snippet defect. → **calendar.yaml PR.**
- **T3 — Decay refresh.** Any published post live > 90 days with `clicks` down
  `>= 30%` vs the previous window AND `>= 20` clicks in that previous window
  (so the drop is material, not 3→2 noise): propose a `type: seo-task` refresh
  entry referencing the content-writer brief. → **calendar.yaml PR.**
- **T4 — Position regression.** Any tracked `query` that dropped `>= 5`
  positions month-over-month while still `impressions >= 200` AND now ranking
  `position <= 30.0` (past 30 it is effectively lost, not regressing): propose a
  `type: audit` entry for the seo-auditor to investigate. → **calendar.yaml PR.**
- **T5 — AEO gap.** Only evaluated once the blog has search traction this window
  (`impressions >= 1000`) — below that there is too little indexed corpus for
  absence of citations to mean anything (cold start, not a gap). When that holds
  AND AEO citation appearances are `< 4/12` total OR `0/4` on the mesh-curious
  subset for two consecutive reports: the blog ranks for humans but answer
  engines still won't cite it → flag a STRATEGY.md review of the answer-engine
  angle / FAQ coverage. → **STRATEGY.md flag (human-approval).**
- **T6 — North-star stall.** North-star referrals flat or negative
  (`delta <= 0%`) for **three** consecutive reports while `clicks` grew
  `>= 20%` over the same span: the blog attracts traffic that does not convert
  → flag STRATEGY.md (segment/offer mismatch). → **STRATEGY.md flag
  (human-approval).**
- **T7 — Cadence pressure.** If the count of posts that went `published` in the
  window is below the publishing cadence (`./CADENCE.md` §3.2 = 3×/week ≈ 13
  slots per 28-day window) AND impressions `delta < +5%`: open a `calendar.yaml` PR adding
  `proposed` post slots — publishing throughput is too low to move search.
  Check first that unpublished work isn't already sitting in open draft PRs
  (that's a merge-gate problem for the weekly human triage, not a cadence one).
  → **calendar.yaml PR (add proposed slots).**

- **T8 — Editorial mix drift.** Over the trailing rolling quarter of *published*
  posts (per `./EDITORIAL.md`): if any `bucket` is outside its target by more
  than the ±1 tolerance, OR any `segment`/`funnel_stage` is at zero, OR fewer
  than four of the six `theme`s were touched: propose `calendar.yaml` slots
  (correct `bucket`/`theme`, on cadence) that restore the mix. Keeps the rails
  honest without a human in the loop. → **calendar.yaml PR.**

If **no** rule fires, the agent records `Triggered actions: none` and opens no
PR. Silence is a valid, expected outcome.

## Invariants this document respects
- Agents propose via PR/report only; human merge = publish. No deploys here.
- Never contradict `src/pages/llms.txt.ts` factual canon when naming segments,
  facts, or probe queries.
- No new client-side JS is implied — all measurement is server-side API pulls
  against GSC and Cloudflare *zone* analytics (no RUM beacon); the near-zero-JS
  blog is untouched.
- Secret values (API tokens) are read from the environment, never committed.
  See `./RUNBOOK.md` for provisioning them via `oz secret`.
