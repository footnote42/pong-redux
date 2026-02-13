# Rugby Ball Mode Design

**Date:** 2026-02-13
**Status:** Approved
**Approach:** Arcade-Style Hybrid (fun gameplay over physics simulation)

---

## Overview

Rugby Ball Mode is a new dedicated game mode for Pong Redux featuring:
- Oval rugby ball with realistic rotation animation
- Momentum-based paddle impacts that transfer spin
- Rally-based combo scoring system with multipliers
- Dynamic goal post zones for bonus points
- Hybrid win conditions (target score OR time limit)

This mode prioritizes fun, arcade-perfect gameplay over realistic physics simulation while maintaining the existing architecture and fixed-timestep game loop.

---

## Design Philosophy

**Core Principles:**
1. **Fun over simulation** - Stylized rugby physics, not accurate simulation
2. **Visual clarity** - Spin and momentum are clearly visible through rotation and effects
3. **Skill expression** - Momentum-based hits reward timing and paddle control
4. **Dynamic gameplay** - Goal posts and rally combos create exciting risk/reward moments
5. **Maintainability** - Leverage existing architecture (AABB collision, fixed timestep)

---

## 1. Architecture

### Mode Structure

Rugby Mode is a **separate dedicated game mode** alongside Single Player and Versus:
- Accessible from landing screen with its own button
- Supports both 1P (vs CPU) and 2P gameplay
- CPU AI enhanced to handle unpredictable bounces
- Completely optional - regular pong modes unaffected

### State Extensions

Add to game state (`src/game-state.js`):

```javascript
{
  gameMode: 'single' | 'versus' | 'rugby-single' | 'rugby-versus',

  rugbyMode: {
    enabled: false,
    spin: 0,              // Current spin value (-1 to +1)
    rallyCount: 0,        // Consecutive hits without scoring
    multiplier: 1,        // Current scoring multiplier (1x-5x)
    goalPost: {
      active: false,
      y: 0,               // Vertical position (center)
      height: 120,        // Zone height (20% of screen, ~120px)
      timer: 0,           // Time until disappears (5s)
      spawnTimer: 10      // Time until next spawn (8-12s random)
    }
  },

  rugbySettings: {
    targetScore: 50,      // Win score: [25, 50, 75, 100]
    timeLimit: 180,       // Time limit in seconds: [120, 180, 300, 600]
    elapsedTime: 0        // Current elapsed time
  }
}
```

### Module Organization

**New Module:**
- `src/rugby.js` - Rugby-specific physics and logic

**Extended Modules:**
- `src/renderer.js` - Rugby ball rendering (oval + rotation)
- `src/game-state.js` - Rugby mode initialization and update
- `src/input.js` - Track paddle velocity for momentum

**Unchanged Modules:**
- `src/collision.js` - Stays AABB circle-rect (no changes needed)
- `src/ball.js` - Standard ball physics still used
- `src/paddle.js` - Standard paddle behavior

### Backward Compatibility

- Rugby mode completely optional
- Regular pong modes unaffected
- Settings persist separately (`pong:rugbySettings` in localStorage)
- No breaking changes to existing code

---

## 2. Components

### New Module: src/rugby.js

**Purpose:** Encapsulates all rugby-specific physics and logic

#### Spin Management

```javascript
/**
 * Calculate spin gain from paddle hit
 * @param {number} paddleVelocity - Paddle Y velocity (px/s)
 * @param {number} hitOffset - Hit position relative to paddle center (-1 to +1)
 * @param {number} currentSpin - Current ball spin value
 * @returns {number} New spin value (clamped to [-1, +1])
 */
function calculateSpinGain(paddleVelocity, hitOffset, currentSpin) {
  // Spin gain proportional to paddle speed and hit offset
  // Fast upward paddle motion + top hit = positive spin
  const spinGain = (paddleVelocity / PADDLE.DEFAULT_SPEED) * hitOffset * 0.5;
  const newSpin = currentSpin + spinGain;
  return Math.max(-1, Math.min(1, newSpin)); // Clamp to [-1, +1]
}

/**
 * Apply spin decay over time (gradual reduction)
 * @param {Object} ball - Ball object with spin property
 * @param {number} dt - Delta time in seconds
 */
function updateSpin(ball, dt) {
  // Decay spin by 2% per second (0.98 multiplier)
  ball.spin *= Math.pow(0.98, dt);

  // Snap to zero when very small (avoid floating point drift)
  if (Math.abs(ball.spin) < 0.01) {
    ball.spin = 0;
  }
}

/**
 * Add randomness to bounce angle based on spin magnitude
 * @param {Object} ball - Ball object
 * @param {number} baseBounceAngle - Standard bounce angle in radians
 * @param {number} spin - Current spin value (-1 to +1)
 * @returns {number} Modified bounce angle in radians
 */
function applySpinToBounce(ball, baseBounceAngle, spin) {
  // Spin affects bounce by ±5-20 degrees
  const maxVariance = (20 * Math.PI) / 180; // 20 degrees in radians
  const variance = spin * maxVariance; // Proportional to spin magnitude
  return baseBounceAngle + variance;
}
```

#### Momentum-Based Hits

```javascript
/**
 * Track paddle velocity each frame
 * @param {Object} paddle - Paddle object
 * @param {number} dt - Delta time in seconds
 */
function updatePaddleVelocity(paddle, dt) {
  if (!paddle.prevY) paddle.prevY = paddle.y;
  paddle.velocity = (paddle.y - paddle.prevY) / dt;
  paddle.prevY = paddle.y;
}

/**
 * Apply momentum to ball speed on collision
 * @param {Object} ball - Ball object
 * @param {Object} paddle - Paddle object with velocity
 * @param {number} hitOffset - Hit position relative to paddle center
 */
function applyMomentumImpact(ball, paddle, hitOffset) {
  // Calculate current ball speed
  const currentSpeed = Math.hypot(ball.vx, ball.vy);

  // Momentum multiplier based on paddle velocity
  // Fast paddle (300 px/s) gives 1.3x speed boost
  const momentumFactor = 1.0 + Math.abs(paddle.velocity) / 1000;
  const newSpeed = Math.min(currentSpeed * momentumFactor, BALL.DEFAULT_SPEED * 2.5);

  // Apply new speed while preserving angle
  const angle = Math.atan2(ball.vy, ball.vx);
  ball.vx = Math.cos(angle) * newSpeed;
  ball.vy = Math.sin(angle) * newSpeed;

  // Add spin based on paddle velocity and hit offset
  ball.spin = calculateSpinGain(paddle.velocity, hitOffset, ball.spin);
}
```

#### Goal Post System

```javascript
/**
 * Update goal post timers and spawn new posts
 * @param {Object} state - Game state
 * @param {number} dt - Delta time in seconds
 */
function updateGoalPost(state, dt) {
  const gp = state.rugbyMode.goalPost;

  if (gp.active) {
    // Countdown active goal post
    gp.timer -= dt;
    if (gp.timer <= 0) {
      gp.active = false;
      gp.spawnTimer = 8 + Math.random() * 4; // 8-12s random
    }
  } else {
    // Countdown until next spawn
    gp.spawnTimer -= dt;
    if (gp.spawnTimer <= 0) {
      spawnGoalPost(state);
    }
  }
}

/**
 * Spawn a new goal post at random vertical position
 * @param {Object} state - Game state
 */
function spawnGoalPost(state) {
  const gp = state.rugbyMode.goalPost;
  const padding = BALL.DEFAULT_RADIUS * 2;
  const minY = gp.height / 2 + padding;
  const maxY = state.height - gp.height / 2 - padding;

  gp.active = true;
  gp.y = minY + Math.random() * (maxY - minY);
  gp.timer = 5.0; // 5 second duration
}

/**
 * Check if ball passes through goal post zone
 * @param {Object} ball - Ball object
 * @param {Object} goalPost - Goal post object
 * @returns {boolean} True if ball passed through zone
 */
function checkGoalPostHit(ball, goalPost) {
  if (!goalPost.active) return false;

  // Check if ball center is within goal post vertical zone
  const inZone = Math.abs(ball.y - goalPost.y) <= goalPost.height / 2;

  // Check if ball just crossed the scoring boundary (left or right edge)
  const crossedBoundary = (ball.x - ball.r <= 0) || (ball.x + ball.r >= state.width);

  return inZone && crossedBoundary;
}

/**
 * Calculate bonus points for goal post hit
 * @param {number} multiplier - Current rally multiplier
 * @returns {number} Bonus points to award
 */
function calculateGoalPostBonus(multiplier) {
  return 10 * multiplier; // Base 10 points × multiplier
}
```

#### Rally & Scoring

```javascript
/**
 * Increment rally count and update multiplier
 * @param {Object} state - Game state
 */
function updateRallyMultiplier(state) {
  const rm = state.rugbyMode;
  rm.rallyCount++;

  // Update multiplier based on thresholds
  if (rm.rallyCount >= 10) {
    rm.multiplier = 5;
  } else if (rm.rallyCount >= 6) {
    rm.multiplier = 3;
  } else if (rm.rallyCount >= 3) {
    rm.multiplier = 2;
  } else {
    rm.multiplier = 1;
  }
}

/**
 * Reset rally on score
 * @param {Object} state - Game state
 */
function resetRally(state) {
  state.rugbyMode.rallyCount = 0;
  state.rugbyMode.multiplier = 1;
}

/**
 * Calculate final score with multiplier and goal post bonus
 * @param {number} basePoints - Base points (usually 1)
 * @param {number} multiplier - Current multiplier
 * @param {boolean} goalPostHit - Whether goal post was hit
 * @returns {number} Total points to award
 */
function calculateScore(basePoints, multiplier, goalPostHit) {
  let total = basePoints * multiplier;
  if (goalPostHit) {
    total += calculateGoalPostBonus(multiplier);
  }
  return total;
}
```

### Extended Modules

#### src/renderer.js additions

```javascript
/**
 * Draw rugby ball with oval shape and rotation
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} ball - Ball object with x, y, r, spin properties
 */
function drawRugbyBall(ctx, ball) {
  ctx.save();

  // Move to ball position and rotate based on spin
  ctx.translate(ball.x, ball.y);
  const rotationSpeed = ball.spin * 5; // Spin affects rotation speed
  const rotation = (Date.now() / 1000) * rotationSpeed; // Time-based rotation
  ctx.rotate(rotation);

  // Draw oval (ellipse)
  ctx.beginPath();
  ctx.ellipse(0, 0, ball.r * 1.8, ball.r, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8B4513'; // Brown rugby ball color
  ctx.fill();

  // Draw stitching pattern
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-ball.r * 1.2, 0);
  ctx.lineTo(ball.r * 1.2, 0);
  ctx.stroke();

  // Draw cross-stitches
  for (let i = -3; i <= 3; i++) {
    const x = i * (ball.r * 0.4);
    ctx.beginPath();
    ctx.moveTo(x, -ball.r * 0.3);
    ctx.lineTo(x, ball.r * 0.3);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw goal post zone with pulsing effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} goalPost - Goal post object
 * @param {number} canvasWidth - Canvas width
 */
function drawGoalPost(ctx, goalPost) {
  if (!goalPost.active) return;

  // Pulsing effect based on timer
  const pulse = 0.7 + 0.3 * Math.sin(goalPost.timer * Math.PI * 2);

  // Draw on both scoring boundaries (left and right)
  ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.3})`; // Golden with alpha
  ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
  ctx.lineWidth = 3;

  const y = goalPost.y - goalPost.height / 2;
  const h = goalPost.height;

  // Left boundary goal post
  ctx.fillRect(0, y, 10, h);
  ctx.strokeRect(0, y, 10, h);

  // Right boundary goal post
  ctx.fillRect(canvasWidth - 10, y, 10, h);
  ctx.strokeRect(canvasWidth - 10, y, 10, h);
}

/**
 * Draw rugby mode UI (multiplier, rally count, timer)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} state - Game state
 */
function drawRugbyUI(ctx, state) {
  const rm = state.rugbyMode;
  const rs = state.rugbySettings;

  // Draw multiplier (top center)
  ctx.fillStyle = '#FFD700'; // Gold
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${rm.multiplier}x MULTIPLIER`, state.width / 2, 40);

  // Draw rally count
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px monospace';
  ctx.fillText(`Rally: ${rm.rallyCount}`, state.width / 2, 65);

  // Draw timer (top right)
  const timeRemaining = rs.timeLimit - rs.elapsedTime;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  ctx.textAlign = 'right';
  ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, state.width - 20, 40);

  // Draw goal post countdown if active
  if (rm.goalPost.active) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Goal Post: ${rm.goalPost.timer.toFixed(1)}s`, state.width - 20, 65);
  }
}
```

#### src/game-state.js additions

```javascript
/**
 * Initialize rugby mode state
 * @param {Object} state - Game state
 * @param {string} mode - 'rugby-single' or 'rugby-versus'
 */
export function startRugbyMode(state, mode) {
  state.gameMode = mode;
  state.rugbyMode.enabled = true;
  state.rugbyMode.spin = 0;
  state.rugbyMode.rallyCount = 0;
  state.rugbyMode.multiplier = 1;
  state.rugbyMode.goalPost.active = false;
  state.rugbyMode.goalPost.spawnTimer = 8 + Math.random() * 4;
  state.rugbySettings.elapsedTime = 0;

  // Initialize CPU if single player
  if (mode === 'rugby-single') {
    initCPU(state, state.settings.difficulty);
  }

  // Reset and start game
  restartGame(state);
  startTransition(state, state.gameState, 'PLAYING');
}

/**
 * Update rugby physics (called from main update loop)
 * @param {Object} state - Game state
 * @param {number} dt - Delta time in seconds
 */
export function updateRugbyPhysics(state, dt) {
  // Update paddle velocities for momentum calculations
  updatePaddleVelocity(state.paddles.left, dt);
  updatePaddleVelocity(state.paddles.right, dt);

  // Update spin decay
  updateSpin(state.ball, dt);

  // Update goal post system
  updateGoalPost(state, dt);

  // Update elapsed time
  state.rugbySettings.elapsedTime += dt;

  // Check time limit win condition
  if (state.rugbySettings.elapsedTime >= state.rugbySettings.timeLimit) {
    const winner = state.score.left > state.score.right ? 'left' : 'right';
    state.gameOver = true;
    state.winner = winner;
  }
}

// Settings functions
export function setRugbyTargetScore(state, score) {
  state.rugbySettings.targetScore = score;
  persistRugbySettings(state);
}

export function setRugbyTimeLimit(state, seconds) {
  state.rugbySettings.timeLimit = seconds;
  persistRugbySettings(state);
}

function persistRugbySettings(state) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('pong:rugbySettings', JSON.stringify(state.rugbySettings));
    } catch (e) {
      console.warn('Failed to save rugby settings:', e);
    }
  }
}
```

---

## 3. Data Flow

### Game Loop Integration

The fixed-timestep loop (60Hz) remains unchanged, but `update()` branches based on game mode:

```
Fixed Timestep (60Hz)
    ↓
update(state, dt)
    ↓
[Is Rugby Mode Enabled?]
    ├─No──→ Regular Pong Update (existing code)
    │
    ├─Yes─→ Rugby Mode Update:
    │        ↓
    │       Update Paddle Velocities
    │        ↓
    │       Update Ball Position (standard)
    │        ↓
    │       Update Spin Decay
    │        ↓
    │       Update Goal Post Timers/Spawning
    │        ↓
    │       Update Elapsed Time
    │        ↓
    │       Check Collisions (standard AABB)
    │        ↓
    │      [Ball-Paddle Collision?]
    │        ├─Yes─→ Apply Momentum Impact
    │        │        ↓
    │        │       Calculate Spin Gain
    │        │        ↓
    │        │       Apply Spin to Bounce Angle
    │        │        ↓
    │        │       Increment Rally Count
    │        │        ↓
    │        │       Update Multiplier
    │        │
    │      [Ball-Wall Collision?]
    │        ├─Yes─→ Apply Spin Randomness
    │        │        ↓
    │        │       Reduce Spin (friction)
    │        │
    │      [Ball Passes Goal Post Zone?]
    │        ├─Yes─→ Award Bonus Points
    │        │        ↓
    │        │       Play Special Effect
    │        │        ↓
    │        │       Despawn Goal Post
    │        │
    │      [Ball Exits Bounds?]
    │        ├─Yes─→ Calculate Score × Multiplier
    │        │        ↓
    │        │       Award Points to Opponent
    │        │        ↓
    │        │       Reset Rally & Multiplier
    │        │        ↓
    │        │       Check Win Condition
    │        │        ├─ Target Score Reached?
    │        │        └─ Time Limit Reached?
    │        │        ↓
    │        │       Reset Ball & Serve
```

### Rally System State Flow

```
Rally Count:  0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11+
Multiplier:   1x  1x  1x  2x  2x  2x  3x  3x  3x  3x  5x   5x

Thresholds:
  - 3 hits  → 2x multiplier
  - 6 hits  → 3x multiplier
  - 10 hits → 5x multiplier (max)

On Score Event:
  - Rally Count → 0
  - Multiplier → 1x
  - Points awarded = basePoints × multiplier (+ goal post bonus if applicable)
```

### Goal Post Lifecycle

```
[Inactive State]
     ↓
  spawnTimer counting down (8-12s random)
     ↓
  Timer expires
     ↓
[Active State]
     ↓
  Spawn at random Y position
  Timer = 5 seconds
     ↓
  ┌─────────────────┬─────────────────┐
  │ Ball hits zone  │  Timer expires  │
  │ during scoring  │  (5s elapsed)   │
  └─────────────────┴─────────────────┘
     ↓                     ↓
[Award Bonus]         [Despawn]
     ↓                     ↓
  Despawn Goal Post       │
     ↓                     │
  spawnTimer = 8-12s ←────┘
     ↓
[Inactive State]
```

### Win Condition Check

```
Every Frame During Rugby Mode:

Check Score-Based Win:
  if (score.left >= targetScore) → Left Wins
  if (score.right >= targetScore) → Right Wins

Check Time-Based Win:
  if (elapsedTime >= timeLimit) → Higher Score Wins
    if (score.left > score.right) → Left Wins
    if (score.right > score.left) → Right Wins
    if (score.left === score.right) → Overtime (continue playing)
```

---

## 4. Error Handling & Edge Cases

### Physics Edge Cases

**1. Extreme Spin Values:**
- **Problem:** Spin could accumulate infinitely, making ball uncontrollable
- **Solution:** Clamp spin to [-1, +1] range in `calculateSpinGain()`
- **Additional:** Gradual decay (0.98 multiplier per second) naturally reduces spin
- **Safeguard:** Snap to zero when `|spin| < 0.01` to prevent floating-point drift

**2. Momentum Overflow:**
- **Problem:** Multiple fast paddle hits could make ball impossibly fast
- **Solution:** Cap ball speed at 2.5x base speed (500 px/s max) in `applyMomentumImpact()`
- **Rationale:** Maintains playability while allowing satisfying speed boosts

**3. Simultaneous Collisions:**
- **Problem:** Ball could hit wall + paddle in same frame
- **Solution:** Existing corner-case handling already works (src/game-state.js:530-543)
- **Order:** Resolve standard collision → Apply spin variance → Clamp to bounds
- **No changes needed:** Rugby spin is applied after existing collision resolution

**4. Goal Post Spawning:**
- **Problem:** Goal post could spawn too close to top/bottom edges
- **Solution:** Padding of 2× ball radius from edges in `spawnGoalPost()`
- **Additional:** Only one goal post active at a time (prevents overwhelming gameplay)
- **Edge case:** If ball passes through during serve delay, don't award bonus (check if ball is moving)

### State Management Issues

**1. Mode Switching:**
- **Problem:** Rugby state could persist when switching to regular pong
- **Solution:** Reset rugby state in `showLanding()` function:
  ```javascript
  state.rugbyMode.enabled = false;
  state.rugbyMode.spin = 0;
  state.rugbyMode.rallyCount = 0;
  state.rugbyMode.multiplier = 1;
  state.rugbyMode.goalPost.active = false;
  ```
- **Preserve:** Regular settings (difficulty, ball speed) remain unchanged

**2. Settings Persistence:**
- **Problem:** Invalid or missing settings could break rugby mode
- **Solution:** Store separately in `localStorage` with validation:
  ```javascript
  const defaultRugbySettings = {
    targetScore: 50,
    timeLimit: 180
  };

  try {
    const saved = JSON.parse(localStorage.getItem('pong:rugbySettings'));
    const valid = [25, 50, 75, 100].includes(saved.targetScore) &&
                  [120, 180, 300, 600].includes(saved.timeLimit);
    rugbySettings = valid ? saved : defaultRugbySettings;
  } catch (e) {
    rugbySettings = defaultRugbySettings;
  }
  ```

**3. Timer Synchronization:**
- **Problem:** Timer could drift if using wall-clock time
- **Solution:** Use same `dt` as physics (from fixed timestep accumulator)
- **Benefit:** Ensures timer accuracy and pause handling is consistent
- **Pause:** Elapsed time only increments when `!state.paused && !state.gameOver`

### Gameplay Balance Safeguards

**1. Rally Multiplier Cap:**
- **Problem:** Infinite multiplier makes comebacks impossible
- **Solution:** Cap at 5x (reached at 10 consecutive hits)
- **Rationale:** 5x feels rewarding but still allows competitive matches
- **Reset:** On every score (not on serve), ensuring both players start even

**2. Goal Post Spawn Rate:**
- **Problem:** Predictable timing could be exploited
- **Solution:** Random interval (8-12 seconds) between spawns
- **Duration:** 5 seconds active (reasonable opportunity without being too easy)
- **Pause:** Spawn timer pauses during serve delay (prevents spawning when ball isn't moving)

**3. CPU AI Adaptation:**
- **Problem:** CPU could be too good/bad at handling spin
- **Solution:** Add randomness to CPU prediction in `ai.js`:
  ```javascript
  // CPU tracks ball with slight error to handle unpredictable bounces
  const spinError = ball.spin * 20; // ±20px error based on spin
  const targetY = ball.y + (Math.random() - 0.5) * spinError;
  ```
- **Balance:** CPU focuses on defense, ignores goal posts (prevents unfair advantage)

### Fallback Mechanisms

**1. Module Loading:**
- **Problem:** Rugby module could fail to load
- **Solution:** Wrap rugby mode initialization in try-catch:
  ```javascript
  try {
    import('./rugby.js').then(module => {
      rugbyModule = module;
      enableRugbyModeButton();
    });
  } catch (e) {
    console.warn('Rugby mode unavailable:', e);
    disableRugbyModeButton();
  }
  ```

**2. Rendering Fallback:**
- **Problem:** Rugby ball rendering could fail on older browsers
- **Solution:** Fallback to classic ball if ellipse() not supported:
  ```javascript
  function drawRugbyBall(ctx, ball) {
    try {
      // Attempt rugby ball rendering
      ctx.ellipse(...);
    } catch (e) {
      // Fallback to circular ball
      drawClassicBall(ctx, ball);
    }
  }
  ```

**3. Error Boundary:**
- **Problem:** Rugby mode bug could crash entire game
- **Solution:** Wrap rugby update in try-catch with automatic disable:
  ```javascript
  try {
    if (state.rugbyMode.enabled) {
      updateRugbyPhysics(state, dt);
    }
  } catch (e) {
    console.error('Rugby mode error, disabling:', e);
    state.rugbyMode.enabled = false;
    showLanding(state); // Return to menu
  }
  ```

---

## 5. Testing Strategy

### Unit Testing (Manual)

**Rugby Physics Module (`src/rugby.js`):**
1. **Spin Calculations:**
   - Test with paddle velocity 0, 150, 300 px/s (min, mid, max)
   - Test with hit offsets -1, 0, +1 (bottom, center, top)
   - Verify spin stays within [-1, +1] bounds
   - Test spin decay: spin 1.0 should decay to ~0.82 after 10 seconds

2. **Momentum Impact:**
   - Test with stationary paddle (velocity 0) → ball speed unchanged
   - Test with fast paddle (velocity 300) → ball speed increases ~30%
   - Verify ball speed cap at 500 px/s (2.5x base speed)
   - Test hit offset affects spin magnitude

3. **Bounce Angle Variance:**
   - Test with spin 0 → no variance (standard bounce)
   - Test with spin 1.0 → max +20° variance
   - Test with spin -1.0 → max -20° variance
   - Verify variance is proportional to spin magnitude

**Goal Post System:**
1. **Spawn Mechanics:**
   - Test spawn timer randomization (8-12s range)
   - Verify spawn position has proper padding from edges
   - Confirm only one goal post active at a time

2. **Collision Detection:**
   - Test ball passing through center of zone → hit detected
   - Test ball passing above zone → no hit
   - Test ball passing below zone → no hit
   - Test ball hitting zone during serve delay → no bonus

3. **Bonus Calculation:**
   - Test with 1x multiplier → 10 points
   - Test with 5x multiplier → 50 points
   - Verify bonus adds to base score correctly

**Rally & Scoring:**
1. **Multiplier Progression:**
   - Start at 0 hits → 1x multiplier
   - After 3 hits → 2x multiplier
   - After 6 hits → 3x multiplier
   - After 10 hits → 5x multiplier
   - After 20 hits → still 5x (cap verified)

2. **Reset Behavior:**
   - Score event → rally count = 0, multiplier = 1x
   - Verify both players start with equal multiplier after score

3. **Score Calculation:**
   - 1 point × 3x multiplier = 3 points
   - 1 point × 5x multiplier + goal post = 55 points (1×5 + 10×5)

### Integration Testing

**1. Game Flow:**
- Launch rugby mode from landing screen
- Verify state transitions: LANDING → PLAYING
- Play full match to target score (e.g., 50 points)
- Verify win condition triggers correctly
- Return to landing screen, confirm rugby state is reset
- Start regular pong mode, verify no rugby behavior present

**2. Settings Persistence:**
- Change target score to 75
- Change time limit to 5 minutes
- Refresh page
- Verify settings persist correctly
- Clear localStorage
- Verify defaults restore (50 points, 3 minutes)

**3. Visual Rendering:**
- Verify rugby ball oval shape renders
- Confirm ball rotates faster with higher spin
- Test goal post zone renders with pulsing effect
- Verify multiplier and rally count display correctly
- Confirm timer counts down accurately (visual check)

**4. Mode Transitions:**
- Switch from regular pong to rugby mode mid-game
- Verify game state resets properly
- Switch back to regular pong
- Confirm rugby physics are disabled

### Gameplay Testing

**1. Balance Testing:**
- Play 5 matches at each target score (25, 50, 75, 100)
- Verify matches feel appropriately paced:
  - 25 points: ~2-3 minutes
  - 50 points: ~5-7 minutes
  - 75 points: ~8-10 minutes
  - 100 points: ~12-15 minutes
- Test comeback scenarios (player behind by 20+ points)
- Confirm comeback is possible but challenging

**2. Physics Feel:**
- Test spin adds variety without being chaotic
- Verify fast paddle swipes produce visible spin increase
- Confirm bounces feel unpredictable but not random
- Test that spin is visually clear (player can see rotation)
- Verify momentum impacts feel satisfying

**3. Goal Post Gameplay:**
- Attempt to hit goal posts intentionally
- Verify goal posts are hittable but require aim
- Confirm hitting goal post feels rewarding (visual/audio feedback)
- Test if goal posts create interesting risk/reward decisions
- Verify goal posts don't spawn too frequently (not overwhelming)

**4. Rally Combos:**
- Attempt to build long rallies (10+ hits)
- Verify multiplier progression feels rewarding
- Confirm losing rally is impactful but not frustrating
- Test if combo system encourages longer volleys

### CPU AI Testing (Single Player)

**1. Difficulty Levels:**
- **Easy:** Player should win consistently (80%+ win rate)
- **Medium:** Competitive matches (50-60% win rate)
- **Hard:** Player should lose often (30-40% win rate)

**2. AI Behavior:**
- Verify CPU doesn't perfectly predict spin bounces (adds randomness)
- Confirm CPU provides appropriate challenge at each difficulty
- Test that CPU doesn't exploit goal posts (focuses on defense)
- Verify CPU difficulty can be changed mid-game

**3. Edge Cases:**
- Test CPU with extreme spin values (spin = 1.0)
- Verify CPU doesn't get stuck or behave erratically
- Test CPU reacts to momentum impacts appropriately

### Cross-Browser Testing

**Browsers to test:**
1. **Chrome/Edge (Chromium)** - Primary development browser
2. **Firefox** - Test canvas rendering and localStorage
3. **Safari** (if available) - Test canvas performance and ellipse support

**What to verify:**
- Rugby ball renders correctly (ellipse shape)
- Rotation animation is smooth
- Goal post pulsing effect works
- Settings persist in localStorage
- Frame rate stays at 60fps

### Performance Testing

**1. Long-Duration Testing:**
- Play rugby mode continuously for 10+ minutes
- Monitor frame rate in DevTools (should stay at 60fps)
- Check for memory leaks (heap size should be stable)
- Verify no GC spikes during gameplay

**2. Intensive Gameplay:**
- Enable all visual effects (trail, flash, particles)
- Build long rally (20+ hits) with max spin
- Spawn multiple goal posts in quick succession (test edge case)
- Verify performance remains smooth

**3. Memory Profiling:**
- Take heap snapshot at start
- Play for 5 minutes
- Take second heap snapshot
- Compare: memory should not grow significantly
- Check for detached DOM nodes or event listener leaks

### Edge Case Testing

**1. Rapid State Changes:**
- Pause/unpause rapidly during rally
- Open/close settings during gameplay
- Switch modes mid-rally

**2. Boundary Conditions:**
- Ball hitting exact corner of paddle + wall
- Goal post spawning at exact moment of score
- Time limit expiring during serve delay
- Multiple collisions in single frame (very fast ball)

**3. Invalid States:**
- Settings with invalid values (e.g., targetScore = -1)
- Missing localStorage support (test in private browsing)
- Ball spawn overlapping paddle in rugby mode

**4. Timing Edge Cases:**
- Goal post timer expires same frame as ball hits
- Time limit reaches zero during active rally
- Serve delay and goal post spawn timer both expire simultaneously

### Acceptance Criteria

Rugby mode is ready for release when:
- [ ] All unit tests pass
- [ ] Integration testing complete with no critical bugs
- [ ] Gameplay feels balanced and fun (subjective but important)
- [ ] CPU AI provides appropriate challenge at all difficulties
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari if available)
- [ ] Performance testing shows 60fps with no memory leaks
- [ ] Edge cases handled gracefully (no crashes or softlocks)
- [ ] Code review complete (architecture, readability, maintainability)
- [ ] Documentation updated (CLAUDE.md, README.md, CHANGELOG.md)

---

## Implementation Notes

### Development Order

**Phase 1: Core Physics (2-3 hours)**
1. Create `src/rugby.js` with spin and momentum functions
2. Integrate rugby physics into `update()` loop
3. Add paddle velocity tracking
4. Test spin gain and decay

**Phase 2: Rendering (1-2 hours)**
5. Implement rugby ball rendering in `src/renderer.js`
6. Add rotation animation based on spin
7. Test visual clarity of spin

**Phase 3: Goal Posts (1-2 hours)**
8. Implement goal post spawn/despawn system
9. Add collision detection for goal post zones
10. Create pulsing visual effect
11. Test spawn timing and randomization

**Phase 4: Scoring & UI (1 hour)**
12. Implement rally counter and multiplier logic
13. Add rugby UI rendering (multiplier, timer, rally count)
14. Integrate with existing score display

**Phase 5: Mode Integration (1 hour)**
15. Add rugby mode button to landing screen
16. Create rugby settings UI (target score, time limit)
17. Add mode transitions
18. Test state management

**Phase 6: Polish & Testing (2-3 hours)**
19. Add sound effects (use existing sound system)
20. Add visual feedback for goal post hits
21. Balance gameplay (tune spin variance, momentum multiplier)
22. Comprehensive testing (all test cases above)
23. Bug fixes

**Total Estimated Time:** 8-12 hours for complete implementation

### Code Style Guidelines

- Follow existing code style (ES6 modules, named exports)
- Use JSDoc comments for all new functions
- Keep functions small and single-purpose
- Avoid magic numbers (use constants)
- Maintain fixed-timestep physics pattern
- Zero allocations per frame (reuse objects)

### Files to Modify

**New Files:**
- `src/rugby.js` - Rugby physics and logic (~300 lines)

**Modified Files:**
- `src/game-state.js` - Rugby mode state and update (~100 lines added)
- `src/renderer.js` - Rugby ball and UI rendering (~150 lines added)
- `src/input.js` - Paddle velocity tracking (~20 lines added)
- `src/constants.js` - Rugby mode constants (~30 lines added)
- `index.html` - No changes needed
- `styles.css` - No changes needed (uses existing styles)

**Documentation:**
- `CLAUDE.md` - Add rugby mode architecture notes
- `README.md` - Add rugby mode to features list
- `CHANGELOG.md` - Add rugby mode to next version
- `TODO.md` - Track rugby mode implementation tasks

---

## Success Criteria

Rugby Ball Mode is considered complete when:

1. **Core Features Work:**
   - ✅ Oval rugby ball renders with rotation animation
   - ✅ Spin mechanics work (paddle hits add spin, spin affects bounces)
   - ✅ Momentum impacts work (paddle speed affects ball speed and spin)
   - ✅ Goal post zones spawn randomly and award bonus points
   - ✅ Rally combo system works (multipliers at 3, 6, 10 hits)
   - ✅ Hybrid win condition works (target score OR time limit)

2. **Gameplay Quality:**
   - ✅ Mode feels fun and engaging (subjective but critical)
   - ✅ Physics feel satisfying (spin and momentum are noticeable)
   - ✅ Balance is appropriate (neither too easy nor frustrating)
   - ✅ Goal posts create interesting risk/reward moments
   - ✅ Rally combos encourage longer volleys

3. **Technical Quality:**
   - ✅ No critical bugs or crashes
   - ✅ Performance is solid (60fps, no memory leaks)
   - ✅ Cross-browser compatible
   - ✅ Code is clean and maintainable
   - ✅ Tests pass (manual testing complete)

4. **Polish:**
   - ✅ Visual effects are polished (rotation, goal post pulse, UI)
   - ✅ Sound effects work (reuse existing system)
   - ✅ Settings persist correctly
   - ✅ Mode transitions are smooth

5. **Documentation:**
   - ✅ CLAUDE.md updated with rugby mode architecture
   - ✅ README.md lists rugby mode as a feature
   - ✅ Code has clear comments and JSDoc

---

## Future Enhancements (Out of Scope)

These ideas are intentionally excluded from the initial implementation but could be added later:

1. **Advanced Physics:**
   - True ellipse collision detection (instead of circle hitbox)
   - Magnus effect (spin curves ball mid-flight)
   - Air resistance and friction simulation

2. **Additional Mechanics:**
   - Power-ups (temporary speed boost, paddle size increase)
   - Multiple simultaneous goal posts
   - Moving goal posts (slide vertically)
   - Catch & throw mechanic

3. **Customization:**
   - Unlock different rugby ball skins
   - Customizable goal post colors
   - Adjustable spin sensitivity

4. **Competitive Features:**
   - Online multiplayer support
   - Leaderboards for high scores
   - Replay system
   - Tournament mode

5. **Visual Enhancements:**
   - Dust particle effects on bounces
   - Speed lines when ball moves fast
   - Screen shake on powerful hits
   - Victory animations

---

## Conclusion

This design provides a comprehensive blueprint for implementing Rugby Ball Mode in Pong Redux. The arcade-style hybrid approach balances fun gameplay with achievable implementation while maintaining the existing architecture and code quality standards.

**Key Strengths:**
- Leverages existing fixed-timestep physics and collision detection
- Adds meaningful depth without overcomplicating the codebase
- Prioritizes fun and polish over simulation accuracy
- Maintains backward compatibility with regular pong modes
- Clear testing strategy ensures quality

**Next Steps:**
1. Get user approval for this design
2. Create implementation plan with detailed tasks
3. Begin Phase 1: Core Physics implementation

---

**Approved By:** [User Approval Pending]
**Design Date:** 2026-02-13
**Implementation Start:** TBD
