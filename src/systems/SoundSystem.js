export class SoundSystem {
  constructor({ enabled = false } = {}) {
    this.enabled = false;
    this.context = null;
    this.master = null;
    this.rumbleSource = null;
    this.rumbleGain = null;
    if (enabled) this.enabled = true;
  }

  ensureContext() {
    if (this.context) {
      if (this.context.state === 'suspended' && this.enabled) this.context.resume();
      return this.context;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.context.destination);
    return this.context;
  }

  async setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.enabled) {
      this.ensureContext();
      await this.context?.resume?.();
    } else {
      this.stopRumble();
    }
    return this.enabled;
  }

  beep({ frequency = 640, duration = 0.12, gain = 0.12, type = 'sine' } = {}) {
    if (!this.enabled) return;
    const context = this.ensureContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(gain, context.currentTime + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  startRumble() {
    if (!this.enabled) return;
    const context = this.ensureContext();
    if (!context || this.rumbleSource) return;
    const seconds = 2;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.96 + white * 0.04;
      data[i] = last * 4 + white * 0.14;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 115;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, context.currentTime + 1.5);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    this.rumbleSource = source;
    this.rumbleGain = gain;
  }

  stopRumble() {
    if (!this.context || !this.rumbleSource) return;
    const now = this.context.currentTime;
    try {
      this.rumbleGain.gain.cancelScheduledValues(now);
      this.rumbleGain.gain.setValueAtTime(this.rumbleGain.gain.value, now);
      this.rumbleGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      this.rumbleSource.stop(now + 0.9);
    } catch {
      // The source may already be stopped.
    }
    this.rumbleSource = null;
    this.rumbleGain = null;
  }

  chime() {
    if (!this.enabled) return;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      setTimeout(() => this.beep({ frequency, duration: 0.55, gain: 0.09, type: 'sine' }), index * 160);
    });
  }

  dispose() {
    this.stopRumble();
    this.context?.close?.();
    this.context = null;
  }
}
