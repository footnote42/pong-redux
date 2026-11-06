// src/screen-pause.js
// The pause screen (Resume, Settings, Quit to Menu) and the HUD pause button
// shown during play. Markup lives in index.html under data-screen="pause" and
// data-screen="hud"; mounted by screens.js.

import { pauseGame, resumeGame, showLanding } from './game-state.js';

/**
 * The pause screen. Resume, Settings and Quit to Menu work by tap, click and
 * keyboard (a focused button handles its own Enter and Space).
 * @param {HTMLElement} el - the data-screen="pause" element
 * @param {Object} state - Game state
 */
export function mountPause(el, state) {
  function onClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button || !el.contains(button)) return;
    switch (button.dataset.action) {
      case 'resume': resumeGame(state); break;
      case 'settings':
        state.showSettings = true; // the settings screen shows over this one
        break;
      case 'quit': showLanding(state); break;
      default: break;
    }
  }

  el.addEventListener('click', onClick);
  return {
    // Keyboard focus starts on Resume, the safe default
    show() {
      el.querySelector('[data-action="resume"]')?.focus({ preventScroll: true });
    },
    unmount() {
      el.removeEventListener('click', onClick);
    },
  };
}

/**
 * The HUD: a pause button in the top-right corner (the top-left belongs to the
 * portfolio's back link, ADR 0002). The rest of the HUD layer lets touches
 * through to the Touch zones.
 * @param {HTMLElement} el - the data-screen="hud" element
 * @param {Object} state - Game state
 */
export function mountHud(el, state) {
  function onClick(e) {
    if (!e.target.closest('button[data-action="pause"]')) return;
    pauseGame(state);
  }

  el.addEventListener('click', onClick);
  return {
    unmount() {
      el.removeEventListener('click', onClick);
    },
  };
}
