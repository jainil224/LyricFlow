import { motion, AnimatePresence } from 'motion/react';
import { ExtractedColors } from '../utils/colorExtractor';

interface AnimatedBackgroundProps {
  palette: ExtractedColors;
  isPlaying?: boolean;
}

export function AnimatedBackground({ palette, isPlaying = true }: AnimatedBackgroundProps) {
  const { primary, secondary, accent, dark } = palette;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#070709] pointer-events-none select-none z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${primary}-${secondary}-${accent}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Blob 1: Top Left Drifting Orb */}
          <motion.div
            animate={{
              x: ['-10%', '15%', '-5%', '-10%'],
              y: ['-10%', '20%', '10%', '-10%'],
              scale: isPlaying ? [1, 1.15, 0.95, 1] : [1, 1.05, 0.98, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-1/4 -left-1/4 w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] rounded-full filter blur-[110px] opacity-70 mix-blend-screen"
            style={{ backgroundColor: primary }}
          />

          {/* Blob 2: Top Right Drifting Orb */}
          <motion.div
            animate={{
              x: ['10%', '-15%', '8%', '10%'],
              y: ['5%', '-15%', '12%', '5%'],
              scale: isPlaying ? [1, 0.9, 1.12, 1] : [1, 0.95, 1.05, 1],
            }}
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full filter blur-[120px] opacity-65 mix-blend-screen"
            style={{ backgroundColor: secondary }}
          />

          {/* Blob 3: Center Bottom Pulsing Accent Orb */}
          <motion.div
            animate={{
              x: ['-15%', '10%', '-8%', '-15%'],
              y: ['15%', '-10%', '8%', '15%'],
              scale: isPlaying ? [1, 1.2, 0.9, 1] : [1, 1.08, 0.95, 1],
            }}
            transition={{
              duration: 19,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-1/4 left-1/4 w-[700px] h-[700px] sm:w-[900px] sm:h-[900px] rounded-full filter blur-[130px] opacity-75 mix-blend-screen"
            style={{ backgroundColor: accent }}
          />

          {/* Blob 4: Center Dark Vignette Underlay */}
          <motion.div
            animate={{
              opacity: isPlaying ? [0.4, 0.6, 0.4] : [0.5, 0.5, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-radial-gradient from-transparent via-[#070709]/50 to-[#070709]/90"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 30%, ${dark} 100%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark frosted glass UI veil overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
    </div>
  );
}
