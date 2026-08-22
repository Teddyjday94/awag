import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('style.css', root), 'utf8');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML IDs should be unique');

for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
  assert.ok(ids.includes(target), `fragment link #${target} should resolve to an element`);
}

const localSources = [...html.matchAll(/(?:src|href)="((?:assets\/|style\.css|script\.js)[^"]*)"/g)].map((match) => match[1]);
for (const source of localSources) await access(new URL(source, root));

const openBraces = (css.match(/{/g) || []).length;
const closeBraces = (css.match(/}/g) || []).length;
assert.equal(openBraces, closeBraces, 'CSS braces should be balanced');
assert.match(html, /<main\b[\s\S]*<\/main>/, 'page should contain a main landmark');
assert.match(html, /<nav\b[^>]*aria-label=/, 'navigation landmarks should be labeled');

console.log(`Verified ${ids.length} unique IDs, ${localSources.length} local references, and balanced CSS.`);
