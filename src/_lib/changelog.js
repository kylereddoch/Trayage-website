import { channelIsLive } from './releases.js';

export function entryReleases(entry, releases) {
  const history = { ...entry.releaseHistory };
  for (const channel of ['direct', 'appStore']) {
    // A newer live version must not relabel an older entry or replace its date.
    if (channelIsLive(releases, channel) && releases[channel].version === entry.version
      && (!entry.build || releases[channel].build === entry.build)) {
      history[channel] ??= releases[channel].releasedAt;
    }
  }
  return history;
}

export function validateChangelog(changelog) {
  const versions = new Set();
  for (const entry of changelog.entries) {
    const identity = `${entry.version}:${entry.build || ''}`;
    if (!/^\d+(?:\.\d+)*$/.test(entry.version) || (entry.build && !/^\d+$/.test(entry.build)) || versions.has(identity)) throw new Error('Changelog version and build pairs must be unique numeric values.');
    versions.add(identity);
    if (!entry.title || !entry.summary || !entry.highlights?.length || entry.highlights.some(item => !item.title || !item.description)) throw new Error(`Changelog ${entry.version} needs a title, summary, and highlights.`);
    for (const [channel, date] of Object.entries(entry.releaseHistory || {})) {
      if (!['direct', 'appStore'].includes(channel) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error(`Changelog ${entry.version} has an invalid channel release date.`);
    }
  }
}
