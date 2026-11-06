import { test, expect } from '@playwright/test';
import { gameModeButton, landing, waitForGameState } from './helpers.js';

// Home-screen install and fullscreen (issue #17). Runs on every project.

const EMBED_HOST = '<!doctype html><body style="margin:0"><iframe src="/index.html" style="width:100vw;height:100vh;border:0"></iframe></body>';

// Record requestFullscreen calls; optionally refuse them
function stubFullscreen({ reject }) {
  window.__fsCalls = 0;
  Element.prototype.requestFullscreen = function () {
    window.__fsCalls++;
    return reject ? Promise.reject(new TypeError('Permissions check failed')) : Promise.resolve();
  };
}

// Pretend the browser reports a home-screen display mode
function stubDisplayMode(mode) {
  const real = window.matchMedia.bind(window);
  window.matchMedia = (q) => (q === `(display-mode: ${mode})`
    ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} }
    : real(q));
}

async function open(page, { reject = false, displayMode } = {}) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('pong:seenInstructions', '1');
  });
  await page.addInitScript(stubFullscreen, { reject });
  if (displayMode) await page.addInitScript(stubDisplayMode, displayMode);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gameState);
}

async function openEmbedded(page, { displayMode } = {}) {
  await page.addInitScript(stubFullscreen, { reject: false });
  if (displayMode) await page.addInitScript(stubDisplayMode, displayMode);
  await page.route('**/embed-host.html', (route) => route.fulfill({ contentType: 'text/html', body: EMBED_HOST }));
  await page.goto('/embed-host.html');
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('[data-screen="landing"]')).toBeVisible();
  return frame;
}

test.describe('manifest', () => {
  test('is linked, served and has the required fields', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('manifest.webmanifest'); // relative: works at /pong/ and /pong-redux/
    const res = await request.get(new URL(href, page.url()).href);
    expect(res.status()).toBe(200);
    const m = JSON.parse(await res.text());
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.start_url).toBe('./');
    expect(m.scope).toBe('./');
    expect(m.display).toBe('fullscreen');
    expect(m.display_override).toContain('standalone');
    expect(m.orientation).toBe('landscape');
    expect(m.theme_color).toMatch(/^#/);
    expect(m.background_color).toMatch(/^#/);
    const sizes = m.icons.map((i) => `${i.sizes}:${i.purpose}`);
    expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
    for (const icon of m.icons) {
      expect(icon.src.startsWith('/') || /^https?:/.test(icon.src)).toBe(false); // relative only
    }
  });

  test('icons load as PNG', async ({ page, request }) => {
    await page.goto('/');
    const manifestUrl = new URL('manifest.webmanifest', page.url());
    const m = JSON.parse(await (await request.get(manifestUrl.href)).text());
    const urls = [
      ...m.icons.map((i) => i.src),
      await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'),
    ];
    for (const src of urls) {
      const res = await request.get(new URL(src, manifestUrl).href);
      expect(res.status(), src).toBe(200);
      expect(res.headers()['content-type'], src).toBe('image/png');
    }
  });

  test('iOS home-screen meta tags are present', async ({ page }) => {
    await page.goto('/');
    const meta = (name) => page.locator(`meta[name="${name}"]`).getAttribute('content');
    expect(await meta('apple-mobile-web-app-capable')).toBe('yes');
    expect(await meta('apple-mobile-web-app-title')).toBeTruthy();
    expect(await meta('apple-mobile-web-app-status-bar-style')).toBeTruthy();
  });
});

test.describe('fullscreen on game start', () => {
  test('touch browser tab requests fullscreen', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'touch only');
    await open(page);
    await gameModeButton(page, 'single').tap();
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__fsCalls)).toBe(1);
  });

  test('a refused request is harmless', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'touch only');
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, { reject: true });
    await gameModeButton(page, 'versus').tap();
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__fsCalls)).toBe(1);
    expect(errors).toEqual([]);
  });

  test('desktop never requests fullscreen', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'desktop only');
    await open(page);
    await gameModeButton(page, 'single').click();
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__fsCalls)).toBe(0);
  });

  test('a home-screen launch does not ask again', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'touch only');
    await open(page, { displayMode: 'fullscreen' });
    await gameModeButton(page, 'single').tap();
    await waitForGameState(page, 'PLAYING');
    expect(await page.evaluate(() => window.__fsCalls)).toBe(0);
  });

  test('Embedded never requests fullscreen', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'touch only');
    const frame = await openEmbedded(page);
    await frame.getByRole('button', { name: 'vs CPU', exact: true }).tap();
    await page.waitForFunction(() => document.querySelector('iframe').contentWindow.__gameState?.gameState === 'PLAYING');
    expect(await page.frames()[1].evaluate(() => window.__fsCalls)).toBe(0);
  });
});

test.describe('home-screen launch counts as Standalone', () => {
  for (const mode of ['standalone', 'fullscreen']) {
    test(`display-mode ${mode} shows the link back`, async ({ page }) => {
      await open(page, { displayMode: mode });
      const root = await page.evaluate(() => ({ ...document.documentElement.dataset }));
      expect(root.context).toBe('standalone');
      expect(root.installed).toBe('true');
      await expect(landing(page).getByRole('link', { name: /waynetellis\.com/ })).toBeVisible();
    });
  }

  test('Embedded still wins when framed, even with a home-screen display mode', async ({ page }) => {
    const frame = await openEmbedded(page, { displayMode: 'standalone' });
    expect(await page.frames()[1].evaluate(() => document.documentElement.dataset.context)).toBe('embedded');
    await expect(frame.getByRole('link', { name: /waynetellis\.com/ })).toBeHidden();
  });
});
