// src/fullscreen.js
// Ask a phone's browser for fullscreen when a game starts (issue #17). Only a
// Touch-layout browser tab on its own page asks: never Embedded (the portfolio
// owns that page), never on Desktop, never once launched from the home screen
// (the manifest already made it fullscreen). Refusal is harmless.

/**
 * @param {{layout: string, embedded: boolean, installed: boolean}} env
 * @returns {boolean}
 */
export function shouldRequestFullscreen({ layout, embedded, installed }) {
  return layout === 'touch' && !embedded && !installed;
}

/**
 * Call inside the user gesture that starts a game. Reads the environment
 * applyEnvironment() put on <html>.
 * @param {Document} doc
 */
export function requestGameFullscreen(doc) {
  const root = doc.documentElement;
  const env = {
    layout: root.dataset.layout,
    embedded: root.dataset.context === 'embedded',
    installed: root.dataset.installed === 'true',
  };
  if (!shouldRequestFullscreen(env) || !root.requestFullscreen) return;
  try {
    Promise.resolve(root.requestFullscreen())
      .then(() => doc.defaultView?.screen?.orientation?.lock?.('landscape'))
      .catch(() => {});
  } catch {
    // Refused or unsupported: play on in the browser
  }
}
