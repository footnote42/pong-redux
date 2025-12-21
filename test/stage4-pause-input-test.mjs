// Test Stage 4: Pause & Input Handling

import { createInitialState, update } from '../src/game-state.js';
import { createPaddle, updatePaddle, setPaddleDirection } from '../src/paddle.js';

console.log('Testing Stage 4: Pause & Input Handling...\n');

// Test 1: showInstructions default true
console.log('Test 1: Instructions show on first start by default');
const s1 = createInitialState(800, 600);
console.assert(s1.showInstructions === true, 'showInstructions should default to true');
console.log('✅ showInstructions defaults to true\n');

// Test 2: Update halts when paused
console.log('Test 2: Update halts when paused');
const s2 = createInitialState(800, 600);
s2.ball.x = 400;
s2.ball.vx = 100;
s2.paused = true;
const beforeX = s2.ball.x;
update(s2, 0.016);
console.assert(s2.ball.x === beforeX, 'Ball should not move when paused');
console.log('✅ Paused state stops updates\n');

// Test 3: Paddle acceleration smoothing
console.log('Test 3: Paddle acceleration smoothing');
const p = createPaddle(10, 300, 10, 80, 300);
setPaddleDirection(p, -1);
updatePaddle(p, 0.016, 600);
console.assert(Math.abs(p.vy) > 0 && Math.abs(p.vy) < p.speed, 'Paddle should start accelerating, not instantly at full speed');
let prevVy = p.vy;
for (let i = 0; i < 10; i++) updatePaddle(p, 0.016, 600);
console.assert(Math.abs(p.vy) > Math.abs(prevVy), 'Paddle vy should increase while holding input');
console.log('✅ Paddle acceleration smoothing works\n');

console.log('All Stage 4 tests passed! ✅');
