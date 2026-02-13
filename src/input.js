// src/input.js
// Keyboard input handling - maps keys to paddle directions and pause

import { setPaddleDirection } from './paddle.js';
import { restartGame, startPlaying, setDifficulty, setBallSpeed, setWinScore, setSoundEnabled, setVolume, setPaddleStyle, setLeftPaddleColor, setRightPaddleColor, setEndlessMode, setPaddleSize, setBallStyle, setBallTrail, setBallFlash, setTrailLength, triggerButtonPress, startRugbyMode, setRugbyTargetScore, setRugbyTimeLimit } from './game-state.js';
import { UI, BALL, GAME } from './constants.js';
import { getLandingButtons } from './renderer-menu.js';
import { soundManager } from './sound.js';

let _state = null;
let listeners = [];
let _canvas = null;
let _pointerListeners = [];
const pressed = new Set();


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
    if (k === 'Escape' || k === 'Tab') {
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
    if (k === 'Tab') {
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

  // Toggle settings with Tab key (works during gameplay too)
  if (k === 'Tab' && _state.gameState === 'PLAYING') {
    _state.showSettings = !_state.showSettings;
    _state.settingsHover = null;
    return;
  }

  // Prevent page scrolling for space / arrows / Tab
  if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Tab') e.preventDefault();

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
        const btns = getLandingButtons(_state.width, _state.height);
        let found = false;

        for (const key in btns) {
          const btn = btns[key];
          if (pointInRect(x, y, btn)) {
            _state.landingHover = btn.mode !== 'settings' ? btn.mode : null;
            _state.settingsHover = btn.mode === 'settings' ? 'settings' : null;
            found = true;
            break;
          }
        }

        if (!found) {
          _state.landingHover = null;
          _state.settingsHover = null;
        }
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
        const btns = getLandingButtons(_state.width, _state.height);

        for (const key in btns) {
          const btn = btns[key];
          if (pointInRect(x, y, btn)) {
            triggerButtonPress(_state, btn.mode);

            if (btn.mode === 'settings') {
              _state.showSettings = true;
              _state.settingsHover = null;
            } else if (btn.mode.startsWith('rugby')) {
              soundManager.playUIClick();
              try {
                startRugbyMode(_state, btn.mode);
              } catch (e) {
                console.error('Failed to start Rugby mode:', e);
              }
            } else {
              startPlaying(_state, btn.mode);
            }
            return;
          }
        }
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
  const panelX = w * UI.SETTINGS_PANEL.WIDTH_RATIO;
  const panelY = h * UI.SETTINGS_PANEL.HEIGHT_RATIO;

  // Check tabs
  const tabs = ['gameplay', 'custom', 'audio', 'about'];
  if (state.rugbyMode?.enabled) {
    tabs.splice(2, 0, 'rugby');
  }
  const tabW = UI.TAB_WIDTH;
  const tabH = UI.TAB_HEIGHT;
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
  } else if (state.settingsTab === 'custom') {
    return detectCustomizationHover(x, y, state, panelX, panelY);
  } else if (state.settingsTab === 'audio') {
    return detectAudioHover(x, y, state, panelX, panelY);
  }

  return null;
}

function detectGameplayHover(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 50;

  // Difficulty buttons
  const difficulties = GAME.DIFFICULTY_LEVELS;
  const boxW = UI.TAB_WIDTH;
  const boxH = UI.TAB_HEIGHT;
  const startX = panelX + UI.PANEL_PADDING;

  for (let i = 0; i < difficulties.length; i++) {
    const boxX = startX + i * (boxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: boxW, h: boxH })) {
      return difficulties[i];
    }
  }

  yPos += boxH + 60;

  // Ball speed slider
  if (pointInRect(x, y, { x: panelX + 40, y: yPos, w: 300, h: 20 })) {
    return 'ballSpeed';
  }

  yPos += 30;

  // Ball speed preset buttons
  const presets = [
    { key: 'speedSlow' },
    { key: 'speedNormal' },
    { key: 'speedFast' },
    { key: 'speedInsane' }
  ];
  const presetBoxW = 90;
  const presetBoxH = 32;

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const boxX = panelX + 40 + i * (presetBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: presetBoxW, h: presetBoxH })) {
      return preset.key;
    }
  }

  yPos += presetBoxH + 60;

  // Win score buttons
  const winScores = GAME.WIN_SCORES;
  const scoreBoxW = UI.WIN_SCORE_BUTTON_WIDTH;
  const scoreBoxH = UI.WIN_SCORE_BUTTON_HEIGHT;

  for (let i = 0; i < winScores.length; i++) {
    const boxX = panelX + 40 + i * (scoreBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: scoreBoxW, h: scoreBoxH })) {
      return 'winScore' + winScores[i];
    }
  }

  yPos += scoreBoxH + 30;

  // Endless mode toggle
  const endlessToggleW = 120;
  const endlessToggleH = 36;
  const endlessToggleX = panelX + 40;

  if (pointInRect(x, y, { x: endlessToggleX, y: yPos, w: endlessToggleW, h: endlessToggleH })) {
    return 'endlessMode';
  }

  yPos += endlessToggleH + 60;

  // Paddle style buttons
  const paddleStyles = ['classic', 'retro', 'neon', 'custom'];
  const styleBoxW = 100;
  const styleBoxH = 36;

  for (let i = 0; i < paddleStyles.length; i++) {
    const style = paddleStyles[i];
    const boxX = panelX + 40 + i * (styleBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: styleBoxW, h: styleBoxH })) {
      return 'paddleStyle_' + style;
    }
  }

  // Color boxes (only for custom style)
  if (state.settings.paddleStyle === 'custom') {
    yPos += styleBoxH + 60;
    const colorBoxSize = 40;
    const labelWidth = 120;

    // Left paddle color box
    const leftColorBoxX = panelX + 40 + labelWidth;
    if (pointInRect(x, y, { x: leftColorBoxX, y: yPos, w: colorBoxSize, h: colorBoxSize })) {
      return 'leftPaddleColor';
    }

    // Right paddle color box
    const rightColorBoxX = panelX + 40 + 240 + labelWidth;
    if (pointInRect(x, y, { x: rightColorBoxX, y: yPos, w: colorBoxSize, h: colorBoxSize })) {
      return 'rightPaddleColor';
    }

    yPos += colorBoxSize + 40;
  }

  // Paddle size slider (always shown after custom colors or paddle styles)
  yPos += (state.settings.paddleStyle === 'custom' ? 0 : styleBoxH + 70);
  if (pointInRect(x, y, { x: panelX + 40, y: yPos, w: 300, h: 20 })) {
    return 'paddleSize';
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
  const panelX = w * UI.SETTINGS_PANEL.WIDTH_RATIO;
  const panelY = h * UI.SETTINGS_PANEL.HEIGHT_RATIO;
  const panelW = w * UI.SETTINGS_PANEL.PANEL_WIDTH_RATIO;
  const panelH = h * UI.SETTINGS_PANEL.PANEL_HEIGHT_RATIO;

  // Check if click is outside panel - close settings
  if (!pointInRect(x, y, { x: panelX, y: panelY, w: panelW, h: panelH })) {
    state.showSettings = false;
    state.settingsHover = null;
    return;
  }

  // Check tabs
  const tabs = ['gameplay', 'custom', 'audio', 'about'];
  if (state.rugbyMode?.enabled) {
    tabs.splice(2, 0, 'rugby');
  }
  const tabW = UI.TAB_WIDTH;
  const tabH = UI.TAB_HEIGHT;
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
  } else if (state.settingsTab === 'custom') {
    handleCustomizationClick(x, y, state, panelX, panelY);
  } else if (state.settingsTab === 'rugby') {
    handleRugbyClick(x, y, state, panelX, panelY);
  } else if (state.settingsTab === 'audio') {
    handleAudioClick(x, y, state, panelX, panelY);
  }
}

function handleGameplayClick(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 50;
  console.log('[DEBUG] handleGameplayClick:', { x, y, panelX, panelY, contentY, yPos });

  // Difficulty buttons
  const difficulties = GAME.DIFFICULTY_LEVELS;
  const boxW = UI.TAB_WIDTH;
  const boxH = UI.TAB_HEIGHT;
  const startX = panelX + UI.PANEL_PADDING;

  for (let i = 0; i < difficulties.length; i++) {
    const boxX = startX + i * (boxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: boxW, h: boxH })) {
      setDifficulty(state, difficulties[i]);
      return;
    }
  }

  yPos += boxH + 60;

  // Ball speed slider
  const sliderX = panelX + 40;
  const sliderW = UI.SLIDER_WIDTH;
  if (pointInRect(x, y, { x: sliderX, y: yPos, w: sliderW, h: 20 })) {
    const normalized = (x - sliderX) / sliderW;
    const speed = BALL.SPEED_MULTIPLIER_MIN + normalized * (BALL.SPEED_MULTIPLIER_MAX - BALL.SPEED_MULTIPLIER_MIN);
    setBallSpeed(state, speed);
    return;
  }

  yPos += 30;

  // Ball speed preset buttons
  const presets = [
    { value: 0.7, key: 'speedSlow' },
    { value: 1.0, key: 'speedNormal' },
    { value: 1.3, key: 'speedFast' },
    { value: 1.8, key: 'speedInsane' }
  ];
  const presetBoxW = 90;
  const presetBoxH = 32;

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const boxX = panelX + 40 + i * (presetBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: presetBoxW, h: presetBoxH })) {
      setBallSpeed(state, preset.value);
      return;
    }
  }

  yPos += presetBoxH + 60;

  // Win score buttons
  const winScores = GAME.WIN_SCORES;
  const scoreBoxW = UI.WIN_SCORE_BUTTON_WIDTH;
  const scoreBoxH = UI.WIN_SCORE_BUTTON_HEIGHT;

  for (let i = 0; i < winScores.length; i++) {
    const boxX = panelX + 40 + i * (scoreBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: scoreBoxW, h: scoreBoxH })) {
      setWinScore(state, winScores[i]);
      return;
    }
  }

  yPos += scoreBoxH + 30;

  // Endless mode toggle
  const endlessToggleW = 120;
  const endlessToggleH = 36;
  const endlessToggleX = panelX + 40;

  if (pointInRect(x, y, { x: endlessToggleX, y: yPos, w: endlessToggleW, h: endlessToggleH })) {
    setEndlessMode(state, !state.settings.endlessMode);
    return;
  }

  yPos += endlessToggleH + 60;

  // Paddle style buttons
  const paddleStyles = ['classic', 'retro', 'neon', 'custom'];
  const styleBoxW = 100;
  const styleBoxH = 36;

  for (let i = 0; i < paddleStyles.length; i++) {
    const style = paddleStyles[i];
    const boxX = panelX + 40 + i * (styleBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: styleBoxW, h: styleBoxH })) {
      setPaddleStyle(state, style);
      return;
    }
  }

  // Color boxes (only for custom style)
  if (state.settings.paddleStyle === 'custom') {
    yPos += styleBoxH + 60;
    const colorBoxSize = 40;
    const labelWidth = 120;

    // Left paddle color box
    const leftColorBoxX = panelX + 40 + labelWidth;
    if (pointInRect(x, y, { x: leftColorBoxX, y: yPos, w: colorBoxSize, h: colorBoxSize })) {
      setLeftPaddleColor(state, cycleColor(state.settings.leftPaddleColor));
      return;
    }

    // Right paddle color box
    const rightColorBoxX = panelX + 40 + 240 + labelWidth;
    if (pointInRect(x, y, { x: rightColorBoxX, y: yPos, w: colorBoxSize, h: colorBoxSize })) {
      setRightPaddleColor(state, cycleColor(state.settings.rightPaddleColor));
      return;
    }

    yPos += colorBoxSize + 40;
  }

  // Paddle size slider (always shown after custom colors or paddle styles)
  yPos += (state.settings.paddleStyle === 'custom' ? 0 : styleBoxH + 70);
  const paddleSizeSliderX = panelX + 40;
  if (pointInRect(x, y, { x: paddleSizeSliderX, y: yPos, w: sliderW, h: 20 })) {
    const normalized = (x - paddleSizeSliderX) / sliderW;
    const size = PADDLE.SIZE_MULTIPLIER_MIN + normalized * (PADDLE.SIZE_MULTIPLIER_MAX - PADDLE.SIZE_MULTIPLIER_MIN);
    setPaddleSize(state, size);
    return;
  }
}

/**
 * Cycles through preset colors for paddle customization
 * @param {string} currentColor - Current hex color
 * @returns {string} Next color in the cycle
 */
function cycleColor(currentColor) {
  const colors = [
    '#ffffff', // White
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff8800', // Orange
    '#8800ff', // Purple
    '#00ff88', // Teal
  ];

  const currentIndex = colors.indexOf(currentColor);
  const nextIndex = (currentIndex + 1) % colors.length;
  return colors[nextIndex];
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
    const sliderW = UI.SLIDER_WIDTH;
    if (pointInRect(x, y, { x: sliderX, y: yPos, w: sliderW, h: 20 })) {
      const normalized = (x - sliderX) / sliderW;
      const volume = Math.round(normalized * 100);
      setVolume(state, volume);
      return;
    }
  }
}

function handleRugbyClick(x, y, state, panelX, panelY) {
  if (!state.rugbyMode?.enabled) return;

  const contentY = panelY + 80 + 36 + 20;
  const contentX = panelX + 40;
  let yPos = contentY + 20;

  // Target score buttons
  yPos += 30; // Account for "Target Score:" label

  const targetScores = [25, 50, 75, 100];
  const scoreBoxW = 60;
  const scoreBoxH = 36;
  const scoreSpacing = 70;

  for (let i = 0; i < targetScores.length; i++) {
    const boxX = contentX + i * scoreSpacing;
    if (pointInRect(x, y, { x: boxX, y: yPos, w: scoreBoxW, h: scoreBoxH })) {
      setRugbyTargetScore(state, targetScores[i]);
      soundManager.playUIClick();
      return;
    }
  }

  yPos += scoreBoxH + 60;

  // Time limit buttons
  yPos += 30; // Account for "Time Limit:" label

  const timeLimits = [120, 180, 300, 600];
  const timeBoxW = 70;
  const timeBoxH = 36;
  const timeSpacing = 80;

  for (let i = 0; i < timeLimits.length; i++) {
    const boxX = contentX + i * timeSpacing;
    if (pointInRect(x, y, { x: boxX, y: yPos, w: timeBoxW, h: timeBoxH })) {
      setRugbyTimeLimit(state, timeLimits[i]);
      soundManager.playUIClick();
      return;
    }
  }
}

// Stub functions - to be implemented
function detectCustomizationHover(x, y, state, panelX, panelY) {
  // TODO: Implement customization hover detection
  return null;
}

function handleCustomizationClick(x, y, state, panelX, panelY) {
  const contentY = panelY + 80 + 36 + 20;
  let yPos = contentY + 20;

  // Paddle Style buttons
  yPos += 30; // Account for "Paddle Style:" label
  const paddleStyles = ['classic', 'retro', 'neon', 'custom'];
  const styleBoxW = 100;
  const styleBoxH = 36;

  for (let i = 0; i < paddleStyles.length; i++) {
    const style = paddleStyles[i];
    const boxX = panelX + 40 + i * (styleBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: styleBoxW, h: styleBoxH })) {
      setPaddleStyle(state, style);
      return;
    }
  }

  // Color pickers (only if custom style is selected)
  if (state.settings.paddleStyle === 'custom') {
    yPos += styleBoxH + 30; // Account for style buttons
    yPos += 30; // Account for "Paddle Colors:" label

    const colorBoxSize = 40;
    const labelWidth = 120;

    // Left paddle color box
    const leftColorBoxX = panelX + 40 + labelWidth;
    if (pointInRect(x, y, { x: leftColorBoxX, y: yPos, w: colorBoxSize, h: colorBoxSize })) {
      setLeftPaddleColor(state, cycleColor(state.settings.leftPaddleColor));
      return;
    }

    // Right paddle color box
    const rightColorBoxX = panelX + 40 + 240 + labelWidth;
    if (pointInRect(x, y, { x: rightColorBoxX, y: yPos, w: colorBoxSize, h: colorBoxSize })) {
      setRightPaddleColor(state, cycleColor(state.settings.rightPaddleColor));
      return;
    }

    yPos += colorBoxSize + 30;
  } else {
    yPos += styleBoxH + 30;
  }

  // Ball Style buttons
  yPos += 30; // Account for "Ball Style:" label
  const ballStyles = ['classic', 'retro', 'glow', 'soccer'];
  const ballStyleBoxW = 90;
  const ballStyleBoxH = 36;

  for (let i = 0; i < ballStyles.length; i++) {
    const style = ballStyles[i];
    const boxX = panelX + 40 + i * (ballStyleBoxW + 10);
    if (pointInRect(x, y, { x: boxX, y: yPos, w: ballStyleBoxW, h: ballStyleBoxH })) {
      setBallStyle(state, style);
      return;
    }
  }

  yPos += ballStyleBoxH + 40;

  // Ball Trail Toggle
  const trailToggleW = 100;
  const trailToggleH = 36;
  const trailToggleX = panelX + 40;

  if (pointInRect(x, y, { x: trailToggleX, y: yPos, w: trailToggleW, h: trailToggleH })) {
    setBallTrail(state, !state.settings.ballTrail);
    return;
  }

  // Ball Flash Toggle
  const flashToggleX = panelX + 40 + trailToggleW + 20;

  if (pointInRect(x, y, { x: flashToggleX, y: yPos, w: trailToggleW, h: trailToggleH })) {
    setBallFlash(state, !state.settings.ballFlash);
    return;
  }

  yPos += trailToggleH + 40;

  // Trail Length Slider (only show if trail is enabled)
  if (state.settings.ballTrail) {
    yPos += 30; // Account for "Trail Length:" label
    const sliderX = panelX + 40;
    const sliderW = UI.SLIDER_WIDTH;

    if (pointInRect(x, y, { x: sliderX, y: yPos, w: sliderW, h: 20 })) {
      const normalized = (x - sliderX) / sliderW;
      const trailLength = Math.round(3 + normalized * 7); // 3 to 10
      setTrailLength(state, trailLength);
      return;
    }
  }
}
