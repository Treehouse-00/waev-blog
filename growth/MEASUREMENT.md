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
gsc_property: "sc-domain:waev.app"        # or "https://blog.waev.app/"
gsc_page_filter: "https://blog.waev.app/" # restrict Search Console rows to the blog
cf_blog_zone: "blog.waev.app"             # Cloudflare Web Analytics site tag (blog)
cf_app_zone: "waev.app"                    # Cloudflare zone for blog->app referral counting
cloudflare_account_id: "<CF_ACCOUNT_ID>"  # from env, not committed
report_window_days: 28                     # GSC data is ~2-3 days delayed; use a 28-day window
```

## North-star metric

The Charter (`./CHARTER.md`) defines the north star as **qualified operator
activations** — operators who connect their own broker and view their live
network. That is an app-side event and is not yet instrumented. Until it is,
the Growth OS optimizes its **measurable proxy**:

**Qualified blog→app referrals per 28-day window** — the count of sessions on
`waev.app` whose referrer host is `blog.waev.app`. It is the closest
blog-observable signal that content moves the full audience — from mesh-curious
tinkerers/makers to mission-critical operators (ham, CERT/EmComm, off-grid) —
toward the product, not just that it attracts
traffic. When activation instrumentation lands, this proxy is superseded by the
activation count and this section is updated (a `STRATEGY.md`-level change).

- **Source:** Cloudflare Web Analytics (GraphQL Analytics API), `cf_app_zone`.
- **Why this and not raw pageviews:** pageviews reward generic traffic; the
  north-star rewards traffic that is the *right* audience and intent. Awareness
  and evaluation metrics below are leading indicators of it.

### How the agent pulls it

```bash
# Cloudflare GraphQL Analytics API. CF_API_TOKEN scope: "Account Analytics:Read".
curl -s https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @- <<'JSON'
{ "query":
  "query($zoneTag:String!,$since:String!,$until:String!){viewer{zones(filter:{zoneTag:$zoneTag}){httpRequestsAdaptiveGroups(limit:100,filter:{datetime_geq:$since,datetime_leq:$until,clientRefererHost:\"blog.waev.app\"}){count}}}}",
  "variables": { "zoneTag": "<CF_APP_ZONE_TAG>", "since": "<ISO8601>", "until": "<ISO8601>" } }
JSON
```

If the app zone is not reachable from this repo's credentials, the metric is
`MANUAL-GATE`: record `null` and emit a `data-gap` note in the report (see
template). Do **not** fabricate a value.

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

### 5. AEO / answer-engine citation appearances
- **Source:** Perplexity API (`sonar` model) as the machine-checkable proxy
  for answer-engine visibility. Probe-query set is fixed below so the number
  is comparable month over month.
- **Pull:** for each probe query, call the API and count whether any returned
  citation URL host equals `blog.waev.app`. Metric = number of probe queries
  (out of the fixed set) that cite the blog at least once.
- **Probe-query set (canonical; edit only via a STRATEGY.md change):**
  1. "MeshCore network analytics platform"
  2. "how to map a MeshCore mesh network topology"
  3. "privacy-preserving mesh radio analytics"
  4. "bring your own MQTT broker mesh analytics"
  5. "MeshCore repeater monitoring for CERT teams"
  6. "off-grid neighborhood mesh network dashboard"
  7. "ham club MeshCore network visualization"
  8. "evidence-based mesh topology vs inferred topology"
  Mesh-curious / maker / prototyping subset (the broadened `tinkerer` audience):
  9. "getting started with MeshCore for beginners"
  10. "MeshCore home lab monitoring and dashboard"
  11. "visualize a LoRa mesh network you built yourself"
  12. "MeshCore node hardware prototyping and testing tools"
- **Pull command:**

```bash
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"sonar","return_citations":true,
       "messages":[{"role":"user","content":"<PROBE QUERY>"}]}' \
  | jq -r '.citations[]?' | grep -c 'blog\.waev\.app' || true
```

- **Signal:** whether answer engines treat the blog as a citable source. If
  `PERPLEXITY_API_KEY` is unset, this metric is `MANUAL-GATE` → record `null`.

### 6. Blog traffic (pageviews / visits)
- **Source:** Cloudflare Web Analytics (GraphQL), `cf_blog_zone`.
- **Pull:** `httpRequestsAdaptiveGroups` count over the window; also pull
  top pages (`dimensions:[clientRequestPath]`) for the per-post table.
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
  `[8.0, 20.0]` AND `impressions >= 100` over the window AND no published post
  already targets it as `primary_keyword`: propose a new `calendar.yaml` entry
  (`type: post`, `status: proposed`) targeting that query. Map `segment`/
  `funnel_stage` from the query's audience using the calendar enum
  (tinkerer / ham / cert-emcomm / off-grid).
  → **calendar.yaml PR.**
- **T2 — Snippet fix.** Any published post URL with `impressions >= 500` AND
  `ctr < 1.5%` over the window: propose a `type: seo-task` entry to rewrite
  that post's `title`/`description`. → **calendar.yaml PR.**
- **T3 — Decay refresh.** Any published post with `clicks` down `>= 30%` vs the
  previous window (and live > 90 days): propose a `type: seo-task` refresh
  entry referencing the content-writer brief. → **calendar.yaml PR.**
- **T4 — Position regression.** Any tracked `query` that dropped `>= 5`
  positions month-over-month while still `impressions >= 100`: propose a
  `type: audit` entry for the seo-auditor to investigate. → **calendar.yaml PR.**
- **T5 — AEO gap.** AEO citation appearances `< 4/12` total OR `0/4` on the
  mesh-curious subset for two consecutive reports: flag a STRATEGY.md review —
  the answer-engine angle is underperforming and positioning/FAQ coverage needs
  revision. → **STRATEGY.md flag (human-approval).**
- **T6 — North-star stall.** North-star referrals flat or negative
  (`delta <= 0%`) for **three** consecutive reports while `clicks` grew
  `>= 20%` over the same span: the blog attracts traffic that does not convert
  → flag STRATEGY.md (segment/offer mismatch). → **STRATEGY.md flag
  (human-approval).**
- **T7 — Cadence pressure.** If fewer than the planned number of posts (per
  `./CADENCE.md`) published in the window AND impressions `delta < +5%`: open a
  `calendar.yaml` PR adding `proposed` post slots (cadence is too low to move
  search). → **calendar.yaml PR (add proposed slots).**

If **no** rule fires, the agent records `Triggered actions: none` and opens no
PR. Silence is a valid, expected outcome.

## Invariants this document respects
- Agents propose via PR/report only; human merge = publish. No deploys here.
- Never contradict `src/pages/llms.txt.ts` factual canon when naming segments,
  facts, or probe queries.
- No new client-side JS is implied — all measurement is server-side API pulls
  against GSC and Cloudflare; the near-zero-JS blog is untouched.
- Secret values (API tokens) are read from the environment, never committed.
  See `./RUNBOOK.md` for provisioning them via `oz secret`.
