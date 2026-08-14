import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../../types';
import { ExtractedColors } from '../../utils/colorExtractor';

interface ImmersiveBackgroundProps {
  track: Track;
  palette: ExtractedColors;
  isPlaying: boolean;
}

export function ImmersiveBackground({ track, palette, isPlaying }: ImmersiveBackgroundProps) {
  const primary = palette.primary || track.accentColor || '#a855f7';
  const secondary = palette.secondary || track.accentColor || '#3b82f6';
  const accent = track.accentColor || palette.accent || '#ef4444';

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none select-none z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={track.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Layer 1: High-Fidelity Saturated Cover Artwork Base (Matches Song Banner 100%) */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-[55px] saturate-[1.45] contrast-[1.1] opacity-85 scale-125 transition-all duration-1000"
            style={{
              backgroundImage: `url(${track.coverUrl})`,
            }}
          />

          {/* Layer 2: Primary Artwork Color Organic Drifting Glow */}
          <motion.div
            animate={{
              x: ['-15%', '20%', '-10%', '-15%'],
              y: ['-10%', '25%', '15%', '-10%'],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-1/4 -left-1/4 w-[750px] h-[750px] sm:w-[1000px] sm:h-[1000px] rounded-full filter blur-[90px] mix-blend-soft-light transition-opacity duration-300 opacity-60"
            style={{
              backgroundColor: primary,
            }}
          />

          {/* Layer 3: Accent Track Color Organic Drifting Glow */}
          <motion.div
            animate={{
              x: ['15%', '-20%', '10%', '15%'],
              y: ['8%', '-18%', '15%', '8%'],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] sm:w-[950px] sm:h-[950px] rounded-full filter blur-[100px] mix-blend-soft-light transition-opacity duration-300 opacity-70"
            style={{
              backgroundColor: accent,
            }}
          />

          {/* Layer 4: Subtle Top & Bottom Gradient for Clean Readability without muting colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Layer 5: Soft Vignette & Backdrop Filter */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}
