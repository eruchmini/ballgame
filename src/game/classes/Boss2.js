import { GAME_CONFIG } from '../constants';

export class Boss2 {
  constructor(canvas, playerRef, explosionsRef, impactParticlesRef, dangerZonesRef, playExplosionSound) {
    this.canvas = canvas;
    this.playerRef = playerRef;
    this.explosionsRef = explosionsRef;
    this.impactParticlesRef = impactParticlesRef;
    this.dangerZonesRef = dangerZonesRef;
    this.playExplosionSound = playExplosionSound;

    this.radius = GAME_CONFIG.BOSS2.RADIUS;
    this.x = canvas.width / 2;
    this.y = 100;
    this.hp = GAME_CONFIG.BOSS2.HP;
    this.maxHP = GAME_CONFIG.BOSS2.HP;
    this.vx = GAME_CONFIG.BOSS2.BASE_SPEED_X;
    this.vy = GAME_CONFIG.BOSS2.BASE_SPEED_Y;
    this.color = GAME_CONFIG.COLORS.BOSS2;

    // Dash ability
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashSpeed = GAME_CONFIG.BOSS2.DASH_SPEED;
    this.dashDuration = 0;
    this.dashAngle = 0;
    this.dashTrail = [];
    this.isCharging = false;
    this.chargeTime = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Meteor ability
    this.meteorCooldown = 0;

    // Laser ability
    this.laserCooldown = 0;
    this.isFiringLaser = false;
    this.laserDuration = 0;
    this.laserAngle = 0;
    this.laserWarning = false;
    this.laserWarningTime = 0;

    // Shield phase
    this.hasShield = false;
    this.shieldCooldown = 0;
    this.shieldDuration = 0;

    // Minion spawning
    this.minionCooldown = 0;
    this.minions = [];

    // Teleportation
    this.teleportCooldown = 0;

    // Orbital projectiles
    this.orbitals = [];
    this.orbitalAngle = 0;
    this.orbitalCooldown = 0;

    // Pulse attack
    this.pulseCooldown = 0;
    this.pulseWaves = [];

    // Homing missiles
    this.missileCooldown = 0;
    this.missiles = [];

    // Split projectiles
    this.splitCooldown = 0;
    this.splitProjectiles = [];

    // Gravity well
    this.gravityWellCooldown = 0;
    this.gravityWells = [];

    // Time distortion
    this.timeDistortionCooldown = 0;
    this.timeDistortionZones = [];

    // Spiral attack
    this.spiralCooldown = 0;
    this.spiralProjectiles = [];

    // Phase tracking
    this.phase = 1; // Boss gets more aggressive as HP decreases
  }

  update() {
    const player = this.playerRef.current;

    // Update phase based on HP
    const hpPercent = this.hp / this.maxHP;
    if (hpPercent > 0.66) {
      this.phase = 1;
    } else if (hpPercent > 0.33) {
      this.phase = 2;
    } else {
      this.phase = 3; // Enrage phase
    }

    // Update all cooldowns
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.meteorCooldown > 0) this.meteorCooldown--;
    if (this.laserCooldown > 0) this.laserCooldown--;
    if (this.shieldCooldown > 0) this.shieldCooldown--;
    if (this.shieldDuration > 0) this.shieldDuration--;
    if (this.minionCooldown > 0) this.minionCooldown--;
    if (this.teleportCooldown > 0) this.teleportCooldown--;
    if (this.orbitalCooldown > 0) this.orbitalCooldown--;
    if (this.pulseCooldown > 0) this.pulseCooldown--;
    if (this.missileCooldown > 0) this.missileCooldown--;
    if (this.splitCooldown > 0) this.splitCooldown--;
    if (this.gravityWellCooldown > 0) this.gravityWellCooldown--;
    if (this.timeDistortionCooldown > 0) this.timeDistortionCooldown--;
    if (this.spiralCooldown > 0) this.spiralCooldown--;

    // Shield phase logic
    if (this.shieldDuration > 0 && this.shieldDuration % 10 === 0) {
      // Pulse effect while shielded
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        this.impactParticlesRef.current.push({
          x: this.x + Math.cos(angle) * (this.radius + 20),
          y: this.y + Math.sin(angle) * (this.radius + 20),
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          size: 4,
          color: '#00ffff',
          spawnTime: Date.now(),
          life: 400
        });
      }
    }

    if (this.shieldDuration <= 0) {
      this.hasShield = false;
    }

    // Charging dash logic
    if (this.isCharging) {
      this.chargeTime--;
      if (this.chargeTime <= 0) {
        this.isCharging = false;
        this.isDashing = true;
        this.dashDuration = GAME_CONFIG.BOSS2.DASH_DURATION;
      }
    } else if (this.isDashing) {
      // Dashing
      this.x += Math.cos(this.dashAngle) * this.dashSpeed;
      this.y += Math.sin(this.dashAngle) * this.dashSpeed;

      this.dashTrail.push({ x: this.x, y: this.y, life: 15 });

      // Check wall collision
      if (this.x - this.radius <= 0 || this.x + this.radius >= this.canvas.width ||
          this.y - this.radius <= 0 || this.y + this.radius >= this.canvas.height) {
        this.isDashing = false;
        this.dashCooldown = GAME_CONFIG.BOSS2.DASH_COOLDOWN / this.phase; // Faster in later phases

        // Clamp position
        this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.canvas.height - this.radius, this.y));

        // Create explosion
        this.explosionsRef.current.push({
          x: this.x,
          y: this.y,
          radius: 5,
          maxRadius: 100,
          growSpeed: 5,
          active: true
        });

        // Create particles
        for (let p = 0; p < 30; p++) {
          const angle = (Math.PI * 2 * p) / 30;
          const speed = 5 + Math.random() * 6;
          this.impactParticlesRef.current.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 4 + Math.random() * 5,
            color: '#ff00ff',
            spawnTime: Date.now(),
            life: 500 + Math.random() * 400
          });
        }

        this.playExplosionSound();
      }
    } else {
      // Normal movement
      this.x += this.vx * this.phase * 0.5;
      this.y += this.vy * this.phase * 0.5;

      // Bounce off walls
      if (this.x - this.radius <= 0 || this.x + this.radius >= this.canvas.width) {
        this.vx = -this.vx;
        this.x = this.x - this.radius <= 0 ? this.radius : this.canvas.width - this.radius;
      }

      if (this.y - this.radius <= 0 || this.y + this.radius >= this.canvas.height) {
        this.vy = -this.vy;
        this.y = this.y - this.radius <= 0 ? this.radius : this.canvas.height - this.radius;
      }

      // ABILITY 1: Dash attack
      if (this.dashCooldown <= 0 && Math.random() < 0.015 * this.phase) {
        this.isCharging = true;
        this.chargeTime = GAME_CONFIG.BOSS2.CHARGE_TIME;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.dashAngle = Math.atan2(dy, dx);
        this.targetX = player.x;
        this.targetY = player.y;
        this.dashTrail = [];
      }

      // ABILITY 2: Meteor shower
      if (this.meteorCooldown <= 0 && Math.random() < 0.01 * this.phase) {
        this.meteorCooldown = GAME_CONFIG.BOSS2.METEOR_COOLDOWN / this.phase;
        const numZones = GAME_CONFIG.BOSS2.METEOR_MIN_ZONES + Math.floor(Math.random() * (GAME_CONFIG.BOSS2.METEOR_MAX_ZONES - GAME_CONFIG.BOSS2.METEOR_MIN_ZONES)) * this.phase;

        for (let i = 0; i < numZones; i++) {
          const zoneX = Math.random() * (this.canvas.width - 200) + 100;
          const zoneY = Math.random() * (this.canvas.height - 200) + 100;
          this.dangerZonesRef.current.push({
            x: zoneX,
            y: zoneY,
            radius: 50,
            warningTime: GAME_CONFIG.BOSS2.METEOR_WARNING_TIME,
            spawnTime: Date.now()
          });
        }
      }

      // ABILITY 3: Laser beam
      if (this.laserCooldown <= 0 && Math.random() < 0.008 * this.phase && !this.isFiringLaser) {
        this.laserWarning = true;
        this.laserWarningTime = 60;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.laserAngle = Math.atan2(dy, dx);
      }

      // ABILITY 4: Shield phase
      if (this.shieldCooldown <= 0 && Math.random() < 0.005 && !this.hasShield) {
        this.hasShield = true;
        this.shieldDuration = GAME_CONFIG.BOSS2.SHIELD_DURATION;
        this.shieldCooldown = GAME_CONFIG.BOSS2.SHIELD_COOLDOWN;
      }

      // ABILITY 5: Spawn minions
      if (this.minionCooldown <= 0 && Math.random() < 0.006 * this.phase) {
        this.minionCooldown = GAME_CONFIG.BOSS2.MINION_COOLDOWN / this.phase;
        const numMinions = 3 + this.phase;
        for (let i = 0; i < numMinions; i++) {
          const angle = (Math.PI * 2 * i) / numMinions;
          const distance = this.radius + 80;
          this.minions.push({
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: 15,
            hp: 1,
            color: '#ff6600'
          });
        }
      }

      // ABILITY 6: Teleport
      if (this.teleportCooldown <= 0 && Math.random() < 0.004 * this.phase) {
        this.teleportCooldown = GAME_CONFIG.BOSS2.TELEPORT_COOLDOWN;

        // Teleport effect at old position
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          this.impactParticlesRef.current.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            size: 5,
            color: '#ff00ff',
            spawnTime: Date.now(),
            life: 600
          });
        }

        // Teleport to new position
        this.x = 100 + Math.random() * (this.canvas.width - 200);
        this.y = 100 + Math.random() * (this.canvas.height - 200);

        // Teleport effect at new position
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          this.impactParticlesRef.current.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * -4,
            vy: Math.sin(angle) * -4,
            size: 5,
            color: '#ff00ff',
            spawnTime: Date.now(),
            life: 600
          });
        }
      }

      // ABILITY 7: Orbital projectiles
      if (this.orbitalCooldown <= 0 && Math.random() < 0.007 * this.phase) {
        this.orbitalCooldown = GAME_CONFIG.BOSS2.ORBITAL_COOLDOWN;
        const numOrbitals = 6 + this.phase * 2;
        for (let i = 0; i < numOrbitals; i++) {
          this.orbitals.push({
            angle: (Math.PI * 2 * i) / numOrbitals,
            distance: 100,
            speed: 0.05 + this.phase * 0.02,
            radius: 10
          });
        }
      }

      // ABILITY 8: Pulse attack
      if (this.pulseCooldown <= 0 && Math.random() < 0.006 * this.phase) {
        this.pulseCooldown = GAME_CONFIG.BOSS2.PULSE_COOLDOWN / this.phase;
        this.pulseWaves.push({
          x: this.x,
          y: this.y,
          radius: this.radius,
          maxRadius: 300,
          speed: 4,
          width: 20
        });
      }

      // ABILITY 9: Homing missiles
      if (this.missileCooldown <= 0 && Math.random() < 0.008 * this.phase) {
        this.missileCooldown = GAME_CONFIG.BOSS2.MISSILE_COOLDOWN / this.phase;
        const numMissiles = 2 + this.phase;
        for (let i = 0; i < numMissiles; i++) {
          const angle = (Math.PI * 2 * i) / numMissiles;
          this.missiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            radius: 8,
            speed: 3,
            turnSpeed: 0.1
          });
        }
      }

      // ABILITY 10: Split projectiles
      if (this.splitCooldown <= 0 && Math.random() < 0.007 * this.phase) {
        this.splitCooldown = GAME_CONFIG.BOSS2.SPLIT_COOLDOWN;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        this.splitProjectiles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 6,
          vy: Math.sin(angle) * 6,
          radius: 12,
          hasSplit: false
        });
      }

      // ABILITY 11: Gravity well
      if (this.gravityWellCooldown <= 0 && Math.random() < 0.004 * this.phase) {
        this.gravityWellCooldown = GAME_CONFIG.BOSS2.GRAVITY_WELL_COOLDOWN;
        this.gravityWells.push({
          x: player.x,
          y: player.y,
          radius: 80,
          strength: 0.3,
          duration: 180,
          pulsePhase: 0
        });
      }

      // ABILITY 12: Time distortion zones
      if (this.timeDistortionCooldown <= 0 && Math.random() < 0.005 * this.phase) {
        this.timeDistortionCooldown = GAME_CONFIG.BOSS2.TIME_DISTORTION_COOLDOWN;
        const numZones = 2 + this.phase;
        for (let i = 0; i < numZones; i++) {
          this.timeDistortionZones.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            radius: 100,
            duration: 240,
            effect: 0.5 // Slow player to 50% speed
          });
        }
      }

      // ABILITY 13: Spiral attack
      if (this.spiralCooldown <= 0 && Math.random() < 0.006 * this.phase) {
        this.spiralCooldown = GAME_CONFIG.BOSS2.SPIRAL_COOLDOWN / this.phase;
        const numSpirals = 3;
        for (let s = 0; s < numSpirals; s++) {
          const baseAngle = (Math.PI * 2 * s) / numSpirals;
          for (let i = 0; i < 12; i++) {
            const angle = baseAngle + (Math.PI * 2 * i) / 12;
            this.spiralProjectiles.push({
              x: this.x,
              y: this.y,
              angle: angle,
              speed: 3 + i * 0.3,
              radius: 8,
              delay: i * 3
            });
          }
        }
      }
    }

    // Update laser warning and firing
    if (this.laserWarning) {
      this.laserWarningTime--;
      if (this.laserWarningTime <= 0) {
        this.laserWarning = false;
        this.isFiringLaser = true;
        this.laserDuration = 90;
        this.laserCooldown = GAME_CONFIG.BOSS2.LASER_COOLDOWN / this.phase;
      }
    }

    if (this.isFiringLaser) {
      this.laserDuration--;
      if (this.laserDuration <= 0) {
        this.isFiringLaser = false;
      }
    }

    // Update orbitals
    this.orbitalAngle += 0.02;
    this.orbitals = this.orbitals.filter(orbital => {
      orbital.angle += orbital.speed;
      orbital.distance -= 0.5; // Slowly spiral inward
      return orbital.distance > 0;
    });

    // Update pulse waves
    this.pulseWaves = this.pulseWaves.filter(wave => {
      wave.radius += wave.speed;
      return wave.radius < wave.maxRadius;
    });

    // Update homing missiles
    this.missiles.forEach(missile => {
      const dx = player.x - missile.x;
      const dy = player.y - missile.y;
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(missile.vy, missile.vx);

      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const newAngle = currentAngle + angleDiff * missile.turnSpeed;
      missile.vx = Math.cos(newAngle) * missile.speed;
      missile.vy = Math.sin(newAngle) * missile.speed;

      missile.x += missile.vx;
      missile.y += missile.vy;

      // Missile trail
      this.impactParticlesRef.current.push({
        x: missile.x,
        y: missile.y,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#ffaa00',
        spawnTime: Date.now(),
        life: 300
      });
    });

    // Remove off-screen missiles
    this.missiles = this.missiles.filter(m =>
      m.x > -50 && m.x < this.canvas.width + 50 && m.y > -50 && m.y < this.canvas.height + 50
    );

    // Update split projectiles
    this.splitProjectiles.forEach(proj => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Split when reaching halfway to edge
      const distToEdge = Math.min(proj.x, this.canvas.width - proj.x, proj.y, this.canvas.height - proj.y);
      if (!proj.hasSplit && distToEdge < 150) {
        proj.hasSplit = true;
        const angle = Math.atan2(proj.vy, proj.vx);
        for (let i = 0; i < 6; i++) {
          const spreadAngle = angle + (i - 2.5) * 0.4;
          this.splitProjectiles.push({
            x: proj.x,
            y: proj.y,
            vx: Math.cos(spreadAngle) * 4,
            vy: Math.sin(spreadAngle) * 4,
            radius: 6,
            hasSplit: true
          });
        }
      }
    });

    // Remove off-screen split projectiles
    this.splitProjectiles = this.splitProjectiles.filter(p =>
      p.x > -50 && p.x < this.canvas.width + 50 && p.y > -50 && p.y < this.canvas.height + 50
    );

    // Update gravity wells
    this.gravityWells.forEach(well => {
      well.duration--;
      well.pulsePhase += 0.1;
    });
    this.gravityWells = this.gravityWells.filter(w => w.duration > 0);

    // Update time distortion zones
    this.timeDistortionZones.forEach(zone => {
      zone.duration--;
    });
    this.timeDistortionZones = this.timeDistortionZones.filter(z => z.duration > 0);

    // Update spiral projectiles
    this.spiralProjectiles.forEach(proj => {
      if (proj.delay > 0) {
        proj.delay--;
      } else {
        proj.x += Math.cos(proj.angle) * proj.speed;
        proj.y += Math.sin(proj.angle) * proj.speed;
        proj.angle += 0.05; // Curve the trajectory
      }
    });

    // Remove off-screen spiral projectiles
    this.spiralProjectiles = this.spiralProjectiles.filter(p =>
      p.x > -50 && p.x < this.canvas.width + 50 && p.y > -50 && p.y < this.canvas.height + 50
    );

    // Update minions
    this.minions.forEach(minion => {
      minion.x += minion.vx;
      minion.y += minion.vy;

      // Bounce off walls
      if (minion.x - minion.radius <= 0 || minion.x + minion.radius >= this.canvas.width) {
        minion.vx = -minion.vx;
        minion.x = Math.max(minion.radius, Math.min(this.canvas.width - minion.radius, minion.x));
      }
      if (minion.y - minion.radius <= 0 || minion.y + minion.radius >= this.canvas.height) {
        minion.vy = -minion.vy;
        minion.y = Math.max(minion.radius, Math.min(this.canvas.height - minion.radius, minion.y));
      }

      // Slowly move toward player
      const dx = player.x - minion.x;
      const dy = player.y - minion.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        minion.vx += (dx / dist) * 0.1;
        minion.vy += (dy / dist) * 0.1;
      }

      // Limit speed
      const speed = Math.sqrt(minion.vx * minion.vx + minion.vy * minion.vy);
      if (speed > 5) {
        minion.vx = (minion.vx / speed) * 5;
        minion.vy = (minion.vy / speed) * 5;
      }
    });

    // Update dash trail
    this.dashTrail = this.dashTrail.filter(t => {
      t.life--;
      return t.life > 0;
    });
  }

  draw(ctx) {
    // Draw time distortion zones
    this.timeDistortionZones.forEach(zone => {
      const opacity = Math.sin(Date.now() / 200) * 0.2 + 0.3;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#9900ff';
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw gravity wells
    this.gravityWells.forEach(well => {
      const pulseSize = well.radius + Math.sin(well.pulsePhase) * 10;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(well.x, well.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#9900ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(well.x, well.y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw pulse waves
    this.pulseWaves.forEach(wave => {
      const progress = wave.radius / wave.maxRadius;
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = wave.width;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw charge indicator
    if (this.isCharging) {
      const opacity = Math.sin(this.chargeTime / 10) * 0.3 + 0.5;
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 80;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);

      const pathLength = 1500;
      const endX = this.x + Math.cos(this.dashAngle) * pathLength;
      const endY = this.y + Math.sin(this.dashAngle) * pathLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.fillStyle = '#ff00ff';
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    // Draw laser warning
    if (this.laserWarning) {
      const opacity = Math.sin(this.laserWarningTime / 5) * 0.4 + 0.4;
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      const laserLength = 2000;
      const endX = this.x + Math.cos(this.laserAngle) * laserLength;
      const endY = this.y + Math.sin(this.laserAngle) * laserLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw laser
    if (this.isFiringLaser) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      const laserLength = 2000;
      const endX = this.x + Math.cos(this.laserAngle) * laserLength;
      const endY = this.y + Math.sin(this.laserAngle) * laserLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner bright core
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw dash trail
    this.dashTrail.forEach((t) => {
      const opacity = t.life / 15;
      ctx.globalAlpha = opacity * 0.7;
      ctx.fillStyle = GAME_CONFIG.COLORS.BOSS2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw orbitals
    this.orbitals.forEach(orbital => {
      const ox = this.x + Math.cos(orbital.angle) * orbital.distance;
      const oy = this.y + Math.sin(orbital.angle) * orbital.distance;

      ctx.beginPath();
      ctx.arc(ox, oy, orbital.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw homing missiles
    this.missiles.forEach(missile => {
      ctx.beginPath();
      ctx.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaa00';
      ctx.fill();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw direction indicator
      const angle = Math.atan2(missile.vy, missile.vx);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(missile.x, missile.y);
      ctx.lineTo(missile.x + Math.cos(angle) * 15, missile.y + Math.sin(angle) * 15);
      ctx.stroke();
    });

    // Draw split projectiles
    this.splitProjectiles.forEach(proj => {
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fillStyle = proj.hasSplit ? '#ff00ff' : '#ffff00';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw spiral projectiles
    this.spiralProjectiles.forEach(proj => {
      if (proj.delay <= 0) {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw minions
    this.minions.forEach(minion => {
      ctx.beginPath();
      ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2);
      ctx.fillStyle = minion.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw boss body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    if (this.isDashing) {
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 40;
    } else if (this.isCharging) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 25;
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 0;
    }

    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw shield
    if (this.hasShield) {
      const shieldPulse = this.radius + 15 + Math.sin(this.shieldDuration / 10) * 5;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, shieldPulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, shieldPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw phase indicator
    const phaseColors = ['#ff00ff', '#ff0099', '#ff0000'];
    ctx.fillStyle = phaseColors[this.phase - 1];
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw health bar
    const barWidth = this.radius * 3;
    const barHeight = 12;
    const healthPercent = this.hp / this.maxHP;

    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 30, barWidth, barHeight);

    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 30, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x - barWidth / 2, this.y - this.radius - 30, barWidth, barHeight);

    // Draw status text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const phaseText = `ULTIMATE BOSS - PHASE ${this.phase}`;
    const statusText = this.isDashing ? 'DASHING!' : this.isCharging ? 'CHARGING!' : this.isFiringLaser ? 'FIRING LASER!' : phaseText;
    ctx.fillText(statusText, this.x, this.y - this.radius - 45);
  }

  collidesWith(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + entity.radius;
  }

  checkLaserCollision(entity) {
    if (!this.isFiringLaser) return false;

    // Check if entity intersects with laser beam
    const laserLength = 2000;
    const endX = this.x + Math.cos(this.laserAngle) * laserLength;
    const endY = this.y + Math.sin(this.laserAngle) * laserLength;

    // Point to line segment distance
    const dx = endX - this.x;
    const dy = endY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / len;
    const unitY = dy / len;

    const vx = entity.x - this.x;
    const vy = entity.y - this.y;
    const proj = vx * unitX + vy * unitY;

    if (proj < 0 || proj > len) return false;

    const closestX = this.x + unitX * proj;
    const closestY = this.y + unitY * proj;

    const distX = entity.x - closestX;
    const distY = entity.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);

    return dist < entity.radius + 20; // Laser width
  }

  checkProjectileCollisions(entity) {
    const collisions = [];

    // Check orbital collisions
    this.orbitals = this.orbitals.filter(orbital => {
      const ox = this.x + Math.cos(orbital.angle) * orbital.distance;
      const oy = this.y + Math.sin(orbital.angle) * orbital.distance;
      const dx = ox - entity.x;
      const dy = oy - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < orbital.radius + entity.radius) {
        collisions.push({ type: 'orbital', x: ox, y: oy });
        return false;
      }
      return true;
    });

    // Check missile collisions
    this.missiles = this.missiles.filter(missile => {
      const dx = missile.x - entity.x;
      const dy = missile.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < missile.radius + entity.radius) {
        collisions.push({ type: 'missile', x: missile.x, y: missile.y });
        return false;
      }
      return true;
    });

    // Check split projectile collisions
    this.splitProjectiles = this.splitProjectiles.filter(proj => {
      const dx = proj.x - entity.x;
      const dy = proj.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < proj.radius + entity.radius) {
        collisions.push({ type: 'split', x: proj.x, y: proj.y });
        return false;
      }
      return true;
    });

    // Check spiral projectile collisions
    this.spiralProjectiles = this.spiralProjectiles.filter(proj => {
      if (proj.delay > 0) return true;
      const dx = proj.x - entity.x;
      const dy = proj.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < proj.radius + entity.radius) {
        collisions.push({ type: 'spiral', x: proj.x, y: proj.y });
        return false;
      }
      return true;
    });

    // Check minion collisions
    this.minions = this.minions.filter(minion => {
      const dx = minion.x - entity.x;
      const dy = minion.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minion.radius + entity.radius) {
        collisions.push({ type: 'minion', x: minion.x, y: minion.y });
        return false;
      }
      return true;
    });

    return collisions;
  }

  getGravityEffect(entity) {
    let totalVx = 0;
    let totalVy = 0;

    this.gravityWells.forEach(well => {
      const dx = well.x - entity.x;
      const dy = well.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < well.radius && dist > 0) {
        const pullStrength = well.strength * (1 - dist / well.radius);
        totalVx += (dx / dist) * pullStrength;
        totalVy += (dy / dist) * pullStrength;
      }
    });

    return { vx: totalVx, vy: totalVy };
  }

  isInTimeDistortion(entity) {
    return this.timeDistortionZones.some(zone => {
      const dx = zone.x - entity.x;
      const dy = zone.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < zone.radius;
    });
  }

  takeDamage(amount) {
    if (this.hasShield) {
      return false; // Immune to damage while shielded
    }
    this.hp -= amount;
    return this.hp <= 0;
  }
}
