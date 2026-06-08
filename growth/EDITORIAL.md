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

## Weekly cadence & day-of-week psychographics
We publish three times a week — **Tuesday, Thursday, Sunday** — 156 posts a
year. The day is not a slot to fill; it is a reader in a particular frame of
mind. A Western reader arrives at each day differently, so each day owns a
default intent and bucket lean. Match the post to the day's headspace.

- **Tuesday — The Workbench.** Midweek, heads-down, problem-solving. The reader
  is at the bench or desk wanting to *do* something. Intent: instruction. Bucket
  lean: `signal`, `primer`, `field-manual`. Home of the teaching series
  (measure-your-mesh, mesh-pollution, bench-notes). Theme lean:
  `earned-competence`, `knowing-over-guessing`.
- **Thursday — The Planning Table.** Pre-weekend; evaluating, comparing,
  deciding what to build or buy this weekend. Bucket lean: `dispatch`
  (comparisons, buying guides), `under-the-hood`, `field-manual`. Home of
  decision content (the-honest-comparison, gear-up, under-the-hood). Theme lean:
  `knowing-over-guessing`, `own-your-ground`.
- **Sunday — The Long Read.** Unhurried, reflective, identity and belonging.
  Coffee and time; this is where loyalty and brand are built. Bucket lean:
  `position` (values/POV), `dispatch` (field reports, community). Home of the
  manifesto and field-story series (why-we, from-the-field). Theme lean:
  `power-of-refusal`, `own-your-ground`, `networks-of-people`.

These are leans, not laws — a timely Field Day dispatch can take a Tuesday, a
sharp comparison can run on a Sunday. Absent a reason, write to the day.

## Series (the backbone)
Series turn 156 slots from a treadmill into appointments: branded, numbered runs
inside a bucket and day that readers binge, that search finds as clusters, and
that give the calendar a spine. A slot in a series carries the optional `series`
field (the slug). Parts are numbered by air date. A series ends when it has said
what it has to say — never padded to hit a number.

Workbench (Tuesday):
- **measure-your-mesh** (`signal`, ham/tinkerer) — quantify your network, one
  vital sign per part: SNR, link margin, hop count, airtime/duty cycle, packet
  loss, latency, throughput, congestion, coverage, uptime. ~10 parts.
- **mesh-pollution** (`signal`/`field-manual`, ham) — diagnose what degrades a
  mesh: chatty nodes, duplicate floods, bad repeater siting, the noise floor,
  spoofed prefixes, misconfigured intervals, hunting the polluter. ~7 parts.
- **bench-notes** (`signal`, tinkerer) — hardware deep-dives: boards, antennas,
  enclosures, power/solar, serial debugging, range testing, the home lab. ~9
  parts.
- **first-light** (`primer`, tinkerer) — zero to first map: first node, first
  packet, first repeater, first observer, first coverage check. ~6 parts.
- **signal-glossary** (`primer`, tinkerer/ham) — short, citable term explainers
  (SNR, dBm, airtime, spreading factor, RSSI, duty cycle, hop, link budget). ~8
  parts. The lightest way in; search + AEO bait done honestly.

Planning Table (Thursday):
- **the-honest-comparison** (`dispatch`, ham/tinkerer) — MeshCore vs the world:
  vs Meshtastic, vs packet/APRS, vs GMRS/cellular, vs commercial telemetry, vs
  "just a repeater". ~5 parts.
- **gear-up** (`dispatch`, tinkerer) — buying guides with a POV: first boards,
  antennas to buy/avoid, off-grid power, the $100 starter mesh, gateway
  hardware. ~6 parts.
- **under-the-hood** (`under-the-hood`, all) — how Waev works: ingest pipeline,
  the observer model, the privacy scrub, the topology engine, BYOB
  architecture, the live map. ~6 parts.

Long Read (Sunday):
- **from-the-field** (`dispatch`, community) — monthly field reports / case
  studies: Field Day, a CERT activation, an off-grid buildout, a hamfest, a SAR
  exercise, a storm watch. ~12 parts (first Sunday each month).
- **why-we** (`position`, all) — the manifesto series: why evidence-only, why
  refusal, why BYOB, why local, why a map may say "I don't know". ~6 parts (~one
  Sunday every eight weeks).
- **readiness** (`field-manual`, cert-emcomm) — preparedness: the readiness
  check, the tabletop, writing mesh into the plan, the served-agency report, the
  activation playbook, the after-action. ~6 parts.
- **neighborhood-watch** (`field-manual`/`primer`, off-grid) — community mesh
  building: starting one, who owns it, privacy in a shared mesh, scaling it, the
  block-by-block buildout. ~6 parts.

Series are ~87 of the 156. The rest are standalone/seasonal/evergreen, so no
series is stretched to fill the calendar.

## Formats (other ways in)
Not every slot is a 1,200-word how-to. Vary the shape so 156 stays fresh and
serves every reader — each still obeys the two-axis rule (a niche hook laddered
to a theme):
- **Instructional series** — the backbone above (most of Tue/Thu).
- **Evergreen explainers** — the searchable "what is X" library (`primer`); never
  expires, compounds in search.
- **Comparisons & buying guides** — decision content (Thu); high commercial
  intent.
- **Field reports & community dispatches** — real events and operators (Sun); the
  human, shareable surface.
- **Manifestos / positions** — the citable POV answer engines quote (Sun).
- **Diagnostics** — problem → symptom → fix (the mesh-pollution shape); the most
  useful thing you can hand a stuck operator.
- **From the inbox** — answering one real operator question (Sun `dispatch`,
  monthly); cheap to make, high resonance, seeds FAQ/AEO.
- **Seasonal dispatches** — Field Day, hurricane/wildfire season, winter-storm
  prep, new-year onboarding, holiday maker builds.

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
Enforced over any rolling quarter (~39 posts at 3×/week). Targets are a shape to
hold, not a quota to hit to the decimal.

- **Mix target (share of posts):** `signal` 20% · `field-manual` 20% · `primer`
  15% · `under-the-hood` 15% · `position` 15% · `dispatch` 15%. Tolerance ±3
  posts per bucket per rolling quarter.
- **Day-of-week:** write to the day's lean (Tuesday Workbench · Thursday Planning
  Table · Sunday Long Read). `position` posts almost always land on Sunday;
  comparisons and `under-the-hood` on Thursday; teaching series on Tuesday.
- **Pulse:** `position` fires roughly every other week (and owns most Sundays it
  runs); `from-the-field` takes the first Sunday of each month; `why-we` runs
  ~one Sunday every eight weeks. `dispatch` is seasonally anchored and may
  preempt the plan when a real moment lands. `primer` runs steadily as the
  top-of-funnel feeder. At most one installment of a given `series` per week.
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
