import { defineConfig, devices } from '@playwright/test';
import { API_URL, APP_URL, BE_PATH, backendEnv } from './e2e/config.js';

export default defineConfig({
  testDir: './e2e/specs',
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /\.mobile\.spec\.js$/,
    },
    // Mobile-only DOM: the TabBar, its More drawer, and the docked bubble menu.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /\.mobile\.spec\.js$/ },
  ],
  webServer: [
    {
      command: 'npm start',
      cwd: BE_PATH,
      url: `${API_URL}/api/health`,
      reuseExistingServer: false,
      stdout: 'pipe',
      timeout: 60_000,
      env: backendEnv,
    },
    {
      command: 'npm run dev -- --port 5199 --strictPort',
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_URL: API_URL },
    },
  ],
});
