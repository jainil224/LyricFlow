import { useState, useEffect, useRef } from 'react';
import { X, Mic, Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { Track, PlayerState } from '../types';
import { getLyricsForTrack, fetchLyricsForTrack, LyricLine } from '../data/lyrics';
import { getUniqueFallbackCover } from '../utils/artworkResolver';

interface LyricsModalProps {
  track: Track;
  playerState: PlayerState;
  onClose: () => void;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
}

export function LyricsModal({
  track,
  playerState,
  onClose,
  onSeek,
  onTogglePlay,
}: LyricsModalProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load lyrics for the active track
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

  // Calculate current active lyric line based on playback time
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

    // Auto scroll to active line
    if (autoScroll && lineRefs.current[index]) {
      lineRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [playerState.progress, lyrics, autoScroll]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl transition-all duration-300 animate-in fade-in">
      <div
        className="w-full max-w-xl max-h-[88dvh] bg-stone-950/90 border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white relative shadow-amber-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getUniqueFallbackCover(track);
                }}
              />
            </div>

            <div className="flex flex-col min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Live Synced Lyrics
                </span>
              </div>
              <h3 className="text-sm font-bold text-white truncate">{track.title}</h3>
              <p className="text-xs text-white/60 truncate">{track.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                autoScroll
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/20 text-white/60 hover:text-white'
              }`}
              title="Toggle Auto-scroll"
            >
              {autoScroll ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              <span>Auto-Scroll</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Lyrics"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Karaoke Lyrics Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-8 space-y-4 text-center scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40"
        >
          {lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={idx}
                ref={(el) => (lineRefs.current[idx] = el)}
                onClick={() => onSeek(line.time)}
                className={`py-2.5 px-4 rounded-2xl cursor-pointer transition-all duration-300 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/25 via-rose-500/20 to-amber-500/25 text-amber-200 font-bold text-lg sm:text-xl border border-amber-400/40 shadow-lg shadow-amber-500/10 scale-105'
                    : isPast
                    ? 'text-white/40 text-sm sm:text-base hover:text-white/70'
                    : 'text-white/75 text-sm sm:text-base hover:text-white'
                }`}
              >
                <p className="leading-snug tracking-wide">{line.text}</p>
                {isActive && (
                  <span className="inline-block mt-1 text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">
                    Tap to jump • {Math.floor(line.time / 60)}:{(Math.floor(line.time % 60)).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Quick Player Controls Bar */}
        <div className="p-3 border-t border-white/10 bg-stone-900/80 backdrop-blur-md flex items-center justify-between px-6">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-stone-950 font-bold text-xs hover:scale-105 transition-transform"
          >
            {playerState.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Play</span>
              </>
            )}
          </button>

          <span className="text-xs font-mono text-white/60">
            {Math.floor(playerState.progress / 60)}:{(Math.floor(playerState.progress % 60)).toString().padStart(2, '0')} / {Math.floor(track.duration / 60)}:{(Math.floor(track.duration % 60)).toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
