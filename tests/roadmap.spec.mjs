import {test, expect} from '@playwright/test';
import {fetchRoadmapIssues, normalizeRoadmapIssues, resolveRoadmap, issueRepository} from '../src/_lib/roadmap.js';
import {validateRoadmap} from '../src/_lib/releases.js';
import renderRoadmap from '../src/roadmap.11ty.js';
import baseline from '../src/_data/roadmap.json' with {type:'json'};
import snapshot from '../src/_data/roadmapIssues.json' with {type:'json'};
import site from '../src/_data/site.json' with {type:'json'};

const issue = (number, overrides = {}) => ({number, title:'[Idea] A useful improvement', body:'### Summary\n\nMake reviewing files easier.\n\n### Area\n\nFile review\n\n### Anything else?\n\nNot copied onto the website.', labels:[{name:'roadmap'}], state:'open', state_reason:null, updated_at:'2026-09-10T12:00:00Z', ...overrides});
const from = issues => ({repository:issueRepository, items:normalizeRoadmapIssues(issues)});

test('only approved issues become roadmap items, and additional detail fields are not copied', () => {
  const result = from([issue(101), issue(102,{labels:[{name:'enhancement'}]}), issue(103,{pull_request:{}})]);
  expect(result.items.map(item=>item.number)).toEqual([101]);
  expect(result.items[0].title).toBe('A useful improvement');
  expect(result.items[0].description).toBe('Make reviewing files easier.');
  expect(JSON.stringify(result)).not.toContain('Not copied');
});

test('GitHub lifecycle moves items, omits declined work, and keeps release announcements separate', () => {
  const result = resolveRoadmap(baseline,from([
    issue(101), issue(102,{labels:[{name:'roadmap'},{name:'in progress'}]}),
    issue(103,{state:'closed',state_reason:'completed'}),
    issue(104,{state:'closed',state_reason:'not_planned'}),
    issue(105,{state:'closed',state_reason:'duplicate'})
  ]));
  expect(result.items.map(item=>item.status)).toEqual(['planned','in-progress','completed']);
  expect(result.items.every(item=>item.release===null)).toBe(true);
  validateRoadmap(result);
  const shipped=baseline.items.find(item=>item.release);
  const closed=resolveRoadmap(baseline,from([issue(shipped.issue,{state:'closed',state_reason:'completed'})]));
  expect(closed.items[0].id).toBe(shipped.id);
  expect(closed.items[0].release).toEqual(shipped.release);
  const reopened=resolveRoadmap(baseline,from([issue(shipped.issue)]));
  expect(reopened.items[0].status).toBe('planned');
  expect(reopened.items[0].release).toBeNull();
  expect(shipped.release).not.toBeNull();
  expect(resolveRoadmap(baseline,from([])).items).toEqual([]);
});

test('issue text is escaped and issue links cannot supply an arbitrary destination', () => {
  const malicious = from([issue(101,{title:'<img src=x onerror=alert(1)>',body:'### Summary\n\n<script>alert(1)</script>\n\n### Area\n\n<script>'})]);
  const html=renderRoadmap({base:'/',site,roadmap:baseline,roadmapIssues:malicious});
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img src=x');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain(`https://github.com/${issueRepository}/issues/101`);
  expect(()=>normalizeRoadmapIssues([issue('javascript:alert(1)')])).toThrow(/issue number/);
  expect(()=>normalizeRoadmapIssues([issue(101,{body:'No summary heading'})])).toThrow(/Summary/);
  expect(()=>validateRoadmap(resolveRoadmap(baseline,from([issue(101),issue(101)])))).toThrow();
});

test('GitHub sync paginates and fails instead of publishing partial data', async () => {
  const calls=[];
  const fetcher=async url=>{
    calls.push(url);
    return {ok:true,json:async()=>calls.length===1?Array.from({length:100},(_,n)=>issue(n+100)): [issue(200)]};
  };
  const result=await fetchRoadmapIssues(fetcher);
  expect(result.items).toHaveLength(101);
  expect(calls[1]).toContain('page=2');
  let count=0;
  await expect(fetchRoadmapIssues(async()=> ++count===1
    ? {ok:true,json:async()=>Array.from({length:100},(_,n)=>issue(n+100))}
    : {ok:false,status:503})).rejects.toThrow(/previous snapshot has been kept/);
});

test('roadmap links open the right GitHub forms and retain private email support', async ({page}) => {
  await page.goto('http://127.0.0.1:4175/roadmap/');
  await expect(page.getByRole('link',{name:'Share an idea'})).toHaveAttribute('href',site.links.featureIdea);
  await expect(page.getByRole('link',{name:'Report a bug'})).toHaveAttribute('href',site.links.bugReport);
  await expect(page.locator('.roadmap-feedback')).toContainText('posts are public and need an account');
  await expect(page.getByRole('link',{name:'email Kyle',exact:true})).toHaveAttribute('href',`mailto:${site.email}`);
  const items=resolveRoadmap(baseline,snapshot).items;
  await expect(page.locator('.roadmap-item')).toHaveCount(items.length);
  for(const item of items) await expect(page.locator(`#feature-${item.id} a[aria-label^="Follow"]`)).toHaveAttribute('href',`https://github.com/${issueRepository}/issues/${item.issue}`);
});
