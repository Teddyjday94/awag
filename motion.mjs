export function getScrollProgress(scrollY, documentHeight, viewportHeight) {
  const scrollable = documentHeight - viewportHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / scrollable));
}

export function getStaggerDelay(index, step = 70, maximum = 350) {
  return Math.min(maximum, Math.max(0, index) * step);
}

export function getRevealOffset(viewportWidth, direction) {
  const contentWidth = Math.min(1180, Math.max(0, viewportWidth - 48));
  const gutter = (viewportWidth - contentWidth) / 2;
  if (gutter < 40) return 0;
  return direction === 'left' ? -36 : direction === 'right' ? 36 : 0;
}

export function getActiveSectionId(sections, marker) {
  return sections.find(({ top, bottom }) => top <= marker && bottom > marker)?.id ?? null;
}

export function getPointerTilt(pointerX, pointerY, width, height, maximum = 5) {
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };
  const x = Math.min(1, Math.max(0, pointerX / width));
  const y = Math.min(1, Math.max(0, pointerY / height));
  const rotateX = Number(((0.5 - y) * maximum * 2).toFixed(2));
  const rotateY = Number(((x - 0.5) * maximum * 2).toFixed(2));
  return { rotateX, rotateY };
}

export function getDepthOffset(progress, maximum = 18) {
  const safeProgress = Math.min(1, Math.max(0, progress));
  return Number((safeProgress * maximum).toFixed(2));
}

export function getHeroVideoVisuals(viewportWidth) {
  if (viewportWidth <= 768) {
    return {
      opacity: 0.36,
      overlay: 'linear-gradient(127deg, rgba(6,27,62,.87) 0%, rgba(11,46,107,.78) 55%, rgba(11,105,207,.64) 100%)',
    };
  }

  return {
    opacity: 0.43,
    overlay: 'linear-gradient(127deg, rgba(6,27,62,.82) 0%, rgba(11,46,107,.72) 48%, rgba(11,105,207,.56) 100%)',
  };
}

function prepareReveals(document, viewportWidth) {
  const standalone = [
    ...document.querySelectorAll('.section-heading, .proof-grid, .areas-inner > div, .area-list, .cta-band-inner, .quote-copy, .quote-form, .footer-grid, .mp-heading, .transformation-band, .content-split, .service-detail, .gallery-filters, .gallery-story, .coverage-note, .page-cta-inner'),
  ];
  standalone.forEach((element) => element.classList.add('reveal'));

  const groups = document.querySelectorAll('.service-grid, .gallery-grid, .why-grid, .check-list, .featured-services, .mini-proof-grid, .method-panel, .area-card-grid, .contact-cards, .next-steps, .photo-ribbon, .process-timeline');
  groups.forEach((group) => {
    [...group.children].forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${getStaggerDelay(index)}ms`);
    });
  });

  document.querySelectorAll('.gallery-item').forEach((element) => {
    element.dataset.reveal = 'scale';
  });
  document.querySelector('.about-image')?.setAttribute('data-reveal', 'left');
  document.querySelector('.about-copy')?.setAttribute('data-reveal', 'right');
  document.querySelector('.quote-copy')?.setAttribute('data-reveal', 'left');
  document.querySelector('.quote-form')?.setAttribute('data-reveal', 'right');
  document.querySelectorAll('[data-reveal="left"], [data-reveal="right"]').forEach((element) => {
    element.style.setProperty('--reveal-x', `${getRevealOffset(viewportWidth, element.dataset.reveal)}px`);
  });

  return [...document.querySelectorAll('.reveal')];
}

function observeReveals(elements, window) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('in-view'));
    return;
  }

  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px' });

  elements.forEach((element) => observer.observe(element));
}

function setupInteractiveSurfaces(document, window) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const surfaces = [...document.querySelectorAll(
    '.featured-service, .service-card, .mini-proof, .method-card, .area-card, .next-step, .contact-card, .gallery-item, .home-gallery a, .service-detail-media, .editorial-photo',
  )];

  surfaces.forEach((surface) => surface.classList.add('motion-surface'));
  if (reduceMotion || !precisePointer) return;

  surfaces.forEach((surface) => {
    let frameRequested = false;
    let nextEvent = null;

    const render = () => {
      frameRequested = false;
      if (!nextEvent) return;
      const rect = surface.getBoundingClientRect();
      const x = nextEvent.clientX - rect.left;
      const y = nextEvent.clientY - rect.top;
      const { rotateX, rotateY } = getPointerTilt(x, y, rect.width, rect.height);
      surface.style.setProperty('--motion-rx', `${rotateX}deg`);
      surface.style.setProperty('--motion-ry', `${rotateY}deg`);
      surface.style.setProperty('--motion-glow-x', `${Math.min(100, Math.max(0, (x / Math.max(1, rect.width)) * 100)).toFixed(1)}%`);
      surface.style.setProperty('--motion-glow-y', `${Math.min(100, Math.max(0, (y / Math.max(1, rect.height)) * 100)).toFixed(1)}%`);
      surface.classList.add('is-tilting');
    };

    surface.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      nextEvent = event;
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(render);
    }, { passive: true });

    surface.addEventListener('pointerleave', () => {
      nextEvent = null;
      surface.classList.remove('is-tilting');
      surface.style.setProperty('--motion-rx', '0deg');
      surface.style.setProperty('--motion-ry', '0deg');
    });
  });
}

function setupPageHeroDepth(document, window) {
  const hero = document.querySelector('.page-hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frameRequested = false;

  const update = () => {
    frameRequested = false;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
    hero.style.setProperty('--page-hero-depth', `${getDepthOffset(progress, 18)}px`);
    hero.style.setProperty('--page-media-y', `${-getDepthOffset(progress, 14)}px`);
    hero.style.setProperty('--page-orbit-shift', `${getDepthOffset(progress, 34)}px`);
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
}

function setupScrollEffects(document, window) {
  const root = document.documentElement;
  const progress = document.querySelector('#scroll-progress');
  const hero = document.querySelector('.hero');
  const links = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameRequested = false;

  const update = () => {
    frameRequested = false;
    const scrollY = window.scrollY;
    const pageProgress = getScrollProgress(scrollY, root.scrollHeight, window.innerHeight);
    progress?.style.setProperty('--scroll-progress', String(pageProgress));

    if (!reduceMotion && hero) {
      const heroProgress = Math.min(1, scrollY / Math.max(1, hero.offsetHeight));
      root.style.setProperty('--hero-shift', `${(heroProgress * 34).toFixed(2)}px`);
      root.style.setProperty('--orbit-shift', `${(heroProgress * -48).toFixed(2)}px`);
      root.style.setProperty('--sheen-shift', `${(pageProgress * 36).toFixed(2)}vw`);
    }

    const positions = sections.map((section) => ({
      id: section.id,
      top: section.getBoundingClientRect().top,
      bottom: section.getBoundingClientRect().bottom,
    }));
    const activeId = getActiveSectionId(positions, 120);
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
}

async function setupHeroBackgroundVideo(document, window) {
  const signalReady = () => window.dispatchEvent(new Event('awag:hero-ready'));
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    signalReady();
    return;
  }

  const desktopVisuals = getHeroVideoVisuals(1200);
  const mobileVisuals = getHeroVideoVisuals(390);

  if (!document.querySelector('#hero-video-styles')) {
    const style = document.createElement('style');
    style.id = 'hero-video-styles';
    style.textContent = `
      .hero { isolation: isolate; }
      .hero-bg-video,
      .hero-bg-video-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }
      .hero-bg-video {
        object-fit: cover;
        object-position: center;
        opacity: 0;
        transform: scale(1.02);
        filter: saturate(.86) contrast(.96);
        transition: opacity .8s ease;
      }
      .hero-bg-video.ready { opacity: ${desktopVisuals.opacity}; }
      .hero-bg-video-overlay {
        background: ${desktopVisuals.overlay};
      }
      .hero::before,
      .hero-orbit { z-index: 1; }
      .hero-grid { z-index: 2; }
      .hero-swoop { z-index: 3; }
      @media (max-width: 768px) {
        .hero-bg-video.ready { opacity: ${mobileVisuals.opacity}; }
        .hero-bg-video-overlay {
          background: ${mobileVisuals.overlay};
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-bg-video { display: none; }
      }
    `;
    document.head.append(style);
  }

  const video = document.createElement('video');
  video.className = 'hero-bg-video';
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.disablePictureInPicture = true;

  const overlay = document.createElement('div');
  overlay.className = 'hero-bg-video-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  hero.prepend(overlay);
  hero.prepend(video);

  const parts = [
    'assets/video/hero-bg.part01a1.b64',
    'assets/video/hero-bg.part01a2.b64',
    'assets/video/hero-bg.part01a3.b64',
    'assets/video/hero-bg.part01b.b64',
    ...Array.from(
      { length: 8 },
      (_, index) => `assets/video/hero-bg.part${String(index + 2).padStart(2, '0')}.b64`,
    ),
  ];

  try {
    const chunks = await Promise.all(parts.map(async (path) => {
      const response = await window.fetch(path, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return response.text();
    }));

    const base64 = chunks.join('').replace(/\s+/g, '');
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const objectUrl = window.URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
    video.src = objectUrl;
    video.addEventListener('loadeddata', () => {
      video.classList.add('ready');
      video.play().catch(() => {});
      signalReady();
    }, { once: true });
    video.addEventListener('error', signalReady, { once: true });
    video.load();

    window.addEventListener('pagehide', () => {
      window.URL.revokeObjectURL(objectUrl);
    }, { once: true });
  } catch (error) {
    console.warn('Hero background video unavailable; using the blue fallback.', error);
    video.remove();
    overlay.remove();
    signalReady();
  }
}

export function initMotion(document = globalThis.document, window = globalThis.window) {
  if (!document || !window) return;
  document.documentElement.classList.add('motion-ready');
  setupHeroBackgroundVideo(document, window);
  observeReveals(prepareReveals(document, window.innerWidth), window);
  setupInteractiveSurfaces(document, window);
  setupPageHeroDepth(document, window);
  setupScrollEffects(document, window);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initMotion(document, window);
}
