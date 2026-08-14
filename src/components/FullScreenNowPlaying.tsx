import { useState, useEffect, useRef, useMemo, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Airplay,
  Sparkles,
} from 'lucide-react';
import { Track, PlayerState } from '../types';
import { extractColorsFromImage, ExtractedColors } from '../utils/colorExtractor';
import { getLyricsForTrack, LyricLine } from '../data/lyrics';
import { getUniqueFallbackCover } from '../utils/artworkResolver';
import { AnimatedBackground } from './AnimatedBackground';
import { LineMaskSplit } from './LineMaskSplit';

interface FullScreenNowPlayingProps {
  track: Track;
  playerState: PlayerState;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (timeSeconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

// Palette cache per track ID
const paletteCache: Record<string, ExtractedColors> = {};

export function FullScreenNowPlaying({
  track,
  playerState,
  onClose,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: FullScreenNowPlayingProps) {
  const [palette, setPalette] = useState<ExtractedColors>(() => {
    return (
      paletteCache[track.id] || {
        primary: 'rgb(80, 40, 100)',
        secondary: 'rgb(220, 80, 120)',
        accent: 'rgb(245, 158, 11)',
        dark: 'rgb(10, 10, 18)',
      }
    );
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Extract and cache color palette client-side on track change
  useEffect(() => {
    let isMounted = true;
    if (paletteCache[track.id]) {
      setPalette(paletteCache[track.id]);
    } else {
      extractColorsFromImage(track.coverUrl).then((extracted) => {
        paletteCache[track.id] = extracted;
        if (isMounted) setPalette(extracted);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [track.id, track.coverUrl]);

  // Escape key listener to close full screen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        onPrevTrack();
      } else if (e.key === 'ArrowRight') {
        onNextTrack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onTogglePlay, onPrevTrack, onNextTrack]);

  // Get lyrics for active track
  const lyrics: LyricLine[] = useMemo(() => {
    return getLyricsForTrack(track.id, track.title, track.artist);
  }, [track.id, track.title, track.artist]);

  // Derived active lyric index (memoized re-render optimization)
  const activeLyricIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return 0;
    const currentTime = playerState.progress;
    let idx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyrics, playerState.progress]);

  // Auto-scroll active lyric line to fixed vertical anchor point
  useEffect(() => {
    if (lineRefs.current[activeLyricIndex] && containerRef.current) {
      lineRefs.current[activeLyricIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex]);

  // Format timestamps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingSeconds = Math.max(0, Math.floor(track.duration - playerState.progress));
  const formattedRemaining = `-${formatTime(remainingSeconds)}`;
  const formattedCurrent = formatTime(playerState.progress);

  const progressPercent = track.duration > 0
    ? (playerState.progress / track.duration) * 100
    : 0;

  const handleProgressBarClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage * track.duration);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex flex-col justify-between h-[100dvh] w-screen overflow-hidden bg-[#070709] text-white select-none"
      >
        {/* 1. Animated Color Blob Background (Palette Derived from Cover Art) */}
        <AnimatedBackground palette={palette} coverUrl={track.coverUrl} isPlaying={playerState.isPlaying} />

        {/* 2. Top Navigation Bar */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
            title="Minimize (Esc)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                Now Playing
              </span>
            </div>
            <span className="text-white/30">•</span>
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-white/90">
                Designed & Coded by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 font-bold">Jainil Patel</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg active:scale-95"
            title="Exit Full Screen (Esc)"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Minimize</span>
          </button>
        </div>

        {/* 3. Main Content Stage: 2-Column Desktop / Stacked Mobile */}
        <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 overflow-hidden py-2">
          {/* Left Column (Desktop) / Top Section (Mobile): Album Art & Integrated Controls */}
          <div className="flex flex-col items-center lg:items-start gap-4 shrink-0 w-full sm:w-[300px] lg:w-[360px]">
            {/* Album Artwork Rounded Card with Soft Shadow */}
            <div className="w-48 h-48 sm:w-72 sm:h-72 lg:w-[340px] lg:h-[340px] rounded-2xl overflow-hidden border border-white/25 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative group shrink-0">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getUniqueFallbackCover(track);
                }}
              />
              {track.badge && (
                <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-white uppercase px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-md">
                  {track.badge}
                </span>
              )}
            </div>

            {/* Scrub Bar & Track Info */}
            <div className="w-full space-y-1.5 pt-1 text-left">
              {/* Progress Line */}
              <div
                ref={progressBarRef}
                onClick={handleProgressBarClick}
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all relative overflow-hidden"
                title="Click to seek position"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Timestamps */}
              <div className="flex justify-between text-[11px] font-mono text-white/60">
                <span>{formattedCurrent}</span>
                <span>{formattedRemaining}</span>
              </div>

              {/* Title & Artist */}
              <div className="flex flex-col text-center lg:text-left pt-0.5 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate drop-shadow">
                  {track.title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-white/70 truncate">
                  {track.artist}{track.featuredArtist ? ` ft. ${track.featuredArtist}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop) / Bottom Section (Mobile): Synced Lyrics Panel */}
          <div className="flex-1 w-full h-full max-h-[460px] flex flex-col justify-center overflow-hidden relative">
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-2 py-8 space-y-6 text-left scrollbar-none"
            >
              {lyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                const isPast = idx < activeLyricIndex;

                return (
                  <div key={idx} ref={(el) => (lineRefs.current[idx] = el)}>
                    <LineMaskSplit
                      text={line.text}
                      isActive={isActive}
                      isPast={isPast}
                      accentColor={track.accentColor || 'rgba(255, 255, 255, 0.6)'}
                      splitMode="words"
                      blurIntensity={16}
                      onClick={() => onSeek(line.time)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Bottom Playback Controls Bar */}
        <div className="relative z-30 w-full max-w-xl mx-auto pb-6 sm:pb-8 px-4 shrink-0 flex justify-center">
          <div className="bg-stone-950/80 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-2 flex items-center justify-between gap-6 shadow-2xl">
            <button
              onClick={onPrevTrack}
              className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-white text-stone-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
              title={playerState.isPlaying ? 'Pause' : 'Play'}
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNextTrack}
              className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 text-white/70 pl-4 border-l border-white/15">
              <button onClick={onToggleMute} className="hover:text-white transition-colors">
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume1 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playerState.isMuted ? 0 : playerState.volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 sm:w-24 accent-white bg-white/20 h-1 rounded-lg cursor-pointer"
              />
              <Volume2 className="w-4 h-4" />
            </div>

            <button className="p-1 rounded-full text-white/70 hover:text-white transition-colors">
              <Airplay className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
