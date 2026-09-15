(() => {
  const phoneGlyph = '\u260E';
  const svgNamespace = 'http://www.w3.org/2000/svg';

  document.querySelectorAll('.contact-list a[href^="tel:"] > span[aria-hidden="true"]').forEach((element) => {
    if (element.textContent?.trim() !== phoneGlyph) return;

    element.textContent = '';
    element.classList.add('contact-phone-icon');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.08 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z');
    svg.append(path);
    element.append(svg);
  });
})();

(() => {
  const slider = document.querySelector('#hero-slider');
  if (!slider) return;

  const clip = slider.querySelector('.ba-clip');
  const beforeImage = clip.querySelector('.ba-before');
  const handle = slider.querySelector('.ba-handle');
  let value = 50;
  let dragging = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let dragIntent = null;

  // Keep vertical page scrolling and pinch zoom available on mobile, while
  // reserving horizontal gestures for the before/after comparison slider.
  slider.style.touchAction = 'pan-y pinch-zoom';

  const update = (nextValue) => {
    value = Math.max(0, Math.min(100, Math.round(nextValue)));
    clip.style.width = `${value}%`;
    beforeImage.style.width = `${slider.getBoundingClientRect().width}px`;
    handle.style.left = `${value}%`;
    slider.setAttribute('aria-valuenow', String(value));
    slider.setAttribute('aria-valuetext', `${value} percent before image`);
  };

  const updateFromPointer = (event) => {
    const rect = slider.getBoundingClientRect();
    update(((event.clientX - rect.left) / rect.width) * 100);
  };

  const endDrag = (event) => {
    if (event && activePointerId !== null && event.pointerId !== activePointerId) return;
    dragging = false;
    dragIntent = null;
    if (event && slider.hasPointerCapture?.(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }
    activePointerId = null;
  };

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragIntent = event.pointerType === 'touch' ? null : 'horizontal';
    slider.setPointerCapture(event.pointerId);

    // Mouse/pen users expect an immediate jump. On touch, wait until we know
    // whether the user intends to drag the slider or scroll the page.
    if (event.pointerType !== 'touch') updateFromPointer(event);
  });

  slider.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;

    if (event.pointerType === 'touch' && dragIntent === null) {
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);

      // Ignore tiny finger movement so the slider does not feel twitchy.
      if (Math.max(deltaX, deltaY) < 7) return;

      if (deltaY > deltaX) {
        // A mostly vertical gesture belongs to normal page scrolling.
        endDrag(event);
        return;
      }

      dragIntent = 'horizontal';
    }

    if (dragIntent === 'horizontal') updateFromPointer(event);
  });

  slider.addEventListener('pointerup', (event) => {
    if (dragging && dragIntent === 'horizontal') updateFromPointer(event);
    endDrag(event);
  });
  slider.addEventListener('pointercancel', endDrag);
  slider.addEventListener('lostpointercapture', () => {
    dragging = false;
    dragIntent = null;
    activePointerId = null;
  });
  slider.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      update(value - (event.shiftKey ? 10 : 2));
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      update(value + (event.shiftKey ? 10 : 2));
    }
    if (event.key === 'Home') update(0);
    if (event.key === 'End') update(100);
  });
  window.addEventListener('resize', () => update(value));
  update(50);
})();

(() => {
  const toggle = document.querySelector('#nav-toggle');
  const nav = document.querySelector('#main-nav');
  const header = document.querySelector('#site-header');

  const closeNav = () => {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('nav-open');
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      document.body.classList.toggle('nav-open', open);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
})();

(() => {
  const lightbox = document.querySelector('#lightbox');
  const grid = document.querySelector('#gallery-grid');
  if (!lightbox || !grid) return;

  const figures = [...grid.querySelectorAll('.gallery-item')];
  const image = lightbox.querySelector('#lightbox-img');
  const caption = lightbox.querySelector('#lightbox-caption');
  const closeButton = lightbox.querySelector('#lightbox-close');
  const previousButton = lightbox.querySelector('#lightbox-prev');
  const nextButton = lightbox.querySelector('#lightbox-next');
  let currentIndex = 0;
  let returnFocus = null;

  const show = (index) => {
    currentIndex = (index + figures.length) % figures.length;
    const figure = figures[currentIndex];
    const source = figure.querySelector('img');
    image.src = source.src;
    image.alt = source.alt;
    caption.textContent = figure.querySelector('figcaption')?.textContent.trim() || '';
  };

  const open = (index) => {
    returnFocus = document.activeElement;
    show(index);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    returnFocus?.focus();
  };

  figures.forEach((figure, index) => {
    figure.addEventListener('click', () => open(index));
    figure.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(index);
      }
    });
  });
  closeButton.addEventListener('click', close);
  previousButton.addEventListener('click', () => show(currentIndex - 1));
  nextButton.addEventListener('click', () => show(currentIndex + 1));
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) close(); });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(currentIndex - 1);
    if (event.key === 'ArrowRight') show(currentIndex + 1);
    if (event.key === 'Tab') {
      const controls = [closeButton, previousButton, nextButton];
      const current = controls.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) { event.preventDefault(); controls.at(-1).focus(); }
      if (!event.shiftKey && current === controls.length - 1) { event.preventDefault(); controls[0].focus(); }
    }
  });
})();

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
