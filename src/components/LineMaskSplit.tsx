import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LineMaskSplitProps {
  text: string;
  isActive: boolean;
  isPast?: boolean;
  accentColor?: string;
  splitMode?: 'chars' | 'words' | 'lines';
  blurIntensity?: number;
  className?: string;
  onClick?: () => void;
}

export function LineMaskSplit({
  text,
  isActive,
  isPast = false,
  accentColor = 'rgba(255, 255, 255, 0.6)',
  splitMode = 'words',
  blurIntensity = 16,
  className = '',
  onClick,
}: LineMaskSplitProps) {
  // Split words or characters for stagger animation
  const units = useMemo(() => {
    if (!text) return [];
    if (splitMode === 'chars') {
      return text.split('');
    }
    return text.split(' ');
  }, [text, splitMode]);

  if (!isActive) {
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer transition-all duration-500 origin-left ${
          isPast
            ? 'text-white/35 font-bold text-lg sm:text-2xl leading-tight blur-[0.4px] hover:blur-none hover:text-white/75'
            : 'text-white/45 font-bold text-lg sm:text-2xl leading-tight blur-[0.5px] hover:blur-none hover:text-white/75'
        } ${className}`}
      >
        <p>{text}</p>
      </div>
    );
  }

  // Active Line with LineMaskSplit Staggered Character / Word Reveal
  return (
    <motion.div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 origin-left text-white font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight select-none ${className}`}
      style={{
        textShadow: `0 0 24px ${accentColor}`,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: splitMode === 'chars' ? 0.025 : 0.06,
                delayChildren: 0.02,
              },
            },
          }}
          className="flex flex-wrap items-center gap-x-[0.25em] gap-y-1"
        >
          {units.map((unit, idx) => (
            <span key={idx} className="inline-block overflow-hidden py-0.5 px-[1px]">
              <motion.span
                variants={{
                  hidden: {
                    y: '100%',
                    opacity: 0,
                    filter: `blur(${blurIntensity}px)`,
                    scale: 0.92,
                  },
                  visible: {
                    y: '0%',
                    opacity: 1,
                    filter: 'blur(0px)',
                    scale: 1,
                    transition: {
                      duration: 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  },
                }}
                className="inline-block"
              >
                {unit === ' ' ? '\u00A0' : unit}
              </motion.span>
            </span>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
