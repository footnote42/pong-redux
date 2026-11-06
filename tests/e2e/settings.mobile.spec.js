import { test, expect } from '@playwright/test';
import { waitForGameState, gameModeButton, pauseButton, pauseScreen, overlayButton, settingsPanel, settingsTab, settingsGroup, openSettingsFromGear, freshProfileOnce } from './helpers.js';

// Touch layout on the phone projects (android, iphone, held in landscape).

test.beforeEach(async ({ page }) => {
  await freshProfileOnce(page);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  await openSettingsFromGear(page, true);
});

const TABS = ['Gameplay', 'Custom', 'Audio', 'About'];

test('uses the Touch layout', async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.dataset.layout)).toBe('touch');
});

test('the panel fits on screen in every tab and nothing overflows sideways', async ({ page }) => {
  const viewport = page.viewportSize();
  const panel = settingsPanel(page).locator('.settings-panel');
  for (const tab of TABS) {
    await settingsTab(page, tab).tap();
    const box = await panel.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const overflowX = await page.evaluate(() => {
      const body = document.querySelector('[data-screen="settings"] .settings-body');
      return body.scrollWidth - body.clientWidth;
    });
    expect(overflowX, `${tab} tab overflows sideways`).toBeLessThanOrEqual(1);
  }
});

test('every control is thumb-sized (44px) in every tab', async ({ page }) => {
  for (const tab of TABS) {
    await settingsTab(page, tab).tap();
    if (tab === 'Custom') await settingsGroup(page, 'Paddle style').getByRole('radio', { name: 'Custom' }).tap();
    const controls = settingsPanel(page).locator(
      '[role="tab"]:visible, .settings-close, .settings-pane:not([hidden]) input:visible, .settings-pane:not([hidden]) .seg'
    );
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      if (!(await control.isVisible())) continue; // radios are laid under their label
      const box = await control.boundingBox();
      const name = await control.evaluate((n) => n.getAttribute('aria-label') || n.textContent.trim() || n.dataset.setting);
      expect(box.height, `${tab}: ${name} height`).toBeGreaterThanOrEqual(43.5);
      expect(box.width, `${tab}: ${name} width`).toBeGreaterThanOrEqual(43.5);
    }
  }
});

test('the Gameplay tab scrolls, so the last control is reachable and works', async ({ page, browserName }) => {
  const body = settingsPanel(page).locator('.settings-body');
  const dims = await body.evaluate((n) => ({ client: n.clientHeight, scroll: n.scrollHeight }));
  expect(dims.scroll, 'the gameplay tab is taller than the panel on a landscape phone').toBeGreaterThan(dims.client);

  if (browserName === 'chromium') {
    // A real touch swipe up the panel (Playwright has no swipe on WebKit)
    const cdp = await page.context().newCDPSession(page);
    const box = await body.boundingBox();
    const x = Math.round(box.x + 30);
    let y = Math.round(box.y + box.height - 30);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 0; i < 12; i++) {
      y -= 10;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await body.evaluate((n) => { n.scrollTop = n.scrollHeight; });
  }
  await expect.poll(() => body.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);

  const slider = settingsPanel(page).getByRole('slider', { name: /Paddle size/ });
  await expect(slider).toBeInViewport();
  await slider.fill('1.5');
  expect(await page.evaluate(() => window.__gameState.settings.paddleSize)).toBe(1.5);
  expect(await page.evaluate(() => window.__gameState.paddles.left.h)).toBe(120);
  // the page itself never scrolled
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('a thumb drag on the paddle-size slider changes it', async ({ page }) => {
  const slider = settingsPanel(page).getByRole('slider', { name: /Paddle size/ });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 4, y, { steps: 5 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.__gameState.settings.paddleSize)).toBeGreaterThan(1.3);
});

test('tapping a choice saves it and it survives a reload', async ({ page }) => {
  await settingsGroup(page, 'Difficulty').getByRole('radio', { name: 'Hard' }).tap();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pong:settings')).difficulty)).toBe('hard');
  await page.reload();
  await page.waitForFunction(() => !!window.__gameState);
  await openSettingsFromGear(page, true);
  await expect(settingsGroup(page, 'Difficulty').getByRole('radio', { name: 'Hard' })).toBeChecked();
});

test('tapping a switch toggles it', async ({ page }) => {
  await settingsTab(page, 'Audio').tap();
  const sound = settingsPanel(page).getByRole('switch', { name: 'Sound effects' });
  await sound.tap();
  await expect(sound).not.toBeChecked();
  expect(await page.evaluate(() => window.__gameState.settings.soundEnabled)).toBe(false);
});

test('the close button and a tap outside the panel both close it', async ({ page }) => {
  await settingsPanel(page).getByRole('button', { name: 'Close settings' }).tap();
  await expect(settingsPanel(page)).toBeHidden();
  await openSettingsFromGear(page, true);
  await settingsPanel(page).tap({ position: { x: 3, y: 3 } }); // the margin around the panel
  await expect(settingsPanel(page)).toBeHidden();
  // The tap that closed it must not fall through to a Game mode behind
  expect(await page.evaluate(() => window.__gameState.gameState)).toBe('LANDING');
  await expect(gameModeButton(page, 'single')).toBeVisible();
});

test('settings opened from the pause screen: close returns to pause, tap outside too', async ({ page }) => {
  await settingsPanel(page).getByRole('button', { name: 'Close settings' }).tap();
  await gameModeButton(page, 'single').tap();
  await waitForGameState(page, 'PLAYING');
  await pauseButton(page).tap();
  await waitForGameState(page, 'PAUSED');
  await overlayButton(pauseScreen(page), 'Settings').tap();
  await expect(settingsPanel(page)).toBeVisible();
  await expect(pauseButton(page)).toBeHidden();
  await settingsGroup(page, 'Difficulty').getByRole('radio', { name: 'Hard' }).tap();
  await settingsPanel(page).getByRole('button', { name: 'Close settings' }).tap();
  await expect(pauseScreen(page)).toBeVisible();
  await overlayButton(pauseScreen(page), 'Settings').tap();
  await settingsPanel(page).tap({ position: { x: 3, y: 3 } });
  await expect(pauseScreen(page)).toBeVisible();
  expect(await page.evaluate(() => window.__gameState.gameState)).toBe('PAUSED');
});

test('a tap inside the panel does not close it', async ({ page }) => {
  await settingsPanel(page).locator('.settings-body').tap({ position: { x: 4, y: 4 } });
  await expect(settingsPanel(page)).toBeVisible();
});

test('the Rugby tab is offered in Rugby mode and its options fit', async ({ page }) => {
  await expect(settingsTab(page, 'Rugby')).toBeHidden();
  await settingsPanel(page).getByRole('button', { name: 'Close settings' }).tap();
  await gameModeButton(page, 'rugby-single').tap();
  await waitForGameState(page, 'PLAYING');
  await page.evaluate(() => { window.__gameState.showSettings = true; });
  await expect(settingsTab(page, 'Rugby')).toBeVisible();
  await settingsTab(page, 'Rugby').tap();
  await settingsGroup(page, 'Target score').getByRole('radio', { name: '100' }).tap();
  expect(await page.evaluate(() => window.__gameState.rugbySettings.targetScore)).toBe(100);
  await expect(settingsGroup(page, 'Time limit')).toBeInViewport();
});
