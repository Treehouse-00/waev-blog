# Competitive Monitor Report

**Report date:** 2026-06-10
**Period covered:** Since prior competitive report — 2026-06-09 to 2026-06-10 (2 days)
**Competitive set scanned:**
- MeshCore firmware project (blog.meshcore.io, github.com/meshcore-dev/MeshCore)
- Meshtastic firmware project (github.com/meshtastic/firmware)
- Competing tools: MeshMonitor (meshmonitor.org / github.com/Yeraze/meshmonitor),
  meshcore-ha, EasySkyMesh, MeshOS/Andy Kirby fork
- Community signals: r/meshcore, MeshCore Discord, blog posts

---

## Material changes since last run

### 1 — MeshMonitor v4.9.2 ships inactive-node and new-node alerts for MeshCore sources (~June 9, 2026)

**Source:** https://newreleases.io/project/github/Yeraze/meshmonitor/release/v4.9.2
**Date:** ~2026-06-09 ("one day ago" at time of scan)
**What changed:** v4.9.2 adds two MeshCore-specific alert types that were previously absent from
MeshMonitor's notification surface:

- **Inactive-node alerts** — fires when a MeshCore node's `lastHeard` timestamp (in ms) ages past a
  configurable threshold. This is the first time MeshMonitor has offered per-node downtime alerting
  for MeshCore sources, matching what has existed for Meshtastic sources.
- **New-node discovered alerts** — fires on first real-time contact advert for a MeshCore node
  (de-duplicated per public key), with device-type labels.

Also in the release: drag-and-drop reordering of the Sources list in the Unified View, and three bug
fixes (migrate-db table ordering, Channels tab layout on iOS PWAs, channel reorder cross-source bleed).

MeshMonitor now sits at ~513 stars and has executed 10+ MeshCore-specific releases since v4.5.0 (May 14).
As of v4.5.0, MeshCore is a first-class source type in MeshMonitor alongside Meshtastic.

**Segments touched:** tinkerer, ham, off-grid (operators evaluating or running a self-hosted dashboard
for MeshCore), cert-emcomm (operators who need node uptime alerting)

**Waev answer:** Not published; not in calendar. MeshMonitor's inactive-node alert fires on raw
`lastHeard` data from the MQTT stream, without distinguishing whether silence means the node went down,
the observer lost line of sight, or a routing change stopped packets reaching the ingest point.
Waev's enrolled-observer model can say which — an observer that stops hearing a node is a different
signal than a node that stops appearing anywhere across the network. No Waev content articulates this
distinction or what "node inactivity" means under an evidence-based topology model versus a raw
`lastHeard` timestamp.

---

### 2 — MeshCore project governance split (April 2026; previously undetected in last scan)

**Source:** https://blog.meshcore.io/2026/04/23/the-split
**Date:** 2026-04-23 (public announcement); trademark filing dated 2026-03-29
**What changed:** The MeshCore project publicly split between the original firmware development team
(Scott Powell, Liam Cottle, and others; now at meshcore.io) and an ecosystem contributor (Andy Kirby)
who filed a trademark application for "MeshCore" without informing the team and has since launched the
"MeshOS" brand for a fork targeting standalone companion hardware only.

Key facts for context:
- The authoritative firmware repository remains `github.com/meshcore-dev/MeshCore` (MIT license,
  3K stars, 82 releases). The split does not affect the firmware itself.
- MeshOS does not provide repeater firmware and only targets a limited subset of client hardware.
- The core dev team retained control of the meshcore.io domain and launched a new Discord; the old
  meshcore.co.uk domain and original Discord remain with Andy Kirby.
- Community scale at the time of the split: 38,000+ nodes, 100,000+ active users across Android/iOS.

**Segments touched:** All four — any operator deploying infrastructure MeshCore needs to know which
firmware, toolchain, and documentation to trust. Highest urgency for ham and cert-emcomm, who depend
on firmware integrity for resilience use cases.

**Waev answer:** Not published; not in calendar. Waev's BYOB model means it subscribes to whatever
MQTT broker the operator runs, regardless of which companion app or standalone firmware variant they
use. The schism is an opening to articulate that Waev is firmware-agnostic and brand-agnostic: it
observes the packets that authenticated repeaters and enrolled observers actually produce — the same
protocol regardless of which Ripple UI or MeshOS app is on the companion device. No Waev content
addresses the split or explains how an analytics tool relates to the upstream firmware vs the app ecosystem.

---

## Gap recommendations

Each gap below is confirmed absent from all published posts (`src/content/blog/`) and all existing
`growth/calendar.yaml` entries as of 2026-06-10.

---

### Gap 4 — "What does it mean that MeshMonitor can see my MeshCore network?"

**Competitive trigger:** Since v4.5.0 (May 14), MeshMonitor treats MeshCore as a first-class source.
By v4.9.2 (June 9), it fires per-node alerts, renders neighbor links on the map, supports per-source
automations, stores contact paths, and shows telemetry graphs. The tinkerer and off-grid operator
seeing MeshMonitor's feature list for the first time will reasonably ask: "Is this what I should be
using? How does it differ from Waev?" This comparison question is not yet answered in Waev's content.

**Waev angle (canon-consistent):** MeshMonitor is a self-hosted raw MQTT ingest tool: it stores
what the broker delivers, including companion-device identity metadata, inferred map edges from the
MeshOS or companion app's own path inference, and `lastHeard` timestamps that are not observer-
validated. This is not a dismissal — MeshMonitor is genuinely useful for operators who want local
control and deep automation. But the specific epistemic claims it can and cannot make differ from
Waev's enrolled-observer model. A comparison post explaining these two different models (raw ingest vs.
evidence-based topology) is fully within canon, extends the "the-honest-comparison" series, and
directly addresses the tinkerer's decision point that MeshMonitor's v4.5–v4.9 releases have created.

**Not covered by:**
- Published posts: none compare Waev to MeshMonitor specifically
- Calendar: "MeshCore self-hosted dashboard vs analytics platform" (proposed 2027-09-07 in prior
  competitive report, Gap 2) — that gap remains unslotted. This recommendation reinforces its urgency
  given MeshMonitor's accelerated MeshCore feature cadence since May 14.

```yaml
segment: tinkerer
funnel_stage: evaluation
bucket: dispatch
theme: knowing-over-guessing
series: the-honest-comparison
primary_keyword: "MeshCore self-hosted dashboard vs analytics platform"
secondary_keyword: "what MeshMonitor shows that Waev doesn't and vice versa"
slot_date: 2026-09-28   # keyword-research to confirm; acceleration from prior report Gap 2 urgency
```

---

### Gap 3 — Monitoring a MeshCore mesh at community scale (100K users, 38K nodes)

**Competitive trigger:** The MeshCore schism blog post disclosed that the project has grown to 38,000+
nodes and 100,000+ active users in 18 months — more than doubling implied user counts from earlier
estimates. At this scale, operators managing a community or club deployment face qualitatively
different analytics challenges than a 5-node bench experiment: stale repeater prefixes accumulate,
advert storms from new nodes appear, multiple observers may cover the same coverage zone. The question
"how do I monitor a growing MeshCore network?" is now a real, audience-searched topic.

**Waev angle (canon-consistent):** Waev's evidence-based ingest (only enrolled observers, only
authenticated repeaters) scales cleanly: adding observers extends coverage without adding noise from
unverified nodes. Waev's privacy model (companion identity-scrubbed at ingest edge) becomes more
important, not less, as community mesh size grows and strangers' companion devices begin appearing
in the ingest stream. A post for the off-grid / community-mesh operator managing a network that has
grown from 5 to 50+ nodes is fully within canon. It maps to the known keyword "monitor a growing
community mesh network" (calendar 2026-10-27) — but that slot approaches from the "scale" angle
generically. The gap here is the concrete, timely hook: the ecosystem is actually at 38K nodes.

**Not covered by:**
- Published posts: `starting-a-local-mesh-group.mdx` covers starting, not scaling analytics
- Calendar: slot 2026-10-27 ("monitor a growing community mesh network") is the closest match; this
  gap recommendation endorses prioritizing and concretizing that slot with the ecosystem-scale trigger,
  or pulling it earlier.

```yaml
segment: off-grid
funnel_stage: evaluation
bucket: field-manual
theme: knowing-over-guessing
primary_keyword: "managing a large community MeshCore mesh"
secondary_keyword: "mesh analytics when your network outgrows a bench test"
slot_date: 2026-09-25   # keyword-research to slot; or concretize existing 2026-10-27 slot
```

---

### Gap 2 — Which MeshCore analytics tool survives the brand split?

**Competitive trigger:** The April 2026 MeshCore schism (meshcore.io vs meshcore.co.uk / MeshOS)
created a trust vacuum for operators who had been following "official" MeshCore channels. Operators
who relied on Andy Kirby's YouTube or the original Discord are now asking which tools and which
documentation to trust. Any analytics layer built on top of a specific companion app or branded around
one side of the dispute inherits that uncertainty. Waev does not.

**Waev angle (canon-consistent):** Waev is an MQTT subscriber: it reads the packets that enrolled
repeaters and observers produce over the operator's own broker. The packets conform to the MeshCore
protocol spec as maintained in `github.com/meshcore-dev/MeshCore` — the only "official" in this
context is the firmware source. A post that explains Waev's independence from app-layer branding
(no Ripple dependency, no MeshOS dependency, bring-your-own-broker) is answerable within canon and
maps directly to the "own-your-ground" theme. Waev works because of what the firmware produces, not
because of which Discord server or website you trust.

**Not covered by:**
- Published posts: none address the schism or Waev's firmware-agnostic positioning
- Calendar: "evidence-based mesh topology explained" (2027-03-09) is about topology mechanics;
  "choosing a mesh tool you can trust" (2027-01-21) is about trustworthy analytics in general.
  No slot specifically addresses Waev's independence from the MeshCore app ecosystem split.

```yaml
segment: ham
funnel_stage: awareness
bucket: position
theme: own-your-ground
series: why-we
primary_keyword: "MeshCore analytics tool firmware agnostic"
secondary_keyword: "mesh analytics that works with any MeshCore firmware"
slot_date: 2026-09-21   # keyword-research to slot
```

---

### Gap 1 — What "node offline" actually means: raw lastHeard vs. observer evidence

**Competitive trigger:** MeshMonitor v4.9.2 (~June 9, 2026) is the first competing tool to ship
inactive-node alerts for MeshCore sources. The alert fires when `lastHeard` ages past a threshold in
raw MQTT data. For the ham and cert-emcomm operator who has just seen this feature, the natural
question is: "is that the same as what Waev would show me?"

**Waev angle (canon-consistent):** It is not the same. A `lastHeard` timestamp in a raw MQTT stream
tells you when the broker last received a packet from that node — but not whether that silence means
the node went down, the observer lost path, or a routing change stopped packets flowing through the
monitored ingest point. Waev's enrolled observers provide directed evidence: an observer that stops
receiving a node's packets is a specific link failure, not a global health verdict. A post that
explains the difference — and why "my analytics tool says node X is silent" needs evidence context —
is fully within the knowing-over-guessing theme and answerable within canon (Waev draws only what its
enrolled observers can verify).

**Not covered by:**
- Published posts: none address inactive-node alerting or the semantics of "last heard" on a mesh
- Calendar: "when your MQTT broker goes down" (2026-07-21) covers broker outages, not node inactivity;
  "trusting your mesh map in an emergency" (2026-09-10) is about topology trust, not alert semantics.
  No slot compares raw `lastHeard` alerting to observer-evidence-based inactivity detection.

```yaml
segment: cert-emcomm
funnel_stage: evaluation
bucket: signal
theme: knowing-over-guessing
primary_keyword: "mesh node offline alert false positive"
secondary_keyword: "what lastHeard means on a mesh network"
slot_date: 2026-09-18   # first open Fri after current calendar end; keyword-research to slot
```

---

## Notes for keyword-research.md

Four gaps ready to slot, in priority order:

1. **Gap 4** (MeshMonitor comparison) is now the highest-priority insertion. v4.5–v4.9 have
   transformed MeshMonitor from a Meshtastic tool with MeshCore experiments into a capable MeshCore
   analytics platform. The window to publish a credible epistemic comparison before MeshMonitor's
   position fully hardens is closing. Pairs with and supersedes prior report Gap 2 (same topic, same
   recommended slot area).

2. **Gap 3** (community-scale monitoring) can reinforce or advance the existing 2026-10-27 calendar
   slot rather than requiring a new insertion.

3. **Gap 2** (firmware-agnostic positioning post-split) is evergreen trust content with a timely
   hook; the schism is still fresh in community memory.

4. **Gap 1** (inactive-node alerting semantics) is directly triggered by v4.9.2 and addresses the
   cert-emcomm conversion core at the evaluation stage — high intent, timely hook.

All proposed `slot_date` values fall after the current last calendar entry (2027-08-29 approximate)
except Gap 3 which references or advances an existing 2026-10-27 slot. `keyword-research.md` should
apply the Tue/Thu/Sun cadence and verify no conflicts before slotting.
