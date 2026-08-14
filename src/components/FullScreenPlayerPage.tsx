import { useState, useEffect, useRef, MouseEvent } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Track, PlayerState } from '../types';
import { getLyricsForTrack, fetchLyricsForTrack, LyricLine } from '../data/lyrics';
import { getUniqueFallbackCover } from '../utils/artworkResolver';

interface FullScreenPlayerPageProps {
  track: Track;
  playerState: PlayerState;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export function FullScreenPlayerPage({
  track,
  playerState,
  onClose,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
}: FullScreenPlayerPageProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Load lyrics for active track
  useEffect(() => {
    let isMounted = true;
    const initial = getLyricsForTrack(track.id, track.title, track.artist);
    setLyrics(initial);

    fetchLyricsForTrack(track.id).then((loaded) => {
      if (isMounted && loaded.length > 0) {
        setLyrics(loaded);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [track.id, track.title, track.artist]);

  // Sync active line with playerState.progress
  useEffect(() => {
    if (lyrics.length === 0) return;

    const currentTime = playerState.progress;
    let index = 0;

    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }

    setActiveIndex(index);

    // Smooth auto scroll active lyric line
    if (lineRefs.current[index] && containerRef.current) {
      lineRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [playerState.progress, lyrics]);

  // Calculate elapsed & remaining time
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
    <div className="fixed inset-0 z-50 flex flex-col justify-between h-[100dvh] w-screen overflow-hidden bg-stone-950 text-white select-none animate-in fade-in duration-300">
      {/* 1. Dynamic Beat-Reactive Blurred Background Canvas */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-60 scale-125 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${track.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-transparent to-black/60 pointer-events-none" />

      {/* 2. Top Header Bar */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">
            Full Screen Now Playing
          </span>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-xl active:scale-95"
          title="Exit Full Screen"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Full Screen</span>
        </button>
      </div>

      {/* 3. Main Split Stage (Left Artwork + Controls | Right Floating Live Synced Lyrics) */}
      <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-12 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-16 overflow-hidden py-1 sm:py-2">
        {/* Left Side: Large Album Sleeve & Integrated Scrub Bar (Matching Reference Screenshot) */}
        <div className="flex flex-col items-center lg:items-start gap-2 sm:gap-4 shrink-0 w-full sm:w-[320px] lg:w-[360px]">
          {/* Prominent Square Album Artwork */}
          <div className="w-44 h-44 xs:w-56 xs:h-56 sm:w-64 sm:h-64 lg:w-[360px] lg:h-[360px] aspect-square rounded-2xl overflow-hidden border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative group mx-auto lg:mx-0 shrink-0">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getUniqueFallbackCover(track);
              }}
            />
            {track.badge && (
              <span className="absolute top-2.5 left-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest text-white uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-md">
                {track.badge}
              </span>
            )}
          </div>

          {/* Integrated Scrub Bar & Song Info directly under Album Sleeve (Exact Image Match) */}
          <div className="w-full max-w-[280px] sm:max-w-full space-y-1 pt-0.5 sm:pt-1">
            {/* Progress line */}
            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all relative overflow-hidden"
              title="Click to seek audio"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Timestamps */}
            <div className="flex justify-between text-[10px] sm:text-[11px] font-mono text-white/60">
              <span>{formattedCurrent}</span>
              <span>{formattedRemaining}</span>
            </div>

            {/* Song Title & Album Description */}
            <div className="flex flex-col text-center lg:text-left pt-0.5">
              <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate drop-shadow">
                {track.title} ({track.album})
              </h3>
              <p className="text-xs font-medium text-white/70 truncate">
                {track.artist}{track.featuredArtist ? ` ft. ${track.featuredArtist}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Live Synced Lyrics (Matching Reference Screenshot Right Side) */}
        <div className="flex-1 w-full h-full max-h-[200px] xs:max-h-[260px] sm:max-h-[360px] lg:max-h-[460px] flex flex-col justify-center overflow-hidden relative">
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-2 py-4 sm:py-8 space-y-4 sm:space-y-6 text-center lg:text-left scrollbar-none"
          >
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;

              return (
                <div
                  key={idx}
                  ref={(el) => (lineRefs.current[idx] = el)}
                  onClick={() => onSeek(line.time)}
                  className={`cursor-pointer transition-all duration-500 select-none origin-center lg:origin-left ${
                    isActive
                      ? 'text-white font-extrabold text-lg xs:text-2xl sm:text-3xl lg:text-4xl leading-tight drop-shadow-[0_4px_20px_rgba(255,255,255,0.6)] scale-[1.02] opacity-100'
                      : 'text-white/35 font-bold text-sm sm:text-2xl leading-tight blur-[0.5px] hover:blur-none hover:text-white/75 transition-all duration-300'
                  }`}
                >
                  <p>{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Tactile Floating Controls Dock */}
      <div className="relative z-30 w-full max-w-xl mx-auto pb-4 sm:pb-8 px-4 shrink-0 flex justify-center pb-safe">
        <div className="bg-stone-950/80 backdrop-blur-2xl border border-white/20 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-3 sm:gap-6 shadow-2xl">
          <button
            onClick={onPrevTrack}
            className="text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-stone-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
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

          {/* Volume (Desktop only, hidden on phone view) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-white/70 pl-3 sm:pl-4 border-l border-white/15">
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
            <Volume2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
