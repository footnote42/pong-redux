import { test, expect, devices } from '@playwright/test';
import { chooseGameMode, gameModeButton, landing, waitForGameState, GAME_MODES } from './helpers.js';

const DESCRIPTIONS = {
  single: 'You against the computer.',
  versus: 'Two players, one device.',
  'rugby-single': 'Spin, momentum and score multipliers for long rallies, against the CPU. Race to a target score or beat the clock.',
  'rugby-versus': 'The same, head to head.',
};

async function openPong(page, path = '/') {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto(path);
  await page.waitForFunction(() => !!window.__gameState);
}

// Runs on every Playwright project (desktop and, once #9 lands, phones)
test.describe('landing screen', () => {
  test.beforeEach(async ({ page }) => openPong(page));

  test('loads on LANDING with the HTML landing screen shown', async ({ page }) => {
    expect(await page.evaluate(() => window.__gameState.gameState)).toBe('LANDING');
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
  }

  test('vs CPU starts a game against the CPU', async ({ page }) => {
    await chooseGameMode(page, 'single');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('single');
    expect(await page.evaluate(() => window.__gameState.cpu.enabled)).toBe(true);
    await expect(landing(page)).toBeHidden();
  });

  test('2 Players starts a two-player game', async ({ page }) => {
    await chooseGameMode(page, 'versus');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('versus');
    await expect(landing(page)).toBeHidden();
  });

  test('Rugby (1P) starts Rugby mode', async ({ page }) => {
    await chooseGameMode(page, 'rugby-single');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('rugby-single');
    expect(await page.evaluate(() => window.__gameState.rugbyMode.enabled)).toBe(true);
  });

  test('Rugby (2P) starts Rugby mode', async ({ page }) => {
    await chooseGameMode(page, 'rugby-versus');
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('rugby-versus');
    expect(await page.evaluate(() => window.__gameState.rugbyMode.enabled)).toBe(true);
  });

  test('settings gear opens settings and hides the landing screen', async ({ page }) => {
    await landing(page).getByRole('button', { name: 'Settings' }).click();
    expect(await page.evaluate(() => window.__gameState.showSettings)).toBe(true);
    await expect(landing(page)).toBeHidden();
  });

  test('landing screen comes back after quitting to the menu', async ({ page }) => {
    await page.keyboard.press('1');
    await waitForGameState(page, 'PLAYING');
    await page.keyboard.press('p');
    await page.keyboard.press('m');
    await waitForGameState(page, 'LANDING');
    await expect(landing(page)).toBeVisible();
  });

  test('link back to waynetellis.com shows when Standalone', async ({ page }) => {
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

test.describe('keyboard', () => {
  test.beforeEach(async ({ page }) => openPong(page));

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

// A landscape phone, emulated in Chromium whatever project runs this file
const { defaultBrowserType, ...pixelLandscape } = devices['Pixel 7 landscape'];
for (const [label, use] of [
  ['Pixel 7 landscape (863x360)', pixelLandscape],
  ['landscape phone 844x390', { ...pixelLandscape, viewport: { width: 844, height: 390 } }],
]) {
  test.describe(`Touch layout on ${label}`, () => {
    test.use(use);
    test.beforeEach(async ({ page }) => openPong(page));

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

    test('tapping Rugby (1P) starts Rugby mode', async ({ page }) => {
      await gameModeButton(page, 'rugby-single').tap();
      await waitForGameState(page, 'PLAYING');
      expect(await page.evaluate(() => window.__gameState.gameMode)).toBe('rugby-single');
    });

    test('tapping the settings gear opens settings', async ({ page }) => {
      await landing(page).getByRole('button', { name: 'Settings' }).tap();
      expect(await page.evaluate(() => window.__gameState.showSettings)).toBe(true);
    });

    test('keyboard hints are not shown', async ({ page }) => {
      await expect(landing(page).locator('.key-hint')).toBeHidden();
    });
  });
}
