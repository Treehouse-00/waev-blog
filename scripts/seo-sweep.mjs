// Weekly SEO sweep evaluator — parses dist/ and emits JSON result lines per (rule,url).
// Run: node scripts/seo-sweep.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://blog.waev.app';
const BLOG_SRC = path.join(ROOT, 'src', 'content', 'blog');

// ---------- helpers ----------
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(fp));
    else out.push(fp);
  }
  return out;
}

// All built index.html pages -> URL
const htmlFiles = walk(DIST).filter((f) => f.endsWith('index.html'));
function urlOf(file) {
  const rel = path.relative(DIST, file).replace(/index\.html$/, '');
  return SITE + '/' + rel.replace(/\\/g, '/');
}
function normSlashUrl(u) {
  return u.endsWith('/') ? u : u + '/';
}

// Extract all JSON-LD blocks (multiline-safe)
function ldBlocks(html) {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    let raw = m[1];
    // Astro escapes nothing special here, but be defensive with common HTML entities
    try {
      out.push({ ok: true, data: JSON.parse(raw), raw });
    } catch (e) {
      out.push({ ok: false, error: String(e), raw });
    }
  }
  return out;
}
// Flatten @graph into a list of node objects
function graphNodes(blocks) {
  const nodes = [];
  for (const b of blocks) {
    if (!b.ok) continue;
    const d = b.data;
    if (Array.isArray(d)) nodes.push(...d);
    else if (d['@graph']) nodes.push(...d['@graph']);
    else nodes.push(d);
  }
  return nodes;
}
function nodeType(n, t) {
  const ty = n['@type'];
  return Array.isArray(ty) ? ty.includes(t) : ty === t;
}

// meta helpers
function metaName(html, name) {
  const re = new RegExp(`<meta[^>]+name="${name}"[^>]*content="([^"]*)"`, 'i');
  const re2 = new RegExp(`<meta[^>]+content="([^"]*)"[^>]*name="${name}"`, 'i');
  return (html.match(re) || html.match(re2) || [])[1];
}
function metaProp(html, prop) {
  const re = new RegExp(`<meta[^>]+property="${prop}"[^>]*content="([^"]*)"`, 'i');
  const re2 = new RegExp(`<meta[^>]+content="([^"]*)"[^>]*property="${prop}"`, 'i');
  return (html.match(re) || html.match(re2) || [])[1];
}
function allMetaProp(html, prop) {
  const re = new RegExp(`<meta[^>]+property="${prop}"[^>]*content="([^"]*)"`, 'ig');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}
function titleText(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return undefined;
  return m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#8212;/g, '\u2014');
}
function canonical(html) {
  const m = html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]*)"/i);
  return m && m[1];
}
function allAnchors(html) {
  const re = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push({ href: m[1], text: m[2].replace(/<[^>]*>/g, '').trim() });
  return out;
}
// isolate <div class="prose"> ... </div> by brace-matching on div tags
function proseRegion(html) {
  const start = html.search(/<div class="prose">/);
  if (start < 0) return '';
  let i = html.indexOf('>', start) + 1;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = i;
  let m;
  while ((m = tagRe.exec(html))) {
    if (m[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) return html.slice(i, m.index);
  }
  return html.slice(i);
}

// ---------- source frontmatter (for tags/faq/updated/date) ----------
function parseFrontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  const body = m[1];
  const dateM = body.match(/^date:\s*(.+)$/m);
  if (dateM) fm.date = dateM[1].trim();
  const updM = body.match(/^updated:\s*(.+)$/m);
  if (updM) fm.updated = updM[1].trim();
  const draftM = body.match(/^draft:\s*(.+)$/m);
  fm.draft = draftM ? /true/.test(draftM[1]) : false;
  // tags: inline array or block list
  const tagsInline = body.match(/^tags:\s*\[([^\]]*)\]/m);
  if (tagsInline) {
    fm.tags = tagsInline[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  } else {
    const block = body.match(/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m);
    fm.tags = block ? block[1].split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '')).filter(Boolean) : [];
  }
  // faq count — count "- q:" lines within the frontmatter block (robust)
  fm.faqCount = /^faq:/m.test(body) ? (body.match(/^\s+-\s+q:/gm) || []).length : 0;
  return fm;
}
const srcPosts = {};
if (exists(BLOG_SRC)) {
  for (const f of fs.readdirSync(BLOG_SRC).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))) {
    const slug = f.replace(/\.mdx?$/, '');
    srcPosts[slug] = parseFrontmatter(read(path.join(BLOG_SRC, f)));
  }
}

// classify pages
const pages = htmlFiles.map((file) => {
  const url = normSlashUrl(urlOf(file));
  const rel = path.relative(DIST, file);
  let kind = 'other';
  let slug = null;
  if (rel === 'index.html') kind = 'home';
  else if (rel.startsWith('blog/')) { kind = 'post'; slug = rel.split('/')[1]; }
  else if (rel.startsWith('tags/')) { kind = 'tag'; slug = rel.split('/')[1]; }
  else kind = 'page';
  return { file, url, rel, kind, slug, html: read(file) };
});
const posts = pages.filter((p) => p.kind === 'post');
const tagPages = pages.filter((p) => p.kind === 'tag');
const home = pages.find((p) => p.kind === 'home');

// ---------- results ----------
const results = [];
const R = (id, url, pass, severity, evidence) => results.push({ id, url, pass, severity, evidence });

// build set of all built internal paths for link resolution
const builtPaths = new Set();
for (const f of walk(DIST)) {
  let rel = '/' + path.relative(DIST, f).replace(/\\/g, '/');
  builtPaths.add(rel);
  if (rel.endsWith('/index.html')) builtPaths.add(rel.replace(/index\.html$/, '')); // dir with slash
}
// known future/draft slugs in source (for IL-03 carve-out)
const srcSlugSet = new Set(Object.keys(srcPosts));

function resolvesInternal(href) {
  // strip query/hash
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '' ) return true;
  if (builtPaths.has(clean)) return true;
  if (builtPaths.has(clean.endsWith('/') ? clean : clean + '/')) return true;
  // file assets
  if (exists(path.join(DIST, clean.replace(/^\//, '')))) return true;
  return false;
}

// ============ Structured data ============
for (const p of pages) {
  const blocks = ldBlocks(p.html);
  const nodes = graphNodes(blocks);
  // SD-11: parse + placeholder
  const parseErr = blocks.filter((b) => !b.ok);
  let placeholder = null;
  const scan = (obj, keyPath = '') => {
    if (obj == null) { return; }
    if (typeof obj === 'string') {
      if (['undefined', 'null', 'TODO', ''].includes(obj.trim())) placeholder = placeholder || `${keyPath}="${obj}"`;
      if (/@id$|(^|\.)url$|image$|(^|\.)item$/.test(keyPath) && /^\/(?!\/)/.test(obj)) placeholder = placeholder || `${keyPath} relative:${obj}`;
      return;
    }
    if (Array.isArray(obj)) { obj.forEach((v, i) => scan(v, keyPath)); return; }
    if (typeof obj === 'object') { for (const k of Object.keys(obj)) scan(obj[k], keyPath ? keyPath + '.' + k : k); }
  };
  nodes.forEach((n) => scan(n));
  R('SD-11', p.url, parseErr.length === 0 && !placeholder, 'blocker',
    parseErr.length ? `parse error: ${parseErr[0].error}` : placeholder ? `placeholder ${placeholder}` : 'ok');

  // SD-05 Organization
  const org = nodes.find((n) => nodeType(n, 'Organization'));
  const orgOk = org && String(org['@id'] || '').endsWith('/#org') && org.name === 'Waev' && org.url === 'https://waev.app' && org.email === 'admin@waev.app' && /Real-time analytics platform for MeshCore mesh radio networks/i.test(org.description || '');
  R('SD-05', p.url, !!orgOk, 'blocker', org ? `org name=${org.name} email=${org.email}` : 'no Organization graph');
  // SD-06 sameAs
  let sd06 = true, sd06ev = 'sameAs omitted or clean';
  if (org && org.sameAs) {
    const arr = Array.isArray(org.sameAs) ? org.sameAs : [org.sameAs];
    if (arr.length === 0) { sd06 = false; sd06ev = 'empty sameAs array'; }
    const bad = arr.find((u) => /github\.com\/[^/]+\/waev-blog/i.test(u));
    if (bad) { sd06 = false; sd06ev = `source-repo sameAs ${bad}`; }
  }
  R('SD-06', p.url, sd06, 'blocker', sd06ev);
  // SD-07 WebSite
  const web = nodes.find((n) => nodeType(n, 'WebSite'));
  const webOk = web && String(web['@id'] || '').endsWith('/#website') && String((web.publisher || {})['@id'] || '').endsWith('/#org') && web.inLanguage === 'en';
  R('SD-07', p.url, !!webOk, 'major', web ? `website publisher=${(web.publisher || {})['@id']}` : 'no WebSite graph');
}

// posts SD-01/02/03/04/09
for (const p of posts) {
  const nodes = graphNodes(ldBlocks(p.html));
  const bp = nodes.find((n) => nodeType(n, 'BlogPosting'));
  const bpOk = bp && bp.headline && bp.description && /^\d{4}-\d{2}-\d{2}/.test(bp.datePublished || '') && bp.author &&
    String((bp.publisher || {})['@id'] || '').endsWith('/#org') && bp.mainEntityOfPage && /^https?:\/\//.test(bp.image || (Array.isArray(bp.image) ? bp.image[0] : '') || '');
  R('SD-01', p.url, !!bpOk, 'blocker', bp ? `headline=${!!bp.headline} image=${bp.image}` : 'no BlogPosting');

  const fm = srcPosts[p.slug] || {};
  // SD-02 dateModified iff updated
  if (fm.updated) {
    const ok = bp && String(bp.dateModified || '').startsWith(String(fm.updated).slice(0, 10));
    R('SD-02', p.url, !!ok, 'major', `updated=${fm.updated} dateModified=${bp && bp.dateModified}`);
  } else {
    const ok = !bp || bp.dateModified === undefined;
    R('SD-02', p.url, ok, 'major', 'no updated -> no dateModified');
  }
  // SD-03 FAQPage iff faq
  const faq = nodes.find((n) => nodeType(n, 'FAQPage'));
  const faqCount = fm.faqCount || 0;
  if (faqCount > 0) {
    const cnt = faq && Array.isArray(faq.mainEntity) ? faq.mainEntity.length : 0;
    const allText = faq && faq.mainEntity && faq.mainEntity.every((q) => q.name && (q.acceptedAnswer || {}).text);
    R('SD-03', p.url, !!faq && cnt === faqCount && !!allText, 'blocker', `faq fm=${faqCount} graph=${cnt}`);
    // SD-04 self-contained answers
    let sd04 = true, ev = 'ok';
    if (faq && faq.mainEntity) {
      for (const q of faq.mainEntity) {
        const t = (q.acceptedAnswer || {}).text || '';
        if (t.length < 40 || t.includes('](') || !/[.?!]["')\]]?\s*$/.test(t.trim())) { sd04 = false; ev = `bad answer: "${t.slice(0, 50)}"`; break; }
      }
    }
    R('SD-04', p.url, sd04, 'major', ev);
  } else {
    R('SD-03', p.url, !faq, 'blocker', faq ? 'FAQPage present but no faq frontmatter' : 'no faq -> no FAQPage');
  }
  // SD-09 BreadcrumbList
  const bc = nodes.find((n) => nodeType(n, 'BreadcrumbList'));
  let bcOk = false, bcEv = 'no BreadcrumbList';
  if (bc && Array.isArray(bc.itemListElement)) {
    const items = bc.itemListElement;
    const posOk = items.every((it, i) => it.position === i + 1);
    const last = items[items.length - 1];
    const lastItem = typeof last.item === 'string' ? last.item : (last.item || {})['@id'] || (last.item || {}).url;
    bcOk = posOk && normSlashUrl(String(lastItem || '')) === p.url;
    bcEv = `items=${items.length} last=${lastItem}`;
  }
  R('SD-09', p.url, bcOk, 'major', bcEv);
}

// SD-08 homepage ItemList
{
  const nodes = graphNodes(ldBlocks(home.html));
  const il = nodes.find((n) => nodeType(n, 'ItemList'));
  const blog = nodes.find((n) => nodeType(n, 'Blog') && Array.isArray(n.blogPost));
  let ok = false, ev = 'no ItemList/Blog';
  if (il && Array.isArray(il.itemListElement)) {
    const items = il.itemListElement;
    const posContig = items.every((it, i) => it.position === i + 1);
    const urlsOk = items.every((it) => /^https?:\/\/.*\/blog\/[^/]+\/$/.test(normSlashUrl(it.url || (it.item || {}).url || '')));
    ok = posContig && urlsOk && items.length > 0;
    ev = `ItemList count=${items.length} contiguous=${posContig}`;
  } else if (blog) {
    const items = blog.blogPost;
    const posContig = items.every((it, i) => it.position === undefined || it.position === i + 1);
    const urlsOk = items.every((it) => /^https?:\/\/.*\/blog\/[^/]+\/$/.test(normSlashUrl(it.url || '')));
    ok = posContig && urlsOk && items.length > 0;
    ev = `Blog.blogPost count=${items.length} contiguous=${posContig} urlsOk=${urlsOk}`;
  }
  R('SD-08', home.url, ok, 'major', ev);
}

// SD-10 CollectionPage on tag pages
for (const t of tagPages) {
  const nodes = graphNodes(ldBlocks(t.html));
  const cp = nodes.find((n) => nodeType(n, 'CollectionPage'));
  let ok = false, ev = 'no CollectionPage';
  if (cp) {
    const il = cp.mainEntity || cp.hasPart;
    // list may be an ItemList node, or a direct array of BlogPosting
    const hasList = il && (
      (Array.isArray(il) && il.length > 0) ||
      nodeType(il, 'ItemList') ||
      Array.isArray(il.itemListElement)
    );
    ok = !!hasList && /^Posts tagged/.test(cp.name || '');
    const n = Array.isArray(il) ? il.length : (il && il.itemListElement ? il.itemListElement.length : 0);
    ev = `name=${cp.name} listItems=${n}`;
  }
  R('SD-10', t.url, ok, 'major', ev);
}

// ============ Meta tags ============
for (const p of pages) {
  const html = p.html;
  const title = titleText(html);
  // MT-01
  let mt01 = false, ev01 = `len=${title ? title.length : 'none'}`;
  if (title) {
    const len = title.length;
    const inBounds = len >= 15 && len <= 60;
    const suffixOk = p.kind !== 'post' || / \u2014 Waev Blog$/.test(title) || / — Waev Blog$/.test(title);
    mt01 = inBounds && suffixOk;
    ev01 = `"${title}" len=${len} suffix=${suffixOk}`;
  }
  R('MT-01', p.url, mt01, 'blocker', ev01);
  // MT-02
  const desc = metaName(html, 'description');
  const dlen = desc ? desc.length : 0;
  R('MT-02', p.url, !!desc && dlen >= 70 && dlen <= 160, 'blocker', `len=${dlen}`);
  // MT-03 canonical
  const can = canonical(html);
  R('MT-03', p.url, !!can && normSlashUrl(can) === p.url, 'blocker', `canonical=${can}`);
  // MT-07 twitter:site (ratified: absent = pass; fail only if present+placeholder)
  const tw = metaName(html, 'twitter:site');
  if (tw === undefined) R('MT-07', p.url, true, 'major', 'omitted (ratified: no official handle)');
  else R('MT-07', p.url, /^@\S+/.test(tw) && !/placeholder|xxx|todo/i.test(tw), 'major', `twitter:site=${tw}`);
  // MT-08 OG completeness
  const og = {
    type: metaProp(html, 'og:type'), title: metaProp(html, 'og:title'), desc: metaProp(html, 'og:description'),
    url: metaProp(html, 'og:url'), image: metaProp(html, 'og:image'), site: metaProp(html, 'og:site_name'),
  };
  const ogOk = Object.values(og).every((v) => v && v.length);
  R('MT-08', p.url, ogOk, 'major', `missing=${Object.keys(og).filter((k) => !og[k]).join(',') || 'none'}`);
  // MT-09 image absolute + exists
  const ogImg = og.image || metaName(html, 'twitter:image');
  let mt09 = false, ev09 = `og:image=${ogImg}`;
  if (ogImg && /^https?:\/\//.test(ogImg)) {
    const p2 = ogImg.replace(SITE, '');
    mt09 = exists(path.join(DIST, p2.replace(/^\//, '')));
    ev09 = `${ogImg} exists=${mt09}`;
  }
  R('MT-09', p.url, mt09, 'major', ev09);
  // MT-10 viewport + charset
  const vp = /<meta[^>]+name="viewport"/i.test(html);
  const cs = /<meta[^>]+charset/i.test(html);
  R('MT-10', p.url, vp && cs, 'minor', `viewport=${vp} charset=${cs}`);
}
// post-only meta
for (const p of posts) {
  const html = p.html;
  const fm = srcPosts[p.slug] || {};
  // MT-04 author
  const author = metaName(html, 'author');
  R('MT-04', p.url, !!author, 'major', `author=${author}`);
  // MT-05 article:tag
  const tags = allMetaProp(html, 'article:tag');
  const fmTags = fm.tags || [];
  const ok05 = fmTags.length === 0 ? true : (tags.length === fmTags.length && tags.every((t, i) => t === fmTags[i]));
  R('MT-05', p.url, ok05, 'major', `meta=[${tags.join(',')}] fm=[${fmTags.join(',')}]`);
  // MT-06 article time
  const pub = metaProp(html, 'article:published_time');
  const mod = metaProp(html, 'article:modified_time');
  const pubOk = pub && !isNaN(Date.parse(pub));
  let modOk;
  if (fm.updated) modOk = mod && mod.startsWith(String(fm.updated).slice(0, 10));
  else modOk = mod === undefined;
  R('MT-06', p.url, !!pubOk && !!modOk, 'major', `pub=${pub} mod=${mod} updated=${fm.updated || 'none'}`);
}

// ============ Homepage keywording ============
{
  const html = home.html;
  const title = titleText(html) || '';
  R('HP-01', home.url, /MeshCore/i.test(title) && /(blog|analytics)/i.test(title) && title.length <= 60, 'major', `"${title}"`);
  const desc = metaName(html, 'description') || '';
  const segTerms = /(mesh network|off-grid|off grid|emergency|EMCOMM|LoRa)/i;
  R('HP-02', home.url, /MeshCore/i.test(desc) && segTerms.test(desc) && desc.length >= 70 && desc.length <= 160, 'major', `len=${desc.length} "${desc.slice(0,80)}"`);
  const h1s = (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || []);
  const h1text = h1s.map((h) => h.replace(/<[^>]*>/g, '').trim());
  R('HP-03', home.url, h1s.length === 1, 'major', `h1count=${h1s.length} "${h1text[0] || ''}"`);
  // HP-04 heading hierarchy (home)
  const heads = [...home.html.matchAll(/<h([1-6])\b/gi)].map((m) => +m[1]);
  let skip = false;
  for (let i = 1; i < heads.length; i++) if (heads[i] > heads[i - 1] + 1) skip = true;
  R('HP-04', home.url, !skip, 'minor', `levels=${heads.join('')}`);
}

// ============ Tag pages ============
// TG-01: every in-use tag has a page; TG-04 tag badges are links
const publishedSlugs = new Set(posts.map((p) => p.slug));
// tags actually in use by PUBLISHED (built) posts
const usedTags = new Set();
for (const p of posts) {
  const fm = srcPosts[p.slug] || {};
  for (const t of fm.tags || []) usedTags.add(t.toLowerCase().replace(/\s+/g, '-'));
}
const builtTagSlugs = new Set(tagPages.map((t) => t.slug));
{
  const missing = [...usedTags].filter((t) => !builtTagSlugs.has(t));
  R('TG-01', home.url, missing.length === 0, 'major', missing.length ? `missing tag pages: ${missing.join(',')}` : `all ${usedTags.size} tags have pages`);
}
for (const t of tagPages) {
  const title = titleText(t.html) || '';
  const desc = metaName(t.html, 'description') || '';
  R('TG-03', t.url, /^Posts tagged/.test(title) && /Waev Blog$/.test(title) && /MeshCore/i.test(desc), 'major', `"${title}" descHasMeshCore=${/MeshCore/i.test(desc)}`);
  const noindex = /<meta[^>]+name="robots"[^>]*noindex/i.test(t.html);
  R('TG-05', t.url, !noindex, 'minor', `noindex=${noindex}`);
  // TG-02 lists exactly its posts
  const linked = new Set([...t.html.matchAll(/href="\/blog\/([^"/]+)\//g)].map((m) => m[1]));
  const expected = posts.filter((p) => (srcPosts[p.slug] || {}).tags?.some((x) => x.toLowerCase().replace(/\s+/g, '-') === t.slug)).map((p) => p.slug);
  const missing = expected.filter((s) => !linked.has(s));
  R('TG-02', t.url, missing.length === 0 && expected.length > 0, 'major', `expected=${expected.length} missingLinks=${missing.join(',') || 'none'}`);
}
// TG-04 tag badges are links on index + posts
for (const p of [home, ...posts]) {
  const spanTags = /<span class="tag">/i.test(p.html);
  R('TG-04', p.url, !spanTags, 'major', spanTags ? 'bare <span class="tag"> present' : 'tag badges are links');
}

// ============ Internal linking ============
for (const p of posts) {
  // IL-01 related block
  const relLinks = [...p.html.matchAll(/class="related-link"[^>]*href="\/blog\/([^"/]+)\//g)].map((m) => m[1]);
  const relCount = new Set(relLinks.filter((s) => s !== p.slug)).size;
  // fallback: any related-posts anchors
  let relCount2 = relCount;
  if (relCount2 === 0) {
    const region = (p.html.match(/class="related-posts"[\s\S]*?<\/(section|div|aside)>/i) || [''])[0];
    relCount2 = new Set([...region.matchAll(/href="\/blog\/([^"/]+)\//g)].map((m) => m[1]).filter((s) => s !== p.slug)).size;
  }
  R('IL-01', p.url, relCount2 >= 2 && relCount2 <= 4, 'major', `related=${relCount2}`);
  // IL-02 inline cross-links inside .prose
  const prose = proseRegion(p.html);
  const inline = new Set([...prose.matchAll(/href="\/blog\/([^"/]+)\/?(?:[#?][^"]*)?"/g)].map((m) => m[1]).filter((s) => s !== p.slug));
  R('IL-02', p.url, inline.size >= 2, 'major', `distinctInline=${inline.size} [${[...inline].join(',')}]`);
}
// IL-03 broken internal links (crawl every page)
let il03bad = [];
let il03scheduled = [];
for (const p of pages) {
  for (const a of allAnchors(p.html)) {
    const href = a.href;
    if (!href.startsWith('/')) continue; // internal only
    if (href.startsWith('//')) continue; // protocol-relative external
    if (resolvesInternal(href)) continue;
    // carve-out: /blog/<slug>/ where slug exists in source (scheduled/future)
    const mm = href.match(/^\/blog\/([^/]+)\/?$/);
    if (mm && srcSlugSet.has(mm[1])) { il03scheduled.push({ page: p.url, href }); continue; }
    il03bad.push({ page: p.url, href });
  }
}
R('IL-03', SITE + '/', il03bad.length === 0, 'blocker', il03bad.length ? `broken: ${il03bad.slice(0,10).map((x) => x.href).join(', ')}` : `0 broken (${il03scheduled.length} scheduled forward-refs carved out)`);

// IL-04 orphan posts: in-degree >=1 from other pages
const indeg = {};
for (const p of posts) indeg[p.slug] = 0;
for (const p of pages) {
  const targets = new Set([...p.html.matchAll(/href="\/blog\/([^"/]+)\//g)].map((m) => m[1]));
  for (const s of targets) if (s in indeg && s !== p.slug) indeg[s]++;
}
const orphans = Object.keys(indeg).filter((s) => indeg[s] === 0);
R('IL-04', SITE + '/', orphans.length === 0, 'major', orphans.length ? `orphans: ${orphans.join(',')}` : 'no orphans');

// IL-05 descriptive anchors (inline internal)
let il05bad = [];
for (const p of posts) {
  const prose = proseRegion(p.html);
  for (const a of allAnchors(prose)) {
    if (!a.href.startsWith('/blog/')) continue;
    const t = a.text.toLowerCase();
    if (t === 'click here' || t === 'read more' || /^https?:\/\//.test(a.text)) il05bad.push({ page: p.url, text: a.text });
  }
}
R('IL-05', SITE + '/', il05bad.length === 0, 'minor', il05bad.length ? `bad anchors: ${il05bad.slice(0,5).map((x) => x.text).join('|')}` : 'all descriptive');

// ============ Sitemap & llms.txt ============
const sitemapIdx = exists(path.join(DIST, 'sitemap-index.xml')) ? read(path.join(DIST, 'sitemap-index.xml')) : '';
let sitemapUrls = [];
{
  const childRe = /<loc>([^<]+sitemap[^<]*\.xml)<\/loc>/g;
  let m;
  const children = [];
  while ((m = childRe.exec(sitemapIdx))) children.push(m[1]);
  for (const c of children) {
    const cp = path.join(DIST, c.replace(SITE, '').replace(/^\//, ''));
    if (exists(cp)) {
      const x = read(cp);
      sitemapUrls.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
  }
}
const sitemapSet = new Set(sitemapUrls.map(normSlashUrl));
// expected public URLs: home + posts + tags + about pages
const publicPages = pages.filter((p) => p.kind !== 'other');
{
  const missing = publicPages.filter((p) => !sitemapSet.has(p.url));
  // sitemap must not contain drafts/future — check no extra blog urls beyond built
  const builtUrls = new Set(publicPages.map((p) => p.url));
  const extra = [...sitemapSet].filter((u) => /\/blog\//.test(u) && !builtUrls.has(u));
  R('SM-01', SITE + '/', missing.length === 0 && extra.length === 0, 'blocker', `sitemapCount=${sitemapSet.size} missing=${missing.length} extraBlog=${extra.length}`);
}
// SM-02 sitemap urls match canonicals
{
  let mismatch = 0, ex = '';
  for (const p of publicPages) {
    if (sitemapSet.has(p.url)) {
      const can = canonical(p.html);
      if (can && normSlashUrl(can) !== p.url) { mismatch++; ex = ex || `${p.url} != ${can}`; }
    }
  }
  R('SM-02', SITE + '/', mismatch === 0, 'major', mismatch ? ex : 'canonicals match sitemap');
}
// SM-03 llms.txt lists published posts (same set, newest first)
const llms = exists(path.join(DIST, 'llms.txt')) ? read(path.join(DIST, 'llms.txt')) : '';
{
  const listSlugs = [...llms.matchAll(/\]\((https?:\/\/[^)]*?\/blog\/([^/)]+)\/)\)/g)].map((m) => m[2]);
  const set = new Set(listSlugs);
  const missing = posts.filter((p) => !set.has(p.slug)).map((p) => p.slug);
  const extra = listSlugs.filter((s) => !publishedSlugs.has(s));
  R('SM-03', SITE + '/llms.txt', missing.length === 0 && extra.length === 0, 'major', `llmsPosts=${listSlugs.length} missing=${missing.join(',') || 'none'} extra=${extra.join(',') || 'none'}`);
}
// SM-04 key facts substrings
{
  const need = [
    '⛔ 🛑 🚫', 'never stored, mapped, or counted', 'identity-scrubbed at the ingest edge',
    'enrolled observers', 'authenticated repeaters', 'Spoofed or inferred prefixes are rejected',
    'publish-only', 'read API is public', 'admin@waev.app',
  ];
  const missing = need.filter((s) => !llms.includes(s));
  R('SM-04', SITE + '/llms.txt', missing.length === 0, 'blocker', missing.length ? `MISSING: ${missing.join(' | ')}` : 'all canon substrings present');
}
// SM-05 RSS
{
  const rss = exists(path.join(DIST, 'rss.xml')) ? read(path.join(DIST, 'rss.xml')) : '';
  const items = [...rss.matchAll(/<item>/g)].length;
  const wellFormed = /<rss[\s>]/.test(rss) && /<\/rss>/.test(rss);
  R('SM-05', SITE + '/rss.xml', wellFormed && items > 0, 'minor', `items=${items} wellFormed=${wellFormed}`);
}
// SM-06 robots
{
  const rp = path.join(DIST, 'robots.txt');
  if (!exists(rp)) R('SM-06', SITE + '/robots.txt', true, 'minor', 'absent (acceptable)');
  else {
    const r = read(rp);
    const disallowAll = /Disallow:\s*\/\s*$/m.test(r);
    const refsSitemap = /sitemap-index\.xml/i.test(r);
    R('SM-06', SITE + '/robots.txt', !disallowAll && refsSitemap, 'minor', `disallowAll=${disallowAll} refsSitemap=${refsSitemap}`);
  }
}

// ---------- output ----------
const summary = {};
for (const r of results) {
  const s = (summary[r.id] = summary[r.id] || { severity: r.severity, pass: 0, fail: 0, fails: [] });
  if (r.pass === true) s.pass++;
  else if (r.pass === false) { s.fail++; s.fails.push({ url: r.url, evidence: r.evidence }); }
}
const out = { counts: { posts: posts.length, tagPages: tagPages.length, pages: pages.length }, summary, results, il03: { bad: il03bad, scheduled: il03scheduled }, orphans };
fs.writeFileSync(path.join(ROOT, 'scripts', 'seo-sweep-out.json'), JSON.stringify(out, null, 2));

// console summary
console.log(`posts=${posts.length} tagPages=${tagPages.length} pages=${pages.length}`);
const ids = Object.keys(summary).sort();
for (const id of ids) {
  const s = summary[id];
  const flag = s.fail > 0 ? ' <-- FAIL' : '';
  console.log(`${id}\t${s.severity}\tPASS ${s.pass}\tFAIL ${s.fail}${flag}`);
  if (s.fail > 0) for (const f of s.fails.slice(0, 8)) console.log(`    - ${f.url}  ::  ${f.evidence}`);
}
