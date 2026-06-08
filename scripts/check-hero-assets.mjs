#!/usr/bin/env node
// check-hero-assets.mjs — enforces CHARTER gate 2 (the final pre-publish
// checkpoint). A non-draft post that declares a `hero.src` must have that image
// present under public/. The content-writer agent only writes the image PROMPT;
// a human generates the image and adds the file. This check stays RED until the
// asset exists, so a post cannot be merged/published without its human-made hero.
//
// No external deps (runs anywhere Node does). Skips drafts and posts with no hero.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BLOG = "src/content/blog";
const PUBLIC = "public";
const missing = [];

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
  if (!existsSync(join(PUBLIC, rel))) missing.push(`${file}  ->  ${m[1]}`);
}

if (missing.length) {
  console.error(
    "Missing hero image asset(s). A human must generate each from the post's\n" +
      "ILLUSTRATION PROMPT (also in the PR body) and add it under public/ before\n" +
      "the post can publish — see CHARTER.md gate 2:\n",
  );
  for (const x of missing) console.error("  - " + x);
  process.exit(1);
}
console.log("OK — every non-draft post has its hero image asset.");
