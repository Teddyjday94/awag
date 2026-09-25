import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import {
  getActiveSectionId,
  getHeroVideoVisuals,
  getPointerTilt,
  getDepthOffset,
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

test('hero video is more visible while retaining a readable blue overlay', () => {
  const desktop = getHeroVideoVisuals(1200);
  assert.equal(desktop.opacity, 0.43);
  assert.equal(desktop.overlay, 'linear-gradient(127deg, rgba(6,27,62,.82) 0%, rgba(11,46,107,.72) 48%, rgba(11,105,207,.56) 100%)');

  const mobile = getHeroVideoVisuals(390);
  assert.equal(mobile.opacity, 0.36);
  assert.equal(mobile.overlay, 'linear-gradient(127deg, rgba(6,27,62,.87) 0%, rgba(11,46,107,.78) 55%, rgba(11,105,207,.64) 100%)');
});


test('pointer tilt stays subtle, centered, and bounded', () => {
  assert.deepEqual(getPointerTilt(150, 100, 300, 200), { rotateX: 0, rotateY: 0 });
  assert.deepEqual(getPointerTilt(300, 0, 300, 200), { rotateX: 5, rotateY: 5 });
  assert.deepEqual(getPointerTilt(-100, 400, 300, 200), { rotateX: -5, rotateY: -5 });
});

test('depth offset eases from rest to the configured travel', () => {
  assert.equal(getDepthOffset(0, 18), 0);
  assert.equal(getDepthOffset(0.5, 18), 9);
  assert.equal(getDepthOffset(1.5, 18), 18);
});

test('premium motion styles cover hero staging, interactive cards, gallery, CTA, and reduced motion', async () => {
  const [style, multipage, motion] = await Promise.all([
    readFile(new URL('../style.css', import.meta.url), 'utf8'),
    readFile(new URL('../multipage.css', import.meta.url), 'utf8'),
    readFile(new URL('../motion.mjs', import.meta.url), 'utf8'),
  ]);

  assert.match(style, /hero-copy\s*>\s*\*.*hero-stage-in/s, 'Home hero should use staged entrance animation');
  assert.match(style, /\.motion-surface/, 'Interactive surfaces should have a shared motion treatment');
  assert.match(multipage, /\.page-hero-copy.*page-hero-stage/s, 'Interior page heroes should stage their content');
  assert.match(multipage, /\.page-cta::before/, 'CTA bands should have an animated accent layer');
  assert.match(multipage, /\.home-gallery a::after/, 'Homepage gallery should have an animated sheen layer');
  assert.match(motion, /setupInteractiveSurfaces/, 'Motion controller should initialize pointer-driven surface effects');
  assert.match(motion, /setupPageHeroDepth/, 'Motion controller should initialize page hero depth');
  assert.match(style + multipage, /prefers-reduced-motion:\s*reduce[\s\S]*motion-surface/s, 'Reduced motion should neutralize interactive transforms');
});
