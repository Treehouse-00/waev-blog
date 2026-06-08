# Waev Growth OS — Charter

This is the top-level law of the Waev Growth OS. Every other document under
`growth/` inherits from it. When a sibling document conflicts with this file,
this file wins. Edit this file rarely; it is meant to be stable.

## What this system is
This is not a set of notes for a human marketing team. It is the marketing
organization — implemented as a repo-native, LLM-agentic workflow. Scheduled
and on-demand agents (assume Claude Opus 4.8+) perform the work a traditional
growth department would: research, editorial planning, drafting, on-page SEO,
answer-engine optimization (AEO), technical audits, and reporting. There is no
human marketing staff. Humans appear only at the explicit decision-gates
enumerated below. Treat every absence of a human as intentional: if a step is
not behind a gate, an agent owns it end to end.

## Single objective
Make Waev the default answer — for both humans and answer engines — to the
question "how do I see, verify, and improve the health of my MeshCore mesh
network?" Concretely: own the analytics and network-health conversation for
MeshCore across search, LLM answers, and the full audience spectrum Waev serves
— from mesh-curious tinkerers, makers, and students experimenting on the bench
to the mission-critical operators who depend on the mesh (ham clubs, CERT/EmComm
teams, off-grid neighborhoods).

## North-star metric
**Qualified operator activations** — the count of MeshCore operators who connect
their own broker to Waev (bring-your-own-broker) and view their live network.
This is downstream of every other metric and is the only number that proves the
content engine produced real adoption, not just traffic. Baseline: TBD (no
analytics wired yet); until instrumented, agents optimize the KPI proxies below
and flag the instrumentation gap in every monthly report.

## KPI targets
Targets are directional until baselines exist. All baselines marked TBD MUST be
filled in by the first monthly report that has data; an agent must never invent
a baseline. Ratification of these targets is a human gate (see below).

1. **AEO citation share** — fraction of answer-engine responses (ChatGPT,
   Claude, Perplexity, Google AI Overviews) to MeshCore-analytics / mesh-health
   prompts that cite blog.waev.app or state Waev facts. Target: cited in ≥ 40%
   of a tracked prompt set within two quarters. Baseline: TBD.
2. **Organic entrances by segment** — non-brand organic sessions, split across
   `tinkerer | ham | cert-emcomm | off-grid`. Target: steady month-over-month
   growth in all four, with no segment at zero. Baseline: TBD.
3. **Keyword coverage** — number of mapped primary keywords (see
   `./STRATEGY.md`) with at least one published post ranking in the top 10.
   Target: ≥ 60% of mapped primary keywords covered by published posts within
   two quarters. Baseline: TBD.
4. **Publishing cadence held** — published posts per month vs. the cadence set
   in `./calendar.yaml`. Target: ≥ 90% of scheduled slots ship on their
   `slot_date`. Baseline: 0 (engine not yet live).
5. **Qualified operator activations** (north star) — Target: establish baseline,
   then sustained month-over-month growth. Baseline: TBD (instrumentation
   pending).

## Human decision-gates (the only places a human is required)
Agents PROPOSE; humans DISPOSE. These four gates are exhaustive. Anything not
listed here is fully delegated to agents.

1. **Strategy ratification (one-time, then on material change).** A human
   ratifies the category-positioning call and the KPI targets in `./STRATEGY.md`
   and this Charter once before the engine runs in earnest, and again only when
   either materially changes. Until ratified, agents may draft and prepare PRs
   but the positioning is provisional.
2. **Merge content PRs to publish.** Every post and on-page change reaches
   production only when a human merges the PR. Merge = publish. The existing
   date-gate (`src/lib/posts.ts`) + deploy Action then ships it. No agent merges
   or deploys. (Charter-bound by Invariant 1 below.)
   The final pre-publish checkpoint lives here: the content-writer delivers a
   hero **image prompt**, never the image. A human generates the image and adds
   `public/hero-<slug>.jpg` before merging; the `Hero asset check` stays red
   until the asset is present, so a post cannot publish without its human-made
   hero.
3. **Approve outbound distribution.** Any post to an external community (forums,
   Discord/Matrix, mailing lists, social, Reddit, ham/CERT channels) is a
   human-approval gate. Agents may draft distribution copy and a target list as
   a report; a human sends or explicitly approves sending. No agent posts to an
   external community autonomously. (Charter-bound by Invariant 2.)
4. **Review periodic reports.** A human reviews the monthly performance report
   and the quarterly strategy report. These are review gates, not edit gates:
   the human reads, and may trigger a strategy-change cycle (which re-opens
   gate 1).

## Invariants (inherited, non-negotiable)
These mirror the repo constitution in `../AGENT.md` and bind every growth agent:

1. Agents propose via PR or report files; they NEVER deploy. Human merge =
   publish. The date gate + deploy Action ships merged posts.
2. No agent posts to external communities autonomously — distribution is always
   the human-approval gate above.
3. Never contradict the factual canon in `src/pages/llms.txt.ts`. If a fact must
   change, `llms.txt.ts` is the canonical source to update first.
4. Near-zero JS, token-based styling. Never propose heavy client-JS tactics,
   tracking scripts, or new external origins without routing through the repo's
   CSP and Invariants.
5. Posts carry no byline and no signoff. Measured, technical prose only.

## How the layers fit
- `./CHARTER.md` (this file) — why the org exists and who decides. Law.
- `./STRATEGY.md` — who we serve, the positioning call, and the keyword →
  segment → funnel map the calendar draws from.
- `./VOICE.md` — how everything must sound and the self-verify checklist content
  agents run before opening a PR.
- `./EDITORIAL.md` — the editorial rails: the content buckets, the
  demographic×psychographic resonance model, the ownable themes, the annual
  flow (a guide, not dogma), and the mix/pulse rules the planner and writer obey.
- `./calendar.yaml` — the schedule of slots (posts, SEO tasks, audits); every
  `type: post` slot carries a `bucket` + `theme` per `./EDITORIAL.md`.
- `./briefs/*.md` — the executable prompts scheduled agents run.
