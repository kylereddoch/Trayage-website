# Search and social previews

The shared layout emits search descriptions, page-specific titles, canonical URLs,
Open Graph metadata, X large-image cards, author information, and JSON-LD in the
initial HTML. Crawlers do not need JavaScript. The homepage describes the released
product without hardcoding an availability claim.

## Content and artwork

- Edit page descriptions and optional `seoTitle` values in `src/*.11ty.js`.
- The shared product description is in `src/_lib/seo.js`.
- Social image settings and the X account are in `src/_data/site.json` under `seo`.
- The approved image is `public/assets/trayage-social.png`, 1200 × 630 pixels.
  Its editable layout is `scripts/social-card.mjs`. Run `npm run social:build` to
  regenerate it using Playwright Chromium, or set `PLAYWRIGHT_EXECUTABLE_PATH` to
  an installed compatible browser. The normal build uses the checked-in PNG.
- The artwork uses Trayage's original icon, website colors and typography. The
  layout uses system sans-serif and Georgia; font rendering can vary by platform.

## Structured data and indexing

`src/_lib/seo.js` creates WebSite, WebPage/ContactPage, and breadcrumb data.
SoftwareApplication data is limited to the homepage and download page. The direct
download and version follow the verified release settings; the paid offer also
requires checkout to be enabled. Kyle Reddoch is the Person publisher and seller;
RelayByte is a Brand. No review scores, endorsements, or unavailable App Store
offers are added.

Publication approval, a site origin, and page indexing settings control canonical
URLs, structured data, and sitemap membership. Error pages and `noindex: true`
pages are excluded. Unapproved builds retain `noindex, nofollow` and a disallow-all
robots file. Approved pages allow large image previews. Sitemap URLs honor the
deployment prefix. Do not add automatic build-time `lastmod` dates; supply those
only when real content modification dates are available.

Run `npm run check` before release. The checks cover root and GitHub project-path
deployments, JavaScript-disabled metadata, image dimensions, sitemap membership,
real 404 responses, publication guards, release switches, and JSON-LD escaping,
alongside the existing accessibility, responsive, navigation, and purchase checks.

## After deployment

1. Check the live homepage, download page, `/robots.txt`, `/sitemap.xml`, and
   `/assets/trayage-social.png` after the Pages workflow succeeds.
2. In the owner's Google Search Console and Bing Webmaster Tools accounts, verify
   the `trayage.app` property and submit `https://trayage.app/sitemap.xml`.
   Domain verification uses each provider's actual DNS token; no tokens or
   account-level submissions are included in this code change.
3. Inspect the homepage and download URL in Search Console, and run Google's Rich
   Results Test. Valid software markup does not guarantee a rich result. Do not
   invent ratings to satisfy eligibility requirements.
4. Check shared-link previews after deployment. Platforms may cache old artwork;
   use their inspection tools to request a refresh if needed.

## References

- [Google software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Open Graph image properties](https://ogp.me/)
- Artwork research: [DaisyDisk](https://daisydiskapp.com/) and
  [CleanMyMac](https://macpaw.com/cleanmymac), inspected October 2, 2026.
  Both use 1200 × 630 social cards with a prominent product visual. Trayage's
  composition and file-card illustrations are original.
