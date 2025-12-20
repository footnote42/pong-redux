// src/ball.js
// Ball entity helpers and bounce-angle computation

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

export function resetBall(ball, cx, cy) {
  ball.x = cx;
  ball.y = cy;
  ball.vx = 0;
  ball.vy = 0;
}

export function serveBall(ball, direction = 1) {
  // direction: +1 -> to the right, -1 -> to the left
  const maxAngle = (75 * Math.PI) / 180; // 75 degrees in radians
  const angle = (Math.random() * maxAngle * 2) - maxAngle; // -max..+max
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
}

export function updateBall(ball, dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}

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

// Compute new velocity after hitting a paddle using hit offset.
// paddleY is center Y of paddle, paddleH is paddle height, direction is +1 if paddle is on left (ball should go right), -1 otherwise.
// maxBounceDeg is the maximum deflection angle at the paddle edge (degrees)
// centerDeadzone is a relative value (-1..1) around center that forces zero vertical deflection for more forgiving center hits
export function reflectFromPaddle(ball, paddleY, paddleH, direction, maxBounceDeg = DEFAULT_MAX_BOUNCE_DEG, centerDeadzone = DEFAULT_CENTER_DEADZONE) {
  const relative = (ball.y - paddleY) / (paddleH / 2); // -1 .. +1
  const clampVal = Math.max(-1, Math.min(1, relative));

  // Apply center deadzone
  const effective = Math.abs(clampVal) <= Math.abs(centerDeadzone) ? 0 : clampVal;

  const maxBounce = (maxBounceDeg * Math.PI) / 180; // convert to radians
  const angle = effective * maxBounce;
  const speed = Math.hypot(ball.vx, ball.vy) || ball.speed;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}
