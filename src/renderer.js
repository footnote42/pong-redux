// src/renderer.js
// Simple canvas renderer for Pong

import { UI, GAME, PHYSICS } from './constants.js';

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
  const left = state.paddles.left;
  const right = state.paddles.right;
  drawPaddle(ctx, left, state.settings.paddleStyle, state.settings.leftPaddleColor, 'left');
  drawPaddle(ctx, right, state.settings.paddleStyle, state.settings.rightPaddleColor, 'right');

  // ball trail (if enabled)
  if (state.settings.ballTrail && state.ballTrail && state.ballTrail.length > 0) {
    drawBallTrail(ctx, state.ballTrail, state.ball.r, state.settings.ballColor);
  }
  
  // ball
  drawBall(ctx, state.ball, state.settings.ballStyle, state.settings.ballColor, state.ballFlashTimer > 0);
  
  // particles
  drawParticles(ctx, state.particles);

  // score (with animation)
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  const displayLeft = Math.round(state.scoreDisplay.left);
  const displayRight = Math.round(state.scoreDisplay.right);
  ctx.fillText(displayLeft, w * 0.25, 40);
  ctx.fillText(displayRight, w * 0.75, 40);

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
    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;
    const gap = 40;
    const cx = w / 2;
    const y = h * 0.5 - btnH / 2;
    const single = { x: cx - btnW - gap / 2, y, w: btnW, h: btnH };
    const versus = { x: cx + gap / 2, y, w: btnW, h: btnH };

    function drawBtn(b, label, hovered, buttonName) {
      // Button press animation (scale down when pressed)
      const isPressed = state.buttonPressAnim.active && state.buttonPressAnim.buttonName === buttonName;
      const scale = isPressed ? 0.95 : 1.0;
      
      ctx.save();
      if (isPressed) {
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      }
      
      ctx.fillStyle = hovered ? '#fff' : '#222';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = hovered ? '#000' : '#fff';
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 6);
      
      ctx.restore();
    }

    drawBtn(single, '1 Player (vs CPU)', state.landingHover === 'single', 'single');
    drawBtn(versus, '2 Players (Local)', state.landingHover === 'versus', 'versus');

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
    ctx.fillText('Open Settings: Tab or click gear', w / 2, h * 0.82);
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
    
    // Pulsing "PAUSED" text
    const pulsePhase = state.pauseAnim.pulseTimer * state.pauseAnim.pulseSpeed;
    const pulseAlpha = 0.7 + 0.3 * Math.sin(pulsePhase * Math.PI * 2);
    const pulseScale = 1.0 + 0.05 * Math.sin(pulsePhase * Math.PI * 2);
    
    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.translate(w / 2, h / 2);
    ctx.scale(pulseScale, pulseScale);
    ctx.fillStyle = '#fff';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 0, 0);
    ctx.restore();
    
    ctx.fillStyle = '#aaa';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
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
  
  // Fade transition overlay (drawn last, on top of everything)
  if (state.transitions.active) {
    const progress = 1 - (state.transitions.timer / state.transitions.duration);
    let alpha;
    
    if (state.transitions.type === 'fadeOut') {
      alpha = progress; // 0 to 1
    } else {
      alpha = 1 - progress; // 1 to 0
    }
    
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Draws a paddle with the specified style
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} p - Paddle object with x, y, w, h properties
 * @param {string} style - Paddle style ('classic', 'retro', 'neon', 'custom')
 * @param {string} color - Paddle color (used for custom style)
 * @param {string} side - Paddle side ('left' or 'right')
 */
function drawPaddle(ctx, p, style = 'classic', color = '#ffffff', side = 'left') {
  switch (style) {
    case 'retro':
      drawRetroPaddle(ctx, p, color);
      break;
    case 'neon':
      drawNeonPaddle(ctx, p, color);
      break;
    case 'custom':
      drawCustomPaddle(ctx, p, color);
      break;
    case 'classic':
    default:
      drawClassicPaddle(ctx, p);
      break;
  }
}

/**
 * Draws a classic simple rectangle paddle
 */
function drawClassicPaddle(ctx, p) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(p.x, p.y - p.h / 2, p.w, p.h);
}

/**
 * Draws a retro segmented/pixelated paddle
 */
function drawRetroPaddle(ctx, p, color) {
  const segments = 5;
  const segmentHeight = p.h / segments;
  const gap = 2;
  
  ctx.fillStyle = color;
  for (let i = 0; i < segments; i++) {
    const segY = p.y - p.h / 2 + i * segmentHeight;
    ctx.fillRect(p.x, segY, p.w, segmentHeight - gap);
  }
}

/**
 * Draws a neon glowing paddle with edge effects
 */
function drawNeonPaddle(ctx, p, color) {
  // Outer glow
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y - p.h / 2, p.w, p.h);
  
  // Inner bright core
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff';
  ctx.fillRect(p.x + 2, p.y - p.h / 2 + 2, p.w - 4, p.h - 4);
  
  // Reset shadow
  ctx.shadowBlur = 0;
}

/**
 * Draws a custom colored paddle
 */
function drawCustomPaddle(ctx, p, color) {
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y - p.h / 2, p.w, p.h);
  
  // Add subtle border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x, p.y - p.h / 2, p.w, p.h);
}


/**
 * Draws a ball with the specified style and effects
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} ball - Ball object with x, y, r properties
 * @param {string} style - Ball style ('classic', 'retro', 'glow', 'soccer')
 * @param {string} color - Ball color
 * @param {boolean} flash - Whether to show collision flash
 */
function drawBall(ctx, ball, style = 'classic', color = '#ffffff', flash = false) {
  ctx.save();
  
  // Apply flash effect if active
  if (flash) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
  }
  
  switch (style) {
    case 'retro':
      drawRetroBall(ctx, ball, color);
      break;
    case 'glow':
      drawGlowBall(ctx, ball, color);
      break;
    case 'soccer':
      drawSoccerBall(ctx, ball, color);
      break;
    case 'classic':
    default:
      drawClassicBall(ctx, ball, color);
      break;
  }
  
  ctx.restore();
}

/**
 * Draws a classic simple circle ball
 */
function drawClassicBall(ctx, ball, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws a retro pixelated/8-bit style ball
 */
function drawRetroBall(ctx, ball, color) {
  ctx.fillStyle = color;
  
  // Draw as a square rotated 45 degrees for retro look
  const size = ball.r * 1.4;
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

/**
 * Draws a glowing ball with neon effect
 */
function drawGlowBall(ctx, ball, color) {
  // Outer glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner bright core
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws a soccer ball pattern
 */
function drawSoccerBall(ctx, ball, color) {
  // Base circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  
  // Pentagon pattern
  ctx.fillStyle = '#000';
  const pentSize = ball.r * 0.5;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = ball.x + Math.cos(angle) * pentSize;
    const y = ball.y + Math.sin(angle) * pentSize;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws particles
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} particles - Array of particle objects
 */
function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    const size = 2 + alpha * 2;
    
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws the ball trail effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} trail - Array of {x, y} positions
 * @param {number} radius - Ball radius
 * @param {string} color - Ball color
 */
function drawBallTrail(ctx, trail, radius, color) {
  const len = trail.length;
  for (let i = 0; i < len; i++) {
    const alpha = (i + 1) / len; // Fade from 0 to 1
    const size = radius * alpha * 0.8;
    ctx.fillStyle = color + Math.floor(alpha * 128).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, size, 0, Math.PI * 2);
    ctx.fill();
  }
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
  const panelX = w * UI.SETTINGS_PANEL.WIDTH_RATIO;
  const panelY = h * UI.SETTINGS_PANEL.HEIGHT_RATIO;
  const panelW = w * UI.SETTINGS_PANEL.PANEL_WIDTH_RATIO;
  const panelH = h * UI.SETTINGS_PANEL.PANEL_HEIGHT_RATIO;

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
  const tabs = ['gameplay', 'custom', 'audio', 'about'];
  const tabW = UI.TAB_WIDTH;
  const tabH = UI.TAB_HEIGHT;
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
  } else if (state.settingsTab === 'custom') {
    drawCustomizationSettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
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

  y += boxH + 30;
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';
  ctx.fillStyle = '#fff';

  // Ball Speed
  ctx.fillText('Ball Speed: ' + state.settings.ballSpeed.toFixed(1) + 'x', panelX + 40, y);
  y += 30;
  drawSlider(ctx, panelX + 40, y, 300, state.settings.ballSpeed, 0.5, 2.0, 'ballSpeed', state.settingsHover);

  y += 30;

  // Ball Speed Presets
  const presets = [
    { name: 'Slow', value: 0.7, key: 'speedSlow' },
    { name: 'Normal', value: 1.0, key: 'speedNormal' },
    { name: 'Fast', value: 1.3, key: 'speedFast' },
    { name: 'Insane', value: 1.8, key: 'speedInsane' }
  ];
  const presetBoxW = 90;
  const presetBoxH = 32;

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const boxX = panelX + 40 + i * (presetBoxW + 10);
    const isHovered = state.settingsHover === preset.key;
    const isSelected = Math.abs(state.settings.ballSpeed - preset.value) < 0.01;

    ctx.fillStyle = isHovered ? '#444' : '#222';
    ctx.fillRect(boxX, y, presetBoxW, presetBoxH);
    ctx.strokeStyle = isSelected ? '#0f0' : '#666';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(boxX, y, presetBoxW, presetBoxH);

    ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(preset.name, boxX + presetBoxW / 2, y + presetBoxH / 2 + 5);
  }

  y += presetBoxH + 30;

  // Win Score
  ctx.fillText('Win Score:', panelX + 40, y);
  y += 30;
  const winScores = [5, 7, 11, 15, 21];
  const scoreBoxW = UI.WIN_SCORE_BUTTON_WIDTH;
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

  y += scoreBoxH + 30;

  // Endless Mode Toggle
  const endlessToggleW = 120;
  const endlessToggleH = 36;
  const endlessToggleX = panelX + 40;
  const isEndlessHovered = state.settingsHover === 'endlessMode';

  ctx.fillStyle = isEndlessHovered ? '#444' : '#222';
  ctx.fillRect(endlessToggleX, y, endlessToggleW, endlessToggleH);
  ctx.strokeStyle = state.settings.endlessMode ? '#0f0' : '#666';
  ctx.lineWidth = state.settings.endlessMode ? 2 : 1;
  ctx.strokeRect(endlessToggleX, y, endlessToggleW, endlessToggleH);

  ctx.fillStyle = state.settings.endlessMode ? '#0f0' : '#aaa';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Endless Mode', endlessToggleX + endlessToggleW / 2, y + endlessToggleH / 2 + 5);

  y += endlessToggleH + 30;

  // Paddle Size
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Paddle Size: ' + state.settings.paddleSize.toFixed(1) + 'x', panelX + 40, y);
  y += 30;
  drawSlider(ctx, panelX + 40, y, 300, state.settings.paddleSize, 0.5, 1.5, 'paddleSize', state.settingsHover);
}


function drawCustomizationSettings(state, ctx, w, h, panelX, contentY, panelW, contentH) {
  let y = contentY + 20;
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';

  // Paddle Style
  ctx.fillStyle = '#fff';
  ctx.fillText('Paddle Style:', panelX + 40, y);
  y += 30;

  const paddleStyles = ['classic', 'retro', 'neon', 'custom'];
  const styleBoxW = 100;
  const styleBoxH = 36;

  for (let i = 0; i < paddleStyles.length; i++) {
    const style = paddleStyles[i];
    const boxX = panelX + 40 + i * (styleBoxW + 10);
    const isHovered = state.settingsHover === 'paddleStyle_' + style;
    const isSelected = state.settings.paddleStyle === style;

    ctx.fillStyle = isHovered ? '#444' : '#222';
    ctx.fillRect(boxX, y, styleBoxW, styleBoxH);
    ctx.strokeStyle = isSelected ? '#0f0' : '#666';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(boxX, y, styleBoxW, styleBoxH);

    ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(style.charAt(0).toUpperCase() + style.slice(1), boxX + styleBoxW / 2, y + styleBoxH / 2 + 6);
  }

  // Color pickers (only show for custom style)
  if (state.settings.paddleStyle === 'custom') {
    y += styleBoxH + 30;
    ctx.textAlign = 'left';
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Paddle Colors:', panelX + 40, y);
    
    y += 30;
    
    // Left paddle color
    const colorBoxSize = 40;
    const labelWidth = 120;
    
    ctx.fillText('Left:', panelX + 40, y + colorBoxSize / 2 + 6);
    const leftColorBoxX = panelX + 40 + labelWidth;
    const isLeftHovered = state.settingsHover === 'leftPaddleColor';
    
    ctx.fillStyle = state.settings.leftPaddleColor;
    ctx.fillRect(leftColorBoxX, y, colorBoxSize, colorBoxSize);
    ctx.strokeStyle = isLeftHovered ? '#fff' : '#666';
    ctx.lineWidth = isLeftHovered ? 2 : 1;
    ctx.strokeRect(leftColorBoxX, y, colorBoxSize, colorBoxSize);
    
    // Right paddle color
    ctx.fillStyle = '#fff';
    ctx.fillText('Right:', panelX + 40 + 240, y + colorBoxSize / 2 + 6);
    const rightColorBoxX = panelX + 40 + 240 + labelWidth;
    const isRightHovered = state.settingsHover === 'rightPaddleColor';
    
    ctx.fillStyle = state.settings.rightPaddleColor;
    ctx.fillRect(rightColorBoxX, y, colorBoxSize, colorBoxSize);
    ctx.strokeStyle = isRightHovered ? '#fff' : '#666';
    ctx.lineWidth = isRightHovered ? 2 : 1;
    ctx.strokeRect(rightColorBoxX, y, colorBoxSize, colorBoxSize);
    
    y += colorBoxSize + 30;
  } else {
    y += styleBoxH + 30;
  }

  // Ball Style
  ctx.textAlign = 'left';
  ctx.font = '18px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Ball Style:', panelX + 40, y);
  y += 30;

  const ballStyles = ['classic', 'retro', 'glow', 'soccer'];
  const ballStyleBoxW = 90;
  const ballStyleBoxH = 36;

  for (let i = 0; i < ballStyles.length; i++) {
    const style = ballStyles[i];
    const boxX = panelX + 40 + i * (ballStyleBoxW + 10);
    const isHovered = state.settingsHover === 'ballStyle_' + style;
    const isSelected = state.settings.ballStyle === style;

    ctx.fillStyle = isHovered ? '#444' : '#222';
    ctx.fillRect(boxX, y, ballStyleBoxW, ballStyleBoxH);
    ctx.strokeStyle = isSelected ? '#0f0' : '#666';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(boxX, y, ballStyleBoxW, ballStyleBoxH);

    ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(style.charAt(0).toUpperCase() + style.slice(1), boxX + ballStyleBoxW / 2, y + ballStyleBoxH / 2 + 6);
  }

  y += ballStyleBoxH + 40;

  // Ball Trail Toggle
  ctx.textAlign = 'left';
  const trailToggleW = 100;
  const trailToggleH = 36;
  const trailToggleX = panelX + 40;
  const isTrailHovered = state.settingsHover === 'ballTrail';

  ctx.fillStyle = isTrailHovered ? '#444' : '#222';
  ctx.fillRect(trailToggleX, y, trailToggleW, trailToggleH);
  ctx.strokeStyle = state.settings.ballTrail ? '#0f0' : '#666';
  ctx.lineWidth = state.settings.ballTrail ? 2 : 1;
  ctx.strokeRect(trailToggleX, y, trailToggleW, trailToggleH);

  ctx.fillStyle = state.settings.ballTrail ? '#0f0' : '#aaa';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Ball Trail', trailToggleX + trailToggleW / 2, y + trailToggleH / 2 + 5);

  // Ball Flash Toggle
  const flashToggleX = panelX + 40 + trailToggleW + 20;
  const isFlashHovered = state.settingsHover === 'ballFlash';

  ctx.fillStyle = isFlashHovered ? '#444' : '#222';
  ctx.fillRect(flashToggleX, y, trailToggleW, trailToggleH);
  ctx.strokeStyle = state.settings.ballFlash ? '#0f0' : '#666';
  ctx.lineWidth = state.settings.ballFlash ? 2 : 1;
  ctx.strokeRect(flashToggleX, y, trailToggleW, trailToggleH);

  ctx.fillStyle = state.settings.ballFlash ? '#0f0' : '#aaa';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Flash Effect', flashToggleX + trailToggleW / 2, y + trailToggleH / 2 + 5);

  y += trailToggleH + 40;

  // Trail Length Slider (only show if trail is enabled)
  if (state.settings.ballTrail) {
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Trail Length: ' + state.settings.trailLength, panelX + 40, y);
    y += 30;
    drawSlider(ctx, panelX + 40, y, 300, state.settings.trailLength, 3, 10, 'trailLength', state.settingsHover);
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
