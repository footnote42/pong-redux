// src/sound.js
// Sound effects system using Web Audio API with procedural synthesis

/**
 * Sound manager for playing game sound effects
 * Uses Web Audio API to generate retro-style sounds procedurally
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5; // 0.0 to 1.0
    this.initialized = false;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Resume audio context if suspended (browser autoplay policy)
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol / 100)); // Convert 0-100 to 0-1
  }

  /**
   * Enable or disable all sounds
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Play paddle hit sound (short beep, higher pitch)
   */
  playPaddleHit() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.value = 440; // A4 note
    osc.type = 'square'; // Retro square wave

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Play wall bounce sound (short beep, medium pitch)
   */
  playWallBounce() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.value = 330; // E4 note (lower than paddle)
    osc.type = 'square';

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Play score point sound (ascending chime)
   */
  playScore() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine'; // Smoother tone for score

      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(this.volume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  /**
   * Play win game sound (victory fanfare)
   */
  playWin() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // Victory melody: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'triangle'; // Warmer tone for victory

      const startTime = now + i * 0.15;
      const duration = i === notes.length - 1 ? 0.4 : 0.2; // Last note longer

      gain.gain.setValueAtTime(this.volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Play UI click sound (subtle confirmation)
   */
  playUIClick() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.frequency.value = 800; // Higher pitch for UI
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

/**
 * Initialize sound system (call after user interaction)
 */
export function initSound() {
  soundManager.init();
}

/**
 * Update sound settings from game state
 */
export function updateSoundSettings(settings) {
  soundManager.setEnabled(settings.soundEnabled);
  soundManager.setVolume(settings.volume);
}
