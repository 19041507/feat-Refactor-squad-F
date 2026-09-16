import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 20000,
  use: { baseURL: 'http://127.0.0.1:3107', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 960 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'node src/backend/server.js',
    url: 'http://127.0.0.1:3107/api/health',
    reuseExistingServer: false,
    env: { PORT: '3107', HOST: '127.0.0.1', GEMINI_API_KEY: '' },
  },
});
