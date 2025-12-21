// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';
import { restartGame } from './game-state.js';

let _state = null;
let listeners = [];
const pressed = new Set();

function computeDirForLeft() {
  if (pressed.has('w') || pressed.has('W')) return -1;
  if (pressed.has('s') || pressed.has('S')) return 1;
  return 0;
}
function computeDirForRight() {
  if (pressed.has('ArrowUp')) return -1;
  if (pressed.has('ArrowDown')) return 1;
  return 0;
}

function keydown(e) {
  if (!_state) return;
  const k = e.key;

  // Dismiss instructions on any key press
  if (_state.showInstructions) {
    _state.showInstructions = false;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('pong:seenInstructions', '1');
    }
    return;
  }

  // Prevent page scrolling for space / arrows
  if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown') e.preventDefault();

  switch (k) {
    case 'p':
    case 'P':
    case 'Escape':
      _state.paused = !_state.paused;
      break;
    case ' ':
      if (_state.gameOver) restartGame(_state);
      break;
    default:
      break;
  }

  // Track pressed keys for directional input
  pressed.add(k);
  setPaddleDirection(_state.paddles.left, computeDirForLeft());
  setPaddleDirection(_state.paddles.right, computeDirForRight());
}

function keyup(e) {
  if (!_state) return;
  const k = e.key;
  pressed.delete(k);
  setPaddleDirection(_state.paddles.left, computeDirForLeft());
  setPaddleDirection(_state.paddles.right, computeDirForRight());
}

export function attachInputHandlers(state) {
  _state = state;
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  listeners = [keydown, keyup];
}

export function detachInputHandlers() {
  if (!listeners.length) return;
  window.removeEventListener('keydown', listeners[0]);
  window.removeEventListener('keyup', listeners[1]);
  listeners = [];
  _state = null;
  pressed.clear();
}