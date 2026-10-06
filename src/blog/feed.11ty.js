import { escape } from '../layout.mjs';
import { absoluteURL } from '../_lib/seo.js';
import { newestPosts } from '../_lib/blog.js';
export const data = { permalink: ({ site }) => site.publicationApproved && site.origin ? '/blog/feed.xml' : false, eleventyExcludeFromCollections: true };
export default function ({ collections, site, base }) {
  if (!site.publicationApproved || !site.origin) return '';
  const url = path => escape(absoluteURL(site, base, path));
  const posts = newestPosts(collections.posts);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Trayage Blog</title><link>${url('blog/')}</link><description>Practical Mac guides and stories from the makers of Trayage.</description><language>en-us</language><atom:link href="${url('blog/feed.xml')}" rel="self" type="application/rss+xml"/>${posts.map(post => `<item><title>${escape(post.data.title)}</title><link>${url(post.data.path)}</link><guid isPermaLink="true">${url(post.data.path)}</guid><description>${escape(post.data.description)}</description><category>${escape(post.data.category)}</category><pubDate>${post.date.toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
}
