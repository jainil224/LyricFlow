# Bollywood Songs Folder

Drop your 90s Bollywood MP3 files here!

## How to Add a Song

1. Copy your MP3 file into this folder: `public/songs/bollywood/`
2. Open `src/data/bollywoodTracks.ts`
3. Add a new entry to the `BOLLYWOOD_TRACKS` array following this pattern:

```ts
{
  id: 'your-song-id',           // Unique kebab-case ID
  artist: 'Artist Name',
  title: 'Song Title',
  album: 'Album / Film Name',
  duration: 240,                // Duration in seconds
  coverUrl: '/covers/bollywood/your-cover.jpg',  // Optional cover image
  audioUrl: '/songs/bollywood/YourSongFile.mp3', // Must match exact filename
  badge: 'T-SERIES',
  accentColor: '#f97316',       // Accent color (orange/gold tones work great)
  bpm: 128,
  melodyType: 'funky-bass',     // One of: pop-synth, reggae-vibe, rnb-groove, hiphop-beat, funky-bass
  genre: 'bollywood',
},
```

## File Naming Tips
- Use the exact filename in `audioUrl` (case-sensitive on Linux servers)
- Avoid special characters like `?`, `&`, `#` in filenames
- Spaces in filenames are fine but underscores are cleaner

## Recommended Cover Art
- Place cover images in: `public/covers/bollywood/`
- Recommended size: 500×500px or larger (square)
- Format: JPG or PNG
