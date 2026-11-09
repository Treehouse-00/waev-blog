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
    "- Privacy markers: a node named with a privacy marker (⛔ 🛑 🚫) that is not an enrolled observer has its ADVERTs dropped before Waev's database and analytics writes. Limits: the drop is logged with the node's public key and name (Workers Logs keeps a 5% sample); packets that carry no name, such as discovery responses, are not checked and can create a nameless node row; a node that adds a marker after being mapped keeps its earlier row and position until the 182-hour prune; the opt-out cleanup does not clear name history, analytics rows, or archived raw frames. An enrolled observer with a marker is hidden from the public map, topology, and network stats, but live packet frames still carry its device ID and IATA code.",
    "- Companion devices: a companion ADVERT's name, public key, and source hash are blanked in analytics rows and the live feed, and companions get no node-registry row or map dot. Analytics rows keep the companion's device type and ADVERT latitude/longitude (about 90-day retention). Direct messages keep 1-byte source and destination address prefixes. Login requests (ANON_REQ) carry the sender's permanent public key, which Waev stores in analytics and broadcasts in the live feed.",
    "- Raw frames and message text: Waev archives the full raw wire frame of each packet, ADVERTs included, and serves it at https://api.waev.app/packets/{hash}/raw; structured-field scrubbing does not rewrite archived bytes. Waev decrypts Public-channel messages with the published key to read the sender's display name, keeps the name (shown in Live Packets), and discards the text. Anyone can read Public-channel and guessable #hashtag text from the archive, because those keys are published or derived from the channel name.",
    "- Evidence-based topology: every map edge carries an evidence class — Proven (zero-hop reception carrying the sender's full Ed25519 key), Corroborated (RF-measured and heard by 2+ observers or identity resolved at >= 0.99), Inferred (reconstructed from relayed path hashes, which are unsigned 1-3-byte key prefixes; drawn at reduced opacity on the default map), Rejected (fails the physics checks; excluded from the default map, available only in explicit audit views). ADVERT signatures are verified and recorded in observe mode; an invalid signature does not stop an advert.",
    "- Data ownership: nothing locks an operator's stream to Waev — observer credentials are publish-only, Waev's own docs carry presets for competitor tools, and the read API is public. When a partner is connected, Waev forwards observers' raw publishes for that partner's entitled regions to a subscribe-only feed, before dedup and before Waev's privacy filters. Waev does not offer bring-your-own-broker.",
    "- Main app: https://waev.app · Contact: admin@waev.app · Infrastructure: Cloudflare · Account sign-in: Supabase.",
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
