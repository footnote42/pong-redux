import { test, expect } from '@playwright/test';
import { BUTTONS, waitForGameState } from './helpers.js';

// Drag control tests: run on the phone projects (android, iphone).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
});

// Tap a landing button with a real touch tap (court coords -> screen).
async function tapCanvasAt(page, courtX, courtY) {
  const box = await page.locator('#gameCanvas').boundingBox();
  const k = (box.width - 4) / 800; // 2px border each side
  await page.touchscreen.tap(box.x + 2 + courtX * k, box.y + 2 + courtY * k);
}

async function startMode(page, button, mode) {
  await tapCanvasAt(page, button.x, button.y);
  await waitForGameState(page, 'PLAYING');
  expect(await page.evaluate(() => window.__gameState.gameMode)).toBe(mode);
}

// Court units per CSS pixel of the displayed canvas.
async function courtPerPx(page) {
  return page.evaluate(() => {
    const c = document.getElementById('gameCanvas');
    const r = c.getBoundingClientRect();
    return 800 / (r.width - c.clientLeft * 2);
  });
}

// Dispatch touch-type pointer events at screen coordinates.
async function touch(page, type, id, x, y) {
  await page.evaluate(([type, id, x, y]) => {
    const target = type === 'pointerdown' ? document.elementFromPoint(x, y) || document.body : document.body;
    target.dispatchEvent(new PointerEvent(type, {
      pointerId: id, pointerType: 'touch', isPrimary: id === 1,
      clientX: x, clientY: y, bubbles: true, cancelable: true,
    }));
  }, [type, id, x, y]);
}

const paddleY = (page, side) => page.evaluate((s) => window.__gameState.paddles[s].y, side);

async function viewportWidth(page) {
  return page.evaluate(() => window.innerWidth);
}

test('left drag moves the left paddle by the drag distance', async ({ page }) => {
  await startMode(page, BUTTONS.versus, 'versus');
  const k = await courtPerPx(page);
  const w = await viewportWidth(page);
  const startY = await paddleY(page, 'left');
  const startRight = await paddleY(page, 'right');

  // Touch well outside the canvas, in the left half of the screen.
  await touch(page, 'pointerdown', 1, w * 0.1, 150);
  await touch(page, 'pointermove', 1, w * 0.1, 175);
  await touch(page, 'pointermove', 1, w * 0.1, 190);
  await touch(page, 'pointerup', 1, w * 0.1, 190);

  await expect.poll(() => paddleY(page, 'left')).toBeCloseTo(startY + 40 * k, 1);
  expect(await paddleY(page, 'right')).toBe(startRight);
});

test('right drag moves the right paddle, and does not jump to the thumb', async ({ page }) => {
  await startMode(page, BUTTONS.versus, 'versus');
  const k = await courtPerPx(page);
  const w = await viewportWidth(page);
  const startY = await paddleY(page, 'right');
  const startLeft = await paddleY(page, 'left');

  // Start the touch far from the paddle (near the bottom); a jump would move it a lot.
  await touch(page, 'pointerdown', 1, w * 0.9, 380);
  await page.waitForTimeout(100);
  expect(await paddleY(page, 'right')).toBe(startY);
  await touch(page, 'pointermove', 1, w * 0.9, 350);
  await touch(page, 'pointerup', 1, w * 0.9, 350);

  await expect.poll(() => paddleY(page, 'right')).toBeCloseTo(startY - 30 * k, 1);
  expect(await paddleY(page, 'left')).toBe(startLeft);
});

test('two simultaneous drags move both paddles in 2 Players', async ({ page }) => {
  await startMode(page, BUTTONS.versus, 'versus');
  const k = await courtPerPx(page);
  const w = await viewportWidth(page);
  const startL = await paddleY(page, 'left');
  const startR = await paddleY(page, 'right');

  await touch(page, 'pointerdown', 1, w * 0.1, 150);
  await touch(page, 'pointerdown', 2, w * 0.9, 250);
  await touch(page, 'pointermove', 1, w * 0.1, 120); // left up 30
  await touch(page, 'pointermove', 2, w * 0.9, 290); // right down 40
  await touch(page, 'pointerup', 1, w * 0.1, 120);
  await touch(page, 'pointerup', 2, w * 0.9, 290);

  await expect.poll(() => paddleY(page, 'left')).toBeCloseTo(startL - 30 * k, 1);
  await expect.poll(() => paddleY(page, 'right')).toBeCloseTo(startR + 40 * k, 1);
});

test('in vs CPU the CPU half ignores touch and the player half moves', async ({ page }) => {
  await startMode(page, BUTTONS.single, 'single');
  const k = await courtPerPx(page);
  const w = await viewportWidth(page);
  const startL = await paddleY(page, 'left');

  // Right (CPU) half: with the ball not yet served, the CPU paddle must not respond to a drag.
  await page.evaluate(() => { window.__gameState.serveTimer = 5; });
  const startR = await paddleY(page, 'right');
  await touch(page, 'pointerdown', 1, w * 0.9, 100);
  await touch(page, 'pointermove', 1, w * 0.9, 200);
  await touch(page, 'pointerup', 1, w * 0.9, 200);
  await page.waitForTimeout(150);
  expect(await paddleY(page, 'right')).toBe(startR);

  await touch(page, 'pointerdown', 2, w * 0.1, 150);
  await touch(page, 'pointermove', 2, w * 0.1, 120);
  await touch(page, 'pointerup', 2, w * 0.1, 120);
  await expect.poll(() => paddleY(page, 'left')).toBeCloseTo(startL - 30 * k, 1);
});

test('in Rugby (1P) only the player half moves a paddle', async ({ page }) => {
  await startMode(page, BUTTONS.rugbySingle, 'rugby-single');
  const w = await viewportWidth(page);
  await page.evaluate(() => { window.__gameState.serveTimer = 5; });
  const startR = await paddleY(page, 'right');
  await touch(page, 'pointerdown', 1, w * 0.9, 100);
  await touch(page, 'pointermove', 1, w * 0.9, 200);
  await touch(page, 'pointerup', 1, w * 0.9, 200);
  await page.waitForTimeout(150);
  expect(await paddleY(page, 'right')).toBe(startR);
});

test('paddle stays inside the court', async ({ page }) => {
  await startMode(page, BUTTONS.versus, 'versus');
  const w = await viewportWidth(page);
  await touch(page, 'pointerdown', 1, w * 0.1, 50);
  await touch(page, 'pointermove', 1, w * 0.1, 5000);
  await touch(page, 'pointerup', 1, w * 0.1, 5000);
  await page.waitForTimeout(150);
  const { y, h, height } = await page.evaluate(() => {
    const s = window.__gameState;
    return { y: s.paddles.left.y, h: s.paddles.left.h, height: s.height };
  });
  expect(y).toBeCloseTo(height - h / 2, 1);
});

test('touching during play does not scroll, zoom or select', async ({ page }) => {
  await startMode(page, BUTTONS.versus, 'versus');
  const w = await viewportWidth(page);

  // Default is prevented on the touch events that would scroll or zoom.
  const prevented = await page.evaluate(() => {
    return ['touchstart', 'touchmove', 'selectstart', 'contextmenu'].map((type) => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      document.getElementById('gameCanvas').dispatchEvent(e);
      return e.defaultPrevented;
    });
  });
  expect(prevented).toEqual([true, true, true, true]);

  await touch(page, 'pointerdown', 1, w * 0.1, 100);
  await touch(page, 'pointermove', 1, w * 0.1, 300);
  await touch(page, 'pointerup', 1, w * 0.1, 300);
  await page.evaluate(() => window.scrollBy(0, 400));

  const info = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scale: window.visualViewport.scale,
    userSelect: getComputedStyle(document.body).userSelect || getComputedStyle(document.body).webkitUserSelect,
    touchAction: getComputedStyle(document.getElementById('gameCanvas')).touchAction,
    selection: String(window.getSelection()),
  }));
  expect(info.scrollY).toBe(0);
  expect(info.scale).toBe(1);
  expect(info.userSelect).toBe('none');
  expect(info.touchAction).toBe('none');
  expect(info.selection).toBe('');
});

test('menus still respond to taps', async ({ page }) => {
  await tapCanvasAt(page, BUTTONS.settings.x, BUTTONS.settings.y);
  await page.waitForFunction(() => window.__gameState.showSettings === true);
});
