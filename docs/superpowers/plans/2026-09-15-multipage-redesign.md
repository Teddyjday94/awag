# AWAG Multi-Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing one-page AWAG site into a polished six-page static website while preserving brand, real photography, current form behavior, mobile usability, and motion.

**Architecture:** Keep the project framework-free. Create six root HTML files that share `style.css`, `script.js`, and `motion.mjs`; load `estimate-form.mjs` only on Contact. Home alone is marked with `data-video-hero` so only it receives the cinematic background video.

**Tech Stack:** Static HTML5, CSS3, vanilla JavaScript / ES modules, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-15-multipage-redesign-design.md`

## Global Constraints

- Static HTML/CSS/JavaScript only; no framework migration.
- Preserve current Vercel hosting behavior.
- Preserve the existing `assets/` hierarchy.
- Use only current owner-supplied photography; no stock images.
- Keep current navy / Gulf blue / coral brand colors and existing fonts.
- Do not use emojis.
- Phone contact must use a real SVG handset icon rather than Unicode `☎`.
- Only Home may load the background hero video.
- Preserve mobile before/after slider scrolling behavior.
- Preserve current form destination and anti-spam behavior.

---

### Task 1: Add the Multi-Page Contract Test

**Files:**
- Create: `tests/verify-multipage.mjs`

**Interfaces:**
- Consumes: six expected root HTML filenames and shared asset/script names.
- Produces: a Node verification script that fails until the six-page contract exists.

- [ ] **Step 1: Write the failing test**

Create `tests/verify-multipage.mjs` that reads all six HTML files and asserts:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = ['index.html', 'services.html', 'gallery.html', 'about.html', 'service-area.html', 'contact.html'];
const html = Object.fromEntries(await Promise.all(pages.map(async (page) => [page, await readFile(new URL(`../${page}`, import.meta.url), 'utf8')])));
const navTargets = ['index.html', 'services.html', 'gallery.html', 'about.html', 'service-area.html', 'contact.html'];

for (const [page, source] of Object.entries(html)) {
  navTargets.forEach((target) => assert.match(source, new RegExp(`href="${target.replace('.', '\\.')}`), `${page} should link to ${target}`));
  assert.doesNotMatch(source, /☎/, `${page} must not contain the emoji-prone phone glyph`);
  assert.match(source, /class="mobile-action-bar"/, `${page} should include the mobile action bar`);
}

assert.match(html['index.html'], /data-video-hero/, 'Home should opt into the hero video');
for (const page of pages.slice(1)) assert.doesNotMatch(html[page], /data-video-hero/, `${page} should not load the Home video`);
assert.match(html['gallery.html'], /id="gallery-grid"/, 'Gallery should expose the lightbox grid');
assert.match(html['gallery.html'], /data-gallery-filter/, 'Gallery should expose category filters');
assert.match(html['contact.html'], /id="quote-form"/, 'Contact should contain the estimate form');
assert.match(html['contact.html'], /<svg[^>]*class="contact-icon-svg"/, 'Contact should contain a real SVG contact icon');
assert.doesNotMatch(html['index.html'], /id="quote-form"/, 'Home should not duplicate the full quote form');

console.log('Verified six-page AWAG structure.');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/verify-multipage.mjs
```

Expected: FAIL because the internal HTML pages do not exist yet.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add tests/verify-multipage.mjs
git commit -m "test: define multipage site contract"
```

### Task 2: Build Shared Multi-Page Styling

**Files:**
- Modify: `style.css`

**Interfaces:**
- Consumes: existing brand variables and shared classes.
- Produces: reusable internal hero, content split, photo mosaic, service-detail, filter, timeline, service-area, and contact-page classes.

- [ ] **Step 1: Add reusable layout rules**

Append styles for:

```css
.page-hero { position: relative; overflow: hidden; padding: 86px 0 92px; color: var(--white); background: linear-gradient(135deg, var(--navy-deep), var(--navy) 58%, #0c67c4); }
.page-hero-grid { display: grid; grid-template-columns: minmax(0, .95fr) minmax(320px, 1.05fr); gap: 60px; align-items: center; }
.page-hero-copy p { max-width: 58ch; color: rgba(255,255,255,.78); line-height: 1.75; }
.page-hero-media { position: relative; min-height: 340px; }
.page-hero-media img { height: 100%; min-height: 340px; object-fit: cover; border-radius: 30px; box-shadow: 0 34px 70px -30px rgba(0,0,0,.65); }
.content-split { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.content-split.reverse > :first-child { order: 2; }
.editorial-photo { border-radius: 26px; overflow: hidden; box-shadow: var(--shadow); }
.editorial-photo img { aspect-ratio: 4 / 3; object-fit: cover; }
.page-cta { padding: 74px 0; color: var(--white); background: linear-gradient(135deg, var(--navy-deep), var(--gulf)); }
.page-cta-inner { display: flex; justify-content: space-between; gap: 28px; align-items: center; }
```

Also add specific classes for `.service-detail`, `.gallery-filters`, `.gallery-filter`, `.process-timeline`, `.area-card-grid`, `.area-card`, `.contact-layout`, `.contact-icon-svg`, `.photo-ribbon`, `.mini-proof-grid` and responsive rules under existing mobile media queries.

- [ ] **Step 2: Run existing CSS/site verification**

Run:

```bash
node tests/verify-site.mjs
```

Expected: PASS.

- [ ] **Step 3: Commit shared styling**

```bash
git add style.css
git commit -m "style: add shared multipage layouts"
```

### Task 3: Rewrite Home as a Focused Landing Page

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing Home video assets, before/after slider, shared header/footer styles.
- Produces: concise Home page with links into the five internal pages.

- [ ] **Step 1: Replace one-page navigation with six-page navigation**

Use:

```html
<nav class="main-nav" id="main-nav" aria-label="Primary navigation">
  <a href="index.html" aria-current="page">Home</a>
  <a href="services.html">Services</a>
  <a href="gallery.html">Gallery</a>
  <a href="about.html">About</a>
  <a href="service-area.html">Service area</a>
  <a class="nav-cta" href="contact.html">Free quote <span aria-hidden="true">→</span></a>
</nav>
```

- [ ] **Step 2: Mark only the Home hero for video**

Change the hero opening tag to:

```html
<section class="hero" data-video-hero>
```

- [ ] **Step 3: Replace the long single-page body with the approved Home sections**

Keep the existing hero/slider, then add compact trust, featured services, transformation, gallery mosaic, owner/equipment teaser, service-area teaser, and final CTA. Remove the full quote form from Home.

- [ ] **Step 4: Run structure test**

Run:

```bash
node tests/verify-site.mjs
```

Expected: PASS after the existing single-page assumptions are updated in Task 9 if necessary; otherwise note only failures caused by the intentionally changed navigation contract.

- [ ] **Step 5: Commit Home**

```bash
git add index.html
git commit -m "feat: focus home page for multipage site"
```

### Task 4: Create Services Page

**Files:**
- Create: `services.html`

**Interfaces:**
- Consumes: `style.css`, `script.js`, `motion.mjs`, existing images.
- Produces: dedicated service detail page.

- [ ] **Step 1: Create the page shell**

Include shared topbar/header/footer, unique title/meta description, `body data-page="services"`, and the six-page navigation with Services marked `aria-current="page"`.

- [ ] **Step 2: Add service content**

Implement six service-detail sections with alternating image/text layout and useful explanatory copy. Include a methods/surface-safety band, residential/commercial split, photo proof, and closing CTA.

- [ ] **Step 3: Verify**

Run:

```bash
node tests/verify-multipage.mjs
```

Expected: still FAIL until all pages exist, but no longer fail on missing `services.html`.

- [ ] **Step 4: Commit**

```bash
git add services.html
git commit -m "feat: add services page"
```

### Task 5: Create Gallery Page

**Files:**
- Create: `gallery.html`

**Interfaces:**
- Consumes: current job images and existing lightbox IDs.
- Produces: dedicated filterable portfolio page.

- [ ] **Step 1: Create Gallery shell and hero**

Use `body data-page="gallery"`; mark Gallery active.

- [ ] **Step 2: Add filter controls and categorized figures**

Example:

```html
<div class="gallery-filters" aria-label="Filter projects">
  <button class="gallery-filter active" type="button" data-gallery-filter="all">All</button>
  <button class="gallery-filter" type="button" data-gallery-filter="house">House / Soft Wash</button>
  <button class="gallery-filter" type="button" data-gallery-filter="roof">Roof</button>
  <button class="gallery-filter" type="button" data-gallery-filter="concrete">Concrete</button>
  <button class="gallery-filter" type="button" data-gallery-filter="exterior">Fence / Exterior</button>
</div>
```

Each `.gallery-item` receives `data-gallery-category` while preserving `tabindex="0"`, `role="button"`, image, and caption.

- [ ] **Step 3: Preserve lightbox markup**

Keep `#lightbox`, `#lightbox-close`, `#lightbox-prev`, `#lightbox-next`, `#lightbox-img`, and `#lightbox-caption`.

- [ ] **Step 4: Commit**

```bash
git add gallery.html
git commit -m "feat: add gallery page"
```

### Task 6: Create About and Service Area Pages

**Files:**
- Create: `about.html`
- Create: `service-area.html`

**Interfaces:**
- Consumes: shared page layouts and real local-job photography.
- Produces: owner/story page and local coverage page.

- [ ] **Step 1: Create About page**

Add internal hero with `truck-rig.jpg`, owner story, equipment/process section, editorial process timeline, trust section, photo ribbon, and quote CTA.

- [ ] **Step 2: Create Service Area page**

Add internal hero, cards for Gonzales/Prairieville/Baton Rouge/Denham Springs/Ascension Parish, coverage note, service summary, local-work photo strip, and quote CTA.

- [ ] **Step 3: Commit**

```bash
git add about.html service-area.html
git commit -m "feat: add about and service area pages"
```

### Task 7: Create Contact / Quote Page

**Files:**
- Create: `contact.html`

**Interfaces:**
- Consumes: existing quote form field names/action and `estimate-form.mjs`.
- Produces: dedicated conversion page and SVG contact cards.

- [ ] **Step 1: Create Contact page shell**

Use a compact hero and active Contact / Free Quote navigation state.

- [ ] **Step 2: Add vector contact cards**

Use a true inline SVG handset:

```html
<span class="contact-icon" aria-hidden="true">
  <svg class="contact-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.08 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"/>
  </svg>
</span>
```

No `☎` glyph may remain.

- [ ] **Step 3: Move the existing quote form here unchanged in behavior**

Keep `id="quote-form"`, FormSubmit action, current field names, honeypot, status element, and submit button.

- [ ] **Step 4: Load `estimate-form.mjs` only on Contact**

- [ ] **Step 5: Commit**

```bash
git add contact.html
git commit -m "feat: add contact and quote page"
```

### Task 8: Adapt Shared JavaScript for Multiple Pages

**Files:**
- Modify: `script.js`
- Modify: `motion.mjs`

**Interfaces:**
- Consumes: `body[data-page]`, `data-nav`, gallery filter/category attributes, `data-video-hero`.
- Produces: page-safe shared behavior.

- [ ] **Step 1: Remove the Unicode-phone replacement workaround**

Delete the `\u260E` DOM replacement block because Contact now contains SVG markup directly.

- [ ] **Step 2: Add current-page navigation support**

Use body/page metadata or URL filenames to set `aria-current="page"` consistently without overwriting explicitly correct markup.

- [ ] **Step 3: Add Gallery filtering**

Add click listeners to `[data-gallery-filter]` buttons. Toggle `.active`, update `aria-pressed`, and toggle the `hidden` property of `.gallery-item` based on `data-gallery-category`.

- [ ] **Step 4: Make lightbox index only visible figures**

When opening/navigating, derive the current visible figure list so Prev/Next does not jump into filtered-out projects.

- [ ] **Step 5: Restrict hero video to Home**

In `motion.mjs`, change:

```js
const hero = document.querySelector('.hero');
```

to:

```js
const hero = document.querySelector('.hero[data-video-hero]');
```

inside `setupHeroBackgroundVideo` only. General scroll/parallax can continue targeting `.hero` if appropriate.

- [ ] **Step 6: Commit behavior changes**

```bash
git add script.js motion.mjs
git commit -m "feat: make shared interactions multipage aware"
```

### Task 9: Update Automated Verification

**Files:**
- Modify: `tests/verify-site.mjs`
- Modify: `tests/verify-motion.mjs` if selector expectations require it
- Test: `tests/verify-multipage.mjs`

**Interfaces:**
- Consumes: final six-page architecture.
- Produces: automated regression coverage for the new site shape.

- [ ] **Step 1: Replace obsolete one-page assertions**

Update `verify-site.mjs` to check shared accessibility, mobile action bar, owner-supplied images, navigation, and CSS rather than requiring the old one-page quote/gallery structure in `index.html`.

- [ ] **Step 2: Add no-emoji phone regression**

Assert all six HTML files do not contain `☎`, `📞`, or phone emoji presentation characters.

- [ ] **Step 3: Run all Node verification scripts**

Run:

```bash
node tests/verify-site.mjs
node tests/verify-motion.mjs
node tests/verify-structure.mjs
node tests/verify-estimate.mjs
node tests/verify-multipage.mjs
```

Expected: all PASS.

- [ ] **Step 4: Commit tests**

```bash
git add tests
git commit -m "test: verify multipage redesign"
```

### Task 10: Deployment Verification and Promotion

**Files:** none unless verification exposes a defect.

**Interfaces:**
- Consumes: feature branch final commit.
- Produces: verified production-ready commit.

- [ ] **Step 1: Verify branch deployment succeeds**

Confirm Vercel reports success for the feature branch commit.

- [ ] **Step 2: Inspect representative pages**

Verify HTTP 200 and expected page-specific markup for:
- `/index.html`
- `/services.html`
- `/gallery.html`
- `/about.html`
- `/service-area.html`
- `/contact.html`

- [ ] **Step 3: Verify critical live assets / behavior hooks**

Confirm Home includes `data-video-hero`, Gallery includes filter/lightbox hooks, Contact includes `quote-form` and inline phone SVG, and internal pages do not opt into hero video.

- [ ] **Step 4: Promote the verified feature commit to `main`**

Fast-forward `main` to the validated feature commit.

- [ ] **Step 5: Verify production deployment**

Confirm Vercel production status is successful and representative production URLs return the new multi-page markup.
