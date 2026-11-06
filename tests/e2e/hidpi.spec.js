import { test, expect } from '@playwright/test';
import { chooseGameMode, waitForGameState } from './helpers.js';

test.use({ deviceScaleFactor: 2 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

test('canvas backing store follows devicePixelRatio and a Game mode still starts', async ({ page }) => {
  // The first rendered frame resizes the backing store; wait for it.
  await page.waitForFunction(() => {
    const c = document.getElementById('gameCanvas');
    return c.width === Math.round(c.clientWidth * window.devicePixelRatio);
  });

  const { dpr, cssWidth, backingWidth } = await page.evaluate(() => {
    const c = document.getElementById('gameCanvas');
    return { dpr: window.devicePixelRatio, cssWidth: c.clientWidth, backingWidth: c.width };
  });
  expect(dpr).toBe(2);
  expect(backingWidth).toBe(Math.round(cssWidth * 2));

  // Court logic stays at 800x600.
  const courtWidth = await page.evaluate(() => window.__gameState.width);
  expect(courtWidth).toBe(800);

  await chooseGameMode(page, 'single');
  await waitForGameState(page, 'PLAYING');
  const mode = await page.evaluate(() => window.__gameState.gameMode);
  expect(mode).toBe('single');
});
