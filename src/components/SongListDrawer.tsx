import React, { useState } from 'react';
import { Track } from '../types';
import { X, Search, Play, Volume2, Music } from 'lucide-react';
import { getUniqueFallbackCover, getBollywoodFallbackCover } from '../utils/artworkResolver';

interface SongListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  bollywoodTracks: Track[];
  activeGenre: 'english' | 'bollywood';
  onGenreSwitch: (genre: 'english' | 'bollywood') => void;
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
}

export const SongListDrawer: React.FC<SongListDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  bollywoodTracks,
  activeGenre,
  onGenreSwitch,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerGenre, setDrawerGenre] = useState<'english' | 'bollywood'>(activeGenre);

  if (!isOpen) return null;

  const activeTracks = drawerGenre === 'bollywood' ? bollywoodTracks : tracks;

  const filteredTracks = activeTracks
    .map((track, originalIndex) => ({ track, originalIndex }))
    .filter(({ track }) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        (track.featuredArtist && track.featuredArtist.toLowerCase().includes(q)) ||
        track.album.toLowerCase().includes(q)
      );
    });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTabSwitch = (genre: 'english' | 'bollywood') => {
    setDrawerGenre(genre);
    setSearchQuery('');
    onGenreSwitch(genre);
  };

  const isBollywood = drawerGenre === 'bollywood';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xl transition-all duration-300">
      <div
        className="w-full max-w-2xl max-h-[90vh] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: isBollywood
            ? 'linear-gradient(160deg, rgba(20,10,5,0.97) 0%, rgba(40,12,8,0.97) 100%)'
            : 'rgba(12,10,9,0.92)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{
            borderColor: isBollywood ? 'rgba(234,179,8,0.20)' : 'rgba(255,255,255,0.10)',
            background: isBollywood
              ? 'linear-gradient(135deg, rgba(220,38,38,0.18), rgba(234,179,8,0.14))'
              : 'rgba(28,25,23,0.40)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                background: isBollywood
                  ? 'linear-gradient(135deg, #dc2626, #eab308)'
                  : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              }}
            >
              {isBollywood ? <span className="text-lg">🪔</span> : <Music className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isBollywood ? '90s Bollywood Dance' : 'English Music Library'}
              </h2>
              <p className="text-xs text-white/50">
                {activeTracks.length} songs · {isBollywood ? 'Drop MP3s in /songs/bollywood/' : 'Original cover art'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Genre Tabs */}
        <div className="px-4 pt-3 pb-2 flex gap-2">
          <button
            id="drawer-tab-english"
            onClick={() => handleTabSwitch('english')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 ${
              !isBollywood
                ? 'bg-white/20 text-white border border-white/30 shadow-md'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>🎵</span>
            <span>English Songs ({tracks.length})</span>
          </button>
          <button
            id="drawer-tab-bollywood"
            onClick={() => handleTabSwitch('bollywood')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 border ${
              isBollywood
                ? 'text-white shadow-md border-orange-500/40'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent'
            }`}
            style={isBollywood ? { background: 'linear-gradient(135deg, #dc2626bb, #eab308bb)' } : {}}
          >
            <span>🪔</span>
            <span>90s Bollywood ({bollywoodTracks.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3 bg-transparent border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder={`Search ${isBollywood ? 'Bollywood' : 'English'} songs...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900/80 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 transition"
            />
          </div>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-sm">
              {searchQuery
                ? `No songs matched "${searchQuery}"`
                : isBollywood
                ? '🎶 Drop your 90s Bollywood MP3s into public/songs/bollywood/ to get started!'
                : 'No songs available.'}
            </div>
          ) : (
            filteredTracks.map(({ track, originalIndex }) => {
              const isActive = drawerGenre === activeGenre && originalIndex === currentTrackIndex;

              return (
                <button
                  key={track.id}
                  onClick={() => {
                    onSelectTrack(originalIndex);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 p-2.5 rounded-2xl transition text-left group ${
                    isActive
                      ? 'border shadow-md'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  style={isActive ? (isBollywood ? {
                    background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(234,179,8,0.12))',
                    borderColor: 'rgba(234,179,8,0.45)',
                  } : {
                    background: 'rgba(255,255,255,0.09)',
                    borderColor: 'rgba(245,158,11,0.40)',
                  }) : {}}
                >
                  {/* Track Number / Play Indicator */}
                  <span className="w-6 text-center text-xs font-semibold text-white/40 group-hover:text-white/80">
                    {isActive ? (
                      isPlaying ? (
                        <Volume2
                          className="w-4 h-4 mx-auto animate-pulse"
                          style={{ color: '#eab308' }}
                        />
                      ) : (
                        <Play
                          className="w-4 h-4 fill-current mx-auto"
                          style={{ color: '#eab308' }}
                        />
                      )
                    ) : (
                      originalIndex + 1
                    )}
                  </span>

                  {/* Artwork Image */}
                  <div
                    className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-white/10 flex items-center justify-center"
                    style={{
                      background: isBollywood
                        ? 'linear-gradient(135deg, #7f1d1d, #78350f)'
                        : '#1c1917',
                    }}
                  >
                    <span className="absolute text-xl z-0 select-none pointer-events-none">
                      {isBollywood ? '🪔' : ''}
                    </span>
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="relative z-10 w-full h-full object-cover transition transform group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        if (isBollywood) {
                          e.currentTarget.src = getBollywoodFallbackCover(track);
                        } else {
                          e.currentTarget.src = getUniqueFallbackCover(track);
                        }
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-amber-400 font-bold' : 'text-white group-hover:text-amber-200'
                      }`}
                    >
                      {track.title}
                      {track.version && (
                        <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          {track.version}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/60 truncate mt-0.5">
                      {track.artist}
                      {track.featuredArtist && (
                        <span className="text-white/40"> ft. {track.featuredArtist}</span>
                      )}
                    </p>
                  </div>

                  {/* Album Badge */}
                  <div className="hidden sm:block text-right pr-2">
                    <span className="text-xs text-white/40 truncate max-w-[120px] block">
                      {track.album}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="text-xs font-mono text-white/40 pl-2">
                    {formatDuration(track.duration)}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3.5 border-t text-center text-xs text-white/40"
          style={{ borderColor: isBollywood ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.10)' }}
        >
          {isBollywood
            ? '🪔 90s Bollywood Dance Hits · Add MP3s to public/songs/bollywood/'
            : 'Click any song to play instantly in 3D Cover Flow'}
        </div>
      </div>
    </div>
  );
};
