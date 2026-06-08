# Competitive Monitor Report

**Report date:** 2026-06-08
**Period covered:** First run — last 30 days (2026-05-09 to 2026-06-08)
**Competitive set scanned:**
- MeshCore firmware project (blog.meshcore.io, github.com/meshcore-dev/MeshCore)
- Meshtastic firmware project (github.com/meshtastic/firmware)
- Competing tools: MeshMonitor (meshmonitor.org), meshcore-ha, meshcore-hub, MeshConsole,
  MeshRadar.io, PotatoMesh, mattwynharris/Meshcore-Dashboard, MeshForge / MeshAnchor

---

## Material changes since last run

### 1 — MeshCore v1.16.0 released (June 6, 2026)

**Source:** https://blog.meshcore.io/2026/06/06/release-1-16-0
**Date:** 2026-06-06
**What changed:** The most significant firmware drop in the monitoring window. Key operator-facing changes:

- **New `flood.max.unscoped` and `flood.max.advert` CLI variables** — operators can now cap how many
  hops an unscoped flood or an advert packet is allowed to travel. Default for unscoped is 64 (off);
  default for advert cap is 8. This is the first firmware-level knob to address the community's
  longstanding complaint that a single flood message can "make the whole region red."
- **Default flood advert interval changed from 12 h to 47 h** — a large reduction in default
  background traffic, aimed at reducing airtime pressure on busy meshes.
- **Extended ACK support** — ACK packets grow from 4 to 6 bytes, carrying an extended attempt number.
  Groundwork for eventual >4-retry direct messages; repeaters must upgrade first.
- **Companion raw packet API** — the companion firmware now allows apps to compose and send full raw
  packets (headers + path + payload). Enables custom diagnostics that were previously impossible
  without custom firmware.
- **Default Scope improvements** — companion can now override Default Scope to explicit unscoped;
  improved region discovery via ad-hoc requests to nearby repeaters without pre-adding them as
  contacts.
- **EU off-grid client repeat frequency shifted** (869.0 → 869.495 MHz) — relevant for EU deployments.

**Segments touched:** tinkerer, ham (advanced operators tuning mesh behaviour)

**Waev answer:** Not published; not in calendar. The flood control and advert interval changes directly
affect what Waev can observe — an operator tuning `flood.max.advert` needs to see, from their mesh
analytics, whether the change reduced airtime pressure without creating coverage gaps. No current Waev
content addresses this feedback loop.

---

### 2 — MeshCore v1.15.0 released (April 19, 2026)

**Source:** https://blog.meshcore.io/2026/04/19/release-1-15-0
**Date:** 2026-04-19
**What changed:**

- **Default Scope support** — a new architectural concept that limits which nodes receive which flood
  packets by default. The companion app can configure scope; repeaters enforce it. This fundamentally
  changes how traffic propagates and means that a mesh topology map based on raw flood observation
  will now differ from a scoped mesh. Community documentation on the impact of Default Scope for
  network analytics is sparse.
- **nRF52 OTA firmware updates** — previously ESP32-only; now available on nRF-based hardware (T-Echo,
  RAK4631, etc.). Expands the addressable repeater hardware base.
- **Radio frequency range extended to 150 MHz** — opens experimental below-band deployments.
- **New `get|set dutycycle` CLI command** — operator-visible duty cycle value, following v1.14.1's
  token-bucket enforcement.

**Segments touched:** tinkerer, ham

**Waev answer:** Not published; not in calendar (see gap 1 below).

---

### 3 — MeshMonitor v4.8.3 released (June 2, 2026)

**Source:** https://github.com/Yeraze/meshmonitor (504 stars, 327 releases)
**Date:** 2026-06-02
**What changed:** MeshMonitor is the most actively developed self-hosted mesh dashboard in the
competitive set. v4.8.3 is its latest release and the project shows continuous weekly iteration.
Key capabilities relevant to Waev's position:

- Monitors both Meshtastic and MeshCore over MQTT from a single self-hosted container.
- Its website (meshmonitor.org) explicitly states **"MQTT and MeshCore source types coming soon"** —
  confirming that native MeshCore ingest is an active development priority.
- Supports multi-source deployments, per-source permissions, push notifications, Kubernetes/Helm
  deployment, and automations (geofence triggers, auto-responders, scheduled messages).
- 327 releases in under a year of existence — extremely fast development cadence.

**Segments touched:** tinkerer, ham, off-grid (evaluation stage: operators looking for a local
dashboard for their MeshCore mesh)

**Waev answer:** Not published; not in calendar. MeshMonitor is a raw-MQTT ingest tool: it shows every
packet that arrives, without distinguishing verified topology from inferred or spoofed edges, and
without privacy-scrubbing companion device identities. Waev's differentiation (evidence-based
topology, privacy-by-default, BYOB) is not yet articulated in comparison with this class of tool.

---

### 4 — meshcore-ha v2.6.0 released (June 3, 2026)

**Source:** https://newreleases.io/project/github/meshcore-dev/meshcore-ha/release/v2.6.0
**Date:** 2026-06-03
**What changed:** The official Home Assistant integration for MeshCore shipped a significant feature
release:

- **SNR + hop count on incoming DM events** — `meshcore_message` events now include `hop_count`
  (always) and `snr` (V3 firmware) for direct messages.
- **Per-repeater SNR and activity sensors** — new per-repeater neighbor sensors with auto-cleanup of
  stale neighbors; opt-in with configurable airtime cost.
- **Per-device online binary sensors** — replaces the imprecise global `device.connected` flag.
- **Structured query services** — new `meshcore.get_contacts`, `meshcore.get_channels`, and
  `meshcore.trace` services for companion integrations.

**Segments touched:** tinkerer, off-grid (Home Assistant is dominant in the maker/homestead segment)

**Waev answer:** Not published; not in calendar. Operators who already run HA will see their mesh
through the lens of per-device SNR and hop count. This is useful but does not provide network-level
topology, verified path health, or cross-node analytics. The gap: no Waev content explains what HA's
MeshCore integration gives you and where its visibility ends — and why network-level analytics (Waev)
complements rather than duplicates it.

---

### 5 — Community scalability debate on MeshCore GitHub (April 2026)

**Source:** https://github.com/meshcore-dev/MeshCore/discussions/2375
**Date:** 2026-04-22 (discussion); related PR activity through June 2026
**What changed:** A sustained GitHub discussion thread documents community frustration with manual
mesh tuning. Key quotes: "a single flood message is making the whole region red" and "I start to doubt
the future of MeshCore... [auto-adjustment] is going the wrong direction or it is not enough."
Contributors built a mesh simulator to test auto-delay proposals; the dev team's response was limited.
The outcome: v1.16's `flood.max.unscoped` and `flood.max.advert` are the shipped answer, but they
are manual controls requiring operators to observe and iterate.

**Segments touched:** ham (evaluation), tinkerer (evaluation)

**Waev answer:** Not published; not in calendar. Operators trying to tune these new v1.16 flood
controls have no feedback loop unless they can observe the mesh analytically. Waev is exactly that
feedback loop.

---

## Gap recommendations

Each gap is confirmed absent from all published posts (`src/content/blog/`) and all existing
`growth/calendar.yaml` entries.

---

### Gap 1 — MeshCore Default Scope and flood traffic controls: reading the impact in your analytics

**Competitive trigger:** MeshCore v1.15.0 (April 2026) introduced Default Scope; v1.16.0 (June 2026)
added `flood.max.unscoped` and `flood.max.advert` and cut the default advert interval from 12 h to
47 h. The community is actively debating how to tune these controls, but has no feedback mechanism
beyond guessing. No published documentation explains what these changes look like from a mesh
analytics dashboard.

**Waev angle (canon-consistent):** Waev's enrolled observers record what packets actually reach them.
When an operator configures `flood.max.advert = 4`, they need to see whether their observers confirm
reduced advert chatter — or whether a poorly sited repeater is still flooding. This is
knowing-over-guessing applied to firmware tuning: the firmware control sets the intent; Waev tells
you whether reality matches. Addressable within canon — Waev observes and verifies, it does not
infer.

**Not covered by:**
- Published posts: none address MeshCore traffic controls
- Calendar: "diagnosing a chatty node" (2026-09-29) diagnoses a single bad node after the fact;
  "fixing misconfigured advert intervals" (2027-03-02) is about fixing, not measuring. Neither
  addresses what v1.16's operator-controlled flood caps look like from an analytics tool.

```yaml
segment: ham
funnel_stage: evaluation
bucket: signal
theme: knowing-over-guessing
primary_keyword: "MeshCore flood.max.advert explained"
secondary_keyword: "measuring mesh advert traffic with analytics"
slot_date: 2027-09-04   # first open Fri after current calendar end; keyword-research to slot
```

---

### Gap 2 — Self-hosted mesh dashboard vs. mesh analytics: what a raw MQTT tool misses

**Competitive trigger:** MeshMonitor v4.8.3 (June 2, 2026, 504 stars, 327 releases) is the most
actively developed self-hosted mesh dashboard and has listed "MeshCore source types coming soon" as
a roadmap item. At least four other actively maintained self-hosted tools (meshcore-hub, MeshConsole,
mattwynharris/Meshcore-Dashboard, MeshForge/MeshAnchor) compete for the same operator who wants
local visibility into their MeshCore mesh. The arrival of capable self-hosted dashboards is the
primary reason a reader in the tinkerer/off-grid segment would ask "why do I need Waev?"

**Waev angle (canon-consistent):** Self-hosted dashboards ingest raw MQTT and display what they
receive — including inferred edges, spoofed prefixes, and companion-device identity metadata. Waev's
differentiation is not feature breadth but epistemics: it draws only what it can verify (enrolled
observers, authenticated repeaters), scrubs companion identities at the ingest edge, and rejects
spoofed or inferred path claims. The comparison post should not dismiss self-hosted tools — they are
genuinely useful — but articulate the specific class of problem where unverified topology causes
operator error (e.g., acting on a link that appears active because a stale packet exists in MQTT, but
was never confirmed by an observer). This is fully within canon and the knowing-over-guessing theme.

**Not covered by:**
- Published posts: none compare Waev to self-hosted dashboards
- Calendar: the "the-honest-comparison" series covers protocol-level comparisons (Meshtastic, APRS,
  GMRS, commercial LoRa telemetry) and "do I need mesh analytics or just a repeater" (2027-07-01).
  No slot compares analytics platforms specifically.

```yaml
segment: tinkerer
funnel_stage: evaluation
bucket: dispatch
theme: knowing-over-guessing
series: the-honest-comparison
primary_keyword: "MeshCore self-hosted dashboard vs analytics platform"
secondary_keyword: "what a raw MQTT dashboard misses on your mesh"
slot_date: 2027-09-07   # keyword-research to confirm
```

---

### Gap 3 — What Home Assistant's MeshCore integration sees (and where network analytics begins)

**Competitive trigger:** meshcore-ha v2.6.0 (June 3, 2026) added per-repeater SNR sensors, DM hop
counts, and per-device online sensors. Home Assistant is already the dominant home-automation
platform for the tinkerer and off-grid segments; many operators who run MeshCore already run HA.
With v2.6.0 they can now see their mesh in HA dashboards. The risk for Waev: operators who achieve
HA-level mesh visibility may not discover they need network-level analytics.

**Waev angle (canon-consistent):** HA's MeshCore integration is device-scoped: it reports per-device
SNR, hop count for specific DMs, and whether a device is reachable. What it cannot provide is
network-level topology (which edges exist, whether they are verified or inferred), cross-node
health analytics (which links are degrading, where coverage gaps are), or privacy scrubbing across
the ingest pipeline. The post should acknowledge HA integration's genuine value and explain it as
complementary — "HA tells you about your device; Waev tells you about your network."

**Not covered by:**
- Published posts: none address HA integration
- Calendar: no slot compares Waev to home-automation integrations

```yaml
segment: tinkerer
funnel_stage: evaluation
bucket: dispatch
theme: knowing-over-guessing
series: the-honest-comparison
primary_keyword: "MeshCore Home Assistant integration vs mesh analytics"
secondary_keyword: "per-device mesh telemetry vs network-level visibility"
slot_date: 2027-09-11   # keyword-research to confirm
```

---

### Gap 4 — Tuning a dense MeshCore mesh: why you need analytics before you change the knobs

**Competitive trigger:** The April 2026 GitHub scalability discussion (2375) documents operators
running dense meshes where a single flood message saturates the region. The dev team's shipped answer
(v1.16's `flood.max.unscoped`, `flood.max.advert`, the 47 h advert default) requires operators to
tune manually. Community members explicitly note there is no feedback mechanism — they simulate in
software because they cannot observe the live mesh analytically. This is an emerging operator concern
that will grow as MeshCore deployments scale.

**Waev angle (canon-consistent):** Waev shows the aggregate traffic picture that makes manual tuning
meaningful: airtime consumed per observer, advert cadence over time, link utilisation patterns. An
operator who has just set `flood.max.advert = 6` needs to see, from observed analytics, whether
their network's background noise dropped — or whether a misconfigured node is still flooding despite
the cap. Fully within canon: Waev does not guess at the network state; it reports what its enrolled
observers actually see.

**Not covered by:**
- Published posts: none address dense mesh tuning with analytics
- Calendar: "diagnosing a chatty node" (2026-09-29) is diagnostic (find the offender after the fact);
  "running a mesh network tabletop exercise" (2026-10-18) is simulation, not live analytics. No slot
  addresses "use your analytics dashboard to validate a firmware tuning change."

```yaml
segment: ham
funnel_stage: evaluation
bucket: field-manual
theme: knowing-over-guessing
primary_keyword: "tuning MeshCore flood settings with mesh analytics"
secondary_keyword: "validating mesh traffic changes with observed data"
slot_date: 2027-09-14   # keyword-research to confirm
```

---

## Notes for keyword-research.md

The four gaps above are ready to slot. All proposed `slot_date` values fall after the current last
calendar entry (2027-08-29) and are illustrative — `keyword-research.md` should apply the
Tue/Thu/Sun cadence and verify no conflicts. All primary/secondary keywords are uncovered by existing
published posts and proposed calendar slots as of this report date.

The "self-hosted dashboard" gap (Gap 2) is the highest-priority insertion: MeshMonitor's actively
listed "MeshCore source types coming soon" roadmap item means a capable competitor enters Waev's
direct territory within months. A positioning piece that articulates Waev's epistemic differentiation
should run before MeshMonitor ships native MeshCore support.
