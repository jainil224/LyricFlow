import { useState, useEffect, useRef, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Minimize2 } from 'lucide-react';
import { Track, PlayerState } from '../../types';
import { extractColorsFromImage, ExtractedColors } from '../../utils/colorExtractor';
import { useAudioAnalyzer } from './useAudioAnalyzer';
import { ImmersiveBackground } from './ImmersiveBackground';
import { AlbumArt } from './AlbumArt';
import { SyncedLyrics } from './SyncedLyrics';
import { PlayerControls } from './PlayerControls';

interface ImmersivePlayerProps {
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

const paletteCache: Record<string, ExtractedColors> = {};

export function ImmersivePlayer({
  track,
  playerState,
  onClose,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: ImmersivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);

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

  // Connect Audio Analyzer hook driving CSS variables (Section 6 & 7)
  useAudioAnalyzer(containerRef, { isPlaying: playerState.isPlaying });

  // Browser Fullscreen API Integration (Section 2)
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fallback gracefully if browser restricts fullscreen request
      });
    }

    return () => {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Extract and cache color palette per track ID (Section 4 & 16)
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

  // Escape key & Keyboard controls (Section 1 & 29)
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

  // Touch Swipe-Down to exit on mobile (Section 1 & 30)
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartYRef.current !== null && e.touches.length > 0) {
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 120) {
        // Swipe down threshold met
        touchStartYRef.current = null;
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="fixed inset-0 z-50 flex flex-col justify-between h-[100dvh] w-screen overflow-hidden bg-[#070709] text-white select-none"
      >
        {/* Layered Audio-Reactive Ambient Background (Section 5) */}
        <ImmersiveBackground track={track} palette={palette} isPlaying={playerState.isPlaying} />

        {/* Top Header Bar */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/80 hover:text-white transition-all shadow-lg active:scale-95"
            title="Minimize Immersive Mode (Esc)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              Immersive Mode
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg active:scale-95"
            title="Exit Immersive Mode (Esc)"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>

        {/* Main Stage (Desktop: Two Column | Mobile: Stacked) (Section 2 & 20) */}
        <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 overflow-hidden py-2">
          {/* Left Column (Desktop) / Top Section (Mobile): Album Art & Track Header */}
          <div className="flex flex-col items-center lg:items-start gap-4 shrink-0 w-full sm:w-[320px] lg:w-[380px]">
            <AlbumArt track={track} isPlaying={playerState.isPlaying} />

            <div className="flex flex-col text-center lg:text-left pt-1 min-w-0 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate drop-shadow">
                {track.title}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-white/70 truncate mt-0.5">
                {track.artist}{track.featuredArtist ? ` ft. ${track.featuredArtist}` : ''}
              </p>
              <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mt-1 truncate">
                {track.album}
              </p>
            </div>
          </div>

          {/* Right Column (Desktop) / Bottom Section (Mobile): Synced Lyrics Engine */}
          <SyncedLyrics track={track} playerState={playerState} onSeek={onSeek} />
        </div>

        {/* Bottom Playback Controls Bar with Inactivity Auto-Fade (Section 21) */}
        <PlayerControls
          track={track}
          playerState={playerState}
          onTogglePlay={onTogglePlay}
          onPrevTrack={onPrevTrack}
          onNextTrack={onNextTrack}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onToggleMute={onToggleMute}
        />
      </motion.div>
    </AnimatePresence>
  );
}
