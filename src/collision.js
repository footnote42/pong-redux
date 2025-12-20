// src/collision.js
// Utilities for circle (ball) vs rectangle (paddle) collision with positional correction

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

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

// Resolve penetration by moving the ball out along the minimal penetration axis.
// Uses closest-point overlap resolution to nudge the ball out along the collision normal without changing its velocity.
// Returns { axis: 'x'|'y'|'both', penetration: number }
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
