// Rotate prompt: when it shows, and that it auto-pauses a game in progress.
import assert from 'node:assert/strict';
import { ROTATE_QUERY, applyRotate } from '../src/rotate.js';
import { createInitialState, startPlaying, resumeGame } from '../src/game-state.js';

console.log('Testing rotate prompt...');

// The query gates on touch-primary + portrait, never on width
assert.match(ROTATE_QUERY, /orientation:\s*portrait/);
assert.match(ROTATE_QUERY, /pointer:\s*coarse/);
assert.doesNotMatch(ROTATE_QUERY, /width/);

function playing() {
  const s = createInitialState(800, 600);
  startPlaying(s, 'versus');
  s.gameState = 'PLAYING';
  return s;
}

// Showing during play pauses
let s = playing();
applyRotate(s, true);
assert.equal(s.gameState, 'PAUSED');

// Hiding again does NOT resume; the player chooses Resume
applyRotate(s, false);
assert.equal(s.gameState, 'PAUSED');
resumeGame(s);
assert.equal(s.gameState, 'PLAYING');

// Hidden prompt leaves play alone
s = playing();
applyRotate(s, false);
assert.equal(s.gameState, 'PLAYING');

// Other states are untouched
for (const g of ['LANDING', 'GAME_OVER', 'PAUSED']) {
  s = createInitialState(800, 600);
  s.gameState = g;
  applyRotate(s, true);
  assert.equal(s.gameState, g);
}

console.log('Rotate prompt tests passed.');
