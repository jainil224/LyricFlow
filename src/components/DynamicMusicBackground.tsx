import { useState, useEffect, useRef, ReactNode } from 'react';
import { Track } from '../types';
import { extractColorsFromImage, ExtractedColors } from '../utils/colorExtractor';
import { audioEngine } from '../utils/audioEngine';

interface DynamicMusicBackgroundProps {
  track: Track;
  isPlaying: boolean;
  children: ReactNode;
}

export function DynamicMusicBackground({ track, isPlaying, children }: DynamicMusicBackgroundProps) {
  const [colors, setColors] = useState<ExtractedColors>({
    primary: 'rgb(40, 30, 70)',
    secondary: 'rgb(80, 40, 100)',
    accent: 'rgb(220, 80, 120)',
    dark: 'rgb(10, 10, 18)',
  });

  const [prevCoverUrl, setPrevCoverUrl] = useState<string>(track.coverUrl);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>(track.coverUrl);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const beatIntensityRef = useRef<number>(0);

  // Extract colors whenever the active track changes
  useEffect(() => {
    let isMounted = true;

    // Handle smooth cover image crossfade
    if (track.coverUrl !== currentCoverUrl) {
      setPrevCoverUrl(currentCoverUrl);
      setCurrentCoverUrl(track.coverUrl);
      setIsCrossfading(true);

      const timer = setTimeout(() => {
        if (isMounted) setIsCrossfading(false);
      }, 1200);

      extractColorsFromImage(track.coverUrl).then((extracted) => {
        if (isMounted) {
          setColors(extracted);
        }
      });

      return () => clearTimeout(timer);
    } else {
      extractColorsFromImage(track.coverUrl).then((extracted) => {
        if (isMounted) {
          setColors(extracted);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [track.id, track.coverUrl]);

  // Real-time audio beat reactivity (vivid glow-up on every beat)
  useEffect(() => {
    if (!isPlaying) {
      beatIntensityRef.current = 0;
      if (containerRef.current) {
        containerRef.current.style.setProperty('--beat-scale', '1');
        containerRef.current.style.setProperty('--beat-brightness', '1');
        containerRef.current.style.setProperty('--beat-glow-opacity', '0');
      }
      return;
    }

    const unsubscribe = audioEngine.subscribeBeat((_step, isBassBeat) => {
      // Vivid pulse intensity on beat hit
      beatIntensityRef.current = isBassBeat ? 1.0 : 0.65;
    });

    let lastTime = performance.now();
    const updateLoop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (beatIntensityRef.current > 0.001) {
        beatIntensityRef.current = Math.max(0, beatIntensityRef.current - delta * 3.2);
      } else {
        beatIntensityRef.current = 0;
      }

      if (containerRef.current) {
        const scaleVal = 1 + beatIntensityRef.current * 0.045; // 4.5% scale pulse
        const brightVal = 1 + beatIntensityRef.current * 0.40; // Up to 40% glow brightness boost
        const glowOpacity = (beatIntensityRef.current * 0.65).toFixed(3);

        containerRef.current.style.setProperty('--beat-scale', scaleVal.toFixed(4));
        containerRef.current.style.setProperty('--beat-brightness', brightVal.toFixed(4));
        containerRef.current.style.setProperty('--beat-glow-opacity', glowOpacity);
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      unsubscribe();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen h-[100dvh] overflow-hidden bg-black select-none transition-all duration-1000 ease-in-out"
      style={{
        '--bg-primary': colors.primary,
        '--bg-secondary': colors.secondary,
        '--bg-accent': colors.accent,
        '--bg-dark': colors.dark,
        '--beat-scale': '1',
        '--beat-brightness': '1',
        '--beat-glow-opacity': '0',
      } as Record<string, string>}
    >
      {/* 1. Heavy Blurred Cover Artwork Layer (Previous Image during Crossfade) */}
      {isCrossfading && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-125 transition-opacity duration-1000 opacity-0"
          style={{
            backgroundImage: `url(${prevCoverUrl})`,
          }}
        />
      )}

      {/* 2. Heavy Blurred Cover Artwork Layer (Active Current Image) */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl scale-125 transition-opacity duration-1000 pointer-events-none"
        style={{
          backgroundImage: `url(${currentCoverUrl})`,
          opacity: 0.45,
          transform: `scale(calc(1.25 * var(--beat-scale)))`,
          filter: `blur(48px) brightness(var(--beat-brightness))`,
        }}
      />

      {/* 3. Dynamic Atmospheric Blurred Radial Gradients using Extracted Colors */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{
          background: `
            radial-gradient(circle at 20% 25%, var(--bg-primary), transparent 50%),
            radial-gradient(circle at 80% 30%, var(--bg-secondary), transparent 50%),
            radial-gradient(circle at 50% 85%, var(--bg-accent), transparent 55%),
            linear-gradient(to bottom, var(--bg-dark), #070709)
          `,
          transform: `scale(var(--beat-scale))`,
          filter: `brightness(var(--beat-brightness))`,
        }}
      />

      {/* 4. Beat Glow-Up Vivid Pulse Center Orb */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-100"
        style={{
          opacity: isPlaying ? 'var(--beat-glow-opacity)' : '0',
        }}
      >
        <div
          className="w-[850px] h-[850px] rounded-full blur-3xl transition-transform duration-75"
          style={{
            background: `radial-gradient(circle, var(--bg-accent) 0%, var(--bg-primary) 60%, transparent 100%)`,
            transform: `scale(calc(1.15 * var(--beat-scale)))`,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* 5. Beat Flare Corner Flash Overlays */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-100"
        style={{
          opacity: isPlaying ? 'var(--beat-glow-opacity)' : '0',
          background: `radial-gradient(circle at 50% 0%, var(--bg-accent) 0%, transparent 70%)`,
          mixBlendMode: 'lighten',
        }}
      />

      {/* 6. UI Readability Protection Dark Translucent Veil */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-none" />

      {/* 6. Main Music Player UI Content (CoverFlow + PlayerDock) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-4 sm:py-6 px-4">
        {children}
      </div>
    </div>
  );
}
