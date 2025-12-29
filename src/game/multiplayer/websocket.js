import { GAME_CONFIG } from '../constants';
import { FallingBall } from '../classes/FallingBall';

export class MultiplayerManager {
  constructor(
    playerIdRef,
    isGameMasterRef,
    gameMasterIdRef,
    ballsRef,
    otherPlayersRef,
    otherBlastsRef,
    canvas,
    setIsGameMaster
  ) {
    this.ws = null;
    this.playerIdRef = playerIdRef;
    this.isGameMasterRef = isGameMasterRef;
    this.gameMasterIdRef = gameMasterIdRef;
    this.ballsRef = ballsRef;
    this.otherPlayersRef = otherPlayersRef;
    this.otherBlastsRef = otherBlastsRef;
    this.canvas = canvas;
    this.setIsGameMaster = setIsGameMaster;
    this.syncTimeoutRef = { current: null };
  }

  connect() {
    try {
      this.ws = new WebSocket(GAME_CONFIG.MULTIPLAYER.WS_URL);

      this.ws.onopen = () => {
        console.log('Connected to multiplayer server!');

        // Request game sync
        this.send({
          type: 'request_sync',
          id: this.playerIdRef.current
        });

        // If no one responds within timeout, become game master
        this.syncTimeoutRef.current = setTimeout(() => {
          console.log('No game master found, becoming game master!');
          this.isGameMasterRef.current = true;
          this.setIsGameMaster(true);
          this.gameMasterIdRef.current = this.playerIdRef.current;

          // Announce we're the game master
          this.send({
            type: 'game_master_announce',
            id: this.playerIdRef.current
          });
        }, GAME_CONFIG.MULTIPLAYER.SYNC_TIMEOUT);
      };

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          // Ignore our own messages
          if (data.id === this.playerIdRef.current) return;

          this.handleMessage(data);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.log('WebSocket error (may be sandboxed):', err);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from multiplayer server');
      };
    } catch (err) {
      console.log('Could not connect to multiplayer (sandboxed environment)');
      // If we can't connect, become game master by default
      this.isGameMasterRef.current = true;
      this.setIsGameMaster(true);
      this.gameMasterIdRef.current = this.playerIdRef.current;
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'request_sync':
        this.handleRequestSync(data);
        break;

      case 'sync_response':
        this.handleSyncResponse(data);
        break;

      case 'game_master_announce':
        this.handleGameMasterAnnounce(data);
        break;

      case 'ball_spawn':
        this.handleBallSpawn(data);
        break;

      case 'ball_update':
        this.handleBallUpdate(data);
        break;

      case 'ball_destroy':
        this.handleBallDestroy(data);
        break;

      case 'position':
        this.handlePosition(data);
        break;

      case 'blast':
        this.handleBlast(data);
        break;

      case 'player_died':
        this.handlePlayerDied(data);
        break;
    }
  }

  handleRequestSync(data) {
    // Someone is asking for sync, if we're game master, send them the state
    if (this.isGameMasterRef.current) {
      this.send({
        type: 'sync_response',
        id: this.playerIdRef.current,
        requesterId: data.id,
        balls: this.ballsRef.current.map(ball => ball.toNetworkData()),
        gameMasterId: this.playerIdRef.current
      });
    }
  }

  handleSyncResponse(data) {
    // Only process if this sync is for us
    if (data.requesterId === this.playerIdRef.current) {
      console.log('Received game state from game master:', data.id);
      clearTimeout(this.syncTimeoutRef.current);
      this.isGameMasterRef.current = false;
      this.setIsGameMaster(false);
      this.gameMasterIdRef.current = data.gameMasterId;

      // Sync balls
      this.ballsRef.current = data.balls.map(ballData =>
        FallingBall.fromNetworkData(ballData, this.canvas)
      );
    }
  }

  handleGameMasterAnnounce(data) {
    this.gameMasterIdRef.current = data.id;
    clearTimeout(this.syncTimeoutRef.current);
  }

  handleBallSpawn(data) {
    // Only clients should process this
    if (!this.isGameMasterRef.current) {
      const ball = FallingBall.fromNetworkData(data.ball, this.canvas);
      this.ballsRef.current.push(ball);
    }
  }

  handleBallUpdate(data) {
    // Only clients should process this
    if (!this.isGameMasterRef.current) {
      data.balls.forEach(ballData => {
        const ball = this.ballsRef.current.find(b => b.id === ballData.id);
        if (ball) {
          // Smooth update - lerp towards server position
          ball.x = ball.x * 0.7 + ballData.x * 0.3;
          ball.y = ball.y * 0.7 + ballData.y * 0.3;
          ball.vx = ballData.vx;
          ball.vy = ballData.vy;
        }
      });
    }
  }

  handleBallDestroy(data) {
    // Remove ball by ID
    const index = this.ballsRef.current.findIndex(b => b.id === data.ballId);
    if (index !== -1) {
      this.ballsRef.current.splice(index, 1);
    }
  }

  handlePosition(data) {
    this.otherPlayersRef.current[data.id] = {
      x: data.x,
      y: data.y,
      hasShield: data.hasShield,
      lastUpdate: Date.now()
    };
  }

  handleBlast(data) {
    this.otherBlastsRef.current.push({
      x: data.x,
      y: data.y,
      angle: data.angle,
      radius: GAME_CONFIG.BLAST.RADIUS,
      speed: GAME_CONFIG.BLAST.SPEED,
      ownerId: data.id,
      createdAt: Date.now()
    });
  }

  handlePlayerDied(data) {
    delete this.otherPlayersRef.current[data.id];

    // If game master died, assign new game master
    if (data.id === this.gameMasterIdRef.current) {
      const remainingPlayers = Object.keys(this.otherPlayersRef.current);
      if (remainingPlayers.length > 0) {
        // Someone else becomes game master
        this.gameMasterIdRef.current = remainingPlayers[0];
      } else {
        // We become game master
        this.isGameMasterRef.current = true;
        this.setIsGameMaster(true);
        this.gameMasterIdRef.current = this.playerIdRef.current;
        console.log('Previous game master left, we are now game master!');
      }
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  broadcastPosition(x, y, hasShield) {
    this.send({
      type: 'position',
      id: this.playerIdRef.current,
      x,
      y,
      hasShield
    });
  }

  broadcastBlast(x, y, angle) {
    this.send({
      type: 'blast',
      id: this.playerIdRef.current,
      x,
      y,
      angle
    });
  }

  broadcastBallSpawn(ball) {
    this.send({
      type: 'ball_spawn',
      id: this.playerIdRef.current,
      ball: ball.toNetworkData()
    });
  }

  broadcastBallUpdate(balls) {
    this.send({
      type: 'ball_update',
      id: this.playerIdRef.current,
      balls: balls.map(ball => ({
        id: ball.id,
        x: ball.x,
        y: ball.y,
        vx: ball.vx,
        vy: ball.vy
      }))
    });
  }

  broadcastBallDestroy(ballId) {
    this.send({
      type: 'ball_destroy',
      id: this.playerIdRef.current,
      ballId
    });
  }

  broadcastPlayerDied() {
    this.send({
      type: 'player_died',
      id: this.playerIdRef.current
    });
  }

  disconnect() {
    if (this.syncTimeoutRef.current) {
      clearTimeout(this.syncTimeoutRef.current);
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
