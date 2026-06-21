// src/rugby.js
// Rugby ball physics and game logic

import { PADDLE, BALL, RUGBY } from './constants.js';

/**
 * Rugby Ball Mode physics module
 * Handles spin mechanics, momentum impacts, goal posts, and rally scoring
 */

/**
 * Calculates spin gain from paddle impact
 * @param {number} paddleVelocity - Paddle velocity in pixels per second
 * @param {number} hitOffset - Hit offset from paddle center (-1 to +1)
 * @param {number} currentSpin - Current ball spin value (-1 to +1)
 * @returns {number} New spin value clamped to [-1, +1]
 */
export function calculateSpinGain(paddleVelocity, hitOffset, currentSpin) {
  // Normalize velocity to a reasonable range (0-1000 px/s)
  const normalizedVelocity = paddleVelocity / 1000;
  const spinGain = normalizedVelocity * hitOffset * RUGBY.SPIN_GAIN_FACTOR;
  const newSpin = currentSpin + spinGain;
  return Math.max(-1, Math.min(1, newSpin));
}

/**
 * Updates ball spin with exponential decay
 * @param {Object} ball - Ball object (not used, spin is on state.rugbyMode)
 * @param {Object} rugbyMode - Rugby mode state with spin property
 * @param {number} dt - Delta time in seconds
 */
export function updateSpin(ball, rugbyMode, dt) {
  // Apply exponential decay
  rugbyMode.spin *= Math.pow(RUGBY.SPIN_DECAY_RATE, dt);

  // Snap to zero when very small
  if (Math.abs(rugbyMode.spin) < RUGBY.SPIN_SNAP_THRESHOLD) {
    rugbyMode.spin = 0;
  }
}

/**
 * Applies spin-based variance to bounce angle
 * @param {number} baseBounceAngle - Base bounce angle in radians
 * @param {number} spin - Current spin value (-1 to +1)
 * @returns {number} Modified bounce angle in radians
 */
export function applySpinToBounce(baseBounceAngle, spin) {
  const maxVariance = (RUGBY.MAX_BOUNCE_VARIANCE_DEG * Math.PI) / 180;
  return baseBounceAngle + (spin * maxVariance);
}

/**
 * Updates paddle velocity tracking
 * @param {Object} paddle - Paddle object with y, prevY, and velocity properties
 * @param {number} dt - Delta time in seconds
 */
export function updatePaddleVelocity(paddle, dt) {
  // Initialize on first call
  if (paddle.prevY === undefined) {
    paddle.prevY = paddle.y;
    paddle.velocity = 0;
    return;
  }

  // Calculate velocity
  paddle.velocity = (paddle.y - paddle.prevY) / dt;
  paddle.prevY = paddle.y;
}

/**
 * Applies momentum-based impact to ball speed
 * @param {Object} ball - Ball object with vx, vy, speed properties
 * @param {Object} paddle - Paddle object with velocity property
 * @param {number} hitOffset - Hit offset from paddle center (-1 to +1)
 */
export function applyMomentumImpact(ball, paddle, hitOffset) {
  // Calculate current ball speed
  const currentSpeed = Math.hypot(ball.vx, ball.vy);

  // Apply momentum factor
  const momentumFactor = 1.0 + Math.abs(paddle.velocity || 0) / RUGBY.MOMENTUM_FACTOR_DIVISOR;
  const newSpeed = currentSpeed * momentumFactor;

  // Cap speed at maximum
  const maxSpeed = BALL.DEFAULT_SPEED * RUGBY.MAX_BALL_SPEED_MULTIPLIER;
  const cappedSpeed = Math.min(newSpeed, maxSpeed);

  // Preserve angle, update velocity components
  if (currentSpeed > 0) {
    const angle = Math.atan2(ball.vy, ball.vx);
    ball.vx = Math.cos(angle) * cappedSpeed;
    ball.vy = Math.sin(angle) * cappedSpeed;
  }
}

/**
 * Updates rally multiplier based on rally count
 * @param {Object} state - Game state with rugbyMode properties
 */
export function updateRallyMultiplier(state) {
  const rugby = state.rugbyMode;
  rugby.rallyCount++;

  // Update multiplier based on thresholds
  const { MULT_2X, MULT_3X, MULT_5X } = RUGBY.RALLY_THRESHOLDS;

  if (rugby.rallyCount >= MULT_5X) {
    rugby.multiplier = 5;
  } else if (rugby.rallyCount >= MULT_3X) {
    rugby.multiplier = 3;
  } else if (rugby.rallyCount >= MULT_2X) {
    rugby.multiplier = 2;
  } else {
    rugby.multiplier = 1;
  }

}

/**
 * Resets rally counter and multiplier
 * @param {Object} state - Game state with rugbyMode properties
 */
export function resetRally(state) {
  const rugby = state.rugbyMode;
  rugby.rallyCount = 0;
  rugby.multiplier = 1;
}

