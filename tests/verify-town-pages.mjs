import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (f) => readFile(new URL(f, root), 'utf8');
const towns = {
  'pressure-washing-prairieville.html': 'Prairieville',
  'pressure-washing-baton-rouge.html': 'Baton Rouge',
  'pressure-washing-denham-springs.html': 'Denham Springs',
};
const sitemap = await read('sitemap.xml');
const serviceArea = await read('service-area.html');
const titles = new Set();

for (const [file, town] of Object.entries(towns)) {
  const html = await read(file);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title?.includes(town), `${file} title should name ${town}`);
  titles.add(title);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://ascensionwashngeaux\\.com/${file.replace('.', '\\.')}">`), `${file} canonical`);
  assert.match(html, /<meta name="description" content="[^"]{60,}">/, `${file} needs a real description`);
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${file} should have one h1`);
  assert.match(html, /href="contact\.html"/, `${file} should link to the quote form`);
  assert.match(html, /class="mobile-action-bar"/, `${file} should keep the mobile call/quote bar`);
  assert.doesNotMatch(html, /aria-current="page"/, `${file} is not a nav item`);
  assert.ok(sitemap.includes(`https://ascensionwashngeaux.com/${file}`), `${file} should be in the sitemap`);
  assert.ok(serviceArea.includes(`href="${file}"`), `service-area.html should link to ${file}`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${file} IDs should be unique`);
  for (const [, src] of html.matchAll(/(?:src|href)="((?:assets\/|[a-z-]+\.(?:html|css|js|mjs))[^"#]*)"/g)) {
    await access(new URL(src, root));
  }
  for (const [, anchor] of html.matchAll(/href="services\.html#([a-z-]+)"/g)) {
    assert.match(await read('services.html'), new RegExp(`id="${anchor}"`), `services.html#${anchor} should exist`);
  }
}
assert.equal(titles.size, 3, 'town pages need distinct titles');

const review = await read('review.html');
assert.match(review, /<meta name="robots" content="noindex">/, 'the review page should stay out of search results');
assert.match(review, /id="review-google"/, 'the review page should link to Google');
assert.doesNotMatch(sitemap, /review\.html/, 'the review page should not be in the sitemap');

console.log('Verified town pages, sitemap entries, service-area links, and the review page.');
