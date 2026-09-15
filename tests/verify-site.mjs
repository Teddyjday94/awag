import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('style.css', root), 'utf8');
const js = await readFile(new URL('script.js', root), 'utf8');
const imageDir = new URL('assets/images/', root);
const images = (await readdir(imageDir)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name));

for (const image of images) {
  assert.match(html, new RegExp(`assets/images/${image.replace('.', '\\.')}`), `index.html should preserve and use ${image}`);
}

assert.match(html, /class="skip-link"/, 'page should include a keyboard skip link');
assert.match(html, /class="mobile-action-bar"/, 'page should include a persistent mobile action bar');
assert.match(html, /aria-label="Before and after comparison"/, 'comparison slider should have an accessible label');
assert.match(html, /tabindex="0"[^>]*role="slider"/, 'comparison slider should support keyboard focus');
assert.match(js, /ArrowLeft|ArrowRight/, 'comparison slider should support arrow-key controls');
assert.match(js, /aria-valuenow/, 'comparison slider should expose its current value');
assert.match(js, /\\u260E/, 'site script should remove the emoji-prone phone glyph before display');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'motion should respect reduced-motion preferences');
assert.match(css, /--navy:/, 'the original blue palette should remain represented');
assert.doesNotMatch(html, /https?:\/\/(?:images\.unsplash|source\.unsplash|picsum)/, 'site should use the owner\'s real images, not stock-photo services');

console.log(`Verified ${images.length} local images and the redesigned site contract.`);
