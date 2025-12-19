# TRD - Technical Requirements Document
## Project Overview

**Project Name:** Pong Rebuild (Learning Exercise)  
**Primary Goal:** Test "Vibe Coding Workflow" effectiveness on bounded project  
**Time Budget:** 4-6 hours  
**Tech Stack:** HTML/CSS/JavaScript with modular architecture  
**Framework Recommendation:** **Vanilla JS with ES6 modules** (scalable to WebSocket integration for online play)

**Why Vanilla JS + Modules:**

- Zero framework overhead for 4-6 hour window
- Clear separation of concerns prepares for online enhancement
- Easy to add libraries (Socket.io) without refactoring core architecture
- Full transparency for comparing v1 vs v2 technical decisions

---

## MVP Requirements (MoSCoW Prioritization)

### MUST HAVE - Core Gameplay

**REQ-001: Game Canvas Rendering**

- **Given** the game loads
- **When** the canvas initializes
- **Then** a 800x600px game area displays with center line
- **Acceptance Criteria:**
    - Canvas scales responsively (stretch goal: maintain aspect ratio)
    - Clear visual distinction between game area and background
    - 60 FPS target render loop

**REQ-002: Paddle Control (Keyboard)**

- **Given** the game is running
- **When** player presses W/S keys (Player 1) or Up/Down arrows (Player 2)
- **Then** corresponding paddle moves up/down at consistent speed
- **Acceptance Criteria:**
    - Smooth movement (no stuttering)
    - Paddles cannot move beyond canvas boundaries
    - Input feels responsive (<16ms lag)

**REQ-003: Ball Physics**

- **Given** the game starts
- **When** the ball is served
- **Then** ball moves at constant velocity with reflection physics
- **Acceptance Criteria:**
    - Ball bounces off top/bottom walls at correct angles
    - Ball bounces off paddles with angle variation based on hit location
    - Ball speed remains constant (no acceleration in MVP)
    - Collision detection works at paddle edges and center

**REQ-004: Scoring System**

- **Given** the ball exits left or right boundary
- **When** the point is scored
- **Then** score increments for appropriate player and ball resets to center
- **Acceptance Criteria:**
    - Score displays clearly on screen
    - Ball resets with random direction (left or right)
    - Game pauses briefly (0.5s) before next serve

**REQ-005: Win Condition**

- **Given** a player reaches 11 points
- **When** the score updates
- **Then** game ends and displays winner
- **Acceptance Criteria:**
    - Clear "Player X Wins" message
    - Option to restart game
    - Scores reset on new game

---

### SHOULD HAVE - Polish & Modes

**REQ-006: Single-Player AI Opponent**

- **Given** player selects single-player mode
- **When** game starts
- **Then** CPU controls one paddle with basic AI
- **Acceptance Criteria:**
    - AI tracks ball Y position with slight delay/error
    - AI difficulty is beatable but challenging
    - AI paddle follows same movement rules as player

**REQ-007: Game State Management**

- **Given** the game is running
- **When** player presses ESC or P
- **Then** game pauses/unpauses cleanly
- **Acceptance Criteria:**
    - Pause screen displays instructions
    - Game state freezes (no physics updates)
    - Resume continues from exact game state

**REQ-008: Sound Effects**

- **Given** gameplay events occur
- **When** ball hits paddle/wall or point scores
- **Then** appropriate sound plays
- **Acceptance Criteria:**
    - Distinct sounds for paddle hit, wall hit, score
    - Sounds don't overlap/clip
    - Optional mute toggle

---

### COULD HAVE - Enhancements

**REQ-009: Ball Speed Progression**

- After each rally of 5+ hits, ball speed increases by 5%
- Caps at 150% of starting speed

**REQ-010: Visual Polish**

- Particle effects on ball collision
- Paddle glow on successful hit
- Trail effect behind ball

**REQ-011: Touch/Mobile Controls**

- Touch-drag paddle movement
- Responsive canvas sizing

**REQ-012: Online Multiplayer Foundation**

- Separate rendering from game state logic
- State serialization/deserialization
- Input buffering architecture
- _(Full implementation out of scope, but architecture should support)_

---

## Technical Constraints

### Architecture Decisions (IMPORTANT)

**MUST DECIDE CAREFULLY:**

1. **Game Loop Architecture** - Use `requestAnimationFrame` with fixed timestep
    
    - _Why it matters:_ Affects collision accuracy and online sync later
    - _Pitfall:_ Variable timestep causes physics bugs
2. **State Management Pattern** - Single source of truth object
    
    - _Why it matters:_ Simplifies debugging and future state sync
    - _Pitfall:_ Scattered state makes online play impossible
3. **Collision Detection Method** - AABB (Axis-Aligned Bounding Box)
    
    - _Why it matters:_ Affects feel of gameplay
    - _Pitfall:_ Circle collision feels better but adds complexity

**CAN BE SIMPLE:**

- Rendering (direct Canvas 2D API calls)
- Input handling (basic event listeners)
- Score display (DOM element overlay)

### File Structure

```
/pong-rebuild
├── index.html
├── styles.css
├── src/
│   ├── main.js           (entry point, game loop)
│   ├── game-state.js     (state management)
│   ├── paddle.js         (paddle entity)
│   ├── ball.js           (ball entity + physics)
│   ├── collision.js      (detection logic)
│   ├── ai.js             (computer opponent)
│   ├── renderer.js       (canvas drawing)
│   └── input.js          (keyboard/touch handlers)
└── assets/
    └── sounds/
```

---

## Implementation Phases

### Phase 1: Foundation (60-90 min)

**Goal:** Render game area, movable paddles

**Tasks:**

- Set up HTML canvas and module structure
- Implement game loop with `requestAnimationFrame`
- Create Paddle class with position/velocity
- Render paddles and center line
- Add keyboard input for both paddles

**Learning Checkpoint:**

- Is the game loop architecture clear and maintainable?
- How easy is it to add new entities?

**Common Pitfalls:**

- Forgetting to clear canvas each frame (creates trails)
- Not capping paddle position (moves off-screen)
- Mixing rendering and logic in same function

---

### Phase 2: Physics & Ball (60-90 min)

**Goal:** Ball moves and bounces correctly

**Tasks:**

- Create Ball class with velocity vector
- Implement wall collision detection
- Implement paddle collision detection
- Add angle variation based on paddle hit location
- Test edge cases (corner hits, high-speed collisions)

**Learning Checkpoint:**

- Are collision detection bugs easy to diagnose?
- How well separated are physics from rendering?

**Common Pitfalls:**

- Ball "sticks" to paddle (missing post-collision position adjustment)
- Ball tunnels through paddles at high speed (no continuous collision)
- Inconsistent bounce angles feel random

---

### Phase 3: Scoring & Game Flow (45-60 min)

**Goal:** Complete playable game loop

**Tasks:**

- Implement score tracking
- Add ball reset logic
- Create win condition check
- Add game state transitions (start → playing → ended)
- Display UI for scores and win screen

**Learning Checkpoint:**

- Is game state management intuitive?
- How easy is it to add new states (like pause)?

**Common Pitfalls:**

- Not resetting ball velocity on serve (causes speed drift)
- Win screen doesn't stop game loop (ball keeps moving)
- No way to restart without page refresh

---

### Phase 4: AI & Polish (60-90 min)

**Goal:** Single-player mode and quality-of-life features

**Tasks:**

- Implement basic AI (tracks ball Y with error margin)
- Add pause functionality
- Integrate sound effects (Web Audio API or HTML5 Audio)
- Add mode selection screen (1P vs 2P)
- Visual polish (smoother animations, better fonts)

**Learning Checkpoint:**

- How modular is the AI? Could you swap in different difficulty levels?
- Are enhancement features cleanly separated from core logic?

**Common Pitfalls:**

- AI too perfect (no fun) or too broken (too easy)
- Sound loading blocks game start
- Mode switching doesn't reset game state properly

---

## Learning Opportunities by Phase

|Phase|Technical Concepts|Workflow Observations|
|---|---|---|
|1|Module organization, event loops, input buffering|How well does AI handle architectural setup?|
|2|Vector math, collision geometry, frame-independent physics|Do AI suggestions match your mental model?|
|3|State machines, UI/game separation|How clear are requirements for AI?|
|4|Behavior trees (simple), asset loading, progressive enhancement|Where does AI excel vs require guidance?|

---

## Definition of Done

### Functional Criteria

- [ ] Two paddles move smoothly via keyboard
- [ ] Ball bounces realistically off walls and paddles
- [ ] Score tracks correctly for both players
- [ ] Game ends at 11 points with clear winner display
- [ ] Game can be restarted without page refresh
- [ ] Single-player mode vs basic AI works
- [ ] No console errors or visual glitches
- [ ] Game runs at stable 60 FPS

### Technical Criteria

- [ ] Code is modular (ES6 modules with clear responsibilities)
- [ ] Game state is centralized and serializable
- [ ] Fixed timestep game loop implemented
- [ ] Collision detection is accurate (no tunneling)
- [ ] All "MUST HAVE" requirements met
- [ ] At least 2 "SHOULD HAVE" features implemented

### Comparison Metrics (for v1 vs v2 analysis)

**Quantitative:**

- Lines of code (total and per module)
- Number of functions/classes
- Cyclomatic complexity (VS Code extensions can measure)
- Time to implement each phase
- Number of bugs encountered during development
- Number of AI interactions required

**Qualitative:**

- Code readability (self-assessed 1-10)
- Architecture clarity (could you onboard someone in 5 min?)
- Gameplay feel (responsiveness, fairness, fun)
- Confidence in extending codebase (add features easily?)
- AI workflow effectiveness (helpful vs hindering?)

---

## Common Pitfalls in Game Loop Development

⚠️ **Variable Timestep Issues**

- Problem: Using raw `deltaTime` makes physics frame-rate dependent
- Solution: Fixed timestep with accumulator pattern
- Detection: Test at different frame rates (throttle in DevTools)

⚠️ **Collision Detection Tunneling**

- Problem: Fast-moving ball passes through paddle between frames
- Solution: Continuous collision (raycast) or smaller time steps
- Detection: Increase ball speed to 3x normal

⚠️ **State Mutation Chaos**

- Problem: Multiple places modify same state (ball position, scores)
- Solution: Single state object with controlled update functions
- Detection: Bugs that "shouldn't be possible" (score jumps, ball teleports)

⚠️ **Rendering Performance**

- Problem: Creating new objects each frame (garbage collection spikes)
- Solution: Object pooling or reuse existing objects
- Detection: FPS drops after playing for 2+ minutes

⚠️ **Input Lag**

- Problem: Reading input inside render loop causes 1-frame delay
- Solution: Buffer inputs, process in fixed update step
- Detection: Paddles feel "mushy" or unresponsive

---

## Workflow Testing Notes

This rebuild is explicitly designed to test your "Vibe Coding Workflow." Document:

1. **AI Handoff Quality:** Which requirements were clear enough for immediate coding?
2. **Iteration Speed:** How quickly could you validate phases?
3. **Scope Control:** Did MoSCoW prioritization prevent scope creep?
4. **Learning Clarity:** Were learning checkpoints useful for reflection?
5. **Comparison Value:** Does this doc give you enough to measure v1 vs v2?

**Suggested Workflow:**

- Phase 1-2: Claude for architecture decisions, Copilot for implementation
- Phase 3: Pure Copilot (test if requirements are self-sufficient)
- Phase 4: Your choice (see which feels faster)

---

## Quick Start Checklist

Ready to code? Verify:

- [ ] Requirements doc saved and accessible
- [ ] VS Code open with file structure created
- [ ] Claude/Copilot configured
- [ ] Timer ready (track actual vs estimated phase times)
- [ ] Blank comparison notes doc for observations

**First Prompt to AI:** "I'm building Pong. Phase 1 goal: render canvas with movable paddles. Set up game loop using requestAnimationFrame with fixed timestep. Here's my file structure: [paste structure]. Start with main.js and game-state.js."

---

**Confidence Statement:** High confidence this document provides sufficient detail for immediate implementation while maintaining learning focus and workflow testing objectives. The requirements are testable, prioritized, and scoped for 4-6 hours with clear extension paths.