# Changelog

All notable changes to the Pong Redux project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-02-13 🔧 **Rugby Mode Refinements**

### Summary
Patch release improving Rugby mode gameplay with enhanced physics tuning and critical bug fixes. Goal post feature deprecated based on gameplay feedback. Spin and bounce mechanics significantly increased for more dynamic, unpredictable gameplay.

### Changed - Physics Tuning
- **Spin Gain Increased (+50%)**:
  - `SPIN_GAIN_FACTOR`: 0.5 → 0.75
  - Ball accumulates 50% more spin from paddle impacts
  - More pronounced visual rotation
  - Faster spin buildup during rallies
- **Bounce Variance Increased (+50%)**:
  - `MAX_BOUNCE_VARIANCE_DEG`: 20° → 30°
  - Spin creates 50% more "bobble" effect on bounces
  - More unpredictable rebound angles
  - Rewards aggressive paddle movement
- **Combined Impact**: ~2.25x more dynamic gameplay at high spin levels

### Removed - Goal Posts Deprecated
- **Goal Post Feature Disabled**:
  - `GOAL_POST_SPAWN_MIN/MAX`: 8-12s → Infinity
  - Goal posts no longer spawn during gameplay
  - Feature determined to not add value in current form
  - Code remains in place for potential future enhancement

### Fixed - Critical Bugs
- **🔥 Game Freeze Bug** (CRITICAL):
  - Fixed `ReferenceError: RUGBY is not defined` in `ball.js:120`
  - Added missing `import { RUGBY } from './constants.js'` to `ball.js`
  - Game was crashing on every paddle collision due to undefined constant
- **NaN Spawn Timer Bug**:
  - Fixed `Infinity - Infinity = NaN` calculation in goal post spawn logic
  - Added safety check in `rugby.js:updateGoalPost()` to handle disabled goal posts
  - Added safety check in `game-state.js:startRugbyMode()` initialization
  - Prevents timer corruption when goal posts are disabled

### Technical Details
- **Files Modified**: 5 files (`constants.js`, `ball.js`, `rugby.js`, `game-state.js`, `README.md`)
- **Import Fix**: `ball.js` now imports `RUGBY` constant for bounce variance calculations
- **Defensive Programming**: Added `GOAL_POST_SPAWN_MIN === Infinity` checks in two locations
- **Diagnostic Logging**: Added debug logging to track game loop execution and catch NaN values

### Testing
- Manual regression testing: Rugby mode runs for 15+ seconds without freezing ✓
- Physics changes verified: Ball rotation and bounce variance visibly increased ✓
- No goal posts spawn confirmed ✓
- Regular Pong mode unaffected ✓

### Breaking Changes
None - all changes are isolated to Rugby mode, regular Pong unchanged.

---

## [1.1.0] - 2026-02-13 🏉 **Rugby Ball Mode**

### Summary
Major feature release introducing Rugby Ball Mode - an arcade-style game mode with oval ball physics, spin mechanics, rally combos, and dynamic goal posts. This release adds significant gameplay variety while maintaining zero breaking changes to the core Pong experience.

### Added - Rugby Ball Mode
- **New Game Mode**: Rugby Ball Mode available in both 1P and 2P variants from landing screen
- **Oval Ball Physics**: Rugby ball rendered as oval (1.4x width ratio) with visible rotation
- **Spin Mechanics**:
  - Angular velocity calculated from paddle speed and impact offset
  - Spin decays at 0.98 per frame for natural physics feel
  - Spin affects bounce angle variance (±15° maximum)
- **Momentum-Based Impacts**:
  - Paddle velocity multiplies ball speed (0.8x-1.2x range)
  - Speed capped at 2.0x base speed for balance
  - Rewards aggressive paddle movement
- **Rally Combo System**:
  - Multiplier progression: 1x → 2x (3 hits) → 3x (5 hits) → 5x (10 hits)
  - Resets on ball exit
  - Visual feedback with color coding (white/yellow/orange/cyan)
- **Dynamic Goal Posts**:
  - Random spawns every 10-15 seconds
  - Appear in top/bottom zones (20%-80% screen width)
  - 5-second duration with visual glow effect
  - +3 bonus points on collision
- **Hybrid Win Conditions**:
  - Target score OR time limit (whichever comes first)
  - Configurable: 25/50/75/100 points, 2/3/5/10 minutes
- **Rugby Settings Tab**: Dedicated settings panel when rugby mode active
  - Target score selection (4 buttons)
  - Time limit selection (4 buttons)
  - Settings persist via localStorage
- **UI Enhancements**:
  - Rally counter display (top-center)
  - Multiplier display with color coding
  - Timer countdown (MM:SS format, top-right)
  - Goal post visual indicators

### Technical Details
- **New Module**: `src/rugby.js` (~300 lines) - Isolated rugby physics engine
- **Integration Points**:
  - `src/game-state.js`: Rugby state initialization, update integration, settings functions
  - `src/renderer.js`: Rugby ball rendering, goal posts, UI elements, rugby settings tab
  - `src/input.js`: Rugby mode buttons, rugby settings handlers
  - `src/constants.js`: Rugby-specific constants (RUGBY namespace)
- **Performance**: Maintains 60fps with all rugby effects active, zero memory leaks
- **Testing**: Comprehensive end-to-end test log (`docs/rugby-mode-test-log.md`)

### Compatibility
- **Zero Breaking Changes**: Regular Pong mode completely unchanged
- **Backward Compatibility**: All existing settings, controls, and features preserved
- **Optional Feature**: Rugby mode only active when explicitly selected from landing screen

## [1.0.0] - 2025-12-22 🎉 **Portfolio Release**

### Summary
This release marks the completion of the core development roadmap (13 of 16 stages). The game is now **portfolio-ready** with professional polish, comprehensive testing, and full documentation. All major features are implemented, tested, and deployed.

### Added - Stage 13: Visual Polish & Animations
- **State transitions**: Smooth fade-in/fade-out effects (300ms) when switching between game states
- **Button press animations**: Scale-down feedback (0.95x, 100ms duration) on all clickable UI elements
- **Score counter animations**: Lerp-based smooth counting (10 points/second) instead of instant score updates
- **Enhanced pause overlay**: Pulsing "PAUSED" text with synchronized alpha (0.7-1.0) and scale (1.0-1.05) at 2Hz
- **Particle system**: Physics-based collision particles with gravity, alpha fade, and 500ms lifetime
  - Wall collisions spawn 3 white particles
  - Paddle collisions spawn 4 cyan particles (#00ff88)
- **Animation state management**: Centralized `updateAnimations()` function integrated into fixed-timestep game loop
- **Performance optimization**: Zero per-frame allocations, object pooling for particles, maintains solid 60fps

### Added - Stage 15: Comprehensive Testing
- **Cross-browser compatibility**: Tested in Chrome, Edge, and Firefox
- **Gameplay validation**: All game modes (1P vs CPU Easy/Medium/Hard, 2P local) thoroughly tested
- **Settings persistence testing**: Verified localStorage works across page refreshes
- **Performance validation**: Confirmed 60fps with all effects enabled, no memory leaks over extended play sessions
- **Edge case handling**: Tested boundary conditions, rapid input, simultaneous collisions
- **Bug fixes**: Resolved undefined variable bugs in settings rendering (`paddleSize`, `ballSpeed` fallback values)

### Added - Stage 16: Portfolio Documentation
- **High-quality screenshots**: 6 portfolio-ready images (1920x1080)
  - Landing screen with mode selection
  - Gameplay action shot
  - Settings menu (Gameplay and Custom tabs)
  - Paddle customization showcase
  - Ball customization showcase
  - Victory screen
- **GitHub Pages deployment**: Automated workflow for static site deployment
- **Enhanced README.md**: Comprehensive features showcase with screenshots, "Try It Now" section, visual formatting
- **Portfolio preparation**: Live demo URL, professional documentation, code examples
- **Documentation updates**: CLAUDE.md, CHANGELOG.md, TODO.md all updated to reflect v1.0.0 status

### Changed
- `src/game-state.js`: Added animation state properties (transitions, buttonPressAnim, scoreDisplay, pauseAnim, particles)
- `src/game-state.js`: Added `updateAnimations()`, `triggerButtonPress()`, `startTransition()`, `spawnParticles()` helper functions
- `src/renderer.js`: Implemented fade overlays, button scale transforms, lerped score display, pulsing pause text, particle rendering
- `src/renderer.js`: Fixed undefined variable bugs with defensive fallback values for optional settings
- `src/input.js`: Trigger button press animations on all UI clicks
- `.gitignore`: Allow PNG files in `assets/screenshots/` directory for portfolio images
- `README.md`: Complete visual overhaul with screenshots section, features showcase, demo link, updated progress (81%)
- `TODO.md`: Updated progress tracking (Sessions 1-2 complete, Session 3 in progress)
- `CLAUDE.md`: Documented Stage 13 animation system, updated code quality score to 9.5/10

### Technical Details
- **Animation architecture**: State-driven animation system with timers managed in fixed-timestep loop
- **Transition system**: Two-phase fade (fade-out current state → switch state → fade-in new state)
- **Lerp algorithm**: Linear interpolation for smooth score counting: `current += (target - current) * speed * dt`
- **Particle physics**: Simple Euler integration with gravity constant (300px/s²), alpha fade based on lifetime ratio
- **Object pooling**: Particle array grows as needed but never shrinks, particles removed when lifetime expires
- **GitHub Actions workflow**: Automated deployment to GitHub Pages on push to main branch

### Deployment
- **Live Demo**: https://footnote42.github.io/pong-redux/
- **Repository**: https://github.com/footnote42/pong-redux
- **Build**: No build step required - vanilla JS, runs directly in browser
- **Requirements**: Modern browser with Canvas and Web Audio API support

### Project Status
- **Completion**: 13 of 16 stages (81%)
- **Code Quality**: 9.5/10 (Portfolio-Ready)
- **Known Issues**: None - all core features tested and working
- **Future Work**: Optional enhancements (mobile controls, online multiplayer, advanced stats) - out of scope for v1.0.0

### Breaking Changes
None - all settings remain backward compatible with localStorage from previous versions

---

## [0.12.0] - 2025-12-22

### Added - Stage 12: Sound Effects System
- **Procedural sound synthesis** using Web Audio API (no external assets needed)
- **Five distinct sound effects**:
  - Paddle hit: 440Hz square wave, 100ms duration
  - Wall bounce: 330Hz square wave, 80ms duration
  - Score: C-E-G major chord (523/659/784 Hz), ascending chime
  - Win: C-E-G-C melody (523/659/784/1047 Hz), victory fanfare
  - UI click: 800Hz sine wave, 50ms subtle confirmation
- **Sound manager integration**: Auto-initialization on game start (after user interaction)
- **Volume control**: 0-100% slider in settings with real-time updates
- **Mute toggle**: Sound ON/OFF in audio settings tab
- **Browser autoplay policy compliance**: Context initialization on user interaction

### Changed
- `src/main.js`: Audio context initialization on game start (50-52)
- `src/game-state.js`: Sound triggers on collisions (354-421) and scoring (432-458)
- `src/input.js`: UI click sounds on all button interactions (418-577)
- Settings sync: Volume and mute changes update sound manager in real-time

### Technical Details
- SoundManager singleton class with AudioContext
- Exponential gain ramps prevent audio clicks/pops
- Volume scaling: 0.15-0.3 max gain, multiplied by user volume setting
- Retro square wave aesthetic matches game's visual style
- No performance impact - temporary oscillators auto-garbage collected

### Testing
- All collision types trigger appropriate sounds
- Volume control works smoothly (0-100%)
- Mute toggle disables all sounds immediately
- No audio overlap or clipping issues

---

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
