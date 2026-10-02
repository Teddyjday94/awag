// Google Analytics 4. Paste the Measurement ID from GA4 (Admin > Data streams > Web) below.
// Tracking only runs on the live domain, so local testing and Vercel previews stay out of the reports.
(() => {
  const GA_MEASUREMENT_ID = '';
  const LIVE_HOST = /(^|\.)ascensionwashngeaux\.com$/;

  if (!/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) || !LIVE_HOST.test(location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(tag);

  const send = (name, params = {}) => window.gtag('event', name, { page_path: location.pathname, ...params });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    const placement = link.closest('.mobile-action-bar') ? 'mobile_bar'
      : link.closest('header, .topbar') ? 'header'
      : link.closest('footer') ? 'footer' : 'page';
    if (href.startsWith('tel:')) send('click_to_call', { placement });
    else if (href.startsWith('mailto:')) send('click_email', { placement });
    else if (href.includes('facebook.com')) send('click_social', { network: 'facebook', placement });
  });

  document.addEventListener('awag:estimate-submitted', (event) => {
    send('generate_lead', { form: 'estimate', service: event.detail?.service || '' });
  });
})();
