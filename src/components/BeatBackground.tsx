import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion } from 'motion/react';
import { audioEngine } from '../utils/audioEngine';

interface BeatBackgroundProps {
  isPlaying: boolean;
  children: ReactNode;
}

export function BeatBackground({ isPlaying, children }: BeatBackgroundProps) {
  const [beatIntensity, setBeatIntensity] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setBeatIntensity(0);
      return;
    }

    const unsubscribe = audioEngine.subscribeBeat((_step, isBassBeat) => {
      // Set beat intensity on each step hit (stronger intensity on bass drum beats)
      const intensity = isBassBeat ? 1.0 : 0.45;
      setBeatIntensity(intensity);
    });

    return () => {
      unsubscribe();
    };
  }, [isPlaying]);

  // Smooth decay of beat intensity back to 0
  useEffect(() => {
    if (beatIntensity <= 0.01) return;

    let lastTime = performance.now();
    const updateDecay = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setBeatIntensity((prev) => {
        const next = prev - delta * 4.5; // smooth fast decay
        return next > 0 ? next : 0;
      });

      if (beatIntensity > 0) {
        animFrameRef.current = requestAnimationFrame(updateDecay);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateDecay);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [beatIntensity]);

  // Compute dynamic scale and brightness filter for beat pulse without changing background colors
  const currentScale = isPlaying ? 1 + beatIntensity * 0.022 : 1;
  const currentBrightness = isPlaying ? 1 + beatIntensity * 0.14 : 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Dynamic Music Beat Reacting Hero Background - Colors Preserved */}
      <motion.div
        className="coverflow-stage-bg absolute inset-0 w-full h-full pointer-events-none"
        animate={{
          scale: currentScale,
          filter: `brightness(${currentBrightness})`,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      />

      {/* Ambient Pulsing Audio Halo / Beat Energy Wave Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        animate={{
          opacity: isPlaying ? beatIntensity * 0.25 : 0,
          scale: isPlaying ? 1 + beatIntensity * 0.15 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 22,
        }}
      >
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-radial from-white/20 via-white/5 to-transparent blur-3xl" />
      </motion.div>

      {/* Equalizer Visualizer Pulse Lines (Left & Right Hero Edges) */}
      <div className="absolute inset-y-0 left-6 sm:left-12 flex items-center gap-1.5 pointer-events-none opacity-40">
        {[0.8, 1.2, 0.6, 1.0, 0.7].map((heightFactor, i) => (
          <motion.div
            key={`eq-left-${i}`}
            className="w-1 rounded-full bg-gradient-to-t from-white/10 via-white/40 to-white/80"
            animate={{
              height: isPlaying ? `${Math.max(16, beatIntensity * 90 * heightFactor)}px` : '16px',
              opacity: isPlaying ? 0.3 + beatIntensity * 0.6 : 0.2,
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-y-0 right-6 sm:right-12 flex items-center gap-1.5 pointer-events-none opacity-40">
        {[0.7, 1.1, 0.9, 0.5, 1.3].map((heightFactor, i) => (
          <motion.div
            key={`eq-right-${i}`}
            className="w-1 rounded-full bg-gradient-to-t from-white/10 via-white/40 to-white/80"
            animate={{
              height: isPlaying ? `${Math.max(16, beatIntensity * 90 * heightFactor)}px` : '16px',
              opacity: isPlaying ? 0.3 + beatIntensity * 0.6 : 0.2,
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
            }}
          />
        ))}
      </div>

      {/* Main Content (CoverFlow + PlayerDock) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center">
        {children}
      </div>
    </div>
  );
}
