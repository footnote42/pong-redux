// src/screens.js
// HTML overlay screens laid over the canvas (ADR 0001). The canvas draws
// gameplay; menus are HTML so they can reflow into the Touch layout or the
// Desktop layout.

import { applyEnvironment } from './environment.js';
import { mountLanding } from './screen-landing.js';
import { mountPause, mountHud } from './screen-pause.js';
import { mountVictory } from './screen-victory.js';

const SCREENS = { landing: mountLanding, pause: mountPause, victory: mountVictory, hud: mountHud };

/**
 * The overlay screen the game state asks for, or null when the canvas alone
 * should show. This is the one place that maps state to a screen.
 * @param {Object} state - Game state
 * @returns {'landing'|'hud'|'pause'|'victory'|null}
 */
export function activeScreen(state) {
  if (state.showSettings) return null; // settings still draw on the canvas
  const leaving = state.transitions.active && state.transitions.toState !== 'LANDING';
  if (state.gameState === 'LANDING' && !leaving) return 'landing';
  // Quit to Menu and Main Menu fade out while the old gameState lingers
  const toMenu = state.transitions.active && state.transitions.toState === 'LANDING';
  if (toMenu) return null;
  if (state.gameState === 'PLAYING') return 'hud'; // the pause button
  if (state.gameState === 'PAUSED') return 'pause';
  if (state.gameState === 'GAME_OVER') return 'victory';
  return null;
}

/**
 * Bind every overlay screen in the page to the game state.
 *
 * Each screen is an element marked data-screen="<name>" (see index.html) and a
 * mount function in SCREENS: mount(el, state) returns { show?, hide?, unmount? }.
 * Call sync() once per frame; it shows the screen activeScreen() asks for and
 * hides the rest, touching the DOM only when that changes.
 *
 * To add a screen (pause, victory, settings): add its markup with
 * data-screen, a mount function, an entry in SCREENS, and a branch in
 * activeScreen().
 *
 * @param {Document} doc
 * @param {Object} state - Game state
 * @returns {{ sync: () => void, unmount: () => void }}
 */
export function mountScreens(doc, state) {
  const stopEnvironment = applyEnvironment(doc);
  const screens = {};
  for (const [name, mount] of Object.entries(SCREENS)) {
    const el = doc.querySelector(`[data-screen="${name}"]`);
    if (!el) continue;
    el.hidden = true;
    screens[name] = { el, ctrl: mount(el, state) || {} };
  }

  let current = null;

  function hide(name) {
    const screen = screens[name];
    if (!screen) return;
    // Don't leave keyboard focus on a control that is about to vanish
    if (screen.el.contains(doc.activeElement)) doc.activeElement.blur();
    screen.el.hidden = true;
    screen.ctrl.hide?.();
  }

  function show(name) {
    const screen = screens[name];
    if (!screen) return;
    screen.el.hidden = false;
    screen.ctrl.show?.(); // after unhiding, so it can take keyboard focus
  }

  function sync() {
    const next = activeScreen(state);
    if (next === current) return;
    hide(current);
    current = next;
    show(current);
  }

  function unmount() {
    for (const { ctrl } of Object.values(screens)) ctrl.unmount?.();
    stopEnvironment();
  }

  return { sync, unmount };
}
