import { useState, useEffect, useRef, useMemo } from 'react';
import { Track, PlayerState } from '../../types';
import { getLyricsForTrack, fetchLyricsForTrack, LyricLine } from '../../data/lyrics';
import { LineMaskSplit } from '../LineMaskSplit';

interface SyncedLyricsProps {
  track: Track;
  playerState: PlayerState;
  onSeek: (timeSeconds: number) => void;
}

export function SyncedLyrics({ track, playerState, onSeek }: SyncedLyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lyrics, setLyrics] = useState<LyricLine[]>(() => {
    return getLyricsForTrack(track.id, track.title, track.artist);
  });

  // Load real-time LRC file for active track
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

  // Derived active lyric index (Section 10 - sync logic)
  const activeLyricIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return 0;
    const currentTime = playerState.progress;
    let idx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyrics, playerState.progress]);

  // Auto-scroll active line to fixed vertical anchor point (Section 11)
  useEffect(() => {
    if (lineRefs.current[activeLyricIndex] && containerRef.current) {
      lineRefs.current[activeLyricIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex]);

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/50 text-sm italic p-6">
        <p>Lyrics unavailable for this track</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full max-h-[480px] flex flex-col justify-center overflow-hidden relative select-none">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-2 py-8 space-y-6 text-left scrollbar-none"
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === activeLyricIndex;
          const isPast = idx < activeLyricIndex;

          return (
            <div key={idx} ref={(el) => (lineRefs.current[idx] = el)}>
              <LineMaskSplit
                text={line.text}
                isActive={isActive}
                isPast={isPast}
                accentColor={track.accentColor || 'rgba(255, 255, 255, 0.6)'}
                splitMode="words"
                blurIntensity={16}
                onClick={() => onSeek(line.time)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
