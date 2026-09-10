export const issueRepository = 'kylereddoch/Trayage-website';
export const issueTracker = `https://github.com/${issueRepository}/issues`;

function section(body, heading) {
  const match = String(body || '').match(new RegExp(`(?:^|\\n)### ${heading}\\r?\\n([\\s\\S]*?)(?=\\n### |$)`));
  return match?.[1].trim().replace(/\s+/g, ' ') || '';
}

// Keep only the public fields the website needs. Never render issue Markdown.
export function normalizeRoadmapIssues(issues) {
  return issues.filter(issue => !issue.pull_request && issue.labels.some(label => label.name === 'roadmap'))
    .map(issue => {
      if (!Number.isSafeInteger(issue.number) || issue.number < 1) throw new Error('Invalid GitHub issue number.');
      if (!['open', 'closed'].includes(issue.state)) throw new Error(`Invalid state for issue #${issue.number}.`);
      const title = String(issue.title || '').replace(/^\[(Idea|Bug)\]:?\s*/i, '').trim();
      const summary = section(issue.body, 'Summary');
      if (!title || !summary || summary === '_No response_') throw new Error(`Roadmap issue #${issue.number} needs a title and a Summary section.`);
      const updated = String(issue.updated_at || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) throw new Error(`Invalid update date for issue #${issue.number}.`);
      return {
        number: issue.number,
        title: title.slice(0, 180),
        description: summary.slice(0, 600),
        area: (section(issue.body, 'Area') || 'App improvement').slice(0, 60),
        status: issue.state === 'closed'
          ? issue.state_reason === 'completed' ? 'completed' : 'not-planned'
          : issue.labels.some(label => label.name === 'in progress') ? 'in-progress' : 'planned',
        updated
      };
    }).sort((a, b) => a.number - b.number);
}

export function resolveRoadmap(baseline, snapshot) {
  if (!snapshot) return baseline;
  if (snapshot.repository !== issueRepository || !Array.isArray(snapshot.items)) throw new Error('Invalid roadmap issue snapshot.');
  const known = new Map(baseline.items.filter(item => item.issue).map(item => [item.issue, item]));
  const items = snapshot.items.filter(issue => issue.status !== 'not-planned').map(issue => {
    const previous = known.get(issue.number);
    return {
      id: previous?.id || `issue-${issue.number}`,
      title: issue.title,
      description: issue.description,
      area: issue.area,
      status: issue.status,
      issue: issue.number,
      // Closing an issue does not announce a release. Release records stay separate.
      release: issue.status === 'completed' ? previous?.release || null : null
    };
  });
  return {updated: [baseline.updated, ...snapshot.items.map(issue => issue.updated)].sort().at(-1), items};
}

export async function fetchRoadmapIssues(fetcher = fetch, token = '') {
  const issues = [];
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/repos/${issueRepository}/issues?state=all&labels=roadmap&per_page=100&page=${page}`;
    const response = await fetcher(url, {
      headers: {Accept: 'application/vnd.github+json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) throw new Error(`GitHub roadmap sync failed (HTTP ${response.status}); the previous snapshot has been kept.`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('GitHub returned an invalid issue list.');
    issues.push(...batch);
    if (batch.length < 100) break;
  }
  return {repository: issueRepository, items: normalizeRoadmapIssues(issues)};
}
