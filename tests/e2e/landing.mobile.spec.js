import { test, expect } from '@playwright/test';
import { gameModeButton, landing, waitForGameState, GAME_MODES } from './helpers.js';

// Touch layout on the phone projects (android, iphone). Layout-agnostic
// landing checks live in landing.smoke.spec.js.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

function touchLayoutTests() {
  test('uses the Touch layout', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.dataset.layout)).toBe('touch');
  });

  test('every control fits on screen with a thumb-sized target', async ({ page }) => {
    const viewport = page.viewportSize();
    const controls = [
      ...Object.keys(GAME_MODES).map((mode) => gameModeButton(page, mode)),
      landing(page).getByRole('button', { name: 'Settings' }),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('nothing on the landing screen scrolls or is cut off', async ({ page }) => {
    const overflow = await landing(page).evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('a tap on a Game mode is not swallowed by the Touch zones', async ({ page }) => {
    await gameModeButton(page, 'rugby-versus').tap();
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('rugby-versus');
  });

  test('keyboard hints are not shown', async ({ page }) => {
    await expect(landing(page).locator('.key-hint')).toBeHidden();
    await expect(landing(page).locator('.mode-key').first()).toBeHidden();
  });
}

test.describe('Touch layout', touchLayoutTests);

// A slightly different landscape phone size than the project's own device
test.describe('Touch layout at 844x390', () => {
  test.use({ viewport: { width: 844, height: 390 } });
  touchLayoutTests();
});

test('landing screen taps still work after returning from a game', async ({ page }) => {
  await gameModeButton(page, 'versus').tap();
  await waitForGameState(page, 'PLAYING');
  await page.evaluate(async () => {
    const gs = await import('/src/game-state.js');
    gs.showLanding(window.__gameState);
  });
  await waitForGameState(page, 'LANDING');
  await expect(landing(page)).toBeVisible();
  await gameModeButton(page, 'single').tap();
  await waitForGameState(page, 'PLAYING');
  expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('single');
});
