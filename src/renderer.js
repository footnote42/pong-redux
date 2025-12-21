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

  // high score (top-right)
  if (state.highScore && state.highScore.score > 0) {
    ctx.textAlign = 'right';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`High Score: ${state.highScore.score} (${state.highScore.holder || '---'})`, w - 16, 20);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
  }

  // settings icon (top-right corner) - aligned with click area from input.js
  drawSettingsIcon(ctx, w - 64 + 24, 8 + 24, 24, state.settingsHover === 'settings' || state.showSettings);


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

    // High score display on landing screen
    if (state.highScore && state.highScore.score > 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '16px monospace';
      ctx.fillText(`High Score: ${state.highScore.score} (${state.highScore.holder || '---'})`, w / 2, h * 0.65 + 40);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('Press 1 or 2, or click a button to start', w / 2, h * 0.75);

    // Small settings hint
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('Open Settings: S or click gear', w / 2, h * 0.82);
  }

  // instructions overlay (first-time) - only show if not on landing
  if (state.showInstructions && state.gameState !== 'LANDING') {
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

  // pause overlay - only show if not on landing
  if (state.paused && state.gameState !== 'LANDING') {
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

  // game over overlay - only show if not on landing
  if (state.gameOver && state.gameState !== 'LANDING') {
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

  // settings overlay (drawn on top of everything else)
  if (state.showSettings) {
    drawSettingsOverlay(state, ctx, w, h);
  }
}

function drawPaddle(ctx, p) {
  ctx.fillRect(p.x, p.y - p.h / 2, p.w, p.h);
}

function drawSettingsIcon(ctx, x, y, size = 24, active = false) {
  // simple gear-like square with inner circle
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = active ? '#fff' : '#666';
  ctx.fillRect(-size/2, 0, size, size);
  ctx.strokeStyle = active ? '#fff' : '#444';
  ctx.strokeRect(-size/2, 0, size, size);
  ctx.fillStyle = active ? '#000' : '#fff';
  ctx.beginPath();
  ctx.arc(-size/2 + size/2, size/2, size/4, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawSettingsOverlay(state, ctx, w, h) {
  // Background
  const panelX = w * 0.15;
  const panelY = h * 0.15;
  const panelW = w * 0.7;
  const panelH = h * 0.7;

  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Title
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '32px monospace';
  ctx.fillText('Settings', w / 2, panelY + 50);

  // Tabs
  const tabs = ['gameplay', 'audio', 'about'];
  const tabW = 140;
  const tabH = 36;
  const tabY = panelY + 80;
  const tabStartX = w / 2 - (tabs.length * tabW) / 2;

  for (let i = 0; i < tabs.length; i++) {
    const tabX = tabStartX + i * tabW;
    const isActive = state.settingsTab === tabs[i];
    const isHovered = state.settingsHover === tabs[i];

    ctx.fillStyle = isActive ? '#333' : '#222';
    ctx.fillRect(tabX, tabY, tabW, tabH);
    ctx.strokeStyle = isActive ? '#fff' : '#666';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(tabX, tabY, tabW, tabH);

    ctx.fillStyle = isActive || isHovered ? '#fff' : '#aaa';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tabs[i].charAt(0).toUpperCase() + tabs[i].slice(1), tabX + tabW / 2, tabY + tabH / 2 + 6);
  }

  // Content area
  const contentY = tabY + tabH + 20;
  const contentH = panelY + panelH - contentY - 60;

  // Draw content based on active tab
  if (state.settingsTab === 'gameplay') {
    drawGameplaySettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
  } else if (state.settingsTab === 'audio') {
    drawAudioSettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
  } else if (state.settingsTab === 'about') {
    drawAboutSettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
  }

  // Close hint
  ctx.fillStyle = '#666';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press S or ESC to close', w / 2, panelY + panelH - 20);
}

function drawGameplaySettings(state, ctx, w, h, panelX, contentY, panelW, contentH) {
  let y = contentY + 20;
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';

  // Difficulty
  ctx.fillStyle = '#fff';
  ctx.fillText('AI Difficulty:', panelX + 40, y);
  y += 30;

  const difficulties = ['easy', 'medium', 'hard'];
  const boxW = 140;
  const boxH = 36;
  const startX = panelX + 40;

  for (let i = 0; i < difficulties.length; i++) {
    const diff = difficulties[i];
    const boxX = startX + i * (boxW + 10);
    const isHovered = state.settingsHover === diff;
    const isSelected = state.settings.difficulty === diff;

    ctx.fillStyle = isHovered ? '#444' : '#222';
    ctx.fillRect(boxX, y, boxW, boxH);
    ctx.strokeStyle = isSelected ? '#0f0' : '#666';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(boxX, y, boxW, boxH);

    ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(diff.charAt(0).toUpperCase() + diff.slice(1), boxX + boxW / 2, y + boxH / 2 + 6);
  }

  y += boxH + 40;
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';
  ctx.fillStyle = '#fff';

  // Ball Speed
  ctx.fillText('Ball Speed: ' + state.settings.ballSpeed.toFixed(1) + 'x', panelX + 40, y);
  y += 30;
  drawSlider(ctx, panelX + 40, y, 300, state.settings.ballSpeed, 0.5, 2.0, 'ballSpeed', state.settingsHover);

  y += 50;

  // Win Score
  ctx.fillText('Win Score:', panelX + 40, y);
  y += 30;
  const winScores = [5, 7, 11, 15, 21];
  const scoreBoxW = 60;
  const scoreBoxH = 36;

  for (let i = 0; i < winScores.length; i++) {
    const score = winScores[i];
    const boxX = panelX + 40 + i * (scoreBoxW + 10);
    const isHovered = state.settingsHover === 'winScore' + score;
    const isSelected = state.settings.winScore === score;

    ctx.fillStyle = isHovered ? '#444' : '#222';
    ctx.fillRect(boxX, y, scoreBoxW, scoreBoxH);
    ctx.strokeStyle = isSelected ? '#0f0' : '#666';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(boxX, y, scoreBoxW, scoreBoxH);

    ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), boxX + scoreBoxW / 2, y + scoreBoxH / 2 + 6);
  }
}

function drawAudioSettings(state, ctx, w, h, panelX, contentY, panelW, contentH) {
  let y = contentY + 20;
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';
  ctx.fillStyle = '#fff';

  // Sound Toggle
  ctx.fillText('Sound Effects:', panelX + 40, y);
  y += 30;

  const toggleW = 100;
  const toggleH = 36;
  const toggleX = panelX + 40;
  const isHovered = state.settingsHover === 'soundEnabled';

  ctx.fillStyle = isHovered ? '#444' : '#222';
  ctx.fillRect(toggleX, y, toggleW, toggleH);
  ctx.strokeStyle = state.settings.soundEnabled ? '#0f0' : '#666';
  ctx.lineWidth = 2;
  ctx.strokeRect(toggleX, y, toggleW, toggleH);

  ctx.fillStyle = state.settings.soundEnabled ? '#0f0' : '#f00';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.settings.soundEnabled ? 'ON' : 'OFF', toggleX + toggleW / 2, y + toggleH / 2 + 6);

  y += toggleH + 40;

  // Volume Slider
  if (state.settings.soundEnabled) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Volume: ' + state.settings.volume + '%', panelX + 40, y);
    y += 30;
    drawSlider(ctx, panelX + 40, y, 300, state.settings.volume, 0, 100, 'volume', state.settingsHover);
  } else {
    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('(Enable sound to adjust volume)', panelX + 40, y);
  }
}

function drawAboutSettings(state, ctx, w, h, panelX, contentY, panelW, contentH) {
  ctx.textAlign = 'center';
  ctx.font = '24px monospace';
  ctx.fillStyle = '#fff';

  let y = contentY + 40;
  ctx.fillText('Pong Redux', w / 2, y);

  y += 40;
  ctx.font = '16px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Version 0.8.0', w / 2, y);

  y += 60;
  ctx.font = '14px monospace';
  ctx.fillStyle = '#999';
  ctx.fillText('Built with vanilla JavaScript', w / 2, y);

  y += 24;
  ctx.fillText('Fixed-timestep game loop (60Hz)', w / 2, y);

  y += 24;
  ctx.fillText('ES6 modules architecture', w / 2, y);

  y += 60;
  ctx.font = '12px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('Created as a learning project', w / 2, y);

  y += 20;
  ctx.fillText('Demonstrating clean game architecture', w / 2, y);
}

function drawSlider(ctx, x, y, width, value, min, max, name, hover) {
  const sliderH = 20;
  const normalized = (value - min) / (max - min);
  const handleX = x + normalized * width;
  const isHovered = hover === name;

  // Track
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, width, sliderH);
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, sliderH);

  // Fill
  ctx.fillStyle = '#0a0';
  ctx.fillRect(x, y, normalized * width, sliderH);

  // Handle
  ctx.fillStyle = isHovered ? '#fff' : '#aaa';
  ctx.beginPath();
  ctx.arc(handleX, y + sliderH / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}
