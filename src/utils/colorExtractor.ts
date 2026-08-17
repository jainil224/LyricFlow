export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
}

/**
 * Pure client-side color extraction using HTML Canvas
 * Extracts primary, secondary, accent, and dark tones from any cover artwork image.
 */
export function extractColorsFromImage(imageUrl: string, fallbackUrl?: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(getFallbackColors());
        }

        const width = 50;
        const height = 50;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height).data;

        const colorCounts: Record<string, { r: number; g: number; b: number; count: number; sat: number; val: number }> = {};

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue; // Skip transparent pixels

          // Quantize color to 16-step buckets
          const qR = Math.floor(r / 20) * 20;
          const qG = Math.floor(g / 20) * 20;
          const qB = Math.floor(b / 20) * 20;

          const key = `${qR},${qG},${qB}`;

          // Calculate HSV saturation & value
          const max = Math.max(r, g, b) / 255;
          const min = Math.min(r, g, b) / 255;
          const delta = max - min;
          const sat = max === 0 ? 0 : delta / max;
          const val = max;

          if (!colorCounts[key]) {
            colorCounts[key] = { r, g, b, count: 0, sat, val };
          }
          colorCounts[key].count++;
        }

        const sortedColors = Object.values(colorCounts).sort((a, b) => b.count - a.count);

        if (sortedColors.length === 0) {
          return resolve(getFallbackColors());
        }

        // Primary: Most frequent color
        const p = sortedColors[0];
        const primary = `rgb(${p.r}, ${p.g}, ${p.b})`;

        // Secondary: Second most distinct color
        const sec = sortedColors.find((c) => Math.abs(c.r - p.r) + Math.abs(c.g - p.g) + Math.abs(c.b - p.b) > 60) || sortedColors[1] || p;
        const secondary = `rgb(${sec.r}, ${sec.g}, ${sec.b})`;

        // Accent: Highest saturation color
        const acc = sortedColors.slice(0, 15).sort((a, b) => b.sat - a.sat)[0] || p;
        const accent = `rgb(${acc.r}, ${acc.g}, ${acc.b})`;

        // Dark: Darkest color tone
        const d = sortedColors.slice(0, 20).sort((a, b) => a.val - b.val)[0] || p;
        const dark = `rgb(${Math.floor(d.r * 0.4)}, ${Math.floor(d.g * 0.4)}, ${Math.floor(d.b * 0.4)})`;

        resolve({ primary, secondary, accent, dark });
      } catch (e) {
        console.warn('Color extraction fallback triggered:', e);
        resolve(getFallbackColors());
      }
    };

    img.onerror = () => {
      if (fallbackUrl && imageUrl !== fallbackUrl) {
         extractColorsFromImage(fallbackUrl).then(resolve);
      } else {
         resolve(getFallbackColors());
      }
    };

    img.src = imageUrl;
  });
}

function getFallbackColors(): ExtractedColors {
  return {
    primary: 'rgb(59, 130, 246)',
    secondary: 'rgb(168, 85, 247)',
    accent: 'rgb(244, 63, 94)',
    dark: 'rgb(15, 15, 25)',
  };
}
