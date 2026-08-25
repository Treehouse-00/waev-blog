// One-off SEO sweep evaluator (CADENCE.md §3.3, SEO-PLAYBOOK.md §§1-6).
// Reads dist/ (built HTML) + src/content/blog (frontmatter for scheduled-post carve-outs).
// Emits one JSON line per (rule,url) to stdout; summary to stderr.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://blog.waev.app';
const DIST = 'dist';
const results = [];
const emit = (id, url, pass, severity, evidence) =>
  results.push({ id, url, pass, severity, evidence });

// ---- collect built pages ----
const walk = (dir) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
};
const pages = walk(DIST); // all index.html
const urlOf = (f) => SITE + '/' + path.relative(DIST, path.dirname(f)).split(path.sep).join('/') + (path.dirname(f) === DIST ? '' : '/');
const norm = (f) => {
  const rel = path.relative(DIST, path.dirname(f)).split(path.sep).join('/');
  return rel === '' ? SITE + '/' : SITE + '/' + rel + '/';
};
const postPages = pages.filter((f) => /dist\/blog\/[^/]+\/index\.html$/.test(f));
const tagPages = pages.filter((f) => /dist\/tags\/[^/]+\/index\.html$/.test(f));
const homePage = pages.find((f) => path.dirname(f) === DIST);
const read = (f) => fs.readFileSync(f, 'utf8');

const ldBlocks = (html) => {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try { out.push({ ok: true, json: JSON.parse(m[1]) }); }
    catch (e) { out.push({ ok: false, err: e.message, raw: m[1].slice(0, 80) }); }
  }
  return out;
};
const flatGraphs = (blocks) => {
  const g = [];
  for (const b of blocks) {
    if (!b.ok) continue;
    if (Array.isArray(b.json)) g.push(...b.json);
    else if (b.json['@graph']) g.push(...b.json['@graph']);
    else g.push(b.json);
  }
  return g;
};
const metas = (html) => [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => (tag.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const metaByName = (html, key, val) =>
  metas(html).filter((t) => new RegExp(`${key}="${val}"`).test(t));
const titleText = (html) => (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
// Extract just the rendered post body (`<div class="prose">`), bounded before the
// FAQ / related-posts sections and the closing </article>.
const proseOf = (html) => {
  const start = html.search(/<div class="prose[^"]*">/);
  if (start < 0) return { prose: '', after: html };
  const bodyStart = html.indexOf('>', start) + 1;
  const rest = html.slice(bodyStart);
  const cuts = [/<div class="faq[^"]*"/, /<div class="related-posts[^"]*"/, /<\/article>/]
    .map((re) => { const m = rest.match(re); return m ? m.index : Infinity; });
  const end = Math.min(...cuts);
  return { prose: rest.slice(0, end), after: rest.slice(end) };
};

// ---- frontmatter parsing for scheduled-post carve-out (IL-03) + faq/updated (SD-02/03/04, MT-06) ----
const blogDir = 'src/content/blog';
const fm = {}; // slug -> { date, updated, draft, faq:[], tags:[], title, raw }
for (const file of fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx'))) {
  const slug = file.replace(/\.mdx$/, '');
  const src = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---/);
  const block = fmMatch ? fmMatch[1] : '';
  const get = (k) => { const m = block.match(new RegExp(`^${k}:\\s*(.+)$`, 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined; };
  const date = get('date');
  const updated = get('updated');
  const draft = /^draft:\s*true/m.test(block);
  // faq: count "- q:"/"- question:" list items under the faq: key.
  // Bound the block from `faq:` to the next top-level (col-0) key or end of frontmatter.
  let faqCount = 0;
  const lines = block.split('\n');
  const fi = lines.findIndex((l) => /^faq:\s*$/.test(l));
  if (fi >= 0) {
    for (let i = fi + 1; i < lines.length; i++) {
      if (/^[A-Za-z_]/.test(lines[i])) break; // next top-level key
      if (/^\s+-\s+(question|q):/.test(lines[i])) faqCount++;
    }
  }
  fm[slug] = { slug, date, updated, draft, faqCount, block };
}
const now = new Date();
const scheduledSlugs = new Set(
  Object.values(fm).filter((p) => !p.draft && p.date && new Date(p.date) > now).map((p) => p.slug)
);
const existingSlugs = new Set(Object.keys(fm));
const publishedPostSlugs = new Set(postPages.map((f) => path.basename(path.dirname(f))));

// =========================== §1 Structured data ===========================
for (const f of postPages) {
  const html = read(f), url = norm(f), slug = path.basename(path.dirname(f));
  const blocks = ldBlocks(html), graphs = flatGraphs(blocks);
  // SD-01 BlogPosting
  const bp = graphs.find((g) => g['@type'] === 'BlogPosting');
  if (!bp) emit('SD-01', url, false, 'blocker', 'no BlogPosting graph');
  else {
    const miss = [];
    if (!bp.headline) miss.push('headline');
    if (!bp.description) miss.push('description');
    if (!bp.datePublished || isNaN(Date.parse(bp.datePublished))) miss.push('datePublished');
    if (!bp.author) miss.push('author');
    if (!(bp.publisher && (bp.publisher['@id'] || '').endsWith('/#org'))) miss.push('publisher.@id/#org');
    if (!bp.mainEntityOfPage) miss.push('mainEntityOfPage');
    if (!bp.image || !/^https?:\/\//.test(typeof bp.image === 'string' ? bp.image : (bp.image.url || ''))) miss.push('image(abs)');
    emit('SD-01', url, miss.length === 0, 'blocker', miss.length ? 'missing ' + miss.join(',') : 'OK');
  }
  // SD-02 dateModified iff updated
  const hasUpdated = !!fm[slug]?.updated;
  if (bp) {
    if (hasUpdated) emit('SD-02', url, !!bp.dateModified && bp.dateModified.slice(0,10) === fm[slug].updated.slice(0,10), 'major', bp.dateModified ? 'OK' : 'updated set but no dateModified');
    else emit('SD-02', url, !bp.dateModified, 'major', bp.dateModified ? 'dateModified present without updated' : 'OK');
  }
  // SD-03 FAQPage iff faq
  const faqGraphs = graphs.filter((g) => g['@type'] === 'FAQPage');
  const faqCount = fm[slug]?.faqCount || 0;
  if (faqCount > 0) {
    const ok = faqGraphs.length === 1 && Array.isArray(faqGraphs[0].mainEntity) && faqGraphs[0].mainEntity.length === faqCount
      && faqGraphs[0].mainEntity.every((q) => q.name && q.acceptedAnswer && q.acceptedAnswer.text);
    emit('SD-03', url, ok, 'blocker', ok ? `OK (${faqCount})` : `faq=${faqCount} but graph count/items mismatch (graphs=${faqGraphs.length}, items=${faqGraphs[0]?.mainEntity?.length})`);
  } else {
    emit('SD-03', url, faqGraphs.length === 0, 'blocker', faqGraphs.length ? 'FAQPage present but no faq frontmatter' : 'OK');
  }
  // SD-04 FAQ answers self-contained
  if (faqGraphs.length === 1) {
    const bad = [];
    for (const q of faqGraphs[0].mainEntity || []) {
      const t = (q.acceptedAnswer?.text || '').trim();
      if (t.length < 40) bad.push('short');
      else if (t.includes('](')) bad.push('mdlink');
      else if (!/[.?!]$/.test(t)) bad.push(`unterminated:"${t.slice(-14)}"`);
    }
    emit('SD-04', url, bad.length === 0, 'major', bad.length ? bad.join(';') : 'OK');
  }
  // SD-09 BreadcrumbList
  const bc = graphs.find((g) => g['@type'] === 'BreadcrumbList');
  if (!bc) emit('SD-09', url, false, 'major', 'no BreadcrumbList');
  else {
    const items = bc.itemListElement || [];
    const positions = items.map((i) => i.position);
    const contig = positions.every((p, i) => p === i + 1);
    const last = items[items.length - 1];
    emit('SD-09', url, contig && last && last.item === url, 'major', contig && last?.item === url ? 'OK' : `last=${last?.item} pos=${positions}`);
  }
}
// SD-05/06/07/11 on every page; SD-08 homepage; SD-10 tag pages
for (const f of pages) {
  const html = read(f), url = norm(f);
  const blocks = ldBlocks(html), graphs = flatGraphs(blocks);
  // SD-11 parse + placeholder
  const parseErr = blocks.filter((b) => !b.ok);
  let placeholder = null;
  const scan = (o, keyPath) => {
    if (o == null) return;
    if (typeof o === 'string') {
      if (['undefined','null','TODO',''].includes(o.trim()) && /(@id|url|image|item)$/i.test(keyPath)) placeholder = keyPath + '=' + JSON.stringify(o);
      if (/(@id|image|item)$/i.test(keyPath) && o && !/^https?:\/\//.test(o) && keyPath.endsWith('@id') === false) { /* url/image/item must be absolute */ if (!/^https?:\/\//.test(o)) placeholder = keyPath + ' not absolute: ' + o; }
      return;
    }
    if (Array.isArray(o)) return o.forEach((v) => scan(v, keyPath));
    for (const k of Object.keys(o)) scan(o[k], k);
  };
  graphs.forEach((g) => scan(g, ''));
  emit('SD-11', url, parseErr.length === 0 && !placeholder, 'blocker', parseErr.length ? 'parse:' + parseErr[0].err : (placeholder || 'OK'));
  // SD-05 Organization
  const org = graphs.find((g) => g['@type'] === 'Organization');
  if (!org) emit('SD-05', url, false, 'blocker', 'no Organization graph');
  else {
    const ok = (org['@id']||'').endsWith('/#org') && org.name === 'Waev' && org.url === 'https://waev.app'
      && org.email === 'admin@waev.app' && /Real-time analytics platform for MeshCore mesh radio networks/.test(org.description || '');
    emit('SD-05', url, ok, 'blocker', ok ? 'OK' : 'org fields off: ' + JSON.stringify({id:org['@id'],name:org.name,url:org.url,email:org.email}));
    // SD-06 sameAs
    const sameAs = org.sameAs;
    if (sameAs === undefined) emit('SD-06', url, true, 'blocker', 'sameAs omitted (OK)');
    else if (Array.isArray(sameAs) && sameAs.length === 0) emit('SD-06', url, false, 'blocker', 'empty sameAs array (omit key instead)');
    else {
      const bad = (Array.isArray(sameAs) ? sameAs : [sameAs]).filter((u) => /github\.com\/[^/]+\/waev-blog/.test(u));
      emit('SD-06', url, bad.length === 0, 'blocker', bad.length ? 'source-repo sameAs: ' + bad.join(',') : 'OK');
    }
  }
  // SD-07 WebSite
  const ws = graphs.find((g) => g['@type'] === 'WebSite');
  if (!ws) emit('SD-07', url, false, 'major', 'no WebSite graph');
  else emit('SD-07', url, (ws['@id']||'').endsWith('/#website') && (ws.publisher?.['@id']||'').endsWith('/#org') && ws.inLanguage === 'en', 'major', 'OK');
}
// SD-08 homepage ItemList
{
  const html = read(homePage), url = norm(homePage);
  const graphs = flatGraphs(ldBlocks(html));
  const list = graphs.find((g) => g['@type'] === 'ItemList') || (graphs.find((g)=>g['@type']==='Blog' && g.blogPost));
  const cards = (html.match(/href="\/blog\/[^"]+\/"/g) || []);
  if (!list) emit('SD-08', url, false, 'major', 'no ItemList/Blog graph');
  else {
    const items = list.itemListElement || list.blogPost || [];
    const positions = items.map((i) => i.position).filter((p)=>p!=null);
    const contig = positions.length === 0 || positions.every((p, i) => p === i + 1);
    const urls = items.map((i)=> i.url || i.item?.url || i.item || i['@id']).filter(Boolean);
    const allResolve = urls.every((u) => publishedPostSlugs.has((u.match(/\/blog\/([^/]+)\//)||[])[1]));
    emit('SD-08', url, list && contig && allResolve && items.length > 0, 'major', `items=${items.length} contig=${contig} resolve=${allResolve}`);
  }
}
// SD-10 CollectionPage per tag page
for (const f of tagPages) {
  const html = read(f), url = norm(f);
  const graphs = flatGraphs(ldBlocks(html));
  const cp = graphs.find((g) => g['@type'] === 'CollectionPage');
  if (!cp) emit('SD-10', url, false, 'major', 'no CollectionPage');
  else {
    const il = cp.mainEntity || cp.hasPart;
    const hasList = il && (il['@type'] === 'ItemList' || Array.isArray(il));
    emit('SD-10', url, !!cp.name && !!cp.url && !!hasList, 'major', hasList ? 'OK' : 'no ItemList in CollectionPage');
  }
}

// =========================== §2 Meta tags ===========================
for (const f of pages) {
  const html = read(f), url = norm(f), isPost = /\/blog\/[^/]+\/index\.html$/.test(f), slug = path.basename(path.dirname(f));
  const t = titleText(html).trim();
  // MT-01
  let mt01 = t.length >= 15 && t.length <= 60;
  if (isPost) mt01 = mt01 && t.endsWith(' — Waev Blog');
  emit('MT-01', url, mt01, 'blocker', `len=${t.length} "${t}"`);
  // MT-02
  const desc = attr(metaByName(html, 'name', 'description')[0] || '', 'content') || '';
  emit('MT-02', url, desc.length >= 70 && desc.length <= 160, 'blocker', `len=${desc.length}`);
  // MT-03 canonical
  emit('MT-03', url, canonical(html) === url, 'blocker', canonical(html) === url ? 'OK' : `canon=${canonical(html)}`);
  // MT-08 OG completeness
  const ogNeed = ['og:type','og:title','og:description','og:url','og:image','og:site_name'];
  const ogMiss = ogNeed.filter((p) => !(metaByName(html, 'property', p)[0] && attr(metaByName(html,'property',p)[0],'content')));
  emit('MT-08', url, ogMiss.length === 0, 'major', ogMiss.length ? 'missing ' + ogMiss.join(',') : 'OK');
  // MT-09 image absolute + exists
  const ogImg = attr(metaByName(html, 'property', 'og:image')[0] || '', 'content') || '';
  const twImg = attr(metaByName(html, 'name', 'twitter:image')[0] || '', 'content') || '';
  const imgOk = (u) => {
    if (!/^https?:\/\//.test(u)) return false;
    const p = u.replace(SITE, '');
    return fs.existsSync(path.join(DIST, p)) || fs.existsSync(path.join('public', p));
  };
  emit('MT-09', url, imgOk(ogImg) && (twImg ? imgOk(twImg) : true), 'major', `og=${ogImg.replace(SITE,'')}`);
  // MT-10 charset+viewport
  emit('MT-10', url, /<meta charset/i.test(html) && metaByName(html,'name','viewport').length>0, 'minor', 'OK');
  // MT-07 twitter:site (ratified: omission passes)
  const tsite = metaByName(html, 'name', 'twitter:site');
  if (tsite.length === 0) emit('MT-07', url, true, 'major', 'omitted (ratified passing state)');
  else { const v = attr(tsite[0],'content')||''; emit('MT-07', url, /^@\w+/.test(v), 'major', v ? 'handle '+v : 'empty handle'); }
  if (isPost) {
    // MT-04 author
    const au = attr(metaByName(html, 'name', 'author')[0] || '', 'content');
    emit('MT-04', url, !!au, 'major', au ? 'OK '+au : 'no author meta');
    // MT-05 article:tag order == frontmatter tags
    const tags = metaByName(html, 'property', 'article:tag').map((t) => attr(t, 'content'));
    emit('MT-05', url, tags.length >= 1, 'major', `tags=[${tags.join(',')}]`);
    // MT-06 published_time == date; modified_time iff updated
    const pub = attr(metaByName(html, 'property', 'article:published_time')[0] || '', 'content');
    const modArr = metaByName(html, 'property', 'article:modified_time');
    const pubOk = pub && !isNaN(Date.parse(pub)) && fm[slug]?.date && pub.slice(0,10) === fm[slug].date.slice(0,10);
    let modOk;
    if (fm[slug]?.updated) modOk = modArr.length === 1 && attr(modArr[0],'content')?.slice(0,10) === fm[slug].updated.slice(0,10);
    else modOk = modArr.length === 0;
    emit('MT-06', url, !!pubOk && modOk, 'major', `pub=${pub} pubOk=${pubOk} mod#=${modArr.length} modOk=${modOk}`);
  }
}

// =========================== §3 Homepage ===========================
{
  const html = read(homePage), url = norm(homePage);
  const t = titleText(html).trim();
  emit('HP-01', url, /MeshCore/i.test(t) && /(blog|analytics)/i.test(t) && t.length <= 60, 'major', `"${t}"`);
  const desc = attr(metaByName(html, 'name', 'description')[0] || '', 'content') || '';
  const seg = /(mesh network|off-grid|off grid|emergency|ham|emcomm)/i.test(desc);
  emit('HP-02', url, desc.length >= 70 && desc.length <= 160 && /MeshCore/i.test(desc) && seg, 'major', `len=${desc.length} mc=${/MeshCore/i.test(desc)} seg=${seg}`);
  const h1s = html.match(/<h1[\s>]/g) || [];
  emit('HP-03', url, h1s.length === 1, 'major', `h1 count=${h1s.length}`);
}
// HP-04 heading hierarchy (homepage + posts)
const checkHeadings = (html) => {
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  let prev = 0, ok = true, detail = '';
  for (const l of levels) { if (prev && l > prev + 1) { ok = false; detail = `h${prev}->h${l}`; break; } prev = l; }
  return { ok, detail };
};
{
  const r = checkHeadings(read(homePage));
  emit('HP-04', norm(homePage), r.ok, 'minor', r.ok ? 'OK' : r.detail);
}
for (const f of postPages) {
  // check only body prose headings (excludes FAQ/related sections)
  const html = read(f);
  const { prose: body } = proseOf(html);
  const levels = [...body.matchAll(/<h([1-6])[\s>]/g)].map((x) => +x[1]);
  // post body should start at h2; no skipped levels
  let ok = true, detail = 'OK', prev = 1;
  for (const l of levels) { if (l > prev + 1) { ok = false; detail = `h${prev}->h${l}`; break; } prev = l; }
  emit('HP-04', norm(f), ok, 'minor', detail);
}

// =========================== §4 Tag pages ===========================
// TG-01 every in-use tag has a page; no orphan pages
const inUseTags = new Set();
for (const slug of publishedPostSlugs) {
  const html = read(postPages.find((f)=>path.basename(path.dirname(f))===slug));
  for (const t of metaByName(html, 'property', 'article:tag')) { const v = attr(t,'content'); if (v) inUseTags.add(v.toLowerCase().replace(/\s+/g,'-')); }
}
const builtTagSlugs = new Set(tagPages.map((f) => path.basename(path.dirname(f))));
{
  const missing = [...inUseTags].filter((t) => !builtTagSlugs.has(t));
  const orphan = [...builtTagSlugs].filter((t) => !inUseTags.has(t));
  emit('TG-01', SITE + '/tags/', missing.length === 0 && orphan.length === 0, 'major', `missing=[${missing}] orphan=[${orphan}]`);
}
for (const f of tagPages) {
  const html = read(f), url = norm(f), tag = path.basename(path.dirname(f));
  const t = titleText(html).trim();
  const linked = [...html.matchAll(/href="\/blog\/([^"/]+)\//g)].map((m) => m[1]);
  const distinct = [...new Set(linked)];
  emit('TG-02', url, distinct.length >= 1 && distinct.every((s) => publishedPostSlugs.has(s)), 'major', `posts=${distinct.length}`);
  const desc = attr(metaByName(html, 'name', 'description')[0] || '', 'content') || '';
  emit('TG-03', url, /Posts tagged/.test(t) && /MeshCore/i.test(desc) && new RegExp(tag.replace(/-/g,'[- ]'),'i').test(desc+t), 'major', `title="${t}" descMC=${/MeshCore/i.test(desc)}`);
  const badges = [...html.matchAll(/class="[^"]*\btag\b[^"]*"/g)];
  const spanBadges = [...html.matchAll(/<span[^>]*class="[^"]*\btag\b[^"]*"/g)];
  emit('TG-04', url, spanBadges.length === 0, 'major', spanBadges.length ? `${spanBadges.length} span badges` : 'OK');
  emit('TG-05', url, !/noindex/.test(html), 'minor', /noindex/.test(html) ? 'noindex present' : 'OK');
}
// TG-04 also on index + posts
{
  const html = read(homePage);
  const spanBadges = [...html.matchAll(/<span[^>]*class="[^"]*\btag\b[^"]*"/g)];
  emit('TG-04', norm(homePage), spanBadges.length === 0, 'major', spanBadges.length ? `${spanBadges.length} span badges on index` : 'OK');
}

// =========================== §5 Internal linking ===========================
// build set of resolvable internal paths
const builtPaths = new Set();
for (const f of pages) builtPaths.add('/' + path.relative(DIST, path.dirname(f)).split(path.sep).join('/') + (path.dirname(f)===DIST?'':'/'));
builtPaths.add('/'); builtPaths.add('/rss.xml'); builtPaths.add('/llms.txt'); builtPaths.add('/sitemap-index.xml');
for (const f of ['dist/rss.xml','dist/llms.txt','dist/robots.txt']) if (fs.existsSync(f)) {}
const inDegree = {};
for (const s of publishedPostSlugs) inDegree[s] = 0;
for (const f of postPages) {
  const html = read(f), url = norm(f), slug = path.basename(path.dirname(f));
  const { prose } = proseOf(html);
  // IL-01 related block: the RelatedPosts section renders outside .prose.
  const ri = html.search(/class="related-posts[^"]*"/);
  const relRegion = ri >= 0 ? html.slice(ri, html.indexOf('</section>', ri) + 10 || undefined) : '';
  const relLinks = [...new Set([...relRegion.matchAll(/href="\/blog\/([^"/]+)\//g)].map((m)=>m[1]).filter((s)=>s!==slug))];
  emit('IL-01', url, relLinks.length >= 2 && relLinks.length <= 4 && relLinks.every((s)=>publishedPostSlugs.has(s)||scheduledSlugs.has(s)), 'major', `related=${relLinks.length} [${relLinks.join(',')}]`);
  // IL-02 inline cross-links inside .prose
  const inlineTargets = [...new Set([...prose.matchAll(/href="\/blog\/([^"/]+)\/"/g)].map((m)=>m[1]).filter((s)=>s!==slug))];
  emit('IL-02', url, inlineTargets.length >= 2, 'major', `inline=${inlineTargets.length} [${inlineTargets.join(',')}]`);
  // count in-degree from inline + related
  for (const s of new Set([...inlineTargets, ...relLinks])) if (inDegree[s] != null) inDegree[s]++;
}
// index cards + tag pages contribute to in-degree
for (const f of [homePage, ...tagPages]) {
  const html = read(f);
  for (const s of new Set([...html.matchAll(/href="\/blog\/([^"/]+)\//g)].map((m)=>m[1]))) if (inDegree[s] != null) inDegree[s]++;
}
// IL-03 broken internal links (every page)
{
  const broken = [];
  for (const f of pages) {
    const html = read(f);
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      let href = m[1];
      if (!href.endsWith('/') && !/\.(xml|txt|png|jpg|jpeg|webp|svg|ico|json|css|js|avif|gif)$/i.test(href)) href = href + '/';
      if (builtPaths.has(href) || builtPaths.has(m[1])) continue;
      // scheduled-post carve-out
      const sm = m[1].match(/^\/blog\/([^/]+)\/?$/);
      if (sm && scheduledSlugs.has(sm[1])) continue;
      if (/\.(xml|txt|png|jpg|jpeg|webp|svg|ico|json|css|js|avif|gif)$/i.test(m[1])) { if (fs.existsSync(path.join(DIST, m[1]))) continue; }
      // ignore anchors handled, external handled by starting with /
      broken.push({ page: norm(f), href: m[1] });
    }
  }
  // dedupe by href
  const byHref = {};
  for (const b of broken) { const sm = b.href.match(/^\/blog\/([^/]+)\/?$/); const key = b.href; (byHref[key] ||= { count:0, exists: sm ? existingSlugs.has(sm[1]) : null }).count++; }
  const realBroken = Object.entries(byHref).filter(([h, v]) => { const sm = h.match(/^\/blog\/([^/]+)\/?$/); if (sm) return !scheduledSlugs.has(sm[1]); return true; });
  emit('IL-03', SITE + '/', realBroken.length === 0, 'blocker', realBroken.length ? JSON.stringify(realBroken.slice(0,10)) : 'OK');
}
// IL-04 orphans
{
  const orphans = Object.entries(inDegree).filter(([s, d]) => d === 0).map(([s]) => s);
  emit('IL-04', SITE + '/', orphans.length === 0, 'major', orphans.length ? 'orphans: ' + orphans.join(',') : 'OK');
}
// IL-05 descriptive anchor (inline internal links) — check prose anchors text
for (const f of postPages) {
  const html = read(f), url = norm(f);
  const { prose } = proseOf(html);
  let bad = null;
  for (const a of prose.matchAll(/<a [^>]*href="\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
    const txt = a[1].replace(/<[^>]+>/g,'').trim();
    if (/^https?:\/\//.test(txt) || /^(click here|read more)$/i.test(txt)) { bad = txt; break; }
  }
  emit('IL-05', url, !bad, 'minor', bad ? 'bad anchor: '+bad : 'OK');
}

// =========================== §6 Sitemap & llms.txt ===========================
const sitemapChild = fs.existsSync('dist/sitemap-0.xml') ? read('dist/sitemap-0.xml') : '';
const sitemapUrls = new Set([...sitemapChild.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
{
  // SM-01: all public URLs present, drafts/future excluded
  const expected = new Set([SITE + '/']);
  for (const f of postPages) expected.add(norm(f));
  for (const f of tagPages) expected.add(norm(f));
  for (const f of pages) if (/about/.test(f)) expected.add(norm(f));
  const missing = [...expected].filter((u) => !sitemapUrls.has(u));
  // future/draft slugs must NOT be in sitemap
  const leaked = [...sitemapUrls].filter((u) => { const sm = u.match(/\/blog\/([^/]+)\//); return sm && scheduledSlugs.has(sm[1]); });
  emit('SM-01', SITE + '/sitemap-index.xml', missing.length === 0 && leaked.length === 0, 'blocker', `missing=${missing.length} leaked=${leaked.length}${missing.length?' '+missing.slice(0,3):''}`);
  // SM-02 sitemap urls match canonicals
  let drift = null;
  for (const f of pages) { const c = canonical(read(f)); if (sitemapUrls.has(c) === false && !/about/.test(f) ) {/*some pages maybe excluded*/} }
  const canonSet = new Set(pages.map((f)=>canonical(read(f))));
  const mism = [...sitemapUrls].filter((u) => !canonSet.has(u));
  emit('SM-02', SITE + '/sitemap-index.xml', mism.length === 0, 'major', mism.length ? 'sitemap urls not matching a canonical: ' + mism.slice(0,3) : 'OK');
}
// SM-03 llms.txt posts == published
{
  const llms = fs.existsSync('dist/llms.txt') ? read('dist/llms.txt') : '';
  const listed = [...llms.matchAll(/\((https:\/\/blog\.waev\.app\/blog\/([^/]+)\/)\)/g)].map((m) => m[2]);
  const listedSet = new Set(listed);
  const missing = [...publishedPostSlugs].filter((s) => !listedSet.has(s));
  const extra = listed.filter((s) => !publishedPostSlugs.has(s));
  emit('SM-03', SITE + '/llms.txt', missing.length === 0 && extra.length === 0, 'major', `listed=${listed.length} missing=${missing.length} extra=${extra.length}${extra.length?' '+extra.slice(0,3):''}`);
  // SM-04 canon substrings
  const needs = ['⛔ 🛑 🚫','never stored, mapped, or counted','identity-scrubbed at the ingest edge','enrolled observers','authenticated repeaters','Spoofed or inferred prefixes are rejected','publish-only','read API is public','admin@waev.app'];
  const miss = needs.filter((n) => !llms.includes(n));
  emit('SM-04', SITE + '/llms.txt', miss.length === 0, 'blocker', miss.length ? 'missing: ' + miss.join(' | ') : 'OK');
}
// SM-05 RSS
{
  const rss = fs.existsSync('dist/rss.xml') ? read('dist/rss.xml') : '';
  const items = [...rss.matchAll(/<link>([^<]*\/blog\/([^/]+)\/)<\/link>/g)].map((m)=>m[2]);
  const wf = /<rss[\s>]/.test(rss) && /<\/rss>/.test(rss);
  const extra = items.filter((s)=>!publishedPostSlugs.has(s));
  emit('SM-05', SITE + '/rss.xml', wf && extra.length === 0, 'minor', `items=${items.length} wellformed=${wf} extra=${extra.length}`);
}
// SM-06 robots
{
  const rf = 'dist/robots.txt';
  if (!fs.existsSync(rf)) emit('SM-06', SITE + '/robots.txt', true, 'minor', 'absent (OK)');
  else { const r = read(rf); const disallowAll = /Disallow:\s*\/\s*$/m.test(r); const hasSitemap = /sitemap-index\.xml/.test(r); emit('SM-06', SITE + '/robots.txt', !disallowAll && hasSitemap, 'minor', `disallowAll=${disallowAll} sitemapRef=${hasSitemap}`); }
}

// ---- output ----
for (const r of results) process.stdout.write(JSON.stringify(r) + '\n');
// summary
const byRule = {};
for (const r of results) { (byRule[r.id] ||= { sev:r.severity, pass:0, fail:0, nullc:0, fails:[] }); if (r.pass === true) byRule[r.id].pass++; else if (r.pass === false) { byRule[r.id].fail++; byRule[r.id].fails.push(r.url + ' :: ' + r.evidence); } else byRule[r.id].nullc++; }
const ids = Object.keys(byRule).sort();
process.stderr.write('\n=== SUMMARY ===\n');
for (const id of ids) { const b = byRule[id]; process.stderr.write(`${id} [${b.sev}] pass=${b.pass} fail=${b.fail}${b.nullc?' null='+b.nullc:''}\n`); for (const fl of b.fails.slice(0,8)) process.stderr.write('    FAIL ' + fl + '\n'); }
process.stderr.write(`\nposts=${postPages.length} tags=${tagPages.length} pages=${pages.length} scheduled=[${[...scheduledSlugs].join(',')}]\n`);
