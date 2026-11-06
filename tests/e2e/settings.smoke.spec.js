import { test, expect } from '@playwright/test';
import { landing, settingsPanel, settingsTab, openSettingsFromGear, freshProfileOnce } from './helpers.js';

// Smoke specs run on every project: desktop, android, iphone. The settings
// panel opens, closes and saves in both the Touch and the Desktop layout.

test.beforeEach(async ({ page }) => {
  await freshProfileOnce(page);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

test('the gear opens every tab of the panel over the landing screen', async ({ page, hasTouch }) => {
  await openSettingsFromGear(page, hasTouch);
  await expect(landing(page)).toBeHidden();
  const expected = [['Gameplay', 'Difficulty'], ['Custom', 'Paddle style'], ['Audio', 'Sound effects'], ['About', 'Version 0.8.0']];
  for (const [tab, text] of expected) {
    await (hasTouch ? settingsTab(page, tab).tap() : settingsTab(page, tab).click());
    await expect(settingsPanel(page).getByText(text, { exact: true })).toBeVisible();
  }
});

test('the close button returns to the landing screen', async ({ page, hasTouch }) => {
  await openSettingsFromGear(page, hasTouch);
  const close = settingsPanel(page).getByRole('button', { name: 'Close settings' });
  await (hasTouch ? close.tap() : close.click());
  await expect(settingsPanel(page)).toBeHidden();
  await expect(landing(page)).toBeVisible();
  expect(await page.evaluate(() => window.__gameState.showSettings)).toBe(false);
});

test('a change in the panel is saved and applied to the game', async ({ page, hasTouch }) => {
  await openSettingsFromGear(page, hasTouch);
  const normal = settingsPanel(page).getByRole('radiogroup', { name: 'Win score' }).getByRole('radio', { name: '7' });
  await (hasTouch ? normal.tap() : normal.check());
  expect(await page.evaluate(() => window.__gameState.settings.winScore)).toBe(7);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pong:settings')).winScore)).toBe(7);
});
