import { isDraftPreview } from '../../_lib/preview.js';

export default {
  // Author articles as Markdown here. Set draft: true in front matter to omit
  // them from page output, listings, related reading, the sitemap, and RSS.
  layout: 'article.11ty.js',
  tags: ['posts', 'sitePages'],
  category: 'Guides',
  article: true,
  draft: false,
  eleventyComputed: {
    path: data => `blog/${data.page.fileSlug}/`,
    permalink: data => data.draft && !isDraftPreview(data) ? false : `/blog/${data.page.fileSlug}/index.html`,
    eleventyExcludeFromCollections: data => Boolean(data.draft && !isDraftPreview(data))
  }
};
