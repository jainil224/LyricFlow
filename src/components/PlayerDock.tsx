import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ListMusic
} from 'lucide-react';
import { Track, PlayerState } from '../types';
import { getUniqueFallbackCover } from '../utils/artworkResolver';

interface PlayerDockProps {
  currentTrack: Track;
  playerState: PlayerState;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (newTime: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onOpenLibrary?: () => void;
}

export function PlayerDock({
  currentTrack,
  playerState,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenLibrary,
}: PlayerDockProps) {
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showSongDetailsModal, setShowSongDetailsModal] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const progressPercent = currentTrack.duration > 0
    ? (playerState.progress / currentTrack.duration) * 100
    : 0;

  const seekFromClientX = (clientX: number) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage * currentTrack.duration);
  };

  const handleScrubMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);
    seekFromClientX(e.clientX);
  };

  const handleScrubTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.touches.length > 0) {
      setIsScrubbing(true);
      seekFromClientX(e.touches[0].clientX);
    }
  };

  // Dragging forward & backward event listeners
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isScrubbing) {
        seekFromClientX(e.clientX);
      }
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (isScrubbing && e.touches.length > 0) {
        seekFromClientX(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isScrubbing]);

  // Close volume and song details modals on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#volume-popover') && !target.closest('#volume-btn')) {
        setShowVolumePopup(false);
      }
      if (!target.closest('#song-details-popover') && !target.closest('#song-details-btn')) {
        setShowSongDetailsModal(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-40 w-full max-w-4xl px-4 flex flex-col items-center">
      {/* High-Contrast Glassmorphic Pill Dock */}
      <div
        id="player-dock-pill"
        className="w-full bg-stone-950/90 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/80 rounded-full px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300"
      >
        {/* Left Side: Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="prev-track-btn"
            onClick={onPrevTrack}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 rounded-full focus:outline-none"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          <button
            id="play-pause-btn"
            onClick={onTogglePlay}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-stone-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-white/20 focus:outline-none"
            title={playerState.isPlaying ? 'Pause' : 'Play'}
          >
            {playerState.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="next-track-btn"
            onClick={onNextTrack}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 rounded-full focus:outline-none"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </div>

        {/* Center: Sleek Embedded Mini Track Info & Scrub Bar */}
        <div
          id="center-mini-player-pill"
          className="group flex-1 max-w-[270px] sm:max-w-[340px] bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl px-3 py-1.5 flex items-center justify-between gap-3 border border-white/15 relative overflow-hidden transition-all duration-200 shadow-sm"
        >
          {/* Mini Album Cover & Track Text Info - Click to Open Library */}
          <button
            onClick={() => onOpenLibrary?.()}
            className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to view all songs"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0 border border-white/20 relative shadow-sm">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getUniqueFallbackCover(currentTrack);
                }}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <span className="text-white font-semibold text-xs sm:text-sm leading-tight truncate">
                {currentTrack.artist}{currentTrack.featuredArtist ? ` ft. ${currentTrack.featuredArtist}` : ''}
              </span>
              <span className="text-white/70 text-[10px] sm:text-xs leading-tight truncate">
                {currentTrack.title}{currentTrack.version ? ` (${currentTrack.version})` : ''}
              </span>
            </div>
          </button>

          {/* Equalizer soundwave animation & Options button */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            {playerState.isPlaying ? (
              <div className="flex items-end gap-[3px] h-3.5 px-0.5">
                <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3.5" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2.5" />
              </div>
            ) : (
              <div className="flex items-end gap-[3px] h-3.5 px-0.5 opacity-50">
                <span className="w-0.5 bg-white/70 rounded-full h-2" />
                <span className="w-0.5 bg-white/70 rounded-full h-1" />
                <span className="w-0.5 bg-white/70 rounded-full h-2" />
                <span className="w-0.5 bg-white/70 rounded-full h-1.5" />
              </div>
            )}

            <button
              id="song-details-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowSongDetailsModal(!showSongDetailsModal);
              }}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Song Details & Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Song Details Popover */}
            {showSongDetailsModal && (
              <div
                id="song-details-popover"
                className="absolute bottom-10 right-0 w-60 bg-stone-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-9 h-9 rounded-lg object-cover border border-white/15"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getUniqueFallbackCover(currentTrack);
                    }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-xs font-bold truncate text-white">{currentTrack.title}</h4>
                    <p className="text-[11px] text-white/60 truncate">{currentTrack.artist}</p>
                  </div>
                </div>

                <div className="py-2 space-y-1 text-[11px] text-white/70">
                  <div className="flex justify-between">
                    <span className="text-white/40">Album:</span>
                    <span className="font-medium text-white truncate max-w-[130px]">{currentTrack.album}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Label:</span>
                    <span className="font-medium text-amber-300">{currentTrack.badge || 'Indie'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Tempo:</span>
                    <span className="font-mono text-white/90">{currentTrack.bpm} BPM</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowSongDetailsModal(false);
                      onOpenLibrary?.();
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-medium text-xs text-left transition flex items-center justify-between"
                  >
                    <span>View All 21 Songs</span>
                    <ListMusic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Drag & Seek Scrub Line (Move Forward & Backward) */}
          <div
            ref={progressBarRef}
            onMouseDown={handleScrubMouseDown}
            onTouchStart={handleScrubTouchStart}
            className="absolute bottom-0 left-0 right-0 h-2.5 bg-white/10 hover:bg-white/20 cursor-pointer group/scrub flex items-center transition-all z-20"
            title="Click or drag to move forward & backward in song"
          >
            <div
              className="h-1 group-hover/scrub:h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 rounded-full transition-all relative flex items-center"
              style={{ width: `${progressPercent}%` }}
            >
              <div
                className={`absolute -right-1.5 w-3.5 h-3.5 rounded-full bg-white shadow-md border border-amber-400 transition-all ${
                  isScrubbing ? 'scale-125 opacity-100' : 'opacity-0 group-hover/scrub:opacity-100'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Song Library & Volume */}
        <div className="flex items-center gap-1 sm:gap-2 text-white/80">
          {/* Song Library Drawer Button */}
          {onOpenLibrary && (
            <button
              id="song-library-btn"
              onClick={onOpenLibrary}
              className="p-2 rounded-full transition-all duration-150 text-white/80 hover:text-amber-400 hover:bg-white/10"
              title="View All Songs & Cover Art"
            >
              <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Volume Control */}
          <div className="relative">
            <button
              id="volume-btn"
              onClick={() => setShowVolumePopup(!showVolumePopup)}
              onDoubleClick={onToggleMute}
              className="p-2 rounded-full transition-all duration-150 hover:text-white hover:bg-white/10"
              title="Volume control (Double click to mute)"
            >
              {playerState.isMuted || playerState.volume === 0 ? (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Volume Popover Slider */}
            {showVolumePopup && (
              <div
                id="volume-popover"
                className="absolute bottom-14 right-0 w-44 bg-stone-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                  <span>Volume</span>
                  <span className="font-mono">{Math.round(playerState.isMuted ? 0 : playerState.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={playerState.isMuted ? 0 : playerState.volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 bg-white/20 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
