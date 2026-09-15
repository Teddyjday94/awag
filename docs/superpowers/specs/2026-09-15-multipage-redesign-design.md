# AWAG Multi-Page Redesign Design

## Goal
Convert Ascension Wash N' Geaux from a long one-page site into a polished six-page static website while preserving the current brand, real job photography, quote workflow, mobile usability, and motion system.

## Approved Information Architecture
The site will use six top-level pages:

1. `index.html` — Home
2. `services.html` — Services
3. `gallery.html` — Gallery
4. `about.html` — About
5. `service-area.html` — Service Area
6. `contact.html` — Contact / Free Quote

The primary navigation will link to those pages instead of scrolling to anchors. The Free Quote action will consistently point to `contact.html`.

## Visual Direction
Use a hybrid visual system: shared header, typography, color palette, buttons, cards, footer, and motion language across all pages, while giving each page a distinct content rhythm and hero composition. Avoid generic repeated 1-2-3-4 block layouts and avoid large dead bands of empty space.

The existing navy / Gulf blue / coral palette remains. Keep the Anton display face, Plus Jakarta Sans body face, Caveat accent, rounded image frames, subtle grid/water-pressure motifs, layered imagery, and restrained scroll reveals.

No emoji should be used as interface decoration. Contact icons should be true vector / text-safe icons, not emoji-prone Unicode glyphs.

## Page Designs

### Home
Home remains the most cinematic page and is intentionally shorter than the current one-page site.

Sections:
- Video-backed hero with the current pressure-washing footage and before/after comparison slider.
- Compact local trust strip.
- Featured-services preview with 3–4 cards that link to `services.html`.
- Large before/after transformation feature.
- Selected gallery mosaic linking to `gallery.html`.
- Owner/equipment teaser using `truck-rig.jpg`.
- Service-area teaser with major local markets.
- Strong closing CTA to `contact.html`.

Only Home receives the background hero video.

### Services
A structured, image-supported service page with less cinematic motion than Home.

Sections:
- Short internal hero.
- Six detailed service entries: Soft Washing, Roof & Soffit Cleaning, Driveways & Sidewalks, House Washing, Fences & Decks, Commercial Properties.
- Alternating text/photo layouts to avoid repetitive card stacking.
- Surface-safe methods explanation.
- Before/after examples using existing job photography.
- Residential vs commercial callout.
- Closing quote CTA.

### Gallery
Image-first portfolio page.

Sections:
- Compact gallery hero.
- Category filter controls for All, House/Soft Wash, Roof, Concrete, Fence/Exterior.
- Masonry-style project grid using the existing real job images.
- Lightbox support retained.
- Featured transformation section with a before/after slider or paired images.
- Closing quote CTA.

### About
Warmer, more personal page centered on the local-owner value proposition.

Sections:
- Internal hero with `truck-rig.jpg`.
- Local owner story.
- Equipment / process section.
- “How a job works” three-step explanation presented as an editorial timeline, not generic numbered boxes.
- Licensed / insured and surface-safe trust content.
- Real-work photo band.
- Closing quote CTA.

### Service Area
Local-market page that feels useful rather than like a keyword list.

Sections:
- Location-focused hero.
- Major service markets: Gonzales, Prairieville, Baton Rouge, Denham Springs, Ascension Parish.
- Each market receives concise local service copy and relevant service emphasis.
- Service coverage / travel note.
- Photo strip from local work.
- Services available across the region.
- Closing quote CTA.

### Contact / Free Quote
Conversion-focused page that still feels visually complete.

Sections:
- Compact contact hero.
- Phone, email, Facebook contact cards.
- Existing quote form, preserving FormSubmit behavior and honeypot.
- “What happens next” process.
- Service-area reminder.
- Trust/photo section.
- Final call/text CTA.

The phone contact must use a real SVG handset icon rather than the Unicode `☎` glyph.

## Shared Navigation and Footer
Every page uses the same six-page primary navigation and a persistent Free Quote CTA. The current page is marked with `aria-current="page"` and an active visual state.

The mobile navigation remains collapsible. The existing mobile action bar remains, with Call Now and Free Quote actions.

The footer keeps business identity, phone, email, licensed/insured status, and page links.

## Shared JavaScript Behavior
`script.js` must remain defensive so pages without a slider or gallery do not error.

Responsibilities:
- Mobile navigation.
- Current-page navigation state.
- Home before/after slider.
- Gallery category filtering and lightbox.
- Dynamic year.
- Contact icon behavior only if needed; no Unicode-phone cleanup workaround should remain once markup contains SVG directly.

`motion.mjs` remains responsible for reveal animation and scroll effects. Hero video setup must target only a Home hero explicitly marked with `data-video-hero`.

`estimate-form.mjs` remains loaded on Contact only and preserves the existing submit behavior.

## Content and Image Reuse
Use only the current owner-supplied job photography already in `assets/images`. No stock photography.

Photography should be redistributed rather than duplicated on every page. Home receives highlights; Gallery receives the broadest set; Services receives method-relevant examples; About receives equipment/local-owner imagery; Service Area receives a compact strip; Contact receives one or two trust images.

## Responsive Requirements
All six pages must work cleanly at mobile widths.

- Navigation remains usable with the existing hamburger interaction.
- Internal heroes are shorter than Home.
- Image/text split sections collapse to a single column without awkward blank areas.
- Gallery filters remain horizontally usable or wrap cleanly.
- Contact form remains full-width on mobile.
- Mobile action bar remains visible without covering important controls.
- Before/after slider retains vertical page scrolling behavior on touch devices.

## Accessibility
- Keep the existing skip link.
- Use descriptive page titles and meta descriptions.
- Maintain keyboard support for slider and lightbox.
- Use `aria-current="page"` on the active top-level navigation item.
- SVG icons used only decoratively receive `aria-hidden="true"` and `focusable="false"`.
- Respect `prefers-reduced-motion`.

## SEO / Professionalism
Each page receives a unique `<title>` and meta description. Navigation links use crawlable relative page URLs. Internal content should provide useful local context without keyword stuffing.

## Technical Constraints
- Static HTML/CSS/JavaScript only; no framework migration.
- Preserve current Vercel hosting behavior.
- Preserve the existing `assets/` hierarchy.
- Do not add third-party UI libraries.
- Keep the current form submission destination until the business email workflow is changed later.
- Keep current visual brand colors and fonts.
- Do not use emojis.

## Acceptance Criteria
- Six real pages exist and are reachable from shared navigation.
- Home no longer contains the entire one-page site.
- No page feels intentionally padded with blank space; imagery and useful content alternate through each page.
- Only Home loads the background hero video.
- Gallery lightbox works on Gallery.
- Quote form works on Contact.
- Mobile nav and action bar work across all pages.
- The phone contact displays a true SVG icon, not an emoji / Unicode phone glyph.
- Existing real job imagery remains in use.
- All automated site verification tests pass.
- Vercel preview / production build succeeds.