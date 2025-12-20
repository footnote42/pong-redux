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

// dt is seconds

export function update(state, dt) {
  if (state.paused) return;

  // Update paddles
  updatePaddle(state.paddles.left, dt, state.height);
  updatePaddle(state.paddles.right, dt, state.height);

  // Integrate ball
  updateBall(state.ball, dt);

  // Wall collisions (top/bottom)
  bounceOffHorizontalEdge(state.ball, state.height);

  // Paddle collisions
  const left = state.paddles.left;
  const right = state.paddles.right;
  const ball = state.ball;

  if (isCircleRectColliding(ball, left)) {
    // positional correction
    const res = resolveCircleRectPenetration(ball, left);
    // reflect based on hit location - ball should go right after hitting left paddle
    reflectFromPaddle(ball, left.y, left.h, +1);
    // ensure no sticking
    ball.x = left.x + left.w + ball.r;
  } else if (isCircleRectColliding(ball, right)) {
    const res = resolveCircleRectPenetration(ball, right);
    // reflect to left
    reflectFromPaddle(ball, right.y, right.h, -1);
    ball.x = right.x - ball.r;
  }

  // Scoring (ball exits left/right bounds)
  if (ball.x - ball.r <= 0) {
    state.score.right += 1;
    resetBall(ball, state.width / 2, state.height / 2);
    serveBall(ball, Math.random() < 0.5 ? 1 : -1);
  }

  if (ball.x + ball.r >= state.width) {
    state.score.left += 1;
    resetBall(ball, state.width / 2, state.height / 2);
    serveBall(ball, Math.random() < 0.5 ? 1 : -1);
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
