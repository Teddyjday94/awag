# SEO configuration

The public site origin lives in `seo.config.json`. When the real domain is connected:

1. Change `siteUrl` to the final HTTPS origin, without a trailing slash.
2. Run `node scripts/generate-seo.mjs`.
3. Run `node tests/verify-seo.mjs` and the other verification scripts.
4. Deploy the generated HTML, `robots.txt`, and `sitemap.xml` together.
5. Add the final domain to Google Search Console and submit `/sitemap.xml`.

The generator keeps canonical URLs, Open Graph and Twitter metadata, JSON-LD, `robots.txt`, and `sitemap.xml` aligned with the configured origin.
