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

`src/_lib/seo.js` creates WebSite, page-specific WebPage/ContactPage/AboutPage/
CollectionPage, and breadcrumb data. Visible breadcrumb links and JSON-LD share
the same hierarchy: site → Blog → category → article. Category ItemList data
follows the actual featured-first order of the visible cards.

BlogPosting headlines match visible H1 text, rather than the shorter SEO title.
Posts connect to a Blog entity and a named Person author with an `/about/` URL.
Article images reference relevant, visible screenshots or diagrams. Author links,
publication dates, and substantive update dates are visible without JavaScript.
Support FAQPage markup uses the same questions and answers as the visible FAQ,
including release-dependent purchasing answers. Google generally limits FAQ rich
results to authoritative government and health sites; this markup makes no claim
of rich-result eligibility for Trayage.

SoftwareApplication data is limited to the homepage and download page. The direct
download and version follow the verified release settings; the paid offer also
requires checkout to be enabled. Kyle Reddoch is the Person publisher and seller;
RelayByte is a Brand. No review scores, endorsements, or unavailable App Store
offers are added.

Publication approval, a site origin, and page indexing settings control canonical
URLs, structured data, and sitemap membership. Error pages and `noindex: true`
pages are excluded. Drafts produce no page. Draft/noindex posts are excluded from
Blog/category listings, structured lists, related reading, and RSS. Unapproved builds retain `noindex, nofollow` and a disallow-all
robots file. Approved pages allow large image previews. Sitemap URLs honor the
deployment prefix. Do not add automatic build-time `lastmod` dates; supply those
only when real content modification dates are available. Posts use front-matter
`updated`, falling back to their publication date. Other pages omit `lastmod`
unless an explicit `updated` date exists. Do not change article dates merely
because the site was rebuilt or technical metadata changed.

## AI search and answer engines

Guidance checked October 7, 2026. Google's AI Overviews and AI Mode use normal
search eligibility: crawlable, indexable pages, eligible snippets, useful text,
clear internal links, and structured data matching visible content. There is no
special AI schema, mandatory `llms.txt`, or guaranteed way to obtain citations.
This site therefore keeps important facts and article content in the initial HTML,
links authors and primary references, and avoids hidden summaries or bot-only claims.

`robots.txt` explicitly allows OAI-SearchBot and PerplexityBot as well as the
existing wildcard public access. Googlebot and bingbot inherit the wildcard rule.
OAI-SearchBot controls ChatGPT search access; GPTBot is a separate training
crawler. This work does not change the existing training-crawler policy. A
successful request using a bot User-Agent checks server behavior, not proof that
the actual crawler IP range can reach the site or that any engine has indexed it.

Search Console and Bing Webmaster Tools remain the sources for actual indexing,
impressions, crawl failures, and available AI citation reports. This repository
contains no account verification tokens and cannot prove account-level setup.
Keep monitoring meaningful query impressions and visits to downloads; structured
data is descriptive, not a ranking or citation guarantee.

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
- [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google FAQ structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- [OpenAI crawler controls](https://developers.openai.com/api/docs/bots)
- [Perplexity crawler controls](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Open Graph image properties](https://ogp.me/)
- Artwork research: [DaisyDisk](https://daisydiskapp.com/) and
  [CleanMyMac](https://macpaw.com/cleanmymac), inspected October 2, 2026.
  Both use 1200 × 630 social cards with a prominent product visual. Trayage's
  composition and file-card illustrations are original.
