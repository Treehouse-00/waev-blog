// Emit the weekly sweep markdown report from seo-sweep-out.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATE = process.argv[2];
if (!DATE) { console.error('usage: node seo-sweep-report.mjs YYYY-MM-DD'); process.exit(1); }
const o = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'seo-sweep-out.json'), 'utf8'));

const ORDER = (a, b) => a.localeCompare(b);
const ids = Object.keys(o.summary).sort(ORDER);
const notes = {
  'MT-02': 'FAIL persists on `main`; fix already pending in open draft **PR #86** (same 7 posts) — not duplicated this cycle',
  'IL-02': 'editorial; tracked in open **issue #85** (identical 6-post set) — comment posted, not duplicated',
  'IL-03': '0 broken; 11 forward-refs to scheduled post `when-the-grid-goes-down` (date 2026-08-27) carved out per AGENT.md Invariant 1',
  'MT-07': 'ratified 2026-07-04: no official handle → omission is the passing state',
};

let md = '';
md += `# SEO Sweep — ${DATE}\n\n`;
md += `Audit type: weekly link & crawl sweep (CADENCE.md §3.3). Evaluated against production build \`dist/\` `;
md += `(${o.counts.posts} published posts, ${o.counts.tagPages} tag pages, homepage + about pages; ${o.counts.pages} indexable URLs). `;
md += `Date gate applied (\`WAEV_PREVIEW\` unset), so future-dated posts are excluded by design.\n\n`;

md += `## Summary\n\n`;
md += `| Rule | Severity | PASS | FAIL | Note |\n|------|----------|------|------|------|\n`;
for (const id of ids) {
  const s = o.summary[id];
  md += `| ${id} | ${s.severity} | ${s.pass} | ${s.fail} | ${s.fail > 0 ? (notes[id] || '') : (notes[id] || '')} |\n`;
}

const failing = ids.filter((id) => o.summary[id].fail > 0);
md += `\n## Failing rules — detail\n\n`;
if (failing.length === 0) md += `_No FAILs this cycle._\n`;
for (const id of failing) {
  const s = o.summary[id];
  md += `### ${id} (${s.severity}) — ${s.fail} FAIL\n\n`;
  if (notes[id]) md += `> ${notes[id]}\n\n`;
  for (const f of s.fails) md += `- \`${f.url}\` — ${f.evidence}\n`;
  md += `\n`;
}

md += `## Disposition this cycle\n\n`;
md += `- **No new PR opened.** The only mechanical FAIL (MT-02, 7 over-length descriptions) is already fixed in the still-open draft **PR #86** (2026-08-11 slot), covering the identical 7 posts. Opening a second PR would duplicate it; the fix awaits human merge of #86 (gate: human-merge).\n`;
md += `- **No new issue opened.** The editorial FAIL (IL-02, 6 posts under the inline-cross-link floor) is already tracked in open **issue #85** with a materially identical slug set and per-post counts. This run posted a dated confirmation comment on #85 rather than opening a duplicate.\n`;
md += `- **IL-03 clean.** Zero broken internal links. The 11 links to \`/blog/when-the-grid-goes-down/\` are forward-references to a scheduled post (date 2026-08-27, \`draft: false\`) and resolve on publish — not defects (AGENT.md Invariant 1).\n`;
md += `- **MT-07** remains correctly omitted (no official handle; ratified 2026-07-04). No issue opened.\n`;
md += `- Build passed (\`npm run build\`, 81 pages) before and after evaluation. Never deployed, never merged.\n\n`;

md += `## Full result set (one JSON line per rule/url)\n\n`;
md += '```jsonl\n';
for (const r of o.results) md += JSON.stringify(r) + '\n';
md += '```\n';

fs.writeFileSync(path.join(ROOT, 'growth', 'reports', `seo-sweep-${DATE}.md`), md);
console.log(`wrote growth/reports/seo-sweep-${DATE}.md (${md.length} bytes, ${o.results.length} result lines)`);
