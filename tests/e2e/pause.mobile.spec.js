import { test, expect } from '@playwright/test';
import { gameModeButton, waitForGameState, pauseButton, pauseScreen, overlayButton } from './helpers.js';

// The pause button and pause screen in the Touch layout (android, iphone).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  await gameModeButton(page, 'versus').tap();
  await waitForGameState(page, 'PLAYING');
  await page.waitForFunction(() => !window.__gameState.transitions.active);
});

test('the pause button is top-right, thumb-sized and clear of the top-left corner', async ({ page }) => {
  await expect(pauseButton(page)).toBeVisible();
  const box = await pauseButton(page).boundingBox();
  const vp = page.viewportSize();
  expect(box.x).toBeGreaterThan(vp.width * 0.75);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeLessThan(vp.height * 0.25);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.waitForTimeout(300); // let the screen fade in
  await page.screenshot({ path: `.scratch/hud-touch-${test.info().project.name}.png` });
});

test('tapping the pause button pauses; touch.js does not swallow the tap', async ({ page }) => {
  await pauseButton(page).tap();
  await waitForGameState(page, 'PAUSED');
  await expect(pauseScreen(page)).toBeVisible();
});

test('tapping the pause button does not start a drag in the Touch zone under it', async ({ page }) => {
  const before = await page.evaluate(() => window.__gameState.paddles.right.y);
  await pauseButton(page).tap();
  await waitForGameState(page, 'PAUSED');
  expect(await page.evaluate(() => window.__gameState.paddles.right.y)).toBe(before);
});

test('the pause screen has thumb-sized Resume, Settings and Quit to Menu that fit the screen', async ({ page }) => {
  await pauseButton(page).tap();
  const screen = pauseScreen(page);
  await expect(screen).toBeVisible();
  const vp = page.viewportSize();
  for (const name of ['Resume', 'Settings', 'Quit to Menu']) {
    const box = await overlayButton(screen, name).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  }
  await page.waitForTimeout(300); // let the screen fade in
  await page.screenshot({ path: `.scratch/pause-touch-${test.info().project.name}.png` });
});

test('Resume resumes by tap', async ({ page }) => {
  await pauseButton(page).tap();
  await overlayButton(pauseScreen(page), 'Resume').tap();
  await waitForGameState(page, 'PLAYING');
  await expect(pauseButton(page)).toBeVisible();
});

test('Settings opens settings by tap and stays paused', async ({ page }) => {
  await pauseButton(page).tap();
  await overlayButton(pauseScreen(page), 'Settings').tap();
  const s = await page.evaluate(() => ({ show: window.__gameState.showSettings, gs: window.__gameState.gameState }));
  expect(s).toEqual({ show: true, gs: 'PAUSED' });
});

test('Quit to Menu returns to landing by tap', async ({ page }) => {
  await pauseButton(page).tap();
  await overlayButton(pauseScreen(page), 'Quit to Menu').tap();
  await waitForGameState(page, 'LANDING');
});

test('dragging in the Touch zones still moves the paddles with the button present', async ({ page }) => {
  const before = await page.evaluate(() => window.__gameState.paddles.left.y);
  await page.evaluate(() => {
    const fire = (type, y) => document.body.dispatchEvent(new PointerEvent(type, {
      pointerId: 7, pointerType: 'touch', clientX: 20, clientY: y, bubbles: true, cancelable: true,
    }));
    fire('pointerdown', 100);
    fire('pointermove', 160);
    fire('pointerup', 160);
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__gameState.paddles.left.y)).toBeGreaterThan(before);
});
