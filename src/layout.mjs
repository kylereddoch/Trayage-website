import { breadcrumbItems } from './_lib/content-index.js';
import { hasDownload } from './_lib/releases.js';
import { techTwitterBadge } from './tech-twitter-badge.mjs';
import { absoluteURL, isIndexable, serializeSchema, structuredData } from './_lib/seo.js';
export const escape = (value) => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const arrow = '<span aria-hidden="true">↗</span>';

function linkEvent(href, tag, site) {
  if (!site.analytics?.enabled) return null;
  const decodedHref = href.replaceAll('&amp;', '&');
  // Preserve TinyShelf's required embed HTML exactly, including the link attributes.
  if (decodedHref === 'https://www.tinyshelf.co/?ref=trayage.app') return null;
  const download = /(?:^|\s)download(?:[\s=>]|$)/i.test(tag);
  if (download) {
    const filename = decodedHref.split(/[?#]/, 1)[0].split('/').pop() || 'download';
    return ['file.download', filename];
  }
  if (decodedHref.startsWith('mailto:')) {
    const subject = new URL(decodedHref).searchParams.get('subject')?.toLowerCase() || '';
    if (subject.includes('refund')) return ['support.refund', 'email'];
    if (subject.includes('media') || subject.includes('press')) return ['support.press', 'email'];
    return ['support.email', 'trayage'];
  }
  if (!/^https?:\/\//i.test(decodedHref)) return null;

  const destination = new URL(decodedHref);
  if (decodedHref === site.links.oneTime) return ['purchase.checkout', 'direct'];
  if (decodedHref === site.links.billing) return ['billing.portal', 'stripe'];
  if (decodedHref === site.links.licenses) return ['license.portal', 'keylight'];
  if (decodedHref === site.links.productHunt) return ['social.producthunt', 'trayage'];
  if (decodedHref === site.links.launchNest) return ['social.launchnest', 'trayage'];
  if (decodedHref === site.links.x) return ['social.x', 'trayage'];
  if (decodedHref === site.links.mastodon) return ['social.mastodon', 'trayage'];
  if (decodedHref === site.publisherURL) return ['publisher.visit', 'relaybyte'];
  if (destination.hostname === 'apps.apple.com') return ['store.view', 'mac-app-store'];
  if (destination.hostname === 'reportaproblem.apple.com') return ['refund.apple', 'report-a-problem'];
  if (destination.hostname === 'github.com' && destination.pathname.includes('/releases/download/')) {
    return ['file.download', destination.pathname.split('/').pop() || 'trayage'];
  }
  if (destination.hostname === 'github.com' && destination.pathname.endsWith('/issues/new')) {
    const template = destination.searchParams.get('template') || '';
    if (template.includes('feature')) return ['feedback.idea', 'github'];
    if (template.includes('bug')) return ['feedback.bug', 'github'];
  }
  if (destination.hostname === 'github.com' && /\/issues\/\d+$/.test(destination.pathname)) {
    return ['roadmap.issue', destination.pathname.split('/').pop()];
  }
  if (destination.hostname === 'github.com' && destination.pathname.includes('/issues')) return ['feedback.issues', 'github'];
  if (/privacy|legal/.test(destination.pathname) || decodedHref === site.analytics.privacyURL) {
    return ['policy.provider', destination.hostname];
  }
  return ['outbound.click', destination.hostname];
}

export function addLinkTracking(html, site) {
  if (!site.analytics?.enabled) return html;
  return html.replace(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi, (tag, href) => {
    if (tag.includes('data-tinylytics-event=')) return tag;
    const event = linkEvent(href, tag, site);
    if (!event) return tag;
    return tag.replace(/>$/, ` data-tinylytics-event="${escape(event[0])}" data-tinylytics-event-value="${escape(event[1])}">`);
  });
}

export function icon(name, className = '') {
  const paths = {
    tray: '<path d="m3 12 3-7h12l3 7v7H3z"/><path d="M3 12h5l2 3h4l2-3h5"/>',
    files: '<rect x="8" y="7" width="12" height="14" rx="2"/><path d="M15 7V3H4v13h4"/>',
    drive: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 14h18m-5 2.5h1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    folder: '<path d="M3 7V5h6l2 2h10v13H3z"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    key: '<circle cx="8" cy="9" r="5"/><path d="m12 13 8 8m-4-4 3-3m-6 0 3-3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    mac: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-5 0h10"/>'
  };
  return `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.tray}</svg>`;
}
export function layout({ title, seoTitle, description, path = '', body, base, site, releases, kind = '', noindex = false, article = false, published, updated, category, collections, faqs, articleImage, articleText }) {
  const url = (part = '') => `${base}${part}`;
  const isHome = path === '';
  const publisherBrand = escape(site.publisherBrand || site.publisher);
  const publisherLabel = site.publisherMark ? `<span class="publisher-brand"><img src="${escape(url(site.publisherMark))}" alt="" width="26" height="26"><span>${publisherBrand}</span></span>` : publisherBrand;
  const publisherCredit = site.publisherURL ? `<a href="${escape(site.publisherURL)}">${publisherLabel}</a>` : publisherLabel;
  const fullTitle = seoTitle || (isHome ? 'Trayage — Downloads Cleanup App for Mac' : `${title} — Trayage`);
  const indexable = isIndexable(site, path, noindex);
  const canonical = indexable ? absoluteURL(site, base, path) : '';
  const socialImage = site.origin ? absoluteURL(site, base, site.seo.image) : '';
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${site.links.mastodon?`<link rel="me" href="${escape(site.links.mastodon)}">`:''}
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f7f6f2">
  <meta name="description" content="${escape(description)}">
  <meta name="author" content="${escape(site.publisher)}">
  <meta name="application-name" content="${escape(site.name)}">
  <meta name="robots" content="${indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}">
  <title>${escape(fullTitle)}</title>
  <meta property="og:title" content="${escape(fullTitle)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="${article ? 'article' : 'website'}">
  ${article && published ? `<meta property="article:published_time" content="${new Date(published).toISOString()}">${updated ? `<meta property="article:modified_time" content="${new Date(updated).toISOString()}">` : ''}` : ''}
  <meta property="og:site_name" content="Trayage">
  <meta property="og:locale" content="en_US">
  ${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}
  ${socialImage ? `<meta property="og:image" content="${escape(socialImage)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="${site.seo.imageWidth}">
  <meta property="og:image:height" content="${site.seo.imageHeight}">
  <meta property="og:image:alt" content="${escape(site.seo.imageAlt)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${escape(site.seo.twitterSite)}">
  <meta name="twitter:title" content="${escape(fullTitle)}">
  <meta name="twitter:description" content="${escape(description)}">
  ${socialImage ? `<meta name="twitter:image" content="${escape(socialImage)}"><meta name="twitter:image:alt" content="${escape(site.seo.imageAlt)}">` : ''}
  ${indexable ? `<script type="application/ld+json">${serializeSchema(structuredData({ site, releases, base, path, title, description, article, published, updated, category, collections, faqs, articleImage, articleText }))}</script>` : ''}
  ${site.publicationApproved && site.origin ? `<link rel="alternate" type="application/rss+xml" title="Trayage Blog" href="${url('blog/feed.xml')}">` : ''}
  <link rel="icon" type="image/png" sizes="64x64" href="${url('assets/favicon.png')}">
  <link rel="apple-touch-icon" href="${url('assets/app-icon.png')}">
  <script src="${url('assets/theme.js')}"></script>
  <link rel="stylesheet" href="${url('assets/site.css')}">
  <link rel="stylesheet" href="${url('assets/theme.css')}">
  <link rel="stylesheet" href="${url('assets/pages.css')}">
  ${path.startsWith('blog/') ? `<link rel="stylesheet" href="${url('assets/blog.css')}">` : ''}
</head>
<body class="${kind}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header wrap">
    <a class="brand" href="${url()}" aria-label="Trayage home"><img src="${url('assets/app-icon.png')}" width="43" height="43" alt=""><span>Trayage<span class="brand-dot">.</span></span></a>
    <nav aria-label="Main navigation">
      <a href="${url('#overview')}">Overview</a>
      <a href="${url('#pricing')}">Pricing</a>
      <a href="${url('roadmap/')}"${path === 'roadmap/' ? ' aria-current="page"' : ''}>Roadmap</a>
      <a href="${url('blog/')}"${path.startsWith('blog/') ? ' aria-current="page"' : ''}>Blog</a>
      <a href="${url('support/')}"${path === 'support/' ? ' aria-current="page"' : ''}>Support</a>
    </nav>
    <div class="header-actions"><a class="header-cta" href="${url('download/')}">${hasDownload(releases) ? 'Get Trayage' : 'Coming to Mac'} ${arrow}</a><label class="appearance-control" hidden><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg><span class="sr-only">Appearance</span><select id="appearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>
  </header>
  <main id="main" tabindex="-1">${path && path !== '404.html' ? `<nav class="wrap breadcrumbs" aria-label="Breadcrumb"><ol>${breadcrumbItems(path, title, category).map((item, index, items) => `<li>${index === items.length - 1 ? `<span aria-current="page">${escape(item.name)}</span>` : `<a href="${url(item.path)}">${escape(item.name)}</a>`}</li>`).join('')}</ol></nav>` : ''}${body}</main>
  <footer class="site-footer wrap">
    <div class="footer-top"><div><a class="brand" href="${url()}"><img src="${url('assets/app-icon.png')}" width="36" height="36" alt=""><span>Trayage<span class="brand-dot">.</span></span></a><p>A little order for your Downloads.</p></div><p class="publisher">A ${publisherCredit} app.<br>Made by ${escape(site.publisher)}.</p></div>
    <div class="footer-bottom"><p>© 2026 ${publisherBrand}</p><nav aria-label="Footer navigation"><a href="${url('download/')}">Get Trayage</a><a href="${url('roadmap/')}">Roadmap</a><a href="${url('blog/')}">Blog</a><a href="${url('about/')}">About</a><a href="${url('changelog/')}">Changelog</a><a href="${url('media-kit/')}">Media kit</a><a href="${url('support/')}">Support</a><a href="${url('privacy/')}">Privacy</a><a href="${url('terms/')}">Purchase terms</a><a href="${url('refunds/')}">Refunds</a></nav><div class="footer-contact">${site.links.x ? `<a href="${escape(site.links.x)}" rel="me" aria-label="Trayage on X"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932zm-1.29 19.49h2.039L6.487 3.24H4.3z"/></svg> X</a>` : ''}${site.links.productHunt ? `<a href="${escape(site.links.productHunt)}">Product Hunt ${arrow}</a>` : ''}${site.links.mastodon && site.mastodonReady?`<a href="${escape(site.links.mastodon)}" rel="me">Mastodon ${arrow}</a>`:''}<a href="mailto:trayage@relaybyte.dev">Say hello ${arrow}</a></div></div>
    ${!site.publicationApproved ? '<p class="preview-footer">Local review preview · Not published · Policy text remains a draft</p>' : ''}
  </footer>
  <section class="launch-area wrap" aria-labelledby="launch-title">
    <h2 class="eyebrow" id="launch-title">As featured in</h2>
    <div class="community-badges launch-badges">
      ${site.links.launchNest ? `<a class="launchnest-badge" href="${escape(site.links.launchNest)}" target="_blank" rel="noopener noreferrer"><img class="badge-light" src="https://launchnest.io/badge/trayage.svg?variant=featured&amp;theme=light" alt="Trayage on LaunchNest" width="220" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer"><img class="badge-dark" src="https://launchnest.io/badge/trayage.svg?variant=featured" alt="Trayage on LaunchNest" width="220" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>` : ''}
      <a href="https://www.scrolllaunch.com/products/trayage?ref=badge" target="_blank" rel="noopener">
        <picture>
          <source data-dark-source media="(prefers-color-scheme: dark)" srcset="https://www.scrolllaunch.com/api/badge/trayage?theme=dark">
          <img src="https://www.scrolllaunch.com/api/badge/trayage" alt="Featured on ScrollLaunch" width="220" height="48" loading="lazy" />
        </picture>
      </a>
<a href="https://www.tinyshelf.co/?ref=trayage.app" title="Featured on TinyShelf">
  <img src="https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg"
       alt="Featured on TinyShelf" width="216" height="64"/>
</a>
      <a href="https://letslaunch.today/product/trayage" target="_blank" rel="noopener">
        <picture>
          <source data-dark-source media="(prefers-color-scheme: dark)" srcset="https://letslaunch.today/badge/trayage.svg?theme=dark">
          <img src="https://letslaunch.today/badge/trayage.svg" alt="Trayage on LetsLaunch" width="250" height="54" />
        </picture>
      </a>
      ${techTwitterBadge}
    </div>
  </section>
  ${site.analytics?.enabled ? `<script src="${escape(site.analytics.embedURL)}" defer></script>` : ''}
</body>
</html>`;
  return addLinkTracking(html, site);
}

export function policyPage({ title, intro, sections, base, path, site, effective = site.effective, informational = false }) {
  return `<div class="wrap document-header"><a class="eyebrow back-link" href="${base}">← Back to Trayage</a><h1>${title}</h1><p class="lede">${intro}</p><p class="document-meta">Publisher: ${escape(site.publisher)}${site.publisherBrand ? ` · ${escape(site.publisherBrand)}` : ''} <span aria-hidden="true">/</span> ${informational ? 'About Trayage' : site.policiesApproved ? `Effective ${effective}` : `Draft reviewed ${site.reviewed}`}</p></div>
  <div class="wrap document-layout"><aside class="document-sidebar"><nav aria-label="On this page"><p class="eyebrow">On this page</p>${sections.map(s => `<a href="#${s.id}">${s.title}</a>`).join('')}</nav><a class="text-link" href="${base}support/">Need a hand? ${arrow}</a></aside><article class="prose" aria-label="${escape(title)}">
  ${!informational && !site.policiesApproved ? '<div class="draft-notice"><strong>Draft for review</strong><p>This text describes the current prelaunch build and proposed purchase policies. It is not an effective agreement. Checkout is closed on this site while the release and final policies are reviewed.</p></div>' : ''}
  ${sections.map(s=>`<section id="${s.id}"><h2>${s.title}</h2>${s.content}</section>`).join('')}
  <div class="related-links"><a href="${base}privacy/"${path==='privacy/'?' aria-current="page"':''}>Privacy</a><a href="${base}terms/"${path==='terms/'?' aria-current="page"':''}>Purchase terms</a><a href="${base}refunds/"${path==='refunds/'?' aria-current="page"':''}>Refunds</a></div></article></div>`;
}
