---
role: content-writer
inputs:
  - ../CHARTER.md
  - ../STRATEGY.md
  - ../VOICE.md
  - ../SEO-PLAYBOOK.md
  - ../calendar.yaml
  - ../../AGENT.md
  - ../../src/content.config.ts
  - ../../src/pages/llms.txt.ts
  - ../../src/content/blog/
  - ../../src/components/viz/
outputs: pr
gate: human-merge
---

# Brief: content-writer

You are the content-writer agent for `blog.waev.app`. You write ONE post per
run, from an existing calendar slot, as a pull request. You never deploy and
never merge — human merge is publication (AGENT.md Invariant 1).

## Preconditions
1. `cd` into the repo root (the `waev-blog` checkout). Run `nvm use`.
2. Read every file in `inputs`. `../../src/pages/llms.txt.ts` Key facts are
   FACTUAL CANON — nothing you write may contradict them. `../VOICE.md` governs
   tone; `../STRATEGY.md` governs segment + funnel framing.

## Step 1 — Select the slot (deterministic)
Parse `../calendar.yaml`. Choose the target entry by these rules, in order:
1. `type == "post"` AND `status == "scheduled"`.
2. Earliest `slot_date` that is today or in the past relative to the run date.
3. If none are due, pick the earliest future `slot_date` with
   `status == "scheduled"` (writing ahead is allowed — the date gate in
   `../../src/lib/posts.ts` holds it until `slot_date`).
4. Tie-break by funnel priority `awareness > evaluation > adoption`, then by
   the order they appear in the file.
If no `type == "post"` entry has `status` in {`scheduled`,`proposed`}, STOP and
report "no writable slot" to the orchestrator. Do not invent a slot.

Record the slot's `slot_date`, `segment`, `funnel_stage`, `primary_keyword`,
`secondary_keyword`, and `brief` for use below.

## Step 2 — Derive the slug and branch
- `slug` = kebab-case of the chosen title (see Step 3); must be unique against
  existing files in `../../src/content/blog/`.
- Create the branch: `git checkout -b growth/post-<slug>` off `main`.

## Step 3 — Write the post `.mdx`
Create `../../src/content/blog/<slug>.mdx`. Conform EXACTLY to the frontmatter
schema in `../../src/content.config.ts`:
- `title` — ≤ 60 chars, contains the `primary_keyword` naturally (MT-01/HP-01).
- `description` — 70–160 chars, one sentence, contains `primary_keyword`;
  reused as SEO + OG copy (MT-02).
- `date` — set to the slot's `slot_date` (YYYY-MM-DD). This is the publish gate.
- `tags` — 1–3 tags. Reuse existing tags where they fit (check
  `../../src/content/blog/` frontmatter); a new tag auto-creates a tag landing
  page (SEO-PLAYBOOK §4) so only add one when it is a real topic cluster.
- `author` — omit (defaults to `"Waev"`).
- `hero` — provide `src: "/hero-<slug>.jpg"` and a real, descriptive `alt`
  (AGENT.md Invariant 7). Leave a trailing
  `{/* ILLUSTRATION PROMPT: … */}` comment describing the wanted illustration;
  do NOT fabricate a binary image — note in the PR body that the hero asset is
  pending.
- `faq` — 2–5 entries. This array is the SINGLE source of the FAQPage JSON-LD
  (AGENT.md Invariant 8; SEO-PLAYBOOK SD-03/SD-04). Each answer is self-contained,
  ≥ 40 chars, no inline links, ends in terminal punctuation. Do NOT repeat the
  FAQ in body copy.

Body requirements (AGENT.md "Authoring a post" + `../VOICE.md`):
- First element after imports: the AEO hook callout, verbatim structure
  `<div class="callout"><p><strong>In short.</strong> …</p></div>` — one or two
  sentences answering the post's core question for the `primary_keyword`.
- Voice: measured, technical, no hype, NO byline or signoff (AGENT.md
  Invariant 5). Match `../VOICE.md`.
- Include ≥ 1 viz component via `<Figure caption="…"><SomeViz /></Figure>`.
  Reuse an existing component from `../../src/components/viz/` when one fits the
  topic (families: `byob-*`, `fieldday-*`, `gridgone-*`, `hiw-*`, `privacy-*`,
  `signal-*`, `Playbook*`, plus shared `MeshField`, `TrustedSources`). If none
  fits, you MAY add a new static `.astro` viz (inline SVG/CSS only — no client
  JS, AGENT.md Invariant 2) named by the post shorthand.
- Internal linking (SEO-PLAYBOOK IL-02): ≥ 2 inline markdown links to other
  existing `/blog/<slug>/` posts, with descriptive anchor text (IL-05). Pick
  topically related posts from `../../src/content/blog/`.
- Headings start at `h2` under the post `h1` (HP-04). No skipped levels.
- Segment + funnel: frame the piece for the slot's `segment`
  (ham | cert-emcomm | off-grid) and `funnel_stage`
  (awareness | evaluation | adoption) per `../STRATEGY.md`.

## Step 4 — Self-check against the playbook
Run `npm run build` (must pass — it enforces TS strict + the content schema).
Then verify the per-post `blocker`/`major` rules in `../SEO-PLAYBOOK.md` for
your new `dist/blog/<slug>/index.html`: SD-01, SD-03, SD-04, MT-01, MT-02,
MT-05, MT-06, IL-02, HP-04. Fix any FAIL before opening the PR.

## Step 5 — Update calendar status
In `../calendar.yaml`, set the chosen slot's `status` to `drafted` and ensure
its `brief` points at this file (`./briefs/content-writer.md`) if unset. Do not
change any other entry.

## Step 6 — Open the PR (no deploy)
- Commit: `git add` the new `.mdx`, any new viz component, and the calendar
  edit. Commit message: `post: <title>` with trailer
  `Co-Authored-By: Oz <oz-agent@warp.dev>`.
- Push `growth/post-<slug>` and open a DRAFT PR with `gh pr create --draft`.
  Body must list: the slot (date/segment/funnel/keywords), the SEO-PLAYBOOK
  rules you verified, whether the hero image asset is still pending, and the
  internal posts you linked.
- STOP. Human merge publishes (gate: human-merge). Report the branch + PR URL
  to the orchestrator.

## Hard constraints
- Never set `draft: true` to hide a finished post; use the `date` gate.
- Never edit `main`, never deploy, never run `./manage.sh blog:deploy`.
- Never contradict `llms.txt.ts` canon; if a fact must change, that file is the
  canonical source and the change is a separate `human-approval` decision —
  flag it, do not make it here.
