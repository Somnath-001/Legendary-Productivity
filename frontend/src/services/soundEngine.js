class SoundEngine {
    constructor() {
        this.ctx = null;
        this.volume = 0.5;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 1) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Mechanical "Click" for checkboxes
    playLock() {
        this.playTone(800, 'square', 0.05, 0.2);
        setTimeout(() => this.playTone(1200, 'square', 0.03, 0.1), 50);
    }

    // High-tech "Inject" for protein
    playInject() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    // Heavy Bass for Mission Complete
    playMissionComplete() {
        this.init();
        // Deep bass
        this.playTone(50, 'sine', 1.0, 0.8);
        this.playTone(100, 'square', 0.5, 0.3);

        // High harmonic chirp
        setTimeout(() => this.playTone(1200, 'sine', 0.5, 0.2), 100);
    }

    // Alarm for Panic
    playPanic() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.5);
        osc.frequency.linearRampToValueAtTime(800, now + 1.0);

        gain.gain.value = 0.3;

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 1.0);
    }

    // UI Select / Tab Switch
    playClick() {
        this.playTone(1500, 'sine', 0.05, 0.1);
    }

    // System Failure Noise
    playGlitch() {
        this.init();
        const count = 5;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.playTone(100 + Math.random() * 1000, 'sawtooth', 0.05, 0.3);
            }, i * 50);
        }
    }
}

export const soundEngine = new SoundEngine();
