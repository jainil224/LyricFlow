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

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen h-[100dvh] overflow-hidden bg-black select-none transition-all duration-1000 ease-in-out"
      style={{
        '--bg-primary': colors.primary,
        '--bg-secondary': colors.secondary,
        '--bg-accent': colors.accent,
        '--bg-dark': colors.dark,
      } as Record<string, string>}
    >
      {/* 1. Heavy Blurred Cover Artwork Layer (Previous Image during Crossfade) */}
      {isCrossfading && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[55px] saturate-[1.4] contrast-[1.1] scale-125 transition-opacity duration-1000 opacity-0 will-change-transform transform-gpu translate-z-0"
          style={{
            backgroundImage: `url(${prevCoverUrl})`,
          }}
        />
      )}

      {/* 2. High-Fidelity Saturated Cover Artwork Layer (Matches Active Song Card 100%) */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-[55px] saturate-[1.45] contrast-[1.1] scale-125 transition-opacity duration-1000 pointer-events-none will-change-transform transform-gpu translate-z-0"
        style={{
          backgroundImage: `url(${currentCoverUrl})`,
          opacity: 0.82,
        }}
      />

      {/* 3. Accent & Primary Color Atmospheric Drifting Glows */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out mix-blend-soft-light will-change-transform transform-gpu translate-z-0"
        style={{
          background: `
            radial-gradient(circle at 25% 25%, ${track.accentColor || 'var(--bg-primary)'}, transparent 55%),
            radial-gradient(circle at 75% 35%, var(--bg-secondary), transparent 55%),
            radial-gradient(circle at 50% 85%, var(--bg-accent), transparent 60%)
          `,
        }}
      />

      {/* 4. Subtle UI Protection Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none" />

      {/* 6. Main Music Player UI Content (CoverFlow + PlayerDock) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-4 sm:py-6 px-4">
        {children}
      </div>
    </div>
  );
}
