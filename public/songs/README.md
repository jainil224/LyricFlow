# 🎵 Custom Audio Songs Directory

Place your custom audio files (e.g. `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`) directly inside this folder (`public/songs/`).

## How to add a new song to Cover Flow:

1. **Copy your audio file** into this directory:
   ```text
   public/songs/my-custom-song.mp3
   ```

2. **Register your track** in `src/data/tracks.ts` by adding a new item to `TRACKS`:

   ```typescript
   {
     id: 'my-custom-song',
     artist: 'Artist Name',
     title: 'Song Title',
     album: 'Album Name',
     duration: 215, // length in seconds
     coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
     audioUrl: '/songs/my-custom-song.mp3', // 👈 reference your audio file here
     accentColor: '#3b82f6',
     bpm: 120,
     melodyType: 'pop-synth',
   }
   ```

3. **Enjoy!** Your song will automatically render in the Cover Flow carousel and play when selected.
