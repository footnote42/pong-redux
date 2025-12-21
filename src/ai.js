// src/ai.js
// CPU opponent with reactive tracking and intentional flaws

// Difficulty configurations
export const AI_CONFIG = {
  easy: {
    reactionMs: 400,      // Reaction delay before responding to ball
    errorPx: 60,          // Random targeting error
    updateMs: 200,        // How often to recalculate target
    speedMult: 0.7,       // Speed multiplier vs human
    returnToCenter: true  // Return to center when ball moves away
  },
  medium: {
    reactionMs: 200,
    errorPx: 30,
    updateMs: 100,
    speedMult: 0.85,
    returnToCenter: true
  },
  hard: {
    reactionMs: 100,
    errorPx: 15,
    updateMs: 50,
    speedMult: 1.0,
    returnToCenter: false  // Stay aggressive
  }
};

const DEAD_ZONE_PX = 5;  // Stop moving when within this range of target
const RETURN_TO_CENTER_SPEED_MULT = 0.5;  // Slower movement when returning to center

// Initialize CPU state in game state
export function initCPU(state, difficulty = 'medium') {
  state.cpu = {
    enabled: state.gameMode === 'single',
    difficulty,
    reactionTimer: AI_CONFIG[difficulty].reactionMs,
    updateTimer: 0,
    targetY: state.height / 2,
    currentError: 0,
    hasReacted: false
  };
}

// Update CPU state - call this on every game update
export function updateCPU(state, dt) {
  if (!state.cpu || !state.cpu.enabled || state.gameOver || state.paused) {
    return;
  }

  const cpu = state.cpu;
  const difficulty = AI_CONFIG[cpu.difficulty];
  const ball = state.ball;
  const paddle = state.paddles.right;  // CPU controls right paddle
  const courtCenterY = state.height / 2;

  // Convert dt from seconds to milliseconds
  const dtMs = dt * 1000;

  // Update timers
  cpu.reactionTimer = Math.max(0, cpu.reactionTimer - dtMs);
  cpu.updateTimer = Math.max(0, cpu.updateTimer - dtMs);

  // Check if ball is approaching CPU (moving right)
  const ballApproaching = ball.vx > 0;

  // Handle reaction delay
  if (ballApproaching) {
    if (!cpu.hasReacted) {
      // Still in reaction delay
      if (cpu.reactionTimer <= 0) {
        cpu.hasReacted = true;
      } else {
        return;  // Don't move yet
      }
    }
  } else {
    // Ball moving away - reset reaction state
    cpu.hasReacted = false;
    cpu.reactionTimer = difficulty.reactionMs;

    // Return to center position
    if (difficulty.returnToCenter) {
      cpu.targetY = courtCenterY;
    }
  }

  // Update target position periodically (not every frame)
  if (ballApproaching && cpu.updateTimer <= 0) {
    // Generate new targeting error
    cpu.currentError = (Math.random() * 2 - 1) * difficulty.errorPx;

    // Set target with error offset
    cpu.targetY = ball.y + cpu.currentError;

    // Clamp target to playable area
    const halfPaddleHeight = paddle.h / 2;
    cpu.targetY = Math.max(halfPaddleHeight, Math.min(state.height - halfPaddleHeight, cpu.targetY));

    // Reset update timer
    cpu.updateTimer = difficulty.updateMs;
  }

  // Move paddle toward target
  const delta = cpu.targetY - paddle.y;

  // Dead zone - don't move if close enough
  if (Math.abs(delta) <= DEAD_ZONE_PX) {
    paddle.vy = 0;
    return;
  }

  // Calculate movement speed
  const baseSpeed = paddle.speed;
  let speedMult = difficulty.speedMult;

  // Use slower speed when returning to center
  if (!ballApproaching && difficulty.returnToCenter) {
    speedMult *= RETURN_TO_CENTER_SPEED_MULT;
  }

  // Calculate max movement this frame
  const maxMove = baseSpeed * speedMult * dt;

  // Determine direction and apply movement
  const direction = delta > 0 ? 1 : -1;
  const move = Math.min(Math.abs(delta), maxMove) * direction;

  // Apply movement
  paddle.y += move;

  // Clamp to boundaries
  const halfHeight = paddle.h / 2;
  paddle.y = Math.max(halfHeight, Math.min(state.height - halfHeight, paddle.y));

  // Update velocity for consistency (used in other parts of code)
  paddle.vy = move / dt;
}

// Change CPU difficulty mid-game
export function setCPUDifficulty(state, difficulty) {
  if (!state.cpu) return;

  state.cpu.difficulty = difficulty;
  state.cpu.reactionTimer = AI_CONFIG[difficulty].reactionMs;
  state.cpu.updateTimer = 0;
  state.cpu.hasReacted = false;
}
