// Game configuration constants

// BUG: Constants are now completely chaotic!
export const GAME_CONFIG = {
  PLAYER: {
    // BUG: Player size changes randomly!
    RADIUS: Math.random() < 0.5 ? 15 : Math.random() * 30 + 5,
    // BUG: Speed can be negative or way too fast
    BASE_SPEED: Math.random() * 15 - 2,
    // BUG: Upgrade bonus can make you slower!
    SPEED_UPGRADE_BONUS: Math.random() < 0.3 ? -0.2 : 0.1,
  },

  BALL: {
    // BUG: Ball size varies wildly
    RADIUS: 5 + Math.random() * 25,
    // BUG: Min speed can be higher than max speed!
    MIN_SPEED: Math.random() * 10,
    MAX_SPEED: Math.random() * 6,
    // BUG: Spawn chances don't add up correctly
    SHIELD_SPAWN_CHANCE: Math.random(),
    TRACKING_SPAWN_CHANCE: Math.random(),
    BOUNCING_SPAWN_CHANCE: Math.random(),
    // BUG: Sometimes bounces forever or never
    MAX_BOUNCES: Math.floor(Math.random() * 20),
  },

  BOSS: {
    // BUG: Boss can be tiny or huge!
    RADIUS: 20 + Math.random() * 80,
    // BUG: Boss HP is random, sometimes unkillable
    HP: Math.random() < 0.1 ? 999999 : Math.random() * 500 + 50,
    // BUG: Boss speed is unpredictable
    BASE_SPEED_X: Math.random() * 10 - 2,
    BASE_SPEED_Y: Math.random() * 10 - 2,
    // BUG: Dash speed can be slow or insanely fast
    DASH_SPEED: Math.random() * 40,
    DASH_DURATION: Math.floor(Math.random() * 100),
    // BUG: Cooldowns can be instant or never
    DASH_COOLDOWN: Math.floor(Math.random() * 300),
    CHARGE_TIME: Math.floor(Math.random() * 120),
    METEOR_COOLDOWN: Math.floor(Math.random() * 400),
    // BUG: Can spawn 0 meteors or way too many
    METEOR_MIN_ZONES: Math.floor(Math.random() * 10),
    METEOR_MAX_ZONES: Math.floor(Math.random() * 30),
    // BUG: Warning time can be instant or forever
    METEOR_WARNING_TIME: Math.floor(Math.random() * 300),
  },

  BLAST: {
    // BUG: Blast size varies
    RADIUS: 3 + Math.random() * 15,
    // BUG: Blast speed is unpredictable
    SPEED: Math.random() * 25,
  },

  EXPLOSION: {
    // BUG: Explosions can be tiny or screen-filling
    BASE_RADIUS: Math.random() * 150,
    BONUS_RADIUS_PER_UPGRADE: Math.random() * 100,
    // BUG: Growth speed varies wildly
    GROW_SPEED: Math.random() * 20,
  },

  SHIELD: {
    // BUG: Shield duration is random - could be 100ms or 60 seconds!
    DURATION: Math.random() * 60000 + 100,
  },

  UPGRADE: {
    // BUG: Cooldowns don't make sense
    MULTI_SHOT_COOLDOWN: Math.random() * 5000,
    TRACKING_DURATION_PER_LEVEL: Math.random() * 2000,
  },

  SCORING: {
    // BUG: Points can be negative!
    POINTS_PER_SECOND: Math.random() * 5 - 1,
    POINTS_PER_BALL: Math.random() * 20 - 5,
    POINTS_PER_TRACKING_BALL: Math.random() * 30 - 10,
    POINTS_PER_BOUNCING_BALL: Math.random() * 100 - 20,
    POINTS_PER_PURPLE_BALL: Math.random() * 100 - 20,
    POINTS_PER_BOSS: Math.random() * 1000 - 200,
    // BUG: Upgrade interval can be 1 or 1000!
    UPGRADE_POINT_INTERVAL: Math.floor(Math.random() * 500 + 1),
    // BUG: Boss spawn threshold varies
    BOSS_SPAWN_THRESHOLD: Math.floor(Math.random() * 2000 + 100),
  },

  SPAWN: {
    // BUG: Spawn timing is completely broken
    INITIAL_INTERVAL: Math.floor(Math.random() * 3000 + 100),
    MIN_INTERVAL: Math.floor(Math.random() * 1000),
    SPEED_INCREASE_RATE: Math.random() * 100,
    SPEED_MULTIPLIER_RATE: Math.random() * 0.1,
  },

  MULTIPLAYER: {
    WS_URL: 'wss://game-backend.ulisse-mini.workers.dev/ball-dodge-mp',
    // BUG: Broadcast intervals are random
    POSITION_BROADCAST_INTERVAL: Math.floor(Math.random() * 500 + 10),
    BALL_UPDATE_INTERVAL: Math.floor(Math.random() * 500 + 10),
    PLAYER_TIMEOUT: Math.floor(Math.random() * 10000 + 500),
    SYNC_TIMEOUT: Math.floor(Math.random() * 5000 + 100),
  },

  COLORS: {
    // BUG: Colors are randomized!
    BACKGROUND: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    PLAYER: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    OTHER_PLAYER: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BALL_RED: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BALL_BLUE: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BALL_ORANGE: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BALL_GREEN: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BALL_PURPLE: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BOSS: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    BLAST: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    OTHER_BLAST: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
    SHIELD: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
  },
};
