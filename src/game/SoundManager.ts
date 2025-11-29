// Simple Audio Synth based on ZzFX (micro-version)
// We use a singleton pattern to manage the AudioContext

class SoundManager {
    private ctx: AudioContext | null = null;
    private enabled: boolean = false;

    constructor() {
        // Init on first user interaction usually, but we prepare here
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.enabled = true;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Simple beep/noise generator
    // type: 'sine', 'square', 'sawtooth', 'triangle', 'noise'
    playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
        if (!this.ctx || !this.enabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration: number, vol: number = 0.1) {
        if (!this.ctx || !this.enabled) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // SFX Presets
    playShoot() {
        // Pew: High pitch sliding down
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        // Boom: Noise + Low Sine
        this.playNoise(0.3, 0.2);
        this.playTone(50, 'sawtooth', 0.3, 0.2);
    }

    playHit() {
        // Tick: Short high noise
        this.playNoise(0.05, 0.1);
    }

    playLevelUp() {
        // Powerup: Arpeggio
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.1);
        });
    }

    playGameOver() {
        // Sad: Descending slide
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 1.0);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }
}

export const soundManager = new SoundManager();
