import { test, expect } from '@playwright/test';

// Smoke specs (*.smoke.spec.js) run on every project: desktop, android, iphone.
test('landing screen loads', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  const state = await page.evaluate(() => window.__gameState.gameState);
  expect(state).toBe('LANDING');
  await expect(page.locator('#gameCanvas')).toBeVisible();
});
