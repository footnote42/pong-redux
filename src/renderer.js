// src/renderer.js
// Simple canvas renderer for Pong

export function render(state, ctx, interp = 0) {
  const w = state.width;
  const h = state.height;

  // background
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, w, h);

  // center dashed line
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // paddles
  ctx.fillStyle = '#fff';
  const left = state.paddles.left;
  const right = state.paddles.right;
  drawPaddle(ctx, left);
  drawPaddle(ctx, right);

  // ball
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();

  // score
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.score.left, w * 0.25, 40);
  ctx.fillText(state.score.right, w * 0.75, 40);

  // landing screen
  if (state.gameState === 'LANDING') {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText('PONG REDUX', w / 2, h * 0.25);

    // Buttons
    const btnW = 260;
    const btnH = 60;
    const gap = 40;
    const cx = w / 2;
    const y = h * 0.5 - btnH / 2;
    const single = { x: cx - btnW - gap / 2, y, w: btnW, h: btnH };
    const versus = { x: cx + gap / 2, y, w: btnW, h: btnH };

    function drawBtn(b, label, hovered) {
      ctx.fillStyle = hovered ? '#fff' : '#222';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = hovered ? '#000' : '#fff';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 6);
    }

    drawBtn(single, '1 Player (vs CPU)', state.landingHover === 'single');
    drawBtn(versus, '2 Players (Local)', state.landingHover === 'versus');

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('Press 1 or 2, or click a button to start', w / 2, h * 0.75);
    return;
  }

  // instructions overlay (first-time)
  if (state.showInstructions) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '40px monospace';
    ctx.fillText('PONG REDUX', w / 2, h * 0.28);
    ctx.font = '20px monospace';
    ctx.fillText('Player 1: W / S', w / 2, h * 0.44);
    ctx.fillText('Player 2: Arrow Up / Arrow Down', w / 2, h * 0.50);
    ctx.fillText('P or ESC to pause', w / 2, h * 0.56);
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press any key to start', w / 2, h * 0.72);
    return; // skip other overlays while instructions shown
  }

  // pause overlay
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '32px monospace';
    ctx.fillText('PAUSED', w / 2, h / 2);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Player 1: W/S  |  Player 2: Arrow Up/Down', w / 2, h / 2 + 40);
    ctx.fillText('Press P or ESC to resume', w / 2, h / 2 + 70);
  }

  // game over overlay
  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';

    // Winner announcement
    ctx.font = '48px monospace';
    const winnerText = state.winner === 'left' ? 'LEFT PLAYER WINS!' : 'RIGHT PLAYER WINS!';
    ctx.fillText(winnerText, w / 2, h / 2 - 40);

    // Final score
    ctx.font = '24px monospace';
    ctx.fillText(`Final Score: ${state.score.left} - ${state.score.right}`, w / 2, h / 2 + 20);

    // Restart instruction
    ctx.font = '20px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press SPACE to restart', w / 2, h / 2 + 80);
  }
}

function drawPaddle(ctx, p) {
  ctx.fillRect(p.x, p.y - p.h / 2, p.w, p.h);
}