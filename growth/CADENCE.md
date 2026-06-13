# CADENCE — Operating Rhythm & Governance (the WHEN layer)

This is the governing contract the scheduled run-system obeys. It defines
**every recurring loop**: which brief it runs, when it fires (cron, UTC), what
artifact it emits, and which gate stands between that artifact and production.
It is written for an autonomous agent reader. Prefer the explicit rules here
over judgement; where judgement is unavoidable it is routed to a marked gate.

Read alongside: `./calendar.yaml` (the dated backlog this rhythm draws from),
`./EDITORIAL.md` (the content buckets, themes, annual flow, and mix/pulse rails),
`../AGENT.md` (Invariants — hard constraints), `../src/pages/llms.txt.ts`
(factual canon — never contradict).

## 0. First principles (non-negotiable)
1. **Agents propose; the human authorizes; agents never deploy.** Every
   code/content change lands as a PR or a report file, and **no agent deploys** —
   `deploy.yml` (push to `main`) + the `src/lib/posts.ts` date gate are the only
   path to production. For a **content post**, the human authorizes publication
   by providing its hero image (CHARTER gate 2); once every automated gate is
   green (editor-approved, hero present, build clean) the **merge-runner loop
   (§3.12)** executes the merge as mechanical follow-through — it never decides to
   publish, it only acts on a post the human already authorized. **All other PR
   classes** (SEO fixes, `calendar.yaml`, audits) keep the `human-merge` gate: a
   human clicks merge. No agent merges a post that lacks its human-made hero.
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
  approval. Merge → (date gate) → deploy. Used for non-post PRs (SEO fixes,
  `calendar.yaml`, audit fixes) where a human still clicks merge.
- `os-merge` — the **content-post** gate. The human authorizes publication by
  providing the post's hero image (CHARTER gate 2); the merge-runner loop (§3.12)
  then executes the merge once editor-approved + hero present + build green. The
  human makes the decision (the image); the loop performs the mechanical merge.
  No agent deploys; the date gate + deploy Action still ship the merged post.
- `human-approval` — artifact is a proposal a human must explicitly sign off on
  **before any further action**, even non-merge action (e.g. posting to a
  community). The agent never proceeds past this gate on its own.

## 2. Status machine (how a loop advances a `calendar.yaml` entry)
A `type: post` entry moves through `status`:
`proposed → drafted → scheduled → published`. Between `drafted` and the human
merge sits an internal, agent-owned editorial review (§3.10) — it is a PR-state
transition (draft → ready-for-review), not a new `calendar.yaml` status.
- content-writer picks a `proposed` slot whose `slot_date` is within the lead
  window, drafts the post, and opens a **draft** PR, flipping the entry to
  `drafted` in the same PR. It does NOT mark the PR ready.
- The editor loop (§3.10) independently reviews and revises that draft PR, then
  flips it to ready-for-review. Only a ready, editor-approved PR should reach the
  human. This is the internal review cycle — no human is involved in it.
- Between editor-ready and human merge, the image-handler loop (§3.11) places the
  human-provided hero image onto the PR branch. This is agent-owned tactical work,
  not a `calendar.yaml` status change: the human's only act is generating the image
  and attaching it to a PR comment; naming, compressing, and committing the file
  are delegated to the loop.
- Once the human authorizes via the hero image and the merge-runner (§3.12)
  merges the PR, the post file exists in `src/content/blog` and the entry becomes
  `scheduled` (date-gated). The daily publish rebuild makes it `published` once
  `slot_date` arrives.
- The `drafted → scheduled` advance is triggered by the human's hero-image
  authorization and executed by the merge-runner. No loop may set `published`;
  that state is derived from `main` + the date gate. No loop deploys.

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

### 3.2 Thrice-weekly — Content drafting (3×/week publish grid: Tue/Thu/Sun)
- brief: `./briefs/content-writer.md`
- cron: `0 14 * * 0,2,4`  (Sun/Tue/Thu 14:00 UTC)
- trigger: each run, select the earliest `calendar.yaml` `type: post` entry with
  `status: proposed` whose `slot_date` is ≤ 21 days out (the draft lead window).
  Running three mornings a week keeps the ~3 drafts/week the 156/yr grid needs;
  drafting ahead is fine (the date gate holds each post until its `slot_date`).
  If none is due, no-op.
- output: `pr` — a draft post `.mdx` under `src/content/blog/` matching
  `content.config.ts` frontmatter, plus the `status: proposed → drafted` flip in
  `calendar.yaml`, opened as one draft PR.
- gate: `os-merge` (human authorizes via hero image; merge-runner §3.12 merges).

### 3.10 Thrice-weekly — Editorial review (the internal review cycle)
- brief: `./briefs/editor.md`
- cron: `0 18 * * 0,2,4`  (Sun/Tue/Thu 18:00 UTC — ~4h after content drafting)
- trigger: each run, find the oldest OPEN draft PR on a `growth/post-*` branch
  whose body lacks the `<!-- editor-approved -->` marker. If none, no-op. One PR
  per run.
- output: `pr` — independent review against `./VOICE.md` (incl. source discipline
  + cultural safety), `./SEO-PLAYBOOK.md`, the two-axis resonance, and the hero
  concept/`./image-concepts.md`. The editor REVISES the branch in place to fix
  what it can, appends an "Editorial review" section + the `<!-- editor-approved
  -->` marker to the PR body, and flips the PR to ready-for-review (`gh pr
  ready`). If a draft is unsalvageable within scope, it leaves the PR a draft
  with a clear "needs human" note instead.
- gate: `os-merge` (the editor never merges/deploys; it only flips draft→ready).
  After the editor approves, the only remaining human act is the hero image.

### 3.11 Frequent — Hero-image placement (the last-mile asset loop)
- brief: `./briefs/image-handler.md`
- cron: `0 */2 * * *`  (every 2 hours, UTC)
- trigger: each run, find the oldest OPEN `growth/post-*` PR whose hero asset is
  still missing (`node scripts/check-hero-assets.mjs` flags it) AND that has a
  human image attached in a PR comment AND whose body lacks the
  `<!-- hero-handled -->` marker. If none, no-op. One PR per run. The cron only
  sets the MAX latency between a human attaching the image and the gate clearing;
  most runs no-op cheaply. A human can also trigger it on demand (RUNBOOK §5).
- output: `pr` — downloads the attached image, normalizes it to the house hero
  format (JPEG, ~1600px wide, metadata stripped), commits `public/hero-<slug>.jpg`
  to the PR branch, and comments confirmation with the `<!-- hero-handled -->`
  marker. It NEVER generates an image and writes only that one asset.
- gate: `os-merge` (the loop places the asset; it never merges/deploys and never
  flips draft→ready). Placing the hero clears the last gate before the
  merge-runner (§3.12) can execute the merge.

### 3.12 Frequent — Merge-runner (the publish-execution loop)
- brief: `./briefs/merge-runner.md`
- cron: `0 * * * *`  (hourly, UTC — the backstop; the image-handler also triggers
  it on demand the moment a hero lands, so most merges happen within minutes)
- trigger: each run, find the oldest OPEN `growth/post-*` PR that is ready (not
  draft), carries `<!-- editor-approved -->`, has its hero asset present
  (`check-hero-assets.mjs` OK), builds green, and lacks `<!-- os-merged -->` /
  `<!-- merge-blocked -->` / `<!-- editor-escalated -->`. If none, no-op. One PR
  per run.
- output: `merge` — brings `origin/main` into the branch (auto-resolving only the
  two known-safe conflict classes: the `image-concepts.md` ledger via the
  `merge=union` driver, and a `calendar.yaml` own-slot `status` line), re-runs the
  build, and merges the PR with `gh pr merge --merge`. It comments the merge SHA
  + publish date + `<!-- os-merged -->`. Any conflict outside the safe set, a red
  build, or a missing hero → it comments `<!-- merge-blocked -->` (or no-ops for a
  missing hero) and stops for a human. It NEVER deploys, force-pushes, squashes,
  or `--admin`-bypasses checks.
- gate: `os-merge` (this loop IS the execution half of that gate; the human's
  hero image is the decision half). Publication still flows only through the
  merge → date gate → deploy Action path.

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
- **Executing the merge of a content post the human already authorized** by
  providing its hero image, once all automated gates are green (merge-runner,
  §3.12). The decision is the human's hero image; the merge is mechanical.
Human-only (require a gate above):
- Authorizing a post to publish — by providing its hero image (gate 2).
- Merging any NON-post PR to `main` (SEO fixes, `calendar.yaml`, audits).
- Deploying (never an agent action at all).
- Any external/community posting or outreach (`human-approval`, §3.7).
- Changing canon (`llms.txt`), changing this `CADENCE.md`, or changing the
  `calendar.yaml` schema keys.
- Resolving a flagged canon conflict (§0.3).

## 5. Review rhythm (the human side of the loop)
- **Per-post (human, one act):** the human's whole job on a content post is the
  hero-image pass (CHARTER gate 2): generate the image and drop it into a PR
  comment. That act IS the publish authorization. Everything else is internal to
  the Growth OS — the editor (§3.10) reviews/revises and flips draft→ready, the
  image-handler (§3.11) names/compresses/commits the file, and the merge-runner
  (§3.12) executes the merge once all gates are green. The human never touches a
  filename, the terminal, or the merge button. (A human MAY still merge a post
  manually if they prefer; the merge-runner only acts on hero-present,
  editor-approved PRs and no-ops otherwise.)
- **Weekly triage (human, ~5 min):** skim what the OS shipped — the
  `<!-- os-merged -->` confirmations and any `<!-- merge-blocked -->` PRs that
  need a human (a real content conflict the merge-runner refused to guess at) —
  plus the week's reports (§3.3, §3.5). Unblock or send back as needed.
- **Monthly review (human):** read the monthly analytics report (§3.4), the
  monthly audit (§3.6), and distribution prep (§3.7); approve distribution
  actions; merge the fix and calendar PRs.
- **Quarterly planning (human):** review the keyword refresh PR (§3.8) and
  competitive deep audit (§3.9); merge the `calendar.yaml` changes that set the
  next quarter's backlog.

## 6. Invariants restated for loop authors (checklist)
A loop run is only valid if ALL hold:
- [ ] It did not DEPLOY. (Only the merge-runner §3.12 may merge — and only a
      hero-present, editor-approved `growth/post-*` PR; every other loop produces
      a PR or a report and merges nothing.)
- [ ] If it opened a PR, `npm run build` passes on that branch.
- [ ] It did not post anything to an external community.
- [ ] It did not contradict `llms.txt`; any factual conflict was flagged, not
      silently resolved.
- [ ] It introduced no client-side JS tactic (near-zero-JS constraint).
- [ ] It checked for and avoided creating a duplicate PR/report for the slot.
