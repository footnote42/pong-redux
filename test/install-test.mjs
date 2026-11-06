// Home-screen install and fullscreen: Standalone detection and when to ask
// for fullscreen (issue #17).
import assert from 'node:assert/strict';
import { isInstalled, isEmbedded } from '../src/environment.js';
import { shouldRequestFullscreen, requestGameFullscreen } from '../src/fullscreen.js';

const win = ({ matching = [], standalone, framed = false } = {}) => {
  const w = {
    matchMedia: (q) => ({ matches: matching.includes(q) }),
    navigator: standalone === undefined ? {} : { standalone },
  };
  w.self = w;
  w.top = framed ? {} : w;
  return w;
};

// Installed: launched from a home screen
assert.equal(isInstalled(win()), false, 'plain browser tab is not installed');
assert.equal(isInstalled(win({ matching: ['(display-mode: fullscreen)'] })), true, 'display-mode fullscreen');
assert.equal(isInstalled(win({ matching: ['(display-mode: standalone)'] })), true, 'display-mode standalone');
assert.equal(isInstalled(win({ matching: ['(display-mode: minimal-ui)'] })), false, 'minimal-ui is still a browser');
assert.equal(isInstalled(win({ standalone: true })), true, 'iOS navigator.standalone');
assert.equal(isInstalled(win({ standalone: false })), false, 'iOS navigator.standalone false');

// Embedded still wins when framed, whatever the display mode says
const framedInstalled = win({ matching: ['(display-mode: standalone)'], framed: true });
assert.equal(isEmbedded(framedInstalled), true, 'a framed window is Embedded even if installed');

// When to ask for fullscreen: touch browser tab, Standalone, not installed
const ok = { layout: 'touch', embedded: false, installed: false };
assert.equal(shouldRequestFullscreen(ok), true, 'touch browser tab asks');
assert.equal(shouldRequestFullscreen({ ...ok, layout: 'desktop' }), false, 'desktop never asks');
assert.equal(shouldRequestFullscreen({ ...ok, embedded: true }), false, 'Embedded never asks');
assert.equal(shouldRequestFullscreen({ ...ok, installed: true }), false, 'already fullscreen from the home screen');

// requestGameFullscreen: calls the API inside the gesture, swallows refusal
function fakeDoc({ layout, context, installed, reject, noApi, lockReject }) {
  const calls = { fs: 0, lock: 0 };
  const root = { dataset: { layout, context, ...(installed ? { installed: 'true' } : {}) } };
  if (!noApi) root.requestFullscreen = () => { calls.fs++; return reject ? Promise.reject(new Error('denied')) : Promise.resolve(); };
  const doc = {
    documentElement: root,
    defaultView: { screen: { orientation: { lock: () => { calls.lock++; return lockReject ? Promise.reject(new Error('x')) : Promise.resolve(); } } } },
  };
  return { doc, calls };
}

let t = fakeDoc({ layout: 'touch', context: 'standalone' });
requestGameFullscreen(t.doc);
assert.equal(t.calls.fs, 1, 'requests fullscreen on a touch browser tab');
await Promise.resolve(); await Promise.resolve();
assert.equal(t.calls.lock, 1, 'then tries to lock landscape');

t = fakeDoc({ layout: 'touch', context: 'standalone', reject: true, lockReject: true });
requestGameFullscreen(t.doc); // must not throw or leave an unhandled rejection
await new Promise((r) => setTimeout(r, 10));

t = fakeDoc({ layout: 'touch', context: 'standalone', noApi: true });
requestGameFullscreen(t.doc); // iPhone Safari: no API, no error

for (const bad of [{ layout: 'desktop', context: 'standalone' }, { layout: 'touch', context: 'embedded' }, { layout: 'touch', context: 'standalone', installed: true }]) {
  t = fakeDoc(bad);
  requestGameFullscreen(t.doc);
  assert.equal(t.calls.fs, 0, `no request for ${JSON.stringify(bad)}`);
}

console.log('install tests passed');
