import { escape } from './layout.mjs';
import { absoluteURL, isIndexable } from './_lib/seo.js';
import { contentDate } from './_lib/content-index.js';

export const data = {
  permalink: ({ site }) => site.publicationApproved ? '/sitemap.xml' : false,
  eleventyExcludeFromCollections: true
};
export default function ({ site, base, collections }) {
  const urls = collections.sitePages
    .filter(page => !page.data.draft && isIndexable(site, page.data.path, page.data.noindex))
    .sort((a, b) => a.data.path.localeCompare(b.data.path))
    .map(page => {
      const modified = contentDate(page.data.updated || (page.data.article ? page.date : undefined));
      return `<url><loc>${escape(absoluteURL(site, base, page.data.path))}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
