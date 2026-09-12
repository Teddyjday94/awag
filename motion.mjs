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

function prepareReveals(document, viewportWidth) {
  const standalone = [
    ...document.querySelectorAll('.section-heading, .proof-grid, .areas-inner > div, .area-list, .cta-band-inner, .quote-copy, .quote-form, .footer-grid'),
  ];
  standalone.forEach((element) => element.classList.add('reveal'));

  const groups = document.querySelectorAll('.service-grid, .gallery-grid, .why-grid, .check-list');
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

export function initMotion(document = globalThis.document, window = globalThis.window) {
  if (!document || !window) return;
  document.documentElement.classList.add('motion-ready');
  observeReveals(prepareReveals(document, window.innerWidth), window);
  setupScrollEffects(document, window);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initMotion(document, window);
}
