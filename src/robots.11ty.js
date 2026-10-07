export const data = { permalink: '/robots.txt', eleventyExcludeFromCollections: true };
export default function ({ site, base }) {
  return site.publicationApproved
    ? `# Public search access. Search crawlers are distinct from model-training crawlers.\nUser-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nSitemap: ${site.origin}${base}sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}
