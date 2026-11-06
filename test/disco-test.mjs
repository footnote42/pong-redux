// Unit tests for the Disco paddle style (src/disco.js) and the paddle style setter.
import assert from 'node:assert/strict';
import { discoHue, discoColor, DISCO_CYCLE_MS } from '../src/disco.js';
import { createInitialState, setPaddleStyle } from '../src/game-state.js';
import { SETTINGS } from '../src/settings-model.js';

// Hue sweeps the full wheel once per cycle
assert.equal(discoHue(0, 'left'), 0);
assert.equal(discoHue(DISCO_CYCLE_MS / 2, 'left'), 180);
assert.equal(discoHue(DISCO_CYCLE_MS, 'left'), 0);

// The two paddles sit opposite each other on the wheel
for (const t of [0, 1234, DISCO_CYCLE_MS * 0.7]) {
  const diff = (discoHue(t, 'right') - discoHue(t, 'left') + 360) % 360;
  assert.equal(Math.round(diff), 180, `paddles opposite at t=${t}`);
}

// Always a valid hue, also for negative or huge times
for (const t of [-5000, 0, 1e9]) {
  const h = discoHue(t, 'left');
  assert.ok(h >= 0 && h < 360, `hue in range at t=${t}`);
}

// A saturated, bright CSS colour
assert.match(discoColor(0, 'left'), /^hsl\(\d+(\.\d+)?, 100%, 60%\)$/);

// Disco is an accepted, saved paddle style; unknown styles still refused
{
  const s = createInitialState(800, 600);
  setPaddleStyle(s, 'disco');
  assert.equal(s.settings.paddleStyle, 'disco');
  setPaddleStyle(s, 'bogus');
  assert.equal(s.settings.paddleStyle, 'disco');
  assert.ok(SETTINGS.paddleStyle);
}

console.log('disco tests passed');
