// Pause and game over share one source of truth: state.gameState
// ('PLAYING' | 'PAUSED' | 'GAME_OVER'). Uses real assertions (non-zero exit on failure).

import assert from 'node:assert/strict';
import {
  createInitialState, update, restartGame, startPlaying, showLanding,
  pauseGame, resumeGame, togglePause, endGame, isPaused, isGameOver, setPaddleSize,
} from '../src/game-state.js';
import { PADDLE } from '../src/constants.js';

function playing() {
  const s = createInitialState(800, 600);
  startPlaying(s, 'versus');
  s.gameState = 'PLAYING'; // bypass fade transition
  s.serveTimer = 0;
  return s;
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('no separate paused/gameOver flags exist', () => {
  const s = createInitialState(800, 600);
  assert.equal('paused' in s, false);
  assert.equal('gameOver' in s, false);
});

test('pauseGame moves PLAYING to PAUSED', () => {
  const s = playing();
  pauseGame(s);
  assert.equal(s.gameState, 'PAUSED');
  assert.equal(isPaused(s), true);
});

test('pauseGame is ignored outside PLAYING', () => {
  const s = createInitialState(800, 600); // LANDING
  pauseGame(s);
  assert.equal(s.gameState, 'LANDING');
  const o = playing();
  endGame(o, 'left');
  pauseGame(o);
  assert.equal(o.gameState, 'GAME_OVER');
});

test('resumeGame moves PAUSED back to PLAYING', () => {
  const s = playing();
  pauseGame(s);
  resumeGame(s);
  assert.equal(s.gameState, 'PLAYING');
  assert.equal(isPaused(s), false);
});

test('resumeGame is ignored when not paused', () => {
  const s = playing();
  endGame(s, 'right');
  resumeGame(s);
  assert.equal(s.gameState, 'GAME_OVER');
});

test('togglePause flips both ways', () => {
  const s = playing();
  togglePause(s);
  assert.equal(s.gameState, 'PAUSED');
  togglePause(s);
  assert.equal(s.gameState, 'PLAYING');
});

test('update does not move the ball while paused', () => {
  const s = playing();
  s.ball.x = 400; s.ball.vx = 100;
  pauseGame(s);
  update(s, 0.016);
  assert.equal(s.ball.x, 400);
});

test('reaching win score sets GAME_OVER with winner', () => {
  const s = playing();
  s.score.left = s.winScore - 1;
  s.ball.x = s.width + 10;
  update(s, 0.016);
  assert.equal(s.gameState, 'GAME_OVER');
  assert.equal(isGameOver(s), true);
  assert.equal(s.winner, 'left');
});

test('right player can win', () => {
  const s = playing();
  s.score.right = s.winScore - 1;
  s.ball.x = -10;
  update(s, 0.016);
  assert.equal(s.gameState, 'GAME_OVER');
  assert.equal(s.winner, 'right');
});

test('update does not move the ball after game over', () => {
  const s = playing();
  endGame(s, 'left');
  s.ball.x = 400; s.ball.vx = 100;
  update(s, 0.016);
  assert.equal(s.ball.x, 400);
});

test('restartGame from GAME_OVER returns to PLAYING and clears winner', () => {
  const s = playing();
  endGame(s, 'left');
  restartGame(s);
  assert.equal(s.gameState, 'PLAYING');
  assert.equal(s.winner, null);
  assert.equal(s.score.left, 0);
});

test('restartGame from LANDING does not skip the transition', () => {
  const s = createInitialState(800, 600);
  restartGame(s);
  assert.equal(s.gameState, 'LANDING');
});

test('rugby time limit ends the game via GAME_OVER', () => {
  const s = createInitialState(800, 600);
  s.rugbyMode.enabled = true;
  startPlaying(s, 'versus');
  s.rugbyMode.enabled = true;
  s.gameState = 'PLAYING';
  s.serveTimer = 0;
  s.score.left = 3;
  s.rugbySettings.elapsedTime = s.rugbySettings.timeLimit;
  update(s, 0.016);
  assert.equal(s.gameState, 'GAME_OVER');
  assert.equal(s.winner, 'left');
});

test('quit from pause heads to LANDING', () => {
  const s = playing();
  pauseGame(s);
  showLanding(s);
  update(s, 1); // fade out completes, state switches
  assert.equal(s.gameState, 'LANDING');
});

test('setPaddleSize resizes both paddles and clamps', () => {
  const s = createInitialState(800, 600);
  setPaddleSize(s, 1.25);
  assert.equal(s.settings.paddleSize, 1.25);
  assert.equal(s.paddles.left.h, PADDLE.DEFAULT_HEIGHT * 1.25);
  assert.equal(s.paddles.right.h, PADDLE.DEFAULT_HEIGHT * 1.25);
  setPaddleSize(s, 99);
  assert.equal(s.settings.paddleSize, PADDLE.SIZE_MULTIPLIER_MAX);
  setPaddleSize(s, -1);
  assert.equal(s.settings.paddleSize, PADDLE.SIZE_MULTIPLIER_MIN);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log('ok   - ' + name); }
  catch (e) { failed++; console.log('FAIL - ' + name + '\n       ' + e.message); }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
