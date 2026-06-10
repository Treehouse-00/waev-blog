// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { remarkReadingTime } from "./remark-reading-time.mjs";
import fs from "fs";
import path from "path";

// Extract dates from frontmatter to populate the sitemap's lastmod correctly
function getBlogDateMap() {
  const map = {};
  const blogDir = path.resolve("./src/content/blog");
  try {
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
      if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
      const content = fs.readFileSync(path.join(blogDir, file), "utf8");
      // Prefer `updated`, fallback to `date`
      const matchUpdated = content.match(/updated:\s*([\d-]+)/);
      const matchDate = content.match(/date:\s*([\d-]+)/);
      const dateStr = (matchUpdated && matchUpdated[1]) || (matchDate && matchDate[1]);
      if (dateStr) {
        const slug = file.replace(/\.mdx?$/, "");
        map[`/blog/${slug}/`] = new Date(dateStr).toISOString();
      }
    }
  } catch (e) {
    console.warn("Failed to read blog dates for sitemap", e);
  }
  return map;
}

const blogDateMap = getBlogDateMap();

// https://astro.build/config
export default defineConfig({
  site: "https://blog.waev.app",
  // Static output — ships pre-rendered HTML with near-zero JS, deployed to
  // Cloudflare Pages. "Performance is the point" — the blog embodies the
  // value it preaches.
  output: "static",
  trailingSlash: "ignore",
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        // Extract the pathname to match against our map
        const url = new URL(item.url);
        // Find if this is a blog post
        const matchingPath = Object.keys(blogDateMap).find(p => url.pathname === p || url.pathname === p.slice(0, -1));
        if (matchingPath) {
          item.lastmod = blogDateMap[matchingPath];
        }
        return item;
      }
    })
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
  build: {
    // Emit /blog/<slug>/index.html so links resolve with or without a
    // trailing slash behind the Pages static router.
    format: "directory",
  },
});
