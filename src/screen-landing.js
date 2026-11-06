// src/screen-landing.js
// The landing screen: choose a Game mode or open settings. Markup lives in
// index.html under data-screen="landing"; mounted by screens.js.

import { startPlaying, startRugbyMode, triggerButtonPress } from './game-state.js';
import { soundManager } from './sound.js';

const GRID_COLUMNS = 2; // Game modes sit in a 2x2 grid in both layouts

/**
 * Start a Game mode chosen on the landing screen.
 * @param {Object} state - Game state
 * @param {'single'|'versus'|'rugby-single'|'rugby-versus'} mode
 */
export function startGameMode(state, mode) {
  triggerButtonPress(state, mode);
  if (mode.startsWith('rugby')) {
    soundManager.playUIClick();
    startRugbyMode(state, mode);
  } else {
    startPlaying(state, mode);
  }
}

function openSettings(state) {
  state.showSettings = true;
}

/**
 * @param {HTMLElement} el - the data-screen="landing" element
 * @param {Object} state - Game state
 */
export function mountLanding(el, state) {
  const doc = el.ownerDocument;
  const modeButtons = [...el.querySelectorAll('button[data-mode]')];
  const highScore = el.querySelector('.high-score');

  function onClick(e) {
    const button = e.target.closest('button[data-mode], button[data-action]');
    if (!button || !el.contains(button)) return;
    if (button.dataset.action === 'settings') openSettings(state);
    else startGameMode(state, button.dataset.mode);
  }

  // Arrow keys move focus around the Game mode grid (Tab is the settings key)
  function onKeydown(e) {
    if (el.hidden) return;
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -GRID_COLUMNS, ArrowDown: GRID_COLUMNS }[e.key];
    if (!step) return;
    const from = modeButtons.indexOf(doc.activeElement);
    const to = from === -1 ? 0 : from + step;
    if (to >= 0 && to < modeButtons.length) modeButtons[to].focus();
  }

  el.addEventListener('click', onClick);
  doc.addEventListener('keydown', onKeydown);

  return {
    show() {
      const best = state.highScore;
      highScore.hidden = !(best && best.score > 0);
      if (!highScore.hidden) highScore.textContent = `High score: ${best.score} (${best.holder || '---'})`;
    },
    unmount() {
      el.removeEventListener('click', onClick);
      doc.removeEventListener('keydown', onKeydown);
    },
  };
}
