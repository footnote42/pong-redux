// src/rotate.js
// Rotate prompt (see GLOSSARY.md): shown on a touch-primary device held upright.
// Visibility itself is CSS (styles.css uses the same ROTATE_QUERY); this module
// only auto-pauses a game in progress when the prompt appears. Turning back to
// landscape never resumes: the player chooses Resume.

import { pauseGame } from './game-state.js';

// Touch-primary and portrait. Deliberately not a width test: a narrow desktop
// window has a fine pointer and must never see the prompt.
export const ROTATE_QUERY = '(orientation: portrait) and (pointer: coarse)';

/** React to the prompt's visibility changing. */
export function applyRotate(state, visible) {
  if (visible) pauseGame(state);
}

/** Watch the media query and auto-pause. Returns a detach function. */
export function attachRotatePrompt(state, win = window) {
  const mq = win.matchMedia(ROTATE_QUERY);
  const onChange = () => applyRotate(state, mq.matches);
  mq.addEventListener('change', onChange);
  onChange();
  return () => mq.removeEventListener('change', onChange);
}
