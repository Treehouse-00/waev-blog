# Waev Growth OS — Voice

Inherits from `./CHARTER.md`. This file is the style and messaging law for every
content agent. It is written to be self-verified: the checklist at the end is a
pass/fail gate a content-writer agent MUST run against its own draft before
opening a PR. A draft that fails any MUST item is not ready — fix it, do not
ship it.

## Voice & tone
Measured, technical, quietly confident. The reader is a competent operator
(ham, CERT, or off-grid) who respects precision and distrusts hype. Explain
mechanisms, not feelings. Prefer the concrete number, the named field, the real
mechanism over adjectives. The blog embodies the product: "performance is the
point," so the prose is lean and free of filler.

- Person: address the operator directly ("you"); Waev is "Waev," never "we the
  team" and never a first-person narrator with a personality.
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
- Position Waev as the observability/analytics layer for an existing mesh (see
  `./STRATEGY.md` positioning call).
- Tie any product claim back to `src/pages/llms.txt.ts`; if the post needs a fact
  not in canon, flag it for the human gate rather than inventing it.

**Don't**
- No hype words: "revolutionary," "game-changing," "seamless," "effortless,"
  "cutting-edge," "unleash," "supercharge," "next-gen," "powerful" (as filler).
- No byline, no signoff, no "— The Waev team," no first-person team voice.
- No marketing exaggeration, no fabricated metrics, no invented customer quotes,
  no unverifiable claims.
- Never contradict canon (privacy markers, evidence-only edges, BYOB, contact
  `admin@waev.app`).
- Don't frame Waev as competing with or replacing MeshCore, firmware, or radios.
- Don't propose client-JS tactics, tracking pixels, popups, or new external
  origins — the blog is near-zero-JS and CSP-allow-listed.
- Don't duplicate FAQ content in body copy; the `faq` frontmatter is the single
  source of truth (renders the section AND the FAQPage JSON-LD).

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
- [ ] Positions Waev as the observability/analytics layer, not a MeshCore
      competitor/replacement.
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
