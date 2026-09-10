export function channelIsLive(releases, channel) {
  return releases[channel]?.status === 'available';
}

export function hasDownload(releases) {
  return channelIsLive(releases, 'direct') || channelIsLive(releases, 'appStore');
}

export function releaseSummary(releases) {
  const direct = channelIsLive(releases, 'direct');
  const apple = channelIsLive(releases, 'appStore');
  if (direct && apple) return 'Available directly and on the Mac App Store';
  if (direct) return 'Direct download available · Mac App Store edition in preparation';
  if (apple) return 'Available on the Mac App Store · Direct download in preparation';
  return 'Preparing for release · No public download yet';
}

function httpsURL(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} requires a valid HTTPS URL.`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || /(^|\.)example\.(com|org|net)$|localhost|\.(test|invalid)$/.test(url.hostname)) {
    throw new Error(`${label} requires a public HTTPS URL without credentials or a fragment.`);
  }
  return url;
}

export function validateReleases(releases, site) {
  for (const name of ['direct', 'appStore']) {
    const channel = releases[name];
    if (!channel || !['preparing', 'available'].includes(channel.status)) throw new Error(`Invalid ${name} release status.`);
    if (channel.status !== 'available') continue;
    if (!site.publicationApproved || !site.policiesApproved || !site.releaseReady) throw new Error('Live downloads require an approved website, policies, and a verified release.');
    if (!channel.version || !/^\d{4}-\d{2}-\d{2}$/.test(channel.releasedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(channel.verifiedAt)) {
      throw new Error(`${name} needs its version, release date, and link verification date.`);
    }
    const url = httpsURL(channel.url, name);
    if (name === 'appStore' && (url.hostname !== 'apps.apple.com' || !url.pathname.endsWith(`/id${channel.appId}`))) {
      throw new Error('The Mac App Store link must point to this app on apps.apple.com.');
    }
    if (name === 'direct' && (!channel.notarized || !channel.architectures || !['DMG', 'ZIP'].includes(channel.format))) {
      throw new Error('Direct downloads require notarization, architectures, and a DMG or ZIP format.');
    }
  }
  if (site.checkoutEnabled && !channelIsLive(releases, 'direct')) throw new Error('Direct checkout requires the direct download to be available.');
  if (releases.appStore.badgePath && !/^assets\/[\w/.-]+\.(svg|png)$/.test(releases.appStore.badgePath)) throw new Error('Use a local official App Store badge asset.');
}

export function validateRoadmap(roadmap) {
  const ids = new Set();
  for (const item of roadmap.items) {
    if (!/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) throw new Error('Roadmap IDs must be unique URL-safe names.');
    ids.add(item.id);
    if (!['planned', 'in-progress', 'completed'].includes(item.status) || !item.title || !item.description) throw new Error(`Invalid roadmap item: ${item.id}`);
    if (item.release) {
      if (item.status !== 'completed' || !item.release.version || !/^\d{4}-\d{2}-\d{2}$/.test(item.release.date)) throw new Error(`Released roadmap item ${item.id} needs completed status, version and date.`);
      if (item.release.url) httpsURL(item.release.url, 'Release notes');
    }
  }
}
