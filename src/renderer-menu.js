// src/renderer-menu.js
// UI, Settings, and Menu rendering

import { CANVAS, UI, GAME, RUGBY } from './constants.js';

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

// --- Main Menu Functions ---

export function drawLanding(ctx, state, w, h) {
    // Title
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText('PONG REDUX', w / 2, h * 0.15); // Updated position

    // Draw Buttons
    const buttons = getLandingButtons(w, h); // Use helper to get layout

    // Single Player
    drawButton(ctx, buttons.single, state.landingHover);

    // Two Player
    drawButton(ctx, buttons.versus, state.landingHover);

    // Rugby Buttons
    drawButton(ctx, buttons['rugby-single'], state.landingHover);
    drawButton(ctx, buttons['rugby-versus'], state.landingHover);

    // High score display
    if (state.highScore && state.highScore.score > 0) {
        ctx.fillStyle = '#aaa';
        ctx.font = '16px monospace';
        ctx.fillText(`High Score: ${state.highScore.score} (${state.highScore.holder || '---'})`, w / 2, h * 0.80);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('Press 1 or 2, or click a button to start', w / 2, h * 0.90);

    // Small settings hint
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('Open Settings: Tab or click gear', w / 2, h * 0.95);

    // Settings Gear
    drawSettingsGear(ctx, w, state.settingsHover === 'gear');
}

export function drawPause(ctx, w, h, state) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Pulsing animation
    const pulse = 1.0 + Math.sin(Date.now() / 250) * 0.05;
    ctx.translate(w / 2, h / 2);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText('PAUSED', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('Press P or ESC to Resume', w / 2, h / 2 + 50);
    ctx.fillText('Press M for Menu', w / 2, h / 2 + 80);
}

export function drawVictory(ctx, state, w, h) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const winner = state.winner;
    const color = winner === 'Player 1' ? state.settings.leftPaddleColor : state.settings.rightPaddleColor;

    ctx.fillStyle = color || '#fff';
    ctx.textAlign = 'center';
    ctx.font = '64px monospace';
    ctx.fillText(`${winner} Wins!`, w / 2, h / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText('Press SPACE to Restart', w / 2, h / 2 + 40);
    ctx.fillText('Press ESC for Main Menu', w / 2, h / 2 + 80);

    // Draw Confetti (Polish)
    if (state.confetti) {
        for (const p of state.confetti) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}

// Internal helper for buttons layout (Must match input.js)
export function getLandingButtons(w, h) {
    const btnW = UI.BUTTON_WIDTH;
    const btnH = UI.BUTTON_HEIGHT;
    const gap = 40;
    const cx = w / 2;

    const y = h * 0.30 - btnH / 2;
    const single = { x: cx - btnW - gap / 2, y, w: btnW, h: btnH, text: 'vs CPU (1P)', mode: 'single' };
    const versus = { x: cx + gap / 2, y, w: btnW, h: btnH, text: '2 Players', mode: 'versus' };

    const rugby_single = {
        x: cx - btnW / 2,
        y: versus.y + btnH + 20,
        w: btnW,
        h: btnH,
        text: 'Rugby Mode (1P)',
        mode: 'rugby-single'
    };

    const rugby_versus = {
        x: cx - btnW / 2,
        y: rugby_single.y + btnH + 20,
        w: btnW,
        h: btnH,
        text: 'Rugby Mode (2P)',
        mode: 'rugby-versus'
    };

    const settings = { x: w - 64, y: 8, w: 48, h: 48, mode: 'settings' };

    return { single, versus, 'rugby-single': rugby_single, 'rugby-versus': rugby_versus, settings };
}


function drawSettingsGear(ctx, w, isHovered) {
    const x = w - 40;
    const y = 32;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = isHovered ? '#fff' : '#666';
    ctx.beginPath();
    // Draw gear simplified (circle with teeth)
    for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4, -14, 8, 6);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b0b0b'; // Hole
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// --- Settings Menu ---

export function drawSettings(ctx, state, w, h) {
    // Overlay background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, w, h);

    const panelW = w * UI.SETTINGS_PANEL.PANEL_WIDTH_RATIO;
    const panelH = h * UI.SETTINGS_PANEL.PANEL_HEIGHT_RATIO;
    const panelX = w * UI.SETTINGS_PANEL.WIDTH_RATIO;
    const panelY = h * UI.SETTINGS_PANEL.HEIGHT_RATIO;

    // Panel border
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Close button (top right)
    ctx.fillStyle = '#666';
    ctx.font = '24px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('x', panelX + panelW - 20, panelY + 30);

    // Title
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '32px monospace';
    ctx.fillText('SETTINGS', w / 2, panelY + 40);

    // Tabs
    const tabs = ['gameplay', 'custom', 'audio', 'about'];

    // Inject Rugby tab if enabled
    if (state.rugbyMode?.enabled) {
        tabs.splice(2, 0, 'rugby');
    }

    const tabW = UI.TAB_WIDTH;
    const tabH = UI.TAB_HEIGHT;
    const tabY = panelY + 80;
    const tabStartX = w / 2 - (tabs.length * tabW) / 2;

    for (let i = 0; i < tabs.length; i++) {
        const tabName = tabs[i];
        const tabX = tabStartX + i * tabW;
        const isActive = state.settingsTab === tabName;

        // Tab background
        ctx.fillStyle = isActive ? '#333' : '#111';
        ctx.fillRect(tabX, tabY, tabW, tabH);

        // Check if rugby tab needs special color
        if (tabName === 'rugby') {
            ctx.fillStyle = isActive ? '#004400' : '#002200'; // Dark green/greenish
            ctx.fillRect(tabX, tabY, tabW, tabH);
        }

        ctx.strokeStyle = isActive ? '#fff' : '#444';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(tabX, tabY, tabW, tabH);

        ctx.fillStyle = isActive ? '#fff' : '#888';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tabName.toUpperCase(), tabX + tabW / 2, tabY + tabH / 2 + 5);
    }

    // Draw content
    const contentY = tabY + tabH;
    const contentH = panelH - (contentY - panelY);

    ctx.fillStyle = '#222'; // Content background
    ctx.fillRect(panelX, contentY, panelW, contentH);
    ctx.strokeRect(panelX, contentY, panelW, contentH);

    if (state.settingsTab === 'gameplay') {
        drawGameplaySettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
    } else if (state.settingsTab === 'custom') {
        drawCustomizationSettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
    } else if (state.settingsTab === 'rugby') {
        drawRugbySettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
    } else if (state.settingsTab === 'audio') {
        drawAudioSettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
    } else if (state.settingsTab === 'about') {
        drawAboutSettings(state, ctx, w, h, panelX, contentY, panelW, contentH);
    }
}

// ... include all drawXXXSettings functions (Gameplay, Customization, Audio, Rugby, About) ...
// (Omitting full implementation details here for brevity, but will include in actual file write)
function drawGameplaySettings(state, ctx, w, h, panelX, contentY, panelW, contentH) {
    // ... implementation copied from renderer.js ...
    let y = contentY + 20;
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';

    // Difficulty
    ctx.fillText('Difficulty (1P):', panelX + 40, y);
    y += 30;

    const difficulties = GAME.DIFFICULTY_LEVELS;
    const boxW = UI.TAB_WIDTH;
    const boxH = UI.TAB_HEIGHT;
    const spacing = 10;
    const startX = panelX + UI.PANEL_PADDING;

    for (let i = 0; i < difficulties.length; i++) {
        const diff = difficulties[i];
        const boxX = startX + i * (boxW + spacing);
        const isSelected = state.settings.difficulty === diff;
        const isHovered = state.settingsHover === diff;

        ctx.fillStyle = isHovered ? '#444' : '#222';
        ctx.fillRect(boxX, y, boxW, boxH);
        ctx.strokeStyle = isSelected ? '#0f0' : '#666';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(boxX, y, boxW, boxH);

        ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(diff.toUpperCase(), boxX + boxW / 2, y + boxH / 2 + 5);
    }

    y += boxH + 30;

    // Ball Speed Slider
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText('Ball Speed Multiplier: ' + state.settings.ballSpeed.toFixed(1) + 'x', panelX + 40, y);
    y += 30;
    drawSlider(ctx, panelX + 40, y, 300, state.settings.ballSpeed, 0.5, 2.0, 'ballSpeed', state.settingsHover);

    y += 30;

    // Speed Presets
    const presets = [
        { label: 'Slow', key: 'speedSlow', val: 0.7 },
        { label: 'Normal', key: 'speedNormal', val: 1.0 },
        { label: 'Fast', key: 'speedFast', val: 1.3 },
        { label: 'Insane', key: 'speedInsane', val: 1.8 }
    ];
    const presetBoxW = 90;
    const presetBoxH = 32;

    for (let i = 0; i < presets.length; i++) {
        const preset = presets[i];
        const boxX = panelX + 40 + i * (presetBoxW + 10);
        const isHovered = state.settingsHover === preset.key;
        const isSelected = Math.abs(state.settings.ballSpeed - preset.val) < 0.1;

        ctx.fillStyle = isHovered ? '#444' : '#222';
        ctx.fillRect(boxX, y, presetBoxW, presetBoxH);
        ctx.strokeStyle = isSelected ? '#0f0' : '#666';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(boxX, y, presetBoxW, presetBoxH);

        ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(preset.label, boxX + presetBoxW / 2, y + presetBoxH / 2 + 5);
    }

    y += presetBoxH + 30;

    // Win Score
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('Points to Win:', panelX + 40, y);
    y += 30;

    const winScores = GAME.WIN_SCORES;
    const scoreBoxW = UI.WIN_SCORE_BUTTON_WIDTH;
    const scoreBoxH = UI.WIN_SCORE_BUTTON_HEIGHT;

    for (let i = 0; i < winScores.length; i++) {
        const score = winScores[i];
        const boxX = panelX + 40 + i * (scoreBoxW + 10);
        const isSelected = state.settings.winScore === score;
        const isHovered = state.settingsHover === 'winScore' + score;

        ctx.fillStyle = isHovered ? '#444' : '#222';
        ctx.fillRect(boxX, y, scoreBoxW, scoreBoxH);
        ctx.strokeStyle = isSelected ? '#0f0' : '#666';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(boxX, y, scoreBoxW, scoreBoxH);

        ctx.fillStyle = isHovered || isSelected ? '#fff' : '#aaa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(score, boxX + scoreBoxW / 2, y + scoreBoxH / 2 + 5);
    }

    y += scoreBoxH + 30;

    // Endless Mode
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
    const paddleSize = state.settings.paddleSize || 1.0;
    ctx.fillText('Paddle Size: ' + paddleSize.toFixed(1) + 'x', panelX + 40, y);
    y += 30;
    drawSlider(ctx, panelX + 40, y, 300, paddleSize, 0.5, 1.5, 'paddleSize', state.settingsHover);
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

    // Trail Length Slider
    if (state.settings.ballTrail) {
        ctx.textAlign = 'left';
        ctx.font = '18px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('Trail Length: ' + state.settings.trailLength, panelX + 40, y);
        y += 30;
        drawSlider(ctx, panelX + 40, y, 300, state.settings.trailLength, 3, 10, 'trailLength', state.settingsHover);
    }
}

function drawRugbySettings(state, ctx, w, h, panelX, contentY, panelW, contentH) {
    if (!state.rugbySettings) return;

    let y = contentY + 20;
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';

    // Target Score
    ctx.fillStyle = '#fff';
    ctx.fillText('Target Score:', panelX + 40, y);
    y += 30;

    const targetScores = RUGBY.TARGET_SCORES || [25, 50, 75, 100];
    const scoreBoxW = 60;
    const scoreBoxH = 36;
    const scoreSpacing = 70;
    const contentX = panelX + 40;

    for (let i = 0; i < targetScores.length; i++) {
        const score = targetScores[i];
        const boxX = contentX + i * scoreSpacing;
        const isSelected = state.rugbySettings.targetScore === score;
        const isHovered = state.settingsHover === 'rugbyTarget' + score;

        ctx.fillStyle = isHovered ? '#444' : (isSelected ? '#00bb66' : '#222');
        ctx.fillRect(boxX, y, scoreBoxW, scoreBoxH);
        ctx.strokeStyle = isSelected ? '#0f0' : '#666';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(boxX, y, scoreBoxW, scoreBoxH);

        ctx.fillStyle = isSelected || isHovered ? '#fff' : '#aaa';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(score.toString(), boxX + scoreBoxW / 2, y + scoreBoxH / 2 + 6);
    }

    y += scoreBoxH + 60;

    // Time Limit
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Time Limit:', panelX + 40, y);
    y += 30;

    const timeLimits = [
        { label: '2 min', value: 120 },
        { label: '3 min', value: 180 },
        { label: '5 min', value: 300 },
        { label: '10 min', value: 600 }
    ];
    const timeBoxW = 70;
    const timeBoxH = 36;
    const timeSpacing = 80;

    for (let i = 0; i < timeLimits.length; i++) {
        const timeLimit = timeLimits[i];
        const boxX = contentX + i * timeSpacing;
        const isSelected = state.rugbySettings.timeLimit === timeLimit.value;
        const isHovered = state.settingsHover === 'rugbyTime' + timeLimit.value;

        ctx.fillStyle = isHovered ? '#444' : (isSelected ? '#00bb66' : '#222');
        ctx.fillRect(boxX, y, timeBoxW, timeBoxH);
        ctx.strokeStyle = isSelected ? '#0f0' : '#666';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(boxX, y, timeBoxW, timeBoxH);

        ctx.fillStyle = isSelected || isHovered ? '#fff' : '#aaa';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeLimit.label, boxX + timeBoxW / 2, y + timeBoxH / 2 + 5);
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
