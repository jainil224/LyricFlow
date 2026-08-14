import { useState, useEffect, useCallback } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { TRACKS } from './data/tracks';
import { CoverFlow } from './components/CoverFlow';
import { PlayerDock } from './components/PlayerDock';
import { DynamicMusicBackground } from './components/DynamicMusicBackground';
import { SongListDrawer } from './components/SongListDrawer';
import { LyricsModal } from './components/LyricsModal';
import { LiveLyricsSideCard } from './components/LiveLyricsSideCard';
import { ImmersivePlayer } from './components/ImmersivePlayer/ImmersivePlayer';
import { LiveListenerCounter } from './components/LiveListenerCounter';
import { PlayerState } from './types';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrackIndex: 3, // Default to Prateek Kuhad - CO2 for all first-time visitors
    isPlaying: false,
    progress: 0,
    volume: 0.8,
    isMuted: false,
    isAirplayActive: false,
    isEqOpen: false,
  });

  // Real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTrack = TRACKS[playerState.currentTrackIndex];

  // Select Track
  const handleSelectTrack = useCallback((index: number) => {
    setPlayerState((prev) => {
      const nextIndex = Math.max(0, Math.min(TRACKS.length - 1, index));
      if (prev.isPlaying) {
        audioEngine.play(TRACKS[nextIndex].melodyType, TRACKS[nextIndex].bpm, TRACKS[nextIndex].audioUrl);
      }
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        progress: 0,
      };
    });
  }, []);

  // Prev / Next
  const handlePrevTrack = useCallback(() => {
    setPlayerState((prev) => {
      const nextIndex = prev.currentTrackIndex > 0 ? prev.currentTrackIndex - 1 : TRACKS.length - 1;
      if (prev.isPlaying) {
        audioEngine.play(TRACKS[nextIndex].melodyType, TRACKS[nextIndex].bpm, TRACKS[nextIndex].audioUrl);
      }
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        progress: 0,
      };
    });
  }, []);

  const handleNextTrack = useCallback(() => {
    setPlayerState((prev) => {
      const nextIndex = prev.currentTrackIndex < TRACKS.length - 1 ? prev.currentTrackIndex + 1 : 0;
      if (prev.isPlaying) {
        audioEngine.play(TRACKS[nextIndex].melodyType, TRACKS[nextIndex].bpm, TRACKS[nextIndex].audioUrl);
      }
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        progress: 0,
      };
    });
  }, []);

  // Toggle Play/Pause
  const handleTogglePlay = useCallback(() => {
    setPlayerState((prev) => {
      const nextPlaying = !prev.isPlaying;
      if (nextPlaying) {
        audioEngine.setVolume(prev.isMuted ? 0 : prev.volume);
        audioEngine.play(TRACKS[prev.currentTrackIndex].melodyType, TRACKS[prev.currentTrackIndex].bpm, TRACKS[prev.currentTrackIndex].audioUrl);
      } else {
        audioEngine.pause();
      }
      return { ...prev, isPlaying: nextPlaying };
    });
  }, []);

  // Seek
  const handleSeek = useCallback((newTime: number) => {
    const clampedTime = Math.max(0, Math.min(currentTrack.duration, newTime));
    audioEngine.seek(clampedTime);
    setPlayerState((prev) => ({
      ...prev,
      progress: clampedTime,
    }));
  }, [currentTrack.duration]);

  // Volume
  const handleVolumeChange = useCallback((newVol: number) => {
    audioEngine.setVolume(newVol);
    setPlayerState((prev) => ({
      ...prev,
      volume: newVol,
      isMuted: newVol === 0,
    }));
  }, []);

  // Mute
  const handleToggleMute = useCallback(() => {
    setPlayerState((prev) => {
      const nextMuted = !prev.isMuted;
      audioEngine.setVolume(nextMuted ? 0 : prev.volume);
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  // Real-time zero-latency audio progress subscriber & ticker
  useEffect(() => {
    // 1. Instant ontimeupdate subscriber for 0ms latency audio sync
    const unsubscribe = audioEngine.subscribeTime((exactTime) => {
      setPlayerState((prev) => {
        const track = TRACKS[prev.currentTrackIndex];
        if (exactTime >= track.duration) {
          const nextIdx = (prev.currentTrackIndex + 1) % TRACKS.length;
          audioEngine.play(TRACKS[nextIdx].melodyType, TRACKS[nextIdx].bpm, TRACKS[nextIdx].audioUrl);
          return { ...prev, currentTrackIndex: nextIdx, progress: 0 };
        }
        return { ...prev, progress: exactTime };
      });
    });

    // 2. High-frequency 100ms ticker fallback for synthesised tracks
    let interval: number | null = null;
    if (playerState.isPlaying) {
      interval = window.setInterval(() => {
        setPlayerState((prev) => {
          const exactTime = audioEngine.getCurrentTime();
          if (exactTime !== null) return prev; // Managed by subscriber above
          const track = TRACKS[prev.currentTrackIndex];
          const nextProgress = prev.progress + 0.1;
          if (nextProgress >= track.duration) {
            const nextIdx = (prev.currentTrackIndex + 1) % TRACKS.length;
            audioEngine.play(TRACKS[nextIdx].melodyType, TRACKS[nextIdx].bpm, TRACKS[nextIdx].audioUrl);
            return { ...prev, currentTrackIndex: nextIdx, progress: 0 };
          }
          return { ...prev, progress: nextProgress };
        });
      }, 100);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [playerState.isPlaying]);

  // Keyboard Shortcuts (Arrow keys to navigate, Space to play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevTrack();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevTrack, handleNextTrack, handleTogglePlay]);

  // Format real-time clock parts (hours:minutes, seconds, AM/PM, Date)
  const hoursMinutes = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(/\s?[AP]M$/i, '');

  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const ampm = currentTime.getHours() >= 12 ? 'PM' : 'AM';

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <DynamicMusicBackground track={currentTrack} isPlaying={playerState.isPlaying}>
      {/* Top Subtle Ambient Light Flare */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* Top Navigation / Header Bar */}
      <header className="relative z-30 w-full max-w-5xl pt-2 sm:pt-4 px-3 sm:px-4 flex flex-col items-center gap-1.5 select-none">
        <div className="w-full flex items-center justify-between gap-1.5">
          {/* Top Left Corner: Clean Time Pill Widget */}
          <div className="flex items-center bg-white/10 hover:bg-white/15 backdrop-blur-2xl border border-white/20 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 shrink-0">
            <div className="flex items-baseline gap-0.5 text-white font-mono leading-none">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white drop-shadow">
                {hoursMinutes}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300">
                :{seconds}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/80 tracking-wider ml-1 uppercase">
                {ampm}
              </span>
            </div>
          </div>

          {/* Desktop Top Center: Creator Branding Badge with 👨🏻‍💻 Emoji */}
          <div className="hidden sm:flex items-center gap-1.5 bg-stone-900/80 hover:bg-stone-900/90 backdrop-blur-2xl border border-white/20 px-3.5 py-1.5 rounded-full shadow-2xl transition-all duration-300">
            <span className="text-xs sm:text-sm leading-none shrink-0">👨🏻‍💻</span>
            <span className="text-[11px] font-semibold text-white/90 tracking-wide whitespace-nowrap">
              Designed & Coded by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 font-bold">Jainil Patel</span>
            </span>
          </div>

          {/* Top Right Corner: Full Screen Player Page Button */}
          <button
            onClick={() => setIsFullScreenOpen(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-2xl border border-white/20 text-xs font-semibold text-white/90 hover:text-white flex items-center gap-1.5 shadow-xl transition-all active:scale-95 shrink-0"
            title="Open Full Screen Player Page"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Full Screen Player</span>
          </button>
        </div>

        {/* Mobile Dedicated Creator Branding Badge (Centered on Phone Screens) */}
        <div className="flex sm:hidden items-center gap-1.5 bg-stone-900/85 backdrop-blur-2xl border border-white/20 px-3 py-0.5 rounded-full shadow-lg">
          <span className="text-xs leading-none shrink-0">👨🏻‍💻</span>
          <span className="text-[10px] font-semibold text-white/90 tracking-wide">
            Designed & Coded by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 font-bold">Jainil Patel</span>
          </span>
        </div>
      </header>

      {/* Main Interactive Stage: Centered 3D Cover Flow Carousel */}
      <div className="w-full flex-1 flex items-center justify-center max-w-7xl px-2 sm:px-4 relative z-20 pt-1 pb-16 sm:py-4 my-auto">
        <CoverFlow
          tracks={TRACKS}
          activeIndex={playerState.currentTrackIndex}
          onSelectTrack={handleSelectTrack}
          onOpenFullScreen={() => setIsFullScreenOpen(true)}
        />
      </div>

      {/* Bottom Floating Translucent Player Bar */}
      <div className="w-full flex justify-center pb-4 sm:pb-6 relative z-30">
        <PlayerDock
          currentTrack={currentTrack}
          playerState={playerState}
          onTogglePlay={handleTogglePlay}
          onPrevTrack={handlePrevTrack}
          onNextTrack={handleNextTrack}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenLyrics={() => setIsLyricsOpen(true)}
          onOpenFullScreen={() => setIsFullScreenOpen(true)}
        />
      </div>

      {/* Music Library Modal / Drawer */}
      <SongListDrawer
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        tracks={TRACKS}
        currentTrackIndex={playerState.currentTrackIndex}
        isPlaying={playerState.isPlaying}
        onSelectTrack={handleSelectTrack}
      />

      {/* Live Karaoke Lyrics Modal */}
      {isLyricsOpen && (
        <LyricsModal
          track={currentTrack}
          playerState={playerState}
          onClose={() => setIsLyricsOpen(false)}
          onSeek={handleSeek}
          onTogglePlay={handleTogglePlay}
        />
      )}

      {/* Immersive Fullscreen Listening Mode */}
      {isFullScreenOpen && (
        <ImmersivePlayer
          track={currentTrack}
          playerState={playerState}
          onClose={() => setIsFullScreenOpen(false)}
          onTogglePlay={handleTogglePlay}
          onPrevTrack={handlePrevTrack}
          onNextTrack={handleNextTrack}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
        />
      )}
    </DynamicMusicBackground>
  );
}
