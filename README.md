# blog.waev.app

The companion blog for [waev.app](https://waev.app) — news, updates, and the
philosophy behind **Waev**, the opinionated MeshCore analyzer.

Built with [Astro](https://astro.build) (static output), deployed to
Cloudflare Pages. It mirrors the look, feel, and brand tone of the main app by
**vendoring the Waev design tokens** rather than depending on the app's
`@waev/ui-kit` package — so this repo stands entirely on its own.

## Stack

- **Astro 5** — static site generator, near-zero JS shipped.
- **@astrojs/mdx** — posts are Markdown/MDX; visual aids are inline `.astro`
  components embedded in the post.
- **@astrojs/sitemap** — `sitemap-index.xml` generated at build.
- **Cloudflare Pages** — `wrangler pages deploy dist`.

## Develop

```bash
nvm use            # node 24 (.nvmrc)
npm install
npm run dev        # http://localhost:4321
```

| Command                    | Action                                             |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Start the dev server                               |
| `npm run build`            | Build the static site to `dist/`                   |
| `npm run preview`          | Preview the production build locally               |
| `npm run deploy`           | Build + `wrangler pages deploy dist` (`waev-blog`) |
| `./manage.sh blog:deploy`  | Production build (date-gated) + deploy             |
| `./manage.sh blog:preview` | Build with all scheduled posts visible → preview   |
| `./manage.sh blog:check`   | List which posts would publish today               |

## Writing a post

Drop a new `.mdx` (or `.md`) file in `src/content/blog/`. The filename becomes
the URL slug (`/blog/<slug>/`). Frontmatter:

```mdx
---
title: "Your title"
description: "One-sentence lead, also used for SEO + OG."
date: 2026-06-08
tags: ["philosophy"]
draft: false
---

import Figure from "../../components/Figure.astro";

Body copy in Markdown...

<Figure caption="Optional caption with <b>emphasis</b>.">
  {/* any inline SVG or viz component */}
</Figure>
```

**Do not include a byline or signoff.** Posts have no closing signature ("— The Waev team" or equivalent). The post speaks for itself.

Reading time is computed automatically (`remark-reading-time.mjs`). Set
`draft: true` to keep a post out of the index and build entirely.

## Scheduling posts

Posts are **date-gated**: a non-draft post goes live only once its `date` has
arrived. Future-dated posts are written and committed normally but stay hidden
from the index, post routes, and RSS until their calendar slot — the gate lives
in `src/lib/posts.ts`. A daily GitHub Action
(`.github/workflows/scheduled-publish.yml`, 13:00 UTC) rebuilds and redeploys so
each post auto-launches on its date with no manual step.

While writing, you can still see scheduled content:

- `npm run dev` includes future-dated posts, so you can preview them locally.
- `WAEV_PREVIEW=true npm run build` (or `./manage.sh blog:preview`) builds with
  the date gate bypassed — used for the editorial review deploy.

A normal production build/deploy (`./manage.sh blog:deploy`, `npm run deploy`,
or CI) always applies the gate, so scheduled posts never leak early.

## Project layout

```
src/
  components/
    Nav.astro  Footer.astro  WaevLogo.astro  ThemeToggle.astro  Figure.astro
    viz/       # abstracted-UI visual aids (MeshField, PrivacyScrub, …)
  content/
    blog/      # the posts
  layouts/
    Base.astro # <head>, meta/OG, theme bootstrap, nav + footer
    Post.astro # article chrome + prose
  pages/
    index.astro            # post list + masthead
    blog/[...slug].astro   # renders a post
  styles/
    tokens.css             # vendored Waev design tokens
    themes/{dim,dark,light}.css
    base.css chrome.css blog.css
public/
  _headers   favicon.svg   og-default.png
```

## Re-syncing the design system

The brand is kept in lockstep with the app by vendoring three artifacts from
the `waev` monorepo (`packages/ui-kit/dist/css/`):

- `tokens.css` → `src/styles/tokens.css`
- `themes/{dim,dark,light}.css` → `src/styles/themes/`

If the app's design tokens change, re-copy those files. Everything else
(`base.css`, `chrome.css`, `blog.css`) only *consumes* tokens — it never
hardcodes a color or size — so a token refresh re-themes the whole blog.

The favicon and a placeholder OG card are also copied from the app
(`frontend/public/`). Replace `public/og-default.png` with a blog-specific
1200×630 card when one is ready.

## Deploy

First-time setup (already done for the canonical project):

```bash
wrangler pages project create waev-blog --production-branch main
```

Manual deploy — prefer the `manage.sh` wrapper, which builds with the
production date gate, guards a dirty working tree in CI, and bounds the Pages
commit message:

```bash
./manage.sh blog:deploy    # build (date-gated) + deploy to production
./manage.sh blog:preview   # build with WAEV_PREVIEW=true → *.pages.dev preview
./manage.sh blog:check     # clean build; list which posts would publish today
```

`npm run deploy` still works as a thin equivalent of `blog:deploy` (build +
`wrangler pages deploy dist`). Run `./manage.sh` with no command for the full
command + env-override reference.

CI deploy: `.github/workflows/deploy.yml` deploys on every push to `main`, and
`.github/workflows/scheduled-publish.yml` rebuilds daily (13:00 UTC) so
date-gated posts auto-launch. Both need these repo secrets:

- `CLOUDFLARE_API_TOKEN` — token with **Cloudflare Pages: Edit**
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account id

### Custom domain

`blog.waev.app` is attached to the `waev-blog` Pages project (Pages →
waev-blog → Custom domains). Because `waev.app` is already on Cloudflare, the
CNAME is created automatically when the domain is added.
