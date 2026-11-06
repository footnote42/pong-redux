import { test, expect } from '@playwright/test';

// Desktop never sees the Rotate prompt, even in a tall, narrow window.

test('portrait-shaped desktop window never shows the Rotate prompt', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  await expect(page.locator('#rotate-prompt')).toBeHidden();
  expect(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)).toBe(false);

  // A game in progress is not paused by resizing
  await page.evaluate(() => { window.__gameState.gameState = 'PLAYING'; });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__gameState.gameState)).toBe('PLAYING');
});
