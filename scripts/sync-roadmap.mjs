import {readFile, writeFile, rename} from 'node:fs/promises';
import {fetchRoadmapIssues, resolveRoadmap} from '../src/_lib/roadmap.js';
import {validateRoadmap} from '../src/_lib/releases.js';

const destination = new URL('../src/_data/roadmapIssues.json', import.meta.url);
const baseline = JSON.parse(await readFile(new URL('../src/_data/roadmap.json', import.meta.url), 'utf8'));
const snapshot = await fetchRoadmapIssues(fetch, process.env.GITHUB_TOKEN);
validateRoadmap(resolveRoadmap(baseline, snapshot));
// A failed fetch or validation never replaces the last usable local snapshot.
const temporary = new URL('./roadmapIssues.json.tmp', destination);
await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n');
await rename(temporary, destination);
console.log(`Synced ${snapshot.items.length} approved roadmap issues from ${snapshot.repository}.`);
