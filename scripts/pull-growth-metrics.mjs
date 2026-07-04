#!/usr/bin/env node
// pull-growth-metrics.mjs — the CI-side data fetch for the Waev Growth OS.
//
// WHY THIS EXISTS: the monthly analytics loop is the only Growth OS loop that
// needs secrets (Google Search Console + Cloudflare + optional Perplexity).
// Rather than hand those secrets to the Claude analytics routine, this script
// runs inside GitHub Actions (`.github/workflows/growth-metrics.yml`), where
// the secrets are injected only for the run, pulls the raw numbers defined in
// `growth/MEASUREMENT.md`, and writes a single metrics JSON. The secret-free
// Claude analytics-reporter routine then consumes that JSON and does the
// analysis (report prose + threshold evaluation + calendar PR). No secret ever
// reaches the Claude environment.
//
// DEPENDENCIES: none. Pure Node 24 (global fetch, node:crypto). This keeps the
// blog's dependency-light ethos and needs no `npm install` / `pip install` in
// CI. Google OAuth is minted from the service-account JSON with a hand-rolled
// RS256 JWT (node:crypto), so `google-auth` is not required.
//
// GRACEFUL DEGRADATION: every source is independent and wrapped. A missing
// secret, an unreachable API, or a plan limit (Cloudflare referer filtering is
// paid-only) records the metric as `null` and appends a `data-gap` note —
// NEVER a fabricated number (MEASUREMENT.md invariant; CHARTER "never invent a
// baseline"). The script exits 0 even with gaps so CI still publishes the
// partial metrics; it exits non-zero only on an unexpected internal error.
//
// OUTPUT: writes `growth/reports/_metrics-<YYYY-MM>.json` (override the path
// with METRICS_OUT). The workflow publishes it to the orphan `growth-metrics`
// branch for the routine to read. Prints the report month to stdout.

import crypto from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ── Canon identifiers (mirror growth/MEASUREMENT.md §Identifiers) ────────────
const GSC_PROPERTY = "sc-domain:waev.app";
const GSC_PAGE_FILTER = "https://blog.waev.app/";
const CF_BLOG_HOST = "blog.waev.app";
const CF_APP_HOST = "waev.app";
const WINDOW_DAYS = 28;
const GSC_LAG_DAYS = 2; // GSC data is ~2–3 days delayed; end the window before it.

// The AEO probe set is canonical and comparable month-over-month. It lives here
// as the single source of truth; edit it ONLY via a STRATEGY.md change
// (MEASUREMENT.md §5). 8 core + 4 mesh-curious = 12 probes.
const AEO_PROBES_CORE = [
  "MeshCore network analytics platform",
  "how to map a MeshCore mesh network topology",
  "privacy-preserving mesh radio analytics",
  "bring your own MQTT broker mesh analytics",
  "MeshCore repeater monitoring for CERT teams",
  "off-grid neighborhood mesh network dashboard",
  "ham club MeshCore network visualization",
  "evidence-based mesh topology vs inferred topology",
];
const AEO_PROBES_MESH = [
  "getting started with MeshCore for beginners",
  "MeshCore home lab monitoring and dashboard",
  "visualize a LoRa mesh network you built yourself",
  "MeshCore node hardware prototyping and testing tools",
];
const AEO_PROBE_SET_VERSION = "2026-07"; // bump when the probe set changes (STRATEGY gate).

// ── Small helpers ────────────────────────────────────────────────────────────
const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function computeWindow(now) {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - GSC_LAG_DAYS);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
  return {
    start: isoDate(start),
    end: isoDate(end),
    days: WINDOW_DAYS,
    // Cloudflare wants RFC3339 datetimes; use the same calendar window.
    cf_since: `${isoDate(start)}T00:00:00Z`,
    cf_until: `${isoDate(end)}T23:59:59Z`,
  };
}

// ── Google Search Console ────────────────────────────────────────────────────
async function mintGoogleToken(saJson, scope) {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const assertion = `${signingInput}.${b64url(signer.sign(sa.private_key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function gscQuery(token, body) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    GSC_PROPERTY
  )}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`gsc ${res.status}: ${await res.text()}`);
  return res.json();
}

async function pullSearch(win, gaps) {
  const saJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const empty = { impressions: null, clicks: null, ctr: null, queries_tracked: null, top_queries: [] };
  if (!saJson) {
    gaps.push("search: GSC_SERVICE_ACCOUNT_JSON not provided");
    return empty;
  }
  try {
    const token = await mintGoogleToken(
      saJson,
      "https://www.googleapis.com/auth/webmasters.readonly"
    );
    const pageFilter = {
      dimensionFilterGroups: [
        { filters: [{ dimension: "page", operator: "contains", expression: GSC_PAGE_FILTER }] },
      ],
    };
    // Totals (accurate) via the date dimension.
    const totals = await gscQuery(token, {
      startDate: win.start,
      endDate: win.end,
      type: "web",
      dimensions: ["date"],
      rowLimit: 1000,
      ...pageFilter,
    });
    let impr = 0,
      clicks = 0;
    for (const r of totals.rows ?? []) {
      impr += r.impressions ?? 0;
      clicks += r.clicks ?? 0;
    }
    // Per-query rows for the movers / striking-distance tables.
    const byQuery = await gscQuery(token, {
      startDate: win.start,
      endDate: win.end,
      type: "web",
      dimensions: ["query"],
      rowLimit: 1000,
      ...pageFilter,
    });
    const rows = (byQuery.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? "",
      position: r.position ?? null,
      impressions: r.impressions ?? 0,
      clicks: r.clicks ?? 0,
      ctr: r.ctr ?? null,
    }));
    rows.sort((a, b) => b.impressions - a.impressions);
    return {
      impressions: impr,
      clicks,
      ctr: impr > 0 ? clicks / impr : null, // recompute from totals, never average per-row CTR
      queries_tracked: rows.length,
      top_queries: rows, // agent trims to the top 10 for the report
    };
  } catch (e) {
    gaps.push(`search: ${e.message}`);
    return empty;
  }
}

// ── Cloudflare zone analytics (GraphQL) ──────────────────────────────────────
async function cfQuery(token, query, variables) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || (j.errors && j.errors.length)) {
    throw new Error(`cloudflare ${res.status}: ${JSON.stringify(j.errors ?? j)}`);
  }
  return j;
}

// Return the first zone in a viewer response, or THROW if none. Cloudflare
// returns HTTP 200 with an empty `zones` array (no `errors`) when the token
// cannot see the given zoneTag — reachability failure, NOT genuine zero
// traffic. Treating that as a real `0` would fabricate a metric (violates
// MEASUREMENT.md §North-star "Reachability → MANUAL-GATE" and CHARTER "never
// invent a baseline"), so we throw here and let the caller record null + gap.
// A REACHABLE zone with genuinely zero traffic returns a present zone whose
// `httpRequestsAdaptiveGroups` is `[]` — that stays a real 0, handled below.
function firstZoneOrThrow(j) {
  const zones = j?.data?.viewer?.zones;
  if (!Array.isArray(zones) || zones.length === 0) {
    throw new Error("zone not reachable with this token (empty zones — check CF_ZONE_ID and token scope)");
  }
  return zones[0];
}

async function pullNorthStar(win, zoneTag, token, gaps) {
  // Cloudflare "visits" on the app host whose referer host is the blog. The
  // clientRefererHost filter is a PAID-plan feature — on a free plan this
  // query errors → MANUAL-GATE (null + data-gap), per MEASUREMENT.md.
  const q = `query($zoneTag:String!,$since:Time!,$until:Time!){viewer{zones(filter:{zoneTag:$zoneTag}){httpRequestsAdaptiveGroups(limit:1,filter:{datetime_geq:$since,datetime_leq:$until,requestSource:"eyeball",clientRequestHTTPHost:"${CF_APP_HOST}",clientRefererHost:"${CF_BLOG_HOST}"}){count sum{visits}}}}}`;
  try {
    const j = await cfQuery(token, q, { zoneTag, since: win.cf_since, until: win.cf_until });
    const g = firstZoneOrThrow(j).httpRequestsAdaptiveGroups?.[0];
    return { referrals: g?.sum?.visits ?? 0, requests: g?.count ?? 0, source: "cloudflare" };
  } catch (e) {
    gaps.push(`north_star: ${e.message} (referer filtering needs a paid Cloudflare plan / app-zone reach)`);
    return { referrals: null, requests: null, source: "cloudflare" };
  }
}

async function pullBlogTraffic(win, zoneTag, token, gaps) {
  const base = `datetime_geq:$since,datetime_leq:$until,requestSource:"eyeball",clientRequestHTTPHost:"${CF_BLOG_HOST}"`;
  const totalsQ = `query($zoneTag:String!,$since:Time!,$until:Time!){viewer{zones(filter:{zoneTag:$zoneTag}){httpRequestsAdaptiveGroups(limit:1,filter:{${base}}){count sum{visits}}}}}`;
  const pagesQ = `query($zoneTag:String!,$since:Time!,$until:Time!){viewer{zones(filter:{zoneTag:$zoneTag}){httpRequestsAdaptiveGroups(limit:50,filter:{${base}},orderBy:[count_DESC]){count sum{visits} dimensions{clientRequestPath}}}}}`;
  try {
    const totals = await cfQuery(token, totalsQ, { zoneTag, since: win.cf_since, until: win.cf_until });
    const g = firstZoneOrThrow(totals).httpRequestsAdaptiveGroups?.[0];
    let top_pages = [];
    try {
      const pages = await cfQuery(token, pagesQ, { zoneTag, since: win.cf_since, until: win.cf_until });
      top_pages = (pages.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? []).map((r) => ({
        path: r.dimensions?.clientRequestPath ?? "",
        count: r.count ?? 0,
        visits: r.sum?.visits ?? 0,
      }));
    } catch (e) {
      gaps.push(`blog_traffic.top_pages: ${e.message}`);
    }
    return { visits: g?.sum?.visits ?? 0, count: g?.count ?? 0, top_pages };
  } catch (e) {
    gaps.push(`blog_traffic: ${e.message}`);
    return { visits: null, count: null, top_pages: [] };
  }
}

async function pullCloudflare(win, gaps) {
  const token = process.env.CF_ANALYTICS_TOKEN;
  const zoneTag = process.env.CF_ZONE_ID;
  const nsEmpty = { referrals: null, requests: null, source: "cloudflare" };
  const btEmpty = { visits: null, count: null, top_pages: [] };
  if (!token || !zoneTag) {
    gaps.push("cloudflare: CF_ANALYTICS_TOKEN or CF_ZONE_ID not provided");
    return { north_star: nsEmpty, blog_traffic: btEmpty };
  }
  const north_star = await pullNorthStar(win, zoneTag, token, gaps);
  const blog_traffic = await pullBlogTraffic(win, zoneTag, token, gaps);
  return { north_star, blog_traffic };
}

// ── Perplexity AEO probe (optional) ──────────────────────────────────────────
async function probeOne(key, q) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 256,
      messages: [{ role: "user", content: q }],
    }),
  });
  if (!res.ok) throw new Error(`perplexity ${res.status}`);
  const j = await res.json();
  const urls = [
    ...(j.citations ?? []),
    ...((j.search_results ?? []).map((s) => s.url).filter(Boolean)),
  ];
  return urls.some((u) => typeof u === "string" && u.includes("blog.waev.app"));
}

async function pullAeo(gaps) {
  const key = process.env.PERPLEXITY_API_KEY;
  const empty = {
    total: null,
    out_of: 12,
    mesh_subset: null,
    mesh_out_of: 4,
    citing_queries: [],
    probe_set_version: AEO_PROBE_SET_VERSION,
  };
  if (!key) {
    gaps.push("aeo: PERPLEXITY_API_KEY not provided (optional metric)");
    return empty;
  }
  // Probe each query independently. A per-probe failure (e.g. a transient 429)
  // must not discard the probes that succeeded — but if ANY probe errored, the
  // 12-count is not comparable month-over-month, so we degrade the whole metric
  // to null + a gap (never report a wrong/undercounted number) rather than emit
  // a partial total.
  const citing = [];
  let core = 0,
    mesh = 0,
    errors = 0;
  for (const q of AEO_PROBES_CORE) {
    try {
      if (await probeOne(key, q)) {
        core++;
        citing.push(q);
      }
    } catch {
      errors++;
    }
  }
  for (const q of AEO_PROBES_MESH) {
    try {
      if (await probeOne(key, q)) {
        mesh++;
        citing.push(q);
      }
    } catch {
      errors++;
    }
  }
  if (errors > 0) {
    gaps.push(`aeo: ${errors}/12 probes errored — metric not comparable this run`);
    return empty;
  }
  return {
    total: core + mesh,
    out_of: 12,
    mesh_subset: mesh,
    mesh_out_of: 4,
    citing_queries: citing,
    probe_set_version: AEO_PROBE_SET_VERSION,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  const reportMonth = now.toISOString().slice(0, 7); // YYYY-MM (UTC)
  const win = computeWindow(now);
  const gaps = [];

  const [search, cf, aeo] = await Promise.all([
    pullSearch(win, gaps),
    pullCloudflare(win, gaps),
    pullAeo(gaps),
  ]);

  const referral_ctr =
    cf.north_star.referrals != null && cf.blog_traffic.visits
      ? cf.north_star.referrals / cf.blog_traffic.visits
      : null;

  const out = {
    schema: "growth-metrics/v1",
    generated_at: now.toISOString(),
    report_month: reportMonth,
    window: win,
    data_gaps: gaps,
    north_star: cf.north_star,
    search,
    aeo,
    blog_traffic: cf.blog_traffic,
    referral_ctr,
  };

  const outPath = process.env.METRICS_OUT || `growth/reports/_metrics-${reportMonth}.json`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

  // Machine-readable line the workflow greps for the month; human summary after.
  console.log(`report_month=${reportMonth}`);
  console.log(`metrics_out=${outPath}`);
  console.log(
    `[growth-metrics] window ${win.start}..${win.end} · ` +
      `north-star=${out.north_star.referrals ?? "null"} · ` +
      `impressions=${search.impressions ?? "null"} clicks=${search.clicks ?? "null"} · ` +
      `blog-visits=${out.blog_traffic.visits ?? "null"} · ` +
      `aeo=${aeo.total ?? "null"}/12 · data_gaps=${gaps.length}`
  );
  if (gaps.length) console.log(`[growth-metrics] data gaps:\n  - ${gaps.join("\n  - ")}`);
}

main().catch((e) => {
  console.error(`[growth-metrics] FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
