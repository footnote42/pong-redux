# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vanilla JS Pong rebuild as a learning exercise. Core architectural patterns: ES6 modules, fixed-timestep game loop, centralized state, AABB collision detection. The architecture is designed to support future online multiplayer (state serialization, input buffering).

## Running the Game

No build system required. Run by opening `index.html` in a browser or serve locally:
- `npx http-server .`
- `npx serve .`
- VS Code Live Server extension (Go Live)

## Architecture

**Fixed-Timestep Game Loop** (src/main.js:8-44)
- Uses `requestAnimationFrame` with accumulator pattern
- Fixed update rate: 60Hz (16.67ms per update)
- Separates physics updates from rendering
- Critical for deterministic physics and future network sync
- Includes "spiral of death" protection (250ms cap on delta time)

**Centralized Game State** (src/game-state.js)
- Single source of truth: all game entities in one serializable object
- State includes: paddles, ball, scores, dimensions, pause flag
- Update logic separated from rendering
- `serialize()` function prepares for future networking features

**Collision System** (src/collision.js)
- AABB circle-rectangle collision detection
- Post-collision positional correction to prevent tunneling/sticking
- Resolves penetration along minimal axis

**Input Buffering** (src/input.js)
- Attaches/detaches event listeners to prevent memory leaks
- Input applied in fixed update step, not render loop (avoids 1-frame lag)
- Supports W/S (left paddle), Arrow Up/Down (right paddle), P/ESC (pause)

**Module Structure**
- `main.js` - Entry point, game loop
- `game-state.js` - State management and update logic
- `paddle.js` - Paddle entity and movement
- `ball.js` - Ball entity, physics, serving, bounce angle computation
- `collision.js` - Circle-rect collision detection and resolution
- `renderer.js` - Canvas drawing
- `input.js` - Keyboard handlers
- `ai.js` - CPU opponent (not yet implemented)

## Key Implementation Details

**Ball Reflection from Paddles** (src/ball.js:52-60)
- Bounce angle varies based on hit offset from paddle center
- Max deflection: 60 degrees
- Direction parameter: +1 for right, -1 for left
- Preserves ball speed on reflection

**Paddle Movement** (src/paddle.js:16-25)
- Velocity can be directional (-1, 0, 1) or continuous (px/s)
- Clamped to canvas bounds
- Position stored as center Y, rendering adjusts by half-height

**Collision Detection** (src/collision.js:8-21)
- Finds closest point on rectangle to circle center
- Checks if distance to closest point ≤ ball radius
- Paddle Y stored as center, so rect bounds computed as `y ± h/2`

**Scoring** (src/game-state.js:57-67)
- Ball exiting left boundary scores point for right player
- Ball exiting right boundary scores point for left player
- Ball resets to center with random serve direction

## Technical Constraints from TRD

1. **Fixed timestep is mandatory** - Variable timestep causes physics bugs and prevents future online sync
2. **Centralized state object** - Required for serialization and debugging
3. **AABB collision** - Chosen over circle collision for simplicity
4. **No object allocation per frame** - Reuse objects to avoid GC spikes
5. **Named ES6 exports** - Keep modules single-responsibility

## Common Pitfalls

- Ball tunneling through paddles: Ensure positional correction after collision (src/game-state.js:48,53)
- Ball sticking to paddle: Set ball X position explicitly after reflection (src/game-state.js:48,53)
- Input lag: Never read input inside render loop, apply in fixed update
- Frame-rate dependent physics: Always use fixed timestep, not raw deltaTime
- Spiral of death: Cap deltaTime when tab regains focus (src/main.js:31)

## Debugging Tips

- Use DevTools → Performance to profile frame times and GC spikes
- Throttle CPU in DevTools to test fixed timestep behavior
- Increase ball speed temporarily to reproduce collision edge cases
- Add console logs in `collision.js` and `ball.js` to inspect collision responses

## Future Extensions

- AI opponent (`ai.js` - pluggable difficulty)
- Sound effects (Web Audio API)
- Win condition (first to 11 points)
- Game state transitions (start → playing → ended)
- Ball speed progression
- Touch/mobile controls
- Online multiplayer (WebSocket, state sync, input buffering already architected for this)
