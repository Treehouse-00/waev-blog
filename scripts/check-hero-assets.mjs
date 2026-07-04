#!/usr/bin/env node
// check-hero-assets.mjs — reports CHARTER gate 2 status (the pre-publish hero
// checkpoint). A non-draft post that declares a `hero.src` should have that
// image present under public/; the content-writer agent only writes the image
// PROMPT, a human generates the image and adds the file via the image-handler
// loop. If the asset isn't there yet, the post still ships — src/lib/posts.ts
// falls back to the shared /hero-default.jpg — but this script reports which
// posts are running on the fallback so the gap stays visible and trackable.
// This check only fails (RED) if the fallback asset itself is missing, since
// that would mean posts render with no hero art at all.
//
// No external deps (runs anywhere Node does). Skips drafts and posts with no hero.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BLOG = "src/content/blog";
const PUBLIC = "public";
const DEFAULT_HERO = "hero-default.jpg";
const usingFallback = [];

for (const file of readdirSync(BLOG)) {
  if (!/\.(md|mdx)$/.test(file)) continue;
  const text = readFileSync(join(BLOG, file), "utf8");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const front = fm[1];
  if (/^draft:\s*true\s*$/m.test(front)) continue;
  // hero.src is the only indented `src:` in frontmatter (ogImage uses `ogImage:`).
  const m = front.match(/^\s+src:\s*["']?(\/[^"'\s]+)["']?/m);
  if (!m) continue; // no hero declared — allowed (some posts use a viz instead)
  const rel = m[1].replace(/^\//, "");
  if (!existsSync(join(PUBLIC, rel))) usingFallback.push(`${file}  ->  ${m[1]}`);
}

if (!existsSync(join(PUBLIC, DEFAULT_HERO))) {
  console.error(
    `Missing the shared fallback hero (public/${DEFAULT_HERO}). Every post whose\n` +
      "own hero asset isn't placed yet renders with NO hero art until this exists.\n",
  );
  process.exit(1);
}

if (usingFallback.length) {
  console.log(
    "OK — build will succeed. The following post(s) don't have their own hero\n" +
      "asset yet and are running on the shared default until a human attaches one\n" +
      "via the image-handler loop (CHARTER.md gate 2):\n",
  );
  for (const x of usingFallback) console.log("  - " + x);
} else {
  console.log("OK — every non-draft post has its own hero image asset.");
}
