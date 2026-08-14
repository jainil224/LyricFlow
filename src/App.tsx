import { useState, useEffect, useCallback } from 'react';
import { Clock, Maximize2 } from 'lucide-react';
import { TRACKS } from './data/tracks';
import { CoverFlow } from './components/CoverFlow';
import { PlayerDock } from './components/PlayerDock';
import { DynamicMusicBackground } from './components/DynamicMusicBackground';
import { SongListDrawer } from './components/SongListDrawer';
import { LyricsModal } from './components/LyricsModal';
import { LiveLyricsSideCard } from './components/LiveLyricsSideCard';
import { FullScreenNowPlaying } from './components/FullScreenNowPlaying';
import { PlayerState } from './types';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrackIndex: 2, // Default to Charlie Puth - How Long (center card in reference image)
    isPlaying: false,
    progress: 42,
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

  // Progress playback timer
  useEffect(() => {
    let interval: number | null = null;
    if (playerState.isPlaying) {
      interval = window.setInterval(() => {
        setPlayerState((prev) => {
          const track = TRACKS[prev.currentTrackIndex];
          if (prev.progress >= track.duration) {
            // Auto advance next track
            const nextIdx = (prev.currentTrackIndex + 1) % TRACKS.length;
            audioEngine.play(TRACKS[nextIdx].melodyType, TRACKS[nextIdx].bpm, TRACKS[nextIdx].audioUrl);
            return {
              ...prev,
              currentTrackIndex: nextIdx,
              progress: 0,
            };
          }
          return {
            ...prev,
            progress: prev.progress + 1,
          };
        });
      }, 1000);
    }
    return () => {
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
      <header className="relative z-30 w-full max-w-5xl pt-3 px-4 flex items-center justify-between">
        {/* Top Left Corner: Premium Real-Time Clock Widget */}
        <div className="flex items-center gap-2.5 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-2xl border border-white/20 px-3.5 py-2 rounded-2xl shadow-2xl transition-all duration-300 group">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500/30 to-orange-500/20 border border-amber-500/40 text-amber-300 shadow-inner">
            <Clock className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="flex flex-col text-left leading-none">
            <div className="flex items-baseline gap-0.5 text-white font-mono">
              <span className="text-sm font-bold tracking-tight text-white drop-shadow">
                {hoursMinutes}
              </span>
              <span className="text-[11px] font-semibold text-amber-400/90">
                :{seconds}
              </span>
              <span className="text-[10px] font-bold text-white/60 tracking-wider ml-1">
                {ampm}
              </span>
            </div>
            <span className="text-[9px] font-medium text-white/50 tracking-widest uppercase mt-0.5">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Top Right Corner: Full Screen Player Page Button */}
        <button
          onClick={() => setIsFullScreenOpen(true)}
          className="px-3 py-1.5 rounded-2xl bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-2xl border border-white/20 text-xs font-semibold text-white/90 hover:text-white flex items-center gap-2 shadow-xl transition-all active:scale-95"
          title="Open Full Screen Player Page"
        >
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Full Screen Player</span>
        </button>
      </header>

      {/* Main Interactive Stage: 3D Cover Flow + Right Side Live Lyrics Card */}
      <div className="w-full flex-1 flex flex-col xl:flex-row items-center justify-center gap-6 max-w-7xl px-4 relative z-20 py-4">
        {/* Left/Center: 3D Cover Flow Carousel */}
        <div className="flex-1 w-full flex items-center justify-center">
          <CoverFlow
            tracks={TRACKS}
            activeIndex={playerState.currentTrackIndex}
            onSelectTrack={handleSelectTrack}
          />
        </div>

        {/* Right Side: Live Synced Lyrics Card */}
        <div className="shrink-0 flex items-center justify-center">
          <LiveLyricsSideCard
            track={currentTrack}
            playerState={playerState}
            onSeek={handleSeek}
          />
        </div>
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

      {/* Full Screen Dedicated Player & Lyrics Page */}
      {isFullScreenOpen && (
        <FullScreenNowPlaying
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
