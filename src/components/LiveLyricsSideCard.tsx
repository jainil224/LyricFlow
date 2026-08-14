import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Track, PlayerState } from '../types';
import { getLyricsForTrack, fetchLyricsForTrack, LyricLine } from '../data/lyrics';
import { getUniqueFallbackCover } from '../utils/artworkResolver';
import { LineMaskSplit } from './LineMaskSplit';

interface LiveLyricsSideCardProps {
  track: Track;
  playerState: PlayerState;
  onSeek: (time: number) => void;
}

export function LiveLyricsSideCard({ track, playerState, onSeek }: LiveLyricsSideCardProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    // Smooth auto scroll to active lyric line inside card
    if (lineRefs.current[index] && containerRef.current) {
      lineRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [playerState.progress, lyrics]);

  const remainingSeconds = Math.max(0, Math.floor(track.duration - playerState.progress));
  const remMins = Math.floor(remainingSeconds / 60);
  const remSecs = Math.floor(remainingSeconds % 60);
  const formattedRemaining = `-${remMins}:${remSecs < 10 ? '0' : ''}${remSecs}`;

  const progressPercent = track.duration > 0
    ? (playerState.progress / track.duration) * 100
    : 0;

  return (
    <div className="w-full max-w-[340px] lg:max-w-[360px] h-[310px] sm:h-[360px] bg-stone-950/90 backdrop-blur-3xl border border-white/20 rounded-3xl p-4 shadow-2xl shadow-black/90 flex flex-col relative overflow-hidden transition-all duration-300 select-none group">
      {/* Heavy Blurred Cover Art Background Layer (Apple Music Ambient Blur) */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-125 opacity-40 pointer-events-none transition-all duration-1000"
        style={{ backgroundImage: `url(${track.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/40 to-stone-950/90 pointer-events-none" />

      {/* Header Bar (Matching Image: Cover thumbnail + Track info + '...' option button) */}
      <div className="flex items-center justify-between pb-3 relative z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getUniqueFallbackCover(track);
            }}
          />
          <div className="flex flex-col text-left min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow">
              {track.title}
            </h4>
            <p className="text-[11px] font-medium text-white/60 truncate">
              {track.artist}
            </p>
          </div>
        </div>

        <button
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all shrink-0"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Apple Music Style Live Lyrics Auto-Scrolling List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-1 py-4 space-y-4 text-left scrollbar-none relative z-10"
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;

          return (
            <div key={idx} ref={(el) => (lineRefs.current[idx] = el)}>
              <LineMaskSplit
                text={line.text}
                isActive={isActive}
                isPast={isPast}
                accentColor={track.accentColor || 'rgba(255, 255, 255, 0.6)'}
                splitMode="words"
                blurIntensity={12}
                onClick={() => onSeek(line.time)}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Scrub Progress Line & Time Remaining Countdown (Matching Image) */}
      <div className="pt-3 relative z-10 shrink-0 flex flex-col gap-1">
        <div className="w-full h-[3px] bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-end text-[10px] font-mono text-white/50 pt-0.5">
          <span>{formattedRemaining}</span>
        </div>
      </div>
    </div>
  );
}
