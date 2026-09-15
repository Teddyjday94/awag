import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const pages = ['index.html', 'services.html', 'gallery.html', 'about.html', 'service-area.html', 'contact.html'];
const htmlByPage = Object.fromEntries(await Promise.all(
  pages.map(async (page) => [page, await readFile(new URL(page, root), 'utf8')]),
));
const allHtml = Object.values(htmlByPage).join('\n');
const css = await readFile(new URL('style.css', root), 'utf8');
const multipageCss = await readFile(new URL('multipage.css', root), 'utf8');
const js = await readFile(new URL('script.js', root), 'utf8');
const imageDir = new URL('assets/images/', root);
const images = (await readdir(imageDir)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name));

for (const image of images) {
  assert.match(allHtml, new RegExp(`assets/images/${image.replace('.', '\\.')}`), `the multipage site should preserve and use ${image}`);
}

for (const [page, html] of Object.entries(htmlByPage)) {
  assert.match(html, /class="skip-link"/, `${page} should include a keyboard skip link`);
  assert.match(html, /class="mobile-action-bar"/, `${page} should include a persistent mobile action bar`);
  assert.match(html, /<nav\b[^>]*aria-label="Primary navigation"/, `${page} should include labeled primary navigation`);
  assert.match(html, /href="contact\.html"/, `${page} should route visitors to the quote page`);
  assert.doesNotMatch(html, /https?:\/\/(?:images\.unsplash|source\.unsplash|picsum)/, `${page} should use owner images, not stock services`);
  assert.doesNotMatch(html, /☎|📞|📱/, `${page} should not contain emoji-prone phone glyphs`);
}

const home = htmlByPage['index.html'];
assert.match(home, /aria-label="Before and after comparison"/, 'Home comparison slider should have an accessible label');
assert.match(home, /tabindex="0"[^>]*role="slider"/, 'Home comparison slider should support keyboard focus');
assert.match(js, /ArrowLeft|ArrowRight/, 'comparison slider should support arrow-key controls');
assert.match(js, /aria-valuenow/, 'comparison slider should expose its current value');
assert.match(js, /data-gallery-filter/, 'shared script should support gallery filtering');
assert.match(js, /visibleFigures/, 'lightbox navigation should respect filtered gallery items');

const contact = htmlByPage['contact.html'];
assert.match(contact, /<svg[^>]*class="contact-icon-svg"/, 'phone contact should use an inline SVG icon');
assert.match(contact, /id="quote-form"/, 'Contact should contain the estimate form');

assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'motion should respect reduced-motion preferences');
assert.match(css, /--navy:/, 'the original blue palette should remain represented');
assert.match(multipageCss, /\.page-hero\b/, 'multipage styles should define internal page heroes');
assert.match(multipageCss, /\.contact-icon-svg\b/, 'multipage styles should define SVG contact icons');

console.log(`Verified ${pages.length} pages, ${images.length} local images, shared navigation, and multipage interactions.`);
