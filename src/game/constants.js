// Game configuration constants

export const GAME_CONFIG = {
  PLAYER: {
    RADIUS: 15,
    BASE_SPEED: 5,
    SPEED_UPGRADE_BONUS: 0.1, // 10% per upgrade
  },

  BALL: {
    RADIUS: 15,
    MIN_SPEED: 2,
    MAX_SPEED: 4,
    SHIELD_SPAWN_CHANCE: 0.12, // Reduced shield spawn for more challenge
    TRACKING_SPAWN_CHANCE: 0.12, // 0.24 - 0.12 (more tracking balls)
    BOUNCING_SPAWN_CHANCE: 0.04, // 0.28 - 0.24 (slightly more bouncing)
    MAX_BOUNCES: 2,
  },

  BOSS: {
    RADIUS: 50,
    HP: 300,
    BASE_SPEED_X: 3,
    BASE_SPEED_Y: 2,
    DASH_SPEED: 15,
    DASH_DURATION: 30,
    DASH_COOLDOWN: 180,
    CHARGE_TIME: 60,
    METEOR_COOLDOWN: 240,
    METEOR_MIN_ZONES: 3,
    METEOR_MAX_ZONES: 6,
    METEOR_WARNING_TIME: 180,
  },

  BLAST: {
    RADIUS: 8,
    SPEED: 10,
  },

  EXPLOSION: {
    BASE_RADIUS: 50,
    BONUS_RADIUS_PER_UPGRADE: 25,
    GROW_SPEED: 3,
  },

  SHIELD: {
    DURATION: 15000, // 15 seconds
  },

  UPGRADE: {
    MULTI_SHOT_COOLDOWN: 1000, // 1 second
    TRACKING_DURATION_PER_LEVEL: 500, // 0.5s per level
  },

  SCORING: {
    POINTS_PER_SECOND: 1,
    POINTS_PER_BALL: 3,
    POINTS_PER_TRACKING_BALL: 5,
    POINTS_PER_BOUNCING_BALL: 50,
    POINTS_PER_PURPLE_BALL: 50,
    POINTS_PER_BOSS: 500,
    UPGRADE_POINT_INTERVAL: 100,
    BOSS_SPAWN_THRESHOLD: 500,
  },

  SPAWN: {
    INITIAL_INTERVAL: 1000,
    MIN_INTERVAL: 250,
    SPEED_INCREASE_RATE: 15, // ms per second (faster difficulty increase)
    SPEED_MULTIPLIER_RATE: 0.015, // 1.5% per second / 10 (slightly faster)
  },

  MULTIPLAYER: {
    WS_URL: 'wss://game-backend.ulisse-mini.workers.dev/ball-dodge-mp',
    POSITION_BROADCAST_INTERVAL: 50,
    BALL_UPDATE_INTERVAL: 100,
    PLAYER_TIMEOUT: 3000,
    SYNC_TIMEOUT: 1000,
  },

  SCREEN_SHAKE: {
    IMPACT_INTENSITY: 5,
    EXPLOSION_INTENSITY: 8,
    BOSS_HIT_INTENSITY: 12,
    DECAY_RATE: 0.9,
  },

  COMBO: {
    TIMEOUT: 2000, // 2 seconds to maintain combo
    MULTIPLIER_PER_LEVEL: 0.5, // +50% per combo level
    MAX_MULTIPLIER: 5,
  },

  POWERUP: {
    DROP_CHANCE: 0.15, // 15% chance from destroyed balls
    DURATION: 8000, // 8 seconds
    RADIUS: 12,
    FALL_SPEED: 2,
    TYPES: {
      RAPID_FIRE: 'rapid_fire',
      INVINCIBILITY: 'invincibility',
      SLOW_TIME: 'slow_time',
      MEGA_BLAST: 'mega_blast',
    },
  },

  COLORS: {
    BACKGROUND: '#1a1a2e',
    PLAYER: '#00ff00',
    OTHER_PLAYER: '#00ccff',
    BALL_RED: '#ff0000',
    BALL_BLUE: '#0088ff', // shield
    BALL_ORANGE: '#ff8800', // tracking
    BALL_GREEN: '#00ff00', // bouncing
    BALL_PURPLE: '#9900ff',
    BOSS: '#ff00ff',
    BLAST: '#ffff00',
    OTHER_BLAST: '#00ffff',
    SHIELD: '#00ffff',
    POWERUP_RAPID_FIRE: '#ff9900',
    POWERUP_INVINCIBILITY: '#ffff00',
    POWERUP_SLOW_TIME: '#00ffff',
    POWERUP_MEGA_BLAST: '#ff00ff',
  },
};
