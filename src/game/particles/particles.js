// Particle system renderers

export const drawMuzzleFlashes = (ctx, muzzleFlashesRef, currentTime) => {
  muzzleFlashesRef.current = muzzleFlashesRef.current.filter(flash => {
    const age = currentTime - flash.spawnTime;
    if (age > 120) return false;

    const opacity = 1 - (age / 120);
    const size = 15 - (age / 120) * 5;
    const frameIndex = Math.floor(age / 30) % 2;

    ctx.save();
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.angle);
    ctx.globalAlpha = opacity;

    if (frameIndex === 0) {
      // Frame 1: Circular flash with sparks
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(50, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(50, 0, size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i) / 4;
        const dist = size * 1.3;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(50 + Math.cos(angle) * dist, Math.sin(angle) * dist, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Frame 2: Star-shaped flash
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + 0.3;
        const radius = i % 2 === 0 ? size * 1.4 : size * 0.5;
        const x = 50 + Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i) / 4 + Math.PI / 4;
        const dist = size * 1.1;
        ctx.fillStyle = '#ffbb00';
        ctx.beginPath();
        ctx.arc(50 + Math.cos(angle) * dist, Math.sin(angle) * dist, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffff66';
      ctx.beginPath();
      ctx.arc(50, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    return true;
  });
};

export const drawSmokeParticles = (ctx, smokeParticlesRef, currentTime) => {
  smokeParticlesRef.current = smokeParticlesRef.current.filter(smoke => {
    const age = currentTime - smoke.spawnTime;
    if (age > smoke.life) return false;

    smoke.x += smoke.vx;
    smoke.y += smoke.vy;

    smoke.vx *= 0.98;
    smoke.vy *= 0.98;

    const progress = age / smoke.life;
    const currentSize = smoke.size * (1 + progress * 2);
    const opacity = (1 - progress) * 0.6;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, currentSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    return true;
  });
};

export const drawImpactParticles = (ctx, impactParticlesRef, currentTime) => {
  impactParticlesRef.current = impactParticlesRef.current.filter(particle => {
    const age = currentTime - particle.spawnTime;
    if (age > particle.life) return false;

    if (particle.isFlash) {
      const progress = age / particle.life;
      const opacity = 1 - progress;
      const size = particle.size * (1 + progress * 0.5);

      ctx.globalAlpha = opacity;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    } else {
      particle.x += particle.vx;
      particle.y += particle.vy;

      particle.vy += 0.15; // Gravity
      particle.vx *= 0.96;
      particle.vy *= 0.96;

      const progress = age / particle.life;
      const opacity = 1 - progress;
      const currentSize = particle.size * (1 - progress * 0.5);

      ctx.globalAlpha = opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffff88';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    return true;
  });
};

export const createMuzzleFlash = (x, y, angle) => ({
  x,
  y,
  angle,
  spawnTime: Date.now()
});

export const createSmokeParticles = (x, y, angle, count = 5) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (2 + Math.random() * 2) + (Math.random() - 0.5) * 1,
      vy: Math.sin(angle) * (2 + Math.random() * 2) + (Math.random() - 0.5) * 1,
      size: 3 + Math.random() * 3,
      spawnTime: Date.now(),
      life: 800 + Math.random() * 400
    });
  }
  return particles;
};

export const createImpactParticles = (x, y, count, color) => {
  const particles = [];
  for (let p = 0; p < count; p++) {
    const angle = (Math.PI * 2 * p) / count;
    const speed = 3 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color,
      spawnTime: Date.now(),
      life: 300 + Math.random() * 200
    });
  }
  return particles;
};

export const createImpactFlash = (x, y) => ({
  x,
  y,
  vx: 0,
  vy: 0,
  size: 20,
  color: '#ffffff',
  spawnTime: Date.now(),
  life: 100,
  isFlash: true
});

export const drawExplosions = (ctx, explosionsRef, ballsRef, setScore, isGameMasterRef, broadcastBallDestroy) => {
  explosionsRef.current = explosionsRef.current.filter(explosion => {
    if (!explosion.active) return false;

    explosion.radius += explosion.growSpeed;

    if (explosion.radius >= explosion.maxRadius) {
      return false;
    }

    // Check ball collisions
    for (let i = ballsRef.current.length - 1; i >= 0; i--) {
      const ball = ballsRef.current[i];
      if (ball.isShield || ball.isPurple) continue;

      const dx = explosion.x - ball.x;
      const dy = explosion.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < explosion.radius + ball.radius) {
        const ballId = ball.id;
        ballsRef.current.splice(i, 1);

        // Game master broadcasts ball destruction
        if (isGameMasterRef.current) {
          broadcastBallDestroy(ballId);
        }

        setScore(prev => prev + (ball.isTracking ? 5 : 3));
      }
    }

    // Draw explosion
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 200, 0, ${1 - explosion.radius / explosion.maxRadius})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 100, 0, ${1 - explosion.radius / explosion.maxRadius})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    return true;
  });
};

export const drawDangerZones = (ctx, dangerZonesRef, currentTime, explosionsRef, impactParticlesRef, playerRef, setGameOver, playGameOverSound, playGameOverMelody, stopBackgroundMusic, stopBossMusic, playExplosionSound) => {
  dangerZonesRef.current = dangerZonesRef.current.filter(zone => {
    const age = currentTime - zone.spawnTime;
    zone.warningTime--;

    if (zone.warningTime > 0) {
      const opacity = Math.sin(age / 100) * 0.3 + 0.5;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.stroke();

      const secondsLeft = Math.ceil(zone.warningTime / 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(secondsLeft, zone.x, zone.y + 8);

      if (zone.warningTime < 60) {
        const fallProgress = 1 - (zone.warningTime / 60);
        const meteorY = zone.y - 200 + (fallProgress * 200);
        const meteorSize = zone.radius * 0.8 * (0.5 + fallProgress * 0.5);

        ctx.fillStyle = '#333333';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(zone.x, meteorY, meteorSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      return true;
    } else if (zone.warningTime === 0) {
      // Meteor hits
      explosionsRef.current.push({
        x: zone.x,
        y: zone.y,
        radius: 5,
        maxRadius: zone.radius * 1.5,
        growSpeed: 4,
        active: true
      });

      for (let p = 0; p < 25; p++) {
        const angle = (Math.PI * 2 * p) / 25;
        const speed = 3 + Math.random() * 6;
        impactParticlesRef.current.push({
          x: zone.x,
          y: zone.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 4,
          color: '#666666',
          spawnTime: Date.now(),
          life: 500 + Math.random() * 400
        });
      }

      const dx = zone.x - playerRef.current.x;
      const dy = zone.y - playerRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < zone.radius) {
        setGameOver(true);
        playGameOverSound();
        playGameOverMelody();
        stopBackgroundMusic();
        stopBossMusic();
      }

      playExplosionSound();
      return false;
    }

    return false;
  });
};
