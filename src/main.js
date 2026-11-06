// src/main.js
// Fixed-timestep game loop with requestAnimationFrame + accumulator

import { createInitialState, update as updateState, showLanding } from './game-state.js';
import * as renderer from './renderer-core.js';
import { attachInputHandlers, detachInputHandlers } from './input.js';
import { PHYSICS, CANVAS } from './constants.js';
import { soundManager } from './sound.js';
import { applyTouchDrag } from './touch.js';

const { MS_PER_UPDATE, SPIRAL_OF_DEATH_CAP_MS } = PHYSICS;

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  // Court size is fixed at 800x600; the canvas backing store may be larger (see renderer-core fitToDisplay).
  const state = createInitialState(CANVAS.DEFAULT_WIDTH, CANVAS.DEFAULT_HEIGHT);
  let lastTime = performance.now();
  let accumulator = 0;
  let running = false;
  let rafId = null;

  function update(dt) {
    // dt in seconds
    applyTouchDrag(state); // Drag control: touch moves paddles in the fixed step
    updateState(state, dt);
  }

  function render(interp) {
    // delegated to renderer module
    renderer.render(state, ctx, interp);
  }

  function loop(now) {
    if (!running) return;
    let deltaMs = now - lastTime;
    if (deltaMs > SPIRAL_OF_DEATH_CAP_MS) deltaMs = SPIRAL_OF_DEATH_CAP_MS; // avoid spiral of death after tab switch
    lastTime = now;
    accumulator += deltaMs;

    while (accumulator >= MS_PER_UPDATE) {
      update(MS_PER_UPDATE / 1000);
      accumulator -= MS_PER_UPDATE;
    }

    const interp = accumulator / MS_PER_UPDATE;
    render(interp);

    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    accumulator = 0;

    // Initialize sound system (must be called after user interaction)
    soundManager.init();
    soundManager.setEnabled(state.settings.soundEnabled);
    soundManager.setVolume(state.settings.volume);

    // attach input handlers (pass canvas for pointer events)
    attachInputHandlers(state, canvas);

    // Landing screen is shown by default (gameState starts as 'LANDING')
    // No need to manually call showLanding here

    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    // detach input handlers
    detachInputHandlers();
  }

  return { start, stop, getState: () => state };
}
