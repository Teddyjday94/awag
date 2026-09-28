import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('seo.config.json', root), 'utf8'));
const siteUrl = config.siteUrl.replace(/\/$/, '');

if (!/^https:\/\/[^/]+$/i.test(siteUrl)) {
  throw new Error('seo.config.json siteUrl must be an HTTPS origin without a path.');
}

const businessName = "Ascension Wash N' Geaux";
const pages = [
  {
    file: 'index.html',
    path: '/',
    title: "Pressure Washing in Gonzales, LA | Ascension Wash N' Geaux",
    description: "Get professional pressure washing and soft washing in Gonzales, Prairieville, Baton Rouge, Denham Springs, and across Ascension Parish. Free estimates.",
    image: '/assets/images/hero-after.jpg',
  },
  {
    file: 'services.html',
    path: '/services.html',
    title: "Pressure & Soft Washing Services | Gonzales, LA",
    description: "Explore house washing, roof soft washing, concrete cleaning, fence and deck washing, and commercial exterior cleaning in Gonzales and Ascension Parish.",
    image: '/assets/images/roof-shingle-before-after-main.jpg',
  },
  {
    file: 'gallery.html',
    path: '/gallery.html',
    title: "Pressure Washing Before & After Gallery | Gonzales, LA",
    description: "See real pressure washing and soft washing results from homes and businesses in Gonzales and Ascension Parish, including roofs, siding, concrete, and fences.",
    image: '/assets/images/gable-ba.jpg',
  },
  {
    file: 'about.html',
    path: '/about.html',
    title: "Local Pressure Washing Company | Gonzales, LA",
    description: "Meet Ascension Wash N' Geaux, a locally owned, licensed, and insured pressure washing company serving Gonzales, Ascension Parish, and nearby communities.",
    image: '/assets/images/truck-rig.jpg',
  },
  {
    file: 'service-area.html',
    path: '/service-area.html',
    title: "Pressure Washing Service Area | Ascension Parish, LA",
    description: "Pressure washing and soft washing in Gonzales, Prairieville, Baton Rouge, Denham Springs, and communities throughout Ascension Parish. Check your address.",
    image: '/assets/images/estate-driveway.jpg',
  },
  {
    file: 'contact.html',
    path: '/contact.html',
    title: "Free Pressure Washing Quote | Gonzales, LA",
    description: "Request a free pressure washing or soft washing estimate in Gonzales and Ascension Parish. Call, text, email, or send your property details online.",
    image: '/assets/images/porch-ba1.jpg',
  },
];

const areas = [
  { '@type': 'City', name: 'Gonzales' },
  { '@type': 'City', name: 'Prairieville' },
  { '@type': 'City', name: 'Baton Rouge' },
  { '@type': 'City', name: 'Denham Springs' },
  { '@type': 'AdministrativeArea', name: 'Ascension Parish' },
];

const serviceNames = [
  'House soft washing',
  'Roof soft washing',
  'Driveway and concrete cleaning',
  'Fence and deck washing',
  'Soffit and exterior detail cleaning',
  'Commercial pressure washing',
];

const escapeAttribute = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const structuredDataFor = (page) => {
  const canonical = `${siteUrl}${page.path}`;
  const graph = [
    {
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}/#business`,
      name: businessName,
      alternateName: 'AWAG',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/assets/images/logo.jpg`,
      image: `${siteUrl}${page.image}`,
      telephone: '+1-225-954-1848',
      email: 'awngeaux@gmail.com',
      priceRange: 'Moderate',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Gonzales',
        addressRegion: 'LA',
        addressCountry: 'US',
      },
      areaServed: areas,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Exterior cleaning services',
        itemListElement: serviceNames.map((name) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name },
        })),
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#business` },
      primaryImageOfPage: `${siteUrl}${page.image}`,
    },
  ];

  if (page.path === '/') {
    graph.splice(1, 0, {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: businessName,
      alternateName: 'AWAG',
      publisher: { '@id': `${siteUrl}/#business` },
      inLanguage: 'en-US',
    });
  }

  if (page.file === 'services.html') {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: 'Pressure washing and soft washing',
      serviceType: serviceNames,
      url: canonical,
      provider: { '@id': `${siteUrl}/#business` },
      areaServed: areas,
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replaceAll('<', '\\u003c');
};

const metadataFor = (page) => {
  const canonical = `${siteUrl}${page.path}`;
  const image = `${siteUrl}${page.image}`;
  const title = escapeAttribute(page.title);
  const description = escapeAttribute(page.description);

  return `  <!-- seo:start - generated by scripts/generate-seo.mjs -->
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeAttribute(businessName)}">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="${escapeAttribute(`Exterior cleaning work by ${businessName}`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <script type="application/ld+json">
${structuredDataFor(page)}
  </script>
  <!-- seo:end -->`;
};

for (const page of pages) {
  const url = new URL(page.file, root);
  let html = await readFile(url, 'utf8');
  const block = metadataFor(page);

  if (/\s*<!-- seo:start[\s\S]*?<!-- seo:end -->/.test(html)) {
    html = html.replace(/\s*<!-- seo:start[\s\S]*?<!-- seo:end -->/, `\n${block}`);
  } else {
    html = html
      .replace(/\s*<meta name="description"[^>]*>/, '')
      .replace(/\s*<title>[\s\S]*?<\/title>/, '')
      .replace(/(<meta name="theme-color"[^>]*>)/, `$1\n${block}`);
  }

  await writeFile(url, html);
}

await writeFile(new URL('robots.txt', root), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

const sitemapEntries = pages
  .map((page) => `  <url>\n    <loc>${siteUrl}${page.path}</loc>\n  </url>`)
  .join('\n');

await writeFile(
  new URL('sitemap.xml', root),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
);

console.log(`Generated SEO metadata and crawl files for ${pages.length} pages using ${siteUrl}.`);
