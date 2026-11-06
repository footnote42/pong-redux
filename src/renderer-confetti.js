// src/renderer-confetti.js
// Victory confetti, the only menu-related drawing left on the canvas.
// Landing, pause, victory and settings are HTML screens.

// The pause and victory screens are HTML (src/screen-pause.js,
// src/screen-victory.js). Only the victory confetti stays on the canvas, behind
// the translucent victory screen.
export function drawConfetti(ctx, state) {
    if (state.confetti) {
        for (const p of state.confetti) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}

