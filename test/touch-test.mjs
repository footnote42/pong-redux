// Touch zones and Drag control: zone assignment and drag maths.
import assert from 'node:assert/strict';
import { zoneForX, humanZones, createTouchController, applyDrags } from '../src/touch.js';
import { createInitialState, startPlaying, startRugbyMode } from '../src/game-state.js';

console.log('Testing touch zones and drag control...');

// Zones are halves of the screen
assert.equal(zoneForX(0, 800), 'left');
assert.equal(zoneForX(399, 800), 'left');
assert.equal(zoneForX(400, 800), 'right');
assert.equal(zoneForX(799, 800), 'right');

// Game modes: the CPU side is not a human zone
assert.deepEqual(humanZones('single'), ['left']);
assert.deepEqual(humanZones('rugby-single'), ['left']);
assert.deepEqual(humanZones('versus'), ['left', 'right']);
assert.deepEqual(humanZones('rugby-versus'), ['left', 'right']);

function playing(mode) {
  const s = createInitialState(800, 600);
  if (mode.startsWith('rugby')) startRugbyMode(s, mode); else startPlaying(s, mode);
  s.gameState = 'PLAYING';
  s.paused = false;
  s.gameOver = false;
  s.showSettings = false;
  s.paddles.left.y = 300;
  s.paddles.right.y = 300;
  return s;
}

// Drag moves the paddle by the finger delta, never jumps to it
{
  const s = playing('versus');
  const c = createTouchController();
  assert.ok(c.begin(1, 'left', 100, humanZones(s.gameMode)));
  c.move(1, 130);
  c.move(1, 150);
  applyDrags(s, c);
  assert.equal(s.paddles.left.y, 350);
  assert.equal(s.paddles.right.y, 300);
  applyDrags(s, c); // nothing pending after consume
  assert.equal(s.paddles.left.y, 350);
}

// Two simultaneous touches drive both paddles independently
{
  const s = playing('versus');
  const c = createTouchController();
  c.begin(1, 'left', 100, humanZones(s.gameMode));
  c.begin(2, 'right', 400, humanZones(s.gameMode));
  c.move(1, 60);
  c.move(2, 460);
  applyDrags(s, c);
  assert.equal(s.paddles.left.y, 260);
  assert.equal(s.paddles.right.y, 360);
}

// vs CPU / Rugby (1P): the CPU half ignores touches
for (const mode of ['single', 'rugby-single']) {
  const s = playing(mode);
  const c = createTouchController();
  assert.equal(c.begin(1, 'right', 100, humanZones(s.gameMode)), false);
  assert.equal(c.move(1, 200), false);
  applyDrags(s, c);
  assert.equal(s.paddles.right.y, 300);
  assert.ok(c.begin(2, 'left', 100, humanZones(s.gameMode)));
}

// Clamped to the court
{
  const s = playing('versus');
  const c = createTouchController();
  c.begin(1, 'left', 0, ['left']);
  c.move(1, 5000);
  applyDrags(s, c);
  assert.equal(s.paddles.left.y, 600 - s.paddles.left.h / 2);
  c.move(1, -5000);
  applyDrags(s, c);
  assert.equal(s.paddles.left.y, s.paddles.left.h / 2);
}

// Not applied while paused; pending drag is discarded
{
  const s = playing('versus');
  s.paused = true;
  const c = createTouchController();
  c.begin(1, 'left', 100, ['left']);
  c.move(1, 200);
  applyDrags(s, c);
  assert.equal(s.paddles.left.y, 300);
  s.paused = false;
  applyDrags(s, c);
  assert.equal(s.paddles.left.y, 300);
}

console.log('touch tests passed');
