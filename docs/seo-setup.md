# SEO, Google Business Profile, and Analytics setup

Live site: https://ascensionwashngeaux.com (Vercel project `ascensionwashngeaux`).

The website side is done in code: canonical URLs, social share tags, favicon, LocalBusiness
structured data, `robots.txt`, `sitemap.xml`, and a GA4 loader with lead tracking.
The steps below happen in Google's dashboards and need the business owner's Google account.
Use the **same Google account** for all three so they can be linked.

---

## 1. Google Analytics 4 (about 10 minutes)

1. Go to https://analytics.google.com, then **Admin > Create > Property**.
   - Property name: `Ascension Wash N' Geaux`
   - Time zone: United States, Central Time. Currency: USD.
   - Industry: Home & Garden. Business size: Small.
2. Choose platform **Web**. URL: `https://ascensionwashngeaux.com`. Stream name: `Website`.
3. Copy the **Measurement ID** (looks like `G-ABC123XYZ9`).
4. Paste it into `analytics.js`:
   ```js
   const GA_MEASUREMENT_ID = 'G-ABC123XYZ9';
   ```
   Commit and push. Vercel redeploys automatically.
5. Check it works: open the live site, then in GA go to **Reports > Realtime**. You should see yourself.

### Events the site sends

| Event | When it fires |
|---|---|
| `click_to_call` | Someone taps any phone link (header, page, footer, mobile bar) |
| `click_email` | Someone taps the email link |
| `click_social` | Someone taps the Facebook link |
| `generate_lead` | The estimate form on the Contact page submits successfully |

Each click event includes `placement` (header, page, footer, mobile_bar), so you can see which button gets used.

6. After the events show up (can take up to 24 hours), go to **Admin > Events** and turn on
   **Mark as key event** for `generate_lead` and `click_to_call`. Those are your leads.

Tracking only runs on `ascensionwashngeaux.com`. Local testing and Vercel preview links are not counted.

---

## 2. Google Search Console (about 10 minutes)

1. Go to https://search.google.com/search-console and add a **Domain** property:
   `ascensionwashngeaux.com`.
2. Google gives you a TXT record. Add it at the registrar where the domain was bought
   (DNS settings), then click **Verify**. DNS changes can take a few minutes to an hour.
3. Once verified: **Sitemaps** > enter `sitemap.xml` > Submit.
4. **URL Inspection** > paste `https://ascensionwashngeaux.com/` > **Request indexing**.
   Repeat for the Services and Service Area pages.
5. Link it to Analytics: in GA4, **Admin > Product links > Search Console links**.

---

## 3. Google Business Profile (most important for local search)

This is what puts the business in the Google Maps "map pack" for searches like
"pressure washing Gonzales LA".

1. Go to https://business.google.com and click **Add business**.
2. **Business name:** `Ascension Wash N' Geaux`
   Use the real name only. Adding keywords or city names to it violates Google's rules and can get the profile suspended.
3. **Category:** search for and choose `Pressure washing service` as the primary category.
   You can add secondary categories later in the profile editor if a close match exists
   (for example, roof cleaning or gutter cleaning). Only add ones for work you actually do.
4. **Do you have a location customers can visit?** Choose **No** (service-area business).
   You still enter your address for verification, but Google keeps it hidden.
5. **Service areas:** Gonzales, Prairieville, Baton Rouge, Denham Springs, Ascension Parish.
   Add Sorrento, Geismar, St. Amant, Dutchtown, and Donaldsonville too if you take work there.
6. **Phone:** `(225) 954-1848` **Website:** `https://ascensionwashngeaux.com`
7. **Verification:** Google usually asks for a video showing the truck and equipment,
   your signage or branded vehicle, and proof you run the business (tools, invoice, business license).
   Have the truck and trailer ready to film. Verification can take a few days.

### Fill out the profile after verification

**Description** (paste this; under Google's 750-character limit):

> Ascension Wash N' Geaux is a locally owned soft washing and pressure washing company based in Gonzales, Louisiana. We clean roofs, siding, soffits, driveways, sidewalks, fences, decks, and commercial storefronts across Ascension Parish, Prairieville, Baton Rouge, and Denham Springs. We use low-pressure soft washing on roofs, paint, and siding, and stronger pressure only where concrete and hard surfaces can take it. The owner answers the phone, shows up with the equipment, and checks the work before packing up. Licensed and insured. Free estimates. Call or text (225) 954-1848.

**Services** (add each one under Edit services):

- Soft washing
- Roof and soffit cleaning
- House washing
- Driveway and sidewalk pressure washing
- Fence and deck cleaning
- Commercial exterior cleaning

**Hours:** set your real working hours. The website does not list hours, so decide what you want customers to see.

**Photos:** upload at least 10 from `assets/images/`. The logo, the truck and trailer (`truck-rig.jpg`),
and the before/after shots do the most work. Add new job photos regularly. Active profiles rank better.

**Appointment / booking link:** `https://ascensionwashngeaux.com/contact.html`

### Reviews

Reviews are the biggest ranking factor you control. After the profile is verified:

1. In the profile, click **Ask for reviews** and copy the short link.
2. Text it to every happy customer the day the job finishes.
3. Reply to every review, good or bad.

Once you have that link, send it over and it can be added to the website as a "Leave a review" button.

---

## 4. Keep the business details identical everywhere

Google checks that your name, phone, and website match across the web.
Use exactly these on Facebook, Nextdoor, Yelp, Angi, the BBB, and anywhere else:

- Name: `Ascension Wash N' Geaux`
- Phone: `(225) 954-1848`
- Website: `https://ascensionwashngeaux.com`
- Email: `awngeaux@gmail.com`

Update the website link on the Facebook page (`facebook.com/ascensionwashngeaux`) to the new domain.

---

## 5. Domain housekeeping

- `www.ascensionwashngeaux.com` is attached in Vercel and permanently redirects (308) to
  `https://ascensionwashngeaux.com`, so there is one address for Google to index.
- When pages change, update the `<lastmod>` dates in `sitemap.xml`.
