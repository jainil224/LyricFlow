import { useState, useEffect, useRef, MouseEvent } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Airplay
} from 'lucide-react';
import { Track, PlayerState } from '../../types';

interface PlayerControlsProps {
  track: Track;
  playerState: PlayerState;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (timeSeconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export function PlayerControls({
  track,
  playerState,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: PlayerControlsProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const timeoutRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Inactivity auto-fade listener (Section 21)
  useEffect(() => {
    const handleActivity = () => {
      setIsVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
    <div
      className={`relative z-30 w-full max-w-xl mx-auto pb-4 sm:pb-8 px-4 shrink-0 flex flex-col items-center gap-2 sm:gap-3 transition-opacity duration-500 pb-safe ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Floating Control Bar */}
      <div className="bg-stone-950/85 backdrop-blur-2xl border border-white/20 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2.5 sm:gap-6 shadow-2xl shadow-black/80 w-full max-w-full">
        <button
          onClick={onPrevTrack}
          className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all"
          title="Previous Track"
        >
          <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-stone-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20 shrink-0"
          title={playerState.isPlaying ? 'Pause' : 'Play'}
        >
          {playerState.isPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={onNextTrack}
          className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </button>

        {/* Volume Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-white/70 pl-2 sm:pl-4 border-l border-white/15">
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
            className="w-14 xs:w-20 sm:w-24 accent-white bg-white/20 h-1 rounded-lg cursor-pointer"
          />
          <Volume2 className="w-4 h-4 hidden xs:inline-block" />
        </div>

        <button className="p-1 rounded-full text-white/70 hover:text-white transition-colors hidden xs:block" title="AirPlay">
          <Airplay className="w-4 h-4" />
        </button>
      </div>

      {/* Scrub Line directly above controls */}
      <div className="w-full max-w-lg space-y-1">
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all relative overflow-hidden"
          title="Click to seek audio position"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-white/60 px-1">
          <span>{formattedCurrent}</span>
          <span>{formattedRemaining}</span>
        </div>
      </div>
    </div>
  );
}
