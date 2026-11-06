// Unit tests for the settings model (src/settings-model.js): the seam between
// the HTML settings panel and the game-state setters.
import assert from 'node:assert/strict';
import { SETTINGS, SETTINGS_TABS, settingsTabs, readSetting, applySetting, formatSetting, PADDLE_COLORS } from '../src/settings-model.js';
import { createInitialState } from '../src/game-state.js';
import { activeScreen } from '../src/screens.js';
import { PADDLE, BALL } from '../src/constants.js';

const fresh = () => createInitialState(800, 600);

// Tabs: Rugby only in rugby mode, in the same slot as before
{
  const s = fresh();
  assert.deepEqual(settingsTabs(s), ['gameplay', 'custom', 'audio', 'about']);
  s.rugbyMode.enabled = true;
  assert.deepEqual(settingsTabs(s), ['gameplay', 'custom', 'rugby', 'audio', 'about']);
  assert.deepEqual([...SETTINGS_TABS], ['gameplay', 'custom', 'rugby', 'audio', 'about']);
}

// Every setting the canvas panel had is present
for (const name of ['difficulty', 'ballSpeed', 'winScore', 'endlessMode', 'paddleSize', 'paddleStyle',
  'leftPaddleColor', 'rightPaddleColor', 'ballStyle', 'ballTrail', 'ballFlash', 'trailLength',
  'soundEnabled', 'volume', 'rugbyTargetScore', 'rugbyTimeLimit']) {
  assert.ok(SETTINGS[name], `setting ${name} is defined`);
}

// Each setting changes state through the game-state setter and reads back
{
  const s = fresh();
  const cases = [
    ['difficulty', 'hard', s2 => s2.settings.difficulty],
    ['ballSpeed', '1.3', s2 => s2.settings.ballSpeed],
    ['winScore', '15', s2 => s2.settings.winScore],
    ['endlessMode', true, s2 => s2.settings.endlessMode],
    ['paddleSize', '1.25', s2 => s2.settings.paddleSize],
    ['paddleStyle', 'custom', s2 => s2.settings.paddleStyle],
    ['leftPaddleColor', '#ff0000', s2 => s2.settings.leftPaddleColor],
    ['rightPaddleColor', '#00ffff', s2 => s2.settings.rightPaddleColor],
    ['ballStyle', 'glow', s2 => s2.settings.ballStyle],
    ['ballTrail', true, s2 => s2.settings.ballTrail],
    ['ballFlash', false, s2 => s2.settings.ballFlash],
    ['trailLength', '8', s2 => s2.settings.trailLength],
    ['soundEnabled', false, s2 => s2.settings.soundEnabled],
    ['volume', '35', s2 => s2.settings.volume],
    ['rugbyTargetScore', '75', s2 => s2.rugbySettings.targetScore],
    ['rugbyTimeLimit', '300', s2 => s2.rugbySettings.timeLimit],
  ];
  for (const [name, input, read] of cases) {
    applySetting(s, name, input);
    assert.equal(read(s), SETTINGS[name].parse(input), `${name} applied`);
    assert.equal(readSetting(s, name), read(s), `${name} read back`);
  }
  assert.equal(typeof s.settings.ballSpeed, 'number', 'range values arrive as numbers, not strings');
}

// Values persist under the same localStorage keys
{
  const store = {};
  globalThis.window = { localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } } };
  const s = fresh();
  applySetting(s, 'volume', '20');
  applySetting(s, 'rugbyTimeLimit', '600');
  assert.equal(JSON.parse(store['pong:settings']).volume, 20);
  assert.equal(JSON.parse(store['pong:rugbySettings']).timeLimit, 600);
  const reloaded = fresh();
  assert.equal(reloaded.settings.volume, 20);
  assert.equal(reloaded.rugbySettings.timeLimit, 600);
  delete globalThis.window;
}

// The paddle-size slider, unreachable on the canvas, now resizes the paddles
{
  const s = fresh();
  applySetting(s, 'paddleSize', '1.5');
  assert.equal(s.paddles.left.h, PADDLE.DEFAULT_HEIGHT * 1.5);
  assert.equal(SETTINGS.paddleSize.min, PADDLE.SIZE_MULTIPLIER_MIN);
  assert.equal(SETTINGS.paddleSize.max, PADDLE.SIZE_MULTIPLIER_MAX);
  assert.equal(SETTINGS.ballSpeed.min, BALL.SPEED_MULTIPLIER_MIN);
}

// Unknown or invalid input is ignored, never thrown
{
  const s = fresh();
  assert.equal(applySetting(s, 'nope', 1), false);
  assert.equal(applySetting(s, 'volume', 'abc'), false);
  assert.equal(s.settings.volume, 70);
}

assert.equal(formatSetting('ballSpeed', 1.3), '1.3x');
assert.equal(formatSetting('volume', 70), '70%');
assert.ok(PADDLE_COLORS.length >= 10 && PADDLE_COLORS.every(c => /^#[0-9a-f]{6}$/.test(c.value)));

// Settings is its own screen, over landing, pause or play
{
  const s = fresh();
  s.showSettings = true;
  assert.equal(activeScreen(s), 'settings');
  s.gameState = 'PAUSED';
  assert.equal(activeScreen(s), 'settings');
  s.gameState = 'PLAYING';
  assert.equal(activeScreen(s), 'settings');
  s.showSettings = false;
  assert.equal(activeScreen(s), null);
}
console.log('settings-model: all tests passed');
