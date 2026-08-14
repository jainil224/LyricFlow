import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Track } from '../types';
import { CardArt } from './CardArt';

interface CoverFlowProps {
  tracks: Track[];
  activeIndex: number;
  onSelectTrack: (index: number) => void;
}

export function CoverFlow({ tracks, activeIndex, onSelectTrack }: CoverFlowProps) {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full max-w-4xl h-[260px] sm:h-[340px] flex items-center justify-center select-none perspective-[1200px] overflow-visible">
      {tracks.map((track, index) => {
        const offset = index - activeIndex;
        const isVisible = Math.abs(offset) <= 2;

        if (!isVisible) return null;

        // Mathematical 3D position calculating offset depth, rotation & scale
        let x = 0;
        let rotateY = 0;
        let z = 0;
        let scale = 1;
        let opacity = 1;
        let zIndex = 10;

        if (offset === 0) {
          x = 0;
          rotateY = 0;
          z = isMobile ? 30 : 45;
          scale = isMobile ? 1.02 : 1.05;
          opacity = 1;
          zIndex = 30;
        } else if (offset === -1) {
          x = isMobile ? -95 : -130;
          rotateY = isMobile ? 24 : 28;
          z = -20;
          scale = isMobile ? 0.82 : 0.86;
          opacity = 0.85;
          zIndex = 20;
        } else if (offset === 1) {
          x = isMobile ? 95 : 130;
          rotateY = isMobile ? -24 : -28;
          z = -20;
          scale = isMobile ? 0.82 : 0.86;
          opacity = 0.85;
          zIndex = 20;
        } else if (offset === -2) {
          x = isMobile ? -170 : -240;
          rotateY = isMobile ? 38 : 44;
          z = -70;
          scale = isMobile ? 0.65 : 0.72;
          opacity = 0.6;
          zIndex = 10;
        } else if (offset === 2) {
          x = isMobile ? 170 : 240;
          rotateY = isMobile ? -38 : -44;
          z = -70;
          scale = isMobile ? 0.65 : 0.72;
          opacity = 0.6;
          zIndex = 10;
        }

        return (
          <motion.div
            key={track.id}
            id={`coverflow-card-${track.id}`}
            onClick={() => onSelectTrack(index)}
            initial={false}
            animate={{
              x,
              rotateY,
              z,
              scale,
              opacity,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 24,
            }}
            style={{
              zIndex,
              transformStyle: 'preserve-3d',
            }}
            className={`absolute cursor-pointer w-[180px] sm:w-[210px] h-[240px] sm:h-[275px] rounded-2xl p-2 flex flex-col justify-between transition-shadow duration-300
              ${
                offset === 0
                  ? 'bg-gradient-to-b from-white/20 via-white/10 to-white/5 backdrop-blur-2xl border border-white/30 shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.1)]'
                  : 'bg-white/10 backdrop-blur-lg border border-white/15 shadow-xl hover:border-white/30'
              }`}
          >
            {/* Top Album Art Box */}
            <div className="w-full h-[160px] sm:h-[185px] relative rounded-xl overflow-hidden shadow-inner">
              <CardArt track={track} isActive={offset === 0} />
            </div>

            {/* Bottom Frosted Glass Info Area */}
            <div className="pt-1.5 pb-0.5 px-1 text-center flex flex-col items-center justify-center">
              <h3 className="text-white font-semibold text-xs sm:text-sm tracking-wide truncate max-w-full drop-shadow-md">
                {track.artist}{track.featuredArtist ? ` ft. ${track.featuredArtist}` : ''}
              </h3>
              <p className="text-white/70 text-[11px] sm:text-xs font-normal tracking-wide truncate max-w-full">
                {track.title}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
