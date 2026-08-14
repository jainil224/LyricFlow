import { Track } from '../types';

/**
 * Clean track filename / title by removing quality tags and extra file noise
 */
export function cleanTrackTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\(MP3_\d+K\)/gi, '')
    .replace(/\(Lyrics\)/gi, '')
    .replace(/\(slowed down\)/gi, '')
    .replace(/\(Anniversary Edition\)/gi, '')
    .replace(/_\s*/g, ' ')
    .trim();
}

/**
 * Generate a unique, deterministic HSL color gradient & SVG cover for a track
 * ensuring every single song gets its own distinct individual fallback cover.
 */
export function getUniqueFallbackCover(track: Track): string {
  let hash = 0;
  const str = `${track.artist}-${track.title}-${track.id}`;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 50) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 75%, 40%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 80%, 20%)" />
      </linearGradient>
    </defs>
    <rect width="500" height="500" fill="url(#g)" />
    <circle cx="250" cy="250" r="160" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3" />
    <circle cx="250" cy="250" r="100" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <circle cx="250" cy="250" r="35" fill="rgba(0,0,0,0.5)" />
    <text x="250" y="420" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" opacity="0.95">${track.artist}</text>
    <text x="250" y="455" font-family="system-ui, sans-serif" font-size="22" font-weight="normal" fill="rgba(255,255,255,0.8)" text-anchor="middle">${track.title}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
