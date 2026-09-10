import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateLaunch } from './src/_lib/validate-launch.js';
import { normalizeBase } from './src/_lib/paths.js';
import { validateReleases, validateRoadmap } from './src/_lib/releases.js';
import { buildMediaKit } from './src/_lib/media-kit.js';
import { validateChangelog } from './src/_lib/changelog.js';

export default function (eleventyConfig) {
  let firstBuild = true;
  let site;
  let releases;
  let press;
  eleventyConfig.addGlobalData('base', () => normalizeBase(eleventyConfig.pathPrefix));
  eleventyConfig.addPassthroughCopy({ 'public/assets': 'assets' });
  eleventyConfig.addWatchTarget('./public/assets/');
  eleventyConfig.setServerPassthroughCopyBehavior('copy');
  eleventyConfig.setServerOptions({
    port: 4173,
    portReassignmentRetryCount: 0,
    // A full reload reruns the theme/filter enhancements after a template edit.
    domDiff: false
  });

  eleventyConfig.on('eleventy.before', async ({ directories, runMode, outputMode }) => {
    site = JSON.parse(await readFile(new URL('./src/_data/site.json', import.meta.url), 'utf8'));
    validateLaunch(site, process.env.REQUIRE_PUBLICATION_APPROVAL === '1');
    releases = JSON.parse(await readFile(new URL('./src/_data/releases.json', import.meta.url), 'utf8'));
    press = JSON.parse(await readFile(new URL('./src/_data/press.json', import.meta.url), 'utf8'));
    const roadmap = JSON.parse(await readFile(new URL('./src/_data/roadmap.json', import.meta.url), 'utf8'));
    validateReleases(releases, site);
    validateRoadmap(roadmap);
    validateChangelog(JSON.parse(await readFile(new URL('./src/_data/changelog.json', import.meta.url), 'utf8')));
    const output = resolve(directories.output);
    // Never recursively remove source files through an accidental --output flag.
    const allowed = ['dist', 'dist-root', 'dist-subpath'].map(name => resolve(name));
    if (!allowed.includes(output)) {
      throw new Error('Use dist, dist-root, or dist-subpath for build output.');
    }
    if (outputMode === 'fs' && (firstBuild || runMode === 'build')) {
      await rm(output, { recursive: true, force: true });
    }
    firstBuild = false;
    if (!site.publicationApproved) await rm(resolve(output, 'sitemap.xml'), { force: true });
  });

  eleventyConfig.on('eleventy.after', async ({ directories, outputMode }) => {
    if (outputMode === 'fs') await buildMediaKit(directories.output, site, releases, press);
  });

  eleventyConfig.addTransform('publication-policy', function (content) {
    if (site.publicationApproved && this.page.outputPath?.endsWith('.html') && /\bdraft\b|class="[^"]*\breview-note\b/i.test(content)) {
      throw new Error('Unresolved draft copy remains. Finalize all customer-facing policy and support text before an approved publication build.');
    }
    return content;
  });

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: 'dist' },
    templateFormats: ['11ty.js', 'md', 'njk'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    pathPrefix: normalizeBase(process.env.SITE_BASE_PATH)
  };
}
