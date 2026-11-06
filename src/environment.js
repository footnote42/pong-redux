// src/environment.js
// Where and how Pong is being used: Touch layout or Desktop layout (by input
// type, never by width) and Embedded or Standalone (ADR 0001, ADR 0002).

/**
 * Pick the menu layout from the primary input type.
 * @param {(query: string) => boolean} matches - media query test, e.g. q => matchMedia(q).matches
 * @returns {'touch'|'desktop'}
 */
export function pickLayout(matches) {
  if (matches('(pointer: coarse)')) return 'touch';
  if (!matches('(pointer: fine)') && matches('(hover: none)')) return 'touch';
  return 'desktop';
}

/**
 * Embedded means running inside another page's frame (the portfolio's Easter
 * egg iframe); Standalone means Pong is the top window. If the top window
 * cannot even be read, assume Embedded.
 * @param {Window} win
 * @returns {boolean}
 */
export function isEmbedded(win) {
  try {
    return win.self !== win.top;
  } catch {
    return true;
  }
}

/**
 * Installed means launched from a phone's home screen: the browser reports a
 * fullscreen or standalone display mode (Android) or navigator.standalone
 * (iOS Safari). An installed Pong is still Standalone, not Embedded.
 * @param {Window} win
 * @returns {boolean}
 */
export function isInstalled(win) {
  const matches = (q) => !!win.matchMedia?.(q).matches;
  return matches('(display-mode: fullscreen)')
    || matches('(display-mode: standalone)')
    || win.navigator?.standalone === true;
}

const LAYOUT_QUERIES = ['(pointer: coarse)', '(pointer: fine)', '(hover: none)'];

/**
 * Mark the document with its layout and context so CSS can style it:
 * <html data-layout="touch|desktop" data-context="embedded|standalone">.
 * The layout is re-picked if the input type changes (a mouse plugged into a
 * tablet, say).
 * @param {Document} doc
 * @returns {() => void} stop listening for input-type changes
 */
export function applyEnvironment(doc) {
  const win = doc.defaultView;
  const root = doc.documentElement;
  const matches = (q) => win.matchMedia(q).matches;
  const setLayout = () => { root.dataset.layout = pickLayout(matches); };

  setLayout();
  root.dataset.context = isEmbedded(win) ? 'embedded' : 'standalone';
  if (isInstalled(win)) root.dataset.installed = 'true';

  const lists = LAYOUT_QUERIES.map((q) => win.matchMedia(q));
  lists.forEach((mql) => mql.addEventListener('change', setLayout));
  return () => lists.forEach((mql) => mql.removeEventListener('change', setLayout));
}
