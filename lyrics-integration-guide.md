# Lyrics Integration Guide — LyricFlow Song Library (21 Tracks)

## Step 1: Fetch synced lyrics
Run the companion script:
```bash
node fetch-lyrics-lrclib.mjs
```
This queries **lrclib.net** (free, no API key, community-sourced synced-lyrics database) for each of your 21 tracks and writes:
- `lyrics/<artist-title-slug>.lrc` — time-stamped lyrics for tracks with a synced match
- `lyrics/<artist-title-slug>.txt` — plain lyrics only, if no synced version exists
- `lyrics/manifest.json` — a status report for all 21 tracks (`synced`, `plain_only`, `not_found`, `instrumental`, `error`)

Not every track is guaranteed a match — popular songs (Ed Sheeran, Taylor Swift, Imagine Dragons, etc.) usually have great coverage; smaller/independent tracks (e.g. Chezile, Barney Sku) may return `not_found`. Check `manifest.json` after running it.

## Step 2: Handle unmatched tracks
For any track marked `not_found` or `plain_only` in the manifest:
- Re-run the search manually on lrclib.net's site/API with slightly different title spelling (remove "(slowed down)", "ft. X", parentheticals, etc. — these often trip up fuzzy matching).
- If still unavailable, you have two legitimate options:
  1. **License lyrics from a lyrics API/provider** (e.g. Musixmatch's API) if you want full commercial-grade coverage — this requires a licensing agreement since lyrics are copyrighted.
  2. Ship that track without synced lyrics — the UI should gracefully fall back to "Lyrics not available" (see Step 4).

⚠️ Do not hand-type or paste lyrics you've copied from lyric sites into your codebase — most lyric sites' text is copyrighted and not licensed for redistribution in a product, even a hobby one. Stick to licensed/free-tier APIs like lrclib.net (built for this exact use case) or a proper licensing deal.

## Step 3: Upload to Cloudinary (optional, matches your existing asset pipeline)
Since your app already hosts audio/art on Cloudinary, you can upload each `.lrc` file as a raw asset:
```bash
cloudinary_url=$(cat .cloudinary_url) # or use your existing upload script/CLI
for f in lyrics/*.lrc; do
  curl -X POST "https://api.cloudinary.com/v1_1/<cloud_name>/raw/upload" \
    -F "file=@$f" \
    -F "upload_preset=<your_preset>" \
    -F "folder=lyrics"
done
```
Alternatively, just bundle the `.lrc` files as static assets in your repo (`/public/lyrics/`) — simpler for 21 tracks, no extra network round-trip.

## Step 4: Wire into the app (extends the earlier full-screen spec)

**Track data model** — add a `lyricsUrl` (or `lyricsSlug`) field to each track object in your song library data:
```ts
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArtUrl: string;
  audioUrl: string;
  lyricsUrl?: string; // e.g. "/lyrics/sombr-back-to-friends.lrc"
}
```

**LRC parser** (plain TypeScript, no dependency needed):
```ts
export interface LyricLine {
  time: number; // seconds
  text: string;
}

export function parseLrc(raw: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeTag = /\[(\d{1,2}):(\d{2}(?:\.\d{1,2})?)\]/g;

  for (const rawLine of raw.split("\n")) {
    const matches = [...rawLine.matchAll(timeTag)];
    if (matches.length === 0) continue;

    const text = rawLine.replace(timeTag, "").trim();
    for (const m of matches) {
      const minutes = parseInt(m[1], 10);
      const seconds = parseFloat(m[2]);
      lines.push({ time: minutes * 60 + seconds, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}
```

**Loading + caching in the Zustand store** (extends `NowPlayingUIState` from the earlier spec):
```ts
lyrics: LyricLine[];
lyricsStatus: "idle" | "loading" | "loaded" | "unavailable";

async loadLyricsForTrack(track: Track) {
  if (!track.lyricsUrl) {
    set({ lyrics: [], lyricsStatus: "unavailable" });
    return;
  }
  set({ lyricsStatus: "loading" });
  try {
    const res = await fetch(track.lyricsUrl);
    const raw = await res.text();
    const parsed = parseLrc(raw);
    set({ lyrics: parsed, lyricsStatus: parsed.length ? "loaded" : "unavailable" });
  } catch {
    set({ lyrics: [], lyricsStatus: "unavailable" });
  }
}
```
Call `loadLyricsForTrack` in the same place you already handle track-change side effects (alongside cover-art palette extraction from the earlier spec), and cache parsed results per track ID so switching back to a previously played song doesn't re-fetch.

**Fallback UI** when `lyricsStatus === "unavailable"`: show the album art centered/enlarged with no lyrics panel, or a simple "Lyrics not available for this track" message — don't leave an empty panel.

## Step 5: Active-line sync
Reuse the sync logic from the full-screen spec: derive the active line as the last entry where `line.time <= currentPlaybackTime`, re-render only on index change, auto-scroll to anchor position, and apply the bold/dim/dim visual treatment described there.
