// src/paddle.js
// Paddle entity helpers

export function createPaddle(x, y, w = 10, h = 80, speed = 300) {
  return {
    x,
    y,
    w,
    h,
    speed,
    vy: 0, // -1 for up, +1 for down, or continuous velocity in px/s
  };
}

// dt in seconds
export function updatePaddle(paddle, dt, boundsHeight) {
  // If vy is -1, 0, or 1, interpret as directional input; otherwise use as velocity px/s
  const vel = Math.abs(paddle.vy) <= 1 ? paddle.vy * paddle.speed : paddle.vy;
  paddle.y += vel * dt;

  // Clamp inside bounds
  const half = paddle.h / 2;
  if (paddle.y - half < 0) paddle.y = half;
  if (paddle.y + half > boundsHeight) paddle.y = boundsHeight - half;
}

export function setPaddleDirection(paddle, dir) {
  // dir: -1 (up), 0 (stop), +1 (down)
  paddle.vy = dir;
}
