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
 * Spawns a goal post at a random vertical position
 * @param {Object} state - Game state with rugbyMode.goalPost properties
 */
export function spawnGoalPost(state) {
  const gp = state.rugbyMode.goalPost;

  // Calculate spawn bounds with padding
  const padding = BALL.DEFAULT_RADIUS * 2;
  const minY = padding + gp.height / 2;
  const maxY = state.height - padding - gp.height / 2;

  // Set random Y position
  gp.y = minY + Math.random() * (maxY - minY);
  gp.active = true;
  gp.timer = RUGBY.GOAL_POST_DURATION;

  console.log(`[Rugby] Goal post spawned at y=${gp.y.toFixed(1)}, duration=${gp.timer}s`);
}

/**
 * Updates goal post lifecycle (spawn/despawn timers)
 * @param {Object} state - Game state with rugbyMode.goalPost properties
 * @param {number} dt - Delta time in seconds
 */
export function updateGoalPost(state, dt) {
  const gp = state.rugbyMode.goalPost;

  if (gp.active) {
    // Countdown active timer
    gp.timer -= dt;

    if (gp.timer <= 0) {
      // Deactivate and set random spawn timer
      gp.active = false;
      gp.spawnTimer = RUGBY.GOAL_POST_SPAWN_MIN +
                      Math.random() * (RUGBY.GOAL_POST_SPAWN_MAX - RUGBY.GOAL_POST_SPAWN_MIN);
      console.log(`[Rugby] Goal post expired, next spawn in ${gp.spawnTimer.toFixed(1)}s`);
    }
  } else {
    // Countdown spawn timer
    gp.spawnTimer -= dt;

    if (gp.spawnTimer <= 0) {
      spawnGoalPost(state);
    }
  }
}

/**
 * Checks if ball hit the goal post zone
 * @param {Object} state - Game state with rugbyMode.goalPost properties
 * @param {Object} ball - Ball object with x, y, r properties
 * @returns {boolean} True if goal post was hit
 */
export function checkGoalPostHit(state, ball) {
  const gp = state.rugbyMode.goalPost;

  // Goal post must be active
  if (!gp.active) return false;

  // Check vertical zone
  const inVerticalZone = Math.abs(ball.y - gp.y) <= gp.height / 2;

  // Check if ball crossed boundary (left or right)
  const crossedBoundary = (ball.x - ball.r <= 0) || (ball.x + ball.r >= state.width);

  return inVerticalZone && crossedBoundary;
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

  console.log(`[Rugby] Rally count: ${rugby.rallyCount}, multiplier: ${rugby.multiplier}x`);
}

/**
 * Resets rally counter and multiplier
 * @param {Object} state - Game state with rugbyMode properties
 */
export function resetRally(state) {
  const rugby = state.rugbyMode;
  rugby.rallyCount = 0;
  rugby.multiplier = 1;

  console.log('[Rugby] Rally reset');
}

/**
 * Calculates goal post bonus points
 * @param {number} multiplier - Current rally multiplier
 * @returns {number} Bonus points
 */
export function calculateGoalPostBonus(multiplier) {
  return RUGBY.GOAL_POST_BONUS_BASE * multiplier;
}

/**
 * Calculates total score with multiplier and goal post bonus
 * @param {number} basePoints - Base points for the score
 * @param {number} multiplier - Current rally multiplier
 * @param {boolean} goalPostHit - Whether goal post was hit
 * @returns {number} Total score
 */
export function calculateScore(basePoints, multiplier, goalPostHit) {
  let total = basePoints * multiplier;

  if (goalPostHit) {
    total += calculateGoalPostBonus(multiplier);
  }

  return total;
}
