import { defineConfig } from '@playwright/test';
const remote = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remote || 'http://127.0.0.1:4179';
let proxy: { server: string; username?: string; password?: string } | undefined;
const address = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (remote?.startsWith('https:') && address) {
  const u = new URL(address);
  proxy = { server: `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}` };
  if (u.username) proxy.username = decodeURIComponent(u.username);
  if (u.password) proxy.password = decodeURIComponent(u.password);
}
export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL,
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      ...(proxy ? { proxy } : {}),
    },
    screenshot: 'only-on-failure',
  },
  // Test the production bundle. Avoid sharing Vite's mutable dependency cache
  // with a development server or a concurrent unit-test transformer.
  webServer: remote
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4179 --strictPort',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 60000,
      },
});
