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
  // Spec naming convention (see README):
  //   *.spec.js         desktop only
  //   *.mobile.spec.js  phones only (android, iphone)
  //   *.smoke.spec.js   all projects
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/*.mobile.spec.js',
    },
    {
      name: 'android',
      use: { ...devices['Pixel 7 landscape'] },
      testMatch: ['**/*.mobile.spec.js', '**/*.smoke.spec.js'],
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 14 landscape'] },
      testMatch: ['**/*.mobile.spec.js', '**/*.smoke.spec.js'],
    },
  ],
  webServer: {
    command: `npx http-server . -p ${PORT} -c-1 --silent`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
