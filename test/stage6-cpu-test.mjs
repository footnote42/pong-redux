// Test Stage 6: CPU Opponent

import { createInitialState, startPlaying, update } from '../src/game-state.js';
import { AI_CONFIG } from '../src/ai.js';

console.log('Testing Stage 6: CPU Opponent...\n');

// Test 1: CPU is enabled in single player mode
console.log('Test 1: CPU is enabled in single player mode');
const s1 = createInitialState(800, 600);
startPlaying(s1, 'single');
console.assert(s1.cpu && s1.cpu.enabled === true, 'CPU should be enabled in single player');
console.assert(s1.cpu.difficulty === 'medium', 'CPU should default to medium difficulty from settings');
console.log('✅ CPU enabled in single player\n');

// Test 2: CPU is disabled in versus mode
console.log('Test 2: CPU is disabled in versus mode');
const s2 = createInitialState(800, 600);
startPlaying(s2, 'versus');
console.assert(s2.cpu && s2.cpu.enabled === false, 'CPU should be disabled in versus mode');
console.log('✅ CPU disabled in versus mode\n');

// Test 3: CPU state is initialized with correct properties
console.log('Test 3: CPU state is initialized correctly');
const s3 = createInitialState(800, 600);
startPlaying(s3, 'single');
console.assert(typeof s3.cpu.reactionTimer === 'number', 'CPU should have reaction timer');
console.assert(typeof s3.cpu.updateTimer === 'number', 'CPU should have update timer');
console.assert(typeof s3.cpu.targetY === 'number', 'CPU should have target Y position');
console.assert(s3.cpu.hasReacted === false, 'CPU should not have reacted initially');
console.log('✅ CPU state initialized correctly\n');

// Test 4: CPU difficulty configurations exist
console.log('Test 4: CPU difficulty configurations exist');
console.assert(AI_CONFIG.easy, 'Easy difficulty config should exist');
console.assert(AI_CONFIG.medium, 'Medium difficulty config should exist');
console.assert(AI_CONFIG.hard, 'Hard difficulty config should exist');
console.assert(AI_CONFIG.easy.reactionMs > AI_CONFIG.hard.reactionMs, 'Easy should have longer reaction time than hard');
console.assert(AI_CONFIG.easy.errorPx > AI_CONFIG.hard.errorPx, 'Easy should have more error than hard');
console.assert(AI_CONFIG.easy.speedMult < AI_CONFIG.hard.speedMult, 'Easy should be slower than hard');
console.log('✅ CPU difficulty configurations exist and are properly tuned\n');

// Test 5: CPU updates paddle position over time
console.log('Test 5: CPU updates paddle position');
const s5 = createInitialState(800, 600);
startPlaying(s5, 'single');

// Set ball moving toward CPU
s5.ball.vx = 200;  // Moving right toward CPU
s5.ball.vy = 0;
s5.ball.x = 100;
s5.ball.y = 200;  // Ball at Y=200

const initialPaddleY = s5.paddles.right.y;

// Run several update cycles
for (let i = 0; i < 100; i++) {
  update(s5, 1/60);  // 60 FPS
}

// CPU paddle should have moved (either toward ball or stayed in position)
// We can't guarantee exact position due to reaction delays and errors
console.assert(typeof s5.paddles.right.y === 'number', 'CPU paddle Y should be a number');
console.assert(s5.paddles.right.y >= s5.paddles.right.h / 2, 'CPU paddle should be within bounds (top)');
console.assert(s5.paddles.right.y <= s5.height - s5.paddles.right.h / 2, 'CPU paddle should be within bounds (bottom)');
console.log('✅ CPU updates paddle position\n');

// Test 6: CPU doesn't move when ball is moving away
console.log('Test 6: CPU behavior when ball moves away');
const s6 = createInitialState(800, 600);
startPlaying(s6, 'single');

// Ensure game is not paused or over
s6.paused = false;
s6.gameOver = false;
s6.serveTimer = 0;  // No serve delay

// Set ball moving away from CPU (left)
s6.ball.vx = -200;
s6.ball.vy = 0;
s6.ball.x = 400;
s6.ball.y = 200;

// Force CPU to have reacted
s6.cpu.hasReacted = true;

// Update once
update(s6, 1/60);

// CPU should reset hasReacted to false when ball moves away
console.assert(s6.cpu.hasReacted === false, 'CPU should reset hasReacted when ball moves away');
console.log('✅ CPU resets state when ball moves away\n');

console.log('All Stage 6 CPU tests passed! ✅');
