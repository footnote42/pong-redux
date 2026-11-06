// src/renderer-menu.js
// Pause and victory rendering (the landing and settings screens are HTML)

// --- Shared Helpers ---

function drawButton(ctx, btn, hoverState) {
    const isHovered = hoverState === btn.mode;

    ctx.fillStyle = isHovered ? '#444' : '#222';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    ctx.strokeStyle = isHovered ? '#fff' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.fillStyle = isHovered ? '#fff' : '#aaa';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
}

// --- Main Menu Functions ---

export function getPauseButtons(w, h) {
    const bw = 200, bh = 44, cx = w / 2;
    return {
        resume:   { x: cx - bw / 2, y: h / 2 + 60,  w: bw, h: bh, text: 'Resume',       mode: 'resume' },
        settings: { x: cx - bw / 2, y: h / 2 + 116, w: bw, h: bh, text: 'Settings',     mode: 'settings' },
        quit:     { x: cx - bw / 2, y: h / 2 + 172, w: bw, h: bh, text: 'Quit to Menu', mode: 'quit' },
    };
}

export function drawPause(ctx, w, h, state) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    const pulse = 1.0 + Math.sin(Date.now() / 250) * 0.05;
    ctx.translate(w / 2, h / 2);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText('PAUSED', 0, 0);
    ctx.restore();

    const btns = getPauseButtons(w, h);
    for (const key in btns) {
        drawButton(ctx, btns[key], null);
    }
}

// Victory screen buttons, so a touch-only player can leave game over.
export function getVictoryButtons(w, h) {
    const bw = 200, bh = 44, cx = w / 2;
    return {
        again: { x: cx - bw / 2, y: h / 2 + 10, w: bw, h: bh, text: 'Play Again', mode: 'again' },
        menu:  { x: cx - bw / 2, y: h / 2 + 66, w: bw, h: bh, text: 'Main Menu',  mode: 'menu' },
    };
}

export function drawVictory(ctx, state, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // state.winner is 'left' | 'right'; show a player-facing name
    const isLeft = state.winner === 'left';
    const vsCpu = state.gameMode === 'single' || state.gameMode === 'rugby-single';
    const name = isLeft ? 'Player 1' : (vsCpu ? 'CPU' : 'Player 2');
    const color = isLeft ? state.settings.leftPaddleColor : state.settings.rightPaddleColor;

    ctx.fillStyle = color || '#fff';
    ctx.textAlign = 'center';
    ctx.font = '64px monospace';
    ctx.fillText(`${name} Wins!`, w / 2, h / 2 - 60);

    const btns = getVictoryButtons(w, h);
    for (const key in btns) {
        drawButton(ctx, btns[key], null);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('SPACE: Play Again    ESC: Main Menu', w / 2, h / 2 + 150);

    // Draw Confetti (Polish)
    if (state.confetti) {
        for (const p of state.confetti) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}

