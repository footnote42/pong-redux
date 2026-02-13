// src/renderer-core.js
// Main Renderer Orchestration

import { CANVAS, UI, GAME } from './constants.js';
import {
    drawPaddle,
    drawBall,
    drawRugbyBall,
    drawGoalPost,
    drawParticles,
    drawBallTrail,
    drawScore
} from './renderer-game.js';
import {
    drawLanding,
    drawPause,
    drawVictory,
    drawSettings
} from './renderer-menu.js';

export function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function render(state, ctx, interp = 0) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 1. Clear Canvas
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Center Line (only in game modes)
    if (state.gameState === 'PLAYING' || state.gameState === 'PAUSED' || state.gameState === 'GAME_OVER') {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 3. Draw Game World (if active)
    if (state.gameState === 'PLAYING' || state.gameState === 'PAUSED' || state.gameState === 'GAME_OVER') {
        // Rugby mode: Draw goal post zones
        if (state.rugbyMode?.enabled && state.gameState === 'PLAYING') {
            drawGoalPost(ctx, state.rugbyMode.goalPost);
        }

        // Paddles
        const left = state.paddles.left;
        const right = state.paddles.right;

        drawPaddle(ctx, left, state.settings.paddleStyle, state.settings.leftPaddleColor, 'left');
        drawPaddle(ctx, right, state.settings.paddleStyle, state.settings.rightPaddleColor, 'right');

        // Ball Trail
        if (state.settings.ballTrail) {
            drawBallTrail(ctx, state.ballTrail, state.ball.r, state.settings.ballColor);
        }

        // Ball
        if (state.rugbyMode?.enabled) {
            drawRugbyBall(ctx, state.ball);
        } else {
            drawBall(ctx, state.ball, state.settings.ballStyle, state.settings.ballColor, state.ballFlashTimer > 0);
        }

        // Particles
        drawParticles(ctx, state.particles);

        // Score
        drawScore(ctx, state);
    }

    // 4. Draw Overlays / UI
    if (state.gameState === 'LANDING') {
        drawLanding(ctx, state, w, h);
    } else if (state.gameState === 'PAUSED') {
        drawPause(ctx, w, h, state);
    } else if (state.gameState === 'GAME_OVER' || state.gameState === 'VICTORY') {
        drawVictory(ctx, state, w, h);
    }

    // 5. Draw Transitions (overlay everything except settings)
    if (state.transitions.active) {
        let alpha = 0;
        if (state.transitions.type === 'fadeOut') {
            alpha = 1 - (state.transitions.timer / state.transitions.duration);
        } else {
            alpha = state.transitions.timer / state.transitions.duration;
        }
        if (isNaN(alpha)) alpha = 0;
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fillRect(0, 0, w, h);
    }

    // 6. Draw Settings Menu (always on top if open)
    if (state.showSettings) {
        drawSettings(ctx, state, w, h);
    }
}

