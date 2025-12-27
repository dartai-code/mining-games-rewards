// Sound Manager for Match-3 Game

class SoundManager {
  private enabled: boolean = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  }

  click() {
    this.playTone(800, 0.05, 'square', 0.1);
  }

  swap() {
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(500, 0.1, 'sine', 0.2), 50);
  }

  match() {
    this.playTone(523, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 50);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 100);
  }

  block() {
    this.playTone(200, 0.15, 'triangle', 0.3);
    setTimeout(() => this.playTone(150, 0.1, 'triangle', 0.2), 50);
  }

  bomb() {
    this.playTone(150, 0.3, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(100, 0.2, 'sawtooth', 0.3), 100);
    setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.2), 200);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 100);
    });
  }

  lose() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 150);
    });
  }

  cascade() {
    this.playTone(600 + Math.random() * 200, 0.1, 'sine', 0.2);
  }
}

export const soundManager = new SoundManager();
