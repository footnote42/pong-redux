import { test, expect } from '@playwright/test';
import { gameModeButton, landing, waitForGameState } from './helpers.js';

// Desktop layout and keyboard (desktop project only). Layout-agnostic landing
// checks live in landing.smoke.spec.js; the Touch layout in landing.mobile.spec.js.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

test('uses the Desktop layout inside the canvas frame', async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.dataset.layout)).toBe('desktop');
  const canvas = await page.locator('#gameCanvas').boundingBox();
  const screen = await landing(page).boundingBox();
  expect(screen.x).toBeGreaterThanOrEqual(canvas.x);
  expect(screen.y).toBeGreaterThanOrEqual(canvas.y);
  expect(screen.x + screen.width).toBeLessThanOrEqual(canvas.x + canvas.width);
  expect(screen.y + screen.height).toBeLessThanOrEqual(canvas.y + canvas.height);
  await expect(landing(page).locator('.key-hint')).toBeVisible();
});

test('landing screen comes back after quitting to the menu', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('p');
  await page.keyboard.press('m');
  await waitForGameState(page, 'LANDING');
  await expect(landing(page)).toBeVisible();
});

test('Escape on the landing screen leaves it in place', async ({ page }) => {
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__gameState.gameState)).toBe('LANDING');
  await expect(landing(page)).toBeVisible();
});

test.describe('keyboard', () => {
  test('1 starts vs CPU', async ({ page }) => {
    await page.keyboard.press('1');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('single');
  });

  test('2 starts 2 Players', async ({ page }) => {
    await page.keyboard.press('2');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('versus');
  });

  test('Enter with nothing focused starts 2 Players', async ({ page }) => {
    await page.keyboard.press('Enter');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('versus');
  });

  test('Tab opens settings', async ({ page }) => {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => window.__gameState.showSettings)).toBe(true);
    await expect(landing(page)).toBeHidden();
  });

  test('arrow keys reach Rugby (2P) and Enter starts it', async ({ page }) => {
    await page.keyboard.press('ArrowDown'); // focuses vs CPU
    await expect(gameModeButton(page, 'single')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(gameModeButton(page, 'rugby-versus')).toBeFocused();
    await page.keyboard.press('Enter');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('rugby-versus');
  });

  test('Space on a focused Game mode starts it', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(gameModeButton(page, 'rugby-single')).toBeFocused();
    await page.keyboard.press(' ');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('rugby-single');
  });
});
