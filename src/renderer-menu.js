// src/renderer-menu.js
// Victory confetti (the menus and settings are HTML screens)

// --- Shared Helpers ---

// --- Main Menu Functions ---

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

