import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const pages = ['index.html', 'services.html', 'gallery.html', 'about.html', 'service-area.html', 'contact.html'];
const loaderJs = await readFile(new URL('loader.js', root), 'utf8');
const css = await readFile(new URL('style.css', root), 'utf8');

for (const page of pages) {
  const html = await readFile(new URL(page, root), 'utf8');
  assert.match(html, /id="site-loader"/, `${page} should include the first-visit loader`);
  assert.match(html, /src="loader\.js"/, `${page} should load the loader controller`);
  assert.match(html, /data-src="assets\/video\/site-loader-bg\.mp4"/, `${page} should use the pressure-washing loader video`);
}

await access(new URL('assets/video/site-loader-bg.mp4', root));
await access(new URL('assets/images/site-loader-poster.jpg', root));
assert.match(loaderJs, /awagSiteLoaderSeen/, 'loader should only play once per tab session');
assert.match(loaderJs, /aria-valuenow/, 'loader should expose real progress state');
assert.match(loaderJs, /awag:hero-ready/, 'loader should wait for the home hero animation readiness signal');
assert.match(css, /site-loader__wash/, 'loader should include the site reveal wash transition');
assert.match(css, /prefers-reduced-motion: reduce/, 'loader should respect reduced-motion preferences');

console.log('Verified branded video loader, progress behavior, session gating, and transition hooks.');
