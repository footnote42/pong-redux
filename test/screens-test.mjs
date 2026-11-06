// Unit tests for the HTML overlay screens (ADR 0001): layout choice,
// Embedded vs Standalone detection, and which screen the state asks for.
import assert from 'node:assert/strict';
import { pickLayout, isEmbedded } from '../src/environment.js';
import { activeScreen } from '../src/screens.js';
import { createInitialState, startPlaying, showLanding, update } from '../src/game-state.js';

const media = (...matching) => (query) => matching.includes(query);

// Layout is chosen by input type, never by width
assert.equal(pickLayout(media('(pointer: coarse)')), 'touch', 'coarse pointer gets the Touch layout');
assert.equal(pickLayout(media('(pointer: fine)', '(hover: hover)')), 'desktop', 'mouse gets the Desktop layout');
assert.equal(pickLayout(media('(hover: none)')), 'touch', 'no hover and no fine pointer gets the Touch layout');
assert.equal(pickLayout(media('(pointer: fine)', '(hover: none)')), 'desktop', 'a fine pointer wins over no hover (pen, stylus)');
assert.equal(pickLayout(media()), 'desktop', 'unknown input defaults to the Desktop layout');


// Embedded when framed (the portfolio's Easter egg iframe); Standalone otherwise
const standalone = {}; standalone.self = standalone; standalone.top = standalone;
assert.equal(isEmbedded(standalone), false, 'own top window is Standalone');
assert.equal(isEmbedded({ self: {}, top: {} }), true, 'framed window is Embedded');
const blocked = { self: {}, get top() { throw new Error('SecurityError'); } };
assert.equal(isEmbedded(blocked), true, 'unreadable top window counts as Embedded');

// Which overlay screen the game state asks for
const fresh = createInitialState(800, 600);
assert.equal(activeScreen(fresh), 'landing', 'a new game shows the landing screen');
fresh.showSettings = true;
assert.equal(activeScreen(fresh), 'settings', 'settings replaces the landing screen');

const starting = createInitialState(800, 600);
startPlaying(starting, 'single');
assert.equal(activeScreen(starting), null, 'landing hides as soon as a Game mode is chosen, not after the fade');
for (let i = 0; i < 60; i++) update(starting, 1 / 60);
assert.equal(starting.gameState, 'PLAYING');
assert.equal(activeScreen(starting), null, 'no overlay screen during play');

showLanding(starting);
for (let i = 0; i < 60; i++) update(starting, 1 / 60);
assert.equal(activeScreen(starting), 'landing', 'returning to the menu shows the landing screen again');

// The single gameState model: no HTML screen while paused or after the game
// (pause and victory are still drawn on the canvas; settings sits over them)
const later = createInitialState(800, 600);
later.gameState = 'PAUSED';
assert.equal(activeScreen(later), null, 'no HTML screen while PAUSED');
later.gameState = 'GAME_OVER';
assert.equal(activeScreen(later), null, 'no HTML screen at GAME_OVER');
console.log('screens: all tests passed');
