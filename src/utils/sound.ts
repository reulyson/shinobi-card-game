import { ArenaId } from '../types/game';
import { getNinjaLevelUpQuote } from '../data/voiceLines';

export interface AudioSettings {
  muted: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  musicEnabled: boolean;
  voiceEnabled: boolean;
}

const STORAGE_AUDIO_KEY = 'shinobi_chronicles_audio_v1';

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  masterVolume: 0.85,
  sfxVolume: 0.85,
  musicVolume: 0.42,
  voiceVolume: 0.9,
  musicEnabled: true,
  voiceEnabled: true,
};

interface ArenaMusicProfile {
  stepMs: number;
  scaleHz: number[];
  melodyPattern: number[];
  bassHz: number;
  padHz: number[];
  taikoSteps: number[];
  rimSteps: number[];
  wave: OscillatorType;
  fluteChance: number;
}

const ARENA_MUSIC_PROFILES: Record<ArenaId, ArenaMusicProfile> = {
  // Vale do Fim: dramático, escala Hirajoshi em Ré, koto solene + taiko profundo
  vale_do_fim: {
    stepMs: 340,
    scaleHz: [146.83, 155.56, 196.0, 220.0, 261.63, 293.66, 311.13, 392.0],
    melodyPattern: [0, -1, 3, 2, 5, -1, 4, 2, 1, -1, 3, 5, 6, -1, 4, 0],
    bassHz: 73.42,
    padHz: [146.83, 220.0],
    taikoSteps: [0, 6, 8, 12],
    rimSteps: [4, 14],
    wave: 'triangle',
    fluteChance: 0.35,
  },
  // Floresta da Morte: tenso, sombrio, flauta noturna e pulsação furtiva
  floresta_da_morte: {
    stepMs: 390,
    scaleHz: [185.0, 196.0, 246.94, 277.18, 293.66, 369.99, 392.0],
    melodyPattern: [0, -1, -1, 2, 1, -1, 4, -1, 3, -1, 1, -1, 5, -1, 2, -1],
    bassHz: 92.5,
    padHz: [185.0, 277.18],
    taikoSteps: [0, 10],
    rimSteps: [3, 7, 11, 15],
    wave: 'sine',
    fluteChance: 0.55,
  },
  // Arena dos Exames Chunin: ritmo acelerado de duelo e percussão marcial
  arena_chunin: {
    stepMs: 255,
    scaleHz: [164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0],
    melodyPattern: [0, 2, 3, 5, 4, 2, 3, 0, 1, 3, 4, 6, 5, 3, 2, 1],
    bassHz: 82.41,
    padHz: [164.81, 246.94],
    taikoSteps: [0, 3, 4, 8, 10, 12, 14],
    rimSteps: [2, 6, 9, 13, 15],
    wave: 'sawtooth',
    fluteChance: 0.2,
  },
  // Telhados de Konoha: ágil, noturno, koto sob o luar
  telhados_konoha: {
    stepMs: 295,
    scaleHz: [220.0, 246.94, 261.63, 329.63, 349.23, 440.0, 493.88],
    melodyPattern: [0, 3, 5, -1, 4, 2, 3, -1, 1, 4, 6, -1, 5, 3, 2, 0],
    bassHz: 110.0,
    padHz: [220.0, 329.63],
    taikoSteps: [0, 8, 12],
    rimSteps: [2, 6, 10, 14],
    wave: 'triangle',
    fluteChance: 0.3,
  },
};

type Listener = (settings: AudioSettings) => void;

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private settings: AudioSettings;
  private listeners = new Set<Listener>();

  private activeArena: ArenaId | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private duckTimeout: number | null = null;
  private isDucked = false;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AudioSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(STORAGE_AUDIO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettings>;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Ignore storage error
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_AUDIO_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage error
    }
  }

  get muted(): boolean {
    return this.settings.muted;
  }

  set muted(val: boolean) {
    this.updateSettings({ muted: val });
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  updateSettings(partial: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.syncGainNodes();

    if (partial.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }

    if (!this.settings.musicEnabled || this.settings.muted) {
      this.clearMusicLoop();
    } else if (this.activeArena && this.musicTimer === null) {
      this.beginMusicLoop(this.activeArena);
    }

    this.listeners.forEach((cb) => cb(this.getSettings()));
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.syncGainNodes();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private syncGainNodes() {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const masterTarget = this.settings.muted ? 0 : this.settings.masterVolume;
    const sfxTarget = this.settings.sfxVolume;
    const musicMult = this.isDucked ? 0.28 : 1;
    const musicTarget = this.settings.musicEnabled ? this.settings.musicVolume * 0.45 * musicMult : 0;

    this.masterGain.gain.setTargetAtTime(masterTarget, now, 0.03);
    this.sfxGain.gain.setTargetAtTime(sfxTarget, now, 0.03);
    this.musicGain.gain.setTargetAtTime(musicTarget, now, 0.08);
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const length = Math.floor(ctx.sampleRate * 1.2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    endFreq?: number,
    bus: 'sfx' | 'music' = 'sfx',
    delaySec = 0
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    const targetBus = bus === 'music' ? this.musicGain : this.sfxGain;
    if (!ctx || !targetBus) return;
    try {
      const start = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(targetBus);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Ignore audio errors
    }
  }

  private playFilteredNoise(
    duration: number,
    filterType: BiquadFilterType,
    startFreq: number,
    endFreq: number,
    q: number,
    volume: number,
    bus: 'sfx' | 'music' = 'sfx',
    delaySec = 0
  ) {
    if (this.settings.muted) return;
    const ctx = this.ensureContext();
    const targetBus = bus === 'music' ? this.musicGain : this.sfxGain;
    if (!ctx || !targetBus) return;
    try {
      const start = ctx.currentTime + delaySec;
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.Q.setValueAtTime(q, start);
      filter.frequency.setValueAtTime(startFreq, start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(targetBus);
      src.start(start);
      src.stop(start + duration + 0.02);
    } catch {
      // Ignore
    }
  }

  // ==========================================
  // CORE SHINOBI SFX
  // ==========================================

  /** Metallic steel scrape + ring when drawing/unsheathing a Kunai */
  playKunaiDraw() {
    this.playFilteredNoise(0.11, 'highpass', 2600, 6400, 3.2, 0.16);
    this.playTone(2380, 0.14, 'sine', 0.06, 2950);
    this.playTone(3760, 0.11, 'triangle', 0.04, 4200, 'sfx', 0.015);
  }

  /** Heavy or light punchy combat impact (sub-bass thud + transient crack) */
  playImpact(intensity: 'light' | 'heavy' | 'critical' = 'light') {
    if (intensity === 'critical') {
      this.playTone(155, 0.28, 'sine', 0.24, 34);
      this.playTone(95, 0.24, 'triangle', 0.18, 28);
      this.playFilteredNoise(0.18, 'bandpass', 1100, 280, 1.4, 0.24);
      this.playTone(1320, 0.14, 'triangle', 0.06, 620);
    } else if (intensity === 'heavy') {
      this.playTone(135, 0.21, 'sine', 0.2, 38);
      this.playFilteredNoise(0.14, 'bandpass', 950, 320, 1.2, 0.19);
      this.playTone(220, 0.1, 'square', 0.05, 75);
    } else {
      this.playTone(120, 0.14, 'sine', 0.14, 46);
      this.playFilteredNoise(0.09, 'bandpass', 1150, 460, 1.0, 0.13);
    }
  }

  /** Metallic deflection when assigning blocker or absorbing with Barreira */
  playBlockClang() {
    this.playTone(1480, 0.18, 'triangle', 0.09, 1120);
    this.playTone(2240, 0.15, 'sine', 0.06, 1980, 'sfx', 0.01);
    this.playFilteredNoise(0.08, 'highpass', 3200, 1800, 2.0, 0.1);
  }

  /** Equipment attachment (kunai unsheath + firm latch) */
  playEquip() {
    this.playKunaiDraw();
    this.playTone(420, 0.12, 'triangle', 0.07, 680, 'sfx', 0.06);
  }

  playSummon() {
    this.playTone(260, 0.14, 'triangle', 0.08, 420);
    this.playFilteredNoise(0.09, 'bandpass', 700, 1400, 1.4, 0.06);
  }

  playJutsu() {
    this.playTone(440, 0.22, 'sine', 0.08, 880);
    this.playFilteredNoise(0.2, 'bandpass', 900, 2600, 1.8, 0.08);
  }

  playTrap() {
    this.playTone(190, 0.25, 'sawtooth', 0.06, 120);
    this.playTone(110, 0.22, 'sine', 0.08, 70);
  }

  playStrike() {
    this.playKunaiDraw();
    this.playTone(150, 0.13, 'square', 0.07, 68, 'sfx', 0.04);
  }

  playArenaShift() {
    this.playFilteredNoise(0.32, 'bandpass', 480, 1400, 1.2, 0.1);
    this.playTone(320, 0.3, 'sine', 0.08, 220);
  }

  playDawn() {
    this.playTone(587.33, 0.16, 'triangle', 0.08);
    this.playTone(739.99, 0.24, 'sine', 0.09, undefined, 'sfx', 0.07);
    this.playTone(880.0, 0.28, 'sine', 0.06, undefined, 'sfx', 0.13);
  }

  playNightfall() {
    this.playTone(392.0, 0.18, 'sine', 0.08);
    this.playTone(293.66, 0.26, 'triangle', 0.08, undefined, 'sfx', 0.08);
    this.playTone(220.0, 0.3, 'sine', 0.06, undefined, 'sfx', 0.15);
  }

  playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playTone(f, 0.24, 'triangle', 0.1, undefined, 'sfx', idx * 0.1);
    });
  }

  // ==========================================
  // LEVEL UP FANFARE & ICONIC VOICE LINES
  // ==========================================

  private duckMusicTemporarily(ms = 2600) {
    this.isDucked = true;
    this.syncGainNodes();
    if (this.duckTimeout) clearTimeout(this.duckTimeout);
    this.duckTimeout = window.setTimeout(() => {
      this.isDucked = false;
      this.syncGainNodes();
    }, ms);
  }

  speakVoiceLine(text: string, pitch = 1.0, rate = 1.02) {
    if (
      this.settings.muted ||
      !this.settings.voiceEnabled ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.pitch = Math.max(0.5, Math.min(1.6, pitch));
      utter.rate = Math.max(0.75, Math.min(1.3, rate));
      utter.volume = Math.max(0, Math.min(1, this.settings.masterVolume * this.settings.voiceVolume));

      const voices = synth.getVoices();
      const ptVoice =
        voices.find((v) => v.lang.toLowerCase() === 'pt-br') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
      if (ptVoice) {
        utter.voice = ptVoice;
      }

      this.duckMusicTemporarily(2800);
      utter.onend = () => {
        if (this.duckTimeout) clearTimeout(this.duckTimeout);
        this.isDucked = false;
        this.syncGainNodes();
      };
      synth.speak(utter);
    } catch {
      // SpeechSynthesis unavailable or blocked
    }
  }

  playLevelUp(cardId?: string, evolutionLevel: 2 | 3 = 2) {
    this.playTone(523.25, 0.14, 'triangle', 0.09);
    this.playTone(659.25, 0.14, 'triangle', 0.09, undefined, 'sfx', 0.09);
    this.playTone(783.99, 0.28, 'triangle', 0.11, undefined, 'sfx', 0.18);
    if (evolutionLevel === 3) {
      this.playTone(1046.5, 0.32, 'sine', 0.09, undefined, 'sfx', 0.27);
    }

    if (cardId) {
      const quote = getNinjaLevelUpQuote(cardId, evolutionLevel);
      window.setTimeout(() => {
        this.speakVoiceLine(quote.text, quote.pitch, quote.rate);
      }, 220);
    }
  }

  // ==========================================
  // DYNAMIC ARENA BACKGROUND MUSIC ENGINE
  // ==========================================

  private playKotoNote(freq: number, wave: OscillatorType, duration = 0.42) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4.5, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.3), now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore
    }
  }

  private playTaikoDrum(heavy = true) {
    if (heavy) {
      this.playTone(98, 0.24, 'sine', 0.16, 42, 'music');
      this.playFilteredNoise(0.06, 'lowpass', 420, 140, 1.0, 0.08, 'music');
    } else {
      this.playTone(280, 0.07, 'triangle', 0.05, 160, 'music');
      this.playFilteredNoise(0.035, 'bandpass', 1800, 900, 1.5, 0.05, 'music');
    }
  }

  private playFluteSwell(freq: number) {
    this.playTone(freq * 2, 0.9, 'sine', 0.035, undefined, 'music');
    this.playFilteredNoise(0.75, 'bandpass', freq * 2, freq * 2.2, 4.0, 0.015, 'music');
  }

  private clearMusicLoop() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private beginMusicLoop(arenaId: ArenaId) {
    this.clearMusicLoop();
    if (!this.settings.musicEnabled || this.settings.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const profile = ARENA_MUSIC_PROFILES[arenaId];
    this.musicStep = 0;

    const tick = () => {
      if (!this.settings.musicEnabled || this.settings.muted || this.activeArena !== arenaId) {
        return;
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        return;
      }

      const step = this.musicStep % 16;

      // Ambient pad / bass drone every 8 steps
      if (step % 8 === 0) {
        this.playTone(profile.bassHz, (profile.stepMs * 7.5) / 1000, 'sine', 0.08, undefined, 'music');
        this.playTone(
          profile.padHz[step === 0 ? 0 : 1],
          (profile.stepMs * 7.5) / 1000,
          'triangle',
          0.03,
          undefined,
          'music'
        );
      }

      // Melody pluck
      const noteIdx = profile.melodyPattern[step];
      if (noteIdx >= 0 && noteIdx < profile.scaleHz.length) {
        const freq = profile.scaleHz[noteIdx];
        this.playKotoNote(freq, profile.wave, (profile.stepMs * 1.4) / 1000);
        if (step % 4 === 0 && Math.random() < profile.fluteChance) {
          this.playFluteSwell(freq);
        }
      }

      // Percussion
      if (profile.taikoSteps.includes(step)) {
        this.playTaikoDrum(true);
      } else if (profile.rimSteps.includes(step)) {
        this.playTaikoDrum(false);
      }

      this.musicStep = (this.musicStep + 1) % 16;
    };

    tick();
    this.musicTimer = window.setInterval(tick, profile.stepMs);
  }

  startArenaMusic(arenaId: ArenaId) {
    this.activeArena = arenaId;
    this.ensureContext();
    if (this.settings.musicEnabled && !this.settings.muted) {
      this.beginMusicLoop(arenaId);
    }
  }

  setArenaTheme(arenaId: ArenaId) {
    if (this.activeArena === arenaId && this.musicTimer !== null) return;
    this.activeArena = arenaId;
    if (this.settings.musicEnabled && !this.settings.muted) {
      this.beginMusicLoop(arenaId);
    }
  }

  ensureMusicRunning(arenaId: ArenaId) {
    this.ensureContext();
    this.activeArena = arenaId;
    if (this.settings.musicEnabled && !this.settings.muted && this.musicTimer === null) {
      this.beginMusicLoop(arenaId);
    }
  }

  stopMusic() {
    this.activeArena = null;
    this.clearMusicLoop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }
}

export const soundFX = new AudioManager();
