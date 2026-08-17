import { motion } from 'motion/react';
import { Track } from '../types';
import { getUniqueFallbackCover, getBollywoodFallbackCover } from '../utils/artworkResolver';

interface CardArtProps {
  track: Track;
  isActive: boolean;
}

export function CardArt({ track, isActive }: CardArtProps) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-visible select-none bg-neutral-900 group">
      {/* Vinyl Disc Peeking Out on Active Card */}
      {isActive && (
        <motion.div
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 22, opacity: 1, rotate: 360 }}
          transition={{
            x: { type: 'spring', stiffness: 200, damping: 20 },
            rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 rounded-full bg-stone-950 border-4 border-stone-900 shadow-2xl flex items-center justify-center z-0 pointer-events-none will-change-transform transform-gpu translate-z-0"
          style={{
            backgroundImage: `radial-gradient(circle, #262626 25%, #171717 35%, #0a0a0a 60%, #171717 75%, #000 100%)`,
          }}
        >
          {/* Vinyl Grooves */}
          <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 rounded-full border border-white/10 flex items-center justify-center">
              {/* Vinyl Center Label */}
              <div
                className="w-7 h-7 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-inner text-[8px] font-bold text-white text-center p-0.5 border border-white/30"
                style={{ backgroundColor: track.accentColor }}
              >
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-stone-950 border border-white/40" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Cover Sleeve */}
      <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-inner">
        {/* Background Cover Image */}
        <img
          src={track.coverUrl}
          alt={`${track.artist} - ${track.title}`}
          className={`w-full h-full object-cover pointer-events-none transition-transform duration-700 ${
            isActive ? 'scale-105' : 'hover:scale-105 opacity-90'
          }`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = track.genre === 'bollywood'
              ? getBollywoodFallbackCover(track)
              : getUniqueFallbackCover(track);
          }}
        />

        {/* Glass Sheen Light Flare Animation when Card Swapped */}
        {isActive && (
          <motion.div
            initial={{ x: '-100%', opacity: 0.6 }}
            animate={{ x: '200%', opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 pointer-events-none z-20"
          />
        )}

        {/* Dynamic Album & Badge Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-between p-3.5 z-10">
          {/* Top Album / Badge Tag */}
          <div className="flex items-center justify-between">
            {track.badge && (
              <span className="text-[9px] font-bold tracking-widest text-white uppercase px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-md">
                {track.badge}
              </span>
            )}
          </div>

          {/* Bottom Title & Album Footer */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-medium tracking-wider text-white/80 uppercase truncate drop-shadow">
              {track.album}
            </span>
          </div>
        </div>

        {/* Subtle glossy overlay reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
