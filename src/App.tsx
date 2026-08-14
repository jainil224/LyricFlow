import { useState, useEffect, useCallback } from 'react';
import { Music2 } from 'lucide-react';
import { TRACKS } from './data/tracks';
import { CoverFlow } from './components/CoverFlow';
import { PlayerDock } from './components/PlayerDock';
import { DynamicMusicBackground } from './components/DynamicMusicBackground';
import { PlayerState } from './types';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrackIndex: 2, // Default to Charlie Puth - How Long (center card in reference image)
    isPlaying: false,
    progress: 42,
    volume: 0.8,
    isMuted: false,
    isAirplayActive: false,
    isEqOpen: false,
  });

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
    setPlayerState((prev) => ({
      ...prev,
      progress: Math.max(0, Math.min(currentTrack.duration, newTime)),
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

  return (
    <DynamicMusicBackground track={currentTrack} isPlaying={playerState.isPlaying}>
      {/* Top Subtle Ambient Light Flare */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* LyricFlow Header Badge */}
      <header className="relative z-30 w-full max-w-4xl pt-1.5 px-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-full shadow-lg">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 flex items-center justify-center text-white shadow-md">
            <Music2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-white font-bold text-sm tracking-wide">LyricFlow</span>
            <span className="text-white/60 text-[10px] tracking-tight">Stream the best in English music</span>
          </div>
        </div>
      </header>

      {/* Center 3D Cover Flow Display */}
      <div className="w-full flex-1 flex items-center justify-center relative z-20 py-6">
        <CoverFlow
          tracks={TRACKS}
          activeIndex={playerState.currentTrackIndex}
          onSelectTrack={handleSelectTrack}
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
        />
      </div>
    </DynamicMusicBackground>
  );
}
