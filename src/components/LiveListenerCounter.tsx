import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Users } from 'lucide-react';

interface LiveListenerCounterProps {
  trackId: string;
  className?: string;
  variant?: 'pill' | 'compact' | 'badge';
}

/**
 * Generate a realistic base listener count based on track ID hash
 */
function getBaseListenerCount(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  // Base count between 1,250 and 8,900
  return 1250 + (positiveHash % 7650);
}

export function LiveListenerCounter({
  trackId,
  className = '',
  variant = 'pill',
}: LiveListenerCounterProps) {
  const initialCount = useMemo(() => getBaseListenerCount(trackId), [trackId]);
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    setCount(initialCount);

    // Fluctuate count slightly every 3 to 6 seconds (+/- 1 to 7 listeners)
    const interval = setInterval(() => {
      setCount((prev) => {
        const delta = Math.floor(Math.random() * 15) - 6; // Range -6 to +8
        return Math.max(450, prev + delta);
      });
    }, 3500 + Math.random() * 2500);

    return () => clearInterval(interval);
  }, [trackId, initialCount]);

  const formattedCount = count.toLocaleString('en-US');

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-white/80 font-medium ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-rose-400" />
        <span className="font-mono font-bold text-white">{formattedCount}</span>
        <span className="text-[11px] text-white/60">listening</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 bg-rose-950/40 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold text-rose-200 backdrop-blur-md shadow-lg ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <Headphones className="w-3.5 h-3.5 text-rose-400" />
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            className="font-mono font-bold text-white"
          >
            {formattedCount}
          </motion.span>
        </AnimatePresence>
        <span className="text-[11px] font-medium text-rose-300/80 uppercase tracking-wider">Live Listeners</span>
      </div>
    );
  }

  // Default 'pill' variant for Top Header
  return (
    <div
      className={`flex items-center gap-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-2xl border border-white/20 px-3.5 py-1.5 rounded-full shadow-2xl transition-all duration-300 group hover:border-rose-500/50 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </div>
      <Headphones className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
      <div className="flex items-center gap-1 font-mono text-xs">
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-white drop-shadow"
          >
            {formattedCount}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] font-sans font-semibold text-white/70 uppercase tracking-wider ml-0.5">
          listening now
        </span>
      </div>
    </div>
  );
}
