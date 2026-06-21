<!-- CLEO:START -->
@.cleo/templates/AGENT-INJECTION.md
<!-- CLEO:END -->
# CLAUDE.md — pong-redux

## Session Start Protocol

1. Read `NOW.md` — current task and next action
2. If you need the WHY or prior decisions: `C:/Users/kenho/Obsidian/Second Brain/Projects/Pong-Redux/`
   - `MANDATE.md` — why the project exists, what success looks like
   - `DECISIONS.md` — architectural choices and reasoning
3. Read the relevant source files — most sessions only need NOW.md + code

Commands: `/park` (session end), `/decide` (capture a decision), `/idea` (capture an idea)

---

## Project Overview

Vanilla JS Pong rebuild. Core patterns: ES6 modules, fixed-timestep game loop, centralized state, AABB collision detection. Architecture designed to support future online multiplayer (state serialization, input buffering).

## Running the Game

No build system. Open `index.html` in a browser or serve locally:
- `npx http-server .`
- `npx serve .`
- VS Code Live Server (Go Live)

---

## Architecture

**Fixed-Timestep Game Loop** (`src/main.js:8-44`)
- `requestAnimationFrame` with accumulator pattern
- Fixed rate: 60Hz (16.67ms per update)
- Physics updates separated from rendering
- Delta capped at 250ms (spiral-of-death protection)

**Centralized Game State** (`src/game-state.js`)
- Single source of truth — all entities in one serializable object
- `serialize()` function ready for future networking
- Update logic separated from rendering

**Collision System** (`src/collision.js`)
- AABB circle-rectangle collision detection
- Post-collision positional correction prevents tunneling/sticking
- Resolves penetration along minimal axis

**Input Buffering** (`src/input.js`)
- Event listeners attach/detach to prevent memory leaks
- Input applied in fixed update step, not render loop
- Keys: W/S (left paddle), Arrow Up/Down (right paddle), P/ESC (pause), M (settings toggle)

**Module Structure**
- `main.js` — entry point, game loop
- `game-state.js` — state management and update logic
- `paddle.js` — paddle entity and movement
- `ball.js` — ball entity, physics, serving, bounce angle
- `collision.js` — circle-rect collision detection and resolution
- `renderer-core.js` — canvas setup and shared drawing utilities
- `renderer-game.js` — gameplay rendering (ball, paddles, particles, effects)
- `renderer-menu.js` — landing screen, settings panel, game over UI
- `input.js` — keyboard and mouse handlers
- `ai.js` — CPU opponent with configurable difficulty
- `sound.js` — procedural Web Audio synthesis
- `rugby.js` — Rugby mode physics engine (opt-in, isolated)

---

## Key Implementation Details

**Ball Reflection** (`src/ball.js:52-60`)
- Bounce angle varies by hit offset from paddle center
- Max deflection: 60 degrees
- Preserves ball speed on reflection

**Paddle Movement** (`src/paddle.js:16-25`)
- Velocity: directional (-1, 0, 1) or continuous (px/s)
- Clamped to canvas bounds
- Position stored as center Y; rendering adjusts by half-height

**Collision Detection** (`src/collision.js:8-21`)
- Closest point on rectangle to circle center
- Distance to closest point ≤ ball radius = collision
- Paddle Y is center, so rect bounds = `y ± h/2`

**Scoring** (`src/game-state.js:57-67`)
- Ball exits left → right player scores
- Ball exits right → left player scores
- Ball resets to center with random serve direction

---

## Common Pitfalls

- Ball tunneling through paddles: positional correction must run after collision (`src/game-state.js:48,53`)
- Ball sticking to paddle: set ball X explicitly after reflection
- Input lag: never read input inside render loop — apply in fixed update
- Frame-rate dependent physics: always use fixed timestep, not raw deltaTime
- Spiral of death: delta cap in `src/main.js:31`

---

## Debugging Tips

- DevTools → Performance: profile frame times and GC spikes
- Throttle CPU in DevTools to test fixed timestep behaviour
- Increase ball speed temporarily to reproduce collision edge cases
- `console.log` in `collision.js` and `ball.js` to inspect collision responses
- DevTools → click inspection for button hit area issues
