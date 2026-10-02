import { escape } from './layout.mjs';
import { absoluteURL, isIndexable } from './_lib/seo.js';

export const data = {
  permalink: ({ site }) => site.publicationApproved ? '/sitemap.xml' : false,
  eleventyExcludeFromCollections: true
};
export default function ({ site, base, collections }) {
  const urls = collections.sitePages
    .filter(page => isIndexable(site, page.data.path, page.data.noindex))
    .sort((a, b) => a.data.order - b.data.order)
    .map(page => `<url><loc>${escape(absoluteURL(site, base, page.data.path))}</loc></url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
