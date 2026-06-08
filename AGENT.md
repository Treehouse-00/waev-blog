# AGENT.md

Operating guide for AI coding agents working in **`waev-blog`** (the source for
`blog.waev.app`). Optimized for capable agents (Claude Opus 4.8+): act
autonomously within the guardrails below, but treat the **Invariants** as hard
constraints — they encode decisions that are easy to silently break and
expensive to catch.

## What this repo is

The companion blog for [waev.app](https://waev.app) — **Waev**, a real-time
analytics platform for MeshCore mesh-radio networks. It is a static
[Astro 5](https://astro.build) site (near-zero JS) deployed to **Cloudflare
Pages** (project `waev-blog`). It is intentionally **standalone**: it vendors
the Waev design tokens rather than depending on the app's `@waev/ui-kit`.

"Performance is the point" — the blog embodies the value it preaches. Keep it
fast, static, and dependency-light.

## Quick start

```bash
nvm use            # Node 24 (.nvmrc) — match this version
npm install
npm run dev        # http://localhost:4321 (shows future-dated posts too)
```

Before declaring any change done, **always**:

```bash
npm run build      # must pass — this is the real correctness gate (TS strict + content schema)
```

## Commands

| Command                     | Purpose                                                          |
| --------------------------- | --------------------------------------------------------------- |
| `npm run dev`               | Dev server; **includes** scheduled (future-dated) posts         |
| `npm run build`             | Static build to `dist/`; production date gate applies           |
| `npm run preview`           | Serve the built `dist/` locally                                 |
| `./manage.sh blog:deploy`   | Production build (date-gated) + deploy to Cloudflare Pages      |
| `./manage.sh blog:preview`  | Build with `WAEV_PREVIEW=true` (all scheduled posts) → preview  |
| `./manage.sh blog:check`    | Clean production build; list which posts would publish **today**|

`npm run deploy` is a thin equivalent of `blog:deploy`. Run `./manage.sh` with
no args for the full env-override reference.

## Architecture map

- `src/content/blog/*.mdx` — the posts. Filename = URL slug (`/blog/<slug>/`).
- `src/content.config.ts` — the `blog` collection schema (Zod). Frontmatter is
  validated here; an invalid field **fails the build**.
- `src/lib/posts.ts` — `getPublishedPosts()`, the single source of truth for
  which posts are visible. **All** surfaces (index, post routes, RSS, llms.txt)
  go through it. Change visibility logic here, nowhere else.
- `src/layouts/Base.astro` — `<head>`, meta/OG, theme bootstrap, org JSON-LD
  (`#org`), nav + footer.
- `src/layouts/Post.astro` — article chrome, hero, FAQ section, and per-post
  `BlogPosting` + `FAQPage` JSON-LD (derived from frontmatter).
- `src/components/viz/*.astro` — inline visual aids embedded in posts. Named by
  post shorthand (`byob-*`, `fieldday-*`, `gridgone-*`, `hiw-*`, `privacy-*`,
  `signal-*`, `Playbook*`). Shared: `MeshField`, `Figure`, `TrustedSources`.
- `src/pages/` — `index.astro`, `blog/[...slug].astro`, `rss.xml.js`,
  `llms.txt.ts` (AEO map), sitemap via `@astrojs/sitemap`.
- `src/styles/` — `tokens.css` (vendored), `themes/{dim,dark,light}.css`, and
  `base.css`/`chrome.css`/`blog.css` which only *consume* tokens.
- `public/_headers` — Cloudflare Pages security headers, incl. the CSP.
- `remark-reading-time.mjs` — auto reading-time (exposed as `minutesRead`).
- `.github/workflows/` — `deploy.yml` (push to `main`) and
  `scheduled-publish.yml` (daily 13:00 UTC rebuild for auto-launch).

## Invariants (do NOT break)

1. **Scheduled publishing is a feature, not a bug.** Posts are date-gated in
   `src/lib/posts.ts`: a non-draft post goes live only when its `date` has
   arrived. **Future-dated posts are intentional** — never "fix" a future date
   to make a post appear. `WAEV_PREVIEW=true` (and `npm run dev`) bypass the
   gate for review; a production build must never set it. `./manage.sh
   blog:deploy` already `unset`s it defensively — keep that.
2. **Near-zero JS.** `output: "static"`. Do not introduce client-side
   frameworks, hydration, or heavy runtime JS. Visual aids are static `.astro`
   components (inline SVG/CSS), not React/island components.
3. **CSP is allow-listed.** Any new external origin (script, style, font,
   image, fetch) **must** be added to the `Content-Security-Policy` in
   `public/_headers` or it will be blocked in production. Currently only `self`
   + Google Fonts are allowed; `script-src` is `'self' 'unsafe-inline'` with
   **no inline event handlers**. Prefer not adding origins at all.
4. **Never hardcode colors or sizes.** Use the CSS custom properties from
   `tokens.css` (e.g. `var(--sp-2)`). A token refresh must re-theme the whole
   site. This keeps brand lockstep with the main app.
5. **Posts have no byline or signoff.** No "— The Waev team", no closing
   signature. The post speaks for itself.
6. **Factual canon.** Product claims must stay consistent with the "Key facts"
   in `src/pages/llms.txt.ts` (privacy markers ⛔ 🛑 🚫 → never stored;
   evidence-based topology from enrolled observers + authenticated repeaters;
   bring-your-own-broker data ownership; contact `admin@waev.app`). If a fact
   genuinely changes, update `llms.txt.ts` as the canonical source.
7. **Accessibility is non-negotiable.** Decorative images use `alt=""`; hero
   images carry a real `alt`. Viz components need appropriate ARIA / text
   alternatives. Recent work was an a11y refactor across all viz — do not
   regress it.
8. **FAQ frontmatter is the single source of truth.** The `faq` array renders
   both the visible "Frequently asked" section **and** the `FAQPage` JSON-LD.
   Don't duplicate FAQs in body copy.

## Authoring a post

Drop a `.mdx` in `src/content/blog/`. Frontmatter (schema in
`src/content.config.ts`):

```mdx
---
title: "Your title"
description: "One-sentence lead — also used for SEO + OG."
date: 2026-09-01            # future date = scheduled; goes live on this day
tags: ["how-it-works"]
author: "Waev"             # default; rarely overridden
ogImage: "/hero-foo-og.jpg" # optional; precedence: ogImage → hero.src → /og-default.png
hero:                       # optional whimsical illustration (top of post + social)
  src: "/hero-foo.jpg"
  alt: "Describe the image for screen readers."
draft: false               # draft:true hides it from index AND build entirely
faq:                        # optional; renders section + FAQPage JSON-LD
  - q: "A real question?"
    a: "A complete, citable answer."
---
```

Conventions observed across existing posts:
- Open with a short **`<div class="callout"><p><strong>In short.</strong> …</p></div>`**
  summary near the top — this is the answer-engine (AEO) hook.
- Embed visuals via `<Figure caption="…"><SomeViz /></Figure>`; captions may
  contain inline HTML (`<b>`).
- Hero/OG images live in `public/` as `hero-<slug>.jpg` (+ `-og` variant).
- Leave the trailing `{/* ILLUSTRATION PROMPT: … */}` comment if present.
- Reading time is automatic — don't write it by hand.

## Deploy & CI

- Local: `./manage.sh blog:deploy` (preferred) or `npm run deploy`.
- CI: `deploy.yml` deploys on push to `main`; `scheduled-publish.yml` rebuilds
  daily so date-gated posts auto-launch. Both need repo secrets
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Production custom domain `blog.waev.app` → `waev-blog` Pages project.

## Working agreement

- **Verify, don't assume:** run `npm run build` after edits; use
  `./manage.sh blog:check` to confirm publish state.
- **Stay in scope:** this repo is standalone — don't add a dependency on
  `@waev/ui-kit` or the monorepo.
- **Match the prose voice:** measured, technical, no hype, no signoff.
- **Never commit or deploy unless asked.** Editing files is fine; `git commit`,
  `git push`, and `blog:deploy` are explicit user actions.
- When you touch design tokens, re-sync per the README's "Re-syncing the design
  system" section rather than editing tokens ad hoc.
