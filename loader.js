(() => {
  const root = document.documentElement;
  const loader = document.getElementById('site-loader');
  if (!loader || root.classList.contains('site-loader-seen') || !root.classList.contains('site-loader-active')) return;

  const video = document.getElementById('site-loader-video');
  const fill = document.getElementById('site-loader-progress-fill');
  const percentLabel = document.getElementById('site-loader-percent');
  const progressEl = document.getElementById('site-loader-progress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroRequired = Boolean(document.querySelector('.hero')) && !reduceMotion;
  const startedAt = performance.now();
  const minimumVisible = reduceMotion ? 450 : 2400;
  const maximumVisible = reduceMotion ? 2200 : 8000;

  let current = 0;
  let target = 4;
  let domReady = document.readyState !== 'loading';
  let pageLoaded = document.readyState === 'complete';
  let fontsReady = !document.fonts;
  let heroReady = !heroRequired;
  let videoReady = reduceMotion;
  let completing = false;
  let forced = false;

  const inertSiblings = [...document.body.children].filter((element) => element !== loader);
  inertSiblings.forEach((element) => { try { element.inert = true; } catch (_) {} });

  const setTargetFromMilestones = () => {
    let milestone = 4;
    if (videoReady) milestone += 18;
    if (domReady) milestone += 18;
    if (fontsReady) milestone += 16;
    if (pageLoaded) milestone += 26;
    if (heroReady) milestone += 14;
    target = Math.max(target, Math.min(94, milestone));
  };

  const updateProgressUi = (value) => {
    const safe = Math.max(0, Math.min(100, value));
    const rounded = Math.round(safe);
    fill?.style.setProperty('--loader-progress', `${safe}%`);
    if (percentLabel) percentLabel.textContent = `${rounded}%`;
    progressEl?.setAttribute('aria-valuenow', String(rounded));
  };

  const resourcesReady = () => pageLoaded && fontsReady && heroReady;

  const cleanup = () => {
    root.classList.remove('site-loader-active', 'site-loader-revealing');
    root.classList.add('site-loader-seen', 'site-loader-done');
    loader.setAttribute('aria-busy', 'false');
    inertSiblings.forEach((element) => { try { element.inert = false; } catch (_) {} });
    try { sessionStorage.setItem('awagSiteLoaderSeen', '1'); } catch (_) {}
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    window.setTimeout(() => loader.remove(), 80);
  };

  const complete = () => {
    if (completing) return;
    completing = true;
    current = 100;
    target = 100;
    updateProgressUi(100);
    loader.classList.add('is-completing');
    root.classList.add('site-loader-revealing');
    window.setTimeout(() => loader.classList.add('is-exiting'), reduceMotion ? 120 : 560);
    window.setTimeout(cleanup, reduceMotion ? 420 : 1180);
  };

  const maybeComplete = () => {
    const elapsed = performance.now() - startedAt;
    if ((resourcesReady() && elapsed >= minimumVisible) || forced) {
      target = 100;
    }
  };

  const tick = () => {
    setTargetFromMilestones();
    maybeComplete();

    const distance = target - current;
    if (distance > 0.01) {
      const step = Math.max(0.18, distance * (target === 100 ? 0.12 : 0.055));
      current = Math.min(target, current + step);
      updateProgressUi(current);
    }

    if (target === 100 && current >= 99.35) {
      complete();
      return;
    }
    if (!completing) window.requestAnimationFrame(tick);
  };

  if (video && !reduceMotion) {
    const src = video.dataset.src;
    const markVideoReady = () => {
      videoReady = true;
      setTargetFromMilestones();
    };
    video.addEventListener('loadeddata', markVideoReady, { once: true });
    video.addEventListener('error', markVideoReady, { once: true });
    if (src) {
      video.src = src;
      video.load();
      const play = () => video.play().catch(() => {});
      if (video.readyState >= 2) play();
      else video.addEventListener('canplay', play, { once: true });
    }
  }

  if (!domReady) {
    document.addEventListener('DOMContentLoaded', () => {
      domReady = true;
      setTargetFromMilestones();
    }, { once: true });
  }

  if (!pageLoaded) {
    window.addEventListener('load', () => {
      pageLoaded = true;
      setTargetFromMilestones();
      maybeComplete();
    }, { once: true });
  }

  if (document.fonts) {
    document.fonts.ready.then(() => {
      fontsReady = true;
      setTargetFromMilestones();
      maybeComplete();
    }).catch(() => {
      fontsReady = true;
      maybeComplete();
    });
  }

  if (heroRequired) {
    window.addEventListener('awag:hero-ready', () => {
      heroReady = true;
      setTargetFromMilestones();
      maybeComplete();
    }, { once: true });
  }

  window.setTimeout(() => {
    forced = true;
    target = 100;
  }, maximumVisible);

  setTargetFromMilestones();
  updateProgressUi(0);
  window.requestAnimationFrame(tick);
})();
