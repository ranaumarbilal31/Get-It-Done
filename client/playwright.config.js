import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: [
    {
      command: 'node ../server/scripts/test-server.cjs',
      url: 'http://127.0.0.1:5000/api/health',
      timeout: 120000,
      reuseExistingServer: false,
    },
    {
      command: process.env.E2E_PRODUCTION ? 'node ssr-server.js --production' : 'npm run dev',
      url: 'http://127.0.0.1:5173/about',
      timeout: 120000,
      reuseExistingServer: false,
      env: { API_ORIGIN: 'http://127.0.0.1:5000', VITE_API_URL: '' },
    },
  ],
});
