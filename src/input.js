// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';
import { restartGame, startPlaying, setDifficulty, setBallSpeed, setWinScore, setSoundEnabled, setVolume } from './game-state.js';

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

  // Settings overlay keyboard controls
  if (_state.showSettings) {
    if (k === 'Escape' || k === 's' || k === 'S') {
      _state.showSettings = false;
      _state.settingsHover = null;
      return;
    }
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
        _state.settingsHover = detectSettingsHover(x, y, _state);
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
        handleSettingsClick(x, y, _state);
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

// Settings UI interaction helpers
function detectSettingsHover(x, y, state) {
  const w = state.width;
  const h = state.height;
  const panelX = w * 0.15;
  const panelY = h * 0.15;

  // Check tabs
  const tabs = ['gameplay', 'audio', 'about'];
  const tabW = 140;
  const tabH = 36;
  const tabY = panelY + 80;
  const tabStartX = w / 2 - (tabs.length * tabW) / 2;

  for (let i = 0; i < tabs.length; i++) {
    const tabX = tabStartX + i * tabW;
    if (pointInRect(x, y, { x: tabX, y: tabY, w: tabW, h: tabH })) {
      return tabs[i];
    }
  }

  // Check content based on active tab
  if (state.settingsTab === 'gameplay') {
    return detectGameplayHover(x, y, state, panelX, panelY);
  } else if (state.settingsTab === 'audio') {
    return detectAudioHover(x, y, state, panelX, panelY);
  }

  return null;
}

function detectGameplayHover(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 50;

  // Difficulty buttons
  const difficulties = ['easy', 'medium', 'hard'];
  const boxW = 140;
  const boxH = 36;
  const startX = panelX + 40;

  for (let i = 0; i < difficulties.length; i++) {
    const boxX = startX + i * (boxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: boxW, h: boxH })) {
      return difficulties[i];
    }
  }

  yPos += boxH + 70;

  // Ball speed slider
  if (pointInRect(x, y, { x: panelX + 40, y: yPos, w: 300, h: 20 })) {
    return 'ballSpeed';
  }

  yPos += 80;

  // Win score buttons
  const winScores = [5, 7, 11, 15, 21];
  const scoreBoxW = 60;
  const scoreBoxH = 36;

  for (let i = 0; i < winScores.length; i++) {
    const boxX = panelX + 40 + i * (scoreBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: scoreBoxW, h: scoreBoxH })) {
      return 'winScore' + winScores[i];
    }
  }

  return null;
}

function detectAudioHover(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 50;

  // Sound toggle
  const toggleW = 100;
  const toggleH = 36;
  if (pointInRect(x, y, { x: panelX + 40, y: yPos, w: toggleW, h: toggleH })) {
    return 'soundEnabled';
  }

  yPos += toggleH + 70;

  // Volume slider (if sound enabled)
  if (state.settings.soundEnabled) {
    if (pointInRect(x, y, { x: panelX + 40, y: yPos, w: 300, h: 20 })) {
      return 'volume';
    }
  }

  return null;
}

function handleSettingsClick(x, y, state) {
  const w = state.width;
  const h = state.height;
  const panelX = w * 0.15;
  const panelY = h * 0.15;
  const panelW = w * 0.7;
  const panelH = h * 0.7;

  // Check if click is outside panel - close settings
  if (!pointInRect(x, y, { x: panelX, y: panelY, w: panelW, h: panelH })) {
    state.showSettings = false;
    state.settingsHover = null;
    return;
  }

  // Check tabs
  const tabs = ['gameplay', 'audio', 'about'];
  const tabW = 140;
  const tabH = 36;
  const tabY = panelY + 80;
  const tabStartX = w / 2 - (tabs.length * tabW) / 2;

  for (let i = 0; i < tabs.length; i++) {
    const tabX = tabStartX + i * tabW;
    if (pointInRect(x, y, { x: tabX, y: tabY, w: tabW, h: tabH })) {
      state.settingsTab = tabs[i];
      return;
    }
  }

  // Handle content clicks based on active tab
  if (state.settingsTab === 'gameplay') {
    handleGameplayClick(x, y, state, panelX, panelY);
  } else if (state.settingsTab === 'audio') {
    handleAudioClick(x, y, state, panelX, panelY);
  }
}

function handleGameplayClick(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 50;
  console.log('[DEBUG] handleGameplayClick:', { x, y, panelX, panelY, contentY, yPos });

  // Difficulty buttons
  const difficulties = ['easy', 'medium', 'hard'];
  const boxW = 140;
  const boxH = 36;
  const startX = panelX + 40;

  for (let i = 0; i < difficulties.length; i++) {
    const boxX = startX + i * (boxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: boxW, h: boxH })) {
      setDifficulty(state, difficulties[i]);
      return;
    }
  }

  yPos += boxH + 70;

  // Ball speed slider
  const sliderX = panelX + 40;
  const sliderW = 300;
  if (pointInRect(x, y, { x: sliderX, y: yPos, w: sliderW, h: 20 })) {
    const normalized = (x - sliderX) / sliderW;
    const speed = 0.5 + normalized * 1.5; // 0.5 to 2.0
    setBallSpeed(state, speed);
    return;
  }

  yPos += 80;

  // Win score buttons
  const winScores = [5, 7, 11, 15, 21];
  const scoreBoxW = 60;
  const scoreBoxH = 36;

  for (let i = 0; i < winScores.length; i++) {
    const boxX = panelX + 40 + i * (scoreBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: scoreBoxW, h: scoreBoxH })) {
      setWinScore(state, winScores[i]);
      return;
    }
  }
}

function handleAudioClick(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 50;

  // Sound toggle
  const toggleW = 100;
  const toggleH = 36;
  if (pointInRect(x, y, { x: panelX + 40, y: yPos, w: toggleW, h: toggleH })) {
    setSoundEnabled(state, !state.settings.soundEnabled);
    return;
  }

  yPos += toggleH + 70;

  // Volume slider
  if (state.settings.soundEnabled) {
    const sliderX = panelX + 40;
    const sliderW = 300;
    if (pointInRect(x, y, { x: sliderX, y: yPos, w: sliderW, h: 20 })) {
      const normalized = (x - sliderX) / sliderW;
      const volume = Math.round(normalized * 100);
      setVolume(state, volume);
      return;
    }
  }
}