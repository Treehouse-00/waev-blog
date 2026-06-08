# SEO-PLAYBOOK.md

The Tier-1 technical SEO program for `blog.waev.app`, encoded as machine-checkable
pass/fail rules. This is the HOW layer: an `seo-auditor` agent (see
`./briefs/seo-auditor.md`) evaluates every rule below against the **built site**
and fixes violations via PR. A `content-writer` agent (see
`./briefs/content-writer.md`) treats the per-post rules as a pre-PR gate.

This document does not assume a human reader. Each rule is a single boolean an
agent can decide, names the **exact file/location** to change, and states the
**evidence** to inspect. Do not add prose interpretation; if a rule is
ambiguous, that is a defect in the rule — open an issue to tighten it.

## How to run an audit

```bash
nvm use
npm run build          # emits dist/ ; production date gate applies
# Audit the BUILT html in dist/, not the .astro source, unless a rule says "source".
```

Conventions used below:
- **Scope** — which URLs the rule applies to.
- **Check** — the exact, automatable test. `dist/**` paths refer to built HTML.
- **PASS** — the boolean that must hold.
- **Fix** — the exact source file/location to edit when the rule FAILS.
- **Severity** — `blocker` (auditor must fix in-PR before merge) ·
  `major` (fix in-PR if mechanical, else open a `gh` issue) ·
  `minor` (batch into the next audit PR).

A post or page **passes the playbook** only when every `blocker` and `major`
rule for its scope is PASS. The auditor emits a JSON result line per rule:
`{ "id": "SD-01", "url": "...", "pass": true|false, "evidence": "..." }`.

Canon guard (applies to every rule): a fix must never contradict
`src/pages/llms.txt.ts` Key facts. If correcting SEO requires changing a
product fact, `llms.txt.ts` is the canonical source and must be updated first.

---

## 1. Structured data (JSON-LD)

The site injects JSON-LD via `src/layouts/Base.astro` (`#org`, `#website`) and
`src/layouts/Post.astro` (`BlogPosting`, optional `FAQPage`). Index/tag schema
is added per-page. Every graph must be valid against schema.org and free of
empty/placeholder values.

- **SD-01 — BlogPosting present on every post.** Severity: blocker.
  - Scope: `dist/blog/*/index.html`.
  - Check: exactly one `<script type="application/ld+json">` parses to
    `@type: "BlogPosting"` with non-empty `headline`, `description`,
    `datePublished` (ISO 8601), `author`, `publisher.@id` ending `/#org`,
    `mainEntityOfPage`, `image` (absolute URL).
  - PASS: all listed fields present and non-empty.
  - Fix: `src/layouts/Post.astro` `blogPosting` object (lines ~43–57).

- **SD-02 — dateModified emitted when `updated` is set.** Severity: major.
  - Scope: posts whose frontmatter has `updated`.
  - Check: BlogPosting contains `dateModified` equal to `updated` ISO date.
  - PASS: present and matches; absent only when frontmatter omits `updated`.
  - Fix: `src/layouts/Post.astro` (the `...(updated ? {dateModified} : {})` spread).

- **SD-03 — FAQPage emitted iff `faq` frontmatter is non-empty.** Severity: blocker.
  - Scope: all posts.
  - Check: if frontmatter `faq` has ≥1 item, exactly one `FAQPage` graph exists
    whose `mainEntity[*]` count equals the `faq` length, each with non-empty
    `name` and `acceptedAnswer.text`. If `faq` is empty/absent, NO `FAQPage` graph.
  - PASS: presence and item count match frontmatter exactly.
  - Fix: `src/layouts/Post.astro` `faqPage` derivation (lines ~58–70). FAQ copy
    lives only in frontmatter (AGENT.md Invariant 8) — never hand-author the graph.

- **SD-04 — FAQ answers are self-contained.** Severity: major.
  - Scope: posts with `faq`.
  - Check: each `acceptedAnswer.text` ≥ 40 chars, contains no markdown link
    syntax `](`, and is a complete sentence (ends with `.`/`?`/`!`).
  - PASS: all answers satisfy the above.
  - Fix: the post's `.mdx` frontmatter `faq` array.

- **SD-05 — Organization graph on every page.** Severity: blocker.
  - Scope: every `dist/**/index.html`.
  - Check: one graph `@type: "Organization"`, `@id` ends `/#org`, `name: "Waev"`,
    `url: "https://waev.app"`, `email: "admin@waev.app"`, `description` matches
    llms.txt canon ("Real-time analytics platform for MeshCore mesh radio networks").
  - PASS: all fields present and canon-consistent.
  - Fix: `src/layouts/Base.astro` `org` object (lines ~44–54).

- **SD-06 — Organization `sameAs` is a real identity, not the source repo.**
  Severity: blocker.
  - Scope: every page.
  - Check: `org.sameAs` MUST NOT contain any `github.com/*/waev-blog` URL (the
    current value `https://github.com/Treehouse-00/waev-blog` is the blog's
    own source repo and is wrong — it asserts the org *is* a code repo).
  - PASS: `sameAs` either (a) lists only canonical Waev identity profiles
    (e.g. the official site/social/wiki the org actually controls), or
    (b) the `sameAs` key is omitted entirely. An empty array is a FAIL — omit
    the key instead.
  - Fix: `src/layouts/Base.astro` line ~53. Default action if no verified
    profile exists: **remove the `sameAs` key**. Adding a profile URL is a
    `human-approval` decision (identity claim) — the auditor proposes the
    removal and lists candidate profiles in the PR body for a human to confirm.

- **SD-07 — WebSite graph present and linked to Org.** Severity: major.
  - Scope: every page.
  - Check: one graph `@type: "WebSite"`, `@id` ends `/#website`,
    `publisher.@id` ends `/#org`, `inLanguage: "en"`.
  - PASS: present and publisher-linked.
  - Fix: `src/layouts/Base.astro` `website` object (lines ~55–63).

- **SD-08 — Homepage ItemList of posts.** Severity: major.
  - Scope: `dist/index.html`.
  - Check: a JSON-LD graph `@type: "ItemList"` (or `Blog` with `blogPost[]`)
    enumerating the visible posts as `ListItem` with `position` (1-based, in
    render order) and `url` (absolute `/blog/<slug>/`). Count equals the number
    of post cards rendered (featured + rest).
  - PASS: graph present, positions contiguous from 1, URLs resolve to built posts.
  - Fix: `src/pages/index.astro` — build the list from `getPublishedPosts()` and
    pass it through the `jsonLd` prop of `Base.astro` (Base already accepts
    `jsonLd: Record<string, unknown>[]`). Do NOT hardcode the list.

- **SD-09 — BreadcrumbList on every post.** Severity: major.
  - Scope: `dist/blog/*/index.html`.
  - Check: a `BreadcrumbList` graph with items `Home (/) → Blog (/) or
    /blog/ → <post title> (canonical)`; `position` 1-based and contiguous;
    final item `item` equals the post canonical URL.
  - PASS: graph present, ordered, last crumb = canonical.
  - Fix: `src/layouts/Post.astro` — derive from `title` + `Astro.url`, append to
    `jsonLd` array passed to `Base`.

- **SD-10 — CollectionPage on every tag landing page.** Severity: major.
  - Scope: `dist/tags/*/index.html` (see §4; pages must exist first).
  - Check: a `CollectionPage` graph with `name` = "Posts tagged \"<tag>\"",
    `url` = canonical tag URL, and a `mainEntity`/`hasPart` `ItemList` of the
    tagged posts.
  - PASS: graph present and enumerates exactly the posts carrying that tag.
  - Fix: `src/pages/tags/[tag].astro` (new file, §4).

- **SD-11 — No JSON-LD parse errors or placeholder values.** Severity: blocker.
  - Scope: every page.
  - Check: every `application/ld+json` block is valid JSON; no value is empty,
    `"undefined"`, `"null"`, `"TODO"`, or a non-absolute URL where an absolute
    URL is required (`@id`, `url`, `image`, breadcrumb `item`).
  - PASS: all blocks parse; no placeholder/relative-where-absolute values.
  - Fix: the page/layout that emitted the offending graph.

---

## 2. Required meta tags

Source surface: `src/layouts/Base.astro` `<head>` (lines ~67–121) and
`src/layouts/Post.astro` which forwards article props.

- **MT-01 — Title present and bounded.** Severity: blocker.
  - Scope: every page.
  - Check: the `<title>` text content is non-empty and 15–60 characters
    inclusive. On post pages (`dist/blog/*/index.html`) the text MUST end with
    the exact 12-character suffix ` — Waev Blog` (space, U+2014 em dash, space,
    `Waev Blog`), appended by `src/layouts/Post.astro` line ~74 — which means a
    post's frontmatter `title` must be ≤ 48 chars to keep `<title>` ≤ 60.
  - PASS: `15 ≤ len(<title> text) ≤ 60` AND (the page is not a post OR the
    `<title>` ends with ` — Waev Blog`).
  - Fix: for a too-long post title, shorten the frontmatter `title` in that
    post's `.mdx` (the suffix is fixed in `src/layouts/Post.astro` line ~74 — do
    not change it). For non-post pages, fix the `title` prop passed to
    `src/layouts/Base.astro`.

- **MT-02 — Meta description present and bounded.** Severity: blocker.
  - Scope: every page.
  - Check: `<meta name="description">` non-empty, 70–160 chars.
  - PASS: within bounds.
  - Fix: page `description` prop / post frontmatter `description`.

- **MT-03 — Canonical self-referential.** Severity: blocker.
  - Scope: every page.
  - Check: `<link rel="canonical">` equals the page's own absolute URL with
    trailing slash, built from `Astro.site`.
  - PASS: matches the served URL.
  - Fix: `src/layouts/Base.astro` line ~76 (`canonical`).

- **MT-04 — `author` meta on posts.** Severity: major.
  - Scope: `dist/blog/*/index.html`.
  - Check: `<meta name="author" content="...">` present, equals frontmatter
    `author` (default `"Waev"`).
  - PASS: present and matches.
  - Fix: `src/layouts/Base.astro` — add `author` to `Props` and emit the tag;
    pass it through from `src/layouts/Post.astro`.

- **MT-05 — `article:tag` per tag on posts.** Severity: major.
  - Scope: posts with ≥1 tag.
  - Check: one `<meta property="article:tag" content="<tag>">` per frontmatter
    tag, in order.
  - PASS: count and values equal frontmatter `tags`.
  - Fix: `src/layouts/Base.astro` (emit when `type === "article"`); pass `tags`
    from `src/layouts/Post.astro`.

- **MT-06 — Article time metadata on posts.** Severity: major.
  - Scope: `dist/blog/*/index.html`.
  - Check: exactly one `<meta property="article:published_time">` whose `content`
    is a valid ISO 8601 timestamp equal to the post's frontmatter `date`
    (`Post.astro` passes `publishedTime={date.toISOString()}`, line ~77). AND
    `<meta property="article:modified_time">` is present with `content ==
    updated.toISOString()` IF AND ONLY IF the frontmatter has `updated`; it MUST
    be absent when `updated` is absent.
  - PASS: `published_time` present and ISO-valid; `modified_time` present-and-
    matching iff `updated` is set, absent otherwise.
  - Fix: `src/layouts/Base.astro` — `article:published_time` is emitted at
    line ~87; `article:modified_time` is NOT yet emitted. Add a `modifiedTime?:
    string` prop to `Base.astro`, emit the meta tag beside line ~87, and pass
    `modifiedTime={updated?.toISOString()}` from the `<Base …>` call in
    `src/layouts/Post.astro` (lines ~73–79).

- **MT-07 — `twitter:site` (and `twitter:creator`).** Severity: major.
  - Scope: every page.
  - Check: `<meta name="twitter:site" content="@...">` present and non-empty.
  - PASS: present.
  - Fix: `src/layouts/Base.astro` Twitter block (lines ~89–93). The handle is an
    identity claim — if no official handle is verified, the auditor proposes the
    tag with the candidate handle and flags it `human-approval` in the PR body
    rather than inventing one.

- **MT-08 — Open Graph completeness.** Severity: major.
  - Scope: every page.
  - Check: `og:type`, `og:title`, `og:description`, `og:url`, `og:image`
    (absolute), `og:site_name` all present and non-empty.
  - PASS: all six present.
  - Fix: `src/layouts/Base.astro` OG block (lines ~80–87).

- **MT-09 — OG/Twitter image is absolute and resolvable.** Severity: major.
  - Scope: every page.
  - Check: `og:image`/`twitter:image` are absolute URLs under `Astro.site`; the
    referenced file exists in `dist/` (or `public/`).
  - PASS: absolute and the asset exists.
  - Fix: post frontmatter `ogImage`/`hero.src`, or `public/og-default.png`.

- **MT-10 — Viewport + charset.** Severity: minor.
  - Scope: every page.
  - Check: `<meta charset>` and `<meta name="viewport">` present.
  - PASS: both present.
  - Fix: `src/layouts/Base.astro` lines ~70–72.

---

## 3. Homepage keywording

- **HP-01 — Homepage `<title>` carries the primary entity + intent.**
  Severity: major.
  - Scope: `dist/index.html`.
  - Check: title contains "MeshCore" AND a content noun ("blog" or "analytics"),
    ≤ 60 chars.
  - PASS: both tokens present, within length.
  - Fix: `src/pages/index.astro` line ~18 `Base title=`. Current
    `"Waev Blog — News, updates & philosophy"` omits "MeshCore" → FAIL.

- **HP-02 — Homepage meta description carries primary keywords.**
  Severity: major.
  - Scope: `dist/index.html`.
  - Check: description (70–160 chars) contains "MeshCore" and at least one
    segment term from `./STRATEGY.md` (e.g. "mesh network", "off-grid",
    "emergency"), consistent with llms.txt canon.
  - PASS: contains "MeshCore" + ≥1 segment term, within bounds.
  - Fix: pass an explicit `description` to `Base` in `src/pages/index.astro`
    (it currently falls back to the Base default).

- **HP-03 — Exactly one `<h1>` on the homepage.** Severity: major.
  - Scope: `dist/index.html`.
  - Check: exactly one `<h1>`; its text references mesh/MeshCore intelligence.
  - PASS: single h1, on-topic.
  - Fix: `src/pages/index.astro` masthead (lines ~22–25).

- **HP-04 — Heading hierarchy is well-formed.** Severity: minor.
  - Scope: `dist/index.html` and posts.
  - Check: no heading level is skipped (no `h3` before an `h2`); post body
    starts at `h2` under the post `h1`.
  - PASS: no skipped levels.
  - Fix: the offending `.astro`/`.mdx`.

---

## 4. Tag landing pages

These do not exist yet. The auditor's first structural task is to build them,
then keep them passing. Tags currently render as inert `<span class="tag">`
badges in `src/pages/index.astro` and `src/layouts/Post.astro` — they must
become links.

- **TG-01 — A landing page exists for every tag in use.** Severity: major.
  - Scope: union of all frontmatter `tags` across published posts.
  - Check: `dist/tags/<tag>/index.html` exists for each tag (slugified:
    lowercase, spaces→`-`).
  - PASS: every in-use tag has a built page; no orphan tag pages for unused tags.
  - Fix: create `src/pages/tags/[tag].astro` using
    `getStaticPaths()` over `getPublishedPosts()`; derive tag set there.

- **TG-02 — Tag page lists its posts and only its posts.** Severity: major.
  - Scope: each tag page.
  - Check: the page lists exactly the published posts whose `tags` include the
    tag, newest first, each linking to `/blog/<slug>/`.
  - PASS: membership exact and ordering correct.
  - Fix: `src/pages/tags/[tag].astro`.

- **TG-03 — Tag page carries CollectionPage schema + unique title/description.**
  Severity: major.
  - Scope: each tag page.
  - Check: passes SD-10; `<title>` = `Posts tagged "<tag>" — Waev Blog`;
    meta description mentions the tag and "MeshCore".
  - PASS: schema + unique metadata present.
  - Fix: `src/pages/tags/[tag].astro`.

- **TG-04 — Tag badges are links everywhere they render.** Severity: major.
  - Scope: `dist/index.html`, `dist/blog/*/index.html`, tag pages.
  - Check: every visible tag badge is an `<a href="/tags/<slug>/">`, not a bare
    `<span>`.
  - PASS: no non-link tag badge remains.
  - Fix: `src/pages/index.astro` (lines ~38–40, ~74–76) and
    `src/layouts/Post.astro` (lines ~99–103).

- **TG-05 — Tag pages are indexable and in the sitemap.** Severity: minor.
  - Scope: tag pages.
  - Check: no `noindex`; URLs appear in `dist/sitemap-index.xml` chain.
  - PASS: indexable and present in sitemap.
  - Fix: ensure pages are static (no `prerender = false`); `@astrojs/sitemap`
    picks them up automatically.

---

## 5. Internal linking

Existing posts (slugs for cross-linking): `bring-your-own-broker`,
`how-waev-reads-your-mesh`, `reading-the-signal`, `the-opinionated-mesh-analyzer`,
`what-we-choose-not-to-know`, `when-the-grid-goes-down`,
`where-to-put-your-next-repeater`, `your-mesh-on-field-day`.

- **IL-01 — A related-posts block renders on every post.** Severity: major.
  - Scope: `dist/blog/*/index.html`.
  - Check: a `Related` section/component renders 2–4 links to OTHER published
    posts (never self), each an `<a href="/blog/<slug>/">`.
  - PASS: 2–4 valid, non-self internal links present.
  - Fix: create `src/components/RelatedPosts.astro` (static, no client JS per
    AGENT.md Invariant 2), select by shared tags then recency, render it in
    `src/layouts/Post.astro` after the `faq` section. Wire its data in
    `src/pages/blog/[...slug].astro`.

- **IL-02 — Every post body has ≥2 inline internal cross-links.** Severity: major.
  - Scope: `dist/blog/*/index.html`.
  - Check: count anchors inside the rendered post body ONLY — the
    `<div class="prose">` container in `src/layouts/Post.astro` (line ~114),
    which by construction excludes the nav, the post header, the FAQ section,
    and the `RelatedPosts` block (IL-01, all rendered outside `.prose`) — whose
    `href` matches `^/blog/<slug>/$` for a slug OTHER than the current post.
    Count distinct target slugs.
  - PASS: ≥ 2 distinct other-post `/blog/<slug>/` targets inside `.prose`
    (self-links excluded).
  - Fix: add contextual links in the post's `.mdx` body — `content-writer` must
    satisfy this at authoring time (its brief Step 3 internal-linking rule).

- **IL-03 — No broken internal links.** Severity: blocker.
  - Scope: every page.
  - Check: every `<a href>` starting `/` resolves to a built path in `dist/`
    (post, tag, index, rss, sitemap, llms.txt).
  - PASS: zero unresolved internal hrefs.
  - Fix: the page emitting the dead link (fix or remove).

- **IL-04 — No orphan posts.** Severity: major.
  - Scope: each published post.
  - Check: every post is reachable from at least one other published page via an
    internal link (index card, related block, tag page, or inline link).
  - PASS: in-degree ≥ 1 for every post.
  - Fix: add a link from a relevant post or ensure tag/index coverage.

- **IL-05 — Descriptive anchor text.** Severity: minor.
  - Scope: inline internal links.
  - Check: anchor text is not a bare URL and not "click here"/"read more"
    (the index card CTA is exempt).
  - PASS: anchors are descriptive.
  - Fix: the post `.mdx`.

---

## 6. Sitemap & llms.txt hygiene

- **SM-01 — Sitemap exists and indexes all public URLs.** Severity: blocker.
  - Scope: `dist/sitemap-index.xml` → child sitemap(s).
  - Check: contains the homepage, every published `/blog/<slug>/`, and every
    `/tags/<slug>/`. Excludes drafts and future-dated (date-gated) posts.
  - PASS: set of URLs equals the set of public, currently-published pages.
  - Fix: `astro.config.*` `@astrojs/sitemap` integration / `site` value.

- **SM-02 — Sitemap URLs match canonicals.** Severity: major.
  - Scope: sitemap entries.
  - Check: each sitemap URL equals the corresponding page's `<link rel="canonical">`
    (trailing slash, host).
  - PASS: 1:1 match, no host/slash drift.
  - Fix: `astro.config.*` `site`; canonical in `src/layouts/Base.astro`.

- **SM-03 — llms.txt lists exactly the published posts.** Severity: major.
  - Scope: `dist/llms.txt`.
  - Check: the `## Posts` list equals `getPublishedPosts()` output (same set,
    newest-first), each as `- [title](abs-url): description`.
  - PASS: set and order match the live index.
  - Fix: `src/pages/llms.txt.ts` (it already derives from `getPublishedPosts()`
    — a FAIL here means a rendering/canon regression, not new copy).

- **SM-04 — llms.txt Key facts stay canon-consistent.** Severity: blocker.
  - Scope: `dist/llms.txt` (the `## Key facts` section).
  - Check: the built file contains ALL of these exact substrings (case-sensitive),
    each encoding one canon fact:
    1. `⛔ 🛑 🚫` and `never stored, mapped, or counted` and
       `identity-scrubbed at the ingest edge` (privacy by default);
    2. `enrolled observers` and `authenticated repeaters` and
       `Spoofed or inferred prefixes are rejected` (evidence-based topology);
    3. `bring-your-own-broker` and `operators host their own MQTT broker`
       (data ownership);
    4. `admin@waev.app` (contact).
  - PASS: every listed substring is present in `dist/llms.txt`.
  - Fix: `src/pages/llms.txt.ts` — this file IS the canon; a missing/altered
    substring is a regression. Any intended change to a fact is a
    `human-approval` decision (SM-04 is a `blocker`), never a silent rewrite.

- **SM-05 — RSS validity.** Severity: minor.
  - Scope: `dist/rss.xml`.
  - Check: well-formed RSS; items match published posts.
  - PASS: valid feed, item set matches index.
  - Fix: `src/pages/rss.xml.js`.

- **SM-06 — robots reachability.** Severity: minor.
  - Scope: site root.
  - Check: if a `robots.txt` exists it references `/sitemap-index.xml` and does
    not `Disallow: /`. Absence is acceptable (Cloudflare Pages serves all).
  - PASS: no accidental global disallow; sitemap referenced if robots present.
  - Fix: `public/robots.txt`.

---

## 7. Auditor output contract

For each run the `seo-auditor` agent MUST:
1. Run `npm run build`; abort with a `blocker` finding if the build fails.
2. Evaluate every rule in §§1–6 against `dist/`, emitting one JSON result line
   per (rule, url): `{ "id", "url", "pass", "severity", "evidence" }`.
3. Fix every FAILing `blocker` (and mechanical `major`) in the same PR, naming
   each rule ID in the PR body. Open a `gh` issue for non-mechanical `major`
   fixes and for every rule flagged `human-approval` (SD-06, MT-07, SM-04).
4. Never deploy. Never edit `main`. Hand off per `./briefs/seo-auditor.md`.
