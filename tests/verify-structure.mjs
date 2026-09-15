import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const pages = ['index.html', 'services.html', 'gallery.html', 'about.html', 'service-area.html', 'contact.html'];

for (const page of pages) {
  const html = await readFile(new URL(page, root), 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page} IDs should be unique`);

  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(target), `${page} fragment link #${target} should resolve to an element`);
  }

  const localSources = [...html.matchAll(/(?:src|href)="((?:assets\/|(?:index|services|gallery|about|service-area|contact)\.html|style\.css|multipage\.css|script\.js|motion\.mjs|estimate-form\.mjs)[^"]*)"/g)]
    .map((match) => match[1].split('#')[0])
    .filter(Boolean);
  for (const source of localSources) await access(new URL(source, root));

  assert.match(html, /<main\b[\s\S]*<\/main>/, `${page} should contain a main landmark`);
  assert.match(html, /<nav\b[^>]*aria-label=/, `${page} navigation landmarks should be labeled`);
}

for (const stylesheet of ['style.css', 'multipage.css']) {
  const css = await readFile(new URL(stylesheet, root), 'utf8');
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  assert.equal(openBraces, closeBraces, `${stylesheet} braces should be balanced`);
}

console.log(`Verified ${pages.length} pages, local references, unique IDs, landmarks, and balanced CSS.`);
