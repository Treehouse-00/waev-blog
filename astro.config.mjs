// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { remarkReadingTime } from "./remark-reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://blog.waev.app",
  // Static output — ships pre-rendered HTML with near-zero JS, deployed to
  // Cloudflare Pages. "Performance is the point" — the blog embodies the
  // value it preaches.
  output: "static",
  trailingSlash: "ignore",
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
  build: {
    // Emit /blog/<slug>/index.html so links resolve with or without a
    // trailing slash behind the Pages static router.
    format: "directory",
  },
});
