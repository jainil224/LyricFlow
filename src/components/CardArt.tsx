import { Track } from '../types';
import { getUniqueFallbackCover } from '../utils/artworkResolver';

interface CardArtProps {
  track: Track;
  isActive: boolean;
}

export function CardArt({ track }: CardArtProps) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden select-none bg-neutral-900">
      {/* Background Cover Image */}
      <img
        src={track.coverUrl}
        alt={`${track.artist} - ${track.title}`}
        className="w-full h-full object-cover pointer-events-none transition-transform duration-500 hover:scale-105"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Per-song unique fallback artwork (never uses same common placeholder image)
          const target = e.target as HTMLImageElement;
          target.src = getUniqueFallbackCover(track);
        }}
      />

      {/* Dynamic Album & Badge Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-3.5">
        {/* Top Album / Badge Tag */}
        <div className="flex items-center justify-between">
          {track.badge && (
            <span className="text-[9px] font-bold tracking-widest text-white/90 uppercase px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-sm">
              {track.badge}
            </span>
          )}
        </div>

        {/* Bottom Title & Album Footer */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-medium tracking-wider text-white/70 uppercase truncate">
            {track.album}
          </span>
        </div>
      </div>

      {/* Subtle glossy card overlay reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
    </div>
  );
}
