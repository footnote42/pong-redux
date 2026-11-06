// src/settings-model.js
// What the settings panel offers and how each setting reaches the game state.
// Every change goes through the existing game-state.js setters, so values are
// clamped, applied to the live game and saved under the same localStorage keys
// ('pong:settings', 'pong:rugbySettings') as before. The HTML panel
// (src/screen-settings.js) reads and writes only through this module.

import {
  setDifficulty, setBallSpeed, setWinScore, setEndlessMode, setPaddleSize, setPaddleStyle,
  setLeftPaddleColor, setRightPaddleColor, setBallStyle, setBallTrail, setBallFlash,
  setTrailLength, setSoundEnabled, setVolume, setRugbyTargetScore, setRugbyTimeLimit,
} from './game-state.js';
import { BALL, PADDLE, AUDIO } from './constants.js';

/** Every tab, in display order. The Rugby tab shows only in Rugby mode. */
export const SETTINGS_TABS = ['gameplay', 'custom', 'rugby', 'audio', 'about'];

/**
 * The tabs to offer right now.
 * @param {Object} state - Game state
 * @returns {string[]}
 */
export function settingsTabs(state) {
  return SETTINGS_TABS.filter((tab) => tab !== 'rugby' || state.rugbyMode?.enabled);
}

/** The paddle colours the player can pick (the same ten the canvas cycled through). */
export const PADDLE_COLORS = [
  { value: '#ffffff', name: 'White' },
  { value: '#ff0000', name: 'Red' },
  { value: '#00ff00', name: 'Green' },
  { value: '#0000ff', name: 'Blue' },
  { value: '#ffff00', name: 'Yellow' },
  { value: '#ff00ff', name: 'Magenta' },
  { value: '#00ffff', name: 'Cyan' },
  { value: '#ff8800', name: 'Orange' },
  { value: '#8800ff', name: 'Purple' },
  { value: '#00ff88', name: 'Teal' },
];

const asString = (v) => String(v);
const asNumber = (v) => (v === '' || v == null ? NaN : Number(v));
const asBoolean = (v) => v === true || v === 'true' || v === 'on';
const times = (suffix) => (v) => `${v}${suffix}`;

// get: read the value from state. set: the game-state setter. parse: control
// value (string, number or boolean) to the setter's type. format: text for a
// slider's readout. isSelected: optional, for options that match a nearby
// value (the ball speed presets sit on a slider).
export const SETTINGS = {
  difficulty: { get: (s) => s.settings.difficulty, set: setDifficulty, parse: asString },
  ballSpeed: {
    get: (s) => s.settings.ballSpeed, set: setBallSpeed, parse: asNumber,
    min: BALL.SPEED_MULTIPLIER_MIN, max: BALL.SPEED_MULTIPLIER_MAX, step: 0.1,
    format: (v) => `${v.toFixed(1)}x`,
    isSelected: (s, option) => Math.abs(s.settings.ballSpeed - Number(option)) < 0.05,
  },
  winScore: { get: (s) => s.settings.winScore, set: setWinScore, parse: asNumber },
  endlessMode: { get: (s) => s.settings.endlessMode, set: setEndlessMode, parse: asBoolean },
  paddleSize: {
    get: (s) => s.settings.paddleSize, set: setPaddleSize, parse: asNumber,
    min: PADDLE.SIZE_MULTIPLIER_MIN, max: PADDLE.SIZE_MULTIPLIER_MAX, step: 0.1,
    format: (v) => `${v.toFixed(1)}x`,
  },
  paddleStyle: { get: (s) => s.settings.paddleStyle, set: setPaddleStyle, parse: asString },
  leftPaddleColor: { get: (s) => s.settings.leftPaddleColor, set: setLeftPaddleColor, parse: asString },
  rightPaddleColor: { get: (s) => s.settings.rightPaddleColor, set: setRightPaddleColor, parse: asString },
  ballStyle: { get: (s) => s.settings.ballStyle, set: setBallStyle, parse: asString },
  ballTrail: { get: (s) => s.settings.ballTrail, set: setBallTrail, parse: asBoolean },
  ballFlash: { get: (s) => s.settings.ballFlash, set: setBallFlash, parse: asBoolean },
  trailLength: {
    get: (s) => s.settings.trailLength, set: setTrailLength, parse: asNumber,
    min: 3, max: 10, step: 1, format: times(''),
  },
  soundEnabled: { get: (s) => s.settings.soundEnabled, set: setSoundEnabled, parse: asBoolean },
  volume: {
    get: (s) => s.settings.volume, set: setVolume, parse: asNumber,
    min: AUDIO.VOLUME_MIN, max: AUDIO.VOLUME_MAX, step: 1, format: times('%'),
  },
  rugbyTargetScore: { get: (s) => s.rugbySettings.targetScore, set: setRugbyTargetScore, parse: asNumber },
  rugbyTimeLimit: { get: (s) => s.rugbySettings.timeLimit, set: setRugbyTimeLimit, parse: asNumber },
};

/** Current value of a setting. */
export function readSetting(state, name) {
  return SETTINGS[name].get(state);
}

/**
 * Change a setting from a control's value.
 * @returns {boolean} false if the setting is unknown or the value is not usable
 */
export function applySetting(state, name, value) {
  const setting = SETTINGS[name];
  if (!setting) return false;
  const parsed = setting.parse(value);
  if (typeof parsed === 'number' && Number.isNaN(parsed)) return false;
  setting.set(state, parsed);
  return true;
}

/** Whether the option `option` of a choice setting is the selected one. */
export function isSelected(state, name, option) {
  const setting = SETTINGS[name];
  if (setting.isSelected) return setting.isSelected(state, option);
  return String(setting.get(state)) === String(option);
}

/** Text for a slider's readout, e.g. '1.3x' or '70%'. */
export function formatSetting(name, value) {
  return SETTINGS[name].format?.(value) ?? String(value);
}
