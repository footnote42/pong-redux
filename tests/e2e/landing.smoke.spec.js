import { test, expect } from '@playwright/test';
import { gameModeButton, landing, waitForGameState, GAME_MODES } from './helpers.js';

// Smoke specs (*.smoke.spec.js) run on every project: desktop, android, iphone.
// These landing screen checks hold in both the Touch and the Desktop layout.

const DESCRIPTIONS = {
  single: 'You against the computer.',
  versus: 'Two players, one device.',
  'rugby-single': 'Spin, momentum and score multipliers for long rallies, against the CPU. Race to a target score or beat the clock.',
  'rugby-versus': 'The same, head to head.',
};

const EXPECTED = {
  single: { cpu: true, rugby: false },
  versus: { cpu: false, rugby: false },
  'rugby-single': { cpu: true, rugby: true },
  'rugby-versus': { cpu: false, rugby: true },
};

async function openPong(page, path = '/') {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto(path);
  await page.waitForFunction(() => !!window.__gameState);
}

// A tap on touch screens, a click with a mouse
const press = (locator, hasTouch) => (hasTouch ? locator.tap() : locator.click());

test.describe('landing screen', () => {
  test.beforeEach(async ({ page }) => openPong(page));

  test('loads on LANDING with the HTML landing screen shown', async ({ page }) => {
    expect(await page.evaluate(() => window.__gameState.gameState)).toBe('LANDING');
    await expect(page.locator('#gameCanvas')).toBeAttached();
    await expect(landing(page)).toBeVisible();
    await expect(landing(page).getByRole('heading', { name: 'PONG REDUX' })).toBeVisible();
  });

  test('layout follows the input type', async ({ page, hasTouch }) => {
    const layout = await page.evaluate(() => document.documentElement.dataset.layout);
    expect(layout).toBe(hasTouch ? 'touch' : 'desktop');
  });

  for (const [mode, name] of Object.entries(GAME_MODES)) {
    test(`${name} shows its description`, async ({ page }) => {
      await expect(gameModeButton(page, mode)).toHaveAccessibleDescription(DESCRIPTIONS[mode]);
      await expect(landing(page).getByText(DESCRIPTIONS[mode], { exact: true })).toBeVisible();
    });

    test(`${name} starts its Game mode`, async ({ page, hasTouch }) => {
      await press(gameModeButton(page, mode), hasTouch);
      await waitForGameState(page, 'PLAYING');
      const s = await page.evaluate(() => ({
        mode: window.__gameState.gameMode,
        cpu: !!window.__gameState.cpu?.enabled,
        rugby: window.__gameState.rugbyMode.enabled,
      }));
      expect(s).toEqual({ mode, ...EXPECTED[mode] });
      await expect(landing(page)).toBeHidden();
    });
  }

  test('settings gear opens settings and hides the landing screen', async ({ page, hasTouch }) => {
    await press(landing(page).getByRole('button', { name: 'Settings' }), hasTouch);
    expect(await page.evaluate(() => window.__gameState.showSettings)).toBe(true);
    await expect(landing(page)).toBeHidden();
  });

  test('link back to waynetellis.com shows when Standalone', async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.dataset.context)).toBe('standalone');
    const link = landing(page).getByRole('link', { name: /waynetellis\.com/ });
    await expect(link).toBeVisible();
    // Pong never navigates a parent page
    expect(await link.getAttribute('target')).toBeNull();
  });

  test('link back is hidden when Embedded', async ({ page }) => {
    await page.route('**/embed-host.html', (route) => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><body style="margin:0"><iframe src="/index.html" style="width:100vw;height:100vh;border:0"></iframe></body>',
    }));
    await page.goto('/embed-host.html');
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('[data-screen="landing"]')).toBeVisible();
    expect(await page.frames()[1].evaluate(() => document.documentElement.dataset.context)).toBe('embedded');
    await expect(frame.getByRole('link', { name: /waynetellis\.com/ })).toBeHidden();
  });
});
