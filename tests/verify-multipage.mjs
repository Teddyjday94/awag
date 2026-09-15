import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = ['index.html', 'services.html', 'gallery.html', 'about.html', 'service-area.html', 'contact.html'];
const html = Object.fromEntries(await Promise.all(
  pages.map(async (page) => [page, await readFile(new URL(`../${page}`, import.meta.url), 'utf8')]),
));

for (const [page, source] of Object.entries(html)) {
  pages.forEach((target) => {
    assert.match(source, new RegExp(`href="${target.replace('.', '\\.')}`), `${page} should link to ${target}`);
  });
  assert.doesNotMatch(source, /☎|📞|📱/, `${page} must not contain phone emoji/glyphs`);
  assert.match(source, /class="mobile-action-bar"/, `${page} should include the mobile action bar`);
  assert.match(source, /<meta name="description"/, `${page} should include a meta description`);
}

assert.match(html['index.html'], /data-video-hero/, 'Home should opt into the hero video');
for (const page of pages.slice(1)) {
  assert.doesNotMatch(html[page], /data-video-hero/, `${page} should not load the Home video`);
}
assert.match(html['gallery.html'], /id="gallery-grid"/, 'Gallery should expose the lightbox grid');
assert.match(html['gallery.html'], /data-gallery-filter/, 'Gallery should expose category filters');
assert.match(html['contact.html'], /id="quote-form"/, 'Contact should contain the estimate form');
assert.match(html['contact.html'], /<svg[^>]*class="contact-icon-svg"/, 'Contact should contain a real SVG contact icon');
assert.doesNotMatch(html['index.html'], /id="quote-form"/, 'Home should not duplicate the full quote form');

const titles = pages.map((page) => html[page].match(/<title>([^<]+)<\/title>/)?.[1]);
assert.equal(new Set(titles).size, pages.length, 'Each page should have a unique title');

console.log('Verified six-page AWAG structure.');
