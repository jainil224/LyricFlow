import { useState, useEffect, useCallback } from 'react';
import { Maximize2, ChevronDown } from 'lucide-react';
import { TRACKS } from './data/tracks';
import { BOLLYWOOD_TRACKS } from './data/bollywoodTracks';
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
  const [activeGenre, setActiveGenre] = useState<'english' | 'bollywood'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('bollywood')) return 'bollywood';
    return 'english';
  });
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState<boolean>(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrackIndex: 3, // Default to Prateek Kuhad - CO2 for all first-time visitors
    isPlaying: false,
    progress: 0,
    volume: 0.8,
    isMuted: false,
    isAirplayActive: false,
    isEqOpen: false,
  });

  // Active track list based on selected genre
  const ACTIVE_TRACKS = activeGenre === 'bollywood' ? BOLLYWOOD_TRACKS : TRACKS;

  const currentTrack = (ACTIVE_TRACKS && ACTIVE_TRACKS[playerState.currentTrackIndex]) || ACTIVE_TRACKS[0];

  // Switch genre and reset to first track
  const handleGenreSwitch = useCallback((genre: 'english' | 'bollywood') => {
    setActiveGenre(genre);
    setPlayerState(prev => ({ ...prev, currentTrackIndex: 0, progress: 0, isPlaying: false }));
    
    // Update URL
    const urlPath = genre === 'bollywood' ? "/90's bollywood song" : "/english songs";
    window.history.pushState({}, '', urlPath);
  }, []);

  // Select Track
  const handleSelectTrack = useCallback((index: number) => {
    audioEngine.unlock();
    setPlayerState((prev) => {
      const nextIndex = Math.max(0, Math.min(ACTIVE_TRACKS.length - 1, index));
      if (prev.isPlaying) {
        audioEngine.play(ACTIVE_TRACKS[nextIndex].melodyType, ACTIVE_TRACKS[nextIndex].bpm, ACTIVE_TRACKS[nextIndex].audioUrl);
      }
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        progress: 0,
      };
    });
  }, [ACTIVE_TRACKS]);

  // Prev / Next
  const handlePrevTrack = useCallback(() => {
    audioEngine.unlock();
    setPlayerState((prev) => {
      const nextIndex = prev.currentTrackIndex > 0 ? prev.currentTrackIndex - 1 : ACTIVE_TRACKS.length - 1;
      if (prev.isPlaying) {
        audioEngine.play(ACTIVE_TRACKS[nextIndex].melodyType, ACTIVE_TRACKS[nextIndex].bpm, ACTIVE_TRACKS[nextIndex].audioUrl);
      }
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        progress: 0,
      };
    });
  }, [ACTIVE_TRACKS]);

  const handleNextTrack = useCallback(() => {
    audioEngine.unlock();
    setPlayerState((prev) => {
      const nextIndex = prev.currentTrackIndex < ACTIVE_TRACKS.length - 1 ? prev.currentTrackIndex + 1 : 0;
      if (prev.isPlaying) {
        audioEngine.play(ACTIVE_TRACKS[nextIndex].melodyType, ACTIVE_TRACKS[nextIndex].bpm, ACTIVE_TRACKS[nextIndex].audioUrl);
      }
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        progress: 0,
      };
    });
  }, [ACTIVE_TRACKS]);

  // Toggle Play/Pause
  const handleTogglePlay = useCallback(() => {
    audioEngine.unlock();
    setPlayerState((prev) => {
      const nextPlaying = !prev.isPlaying;
      if (nextPlaying) {
        audioEngine.setVolume(prev.isMuted ? 0 : prev.volume);
        audioEngine.play(ACTIVE_TRACKS[prev.currentTrackIndex].melodyType, ACTIVE_TRACKS[prev.currentTrackIndex].bpm, ACTIVE_TRACKS[prev.currentTrackIndex].audioUrl);
      } else {
        audioEngine.pause();
      }
      return { ...prev, isPlaying: nextPlaying };
    });
  }, [ACTIVE_TRACKS]);

  // Seek
  const handleSeek = useCallback((newTime: number) => {
    const clampedTime = Math.max(0, Math.min(currentTrack ? currentTrack.duration : 180, newTime));
    audioEngine.seek(clampedTime);
    setPlayerState((prev) => ({
      ...prev,
      progress: clampedTime,
    }));
  }, [currentTrack]);

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

  // Real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync URL on initial mount and listen for back/forward buttons
  useEffect(() => {
    if (window.location.pathname === '/') {
      const urlPath = activeGenre === 'bollywood' ? "/90's bollywood song" : "/english songs";
      window.history.replaceState({}, '', urlPath);
    }

    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const genre = path.includes('bollywood') ? 'bollywood' : 'english';
      setActiveGenre(genre);
      // Reset player if genre changed via back button
      setPlayerState(prev => ({ ...prev, currentTrackIndex: 0, progress: 0, isPlaying: false }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeGenre]);

  // Preload adjacent tracks in background for instant zero-latency mobile playback
  useEffect(() => {
    const nextIdx = (playerState.currentTrackIndex + 1) % ACTIVE_TRACKS.length;
    const prevIdx = (playerState.currentTrackIndex - 1 + ACTIVE_TRACKS.length) % ACTIVE_TRACKS.length;
    audioEngine.preloadTrack(ACTIVE_TRACKS[nextIdx].audioUrl);
    audioEngine.preloadTrack(ACTIVE_TRACKS[prevIdx].audioUrl);
  }, [playerState.currentTrackIndex, ACTIVE_TRACKS]);

  // Connect Mobile Media Session API for native hardware volume buttons & lock screen controls
  useEffect(() => {
    if (!currentTrack) return;
    audioEngine.updateMediaSession(currentTrack, {
      onPlay: handleTogglePlay,
      onPause: handleTogglePlay,
      onNext: handleNextTrack,
      onPrev: handlePrevTrack,
      onSeek: handleSeek,
    });
  }, [currentTrack, handleTogglePlay, handleNextTrack, handlePrevTrack, handleSeek]);

  if (!currentTrack) return null;

  // Real-time zero-latency audio progress subscriber & ticker
  useEffect(() => {
    // 1. Listen for native audio track end to automatically play next song
    const unsubscribeEnded = audioEngine.subscribeEnded(() => {
      handleNextTrack();
    });

    // 2. Instant ontimeupdate subscriber for 0ms latency audio sync
    const unsubscribeTime = audioEngine.subscribeTime((exactTime) => {
      setPlayerState((prev) => ({ ...prev, progress: exactTime }));
    });

    // 3. High-frequency 100ms ticker fallback for synthesised/non-HTML5 tracks
    let interval: number | null = null;
    if (playerState.isPlaying) {
      interval = window.setInterval(() => {
        setPlayerState((prev) => {
          const exactTime = audioEngine.getCurrentTime();
          if (exactTime !== null) return prev; // Managed by native audio engine & subscriber above
          const track = ACTIVE_TRACKS[prev.currentTrackIndex];
          const nextProgress = prev.progress + 0.1;
          if (nextProgress >= track.duration) {
            handleNextTrack();
            return { ...prev, progress: 0 };
          }
          return { ...prev, progress: nextProgress };
        });
      }, 100);
    }

    return () => {
      unsubscribeEnded();
      unsubscribeTime();
      if (interval) clearInterval(interval);
    };
  }, [playerState.isPlaying, handleNextTrack]);

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

        {/* 🎵 Genre Dropdown Menu */}
        <div className="relative mt-1">
          <button
            onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-2xl shadow-2xl border border-white/20 transition-all duration-300"
            style={{
              background: activeGenre === 'bollywood'
                ? 'linear-gradient(135deg, rgba(220,38,38,0.45), rgba(234,179,8,0.35))'
                : 'rgba(28,25,23,0.85)',
            }}
          >
            {activeGenre === 'english' ? (
              <>
                <span className="text-sm">🎵</span>
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">English Songs</span>
              </>
            ) : (
              <>
                <span className="text-sm">🪔</span>
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">90s Bollywood</span>
              </>
            )}
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 transition-transform duration-300 ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Options Container */}
          {isGenreDropdownOpen && (
            <>
              {/* Invisible overlay to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsGenreDropdownOpen(false)} 
              />
              <div className="absolute top-full mt-2 sm:mt-3 left-1/2 -translate-x-1/2 w-48 sm:w-56 flex flex-col p-1.5 bg-stone-900/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] overflow-hidden z-50 transform origin-top animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => {
                    handleGenreSwitch('english');
                    setIsGenreDropdownOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeGenre === 'english' 
                      ? 'bg-white/15 text-white shadow-inner border border-white/10' 
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base drop-shadow-md">🎵</span> English Songs
                </button>
                <div className="h-px w-full bg-white/5 my-0.5" />
                <button
                  onClick={() => {
                    handleGenreSwitch('bollywood');
                    setIsGenreDropdownOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeGenre === 'bollywood' 
                      ? 'bg-gradient-to-r from-red-600/30 to-yellow-600/30 text-white shadow-inner border border-orange-400/20' 
                      : 'text-white/60 hover:bg-orange-500/15 hover:text-orange-200'
                  }`}
                >
                  <span className="text-base drop-shadow-md">🪔</span> 90s Bollywood
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Interactive Stage: Centered 3D Cover Flow Carousel */}
      <div className="w-full flex-1 flex items-center justify-center max-w-7xl px-2 sm:px-4 relative z-20 pt-1 pb-16 sm:py-4 my-auto">
        <CoverFlow
          tracks={ACTIVE_TRACKS}
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
        bollywoodTracks={BOLLYWOOD_TRACKS}
        activeGenre={activeGenre}
        onGenreSwitch={handleGenreSwitch}
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
