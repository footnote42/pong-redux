import { test, expect } from '@playwright/test';
import { waitForGameState } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

test('Tab opens settings panel from landing', async ({ page }) => {
  await page.keyboard.press('Tab');
  const showSettings = await page.evaluate(() => window.__gameState.showSettings);
  expect(showSettings).toBe(true);
});

test('Escape closes settings panel', async ({ page }) => {
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  const showSettings = await page.evaluate(() => window.__gameState.showSettings);
  expect(showSettings).toBe(false);
});

// Difficulty shortcuts only work from PLAYING state (landing '1'/'2' starts game instead)
test('keyboard shortcut 1 sets difficulty to easy in settings (during play)', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('Tab');
  await page.keyboard.press('1');
  const difficulty = await page.evaluate(() => window.__gameState.settings.difficulty);
  expect(difficulty).toBe('easy');
});

test('keyboard shortcut 2 sets difficulty to medium in settings (during play)', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('Tab');
  await page.evaluate(() => { window.__gameState.settings.difficulty = 'hard'; });
  await page.keyboard.press('2');
  const difficulty = await page.evaluate(() => window.__gameState.settings.difficulty);
  expect(difficulty).toBe('medium');
});

test('keyboard shortcut 3 sets difficulty to hard in settings (during play)', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('Tab');
  await page.keyboard.press('3');
  const difficulty = await page.evaluate(() => window.__gameState.settings.difficulty);
  expect(difficulty).toBe('hard');
});

test('settings accessible via Tab during gameplay', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('Tab');
  const showSettings = await page.evaluate(() => window.__gameState.showSettings);
  expect(showSettings).toBe(true);
});

test('settings close when Tab pressed again during gameplay', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const showSettings = await page.evaluate(() => window.__gameState.showSettings);
  expect(showSettings).toBe(false);
});

test('default settings tab is gameplay', async ({ page }) => {
  await page.keyboard.press('Tab');
  const tab = await page.evaluate(() => window.__gameState.settingsTab);
  expect(tab).toBe('gameplay');
});
