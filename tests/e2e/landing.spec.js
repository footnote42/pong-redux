import { test, expect } from '@playwright/test';
import { clickCanvasAt, waitForGameState, BUTTONS } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

test('loads on LANDING screen', async ({ page }) => {
  const state = await page.evaluate(() => window.__gameState.gameState);
  expect(state).toBe('LANDING');
});

test('single player button starts game in single mode', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.single.x, BUTTONS.single.y);
  await waitForGameState(page, 'PLAYING');
  const mode = await page.evaluate(() => window.__gameState.gameMode);
  expect(mode).toBe('single');
});

test('versus button starts game in versus mode', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.versus.x, BUTTONS.versus.y);
  await waitForGameState(page, 'PLAYING');
  const mode = await page.evaluate(() => window.__gameState.gameMode);
  expect(mode).toBe('versus');
});

test('rugby single button starts rugby mode', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbySingle.x, BUTTONS.rugbySingle.y);
  await waitForGameState(page, 'PLAYING');
  const enabled = await page.evaluate(() => window.__gameState.rugbyMode.enabled);
  expect(enabled).toBe(true);
});

test('rugby versus button starts rugby mode', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbyVersus.x, BUTTONS.rugbyVersus.y);
  await waitForGameState(page, 'PLAYING');
  const enabled = await page.evaluate(() => window.__gameState.rugbyMode.enabled);
  expect(enabled).toBe(true);
});

test('settings gear opens settings panel', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.settings.x, BUTTONS.settings.y);
  const showSettings = await page.evaluate(() => window.__gameState.showSettings);
  expect(showSettings).toBe(true);
});

test('keyboard 1 starts single player', async ({ page }) => {
  await page.keyboard.press('1');
  await waitForGameState(page, 'PLAYING');
  const mode = await page.evaluate(() => window.__gameState.gameMode);
  expect(mode).toBe('single');
});

test('keyboard 2 starts versus', async ({ page }) => {
  await page.keyboard.press('2');
  await waitForGameState(page, 'PLAYING');
  const mode = await page.evaluate(() => window.__gameState.gameMode);
  expect(mode).toBe('versus');
});
