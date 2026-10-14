import { absoluteURL, appDescription, isIndexable } from './_lib/seo.js';
import { channelIsLive, directPriceSummary } from './_lib/releases.js';

export const data = {
  permalink: ({ site }) => site.publicationApproved ? '/llms.txt' : false,
  eleventyExcludeFromCollections: true
};

const plain = value => String(value).replace(/[\r\n]+/g, ' ').replace(/([\\\[\]])/g, '\\$1');

export default function ({ site, releases, base, collections }) {
  if (!site.publicationApproved) return '';
  const url = path => absoluteURL(site, base, path);
  const link = (title, path, note) => `- [${plain(title)}](${url(path)}): ${plain(note)}`;
  const available = key => channelIsLive(releases, key)
    ? `Available, version ${releases[key].version}` : 'In preparation; not publicly available';
  // Never expose draft-preview content through this public machine-readable index.
  const guides = (collections.sitePages || [])
    .filter(page => page.data.article && page.data.category === 'Guides' && !page.data.draft && isIndexable(site, page.data.path, page.data.noindex))
    .sort((a, b) => Number(Boolean(b.data.featured)) - Number(Boolean(a.data.featured)) || b.date - a.date)
    .slice(0, 4);
  return `# ${site.name}

> ${appDescription}

Trayage reviews files locally in a folder you choose on macOS ${releases.minimumMacOS} or later. Suggestions include installers, possible repeat downloads, and large or older files, with reasons to review them. Suggestions do not mean a file is unnecessary. The direct 1.1 edition can compare likely duplicate contents locally. Matching contents does not mean a copy is unnecessary. The Mac App Store 1.0 edition uses names and sizes without content comparison; its 1.1 update is coming next.

You select files and confirm before Trayage moves them to Trash. Moving to Trash is not permanent deletion. Trayage does not empty the Trash.

File review is free. An optional ${site.pricing.trialDays}-day cleanup trial has no automatic charge; Apple trial eligibility applies to the App Store edition.

Direct edition: ${available('direct')}. Direct license: ${directPriceSummary(releases, site)}; up to ${site.pricing.directDeviceLimit} active Macs.

Mac App Store edition: ${available('appStore')}. ${channelIsLive(releases, 'appStore') ? 'Free download' : 'Planned free download'} with a separate US$${site.pricing.oneTimeUSD} one-time in-app unlock; the store shows local pricing. Direct licenses and Apple purchases are separate and do not unlock the other edition.

Version ${site.pricing.majorVersion}.x updates are included. Future major upgrades are optional, with discounted pricing for owners. TestFlight features and roadmap plans are not claims about the current public release. Consult the download page and changelog for current availability.

## Product and purchasing

${link('Trayage overview', '', 'What Trayage does, actual app walkthrough, pricing, and common questions.')}
${link('Download and editions', 'download/', 'Current versions, system requirements, trial, purchases, and beta testing.')}
${link('Compare Mac cleanup tools', 'compare/', 'Trayage, Finder and macOS Storage, and DaisyDisk; different uses and limitations. Published by Trayage’s developer.')}
${link('Purchase terms', 'terms/', 'License, included updates, and separate purchase channels.')}
${link('Refund policy', 'refunds/', 'Direct purchase policy and Apple-managed refunds.')}

## Help and product status

${link('Support', 'support/', 'File review, licenses, updates, and support contact.')}
${link('Privacy', 'privacy/', 'Local file analysis and the services used for purchases, support, and website analytics.')}
${link('Changelog', 'changelog/', 'Release history; distinguish public releases from prereleases.')}
${link('Roadmap', 'roadmap/', 'Planned, in-progress, beta, and completed work; not a list of currently shipped features.')}

## Guides

${guides.map(page => link(page.data.title, page.data.path, page.data.description || 'Published guide to reviewing files on Mac.')).join('\n')}

## Optional

${link('Blog', 'blog/', 'Published cleanup guides and product news.')}
${link('About Trayage', 'about/', 'Developer and editorial background.')}
`;
}
