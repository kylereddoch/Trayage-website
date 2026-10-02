import { channelIsLive } from './releases.js';

export const appDescription = 'Review and clean up your Mac Downloads folder with Trayage. Spot installers, likely duplicates, and old or large files. File analysis stays on your Mac.';

export const isIndexable = (site, path, noindex = false) => Boolean(site.publicationApproved && site.origin && path !== '404.html' && !noindex);
export const absoluteURL = (site, base, path = '') => new URL(`${base}${path}`, site.origin).href;
// JSON is embedded in HTML: a literal closing script tag must never end the block.
export const serializeSchema = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');

export function structuredData({ site, releases, base, path, title, description }) {
  const url = part => absoluteURL(site, base, part);
  const home = url('');
  const canonical = url(path);
  const publisher = { '@type': 'Person', '@id': `${home}#publisher`, name: site.publisher, url: site.publisherURL };
  const website = { '@type': 'WebSite', '@id': `${home}#website`, url: home, name: site.name, description: appDescription, inLanguage: 'en-US', publisher: { '@id': publisher['@id'] } };
  const page = {
    '@type': path === 'support/' ? 'ContactPage' : 'WebPage',
    '@id': `${canonical}#webpage`, url: canonical, name: title, description,
    inLanguage: 'en-US', isPartOf: { '@id': website['@id'] },
    publisher: { '@id': publisher['@id'] }
  };
  const graph = [publisher, website, page];
  if (path) {
    const breadcrumb = {
      '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: home },
        { '@type': 'ListItem', position: 2, name: title, item: canonical }
      ]
    };
    page.breadcrumb = { '@id': breadcrumb['@id'] };
    graph.push(breadcrumb);
  }
  // Only pages describing the app and its offer carry software markup.
  if (path === '' || path === 'download/') {
    const app = {
      '@type': 'SoftwareApplication', '@id': `${home}#app`, name: site.name,
      url: home, description: appDescription, applicationCategory: 'UtilitiesApplication',
      operatingSystem: `macOS ${releases.minimumMacOS} or later`,
      image: url('assets/app-icon.png'), author: { '@id': publisher['@id'] },
      publisher: { '@id': publisher['@id'] },
      brand: { '@type': 'Brand', name: site.publisherBrand, url: site.publisherURL },
      sameAs: [site.links.x, site.links.mastodon].filter(Boolean),
      featureList: ['Downloads folder review', 'Disk image and installer review', 'Likely duplicate detection by filename and size', 'Old and large file review', 'Local file analysis', 'Move selected files to Trash after confirmation']
    };
    if (channelIsLive(releases, 'direct')) {
      app.softwareVersion = releases.direct.version;
      app.downloadUrl = releases.direct.url;
      if (site.checkoutEnabled) app.offers = {
        '@type': 'Offer', url: url('download/'), price: site.pricing.oneTimeUSD,
        priceCurrency: 'USD', availability: 'https://schema.org/InStock',
        seller: { '@id': publisher['@id'] },
        description: `One-time direct license for up to ${site.pricing.directDeviceLimit} Macs, including ${site.pricing.majorVersion}.x updates. Optional ${site.pricing.trialDays}-day trial with no automatic charge.`
      };
    }
    page.mainEntity = { '@id': app['@id'] };
    graph.push(app);
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
