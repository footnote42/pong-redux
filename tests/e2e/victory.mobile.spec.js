import { test, expect } from '@playwright/test';
import { waitForGameState, victoryScreen, overlayButton } from './helpers.js';

// A touch-only player must be able to leave the victory screen: the HTML
// Play Again and Main Menu buttons, thumb-sized in the Touch layout.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  await page.keyboard.press('2');
  await waitForGameState(page, 'PLAYING');
  await page.evaluate(() => {
    window.__gameState.gameState = 'GAME_OVER';
    window.__gameState.winner = 'left';
  });
  await expect(victoryScreen(page)).toBeVisible();
});

test('the victory screen names the winner and fits the screen with thumb-sized buttons', async ({ page }) => {
  const screen = victoryScreen(page);
  await expect(screen.getByRole('heading', { name: 'Player 1 Wins!' })).toBeVisible();
  const vp = page.viewportSize();
  for (const name of ['Play Again', 'Main Menu']) {
    const box = await overlayButton(screen, name).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  }
  await page.waitForTimeout(300); // let the screen fade in
  await page.screenshot({ path: `.scratch/victory-touch-${test.info().project.name}.png` });
});

test('tapping Play Again on the victory screen starts a new game', async ({ page }) => {
  await overlayButton(victoryScreen(page), 'Play Again').tap();
  await waitForGameState(page, 'PLAYING');
  const score = await page.evaluate(() => window.__gameState.score);
  expect(score).toEqual({ left: 0, right: 0 });
});

test('tapping Main Menu on the victory screen returns to the landing screen', async ({ page }) => {
  await overlayButton(victoryScreen(page), 'Main Menu').tap();
  await waitForGameState(page, 'LANDING');
});
