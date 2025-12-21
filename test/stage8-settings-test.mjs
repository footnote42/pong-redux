// test/stage8-settings-test.mjs
// Comprehensive tests for Stage 8: Settings Menu Foundation

import { createInitialState, setDifficulty, setBallSpeed, setWinScore, setSoundEnabled, setVolume, startPlaying } from '../src/game-state.js';

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// Test 1: Settings state initialization
test('Settings state initialized with defaults', () => {
  const state = createInitialState(800, 600);

  if (!state.settings) throw new Error('settings object missing');
  if (state.settings.difficulty !== 'medium') throw new Error('default difficulty should be medium');
  if (state.settings.ballSpeed !== 1.0) throw new Error('default ballSpeed should be 1.0');
  if (state.settings.winScore !== 11) throw new Error('default winScore should be 11');
  if (state.settings.soundEnabled !== true) throw new Error('default soundEnabled should be true');
  if (state.settings.volume !== 70) throw new Error('default volume should be 70');
  if (state.settingsTab !== 'gameplay') throw new Error('default settingsTab should be gameplay');
  if (state.showSettings !== false) throw new Error('settings should be hidden by default');
});

// Test 2: setDifficulty changes difficulty setting
test('setDifficulty updates difficulty', () => {
  const state = createInitialState(800, 600);

  setDifficulty(state, 'easy');
  if (state.settings.difficulty !== 'easy') throw new Error('difficulty should be easy');

  setDifficulty(state, 'hard');
  if (state.settings.difficulty !== 'hard') throw new Error('difficulty should be hard');

  setDifficulty(state, 'medium');
  if (state.settings.difficulty !== 'medium') throw new Error('difficulty should be medium');
});

// Test 3: setBallSpeed changes ball speed with bounds
test('setBallSpeed updates ball speed with bounds', () => {
  const state = createInitialState(800, 600);

  setBallSpeed(state, 1.5);
  if (state.settings.ballSpeed !== 1.5) throw new Error('ballSpeed should be 1.5');

  // Test lower bound
  setBallSpeed(state, 0.3);
  if (state.settings.ballSpeed !== 0.5) throw new Error('ballSpeed should be clamped to 0.5');

  // Test upper bound
  setBallSpeed(state, 2.5);
  if (state.settings.ballSpeed !== 2.0) throw new Error('ballSpeed should be clamped to 2.0');

  // Test exact bounds
  setBallSpeed(state, 0.5);
  if (state.settings.ballSpeed !== 0.5) throw new Error('ballSpeed should be 0.5');

  setBallSpeed(state, 2.0);
  if (state.settings.ballSpeed !== 2.0) throw new Error('ballSpeed should be 2.0');
});

// Test 4: setBallSpeed applies to active ball
test('setBallSpeed applies to active ball velocity', () => {
  const state = createInitialState(800, 600);
  startPlaying(state, 'versus');
  state.serveTimer = 0;
  state.paused = false;

  // Serve ball manually
  state.ball.vx = 200;
  state.ball.vy = 0;

  const initialSpeed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);

  // Double the ball speed
  setBallSpeed(state, 2.0);

  const newSpeed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
  const expectedSpeed = 200 * 2.0; // baseSpeed * multiplier

  if (Math.abs(newSpeed - expectedSpeed) > 1) {
    throw new Error(`Ball speed should be ${expectedSpeed}, got ${newSpeed}`);
  }
});

// Test 5: setWinScore changes win score
test('setWinScore updates win score', () => {
  const state = createInitialState(800, 600);

  setWinScore(state, 5);
  if (state.settings.winScore !== 5) throw new Error('winScore should be 5');
  if (state.winScore !== 5) throw new Error('state.winScore should also be 5');

  setWinScore(state, 21);
  if (state.settings.winScore !== 21) throw new Error('winScore should be 21');
  if (state.winScore !== 21) throw new Error('state.winScore should also be 21');
});

// Test 6: setSoundEnabled toggles sound
test('setSoundEnabled toggles sound', () => {
  const state = createInitialState(800, 600);

  setSoundEnabled(state, false);
  if (state.settings.soundEnabled !== false) throw new Error('sound should be disabled');

  setSoundEnabled(state, true);
  if (state.settings.soundEnabled !== true) throw new Error('sound should be enabled');
});

// Test 7: setVolume changes volume with bounds
test('setVolume updates volume with bounds', () => {
  const state = createInitialState(800, 600);

  setVolume(state, 50);
  if (state.settings.volume !== 50) throw new Error('volume should be 50');

  // Test lower bound
  setVolume(state, -10);
  if (state.settings.volume !== 0) throw new Error('volume should be clamped to 0');

  // Test upper bound
  setVolume(state, 150);
  if (state.settings.volume !== 100) throw new Error('volume should be clamped to 100');

  // Test exact bounds
  setVolume(state, 0);
  if (state.settings.volume !== 0) throw new Error('volume should be 0');

  setVolume(state, 100);
  if (state.settings.volume !== 100) throw new Error('volume should be 100');
});

// Test 8: Settings UI state management
test('Settings UI state toggles correctly', () => {
  const state = createInitialState(800, 600);

  // Initially hidden
  if (state.showSettings !== false) throw new Error('settings should be hidden initially');

  // Toggle on
  state.showSettings = true;
  if (state.showSettings !== true) throw new Error('settings should be visible');

  // Toggle off
  state.showSettings = false;
  if (state.showSettings !== false) throw new Error('settings should be hidden');
});

// Test 9: Settings tab switching
test('Settings tabs switch correctly', () => {
  const state = createInitialState(800, 600);

  // Default tab
  if (state.settingsTab !== 'gameplay') throw new Error('default tab should be gameplay');

  // Switch to audio
  state.settingsTab = 'audio';
  if (state.settingsTab !== 'audio') throw new Error('tab should be audio');

  // Switch to about
  state.settingsTab = 'about';
  if (state.settingsTab !== 'about') throw new Error('tab should be about');

  // Back to gameplay
  state.settingsTab = 'gameplay';
  if (state.settingsTab !== 'gameplay') throw new Error('tab should be gameplay');
});

// Test 10: CPU difficulty synchronization in single player
test('CPU difficulty syncs with settings in single player', () => {
  const state = createInitialState(800, 600);
  startPlaying(state, 'single');

  // CPU should be enabled
  if (!state.cpu || !state.cpu.enabled) throw new Error('CPU should be enabled in single player');

  // Check initial difficulty
  if (state.cpu.difficulty !== 'medium') throw new Error('CPU should start with medium difficulty');

  // Change difficulty
  setDifficulty(state, 'easy');
  if (state.cpu.difficulty !== 'easy') throw new Error('CPU should update to easy difficulty');

  setDifficulty(state, 'hard');
  if (state.cpu.difficulty !== 'hard') throw new Error('CPU should update to hard difficulty');
});

// Test 11: Settings don't affect versus mode CPU
test('Settings difficulty has no CPU in versus mode', () => {
  const state = createInitialState(800, 600);
  startPlaying(state, 'versus');

  // CPU should not be enabled
  if (state.cpu && state.cpu.enabled) throw new Error('CPU should not be enabled in versus mode');

  // Changing difficulty should not create CPU
  setDifficulty(state, 'hard');
  if (state.cpu && state.cpu.enabled) throw new Error('CPU should still not be enabled');
});

// Test 12: All win score options are valid
test('All win score options work correctly', () => {
  const state = createInitialState(800, 600);
  const winScores = [5, 7, 11, 15, 21];

  for (const score of winScores) {
    setWinScore(state, score);
    if (state.settings.winScore !== score) {
      throw new Error(`winScore should be ${score}, got ${state.settings.winScore}`);
    }
    if (state.winScore !== score) {
      throw new Error(`state.winScore should be ${score}, got ${state.winScore}`);
    }
  }
});

// Run all tests
console.log(`Running ${tests.length} tests for Stage 8: Settings Menu Foundation...\n`);

let passed = 0;
let failed = 0;

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
