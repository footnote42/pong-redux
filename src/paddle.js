// src/paddle.js
// Paddle entity helpers

export function createPaddle(x, y, w = 10, h = 80, speed = 300) {
  return {
    x,
    y,
    w,
    h,
    speed,
    vy: 0, // current velocity in px/s
    inputDir: 0, // -1 up, +1 down, 0 none
    accel: 2000, // px/s^2 accel/decel for smoothing
  };
}

// dt in seconds
export function updatePaddle(paddle, dt, boundsHeight) {
  // Smoothly move current velocity toward target velocity based on inputDir
  const targetVel = paddle.inputDir * paddle.speed;
  const dv = targetVel - paddle.vy;
  const maxDelta = paddle.accel * dt;
  const change = Math.max(-maxDelta, Math.min(maxDelta, dv));
  paddle.vy += change;

  paddle.y += paddle.vy * dt;

  // Clamp inside bounds and zero velocity when hitting edges
  const half = paddle.h / 2;
  if (paddle.y - half < 0) {
    paddle.y = half;
    paddle.vy = 0;
  }
  if (paddle.y + half > boundsHeight) {
    paddle.y = boundsHeight - half;
    paddle.vy = 0;
  }
}

export function setPaddleDirection(paddle, dir) {
  // dir: -1 (up), 0 (stop), +1 (down)
  paddle.inputDir = dir;
}
