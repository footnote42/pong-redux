// src/collision.js
// Utilities for circle (ball) vs rectangle (paddle) collision with positional correction

/**
 * Clamps a value between min and max bounds
 * @private
 * @param {number} v - Value to clamp
 * @param {number} a - Minimum bound
 * @param {number} b - Maximum bound
 * @returns {number} Clamped value
 */
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

/**
 * AABB circle-rectangle collision detection
 * 
 * Uses the "closest point on rectangle" method:
 * 1. Find the point on the rectangle closest to the circle's center
 * 2. Check if distance from circle center to closest point ≤ radius
 * 
 * Note: Paddle Y is stored as center position, so rect bounds are computed as y ± h/2
 * 
 * @param {Object} ball - Ball object with x, y, r properties
 * @param {Object} paddle - Paddle object with x, y (center), w, h properties
 * @returns {boolean} True if ball and paddle are colliding
 * 
 * @example
 * if (isCircleRectColliding(ball, leftPaddle)) {
 *   // Handle collision
 * }
 */
export function isCircleRectColliding(ball, paddle) {
  const rect = {
    left: paddle.x,
    right: paddle.x + paddle.w,
    top: paddle.y - paddle.h / 2,
    bottom: paddle.y + paddle.h / 2,
  };

  const closestX = clamp(ball.x, rect.left, rect.right);
  const closestY = clamp(ball.y, rect.top, rect.bottom);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  return dx * dx + dy * dy <= ball.r * ball.r;
}

/**
 * Resolves circle-rectangle penetration by moving the ball out along collision normal
 * 
 * Uses closest-point overlap resolution to correct the ball's position without changing
 * its velocity. This prevents the ball from getting stuck inside or tunneling through paddles.
 * 
 * Algorithm:
 * 1. Find closest point on rectangle to circle center
 * 2. Calculate penetration depth (radius - distance to closest point)
 * 3. Move ball along collision normal by penetration depth + epsilon
 * 4. Handle degenerate cases (ball center inside rect) with axis-based fallback
 * 
 * @param {Object} ball - Ball object with x, y, r properties (modified in-place)
 * @param {Object} paddle - Paddle object with x, y (center), w, h properties
 * @returns {Object|null} Resolution info with {axis: 'x'|'y', penetration: number} or null if no penetration
 * 
 * @example
 * if (isCircleRectColliding(ball, paddle)) {
 *   const result = resolveCircleRectPenetration(ball, paddle);
 *   // Ball position is now corrected
 *   // result.axis tells which axis had more penetration
 * }
 */
export function resolveCircleRectPenetration(ball, paddle) {
  const rect = {
    left: paddle.x,
    right: paddle.x + paddle.w,
    top: paddle.y - paddle.h / 2,
    bottom: paddle.y + paddle.h / 2,
  };

  // Find closest point on rect to circle center
  const closestX = clamp(ball.x, rect.left, rect.right);
  const closestY = clamp(ball.y, rect.top, rect.bottom);
  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const dist2 = dx * dx + dy * dy;
  const r = ball.r;

  // No penetration
  if (dist2 > r * r || dist2 === 0) {
    // Handle degenerate case where center is exactly at closest point (ball center inside rect centerline)
    // Fallback to axis-based correction
    let penX = 0;
    if (ball.x < rect.left) penX = ball.x + r - rect.left;
    else if (ball.x > rect.right) penX = rect.right - (ball.x - r);

    let penY = 0;
    if (ball.y < rect.top) penY = ball.y + r - rect.top;
    else if (ball.y > rect.bottom) penY = rect.bottom - (ball.y - r);

    if (penX === 0 && penY === 0) return null;

    // Resolve on the smaller penetration axis
    if (Math.abs(penX) < Math.abs(penY)) {
      ball.x -= penX;
      return { axis: 'x', penetration: penX };
    } else {
      ball.y -= penY;
      return { axis: 'y', penetration: penY };
    }
  }

  const dist = Math.sqrt(dist2);
  const overlap = r - dist;
  // move ball out along collision normal by overlap (plus tiny epsilon)
  const nx = dx / dist;
  const ny = dy / dist;
  ball.x += nx * (overlap + 0.001);
  ball.y += ny * (overlap + 0.001);

  // Decide dominant axis for caller convenience
  const axis = Math.abs(nx) > Math.abs(ny) ? 'x' : 'y';
  return { axis, penetration: overlap };
}
