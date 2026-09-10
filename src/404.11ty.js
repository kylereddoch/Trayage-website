export const data = {
  layout: 'base.11ty.js',
  permalink: '/404.html',
  path: '404.html',
  title: 'Page not found',
  description: 'This page is not in the tray. Return to Trayage or get help.',
  tags: ['sitePages'],
  order: 5
};

export default function ({ base }) {
  return `<section class="wrap not-found"><p class="eyebrow">404 / A little out of place</p><h1>Not in this tray.</h1><p>That page may have moved, or the address may be incomplete.</p><a class="button" href="${base}">Back to Trayage <span aria-hidden="true">→</span></a><a class="text-link" href="${base}support/">Get help</a></section>`;
}
