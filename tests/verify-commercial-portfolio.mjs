import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const home = await readFile(new URL('index.html', root), 'utf8');
const services = await readFile(new URL('services.html', root), 'utf8');
const gallery = await readFile(new URL('gallery.html', root), 'utf8');
const css = await readFile(new URL('multipage.css', root), 'utf8');

const assets = [
  'assets/images/commercial-dons-storefront.jpg',
  'assets/images/commercial-dons-night-cleaning.jpg',
  'assets/images/commercial-dons-walkway.jpg',
  'assets/images/commercial-office-building-after.jpg',
  'assets/images/commercial-concrete-before-after.jpg',
  'assets/images/commercial-wall-before-after.jpg',
  'assets/images/commercial-surface-cleaner-poster.jpg',
  'assets/video/commercial-surface-cleaner.mp4',
];
for (const asset of assets) await access(new URL(asset, root));

assert.match(gallery, /data-gallery-filter="commercial"[^>]*>Commercial</, 'Gallery should have a Commercial filter');
assert.match(gallery, /data-gallery-category="commercial"[\s\S]*commercial-dons-storefront\.jpg/, 'Gallery should feature the Don\'s storefront commercial job');
assert.match(gallery, /commercial-dons-night-cleaning\.jpg[\s\S]*Night service|Night service[\s\S]*commercial-dons-night-cleaning\.jpg/, 'Gallery should identify the nighttime commercial cleaning photo accurately');
assert.match(gallery, /commercial-concrete-before-after\.jpg[\s\S]*Commercial concrete[\s\S]*before \/ after/i, 'Gallery should show a true commercial concrete before/after');
assert.match(gallery, /commercial-wall-before-after\.jpg[\s\S]*Building exterior[\s\S]*before \/ after/i, 'Gallery should show a true commercial wall before/after');

assert.match(services, /id="commercial"[\s\S]*commercial-surface-cleaner\.mp4/, 'Commercial service should use the supplied surface-cleaner video');
assert.match(services, /commercial-surface-cleaner-poster\.jpg/, 'Commercial service video should have a matching poster');
assert.match(services, /commercial-dons-storefront\.jpg/, 'Commercial service should include a real business storefront');
assert.match(services, /commercial-office-building-after\.jpg/, 'Commercial service should include a cleaned commercial building exterior');

assert.match(home, /commercial-dons-storefront\.jpg/, 'Home recent work should include the Don\'s commercial job');
assert.match(home, /commercial-office-building-after\.jpg/, 'Home recent work should include the cleaned commercial building job');
assert.match(home, />Commercial storefront</, 'Home commercial storefront tile should be labeled accurately');
assert.match(home, />Commercial exterior wash</, 'Home commercial exterior tile should be labeled accurately');

const commercialBaseRule = css.search(/\.commercial-showcase\s*\{[^}]*display:\s*grid/);
const commercialPhoneRule = css.lastIndexOf('@media (max-width: 560px)');
assert.ok(commercialPhoneRule > commercialBaseRule, 'Phone layout rules should follow the base commercial showcase rule so they win the CSS cascade');

console.log('Verified intentional commercial portfolio placement across Home, Services, and Gallery.');
