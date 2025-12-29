// Audio system for game sounds and music

export class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.backgroundMusicRef = { current: null };
    this.bossMusicRef = { current: null };
    this.currentSongRef = { current: 0 };
    this.enabled = true;
  }

  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
      this.stopBossMusic();
    }
  }

  // ============ Sound Effects ============

  playShootSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  playExplosionSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  playShieldSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  playHitSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  playGameOverSound() {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  playGameOverMelody() {
    if (!this.enabled || !this.audioContext) return;

    const playNote = (frequency, startTime, duration, volume = 0.1) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = this.audioContext.currentTime;
    const beatDuration = 0.5;

    const melody = [
      523, 659, 784, 659,
      523, 659, 784, 880,
      784, 659, 523, 392,
      440, 523, 587, 523,

      523, 659, 784, 659,
      523, 659, 784, 880,
      880, 784, 659, 523,
      392, 330, 262, 196
    ];

    melody.forEach((freq, i) => {
      playNote(freq, now + i * beatDuration, beatDuration * 1.5, 0.08);
    });
  }

  // ============ Background Music ============

  startBackgroundMusic(gameOver) {
    if (!this.enabled || this.backgroundMusicRef.current || !this.audioContext) return;

    const playNote = (frequency, startTime, duration) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playMusicLoop = () => {
      if (!this.enabled || gameOver()) return;

      const now = this.audioContext.currentTime;
      const beatDuration = 0.15;

      const melodies = [
        [
          523, 659, 523, 784, 659, 523, 880, 784,
          659, 784, 659, 880, 784, 659, 1047, 880,
          784, 659, 784, 880, 659, 784, 659, 523,
          587, 659, 698, 784, 880, 784, 659, 523
        ],
        [
          392, 392, 523, 494, 440, 440, 587, 523,
          494, 523, 587, 659, 698, 659, 587, 523,
          659, 698, 784, 880, 784, 698, 659, 587,
          523, 587, 659, 698, 784, 698, 659, 523
        ],
        [
          330, 392, 494, 523, 659, 784, 880, 1047,
          1047, 880, 784, 659, 523, 494, 392, 330,
          659, 523, 659, 784, 880, 1047, 880, 784,
          659, 784, 523, 659, 523, 392, 330, 262
        ]
      ];

      let selectedSong;
      if (Math.random() < 0.1) {
        selectedSong = 2;
      } else {
        selectedSong = this.currentSongRef.current;
        this.currentSongRef.current = (this.currentSongRef.current + 1) % 2;
      }

      const melody = melodies[selectedSong];

      melody.forEach((freq, i) => {
        playNote(freq, now + i * beatDuration, beatDuration * 0.9);
      });

      this.backgroundMusicRef.current = setTimeout(playMusicLoop, melody.length * beatDuration * 1000);
    };

    playMusicLoop();
  }

  stopBackgroundMusic() {
    if (this.backgroundMusicRef.current) {
      clearTimeout(this.backgroundMusicRef.current);
      this.backgroundMusicRef.current = null;
    }
  }

  // ============ Boss Music ============

  startBossMusic(gameOver) {
    if (!this.enabled || this.bossMusicRef.current || !this.audioContext) return;

    const playNote = (frequency, startTime, duration, volume = 0.12) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playBass = (frequency, startTime, duration) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playBossMusicLoop = () => {
      if (!this.enabled || gameOver()) return;

      const now = this.audioContext.currentTime;
      const beatDuration = 0.08;

      const melody = [
        330, 330, 440, 330, 523, 494, 440, 330,
        330, 330, 440, 330, 587, 523, 494, 440,
        392, 392, 494, 392, 587, 523, 494, 392,
        330, 392, 440, 494, 523, 587, 659, 698,

        698, 784, 880, 784, 698, 659, 587, 523,
        523, 587, 659, 698, 784, 880, 988, 1047,
        1047, 988, 880, 784, 698, 659, 587, 523,
        494, 523, 587, 659, 698, 784, 880, 988,

        988, 880, 784, 698, 587, 523, 440, 392,
        392, 330, 294, 262, 220, 196, 165, 147,
        330, 392, 440, 523, 587, 659, 784, 880,
        880, 784, 659, 587, 523, 440, 392, 330
      ];

      const bassLine = [
        165, 165, 165, 165, 196, 196, 196, 196,
        220, 220, 220, 220, 262, 262, 262, 262
      ];

      melody.forEach((freq, i) => {
        playNote(freq, now + i * beatDuration, beatDuration * 0.9, 0.13);
      });

      bassLine.forEach((freq, i) => {
        const bassTime = now + (i * 8) * beatDuration;
        playBass(freq, bassTime, beatDuration * 8);
      });

      this.bossMusicRef.current = setTimeout(playBossMusicLoop, melody.length * beatDuration * 1000);
    };

    playBossMusicLoop();
  }

  stopBossMusic() {
    if (this.bossMusicRef.current) {
      clearTimeout(this.bossMusicRef.current);
      this.bossMusicRef.current = null;
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
