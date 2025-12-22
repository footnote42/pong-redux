# Changelog

All notable changes to the Pong Redux project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - 2025-12-22

### Added - Stages 9, 10 & 11: Customization & Difficulty
- **Stage 9: Paddle Customization**
  - Four paddle styles: Classic (rectangle), Retro (segmented), Neon (glow effect), Custom (color picker)
  - Individual paddle color customization with 10 preset colors
  - Style selector in settings menu with visual feedback
  - Real-time style application during gameplay
  - All styles maintain collision detection accuracy

- **Stage 10: Ball Customization & Effects**
  - Four ball styles: Classic (circle), Retro (rotated square), Glow (neon), Soccer (pentagon pattern)
  - Trail effect with configurable length (3-10 positions) using object pooling
  - Collision flash effect (100ms) on paddle and wall hits
  - Ball color customization setting
  - Performance-optimized: no per-frame allocations

- **Stage 11: Difficulty & Gameplay Tweaks**
  - Ball speed presets: Slow (0.7x), Normal (1.0x), Fast (1.3x), Insane (1.8x)
  - Paddle size slider: 0.5x to 1.5x multiplier (affects both paddles)
  - Endless mode toggle: disables win condition for casual play
  - Settings panel height increased to 80% for better content visibility
  - Optimized UI spacing to fit all options

### Changed
- `src/constants.js`: Added `PADDLE.SIZE_MULTIPLIER_MIN/MAX`, `BALL.SPEED_PRESETS`, `UI.SETTINGS_PANEL.HEIGHT_RATIO` (0.8)
- `src/game-state.js`: Added paddle/ball style settings, `setPaddleSize()`, `setEndlessMode()`, ball trail/flash state
- `src/renderer.js`: Implemented style-based rendering for paddles and balls, added UI for presets/endless mode/paddle size
- `src/input.js`: Added handlers for all new settings, imported `setPaddleSize` and `setEndlessMode`
- Settings UI spacing optimized (40px→30px between sections, 70px→60px after elements)

### Technical Details
- Paddle rendering: Four dedicated functions (`drawClassicPaddle`, `drawRetroPaddle`, `drawNeonPaddle`, `drawCustomPaddle`)
- Ball rendering: Four dedicated functions with trail/flash support
- Trail system: Object-pooled array with shift/push pattern, alpha fade rendering
- Flash effect: Timer-based (decrements in game loop), triggered on all collision types
- Endless mode: Sets `winScore` to 999 when enabled
- Paddle size: Multiplier applied to `PADDLE.DEFAULT_HEIGHT` for both paddles

### Testing
- Ball speed presets tested at all levels (Insane 1.8x confirmed)
- Endless mode toggle verified with visual feedback
- Paddle size changes applied in real-time
- No performance degradation with effects enabled
- All settings persist via localStorage

---

## [0.8.0] - 2025-12-21

### Added - Stage 8: Settings Menu Foundation
- **Comprehensive settings system** with organized tabbed interface:
  - **Gameplay Tab**: AI difficulty selector, ball speed slider (0.5x-2.0x), win score selector (5/7/11/15/21)
  - **Audio Tab**: Sound toggle (ON/OFF), volume slider (0-100%)
  - **About Tab**: Version info, credits
- **Settings persistence** via localStorage
- **Live settings application**:
  - Ball speed changes apply immediately to active ball
  - Difficulty changes sync with CPU in single-player mode
  - Win score changes apply to current game
- **Tabbed UI navigation** with hover states and visual feedback
- **Slider controls** for continuous values (ball speed, volume)
- **Keyboard shortcuts**: Press S or ESC to toggle settings, 1/2/3 for difficulty selection
- **Settings state management**: `settingsTab`, `showSettings`, `settingsHover`
- Comprehensive test suite (`test/stage8-settings-test.mjs`) - 12 tests

### Changed
- `src/game-state.js`: Expanded settings structure with `ballSpeed`, `winScore`, `soundEnabled`, `volume`
- `src/game-state.js`: Added setter functions: `setBallSpeed()`, `setWinScore()`, `setSoundEnabled()`, `setVolume()`
- `src/game-state.js`: Settings persist to localStorage on every change
- `src/game-state.js`: Settings load from localStorage on initialization
- `src/game-state.js`: Ball speed changes apply live to ball velocity
- `src/game-state.js`: CPU difficulty syncs with settings changes
- `src/renderer.js`: Complete settings UI rewrite with tabbed interface
- `src/renderer.js`: Added `drawGameplaySettings()`, `drawAudioSettings()`, `drawAboutSettings()`
- `src/renderer.js`: Added reusable `drawSlider()` component
- `src/input.js`: Settings interaction handlers for all controls
- `src/input.js`: Added helper functions: `detectSettingsHover()`, `handleSettingsClick()`
- `src/input.js`: ESC key closes settings overlay
- `package.json`: Added test scripts for all stages (collision, stage3, stage6, stage8)
- `test/run_collision_tests.mjs`: Updated to work with new game state model

### Technical Details
- Settings stored in `state.settings` object with defaults
- `persistSettings()` helper writes to localStorage on every change
- Ball speed stored as multiplier (0.5-2.0) and applied to ball velocity
- Volume clamped to 0-100 range
- All setter functions include bounds checking
- Settings UI uses canvas rendering with interactive hover states
- Slider controls calculate normalized values (0-1) for precise input

### Testing
- All 12 Stage 8 tests passing ✓
- Settings persistence verified
- Live ball speed application verified
- CPU difficulty synchronization verified
- All bounds checking verified
- All previous stage tests still passing

### Known Issues
- **Settings menu non-responsive**: UI renders but clicks/interactions don't register. Needs investigation of event handling in `src/input.js`. Documented in `TODO.md` for next session.

---

## [0.6.0] - 2025-12-21

### Added - Stage 6: CPU Opponent
- **Reactive AI with intentional flaws** for human-like CPU opponent
- **Three difficulty levels** with distinct parameters:
  - Easy: 400ms reaction, ±60px error, 70% speed
  - Medium: 200ms reaction, ±30px error, 85% speed
  - Hard: 100ms reaction, ±15px error, 100% speed
- **AI features**:
  - Reaction delay timers (simulates human response time)
  - Periodic target updates (not frame-perfect tracking)
  - Random targeting errors (imperfect aim)
  - Dead zone to prevent paddle jitter
  - Return-to-center behavior when ball moves away
  - Respects movement speed limits (no cheating)
- **Single-player mode integration**: CPU controls right paddle when gameMode is 'single'
- **Difficulty synchronization**: Settings panel difficulty applies to CPU
- Comprehensive test suite (`test/stage6-cpu-test.mjs`)

### Changed
- `src/game-state.js`: Imports and initializes CPU on single-player mode start
- `src/game-state.js`: Updates CPU paddle in main game loop
- `src/game-state.js`: Synchronizes CPU difficulty with settings changes
- `test/stage3-scoring-test.mjs`: Updated to work with new game state model

### Technical Details
- CPU uses reactive tracking (not predictive) for fair, beatable gameplay
- AI parameters follow guidance from `cpu-player.md`
- CPU designed to "lose in interesting ways" rather than be unbeatable

---

## [0.5.0] - 2025-12-21

### Added - Stage 5: Landing Screen & Mode Selection
- **Landing screen** with professional game title and mode selection
- **Two game modes**:
  - "1 Player (vs CPU)" - Single-player mode
  - "2 Players (Local)" - Local multiplayer
- **Game state management**: LANDING, PLAYING, PAUSED, GAME_OVER states
- **Settings panel** accessible from landing screen:
  - Difficulty selection (Easy/Medium/Hard)
  - Settings persist to localStorage
  - Visual feedback for selected options
- **High score tracking** with localStorage persistence
- **Settings gear icon** in top-right corner
- Keyboard shortcuts: Press 1 or 2 to select mode, S to open settings
- Tests for landing screen and settings (`test/stage5-landing-test.mjs`, `test/stage5-settings-test.mjs`)

### Changed
- `src/game-state.js`: Default gameState is now 'LANDING' instead of 'PLAYING'
- `src/game-state.js`: Added mode selection logic and settings management
- `src/renderer.js`: Landing screen overlay with buttons and instructions
- `src/renderer.js`: Settings overlay with difficulty options
- `src/input.js`: Landing screen input handling (mouse and keyboard)
- `index.html`: Removed immediate ball serving to allow landing screen

### Fixed
- Settings overlay rendering (removed early return from landing screen render)
- Settings gear icon alignment with clickable area

---

## [0.4.0] - 2025-12-21

### Added - Stage 4: Pause & Input Handling
- First-time control instructions overlay (dismissible with any key) and `localStorage` persistence
- Pause system (P / ESC) with semi-opaque pause overlay and helpful control hints
- Improved keyboard input handling to support simultaneous key presses and avoid 1-frame glitches
- Paddle smoothing with acceleration/deceleration for more natural movement
- Unit tests for pause and input behavior (`test/stage4-pause-input-test.mjs`)

### Changed
- `src/input.js` now tracks pressed keys and maps them to paddle input directions
- `src/paddle.js` adds `inputDir` and `accel` for smooth paddle motion
- `src/renderer.js` includes instructions overlay and enhanced pause overlay

---

## [0.3.0] - 2025-12-21

### Added - Stage 3: Scoring & Win Conditions
- Score tracking when ball exits left/right boundaries
- Win condition (first to 11 points) and winner announcement overlay
- Restart functionality with SPACE key and reset of game state
- 0.5s serve delay after each point, and re-serve logic
- Unit tests covering scoring, win detection, serve delay, and restart (`test/stage3-scoring-test.mjs`)

### Changed
- `src/game-state.js` updated with `serveTimer`, `gameOver`, and `winner` fields
- Renderer overlays updated to show winner and restart instructions

---

## [0.2.0] - 2025-12-20

### Added - Stage 2: Collision & Physics System
- **AABB collision detection** between ball and paddles (circle-rectangle)
- **Positional correction** to prevent ball sticking to paddles
- **Swept collision guard** to prevent high-speed tunneling through paddles
- **Paddle hit angle variation**:
  - Configurable max bounce angle (default: 50°)
  - Center deadzone for forgiving center hits (default: 5%)
  - Direction-aware reflection that preserves ball speed
- **Corner-case handling** for simultaneous paddle+wall collisions
- **Spawn-inside-paddle protection** via re-serve logic
- **Comprehensive test suite**:
  - Headless collision tests (run_collision_tests.mjs) - 7 test cases
  - Browser test suite (collision.unit.html) with visual pass/fail
  - Interactive debug harness (collision-debug.html) with live tuning sliders
- **GitHub Actions CI pipeline** - runs collision tests on every push
- **package.json test script** - `npm test` runs headless collision tests

### Changed
- Updated README.md with comprehensive project overview, technical deep-dive, and learning outcomes
- Updated build-plan.md with progress summary (2/16 stages complete)
- Enhanced package.json with proper metadata, keywords, and repository info
- Bumped version to 0.2.0 to reflect Stage 2 completion

### Technical Details
- Collision detection uses closest-point algorithm for AABB
- Positional correction prevents multi-frame penetration
- Swept guard checks ball velocity × deltaTime to predict potential tunneling
- Max bounce angle tuned to 50° (down from 60°) for better game balance
- Center deadzone set to 5% for forgiving center hits

### Testing
- All 7 headless collision tests passing ✓
- Browser tests verify: basic collision, edge hits, corner hits, high-speed tunneling prevention
- Debug harness allows real-time tuning of physics parameters

---

## [0.1.0] - 2025-12-19

### Added - Stage 1: Core Rendering & Game Loop
- **Fixed-timestep game loop** using requestAnimationFrame with accumulator pattern
  - 60Hz update rate (16.67ms per tick)
  - Spiral of death protection (caps delta time at 250ms)
  - Separated physics updates from rendering
- **ES6 module architecture**:
  - main.js - Game loop orchestration
  - game-state.js - Centralized state management
  - paddle.js - Paddle entity factory functions
  - ball.js - Ball physics and serving logic
  - collision.js - Collision detection algorithms
  - renderer.js - Canvas rendering (separated from game logic)
  - input.js - Keyboard event buffering
- **Paddle rendering and movement**:
  - Factory functions for creating paddle entities
  - Keyboard controls: W/S (left paddle), Arrow Up/Down (right paddle)
  - Boundary clamping (paddles can't move off-screen)
- **Ball rendering and basic physics**:
  - Ball movement with velocity vector
  - Wall collision detection (top/bottom boundaries)
  - Angle of incidence = angle of reflection
- **Canvas setup**:
  - 800×600 game area
  - Center line rendering
  - Score display (structure in place, logic pending Stage 3)
- **Input buffering system**:
  - Event listeners attach/detach cleanly
  - Input applied in fixed update step (prevents 1-frame lag)
  - Supports pause/unpause (P/ESC keys)

### Fixed
- Paddle rendering bug (factory functions not returning objects correctly)
- Ball rendering bug (initial velocity not set on serve)
- Canvas clear issue (trails from previous frames)

### Technical Decisions
- **Vanilla JS + ES6 modules** - No framework overhead, full control over architecture
- **Centralized state object** - Single source of truth, ready for serialization
- **Factory functions over classes** - Simpler, more functional approach for game entities
- **Named ES6 exports** - Clear module boundaries, easier to tree-shake

### Documentation
- Created TRD.md (Technical Requirements Document) with MoSCoW prioritization
- Created build-plan.md with 16-stage roadmap
- Created CLAUDE.md with architectural patterns for AI assistants
- Basic README.md with project structure and testing instructions

---

## [0.0.1] - 2025-12-18

### Added
- Initial repository setup
- Project structure scaffolding
- index.html entry point
- styles.css for basic canvas styling
- Empty module files (src/*.js)

### Documentation
- Initial TRD.md draft
- Initial build-plan.md draft

---

## Future Releases (Planned)

### [0.3.0] - Stage 3: Scoring & Win Conditions (Pending)
- Score tracking when ball exits left/right boundaries
- Win condition at 11 points
- Winner announcement screen
- Game restart functionality
- Ball re-serve with random direction

### [0.4.0] - Stage 4: Pause & Input Handling (Pending)
- Pause system (ESC/P key)
- Pause overlay with instructions
- Improved input responsiveness
- Control instructions overlay (first-time user experience)

### [0.5.0] - Stages 5-7: Game Modes (Pending)
- Landing screen with mode selection
- AI opponent for single-player mode
- Help system and instructions

### [0.8.0] - Stages 8-11: Customization (Pending)
- Settings menu system
- Paddle customization (styles, colors, sizes)
- Ball customization (styles, effects, trails)
- Difficulty adjustment sliders

### [1.0.0] - Stages 12-16: Polish & Launch (Pending)
- Sound effects system (Web Audio API)
- Visual polish and animations
- Stats tracking (optional)
- Final testing and bug fixes
- Portfolio-ready documentation and screenshots

### [2.0.0] - Online Multiplayer (Future)
- WebSocket integration
- Client-side prediction
- Server reconciliation
- Lobby system
- (Architecture already prepared for this!)

---

## Legend
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
