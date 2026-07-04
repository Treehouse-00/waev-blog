import { getCollection, type CollectionEntry } from "astro:content";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = fileURLToPath(new URL("../../public", import.meta.url));

// Shown in place of a post's declared hero when that hero's asset file hasn't
// been placed yet (content-writer declared a hero.src but a human hasn't
// generated/attached the image via the image-handler loop). A post with no
// `hero` field at all is left as-is — some posts intentionally run text-only.
const DEFAULT_HERO = {
  src: "/hero-default.jpg",
  alt: "A wide field of luminous violet and white threads flowing in parallel through darkness, evoking a live packet stream in motion.",
};

function resolveHero(hero?: { src: string; alt: string }) {
  if (!hero) return hero;
  return existsSync(`${PUBLIC_DIR}${hero.src}`) ? hero : DEFAULT_HERO;
}

/**
 * Returns blog posts that should be visible, newest first.
 *
 * Scheduled publishing: a post is live only when it is not a draft AND its
 * `date` has arrived. Future-dated posts are written and committed but stay
 * hidden until their calendar slot — a daily rebuild (see
 * `.github/workflows/scheduled-publish.yml`) re-evaluates this at build time
 * so each post auto-launches on its date.
 *
 * In dev (`astro dev`) future-dated posts ARE included, so authors can
 * preview scheduled content while writing.
 */
export async function getPublishedPosts(): Promise<CollectionEntry<"blog">[]> {
  const now = Date.now();
  // WAEV_PREVIEW=true bypasses the date gate — used for the preview deployment
  // so all scheduled posts are visible for editorial review before going live.
  const preview = process.env.WAEV_PREVIEW === "true";
  const posts = await getCollection("blog", ({ data }) => {
    if (data.draft) return false;
    if (import.meta.env.DEV) return true;
    if (preview) return true;
    return data.date.valueOf() <= now;
  });
  return posts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((post) => ({ ...post, data: { ...post.data, hero: resolveHero(post.data.hero) } }));
}
