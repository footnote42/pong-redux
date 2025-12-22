// src/paddle.js
// Paddle entity helpers

/**
 * Creates a new paddle entity with position, dimensions, and physics properties
 * @param {number} x - X position (left edge)
 * @param {number} y - Y position (center)
 * @param {number} [w=10] - Paddle width in pixels
 * @param {number} [h=80] - Paddle height in pixels
 * @param {number} [speed=300] - Maximum paddle speed in pixels per second
 * @returns {Object} Paddle object with x, y, w, h, speed, vy, inputDir, accel properties
 */
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

/**
 * Updates paddle position with smooth acceleration/deceleration physics
 * 
 * Uses acceleration-based movement for smooth transitions:
 * - Accelerates toward target velocity based on inputDir
 * - Clamps to max speed
 * - Stops smoothly when input is released
 * - Prevents paddle from leaving play area
 * 
 * @param {Object} paddle - Paddle object with y, vy, inputDir, speed, accel, h properties (modified in-place)
 * @param {number} dt - Delta time in seconds
 * @param {number} boundsHeight - Height of play area in pixels
 * 
 * @example
 * // In game loop
 * setPaddleDirection(paddle, -1); // Move up
 * updatePaddle(paddle, deltaTime, canvasHeight);
 */
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

/**
 * Sets paddle movement direction from input
 * @param {Object} paddle - Paddle object to control
 * @param {number} dir - Direction: -1 for up, 0 for stop, +1 for down
 */
export function setPaddleDirection(paddle, dir) {
  paddle.inputDir = dir;
}
