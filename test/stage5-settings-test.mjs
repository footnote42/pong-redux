// Test Stage 5: Settings & High Score

import { createInitialState, setDifficulty, recordHighScore } from '../src/game-state.js';

console.log('Testing Stage 5: Settings & High Score...\n');

// Test 1: Default settings
console.log('Test 1: Default settings exist');
const s1 = createInitialState(800,600);
console.assert(s1.settings && s1.settings.difficulty === 'medium', 'Default difficulty should be medium');
console.log('✅ Default settings OK\n');

// Test 2: setDifficulty updates state
console.log('Test 2: setDifficulty updates state');
const s2 = createInitialState(800,600);
setDifficulty(s2, 'hard');
console.assert(s2.settings.difficulty === 'hard', 'Difficulty should be set to hard');
console.log('✅ setDifficulty updates state\n');

// Test 3: recordHighScore updates only when greater
console.log('Test 3: recordHighScore behaviour');
const s3 = createInitialState(800,600);
recordHighScore(s3, 10, 'Alice');
console.assert(s3.highScore.score === 10 && s3.highScore.holder === 'Alice', 'High score should update to Alice 10');
recordHighScore(s3, 5, 'Bob');
console.assert(s3.highScore.score === 10 && s3.highScore.holder === 'Alice', 'High score should remain Alice 10');
recordHighScore(s3, 20, 'Bob');
console.assert(s3.highScore.score === 20 && s3.highScore.holder === 'Bob', 'High score should update to Bob 20');
console.log('✅ recordHighScore works\n');

console.log('All Stage 5 settings tests passed! ✅');
