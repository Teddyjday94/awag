(() => {
  const slider = document.querySelector('#hero-slider');
  if (!slider) return;

  const clip = slider.querySelector('.ba-clip');
  const beforeImage = clip.querySelector('.ba-before');
  const handle = slider.querySelector('.ba-handle');
  let value = 50;
  let dragging = false;

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

  slider.addEventListener('pointerdown', (event) => {
    dragging = true;
    slider.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  });
  slider.addEventListener('pointermove', (event) => {
    if (dragging) updateFromPointer(event);
  });
  slider.addEventListener('pointerup', (event) => {
    dragging = false;
    slider.releasePointerCapture(event.pointerId);
  });
  slider.addEventListener('pointercancel', () => { dragging = false; });
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
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((element) => element.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
  elements.forEach((element) => observer.observe(element));
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

(() => {
  const form = document.querySelector('#quote-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const field = (name) => String(data.get(name) || '').trim();
    const subject = encodeURIComponent(`Free Quote Request - ${field('name')}`);
    const body = encodeURIComponent([
      `Name: ${field('name')}`,
      `Phone: ${field('phone')}`,
      `Email: ${field('email')}`,
      `Address/Area: ${field('address')}`,
      `Service: ${field('service')}`,
      '',
      'Details:',
      field('message')
    ].join('\n'));
    window.location.href = `mailto:awngeaux@gmail.com?subject=${subject}&body=${body}`;
  });
})();

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
