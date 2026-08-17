export interface Track {
  id: string;
  artist: string;
  featuredArtist?: string;
  title: string;
  version?: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string; // Optional local audio file path e.g. '/songs/my-song.mp3'
  badge?: string;
  accentColor: string;
  bpm: number;
  melodyType: 'pop-synth' | 'reggae-vibe' | 'rnb-groove' | 'hiphop-beat' | 'funky-bass';
  genre?: 'english' | 'bollywood'; // Music section identifier
}

export interface PlayerState {
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number; // current time in seconds
  volume: number; // 0 to 1
  isMuted: boolean;
  isAirplayActive: boolean;
  isEqOpen: boolean;
}
