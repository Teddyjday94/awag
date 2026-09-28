import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const pages = [
  { file: 'index.html', path: '/' },
  { file: 'services.html', path: '/services.html' },
  { file: 'gallery.html', path: '/gallery.html' },
  { file: 'about.html', path: '/about.html' },
  { file: 'service-area.html', path: '/service-area.html' },
  { file: 'contact.html', path: '/contact.html' },
];

assert.ok(existsSync(new URL('../seo.config.json', import.meta.url)), 'SEO config should provide one replaceable site URL');
const config = JSON.parse(await readFile(new URL('../seo.config.json', import.meta.url), 'utf8'));
assert.equal(config.siteUrl, 'https://awag-preview.vercel.app', 'SEO config should use the current public site until the real domain is connected');

const pageSources = new Map(await Promise.all(pages.map(async ({ file }) => [
  file,
  await readFile(new URL(file, root), 'utf8'),
])));

for (const { file, path } of pages) {
  const html = pageSources.get(file);
  const canonical = `${config.siteUrl}${path}`;
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];

  assert.equal(h1Count, 1, `${file} should have exactly one h1`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replaceAll('.', '\\.')}">`), `${file} should expose its absolute canonical URL`);
  assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/, `${file} should explicitly allow indexing and large image previews`);
  assert.match(html, /<meta property="og:type" content="website">/, `${file} should provide an Open Graph type`);
  assert.match(html, new RegExp(`<meta property="og:url" content="${canonical.replaceAll('.', '\\.')}">`), `${file} should keep og:url aligned with its canonical URL`);
  assert.match(html, /<meta property="og:title" content="[^"]+">/, `${file} should provide an Open Graph title`);
  assert.match(html, /<meta property="og:description" content="[^"]+">/, `${file} should provide an Open Graph description`);
  assert.match(html, new RegExp(`<meta property="og:image" content="${config.siteUrl.replaceAll('.', '\\.')}\/assets\/images\/[^\"]+">`), `${file} should provide an absolute Open Graph image`);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, `${file} should provide a large Twitter card`);
  assert.match(html, /<meta name="twitter:title" content="[^"]+">/, `${file} should provide a Twitter title`);
  assert.match(html, /<meta name="twitter:description" content="[^"]+">/, `${file} should provide a Twitter description`);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/[^\"]+">/, `${file} should provide an absolute Twitter image`);
  assert.ok(jsonLdBlocks.length >= 1, `${file} should contain JSON-LD structured data`);

  const graph = jsonLdBlocks.flatMap(([, json]) => {
    const data = JSON.parse(json);
    return data['@graph'] ?? [data];
  });
  assert.ok(graph.some((node) => node['@type'] === 'LocalBusiness'), `${file} should identify the local business`);
  assert.ok(graph.some((node) => node['@type'] === 'WebPage' && node.url === canonical), `${file} should identify the canonical webpage`);
}

const homeGraph = JSON.parse(pageSources.get('index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)[1])['@graph'];
assert.ok(homeGraph.some((node) => node['@type'] === 'WebSite'), 'Home should identify the website and preferred site name');

const serviceGraph = JSON.parse(pageSources.get('services.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)[1])['@graph'];
const service = serviceGraph.find((node) => node['@type'] === 'Service');
assert.ok(service, 'Services page should describe the pressure and soft washing service');
assert.equal(service.provider?.['@id'], `${config.siteUrl}/#business`, 'Service schema should reference the local business');
assert.ok(Array.isArray(service.areaServed) && service.areaServed.length >= 4, 'Service schema should describe the primary service area');

const robots = await readFile(new URL('../robots.txt', import.meta.url), 'utf8');
assert.match(robots, /^User-agent: \*$/m, 'robots.txt should address all crawlers');
assert.match(robots, /^Allow: \/$/m, 'robots.txt should allow the public site');
assert.match(robots, new RegExp(`^Sitemap: ${config.siteUrl.replaceAll('.', '\\.')}\/sitemap\\.xml$`, 'm'), 'robots.txt should advertise the canonical sitemap');

const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
for (const { file, path } of pages) {
  assert.match(sitemap, new RegExp(`<loc>${config.siteUrl.replaceAll('.', '\\.')}${path.replaceAll('.', '\\.')}<\/loc>`), `sitemap should include ${file}`);
}
assert.equal([...sitemap.matchAll(/<loc>/g)].length, pages.length, 'sitemap should list each canonical page once');

console.log(`Verified SEO metadata, structured data, and crawl files for ${pages.length} pages.`);
