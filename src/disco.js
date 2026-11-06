// src/disco.js
// Disco paddle style: colours that sweep the hue wheel over time. The two
// paddles sit opposite each other on the wheel; the ball and centre line
// follow the left paddle's hue.

/** One full trip round the hue wheel, in ms. */
export const DISCO_CYCLE_MS = 4000;

/**
 * @param {number} timeMs - any clock in ms (performance.now())
 * @param {'left'|'right'} side
 * @returns {number} hue in [0, 360)
 */
export function discoHue(timeMs, side) {
  const base = ((timeMs % DISCO_CYCLE_MS) + DISCO_CYCLE_MS) % DISCO_CYCLE_MS / DISCO_CYCLE_MS * 360;
  return (base + (side === 'right' ? 180 : 0)) % 360;
}

/** The hue as a saturated CSS colour. */
export function discoColor(timeMs, side) {
  return `hsl(${Math.round(discoHue(timeMs, side))}, 100%, 60%)`;
}
