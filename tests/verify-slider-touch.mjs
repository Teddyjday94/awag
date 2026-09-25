import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');

const pointerDown = script.match(/slider\.addEventListener\('pointerdown',[\s\S]*?\n\s*\}\);/s)?.[0] ?? '';
assert.match(
  pointerDown,
  /setPointerCapture\?\.\(event\.pointerId\)/,
  'Touch slider should capture the pointer immediately on pointerdown so an iPad drag stays attached even when the finger moves outside the image',
);

const pointerMove = script.match(/slider\.addEventListener\('pointermove',[\s\S]*?\n\s*\}\);/s)?.[0] ?? '';
assert.match(
  pointerMove,
  /touchIntent === 'horizontal'[\s\S]*setTarget\(valueFromPointer\(event\),\s*true\)/,
  'Touch dragging should render immediately instead of easing behind the finger',
);

const pointerUp = script.match(/slider\.addEventListener\('pointerup',[\s\S]*?\n\s*\}\);/s)?.[0] ?? '';
assert.match(
  pointerUp,
  /setTarget\(valueFromPointer\(event\),\s*true\)/,
  'Touch release should commit the final slider position immediately',
);

assert.match(
  script,
  /slider\.addEventListener\('pointercancel',\s*endTouch\)/,
  'Touch slider should clean up state when iPadOS cancels a pointer gesture',
);

console.log('Verified iPad/touch slider drag behavior.');
