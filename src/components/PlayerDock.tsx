import { useState, useRef, useEffect, MouseEvent } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Cast,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Check,
  Radio,
  Sparkles
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
}: PlayerDockProps) {
  const [showAirplayModal, setShowAirplayModal] = useState(false);
  const [showEqModal, setShowEqModal] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('Studio Display Audio');
  const [eqPreset, setEqPreset] = useState<'Standard' | 'Bass Boost' | 'Vocal' | 'Acoustic'>('Standard');

  const progressBarRef = useRef<HTMLDivElement>(null);

  const progressPercent = currentTrack.duration > 0
    ? (playerState.progress / currentTrack.duration) * 100
    : 0;

  const handleProgressBarClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage * currentTrack.duration);
  };

  // Close modals on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#airplay-popover') && !target.closest('#airplay-btn')) {
        setShowAirplayModal(false);
      }
      if (!target.closest('#eq-popover') && !target.closest('#eq-btn')) {
        setShowEqModal(false);
      }
      if (!target.closest('#volume-popover') && !target.closest('#volume-btn')) {
        setShowVolumePopup(false);
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
        className="w-full bg-stone-950/85 sm:bg-black/75 backdrop-blur-3xl border border-white/20 rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(0,0,0,0.3)] flex items-center justify-between gap-2 sm:gap-6 relative"
      >
        {/* Left Side: Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-white">
          <button
            id="prev-track-btn"
            onClick={onPrevTrack}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 rounded-full focus:outline-none"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          {/* Elevated Tactile Play/Pause Button */}
          <button
            id="toggle-play-btn"
            onClick={onTogglePlay}
            className="p-2.5 sm:p-3 bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-150 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.3)] focus:outline-none"
            title={playerState.isPlaying ? 'Pause' : 'Play'}
          >
            {playerState.isPlaying ? (
              <Pause className="w-5 h-5 sm:w-5 sm:h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-5 sm:h-5 fill-current ml-0.5" />
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
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="cursor-pointer group flex-1 max-w-[270px] sm:max-w-[340px] bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl px-3 py-1.5 flex items-center justify-between gap-3 border border-white/15 relative overflow-hidden transition-all duration-200 shadow-sm"
        >
          {/* Mini Album Cover */}
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

          {/* Track Text Info */}
          <div className="flex-1 min-w-0 flex flex-col text-left">
            <span className="text-white font-semibold text-xs sm:text-sm leading-tight truncate">
              {currentTrack.artist}{currentTrack.featuredArtist ? ` ft. ${currentTrack.featuredArtist}` : ''}
            </span>
            <span className="text-white/70 text-[10px] sm:text-xs leading-tight truncate">
              {currentTrack.title}{currentTrack.version ? ` (${currentTrack.version})` : ''}
            </span>
          </div>

          {/* Equalizer soundwave animation & options */}
          <div className="flex items-center gap-2 shrink-0">
            {playerState.isPlaying ? (
              <div className="flex items-end gap-[3px] h-3.5 px-0.5">
                <span className="w-0.5 bg-rose-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-0.5 bg-rose-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2" />
                <span className="w-0.5 bg-rose-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3.5" />
                <span className="w-0.5 bg-rose-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2.5" />
              </div>
            ) : (
              <div className="flex items-end gap-[3px] h-3.5 px-0.5 opacity-50">
                <span className="w-0.5 bg-white/70 rounded-full h-2" />
                <span className="w-0.5 bg-white/70 rounded-full h-1" />
                <span className="w-0.5 bg-white/70 rounded-full h-2" />
                <span className="w-0.5 bg-white/70 rounded-full h-1.5" />
              </div>
            )}
            <MoreHorizontal className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          </div>

          {/* Interactive Bottom Progress Scrub Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 transition-all duration-100 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Right Side: Airplay, Equalizer & Volume */}
        <div className="flex items-center gap-1 sm:gap-2 text-white/80">
          {/* Airplay button */}
          <div className="relative">
            <button
              id="airplay-btn"
              onClick={() => setShowAirplayModal(!showAirplayModal)}
              className={`p-2 rounded-full transition-all duration-150 hover:text-white hover:bg-white/10 ${
                showAirplayModal ? 'text-rose-400 bg-white/15' : ''
              }`}
              title="AirPlay & Wireless Devices"
            >
              <Cast className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* AirPlay Popover */}
            {showAirplayModal && (
              <div
                id="airplay-popover"
                className="absolute bottom-14 right-0 w-64 bg-stone-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/70">
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>AirPlay & Devices</span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {['Studio Display Audio', 'Living Room HomePod', 'AirPods Pro (2nd gen)', 'MacBook Pro Speakers'].map(
                    (device) => (
                      <button
                        key={device}
                        onClick={() => {
                          setSelectedDevice(device);
                          setShowAirplayModal(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs hover:bg-white/10 transition-colors"
                      >
                        <span className={selectedDevice === device ? 'text-rose-300 font-medium' : 'text-white/80'}>
                          {device}
                        </span>
                        {selectedDevice === device && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* EQ / Sound settings */}
          <div className="relative">
            <button
              id="eq-btn"
              onClick={() => setShowEqModal(!showEqModal)}
              className={`p-2 rounded-full transition-all duration-150 hover:text-white hover:bg-white/10 ${
                showEqModal ? 'text-amber-400 bg-white/15' : ''
              }`}
              title="Audio Equalizer"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* EQ Popover */}
            {showEqModal && (
              <div
                id="eq-popover"
                className="absolute bottom-14 right-0 w-56 bg-stone-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/70">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sound Profile</span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  {(['Standard', 'Bass Boost', 'Vocal', 'Acoustic'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setEqPreset(preset);
                        setShowEqModal(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <span className={eqPreset === preset ? 'text-amber-300 font-medium' : 'text-white/80'}>
                        {preset}
                      </span>
                      {eqPreset === preset && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
