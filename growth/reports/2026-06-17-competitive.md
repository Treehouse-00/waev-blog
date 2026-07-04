# Competitive Monitor Report

**Report date:** 2026-06-17
**Period covered:** Since prior competitive report — 2026-06-11 to 2026-06-17 (7 days)
**Competitive set scanned:**
- MeshCore firmware project (blog.meshcore.io, github.com/meshcore-dev/MeshCore)
- Meshtastic firmware project (github.com/meshtastic/firmware, newreleases.io)
- Competing tools: MeshMonitor (meshmonitor.org), MeshAnchor (github.com/Nursedude/meshanchor),
  meshcore-hub (github.com/ipnet-mesh/meshcore-hub), MeshCore Stats (github.com/jorijn/meshcore-stats),
  LetsMesh Analyzer (analyzer.letsmesh.net), meshcore-observer (github.com/pe1hvh/meshcore-observer),
  EasySkyMesh (nodakmesh.org coverage), MeshDash (meshdash.co.uk)
- Community signals: NodakMesh blog, MeshAmerica, nodakmesh.org

---

## Material changes since last run

### 1 — Meshtastic 2.7.25 adds noise floor measurement (~June 10, 2026)

**Source:** https://newreleases.io/project/github/meshtastic/firmware/release/v2.7.25.104df5f
**Date:** ~2026-06-10
**What changed:** Meshtastic 2.7.25 alpha shipped with native noise floor measurement (`Noise floor by
@RCGV1, #9347`). The firmware now surfaces ambient RF noise floor data on compatible hardware. This
follows Meshtastic's 2.7.21 LNA-on-by-default change (April 2026) and is the first Meshtastic alpha
to expose the noise floor as a first-class observable metric.

Additional hardware additions: T-Impulse Plus, Heltec Mesh Node T1, LilyGo T-Echo Card.

**Segments touched:** tinkerer (operators running both Meshtastic and MeshCore on the bench; maker
community that benchmarks and compares the two ecosystems)

**Waev answer:** No published post addresses noise floor observation. The calendar has "measuring the
RF noise floor" (2026-08-02, ham/evaluation) as a standalone measurement post, but no content frames
the emerging capability gap between Meshtastic (which now surfaces noise floor natively) and MeshCore
operators who need an analytics platform to get equivalent channel-health insight. See Gap 4 below.

---

### 2 — MeshAnchor alpha reaches continuous-deployment milestone (June 14, 2026)

**Source:** https://github.com/Nursedude/meshanchor (last push 2026-06-14)
**Date:** 2026-06-14
**What changed:** MeshAnchor — described as "the first open-source NOC that treats MeshCore as the
primary radio" — pushed its most recent update on June 14. The project has been in field deployment
since 2026-05-02 on a Pi 4B + RAK Heltec V3 in Serial Companion mode. As of mid-June it carries:

- Bidirectional MeshCore channel messaging
- MeshCore ↔ RNS LXMF broadcast bridge (cross-federation fan-out validated)
- Fleet observability stack: collector + watchdog + 24 h clean-soak
- MeshCore map populated from map.meshcore.dev
- Prometheus metrics (50+ metrics, 5 pre-built Grafana dashboards)
- RF engineering tools: link budget, Fresnel zone, FSPL, coverage maps, space weather
- AI diagnostics (offline knowledge base + optional Claude PRO mode)
- 5,168 passing tests against mocks

MeshAnchor explicitly positions itself against Waev's space: "MeshCore brings capabilities that
Meshtastic can't… But MeshCore lacks the operational tooling. MeshAnchor fills that gap."

**Segments touched:** ham (club operators running Pi-based NOC infrastructure), tinkerer (makers
building professional-grade mesh monitoring stations), cert-emcomm (operators who need comms
readiness dashboards)

**Waev answer:** No published post or calendar slot addresses the MeshAnchor/NOC class of competing
tool. See Gap 1 below.

---

### 3 — LetsMesh public mesh analyzer identified as active competing platform (first detected this run)

**Source:** https://analyzer.letsmesh.net (via github.com/pe1hvh/meshcore-observer, created
2026-04-13)
**Date:** Active since at least April 2026; newly identified this scan
**What changed:** LetsMesh operates a public, shared MeshCore analytics service at
analyzer.letsmesh.net. Community members who run `meshcore-observer` can enable an MQTT uplink that
publishes their received packet logs (SNR, RSSI, packet type, hops, path) to the LetsMesh analyzer
via WebSocket+TLS with Ed25519 JWT authentication. The analyzer aggregates contributed data across
all participating observers to build a shared, community-wide network visibility picture.

Privacy controls are configurable (operators choose which packet types to share), but the data leaves
the operator's local environment and flows to a centrally hosted service. No bring-your-own-broker
model; the service operator (LetsMesh) holds the aggregated network data.

**Segments touched:** off-grid (community mesh operators who value local data control), tinkerer
(makers who want community-scale network maps without self-hosting), ham (operators who want to see
their network in a regional map context)

**Waev answer:** No published post or calendar slot addresses the choice between public/shared mesh
analytics networks and Waev's private BYOB model. See Gap 2 below.

---

## Gap recommendations

Each gap below is confirmed absent from all published posts in `src/content/blog/` and all existing
entries in `growth/calendar.yaml` as of 2026-06-17. Prior competitive reports' gap
recommendations (June 8 and June 10) remain unslotted and are not duplicated here.

---

### Gap 1 — What an operational NOC measures vs what network intelligence proves

**Competitive trigger:** MeshAnchor (June 14 active, Pi-based NOC) is now the most credible
MeshCore-primary competing offering in the network visibility space. It provides Prometheus metrics,
5 Grafana dashboards, and RF planning tools, and explicitly claims to fill the "operational tooling"
gap for MeshCore. Operators who discover MeshAnchor will ask: "I have 50 metrics and 5 dashboards —
what does Waev add?"

**Waev angle (canon-consistent):** MeshAnchor measures what is happening — packet counts, uptime
counters, RSSI per Prometheus scrape interval. These are operational telemetry answers to "is traffic
flowing?" Waev answers a different question: "are the edges on this map real?" The distinction is
epistemic. A Grafana dashboard showing 47 MQTT packets/min from a repeater cannot tell you whether
that repeater's outbound links are verified by enrolled observers or inferred from overheard
advertisements. Waev's enrolled observers produce directed evidence of specific links; 50 Prometheus
metrics cannot substitute for that. The post should acknowledge MeshAnchor's genuine usefulness for
operational monitoring and frame the two tools as complementary, with a clear statement of which
questions each answers. Fully within the knowing-over-guessing theme; does not contradict canon.

**Not covered by:**
- Published posts: none compare analytics intelligence to operational telemetry platforms
- Calendar: "do I need mesh analytics or just a repeater" (2027-01-12) is about infrastructure
  decision-making, not platform comparison; June 8 Gap 2 covered MeshMonitor (raw MQTT ingest)
  but MeshAnchor is architecturally distinct — metrics collection vs ingest dashboarding.
  The "the-honest-comparison" series has APRS, Meshtastic, GMRS, commercial LoRa telemetry, but
  not the MeshCore-primary NOC / operational analytics category.

```yaml
segment: ham
funnel_stage: evaluation
bucket: dispatch
theme: knowing-over-guessing
series: the-honest-comparison
primary_keyword: "MeshCore network operations center vs mesh analytics"
secondary_keyword: "what Prometheus metrics miss about verified mesh topology"
slot_date: 2027-09-18   # keyword-research to confirm; after existing series slots
```

---

### Gap 2 — Your mesh data in a public analyzer: what you give up and what you get

**Competitive trigger:** LetsMesh (analyzer.letsmesh.net) provides a shared, community-contributed
mesh analytics platform for MeshCore operators. Participants push their observer's received-packet
logs to a centrally hosted service, gaining community-scale network maps and aggregate
signal-quality insights. The meshcore-observer project (april 2026, active) provides an easy MQTT
uplink path that makes contributing data a one-line config change.

**Waev angle (canon-consistent):** LetsMesh's value proposition — community-wide coverage
visibility — requires operators to send their network's signal metadata to a service they don't
control. The metadata (SNR per hop, received packet paths, timing) is exactly the class of data
that Waev refuses to retain beyond what the operator's own broker holds. Waev's BYOB model means
a community mesh's topology data never leaves the operator's own broker. The post is not a
dismissal: LetsMesh provides a real service that is right for some operators. But the choice between
contributing to a shared map and retaining private mesh intelligence is a real decision, and no
current Waev content articulates what that trade-off is or which operator profile should care. This
maps directly to the power-of-refusal and own-your-ground themes; it is answerable within canon.

**Not covered by:**
- Published posts: `what-we-choose-not-to-know.mdx` covers Waev's own privacy choices; no post
  addresses operator-facing choices about sharing mesh data externally.
- Calendar: "mesh data sovereignty" (2026-10-11), "self-hosting mesh network data" (2026-07-23),
  and "avoiding vendor lock-in" (2027-02-04) all address BYOB and local control. None address the
  specific trade-off between private analytics and public/shared analytics networks.

```yaml
segment: off-grid
funnel_stage: evaluation
bucket: position
theme: own-your-ground
series: why-we
primary_keyword: "shared mesh analytics vs private mesh analytics"
secondary_keyword: "who owns your mesh data on a public network analyzer"
slot_date: 2027-09-21   # keyword-research to confirm
```

---

### Gap 3 — After the power-saving firmware upgrade: using analytics to verify your coverage held

**Competitive trigger:** MeshCore v1.15 (April 19, 2026) changed radio rxgain to ON by default,
adding ~0.5 mA idle current on most boards. EasySkyMesh 15 (May 2026) — a third-party power-saving
companion firmware built on MeshCore v1.15 — explicitly disables the FEM LNA by default on 1W
boards to claw back that current. The result: off-grid operators now have a spectrum of power vs.
sensitivity trade-offs to tune across firmware variants, and the correct setting is not obvious.
Operators running solar repeaters have upgraded to v1.15, may or may not have adjusted rxgain,
and now need to know whether their coverage changed. Meshtastic 2.7.21 independently made the
same rxgain-on decision, confirming this is a cross-ecosystem operators' concern.

**Waev angle (canon-consistent):** An operator who tuned their solar repeater for minimum power
draw, disabled rxgain, and deployed to the roof has no way to know whether coverage changed —
unless they have analytics. Waev's enrolled observers report what they can actually hear from each
node. If a repeater's rxgain change reduced its receive sensitivity, fewer distant nodes will appear
in the observer's packet log; the topology map contracts. Conversely, if the default rxgain-on
in v1.15 improved sensitivity, the observer sees more nodes. This is exactly the "knowing over
guessing" story: the firmware documentation gives an expected power budget; Waev's analytics tell
you whether the actual coverage matches the intent. A field-manual post for the off-grid operator
building a solar-powered node inventory is fully within canon.

**Not covered by:**
- Published posts: none address using analytics to validate firmware power-tuning decisions.
- Calendar: "solar power budget for a LoRa node" (2026-08-09, tinkerer/evaluation/bench-notes)
  is about initial power sizing, not post-upgrade validation. "measuring mesh node uptime"
  (2027-02-21, cert-emcomm/adoption) covers uptime reporting but not the firmware power-change
  context. No slot addresses the feedback loop between power-save firmware tuning and observed
  coverage.

```yaml
segment: off-grid
funnel_stage: adoption
bucket: field-manual
theme: knowing-over-guessing
series: measure-your-mesh
primary_keyword: "verify solar mesh repeater coverage after firmware upgrade"
secondary_keyword: "rxgain setting and mesh coverage in Waev analytics"
slot_date: 2026-08-20   # timely; near the existing solar power budget slot; keyword-research to slot
```

---

### Gap 4 — What Meshtastic's noise floor tells Meshtastic users, and what MeshCore operators see in Waev

**Competitive trigger:** Meshtastic 2.7.25 (~June 10, 2026) ships native noise floor measurement as
a first-class observable. Tinkerers who bench-test both ecosystems will notice the asymmetry:
Meshtastic shows RF noise floor natively on device; MeshCore does not expose this directly through
the firmware. For operators evaluating both platforms, "which mesh tells me more about its RF
environment?" is now a real question.

**Waev angle (canon-consistent):** MeshCore operators can infer channel noise health analytically
through Waev's per-link SNR history and channel busy ratio as observed by enrolled observers.
A consistently low SNR across all links from a given observer is a noise-floor signature. A post
that explains what "channel health" looks like in Waev's signal analytics — and how the same
information a Meshtastic operator reads as a noise floor number appears in MeshCore analytics as
a pattern across observer SNR readings — serves the tinkerer who runs both. It is also a clean
"earned-competence" piece: understanding what the signal is measuring, not just reading a number.
Fully within canon; Waev observes SNR, hops, and timing from enrolled observers; no inference
required to draw this picture.

**Not covered by:**
- Published posts: `what-is-snr-lora.mdx` and `reading-the-signal.mdx` cover SNR fundamentals.
  `measuring-snr-on-a-lora-mesh.mdx` is measurement methodology. None address channel ambient
  health (noise floor context) or cross-firmware comparison of what each ecosystem exposes.
- Calendar: "measuring the RF noise floor" (2026-08-02, ham/evaluation) covers the noise floor
  as a measurement topic, but not in the context of the Meshtastic 2.7.25 capability gap or what
  MeshCore operators see instead in analytics. A coordinated pair (Aug 2 noise floor measurement
  + a companion signal piece framing the Meshtastic comparison) is a stronger editorial sequence
  than a standalone slot.

```yaml
segment: tinkerer
funnel_stage: evaluation
bucket: signal
theme: earned-competence
series: measure-your-mesh
primary_keyword: "MeshCore channel health analytics noise floor"
secondary_keyword: "reading ambient RF health from observer SNR patterns"
slot_date: 2026-08-04   # timely alongside existing 2026-08-02 noise floor slot; keyword-research to slot
```

---

## Notes for keyword-research.md

Four gaps ready to slot, in priority order:

1. **Gap 3** (solar firmware validation) is the most timely insertion: v1.15 shipped in April, operators
   have had two months to upgrade, and many have not checked whether their coverage changed. The
   measure-your-mesh series is a natural home and the editorial sequence near the Aug 9 solar power
   budget slot is strong.

2. **Gap 4** (noise floor channel health) should coordinate with the existing Aug 2 noise floor slot.
   A companion signal piece (Aug 4) extending that measurement context is editorial sequencing, not
   a conflict — keyword-research should confirm cadence and evaluate whether to advance the Aug 2
   slot slightly to create room.

3. **Gap 1** (MeshAnchor NOC comparison) is evergreen but increasingly urgent. MeshAnchor is in
   continuous alpha deployment; its "fills the operational tooling gap" framing directly contests
   Waev's category claim. The honest-comparison series slot in the 2027-Q3 range allows prior gaps
   in the series (APRS, Meshtastic, commercial LoRa, MeshMonitor) to land first.

4. **Gap 2** (LetsMesh public analytics) is a clean privacy positioning piece for the why-we series.
   Suggested slot is after the existing 2027-01-21 trustworthy analytics entry.

All proposed `slot_date` values are illustrative; `keyword-research.md` should apply the Tue/Thu/Sun
cadence and verify no conflicts. All primary/secondary keywords confirmed absent from published posts
and current calendar slots as of 2026-06-17.

Prior gap recommendations from 2026-06-08 (4 gaps) and 2026-06-10 (4 gaps) remain unslotted.
This report adds 4 new gaps. Total outstanding: 12.
