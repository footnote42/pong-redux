// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';
import { restartGame, startPlaying } from './game-state.js';

let _state = null;
let listeners = [];
let _canvas = null;
let _pointerListeners = [];
const pressed = new Set();

function getLandingButtons(state) {
  const w = state.width;
  const h = state.height;
  const btnW = 260;
  const btnH = 60;
  const gap = 40;
  const cx = w / 2;
  const y = h * 0.5;
  return {
    single: { x: cx - btnW - gap / 2, y: y - btnH / 2, w: btnW, h: btnH },
    versus: { x: cx + gap / 2, y: y - btnH / 2, w: btnW, h: btnH },
  };
}
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

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

  // If we're on the landing screen, allow quick keyboard selection (1/2/Enter)
  if (_state.gameState === 'LANDING') {
    if (k === '1') {
      startPlaying(_state, 'single');
      return;
    }
    if (k === '2') {
      startPlaying(_state, 'versus');
      return;
    }
    if (k === 'Enter') {
      startPlaying(_state, 'versus');
      return;
    }
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

export function attachInputHandlers(state, canvas = null) {
  _state = state;
  _canvas = canvas;
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  listeners = [keydown, keyup];

  if (canvas) {
    const pmove = (e) => {
      if (!_state || _state.gameState !== 'LANDING') return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const btns = getLandingButtons(_state);
      if (pointInRect(x, y, btns.single)) _state.landingHover = 'single';
      else if (pointInRect(x, y, btns.versus)) _state.landingHover = 'versus';
      else _state.landingHover = null;
    };
    const pdown = (e) => {
      if (!_state || _state.gameState !== 'LANDING') return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const btns = getLandingButtons(_state);
      if (pointInRect(x, y, btns.single)) startPlaying(_state, 'single');
      else if (pointInRect(x, y, btns.versus)) startPlaying(_state, 'versus');
    };
    canvas.addEventListener('pointermove', pmove);
    canvas.addEventListener('pointerdown', pdown);
    _pointerListeners = [pmove, pdown];
  }
}

export function detachInputHandlers() {
  if (!listeners.length) return;
  window.removeEventListener('keydown', listeners[0]);
  window.removeEventListener('keyup', listeners[1]);
  listeners = [];
  if (_canvas && _pointerListeners.length) {
    _canvas.removeEventListener('pointermove', _pointerListeners[0]);
    _canvas.removeEventListener('pointerdown', _pointerListeners[1]);
    _pointerListeners = [];
    _canvas = null;
  }
  _state = null;
  pressed.clear();
}