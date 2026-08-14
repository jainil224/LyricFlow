/**
 * Interactive Web Audio Synthesizer Engine
 * Generates pleasant ambient lo-fi / melodic grooves for each track in real-time.
 */

type BeatListener = (step: number, isBassBeat: boolean) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private gainNode: GainNode | null = null;
  private currentTrackType: string = 'pop-synth';
  private bpm: number = 110;
  private step: number = 0;
  private beatListeners: Set<BeatListener> = new Set();

  public subscribeBeat(listener: BeatListener) {
    this.beatListeners.add(listener);
    return () => {
      this.beatListeners.delete(listener);
    };
  }

  private triggerBeat(step: number, isBassBeat: boolean) {
    this.beatListeners.forEach((listener) => listener(step, isBassBeat));
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private audioElement: HTMLAudioElement | null = null;
  private analyserNode: AnalyserNode | null = null;

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getCurrentTime(): number | null {
    if (this.audioElement && !isNaN(this.audioElement.currentTime)) {
      return this.audioElement.currentTime;
    }
    return null;
  }

  public getAnalyserNode(): AnalyserNode | null {
    this.initContext();
    if (!this.ctx) return null;
    if (!this.analyserNode) {
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64; // 32 frequency bins
      this.analyserNode.smoothingTimeConstant = 0.8;
      if (this.gainNode) {
        this.gainNode.connect(this.analyserNode);
      }
    }
    return this.analyserNode;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      const safeVol = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.setTargetAtTime(safeVol * 0.4, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public play(trackType: string = 'pop-synth', bpm: number = 110, audioUrl?: string) {
    this.initContext();
    this.currentTrackType = trackType;
    this.bpm = bpm;
    this.isPlaying = true;
    this.step = 0;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    if (audioUrl) {
      this.audioElement = new Audio(audioUrl);
      this.audioElement.play().catch((err) => console.warn('Audio file playback fallback to synth:', err));
    }

    if (this.timerId) {
      clearInterval(this.timerId);
    }

    const intervalMs = (60 / this.bpm / 2) * 1000; // 8th note interval
    this.timerId = window.setInterval(() => {
      this.playNoteStep(!!audioUrl);
      this.step = (this.step + 1) % 16;
    }, intervalMs);
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public seek(timeSeconds: number) {
    if (this.audioElement && !isNaN(timeSeconds)) {
      try {
        this.audioElement.currentTime = timeSeconds;
      } catch (err) {
        console.warn('Audio seek error:', err);
      }
    }
  }

  public stop() {
    this.pause();
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
    }
    this.step = 0;
  }

  private playNoteStep(isCustomAudio: boolean = false) {
    if (!this.isPlaying) return;
    const isBassBeat = this.step % 4 === 0;

    // Trigger beat listeners for UI reactivity
    this.triggerBeat(this.step, isBassBeat);

    // If custom audio file is playing, skip synthesizer note generation
    if (isCustomAudio || !this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;

    // Frequencies (C minor / Eb major scale vibes)
    const scale: Record<string, number[]> = {
      'pop-synth': [261.63, 311.13, 349.23, 392.00, 466.16, 523.25], // C4, Eb4, F4, G4, Bb4, C5
      'reggae-vibe': [220.00, 261.63, 293.66, 329.63, 392.00, 440.00], // A3, C4, D4, E4, G4, A4
      'rnb-groove': [196.00, 246.94, 293.66, 329.63, 392.00, 493.88], // G3, B3, D4, E4, G4, B4
      'hiphop-beat': [174.61, 220.00, 261.63, 293.66, 349.23, 440.00], // F3, A3, C4, D4, F4, A4
      'funky-bass': [246.94, 293.66, 329.63, 369.99, 440.00, 493.88], // B3, D4, E4, F#4, A4, B4
    };

    const currentScale = scale[this.currentTrackType] || scale['pop-synth'];

    // Bassline on beat 0, 4, 8, 12
    if (this.step % 4 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      const rootIndex = (Math.floor(this.step / 4) % currentScale.length);
      bassOsc.frequency.setValueAtTime(currentScale[rootIndex] / 2, now);

      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      bassOsc.connect(bassGain);
      bassGain.connect(this.gainNode);

      bassOsc.start(now);
      bassOsc.stop(now + 0.4);
    }

    // Melodic Arpeggio / Chords
    if (this.step % 2 === 0 || this.step % 3 === 0) {
      const melodyOsc = this.ctx.createOscillator();
      const melodyGain = this.ctx.createGain();
      melodyOsc.type = 'sine';

      const noteIdx = (this.step * 2 + 1) % currentScale.length;
      melodyOsc.frequency.setValueAtTime(currentScale[noteIdx], now);

      melodyGain.gain.setValueAtTime(0.12, now);
      melodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      melodyOsc.connect(melodyGain);
      melodyGain.connect(this.gainNode);

      melodyOsc.start(now);
      melodyOsc.stop(now + 0.3);
    }

    // Soft Hi-Hat tick
    if (this.step % 2 === 1) {
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(6000 + Math.random() * 2000, now);

      hatGain.gain.setValueAtTime(0.03, now);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      hatOsc.connect(hatGain);
      hatGain.connect(this.gainNode);

      hatOsc.start(now);
      hatOsc.stop(now + 0.05);
    }
  }
}

export const audioEngine = new AudioEngine();
