// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';
import { restartGame, startPlaying, setDifficulty, showLanding, togglePause, isPaused, isGameOver } from './game-state.js';
import { CANVAS } from './constants.js';
import { attachTouchHandlers, detachTouchHandlers } from './touch.js';

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

  // A focused control on an HTML overlay screen handles its own Enter and Space
  if ((k === 'Enter' || k === ' ') && e.target?.closest?.('[data-screen]')) return;

  // Settings is an HTML panel (src/screen-settings.js) and owns the keyboard
  // while open: Esc closes it; Tab closes it from outside the panel (inside, Tab
  // moves between its controls); 1/2/3 pick a difficulty; every other key is
  // left to the focused control (arrows move a slider, Space toggles a switch).
  if (_state.showSettings) {
    const inPanel = e.target?.closest?.('[data-screen="settings"]');
    if (k === 'Escape' || (k === 'Tab' && !inPanel)) {
      e.preventDefault();
      _state.showSettings = false;
    } else if (k === '1') setDifficulty(_state, 'easy');
    else if (k === '2') setDifficulty(_state, 'medium');
    else if (k === '3') setDifficulty(_state, 'hard');
    return;
  }

  // If we're on the landing screen, allow quick keyboard selection (1/2/Enter) and open settings with S
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
    if (k === 'Tab') {
      e.preventDefault(); // Tab is the settings key here, not focus traversal
      _state.showSettings = true;
      return;
    }
  }

  // Open settings with Tab (works during gameplay too)
  if (k === 'Tab' && _state.gameState === 'PLAYING') {
    e.preventDefault();
    _state.showSettings = true;
    return;
  }

  // Prevent page scrolling for space / arrows / Tab
  if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Tab') e.preventDefault();

  switch (k) {
    case 'p':
    case 'P':
    case 'Escape':
      if (isGameOver(_state)) showLanding(_state);
      else togglePause(_state);
      break;
    case 'm':
    case 'M':
      if (isPaused(_state)) showLanding(_state);
      break;
    case ' ':
      if (isGameOver(_state)) restartGame(_state);
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

// Map a pointer event to court coordinates (800x600). The canvas is scaled by
// CSS to fit the viewport, and its bounding rect includes the border, so
// subtract the border and divide by the displayed content size. The backing
// store (canvas.width) may be larger for high-DPI screens, so use the court size.
function toCanvasCoords(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const bx = canvas.clientLeft;
  const by = canvas.clientTop;
  const contentW = rect.width - bx * 2;
  const contentH = rect.height - by * 2;
  return {
    x: (e.clientX - rect.left - bx) * (CANVAS.DEFAULT_WIDTH / contentW),
    y: (e.clientY - rect.top - by) * (CANVAS.DEFAULT_HEIGHT / contentH),
  };
}

export function attachInputHandlers(state, canvas = null) {
  _state = state;
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  listeners = [keydown, keyup];
  if (canvas) attachTouchHandlers(state, canvas, toCanvasCoords);
  // The landing, pause, victory and settings screens are HTML (src/screen-*.js), so the canvas needs no pointer handling beyond touch
}

export function detachInputHandlers() {
  if (!listeners.length) return;
  window.removeEventListener('keydown', listeners[0]);
  window.removeEventListener('keyup', listeners[1]);
  listeners = [];
  detachTouchHandlers();
  _state = null;
  pressed.clear();
}

