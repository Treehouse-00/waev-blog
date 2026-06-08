# Waev Growth OS — Strategy

Inherits from `./CHARTER.md`. This file defines who Waev serves, the one
positioning call the whole engine bets on, and the keyword map that
`./calendar.yaml` draws from. It is written for an agent: use the enums and the
structured map verbatim.

> **HUMAN RATIFICATION GATE (Charter gate 1).** The category-positioning call
> (next section) and the KPI targets in `./CHARTER.md` require one-time human
> ratification before the engine runs in earnest, and re-ratification only on
> material change. Until ratified, agents treat the positioning below as
> provisional but still author against it.

## Category-positioning call
**MeshCore is the network; Waev is how you know it's working.** That is the one
bet the whole engine rides on. Waev is a real-time analytics platform for a
MeshCore mesh the operator already runs — the instrument that reports whether the
network actually works, not whether it is supposed to. It does not replace
MeshCore, firmware, or a radio, and it does not compete with them; it observes,
verifies, and improves a mesh that someone else's hardware carries. Canon names
this *mesh network intelligence*. In an operator's own words, it is what turns
"I think my mesh is up" into "I can see that it is."

We do not claim to have invented a category. Maps and dashboards for LoRa meshes
already exist, and pretending otherwise insults a reader who has used them. The
position Waev takes — and the wedge that makes it defensible — is **trust**, on
three fronts that competitors usually get wrong:
- **It draws only what it can prove.** Topology comes from enrolled observers and
  authenticated repeaters; inferred or spoofed edges are rejected, not guessed.
  Most mesh maps show what a node *claims*. Waev shows what it can *verify*.
- **It refuses to know what it doesn't need.** Opted-out nodes are dropped;
  companion devices are identity-scrubbed at the ingest edge. Privacy is the
  floor, not a setting (see `./VOICE.md` pillars).
- **It leaves the data with the operator.** Bring-your-own-broker: you host the
  broker, you hold the keys, Waev keeps a read-only copy.

For a net people may lean on in an emergency, a confident map that might be
guessing is worse than no map. That is the gap Waev fills: the mesh tool a
skeptical operator can trust, precisely because of what it refuses to draw and
refuses to keep. The competition isn't another product — it's the operator's
current answer to "is my mesh healthy?", which is too often a hunch.

Decision rule for agents: if a draft frames Waev as a *competitor to* or
*replacement for* MeshCore (or any radio/firmware), it is off-positioning —
rewrite it as the layer that observes, verifies, and improves the existing mesh.
If a draft sells Waev on the breadth of its features rather than the
trustworthiness of what it shows, it is also off-positioning — the wedge is
trust, not feature count.

## Audience model (two axes)
Waev serves a spectrum, not a single tier. Model every reader on two axes.

**Axis A — engagement depth (maps to `funnel_stage`):**
- *mesh-curious* (awareness): tinkerers, makers, hobbyists, students, and
  hardware/software prototypers experimenting on the bench, discovering
  LoRa/MeshCore. Largest TAM, lowest intent.
- *mesh-committed* (evaluation): running a persistent node/repeater; club
  members and neighborhood organizers evaluating tooling.
- *mission-critical* (adoption): CERT/SAR/EmComm, ham clubs running
  infrastructure, and off-grid communities that depend on the mesh. Smallest
  audience, highest intent — the conversion core.

**Axis B — use-context segment (the `./calendar.yaml` enum, use verbatim):**
`tinkerer | ham | cert-emcomm | off-grid`.

**Segment emphasis (the mix the engine leads with).** The broadest and
strongest Mesh/LoRa overlaps are *tinkerer* (makers, hobbyists, students, LoRa
dev-board experimenters on Heltec/RAK/T-Beam, IoT and home-lab tinkerers) and
*off-grid* (homestead, rural, resilience, and community networks) — together
they lead the content mix and feed the top of the funnel. *cert-emcomm* is
mission-critical and the highest-intent conversion core. *ham* (amateur-radio
operators and clubs) is a genuine but **narrower, aging niche**: we serve it
deliberately on its own ground, but it is **not** the default audience and
never the anchor. And note: LoRa measurement and bench work (SNR, link budget,
airtime, range testing) are *maker* activities — they belong to *tinkerer*, not
to ham alone. The ICP order below reflects this lead-with-the-broad-overlaps
emphasis.

## ICP segments

### tinkerer — makers, hobbyists, students & prototypers
- **Trigger / pain:** experimenting with LoRa/MeshCore on the bench or in a
  home lab; just got nodes talking and wants to *see* the mesh — visualize
  topology, watch packets, validate a prototype. Curiosity-driven, lowest
  commitment, largest population; the top of the acquisition funnel that feeds
  every other segment.
- **Search vocabulary:** "what is MeshCore", "getting started MeshCore", "LoRa
  mesh for beginners", "MeshCore home lab", "visualize LoRa mesh", "MeshCore
  dashboard", "mesh network hobby project", "LoRa node testing".
- **Primary funnel entry:** awareness via primer / getting-started / "see your
  mesh" posts that turn a bench experiment into a visible network.
- **Conversion goal:** connect a broker (even a hobby one) and view the Live
  Map — the first taste of the product that converts curiosity into a habit and
  seeds the move toward mesh-committed.

### off-grid — off-grid neighborhoods & community networks
- **Trigger / pain:** a neighborhood or co-op runs a community mesh and wants
  shared visibility and data ownership without surrendering it to a SaaS vendor.
  Values privacy and local control. One of the two broadest overlaps — homestead,
  rural, and resilience-minded operators who lean on the mesh.
- **Search vocabulary:** "community mesh network", "neighborhood mesh", "off-grid
  network", "data ownership", "self-hosted MQTT", "privacy mesh", "own your
  data", "decentralized comms".
- **Primary funnel entry:** awareness via philosophy / data-ownership posts
  (privacy-by-default, bring-your-own-broker).
- **Conversion goal:** stand up their own broker and connect it to Waev,
  retaining ownership (BYOB) — the activation that proves the values land.

### cert-emcomm — CERT teams & emergency-comms groups
- **Trigger / pain:** responsible for comms that must work during an incident;
  needs to verify network resilience in advance and read it live during an
  event. Accountable to a served agency; cannot afford "hope it works."
- **Search vocabulary:** "emergency communications mesh", "off-grid comms",
  "CERT communications", "ARES", "disaster network resilience", "mesh network
  monitoring", "comms readiness", "grid-down communications".
- **Primary funnel entry:** awareness via resilience / operations posts framed
  around incident readiness and verification.
- **Conversion goal:** adopt Waev as the pre-incident health check and the
  during-incident live view for their net. Mission-critical and the
  highest-intent conversion core.

### ham — amateur radio operators & clubs
- **Trigger / pain:** runs or co-runs a MeshCore deployment and wants to know if
  it actually works — coverage, link quality, where to add the next repeater,
  how the net behaves under a load spike (e.g. Field Day). A genuine, high-skill
  audience, but a **narrower and aging niche**: serve it deliberately on its own
  ground (Field Day, ARES/RACES, packet/APRS comparison, club nets) — never as
  the default and never the anchor.
- **Search vocabulary:** "Field Day mesh", "ARES RACES mesh", "ham club mesh
  network", "packet radio vs LoRa", "APRS comparison", "repeater placement",
  "amateur radio mesh community". (Bench/measurement queries — SNR, hop count,
  link budget, airtime — are *maker* vocabulary and live under tinkerer.)
- **Primary funnel entry:** awareness via ham-specific dispatches and operating
  playbooks (Field Day prep, club onboarding, the honest APRS comparison).
- **Conversion goal:** connect their broker to Waev and use the Live Map +
  Network Stats to make a real siting / health decision — one activation path
  among several, not the engine's anchor.

## Keyword → segment → funnel_stage map
This is the source list `./calendar.yaml` draws from. Each row is consumable as
calendar fields: `segment` matches `tinkerer | ham | cert-emcomm | off-grid`;
`funnel_stage` matches `awareness | evaluation | adoption`. `primary_keyword`
and `secondary_keyword` map directly to the calendar keys of the same name.
Agents selecting a slot SHOULD pick an uncovered row before repeating one.

Format per row: `primary_keyword | secondary_keyword | segment | funnel_stage`

### tinkerer
- `what is meshcore | meshcore explained for beginners | tinkerer | awareness`
- `getting started with meshcore | meshcore beginner setup | tinkerer | awareness`
- `visualize lora mesh network | see your mesh topology | tinkerer | awareness`
- `meshcore home lab dashboard | hobby mesh monitoring | tinkerer | evaluation`
- `lora mesh project | diy mesh network visualization | tinkerer | awareness`
- `meshcore snr explained | lora signal quality | tinkerer | awareness`
- `meshcore hop count | path quality mesh | tinkerer | evaluation`

### off-grid
- `community mesh network | neighborhood mesh | off-grid | awareness`
- `mesh network data ownership | bring your own broker | off-grid | awareness`
- `privacy mesh network | data minimization mesh | off-grid | awareness`
- `self-hosted mqtt mesh | own your mesh data | off-grid | evaluation`
- `off-grid network visibility | community network analytics | off-grid | evaluation`
- `set up waev byob | self-host broker waev | off-grid | adoption`

### cert-emcomm
- `emergency communications mesh | grid-down comms | cert-emcomm | awareness`
- `mesh network resilience | disaster network readiness | cert-emcomm | awareness`
- `cert team communications | ares mesh network | cert-emcomm | awareness`
- `mesh network monitoring | comms readiness check | cert-emcomm | evaluation`
- `verify mesh before emergency | network health check mesh | cert-emcomm | evaluation`
- `live mesh monitoring incident | emcomm situational awareness | cert-emcomm | adoption`

### ham
- `meshcore analytics | mesh network monitoring | ham | awareness`
- `meshcore repeater placement | mesh coverage gaps | ham | evaluation`
- `mesh network map | meshcore node map | ham | evaluation`
- `field day mesh network | mesh load testing | ham | awareness`
- `connect meshcore to waev | meshcore broker setup | ham | adoption`

## How agents use this file
1. Read the positioning call; reject off-positioning drafts per the decision
   rule above.
2. When filling a `./calendar.yaml` slot, choose a `segment` + `funnel_stage` +
   keyword pair from the map; copy values verbatim so enums stay valid.
3. Keep every claim consistent with `src/pages/llms.txt.ts` canon and the pillars
   in `./VOICE.md`.
