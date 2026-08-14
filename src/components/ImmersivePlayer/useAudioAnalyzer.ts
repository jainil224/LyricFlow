import { useEffect, useRef, RefObject } from 'react';
import { audioEngine } from '../../utils/audioEngine';

interface AudioAnalyzerOptions {
  isPlaying: boolean;
}

export function useAudioAnalyzer(
  containerRef: RefObject<HTMLDivElement | null>,
  { isPlaying }: AudioAnalyzerOptions
) {
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    if (!isPlaying) {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--bass-energy', '0');
        containerRef.current.style.setProperty('--music-energy', '0');
        containerRef.current.style.setProperty('--glow-intensity', '0.5');
        containerRef.current.style.setProperty('--motion-intensity', prefersReducedMotion ? '0.1' : '0.4');
      }
      return;
    }

    const analyser = audioEngine.getAnalyserNode();
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const updateLoop = () => {
      let bass = 0;
      let mid = 0;
      let treble = 0;
      let energy = 0;

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);

        // Subdivide frequency bins (32 bins total for fftSize 64)
        // Bass: Bins 0 - 3 (approx 0Hz - 250Hz)
        let bassSum = 0;
        for (let i = 0; i < 4; i++) {
          bassSum += dataArray[i];
        }
        bass = bassSum / (4 * 255);

        // Mid: Bins 4 - 15 (approx 250Hz - 2000Hz)
        let midSum = 0;
        for (let i = 4; i < 16; i++) {
          midSum += dataArray[i];
        }
        mid = midSum / (12 * 255);

        // Treble: Bins 16 - 31 (approx 2000Hz+)
        let trebleSum = 0;
        for (let i = 16; i < dataArray.length; i++) {
          trebleSum += dataArray[i];
        }
        treble = trebleSum / (Math.max(1, dataArray.length - 16) * 255);

        // Overall energy
        energy = (bass * 0.5) + (mid * 0.3) + (treble * 0.2);
      } else {
        // Fallback simulation when AnalyserNode isn't connected to audio element
        const time = performance.now() / 1000;
        bass = (Math.sin(time * 3.5) + 1) * 0.35;
        mid = (Math.cos(time * 2.2) + 1) * 0.25;
        treble = (Math.sin(time * 5.0) + 1) * 0.2;
        energy = (bass + mid + treble) / 3;
      }

      if (containerRef.current) {
        const bassVal = (bass * (prefersReducedMotion ? 0.2 : 1)).toFixed(3);
        const energyVal = (energy * (prefersReducedMotion ? 0.2 : 1)).toFixed(3);
        const glowVal = (0.5 + energy * (prefersReducedMotion ? 0.1 : 0.45)).toFixed(3);
        const motionVal = (prefersReducedMotion ? 0.1 : 0.4 + energy * 0.6).toFixed(3);

        containerRef.current.style.setProperty('--bass-energy', bassVal);
        containerRef.current.style.setProperty('--music-energy', energyVal);
        containerRef.current.style.setProperty('--glow-intensity', glowVal);
        containerRef.current.style.setProperty('--motion-intensity', motionVal);
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [containerRef, isPlaying]);
}
