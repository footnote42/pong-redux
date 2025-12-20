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

  // pause overlay
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '32px monospace';
    ctx.fillText('PAUSED', w / 2, h / 2);
  }
}

function drawPaddle(ctx, p) {
  ctx.fillRect(p.x, p.y - p.h / 2, p.w, p.h);
}