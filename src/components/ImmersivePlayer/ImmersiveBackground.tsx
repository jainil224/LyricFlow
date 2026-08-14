import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../../types';
import { ExtractedColors } from '../../utils/colorExtractor';

interface ImmersiveBackgroundProps {
  track: Track;
  palette: ExtractedColors;
  isPlaying: boolean;
}

export function ImmersiveBackground({ track, palette, isPlaying }: ImmersiveBackgroundProps) {
  const { primary, secondary, accent, dark } = palette;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#070709] pointer-events-none select-none z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={track.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Layer 1: Blurred Cover Artwork Base Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-[100px] opacity-40 scale-125 transition-all duration-1000"
            style={{
              backgroundImage: `url(${track.coverUrl})`,
              transform: `scale(calc(1.25 + var(--bass-energy, 0) * 0.04))`,
            }}
          />

          {/* Layer 2: Primary Color Organic Drifting Orb (18s duration) */}
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
            className="absolute -top-1/4 -left-1/4 w-[700px] h-[700px] sm:w-[950px] sm:h-[950px] rounded-full filter blur-[120px] mix-blend-screen transition-opacity duration-300"
            style={{
              backgroundColor: primary,
              opacity: `calc(0.65 * var(--glow-intensity, 1))`,
              transform: `scale(calc(1 + var(--bass-energy, 0) * 0.06))`,
            }}
          />

          {/* Layer 3: Secondary Color Organic Drifting Orb (24s duration) */}
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
            className="absolute -top-1/4 -right-1/4 w-[650px] h-[650px] sm:w-[900px] sm:h-[900px] rounded-full filter blur-[130px] mix-blend-screen transition-opacity duration-300"
            style={{
              backgroundColor: secondary,
              opacity: `calc(0.6 * var(--glow-intensity, 1))`,
              transform: `scale(calc(1 + var(--music-energy, 0) * 0.05))`,
            }}
          />

          {/* Layer 4: Accent Color Organic Drifting Orb (31s duration) */}
          <motion.div
            animate={{
              x: ['-20%', '12%', '-10%', '-20%'],
              y: ['20%', '-12%', '10%', '20%'],
            }}
            transition={{
              duration: 31,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-1/4 left-1/4 w-[750px] h-[750px] sm:w-[1000px] sm:h-[1000px] rounded-full filter blur-[140px] mix-blend-screen transition-opacity duration-300"
            style={{
              backgroundColor: accent,
              opacity: `calc(0.7 * var(--glow-intensity, 1))`,
              transform: `scale(calc(1 + var(--bass-energy, 0) * 0.08))`,
            }}
          />

          {/* Layer 5: Dark Translucent Readability Overlay & Vignette (Section 22 & 23) */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(7,7,9,0.3) 25%, ${dark || '#070709'} 100%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Layer 6: Film Grain & Noise Overlay for Premium Analog Vibe (Section 24) */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] opacity-90 pointer-events-none" />
    </div>
  );
}
