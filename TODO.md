# TODO - Pong Redux

**Last Updated:** 2025-12-22
**Frontend Review Completed:** 2025-12-21
**Immediate Fixes Completed:** 2025-12-22

---

## ✅ Completed Tasks

### 1. Settings Menu Investigation ✅ (2025-12-22)
**Original Issue:** Settings menu reported as non-responsive

**Resolution:** Settings menu is **fully functional** - the issue was a misdiagnosis or already resolved.
- Verified all event handlers fire correctly
- Tested difficulty buttons, tabs, sliders - all working
- Hover states update properly
- Click detection is accurate
- All Stage 8 tests passing

**Files Modified:** `src/input.js` (temporary debug logging added then removed)
**Time:** 15 minutes

---

### 2. Add Error Handling for Canvas Initialization ✅ (2025-12-22)
**Issue:** No validation of canvas context or DOM elements

**Resolution:** Added proper error handling in `index.html`
- Canvas element existence check
- 2D context support validation
- Clear error messages for debugging

**Files Modified:** `index.html:14-24`
**Time:** 5 minutes

---

### 3. Add Console Logging to localStorage Error Handlers ✅ (2025-12-22)
**Issue:** localStorage errors were silently swallowed

**Resolution:** Added `console.warn()` to all localStorage catch blocks
- Settings load failures now logged
- Settings save failures now logged
- High score save failures now logged

**Files Modified:** `src/game-state.js:20, 110, 123`
**Time:** 5 minutes

---

### 4. Unminify CSS for Maintainability ✅ (2025-12-22)
**Issue:** CSS was compressed on one line

**Resolution:** Expanded CSS with proper formatting
- Multi-line structure
- Proper indentation
- All styles preserved

**Files Modified:** `styles.css`
**Time:** 2 minutes

---

## 🚨 Critical Issues (Fix Immediately)

*No critical issues remaining*

---

## ⚙️ Medium Priority (Refactor Later)

### 5. Extract Magic Numbers to Constants File ✅ (2025-12-22)
**Issue:** Hardcoded values scattered throughout codebase
**Impact:** Hard to maintain consistent UI dimensions and timing values
**Files:** `src/renderer.js`, `src/main.js`, `src/ball.js`

**Implementation:**
Create `src/constants.js`:
```javascript
export const CANVAS = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600
};

export const UI = {
  BUTTON_WIDTH: 260,
  BUTTON_HEIGHT: 60,
  BUTTON_GAP: 40,
  SETTINGS_PANEL: {
    WIDTH_RATIO: 0.7,
    HEIGHT_RATIO: 0.7,
    X_OFFSET: 0.15,
    Y_OFFSET: 0.15
  },
  TAB_WIDTH: 140,
  TAB_HEIGHT: 36
};

export const PHYSICS = {
  UPDATE_RATE_HZ: 60,
  MS_PER_UPDATE: 1000 / 60,
  SPIRAL_OF_DEATH_CAP_MS: 250,
  SERVE_DELAY_SEC: 0.5
};

export const BALL = {
  DEFAULT_RADIUS: 6,
  DEFAULT_SPEED: 200,
  MAX_SERVE_ANGLE_DEG: 75
};

export const PADDLE = {
  DEFAULT_WIDTH: 10,
  DEFAULT_HEIGHT: 80,
  DEFAULT_SPEED: 300,
  DEFAULT_ACCEL: 2000
};
```

**Completed Changes:**
- Created `src/constants.js` with all centralized constants
- Updated `src/main.js` - Game loop timing constants
- Updated `src/game-state.js` - Defaults, serve delay, ball speed bounds, volume bounds
- Updated `src/input.js` - UI dimensions, difficulty levels, win scores, ball speed calculation
- Updated `src/renderer.js` - UI layout constants

**Impact:**
- Eliminated ~40+ magic numbers across the codebase
- Centralized all tunable values in one location
- Easier to maintain and modify game balance
- All tests passing ✅

**Actual Effort:** 45 minutes
**Status:** ✅ Completed (2025-12-22)

---

### 6. Split Large Files into Smaller Modules
**Issue:** Some files have grown too large with mixed responsibilities

**Files to Split:**

#### 6a. `src/renderer.js` (411 lines)
Split into:
- `src/rendering/canvas-renderer.js` - Core rendering logic
- `src/rendering/ui-components.js` - Button, slider, overlay drawing functions
- `src/rendering/ui-layouts.js` - Layout calculations for landing, settings, etc.

#### 6b. `src/input.js` (380 lines)
Split into:
- `src/input/keyboard-handler.js` - Keyboard event handling
- `src/input/mouse-handler.js` - Pointer events and hover detection
- `src/input/ui-interactions.js` - Settings menu interaction logic

#### 6c. `src/game-state.js` (330 lines)
Split into:
- `src/state/game-state.js` - Core state and update logic
- `src/state/settings-manager.js` - Settings getters/setters
- `src/state/persistence.js` - localStorage operations

**Estimated Effort:** 4-6 hours
**Status:** Not Started

---

### 7. Add JSDoc Documentation for Public APIs ✅ (2025-12-22)
**Issue:** No type hints or documentation for function parameters and return values

**Completed Documentation:**

**src/ball.js** - All 6 functions documented:
- `createBall()` - Ball entity creation
- `resetBall()` - Reset position and velocity
- `serveBall()` - Random serve direction
- `updateBall()` - Position integration
- `bounceOffHorizontalEdge()` - Wall collision
- `reflectFromPaddle()` - Complex bounce logic with angle variation

**src/collision.js** - Both functions documented:
- `isCircleRectColliding()` - AABB circle-rectangle detection
- `resolveCircleRectPenetration()` - Positional correction algorithm

**src/paddle.js** - All 3 functions documented:
- `createPaddle()` - Paddle entity creation
- `updatePaddle()` - Smooth acceleration physics
- `setPaddleDirection()` - Input control

**src/game-state.js** - Key functions documented:
- `createInitialState()` - Initial state with localStorage
- `update()` - Main game loop with collision system details

**src/ai.js** - All 3 CPU functions documented:
- `initCPU()` - CPU state initialization
- `updateCPU()` - AI behavior with difficulty personalities
- `setCPUDifficulty()` - Mid-game difficulty changes

**Impact:**
- 20+ functions now have comprehensive JSDoc
- Type information for all parameters and return values
- Algorithm explanations for complex functions
- Usage examples where helpful
- Better IDE autocomplete and intellisense

**Actual Effort:** 30 minutes
**Status:** ✅ Completed (2025-12-22)

---

### 8. Remove Unused Interpolation Parameter or Implement It
**Issue:** `interp` parameter calculated but never used
**Files:** `src/main.js:39`, `src/renderer.js:4`

**Options:**
1. **Remove it:** If interpolation isn't needed, remove the parameter
2. **Implement it:** Use for smooth visual interpolation between physics frames

**If Implementing:**
```javascript
// renderer.js
export function render(state, ctx, interp = 0) {
  // Interpolate ball position for smooth rendering
  const ball = state.ball;
  const renderX = ball.prevX + (ball.x - ball.prevX) * interp;
  const renderY = ball.prevY + (ball.y - ball.prevY) * interp;

  ctx.beginPath();
  ctx.arc(renderX, renderY, ball.r, 0, Math.PI * 2);
  ctx.fill();
}
```

**Estimated Effort:** 1 hour (removal) or 3 hours (implementation)
**Status:** Not Started

---

## 🎨 Low Priority (Nice to Have)

### 9. Reduce Tight Coupling with Command Pattern
**Issue:** `input.js` imports many functions from `game-state.js`, creating tight coupling
**Benefit:** Easier testing, better separation of concerns

**Implementation:**
Create `src/commands.js`:
```javascript
export const commands = {
  setDifficulty: (state, value) => { /* ... */ },
  setBallSpeed: (state, value) => { /* ... */ },
  setWinScore: (state, value) => { /* ... */ },
  // ...
};
```

Update `input.js`:
```javascript
import { commands } from './commands.js';

function handleGameplayClick(x, y, state, panelX, panelY) {
  // ...
  if (clickedDifficulty) {
    commands.setDifficulty(state, difficulty);
  }
}
```

**Estimated Effort:** 2-3 hours
**Status:** Not Started

---

### 10. Extract Common UI Drawing Functions
**Issue:** Repeated button/slider drawing code in `renderer.js`
**Files:** `src/renderer.js:288-301, 330-343`

**Implementation:**
```javascript
// src/rendering/ui-components.js
export function drawButton(ctx, x, y, w, h, label, isHovered, isSelected) {
  ctx.fillStyle = isHovered ? '#444' : '#222';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = isSelected ? '#0f0' : '#666';
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
}

export function drawSlider(ctx, x, y, width, value, min, max, name, hover) {
  // ... extract from renderer.js:406-427
}
```

**Estimated Effort:** 2 hours
**Status:** Not Started

---

### 11. Add Accessibility Features
**Issue:** Canvas content is invisible to screen readers
**Impact:** Game is not accessible to users with visual impairments

**Implementation:**
```html
<!-- index.html -->
<canvas id="gameCanvas"
        width="800"
        height="600"
        role="img"
        aria-label="Pong game canvas"></canvas>

<div id="game-status" class="sr-only" aria-live="polite" aria-atomic="true">
  <!-- Update with game state changes for screen readers -->
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
  }
</style>
```

Add state announcements:
```javascript
// Update #game-status when score changes, game starts, etc.
function updateScreenReaderStatus(state) {
  const statusEl = document.getElementById('game-status');
  if (statusEl) {
    statusEl.textContent = `Score: ${state.score.left} to ${state.score.right}`;
  }
}
```

**Estimated Effort:** 4 hours
**Status:** Not Started

---

### 12. Cache Calculations Outside Render Loop
**Issue:** Panel dimensions recalculated every frame
**Files:** `src/renderer.js:168-171`

**Implementation:**
```javascript
// Cache UI layout calculations
let cachedLayout = null;
let cachedWidth = 0;
let cachedHeight = 0;

function getSettingsLayout(w, h) {
  if (cachedWidth !== w || cachedHeight !== h) {
    cachedLayout = {
      panelX: w * 0.15,
      panelY: h * 0.15,
      panelW: w * 0.7,
      panelH: h * 0.7,
      // ... other cached values
    };
    cachedWidth = w;
    cachedHeight = h;
  }
  return cachedLayout;
}
```

**Estimated Effort:** 1 hour
**Status:** Not Started

---

## Future Enhancements

### ✅ Stage 9: Paddle Customization (Completed 2025-12-22)
- ✅ Paddle styles (Classic, Retro, Neon, Custom)
- ✅ Color customization
- ✅ Size options (0.5x-1.5x multiplier)

### ✅ Stage 10: Ball Customization & Effects (Completed 2025-12-22)
- ✅ Ball trails with object pooling
- ✅ Collision flash effects
- ✅ Ball styles (Classic, Retro, Glow, Soccer)
- Note: Ball style UI not yet integrated into settings menu

### ✅ Stage 11: Difficulty & Gameplay Tweaks (Completed 2025-12-22)
- ✅ Ball speed presets (Slow/Normal/Fast/Insane)
- ✅ Paddle size slider
- ✅ Endless mode toggle

### Stage 7: Instructions & Help System
- Help overlay accessible during gameplay
- Control reference
- Tutorial mode (optional)

### Stage 12-16: Polish & Launch
- Sound effects (Web Audio API)
- Visual polish and animations
- Stats tracking
- Portfolio documentation
