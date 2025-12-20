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
// Returns { axis: 'x'|'y', penetration: number }
export function resolveCircleRectPenetration(ball, paddle) {
  const rect = {
    left: paddle.x,
    right: paddle.x + paddle.w,
    top: paddle.y - paddle.h / 2,
    bottom: paddle.y + paddle.h / 2,
  };

  // Compute penetration on X axis
  let penX = 0;
  if (ball.x < rect.left) {
    penX = ball.x + ball.r - rect.left;
  } else if (ball.x > rect.right) {
    penX = rect.right - (ball.x - ball.r);
  }

  // Compute penetration on Y axis
  let penY = 0;
  if (ball.y < rect.top) {
    penY = ball.y + ball.r - rect.top;
  } else if (ball.y > rect.bottom) {
    penY = rect.bottom - (ball.y - ball.r);
  }

  // If both zero, no penetration
  if (penX === 0 && penY === 0) return null;

  // Decide which axis to resolve (smallest absolute penetration)
  const absPenX = Math.abs(penX) || Infinity;
  const absPenY = Math.abs(penY) || Infinity;

  if (absPenX < absPenY) {
    // move out in X
    ball.x -= penX;
    return { axis: 'x', penetration: penX };
  } else {
    // move out in Y
    ball.y -= penY;
    return { axis: 'y', penetration: penY };
  }
}
