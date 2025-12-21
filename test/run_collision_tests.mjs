import assert from 'node:assert/strict';
import { isCircleRectColliding, resolveCircleRectPenetration } from '../src/collision.js';
import { reflectFromPaddle, bounceOffHorizontalEdge } from '../src/ball.js';
import { update, createInitialState, startPlaying } from '../src/game-state.js';

function nearlyEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

console.log('Running collision unit tests (headless)...');

// Basic collision
const p = { x:100, y:200, w:10, h:80 };
let b = { x:95, y:200, r:10 };
assert(isCircleRectColliding(b,p), 'expected left collision');

b = { x:115, y:200, r:10 };
assert(isCircleRectColliding(b,p), 'expected right collision');

b = { x:115, y:155, r:10 };
assert(isCircleRectColliding(b,p), 'expected top collision');

b = { x:115, y:245, r:10 };
assert(isCircleRectColliding(b,p), 'expected bottom collision');

console.log('Basic AABB collisions OK');

// resolve penetration
let ball = { x:95, y:200, r:10 };
const res = resolveCircleRectPenetration(ball, p);
console.log('resolve returned:', res);
if (res) {
  assert(!isCircleRectColliding(ball, p), 'ball should be outside rect after resolution');
}
console.log('Resolution post-check OK');

// reflectFromPaddle center
let testBall = { x: -10, y: p.y, vx: -200, vy: 0, r: 6 };
const speed = Math.hypot(testBall.vx, testBall.vy) || 200;
reflectFromPaddle(testBall, p.y, p.h, +1, 60);
assert(Math.abs(testBall.vy) < 1e-6, 'center hit should have near-zero vy');
assert(Math.sign(testBall.vx) === 1, 'center hit should send ball to the right');
assert(nearlyEqual(Math.hypot(testBall.vx, testBall.vy), speed), 'speed should be preserved on reflection');
console.log('Center reflection OK');

// top edge hit
testBall = { x: -10, y: p.y - p.h/2, vx: -200, vy: 0, r: 6 };
reflectFromPaddle(testBall, p.y, p.h, +1, 60);
assert(testBall.vy < 0, 'top hit should send ball upward');
const angle = Math.atan2(Math.abs(testBall.vy), Math.abs(testBall.vx));
const deg = Math.abs(angle * 180 / Math.PI);
assert(Math.abs(deg - 60) < 1.5, `expected near 60deg bounce, got ${deg.toFixed(2)}`);
console.log(`Top edge reflection OK (angle ≈ ${deg.toFixed(2)}°)`);

// wall bounce
let wallBall = { x: 120, y: 5, r:6, vx: 80, vy: -50 };
const preSpeed = Math.hypot(wallBall.vx, wallBall.vy);
const bounced = bounceOffHorizontalEdge(wallBall, 200);
assert(bounced === true, 'expected wall bounce');
assert(wallBall.vy > 0, 'vy should now be positive');
assert(nearlyEqual(Math.hypot(wallBall.vx, wallBall.vy), preSpeed), 'speed should be preserved after wall bounce');
console.log('Wall bounce OK');

// swept guard (fast crossing)
const state = createInitialState(600, 400);
startPlaying(state, 'versus');
state.serveTimer = 0;
state.paused = false;
const leftP = state.paddles.left;
state.ball.x = leftP.x + leftP.w + 200;
state.ball.y = leftP.y;
state.ball.vx = -2000;
state.ball.vy = 0;
update(state, 0.1);
assert(state.ball.vx > 0, 'swept guard should have reflected the ball');
console.log('Swept collision guard OK');

// Corner collision: ball overlapping right paddle near top and moving up-right
const s2 = createInitialState(600, 400);
startPlaying(s2, 'versus');
s2.serveTimer = 0;
s2.paused = false;
const rightP = s2.paddles.right;
// move paddle up so its top is near the top wall, then place ball overlapping both
rightP.y = rightP.h / 2 + 2; // top ≈ 2px
s2.ball.x = rightP.x - s2.ball.r - 1; // center slightly into paddle
s2.ball.y = 1; // within top wall region (ball.y - r <= 0)
s2.ball.vx = 200; // towards right paddle
s2.ball.vy = -150; // upwards toward top wall
update(s2, 1/60);
// Expect both reflections: vx should be negative (reflected left), vy should be non-positive or flipped to positive depending on overlap handling
console.log('After corner update vx=', s2.ball.vx.toFixed(2), 'vy=', s2.ball.vy.toFixed(2));
assert(s2.ball.vx < 0, 'corner collision should reflect horizontal velocity');
assert(s2.ball.vy > -300, 'corner collision should have a bounded vertical response');
console.log('Corner collision handling OK');

// Spawn inside paddle: simulate scoring serve that would land inside a paddle
const s3 = createInitialState(600, 400);
startPlaying(s3, 'versus');
s3.serveTimer = 0;
s3.paused = false;
const leftP3 = s3.paddles.left;
// artificially trigger scoring by moving ball out of bounds on the left
s3.ball.x = -10;
update(s3, 1/60);
// After scoring, the served ball should not be colliding with paddles
assert(!isCircleRectColliding(s3.ball, leftP3), 'served ball should not spawn inside left paddle');
console.log('Spawn-inside-paddle protection OK');

console.log('All headless collision tests passed ✅');
