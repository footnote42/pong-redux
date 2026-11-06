import { test, expect } from '@playwright/test';
import { waitForGameState, pauseButton, pauseScreen, victoryScreen, overlayButton } from './helpers.js';

// Pause and victory are HTML screens (ADR 0001): drive them by role and name.
// Desktop layout; the phone projects are in pause.mobile.spec.js and
// victory.mobile.spec.js.

let errors;

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
  await page.keyboard.press('2');
  await waitForGameState(page, 'PLAYING');
  await page.waitForFunction(() => !window.__gameState.transitions.active);
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

const gameState = (page) => page.evaluate(() => window.__gameState.gameState);

async function finishGame(page, winner = 'left') {
  await page.evaluate((winner) => {
    window.__gameState.gameState = 'GAME_OVER';
    window.__gameState.winner = winner;
  }, winner);
  await expect(victoryScreen(page)).toBeVisible();
}

test('the pause button shows during play, top-right and clear of the top-left corner', async ({ page }) => {
  await expect(pauseButton(page)).toBeVisible();
  const box = await pauseButton(page).boundingBox();
  const canvas = await page.locator('#gameCanvas').boundingBox();
  expect(box.x + box.width / 2).toBeGreaterThan(canvas.x + canvas.width * 0.75);
  expect(box.y + box.height / 2).toBeLessThan(canvas.y + canvas.height * 0.25);
  await page.waitForTimeout(300); // let the screen fade in
  await page.screenshot({ path: '.scratch/hud-desktop.png' });
});

test('clicking the pause button pauses and shows the pause screen', async ({ page }) => {
  await pauseButton(page).click();
  await waitForGameState(page, 'PAUSED');
  await expect(pauseScreen(page)).toBeVisible();
  await expect(pauseButton(page)).toBeHidden();
});

for (const key of ['p', 'Escape']) {
  test(`${key} shows the pause screen with its buttons`, async ({ page }) => {
    await page.keyboard.press(key);
    await waitForGameState(page, 'PAUSED');
    const screen = pauseScreen(page);
    await expect(screen).toBeVisible();
    await expect(screen.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
    for (const name of ['Resume', 'Settings', 'Quit to Menu']) {
      await expect(overlayButton(screen, name)).toBeVisible();
    }
    await page.waitForTimeout(300); // let the screen fade in
    await page.screenshot({ path: '.scratch/pause-desktop.png' });
  });
}

test('P and Esc resume from the pause screen', async ({ page }) => {
  for (const key of ['p', 'Escape']) {
    await page.keyboard.press(key);
    await waitForGameState(page, 'PAUSED');
    await page.keyboard.press(key);
    await waitForGameState(page, 'PLAYING');
    await expect(pauseScreen(page)).toBeHidden();
  }
});

test('Resume button on the pause screen resumes play', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await overlayButton(pauseScreen(page), 'Resume').click();
  await waitForGameState(page, 'PLAYING');
  await expect(pauseScreen(page)).toBeHidden();
  await expect(pauseButton(page)).toBeVisible();
});

test('Space resumes from the pause screen (Resume has focus)', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await expect(overlayButton(pauseScreen(page), 'Resume')).toBeFocused();
  await page.keyboard.press(' ');
  await waitForGameState(page, 'PLAYING');
});

test('Settings button on the pause screen opens settings and stays paused', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await overlayButton(pauseScreen(page), 'Settings').click();
  const s = await page.evaluate(() => ({ show: window.__gameState.showSettings, gs: window.__gameState.gameState }));
  expect(s).toEqual({ show: true, gs: 'PAUSED' });
  await expect(pauseScreen(page)).toBeHidden();
  // closing settings brings the pause screen back
  await page.keyboard.press('Escape');
  await expect(pauseScreen(page)).toBeVisible();
  expect(await gameState(page)).toBe('PAUSED');
});

test('Quit to Menu button returns to landing', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await overlayButton(pauseScreen(page), 'Quit to Menu').click();
  await waitForGameState(page, 'LANDING');
  await expect(pauseScreen(page)).toBeHidden();
});

test('M on the pause screen returns to landing', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await page.keyboard.press('m');
  await waitForGameState(page, 'LANDING');
});

test('a finished game shows the victory screen with the winner', async ({ page }) => {
  await page.waitForFunction(() => window.__gameState.serveTimer <= 0, { timeout: 3000 });
  await page.evaluate(() => {
    window.__gameState.winScore = 1;
    window.__gameState.ball.x = window.__gameState.width + 20;
  });
  await waitForGameState(page, 'GAME_OVER');
  expect(await page.evaluate(() => window.__gameState.winner)).toBe('left');
  const screen = victoryScreen(page);
  await expect(screen).toBeVisible();
  await expect(screen.getByRole('heading', { name: 'Player 1 Wins!' })).toBeVisible();
  await expect(overlayButton(screen, 'Play Again')).toBeVisible();
  await expect(overlayButton(screen, 'Main Menu')).toBeVisible();
  await page.waitForTimeout(300); // let the screen fade in
  await page.screenshot({ path: '.scratch/victory-desktop.png' });
});

test('the victory screen names Player 2 when the right paddle wins', async ({ page }) => {
  await finishGame(page, 'right');
  await expect(victoryScreen(page).getByRole('heading', { name: 'Player 2 Wins!' })).toBeVisible();
});

test('Play Again button starts a new game', async ({ page }) => {
  await finishGame(page);
  await overlayButton(victoryScreen(page), 'Play Again').click();
  await waitForGameState(page, 'PLAYING');
  await expect(victoryScreen(page)).toBeHidden();
  expect(await page.evaluate(() => window.__gameState.score)).toEqual({ left: 0, right: 0 });
});

test('Space on the victory screen plays again', async ({ page }) => {
  await finishGame(page);
  await page.keyboard.press(' ');
  await waitForGameState(page, 'PLAYING');
  expect(await page.evaluate(() => window.__gameState.winner)).toBeNull();
});

test('Main Menu button returns to landing', async ({ page }) => {
  await finishGame(page);
  await overlayButton(victoryScreen(page), 'Main Menu').click();
  await waitForGameState(page, 'LANDING');
  await expect(victoryScreen(page)).toBeHidden();
});

test('Escape on the victory screen returns to the menu', async ({ page }) => {
  await finishGame(page, 'right');
  await page.keyboard.press('Escape');
  await waitForGameState(page, 'LANDING');
});

test('pause is ignored on the victory screen', async ({ page }) => {
  await finishGame(page);
  await page.keyboard.press('p');
  expect(await gameState(page)).toBe('GAME_OVER');
});

test('changing paddle size in settings does not throw', async ({ page }) => {
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => window.__gameState.showSettings)).toBe(true);
  // The gameplay-tab paddle-size slider hit area (input.js) sits below the visible
  // 600px canvas (and outside the settings panel), so no real click reaches it. Make the
  // logical state taller and drive the pointer event straight at the canvas.
  await page.evaluate(() => {
    window.__gameState.height = 1400;
    const c = document.getElementById('gameCanvas');
    const r = c.getBoundingClientRect();
    const sx = (r.width - c.clientLeft * 2) / c.width;
    const sy = (r.height - c.clientTop * 2) / c.height;
    const panelX = c.width * 0.15; // UI.SETTINGS_PANEL.WIDTH_RATIO
    const x = panelX + 40 + 225;   // 75% along a 300px slider
    const y = 1400 * 0.1 + 672 + 10; // panelY + slider row offset in input.js hit-testing
    c.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: r.left + c.clientLeft + x * sx,
      clientY: r.top + c.clientTop + y * sy,
      bubbles: true,
    }));
  });
  const s = await page.evaluate(() => ({
    size: window.__gameState.settings.paddleSize,
    h: window.__gameState.paddles.left.h,
  }));
  expect(s.size).toBeCloseTo(1.25, 5);
  expect(s.h).toBeCloseTo(100, 5);
});
