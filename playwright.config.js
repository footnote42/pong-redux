import { defineConfig, devices } from '@playwright/test';

// PORT lets parallel worktrees each serve their own copy (default 8080).
const PORT = Number(process.env.PORT) || 8080;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 20_000,
  // Parallel workers flake on cold server start (first test per file); one worker is reliable.
  workers: 1,
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx http-server . -p ${PORT} -c-1 --silent`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
