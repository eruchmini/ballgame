/**
 * Bug class - A crawling bug that moves across the screen
 * Has a 10% chance to snatch the player and drag them off-screen
 */
export class Bug {
  constructor(canvas, fromLeft = true) {
    this.radius = 25;
    this.bodyLength = 60;
    this.speed = 2;

    // Start from either left or right side
    if (fromLeft) {
      this.x = -this.bodyLength;
      this.direction = 1; // Moving right
    } else {
      this.x = canvas.width + this.bodyLength;
      this.direction = -1; // Moving left
    }

    // Crawl along the bottom of the screen
    this.y = canvas.height - 40;

    // State for when the bug grabs a player
    this.hasGrabbedPlayer = false;
    this.grabbedPlayer = null;
    this.grabStartTime = null;
    this.snatchRollCompleted = false;

    // Animation properties
    this.legPhase = 0;
    this.legSpeed = 0.2;

    // Visual properties
    this.color = '#2d1b00'; // Dark brown
    this.eyeColor = '#ff0000'; // Red eyes
  }

  update(canvas, playerRef) {
    // If we've grabbed a player, drag them off-screen
    if (this.hasGrabbedPlayer && this.grabbedPlayer) {
      // Move the bug and the player together
      this.x += this.speed * this.direction * 1.5; // Move faster when carrying
      this.grabbedPlayer.x = this.x;
      this.grabbedPlayer.y = this.y;

      return;
    }

    // Normal crawling behavior
    this.x += this.speed * this.direction;

    // Animate legs
    this.legPhase += this.legSpeed;

    // Check for collision with player if we haven't rolled yet
    if (!this.snatchRollCompleted && playerRef && playerRef.current) {
      const player = playerRef.current;
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If we're close enough to the player
      if (distance < this.radius + player.radius) {
        this.snatchRollCompleted = true;

        // 10% chance to grab the player!
        if (Math.random() < 0.1) {
          this.hasGrabbedPlayer = true;
          this.grabbedPlayer = player;
          this.grabStartTime = Date.now();
          console.log('🐛 BUG SNATCHED THE PLAYER!');
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw bug body
    ctx.fillStyle = this.color;

    // Main body (oval)
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.bodyLength / 2, this.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (circle)
    const headX = this.x + (this.bodyLength / 2 + 15) * this.direction;
    ctx.beginPath();
    ctx.arc(headX, this.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = this.eyeColor;
    const eyeOffset = 8;
    const eyeY = this.y - 5;
    ctx.beginPath();
    ctx.arc(headX + eyeOffset * this.direction, eyeY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + eyeOffset * this.direction, eyeY + 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, this.y - 15);
    ctx.lineTo(headX + 10 * this.direction, this.y - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headX, this.y - 15);
    ctx.lineTo(headX + 15 * this.direction, this.y - 28);
    ctx.stroke();

    // Draw legs (6 legs, 3 on each side)
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    const legCount = 3;
    for (let i = 0; i < legCount; i++) {
      const legX = this.x - this.bodyLength / 4 + (i * this.bodyLength / 4);
      const legOffset = Math.sin(this.legPhase + i * Math.PI / 3) * 10;

      // Top legs
      ctx.beginPath();
      ctx.moveTo(legX, this.y - this.radius);
      ctx.lineTo(legX, this.y - this.radius - 20 - legOffset);
      ctx.stroke();

      // Bottom legs
      ctx.beginPath();
      ctx.moveTo(legX, this.y + this.radius);
      ctx.lineTo(legX, this.y + this.radius + 20 + legOffset);
      ctx.stroke();
    }

    // If we've grabbed the player, show some indication
    if (this.hasGrabbedPlayer) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.bodyLength, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  isOffScreen(canvas) {
    // Check if the bug has crawled off the screen
    if (this.direction > 0) {
      return this.x - this.bodyLength > canvas.width + 100;
    } else {
      return this.x + this.bodyLength < -100;
    }
  }

  collidesWith(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.radius + entity.radius);
  }
}
