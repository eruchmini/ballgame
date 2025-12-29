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

      const numShots = (doubleClickUpgradesRef.current > 0 && timeSinceLastMultiShot >= GAME_CONFIG.UPGRADE.MULTI_SHOT_COOLDOWN)
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
        ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

      const elapsedSeconds = (Date.now() - gameStartTime) / 1000;
      const speedMultiplier = 1 + (elapsedSeconds / 10) * GAME_CONFIG.SPAWN.SPEED_MULTIPLIER_RATE;

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

      // Boss logic
      if (score >= GAME_CONFIG.SCORING.BOSS_SPAWN_THRESHOLD && !bossSpawnedRef.current && !bossRef.current) {
        bossSpawnedRef.current = true;
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
          explosionsRef.current.push({
            x: blast.x,
            y: blast.y,
            radius: 5,
            maxRadius: baseRadius + bonusRadius,
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
            ballsRef.current.splice(i, 1);

            if (isGameMasterRef.current) {
              multiplayerRef.current?.broadcastBallDestroy(ballId);
            }

            const points = ball.isBouncing ? GAME_CONFIG.SCORING.POINTS_PER_BOUNCING_BALL : (ball.isTracking ? GAME_CONFIG.SCORING.POINTS_PER_TRACKING_BALL : GAME_CONFIG.SCORING.POINTS_PER_BALL);
            setScore(prev => {
              const newScore = prev + points;
              currentScoreRef.current = newScore;
              if (newScore >= GAME_CONFIG.SCORING.BOSS_SPAWN_THRESHOLD && !bossSpawnedRef.current && !bossDefeatedRef.current) {
                bossSpawnedRef.current = true;
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
            explosionsRef.current.push({
              x: blast.x,
              y: blast.y,
              radius: 5,
              maxRadius: baseRadius + bonusRadius,
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
              bossSpawnedRef.current = false;
              bossDefeatedRef.current = true;

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
            if (shieldRef.current) {
              shieldRef.current = false;
              setHasShield(false);
              audioSystem.playHitSound();

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

      {gameOver && <GameOver score={score} />}
    </div>
  );
};

export default BallDodgeGame;
