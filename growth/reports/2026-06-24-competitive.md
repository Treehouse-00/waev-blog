# Competitive Monitor Report

**Report date:** 2026-06-24
**Period covered:** Since prior competitive report — 2026-06-17 to 2026-06-24 (7 days)
**Competitive set scanned:**
- MeshCore firmware project (blog.meshcore.io, github.com/meshcore-dev/MeshCore)
- Meshtastic firmware project (github.com/meshtastic/firmware, newreleases.io)
- Competing tools: MeshMonitor (meshmonitor.org / github.com/Yeraze/meshmonitor),
  MeshCore Hub (github.com/ipnet-mesh/meshcore-hub), MeshCore Home Assistant Panel v2
  (github.com/d3sbo/MeshCore-Home-Assistant-Panel-v2), MeshAnchor (github.com/Nursedude/meshanchor),
  UKMesh (github.com/gadgethd/ukmesh), MeshCore Stats (github.com/jorijn/meshcore-stats),
  MeshConsole (github.com/m9wav/MeshConsole), MeshCore Insights (github.com/BomBefok/MeshcoreInsights)
- Community signals: GitHub discussions, MeshCore issue tracker, nodakmesh.org

---

## Material changes since last run

### 1 — MeshCore Hub v0.14.0 (June 19, 2026): PostgreSQL backend, SQLite deprecation

**Source:** https://github.com/ipnet-mesh/meshcore-hub
**Date:** 2026-06-19
**What changed:** MeshCore Hub shipped v0.14.0, adding a PostgreSQL backend option
(`DATABASE_BACKEND=postgres`) and issuing a formal SQLite deprecation notice: SQLite support will
be maintained for "at least the next few releases (~3 months), then removed in favour of
PostgreSQL-only." The release notes explicitly warn existing self-hosted deployments to migrate.

Four named community networks are now publicly running MeshCore Hub: IPNet (Ipswich, UK),
CumbriaCQ MeshCore (Cumbria, UK), Skynet (Wales, UK), and MeshCore Iasi (Romania). The project
is at 52 stars and 70 releases. Architecture requires two local services beyond the MQTT broker:
`meshcore-packet-capture` (a physical LoRa radio hardware observer) plus the MeshCore Hub stack
(collector, API, web dashboard). Latest v0.14.0 release also adds raw packet inspection with a
deduplicated view and clickable path-hash badges.

**Segments touched:** off-grid (community network operators who want self-hosted analytics),
ham (UK/European club operators who are active MeshCore Hub users)

**Waev answer:** Not directly addressed by any published post or calendar slot. The architecture
question — what additional hardware and infrastructure a community mesh analytics deployment
requires — is distinct from the epistemics comparison (raw MQTT ingest vs. evidence-based
topology) flagged in prior reports. See Gap 2 below.

---

### 2 — CVE-2026-45323: XSS in MeshCore Home Assistant Panel v2 (disclosed June 2026)

**Source:** https://github.com/d3sbo/MeshCore-Home-Assistant-Panel-v2
**Date:** Disclosed and patched June 2026; CVE assigned June 2026
**What changed:** A cross-site scripting vulnerability was publicly assigned CVE-2026-45323
affecting the MeshCore Home Assistant Panel v2. The vulnerability allowed any node owner within
radio range of any mesh repeater to inject arbitrary HTML and JavaScript into the Home Assistant
dashboard session of any operator running the panel, by setting their MeshCore node's advertised
name (`adv_name`) or other mesh-sourced fields to malicious HTML strings.

All five HTML map files were patched: an `escapeHtml()` helper now encodes mesh-sourced data
before HTML interpolation, fixing injection points in `bindPopup()`, `innerHTML`, `title`
attributes, and `onclick` handlers. The original partial fix (a single-quote-only regex) was
also removed.

The vulnerability class is significant: node names are user-generated content. Any operator
within radio range — including strangers who have never been admitted to the network — can set
their node name to arbitrary text. Tools that render mesh-sourced strings as trusted HTML, rather
than as raw text, are exploitable by any mesh participant. This is not a MeshCore firmware
defect; it is a data-trust defect in third-party analytics tooling.

**Segments touched:** tinkerer, ham, off-grid (all segments who run community-facing analytics
tools that display mesh-sourced node names or paths in a web UI)

**Waev answer:** Not published; not in calendar. Waev's ingest model (evidence-based, with
companion identity-scrubbing at the ingest edge, and privacy-marker filtering on node names) is
relevant here — Waev processes node names as controlled text strings to enforce opt-out markers,
but does not embed raw mesh-sourced content in user-facing HTML as trusted input. No current
Waev content articulates how the content-trust question applies to mesh analytics, or why the
attack surface of an MQTT-subscriber model differs from a raw-packet-display dashboard. See Gap 1
below.

---

### 3 — MeshCore PR #2733: Repeater-level content filtering (filed June 9, active through June 24)

**Source:** https://github.com/meshcore-dev/MeshCore/pull/2733
**Date:** Filed 2026-06-09; last activity 2026-06-12; open and under review as of 2026-06-24
**What changed:** A pending firmware pull request adds repeater-level message filtering: repeaters
can decrypt channels they hold keys for (including the public channel) and drop messages matching
blocked keywords or sender node names before forwarding. Configuration uses new "filter" CLI
commands persisted to `/channel_filter`. The PR has been tested with both Public channel and
hashtag channels, with and without scope.

This feature is NOT yet merged. It is noted here because:
(a) it was open throughout the reporting window and represents an emerging capability that will
    ship in a future MeshCore version; and
(b) it has a direct implication for mesh analytics visibility that no current Waev content addresses.

**Segments touched:** ham (operators managing public mesh channels who are concerned about spam
and abuse), cert-emcomm (operators who depend on channel message integrity)

**Waev answer:** Not published; not in calendar. If repeaters begin filtering packets before
forwarding, some messages will never reach the MQTT broker and will be invisible to any subscriber-
based analytics platform, including Waev. No current Waev content is honest about this class of
topology gap: the distinction between "Waev doesn't see a link" because no observer can prove it,
vs. "Waev doesn't see a packet" because a repeater in the path dropped it before broker ingest.
See Gap 3 below.

---

## Gap recommendations

Each gap below is confirmed absent from all published posts in `src/content/blog/` and all existing
entries in `growth/calendar.yaml` as of 2026-06-24. Prior competitive reports have recommended
12 unslotted gaps (June 8: 4, June 10: 4, June 17: 4). This report adds 4 new gaps;
outstanding total: 16.

---

### Gap 1 — Your mesh data is user-generated content: what CVE-2026-45323 reveals about analytics trust

**Competitive trigger:** CVE-2026-45323 (June 2026) demonstrated that node names and other
mesh-sourced fields are adversarial input — any radio-range participant can set their node
advertised name to arbitrary text, including HTML or JavaScript. Any analytics tool that renders
mesh-sourced strings as trusted HTML is exploitable. The vulnerability was patched in the MeshCore
HA Panel v2, but the underlying content-trust question applies to every tool that displays mesh
node names, path strings, or message content in a web UI.

**Waev angle (canon-consistent):** Waev's ingest pipeline processes node names to enforce
privacy markers (a node named with a ⛔, 🛑, or 🚫 prefix is never stored, mapped, or counted).
This means Waev reads every advertised node name as a controlled text input and applies a
structured decision rule before the name influences any stored state. The broader principle is
that mesh-sourced data must never be treated as trusted text: it originates from unknown
hardware, set by unknown operators, broadcast across uncontrolled radio links. A post that
articulates this content-trust model — why Waev sanitizes what it reads and refuses to display
raw mesh-sourced content as trusted HTML — is directly within the power-of-refusal theme and
answerable entirely within canon. It also serves as durable positioning against the expanding
class of community-built tools that display mesh data without content escaping.

**Not covered by:**
- Published posts: `what-we-choose-not-to-know.mdx` and `meshcore-node-naming-privacy-markers.mdx`
  cover Waev's privacy choices; `what-a-mesh-monitor-refuses.mdx` covers what Waev refuses to
  draw. None address the content-trust model for mesh-sourced data or the CVE class of risk.
- Calendar: no slot addresses the security trust model for mesh analytics ingest. Existing
  privacy posts cover what Waev declines to store; this covers why mesh-sourced text must be
  treated as untrusted input before any rendering or storage decision.

```yaml
segment: off-grid
funnel_stage: evaluation
bucket: under-the-hood
theme: power-of-refusal
primary_keyword: "mesh analytics data trust model"
secondary_keyword: "node name injection risk in mesh dashboards"
slot_date: 2026-08-04   # keyword-research to confirm; near existing privacy content cluster
```

---

### Gap 2 — The infrastructure your community mesh analytics actually needs

**Competitive trigger:** MeshCore Hub v0.14.0 (June 19, 2026) announced PostgreSQL as the
mandatory future backend, deprecating SQLite. Four named European community networks now run the
full MeshCore Hub stack. The deployment architecture requires: a physical LoRa radio hardware
observer (`meshcore-packet-capture`), an MQTT broker, a PostgreSQL database, plus the
MeshCore Hub collector, API, and web dashboard — all self-hosted. This is a meaningful
infrastructure commitment for a volunteer-run community mesh group.

**Waev angle (canon-consistent):** Waev's bring-your-own-broker model means that an operator
who already runs a MeshCore room server or MQTT-connected companion already has the broker.
Waev subscribes and keeps a read-only copy; the operator does not provision a packet-capture
radio, migrate databases, or manage a container stack. For the community mesh operator whose
time and expertise is limited — the neighborhood coordinator, the CERT communications lead who
runs the net as a side role — the question "what do I actually need to add to get mesh analytics?"
is real and unanswered by current Waev content. The infrastructure comparison is not a dismissal
of packet-capture tools (they provide genuine additional visibility at the RF layer), but the
choice between architectures is a real operator decision that Waev has not yet articulated.

**Not covered by:**
- Published posts: `bring-your-own-broker.mdx` explains Waev's BYOB model; `setting-up-mosquitto-
  for-meshcore.mdx` covers broker setup. Neither addresses the operator's infrastructure decision
  between analytics architectures.
- Calendar: June 8 Gap 2 (self-hosted dashboard vs. analytics) addressed the epistemic difference
  (what raw MQTT ingest proves vs. what enrolled observers prove). The infrastructure overhead
  angle is distinct: this is about what the operator must deploy and maintain, not about what
  the tool can claim to know. The `off-grid | adoption | own-your-ground` cluster has no slot
  that directly compares deployment complexity.

```yaml
segment: off-grid
funnel_stage: evaluation
bucket: field-manual
theme: own-your-ground
primary_keyword: "community mesh analytics self-hosted setup"
secondary_keyword: "what infrastructure you need for mesh monitoring"
slot_date: 2026-08-18   # keyword-research to confirm; after existing BYOB content
```

---

### Gap 3 — What repeater content filtering means for mesh analytics visibility

**Competitive trigger:** MeshCore PR #2733 (filed June 9, under active review) would allow
repeaters to drop messages matching blocked keywords or sender names before forwarding to the
mesh. If this or similar filtering capability ships, some messages will never reach the MQTT
broker — they will be silently dropped at the repeater before any analytics subscriber, including
Waev, can observe them. Community operators managing busy public channels are actively requesting
this capability (the PR has 3+ reviewers and addresses a real demand for repeater-level channel
governance).

**Waev angle (canon-consistent):** Waev draws only what its enrolled observers can verify. If
a packet never arrives at the broker, no enrolled observer reports it, and Waev correctly does
not draw an edge or count a message that it cannot verify. This is Waev's strength: it refuses
to infer what it cannot prove. But no current Waev content is honest about the class of topology
gaps this creates. An operator who sees a link absent from their Waev map may ask: "Is this a
real coverage failure, or did a repeater between my node and the observer filter the packet?" A
post that articulates what Waev can and cannot see — and why a tool that only shows verified
data is genuinely more useful than one that guesses — maps directly to knowing-over-guessing.
It also builds trust with technically sophisticated operators (ham, cert-emcomm) who will
encounter this question when PR #2733-class features ship.

**Not covered by:**
- Published posts: `mesh-map-missing-nodes.mdx` addresses why nodes don't appear on the map
  (wrong observer enrollment, firmware gaps). `spoofed-node-prefix-on-a-mesh-map.mdx` covers
  why Waev rejects inferred edges. Neither addresses the case where infrastructure (a repeater)
  actively filters packets before they reach the analytics ingest point.
- Calendar: "why mesh packets disappear" (2026-10-06, ham/evaluation) covers silent packet loss
  at the radio/protocol level. This gap is about infrastructure-layer filtering — a different
  cause of the same symptom. "Trusting your mesh map in an emergency" (2026-09-10) covers map
  confidence, not the specific mechanism of repeater-level filtering.

```yaml
segment: ham
funnel_stage: evaluation
bucket: under-the-hood
theme: knowing-over-guessing
primary_keyword: "what mesh analytics can see when repeaters filter packets"
secondary_keyword: "repeater content filtering effect on mesh topology map"
slot_date: 2026-09-25   # keyword-research to confirm; after existing packet-loss content
```

---

### Gap 4 — Reading the community mesh analytics landscape: which tools share your data and how

**Competitive trigger:** The June 17–24 scan confirms an active and growing ecosystem of
community-deployed MeshCore analytics tools: MeshCore Hub (4 European community deployments,
v0.14.0), LetsMesh analyzer (public, community-contributed, previously flagged in June 17 report),
UKMesh (public, UK-focused, terrain-aware RF coverage), MeshMonitor (self-hosted, 502 stars,
automation features), and MeshAnchor (NOC-class, Prometheus/Grafana). Each has a different data
model: some send mesh data to a shared service; some keep it fully local; some require the operator
to run packet-capture hardware. An operator who searches "MeshCore analytics" or "mesh monitoring"
in mid-2026 encounters all of these simultaneously without a clear map of how they differ.

**Waev angle (canon-consistent):** The key differentiator across this landscape is who holds
the data and under what conditions it leaves the operator's infrastructure. MeshCore Hub, UKMesh,
and LetsMesh each have different data-sharing profiles. Waev's BYOB model — the operator hosts
the broker, Waev keeps a read-only copy — is a specific, articulable position in this landscape.
A post that helps an operator understand the data-custody decisions embedded in each analytics
architecture (not as a dismissal of competitors, but as an informed-choice framework) maps
directly to the own-your-ground and power-of-refusal themes. It is answerable within canon
because it does not require Waev to claim features it doesn't have; it only requires articulating
what each model means for data residency and operator control.

**Not covered by:**
- Published posts: `what-we-choose-not-to-know.mdx` covers Waev's own privacy choices internally.
  No post maps the external landscape of analytics tools by data-custody model.
- Calendar: June 17 Gap 2 ("your mesh data in a public analyzer") specifically addressed the
  LetsMesh trade-off. This gap is broader: a landscape map across all categories of MeshCore
  analytics tools (shared public, self-hosted packet-capture, self-hosted MQTT, BYOB cloud) as
  a decision framework. The scope distinguishes it from the single-tool comparison approach.

```yaml
segment: off-grid
funnel_stage: awareness
bucket: position
theme: own-your-ground
series: why-we
primary_keyword: "MeshCore analytics tool comparison data ownership"
secondary_keyword: "which mesh monitoring tool owns your data"
slot_date: 2026-10-11   # keyword-research to confirm; existing off-grid/evaluation slot nearby
```

---

## Notes for keyword-research.md

Four gaps ready to slot, in priority order:

1. **Gap 1** (mesh data content trust / CVE-2026-45323) is the most timely insertion. The CVE
   was publicly disclosed and patched in June 2026; community awareness of the content-trust
   issue is highest now. The power-of-refusal theme slot near the existing privacy content
   cluster (August 4) maximises editorial coherence with `what-we-choose-not-to-know.mdx`
   (July 2) and `bring-your-own-broker.mdx` (July 16).

2. **Gap 3** (repeater content filtering and analytics visibility) is time-sensitive because
   PR #2733 is in active review. If it merges before a post publishes, it becomes a shipped
   feature rather than a pending one. The September 25 slot is conservative; keyword-research
   may pull it earlier if the PR merges quickly.

3. **Gap 2** (infrastructure comparison) is evergreen but increasingly urgent as MeshCore Hub
   formalises its PostgreSQL requirement and community adoption grows. The August 18 slot fits
   the BYOB/off-grid content cluster established by the July–August scheduled posts.

4. **Gap 4** (analytics landscape data-ownership map) is a positioning anchor that should land
   after enough landscape content exists to refer back to (the September–October cluster of
   comparative posts). The October 11 suggestion is a starting point; keyword-research should
   evaluate whether pulling it earlier strengthens the campaign sequencing.

All proposed `slot_date` values are illustrative; `keyword-research.md` should apply the
Tue/Thu/Sun cadence and verify no conflicts with existing calendar entries. All
primary/secondary keywords are confirmed absent from published posts and current calendar
slots as of 2026-06-24.

Prior gap recommendations remain outstanding: June 8 (4 gaps), June 10 (4 gaps), June 17
(4 gaps). This report adds 4 new gaps. Total outstanding: 16.
