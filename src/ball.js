// src/ball.js
// Ball entity helpers and bounce-angle computation

import { RUGBY } from './constants.js';

/**
 * Creates a new ball entity with position, radius, and initial speed
 * @param {number} x - Initial X position (center)
 * @param {number} y - Initial Y position (center)
 * @param {number} [r=6] - Ball radius in pixels
 * @param {number} [speed=200] - Ball speed in pixels per second
 * @returns {Object} Ball object with x, y, r, vx, vy, speed properties
 */
export function createBall(x, y, r = 6, speed = 200) {
  return {
    x,
    y,
    r,
    vx: speed, // initial direction should be set via serve()
    vy: 0,
    speed,
  };
}

/**
 * Resets ball to specified position with zero velocity
 * @param {Object} ball - Ball object to reset
 * @param {number} cx - New center X position
 * @param {number} cy - New center Y position
 */
export function resetBall(ball, cx, cy) {
  ball.x = cx;
  ball.y = cy;
  ball.vx = 0;
  ball.vy = 0;
}

/**
 * Serves the ball in a random direction within max angle range
 * @param {Object} ball - Ball object to serve
 * @param {number} [direction=1] - Serve direction: +1 for right, -1 for left
 */
export function serveBall(ball, direction = 1) {
  const maxAngle = (75 * Math.PI) / 180; // 75 degrees in radians
  const angle = (Math.random() * maxAngle * 2) - maxAngle; // -max..+max
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
}

/**
 * Updates ball position based on velocity and delta time
 * @param {Object} ball - Ball object to update
 * @param {number} dt - Delta time in seconds
 */
export function updateBall(ball, dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}

/**
 * Handles ball collision with top/bottom walls
 * Clamps position and reflects vertical velocity
 * @param {Object} ball - Ball object with x, y, r, vx, vy properties
 * @param {number} boundsHeight - Height of play area in pixels
 * @returns {boolean} True if ball bounced, false otherwise
 */
export function bounceOffHorizontalEdge(ball, boundsHeight) {
  const r = ball.r;
  if (ball.y - r <= 0) {
    ball.y = r;
    ball.vy = -ball.vy;
    return true;
  }
  if (ball.y + r >= boundsHeight) {
    ball.y = boundsHeight - r;
    ball.vy = -ball.vy;
    return true;
  }
  return false;
}

export const DEFAULT_MAX_BOUNCE_DEG = 50;
export const DEFAULT_CENTER_DEADZONE = 0.05; // relative offset deadzone around center that yields straight bounce

/**
 * Reflects ball velocity after paddle collision with angle variation based on hit offset
 * 
 * The bounce angle varies from straight (0°) at center to maxBounceDeg at paddle edges.
 * A center deadzone provides more forgiving straight bounces near the paddle center.
 * In rugby mode, spin adds additional random variance to bounce angle.
 * 
 * @param {Object} ball - Ball object with x, y, vx, vy, r, speed properties (modified in-place)
 * @param {number} paddleY - Paddle center Y position
 * @param {number} paddleH - Paddle height in pixels
 * @param {number} direction - Reflection direction: +1 for right (left paddle), -1 for left (right paddle)
 * @param {number} [maxBounceDeg=50] - Maximum deflection angle at paddle edge in degrees
 * @param {number} [centerDeadzone=0.05] - Relative offset around center (0-1) that yields straight bounce
 * @param {number} [rugbyModeSpin=0] - Rugby mode spin value (-1 to +1) for bounce variance
 * 
 * @example
 * // Ball hits left paddle near top edge, should deflect upward-right
 * reflectFromPaddle(ball, paddleY, paddleH, +1);
 * 
 * // Ball hits right paddle at center, should go straight left
 * reflectFromPaddle(ball, paddleY, paddleH, -1);
 * 
 * // Rugby mode: add spin-based variance
 * reflectFromPaddle(ball, paddleY, paddleH, +1, 50, 0.05, state.rugbyMode.spin);
 */
export function reflectFromPaddle(ball, paddleY, paddleH, direction, maxBounceDeg = DEFAULT_MAX_BOUNCE_DEG, centerDeadzone = DEFAULT_CENTER_DEADZONE, rugbyModeSpin = 0) {
  const relative = (ball.y - paddleY) / (paddleH / 2); // -1 .. +1
  const clampVal = Math.max(-1, Math.min(1, relative));

  // Apply center deadzone
  const effective = Math.abs(clampVal) <= Math.abs(centerDeadzone) ? 0 : clampVal;

  const maxBounce = (maxBounceDeg * Math.PI) / 180; // convert to radians
  let angle = effective * maxBounce;

  // Apply spin-based variance for rugby mode
  if (rugbyModeSpin !== 0) {
    const maxVariance = (RUGBY.MAX_BOUNCE_VARIANCE_DEG * Math.PI) / 180;
    angle += rugbyModeSpin * maxVariance;
  }

  const speed = Math.hypot(ball.vx, ball.vy) || ball.speed;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}
