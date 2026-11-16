// src/utils/rockAudioEngine.ts
import { LaRengaSong } from '../data/laRengaSongs';

class RockAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;
  private isPlayingRiff = false;
  private stopTimer: number | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.analyser && this.ctx) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.65;
      this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.analyser.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getOutputNode(ctx: AudioContext): AudioNode {
    return this.analyser || ctx.destination;
  }

  /**
   * Returns a normalized 0..1 real-time audio energy level when a Riff or Roar is playing.
   */
  public getAudioPulse(): number {
    if (!this.analyser || !this.timeData || !this.ctx || this.ctx.state !== 'running') {
      return this.isPlayingRiff ? 0.65 : 0;
    }
    this.analyser.getByteTimeDomainData(this.timeData);
    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const centered = (this.timeData[i] - 128) / 128;
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / this.timeData.length);
    return Math.min(1, rms * 4.2);
  }

  private makeDistortionCurve(amount = 180): Float32Array<ArrayBuffer> {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(new ArrayBuffer(nSamples * 4));
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public playPowerRiff(song: LaRengaSong) {
    try {
      const ctx = this.ensureContext();
      this.stopRiff();
      this.isPlayingRiff = true;

      const roots = [82.41, 98.0, 110.0, 123.47, 146.83];
      const hash = song.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const baseFreq = roots[hash % roots.length];
      const stepSec = Math.max(0.16, 60 / song.tempoBpm / 2);

      const pattern =
        song.energy === 'pogo'
          ? [1, 1, 1.5, 1, 1.33, 1.5, 1, 2]
          : song.energy === 'balada'
          ? [1, 1.2, 1.5, 1.33, 1, 1.5]
          : [1, 1.33, 1.5, 1.5, 1.12, 1];

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.16, now);
      master.connect(this.getOutputNode(ctx));

      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(song.energy === 'balada' ? 40 : 220);
      shaper.oversample = '4x';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2100, now);

      shaper.connect(filter);
      filter.connect(master);

      pattern.forEach((mult, idx) => {
        const start = now + idx * stepSec;
        const dur = stepSec * 0.88;
        const freq = baseFreq * mult;

        [1, 1.498, 2].forEach((harmonic, hIdx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = hIdx === 0 ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(freq * harmonic, start);

          noteGain.gain.setValueAtTime(0.001, start);
          noteGain.gain.linearRampToValueAtTime(
            hIdx === 0 ? 0.35 : 0.2,
            start + 0.015
          );
          noteGain.gain.exponentialRampToValueAtTime(0.001, start + dur);

          osc.connect(noteGain);
          noteGain.connect(shaper);

          osc.start(start);
          osc.stop(start + dur + 0.02);
        });
      });

      this.stopTimer = window.setTimeout(() => {
        this.isPlayingRiff = false;
      }, pattern.length * stepSec * 1000);
    } catch {
      // Ignore if autoplay blocked
    }
  }

  /**
   * Unleashes a massive stadium crowd roar, chant swells ("¡Olé, olé, Renga!"),
   * and sharp crowd whistles when "¡Agitar!" is pressed.
   */
  public playCrowdRoar() {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const duration = 2.8;

      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink-ish noise for warm stadium crowd body
          b0 = 0.997 * b0 + white * 0.029;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.95 * b2 + white * 0.048;
          data[i] = (b0 + b1 + b2 + white * 0.18) * 1.8;
        }
      }

      // Layer 1: Massive Crowd Vowel Formant Roar ("¡EEEEAAAAHHH!")
      const formants = [
        { freqStart: 520, freqPeak: 780, q: 2.4, gainVal: 0.28 },
        { freqStart: 1050, freqPeak: 1420, q: 3.1, gainVal: 0.22 },
        { freqStart: 280, freqPeak: 360, q: 1.5, gainVal: 0.32 },
      ];

      formants.forEach((f) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(f.freqStart, now);
        bp.frequency.linearRampToValueAtTime(f.freqPeak, now + 0.55);
        bp.frequency.exponentialRampToValueAtTime(f.freqStart * 0.9, now + duration);
        bp.Q.setValueAtTime(f.q, now);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now);
        // Rhythmic crowd chant swells ("¡O-lé, O-lé, REN-GA!")
        g.gain.linearRampToValueAtTime(f.gainVal, now + 0.22);
        g.gain.linearRampToValueAtTime(f.gainVal * 0.65, now + 0.65);
        g.gain.linearRampToValueAtTime(f.gainVal * 1.15, now + 1.05);
        g.gain.linearRampToValueAtTime(f.gainVal * 0.7, now + 1.45);
        g.gain.linearRampToValueAtTime(f.gainVal * 1.25, now + 1.85);
        g.gain.exponentialRampToValueAtTime(0.001, now + duration);

        src.connect(bp);
        bp.connect(g);
        g.connect(this.getOutputNode(ctx));
        src.start(now);
      });

      // Layer 2: Multi-Voice Stadium Chant Chorus ("¡OOOOHHH!")
      const chantTimes = [0.05, 0.52, 1.0, 1.48, 1.92];
      const chantPitches = [146.83, 164.81, 146.83, 196.0, 164.81]; // D3, E3, D3, G3, E3
      chantTimes.forEach((tOffset, idx) => {
        const basePitch = chantPitches[idx];
        [-6, -2, 0, 3, 7].forEach((detuneCents) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(basePitch, now + tOffset);
          osc.detune.setValueAtTime(detuneCents * 4, now + tOffset);

          const throatFilter = ctx.createBiquadFilter();
          throatFilter.type = 'bandpass';
          throatFilter.frequency.setValueAtTime(720, now + tOffset);
          throatFilter.Q.setValueAtTime(3.5, now + tOffset);

          const voiceGain = ctx.createGain();
          voiceGain.gain.setValueAtTime(0.001, now + tOffset);
          voiceGain.gain.linearRampToValueAtTime(0.032, now + tOffset + 0.08);
          voiceGain.gain.exponentialRampToValueAtTime(0.001, now + tOffset + 0.42);

          osc.connect(throatFilter);
          throatFilter.connect(voiceGain);
          voiceGain.connect(this.getOutputNode(ctx));

          osc.start(now + tOffset);
          osc.stop(now + tOffset + 0.44);
        });
      });

      // Layer 3: Two authentic Argentine stadium whistles ("silbidos de cancha")
      [0.18, 0.95].forEach((wStart, idx) => {
        const whistle = ctx.createOscillator();
        const wGain = ctx.createGain();
        whistle.type = 'sine';
        const f0 = idx === 0 ? 2350 : 2580;
        whistle.frequency.setValueAtTime(f0, now + wStart);
        whistle.frequency.linearRampToValueAtTime(f0 + 380, now + wStart + 0.18);
        whistle.frequency.linearRampToValueAtTime(f0 - 120, now + wStart + 0.42);

        wGain.gain.setValueAtTime(0.001, now + wStart);
        wGain.gain.linearRampToValueAtTime(0.025, now + wStart + 0.05);
        wGain.gain.exponentialRampToValueAtTime(0.0001, now + wStart + 0.45);

        whistle.connect(wGain);
        wGain.connect(this.getOutputNode(ctx));
        whistle.start(now + wStart);
        whistle.stop(now + wStart + 0.46);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public stopRiff() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    this.isPlayingRiff = false;
  }
}

export const rockAudio = new RockAudioEngine();
