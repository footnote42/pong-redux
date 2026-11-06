import { test, expect } from '@playwright/test';
import {
  waitForGameState, chooseGameMode, clickCanvasAt, landing,
  settingsPanel, settingsTab, settingsGroup, openSettingsFromGear, freshProfileOnce,
} from './helpers.js';

// Desktop layout: the settings panel is HTML over the canvas. Shared open/close
// paths also run on phones in settings.smoke.spec.js; the Touch layout checks
// live in settings.mobile.spec.js.

test.beforeEach(async ({ page }) => {
  await freshProfileOnce(page);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

const isOpen = (page) => page.evaluate(() => window.__gameState.showSettings);
const saved = (page, key = 'pong:settings') => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);

test.describe('opening and closing', () => {
  test('Tab opens the panel from landing and Tab closes it again', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeVisible();
    await expect(landing(page)).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeHidden();
    await expect(landing(page)).toBeVisible();
    expect(await isOpen(page)).toBe(false);
  });

  test('Escape closes the panel', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(settingsPanel(page)).toBeHidden();
    expect(await isOpen(page)).toBe(false);
  });

  test('the close button closes the panel', async ({ page }) => {
    await openSettingsFromGear(page);
    await settingsPanel(page).getByRole('button', { name: 'Close settings' }).click();
    await expect(settingsPanel(page)).toBeHidden();
    await expect(landing(page)).toBeVisible();
  });

  test('clicking outside the panel closes it, clicking inside does not', async ({ page }) => {
    await openSettingsFromGear(page);
    await settingsPanel(page).locator('.settings-body').click({ position: { x: 4, y: 4 } });
    await settingsTab(page, 'Audio').click();
    await expect(settingsPanel(page)).toBeVisible();
    await settingsPanel(page).click({ position: { x: 4, y: 4 } }); // the dimmed edge
    await expect(settingsPanel(page)).toBeHidden();
  });

  test('a slider drag that ends outside the panel does not close it', async ({ page }) => {
    await openSettingsFromGear(page);
    const slider = settingsPanel(page).getByRole('slider', { name: /Paddle size/ });
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, 2);
    await page.mouse.up();
    await expect(settingsPanel(page)).toBeVisible();
  });

  test('the gear opens the panel on the Gameplay tab', async ({ page }) => {
    await openSettingsFromGear(page);
    await expect(settingsTab(page, 'Gameplay')).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => window.__gameState.settingsTab)).toBe('gameplay');
  });

  test('the pause overlay Settings button opens the panel over the pause, and closing returns to it', async ({ page }) => {
    await page.keyboard.press('1');
    await waitForGameState(page, 'PLAYING');
    await page.keyboard.press('p');
    await waitForGameState(page, 'PAUSED');
    await clickCanvasAt(page, 400, 416 + 30); // pause overlay Settings button
    await expect(settingsPanel(page)).toBeVisible();
    expect(await page.evaluate(() => window.__gameState.gameState)).toBe('PAUSED');
    await page.keyboard.press('Escape');
    await expect(settingsPanel(page)).toBeHidden();
    expect(await page.evaluate(() => window.__gameState.gameState)).toBe('PAUSED');
  });

  test('Tab opens and closes the panel during play', async ({ page }) => {
    await page.keyboard.press('1');
    await waitForGameState(page, 'PLAYING');
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeHidden();
  });

  test('the number keys set difficulty while the panel is open, instead of starting a game', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('3');
    expect(await page.evaluate(() => window.__gameState.settings.difficulty)).toBe('hard');
    expect(await page.evaluate(() => window.__gameState.gameState)).toBe('LANDING');
    await expect(settingsGroup(page, 'Difficulty').getByRole('radio', { name: 'Hard' })).toBeChecked();
    await page.keyboard.press('1');
    await expect(settingsGroup(page, 'Difficulty').getByRole('radio', { name: 'Easy' })).toBeChecked();
    await page.keyboard.press('2');
    expect(await page.evaluate(() => window.__gameState.settings.difficulty)).toBe('medium');
  });
});

test.describe('keyboard', () => {
  test('arrow keys bring focus into the panel and along the tabs', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(settingsTab(page, 'Gameplay')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(settingsTab(page, 'Custom')).toBeFocused();
    await expect(settingsTab(page, 'Custom')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(settingsTab(page, 'About')).toBeFocused();
  });

  test('Tab moves between controls once focus is in the panel, Escape still closes', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page)).toBeVisible();
    await expect(settingsPanel(page).getByRole('button', { name: 'Close settings' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(settingsGroup(page, 'Difficulty').getByRole('radio', { name: 'Medium' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(settingsPanel(page)).toBeHidden();
  });

  test('arrow keys move a slider', async ({ page }) => {
    await openSettingsFromGear(page);
    const slider = settingsPanel(page).getByRole('slider', { name: /Ball speed/ });
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => window.__gameState.settings.ballSpeed)).toBeCloseTo(1.2, 5);
    expect(await isOpen(page)).toBe(true);
  });

  test('Space toggles a switch', async ({ page }) => {
    await openSettingsFromGear(page);
    const endless = settingsPanel(page).getByRole('switch', { name: 'Endless mode' });
    await endless.focus();
    await page.keyboard.press('Space');
    await expect(endless).toBeChecked();
    expect(await page.evaluate(() => window.__gameState.settings.endlessMode)).toBe(true);
  });
});

test.describe('tabs', () => {
  test('default tab is Gameplay and each tab shows its own controls', async ({ page }) => {
    await openSettingsFromGear(page);
    const panel = settingsPanel(page);
    await expect(panel.getByRole('tabpanel', { name: 'Gameplay' })).toBeVisible();
    await settingsTab(page, 'Custom').click();
    await expect(panel.getByRole('tabpanel', { name: 'Custom' })).toBeVisible();
    await expect(panel.getByRole('tabpanel', { name: 'Gameplay' })).toBeHidden();
    await settingsTab(page, 'Audio').click();
    await expect(panel.getByRole('switch', { name: 'Sound effects' })).toBeVisible();
    await settingsTab(page, 'About').click();
    await expect(panel.getByText('Pong Redux', { exact: true })).toBeVisible();
    await expect(panel.getByText('Version 0.8.0')).toBeVisible();
  });

  test('the Rugby tab is not offered outside Rugby mode', async ({ page }) => {
    await openSettingsFromGear(page);
    await expect(settingsTab(page, 'Rugby')).toBeHidden();
    await expect(settingsPanel(page).getByRole('tab')).toHaveCount(4);
  });

  test('the Rugby tab appears in Rugby mode, between Custom and Audio', async ({ page }) => {
    await chooseGameMode(page, 'rugby-single');
    await waitForGameState(page, 'PLAYING');
    await page.keyboard.press('Tab');
    await expect(settingsPanel(page).getByRole('tab')).toHaveText(['Gameplay', 'Custom', 'Rugby', 'Audio', 'About']);
    await settingsTab(page, 'Rugby').click();
    await expect(settingsGroup(page, 'Target score')).toBeVisible();
    await expect(settingsGroup(page, 'Time limit')).toBeVisible();
  });

  test('custom paddle colours show only for the Custom paddle style; trail length only with a trail', async ({ page }) => {
    await openSettingsFromGear(page);
    await settingsTab(page, 'Custom').click();
    const panel = settingsPanel(page);
    await expect(settingsGroup(page, 'Left paddle colour')).toBeHidden();
    await settingsGroup(page, 'Paddle style').getByRole('radio', { name: 'Custom' }).check();
    await expect(settingsGroup(page, 'Left paddle colour')).toBeVisible();
    await expect(settingsGroup(page, 'Right paddle colour')).toBeVisible();
    await expect(panel.getByRole('slider', { name: /Trail length/ })).toBeHidden();
    await panel.getByRole('switch', { name: 'Ball trail' }).check();
    await expect(panel.getByRole('slider', { name: /Trail length/ })).toBeVisible();
  });

  test('volume is disabled while sound is off', async ({ page }) => {
    await openSettingsFromGear(page);
    await settingsTab(page, 'Audio').click();
    const volume = settingsPanel(page).getByRole('slider', { name: /Volume/ });
    await expect(volume).toBeEnabled();
    await settingsPanel(page).getByRole('switch', { name: 'Sound effects' }).uncheck();
    await expect(volume).toBeDisabled();
  });
});

// Every setting: change it in the panel, reload, and find it saved under the
// same localStorage keys as before and shown again in the panel.
const OPTION = (group, name) => (p) => settingsGroup(p, group).getByRole('radio', { name, exact: true });
const SLIDER = (name) => (p) => settingsPanel(p).getByRole('slider', { name });
const SWITCH = (name) => (p) => settingsPanel(p).getByRole('switch', { name });

const CHOICES = [
  { key: 'difficulty', tab: 'Gameplay', control: OPTION('Difficulty', 'Hard'), expected: 'hard' },
  { key: 'ballSpeed', tab: 'Gameplay', control: OPTION('Ball speed presets', 'Fast'), expected: 1.3 },
  { key: 'winScore', tab: 'Gameplay', control: OPTION('Win score', '21'), expected: 21 },
  { key: 'paddleStyle', tab: 'Custom', control: OPTION('Paddle style', 'Neon'), expected: 'neon' },
  { key: 'ballStyle', tab: 'Custom', control: OPTION('Ball style', 'Soccer'), expected: 'soccer' },
];

const TOGGLES = [
  { key: 'endlessMode', tab: 'Gameplay', control: SWITCH('Endless mode'), expected: true },
  { key: 'ballTrail', tab: 'Custom', control: SWITCH('Ball trail'), expected: true },
  { key: 'ballFlash', tab: 'Custom', control: SWITCH('Ball flash on hit'), expected: false }, // on by default
  { key: 'soundEnabled', tab: 'Audio', control: SWITCH('Sound effects'), expected: false },
];

const SLIDERS = [
  { key: 'ballSpeed', tab: 'Gameplay', control: SLIDER(/Ball speed/), value: '1.7', expected: 1.7 },
  { key: 'paddleSize', tab: 'Gameplay', control: SLIDER(/Paddle size/), value: '1.4', expected: 1.4 },
  { key: 'volume', tab: 'Audio', control: SLIDER(/Volume/), value: '25', expected: 25 },
];

async function reopenOn(page, tab) {
  await page.reload();
  await page.waitForFunction(() => !!window.__gameState);
  await openSettingsFromGear(page);
  await settingsTab(page, tab).click();
}

test.describe('every setting changes and persists across a reload', () => {
  for (const { key, tab, control, expected } of CHOICES) {
    test(`${key} choice`, async ({ page }) => {
      await openSettingsFromGear(page);
      await settingsTab(page, tab).click();
      await control(page).check();
      expect((await saved(page))[key]).toBe(expected);
      await reopenOn(page, tab);
      expect((await saved(page))[key]).toBe(expected);
      await expect(control(page)).toBeChecked();
    });
  }

  for (const { key, tab, control, expected } of TOGGLES) {
    test(`${key} switch`, async ({ page }) => {
      await openSettingsFromGear(page);
      await settingsTab(page, tab).click();
      await (expected ? control(page).check() : control(page).uncheck());
      expect((await saved(page))[key]).toBe(expected);
      await reopenOn(page, tab);
      expect((await saved(page))[key]).toBe(expected);
      await expect(control(page)).toBeChecked({ checked: expected });
    });
  }

  for (const { key, tab, control, value, expected } of SLIDERS) {
    test(`${key} slider`, async ({ page }) => {
      await openSettingsFromGear(page);
      await settingsTab(page, tab).click();
      await control(page).fill(value);
      expect((await saved(page))[key]).toBeCloseTo(expected, 5);
      await reopenOn(page, tab);
      expect((await saved(page))[key]).toBeCloseTo(expected, 5);
      await expect(control(page)).toHaveValue(value);
    });
  }

  test('trailLength slider', async ({ page }) => {
    await openSettingsFromGear(page);
    await settingsTab(page, 'Custom').click();
    await SWITCH('Ball trail')(page).check();
    await SLIDER(/Trail length/)(page).fill('9');
    expect((await saved(page)).trailLength).toBe(9);
    await reopenOn(page, 'Custom');
    await expect(SLIDER(/Trail length/)(page)).toHaveValue('9');
  });

  for (const side of ['Left', 'Right']) {
    test(`${side.toLowerCase()} paddle colour`, async ({ page }) => {
      await openSettingsFromGear(page);
      await settingsTab(page, 'Custom').click();
      await OPTION('Paddle style', 'Custom')(page).check();
      await OPTION(`${side} paddle colour`, 'Red')(page).check();
      expect((await saved(page))[`${side.toLowerCase()}PaddleColor`]).toBe('#ff0000');
      await reopenOn(page, 'Custom');
      await expect(OPTION(`${side} paddle colour`, 'Red')(page)).toBeChecked();
    });
  }

  test('rugby target score and time limit', async ({ page }) => {
    await chooseGameMode(page, 'rugby-single');
    await waitForGameState(page, 'PLAYING');
    await page.keyboard.press('Tab');
    await settingsTab(page, 'Rugby').click();
    await OPTION('Target score', '75')(page).check();
    await OPTION('Time limit', '10 min')(page).check();
    expect(await saved(page, 'pong:rugbySettings')).toMatchObject({ targetScore: 75, timeLimit: 600 });
    await page.reload();
    await page.waitForFunction(() => !!window.__gameState);
    await chooseGameMode(page, 'rugby-single');
    await waitForGameState(page, 'PLAYING');
    await page.keyboard.press('Tab');
    await settingsTab(page, 'Rugby').click();
    await expect(OPTION('Target score', '75')(page)).toBeChecked();
    await expect(OPTION('Time limit', '10 min')(page)).toBeChecked();
  });
});

test.describe('settings take effect in the game', () => {
  test('the paddle-size slider resizes the paddles (it was unreachable on the canvas)', async ({ page }) => {
    await openSettingsFromGear(page);
    await SLIDER(/Paddle size/)(page).fill('1.5');
    const s = await page.evaluate(() => ({
      size: window.__gameState.settings.paddleSize,
      left: window.__gameState.paddles.left.h,
      right: window.__gameState.paddles.right.h,
    }));
    expect(s).toEqual({ size: 1.5, left: 120, right: 120 });
    await expect(settingsPanel(page).getByText('1.5x')).toBeVisible();
  });

  test('ball speed presets and slider stay in step', async ({ page }) => {
    await openSettingsFromGear(page);
    await OPTION('Ball speed presets', 'Insane')(page).check();
    await expect(SLIDER(/Ball speed/)(page)).toHaveValue('1.8');
    await SLIDER(/Ball speed/)(page).fill('1');
    await expect(OPTION('Ball speed presets', 'Normal')(page)).toBeChecked();
    await SLIDER(/Ball speed/)(page).fill('1.5'); // between presets
    await expect(settingsGroup(page, 'Ball speed presets').getByRole('radio', { checked: true })).toHaveCount(0);
  });

  test('saved values show in the panel when it opens', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('pong:settings', JSON.stringify({
        difficulty: 'easy', ballSpeed: 0.7, winScore: 5, soundEnabled: true, volume: 40,
        paddleStyle: 'retro', leftPaddleColor: '#ffffff', rightPaddleColor: '#ffffff',
        ballStyle: 'glow', ballColor: '#ffffff', ballTrail: false, ballFlash: true, trailLength: 5,
        paddleSize: 0.8, endlessMode: false,
      }));
    });
    await page.reload();
    await page.waitForFunction(() => !!window.__gameState);
    await openSettingsFromGear(page);
    await expect(OPTION('Difficulty', 'Easy')(page)).toBeChecked();
    await expect(OPTION('Ball speed presets', 'Slow')(page)).toBeChecked();
    await expect(OPTION('Win score', '5')(page)).toBeChecked();
    await expect(SLIDER(/Paddle size/)(page)).toHaveValue('0.8');
  });
});
