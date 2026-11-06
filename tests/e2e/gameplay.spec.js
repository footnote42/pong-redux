import { test, expect } from '@playwright/test';
import { waitForGameState } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
});

test('P key pauses game', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
});

test('P key toggles pause off', async ({ page }) => {
  await page.keyboard.press('p');
  await page.keyboard.press('p');
  await waitForGameState(page, 'PLAYING');
});

test('ESC key pauses game', async ({ page }) => {
  await page.keyboard.press('Escape');
  await waitForGameState(page, 'PAUSED');
});

test('M key returns to landing when paused', async ({ page }) => {
  await page.keyboard.press('p');
  await page.keyboard.press('m');
  await waitForGameState(page, 'LANDING');
});

test('ball exit right increments left score', async ({ page }) => {
  await page.waitForFunction(
    () => window.__gameState.serveTimer <= 0,
    { timeout: 3000 }
  );
  await page.evaluate(() => {
    window.__gameState.ball.x = window.__gameState.width + 20;
  });
  await page.waitForFunction(
    () => window.__gameState.score.left > 0,
    { timeout: 2000 }
  );
});

test('ball exit left increments right score', async ({ page }) => {
  await page.waitForFunction(
    () => window.__gameState.serveTimer <= 0,
    { timeout: 3000 }
  );
  await page.evaluate(() => {
    window.__gameState.ball.x = -20;
  });
  await page.waitForFunction(
    () => window.__gameState.score.right > 0,
    { timeout: 2000 }
  );
});

test('game over triggers when score reaches win score', async ({ page }) => {
  await page.waitForFunction(
    () => window.__gameState.serveTimer <= 0,
    { timeout: 3000 }
  );
  await page.evaluate(() => {
    window.__gameState.winScore = 1;
    window.__gameState.settings.winScore = 1;
    window.__gameState.ball.x = window.__gameState.width + 20;
  });
  await page.waitForFunction(
    () => window.__gameState.gameState === 'GAME_OVER',
    { timeout: 2000 }
  );
  const winner = await page.evaluate(() => window.__gameState.winner);
  expect(winner).toBe('left');
});

test('SPACE restarts game after game over', async ({ page }) => {
  await page.evaluate(() => {
    window.__gameState.gameState = 'GAME_OVER';
    window.__gameState.winner = 'left';
  });
  await page.keyboard.press('Space');
  await waitForGameState(page, 'PLAYING');
});
