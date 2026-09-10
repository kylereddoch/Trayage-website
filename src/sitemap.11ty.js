import { escape } from './layout.mjs';

export const data = {
  permalink: ({ site }) => site.publicationApproved ? '/sitemap.xml' : false,
  eleventyExcludeFromCollections: true
};
export default function ({ site, base, collections }) {
  const urls = collections.sitePages
    .filter(page => page.data.path !== '404.html')
    .sort((a, b) => a.data.order - b.data.order)
    .map(page => `<url><loc>${escape(site.origin + base + page.data.path)}</loc></url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
