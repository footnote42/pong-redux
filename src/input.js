// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';

let _state = null;
let listeners = [];

function keydown(e) {
  if (!_state) return;
  const k = e.key;
  switch (k) {
    case 'w':
    case 'W':
      setPaddleDirection(_state.paddles.left, -1);
      break;
    case 's':
    case 'S':
      setPaddleDirection(_state.paddles.left, +1);
      break;
    case 'ArrowUp':
      setPaddleDirection(_state.paddles.right, -1);
      break;
    case 'ArrowDown':
      setPaddleDirection(_state.paddles.right, +1);
      break;
    case 'p':
    case 'P':
    case 'Escape':
      _state.paused = !_state.paused;
      break;
    default:
      break;
  }
}

function keyup(e) {
  if (!_state) return;
  const k = e.key;
  switch (k) {
    case 'w':
    case 'W':
      setPaddleDirection(_state.paddles.left, 0);
      break;
    case 's':
    case 'S':
      setPaddleDirection(_state.paddles.left, 0);
      break;
    case 'ArrowUp':
      setPaddleDirection(_state.paddles.right, 0);
      break;
    case 'ArrowDown':
      setPaddleDirection(_state.paddles.right, 0);
      break;
    default:
      break;
  }
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
}