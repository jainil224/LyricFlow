/**
 * fetch-lyrics-lrclib.mjs
 * ------------------------------------------------------------------
 * Fetches synced (LRC) lyrics for your song library from lrclib.net's
 * free public API (https://lrclib.net/docs) and saves them as .lrc
 * files + a manifest.json your app can load at runtime.
 *
 * lrclib.net is a community-sourced database of synced lyrics used
 * by several open-source music players. No API key required. Be a
 * good citizen: don't hammer it with concurrent requests (script
 * below runs sequentially with a small delay).
 *
 * Usage:
 *   node fetch-lyrics-lrclib.mjs
 *
 * Output:
 *   ./lyrics/<slug>.lrc      (raw LRC file per matched track)
 *   ./lyrics/manifest.json   (track -> lyrics file / match status)
 * ------------------------------------------------------------------
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = "./public/lyrics";

// Duration is given in mm:ss from your library; lrclib matches better
// with duration in seconds (used as a disambiguator, not a hard filter).
function toSeconds(mmss) {
  const [m, s] = mmss.split(":").map(Number);
  return m * 60 + s;
}

const SONGS = [
  { title: "back to friends", artist: "sombr", album: "back to friends - Single", duration: "3:21" },
  { title: "Beanie", artist: "Chezile", album: "Beanie - Single", duration: "2:20" },
  { title: "blue (slowed down)", artist: "yung kai", album: "blue - Single", duration: "3:50" },
  { title: "CO2", artist: "Prateek Kuhad", album: "The Way That Lovers Do", duration: "2:44" },
  { title: "death bed (coffee for your head)", artist: "Powfu", album: "poems of the past", duration: "2:53" },
  { title: "Demons", artist: "Imagine Dragons", album: "Night Visions", duration: "2:57" },
  { title: "Falling", artist: "Trevor Daniel", album: "Nicotine", duration: "2:39" },
  { title: "Perfect", artist: "Ed Sheeran", album: "÷ (Divide)", duration: "4:23" },
  { title: "Gone, Gone, Gone", artist: "Phillip Phillips", album: "The World from the Side of the Moon", duration: "3:30" },
  { title: "Hall of Fame", artist: "The Script", album: "#3", duration: "3:22" },
  { title: "Let Her Go", artist: "Passenger", album: "All the Little Lights", duration: "4:12" },
  { title: "Line Without a Hook", artist: "Ricky Montgomery", album: "Montgomery Ricky", duration: "4:10" },
  { title: "lovely", artist: "Billie Eilish", album: "lovely - Single", duration: "3:20" },
  { title: "Ordinary", artist: "Alex Warren", album: "Ordinary - Single", duration: "3:08" },
  { title: "Red", artist: "Taylor Swift", album: "Red (Taylor's Version)", duration: "3:43" },
  { title: "SNAP", artist: "Rosa Linn", album: "SNAP - Single", duration: "2:59" },
  { title: "Somewhere Only We Know", artist: "Keane", album: "Hopes and Fears", duration: "3:57" },
  { title: "Sunflower", artist: "Post Malone", album: "Spider-Man: Into the Spider-Verse", duration: "2:38" },
  { title: "The Fate of Ophelia", artist: "Taylor Swift", album: "Single", duration: "4:04" },
  { title: "Until I Found You", artist: "Stephen Sanchez", album: "Until I Found You - Single", duration: "2:57" },
  { title: "Your Eyes", artist: "Barney Sku", album: "Single", duration: "3:00" },
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function searchLrclib({ title, artist, album, duration }) {
  const params = new URLSearchParams({
    track_name: title,
    artist_name: artist,
  });
  if (album) params.set("album_name", album);

  const url = `https://lrclib.net/api/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ViralSongsPlayer/1.0 (personal project lyric sync)" },
  });
  if (!res.ok) return null;

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  // Prefer the result with a duration closest to the expected one, and
  // that actually has synced lyrics.
  const targetSec = duration ? toSeconds(duration) : null;
  const synced = results.filter((r) => r.syncedLyrics);
  const pool = synced.length > 0 ? synced : results;

  pool.sort((a, b) => {
    if (targetSec == null) return 0;
    return Math.abs(a.duration - targetSec) - Math.abs(b.duration - targetSec);
  });

  return pool[0] ?? null;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const manifest = [];

  for (const song of SONGS) {
    const slug = slugify(`${song.artist}-${song.title}`);
    process.stdout.write(`Fetching: ${song.artist} - ${song.title} ... `);

    try {
      const match = await searchLrclib(song);

      if (!match) {
        console.log("NO MATCH");
        manifest.push({ ...song, slug, status: "not_found" });
      } else if (match.syncedLyrics) {
        const file = `${slug}.lrc`;
        await writeFile(path.join(OUTPUT_DIR, file), match.syncedLyrics, "utf8");
        console.log("synced ✔");
        manifest.push({
          ...song,
          slug,
          status: "synced",
          file,
          matchedTrack: match.trackName,
          matchedArtist: match.artistName,
          matchedDuration: match.duration,
        });
      } else if (match.plainLyrics) {
        const file = `${slug}.txt`;
        await writeFile(path.join(OUTPUT_DIR, file), match.plainLyrics, "utf8");
        console.log("plain only (no timestamps)");
        manifest.push({ ...song, slug, status: "plain_only", file });
      } else {
        console.log("instrumental / no lyrics");
        manifest.push({ ...song, slug, status: "instrumental" });
      }
    } catch (err) {
      console.log("ERROR:", err.message);
      manifest.push({ ...song, slug, status: "error", error: err.message });
    }

    // Be polite to the free API — small delay between requests.
    await sleep(400);
  }

  await writeFile(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  const notFound = manifest.filter((m) => m.status !== "synced");
  console.log(`\nDone. ${manifest.length - notFound.length}/${manifest.length} tracks got synced lyrics.`);
  if (notFound.length) {
    console.log("Needs manual review:", notFound.map((m) => `${m.artist} - ${m.title} (${m.status})`).join(", "));
  }
}

main();
