// src/game-state.js
// Minimal centralized state + update function stub

import { createPaddle, updatePaddle } from './paddle.js';
import { createBall, updateBall, bounceOffHorizontalEdge, resetBall, serveBall, reflectFromPaddle } from './ball.js';
import { isCircleRectColliding, resolveCircleRectPenetration } from './collision.js';
import { initCPU, updateCPU, setCPUDifficulty } from './ai.js';
import { CANVAS, PADDLE, BALL, GAME, AUDIO, PHYSICS, RUGBY } from './constants.js';
import { soundManager } from './sound.js';
import * as rugby from './rugby.js';

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
  let persistedRugby = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const s = window.localStorage.getItem('pong:settings');
      if (s) persistedSettings = JSON.parse(s);
      const h = window.localStorage.getItem('pong:highScore');
      if (h) persistedHigh = JSON.parse(h);
      const r = window.localStorage.getItem('pong:rugbySettings');
      if (r) persistedRugby = JSON.parse(r);
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
    trailLength: 5, // Number of trail positions (3-10)
    paddleSize: 1.0, // Paddle size multiplier (0.5x - 1.5x)
    endlessMode: false // Endless mode (no win condition)
  };
  const paddleHeight = PADDLE.DEFAULT_HEIGHT * ((persistedSettings && persistedSettings.paddleSize) || defaultSettings.paddleSize);
  const ballSpeed = BALL.DEFAULT_SPEED * ((persistedSettings && persistedSettings.ballSpeed) || defaultSettings.ballSpeed);

  return {
    width,
    height,
    score: { left: 0, right: 0 },
    paddles: {
      left: createPaddle(PADDLE.DEFAULT_X_OFFSET_LEFT, height / 2, PADDLE.DEFAULT_WIDTH, paddleHeight, PADDLE.DEFAULT_SPEED),
      right: createPaddle(width - PADDLE.DEFAULT_X_OFFSET_RIGHT, height / 2, PADDLE.DEFAULT_WIDTH, paddleHeight, PADDLE.DEFAULT_SPEED),
    },
    ball: createBall(width / 2, height / 2, BALL.DEFAULT_RADIUS, ballSpeed),
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

    // Stage 13: Animation state for visual polish
    transitions: {
      active: false,
      type: null, // 'fadeIn' | 'fadeOut'
      duration: 0.3, // seconds
      timer: 0,
      fromState: null,
      toState: null
    },
    buttonPressAnim: {
      active: false,
      buttonName: null,
      timer: 0,
      duration: 0.1 // seconds
    },
    scoreDisplay: {
      left: 0,
      right: 0,
      leftTarget: 0,
      rightTarget: 0,
      animSpeed: 10 // points per second
    },
    pauseAnim: {
      pulseTimer: 0,
      pulseSpeed: 2.0 // Hz
    },
    particles: [], // Array of particle objects: {x, y, vx, vy, life, maxLife, color}
    confetti: [], // Victory confetti array

    // Rugby mode state
    rugbyMode: {
      enabled: false,
      spin: 0,
      rallyCount: 0,
      multiplier: 1,
      goalPost: {
        active: false,
        x: 0,  // X position on field
        y: 0,
        width: RUGBY.GOAL_POST_WIDTH,
        height: RUGBY.GOAL_POST_HEIGHT,
        timer: 0,
        spawnTimer: RUGBY.GOAL_POST_SPAWN_MIN
      }
    },

    // Rugby settings
    rugbySettings: {
      targetScore: (persistedRugby && persistedRugby.targetScore) || RUGBY.DEFAULT_TARGET_SCORE,
      timeLimit: (persistedRugby && persistedRugby.timeLimit) || RUGBY.DEFAULT_TIME_LIMIT,
      elapsedTime: 0
    }

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
    const targetSpeed = baseSpeed * state.settings.ballSpeed;

    // Update the ball's speed property so future serves use the correct speed
    state.ball.speed = targetSpeed;

    // Also update current velocity if ball is moving
    const currentSpeed = Math.sqrt(state.ball.vx * state.ball.vx + state.ball.vy * state.ball.vy);
    if (currentSpeed > 0) {
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
  soundManager.setEnabled(enabled); // Update sound manager
  persistSettings(state);
}

export function setVolume(state, volume) {
  state.settings.volume = Math.max(AUDIO.VOLUME_MIN, Math.min(AUDIO.VOLUME_MAX, volume));
  soundManager.setVolume(state.settings.volume); // Update sound manager
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


export function setPaddleSize(state, multiplier) {
  const newSize = Math.max(PADDLE.SIZE_MULTIPLIER_MIN, Math.min(PADDLE.SIZE_MULTIPLIER_MAX, multiplier));
  state.settings.paddleSize = newSize;

  // Apply to current paddles if game is initialized
  if (state.paddles) {
    const baseHeight = PADDLE.DEFAULT_HEIGHT;
    const newHeight = baseHeight * newSize;
    state.paddles.left.h = newHeight;
    state.paddles.right.h = newHeight;
  }

  persistSettings(state);
}

export function setEndlessMode(state, enabled) {
  state.settings.endlessMode = enabled;
  // Update win score - use a very high number for endless mode
  state.winScore = enabled ? 999 : state.settings.winScore;
  persistSettings(state);
}

/**
 * Initialize rugby mode state and start game
 * @param {Object} state - Game state
 * @param {string} mode - 'rugby-single' or 'rugby-versus'
 */
export function startRugbyMode(state, mode) {
  console.log('[DEBUG] Starting Rugby mode...');
  state.gameMode = mode;
  state.rugbyMode.enabled = true;
  state.rugbyMode.spin = 0;
  state.rugbyMode.rallyCount = 0;
  state.rugbyMode.multiplier = 1;
  state.rugbyMode.goalPost.active = false;

  // Check if goal posts are disabled to prevent NaN
  if (RUGBY.GOAL_POST_SPAWN_MIN === Infinity) {
    state.rugbyMode.goalPost.spawnTimer = Infinity;
    console.log('[DEBUG] Goal posts disabled - spawnTimer set to Infinity');
  } else {
    state.rugbyMode.goalPost.spawnTimer = RUGBY.GOAL_POST_SPAWN_MIN +
      Math.random() * (RUGBY.GOAL_POST_SPAWN_MAX - RUGBY.GOAL_POST_SPAWN_MIN);
    console.log('[DEBUG] Goal post spawnTimer:', state.rugbyMode.goalPost.spawnTimer);
  }
  state.rugbySettings.elapsedTime = 0;

  // Initialize ball spin property
  state.ball.spin = 0;

  // Initialize CPU if single player
  if (mode === 'rugby-single') {
    initCPU(state, state.settings.difficulty);
  } else {
    state.cpu = { enabled: false };
  }

  // Reset and start game
  restartGame(state);
  startTransition(state, state.gameState, 'PLAYING');

  console.log('[Rugby] Mode started:', mode);
}

/**
 * Update rugby physics (called from main update loop)
 * @param {Object} state - Game state
 * @param {number} dt - Delta time in seconds
 */
export function updateRugbyPhysics(state, dt) {
  // Diagnostic logging
  const frameLog = Math.random() < 0.1; // Log 10% of frames to avoid spam
  if (frameLog) console.log('[DEBUG] updateRugbyPhysics START - dt:', dt);

  // Update paddle velocities for momentum calculations
  rugby.updatePaddleVelocity(state.paddles.left, dt);
  rugby.updatePaddleVelocity(state.paddles.right, dt);

  // Update spin decay
  rugby.updateSpin(state.ball, state.rugbyMode, dt);
  if (frameLog) console.log('[DEBUG] Spin after decay:', state.rugbyMode.spin);

  // Update ball visual rotation based on spin and velocity
  if (!state.ball.angle) state.ball.angle = 0;
  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  const rotationSpeed = state.rugbyMode.spin * 3.0; // radians per second from spin
  state.ball.angle += rotationSpeed * dt + (speed / 500) * dt; // Base rotation from movement

  if (frameLog) console.log('[DEBUG] Ball angle:', state.ball.angle, 'speed:', speed);

  // Update goal post system
  if (frameLog) console.log('[DEBUG] About to update goal post, spawnTimer:', state.rugbyMode.goalPost.spawnTimer);
  rugby.updateGoalPost(state, dt);
  if (frameLog) console.log('[DEBUG] Goal post updated, spawnTimer:', state.rugbyMode.goalPost.spawnTimer);

  // Update elapsed time
  state.rugbySettings.elapsedTime += dt;

  // Check time limit win condition
  if (state.rugbySettings.elapsedTime >= state.rugbySettings.timeLimit) {
    const winner = state.score.left > state.score.right ? 'left' :
      state.score.right > state.score.left ? 'right' : null;

    if (winner) {
      state.gameOver = true;
      state.winner = winner;
      soundManager.playWin();
      console.log('[Rugby] Time limit reached, winner:', winner);
    } else {
      // Tied - continue playing (overtime)
      console.log('[Rugby] Time limit reached, tied - continuing');
    }
  }
}

/**
 * Set rugby mode target score
 * @param {Object} state - Game state
 * @param {number} score - Target score (must be in RUGBY.TARGET_SCORES)
 */
export function setRugbyTargetScore(state, score) {
  if (!RUGBY.TARGET_SCORES.includes(score)) {
    console.warn('[Rugby] Invalid target score:', score);
    return;
  }

  state.rugbySettings.targetScore = score;
  persistRugbySettings(state);
  console.log('[Rugby] Target score set to', score);
}

/**
 * Set rugby mode time limit
 * @param {Object} state - Game state
 * @param {number} seconds - Time limit in seconds (must be in RUGBY.TIME_LIMITS)
 */
export function setRugbyTimeLimit(state, seconds) {
  if (!RUGBY.TIME_LIMITS.includes(seconds)) {
    console.warn('[Rugby] Invalid time limit:', seconds);
    return;
  }

  state.rugbySettings.timeLimit = seconds;
  persistRugbySettings(state);
  console.log('[Rugby] Time limit set to', seconds, 'seconds');
}

/**
 * Persist rugby settings to localStorage
 * @param {Object} state - Game state
 */
function persistRugbySettings(state) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const settings = JSON.stringify(state.rugbySettings);
      window.localStorage.setItem('pong:rugbySettings', settings);
    } catch (e) {
      console.warn('Failed to save rugby settings to localStorage:', e);
    }
  }
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


/**
 * Spawns particles at a given position
 * @param {Object} state - Game state
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} color - Particle color
 * @param {number} count - Number of particles to spawn
 */
export function spawnParticles(state, x, y, color = '#ffffff', count = 5) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5, // seconds
      maxLife: 0.5,
      color
    });
  }
}

/**
 * Spawns confetti for victory celebration
 * @param {Object} state - Game state
 * @param {number} count - Number of confetti pieces
 */
export function spawnConfetti(state, count = 100) {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
  for (let i = 0; i < count; i++) {
    state.confetti.push({
      x: state.width / 2,
      y: state.height / 2,
      vx: (Math.random() - 0.5) * 600,
      vy: (Math.random() - 0.5) * 600 - 100, // Slight upward bias
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 3 + Math.random() * 2 // Seconds
    });
  }
}

/**
 * Triggers a button press animation
 * @param {Object} state - Game state
 * @param {string} buttonName - Name of the button being pressed
 */
export function triggerButtonPress(state, buttonName) {
  state.buttonPressAnim.active = true;
  state.buttonPressAnim.buttonName = buttonName;
  state.buttonPressAnim.timer = state.buttonPressAnim.duration;
}

/**
 * Starts a fade transition between game states
 * @param {Object} state - Game state
 * @param {string} fromState - Current game state
 * @param {string} toState - Target game state
 */
export function startTransition(state, fromState, toState) {
  state.transitions.active = true;
  state.transitions.type = 'fadeOut';
  state.transitions.timer = state.transitions.duration;
  state.transitions.fromState = fromState;
  state.transitions.toState = toState;
}

export function showLanding(state) {
  startTransition(state, state.gameState, 'LANDING');
  state.showInstructions = false; // don't show instruction overlay on top of landing
  state.landingHover = null;

  // Reset rugby state when returning to landing
  if (state.rugbyMode) {
    state.rugbyMode.enabled = false;
    state.rugbyMode.spin = 0;
    state.rugbyMode.rallyCount = 0;
    state.rugbyMode.multiplier = 1;
    state.rugbyMode.goalPost.active = false;
    if (state.ball) state.ball.spin = 0;
  }
}

export function startPlaying(state, mode = 'versus') {
  state.gameMode = mode; // 'single' or 'versus'
  startTransition(state, state.gameState, 'PLAYING');
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
 * Updates all visual animation timers and states
 * @param {Object} state - Game state
 * @param {number} dt - Delta time in seconds
 */
function updateAnimations(state, dt) {
  // Update transition timer
  if (state.transitions.active) {
    state.transitions.timer -= dt;

    if (state.transitions.timer <= 0) {
      if (state.transitions.type === 'fadeOut') {
        // Switch to fade in
        state.transitions.type = 'fadeIn';
        state.transitions.timer = state.transitions.duration;
        // Actually change the state
        state.gameState = state.transitions.toState;
      } else {
        // Transition complete
        state.transitions.active = false;
        state.transitions.type = null;
      }
    }
  }

  // Update button press animation
  if (state.buttonPressAnim.active) {
    state.buttonPressAnim.timer -= dt;
    if (state.buttonPressAnim.timer <= 0) {
      state.buttonPressAnim.active = false;
      state.buttonPressAnim.buttonName = null;
    }
  }

  // Update score display lerping
  if (state.scoreDisplay.leftTarget !== state.score.left) {
    state.scoreDisplay.leftTarget = state.score.left;
  }
  if (state.scoreDisplay.rightTarget !== state.score.right) {
    state.scoreDisplay.rightTarget = state.score.right;
  }

  // Lerp displayed scores toward targets
  const lerpSpeed = state.scoreDisplay.animSpeed * dt;
  if (state.scoreDisplay.left < state.scoreDisplay.leftTarget) {
    state.scoreDisplay.left = Math.min(state.scoreDisplay.left + lerpSpeed, state.scoreDisplay.leftTarget);
  }
  if (state.scoreDisplay.right < state.scoreDisplay.rightTarget) {
    state.scoreDisplay.right = Math.min(state.scoreDisplay.right + lerpSpeed, state.scoreDisplay.rightTarget);
  }

  // Update pause pulse animation
  state.pauseAnim.pulseTimer += dt;

  // Update particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt; // Gravity
    p.life -= dt;

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  // Update confetti
  if (state.confetti) {
    for (let i = state.confetti.length - 1; i >= 0; i--) {
      const p = state.confetti[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // Gravity
      p.life -= dt;

      if (p.life <= 0) {
        state.confetti.splice(i, 1);
      }
    }
  }
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
  // Update animations (always run, even when paused or on other screens)
  updateAnimations(state, dt);

  // Update rugby physics if enabled (before regular game logic)
  if (state.rugbyMode?.enabled && state.gameState === 'PLAYING' && !state.paused && !state.gameOver) {
    updateRugbyPhysics(state, dt);
  }

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
  if (wallBounce) {
    if (state.settings.ballFlash) state.ballFlashTimer = 0.1; // 100ms flash
    soundManager.playWallBounce(); // Sound effect for wall bounce
    // Spawn particles at wall collision
    const wallY = ball.y < state.height / 2 ? 0 : state.height;
    spawnParticles(state, ball.x, wallY, '#ffffff', 3);
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
      // Rugby mode: calculate spin and apply momentum before reflection
      if (state.rugbyMode?.enabled) {
        const hitOffset = (ball.y - left.y) / (left.h / 2); // -1 to +1
        state.rugbyMode.spin = rugby.calculateSpinGain(left.velocity || 0, hitOffset, state.rugbyMode.spin);
        rugby.applyMomentumImpact(ball, left, hitOffset);
        rugby.updateRallyMultiplier(state);
      }

      // reflect based on hit location - ball should go right after hitting left paddle
      reflectFromPaddle(ball, left.y, left.h, +1, 50, 0.05, state.rugbyMode?.spin || 0);

      if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
      soundManager.playPaddleHit(); // Sound effect for paddle hit
      // Spawn particles at paddle collision
      spawnParticles(state, left.x + left.w, ball.y, '#00ff88', 4);
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
      // Rugby mode: calculate spin and apply momentum before reflection
      if (state.rugbyMode?.enabled) {
        const hitOffset = (ball.y - right.y) / (right.h / 2); // -1 to +1
        state.rugbyMode.spin = rugby.calculateSpinGain(right.velocity || 0, hitOffset, state.rugbyMode.spin);
        rugby.applyMomentumImpact(ball, right, hitOffset);
        rugby.updateRallyMultiplier(state);
      }

      reflectFromPaddle(ball, right.y, right.h, -1, 50, 0.05, state.rugbyMode?.spin || 0);

      if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
      soundManager.playPaddleHit(); // Sound effect for paddle hit
      // Spawn particles at paddle collision
      spawnParticles(state, right.x, ball.y, '#00ff88', 4);
    }
    ball.x = right.x - ball.r;
    bounceOffHorizontalEdge(ball, state.height);
  } else if (isCircleRectColliding(ball, left)) {
    // positional correction
    const res = resolveCircleRectPenetration(ball, left);

    // Rugby mode: calculate spin and apply momentum before reflection
    if (state.rugbyMode?.enabled) {
      const hitOffset = (ball.y - left.y) / (left.h / 2);
      state.rugbyMode.spin = rugby.calculateSpinGain(left.velocity || 0, hitOffset, state.rugbyMode.spin);
      rugby.applyMomentumImpact(ball, left, hitOffset);
      rugby.updateRallyMultiplier(state);
    }

    // reflect based on hit location - ball should go right after hitting left paddle
    reflectFromPaddle(ball, left.y, left.h, +1, 50, 0.05, state.rugbyMode?.spin || 0);

    if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
    soundManager.playPaddleHit(); // Sound effect for paddle hit
    // Spawn particles at paddle collision
    spawnParticles(state, left.x + left.w, ball.y, '#00ff88', 4);
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

    // Rugby mode: calculate spin and apply momentum before reflection
    if (state.rugbyMode?.enabled) {
      const hitOffset = (ball.y - right.y) / (right.h / 2);
      state.rugbyMode.spin = rugby.calculateSpinGain(right.velocity || 0, hitOffset, state.rugbyMode.spin);
      rugby.applyMomentumImpact(ball, right, hitOffset);
      rugby.updateRallyMultiplier(state);
    }

    // reflect to left
    reflectFromPaddle(ball, right.y, right.h, -1, 50, 0.05, state.rugbyMode?.spin || 0);

    if (state.settings.ballFlash) state.ballFlashTimer = 0.1;
    soundManager.playPaddleHit(); // Sound effect for paddle hit
    // Spawn particles at paddle collision
    spawnParticles(state, right.x, ball.y, '#00ff88', 4);
    ball.x = right.x - ball.r - 0.5;
    if (ball.prevY - ball.r <= 0 || ball.prevY + ball.r >= state.height || ball.y - ball.r <= 0 || ball.y + ball.r >= state.height) {
      ball.vy = -ball.vy;
    }
    bounceOffHorizontalEdge(ball, state.height);
  }
  // Scoring (ball exits left/right bounds)
  if (ball.x - ball.r <= 0) {
    // Check for goal post hit
    let goalPostHit = false;
    if (state.rugbyMode?.enabled) {
      goalPostHit = rugby.checkGoalPostHit(state, ball);
      if (goalPostHit) {
        state.rugbyMode.goalPost.active = false; // Despawn goal post
        console.log('[Rugby] GOAL POST HIT!');
      }
    }

    // Calculate score with multiplier and goal post bonus
    const points = state.rugbyMode?.enabled
      ? rugby.calculateScore(1, state.rugbyMode.multiplier, goalPostHit)
      : 1;

    state.score.right += points;

    // Reset rally if rugby mode
    if (state.rugbyMode?.enabled) {
      rugby.resetRally(state);
    }

    resetBall(ball, state.width / 2, state.height / 2);

    // Check for win condition
    const winScore = state.rugbyMode?.enabled
      ? state.rugbySettings.targetScore
      : state.winScore;

    if (state.score.right >= winScore) {
      state.gameOver = true;
      state.winner = 'right';
      spawnConfetti(state, 150);
      soundManager.playWin(); // Sound effect for winning
    } else {
      soundManager.playScore(); // Sound effect for scoring
      // Set serve delay (0.5 seconds)
      state.serveTimer = PHYSICS.SERVE_DELAY_SEC;
    }
  }

  if (ball.x + ball.r >= state.width) {
    // Check for goal post hit
    let goalPostHit = false;
    if (state.rugbyMode?.enabled) {
      goalPostHit = rugby.checkGoalPostHit(state, ball);
      if (goalPostHit) {
        state.rugbyMode.goalPost.active = false; // Despawn goal post
        console.log('[Rugby] GOAL POST HIT!');
      }
    }

    // Calculate score with multiplier and goal post bonus
    const points = state.rugbyMode?.enabled
      ? rugby.calculateScore(1, state.rugbyMode.multiplier, goalPostHit)
      : 1;

    state.score.left += points;

    // Reset rally if rugby mode
    if (state.rugbyMode?.enabled) {
      rugby.resetRally(state);
    }

    resetBall(ball, state.width / 2, state.height / 2);

    // Check for win condition
    const winScore = state.rugbyMode?.enabled
      ? state.rugbySettings.targetScore
      : state.winScore;

    if (state.score.left >= winScore) {
      state.gameOver = true;
      state.winner = 'left';
      spawnConfetti(state, 150);
      soundManager.playWin(); // Sound effect for winning
    } else {
      soundManager.playScore(); // Sound effect for scoring
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
  state.confetti = [];

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
