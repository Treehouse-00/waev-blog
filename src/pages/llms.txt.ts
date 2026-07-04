import type { APIRoute } from "astro";
import { getPublishedPosts } from "../lib/posts";

/**
 * /llms.txt — the emerging convention (llmstxt.org) that hands LLMs a
 * curated, machine-friendly map of the site: a one-line summary, the post
 * index, and the canonical facts an answer engine should cite. Generated
 * from the content collection so new posts appear automatically.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? "https://blog.waev.app/").replace(/\/$/, "");
  const posts = await getPublishedPosts();

  const lines = [
    "# Waev Blog",
    "",
    "> News, updates, and the thinking behind Waev — a real-time analytics platform for MeshCore mesh radio networks. Privacy by default, evidence-based topology, and a data-ownership posture that keeps a community's data with its operator.",
    "",
    "This blog covers what Waev builds, how it works, and the values behind it, for everyone in the MeshCore world — from mesh-curious tinkerers, makers, and students experimenting with LoRa to the people who run MeshCore networks: ham clubs, CERT teams, off-grid neighborhoods, and emergency-response groups.",
    "",
    "## Posts",
    ...posts.map(
      (p) => `- [${p.data.title}](${base}/blog/${p.id}/): ${p.data.description}`,
    ),
    "",
    "## Key facts",
    "- Waev is a real-time analytics platform for MeshCore mesh radio networks (tagline: mesh network intelligence).",
    "- Privacy by default: a node named with a privacy marker (⛔ 🛑 🚫) is never stored, mapped, or counted. Companion/personal devices are identity-scrubbed at the ingest edge; only anonymous signal metadata (SNR, hops, timing) is retained.",
    "- Evidence-based topology: map edges are drawn only from enrolled observers (connected over MQTT) and authenticated repeaters. Spoofed or inferred prefixes are rejected, never drawn.",
    "- Data ownership: nothing locks an operator's stream to Waev — observer credentials are publish-only, Waev's own docs carry presets for competitor tools, and the read API is public.",
    "- Main app: https://waev.app · Contact: admin@waev.app · Infrastructure: Cloudflare.",
    "",
    "## More",
    `- [RSS feed](${base}/rss.xml)`,
    `- [Sitemap](${base}/sitemap-index.xml)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
