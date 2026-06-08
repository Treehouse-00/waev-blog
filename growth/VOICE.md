# Waev Growth OS — Voice

Inherits from `./CHARTER.md`. This file is the style and messaging law for every
content agent. It is written to be self-verified: the checklist at the end is a
pass/fail gate a content-writer agent MUST run against its own draft before
opening a PR. A draft that fails any MUST item is not ready — fix it, do not
ship it.

## Voice & tone
Measured, technical, quietly confident. The reader ranges from a mesh-curious
tinkerer at the bench to a mission-critical operator (ham, CERT, or off-grid) —
all of whom respect precision and detect hype instantly. You earn their trust
with specificity, evidence, and restraint, never with volume or polish. Meet
beginners without condescension and experts without filler. Explain mechanisms,
not feelings: prefer the concrete number, the named field, the real mechanism
over any adjective. The blog embodies the product — "performance is the point" —
so the prose stays lean and carries no padding.

- Person: address the operator directly as "you." Waev speaks in a restrained
  collective "we" — the people who build the tool — exactly as the published
  corpus does ("We don't take that lightly"; "We collect the minimum that makes
  the product useful"). That is not a byline or a personality: it never signs
  off, never performs, never gets cute. Use "we" for stance and judgment ("we'd
  rather invert it entirely"), never for hype; when in doubt, prefer the plain
  statement of mechanism over either "we" or "Waev."
- Stance: show, don't sell. Demonstrate a capability or teach a skill; let the
  value be self-evident.
- Length: as long as the mechanism requires, no longer. No padding.

## Messaging pillars (derive every post from at least one)
These are the three load-bearing claims, taken verbatim in spirit from
`src/pages/llms.txt.ts` canon. Do not invent a fourth pillar; map every post to
one or more of these.

1. **Privacy by default.** A node named with a privacy marker (⛔ 🛑 🚫) is never
   stored, mapped, or counted. Companion/personal devices are identity-scrubbed
   at the ingest edge; only anonymous signal metadata (SNR, hops, timing) is
   retained. Frame: Waev's first move is refusal — what it chooses not to know.
2. **Evidence-based topology.** Map edges are drawn only from enrolled observers
   (over MQTT) and authenticated repeaters. Spoofed or inferred prefixes are
   rejected, never drawn. Frame: the map is evidence, not a guess.
3. **Data ownership (bring-your-own-broker).** Operators host their own MQTT
   broker and own the data; Waev subscribes and keeps a read-only copy. Frame: a
   deliberate inversion of the usual SaaS data-grab; the community keeps its data.

## Do / Don't
**Do**
- Open with an `In short.` callout (see AEO hook below).
- Name the real surface: "Live Map," "Network Stats," "Live Packets," "ingest
  edge," "enrolled observer," "authenticated repeater."
- Use exact terms from canon: "bring-your-own-broker" / "BYOB," "evidence-based
  topology," "identity-scrubbed."
- Quantify where possible (SNR in dB, hop counts, timing). Teach a transferable
  skill the operator can act on.
- Position Waev as the layer that observes, verifies, and improves an existing
  mesh — its wedge is trust (proof, refusal, ownership), never feature breadth
  (see `./STRATEGY.md` positioning call).
- Tie any product claim back to `src/pages/llms.txt.ts`; if the post needs a fact
  not in canon, flag it for the human gate rather than inventing it.

**Don't**
- No hype or hustle words, ever — including as filler: "revolutionary,"
  "game-changing," "unlock," "supercharge," "leverage," "seamless," "effortless,"
  "cutting-edge," "next-gen," "10x," "best-in-class," "thought leadership,"
  "powerful"/"robust" (as filler). No manufactured urgency or FOMO ("don't get
  left behind," "before it's too late").
- No byline, no signoff, no "— The Waev team" signature, no manufactured
  persona. The restrained collective "we" is correct (see Person, above); a
  performing personality is not.
- No marketing exaggeration, no fabricated metrics, no invented customer quotes,
  no unverifiable claims. If you don't have the number, don't imply one.
- Never contradict canon (privacy markers, evidence-only edges, BYOB, contact
  `admin@waev.app`).
- Don't frame Waev as competing with or replacing MeshCore, firmware, or radios;
  don't sell on feature breadth over trustworthiness (see `./STRATEGY.md`).
- Don't propose client-JS tactics, tracking pixels, popups, or new external
  origins — the blog is near-zero-JS and CSP-allow-listed.
- Don't duplicate FAQ content in body copy; the `faq` frontmatter is the single
  source of truth (renders the section AND the FAQPage JSON-LD).

## Median copy vs. waev-grade (the anti-cringe test, with teeth)
This audience rolls its eyes at anything that reads like a marketing deck. Apply
one test to every title, `In short.`, and paragraph: *would a sharp, skeptical
operator find this true, specific, and worth their time — or roll their eyes?* If
a line could appear verbatim in ten thousand other startups' blogs, it is median
SEO-bait — cut it or sharpen it until it is unmistakably ours. The contrasts
below are pulled from the published corpus; write the right column, never the
left.

- DON'T: "Waev unlocks powerful, real-time insights into your mesh network."
  DO: "Packets appear as they arrive. A map pans without lag. A query over your
  whole mesh comes back before you wonder if it's stuck."
- DON'T: "Our seamless platform gives you complete visibility into your network."
  DO: "When something is actually wrong on your network, you should see it — not
  hunt for it."
- DON'T: "Supercharge your emergency comms with next-gen mesh analytics."
  DO: "You can't plan around 'mostly works.' Verify the net on a routine Tuesday,
  not during the activation."
- DON'T: "Waev respects your privacy and keeps your data safe."
  DO: "What doesn't enter the database can't be accessed, breached, or misused."
- DON'T: "Take control of your data with our cutting-edge ownership model."
  DO: "You host the broker. You hold the keys. Waev keeps a read-only copy."
- DON'T: "Trust our advanced topology engine for accurate network maps."
  DO: "If the map shows it, something verifiable produced it. No proof, no line."

The pattern: the left column *tells* you something is good with an adjective
("powerful," "seamless," "accurate"); the right column *shows* the mechanism and
lets the reader conclude it. Replace every claim of quality with the concrete
behavior that earns the word. If you can't, the claim isn't ready to ship.

### Titles and keywords (where median creeps in first)
A title and `primary_keyword` must read like a specific operator wrote them, not
like an SEO tool generated them. The shipped titles are the bar: "Reading the
Signal," "What We Choose Not to Know," "Bring Your Own Broker," "Where Your
Network Ends," "When the Grid Goes Down" — concrete, plain, about a real task or
decision. Never "The Ultimate Guide to MeshCore Network Monitoring." Fold the
keyword into a human title; never let the keyword *be* the title.

## The AEO hook: the `In short.` callout
Every post opens, near the top, with the answer-engine hook used across the
existing corpus:

```html
<div class="callout"><p><strong>In short.</strong> …</p></div>
```

Rules for the `In short.` sentence(s):
- Self-contained: answers the post's core question in 1–3 sentences without
  requiring the rest of the post.
- Citable: a true, standalone statement an answer engine can quote verbatim.
- Canon-safe: contains no claim that contradicts `src/pages/llms.txt.ts`.
- Keyword-aware: naturally includes the slot's `primary_keyword` where it reads
  cleanly — never keyword-stuffed.

## Pre-PR self-verify checklist (run before opening any content PR)
A content-writer agent MUST evaluate each item as PASS/FAIL against its own
draft and only open the PR when every MUST passes. Record the result in the PR
body.

Structure & schema (MUST)
- [ ] Frontmatter validates against `src/content.config.ts` (title, description,
      date, tags; optional updated, ogImage, hero, faq).
- [ ] `date` is set to the intended `slot_date` from `./calendar.yaml` (future
      date = scheduled; the date gate ships it on merge).
- [ ] No byline and no signoff anywhere in the post.
- [ ] Opens with the `In short.` callout following the rules above.
- [ ] If a `faq` is present, it is in frontmatter only and not duplicated in body.
- [ ] Reading time is NOT hand-written (it is computed automatically).

Voice & messaging (MUST)
- [ ] Maps to at least one messaging pillar above; the mapping is stated in the
      PR body.
- [ ] Contains zero hype words from the Don't list.
- [ ] Positions Waev as the layer that observes/verifies/improves an existing
      mesh, not a MeshCore competitor or replacement; sells on the
      trustworthiness of what's shown, not on feature count.
- [ ] Every product claim is consistent with `src/pages/llms.txt.ts`; any new
      fact is flagged for the human gate, not asserted.
- [ ] Targets one `segment` + `funnel_stage` from `./STRATEGY.md`; the
      `primary_keyword` appears in the title or `In short.` and reads naturally.

Hygiene (SHOULD)
- [ ] Names real Waev surfaces where relevant (Live Map, Network Stats, etc.).
- [ ] Internal-links to at least one related published post where natural.
- [ ] `description` works as both the SEO/OG lead and a standalone summary.
- [ ] Any image carries correct `alt` (decorative `alt=""`; hero a real `alt`).

Build (MUST, if the PR touches anything beyond a single `.mdx`)
- [ ] `nvm use && npm run build` passes (the real correctness gate).
