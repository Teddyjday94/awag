import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getActiveSectionId,
  getRevealOffset,
  getScrollProgress,
  getStaggerDelay,
} from '../motion.mjs';

test('scroll progress stays within the document range', () => {
  assert.equal(getScrollProgress(0, 2200, 700), 0);
  assert.equal(getScrollProgress(750, 2200, 700), 0.5);
  assert.equal(getScrollProgress(4000, 2200, 700), 1);
  assert.equal(getScrollProgress(200, 700, 700), 0);
});

test('reveal delays stagger quickly and stop growing', () => {
  assert.equal(getStaggerDelay(0), 0);
  assert.equal(getStaggerDelay(3), 210);
  assert.equal(getStaggerDelay(12), 350);
});

test('side reveals stay vertical when the viewport lacks safe gutters', () => {
  assert.equal(getRevealOffset(860, 'left'), 0);
  assert.equal(getRevealOffset(1200, 'right'), 0);
  assert.equal(getRevealOffset(1440, 'left'), -36);
  assert.equal(getRevealOffset(1440, 'right'), 36);
});

test('active navigation follows the section crossing the header marker', () => {
  const sections = [
    { id: 'services', top: -300, bottom: -20 },
    { id: 'gallery', top: -20, bottom: 680 },
    { id: 'about', top: 680, bottom: 1300 },
  ];

  assert.equal(getActiveSectionId(sections, 96), 'gallery');
  assert.equal(getActiveSectionId(sections, -400), null);
});
