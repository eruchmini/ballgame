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

      // BUG: Sometimes duplicate all the balls!
      if (Math.random() < 0.3) {
        this.ballsRef.current = [...this.ballsRef.current, ...data.balls.map(ballData =>
          FallingBall.fromNetworkData(ballData, this.canvas)
        )];
      } else {
        // Sync balls
        this.ballsRef.current = data.balls.map(ballData =>
          FallingBall.fromNetworkData(ballData, this.canvas)
        );
      }
    }
  }

  handleGameMasterAnnounce(data) {
    this.gameMasterIdRef.current = data.id;
    clearTimeout(this.syncTimeoutRef.current);

    // If we're currently game master but someone else announced, resolve conflict
    if (this.isGameMasterRef.current && data.id !== this.playerIdRef.current) {
      // Use player ID comparison to deterministically resolve conflicts
      // Lower ID wins to ensure consistent game master across all clients
      if (this.playerIdRef.current > data.id) {
        console.log('Stepping down as game master, player', data.id, 'has priority');
        this.isGameMasterRef.current = false;
        this.setIsGameMaster(false);

        // Clear our local balls since the other game master is authoritative
        this.ballsRef.current = [];
      }
    }
  }

  handleBallSpawn(data) {
    // BUG: Sometimes game master also processes spawn, creating duplicates!
    if (!this.isGameMasterRef.current || Math.random() < 0.2) {
      const ball = FallingBall.fromNetworkData(data.ball, this.canvas);
      this.ballsRef.current.push(ball);

      // BUG: Sometimes spawn the ball multiple times
      if (Math.random() < 0.15) {
        this.ballsRef.current.push(FallingBall.fromNetworkData(data.ball, this.canvas));
      }
    }
  }

  handleBallUpdate(data) {
    // Only clients should process this
    if (!this.isGameMasterRef.current) {
      data.balls.forEach(ballData => {
        const ball = this.ballsRef.current.find(b => b.id === ballData.id);
        if (ball) {
          // Store server position as target for smooth interpolation
          if (!ball.serverX) {
            // First update - initialize
            ball.serverX = ballData.x;
            ball.serverY = ballData.y;
            ball.x = ballData.x;
            ball.y = ballData.y;
          } else {
            // BUG: Sometimes use wrong coordinates
            if (Math.random() < 0.2) {
              ball.serverX = ballData.y; // Swapped!
              ball.serverY = ballData.x;
            } else {
              // Update target position
              ball.serverX = ballData.x;
              ball.serverY = ballData.y;
            }
          }

          // BUG: Velocities sometimes get multiplied randomly
          ball.vx = ballData.vx * (Math.random() < 0.1 ? Math.random() * 3 : 1);
          ball.vy = ballData.vy * (Math.random() < 0.1 ? Math.random() * 3 : 1);

          // Store timestamp for interpolation
          ball.lastServerUpdate = Date.now();
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
    const existing = this.otherPlayersRef.current[data.id];

    // BUG: Sometimes positions are offset or scaled incorrectly
    const buggyX = Math.random() < 0.1 ? data.x * Math.random() * 2 : data.x;
    const buggyY = Math.random() < 0.1 ? data.y * Math.random() * 2 : data.y;

    // If player doesn't exist yet, initialize with direct position
    if (!existing) {
      this.otherPlayersRef.current[data.id] = {
        x: buggyX,
        y: buggyY,
        targetX: buggyX,
        targetY: buggyY,
        // BUG: Shield state sometimes inverted
        hasShield: Math.random() < 0.1 ? !data.hasShield : data.hasShield,
        lastUpdate: Date.now()
      };
    } else {
      // Update target position for interpolation
      this.otherPlayersRef.current[data.id] = {
        ...existing,
        targetX: buggyX,
        targetY: buggyY,
        hasShield: Math.random() < 0.1 ? !data.hasShield : data.hasShield,
        lastUpdate: Date.now()
      };
    }
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
    // BUG: Sometimes send wrong position data
    const buggyX = Math.random() < 0.05 ? x + (Math.random() - 0.5) * 100 : x;
    const buggyY = Math.random() < 0.05 ? y + (Math.random() - 0.5) * 100 : y;

    this.send({
      type: 'position',
      id: this.playerIdRef.current,
      x: buggyX,
      y: buggyY,
      hasShield
    });
  }

  broadcastBlast(x, y, angle) {
    // BUG: Sometimes send blast with random angle
    const buggyAngle = Math.random() < 0.2 ? Math.random() * Math.PI * 2 : angle;

    this.send({
      type: 'blast',
      id: this.playerIdRef.current,
      x,
      y,
      angle: buggyAngle
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
