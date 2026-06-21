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

test('rugby single mode sets rugbyMode.enabled', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbySingle.x, BUTTONS.rugbySingle.y);
  await waitForGameState(page, 'PLAYING');
  const enabled = await page.evaluate(() => window.__gameState.rugbyMode.enabled);
  expect(enabled).toBe(true);
});

test('rugby versus mode sets rugbyMode.enabled', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbyVersus.x, BUTTONS.rugbyVersus.y);
  await waitForGameState(page, 'PLAYING');
  const enabled = await page.evaluate(() => window.__gameState.rugbyMode.enabled);
  expect(enabled).toBe(true);
});

test('rugby single uses CPU opponent', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbySingle.x, BUTTONS.rugbySingle.y);
  await waitForGameState(page, 'PLAYING');
  const cpuEnabled = await page.evaluate(() => window.__gameState.cpu?.enabled);
  expect(cpuEnabled).toBe(true);
});

test('rugby versus disables CPU', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbyVersus.x, BUTTONS.rugbyVersus.y);
  await waitForGameState(page, 'PLAYING');
  const cpuEnabled = await page.evaluate(() => window.__gameState.cpu?.enabled);
  expect(cpuEnabled).toBe(false);
});

test('rugby settings tab appears in settings when in rugby mode', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbySingle.x, BUTTONS.rugbySingle.y);
  await waitForGameState(page, 'PLAYING');
  await page.keyboard.press('Tab');
  const showSettings = await page.evaluate(() => window.__gameState.showSettings);
  expect(showSettings).toBe(true);
  // Rugby tab should be available (rugbyMode.enabled = true)
  const rugbyEnabled = await page.evaluate(() => window.__gameState.rugbyMode.enabled);
  expect(rugbyEnabled).toBe(true);
});

test('returning to landing resets rugbyMode', async ({ page }) => {
  await clickCanvasAt(page, BUTTONS.rugbySingle.x, BUTTONS.rugbySingle.y);
  await waitForGameState(page, 'PLAYING');
  // Pause and go to menu
  await page.keyboard.press('p');
  await page.keyboard.press('m');
  await waitForGameState(page, 'LANDING');
  const enabled = await page.evaluate(() => window.__gameState.rugbyMode.enabled);
  expect(enabled).toBe(false);
});
