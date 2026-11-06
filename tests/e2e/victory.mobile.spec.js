import { test, expect } from '@playwright/test';
import { waitForGameState } from './helpers.js';

// A touch-only player must be able to leave the victory screen.

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
});

// Tap the centre of a victory button, given in 800x600 court coordinates.
async function tapVictoryButton(page, mode) {
  const { x, y } = await page.evaluate(async (mode) => {
    const { getVictoryButtons } = await import('/src/renderer-menu.js');
    const b = getVictoryButtons(800, 600)[mode];
    const c = document.getElementById('gameCanvas');
    const r = c.getBoundingClientRect();
    const k = (r.width - c.clientLeft * 2) / 800;
    return {
      x: r.left + c.clientLeft + (b.x + b.w / 2) * k,
      y: r.top + c.clientTop + (b.y + b.h / 2) * k,
    };
  }, mode);
  await page.touchscreen.tap(x, y);
}

test('tapping Play Again on the victory screen starts a new game', async ({ page }) => {
  await tapVictoryButton(page, 'again');
  await waitForGameState(page, 'PLAYING');
  const score = await page.evaluate(() => window.__gameState.score);
  expect(score).toEqual({ left: 0, right: 0 });
});

test('tapping Main Menu on the victory screen returns to the landing screen', async ({ page }) => {
  await tapVictoryButton(page, 'menu');
  await waitForGameState(page, 'LANDING');
});
