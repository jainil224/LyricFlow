import { Track } from '../../types';
import { getUniqueFallbackCover } from '../../utils/artworkResolver';

interface AlbumArtProps {
  track: Track;
  isPlaying: boolean;
}

export function AlbumArt({ track }: AlbumArtProps) {
  return (
    <div
      className="w-44 h-44 xs:w-56 xs:h-56 sm:w-72 sm:h-72 lg:w-[360px] lg:h-[360px] rounded-2xl overflow-hidden border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative group shrink-0 transition-transform duration-300 ease-out"
      style={{
        transform: `scale(calc(1 + var(--bass-energy, 0) * 0.015))`,
      }}
    >
      {/* Cover Image */}
      <img
        src={track.coverUrl}
        alt={`${track.artist} - ${track.title}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
        onError={(e) => {
          (e.target as HTMLImageElement).src = getUniqueFallbackCover(track);
        }}
      />

      {/* Record Label Badge */}
      {track.badge && (
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-white uppercase px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-md pointer-events-none">
          {track.badge}
        </span>
      )}

      {/* Glass Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
    </div>
  );
}
