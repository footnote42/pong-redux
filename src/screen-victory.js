// src/screen-victory.js
// The victory screen: who won, then Play Again or Main Menu. Markup lives in
// index.html under data-screen="victory"; mounted by screens.js. Confetti
// stays on the canvas behind it.

import { restartGame, showLanding } from './game-state.js';

/**
 * The player-facing name of the winner. state.winner is 'left' | 'right'; the
 * CPU holds the right paddle in vs CPU and Rugby (1P).
 * @param {{gameMode: string, winner: 'left'|'right'}} state
 * @returns {string}
 */
export function victoryName(state) {
  if (state.winner === 'left') return 'Player 1';
  const vsCpu = state.gameMode === 'single' || state.gameMode === 'rugby-single';
  return vsCpu ? 'CPU' : 'Player 2';
}

/**
 * @param {HTMLElement} el - the data-screen="victory" element
 * @param {Object} state - Game state
 */
export function mountVictory(el, state) {
  const title = el.querySelector('.overlay-title');

  function onClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button || !el.contains(button)) return;
    if (button.dataset.action === 'again') restartGame(state);
    else if (button.dataset.action === 'menu') showLanding(state);
  }

  el.addEventListener('click', onClick);
  return {
    show() {
      const left = state.winner === 'left';
      const color = left ? state.settings.leftPaddleColor : state.settings.rightPaddleColor;
      title.textContent = `${victoryName(state)} Wins!`;
      title.style.color = color || '';
      // Keyboard focus starts on Play Again
      el.querySelector('[data-action="again"]')?.focus({ preventScroll: true });
    },
    unmount() {
      el.removeEventListener('click', onClick);
    },
  };
}
