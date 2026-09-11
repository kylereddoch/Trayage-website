import { escape, arrow } from './layout.mjs';
import { entryReleases } from './_lib/changelog.js';

export const data = {layout:'base.11ty.js', permalink:'/changelog/index.html', path:'changelog/', title:'Changelog', description:'What is new in Trayage, with version highlights and release status for the direct and Mac App Store editions.', tags:['sitePages'], order:8};

export default function ({base, changelog, releases}) {
  const channelNames = {direct:'Direct download', appStore:'Mac App Store'};
  return `<div class="wrap document-header"><a class="eyebrow back-link" href="${base}">← Back to Trayage</a><p class="eyebrow page-kicker">Changelog</p><h1>What’s new<br>in Trayage.</h1><p class="lede">New features, improvements, and fixes in each version of Trayage.</p></div>
  <div class="wrap changelog-list">${changelog.entries.map(entry => {
    const history = entryReleases(entry, releases);
    const released = Object.keys(history).length > 0;
    const anchor = `version-${entry.version.replaceAll('.', '-')}${entry.build ? `-build-${entry.build}` : ''}`;
    return `<article class="changelog-entry" id="${escape(anchor)}" aria-labelledby="${escape(anchor)}-title"><div class="changelog-version"><h2 id="${escape(anchor)}-title">Version ${escape(entry.version)}</h2><p class="release-status">${released?'Released':'Prerelease'}${entry.build?` · Build ${escape(entry.build)}`:''}</p>${released?Object.entries(history).map(([channel,date])=>`<p class="changelog-date">${channelNames[channel]}<br><time datetime="${escape(date)}">${new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})}</time></p>`).join(''):'<p class="changelog-date">No public release date yet.</p>'}</div><div class="changelog-details"><h3>${escape(entry.title)}</h3><p>${escape(entry.summary)}</p><ul>${entry.highlights.map(item=>`<li><h4>${escape(item.title)}</h4><p>${escape(item.description)}</p></li>`).join('')}</ul>${!released?'<p class="changelog-note">These features are implemented in the prerelease build. Release checks are still underway, and the interface may change.</p>':''}</div></article>`;
  }).join('')}</div><section class="wrap download-help"><h2>Looking ahead?</h2><p>Follow planned improvements and completed work on the <a href="${base}roadmap/">roadmap</a>. Visit the download page for the current availability of each edition.</p><div class="download-help-links"><a class="text-link" href="${base}download/">Get Trayage ${arrow}</a><a class="text-link" href="${base}privacy/">Privacy details ${arrow}</a></div></section>`;
}
