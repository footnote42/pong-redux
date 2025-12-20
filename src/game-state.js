// src/game-state.js
// Minimal centralized state + update function stub

import { createPaddle, updatePaddle } from './paddle.js';
import { createBall, updateBall, bounceOffHorizontalEdge, resetBall, serveBall, reflectFromPaddle } from './ball.js';
import { isCircleRectColliding, resolveCircleRectPenetration } from './collision.js';

export function createInitialState(width = 800, height = 600) {
  return {
    width,
    height,
    score: { left: 0, right: 0 },
    paddles: {
      left: createPaddle(10, height / 2, 10, 80, 300),
      right: createPaddle(width - 20, height / 2, 10, 80, 300),
    },
    ball: createBall(width / 2, height / 2, 6, 200),
    running: false,
    paused: false,
  };
}

// Ensure a newly-served ball isn't spawned overlapping a paddle. Attempts a few re-serves then centers as fallback.
function ensureBallNotInsidePaddles(state, maxAttempts = 5) {
  const ball = state.ball;
  for (let i = 0; i < maxAttempts; ++i) {
    if (isCircleRectColliding(ball, state.paddles.left)) {
      // serve to the right
      resetBall(ball, state.width / 2, state.height / 2);
      serveBall(ball, +1);
      continue;
    }
    if (isCircleRectColliding(ball, state.paddles.right)) {
      // serve to the left
      resetBall(ball, state.width / 2, state.height / 2);
      serveBall(ball, -1);
      continue;
    }
    return;
  }
  // fallback: center and random serve
  resetBall(ball, state.width / 2, state.height / 2);
  serveBall(ball, Math.random() < 0.5 ? 1 : -1);
}

// dt is seconds

export function update(state, dt) {
  if (state.paused) return;

  // Update paddles
  updatePaddle(state.paddles.left, dt, state.height);
  updatePaddle(state.paddles.right, dt, state.height);

  // Integrate ball and keep previous position + velocity for swept checks and corner handling
  const ball = state.ball;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.prevVx = ball.vx;
  ball.prevVy = ball.vy;
  updateBall(ball, dt);

  // Wall collisions (top/bottom)
  bounceOffHorizontalEdge(ball, state.height);

  // Paddle collisions
  const left = state.paddles.left;
  const right = state.paddles.right;

  // Swept collision guard: catch fast-moving balls that cross the paddle front between frames.
  // Conditions: ball crosses the paddle front plane and is vertically within paddle extents (+radius)
  if (ball.prevX - ball.r > left.x + left.w && ball.x - ball.r <= left.x + left.w && Math.abs(ball.y - left.y) <= left.h / 2 + ball.r) {
    // Swept contact detected. Check for corner (simultaneous vertical wall touch)
    const touchedVertical = (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height);
    if (touchedVertical) {
      // Corner: invert both velocity components relative to pre-frame velocities
      ball.vx = -ball.prevVx;
      ball.vy = -ball.prevVy;
      // push ball just inside the play area so wall clamp won't flip vy again
      if (ball.prevY - ball.r <= 0) {
        // top
        ball.y = ball.r + 0.5;
      } else if (ball.prevY + ball.r >= state.height) {
        // bottom
        ball.y = state.height - ball.r - 0.5;
      }
    } else {
      // reflect based on hit location - ball should go right after hitting left paddle
      reflectFromPaddle(ball, left.y, left.h, +1);
    }
    // nudge ball to front to avoid re-collision
    ball.x = left.x + left.w + ball.r;
    // clamp to walls if needed (no-op if we already adjusted y)
    bounceOffHorizontalEdge(ball, state.height);
  } else if (ball.prevX + ball.r < right.x && ball.x + ball.r >= right.x && Math.abs(ball.y - right.y) <= right.h / 2 + ball.r) {
    const touchedVertical = (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height);
    if (touchedVertical) {
      ball.vx = -ball.prevVx;
      ball.vy = -ball.prevVy;
      if (ball.prevY - ball.r <= 0) {
        ball.y = ball.r + 0.5;
      } else if (ball.prevY + ball.r >= state.height) {
        ball.y = state.height - ball.r - 0.5;
      }
    } else {
      reflectFromPaddle(ball, right.y, right.h, -1);
    }
    ball.x = right.x - ball.r;
    bounceOffHorizontalEdge(ball, state.height);
  } else if (isCircleRectColliding(ball, left)) {
    // positional correction
    const res = resolveCircleRectPenetration(ball, left);
    // reflect based on hit location - ball should go right after hitting left paddle
    reflectFromPaddle(ball, left.y, left.h, +1);
    // ensure no sticking (nudge slightly out)
    ball.x = left.x + left.w + ball.r + 0.5;
    // If the ball was touching top/bottom this frame, invert vy as well (corner case)
    if (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height) {
      ball.vy = -ball.vy;
    }
    // In corner cases the ball may also collide with top/bottom - re-check to clamp position
    bounceOffHorizontalEdge(ball, state.height);
  } else if (isCircleRectColliding(ball, right)) {
    const res = resolveCircleRectPenetration(ball, right);
    // reflect to left
    reflectFromPaddle(ball, right.y, right.h, -1);
    ball.x = right.x - ball.r - 0.5;
    if (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height) {
      ball.vy = -ball.vy;
    }
    bounceOffHorizontalEdge(ball, state.height);
  }
  // Scoring (ball exits left/right bounds)
  if (ball.x - ball.r <= 0) {
    state.score.right += 1;
    resetBall(ball, state.width / 2, state.height / 2);
    serveBall(ball, Math.random() < 0.5 ? 1 : -1);
    ensureBallNotInsidePaddles(state);
  }

  if (ball.x + ball.r >= state.width) {
    state.score.left += 1;
    resetBall(ball, state.width / 2, state.height / 2);
    serveBall(ball, Math.random() < 0.5 ? 1 : -1);
    ensureBallNotInsidePaddles(state);
  }
}

export function serialize(state) {
  return JSON.stringify({
    width: state.width,
    height: state.height,
    score: state.score,
    paddles: state.paddles,
    ball: state.ball,
  });
}
