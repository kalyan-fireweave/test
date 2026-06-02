import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:5173';
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const ROOT = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -w packages/api',
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://test_user:test_password@localhost:5433/notes_test_db',
        PORT: '3001',
      },
      cwd: ROOT,
    },
    {
      command: 'npm run dev -w packages/web',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: ROOT,
    },
  ],
});
