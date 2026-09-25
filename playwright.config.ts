import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const repositoryRoot = process.cwd();
const auditRoot = path.join(repositoryRoot, '.cache', 'playwright-acceptance');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }
  ],
  webServer: [
    {
      command: 'npm run dev -w @droptest/server',
      url: 'http://127.0.0.1:3101/api/health',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        PORT: '3101',
        NODE_ENV: 'test',
        DATA_DIR: path.join(auditRoot, 'data'),
        UPLOAD_DIR: path.join(auditRoot, 'uploads'),
        GROQ_API_KEY: '',
        BRAVE_SEARCH_API_KEY: '',
        TAVILY_API_KEY: '',
        SERPER_API_KEY: ''
      }
    },
    {
      command: 'npm run dev -w @droptest/client -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      timeout: 120_000,
      reuseExistingServer: false,
      env: { DROPTEST_API_TARGET: 'http://127.0.0.1:3101' }
    }
  ]
});
