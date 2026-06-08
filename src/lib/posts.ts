import { getCollection, type CollectionEntry } from "astro:content";

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
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
