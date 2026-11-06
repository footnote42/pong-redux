// Generates the home-screen icons into assets/icons/ with a headless browser
// canvas. Run: node scripts/make-icons.mjs  (needs Playwright's Chromium).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../assets/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// size, file, content scale (maskable keeps art inside the central 80% safe zone)
const ICONS = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.7],
  ['apple-touch-icon.png', 180, 0.9],
];

function draw(size, scale) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#111111';
  g.fillRect(0, 0, size, size);
  const art = size * scale;
  g.translate((size - art) / 2, (size - art) / 2);
  g.scale(art / 100, art / 100);
  // court centre line
  g.fillStyle = '#3a3a3a';
  for (let y = 8; y < 96; y += 12) g.fillRect(48.5, y, 3, 7);
  // paddles
  g.fillStyle = '#f2f2f2';
  g.beginPath(); g.roundRect(12, 26, 7, 30, 2); g.fill();
  g.beginPath(); g.roundRect(81, 44, 7, 30, 2); g.fill();
  // ball
  g.fillStyle = '#e8b04a';
  g.beginPath(); g.arc(60, 40, 6.5, 0, Math.PI * 2); g.fill();
  return c.toDataURL('image/png');
}

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, scale] of ICONS) {
  const url = await page.evaluate(`(${draw})(${size}, ${scale})`);
  writeFileSync(new URL(file, OUT), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', file);
}
await browser.close();
