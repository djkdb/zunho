import type { SfxId } from '../game/types';

/**
 * Every sound in the game is synthesised at runtime with the Web Audio API —
 * no external audio files, so there are no licensing questions and nothing to download.
 *
 * Browsers block audio until a user gesture: `unlock()` must be called from
 * a pointer/keyboard handler; until then every call is a silent no-op.
 */

type OscType = OscillatorType;

interface ToneOptions {
  type?: OscType;
  freq: number;
  freqEnd?: number;
  start?: number;
  dur: number;
  gain: number;
  attack?: number;
  filter?: { type: BiquadFilterType; freq: number; q?: number };
  detune?: number;
  destination?: AudioNode;
}

interface NoiseOptions {
  start?: number;
  dur: number;
  gain: number;
  attack?: number;
  filter: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number };
  destination?: AudioNode;
}

const MIN_GAIN = 0.0001;
const HOVER_THROTTLE_MS = 70;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private brownBuffer: AudioBuffer | null = null;
  private ambienceNodes: AudioScheduledSourceNode[] = [];
  private ambienceTimers: number[] = [];
  private ambienceWanted = false;
  private enabled = true;
  private volume = 0.8;
  private lastHover = 0;
  private failed = false;

  get isReady(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.failed) return;
    try {
      if (!this.ctx) this.build();
      if (this.ctx && this.ctx.state === 'suspended' && this.enabled) void this.ctx.resume();
      if (this.ambienceWanted) this.startAmbience();
    } catch (error) {
      // Audio is optional: the game stays fully playable without it.
      this.failed = true;
      console.warn('[the-last-room] audio unavailable', error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(enabled ? this.volume : 0, now, 0.08);
    if (enabled && ctx.state === 'suspended') void ctx.resume();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.master && this.enabled) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  private build(): void {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio API not supported');
    const ctx = new Ctor();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    const master = ctx.createGain();
    master.gain.value = this.enabled ? this.volume : 0;
    const sfx = ctx.createGain();
    sfx.gain.value = 0.9;
    const ambience = ctx.createGain();
    ambience.gain.value = 0;
    sfx.connect(master);
    ambience.connect(master);
    master.connect(compressor).connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.sfxBus = sfx;
    this.ambienceBus = ambience;
    this.noiseBuffer = this.makeNoise(ctx, 'white');
    this.brownBuffer = this.makeNoise(ctx, 'brown');
  }

  private makeNoise(ctx: AudioContext, color: 'white' | 'brown'): AudioBuffer {
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') data[i] = white;
      else {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buffer;
  }

  /* ---------------------------------------------------------------- */
  /* Primitives                                                        */
  /* ---------------------------------------------------------------- */

  private tone(o: ToneOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const t0 = ctx.currentTime + (o.start ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), t0 + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const gain = ctx.createGain();
    const attack = o.attack ?? 0.005;
    gain.gain.setValueAtTime(MIN_GAIN, t0);
    gain.gain.exponentialRampToValueAtTime(o.gain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t0 + o.dur);
    let node: AudioNode = osc;
    if (o.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = o.filter.type;
      filter.frequency.value = o.filter.freq;
      filter.Q.value = o.filter.q ?? 0.7;
      node.connect(filter);
      node = filter;
    }
    node.connect(gain).connect(o.destination ?? this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
    osc.onended = () => gain.disconnect();
  }

  private noise(o: NoiseOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || !this.noiseBuffer) return;
    const t0 = ctx.currentTime + (o.start ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filter.type;
    filter.frequency.setValueAtTime(o.filter.freq, t0);
    if (o.filter.freqEnd) filter.frequency.exponentialRampToValueAtTime(o.filter.freqEnd, t0 + o.dur);
    filter.Q.value = o.filter.q ?? 0.8;
    const gain = ctx.createGain();
    const attack = o.attack ?? 0.004;
    gain.gain.setValueAtTime(MIN_GAIN, t0);
    gain.gain.exponentialRampToValueAtTime(o.gain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t0 + o.dur);
    src.connect(filter).connect(gain).connect(o.destination ?? this.sfxBus);
    src.start(t0, Math.random() * 2);
    src.stop(t0 + o.dur + 0.05);
    src.onended = () => gain.disconnect();
  }

  private click(start = 0, gain = 0.25, freq = 3200): void {
    this.noise({ start, dur: 0.025, gain, filter: { type: 'highpass', freq } });
    this.tone({ start, freq: freq * 0.8, dur: 0.03, gain: gain * 0.3, type: 'square', filter: { type: 'bandpass', freq } });
  }

  private thunk(start = 0, gain = 0.5, freq = 110): void {
    this.tone({ start, freq, freqEnd: freq * 0.55, dur: 0.22, gain });
    this.noise({ start, dur: 0.12, gain: gain * 0.5, filter: { type: 'lowpass', freq: 500 } });
  }

  private bell(freq: number, start = 0, gain = 0.15, dur = 1.6): void {
    this.tone({ start, freq, dur, gain, attack: 0.004 });
    this.tone({ start, freq: freq * 2.01, dur: dur * 0.6, gain: gain * 0.35 });
    this.tone({ start, freq: freq * 3.02, dur: dur * 0.35, gain: gain * 0.15 });
  }

  /* ---------------------------------------------------------------- */
  /* Sound effects                                                     */
  /* ---------------------------------------------------------------- */

  play(id: SfxId): void {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    try {
      this.playUnsafe(id);
    } catch (error) {
      console.warn('[the-last-room] sfx failed', id, error);
    }
  }

  private playUnsafe(id: SfxId): void {
    switch (id) {
      case 'uiClick':
        this.tone({ freq: 1400, freqEnd: 700, dur: 0.06, gain: 0.07, type: 'triangle' });
        break;
      case 'uiHover': {
        const now = performance.now();
        if (now - this.lastHover < HOVER_THROTTLE_MS) return;
        this.lastHover = now;
        this.tone({ freq: 2600, dur: 0.03, gain: 0.018 });
        break;
      }
      case 'objectClick':
        this.tone({ freq: 190, freqEnd: 120, dur: 0.12, gain: 0.22 });
        this.noise({ dur: 0.06, gain: 0.12, filter: { type: 'bandpass', freq: 1300, q: 2 } });
        break;
      case 'drawerOpen':
        this.noise({ dur: 0.5, gain: 0.22, attack: 0.08, filter: { type: 'bandpass', freq: 420, freqEnd: 950, q: 1.6 } });
        this.noise({ dur: 0.45, gain: 0.05, attack: 0.1, filter: { type: 'highpass', freq: 3000 } });
        this.thunk(0.48, 0.35, 95);
        break;
      case 'locked':
        [0, 0.07, 0.15].forEach((t, i) => this.click(t, 0.18 - i * 0.03, 2600));
        this.thunk(0.02, 0.15, 150);
        break;
      case 'unlock':
        this.click(0, 0.25, 3500);
        this.thunk(0.08, 0.4, 150);
        this.bell(1800, 0.1, 0.05, 0.5);
        this.bell(2710, 0.12, 0.03, 0.4);
        break;
      case 'bolt':
        this.noise({ start: 0.05, dur: 0.35, gain: 0.2, attack: 0.05, filter: { type: 'lowpass', freq: 600, freqEnd: 1400 } });
        this.thunk(0.38, 0.55, 80);
        this.click(0.38, 0.2, 2200);
        break;
      case 'error':
        this.tone({ freq: 110, dur: 0.28, gain: 0.12, type: 'sawtooth', filter: { type: 'lowpass', freq: 700 } });
        this.tone({ freq: 117, dur: 0.28, gain: 0.12, type: 'sawtooth', filter: { type: 'lowpass', freq: 700 } });
        this.thunk(0, 0.25, 70);
        break;
      case 'pickup':
        this.bell(880, 0, 0.1, 1.1);
        this.bell(1320, 0.08, 0.08, 1.2);
        this.noise({ dur: 0.3, gain: 0.03, attack: 0.1, filter: { type: 'highpass', freq: 6000 } });
        break;
      case 'safeOpen':
        this.thunk(0, 0.8, 58);
        this.noise({ dur: 0.4, gain: 0.3, filter: { type: 'lowpass', freq: 380 } });
        this.bell(420, 0.02, 0.08, 2.2);
        this.bell(633, 0.03, 0.05, 1.8);
        this.noise({ start: 0.1, dur: 1.2, gain: 0.08, attack: 0.05, filter: { type: 'highpass', freq: 2500 } });
        break;
      case 'doorOpen': {
        const ctx = this.ctx!;
        const t0 = ctx.currentTime;
        // Creak: a buzzing sawtooth wobbling through a resonant band.
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, t0);
        osc.frequency.linearRampToValueAtTime(125, t0 + 1.9);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 9;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 14;
        lfo.connect(lfoGain).connect(osc.frequency);
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = 950;
        band.Q.value = 7;
        const g = ctx.createGain();
        g.gain.setValueAtTime(MIN_GAIN, t0);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.25);
        g.gain.setValueAtTime(0.16, t0 + 1.4);
        g.gain.exponentialRampToValueAtTime(MIN_GAIN, t0 + 2.1);
        osc.connect(band).connect(g).connect(this.sfxBus!);
        osc.start(t0);
        lfo.start(t0);
        osc.stop(t0 + 2.2);
        lfo.stop(t0 + 2.2);
        osc.onended = () => g.disconnect();
        // Air rushing in.
        this.noise({ start: 0.4, dur: 3.2, gain: 0.2, attack: 1.4, filter: { type: 'lowpass', freq: 250, freqEnd: 2600 } });
        break;
      }
      case 'success':
        [220, 277.18, 329.63, 440, 554.37].forEach((f, i) =>
          this.tone({
            start: i * 0.09,
            freq: f,
            dur: 2.2,
            gain: 0.07,
            attack: 0.02,
            type: 'triangle',
            filter: { type: 'lowpass', freq: 2400 },
          }),
        );
        break;
      case 'discovery':
        this.noise({ dur: 0.9, gain: 0.07, attack: 0.7, filter: { type: 'bandpass', freq: 2600, freqEnd: 5200, q: 3 } });
        this.tone({ start: 0.55, freq: 659.25, dur: 2.2, gain: 0.07, attack: 0.03 });
        this.tone({ start: 0.62, freq: 987.77, dur: 2.2, gain: 0.05, attack: 0.03 });
        this.tone({ start: 0.7, freq: 1318.5, dur: 1.8, gain: 0.03, attack: 0.03, detune: 6 });
        this.tone({ start: 0.55, freq: 82.4, dur: 2.4, gain: 0.12, attack: 0.1 });
        break;
      case 'pageTurn':
      case 'paper':
        this.noise({
          dur: id === 'paper' ? 0.16 : 0.24,
          gain: 0.14,
          attack: 0.05,
          filter: { type: 'bandpass', freq: 1800, freqEnd: 4200, q: 0.9 },
        });
        break;
      case 'bookSlide':
        this.noise({ dur: 0.28, gain: 0.16, attack: 0.04, filter: { type: 'lowpass', freq: 700, freqEnd: 1200 } });
        this.thunk(0.25, 0.18, 130);
        break;
      case 'bookReset':
        [0, 0.07, 0.13, 0.2].forEach((t) => this.thunk(0.25 + t, 0.22, 100 + Math.random() * 30));
        break;
      case 'keypad':
        this.tone({ freq: 1250, dur: 0.07, gain: 0.05, type: 'square', filter: { type: 'lowpass', freq: 3000 } });
        this.click(0, 0.08, 4000);
        break;
      case 'clockTick':
        this.click(0, 0.12, 4200);
        this.tone({ freq: 2900, dur: 0.035, gain: 0.03 });
        break;
      case 'clockChime':
        this.bell(659.25, 0, 0.12, 2.8);
        this.bell(523.25, 0.55, 0.1, 2.8);
        this.bell(587.33, 1.1, 0.09, 2.8);
        this.bell(392, 1.65, 0.12, 3.5);
        break;
      case 'lampClick':
        this.click(0, 0.2, 2400);
        this.click(0.04, 0.12, 1800);
        this.tone({ start: 0.04, freq: 60, dur: 0.5, gain: 0.03, type: 'sawtooth', filter: { type: 'lowpass', freq: 200 } });
        break;
      case 'combine':
        this.noise({ dur: 0.2, gain: 0.12, filter: { type: 'bandpass', freq: 2200, q: 1 } });
        this.bell(740, 0.15, 0.08, 1.2);
        this.bell(1108.7, 0.25, 0.06, 1.2);
        break;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Ambience                                                          */
  /* ---------------------------------------------------------------- */

  /** Room tone + rain behind the boards + a low drone. */
  startAmbience(): void {
    this.ambienceWanted = true;
    const ctx = this.ctx;
    if (!ctx || !this.ambienceBus || !this.brownBuffer || !this.noiseBuffer) return;
    if (this.ambienceNodes.length > 0) return;
    const now = ctx.currentTime;

    const room = ctx.createBufferSource();
    room.buffer = this.brownBuffer;
    room.loop = true;
    const roomFilter = ctx.createBiquadFilter();
    roomFilter.type = 'lowpass';
    roomFilter.frequency.value = 320;
    const roomGain = ctx.createGain();
    roomGain.gain.value = 0.22;
    room.connect(roomFilter).connect(roomGain).connect(this.ambienceBus);

    const rain = ctx.createBufferSource();
    rain.buffer = this.noiseBuffer;
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1800;
    rainFilter.Q.value = 0.5;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.035;
    const rainLfo = ctx.createOscillator();
    rainLfo.frequency.value = 0.07;
    const rainLfoGain = ctx.createGain();
    rainLfoGain.gain.value = 0.015;
    rainLfo.connect(rainLfoGain).connect(rainGain.gain);
    rain.connect(rainFilter).connect(rainGain).connect(this.ambienceBus);

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 400;
    droneFilter.connect(droneGain).connect(this.ambienceBus);
    const drones = [55, 82.41, 110.3].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 5;
      osc.connect(droneFilter);
      return osc;
    });
    const droneLfo = ctx.createOscillator();
    droneLfo.frequency.value = 0.05;
    const droneLfoGain = ctx.createGain();
    droneLfoGain.gain.value = 0.025;
    droneLfo.connect(droneLfoGain).connect(droneGain.gain);

    const sources: AudioScheduledSourceNode[] = [room, rain, rainLfo, droneLfo, ...drones];
    for (const s of sources) s.start(now);
    this.ambienceNodes = sources;
    this.ambienceBus.gain.cancelScheduledValues(now);
    this.ambienceBus.gain.setValueAtTime(this.ambienceBus.gain.value, now);
    this.ambienceBus.gain.linearRampToValueAtTime(0.9, now + 3);
    this.scheduleCreak();
  }

  /** Rare distant creaks keep the room from feeling like a loop. */
  private scheduleCreak(): void {
    const delay = 14000 + Math.random() * 22000;
    const id = window.setTimeout(() => {
      this.ambienceTimers = this.ambienceTimers.filter((t) => t !== id);
      if (!this.ambienceWanted) return;
      if (this.ctx && this.enabled && this.ctx.state === 'running' && this.ambienceBus) {
        this.tone({
          freq: 180 + Math.random() * 90,
          freqEnd: 140,
          dur: 0.9,
          gain: 0.018,
          attack: 0.3,
          type: 'sawtooth',
          filter: { type: 'bandpass', freq: 700, q: 9 },
          destination: this.ambienceBus,
        });
      }
      this.scheduleCreak();
    }, delay);
    this.ambienceTimers.push(id);
  }

  stopAmbience(fadeSeconds = 1.5): void {
    this.ambienceWanted = false;
    for (const t of this.ambienceTimers) window.clearTimeout(t);
    this.ambienceTimers = [];
    const ctx = this.ctx;
    if (!ctx || !this.ambienceBus) return;
    const now = ctx.currentTime;
    this.ambienceBus.gain.cancelScheduledValues(now);
    this.ambienceBus.gain.setValueAtTime(this.ambienceBus.gain.value, now);
    this.ambienceBus.gain.linearRampToValueAtTime(0, now + fadeSeconds);
    const nodes = this.ambienceNodes;
    this.ambienceNodes = [];
    for (const n of nodes) {
      try {
        n.stop(now + fadeSeconds + 0.1);
      } catch {
        /* already stopped */
      }
    }
  }

  /** Sustained warm pad for the ending screen. Returns a stop function. */
  playPad(notes: number[] = [220, 277.18, 329.63, 415.3], seconds = 10): () => void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || !this.enabled) return () => undefined;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(MIN_GAIN, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 2.5);
    gain.gain.setValueAtTime(0.06, now + seconds - 3);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, now + seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    filter.connect(gain).connect(this.sfxBus);
    const oscs = notes.flatMap((f) =>
      [-6, 6].map((detune) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(filter);
        o.start(now);
        o.stop(now + seconds + 0.1);
        return o;
      }),
    );
    oscs[0]!.onended = () => gain.disconnect();
    return () => {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.6);
      for (const o of oscs) {
        try {
          o.stop(t + 0.7);
        } catch {
          /* already stopped */
        }
      }
    };
  }

  dispose(): void {
    this.stopAmbience(0);
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const audio = new AudioEngine();
