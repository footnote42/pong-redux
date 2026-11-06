// src/screens.js
// HTML overlay screens laid over the canvas (ADR 0001). The canvas draws
// gameplay; menus are HTML so they can reflow into the Touch layout or the
// Desktop layout.

import { applyEnvironment } from './environment.js';
import { mountLanding } from './screen-landing.js';
import { mountSettings } from './screen-settings.js';

const SCREENS = { landing: mountLanding, settings: mountSettings };

/**
 * The overlay screen the game state asks for, or null when the canvas alone
 * should show. This is the one place that maps state to a screen.
 * @param {Object} state - Game state
 * @returns {'landing'|'settings'|null}
 */
export function activeScreen(state) {
  if (state.showSettings) return 'settings'; // over the landing screen, pause or play
  const leaving = state.transitions.active && state.transitions.toState !== 'LANDING';
  if (state.gameState === 'LANDING' && !leaving) return 'landing';
  return null;
}

/**
 * Bind every overlay screen in the page to the game state.
 *
 * Each screen is an element marked data-screen="<name>" (see index.html) and a
 * mount function in SCREENS: mount(el, state) returns { show?, hide?, update?, unmount? }.
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
    screen.ctrl.show?.();
    screen.el.hidden = false;
  }

  function sync() {
    const next = activeScreen(state);
    if (next === current) {
      screens[current]?.ctrl.update?.(); // per-frame upkeep, e.g. settings changed by a shortcut
      return;
    }
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
