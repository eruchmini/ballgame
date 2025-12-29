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
    SHIELD_SPAWN_CHANCE: 0.15,
    TRACKING_SPAWN_CHANCE: 0.10, // 0.25 - 0.15
    BOUNCING_SPAWN_CHANCE: 0.03, // 0.28 - 0.25
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
    INITIAL_INTERVAL: 1200,
    MIN_INTERVAL: 300,
    SPEED_INCREASE_RATE: 20, // ms per second
    SPEED_MULTIPLIER_RATE: 0.01, // 1% per second / 10
  },

  MULTIPLAYER: {
    WS_URL: 'wss://game-backend.ulisse-mini.workers.dev/ball-dodge-mp',
    POSITION_BROADCAST_INTERVAL: 50,
    BALL_UPDATE_INTERVAL: 100,
    PLAYER_TIMEOUT: 3000,
    SYNC_TIMEOUT: 1000,
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
  },
};
