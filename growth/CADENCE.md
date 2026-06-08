# CADENCE — Operating Rhythm & Governance (the WHEN layer)

This is the governing contract the scheduled run-system obeys. It defines
**every recurring loop**: which brief it runs, when it fires (cron, UTC), what
artifact it emits, and which gate stands between that artifact and production.
It is written for an autonomous agent reader. Prefer the explicit rules here
over judgement; where judgement is unavoidable it is routed to a marked gate.

Read alongside: `./calendar.yaml` (the dated backlog this rhythm draws from),
`../AGENT.md` (Invariants — hard constraints), `../src/pages/llms.txt.ts`
(factual canon — never contradict).

## 0. First principles (non-negotiable)
1. **Agents propose; humans publish.** Every code/content change lands as a PR
   or a report file. No agent merges to `main`. No agent deploys. The existing
   `deploy.yml` (push to `main`) + the `src/lib/posts.ts` date gate are the
   only path to production.
2. **No autonomous external posting.** Any loop that drafts community/social/
   outreach content stops at a `human-approval` gate. Distribution is never
   executed by an agent.
3. **Canon is immutable from below.** If a loop discovers a fact that conflicts
   with `llms.txt`, it does NOT silently rewrite a post. It opens a PR that
   updates `llms.txt` first (the canonical source) and flags the conflict for
   human review.
4. **Never break the build.** Any loop touching files under version control
   must leave `npm run build` green. A loop whose PR fails CI is a failed run.
5. **Idempotent & duplicate-safe.** Before creating work, a loop MUST check for
   an existing open PR / report for the same slot and no-op if found.

## 1. Gate vocabulary (used by every loop and every `calendar.yaml` brief)
- `none` — artifact is informational (a report). It is written to
  `growth/reports/` and needs no approval. It changes nothing in production.
- `human-merge` — artifact is a PR. A human reviewing and merging the PR is the
  approval. Merge → (date gate) → deploy. This is the standard content gate.
- `human-approval` — artifact is a proposal a human must explicitly sign off on
  **before any further action**, even non-merge action (e.g. posting to a
  community). The agent never proceeds past this gate on its own.

## 2. Status machine (how a loop advances a `calendar.yaml` entry)
A `type: post` entry moves through `status`:
`proposed → drafted → scheduled → published`.
- content-writer picks a `proposed` slot whose `slot_date` is within the lead
  window, drafts the post, opens a PR, and flips the entry to `drafted` in the
  same PR.
- On human merge, the post file exists in `src/content/blog`; the entry becomes
  `scheduled` (date-gated). The daily publish rebuild makes it `published` once
  `slot_date` arrives.
- Only a human merge advances `drafted → scheduled`. No loop may set
  `published`; that state is derived from `main` + the date gate.

## 3. Recurring loops
Each loop below is the authoritative spec for one scheduled job. Fields:
`brief` · `cron` (UTC, standard 5-field) · `trigger` · `output` · `gate`.
The orchestrating run-system reads this section to register jobs.

### 3.1 Daily — Publish rebuild (system loop, no brief)
- brief: _none_ (this is the existing `.github/workflows/scheduled-publish.yml`)
- cron: `0 13 * * *`
- trigger: every day at 13:00 UTC
- output: a production rebuild that publishes any already-merged post whose
  `date` has now arrived (the date gate in `src/lib/posts.ts`).
- gate: `none` — it only ships posts a human already merged. Listed here so the
  rhythm is complete; do not duplicate or reschedule it from another loop.

### 3.2 Weekly — Content drafting
- brief: `./briefs/content-writer.md`
- cron: `0 14 * * 1`  (Mondays 14:00 UTC)
- trigger: weekly. Select the earliest `calendar.yaml` `type: post` entry with
  `status: proposed` whose `slot_date` is ≤ 21 days out (the draft lead window).
  If none, no-op.
- output: `pr` — a draft post `.mdx` under `src/content/blog/` matching
  `content.config.ts` frontmatter, plus the `status: proposed → drafted` flip in
  `calendar.yaml`, opened as one draft PR.
- gate: `human-merge` (this is the publish gate).

### 3.3 Weekly — Link & crawl sweep
- brief: `./briefs/seo-auditor.md`
- cron: `0 14 * * 2`  (Tuesdays 14:00 UTC)
- trigger: weekly. Build the site, crawl internal links, check outbound links,
  validate JSON-LD and canonical tags.
- output: `report` to `growth/reports/seo-sweep-<YYYY-MM-DD>.md`. If it finds a
  safe, mechanical fix (e.g. a broken internal link), it MAY additionally open a
  PR with only that fix.
- gate: `none` for the report; `human-merge` for any PR it opens.

### 3.4 Monthly — Analytics report
- brief: `./briefs/analytics-reporter.md`
- cron: `0 15 1 * *`  (1st of month, 15:00 UTC) — matches the 28-day window in
  `./MEASUREMENT.md`; its T1–T7 thresholds are written month-over-month.
- trigger: monthly. Pull traffic / ranking / answer-engine-citation metrics per
  `./MEASUREMENT.md`, then evaluate its decision thresholds (T1–T7).
- output: `report` to `growth/reports/YYYY-MM.md` (the MEASUREMENT template),
  plus a `calendar.yaml` PR for any threshold that fires.
- gate: `none` for the report; `human-merge` for any `calendar.yaml` PR.

### 3.5 Weekly — Competitive watch
- brief: `./briefs/competitive-monitor.md`
- cron: `0 14 * * 3`  (Wednesdays 14:00 UTC)
- trigger: weekly. Diff competitor/SERP movement for roadmap keywords
  (MeshCore, Meshtastic ecosystem, LoRa mesh, EMCOMM tooling) vs. last run.
- output: `report` to `growth/reports/competitive-<YYYY-MM-DD>.md` listing only
  material changes since the prior run.
- gate: `none`. (Quarterly deep audit is §3.9.)

### 3.6 Monthly — Full SEO audit
- brief: `./briefs/seo-auditor.md`
- cron: `0 15 1 * *`  (1st of month, 15:00 UTC) — matches the monthly `audit`
  checkpoint seeded in `calendar.yaml`.
- trigger: monthly. Full technical + content + structured-data + `llms.txt`
  canon-consistency audit. The `calendar.yaml` entry names the segment cluster
  in focus for that month.
- output: `report` to `growth/reports/audit-<YYYY-MM>.md`, plus a single PR
  bundling any mechanical fixes (metadata, internal links, schema).
- gate: `none` for the report; `human-merge` for the fix PR.

### 3.7 Monthly — Distribution prep
- brief: `./briefs/link-distribution.md`
- cron: `0 15 5 * *`  (5th of month, 15:00 UTC, after newly date-gated posts go live)
- trigger: monthly. For each post `published` since the last run, draft segment-
  appropriate outreach/community/backlink copy.
- output: `report` to `growth/reports/distribution-<YYYY-MM>.md` containing
  ready-to-send drafts and target venues.
- gate: `human-approval` — **the agent NEVER posts.** A human approves and
  performs (or explicitly authorizes) each distribution action. This enforces
  Invariant: no autonomous external posting.

### 3.8 Quarterly — Keyword roadmap refresh
- brief: `./briefs/keyword-research.md`
- cron: `0 16 21 1,4,7,10 *`  (21st of Jan/Apr/Jul/Oct, 16:00 UTC) — matches the
  quarterly `keyword-research` checkpoints in `calendar.yaml`.
- trigger: quarterly. Re-mine demand, score gaps against current coverage and
  the analytics reports, and propose new/retired post slots.
- output: `calendar-pr` — a PR that edits `calendar.yaml` (adds `proposed` post
  slots, adjusts keywords) only. It does not write post bodies.
- gate: `human-merge` (a human approves the plan change before it can seed
  drafting).

### 3.9 Quarterly — Competitive deep audit
- brief: `./briefs/competitive-monitor.md`
- cron: `0 16 28 2,5,8,11 *`  (28th of Feb/May/Aug/Nov, 16:00 UTC) — matches the
  quarterly competitive `audit` checkpoints in `calendar.yaml`.
- trigger: quarterly. Full positioning review vs. the competitive set; output
  feeds the next keyword refresh and the quarterly planning gate.
- output: `report` to `growth/reports/competitive-deep-<YYYY-Qn>.md`.
- gate: `none`.

## 4. Decision rights (who may decide what)
Autonomous (agent may act without asking, within guardrails):
- Drafting posts and SEO fixes into PRs/reports.
- Choosing the next due slot from `calendar.yaml` per §2/§3.2.
- Writing reports under `growth/reports/`.
- Proposing `calendar.yaml` edits via PR.
Human-only (require a gate above):
- Merging any PR to `main` (= publishing).
- Deploying (never an agent action at all).
- Any external/community posting or outreach (`human-approval`, §3.7).
- Changing canon (`llms.txt`), changing this `CADENCE.md`, or changing the
  `calendar.yaml` schema keys.
- Resolving a flagged canon conflict (§0.3).

## 5. Review rhythm (the human side of the loop)
- **Weekly triage (human, ~15 min):** review open draft PRs (§3.2) and the
  week's reports (§3.3, §3.5). Merge or request changes. Merging = scheduling.
- **Monthly review (human):** read the monthly analytics report (§3.4), the
  monthly audit (§3.6), and distribution prep (§3.7); approve distribution
  actions; merge the fix and calendar PRs.
- **Quarterly planning (human):** review the keyword refresh PR (§3.8) and
  competitive deep audit (§3.9); merge the `calendar.yaml` changes that set the
  next quarter's backlog.

## 6. Invariants restated for loop authors (checklist)
A loop run is only valid if ALL hold:
- [ ] It produced a PR or a report — it did not merge or deploy.
- [ ] If it opened a PR, `npm run build` passes on that branch.
- [ ] It did not post anything to an external community.
- [ ] It did not contradict `llms.txt`; any factual conflict was flagged, not
      silently resolved.
- [ ] It introduced no client-side JS tactic (near-zero-JS constraint).
- [ ] It checked for and avoided creating a duplicate PR/report for the slot.
