import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Track } from '../types';
import { CardArt } from './CardArt';

interface CoverFlowProps {
  tracks: Track[];
  activeIndex: number;
  onSelectTrack: (index: number) => void;
  onOpenFullScreen?: () => void;
}

export function CoverFlow({ tracks, activeIndex, onSelectTrack, onOpenFullScreen }: CoverFlowProps) {
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
    <div className="relative w-full max-w-4xl h-[180px] xs:h-[220px] sm:h-[350px] flex items-center justify-center select-none perspective-[1400px] overflow-visible my-auto">
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
          z = isMobile ? 35 : 55;
          scale = isMobile ? 1.04 : 1.08;
          opacity = 1;
          zIndex = 30;
        } else if (offset === -1) {
          x = isMobile ? -95 : -135;
          rotateY = isMobile ? 26 : 32;
          z = -20;
          scale = isMobile ? 0.82 : 0.86;
          opacity = 0.85;
          zIndex = 20;
        } else if (offset === 1) {
          x = isMobile ? 95 : 135;
          rotateY = isMobile ? -26 : -32;
          z = -20;
          scale = isMobile ? 0.82 : 0.86;
          opacity = 0.85;
          zIndex = 20;
        } else if (offset === -2) {
          x = isMobile ? -175 : -245;
          rotateY = isMobile ? 40 : 48;
          z = -75;
          scale = isMobile ? 0.65 : 0.72;
          opacity = 0.55;
          zIndex = 10;
        } else if (offset === 2) {
          x = isMobile ? 175 : 245;
          rotateY = isMobile ? -40 : -48;
          z = -75;
          scale = isMobile ? 0.65 : 0.72;
          opacity = 0.55;
          zIndex = 10;
        }

        return (
          <motion.div
            key={track.id}
            id={`coverflow-card-${track.id}`}
            onClick={() => {
              if (offset === 0 && onOpenFullScreen) {
                onOpenFullScreen();
              } else {
                onSelectTrack(index);
              }
            }}
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
              stiffness: 280,
              damping: 26,
              mass: 0.75,
            }}
            style={{
              zIndex,
              transformStyle: 'preserve-3d',
            }}
            className={`absolute cursor-pointer w-[135px] xs:w-[165px] sm:w-[215px] h-[175px] xs:h-[210px] sm:h-[280px] rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between will-change-transform transform-gpu ${
              offset === 0
                ? 'bg-gradient-to-b from-white/25 via-white/15 to-white/5 backdrop-blur-2xl border-2 border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,255,255,0.2)]'
                : 'bg-white/10 backdrop-blur-lg border border-white/15 shadow-xl hover:border-white/30 hover:opacity-95'
            }`}
          >
            {/* Top Album Art Box */}
            <div className="w-full h-[115px] xs:h-[140px] sm:h-[190px] relative rounded-xl overflow-visible">
              <CardArt track={track} isActive={offset === 0} />
            </div>

            {/* Bottom Frosted Glass Info Area */}
            <div className="pt-2 pb-1 px-1.5 text-center flex flex-col items-center justify-center">
              <h3 className="text-white font-bold text-xs sm:text-sm tracking-wide truncate max-w-full drop-shadow-md">
                {track.artist}{track.featuredArtist ? ` ft. ${track.featuredArtist}` : ''}
              </h3>
              <p className="text-white/75 text-[11px] sm:text-xs font-normal tracking-wide truncate max-w-full">
                {track.title}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
