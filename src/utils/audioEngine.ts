/**
 * Interactive Web Audio Synthesizer Engine
 * Generates pleasant ambient lo-fi / melodic grooves for each track in real-time.
 */

type BeatListener = (step: number, isBassBeat: boolean) => void;
type TimeListener = (currentTime: number) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private gainNode: GainNode | null = null;
  private currentTrackType: string = 'pop-synth';
  private bpm: number = 110;
  private step: number = 0;
  private beatListeners: Set<BeatListener> = new Set();
  private timeListeners: Set<TimeListener> = new Set();
  private audioElement: HTMLAudioElement | null = null;
  private analyserNode: AnalyserNode | null = null;
  private hasAudioFileError: boolean = false;
  private currentVolume: number = 1.0;

  public subscribeBeat(listener: BeatListener) {
    this.beatListeners.add(listener);
    return () => {
      this.beatListeners.delete(listener);
    };
  }

  public subscribeTime(listener: TimeListener) {
    this.timeListeners.add(listener);
    return () => {
      this.timeListeners.delete(listener);
    };
  }

  private triggerBeat(step: number, isBassBeat: boolean) {
    this.beatListeners.forEach((listener) => listener(step, isBassBeat));
  }

  private triggerTime(time: number) {
    this.timeListeners.forEach((listener) => listener(time));
  }

  public initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.audioElement && typeof window !== 'undefined') {
      this.audioElement = new Audio();
      (this.audioElement as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');
      this.audioElement.preload = 'auto';
      this.audioElement.volume = this.currentVolume;
      this.audioElement.ontimeupdate = () => {
        if (this.audioElement) {
          this.triggerTime(this.audioElement.currentTime);
        }
      };
    }
  }

  public unlock() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.audioElement && !this.audioElement.src) {
      // Dummy silent playback to unlock iOS Safari HTMLAudioElement restrictions
      const dummyUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.audioElement.src = dummyUrl;
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (this.audioElement) this.audioElement.pause();
        }).catch(() => {});
      }
    }
  }

  public updateMediaSession(
    track: { title: string; artist: string; featuredArtist?: string; album: string; coverUrl: string; duration: number },
    callbacks?: { onPlay?: () => void; onPause?: () => void; onNext?: () => void; onPrev?: () => void; onSeek?: (time: number) => void }
  ) {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      'MediaMetadata' in window
    ) {
      try {
        const globalWin = window as unknown as { MediaMetadata: typeof MediaMetadata };
        if (globalWin.MediaMetadata && track) {
          let artworkUrl = '';
          try {
            artworkUrl = track.coverUrl ? (
              track.coverUrl.startsWith('http') ? track.coverUrl : new URL(track.coverUrl, window.location.href).href
            ) : '';
          } catch {
            artworkUrl = '';
          }

          navigator.mediaSession.metadata = new globalWin.MediaMetadata({
            title: track.title || 'LyricFlow Track',
            artist: (track.artist || '') + (track.featuredArtist ? ` ft. ${track.featuredArtist}` : ''),
            album: track.album || '',
            artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }] : []
          });
        }

        const ms = navigator.mediaSession;
        if (callbacks?.onPlay) try { ms.setActionHandler('play', callbacks.onPlay); } catch {}
        if (callbacks?.onPause) try { ms.setActionHandler('pause', callbacks.onPause); } catch {}
        if (callbacks?.onNext) try { ms.setActionHandler('nexttrack', callbacks.onNext); } catch {}
        if (callbacks?.onPrev) try { ms.setActionHandler('previoustrack', callbacks.onPrev); } catch {}
        if (callbacks?.onSeek) {
          try {
            ms.setActionHandler('seekto', (details) => {
              if (details.seekTime !== undefined) {
                callbacks.onSeek!(details.seekTime);
              }
            });
          } catch {}
        }
      } catch (err) {
        console.warn('MediaSession error:', err);
      }
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getCurrentTime(): number | null {
    if (this.audioElement && !isNaN(this.audioElement.currentTime) && this.audioElement.currentTime > 0) {
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
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.currentVolume * 0.8, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.currentVolume;
    }
  }

  private preloadedAudioElements: Map<string, HTMLAudioElement> = new Map();

  public preloadTrack(audioUrl: string) {
    if (!audioUrl || typeof window === 'undefined') return;
    const safeUrl = encodeURI(audioUrl);
    if (this.preloadedAudioElements.has(safeUrl)) return;

    try {
      const audio = new Audio();
      audio.preload = 'auto';
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.src = safeUrl;
      audio.load();
      this.preloadedAudioElements.set(safeUrl, audio);
    } catch {
      // Ignore preloader errors
    }
  }

  private isAudioFileBuffering(): boolean {
    if (!this.audioElement || !this.audioElement.src) return true;
    // If audioElement has started playing audio frames cleanly, readyState >= 3 and not paused
    return (
      this.audioElement.paused ||
      this.audioElement.readyState < 3 ||
      this.audioElement.currentTime === 0
    );
  }

  public play(trackType: string = 'pop-synth', bpm: number = 110, audioUrl?: string) {
    this.initContext();
    this.currentTrackType = trackType;
    this.bpm = bpm;
    this.isPlaying = true;
    this.step = 0;
    this.hasAudioFileError = false;

    if (audioUrl) {
      const safeUrl = encodeURI(audioUrl);
      if (!this.audioElement) {
        this.audioElement = new Audio();
        (this.audioElement as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
        this.audioElement.setAttribute('playsinline', 'true');
        this.audioElement.setAttribute('webkit-playsinline', 'true');
        this.audioElement.preload = 'auto';
        this.audioElement.ontimeupdate = () => {
          if (this.audioElement) {
            this.triggerTime(this.audioElement.currentTime);
          }
        };
      }

      // Check if URL has changed
      const currentSrc = this.audioElement.src;
      if (!currentSrc || !currentSrc.endsWith(safeUrl)) {
        this.audioElement.src = safeUrl;
        this.audioElement.load();
      }

      this.audioElement.volume = this.currentVolume;
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio file playback fallback to synth:', err);
          this.hasAudioFileError = true;
        });
      }
    } else if (this.audioElement) {
      this.audioElement.pause();
    }

    if (this.timerId) {
      clearInterval(this.timerId);
    }

    const intervalMs = (60 / this.bpm / 2) * 1000; // 8th note interval
    this.timerId = window.setInterval(() => {
      this.playNoteStep(!!audioUrl && !this.hasAudioFileError);
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

    // Trigger beat listeners for UI reactivity immediately
    this.triggerBeat(this.step, isBassBeat);

    // If custom audio file is playing cleanly, skip synth notes.
    // If custom audio file is buffering on mobile, play instant synth notes so user gets 0ms feedback!
    const isAudioBuffering = isCustomAudio && this.isAudioFileBuffering();
    if ((isCustomAudio && !isAudioBuffering) || !this.ctx || !this.gainNode) return;
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

// Auto unlock audio context on first mobile touch/click interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    audioEngine.unlock();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('click', unlockAudio, { once: true });
}

