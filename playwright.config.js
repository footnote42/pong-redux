import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 20_000,
  use: { baseURL: 'http://localhost:8080' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx http-server . -p 8080 -c-1 --silent',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
