import { hasDownload } from './_lib/releases.js';
export const escape = (value) => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const arrow = '<span aria-hidden="true">↗</span>';
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
export function layout({ title, description, path = '', body, base, site, releases, kind = '' }) {
  const url = (part = '') => `${base}${part}`;
  const isHome = path === '';
  const publisherBrand = escape(site.publisherBrand || site.publisher);
  const publisherLabel = site.publisherMark ? `<span class="publisher-brand"><img src="${escape(url(site.publisherMark))}" alt="" width="26" height="26"><span>${publisherBrand}</span></span>` : publisherBrand;
  const publisherCredit = site.publisherURL ? `<a href="${escape(site.publisherURL)}">${publisherLabel}</a>` : publisherLabel;
  const fullTitle = isHome ? 'Trayage — A little order for your Downloads' : `${title} — Trayage`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f7f6f2">
  <meta name="description" content="${escape(description)}">
  ${!site.publicationApproved || path === '404.html' ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <title>${escape(fullTitle)}</title>
  <meta property="og:title" content="${escape(fullTitle)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Trayage">
  ${site.origin ? `<link rel="canonical" href="${escape(site.origin + url(path))}"><meta property="og:url" content="${escape(site.origin + url(path))}"><meta property="og:image" content="${escape(site.origin + url('assets/app-icon.png'))}">` : ''}
  <link rel="icon" type="image/png" href="${url('assets/favicon.png')}">
  <link rel="apple-touch-icon" href="${url('assets/app-icon.png')}">
  <script src="${url('assets/theme.js')}"></script>
  <link rel="stylesheet" href="${url('assets/site.css')}">
  <link rel="stylesheet" href="${url('assets/theme.css')}">
  <link rel="stylesheet" href="${url('assets/pages.css')}">
  <script src="${url('assets/site.js')}" defer></script>
</head>
<body class="${kind}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header wrap">
    <a class="brand" href="${url()}" aria-label="Trayage home"><img src="${url('assets/app-icon.png')}" width="43" height="43" alt=""><span>Trayage<span class="brand-dot">.</span></span></a>
    <nav aria-label="Main navigation">
      <a href="${url('#overview')}">Overview</a>
      <a href="${url('#pricing')}">Pricing</a>
      <a href="${url('roadmap/')}"${path === 'roadmap/' ? ' aria-current="page"' : ''}>Roadmap</a>
      <a href="${url('support/')}"${path === 'support/' ? ' aria-current="page"' : ''}>Support</a>
    </nav>
    <div class="header-actions"><a class="header-cta" href="${url('download/')}">${hasDownload(releases) ? 'Get Trayage' : 'Coming to Mac'} ${arrow}</a><label class="appearance-control" hidden><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg><span class="sr-only">Appearance</span><select id="appearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>
  </header>
  <main id="main" tabindex="-1">${body}</main>
  <footer class="site-footer wrap">
    <div class="footer-top"><div><a class="brand" href="${url()}"><img src="${url('assets/app-icon.png')}" width="36" height="36" alt=""><span>Trayage<span class="brand-dot">.</span></span></a><p>A little order for your Downloads.</p></div><p class="publisher">A ${publisherCredit} app.<br>Made by ${escape(site.publisher)}.</p></div>
    <div class="footer-bottom"><p>© 2026 ${publisherBrand}</p><nav aria-label="Footer navigation"><a href="${url('download/')}">Get Trayage</a><a href="${url('roadmap/')}">Roadmap</a><a href="${url('changelog/')}">Changelog</a><a href="${url('media-kit/')}">Media kit</a><a href="${url('support/')}">Support</a><a href="${url('privacy/')}">Privacy</a><a href="${url('terms/')}">Purchase terms</a><a href="${url('refunds/')}">Refunds</a></nav><a href="mailto:${site.email}">Say hello ${arrow}</a></div>
    ${!site.publicationApproved ? '<p class="preview-footer">Local review preview · Not published · Policy text remains a draft</p>' : ''}
  </footer>
</body>
</html>`;
}

export function policyPage({ title, intro, sections, base, path, site }) {
  return `<div class="wrap document-header"><a class="eyebrow back-link" href="${base}">← Back to Trayage</a><h1>${title}</h1><p class="lede">${intro}</p><p class="document-meta">Publisher: ${escape(site.publisher)}${site.publisherBrand ? ` · ${escape(site.publisherBrand)}` : ''} <span aria-hidden="true">/</span> ${site.policiesApproved ? `Effective ${site.effective}` : `Draft reviewed ${site.reviewed}`}</p></div>
  <div class="wrap document-layout"><aside class="document-sidebar"><nav aria-label="On this page"><p class="eyebrow">On this page</p>${sections.map(s => `<a href="#${s.id}">${s.title}</a>`).join('')}</nav><a class="text-link" href="${base}support/">Need a hand? ${arrow}</a></aside><article class="prose" aria-label="${escape(title)}">
  ${!site.policiesApproved ? '<div class="draft-notice"><strong>Draft for review</strong><p>This text describes the current prelaunch build and proposed purchase policies. It is not an effective agreement. Checkout is closed on this site while the release and final policies are reviewed.</p></div>' : ''}
  ${sections.map(s=>`<section id="${s.id}"><h2>${s.title}</h2>${s.content}</section>`).join('')}
  <div class="related-links"><a href="${base}privacy/"${path==='privacy/'?' aria-current="page"':''}>Privacy</a><a href="${base}terms/"${path==='terms/'?' aria-current="page"':''}>Purchase terms</a><a href="${base}refunds/"${path==='refunds/'?' aria-current="page"':''}>Refunds</a></div></article></div>`;
}
