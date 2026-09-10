export const data = { permalink: '/robots.txt', eleventyExcludeFromCollections: true };
export default function ({ site, base }) {
  return site.publicationApproved
    ? `User-agent: *\nAllow: /\nSitemap: ${site.origin}${base}sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}
