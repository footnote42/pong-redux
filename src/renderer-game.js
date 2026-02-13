// src/renderer-game.js
// Game entity rendering (Paddles, Ball, Particles)

import { CANVAS, UI, PADDLE, BALL, RUGBY, GAME, PHYSICS } from './constants.js';

// --- Helper Functions ---

export function drawPaddle(ctx, paddle, style, color, side) {
    const x = paddle.x - paddle.w / 2;
    const y = paddle.y - paddle.h / 2;
    const w = paddle.w;
    const h = paddle.h;

    if (style === 'classic') {
        ctx.fillStyle = color || '#fff';
        ctx.fillRect(x, y, w, h);
    } else if (style === 'retro') {
        ctx.fillStyle = color || '#fff';
        // Pixelated effect
        const pixelSize = 4;
        for (let py = 0; py < h; py += pixelSize) {
            for (let px = 0; px < w; px += pixelSize) {
                if ((px + py) % (pixelSize * 2) === 0) {
                    ctx.fillRect(x + px, y + py, pixelSize, pixelSize);
                }
            }
        }
    } else if (style === 'neon') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color || '#0f0';
        ctx.fillStyle = color || '#0f0';
        ctx.fillRect(x, y, w, h);

        // Inner white core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Reset shadow
        ctx.shadowBlur = 0;
    } else if (style === 'custom') {
        // Gradient fill
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, color || '#fff');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }
}

export function drawBall(ctx, ball, style, color, flash) {
    const x = ball.x;
    const y = ball.y;
    const r = ball.r;

    // Flash effect on impact
    if (flash) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.fill();
    }

    if (style === 'classic') {
        ctx.fillStyle = color || '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    } else if (style === 'retro') {
        ctx.fillStyle = color || '#fff';
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    } else if (style === 'glow') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color || '#0ff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    } else if (style === 'soccer') {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Draw pentagon pattern (simplified)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y, r / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawRugbyBall(ctx, ball) {
    const x = ball.x;
    const y = ball.y;
    const w = ball.width || ball.r * 2.4;
    const h = ball.height || ball.r * 1.6;
    const angle = ball.angle || 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Draw ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();

    // Draw laces
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 4, 0);
    ctx.lineTo(w / 4, 0);
    ctx.stroke();

    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w / 8, -h / 6);
        ctx.lineTo(i * w / 8, h / 6);
        ctx.stroke();
    }

    ctx.restore();
}

export function drawGoalPost(ctx, goalPost) {
    if (!goalPost || !goalPost.active) return;

    const x = goalPost.x;
    const y = goalPost.y;
    const w = goalPost.width || 40;
    const h = goalPost.height || 60;
    const postWidth = 4;
    const crossbarHeight = 30;
    const crossbarWidth = 3;

    ctx.save();
    ctx.translate(x, y);

    // Draw glowing effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffff00';

    // Draw H-shape: two vertical posts + crossbar
    ctx.fillStyle = '#ffff00';

    // Left post
    ctx.fillRect(-w / 2, -h / 2, postWidth, h);

    // Right post
    ctx.fillRect(w / 2 - postWidth, -h / 2, postWidth, h);

    // Crossbar (horizontal)
    ctx.fillRect(-w / 2, -h / 2 + crossbarHeight, w, crossbarWidth);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw "GOAL" label
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', 0, h / 2 + 15);

    ctx.restore();
}


export function drawBallTrail(ctx, trail, radius, color) {
    if (!trail) return;

    for (let i = 0; i < trail.length; i++) {
        const pos = trail[i];
        const alpha = (i + 1) / trail.length; // Fade out tail

        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = color || '#fff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

export function drawParticles(ctx, particles) {
    if (!particles) return;

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.life <= 0) continue;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

export function drawScore(ctx, state) {
    const w = state.width;
    ctx.fillStyle = '#fff';
    ctx.font = '80px monospace';
    ctx.textAlign = 'center';

    // Draw score with slight offset from center
    ctx.fillText(Math.floor(state.score.left), w / 2 - 100, 80);
    ctx.fillText(Math.floor(state.score.right), w / 2 + 100, 80);

    // Draw rugby rally multiplier
    if (state.rugbyMode?.enabled) {
        drawRugbyStats(ctx, state);
    }
}

function drawRugbyStats(ctx, state) {
    const w = state.width;
    const h = state.height;

    // Multiplier
    if (state.rugbyMode?.multiplier > 1) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#ff0055';
        ctx.fillText(`${state.rugbyMode.multiplier}x COMBO`, w / 2, 130);
    }

    // Timer (if time limit enabled)
    if (state.rugbySettings?.timeLimit) {
        const remaining = Math.max(0, state.rugbySettings.timeLimit - (state.rugbySettings.elapsedTime || 0));
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        ctx.font = '24px monospace';
        ctx.fillStyle = remaining < 10 ? '#f00' : '#fff'; // Red warning
        ctx.fillText(timeStr, w / 2, 40);
    }
}

