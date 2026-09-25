(() => {
  const logos = [...document.querySelectorAll('.brand-logo')];
  if (!logos.length) return;

  const revealOriginal = () => logos.forEach((logo) => { logo.style.visibility = ''; });
  logos.forEach((logo) => { logo.style.visibility = 'hidden'; });

  const source = new Image();
  source.decoding = 'async';
  source.src = logos[0].currentSrc || logos[0].src;

  const renderHeaderLogoCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      revealOriginal();
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 750, 70, 338, 338, 0, 0, 440, 440);
    const croppedLogo = canvas.toDataURL('image/png');

    logos.forEach((logo) => {
      logo.src = croppedLogo;
      logo.removeAttribute('srcset');
      logo.style.objectFit = 'cover';
      logo.style.visibility = '';
    });
  };

  if (source.complete && source.naturalWidth) renderHeaderLogoCrop();
  else {
    source.addEventListener('load', renderHeaderLogoCrop, { once: true });
    source.addEventListener('error', revealOriginal, { once: true });
  }
})();

(() => {
  const slider = document.querySelector('#hero-slider');
  if (!slider) return;

  const clip = slider.querySelector('.ba-clip');
  const handle = slider.querySelector('.ba-handle');
  if (!clip || !handle) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let targetValue = 50;
  let renderedValue = 50;
  let animationFrame = null;
  let touchPointerId = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchIntent = null;

  const clamp = (value) => Math.max(0, Math.min(100, value));

  const render = (value) => {
    const safeValue = clamp(value);
    clip.style.clipPath = `inset(0 ${100 - safeValue}% 0 0)`;
    handle.style.left = `${safeValue}%`;
    slider.setAttribute('aria-valuenow', String(Math.round(safeValue)));
    slider.setAttribute('aria-valuetext', `${Math.round(safeValue)} percent before image revealed`);
  };

  const animateReveal = () => {
    const distance = targetValue - renderedValue;
    const easing = Math.min(0.28, 0.14 + Math.abs(distance) * 0.002);
    renderedValue += distance * easing;

    if (Math.abs(distance) < 0.04) {
      renderedValue = targetValue;
      animationFrame = null;
      render(renderedValue);
      return;
    }

    render(renderedValue);
    animationFrame = window.requestAnimationFrame(animateReveal);
  };

  const setTarget = (value, immediate = false) => {
    targetValue = clamp(value);

    if (immediate || reducedMotion) {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      renderedValue = targetValue;
      render(renderedValue);
      return;
    }

    if (animationFrame === null) animationFrame = window.requestAnimationFrame(animateReveal);
  };

  const valueFromPointer = (event) => {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return targetValue;
    return ((event.clientX - rect.left) / rect.width) * 100;
  };

  const endTouch = (event) => {
    if (event && touchPointerId !== null && event.pointerId !== touchPointerId) return;
    if (touchPointerId !== null && slider.hasPointerCapture?.(touchPointerId)) {
      slider.releasePointerCapture(touchPointerId);
    }
    touchPointerId = null;
    touchIntent = null;
    slider.classList.remove('is-revealing');
  };

  slider.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    slider.classList.add('is-revealing');
    setTarget(valueFromPointer(event));
  });

  slider.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      slider.classList.add('is-revealing');
      setTarget(valueFromPointer(event));
      return;
    }

    if (event.pointerType !== 'touch' || event.pointerId !== touchPointerId) return;

    if (touchIntent === null) {
      const deltaX = Math.abs(event.clientX - touchStartX);
      const deltaY = Math.abs(event.clientY - touchStartY);
      if (Math.max(deltaX, deltaY) < 7) return;

      if (deltaY > deltaX) {
        endTouch(event);
        return;
      }

      touchIntent = 'horizontal';
      slider.setPointerCapture?.(event.pointerId);
      slider.classList.add('is-revealing');
    }

    if (touchIntent === 'horizontal') {
      event.preventDefault();
      setTarget(valueFromPointer(event));
    }
  });

  slider.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    slider.classList.remove('is-revealing');
    setTarget(50);
  });

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    touchPointerId = event.pointerId;
    touchStartX = event.clientX;
    touchStartY = event.clientY;
    touchIntent = null;
  });

  slider.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'touch' && touchIntent === 'horizontal') setTarget(valueFromPointer(event));
    endTouch(event);
  });
  slider.addEventListener('pointercancel', endTouch);
  slider.addEventListener('lostpointercapture', () => {
    touchPointerId = null;
    touchIntent = null;
    slider.classList.remove('is-revealing');
  });

  slider.addEventListener('focus', () => slider.classList.add('is-revealing'));
  slider.addEventListener('blur', () => {
    slider.classList.remove('is-revealing');
    setTarget(50);
  });

  slider.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      setTarget(targetValue - (event.shiftKey ? 10 : 3));
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      setTarget(targetValue + (event.shiftKey ? 10 : 3));
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setTarget(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setTarget(100);
    }
  });

  render(50);
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
