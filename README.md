# Project Structure

```text
pong-redux/
 index.html
 styles.css
 src/
   ─ main.js           # entry point, game loop (fixed timestep)
    game-state.js     # centralized, serializable state
    paddle.js         # Paddle entity
    ball.js           # Ball entity + physics
    collision.js      # AABB collision detection & correction
    ai.js             # CPU opponent (pluggable)
    renderer.js       # Canvas drawing / UI overlays
    input.js          # Keyboard and touch input buffering
 assets/
    sounds/
 .github/
     copilot-instructions.md
```

Notes:
- Use ES6 modules (named exports) and keep modules single-responsibility.
- See `TRD.md` for implementation details and acceptance criteria (fixed timestep, single state object, AABB collision, etc.).

---

## Testing & Debugging

- Headless unit tests (Node):
  - Run: `node test/run_collision_tests.mjs` — runs collision checks and edge-case scenarios headlessly.
- Browser tests and visual harness:
  - Open `test/collision.unit.html` in a browser served from the project root (e.g., `npx http-server .`).
  - Use `test/collision-debug.html` for an interactive canvas harness with toggles:
    - **Use correction** (positional correction), **Use swept guard** (tunneling prevention), **Max Bounce**, and **Center Deadzone** sliders.
- Serve the project for the game and tests:
  - `npx http-server .` (or use VS Code Live Server) and visit `index.html` to play.

These tests and the debug harness are intended to make physics changes safe and playtestable without touching the core game loop.

