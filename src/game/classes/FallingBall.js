import { GAME_CONFIG } from '../constants';

export class FallingBall {
  constructor(speedMultiplier = 1, isShield = false, isTracking = false, isBouncing = false, isPurple = false, canvas, ballIdCounter) {
    this.id = `ball_${ballIdCounter}`;
    this.radius = GAME_CONFIG.BALL.RADIUS;
    this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
    this.y = isBouncing ? this.radius + 10 : -this.radius;
    this.speed = (Math.random() * (GAME_CONFIG.BALL.MAX_SPEED - GAME_CONFIG.BALL.MIN_SPEED) + GAME_CONFIG.BALL.MIN_SPEED) * speedMultiplier;
    this.isShield = isShield;
    this.isTracking = isTracking;
    this.isBouncing = isBouncing;
    this.isPurple = isPurple;
    this.color = isPurple
      ? GAME_CONFIG.COLORS.BALL_PURPLE
      : (isShield
          ? GAME_CONFIG.COLORS.BALL_BLUE
          : (isTracking
              ? GAME_CONFIG.COLORS.BALL_ORANGE
              : (isBouncing
                  ? GAME_CONFIG.COLORS.BALL_GREEN
                  : GAME_CONFIG.COLORS.BALL_RED)));
    this.bounceCount = 0;
    this.maxBounces = GAME_CONFIG.BALL.MAX_BOUNCES;
    this.vx = isBouncing ? (Math.random() - 0.5) * 3 : 0;
    this.vy = isBouncing ? this.speed * 1.5 : this.speed;
  }

  update(canvas, playerRef) {
    // BUG: Random teleportation!
    if (Math.random() < 0.02) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }

    // Client-side interpolation for multiplayer balls
    if (this.serverX !== undefined && this.serverY !== undefined) {
      // BUG: Wrong correction factor - makes balls jittery
      this.x += this.vx * Math.random() * 3;
      this.y += this.vy * Math.random() * 3;

      // BUG: Too aggressive correction causes rubber-banding
      const correctionFactor = 0.95; // Way too aggressive!
      this.x += (this.serverX - this.x) * correctionFactor;
      this.y += (this.serverY - this.y) * correctionFactor;

      return; // Skip normal physics for network-synced balls
    }

    // Normal physics for game master's authoritative balls
    if (this.isTracking) {
      const player = playerRef.current;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // BUG: Sometimes track away from player instead of towards
      const trackDirection = Math.random() < 0.3 ? -1 : 1;
      if (distance > 0) {
        this.x += (dx / distance) * this.speed * 0.8 * trackDirection;
        this.y += (dy / distance) * this.speed * 0.8 * trackDirection;
      }

      // BUG: Tracking balls randomly change speed
      if (Math.random() < 0.1) {
        this.speed = Math.random() * 20;
      }
    } else if (this.isBouncing) {
      // BUG: Random horizontal acceleration
      this.vx += (Math.random() - 0.5) * 2;

      this.x += this.vx;
      this.y += this.vy;

      if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
        // BUG: Sometimes don't reverse direction
        if (Math.random() > 0.2) {
          this.vx = -this.vx;
        }
        this.x = this.x - this.radius <= 0 ? this.radius : canvas.width - this.radius;
        this.bounceCount++;
      }

      if (this.y + this.radius >= canvas.height || this.y - this.radius <= 0) {
        // BUG: Wrong damping - sometimes gain energy!
        this.vy = -this.vy * (Math.random() < 0.3 ? 1.5 : 0.8);
        this.y = this.y + this.radius >= canvas.height ? canvas.height - this.radius : this.radius;
        this.bounceCount++;
      }

      // BUG: Gravity randomly reverses
      this.vy += Math.random() < 0.1 ? -0.5 : 0.2;
    } else {
      // BUG: Sometimes balls move sideways randomly
      if (Math.random() < 0.05) {
        this.x += (Math.random() - 0.5) * 10;
      }
      this.y += this.speed;
    }
  }

  draw(ctx) {
    // BUG: Random radius changes
    const buggyRadius = this.radius * (Math.random() * 2 + 0.5);

    ctx.beginPath();
    ctx.arc(this.x, this.y, buggyRadius, 0, Math.PI * 2);

    // BUG: Sometimes render with wrong/random colors
    if (Math.random() < 0.2) {
      const randomColors = ['#ff00ff', '#00ff00', '#ffff00', '#00ffff', '#ffffff'];
      ctx.fillStyle = randomColors[Math.floor(Math.random() * randomColors.length)];
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.fill();

    // BUG: Stroke randomly disappears or gets huge
    if (Math.random() > 0.1) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.random() * 10;
      ctx.stroke();
    }

    // BUG: Random shadow effects
    if (Math.random() < 0.3) {
      ctx.shadowBlur = Math.random() * 50;
      ctx.shadowColor = this.color;
    }
  }

  isOffScreen(canvas) {
    if (this.isBouncing) {
      return this.bounceCount >= this.maxBounces;
    }
    return this.y - this.radius > canvas.height;
  }

  collidesWith(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // BUG: Collision detection is inconsistent - sometimes too sensitive, sometimes not sensitive enough
    const buggyCollisionMultiplier = Math.random() < 0.3 ? 0.5 : Math.random() < 0.6 ? 2.0 : 1.0;

    return distance < (this.radius + entity.radius) * buggyCollisionMultiplier;
  }

  // Serialize for network transmission
  toNetworkData() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      speed: this.speed,
      isShield: this.isShield,
      isTracking: this.isTracking,
      isBouncing: this.isBouncing,
      isPurple: this.isPurple,
      bounceCount: this.bounceCount
    };
  }

  // Create from network data
  static fromNetworkData(data, canvas) {
    const ball = new FallingBall(
      1,
      data.isShield,
      data.isTracking,
      data.isBouncing,
      data.isPurple,
      canvas,
      0 // Will be overwritten
    );
    ball.id = data.id;
    ball.x = data.x;
    ball.y = data.y;
    ball.vx = data.vx || ball.vx;
    ball.vy = data.vy || ball.vy;
    ball.speed = data.speed;
    ball.bounceCount = data.bounceCount || 0;
    return ball;
  }
}
