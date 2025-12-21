// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';
import { restartGame, startPlaying, setDifficulty } from './game-state.js';

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
  // settings gear rect (top-right)
  const gear = { x: w - 64, y: 8, w: 48, h: 48 };
  return {
    single: { x: cx - btnW - gap / 2, y: y - btnH / 2, w: btnW, h: btnH },
    versus: { x: cx + gap / 2, y: y - btnH / 2, w: btnW, h: btnH },
    settings: gear,
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
    if (k === 's' || k === 'S') {
      _state.showSettings = !_state.showSettings;
      _state.settingsHover = null;
      return;
    }
  }

  // If settings overlay is open, allow quick keyboard difficulty selection (1/2/3)
  if (_state.showSettings) {
    if (k === '1') { setDifficulty(_state, 'easy'); return; }
    if (k === '2') { setDifficulty(_state, 'medium'); return; }
    if (k === '3') { setDifficulty(_state, 'hard'); return; }
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
      if (!_state) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (_state.showSettings) {
        // detect hover over options in settings overlay
        const w = _state.width; const h = _state.height;
        const boxW = 220; const boxH = 44;
        const startX = w/2 - boxW/2;
        let startY = h*0.4;
        let found = null;
        const opts = ['easy','medium','hard'];
        for (let i=0;i<opts.length;i++){
          const r = { x: startX, y: startY, w: boxW, h: boxH };
          if (pointInRect(x,y,r)) { found = opts[i]; break; }
          startY += boxH + 12;
        }
        _state.settingsHover = found;
        return;
      }

      // Landing hover detection (buttons + settings gear)
      if (_state.gameState === 'LANDING') {
        const btns = getLandingButtons(_state);
        if (pointInRect(x, y, btns.single)) { _state.landingHover = 'single'; _state.settingsHover = null; }
        else if (pointInRect(x, y, btns.versus)) { _state.landingHover = 'versus'; _state.settingsHover = null; }
        else if (pointInRect(x, y, btns.settings)) { _state.landingHover = 'settings'; _state.settingsHover = 'settings'; _state.landingHover = null; }
        else { _state.landingHover = null; _state.settingsHover = null; }
      }
    };
    const pdown = (e) => {
      if (!_state) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (_state.showSettings) {
        // click inside options
        const w = _state.width; const h = _state.height;
        const boxW = 220; const boxH = 44;
        const startX = w/2 - boxW/2;
        let startY = h*0.4;
        const opts = ['easy','medium','hard'];
        let handled = false;
        for (let i=0;i<opts.length;i++){
          const r = { x: startX, y: startY, w: boxW, h: boxH };
          if (pointInRect(x,y,r)) { setDifficulty(_state, opts[i]); handled = true; break; }
          startY += boxH + 12;
        }
        if (!handled) {
          // click outside closes overlay
          _state.showSettings = false;
          _state.settingsHover = null;
        }
        return;
      }

      if (_state.gameState === 'LANDING') {
        const btns = getLandingButtons(_state);
        if (pointInRect(x, y, btns.single)) startPlaying(_state, 'single');
        else if (pointInRect(x, y, btns.versus)) startPlaying(_state, 'versus');
        else if (pointInRect(x, y, btns.settings)) { _state.showSettings = true; _state.settingsHover = null; }
      }
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