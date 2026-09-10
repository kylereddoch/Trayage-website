import { test, expect } from '@playwright/test';
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const project = resolve(import.meta.dirname, '..');
const cli = join(project, 'node_modules/@11ty/eleventy/cmd.cjs');
const env = { ...process.env, SITE_BASE_PATH: '', REQUIRE_PUBLICATION_APPROVAL: '0' };

// Exercise real builds and watch edits in disposable copies, never the user's source.
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'trayage-eleventy-'));
  for (const path of ['src', 'public', 'eleventy.config.mjs', 'package.json']) {
    await cp(join(project, path), join(directory, path), { recursive: true });
  }
  const sitePath = join(directory, 'src/_data/site.json');
  const config = JSON.parse(await readFile(sitePath, 'utf8'));
  await writeFile(sitePath, JSON.stringify({...config,publicationApproved:false,policiesApproved:false,origin:''}, null, 2));
  await symlink(join(project, 'node_modules'), join(directory, 'node_modules'), 'junction');
  return directory;
}
const build = (cwd, args = [], environment = env) => exec(process.execPath, [cli, '--quiet', ...args], { cwd, env: environment });
async function availablePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('Eleventy preserves publication guards and cleans only generated output', async () => {
  const cwd = await fixture();
  try {
    await mkdir(join(cwd, 'dist/stale'), { recursive: true });
    await writeFile(join(cwd, 'dist/stale/index.html'), 'Removed page');
    await build(cwd);
    await expect(readFile(join(cwd, 'dist/stale/index.html'))).rejects.toThrow(/ENOENT/);
    expect(JSON.parse(await readFile(join(cwd, 'dist/build-info.json'), 'utf8')).base).toBe('/');
    expect(await readFile(join(cwd, 'dist/.nojekyll'), 'utf8')).toBe('');
    expect(await readFile(join(cwd, 'dist/robots.txt'), 'utf8')).toContain('Disallow: /');
    await expect(readFile(join(cwd, 'dist/sitemap.xml'))).rejects.toThrow(/ENOENT/);
    // Pages returns an empty base_path for a domain-root deployment.
    await build(cwd, [], { ...env, SITE_BASE_PATH: '/a-different-repository' });
    expect(await readFile(join(cwd, 'dist/index.html'), 'utf8')).toContain('/a-different-repository/assets/theme.js');
    await expect(build(cwd, [], { ...env, REQUIRE_PUBLICATION_APPROVAL: '1' })).rejects.toThrow(/Publication is not approved/);
    await expect(build(cwd, ['--output=src'])).rejects.toThrow(/Use dist, dist-root, or dist-subpath/);
    expect(await readFile(join(cwd, 'src/index.11ty.js'), 'utf8')).toContain('export default');
    const path = join(cwd, 'src/_data/site.json');
    const config = JSON.parse(await readFile(path, 'utf8'));
    await writeFile(path, JSON.stringify({ ...config, publicationApproved: true, policiesApproved: true, origin: 'https://example.test' }));
    await writeFile(join(cwd, 'src/draft.njk'), '<p>Draft for review</p>');
    await expect(build(cwd)).rejects.toThrow(/Unresolved draft copy remains/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('npm run start rebuilds shared templates, data, CSS, and JS with browser reload', async ({ browser }) => {
  const cwd = await fixture();
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}/`;
  const server = spawn('npm', ['run', 'start', '--', `--port=${port}`], {
    cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  server.stdout.on('data', data => { output += data; });
  server.stderr.on('data', data => { output += data; });
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await expect.poll(() => output, { timeout: 20_000 }).toContain(`Server at http://localhost:${port}/`);
    await page.goto(url);
    await expect(page.getByLabel('Appearance')).toBeVisible();
    const homePath = join(cwd, 'src/home.mjs');
    await writeFile(homePath, (await readFile(homePath, 'utf8')).replace('Less digging.', 'Watching edits.'));
    await expect(page.locator('h1')).toContainText('Watching edits.', { timeout: 15_000 });
    const sitePath = join(cwd, 'src/_data/site.json');
    await writeFile(sitePath, (await readFile(sitePath, 'utf8')).replace('"publisher": "Kyle Reddoch"', '"publisher": "Watch verification"'));
    await expect(page.locator('.publisher')).toContainText('Watch verification', { timeout: 15_000 });
    const cssPath = join(cwd, 'public/assets/site.css');
    await writeFile(cssPath, (await readFile(cssPath, 'utf8')) + '\n:root { --paper: rgb(240, 241, 242); }\n');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(240, 241, 242)', { timeout: 15_000 });
    const jsPath = join(cwd, 'public/assets/site.js');
    await writeFile(jsPath, (await readFile(jsPath, 'utf8')) + '\ndocument.documentElement.dataset.watchVerified = "yes";\n');
    await expect(page.locator('html')).toHaveAttribute('data-watch-verified', 'yes', { timeout: 15_000 });
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Support', exact: true }).click();
    await expect(page).toHaveURL(url + 'support/');
    await expect(page.locator('h1')).toContainText('sorted.');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    const stopped = new Promise(resolve => server.once('exit', resolve));
    if (server.exitCode === null) {
      try { process.kill(-server.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      await stopped;
    }
    await rm(cwd, { recursive: true, force: true });
  }
});
