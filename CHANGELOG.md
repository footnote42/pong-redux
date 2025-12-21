# Changelog

All notable changes to the Pong Redux project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
