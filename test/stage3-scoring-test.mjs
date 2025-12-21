// Test Stage 3: Scoring & Win Conditions

import { createInitialState, update, restartGame } from '../src/game-state.js';

console.log('Testing Stage 3: Scoring & Win Conditions...\n');

// Test 1: Serve delay after scoring
console.log('Test 1: Serve delay after scoring');
const state1 = createInitialState(800, 600);
state1.ball.x = -10; // Force ball out of left boundary
update(state1, 0.016);
console.assert(state1.score.right === 1, 'Right player should score');
console.assert(state1.serveTimer > 0, 'Serve timer should be set');
console.assert(state1.ball.vx === 0 && state1.ball.vy === 0, 'Ball should be stopped');
console.log('✅ Serve delay works correctly\n');

// Test 2: Ball serves after timer expires
console.log('Test 2: Ball serves after timer expires');
const state2 = createInitialState(800, 600);
state2.serveTimer = 0.5;
state2.ball.vx = 0;
state2.ball.vy = 0;
update(state2, 0.6); // Update for more than 0.5s
console.assert(state2.serveTimer === 0, 'Serve timer should be 0');
console.assert(state2.ball.vx !== 0 || state2.ball.vy !== 0, 'Ball should be moving');
console.log('✅ Ball serves after timer expires\n');

// Test 3: Win condition at 11 points
console.log('Test 3: Win condition at 11 points');
const state3 = createInitialState(800, 600);
state3.score.left = 10; // One point away from winning
state3.ball.x = state3.width + 10; // Force ball out of right boundary
update(state3, 0.016);
console.assert(state3.score.left === 11, 'Left player should have 11 points');
console.assert(state3.gameOver === true, 'Game should be over');
console.assert(state3.winner === 'left', 'Left player should be winner');
console.assert(state3.serveTimer === 0, 'Serve timer should not be set when game is over');
console.log('✅ Win condition works at 11 points\n');

// Test 4: Game stops updating when over
console.log('Test 4: Game stops updating when over');
const state4 = createInitialState(800, 600);
state4.gameOver = true;
state4.winner = 'right';
state4.ball.x = 400;
state4.ball.vx = 200;
const initialX = state4.ball.x;
update(state4, 0.016);
console.assert(state4.ball.x === initialX, 'Ball should not move when game is over');
console.log('✅ Game stops updating when over\n');

// Test 5: Restart functionality
console.log('Test 5: Restart functionality');
const state5 = createInitialState(800, 600);
state5.score.left = 11;
state5.score.right = 7;
state5.gameOver = true;
state5.winner = 'left';
state5.paddles.left.y = 100;
state5.paddles.right.y = 500;
restartGame(state5);
console.assert(state5.score.left === 0, 'Left score should be reset');
console.assert(state5.score.right === 0, 'Right score should be reset');
console.assert(state5.gameOver === false, 'gameOver flag should be cleared');
console.assert(state5.winner === null, 'winner should be cleared');
console.assert(state5.serveTimer === 0.5, 'Serve timer should be set');
console.assert(state5.paddles.left.y === state5.height / 2, 'Left paddle should be centered');
console.assert(state5.paddles.right.y === state5.height / 2, 'Right paddle should be centered');
console.log('✅ Restart functionality works correctly\n');

// Test 6: Both players can win
console.log('Test 6: Both players can win');
const state6a = createInitialState(800, 600);
state6a.score.right = 10;
state6a.ball.x = -10;
update(state6a, 0.016);
console.assert(state6a.winner === 'right', 'Right player can win');

const state6b = createInitialState(800, 600);
state6b.score.left = 10;
state6b.ball.x = state6b.width + 10;
update(state6b, 0.016);
console.assert(state6b.winner === 'left', 'Left player can win');
console.log('✅ Both players can win\n');

console.log('═══════════════════════════════════════');
console.log('All Stage 3 tests passed! ✅');
console.log('═══════════════════════════════════════');
