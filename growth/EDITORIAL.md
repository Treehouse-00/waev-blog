# Waev Growth OS — Editorial Rails

Inherits from `./CHARTER.md` and `./STRATEGY.md`. This is the editorial layer
that sits between strategy (who/why) and `./calendar.yaml` (the dated slots). It
defines the content buckets, the resonance model every post is built on, the
ownable themes, the annual flow, and the mix/pulse rules the planner obeys. It
is written for an agent: use the bucket and theme enums verbatim.

> **HUMAN RATIFICATION GATE (Charter gate 1).** The bucket taxonomy, the theme
> set, and the mix targets below were ratified once. Changing any of them is a
> material strategy change and re-opens gate 1. The planner may propose drift
> corrections within these rails without a gate.

## The resonance model (two axes, both required)
Every post resonates on two axes at once. A post that hits only one is median.

- **Demographic (niche) axis** — the *right person at the right moment*. Who is
  this for (`segment`: tinkerer | ham | cert-emcomm | off-grid), where in the
  funnel (`funnel_stage`), and what timely or seasonal pull makes it land now.
  This is how we win search and serve a real operator's real task.
- **Psychographic (universal) axis** — the *human tension underneath*. A
  higher-level, culturally legible truth that transcends the mesh niche but
  **converges with Waev's ownable space** (the trust wedge in `./STRATEGY.md`).
  This is how a post becomes shareable, answer-engine-citable, and unmistakably
  ours instead of generic SEO filler.

**The ladder-up rule:** every post pairs a niche hook (demographic) with exactly
one `theme` (psychographic) it ladders up to. "Where to put your next repeater"
(niche: ham siting) ladders to *Ready before it matters* (the marginal link
fails first). "What we choose not to know" (niche: privacy) ladders to *The
power of refusal*. If a draft has a niche but no theme, it is tactical SEO; if it
has a theme but no niche, it is a think-piece nobody searches for. Ship neither.

## Ownable themes (the psychographic enum)
A fixed set. Each converges with a canon pillar, so leaning on it strengthens
positioning rather than drifting from it. Use the token verbatim as a slot's
`theme`.

- `knowing-over-guessing` — evidence beats assumption; a verified "no" beats a
  confident maybe. (Converges with: evidence-based topology.) Cultural pull:
  trust in an era of confident machines that hallucinate.
- `power-of-refusal` — strength in what you decline to collect, keep, or know.
  (Converges with: privacy-by-default.) Cultural pull: data dignity; restraint
  as a feature, not a gap.
- `own-your-ground` — autonomy over your data and your infrastructure; hold your
  own keys. (Converges with: bring-your-own-broker.) Cultural pull: digital
  sovereignty; refusing platform capture.
- `ready-before-it-matters` — resilience is rehearsed, not hoped; the weak link
  fails first. (Converges with: resilience / verification.) Cultural pull:
  preparedness; antifragility.
- `earned-competence` — the craft of understanding a system well enough to trust
  it. (Converges with: evidence + teaching.) Cultural pull: mastery; the maker's
  refusal of the magic black box.
- `networks-of-people` — the mesh is a community before it is a technology.
  (Converges with: the operator communities we serve.) Cultural pull: mutual
  aid; local resilience; belonging.

## Content buckets (the shape enum)
A fixed set of six. Use the token verbatim as a slot's `bucket`. Each has a
default segment/funnel lean (override when a specific slot justifies it) and a
target share of the annual post mix.

- `primer` — explainer & onboarding. Turns a curious newcomer into someone with
  a node talking. Lean: tinkerer/ham · awareness. Share ~15%.
  Corpus echo: (new) "what is MeshCore", "node not showing up".
- `signal` — technical deep-dive that teaches a transferable RF/mesh skill. The
  credibility engine. Lean: ham/tinkerer · evaluation. Share ~20%.
  Corpus echo: "Reading the Signal".
- `field-manual` — an operating playbook built around one real decision the
  operator has to make. Lean: ham/cert-emcomm/off-grid · adoption. Share ~20%.
  Corpus echo: "Where Your Network Ends".
- `under-the-hood` — how Waev itself works; the mechanism that earns trust. Lean:
  any · evaluation→adoption. Share ~15%.
  Corpus echo: "From Radio to Map", "Bring Your Own Broker".
- `position` — manifesto / values / point of view. The loud, citable, shareable
  expression of the wedge. Lean: any · brand (any funnel). Share ~15%.
  Corpus echo: "What We Choose Not to Know".
- `dispatch` — timely & seasonal: field reports, comparisons, buying guides.
  Rides a real-world moment. Lean: community · awareness/evaluation. Share ~15%.
  Corpus echo: "Your Mesh on Field Day".

## Annual flow (a guide, not dogma)
The year has a demographic rhythm anchored to our audience's real calendar. Use
it to *bias* the mix, not to imprison it: a strongly resonant `position` or
evergreen `signal` piece can run in any quarter, and a timely `dispatch` should
preempt the plan when the moment is real. Balance niche-seasonal pieces against
evergreen-psychographic ones so we are never slaves to the calendar.

- **Q1 (Jan–Mar) — "Get on the mesh."** New-year maker energy; post-holiday
  hardware. Lean: `primer`, `dispatch` (buying guides), tinkerer/ham. Themes:
  `earned-competence`, `networks-of-people`.
- **Q2 (Apr–Jun) — "Make it perform under load."** ARRL Field Day ramp (4th full
  weekend of June). Lean: `signal`, `field-manual`, capped by a Field Day
  `dispatch`. Themes: `earned-competence`, `ready-before-it-matters`.
- **Q3 (Jul–Sep) — "Prove it before you need it."** Emergency season
  (hurricane/wildfire/storm). Lean: `field-manual`, `position`, cert-emcomm.
  Themes: `ready-before-it-matters`, `knowing-over-guessing`.
- **Q4 (Oct–Dec) — "Own your network."** Values, data-ownership, winter-storm
  prep, holiday maker projects. Lean: `position`, `under-the-hood`, off-grid.
  Themes: `own-your-ground`, `power-of-refusal`.

## Mix & pulse rules (the rails)
Enforced over any rolling quarter (~6 posts). Targets are a shape to hold, not a
quota to hit to the decimal.

- **Mix target:** `signal` 20% · `field-manual` 20% · `primer` 15% ·
  `under-the-hood` 15% · `position` 15% · `dispatch` 15%. Tolerance ±1 post per
  bucket per rolling quarter.
- **Pulse:** `position` fires ~once per quarter — spacing keeps it special and
  never preachy. `dispatch` is seasonally anchored and may preempt the plan when
  a real moment lands. `primer` runs steadily as the top-of-funnel feeder.
- **No repeats:** no two consecutive published posts share a `bucket`.
- **Depth floor:** every month ships at least one evaluation/adoption depth
  piece (`signal` | `field-manual` | `under-the-hood`) — the credibility core.
- **Coverage:** every rolling quarter keeps all four `segment`s and all three
  `funnel_stage`s non-zero (ties to Charter KPI 2), and touches at least four of
  the six `theme`s.

## How agents use this file
1. `keyword-research` and `competitive-monitor`: every proposed `type: post`
   slot MUST carry a `bucket` (this enum) and a `theme` (this enum), chosen so
   the slot satisfies both resonance axes. Prefer the quarter's lean, but choose
   the truest pairing over the seasonal default.
2. `content-writer`: read the slot's `bucket` to choose the post's SHAPE and its
   `theme` to choose the human tension the piece ladders up to; state both in
   the PR body. `./VOICE.md` still governs the prose.
3. `analytics-reporter`: report performance BY `bucket` and BY `theme`, and
   evaluate the mix-drift threshold (MEASUREMENT.md T8).
4. The planner proposes corrective slots when the rolling-quarter mix or coverage
   drifts outside the rails above — within the rails, no gate; changing the rails
   themselves is Charter gate 1.

## Distribution coupling (feeds `./briefs/link-distribution.md`)
Bucket implies where the piece earns reach beyond search:
- `position` → answer engines + community shares (the citable wedge).
- `signal` / `field-manual` → search long-tail + ham/CERT forums and wikis.
- `primer` → maker/hobby communities (the broad top of funnel).
- `dispatch` → timely social + event/community channels.
- `under-the-hood` → product-curious readers; pairs with docs/changelog moments.
Distribution remains a human-approval gate — no agent posts externally.
