# Copilot / AI Agent Instructions — Pong Rebuild

Purpose: Short, targeted guidance to help an AI agent get productive quickly in this repo.

## Big picture (read first)
- This is a small **Vanilla JS** Pong rebuild (learning exercise). Core goal: implement modular ES6 code that runs in the browser (no framework). See `TRD.md` for design rationale and acceptance criteria.
- Key architectural constraints: **fixed-timestep game loop**, **single source-of-truth game state**, **AABB collision**, physics separated from rendering to support future online sync.

## Files to inspect / create
- Read `TRD.md` (design decisions, file layout, acceptance criteria) first.
- Expected modules (use these names): `src/main.js`, `src/game-state.js`, `src/paddle.js`, `src/ball.js`, `src/collision.js`, `src/renderer.js`, `src/input.js`, `src/ai.js`.
- If these files are missing, scaffold them according to TRD responsibilities (keep each module small and single-responsibility).

## Coding conventions & patterns (project-specific)
- Use ES6 modules (named exports for classes/functions) and import from `src/*`.
- Keep a single state object (centralized, serializable). Export a `serialize()` method if needed for future networking/testing.
- Game loop: use `requestAnimationFrame` + fixed timestep accumulator (do logic updates in fixed steps, render once per frame). This is crucial to avoid frame-dependent physics bugs.
- Collision: use AABB rectangle collisions; implement post-collision positional correction to avoid "sticking" and tunneling.
- Input: attach event listeners but buffer input and apply it in the fixed update step (not inside render), to avoid 1-frame input lag.
- Performance: avoid allocating objects each frame (reuse vectors/pools where obvious).

## How to run & debug locally
- No build system by default. Run by opening `index.html` in a browser or serve the folder:
  - Quick dev server: `npx http-server .` or `npx serve .`, or use VS Code Live Server extension (Go Live).
- Debugging tips:
  - Use DevTools → Performance to profile frame times and GC spikes.
  - Throttle CPU to reproduce variable-frame-rate problems and verify fixed timestep behavior.
  - Reproduce collision issues by temporarily increasing ball speed.
  - Use console logs/breakpoints in `collision.js` and `ball.js` to inspect collision responses.

## Tests & deterministic behavior
- There are no unit tests currently. When adding physics logic, prefer small deterministic functions (pure maths) that are easy to unit test (e.g., reflect-angle computation, AABB overlap check).
- When changing the game loop or physics, add small tests or deterministic logs to validate behavior across simulated ticks.

## Examples & quick actionable hints (from TRD)
- Ball reset: center the ball and pick a random initial left/right direction; brief pause (0.5s) before serve.
- Paddle hit: compute bounce angle relative to hit offset from paddle center (more offset → steeper angle).
- Win condition: first to 11 points displays `Player X Wins` and stops updates until restart.
- Pause: map `ESC` or `P` to freeze updates and display a pause overlay.

## Integration & future-proofing
- Keep state serialization simple (plain JS object) to ease later networking (input buffering, state diffs) described in TRD.
- Prefer small pure modules so they can be individually replaced or tested (e.g., swap `ai.js` with different difficulty levels).

## If updating this file
- If a `.github/copilot-instructions.md` already exists, preserve any helpful agent guidance and merge only practical, discoverable rules from `TRD.md`.

---
If anything above is unclear or you'd like me to add a starter scaffolding for `src/main.js` (fixed-timestep loop) or example tests for collision utils, say which one and I will add it. ✅
