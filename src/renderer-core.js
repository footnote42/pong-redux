// src/renderer-core.js
// Main Renderer Orchestration

import { CANVAS } from './constants.js';
import {
    drawPaddle,
    drawBall,
    drawRugbyBall,
    drawParticles,
    drawBallTrail,
    drawScore
} from './renderer-game.js';
import {
    drawConfetti
} from './renderer-confetti.js';
import { discoColor } from './disco.js';

// Size the canvas backing store to its displayed CSS size x devicePixelRatio,
// and map the 800x600 court onto it. Runs every frame so resize, orientation
// and DPR changes are picked up without extra listeners.
export function fitToDisplay(ctx) {
    const canvas = ctx.canvas;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;

    const dpr = window.devicePixelRatio || 1;
    const bw = Math.round(cssW * dpr);
    const bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
    }
    ctx.setTransform(bw / CANVAS.DEFAULT_WIDTH, 0, 0, bh / CANVAS.DEFAULT_HEIGHT, 0, 0);
}

export function render(state, ctx, interp = 0) {
    fitToDisplay(ctx);
    const w = state.width;
    const h = state.height;
    const disco = state.settings.paddleStyle === 'disco';
    const now = disco ? performance.now() : 0;
    const paddleColor = (side) => disco
        ? discoColor(now, side)
        : state.settings[`${side}PaddleColor`];
    const ballColor = disco ? discoColor(now + 1000, 'left') : state.settings.ballColor;

    // 1. Clear Canvas
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Center Line (only in game modes)
    if (state.gameState === 'PLAYING' || state.gameState === 'PAUSED' || state.gameState === 'GAME_OVER') {
        ctx.strokeStyle = disco ? ballColor : '#444';
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
        // Paddles
        const left = state.paddles.left;
        const right = state.paddles.right;

        drawPaddle(ctx, left, state.settings.paddleStyle, paddleColor('left'), 'left');
        drawPaddle(ctx, right, state.settings.paddleStyle, paddleColor('right'), 'right');

        // Ball Trail
        if (state.settings.ballTrail) {
            drawBallTrail(ctx, state.ballTrail, state.ball.r, ballColor);
        }

        // Ball
        if (state.rugbyMode?.enabled) {
            drawRugbyBall(ctx, state.ball);
        } else {
            drawBall(ctx, state.ball, state.settings.ballStyle, ballColor, state.ballFlashTimer > 0);
        }

        // Particles
        drawParticles(ctx, state.particles);

        // Score
        drawScore(ctx, state);
    }

    // 4. Overlays: landing, pause and victory are HTML screens (src/screens.js);
    // only the victory confetti is drawn here, behind the victory screen
    if (state.gameState === 'GAME_OVER') {
        drawConfetti(ctx, state);
    }

    // 5. Draw Transitions (the settings panel is HTML, over the canvas)
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
}

