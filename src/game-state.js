// src/game-state.js
// Minimal centralized state + update function stub

import { createPaddle, updatePaddle } from './paddle.js';
import { createBall, updateBall, bounceOffHorizontalEdge, resetBall, serveBall, reflectFromPaddle } from './ball.js';
import { isCircleRectColliding, resolveCircleRectPenetration } from './collision.js';
import { initCPU, updateCPU, setCPUDifficulty } from './ai.js';
import { CANVAS, PADDLE, BALL, GAME, AUDIO, PHYSICS } from './constants.js';

/**
 * Creates the initial game state with default values
 * 
 * Loads persisted settings and high scores from localStorage if available.
 * Initializes all game entities (paddles, ball) at starting positions.
 * Sets game to LANDING screen by default.
 * 
 * @param {number} [width=800] - Canvas width in pixels
 * @param {number} [height=600] - Canvas height in pixels
 * @returns {Object} Complete game state object with all properties
 */
export function createInitialState(width = CANVAS.DEFAULT_WIDTH, height = CANVAS.DEFAULT_HEIGHT) {
  const hasSeen = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('pong:seenInstructions') === '1';
  // load settings and highScore from localStorage if available
  let persistedSettings = null;
  let persistedHigh = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const s = window.localStorage.getItem('pong:settings');
      if (s) persistedSettings = JSON.parse(s);
      const h = window.localStorage.getItem('pong:highScore');
      if (h) persistedHigh = JSON.parse(h);
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
  }

  // Default settings with all options
  const defaultSettings = {
    difficulty: GAME.DEFAULT_DIFFICULTY,
    ballSpeed: 1.0,      // 0.5x to 2.0x multiplier
    winScore: GAME.DEFAULT_WIN_SCORE,
    soundEnabled: true,  // Sound effects on/off
    volume: AUDIO.DEFAULT_VOLUME,
    paddleStyle: 'classic', // 'classic', 'retro', 'neon', 'custom'
    leftPaddleColor: '#ffffff', // Custom color for left paddle
    rightPaddleColor: '#ffffff', // Custom color for right paddle
    ballStyle: 'classic', // 'classic', 'retro', 'glow', 'soccer'
    ballColor: '#ffffff', // Custom ball color
    ballTrail: false, // Trail effect on/off
    ballFlash: true, // Collision flash on/off
    trailLength: 5 // Number of trail positions (3-10)
  };
  return {
    width,
    height,
    score: { left: 0, right: 0 },
    paddles: {
      left: createPaddle(PADDLE.DEFAULT_X_OFFSET_LEFT, height / 2, PADDLE.DEFAULT_WIDTH, PADDLE.DEFAULT_HEIGHT, PADDLE.DEFAULT_SPEED),
      right: createPaddle(width - PADDLE.DEFAULT_X_OFFSET_RIGHT, height / 2, PADDLE.DEFAULT_WIDTH, PADDLE.DEFAULT_HEIGHT, PADDLE.DEFAULT_SPEED),
    },
    ball: createBall(width / 2, height / 2, BALL.DEFAULT_RADIUS, BALL.DEFAULT_SPEED),
    ballTrail: [], // Array of {x, y} positions for trail effect
    ballFlashTimer: 0, // Timer for collision flash effect (seconds)
    running: false,
    paused: false,
    gameOver: false,
    winner: null, // 'left' or 'right'
    serveTimer: 0, // countdown timer for serve delay (seconds)
    winScore: (persistedSettings && persistedSettings.winScore) || defaultSettings.winScore,
    showInstructions: !hasSeen,
    // Stage 5: landing and game mode - default to LANDING screen
    gameState: 'LANDING', // 'LANDING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
    gameMode: null, // 'single' or 'versus'
    landingHover: null,
    // Stage 5 extras: settings and high score
    settings: persistedSettings || defaultSettings,
    highScore: persistedHigh || { score: 0, holder: null },
    showSettings: false,
    settingsHover: null,
    settingsTab: 'gameplay', // 'gameplay', 'audio', 'about'
  };
}

export function setDifficulty(state, level) {
  state.settings.difficulty = level;

  // Update CPU difficulty if in single player mode
  if (state.cpu && state.cpu.enabled) {
    setCPUDifficulty(state, level);
  }

  persistSettings(state);
}

export function setBallSpeed(state, multiplier) {
  state.settings.ballSpeed = Math.max(BALL.SPEED_MULTIPLIER_MIN, Math.min(BALL.SPEED_MULTIPLIER_MAX, multiplier));
  // Apply to current ball if game is running
  if (state.ball) {
    const baseSpeed = BALL.DEFAULT_SPEED;
    const currentSpeed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
    if (currentSpeed > 0) {
      const targetSpeed = baseSpeed * state.settings.ballSpeed;
      const ratio = targetSpeed / currentSpeed;
      state.ball.vx *= ratio;
      state.ball.vy *= ratio;
    }
  }
  persistSettings(state);
}

export function setWinScore(state, score) {
  state.settings.winScore = score;
  state.winScore = score;
  persistSettings(state);
}

export function setSoundEnabled(state, enabled) {
  state.settings.soundEnabled = enabled;
  persistSettings(state);
}

export function setVolume(state, volume) {
  state.settings.volume = Math.max(AUDIO.VOLUME_MIN, Math.min(AUDIO.VOLUME_MAX, volume));
  persistSettings(state);
}


export function setPaddleStyle(state, style) {
  if (['classic', 'retro', 'neon', 'custom'].includes(style)) {
    state.settings.paddleStyle = style;
    persistSettings(state);
  }
}

export function setLeftPaddleColor(state, color) {
  state.settings.leftPaddleColor = color;
  persistSettings(state);
}

export function setRightPaddleColor(state, color) {
  state.settings.rightPaddleColor = color;
  persistSettings(state);
}


export function setBallStyle(state, style) {
  if (['classic', 'retro', 'glow', 'soccer'].includes(style)) {
    state.settings.ballStyle = style;
    persistSettings(state);
  }
}

export function setBallColor(state, color) {
  state.settings.ballColor = color;
  persistSettings(state);
}

export function setBallTrail(state, enabled) {
  state.settings.ballTrail = enabled;
  // Initialize trail array if enabling
  if (enabled && !state.ballTrail) {
    state.ballTrail = [];
  }
  persistSettings(state);
}

export function setBallFlash(state, enabled) {
  state.settings.ballFlash = enabled;
  persistSettings(state);
}

export function setTrailLength(state, length) {
  state.settings.trailLength = Math.max(3, Math.min(10, length));
  persistSettings(state);
}

function persistSettings(state) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const s = JSON.stringify(state.settings);
      window.localStorage.setItem('pong:settings', s);
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }
}

export function recordHighScore(state, score, holder = 'Player') {
  if (score > state.highScore.score) {
    state.highScore = { score, holder };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('pong:highScore', JSON.stringify(state.highScore));
      } catch (e) {
        console.warn('Failed to save high score to localStorage:', e);
      }
    }
  }
}


export function showLanding(state) {
  state.gameState = 'LANDING';
  state.showInstructions = false; // don't show instruction overlay on top of landing
  state.landingHover = null;
}

export function startPlaying(state, mode = 'versus') {
  state.gameMode = mode; // 'single' or 'versus'
  state.gameState = 'PLAYING';
  state.showInstructions = false;
  state.landingHover = null;
  // Persist that user has seen landing so it won't show automatically again
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('pong:seenLanding', '1');
  }
  // Initialize CPU if single player mode
  if (mode === 'single') {
    initCPU(state, state.settings.difficulty);
  } else {
    state.cpu = { enabled: false };
  }
  // Reset play state
  restartGame(state);
}

// Ensure a newly-served ball isn't spawned overlapping a paddle. Attempts a few re-serves then centers as fallback.
function ensureBallNotInsidePaddles(state, maxAttempts = 5) {
  const ball = state.ball;
  for (let i = 0; i < maxAttempts; ++i) {
    if (isCircleRectColliding(ball, state.paddles.left)) {
      // serve to the right
      resetBall(ball, state.width / 2, state.height / 2);
      serveBall(ball, +1);
      continue;
    }
    if (isCircleRectColliding(ball, state.paddles.right)) {
      // serve to the left
      resetBall(ball, state.width / 2, state.height / 2);
      serveBall(ball, -1);
      continue;
    }
    return;
  }
  // fallback: center and random serve
  resetBall(ball, state.width / 2, state.height / 2);
  serveBall(ball, Math.random() < 0.5 ? 1 : -1);
}

/**
 * Main game update loop - processes all game logic for one physics step
 * 
 * Update order (critical for deterministic physics):
 * 1. Check if game is active (skip if paused, game over, or not PLAYING)
 * 2. Handle serve delay timer (countdown before ball is served)
 * 3. Update paddle positions (player input or CPU AI)
 * 4. Update ball position (integrate velocity)
 * 5. Handle wall collisions (top/bottom bounds)
 * 6. Handle paddle collisions with swept collision detection for fast balls
 * 7. Handle corner cases (simultaneous wall + paddle collision)
 * 8. Handle scoring (ball exits left/right bounds)
 * 9. Check win condition
 * 
 * Collision system:
 * - Swept collision: Catches fast balls crossing paddle front between frames
 * - AABB collision: Fallback for overlapping collisions
 * - Positional correction: Prevents tunneling and sticking
 * - Corner handling: Detects simultaneous vertical wall + paddle collision
 * 
 * @param {Object} state - Game state object (modified in-place)
 * @param {number} dt - Delta time in seconds (should be constant from fixed timestep)
 * 
 * @example
 * // Called from fixed timestep game loop
 * const MS_PER_UPDATE = 1000 / 60; // 60 Hz
 * update(state, MS_PER_UPDATE / 1000);
 */
export function update(state, dt) {
  // Only update game when we're actively playing
  if (state.gameState !== 'PLAYING') return;
  if (state.paused || state.gameOver) return;

  // Handle serve delay timer
  if (state.serveTimer > 0) {
    state.serveTimer -= dt;
    if (state.serveTimer <= 0) {
      state.serveTimer = 0;
      // Serve the ball
      serveBall(state.ball, Math.random() < 0.5 ? 1 : -1);
      ensureBallNotInsidePaddles(state);
    }
    return; // Don't update game while waiting to serve
  }

  // Update paddles
  updatePaddle(state.paddles.left, dt, state.height);

  // CPU controls right paddle in single player mode
  if (state.cpu && state.cpu.enabled) {
    updateCPU(state, dt);
  } else {
    updatePaddle(state.paddles.right, dt, state.height);
  }

  // Integrate ball and keep previous position + velocity for swept checks and corner handling
  const ball = state.ball;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.prevVx = ball.vx;
  ball.prevVy = ball.vy;
  updateBall(ball, dt);

  // Update ball trail (if enabled)
  if (state.settings.ballTrail) {
    if (!state.ballTrail) state.ballTrail = [];
    state.ballTrail.push({ x: ball.x, y: ball.y });
    // Keep trail at max length
    while (state.ballTrail.length > state.settings.trailLength) {
      state.ballTrail.shift();
    }
  }

  // Update flash timer
  if (state.ballFlashTimer > 0) {
    state.ballFlashTimer -= dt;
  }

  // Wall collisions (top/bottom)
  const wallBounce = bounceOffHorizontalEdge(ball, state.height);
  if (wallBounce && state.settings.ballFlash) {
    state.ballFlashTimer = 0.1; // 100ms flash
  }

  // Paddle collisions
  const left = state.paddles.left;
  const right = state.paddles.right;

  // Swept collision guard: catch fast-moving balls that cross the paddle front between frames.
  // Conditions: ball crosses the paddle front plane and is vertically within paddle extents (+radius)
  if (ball.prevX - ball.r > left.x + left.w && ball.x - ball.r <= left.x + left.w && Math.abs(ball.y - left.y) <= left.h / 2 + ball.r) {
    // Swept contact detected. Check for corner (simultaneous vertical wall touch)
    const touchedVertical = (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height);
    if (touchedVertical) {
      // Corner: invert both velocity components relative to pre-frame velocities
      ball.vx = -ball.prevVx;
      ball.vy = -ball.prevVy;
      // push ball just inside the play area so wall clamp won't flip vy again
      if (ball.prevY - ball.r <= 0) {
        // top
        ball.y = ball.r + 0.5;
      } else if (ball.prevY + ball.r >= state.height) {
        // bottom
        ball.y = state.height - ball.r - 0.5;
      }
    } else {
      // reflect based on hit location - ball should go right after hitting left paddle
      reflectFromPaddle(ball, left.y, left.h, +1);
      if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
    }
    // nudge ball to front to avoid re-collision
    ball.x = left.x + left.w + ball.r;
    // clamp to walls if needed (no-op if we already adjusted y)
    bounceOffHorizontalEdge(ball, state.height);
  } else if (ball.prevX + ball.r < right.x && ball.x + ball.r >= right.x && Math.abs(ball.y - right.y) <= right.h / 2 + ball.r) {
    const touchedVertical = (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height);
    if (touchedVertical) {
      ball.vx = -ball.prevVx;
      ball.vy = -ball.prevVy;
      if (ball.prevY - ball.r <= 0) {
        ball.y = ball.r + 0.5;
      } else if (ball.prevY + ball.r >= state.height) {
        ball.y = state.height - ball.r - 0.5;
      }
    } else {
      reflectFromPaddle(ball, right.y, right.h, -1);
      if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
    }
    ball.x = right.x - ball.r;
    bounceOffHorizontalEdge(ball, state.height);
  } else if (isCircleRectColliding(ball, left)) {
    // positional correction
    const res = resolveCircleRectPenetration(ball, left);
    // reflect based on hit location - ball should go right after hitting left paddle
    reflectFromPaddle(ball, left.y, left.h, +1);
    if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
    // ensure no sticking (nudge slightly out)
    ball.x = left.x + left.w + ball.r + 0.5;
    // If the ball was touching top/bottom this frame, invert vy as well (corner case)
    if (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height) {
      ball.vy = -ball.vy;
    }
    // In corner cases the ball may also collide with top/bottom - re-check to clamp position
    bounceOffHorizontalEdge(ball, state.height);
  } else if (isCircleRectColliding(ball, right)) {
    const res = resolveCircleRectPenetration(ball, right);
    // reflect to left
    reflectFromPaddle(ball, right.y, right.h, -1);
    if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
    ball.x = right.x - ball.r - 0.5;
    if (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height) {
      ball.vy = -ball.vy;
    }
    bounceOffHorizontalEdge(ball, state.height);
  }
  // Scoring (ball exits left/right bounds)
  if (ball.x - ball.r <= 0) {
    state.score.right += 1;
    resetBall(ball, state.width / 2, state.height / 2);

    // Check for win condition
    if (state.score.right >= state.winScore) {
      state.gameOver = true;
      state.winner = 'right';
    } else {
      // Set serve delay (0.5 seconds)
      state.serveTimer = PHYSICS.SERVE_DELAY_SEC;
    }
  }

  if (ball.x + ball.r >= state.width) {
    state.score.left += 1;
    resetBall(ball, state.width / 2, state.height / 2);

    // Check for win condition
    if (state.score.left >= state.winScore) {
      state.gameOver = true;
      state.winner = 'left';
    } else {
      // Set serve delay (0.5 seconds)
      state.serveTimer = PHYSICS.SERVE_DELAY_SEC;
    }
  }
}

export function restartGame(state) {
  // Reset scores
  state.score.left = 0;
  state.score.right = 0;

  // Reset paddles to center
  state.paddles.left.y = state.height / 2;
  state.paddles.right.y = state.height / 2;

  // Reset ball to center
  resetBall(state.ball, state.width / 2, state.height / 2);

  // Clear game over state
  state.gameOver = false;
  state.winner = null;

  // Serve the ball after a brief delay
  state.serveTimer = PHYSICS.SERVE_DELAY_SEC;
}

export function serialize(state) {
  return JSON.stringify({
    width: state.width,
    height: state.height,
    score: state.score,
    paddles: state.paddles,
    ball: state.ball,
  });
}
