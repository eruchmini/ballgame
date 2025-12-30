import React, { useState, useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../game/constants';
import { FallingBall } from '../game/classes/FallingBall';
import { Boss } from '../game/classes/Boss';
import { AudioSystem } from '../game/audio/sounds';
import { MultiplayerManager } from '../game/multiplayer/websocket';
import {
  drawMuzzleFlashes,
  drawSmokeParticles,
  drawImpactParticles,
  createMuzzleFlash,
  createSmokeParticles,
  createImpactParticles,
  createImpactFlash,
  drawExplosions,
  drawDangerZones
} from '../game/particles/particles';
import { GameUI } from './GameUI';
import { UpgradeMenu } from './UpgradeMenu';
import { GameOver } from './GameOver';

const BallDodgeGame = () => {
  const canvasRef = useRef(null);

  // Game state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [upgradePoints, setUpgradePoints] = useState(0);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);
  const [speedUpgrades, setSpeedUpgrades] = useState(0);
  const [doubleClickUpgrades, setDoubleClickUpgrades] = useState(0);
  const [explosionUpgrades, setExplosionUpgrades] = useState(0);
  const [trackingUpgrades, setTrackingUpgrades] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState(GAME_CONFIG.BOSS.HP);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [combo, setCombo] = useState(0);
  const [activePowerups, setActivePowerups] = useState([]);

  // Game refs
  const playerRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight - 50,
    radius: GAME_CONFIG.PLAYER.RADIUS,
    speed: GAME_CONFIG.PLAYER.BASE_SPEED
  });
  const ballsRef = useRef([]);
  const keysRef = useRef({});
  const animationRef = useRef(null);
  const blastsRef = useRef([]);
  const shieldRef = useRef(false);
  const explosionsRef = useRef([]);
  const shieldTimerRef = useRef(null);
  const lastScoreCheckRef = useRef(0);
  const speedUpgradesRef = useRef(0);
  const doubleClickUpgradesRef = useRef(0);
  const lastMultiShotTimeRef = useRef(0);
  const currentCursorRef = useRef({ x: 0, y: 0 });
  const explosionUpgradesRef = useRef(0);
  const trackingUpgradesRef = useRef(0);
  const muzzleFlashesRef = useRef([]);
  const smokeParticlesRef = useRef([]);
  const impactParticlesRef = useRef([]);
  const bossRef = useRef(null);
  const bossSpawnedRef = useRef(false);
  const currentScoreRef = useRef(0);
  const dangerZonesRef = useRef([]);
  const bossDefeatedRef = useRef(false);
  const bossesSpawnedCountRef = useRef(0);
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const comboRef = useRef({ count: 0, lastHitTime: 0 });
  const powerupsRef = useRef([]);
  const activePowerupsRef = useRef([]);

  // Multiplayer refs
  const playerIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const otherPlayersRef = useRef({});
  const otherBlastsRef = useRef([]);
  const lastPositionBroadcastRef = useRef(0);
  const isGameMasterRef = useRef(false);
  const gameMasterIdRef = useRef(null);
  const lastBallUpdateRef = useRef(0);
  const ballIdCounterRef = useRef(0);

  // Audio and multiplayer systems
  const audioSystemRef = useRef(new AudioSystem());
  const multiplayerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize audio
    const audioSystem = audioSystemRef.current;
    audioSystem.initialize();

    // Initialize multiplayer
    multiplayerRef.current = new MultiplayerManager(
      playerIdRef,
      isGameMasterRef,
      gameMasterIdRef,
      ballsRef,
      otherPlayersRef,
      otherBlastsRef,
      canvas,
      setIsGameMaster
    );
    multiplayerRef.current.connect();

    // Keyboard event handlers
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        keysRef.current[e.key] = true;
      }
      if (e.key === 'Escape' && !gameOver && !showUpgradeMenu) {
        setPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse event handlers
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      currentCursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const handleClick = (e) => {
      if (gameOver) return;

      audioSystem.resume();

      if (!audioSystem.backgroundMusicRef.current && musicEnabled) {
        audioSystem.startBackgroundMusic(() => gameOver);
      }

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      currentCursorRef.current = { x: clickX, y: clickY };

      const currentTime = Date.now();
      const timeSinceLastMultiShot = currentTime - lastMultiShotTimeRef.current;

      // Rapid fire powerup reduces cooldown
      const rapidFireActive = hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.RAPID_FIRE);
      const multiShotCooldown = rapidFireActive ? GAME_CONFIG.UPGRADE.MULTI_SHOT_COOLDOWN / 3 : GAME_CONFIG.UPGRADE.MULTI_SHOT_COOLDOWN;

      const numShots = (doubleClickUpgradesRef.current > 0 && timeSinceLastMultiShot >= multiShotCooldown)
        ? 1 + doubleClickUpgradesRef.current
        : 1;

      if (numShots > 1) {
        lastMultiShotTimeRef.current = currentTime;
      }

      for (let i = 0; i < numShots; i++) {
        setTimeout(() => {
          if (gameOver) return;

          const dx = currentCursorRef.current.x - playerRef.current.x;
          const dy = currentCursorRef.current.y - playerRef.current.y;
          const angle = Math.atan2(dy, dx);

          blastsRef.current.push({
            x: playerRef.current.x,
            y: playerRef.current.y,
            angle: angle,
            radius: GAME_CONFIG.BLAST.RADIUS,
            speed: GAME_CONFIG.BLAST.SPEED,
            spawnTime: Date.now(),
            tracking: trackingUpgradesRef.current > 0,
            ownerId: playerIdRef.current
          });

          multiplayerRef.current?.broadcastBlast(playerRef.current.x, playerRef.current.y, angle);

          muzzleFlashesRef.current.push(createMuzzleFlash(playerRef.current.x, playerRef.current.y, angle));

          const barrelTipX = playerRef.current.x + Math.cos(angle) * 50;
          const barrelTipY = playerRef.current.y + Math.sin(angle) * 50;

          smokeParticlesRef.current.push(...createSmokeParticles(barrelTipX, barrelTipY, angle));

          audioSystem.playShootSound();
        }, i * 150);
      }
    };

    canvas.addEventListener('click', handleClick);

    // Helper functions
    const addScreenShake = (intensity) => {
      screenShakeRef.current.intensity = Math.max(screenShakeRef.current.intensity, intensity);
    };

    const updateScreenShake = () => {
      if (screenShakeRef.current.intensity > 0.1) {
        screenShakeRef.current.x = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.y = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.intensity *= GAME_CONFIG.SCREEN_SHAKE.DECAY_RATE;
      } else {
        screenShakeRef.current.x = 0;
        screenShakeRef.current.y = 0;
        screenShakeRef.current.intensity = 0;
      }
    };

    const spawnPowerup = (x, y) => {
      if (Math.random() < GAME_CONFIG.POWERUP.DROP_CHANCE) {
        const types = Object.values(GAME_CONFIG.POWERUP.TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        powerupsRef.current.push({
          x,
          y,
          type,
          radius: GAME_CONFIG.POWERUP.RADIUS,
          speed: GAME_CONFIG.POWERUP.FALL_SPEED,
        });
      }
    };

    const activatePowerup = (type) => {
      const powerup = {
        type,
        endTime: Date.now() + GAME_CONFIG.POWERUP.DURATION,
      };
      activePowerupsRef.current.push(powerup);
      setActivePowerups([...activePowerupsRef.current]);

      setTimeout(() => {
        activePowerupsRef.current = activePowerupsRef.current.filter(p => p !== powerup);
        setActivePowerups([...activePowerupsRef.current]);
      }, GAME_CONFIG.POWERUP.DURATION);
    };

    const updateCombo = () => {
      const now = Date.now();
      if (now - comboRef.current.lastHitTime > GAME_CONFIG.COMBO.TIMEOUT) {
        comboRef.current.count = 0;
        setCombo(0);
      }
    };

    const addCombo = () => {
      const now = Date.now();
      if (now - comboRef.current.lastHitTime < GAME_CONFIG.COMBO.TIMEOUT) {
        comboRef.current.count++;
      } else {
        comboRef.current.count = 1;
      }
      comboRef.current.lastHitTime = now;
      setCombo(comboRef.current.count);
    };

    const getComboMultiplier = () => {
      return Math.min(
        1 + (comboRef.current.count * GAME_CONFIG.COMBO.MULTIPLIER_PER_LEVEL),
        GAME_CONFIG.COMBO.MAX_MULTIPLIER
      );
    };

    const hasActivePowerup = (type) => {
      return activePowerupsRef.current.some(p => p.type === type);
    };

    // Spawn ball function
    const spawnBall = (speedMultiplier) => {
      if (!gameOver && !bossSpawnedRef.current && isGameMasterRef.current) {
        const rand = Math.random();
        const isShield = rand < GAME_CONFIG.BALL.SHIELD_SPAWN_CHANCE;
        const isTracking = !isShield && rand < (GAME_CONFIG.BALL.SHIELD_SPAWN_CHANCE + GAME_CONFIG.BALL.TRACKING_SPAWN_CHANCE);
        const isBouncing = !isShield && !isTracking && rand < (GAME_CONFIG.BALL.SHIELD_SPAWN_CHANCE + GAME_CONFIG.BALL.TRACKING_SPAWN_CHANCE + GAME_CONFIG.BALL.BOUNCING_SPAWN_CHANCE);
        const ball = new FallingBall(speedMultiplier, isShield, isTracking, isBouncing, false, canvas, ballIdCounterRef.current++);
        ballsRef.current.push(ball);

        multiplayerRef.current?.broadcastBallSpawn(ball);
      }
    };

    let lastSpawn = 0;
    let spawnInterval = GAME_CONFIG.SPAWN.INITIAL_INTERVAL;
    let lastScoreUpdate = 0;
    let gameStartTime = Date.now();

    // Main game loop
    const animate = (timestamp) => {
      if (gameOver) return;

      if (!paused) {
        // Update screen shake
        updateScreenShake();

        // Update combo timeout
        updateCombo();

        // Apply screen shake
        ctx.save();
        ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);

        ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(-screenShakeRef.current.x, -screenShakeRef.current.y, canvas.width, canvas.height);

      const elapsedSeconds = (Date.now() - gameStartTime) / 1000;
      const timeMultiplier = hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.SLOW_TIME) ? 0.5 : 1;
      const speedMultiplier = (1 + (elapsedSeconds / 10) * GAME_CONFIG.SPAWN.SPEED_MULTIPLIER_RATE) * timeMultiplier;

      spawnInterval = Math.max(
        GAME_CONFIG.SPAWN.MIN_INTERVAL,
        GAME_CONFIG.SPAWN.INITIAL_INTERVAL - (elapsedSeconds * GAME_CONFIG.SPAWN.SPEED_INCREASE_RATE)
      );

      const player = playerRef.current;
      player.speed = GAME_CONFIG.PLAYER.BASE_SPEED * (1 + speedUpgradesRef.current * GAME_CONFIG.PLAYER.SPEED_UPGRADE_BONUS);

      // Handle player movement
      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) {
        player.x = Math.max(player.radius, player.x - player.speed);
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) {
        player.x = Math.min(canvas.width - player.radius, player.x + player.speed);
      }
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) {
        player.y = Math.max(player.radius, player.y - player.speed);
      }
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) {
        player.y = Math.min(canvas.height - player.radius, player.y + player.speed);
      }

      // Broadcast position
      const now = Date.now();
      if (now - lastPositionBroadcastRef.current > GAME_CONFIG.MULTIPLAYER.POSITION_BROADCAST_INTERVAL) {
        multiplayerRef.current?.broadcastPosition(player.x, player.y, shieldRef.current);
        lastPositionBroadcastRef.current = now;
      }

      // Game master broadcasts ball updates
      if (isGameMasterRef.current && now - lastBallUpdateRef.current > GAME_CONFIG.MULTIPLAYER.BALL_UPDATE_INTERVAL) {
        multiplayerRef.current?.broadcastBallUpdate(ballsRef.current);
        lastBallUpdateRef.current = now;
      }

      // Draw other players
      Object.entries(otherPlayersRef.current).forEach(([id, otherPlayer]) => {
        if (now - otherPlayer.lastUpdate > GAME_CONFIG.MULTIPLAYER.PLAYER_TIMEOUT) {
          delete otherPlayersRef.current[id];
          return;
        }

        // Smooth interpolation towards target position
        const lerpFactor = 0.25; // 25% move towards target each frame (~60fps = smooth movement)
        otherPlayer.x += (otherPlayer.targetX - otherPlayer.x) * lerpFactor;
        otherPlayer.y += (otherPlayer.targetY - otherPlayer.y) * lerpFactor;

        ctx.beginPath();
        ctx.arc(otherPlayer.x, otherPlayer.y, GAME_CONFIG.PLAYER.RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = GAME_CONFIG.COLORS.OTHER_PLAYER;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (otherPlayer.hasShield) {
          ctx.beginPath();
          ctx.arc(otherPlayer.x, otherPlayer.y, 23, 0, Math.PI * 2);
          ctx.strokeStyle = GAME_CONFIG.COLORS.SHIELD;
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        const gunAngle = Math.atan2(currentCursorRef.current.y - otherPlayer.y, currentCursorRef.current.x - otherPlayer.x);
        ctx.save();
        ctx.translate(otherPlayer.x, otherPlayer.y);
        ctx.rotate(gunAngle);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(15, -4, 35, 8);
        ctx.fillRect(8, -7, 15, 14);
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(id.substr(0, 4), otherPlayer.x, otherPlayer.y - 30);
      });

      // Draw player
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = GAME_CONFIG.COLORS.PLAYER;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Invincibility glow effect
      if (hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.INVINCIBILITY)) {
        const glowSize = player.radius + 10 + Math.sin(Date.now() / 100) * 5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, glowSize, 0, Math.PI * 2);
        ctx.strokeStyle = GAME_CONFIG.COLORS.POWERUP_INVINCIBILITY;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(player.x, player.y, glowSize + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
      }

      const cursorDx = currentCursorRef.current.x - player.x;
      const cursorDy = currentCursorRef.current.y - player.y;
      const gunAngle = Math.atan2(cursorDy, cursorDx);

      const currentTime = Date.now();

      // Draw gun
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(gunAngle);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, -4, 35, 8);
      ctx.fillRect(8, -7, 15, 14);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, -4, 35, 8);
      ctx.strokeRect(8, -7, 15, 14);
      ctx.restore();

      if (shieldRef.current) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = GAME_CONFIG.COLORS.SHIELD;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Draw particles
      drawMuzzleFlashes(ctx, muzzleFlashesRef, currentTime);
      drawSmokeParticles(ctx, smokeParticlesRef, currentTime);
      drawImpactParticles(ctx, impactParticlesRef, currentTime);

      // Update and draw blasts (continued in next part due to size)
      updateAndDrawBlasts(ctx, currentTime, audioSystem);

      // Update and draw other players' blasts
      updateAndDrawOtherBlasts(ctx, currentTime, audioSystem);

      // Update and draw explosions
      drawExplosions(
        ctx,
        explosionsRef,
        ballsRef,
        setScore,
        isGameMasterRef.current,
        (ballId) => multiplayerRef.current?.broadcastBallDestroy(ballId)
      );

      // Spawn balls
      if (timestamp - lastSpawn > spawnInterval) {
        spawnBall(speedMultiplier);
        lastSpawn = timestamp;
      }

      // Boss logic - spawn first boss at 500, second boss at 1500
      const shouldSpawnBoss = (
        (score >= 500 && bossesSpawnedCountRef.current === 0) ||
        (score >= 1500 && bossesSpawnedCountRef.current === 1)
      ) && !bossSpawnedRef.current && !bossRef.current;

      if (shouldSpawnBoss) {
        bossSpawnedRef.current = true;
        bossesSpawnedCountRef.current++;
        setBossActive(true);
        bossRef.current = new Boss(
          canvas,
          playerRef,
          explosionsRef,
          impactParticlesRef,
          dangerZonesRef,
          () => audioSystem.playExplosionSound()
        );
        ballsRef.current = [];
        audioSystem.stopBackgroundMusic();
        audioSystem.startBossMusic(() => gameOver);
      }

      if (bossRef.current) {
        bossRef.current.update();
        bossRef.current.draw(ctx);

        if (bossRef.current.collidesWith(player)) {
          handlePlayerHit(bossRef.current.isDashing, audioSystem);
        }
      }

      // Draw danger zones
      drawDangerZones(
        ctx,
        dangerZonesRef,
        currentTime,
        explosionsRef,
        impactParticlesRef,
        playerRef,
        setGameOver,
        () => audioSystem.playGameOverSound(),
        () => audioSystem.playGameOverMelody(),
        () => audioSystem.stopBackgroundMusic(),
        () => audioSystem.stopBossMusic(),
        () => audioSystem.playExplosionSound()
      );

      // Update and draw balls
      updateAndDrawBalls(ctx, audioSystem);

      // Update and draw powerups
      powerupsRef.current = powerupsRef.current.filter(powerup => {
        powerup.y += powerup.speed;

        const dx = powerup.x - player.x;
        const dy = powerup.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < powerup.radius + player.radius) {
          activatePowerup(powerup.type);
          audioSystem.playShieldSound();
          return false;
        }

        if (powerup.y > canvas.height + powerup.radius) {
          return false;
        }

        // Draw powerup with pulsing effect
        const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.radius * pulseScale, 0, Math.PI * 2);

        const colors = {
          [GAME_CONFIG.POWERUP.TYPES.RAPID_FIRE]: GAME_CONFIG.COLORS.POWERUP_RAPID_FIRE,
          [GAME_CONFIG.POWERUP.TYPES.INVINCIBILITY]: GAME_CONFIG.COLORS.POWERUP_INVINCIBILITY,
          [GAME_CONFIG.POWERUP.TYPES.SLOW_TIME]: GAME_CONFIG.COLORS.POWERUP_SLOW_TIME,
          [GAME_CONFIG.POWERUP.TYPES.MEGA_BLAST]: GAME_CONFIG.COLORS.POWERUP_MEGA_BLAST,
        };

        ctx.fillStyle = colors[powerup.type];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw icon/letter
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = {
          [GAME_CONFIG.POWERUP.TYPES.RAPID_FIRE]: 'R',
          [GAME_CONFIG.POWERUP.TYPES.INVINCIBILITY]: 'I',
          [GAME_CONFIG.POWERUP.TYPES.SLOW_TIME]: 'S',
          [GAME_CONFIG.POWERUP.TYPES.MEGA_BLAST]: 'M',
        };
        ctx.fillText(icons[powerup.type], powerup.x, powerup.y);

        return true;
      });

      // Draw combo indicator
      if (comboRef.current.count > 1) {
        const multiplier = getComboMultiplier();
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO x${comboRef.current.count}`, canvas.width / 2, 50);
        ctx.font = '16px Arial';
        ctx.fillText(`${multiplier.toFixed(1)}x points`, canvas.width / 2, 75);
      }

      // Draw active powerup indicators
      if (activePowerupsRef.current.length > 0) {
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Arial';
        activePowerupsRef.current.forEach((powerup, i) => {
          const timeLeft = Math.max(0, (powerup.endTime - Date.now()) / 1000);
          const labels = {
            [GAME_CONFIG.POWERUP.TYPES.RAPID_FIRE]: '🔫 Rapid Fire',
            [GAME_CONFIG.POWERUP.TYPES.INVINCIBILITY]: '⭐ Invincible',
            [GAME_CONFIG.POWERUP.TYPES.SLOW_TIME]: '⏱️ Slow Time',
            [GAME_CONFIG.POWERUP.TYPES.MEGA_BLAST]: '💥 Mega Blast',
          };
          ctx.fillStyle = '#ffff00';
          ctx.fillText(`${labels[powerup.type]}: ${timeLeft.toFixed(1)}s`, 20, 120 + i * 25);
        });
      }

      // Restore canvas transformation (undo screen shake)
      ctx.restore();

      // Score increment
      if (timestamp - lastScoreUpdate > 1000) {
        setScore(prev => {
          const newScore = prev + GAME_CONFIG.SCORING.POINTS_PER_SECOND;
          if (Math.floor(newScore / GAME_CONFIG.SCORING.UPGRADE_POINT_INTERVAL) > Math.floor(lastScoreCheckRef.current / GAME_CONFIG.SCORING.UPGRADE_POINT_INTERVAL)) {
            setUpgradePoints(points => points + 1);
            setShowUpgradeMenu(true);
            setPaused(true);
          }
          lastScoreCheckRef.current = newScore;
          return newScore;
        });
        lastScoreUpdate = timestamp;
      }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Helper functions for game loop
    const updateAndDrawBlasts = (ctx, currentTime, audioSystem) => {
      const trackingDuration = trackingUpgradesRef.current * GAME_CONFIG.UPGRADE.TRACKING_DURATION_PER_LEVEL;

      blastsRef.current = blastsRef.current.filter(blast => {
        const timeSinceSpawn = Date.now() - blast.spawnTime;
        const isTracking = blast.tracking && timeSinceSpawn < trackingDuration;

        if (isTracking && ballsRef.current.length > 0) {
          let nearestBall = null;
          let nearestDist = Infinity;

          for (const ball of ballsRef.current) {
            if (ball.isShield || ball.isPurple) continue;
            const dx = ball.x - blast.x;
            const dy = ball.y - blast.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist) {
              nearestDist = dist;
              nearestBall = ball;
            }
          }

          if (nearestBall) {
            const dx = nearestBall.x - blast.x;
            const dy = nearestBall.y - blast.y;
            blast.angle = Math.atan2(dy, dx);
          }
        }

        blast.x += Math.cos(blast.angle) * blast.speed;
        blast.y += Math.sin(blast.angle) * blast.speed;

        // Check collision with other players
        for (const [id, otherPlayer] of Object.entries(otherPlayersRef.current)) {
          const dx = blast.x - otherPlayer.x;
          const dy = blast.y - otherPlayer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < blast.radius + GAME_CONFIG.PLAYER.RADIUS) {
            impactParticlesRef.current.push(...createImpactParticles(blast.x, blast.y, 12, GAME_CONFIG.COLORS.OTHER_PLAYER));
            audioSystem.playHitSound();
            return false;
          }
        }

        // Check collision with other blasts
        for (let i = otherBlastsRef.current.length - 1; i >= 0; i--) {
          const otherBlast = otherBlastsRef.current[i];
          const dx = blast.x - otherBlast.x;
          const dy = blast.y - otherBlast.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < blast.radius + otherBlast.radius) {
            otherBlastsRef.current.splice(i, 1);

            explosionsRef.current.push({
              x: blast.x,
              y: blast.y,
              radius: 5,
              maxRadius: 30,
              growSpeed: 3,
              active: true
            });

            impactParticlesRef.current.push(...createImpactParticles(blast.x, blast.y, 8, '#ffff00'));
            audioSystem.playExplosionSound();
            return false;
          }
        }

        // Check if off screen
        if (blast.x < -blast.radius || blast.x > canvas.width + blast.radius ||
            blast.y < -blast.radius || blast.y > canvas.height + blast.radius) {
          impactParticlesRef.current.push(...createImpactParticles(blast.x, blast.y, 6, '#aaaaaa').map(p => ({
            ...p,
            vx: Math.cos(blast.angle + Math.PI + (Math.random() - 0.5) * Math.PI) * (2 + Math.random() * 2),
            vy: Math.sin(blast.angle + Math.PI + (Math.random() - 0.5) * Math.PI) * (2 + Math.random() * 2)
          })));

          const baseRadius = GAME_CONFIG.EXPLOSION.BASE_RADIUS;
          const bonusRadius = explosionUpgradesRef.current * GAME_CONFIG.EXPLOSION.BONUS_RADIUS_PER_UPGRADE;
          const megaBlastBonus = hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.MEGA_BLAST) ? 50 : 0;
          explosionsRef.current.push({
            x: blast.x,
            y: blast.y,
            radius: 5,
            maxRadius: baseRadius + bonusRadius + megaBlastBonus,
            growSpeed: GAME_CONFIG.EXPLOSION.GROW_SPEED,
            active: true
          });
          audioSystem.playExplosionSound();
          return false;
        }

        // Draw blast
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.radius, 0, Math.PI * 2);
        ctx.fillStyle = isTracking ? '#ff00ff' : GAME_CONFIG.COLORS.BLAST;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Check collision with balls
        for (let i = ballsRef.current.length - 1; i >= 0; i--) {
          const ball = ballsRef.current[i];

          if (ball.isShield || ball.isPurple) continue;

          const dx = blast.x - ball.x;
          const dy = blast.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < blast.radius + ball.radius) {
            const ballId = ball.id;
            const ballX = ball.x;
            const ballY = ball.y;
            ballsRef.current.splice(i, 1);

            if (isGameMasterRef.current) {
              multiplayerRef.current?.broadcastBallDestroy(ballId);
            }

            // Spawn powerup
            spawnPowerup(ballX, ballY);

            // Add combo
            addCombo();

            // Screen shake
            addScreenShake(GAME_CONFIG.SCREEN_SHAKE.IMPACT_INTENSITY);

            const basePoints = ball.isBouncing ? GAME_CONFIG.SCORING.POINTS_PER_BOUNCING_BALL : (ball.isTracking ? GAME_CONFIG.SCORING.POINTS_PER_TRACKING_BALL : GAME_CONFIG.SCORING.POINTS_PER_BALL);
            const points = Math.floor(basePoints * getComboMultiplier());
            setScore(prev => {
              const newScore = prev + points;
              currentScoreRef.current = newScore;
              // Check if we should spawn a boss (first at 500, second at 1500)
              const shouldSpawnBoss = (
                (newScore >= 500 && bossesSpawnedCountRef.current === 0) ||
                (newScore >= 1500 && bossesSpawnedCountRef.current === 1)
              ) && !bossSpawnedRef.current && !bossRef.current;

              if (shouldSpawnBoss) {
                bossSpawnedRef.current = true;
                bossesSpawnedCountRef.current++;
                setBossActive(true);
                bossRef.current = new Boss(
                  canvas,
                  playerRef,
                  explosionsRef,
                  impactParticlesRef,
                  dangerZonesRef,
                  () => audioSystem.playExplosionSound()
                );
                ballsRef.current = [];
                audioSystem.stopBackgroundMusic();
                audioSystem.startBossMusic(() => gameOver);
              }
              return newScore;
            });

            const ballColor = ball.isBouncing ? GAME_CONFIG.COLORS.BALL_GREEN : (ball.isTracking ? GAME_CONFIG.COLORS.BALL_ORANGE : GAME_CONFIG.COLORS.BALL_RED);
            impactParticlesRef.current.push(...createImpactParticles(blast.x, blast.y, 12, ballColor));
            impactParticlesRef.current.push(createImpactFlash(blast.x, blast.y));

            const baseRadius = GAME_CONFIG.EXPLOSION.BASE_RADIUS;
            const bonusRadius = explosionUpgradesRef.current * GAME_CONFIG.EXPLOSION.BONUS_RADIUS_PER_UPGRADE;
            const megaBlastBonus = hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.MEGA_BLAST) ? 50 : 0;
            explosionsRef.current.push({
              x: blast.x,
              y: blast.y,
              radius: 5,
              maxRadius: baseRadius + bonusRadius + megaBlastBonus,
              growSpeed: GAME_CONFIG.EXPLOSION.GROW_SPEED,
              active: true
            });
            audioSystem.playExplosionSound();
            return false;
          }
        }

        // Check collision with boss
        if (bossRef.current) {
          const dx = blast.x - bossRef.current.x;
          const dy = blast.y - bossRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < blast.radius + bossRef.current.radius) {
            const defeated = bossRef.current.takeDamage(1);
            setBossHP(bossRef.current.hp);

            // Screen shake on boss hit
            addScreenShake(GAME_CONFIG.SCREEN_SHAKE.BOSS_HIT_INTENSITY);

            impactParticlesRef.current.push(...createImpactParticles(blast.x, blast.y, 8, GAME_CONFIG.COLORS.BOSS));

            if (defeated) {
              const bx = bossRef.current.x;
              const by = bossRef.current.y;
              setScore(prev => {
                const newScore = prev + GAME_CONFIG.SCORING.POINTS_PER_BOSS;
                currentScoreRef.current = newScore;
                return newScore;
              });
              setBossActive(false);
              bossRef.current = null;
              // Reset flag to allow next boss to spawn (if conditions are met)
              bossSpawnedRef.current = false;

              audioSystem.stopBossMusic();
              if (musicEnabled && !audioSystem.backgroundMusicRef.current) {
                audioSystem.startBackgroundMusic(() => gameOver);
              }

              explosionsRef.current.push({
                x: bx,
                y: by,
                radius: 5,
                maxRadius: 150,
                growSpeed: 5,
                active: true
              });
            }

            audioSystem.playExplosionSound();
            return false;
          }
        }

        return true;
      });
    };

    const updateAndDrawOtherBlasts = (ctx, currentTime, audioSystem) => {
      otherBlastsRef.current = otherBlastsRef.current.filter(blast => {
        blast.x += Math.cos(blast.angle) * blast.speed;
        blast.y += Math.sin(blast.angle) * blast.speed;

        const age = Date.now() - blast.createdAt;
        if (age > 5000 || blast.x < -50 || blast.x > canvas.width + 50 ||
            blast.y < -50 || blast.y > canvas.height + 50) {
          return false;
        }

        const dx = blast.x - playerRef.current.x;
        const dy = blast.y - playerRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < blast.radius + playerRef.current.radius) {
          handlePlayerHit(false, audioSystem);
          impactParticlesRef.current.push(...createImpactParticles(blast.x, blast.y, 12, GAME_CONFIG.COLORS.PLAYER));
          return false;
        }

        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.radius, 0, Math.PI * 2);
        ctx.fillStyle = GAME_CONFIG.COLORS.OTHER_BLAST;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        return true;
      });
    };

    const updateAndDrawBalls = (ctx, audioSystem) => {
      ballsRef.current = ballsRef.current.filter(ball => {
        ball.update(canvas, playerRef);
        ball.draw(ctx);

        if (ball.collidesWith(playerRef.current)) {
          if (ball.isShield) {
            shieldRef.current = true;
            setHasShield(true);
            audioSystem.playShieldSound();

            if (shieldTimerRef.current) {
              clearTimeout(shieldTimerRef.current);
            }

            shieldTimerRef.current = setTimeout(() => {
              shieldRef.current = false;
              setHasShield(false);
            }, GAME_CONFIG.SHIELD.DURATION);

            if (isGameMasterRef.current) {
              multiplayerRef.current?.broadcastBallDestroy(ball.id);
            }

            return false;
          } else if (ball.isPurple) {
            setScore(prev => {
              const newScore = prev + GAME_CONFIG.SCORING.POINTS_PER_PURPLE_BALL;
              currentScoreRef.current = newScore;
              return newScore;
            });
            audioSystem.playShieldSound();

            if (isGameMasterRef.current) {
              multiplayerRef.current?.broadcastBallDestroy(ball.id);
            }

            return false;
          } else {
            // Check invincibility first
            if (hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.INVINCIBILITY)) {
              audioSystem.playHitSound();
              addScreenShake(GAME_CONFIG.SCREEN_SHAKE.IMPACT_INTENSITY);

              if (isGameMasterRef.current) {
                multiplayerRef.current?.broadcastBallDestroy(ball.id);
              }

              return false;
            } else if (shieldRef.current) {
              shieldRef.current = false;
              setHasShield(false);
              audioSystem.playHitSound();
              addScreenShake(GAME_CONFIG.SCREEN_SHAKE.IMPACT_INTENSITY);

              if (shieldTimerRef.current) {
                clearTimeout(shieldTimerRef.current);
                shieldTimerRef.current = null;
              }

              if (isGameMasterRef.current) {
                multiplayerRef.current?.broadcastBallDestroy(ball.id);
              }

              return false;
            } else {
              setGameOver(true);
              audioSystem.playGameOverSound();
              audioSystem.playGameOverMelody();
              audioSystem.stopBackgroundMusic();
              audioSystem.stopBossMusic();

              multiplayerRef.current?.broadcastPlayerDied();

              return true;
            }
          }
        }

        if (ball.isOffScreen(canvas)) {
          if (isGameMasterRef.current) {
            multiplayerRef.current?.broadcastBallDestroy(ball.id);
          }
          return false;
        }

        return true;
      });
    };

    const handlePlayerHit = (instant, audioSystem) => {
      // Invincibility powerup protects from all damage
      if (hasActivePowerup(GAME_CONFIG.POWERUP.TYPES.INVINCIBILITY)) {
        audioSystem.playHitSound();
        addScreenShake(GAME_CONFIG.SCREEN_SHAKE.IMPACT_INTENSITY);
        return;
      }

      if (instant) {
        setGameOver(true);
        audioSystem.playGameOverSound();
        audioSystem.playGameOverMelody();
        audioSystem.stopBackgroundMusic();
        audioSystem.stopBossMusic();
        multiplayerRef.current?.broadcastPlayerDied();
      } else if (shieldRef.current) {
        shieldRef.current = false;
        setHasShield(false);
        audioSystem.playHitSound();
        addScreenShake(GAME_CONFIG.SCREEN_SHAKE.IMPACT_INTENSITY);
        if (shieldTimerRef.current) {
          clearTimeout(shieldTimerRef.current);
          shieldTimerRef.current = null;
        }
      } else {
        setGameOver(true);
        audioSystem.playGameOverSound();
        audioSystem.playGameOverMelody();
        audioSystem.stopBackgroundMusic();
        audioSystem.stopBossMusic();
        multiplayerRef.current?.broadcastPlayerDied();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      audioSystem.stopBackgroundMusic();
      audioSystem.stopBossMusic();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (shieldTimerRef.current) {
        clearTimeout(shieldTimerRef.current);
      }
      multiplayerRef.current?.disconnect();
    };
  }, [gameOver, musicEnabled, paused]);

  const resetGame = () => {
    setScore(0);
    currentScoreRef.current = 0;
    setGameOver(false);
    setPaused(false);
    setHasShield(false);
    setUpgradePoints(0);
    setShowUpgradeMenu(false);
    setSpeedUpgrades(0);
    setDoubleClickUpgrades(0);
    setExplosionUpgrades(0);
    setTrackingUpgrades(0);
    setBossActive(false);
    setBossHP(GAME_CONFIG.BOSS.HP);
    shieldRef.current = false;
    speedUpgradesRef.current = 0;
    doubleClickUpgradesRef.current = 0;
    explosionUpgradesRef.current = 0;
    trackingUpgradesRef.current = 0;
    lastMultiShotTimeRef.current = 0;
    ballsRef.current = [];
    blastsRef.current = [];
    explosionsRef.current = [];
    muzzleFlashesRef.current = [];
    smokeParticlesRef.current = [];
    impactParticlesRef.current = [];
    bossRef.current = null;
    bossSpawnedRef.current = false;
    bossDefeatedRef.current = false;
    bossesSpawnedCountRef.current = 0;
    dangerZonesRef.current = [];
    otherBlastsRef.current = [];
    playerRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight - 50,
      radius: GAME_CONFIG.PLAYER.RADIUS,
      speed: GAME_CONFIG.PLAYER.BASE_SPEED
    };
    keysRef.current = {};
    lastScoreCheckRef.current = 0;
    ballIdCounterRef.current = 0;
    comboRef.current = { count: 0, lastHitTime: 0 };
    setCombo(0);
    powerupsRef.current = [];
    activePowerupsRef.current = [];
    setActivePowerups([]);
    screenShakeRef.current = { x: 0, y: 0, intensity: 0 };

    if (shieldTimerRef.current) {
      clearTimeout(shieldTimerRef.current);
      shieldTimerRef.current = null;
    }

    if (musicEnabled && audioSystemRef.current) {
      setTimeout(() => {
        audioSystemRef.current.resume();
      }, 100);
    }
  };

  const buySpeedUpgrade = () => {
    if (upgradePoints > 0) {
      setUpgradePoints(prev => prev - 1);
      setSpeedUpgrades(prev => prev + 1);
      speedUpgradesRef.current += 1;
      setShowUpgradeMenu(false);
      setPaused(false);
    }
  };

  const buyDoubleClickUpgrade = () => {
    if (upgradePoints > 0) {
      setUpgradePoints(prev => prev - 1);
      setDoubleClickUpgrades(prev => prev + 1);
      doubleClickUpgradesRef.current += 1;
      setShowUpgradeMenu(false);
      setPaused(false);
    }
  };

  const buyExplosionUpgrade = () => {
    if (upgradePoints > 0) {
      setUpgradePoints(prev => prev - 1);
      setExplosionUpgrades(prev => prev + 1);
      explosionUpgradesRef.current += 1;
      setShowUpgradeMenu(false);
      setPaused(false);
    }
  };

  const buyTrackingUpgrade = () => {
    if (upgradePoints >= 2) {
      setUpgradePoints(prev => prev - 2);
      setTrackingUpgrades(prev => prev + 1);
      trackingUpgradesRef.current += 1;
      setShowUpgradeMenu(false);
      setPaused(false);
    }
  };

  const toggleMusic = () => {
    const newMusicState = !musicEnabled;
    setMusicEnabled(newMusicState);
    audioSystemRef.current.setEnabled(newMusicState);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900">
      <GameUI
        score={score}
        resetGame={resetGame}
        upgradePoints={upgradePoints}
        setShowUpgradeMenu={setShowUpgradeMenu}
        musicEnabled={musicEnabled}
        toggleMusic={toggleMusic}
        otherPlayersCount={Object.keys(otherPlayersRef.current).length}
        isGameMaster={isGameMaster}
      />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        tabIndex={0}
      />

      {showUpgradeMenu && upgradePoints > 0 && (
        <UpgradeMenu
          upgradePoints={upgradePoints}
          speedUpgrades={speedUpgrades}
          doubleClickUpgrades={doubleClickUpgrades}
          explosionUpgrades={explosionUpgrades}
          trackingUpgrades={trackingUpgrades}
          buySpeedUpgrade={buySpeedUpgrade}
          buyDoubleClickUpgrade={buyDoubleClickUpgrade}
          buyExplosionUpgrade={buyExplosionUpgrade}
          buyTrackingUpgrade={buyTrackingUpgrade}
          onClose={() => setShowUpgradeMenu(false)}
        />
      )}

      {paused && !showUpgradeMenu && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">PAUSED</div>
            <div className="text-xl text-gray-300">Press ESC to resume</div>
          </div>
        </div>
      )}

      {gameOver && <GameOver score={score} />}
    </div>
  );
};

export default BallDodgeGame;
