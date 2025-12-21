# Build Plan: Pong Redux

**Status:** 🎯 Stage 4 Complete - Pause & Input Handling Done!
**Progress:** 4 of 16 stages complete (25%)
**Target Completion:** 3-4 days (4-6 hours total per TRD.md)
**Goal:** Fully playable Pong with game modes, customization, and delight
**Reference:** TRD.md for technical requirements and architectural decisions

---

## Progress Summary

**✅ Completed (Stages 1-4)**
- Fixed-timestep game loop with accumulator pattern (60Hz)
- Paddle and ball rendering (factory functions)
- AABB collision detection with positional correction
- Swept collision guard (tunneling prevention)
- Paddle hit angle variation (50° max, 5% center deadzone)
- Comprehensive test suite (headless + browser + debug harness)
- GitHub Actions CI pipeline
- All collision tests passing ✓
- Scoring system with 0.5s serve delay
- Win condition (first to 11 points)
- Winner announcement overlay
- Restart functionality (SPACE key)
- Stage 3 automated tests passing ✓

**🚧 In Progress**
- None (ready for Stage 4)

**⏭️ Next Up**
- Stage 5: Landing Screen & Mode Selection
- Stage 5: Landing Screen & Mode Selection

---

## Context for AI Assistants

This plan takes a partially-implemented Pong rebuild and completes it with modern game features. Wayne (the developer) is testing his "Vibe Coding Workflow" - using AI tools strategically to maximize learning while building efficiently.

**Current State:**
- Fixed-timestep game loop implemented ✓
- ES6 module structure in place ✓
- Canvas renders with scores and center line ✓
- Paddles visible and controllable (W/S, Arrow keys) ✓
- Ball moves and bounces off walls ✓
- Ball bounces off paddles with angle variation ✓
- Collision system tested and validated ✓
- **Next:** Implement scoring logic and win conditions

**Target State:** 
- Fully playable classic Pong (1P vs AI, 2P local)
- Game mode selection screen
- Customizable paddles, balls, and difficulty
- Polished with sound effects and visual feedback
- Portfolio-ready demonstration of clean architecture

**Key Principles:**
- Learning through building (understand the "why" behind decisions)
- Fixed-timestep game loop is non-negotiable (TRD requirement)
- Modular architecture for future online multiplayer
- No framework overhead - vanilla JS + ES6 modules
- Scope control - resist feature creep beyond this plan

---

## AI Tool Strategy

**Maximize Claude Chat Efficiency:**
- **Claude Chat** → Strategic decisions, architecture review, debugging complex issues
- **Copilot** → Autocomplete implementations, repetitive code, CSS styling
- **Claude Code** → File operations, batch refactoring, testing workflows

**Model Recommendations by Task Type:**

| Task Type | Recommended Tool | Why |
|-----------|-----------------|-----|
| Bug investigation | Claude Chat | Analyze multiple files, trace logic flow |
| Module implementation | Copilot | Fast autocomplete for defined patterns |
| Architecture decisions | Claude Chat | Strategic thinking, trade-off analysis |
| CSS/styling | Copilot | Repetitive property definitions |
| Testing/validation | Claude Code | Run game, check console, report findings |
| Refactoring | Claude Code | Multi-file edits with context awareness |
| Code review | Claude Chat | Holistic analysis of implementation quality |

---

## Phase 1: Critical Fixes & Core Mechanics

### Stage 1: Emergency Bug Fixes 🚨
**Goal:** Get paddles and ball rendering so game is minimally playable

**AI Tool:** Claude Chat (debugging), then Copilot (fixes)

- [x] **Investigate paddle rendering failure**
  - Check if paddle.js module is properly implemented
  - Verify game-state.js initializes paddle objects correctly
  - Ensure renderer.js has paddle drawing logic
  - Check browser console for errors
- [x] **Investigate ball rendering failure**
  - Verify ball.js module exports and initialization
  - Check if ball is being served properly in index.html
  - Confirm renderer.js includes ball drawing
- [x] **Fix identified issues**
  - Implement missing paddle creation/update logic
  - Complete ball physics and rendering
  - Test that paddles respond to keyboard input (W/S, Arrow Up/Down)
- [x] **Verify core game loop**
  - Confirm fixed-timestep updates run at 60Hz
  - Check that render interpolation works
  - Validate no console errors on load

**Success Criteria:**
- Both paddles visible and controllable ✓
- Ball moves and bounces off walls ✓
- Ball bounces off paddles ✓
- No console errors ✓

**Time Estimate:** 30-60 minutes  
**Complexity:** Medium (debugging unknown issues)

---

### Stage 2: Complete Collision & Physics
**Goal:** Ball interactions feel correct and fair

**AI Tool:** Copilot (implementation), Claude Chat (edge cases)

- [x] **Verify AABB collision detection**
  - Test ball-paddle collision at various angles
  - Check ball doesn't tunnel through paddles at high speed
  - Ensure positional correction prevents sticking
- [x] **Implement paddle hit angle variation**
  - Ball deflects differently based on where it hits paddle
  - Center hits = straight bounce (center deadzone applied)
  - Edge hits = configurable max deflection (default 50°)
  - Test feels natural and predictable
- [x] **Wall bounce physics**
  - Top/bottom walls reflect ball correctly
  - Angle of incidence = angle of reflection
  - Ball speed remains constant
- [x] **Edge case handling**
  - Ball hitting paddle corner
  - Simultaneous wall + paddle collision
  - Ball spawning inside paddle (protected by re-serve)

**Success Criteria:**
- Collision detection is accurate (no tunneling) ✓
- Paddle hits feel skillful (angle control) ✓
- No weird physics glitches ✓
- Ball speed stays consistent ✓

**Notes:**
- Default tuning: **Max bounce = 50°**, **Center deadzone = 0.05 (5%)**. These values were tuned conservatively to balance control and excitement.
- Automated tests added: `test/run_collision_tests.mjs` (headless), `test/collision.unit.html` (browser), debug harness `test/collision-debug.html` (visual).
- All headless collision tests pass locally (run with `node test/run_collision_tests.mjs`).

**Time Estimate:** 45-60 minutes  
**Complexity:** Medium-High (physics nuance)

**Next step:** Playtest interactively using the debug harness and live game; iterate tuning as needed.

---

### Stage 2 — Wrap-up ✅
**Completed:** 2025-12-20

**Summary:** Stage 2 (Complete Collision & Physics) has been implemented and validated. Key deliverables:
- Accurate AABB collision detection with safe positional correction (closest-point overlap resolution)
- Swept-collision guard to prevent high-speed tunneling
- Paddle hit angle variation with a configurable max bounce (default **50°**) and **center deadzone (5%)** for forgiving center hits
- Corner-case handling for simultaneous paddle+wall collisions
- Spawn-inside-paddle protection (re-serve logic)
- Automated headless tests (`test/run_collision_tests.mjs`) and browser tests (`test/collision.unit.html`), plus an interactive debug harness (`test/collision-debug.html`)

All headless collision tests pass locally; proceed to Stage 3 (Scoring & Win Conditions).

---

### Stage 3: Scoring & Win Conditions ✅
**Goal:** Complete game loop with victory and restart

**AI Tool:** Copilot (straightforward logic)

- [x] **Implement scoring logic**
  - Ball exiting left boundary → right player scores
  - Ball exiting right boundary → left player scores
  - Score updates displayed on screen
  - Ball resets to center after each point
- [x] **Add win condition**
  - First to 11 points wins (configurable later)
  - Display winner announcement overlay
  - Game loop pauses on win
  - Clear visual indication of victory
- [x] **Restart functionality**
  - Add "Press SPACE to restart" prompt on win screen
  - Reset scores, ball position, paddle positions
  - Clear any game state flags
  - Test multiple restarts work correctly
- [x] **Serve mechanics**
  - Brief pause (0.5s) after each point
  - Ball serves in random direction (left or right)
  - Visual countdown or "Ready?" indicator optional

**Success Criteria:**
- Scoring works correctly for both players ✓
- Game ends at 11 points with clear winner ✓
- Restart clears state and starts fresh ✓
- Serving feels fair (random direction) ✓

**Time Estimate:** 45-60 minutes
**Complexity:** Low-Medium (straightforward logic)

**Actual Time:** ~40 minutes
**Completed:** 2025-12-21

---

### Stage 3 — Wrap-up ✅
**Completed:** 2025-12-21

**Summary:** Stage 3 (Scoring & Win Conditions) has been implemented and validated. Key deliverables:
- Enhanced scoring system with automatic score tracking (ball exits trigger points)
- **0.5-second serve delay** after each point - ball resets to center and waits before serving
- **Win condition**: First player to reach **11 points** wins the game
- **Game over state management** - game pauses when someone wins, preventing further gameplay
- **Winner announcement overlay** showing:
  - Large winner text ("LEFT PLAYER WINS!" or "RIGHT PLAYER WINS!")
  - Final score display
  - Restart instruction ("Press SPACE to restart")
- **Restart functionality** - SPACE key resets all game state:
  - Scores reset to 0-0
  - Paddles return to center positions
  - Ball resets to center with 0.5s serve delay
  - Game over flags cleared
- Automated test suite (`test/stage3-scoring-test.mjs`) validates all functionality
- All tests pass (6 comprehensive tests covering serve delay, win conditions, restart, etc.)

**Implementation Notes:**
- Added state fields: `gameOver`, `winner`, `serveTimer`, `winScore`
- Update loop now handles serve timer countdown and blocks gameplay when game is over
- Renderer displays game over overlay with semi-transparent background
- Input handler listens for SPACE key during game over state
- Serve delay provides natural pause after scoring (feels better than instant re-serve)
- Win score of 11 is configurable for future customization (Stage 11)

All Stage 3 automated tests pass; proceed to Stage 4 (Pause & Input Handling).

---

### Stage 4: Pause & Input Handling ✅
**Goal:** Players can pause and controls feel responsive

**AI Tool:** Copilot (event handlers)

- [x] **Implement pause system**
  - ESC or P key pauses/unpauses game ✓
  - Pause overlay shows "PAUSED" message ✓
  - Pause overlay shows control instructions ✓
  - Game state freezes (no physics updates) ✓
- [x] **Improve input responsiveness**
  - Verify input buffering works correctly ✓
  - Ensure no 1-frame input lag ✓
  - Test simultaneous key presses (both paddles) ✓
  - Smooth paddle acceleration/deceleration ✓
- [x] **Add control instructions overlay**
  - Show on first game start ✓
  - "Player 1: W/S | Player 2: Arrow Up/Arrow Down" ✓
  - "P or ESC to pause" ✓
  - Dismissible with any key press ✓
- [x] **Test on actual gameplay**
  - Paddles feel responsive and precise ✓
  - Pause doesn't cause state corruption ✓
  - Instructions are clear and helpful ✓

**Success Criteria:**
- Pause works instantly and reliably ✓
- Controls feel lag-free ✓
- Instructions help new players ✓
- No input-related bugs ✓

**Time Estimate:** 30-45 minutes  
**Complexity:** Low (mostly UI work)

---

### Stage 4 — Wrap-up ✅
**Completed:** 2025-12-21

**Summary:** Stage 4 (Pause & Input Handling) has been implemented and validated. Key deliverables:
- First-time instructions overlay with dismiss-on-key and `localStorage` persistence
- Pause system (P / ESC) with informative overlay and instruction text
- Improved input handling: simultaneous key press support and prevention of 1-frame lag
- Paddle motion smoothing (acceleration/deceleration) for better feel
- Unit tests for Stage 4 were added and all pass locally

**Implementation Notes:**
- Added `showInstructions` flag to `game-state.js`, persisted via `localStorage` as `pong:seenInstructions`
- `input.js` tracks pressed keys and computes target directions for both paddles; pressing any key dismisses instructions and prevents default scrolling for arrows/space
- `paddle.js` now supports `inputDir`, `accel`, and smooth velocity ramping
- `renderer.js` now displays the instructions overlay on first start and improved pause overlay with control hints
- Tests added: `test/stage4-pause-input-test.mjs` (instructions, pause, paddle smoothing)

All Stage 4 tests pass locally; proceed to Stage 5 (Landing Screen & Mode Selection).

---

## Phase 2: Game Modes & Menu System

### Stage 5: Landing Screen & Mode Selection (In progress)
**Goal:** Professional start screen with mode choices

**AI Tool:** Claude Chat (structure), Copilot (implementation)

- [x] **Design landing screen layout**
  - Game title: "PONG REDUX" or similar ✓
  - Subtitle: "A Classic Reimagined" or Wayne's tagline
  - Mode selection buttons:
    - "1 Player (vs CPU)" ✓
    - "2 Players (Local)" ✓
    - Settings icon/button (for Phase 3)
  - Optional: High score display (if implemented)
- [x] **Implement game state management**
  - States: LANDING, PLAYING, PAUSED, GAME_OVER ✓
  - Clean transitions between states ✓
  - State determines which screen renders ✓
- [x] **Add mode selection logic**
  - Clicking "1 Player" → sets gameMode = 'single' ✓
  - Clicking "2 Players" → sets gameMode = 'versus' ✓
  - Transition to PLAYING state ✓
  - Store selected mode in game state ✓
- [x] **Style landing screen**
  - Responsive layout (scales with canvas) ✓
  - Clear visual hierarchy ✓
  - Buttons have hover states ✓
  - Matches overall game aesthetic ✓

**Success Criteria:**
- Landing screen looks professional ✓
- Mode selection is obvious and works ✓
- Clean transition to gameplay ✓
- Players know what each mode means ✓

**Time Estimate:** 45-60 minutes  
**Complexity:** Medium (state management + UI)

---

### Stage 6: Single-Player AI Opponent
**Goal:** CPU opponent that's fun to play against

**AI Tool:** Claude Chat (AI strategy), Copilot (implementation)

- [ ] **Implement basic AI behavior**
  - CPU paddle tracks ball Y position
  - Add reaction delay (~100-150ms) for fairness
  - Add error margin (±10-20px) so CPU isn't perfect
  - CPU only tracks ball when it's moving toward CPU side
- [ ] **Create difficulty presets** (for Phase 3 settings)
  - Easy: slow reaction, large error margin
  - Medium: moderate reaction, small error margin
  - Hard: fast reaction, minimal error margin
  - Store difficulty setting in game state
- [ ] **AI movement logic**
  - Smooth movement toward target position
  - Same speed limits as player paddle
  - Doesn't teleport or cheat
  - Follows same boundary constraints
- [ ] **Test AI feel**
  - Easy mode is beatable by beginners
  - Medium mode provides good challenge
  - Hard mode is tough but not impossible
  - AI doesn't feel robotic or frustrating

**Success Criteria:**
- AI tracks ball believably ✓
- Difficulty feels adjustable ✓
- AI doesn't feel like it's cheating ✓
- Single-player mode is fun ✓

**Time Estimate:** 60-90 minutes  
**Complexity:** Medium-High (behavior tuning)

---

### Stage 7: Instructions & Help System
**Goal:** New players understand controls immediately

**AI Tool:** Copilot (UI components)

- [ ] **Create instructions overlay**
  - Shows on first game start automatically
  - Accessible via "?" or "Help" button
  - Clear, scannable layout
  - Includes visual diagrams if helpful
- [ ] **Write clear instructions**
  - Controls for both players
  - Pause/restart shortcuts
  - Scoring rules (first to 11)
  - How to change settings
- [ ] **First-time user experience**
  - Store "seen instructions" in localStorage
  - Don't show every time, but keep accessible
  - "Skip" button for returning users
  - Auto-dismiss after game starts
- [ ] **In-game hints** (optional)
  - Subtle on-screen reminders
  - "Press P to pause" during first pause
  - "Press SPACE to restart" on game over

**Success Criteria:**
- First-time users know controls instantly ✓
- Help remains accessible without clutter ✓
- Instructions are concise and clear ✓
- Returning users aren't annoyed ✓

**Time Estimate:** 30-45 minutes  
**Complexity:** Low (mostly content and UI)

---

## Phase 3: Customization & Settings

### Stage 8: Settings Menu Foundation
**Goal:** Central hub for all game customization

**AI Tool:** Claude Chat (architecture), Copilot (forms)

- [ ] **Create settings screen**
  - Accessible from landing screen
  - Icon-based button (gear/cog)
  - Clean modal or dedicated screen
  - "Back" button returns to landing
- [ ] **Organize settings into sections**
  - Gameplay (difficulty, speed, win score)
  - Appearance (paddle style, ball style, colors)
  - Audio (sound effects, volume)
  - About (credits, version, TRD link)
- [ ] **Implement settings persistence**
  - Store settings in localStorage
  - Apply settings on game start
  - Reset to defaults option
  - Settings survive page refresh
- [ ] **Build settings UI components**
  - Dropdown selectors
  - Slider controls (volume, ball speed)
  - Radio buttons (paddle styles)
  - Toggle switches (sound on/off)

**Success Criteria:**
- Settings menu is easy to navigate ✓
- Settings persist across sessions ✓
- UI controls are intuitive ✓
- Settings apply immediately or on game start ✓

**Time Estimate:** 45-60 minutes  
**Complexity:** Medium (state management + UI)

---

### Stage 9: Paddle Customization
**Goal:** Players can personalize paddle appearance

**AI Tool:** Copilot (implementation)

- [ ] **Design paddle style options**
  - Classic: Simple rectangle (default)
  - Retro: Segmented/pixelated look
  - Neon: Glowing edges effect
  - Custom: User-defined color picker
- [ ] **Implement paddle rendering variations**
  - Each style has dedicated render function
  - Styles apply to both paddles or per-player
  - Color customization (hue picker)
  - Size option (normal, wide, narrow) if not difficulty setting
- [ ] **Add paddle style selector to settings**
  - Visual preview of each style
  - Radio buttons or image selection
  - Color picker for custom option
  - Preview updates in real-time
- [ ] **Test paddle styles**
  - All styles render correctly
  - Collision detection unchanged by style
  - Styles look good against all backgrounds
  - No performance impact from custom rendering

**Success Criteria:**
- Multiple paddle styles available ✓
- Styles are visually distinct ✓
- Customization is fun and expressive ✓
- No gameplay impact from styling ✓

**Time Estimate:** 45-60 minutes  
**Complexity:** Medium (rendering variations)

---

### Stage 10: Ball Customization & Effects
**Goal:** Make ball visually interesting and customizable

**AI Tool:** Copilot (graphics), Claude Chat (performance)

- [ ] **Design ball style options**
  - Classic: White circle (default)
  - Retro: Pixelated/8-bit look
  - Glow: Neon trail effect
  - Soccer/Rugby: Textured sphere (Wayne might like rugby!)
- [ ] **Implement ball effects**
  - Optional trail effect (last 3-5 positions)
  - Collision flash on paddle/wall hit
  - Speed lines when moving fast
  - Rotation animation
- [ ] **Add ball settings to menu**
  - Style selector (visual previews)
  - Effect toggles (trail, flash, etc.)
  - Color customization
  - Effect intensity slider
- [ ] **Optimize performance**
  - Trail uses object pool (no new allocations)
  - Effects don't drop frame rate
  - Test at high ball speeds
  - Disable effects on low-end devices option

**Success Criteria:**
- Ball styles are fun and varied ✓
- Effects enhance rather than distract ✓
- No performance degradation ✓
- Customization feels personal ✓

**Time Estimate:** 60-75 minutes  
**Complexity:** Medium-High (graphics + performance)

---

### Stage 11: Difficulty & Gameplay Tweaks
**Goal:** Fine-tune game feel for different skill levels

**AI Tool:** Claude Chat (balance), Copilot (sliders)

- [ ] **Ball speed adjustment**
  - Range: 0.5x to 2.0x base speed
  - Slider control with live preview
  - Presets: Slow, Normal, Fast, Insane
  - Speed affects both modes (1P and 2P)
- [ ] **Paddle size options**
  - Range: 50% to 150% of default height
  - Visual preview of size change
  - Affects both players equally for fairness
  - Or: per-player handicap option
- [ ] **Win condition customization**
  - Selectable: 5, 7, 11, 15, 21 points
  - Default: 11 (classic table tennis)
  - Endless mode: no win condition
- [ ] **AI difficulty fine-tuning**
  - Adjust reaction time
  - Adjust error margin
  - Adjust prediction accuracy
  - Test that Hard is challenging but not impossible

**Success Criteria:**
- Difficulty options create varied experiences ✓
- Settings are balanced and fair ✓
- Sliders provide granular control ✓
- Presets work well for most users ✓

**Time Estimate:** 45-60 minutes  
**Complexity:** Low-Medium (parameter tuning)

---

## Phase 4: Polish & Delight

### Stage 12: Sound Effects System
**Goal:** Audio feedback enhances gameplay

**AI Tool:** Copilot (Web Audio API), Claude Chat (asset sourcing)

- [ ] **Find/create sound assets**
  - Paddle hit: Short "pong" or "blip"
  - Wall bounce: Slightly different tone
  - Score point: Success chime
  - Win game: Victory fanfare
  - UI click: Subtle confirmation sound
  - Free sources: freesound.org, kenney.nl, zapsplat.com
- [ ] **Implement Web Audio API**
  - Load sounds on game init
  - Play sounds on events (collision, score, etc.)
  - Volume control from settings
  - Mute toggle
- [ ] **Add sound to game events**
  - Ball hits paddle → paddle hit sound
  - Ball hits wall → wall bounce sound
  - Point scored → score sound
  - Game won → victory sound
  - UI interactions → click sounds
- [ ] **Polish audio experience**
  - Sounds don't overlap/clip
  - Volume is balanced (not too loud)
  - Mute setting persists
  - Optional: retro 8-bit sound mode

**Success Criteria:**
- Sounds enhance feedback without annoying ✓
- Volume control works properly ✓
- Audio optional (mute toggle) ✓
- Sounds match game aesthetic ✓

**Time Estimate:** 45-60 minutes  
**Complexity:** Medium (asset integration)

---

### Stage 13: Visual Polish & Animations
**Goal:** Game feels smooth and responsive

**AI Tool:** Copilot (CSS/Canvas), Claude Chat (animation strategy)

- [ ] **Improve canvas rendering**
  - Smooth paddle movement (no jitter)
  - Anti-aliasing for crisp edges
  - Consistent frame timing
  - Optional: CRT screen effect or scanlines
- [ ] **Add particle effects** (optional)
  - Particles on ball-paddle collision
  - Explosion on scoring
  - Victory confetti on win
  - Keep subtle - function over flash
- [ ] **Enhance UI transitions**
  - Fade in/out between screens
  - Button hover/press animations
  - Score counter animation
  - Smooth pause overlay appearance
- [ ] **Polish game-over screen**
  - Animated winner announcement
  - Display final score prominently
  - Rematch button with hover effect
  - Return to menu button

**Success Criteria:**
- Game feels smooth at 60fps ✓
- Animations enhance, don't distract ✓
- Transitions feel professional ✓
- Visual feedback is clear ✓

**Time Estimate:** 60-75 minutes  
**Complexity:** Medium (animation finesse)

---

### Stage 14: Scoreboard & Stats Tracking
**Goal:** Track player performance across sessions

**AI Tool:** Copilot (localStorage logic)

**Note:** Wayne identified this as potential scope creep. Evaluate time remaining before implementing.

- [ ] **Design scoreboard system**
  - Track wins per mode (1P vs 2P)
  - Track longest rally
  - Track total games played
  - Optional: track vs each AI difficulty
- [ ] **Implement stats tracking**
  - Increment stats on game end
  - Store in localStorage
  - Reset stats option in settings
  - Export stats as JSON (for portfolio)
- [ ] **Create scoreboard UI**
  - Visible on landing screen
  - Shows: "Games Won: X | Best Rally: Y"
  - Detailed stats in dedicated screen
  - Clean, minimal design
- [ ] **Stats visualization** (if time allows)
  - Simple bar charts (wins by mode)
  - Streak tracking
  - Personal bests highlighted

**Success Criteria:**
- Stats persist across sessions ✓
- Scoreboard provides motivation ✓
- Stats don't clutter main UI ✓
- Data can be reset easily ✓

**Time Estimate:** 60-90 minutes  
**Complexity:** Medium (data management)

**SCOPE DECISION:** Implement if Phases 1-3 complete with time remaining. Otherwise, defer to future version.

---

### Stage 15: Final Testing & Bug Fixes
**Goal:** Game is polished and bug-free

**AI Tool:** Claude Code (automated testing), Claude Chat (bug analysis)

- [ ] **Comprehensive gameplay testing**
  - 1-player mode: full game at each difficulty
  - 2-player mode: full game with both sides
  - Pause/resume mid-game
  - Restart from various states
  - Settings changes apply correctly
- [ ] **Edge case testing**
  - Rapid paddle movement near boundaries
  - Ball hitting paddle corner
  - Simultaneous key presses
  - Quick mode switches
  - Settings persistence after refresh
- [ ] **Browser compatibility**
  - Test in Chrome, Firefox, Safari
  - Check mobile browser behavior
  - Verify canvas scales properly
  - Test fullscreen if implemented
- [ ] **Performance validation**
  - Solid 60fps throughout
  - No garbage collection spikes
  - Memory usage stable over time
  - Test on lower-end hardware
- [ ] **Fix discovered bugs**
  - Prioritize game-breaking issues
  - Document known minor issues
  - Test fixes don't introduce new bugs

**Success Criteria:**
- Zero game-breaking bugs ✓
- Performance is smooth everywhere ✓
- All modes work as expected ✓
- Ready to show publicly ✓

**Time Estimate:** 60-90 minutes  
**Complexity:** Variable (depends on bugs found)

---

### Stage 16: Documentation & Portfolio Prep
**Goal:** Project is showcase-ready

**AI Tool:** Claude Chat (documentation), Copilot (README)

- [ ] **Update project documentation**
  - README.md: Add screenshots, feature list
  - CLAUDE.md: Document final architecture
  - Add CHANGELOG.md with version history
  - Link to live demo (if deployed)
- [ ] **Take portfolio screenshots**
  - Landing screen with game modes
  - Gameplay action shot (mid-rally)
  - Settings screen showing customization
  - Victory screen
  - Mobile viewport if responsive
- [ ] **Create comparison analysis**
  - Compare to original PongClone repo
  - Document architectural improvements
  - Metrics: Lines of code, modularity, features
  - Learning outcomes from rebuild
- [ ] **Prepare demo/showcase**
  - Deploy to GitHub Pages or similar
  - Create 30-second video demo (optional)
  - Write blog post about rebuild (optional)
  - Share with feedback group

**Success Criteria:**
- Documentation tells project story ✓
- Screenshots show off best features ✓
- Comparison demonstrates growth ✓
- Ready for portfolio inclusion ✓

**Time Estimate:** 45-60 minutes  
**Complexity:** Low (content creation)

---

## Definition of Done

### ✅ Must Have (Playable & Portfolio-Ready)
- [ ] Game renders correctly (paddles, ball, scores visible)
- [ ] 1-player mode (vs AI) is fully functional
- [ ] 2-player local mode works smoothly
- [ ] Win condition and restart work properly
- [ ] Pause/resume functionality works
- [ ] Settings menu with at least 2 customization options
- [ ] Sound effects (or mute option if skipped)
- [ ] No critical bugs or console errors
- [ ] Documentation updated with screenshots

### 🎯 Success Indicators
- A friend can play without asking questions
- Wayne feels proud showing this to other developers
- Architecture demonstrates learning from TRD Phase 1
- Code is modular and well-commented
- Portfolio screenshot clearly shows polished work
- Comparison to v1 shows measurable improvement

### 🚀 Nice to Have (Time Permitting)
- Scoreboard and stats tracking (Stage 14)
- Particle effects on collisions
- Multiple ball/paddle customization options
- Mobile touch controls
- Difficulty progression (ball speeds up over time)
- Easter eggs or hidden features

### 🚫 Out of Scope (Don't Chase)
- Online multiplayer (architecture prepared, but not implemented)
- Leaderboard with cloud sync
- Multiple game variations (breakout, etc.)
- Advanced AI with machine learning
- Custom level editor
- Social sharing integration
- Dark mode variants

---

## Notes for Mid-Build Adjustments

**If you get stuck:**
- Review TRD.md for architectural constraints
- Check browser console for specific errors
- Test in isolation: create minimal reproduction
- Reference CLAUDE.md for implementation patterns
- Ask Wayne before abandoning planned approach

**If something feels wrong:**
- Does it violate fixed-timestep requirement?
- Is module responsibility unclear?
- Would this break future multiplayer architecture?
- Is there a simpler implementation?
- Does it align with learning goals?

**Current tech stack:**
- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas API
- CSS for UI overlays
- No frameworks or libraries
- Web Audio API for sound

**Design principles:**
- Fixed timestep is non-negotiable
- Centralized state (single source of truth)
- AABB collision detection
- No object allocation in game loop
- Learning over speed (understand decisions)

---

## How to Use This Plan

**For Wayne:**
1. Start with Phase 1 (Critical Fixes) - game must work first
2. Complete stages in order unless dependencies allow flexibility
3. Check success criteria before moving to next stage
4. Update time estimates based on actual progress
5. Scope decision on Stage 14 (scoreboard) based on time remaining
6. Track workflow effectiveness for TRD comparison analysis

**For AI Assistants:**
1. Wayne will specify which stage to execute
2. Use recommended AI tool for that stage
3. Complete all checkboxes in that stage
4. Verify success criteria are met
5. Report completion, time taken, and any issues
6. Wait for instruction before proceeding to next stage

**AI Tool Usage:**
- **Claude Chat:** Architecture, debugging, strategy, complex analysis
- **Copilot:** Implementation, autocomplete, CSS, repetitive code
- **Claude Code:** File operations, batch edits, testing workflows

**Flexibility:**
- Phase 1 Stages 1-4 must be done in order (dependencies)
- Phase 2 can be reordered slightly
- Phase 3 stages are mostly independent
- Phase 4 stages can be prioritized based on time/interest
- Stage 14 (scoreboard) is optional based on time budget
- Quality over features - better to do fewer stages well

---

**Status Tracking:**
- Update checkbox status: ⬜ → 🚧 → ✅
- Mark stages: `⬜` (not started), `🚧` (in progress), `✅` (complete), `⏭️` (skipped)
- Update overall plan status when major phases done

**Current Phase:** Phase 1 - Critical Fixes & Core Mechanics  
**Next Stage:** Stage 1 - Emergency Bug Fixes 🚨  
**Estimated Total Time:** 16-23 hours (TRD estimated 4-6, this plan is more ambitious)

---

## Quick Reference: Stage Complexity & AI Tools

| Stage | Complexity | Time Est. | Best AI Tool | Priority |
|-------|-----------|-----------|--------------|----------|
| 1. Bug Fixes | Medium | 30-60m | Claude Chat | CRITICAL |
| 2. Collision | Med-High | 45-60m | Copilot + Claude | CRITICAL |
| 3. Scoring | Low-Med | 45-60m | Copilot | CRITICAL |
| 4. Pause/Input | Low | 30-45m | Copilot | CRITICAL |
| 5. Landing Screen | Medium | 45-60m | Claude + Copilot | HIGH |
| 6. AI Opponent | Med-High | 60-90m | Claude Chat | HIGH |
| 7. Instructions | Low | 30-45m | Copilot | HIGH |
| 8. Settings Menu | Medium | 45-60m | Claude Chat | MEDIUM |
| 9. Paddle Custom | Medium | 45-60m | Copilot | MEDIUM |
| 10. Ball Custom | Med-High | 60-75m | Copilot + Claude | MEDIUM |
| 11. Difficulty | Low-Med | 45-60m | Claude Chat | MEDIUM |
| 12. Sound FX | Medium | 45-60m | Copilot | LOW |
| 13. Visual Polish | Medium | 60-75m | Copilot | LOW |
| 14. Scoreboard | Medium | 60-90m | Copilot | OPTIONAL |
| 15. Testing | Variable | 60-90m | Claude Code | CRITICAL |
| 16. Documentation | Low | 45-60m | Claude Chat | HIGH |

**Critical Path:** Stages 1-4, 15, 16 (minimum viable product)  
**Full Featured:** All stages except 14  
**Deluxe Edition:** All stages including 14
