import { parseLRC, ParsedLyricLine } from '../utils/lrcParser';

export type LyricLine = ParsedLyricLine;

// Mapping track ID to public LRC file path
export const TRACK_ID_TO_LRC_PATH: Record<string, string> = {
  'back-to-friends': '/lyrics/sombr-back-to-friends.lrc',
  'beanie': '/lyrics/chezile-beanie.lrc',
  'blue': '/lyrics/yung-kai-blue-slowed-down.lrc',
  'co2': '/lyrics/prateek-kuhad-co2.lrc',
  'death-bed': '/lyrics/powfu-death-bed-coffee-for-your-head.lrc',
  'demons': '/lyrics/imagine-dragons-demons.lrc',
  'falling': '/lyrics/trevor-daniel-falling.lrc',
  'perfect': '/lyrics/ed-sheeran-perfect.lrc',
  'gone-gone-gone': '/lyrics/phillip-phillips-gone-gone-gone.lrc',
  'hall-of-fame': '/lyrics/the-script-hall-of-fame.lrc',
  'let-her-go': '/lyrics/passenger-let-her-go.lrc',
  'line-without-a-hook': '/lyrics/ricky-montgomery-line-without-a-hook.lrc',
  'lovely': '/lyrics/billie-eilish-lovely.lrc',
  'ordinary': '/lyrics/alex-warren-ordinary.lrc',
  'red': '/lyrics/taylor-swift-red.lrc',
  'snap': '/lyrics/rosa-linn-snap.lrc',
  'somewhere-only-we-know': '/lyrics/keane-somewhere-only-we-know.lrc',
  'sunflower': '/lyrics/post-malone-sunflower.lrc',
  'the-fate-of-ophelia': '/lyrics/taylor-swift-the-fate-of-ophelia.lrc',
  'until-i-found-you': '/lyrics/stephen-sanchez-until-i-found-you.lrc',
  'your-eyes': '/lyrics/barney-sku-your-eyes.lrc',
  'take-on-me': '/lyrics/weezer-take-on-me.lrc',
  'the-winner-takes-it-all': '/lyrics/abba-the-winner-takes-it-all.lrc',
  'sailor-song': '/lyrics/gigi-perez-sailor-song.lrc',
  'baby': '/lyrics/justin-bieber-baby.lrc',
  'beggin': '/lyrics/m-neskin-beggin.lrc',
  'right-here-waiting': '/lyrics/richard-marx-right-here-waiting.lrc',
  'opalite': '/lyrics/taylor-swift-opalite.lrc',
};

// In-memory cache for parsed lyrics
const lyricsCache: Record<string, LyricLine[]> = {};

/**
 * Fetch and parse LRC file for track asynchronously
 */
export async function fetchLyricsForTrack(trackId: string): Promise<LyricLine[]> {
  if (lyricsCache[trackId]) {
    return lyricsCache[trackId];
  }

  const path = TRACK_ID_TO_LRC_PATH[trackId];
  if (!path) return [];

  try {
    const response = await fetch(path);
    if (!response.ok) return [];
    const lrcText = await response.text();
    const parsed = parseLRC(lrcText);
    if (parsed.length > 0) {
      lyricsCache[trackId] = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn(`Could not load LRC file for ${trackId}:`, err);
  }

  return [];
}

/**
 * Synchronous lyrics accessor with automatic caching fallback
 */
export function getLyricsForTrack(trackId: string, trackTitle: string, artistName: string): LyricLine[] {
  if (lyricsCache[trackId]) {
    return lyricsCache[trackId];
  }

  // Trigger async fetch to populate cache for subsequent ticks
  fetchLyricsForTrack(trackId);

  // High quality fallback while loading or for offline fallback
  return [
    { time: 0, text: `♪ (Intro groove - ${trackTitle}) ♪` },
    { time: 6, text: `Listening to ${trackTitle} by ${artistName}` },
    { time: 12, text: "Feel the beat pulsing in the night" },
    { time: 18, text: "Every rhythm taking us to the sky" },
    { time: 24, text: "Lost inside the melody and harmony" },
    { time: 30, text: "Dancing under neon lights so bright" },
    { time: 36, text: "This is the moment we've been waiting for" },
    { time: 42, text: "Turn up the sound, open up your mind" },
    { time: 48, text: "Stream the best in English music on LyricFlow" },
    { time: 54, text: "♪ (Beat drop & chorus) ♪" },
    { time: 60, text: "Hold on tight to the rhythm" },
    { time: 66, text: "Let the sound take control" },
    { time: 72, text: "♪ (Melodic guitar solo) ♪" },
    { time: 80, text: "Forever in tune with the music" }
  ];
}
