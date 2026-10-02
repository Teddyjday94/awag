import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const origin = 'https://ascensionwashngeaux.com';
const pages = {
  'index.html': '/',
  'services.html': '/services.html',
  'gallery.html': '/gallery.html',
  'about.html': '/about.html',
  'service-area.html': '/service-area.html',
  'contact.html': '/contact.html',
};
const read = (file) => readFile(new URL(file, root), 'utf8');

const sitemap = await read('sitemap.xml');
for (const [page, path] of Object.entries(pages)) {
  const html = await read(page);
  const url = `${origin}${path}`;
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${page} should declare its canonical URL`);
  assert.ok(html.includes(`<meta property="og:url" content="${url}">`), `${page} should declare og:url`);
  assert.match(html, /<meta property="og:image" content="https:\/\/ascensionwashngeaux\.com\/assets\/images\/[^"]+">/, `${page} should use an absolute og:image`);
  assert.match(html, /<link rel="icon"/, `${page} should declare a favicon`);
  assert.match(html, /<script src="analytics\.js" defer><\/script>/, `${page} should load analytics`);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap should list ${url}`);
}

const home = await read('index.html');
const ld = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert.ok(ld, 'Home should include LocalBusiness structured data');
const business = JSON.parse(ld[1]);
assert.equal(business.telephone, '+1-225-954-1848', 'Structured data phone should match the site');
assert.equal(business.url, `${origin}/`);
assert.ok(home.includes('tel:+12259541848'), 'Home should still list the same phone number');

const robots = await read('robots.txt');
assert.match(robots, new RegExp(`Sitemap: ${origin}/sitemap\\.xml`), 'robots.txt should point to the sitemap');

const analytics = await read('analytics.js');
assert.match(analytics, /awag:estimate-submitted/, 'analytics should record estimate leads');
assert.match(await read('estimate-form.mjs'), /awag:estimate-submitted/, 'estimate form should announce successful submissions');

console.log('Verified canonical URLs, social tags, structured data, sitemap, robots.txt, and analytics wiring.');
