# Competitive Monitor Report

**Report date:** 2026-07-01
**Period covered:** 2026-06-17 to 2026-07-01 (14 days since prior competitive report)
**Competitive set scanned:**
- MeshCore firmware project (blog.meshcore.io, github.com/meshcore-dev/MeshCore)
- MeshCore-Evo fork (github.com/mattzzw/MeshCore-Evo)
- MeshCoreNG fork (github.com/MichTronics/MeshCoreNG) — first detected this run
- MeshCore Home Assistant integration (github.com/meshcore-dev/meshcore-ha)
- Meshtastic firmware project (github.com/meshtastic/firmware, newreleases.io)
- Competing tools/dashboards: MeshCore Hub (github.com/ipnet-mesh/meshcore-hub),
  MeshAnchor (github.com/Nursedude/meshanchor), MeshCore Stats (jorijn, watsoncj),
  UKMesh / ukmesh (github.com/gadgethd/ukmesh) — first detected this run,
  LetsMesh Analyzer (analyzer.letsmesh.net), meshcore-observer (pe1hvh),
  meshcore-gui (pe1hvh)
- Community signals: meshcore.at, mesh.oppedahl.com, MeshAmerica, localmesh.nl

---

## Material changes since last run

### 1 — meshcore-ha v2.7.0 adds 13+ self-diagnostic sensors per node (~June 12, 2026)

**Source:** https://newreleases.io/project/github/meshcore-dev/meshcore-ha/release/v2.7.0
**Date:** ~2026-06-12 (released shortly before the prior run's cutoff; not captured in
the 2026-06-17 report)
**What changed:** The official MeshCore Home Assistant integration v2.7.0 ships opt-in
self-diagnostic sensors for the locally-attached companion node via `get_stats_core`,
`get_stats_radio`, and `get_stats_packets` polling — exposing 13+ new sensors including
noise floor (dBm), last RSSI, last SNR, cumulative TX and RX airtime, total packets
received and sent, flood-routed vs. direct-routed packet counts, and receive errors.
The update also adds hop_count and SNR fields on incoming channel messages, and a
per-repeater neighbor-count sensor. All diagnostics use local-transport polling only
(no mesh traffic generated). The integration now exposes meaningful per-node RF metrics
inside Home Assistant without any external platform.

**Segments touched:** tinkerer (home-lab operators running HA + MeshCore), ham (club
operators with HA infrastructure), off-grid (operators running HA-based home automation
alongside mesh comms)

**Waev answer:** No published post or calendar slot addresses HA integration as an
analytics layer for MeshCore. See Gap 1 below.

---

### 2 — MeshCore Hub v0.14.0 ships PostgreSQL support and grows to four active communities (June 19, 2026)

**Source:** https://github.com/ipnet-mesh/meshcore-hub/releases/tag/v0.14.0
(last push 2026-06-23)
**Date:** 2026-06-19
**What changed:** MeshCore Hub — a self-hosted, open-source analytics and monitoring
platform for MeshCore networks — released v0.14.0, adding PostgreSQL as an optional
database backend alongside SQLite (PostgreSQL will become the only supported backend
in ~3 months per the deprecation notice). The platform now supports REST API, full node
tagging, decoded live packet feeds, multi-observer deduplication, and a web dashboard.
Four active mesh communities are publicly listed as running MeshCore Hub deployments:
IPNet (Ipswich UK), CumbriaCQ (Cumbria UK), Skynet (Wales UK), and MeshCore Iasi
(Romania). The codebase received two pushes in the 14-day window (v0.14.0 on June 19,
push on June 23).

**Segments touched:** ham (club and regional network operators needing infrastructure
analytics), off-grid (community mesh operators wanting self-hosted analytics), cert-emcomm
(operators evaluating analytics tooling)

**Waev answer:** MeshCore Hub was already in the competitive set. No new gap created:
this is a velocity signal — the tool is active, getting real production use, and moving
toward a more production-grade backend. The distinction between MeshCore Hub (ingest from
a single attached observer, serial-connected companion model) and Waev (bring-your-own
MQTT broker, enrolled multi-observer topology, evidence-based edge drawing) remains
unaddressed in published content. Prior competitive reports' Gap 1 (MeshAnchor NOC vs
mesh analytics) covers adjacent territory; the honest-comparison series entry proposed
for 2027-09-18 is the right home for the full operator-vs-analytics framing.

---

### 3 — UKMesh live analytics platform identified as active competing service (first detected this run)

**Source:** https://github.com/gadgethd/ukmesh (created 2026-03-03, publicly available)
**Date:** Active since at least March 2026; first detected this scan
**What changed:** UKMesh is a real-time analytics platform for MeshCore networks, built on
mctomqtt-compatible observers that contribute to a centrally-hosted service. Features
include: live node map with animated packet arcs, RF coverage viewshed polygons per
repeater (SRTM terrain-aware), link intelligence overlay with directional observations and
path-loss viability, a beta path-prediction model, decoded live packet feed, an owner
portal with repeater-specific dashboards (packet history, heard-by lists, link health,
advert trends), and a public UK site feed. Multiple network topologies are supported via
multi-observer deduplication. Operators who run a meshcore-packet-capture observer can
contribute their data to the shared platform.

The architectural model is centralized: observer data flows to UKMesh's hosted platform.
There is no bring-your-own-broker option; UKMesh holds the aggregated data.

MeshCore Hub's documented communities (IPNet, CumbriaCQ) explicitly enable contribution
to the UKMesh network alongside their local Hub instances.

**Segments touched:** ham (UK operators and club nets), off-grid (community mesh operators
wanting live maps), tinkerer (makers evaluating analytics options)

**Waev answer:** UKMesh provides substantially the same feature surface as Waev — live
maps, link intelligence, coverage viewsheds, packet feeds — but does so with a
centralized, community-contributed data model rather than operator-held data. No published
post or calendar slot addresses this choice directly; see Gap 2 below (which also upgrades
and re-confirms June 17 Gap 2 regarding LetsMesh).

---

### 4 — Meshtastic 2.7.26 Beta adds EU_866 and EU_N_868 as first-class regions (June 20–24, 2026)

**Source:**
https://newreleases.io/project/github/meshtastic/firmware/release/v2.7.26.54e0d8d
https://github.com/meshtastic/firmware/commit/ab882c5619caf578cb845d6403d79adc2bbff3eb
**Date:** 2026-06-10 (commit merged), 2026-06-20–24 (beta release cycle)
**What changed:** Meshtastic 2.7.26 Beta adds EU_866 (865.6–867.6 MHz, 2.5% duty cycle,
27 dBm) and EU_N_868 (narrow-preset variant of the EU 868 band) as fully validated
first-class regions alongside EU_868. Region selection in the firmware menu now validates
the chosen region against the hardware, preventing incompatible selections. MQTT root is
updated to use the newly selected region name. Also included: Station G3 B&Q config, fix
for firmware crash during Android WiFi/TCP handshake recovery, GPS time sync fix, and
several sensor/display bug fixes.

**Segments touched:** tinkerer (EU makers evaluating LoRa frequency choices), ham (EU
amateur radio operators running MeshCore on the same hardware and comparing options)

**Waev answer:** No direct gap. MeshCore's analogous EU frequency support was already
available via the `region def` CLI command (v1.16.0 improved this). This confirms Meshtastic
is tracking EU regulatory requirements in parallel with MeshCore. No new Waev content gap;
existing calendar coverage of regulatory topics (duty cycle, EU band limitations) under the
signal-glossary and measure-your-mesh series is sufficient. Noted as a landscape signal.

---

## Gap recommendations

Each gap below is confirmed absent from all published posts in `src/content/blog/` and all
existing entries in `growth/calendar.yaml` as of 2026-07-01. Prior competitive reports'
gap recommendations (June 8, June 10, June 17: 12 total outstanding, all unslotted) are
not duplicated here.

---

### Gap 1 — What Home Assistant sensors give a MeshCore operator, and what they don't

**Competitive trigger:** meshcore-ha v2.7.0 (~June 12, 2026) adds 13+ per-node
diagnostic sensors to the official Home Assistant integration, including noise floor,
RSSI, SNR, TX/RX airtime, and packet counts. HA-connected MeshCore operators can now
read per-node RF metrics without any external platform. The question "why do I need Waev
if HA already shows me all this?" will surface in community discussions and becomes the
new honest-comparison entry point for the tinkerer and ham segments.

**Waev angle (canon-consistent):** HA's meshcore-ha sensors show what a single companion
or repeater can observe *about itself*: its own last RSSI, its own noise floor reading,
its own cumulative packet counters. These counters reset on reboot and report only what
one node hears from one vantage point. Waev's enrolled observers produce directed,
timestamped evidence of link quality *between* nodes: which nodes heard which other
nodes, at what SNR, over what path, across what window of time. A companion's
`last_rssi` does not tell you which neighboring node just went silent; Waev's topology
graph does, because the edge disappears when the observer stops hearing it. The
distinction is not about feature count — it is about the epistemic gap between
"what I measured about myself" and "what I can prove about the network." Fully within
the knowing-over-guessing theme; does not contradict canon.

**Not covered by:**
- Published posts: no post mentions Home Assistant or compares self-reported node
  diagnostics to observer-sourced topology intelligence.
- Calendar: "MeshCore vs commercial LoRa telemetry" (2026-11-03, cert-emcomm/evaluation)
  addresses open vs. proprietary telemetry stacks, not HA-native monitoring. "what is
  a mesh network observer" (2026-11-26, ham/evaluation) explains the observer model but
  does not frame the contrast with HA sensors. "do I need mesh analytics or just a
  repeater" (2027-01-12, ham/evaluation) is about infrastructure decisions, not HA.
  The the-honest-comparison series covers APRS, Meshtastic, GMRS, MeshAnchor NOC, and
  commercial LoRa telemetry — not HA.

```yaml
segment: tinkerer
funnel_stage: evaluation
bucket: dispatch
theme: knowing-over-guessing
series: the-honest-comparison
primary_keyword: "Home Assistant MeshCore monitoring vs mesh analytics"
secondary_keyword: "what HA sensors miss about verified mesh topology"
slot_date: 2027-09-28   # keyword-research to confirm; after existing series entries
```

---

### Gap 2 — Your community mesh data on a UK analytics platform: what contributors gain and give up (re-confirms June 17 Gap 2, stronger trigger)

**Competitive trigger:** UKMesh (gadgethd/ukmesh, live since March 2026, first detected
this run) is a real-time MeshCore analytics platform with live maps, RF coverage
viewsheds (SRTM terrain-aware), link intelligence, path prediction, and owner portals.
MeshCore Hub's documented communities (IPNet Ipswich, CumbriaCQ Cumbria) explicitly
connect their local Hub instances to UKMesh as a community-scale visibility layer.
UKMesh aggregates contributed observer data centrally — there is no BYOB model; the
platform operator holds the network data.

This re-confirms and substantially strengthens the June 17 Gap 2 (LetsMesh). LetsMesh
was a data-uplink endpoint for observers; UKMesh is a fully realized analytics platform
with feature parity to Waev, actively serving live UK mesh communities. The operator
choice between contributing to a shared analytics network and retaining private mesh
intelligence is now a real, visible decision in the community, not a hypothetical.

**Waev angle (canon-consistent):** UKMesh delivers the coverage visualization, link
intelligence, and live packet feeds that operators want. The choice an off-grid or
community mesh operator must make is whether those capabilities are worth routing their
network's signal metadata (SNR per hop, packet paths, timing, node identities) through
a platform they do not control. Waev's BYOB model provides the same analytics surface
with the data remaining in the operator's own broker. The post is not a dismissal:
UKMesh is a real service with real value, appropriate for community deployments that
accept shared-visibility terms. But for operators who value data residency — off-grid
neighborhoods, CERT teams, community meshes with privacy expectations — the trade-off
deserves a direct, factual explanation. Maps directly to own-your-ground and
power-of-refusal themes; does not contradict canon.

**Not covered by:**
- Published posts: `what-we-choose-not-to-know.mdx` covers Waev's own privacy choices
  internally; no post addresses the operator-level decision between shared-platform
  analytics and BYOB private analytics.
- Calendar: "self-hosting mesh network data" (2026-07-23, off-grid/adoption/why-we),
  "mesh data sovereignty" (2026-10-11, off-grid/evaluation), and "avoiding vendor
  lock-in" (2027-02-04, off-grid/evaluation) all address BYOB and local control. None
  address the specific trade-off between contributing data to a shared analytics network
  and retaining private analytics. June 17 Gap 2 (LetsMesh trigger) remains unslotted.
  UKMesh is now a stronger trigger for the same editorial slot.

```yaml
segment: off-grid
funnel_stage: evaluation
bucket: position
theme: own-your-ground
series: why-we
primary_keyword: "shared mesh analytics vs private mesh analytics"
secondary_keyword: "who holds your community mesh data on a shared analytics platform"
slot_date: 2027-09-21   # same as June 17 Gap 2 recommendation; keyword-research to confirm
```

---

### Gap 3 — How v1.16.0 power-saving mode and the 47-hour advert default change what Waev can see

**Competitive trigger:** MeshCore v1.16.0 (June 6, 2026) introduced two changes that
directly affect analytics visibility. First: `powersaving on` is now available for all
ESP32-based repeaters, putting the MCU into sleep between transmissions. Second: the
default flood advert interval changed from 12 hours to 47 hours (and the new
`flood.max.advert` defaults to 8 hops, limiting how far adverts propagate). Operators
upgrading solar-powered ESP32 repeaters are now deploying these settings. As of late
June, v1.16.0 is widely adopted — the meshcore.at release article and repeater
operator blogs explicitly recommend it for solar builds.

**Waev angle (canon-consistent):** Waev's topology map draws edges from enrolled
observers and authenticated repeaters. Advert packets are the mechanism by which
nodes announce themselves across the mesh; enrolled observers relay advert metadata
to Waev's ingest pipeline. Under v1.16.0 defaults, a repeater that previously re-
advertised its presence every 12 hours now does so every 47 hours. An operator who
just upgraded their fleet will notice that the Waev map takes significantly longer to
reflect topology changes — not because something is broken, but because the firmware
now advertises less aggressively by design. Separately, `powersaving on` introduces
a small wake-latency on incoming packets that may affect what observers can hear from
a sleeping ESP32 repeater at the edge of a link. A post that explains exactly which
firmware settings affect Waev's topology update cadence — and what the operator can do
to confirm their map reflects the current network state — is squarely within canon and
addresses a real operational confusion that v1.16.0 will create. The knowing-over-
guessing theme: you upgraded to save power, but you should verify the coverage you
think you have still exists. Does not contradict canon.

**Not covered by:**
- Published posts: no post explains how firmware advert settings affect the Waev topology
  map update cadence. `where-to-put-your-next-repeater.mdx` covers placement but not
  post-upgrade verification. `reading-the-signal.mdx` covers SNR; nothing covers the
  relationship between advert interval and map staleness.
- Calendar: "solar power budget for a LoRa node" (2026-08-09, off-grid/evaluation) covers
  initial power sizing. "verify solar mesh repeater coverage after firmware upgrade"
  (June 17 Gap 3) was about v1.15 rxgain changes — this is a different and distinct
  operational question about the v1.16 advert interval and sleep mode changes.
  "LoRa spreading factor explained" (2026-08-30) covers SF parameters, not advert
  behavior. None address advert interval defaults and their effect on analytics coverage.

```yaml
segment: off-grid
funnel_stage: adoption
bucket: field-manual
theme: knowing-over-guessing
primary_keyword: "MeshCore v1.16 power saving effect on mesh analytics"
secondary_keyword: "why your Waev topology map updates slower after firmware upgrade"
slot_date: 2026-09-11   # timely; keyword-research to confirm cadence and conflicts
```

---

### Gap 4 — Which firmware you choose for your repeaters determines what analytics can see

**Competitive trigger:** The MeshCore repeater firmware ecosystem now has three active
variants with meaningfully different advert defaults:
- **Upstream v1.16.0:** `flood.advert.interval` default 47 hours; `flood.max.advert`
  caps advert propagation at 8 hops by default.
- **MeshCore-Evo v1.15.0-evo_0.1.21 (May 25):** flood advert interval disabled (0) by
  default; `flood.advert.base` set to 0.308 to limit flood advert forwarding.
- **MeshCoreNG v1.0.x:** flood adverts disabled by default; `flood.advert.base` 0.308;
  adds `get dense.stats` (RAM-only) and internet bridge. Declares "a telemetry foundation
  for future maps, dashboards and observers."

An operator running MeshCore-Evo or MeshCoreNG repeaters with default settings will see
their adverts almost entirely suppressed — those repeaters will not proactively broadcast
their presence to enrolled observers, and any Waev-connected observer may see much sparser
topology coverage than expected. The community context: both forks exist specifically for
operators managing busy or dense meshes, who are exactly the operators running larger
networks where analytics value is highest.

**Waev angle (canon-consistent):** Waev's enrolled observers rely on advert and packet
data from the mesh to build the topology map. Repeaters that disable flood advert
forwarding will still appear in the Waev map when they are observed forwarding other
packets (direct path evidence), but topology edges may take longer to validate without
advert confirmation. The `advert.interval` (directed advert, not flood) is separate from
`flood.advert.interval` and is the more important setting for Waev connectivity. A post
that explains, for each major firmware variant, which settings affect Waev's visibility
and what the operator should verify after deploying a non-default firmware configuration
serves the ham and tinkerer operators making firmware choices for their repeater
infrastructure. Earned-competence theme; fully within canon; Waev observes what the mesh
reports — this explains what to configure so the mesh reports what it should.

**Not covered by:**
- Published posts: no post addresses firmware variant choices (upstream vs Evo vs NG) or
  how advert configuration maps to analytics coverage.
- Calendar: "how MeshCore repeaters are authenticated" (2026-09-10, ham/evaluation/
  knowing-over-guessing) explains the authentication model, not advert settings and
  analytics. "diagnosing a chatty node on a LoRa mesh" (2026-09-29) covers the too-many-
  adverts problem; this gap covers the opposite (too-few-adverts) from the firmware
  fragmentation context. No existing entry addresses the multi-firmware landscape and
  its analytics implications.

```yaml
segment: ham
funnel_stage: evaluation
bucket: under-the-hood
theme: earned-competence
primary_keyword: "MeshCore firmware fork effect on mesh topology analytics"
secondary_keyword: "MeshCore-Evo advert settings and Waev coverage"
slot_date: 2026-11-06   # keyword-research to confirm; allows time for Evo/NG to mature
```

---

## Notes for keyword-research.md

Four gaps ready to slot, in priority order:

1. **Gap 3** (v1.16.0 powersaving + 47h advert default) is the most immediately timely:
   v1.16.0 is already in wide deployment and operators are hitting this within weeks of
   upgrading. The suggested slot (2026-09-11) leaves a ~10-week gap for Waev's content to
   land while the firmware upgrade wave is still recent. Confirmed non-overlapping with
   June 17 Gap 3 (rxgain context), which covers a different firmware change.

2. **Gap 1** (HA sensors vs. mesh analytics) should be slotted relatively soon — meshcore-ha
   v2.7.0 is still new and the comparison framing will age. The 2027-09-28 date is
   illustrative; if the the-honest-comparison series fills faster, this can move earlier.
   keyword-research should check for any existing HA-related content in the community before
   confirming the primary_keyword.

3. **Gap 2** (UKMesh / shared analytics platform) re-confirms June 17 Gap 2. The total
   outstanding gap for "shared vs. private mesh analytics" is now backed by both LetsMesh
   and UKMesh. If keyword-research slots June 17 Gap 2, it covers this trigger too.
   The suggested slot (2027-09-21) is illustrative; confirm no conflict with the
   existing "trustworthy mesh analytics" entry (2027-01-21, cert-emcomm/evaluation).

4. **Gap 4** (firmware variant fragmentation) is evergreen but becoming more urgent as
   MeshCore-Evo matures and MeshCoreNG gains an internet-bridge capability. The
   2026-11-06 suggested slot gives the Evo/NG ecosystem a few more months to solidify
   before a definitive editorial take is appropriate.

Prior gap recommendations from 2026-06-08 (4 gaps), 2026-06-10 (4 gaps), and 2026-06-17
(4 gaps) remain unslotted. This report adds 4 new gaps. Total outstanding: 16.
