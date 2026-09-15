(() => {
  const slider = document.querySelector('#hero-slider');
  if (!slider) return;

  const clip = slider.querySelector('.ba-clip');
  const beforeImage = clip?.querySelector('.ba-before');
  const handle = slider.querySelector('.ba-handle');
  if (!clip || !beforeImage || !handle) return;

  let value = 50;
  let dragging = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let dragIntent = null;

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

  const releaseCapture = (pointerId) => {
    if (pointerId !== null && slider.hasPointerCapture?.(pointerId)) slider.releasePointerCapture(pointerId);
  };

  const endDrag = (event) => {
    if (event && activePointerId !== null && event.pointerId !== activePointerId) return;
    releaseCapture(activePointerId);
    dragging = false;
    dragIntent = null;
    activePointerId = null;
  };

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragIntent = event.pointerType === 'touch' ? null : 'horizontal';

    if (event.pointerType !== 'touch') {
      slider.setPointerCapture?.(event.pointerId);
      updateFromPointer(event);
    }
  });

  slider.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;

    if (event.pointerType === 'touch' && dragIntent === null) {
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);
      if (Math.max(deltaX, deltaY) < 7) return;

      if (deltaY > deltaX) {
        endDrag(event);
        return;
      }

      dragIntent = 'horizontal';
      slider.setPointerCapture?.(event.pointerId);
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
  const buttons = [...document.querySelectorAll('[data-gallery-filter]')];
  const grid = document.querySelector('#gallery-grid');
  if (!buttons.length || !grid) return;

  const figures = [...grid.querySelectorAll('.gallery-item')];

  const applyFilter = (category) => {
    buttons.forEach((button) => {
      const active = button.dataset.galleryFilter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    figures.forEach((figure) => {
      const match = category === 'all' || figure.dataset.galleryCategory === category;
      figure.hidden = !match;
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.galleryFilter || 'all'));
  });
})();

(() => {
  const lightbox = document.querySelector('#lightbox');
  const grid = document.querySelector('#gallery-grid');
  if (!lightbox || !grid) return;

  const allFigures = [...grid.querySelectorAll('.gallery-item')];
  const image = lightbox.querySelector('#lightbox-img');
  const caption = lightbox.querySelector('#lightbox-caption');
  const closeButton = lightbox.querySelector('#lightbox-close');
  const previousButton = lightbox.querySelector('#lightbox-prev');
  const nextButton = lightbox.querySelector('#lightbox-next');
  if (!image || !caption || !closeButton || !previousButton || !nextButton) return;

  let currentFigure = null;
  let returnFocus = null;

  const visibleFigures = () => allFigures.filter((figure) => !figure.hidden);

  const showFigure = (figure) => {
    if (!figure) return;
    currentFigure = figure;
    const source = figure.querySelector('img');
    image.src = source?.src || '';
    image.alt = source?.alt || '';
    caption.textContent = figure.querySelector('figcaption')?.textContent.trim() || '';
  };

  const move = (direction) => {
    const figures = visibleFigures();
    if (!figures.length) return;
    const currentIndex = Math.max(0, figures.indexOf(currentFigure));
    const nextIndex = (currentIndex + direction + figures.length) % figures.length;
    showFigure(figures[nextIndex]);
  };

  const open = (figure) => {
    returnFocus = document.activeElement;
    showFigure(figure);
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

  allFigures.forEach((figure) => {
    figure.addEventListener('click', () => open(figure));
    figure.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(figure);
      }
    });
  });

  closeButton.addEventListener('click', close);
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'Tab') {
      const controls = [closeButton, previousButton, nextButton];
      const current = controls.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) {
        event.preventDefault();
        controls.at(-1).focus();
      }
      if (!event.shiftKey && current === controls.length - 1) {
        event.preventDefault();
        controls[0].focus();
      }
    }
  });
})();

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
