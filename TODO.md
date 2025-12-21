# TODO - Pong Redux

**Last Updated:** 2025-12-21
**Frontend Review Completed:** 2025-12-21

---

## 🚨 Critical Issues (Fix Immediately)

### 1. Settings Menu Non-Responsive (Priority: Critical)
**Issue:** Settings menu renders but is non-responsive to mouse/keyboard input

**Context:**
- Settings overlay appears when pressing S key or clicking gear icon
- UI renders correctly with all tabs, buttons, and sliders visible
- However, clicks and interactions don't register
- Need to investigate event handling in `src/input.js`

**Possible Causes:**
1. Event listener attachment order (settings handlers may be registered too early)
2. Z-index or event propagation issues with canvas overlay
3. Coordinate calculation mismatch between render and input handlers
4. Canvas redraw clearing event state

**Files to Check:**
- `src/input.js:140-165` - Settings click handlers (`handleSettingsClick`, `detectSettingsHover`)
- `src/renderer.js:168-183` - Settings overlay rendering (verify coordinates match input handlers)
- `src/main.js:50-52` - Event listener attachment timing

**Testing Approach:**
1. Add console.log statements in settings click handlers to verify they're being called
2. Check if hover states are updating (visual feedback)
3. Verify canvas coordinate calculations match between render and input
4. Test in browser console with manual event dispatching

**Status:** Not Started
**Created:** 2025-12-21

---

## 🔥 High Priority (Fix Soon)

### 2. Add Error Handling for Canvas Initialization
**Issue:** No validation of canvas context or DOM elements
**Impact:** App crashes silently if canvas element is missing or 2D context unavailable
**Files:** `index.html:14-15`

**Implementation:**
```javascript
// index.html - Replace current initialization
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  console.error('Canvas element not found');
  throw new Error('Failed to initialize game: canvas element missing');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  console.error('Failed to get 2D context');
  throw new Error('Canvas 2D context not supported');
}

const game = createGame(canvas);
```

**Estimated Effort:** 15 minutes
**Status:** Not Started

---

### 3. Add Console Logging to localStorage Error Handlers
**Issue:** localStorage errors are silently swallowed, making debugging difficult
**Files:** `src/game-state.js:14-23, 114-119, 128-132`

**Implementation:**
Add `console.warn()` to all localStorage catch blocks:
```javascript
catch (e) {
  console.warn('Failed to load settings from localStorage:', e);
  // Fallback to defaults
}
```

**Estimated Effort:** 10 minutes
**Status:** Not Started

---

### 4. Unminify CSS for Maintainability
**Issue:** CSS is compressed on one line, making it hard to read and modify
**Files:** `styles.css:2-3`

**Implementation:**
Expand CSS with proper formatting:
```css
html, body {
  height: 100%;
  margin: 0;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

canvas {
  box-shadow: 0 6px 24px rgba(0,0,0,0.6);
  image-rendering: pixelated;
  border: 2px solid #222;
}
```

**Estimated Effort:** 5 minutes
**Status:** Not Started

---

## ⚙️ Medium Priority (Refactor Later)

### 5. Extract Magic Numbers to Constants File
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

**Affected Files:**
- `src/renderer.js` - UI dimensions
- `src/main.js` - Game loop timing
- `src/ball.js` - Physics constants
- `src/paddle.js` - Paddle properties
- `src/game-state.js` - Serve delay

**Estimated Effort:** 2 hours
**Status:** Not Started

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

### 7. Add JSDoc Documentation for Public APIs
**Issue:** No type hints or documentation for function parameters and return values
**Impact:** Harder to understand function contracts without reading implementation

**Priority Functions to Document:**
- `src/ball.js:reflectFromPaddle()` - Complex bounce logic
- `src/collision.js:isCircleRectColliding()` - Collision detection
- `src/collision.js:resolveCircleRectPenetration()` - Penetration resolution
- `src/game-state.js:update()` - Main game update loop
- `src/paddle.js:updatePaddle()` - Paddle physics

**Example:**
```javascript
/**
 * Reflects ball velocity after paddle collision with angle variation
 * @param {Object} ball - Ball object with x, y, vx, vy, r properties
 * @param {number} paddleY - Paddle center Y position
 * @param {number} paddleH - Paddle height
 * @param {number} direction - Reflection direction: +1 (right) or -1 (left)
 * @param {number} [maxBounceDeg=50] - Maximum deflection angle in degrees
 * @param {number} [centerDeadzone=0.05] - Center zone for straight bounces
 */
export function reflectFromPaddle(ball, paddleY, paddleH, direction,
                                   maxBounceDeg = DEFAULT_MAX_BOUNCE_DEG,
                                   centerDeadzone = DEFAULT_CENTER_DEADZONE) {
  // ...
}
```

**Estimated Effort:** 3 hours
**Status:** Not Started

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

### Stage 9: Paddle Customization
- Paddle styles (Classic, Retro, Neon, Custom)
- Color customization
- Size options

### Stage 7: Instructions & Help System
- Help overlay accessible during gameplay
- Control reference
- Tutorial mode (optional)

### Stage 10-11: Ball Customization & Visual Effects
- Ball trails
- Particle effects on collision
- Ball styles and colors

### Stage 12-16: Polish & Launch
- Sound effects (Web Audio API)
- Visual polish and animations
- Stats tracking
- Portfolio documentation
