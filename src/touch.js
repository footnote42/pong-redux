// src/touch.js
// Touch zones and Drag control (see GLOSSARY.md).
// The left half of the screen drives the left paddle, the right half the right
// paddle. A drag moves the paddle by the same distance the thumb moves (in court
// units); the paddle never jumps to the thumb. Touches are tracked per pointer id
// and belong to the zone they started in.
//
// Pure logic (createTouchController, zoneForX, humanZones, applyDrags) has no DOM
// dependency so it can be unit-tested in Node. attachTouchHandlers wires it to
// the window.

/** Which Touch zone a horizontal screen position falls in. */
export function zoneForX(clientX, screenWidth) {
  return clientX < screenWidth / 2 ? 'left' : 'right';
}

/** Zones that drive a paddle in a Game mode. The CPU side ignores touches. */
export function humanZones(gameMode) {
  if (gameMode === 'single' || gameMode === 'rugby-single') return ['left'];
  return ['left', 'right'];
}

export function createTouchController() {
  const touches = new Map(); // pointerId -> { zone, lastY }
  const pending = { left: 0, right: 0 }; // accumulated drag, court units

  return {
    /** Start tracking a touch. Returns false if the zone is not allowed. */
    begin(id, zone, courtY, allowedZones) {
      if (!allowedZones.includes(zone)) return false;
      touches.set(id, { zone, lastY: courtY });
      return true;
    },
    /** Record movement of a tracked touch. Returns true if it was tracked. */
    move(id, courtY) {
      const t = touches.get(id);
      if (!t) return false;
      pending[t.zone] += courtY - t.lastY;
      t.lastY = courtY;
      return true;
    },
    end(id) {
      touches.delete(id);
    },
    has(id) {
      return touches.has(id);
    },
    /** Take and reset the accumulated drag per zone. */
    consume() {
      const out = { left: pending.left, right: pending.right };
      pending.left = 0;
      pending.right = 0;
      return out;
    },
    reset() {
      touches.clear();
      pending.left = 0;
      pending.right = 0;
    },
  };
}

/** True while paddles are being driven (not a menu, pause, settings or game over). */
export function isPlaying(state) {
  return state.gameState === 'PLAYING' && !state.paused && !state.gameOver && !state.showSettings;
}

/**
 * Apply accumulated drag to the paddles. Call once per fixed update step.
 * Paddle position is clamped to the court; velocity is zeroed so keyboard
 * smoothing does not fight the drag.
 */
export function applyDrags(state, controller) {
  if (!isPlaying(state)) {
    controller.reset();
    return;
  }
  const drag = controller.consume();
  const zones = humanZones(state.gameMode);
  for (const zone of zones) {
    if (!drag[zone]) continue;
    const p = state.paddles[zone];
    const half = p.h / 2;
    p.y = Math.max(half, Math.min(state.height - half, p.y + drag[zone]));
    p.vy = 0;
  }
}

// ---- DOM wiring ----------------------------------------------------------

const controller = createTouchController();
let cleanup = null;

/** Apply pending touch drag to a game state (called from the fixed update). */
export function applyTouchDrag(state) {
  applyDrags(state, controller);
}

/**
 * @param {Object} state game state
 * @param {HTMLCanvasElement} canvas used to map pointer Y to court units
 * @param {(canvas, e) => {x:number,y:number}} toCourt pointer to court mapper
 */
export function attachTouchHandlers(state, canvas, toCourt) {
  detachTouchHandlers();

  const isTouch = (e) => e.pointerType === 'touch';

  const down = (e) => {
    if (!isTouch(e) || !isPlaying(state)) return;
    const zone = zoneForX(e.clientX, window.innerWidth);
    const { y } = toCourt(canvas, e);
    if (controller.begin(e.pointerId, zone, y, humanZones(state.gameMode))) {
      e.preventDefault();
    }
  };
  const move = (e) => {
    if (!isTouch(e) || !controller.has(e.pointerId)) return;
    controller.move(e.pointerId, toCourt(canvas, e).y);
    e.preventDefault();
  };
  const up = (e) => {
    if (!isTouch(e)) return;
    controller.end(e.pointerId);
  };
  // While playing, stop the browser scrolling, zooming or selecting.
  const block = (e) => {
    if (isPlaying(state)) e.preventDefault();
  };
  const noMenu = (e) => e.preventDefault();

  window.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  document.addEventListener('touchstart', block, { passive: false });
  document.addEventListener('touchmove', block, { passive: false });
  document.addEventListener('contextmenu', noMenu);
  document.addEventListener('selectstart', block);
  document.addEventListener('gesturestart', block);

  cleanup = () => {
    window.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    document.removeEventListener('touchstart', block);
    document.removeEventListener('touchmove', block);
    document.removeEventListener('contextmenu', noMenu);
    document.removeEventListener('selectstart', block);
    document.removeEventListener('gesturestart', block);
    controller.reset();
  };
}

export function detachTouchHandlers() {
  if (cleanup) cleanup();
  cleanup = null;
}
