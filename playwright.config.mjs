import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  timeout: 60_000,
  reporter: [['list'], ['html', {open:'never'}]],
  use: {
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH} : {}
  },
  webServer: [
    {command: 'npm run build -- --output=dist-root && node scripts/serve.mjs --dir dist-root --port 4175', url:'http://127.0.0.1:4175',reuseExistingServer:false},
    {command: 'npm run build:pages && node scripts/serve.mjs --dir dist-subpath --port 4176', url:'http://127.0.0.1:4176/Trayage-website/',reuseExistingServer:false}
  ]
});
