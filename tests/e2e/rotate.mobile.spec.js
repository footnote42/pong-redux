import { test, expect } from '@playwright/test';
import { gameModeButton, landing, waitForGameState } from './helpers.js';

// Rotate prompt: phone projects (android, iphone), which start in landscape.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
    // Real fullscreen in headless Chromium blocks setViewportSize (install.smoke.spec.js covers the request)
    Element.prototype.requestFullscreen = () => Promise.resolve();
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

const prompt = (page) => page.locator('#rotate-prompt');
const gameState = (page) => page.evaluate(() => window.__gameState.gameState);

async function rotate(page, to) {
  const { width, height } = page.viewportSize();
  const [w, h] = to === 'portrait' ? [Math.min(width, height), Math.max(width, height)] : [Math.max(width, height), Math.min(width, height)];
  await page.setViewportSize({ width: w, height: h });
}

async function startVersus(page) {
  await gameModeButton(page, 'versus').tap();
  await waitForGameState(page, 'PLAYING');
}

test('landscape hides the prompt, upright shows it', async ({ page }) => {
  await expect(prompt(page)).toBeHidden();
  await rotate(page, 'portrait');
  await expect(prompt(page)).toBeVisible();
  await page.screenshot({ path: `.scratch/rotate-prompt-${test.info().project.name}.png` });
  await rotate(page, 'landscape');
  await expect(prompt(page)).toBeHidden();
});

test('upright, the prompt sits above the HTML landing screen', async ({ page }) => {
  await expect(landing(page)).toBeVisible();
  await rotate(page, 'portrait');
  await expect(prompt(page)).toBeVisible();
  const { width, height } = page.viewportSize();
  for (const [x, y] of [[width / 2, height / 2], [width / 4, height / 3], [width - 30, 30]]) {
    const onTop = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('#rotate-prompt'), [x, y]);
    expect(onTop).toBe(true);
  }
  await rotate(page, 'landscape');
  await expect(prompt(page)).toBeHidden();
  await expect(landing(page)).toBeVisible();
  expect(await gameState(page)).toBe('LANDING');
});

test('rotating mid-game pauses, and turning back does not resume', async ({ page }) => {
  await startVersus(page);
  await rotate(page, 'portrait');
  await expect(prompt(page)).toBeVisible();
  await waitForGameState(page, 'PAUSED');

  await rotate(page, 'landscape');
  await expect(prompt(page)).toBeHidden();
  await page.waitForTimeout(200);
  expect(await gameState(page)).toBe('PAUSED');

  // The player chooses Resume
  await page.keyboard.press('p');
  await waitForGameState(page, 'PLAYING');
});

test('paddles do not move under the prompt', async ({ page }) => {
  await startVersus(page);
  await rotate(page, 'portrait');
  await waitForGameState(page, 'PAUSED');
  const before = await page.evaluate(() => window.__gameState.paddles.left.y);
  await page.evaluate(() => {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 100, bubbles: true }));
    document.body.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 300, bubbles: true }));
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__gameState.paddles.left.y)).toBe(before);
});
