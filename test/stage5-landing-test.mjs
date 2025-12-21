// Test Stage 5: Landing Screen & Mode Selection

import { createInitialState, startPlaying, showLanding } from '../src/game-state.js';

console.log('Testing Stage 5: Landing Screen & Mode Selection...\n');

// Test 1: showLanding transitions to LANDING
console.log('Test 1: showLanding sets gameState to LANDING');
const s1 = createInitialState(800, 600);
showLanding(s1);
console.assert(s1.gameState === 'LANDING', 'gameState should be LANDING after showLanding');
console.log('✅ showLanding works\n');

// Test 2: startPlaying sets mode and resets scores
console.log('Test 2: startPlaying sets gameMode and transitions to PLAYING');
const s2 = createInitialState(800, 600);
s2.score.left = 5;
s2.score.right = 3;
startPlaying(s2, 'single');
console.assert(s2.gameState === 'PLAYING', 'gameState should be PLAYING after startPlaying');
console.assert(s2.gameMode === 'single', 'gameMode should be set to single');
console.assert(s2.score.left === 0 && s2.score.right === 0, 'scores should be reset on start');
console.log('✅ startPlaying works\n');

console.log('All Stage 5 tests passed! ✅');
