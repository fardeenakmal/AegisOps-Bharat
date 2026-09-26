/**
 * Multi-tier Web Audio API sound alert engine for AegisOps Disaster Response Platform.
 * Produces distinct audio cues per severity:
 * - CRITICAL: Alternating high/mid emergency siren (880Hz / 660Hz)
 * - HIGH: Urgent double chime (587Hz -> 880Hz)
 * - MEDIUM: Soft single notification ping (523Hz)
 * - LOW: Subdued alert click (440Hz)
 * User volume and mute settings are persisted in localStorage.
 */

export interface AudioPreferences {
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
}

const PREF_KEY = 'aegisops_audio_preferences';

class SoundAlertService {
  private audioCtx: AudioContext | null = null;
  private preferences: AudioPreferences;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  private loadPreferences(): AudioPreferences {
    try {
      const saved = localStorage.getItem(PREF_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { isMuted: false, volume: 0.6 };
  }

  private savePreferences() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(this.preferences));
    } catch {}
  }

  public getPreferences(): AudioPreferences {
    return { ...this.preferences };
  }

  public setMuted(muted: boolean) {
    this.preferences.isMuted = muted;
    this.savePreferences();
  }

  public setVolume(volume: number) {
    this.preferences.volume = Math.max(0.0, Math.min(1.0, volume));
    this.savePreferences();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playAlertChime(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string = 'MEDIUM') {
    if (this.preferences.isMuted || this.preferences.volume <= 0.01) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.preferences.volume * 0.25, ctx.currentTime);
    masterGain.connect(ctx.destination);

    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        this.playCriticalSiren(ctx, masterGain);
        break;
      case 'HIGH':
        this.playHighWarning(ctx, masterGain);
        break;
      case 'MEDIUM':
        this.playMediumPing(ctx, masterGain);
        break;
      default:
        this.playLowChirp(ctx, masterGain);
        break;
    }
  }

  // CRITICAL: Alternating two-tone warble (880Hz <-> 660Hz)
  private playCriticalSiren(ctx: AudioContext, destination: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.15);
    osc.frequency.setValueAtTime(880, now + 0.30);
    osc.frequency.setValueAtTime(660, now + 0.45);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  // HIGH: Double chime (587Hz -> 880Hz)
  private playHighWarning(ctx: AudioContext, destination: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.15); // A5

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // MEDIUM: Single notification ping (523.25Hz C5)
  private playMediumPing(ctx: AudioContext, destination: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // LOW: Subtle chirp (440Hz)
  private playLowChirp(ctx: AudioContext, destination: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440.0, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const soundAlertService = new SoundAlertService();

