export const data = { permalink: '/build-info.json', eleventyExcludeFromCollections: true };
export default function ({ site, base, collections }) {
  return JSON.stringify({
    base,
    pages: [...collections.sitePages].sort((a, b) => a.data.order - b.data.order).map(page => page.data.path),
    publicationApproved: site.publicationApproved,
    checkoutEnabled: site.checkoutEnabled
  }, null, 2);
}
