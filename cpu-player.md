# Pong CPU Opponent: Strategy & Implementation Guide

**Confidence:** High - this approach is battle-tested across decades of Pong implementations and will produce fun, fair gameplay.

---

## 1. High-Level AI Design

### Core Approach: Reactive Tracking with Intentional Flaws

The CPU opponent uses **reactive tracking**, not prediction. It observes where the ball currently is and attempts to align the paddle center with the ball's Y position, subject to:

- **Reaction delay** (simulates human response time)
- **Targeting error** (simulates imperfect judgment)
- **Movement speed limits** (same physics as human player)

**Why This Works:**
- **Fair**: The CPU plays by the same rules as the player
- **Beatable**: Intentional flaws create openings
- **Human-like**: Delays and errors mirror real player behavior
- **Tunable**: Simple parameters control difficulty without code changes

**Key Principle:** The AI doesn't need to be smart—it needs to be *believably imperfect*.

---

## 2. Core AI Behavior

### Target Selection

```
IF ball is moving toward CPU side (ball.velocityX > 0):
    targetY = ball.Y + random_error_offset()
ELSE:
    targetY = center_of_court_Y  // Return to neutral position
```

**Error Injection:**
```
random_error_offset():
    return random_float(-error_margin, +error_margin)
```

The error margin is recalculated periodically (every 500-1000ms), not every frame, to avoid twitchy behavior.

### Reaction Delay

The CPU doesn't update its target immediately when the ball direction changes:

```
IF ball_direction_changed_toward_cpu:
    start_reaction_timer(reaction_delay_ms)
    
IF reaction_timer_expired AND ball_moving_toward_cpu:
    update_target_position()
```

This creates a realistic "I just noticed the ball" delay.

### Inaccuracy Implementation

**Two layers:**
1. **Targeting error**: Random offset applied to target Y position
2. **Update frequency**: CPU only recalculates target every N frames (e.g., every 100-200ms for Easy, 50ms for Hard)

---

## 3. Difficulty Model

### Parameter Sets

| Difficulty | Reaction Delay (ms) | Error Margin (px) | Update Frequency (ms) | Max Speed Factor |
|------------|---------------------|-------------------|----------------------|------------------|
| **Easy**   | 400                | ±60              | 200                  | 0.7x            |
| **Medium** | 200                | ±30              | 100                  | 0.85x           |
| **Hard**   | 100                | ±15              | 50                   | 1.0x            |

### Configuration Object

```javascript
const CPU_DIFFICULTY = {
    EASY: {
        reactionDelay: 400,      // ms before reacting to ball direction change
        errorMargin: 60,         // pixels of random offset
        updateInterval: 200,     // ms between target recalculations
        speedMultiplier: 0.7,    // fraction of human max speed
        returnToCenter: true     // drift toward center when ball not approaching
    },
    MEDIUM: {
        reactionDelay: 200,
        errorMargin: 30,
        updateInterval: 100,
        speedMultiplier: 0.85,
        returnToCenter: true
    },
    HARD: {
        reactionDelay: 100,
        errorMargin: 15,
        updateInterval: 50,
        speedMultiplier: 1.0,
        returnToCenter: false    // stay in position, more aggressive
    }
};
```

### Storing in Game State

```javascript
gameState = {
    // ... existing properties
    cpuEnabled: true,
    cpuDifficulty: 'MEDIUM',  // or store the config object directly
    cpuReactionTimer: 0,
    cpuUpdateTimer: 0,
    cpuTargetY: null,
    cpuCurrentError: 0        // persistent error offset, updated periodically
};
```

---

## 4. Movement Logic

### Step-by-Step Paddle Movement

**On each frame:**

```
1. Calculate distance to target:
   delta = targetY - paddle.centerY

2. Determine desired movement this frame:
   desiredMove = clamp(delta, -maxMovePerFrame, +maxMovePerFrame)
   
3. Apply speed multiplier:
   actualMove = desiredMove * difficulty.speedMultiplier
   
4. Move paddle:
   paddle.Y += actualMove
   
5. Enforce boundaries:
   paddle.Y = clamp(paddle.Y, minY, maxY)
```

### Preventing Jitter

**Dead zone approach:**

```javascript
const DEAD_ZONE = 5; // pixels - don't move if within this range

if (Math.abs(delta) > DEAD_ZONE) {
    // Move toward target
} else {
    // Close enough - stop moving
}
```

This prevents the paddle from oscillating when near the target.

### Reusing Existing Code

If you have a `movePaddle(paddle, direction, speed)` function:

```javascript
function updateCPUPaddle(paddle, targetY, difficulty) {
    const delta = targetY - paddle.centerY;
    
    if (Math.abs(delta) < DEAD_ZONE) return; // Already positioned
    
    const direction = delta > 0 ? 'down' : 'up';
    const speed = BASE_PADDLE_SPEED * difficulty.speedMultiplier;
    
    movePaddle(paddle, direction, speed);
}
```

---

## 5. Pseudocode

### CPU Update Loop (Per Frame)

```javascript
function updateCPU(deltaTime) {
    const difficulty = CPU_DIFFICULTY[gameState.cpuDifficulty];
    
    // 1. Update timers
    gameState.cpuReactionTimer -= deltaTime;
    gameState.cpuUpdateTimer -= deltaTime;
    
    // 2. Check if ball is approaching
    const ballApproaching = ball.velocityX > 0; // Assuming CPU is on right side
    
    // 3. Handle reaction delay
    if (ballApproaching && !gameState.cpuHasReacted) {
        if (gameState.cpuReactionTimer <= 0) {
            gameState.cpuHasReacted = true;
        } else {
            return; // Still in reaction delay, don't move
        }
    }
    
    // 4. Reset state when ball changes direction
    if (!ballApproaching) {
        gameState.cpuHasReacted = false;
        gameState.cpuReactionTimer = difficulty.reactionDelay;
        gameState.cpuTargetY = COURT_CENTER_Y; // Return to neutral
        return;
    }
    
    // 5. Update target position periodically
    if (gameState.cpuUpdateTimer <= 0) {
        gameState.cpuCurrentError = randomRange(-difficulty.errorMargin, difficulty.errorMargin);
        gameState.cpuTargetY = ball.Y + gameState.cpuCurrentError;
        gameState.cpuUpdateTimer = difficulty.updateInterval;
    }
    
    // 6. Move toward target
    const delta = gameState.cpuTargetY - cpuPaddle.centerY;
    
    if (Math.abs(delta) > DEAD_ZONE) {
        const maxMove = MAX_PADDLE_SPEED * difficulty.speedMultiplier * (deltaTime / 16.67); // Normalize to ~60fps
        const move = clamp(delta, -maxMove, maxMove);
        cpuPaddle.Y += move;
        cpuPaddle.Y = clamp(cpuPaddle.Y, 0, COURT_HEIGHT - cpuPaddle.height);
    }
}
```

### Difficulty Parameter Application

```javascript
function setCPUDifficulty(level) {
    gameState.cpuDifficulty = level; // 'EASY', 'MEDIUM', or 'HARD'
    gameState.cpuReactionTimer = CPU_DIFFICULTY[level].reactionDelay;
    gameState.cpuUpdateTimer = 0; // Start updating immediately
    gameState.cpuHasReacted = false;
}
```

---

## 6. Feel & Tuning Guidance

### What "Too Perfect" Looks Like

**Symptoms:**
- CPU never misses a ball
- Paddle snaps instantly to correct position
- Zero variation in gameplay patterns
- Player feels helpless regardless of shot placement

**Fixes:**
- Increase error margin by 10-20px
- Add 50-100ms reaction delay
- Reduce speed multiplier by 0.1

### Easy Mode Signs

**Too Hard if:**
- Beginners can't score within first 5 rallies
- CPU returns >80% of shots
- Players quit in frustration

**Too Easy if:**
- CPU misses center-court balls
- Paddle barely moves
- No sense of challenge even for new players

**Tuning:**
- Start with error margin at ±50px, adjust in ±10px increments
- Test with someone who's never played Pong

### Hard Mode Signs

**Unfair if:**
- CPU returns literally everything
- No amount of skill creates scoring opportunities
- Paddle movement looks robotic/instantaneous

**Not Hard Enough if:**
- Intermediate players win 10+ points ahead
- CPU makes obviously stupid mistakes
- Feels like playing Medium

**Tuning:**
- Hard should win ~60-70% of rallies against average players
- Small error margin (±10-20px) is okay—speed and reaction time are the challenge

### Simple Tuning Knobs

**Priority order for balancing:**

1. **Error Margin** (biggest feel impact)
   - Adjust in ±10px increments
   - Test over 20+ rallies

2. **Reaction Delay** (second-biggest impact)
   - Adjust in ±50ms increments
   - Notice: players can exploit delay with quick direction changes

3. **Speed Multiplier** (fine-tuning)
   - Adjust in ±0.05 increments
   - Affects whether CPU *can* reach edge shots

4. **Update Interval** (subtle)
   - Only adjust if CPU feels too "locked on"
   - Increase by 50ms to add slight lag

**Testing Protocol:**
- Play 3-5 games per difficulty
- Note: first score, average rally length, "feels fair" gut check
- Adjust ONE parameter at a time

---

## 7. Common Pitfalls

### ❌ Tracking Too Early

**Problem:** CPU starts moving before ball crosses centerline

**Symptom:** Paddle anticipates shots before human could possibly react

**Fix:**
```javascript
// Only track when ball is actually approaching
if (ball.X > COURT_CENTER_X && ball.velocityX > 0) {
    // CPU can react
}
```

### ❌ Over-Predicting Ball Trajectory

**Problem:** Calculating exact bounce physics and interception points

**Why It Fails:** Makes CPU superhuman, removes all challenge

**Fix:** Stick to simple reactive tracking. At most, you can target `ball.Y + (ball.velocityY * 0.2)` for slight anticipation on Hard mode, but avoid full trajectory calculation.

### ❌ Ignoring Paddle Speed Limits

**Problem:** CPU paddle instantly snaps to ball position

**Symptom:** Looks robotic, feels unfair

**Fix:**
```javascript
// Respect max speed per frame
const maxMove = MAX_SPEED * deltaTime;
const actualMove = clamp(targetDelta, -maxMove, maxMove);
```

### ❌ Updating Target Every Frame

**Problem:** Paddle tracks ball pixel-perfectly in real-time

**Fix:** Only recalculate target every 50-200ms based on difficulty

### ❌ Forgetting the Dead Zone

**Problem:** Paddle oscillates/vibrates when near target

**Fix:** Stop moving when within 5-10px of target

### ❌ No Return-to-Center Behavior

**Problem:** Paddle stays at edges after rally, looks stuck

**Fix:** When ball moves away, slowly drift toward court center:

```javascript
if (!ballApproaching) {
    targetY = COURT_CENTER_Y;
    // Use slower speed for return movement
}
```

---

## Implementation Checklist

- [ ] Add difficulty config object with all parameters
- [ ] Add CPU state variables (target, timers, error)
- [ ] Implement direction detection (is ball approaching?)
- [ ] Implement reaction delay timer
- [ ] Implement periodic target update with error injection
- [ ] Implement smooth movement with speed limiting
- [ ] Add dead zone to prevent jitter
- [ ] Add return-to-center behavior
- [ ] Test Easy mode with beginner
- [ ] Test Hard mode—should be challenging but beatable
- [ ] Add difficulty selector to UI
- [ ] Playtest for 15+ minutes per difficulty
- [ ] Fine-tune based on feel

---

## Quick Start Parameters (Copy-Paste Ready)

```javascript
// Paste this into your game state initialization
const AI_CONFIG = {
    EASY: {
        reactionMs: 400,
        errorPx: 60,
        updateMs: 200,
        speedMult: 0.7
    },
    MEDIUM: {
        reactionMs: 200,
        errorPx: 30,
        updateMs: 100,
        speedMult: 0.85
    },
    HARD: {
        reactionMs: 100,
        errorPx: 15,
        updateMs: 50,
        speedMult: 1.0
    }
};

const DEAD_ZONE_PX = 5;
const RETURN_TO_CENTER_SPEED_MULT = 0.5; // Slower drift when not tracking
```

---

**Final Note:** Start with Medium difficulty parameters and playtest heavily. You can always make Easy easier or Hard harder, but nailing Medium creates your baseline for the other two. The goal isn't a perfect AI—it's an AI that *loses in interesting ways*.