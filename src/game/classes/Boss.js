import { GAME_CONFIG } from '../constants';

export class Boss {
  constructor(canvas, playerRef, explosionsRef, impactParticlesRef, dangerZonesRef, playExplosionSound) {
    this.canvas = canvas;
    this.playerRef = playerRef;
    this.explosionsRef = explosionsRef;
    this.impactParticlesRef = impactParticlesRef;
    this.dangerZonesRef = dangerZonesRef;
    this.playExplosionSound = playExplosionSound;

    this.radius = GAME_CONFIG.BOSS.RADIUS;
    this.x = canvas.width / 2;
    this.y = 100;
    this.hp = GAME_CONFIG.BOSS.HP;
    this.maxHP = GAME_CONFIG.BOSS.HP;
    this.vx = GAME_CONFIG.BOSS.BASE_SPEED_X;
    this.vy = GAME_CONFIG.BOSS.BASE_SPEED_Y;
    this.color = GAME_CONFIG.COLORS.BOSS;
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashSpeed = GAME_CONFIG.BOSS.DASH_SPEED;
    this.dashDuration = 0;
    this.dashAngle = 0;
    this.dashTrail = [];
    this.isCharging = false;
    this.chargeTime = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.meteorCooldown = 0;
  }

  update() {
    const player = this.playerRef.current;

    // BUG: Cooldowns sometimes go backwards!
    if (this.dashCooldown > 0) {
      this.dashCooldown -= Math.random() < 0.1 ? -5 : 1;
    }

    if (this.meteorCooldown > 0) {
      this.meteorCooldown -= Math.random() < 0.15 ? -10 : 1;
    }

    if (this.isCharging) {
      this.chargeTime--;
      if (this.chargeTime <= 0) {
        this.isCharging = false;
        this.isDashing = true;
        this.dashDuration = GAME_CONFIG.BOSS.DASH_DURATION;

        // BUG: Sometimes dash in completely random direction
        if (Math.random() < 0.4) {
          this.dashAngle = Math.random() * Math.PI * 2;
        }
      }
    } else if (this.isDashing) {
      // BUG: Dash speed randomly fluctuates
      const buggyDashSpeed = this.dashSpeed * (Math.random() * 2 + 0.5);
      this.x += Math.cos(this.dashAngle) * buggyDashSpeed;
      this.y += Math.sin(this.dashAngle) * buggyDashSpeed;

      this.dashTrail.push({ x: this.x, y: this.y, life: 10 });

      // Check wall collision
      if (this.x - this.radius <= 0 || this.x + this.radius >= this.canvas.width ||
          this.y - this.radius <= 0 || this.y + this.radius >= this.canvas.height) {
        this.isDashing = false;
        this.dashCooldown = GAME_CONFIG.BOSS.DASH_COOLDOWN;

        // Clamp position
        if (this.x - this.radius <= 0) this.x = this.radius;
        if (this.x + this.radius >= this.canvas.width) this.x = this.canvas.width - this.radius;
        if (this.y - this.radius <= 0) this.y = this.radius;
        if (this.y + this.radius >= this.canvas.height) this.y = this.canvas.height - this.radius;

        // Create explosion
        this.explosionsRef.current.push({
          x: this.x,
          y: this.y,
          radius: 5,
          maxRadius: 80,
          growSpeed: 4,
          active: true
        });

        // Create particles
        for (let p = 0; p < 20; p++) {
          const angle = (Math.PI * 2 * p) / 20;
          const speed = 4 + Math.random() * 5;
          this.impactParticlesRef.current.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 4,
            color: '#ff8800',
            spawnTime: Date.now(),
            life: 400 + Math.random() * 300
          });
        }

        this.playExplosionSound();
      }
    } else {
      // Normal movement
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off walls
      if (this.x - this.radius <= 0 || this.x + this.radius >= this.canvas.width) {
        this.vx = -this.vx;
        this.x = this.x - this.radius <= 0 ? this.radius : this.canvas.width - this.radius;
      }

      if (this.y - this.radius <= 0 || this.y + this.radius >= this.canvas.height) {
        this.vy = -this.vy;
        this.y = this.y - this.radius <= 0 ? this.radius : this.canvas.height - this.radius;
      }

      // BUG: Dash triggers way too frequently or not at all
      if (this.dashCooldown <= 0 && Math.random() < 0.15) {
        this.isCharging = true;
        this.chargeTime = GAME_CONFIG.BOSS.CHARGE_TIME;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.dashAngle = Math.atan2(dy, dx);
        this.targetX = player.x;
        this.targetY = player.y;
        this.dashTrail = [];
      }

      // BUG: Meteor spawning is completely broken
      if (this.meteorCooldown <= 0 && Math.random() < 0.08) {
        this.meteorCooldown = GAME_CONFIG.BOSS.METEOR_COOLDOWN;

        // BUG: Sometimes spawn way too many meteors
        const numZones = Math.random() < 0.2 ? 20 : GAME_CONFIG.BOSS.METEOR_MIN_ZONES +
                        Math.floor(Math.random() * (GAME_CONFIG.BOSS.METEOR_MAX_ZONES - GAME_CONFIG.BOSS.METEOR_MIN_ZONES));

        for (let i = 0; i < numZones; i++) {
          // BUG: Meteors can spawn anywhere, even off-screen!
          const zoneX = Math.random() * this.canvas.width * 1.5 - this.canvas.width * 0.25;
          const zoneY = Math.random() * this.canvas.height * 1.5 - this.canvas.height * 0.25;
          this.dangerZonesRef.current.push({
            x: zoneX,
            y: zoneY,
            // BUG: Random meteor sizes
            radius: 30 + Math.random() * 100,
            // BUG: Sometimes instant meteors with no warning!
            warningTime: Math.random() < 0.3 ? 10 : GAME_CONFIG.BOSS.METEOR_WARNING_TIME,
            spawnTime: Date.now()
          });
        }
      }
    }

    // Update dash trail
    this.dashTrail = this.dashTrail.filter(t => {
      t.life--;
      return t.life > 0;
    });
  }

  draw(ctx) {
    // Draw charge indicator
    if (this.isCharging) {
      const opacity = Math.sin(this.chargeTime / 10) * 0.3 + 0.5;
      ctx.globalAlpha = opacity;

      // BUG: Wrong color sometimes
      ctx.strokeStyle = Math.random() < 0.3 ? '#ff00ff' : '#ffff00';
      // BUG: Line width varies wildly
      ctx.lineWidth = 20 + Math.random() * 80;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);

      const pathLength = 1000;
      const endX = this.x + Math.cos(this.dashAngle) * pathLength;
      const endY = this.y + Math.sin(this.dashAngle) * pathLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      // BUG: Target indicator randomly sized
      ctx.arc(this.targetX, this.targetY, 10 + Math.random() * 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    // Draw dash trail
    this.dashTrail.forEach((t) => {
      const opacity = t.life / 10;
      ctx.globalAlpha = opacity * 0.6;
      ctx.fillStyle = GAME_CONFIG.COLORS.BOSS;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw boss body
    ctx.beginPath();
    // BUG: Boss size randomly fluctuates
    const buggyRadius = this.radius * (0.5 + Math.random());
    ctx.arc(this.x, this.y, buggyRadius, 0, Math.PI * 2);

    if (this.isDashing) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      // BUG: Shadow blur goes crazy
      ctx.shadowBlur = Math.random() * 80;
    } else if (this.isCharging) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 20;
    } else {
      // BUG: Sometimes boss is invisible or wrong color
      ctx.fillStyle = Math.random() < 0.1 ? 'transparent' : this.color;
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    // BUG: Stroke thickness varies
    ctx.lineWidth = 1 + Math.random() * 8;
    ctx.stroke();

    // Draw health bar
    const barWidth = this.radius * 2;
    const barHeight = 8;
    const healthPercent = this.hp / this.maxHP;

    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth, barHeight);

    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - barWidth / 2, this.y - this.radius - 20, barWidth, barHeight);

    // Draw status text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const statusText = this.isDashing ? 'BOSS - DASHING!' : this.isCharging ? 'BOSS - CHARGING!' : 'BOSS';
    ctx.fillText(statusText, this.x, this.y - this.radius - 30);
  }

  collidesWith(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // BUG: Collision detection varies randomly
    const collisionMultiplier = Math.random() < 0.2 ? 0.5 : Math.random() < 0.4 ? 2.5 : 1.0;

    return distance < (this.radius + entity.radius) * collisionMultiplier;
  }

  takeDamage(amount) {
    // BUG: Damage is inconsistent - sometimes heal, sometimes take more damage
    const damageMultiplier = Math.random() < 0.2 ? -1 : (Math.random() < 0.3 ? Math.random() * 5 : 1);
    this.hp -= amount * damageMultiplier;

    // BUG: Boss can have negative HP but still be alive
    return Math.random() < 0.9 && this.hp <= 0;
  }
}
