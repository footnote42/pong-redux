// Unit tests for the HTML overlay screens (ADR 0001): layout choice,
// Embedded vs Standalone detection, and which screen the state asks for.
import assert from 'node:assert/strict';
import { pickLayout, isEmbedded } from '../src/environment.js';
import { activeScreen } from '../src/screens.js';
import { victoryName } from '../src/screen-victory.js';
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
assert.equal(activeScreen(starting), 'hud', 'play shows only the HUD (pause button)');

showLanding(starting);
for (let i = 0; i < 60; i++) update(starting, 1 / 60);
assert.equal(activeScreen(starting), 'landing', 'returning to the menu shows the landing screen again');

// The single gameState model: PAUSED and GAME_OVER each map to their screen
const later = createInitialState(800, 600);
later.gameState = 'PLAYING';
assert.equal(activeScreen(later), 'hud', 'play shows the HUD (pause button)');
later.showSettings = true;
assert.equal(activeScreen(later), 'settings', 'settings sit over the HUD');
later.showSettings = false;
later.gameState = 'PAUSED';
assert.equal(activeScreen(later), 'pause', 'PAUSED shows the pause screen');
later.showSettings = true;
assert.equal(activeScreen(later), 'settings', 'settings opened from pause sit over the pause screen');
later.showSettings = false;
assert.equal(activeScreen(later), 'pause', 'closing settings shows the pause screen again');
later.showSettings = false;
showLanding(later);
assert.equal(later.gameState, 'PAUSED', 'quitting fades out while still PAUSED');
assert.equal(activeScreen(later), null, 'pause screen goes as soon as Quit to Menu is chosen');
const over = createInitialState(800, 600);
over.gameState = 'GAME_OVER';
over.winner = 'left';
assert.equal(activeScreen(over), 'victory', 'GAME_OVER shows the victory screen');
showLanding(over);
assert.equal(activeScreen(over), null, 'victory screen goes as soon as Main Menu is chosen');

// Victory names the winner: CPU only when the CPU holds the right paddle
const named = (mode, winner) => victoryName({ gameMode: mode, winner });
assert.equal(named('versus', 'left'), 'Player 1');
assert.equal(named('versus', 'right'), 'Player 2');
assert.equal(named('single', 'left'), 'Player 1');
assert.equal(named('single', 'right'), 'CPU');
assert.equal(named('rugby-single', 'right'), 'CPU');
assert.equal(named('rugby-versus', 'right'), 'Player 2');
console.log('screens: all tests passed');
