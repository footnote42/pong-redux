import { test, expect } from '@playwright/test';
import { waitForGameState, clickCanvasAt } from './helpers.js';

// Count bright pixels in a canvas-local rectangle (text on the dark overlays).
async function brightPixels(page, x, y, w, h) {
  return page.evaluate(([x, y, w, h]) => {
    const c = document.getElementById('gameCanvas');
    const d = ctxData(c, x, y, w, h);
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 150 || d[i + 1] > 150 || d[i + 2] > 150) n++;
    }
    return n;
    function ctxData(c, x, y, w, h) {
      return c.getContext('2d').getImageData(x, y, w, h).data;
    }
  }, [x, y, w, h]);
}

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
  // let the fade-in finish so overlays are not tinted by the transition
  await page.waitForFunction(() => !window.__gameState.transitions.active);
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

// Canvas is 800x600. Pause title sits at h/2 = 300; buttons start at h/2 + 60.
const PAUSE_TITLE = [250, 255, 300, 50];
const VICTORY_TITLE = [100, 215, 600, 50];

for (const key of ['p', 'Escape']) {
  test(`${key} shows the pause overlay with its buttons`, async ({ page }) => {
    const before = await brightPixels(page, ...PAUSE_TITLE);
    await page.keyboard.press(key);
    await waitForGameState(page, 'PAUSED');
    await page.waitForTimeout(100);
    const after = await brightPixels(page, ...PAUSE_TITLE);
    expect(after).toBeGreaterThan(before + 150);
    // Resume / Settings / Quit buttons are drawn (outlines are bright)
    expect(await brightPixels(page, 270, 355, 260, 180)).toBeGreaterThan(150);
  });
}

test('Resume button on the pause overlay resumes play', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await clickCanvasAt(page, 400, 360 + 30); // Resume: y = h/2 + 60, h = 60
  await waitForGameState(page, 'PLAYING');
});

test('Settings button on the pause overlay opens settings and stays paused', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await clickCanvasAt(page, 400, 416 + 30); // Settings: y = h/2 + 116
  const s = await page.evaluate(() => ({ show: window.__gameState.showSettings, gs: window.__gameState.gameState }));
  expect(s).toEqual({ show: true, gs: 'PAUSED' });
});

test('Quit to Menu button returns to landing', async ({ page }) => {
  await page.keyboard.press('p');
  await waitForGameState(page, 'PAUSED');
  await clickCanvasAt(page, 400, 472 + 30); // Quit: y = h/2 + 172
  await waitForGameState(page, 'LANDING');
});

test('a finished game shows the victory screen', async ({ page }) => {
  await page.waitForFunction(() => window.__gameState.serveTimer <= 0, { timeout: 3000 });
  await page.evaluate(() => {
    window.__gameState.winScore = 1;
    window.__gameState.ball.x = window.__gameState.width + 20;
  });
  await waitForGameState(page, 'GAME_OVER');
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__gameState.winner)).toBe('left');
  expect(await brightPixels(page, ...VICTORY_TITLE)).toBeGreaterThan(300);
  // restart prompt line
  expect(await brightPixels(page, 100, 320, 600, 30)).toBeGreaterThan(150);
});

test('Escape on the victory screen returns to the menu', async ({ page }) => {
  await page.evaluate(() => {
    window.__gameState.gameState = 'GAME_OVER';
    window.__gameState.winner = 'right';
  });
  await page.keyboard.press('Escape');
  await waitForGameState(page, 'LANDING');
});

test('pause is ignored on the victory screen', async ({ page }) => {
  await page.evaluate(() => {
    window.__gameState.gameState = 'GAME_OVER';
    window.__gameState.winner = 'left';
  });
  await page.keyboard.press('p');
  expect(await page.evaluate(() => window.__gameState.gameState)).toBe('GAME_OVER');
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
