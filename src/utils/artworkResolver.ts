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

/**
 * Generate a rich 90s Bollywood-themed SVG cover art for tracks without a real image.
 * Uses saffron/crimson/gold palette with mandala rings and a diya flame.
 */
export function getBollywoodFallbackCover(track: Track): string {
  // Derive a deterministic hue shift per track so each song has a unique tone
  let hash = 0;
  const str = track.id + track.title;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const shift = Math.abs(hash) % 40; // subtle hue variation within saffron/crimson palette

  // Color palette: saffron orange → deep crimson with gold accents
  const col1 = `hsl(${22 + shift}, 95%, 48%)`; // saffron orange
  const col2 = `hsl(${355 + (shift % 20)}, 90%, 35%)`; // deep crimson
  const gold = `rgba(255, 215, 0, 0.85)`;
  const goldDim = `rgba(255, 200, 60, 0.40)`;

  // Truncate long titles/artists for display
  const displayTitle = track.title.length > 22 ? track.title.slice(0, 20) + '…' : track.title;
  const displayArtist = track.artist.length > 26 ? track.artist.slice(0, 24) + '…' : track.artist;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <radialGradient id="bg" cx="40%" cy="30%" r="80%">
        <stop offset="0%" stop-color="${col1}" />
        <stop offset="60%" stop-color="${col2}" />
        <stop offset="100%" stop-color="hsl(10, 80%, 12%)" />
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="35%">
        <stop offset="0%" stop-color="rgba(255,220,80,0.55)" />
        <stop offset="100%" stop-color="rgba(255,120,0,0)" />
      </radialGradient>
    </defs>
    <!-- Background -->
    <rect width="500" height="500" fill="url(#bg)" />
    <!-- Warm center glow -->
    <ellipse cx="250" cy="220" rx="160" ry="140" fill="url(#glow)" />
    <!-- Outer mandala rings -->
    <circle cx="250" cy="250" r="210" fill="none" stroke="${goldDim}" stroke-width="1.5" stroke-dasharray="12 8" />
    <circle cx="250" cy="250" r="185" fill="none" stroke="${goldDim}" stroke-width="1" />
    <circle cx="250" cy="250" r="155" fill="none" stroke="rgba(255,200,60,0.30)" stroke-width="1.5" />
    <circle cx="250" cy="250" r="128" fill="none" stroke="${goldDim}" stroke-width="1" stroke-dasharray="6 6" />
    <!-- Inner petal ring (8 petals) -->
    ${Array.from({ length: 8 }, (_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const px = 250 + Math.cos(angle) * 95;
      const py = 250 + Math.sin(angle) * 95;
      return `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="18" ry="9" transform="rotate(${i * 45} ${px.toFixed(1)} ${py.toFixed(1)})" fill="${goldDim}" />`;
    }).join('\n    ')}
    <!-- Diya base -->
    <ellipse cx="250" cy="268" rx="34" ry="14" fill="rgba(255,180,60,0.75)" />
    <ellipse cx="250" cy="258" rx="20" ry="10" fill="rgba(255,150,30,0.90)" />
    <!-- Flame -->
    <ellipse cx="250" cy="225" rx="10" ry="22" fill="rgba(255,240,100,0.95)" />
    <ellipse cx="250" cy="230" rx="6" ry="16" fill="rgba(255,255,255,0.90)" />
    <ellipse cx="250" cy="215" rx="4" ry="10" fill="rgba(255,255,255,1)" />
    <!-- Wick -->
    <line x1="250" y1="248" x2="250" y2="238" stroke="rgba(100,60,20,0.80)" stroke-width="3" stroke-linecap="round" />
    <!-- Gold corner decorations -->
    <text x="30" y="50" font-size="28" fill="${gold}" opacity="0.7">✦</text>
    <text x="440" y="50" font-size="28" fill="${gold}" opacity="0.7">✦</text>
    <text x="30" y="488" font-size="28" fill="${gold}" opacity="0.7">✦</text>
    <text x="440" y="488" font-size="28" fill="${gold}" opacity="0.7">✦</text>
    <!-- Gold separator line -->
    <line x1="60" y1="320" x2="440" y2="320" stroke="${goldDim}" stroke-width="1" />
    <!-- Song title -->
    <text x="250" y="362" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="${gold}" text-anchor="middle" opacity="0.97">${displayTitle}</text>
    <!-- Artist name -->
    <text x="250" y="398" font-family="Georgia, serif" font-size="18" font-weight="normal" fill="rgba(255,230,160,0.90)" text-anchor="middle">${displayArtist}</text>
    <!-- Bollywood label -->
    <text x="250" y="460" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" letter-spacing="4" fill="rgba(255,200,80,0.60)" text-anchor="middle">90s BOLLYWOOD</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
