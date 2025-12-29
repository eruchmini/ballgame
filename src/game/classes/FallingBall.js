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
    if (this.isTracking) {
      const player = playerRef.current;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        this.x += (dx / distance) * this.speed * 0.8;
        this.y += (dy / distance) * this.speed * 0.8;
      }
    } else if (this.isBouncing) {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
        this.vx = -this.vx;
        this.x = this.x - this.radius <= 0 ? this.radius : canvas.width - this.radius;
        this.bounceCount++;
      }

      if (this.y + this.radius >= canvas.height || this.y - this.radius <= 0) {
        this.vy = -this.vy * 0.8;
        this.y = this.y + this.radius >= canvas.height ? canvas.height - this.radius : this.radius;
        this.bounceCount++;
      }

      this.vy += 0.2; // Gravity
    } else {
      this.y += this.speed;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
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
    return distance < this.radius + entity.radius;
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
