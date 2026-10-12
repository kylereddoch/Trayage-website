# Search and social previews

The shared layout emits search descriptions, page-specific titles, canonical URLs,
Open Graph metadata, X large-image cards, author information, and JSON-LD in the
initial HTML. Crawlers do not need JavaScript. The homepage describes the released
product without hardcoding an availability claim.

## Content and artwork

- Edit page descriptions and optional `seoTitle` values in `src/*.11ty.js`.
- The shared product description is in `src/_lib/seo.js`.
- Social image settings and the X account are in `src/_data/site.json` under `seo`.
- The current local-review image is `public/assets/trayage-social-v2.png`, 1200 × 630 pixels.
  Its editable layout is `scripts/social-card.mjs`. Run `npm run social:build` to
  regenerate it using Playwright Chromium, or set `PLAYWRIGHT_EXECUTABLE_PATH` to
  an installed compatible browser. The normal build uses the checked-in PNG.
- The artwork uses Trayage's original icon, website colors and typography. The
  layout uses system sans-serif with normally spaced italic emphasis; font rendering can vary by platform.

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
including release-dependent purchasing answers. Google ended FAQ rich results on May 7, 2026 and removed the feature documentation in June. FAQPage remains descriptive markup for the visible questions; it is not a Google rich-result strategy.

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

Guidance rechecked October 12, 2026. Google's AI Overviews and AI Mode use normal
search eligibility: crawlable, indexable pages, eligible snippets, useful text,
clear internal links, and structured data matching visible content. Google’s newer generative-AI guide also identifies a Search Console inclusion setting; that account-level state has not been checked here. There is no
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
   `/assets/trayage-social-v2.png` after the Pages workflow succeeds.
2. In the owner's Google Search Console and Bing Webmaster Tools accounts, verify
   the `trayage.app` property and submit `https://trayage.app/sitemap.xml`.
   Check the Search Console setting for inclusion in Search generative AI features.
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
- [Google generative AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google FAQ rich-result retirement](https://developers.google.com/search/updates)
- [OpenAI crawler controls](https://developers.openai.com/api/docs/bots)
- [Perplexity crawler controls](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Open Graph image properties](https://ogp.me/)
- Artwork research: [DaisyDisk](https://daisydiskapp.com/) and
  [CleanMyMac](https://macpaw.com/cleanmymac), inspected October 2, 2026.
  Both use 1200 × 630 social cards with a prominent product visual. Trayage's
  composition and file-card illustrations are original.

## October 9, 2026 redesign (local review)

The October 9 homepage followed “Give Downloads a second look” and linked plain-language
features to useful articles. It includes recent posts across categories, a
first-review invitation, and a concise comparison linking to `/compare/`.
That page identifies Kyle as the maker, links manufacturer sources, records the
review date, and compares purposes without fabricated performance scores.

New articles cover a first Trayage review and a weekly Downloads routine. The
home FAQs are visible in HTML and have matching FAQPage data in a separate graph
node, preserving SoftwareApplication as the homepage's main entity. Google no longer displays FAQ rich results.

Social previews now use `assets/trayage-social-v2.png` for the site and distinct
1200 × 630 PNGs under `assets/social/` for articles and the comparison. Their
manifest is `src/_data/socialCards.json`; rebuild with `npm run social:build`.
Open Graph and X use the same page-specific image, dimensions, and alt text.
BlogPosting image remains the real product illustration present in each article.
When adding an article, add a preview entry and rebuild; missing entries safely
fall back to the site card. The old site card remains for previously shared URLs.

The site adds no bot-only landing pages, keyword lists, fake reviews, or special
AI markup. Public search access for OAI-SearchBot and PerplexityBot remains in
robots.txt; Google uses the wildcard access. Training controls are unchanged.
Sources rechecked October 9: Google's AI features documentation, OpenAI's crawler
documentation, and Perplexity's crawler documentation linked above.

`MARKETING.md` provides the channel plan, six review-ready post drafts, destination
URLs, measurement boundaries, and release checklist. Posts and new website routes
remain local until separately approved. Sitemap submission, external links,
search indexing, social cache refreshes, and in-app adoption cannot be completed
or proven by local source changes.


## October 12 alignment audit (local review)

- The hero and search description name the concrete job: flag installers, likely duplicates, and large or older downloads as a starting point for review. Finder differences are visible in the homepage FAQ and comparison, with no speed or savings claims.
- Secondary headings now name their subject: Downloads guides, product news, support, purchase options, and media assets. Decorative section labels and numbering were removed from conversion pages; useful category, navigation, and status labels remain.
- Heading and social-card emphasis use system sans-serif italics with normal spacing. The real screenshot opens in a dismissible dialog with keyboard focus restoration and a direct-image fallback.
- Apple’s public lookup for app 6810382134 confirmed version 1.0 and an October 12 release. Shared release data now exposes the store link in downloads, media facts, and SoftwareApplication installUrl/sameAs. Direct paid Offer remains explicitly the direct license; it does not imply the free App Store download costs $29.99.
- Today’s release article has a dedicated social card, a visible image matching BlogPosting.image, and coverage in root/subpath metadata, sitemap, feed, and accessibility checks.
- Comparison manufacturer pages were rechecked October 12; the visible review date and sitemap update date share one source.
- Shared metadata, visible FAQs, breadcrumb lists, author identity, article dates, and featured-first blog ordering are checked against the rendered pages with JavaScript disabled.
- Google’s current guidance: https://developers.google.com/search/docs/appearance/ai-features and https://developers.google.com/search/updates (May 8 / June 15, 2026 FAQ deprecation). Clear source-backed answers remain useful; schema does not establish ranking, indexing, AI citations, or rich-result eligibility.
- Still requires human validation: first-time readers should explain the benefit, difference from Finder, and next step without prompting. Live indexing, Search Console/Bing account state, real crawler access, and conversion outcomes are not verified by local tests. Review the preview before any commit or deployment.

## Finder-focused page revision

The existing /compare/ URL is retained, but its title, description, visible content, and social preview now explain why to use Trayage with Finder. Competitor lists and outbound recommendations are removed. “Why Trayage?” is the footer label. The illustrative duplicate example discloses its limits; the first free-review invitation appears before the detailed explanation. Earlier competitor-comparison audit notes are historical and superseded. No rankings or conversion gains are claimed.


## Roadmap delivery status — October 12

App Store Connect reports version 1.1 build 4 (c687bbc1-0942-4b69-acf6-8b32485a61c8) as IN_BETA_TESTING for internal and external audiences. The public TestFlight page lists its review features. The Mac App Store 1.0 release is recorded separately. Curated delivery records in roadmap.json take precedence over stale GitHub issue status, so deployment sync cannot erase verified beta/release labels. GitHub issues themselves were not edited: their workflow triggers public deployment. Clear the delivery record when deliberately returning an item to ordinary issue-driven status.

New ideas are displayed as under consideration, with no target release: a cleanup summary, saved review locations, and clearer explanations. Prioritize completing 1.1 purchase/restore, cleanup, notification, and accessibility acceptance before expanding scope.
