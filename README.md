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
