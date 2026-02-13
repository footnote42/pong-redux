// src/constants.js
// Centralized constants to avoid magic numbers scattered throughout codebase

export const CANVAS = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600
};

export const UI = {
  BUTTON_WIDTH: 260,
  BUTTON_HEIGHT: 60,
  BUTTON_GAP: 40,
  SETTINGS_PANEL: {
    WIDTH_RATIO: 0.15,
    HEIGHT_RATIO: 0.1,
    PANEL_WIDTH_RATIO: 0.7,
    PANEL_HEIGHT_RATIO: 0.8
  },
  TAB_WIDTH: 140,
  TAB_HEIGHT: 36,
  TAB_Y_OFFSET: 80,
  CONTENT_Y_OFFSET: 136,  // 80 + 36 + 20
  SECTION_SPACING: 70,
  PANEL_PADDING: 40,
  BUTTON_SPACING: 10,
  SLIDER_WIDTH: 300,
  SLIDER_HEIGHT: 20,
  WIN_SCORE_BUTTON_WIDTH: 60,
  WIN_SCORE_BUTTON_HEIGHT: 36
};

export const PHYSICS = {
  UPDATE_RATE_HZ: 60,
  MS_PER_UPDATE: 1000 / 60,  // 16.67ms
  SPIRAL_OF_DEATH_CAP_MS: 250,
  SERVE_DELAY_SEC: 0.5
};

export const BALL = {
  DEFAULT_RADIUS: 6,
  DEFAULT_SPEED: 200,
  MAX_SERVE_ANGLE_DEG: 75,
  SPEED_MULTIPLIER_MIN: 0.5,
  SPEED_MULTIPLIER_MAX: 2.0,
  SPEED_PRESETS: {
    slow: 0.7,
    normal: 1.0,
    fast: 1.3,
    insane: 1.8
  }
};

export const PADDLE = {
  DEFAULT_WIDTH: 10,
  DEFAULT_HEIGHT: 80,
  DEFAULT_SPEED: 300,
  DEFAULT_ACCEL: 2000,
  DEFAULT_X_OFFSET_LEFT: 10,
  DEFAULT_X_OFFSET_RIGHT: 10,  // Changed from 20 to 10 for symmetry
  SIZE_MULTIPLIER_MIN: 0.5,
  SIZE_MULTIPLIER_MAX: 1.5
};

export const GAME = {
  WIN_SCORES: [5, 7, 11, 15, 21],
  DEFAULT_WIN_SCORE: 11,
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'],
  DEFAULT_DIFFICULTY: 'medium'
};

export const AUDIO = {
  DEFAULT_VOLUME: 70,
  VOLUME_MIN: 0,
  VOLUME_MAX: 100
};

export const RUGBY = {
  SPIN_DECAY_RATE: 0.98,           // Spin multiplier per second
  SPIN_SNAP_THRESHOLD: 0.01,       // Snap to zero below this value
  MAX_BOUNCE_VARIANCE_DEG: 30,     // Max bounce angle variance in degrees (increased from 20)
  MOMENTUM_FACTOR_DIVISOR: 1000,   // Paddle velocity divisor for momentum
  MAX_BALL_SPEED_MULTIPLIER: 2.5,  // Cap ball speed at 2.5x base
  SPIN_GAIN_FACTOR: 0.75,          // Spin gain multiplier (increased from 0.5)
  GOAL_POST_WIDTH: 40,             // Width of H-shaped goal post
  GOAL_POST_HEIGHT: 60,            // Height of H-shaped goal post
  GOAL_POST_CROSSBAR_HEIGHT: 30,   // Height of crossbar above ground
  GOAL_POST_POST_WIDTH: 4,         // Width of vertical posts
  GOAL_POST_CROSSBAR_WIDTH: 3,     // Width of horizontal crossbar
  GOAL_POST_DURATION: 5.0,         // Active duration in seconds
  GOAL_POST_SPAWN_MIN: Infinity,   // DEPRECATED: Goal posts disabled
  GOAL_POST_SPAWN_MAX: Infinity,   // DEPRECATED: Goal posts disabled
  GOAL_POST_BONUS_BASE: 10,        // Base bonus points for hitting goal post
  RALLY_THRESHOLDS: {              // Rally count → multiplier thresholds
    MULT_2X: 3,
    MULT_3X: 6,
    MULT_5X: 10
  },
  TARGET_SCORES: [25, 50, 75, 100], // Available target scores
  TIME_LIMITS: [120, 180, 300, 600], // Available time limits (seconds)
  DEFAULT_TARGET_SCORE: 50,
  DEFAULT_TIME_LIMIT: 180
};

