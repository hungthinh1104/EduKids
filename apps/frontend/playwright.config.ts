import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.UI_BASE_URL || 'http://localhost:3000';

// CI: .next already built by the prior "Build" step — use `start` (instant, no lazy compile).
// Local dev: reuse the running dev server (or start one).
const webServerCommand = process.env.CI ? 'npm run start' : 'npm run dev';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: BASE_URL,
    headless: true,
  },
  webServer: {
    command: webServerCommand,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
