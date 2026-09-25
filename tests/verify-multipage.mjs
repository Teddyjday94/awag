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

assert.match(html['index.html'], /What matters on every job/, 'Home should contain the licensed, insured, local proof section');
assert.match(html['index.html'], /<strong>Licensed<\/strong>/, 'Home proof section should show Licensed');
assert.match(html['index.html'], /<strong>Insured<\/strong>/, 'Home proof section should show Insured');
assert.match(html['index.html'], /<strong>Local<\/strong>/, 'Home proof section should show Local');
assert.doesNotMatch(html['about.html'], /What matters on every job/, 'About should no longer contain the moved proof section');

const logo = await readFile(new URL('../assets/images/logo.jpg', import.meta.url));
const jpegDimensions = (buffer) => {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('Could not read JPEG dimensions');
};
const { width, height } = jpegDimensions(logo);
assert.ok(width >= 800 && height >= 800, `Logo source should be high resolution; got ${width}x${height}`);

const styles = await readFile(new URL('../style.css', import.meta.url), 'utf8');
assert.match(styles, /\.brand-logo\s*\{[^}]*width:\s*55px;[^}]*height:\s*55px;[^}]*border-radius:\s*50%;/s, 'Header logo should remain a 55px circle');

const titles = pages.map((page) => html[page].match(/<title>([^<]+)<\/title>/)?.[1]);
assert.equal(new Set(titles).size, pages.length, 'Each page should have a unique title');

console.log('Verified six-page AWAG structure.');
